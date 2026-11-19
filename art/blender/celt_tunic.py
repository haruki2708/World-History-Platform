"""A dyed tunic for the Gallic horseman (T-050), under the cloak.

Diodorus 5.30.1: the Gauls wear striking clothing, shirts dyed and
embroidered in varied colours, and breeches; Strabo 4.4.3: instead of
tunics, slit tunics with sleeves, reaching to the private parts and the
buttocks; 4.4.5: their men of rank wear garments dyed in colours. Diodorus
5.30.3 (Oldfather): "some of them gather up their shirts with belts plated
with gold or silver". So: a tunic with sleeves to the elbow and a skirt to
the top of the thighs, over the trousers, belted at the waist (a plain
leather belt: the plating is left out); green, with a yellow
border at the neck, the sleeves and the hem. Green is a choice: the
sources say only "varied colours". It is what the cloak's two dyes, woad
and weld, give together, and it is neither the Iberians' white nor the
Romans' red, nor the cloak's blue, so the rider seen from the front reads
as a Gaul from far away too. The border stands for the embroidery.

Built standing, in the rig's rest pose, round the Celt's body as the cloak
is (celt_cloak.surface): a tube round the trunk from the neckline to the
hem, a little off the skin, coming in under the chest more slowly than the
body does, drawn in at the belt, flaring a little over the hips; a tube
round each upper arm from inside the shoulder to above the elbow. One layer
of cloth: from the inside it is not drawn. On the horse the skirt is drawn
in to the seated thighs as the other riders' tunics are (whp_cavalry,
SKIRTS). Its skin weights are the body's, sampled as for any garment.
"""

import math

import bpy
import numpy as np

import celt_cloak
from celt_cloak import profile
from whp_common import log
from whp_mesh import Builder, get_coords, set_coords, smoothstep

TUNIC = dict(
    centre_y=0.035,
    top_back=1.405,             # the neckline at the back
    top_front=1.348,            # and in front, under the torc
    hem=0.760,                  # to the top of the thighs (Strabo 4.4.3)
    clear=0.009,                # off the skin
    flare=0.022,                # more at the hem
    drape=0.35,                 # metres it comes in a metre down (under the chest)
    cinch=(0.945, 1.000),       # drawn in to the body by the belt
    arms=(1.30, 0.215, 0.245),  # body points further out than [1] below z [0], [2] above, are the arms
    band=0.012,
    bin=math.radians(7.0),
)
GRID = {2: (36, 24), 0: (18, 12)}           # round, down: detailed and the game copy
ROW_POWER = 1.5                             # rows closer at the top (over the shoulders)
# Upper arm, from the shoulder joint to the elbow (finished metres, the rig's
# rest pose: heads of upperarm_l and lowerarm_l; the right one mirrored).
SHOULDER = (0.194, 0.066, 1.338)
ELBOW = (0.363, 0.073, 1.172)
SLEEVE = dict(start=-0.12, end=0.78, clear=0.010, flare=0.014, reach=0.10, slab=0.012)
SLEEVE_GRID = {2: (14, 9), 0: (8, 5)}
BORDER = 0.035                              # metres of yellow at the neck, the sleeves' ends and the hem
GIRDLE = dict(z=(0.952, 0.988), clear=0.005, sides={2: 36, 0: 14})

GREEN = (0.060, 0.170, 0.045)               # woad and weld
GREEN_DARK = (0.035, 0.105, 0.028)
YELLOW = (0.420, 0.300, 0.050)              # weld, as the cloak's checks
YELLOW_DARK = (0.300, 0.200, 0.030)


def _rows(top, hem, rows):
    return top + (hem - top) * (np.arange(rows) / (rows - 1)) ** ROW_POWER


def trunk(points, columns, rows, c=TUNIC):
    """The tube round the trunk: (rows, columns, 3) finished metres, closed
    round (column 0 at the middle of the back, turning to the figure's left)."""
    grid = np.zeros((rows, columns, 3))
    for j in range(columns):
        phi = 2.0 * math.pi * j / columns
        phi = phi - 2.0 * math.pi if phi > math.pi else phi
        front = (1.0 - math.cos(phi)) / 2.0
        top = c["top_back"] + (c["top_front"] - c["top_back"]) * front ** 1.5
        widest, last = 0.0, top
        for i, z in enumerate(_rows(top, c["hem"], rows)):
            arms_x = c["arms"][2] if z > c["arms"][0] else c["arms"][1]
            raw = profile(points, phi, z, dict(c, arms_x=arms_x)) + c["clear"]
            if c["cinch"][0] <= z <= c["cinch"][1]:
                widest = raw
            else:
                widest = max(widest - c["drape"] * (last - z), raw)
            last = z
            r = widest + c["flare"] * float(smoothstep(c["cinch"][0], c["hem"], z))
            grid[i, j] = (r * math.sin(phi), c["centre_y"] + r * math.cos(phi), z)
    return grid


