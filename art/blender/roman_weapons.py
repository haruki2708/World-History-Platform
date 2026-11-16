"""Weapons held instead of the drawn sword, and the sword put away.

The thrusting spear (hasta) of the triarii and the light javelins of the
velites (Polybius 6.22-23), built as turned shapes: a wooden shaft, an
iron head on a socket, an iron butt. One weapon goes in the right fist,
whose grip runs front to back (the T-posed source model's Y axis); spare
javelins stand upright in the left fist behind the shield, placed like the
pila (roman_armour). When the right hand holds a spear the sword goes back
into its scabbard on the right hip.

Built in the source model's space (metres, T pose, Z up, facing -Y);
sizes are given in finished-model metres and scaled by S.
"""

import math

import numpy as np
from mathutils import Vector

import roman_hands
import roman_shield
from roman_fit import FINAL_SCALE
from whp_common import log
from whp_mesh import Builder, get_coords, recalc_normals, set_coords

S = 1.0 / FINAL_SCALE           # finished metres -> source units


def _section(b, centre, across, out, half_w, half_t, sides):
    """A ring of vertices: round when half_w == half_t, otherwise a lens
    (a flattened blade with a midrib) across `across`."""
    ring = []
    for k in range(sides):
        a = 2.0 * math.pi * k / sides
        c, s = math.cos(a), math.sin(a)
        if half_w != half_t:
            # Lens: pointed at the edges, rounded over the midrib.
            s = math.copysign(abs(s) ** 0.8, s)
        ring.append(b.vert(centre + across * (half_w * c) + out * (half_t * s)))
    return ring


def _turned(b, base, axis, across, profile, sides, slot):
    """A shape along `axis` from `base`: profile [(t, half width, half
    thickness)], capped at both ends (a zero width ends in a point)."""
    out = axis.cross(across).normalized()
    rows, tips = [], {}
    for i, (t, hw, ht) in enumerate(profile):
        if hw <= 0.0:
            tips[i] = b.vert(base + axis * t)
        else:
            rows.append(_section(b, base + axis * t, across, out, hw, ht, sides))
    b.grid(rows, slot=slot, close_u=True)
    first = tips.get(0, b.vert(base + axis * profile[0][0]))
    last = tips.get(len(profile) - 1, b.vert(base + axis * profile[-1][0]))
    b.fan(first, rows[0], slot=slot, flip=True)
    b.fan(last, rows[-1], slot=slot)


# Finished-model metres, measured from the butt along the shaft.
HASTA = dict(
    length=2.30, grip=0.72,                 # the fist holds it 0.72 m from the butt
    butt=0.07, shaft_r=(0.0145, 0.0125),    # iron butt spike; shaft radius at the butt and at the head
    socket=0.09, socket_r=0.0145,
    blade=0.24, blade_w=0.027, blade_t=0.0055, widest=0.35,   # leaf-shaped head
)
# Polybius 6.22.4: shaft about two cubits, a finger thick; a slender iron
# head a span long, hammered so thin that it bends on striking.
JAVELIN = dict(
    length=1.10, grip=0.50,
    butt=0.0, shaft_r=(0.0095, 0.0090),
    socket=0.07, socket_r=0.0100,
    blade=0.15, blade_w=0.0075, blade_t=0.0035, widest=0.25,
)


def _weapon(b, spec, base, axis, across, detail):
    """One spear or javelin from `base` (its butt) along `axis`."""
    sides = {0: 4, 1: 6, 2: 12}[detail]
    L = spec["length"] * S
    butt, socket, blade = spec["butt"] * S, spec["socket"] * S, spec["blade"] * S
    r0, r1 = spec["shaft_r"][0] * S, spec["shaft_r"][1] * S
    head = L - blade - socket
    _turned(b, base, axis, across, [(butt * 0.6, r0, r0), (head + socket * 0.3, r1, r1)], sides, 0)
    rs = spec["socket_r"] * S
    hw, ht = spec["blade_w"] * S, spec["blade_t"] * S
    iron = [(head, rs, rs), (head + socket, rs * 0.75, rs * 0.75),
            (head + socket + blade * spec["widest"], hw, ht), (head + socket + blade * 0.8, hw * 0.45, ht * 0.7),
            (L, 0.0, 0.0)]
    _turned(b, base, axis, across, iron, sides if detail else 4, 1)
    if butt > 0.0:
        _turned(b, base, axis, across, [(0.0, 0.0, 0.0), (butt * 0.25, r0 * 0.7, r0 * 0.7), (butt, r0 * 1.05, r0 * 1.05)],
                sides, 1)


