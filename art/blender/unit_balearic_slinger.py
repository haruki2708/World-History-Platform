"""balearic-slinger: a slinger from the Balearic islands.

Diodorus 5.17-18: the islanders went almost naked in summer; their arms
were three slings, one round the head, one round the belly, one in the
hands, and they slung bigger stones than anyone. Strabo 3.5.1: slings of
black rush, hair or sinew; the Phoenicians first clothed them in tunics
with a broad border. So: an undyed tunic with a broad dark border, no
belt (the belly sling is wound in its place), a sling round the head, a
sling in the right fist, a bag of stones at the left hip; no armour, no
shield, no sword. Olive skin, dark hair and beard.

The sling in the hand bends: its pouch follows the bone ik_hand_gun
(balearic_kit, whp_clips.SlingCord). Attack: sling.

Built on the Roman source body; the build itself is whp_build.
"""

import bpy

import balearic_kit
import roman_beard
import roman_faces
import roman_fit
import roman_kit
import roman_source
import whp_clips
import whp_look
import whp_materials
import whp_skin
from roman_fit import FINAL_SCALE
from whp_unit_lod import Part

MODEL = "balearic-slinger"

WOOL = (0.46, 0.42, 0.34)                   # undyed wool
BORDER = (0.12, 0.022, 0.045)               # a broad dark purple border
BORDER_WIDTH = 0.10 / FINAL_SCALE
EXTRA_MATERIALS = [
    ("cord", lambda: whp_materials.plain("cord", (0.030, 0.025, 0.018), (0.010, 0.008, 0.006),
                                         roughness=0.9, scale=300.0, bump=0.5)),
    ("stone", lambda: whp_materials.plain("stone", (0.30, 0.29, 0.26), (0.16, 0.15, 0.14),
                                          roughness=0.8, scale=60.0, bump=0.3)),
    ("hair", whp_materials.hair),                    # T-047: curls, matte
]


# -- stages "source" and "kit" ---------------------------------------------

def build_source():
    roman_source.import_roman()
    roman_source.strip_imperial_kit()
    objs = bpy.data.objects
    roman_source.border_attribute(objs["Tunic_1"], BORDER_WIDTH, sleeves=False)
    roman_source.recolour(objs["Tunic_1"], WOOL, border="whp_border", border_color=BORDER, contrast=0.5)
    for name in ("New_head", "New_arms", "New_legs"):
        roman_source.tint(objs[name], roman_faces.SKIN["balearic"])


def _kit(detail, suffix=""):
    mats = roman_kit.materials(detail, EXTRA_MATERIALS)
    objs = bpy.data.objects
    made = [balearic_kit.build_head_sling(detail, mats, "Head_sling" + suffix),
            balearic_kit.build_sling(detail, mats, "Sling" + suffix),
            balearic_kit.build_bag(detail, mats, "Stone_bag" + suffix)]
    if detail == 2:
        head = objs["New_head"]
        made += [balearic_kit.build_belly_sling(objs["Tunic_1"], mats),
                 roman_faces.build_hair(head, mats, "Hair"),
                 roman_faces.build_shell(head, "beard", 0.004, mats, "Beard")]
    return made


def build_kit():
    roman_kit.prepare_body(sword="none")
    _kit(2)
    roman_kit.hide_low(_kit(0, ".low"))


# -- stage "rig" -----------------------------------------------------------

fit = roman_fit.build
RIGID = {k: v for k, v in roman_kit.RIGID.items() if k.startswith("New_eye")}
RIGID.update(Head_sling="head", Sling="hand_r")
SHARED = {"Stone_bag": ("pelvis", "thigh_l")}
SMOOTHING = {"Tunic_1": 12, "Belly_sling": 8, "Hair": 6, "Beard": 6}
DEFAULT_SMOOTHING = 3
MERGE_FINGERS = True


def rig_extras(armature, matrices, index):
    """The weapon axis of the sling (whp_clips.Kit); then the sling's cords
    are re-weighted from the hand to the pouch bone."""
    roman_kit.rig_extras(armature, matrices, index, weapon="Sling", shield=False)
    names = [name for name, _ in sorted(index.items(), key=lambda kv: kv[1])]
    for obj in bpy.data.objects:
        if obj.type == "MESH" and obj.name.split(".")[0] == "Sling":
            whp_skin.write_groups(obj, balearic_kit.sling_weights(obj, names), names)


# -- stage "anim" ----------------------------------------------------------

