"""iberian-gallic-cavalry: Hasdrubal's Iberian and Celtic horse at Cannae,
on lane 2's horse; one model for both.

What the sources give both peoples at Cannae: Polybius 3.114.2-4 and Livy
22.46.5-6 say the Iberians' and the Celts' shields were alike (the long
flat oval), their swords different; the Iberians stood in short white
linen tunics bordered with purple, the Gauls naked above the waist (both
passages are about the foot). Polybius 3.115.2-3 and Livy 22.47.1-3 tell
of the horsemen's fight: head on, with no room to wheel, many dismounting
to fight on foot. Most of these horsemen were Iberians (Polybius 3.113.7
puts the Iberian and Celtic horse together, the Iberians named first; the
Gallic horsemen were nobles whose dress is not described at Cannae).

So the shared kit: the Iberians' bordered linen tunic, which a Gallic
noble's tunic would not contradict; the oval shield both used, smaller for
a man on a horse, slung on the left forearm (the left hand holds the
reins); a spear of 2.3 m in the right fist; the sword sheathed on the right
hip; the sinew cap of iron-age Iberia (Strabo 3.3.6), as the Iberian foot
wear. Olive skin. The saddle cloth is dark blue-black wool with an ochre
border, to tell it from the Romans' red (Diodorus 5.33 gives the
Celtiberians cloaks of rough black wool; the colour is otherwise a choice).

Built on the Roman source body; whp_cavalry puts him on the horse.
"""

import contextlib
import functools

import bpy

import iberian_looks
import roman_beard
import roman_faces
import roman_fit
import roman_hands
import roman_helmet
import roman_kit
import roman_mail
import roman_shield
import roman_source
import roman_weapons
import cavalry_looks
import whp_cavalry
import whp_clips
import whp_look
import whp_materials
from roman_fit import FINAL_SCALE
from whp_unit_lod import Part

MODEL = "iberian-gallic-cavalry"
LINEN = (0.78, 0.76, 0.70)                  # bleached linen (as iberian-infantry)
PURPLE = (0.20, 0.025, 0.075)               # the purple border
BORDER_WIDTH = 0.05 / FINAL_SCALE
SHIELD = ((0.20, 0.12, 0.06), (0.09, 0.055, 0.03))   # oxhide over the board
# The Gauls' and Iberians' oval shield (roman_shield.OVAL_SHIELD, 1.10 x
# 0.58 m on foot), smaller for a horseman.
CAVALRY_OVAL = dict(roman_shield.OVAL_SHIELD, LENGTH=0.92, WIDTH=0.50, BOSS_HALF_LENGTH=0.11, PLATE_HALF=(0.13, 0.045))
SPEAR = dict(roman_weapons.HASTA, length=2.30, grip=0.85)
EXTRA_MATERIALS = [
    ("shield", lambda: whp_materials.shield_paint(*SHIELD)),
    ("sinew", lambda: whp_materials.plain("sinew", (0.26, 0.18, 0.10), (0.11, 0.075, 0.04),
                                          roughness=0.7, scale=120.0, bump=0.4)),
]


# -- stages "source" and "kit" ---------------------------------------------

def build_source():
    roman_source.import_roman()
    roman_source.strip_imperial_kit()
    objs = bpy.data.objects
    roman_source.border_attribute(objs["Tunic_1"], BORDER_WIDTH)
    roman_source.recolour(objs["Tunic_1"], LINEN, border="whp_border", border_color=PURPLE, contrast=0.45)
    for name in ("New_head", "New_arms", "New_legs"):
        roman_source.tint(objs[name], roman_faces.SKIN["iberian"])


def _kit(detail, suffix=""):
    mats = roman_kit.materials(detail, EXTRA_MATERIALS)
    made = [roman_helmet.build_cap(detail, mats, "Cap" + suffix)]
    with roman_shield.variant(**CAVALRY_OVAL):
        shield = roman_shield.build(detail, mats, "Shield" + suffix)
        roman_shield.place(shield, roman_hands.grip_axis_point(1), 1.0 / FINAL_SCALE)
    made.append(shield)
    if detail == 2:
        made.append(roman_mail.build_belt(bpy.data.objects["Tunic_1"], mats))
    made.append(roman_weapons.build_right_hand(SPEAR, detail, mats, "Spear" + suffix))
    return made


def build_kit():
    roman_kit.prepare_body(sword="sheathed")
    _kit(2)
    roman_kit.hide_low(_kit(0, ".low"))


# -- stage "rig" -----------------------------------------------------------

fit = roman_fit.build
RIGID = {k: v for k, v in roman_kit.RIGID.items() if k.startswith("New_eye")}
RIGID.update(Cap="head", Shield=("hand_l", whp_clips.SPARE_BONE), Spear="hand_r")
SHARED = dict(roman_kit.SHARED, **{roman_kit.WEAPON: roman_kit.SHARED["Scabbard"]})
SMOOTHING = {"Tunic_1": 12, "Belt": 8}
DEFAULT_SMOOTHING = 3
MERGE_FINGERS = True


@contextlib.contextmanager
def _oval():
    with roman_shield.variant(**CAVALRY_OVAL):
        yield


