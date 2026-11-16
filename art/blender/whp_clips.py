"""The clips every unit model carries, built from the animation library.

    idle    Idle_Loop (UAL 1)        standing, breathing; loops
    walk    Walk_Loop (UAL 1)        walking on the spot; loops
    run     Jog_Fwd_Loop (UAL 1)     jogging on the spot; loops
    die     Death01 (UAL 1)          falls on his back and lies still; the
                                     last frame is the one the scene holds
    attack  one of ATTACKS, chosen per model (the clip is always "attack")

The whole body comes from the library clip (whp_retarget), then the arms
are adjusted for what the man holds (`Kit`):

  - A shield held by a central grip in the left fist: the library's arm
    swings freely, and a shield fixed to the hand would fly about. The left
    arm is solved by IK instead, so that the shield keeps a set place and
    angle in front of the chest (SHIELD_CARRY), and follows the chest as
    it turns and bobs.
  - The weapon in the right fist keeps the library's arm, except in the
    attacks, where the hand follows a set path (IK) timed by the library
    clip and the weapon is aimed along the stroke.

No clip has root motion: the hips stay over the origin. Every clip is keyed
on every frame at 30 fps.

Axes (rest/armature space): X to the figure's left, -Y forwards, Z up.
"""

import math

import numpy as np
from mathutils import Matrix, Quaternion, Vector

import whp_ual
from whp_anim import FPS, Poser, finish_action, lerp, new_action, smooth
from whp_retarget import KEYED, Retargeter

BASE = {
    "idle": ("ual1", "Idle_Loop"),
    "walk": ("ual1", "Walk_Loop"),
    "run": ("ual1", "Jog_Fwd_Loop"),
    "die": ("ual1", "Death01"),
}
LOOPS = {"idle": True, "walk": True, "run": True, "die": False, "attack": True}


class Kit:
    """What a model holds, as far as the clips care.

    shield:  True if the left fist holds a shield by a central grip. The
             armature then carries "whp_shield_down" and "whp_shield_out":
             the shield's long axis (towards its lower end) and its face
             normal, as directions fixed to the hand, at rest.
    weapon:  None, or the direction the weapon in the right fist points
             (blade or shaft, from the grip towards the business end),
             at rest; kept on the armature as "whp_weapon_axis".
    attack:  a key of ATTACKS.
    carry:   how the weapon is carried when not in use (WEAPON_CARRY, the
             default, or SPEAR_CARRY: see there).
    lie_flat: when he falls, lay the weapon level on the ground instead of
             in line with the forearm (a long spear would go into it).
    sling:   name of the mesh of a sling in the right fist whose pouch
             follows the bone SLING_BONE (balearic_kit): every clip then
             places that bone where the stone is.
    """

    def __init__(self, shield=True, attack="sword-thrust", carry=None, lie_flat=False, sling=None):
        if attack not in ATTACKS:
            raise ValueError(f"unknown attack {attack!r}; choose one of {', '.join(ATTACKS)}")
        self.shield = shield
        self.attack = attack
        self.carry = carry or WEAPON_CARRY
        self.lie_flat = lie_flat
        self.sling = sling


def _vec(v):
    return Vector(tuple(float(x) for x in v))


# --------------------------------------------------------------------------
# The shield arm
# --------------------------------------------------------------------------

