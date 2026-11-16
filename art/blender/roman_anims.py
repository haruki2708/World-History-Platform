"""Placeholder clips for the legionary: idle, walk, attack.

They exist to prove the rig and to give the 3D scene something to play;
the animation library proper comes in a later round. Every clip loops, is
keyed on every frame at 30 fps and has no root motion: the figure stays
over the origin and the scene moves it.

    idle    2.0 s  standing behind the shield, breathing
    walk    1.0 s  two steps on the spot; covers WALK_STRIDE metres per loop
    attack  1.2 s  from guard: draw back, thrust past the shield's edge, recover

Axes: X to the figure's left, -Y forwards, Z up. Lengths in metres.
"""

import math

from mathutils import Quaternion, Vector

from whp_anim import FPS, Poser, finish_action, lerp, new_action, smooth

WALK_STRIDE = 1.08          # metres travelled in one walk loop (two steps)

# Poses that show whether the skin deforms properly. Rotations are about
# the figure's axes: X to its left, -Y forwards, Z up.
TEST_POSES = {
    "arms-up": [("upperarm_l", "Y", -80), ("upperarm_r", "Y", 80), ("lowerarm_r", "Y", 40)],
    "step": [("thigh_l", "X", -45), ("calf_l", "X", 55), ("thigh_r", "X", 22), ("calf_r", "X", 12),
             ("upperarm_r", "X", -30), ("upperarm_l", "X", 25)],
    "bend": [("spine_01", "X", 18), ("spine_02", "X", 16), ("spine_03", "X", 14), ("neck_01", "X", -20),
             ("head", "Z", 35), ("upperarm_l", "Y", 30), ("upperarm_r", "Y", -30)],
}

KEYED = [
    "pelvis", "spine_01", "spine_02", "spine_03", "neck_01", "head",
    "upperarm_l", "lowerarm_l", "hand_l", "lowerarm_twist_01_l",
    "upperarm_r", "lowerarm_r", "hand_r", "lowerarm_twist_01_r",
    "thigh_l", "calf_l", "foot_l", "thigh_r", "calf_r", "foot_r",
]

# A stance: everything the pose function needs. Arm entries are directions
# in the figure's axes; ankles are positions.
GUARD = {
    "pelvis": (0.0, 0.0, -0.035),
    "hip_yaw": -25.0,           # left side towards the enemy
    "chest_yaw": -15.0,
    "lean": 6.0,                # forwards
    "head_yaw": 0.0,
    # Shield arm: elbow a little forwards, the board upright in front.
    "l_upper": (0.22, -0.45, -1.0),
    "l_fore": (0.05, -0.75, -0.65),
    # The shield itself: where its lower end and its face point.
    "shield_down": (0.0, -0.05, -1.0),
    "shield_out": (0.30, -1.0, 0.0),
    # Sword arm: fist at the hip, point forwards and up.
    "r_upper": (-0.18, 0.25, -1.0),
    "r_fore": (-0.05, -0.62, -0.78),
    "r_thumb": (0.0, -0.75, 0.66),
    "r_wrist": 15.0,
    "l_ankle": (0.09, -0.20, 0.0),      # height is above the ankle's rest height
    "l_pitch": 0.0,
    "l_yaw": 6.0,
    "r_ankle": (-0.13, 0.26, 0.0),
    "r_pitch": 0.0,
    "r_yaw": 35.0,
}

STAND = dict(GUARD, **{
    "pelvis": (0.0, 0.0, -0.012),
    "hip_yaw": -5.0,
    "chest_yaw": -3.0,
    "lean": 1.5,
    "l_upper": (0.30, -0.05, -1.0),
    "l_fore": (0.15, -0.40, -0.90),
    # Carried on the left, turned half outwards: it wraps the left side.
    "shield_down": (0.0, -0.04, -1.0),
    "shield_out": (0.70, -0.70, 0.0),
    "r_upper": (-0.16, 0.10, -1.0),
    "r_fore": (-0.08, -0.32, -0.95),
    "r_thumb": (0.0, -1.0, 0.3),
    "r_wrist": 8.0,
    "l_ankle": (0.115, 0.02, 0.0),
    "l_yaw": 8.0,
    "r_ankle": (-0.125, 0.13, 0.0),
    "r_yaw": 14.0,
})

WIND_UP = dict(GUARD, **{
    "pelvis": (0.0, 0.03, -0.045),
    "hip_yaw": -30.0,
    "chest_yaw": -22.0,
    "lean": 4.0,
    "l_upper": (0.22, -0.50, -1.0),
    "l_fore": (0.05, -0.78, -0.62),
    "r_upper": (-0.28, 0.60, -0.80),
    "r_fore": (-0.02, -0.78, -0.62),
    "r_thumb": (0.0, -0.62, 0.78),
    "r_wrist": 25.0,
})

THRUST = dict(GUARD, **{
    "pelvis": (0.0, -0.075, -0.06),
    "hip_yaw": -8.0,
    "chest_yaw": 18.0,
    "lean": 13.0,
    "l_upper": (0.34, -0.35, -1.0),
    "l_fore": (0.05, -0.75, -0.65),
    "shield_out": (0.40, -1.0, 0.0),
    # Straight ahead, to the right of the shield's edge.
    "r_upper": (-0.05, -0.82, -0.56),
    "r_fore": (-0.03, -0.86, -0.50),
    "r_thumb": (0.0, -0.50, 0.86),
    "r_wrist": 42.0,
    "r_ankle": (-0.13, 0.25, 0.035),
    "r_pitch": 20.0,
})


def blend_stance(a, b, t):
    return {key: lerp(a[key], b[key], t) for key in a}


