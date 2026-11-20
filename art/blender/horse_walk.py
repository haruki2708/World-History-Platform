"""The horse's walk rebuilt so that its planted hooves neither slide nor
sink (T-058).

The source's walk ("Horse Rigged All Gaits", horse.walk: 50 frames at
30 fps) is a sound four-beat walk through the middle of each stance: every
hoof lies flat on the ground for 26 frames and goes back under the horse at
one steady speed (2.4 cm a frame, 1.20 m a loop), and at least two hooves
are always down. Its faults are at the two ends of each stance:

- it comes down toe first and turns flat while it still moves forward, the
  toe dug in up to 2 cm;
- it lifts by turning about the top of the hoof, so the toe digs in (3.2 cm
  for the forefeet) and slides forward.

The scene, which takes any sole within 2 cm of the ground as planted, read
a planted hoof slipping 102% and a stride of 0.99 m (1.08 m on the models'
LOD0).

`walk` keeps the source's body (spine, neck, head and tail: the nod of the
head goes with the steps) and its legs while each hoof lies flat. Around
each stance:

- Breakover: after the stance the hoof turns over the front edge of its
  sole as the source's hoof turns, until the source's has turned ROLL_TO;
  that edge stays on the ground and goes back with it.
- Set down: in the SET_DOWN frames before the stance the hoof lies flat and
  goes back with the ground, coming down to it from SET_HEIGHT.
- In the air between, the source's path shifted by an offset eased from
  where the breakover leaves the hoof to where the set-down takes it (its
  pitch too, so the hoof is flat by the time it comes down), as
  horse_gallop.gallop does; its lowest point no lower than
  horse_gallop.CLEAR, since the scene takes a sole within 2 cm of the ground
  as planted.

In the stance and the two phases on either side of it the hoof is placed
exactly; each leg reaches for it by horse_gallop.Leg (planar IK about the
horse's left-right axis). The ground goes back at the source's own speed,
so the scene reads 1.20 m a loop (0.72 m/s at the model's size).

Space as in horse_rig: metres, Z up, the horse faces -Y (backwards is +Y),
X to its left.
"""

import math

import numpy as np

import horse_gallop as g
import horse_rig as rig
from whp_anim import smooth
from whp_common import log

FLAT_PITCH = math.radians(2.0)  # a hoof turned less than this from its rest direction lies flat
FLAT_HEIGHT = 0.002             # metres: ... with its head this close to its rest height
TOE_BAND = 0.005                # metres: the front edge of a sole, within this of its lowest point
# Breakover until the source's hoof has turned this far: a hind hoof rolls one
# frame (31 degrees), a fore two (12, 33). Rolled on to 56 degrees, the front
# of the sole on LOD0 (about 3 mm ahead of the detailed mesh's, which the
# hoof turns about) slid 2.5% of the ground's speed in that last frame.
ROLL_TO = math.radians(45.0)
SET_DOWN = 3                    # frames before each stance in which the hoof comes down flat
SET_HEIGHT = 0.03               # metres: the lowest point of the hoof as it starts down
ROLL_RIGID = True               # the pastern keeps its rest angle to the hoof in the breakover too
DEBUG = False


def _toe(hooves, leg, rest):
    """The front edge of the hoof's sole at rest, (y, z) in armature space:
    the foremost of its vertices within TOE_BAND of its lowest."""
    co = (hooves.local[leg] @ rest[g.LEGS[leg][-1]].T)[:, :3]
    base = co[co[:, 2] <= co[:, 2].min() + TOE_BAND]
    toe = base[np.argmin(base[:, 1])]
    return float(toe[1]), float(toe[2])


def _state(m, rest_hoof):
    return np.array([m[1, 3], m[2, 3], g._pitch(m, rest_hoof)])


