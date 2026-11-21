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
    Part("beard_short", ["Beard_short"], ["Beard_short"], (260, 50, 0), uv=1.4, extrusion=0.006, ray=0.012,
         ao_alone=True),
    Part("beard_full", ["Beard_full"], ["Beard_full"], (380, 70, 0), uv=1.4, extrusion=0.008, ray=0.016,
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
# Hannibal's men: strong variety (the user's choice, 2026-11-21). Diodorus
# 5.28.1-3: the Gauls' hair is blond, made lighter still with lime-water;
# 5.30.1-2: clothes dyed in every colour, striped; shields decorated each
# in its own way. Polybius 3.114.4: naked above the waist at Cannae.

HAIR_HUE = (0.05, 0.20)         # hue of the texture's blond (sRGB), not of the skin (about 0.03)
HAIR_SATURATION = 0.28
HAIR_VALUE = 0.22
HAIR_LOW = 1.49                 # metres: nothing below (the neck)
# The bare feet: skin-coloured texels of the legs below the trousers. The
# cuffs mix trouser and skin texels between 0.07 and 0.15 m, so the height
# alone cannot tell them apart (measured on the texture, T-061).
SKIN_HUE = 0.08                 # sRGB hue below this (the skin is about 0.03; the trousers' yellow 0.12)
SKIN_SATURATION = (0.20, 0.62)  # the trousers' dark red stripes are more saturated, and darker
SKIN_VALUE = 0.45
FEET_TOP = 0.16                 # metres: no skin above this on the legs


def _ramp(tree, node, socket, lo, hi, to=(0.0, 1.0)):
    r = node("ShaderNodeMapRange")
    r.inputs["From Min"].default_value, r.inputs["From Max"].default_value = lo, hi
    r.inputs["To Min"].default_value, r.inputs["To Max"].default_value = to
    r.clamp = True
    tree.links.new(socket, r.inputs["Value"])
    return r.outputs["Result"]


def _times(tree, node, a, b):
    m = node("ShaderNodeMath")
    m.operation = "MULTIPLY"
    tree.links.new(a, m.inputs[0])
    tree.links.new(b, m.inputs[1])
    return m.outputs["Value"]


def _height(tree, node):
    geo = node("ShaderNodeNewGeometry")
    xyz = node("ShaderNodeSeparateXYZ")
    tree.links.new(geo.outputs["Position"], xyz.inputs["Vector"])
    return xyz.outputs["Z"]


def _texture_hsv(tree, bsdf, node):
    """Hue, saturation and value of the material's texture, sRGB-like (the
    thresholds above are read that way)."""
    gamma = node("ShaderNodeGamma")
    gamma.inputs["Gamma"].default_value = 1.0 / 2.2
    tree.links.new(bsdf.inputs["Base Color"].links[0].from_socket, gamma.inputs["Color"])
    hsv = node("ShaderNodeSeparateColor")
    hsv.mode = "HSV"
    tree.links.new(gamma.outputs["Color"], hsv.inputs["Color"])
    return hsv


def _head_dye(tree, bsdf, node):
    """The head's texture: the blond (hair, brows, moustache) above the neck
    is the hair, the primary slot; the rest the skin, the secondary. The
    gold torc is metal."""
    hsv = _texture_hsv(tree, bsdf, node)
    hue = _times(tree, node, _ramp(tree, node, hsv.outputs["Red"], HAIR_HUE[0] - 0.01, HAIR_HUE[0] + 0.01),
                 _ramp(tree, node, hsv.outputs["Red"], HAIR_HUE[1] - 0.02, HAIR_HUE[1] + 0.02, (1.0, 0.0)))
    sat = _ramp(tree, node, hsv.outputs["Green"], HAIR_SATURATION - 0.04, HAIR_SATURATION + 0.04)
    val = _ramp(tree, node, hsv.outputs["Blue"], HAIR_VALUE - 0.04, HAIR_VALUE + 0.04)
    high = _ramp(tree, node, _height(tree, node), HAIR_LOW - 0.01, HAIR_LOW + 0.01)
    hair = _times(tree, node, _times(tree, node, hue, sat), _times(tree, node, val, high))
    red = node("ShaderNodeMath")                # 0.5 + 0.5 hair
    red.operation = "MULTIPLY_ADD"
    tree.links.new(hair, red.inputs[0])
    red.inputs[1].default_value = whp_look.PRIMARY - whp_look.SECONDARY
    red.inputs[2].default_value = whp_look.SECONDARY
    return red.outputs["Value"]


def _is_hair(h, s, v):
    return HAIR_HUE[0] < h < HAIR_HUE[1] and s > HAIR_SATURATION and v > HAIR_VALUE


def before_lod():
    """The beards (celt_beard), on the rigged head, in the colour of its hair."""
    head = bpy.data.objects["Celt_head"]
    celt_beard.build("Celt_head", celt_beard.hair_colour(head, _is_hair, HAIR_LOW))


def _legs_dye(tree, bsdf, node):
    """The legs: the trousers, primary; the bare feet (skin-coloured texels
    low on the leg), secondary."""
    hsv = _texture_hsv(tree, bsdf, node)
    hue = _ramp(tree, node, hsv.outputs["Red"], SKIN_HUE - 0.01, SKIN_HUE + 0.01, (1.0, 0.0))
    sat = _times(tree, node, _ramp(tree, node, hsv.outputs["Green"], SKIN_SATURATION[0] - 0.03, SKIN_SATURATION[0] + 0.03),
                 _ramp(tree, node, hsv.outputs["Green"], SKIN_SATURATION[1] - 0.03, SKIN_SATURATION[1] + 0.03, (1.0, 0.0)))
    val = _ramp(tree, node, hsv.outputs["Blue"], SKIN_VALUE - 0.04, SKIN_VALUE + 0.04)
    low = _ramp(tree, node, _height(tree, node), FEET_TOP - 0.01, FEET_TOP + 0.01, (1.0, 0.0))
    skin = _times(tree, node, _times(tree, node, hue, sat), _times(tree, node, val, low))
    red = node("ShaderNodeMath")                # 1 - 0.5 skin
    red.operation = "MULTIPLY_ADD"
    tree.links.new(skin, red.inputs[0])
    red.inputs[1].default_value = whp_look.SECONDARY - whp_look.PRIMARY
    red.inputs[2].default_value = whp_look.PRIMARY
    return red.outputs["Value"]


srgb, ONE = whp_look.srgb, whp_look.ONE
LOOKS = whp_look.Looks(
    slots=[
        whp_look.Slot("hair", "tint", [(3, ONE), (2, (1.25, 1.20, 1.10)), (2, (0.82, 0.66, 0.50)),
                                       (2, (0.95, 0.55, 0.36)), (1, (0.55, 0.42, 0.33))]),
        whp_look.Slot("skin", "tint", [(3, ONE), (2, (0.92, 0.86, 0.81)), (2, (1.06, 1.00, 0.96)),
                                       (2, (0.84, 0.74, 0.65)), (1, (1.03, 0.92, 0.88))]),
        whp_look.Slot("trousers", "dye", [(2, srgb(168, 138, 70)), (2, srgb(70, 86, 120)), (2, srgb(80, 100, 66)),
                                          (2, srgb(140, 56, 42)), (1, srgb(192, 182, 152)), (1, srgb(112, 86, 60))]),
        whp_look.Slot("shield", "dye", [(2, srgb(70, 86, 118)), (2, srgb(140, 58, 44)), (2, srgb(80, 98, 66)),
                                        (1, srgb(186, 178, 150)), (1, srgb(124, 92, 62)), (1, srgb(44, 42, 40))]),
    ],
    parts={"head": ("hair", "skin"), "torso": ("skin", None), "arms": ("skin", None),
           "legs": ("trousers", "skin"), "shield": ("shield", None),
           "beard_short": ("hair", None), "beard_full": ("hair", None)},
    materials={"Celt_Head": _head_dye, "Celt_Body": "skin", "Celt_Hands": "skin", "Celt_Legs": _legs_dye,
               "whp-shield-paint": "shield", "whp-beard": "hair"},
    # Diodorus 5.28.3: some shave, some let the beard grow a little; the nobles keep only the moustache.
    variants=[whp_look.Variants("beard", [(5, None), (3, "beard_short"), (2, "beard_full")])],
    designs=whp_look.Designs(
        "shield",
        [(2, None), (1, "rim"), (1, "band"), (1, "cross"), (1, "rings"), (2, "triskele"), (1, "lunettes"),
         (1, "diagonal")],
        [(1, srgb(222, 212, 186)), (1, srgb(172, 58, 40)), (1, srgb(206, 164, 72)), (1, srgb(30, 30, 30)),
         (1, srgb(56, 76, 124))]),
)


# -- review images (render_review.py) -----------------------------------------

REVIEW = ["views", "three-quarter", "head", "formation", "lods", "animations", "beside", "test-poses"]
BESIDE = "roman-legionary"