# Where the left wrist and the shield go, in the frame of the chest
# (spine_03) at rest: wrist position from the chest bone's head, the
# shield's long axis (down) and its face (out), and where the elbow points.
SHIELD_CARRY = {
    # Relaxed: the arm hangs, the board stands at the left, turned out.
    "rest": dict(wrist=(0.27, -0.26, -0.40), down=(0.0, -0.20, -1.0), out=(0.50, -0.87, 0.0),
                 elbow=(1.0, 0.35, -0.4), follow=0.5),
    # On the march: higher, further round in front, the lower rim forwards
    # so the knees pass behind it.
    "march": dict(wrist=(0.24, -0.34, -0.31), down=(0.0, -0.32, -1.0), out=(0.38, -0.92, 0.0),
                  elbow=(1.0, 0.3, -0.4), follow=0.35),
    # Running: higher still.
    "run": dict(wrist=(0.22, -0.36, -0.25), down=(0.0, -0.36, -1.0), out=(0.36, -0.93, 0.0),
                elbow=(1.0, 0.3, -0.4), follow=0.3),
    # Fighting: the board square in front of the body, its rim at the eyes.
    "guard": dict(wrist=(0.23, -0.44, -0.29), down=(0.0, -0.26, -1.0), out=(0.24, -1.0, 0.0),
                  elbow=(1.0, 0.25, -0.5), follow=0.35),
    # Punching with the boss: pushed forwards and squared up.
    "punch": dict(wrist=(0.22, -0.54, -0.27), down=(0.0, -0.20, -1.0), out=(0.12, -1.0, 0.0),
                  elbow=(1.0, 0.1, -0.5), follow=0.35),
    # Falling: the shield goes down with the chest and ends lying on him.
    "fall": dict(wrist=(0.21, -0.36, -0.30), down=(0.0, -0.12, -1.0), out=(0.26, -1.0, 0.0),
                 elbow=(1.0, 0.25, -0.5), follow=1.0),
    # Down on the ground with the chest still up: the board lies forwards
    # over the thighs instead of standing in the ground.
    "seated": dict(wrist=(0.22, -0.40, -0.10), down=(0.0, -0.8, -0.6), out=(0.2, -0.6, 0.8),
                   elbow=(1.0, 0.2, -0.3), follow=1.0),
}

# How a weapon is carried when not in use, in the same kind of frame:
# pointing forwards and down, the back of the hand outwards.
WEAPON_CARRY = dict(aim=(0.0, -0.8, -0.6), up=(-1.0, 0.0, 0.3), follow=0.6)
# A long spear stands upright, its butt just off the ground: the forearm
# comes forwards (IK to `wrist`, the elbow towards `elbow`) and the fist
# holds the shaft upright beside the thigh.
SPEAR_CARRY = dict(wrist=(-0.24, -0.17, -0.43), elbow=(-0.6, 0.8, -0.2),
                   aim=(0.0, -0.08, 1.0), up=(-1.0, 0.1, 0.0), follow=0.6)


# A sling hangs from the fist, the cords straight down.
SLING_CARRY = dict(aim=(0.0, -0.15, -1.0), up=(-1.0, 0.0, 0.0), follow=0.6)
SLING_BONE = "ik_hand_gun"          # a bone no mesh uses otherwise
SLING_T = "whp_sling_t"             # point attribute: 0 at the fist, 1 at the pouch


def blend_carry(a, b, t):
    return {key: lerp(a[key], b[key], t) for key in a}


