"""Stage "lod": the game meshes LOD0, LOD1, LOD2 and their one material.

Each part of the detailed model gets a low-poly stand-in: source meshes are
copied, stripped of what is hidden under other layers and decimated; the
generated kit already has game-resolution copies (".low"). The LOD0 parts
share one UV atlas; colour, normals and the metallicRoughness map are baked
from the detailed parts, ambient occlusion from the LOD0 parts themselves.
LOD1 is decimated from the baked LOD0 parts, so it reuses their UVs and
weights. LOD2 is a segmented stand-in laid along the skeleton (whp_proxy)
plus decimated copies of the closed kit parts, coloured from the same atlas.

What differs between models comes from the unit module (whp_build):

    PARTS   list of Part: the pieces of the game mesh and their budgets
    LOD2    dict for the LOD2 stand-in:
              own    parts that keep their own decimated copy (closed shapes:
                     shield, weapons, helmet, crest)
              body   parts sampled for the stand-in's limbs and trunk
              trunk  part whose lower edge is the bottom of the trunk
                     (the mail shirt, or the belt over a bare tunic)
              skirt  part whose lower edge is the hem of the skirt (None:
                     trousers, no skirt)
              head   part that gives the head's size
    LOOKS   optional whp_look.Looks (T-061): each man his own look; the
            parts get the attribute _LOOK, the metallicRoughness image the
            dye mask in red, the shield its designs
"""

import math
import os

import bpy
import numpy as np
from mathutils import Vector

import whp_far
import whp_lod as lod
import whp_look
import whp_proxy
import whp_skeleton
import whp_skin
from whp_common import BUILD_DIR, delete_objects, deselect_all, join_objects, log, select_only, triangle_count

COLOR_SIZE = 2048
NORMAL_BAKE_SIZE = 2048             # baked large, averaged down: smoother mail
NORMAL_SIZE = 1024
SURFACE_SIZE = 1024                 # metallicRoughness, baked at COLOR_SIZE and averaged down
AO_SIZE = 1024
ATLAS_MARGIN = 3                    # texels clear round each island at COLOR_SIZE (>= the bake margin)
AO_DISTANCE = 0.10                  # metres
AO_STRENGTH = 0.75
SAMPLES = {"NORMAL": 4, "EMIT": 4, "AO": 32}
SURFACE_DEFAULT = (1.0, 0.7, 0.0)   # unused texels: rough, not metal

# The "hi" ladder of four levels (whp_build --hi), in terms of the budgets a
# Part gives for the game ladder of three:
#   LOD0  HI_SCALE times its LOD0 budget: the figure seen close
#   LOD1  HI_MID times its LOD0 budget
#   LOD2  HI_FAR times its LOD1 budget, textured like the others
#   LOD3  the game ladder's LOD2: the stand-in of tubes, one flat colour a triangle
HI_SCALE = 3.0
HI_MID = 0.7
HI_FAR = 1.2
HI_NORMAL_SIZE = 2048


class Part:
    """One piece of the game mesh.

    low:      objects whose copy becomes the low mesh
    bake:     detailed objects baked onto it
    budget:   triangles at LOD0, LOD1, LOD2 (None: keep as is, 0: leave out)
    covers:   objects that hide parts of it; faces under them are removed
    uv:       texel density (a number, or a function of the material slot)
    extrusion, ray: bake cage distance and how far rays travel (metres)
    ao_alone: bake ambient occlusion with only this part present (things
              that move away from the body: the shield and the sword)
    sole:     objects to push the underside of the part down onto (the
              sandals: the figure then stands on their soles)
    hi:       (objects, triangles) for LOD0 of the "hi" ladder, when the
              default will not do (see hi_source)
    drop:     None, or a function(low) that deletes faces of the low copy
              that should not be drawn, before it is cut down, and returns
              how many (T-050: the inside of a rider's skirt)
    """

    def __init__(self, name, low, bake, budget, covers=(), reach=0.03, uv=1.0,
                 extrusion=0.012, ray=0.03, ao_alone=False, sole=(), hi=None, drop=None):
        self.name = name
        self.low = low
        self.bake = bake
        self.budget = budget
        self.covers = covers
        self.reach = reach
        self.uv = uv
        self.extrusion = extrusion
        self.ray = ray
        self.ao_alone = ao_alone
        self.sole = sole
        self.hi = hi
        self.drop = drop


