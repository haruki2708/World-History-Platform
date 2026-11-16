"""The game rig of the horse, its body mesh, and clips baked from the source.

The source's 80 deform bones become about 40 game bones: bones that never
move against their parent in any gait (the skull, the eyes, the nostrils,
the jaw, the mane roots) are folded into it, weights and all. Names start
with "horse_" and sides end in "_l" / "_r", so the rig can sit beside the
rider's (Unreal-style) skeleton in one armature without a clash.

Space: metres, Z up, the horse faces -Y (glTF: Y up, facing +Z), hooves on
z = 0, the origin on the ground halfway between the front and the hind
hooves. The source is scaled so the withers stand WITHERS_HEIGHT high.

Clips are keyed as rotation and location on every bone (the source's
stretchy B-bone chains move their heads); scale is dropped.
"""

import bpy
import numpy as np
from mathutils import Matrix, Quaternion

import whp_skin
from whp_common import log
from whp_mesh import new_mesh_object

FPS = 30
WITHERS_HEIGHT = 1.40       # metres; see art/README.md ("Ngựa") for the source
RIG_NAME = "horse-rig"
BODY_NAME = "horse-body"
SADDLE_BONE = "horse_saddle"
WITHERS_BEHIND_SHOULDER = 0.08   # source units behind the head of the shoulder-blade bone

# Game bone, its parent, and the source deform bones folded into it (the
# first one gives the game bone its rest place and its motion).
BONES = [
    ("horse_root", None, []),
    ("horse_hips", "horse_root", ["DEF-spine.001", "DEF-pelvis.L", "DEF-pelvis.R"]),
    ("horse_spine_1", "horse_hips", ["DEF-spine.002"]),
    ("horse_spine_2", "horse_spine_1", ["DEF-spine.003"]),
    ("horse_spine_3", "horse_spine_2", ["DEF-spine.004"]),
    ("horse_spine_4", "horse_spine_3", ["DEF-spine.005", "DEF-chest", "DEF-breast.L", "DEF-breast.R"]),
    ("horse_spine_5", "horse_spine_4", ["DEF-spine.006", "DEF-mane_base.05", "DEF-mane_top.05"]),
    ("horse_neck_1", "horse_spine_5", ["DEF-neck.001", "DEF-mane_base.04", "DEF-mane_top.04"]),
    ("horse_neck_2", "horse_neck_1", ["DEF-neck.002", "DEF-mane_base.03", "DEF-mane_top.03"]),
    ("horse_neck_3", "horse_neck_2", ["DEF-neck.003", "DEF-mane_base.02", "DEF-mane_top.02"]),
    ("horse_neck_4", "horse_neck_3", ["DEF-neck.004", "DEF-mane_base.01", "DEF-mane_top.01",
                                      "DEF-mane_base.06", "DEF-mane_top.06"]),
    ("horse_head", "horse_neck_4", ["DEF-head", "DEF-skull", "DEF-skull.L", "DEF-skull.R", "DEF-eye.L", "DEF-eye.R",
                                    "DEF-nose.L", "DEF-nose.R", "DEF-jaw", "DEF-jaw.001",
                                    "DEF-ear.L", "DEF-ear.L.001", "DEF-ear.R", "DEF-ear.R.001"]),
    ("horse_tail_1", "horse_hips", ["DEF-tail.001"]),
    ("horse_tail_2", "horse_tail_1", ["DEF-tail.002"]),
    ("horse_tail_3", "horse_tail_2", ["DEF-tail.003"]),
    ("horse_tail_4", "horse_tail_3", ["DEF-tail.004"]),
    ("horse_tail_5", "horse_tail_4", ["DEF-tail.005"]),
]
# Each leg segment of the source is two B-bones that turn less than 4
# degrees against each other in any gait: one game bone each.
for _s, _S in (("l", "L"), ("r", "R")):
    BONES += [
        # Hind leg: thigh (femur), gaskin (tibia), cannon, pastern, hoof.
        (f"horse_thigh_{_s}", "horse_hips", [f"DEF-thigh.{_S}", f"DEF-thigh.{_S}.001"]),
        (f"horse_gaskin_{_s}", f"horse_thigh_{_s}", [f"DEF-lower_leg.{_S}", f"DEF-lower_leg.{_S}.001"]),
        (f"horse_hind_cannon_{_s}", f"horse_gaskin_{_s}", [f"DEF-hind_foot.{_S}", f"DEF-hind_foot.{_S}.001"]),
        (f"horse_hind_pastern_{_s}", f"horse_hind_cannon_{_s}", [f"DEF-r_toe.{_S}"]),
        (f"horse_hind_hoof_{_s}", f"horse_hind_pastern_{_s}", [f"DEF-r_hoof.{_S}"]),
        # Foreleg: shoulder blade, upper arm, forearm, cannon, pastern, hoof.
        (f"horse_shoulder_{_s}", "horse_spine_5", [f"DEF-shoulder.{_S}"]),
        (f"horse_upper_arm_{_s}", f"horse_shoulder_{_s}", [f"DEF-upper_arm.{_S}", f"DEF-upper_arm.{_S}.001"]),
        (f"horse_forearm_{_s}", f"horse_upper_arm_{_s}", [f"DEF-forearm.{_S}", f"DEF-forearm.{_S}.001"]),
        (f"horse_fore_cannon_{_s}", f"horse_forearm_{_s}", [f"DEF-forefoot.{_S}", f"DEF-forefoot.{_S}.001"]),
        (f"horse_fore_pastern_{_s}", f"horse_fore_cannon_{_s}", [f"DEF-f_toe.{_S}"]),
        (f"horse_fore_hoof_{_s}", f"horse_fore_pastern_{_s}", [f"DEF-f_hoof.{_S}"]),
    ]

