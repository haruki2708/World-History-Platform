"""gallic-cavalry: Hasdrubal's Gallic horse at Cannae, on lane 2's horse.

Polybius 3.113 and Livy 22.46.1 put the Iberian and the Celtic horse on
Hannibal's left, by the river, against the Roman cavalry; Polybius 3.115.2-3
and Livy 22.47.1-3 tell of a fight with no room to wheel, the men at close
quarters, dismounting (Polybius) or dragging each other off their horses
(Livy). Neither says how the Gallic horsemen were dressed or armed. What
follows is taken from what the sources say of the Gauls in general, item by
item; where nothing is said of horsemen, it says so.

  - Trousers (bracae): Polybius 2.28.7 (the Insubres and Boii at Telamon,
    225 BCE: "their trousers and light cloaks"); Diodorus 5.30.1; Strabo
    4.4.3 (tight breeches). The Celt's own trousers, dyed as gallic-
    infantry's (celt_source).
  - A dyed tunic under the cloak (celt_tunic): Diodorus 5.30.1, shirts
    dyed and embroidered in varied colours; Strabo 4.4.3, slit tunics with
    sleeves to the buttocks, 4.4.5, the men of rank in dyed garments;
    Diodorus 5.30.3, girt with belts. Sleeves to the elbow, the skirt to
    the top of the thighs, a leather belt. Green with a yellow border is a
    choice (the sources give no colour): the cloak's two dyes, woad and
    weld, together; not the Iberians' white, not the Romans' red. Polybius
    3.114.4 and Livy 22.46.6 have the Gauls at Cannae naked above the waist,
    but that is said of the foot; a horseman of rank in a tunic is the
    user's choice (T-050), and gives the rider a colour from the front.
  - A light cloak (celt_cloak): Polybius 2.28.7; Diodorus 5.30.1, striped
    cloaks fastened by a brooch on the shoulder, light in summer, set with
    close checks of many colours; Strabo 4.4.3, the sagus. Its cut (a short
    cape, so that it clears the horse), and its colours (woad blue, checks
    of madder red and weld yellow) are choices.
  - Torc and arm rings in gold: Polybius 2.29.8 (the front ranks at Telamon,
    gold torques and armlets), 2.31.5; Diodorus 5.27.3; Strabo 4.4.5. The
    Celt model's own.
  - Hair long, blond and drawn back, a moustache over the mouth (celt_hair):
    Diodorus 5.28.1-3 (the nobles shave the cheeks and keep the moustache);
    Strabo 4.4.3. No helmet: Diodorus 5.30.2 knows bronze helmets with
    figures on them; leaving it off is a choice, which keeps the fair head
    visible.
  - Shield: the Gauls' long oval (Polybius 3.114.2, Livy 22.46.5: like the
    Iberians'; Strabo 4.4.3: long and oblong), smaller for a horseman
    (0.92 x 0.50 m, as iberian-gallic-cavalry's), slung on the left forearm
    (the left hand holds the reins), painted woad blue as gallic-infantry's
    (the colour is a choice).
  - Weapon: the long sword, drawn, in the right fist, and the attack a cut
    (sword-slash, 1.333 s). Polybius 2.30.8, 2.33.3-5, 3.114.3 and Livy
    22.46.5: the Gaulish sword is long, without a point, good only for a
    cut; Diodorus 5.30.3 and Strabo 4.4.3: worn on the right side. Diodorus
    5.30.4 also gives the Gauls spears (lanciae). The sword is chosen because
    the fight at Cannae was at close quarters (above), and because it sets
    the Gauls apart from the Iberian and Roman horse, who carry spears.
  - Bare feet, as the Celt model: a choice (no source on footwear).
  - Saddle cloth of undyed wool with a madder border: a choice, to tell it
    from the Romans' red and the Iberians' blue-black.

Built on the Celt of gallic-infantry (celt_source), fists closed: his
trousers, torc and arm rings, moustache (his waistband is under the
tunic). His seat is measured
seated (SEAT_MEASURE): measured standing, the inner thighs of the baggy
trousers lifted him off the horse. whp_cavalry puts him on the horse.
"""

import bpy
import numpy as np

import cavalry_looks
import celt_beard
import celt_cloak
import celt_hair
import celt_kit
import celt_looks
import celt_source
import celt_tunic
import roman_kit
import roman_shield
import whp_build
import whp_cavalry
import whp_clips
import whp_look
import whp_materials
import whp_skin
from whp_mesh import get_coords
from whp_unit_lod import Part

