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
import roman_faces
import roman_fit
import roman_kit
import roman_source
import whp_clips
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
    Part("beard", ["Beard"], ["Beard"], (240, 40, 0), uv=1.0, extrusion=0.006, ray=0.012),
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


# -- review images (render_review.py) -----------------------------------------

REVIEW = ["views", "three-quarter", "head", "formation", "lods", "animations", "beside", "test-poses"]
BESIDE = "roman-legionary"
