"""Before and after of a model rebuilt on the "hi" ladder (build_model.py --hi).

    blender --background --factory-startup --disable-autoexec \
        --python art/blender/render_upgrade.py -- --model MODEL [--only NAME ...]

"Before" is what the 3D scene loads today, public/battles/models/<model>.glb
with its three levels; "after" is art/build/<model>/<model>-hi.glb with its
four. Both are lit by a high sun over green ground, close to the look of the
scene, and written to art/renders/upgrade/<model>-NN-<name>.jpg:

    close      the figure seen close: LOD0 of each, standing
    strike     the same at the moment of the blow (frame of the attack clip
               where the right hand is furthest forward)
    detail     head and chest (a horseman: with his horse's head)
    levels     every level of each ladder side by side, enlarged alike
    near       a block of men as the scene's camera sees it from near by
    middle     a larger block from the middle distance
    far        a still larger one from far off: the usual view of a battle

In the last three, each man is shown at the level his height on screen
gives him, as the scene picks it (BEFORE and AFTER below), by a camera with
the scene's field of view in a view 1920 x 1080: what a player sees at that
distance. The picture is that view cut close round the block, and for
`middle` and `far` every pixel is drawn two and three times as large, so
that what the eye gets at that distance can be looked at. "Before" is the
upper picture, "after" the lower.
"""

import argparse
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bpy  # noqa: E402
import numpy as np  # noqa: E402
from mathutils import Vector  # noqa: E402

import render_review as rr  # noqa: E402
import whp_build  # noqa: E402
from whp_common import BUILD_DIR, MODELS_DIR, RENDER_DIR, log, reset_scene, script_args  # noqa: E402
from whp_render import aim_camera, get_camera  # noqa: E402

OUT_DIR = os.path.join(RENDER_DIR, "upgrade")
VIEW = (1920, 1080)
FOV = 40.0                  # degrees, top to bottom: the scene's camera (BattleEngine.ts)
# Height on screen, pixels, from which each level is shown (the last level below).
BEFORE = (("LOD0", 110), ("LOD1", 32), ("LOD2", 0))
AFTER = (("LOD0", 110), ("LOD1", 44), ("LOD2", 15), ("LOD3", 0))
FONT = r"C:\Windows\Fonts\arialbd.ttf"

SKY = (0.42, 0.62, 0.92)
GRASS = (0.075, 0.16, 0.035)

# blocks: files, ranks, height on screen of a man in the middle (pixels), enlargement.
FOOT = dict(height=1.85, gap=1.9, strike_gap=2.4, file=1.05, rank=1.35, detail=(1.02, 1.98), detail_gap=1.25,
            level_gap=1.5, blocks={"near": (8, 5, 118, 1), "middle": (10, 5, 58, 2), "far": (12, 5, 26, 3)})
HORSE = dict(height=2.45, gap=3.3, strike_gap=3.9, file=2.1, rank=3.5, detail=(1.2, 2.72), detail_gap=2.7,
             level_gap=2.5, blocks={"near": (5, 3, 118, 1), "middle": (6, 3, 58, 2), "far": (7, 3, 26, 3)})


def sunny(scene):
    """A high sun, blue sky light and green ground: near the scene's look."""
    world = scene.world
    for node in world.node_tree.nodes:
        if node.type == "BACKGROUND":
            # The backdrop the camera sees, and the light the sky gives.
            is_backdrop = abs(node.inputs["Strength"].default_value - 1.0) < 1e-6
            node.inputs["Color"].default_value = (*SKY, 1.0) if is_backdrop else (0.72, 0.84, 1.0, 1.0)
            if not is_backdrop:
                node.inputs["Strength"].default_value = 0.8
    energies = {"whp-key": 4.4, "whp-fill": 0.7, "whp-rim": 1.4}
    for obj in scene.objects:
        if obj.type == "LIGHT" and obj.name in energies:
            obj.data.energy = energies[obj.name]
            obj.data.angle = math.radians(2.0)
    ground = bpy.data.objects.get("whp-ground")
    if ground is not None:
        bsdf = ground.data.materials[0].node_tree.nodes["Principled BSDF"]
        bsdf.inputs["Base Color"].default_value = (*GRASS, 1.0)
    scene.view_settings.look = "Medium High Contrast"


def clear_labels():
    for obj in [o for o in bpy.context.scene.objects if o.type == "FONT"]:
        bpy.data.objects.remove(obj, do_unlink=True)


def label(text, location, size, camera):
    """White lettering that faces the camera."""
    font = bpy.data.fonts.load(FONT, check_existing=True) if os.path.isfile(FONT) else None
    curve = bpy.data.curves.new("whp-label", "FONT")
    curve.body = text
    curve.size = size
    curve.align_x = "CENTER"
    if font is not None:
        curve.font = font
    mat = bpy.data.materials.get("whp-label") or bpy.data.materials.new("whp-label")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    out = nodes.new("ShaderNodeOutputMaterial")
    glow = nodes.new("ShaderNodeEmission")
    glow.inputs["Color"].default_value = (1.0, 1.0, 1.0, 1.0)
    glow.inputs["Strength"].default_value = 1.6
    mat.node_tree.links.new(glow.outputs["Emission"], out.inputs["Surface"])
    curve.materials.append(mat)
    obj = bpy.data.objects.new("whp-label", curve)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = camera.rotation_euler
    return obj


