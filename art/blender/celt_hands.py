"""Close the Celt's open hands into fists round a grip.

The Celt model's hands are open, the fingers a little spread: his sword
lies between the fingers, and the shield's handle too. Here his finger
bones are posed into fists, in his own armature from the FBX, and his
meshes take that pose as their shape: the fists are closed in the mesh, as
the Roman model's are (roman_hands), and the rig stage merges the finger
weights into the hands (MERGE_FINGERS). So the hands stay closed in every
clip without keying a finger.

The hollow of each fist is found from the curled finger bones (a circle
through the joints of each finger) and kept on the arms mesh (GRIP_POINT,
GRIP_AXIS); celt_kit puts the sword's grip and the shield's handle there.

Angles in degrees. Directions are worked out from the bones themselves
(Poser.hand_axes): "palm" is out of the palm, "across" runs from the little
finger towards the index finger.
"""

import math

import bpy
import numpy as np
from mathutils import Quaternion, Vector

from whp_anim import Poser
from whp_common import log

FINGERS = ("index", "middle", "ring", "pinky")
# Bend at the knuckle, middle and end joints of each finger: a fist round a
# grip about 3 cm thick (the sword's grip, the shield's handle).
CURL = {"index": (72.0, 90.0, 50.0), "middle": (70.0, 90.0, 50.0),
        "ring": (70.0, 90.0, 50.0), "pinky": (66.0, 80.0, 44.0)}
# Share of each finger's spread (from the middle finger's line, in the plane
# of the palm) taken out, so the fingers lie together in the fist.
CLOSE = 0.85
# The thumb: turned in front of the palm about the hand's length, swung
# about the palm's normal towards the little finger (so that it lies over
# the index and middle fingers, not by the sword's guard), then bent at its
# two outer joints towards the fingers.
THUMB_ROLL = 40.0
THUMB_SWING = 25.0
THUMB_BEND = (25.0, 35.0)
# A finger's tip lies this far beyond its last joint, as a share of the
# middle phalanx (the bones have no usable tails in the FBX).
TIP = 0.75

GRIP_POINT = "whp_grip_point_{}"        # custom properties of the arms mesh, per side
GRIP_AXIS = "whp_grip_axis_{}"


def _fit_circle(points, axis):
    """Centre and radius of the circle through `points` (n, 3) seen along
    `axis` (least squares)."""
    axis = np.asarray(axis) / np.linalg.norm(axis)
    e1 = np.cross(axis, (1.0, 0.0, 0.0))
    if np.linalg.norm(e1) < 0.1:
        e1 = np.cross(axis, (0.0, 1.0, 0.0))
    e1 /= np.linalg.norm(e1)
    e2 = np.cross(axis, e1)
    origin = points.mean(axis=0)
    x, y = (points - origin) @ e1, (points - origin) @ e2
    a = np.c_[2 * x, 2 * y, np.ones(len(x))]
    cx, cy, c = np.linalg.lstsq(a, x * x + y * y, rcond=None)[0]
    return origin + cx * e1 + cy * e2, math.sqrt(max(c + cx * cx + cy * cy, 0.0))