class _Upper(g.Leg):
    """The leg down to the pastern, for planar IK that places the pastern:
    while a hoof is placed, its pastern keeps its rest angle to it. A good
    share of the hoof's lowest vertices hang partly from the pastern (up to
    37% of their weight); were the pastern to turn on the hoof as the leg
    sweeps, they would slide on the ground (up to 6% of the ground's speed)."""

    def __init__(self, name, rest):
        super().__init__(name, rest)
        self.chain = self.chain[:-1]
        self.cost = self.cost[:-1]
        self.rest_hoof = rest[self.chain[-1]]


def walk(source, rest, hooves):
    """The walk clip: basis matrices {bone: (frames + 1, 4, 4)}, last frame
    equal to the first, from the source's walk `source` (basis matrices, a
    loop: horse_clips.gait)."""
    frames = len(source["horse_hips"]) - 1
    legs = {name: g.Leg(name, rest) for name in g.LEGS}
    poses = [g._pose_at(source, rest, {n: f for n in rig.GAME_NAMES}) for f in range(frames)]
    seen = {leg: np.array([obj.state(p) for p in poses]) for leg, obj in legs.items()}

    # Where each hoof of the source lies flat, and how fast the ground goes
    # back under it there.
    stance, steps = {}, []
    for leg in legs:
        hoof = g.LEGS[leg][-1]
        s = seen[leg]
        flat = [abs(s[f, 2]) < FLAT_PITCH and abs(s[f, 1] - rest[hoof][2, 3]) < FLAT_HEIGHT for f in range(frames)]
        runs = g._cyclic_runs(flat)
        if not runs:
            raise RuntimeError(f"walk: the {leg} hoof never lies flat in the source")
        stance[leg] = runs[0]
        first, length = runs[0]
        steps += [s[(first + k + 1) % frames, 0] - s[(first + k) % frames, 0] for k in range(length - 1)]
    step = float(np.median(steps))
    log(f"walk: source stances (first frame, frames) {stance}; the ground goes back {step * 1000:.1f} mm a frame "
        f"({step * frames:.3f} m a loop)")

    # Each leg's plan: per frame, the exact place of the hoof (stance,
    # breakover, set-down) or the target it reaches for (in the air).
    exact = {leg: {} for leg in legs}
    aims = {leg: {} for leg in legs}
    phases = {leg: {} for leg in legs}
    for leg, obj in legs.items():
        hoof = g.LEGS[leg][-1]
        first, length = stance[leg]
        last = first + length - 1
        s = seen[leg]
        head_y, head_z = rest[hoof][1, 3], rest[hoof][2, 3]
        toe_y, toe_z = _toe(hooves, leg, rest)
        x = float(np.mean([poses[(first + k) % frames][hoof][0, 3] for k in range(length)]))
        y0 = float(s[first, 0])

        def flat(k, lift=0.0):
            """The hoof flat, k frames after the stance's first (k may be
            negative), lifted `lift` metres."""
            m = rest[hoof].copy()
            m[:3, 3] = (x, y0 + k * step, head_z + lift)
            return m

        for k in range(length):
            f = (first + k) % frames
            exact[leg][f], phases[leg][f] = flat(k), "down"
        k = 1
        while k < frames - length - SET_DOWN - 1 and s[(last + k) % frames, 2] < ROLL_TO:
            f = (last + k) % frames
            m = flat(length - 1 + k)
            pivot = np.array([x, m[1, 3] + (toe_y - head_y), toe_z])
            exact[leg][f], phases[leg][f] = g._turn_x(float(s[f, 2]), pivot) @ m, "roll"
            k += 1
        rolled = k - 1
        for j in range(1, SET_DOWN + 1):
            f = (first - j) % frames
            exact[leg][f], phases[leg][f] = flat(-j, SET_HEIGHT * j / (SET_DOWN + 1)), "set"

        # In the air: the source's path, shifted by an offset eased from the
        # last frame of the breakover to the first of the set-down.
        a0 = (last + rolled) % frames
        a1 = (first - SET_DOWN) % frames
        off0 = _state(exact[leg][a0], rest[hoof]) - s[a0]
        off1 = _state(exact[leg][a1], rest[hoof]) - s[a1]
        off0[2], off1[2] = g._wrap(off0[2]), g._wrap(off1[2])
        span = (a1 - a0) % frames
        for i in range(1, span):
            f = (a0 + i) % frames
            u = smooth(i / span)
            aim = s[f] + off0 * (1.0 - u) + off1 * u
            aim[2] = g._wrap(aim[2])
            aims[leg][f], phases[leg][f] = aim, "air"
        log(f"walk: {leg}: down {length} frames from {first}, breakover {rolled} frames, set-down {SET_DOWN}, "
            f"in the air {span - 1}; front of the sole {toe_y - head_y:+.3f} m from the hoof's head")

    # Bend the legs.
    uppers = {name: _Upper(name, rest) for name in g.LEGS}
    worst, raised = 0.0, 0.0
    for f, pose in enumerate(poses):
        for leg, obj in legs.items():
            hoof = g.LEGS[leg][-1]
            if f in exact[leg] and (phases[leg][f] != "roll" or ROLL_RIGID):
                # The hoof where it must be, the pastern at its rest angle to
                # it, the leg above reaching for the pastern.
                pastern = g.LEGS[leg][-2]
                m = exact[leg][f]
                p = m @ np.linalg.inv(rest[hoof]) @ rest[pastern]
                error = uppers[leg].reach(pose, _state(p, rest[pastern]))
                worst = max(worst, float(np.abs(error[:2]).max()))
                if np.abs(error[:2]).max() > 0.002:
                    log(f"walk: WARNING the {leg} leg falls {np.abs(error[:2]).max() * 1000:.0f} mm short of its pastern's "
                        f"place ({phases[leg][f]}) at frame {f}")
                pose[pastern] = p
                pose[hoof] = m.copy()
            elif f in exact[leg]:
                m = exact[leg][f]
                error = obj.reach(pose, _state(m, rest[hoof]))
                worst = max(worst, float(np.abs(error[:2]).max()))
                if np.abs(error[:2]).max() > 0.002:
                    log(f"walk: WARNING the {leg} leg falls {np.abs(error[:2]).max() * 1000:.0f} mm short of its hoof's "
                        f"place ({phases[leg][f]}) at frame {f}")
                pose[hoof] = m.copy()
            else:
                target = obj.within(pose, aims[leg][f])
                for _ in range(4):
                    obj.reach(pose, target)
                    low = hooves.lowest(leg, pose[hoof])
                    if low >= g.CLEAR - 1e-4:
                        break
                    raised = max(raised, g.CLEAR - low)
                    target[1] += g.CLEAR - low
            if DEBUG:
                log(f"  f{f:2d} {leg:7s} {phases[leg][f]:4s} {np.round(_state(pose[hoof], rest[hoof]), 3).tolist()} "
                    f"low {hooves.lowest(leg, pose[hoof]):.3f}")
    log(f"walk: {frames} frames, {step * frames:.3f} m a loop ({step * rig.FPS:.2f} m/s); IK error where the hoof is "
        f"placed at most {worst * 1000:.1f} mm; hooves in the air raised up to {raised * 1000:.0f} mm to clear the ground")

    return rig.to_basis({n: np.array([p[n] for p in poses + poses[:1]]) for n in rig.GAME_NAMES}, rest)


def down_count(basis, rest, hooves):
    """Per frame, how many hooves the scene takes as planted: any of their
    soles within 2 cm of the lowest point of the clip."""
    pose = rig.from_basis(basis, rest)
    frames = len(basis["horse_hips"]) - 1
    index = rig.GAME_NAMES.index
    co, w = hooves.body_co[hooves.soles], hooves.weights[hooves.soles]
    track = np.array([rig.skin(co, w, pose, rest, f) for f in range(frames)])
    ground = track[:, :, 2].min()
    out = np.zeros(frames, dtype=int)
    for leg in g.LEGS:
        own = np.flatnonzero(w[:, index(g.LEGS[leg][-1])] > 0.5)
        out += (track[:, own, 2] <= ground + 0.02).any(axis=1)
    return out
