"""Retarget clips of the animation library onto the shared rig.

Source: the 65-bone skeleton of the Universal Animation Library (whp_ual),
standing in a T pose. Target: the 67-bone rig of every unit model
(whp_skeleton), standing in an A pose with its feet apart. The bone names
are the same Unreal names (the library's "Head" is our "head"); the library
has no twist bones and no IK bones.

How a pose is carried over:

  - Trunk, neck, head, arms and feet keep the source's orientation in the
    world. Each bone has an anatomical frame, built the same way on both
    skeletons from two directions (along the bone, and forwards or across
    the palm). At rest the two frames differ only by the rest poses, so
    target = (source turn since its rest) x (source frame at rest) x
    (target frame at rest)^-1 x (target bone at rest). A bone is then
    turned in place; its position follows from the target's own lengths.
  - The hips move as the source's do, scaled by the ratio of leg lengths.
  - The legs are solved by two-bone IK: each ankle goes where the source's
    ankle is, measured from the hip and scaled, and its height above the
    ground is the source's, scaled. The knee bends the way the source's
    does. So a planted foot stays planted, whatever the rest stances
    (as far as it does in the source: whp_clips takes out the slip the
    library's walk has where the foot rolls, through `ankle_shift`).
  - Half of the hand's roll about the forearm goes to the forearm's twist
    bone, as the rig expects. Fingers keep their rest pose (the fists of
    the unit models are closed in the mesh).
"""

import math

import numpy as np
from mathutils import Matrix, Quaternion, Vector

FWD = (0.0, -1.0, 0.0)
UP = (0.0, 0.0, 1.0)

SOURCE_NAME = {"head": "Head"}

# Target bone -> (primary, secondary). Each is a fixed direction or a pair of
# bones (from, to): the direction between their heads, at rest.
FRAMES = {"pelvis": (("pelvis", "spine_01"), FWD),
          "spine_01": (("spine_01", "spine_02"), FWD),
          "spine_02": (("spine_02", "spine_03"), FWD),
          "spine_03": (("spine_03", "neck_01"), FWD),
          "neck_01": (("neck_01", "head"), FWD),
          "head": (UP, FWD)}
for _s in ("l", "r"):
    _across = (f"pinky_01_{_s}", f"index_01_{_s}")
    FRAMES.update({
        f"clavicle_{_s}": ((f"clavicle_{_s}", f"upperarm_{_s}"), FWD),
        f"upperarm_{_s}": ((f"upperarm_{_s}", f"lowerarm_{_s}"), FWD),
        f"lowerarm_{_s}": ((f"lowerarm_{_s}", f"hand_{_s}"), _across),
        f"hand_{_s}": ((f"hand_{_s}", f"middle_01_{_s}"), _across),
        f"foot_{_s}": ((f"foot_{_s}", f"ball_{_s}"), UP),
        f"ball_{_s}": (FWD, UP),
    })

TRUNK = ("pelvis", "spine_01", "spine_02", "spine_03", "neck_01", "head")
ARM = ("clavicle", "upperarm", "lowerarm", "hand")

# Bones a retargeted clip keys (the rest keep their rest pose).
KEYED = list(TRUNK) + [f"{b}_{s}" for s in ("l", "r") for b in
                       ("clavicle", "upperarm", "lowerarm", "hand", "lowerarm_twist_01",
                        "thigh", "calf", "foot", "ball")]


def _frame(primary, secondary):
    x = np.asarray(primary, dtype=np.float64)
    x = x / np.linalg.norm(x)
    y = np.asarray(secondary, dtype=np.float64)
    y = y - np.dot(y, x) * x
    y = y / np.linalg.norm(y)
    return np.column_stack((x, y, np.cross(x, y)))


def _orthonormal(m):
    u, _s, vt = np.linalg.svd(m)
    return u @ vt