def build_right_hand(spec, detail, materials, name):
    """A spear or javelin through the right fist, point forwards. Slots: 0
    wood, 1 iron."""
    x, y, z = roman_hands.grip_axis_point(-1)
    axis = Vector((0.0, -1.0, 0.0))                     # butt -> point: forwards
    base = Vector((x, y + spec["grip"] * S, z))
    b = Builder()
    _weapon(b, spec, base, axis, Vector((0.0, 0.0, 1.0)), detail)
    obj = b.object(name, [materials["wood"], materials["iron"]], smooth=detail > 0)
    recalc_normals(obj)
    return obj


# Spare javelins upright in the left fist, behind the shield: (u, w, lean
# in degrees, how far the butt is below the grip), in the shield's frame.
SPARES = [(-0.014, -0.038, 0.0, 0.36), (0.012, -0.034, 3.0, 0.40), (0.030, -0.050, -2.0, 0.33)]


def build_spares(spec, detail, materials, name, count=3):
    """`count` spare javelins upright in the left fist. Slots: 0 wood, 1 iron."""
    b = Builder()
    for u, w, lean, below in SPARES[:count]:
        a = math.radians(lean)
        axis = Vector((math.sin(a), -math.cos(a), 0.0))   # up the shield's frame
        base = Vector((u, below, w))
        _weapon(b, spec, base * S, axis, Vector((0.0, 0.0, 1.0)), detail)
    obj = b.object(name, [materials["wood"], materials["iron"]], smooth=detail > 0)
    set_coords(obj, get_coords(obj) / S)           # back to finished metres for place()
    recalc_normals(obj)
    roman_shield.place(obj, roman_hands.grip_axis_point(1), S)
    return obj


def _main_axis(co):
    centred = co - co.mean(axis=0)
    return np.linalg.svd(centred, full_matrices=False)[2][0]


def sheathe(sword, scabbard, depth=0.012):
    """Put the drawn sword (as it lies in the source file, under the right
    palm) into the scabbard: along the scabbard's long axis, hilt up, the
    point `depth` (finished metres) above the scabbard's lower end. Both
    meshes in the source model's space."""
    sc, sw = get_coords(scabbard), get_coords(sword)
    up = _main_axis(sc)
    up = up if up[2] > 0 else -up                       # up the scabbard
    along = _main_axis(sw)
    handle = np.array(roman_hands.grip_axis_point(-1))  # where the palm holds the hilt
    t = (sw - sw.mean(axis=0)) @ along
    t_handle = float((handle - sw.mean(axis=0)) @ along)
    if abs(t.max() - t_handle) > abs(t.min() - t_handle):
        along = -along                                  # point (far from the palm) -> hilt
    v = np.cross(along, up)
    c = float(np.dot(along, up))
    k = np.array([[0.0, -v[2], v[1]], [v[2], 0.0, -v[0]], [-v[1], v[0], 0.0]])
    rot = np.eye(3) + k + k @ k / (1.0 + c)
    sw = (sw - sw.mean(axis=0)) @ rot.T
    tip = sw[np.argmin(sw @ up)]
    centre = sc.mean(axis=0)
    bottom = float(((sc - centre) @ up).min())
    sw += centre + up * (bottom + depth * S) - tip
    set_coords(sword, sw)
    log(f"sheathed {sword.name}: hilt top {sw[:, 2].max():.3f}, scabbard top {sc[:, 2].max():.3f} (source units)")
    return sword
