"""Cavalry models (T-022): a rider on lane 2's horse, in one file.

The contract (docs/ARCHITECTURE.md, "Kỵ binh"): one skeleton, the rider's
67 bones and the horse's 40 (107 in all); LOD0 at most 8 000 triangles for
both; one material, so one atlas; the clips of every unit model (idle,
walk, jog, run, attack, die, and block and hit of the fight hand to hand),
none with root motion.

The rider is built like a foot soldier (whp_build: stages source, kit and
rig, from the unit module). Then, instead of the foot soldier's stages:

  anim    The rider's fall is made first, as a foot soldier's die on the
          ground (whp_clips), and kept as poses. Then `mount`: the horse
          (art/build/horse/horse.blend, from horse_build.py) is appended,
          its armature, its detailed meshes and its clips; the rider's rest
          pose is lifted onto the horse's back, the two armatures are
          joined, and the rider's roots (pelvis, ik_foot_root, ik_hand_root)
          hang from the horse's saddle bone. Every clip is then keyed on all
          107 bones: the horse's bones from its own clips, the rider's from
          `RiderPoser`, which builds the seated man in the frame of the
          saddle at rest and carries him with the saddle.
  lod     The rider's parts (unit.PARTS) and the horse's (horse_lod, with
          the tack of this kind of horseman) share one atlas, baked in one
          go; the rider and the horse each bake their ambient occlusion on
          their own (at rest the rider stands through the horse's back).
  export  As a foot soldier, with 107 bones and the ground checks below.

Clips (horse | rider):

    idle    standing (horse idle)       | seated, breathing, looking about
    walk    walk                        | seated, swaying with the horse
    jog     trot                        | sitting the trot (no stirrups in
                                        |   216 BCE: no rising), the trunk
                                        |   taking the bumps
    run     gallop (run)                | leaning forwards with the stride
    attack  standing, shifting a little | spear thrust overarm, or javelin
                                        |   throw (Rider.attack)
    die     falls, rolls on its right   | goes down with the horse, is thrown
                                        |   off to the side the horse rolls
                                        |   to and lies still beside it
    block   standing, starts a little   | brings the shield up before him
                                        |   to meet the blow, it is driven
                                        |   back on him, he sits up again
    hit     standing, throws its head   | the blow gets through: thrown
                                        |   back and round in the seat, the
                                        |   head goes down, he sits up again

Axes as everywhere: metres, X to the figure's left, -Y forwards, Z up.
"""

import math
import os
import re

import bpy
import numpy as np
from mathutils import Matrix, Quaternion, Vector
from mathutils.bvhtree import BVHTree

import horse_lod
import horse_rig
import whp_clips
import whp_far
import whp_skeleton
import whp_unit_lod as ul
from whp_anim import FPS, Poser, action_fcurves, finish_action, new_action, smooth
from whp_common import BUILD_DIR, delete_objects, deselect_all, log, select_only, triangle_count
from whp_retarget import KEYED

HORSE_BLEND = os.path.join(BUILD_DIR, "horse", "horse.blend")
HORSE_RIG = horse_rig.RIG_NAME
SADDLE = horse_rig.SADDLE_BONE
RIDER_ROOTS = ("pelvis", "ik_foot_root", "ik_hand_root")
BONES = 67 + 40             # the rider's, and the horse's 40 (horse_rig.BONES and the saddle bone)
HORSE_DETAILED = {"body": horse_rig.BODY_NAME, "mane": "horse-mane", "tail": "horse-tail",
                  "mane_far": "horse-mane-far", "tail_far": "horse-tail-far",
                  "cloth": "horse-cloth", "bridle": "horse-bridle", "neckrope": "horse-neckrope"}
# Clip of the cavalry model <- the horse's clip.
HORSE_CLIP = {"idle": "idle", "walk": "walk", "jog": "trot", "run": "run", "die": "die"}
SEAT_CLOTH = 0.014          # the seat point lies on the saddle cloth, this thick (horse_kit.build_cloth)

# Reimported .glb, LOD0 lowest and highest point, metres (whp_export.GROUND_CHECKS).
GROUND_CHECKS = (
    ("idle", 0, (-0.03, 0.03), (2.0, 3.8)),         # hooves on the ground; the rider's head or spear on top
    ("walk", 0, (-0.04, 0.04), (2.0, 3.8)),
    ("die", "last", (-0.05, 0.05), (0.3, 1.0)),     # horse and rider lying, nothing through the ground
)


class Horse:
    """The horse a kind of horseman rides (unit.HORSE).

    tack:    which of the horse's tack meshes it wears besides mane and
             tail: "cloth" (saddle cloth and girth), "bridle", "neckrope"
    scale:   size against lane 2's horse (1.40 m at the withers)
    cloth:   None, or (colour, border colour) for the saddle cloth (linear)
    uv:      texel density of the horse against the rider's parts (whp_lod
             weights); the coat is plain, the rider needs the texels
    """

    def __init__(self, tack=("cloth", "bridle"), scale=1.0, cloth=None, uv=0.62):
        self.tack = tuple(tack)
        self.scale = scale
        self.cloth = cloth
        self.uv = uv

    @property
    def parts(self):
        return ("mane", "tail") + self.tack


class Rider:
    """How the man rides (unit.RIDER).

    attack:   "spear-thrust" (overarm) or "javelin-throw"
    reins:    True if the left hand holds the reins (the bridle's ends)
    shield:   "forearm" (slung on the left forearm: it hangs from
              whp_clips.SPARE_BONE, which follows the forearm), "hand" (in
              the left fist, the arm solved as a foot soldier's, SHIELD_CARRY
              style dicts below), or None
    carry:    how the weapon in the right fist is carried, per clip
              (whp_clips.Arms.hold dicts; "default" for clips not listed)
    """

    def __init__(self, attack="spear-thrust", reins=True, shield="forearm", carry=None, shield_carry=None,
                 lean=None, thigh=(0.47, -0.62, -0.63), calf=(-0.05, 0.16, -0.99), foot=(30.0, 14.0)):
        self.attack = attack
        self.reins = reins
        self.shield = shield
        self.carry = carry or {"default": SPEAR_UP, "run": SPEAR_FORWARD}
        self.shield_carry = shield_carry or RIDE_SHIELD
        self.lean = dict(LEAN, **(lean or {}))
        self.thigh = thigh            # direction of the left thigh from the hip (the right one mirrored)
        self.calf = calf              # direction of the left shin from the knee
        self.foot = foot              # toes down and out, degrees


# Weapon carried in the right fist (chest frame: see whp_clips.SPEAR_CARRY):
# a spear standing up and a little forwards beside the horse's shoulder, or
# held forwards at the gallop.
SPEAR_UP = dict(wrist=(-0.27, -0.22, -0.36), elbow=(-0.6, 0.7, -0.3),
                aim=(-0.06, -0.42, 0.90), up=(-1.0, 0.1, 0.0), follow=0.6)
SPEAR_FORWARD = dict(wrist=(-0.27, -0.26, -0.33), elbow=(-0.6, 0.7, -0.3),
                     aim=(-0.06, -0.80, 0.60), up=(-1.0, 0.1, 0.0), follow=0.6)
JAVELIN_UP = dict(wrist=(-0.26, -0.24, -0.34), elbow=(-0.6, 0.7, -0.3),
                  aim=(-0.05, -0.55, 0.83), up=(-1.0, 0.1, 0.0), follow=0.6)
# A shield in the left fist (shield="hand"), in front of the left hip.
RIDE_SHIELD = dict(wrist=(0.25, -0.30, -0.28), down=(0.05, -0.30, -1.0), out=(0.55, -0.83, 0.0),
                   elbow=(1.0, 0.35, -0.4), follow=0.5)

