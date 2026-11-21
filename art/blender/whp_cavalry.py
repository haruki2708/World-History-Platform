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
import whp_look
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
        # ridedown (batch L) leans as the run, without the bob: its horse holds one frame of the run.
        self.lean["ridedown"] = (self.lean["run"][0], self.lean["run"][1], 0.0)
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
# A long sword drawn (T-050): held up and a little forwards beside the
# horse's shoulder, the edge forwards; forwards at the gallop.
SWORD_UP = dict(wrist=(-0.28, -0.22, -0.33), elbow=(-0.6, 0.7, -0.3),
                aim=(-0.38, -0.30, 0.87), up=(-0.9, 0.1, -0.4), follow=0.6)
SWORD_FORWARD = dict(wrist=(-0.28, -0.28, -0.30), elbow=(-0.6, 0.7, -0.3),
                     aim=(-0.30, -0.62, 0.73), up=(-0.9, 0.1, -0.3), follow=0.6)
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
# The legs in the gaits (batch L, B3). With no stirrups (216 BCE) the lower
# legs hang from the knees: as the horse's back is thrown up and falls away
# they flap (back, the knees bending, while it is thrown up; forwards while
# it falls), and at the walk they go with the barrel as it rolls from side
# to side, one back as the other comes forwards; a little late on the
# saddle. Before T-060 they were held still in the saddle's frame and
# looked stiff.
LEG_GAITS = ("walk", "jog", "run")
LEG_FLAP = 0.8              # degrees back per m/s^2 the saddle rises with (smoothed over 3 frames)
LEG_SWAY = 8.0              # degrees per degree of the saddle's roll, opposite on the two sides
LEG_LAG = 2                 # frames the legs lag behind the saddle
LEG_THIGH = 0.25            # share of the swing taken at the hip, the rest at the knee
LEG_SWING_MAX = 12.0        # degrees
SEAT_CLEAR = 0.004          # the seat of the breeches this far above the seat point
SEATED_DEPTH = 0.30         # metres below the hips at rest: the seat, measured seated (RiderPoser._find_seated_height)

ATTACK_FRAMES = {"spear-thrust": 30, "javelin-throw": 40, "sword-slash": 40}   # as the foot soldiers' (whp_clips.ATTACKS)


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
        self._pitches = {}
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
            if getattr(self.unit, "SEAT_MEASURE", "rest") == "seated":
                self.seat_z = self._find_seated_height()
            else:
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

    def _find_seated_height(self):
        """As _find_seat_height, but measured with the man seated (unit
        SEAT_MEASURE = "seated", T-050): the lowest point of his seat, the
        legs' mesh near the middle line from just above the hips to
        SEATED_DEPTH below them, comes to rest on the seat point. Measured
        standing, the inner thighs of baggy trousers (the Celt's) hang into
        that window and lift him a hand's breadth off the horse."""
        p = self.p
        seat = self.m.seat
        legs = [o for o in bpy.data.objects if o.type == "MESH" and o.name in self.unit.SEAT_MESHES]
        p.reset()
        start = p.head("pelvis").z
        self.seat_z = start
        self.seat()
        skin = Skin(legs, lambda co: (np.abs(co[:, 0]) < 0.08) & (co[:, 2] < start + 0.02)
                    & (co[:, 2] > start - SEATED_DEPTH))
        pts = skin.at(poser_skin(p))
        low = float(pts[:, 2].min())
        z = start + (seat[2] + SEAT_CLEAR - low)
        log(f"seat (seated): {len(skin)} vertices of the seat; pelvis bone at {z:.3f} m (seat point {seat[2]:.3f} m)")
        p.reset()
        return z

    def leg_swing(self, clip, f, horse_pose):
        """Degrees each leg (left, right) swings back against the saddle at
        frame f of a gait (LEG_GAITS): flapping with the saddle's rise and
        swaying with its roll, LEG_LAG frames before."""
        if clip not in LEG_GAITS:
            return 0.0, 0.0
        if clip not in self._pitches:
            rest = np.array(self.saddle_rest)
            frames = len(horse_pose[SADDLE]) - 1
            z, roll = [], []
            for k in range(frames):
                m = np.array(horse_pose[SADDLE][k])
                rel = m[:3, :3] @ rest[:3, :3].T
                z.append(m[2, 3])
                roll.append(math.degrees(math.atan2(-rel[2, 0], rel[0, 0])))
            z, roll = np.array(z), np.array(roll)
            rise = (np.roll(z, -1) - 2.0 * z + np.roll(z, 1)) * FPS * FPS
            rise = (np.roll(rise, -1) + rise + np.roll(rise, 1)) / 3.0
            flap = LEG_FLAP * rise
            sway = LEG_SWAY * (roll - roll.mean())
            self._pitches[clip] = (np.clip(flap + sway, -LEG_SWING_MAX, LEG_SWING_MAX),
                                   np.clip(flap - sway, -LEG_SWING_MAX, LEG_SWING_MAX))
            left, right = self._pitches[clip]
            log(f"{clip}: the saddle rises {rise.min():+.1f}..{rise.max():+.1f} m/s^2 and rolls {roll.min():+.1f}..{roll.max():+.1f} "
                f"degrees; the legs swing {left.min():+.1f}..{left.max():+.1f} degrees")
        left, right = self._pitches[clip]
        k = (f - LEG_LAG) % len(left)
        return float(left[k]), float(right[k])

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
        for side, swing in zip(("l", "r"), self.leg_swing(clip, f, horse_pose)):
            if swing:
                p.rotate(f"thigh_{side}", "X", swing * LEG_THIGH)
                p.rotate(f"calf_{side}", "X", swing * (1.0 - LEG_THIGH))
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

