"""Beards for the Gauls (T-061): the shapes of whp_beard over the Celt's head.

Diodorus 5.28.3: of the Gauls, some shave the beard and others let it grow
a little; the nobles shave the cheeks but let the moustache grow until it
covers the mouth. The Celt model has the moustache (in the head's texture),
so the mouth, the moustache and the nose stay bare.
"""

import whp_beard

# Finished metres at rest (Celt_head: the chin's underside at about z 1.425,
# the lower lip 1.465, the nose tip 1.512 at y -0.110; the head faces -Y).
_BARE = [(0.042, 1.458, 9.0, -0.066)]       # the mouth, the moustache and the nose
SHAPES = {
    "Beard_short": dict(low=1.418, high=1.490, back=-0.012, offset=0.0035, bare=_BARE),
    "Beard_full": dict(low=1.395, high=1.505, back=0.000, offset=0.0075, bare=_BARE),
}


def build(head_name, colour=None, material=None, avoid=()):
    """The beards over the Celt's head, in `material` (a model's own hair)
    or a new one of `colour` (linear)."""
    return whp_beard.build(head_name, SHAPES, colour, avoid, material)


def hair_colour(head, is_hair, low):
    return whp_beard.hair_colour(head, is_hair, low)
