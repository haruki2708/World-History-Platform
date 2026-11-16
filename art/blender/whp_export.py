"""glTF export of a unit model, and a check of the written file.

The check reads the .glb itself (its JSON chunk) for what the contract in
docs/ARCHITECTURE.md asks: one skin, the LOD mesh names and their triangle
counts, one material, image sizes, clip names, axes and file size. It then
imports the file into an empty scene, to be sure Blender reads it back.
"""

import json
import os
import struct

import bpy
import numpy as np
from mathutils import Quaternion

from whp_common import log, reset_scene, select_only

MAX_BYTES = 4 * 1024 * 1024


def _strip_actions_to_nla(armature, clips):
    """Put every clip on its own (muted) NLA track: the exporter's ACTIONS
    mode writes each action it finds there as a separate animation."""
    ad = armature.animation_data or armature.animation_data_create()
    ad.action = None
    for track in list(ad.nla_tracks):
        ad.nla_tracks.remove(track)
    for name in clips:
        action = bpy.data.actions[name]
        track = ad.nla_tracks.new()
        track.name = name
        strip = track.strips.new(name, int(action.frame_range[0]), action)
        if hasattr(strip, "action_slot") and strip.action_slot is None and len(action.slots):
            strip.action_slot = action.slots[0]
        track.mute = True


def export_glb(path, armature, meshes, clips, jpeg_quality=88):
    _strip_actions_to_nla(armature, clips)
    for pb in armature.pose.bones:
        pb.location = (0, 0, 0)
        pb.rotation_quaternion = (1, 0, 0, 0)
        pb.scale = (1, 1, 1)
    select_only([armature, *meshes], active=armature)
    wanted = dict(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_yup=True,
        export_apply=False,              # keep the armature modifier: a skinned mesh
        export_texcoords=True,
        export_normals=True,
        export_tangents=True,
        export_materials="EXPORT",
        export_image_format="JPEG",
        export_jpeg_quality=jpeg_quality,
        export_skins=True,
        export_all_influences=False,     # at most four bones per vertex
        export_def_bones=False,          # all 67 bones: the rig is shared
        export_animations=True,
        export_animation_mode="ACTIONS",
        export_force_sampling=True,
        export_frame_step=1,
        export_optimize_animation_size=True,
        export_anim_single_armature=True,
        export_reset_pose_bones=True,
        export_morph=False,
        export_cameras=False,
        export_lights=False,
        export_extras=False,
    )
    known = set(bpy.ops.export_scene.gltf.get_rna_type().properties.keys())
    missing = sorted(k for k in wanted if k not in known)
    if missing:
        log("exporter has no option:", ", ".join(missing))
    bpy.ops.export_scene.gltf(**{k: v for k, v in wanted.items() if k in known})
    log(f"exported {path}: {os.path.getsize(path) / 1024:.0f} KB")


# --------------------------------------------------------------------------
# Check
# --------------------------------------------------------------------------

def read_glb(path):
    with open(path, "rb") as f:
        data = f.read()
    magic, _version, _length = struct.unpack("<4sII", data[:12])
    if magic != b"glTF":
        raise ValueError(f"{path} is not a GLB file")
    json_length, json_type = struct.unpack("<I4s", data[12:20])
    doc = json.loads(data[20:20 + json_length])
    offset = 20 + json_length
    binary = b""
    if offset < len(data):
        bin_length, _bin_type = struct.unpack("<I4s", data[offset:offset + 8])
        binary = data[offset + 8:offset + 8 + bin_length]
    return doc, binary, len(data)


def _accessor_count(doc, index):
    return doc["accessors"][index]["count"]


def _image_size(blob):
    """Width and height of a JPEG or PNG held in memory."""
    if blob[:8] == b"\x89PNG\r\n\x1a\n":
        return struct.unpack(">II", blob[16:24])
    i = 2
    while i < len(blob):
        if blob[i] != 0xFF:
            i += 1
            continue
        marker = blob[i + 1]
        length = struct.unpack(">H", blob[i + 2:i + 4])[0]
        if 0xC0 <= marker <= 0xCF and marker not in (0xC4, 0xC8, 0xCC):
            h, w = struct.unpack(">HH", blob[i + 5:i + 9])
            return w, h
        i += 2 + length
    return None