# Downward cut with a long sword (T-050, gallic-cavalry): the blade raised
# over the right shoulder, pointing up and back; brought over and forwards
# past the right of the horse's head, furthest forwards with the blade
# about level (the moment the scene takes for the blow landing); then on
# down past the horse's right shoulder, and back up to the carry.
SLASH = {
    "carry": {k: v for k, v in SWORD_UP.items() if k != "follow"},
    "raised": dict(wrist=(-0.22, 0.06, 0.30), elbow=(-1.0, 0.2, 0.5), aim=(-0.20, 0.55, 0.81), up=(-1.0, 0.0, 0.1)),
    "level": dict(wrist=(-0.24, -0.54, 0.12), elbow=(-1.0, 0.25, -0.1), aim=(-0.28, -0.94, 0.10), up=(-0.9, 0.0, 0.4)),
    "down": dict(wrist=(-0.24, -0.42, -0.22), elbow=(-1.0, 0.4, -0.5), aim=(-0.38, -0.60, -0.70), up=(-0.9, 0.0, 0.3)),
}
SLASH_KEYS = [(0.0, "carry"), (0.18, "raised"), (0.26, "raised"), (0.36, "level"), (0.46, "down"),
              (0.58, "down"), (1.0, "carry")]
SLASH_TWIST = [(0.0, -4.0), (0.18, -20.0), (0.26, -22.0), (0.36, 14.0), (0.46, 18.0), (0.58, 14.0), (1.0, -4.0)]
SLASH_LEAN = [(0.0, 0.0), (0.18, -4.0), (0.26, -5.0), (0.36, 14.0), (0.46, 15.0), (0.58, 10.0), (1.0, 0.0)]


