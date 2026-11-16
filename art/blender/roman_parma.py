"""The velites' round shield (parma), generated.

Polybius 6.22.2: "a buckler strongly made and sufficient in size to protect
the man, being circular and three feet in diameter". A shallow dished
board, about 0.9 m across, with a bound rim, a small iron boss over the
fist and a horizontal grip behind it.

Built in the shield frame of roman_shield (u across, v along the "length",
w out of the face, origin the middle of the grip; finished-model metres)
so that roman_shield.place puts it in the left fist and
roman_shield.axes_in_source gives its axes. Material slots as the scutum's:
0 painted face, 1 iron rim, 2 wood, 3 iron boss.
"""

import math

from whp_mesh import Builder, recalc_normals

RADIUS = 0.45               # three Roman feet across
DISH = 0.045                # the rim lies this far behind the centre of the face
THICKNESS = 0.012
FACE_W = 0.038              # face at the centre, in front of the grip axis
RIM_WIDTH = 0.020
BOSS_RADIUS = 0.065
BOSS_HEIGHT = 0.038
GRIP_RADIUS = 0.014
GRIP_LENGTH = 0.18


def _face_w(r):
    return FACE_W - DISH * (r / RADIUS) ** 2


def build(detail, materials, name="Parma"):
    mats = [materials["shield"], materials["iron"], materials["wood"], materials["iron"]]
    b = Builder()
    segments = {0: 16, 1: 24, 2: 64}[detail]
    fractions = {0: [0.4, 0.75, 1.0], 1: [0.3, 0.6, 0.85, 1.0],
                 2: [BOSS_RADIUS / RADIUS] + [i / 12 for i in range(2, 12)] + [1.0 - RIM_WIDTH / RADIUS, 1.0]}[detail]
    if detail < 2:
        fractions = [BOSS_RADIUS / RADIUS] + fractions

    def ring(r, back):
        row = []
        for i in range(segments):
            a = 2.0 * math.pi * (i + 0.5) / segments
            w = _face_w(r) - (THICKNESS if back else 0.0)
            row.append(b.vert((r * math.cos(a), r * math.sin(a), w)))
        return row

    front = [ring(f * RADIUS, False) for f in fractions]
    back = [ring(f * RADIUS, True) for f in fractions]
    rim_from = len(fractions) - 2 if detail == 2 else len(fractions) - 1
    for k in range(len(fractions) - 1):
        slot = 1 if k >= rim_from else 0
        b.grid([front[k], front[k + 1]], slot=slot, close_u=True)
        b.grid([back[k + 1], back[k]], slot=1 if k >= rim_from else 2, close_u=True)
    b.grid([front[-1], back[-1]], slot=1, close_u=True)   # the bound edge
    # Back of the boss: wood fills the middle behind the fist.
    b.fan(b.vert((0.0, 0.0, _face_w(0.0) - THICKNESS)), back[0], slot=2, flip=True)

    # Iron boss: a low dome over the middle of the face.
    rows = [front[0]]
    steps = {0: 2, 1: 3, 2: 6}[detail]
    for k in range(1, steps):
        t = k / steps
        r = BOSS_RADIUS * math.cos(t * math.pi / 2)
        h = BOSS_HEIGHT * math.sin(t * math.pi / 2)
        row = []
        for i in range(segments):
            a = 2.0 * math.pi * (i + 0.5) / segments
            row.append(b.vert((r * math.cos(a), r * math.sin(a), _face_w(r) + h)))
        rows.append(row)
    b.grid(rows, slot=3, close_u=True)
    b.fan(b.vert((0.0, 0.0, _face_w(0.0) + BOSS_HEIGHT)), rows[-1], slot=3)

    # Horizontal grip (along u) behind the boss, on two short posts.
    sides = {0: 4, 1: 6, 2: 10}[detail]
    back_w = _face_w(0.0) - THICKNESS
    for sign in (-1.0, 1.0):
        u = sign * GRIP_LENGTH / 2
        post = [b.vert((u + 0.008 * math.cos(2 * math.pi * k / 4), 0.008 * math.sin(2 * math.pi * k / 4), w))
                for w in (0.0, back_w) for k in range(4)]
        b.grid([post[:4], post[4:]], slot=2, close_u=True)
    rows = []
    for u in (-GRIP_LENGTH / 2, GRIP_LENGTH / 2):
        rows.append([b.vert((u, GRIP_RADIUS * math.cos(2 * math.pi * k / sides),
                             GRIP_RADIUS * math.sin(2 * math.pi * k / sides))) for k in range(sides)])
    b.grid(rows, slot=2, close_u=True)
    for row, u, flip in ((rows[0], -GRIP_LENGTH / 2, True), (rows[1], GRIP_LENGTH / 2, False)):
        b.fan(b.vert((u, 0.0, 0.0)), row, slot=2, flip=flip)
    obj = b.object(name, mats, smooth=detail > 0)
    recalc_normals(obj)
    return obj
