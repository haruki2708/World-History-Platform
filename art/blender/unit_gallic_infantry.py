"""gallic-infantry: Hannibal's Gauls at Cannae.

Polybius 3.114.3-4 and Livy 22.46.6: the Gauls fought naked above the
waist (in trousers, Polybius 2.28); their swords were long, for slashing
only, with no point; their shields like the Iberians'. Polybius 2.29: gold
torcs and arm rings.

Source: the Celt model itself ("Celt - rigged for UE4/5" by Andywoodhead,
CC BY 4.0), the model the shared rig comes from: bare torso, trousers,
belt, torc, moustache, fair hair (Diodorus 5.28). His body paint is taken
off and his trousers dyed in plant colours (celt_source); his open hands
are closed into fists (celt_hands); his round shield and short sword are
replaced, their grips in the hollow of the fists (celt_kit). Attack:
sword-slash.

The build itself is whp_build; this module holds what is particular to
this model.
"""

import bpy
import numpy as np

import celt_beard
import celt_kit
import celt_looks
import celt_source
import roman_kit
import whp_build
import whp_clips
import whp_look
import whp_materials
from whp_mesh import get_coords
from whp_unit_lod import Part

MODEL = "gallic-infantry"
SHIELD = ((0.055, 0.085, 0.15), (0.025, 0.040, 0.075))   # woad blue, as on the source's shield


# -- stages "source" and "kit" ---------------------------------------------

def build_source():
    celt_source.import_celt(fists=True)


def _kit(detail, suffix=""):
    extra = [("shield", lambda: whp_materials.shield_paint(*SHIELD))]
    mats = roman_kit.materials(detail, extra)
    return [celt_kit.build_shield(detail, mats, "Shield" + suffix),
            celt_kit.build_sword(detail, mats, "Sword_long" + suffix)]


def build_kit():
    _kit(2)
    roman_kit.hide_low(_kit(0, ".low"))
    celt_kit.drop_references()


# -- stage "rig" -----------------------------------------------------------

fit = celt_source.build
RIGID = {"Shield": "hand_l", "Sword_long": "hand_r"}
SHARED = {}
SMOOTHING = {"Celt_belt": 6}
DEFAULT_SMOOTHING = 1                   # his own weights: little smoothing needed
MERGE_FINGERS = True


def rig_extras(armature, matrices, index):
    """Shield axes kept by celt_kit; the sword's line from the right fist."""
    shield = bpy.data.objects["Shield"]
    armature["whp_shield_down"] = list(shield["whp_down"])
    armature["whp_shield_out"] = list(shield["whp_out"])
    sword = get_coords(bpy.data.objects["Sword_long"])
    hand_r = np.array(armature.data.bones["hand_r"].head_local)
    armature["whp_weapon_axis"] = [float(x) for x in whp_build.weapon_axis(sword, hand_r)]


# -- stage "anim" ----------------------------------------------------------

KIT = whp_clips.Kit(shield=True, attack="sword-slash")


# -- stage "lod" -----------------------------------------------------------

PARTS = [
    Part("head", ["Celt_head"], ["Celt_head"], (1500, 230, 36), uv=1.8, extrusion=0.015, ray=0.035),
    Part("torso", ["Celt_body"], ["Celt_body"], (1100, 190, 30), uv=1.1),
    Part("arms", ["Celt_arms"], ["Celt_arms"], (1300, 220, 44)),
    Part("legs", ["Celt_legs"], ["Celt_legs"], (1600, 270, 50), extrusion=0.02, ray=0.04),
    Part("belt", ["Celt_belt"], ["Celt_belt"], (300, 60, 0)),
    Part("shield", ["Shield.low"], ["Shield"], (None, 100, 36), uv=lambda slot: 0.45 if slot == 2 else 1.0,
         extrusion=0.02, ray=0.045, ao_alone=True),
    Part("sword", ["Sword_long.low"], ["Sword_long"], (None, 40, 8), uv=0.7, extrusion=0.006, ray=0.015,
         ao_alone=True),
    # Variant shapes (T-061): drawn only on the men who drew them; not at LOD2.
    Part("beard_short", ["Beard_short"], ["Beard_short"], (260, 34, 0), uv=1.4, extrusion=0.006, ray=0.012,
         ao_alone=True),
    Part("beard_full", ["Beard_full"], ["Beard_full"], (380, 48, 0), uv=1.4, extrusion=0.008, ray=0.016,
         ao_alone=True),
]

LOD2 = dict(
    own=("shield", "sword"),
    body=("head", "torso", "arms", "legs", "belt"),
    trunk="belt",
    skirt=None,
    head="head",
)


# -- each man his own look (T-061) --------------------------------------------
#
# celt_looks: the choices and the masks of the Celt's textures. Polybius
# 3.114.4: naked above the waist at Cannae.


def before_lod():
    """The beards (celt_beard), on the rigged head, in the colour of its hair."""
    head = bpy.data.objects["Celt_head"]
    celt_beard.build("Celt_head", celt_beard.hair_colour(head, celt_looks.is_hair, celt_looks.HAIR_LOW))


LOOKS = whp_look.Looks(
    slots=[
        whp_look.Slot("hair", "tint", celt_looks.HAIR),
        whp_look.Slot("skin", "tint", celt_looks.SKIN),
        whp_look.Slot("trousers", "dye", celt_looks.TROUSERS),
        whp_look.Slot("shield", "dye", celt_looks.SHIELD),
    ],
    parts={"head": ("hair", "skin"), "torso": ("skin", None), "arms": ("skin", None),
           "legs": ("trousers", "skin"), "shield": ("shield", None),
           "beard_short": ("hair", None), "beard_full": ("hair", None)},
    materials={"Celt_Head": celt_looks.head_dye, "Celt_Body": "skin", "Celt_Hands": "skin",
               "Celt_Legs": celt_looks.legs_dye, "whp-shield-paint": "shield", "whp-beard": "hair"},
    # Diodorus 5.28.3: some shave, some let the beard grow a little; the nobles keep only the moustache.
    variants=[whp_look.Variants("beard", [(5, None), (3, "beard_short"), (2, "beard_full")])],
    designs=celt_looks.DESIGNS,
)


# -- review images (render_review.py) -----------------------------------------

REVIEW = ["views", "three-quarter", "head", "formation", "lods", "animations", "beside", "test-poses"]
BESIDE = "roman-legionary"