# Lean of the trunk (degrees forwards), how much of the saddle's turn the
# trunk takes back (0: none, 1: all, it keeps upright), and how much it
# bends with the saddle's rise and fall (degrees per metre, a frame late).
LEAN = {
    "idle": (0.0, 0.0, 0.0),
    "walk": (2.0, 0.5, 30.0),
    "jog": (4.0, 0.7, 90.0),
    "run": (13.0, 0.6, 60.0),
    "attack": (0.0, 0.0, 0.0),
    "die": (0.0, 0.5, 0.0),
    "block": (0.0, 0.0, 0.0),
    "hit": (0.0, 0.0, 0.0),
}
PELVIS_TILT = 8.0           # degrees the pelvis tips back from upright (seated on the seat bones)
SEAT_CLEAR = 0.004          # the seat of the breeches this far above the seat point

ATTACK_FRAMES = {"spear-thrust": 30, "javelin-throw": 40}       # as the foot soldiers' (whp_clips.ATTACKS)


# --------------------------------------------------------------------------
# Poses read from actions
# --------------------------------------------------------------------------

_PATH = re.compile(r'pose\.bones\["(.+)"\]\.(rotation_quaternion|location|scale)')


def bone_order(armature):
    """Bone names, parents before children."""
    bones = armature.data.bones
    order, seen = [], set()

    def visit(bone):
        if bone.name in seen:
            return
        if bone.parent is not None:
            visit(bone.parent)
        seen.add(bone.name)
        order.append(bone.name)

    for bone in bones:
        visit(bone)
    return order


def action_pose(armature, action, names=None, scale=1.0):
    """Armature-space matrices of the bones `names` (default all) in every
    frame of an action keyed on every frame: {bone: [4x4 numpy] * (frames
    + 1)}, worked out from the keys (no scene evaluation). `scale` scales
    the keyed locations (a horse made smaller after its clips were keyed)."""
    end = int(round(action.frame_range[1]))
    keys = {}
    for fc in action_fcurves(action):
        m = _PATH.match(fc.data_path)
        if m:
            keys[(m.group(1), m.group(2), fc.array_index)] = [fc.evaluate(f) for f in range(end + 1)]
    bones = armature.data.bones
    rest = {b.name: np.array(b.matrix_local) for b in bones}
    order = [n for n in bone_order(armature) if names is None or n in names]
    pose = {}
    for name in order:
        parent = bones[name].parent
        rel = rest[name] if parent is None else np.linalg.inv(rest[parent.name]) @ rest[name]
        frames = []
        for f in range(end + 1):
            q = [keys.get((name, "rotation_quaternion", i), [1.0 if i == 0 else 0.0] * (end + 1))[f] for i in range(4)]
            loc = [keys.get((name, "location", i), [0.0] * (end + 1))[f] * scale for i in range(3)]
            sc = [keys.get((name, "scale", i), [1.0] * (end + 1))[f] for i in range(3)]
            basis = np.eye(4)
            basis[:3, :3] = np.array(Quaternion(q).normalized().to_matrix()) @ np.diag(sc)
            basis[:3, 3] = loc
            above = pose[parent.name][f] if parent is not None and parent.name in pose else np.eye(4)
            frames.append(above @ rel @ basis)
        pose[name] = frames
    return pose


class Skin:
    """Some vertices of meshes skinned to an armature, to follow through
    poses with numpy (as whp_clips.Soles does for the soles)."""

    def __init__(self, objs, select=None):
        found = []
        for obj in objs:
            mesh = obj.data
            co = np.empty(len(mesh.vertices) * 3)
            mesh.vertices.foreach_get("co", co)
            m = np.array(obj.matrix_world)
            co = co.reshape(-1, 3) @ m[:3, :3].T + m[:3, 3]
            mask = select(co) if select is not None else np.ones(len(co), dtype=bool)
            group = {g.index: g.name for g in obj.vertex_groups}
            for i in np.flatnonzero(mask):
                weights = [(group[g.group], g.weight) for g in mesh.vertices[i].groups if g.weight > 0.0]
                total = sum(w for _b, w in weights)
                if total > 0.0:
                    weights.sort(key=lambda bw: -bw[1])
                    found.append((co[i], [(b, w / total) for b, w in weights[:4]]))
        self.rest = np.array([p for p, _w in found]).reshape(-1, 3)
        self.bones = sorted({b for _p, w in found for b, _x in w})
        column = {b: i for i, b in enumerate(self.bones)}
        self.weights = np.zeros((len(found), len(self.bones)))
        for k, (_p, w) in enumerate(found):
            for b, x in w:
                self.weights[k, column[b]] = x

    def __len__(self):
        return len(self.rest)

    def at(self, skin):
        """Positions (n, 3) for skin matrices {bone: pose @ rest^-1}."""
        p = np.c_[self.rest, np.ones(len(self.rest))]
        out = np.zeros((len(self.rest), 3))
        for k, bone in enumerate(self.bones):
            out += self.weights[:, k:k + 1] * (p @ np.asarray(skin[bone])[:3, :].T)
        return out


def poser_skin(poser):
    return {name: np.array(poser.matrix[name] @ poser.rest[name].inverted()) for name in poser.names}


# --------------------------------------------------------------------------
# Mounting: the horse appended, the two armatures joined
# --------------------------------------------------------------------------

class Mount:
    """The joined armature and what the clips need to know of the horse."""

    def __init__(self, armature, horse_names, rider_names, clips, lift, seat, horse):
        self.armature = armature
        self.horse_names = horse_names      # horse bones, parents first
        self.rider_names = rider_names      # rider bones, parents first
        self.clips = clips                  # horse clip -> {bone: [4x4] per frame} (armature space)
        self.lift = lift                    # how far the rider's rest pose was lifted
        self.seat = seat                    # where the rider sits, at rest (top of the cloth or of the back)
        self.horse = horse


def horse_keys(horse):
    """The horse's pieces a model takes from the horse's file: the body,
    mane and tail, its tack; from the "hi" horse also the plain far mane
    and tail (horse_lod.FAR)."""
    far = horse_lod.FAR if HORSE_BLEND.endswith("-hi.blend") else ()
    return ("body",) + horse.parts + far


def _append_horse(horse):
    if not os.path.isfile(HORSE_BLEND):
        raise SystemExit(f"{HORSE_BLEND} is missing: build the horse first (art/blender/horse_build.py)")
    wanted = [HORSE_RIG] + [HORSE_DETAILED[k] for k in horse_keys(horse)]
    clips = sorted(set(HORSE_CLIP.values()))
    with bpy.data.libraries.load(HORSE_BLEND, link=False) as (src, dst):
        missing = [n for n in wanted if n not in src.objects] + [n for n in clips if n not in src.actions]
        if missing:
            raise SystemExit(f"{HORSE_BLEND} lacks {missing}: rebuild the horse")
        dst.objects = list(wanted)          # (Blender fills these lists in place with the datablocks)
        dst.actions = list(clips)
    objs = {o.name: o for o in dst.objects}
    for obj in objs.values():
        bpy.context.scene.collection.objects.link(obj)
    actions = {}
    for name, action in zip(clips, dst.actions):
        action.name = f"horse-{name}"
        actions[name] = action
    rig = objs[HORSE_RIG]
    meshes = [objs[HORSE_DETAILED[k]] for k in horse_keys(horse)]
    for obj in meshes:
        obj.hide_render = False
        obj.hide_set(False)
    return rig, meshes, actions


def _edit_bones(armature, change):
    select_only(armature)
    bpy.ops.object.mode_set(mode="EDIT")
    change(armature.data.edit_bones)
    bpy.ops.object.mode_set(mode="OBJECT")


def _move_vertices(obj, change):
    mesh = obj.data
    co = np.empty(len(mesh.vertices) * 3)
    mesh.vertices.foreach_get("co", co)
    mesh.vertices.foreach_set("co", change(co.reshape(-1, 3)).ravel())
    mesh.update()


