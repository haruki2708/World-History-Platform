"""Each man his own look (T-061) for the models on the Celt (gallic-infantry,
gallic-cavalry): the slots' choices and the dye masks of the Celt's own
textures.

Hannibal's men: strong variety (the user's choice, 2026-11-21). Diodorus
5.28.1-3: the Gauls' hair is blond, made lighter still with lime-water;
5.30.1-2: clothes dyed in every colour, striped; shields decorated each
in its own way.

Heights are given for a man on foot; a horseman's are moved by the lift of
his rest pose (whp_look.rider_lift), read when the masks are baked.
"""

import whp_look

srgb, ONE = whp_look.srgb, whp_look.ONE

HAIR = [(3, ONE), (2, (1.25, 1.20, 1.10)), (2, (0.82, 0.66, 0.50)), (2, (0.95, 0.55, 0.36)), (1, (0.55, 0.42, 0.33))]
SKIN = [(3, ONE), (2, (0.92, 0.86, 0.81)), (2, (1.06, 1.00, 0.96)), (2, (0.84, 0.74, 0.65)), (1, (1.03, 0.92, 0.88))]
TROUSERS = [(2, srgb(168, 138, 70)), (2, srgb(70, 86, 120)), (2, srgb(80, 100, 66)), (2, srgb(140, 56, 42)),
            (1, srgb(192, 182, 152)), (1, srgb(112, 86, 60))]
SHIELD = [(2, srgb(70, 86, 118)), (2, srgb(140, 58, 44)), (2, srgb(80, 98, 66)), (1, srgb(186, 178, 150)),
          (1, srgb(124, 92, 62)), (1, srgb(44, 42, 40))]
DESIGNS = whp_look.Designs(
    "shield",
    [(2, None), (1, "rim"), (1, "band"), (1, "cross"), (1, "rings"), (2, "triskele"), (1, "lunettes"), (1, "diagonal")],
    [(1, srgb(222, 212, 186)), (1, srgb(172, 58, 40)), (1, srgb(206, 164, 72)), (1, srgb(30, 30, 30)),
     (1, srgb(56, 76, 124))])

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


def head_dye(tree, bsdf, node):
    """The head's texture: the blond (hair, brows, moustache) above the neck
    is the hair, the primary slot; the rest the skin, the secondary. The
    gold torc is metal."""
    low = HAIR_LOW + whp_look.rider_lift()[2]
    hsv = _texture_hsv(tree, bsdf, node)
    hue = _times(tree, node, _ramp(tree, node, hsv.outputs["Red"], HAIR_HUE[0] - 0.01, HAIR_HUE[0] + 0.01),
                 _ramp(tree, node, hsv.outputs["Red"], HAIR_HUE[1] - 0.02, HAIR_HUE[1] + 0.02, (1.0, 0.0)))
    sat = _ramp(tree, node, hsv.outputs["Green"], HAIR_SATURATION - 0.04, HAIR_SATURATION + 0.04)
    val = _ramp(tree, node, hsv.outputs["Blue"], HAIR_VALUE - 0.04, HAIR_VALUE + 0.04)
    high = _ramp(tree, node, _height(tree, node), low - 0.01, low + 0.01)
    hair = _times(tree, node, _times(tree, node, hue, sat), _times(tree, node, val, high))
    red = node("ShaderNodeMath")                # 0.5 + 0.5 hair
    red.operation = "MULTIPLY_ADD"
    tree.links.new(hair, red.inputs[0])
    red.inputs[1].default_value = whp_look.PRIMARY - whp_look.SECONDARY
    red.inputs[2].default_value = whp_look.SECONDARY
    return red.outputs["Value"]


def is_hair(h, s, v):
    return HAIR_HUE[0] < h < HAIR_HUE[1] and s > HAIR_SATURATION and v > HAIR_VALUE


def legs_dye(tree, bsdf, node):
    """The legs: the trousers, primary; the bare feet (skin-coloured texels
    low on the leg), secondary."""
    top = FEET_TOP + whp_look.rider_lift()[2]
    hsv = _texture_hsv(tree, bsdf, node)
    hue = _ramp(tree, node, hsv.outputs["Red"], SKIN_HUE - 0.01, SKIN_HUE + 0.01, (1.0, 0.0))
    sat = _times(tree, node, _ramp(tree, node, hsv.outputs["Green"], SKIN_SATURATION[0] - 0.03, SKIN_SATURATION[0] + 0.03),
                 _ramp(tree, node, hsv.outputs["Green"], SKIN_SATURATION[1] - 0.03, SKIN_SATURATION[1] + 0.03, (1.0, 0.0)))
    val = _ramp(tree, node, hsv.outputs["Blue"], SKIN_VALUE - 0.04, SKIN_VALUE + 0.04)
    low = _ramp(tree, node, _height(tree, node), top - 0.01, top + 0.01, (1.0, 0.0))
    skin = _times(tree, node, _times(tree, node, hue, sat), _times(tree, node, val, low))
    red = node("ShaderNodeMath")                # 1 - 0.5 skin
    red.operation = "MULTIPLY_ADD"
    tree.links.new(skin, red.inputs[0])
    red.inputs[1].default_value = whp_look.SECONDARY - whp_look.PRIMARY
    red.inputs[2].default_value = whp_look.PRIMARY
    return red.outputs["Value"]
