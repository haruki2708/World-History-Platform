"""Republican scutum, generated.

A tall oval board curved about its long axis, with a wooden spine down the
middle that swells into a spindle-shaped boss, an iron boss plate over the
swelling, metal binding on the top and bottom edges and a horizontal grip
behind the boss (Polybius 6.23.2-5; the Kasr el-Harit shield).

The shield is built in its own frame, in finished-model metres:
u across the width, v along the length, w out of the face; the origin is
the middle of the grip. `place` then moves it into the left fist.
"""

import math

import numpy as np
from mathutils import Matrix, Vector

from whp_mesh import Builder, get_coords, set_coords

LENGTH = 1.20
WIDTH = 0.75
CURVE_RADIUS = 0.62       # the board is part of a cylinder of this radius
THICKNESS = 0.012
OVAL = 2.35               # superellipse exponent: 2 is an ellipse
GRIP_RADIUS = 0.014
GRIP_LENGTH = 0.20
GRIP_STANDOFF = 0.012     # gap between the grip and the back of the board

SPINE_HALF_WIDTH = 0.016
SPINE_HEIGHT = 0.014
SPINE_MARGIN = 0.045      # the spine stops short of the edges
BOSS_HALF_LENGTH = 0.150
BOSS_HALF_WIDTH = 0.058
BOSS_HEIGHT = 0.062       # hollow behind it takes the back of the hand

PLATE_HALF = (0.115, 0.080)   # iron boss plate: half width, half height
BINDING = 0.30            # top and bottom share of the length with metal binding
BINDING_WIDTH = 0.022

# Rotation about the grip, degrees: lifts the end towards the elbow so the
# board clears the forearm (the wrist bends by as much when it is carried).
TILT = 15.0


def _sag(u):
    """How far the face falls back from the centre line at u."""
    return CURVE_RADIUS - math.sqrt(CURVE_RADIUS ** 2 - u * u)


def _face_w(u):
    return GRIP_RADIUS + GRIP_STANDOFF + THICKNESS - _sag(u)


def _outline(angle):
    c, s = math.cos(angle), math.sin(angle)
    p = 2.0 / OVAL
    return (math.copysign(abs(c) ** p, c) * WIDTH / 2, math.copysign(abs(s) ** p, s) * LENGTH / 2)


def _boss(v):
    """0..1 swelling of the spine around the middle."""
    if abs(v) >= BOSS_HALF_LENGTH:
        return 0.0
    return math.cos(math.pi * v / (2 * BOSS_HALF_LENGTH)) ** 1.4


def _spine_half_width(v):
    return SPINE_HALF_WIDTH + (BOSS_HALF_WIDTH - SPINE_HALF_WIDTH) * _boss(v)


def _spine_height(v):
    end = LENGTH / 2 - SPINE_MARGIN
    taper = min(1.0, (end - abs(v)) / 0.06)
    return (SPINE_HEIGHT + (BOSS_HEIGHT - SPINE_HEIGHT) * _boss(v)) * max(taper, 0.0) ** 0.5


def _spine_w(u, v):
    half = _spine_half_width(v)
    if abs(u) >= half:
        return 0.0
    return _spine_height(v) * math.cos(math.pi * u / (2 * half)) ** 0.7