class Arms:
    """IK for the arms on top of a retargeted pose."""

    def __init__(self, poser):
        self.p = poser
        arm = poser.armature
        self.shield_axes = None
        if "whp_shield_down" in arm:
            self.shield_axes = (_vec(arm["whp_shield_down"]), _vec(arm["whp_shield_out"]))
        self.weapon_axis = _vec(arm["whp_weapon_axis"]) if "whp_weapon_axis" in arm else None
        rest = poser.rest
        self.chest_rest = rest["spine_03"].to_translation()
        # The back of the right hand at rest, fixed to the hand.
        p = poser
        saved = {name: m.copy() for name, m in p.matrix.items()}
        p.reset()
        _fingers, _thumb, back = p.hand_axes("r")
        self.back_r = back.copy()
        p.matrix = saved

    def chest(self, follow=1.0):
        """Turn and origin of a frame at the chest. `follow` says how much
        of the chest's turn the frame takes: 1 all of it, 0 none (it stays
        square to the figure's facing, the way the scene moves it)."""
        turn = self.p.turned("spine_03").to_quaternion()
        turn = Quaternion().slerp(turn, follow) if follow < 1.0 else turn
        return turn.to_matrix(), self.p.head("spine_03")

    def shield(self, carry):
        """Solve the left arm so that the shield sits as `carry` says."""
        p = self.p
        turn, origin = self.chest(carry["follow"])
        down = turn @ _vec(carry["down"]).normalized()
        out = turn @ _vec(carry["out"]).normalized()
        wrist = origin + turn @ _vec(carry["wrist"])
        elbow = turn @ _vec(carry["elbow"])
        p.limb("upperarm_l", "lowerarm_l", "hand_l", wrist, elbow)
        p.orient("hand_l", self.shield_axes, (down, out))
        self._twist("l")

    def hand(self, side, wrist, elbow, aim=None, up=None):
        """Put a wrist at `wrist` (armature space), the elbow towards
        `elbow`; turn the hand so the weapon points along `aim` and the back
        of the hand faces `up` as near as it can."""
        p = self.p
        p.limb(f"upperarm_{side}", f"lowerarm_{side}", f"hand_{side}", wrist, elbow)
        if aim is not None:
            p.orient(f"hand_{side}", (self.weapon_axis, self.back_r), (aim, up))
        self._twist(side)

    def hold(self, carry):
        """Carry the weapon as `carry` says: with the arm solved to a set
        wrist position if it gives one, else by turning the hand only."""
        if "wrist" not in carry or self.weapon_axis is None:
            self.carry_weapon(carry)
            return
        turn, origin = self.chest(carry["follow"])
        self.hand("r", origin + turn @ _vec(carry["wrist"]), turn @ _vec(carry["elbow"]),
                  turn @ _vec(carry["aim"]).normalized(), turn @ _vec(carry["up"]).normalized())

    def carry_weapon(self, carry=WEAPON_CARRY, weight=1.0):
        """Keep the arm as it is but turn the hand so the weapon is carried
        as `carry` says; `weight` blends from the hand as it was (0)."""
        if self.weapon_axis is None or weight <= 0.0:
            return
        p = self.p
        turn, _origin = self.chest(carry["follow"])
        before = p.matrix["hand_r"].to_3x3()
        p.orient("hand_r", (self.weapon_axis, self.back_r),
                 (turn @ _vec(carry["aim"]).normalized(), turn @ _vec(carry["up"]).normalized()))
        if weight < 1.0:
            after = p.matrix["hand_r"].to_3x3()
            p.set_rotation("hand_r", before.to_quaternion().slerp(after.to_quaternion(), weight).to_matrix())
        self._twist("r")

    def _twist(self, side):
        lower, hand, twist = f"lowerarm_{side}", f"hand_{side}", f"lowerarm_twist_01_{side}"
        p = self.p
        axis_rest = (p.rest[hand].to_translation() - p.rest[lower].to_translation()).normalized()
        relative = p.turned(lower).inverted() @ p.turned(hand)
        q = relative.to_quaternion()
        angle = 2.0 * math.atan2(Vector((q.x, q.y, q.z)).dot(axis_rest), q.w)
        angle = math.atan2(math.sin(angle), math.cos(angle))
        p.keep_rest_orientation(twist, p.turned(lower).to_quaternion())
        p.rotate(twist, p.turned(lower) @ axis_rest, math.degrees(angle) / 2)


class SlingCord:
    """The pouch of a sling in the right fist: the bone SLING_BONE carries
    the pouch and the stone, the cords stretch from the fist to it. `place`
    puts the stone at the cords' length from the fist."""

    GROUND = 0.04                   # lowest the stone goes, metres

    def __init__(self, poser, obj):
        mesh = obj.data
        co = np.empty(len(mesh.vertices) * 3)
        mesh.vertices.foreach_get("co", co)
        co = co.reshape(-1, 3)
        t = np.empty(len(mesh.vertices), dtype=np.float32)
        mesh.attributes[SLING_T].data.foreach_get("value", t)
        self.p = poser
        self.grip = Vector(co[t < 0.02].mean(axis=0))
        self.pouch = Vector(co[t > 0.98].mean(axis=0))
        self.length = (self.pouch - self.grip).length
        self.along = (self.pouch - self.grip).normalized()

    def fist(self):
        """Where the cords leave the fist now."""
        p = self.p
        return (p.matrix["hand_r"] @ p.rest["hand_r"].inverted()) @ self.grip

    def place(self, direction):
        """Stone at the full length of the cords from the fist, towards
        `direction`; never below GROUND (the rest lies along the ground)."""
        grip = self.fist()
        d = Vector(direction).normalized()
        target = grip + d * self.length
        if target.z < self.GROUND:
            drop = max(grip.z - self.GROUND, 0.0)
            flat = Vector((d.x, d.y, 0.0))
            flat = flat.normalized() if flat.length > 1e-6 else Vector((0.0, -1.0, 0.0))
            reach = math.sqrt(max(self.length ** 2 - drop ** 2, 0.0))
            target = Vector((grip.x, grip.y, self.GROUND)) + flat * reach
            d = (target - grip).normalized()
        turn = self.along.rotation_difference(d).to_matrix().to_4x4()
        move = Matrix.Translation(grip) @ turn @ Matrix.Translation(-self.grip)
        self.p.matrix[SLING_BONE] = move @ self.p.rest[SLING_BONE]

    def hang(self, forwards=None):
        """Hanging from the fist (lying forwards along the ground if the
        fist is lower than the cords are long)."""
        down = Vector((0.0, 0.0, -1.0))
        if forwards is not None:
            down = (down * 0.98 + Vector(forwards) * 0.2).normalized()
        self.place(down)


