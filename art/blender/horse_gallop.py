"""The horse's gallop (the run clip) rebuilt with a full stride, and the
trot's planted hooves locked (T-030).

The source's gallop ("Horse Rigged All Gaits", horse.gallop) has the right
footfalls: a right-lead transverse gallop, left hind, right hind, left fore,
right fore, then the legs gathered under the body in the air. But its hooves
sweep only 0.3-0.5 m while they are down, and slide as they do, so one loop
of 0.4 s covers about 1.1 m (2.7 m/s). A horse at the gallop goes 4-7 m a
stride, 10-15 m/s.

The new gallop keeps the source's body: the spine, neck, head and tail move
as in the source, retimed from its 12 frames to FRAMES. The legs:

- Each hoof is on the ground for STANCE frames from FOOTFALLS[leg], in the
  source's order. While down it lies flat (its rest orientation) and moves
  back under the horse at one steady speed, STRIDE metres a loop: the scene
  reads exactly that stride off the clip, and no slip.
- Each leg is the source's leg, time-warped so that its stance and its swing
  fall where the new footfalls put them, then bent at its joints to put the
  hoof where it must be (planar IK about the horse's left-right axis, `Leg`).
  On the ground that is the place above. In the air it is the source's path,
  shifted by an offset that goes smoothly from where the last stance left the
  hoof to where the next stance wants it, the way lane 1 locks a planted
  foot (whp_clips.lock_shifts); and no further from the top of the leg than
  REACH of its length.
- A hoof in the air keeps CLEAR above the ground: the scene takes any sole
  within 2 cm of the ground as planted.

`lock` keeps a source gait as it is but for its planted hooves, which it
moves (5 cm at most) so that each slides back at one steady speed (LOCKED).

`stride` measures a clip the way the scene does (plantedStride in
src/components/battle/engine/figures/model.ts, via whp_clips.planted).

Space as in horse_rig: metres, Z up, the horse faces -Y (backwards is +Y),
X to its left.
"""

import math

import numpy as np

import horse_rig as rig
import whp_clips
from whp_anim import smooth
from whp_common import log

FPS = rig.FPS
FRAMES = 13                 # one stride: 0.433 s, 2.3 strides a second
STRIDE = 5.5                # metres one loop covers: 12.7 m/s
# Frames each hoof is on the ground. Even at rest the hind leg stands near
# straight under the hip (its hoof 1.22 m from the hip, the leg 1.28 m long
# end to end), so it sweeps about half as far as the foreleg, which swings
# from the top of the shoulder blade.
STANCE = {"hind": 2, "fore": 3}
# First frame on the ground of each hoof: the source's right-lead order, the
# leading hind two frames after the trailing one, the trailing fore two after
# that, the leading fore two after that; then the legs are gathered in the
# air until the trailing hind lands again.
FOOTFALLS = {"hind_l": 0, "hind_r": 2, "fore_l": 4, "fore_r": 6}
# Metres the middle of each pair's stance lies behind the source's (see
# `gallop`): a straight foreleg reaches the ground about 0.46 m ahead of the
# top of the shoulder blade, not the 0.62 m the source's place would ask.
CENTRE_BACK = {"hind": 0.0, "fore": 0.16}
CLEAR = 0.03                # metres: the lowest point of a hoof in the air keeps this high
REACH = 0.98                # a hoof in the air stays within this share of its leg's length
IK_ROUNDS = 24
IK_STEP = 0.25              # radians: the largest turn of a joint in one round of IK
DEBUG = False

# The bones of each leg, the girdle first: each one turns about its head.
LEGS = {}
for _s in ("l", "r"):
    LEGS[f"hind_{_s}"] = (f"horse_thigh_{_s}", f"horse_gaskin_{_s}", f"horse_hind_cannon_{_s}",
                          f"horse_hind_pastern_{_s}", f"horse_hind_hoof_{_s}")
    LEGS[f"fore_{_s}"] = (f"horse_shoulder_{_s}", f"horse_upper_arm_{_s}", f"horse_forearm_{_s}",
                          f"horse_fore_cannon_{_s}", f"horse_fore_pastern_{_s}", f"horse_fore_hoof_{_s}")
# How dear it is to bend each of those joints away from the source's pose:
# the hip, the shoulder blade and the shoulder take the long sweep; the
# stifle and hock turn together; the elbow (which no gait of the source
# bends: its upper arm and forearm stay in line) and the knee of the
# foreleg stay as they are, straight under a planted hoof; the fetlock
# gives a little and the coffin joint sets the hoof flat.
COST = {"hind": (1.0, 1.6, 1.6, 2.5, 2.0),
        "fore": (1.2, 1.0, 30.0, 30.0, 2.5, 2.0)}


