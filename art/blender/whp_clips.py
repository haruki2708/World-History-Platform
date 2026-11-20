"""The clips every unit model carries, built from the animation library.

    idle    Idle_Loop (UAL 1)        standing, breathing; loops
    walk    Walk_Loop (UAL 1)        walking on the spot; loops
    run     Jog_Fwd_Loop (UAL 1)     running fast on the spot (5.8 m/s); loops
    die     Death01 (UAL 1)          falls on his back and lies still; the
                                     last frame is the one the scene holds
    attack  one of ATTACKS, chosen per model (the clip is always "attack")
    jog     Walk_Loop + Jog_Fwd_Loop a steady run of about 3 m/s (JOG); loops
    block   Idle_Loop + Hit_Chest    takes a blow on the shield (REACT)
    hit     Idle_Loop + Hit_Chest    the blow gets through: he flinches (REACT)

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

Walk, jog and run are played on the spot, and the scene moves the figure at the
speed their planted feet slide back (it measures that speed on the clips
themselves). The library's walk slides where the foot rolls: the toes push
off sliding forwards. `Builder.lock_feet` takes that out: it shifts the
ankle of a planted foot, frame by frame, so that its lowest sole moves back
at one steady speed, and lets the shift go again while the foot is in the
air. `Builder.strides` is the ground one loop covers, measured as the scene
does (median speed of the soles on the ground, times the loop's length).

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
LOOPS = {"idle": True, "walk": True, "run": True, "die": False, "attack": True, "jog": True,
         "block": False, "hit": False, "knockdown": False}

# Taking a blow hand to hand (batch G): two clips the scene lays over idle
# when an enemy's blow lands on the man.
#
#     block   he meets the blow with his shield: raises it and pushes it out,
#             it is driven back on him, he recovers
#     hit     the blow gets through: he flinches (Hit_Chest, UAL 1), the
#             shield arm is knocked open, he recovers
#
# Both start and end standing as in idle and are REACT["frames"] long. The
# blow lands REACT["impact"] frames in: the scene times them by that
# (REACTION_IMPACT in src/lib/battle.ts, in seconds), so a change here is a
# change of the contract.
REACT = dict(frames=30, impact=9, stand=("ual1", "Idle_Loop"), flinch=("ual1", "Hit_Chest"))
# The models that fight at a distance (the scene's "skirmish") do not carry
# them: their files stay as they were.
THROWN = ("javelin-throw", "sling")

# Bowled over by a horse (batch L, "Kỵ binh xông qua" in docs/ARCHITECTURE.md):
# the scene lays this clip over what a man on foot is doing when a horse
# riding through his body of men strikes him. Every model on foot carries it.
#
#     0 .. impact    he braces: hunches a little, the shield comes up
#     impact         the horse strikes him (REACT["impact"], the scene's
#                    REACTION_IMPACT), and he goes over backwards
#                    (Hit_Knockback, UAL 2: flung up, his legs swept
#                    from under him, flat on his back; `keys`)
#     .. lie         he lies a moment
#     lie ..         he rolls onto his right side, pushes himself up on his
#                    right fist and stands (LayToIdle, UAL 2, seen in a
#                    mirror: the library's man pushes on his left hand, where
#                    ours holds the shield), the shield up in guard
#     last `settle`  into the first pose of idle
#
# The scene turns the man to face the horse before it strikes, so he only
# ever falls one way: backwards (+Y here, -Z in the model's file). The clip
# starts and ends as idle does, does not loop and is at most
# KNOCKDOWN_SECONDS (src/lib/battle.ts) long; nothing of him goes into the
# ground (`lift`, Builder.knockdown).
KNOCK = dict(
    frames=105,                         # 3.5 s
    impact=REACT["impact"],
    stand=("ual1", "Idle_Loop"),
    fall=("ual2", "Hit_Knockback"),
    rise=("ual2", "LayToIdle"),
    brace=0.15,                         # share of the fall clip's first pose (doubled up) he braces with
    keys=((9, 3.0), (20, 10.0), (35, 25.0)),    # (frame, frame of the fall clip): on his back at frame 20
    lie=52,                             # he starts to get up: the rise clip's first frame
    settle=8,
)
# While he is down nothing of him goes lower than this, metres (the contract
# allows 3 cm into the ground), by part (Skin); his boots go a little into
# it already standing as in idle (1.7 cm: the soles flatten).
KNOCK_GROUND = {"body": 0.0, "feet": -0.025, "left": 0.0, "right": 0.0}
KNOCK_PASSES = 10                       # rounds of measuring and raising in all
KNOCK_BODY_PASSES = 5                   # of which at most this many raise the body and feet alone

# jog: a steady run of about 3 m/s, for a body of men keeping its order. The
# library has a walk (1 m/s) and a fast run (5.8 m/s: long bounds, each foot
# down for 29% of a step), nothing between. The jog blends the two phase by
# phase, both lined up on the landing of the left foot. The run is retimed
# within each step first, so that a foot stays down for `contact` of the
# step (a jogger's, 0.6 to 0.75) and its flight is short; then `share` of the
# run, per group of bones, is laid over the walk. `bounce` keeps that much
# of the hips' rise and fall (the run's is 25 cm); the legs' IK makes up the
# rest. The feet are then locked as in walk and run (Builder.lock_feet).
JOG = dict(
    frames=22,                          # one loop, two steps: 0.733 s, 164 steps a minute
    walk=("Walk_Loop", 0.0),            # clip, frame the left heel lands
    run=("Jog_Fwd_Loop", 1.0, 4.0),     # clip, frame the left foot lands, frames it stays down
    contact=0.65,
    share=dict(legs=0.65, trunk=0.45, arms=0.5),
    bounce=0.6,
)
JOG_LEGS = ("root", "pelvis", "thigh_l", "calf_l", "foot_l", "ball_l", "thigh_r", "calf_r", "foot_r", "ball_r")
JOG_TRUNK = ("spine_01", "spine_02", "spine_03", "neck_01", "Head")


def retime(u, contact, down, step):
    """Frames into a step of the run for a share `u` of a step of the jog:
    the first `contact` of the jog's step covers the run's `down` frames on
    the ground, the rest its flight (`step` frames in all); a monotone cubic
    through those points, its slope the same on both sides of each."""
    k1, k2 = down / contact, (step - down) / (1.0 - contact)
    m = 2.0 * k1 * k2 / (k1 + k2)
    x0, x1, y0, y1 = (0.0, contact, 0.0, down) if u < contact else (contact, 1.0, down, step)
    h = x1 - x0
    t = (u - x0) / h
    return ((2 * t ** 3 - 3 * t ** 2 + 1) * y0 + (t ** 3 - 2 * t ** 2 + t) * h * m
            + (-2 * t ** 3 + 3 * t ** 2) * y1 + (t ** 3 - t ** 2) * h * m)


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
    spare:   True if what the left fist holds besides the shield (the
             hastatus's pila) is skinned to SPARE_BONE: it follows the left
             hand, except in the clips in SPARE_GONE, where it shrinks to
             nothing inside the fist (the pila were thrown before the sword
             fight).
    """

    def __init__(self, shield=True, attack="sword-thrust", carry=None, lie_flat=False, sling=None, spare=False):
        if attack not in ATTACKS:
            raise ValueError(f"unknown attack {attack!r}; choose one of {', '.join(ATTACKS)}")
        self.shield = shield
        self.attack = attack
        self.carry = carry or WEAPON_CARRY
        self.lie_flat = lie_flat
        self.sling = sling
        self.spare = spare


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
    # Lying on his back (knockdown): the board on his chest and belly, face up.
    "lying": dict(wrist=(0.20, -0.22, -0.33), down=(0.0, -0.05, -1.0), out=(0.15, -1.0, 0.0),
                  elbow=(1.0, 0.25, -0.5), follow=1.0),
    # Down on the ground with the chest still up: the board lies forwards
    # over the thighs instead of standing in the ground.
    "seated": dict(wrist=(0.22, -0.40, -0.10), down=(0.0, -0.8, -0.6), out=(0.2, -0.6, 0.8),
                   elbow=(1.0, 0.2, -0.3), follow=1.0),
    # Meeting a blow: raised and square before the body, pushed out to take it.
    "block": dict(wrist=(0.20, -0.52, -0.21), down=(0.0, -0.14, -1.0), out=(0.10, -1.0, 0.06),
                  elbow=(1.0, 0.15, -0.5), follow=0.3),
    # The blow lands on it: driven back on the chest, its top tipped towards him.
    "jolt": dict(wrist=(0.22, -0.37, -0.25), down=(0.0, -0.32, -1.0), out=(0.22, -1.0, 0.14),
                 elbow=(1.0, 0.3, -0.5), follow=0.5),
    # The blow got through: the shield arm knocked open, the board out at his left and low.
    "open": dict(wrist=(0.33, -0.24, -0.41), down=(0.08, -0.12, -1.0), out=(0.72, -0.69, 0.0),
                 elbow=(1.0, 0.4, -0.35), follow=0.8),
}