def _recolour_cloth(obj, colours):
    """Give the saddle cloth other colours: its wool and its border, kept
    as the colour attribute the bake reads (horse_kit.COAT_ATTR)."""
    import horse_kit

    attr = obj.data.attributes[horse_kit.COAT_ATTR]
    values = np.empty(len(attr.data) * 4, dtype=np.float32)
    attr.data.foreach_get("color", values)
    values = values.reshape(-1, 4)
    for old, new in ((horse_kit.WOOL, colours[0]), (horse_kit.WOOL_BORDER, colours[1])):
        near = np.abs(values[:, :3] - np.array(old)).max(axis=1) < 0.004
        values[near, :3] = new
    attr.data.foreach_set("color", values.ravel())


def mount(unit, rider):
    """Append the horse, lift the rider onto it, join the armatures (see
    the module's docstring). Returns a Mount."""
    horse = unit.HORSE
    rider_meshes = [o for o in bpy.data.objects if o.type == "MESH" and o.parent is rider]
    rider_names = bone_order(rider)
    rig, horse_meshes, actions = _append_horse(horse)
    if horse.cloth is not None and "cloth" in horse.tack:
        _recolour_cloth(bpy.data.objects[HORSE_DETAILED["cloth"]], horse.cloth)

    s = horse.scale
    if s != 1.0:
        def scale_bones(edit):
            for eb in edit:
                eb.head *= s
                eb.tail *= s
        _edit_bones(rig, scale_bones)
        for obj in horse_meshes:
            _move_vertices(obj, lambda co: co * s)
    horse_names = bone_order(rig)
    clips = {name: action_pose(rig, action, scale=s) for name, action in actions.items()}
    for action in actions.values():
        bpy.data.actions.remove(action)

    seat = np.array(rig["whp_seat"], dtype=np.float64) * s
    if "cloth" not in horse.tack:
        seat[2] -= SEAT_CLOTH
    # Lift the rider's rest pose: the pelvis over the seat, the hips about
    # where they come when he sits (the clips place him exactly).
    pelvis = np.array(rider.data.bones["pelvis"].head_local)
    lift = np.array((0.0, seat[1] - pelvis[1], seat[2] + 0.13 - pelvis[2]))
    d = Vector(lift)

    def lift_bones(edit):
        for eb in edit:
            eb.head += d
            eb.tail += d
    _edit_bones(rider, lift_bones)
    for obj in rider_meshes:
        _move_vertices(obj, lambda co: co + lift)

    rider["whp_rider_lift"] = [float(x) for x in lift]
    rider["whp_seat"] = [float(x) for x in seat]
    select_only([rider, rig], active=rider)
    bpy.ops.object.join()
    for obj in horse_meshes:
        whp_skeleton.bind(obj, rider)

    def hang(edit):
        for name in RIDER_ROOTS:
            edit[name].parent = edit[SADDLE]
            edit[name].use_connect = False
    _edit_bones(rider, hang)
    for pb in rider.pose.bones:
        pb.rotation_mode = "QUATERNION"
    count = len(rider.data.bones)
    log(f"mounted: {len(rider_names)} rider bones + {len(horse_names)} horse bones = {count}; rider lifted "
        f"{np.round(lift, 3).tolist()} m; seat {np.round(seat, 3).tolist()}; horse scale {s}")
    if count != BONES:
        raise RuntimeError(f"joined armature has {count} bones, expected {BONES}")
    return Mount(rider, horse_names, rider_names, clips, lift, seat, horse)


# --------------------------------------------------------------------------
# The rider's poses
# --------------------------------------------------------------------------

def _mirror(v, side):
    return Vector((v[0] if side == "l" else -v[0], v[1], v[2]))


def _slerp_matrix(a, b, t):
    """Blend two 4x4 Matrices: rotation slerped, translation mixed."""
    qa, qb = a.to_quaternion(), b.to_quaternion()
    m = qa.slerp(qb, t).to_matrix().to_4x4()
    m.translation = a.translation.lerp(b.translation, t)
    return m


def _partial(rotation, t):
    """A share t of a rotation (3x3 Matrix), as a 3x3 Matrix."""
    return Quaternion().slerp(rotation.to_quaternion(), t).to_matrix()


