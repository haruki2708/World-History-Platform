"""Build public/battles/models/roman-legionary.glb from the source downloads.

    blender --background --factory-startup --disable-autoexec \
        --python art/blender/build_roman_legionary.py -- [--from STAGE] [--to STAGE] [--preview]

Stages run in order; each saves art/build/roman-legionary/<n>-<stage>.blend,
so a later stage can be re-run without repeating the earlier ones
(--from). With no arguments everything runs from the source files.
--preview writes quick renders of each stage to art/build/roman-legionary/.
"""

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bpy  # noqa: E402

import numpy as np  # noqa: E402

import roman_anims  # noqa: E402
import roman_fit  # noqa: E402
import roman_hands  # noqa: E402
import roman_lod  # noqa: E402
import roman_helmet  # noqa: E402
import roman_mail  # noqa: E402
import roman_shield  # noqa: E402
import roman_source  # noqa: E402
import whp_anim  # noqa: E402
import whp_export  # noqa: E402
import whp_materials  # noqa: E402
import whp_skeleton  # noqa: E402
import whp_skin  # noqa: E402
from roman_fit import FINAL_SCALE  # noqa: E402
from whp_common import BUILD_DIR, MODELS_DIR, log, mesh_objects, open_blend, reset_scene, save_blend, script_args  # noqa: E402
from whp_mesh import get_coords, set_coords  # noqa: E402
from whp_render import render_views  # noqa: E402

MODEL = "roman-legionary"
WORK_DIR = os.path.join(BUILD_DIR, MODEL)


def stage_source(args):
    reset_scene()
    roman_source.import_roman()


def stage_strip(args):
    roman_source.strip_imperial_kit()


def build_kit(detail, suffix=""):
    """The generated kit at one level of detail. Returns the new objects."""
    objs = bpy.data.objects
    mats = whp_materials.library() if detail == 2 else {m.name[4:]: m for m in bpy.data.materials if m.name.startswith("whp-")}
    mats["shield"] = bpy.data.materials["whp-shield-paint"]
    made = [
        roman_helmet.build_bowl(detail, mats, "Helmet" + suffix),
        roman_helmet.build_cheeks(detail, mats, "Helmet_cheeks" + suffix),
        roman_helmet.build_crest(detail, mats, 1.0 / FINAL_SCALE, "Helmet_crest" + suffix),
    ]
    shield = roman_shield.build(detail, mats, "Scutum" + suffix)
    roman_shield.place(shield, roman_hands.grip_axis_point(1), 1.0 / FINAL_SCALE)
    made.append(shield)
    if detail == 2:
        tunic = objs["Tunic_1"]
        yoke = roman_mail.build_yoke(tunic, mats)
        made += [
            roman_mail.build_shirt(tunic, mats),
            yoke,
            roman_mail.build_belt(tunic, mats),
        ]
    made.append(roman_mail.build_chest_hook(objs["Mail_yoke"], mats, detail, "Mail_hook" + suffix))
    return made


def stage_kit(args):
    objs = bpy.data.objects
    for side in (1, -1):
        roman_hands.curl_hand(objs["New_arms"], side)
    roman_hands.seat_sword(objs["Sword2_1"])
    roman_source.scabbard_to_right_hip(objs["Scabbard"])
    build_kit(2)
    # Game-resolution copies of the generated kit: the LOD stage uses them
    # as the low meshes and bakes the detailed kit onto them.
    for obj in build_kit(0, ".low"):
        obj.hide_render = True
        log(f"{obj.name}: {obj.data.polygons.__len__()} faces")


# Parts that follow one bone without bending.
RIGID = {
    "Helmet": "head",
    "Helmet_cheeks": "head",
    "Helmet_crest": "head",
    "New_eye": "head",
    "New_eye_2": "head",
    "Scutum": "hand_l",
    "Sword2_1": "hand_r",
    "Scabbard": "pelvis",
    "Mail_hook": "spine_03",
}
# Rounds of weight smoothing; cloth and mail get more than skin.
SMOOTHING = {"Tunic_1": 12, "Mail": 12, "Mail_yoke": 12, "Belt": 8}
DEFAULT_SMOOTHING = 3

# Poses that show whether the skin deforms properly. Rotations are about
# the figure's axes: X to its left, -Y forwards, Z up.
TEST_POSES = {
    "arms-up": [("upperarm_l", "Y", -80), ("upperarm_r", "Y", 80), ("lowerarm_r", "Y", 40)],
    "step": [("thigh_l", "X", -45), ("calf_l", "X", 55), ("thigh_r", "X", 22), ("calf_r", "X", 12),
             ("upperarm_r", "X", -30), ("upperarm_l", "X", 25)],
    "bend": [("spine_01", "X", 18), ("spine_02", "X", 16), ("spine_03", "X", 14), ("neck_01", "X", -20),
             ("head", "Z", 35), ("upperarm_l", "Y", 30), ("upperarm_r", "Y", -30)],
}


def base_name(obj):
    """Object name without the ".low" suffix of the game-resolution kit."""
    return obj.name.split(".")[0]