# How a weapon is carried when not in use, in the same kind of frame:
# pointing forwards and down, the back of the hand outwards.
WEAPON_CARRY = dict(aim=(0.0, -0.8, -0.6), up=(-1.0, 0.0, 0.3), follow=0.6)
# A long spear stands upright, its butt just off the ground: the forearm
# comes forwards (IK to `wrist`, the elbow towards `elbow`) and the fist
# holds the shaft upright beside the thigh. The chest leans forwards by
# about 9 degrees standing and walking, so in its frame the shaft leans back
# by as much: upright to within 3 degrees when he stands or walks, some 18
# degrees forwards when he runs (T-024; it was 14, 15 and 30).
SPEAR_CARRY = dict(wrist=(-0.24, -0.17, -0.43), elbow=(-0.6, 0.8, -0.2),
                   aim=(0.0, 0.15, 1.0), up=(-1.0, 0.1, 0.0), follow=0.6)


# A sling hangs from the fist, the cords straight down.
SLING_CARRY = dict(aim=(0.0, -0.15, -1.0), up=(-1.0, 0.0, 0.0), follow=0.6)
SLING_BONE = "ik_hand_gun"          # a bone no mesh uses otherwise
SLING_T = "whp_sling_t"             # point attribute: 0 at the fist, 1 at the pouch

# What the left fist holds besides the shield (Kit.spare) hangs from another
# bone no mesh uses, so that a clip can take it away: in SPARE_GONE it is
# scaled down to SPARE_SCALE about the wrist, inside the hand.
SPARE_BONE = "ik_hand_l"
SPARE_GONE = ("attack", "die", "block", "hit")      # the clips of the fight hand to hand, and of its end
SPARE_SCALE = 0.01


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
# Feet on the ground
# --------------------------------------------------------------------------

GAITS = ("walk", "run", "jog")
SOLE_HEIGHT = 0.03          # sole vertices: this close to the lowest point of the feet at rest
GROUND_REACH = 0.02         # a sole this close to the lowest point of a clip is on the ground
LOCK_PASSES = 3             # rounds of correction (the legs' IK is not quite linear)


