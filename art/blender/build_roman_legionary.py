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

import roman_hands  # noqa: E402
import roman_helmet  # noqa: E402
import roman_mail  # noqa: E402
import roman_shield  # noqa: E402
import roman_source  # noqa: E402
import whp_materials  # noqa: E402
from roman_fit import FINAL_SCALE  # noqa: E402
from whp_common import BUILD_DIR, log, mesh_objects, open_blend, reset_scene, save_blend, script_args  # noqa: E402
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


STAGES = [
    ("source", stage_source),
    ("strip", stage_strip),
    ("kit", stage_kit),
]


def stage_file(index):
    return os.path.join(WORK_DIR, f"{index + 1}-{STAGES[index][0]}.blend")


def preview(name):
    scene = bpy.context.scene
    objs = [o for o in mesh_objects(scene) if not o.hide_render and not o.name.startswith("whp-")]
    render_views(scene, objs, os.path.join(WORK_DIR, f"preview-{name}-{{view}}.png"))


def main():
    names = [name for name, _ in STAGES]
    parser = argparse.ArgumentParser(prog="build_roman_legionary.py")
    parser.add_argument("--from", dest="first", choices=names, default=names[0])
    parser.add_argument("--to", dest="last", choices=names, default=names[-1])
    parser.add_argument("--preview", action="store_true")
    args = parser.parse_args(script_args())

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
    log("done")


if __name__ == "__main__":
    main()
