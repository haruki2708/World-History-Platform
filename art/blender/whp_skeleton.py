"""The shared skeleton: the Unreal-style rig of the Celt model.

Every unit model is skinned to this one armature so that animation clips
are interchangeable. It is the armature of "Celt - rigged for UE4/5" by
Andywoodhead (CC BY 4.0): 67 bones, roots `pelvis`, `ik_foot_root` and
`ik_hand_root`, standing in an A pose.

Canonical form, the same for every model:
  - metres, Z up in Blender (Y up once exported), facing -Y (+Z exported);
  - the Celt's rig scaled by RIG_SCALE and lowered so its soles are at 0;
  - the armature object is called "root" and has no transform of its own.
"""

import os

import bpy
import numpy as np
from mathutils import Matrix, Quaternion, Vector

from whp_common import SOURCES_DIR, apply_transform, delete_objects, import_fbx, log, select_only

CELT_FBX = os.path.join(SOURCES_DIR, "celt-andywoodhead", "source", "unzipped", "Celt 07.fbx")

# The Celt stands 2.09 m tall; 0.8 brings the rig to a 1.67 m man.
RIG_SCALE = 0.8
# Height of the Celt's soles above the origin in his own file, metres.
CELT_SOLE_Z = 0.051

RIG_NAME = "root"
# Meshes of the Celt that carry body weights (not his shield and sword).
CELT_BODY = ("Body", "Hands", "Head", "Legs", "Belt")


class CeltSource:
    """The Celt's armature plus his skinned body as arrays, in metres, in
    his own (unscaled) space. Used as the source of skin weights."""

    def __init__(self, armature, bone_names, joints, coords, triangles, weights):
        self.armature = armature
        self.bone_names = bone_names        # list, index = column in weights
        self.joints = joints                # bone name -> head position (numpy 3)
        self.coords = coords                # (n, 3)
        self.triangles = triangles          # (m, 3) vertex indices
        self.weights = weights              # (n, bones)


def load_celt():
    """Import the Celt, keep his armature (scale applied, metres) and return
    his body as a CeltSource. His meshes are removed from the scene."""
    objs = import_fbx(CELT_FBX)
    armature = next(o for o in objs if o.type == "ARMATURE")
    meshes = [o for o in objs if o.type == "MESH"]
    bone_names = [b.name for b in armature.data.bones]
    index = {name: i for i, name in enumerate(bone_names)}

    coords, triangles, weights = [], [], []
    offset = 0
    for obj in meshes:
        if obj.name not in CELT_BODY:
            continue
        mesh = obj.data
        n = len(mesh.vertices)
        co = np.empty(n * 3)
        mesh.vertices.foreach_get("co", co)
        world = np.array(obj.matrix_world)
        co = co.reshape(-1, 3) @ world[:3, :3].T + world[:3, 3]
        mesh.calc_loop_triangles()
        tri = np.empty(len(mesh.loop_triangles) * 3, dtype=np.int64)
        mesh.loop_triangles.foreach_get("vertices", tri)
        w = np.zeros((n, len(bone_names)), dtype=np.float32)
        group_bone = {g.index: index[g.name] for g in obj.vertex_groups if g.name in index}
        for v in mesh.vertices:
            for g in v.groups:
                bone = group_bone.get(g.group)
                if bone is not None:
                    w[v.index, bone] = g.weight
        total = w.sum(axis=1, keepdims=True)
        w /= np.where(total > 0, total, 1.0)
        coords.append(co)
        triangles.append(tri.reshape(-1, 3) + offset)
        weights.append(w)
        offset += n

    delete_objects(meshes)
    armature.animation_data_clear()
    apply_transform(armature)           # the object's 0.01 scale goes into the bones
    armature.name = RIG_NAME
    armature.data.name = RIG_NAME
    joints = {b.name: np.array(b.head_local) for b in armature.data.bones}
    log(f"Celt rig: {len(bone_names)} bones, {offset} skinned vertices")
    return CeltSource(armature, bone_names, joints, np.vstack(coords), np.vstack(triangles), np.vstack(weights))


def to_canonical(armature, meshes):
    """Scale the rig and the meshes skinned to it by RIG_SCALE and put the
    soles on z = 0. Mesh data must already be in the Celt's space."""
    shift = np.array((0.0, 0.0, -CELT_SOLE_Z))
    for obj in meshes:
        mesh = obj.data
        co = np.empty(len(mesh.vertices) * 3)
        mesh.vertices.foreach_get("co", co)
        co = (co.reshape(-1, 3) + shift) * RIG_SCALE
        mesh.vertices.foreach_set("co", co.ravel())
        mesh.update()
    armature.location = Vector(shift) * RIG_SCALE
    armature.scale = (RIG_SCALE,) * 3
    apply_transform(armature)
    # The two IK roots are the ground reference: keep them at the origin.
    select_only(armature)
    bpy.ops.object.mode_set(mode="EDIT")
    for name in ("ik_foot_root", "ik_hand_root"):
        bone = armature.data.edit_bones.get(name)
        if bone is not None:
            delta = Vector((0.0, 0.0, -bone.head.z))
            bone.head += delta
            bone.tail += delta
    bpy.ops.object.mode_set(mode="OBJECT")


def bind(obj, armature):
    """Parent a mesh that already has its vertex groups to the armature."""
    obj.parent = armature
    obj.matrix_parent_inverse = Matrix.Identity(4)
    for mod in [m for m in obj.modifiers if m.type == "ARMATURE"]:
        obj.modifiers.remove(mod)
    mod = obj.modifiers.new("Armature", "ARMATURE")
    mod.object = armature
    mod.use_vertex_groups = True


# --------------------------------------------------------------------------
# Posing. Rotations are given in the armature's own axes (X to the figure's
# left, -Y forwards, Z up), about the head of the bone, so a pose reads the
# same whatever the bones' local axes are.
# --------------------------------------------------------------------------

def reset_pose(armature):
    for pb in armature.pose.bones:
        pb.rotation_mode = "QUATERNION"
        pb.location = (0.0, 0.0, 0.0)
        pb.rotation_quaternion = (1.0, 0.0, 0.0, 0.0)
        pb.scale = (1.0, 1.0, 1.0)
    bpy.context.view_layer.update()


def rotate_bone(armature, name, axis, degrees):
    """Rotate a pose bone about a world axis ("X", "Y", "Z" or a vector)
    through its head, on top of its current pose."""
    pb = armature.pose.bones[name]
    pb.rotation_mode = "QUATERNION"
    if isinstance(axis, str):
        axis = {"X": (1, 0, 0), "Y": (0, 1, 0), "Z": (0, 0, 1)}[axis]
    rotation = Quaternion(Vector(axis).normalized(), np.radians(degrees)).to_matrix().to_4x4()
    head = pb.matrix.to_translation()
    pb.matrix = Matrix.Translation(head) @ rotation @ Matrix.Translation(-head) @ pb.matrix
    bpy.context.view_layer.update()


def move_bone(armature, name, offset):
    """Translate a pose bone by a world-space offset."""
    pb = armature.pose.bones[name]
    pb.matrix = Matrix.Translation(Vector(offset)) @ pb.matrix
    bpy.context.view_layer.update()


def apply_pose(armature, pose):
    """pose: list of (bone, axis, degrees) or (bone, "MOVE", (x, y, z)),
    applied in order; list parents before their children."""
    for bone, axis, value in pose:
        if axis == "MOVE":
            move_bone(armature, bone, value)
        else:
            rotate_bone(armature, bone, axis, value)