GAME_NAMES = [b[0] for b in BONES]


# --------------------------------------------------------------------------
# Matrices
# --------------------------------------------------------------------------

def orthonormal(m):
    """A 4x4 with its 3x3 part made a pure rotation (scale and shear dropped)."""
    m = np.array(m, dtype=np.float64)
    u, _s, vt = np.linalg.svd(m[:3, :3])
    r = u @ vt
    if np.linalg.det(r) < 0:
        u[:, -1] *= -1
        r = u @ vt
    out = np.eye(4)
    out[:3, :3] = r
    out[:3, 3] = m[:3, 3]
    return out


class Frame:
    """Maps the source's armature space to the game's: uniform scale, then
    a shift that puts the hooves on the ground and the origin between them."""

    def __init__(self, data):
        co = data["rest_co"]
        names = list(data["bone_names"])
        rest = data["bone_rest"]
        ground = float(co[:, 2].min())
        # Withers: the top of the back just behind the top of the shoulder
        # blades, where the crest of the neck runs into the back (this
        # horse's topline falls evenly from the neck to the back; there is
        # no separate hump).
        shoulder = rest[names.index("DEF-shoulder.L")]
        y = shoulder[1, 3] + WITHERS_BEHIND_SHOULDER
        sel = (np.abs(co[:, 0]) < 0.06) & (np.abs(co[:, 1] - y) < 0.02)
        withers = float(co[sel, 2].max())
        self.scale = WITHERS_HEIGHT / (withers - ground)
        front = np.mean([rest[names.index(f"DEF-f_hoof.{s}")][1, 3] for s in "LR"])
        hind = np.mean([rest[names.index(f"DEF-r_hoof.{s}")][1, 3] for s in "LR"])
        centre_y = (front + hind) / 2
        self.offset = np.array([0.0, -centre_y * self.scale, -ground * self.scale])
        log(f"horse: withers {withers - ground:.3f} source units -> {WITHERS_HEIGHT} m, scale {self.scale:.4f}; "
            f"hooves {abs(front - hind) * self.scale:.3f} m apart")

    def point(self, p):
        return np.asarray(p) * self.scale + self.offset

    def matrix(self, m):
        """A source bone matrix (armature space) in game space, rotation only."""
        out = orthonormal(m)
        out[:3, 3] = self.point(m[:3, 3])
        return out


# --------------------------------------------------------------------------
# Armature and body
# --------------------------------------------------------------------------