MODEL = "gallic-cavalry"
SHIELD = ((0.055, 0.085, 0.15), (0.025, 0.040, 0.075))   # woad blue, as gallic-infantry's
# The Gauls' long oval (roman_shield.OVAL_SHIELD, 1.10 x 0.58 m on foot),
# smaller for a horseman, as iberian-gallic-cavalry's.
CAVALRY_OVAL = dict(roman_shield.OVAL_SHIELD, LENGTH=0.92, WIDTH=0.50, BOSS_HALF_LENGTH=0.11, PLATE_HALF=(0.13, 0.045))
EXTRA_MATERIALS = [
    ("shield", lambda: whp_materials.shield_paint(*SHIELD)),
    ("cloak", celt_cloak.material),
    ("hair", celt_hair.material),
] + celt_tunic.materials()


# -- stages "source" and "kit" ---------------------------------------------

def build_source():
    celt_source.import_celt(fists=True)


def _shield(detail, mats, name):
    with roman_shield.variant(**CAVALRY_OVAL):
        obj = roman_shield.build(detail, mats, name)
    origin, u, v, w = celt_kit.shield_frame()
    celt_kit._place(obj, origin, u, v, w)
    obj["whp_down"] = [float(x) for x in v]
    obj["whp_out"] = [float(x) for x in w]
    return obj


def _kit(detail, suffix=""):
    mats = roman_kit.materials(detail, EXTRA_MATERIALS)
    made = [_shield(detail, mats, "Shield" + suffix),
            celt_kit.build_sword(detail, mats, "Sword_long" + suffix),
            celt_tunic.build(detail, mats, "Tunic" + suffix)]
    # The belt round the detailed tunic; the cloak over it (the detailed tunic is in its profile).
    made.append(celt_tunic.build_girdle(detail, mats, "Girdle" + suffix))
    made.append(celt_cloak.build(detail, mats, "Cloak" + suffix))
    return made


def build_kit():
    _kit(2)
    celt_hair.build(roman_kit.materials(0))
    roman_kit.hide_low(_kit(0, ".low"))
    celt_kit.drop_references()


# -- stage "rig" -----------------------------------------------------------

fit = celt_source.build
RIGID = {"Shield": ("hand_l", whp_clips.SPARE_BONE), "Sword_long": "hand_r"}
SHARED = {}
SMOOTHING = {"Celt_belt": 6, "Tunic": 8, "Girdle": 6}
DEFAULT_SMOOTHING = 1
MERGE_FINGERS = True


def rig_extras(armature, matrices, index):
    """Shield axes kept by _shield; the sword's line from the right fist."""
    shield = bpy.data.objects["Shield"]
    armature["whp_shield_down"] = list(shield["whp_down"])
    armature["whp_shield_out"] = list(shield["whp_out"])
    sword = get_coords(bpy.data.objects["Sword_long"])
    hand_r = np.array(armature.data.bones["hand_r"].head_local)
    armature["whp_weapon_axis"] = [float(x) for x in whp_build.weapon_axis(sword, hand_r)]
    names = [b.name for b in armature.data.bones]
    for name in ("Cloak", "Cloak.low"):
        cloak = bpy.data.objects[name]
        whp_skin.write_groups(cloak, whp_skin.prune(celt_cloak.weights(cloak, names)), names)
    hair = bpy.data.objects["Hair"]
    whp_skin.write_groups(hair, whp_skin.prune(celt_hair.weights(hair, names)), names)


# -- stage "anim" (whp_cavalry) ------------------------------------------------

KIT = whp_clips.Kit(shield=False, attack="sword-slash")
RIDER = whp_cavalry.Rider(attack="sword-slash", reins=True, shield="forearm",
                          carry={"default": whp_cavalry.SWORD_UP, "run": whp_cavalry.SWORD_FORWARD},
                          thigh=(0.49, -0.61, -0.62), calf=(0.07, 0.16, -0.985))
SEAT_MEASURE = "seated"
HORSE = whp_cavalry.Horse(tack=("cloth", "bridle"), cloth=((0.42, 0.37, 0.27), (0.20, 0.035, 0.022)))
BONES = whp_cavalry.BONES
GROUND_CHECKS = whp_cavalry.GROUND_CHECKS
SEAT_MESHES = ("Celt_legs",)
SKIRTS = ("Tunic.low",)                 # drawn in to the seated thighs (whp_cavalry.drape_skirts)
LEGS_MESH = "Celt_legs"
SHIELD_MESH = "Shield"
SHIELD_HANG = dict(along=0.35, offset=(0.17, 0.0, -0.06), out=(1.0, -0.2, -0.12), down=(0.0, -0.18, -1.0),
                   lying=0.03)


# -- stage "lod" -----------------------------------------------------------

