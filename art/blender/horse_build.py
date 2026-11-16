"""Build the horse for the cavalry models: art/build/horse/horse.blend.

    blender --background --factory-startup --disable-autoexec \
        --python art/blender/horse_build.py -- [--from STAGE] [--to STAGE]

Stages (each saves its file in art/build/horse/, so a later one can run
alone with --from):

    source   read the source .blend: mesh, weights, deform bones, gaits
             -> source.npz                                   (horse_source)
    rig      game rig, body, coat, mane, tail, tack          (horse_rig, horse_kit)
             -> 1-rig.blend
    anim     idle, walk, run, die (+ trot, canter)           (horse_clips)
             -> 2-anim.blend
    lod      LOD0..2 per group, atlas, bakes, one material   (horse_lod)
             -> 3-lod.blend
    finish   tidy, save horse.blend, test export to a .glb in art/build/horse/
             and check it                                    (whp_export)

The horse is not a unit model of its own: nothing is written to public/.
The rider models (T-022) load horse.blend. See art/README.md, "Ngựa".
"""

import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bpy  # noqa: E402
import numpy as np  # noqa: E402

import horse_clips  # noqa: E402
import horse_kit  # noqa: E402
import horse_lod  # noqa: E402
import horse_rig as rig  # noqa: E402
import horse_source  # noqa: E402
import whp_export  # noqa: E402
from whp_common import BUILD_DIR, ensure_dir, log, open_blend, reset_scene, save_blend, script_args  # noqa: E402

STAGES = ("source", "rig", "anim", "lod", "finish")
WORK = os.path.join(BUILD_DIR, "horse")
NPZ = os.path.join(WORK, "source.npz")
OUT = os.path.join(WORK, "horse.blend")
TEST_GLB = os.path.join(WORK, "horse-test.glb")
INFO = os.path.join(WORK, "horse-info.json")
CLIPS = ("idle", "walk", "run", "die")
EXTRA_CLIPS = ("trot", "canter")


def stage_file(i):
    return os.path.join(WORK, f"{i}-{STAGES[i]}.blend")


def load_data():
    data = dict(np.load(NPZ))
    return data, rig.Frame(data)


def armature_rest(armature):
    return {b.name: np.array(b.matrix_local) for b in armature.data.bones}


# --------------------------------------------------------------------------

def stage_source():
    ensure_dir(WORK)
    horse_source.extract(NPZ)


def stage_rig():
    reset_scene()
    scene = bpy.context.scene
    scene.render.fps = rig.FPS
    data, frame = load_data()
    mats = horse_kit.body_materials()
    body_obj, weights = rig.build_body(data, frame, mats)
    rest0 = rig.rest_matrices(data, frame, np.zeros(3))
    body = horse_kit.Body(body_obj, weights, rest0, frame.scale)
    horse_kit.coat_colours(body)
    tack = horse_kit.tack_materials()
    mane = horse_kit.build_mane(body, mats[horse_kit.SLOT_HAIR])
    tail = horse_kit.build_tail(body, mats[horse_kit.SLOT_HAIR])
    cloth, seat = horse_kit.build_cloth(body, tack["wool"], tack["leather"])
    bridle = horse_kit.build_bridle(body, tack["leather"], tack["iron"])
    neckrope = horse_kit.build_neckrope(body, tack["rope"])

    # The saddle bone hangs from the spine bone the seat lies over.
    spine = ["horse_hips"] + [f"horse_spine_{i}" for i in range(1, 6)]
    heads = [rest0[n][1, 3] for n in spine]
    parent = spine[0]
    for name, y in zip(spine, heads):
        if y >= seat[1]:
            parent = name
    armature = rig.build_armature(data, frame, seat, parent)
    armature["whp_seat"] = [float(x) for x in seat]
    armature["whp_seat_parent"] = parent
    for obj in (body_obj, mane, tail, cloth, bridle, neckrope):
        rig.bind(obj, armature)
    log(f"rig: {len(armature.data.bones)} bones; saddle bone under {parent} at {np.round(seat, 3).tolist()}")
    save_blend(stage_file(1))