class RiderPoser:
    """Builds the clips of a cavalry model on the joined armature."""

    def __init__(self, mount, unit):
        self.m = mount
        self.unit = unit
        self.rider = unit.RIDER
        self.armature = mount.armature
        self.p = Poser(mount.armature)
        self.arms = whp_clips.Arms(self.p)
        self.saddle_rest = self.p.rest[SADDLE].copy()
        self.lengths = {}
        for side in ("l", "r"):
            r = self.p.rest
            self.lengths[side] = ((r[f"calf_{side}"].translation - r[f"thigh_{side}"].translation).length,
                                  (r[f"foot_{side}"].translation - r[f"calf_{side}"].translation).length)
        self.p.reset()
        _f, _t, self.back_l = self.p.hand_axes("l")
        self.fingers_l = _f.copy()
        self.keyed = list(KEYED)
        self.located = ["pelvis"] + list(mount.horse_names)
        self.scaled = []
        if self.rider.shield == "forearm":
            self.keyed.append(whp_clips.SPARE_BONE)
            self.located.append(whp_clips.SPARE_BONE)
        self.keyed += list(mount.horse_names)
        self._reins = None
        if self.rider.reins:
            bridle = bpy.data.objects[HORSE_DETAILED["bridle"]]
            ends = [np.array((0.05 * sx, -0.616, 1.565)) * mount.horse.scale for sx in (1, -1)]
            self._reins = Skin([bridle], lambda co: np.min([np.linalg.norm(co - e, axis=1) for e in ends], axis=0) < 0.03)
            log(f"reins: {len(self._reins)} vertices at the ends")
        self.seat_z = None
        self.spare_ref = None
        self.strides = {}
        self.meshes = [o for o in bpy.data.objects if o.type == "MESH" and o.parent is self.armature
                       and not o.hide_render and not o.name.startswith("horse")]
        self.shield_centre = None
        if self.rider.shield == "forearm":
            shield = bpy.data.objects[unit.SHIELD_MESH]
            co = np.empty(len(shield.data.vertices) * 3)
            shield.data.vertices.foreach_get("co", co)
            self.shield_centre = Vector(co.reshape(-1, 3).mean(axis=0))

    # -- the seated man, in the frame of the saddle at rest ---------------

    def seat(self):
        """Pelvis on the seat, legs round the barrel (Rider.thigh, .calf, .foot)."""
        p = self.p
        r = self.rider
        seat = Vector(self.m.seat)
        if self.seat_z is None:
            self.seat_z = self._find_seat_height()
        p.rotate("pelvis", "X", -PELVIS_TILT)
        p.place("pelvis", Vector((0.0, seat.y, self.seat_z)))
        for side in ("l", "r"):
            thigh_len, calf_len = self.lengths[side]
            hip = p.head(f"thigh_{side}")
            knee = hip + _mirror(r.thigh, side).normalized() * thigh_len
            ankle = knee + _mirror(r.calf, side).normalized() * calf_len
            p.limb(f"thigh_{side}", f"calf_{side}", f"foot_{side}", ankle, knee - (hip + ankle) / 2)
            sign = 1.0 if side == "l" else -1.0
            pitch, yaw = r.foot
            turn = Quaternion((0.0, 0.0, 1.0), math.radians(yaw * sign)) @ Quaternion((1.0, 0.0, 0.0), math.radians(pitch))
            p.keep_rest_orientation(f"foot_{side}", turn)
        # The trunk upright again over the tipped pelvis.
        self.bend(PELVIS_TILT)

    def _find_seat_height(self):
        """Height of the pelvis bone for which the seat of the body (the
        legs' mesh near the middle line, over the seat point) rests on it."""
        p = self.p
        seat = self.m.seat
        legs = [o for o in bpy.data.objects if o.type == "MESH" and o.name in self.unit.SEAT_MESHES]
        p.reset()
        start = p.head("pelvis").z
        p.rotate("pelvis", "X", -PELVIS_TILT)
        p.place("pelvis", Vector((0.0, seat[1], start)))
        skin = Skin(legs, lambda co: (np.abs(co[:, 0]) < 0.07) & (np.abs(co[:, 1] - seat[1] + 0.0) < 0.14)
                    & (co[:, 2] < start - 0.02) & (co[:, 2] > start - 0.40))
        pts = skin.at(poser_skin(p))
        low = float(pts[:, 2].min())
        z = start + (seat[2] + SEAT_CLEAR - low)
        log(f"seat: {len(skin)} vertices of the seat; pelvis bone at {z:.3f} m (seat point {seat[2]:.3f} m)")
        p.reset()
        return z

    def bend(self, degrees, axis="X"):
        """Turn the trunk about an axis through the spine, spread over the
        three spine bones (degrees: forwards about X, to the left about Z)."""
        for name in ("spine_01", "spine_02", "spine_03"):
            self.p.rotate(name, axis, degrees / 3.0)

    def level_head(self, degrees):
        """Tip the neck and head back by `degrees` (the trunk leaned that far)."""
        self.p.rotate("neck_01", "X", -degrees * 0.4)
        self.p.rotate("head", "X", -degrees * 0.4)

    # -- arms --------------------------------------------------------------

    def reins_at(self, skin):
        """Middle of the two rein ends in a pose of the horse (armature space)."""
        return Vector(self._reins.at(skin).mean(axis=0))

    def left_on_reins(self, target):
        """Left fist round the reins at `target` (in the rest frame of the saddle)."""
        p = self.p
        wrist = target + Vector((0.025, 0.075, 0.035))
        p.limb("upperarm_l", "lowerarm_l", "hand_l", wrist, Vector((1.0, 0.5, -0.6)))
        p.orient("hand_l", (self.fingers_l, self.back_l),
                 (Vector((-0.25, -0.85, -0.45)).normalized(), Vector((0.75, -0.1, 0.65)).normalized()))
        self.arms._twist("l")

    def left_arm(self, wrist, elbow, fingers, back):
        """Left wrist at `wrist`, the elbow towards `elbow`, the fist
        turned so the fingers point along `fingers` and the back of the
        hand faces `back` (all in the rest frame of the saddle)."""
        p = self.p
        p.limb("upperarm_l", "lowerarm_l", "hand_l", wrist, elbow)
        p.orient("hand_l", (self.fingers_l, self.back_l), (Vector(fingers).normalized(), Vector(back).normalized()))
        self.arms._twist("l")

    def right(self, carry):
        self.arms.hold(carry)

    def place_spare(self, ref=False):
        """The shield slung on the left forearm (Rider.shield == "forearm")."""
        if self.rider.shield != "forearm":
            return
        p = self.p
        bone = whp_clips.SPARE_BONE
        if ref or self.spare_ref is None:
            self.spare_ref = (p.matrix["lowerarm_l"].copy(), self._spare_placement())
        arm_ref, spare_ref = self.spare_ref
        p.matrix[bone] = p.matrix["lowerarm_l"] @ arm_ref.inverted() @ spare_ref

    def _spare_placement(self):
        """Where the shield bone goes in the reference pose: the shield
        moved from where it was built (in the left fist at rest) to hang
        outside the left forearm, face out, a little forwards."""
        p = self.p
        arm = self.armature
        down = Vector(arm["whp_shield_down"]).normalized()
        out = Vector(arm["whp_shield_out"]).normalized()
        centre = self.shield_centre
        spec = self.unit.SHIELD_HANG
        elbow, wrist = p.head("lowerarm_l"), p.head("hand_l")
        target = elbow.lerp(wrist, spec["along"]) + Vector(spec["offset"])
        want_out = Vector(spec["out"]).normalized()
        want_down = Vector(spec["down"]).normalized()

        def frame(a, b):
            x = a.normalized()
            y = (b - b.dot(x) * x).normalized()
            m = Matrix((x, y, x.cross(y)))
            m.transpose()
            return m

        turn = frame(want_out, want_down) @ frame(out, down).transposed()
        move = Matrix.Translation(target) @ turn.to_4x4() @ Matrix.Translation(-centre)
        return move @ p.rest[whp_clips.SPARE_BONE]

    # -- one frame ---------------------------------------------------------

    def frame(self, clip, f, horse_pose, extra=None):
        """Pose every bone for frame f of `clip`: the horse from horse_pose
        ({bone: [4x4]}), the rider seated in the saddle's frame and carried
        with it; `extra(self, f)` adds to the rider's pose before that."""
        p = self.p
        p.reset()
        hm = {n: Matrix(horse_pose[n][f].tolist()) for n in self.m.horse_names}
        carry_saddle = hm[SADDLE] @ self.saddle_rest.inverted()
        turn = carry_saddle.to_3x3()
        self.seat()
        lean, keep, bob = self.rider.lean[clip]
        # The trunk takes back some of the saddle's turn (keeps nearer upright).
        if keep:
            back = _partial(turn.inverted(), keep)
            for name in ("spine_01", "spine_02", "spine_03"):
                p._about_head(name, Quaternion().slerp(back.to_quaternion(), 1.0 / 3.0))
        flex = 0.0
        if bob:
            z = np.array([horse_pose[SADDLE][k][2, 3] for k in range(len(horse_pose[SADDLE]))])
            frames = len(z) - 1
            flex = bob * (z[(f - 1) % frames] - z[:frames].mean()) * -1.0
        self.bend(lean + flex)
        self.level_head(lean + flex)
        if extra is not None:
            extra(self, f)
        skin = {n: np.array(hm[n] @ p.rest[n].inverted()) for n in self.m.horse_names}
        if getattr(self, "_left", None) is not None:
            self._left(self, f, carry_saddle.inverted() @ self.reins_at(skin) if self.rider.reins else None)
        elif self.rider.reins:
            target = carry_saddle.inverted() @ self.reins_at(skin)
            self.left_on_reins(target)
        elif self.rider.shield == "hand":
            self.arms.shield(self.rider.shield_carry)
        if getattr(self, "_right", None) is not None:
            self._right(self, f)
        else:
            self.right(self.rider.carry.get(clip, self.rider.carry["default"]))
        self.place_spare()
        for name in self.m.rider_names:
            p.matrix[name] = carry_saddle @ p.matrix[name]
        for n in self.m.horse_names:
            p.matrix[n] = hm[n]

    def key(self, f):
        self.p.key(f, self.keyed, located=tuple(self.located), scaled=tuple(self.scaled))

    def clip(self, name, horse_pose, extra=None, right=None, frames=None, loop=True, pose=None, left=None):
        """Key a clip: frames + 1 keys (a loop's last is its first).
        `right(self, f)` and `left(self, f, reins)` pose an arm instead of
        the way the rider carries his weapon and holds the reins or the
        shield (`reins`: where the reins are, None for a rider without)."""
        count = frames if frames is not None else len(horse_pose[SADDLE]) - 1
        action = new_action(self.armature, name)
        self._right = right
        self._left = left
        for f in range(count + 1):
            k = f % count if loop else f
            if pose is not None:
                pose(self, k)
            else:
                self.frame(name, k, horse_pose, extra)
            self.key(f)
        self._right = None
        self._left = None
        finish_action(self.armature, action, count, loop=loop)
        return action


# --------------------------------------------------------------------------
# Clips
# --------------------------------------------------------------------------

def _keyframes(keys, u):
    """Value at u (0..1) of a list of (u, value) keys, eased between them;
    values are dicts of tuples or numbers."""
    for (u0, a), (u1, b) in zip(keys, keys[1:]):
        if u0 <= u <= u1:
            t = smooth((u - u0) / max(u1 - u0, 1e-9))
            if isinstance(a, dict):
                return {k: tuple(x + (y - x) * t for x, y in zip(a[k], b[k])) if isinstance(a[k], tuple)
                        else a[k] + (b[k] - a[k]) * t for k in a}
            return a + (b - a) * t
    return keys[-1][1]