def _source_index(data):
    return {n: i for i, n in enumerate(data["bone_names"])}


def rest_matrices(data, frame, saddle):
    """Game rest matrices by bone name (numpy 4x4)."""
    src = _source_index(data)
    rest = data["bone_rest"]
    out = {"horse_root": np.eye(4)}
    for name, _parent, sources in BONES:
        if sources:
            out[name] = frame.matrix(rest[src[sources[0]]])
    m = np.eye(4)
    m[:3, 3] = saddle
    out[SADDLE_BONE] = m
    return out


def build_armature(data, frame, saddle, saddle_parent):
    """The armature: every game bone, plus the saddle bone (the rider's
    anchor: its rest matrix is a pure translation to the seat)."""
    rest = rest_matrices(data, frame, saddle)
    arm_data = bpy.data.armatures.new(RIG_NAME)
    arm = bpy.data.objects.new(RIG_NAME, arm_data)
    bpy.context.scene.collection.objects.link(arm)
    bpy.context.view_layer.objects.active = arm
    arm.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    bones = {}
    for name, parent, sources in BONES + [(SADDLE_BONE, saddle_parent, [])]:
        eb = arm_data.edit_bones.new(name)
        m = Matrix(rest[name].tolist())
        eb.head = (0, 0, 0)
        eb.tail = (0, bone_length(data, frame, name, sources), 0)
        eb.matrix = m
        if parent:
            eb.parent = bones[parent]
        eb.use_connect = False
        eb.use_deform = name not in ("horse_root", SADDLE_BONE)
        bones[name] = eb
    bpy.ops.object.mode_set(mode="OBJECT")
    for pb in arm.pose.bones:
        pb.rotation_mode = "QUATERNION"
    arm.data.display_type = "STICK"
    return arm


def bone_length(data, frame, name, sources):
    """Game bone length: the source bones it stands for, end to end."""
    if not sources:
        return 0.25 if name == "horse_root" else 0.2
    src = _source_index(data)
    chain = [s for s in sources if s.startswith(sources[0])]      # a segment and its ".001" half
    return float(sum(data["bone_length"][src[s]] for s in chain)) * frame.scale


def game_weights(data):
    """(vertices, game bones) weights: source weights folded, at most four
    bones per vertex."""
    src = _source_index(data)
    w = data["weights"]
    out = np.zeros((w.shape[0], len(GAME_NAMES)), dtype=np.float32)
    for g, (_name, _parent, sources) in enumerate(BONES):
        for s in sources:
            out[:, g] += w[:, src[s]]
    missing = (out.sum(axis=1) == 0).sum()
    if missing:
        log(f"WARNING {missing} vertices without weights")
    return whp_skin.prune(out)


def build_body(data, frame, materials):
    """The horse's skin as one mesh in game space, faces and materials as
    in the source, weights folded onto the game bones."""
    co = frame.point(data["rest_co"])
    starts, totals, loops = data["loop_start"], data["loop_total"], data["loop_vert"]
    faces = [loops[s:s + t].tolist() for s, t in zip(starts, totals)]
    obj = new_mesh_object(BODY_NAME, co, faces, materials, face_materials=data["poly_mat"].tolist())
    weights = game_weights(data)
    whp_skin.write_groups(obj, weights, GAME_NAMES)
    return obj, weights


def bind(obj, armature):
    obj.parent = armature
    mod = obj.modifiers.get("Armature") or obj.modifiers.new("Armature", "ARMATURE")
    mod.object = armature


# --------------------------------------------------------------------------
# Clips
# --------------------------------------------------------------------------

PARENT = {name: parent for name, parent, _s in BONES}


def source_clip(data, frame, key):
    """Armature-space game matrices of a source action, {bone: (F, 4, 4)}."""
    src = _source_index(data)
    frames = data[f"act:{key}"]
    out = {"horse_root": np.repeat(np.eye(4)[None], len(frames), axis=0)}
    for name, _parent, sources in BONES:
        if sources:
            out[name] = np.array([frame.matrix(m) for m in frames[:, src[sources[0]]]])
    return out


