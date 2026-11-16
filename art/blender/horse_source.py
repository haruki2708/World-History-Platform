"""Read the source horse: mesh, deform bones, skin weights, gaits.

The source (fdoss001, "Horse Rigged All Gaits", BlendSwap 28627, CC0) is
Tarnyloo's horse mesh (BlendSwap 17172, CC BY 3.0) on a Rigify rig of 456
bones with drivers, constraints and B-bones, four hair particle systems, a
modern saddle with stirrups and a bridle. Only the 80 deform bones move the
mesh. This module opens the file, samples the world matrix of every deform
bone through each gait at 30 frames a second (the rig's constraints and
drivers doing their work), and stores those matrices with the bare mesh and
its weights in an .npz file. Everything after that works from the .npz in an
empty scene, so nothing of the Rigify rig, the particles, the saddle or the
source's textures reaches the build.
"""

import os

import bpy
import numpy as np

from whp_common import SOURCES_DIR, log

SOURCE_BLEND = os.path.join(SOURCES_DIR, "horse-fdoss001", "Horse Rigged All Gaits.blend")
TARNYLOO_BLEND = os.path.join(SOURCES_DIR, "horse-tarnyloo", "horse01b.blend")
RIG = "horse.rig"
MESH = "horse"
SOURCE_FPS = 24
FPS = 30

# Source actions read, and the name they are stored under.
ACTIONS = {
    "walk": "horse.walk",
    "trot": "horse.trot",
    "canter": "horse.canter",
    "gallop": "horse.gallop",
    "head-shake": "horse.head.shake",
    "head-down": "horse.head.toss.down",
    "head-up": "horse.head.toss.up",
    "tail-left": "horse.tail.flick.left",
    "tail-right": "horse.tail.flick.right",
}


def _matrices(rig, names):
    """Armature-space matrices of the named pose bones, (n, 4, 4)."""
    return np.array([np.array(rig.pose.bones[n].matrix) for n in names], dtype=np.float64)


def _strip_scene(rig, horse):
    """Leave the rig and the bare horse; nothing else costs evaluation time."""
    for obj in list(bpy.data.objects):
        if obj not in (rig, horse):
            bpy.data.objects.remove(obj, do_unlink=True)
    for mod in list(horse.modifiers):
        if mod.type != "ARMATURE":
            horse.modifiers.remove(mod)
    ad = rig.animation_data
    for track in ad.nla_tracks:
        track.mute = True
    ad.use_nla = False
    # Only the basis shape: the corrective keys follow control bones the
    # game rig does not have.
    horse.show_only_shape_key = True
    horse.active_shape_key_index = 0


def _play(rig, action):
    """Make `action` the rig's only animation. Control bones it has no keys
    for go back to rest first: otherwise they keep whatever pose the
    previous action left (the head and tail actions key only those)."""
    for pb in rig.pose.bones:
        pb.location = (0.0, 0.0, 0.0)
        pb.rotation_quaternion = (1.0, 0.0, 0.0, 0.0)
        pb.rotation_euler = (0.0, 0.0, 0.0)
        pb.scale = (1.0, 1.0, 1.0)
    ad = rig.animation_data
    ad.action = action
    if hasattr(ad, "action_slot") and len(action.slots):
        ad.action_slot = action.slots[0]


def _play_none(rig):
    for pb in rig.pose.bones:
        pb.location = (0.0, 0.0, 0.0)
        pb.rotation_quaternion = (1.0, 0.0, 0.0, 0.0)
        pb.rotation_euler = (0.0, 0.0, 0.0)
        pb.scale = (1.0, 1.0, 1.0)


def _evaluated_coords(horse):
    deps = bpy.context.evaluated_depsgraph_get()
    ev = horse.evaluated_get(deps)
    mesh = ev.to_mesh()
    co = np.empty(len(mesh.vertices) * 3)
    mesh.vertices.foreach_get("co", co)
    ev.to_mesh_clear()
    return co.reshape(-1, 3)