# Riding a man down (batch L, A2; docs/ARCHITECTURE.md, "Kỵ binh xông qua"):
# the clip ridedown. At the gallop the rider strikes once at a man on foot
# beside the horse on his weapon side (his right): from the run's carry he
# lifts the weapon over his right shoulder, drives it down and out to his
# right (the blow lands RIDEDOWN_IMPACT frames in), on through, and back to
# the carry; his trunk turns and leans to the right with the blow, and he
# looks down at the man. The scene plays the clip on the rider alone, the
# horse galloping under him (src/lib/battle.ts); the horse of the clip holds
# the frame of its run whose saddle is nearest the run's middle height, so
# the man sits, on average, where he sits at the gallop.
RIDEDOWN_FRAMES = 36        # RIDEDOWN_SECONDS (1.2 s) at 30 fps
RIDEDOWN_IMPACT = 12        # RIDEDOWN_IMPACT (0.4 s)
RIDE_FOLLOW = 0.35          # how much of the chest's turn the striking hand's frame takes (as _stroke)
# Spear or javelin, overarm: the point down and out to the right, a little forwards.
RIDE_THRUST = {
    "raised": dict(wrist=(-0.30, 0.08, 0.28), elbow=(-1.0, 0.5, 0.25), aim=(-0.55, -0.35, -0.76), up=(-0.6, 0.2, 0.75)),
    "strike": dict(wrist=(-0.58, -0.22, -0.16), elbow=(-1.0, 0.25, -0.1), aim=(-0.82, -0.25, -0.51), up=(-0.5, 0.0, 0.85)),
    "through": dict(wrist=(-0.55, -0.02, -0.28), elbow=(-1.0, 0.35, -0.25), aim=(-0.80, 0.05, -0.60), up=(-0.55, 0.1, 0.8)),
}
# Long sword: raised over the right shoulder, cut down past the horse's right shoulder.
RIDE_SLASH = {
    "raised": dict(wrist=(-0.24, 0.06, 0.32), elbow=(-1.0, 0.2, 0.5), aim=(-0.30, 0.50, 0.81), up=(-1.0, 0.0, 0.1)),
    "strike": dict(wrist=(-0.50, -0.30, -0.08), elbow=(-1.0, 0.3, -0.2), aim=(-0.60, -0.45, -0.66), up=(-0.8, 0.0, 0.5)),
    "through": dict(wrist=(-0.46, -0.02, -0.30), elbow=(-1.0, 0.4, -0.45), aim=(-0.50, 0.40, -0.77), up=(-0.8, 0.1, 0.4)),
}
_RIDE_HIT = RIDEDOWN_IMPACT / RIDEDOWN_FRAMES
RIDE_KEYS = [(0.0, "carry"), (0.20, "raised"), (_RIDE_HIT, "strike"), (0.45, "through"), (0.55, "through"), (1.0, "carry")]
# The trunk, degrees: turned (Z, to his left), leaned forwards (X) and to his
# left (Y); and the head turned (Z) and bowed (X) to look at the man.
RIDE_TWIST = [(0.0, 0.0), (0.20, 10.0), (_RIDE_HIT, -16.0), (0.45, -18.0), (0.55, -14.0), (1.0, 0.0)]
RIDE_LEAN = [(0.0, 0.0), (0.20, -3.0), (_RIDE_HIT, 10.0), (0.45, 12.0), (0.55, 9.0), (1.0, 0.0)]
RIDE_SIDE = [(0.0, 0.0), (0.20, 2.0), (_RIDE_HIT, -18.0), (0.45, -20.0), (0.55, -15.0), (1.0, 0.0)]
RIDE_LOOK = [(0.0, 0.0), (0.20, -6.0), (_RIDE_HIT, -14.0), (0.55, -12.0), (1.0, 0.0)]
RIDE_BOW = [(0.0, 0.0), (0.20, 4.0), (_RIDE_HIT, 14.0), (0.55, 12.0), (1.0, 0.0)]


def _still_gallop(mount, frames):
    """The horse of ridedown: the frame of its run whose saddle is nearest
    the run's middle height, held `frames` + 1 frames. Returns the pose,
    that frame and the run's saddle heights."""
    run = mount.clips[HORSE_CLIP["run"]]
    z = np.array([run[SADDLE][k][2, 3] for k in range(len(run[SADDLE]) - 1)])
    k = int(np.argmin(np.abs(z - z.mean())))
    return {n: [run[n][k]] * (frames + 1) for n in mount.horse_names}, k, z


def _ride_stroke(rider, table):
    """The stroke of ridedown: returns (extra, right) for RiderPoser.clip.
    It starts and ends at the run's carry, its hand's frame taking as much
    of the chest's turn as the carry's does."""
    carry = dict(rider.carry.get("run", rider.carry["default"]))
    poses = {"carry": carry}
    for name, pose in table.items():
        poses[name] = dict(pose, follow=RIDE_FOLLOW)
    keys = [(u, poses[name]) for u, name in RIDE_KEYS]

    def extra(rp, f):
        u = f / RIDEDOWN_FRAMES
        twist, lean, side = _keyframes(RIDE_TWIST, u), _keyframes(RIDE_LEAN, u), _keyframes(RIDE_SIDE, u)
        rp.bend(twist, "Z")
        rp.bend(lean)
        rp.bend(side, "Y")
        rp.level_head(lean)
        look, bow = _keyframes(RIDE_LOOK, u), _keyframes(RIDE_BOW, u)
        rp.p.rotate("neck_01", "Z", -twist * 0.3 + look * 0.4)
        rp.p.rotate("head", "Z", -twist * 0.3 + look * 0.6)
        rp.p.rotate("neck_01", "X", bow * 0.5)
        rp.p.rotate("head", "X", bow * 0.5)

    def right(rp, f):
        hand = _keyframes(keys, f / RIDEDOWN_FRAMES)
        turn, origin = rp.arms.chest(hand["follow"])
        rp.arms.hand("r", origin + turn @ Vector(hand["wrist"]), turn @ Vector(hand["elbow"]),
                     turn @ Vector(hand["aim"]).normalized(), turn @ Vector(hand["up"]).normalized())

    return extra, right


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