def _stance(mount, frames, breath=0.6, nod=2.0, toss=None):
    """The horse standing for the attack: the bind stance, breathing once
    and nodding a little with the stroke, looping over `frames`.
    `toss(f)`: degrees the head is thrown up at frame f, on top."""
    rest = {n: np.array(mount.armature.data.bones[n].matrix_local) for n in mount.horse_names}
    bones = mount.armature.data.bones
    basis = {n: [np.eye(4) for _ in range(frames + 1)] for n in mount.horse_names}
    for f in range(frames + 1):
        a = 2.0 * math.pi * f / frames
        for n, sign in (("horse_spine_2", 1.0), ("horse_spine_3", -1.0)):
            basis[n][f] = np.array(Matrix.Rotation(math.radians(breath * math.sin(a) * sign), 4, "X"))
        for n in ("horse_neck_1", "horse_neck_2", "horse_head"):
            angle = nod * math.sin(a + 0.6)
            if toss is not None:
                angle += TOSS_SIGN * toss(f) / 3.0
            basis[n][f] = np.array(Matrix.Rotation(math.radians(angle), 4, "X"))
    pose = {}
    for n in mount.horse_names:
        parent = bones[n].parent
        rel = rest[n] if parent is None else np.linalg.inv(rest[parent.name]) @ rest[n]
        pose[n] = [(pose[parent.name][f] if parent is not None else np.eye(4)) @ rel @ basis[n][f]
                   for f in range(frames + 1)]
    return pose


def idle_extra(rp, f):
    """Breathing, and a look to the left and back over the clip."""
    frames = len(rp.m.clips["idle"][SADDLE]) - 1
    a = 2.0 * math.pi * f / frames
    rp.bend(0.8 * math.sin(2 * a))
    look = 14.0 * math.sin(a) * smooth(abs(math.sin(a)) * 1.5)
    rp.p.rotate("neck_01", "Z", look * 0.4)
    rp.p.rotate("head", "Z", look * 0.6)


# Overarm spear thrust (chest frame of whp_clips.Arms.hand): the spear held
# above the right shoulder pointing forwards and down, drawn back, driven
# forwards past the right of the horse's head, and back.
THRUST = {
    "guard": dict(wrist=(-0.22, 0.00, 0.20), elbow=(-1.0, 0.5, 0.1), aim=(-0.10, -0.95, -0.28), up=(-0.6, 0.1, 0.8)),
    "back": dict(wrist=(-0.24, 0.12, 0.24), elbow=(-1.0, 0.7, 0.1), aim=(-0.10, -0.96, -0.24), up=(-0.6, 0.1, 0.8)),
    "strike": dict(wrist=(-0.20, -0.52, 0.04), elbow=(-1.0, 0.2, -0.2), aim=(-0.14, -0.92, -0.36), up=(-0.6, 0.0, 0.8)),
}
THRUST_KEYS = [(0.0, "guard"), (0.30, "back"), (0.46, "strike"), (0.58, "strike"), (1.0, "guard")]
THRUST_TWIST = [(0.0, -8.0), (0.30, -18.0), (0.46, 16.0), (0.58, 14.0), (1.0, -8.0)]
THRUST_LEAN = [(0.0, 0.0), (0.30, -3.0), (0.46, 10.0), (0.58, 9.0), (1.0, 0.0)]

# Javelin throw: the javelin drawn back over the right shoulder, thrown
# forwards and up, the arm following through; then back to the carry.
THROW = {
    "carry": dict(wrist=(-0.26, -0.24, -0.34), elbow=(-0.6, 0.7, -0.3), aim=(-0.05, -0.55, 0.83), up=(-1.0, 0.1, 0.0)),
    "cocked": dict(wrist=(-0.22, 0.20, 0.18), elbow=(-1.0, 0.6, -0.2), aim=(-0.05, -0.90, 0.42), up=(-0.8, 0.0, 0.6)),
    "release": dict(wrist=(-0.18, -0.40, 0.26), elbow=(-1.0, 0.1, -0.1), aim=(-0.05, -0.95, 0.30), up=(-0.8, 0.0, 0.6)),
    "follow": dict(wrist=(-0.10, -0.42, -0.12), elbow=(-1.0, 0.2, -0.4), aim=(0.05, -0.90, -0.40), up=(-0.7, 0.0, 0.7)),
}
THROW_KEYS = [(0.0, "carry"), (0.32, "cocked"), (0.44, "cocked"), (0.54, "release"), (0.66, "follow"), (1.0, "carry")]
THROW_TWIST = [(0.0, 0.0), (0.32, -22.0), (0.44, -24.0), (0.54, 16.0), (0.66, 14.0), (1.0, 0.0)]
THROW_LEAN = [(0.0, 0.0), (0.32, -4.0), (0.44, -5.0), (0.54, 9.0), (0.66, 8.0), (1.0, 0.0)]


def _stroke(table, keys, twist, lean, frames):
    """An attack as keyframed dicts: returns (extra, right) for RiderPoser.clip."""
    def at(f):
        u = f / frames
        k = [(u0, table[name]) for u0, name in keys]
        return _keyframes(k, u), _keyframes(twist, u), _keyframes(lean, u)

    def extra(rp, f):
        _hand, t, l = at(f)
        rp.bend(t, "Z")
        rp.bend(l)
        rp.level_head(l)
        rp.p.rotate("neck_01", "Z", -t * 0.3)
        rp.p.rotate("head", "Z", -t * 0.3)

    def right(rp, f):
        hand, _t, _l = at(f)
        turn, origin = rp.arms.chest(0.35)
        rp.arms.hand("r", origin + turn @ Vector(hand["wrist"]), turn @ Vector(hand["elbow"]),
                     turn @ Vector(hand["aim"]).normalized(), turn @ Vector(hand["up"]).normalized())

    return extra, right


# --------------------------------------------------------------------------
# Taking a blow hand to hand (batch G)
# --------------------------------------------------------------------------
#
# The riders' block and hit, as the foot soldiers' (whp_clips.REACT): both
# begin and end seated as in idle, are REACT["frames"] long, and the blow
# lands REACT["impact"] frames in. The horse stands as for the attack.

TOSS_SIGN = -1.0            # the horse's neck bones turn about X this way to raise the head

# The left arm of a rider with the shield slung on his forearm, as he meets
# a blow: the fist leaves the reins and the forearm comes up across the
# body, the shield before the chest and face. In the chest's frame (as
# whp_clips.Arms.shield: X to his left, -Y forwards, Z up, from the top of
# the spine), the chest's turn followed by SHIELD_UP_FOLLOW.
SHIELD_UP = {
    # Raised and pushed out towards the blow.
    "block": dict(wrist=(-0.10, -0.36, -0.07), elbow=(1.0, -0.15, -0.3),
                  fingers=(-0.95, -0.20, 0.25), back=(0.2, -0.95, 0.2)),
    # The blow lands on it: driven back on the chest.
    "jolt": dict(wrist=(-0.06, -0.26, -0.10), elbow=(1.0, -0.1, -0.35),
                 fingers=(-0.95, -0.10, 0.25), back=(0.15, -0.95, 0.25)),
}
SHIELD_UP_FOLLOW = 0.5
# The fist on the reins (RiderPoser.left_on_reins), to blend from.
REINS_GRIP = dict(offset=(0.025, 0.075, 0.035), elbow=(1.0, 0.5, -0.6),
                  fingers=(-0.25, -0.85, -0.45), back=(0.75, -0.1, 0.65))

# A shield in the left fist (Rider.shield == "hand"), as whp_clips.SHIELD_CARRY
# for the man on foot: pushed out to meet the blow, driven back, and knocked
# open when the blow gets through.
RIDE_SHIELD_REACT = {
    "block": dict(wrist=(0.18, -0.48, -0.12), down=(0.0, -0.14, -1.0), out=(0.10, -1.0, 0.06),
                  elbow=(1.0, 0.15, -0.5), follow=0.3),
    "jolt": dict(wrist=(0.20, -0.33, -0.17), down=(0.0, -0.32, -1.0), out=(0.22, -1.0, 0.14),
                 elbow=(1.0, 0.3, -0.5), follow=0.5),
    "open": dict(wrist=(0.36, -0.20, -0.36), down=(0.08, -0.12, -1.0), out=(0.80, -0.6, 0.0),
                 elbow=(1.0, 0.4, -0.35), follow=0.8),
}

