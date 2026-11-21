"""roman-cavalry: a Roman or allied horseman of 216 BCE, on lane 2's horse.

Polybius 6.25 tells of two kits. The old one: no body armour, only a loin
cloth; a light spear that shook and broke; a shield of ox-hide, like the
round cakes offered at sacrifices, that went soft in the rain. Then "they
soon changed to the Greek fashion": a stiff spear with a spike at the butt
as well as the head, and a firm Greek shield. Polybius does not say when;
he writes that the change was quick and that in his day (the mid-second
century) the horsemen were armed in the Greek way. This model takes the
newer kit, for these reasons: the horsemen were the richest citizens, and
by 216 the richest foot soldiers already wore mail (Polybius 6.23.15); the
Roman horsemen on the monument of Aemilius Paullus at Delphi (168 BCE)
wear mail with shoulder doubling and carry round shields. So: the
Montefortino helmet with its crest, the mail shirt of the principes over
the red tunic, a round shield of about 0.66 m slung on the left forearm
(the left hand holds the reins), a spear of 2.5 m with a butt spike in the
right fist, the sword sheathed on the right hip. Colours as the legionary's.

The rider is built on the Roman source body like the foot; whp_cavalry
puts him on the horse (saddle cloth and bridle).
"""

import contextlib
import functools

import bpy

import roman_beard
import roman_fit
import roman_hands
import roman_kit
import roman_looks
import roman_mail
import roman_parma
import roman_shield
import roman_source
import roman_weapons
import cavalry_looks
import whp_cavalry
import whp_clips
import whp_look
from roman_fit import FINAL_SCALE
from whp_unit_lod import Part

MODEL = "roman-cavalry"
SPEAR = dict(roman_weapons.HASTA, length=2.50, grip=0.95)
SHIELD_RADIUS = 0.33


@contextlib.contextmanager
def parma_size(radius):
    """roman_parma builds a shield of this radius meanwhile."""
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


def _kit(detail, suffix=""):
    mats = roman_kit.materials(detail)
    made = roman_kit.helmet(detail, mats, suffix)
    with parma_size(SHIELD_RADIUS):
        shield = roman_parma.build(detail, mats, "Parma" + suffix)
    roman_shield.place(shield, roman_hands.grip_axis_point(1), 1.0 / FINAL_SCALE)
    made.append(shield)
    objs = bpy.data.objects
    if detail == 2:
        tunic = objs["Tunic_1"]
        yoke = roman_mail.build_yoke(tunic, mats)
        made += [roman_mail.build_shirt(tunic, mats), yoke, roman_mail.build_belt(tunic, mats)]
    made.append(roman_mail.build_chest_hook(objs["Mail_yoke"], mats, detail, "Mail_hook" + suffix))
    made.append(roman_weapons.build_right_hand(SPEAR, detail, mats, "Spear" + suffix))
    return made


def build_kit():
    roman_kit.prepare_body(sword="sheathed")
    _kit(2)
    roman_kit.hide_low(_kit(0, ".low"))


# -- stage "rig" -----------------------------------------------------------

fit = roman_fit.build
RIGID = {k: v for k, v in roman_kit.RIGID.items() if k not in (roman_kit.WEAPON, "Scutum")}
# The shield is fitted with the left hand, then hangs from the spare bone,
# which every clip keeps on the outside of the left forearm (whp_cavalry).
RIGID.update(Parma=("hand_l", whp_clips.SPARE_BONE), Spear="hand_r", Mail_hook="spine_03")
SHARED = dict(roman_kit.SHARED, **{roman_kit.WEAPON: roman_kit.SHARED["Scabbard"]})
SMOOTHING = {"Tunic_1": 12, "Mail": 12, "Mail_yoke": 12, "Belt": 8}
DEFAULT_SMOOTHING = 3
MERGE_FINGERS = True
rig_extras = functools.partial(roman_kit.rig_extras, weapon="Spear")


# -- stage "anim" (whp_cavalry) ------------------------------------------------

# The rider's fall is made as a foot soldier's (whp_clips) with this kit:
# the shield is not in the hand, the spear lies flat when he is down.
KIT = whp_clips.Kit(shield=False, attack="spear-thrust", lie_flat=True)
RIDER = whp_cavalry.Rider(attack="spear-thrust", reins=True, shield="forearm")
HORSE = whp_cavalry.Horse(tack=("cloth", "bridle"))
BONES = whp_cavalry.BONES
GROUND_CHECKS = whp_cavalry.GROUND_CHECKS
SEAT_MESHES = ("New_legs",)             # what of him rests on the horse's back
SHIELD_MESH = "Parma"
# Where the shield hangs (whp_cavalry.RiderPoser._spare_placement): its
# middle this far along the forearm from the elbow and this far off it,
# its face and its "down" this way; lying flat this high when he is down.
SHIELD_HANG = dict(along=0.35, offset=(0.17, 0.0, -0.03), out=(1.0, -0.2, -0.12), down=(0.0, -0.10, -1.0),
                   lying=0.04)