def slerp_direction(a, b, t):
    q = a.rotation_difference(b)
    return Quaternion().slerp(q, t) @ a


# --------------------------------------------------------------------------
# Building clips
# --------------------------------------------------------------------------

class Builder:
    def __init__(self, armature, kit):
        self.armature = armature
        self.kit = kit
        self.poser = Poser(armature)
        self.arms = Arms(self.poser)
        self.targets = {}
        self.strides = {}           # clip -> metres covered in one loop
        self.lying_lift = 0.0       # how much "die" was lifted at the end
        self.sling = None
        self.keyed, self.located = list(KEYED), ("pelvis",)
        if kit.sling:
            import bpy
            self.sling = SlingCord(self.poser, bpy.data.objects[kit.sling])
            self.keyed.append(SLING_BONE)
            self.located = ("pelvis", SLING_BONE)

    def retarget(self, pack):
        if pack not in self.targets:
            self.targets[pack] = Retargeter(self.poser, whp_ual.pack(pack))
        return self.targets[pack]

    def clip(self, name, frames, pose_at, loop=True):
        """Key `frames` + 1 frames; pose_at(frame) builds each pose. A loop
        keys its last frame as a copy of the first."""
        action = new_action(self.armature, name)
        feet = []
        for frame in range(frames + 1):
            pose_at(frame % frames if loop else frame)
            feet.append([self.poser.head(f"foot_{side}").copy() for side in ("l", "r")])
            self.poser.key(frame, self.keyed, located=self.located)
        finish_action(self.armature, action, frames, loop=loop)
        if name in ("walk", "run"):
            self.strides[name] = _stride(feet)
        return action

    def base(self, name, carry, weapon=None, fix=None):
        pack, source = BASE[name]
        rt = self.retarget(pack)
        clip = rt.pack.clip(source)

        def pose_at(frame):
            sample = rt.sample(source, frame)
            rt.pose(sample)
            if fix is not None:
                fix(1.0 - rt.upright(sample))
            if self.kit.shield:
                self.arms.shield(carry(frame, clip.frames) if callable(carry) else SHIELD_CARRY[carry])
            if weapon is not None:
                weapon(frame, clip.frames)
            else:
                self.arms.hold(self.kit.carry)
            if self.sling is not None:
                self.sling.hang(self.p.turned("spine_03") @ Vector((0.0, -1.0, 0.0)))

        return self.clip(name, clip.frames, pose_at, loop=LOOPS[name])

    def die(self):
        """Death01, then lifted so that nothing of the final pose is under
        the ground: the man in armour lies higher than the mannequin."""
        rt = self.retarget(BASE["die"][0])
        rt.lying_lift = 0.0
        action = self.base("die", self._die_shield, self._die_weapon, self._head_on_ground)
        lowest = lowest_point(self.armature, action)
        if lowest is not None and lowest < 0.0:
            rt.lying_lift = min(-lowest, 0.12)
            action = self.base("die", self._die_shield, self._die_weapon, self._head_on_ground)
        self.lying_lift = rt.lying_lift
        rt.lying_lift = 0.0
        return action

    def _die_shield(self, frame, frames):
        """The shield while falling: in front of the chest, over the thighs
        while he sits on the ground with the chest up, on the chest once he
        lies (uses the `down` that _head_on_ground saw for this frame)."""
        chest_up = max(0.0, (self.poser.turned("spine_03") @ Vector((0.0, 0.0, 1.0))).z)
        return blend_carry(SHIELD_CARRY["fall"], SHIELD_CARRY["seated"], smooth(self._down * 3.0) * smooth((chest_up - 0.3) / 0.4))

    def _head_on_ground(self, down):
        """Lying, the head tips forwards until the top of the skull points
        no lower than level, so a crest lies along the ground, not into it."""
        self._down = down
        if down <= 0.0:
            return
        p = self.poser
        top = p.turned("head") @ Vector((0.0, 0.0, 1.0))
        flat = Vector((top.x, top.y, 0.0))
        if top.z >= 0.2 or flat.length < 1e-6:
            return
        wanted = flat.normalized() * math.sqrt(1.0 - 0.2 ** 2) + Vector((0.0, 0.0, 0.2))
        turn = top.rotation_difference(wanted)
        axis, angle = turn.axis, turn.angle * down
        for bone in ("neck_01", "head"):
            p.rotate(bone, axis, math.degrees(angle) / 2)

    def _die_weapon(self, frame, frames):
        """Falling, the weapon goes from its carry to lying in line with the
        forearm, flat on the ground under the hand."""
        p = self.p
        t = smooth(frame / frames * 1.6)
        self.arms.carry_weapon(self.kit.carry, weight=1.0 - t)
        if t > 0.0 and self.arms.weapon_axis is not None:
            before = p.matrix["hand_r"].to_3x3()
            along = p.direction("lowerarm_r", "hand_r")
            if self.kit.lie_flat:
                along = Vector((along.x, along.y, 0.0)).normalized()
            p.orient("hand_r", (self.arms.weapon_axis, self.arms.back_r), (along, Vector((0.0, 0.0, 1.0))))
            after = p.matrix["hand_r"].to_3x3()
            p.set_rotation("hand_r", before.to_quaternion().slerp(after.to_quaternion(), t).to_matrix())
            self.arms._twist("r")

    @property
    def p(self):
        return self.poser

    def build(self):
        actions = [
            self.base("idle", "rest"),
            self.base("walk", "march"),
            self.base("run", "run"),
            self.die(),
            ATTACKS[self.kit.attack](self),
        ]
        self.armature.animation_data.action = None
        return actions