def sleeve(points, side, columns, rows, s=SLEEVE):
    """A tube round the upper arm `side` (+1 left, -1 right): rows from
    inside the shoulder to above the elbow, each ring off the arm's own
    surface (the body's points near the axis) by s["clear"]."""
    a0 = np.array(SHOULDER) * (side, 1.0, 1.0)
    a1 = np.array(ELBOW) * (side, 1.0, 1.0)
    axis = a1 - a0
    length = np.linalg.norm(axis)
    axis /= length
    ref = np.array((0.0, -1.0, 0.0))
    u = ref - ref.dot(axis) * axis
    u /= np.linalg.norm(u)
    v = np.cross(axis, u)
    arm = points[points[:, 0] * side > 0.12]
    rel = arm - a0
    along = rel @ axis
    radial = rel - along[:, None] * axis
    dist = np.linalg.norm(radial, axis=1)
    angle = np.arctan2(radial @ v, radial @ u)
    psis = 2.0 * math.pi * np.arange(columns) / columns
    ts = np.linspace(s["start"], s["end"], rows)
    radii = np.full((rows, columns), np.nan)
    for i, t in enumerate(ts):
        near = (np.abs(along - t * length) < s["slab"]) & (dist < s["reach"])
        for j, psi in enumerate(psis):
            d = (angle[near] - psi + math.pi) % (2.0 * math.pi) - math.pi
            pick = np.abs(d) < math.pi / columns * 1.5
            if pick.any():
                radii[i, j] = dist[near][pick].max()
    # Rings without points (inside the shoulder): as the nearest ring that has them.
    for j in range(columns):
        column = radii[:, j]
        good = np.flatnonzero(~np.isnan(column))
        if not len(good):
            column[:] = 0.06
            continue
        for i in range(rows):
            if np.isnan(column[i]):
                column[i] = column[good[np.argmin(np.abs(good - i))]]
    grid = np.zeros((rows, columns, 3))
    for i, t in enumerate(ts):
        flare = s["flare"] * float(smoothstep(0.4, 1.0, t / s["end"]))
        for j, psi in enumerate(psis):
            r = radii[i, j] + s["clear"] + flare
            grid[i, j] = a0 + axis * t * length + (u * math.cos(psi) + v * math.sin(psi)) * r
    return grid


def _add_tube(b, grid, border_rows):
    """Faces of a closed tube; slot 1 (the border) for the quads in `border_rows`."""
    rows = [[b.vert(p) for p in row] for row in grid]
    b.grid(rows, close_u=True, slot_fn=lambda r, _c: 1 if r in border_rows else 0)


def _border(grid, top, bottom):
    """Row indices (of quads) within BORDER metres of the top or bottom edge
    (measured down the middle column)."""
    mid = grid[:, grid.shape[1] // 2]
    s = np.concatenate([[0.0], np.cumsum(np.linalg.norm(np.diff(mid, axis=0), axis=1))])
    quads = (s[:-1] + s[1:]) / 2
    rows = set()
    if top:
        rows |= set(np.flatnonzero(quads < BORDER).tolist())
    if bottom:
        rows |= set(np.flatnonzero(quads > s[-1] - BORDER).tolist())
    return rows


def build(detail, materials, name="Tunic"):
    """The tunic: the trunk and two sleeves, one layer of cloth. Slots: 0
    the green wool, 1 the yellow border."""
    points = celt_cloak.body_points(("Celt_body", "Celt_belt", "Celt_legs"))
    columns, rows = GRID[detail]
    body = trunk(points, columns, rows)
    b = Builder()
    _add_tube(b, body, _border(body, True, True))
    sc, sr = SLEEVE_GRID[detail]
    for side in (1.0, -1.0):
        arm = sleeve(points, side, sc, sr)
        _add_tube(b, arm, _border(arm, False, True))
    obj = b.object(name, [materials["tunic"], materials["tunic-border"]], smooth=True)
    set_coords(obj, celt_cloak.to_celt(get_coords(obj)))
    log(f"{name}: {len(obj.data.polygons)} faces; hem {body[-1, :, 2].min():.3f} m, neckline "
        f"{body[0, :, 2].min():.3f}..{body[0, :, 2].max():.3f} m")
    return obj


def build_girdle(detail, materials, name="Girdle"):
    """A leather belt round the tunic at the waist."""
    tunic = celt_cloak.to_finished(get_coords(bpy.data.objects["Tunic"]))
    sides = GIRDLE["sides"][detail]
    b = Builder()
    rings = []
    for z in GIRDLE["z"]:
        ring = []
        for k in range(sides):
            phi = 2.0 * math.pi * k / sides
            phi = phi - 2.0 * math.pi if phi > math.pi else phi
            r = profile(tunic, phi, z, dict(TUNIC, arms_x=0.3, band=0.02, bin=math.radians(9.0))) + GIRDLE["clear"]
            ring.append(b.vert((r * math.sin(phi), TUNIC["centre_y"] + r * math.cos(phi), z)))
        rings.append(ring)
    b.grid(rings[::-1], close_u=True)            # top ring first: the faces look outwards
    obj = b.object(name, [materials["leather"]], smooth=True)
    set_coords(obj, celt_cloak.to_celt(get_coords(obj)))
    return obj


def materials():
    """(short name, maker) pairs for roman_kit.materials."""
    import whp_materials

    return [("tunic", lambda: whp_materials.plain("tunic", GREEN, GREEN_DARK, roughness=0.85, scale=60.0, bump=0.25)),
            ("tunic-border", lambda: whp_materials.plain("tunic-border", YELLOW, YELLOW_DARK, roughness=0.8,
                                                         scale=90.0, bump=0.2))]
