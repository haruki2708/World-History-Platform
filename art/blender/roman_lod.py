"""Stage "lod": the game meshes LOD0, LOD1, LOD2 and their one material.

Each part of the detailed model gets a low-poly stand-in: source meshes are
copied, stripped of what is hidden under other layers and decimated; the
generated kit already has game-resolution copies (".low"). The LOD0 parts
share one UV atlas; colour and normals are baked from the detailed parts,
ambient occlusion from the LOD0 parts themselves. LOD1 and LOD2 are
decimated from the baked LOD0 parts, so they reuse its UVs and weights.
"""

import os

import bpy
import numpy as np

import whp_lod as lod
import whp_skeleton
import whp_skin
from whp_common import BUILD_DIR, delete_objects, deselect_all, join_objects, log, select_only, triangle_count

MODEL = "roman-legionary"
WORK_DIR = os.path.join(BUILD_DIR, MODEL)

LIMITS = (8000, 1500, 300)          # triangles per LOD (docs/ARCHITECTURE.md)
COLOR_SIZE = 2048
NORMAL_BAKE_SIZE = 2048             # baked large, averaged down: smoother mail
NORMAL_SIZE = 1024
AO_SIZE = 1024
AO_DISTANCE = 0.10                  # metres
AO_STRENGTH = 0.75
SAMPLES = {"NORMAL": 4, "EMIT": 4, "AO": 32}


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


PARTS = [
    Part("head", ["New_head"], ["New_head", "New_eye", "New_eye_2"], (1000, 190, 36),
         covers=["Helmet", "Helmet_cheeks", "Tunic_1", "Mail", "Mail_yoke"], reach=0.035,
         uv=1.8, extrusion=0.015, ray=0.035),
    Part("arms", ["New_arms"], ["New_arms"], (1100, 190, 44),
         covers=["Tunic_1", "Mail", "Mail_yoke"], reach=0.03),
    Part("legs", ["New_legs"], ["New_legs", "Boots"], (1300, 230, 50), extrusion=0.02, ray=0.04,
         sole=["Boots"]),
    Part("tunic", ["Tunic_1"], ["Tunic_1"], (700, 120, 24),
         covers=["Mail", "Mail_yoke", "Belt"], reach=0.03, uv=0.85),
    Part("mail", ["Mail"], ["Mail"], (1100, 205, 40), covers=["Mail_yoke", "Belt"], reach=0.02),
    Part("yoke", ["Mail_yoke"], ["Mail_yoke"], (420, 80, 0)),
    Part("belt", ["Belt"], ["Belt"], (140, 40, 0)),
    # Many loose pieces: does not decimate below ~170, so it is left out of LOD1.
    Part("scabbard", ["Scabbard"], ["Scabbard"], (220, 0, 0)),
    Part("sword", ["Sword2_1"], ["Sword2_1"], (140, 40, 10), ao_alone=True),
    Part("helmet", ["Helmet.low"], ["Helmet"], (None, 110, 24), uv=1.3, extrusion=0.008, ray=0.02),
    Part("cheeks", ["Helmet_cheeks.low"], ["Helmet_cheeks"], (None, 40, 0), uv=1.2, extrusion=0.005, ray=0.012),
    Part("crest", ["Helmet_crest.low"], ["Helmet_crest"], (None, 48, 12), uv=0.7, extrusion=0.005, ray=0.012),
    # Slot 2 of the shield is the wooden back: half the density of the face.
    Part("shield", ["Scutum.low"], ["Scutum"], (None, 100, 40), uv=lambda slot: 0.45 if slot == 2 else 1.0,
         extrusion=0.01, ray=0.025, ao_alone=True),
    Part("hook", ["Mail_hook.low"], ["Mail_hook"], (None, 0, 0), extrusion=0.008, ray=0.02),
]


def _objects(names):
    return [bpy.data.objects[n] for n in names]


def build_low_parts():
    parts = []
    for part in PARTS:
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