class Soles:
    """The soles of the feet: vertices of the meshes skinned to the rig,
    mostly weighted to a foot, within SOLE_HEIGHT of the lowest of them at
    rest. `at` skins them with the poser's current pose, as the scene does
    (src/components/battle/engine/figures/model.ts, plantedStride)."""

    FOOT = {"l": ("foot_l", "ball_l"), "r": ("foot_r", "ball_r")}

    def __init__(self, armature):
        import bpy

        names = [b.name for b in armature.data.bones]
        to_rig = armature.matrix_world.inverted()
        found = []                                  # (point, [(bone, weight)], side)
        for obj in bpy.data.objects:
            if obj.type != "MESH" or obj.parent is not armature or obj.hide_render or not obj.vertex_groups:
                continue
            mesh = obj.data
            co = np.empty(len(mesh.vertices) * 3)
            mesh.vertices.foreach_get("co", co)
            m = np.array(to_rig @ obj.matrix_world)
            co = co.reshape(-1, 3) @ m[:3, :3].T + m[:3, 3]
            group = {g.index: g.name for g in obj.vertex_groups}
            for i in np.flatnonzero(co[:, 2] < co[:, 2].min() + 0.15):
                weights = [(group[g.group], g.weight) for g in mesh.vertices[i].groups
                           if g.weight > 0.0 and group.get(g.group) in names]
                total = sum(w for _b, w in weights)
                if total <= 0.0:
                    continue
                foot = {side: sum(w for b, w in weights if b in bones) / total for side, bones in self.FOOT.items()}
                side = max(foot, key=foot.get)
                if foot[side] >= 0.5:
                    weights.sort(key=lambda bw: -bw[1])
                    found.append((co[i], [(b, w / total) for b, w in weights[:4]], side))
        if not found:
            raise RuntimeError("no sole vertices found: are the meshes skinned to the feet?")
        lowest = min(p[2] for p, _w, _s in found)
        found = [f for f in found if f[0][2] < lowest + SOLE_HEIGHT]
        self.rest = np.array([p for p, _w, _s in found])
        self.left = np.array([s == "l" for _p, _w, s in found])
        self.bones = sorted({b for _p, w, _s in found for b, _ in w})
        column = {b: i for i, b in enumerate(self.bones)}
        self.weights = np.zeros((len(found), len(self.bones)))
        for k, (_p, w, _s) in enumerate(found):
            for b, x in w:
                self.weights[k, column[b]] = x

    def at(self, poser):
        """Where the sole vertices are in the poser's current pose (n, 3)."""
        p = np.c_[self.rest, np.ones(len(self.rest))]
        out = np.zeros((len(self.rest), 3))
        for k, bone in enumerate(self.bones):
            skin = np.array(poser.matrix[bone] @ poser.rest[bone].inverted())
            out += self.weights[:, k:k + 1] * (p @ skin[:3, :].T)
        return out


# The shins and feet (the Celt's shins follow the calves' twist bones).
LEG_ENDS = ("calf_l", "calf_twist_01_l", "foot_l", "ball_l", "calf_r", "calf_twist_01_r", "foot_r", "ball_r")


class Skin:
    """Every vertex of the meshes skinned to the rig that renders show,
    with its four heaviest weights, skinned as the scene does (as Soles),
    in groups by the bones it mostly follows: `lowest` gives the lowest
    point of each in the poser's current pose."""

    def __init__(self, armature):
        import bpy

        names = {b.name for b in armature.data.bones}
        to_rig = armature.matrix_world.inverted()
        points, rows, bones = [], [], {}
        for obj in sorted(bpy.data.objects, key=lambda o: o.name):
            if obj.type != "MESH" or obj.parent is not armature or obj.hide_render or not obj.vertex_groups:
                continue
            mesh = obj.data
            co = np.empty(len(mesh.vertices) * 3)
            mesh.vertices.foreach_get("co", co)
            m = np.array(to_rig @ obj.matrix_world)
            co = co.reshape(-1, 3) @ m[:3, :3].T + m[:3, 3]
            group = {g.index: g.name for g in obj.vertex_groups}
            for i, v in enumerate(mesh.vertices):
                weights = sorted(((group.get(g.group), g.weight) for g in v.groups
                                  if g.weight > 0.0 and group.get(g.group) in names), key=lambda bw: -bw[1])[:4]
                total = sum(w for _b, w in weights)
                if total <= 0.0:
                    continue
                points.append(co[i])
                rows.append([(bones.setdefault(b, len(bones)), w / total) for b, w in weights])
        self.bones = sorted(bones, key=bones.get)
        self.rest = np.array(points)
        self.weights = np.zeros((len(points), len(self.bones)))
        for k, row in enumerate(rows):
            for b, w in row:
                self.weights[k, b] = w
        def share(names):
            return self.weights[:, [bones[b] for b in names if b in bones]].sum(axis=1)

        feet = share(LEG_ENDS) >= 0.5
        left = ~feet & (share(("hand_l", SPARE_BONE)) >= 0.5)
        right = ~feet & ~left & (share(("hand_r", SLING_BONE)) >= 0.5)
        self.groups = {"feet": feet, "left": left, "right": right, "body": ~(feet | left | right)}

    def at(self, poser):
        p = np.c_[self.rest, np.ones(len(self.rest))]
        out = np.zeros((len(self.rest), 3))
        for k, bone in enumerate(self.bones):
            used = self.weights[:, k] > 0.0
            skin = np.array(poser.matrix[bone] @ poser.rest[bone].inverted())
            out[used] += self.weights[used, k:k + 1] * (p[used] @ skin[:3, :].T)
        return out

    def lowest(self, poser):
        """Lowest point (metres) of each group: "feet" (and shins), "left"
        (what the left hand holds: the shield, the hastatus's pila), "right"
        (the weapon, the sling), "body" (the rest); None for an empty one."""
        z = self.at(poser)[:, 2]
        return {name: (float(z[mask].min()) if mask.any() else None) for name, mask in self.groups.items()}