# --------------------------------------------------------------------------
# Small helpers
# --------------------------------------------------------------------------

def _turn_x(angle, pivot):
    """4x4: a turn of `angle` radians about the X axis through `pivot`."""
    c, s = math.cos(angle), math.sin(angle)
    m = np.eye(4)
    m[1, 1], m[1, 2], m[2, 1], m[2, 2] = c, -s, s, c
    m[:3, 3] = pivot - m[:3, :3] @ pivot
    return m


def _wrap(a):
    return (a + math.pi) % (2 * math.pi) - math.pi


def _pitch(m, rest):
    """How far a bone is turned about X from its rest direction (radians)."""
    v, r = m[:3, 1], rest[:3, 1]
    return _wrap(math.atan2(v[2], v[1]) - math.atan2(r[2], r[1]))


def sample(track, t):
    """A bone's basis matrix at fractional frame t of a loop; `track` is
    (frames + 1, 4, 4) with its last frame equal to its first."""
    frames = len(track) - 1
    t = t % frames
    i = min(int(math.floor(t)), frames - 1)
    u = t - i
    if u < 1e-9:
        return track[i].copy()
    a, b = track[i], track[i + 1]
    q = rig._quat(a).slerp(rig._quat(b), u)
    return rig._matrix(q, a[:3, 3] * (1.0 - u) + b[:3, 3] * u)


def _pose_at(basis, rest, times):
    """Armature-space matrices of one frame: each bone's basis sampled at
    times[bone] (fractional source frames), or at rest where that is None."""
    one = {n: (np.eye(4) if times[n] is None else sample(basis[n], times[n]))[None] for n in rig.GAME_NAMES}
    return {n: m[0] for n, m in rig.from_basis(one, rest).items()}


def _cyclic_runs(on):
    """Runs of True in a loop of booleans: [(first, length)], longest first."""
    n = len(on)
    if all(on) or not any(on):
        return [(0, n)] if all(on) else []
    runs = []
    for f in range(n):
        if on[f] and not on[f - 1]:
            length = 0
            while on[(f + length) % n]:
                length += 1
            runs.append((f, length))
    return sorted(runs, key=lambda r: (-r[1], r[0]))


def _warp(knots, period_new, period_src):
    """Piecewise-linear map of a loop's new frames onto its source frames
    through (new, source) knots, increasing, one loop long."""
    knots = sorted(knots)
    ext = knots + [(knots[0][0] + period_new, knots[0][1] + period_src)]

    def at(f):
        f = knots[0][0] + (f - knots[0][0]) % period_new
        for (a, sa), (b, sb) in zip(ext, ext[1:]):
            if a <= f <= b:
                return sa + (sb - sa) * (f - a) / (b - a)
        return ext[-1][1]
    return at


# --------------------------------------------------------------------------
# Hooves and legs
# --------------------------------------------------------------------------

class Hooves:
    """The vertices of each hoof (weight above 0.5 on its bone) in that
    bone's rest space, to find how low a hoof reaches in a pose; and the
    soles the scene follows (the lowest vertices of the body at rest)."""

    def __init__(self, body_co, weights, rest):
        index = rig.GAME_NAMES.index
        self.local = {}
        for leg, chain in LEGS.items():
            hoof = chain[-1]
            near = np.flatnonzero(weights[:, index(hoof)] > 0.5)
            p = np.c_[body_co[near], np.ones(len(near))]
            self.local[leg] = (np.linalg.inv(rest[hoof]) @ p.T).T
        self.body_co = body_co
        self.weights = weights
        self.soles = np.flatnonzero(body_co[:, 2] < body_co[:, 2].min() + whp_clips.SOLE_HEIGHT)

    def lowest(self, leg, hoof_matrix):
        return float((self.local[leg] @ hoof_matrix.T)[:, 2].min())