def lowest_point(armature, action, frame=None):
    """Lowest point of the visible meshes skinned to `armature` at a frame
    of an action (default its last), in metres; None if there are none."""
    import bpy

    scene = bpy.context.scene
    previous = armature.animation_data.action
    armature.animation_data.action = action
    if hasattr(armature.animation_data, "action_slot") and len(action.slots):
        armature.animation_data.action_slot = action.slots[0]
    scene.frame_set(int(action.frame_end) if frame is None else frame)
    deps = bpy.context.evaluated_depsgraph_get()
    lowest = None
    for obj in scene.objects:
        if obj.type != "MESH" or obj.parent is not armature or obj.hide_render:
            continue
        ev = obj.evaluated_get(deps)
        mesh = ev.to_mesh()
        co = np.empty(len(mesh.vertices) * 3)
        mesh.vertices.foreach_get("co", co)
        ev.to_mesh_clear()
        if len(co):
            world = np.array(obj.matrix_world)
            z = float((co.reshape(-1, 3) @ world[:3, :3].T + world[:3, 3])[:, 2].min())
            lowest = z if lowest is None else min(lowest, z)
    armature.animation_data.action = previous
    scene.frame_set(0)
    return lowest


def _stride(feet):
    """Distance the figure covers in one loop of a gait clip played on the
    spot: the planted foot (the lower ankle) slides backwards at walking
    speed; sum its travel over the loop."""
    travelled = 0.0
    for (l0, r0), (l1, r1) in zip(feet, feet[1:]):
        planted = 0 if l0.z + l1.z < r0.z + r1.z else 1
        a, b = (l0, l1) if planted == 0 else (r0, r1)
        travelled += b.y - a.y              # backwards is +Y
    return travelled


def _extension(rt, source, frames, side="r"):
    """How far the source's hand is from its shoulder at each frame, 0 at
    the nearest and 1 at the furthest: the timing of a punch or a throw."""
    reach = []
    for frame in range(frames + 1):
        s = rt.sample(source, frame)
        reach.append(np.linalg.norm(rt.pack.head(s, f"hand_{side}") - rt.pack.head(s, f"upperarm_{side}")))
    reach = np.array(reach)
    return (reach - reach.min()) / max(reach.max() - reach.min(), 1e-6)