def rig_extras(armature, matrices, index):
    """The spear's axis; the shield's axes as the smaller oval has them."""
    with _oval():
        roman_kit.rig_extras(armature, matrices, index, weapon="Spear")


# -- stage "anim" (whp_cavalry) ------------------------------------------------

KIT = whp_clips.Kit(shield=False, attack="spear-thrust", lie_flat=True)
RIDER = whp_cavalry.Rider(attack="spear-thrust", reins=True, shield="forearm")
HORSE = whp_cavalry.Horse(tack=("cloth", "bridle"), cloth=((0.022, 0.026, 0.040), (0.17, 0.11, 0.035)))
BONES = whp_cavalry.BONES
GROUND_CHECKS = whp_cavalry.GROUND_CHECKS
SEAT_MESHES = ("New_legs",)
SHIELD_MESH = "Shield"
SHIELD_HANG = dict(along=0.35, offset=(0.17, 0.0, -0.06), out=(1.0, -0.2, -0.12), down=(0.0, -0.18, -1.0),
                   lying=0.03)


# -- stage "lod" -----------------------------------------------------------

PARTS = [
    Part("head", ["New_head", "New_eye", "New_eye_2"], ["New_head", "New_eye", "New_eye_2"], (900, 130, 0),
         covers=["Cap"], reach=0.035, uv=1.8, extrusion=0.015, ray=0.035),
    Part("arms", ["New_arms"], ["New_arms"], (750, 120, 0), covers=["Tunic_1"], reach=0.03),
    Part("legs", ["New_legs"], ["New_legs", "Boots"], (800, 130, 0), extrusion=0.02, ray=0.04, sole=["Boots"]),
    # T-050: the skirt's inside showed grey on the left, from the front: its inner faces are not drawn
    # (inner_skirt), and the bake's rays start further out, past the outer cloth where the cut-down
    # skirt lies inside it, so that they do not reach the inner cloth.
    Part("tunic", ["Tunic_1"], ["Tunic_1"], (650, 110, 0), covers=["Belt"], reach=0.03, uv=1.0,
         extrusion=0.03, ray=0.06, drop=whp_cavalry.inner_skirt),
    Part("belt", ["Belt"], ["Belt"], (80, 0, 0)),
    Part("scabbard", ["Scabbard"], ["Scabbard"], (120, 0, 0)),
    Part("sword", ["Sword2_1"], ["Sword2_1"], (60, 0, 0), covers=["Scabbard"], reach=0.02),
    Part("cap", ["Cap.low"], ["Cap"], (200, 60, 0), uv=1.1, extrusion=0.008, ray=0.02),
    Part("shield", ["Shield.low"], ["Shield"], (260, 70, 16), uv=lambda slot: 0.45 if slot == 2 else 1.0,
         extrusion=0.02, ray=0.045, ao_alone=True),
    Part("spear", ["Spear.low"], ["Spear"], (None, 20, 4), uv=0.6, extrusion=0.005, ray=0.012, ao_alone=True),
    # Variant shapes (T-061): the beards, on a horseman's budget.
    *roman_beard.parts(scale=0.6),
]

LOD2 = dict(
    own=("shield", "spear"),
    body=("head", "arms", "legs", "tunic", "belt"),
    trunk="belt",
    skirt=None,
    head="head",
    feet=False,
)


# -- each man his own look (T-061) --------------------------------------------
#
# The Iberian foot's (iberian_looks; the cap keeps its colour: no slot
# left), and the horse (cavalry_looks): its coat, and the saddle cloth's
# dark wool in shades (Diodorus 5.33: the Celtiberians' rough black wool).

srgb = whp_look.srgb
CLOTH = [(3, srgb(41, 45, 56)), (2, srgb(30, 30, 32)), (2, srgb(58, 46, 38)), (1, srgb(70, 36, 32)),
         (1, srgb(50, 56, 66))]
_horse_slots, _horse_parts, _horse_materials = cavalry_looks.horse(cloth=CLOTH)
LOOKS = whp_look.Looks(
    slots=[
        whp_look.Slot("tunic", "dye", iberian_looks.LINEN),
        whp_look.Slot("border", "dye", iberian_looks.PURPLE),
        whp_look.Slot("shield", "dye", iberian_looks.SHIELD),
        whp_look.Slot("skin", "tint", iberian_looks.SKIN),
        whp_look.Slot("hair", "dye", iberian_looks.HAIR),
        *_horse_slots,
    ],
    parts={"head": ("skin", None), "arms": ("skin", None), "legs": ("skin", None), "tunic": ("tunic", "border"),
           "shield": ("shield", None), "beard_short": ("hair", None), "beard_full": ("hair", None), **_horse_parts},
    materials={"New_head0": "skin", "New_arms0": "skin", "New_legs0": "skin", "Tunic_10": whp_look.woven_border(),
               "whp-shield-paint": "shield", "whp-beard": "hair", **_horse_materials},
    variants=[whp_look.Variants("beard", iberian_looks.BEARDS)],
    designs=iberian_looks.DESIGNS,
)


def before_lod():
    """The beards (roman_beard), short of the tunic's collar."""
    roman_beard.build(avoid=["Tunic_1"])


# -- review images (render_review.py) -----------------------------------------

REVIEW = ["views", "three-quarter", "lods", "animations", "beside"]
BESIDE = "roman-legionary"