class Retargeter:
    """Carries poses from one library pack onto an armature's Poser."""

    def __init__(self, poser, pack):
        self.poser = poser
        self.pack = pack
        rest_t = {name: np.array(m) for name, m in poser.rest.items()}
        rest_s = pack.rest

        def t_head(name):
            return rest_t[name][:3, 3]

        def s_head(name):
            return rest_s[pack.index[SOURCE_NAME.get(name, name)]][:3, 3]

        def vector(spec, head):
            if isinstance(spec[0], str):
                return head(spec[1]) - head(spec[0])
            return np.asarray(spec, dtype=np.float64)

        self.align = {}                 # target bone -> A = F_s F_t^T
        for name, (primary, secondary) in FRAMES.items():
            f_s = _frame(vector(primary, s_head), vector(secondary, s_head))
            f_t = _frame(vector(primary, t_head), vector(secondary, t_head))
            self.align[name] = f_s @ f_t.T
        self.source_rest = {name: _orthonormal(rest_s[pack.index[SOURCE_NAME.get(name, name)]][:3, :3])
                            for name in FRAMES}
        self.target_rest = {name: rest_t[name][:3, :3] for name in FRAMES}

        def leg(head):
            return (np.linalg.norm(head("calf_l") - head("thigh_l")) +
                    np.linalg.norm(head("foot_l") - head("calf_l")))

        self.scale = leg(t_head) / leg(s_head)
        self.ankle_s = s_head("foot_l")[2]          # ankle height with the foot flat on the ground
        self.ankle_t = t_head("foot_l")[2]
        hips_s = (s_head("thigh_l")[2] + s_head("thigh_r")[2]) / 2
        hips_t = (t_head("thigh_l")[2] + t_head("thigh_r")[2]) / 2
        # The hips' height above the ankles, scaled, whatever the rest stances.
        self.lift = self.ankle_t + self.scale * (hips_s - self.ankle_s) - hips_t
        self.pelvis_s = s_head("pelvis")
        self.pelvis_t = t_head("pelvis")
        # Extra height for the hips when the source lies on the ground (a
        # man in armour lies higher than the bare mannequin); set per clip.
        self.lying_lift = 0.0
        # Per side ("l", "r"), a horizontal (x, y) offset for the ankle in
        # the next pose, or None: whp_clips moves a planted foot with it so
        # that it keeps pace with the ground (Builder.lock_feet).
        self.ankle_shift = None
        # Forearm axes at rest, for the twist bones.
        self.forearm = {s: (t_head(f"hand_{s}") - t_head(f"lowerarm_{s}")) /
                        np.linalg.norm(t_head(f"hand_{s}") - t_head(f"lowerarm_{s}")) for s in ("l", "r")}

    # -----------------------------------------------------------------------

    LYING = 0.12        # height of the source's hips when it lies on the ground, metres

    def upright(self, source):
        """1 while the source stands (hips at their rest height or a little
        below), falling to 0 as its hips come down to the ground."""
        z = self.pack.head(source, "pelvis")[2]
        return float(np.clip((z - self.LYING) / (self.pelvis_s[2] * 0.85 - self.LYING), 0.0, 1.0))

    def rotation(self, name, source):
        """World orientation of target bone `name` for a source pose."""
        r_s = _orthonormal(source[self.pack.index[SOURCE_NAME.get(name, name)]][:3, :3])
        turn = r_s @ self.source_rest[name].T
        return turn @ self.align[name] @ self.target_rest[name]

    def sample(self, clip, frame, motion=None):
        return self.pack.sample(clip, frame, motion)

    def pose(self, source, arms=("l", "r")):
        """Build on the Poser the retargeted pose of `source` (world
        matrices of the library's bones, from Pack.sample)."""
        p = self.poser
        pk = self.pack
        p.reset()
        k = self.scale
        pelvis_s = pk.head(source, "pelvis")
        up = self.upright(source)
        lift = self.lift * up + self.lying_lift * (1.0 - up)
        hips = self.pelvis_t + k * (pelvis_s - self.pelvis_s) + np.array((0.0, 0.0, lift))
        p.place("pelvis", Vector(hips))
        for name in TRUNK:
            p.set_rotation(name, Matrix(self.rotation(name, source).tolist()))
        for side in arms:
            for bone in ARM:
                name = f"{bone}_{side}"
                p.set_rotation(name, Matrix(self.rotation(name, source).tolist()))
            self.forearm_twist(side)
        for side in ("l", "r"):
            # Heels and calves of the armoured man lie a little higher too.
            self.leg(source, side, self.lying_lift * 0.5 * (1.0 - up))

    def leg(self, source, side, lift=0.0):
        p = self.poser
        pk = self.pack
        k = self.scale
        hip_s = pk.head(source, f"thigh_{side}")
        knee_s = pk.head(source, f"calf_{side}")
        ankle_s = pk.head(source, f"foot_{side}")
        hip_t = np.array(p.head(f"thigh_{side}"))
        ankle = hip_t + k * (ankle_s - hip_s)
        ankle[2] = self.ankle_t + k * (ankle_s[2] - self.ankle_s) + lift
        if self.ankle_shift is not None:
            ankle[:2] += self.ankle_shift[side]
        line = ankle_s - hip_s
        line /= np.linalg.norm(line)
        pole = (knee_s - hip_s) - np.dot(knee_s - hip_s, line) * line
        p.limb(f"thigh_{side}", f"calf_{side}", f"foot_{side}", Vector(ankle), Vector(pole))
        for name in (f"foot_{side}", f"ball_{side}"):
            p.set_rotation(name, Matrix(self.rotation(name, source).tolist()))

    def forearm_twist(self, side):
        """Give the forearm's twist bone half the hand's roll about the forearm."""
        p = self.poser
        lower, hand, twist = f"lowerarm_{side}", f"hand_{side}", f"lowerarm_twist_01_{side}"
        relative = p.turned(lower).inverted() @ p.turned(hand)
        q = relative.to_quaternion()
        axis = Vector(self.forearm[side].tolist())
        angle = 2.0 * math.atan2(Vector((q.x, q.y, q.z)).dot(axis), q.w)
        angle = math.atan2(math.sin(angle), math.cos(angle))
        world_axis = p.turned(lower) @ axis
        p.keep_rest_orientation(twist, p.turned(lower).to_quaternion())
        p._about_head(twist, Quaternion(world_axis, angle / 2))
