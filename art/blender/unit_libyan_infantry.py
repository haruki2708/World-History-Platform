"""libyan-infantry: Hannibal's Libyan foot, re-armed with Roman equipment.

Polybius 3.87.3 and 3.114.1: after Trebia and Trasimene Hannibal armed his
Libyans with the best of the captured Roman arms; Livy 22.46.4: seeing them
"you would have thought them a Roman line". So the kit is roman-legionary's
(mail, Montefortino helmet, scutum, sword: the Roman way of fighting, hence
the sword-thrust and no spear), and what tells them apart at close range is
what was not captured or was their own:
  - the tunic is undyed wool, earth-coloured, not Roman red;
  - the shield face is pale hide, not red paint (no source gives the
    colour: it is chosen to differ from the Roman shields);
  - the helmet has no Roman feather crest;
  - darker skin and a short dark beard.

The build itself is whp_build; this module holds what is particular to
this model.
"""

import bpy

import roman_faces
import roman_fit
import roman_kit
import roman_mail
import roman_source
import whp_clips
import whp_materials
from whp_unit_lod import Part

MODEL = "libyan-infantry"

TUNIC = (0.30, 0.22, 0.135)                 # undyed brown wool
SHIELD = ((0.50, 0.43, 0.31), (0.30, 0.25, 0.17))   # pale hide
EXTRA_MATERIALS = [
    ("shield", lambda: whp_materials.shield_paint(*SHIELD)),
    ("hair", lambda: whp_materials.plain("hair", *roman_faces.HAIR_DARK, roughness=0.6, scale=400.0, bump=0.5)),
]


# -- stages "source" and "kit" ---------------------------------------------

def build_source():
    roman_source.import_roman()
    roman_source.strip_imperial_kit()
    objs = bpy.data.objects
    roman_source.recolour(objs["Tunic_1"], TUNIC)
    for name in ("New_head", "New_arms", "New_legs"):
        roman_source.tint(objs[name], roman_faces.SKIN["libyan"])


def _kit(detail, suffix=""):
    mats = roman_kit.materials(detail, EXTRA_MATERIALS)
    made = roman_kit.helmet(detail, mats, suffix, crest=False) + [roman_kit.scutum(detail, mats, suffix)]
    objs = bpy.data.objects
    if detail == 2:
        tunic = objs["Tunic_1"]
        yoke = roman_mail.build_yoke(tunic, mats)
        made += [roman_mail.build_shirt(tunic, mats), yoke, roman_mail.build_belt(tunic, mats),
                 roman_faces.build_shell(objs["New_head"], "beard", 0.005, mats, "Beard")]
    made.append(roman_mail.build_chest_hook(objs["Mail_yoke"], mats, detail, "Mail_hook" + suffix))
    return made


def build_kit():
    roman_kit.prepare_body()
    _kit(2)
    roman_kit.hide_low(_kit(0, ".low"))


# -- stage "rig" -----------------------------------------------------------

fit = roman_fit.build
RIGID = dict(roman_kit.RIGID, Mail_hook="spine_03")
del RIGID["Helmet_crest"]
SHARED = roman_kit.SHARED
SMOOTHING = {"Tunic_1": 12, "Mail": 12, "Mail_yoke": 12, "Belt": 8, "Beard": 6}
DEFAULT_SMOOTHING = 3
MERGE_FINGERS = True
rig_extras = roman_kit.rig_extras


# -- stage "anim" ----------------------------------------------------------

KIT = whp_clips.Kit(shield=True, attack="sword-thrust")


# -- stage "lod" -----------------------------------------------------------

PARTS = [
    Part("head", ["New_head", "New_eye", "New_eye_2"], ["New_head", "New_eye", "New_eye_2"], (1150, 190, 36),
         covers=["Helmet"], reach=0.035, uv=1.8, extrusion=0.015, ray=0.035),
    Part("beard", ["Beard"], ["Beard"], (280, 50, 0), uv=1.0, extrusion=0.006, ray=0.012),
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
    Part("sword", ["Sword2_1"], ["Sword2_1"], (140, 40, 10), ao_alone=True),
    Part("helmet", ["Helmet.low"], ["Helmet"], (None, 110, 24), uv=1.3, extrusion=0.008, ray=0.02),
    Part("cheeks", ["Helmet_cheeks.low"], ["Helmet_cheeks"], (None, 40, 0), uv=1.2, extrusion=0.005, ray=0.012),
    Part("shield", ["Scutum.low"], ["Scutum"], (None, 100, 40), uv=lambda slot: 0.45 if slot == 2 else 1.0,
         extrusion=0.02, ray=0.045, ao_alone=True),
    Part("hook", ["Mail_hook.low"], ["Mail_hook"], (None, 0, 0), extrusion=0.008, ray=0.02),
]

LOD2 = dict(
    own=("shield", "sword", "helmet"),
    body=("head", "arms", "legs", "tunic", "mail", "yoke", "belt"),
    trunk="mail",
    skirt="tunic",
    head="head",
)


# -- review images (render_review.py) -----------------------------------------

REVIEW = ["views", "three-quarter", "head", "formation", "lods", "animations", "beside", "test-poses"]
BESIDE = "roman-legionary"