def _stroke(b, source, guard, strike, shield=("guard", "punch"), follow=0.25, lead=3, pack="ual1"):
    """An attack where the right hand goes from `guard` to `strike` and back
    as the source's right hand reaches out and comes back (_extension). The
    dicts hold the wrist, the elbow's direction, where the weapon points
    (aim) and where the back of the hand faces (up), in a chest frame that
    takes `follow` of the chest's turn. The shield goes from the first
    carry to the second a few frames (`lead`) ahead of the hand."""
    rt = b.retarget(pack)
    frames = rt.pack.clip(source).frames
    reach = _extension(rt, source, frames)

    def pose_at(frame):
        rt.pose(rt.sample(source, frame))
        e = smooth(reach[frame])
        if b.kit.shield:
            ahead = smooth(reach[min(frame + lead, frames)])
            b.arms.shield(blend_carry(SHIELD_CARRY[shield[0]], SHIELD_CARRY[shield[1]], ahead))
        s = {key: lerp(guard[key], strike[key], e) for key in guard}
        turn, origin = b.arms.chest(follow)
        b.arms.hand("r", origin + turn @ _vec(s["wrist"]), turn @ _vec(s["elbow"]),
                    turn @ _vec(s["aim"]).normalized(), turn @ _vec(s["up"]).normalized())

    return b.clip("attack", frames, pose_at)


def sword_thrust(b):
    """Stab past the right edge of the shield from a guard at the hip, the
    shield punching forwards a moment before. Body: Punch_Cross."""
    guard = dict(wrist=(-0.22, -0.16, -0.40), aim=(-0.05, -0.75, 0.66), up=(-0.7, 0.0, 0.7), elbow=(-1.0, 0.6, -0.3))
    stab = dict(wrist=(-0.26, -0.62, -0.26), aim=(0.0, -1.0, 0.05), up=(-0.4, 0.0, 1.0), elbow=(-1.0, 0.2, -0.6))
    return _stroke(b, "Punch_Cross", guard, stab)


def spear_thrust(b):
    """Underarm thrust of a spear held at the right hip, past the shield's
    right edge; the shield stays up. Body: Punch_Cross."""
    # The shaft runs out past the shield's right edge, a little outwards.
    guard = dict(wrist=(-0.27, 0.04, -0.42), aim=(-0.16, -1.0, 0.12), up=(-1.0, 0.0, 0.1), elbow=(-1.0, 0.8, -0.2))
    stab = dict(wrist=(-0.27, -0.46, -0.32), aim=(-0.10, -1.0, 0.06), up=(-1.0, 0.0, 0.2), elbow=(-1.0, 0.3, -0.4))
    return _stroke(b, "Punch_Cross", guard, stab, shield=("guard", "guard"))


# The library's throw is a big lunge; a man in a line throws with less of
# his body. Trunk and legs keep this much of its motion.
CALM_THROW = {bone: 0.5 for bone in ("pelvis", "spine_01", "spine_02", "spine_03", "neck_01", "Head",
                                     "thigh_l", "calf_l", "foot_l", "ball_l", "thigh_r", "calf_r", "foot_r", "ball_r")}


def javelin_throw(b):
    """Overhand throw: the arm and body are the library's OverhandThrow;
    the hand keeps the javelin pointing forwards and up along the throw
    until the release, then lets it drop with the follow-through."""
    rt = b.retarget("ual2")
    source = "OverhandThrow"
    frames = rt.pack.clip(source).frames
    reach = _extension(rt, source, frames)
    release = int(np.argmax(reach))

    def pose_at(frame):
        rt.pose(rt.sample(source, frame, CALM_THROW))
        if b.kit.shield:
            b.arms.shield(SHIELD_CARRY["guard"])
        after = smooth((frame - release) / 6.0) if frame > release else 0.0
        back = smooth((frames - frame) / 8.0)
        throw = dict(aim=(0.0, -1.0, 0.45), up=(-1.0, 0.0, 0.3), follow=0.2)
        carry = dict(aim=lerp(throw["aim"], WEAPON_CARRY["aim"], after * back + (1 - back)),
                     up=throw["up"], follow=0.3)
        b.arms.carry_weapon(carry)

    return b.clip("attack", frames, pose_at)