def planted(track, left):
    """What the scene reads off a gait clip played on the spot. `track`
    holds the sole vertices in every frame of a loop (frames, n, 3), `left`
    which of them are on the left foot. A sole on the ground (within
    GROUND_REACH of the lowest point of the clip) in two frames running
    slides back under the figure at the speed the figure travels.

    Returns that speed (the median, metres per frame) and, per side and
    frame, the slip of that foot's lowest sole into the next frame: its
    horizontal step less the ground's (x, y; backwards is +Y), or None
    while that foot is off the ground."""
    frames = len(track)
    ground = track[:, :, 2].min()
    on = track[:, :, 2] <= ground + GROUND_REACH
    both = on & np.roll(on, -1, axis=0)
    step = (np.roll(track, -1, axis=0) - track)[:, :, :2]
    lengths = np.hypot(step[..., 0], step[..., 1])
    speed = float(np.median(lengths[both])) if both.sum() >= 3 else 0.0
    ground_step = np.array((0.0, speed))
    slips = {}
    for side, mask in (("l", left), ("r", ~left)):
        index = np.flatnonzero(mask)
        rows = []
        for f in range(frames):
            k = index[np.argmin(track[f, index, 2])]
            rows.append(step[f, k] - ground_step if both[f, k] else None)
        slips[side] = rows
    return speed, slips


def worst_slip(slips, speed):
    """The largest slip of a planted foot over one frame, as a share of the
    ground's step."""
    found = [np.hypot(*s) for rows in slips.values() for s in rows if s is not None]
    return max(found) / speed if found and speed > 0 else 0.0


