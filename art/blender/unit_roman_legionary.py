"""roman-legionary: a Republican legionary of the propertied class, in mail.

Source body "Roman Soldier - T pose" by Andywoodhead (CC BY 4.0) without its
Imperial kit; generated Montefortino helmet, mail shirt with shoulder
doubling, belt and oval scutum; sword in the right fist. Used for the
principes and the allied infantry (and the hastati until roman-hastatus).

The build itself is whp_build; this module holds what is particular to
this model.
"""

import bpy

import roman_beard
import roman_fit
import roman_kit
import roman_looks
import roman_mail
import roman_source
import whp_clips
from whp_unit_lod import Part

MODEL = "roman-legionary"


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
    return made


def build_kit():
    roman_kit.prepare_body()
    _kit(2)
    roman_kit.hide_low(_kit(0, ".low"))


# -- stage "rig" -----------------------------------------------------------

fit = roman_fit.build
RIGID = dict(roman_kit.RIGID, Mail_hook="spine_03")
SHARED = roman_kit.SHARED
# Rounds of weight smoothing; cloth and mail get more than skin.
SMOOTHING = {"Tunic_1": 12, "Mail": 12, "Mail_yoke": 12, "Belt": 8}
DEFAULT_SMOOTHING = 3
MERGE_FINGERS = True                # the fists are closed for good
rig_extras = roman_kit.rig_extras


# -- stage "anim" ----------------------------------------------------------

KIT = whp_clips.Kit(shield=True, attack="sword-thrust")


# -- stage "lod" -----------------------------------------------------------

PARTS = [
    # The head mesh has open eye sockets: the eyeballs must come along.
    Part("head", ["New_head", "New_eye", "New_eye_2"], ["New_head", "New_eye", "New_eye_2"], (1150, 190, 36),
         # Only the scalp under the bowl goes: holes under the thin cheek
         # pieces or the collar show at grazing angles.
         covers=["Helmet"], reach=0.035,
         uv=1.8, extrusion=0.015, ray=0.035),
    Part("arms", ["New_arms"], ["New_arms"], (1100, 190, 44),
         covers=["Tunic_1", "Mail", "Mail_yoke"], reach=0.03),
    Part("legs", ["New_legs"], ["New_legs", "Boots"], (1300, 230, 50), extrusion=0.02, ray=0.04,
         sole=["Boots"]),
    Part("tunic", ["Tunic_1"], ["Tunic_1"], (700, 120, 24),
         covers=["Mail", "Mail_yoke", "Belt"], reach=0.03, uv=0.85),
    Part("mail", ["Mail"], ["Mail"], (1100, 205, 40), covers=["Mail_yoke", "Belt"], reach=0.02),
    Part("yoke", ["Mail_yoke"], ["Mail_yoke"], (420, 80, 0)),
    Part("belt", ["Belt"], ["Belt"], (140, 40, 0)),
    # Many loose pieces: does not decimate below ~170, so it is left out of LOD1.
    Part("scabbard", ["Scabbard"], ["Scabbard"], (220, 0, 0)),
    Part("sword", ["Sword2_1"], ["Sword2_1"], (140, 40, 10), ao_alone=True),
    Part("helmet", ["Helmet.low"], ["Helmet"], (None, 110, 24), uv=1.3, extrusion=0.008, ray=0.02),
    Part("cheeks", ["Helmet_cheeks.low"], ["Helmet_cheeks"], (None, 40, 0), uv=1.2, extrusion=0.005, ray=0.012),
    Part("crest", ["Helmet_crest.low"], ["Helmet_crest"], (None, 48, 6), uv=0.7, extrusion=0.005, ray=0.012),
    # Slot 2 of the shield is the wooden back: half the density of the face.
    Part("shield", ["Scutum.low"], ["Scutum"], (None, 100, 40), uv=lambda slot: 0.45 if slot == 2 else 1.0,
         extrusion=0.02, ray=0.045, ao_alone=True),
    Part("hook", ["Mail_hook.low"], ["Mail_hook"], (None, 0, 0), extrusion=0.008, ray=0.02),
    # Variant shapes (T-061): the beards.
    *roman_beard.PARTS,
]

LOD2 = dict(
    own=("shield", "sword", "crest", "helmet"),
    body=("head", "arms", "legs", "tunic", "mail", "yoke", "belt"),
    trunk="mail",
    skirt="tunic",
    head="head",
)


# -- each man his own look (T-061) --------------------------------------------

LOOKS = roman_looks.looks()


def before_lod():
    """The beards (roman_beard), short of the cheek pieces and the collar."""
    roman_beard.build(avoid=["Helmet_cheeks", "Mail_yoke", "Tunic_1"])


# -- review images (render_review.py) -----------------------------------------

REVIEW = ["views", "three-quarter", "head", "formation", "lods", "animations", "metal", "compare", "test-poses"]