# The rider's fall (batch L, B3): he stays in the seat while the horse goes
# down on its knees, is thrown off at THROWN towards the side it rolls to,
# flies, and lands at LANDS. In the air his pelvis keeps its speed across
# the ground and falls under gravity (rising a little first: he is thrown),
# and he turns at an even rate from the seat to the way he will lie; his
# limbs go from the seated pose to the foot soldier's fall from SHAPE_FROM.
# Before T-060 he slid down to the ground along a straight line, slowing as
# he got there.
THROWN, LANDS, SHAPE_FROM = 18, 36, 12
GRAVITY = 9.81


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
    lying = 46                                          # when the foot soldier's fall has him lying still
    turn = Matrix.Rotation(math.radians(90.0), 4, "Z")    # faces the horse (+X), falls away from it (-X)

    def death_at(f):
        t = 16.0 + (f - SHAPE_FROM) * (last - 16.0) / (lying - SHAPE_FROM)
        k = min(max(t, 0.0), float(last))
        i = int(math.floor(k))
        j = min(i + 1, last)
        u = k - i
        return {n: _slerp_matrix(Matrix(death[n][i].tolist()), Matrix(death[n][j].tolist()), u) for n in names}

    # Where he lies: beside the horse's back in its last frame, clear of it.
    place = _death_place(rp, death, turn, horse_pose)
    ground = Matrix.Translation(place) @ turn
    flight = (LANDS - THROWN) / FPS
    held = {}

    def pose(rp_, f):
        rp_.frame("die", f, horse_pose)
        p = rp_.p
        if f == THROWN:
            held["seat"] = p.matrix["pelvis"].copy()
            held["lands"] = ground @ death_at(LANDS)["pelvis"]
        w = smooth((f - SHAPE_FROM) / (LANDS - SHAPE_FROM))
        if w <= 0.0:
            return
        seated = {n: p.matrix[n].copy() for n in names}
        fallen = {n: ground @ mat for n, mat in death_at(f).items()}
        if f <= THROWN:
            root = seated["pelvis"]
        elif f >= LANDS:
            root = fallen["pelvis"]
        else:
            a, b = held["seat"], held["lands"]
            u = (f - THROWN) / (LANDS - THROWN)
            t = u * flight
            z0, z1 = a.translation.z, b.translation.z
            rise = (z1 - z0 + 0.5 * GRAVITY * flight * flight) / flight
            root = _slerp_matrix(a, b, u)
            root.translation.z = z0 + rise * t - 0.5 * GRAVITY * t * t
        for n in order:
            parent = parents[n]
            if n in ("ik_foot_root", "ik_hand_root"):
                continue                # not keyed: they stay where Blender puts them, under the saddle
            if n == "pelvis":
                p.matrix[n] = root
            elif n in RIDER_ROOTS or parent not in names:
                p.matrix[n] = _slerp_matrix(seated[n], fallen[n], w)
            else:
                a = seated[parent].inverted() @ seated[n]
                b = fallen[parent].inverted() @ fallen[n]
                p.matrix[n] = p.matrix[parent] @ _slerp_matrix(a, b, w)
        if rp_.rider.shield == "forearm":
            # On the forearm until he lands, then flat on the ground beside the hand.
            _spare_falls(rp_, f, seated, 0.55 + 0.45 * min(max((f - LANDS + 3) / 9.0, 0.0), 1.0))

    action = rp.clip("die", horse_pose, frames=frames, loop=False, pose=pose)
    a, b = held["seat"], held["lands"]
    rise = (b.translation.z - a.translation.z + 0.5 * GRAVITY * flight * flight) / flight
    log(f"die: thrown at frame {THROWN} from {a.translation.z:.2f} m, lands at frame {LANDS} {b.translation.z:.2f} m up "
        f"and {(b.translation.xy - a.translation.xy).length:.2f} m away; rising at {rise:.2f} m/s as he leaves, "
        f"at most {max(0.0, rise) ** 2 / (2 * GRAVITY) * 100:.0f} cm")
    return action


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
# weighted to lift it, and the flare stands out sideways. So it is drawn in
# to the thighs where they are when he sits (idle, frame 0): below the hip,
# what lies beyond SKIRT_CLEAR of the legs is kept to SKIRT_KEEP of it; the
# shift is smoothed over the mesh, so the cloth does not fold; then nothing
# is left inside the legs (smoothing carries some of it in), SKIRT_OUTSIDE;
# each skirt lies SKIRT_LAYER further out than the one under it. The new
# places go back to the standing man through each vertex's own blend of
# bone matrices. Behind the rider the skirt follows the pelvis instead,
# down over the horse's back; since T-060 it is drawn in towards him there
# too (SKIRT_NARROW), the more the lower: left as it hung standing, it stood
# out round his seat like a lampshade, wider than his hips.
#
# The shift is kept as an attribute (DRAPE) and the cloth moved only once
# the atlas is baked (apply_drape): taken back to the standing man the
# draped cloth is no longer smooth where its vertices blend the thigh and
# the pelvis, and the bake's rays went through it to the inside of the
# cloth (grey triangles on the skirt).
SKIRTS = ("Tunic_1", "Mail")        # from the inside out
SKIRT_CLEAR = 0.012         # metres off the legs
SKIRT_KEEP = 0.05
SKIRT_OUTSIDE = 0.008       # metres: the least the cloth below the hip stays off the legs
SKIRT_LAYER = 0.012         # metres: each skirt further out than the one under it
SKIRT_DROP = (0.01, 0.15)   # below the hip joints: from no change to all of it
SKIRT_SMOOTH = 30           # passes of smoothing the shift over the mesh's edges
SKIRT_NARROW = 0.55         # behind him: what is left, at the hem, of the skirt's reach out sideways from his middle
SKIRT_PUSH_SMOOTH = 10      # and of the push out of the legs,
SKIRT_PUSH_ROUNDS = 4       # this many times over
DRAPE = "whp_drape"         # point attribute: the shift of each vertex at rest