def lock_shifts(slips):
    """Ankle shifts (x, y), one per frame, that take a foot's slips out:
    while the foot is down, each frame's slip is taken off the next frame's
    shift, so its lowest sole moves back exactly with the ground; the shifts
    of a stance are centred on zero, and in the air the foot goes smoothly
    from the shift it lifted off with to the one it lands with."""
    frames = len(slips)
    slips = list(slips)
    down = [s is not None for s in slips]
    for f in range(frames):                     # a one-frame gap does not end a stance
        if not down[f] and down[f - 1] and down[(f + 1) % frames]:
            down[f], slips[f] = True, np.zeros(2)
    if all(down) or not any(down):
        return [np.zeros(2) for _ in range(frames)]
    shift = [None] * frames
    f = next(f for f in range(frames) if down[f] and not down[f - 1])
    for _ in range(frames):
        if down[f] and not down[f - 1]:         # a stance starts at frame f
            run = [np.zeros(2)]
            g = f
            while down[g]:
                run.append(run[-1] - slips[g])
                g = (g + 1) % frames
            run = np.array(run)
            run -= (run.max(axis=0) + run.min(axis=0)) / 2
            for k, value in enumerate(run):
                shift[(f + k) % frames] = value
        f = (f + 1) % frames
    known = [f for f in range(frames) if shift[f] is not None]
    for f in range(frames):
        if shift[f] is None:
            before = max((k for k in known if k < f), default=known[-1])
            after = min((k for k in known if k > f), default=known[0])
            span = (after - before) % frames
            t = smooth(((f - before) % frames) / span)
            shift[f] = shift[before] + (shift[after] - shift[before]) * t
    return shift


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
        self.strides = {}           # clip -> metres covered in one loop, as the scene measures it
        self.slips = {}             # clip -> worst slip of a planted foot (share of the ground's step) before
                                    # and after the lock, and the largest ankle shift it took (metres)
        self.lying_lift = 0.0       # how much "die" was lifted at the end
        self.knock_lift = {}        # most "knockdown" raised each part (KNOCK_GROUND), and the lowest
        self.knock_lowest = {}      # point each part then has (metres)
        self._down = 0.0            # in knockdown: 0 while the library's man stands, 1 as he lies
        self._soles = None
        self.sling = None
        self.keyed, self.located, self.scaled = list(KEYED), ("pelvis",), ()
        if kit.sling:
            import bpy
            self.sling = SlingCord(self.poser, bpy.data.objects[kit.sling])
            self.keyed.append(SLING_BONE)
            self.located = ("pelvis", SLING_BONE)
        if kit.spare:
            self.keyed.append(SPARE_BONE)
            self.located += (SPARE_BONE,)
            self.scaled = (SPARE_BONE,)

    def retarget(self, pack):
        if pack not in self.targets:
            self.targets[pack] = Retargeter(self.poser, whp_ual.pack(pack))
        return self.targets[pack]

    def clip(self, name, frames, pose_at, loop=True):
        """Key `frames` + 1 frames; pose_at(frame) builds each pose. A loop
        keys its last frame as a copy of the first."""
        action = new_action(self.armature, name)
        for frame in range(frames + 1):
            pose_at(frame % frames if loop else frame)
            if self.kit.spare:
                self.spare(name in SPARE_GONE)
            self.poser.key(frame, self.keyed, located=self.located, scaled=self.scaled)
        finish_action(self.armature, action, frames, loop=loop)
        return action

    def spare(self, gone=False):
        """SPARE_BONE follows the left hand; `gone`, it is shrunk inside it."""
        p = self.poser
        m = p.matrix["hand_l"] @ p.rest["hand_l"].inverted() @ p.rest[SPARE_BONE]
        if gone:
            wrist = p.head("hand_l")
            m = Matrix.Translation(wrist) @ Matrix.Scale(SPARE_SCALE, 4) @ Matrix.Translation(-wrist) @ m
        p.matrix[SPARE_BONE] = m

    @property
    def soles(self):
        if self._soles is None:
            self._soles = Soles(self.armature)
        return self._soles

    def lock_feet(self, rt, frames, pose_at):
        """Ankle shifts per frame and side (rt.ankle_shift) that keep every
        planted foot of a gait clip moving back at one steady speed, the
        speed the scene reads off the clip. The library's own clips slide
        a little where the foot rolls: the walk's toes push off sliding
        forwards (up to 80% of the ground's speed for a few frames).
        Returns the shifts and the speed (metres per frame)."""
        shifts = [{"l": np.zeros(2), "r": np.zeros(2)} for _ in range(frames)]
        before = None
        for round_ in range(LOCK_PASSES + 1):
            track = []
            for frame in range(frames):
                rt.ankle_shift = shifts[frame]
                try:
                    pose_at(frame)
                finally:
                    rt.ankle_shift = None
                track.append(self.soles.at(self.poser))
            speed, slips = planted(np.array(track), self.soles.left)
            if before is None:
                before = worst_slip(slips, speed)
            if round_ == LOCK_PASSES:
                break
            for side in ("l", "r"):
                for shift, fix in zip(shifts, lock_shifts(slips[side])):
                    shift[side] = shift[side] + fix
        largest = max(float(np.hypot(*shift[side])) for shift in shifts for side in shift)
        return shifts, speed, (before, worst_slip(slips, speed), largest)

    def dress(self, frame, frames, carry, weapon=None):
        """What the arms hold, on top of a retargeted pose: the shield as
        `carry` says (a SHIELD_CARRY key or a function of the frame), the
        weapon carried (or `weapon` called), the sling hanging."""
        if self.kit.shield:
            self.arms.shield(carry(frame, frames) if callable(carry) else SHIELD_CARRY[carry])
        if weapon is not None:
            weapon(frame, frames)
        else:
            self.arms.hold(self.kit.carry)
        if self.sling is not None:
            self.sling.hang(self.p.turned("spine_03") @ Vector((0.0, -1.0, 0.0)))

    def gait(self, name, rt, frames, pose_at):
        """Key a gait clip with its planted feet locked (lock_feet)."""
        shifts, speed, self.slips[name] = self.lock_feet(rt, frames, pose_at)
        self.strides[name] = speed * frames

        def locked(frame):
            rt.ankle_shift = shifts[frame]
            try:
                pose_at(frame)
            finally:
                rt.ankle_shift = None

        return self.clip(name, frames, locked, loop=LOOPS[name])

    def base(self, name, carry, weapon=None, fix=None):
        pack, source = BASE[name]
        rt = self.retarget(pack)
        clip = rt.pack.clip(source)

        def pose_at(frame):
            sample = rt.sample(source, frame)
            rt.pose(sample)
            if fix is not None:
                fix(1.0 - rt.upright(sample))
            self.dress(frame, clip.frames, carry, weapon)

        if name not in GAITS:
            return self.clip(name, clip.frames, pose_at, loop=LOOPS[name])
        return self.gait(name, rt, clip.frames, pose_at)

    def jog_sample(self, rt, frame, spec=JOG):
        """The library pose for a frame of the jog (see JOG)."""
        pk = rt.pack
        frames = spec["frames"]
        walk_name, walk_start = spec["walk"]
        run_name, run_start, down = spec["run"]
        walk, run = pk.clip(walk_name), pk.clip(run_name)
        phase = (frame % frames) / frames
        step, u = divmod(phase * 2.0, 1.0)
        half = run.frames / 2.0
        at_walk = (walk_start + phase * walk.frames) % walk.frames
        at_run = (run_start + step * half + retime(u, spec["contact"], down, half)) % run.frames
        share = spec["share"]

        def weight(bone):
            if bone in JOG_LEGS:
                return share["legs"]
            return share["trunk"] if bone in JOG_TRUNK else share["arms"]

        return pk.blend((walk_name, at_walk), (run_name, at_run), weight)

    def jog(self, carry="march", spec=JOG):
        """The jog (JOG): walk and run blended, the feet locked."""
        rt = self.retarget("ual1")
        frames = spec["frames"]
        samples = [self.jog_sample(rt, f, spec) for f in range(frames)]
        heights = np.array([rt.pack.head(s, "pelvis")[2] for s in samples])
        mean = heights.mean()

        def pose_at(frame):
            sample = samples[frame % frames]
            drop = (1.0 - spec["bounce"]) * rt.scale * (heights[frame % frames] - mean)
            rt.hips_shift = np.array((0.0, 0.0, -drop))
            try:
                rt.pose(sample)
            finally:
                rt.hips_shift = None
            self.dress(frame, frames, carry)

        return self.gait("jog", rt, frames, pose_at)

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

    def react(self, name, amount, shield):
        """A clip of REACT: the man stands as in idle; from the frame the
        blow lands, `amount` of the library's flinch is laid over that, and
        it goes out again over the last third of the clip. `shield(frame,
        frames)` is the carry of the shield at each frame."""
        pack, stand = REACT["stand"]
        _pack, flinch = REACT["flinch"]
        rt = self.retarget(pack)
        frames, impact = REACT["frames"], REACT["impact"]
        length = rt.pack.clip(flinch).frames

        def pose_at(frame):
            # The flinch starts a frame before the blow, so its first pose (standing) is under the blow's frame.
            at = min(max(frame - impact + 1, 0), length)
            weight = amount * smooth((frame - impact + 2) / 2.0) * (1.0 - smooth((frame - (frames - 10)) / 10.0))
            rt.pose(rt.pack.blend((stand, frame), (flinch, at), weight))
            self.dress(frame, frames, shield)

        return self.clip(name, frames, pose_at, loop=LOOPS[name])

    def block(self):
        """He meets the blow with the shield (see REACT). Without a shield
        he only braces."""
        impact = REACT["impact"]
        carry = SHIELD_CARRY

        def shield(frame, frames):
            if frame <= impact - 2:
                return blend_carry(carry["rest"], carry["block"], smooth(frame / (impact - 2)))
            if frame <= impact:
                return carry["block"]
            if frame <= impact + 3:
                return blend_carry(carry["block"], carry["jolt"], smooth((frame - impact) / 3.0))
            if frame <= impact + 9:
                return blend_carry(carry["jolt"], carry["guard"], smooth((frame - impact - 3) / 6.0))
            return blend_carry(carry["guard"], carry["rest"], smooth((frame - impact - 9) / (frames - impact - 9)))

        return self.react("block", 0.35, shield)

    def hit(self):
        """The blow gets through (see REACT): the whole flinch, the shield
        arm knocked open."""
        impact = REACT["impact"]
        carry = SHIELD_CARRY

        def shield(frame, frames):
            if frame <= impact:
                return carry["rest"]
            if frame <= impact + 4:
                return blend_carry(carry["rest"], carry["open"], smooth((frame - impact) / 4.0))
            return blend_carry(carry["open"], carry["rest"], smooth((frame - impact - 4) / (frames - impact - 4)))

        return self.react("hit", 1.0, shield)

    def knock_source(self, frame, spec=KNOCK):
        """The library's pose at a frame of knockdown (see KNOCK): world
        matrices of UAL 2's skeleton (UAL 1's is the same)."""
        standing, stand = whp_ual.pack(spec["stand"][0]), spec["stand"][1]
        pk, fall = whp_ual.pack(spec["fall"][0]), spec["fall"][1]
        rise = spec["rise"][1]
        impact, keys, lie = spec["impact"], spec["keys"], spec["lie"]

        def braced(f):
            return pk.mix(standing.local(stand, f), pk.local(fall, 0.0), spec["brace"] * smooth(f / impact))

        if frame <= impact:
            local = braced(frame)
        elif frame < lie:
            at = float(np.interp(frame, [k[0] for k in keys], [k[1] for k in keys]))
            local = pk.mix(braced(impact), pk.local(fall, at), smooth((frame - impact) / 3.0))
            down = keys[-1][0]
            if frame > down:
                local = pk.mix(local, pk.mirrored(pk.local(rise, 0.0)), smooth((frame - down) / (lie - down)))
        else:
            local = pk.mirrored(pk.local(rise, frame - lie))
        end = spec["frames"] - spec["settle"]
        if frame > end:
            local = pk.mix(local, standing.local(stand, 0.0), smooth((frame - end) / spec["settle"]))
        return pk.world(local)

    def _knock_shield(self, frame, frames, spec=KNOCK):
        """The shield in knockdown: up to meet the horse, driven back on
        him, lying on his chest and belly while he is down, over his thighs
        while he sits up (as in die), up in guard once he is on his feet,
        as in idle at the end."""
        carry = SHIELD_CARRY
        impact, lie = spec["impact"], spec["lie"]
        land = spec["keys"][1][0]
        if frame <= impact - 2:
            return blend_carry(carry["rest"], carry["block"], smooth(frame / (impact - 2)))
        if frame <= impact:
            return carry["block"]
        if frame <= impact + 3:
            return blend_carry(carry["block"], carry["jolt"], smooth((frame - impact) / 3.0))
        shield = blend_carry(carry["jolt"], carry["fall"], smooth((frame - impact - 3) / (land - impact - 3)))
        shield = blend_carry(shield, carry["lying"], smooth((frame - land + 4) / 8.0))
        if frame >= land:
            chest_up = max(0.0, (self.poser.turned("spine_03") @ Vector((0.0, 0.0, 1.0))).z)
            shield = blend_carry(shield, carry["seated"], smooth(self._down * 3.0) * smooth((chest_up - 0.3) / 0.4))
        if frame >= lie:
            shield = blend_carry(shield, carry["guard"], smooth((0.6 - self._down) / 0.4))
        end = frames - spec["settle"]
        if frame > end:
            shield = blend_carry(shield, carry["rest"], smooth((frame - end) / spec["settle"]))
        return shield

    def _knock_weapon(self, frame, frames):
        """The weapon in knockdown: carried while he stands; lying level
        in line with the forearm while he is down (it would go into the
        ground, or stand up out of him, if it were carried). A carry that
        puts the wrist somewhere (a long spear held upright: SPEAR_CARRY)
        does so only as he stands: down, the arm is the library's, pushing
        on the ground."""
        p = self.p
        carry = self.kit.carry
        t = smooth((self._down - 0.15) / 0.5)
        if "wrist" in carry and self.arms.weapon_axis is not None:
            if t < 1.0:
                turn, origin = self.arms.chest(carry["follow"])
                shoulder = p.head("upperarm_r")
                wrist = p.head("hand_r").lerp(origin + turn @ _vec(carry["wrist"]), 1.0 - t)
                elbow = (p.head("lowerarm_r") - shoulder).lerp(turn @ _vec(carry["elbow"]), 1.0 - t)
                self.arms.hand("r", wrist, elbow, turn @ _vec(carry["aim"]).normalized(),
                               turn @ _vec(carry["up"]).normalized())
        else:
            self.arms.hold(carry)
        if t <= 0.0 or self.arms.weapon_axis is None:
            return
        before = p.matrix["hand_r"].to_3x3()
        if self.kit.lie_flat:
            # A long spear: lying along his right side towards his feet (and
            # forwards as he gets up), whichever way the forearm turns, or it
            # would sweep round through his legs.
            level = Vector((-0.35, -1.0, 0.0))
        else:
            along = p.direction("lowerarm_r", "hand_r")
            level = Vector((along.x, along.y, 0.0))
            if level.length < 0.3:
                ahead = p.turned("spine_03") @ Vector((0.0, -1.0, 0.0))
                level = level + Vector((ahead.x, ahead.y, 0.0)) * (0.3 - level.length)
        p.orient("hand_r", (self.arms.weapon_axis, self.arms.back_r), (level.normalized(), Vector((0.0, 0.0, 1.0))))
        after = p.matrix["hand_r"].to_3x3()
        p.set_rotation("hand_r", before.to_quaternion().slerp(after.to_quaternion(), t).to_matrix())
        self.arms._twist("r")

    def _knock_sling(self):
        """The pouch of the sling (SlingCord) hangs from the fist while he
        stands; while he is down it falls away to his right side, not
        straight down through his chest, and lies along the ground beside
        him."""
        turn = self.p.turned("spine_03")
        ahead = turn @ Vector((0.0, -1.0, 0.0))
        t = smooth((self._down - 0.1) / 0.4)
        if t <= 0.0:
            self.sling.hang(ahead)
            return
        right = turn @ Vector((-1.0, 0.0, 0.0))
        down = Vector((0.0, 0.0, -1.0))
        side = Vector((right.x, right.y, 0.0))
        side = side.normalized() if side.length > 1e-6 else right
        hang = (down * 0.98 + ahead * 0.2).normalized()
        self.sling.place(slerp_direction(hang, (side + down * 0.5).normalized(), t))

    def _raise_hand(self, side, height):
        """Raise a wrist by `height` (IK, the elbow bending the way it
        did), the hand keeping its turn."""
        p = self.p
        hand, lower, upper = f"hand_{side}", f"lowerarm_{side}", f"upperarm_{side}"
        turn = p.matrix[hand].to_3x3()
        p.limb(upper, lower, hand, p.head(hand) + Vector((0.0, 0.0, height)), p.head(lower) - p.head(upper))
        p.set_rotation(hand, turn)
        self.arms._twist(side)

    def knockdown(self, spec=KNOCK):
        """Bowled over by a horse, and up again (KNOCK). A man in armour
        lies higher than the library's mannequin, and his shield is bigger
        than anything the mannequin holds: the clip is posed a few times
        over (KNOCK_PASSES), measuring the lowest point of each part of him
        in each frame (Skin), and wherever one would go into the ground
        that part is raised, smoothly from frame to frame: the body by the
        hips, the feet and shins by the ankles, what a hand holds by the
        wrist."""
        rt = self.retarget(spec["fall"][0])
        frames = spec["frames"]
        sources = [self.knock_source(f, spec) for f in range(frames + 1)]
        lift = {part: np.zeros(frames + 1) for part in KNOCK_GROUND}

        def pose_at(frame):
            source = sources[frame]
            rt.hips_shift = np.array((0.0, 0.0, lift["body"][frame]))
            rt.ankle_lift = lift["feet"][frame]
            try:
                rt.pose(source)
            finally:
                rt.hips_shift = rt.ankle_lift = None
            self._down = 1.0 - rt.upright(source)
            if self.kit.shield:
                self.arms.shield(self._knock_shield(frame, frames, spec))
            self._knock_weapon(frame, frames)
            for side, part in (("l", "left"), ("r", "right")):
                if lift[part][frame] > 0.0:
                    self._raise_hand(side, lift[part][frame])
            if self.sling is not None:
                self._knock_sling()
            if self.kit.spare:
                self.spare()

        # None at the first and last frames, which are idle's.
        taper = np.array([min(smooth(f / 3.0), smooth((frames - f) / 4.0)) for f in range(frames + 1)])
        skin = Skin(self.armature)
        body_rounds = 0
        for round_ in range(KNOCK_PASSES + 1):
            lows = []
            for frame in range(frames + 1):
                pose_at(frame)
                lows.append(skin.lowest(self.poser))
            needs = {part: np.array([max(ground - low[part], 0.0) if low[part] is not None else 0.0 for low in lows])
                     for part, ground in KNOCK_GROUND.items()}
            low = {part for part, need in needs.items() if (need >= 0.003).any()}
            if round_ == KNOCK_PASSES or not low:
                break
            # The body first: raising it raises what the hands hold.
            first = low & {"body", "feet"} if body_rounds < KNOCK_BODY_PASSES else set()
            body_rounds += bool(first)
            for part in sorted(first or low, key=list(KNOCK_GROUND).index):
                need = needs[part]
                need[need < 0.003] = 0.0
                # Raised a little early and let down a little late.
                wide = np.array([need[max(f - 3, 0):f + 4].max() for f in range(frames + 1)])
                kernel = np.array((1.0, 2.0, 3.0, 2.0, 1.0)) / 9.0
                lift[part] += np.maximum(np.convolve(np.pad(wide, 2, mode="edge"), kernel, mode="valid"), need) * taper
        self.knock_lift = {part: float(v.max()) for part, v in lift.items()}
        self.knock_lowest = {part: min((low[part] for low in lows if low[part] is not None), default=None)
                             for part in KNOCK_GROUND}
        self.knock_lows = lows
        self.knock_lifts = lift
        return self.clip("knockdown", frames, pose_at, loop=LOOPS["knockdown"])

    def build(self):
        actions = [
            self.base("idle", "rest"),
            self.base("walk", "march"),
            self.base("run", "run"),
            self.die(),
            ATTACKS[self.kit.attack](self),
            self.jog(),             # after the first five: they come out as they did without it
        ]
        if self.kit.attack not in THROWN:
            actions += [self.block(), self.hit()]       # and so do the six before these two
        actions.append(self.knockdown())                # and every clip before this one
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


