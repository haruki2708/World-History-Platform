"""Montefortino helmet, generated.

Bronze bowl of rounded-conical shape drawn up into a crest knob, a narrow
thickened rim that widens into a short neck guard at the back, and two
scalloped cheek pieces hung from the rim. Crest: three upright feathers
(Polybius 6.23.12). Built around the head of the source model, in its
T-pose space: Z up, the face towards -Y.

`detail` 0 is the game mesh, 2 the smooth one the textures are baked from.
"""

import math

import numpy as np

from whp_mesh import Builder

# Fit to the head of the source model.
CENTER = (0.0, 0.0255)        # x, y of the skull's middle at the rim
RADIUS = (0.100, 0.127)       # half width, half length at the rim
RIM_Z = 1.748                 # just above the brows and ears
BOWL_HEIGHT = 0.128
KNOB_HEIGHT = 0.034

# Bowl profile: (height fraction, radius fraction).
BOWL = [
    (0.00, 1.000), (0.08, 0.996), (0.18, 0.975), (0.30, 0.930), (0.42, 0.868),
    (0.54, 0.788), (0.65, 0.692), (0.75, 0.580), (0.84, 0.456), (0.91, 0.340),
    (0.96, 0.240), (1.00, 0.150),
]
BOWL_LOW = [0, 2, 4, 6, 8, 10, 11]
# Knob profile above the bowl: (height in metres, radius in metres).
KNOB = [(0.006, 0.0135), (0.013, 0.0185), (0.021, 0.0200), (0.028, 0.0150), (0.034, 0.0)]
KNOB_LOW = [1, 3, 4]

NECK_GUARD_OUT = 0.034
NECK_GUARD_DROP = 0.016

SEGMENTS = {0: 18, 1: 24, 2: 56}


def _interp(points, x):
    """Smooth (Catmull-Rom) interpolation through (x, y) control points."""
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    if x <= xs[0]:
        return ys[0]
    if x >= xs[-1]:
        return ys[-1]
    i = max(j for j in range(len(xs) - 1) if xs[j] <= x)
    t = (x - xs[i]) / (xs[i + 1] - xs[i])
    p0 = ys[max(i - 1, 0)]
    p1, p2 = ys[i], ys[i + 1]
    p3 = ys[min(i + 2, len(ys) - 1)]
    return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t
                  + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3)


def _guard(angle):
    """1 at the back of the head (+Y), fading to 0 towards the sides."""
    off = abs(math.atan2(math.sin(angle - math.pi / 2), math.cos(angle - math.pi / 2)))
    t = min(max((math.radians(82) - off) / math.radians(50), 0.0), 1.0)
    return t * t * (3 - 2 * t)


def _ring(builder, segments, z, fraction=1.0, offset=0.0, guard_out=0.0, guard_drop=0.0, radius=None):
    ring = []
    for i in range(segments):
        a = 2 * math.pi * (i + 0.5) / segments
        g = _guard(a)
        if radius is None:
            rx = RADIUS[0] * fraction + offset + guard_out * g
            ry = RADIUS[1] * fraction + offset + guard_out * g
        else:
            rx, ry = radius, radius * 1.08
        ring.append(builder.vert((CENTER[0] + rx * math.cos(a), CENTER[1] + ry * math.sin(a), z - guard_drop * g)))
    return ring


def build_bowl(detail, materials, name="Helmet"):
    b = Builder()
    segments = SEGMENTS[detail]
    rows = []
    # Inside lip, underside of the rim, outer edge of the rim, top of the rim.
    if detail > 0:
        rows.append(_ring(b, segments, RIM_Z - 0.004, offset=-0.004))
    rows.append(_ring(b, segments, RIM_Z - 0.010, offset=-0.001, guard_out=NECK_GUARD_OUT * 0.9, guard_drop=NECK_GUARD_DROP))
    rows.append(_ring(b, segments, RIM_Z - 0.008, offset=0.0045, guard_out=NECK_GUARD_OUT, guard_drop=NECK_GUARD_DROP))
    rows.append(_ring(b, segments, RIM_Z + 0.001, offset=0.0045, guard_out=NECK_GUARD_OUT * 0.25, guard_drop=NECK_GUARD_DROP * 0.2))
    bowl = BOWL if detail > 0 else [BOWL[i] for i in BOWL_LOW]
    if detail == 2:
        bowl = [(t, _interp(BOWL, t)) for t in np.linspace(0.0, 1.0, 26)]
    for t, fraction in bowl:
        rows.append(_ring(b, segments, RIM_Z + 0.004 + (BOWL_HEIGHT - 0.004) * t, fraction))
    knob = KNOB if detail > 0 else [KNOB[i] for i in KNOB_LOW]
    top = RIM_Z + BOWL_HEIGHT
    for height, radius in knob[:-1]:
        rows.append(_ring(b, segments, top + height, radius=radius))
    b.grid(rows, close_u=True)
    apex = b.vert((CENTER[0], CENTER[1], top + knob[-1][0]))
    b.fan(apex, rows[-1])
    return b.object(name, [materials["bronze"]])