# -- stage "lod" -----------------------------------------------------------

PARTS = [
    Part("head", ["New_head", "New_eye", "New_eye_2"], ["New_head", "New_eye", "New_eye_2"], (700, 110, 0),
         covers=["Helmet"], reach=0.035, uv=1.8, extrusion=0.015, ray=0.035),
    Part("arms", ["New_arms"], ["New_arms"], (600, 100, 0), covers=["Tunic_1", "Mail", "Mail_yoke"], reach=0.03),
    Part("legs", ["New_legs"], ["New_legs", "Boots"], (650, 120, 0), extrusion=0.02, ray=0.04, sole=["Boots"]),
    Part("tunic", ["Tunic_1"], ["Tunic_1"], (300, 50, 0), covers=["Mail", "Mail_yoke", "Belt"], reach=0.03, uv=0.85),
    Part("mail", ["Mail"], ["Mail"], (600, 110, 0), covers=["Mail_yoke", "Belt"], reach=0.02),
    Part("yoke", ["Mail_yoke"], ["Mail_yoke"], (220, 30, 0)),
    Part("belt", ["Belt"], ["Belt"], (80, 0, 0)),
    Part("scabbard", ["Scabbard"], ["Scabbard"], (120, 0, 0)),
    Part("sword", ["Sword2_1"], ["Sword2_1"], (60, 0, 0), covers=["Scabbard"], reach=0.02),
    Part("helmet", ["Helmet.low"], ["Helmet"], (300, 70, 0), uv=1.3, extrusion=0.008, ray=0.02),
    Part("cheeks", ["Helmet_cheeks.low"], ["Helmet_cheeks"], (200, 0, 0), uv=1.2, extrusion=0.005, ray=0.012),
    Part("crest", ["Helmet_crest.low"], ["Helmet_crest"], (100, 30, 0), uv=0.7, extrusion=0.005, ray=0.012),
    Part("shield", ["Parma.low"], ["Parma"], (260, 60, 16), uv=lambda slot: 0.45 if slot == 2 else 1.0,
         extrusion=0.02, ray=0.045, ao_alone=True),
    Part("hook", ["Mail_hook.low"], ["Mail_hook"], (None, 0, 0), extrusion=0.008, ray=0.02),
    Part("spear", ["Spear.low"], ["Spear"], (None, 20, 4), uv=0.6, extrusion=0.005, ray=0.012, ao_alone=True),
    # Variant shapes (T-061): the beards, on a horseman's budget.
    *roman_beard.parts(scale=0.6),
]

LOD2 = dict(
    own=("shield", "spear"),
    body=("head", "arms", "legs", "tunic", "mail", "yoke", "belt"),
    trunk="mail",
    skirt=None,                 # the hem is in the horse's back
    head="head",
    feet=False,                 # no hands or feet at that range: the horse takes most of the budget
)


# -- each man his own look (T-061) --------------------------------------------
#
# The legionary's (roman_looks), and the horse (cavalry_looks): its coat,
# and the saddle cloth's madder red in shades.

CLOTH = [(3, whp_look.srgb(133, 60, 47)), (2, whp_look.srgb(110, 40, 34)), (2, whp_look.srgb(142, 72, 50)),
         (1, whp_look.srgb(150, 90, 70)), (1, whp_look.srgb(96, 30, 30))]
_horse_slots, _horse_parts, _horse_materials = cavalry_looks.horse(cloth=CLOTH)
LOOKS = whp_look.Looks(
    slots=[
        whp_look.Slot("tunic", "dye", roman_looks.TUNIC),
        whp_look.Slot("crest", "dye", roman_looks.CREST),
        whp_look.Slot("shield", "dye", roman_looks.SHIELD),
        whp_look.Slot("skin", "tint", roman_looks.SKIN),
        whp_look.Slot("hair", "dye", roman_looks.HAIR),
        *_horse_slots,
    ],
    parts={"head": ("skin", None), "arms": ("skin", None), "legs": ("skin", None), "tunic": ("tunic", None),
           "crest": ("crest", None), "shield": ("shield", None),
           "beard_short": ("hair", None), "beard_full": ("hair", None), **_horse_parts},
    materials={"New_head0": "skin", "New_arms0": "skin", "New_legs0": "skin", "Tunic_10": "tunic",
               "whp-feather": "crest", "whp-shield-paint": "shield", "whp-beard": "hair", **_horse_materials},
    variants=[whp_look.Variants("beard", roman_looks.BEARDS)],
)


def before_lod():
    """The beards (roman_beard), short of the cheek pieces and the collar."""
    roman_beard.build(avoid=["Helmet_cheeks", "Mail_yoke", "Tunic_1"])


# -- review images (render_review.py) -----------------------------------------

REVIEW = ["views", "three-quarter", "lods", "animations", "beside"]
BESIDE = "roman-legionary"
