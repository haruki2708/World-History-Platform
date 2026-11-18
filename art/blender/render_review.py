"""Review images of a unit model, rendered from the exported .glb.

    blender --background --factory-startup --disable-autoexec \
        --python art/blender/render_review.py -- --model MODEL [--only NAME ...]
    blender ... --python art/blender/render_review.py -- --attack-styles [--model MODEL]
    blender ... --python art/blender/render_review.py -- --model MODEL --before OLD.glb         --compare {fists,skirt,pila,spear} --out NN-NAME.jpg
    blender ... --python art/blender/render_review.py -- --lineup [--cavalry]
    blender ... --python art/blender/render_review.py -- --model MODEL --jog NN-NAME.jpg
    blender ... --python art/blender/render_review.py -- --model MODEL --duel OTHER

Writes JPEGs of at most 400 KB to art/renders/<model>/, numbered in the
order of the unit module's REVIEW list. Everything is rendered from
public/battles/models/<model>.glb, i.e. what the 3D scene gets, except the
source model in the "compare" image.

--attack-styles renders the attacks of the animation library that the
model does not carry (whp_clips.ATTACKS) on its build file
(art/build/<model>/4-anim.blend), into art/renders/animation-library/.

Cavalry models (a unit module with HORSE) get the same images laid out for
a horse: the figures further apart, the clips seen from the side.

--jog renders the run and the jog of a foot model one above the other (what
the scene played at a steady pace before the jog clip, and what it plays now).

--duel renders two models (two on foot, or two horsemen) face to face, as far apart as the scene
stands them when they fight hand to hand, around the moment a blow lands:
MODEL strikes and OTHER takes it on the shield (block), then is struck
(hit), then the other way round. Into art/renders/duel-<MODEL>-<OTHER>.jpg.

--before renders the same views (COMPARE) of an older file of the model
(e.g. taken out of git with `git show REV:public/battles/models/X.glb`)
and of the current one: the older on the top row, the current below, into
art/renders/<model>/<--out>.
"""

import argparse
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bpy  # noqa: E402
import numpy as np  # noqa: E402
from mathutils import Vector  # noqa: E402

import whp_anim  # noqa: E402
import whp_build  # noqa: E402
import whp_clips  # noqa: E402
import whp_skeleton  # noqa: E402
from whp_common import BUILD_DIR, MODELS_DIR, RENDER_DIR, log, open_blend, reset_scene, script_args, world_bounds  # noqa: E402
from whp_render import add_ground, aim_camera, setup_lights, setup_render, setup_world  # noqa: E402

MAX_BYTES = 400 * 1024
FRAME = 100                 # scene frame every render is taken at
LODS = ("LOD0", "LOD1", "LOD2")


# --------------------------------------------------------------------------
# Scene helpers
# --------------------------------------------------------------------------

class Figure:
    """One copy of the imported model: its armature and LOD meshes."""

    def __init__(self, armature, meshes, actions=None):
        self.armature = armature
        self.meshes = meshes          # name -> object
        self.actions = actions or {}  # clip -> this model's action (names clash between imports)

    def visible(self):
        return [m for m in self.meshes.values() if not m.hide_render]


def import_model(path):
    before = set(bpy.data.objects)
    before_actions = set(bpy.data.actions)
    bpy.context.scene.render.fps = whp_anim.FPS      # the importer maps seconds to frames at this rate
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
    # Imported LOD names may carry a suffix when a second model is imported.
    meshes = {name.split(".")[0]: obj for name, obj in meshes.items()}
    actions = {a.name.split(".")[0]: a for a in bpy.data.actions if a not in before_actions}
    return Figure(armature, meshes, actions)


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
    figure = Figure(armature, meshes, template.actions)
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
    action = figure.actions.get(clip) or bpy.data.actions[clip]
    ad = figure.armature.animation_data
    track = ad.nla_tracks.new()
    strip = track.strips.new(clip, FRAME - int(clip_frame), action)
    if hasattr(strip, "action_slot") and strip.action_slot is None and len(action.slots):
        strip.action_slot = action.slots[0]
    strip.extrapolation = "HOLD"