class Leg:
    """Planar IK of one leg: turns about the X axis at the head of each of
    its bones (the girdle first) to put the hoof's head at (y, z) with the
    hoof turned `pitch` from its rest direction. Each turn costs COST; each
    round takes the cheapest step that meets the target to first order (no
    joint turning more than IK_STEP), and IK_ROUNDS of them meet it."""

    def __init__(self, name, rest):
        self.name = name
        self.kind = name.split("_")[0]
        self.chain = LEGS[name]
        self.cost = np.array(COST[self.kind])
        self.rest_hoof = rest[self.chain[-1]]
        heads = [rest[b][1:3, 3] for b in self.chain]
        self.length = float(sum(np.linalg.norm(b - a) for a, b in zip(heads, heads[1:])))

    def state(self, pose):
        hoof = pose[self.chain[-1]]
        return np.array([hoof[1, 3], hoof[2, 3], _pitch(hoof, self.rest_hoof)])

    def error(self, pose, target):
        e = np.asarray(target, dtype=float) - self.state(pose)
        e[2] = _wrap(e[2])
        return e

    def within(self, pose, target, share=REACH):
        """`target` pulled towards the top of the leg until it lies within
        `share` of the leg's length from it."""
        top = pose[self.chain[0]][1:3, 3]
        d = np.asarray(target[:2], dtype=float) - top
        far = float(np.linalg.norm(d))
        out = np.array(target, dtype=float)
        if far > share * self.length:
            out[:2] = top + d * (share * self.length / far)
        return out

    def reach(self, pose, target):
        """Bend the leg in `pose` (armature-space matrices of one frame,
        changed in place) towards target (y, z, pitch). Returns the error
        left (metres, radians)."""
        inverse = np.diag(1.0 / self.cost)
        for _ in range(IK_ROUNDS):
            error = self.error(pose, target)
            if np.abs(error).max() < 1e-6:
                break
            head = pose[self.chain[-1]][:3, 3]
            jac = np.array([[-(head[2] - pose[b][2, 3]), head[1] - pose[b][1, 3], 1.0] for b in self.chain]).T
            step = inverse @ jac.T @ np.linalg.solve(jac @ inverse @ jac.T + 1e-5 * np.eye(3), error)
            step *= min(1.0, IK_STEP / max(float(np.abs(step).max()), 1e-12))
            for k, bone in enumerate(self.chain):
                turn = _turn_x(float(step[k]), pose[bone][:3, 3].copy())
                for b in self.chain[k:]:
                    pose[b] = turn @ pose[b]
        return self.error(pose, target)


def _stances(pose_frames, legs, hooves, reach=whp_clips.GROUND_REACH):
    """Per leg, the frames its hoof is down in a loop of armature-space
    poses: the longest run of frames with its lowest point within `reach`
    of the lowest point of the loop. Returns {leg: (first, length)}."""
    lows = {leg: [hooves.lowest(leg, p[legs[leg].chain[-1]]) for p in pose_frames] for leg in legs}
    ground = min(min(v) for v in lows.values())
    out = {}
    for leg, v in lows.items():
        runs = _cyclic_runs([z <= ground + reach for z in v])
        out[leg] = runs[0] if runs else (0, 0)
    return out


# --------------------------------------------------------------------------
# The gallop
# --------------------------------------------------------------------------

