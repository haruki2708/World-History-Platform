"""The build of a unit model, shared by every model.

A model is a module `unit_<id>.py` (dashes become underscores) that holds
only what is particular to it; see unit_roman_legionary.py. Everything else
runs here, in stages:

    source   import the source model, drop what does not belong   unit.build_source()
    kit      build the kit: helmet, shield, armour, weapons...      unit.build_kit()
    rig      fit the body to the shared rig, transfer skin weights  unit.fit(), RIGID, SHARED, SMOOTHING,
                                                                     unit.rig_extras()
    anim     the six clips from the animation library              unit.KIT (whp_clips)
    lod      LOD0..2, the atlas, the bakes, the one material        unit.PARTS, unit.LOD2 (whp_unit_lod)
    export   write the .glb, check it, list it in index.json

Each stage saves art/build/<model>/<n>-<stage>.blend, so a later stage can
be re-run alone (--from). A unit module provides:

    MODEL               the model id, e.g. "roman-legionary"
    build_source()      stage source
    build_kit()         stage kit
    fit(names, joints, report) -> (bones, 4, 4) matrices taking the source
                        body into the rig's rest pose (whp_skin.blend)
    RIGID               {object: bone}: parts that follow one bone; or
                        {object: (bone, other)}: fitted to the rig with the
                        first bone, then skinned to the other (whp_clips.Kit.spare)
    SHARED              {object: (bone, bone)}: parts that follow two bones half and half
    SMOOTHING           {object: rounds of weight smoothing}; DEFAULT_SMOOTHING
    MERGE_FINGERS       True if the fists are closed in the mesh (fingers follow the hand)
    rig_extras(armature, matrices, index)   set what the clips need on the
                        armature (whp_clips.Kit) before it is made canonical
    KIT                 whp_clips.Kit
    PARTS, LOD2         see whp_unit_lod
    REVIEW              names of the review images (render_review.py)
    GROUND_CHECKS       optional: poses checked against the ground after the
                        export, if not whp_export.GROUND_CHECKS (a spear
                        held upright stands higher than a man)
"""

import argparse
import glob
import importlib
import json
import os

import bpy
import numpy as np

import whp_anim
import whp_clips
import whp_export
import whp_skeleton
import whp_skin
import whp_unit_lod
from whp_common import BLENDER_DIR, BUILD_DIR, MODELS_DIR, log, mesh_objects, open_blend, reset_scene, save_blend
from whp_mesh import get_coords, set_coords
from whp_render import render_views

STAGES = ("source", "kit", "rig", "anim", "lod", "export")
LODS = ("LOD0", "LOD1", "LOD2")
CLIPS = ("idle", "walk", "run", "attack", "die", "jog")
LIMITS = (8000, 1500, 300)          # triangles per LOD (docs/ARCHITECTURE.md)
BONES = 67
INDEX = os.path.join(MODELS_DIR, "index.json")


# --------------------------------------------------------------------------
# Models
# --------------------------------------------------------------------------

def unit_ids():
    """Ids of every model that has a unit module."""
    names = sorted(os.path.basename(p)[5:-3] for p in glob.glob(os.path.join(BLENDER_DIR, "unit_*.py")))
    return [name.replace("_", "-") for name in names]


def load_unit(model):
    return importlib.import_module("unit_" + model.replace("-", "_"))


def work_dir(model):
    return os.path.join(BUILD_DIR, model)


def glb_path(model):
    return os.path.join(MODELS_DIR, f"{model}.glb")


def base_name(obj):
    """Object name without the ".low" suffix of the game-resolution kit."""
    return obj.name.split(".")[0]


# --------------------------------------------------------------------------
# Stages
# --------------------------------------------------------------------------

def stage_source(unit):
    reset_scene()
    unit.build_source()


def stage_kit(unit):
    unit.build_kit()