def clip_length(clip):
    return int(round(bpy.data.actions[clip].frame_range[1]))


def clear_figures(keep=()):
    keep = set(keep)
    for obj in list(bpy.context.scene.objects):
        if obj.type in ("ARMATURE", "MESH") and obj not in keep and not obj.name.startswith("Icosphere") \
                and not obj.hide_get() and obj.name != "whp-ground":
            bpy.data.objects.remove(obj, do_unlink=True)


def bounds_of(figures, extra=()):
    bpy.context.scene.frame_set(FRAME)
    objs = [m for f in figures for m in f.visible()] + list(extra)
    return world_bounds(objs)


def bone_head(figure, bone):
    bpy.context.view_layer.update()
    return figure.armature.matrix_world @ figure.armature.pose.bones[bone].head


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


def render_panel(scene):
    """Render the current view; return its pixels (h, w, 4)."""
    path = os.path.join(BUILD_DIR, "_panel.png")
    settings = scene.render.image_settings
    settings.file_format = "PNG"
    settings.color_mode = "RGB"
    scene.render.filepath = path
    scene.frame_set(scene.frame_current)
    bpy.ops.render.render(write_still=True)
    image = bpy.data.images.load(path)
    w, h = image.size
    pixels = np.array(image.pixels[:], dtype=np.float32).reshape(h, w, 4)
    bpy.data.images.remove(image)
    os.remove(path)
    return pixels


def save_panels(scene, rows, path, quality=90):
    """Stitch rows of panels (lists of pixel arrays, bottom row last) into
    one JPEG of at most MAX_BYTES."""
    sheet = np.concatenate([np.concatenate(row, axis=1) for row in reversed(rows)], axis=0)
    h, w = sheet.shape[:2]
    image = bpy.data.images.new("whp-sheet", w, h)
    image.pixels.foreach_set(sheet.ravel())
    settings = scene.render.image_settings
    settings.file_format = "JPEG"
    settings.color_mode = "RGB"
    os.makedirs(os.path.dirname(path), exist_ok=True)
    while True:
        settings.quality = quality
        image.save_render(path, scene=scene)
        size = os.path.getsize(path)
        if size <= MAX_BYTES or quality <= 50:
            break
        quality -= 8
    bpy.data.images.remove(image)
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
# Images. Each takes (template, unit, shoot) and renders one or more files
# through shoot(scene, what) -> NN-<what>.jpg; SHOTS says how many.
# --------------------------------------------------------------------------

def cavalry(unit):
    return hasattr(unit, "HORSE")


def views(template, unit, shoot):
    """Front, left side (shield side) and back, standing (idle, frame 0)."""
    figures = []
    spots = (-2.5, 0.0, 2.3) if cavalry(unit) else (-1.4, 0.0, 1.4)
    for i, turn in enumerate((0.0, -90.0, 180.0)):
        f = place(template, (spots[i], 0.0, 0.0), turn)
        play(f, "idle", 0)
        figures.append(f)
    scene = stage(1800, 1200)
    lo, hi = bounds_of(figures)
    aim_camera(scene, *pad(lo, hi, 0.04), "front", ortho=True, margin=1.04)
    shoot(scene, "front-side-back")


def three_quarter(template, unit, shoot):
    f = place(template)
    play(f, "idle", 0)
    scene = stage(1100, 1300)
    lo, hi = bounds_of([f])
    aim_camera(scene, *pad(lo, hi, 0.03), Vector((-0.75, -1.0, 0.0)), ortho=True, margin=1.04, elevation=6)
    shoot(scene, "three-quarter")


