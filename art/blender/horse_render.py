"""Review images of the horse, rendered from art/build/horse/horse.blend.

    blender --background --factory-startup --disable-autoexec \
        --python art/blender/horse_render.py

Writes art/renders/horse/*.jpg (each under 400 KB). The horse is not
exported on its own, so these show the game meshes (LOD0..2, the baked
material) in the .blend that T-022 starts from.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bpy  # noqa: E402
import numpy as np  # noqa: E402
from mathutils import Vector  # noqa: E402

import whp_render as R  # noqa: E402
from whp_anim import set_action  # noqa: E402
from whp_common import BUILD_DIR, MODELS_DIR, RENDER_DIR, ensure_dir, log, open_blend  # noqa: E402

BLEND = os.path.join(BUILD_DIR, "horse", "horse.blend")
OUT = os.path.join(RENDER_DIR, "horse")
TMP = os.path.join(BUILD_DIR, "horse", "render-tmp")
PANEL = (640, 520)
MAX_BYTES = 400 * 1024
RIG = "horse-rig"
TACK = {
    "cloth-bridle": ("horse_cloth", "horse_bridle"),
    "neckrope": ("horse_neckrope",),
    "bare": (),
}
HORSE_BOX = (Vector((-0.45, -1.62, 0.0)), Vector((0.45, 1.22, 1.85)))


def show(level=0, tack=TACK["cloth-bridle"], extra=()):
    """Show one LOD of the horse with the given tack, plus `extra` objects."""
    wanted = {f"horse_LOD{level}"} | {f"{t}_LOD{level}" for t in tack}
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH" or obj.name.startswith("whp-"):
            continue
        obj.hide_render = obj.name not in wanted and obj not in extra
    for obj in extra:
        obj.hide_render = False


def pose(clip, frame):
    arm = bpy.data.objects[RIG]
    set_action(arm, clip)
    bpy.context.scene.frame_set(frame)


def panel(name, lo, hi, view, elevation=0.0, ortho=True):
    scene = bpy.context.scene
    R.aim_camera(scene, lo, hi, view, ortho=ortho, margin=1.06, elevation=elevation)
    path = os.path.join(TMP, name + ".png")
    R.render_still(scene, path)
    return path


def combine(paths, out, quality=88):
    """Panels side by side into one JPEG; lower the quality until it fits."""
    images = [bpy.data.images.load(p) for p in paths]
    rows = []
    for im in images:
        w, h = im.size
        a = np.empty(w * h * 4, dtype=np.float32)
        im.pixels.foreach_get(a)
        rows.append(a.reshape(h, w, 4))
    strip = np.concatenate(rows, axis=1)
    h, w = strip.shape[:2]
    result = bpy.data.images.new("combined", w, h, alpha=False)
    result.pixels.foreach_set(strip.ravel())
    ensure_dir(os.path.dirname(out))
    # A byte image holds the panels' stored (sRGB) values as they are.
    result.filepath_raw = out
    result.file_format = "JPEG"
    for q in (quality, 80, 72, 64):
        result.save(quality=q)
        if os.path.getsize(out) <= MAX_BYTES:
            break
    log(f"wrote {out}: {os.path.getsize(out) // 1024} KB (quality {q})")
    for im in images + [result]:
        bpy.data.images.remove(im)


def main():
    open_blend(BLEND)
    scene = bpy.context.scene
    ensure_dir(TMP)
    R.setup_render(scene, *PANEL, samples=32)
    # The colour images hold sRGB values already; render without a view
    # transform, as lane 1's review images do.
    R.setup_world(scene)
    R.setup_lights(scene)
    R.add_ground(scene)
    lo, hi = HORSE_BOX

    pose("idle", 0)
    show(0)
    combine([panel("side", lo, hi, "left"), panel("front", lo, hi, "front"), panel("back", lo, hi, "back")],
            os.path.join(OUT, "01-side-front-back.jpg"))

    paths = []
    for key, tack in TACK.items():
        show(0, tack)
        paths.append(panel(f"tack-{key}", lo, hi, "front34", elevation=12))
    combine(paths, os.path.join(OUT, "02-tack.jpg"))

    paths = []
    for level in range(3):
        show(level)
        paths.append(panel(f"lod{level}", lo, hi, "front34", elevation=8))
    combine(paths, os.path.join(OUT, "03-lods.jpg"))

    show(0)
    wide = (Vector((-1.3, -1.9, 0.0)), Vector((1.3, 1.5, 1.95)))
    clips = (("idle", (0, 40, 100), "left"), ("walk", (0, 12, 25), "left"), ("run", (0, 4, 8), "left"),
             ("die", (12, 30, 59), "front34"))
    for i, (clip, frames, view) in enumerate(clips):
        paths = []
        for f in frames:
            pose(clip, f)
            paths.append(panel(f"{clip}-{f}", *wide, view, elevation=8 if view != "left" else 0))
        combine(paths, os.path.join(OUT, f"{4 + i:02d}-anim-{clip}.jpg"))

    # Beside the standing legionary, to compare sizes.
    pose("idle", 0)
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(MODELS_DIR, "roman-legionary.glb"))
    added = [o for o in bpy.data.objects if o not in before]
    soldier_rig = next(o for o in added if o.type == "ARMATURE")
    soldier_rig.location = (0.0, -2.1, 0.0)
    if "idle" in bpy.data.actions:
        set_action(soldier_rig, "idle")
    scene.frame_set(0)
    soldier = [o for o in added if o.type == "MESH" and o.name == "LOD0"]
    for o in added:
        if o.type == "MESH" and o not in soldier:
            o.hide_render = True
    show(0, extra=soldier)
    both = (Vector((-0.5, -2.75, 0.0)), Vector((0.5, 1.25, 1.95)))
    combine([panel("beside-side", *both, "left"), panel("beside-34", *both, "front34", elevation=6)],
            os.path.join(OUT, "08-beside-roman-legionary.jpg"))
    for o in added:
        bpy.data.objects.remove(o, do_unlink=True)

    # The extra gaits kept in the file.
    show(0)
    paths = []
    for clip, f in (("trot", 0), ("trot", 12), ("canter", 0), ("canter", 10)):
        pose(clip, f)
        paths.append(panel(f"{clip}-{f}", *wide, "left"))
    combine(paths, os.path.join(OUT, "09-extra-trot-canter.jpg"))


if __name__ == "__main__":
    main()
