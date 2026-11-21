"""Beards over the Roman source head (T-061): the shapes of whp_beard over
New_head, in finished metres at rest, and their Parts for the stage lod.

Pliny, Natural History 7.211 (and Varro, On Agriculture 2.11.10): barbers
first came to Rome from Sicily in 300 BC, and Scipio Africanus (born 236)
was the first to shave every day. In the years of Trasimene and Cannae many
Italians still wore the beard; a model gives the share in its LOOKS.

Heads with a helmet pass its cheek pieces (and the collar of mail or
tunic) as `avoid`: the beard shows at the chin, under the jaw and on the
lip, and stops short of the bronze.
"""

import whp_beard
from whp_unit_lod import Part

# New_head (finished metres, T-061): the chin's underside from z 1.39 (y
# -0.028) to 1.41 (y -0.069), the chin's front about y -0.073 from 1.41 to
# 1.45, the mouth about 1.44-1.46, the nose tip 1.487 at y -0.096; the jaw
# about 0.057 to 0.063 m either side of the middle.
SHAPES = {
    # A short beard, no moustache: the mouth and all above it in front stay bare.
    "Beard_short": dict(low=1.392, high=1.468, back=-0.004, offset=0.003,
                        bare=[(0.040, 1.436, 9.0, -0.062)]),
    # A full beard with a moustache: only the lips and the nose stay bare.
    "Beard_full": dict(low=1.384, high=1.482, back=0.008, offset=0.0065,
                       bare=[(0.027, 1.437, 1.457, -0.066), (0.035, 1.466, 9.0, -0.070)]),
}
HEAD = "New_head"
DARK_BROWN = (0.070, 0.048, 0.030)      # linear; the slot's choices recolour it


# Variant shapes: drawn only on the men who drew them; not at LOD2 (left
# out of the model's LOD2 lists).
PARTS = [
    Part("beard_short", ["Beard_short"], ["Beard_short"], (300, 34, 0), uv=1.4, extrusion=0.006, ray=0.012,
         ao_alone=True),
    Part("beard_full", ["Beard_full"], ["Beard_full"], (420, 48, 0), uv=1.4, extrusion=0.008, ray=0.016,
         ao_alone=True),
]


def parts(*names, scale=1.0):
    """The Parts of the beards `names` (all if none), their budgets times
    `scale` (a horseman's smaller figure)."""
    out = []
    for p in PARTS:
        if names and p.name not in names:
            continue
        if scale != 1.0:
            p = Part(p.name, p.low, p.bake, tuple(int(round(b * scale)) for b in p.budget), uv=p.uv,
                     extrusion=p.extrusion, ray=p.ray, ao_alone=p.ao_alone)
        out.append(p)
    return out


def build(avoid=(), colour=DARK_BROWN, material=None, names=()):
    """The beards `names` (part names; all if none), short of `avoid`, in
    `material` (a model's own hair) or a new one of `colour`."""
    shapes = {k: v for k, v in SHAPES.items() if not names or k.lower() in names}
    return whp_beard.build(HEAD, shapes, colour, avoid, material)