def head(template, unit, shoot):
    f = place(template)
    play(f, "idle", 0)
    scene = stage(1100, 1100, samples=64)
    centre = bone_head(f, "head")
    lo = centre + Vector((-0.17, -0.17, -0.20))
    hi = centre + Vector((0.17, 0.17, 0.38))
    for what, direction in (("head-front", Vector((0.45, -1.0, 0.0))), ("head-side", Vector((-1.0, -0.25, 0.0)))):
        aim_camera(scene, lo, hi, direction, ortho=False, lens=85, margin=1.0, elevation=4)
        shoot(scene, what)


def formation(template, unit, shoot):
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
    shoot(scene, "formation")


def lods(template, unit, shoot):
    figures = []
    gap = 2.1 if cavalry(unit) else 1.45
    for i, name in enumerate(LODS):
        f = place(template, (gap * (i - 1), 0.0, 0.0), 0.0, lod=name)
        play(f, "idle", 0)
        figures.append(f)
    scene = stage(1800, 1100)
    lo, hi = bounds_of(figures)
    aim_camera(scene, *pad(lo, hi, 0.04), Vector((-0.35, -1.0, 0.0)), ortho=True, margin=1.04)
    shoot(scene, "lods")


def strike_frame(template, clip="attack"):
    """Frame of a clip where the right hand is furthest forwards."""
    f = place(template)
    best, frame = None, 0
    for k in range(clip_length(clip) + 1):
        play(f, clip, k)
        bpy.context.scene.frame_set(FRAME)
        y = bone_head(f, "hand_r").y
        if best is None or y < best:
            best, frame = y, k
    clear_figures([template.armature, *template.meshes.values()])
    return frame


# The clips the review shows, in order. The foot models' images were made
# before the jog (T-022); their review leaves it out so that the numbering
# of their images stays as it was (render_review --jog shows it).
FOOT_CLIPS = ("idle", "walk", "run", "attack", "die")
CAVALRY_CLIPS = ("idle", "walk", "jog", "run", "attack", "die")


def review_clips(unit):
    return CAVALRY_CLIPS if cavalry(unit) else FOOT_CLIPS