def stage_anim():
    open_blend(stage_file(1))
    scene = bpy.context.scene
    scene.render.fps = rig.FPS
    armature = bpy.data.objects[rig.RIG_NAME]
    rest = armature_rest(armature)
    data, frame = load_data()
    body_co = frame.point(data["rest_co"])
    weights = rig.game_weights(data)
    info = {"fps": rig.FPS, "clips": {}}

    for name, key in horse_clips.GAITS.items():
        basis = horse_clips.gait(data, frame, key, rest)
        rig.key_clip(armature, name, basis, loop=True)
        pose = rig.from_basis(basis, rest)
        count = len(basis["horse_hips"])
        seconds = (count - 1) / rig.FPS
        distance, speed, per_hoof = horse_clips.cycle_distance(pose, rest, body_co, weights, seconds)
        lows = horse_clips.ground_report(name, pose, rest, body_co, weights)
        info["clips"][name] = {"source": key, "frames": count - 1, "seconds": round(seconds, 3),
                               "cycle_m": round(distance, 2), "speed_m_s": round(speed, 2),
                               "lowest_m": [round(float(lows.min()), 3), round(float(lows.max()), 3)]}
        log(f"{name} (source {key}): {count - 1} frames, {seconds:.3f} s, one cycle {distance:.2f} m "
            f"({speed:.2f} m/s; per hoof {per_hoof})")

    basis = horse_clips.idle(data, frame, rest)
    rig.key_clip(armature, "idle", basis, loop=True)
    lows = horse_clips.ground_report("idle", rig.from_basis(basis, rest), rest, body_co, weights)
    info["clips"]["idle"] = {"frames": horse_clips.IDLE_FRAMES - 1, "seconds": round((horse_clips.IDLE_FRAMES - 1) / rig.FPS, 3),
                             "lowest_m": [round(float(lows.min()), 3), round(float(lows.max()), 3)]}
    start = {n: b[0] for n, b in basis.items()}
    basis = horse_clips.die(armature, rest, start, body_co, weights)
    rig.key_clip(armature, "die", basis, loop=False)
    pose = rig.from_basis(basis, rest)
    last = rig.skin(body_co, weights, pose, rest, horse_clips.DIE_FRAMES - 1)
    info["clips"]["die"] = {"frames": horse_clips.DIE_FRAMES - 1, "seconds": round((horse_clips.DIE_FRAMES - 1) / rig.FPS, 3),
                            "last_frame_height_m": [round(float(last[:, 2].min()), 3), round(float(last[:, 2].max()), 3)]}
    log(f"die: last frame from {last[:, 2].min():.3f} to {last[:, 2].max():.3f} m above the ground")

    # Where the seat is in each clip (for the rider): height range.
    seat = np.array(armature["whp_seat"])
    parent = armature["whp_seat_parent"]
    for name in CLIPS + EXTRA_CLIPS:
        action = bpy.data.actions[name]
        count = int(action.frame_end) + 1
        heights = []
        from whp_anim import set_action
        set_action(armature, name)
        for f in range(count):
            scene.frame_set(f)
            m = np.array(armature.pose.bones[rig.SADDLE_BONE].matrix)
            heights.append(float(m[2, 3]))
        info["clips"][name]["seat_height_m"] = [round(min(heights), 3), round(max(heights), 3)]
    armature.animation_data.action = None
    for pb in armature.pose.bones:
        pb.location = (0, 0, 0)
        pb.rotation_quaternion = (1, 0, 0, 0)
    info["seat"] = {"bone": rig.SADDLE_BONE, "parent": parent, "rest": [round(float(x), 3) for x in seat]}
    info["withers_m"] = rig.WITHERS_HEIGHT
    info["scale_from_source"] = round(frame.scale, 4)
    with open(INFO, "w", encoding="utf-8") as f:
        json.dump(info, f, indent=2)
    log("clip info:", json.dumps(info["clips"]))
    scene.frame_start, scene.frame_end = 0, 60
    save_blend(stage_file(2))


def stage_lod():
    open_blend(stage_file(2))
    armature = bpy.data.objects[rig.RIG_NAME]
    rest = armature_rest(armature)
    lods, totals = horse_lod.build(armature, rest)
    info = json.load(open(INFO, encoding="utf-8")) if os.path.exists(INFO) else {}
    info["triangles"] = {name: _tris(obj) for name, obj in sorted(lods.items())}
    info["triangles_total"] = totals
    with open(INFO, "w", encoding="utf-8") as f:
        json.dump(info, f, indent=2)
    save_blend(stage_file(3))


def _tris(obj):
    obj.data.calc_loop_triangles()
    return len(obj.data.loop_triangles)


def stage_finish():
    open_blend(stage_file(3))
    scene = bpy.context.scene
    armature = bpy.data.objects[rig.RIG_NAME]
    game = bpy.data.collections.new("horse")
    detailed = bpy.data.collections.new("detailed")
    scene.collection.children.link(game)
    scene.collection.children.link(detailed)
    for obj in list(scene.objects):
        if obj.type not in ("MESH", "ARMATURE"):
            continue
        is_game = obj is armature or "_LOD" in obj.name
        for coll in list(obj.users_collection):
            coll.objects.unlink(obj)
        (game if is_game else detailed).objects.link(obj)
        if not is_game:
            obj.hide_render = True
            obj.hide_set(True)
    detailed.hide_render = True
    for obj in game.objects:
        if obj.type == "MESH":
            obj.hide_render = not obj.name.endswith("LOD0")
    save_blend(OUT)
    log(f"saved {OUT}")

    # Test export: the horse alone with its four clips, checked and read
    # back. Not shipped; it shows the file exports cleanly for T-022.
    meshes = [bpy.data.objects[f"{g}_LOD{i}"] for g in ("horse",) for i in range(3)]
    whp_export.export_glb(TEST_GLB, armature, meshes, CLIPS)
    problems = whp_export.check_glb(TEST_GLB, [m.name for m in meshes], horse_lod.LIMITS, CLIPS,
                                    len(armature.data.bones))
    ground = (("idle", 0, (-0.03, 0.03), (1.5, 2.1)),
              ("walk", 0, (-0.03, 0.03), (1.5, 2.1)),
              ("die", "last", (-0.05, 0.05), (0.3, 1.2)))
    problems += whp_export.reimport(TEST_GLB, [m.name for m in meshes], ground=ground)
    for p in problems:
        log("PROBLEM", p)
    if problems:
        sys.exit(1)
    log("test export: no problems")


RUN = {"source": stage_source, "rig": stage_rig, "anim": stage_anim, "lod": stage_lod, "finish": stage_finish}


def main(argv):
    parser = argparse.ArgumentParser(prog="horse_build.py")
    parser.add_argument("--from", dest="start", choices=STAGES, default=STAGES[0])
    parser.add_argument("--to", dest="stop", choices=STAGES, default=STAGES[-1])
    args = parser.parse_args(argv)
    a, b = STAGES.index(args.start), STAGES.index(args.stop)
    for stage in STAGES[a:b + 1]:
        log(f"=== horse: stage {stage}")
        RUN[stage]()


if __name__ == "__main__":
    main(script_args())