def stage_rig(unit):
    meshes = mesh_objects()
    celt = whp_skeleton.load_celt()
    names = celt.bone_names
    index = {name: i for i, name in enumerate(names)}
    log("fit of the source model to the rig:")
    matrices = unit.fit(names, celt.joints, report=log)

    # The Celt's body brought into the source model's pose, to copy weights from.
    inverse = np.linalg.inv(matrices)
    source = whp_skin.WeightSource(whp_skin.blend(celt.coords, celt.weights, inverse), celt.triangles, celt.weights, names)
    fingers = {f"hand_{side}": [f"{finger}_0{n}_{side}" for finger in ("thumb", "index", "middle", "ring", "pinky")
                                for n in (1, 2, 3)] for side in ("l", "r")}
    smoothing = getattr(unit, "SMOOTHING", {})
    default_smoothing = getattr(unit, "DEFAULT_SMOOTHING", 3)
    shared = getattr(unit, "SHARED", {})

    for obj in meshes:
        coords = get_coords(obj)
        name = base_name(obj)
        skin_to = None
        if name in unit.RIGID:
            bone = unit.RIGID[name]
            if isinstance(bone, tuple):
                bone, skin_to = bone
            weights = whp_skin.rigid(len(coords), len(names), index[bone])
        elif name in shared:
            bones = shared[name]
            weights = sum(whp_skin.rigid(len(coords), len(names), index[b]) for b in bones) / len(bones)
        else:
            weights = source.sample(coords)
            if getattr(unit, "MERGE_FINGERS", True):
                weights = whp_skin.merge_bones(weights, index, fingers)
            weights = whp_skin.smooth(weights, whp_skin.mesh_edges(obj.data), smoothing.get(name, default_smoothing))
            weights = whp_skin.prune(weights)
        set_coords(obj, whp_skin.blend(coords, weights, matrices))
        if skin_to is not None:
            weights = whp_skin.rigid(len(coords), len(names), index[skin_to])
        whp_skin.write_groups(obj, weights, names)
        log(f"skinned {obj.name}: {len(coords)} vertices, {int((weights.max(axis=0) > 0).sum())} bones")

    unit.rig_extras(celt.armature, matrices, index)
    whp_skeleton.to_canonical(celt.armature, meshes)
    for obj in meshes:
        whp_skeleton.bind(obj, celt.armature)


def weapon_axis(coords, hand):
    """Unit vector along a held weapon's length, from the hand towards the
    far end: the main axis of its vertices (for rig_extras)."""
    centred = coords - coords.mean(axis=0)
    axis = np.linalg.svd(centred, full_matrices=False)[2][0]
    far = coords[np.argmax(np.linalg.norm(coords - hand, axis=1))]
    if np.dot(far - hand, axis) < 0:
        axis = -axis
    return axis / np.linalg.norm(axis)


def stage_anim(unit):
    scene = bpy.context.scene
    scene.render.fps = whp_anim.FPS
    armature = bpy.data.objects[whp_skeleton.RIG_NAME]
    builder = whp_clips.Builder(armature, unit.KIT)
    for action in builder.build():
        log(f"clip {action.name}: {int(action.frame_end)} frames at {whp_anim.FPS} fps")
    for clip, metres in builder.strides.items():
        before, after, shift = builder.slips[clip]
        log(f"{clip}: {metres:.3f} m per loop; planted feet slip at most {before * 100:.0f}% of the "
            f"ground's step before the lock, {after * 100:.0f}% after (ankles moved up to {shift * 100:.1f} cm)")
    log(f"die: lifted {builder.lying_lift * 100:.1f} cm when lying")
    scene.frame_set(0)


def stage_lod(unit):
    whp_unit_lod.build(unit, LIMITS)


def stage_export(unit):
    armature = bpy.data.objects[whp_skeleton.RIG_NAME]
    meshes = [bpy.data.objects[name] for name in LODS]
    os.makedirs(MODELS_DIR, exist_ok=True)
    whp_export.export_glb(glb_path(unit.MODEL), armature, meshes, CLIPS)
    update_index(unit.MODEL)


RUN = {
    "source": stage_source,
    "kit": stage_kit,
    "rig": stage_rig,
    "anim": stage_anim,
    "lod": stage_lod,
    "export": stage_export,
}


# --------------------------------------------------------------------------
# Check and model index
# --------------------------------------------------------------------------

