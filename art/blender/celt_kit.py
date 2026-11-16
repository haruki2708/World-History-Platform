"""The Gaul's kit: a long slashing sword and the long oval shield.

Polybius 2.30 and 2.33, 3.114.3: the Gaulish sword cuts only, with a long
swing, and has no point; the shields of the Gauls and the Iberians were
very alike (roman_shield.OVAL_SHIELD). Both replace the Celt model's own
round shield and short sword, put where his fists hold those: the shield
takes the old one's axes and the left fist as its grip; the sword the old
one's line, its grip in the right fist.

Built in finished-model metres in each piece's own frame, then carried
into the Celt's space (larger by 1 / RIG_SCALE).
"""

import math

import bpy
import numpy as np
from mathutils import Vector

import roman_shield
import roman_weapons
from whp_common import delete_objects, log
from whp_mesh import Builder, get_coords, recalc_normals, set_coords
from whp_skeleton import RIG_SCALE

SCALE = 1.0 / RIG_SCALE                 # finished metres -> the Celt's space
FIST_X = 0.70                           # arm vertices beyond this |x| are the hand


def _axes(co):
    centred = co - co.mean(axis=0)
    return np.linalg.svd(centred, full_matrices=False)[2]


def _fist(side):
    co = get_coords(bpy.data.objects["Celt_arms"])
    hand = co[co[:, 0] * side > FIST_X]
    return hand.mean(axis=0)


def _place(obj, origin, u, v, w):
    """Carry obj from its own frame (finished metres) into the Celt's space."""
    frame = np.stack([u, v, w], axis=1)
    set_coords(obj, origin + (get_coords(obj) * SCALE) @ frame.T)


def shield_frame():
    """Origin (the left fist) and axes (across, down its length, out of its
    face) of the Celt's own shield."""
    co = get_coords(bpy.data.objects["Ref_Shield"])
    e = _axes(co)
    down = e[0] if e[0][2] < 0 else -e[0]
    centre = co.mean(axis=0)
    out = e[2] if np.dot(e[2], np.array((centre[0], 0.0, 0.0))) > 0 else -e[2]
    across = np.cross(down, out)
    return _fist(1), across, down, out


def build_shield(detail, materials, name="Shield"):
    with roman_shield.variant(**roman_shield.OVAL_SHIELD):
        obj = roman_shield.build(detail, materials, name)
    origin, u, v, w = shield_frame()
    _place(obj, origin, u, v, w)
    obj["whp_down"] = [float(x) for x in v]
    obj["whp_out"] = [float(x) for x in w]
    return obj


# Finished metres along the sword from the middle of the grip.
GRIP_HALF = 0.050
POMMEL = 0.035
GUARD = 0.014
BLADE = 0.78
BLADE_HALF_WIDTH = (0.025, 0.021)       # at the guard, before the rounded end
BLADE_HALF_THICKNESS = 0.0035


def build_sword(detail, materials, name="Sword_long"):
    """La Tene long sword: wooden grip with a knob, a small guard, a long
    parallel-sided blade with a rounded end (no point). Slots: 0 wood, 1 iron."""
    sides = {0: 4, 1: 6, 2: 10}[detail]
    b = Builder()
    axis, across, base = Vector((0.0, 1.0, 0.0)), Vector((1.0, 0.0, 0.0)), Vector((0.0, 0.0, 0.0))
    g, p = GRIP_HALF, POMMEL
    roman_weapons._turned(b, base, axis, across,
                          [(-g - p, 0.0, 0.0), (-g - p * 0.85, 0.014, 0.014), (-g - p * 0.4, 0.019, 0.019),
                           (-g, 0.013, 0.013), (g, 0.013, 0.013), (g + 0.004, 0.0, 0.0)], sides, 0)
    roman_weapons._turned(b, base, axis, across,
                          [(g, 0.031, 0.011), (g + GUARD, 0.029, 0.010)], sides, 1)
    start = g + GUARD
    end = start + BLADE
    r = BLADE_HALF_WIDTH[1]
    t = BLADE_HALF_THICKNESS
    blade = [(start, BLADE_HALF_WIDTH[0], t), (end - r, r, t)]
    steps = {0: 2, 1: 3, 2: 6}[detail]
    for k in range(1, steps):
        a = math.pi / 2 * k / steps
        blade.append((end - r + r * math.sin(a), r * math.cos(a), t * math.cos(a) ** 0.5))
    blade.append((end, 0.0, 0.0))
    roman_weapons._turned(b, base, axis, across, blade, 8 if detail else 4, 1)
    obj = b.object(name, [materials["wood"], materials["iron"]], smooth=detail > 0)
    recalc_normals(obj)

    ref = get_coords(bpy.data.objects["Ref_Sword"])
    e = _axes(ref)
    fist = _fist(-1)
    along = e[0]
    t_ref = (ref - fist) @ along
    if abs(t_ref.min()) > abs(t_ref.max()):
        along = -along                      # from the fist towards the far end
    flat = e[1] - along * np.dot(e[1], along)
    flat /= np.linalg.norm(flat)
    centre = ref.mean(axis=0)
    grip = centre + along * np.dot(fist - centre, along)
    _place(obj, grip, flat, along, np.cross(flat, along))
    return obj


def drop_references():
    delete_objects([bpy.data.objects[n] for n in ("Ref_Shield", "Ref_Sword")])
    log("removed the Celt's own shield and sword")