def _objects(names):
    return [bpy.data.objects[n] for n in names]


def game_budget(part):
    """The Part's triangles at the three levels of the game ladder; where
    it keeps a generated mesh as it is (None), that mesh's count."""
    first = part.budget[0]
    if first is None:
        first = sum(triangle_count(o) for o in _objects(part.low))
    return (first, part.budget[1] or 0, part.budget[2] or 0)


def hi_source(part):
    """Objects and triangles of a Part's LOD0 in the "hi" ladder. A part
    cut down from the source mesh gets HI_SCALE times its game budget. A
    generated part has a game-resolution copy (".low") and a detailed
    one: the detailed one is cut down to HI_SCALE times the copy's count."""
    if part.hi is not None:
        return part.hi
    generated = all(name.endswith(".low") for name in part.low)
    return (part.bake if generated else part.low), int(round(game_budget(part)[0] * HI_SCALE))


def build_low_parts(specs, ground=0.0, hi=False):
    """The low copy of each Part, its hidden faces removed, its UVs
    projected, decimated to its LOD0 budget. `ground`: height of the soles
    at rest (a rider's rest pose stands above the horse's ground). `hi`:
    LOD0 of the "hi" ladder (hi_source)."""
    parts = []
    for part in specs:
        names, budget = hi_source(part) if hi else (part.low, part.budget[0])
        low = lod.low_copy(_objects(names), part.name)
        if part.covers:
            gone = lod.remove_covered(low, _objects(part.covers), part.reach)
            log(f"{part.name}: removed {gone} hidden faces")
        if part.drop is not None:
            log(f"{part.name}: removed {part.drop(low)} faces ({part.drop.__name__})")
        if part.sole:
            moved = lod.wrap_over(low, _objects(part.sole), reach=0.03,
                                  where=lambda co, no: co.z < ground + 0.05 and no.z < -0.5)
            log(f"{part.name}: {moved} vertices brought down to the soles")
        lod.triangulate(low)
        weight = part.uv if callable(part.uv) else (lambda slot, w=part.uv: w)
        lod.set_uv_weight(low, weight)
        lod.project_uvs(low)
        if budget is not None:
            lod.decimate(low, budget)
        parts.append(low)
    return parts


def _hide_others(keep):
    """Hide from rendering every mesh not in `keep`; return an undo list."""
    changed = []
    for obj in bpy.context.scene.objects:
        if obj.type == "MESH" and obj not in keep and not obj.hide_render:
            obj.hide_render = True
            changed.append(obj)
    for obj in keep:
        obj.hide_render = False
    return changed


def _restore(changed):
    for obj in changed:
        obj.hide_render = False


def bake_selected_to_active(scene, specs, parts, kind, image, material):
    lod.set_target(material, image)
    scene.cycles.samples = SAMPLES[kind]
    for part, low in zip(specs, parts):
        sources = _objects(part.bake)
        changed = _hide_others(sources + [low])
        lod.bake_pass(scene, low, sources, kind, part.extrusion, part.ray)
        _restore(changed)
        log(f"baked {kind:6s} {part.name}")