def pose(poser, s):
    """Build the pose described by stance `s`."""
    p = poser
    p.reset()
    ankle_z = p.rest["foot_l"].to_translation().z
    p.move("pelvis", s["pelvis"])
    p.rotate("pelvis", "Z", s["hip_yaw"])
    for bone in ("spine_01", "spine_02", "spine_03"):
        p.rotate(bone, "Z", s["chest_yaw"] / 3)
        p.rotate(bone, "X", s["lean"] / 3)
    # The head keeps looking ahead.
    turn = s["hip_yaw"] + s["chest_yaw"]
    p.rotate("neck_01", "Z", -turn * 0.45 + s["head_yaw"] / 2)
    p.rotate("head", "Z", -turn * 0.45 + s["head_yaw"] / 2)
    p.rotate("neck_01", "X", -s["lean"] * 0.7)

    p.arm("l", s["l_upper"], s["l_fore"], "back", s["shield_out"])
    p.orient("hand_l", (p.armature["whp_shield_down"], p.armature["whp_shield_out"]),
             (s["shield_down"], s["shield_out"]))
    p.arm("r", s["r_upper"], s["r_fore"], "thumb", s["r_thumb"])
    # Bend the wrist towards the little finger: brings the point in line.
    _fingers, _thumb, back = p.hand_axes("r")
    p.rotate("hand_r", back, -s["r_wrist"])

    for side in ("l", "r"):
        x, y, z = s[f"{side}_ankle"]
        p.leg(side, (x, y, ankle_z + z), s[f"{side}_pitch"], s[f"{side}_yaw"])


def _clip(armature, name, frames, stance_at):
    action = new_action(armature, name)
    poser = Poser(armature)
    for frame in range(frames + 1):
        pose(poser, stance_at(frame % frames, frames))
        poser.key(frame, KEYED)
    finish_action(armature, action, frames)
    return action


def idle(armature):
    def stance_at(frame, frames):
        wave = math.sin(2 * math.pi * frame / frames)
        slow = math.sin(2 * math.pi * frame / frames - 0.9)
        s = dict(STAND)
        s["pelvis"] = (0.004 * slow, 0.0, STAND["pelvis"][2] - 0.003 * wave)
        s["lean"] = STAND["lean"] + 0.9 * wave
        s["chest_yaw"] = STAND["chest_yaw"] + 1.0 * slow
        s["l_fore"] = (STAND["l_fore"][0], STAND["l_fore"][1] - 0.02 * wave, STAND["l_fore"][2])
        s["r_fore"] = (STAND["r_fore"][0], STAND["r_fore"][1] + 0.025 * slow, STAND["r_fore"][2])
        s["head_yaw"] = 3.0 * slow
        return s

    return _clip(armature, "idle", 2 * FPS, stance_at)


def _foot_path(u, half):
    """Ankle of a walking foot at phase u (0 = heel strike): position along
    the walk (negative = ahead), lift above the ground, pitch (toes down +)."""
    stance = 0.6
    if u < stance:
        t = u / stance
        along = -half + 2 * half * t
        strike = max(0.0, 1.0 - u / 0.08)
        push = smooth((u - 0.42) / (stance - 0.42))
        return along, 0.012 * strike + 0.045 * push, -12.0 * strike + 26.0 * push
    t = (u - stance) / (1.0 - stance)
    along = half - 2 * half * smooth(t)
    lift = lerp(0.045, 0.012, t) + 0.055 * math.sin(math.pi * t)
    return along, lift, lerp(26.0, -12.0, smooth(t))


def walk(armature):
    half = WALK_STRIDE / 4          # a step is half a stride; the foot swings +-half a step

    def stance_at(frame, frames):
        u = frame / frames
        s = dict(STAND)
        left = _foot_path(u, half)
        right = _foot_path((u + 0.5) % 1.0, half)
        # Lowest when both feet are down (u = 0, 0.5), highest at mid-stance.
        bob = -math.cos(4 * math.pi * (u - 0.05))
        sway = math.sin(2 * math.pi * (u - 0.3 + 0.25))      # towards the standing leg
        s["pelvis"] = (0.012 * sway, -0.01, -0.034 + 0.012 * bob)
        s["hip_yaw"] = -5.0 * math.cos(2 * math.pi * u)        # the hip follows the leading leg
        s["chest_yaw"] = 9.0 * math.cos(2 * math.pi * u) - 3.0
        s["lean"] = 4.0
        s["l_ankle"] = (0.095, 0.06 + left[0], left[1])
        s["l_pitch"] = left[2]
        s["l_yaw"] = 5.0
        s["r_ankle"] = (-0.095, 0.06 + right[0], right[1])
        s["r_pitch"] = right[2]
        s["r_yaw"] = 5.0
        # The shield rides steady; the sword arm swings against the right leg.
        s["l_upper"] = (0.30, -0.08 - 0.02 * bob, -1.0)
        s["l_fore"] = (0.18, -0.58, -0.80)
        s["shield_down"] = (0.0, -0.08, -1.0)
        swing = math.cos(2 * math.pi * u)
        s["r_upper"] = (-0.16, 0.10 + 0.16 * swing, -1.0)
        s["r_fore"] = (-0.08, -0.34 + 0.10 * swing, -0.94)
        return s

    return _clip(armature, "walk", FPS, stance_at)


def attack(armature):
    # (frame, stance): held between equal neighbours, eased in between.
    keys = [(0, GUARD), (9, WIND_UP), (15, THRUST), (19, THRUST), (36, GUARD)]

    def stance_at(frame, frames):
        for (f0, a), (f1, b) in zip(keys, keys[1:]):
            if f0 <= frame <= f1:
                return blend_stance(a, b, smooth((frame - f0) / (f1 - f0)))
        return GUARD

    return _clip(armature, "attack", 36, stance_at)


def build_all(armature):
    return [idle(armature), walk(armature), attack(armature)]