def _fist(p, side):
    """Pose one hand's fingers into a fist on the Poser; return the hollow's
    centre and direction (armature space) and the circle radius of each
    finger."""
    _fingers, thumb, back = p.hand_axes(side)
    palm = -back
    middle = p.direction(f"middle_01_{side}", f"middle_02_{side}")
    # One axis for every finger: across the hand. Turning about it moves a
    # finger towards the palm (axis x finger = palm).
    axis = middle.cross(palm).normalized()
    m_flat = (middle - middle.dot(palm) * palm).normalized()
    tips = {}
    for finger in FINGERS:
        bones = [f"{finger}_0{j}_{side}" for j in (1, 2, 3)]
        j2, j3 = p.head(bones[1]), p.head(bones[2])
        tips[finger] = j3 + (j3 - j2) * TIP
        d = p.direction(bones[0], bones[1])
        flat = (d - d.dot(palm) * palm).normalized()
        spread = math.atan2(flat.cross(m_flat).dot(palm), flat.dot(m_flat))
        p._about_head(bones[0], Quaternion(palm, spread * CLOSE))
        for bone, bend in zip(bones, CURL[finger]):
            p.rotate(bone, axis, bend)

    roll_axis = thumb.cross(palm).normalized()          # turns the thumb towards the palm
    p.rotate(f"thumb_01_{side}", roll_axis, THUMB_ROLL)
    # Swing towards the little finger: the sense that takes the thumb's
    # end back along the hand's width (from the index towards the little finger).
    reach = p.head(f"thumb_03_{side}") - p.head(f"thumb_01_{side}")
    sense = -1.0 if palm.cross(reach).dot(thumb) > 0 else 1.0
    p.rotate(f"thumb_01_{side}", palm, sense * THUMB_SWING)
    for j, bend in zip((2, 3), THUMB_BEND):
        bone = f"thumb_0{j}_{side}"
        seg = p.direction(f"thumb_0{j - 1}_{side}", bone)
        towards = (p.head(f"middle_02_{side}") - p.head(bone)).normalized()
        bend_axis = seg.cross(towards)
        if bend_axis.length > 1e-6:
            p.rotate(bone, bend_axis.normalized(), bend)

    centres, radii = [], []
    for finger in FINGERS:
        bones = [f"{finger}_0{j}_{side}" for j in (1, 2, 3)]
        last = bones[2]
        tip = (p.matrix[last] @ p.rest[last].inverted()) @ tips[finger]
        points = np.array([list(p.head(b)) for b in bones] + [list(tip)])
        centre, radius = _fit_circle(points, np.array(axis))
        centres.append(centre)
        radii.append(radius)
    centres = np.array(centres)
    direction = centres[0] - centres[-1]                # little finger -> index
    return centres.mean(axis=0), direction / np.linalg.norm(direction), radii


def _apply(armature, p):
    """Give the armature's pose bones the Poser's pose (rotations only)."""
    pose = armature.pose.bones
    for name in p.names:
        parent = p.parent[name]
        base = p.rest[name] if parent is None else p.matrix[parent] @ p.rest[parent].inverted() @ p.rest[name]
        basis = base.inverted() @ p.matrix[name]
        pb = pose[name]
        pb.rotation_mode = "QUATERNION"
        pb.rotation_quaternion = basis.to_quaternion()


def close(armature, meshes):
    """Close both hands of the Celt: pose his fingers, write the deformed
    shape into `meshes` (skinned to `armature` by an Armature modifier),
    put the armature back at rest. Returns, per side, the hollow of the
    fist in world space: (point, unit vector from the little finger
    towards the index)."""
    p = Poser(armature)
    grips = {}
    to_world = armature.matrix_world
    for side in ("l", "r"):
        point, direction, radii = _fist(p, side)
        grips[side] = (np.array(to_world @ Vector(point)),
                       np.array((to_world.to_3x3() @ Vector(direction)).normalized()))
        scale = to_world.to_scale()[0]
        log(f"fist {side}: finger circles {', '.join(f'{r * scale * 100:.1f}' for r in radii)} cm "
            "(radius through the joints)")
    _apply(armature, p)
    bpy.context.view_layer.update()
    deps = bpy.context.evaluated_depsgraph_get()
    shapes = {}
    for obj in meshes:
        ev = obj.evaluated_get(deps)
        mesh = ev.to_mesh()
        co = np.empty(len(mesh.vertices) * 3)
        mesh.vertices.foreach_get("co", co)
        ev.to_mesh_clear()
        if len(co) != len(obj.data.vertices) * 3:
            raise RuntimeError(f"{obj.name}: the armature changed the vertex count")
        shapes[obj] = co
    for pb in armature.pose.bones:
        pb.rotation_quaternion = (1.0, 0.0, 0.0, 0.0)
    for obj, co in shapes.items():
        obj.data.vertices.foreach_set("co", co)
        obj.data.update()
    return grips