def bake_ao(scene, specs, parts, image, material, sets=None):
    """AO of the low parts among themselves: body and kit together, the
    shield and the sword each on their own. `sets`: lists of part names
    that never occlude each other (a rider and his horse stand apart at
    rest); each set is baked on its own. Default: one set."""
    lod.set_target(material, image)
    scene.cycles.samples = SAMPLES["AO"]
    scene.world.light_settings.distance = AO_DISTANCE
    sets = sets or [[part.name for part in specs]]
    groups = [[low for part, low in zip(specs, parts) if not part.ao_alone and part.name in names] for names in sets]
    groups += [[low] for part, low in zip(specs, parts) if part.ao_alone]
    for group in [g for g in groups if g]:
        changed = _hide_others(group)
        select_only(group)
        # AO is baked at half the atlas size: a one-texel margin stays clear of the next island.
        bpy.ops.object.bake(type="AO", use_selected_to_active=False, margin=1, use_clear=False)
        _restore(changed)
        log("baked AO    " + ", ".join(o.name for o in group))


def _upsample(a, factor):
    """Nearest upsample followed by a small blur: good enough for AO."""
    a = np.repeat(np.repeat(a, factor, axis=0), factor, axis=1)
    out = a.copy()
    for dy in (-1, 1):
        out += np.roll(a, dy, axis=0)
    for dx in (-1, 1):
        out += np.roll(a, dx, axis=1)
    return out / 5.0


def compose_surface(model, surface_raw, keep_red=False):
    """The metallicRoughness image: baked large, averaged down over the
    covered texels, padded, unused texels rough and not metal. Red is 1,
    or with `keep_red` the baked dye mask (T-061; 0 where unused)."""
    raw = lod.pixels_of(surface_raw)
    mask = raw[..., 3] > 0.5
    factor = COLOR_SIZE // SURFACE_SIZE
    total = lod.downsample(np.where(mask[..., None], raw[..., :3], 0.0), factor)
    count = lod.downsample(mask[..., None].astype(np.float32), factor)[..., 0]
    small = count > 0
    rgb = total / np.maximum(count, 1e-6)[..., None]
    if not keep_red:
        rgb[..., 0] = 1.0
    rgb, filled = lod.dilate(rgb, small, 8)
    rgb[~filled] = SURFACE_DEFAULT if not keep_red else (0.0, *SURFACE_DEFAULT[1:])
    if keep_red:
        red = rgb[..., 0][small]
        log(f"dye mask: {(red > 0.75).mean() * 100:.1f}% of covered texels primary, "
            f"{((red > 0.25) & (red <= 0.75)).mean() * 100:.1f}% secondary")
    metal = rgb[..., 2][small]
    log(f"surface map: {(metal > 0.5).mean() * 100:.1f}% of covered texels metal, "
        f"roughness {rgb[..., 1][small].min():.2f}..{rgb[..., 1][small].max():.2f}")
    path = os.path.join(BUILD_DIR, model, f"{model}-surface.png")
    return lod.save_image(f"{model}-surface", rgb, path, False)