def stage(width, height):
    scene = rr.stage(width, height, ground=True, samples=64)
    sunny(scene)
    return scene


def keep(*templates):
    """Remove every figure but the imported models themselves."""
    kept = []
    for t in templates:
        kept += [t.armature, *t.meshes.values()]
    rr.clear_figures(kept)
    clear_labels()


def pair(before, after, clip, frame, gap, lod_before="LOD0", lod_after="LOD0"):
    a = rr.place(before, (-gap / 2, 0.0, 0.0), 0.0, lod=lod_before)
    b = rr.place(after, (gap / 2, 0.0, 0.0), 0.0, lod=lod_after)
    for f in (a, b):
        rr.play(f, clip, frame)
    return a, b


def close(before, after, lay, shoot, clip="idle", frame=0, name="close", gap=None):
    """LOD0 of each, seen from the sword side so that the body shows."""
    a, b = pair(before, after, clip, frame, gap or lay["gap"])
    scene = stage(2000, 1300)
    lo, hi = rr.bounds_of([a, b])
    lo, hi = rr.pad(lo, hi, 0.05)
    top = hi.z
    hi.z += 0.18 * lay["height"]             # room for the lettering
    camera = aim_camera(scene, lo, hi, Vector((-0.75, -1.0, 0.0)), ortho=False, lens=85, margin=1.03, elevation=7)
    for figure, text in ((a, "TRƯỚC"), (b, "SAU")):
        label(text, figure.armature.location + Vector((0.0, 0.0, top + 0.06 * lay["height"])), 0.09 * lay["height"], camera)
    shoot(scene, name)
    keep(before, after)


def detail(before, after, lay, shoot):
    """Head and chest of each (a horseman: with his horse's head)."""
    a, b = pair(before, after, "idle", 0, lay["detail_gap"])
    scene = stage(2000, 1100)
    lo, hi = rr.bounds_of([a, b])
    lo.z, hi.z = lay["detail"][0], min(hi.z, lay["detail"][1])
    camera = aim_camera(scene, lo, hi, Vector((-0.7, -1.0, 0.0)), ortho=False, lens=110, margin=1.0, elevation=4)
    size = 0.045 * (lay["detail"][1] - lay["detail"][0]) / 0.96
    for figure, text in ((a, "TRƯỚC"), (b, "SAU")):
        at = figure.armature.location + Vector((-0.2 * lay["detail_gap"], 0.0, lay["detail"][0] + size * 1.6))
        label(text, at, size, camera)
    shoot(scene, "detail")
    keep(before, after)


def levels(before, after, lay, shoot):
    """Every level of each ladder, enlarged alike."""
    figures, notes = [], []
    x = 0.0
    for template, ladder, text in ((before, BEFORE, "TRƯỚC"), (after, AFTER, "SAU")):
        for name, _px in ladder:
            f = rr.place(template, (x, 0.0, 0.0), 0.0, lod=name)
            rr.play(f, "idle", 0)
            tris = len(template.meshes[name].data.loop_triangles)
            notes.append((x, f"{text} {name}: {tris:,}".replace(",", " ")))
            figures.append(f)
            x += lay["level_gap"]
        x += lay["level_gap"] * 0.5
    scene = stage(2400, 900)
    lo, hi = rr.bounds_of(figures)
    lo, hi = rr.pad(lo, hi, 0.05)
    top = hi.z
    hi.z += 0.16 * lay["height"]
    camera = aim_camera(scene, lo, hi, Vector((-0.6, -1.0, 0.0)), ortho=True, margin=1.02, elevation=5)
    for at, text in notes:
        label(text, Vector((at, 0.0, top + 0.05 * lay["height"])), 0.062 * lay["height"], camera)
    shoot(scene, "levels")
    keep(before, after)


OFFSETS = [0, 23, 41, 9, 52, 31, 14, 47, 5, 36, 19, 58, 27, 2, 44, 12, 55, 33, 7, 39]
TURNS = [2, -3, 1, 4, -2, -1, 3, -4, 0, 2, -3, 1, 2, -2, 4, -1, 0, 3, -3, 1]


