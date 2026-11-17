"""roman-hastatus: a young legionary of the first line (hastati).

Built from roman-legionary (same source body, helmet, shield, sword, belt)
with what Polybius 6.23 gives the mass of the hastati instead of mail: a
square bronze plate over the heart (pectorale) on leather straps, bronze
greaves, and two pila. The pila are held upright in the left fist, behind
the shield: the right hand keeps the sword, so the clips (attack: sword
thrust behind the shield) are the legionary's, and the pila, standing a
head above the shield, tell the hastati from the principes at a distance.

Legionaries threw their pila, then drew their swords and charged (Caesar,
Gallic War 1.25, the clearest account): the pila hang from a bone of their
own (whp_clips.SPARE_BONE), which follows the left fist, and in the attack
and the fall they are gone (shrunk to nothing inside the fist). The scene
has one attack clip per model, so it cannot show the throw itself.

The build itself is whp_build; this module holds what is particular to
this model.
"""

import bpy

import roman_armour
import roman_fit
import roman_kit
import roman_mail
import roman_source
import whp_clips
from whp_unit_lod import Part

MODEL = "roman-hastatus"


# -- stages "source" and "kit" ---------------------------------------------

def build_source():
    roman_source.import_roman()
    roman_source.strip_imperial_kit()


def _kit(detail, suffix=""):
    mats = roman_kit.materials(detail)
    made = roman_kit.helmet_and_shield(detail, mats, suffix)
    objs = bpy.data.objects
    tunic = objs["Tunic_1"]
    if detail == 2:
        made += [roman_mail.build_belt(tunic, mats), roman_armour.build_straps(tunic, mats)]
    made.append(roman_armour.build_pectorale(tunic, detail, mats, "Pectorale" + suffix))
    for side, tag in ((1, "l"), (-1, "r")):
        made.append(roman_armour.build_greave(objs["New_legs"], objs["Boots"], side, detail, mats,
                                              f"Greave_{tag}" + suffix))
    made.append(roman_armour.build_pila(detail, mats, "Pila" + suffix))
    return made


def build_kit():
    roman_kit.prepare_body()
    _kit(2)
    roman_kit.hide_low(_kit(0, ".low"))


# -- stage "rig" -----------------------------------------------------------

fit = roman_fit.build
# The pila are fitted with the left hand, then hang from the spare bone.
RIGID = dict(roman_kit.RIGID, Greave_l="calf_l", Greave_r="calf_r", Pila=("hand_l", whp_clips.SPARE_BONE))
SHARED = roman_kit.SHARED
# Rounds of weight smoothing; cloth and leather get more than skin. The chest
# plate takes its weights from the body like the tunic under it (heavily
# smoothed, so it hardly bends): fixed to one bone, the tunic and straps
# would push through its lower edge whenever the back bends.
SMOOTHING = {"Tunic_1": 12, "Belt": 8, "Pectorale_straps": 10, "Pectorale": 16}
DEFAULT_SMOOTHING = 3
MERGE_FINGERS = True                # the fists are closed for good
rig_extras = roman_kit.rig_extras


# -- stage "anim" ----------------------------------------------------------

KIT = whp_clips.Kit(shield=True, attack="sword-thrust", spare=True)


# -- stage "lod" -----------------------------------------------------------

PARTS = [
    # The head mesh has open eye sockets: the eyeballs must come along.
    Part("head", ["New_head", "New_eye", "New_eye_2"], ["New_head", "New_eye", "New_eye_2"], (1150, 190, 36),
         covers=["Helmet"], reach=0.035, uv=1.8, extrusion=0.015, ray=0.035),
    Part("arms", ["New_arms"], ["New_arms"], (1100, 190, 44), covers=["Tunic_1"], reach=0.03),
    # The shins stay under the greaves: there is a gap between the two, and
    # a hole under it would show through at the open top and back.
    Part("legs", ["New_legs"], ["New_legs", "Boots"], (1150, 210, 50), extrusion=0.02, ray=0.04,
         sole=["Boots"]),
    # No mail: the whole tunic shows, so it gets more of the budget.
    # The chest plate stands clear of the tunic: the tunic under it stays.
    Part("tunic", ["Tunic_1"], ["Tunic_1"], (1150, 210, 24),
         covers=["Belt", "Pectorale_straps"], reach=0.03, uv=0.9),
    Part("belt", ["Belt"], ["Belt"], (140, 40, 0)),
    Part("straps", ["Pectorale_straps"], ["Pectorale_straps"], (260, 30, 0), covers=["Pectorale"], reach=0.03),
    # Many loose pieces: does not decimate below ~170, so it is left out of LOD1.
    Part("scabbard", ["Scabbard"], ["Scabbard"], (220, 0, 0)),
    Part("sword", ["Sword2_1"], ["Sword2_1"], (140, 40, 10), ao_alone=True),
    Part("helmet", ["Helmet.low"], ["Helmet"], (None, 110, 20), uv=1.3, extrusion=0.008, ray=0.02),
    Part("cheeks", ["Helmet_cheeks.low"], ["Helmet_cheeks"], (None, 40, 0), uv=1.2, extrusion=0.005, ray=0.012),
    Part("crest", ["Helmet_crest.low"], ["Helmet_crest"], (None, 48, 6), uv=0.7, extrusion=0.005, ray=0.012),
    # Slot 2 of the shield is the wooden back: half the density of the face.
    Part("shield", ["Scutum.low"], ["Scutum"], (None, 100, 34), uv=lambda slot: 0.45 if slot == 2 else 1.0,
         extrusion=0.02, ray=0.045, ao_alone=True),
    Part("pectorale", ["Pectorale.low"], ["Pectorale"], (None, 24, 0), uv=1.3, extrusion=0.008, ray=0.02),
    Part("greaves", ["Greave_l.low", "Greave_r.low"], ["Greave_l", "Greave_r"], (None, 60, 0),
         uv=1.1, extrusion=0.008, ray=0.02),
    Part("pila", ["Pila.low"], ["Pila"], (None, 44, 8), uv=0.7, extrusion=0.006, ray=0.015, ao_alone=True),
]

LOD2 = dict(
    own=("shield", "sword", "crest", "helmet", "pila"),
    body=("head", "arms", "legs", "tunic", "belt", "greaves"),
    trunk="belt",
    skirt="tunic",
    head="head",
)


# -- review images (render_review.py) -----------------------------------------

REVIEW = ["views", "three-quarter", "head", "formation", "lods", "animations", "metal", "closeups", "beside",
          "test-poses"]
# (title, bone, low corner, high corner from the bone's head, view from)
CLOSEUPS = [
    ("chest", "spine_03", (-0.24, -0.30, -0.30), (0.24, 0.22, 0.32), (-0.55, -1.0, 0.0)),
    ("pila", "hand_l", (-0.45, -0.45, -0.85), (0.45, 0.45, 1.35), (0.85, 0.75, 0.0)),
]
CLOSEUP_NAME = "chest-pilum"
BESIDE = "roman-legionary"