def _smooth_over(values, edges, passes):
    """Each pass: half a vertex's own value, half its neighbours' mean."""
    count = np.zeros(len(values))
    np.add.at(count, edges.ravel(), 1)
    count = np.maximum(count, 1)[:, None]
    for _ in range(passes):
        total = np.zeros_like(values)
        np.add.at(total, edges[:, 0], values[edges[:, 1]])
        np.add.at(total, edges[:, 1], values[edges[:, 0]])
        values = 0.5 * values + 0.5 * total / count
    return values


def _out_of(tree, points, where, least):
    """How far to move each point (where `where`) to stand `least` out of the
    surface in `tree`, along the surface's normal; zero elsewhere."""
    push = np.zeros_like(points)
    for i in np.nonzero(where)[0]:
        q = Vector(points[i])
        hit, normal, _face, _distance = tree.find_nearest(q)
        if hit is None:
            continue
        off = (q - hit).dot(normal)
        if off < least:
            push[i] = np.array(normal * (least - off))
    return push


def drape_skirts(armature, skirts=SKIRTS, legs="New_legs"):
    """Draw the rider's skirts in to his thighs as he sits (see SKIRTS). Run
    after the clips are built: they do not depend on it. A unit may name
    its own (unit.SKIRTS, unit.LEGS_MESH: the Gaul's tunic over the Celt's
    legs, T-050); copies of one garment ("Tunic", "Tunic.low") lie in the
    same layer."""
    import whp_skin
    from whp_anim import set_action
    from whp_mesh import smoothstep

    legs = bpy.data.objects.get(legs)
    if legs is None:
        return
    scene = bpy.context.scene
    bones = armature.data.bones
    hip = (bones["thigh_l"].head_local.z + bones["thigh_r"].head_local.z) / 2
    pelvis = bones["pelvis"].head_local
    names = [b.name for b in bones]
    index = {n: i for i, n in enumerate(names)}
    leg_bones = [index[n] for n in names if n.startswith(("thigh", "calf", "foot", "ball"))]
    # Seated: the bones' matrices (armature space, rest to pose) and the legs.
    action = armature.animation_data.action if armature.animation_data else None
    held = {b.name: b.matrix_basis.copy() for b in armature.pose.bones}
    set_action(armature, "idle")
    scene.frame_set(0)
    deform = np.array([np.array(armature.pose.bones[n].matrix @ bones[n].matrix_local.inverted()) for n in names])
    seated = legs.evaluated_get(bpy.context.evaluated_depsgraph_get())
    mesh = seated.to_mesh()
    tree = BVHTree.FromPolygons([v.co.copy() for v in mesh.vertices], [tuple(p.vertices) for p in mesh.polygons])
    seated.to_mesh_clear()
    garments = list(dict.fromkeys(n.split(".")[0] for n in skirts))
    for name in skirts:
        layer = garments.index(name.split(".")[0])
        obj = bpy.data.objects.get(name)
        if obj is None:
            continue
        mesh = obj.data
        co = np.array([v.co for v in mesh.vertices])
        below = smoothstep(hip - SKIRT_DROP[0], hip - SKIRT_DROP[1], co[:, 2])
        dx, dy = co[:, 0] - pelvis.x, co[:, 1] - pelvis.y
        behind = np.clip(dy / np.maximum(np.hypot(dx, dy), 1e-6), 0.0, 1.0)
        weights = whp_skin.read_groups(obj, names)
        move = below * behind
        taken = weights[:, leg_bones].sum(axis=1) * move
        weights[:, leg_bones] *= (1.0 - move)[:, None]
        weights[:, index["pelvis"]] += taken
        weights = whp_skin.prune(weights)
        whp_skin.write_groups(obj, weights, names)
        share = weights / np.maximum(weights.sum(axis=1, keepdims=True), 1e-9)
        blend = np.einsum("vb,bij->vij", share, deform)
        posed = np.einsum("vij,vj->vi", blend[:, :3, :3], co) + blend[:, :3, 3]
        # How far each vertex would move, then smoothed over the mesh's edges:
        # neighbours drawn to different points of the legs would fold the cloth.
        clear = SKIRT_CLEAR + layer * SKIRT_LAYER
        shift = np.zeros_like(co)
        # Behind him: drawn in sideways towards his middle, the more the lower.
        middle = armature.pose.bones["pelvis"].head.x
        shift[:, 0] = (posed[:, 0] - middle) * (SKIRT_NARROW - 1.0) * below * behind
        for i, b in enumerate(below * (1.0 - behind)):
            if b <= 0.0:
                continue
            p = Vector(posed[i])
            hit, _normal, _face, distance = tree.find_nearest(p)
            if hit is None or distance <= clear:
                continue
            target = hit + (p - hit).normalized() * (clear + (distance - clear) * SKIRT_KEEP)
            shift[i] = shift[i] + (np.array(target) - posed[i] - shift[i]) * b
        edges = np.array([e.vertices for e in mesh.edges])
        shift = _smooth_over(shift, edges, SKIRT_SMOOTH)
        shift *= np.minimum(below * 4.0, 1.0)[:, None]          # nothing above the hip
        target = posed + shift
        outside = SKIRT_OUTSIDE + layer * SKIRT_LAYER
        # Out of the legs: the push spread over the neighbours (pushed one by
        # one the cloth comes out lumpy, and the bake's rays go through the
        # lumps to the inside of the cloth), a few times over, then what is
        # still in pushed out.
        pushed = int((np.linalg.norm(_out_of(tree, target, below > 0.0, outside), axis=1) > 0.0).sum())
        for _ in range(SKIRT_PUSH_ROUNDS):
            target += _smooth_over(_out_of(tree, target, below > 0.0, outside), edges, SKIRT_PUSH_SMOOTH)
        target += _out_of(tree, target, below > 0.0, outside)
        back = np.linalg.inv(blend)
        rest = np.einsum("vij,vj->vi", back[:, :3, :3], target) + back[:, :3, 3]
        before = np.array([p.normal.copy() for p in mesh.polygons])
        mesh.vertices.foreach_set("co", rest.ravel())
        mesh.update()
        after = np.array([p.normal.copy() for p in mesh.polygons])
        mesh.vertices.foreach_set("co", co.ravel())
        mesh.update()
        attr = mesh.attributes.new(DRAPE, "FLOAT_VECTOR", "POINT")
        attr.data.foreach_set("vector", (rest - co).astype(np.float32).ravel())
        flipped = int(((before * after).sum(axis=1) < 0.0).sum())
        moved = int((np.linalg.norm(target - posed, axis=1) > 1e-4).sum())
        log(f"{name}: skirt drawn in to the seated legs ({moved} vertices, {pushed} pushed out of them, "
            f"{flipped} faces turned over at rest; moved after the bake), behind the rider on the pelvis")
    armature.animation_data.action = action
    for b in armature.pose.bones:
        b.matrix_basis = held[b.name]
    scene.frame_set(0)