def check_model(model):
    """Read the exported file back; return the list of problems."""
    path = glb_path(model)
    if not os.path.isfile(path):
        return [f"{path} does not exist"]
    problems = whp_export.check_glb(path, LODS, LIMITS, CLIPS, bone_count=BONES)
    ground = getattr(load_unit(model), "GROUND_CHECKS", whp_export.GROUND_CHECKS)
    problems += whp_export.reimport(path, LODS, ground)
    with open(INDEX, encoding="utf-8") as f:
        if model not in json.load(f).get("models", []):
            problems.append(f"{model} is not listed in {INDEX}")
    return problems


def update_index(model):
    """Add the model to public/battles/models/index.json, in alphabetical
    order. The file is rewritten only when the list changes."""
    models = []
    if os.path.isfile(INDEX):
        with open(INDEX, encoding="utf-8") as f:
            models = json.load(f).get("models", [])
    if model in models:
        return
    models = sorted(set(models) | {model})
    with open(INDEX, "w", encoding="utf-8", newline="\n") as f:
        f.write('{\n  "models": ' + json.dumps(models) + "\n}\n")
    log(f"listed {model} in {INDEX}")


# --------------------------------------------------------------------------
# Previews and the command line
# --------------------------------------------------------------------------

def stage_file(model, index):
    return os.path.join(work_dir(model), f"{index + 1}-{STAGES[index]}.blend")


def preview(model, name):
    scene = bpy.context.scene
    out = work_dir(model)
    objs = [o for o in mesh_objects(scene) if not o.hide_render and not o.name.startswith("whp-")]
    render_views(scene, objs, os.path.join(out, f"preview-{name}-{{view}}.png"))
    armature = bpy.data.objects.get(whp_skeleton.RIG_NAME)
    if armature is not None and name.endswith("rig"):
        for pose_name, pose in whp_clips.TEST_POSES.items():
            whp_skeleton.reset_pose(armature)
            whp_skeleton.apply_pose(armature, pose)
            render_views(scene, objs, os.path.join(out, f"preview-{name}-{pose_name}-{{view}}.png"),
                         views=("front34", "back34"))
        whp_skeleton.reset_pose(armature)
    if armature is not None and name.endswith("anim"):
        for clip in CLIPS:
            action = whp_anim.set_action(armature, clip)
            for frame in sorted({0, int(action.frame_end * 0.25), int(action.frame_end * 0.5), int(action.frame_end)}):
                scene.frame_set(frame)
                render_views(scene, objs, os.path.join(out, f"preview-{name}-{clip}-{frame:02d}-{{view}}.png"),
                             views=("front34", "right"), size=700)
        armature.animation_data.action = None
        whp_skeleton.reset_pose(armature)
        scene.frame_set(0)


def build(model, first=STAGES[0], last=STAGES[-1], previews=False):
    unit = load_unit(model)
    i, j = STAGES.index(first), STAGES.index(last)
    if i > j:
        raise SystemExit("--from comes after --to")
    if i > 0:
        previous = stage_file(model, i - 1)
        if not os.path.isfile(previous):
            raise SystemExit(f"{previous} is missing: run the earlier stages first")
        open_blend(previous)
    for k in range(i, j + 1):
        log(f"=== {model}: stage {k + 1}/{len(STAGES)}: {STAGES[k]}")
        RUN[STAGES[k]](unit)
        save_blend(stage_file(model, k))
        if previews:
            preview(model, f"{k + 1}-{STAGES[k]}")
    if STAGES[j] == "export":
        return check_model(model)       # empties the scene: runs after the last save
    return []


def main(argv):
    ids = unit_ids()
    parser = argparse.ArgumentParser(prog="build_model.py")
    parser.add_argument("--model", required=True, choices=ids + ["all"])
    parser.add_argument("--from", dest="first", choices=STAGES, default=STAGES[0])
    parser.add_argument("--to", dest="last", choices=STAGES, default=STAGES[-1])
    parser.add_argument("--preview", action="store_true", help="quick renders after each stage")
    parser.add_argument("--check", action="store_true", help="only check the exported .glb")
    args = parser.parse_args(argv)
    models = ids if args.model == "all" else [args.model]
    problems = []
    for model in models:
        found = check_model(model) if args.check else build(model, args.first, args.last, args.preview)
        problems += [f"{model}: {p}" for p in found]
    if problems:
        for problem in problems:
            log("PROBLEM:", problem)
        raise SystemExit(1)
    log("check passed" if args.check or args.last == "export" else "done")
