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
              skirt  part whose lower edge is the hem of the skirt
              head   part that gives the head's size
"""

import math
import os

import bpy
import numpy as np
from mathutils import Vector

import whp_lod as lod
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
    """

    def __init__(self, name, low, bake, budget, covers=(), reach=0.03, uv=1.0,
                 extrusion=0.012, ray=0.03, ao_alone=False, sole=()):
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


def _objects(names):
    return [bpy.data.objects[n] for n in names]


def build_low_parts(specs):
    parts = []
    for part in specs:
        low = lod.low_copy(_objects(part.low), part.name)
        if part.covers:
            gone = lod.remove_covered(low, _objects(part.covers), part.reach)
            log(f"{part.name}: removed {gone} hidden faces")
        if part.sole:
            moved = lod.wrap_over(low, _objects(part.sole), reach=0.03,
                                  where=lambda co, no: co.z < 0.05 and no.z < -0.5)
            log(f"{part.name}: {moved} vertices brought down to the soles")
        lod.triangulate(low)
        weight = part.uv if callable(part.uv) else (lambda slot, w=part.uv: w)
        lod.set_uv_weight(low, weight)
        lod.project_uvs(low)
        if part.budget[0] is not None:
            lod.decimate(low, part.budget[0])
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


def bake_ao(scene, specs, parts, image, material):
    """AO of the low parts among themselves: body and kit together, the
    shield and the sword each on their own."""
    lod.set_target(material, image)
    scene.cycles.samples = SAMPLES["AO"]
    scene.world.light_settings.distance = AO_DISTANCE
    groups = [[low for part, low in zip(specs, parts) if not part.ao_alone]]
    groups += [[low] for part, low in zip(specs, parts) if part.ao_alone]
    for group in groups:
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


def compose_surface(model, surface_raw):
    """The metallicRoughness image: baked large, averaged down over the
    covered texels, padded, unused texels rough and not metal."""
    raw = lod.pixels_of(surface_raw)
    mask = raw[..., 3] > 0.5
    factor = COLOR_SIZE // SURFACE_SIZE
    total = lod.downsample(np.where(mask[..., None], raw[..., :3], 0.0), factor)
    count = lod.downsample(mask[..., None].astype(np.float32), factor)[..., 0]
    small = count > 0
    rgb = total / np.maximum(count, 1e-6)[..., None]
    rgb[..., 0] = 1.0
    rgb, filled = lod.dilate(rgb, small, 8)
    rgb[~filled] = SURFACE_DEFAULT
    metal = rgb[..., 2][small]
    log(f"surface map: {(metal > 0.5).mean() * 100:.1f}% of covered texels metal, "
        f"roughness {rgb[..., 1][small].min():.2f}..{rgb[..., 1][small].max():.2f}")
    path = os.path.join(BUILD_DIR, model, f"{model}-surface.png")
    return lod.save_image(f"{model}-surface", rgb, path, False)


def compose_textures(model, color_raw, normal_raw, ao_raw):
    """Final 8-bit images: colour x AO in sRGB, normals averaged down."""
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
    factor = NORMAL_BAKE_SIZE // NORMAL_SIZE
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


