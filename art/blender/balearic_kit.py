"""The Balearic slinger's kit: three slings and a bag of stones.

Diodorus 5.18.3: "their equipment for fighting consists of three slings;
they keep one around the head, another around the belly, and the third in
the hands". Strabo 3.5.1: slings of black rush, hair or sinew.

The sling in the hand is not rigid. Its two cords run from the right fist
to the pouch; the pouch and stone follow a bone of the rig that no other
part uses (ik_hand_gun), and the cords are weighted from the hand (at the
fist) to that bone (at the pouch), so they stretch between the two. The
clips place the bone where the stone is: hanging below the hand, whirling
round above the head, flung forwards (whp_clips.Sling). The fraction along
the cord is kept on the mesh as the point attribute SLING_T.

Built in the source model's space (metres, T pose, Z up, facing -Y).
"""

import math

import bpy
import numpy as np

import roman_hands
import roman_helmet
import roman_mail
from roman_fit import FINAL_SCALE
from whp_common import log
from whp_mesh import Builder, get_coords, recalc_normals

S = 1.0 / FINAL_SCALE
SLING_T = "whp_sling_t"
SLING_BONE = "ik_hand_gun"
SLING_LENGTH = 0.62           # finished metres, fist to pouch
CORD_RADIUS = 0.0035
POUCH = (0.030, 0.012, 0.042)   # half sizes of the pouch: across, thickness, along the cord
STONE_RADIUS = 0.020


def _tube(b, a, z_points, radius, sides, slot, x_of):
    rows = []
    for z in z_points:
        cx = x_of(z)
        rows.append([b.vert((cx + radius * math.cos(2 * math.pi * k / sides), a[1] + radius * math.sin(2 * math.pi * k / sides), z))
                     for k in range(sides)])
    b.grid(rows, slot=slot, close_u=True)


def _blob(b, centre, half, slot, rings=4, sides=8):
    """A closed ellipsoid."""
    cx, cy, cz = centre
    rows = []
    for i in range(1, rings):
        phi = math.pi * i / rings
        rows.append([b.vert((cx + half[0] * math.sin(phi) * math.cos(2 * math.pi * k / sides),
                             cy + half[1] * math.sin(phi) * math.sin(2 * math.pi * k / sides),
                             cz + half[2] * math.cos(phi))) for k in range(sides)])
    b.grid(rows, slot=slot, close_u=True)
    b.fan(b.vert((cx, cy, cz + half[2])), rows[0], slot=slot, flip=True)
    b.fan(b.vert((cx, cy, cz - half[2])), rows[-1], slot=slot)


def build_sling(detail, materials, name="Sling"):
    """The sling in the right fist, hanging straight down at rest. Slots: 0
    cord, 1 stone."""
    gx, gy, gz = roman_hands.grip_axis_point(-1)
    length = SLING_LENGTH * S
    pz = gz - length
    sides = 4 if detail == 0 else 6
    steps = {0: 4, 1: 6, 2: 16}[detail]
    b = Builder()
    pouch_half = tuple(h * S for h in POUCH)
    for side in (-1.0, 1.0):
        # Each cord leaves the fist and spreads to its side of the pouch.
        def x_of(z, side=side):
            t = max(gz - z, 0.0) / length
            return gx + side * pouch_half[0] * 0.9 * t ** 1.5
        zs = [gz + 0.01 * S - (length - pouch_half[2] * 0.5) * k / steps for k in range(steps + 1)]
        _tube(b, (gx, gy, gz), zs, CORD_RADIUS * S, sides, 0, x_of)
    _blob(b, (gx, gy, pz), pouch_half, 0, rings=3 if detail == 0 else 5, sides=6 if detail == 0 else 10)
    _blob(b, (gx, gy - pouch_half[1] * 0.6, pz), (STONE_RADIUS * S,) * 3, 1,
          rings=3 if detail == 0 else 5, sides=6 if detail == 0 else 10)
    obj = b.object(name, [materials["cord"], materials["stone"]], smooth=detail > 0)
    recalc_normals(obj)
    co = get_coords(obj)
    t = np.clip((gz - co[:, 2]) / (length - pouch_half[2]), 0.0, 1.0)
    attr = obj.data.attributes.new(SLING_T, "FLOAT", "POINT")
    attr.data.foreach_set("value", t.astype(np.float32))
    return obj


def sling_weights(obj, names):
    """Weights of the hand sling once it is in the rig's space: from the hand
    at the fist to SLING_BONE at the pouch. Returns (vertices, bones)."""
    t = np.empty(len(obj.data.vertices), dtype=np.float32)
    obj.data.attributes[SLING_T].data.foreach_get("value", t)
    weights = np.zeros((len(t), len(names)))
    weights[:, names.index("hand_r")] = 1.0 - t
    weights[:, names.index(SLING_BONE)] = t
    return weights


def build_head_sling(detail, materials, name="Head_sling"):
    """The second sling wound twice round the head, over the brow."""
    b = Builder()
    segments = {0: 14, 1: 20, 2: 48}[detail]
    sides = 4 if detail == 0 else 6
    for turn, (dz, extra) in enumerate(((-0.006, 0.006), (0.004, 0.008))):
        z = roman_helmet.RIM_Z - 0.035 + dz
        rings = []
        for i in range(segments):
            a = 2 * math.pi * i / segments
            # Round the skull a little below the helmet rim.
            rx = roman_helmet.RADIUS[0] * 0.97 + extra
            ry = roman_helmet.RADIUS[1] * 0.93 + extra
            c = np.array((roman_helmet.CENTER[0] + rx * math.cos(a), roman_helmet.CENTER[1] + ry * math.sin(a), z))
            out = np.array((math.cos(a), math.sin(a), 0.0))
            rings.append([b.vert(c + CORD_RADIUS * S * 1.2 * (out * math.cos(2 * math.pi * k / sides)
                                                            + np.array((0, 0, 1.0)) * math.sin(2 * math.pi * k / sides)))
                          for k in range(sides)])
        rings.append(rings[0])
        b.grid(rings, close_u=True)
    obj = b.object(name, [materials["cord"]], smooth=detail > 0)
    recalc_normals(obj)
    return obj


def build_belly_sling(tunic, materials, name="Belly_sling"):
    """The third sling wound round the belly, in place of a belt."""
    mats = dict(materials, leather=materials["cord"], bronze=materials["cord"])
    return roman_mail.build_belt(tunic, mats, name)


BAG = dict(centre=(0.205, 0.035, 0.955), half=(0.040, 0.060, 0.075))   # source units: outside the left hip


def build_bag(detail, materials, name="Stone_bag"):
    """A leather bag of stones hanging at the left hip."""
    b = Builder()
    rings, sides = (3, 6) if detail == 0 else (6, 12)
    _blob(b, BAG["centre"], BAG["half"], 0, rings=rings, sides=sides)
    obj = b.object(name, [materials["leather"]], smooth=detail > 0)
    recalc_normals(obj)
    log(f"{name}: {len(obj.data.polygons)} faces")
    return obj
