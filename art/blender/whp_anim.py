"""Keyframed clips built from poses described in the figure's own axes.

`Poser` keeps its own copy of every bone's matrix in armature space, so a
pose is assembled without touching Blender's dependency graph: rotate a
bone about a world axis, aim a limb along a direction, solve a leg for a
foot position. `key` then converts the result to the pose bones' local
rotations and inserts keyframes.

Axes: X to the figure's left, -Y forwards, Z up.
"""

import math

import bpy
from mathutils import Matrix, Quaternion, Vector

FPS = 30
AXES = {"X": Vector((1, 0, 0)), "Y": Vector((0, 1, 0)), "Z": Vector((0, 0, 1))}


def smooth(t):
    """Ease in and out, 0..1."""
    t = min(max(t, 0.0), 1.0)
    return t * t * (3.0 - 2.0 * t)


def lerp(a, b, t):
    if isinstance(a, (tuple, list, Vector)):
        return tuple(x + (y - x) * t for x, y in zip(a, b))
    return a + (b - a) * t


class Poser:
    def __init__(self, armature):
        self.armature = armature
        bones = armature.data.bones
        self.names = [b.name for b in bones]          # parents come before children
        self.rest = {b.name: b.matrix_local.copy() for b in bones}
        self.parent = {b.name: (b.parent.name if b.parent else None) for b in bones}
        self.children = {b.name: [c.name for c in b.children] for b in bones}
        self.matrix = {}
        self._last = {}
        self.reset()

    # -- building a pose ----------------------------------------------------

    def reset(self):
        self.matrix = {name: m.copy() for name, m in self.rest.items()}

    def head(self, name):
        return self.matrix[name].to_translation()

    def _subtree(self, name):
        stack = [name]
        while stack:
            bone = stack.pop()
            yield bone
            stack.extend(self.children[bone])

    def _transform(self, name, world):
        for bone in self._subtree(name):
            self.matrix[bone] = world @ self.matrix[bone]

    def _about_head(self, name, rotation):
        head = self.head(name)
        self._transform(name, Matrix.Translation(head) @ rotation.to_matrix().to_4x4() @ Matrix.Translation(-head))

    def rotate(self, name, axis, degrees):
        """Turn a bone (and what hangs from it) about an axis through its head."""
        axis = AXES[axis] if isinstance(axis, str) else Vector(axis).normalized()
        self._about_head(name, Quaternion(axis, math.radians(degrees)))

    def move(self, name, offset):
        self._transform(name, Matrix.Translation(Vector(offset)))

    def direction(self, name, child):
        return (self.head(child) - self.head(name)).normalized()

    def aim(self, name, child, direction):
        """Turn a bone the shortest way so that `child` lies along `direction`."""
        target = Vector(direction).normalized()
        self._about_head(name, self.direction(name, child).rotation_difference(target))

    def twist(self, name, child, degrees):
        """Roll a bone about its own length."""
        self.rotate(name, self.direction(name, child), degrees)

    def set_rotation(self, name, rotation):
        """Give a bone this orientation (a 3x3 Matrix in armature space),
        turning it and what hangs from it about its head."""
        head = self.head(name)
        delta = Matrix(rotation) @ self.matrix[name].to_3x3().inverted()
        self._transform(name, Matrix.Translation(head) @ delta.to_4x4() @ Matrix.Translation(-head))

    def place(self, name, position):
        """Move a bone (and what hangs from it) so its head is at `position`."""
        self.move(name, Vector(position) - self.head(name))

    def turned(self, name):
        """How far a bone is turned from its rest orientation (3x3, armature axes)."""
        return self.matrix[name].to_3x3() @ self.rest[name].to_3x3().inverted()

    def limb(self, upper, lower, end, target, pole):
        """Two-bone IK: aim `upper` and `lower` so that the head of `end`
        reaches `target` (or as near as the limb allows), the middle joint
        bending towards `pole`. Returns the point reached."""
        root = self.head(upper)
        l1 = (self.rest[lower].to_translation() - self.rest[upper].to_translation()).length
        l2 = (self.rest[end].to_translation() - self.rest[lower].to_translation()).length
        reach = Vector(target) - root
        d = min(max(reach.length, abs(l1 - l2) * 1.001 + 1e-6), (l1 + l2) * 0.9995)
        u = reach.normalized()
        a = (l1 * l1 - l2 * l2 + d * d) / (2 * d)
        h = math.sqrt(max(l1 * l1 - a * a, 0.0))
        pole = Vector(pole)
        w = pole - pole.dot(u) * u
        if w.length < 1e-6:
            w = u.orthogonal()
        w.normalize()
        middle = root + u * a + w * h
        self.aim(upper, lower, middle - root)
        self.aim(lower, end, root + u * d - middle)
        return root + u * d

    def keep_rest_orientation(self, name, turn=None):
        """Give a bone the orientation it has at rest, whatever its parents
        do, then apply `turn` (a Quaternion) on top."""
        head = self.head(name)
        rotation = self.rest[name].to_3x3()
        if turn is not None:
            rotation = turn.to_matrix() @ rotation
        delta = rotation @ self.matrix[name].to_3x3().inverted()
        self._transform(name, Matrix.Translation(head) @ delta.to_4x4() @ Matrix.Translation(-head))

    def orient(self, name, rest_vectors, targets):
        """Turn a bone about its head so that two directions fixed to it
        (given as they are at rest) point along two target directions. The
        first is matched exactly, the second as closely as it allows."""
        turned = self.matrix[name].to_3x3() @ self.rest[name].to_3x3().inverted()

        def frame(a, b):
            x = Vector(a).normalized()
            y = Vector(b)
            y = (y - y.dot(x) * x).normalized()
            m = Matrix((x, y, x.cross(y)))
            m.transpose()
            return m

        current = frame(turned @ Vector(rest_vectors[0]), turned @ Vector(rest_vectors[1]))
        wanted = frame(targets[0], targets[1])
        delta = wanted @ current.transposed()
        head = self.head(name)
        self._transform(name, Matrix.Translation(head) @ delta.to_4x4() @ Matrix.Translation(-head))

    # -- limbs --------------------------------------------------------------

    def hand_axes(self, side):
        """Unit vectors of a hand: along the fingers, towards the thumb
        side, and out of the back of the hand."""
        fingers = self.direction(f"hand_{side}", f"middle_01_{side}")
        across = self.head(f"index_01_{side}") - self.head(f"pinky_01_{side}")
        thumb = (across - across.dot(fingers) * fingers).normalized()
        # Right-handed for the left hand, mirrored for the right.
        back = thumb.cross(fingers) if side == "l" else fingers.cross(thumb)
        return fingers, thumb, back.normalized()

    def arm(self, side, upper, fore, roll_axis=None, roll_towards=None):
        """Aim the upper arm and the forearm, then roll the hand about the
        forearm so that one of its axes ("thumb" or "back") points as close
        to `roll_towards` as it can. Half of the roll goes to the forearm's
        twist bone, as the rig expects."""
        self.aim(f"upperarm_{side}", f"lowerarm_{side}", upper)
        self.aim(f"lowerarm_{side}", f"hand_{side}", fore)
        if roll_axis is None:
            return
        axis = self.direction(f"lowerarm_{side}", f"hand_{side}")
        _fingers, thumb, back = self.hand_axes(side)
        current = thumb if roll_axis == "thumb" else back
        target = Vector(roll_towards)
        current = (current - current.dot(axis) * axis).normalized()
        target = (target - target.dot(axis) * axis).normalized()
        angle = math.atan2(current.cross(target).dot(axis), current.dot(target))
        self._about_head(f"hand_{side}", Quaternion(axis, angle))
        self._about_head(f"lowerarm_twist_01_{side}", Quaternion(axis, angle / 2))

    def leg(self, side, ankle, pitch=0.0, yaw=0.0, knee=(0.0, -1.0, 0.0)):
        """Two-bone IK: put the ankle at `ankle` with the knee towards
        `knee`; the foot stays flat, pitched (toes down positive) and
        turned out by `yaw` degrees."""
        thigh, calf, foot = f"thigh_{side}", f"calf_{side}", f"foot_{side}"
        self.limb(thigh, calf, foot, ankle, knee)
        sign = 1.0 if side == "l" else -1.0
        turn = Quaternion(AXES["Z"], math.radians(yaw * sign)) @ Quaternion(AXES["X"], math.radians(pitch))
        self.keep_rest_orientation(foot, turn)

    # -- keyframes ----------------------------------------------------------

    def key(self, frame, bones, located=("pelvis",)):
        """Write the current pose of `bones` to the pose bones and key it."""
        pose = self.armature.pose.bones
        for name in self.names:
            if name not in bones:
                continue
            parent = self.parent[name]
            if parent is None:
                base = self.rest[name]
            else:
                base = self.matrix[parent] @ self.rest[parent].inverted() @ self.rest[name]
            basis = base.inverted() @ self.matrix[name]
            pb = pose[name]
            pb.rotation_mode = "QUATERNION"
            q = basis.to_quaternion()
            last = self._last.get(name)
            if last is not None and last.dot(q) < 0.0:
                q.negate()                     # stay on the same side: no flips between keys
            self._last[name] = q.copy()
            pb.rotation_quaternion = q
            pb.keyframe_insert("rotation_quaternion", frame=frame)
            if name in located:
                pb.location = basis.to_translation()
                pb.keyframe_insert("location", frame=frame)