def gallop(source, rest, hooves, frames=FRAMES, stride=STRIDE, footfalls=None, stance=None):
    """The run clip: basis matrices {bone: (frames + 1, 4, 4)}, last frame
    equal to the first, from the source's gallop `source` (basis matrices,
    a loop: horse_clips.gait)."""
    footfalls = footfalls or FOOTFALLS
    stance = stance or STANCE
    src_frames = len(source["horse_hips"]) - 1
    legs = {name: Leg(name, rest) for name in LEGS}

    # Where each hoof of the source is down.
    src_poses = [_pose_at(source, rest, {n: f for n in rig.GAME_NAMES}) for f in range(src_frames)]
    src_stance = _stances(src_poses, legs, hooves)
    log(f"gallop: source stances (first frame, frames) {src_stance}")

    # Each leg's clock: in the air, the source's swing onto the new swing.
    # On the ground the leg starts from its rest pose, standing straight,
    # and the IK below sweeps it: the source's planted foreleg folds the
    # cannon back almost level (the fetlock sunk 70 degrees), which looks
    # broken once the hoof sweeps further.
    clocks = {}
    for leg, (first, length) in src_stance.items():
        new = footfalls[leg]
        count = stance[legs[leg].kind]
        swing = _warp([(new, first), (new + count - 1, first + length - 1)], frames, src_frames)
        clocks[leg] = (swing, {(new + k) % frames for k in range(count)})
    body_clock = src_frames / frames

    def times(f, planted=True):
        t = {n: f * body_clock for n in rig.GAME_NAMES}
        for leg, chain in LEGS.items():
            swing, down = clocks[leg]
            for b in chain:
                t[b] = None if planted and f in down else swing(f)
        return t

    poses = [_pose_at(source, rest, times(f)) for f in range(frames)]
    step = stride / frames                     # metres the ground moves back each frame

    # Where each pair of legs plants its hooves: the middle of the stance at
    # the same place under the top of the leg (the shoulder blade, the hip)
    # for both legs of the pair, halfway between the two legs' places in the
    # source (whose leading foreleg plants 0.45 m further forward than the
    # trailing one, and would stand 1.4 m from it once both sweep further),
    # less CENTRE_BACK.
    downs, seens, under = {}, {}, {}
    for leg, obj in legs.items():
        down = [(footfalls[leg] + k) % frames for k in range(stance[obj.kind])]
        seen = np.array([obj.state(poses[f]) for f in range(frames)])
        source_legs = [_pose_at(source, rest, times(f, planted=False)) for f in down]
        top = float(np.mean([p[obj.chain[0]][1, 3] for p in source_legs]))
        downs[leg], seens[leg] = down, seen
        under[leg] = (top, float(np.mean([obj.state(p)[0] for p in source_legs])) - top)
    centres = {}
    for leg, obj in legs.items():
        pair = [k for k in legs if legs[k].kind == obj.kind]
        centres[leg] = under[leg][0] + float(np.mean([under[k][1] for k in pair])) + CENTRE_BACK[obj.kind]
    log("gallop: stance centres ahead of the top of the leg (m): source "
        + ", ".join(f"{k} {-under[k][1]:.2f}" for k in legs) + "; new "
        + ", ".join(f"{k} {under[k][0] - centres[k]:.2f}" for k in legs))

    # Targets: (y, z, pitch) of each hoof's head, and its x while down.
    targets, plant_x = {}, {}
    for leg, obj in legs.items():
        hoof = LEGS[leg][-1]
        count = stance[obj.kind]
        down, seen, centre = downs[leg], seens[leg], centres[leg]
        want = {}
        for k, f in enumerate(down):
            want[f] = np.array([centre + (k - (count - 1) / 2.0) * step, rest[hoof][2, 3], 0.0])
        plant_x[leg] = float(np.mean([poses[f][hoof][0, 3] for f in down]))
        # The offset from the source's path: fixed where the hoof is down,
        # eased from one stance to the next in the air. In the air the hoof
        # turns as the source's does (it flips up as it leaves the ground).
        offset = {f: want[f] - seen[f] for f in down}
        last, first = down[-1], down[0]
        span = (first - last) % frames
        for k in range(1, span):
            f = (last + k) % frames
            u = smooth(k / span)
            offset[f] = offset[last] * (1.0 - u) + offset[first] * u
            offset[f][2] = 0.0
        for f in down:
            offset[f][2] = _wrap(offset[f][2])
        targets[leg] = [seen[f] + offset[f] for f in range(frames)]

    # Bend the legs.
    worst = 0.0
    for f, pose in enumerate(poses):
        for leg, obj in legs.items():
            hoof = LEGS[leg][-1]
            down = f in downs[leg]
            target = targets[leg][f].copy() if down else obj.within(pose, targets[leg][f])
            for _ in range(4):
                error = obj.reach(pose, target)
                if down:
                    break
                low = hooves.lowest(leg, pose[hoof])
                if low >= CLEAR - 1e-4:
                    break
                target[1] += CLEAR - low
            if down:
                worst = max(worst, float(np.abs(error[:2]).max()))
                if np.abs(error[:2]).max() > 0.002:
                    log(f"gallop: WARNING the {leg} leg falls {np.abs(error[:2]).max() * 1000:.0f} mm short "
                        f"of its hoof's place on the ground at frame {f}")
            if DEBUG:
                log(f"  f{f:2d} {leg:7s} {'down' if down else 'air '} seen {np.round(seens[leg][f], 3).tolist()} "
                    f"target {np.round(target, 3).tolist()} error {np.round(error, 3).tolist()} "
                    f"low {hooves.lowest(leg, pose[hoof]):.3f}")
            if down:
                # Exactly flat and exactly in line: the rest orientation,
                # the hoof's head where the stance puts it.
                m = rest[hoof].copy()
                m[:3, 3] = (plant_x[leg], target[0], target[1])
                pose[hoof] = m
    log(f"gallop: {frames} frames, {stride:.2f} m a loop ({stride / frames * FPS:.2f} m/s); "
        f"hooves down {dict((k, sorted(v)) for k, v in downs.items())}; "
        f"IK error on the ground at most {worst * 1000:.1f} mm")

    return rig.to_basis({n: np.array([p[n] for p in poses + poses[:1]]) for n in rig.GAME_NAMES}, rest)


