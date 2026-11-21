"""roman-triarii: a veteran of the third line.

Polybius 6.23.16: the triarii are armed like the principes, except that
they carry thrusting spears (hastae) instead of pila. So this is
roman-legionary (mail, Montefortino helmet, oval scutum) with a spear in
the right fist, carried upright when not in use, and the sword in its
scabbard on the right hip.

The build itself is whp_build; this module holds what is particular to
this model.
"""

import functools

import bpy

import roman_beard
import roman_fit
import roman_kit
import roman_looks
import roman_mail
import roman_source
import roman_weapons
import whp_clips
from whp_unit_lod import Part

MODEL = "roman-triarii"


# -- stages "source" and "kit" ---------------------------------------------

def build_source():
    roman_source.import_roman()
    roman_source.strip_imperial_kit()


def _kit(detail, suffix=""):
    mats = roman_kit.materials(detail)
    made = roman_kit.helmet_and_shield(detail, mats, suffix)
    objs = bpy.data.objects
    if detail == 2:
        tunic = objs["Tunic_1"]
        yoke = roman_mail.build_yoke(tunic, mats)
        made += [roman_mail.build_shirt(tunic, mats), yoke, roman_mail.build_belt(tunic, mats)]
    made.append(roman_mail.build_chest_hook(objs["Mail_yoke"], mats, detail, "Mail_hook" + suffix))
    made.append(roman_weapons.build_right_hand(roman_weapons.HASTA, detail, mats, "Spear" + suffix))
    return made


def build_kit():
    roman_kit.prepare_body(sword="sheathed")
    _kit(2)
    roman_kit.hide_low(_kit(0, ".low"))


# -- stage "rig" -----------------------------------------------------------

fit = roman_fit.build
RIGID = {k: v for k, v in roman_kit.RIGID.items() if k != roman_kit.WEAPON}
RIGID.update(Mail_hook="spine_03", Spear="hand_r")
# The sheathed sword goes with its scabbard.
SHARED = dict(roman_kit.SHARED, **{roman_kit.WEAPON: roman_kit.SHARED["Scabbard"]})
SMOOTHING = {"Tunic_1": 12, "Mail": 12, "Mail_yoke": 12, "Belt": 8}
DEFAULT_SMOOTHING = 3
MERGE_FINGERS = True
rig_extras = functools.partial(roman_kit.rig_extras, weapon="Spear")


# -- stage "anim" ----------------------------------------------------------

KIT = whp_clips.Kit(shield=True, attack="spear-thrust", carry=whp_clips.SPEAR_CARRY, lie_flat=True)


# -- stage "lod" -----------------------------------------------------------

PARTS = [
    Part("head", ["New_head", "New_eye", "New_eye_2"], ["New_head", "New_eye", "New_eye_2"], (1150, 190, 36),
         covers=["Helmet"], reach=0.035, uv=1.8, extrusion=0.015, ray=0.035),
    Part("arms", ["New_arms"], ["New_arms"], (1100, 190, 44),
         covers=["Tunic_1", "Mail", "Mail_yoke"], reach=0.03),
    Part("legs", ["New_legs"], ["New_legs", "Boots"], (1300, 230, 50), extrusion=0.02, ray=0.04,
         sole=["Boots"]),
    Part("tunic", ["Tunic_1"], ["Tunic_1"], (700, 120, 24),
         covers=["Mail", "Mail_yoke", "Belt"], reach=0.03, uv=0.85),
    Part("mail", ["Mail"], ["Mail"], (1100, 205, 40), covers=["Mail_yoke", "Belt"], reach=0.02),
    Part("yoke", ["Mail_yoke"], ["Mail_yoke"], (420, 80, 0)),
    Part("belt", ["Belt"], ["Belt"], (140, 40, 0)),
    Part("scabbard", ["Scabbard"], ["Scabbard"], (220, 0, 0)),
    # In its scabbard: only the hilt shows.
    Part("sword", ["Sword2_1"], ["Sword2_1"], (90, 0, 0), covers=["Scabbard"], reach=0.02),
    Part("helmet", ["Helmet.low"], ["Helmet"], (None, 110, 24), uv=1.3, extrusion=0.008, ray=0.02),
    Part("cheeks", ["Helmet_cheeks.low"], ["Helmet_cheeks"], (None, 40, 0), uv=1.2, extrusion=0.005, ray=0.012),
    Part("crest", ["Helmet_crest.low"], ["Helmet_crest"], (None, 48, 6), uv=0.7, extrusion=0.005, ray=0.012),
    Part("shield", ["Scutum.low"], ["Scutum"], (None, 100, 36), uv=lambda slot: 0.45 if slot == 2 else 1.0,
         extrusion=0.02, ray=0.045, ao_alone=True),
    Part("hook", ["Mail_hook.low"], ["Mail_hook"], (None, 0, 0), extrusion=0.008, ray=0.02),
    Part("spear", ["Spear.low"], ["Spear"], (None, 40, 8), uv=0.6, extrusion=0.006, ray=0.015, ao_alone=True),
    # Variant shapes (T-061): the beards.
    *roman_beard.PARTS,
]

LOD2 = dict(
    own=("shield", "crest", "helmet", "spear"),
    body=("head", "arms", "legs", "tunic", "mail", "yoke", "belt"),
    trunk="mail",
    skirt="tunic",
    head="head",
)


# -- each man his own look (T-061) --------------------------------------------

# The triarii are the oldest men (Polybius 6.21.9): more beards, some grey.
LOOKS = roman_looks.looks(beards=[(3, None), (3, "beard_short"), (4, "beard_full")],
                          hair=roman_looks.HAIR_OLDER)


def before_lod():
    """The beards (roman_beard), short of the cheek pieces and the collar."""
    roman_beard.build(avoid=["Helmet_cheeks", "Mail_yoke", "Tunic_1"])


# The spear held upright stands higher than the man: its point at about 2.4 m.
GROUND_CHECKS = (
    ("idle", 0, (-0.03, 0.02), (1.5, 2.5)),
    ("walk", 0, (-0.03, 0.03), (1.5, 2.5)),
    ("die", "last", (-0.05, 0.05), (0.0, 0.75)),
)


# -- review images (render_review.py) -----------------------------------------

REVIEW = ["views", "three-quarter", "head", "formation", "lods", "animations", "beside", "test-poses"]
BESIDE = "roman-legionary"