# The trunk, degrees at frames of the clip (eased between): turned to the
# left (Z), leaned forwards (X) and to his left (Y), and the head nodding
# forwards on top. The blow lands at frame 9.
REACT_TRUNK = {
    # He turns the shield side to the blow and leans into it; it rocks him back.
    "block": dict(twist=[(0, 0.0), (7, -14.0), (9, -14.0), (12, -6.0), (30, 0.0)],
                  lean=[(0, 0.0), (7, 6.0), (9, 6.0), (12, -5.0), (18, -1.0), (30, 0.0)],
                  side=[(0, 0.0), (30, 0.0)],
                  nod=[(0, 0.0), (7, 4.0), (9, 4.0), (12, 0.0), (30, 0.0)]),
    # Thrown back and round in the seat, the head whipping forwards, then up again.
    "hit": dict(twist=[(0, 0.0), (9, 0.0), (12, 16.0), (17, 11.0), (30, 0.0)],
                lean=[(0, 0.0), (8, 0.0), (12, -18.0), (17, -11.0), (30, 0.0)],
                side=[(0, 0.0), (9, 0.0), (13, -7.0), (30, 0.0)],
                nod=[(0, 0.0), (8, 0.0), (11, 14.0), (16, -4.0), (30, 0.0)]),
}
REACT_TOSS = {"block": 3.0, "hit": 10.0}        # degrees the horse throws its head up


def _at(keys, f):
    """Value at frame f of (frame, value) keys, eased between them."""
    return _keyframes([(k / keys[-1][0], v) for k, v in keys], f / keys[-1][0])


def _reaction(rider, name):
    """A clip of whp_clips.REACT for a rider: returns (extra, left, toss)
    for RiderPoser.clip and _stance. `left` is None where the left arm
    stays as it rides."""
    frames, impact = whp_clips.REACT["frames"], whp_clips.REACT["impact"]
    trunk = REACT_TRUNK[name]

    def extra(rp, f):
        twist, lean, side, nod = (_at(trunk[k], f) for k in ("twist", "lean", "side", "nod"))
        rp.bend(twist, "Z")
        rp.bend(lean)
        rp.bend(side, "Y")
        rp.level_head(lean)
        rp.p.rotate("neck_01", "Z", -twist * 0.4)
        rp.p.rotate("head", "Z", -twist * 0.4)
        rp.p.rotate("neck_01", "X", nod * 0.5)
        rp.p.rotate("head", "X", nod * 0.5)

    def raised(f):
        """How far the shield is up: there two frames before the blow, down again over the last half."""
        if f <= impact + 4:
            return smooth(f / (impact - 2))
        return 1.0 - smooth((f - impact - 4) / (frames - impact - 4))

    def slung(rp, f, reins):
        w = raised(f)
        if w <= 0.0:
            rp.left_on_reins(reins)
            return
        up = _keyframes([(0.0, SHIELD_UP["block"]), (impact / frames, SHIELD_UP["block"]),
                         ((impact + 3) / frames, SHIELD_UP["jolt"]), (1.0, SHIELD_UP["jolt"])], f / frames)
        turn, origin = rp.arms.chest(SHIELD_UP_FOLLOW)
        grip = REINS_GRIP
        rp.left_arm((reins + Vector(grip["offset"])).lerp(origin + turn @ Vector(up["wrist"]), w),
                    Vector(grip["elbow"]).lerp(turn @ Vector(up["elbow"]), w),
                    Vector(grip["fingers"]).normalized().lerp(turn @ Vector(up["fingers"]).normalized(), w),
                    Vector(grip["back"]).normalized().lerp(turn @ Vector(up["back"]).normalized(), w))

    def held(rp, f, _reins):
        rest, react = rp.rider.shield_carry, RIDE_SHIELD_REACT
        if name == "block":
            if f <= impact:
                carry = whp_clips.blend_carry(rest, react["block"], smooth(f / (impact - 2)))
            elif f <= impact + 3:
                carry = whp_clips.blend_carry(react["block"], react["jolt"], smooth((f - impact) / 3.0))
            else:
                carry = whp_clips.blend_carry(react["jolt"], rest, smooth((f - impact - 3) / (frames - impact - 3)))
        elif f <= impact + 4:
            carry = whp_clips.blend_carry(rest, react["open"], smooth((f - impact) / 4.0))
        else:
            carry = whp_clips.blend_carry(react["open"], rest, smooth((f - impact - 4) / (frames - impact - 4)))
        rp.arms.shield(carry)

    def toss(f):
        return REACT_TOSS[name] * smooth((f - impact + 1) / 3.0) * (1.0 - smooth((f - impact - 2) / 12.0))

    if rider.shield == "hand" and not rider.reins:
        left = held
    elif rider.shield == "forearm" and rider.reins and name == "block":
        left = slung
    else:
        left = None
    return extra, left, toss


def horse_strides(mount, horse_pose, label):
    """Metres one loop of a horse clip covers, measured as the scene does
    (whp_clips.planted on the hooves: the lowest points of the body at rest)."""
    body = bpy.data.objects[HORSE_DETAILED["body"]]
    co = np.array([v.co[:] for v in body.data.vertices])
    soles = Skin([body], lambda c: c[:, 2] < co[:, 2].min() + whp_clips.SOLE_HEIGHT)
    rest = {n: np.array(mount.armature.data.bones[n].matrix_local) for n in mount.horse_names}
    frames = len(horse_pose[SADDLE]) - 1
    track = []
    for f in range(frames):
        skin = {n: horse_pose[n][f] @ np.linalg.inv(rest[n]) for n in mount.horse_names}
        track.append(soles.at(skin))
    speed, slips = whp_clips.planted(np.array(track), soles.rest[:, 0] > 0)
    metres = speed * frames
    log(f"{label}: {metres:.2f} m per loop of {frames / FPS:.3f} s ({metres / (frames / FPS):.2f} m/s), "
        f"planted hooves slip at most {whp_clips.worst_slip(slips, speed) * 100:.0f}% (as the scene measures)")
    return metres


def rider_death(rider, unit):
    """The rider's fall as a foot soldier's die on the ground (whp_clips,
    with unit.KIT), as poses: {bone: [4x4 numpy] per frame}, before the
    horse is mounted (the rig still stands on the ground at the origin)."""
    builder = whp_clips.Builder(rider, unit.KIT)
    action = builder.die()
    pose = action_pose(rider, action)
    log(f"rider's fall: {len(pose['pelvis']) - 1} frames, lifted {builder.lying_lift * 100:.1f} cm lying")
    bpy.data.actions.remove(action)
    return pose