# Cheek piece outline: depth below the rim -> position along the rim
# (metres; negative towards the face). Scallops for the eye and the mouth.
CHEEK_FRONT = [(0.0, -0.046), (0.020, -0.050), (0.045, -0.036), (0.075, -0.052),
               (0.108, -0.036), (0.128, -0.036), (0.146, -0.022), (0.152, -0.010)]
CHEEK_BACK = [(0.0, 0.036), (0.025, 0.036), (0.065, 0.029), (0.105, 0.023),
              (0.135, 0.012), (0.152, 0.0)]
CHEEK_DEPTH = 0.152
CHEEK_ANGLE = math.radians(-27.0)   # where the middle of the hinge sits: 0 is the side, -90 the face
CHEEK_RADIUS = (0.0935, 0.119)      # surface the cheek pieces follow at the rim
CHEEK_TAPER = 0.75                  # how much that surface narrows per metre going down
CHEEK_THICKNESS = 0.0025


def build_cheeks(detail, materials, name="Helmet_cheeks"):
    b = Builder()
    # 12 rows at game resolution: fewer cut the corners of the scallops,
    # and the bake then misses the detailed piece along them.
    rows_n = {0: 12, 1: 12, 2: 24}[detail]
    cols_n = {0: 3, 1: 4, 2: 10}[detail]
    for side in (1, -1):
        layers = []
        for layer, inset in enumerate((0.0, CHEEK_THICKNESS)):
            rows = []
            for r in range(rows_n + 1):
                depth = CHEEK_DEPTH * r / rows_n
                front = _interp(CHEEK_FRONT, depth)
                back = _interp(CHEEK_BACK, depth)
                taper = 1.0 - CHEEK_TAPER * depth
                rx = CHEEK_RADIUS[0] * taper - inset
                ry = CHEEK_RADIUS[1] * taper - inset
                row = []
                for c in range(cols_n + 1):
                    along = front + (back - front) * c / cols_n
                    angle = CHEEK_ANGLE + along / ((rx + ry) / 2)
                    x = CENTER[0] + rx * math.cos(angle)
                    y = CENTER[1] + ry * math.sin(angle)
                    row.append(b.vert((x * side, y, RIM_Z - 0.006 - depth)))
                rows.append(row)
            layers.append(rows)
        outer, inner = layers
        flip = side < 0
        b.grid(outer, flip=not flip)
        b.grid(inner, flip=flip)
        # Close the edge all the way round.
        loop_outer = outer[0] + [row[-1] for row in outer[1:]] + outer[-1][-2::-1] + [row[0] for row in outer[-2:0:-1]]
        loop_inner = inner[0] + [row[-1] for row in inner[1:]] + inner[-1][-2::-1] + [row[0] for row in inner[-2:0:-1]]
        b.grid([loop_outer, loop_inner], close_u=True, flip=not flip)
    return b.object(name, [materials["bronze"]])


FEATHER_LENGTH = 0.40        # "about a cubit" at the finished model's size
FEATHER_WIDTH = 0.040
# Lean of each feather from upright: (sideways, backwards), degrees.
FEATHER_LEANS = [(0.0, 4.0), (15.0, 9.0), (-15.0, 9.0)]
FEATHER_SHAPE = [(0.0, 0.10), (0.06, 0.16), (0.16, 0.62), (0.30, 0.92), (0.50, 1.0),
                 (0.72, 0.90), (0.88, 0.62), (0.96, 0.34), (1.0, 0.06)]


def build_crest(detail, materials, scale=1.0, name="Helmet_crest"):
    """Three upright feathers on the knob. `scale` converts finished-model
    metres into the source model's space."""
    b = Builder()
    rows_n = {0: 5, 1: 8, 2: 18}[detail]
    base = (CENTER[0], CENTER[1], RIM_Z + BOWL_HEIGHT + KNOB_HEIGHT - 0.012)
    length = FEATHER_LENGTH * scale
    width = FEATHER_WIDTH * scale
    for side_lean, back_lean in FEATHER_LEANS:
        ls, lb = math.radians(side_lean), math.radians(back_lean)
        front, back = [], []
        for r in range(rows_n + 1):
            t = r / rows_n
            half = width / 2 * _interp(FEATHER_SHAPE, t)
            # The feather curls back a little towards its tip.
            curl = 0.06 * length * t * t
            thick = 0.004 * (1.0 - t) + 0.0012
            row_front, row_back = [], []
            for u, bulge in ((-1.0, 0.0), (0.0, 1.0), (1.0, 0.0)):
                px = u * half
                pz = length * t
                for row, sign in ((row_front, -1.0), (row_back, 1.0)):
                    py = curl + sign * thick * bulge
                    # Lean sideways (about Y), then backwards (about X).
                    x = px * math.cos(ls) + pz * math.sin(ls)
                    z = -px * math.sin(ls) + pz * math.cos(ls)
                    y = py * math.cos(lb) + z * math.sin(lb)
                    z = -py * math.sin(lb) + z * math.cos(lb)
                    row.append(b.vert((base[0] + x, base[1] + y, base[2] + z)))
            front.append(row_front)
            back.append(row_back)
        b.grid(front)
        b.grid(back, flip=True)
    return b.object(name, [materials["feather"]])