def _extension(rt, source, frames, side="r"):
    """How far the source's hand is from its shoulder at each frame, 0 at
    the nearest and 1 at the furthest: the timing of a punch or a throw."""
    reach = []
    for frame in range(frames + 1):
        s = rt.sample(source, frame)
        reach.append(np.linalg.norm(rt.pack.head(s, f"hand_{side}") - rt.pack.head(s, f"upperarm_{side}")))
    reach = np.array(reach)
    return (reach - reach.min()) / max(reach.max() - reach.min(), 1e-6)


def _stroke(b, source, guard, strike, shield=("guard", "punch"), follow=0.25, lead=3, pack="ual1", calm=None):
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
        rt.pose(rt.sample(source, frame, calm) if calm else rt.sample(source, frame))
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


def _cut(b, source, raised, level, down, shield=("guard", "guard"), follow=0.3, lead=3, pack="ual2", calm=None,
         settle=4):
    """An overhead cut: as _stroke, the right hand goes from `raised` to
    `level` as the source's right hand reaches out, so the blade is furthest
    forwards (the moment the scene takes for the blow landing:
    UnitModel.strike) when it is level, at the height of the top of a
    shield; from there it goes on down to `down` over `settle` frames,
    and comes back to `raised` as the source's hand comes back."""
    rt = b.retarget(pack)
    frames = rt.pack.clip(source).frames
    reach = _extension(rt, source, frames)
    peak = int(np.argmax(reach))

    def pose_at(frame):
        rt.pose(rt.sample(source, frame, calm) if calm else rt.sample(source, frame))
        e = smooth(reach[frame])
        if b.kit.shield:
            ahead = smooth(reach[min(frame + lead, frames)])
            b.arms.shield(blend_carry(SHIELD_CARRY[shield[0]], SHIELD_CARRY[shield[1]], ahead))
        if frame <= peak:
            end = level
        else:
            d = smooth((frame - peak) / settle)
            end = {key: lerp(level[key], down[key], d) for key in level}
        s = {key: lerp(raised[key], end[key], e) for key in raised}
        turn, origin = b.arms.chest(follow)
        b.arms.hand("r", origin + turn @ _vec(s["wrist"]), turn @ _vec(s["elbow"]),
                    turn @ _vec(s["aim"]).normalized(), turn @ _vec(s["up"]).normalized())

    return b.clip("attack", frames, pose_at)


