"""roman-velites: the light-armed skirmishers, youngest and poorest.

Polybius 6.21-22: no body armour; a round shield (parma) three feet
across; a plain helmet, sometimes covered with a wolf's skin; a sword; and
light javelins, the shaft about two cubits long and a finger thick, the
iron head a span long and so thin that it bends on striking. One javelin
is in the right fist, three more stand in the left behind the parma; the
sword is in its scabbard on the right hip. Same source body and tunic as
the hastatus. Also used for the allied light infantry.

The build itself is whp_build; this module holds what is particular to
this model.
"""

import functools

import bpy

import roman_fit
import roman_helmet
import roman_kit
import roman_mail
import roman_parma
import roman_shield
import roman_source
import roman_weapons
import roman_hands
import whp_clips
import whp_materials
from roman_fit import FINAL_SCALE
from whp_unit_lod import Part

MODEL = "roman-velites"
EXTRA_MATERIALS = [("fur", whp_materials.fur)]


# -- stages "source" and "kit" ---------------------------------------------

def build_source():
    roman_source.import_roman()
    roman_source.strip_imperial_kit()


def _kit(detail, suffix=""):
    mats = roman_kit.materials(detail, EXTRA_MATERIALS)
    made = roman_kit.helmet(detail, mats, suffix, crest=False)
    made.append(roman_helmet.build_pelt(detail, mats, "Pelt" + suffix))
    parma = roman_parma.build(detail, mats, "Parma" + suffix)
    roman_shield.place(parma, roman_hands.grip_axis_point(1), 1.0 / FINAL_SCALE)
    made.append(parma)
    if detail == 2:
        made.append(roman_mail.build_belt(bpy.data.objects["Tunic_1"], mats))
    made.append(roman_weapons.build_right_hand(roman_weapons.JAVELIN, detail, mats, "Javelin" + suffix))
    made.append(roman_weapons.build_spares(roman_weapons.JAVELIN, detail, mats, "Javelins" + suffix))
    return made


def build_kit():
    roman_kit.prepare_body(sword="sheathed")
    _kit(2)
    roman_kit.hide_low(_kit(0, ".low"))


# -- stage "rig" -----------------------------------------------------------

fit = roman_fit.build
RIGID = {k: v for k, v in roman_kit.RIGID.items() if k not in (roman_kit.WEAPON, "Scutum", "Helmet_crest")}
RIGID.update(Pelt="head", Parma="hand_l", Javelin="hand_r", Javelins="hand_l")
SHARED = dict(roman_kit.SHARED, **{roman_kit.WEAPON: roman_kit.SHARED["Scabbard"]})
SMOOTHING = {"Tunic_1": 12, "Belt": 8}
DEFAULT_SMOOTHING = 3
MERGE_FINGERS = True
rig_extras = functools.partial(roman_kit.rig_extras, weapon="Javelin")


# -- stage "anim" ----------------------------------------------------------

KIT = whp_clips.Kit(shield=True, attack="javelin-throw")


# -- stage "lod" -----------------------------------------------------------

PARTS = [
    Part("head", ["New_head", "New_eye", "New_eye_2"], ["New_head", "New_eye", "New_eye_2"], (1150, 190, 36),
         covers=["Helmet"], reach=0.035, uv=1.8, extrusion=0.015, ray=0.035),
    Part("arms", ["New_arms"], ["New_arms"], (1150, 200, 44), covers=["Tunic_1"], reach=0.03),
    Part("legs", ["New_legs"], ["New_legs", "Boots"], (1400, 240, 50), extrusion=0.02, ray=0.04, sole=["Boots"]),
    Part("tunic", ["Tunic_1"], ["Tunic_1"], (1300, 230, 24), covers=["Belt"], reach=0.03, uv=0.9),
    Part("belt", ["Belt"], ["Belt"], (140, 40, 0)),
    Part("scabbard", ["Scabbard"], ["Scabbard"], (220, 0, 0)),
    Part("sword", ["Sword2_1"], ["Sword2_1"], (90, 0, 0), covers=["Scabbard"], reach=0.02),
    Part("helmet", ["Helmet.low"], ["Helmet"], (None, 90, 0), covers=["Pelt"], reach=0.02, uv=1.1, extrusion=0.008,
         ray=0.02),
    Part("cheeks", ["Helmet_cheeks.low"], ["Helmet_cheeks"], (None, 40, 0), uv=1.2, extrusion=0.005, ray=0.012),
    Part("pelt", ["Pelt.low"], ["Pelt"], (None, 110, 16), uv=1.2, extrusion=0.01, ray=0.025),
    Part("shield", ["Parma.low"], ["Parma"], (None, 100, 34), uv=lambda slot: 0.45 if slot == 2 else 1.0,
         extrusion=0.02, ray=0.045, ao_alone=True),
    Part("javelin", ["Javelin.low"], ["Javelin"], (None, 30, 6), uv=0.6, extrusion=0.005, ray=0.012, ao_alone=True),
    Part("javelins", ["Javelins.low"], ["Javelins"], (None, 60, 12), uv=0.6, extrusion=0.005, ray=0.012,
         ao_alone=True),
]

LOD2 = dict(
    own=("shield", "pelt", "javelin", "javelins"),
    body=("head", "arms", "legs", "tunic", "belt"),
    trunk="belt",
    skirt="tunic",
    head="head",
)


# -- review images (render_review.py) -----------------------------------------

REVIEW = ["views", "three-quarter", "head", "formation", "lods", "animations", "beside", "test-poses"]
BESIDE = "roman-legionary"
