"""Review images of a unit model, rendered from the exported .glb.

    blender --background --factory-startup --disable-autoexec \
        --python art/blender/render_review.py -- [--model roman-legionary] [--only NAME ...]

Writes JPEGs of at most 400 KB to art/renders/<model>/. Everything is
rendered from public/battles/models/<model>.glb, i.e. what the 3D scene
gets, except the source model in the comparison image.
"""

import argparse
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402

import roman_anims  # noqa: E402
import roman_source  # noqa: E402
import whp_skeleton  # noqa: E402
from whp_common import MODELS_DIR, RENDER_DIR, log, reset_scene, script_args, world_bounds  # noqa: E402
from whp_render import add_ground, aim_camera, setup_lights, setup_render, setup_world  # noqa: E402

MAX_BYTES = 400 * 1024
FRAME = 100                 # scene frame every render is taken at
LODS = ("LOD0", "LOD1", "LOD2")


# --------------------------------------------------------------------------
# Scene helpers
# --------------------------------------------------------------------------

class Figure:
    """One copy of the imported model: its armature and LOD meshes."""

    def __init__(self, armature, meshes):
        self.armature = armature
        self.meshes = meshes          # name -> object

    def visible(self):
        return [m for m in self.meshes.values() if not m.hide_render]


def import_model(path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.data.objects if o not in before]
    armature = next(o for o in new if o.type == "ARMATURE")
    meshes = {o.name: o for o in new if o.type == "MESH" and o.parent is armature}
    for obj in new:
        if obj.type == "MESH" and obj.parent is None:
            obj.hide_render = True          # the importer's bone display shape
    for obj in [armature, *meshes.values()]:
        obj.hide_render = True
        obj.hide_set(True)
    return Figure(armature, meshes)


def place(template, location=(0.0, 0.0, 0.0), turn=0.0, lod="LOD0"):
    """A new copy of the model (shared data) standing at `location`,
    turned `turn` degrees about the vertical, showing one LOD."""
    scene = bpy.context.scene
    armature = template.armature.copy()
    scene.collection.objects.link(armature)
    armature.hide_render = False
    armature.location = location
    armature.rotation_mode = "XYZ"
    armature.rotation_euler = (0.0, 0.0, math.radians(turn))
    meshes = {}
    for name, src in template.meshes.items():
        if name != lod:
            continue
        obj = src.copy()
        scene.collection.objects.link(obj)
        obj.parent = armature
        obj.hide_render = False
        for mod in obj.modifiers:
            if mod.type == "ARMATURE":
                mod.object = armature
        meshes[name] = obj
    figure = Figure(armature, meshes)
    still(figure)
    return figure


def still(figure):
    """Rest (bind) pose: no animation."""
    ad = figure.armature.animation_data or figure.armature.animation_data_create()
    ad.action = None
    for track in list(ad.nla_tracks):
        ad.nla_tracks.remove(track)
    for pb in figure.armature.pose.bones:
        pb.location = (0, 0, 0)
        pb.rotation_quaternion = (1, 0, 0, 0)
        pb.rotation_euler = (0, 0, 0)
        pb.scale = (1, 1, 1)


def play(figure, clip, clip_frame):
    """Show frame `clip_frame` of a clip at scene frame FRAME."""
    still(figure)
    action = bpy.data.actions[clip]
    ad = figure.armature.animation_data
    track = ad.nla_tracks.new()
    strip = track.strips.new(clip, FRAME - int(clip_frame), action)
    if hasattr(strip, "action_slot") and strip.action_slot is None and len(action.slots):
        strip.action_slot = action.slots[0]
    strip.extrapolation = "HOLD"


def clear_figures(template):
    keep = {template.armature, *template.meshes.values()}
    for obj in list(bpy.context.scene.objects):
        if obj.type in ("ARMATURE", "MESH") and obj not in keep and not obj.name.startswith("Icosphere"):
            bpy.data.objects.remove(obj, do_unlink=True)