def extract(out_path):
    """Write the .npz the build starts from. Returns its path."""
    if not os.path.isfile(SOURCE_BLEND):
        raise FileNotFoundError(f"Source file not found: {SOURCE_BLEND} (see art/README.md, horse)")
    try:
        bpy.ops.wm.open_mainfile(filepath=SOURCE_BLEND, load_ui=False, use_scripts=False)
    except RuntimeError as error:
        # The file loads, but Blender reports a broken shape key of an
        # unused object (KEKey.001) as an error and raises.
        if RIG not in bpy.data.objects:
            raise
        log(f"source opened with a warning: {str(error).strip()}")
    scene = bpy.context.scene
    rig = bpy.data.objects[RIG]
    horse = bpy.data.objects[MESH]
    _strip_scene(rig, horse)

    bones = [b for b in rig.data.bones if b.use_deform]
    names = [b.name for b in bones]
    rest = np.array([np.array(b.matrix_local) for b in bones], dtype=np.float64)
    parents = [b.parent.name if b.parent else "" for b in bones]
    lengths = np.array([b.length for b in bones], dtype=np.float64)

    mesh = horse.data
    nv = len(mesh.vertices)
    co = np.empty(nv * 3)
    if mesh.shape_keys:
        mesh.shape_keys.key_blocks[0].data.foreach_get("co", co)
    else:
        mesh.vertices.foreach_get("co", co)
    co = co.reshape(-1, 3)
    loop_start = np.empty(len(mesh.polygons), dtype=np.int32)
    loop_total = np.empty(len(mesh.polygons), dtype=np.int32)
    mesh.polygons.foreach_get("loop_start", loop_start)
    mesh.polygons.foreach_get("loop_total", loop_total)
    loop_vert = np.empty(len(mesh.loops), dtype=np.int32)
    mesh.loops.foreach_get("vertex_index", loop_vert)
    poly_mat = np.empty(len(mesh.polygons), dtype=np.int32)
    mesh.polygons.foreach_get("material_index", poly_mat)
    materials = [m.name if m else "" for m in mesh.materials]

    index = {n: i for i, n in enumerate(names)}
    group_bone = {g.index: index.get(g.name, -1) for g in horse.vertex_groups}
    weights = np.zeros((nv, len(names)), dtype=np.float32)
    for v in mesh.vertices:
        for g in v.groups:
            b = group_bone[g.group]
            if b >= 0:
                weights[v.index, b] = g.weight
    log(f"source: {nv} vertices, {len(loop_start)} faces, {len(names)} deform bones, materials {materials}")

    data = dict(
        rig_world=np.array(rig.matrix_world, dtype=np.float64),
        rest_co=co, loop_start=loop_start, loop_total=loop_total, loop_vert=loop_vert,
        poly_mat=poly_mat, materials=np.array(materials), bone_names=np.array(names),
        bone_parents=np.array(parents), bone_rest=rest, bone_length=lengths, weights=weights,
    )

    # Each action, sampled at 30 fps over its own frame range. A loop's last
    # sample is its first again, so the cycle closes; when the source's
    # length is not a whole number of 30 fps frames, the clip is retimed by
    # the nearest whole number (the loop matters more than the speed).
    check_frames = {}
    for key, action_name in ACTIONS.items():
        action = bpy.data.actions[action_name]
        start, end = (float(x) for x in action.frame_range)
        count = max(1, int(round((end - start) / SOURCE_FPS * FPS)))
        _play(rig, action)
        frames = []
        for k in range(count + 1):
            f = start + (end - start) * k / count
            whole = int(np.floor(f))
            scene.frame_set(whole, subframe=f - whole)
            frames.append(_matrices(rig, names))
        frames = np.array(frames)
        data[f"act:{key}"] = frames
        data[f"src:{key}"] = np.array([start, end])
        gap = np.abs(frames[0] - frames[-1]).max()
        log(f"action {key:10s} <- {action_name:24s} source frames {start:.0f}..{end:.0f} "
            f"({(end - start) / SOURCE_FPS:.3f} s) -> {count} frames at 30 fps; first vs last differ by {gap:.4f}")
        check_frames[key] = (start, frames)

    # Evaluated (Blender-deformed) mesh at a few frames, to measure how far
    # plain linear skinning of these matrices is from the source's B-bones.
    checks = []
    for key in ("walk", "gallop"):
        action = bpy.data.actions[ACTIONS[key]]
        _play(rig, action)
        start, frames = check_frames[key]
        k = len(frames) // 3
        end = float(action.frame_range[1])
        f = start + (end - start) * k / (len(frames) - 1)
        whole = int(np.floor(f))
        scene.frame_set(whole, subframe=f - whole)
        checks.append((key, k, _evaluated_coords(horse)))
    for key, k, coords in checks:
        data[f"check:{key}:{k}"] = coords

    # Tarnyloo's original, to confirm the mesh is the same one.
    # The rest pose as the rig evaluates it with no action at all.
    rig.animation_data.action = None
    _play_none(rig)
    scene.frame_set(0)
    data["act:rest"] = _matrices(rig, names)[None]

    data["tarnyloo_match"] = np.array(_compare_tarnyloo(co))

    np.savez_compressed(out_path, **data)
    log(f"wrote {out_path}")
    return out_path


def _compare_tarnyloo(co):
    """Vertex and face counts of Tarnyloo's file, and the largest distance
    between matching vertices after fitting scale and offset."""
    if not os.path.isfile(TARNYLOO_BLEND):
        log("Tarnyloo's file not found; mesh not compared")
        return [-1, -1, -1.0]
    with bpy.data.libraries.load(TARNYLOO_BLEND, link=False) as (src, dst):
        dst.meshes = [n for n in src.meshes if n.startswith("horse")]
    mesh = dst.meshes[0]
    other = np.empty(len(mesh.vertices) * 3)
    mesh.vertices.foreach_get("co", other)
    other = other.reshape(-1, 3)
    if len(other) != len(co):
        log(f"Tarnyloo's mesh: {len(other)} vertices, the source's {len(co)}: not the same mesh")
        return [len(other), len(mesh.polygons), -1.0]
    # Tarnyloo's mesh is Y-up in its own space (the object is turned 90
    # degrees about X); fit with a general affine map and report the residual.
    a = np.hstack([other, np.ones((len(other), 1))])
    fit, *_ = np.linalg.lstsq(a, co, rcond=None)
    residual = float(np.abs(a @ fit - co).max())
    size = float(np.ptp(co, axis=0).max())
    log(f"Tarnyloo's mesh: same vertex count; largest residual after an affine fit {residual:.5f} "
        f"(model size {size:.2f})")
    return [len(other), len(mesh.polygons), residual]