# --------------------------------------------------------------------------
# Walk and trot: planted hooves locked
# --------------------------------------------------------------------------

LOCK_PASSES = 4
# The source gaits whose planted hooves are locked. The trot's hooves slide
# 7% on one diagonal and 88% for a frame where the diagonals change; locked,
# they slip 1% and its stride stays 1.82 m, the hooves moved 5 cm at most.
# The walk is left as it is: its hooves roll from heel to toe through the
# stance, so locking the lowest point leaves the rest of the sole within the
# scene's 2 cm still sliding (31%), and the stride the scene reads drops 8%.
LOCKED = ("trot",)


def _sole_track(basis, rest, hooves):
    """The scene's soles in every frame of a loop: (frames, n, 3)."""
    pose = rig.from_basis(basis, rest)
    frames = len(basis["horse_hips"]) - 1
    co, w = hooves.body_co[hooves.soles], hooves.weights[hooves.soles]
    return np.array([rig.skin(co, w, pose, rest, f) for f in range(frames)])


def lock(basis, rest, hooves, speed=None):
    """A gait of the source with its planted hooves locked: every hoof on
    the ground moves back at one steady speed (`speed` metres a frame, or
    the speed the scene reads off the clip as it is), as whp_clips locks a
    planted foot. Each frame and hoof, the lowest sole of the hoof that is
    on the ground into the next frame gives a slip; whp_clips.lock_shifts
    turns those into shifts of the hoof, fixed while it is down, eased in
    the air; the leg reaches for the shifted hoof (Leg, the hoof turned as
    in the source). Front-to-back only: the IK turns about X. Returns new
    basis matrices and the speed (metres a frame)."""
    frames = len(basis["horse_hips"]) - 1
    legs = {name: Leg(name, rest) for name in LEGS}
    index = rig.GAME_NAMES.index
    co, w = hooves.body_co[hooves.soles], hooves.weights[hooves.soles]
    own = {leg: np.flatnonzero(w[:, index(LEGS[leg][-1])] > 0.5) for leg in LEGS}
    if speed is None:
        speed = float(whp_clips.planted(_sole_track(basis, rest, hooves), co[:, 0] > 0)[0])
    source = [{n: m[0] for n, m in rig.from_basis({n: b[f:f + 1] for n, b in basis.items()}, rest).items()}
              for f in range(frames)]
    seen = {leg: np.array([obj.state(p) for p in source]) for leg, obj in legs.items()}
    shift = {leg: np.zeros(frames) for leg in LEGS}
    out = basis
    for _ in range(LOCK_PASSES):
        track = _sole_track(out, rest, hooves)
        ground = track[:, :, 2].min()
        on = track[:, :, 2] <= ground + whp_clips.GROUND_REACH
        both = on & np.roll(on, -1, axis=0)
        step = np.roll(track, -1, axis=0) - track
        for leg in LEGS:
            slips = []
            for f in range(frames):
                k = own[leg][np.argmin(track[f, own[leg], 2])]
                slips.append(np.array([0.0, step[f, k, 1] - speed]) if both[f, k] else None)
            shift[leg] = shift[leg] + np.array([s[1] for s in whp_clips.lock_shifts(slips)])
        poses = [{n: m.copy() for n, m in p.items()} for p in source]
        for f, pose in enumerate(poses):
            for leg, obj in legs.items():
                target = seen[leg][f].copy()
                target[0] += shift[leg][f]
                obj.reach(pose, target)
        out = rig.to_basis({n: np.array([p[n] for p in poses + poses[:1]]) for n in rig.GAME_NAMES}, rest)
    return out, speed


# --------------------------------------------------------------------------
# Measure as the scene does
# --------------------------------------------------------------------------

def stride(basis, rest, hooves):
    """Metres one loop covers and the worst slip of a planted hoof (share of
    the ground's speed), as the scene and art/tools/gait_check.py read them
    off a clip: whp_clips.planted on the soles of the body, left side +X."""
    pose = rig.from_basis(basis, rest)
    frames = len(basis["horse_hips"]) - 1
    co, w = hooves.body_co[hooves.soles], hooves.weights[hooves.soles]
    track = np.array([rig.skin(co, w, pose, rest, f) for f in range(frames)])
    speed, slips = whp_clips.planted(track, co[:, 0] > 0)
    return speed * frames, whp_clips.worst_slip(slips, speed)