def bounds_of(figures, extra=()):
    bpy.context.scene.frame_set(FRAME)
    objs = [m for f in figures for m in f.visible()] + list(extra)
    return world_bounds(objs)


def render_jpeg(scene, path, quality=90):
    """Render to JPEG; lower the quality until the file fits MAX_BYTES."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    settings = scene.render.image_settings
    settings.file_format = "JPEG"
    settings.color_mode = "RGB"
    scene.render.filepath = path
    scene.frame_set(FRAME)
    while True:
        settings.quality = quality
        bpy.ops.render.render(write_still=True)
        size = os.path.getsize(path)
        if size <= MAX_BYTES or quality <= 50:
            break
        quality -= 8
    log(f"rendered {os.path.basename(path)}: {size / 1024:.0f} KB, quality {quality}")


def stage(width, height, ground=False, samples=48):
    scene = bpy.context.scene
    setup_render(scene, width, height, samples=samples)
    setup_world(scene)
    setup_lights(scene)
    scene.frame_set(FRAME)
    if ground and bpy.data.objects.get("whp-ground") is None:
        add_ground(scene, 0.0, 80.0, color=(0.36, 0.33, 0.26))
    elif not ground and bpy.data.objects.get("whp-ground") is not None:
        bpy.data.objects["whp-ground"].hide_render = True
    if ground:
        bpy.data.objects["whp-ground"].hide_render = False
    return scene


def pad(lo, hi, amount):
    return lo - Vector((amount,) * 3), hi + Vector((amount,) * 3)


# --------------------------------------------------------------------------
# Images
# --------------------------------------------------------------------------

def views(template, out):
    """Front, left side (shield side) and back, standing (idle, frame 0)."""
    figures = []
    for i, turn in enumerate((0.0, -90.0, 180.0)):
        f = place(template, (1.35 * (i - 1), 0.0, 0.0), turn)
        play(f, "idle", 0)
        figures.append(f)
    scene = stage(1800, 1200)
    lo, hi = bounds_of(figures)
    aim_camera(scene, *pad(lo, hi, 0.04), "front", ortho=True, margin=1.04)
    render_jpeg(scene, os.path.join(out, "01-front-side-back.jpg"))


def three_quarter(template, out):
    f = place(template)
    play(f, "idle", 0)
    scene = stage(1100, 1300)
    lo, hi = bounds_of([f])
    aim_camera(scene, *pad(lo, hi, 0.03), Vector((-0.75, -1.0, 0.0)), ortho=True, margin=1.04, elevation=6)
    render_jpeg(scene, os.path.join(out, "02-three-quarter.jpg"))


def head(template, out):
    f = place(template)
    play(f, "idle", 0)
    scene = stage(1100, 1100, samples=64)
    bpy.context.view_layer.update()
    head_bone = f.armature.matrix_world @ f.armature.pose.bones["head"].head
    lo = head_bone + Vector((-0.17, -0.17, -0.20))
    hi = head_bone + Vector((0.17, 0.17, 0.38))
    for name, direction in (("03-head-front.jpg", Vector((0.45, -1.0, 0.0))),
                            ("04-head-side.jpg", Vector((-1.0, -0.25, 0.0)))):
        aim_camera(scene, lo, hi, direction, ortho=False, lens=85, margin=1.0, elevation=4)
        render_jpeg(scene, os.path.join(out, name))


def formation(template, out):
    """Twenty men: five files, four ranks, a little out of step."""
    figures = []
    offsets = [0, 23, 41, 9, 52, 31, 14, 47, 5, 36, 19, 58, 27, 2, 44, 12, 55, 33, 7, 39]
    turns = [2, -3, 1, 4, -2, -1, 3, -4, 0, 2, -3, 1, 2, -2, 4, -1, 0, 3, -3, 1]
    for rank in range(4):
        for file in range(5):
            i = rank * 5 + file
            x = (file - 2) * 1.05 + (0.06 if rank % 2 else 0.0)
            y = rank * 1.35
            f = place(template, (x, y, 0.0), turns[i])
            play(f, "idle", offsets[i])
            figures.append(f)
    scene = stage(1800, 1100, ground=True)
    lo, hi = bounds_of(figures)
    aim_camera(scene, lo, hi, Vector((-0.55, -1.0, 0.0)), ortho=False, lens=50, margin=1.05, elevation=20)
    render_jpeg(scene, os.path.join(out, "05-formation.jpg"))


def lods(template, out):
    figures = []
    for i, name in enumerate(LODS):
        f = place(template, (1.4 * (i - 1), 0.0, 0.0), 0.0, lod=name)
        play(f, "idle", 0)
        figures.append(f)
    scene = stage(1800, 1100)
    lo, hi = bounds_of(figures)
    aim_camera(scene, *pad(lo, hi, 0.04), Vector((-0.35, -1.0, 0.0)), ortho=True, margin=1.04)
    render_jpeg(scene, os.path.join(out, "06-lods.jpg"))


CLIP_FRAMES = {
    "idle": (0, 20, 40),
    "walk": (0, 8, 15),
    "attack": (0, 9, 16),
}


def animations(template, out):
    for n, (clip, frames) in enumerate(CLIP_FRAMES.items()):
        figures = []
        for i, frame in enumerate(frames):
            f = place(template, (1.6 * (i - 1), 0.0, 0.0))
            play(f, clip, frame)
            figures.append(f)
        scene = stage(1800, 1000)
        lo, hi = bounds_of(figures)
        aim_camera(scene, *pad(lo, hi, 0.04), Vector((-0.62, -1.0, 0.0)), ortho=True, margin=1.03, elevation=6)
        render_jpeg(scene, os.path.join(out, f"{7 + n:02d}-anim-{clip}.jpg"))
        clear_figures(template)


def compare(template, out):
    """Source model 07 as downloaded; the new model in its bind pose; the
    new model standing."""
    source = roman_source.import_roman()
    for obj in source:
        obj.location.x -= 2.25
    rest = place(template, (0.0, 0.0, 0.0))
    standing = place(template, (1.35, 0.0, 0.0))
    play(standing, "idle", 0)
    scene = stage(1900, 1100)
    lo, hi = bounds_of([rest, standing], source)
    aim_camera(scene, *pad(lo, hi, 0.04), "front", ortho=True, margin=1.03)
    render_jpeg(scene, os.path.join(out, "10-compare-source.jpg"))
    for obj in source:
        bpy.data.objects.remove(obj, do_unlink=True)


def test_poses(template, out):
    """The skin under strain: arms raised, a long step, bent forward."""
    figures = []
    for i, pose in enumerate(roman_anims.TEST_POSES.values()):
        f = place(template, (1.6 * (i - 1), 0.0, 0.0))
        whp_skeleton.apply_pose(f.armature, pose)
        figures.append(f)
    scene = stage(1800, 1100)
    lo, hi = bounds_of(figures)
    aim_camera(scene, *pad(lo, hi, 0.04), Vector((-0.62, -1.0, 0.0)), ortho=True, margin=1.03, elevation=6)
    render_jpeg(scene, os.path.join(out, "11-test-poses.jpg"))


IMAGES = {
    "views": views,
    "three-quarter": three_quarter,
    "head": head,
    "formation": formation,
    "lods": lods,
    "animations": animations,
    "compare": compare,
    "test-poses": test_poses,
}


def main():
    parser = argparse.ArgumentParser(prog="render_review.py")
    parser.add_argument("--model", default="roman-legionary")
    parser.add_argument("--only", nargs="*", choices=sorted(IMAGES), default=None)
    args = parser.parse_args(script_args())
    path = os.path.join(MODELS_DIR, f"{args.model}.glb")
    out = os.path.join(RENDER_DIR, args.model)
    for name in args.only or IMAGES:
        reset_scene()
        template = import_model(path)
        IMAGES[name](template, out)
    log("done")


if __name__ == "__main__":
    main()