def die_clip(rp, death):
    """The horse's die, the rider going down with it, thrown off towards
    the side it rolls onto (its right, -X) and lying beside it."""
    m = rp.m
    horse_pose = m.clips["die"]
    frames = len(horse_pose[SADDLE]) - 1
    names = m.rider_names
    order = names
    parents = {n: (rp.armature.data.bones[n].parent.name if rp.armature.data.bones[n].parent else None) for n in names}
    last = len(death["pelvis"]) - 1
    start, end, lying = 12, 40, 46                     # the blend to the fall, and when he lies still
    turn = Matrix.Rotation(math.radians(90.0), 4, "Z")    # faces the horse (+X), falls away from it (-X)

    def death_at(f):
        t = 16.0 + (f - start) * (last - 16.0) / (lying - start)
        k = min(max(t, 0.0), float(last))
        i = int(math.floor(k))
        j = min(i + 1, last)
        u = k - i
        return {n: _slerp_matrix(Matrix(death[n][i].tolist()), Matrix(death[n][j].tolist()), u) for n in names}

    # Where he lies: beside the horse's back in its last frame, clear of it.
    place = _death_place(rp, death, turn, horse_pose)
    ground = Matrix.Translation(place) @ turn

    def pose(rp_, f):
        rp_.frame("die", f, horse_pose)
        w = smooth((f - start) / (end - start))
        if w <= 0.0:
            return
        p = rp_.p
        seated = {n: p.matrix[n].copy() for n in names}
        fallen = {n: ground @ mat for n, mat in death_at(f).items()}
        for n in order:
            parent = parents[n]
            if n in ("ik_foot_root", "ik_hand_root"):
                continue                # not keyed: they stay where Blender puts them, under the saddle
            if n in RIDER_ROOTS or parent not in names:
                p.matrix[n] = _slerp_matrix(seated[n], fallen[n], w)
            else:
                a = seated[parent].inverted() @ seated[n]
                b = fallen[parent].inverted() @ fallen[n]
                p.matrix[n] = p.matrix[parent] @ _slerp_matrix(a, b, w)
        if rp_.rider.shield == "forearm":
            _spare_falls(rp_, f, seated, w)

    return rp.clip("die", horse_pose, frames=frames, loop=False, pose=pose)


def _death_place(rp, death, turn, horse_pose):
    """Where to put the fallen rider (a point on the ground; his pose turned
    by `turn`): the side of him towards the horse 6 cm clear of its body in
    the last frame, beside the saddle."""
    m = rp.m
    body = bpy.data.objects[HORSE_DETAILED["body"]]
    horse = Skin([body], lambda c: np.arange(len(c)) % 5 == 0)
    rest = {n: np.array(m.armature.data.bones[n].matrix_local) for n in m.horse_names}
    f = len(horse_pose[SADDLE]) - 1
    hp = horse.at({n: horse_pose[n][f] @ np.linalg.inv(rest[n]) for n in m.horse_names})
    man = Skin(rp.meshes, lambda c: np.arange(len(c)) % 3 == 0)
    last = len(death["pelvis"]) - 1
    # The death poses are of the rig as it stood on the ground; a pose M of
    # it skins the lifted rest R as M R^-1 all the same (both lifted alike).
    skin = {n: np.array(turn @ Matrix(death[n][last].tolist())) @ np.linalg.inv(np.array(rp.p.rest[n]))
            for n in death}
    pts = man.at(skin)
    saddle_y = horse_pose[SADDLE][f][1, 3]
    y0, y1 = pts[:, 1].min() + saddle_y, pts[:, 1].max() + saddle_y
    near = hp[(hp[:, 1] > y0) & (hp[:, 1] < y1) & (hp[:, 2] < 0.6)]
    edge = float(near[:, 0].min()) if len(near) else float(hp[:, 0].min())
    x = edge - 0.06 - float(pts[:, 0].max())
    log(f"die: the fallen rider reaches x = {x + pts[:, 0].max():.2f} m, the lying horse's body {edge:.2f} m")
    return Vector((x, saddle_y, 0.0))


def _spare_falls(rp, f, seated, w):
    """The forearm shield in the fall: it follows the forearm, then comes to
    lie flat on the ground beside the left hand."""
    p = rp.p
    bone = whp_clips.SPARE_BONE
    arm_ref, spare_ref = rp.spare_ref
    follow = p.matrix["lowerarm_l"] @ arm_ref.inverted() @ spare_ref
    late = smooth((w - 0.55) / 0.45)
    if late <= 0.0:
        p.matrix[bone] = follow
        return
    arm = rp.armature
    out = Vector(arm["whp_shield_out"]).normalized()
    down = Vector(arm["whp_shield_down"]).normalized()
    centre = rp.shield_centre
    rest = p.rest[bone]
    hand = p.head("hand_l")
    target = Vector((hand.x, hand.y, rp.unit.SHIELD_HANG.get("lying", 0.03)))
    side = (p.head("hand_l") - p.head("lowerarm_l"))
    flat_down = Vector((side.x, side.y, 0.0)).normalized() if side.length > 1e-6 else Vector((0.0, 1.0, 0.0))

    def frame(a, b):
        x = a.normalized()
        y = (b - b.dot(x) * x).normalized()
        mm = Matrix((x, y, x.cross(y)))
        mm.transpose()
        return mm

    turn = frame(Vector((0.0, 0.0, 1.0)), flat_down) @ frame(out, down).transposed()
    flat = Matrix.Translation(target + flat_down * 0.0) @ turn.to_4x4() @ Matrix.Translation(-centre) @ rest
    p.matrix[bone] = _slerp_matrix(follow, flat, late)


# The skirt of a rider's tunic (and mail shirt), T-047. At rest the man
# stands, and the skirt flares out from the hips; seated, the thighs it is
# weighted to lift it, and the flare stands out sideways. Below the hip the
# skirt is drawn in towards the legs (what lies beyond SKIRT_CLEAR is kept
# to SKIRT_KEEP of it; the shift smoothed over the mesh, so the cloth does
# not fold), so that it lies along the thighs; behind the rider it is left
# as it hangs and follows the pelvis instead, down over the horse's back.
SKIRTS = ("Tunic_1", "Mail")
SKIRT_CLEAR = 0.02          # metres off the legs
SKIRT_KEEP = 0.15
SKIRT_DROP = (0.01, 0.15)   # below the hip joints: from no change to all of it
SKIRT_SMOOTH = 12           # passes of smoothing the shift over the mesh's edges


def drape_skirts(armature):
    """Draw the rider's skirts in to the legs (see SKIRTS). Run after the
    clips are built: they do not depend on it."""
    from mathutils.bvhtree import BVHTree
    import whp_skin
    from whp_mesh import smoothstep

    legs = bpy.data.objects.get("New_legs")
    if legs is None:
        return
    tree = BVHTree.FromPolygons([v.co.copy() for v in legs.data.vertices], [tuple(p.vertices) for p in legs.data.polygons])
    bones = armature.data.bones
    hip = (bones["thigh_l"].head_local.z + bones["thigh_r"].head_local.z) / 2
    pelvis = bones["pelvis"].head_local
    names = [b.name for b in bones]
    index = {n: i for i, n in enumerate(names)}
    leg_bones = [index[n] for n in names if n.startswith(("thigh", "calf", "foot", "ball"))]
    for name in SKIRTS:
        obj = bpy.data.objects.get(name)
        if obj is None:
            continue
        mesh = obj.data
        co = np.array([v.co for v in mesh.vertices])
        below = smoothstep(hip - SKIRT_DROP[0], hip - SKIRT_DROP[1], co[:, 2])
        dx, dy = co[:, 0] - pelvis.x, co[:, 1] - pelvis.y
        behind = np.clip(dy / np.maximum(np.hypot(dx, dy), 1e-6), 0.0, 1.0)
        # How far each vertex would move, then smoothed over the mesh's edges:
        # neighbours drawn to different points of the legs would fold the cloth.
        shift = np.zeros_like(co)
        for i, (v, b) in enumerate(zip(mesh.vertices, below * (1.0 - behind))):
            if b <= 0.0:
                continue
            hit, _normal, _face, distance = tree.find_nearest(v.co)
            if hit is None or distance <= SKIRT_CLEAR:
                continue
            target = hit + (v.co - hit).normalized() * (SKIRT_CLEAR + (distance - SKIRT_CLEAR) * SKIRT_KEEP)
            shift[i] = (np.array(target) - co[i]) * b
        edges = np.array([e.vertices for e in mesh.edges])
        for _ in range(SKIRT_SMOOTH):
            total = np.zeros_like(shift)
            count = np.zeros(len(shift))
            np.add.at(total, edges[:, 0], shift[edges[:, 1]])
            np.add.at(total, edges[:, 1], shift[edges[:, 0]])
            np.add.at(count, edges.ravel(), 1)
            shift = 0.5 * shift + 0.5 * total / np.maximum(count, 1)[:, None]
        shift *= np.minimum(below * 4.0, 1.0)[:, None]          # nothing above the hip
        before = np.array([p.normal.copy() for p in mesh.polygons])
        mesh.vertices.foreach_set("co", (co + shift).ravel())
        mesh.update()
        after = np.array([p.normal.copy() for p in mesh.polygons])
        flipped = int(((before * after).sum(axis=1) < 0.0).sum())
        moved = int((np.linalg.norm(shift, axis=1) > 1e-4).sum())
        weights = whp_skin.read_groups(obj, names)
        move = below * behind
        taken = weights[:, leg_bones].sum(axis=1) * move
        weights[:, leg_bones] *= (1.0 - move)[:, None]
        weights[:, index["pelvis"]] += taken
        whp_skin.write_groups(obj, whp_skin.prune(weights), names)
        log(f"{name}: skirt drawn in to the legs ({moved} vertices, {flipped} faces turned over), behind the rider on the pelvis")


