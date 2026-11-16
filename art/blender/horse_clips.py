"""The horse's clips: idle, walk, run and die (and trot, canter as extras).

walk, trot, canter and run (the gallop) are the source's gaits, sampled at
30 fps (horse_source). The source has no idle and no fall: idle is a
standing pose with breathing and the source's head shake and tail flicks
laid in; die is keyframed here. No clip moves the horse along the ground:
the source's gaits are in place, and die falls where it stands.

Cycle distance: while a hoof bears weight it slides back under the horse
at the speed the horse would travel; that speed times the clip's length is
the ground one cycle covers (art/README.md, "Ngựa").
"""

import math

import numpy as np
from mathutils import Matrix

import horse_rig as rig
from whp_anim import Poser, smooth
from whp_common import log

# Clip name in the file <- source gait.
GAITS = {"walk": "walk", "run": "gallop", "trot": "trot", "canter": "canter"}
IDLE_FRAMES = 150
DIE_FRAMES = 60
HOOVES = ["horse_fore_hoof_l", "horse_fore_hoof_r", "horse_hind_hoof_l", "horse_hind_hoof_r"]


def lowest(points_by_frame):
    return np.array([p[:, 2].min() for p in points_by_frame])


def skin_frames(body_co, weights, pose, rest, step=1):
    count = len(next(iter(pose.values())))
    return [rig.skin(body_co, weights, pose, rest, f) for f in range(0, count, step)]


def gait(data, frame, key, rest):
    pose = rig.source_clip(data, frame, key)
    basis = rig.to_basis(pose, rest)
    gap = max(rig._quat(b[0]).rotation_difference(rig._quat(b[-1])).angle for b in basis.values())
    if math.degrees(gap) > 0.5:
        # The source's walk does not bring the tail back to where it began.
        basis = rig.close_loop(basis, 12)
        log(f"{key}: loop closed over the last 12 frames (largest difference {math.degrees(gap):.1f} degrees)")
    return basis


def cycle_distance(pose, rest, body_co, weights, seconds):
    """Ground covered by one cycle. A hoof bears weight while it is low
    (its lowest point within 3 cm of the ground) and moving
    back under the horse; at those frames it slides back at the speed the
    horse would travel over the ground. The speed is the median over all
    four hooves' weight-bearing frames, the distance that times the cycle
    length. Returns the distance, the speed and the frames used per hoof."""
    count = len(next(iter(pose.values())))
    idx = rig.GAME_NAMES.index
    per_frame = [rig.skin(body_co, weights, pose, rest, f) for f in range(count)]
    speeds, used = [], []
    for h in HOOVES:
        near = np.nonzero(weights[:, idx(h)] > 0.5)[0]
        lo = np.array([p[near][:, 2].min() for p in per_frame])
        y = np.array([p[near][:, 1].mean() for p in per_frame])
        v = np.diff(y) * rig.FPS
        floor = max(float(lo.min()), 0.0) + 0.03          # the ground is z = 0
        low = (lo[:-1] < floor) & (lo[1:] < floor)
        bearing = low & (v > 0)
        speeds.extend(v[bearing].tolist())
        used.append(int(bearing.sum()))
    speed = float(np.median(speeds))
    return speed * seconds, speed, used


def ground_report(name, pose, rest, body_co, weights):
    lows = lowest(skin_frames(body_co, weights, pose, rest))
    log(f"{name}: lowest point {lows.min():.3f}..{lows.max():.3f} m over the clip")
    return lows


# --------------------------------------------------------------------------
# idle
# --------------------------------------------------------------------------

def idle(data, frame, rest):
    """Five seconds of standing: breathing, a shake of the head, a flick of
    the tail each way. The stance is the bind pose, all four hooves on the
    ground (the source rig with no action holds a foreleg cocked); from the
    source's head and tail actions only the neck and head, or the tail, are
    taken."""
    parts = {k: rig.to_basis(rig.source_clip(data, frame, k), rest)
             for k in ("head-shake", "tail-left", "tail-right")}
    base = {n: np.eye(4) for n in rig.GAME_NAMES}
    out = {n: np.repeat(m[None], IDLE_FRAMES, axis=0) for n, m in base.items()}
    head = [n for n in rig.GAME_NAMES if n.startswith(("horse_neck", "horse_head"))]
    tail = [n for n in rig.GAME_NAMES if n.startswith("horse_tail")]
    for key, start, bones in (("head-shake", 24, head), ("tail-left", 86, tail), ("tail-right", 118, tail)):
        clip = parts[key]
        for i in range(len(clip[bones[0]])):
            for n in bones:
                out[n][start + i] = clip[n][i]
    # Breathing: the barrel rises and falls a little, twice in the clip;
    # the two turns cancel, so the forehand and the hooves stay put.
    for f in range(IDLE_FRAMES):
        angle = 0.6 * math.sin(2 * math.pi * 2 * f / IDLE_FRAMES)
        for n, sign in (("horse_spine_2", 1.0), ("horse_spine_3", -1.0)):
            turn = np.array(Matrix.Rotation(math.radians(angle * sign), 4, "X"))
            out[n][f] = out[n][f] @ turn
    return out