def compose_textures(model, color_raw, normal_raw, ao_raw, normal_size=NORMAL_SIZE):
    """Final 8-bit images: colour x AO in sRGB, normals averaged down to `normal_size`."""
    color = lod.pixels_of(color_raw)
    mask = color[..., 3] > 0.5
    rgb = color[..., :3]
    ao = lod.pixels_of(ao_raw)
    ao_value = np.where(ao[..., 3] > 0.5, ao[..., 0], 1.0)
    ao_value = _upsample(ao_value, COLOR_SIZE // AO_SIZE)
    rgb = rgb * (1.0 - AO_STRENGTH * (1.0 - np.clip(ao_value, 0.0, 1.0)))[..., None]
    rgb, filled = lod.dilate(rgb, mask, 12)
    rgb[~filled] = rgb[mask].mean(axis=0)
    log(f"colour atlas: {mask.mean() * 100:.1f}% of texels in use")
    work = os.path.join(BUILD_DIR, model)
    color_image = lod.save_image(f"{model}-color", lod.linear_to_srgb(rgb), os.path.join(work, f"{model}-color.png"), True)

    normal = lod.pixels_of(normal_raw)
    nmask = normal[..., 3] > 0.5
    vec = np.where(nmask[..., None], normal[..., :3] * 2.0 - 1.0, 0.0)
    factor = NORMAL_BAKE_SIZE // normal_size
    vec = lod.downsample(vec, factor)
    count = lod.downsample(nmask[..., None].astype(np.float32), factor)[..., 0]
    length = np.linalg.norm(vec, axis=2, keepdims=True)
    vec = vec / np.maximum(length, 1e-6)
    small_mask = count > 0
    encoded = vec * 0.5 + 0.5
    encoded, filled = lod.dilate(encoded, small_mask, 8)
    encoded[~filled] = (0.5, 0.5, 1.0)
    normal_image = lod.save_image(f"{model}-normal", encoded, os.path.join(work, f"{model}-normal.png"), False)
    return color_image, normal_image


def build_lod2_proxy(parts, armature, color_image, spec, ground=0.0, skip=(), looks=False):
    """The segmented stand-in for LOD2 (whp_proxy), sized from the LOD0
    parts and coloured from their atlas. Each shape follows one bone.
    `ground`: height of the soles at rest. spec["feet"] False leaves out
    the hands and feet (a rider's stand-in, under a tighter budget).
    `skip`: parts left out of the colours (variant shapes, T-061); with
    `looks` each face takes the look of the part nearest to it."""
    feet = spec.get("feet", True)
    by_name = {p.name: p for p in parts}
    body = whp_proxy.Samples([by_name[n] for n in spec["body"]])
    skirt = whp_proxy.Samples([by_name[spec["skirt"]]]) if spec.get("skirt") else None
    head = whp_proxy.Samples([by_name[spec["head"]]])
    bones = armature.data.bones
    square = math.pi / 4          # four-sided tubes with a flat side down

    def joint(name):
        return Vector(bones[name].head_local)

    pb = whp_proxy.ProxyBuilder()
    for s in ("l", "r"):
        upper, lower, hand = f"upperarm_{s}", f"lowerarm_{s}", f"hand_{s}"
        pb.tube(joint(upper), joint(lower),
                body.radii_along(joint(upper), joint(lower), [upper, f"upperarm_twist_01_{s}"]),
                4, upper, extend=(0.03, 0.02), phase=square)
        pb.tube(joint(lower), joint(hand),
                body.radii_along(joint(lower), joint(hand), [lower, f"lowerarm_twist_01_{s}"]),
                4, lower, extend=(0.02, 0.0), phase=square)
        knuckles = joint(f"middle_01_{s}")
        fist_end = knuckles + (knuckles - joint(hand)) * 0.5
        if feet:
            pb.tube(joint(hand), fist_end, body.radii_along(joint(hand), fist_end, [hand], percentile=75),
                    4, hand, extend=(0.01, 0.0), caps=(False, True), cap_length=0.5, phase=square)

        thigh, calf, foot = f"thigh_{s}", f"calf_{s}", f"foot_{s}"
        pb.tube(joint(thigh), joint(calf),
                body.radii_along(joint(thigh), joint(calf), [thigh, f"thigh_twist_01_{s}"]),
                4, thigh, extend=(0.0, 0.03), phase=square)
        pb.tube(joint(calf), joint(foot),
                body.radii_along(joint(calf), joint(foot), [calf, f"calf_twist_01_{s}"]),
                4, calf, extend=(0.02, 0.03), phase=square)
        if not feet:
            continue
        # Foot: a flat-bottomed box from the heel to the toes, on the ground.
        ankle, ball = joint(foot), joint(f"ball_{s}")
        heel = Vector((ankle.x, ankle.y + 0.045, ground + 0.04))
        toe = Vector((ball.x, ball.y - 0.07, ground + 0.03))
        r = body.radii_along(heel, toe, [foot, f"ball_{s}"], percentile=70)
        heel.z, toe.z = ground + r[0] * 0.72, ground + r[1] * 0.72
        pb.tube(heel, toe, r, 4, foot, caps=(False, True), cap_length=0.4, phase=square)

    # Trunk, from the lower edge of the trunk part up to the shoulders.
    trunk = ["pelvis", "spine_01", "spine_02", "spine_03", "clavicle_l", "clavicle_r"]
    hips = trunk + ["thigh_l", "thigh_r", "thigh_twist_01_l", "thigh_twist_01_r"]
    trunk_hem = float(np.percentile([v.co.z for v in by_name[spec["trunk"]].data.vertices], 2))
    shoulder = joint("clavicle_l").z + 0.02
    rings = []
    for z, bone, sample in ((trunk_hem + 0.02, "pelvis", hips), (max(joint("pelvis").z, trunk_hem + 0.06), "pelvis", hips),
                            (joint("spine_02").z, "spine_02", trunk), (shoulder - 0.04, "spine_03", trunk)):
        rx, ry, cy = body.slice(z, sample)
        rings.append(((0.0, cy, z), rx, ry, bone))
    neck = joint("neck_01")
    pb.stack(rings, 6, top=((0.0, neck.y, shoulder + 0.02), "spine_03"))

    # Skirt: the tunic below the trunk (none over trousers).
    if skirt is not None:
        hem = float(np.percentile([v.co.z for v in by_name[spec["skirt"]].data.vertices if abs(v.co.x) < 0.3], 2))
        rx, ry, cy = skirt.slice(hem + 0.04, [b.name for b in bones], max_abs_x=0.3)
        (_x, top_y, _z), top_rx, top_ry, _bone = rings[0]
        pb.stack([((0.0, cy, hem), rx, ry, "pelvis"),
                  ((0.0, top_y, trunk_hem + 0.05), top_rx * 0.97, top_ry * 0.97, "pelvis")], 6)

    # Neck and head.
    pb.tube(neck, joint("head") + Vector((0.0, 0.0, 0.03)), (0.05, 0.048), 4, "neck_01",
            extend=(0.02, 0.0), phase=square)
    pts = head.of(["head"])
    pts = pts[pts[:, 2] > joint("head").z - 0.02]
    lo, hi = pts.min(axis=0), pts.max(axis=0)
    radii = (hi - lo) / 2 * np.array((0.93, 0.93, 1.0))
    radii[2] = max(radii[2], 0.11)
    pb.ellipsoid(Vector((lo + hi) / 2), radii, 6, 4, "head")

    proxy = pb.object("lod2-proxy")
    source = join_objects([lod.duplicate_object(p, f"{p.name}.src") for p in parts
                           if p.name not in spec["own"] and p.name not in skip], "lod2-source")
    lod.flat_colour_uvs(proxy, source, color_image)
    if looks:
        whp_look.assign_from_nearest(proxy, source)
    log(f"LOD2 proxy: {triangle_count(proxy)} triangles, one flat colour each")
    delete_objects([source])
    return proxy


# The LOD2 palette (whp_palette): a room of the atlas kept free for it
# (whp_lod.unwrap_atlas), in texels: two rows of 16 entries, PALETTE_PAD
# clear of every island, and slack to align the cells.
PALETTE_PAD = 16
PALETTE_ENTRIES = 32
PALETTE_ROOM = (16 * 32 + 2 * PALETTE_PAD + 32, 2 * 32 + 2 * PALETTE_PAD + 32)
PALETTE_ENTRIES_LOOKS = 48          # T-061: entries are kept apart by look and dye mask


def palette_room(looks=None):
    """Texels kept free in the atlas for the LOD2 palette: two rows of 16
    entries, three with looks; above them the designs (whp_look) when the
    model has any."""
    if looks is None:
        return PALETTE_ROOM
    width, height = PALETTE_ROOM[0], 3 * 32 + 2 * PALETTE_PAD + 32
    if looks.designs is not None:
        dw, dh = whp_look.design_room()
        width = max(width, dw + 2 * PALETTE_PAD + 32)
        height += dh + PALETTE_PAD
    return width, height
PALETTE_ROOM_KEY = "whp_palette_room"   # custom property of the final material: the room, texels (not exported)


def finish_far(levels, material, looks=None):
    """The game ladder's far levels, once the atlas is baked (whp_far): colour
    LOD1's islands from LOD0's, then give LOD2 its palette in cells no island
    uses. `levels`: the three lists of pieces; a LOD1 piece <part>.lod1
    takes its colours from the LOD0 part <part>. With `looks` (T-061): the
    designs go into the top of the palette's room, laid across the shield by
    its frame, and the looks' JSON is left on the scene for the export."""
    import whp_palette
    color, normal, surface = whp_palette.material_images(material)
    lod0 = {o.name: o for o in levels[0]}
    whp_far.transfer(levels[1], [lod0[o.name[:-len(".lod1")]] for o in levels[1]], color, normal, surface)
    used = whp_far.coverage(levels[0] + levels[1], COLOR_SIZE, PALETTE_PAD)
    x0, y0, x1, y1 = material[PALETTE_ROOM_KEY]
    room = np.ones_like(used)
    room[int(math.ceil(y0)) + PALETTE_PAD:int(y1) - PALETTE_PAD, int(math.ceil(x0)) + PALETTE_PAD:int(x1) - PALETTE_PAD] = False
    tiles, frame = [], None
    if looks is not None and looks.designs is not None:
        dw, dh = whp_look.design_room()
        ox, oy = int(math.ceil(x0)) + PALETTE_PAD, int(y1) - PALETTE_PAD - dh
        used[oy - PALETTE_PAD:oy + dh + PALETTE_PAD, ox - PALETTE_PAD:ox + dw + PALETTE_PAD] = True
        slot = looks.slot(looks.designs.slot)
        shield = next(o for o in levels[0] if len(o.data.vertices) and whp_look.read(o)[0][0] == slot)
        frame = whp_look.shield_frame(shield)
        width, height = frame[3][1] - frame[3][0], frame[4][1] - frame[4][0]
        pixels = lod.pixels_of(color)[..., :3].copy()
        tiles = whp_look.paint_designs(looks, pixels, (ox, oy), width, height)
        whp_far.rewrite(color, pixels)
        log(f"designs laid by the frame of {shield.name}: {width:.2f} x {height:.2f} m")
    entries = PALETTE_ENTRIES if looks is None else PALETTE_ENTRIES_LOOKS
    cells = whp_far.free_cells(used | room, whp_palette.CELL, entries)
    whp_palette.apply(levels[2], color, normal, surface, whp_palette.PaletteCells(cells, COLOR_SIZE),
                      looks=looks is not None)
    if looks is not None:
        refs = whp_look.slot_luminance(looks, levels[0], lod.pixels_of(color), lod.pixels_of(surface))
        bpy.context.scene[whp_look.EXTRAS_KEY] = looks.extras(refs, tiles, frame)


def finish_lod(objs, name, limit, armature, material):
    """Join the pieces of one level into the mesh `name`: at most `limit`
    triangles, at most four bones a vertex, the one material, no colour or
    whp_* attributes; skinned to `armature`."""
    mesh_obj = join_objects(objs, name)
    # Decimation can leave a few duplicate faces; drop them here rather than
    # let the glTF exporter do it (and warn) on its own.
    mesh_obj.data.validate()
    count = triangle_count(mesh_obj)
    if count > limit:
        log(f"WARNING {name}: {count} triangles, decimating the whole mesh to {limit}")
        lod.decimate(mesh_obj, limit)
        count = triangle_count(mesh_obj)
    names = [b.name for b in armature.data.bones]
    weights = whp_skin.prune(whp_skin.read_groups(mesh_obj, names))
    whp_skin.write_groups(mesh_obj, weights, names)
    lod.single_material(mesh_obj, material)
    for attr in [a for a in mesh_obj.data.attributes if a.name == lod.UV_WEIGHT or a.name.startswith("whp_")]:
        mesh_obj.data.attributes.remove(attr)
    # Colour attributes only mark things for the bakes (a woven border); in
    # the file, three.js would multiply them into the material.
    for attr in list(mesh_obj.data.color_attributes):
        mesh_obj.data.color_attributes.remove(attr)
    whp_skeleton.bind(mesh_obj, armature)
    log(f"{name}: {count} triangles (limit {limit}), {len(mesh_obj.vertex_groups)} bones used")
    return mesh_obj


_finish_lod = finish_lod            # the old name (horse_lod used it)


def bake_atlas(model, specs, parts, detailed, ao_sets=None, normal_size=NORMAL_SIZE, extra=None, looks=None):
    """Pack the low parts into one atlas and bake it from the detailed
    objects: normals, colour, the metallicRoughness map, ambient occlusion
    (in `ao_sets`, see bake_ao). Each spec needs `name`, `bake` (names of
    the detailed objects it bakes from), `extrusion`, `ray` and `ao_alone`.
    Returns the parts (unwrapped), the final material, its colour image
    and a function that removes the raw images and the bake material.
    `extra`: pieces packed into the same atlas but not baked (the game
    ladder's LOD1, whp_far); then the packed pieces come back fifth.
    `looks` (T-061): the dye mask is baked into red, and the room is
    larger."""
    scene = bpy.context.scene
    room = palette_room(looks) if extra is not None else None
    packed = lod.unwrap_atlas(list(parts) + list(extra or []), pixels=ATLAS_MARGIN, size=COLOR_SIZE, room=room)
    parts, extra_out = packed[:len(parts)], packed[len(parts):]
    material = lod.bake_material()
    for low in parts:
        lod.single_material(low, material)

    lod.setup_cycles(scene, 4)
    normal_raw = lod.new_target(f"{model}-normal-raw", NORMAL_BAKE_SIZE, non_color=True)
    color_raw = lod.new_target(f"{model}-color-raw", COLOR_SIZE)
    ao_raw = lod.new_target(f"{model}-ao-raw", AO_SIZE, non_color=True)
    surface_raw = lod.new_target(f"{model}-surface-raw", COLOR_SIZE, non_color=True)
    bake_selected_to_active(scene, specs, parts, "NORMAL", normal_raw, material)
    with lod.EmissionSwap(detailed):
        bake_selected_to_active(scene, specs, parts, "EMIT", color_raw, material)
    with lod.SurfaceSwap(detailed, dye=looks.dye(specs) if looks is not None else None):
        bake_selected_to_active(scene, specs, parts, "EMIT", surface_raw, material)
    bake_ao(scene, specs, parts, ao_raw, material, ao_sets)

    color_image, normal_image = compose_textures(model, color_raw, normal_raw, ao_raw, normal_size)
    surface_image = compose_surface(model, surface_raw, keep_red=looks is not None)
    final = lod.final_material(model, color_image, normal_image, surface_image=surface_image)

    def clean_up():
        """Remove the raw bake images and the bake material (call once the
        levels are built)."""
        for image in (normal_raw, color_raw, ao_raw, surface_raw):
            bpy.data.images.remove(image)
        bpy.data.materials.remove(material)

    if extra is not None:
        final[PALETTE_ROOM_KEY] = list(lod.last_room)
        return parts, final, color_image, clean_up, extra_out
    return parts, final, color_image, clean_up


def figure_levels(specs, parts, armature, color_image, spec, ground=0.0, lod1=None, looks=None):
    """The pieces of LOD0, LOD1 and LOD2 of a figure from its baked LOD0
    parts: LOD1 decimated from them (or `lod1`, made beforehand by
    whp_far.lod1_pieces), LOD2 the stand-in (build_lod2_proxy) with the
    parts in spec["own"]. Returns three lists of objects."""
    levels = [[], [], []]
    skip = looks.variant_parts if looks is not None else ()
    levels[2].append(build_lod2_proxy(parts, armature, color_image, spec, ground, skip=skip, looks=looks is not None))
    if lod1 is not None:
        levels[1] = list(lod1)
    for part, low in zip(specs, parts):
        for level in (1, 2):
            budget = part.budget[level]
            if level == 2 and part.name not in spec["own"]:
                continue
            if level == 1 and lod1 is not None:
                continue
            if budget:
                copy = lod.duplicate_object(low, f"{part.name}.lod{level}")
                lod.decimate(copy, budget)
                levels[level].append(copy)
                log(f"LOD{level} {part.name}: {triangle_count(copy)} triangles")
        levels[0].append(low)
    return levels


def figure_levels_hi(specs, parts, game, armature, color_image, spec, ground=0.0):
    """The pieces of the four levels of the "hi" ladder from the baked LOD0
    parts (see HI_SCALE). `game`: game_budget of each part. Returns four
    lists of objects."""
    levels = [[], [], [], []]
    levels[3].append(build_lod2_proxy(parts, armature, color_image, spec, ground))
    for part, low, (first, second, third) in zip(specs, parts, game):
        targets = (None, int(round(first * HI_MID)), int(round(second * HI_FAR)),
                   third if part.name in spec["own"] else 0)
        for level in (1, 2, 3):
            if targets[level]:
                copy = lod.duplicate_object(low, f"{part.name}.lod{level}")
                lod.decimate(copy, targets[level])
                levels[level].append(copy)
                log(f"LOD{level} {part.name}: {triangle_count(copy)} triangles")
        levels[0].append(low)
    return levels


def build(unit, limits):
    """`limits`: triangles of each level. Three levels: the game ladder;
    four: the "hi" ladder."""
    model = unit.MODEL
    specs = unit.PARTS
    hi = len(limits) == 4
    scene = bpy.context.scene
    armature = bpy.data.objects[whp_skeleton.RIG_NAME]
    detailed = [o for o in scene.objects if o.type == "MESH" and not o.name.endswith(".low")]
    generated_low = [o for o in scene.objects if o.type == "MESH" and o.name.endswith(".low")]
    if armature.animation_data:
        armature.animation_data.action = None
    whp_skeleton.reset_pose(armature)

    game = [game_budget(part) for part in specs]
    parts = build_low_parts(specs, hi=hi)
    for part, low in zip(specs, parts):
        log(f"LOD0 {part.name}: {triangle_count(low)} triangles")
    log(f"LOD0 total: {sum(triangle_count(p) for p in parts)} triangles")
    delete_objects(generated_low)

    # The lower levels from the baked LOD0 parts; the last from a segmented stand-in.
    if hi:
        parts, final, color_image, clean_up = bake_atlas(model, specs, parts, detailed, normal_size=HI_NORMAL_SIZE)
        levels = figure_levels_hi(specs, parts, game, armature, color_image, unit.LOD2)
    else:
        lod1 = whp_far.lod1_pieces([p.name for p in specs], parts, [p.budget[1] for p in specs])
        looks = getattr(unit, "LOOKS", None)
        if looks is not None:
            for part, low in zip(specs, parts):
                whp_look.assign(low, looks.look(part.name))
            for piece in lod1:
                whp_look.assign(piece, looks.look(piece.name[:-len(".lod1")]))
        parts, final, color_image, clean_up, lod1 = bake_atlas(model, specs, parts, detailed, extra=lod1, looks=looks)
        levels = figure_levels(specs, parts, armature, color_image, unit.LOD2, lod1=lod1, looks=looks)
        finish_far(levels, final, looks=looks)
    lods = [finish_lod(objs, f"LOD{i}", limits[i], armature, final) for i, objs in enumerate(levels)]

    # Leave the detailed model in the file, out of the way.
    for obj in detailed:
        obj.hide_render = True
        obj.hide_set(True)
    for obj in lods[1:]:
        obj.hide_render = True
    clean_up()
    scene.render.engine = "BLENDER_EEVEE"
    deselect_all()
    return lods