def bake_selected_to_active(scene, parts, kind, image, material):
    lod.set_target(material, image)
    scene.cycles.samples = SAMPLES[kind]
    for part, low in zip(PARTS, parts):
        sources = _objects(part.bake)
        changed = _hide_others(sources + [low])
        lod.bake_pass(scene, low, sources, kind, part.extrusion, part.ray)
        _restore(changed)
        log(f"baked {kind:6s} {part.name}")


def bake_ao(scene, parts, image, material):
    """AO of the low parts among themselves: body and kit together, the
    shield and the sword each on their own."""
    lod.set_target(material, image)
    scene.cycles.samples = SAMPLES["AO"]
    scene.world.light_settings.distance = AO_DISTANCE
    groups = [[low for part, low in zip(PARTS, parts) if not part.ao_alone]]
    groups += [[low] for part, low in zip(PARTS, parts) if part.ao_alone]
    for group in groups:
        changed = _hide_others(group)
        select_only(group)
        bpy.ops.object.bake(type="AO", use_selected_to_active=False, margin=3, use_clear=False)
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


def compose_textures(color_raw, normal_raw, ao_raw):
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
    color_image = lod.save_image(f"{MODEL}-color", lod.linear_to_srgb(rgb), os.path.join(WORK_DIR, f"{MODEL}-color.png"), True)

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
    normal_image = lod.save_image(f"{MODEL}-normal", encoded, os.path.join(WORK_DIR, f"{MODEL}-normal.png"), False)
    return color_image, normal_image


def _finish_lod(objs, name, limit, armature, material):
    mesh_obj = join_objects(objs, name)
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


def build():
    scene = bpy.context.scene
    armature = bpy.data.objects[whp_skeleton.RIG_NAME]
    detailed = [o for o in scene.objects if o.type == "MESH" and not o.name.endswith(".low")]
    generated_low = [o for o in scene.objects if o.type == "MESH" and o.name.endswith(".low")]
    if armature.animation_data:
        armature.animation_data.action = None
    whp_skeleton.reset_pose(armature)

    parts = build_low_parts()
    for part, low in zip(PARTS, parts):
        log(f"LOD0 {part.name}: {triangle_count(low)} triangles")
    log(f"LOD0 total: {sum(triangle_count(p) for p in parts)} triangles")
    delete_objects(generated_low)

    parts = lod.unwrap_atlas(parts)
    material = lod.bake_material()
    for low in parts:
        lod.single_material(low, material)

    lod.setup_cycles(scene, 4)
    normal_raw = lod.new_target(f"{MODEL}-normal-raw", NORMAL_BAKE_SIZE, non_color=True)
    color_raw = lod.new_target(f"{MODEL}-color-raw", COLOR_SIZE)
    ao_raw = lod.new_target(f"{MODEL}-ao-raw", AO_SIZE, non_color=True)
    bake_selected_to_active(scene, parts, "NORMAL", normal_raw, material)
    with lod.EmissionSwap(detailed):
        bake_selected_to_active(scene, parts, "EMIT", color_raw, material)
    bake_ao(scene, parts, ao_raw, material)

    color_image, normal_image = compose_textures(color_raw, normal_raw, ao_raw)
    final = lod.final_material(MODEL, color_image, normal_image)

    # LOD1 and LOD2 from the baked LOD0 parts.
    levels = [[], [], []]
    for part, low in zip(PARTS, parts):
        for level in (1, 2):
            budget = part.budget[level]
            if budget:
                copy = lod.duplicate_object(low, f"{part.name}.lod{level}")
                lod.decimate(copy, budget)
                levels[level].append(copy)
                log(f"LOD{level} {part.name}: {triangle_count(copy)} triangles")
        levels[0].append(low)
    lods = [_finish_lod(objs, f"LOD{i}", LIMITS[i], armature, final) for i, objs in enumerate(levels)]

    # Leave the detailed model in the file, out of the way.
    for obj in detailed:
        obj.hide_render = True
        obj.hide_set(True)
    for obj in lods[1:]:
        obj.hide_render = True
    for image in (normal_raw, color_raw, ao_raw):
        bpy.data.images.remove(image)
    bpy.data.materials.remove(material)
    scene.render.engine = "BLENDER_EEVEE"
    deselect_all()
    return lods