# --------------------------------------------------------------------------
# die
# --------------------------------------------------------------------------

def _poser_pose(poser):
    return {n: np.array(poser.matrix[n]) for n in rig.GAME_NAMES}


def _legs(side):
    return {
        "shoulder": f"horse_shoulder_{side}", "upper": f"horse_upper_arm_{side}", "forearm": f"horse_forearm_{side}",
        "fcannon": f"horse_fore_cannon_{side}", "fpastern": f"horse_fore_pastern_{side}",
        "thigh": f"horse_thigh_{side}", "gaskin": f"horse_gaskin_{side}", "hcannon": f"horse_hind_cannon_{side}",
        "hpastern": f"horse_hind_pastern_{side}",
    }


def kneel_pose(armature):
    """Forelegs folding at the knees, the head and neck going down, the
    hindquarters starting to give."""
    p = Poser(armature)
    for side in ("l", "r"):
        leg = _legs(side)
        p.rotate(leg["upper"], "X", -25)
        p.rotate(leg["forearm"], "X", -20)
        p.rotate(leg["fcannon"], "X", 125)
        p.rotate(leg["fpastern"], "X", 40)
        p.rotate(leg["thigh"], "X", -20)
        p.rotate(leg["gaskin"], "X", 25)
        p.rotate(leg["hcannon"], "X", -25)
    for n in ("horse_neck_1", "horse_neck_2"):
        p.rotate(n, "X", 14)
    p.rotate("horse_head", "X", 12)
    p.rotate("horse_hips", "X", 24)
    return _poser_pose(p)


def lying_pose(armature):
    """Lying on the right side, legs out to the left of the body (which is
    now up the slope of the roll), neck and head bent down to the ground."""
    p = Poser(armature)
    for side, spread in (("l", 12), ("r", 9)):
        leg = _legs(side)
        p.rotate(leg["shoulder"], "Y", spread)
        p.rotate(leg["upper"], "X", -22)
        p.rotate(leg["fcannon"], "X", 28)
        p.rotate(leg["fpastern"], "X", 15)
        p.rotate(leg["thigh"], "Y", spread)
        p.rotate(leg["thigh"], "X", 18)
        p.rotate(leg["gaskin"], "X", 10)
        p.rotate(leg["hcannon"], "X", -18)
    for n in ("horse_neck_1", "horse_neck_2", "horse_neck_3", "horse_neck_4"):
        p.rotate(n, "Z", -8)
        p.rotate(n, "X", 3)
    p.rotate("horse_head", "Z", -10)
    for i in range(1, 6):
        p.rotate(f"horse_tail_{i}", "Z", 6)
    p.rotate("horse_hips", "Y", -90)
    return _poser_pose(p)


def die(armature, rest, start_basis, body_co, weights):
    """Stance -> kneeling -> rolled onto the right side, lying still from
    frame 48. Every frame is lifted or lowered so its lowest point touches
    the ground (nothing goes through it)."""
    kneel = rig.to_basis({n: m[None] for n, m in kneel_pose(armature).items()}, rest)
    lying = rig.to_basis({n: m[None] for n, m in lying_pose(armature).items()}, rest)
    kneel = {n: b[0] for n, b in kneel.items()}
    lying = {n: b[0] for n, b in lying.items()}
    keys = [(0, start_basis), (18, kneel), (48, lying), (DIE_FRAMES - 1, lying)]
    out = {n: np.zeros((DIE_FRAMES, 4, 4)) for n in rig.GAME_NAMES}
    for f in range(DIE_FRAMES):
        for (f0, a), (f1, b) in zip(keys, keys[1:]):
            if f0 <= f <= f1:
                t = smooth((f - f0) / max(f1 - f0, 1))
                mixed = rig.mix_basis(a, b, t)
                break
        for n in rig.GAME_NAMES:
            out[n][f] = mixed[n]
    # Ground contact.
    for f in range(DIE_FRAMES):
        pose = rig.from_basis({n: b[f:f + 1] for n, b in out.items()}, rest)
        low = rig.skin(body_co, weights, pose, rest, 0)[:, 2].min()
        # Lift the whole horse: the hips' location is in the hips' rest axes.
        hips_rest = rest["horse_hips"][:3, :3]
        out["horse_hips"][f][:3, 3] += hips_rest.T @ np.array([0.0, 0.0, -low])
    return out