def stage_anim(unit):
    """Stage "anim" of a cavalry model (see the module's docstring)."""
    scene = bpy.context.scene
    scene.render.fps = FPS
    rider = bpy.data.objects[whp_skeleton.RIG_NAME]
    death = rider_death(rider, unit)
    m = mount(unit, rider)
    rp = RiderPoser(m, unit)
    rp.frame("idle", 0, m.clips["idle"])            # also fixes where the forearm shield hangs
    _report_seat(rp)

    actions = []
    actions.append(rp.clip("idle", m.clips["idle"], extra=idle_extra))
    for clip in ("walk", "jog", "run"):
        pose = m.clips[HORSE_CLIP[clip]]
        actions.append(rp.clip(clip, pose))
        rp.strides[clip] = horse_strides(m, pose, clip)
    frames = ATTACK_FRAMES[unit.RIDER.attack]
    stance = _stance(m, frames)
    if unit.RIDER.attack == "spear-thrust":
        extra, right = _stroke(THRUST, THRUST_KEYS, THRUST_TWIST, THRUST_LEAN, frames)
    else:
        extra, right = _stroke(THROW, THROW_KEYS, THROW_TWIST, THROW_LEAN, frames)
    actions.append(rp.clip("attack", stance, extra=extra, right=right, frames=frames))
    actions.append(die_clip(rp, death))
    # After the first six: they come out as they did without these two.
    frames = whp_clips.REACT["frames"]
    for name in ("block", "hit"):
        extra, left, toss = _reaction(unit.RIDER, name)
        actions.append(rp.clip(name, _stance(m, frames, toss=toss), extra=extra, left=left, frames=frames,
                               loop=whp_clips.LOOPS[name]))
    for action in actions:
        log(f"clip {action.name}: {int(action.frame_end)} frames at {FPS} fps")
    rider.animation_data.action = None
    scene.frame_set(0)
    # Last: the clips (the fallen rider's place among them) are built from the meshes as they were.
    drape_skirts(rider)


def _report_seat(rp):
    """How far the rider's legs go into the horse (seated, idle frame 0)."""
    body = bpy.data.objects[HORSE_DETAILED["body"]]
    mesh = body.data
    tree = BVHTree.FromPolygons([v.co[:] for v in mesh.vertices], [p.vertices[:] for p in mesh.polygons])
    legs = [o for o in bpy.data.objects if o.type == "MESH" and o.name in rp.unit.SEAT_MESHES]
    skin = Skin(legs)
    pts = skin.at(poser_skin(rp.p))
    inside = []
    for q in pts:
        hit = tree.find_nearest(Vector(q))
        if hit[0] is not None and (Vector(q) - hit[0]).dot(hit[1]) < 0.0:
            inside.append((Vector(q) - hit[0]).length)
    inside = np.array(inside) if inside else np.zeros(1)
    log(f"seat check: {len(inside)} of {len(pts)} leg vertices inside the horse's skin, deepest "
        f"{inside.max() * 100:.1f} cm, 90% within {np.percentile(inside, 90) * 100:.1f} cm")


# --------------------------------------------------------------------------
# Stage "lod"
# --------------------------------------------------------------------------

def stage_lod(unit, limits):
    model = unit.MODEL
    scene = bpy.context.scene
    armature = bpy.data.objects[whp_skeleton.RIG_NAME]
    horse = unit.HORSE
    horse_objs = [bpy.data.objects[HORSE_DETAILED[k]] for k in horse_keys(horse)]
    rider_detailed = [o for o in scene.objects if o.type == "MESH" and not o.name.endswith(".low")
                      and o not in horse_objs]
    generated_low = [o for o in scene.objects if o.type == "MESH" and o.name.endswith(".low")]
    if armature.animation_data:
        armature.animation_data.action = None
    whp_skeleton.reset_pose(armature)
    ground = float(armature["whp_rider_lift"][2]) if "whp_rider_lift" in armature else 0.0

    hi = len(limits) == 4               # the "hi" ladder (whp_build --hi)
    game = [ul.game_budget(part) for part in unit.PARTS]
    rider_parts = ul.build_low_parts(unit.PARTS, ground=ground, hi=hi)
    for part, low in zip(unit.PARTS, rider_parts):
        log(f"LOD0 {part.name}: {triangle_count(low)} triangles")
    log(f"LOD0 rider: {sum(triangle_count(p) for p in rider_parts)} triangles")
    delete_objects(generated_low)
    horse_parts, sources = horse_lod.low_parts(keys=horse.parts, uv=horse.uv, hi=hi)
    horse_specs = horse_lod.specs(horse_parts, sources)
    specs = list(unit.PARTS) + horse_specs
    sets = [[s.name for s in unit.PARTS], [s.name for s in horse_specs]]
    rest = {b.name: np.array(b.matrix_local) for b in armature.data.bones if b.name.startswith("horse_")}
    if hi:
        with horse_lod.Unskinned(horse_objs):
            parts, final, color_image, clean_up = ul.bake_atlas(model, specs, rider_parts + horse_parts,
                                                                rider_detailed + horse_objs, ao_sets=sets,
                                                                normal_size=ul.HI_NORMAL_SIZE)
        rider_parts, horse_parts = parts[:len(unit.PARTS)], parts[len(unit.PARTS):]
        levels = ul.figure_levels_hi(unit.PARTS, rider_parts, game, armature, color_image, unit.LOD2, ground=ground)
        horse_levels = horse_lod.levels_hi(horse_parts, rest, color_image)
    else:
        # LOD1 with few seams and LOD2 a palette (whp_far), for the rider and the horse alike.
        rider_lod1 = whp_far.lod1_pieces([p.name for p in unit.PARTS], rider_parts, [p.budget[1] for p in unit.PARTS])
        horse_lod1 = horse_lod.lod1_pieces(horse_parts)
        with horse_lod.Unskinned(horse_objs):
            parts, final, color_image, clean_up, lod1 = ul.bake_atlas(model, specs, rider_parts + horse_parts,
                                                                      rider_detailed + horse_objs, ao_sets=sets,
                                                                      extra=rider_lod1 + horse_lod1)
        rider_parts, horse_parts = parts[:len(unit.PARTS)], parts[len(unit.PARTS):]
        rider_lod1, horse_lod1 = lod1[:len(rider_lod1)], lod1[len(rider_lod1):]
        levels = ul.figure_levels(unit.PARTS, rider_parts, armature, color_image, unit.LOD2, ground=ground,
                                  lod1=rider_lod1)
        horse_levels = horse_lod.levels(horse_parts, rest, color_image, lod1=horse_lod1)
    for group, pieces in horse_levels.items():
        for i in range(len(levels)):
            levels[i] += pieces[i]
    if not hi:
        ul.finish_far(levels, final)
    lods = [ul.finish_lod(objs, f"LOD{i}", limits[i], armature, final) for i, objs in enumerate(levels)]

    for obj in rider_detailed + horse_objs:
        obj.hide_render = True
        obj.hide_set(True)
    for obj in lods[1:]:
        obj.hide_render = True
    clean_up()
    scene.render.engine = "BLENDER_EEVEE"
    deselect_all()
    return lods