# The inside of a skirt (T-050). The source tunic (Tunic_1) is cloth with
# two faces, the outer one and the inner one; the inner one is baked grey
# (the inside of the cloth, in shadow). Drawn in to the seated thighs, the
# skirt shows patches of it from the front (iberian-gallic-cavalry, T-047).
# inner_skirt deletes, from the low copy of the tunic, the faces below the
# hips that face in, towards the rider's middle: from the inside the skirt
# is then not drawn at all, and the thighs show through, as under any
# one-sided cloth.
INNER_BELOW = 0.05          # metres above the hip joints: the skirt is below this
INNER_DOT = -0.3            # a face looks in when its normal and the way out from the middle meet below this


def inner_skirt(low):
    """Part.drop for a rider's tunic: delete the skirt's inner faces (see
    INNER_BELOW). Returns how many."""
    import bmesh

    pelvis = np.array(bpy.data.objects[whp_skeleton.RIG_NAME].data.bones["pelvis"].head_local)
    bm = bmesh.new()
    bm.from_mesh(low.data)
    gone = []
    for face in bm.faces:
        c = np.array(face.calc_center_median())
        if c[2] > pelvis[2] + INNER_BELOW:
            continue
        out = np.array((c[0] - pelvis[0], c[1] - pelvis[1], 0.0))
        length = np.linalg.norm(out)
        if length > 1e-6 and float(np.dot(np.array(face.normal), out / length)) < INNER_DOT:
            gone.append(face)
    bmesh.ops.delete(bm, geom=gone, context="FACES")
    bm.to_mesh(low.data)
    bm.free()
    low.data.update()
    return len(gone)