def block(template, ladder, lay, files, ranks, pixels):
    """A block of men, each at the level his height on screen gives him.
    The camera has the scene's field of view and stands so far off that a
    man in the middle of the block is `pixels` high. Returns scene, camera."""
    scene = stage(*VIEW)
    camera = get_camera(scene)
    camera.data.type = "PERSP"
    camera.data.sensor_fit = "VERTICAL"
    camera.data.angle_y = math.radians(FOV)
    focal_px = (VIEW[1] / 2) / math.tan(math.radians(FOV / 2))
    centre = Vector((0.0, (ranks - 1) * lay["rank"] / 2, lay["height"] / 2))
    depth = lay["height"] * focal_px / pixels
    # From in front of the block, to its right, 22 degrees above the ground.
    back = Vector((-0.5, -0.82, 0.0)).normalized() * math.cos(math.radians(22)) + Vector((0, 0, math.sin(math.radians(22))))
    camera.location = centre + back * depth
    camera.rotation_euler = back.to_track_quat("Z", "Y").to_euler()
    camera.data.clip_start = 0.1
    camera.data.clip_end = depth * 3 + 200.0
    bpy.context.view_layer.update()
    forward = -back
    counts = {}
    for rank in range(ranks):
        for file in range(files):
            i = (rank * files + file) % len(OFFSETS)
            x = (file - (files - 1) / 2) * lay["file"] + (0.06 if rank % 2 else 0.0)
            y = rank * lay["rank"]
            away = (Vector((x, y, lay["height"] / 2)) - camera.location).dot(forward)
            high = lay["height"] * focal_px / max(away, 0.1)
            lod = next(name for name, least in ladder if high >= least)
            counts[lod] = counts.get(lod, 0) + 1
            f = rr.place(template, (x, y, 0.0), TURNS[i], lod=lod)
            rr.play(f, "idle", OFFSETS[i])
    log("  levels shown:", ", ".join(f"{k} x {v}" for k, v in sorted(counts.items())))
    scene.frame_set(rr.FRAME)
    return scene, camera


def window(scene, camera, lay, files, ranks):
    """The part of the view the block fills, with some room: left, bottom, width, height in pixels."""
    from bpy_extras.object_utils import world_to_camera_view

    half = (files - 1) / 2 * lay["file"] + 0.9
    deep = (ranks - 1) * lay["rank"] + 0.9
    tall = lay["height"] * 1.22
    xs, ys = [], []
    for x in (-half - lay["height"] * 0.9, half):
        for y in (-0.9, deep):
            for z in (0.0, tall):
                p = world_to_camera_view(scene, camera, Vector((x, y, z)))
                xs.append(p.x * VIEW[0])
                ys.append(p.y * VIEW[1])
    left = max(int(min(xs)) - 12, 0)
    bottom = max(int(min(ys)) - 12, 0)
    right = min(int(max(xs)) + 12, VIEW[0])
    top = min(int(max(ys)) + 12, VIEW[1])
    return left, bottom, right - left, top - bottom


def blocks(before, after, lay, shoot, name):
    files, ranks, pixels, factor = lay["blocks"][name]
    panels = []
    for template, ladder, text in ((before, BEFORE, "TRƯỚC"), (after, AFTER, "SAU")):
        scene, camera = block(template, ladder, lay, files, ranks, pixels)
        # The lettering stands on the ground to the left of the block.
        half = (files - 1) / 2 * lay["file"]
        label(text, Vector((-half - lay["height"] * 0.55, -0.4, 0.05)), lay["height"] * 0.24, camera)
        left, bottom, width, height = window(scene, camera, lay, files, ranks)
        picture = rr.render_panel(scene)[bottom:bottom + height, left:left + width]
        panels.append([np.repeat(np.repeat(picture, factor, axis=0), factor, axis=1)])
        keep(before, after)
    shoot(bpy.context.scene, name, panels=panels)


IMAGES = ("close", "strike", "detail", "levels", "near", "middle", "far")


def main():
    parser = argparse.ArgumentParser(prog="render_upgrade.py")
    parser.add_argument("--model", required=True, choices=whp_build.unit_ids())
    parser.add_argument("--only", nargs="*", choices=IMAGES)
    args = parser.parse_args(script_args())
    rr.MAX_BYTES = 900 * 1024               # these are compared closely: less compression

    reset_scene()
    old = os.path.join(MODELS_DIR, f"{args.model}.glb")
    new = os.path.join(BUILD_DIR, args.model, f"{args.model}-hi.glb")
    for path in (old, new):
        if not os.path.isfile(path):
            raise SystemExit(f"{path} is missing")
    unit = whp_build.load_unit(args.model)
    lay = HORSE if rr.cavalry(unit) else FOOT
    before = rr.import_model(old)
    after = rr.import_model(new)
    for template in (before, after):
        for mesh in template.meshes.values():
            mesh.data.calc_loop_triangles()

    for number, name in enumerate(IMAGES, start=1):
        if args.only and name not in args.only:
            continue

        def shoot(scene, what, panels=None, extra=0, number=number):
            path = os.path.join(OUT_DIR, f"{args.model}-{number + extra:02d}-{what}.jpg")
            if panels is None:
                rr.render_jpeg(scene, path)
            else:
                rr.save_panels(scene, panels, path)

        log(f"=== {args.model}: {name}")
        if name == "close":
            close(before, after, lay, shoot)
        elif name == "strike":
            close(before, after, lay, shoot, clip="attack", frame=rr.strike_frame(after), name="strike",
                  gap=lay["strike_gap"])
        elif name == "detail":
            detail(before, after, lay, shoot)
        elif name == "levels":
            levels(before, after, lay, shoot)
        else:
            blocks(before, after, lay, shoot, name)


if __name__ == "__main__":
    main()
