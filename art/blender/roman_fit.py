"""Fit of the Roman source model to the shared rig.

The source stands in a T pose with its own proportions; the rig stands in
an A pose with the Celt's. For every bone there is one affine matrix that
takes the part of the body around that bone from the source model's space
to the rig's (unscaled) space: move the joint, turn the limb, stretch it
along its length to the rig's bone length, and scale by BASE_SCALE.
Blending those matrices with the skin weights (whp_skin.blend) re-poses and
re-proportions the whole model in one go.
"""

import math

import numpy as np

from whp_skeleton import RIG_SCALE

# Finished model = source model x FINAL_SCALE. The source figure is 1.87 m
# from sole to crown; the finished legionary stands 1.67 m.
FINAL_SCALE = 0.89
# Source model -> the rig's own space, before RIG_SCALE.
BASE_SCALE = FINAL_SCALE / RIG_SCALE

# Joint centres of the source model: metres, T pose, Z up, facing -Y.
# Left side (x > 0); the right side is the mirror image. Read off cross
# sections of the body meshes.
JOINTS = {
    "pelvis": (0.0, 0.040, 0.955),
    "spine_01": (0.0, 0.040, 1.105),
    "spine_02": (0.0, 0.040, 1.255),
    "spine_03": (0.0, 0.040, 1.405),
    "neck_01": (0.0, 0.040, 1.555),
    "head": (0.0, 0.030, 1.635),
    "clavicle_l": (0.046, 0.001, 1.480),
    "upperarm_l": (0.185, 0.063, 1.480),
    "lowerarm_l": (0.495, 0.062, 1.487),
    "hand_l": (0.745, 0.055, 1.492),
    "thigh_l": (0.095, 0.040, 0.955),
    "calf_l": (0.090, 0.022, 0.500),
    "foot_l": (0.080, 0.030, 0.067),
}

# Bone -> the joint its limb runs to (direction and length of the segment).
SEGMENTS = {
    "pelvis": "spine_01",
    "spine_01": "spine_02",
    "spine_02": "spine_03",
    "spine_03": "neck_01",
    "neck_01": "head",
    "clavicle_l": "upperarm_l",
    "upperarm_l": "lowerarm_l",
    "lowerarm_l": "hand_l",
    "thigh_l": "calf_l",
    "calf_l": "foot_l",
}

# Bones that simply follow another bone's matrix.
FOLLOW = {
    "upperarm_twist_01_l": "upperarm_l",
    "lowerarm_twist_01_l": "lowerarm_l",
    "thigh_twist_01_l": "thigh_l",
    "calf_twist_01_l": "calf_l",
    "ball_l": "foot_l",
}
FINGERS = [f"{finger}_0{n}_l" for finger in ("thumb", "index", "middle", "ring", "pinky") for n in (1, 2, 3)]
FOLLOW.update({name: "hand_l" for name in FINGERS})


def _unit(v):
    v = np.asarray(v, dtype=np.float64)
    return v / np.linalg.norm(v)


def _mirror(p):
    return np.array((-p[0], p[1], p[2]))


def _side(name, side):
    return name[:-1] + side if name.endswith("_l") else name


def _rotation_between(a, b):
    """Smallest rotation taking unit vector a onto unit vector b."""
    a, b = _unit(a), _unit(b)
    v = np.cross(a, b)
    c = float(np.dot(a, b))
    if np.linalg.norm(v) < 1e-9:
        return np.eye(3)
    vx = np.array(((0, -v[2], v[1]), (v[2], 0, -v[0]), (-v[1], v[0], 0)))
    return np.eye(3) + vx + vx @ vx / (1.0 + c)


def _frame(forward, across):
    """Orthonormal frame: x along `forward`, y as close to `across` as it goes."""
    x = _unit(forward)
    y = _unit(across - np.dot(across, x) * x)
    return np.column_stack((x, y, np.cross(x, y)))


def _affine(linear, source_point, target_point):
    m = np.eye(4)
    m[:3, :3] = linear
    m[:3, 3] = np.asarray(target_point) - linear @ np.asarray(source_point)
    return m


def _segment(a_src, b_src, a_rig, b_rig, rotation=None):
    """Matrix for a limb from joint a to joint b, and its stretch factor."""
    d_src = b_src - a_src
    d_rig = b_rig - a_rig
    if rotation is None:
        rotation = _rotation_between(d_src, d_rig)
    stretch = np.linalg.norm(d_rig) / (BASE_SCALE * np.linalg.norm(d_src))
    d = _unit(d_src)
    along = np.eye(3) + (stretch - 1.0) * np.outer(d, d)
    return _affine(BASE_SCALE * rotation @ along, a_src, a_rig), stretch


def build(bone_names, rig_joints, report=None):
    """One 4x4 matrix per bone (source space -> rig space), as (bones, 4, 4)."""
    matrices = {}
    for side in ("l", "r"):
        def src(name):
            p = np.array(JOINTS[name], dtype=np.float64)
            return _mirror(p) if (side == "r" and name.endswith("_l")) else p

        def rig(name):
            return np.asarray(rig_joints[_side(name, side)], dtype=np.float64)

        # The hand's frame on both sides: fingers, then index-to-little-finger.
        sign = 1.0 if side == "l" else -1.0
        hand_src = _frame((sign, 0.0, 0.0), (0.0, 1.0, 0.0))
        hand_rig = _frame(rig("middle_01_l") - rig("hand_l"), rig("pinky_01_l") - rig("index_01_l"))
        hand_rotation = hand_rig @ hand_src.T
        matrices[_side("hand_l", side)] = _affine(BASE_SCALE * hand_rotation, src("hand_l"), rig("hand_l"))

        for bone, end in SEGMENTS.items():
            if side == "r" and not bone.endswith("_l"):
                continue
            rotation = None
            if bone in ("upperarm_l", "lowerarm_l"):
                # Turn the arm with the hand, so nothing twists along it.
                arm_src = _frame(src(end) - src(bone), hand_src[:, 1])
                arm_rig = _frame(rig(end) - rig(bone), hand_rig[:, 1])
                rotation = arm_rig @ arm_src.T
            m, stretch = _segment(src(bone), src(end), rig(bone), rig(end), rotation)
            matrices[_side(bone, side)] = m
            if report is not None:
                report(f"  {_side(bone, side):14s} stretch {stretch:.3f}")

        # The foot keeps its shape: turn it about the vertical to the rig's toes.
        toes = rig("ball_l") - rig("foot_l")
        yaw = math.atan2(toes[0], -toes[1])     # 0 when the toes point to -Y
        c, s = math.cos(yaw), math.sin(yaw)
        turn = np.array(((c, -s, 0.0), (s, c, 0.0), (0.0, 0.0, 1.0)))
        matrices[_side("foot_l", side)] = _affine(BASE_SCALE * turn, src("foot_l"), rig("foot_l"))

        for bone, leader in FOLLOW.items():
            matrices[_side(bone, side)] = matrices[_side(leader, side)]

    # The head keeps its shape and stays upright.
    matrices["head"] = _affine(BASE_SCALE * np.eye(3), np.array(JOINTS["head"]), rig_joints["head"])

    out = np.zeros((len(bone_names), 4, 4))
    for i, name in enumerate(bone_names):
        # The IK helper bones carry no skin.
        out[i] = matrices.get(name, np.eye(4))
    return out