def apply_drape(objs):
    """Move the vertices of `objs` by the DRAPE attribute they carry from
    the skirts (see SKIRTS), and remove it."""
    for obj in objs:
        attr = obj.data.attributes.get(DRAPE)
        if attr is None:
            continue
        shift = np.empty(len(obj.data.vertices) * 3, dtype=np.float32)
        attr.data.foreach_get("vector", shift)
        co = np.empty(len(obj.data.vertices) * 3)
        obj.data.vertices.foreach_get("co", co)
        obj.data.vertices.foreach_set("co", co + shift)
        obj.data.attributes.remove(obj.data.attributes[DRAPE])
        obj.data.update()
        moved = int((np.abs(shift.reshape(-1, 3)).max(axis=1) > 1e-5).sum())
        if moved:
            log(f"{obj.name}: {moved} vertices of the skirt draped")


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
    elif unit.RIDER.attack == "sword-slash":
        extra, right = _stroke(SLASH, SLASH_KEYS, SLASH_TWIST, SLASH_LEAN, frames)
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
    # Last again (batch L): riding a man down. The first eight come out as they did without it.
    still, held, heights = _still_gallop(m, RIDEDOWN_FRAMES)
    extra, right = _ride_stroke(unit.RIDER, RIDE_SLASH if unit.RIDER.attack == "sword-slash" else RIDE_THRUST)
    actions.append(rp.clip("ridedown", still, extra=extra, right=right, frames=RIDEDOWN_FRAMES, loop=False))
    log(f"ridedown: the horse holds frame {held} of its run (saddle {heights[held]:.3f} m; "
        f"the run's from {heights.min():.3f} to {heights.max():.3f} m)")
    for action in actions:
        log(f"clip {action.name}: {int(action.frame_end)} frames at {FPS} fps")
    rider.animation_data.action = None
    scene.frame_set(0)
    # Last: the clips (the fallen rider's place among them) are built from the meshes as they were.
    drape_skirts(rider, getattr(unit, "SKIRTS", SKIRTS), getattr(unit, "LEGS_MESH", "New_legs"))


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
    looks = None if hi else getattr(unit, "LOOKS", None)      # T-061: each man his own look
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
    if looks is not None:
        ul.check_variants(specs, unit.LOD2, looks)
        if "cloth" in horse.tack:
            import cavalry_looks
            import horse_kit
            border = horse.cloth[1] if horse.cloth is not None else horse_kit.WOOL_BORDER
            count = cavalry_looks.mark_cloth_border(bpy.data.objects[HORSE_DETAILED["cloth"]], border)
            log(f"saddle cloth: {count} vertices of border kept out of the dye")
    rest = {b.name: np.array(b.matrix_local) for b in armature.data.bones if b.name.startswith("horse_")}
    if hi:
        with horse_lod.Unskinned(horse_objs):
            parts, final, color_image, clean_up = ul.bake_atlas(model, specs, rider_parts + horse_parts,
                                                                rider_detailed + horse_objs, ao_sets=sets,
                                                                normal_size=ul.HI_NORMAL_SIZE)
        rider_parts, horse_parts = parts[:len(unit.PARTS)], parts[len(unit.PARTS):]
        apply_drape(rider_parts)
        levels = ul.figure_levels_hi(unit.PARTS, rider_parts, game, armature, color_image, unit.LOD2, ground=ground)
        horse_levels = horse_lod.levels_hi(horse_parts, rest, color_image)
    else:
        # LOD1 with few seams and LOD2 a palette (whp_far), for the rider and the horse alike.
        rider_lod1 = whp_far.lod1_pieces([p.name for p in unit.PARTS], rider_parts, [p.budget[1] for p in unit.PARTS])
        horse_lod1 = horse_lod.lod1_pieces(horse_parts)
        if looks is not None:
            for part, low in zip(specs, rider_parts + horse_parts):
                whp_look.assign(low, looks.look(part.name))
            for piece in rider_lod1 + horse_lod1:
                whp_look.assign(piece, looks.look(piece.name.split(".")[0]))
        with horse_lod.Unskinned(horse_objs):
            parts, final, color_image, clean_up, lod1 = ul.bake_atlas(model, specs, rider_parts + horse_parts,
                                                                      rider_detailed + horse_objs, ao_sets=sets,
                                                                      extra=rider_lod1 + horse_lod1, looks=looks)
        rider_parts, horse_parts = parts[:len(unit.PARTS)], parts[len(unit.PARTS):]
        rider_lod1, horse_lod1 = lod1[:len(rider_lod1)], lod1[len(rider_lod1):]
        apply_drape(rider_parts + rider_lod1)
        levels = ul.figure_levels(unit.PARTS, rider_parts, armature, color_image, unit.LOD2, ground=ground,
                                  lod1=rider_lod1, looks=looks)
        horse_levels = horse_lod.levels(horse_parts, rest, color_image, lod1=horse_lod1)
        if looks is not None:
            # The body's far stand-in is built afresh: it takes the coat's look (its tail keeps its
            # colour all the same, by the dye mask).
            for pieces in horse_levels.values():
                for piece in pieces[2]:
                    if piece.name.split(".")[0] in looks.parts:
                        whp_look.assign(piece, looks.look(piece.name.split(".")[0]))
    for group, pieces in horse_levels.items():
        for i in range(len(levels)):
            levels[i] += pieces[i]
    if not hi:
        ul.finish_far(levels, final, looks=looks)
    lods = [ul.finish_lod(objs, f"LOD{i}", limits[i] + ul.variant_allowance(objs, looks), armature, final)
            for i, objs in enumerate(levels)]

    for obj in rider_detailed + horse_objs:
        obj.hide_render = True
        obj.hide_set(True)
    for obj in lods[1:]:
        obj.hide_render = True
    clean_up()
    scene.render.engine = "BLENDER_EEVEE"
    deselect_all()
    return lods