def build(detail, materials, name="Scutum"):
    """Slots: 0 painted face, 1 iron binding, 2 wood, 3 iron boss plate."""
    mats = [materials["shield"], materials["iron"], materials["wood"], materials["iron"]]
    b = Builder()
    segments = {0: 24, 1: 32, 2: 72}[detail]
    rings = {0: [0.45, 0.80, 1.0], 1: [0.3, 0.6, 0.85, 1.0], 2: [i / 14 for i in range(1, 15)]}[detail]
    if detail == 2:
        rings = rings[:-1] + [1.0 - BINDING_WIDTH / (WIDTH / 2), 1.0]

    def ring(r, back):
        row = []
        for i in range(segments):
            u, v = _outline(2 * math.pi * (i + 0.5) / segments)
            u, v = u * r, v * r
            w = _face_w(u) - (THICKNESS if back else 0.0)
            row.append(b.vert((u, v, w)))
        return row

    def bound(column):
        """Metal binding: the top and bottom ends of the edge only."""
        _, v = _outline(2 * math.pi * (column + 1.0) / segments)
        return abs(v) > (LENGTH / 2) * (1.0 - BINDING)

    front = [ring(r, False) for r in rings]
    back = [ring(r, True) for r in rings]
    last = len(rings) - 2

    def front_slot(r, c):
        return 1 if (detail == 2 and r == last and bound(c)) else 0

    def rim_slot(r, c):
        return 1 if bound(c) else 0

    centre_front = b.vert((0, 0, _face_w(0)))
    centre_back = b.vert((0, 0, _face_w(0) - THICKNESS))
    b.fan(centre_front, front[0])
    b.grid(front, slot_fn=front_slot, close_u=True, flip=True)
    b.fan(centre_back, back[0], slot=2, flip=True)
    b.grid(back, slot=2, close_u=True)
    b.grid([front[-1], back[-1]], slot_fn=rim_slot, close_u=True, flip=True)

    # Spine with the boss swelling, lying on the face.
    end = LENGTH / 2 - SPINE_MARGIN
    if detail == 0:
        stations = [-end, -0.34, -0.15, -0.08, 0.0, 0.08, 0.15, 0.34, end]
        across = [-1.0, 0.0, 1.0]
    else:
        n = 20 if detail == 1 else 64
        stations = sorted(set([-end + 2 * end * i / n for i in range(n + 1)]
                              + [BOSS_HALF_LENGTH * k / 6 for k in range(-6, 7)]))
        across = [-1.0, -0.6, 0.0, 0.6, 1.0] if detail == 1 else [i / 6 for i in range(-6, 7)]
    rows = []
    for v in stations:
        half = _spine_half_width(v)
        row = []
        for a in across:
            u = a * half
            lift = _spine_w(u, v) if abs(a) < 1.0 else -0.002
            row.append(b.vert((u, v, _face_w(u) + lift)))
        rows.append(row)
    in_plate = detail < 2

    def spine_slot(r, c):
        middle = (stations[r] + stations[r + 1]) / 2
        return 3 if (in_plate and abs(middle) < PLATE_HALF[1]) else 0

    b.grid(rows, slot_fn=spine_slot)

    # Grip: a bar across the hollow behind the boss.
    sides = 6 if detail == 0 else 12
    bar = []
    for u in (-GRIP_LENGTH / 2, GRIP_LENGTH / 2):
        bar.append([b.vert((u, GRIP_RADIUS * math.cos(2 * math.pi * i / sides),
                            GRIP_RADIUS * math.sin(2 * math.pi * i / sides))) for i in range(sides)])
    b.grid(bar, slot=2, close_u=True)

    if detail == 2:
        _boss_plate(b)
    obj = b.object(name, mats)
    return obj


def _boss_plate(b):
    """Iron plate over the boss: a rectangle with a dome, and four rivets."""
    nu, nv = 28, 20
    rows = []
    for j in range(nv + 1):
        v = -PLATE_HALF[1] + 2 * PLATE_HALF[1] * j / nv
        row = []
        for i in range(nu + 1):
            u = -PLATE_HALF[0] + 2 * PLATE_HALF[0] * i / nu
            edge = (i in (0, nu)) or (j in (0, nv))
            lift = -0.001 if edge else 0.004 + _spine_w(u, v) * 1.04
            row.append(b.vert((u, v, _face_w(u) + lift)))
        rows.append(row)
    b.grid(rows, slot=3)
    for su in (-1, 1):
        for sv in (-1, 1):
            cu, cv = su * (PLATE_HALF[0] - 0.016), sv * (PLATE_HALF[1] - 0.016)
            ring = []
            for i in range(8):
                a = 2 * math.pi * i / 8
                u, v = cu + 0.006 * math.cos(a), cv + 0.006 * math.sin(a)
                ring.append(b.vert((u, v, _face_w(u) + 0.004)))
            top = b.vert((cu, cv, _face_w(cu) + 0.009))
            b.fan(top, ring)


def place(obj, grip_point, scale):
    """Put the shield in the left fist of the T-posed source model.

    Frame of the fist: the grip runs front to back (Y), the arm along +X,
    the back of the hand faces up. The board lies over the back of the
    hand, its length along the arm. `scale` converts finished-model metres
    into the source model's space.
    """
    tilt = Matrix.Rotation(math.radians(TILT), 4, "Y")
    # u -> -Y, v -> +X, w -> +Z
    frame = Matrix(((0, 1, 0, 0), (-1, 0, 0, 0), (0, 0, 1, 0), (0, 0, 0, 1)))
    matrix = Matrix.Translation(Vector(grip_point)) @ tilt @ frame @ Matrix.Scale(scale, 4)
    co = get_coords(obj)
    m = np.array(matrix)
    co = co @ m[:3, :3].T + m[:3, 3]
    set_coords(obj, co)
    return obj


def axes_in_source():
    """Directions of a placed shield in the source model's space: along its
    length towards the end below the fist, and out of its face."""
    tilt = Matrix.Rotation(math.radians(TILT), 3, "Y")
    return tilt @ Vector((1.0, 0.0, 0.0)), tilt @ Vector((0.0, 0.0, 1.0))