PARTS = [
    Part("head", ["Celt_head"], ["Celt_head"], (800, 120, 0), covers=["Hair"], reach=0.03, uv=1.8,
         extrusion=0.015, ray=0.035),
    Part("hair", ["Hair"], ["Hair"], (300, 50, 0), uv=1.0, extrusion=0.010, ray=0.020),
    Part("torso", ["Celt_body"], ["Celt_body"], (260, 40, 0), covers=["Tunic"], reach=0.03, uv=1.1),
    Part("tunic", ["Tunic.low"], ["Tunic"], (None, 110, 0), uv=1.0, extrusion=0.010, ray=0.020),
    Part("girdle", ["Girdle.low"], ["Girdle"], (None, 14, 0), uv=0.8, extrusion=0.006, ray=0.012),
    Part("arms", ["Celt_arms"], ["Celt_arms"], (800, 120, 0)),
    Part("legs", ["Celt_legs"], ["Celt_legs"], (850, 130, 0), extrusion=0.02, ray=0.04),
    Part("cloak", ["Cloak.low"], ["Cloak"], (None, 90, 0), uv=1.0, extrusion=0.008, ray=0.016),
    Part("shield", ["Shield.low"], ["Shield"], (260, 70, 12), uv=lambda slot: 0.45 if slot == 2 else 1.0,
         extrusion=0.02, ray=0.045, ao_alone=True),
    Part("sword", ["Sword_long.low"], ["Sword_long"], (None, 24, 4), uv=0.7, extrusion=0.006, ray=0.015,
         ao_alone=True),
    # Variant shapes (T-061): the beards (celt_beard), on a horseman's budget; not at LOD2.
    Part("beard_short", ["Beard_short"], ["Beard_short"], (156, 20, 0), uv=1.4, extrusion=0.006, ray=0.012,
         ao_alone=True),
    Part("beard_full", ["Beard_full"], ["Beard_full"], (228, 29, 0), uv=1.4, extrusion=0.008, ray=0.016,
         ao_alone=True),
]

LOD2 = dict(
    own=("shield", "sword"),
    body=("head", "hair", "torso", "tunic", "arms", "legs", "girdle", "cloak"),
    trunk="tunic",
    skirt=None,
    head="head",
    feet=False,
)


# -- each man his own look (T-061) --------------------------------------------
#
# The Gallic foot's (celt_looks), with the tunic and the cloak: Diodorus
# 5.30.1, tunics dyed in every colour and cloaks of many-coloured checks.
# The horse (cavalry_looks): its coat; the saddle cloth keeps its colours
# (no slot left).

srgb, ONE = whp_look.srgb, whp_look.ONE
_horse_slots, _horse_parts, _horse_materials = cavalry_looks.horse()
LOOKS = whp_look.Looks(
    slots=[
        whp_look.Slot("hair", "tint", celt_looks.HAIR),
        whp_look.Slot("skin", "tint", celt_looks.SKIN),
        whp_look.Slot("trousers", "dye", celt_looks.TROUSERS),
        whp_look.Slot("tunic", "dye", [(3, srgb(69, 115, 60)), (2, srgb(140, 56, 42)), (2, srgb(70, 86, 120)),
                                       (1, srgb(168, 138, 70)), (1, srgb(112, 86, 60)), (1, srgb(192, 182, 152))]),
        whp_look.Slot("cloak", "tint", [(3, ONE), (2, (1.35, 0.85, 0.65)), (2, (0.75, 1.15, 0.80)),
                                        (1, (1.25, 1.20, 0.75)), (1, (0.62, 0.62, 0.68))]),
        whp_look.Slot("shield", "dye", celt_looks.SHIELD),
        *_horse_slots,
    ],
    parts={"head": ("hair", "skin"), "hair": ("hair", None), "torso": ("skin", None), "arms": ("skin", None),
           "legs": ("trousers", "skin"), "tunic": ("tunic", None), "cloak": ("cloak", None),
           "shield": ("shield", None), "beard_short": ("hair", None), "beard_full": ("hair", None), **_horse_parts},
    materials={"Celt_Head": celt_looks.head_dye, "Celt_Body": "skin", "Celt_Hands": "skin",
               "Celt_Legs": celt_looks.legs_dye, "whp-hair": "hair", "whp-tunic": "tunic", "whp-cloak": "cloak",
               "whp-shield-paint": "shield", **_horse_materials},
    # Diodorus 5.28.3: some shave, some let the beard grow a little; the nobles keep only the moustache.
    variants=[whp_look.Variants("beard", [(5, None), (3, "beard_short"), (2, "beard_full")])],
    designs=celt_looks.DESIGNS,
)


def before_lod():
    """The beards (celt_beard), in the hair's own material."""
    celt_beard.build("Celt_head", material=bpy.data.materials["whp-hair"])


# -- review images (render_review.py) -----------------------------------------

REVIEW = ["views", "three-quarter", "lods", "animations", "beside", "beside-cavalry", "far-cavalry"]
BESIDE = "roman-legionary"
HORSEMEN = ["iberian-gallic-cavalry", "gallic-cavalry", "roman-cavalry"]     # beside-cavalry, far-cavalry