def new_action(armature, name):
    old = bpy.data.actions.get(name)
    if old is not None:
        bpy.data.actions.remove(old)
    action = bpy.data.actions.new(name)
    action.use_fake_user = True
    if armature.animation_data is None:
        armature.animation_data_create()
    armature.animation_data.action = action
    return action


def finish_action(armature, action, frames, loop=True):
    """Linear keys (every frame is keyed), frame range, and a clean pose."""
    action.use_frame_range = True
    action.frame_start = 0
    action.frame_end = frames
    action.use_cyclic = loop
    for fcurve in action_fcurves(action):
        for point in fcurve.keyframe_points:
            point.interpolation = "LINEAR"
    armature.animation_data.action = None
    for pb in armature.pose.bones:
        pb.location = (0, 0, 0)
        pb.rotation_quaternion = (1, 0, 0, 0)
        pb.scale = (1, 1, 1)


def action_fcurves(action):
    """F-curves of an action, across Blender's layered-action API."""
    if hasattr(action, "layers") and len(action.layers):
        curves = []
        for layer in action.layers:
            for strip in layer.strips:
                for bag in strip.channelbags:
                    curves.extend(bag.fcurves)
        return curves
    return list(getattr(action, "fcurves", []))


def set_action(armature, name):
    """Make a clip the armature's active action (for renders)."""
    if armature.animation_data is None:
        armature.animation_data_create()
    action = bpy.data.actions[name]
    armature.animation_data.action = action
    if hasattr(armature.animation_data, "action_slot") and len(action.slots):
        armature.animation_data.action_slot = action.slots[0]
    return action
