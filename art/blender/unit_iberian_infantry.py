"""iberian-infantry: Hannibal's Iberian foot, also used for his light spearmen.

Polybius 3.114.2-4 and Livy 22.46.5-6: the Iberians stood in short white
linen tunics bordered with purple, their national dress; their shields
were very like the Gauls' (the long flat oval, roman_shield.OVAL_SHIELD);
their swords were short and good for both cut and thrust (the source
model's sword is of that kind, hence the sword-thrust). The head is a cap
of sinew (Strabo 3.3.6). Two javelins stand behind the shield, so that the
same figure also serves for the light spearmen. Olive skin.

Built on the Roman source body; the build itself is whp_build.
"""

import bpy

import roman_faces
import roman_fit
import roman_hands
import roman_helmet
import roman_kit
import roman_mail
import roman_shield
import roman_source
import roman_weapons
import whp_clips
import whp_materials
from roman_fit import FINAL_SCALE
from whp_unit_lod import Part

MODEL = "iberian-infantry"

LINEN = (0.78, 0.76, 0.70)                  # bleached linen
PURPLE = (0.20, 0.025, 0.075)               # the purple border
BORDER_WIDTH = 0.05 / FINAL_SCALE           # 5 cm, in source units
SHIELD = ((0.20, 0.12, 0.06), (0.09, 0.055, 0.03))   # oxhide over the board
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
    with roman_shield.variant(**roman_shield.OVAL_SHIELD):
        shield = roman_shield.build(detail, mats, "Shield" + suffix)
        roman_shield.place(shield, roman_hands.grip_axis_point(1), 1.0 / FINAL_SCALE)
    made.append(shield)
    if detail == 2:
        made.append(roman_mail.build_belt(bpy.data.objects["Tunic_1"], mats))
    made.append(roman_weapons.build_spares(roman_weapons.IBERIAN_JAVELIN, detail, mats, "Javelins" + suffix, count=2))
    return made


def build_kit():
    roman_kit.prepare_body()
    _kit(2)
    roman_kit.hide_low(_kit(0, ".low"))


# -- stage "rig" -----------------------------------------------------------

fit = roman_fit.build
RIGID = {k: v for k, v in roman_kit.RIGID.items() if not k.startswith(("Helmet", "Scutum"))}
RIGID.update(Cap="head", Shield="hand_l", Javelins="hand_l")
SHARED = roman_kit.SHARED
SMOOTHING = {"Tunic_1": 12, "Belt": 8}
DEFAULT_SMOOTHING = 3
MERGE_FINGERS = True
rig_extras = roman_kit.rig_extras


# -- stage "anim" ----------------------------------------------------------

KIT = whp_clips.Kit(shield=True, attack="sword-thrust")


# -- stage "lod" -----------------------------------------------------------

PARTS = [
    Part("head", ["New_head", "New_eye", "New_eye_2"], ["New_head", "New_eye", "New_eye_2"], (1200, 200, 36),
         covers=["Cap"], reach=0.035, uv=1.8, extrusion=0.015, ray=0.035),
    Part("arms", ["New_arms"], ["New_arms"], (1150, 200, 44), covers=["Tunic_1"], reach=0.03),
    Part("legs", ["New_legs"], ["New_legs", "Boots"], (1400, 240, 50), extrusion=0.02, ray=0.04, sole=["Boots"]),
    Part("tunic", ["Tunic_1"], ["Tunic_1"], (1300, 230, 24), covers=["Belt"], reach=0.03, uv=1.0),
    Part("belt", ["Belt"], ["Belt"], (140, 40, 0)),
    Part("scabbard", ["Scabbard"], ["Scabbard"], (220, 0, 0)),
    Part("sword", ["Sword2_1"], ["Sword2_1"], (140, 40, 10), ao_alone=True),
    Part("cap", ["Cap.low"], ["Cap"], (None, 90, 18), uv=1.1, extrusion=0.008, ray=0.02),
    Part("shield", ["Shield.low"], ["Shield"], (None, 100, 36), uv=lambda slot: 0.45 if slot == 2 else 1.0,
         extrusion=0.02, ray=0.045, ao_alone=True),
    Part("javelins", ["Javelins.low"], ["Javelins"], (None, 50, 10), uv=0.6, extrusion=0.005, ray=0.012,
         ao_alone=True),
]

LOD2 = dict(
    own=("shield", "sword", "cap", "javelins"),
    body=("head", "arms", "legs", "tunic", "belt"),
    trunk="belt",
    skirt="tunic",
    head="head",
)


# -- review images (render_review.py) -----------------------------------------

REVIEW = ["views", "three-quarter", "head", "formation", "lods", "animations", "beside", "test-poses"]
BESIDE = "roman-legionary"
