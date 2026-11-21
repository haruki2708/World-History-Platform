"""Each man his own look (T-061) for the horsemen: the horse's coat and the
saddle cloth, slots added to the rider's.

Horses are not bred to one colour, whatever the army: a block of horsemen
rides bays, browns and chestnuts, and a few blacks, greys and duns (no
source gives the shares). The coat's mask keeps the black lower legs and
the dark muzzle of the model's bay (horse_kit.coat_colours) and dyes the
rest; mane and tail stay black. The saddle cloth's wool is dyed in shades
of the model's colour; its border keeps its own (whp_look.woven_border, on
an attribute marked here).
"""

import numpy as np

import whp_look

srgb = whp_look.srgb

COAT = [(4, srgb(108, 63, 36)),         # bay, the model's
        (3, srgb(72, 44, 30)),          # dark bay, brown
        (2, srgb(128, 66, 34)),         # chestnut
        (1, srgb(150, 96, 56)),         # light chestnut
        (1, srgb(36, 31, 28)),          # black
        (1, srgb(150, 146, 140)),       # grey
        (1, srgb(158, 128, 88))]        # dun
# The red of the coat's colour attribute: the bay about 0.15 (its belly
# 0.215); the black points 0.02 and the muzzle 0.05 stay below.
COAT_RED = (0.07, 0.11)


def coat_dye(tree, bsdf, node):
    """The horse's coat: the bay is the primary slot; the black lower legs
    and the dark muzzle keep their colour."""
    import horse_kit
    attr = node("ShaderNodeVertexColor")
    attr.layer_name = horse_kit.COAT_ATTR
    rgb = node("ShaderNodeSeparateColor")
    tree.links.new(attr.outputs["Color"], rgb.inputs["Color"])
    ramp = node("ShaderNodeMapRange")
    ramp.inputs["From Min"].default_value, ramp.inputs["From Max"].default_value = COAT_RED
    ramp.clamp = True
    tree.links.new(rgb.outputs["Red"], ramp.inputs["Value"])
    return ramp.outputs["Result"]




def mark_cloth_border(cloth, border):
    """The attribute whp_border on the saddle cloth (1 where its colour
    attribute holds the border's colour `border`, linear), for the cloth's
    dye mask."""
    import horse_kit
    me = cloth.data
    colours = np.empty(len(me.vertices) * 4, dtype=np.float32)
    me.attributes[horse_kit.COAT_ATTR].data.foreach_get("color", colours)
    colours = colours.reshape(-1, 4)[:, :3]
    near = np.abs(colours - np.array(border, dtype=np.float32)).max(axis=1) < 0.004
    attr = me.color_attributes.get("whp_border") or me.color_attributes.new("whp_border", "FLOAT_COLOR", "POINT")
    values = np.repeat(near.astype(np.float32)[:, None], 4, axis=1)
    values[:, 3] = 1.0
    attr.data.foreach_set("color", values.ravel())
    return int(near.sum())


def horse(cloth=None):
    """The horse's slots, parts and materials, to add to the rider's: the
    coat, and the saddle cloth if `cloth` (its choices) is given."""
    slots = [whp_look.Slot("coat", "dye", COAT)]
    parts = {"body": ("coat", None)}
    materials = {"horse-coat": coat_dye}
    if cloth is not None:
        slots.append(whp_look.Slot("cloth", "dye", cloth))
        parts["cloth"] = ("cloth", None)
        materials["horse-wool"] = whp_look.woven_border(secondary=False)
    return slots, parts, materials