KIT = whp_clips.Kit(shield=False, attack="sling", carry=whp_clips.SLING_CARRY, sling="Sling")


# -- stage "lod" -----------------------------------------------------------

PARTS = [
    Part("head", ["New_head", "New_eye", "New_eye_2"], ["New_head", "New_eye", "New_eye_2"], (1200, 200, 36),
         reach=0.035, uv=1.8, extrusion=0.015, ray=0.035),
    Part("hair", ["Hair"], ["Hair"], (300, 60, 0), uv=1.0, extrusion=0.008, ray=0.015),
    # Variant shapes (T-061): the short beard of the kit and a full one (roman_beard).
    Part("beard", ["Beard"], ["Beard"], (240, 28, 0), uv=1.0, extrusion=0.006, ray=0.012, ao_alone=True),
    *roman_beard.parts("beard_full"),
    Part("arms", ["New_arms"], ["New_arms"], (1150, 200, 44), covers=["Tunic_1"], reach=0.03),
    Part("legs", ["New_legs"], ["New_legs", "Boots"], (1400, 240, 50), extrusion=0.02, ray=0.04, sole=["Boots"]),
    Part("tunic", ["Tunic_1"], ["Tunic_1"], (1300, 230, 24), covers=["Belly_sling"], reach=0.03, uv=1.0),
    Part("belly", ["Belly_sling"], ["Belly_sling"], (140, 40, 0)),
    Part("head_sling", ["Head_sling.low"], ["Head_sling"], (None, 60, 0), uv=0.6, extrusion=0.004, ray=0.01),
    Part("sling", ["Sling.low"], ["Sling"], (None, 60, 8), uv=0.8, extrusion=0.004, ray=0.01, ao_alone=True),
    Part("bag", ["Stone_bag.low"], ["Stone_bag"], (None, 36, 8), uv=0.8, extrusion=0.008, ray=0.02),
]

LOD2 = dict(
    own=("sling", "bag"),
    body=("head", "arms", "legs", "tunic", "belly"),
    trunk="belly",
    skirt="tunic",
    head="head",
)


# -- each man his own look (T-061) --------------------------------------------
#
# Hannibal's men: strong variety (the user's choice, 2026-11-21). Strabo
# 3.5.1 gives the tunic a broad border, not its colour: the undyed wool
# varies from cream to brown and grey, the border through dark purples, red
# and brown. Dark hair; most men bearded.

srgb, ONE = whp_look.srgb, whp_look.ONE
LOOKS = whp_look.Looks(
    slots=[
        whp_look.Slot("tunic", "dye", [(3, srgb(181, 173, 158)), (2, srgb(160, 150, 130)), (2, srgb(200, 194, 178)),
                                       (1, srgb(140, 126, 108)), (1, srgb(120, 116, 110)), (1, srgb(176, 150, 110))]),
        whp_look.Slot("border", "dye", [(3, srgb(97, 41, 60)), (2, srgb(70, 30, 52)), (2, srgb(110, 38, 36)),
                                        (1, srgb(48, 40, 36)), (1, srgb(60, 50, 80))]),
        whp_look.Slot("skin", "tint", [(3, ONE), (2, (0.90, 0.85, 0.80)), (2, (1.08, 1.04, 1.00)),
                                       (2, (0.84, 0.77, 0.70)), (1, (1.02, 0.94, 0.88))]),
        whp_look.Slot("hair", "dye", [(4, srgb(36, 28, 22)), (3, srgb(26, 22, 20)), (2, srgb(56, 42, 32)),
                                      (1, srgb(80, 60, 42))]),
    ],
    parts={"head": ("skin", None), "arms": ("skin", None), "legs": ("skin", None), "tunic": ("tunic", "border"),
           "hair": ("hair", None), "beard": ("hair", None), "beard_full": ("hair", None)},
    materials={"New_head0": "skin", "New_arms0": "skin", "New_legs0": "skin", "Tunic_10": whp_look.woven_border(),
               "whp-hair": "hair"},
    variants=[whp_look.Variants("beard", [(3, None), (5, "beard"), (2, "beard_full")])],
)


def before_lod():
    """The full beard (roman_beard), in the hair of the kit's beard, short
    of the tunic's collar."""
    roman_beard.build(avoid=["Tunic_1"], material=bpy.data.materials["whp-hair"], names=("beard_full",))


# -- review images (render_review.py) -----------------------------------------

REVIEW = ["views", "three-quarter", "head", "formation", "lods", "animations", "beside", "test-poses"]
BESIDE = "roman-legionary"