def build_lod2_proxy(parts, armature, color_image, spec):
    """The segmented stand-in for LOD2 (whp_proxy), sized from the LOD0
    parts and coloured from their atlas. Each shape follows one bone."""
    by_name = {p.name: p for p in parts}
    body = whp_proxy.Samples([by_name[n] for n in spec["body"]])
    skirt = whp_proxy.Samples([by_name[spec["skirt"]]])
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
        pb.tube(joint(hand), fist_end, body.radii_along(joint(hand), fist_end, [hand], percentile=75),
                4, hand, extend=(0.01, 0.0), caps=(False, True), cap_length=0.5, phase=square)

        thigh, calf, foot = f"thigh_{s}", f"calf_{s}", f"foot_{s}"
        pb.tube(joint(thigh), joint(calf),
                body.radii_along(joint(thigh), joint(calf), [thigh, f"thigh_twist_01_{s}"]),
                4, thigh, extend=(0.0, 0.03), phase=square)
        pb.tube(joint(calf), joint(foot),
                body.radii_along(joint(calf), joint(foot), [calf, f"calf_twist_01_{s}"]),
                4, calf, extend=(0.02, 0.03), phase=square)
        # Foot: a flat-bottomed box from the heel to the toes, on the ground.
        ankle, ball = joint(foot), joint(f"ball_{s}")
        heel = Vector((ankle.x, ankle.y + 0.045, 0.04))
        toe = Vector((ball.x, ball.y - 0.07, 0.03))
        r = body.radii_along(heel, toe, [foot, f"ball_{s}"], percentile=70)
        heel.z, toe.z = r[0] * 0.72, r[1] * 0.72
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

    # Skirt: the tunic below the trunk.
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
    source = join_objects([lod.duplicate_object(p, f"{p.name}.src") for p in parts if p.name not in spec["own"]],
                          "lod2-source")
    lod.flat_colour_uvs(proxy, source, color_image)
    log(f"LOD2 proxy: {triangle_count(proxy)} triangles, one flat colour each")
    delete_objects([source])
    return proxy


def _finish_lod(objs, name, limit, armature, material):
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
    for attr in [a for a in mesh_obj.data.attributes if a.name == lod.UV_WEIGHT]:
        mesh_obj.data.attributes.remove(attr)
    whp_skeleton.bind(mesh_obj, armature)
    log(f"{name}: {count} triangles (limit {limit}), {len(mesh_obj.vertex_groups)} bones used")
    return mesh_obj


def build(unit, limits):
    model = unit.MODEL
    specs = unit.PARTS
    scene = bpy.context.scene
    armature = bpy.data.objects[whp_skeleton.RIG_NAME]
    detailed = [o for o in scene.objects if o.type == "MESH" and not o.name.endswith(".low")]
    generated_low = [o for o in scene.objects if o.type == "MESH" and o.name.endswith(".low")]
    if armature.animation_data:
        armature.animation_data.action = None
    whp_skeleton.reset_pose(armature)

    parts = build_low_parts(specs)
    for part, low in zip(specs, parts):
        log(f"LOD0 {part.name}: {triangle_count(low)} triangles")
    log(f"LOD0 total: {sum(triangle_count(p) for p in parts)} triangles")
    delete_objects(generated_low)

    parts = lod.unwrap_atlas(parts, pixels=ATLAS_MARGIN, size=COLOR_SIZE)
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
    with lod.SurfaceSwap(detailed):
        bake_selected_to_active(scene, specs, parts, "EMIT", surface_raw, material)
    bake_ao(scene, specs, parts, ao_raw, material)

    color_image, normal_image = compose_textures(model, color_raw, normal_raw, ao_raw)
    surface_image = compose_surface(model, surface_raw)
    final = lod.final_material(model, color_image, normal_image, surface_image=surface_image)

    # LOD1 from the baked LOD0 parts; LOD2 from a segmented stand-in.
    levels = [[], [], []]
    levels[2].append(build_lod2_proxy(parts, armature, color_image, unit.LOD2))
    for part, low in zip(specs, parts):
        for level in (1, 2):
            budget = part.budget[level]
            if level == 2 and part.name not in unit.LOD2["own"]:
                continue
            if budget:
                copy = lod.duplicate_object(low, f"{part.name}.lod{level}")
                lod.decimate(copy, budget)
                levels[level].append(copy)
                log(f"LOD{level} {part.name}: {triangle_count(copy)} triangles")
        levels[0].append(low)
    lods = [_finish_lod(objs, f"LOD{i}", limits[i], armature, final) for i, objs in enumerate(levels)]

    # Leave the detailed model in the file, out of the way.
    for obj in detailed:
        obj.hide_render = True
        obj.hide_set(True)
    for obj in lods[1:]:
        obj.hide_render = True
    for image in (normal_raw, color_raw, ao_raw, surface_raw):
        bpy.data.images.remove(image)
    bpy.data.materials.remove(material)
    scene.render.engine = "BLENDER_EEVEE"
    deselect_all()
    return lods
