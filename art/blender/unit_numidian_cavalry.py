"""numidian-cavalry: Hannibal's Numidian horse, on lane 2's horse made a
little smaller.

Livy 35.11.7-8: men and horses small and lean; the rider ungirt and
unarmed but for the javelins he carries; the horses without bridles, and
ugly to see running, neck stiff and head stretched out. Livy 21.46.5: at
the Ticinus Hannibal put his bridled horse in the centre and the Numidians
on the wings. Strabo 17.3.7, of the Maurusians to the west of Numidia: small,
swift horses so obedient that a little rod guides them, with collars of
wood or of hair; the horsemen ride bareback, mostly with javelins, small
spears with broad heads, and small shields of raw hide; they wear ungirded
tunics with wide borders.

So: the horse 0.95 of lane 2's (1.33 m at the withers), bareback, only the
rope round its neck; the rider in an ungirt tunic of undyed wool with a
wide dark border, no armour, no helmet, dark hair and beard; a small round
shield of raw hide (0.52 m) and two spare javelins in the left fist, a
javelin with a broad head in the right. The attack is a javelin throw.
Darker skin than the Iberians (as the Libyan foot).

Built on the Roman source body; whp_cavalry puts him on the horse.
"""

import contextlib

import bpy

import roman_faces
import roman_fit
import roman_hands
import roman_kit
import roman_parma
import roman_shield
import roman_source
import roman_weapons
import whp_cavalry
import whp_clips
import whp_materials
from roman_fit import FINAL_SCALE
from whp_unit_lod import Part

MODEL = "numidian-cavalry"
WOOL = (0.50, 0.44, 0.33)                   # undyed wool
BORDER = (0.16, 0.055, 0.025)               # a wide dark red-brown border
BORDER_WIDTH = 0.10 / FINAL_SCALE
SHIELD_RADIUS = 0.26
RAWHIDE = ((0.36, 0.27, 0.16), (0.20, 0.14, 0.08))
# Strabo's "small spears with broad heads".
JAVELIN = dict(roman_weapons.JAVELIN, length=1.50, grip=0.62, shaft_r=(0.0100, 0.0095), socket=0.06,
               socket_r=0.0110, blade=0.15, blade_w=0.022, blade_t=0.0045, widest=0.40)
EXTRA_MATERIALS = [
    ("shield", lambda: whp_materials.plain("shield-paint", *RAWHIDE, roughness=0.75, scale=30.0, bump=0.3)),
    ("hair", whp_materials.hair),                    # T-047: curls, matte
]


@contextlib.contextmanager
def parma_size(radius):
    old = roman_parma.RADIUS
    roman_parma.RADIUS = radius
    try:
        yield
    finally:
        roman_parma.RADIUS = old


# -- stages "source" and "kit" ---------------------------------------------

def build_source():
    roman_source.import_roman()
    roman_source.strip_imperial_kit()
    objs = bpy.data.objects
    roman_source.border_attribute(objs["Tunic_1"], BORDER_WIDTH, sleeves=False)
    roman_source.recolour(objs["Tunic_1"], WOOL, border="whp_border", border_color=BORDER, contrast=0.5)
    for name in ("New_head", "New_arms", "New_legs"):
        roman_source.tint(objs[name], roman_faces.SKIN["libyan"])


def _kit(detail, suffix=""):
    mats = roman_kit.materials(detail, EXTRA_MATERIALS)
    objs = bpy.data.objects
    with parma_size(SHIELD_RADIUS):
        shield = roman_parma.build(detail, mats, "Parma" + suffix)
    roman_shield.place(shield, roman_hands.grip_axis_point(1), 1.0 / FINAL_SCALE)
    made = [shield,
            roman_weapons.build_right_hand(JAVELIN, detail, mats, "Javelin" + suffix),
            roman_weapons.build_spares(JAVELIN, detail, mats, "Javelins" + suffix, count=2)]
    if detail == 2:
        head = objs["New_head"]
        made += [roman_faces.build_hair(head, mats, "Hair"),
                 roman_faces.build_shell(head, "beard", 0.004, mats, "Beard")]
    return made


def build_kit():
    roman_kit.prepare_body(sword="none")
    _kit(2)
    roman_kit.hide_low(_kit(0, ".low"))


# -- stage "rig" -----------------------------------------------------------

fit = roman_fit.build
RIGID = {k: v for k, v in roman_kit.RIGID.items() if k.startswith("New_eye")}
RIGID.update(Parma="hand_l", Javelin="hand_r", Javelins="hand_l")
SHARED = {}
SMOOTHING = {"Tunic_1": 12, "Hair": 6, "Beard": 6}
DEFAULT_SMOOTHING = 3
MERGE_FINGERS = True


def rig_extras(armature, matrices, index):
    roman_kit.rig_extras(armature, matrices, index, weapon="Javelin")


# -- stage "anim" (whp_cavalry) ------------------------------------------------

KIT = whp_clips.Kit(shield=True, attack="javelin-throw")
RIDER = whp_cavalry.Rider(attack="javelin-throw", reins=False, shield="hand",
                          carry={"default": whp_cavalry.JAVELIN_UP})
HORSE = whp_cavalry.Horse(tack=("neckrope",), scale=0.95)
BONES = whp_cavalry.BONES
GROUND_CHECKS = whp_cavalry.GROUND_CHECKS
SEAT_MESHES = ("New_legs",)


# -- stage "lod" -----------------------------------------------------------

PARTS = [
    Part("head", ["New_head", "New_eye", "New_eye_2"], ["New_head", "New_eye", "New_eye_2"], (900, 130, 0),
         reach=0.035, uv=1.8, extrusion=0.015, ray=0.035),
    Part("hair", ["Hair"], ["Hair"], (250, 40, 0), uv=1.0, extrusion=0.008, ray=0.015),
    Part("beard", ["Beard"], ["Beard"], (200, 30, 0), uv=1.0, extrusion=0.006, ray=0.012),
    Part("arms", ["New_arms"], ["New_arms"], (800, 130, 0), covers=["Tunic_1"], reach=0.03),
    Part("legs", ["New_legs"], ["New_legs", "Boots"], (900, 140, 0), extrusion=0.02, ray=0.04, sole=["Boots"]),
    Part("tunic", ["Tunic_1"], ["Tunic_1"], (800, 130, 0), uv=1.0),
    Part("shield", ["Parma.low"], ["Parma"], (260, 70, 16), uv=lambda slot: 0.45 if slot == 2 else 1.0,
         extrusion=0.02, ray=0.045, ao_alone=True),
    Part("javelin", ["Javelin.low"], ["Javelin"], (None, 24, 4), uv=0.6, extrusion=0.005, ray=0.012, ao_alone=True),
    Part("javelins", ["Javelins.low"], ["Javelins"], (None, 40, 0), uv=0.6, extrusion=0.005, ray=0.012,
         ao_alone=True),
]

LOD2 = dict(
    own=("shield", "javelin"),
    body=("head", "arms", "legs", "tunic"),
    trunk="tunic",
    skirt=None,
    head="head",
    feet=False,
)


# -- review images (render_review.py) -----------------------------------------

REVIEW = ["views", "three-quarter", "lods", "animations", "beside"]
BESIDE = "roman-legionary"