def stage_rig(args):
    meshes = mesh_objects()
    celt = whp_skeleton.load_celt()
    names = celt.bone_names
    index = {name: i for i, name in enumerate(names)}
    log("fit of the source model to the rig:")
    matrices = roman_fit.build(names, celt.joints, report=log)

    # The Celt's body brought into the source model's pose, to copy weights from.
    inverse = np.linalg.inv(matrices)
    source = whp_skin.WeightSource(whp_skin.blend(celt.coords, celt.weights, inverse), celt.triangles, celt.weights, names)
    fingers = {f"hand_{side}": [f"{finger}_0{n}_{side}" for finger in ("thumb", "index", "middle", "ring", "pinky")
                                for n in (1, 2, 3)] for side in ("l", "r")}

    for obj in meshes:
        coords = get_coords(obj)
        bone = RIGID.get(base_name(obj))
        if bone:
            weights = whp_skin.rigid(len(coords), len(names), index[bone])
        else:
            weights = source.sample(coords)
            # The fists are closed for good: fingers move with the hand.
            weights = whp_skin.merge_bones(weights, index, fingers)
            weights = whp_skin.smooth(weights, whp_skin.mesh_edges(obj.data), SMOOTHING.get(base_name(obj), DEFAULT_SMOOTHING))
            weights = whp_skin.prune(weights)
        set_coords(obj, whp_skin.blend(coords, weights, matrices))
        whp_skin.write_groups(obj, weights, names)
        log(f"skinned {obj.name}: {len(coords)} vertices, {int((weights.max(axis=0) > 0).sum())} bones")

    # How the shield sits on the hand bone at rest; the clips aim it by this.
    hand = matrices[index["hand_l"]][:3, :3] / roman_fit.BASE_SCALE
    down, out = roman_shield.axes_in_source()
    celt.armature["whp_shield_down"] = [float(x) for x in hand @ np.array(down)]
    celt.armature["whp_shield_out"] = [float(x) for x in hand @ np.array(out)]

    whp_skeleton.to_canonical(celt.armature, meshes)
    for obj in meshes:
        whp_skeleton.bind(obj, celt.armature)


def stage_anim(args):
    scene = bpy.context.scene
    scene.render.fps = whp_anim.FPS
    armature = bpy.data.objects[whp_skeleton.RIG_NAME]
    for action in roman_anims.build_all(armature):
        log(f"clip {action.name}: {int(action.frame_end)} frames at {whp_anim.FPS} fps")
    scene.frame_set(0)


def stage_lod(args):
    roman_lod.build()


CLIPS = ("idle", "walk", "attack")
LODS = ("LOD0", "LOD1", "LOD2")
GLB = os.path.join(MODELS_DIR, f"{MODEL}.glb")


def stage_export(args):
    armature = bpy.data.objects[whp_skeleton.RIG_NAME]
    meshes = [bpy.data.objects[name] for name in LODS]
    os.makedirs(MODELS_DIR, exist_ok=True)
    whp_export.export_glb(GLB, armature, meshes, CLIPS)


def check_model():
    """Read the exported file back; fail loudly if it breaks the contract."""
    problems = whp_export.check_glb(GLB, LODS, roman_lod.LIMITS, CLIPS, bone_count=67)
    problems += whp_export.reimport(GLB, LODS)
    if problems:
        for problem in problems:
            log("PROBLEM:", problem)
        raise SystemExit(1)
    log("check passed")


STAGES = [
    ("source", stage_source),
    ("strip", stage_strip),
    ("kit", stage_kit),
    ("rig", stage_rig),
    ("anim", stage_anim),
    ("lod", stage_lod),
    ("export", stage_export),
]


def stage_file(index):
    return os.path.join(WORK_DIR, f"{index + 1}-{STAGES[index][0]}.blend")


def preview(name):
    scene = bpy.context.scene
    objs = [o for o in mesh_objects(scene) if not o.hide_render and not o.name.startswith("whp-")]
    render_views(scene, objs, os.path.join(WORK_DIR, f"preview-{name}-{{view}}.png"))
    armature = bpy.data.objects.get(whp_skeleton.RIG_NAME)
    if armature is not None and name.endswith("rig"):
        for pose_name, pose in TEST_POSES.items():
            whp_skeleton.reset_pose(armature)
            whp_skeleton.apply_pose(armature, pose)
            render_views(scene, objs, os.path.join(WORK_DIR, f"preview-{name}-{pose_name}-{{view}}.png"),
                         views=("front34", "back34"))
        whp_skeleton.reset_pose(armature)
    if armature is not None and name.endswith("anim"):
        for clip in ("idle", "walk", "attack"):
            action = whp_anim.set_action(armature, clip)
            for frame in sorted({0, int(action.frame_end * 0.25), int(action.frame_end * 0.42), int(action.frame_end * 0.75)}):
                scene.frame_set(frame)
                render_views(scene, objs, os.path.join(WORK_DIR, f"preview-{name}-{clip}-{frame:02d}-{{view}}.png"),
                             views=("front34", "right"), size=700)
        armature.animation_data.action = None
        whp_skeleton.reset_pose(armature)
        scene.frame_set(0)


def main():
    names = [name for name, _ in STAGES]
    parser = argparse.ArgumentParser(prog="build_roman_legionary.py")
    parser.add_argument("--from", dest="first", choices=names, default=names[0])
    parser.add_argument("--to", dest="last", choices=names, default=names[-1])
    parser.add_argument("--preview", action="store_true")
    parser.add_argument("--check", action="store_true", help="only check the exported .glb")
    args = parser.parse_args(script_args())

    if args.check:
        check_model()
        return
    first, last = names.index(args.first), names.index(args.last)
    if first > last:
        parser.error("--from comes after --to")
    if first > 0:
        previous = stage_file(first - 1)
        if not os.path.isfile(previous):
            parser.error(f"{previous} is missing: run the earlier stages first")
        open_blend(previous)

    for index in range(first, last + 1):
        name, run = STAGES[index]
        log(f"=== stage {index + 1}/{len(STAGES)}: {name}")
        run(args)
        save_blend(stage_file(index))
        if args.preview:
            preview(f"{index + 1}-{name}")
    if names[last] == "export":
        check_model()        # empties the scene: runs after the last save
    log("done")


if __name__ == "__main__":
    main()