def to_basis(pose, rest):
    """Pose-bone basis matrices (F, 4, 4) from armature-space matrices:
    pose = parent_pose @ (parent_rest^-1 @ rest) @ basis."""
    out = {}
    for name in GAME_NAMES:
        p = PARENT[name]
        if p is None:
            out[name] = np.linalg.inv(rest[name])[None] @ pose[name]
        else:
            rel = np.linalg.inv(rest[p]) @ rest[name]
            out[name] = np.linalg.inv(rel)[None] @ np.linalg.inv(pose[p]) @ pose[name]
    return out


def from_basis(basis, rest):
    """Armature-space matrices from basis matrices (forward kinematics)."""
    pose = {}
    for name in GAME_NAMES:
        p = PARENT[name]
        if p is None:
            pose[name] = rest[name][None] @ basis[name]
        else:
            rel = np.linalg.inv(rest[p]) @ rest[name]
            pose[name] = pose[p] @ rel[None] @ basis[name]
    return pose


def _quat(m):
    return Quaternion(Matrix(np.asarray(m)[:3, :3].tolist()).to_quaternion())


def _matrix(q, loc):
    m = np.eye(4)
    m[:3, :3] = np.array(q.to_matrix())
    m[:3, 3] = loc
    return m


def close_loop(basis, frames):
    """Make the last frame equal the first by spreading the difference over
    the last `frames` frames (rotation and location of every bone)."""
    out = {}
    for name, b in basis.items():
        count = len(b)
        q_first, q_last = _quat(b[0]), _quat(b[-1])
        delta = q_last.inverted() @ q_first
        shift = b[0][:3, 3] - b[-1][:3, 3]
        new = b.copy()
        for i in range(count - frames, count):
            t = (i - (count - 1 - frames)) / frames
            q = _quat(b[i]) @ Quaternion().slerp(delta, t)
            new[i] = _matrix(q, b[i][:3, 3] + shift * t)
        out[name] = new
    return out


def mix_basis(a, b, t):
    """Per bone: rotation slerped, location mixed (single frames, 4x4)."""
    out = {}
    for name in a:
        qa, qb = _quat(a[name]), _quat(b[name])
        out[name] = _matrix(qa.slerp(qb, t), a[name][:3, 3] * (1 - t) + b[name][:3, 3] * t)
    return out


def key_clip(armature, name, basis, loop=True):
    """Write a clip from basis matrices {bone: (F, 4, 4)}: every frame keyed
    (linear interpolation), rotation and location of every bone."""
    from whp_anim import action_fcurves

    action = bpy.data.actions.get(name)
    if action is not None:
        bpy.data.actions.remove(action)
    action = bpy.data.actions.new(name)
    action.use_fake_user = True
    ad = armature.animation_data or armature.animation_data_create()
    ad.action = action
    count = len(next(iter(basis.values())))
    for bone in GAME_NAMES:
        pb = armature.pose.bones[bone]
        last = None
        for f in range(count):
            m = basis[bone][f]
            q = _quat(m)
            if last is not None and last.dot(q) < 0:
                q.negate()
            last = q
            pb.rotation_quaternion = q
            pb.location = [float(x) for x in m[:3, 3]]
            pb.keyframe_insert("rotation_quaternion", frame=f)
            pb.keyframe_insert("location", frame=f)
    for fc in action_fcurves(action):
        for point in fc.keyframe_points:
            point.interpolation = "LINEAR"
    action.use_frame_range = True
    action.frame_start = 0
    action.frame_end = count - 1
    action.use_cyclic = loop
    ad.action = None
    for pb in armature.pose.bones:
        pb.location = (0, 0, 0)
        pb.rotation_quaternion = (1, 0, 0, 0)
        pb.scale = (1, 1, 1)
    return action


def skin(coords, weights, pose, rest, frame_index):
    """Linear blend skinning of rest-space points at one frame of a pose
    (weights over GAME_NAMES)."""
    mats = np.array([pose[n][frame_index] @ np.linalg.inv(rest[n]) for n in GAME_NAMES])
    return whp_skin.blend(coords, weights, mats)