def sling(b):
    """One and a half turns of the sling round above the head, then an
    overhand cast (body and arm from the library's OverhandThrow). The
    stone (the pouch bone, SlingCord) trails the hand round the circle,
    swings up behind and over the shoulder and is let go forwards and up;
    then the empty sling drops and hangs."""
    rt = b.retarget("ual2")
    source = "OverhandThrow"
    frames = rt.pack.clip(source).frames
    reach = _extension(rt, source, frames)
    release = int(np.argmax(reach))
    whirl_end = max(release - 9, 8)
    turns = 1.5
    lag = 0.7                                   # radians the stone trails the hand
    # Angle of the hand on the circle: the stone ends the whirl behind him.
    start = 1.5 * math.pi + lag - 2.0 * math.pi * turns
    cast = Vector((0.0, -0.85, 0.5))            # the stone's way out, in the chest frame
    p = b.poser

    def radial(turn, angle):
        return turn @ Vector((-math.cos(angle), -math.sin(angle), 0.0))

    def pose_at(frame):
        rt.pose(rt.sample(source, frame, CALM_THROW))
        if b.kit.shield:
            b.arms.shield(SHIELD_CARRY["guard"])
        turn, _origin = b.arms.chest(0.3)
        rise = smooth(frame / 6.0)
        leave = 1.0 - smooth((frame - whirl_end) / 6.0) if frame > whirl_end else 1.0
        w = rise * leave                        # how much the hand keeps to the circle
        angle = start + 2.0 * math.pi * turns * min(frame, whirl_end) / whirl_end
        hang = Vector((0.0, 0.0, -1.0))
        up = Vector((0.0, 0.0, 1.0))
        whirl = (radial(turn, angle - lag) * math.cos(0.25) + up * math.sin(0.25)).normalized()
        if frame <= whirl_end:
            stone = slerp_direction(hang, whirl, rise)
        elif frame <= release:
            s = smooth((frame - whirl_end) / max(release - whirl_end, 1))
            stone = slerp_direction(whirl, turn @ cast, s)
        else:
            s = smooth((frame - release) / 7.0)
            stone = slerp_direction(turn @ cast, hang, s)
        back = (turn @ Vector((-1.0, 0.0, 0.3))).normalized()
        if w > 0.0:
            centre = p.head("head") + turn @ Vector((-0.16, 0.02, 0.30))
            circle = centre + radial(turn, angle) * 0.10
            wrist = p.head("hand_r").lerp(circle, w)
            b.arms.hand("r", wrist, turn @ Vector((-1.0, 0.3, -0.2)), stone, back)
        elif b.arms.weapon_axis is not None:
            p.orient("hand_r", (b.arms.weapon_axis, b.arms.back_r), (stone, back))
            b.arms._twist("r")
        if b.sling is not None:
            b.sling.place(stone)

    return b.clip("attack", frames, pose_at)


ATTACKS = {
    "sword-thrust": sword_thrust,
    "spear-thrust": spear_thrust,
    "javelin-throw": javelin_throw,
    "sling": sling,
}


def build_all(armature, kit):
    return Builder(armature, kit).build()


# Poses that show whether the skin deforms properly (whp_skeleton.apply_pose).
# Rotations are about the figure's axes: X to its left, -Y forwards, Z up.
TEST_POSES = {
    "arms-up": [("upperarm_l", "Y", -80), ("upperarm_r", "Y", 80), ("lowerarm_r", "Y", 40)],
    "step": [("thigh_l", "X", -45), ("calf_l", "X", 55), ("thigh_r", "X", 22), ("calf_r", "X", 12),
             ("upperarm_r", "X", -30), ("upperarm_l", "X", 25)],
    "bend": [("spine_01", "X", 18), ("spine_02", "X", 16), ("spine_03", "X", 14), ("neck_01", "X", -20),
             ("head", "Z", 35), ("upperarm_l", "Y", 30), ("upperarm_r", "Y", -30)],
}

__all__ = ["Kit", "build_all", "TEST_POSES", "SHIELD_CARRY", "FPS", "Matrix"]