def clip_frames(template, unit=None):
    """Three telling frames of each clip."""
    strike = strike_frame(template)
    if unit is not None and cavalry(unit):
        return {
            "idle": (0, 50, 100),
            "walk": (0, 12, 25),
            "jog": (0, 6, 12),
            "run": (0, 3, 6),
            "attack": (0, max(strike // 2, 1), strike),
            "die": (0, 24, clip_length("die")),
        }
    return {
        "idle": (0, 25, 50),
        "walk": (0, 10, 20),
        "run": (0, 7, 14),
        "attack": (0, max(strike // 2, 1), strike),
        "die": (0, 20, clip_length("die")),
    }


def animations(template, unit, shoot):
    frames = clip_frames(template, unit)
    for clip in review_clips(unit):
        figures = []
        for i, frame in enumerate(frames[clip]):
            if cavalry(unit):           # a row along the horses' length, seen from their right
                f = place(template, (0.0, 3.2 * (i - 1), 0.0))
            else:
                f = place(template, (1.7 * (i - 1), 0.0, 0.0))
            play(f, clip, frame)
            figures.append(f)
        scene = stage(1800, 1000)
        lo, hi = bounds_of(figures)
        direction = Vector((-1.0, -0.22, 0.0)) if cavalry(unit) else Vector((-0.62, -1.0, 0.0))
        aim_camera(scene, *pad(lo, hi, 0.04), direction, ortho=True, margin=1.03, elevation=6)
        shoot(scene, f"anim-{clip}")
        clear_figures([template.armature, *template.meshes.values()])


def without_surface_map(figure):
    """Show a figure with its material as it was before the metallicRoughness
    map: roughness 0.72 everywhere, no metal."""
    for obj in figure.meshes.values():
        slot = obj.material_slots[0]
        mat = slot.material.copy()
        bsdf = next(node for node in mat.node_tree.nodes if node.type == "BSDF_PRINCIPLED")
        for name, value in (("Roughness", 0.72), ("Metallic", 0.0)):
            for link in list(bsdf.inputs[name].links):
                mat.node_tree.links.remove(link)
            bsdf.inputs[name].default_value = value
        slot.link = "OBJECT"
        slot.material = mat


def metal(template, unit, shoot):
    """Head to knee twice, seen from the sword side: left without the
    metallicRoughness map, right as exported."""
    before = place(template, (-0.75, 0.0, 0.0), 25.0)
    after = place(template, (0.75, 0.0, 0.0), 25.0)
    for f in (before, after):
        play(f, "idle", 0)
    without_surface_map(before)
    scene = stage(1800, 1200, samples=64)
    lo, hi = bounds_of([before, after])
    lo.z = 0.55
    aim_camera(scene, *pad(lo, hi, 0.02), Vector((-0.2, -1.0, 0.0)), ortho=True, margin=1.03, elevation=8)
    shoot(scene, "metal-before-after")


def compare(template, unit, shoot):
    """Source model 07 as downloaded; the new model in its bind pose; the
    new model standing."""
    import roman_source

    source = roman_source.import_roman()
    for obj in source:
        obj.location.x -= 2.25
    rest = place(template, (0.0, 0.0, 0.0))
    standing = place(template, (1.4, 0.0, 0.0))
    play(standing, "idle", 0)
    scene = stage(1900, 1100)
    lo, hi = bounds_of([rest, standing], source)
    aim_camera(scene, *pad(lo, hi, 0.04), "front", ortho=True, margin=1.03)
    shoot(scene, "compare-source")


def test_poses(template, unit, shoot):
    """The skin under strain: arms raised, a long step, bent forward."""
    figures = []
    for i, pose in enumerate(whp_clips.TEST_POSES.values()):
        f = place(template, (1.6 * (i - 1), 0.0, 0.0))
        whp_skeleton.apply_pose(f.armature, pose)
        figures.append(f)
    scene = stage(1800, 1100)
    lo, hi = bounds_of(figures)
    aim_camera(scene, *pad(lo, hi, 0.04), Vector((-0.62, -1.0, 0.0)), ortho=True, margin=1.03, elevation=6)
    shoot(scene, "test-poses")


def closeups(template, unit, shoot):
    """The unit's CLOSEUPS side by side: (title, bone, low corner, high
    corner from the bone's head, view direction), standing (idle 0)."""
    f = place(template)
    play(f, "idle", 0)
    scene = stage(900, 1100, samples=64)
    panels = []
    for _title, bone, lo, hi, direction in unit.CLOSEUPS:
        centre = bone_head(f, bone)
        aim_camera(scene, centre + Vector(lo), centre + Vector(hi), Vector(direction), ortho=False, lens=70,
                   margin=1.0, elevation=6)
        panels.append(render_panel(scene))
    shoot.panels(scene, [panels], unit.CLOSEUP_NAME)


def beside(template, unit, shoot):
    """This model next to another one (unit.BESIDE), front and side."""
    if cavalry(unit):
        return beside_horse(template, unit, shoot)
    other = import_model(whp_build.glb_path(unit.BESIDE))
    figures = []
    for i, (model, turn) in enumerate(((other, 0.0), (template, 0.0), (other, -90.0), (template, -90.0))):
        f = place(model, (1.3 * i + (0.25 if i >= 2 else 0.0), 0.0, 0.0), turn)
        play(f, "idle", 0)
        figures.append(f)
    scene = stage(1900, 1200)
    lo, hi = bounds_of(figures)
    aim_camera(scene, *pad(lo, hi, 0.04), "front", ortho=True, margin=1.03)
    shoot(scene, f"beside-{unit.BESIDE}")


def beside_horse(template, unit, shoot):
    """A horseman beside a foot soldier (unit.BESIDE): seen from the front,
    the man at the horse's right shoulder; seen from the horse's right
    side, the man ahead of its head."""
    other = import_model(whp_build.glb_path(unit.BESIDE))
    scene = stage(1000, 1200)
    panels = []
    for direction, spot in (("front", (-1.25, -0.4, 0.0)), ("right", (0.0, -2.2, 0.0))):
        figures = [place(other, spot, 0.0), place(template)]
        for f in figures:
            play(f, "idle", 0)
        lo, hi = bounds_of(figures)
        aim_camera(scene, *pad(lo, hi, 0.05), direction, ortho=True, margin=1.03)
        panels.append(render_panel(scene))
        clear_figures([other.armature, *other.meshes.values(), template.armature, *template.meshes.values()])
    shoot.panels(scene, [panels], f"beside-{unit.BESIDE}")


IMAGES = {
    "views": views,
    "three-quarter": three_quarter,
    "head": head,
    "formation": formation,
    "lods": lods,
    "animations": animations,
    "metal": metal,
    "compare": compare,
    "test-poses": test_poses,
    "closeups": closeups,
    "beside": beside,
}


def shots(unit, name):
    """How many files an image writes."""
    return {"head": 2, "animations": len(review_clips(unit))}.get(name, 1)


class Shooter:
    """Renders to art/renders/<model>/NN-<what>.jpg, numbering as it goes."""

    def __init__(self, out, number=1):
        self.out = out
        self.number = number
        self.written = []

    def path(self, what):
        path = os.path.join(self.out, f"{self.number:02d}-{what}.jpg")
        self.number += 1
        self.written.append(os.path.basename(path))
        return path

    def __call__(self, scene, what):
        render_jpeg(scene, self.path(what))

    def panels(self, scene, rows, what):
        save_panels(scene, rows, self.path(what))


def render_model(model, only=None):
    unit = whp_build.load_unit(model)
    shoot = Shooter(os.path.join(RENDER_DIR, model))
    for name in unit.REVIEW:
        if only is not None and name not in only:
            shoot.number += shots(unit, name)
            continue
        reset_scene()
        template = import_model(whp_build.glb_path(model))
        IMAGES[name](template, unit, shoot)
    log("images:", ", ".join(shoot.written))


# --------------------------------------------------------------------------
# All the infantry in a row
# --------------------------------------------------------------------------

LINEUP = ["roman-velites", "roman-hastatus", "roman-legionary", "roman-triarii",
          "libyan-infantry", "iberian-infantry", "gallic-infantry", "balearic-slinger"]


CAVALRY_LINEUP = ["roman-cavalry", "iberian-gallic-cavalry", "numidian-cavalry"]


def lineup(horse=False):
    """The infantry models side by side, front view, standing (idle, frame 0):
    art/renders/infantry-lineup.jpg. With `horse`, the cavalry models seen
    from their right side: art/renders/cavalry-lineup.jpg."""
    reset_scene()
    figures = []
    models = CAVALRY_LINEUP if horse else LINEUP
    for i, model in enumerate(models):
        template = import_model(whp_build.glb_path(model))
        spot = (0.0, 2.9 * i, 0.0) if horse else (1.15 * i, 0.0, 0.0)
        f = place(template, spot, 0.0)
        play(f, "idle", 0)
        figures.append(f)
    scene = stage(2600, 1000 if horse else 900)
    lo, hi = bounds_of(figures)
    aim_camera(scene, *pad(lo, hi, 0.04), "right" if horse else "front", ortho=True, margin=1.03)
    render_jpeg(scene, os.path.join(RENDER_DIR, "cavalry-lineup.jpg" if horse else "infantry-lineup.jpg"), quality=85)
    log("lineup:", ", ".join(models))


def jog_image(model, out):
    """A foot model's run (top row) and jog (bottom row) over one loop,
    seen from its right: before the jog clip the scene played the run,
    slowed down, for a steady pace."""
    reset_scene()
    template = import_model(whp_build.glb_path(model))
    scene = stage(380, 620, samples=32)
    rows = []
    for clip in ("run", "jog"):
        end = clip_length(clip)
        row = []
        for k in range(6):
            f = place(template)
            play(f, clip, int(round(k * end / 6)))
            scene.frame_set(FRAME)
            aim_camera(scene, Vector((-0.6, -0.95, -0.02)), Vector((0.6, 0.95, 2.3)), "right", ortho=True, margin=1.0)
            row.append(render_panel(scene))
            clear_figures([template.armature, *template.meshes.values()])
        rows.append(row)
    path = os.path.join(RENDER_DIR, model, out)
    save_panels(scene, rows, path)
    log("run and jog:", path)


# --------------------------------------------------------------------------
# Two models face to face: a blow struck and taken
# --------------------------------------------------------------------------

def forward_reach(template, clip, frame):
    """How far in front of where it stands a model reaches at a frame of a
    clip, metres (the scene measures the same on the baked clips:
    measureStrike in src/components/battle/engine/figures/model.ts)."""
    f = place(template)
    play(f, clip, frame)
    bpy.context.scene.frame_set(FRAME)
    lo, _hi = bounds_of([f])
    clear_figures([template.armature, *template.meshes.values()])
    return -lo.y


def duel_image(model, other):
    """Rows: MODEL strikes and OTHER blocks; MODEL strikes and OTHER is hit;
    then OTHER strikes. Columns: 0.2 s before the blow lands, as it lands,
    0.17 s after. The two stand as far apart as the scene stands them:
    1.3 times the reach of the shorter weapon, or shield against shield."""
    reset_scene()
    a = import_model(whp_build.glb_path(model))
    b = import_model(whp_build.glb_path(other))
    # Horsemen take a wider and higher picture than men on foot.
    mounted = any(hasattr(whp_build.load_unit(m), "HORSE") for m in (model, other))
    behind, top = (2.2, 3.05) if mounted else (1.15, 2.35)
    scene = stage(1000 if mounted else 560, 440 if mounted else 620, samples=32)
    strike = {id(a): strike_frame(a), id(b): strike_frame(b)}
    reach = {id(t): forward_reach(t, "attack", strike[id(t)]) for t in (a, b)}
    front = {id(t): forward_reach(t, "idle", 0) for t in (a, b)}
    apart = max(min(reach.values()) * 1.3, sum(front.values()))
    log(f"{model}: blow lands at frame {strike[id(a)]}, reach {reach[id(a)]:.2f} m, front {front[id(a)]:.2f} m")
    log(f"{other}: blow lands at frame {strike[id(b)]}, reach {reach[id(b)]:.2f} m, front {front[id(b)]:.2f} m")
    log(f"they stand {apart:.2f} m apart")
    taken = whp_clips.REACT["impact"]
    rows = []
    for striker, clip in ((a, "block"), (a, "hit"), (b, "block"), (b, "hit")):
        row = []
        for offset in (-6, 0, 5):
            # MODEL stands at the back (+Y) and faces the camera's left; OTHER faces it.
            figures = [place(a, (0.0, apart / 2, 0.0), 0.0), place(b, (0.0, -apart / 2, 0.0), 180.0)]
            for template, f in zip((a, b), figures):
                if template is striker:
                    play(f, "attack", max(strike[id(striker)] + offset, 0))
                else:
                    play(f, clip, taken + offset)
            scene.frame_set(FRAME)
            aim_camera(scene, Vector((-0.9, -apart / 2 - behind, -0.02)), Vector((0.9, apart / 2 + behind, top)), "right",
                       ortho=True, margin=1.0)
            row.append(render_panel(scene))
            clear_figures([a.armature, *a.meshes.values(), b.armature, *b.meshes.values()])
        rows.append(row)
    path = os.path.join(RENDER_DIR, f"duel-{model}-{other}.jpg")
    save_panels(scene, rows, path)
    log("duel:", path)


# --------------------------------------------------------------------------
# The library's other attacks, on a model's build file
# --------------------------------------------------------------------------

def attack_styles(model):
    """Each attack of whp_clips.ATTACKS that the model does not carry, three
    frames each, on the detailed model of its "anim" stage file. The man
    keeps his own weapon (a sword stands in for a spear, a javelin or a
    sling) and his shield."""
    unit = whp_build.load_unit(model)
    open_blend(os.path.join(whp_build.work_dir(model), "4-anim.blend"))
    armature = bpy.data.objects[whp_skeleton.RIG_NAME]
    objs = [o for o in bpy.context.scene.objects if o.type == "MESH" and o.parent is armature and not o.hide_render]
    scene = stage(560, 760, samples=24)
    scene.frame_set(0)
    lo = Vector((-0.8, -0.85, -0.02))
    hi = Vector((0.8, 0.65, 2.15))
    rows = []
    for style in whp_clips.ATTACKS:
        if style == unit.KIT.attack:
            continue
        kit = whp_clips.Kit(shield=unit.KIT.shield, attack=style)
        action = whp_clips.ATTACKS[style](whp_clips.Builder(armature, kit))
        whp_anim.set_action(armature, action.name)
        end = int(action.frame_end)
        row = []
        for frame in (0, end * 3 // 10, end // 2):
            scene.frame_set(frame)
            aim_camera(scene, lo, hi, Vector((-0.62, -1.0, 0.0)), ortho=True, margin=1.0, elevation=6)
            row.append(render_panel(scene))
        rows.append(row)
        log(f"attack style {style}: frames 0, {end * 3 // 10}, {end // 2} of {end}")
    del objs
    save_panels(scene, rows, os.path.join(RENDER_DIR, "animation-library", "attack-styles.jpg"))


# --------------------------------------------------------------------------
# Before and after a change
# --------------------------------------------------------------------------

def _fist_box(f, side):
    """Centre of a fist: halfway from the wrist to the knuckles."""
    return (bone_head(f, f"hand_{side}") + bone_head(f, f"middle_01_{side}")) / 2


def compare_fists(template):
    """Both fists standing (idle 0), then the sword hand raised in the
    attack: close-ups."""
    scene = stage(700, 700, samples=64)
    panels = []
    # The left fist is behind the shield: seen from behind.
    shots = [("idle", 0, "l", Vector((0.35, 1.0, 0.15))), ("idle", 0, "l", Vector((-0.25, 1.0, -0.3))),
             ("idle", 0, "r", Vector((-1.0, -0.6, 0.15))), ("idle", 0, "r", Vector((0.2, -1.0, -0.35))),
             ("attack", None, "r", Vector((-0.8, -1.0, 0.1)))]
    strike = strike_frame(template)
    for clip, frame, side, direction in shots:
        f = place(template)
        play(f, clip, frame if frame is not None else max(strike // 2, 1))
        scene.frame_set(FRAME)
        centre = _fist_box(f, side)
        aim_camera(scene, centre - Vector((0.1, 0.1, 0.1)), centre + Vector((0.1, 0.1, 0.1)), direction,
                   ortho=False, lens=70, margin=1.0)
        panels.append(render_panel(scene))
        clear_figures([template.armature, *template.meshes.values()])
    return panels


SKIRT_FRAMES = {"attack": (0.40, 0.50, 0.60, 0.70), "run": (0.25, 0.75)}


def compare_skirt(template):
    """The hips and thighs in the attack (around the lunge) and in the
    run, from the front on the weapon side (the shield hides the other)."""
    scene = stage(560, 640, samples=48)
    panels = []
    for clip, shares in SKIRT_FRAMES.items():
        for share in shares:
            f = place(template)
            play(f, clip, int(round(share * clip_length(clip))))
            scene.frame_set(FRAME)
            centre = bone_head(f, "pelvis") + Vector((0.0, 0.0, -0.18))
            aim_camera(scene, centre - Vector((0.32, 0.32, 0.36)), centre + Vector((0.32, 0.32, 0.30)),
                       Vector((-0.62, -1.0, 0.0)), ortho=True, margin=1.0, elevation=8)
            panels.append(render_panel(scene))
            clear_figures([template.armature, *template.meshes.values()])
    return panels


def compare_pila(template):
    """Standing, the attack (start and strike) and lying dead: whole figure."""
    scene = stage(620, 900, samples=48)
    panels = []
    strike = strike_frame(template)
    for clip, frame in (("idle", 0), ("attack", 0), ("attack", strike), ("die", clip_length("die"))):
        f = place(template)
        play(f, clip, frame)
        scene.frame_set(FRAME)
        lo = Vector((-0.9, -1.3, -0.02))
        hi = Vector((0.9, 1.0, 2.5))
        aim_camera(scene, lo, hi, Vector((-0.75, -1.0, 0.0)), ortho=True, margin=1.0, elevation=6)
        panels.append(render_panel(scene))
        clear_figures([template.armature, *template.meshes.values()])
    return panels


def compare_spear(template):
    """Seen from the side (his right): standing, walking, running."""
    scene = stage(620, 900, samples=48)
    panels = []
    for clip, frame in (("idle", 0), ("idle", 40), ("walk", 0), ("walk", 20), ("run", 7)):
        f = place(template)
        play(f, clip, frame)
        scene.frame_set(FRAME)
        aim_camera(scene, Vector((-0.6, -1.0, -0.02)), Vector((0.6, 1.0, 2.55)), "right", ortho=True, margin=1.0)
        panels.append(render_panel(scene))
        clear_figures([template.armature, *template.meshes.values()])
    return panels


COMPARE = {"fists": compare_fists, "skirt": compare_skirt, "pila": compare_pila, "spear": compare_spear}


def before_after(model, before, what, out):
    rows = []
    for path in (before, whp_build.glb_path(model)):
        reset_scene()
        template = import_model(path)
        rows.append(COMPARE[what](template))
    path = os.path.join(RENDER_DIR, model, out)
    save_panels(bpy.context.scene, rows, path)
    log("before and after:", path)


def main():
    parser = argparse.ArgumentParser(prog="render_review.py")
    parser.add_argument("--model", default="roman-legionary", choices=whp_build.unit_ids())
    parser.add_argument("--only", nargs="*", choices=sorted(IMAGES), default=None)
    parser.add_argument("--attack-styles", action="store_true")
    parser.add_argument("--lineup", action="store_true", help="the infantry models in a row")
    parser.add_argument("--cavalry", action="store_true", help="with --lineup: the cavalry models")
    parser.add_argument("--jog", metavar="NN-NAME.jpg", help="a foot model's run and jog, into art/renders/<model>/")
    parser.add_argument("--duel", metavar="OTHER", choices=whp_build.unit_ids(),
                        help="the model and another one face to face around a blow, into art/renders/")
    parser.add_argument("--before", help="an older .glb of the model, to compare with (see --compare)")
    parser.add_argument("--compare", choices=sorted(COMPARE), help="what to show before and after")
    parser.add_argument("--out", help="file name of the comparison in art/renders/<model>/")
    args = parser.parse_args(script_args())
    if args.before:
        before_after(args.model, args.before, args.compare, args.out)
    elif args.lineup:
        lineup(args.cavalry)
    elif args.jog:
        jog_image(args.model, args.jog)
    elif args.duel:
        duel_image(args.model, args.duel)
    elif args.attack_styles:
        attack_styles(args.model)
    else:
        render_model(args.model, args.only)
    log("done")


if __name__ == "__main__":
    main()