def _node_matrices(doc):
    """World matrices of all nodes."""
    nodes = doc["nodes"]
    parent = {}
    for i, node in enumerate(nodes):
        for child in node.get("children", []):
            parent[child] = i
    local = []
    for node in nodes:
        m = np.eye(4)
        if "matrix" in node:
            m = np.array(node["matrix"]).reshape(4, 4).T
        else:
            t = node.get("translation", [0, 0, 0])
            r = node.get("rotation", [0, 0, 0, 1])
            s = node.get("scale", [1, 1, 1])
            rot = np.array(Quaternion((r[3], r[0], r[1], r[2])).to_matrix())
            m[:3, :3] = rot @ np.diag(s)
            m[:3, 3] = t
        local.append(m)
    world = {}

    def get(i):
        if i not in world:
            world[i] = (get(parent[i]) @ local[i]) if i in parent else local[i]
        return world[i]

    return [get(i) for i in range(len(nodes))]


def check_glb(path, lods, limits, clips, bone_count, color_max=2048, normal_max=1024):
    """Check the file against the contract; return a list of problems."""
    doc, binary, size = read_glb(path)
    problems = []
    log(f"check {os.path.basename(path)}: {size / 1024:.0f} KB")
    if size > MAX_BYTES:
        problems.append(f"file is {size / 1024 / 1024:.2f} MB, over 4 MB")

    meshes = {m["name"]: m for m in doc.get("meshes", [])}
    node_names = [n.get("name") for n in doc["nodes"]]
    mesh_nodes = {doc["nodes"][i].get("name"): n for i, n in enumerate(doc["nodes"]) if "mesh" in n for n in [n]}
    log("  mesh nodes:", ", ".join(sorted(mesh_nodes)))
    for name, limit in zip(lods, limits):
        node = mesh_nodes.get(name)
        if node is None:
            problems.append(f"no mesh node named {name}")
            continue
        mesh = doc["meshes"][node["mesh"]]
        tris = sum(_accessor_count(doc, p["indices"]) // 3 for p in mesh["primitives"])
        verts = sum(_accessor_count(doc, p["attributes"]["POSITION"]) for p in mesh["primitives"])
        attrs = sorted(mesh["primitives"][0]["attributes"])
        log(f"  {name}: {tris} triangles, {verts} vertices, {len(mesh['primitives'])} primitive(s), {attrs}")
        if any(a.startswith("COLOR_") for a in attrs):
            problems.append(f"{name} has vertex colours (three.js would multiply them into the material)")
        if tris > limit:
            problems.append(f"{name} has {tris} triangles, over {limit}")
        if "skin" not in node:
            problems.append(f"{name} is not skinned")
    extra = sorted(set(mesh_nodes) - set(lods))
    if extra:
        problems.append("unexpected meshes: " + ", ".join(extra))

    skins = doc.get("skins", [])
    log(f"  skins: {len(skins)}, joints: {[len(s['joints']) for s in skins]}")
    if len(skins) != 1:
        problems.append(f"{len(skins)} skins, expected 1")
    elif len(skins[0]["joints"]) != bone_count:
        problems.append(f"skin has {len(skins[0]['joints'])} joints, expected {bone_count}")

    materials = doc.get("materials", [])
    log("  materials:", [m.get("name") for m in materials])
    if len(materials) != 1:
        problems.append(f"{len(materials)} materials, expected 1")
    for image in doc.get("images", []):
        view = doc["bufferViews"][image["bufferView"]]
        blob = binary[view.get("byteOffset", 0):view.get("byteOffset", 0) + view["byteLength"]]
        w, h = _image_size(blob) or (0, 0)
        log(f"  image {image.get('name')}: {image.get('mimeType')} {w}x{h}, {view['byteLength'] / 1024:.0f} KB")
    if materials:
        pbr = materials[0].get("pbrMetallicRoughness", {})
        for key, label, limit in (("baseColorTexture", "colour", color_max), (None, "normal", normal_max),
                                  ("metallicRoughnessTexture", "metallicRoughness", normal_max)):
            ref = pbr.get(key) if key else materials[0].get("normalTexture")
            if ref is None:
                if label == "colour":
                    problems.append("no colour texture")
                continue
            image = doc["images"][doc["textures"][ref["index"]]["source"]]
            view = doc["bufferViews"][image["bufferView"]]
            blob = binary[view.get("byteOffset", 0):view.get("byteOffset", 0) + view["byteLength"]]
            w, h = _image_size(blob) or (0, 0)
            if max(w, h) > limit:
                problems.append(f"{label} texture is {w}x{h}, over {limit}")

    names = []
    for anim in doc.get("animations", []):
        inputs = [doc["accessors"][s["input"]] for s in anim["samplers"]]
        duration = max(a["max"][0] for a in inputs)
        names.append(anim["name"])
        log(f"  animation {anim['name']}: {duration:.2f} s, {len(anim['channels'])} channels")
    for clip in clips:
        if clip not in names:
            problems.append(f"no animation named {clip}")

    # Axes: soles on y = 0, toes towards +Z, head up.
    world = _node_matrices(doc)
    index = {name: i for i, name in enumerate(node_names)}
    for name in lods[:1]:
        node = mesh_nodes.get(name)
        if node is not None:
            acc = doc["accessors"][doc["meshes"][node["mesh"]]["primitives"][0]["attributes"]["POSITION"]]
            lo, hi = acc["min"], acc["max"]
            log(f"  {name} bounds (bind pose): x {lo[0]:.3f}..{hi[0]:.3f}, y {lo[1]:.3f}..{hi[1]:.3f}, z {lo[2]:.3f}..{hi[2]:.3f}")
            if abs(lo[1]) > 0.03:
                problems.append(f"lowest point at y = {lo[1]:.3f}, expected about 0")
    if "foot_l" in index and "ball_l" in index and "head" in index:
        foot = world[index["foot_l"]][:3, 3]
        ball = world[index["ball_l"]][:3, 3]
        head = world[index["head"]][:3, 3]
        log(f"  toes go {'+' if ball[2] > foot[2] else '-'}Z, head at y = {head[1]:.2f}")
        if ball[2] <= foot[2]:
            problems.append("the figure does not face +Z")
        if head[1] < 1.3:
            problems.append("head bone below 1.3 m: Y is not up")
    return problems


# Clip, frame ("last" for the last), and the allowed range of the lowest and
# the highest point of LOD0 in that pose, metres above the ground.
GROUND_CHECKS = (
    ("idle", 0, (-0.03, 0.02), (1.5, 2.3)),         # standing on his soles
    ("walk", 0, (-0.03, 0.03), (1.5, 2.3)),
    ("die", "last", (-0.05, 0.05), (0.0, 0.75)),    # lying on the ground, nothing through it
)


def _pose_bounds(armature, mesh, clip, frame):
    """Lowest and highest point of a skinned mesh at a frame of a clip."""
    scene = bpy.context.scene
    action = bpy.data.actions[clip]
    armature.animation_data.action = action
    if hasattr(armature.animation_data, "action_slot") and len(action.slots):
        armature.animation_data.action_slot = action.slots[0]
    if frame == "last":
        frame = int(round(action.frame_range[1]))
    scene.frame_set(frame)
    deps = bpy.context.evaluated_depsgraph_get()
    ev = mesh.evaluated_get(deps)
    data = ev.to_mesh()
    co = np.empty(len(data.vertices) * 3)
    data.vertices.foreach_get("co", co)
    ev.to_mesh_clear()
    world = np.array(mesh.matrix_world)
    z = (co.reshape(-1, 3) @ world[:3, :3].T + world[:3, 3])[:, 2]
    return float(z.min()), float(z.max())


def reimport(path, lods, ground=GROUND_CHECKS):
    """Import the file into an empty scene; report what came back, and
    check a few poses against the ground (`ground`, see GROUND_CHECKS)."""
    reset_scene()
    bpy.context.scene.render.fps = 30          # the importer maps seconds to frames at this rate
    bpy.ops.import_scene.gltf(filepath=path)
    problems = []
    # The importer adds an "Icosphere" as the display shape of the bones.
    meshes = {o.name: o for o in bpy.context.scene.objects if o.type == "MESH" and o.parent is not None}
    armatures = [o for o in bpy.context.scene.objects if o.type == "ARMATURE"]
    log(f"  re-import: {len(armatures)} armature(s), {len(armatures[0].data.bones) if armatures else 0} bones, "
        f"meshes {sorted(meshes)}, actions {sorted(a.name for a in bpy.data.actions)}")
    for name in lods:
        obj = meshes.get(name)
        if obj is None:
            problems.append(f"re-import: no mesh {name}")
            continue
        obj.data.calc_loop_triangles()
        log(f"  re-import {name}: {len(obj.data.loop_triangles)} triangles, materials "
            f"{[m.name for m in obj.data.materials]}")
    lod0 = meshes.get(lods[0])
    if armatures and lod0 is not None and armatures[0].animation_data is None:
        armatures[0].animation_data_create()
    for clip, frame, (lo_min, lo_max), (hi_min, hi_max) in (ground or ()):
        if lod0 is None or not armatures or clip not in bpy.data.actions:
            continue
        lo, hi = _pose_bounds(armatures[0], lod0, clip, frame)
        log(f"  pose {clip} frame {frame}: lowest {lo:.3f} m, highest {hi:.3f} m")
        if not (lo_min <= lo <= lo_max):
            problems.append(f"{clip} frame {frame}: lowest point {lo:.3f} m, expected {lo_min}..{lo_max}")
        if not (hi_min <= hi <= hi_max):
            problems.append(f"{clip} frame {frame}: highest point {hi:.3f} m, expected {hi_min}..{hi_max}")
    return problems