def sword_slash(b):
    """A downward cut with a long sword: raised over the right shoulder,
    the blade back and up, then brought over and forwards; it is furthest
    forwards with the blade level at the height of the top of a shield (the
    moment the scene takes for the blow landing), then goes on down and a
    little across, the shield held up. Polybius 2.33: the Gauls' swords cut
    only, with a long swing. Body: OverhandThrow (UAL 2) at half its lunge;
    the hand is up while the library's arm is drawn back to throw and
    forwards when it is stretched out (_cut). The library's lunge bends
    the trunk forwards at that moment, so `level` points up in the chest's
    frame; in the clip the blade is then at 1.27-1.42 m, the top of a
    Roman's shield at 1.38 m (1.58 m raised to block). T-047; before, the
    cut was furthest forwards with the blade already down beside the
    shield."""
    raised = dict(wrist=(-0.20, 0.04, 0.30), aim=(-0.25, 0.55, 0.80), up=(-1.0, 0.0, 0.1), elbow=(-1.0, 0.2, 0.4))
    level = dict(wrist=(-0.14, -0.46, 0.62), aim=(0.10, -0.84, 0.52), up=(-1.0, 0.0, 0.3), elbow=(-1.0, 0.25, 0.05))
    down = dict(wrist=(-0.10, -0.32, -0.18), aim=(0.18, -0.70, -0.68), up=(-1.0, 0.0, 0.25), elbow=(-1.0, 0.4, -0.5))
    return _cut(b, "OverhandThrow", raised, level, down, follow=0.3, pack="ual2", calm=CALM_THROW)


# The library's throw is a big lunge; a man in a line throws with less of
# his body. Trunk and legs keep this much of its motion.
TRUNK_BONES = ("pelvis", "spine_01", "spine_02", "spine_03", "neck_01", "Head")
LEG_BONES = ("thigh_l", "calf_l", "foot_l", "ball_l", "thigh_r", "calf_r", "foot_r", "ball_r")
CALM_THROW = {bone: 0.5 for bone in TRUNK_BONES + LEG_BONES}
# Throwing in a tunic: the legs keep less still, or the forward thigh goes
# through the front of the skirt (javelin-throw, sling).
CALM_THROW_SKIRT = dict(CALM_THROW, **{bone: 0.25 for bone in LEG_BONES})


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
        rt.pose(rt.sample(source, frame, CALM_THROW_SKIRT))
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
        rt.pose(rt.sample(source, frame, CALM_THROW_SKIRT))
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
    "sword-slash": sword_slash,
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
