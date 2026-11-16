"""The hastatus' kit, generated: chest plate and its straps, greaves, pila.

Polybius 6.23 (Paton's translation): the mass of the hastati wear "a brass
plate a span square, which they place in front of the heart and call the
heart-protector" (pectorale) instead of mail, bronze greaves, and carry two
pila, "some stout and some fine": the stout ones round, a palm across, or a
palm square; the fine ones like moderate hunting spears. The wooden haft is
about three cubits; the barbed iron head is as long, fastened half way up
the haft with many rivets.

Everything is built in the source model's space (T pose, Z up, facing -Y)
except the pila, built in the shield's frame and placed with it in the left
fist. Lengths given in finished-model metres are divided by FINAL_SCALE.
"""

import math

import bmesh
import bpy
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

import roman_hands
import roman_shield
from roman_fit import FINAL_SCALE
from whp_common import link_object, log
from whp_mesh import Builder, canonicalise, get_coords, recalc_normals

S = 1.0 / FINAL_SCALE           # finished metres -> source units


def _tree(obj):
    mesh = obj.data
    return BVHTree.FromPolygons([v.co.copy() for v in mesh.vertices], [list(p.vertices) for p in mesh.polygons])


# --------------------------------------------------------------------------
# Chest plate (pectorale)
# --------------------------------------------------------------------------

PLATE_SIZE = 0.22 * S           # "a span square"
PLATE_CENTRE = (0.0, 1.365)     # x, z on the chest: over the breastbone, at the heart
PLATE_GAP = 0.010               # clear of the tunic everywhere
PLATE_THICKNESS = 0.0025 * S
RIM_WIDTH = 0.012 * S
RIM_LIFT = 0.004 * S
BOSS_RADIUS = 0.045 * S         # a raised roundel in the middle
BOSS_LIFT = 0.010 * S


def _chest_surface(tunic):
    """A smooth surface y(x, z) just in front of the tunic around the plate:
    a quadratic fitted to the tunic's front, moved forwards until the
    tunic is at least PLATE_GAP behind it everywhere under the plate."""
    tree = _tree(tunic)
    half = PLATE_SIZE / 2 + 0.01
    xs, zs, ys = [], [], []
    for i in range(9):
        for j in range(9):
            x = PLATE_CENTRE[0] - half + 2 * half * i / 8
            z = PLATE_CENTRE[1] - half + 2 * half * j / 8
            hit = tree.ray_cast(Vector((x, -0.6, z)), Vector((0.0, 1.0, 0.0)))
            if hit[0] is not None:
                xs.append(x - PLATE_CENTRE[0])
                zs.append(z - PLATE_CENTRE[1])
                ys.append(hit[0].y)
    x, z, y = np.array(xs), np.array(zs), np.array(ys)
    a = np.column_stack((np.ones_like(x), x, z, x * x, x * z, z * z))
    coef = np.linalg.lstsq(a, y, rcond=None)[0]
    shift = float(np.max(a @ coef - y)) + PLATE_GAP

    def surface(u, v):
        return float(np.dot((1.0, u, v, u * u, u * v, v * v), coef)) - shift

    return surface


def build_pectorale(tunic, detail, materials, name="Pectorale"):
    """Square bronze plate over the heart: slightly curved to the chest,
    a rolled rim and a raised roundel. Slot 0 bronze."""
    surface = _chest_surface(tunic)
    # The low plate keeps the rim and the roundel, coarsely, so the bake
    # from the detailed plate finds the surface it expects everywhere.
    n = {0: 8, 1: 10, 2: 28}[detail]
    half = PLATE_SIZE / 2
    b = Builder()

    def lift(u, v):
        edge = min(half - abs(u), half - abs(v))
        rim = RIM_LIFT * max(0.0, 1.0 - abs(edge - RIM_WIDTH / 2) / (RIM_WIDTH / 2)) ** 0.6 if edge < RIM_WIDTH else 0.0
        r = math.hypot(u, v)
        boss = BOSS_LIFT * math.cos(min(r / BOSS_RADIUS, 1.0) * math.pi / 2) ** 1.5
        return rim + boss

    front, back = [], []
    for j in range(n + 1):
        v = -half + 2 * half * j / n
        f_row, b_row = [], []
        for i in range(n + 1):
            u = -half + 2 * half * i / n
            y = surface(u, v)
            x, z = PLATE_CENTRE[0] + u, PLATE_CENTRE[1] + v
            f_row.append(b.vert((x, y - lift(u, v), z)))
            b_row.append(b.vert((x, y + PLATE_THICKNESS, z)))
        front.append(f_row)
        back.append(b_row)
    b.grid(front, flip=True)
    b.grid(back)
    # The edge all round, front to back.
    ring_f = front[0] + [row[-1] for row in front[1:]] + front[-1][-2::-1] + [row[0] for row in front[-2:0:-1]]
    ring_b = back[0] + [row[-1] for row in back[1:]] + back[-1][-2::-1] + [row[0] for row in back[-2:0:-1]]
    b.grid([ring_f, ring_b], close_u=True)
    obj = b.object(name, [materials["bronze"]], smooth=detail > 0)
    recalc_normals(obj)
    return obj


# --------------------------------------------------------------------------
# Straps: shells cut out of the tunic, as roman_mail does for the mail
# --------------------------------------------------------------------------

STRAP_WIDTH = 0.028 * S
STRAP_X = 0.105                 # middle of the shoulder straps
STRAP_BACK_Z = 1.25             # the shoulder straps run down the back to here
# The band round the chest: just under the plate's lower edge, 5 mm behind it.
BAND_Z = (PLATE_CENTRE[1] - PLATE_SIZE / 2 + 0.005 - STRAP_WIDTH, PLATE_CENTRE[1] - PLATE_SIZE / 2 + 0.005)
STRAP_FRONT_Z = PLATE_CENTRE[1] + PLATE_SIZE / 2 - 0.02   # the shoulder straps start under the plate's top edge
STRAP_OFFSET = 0.006
TORSO_Y = 0.03


def _in_straps(x, y, z):
    ax = abs(x)
    if abs(ax - STRAP_X) < STRAP_WIDTH / 2 and ax < 0.2:
        if y < TORSO_Y:
            return z > STRAP_FRONT_Z
        return z > STRAP_BACK_Z
    return BAND_Z[0] < z < BAND_Z[1] and ax < 0.2


def build_straps(tunic, materials, name="Pectorale_straps"):
    """Leather straps that hold the plate: one over each shoulder, down the
    back to a band that goes round the chest at the plate's lower edge."""
    bm = bmesh.new()
    bm.from_mesh(tunic.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.normal_update()
    outward = sum(f.normal.dot(Vector((f.calc_center_median().x, f.calc_center_median().y - TORSO_Y, 0.0)))
                  for f in bm.faces if abs(f.calc_center_median().x) < 0.2)
    if outward < 0:
        bmesh.ops.reverse_faces(bm, faces=bm.faces)
    planes = []
    for side in (1, -1):
        for x in (STRAP_X - STRAP_WIDTH / 2, STRAP_X + STRAP_WIDTH / 2):
            planes.append(((x * side, 0, 0), (1, 0, 0)))
    for z in (STRAP_BACK_Z, STRAP_FRONT_Z, *BAND_Z):
        planes.append(((0, 0, z), (0, 0, 1)))
    planes.append(((0, TORSO_Y, 0), (0, 1, 0)))
    for co, no in planes:
        geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
        bmesh.ops.bisect_plane(bm, geom=geom, dist=1e-5, plane_co=co, plane_no=no)
    gone = [f for f in bm.faces if not _in_straps(*f.calc_center_median())]
    bmesh.ops.delete(bm, geom=gone, context="FACES")
    inner = [v for v in bm.verts if not v.is_boundary]
    for _ in range(4):
        bmesh.ops.smooth_vert(bm, verts=inner, factor=0.5, use_axis_x=True, use_axis_y=True, use_axis_z=True)
    bm.normal_update()
    normals = {v: v.normal.copy() for v in bm.verts}
    for f in bm.faces:
        f.smooth = True
    border = [e for e in bm.edges if e.is_boundary]
    bmesh.ops.extrude_edge_only(bm, edges=border)
    for v, normal in normals.items():
        v.co += normal * STRAP_OFFSET
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    mesh.materials.append(materials["leather"])
    obj = canonicalise(link_object(bpy.data.objects.new(name, mesh)))
    log(f"{name}: {len(mesh.polygons)} faces")
    return obj


# --------------------------------------------------------------------------
# Greaves
# --------------------------------------------------------------------------

GREAVE_Z = (0.135, 0.455)       # from above the ankle bone to below the knee
GREAVE_WRAP = 125.0             # degrees round from the front on either side
GREAVE_GAP = 0.006 * S          # clear of the leg and the sandal straps
GREAVE_THICKNESS = 0.0025 * S
GREAVE_RIM = 0.004 * S


def _leg_envelope(points, z_levels, angles, centre_of):
    """Radius of the outer surface of a leg (and what is strapped to it)
    round its own centre line, per height and angle: the largest radius
    of the points near each height in each angle bin, smoothed."""
    radii = np.zeros((len(z_levels), len(angles)))
    width = 2 * math.pi / len(angles) * 1.5
    for i, z in enumerate(z_levels):
        near = points[np.abs(points[:, 2] - z) < 0.012]
        cx, cy = centre_of(z)
        d = near[:, :2] - (cx, cy)
        r = np.hypot(d[:, 0], d[:, 1])
        a = np.arctan2(d[:, 0], -d[:, 1])           # 0 at the front (-Y), positive outwards for the left leg
        for k, angle in enumerate(angles):
            diff = np.abs((a - angle + math.pi) % (2 * math.pi) - math.pi)
            sel = r[diff < width / 2]
            radii[i, k] = sel.max() if len(sel) else 0.0
    for _ in range(2):          # smooth along the height and round the leg
        radii[1:-1] = (radii[:-2] + 2 * radii[1:-1] + radii[2:]) / 4
        radii[:, 1:-1] = (radii[:, :-2] + 2 * radii[:, 1:-1] + radii[:, 2:]) / 4
    return radii


def build_greave(legs, boots, side, detail, materials, name):
    """A bronze greave round the front and sides of one shin, shaped on the
    leg and the sandal straps, with a rolled rim. side: +1 left, -1 right."""
    points = np.vstack((get_coords(legs), get_coords(boots)))
    points = points[points[:, 0] * side > 0.0]
    points = points * np.array((side, 1.0, 1.0))        # work on a left leg
    rows = {0: 6, 1: 8, 2: 22}[detail]
    cols = {0: 6, 1: 8, 2: 24}[detail]
    z_levels = [GREAVE_Z[0] + (GREAVE_Z[1] - GREAVE_Z[0]) * i / rows for i in range(rows + 1)]
    wrap = math.radians(GREAVE_WRAP)
    angles = [-wrap + 2 * wrap * k / cols for k in range(cols + 1)]

    def centre_of(z):
        near = points[np.abs(points[:, 2] - z) < 0.012]
        lo, hi = near.min(axis=0), near.max(axis=0)
        return (lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2

    centres = [centre_of(z) for z in z_levels]
    radii = _leg_envelope(points, z_levels, angles, centre_of)
    b = Builder()
    outer, inner = [], []
    for i, z in enumerate(z_levels):
        cx, cy = centres[i]
        o_row, i_row = [], []
        for k, angle in enumerate(angles):
            rim = GREAVE_RIM if (i in (0, rows) or k in (0, cols)) and detail > 0 else 0.0
            r = radii[i, k] + GREAVE_GAP
            for row, extra in ((o_row, GREAVE_THICKNESS + rim), (i_row, 0.0)):
                x = cx + (r + extra) * math.sin(angle)
                y = cy - (r + extra) * math.cos(angle)
                row.append(b.vert((x * side, y, z)))
        outer.append(o_row)
        inner.append(i_row)
    flip = side < 0
    b.grid(outer, flip=not flip)
    b.grid(inner, flip=flip)
    # Close the four edges.
    b.grid([outer[0], inner[0]], flip=not flip)
    b.grid([outer[-1], inner[-1]], flip=flip)
    b.grid([[row[0] for row in outer], [row[0] for row in inner]], flip=flip)
    b.grid([[row[-1] for row in outer], [row[-1] for row in inner]], flip=not flip)
    obj = b.object(name, [materials["bronze"]], smooth=detail > 0)
    recalc_normals(obj)
    return obj


# --------------------------------------------------------------------------
# Pila, held upright in the left fist behind the shield
# --------------------------------------------------------------------------

# Built in the shield's frame (roman_shield): u across, v along the length
# (+v towards the shield's lower end), w out of its face; the origin is the
# middle of the grip. Finished-model metres.
PILA = [
    # The stout one: a round haft swelling into a square block where the
    # iron's flat tang is riveted; a long thin shank, a small barbed head.
    dict(u=-0.012, w=-0.040, lean=0.0, butt=0.60, haft=1.33, haft_r=0.016, block=0.26, block_side=(0.042, 0.030),
         shank_r=0.0065, head=0.05, head_r=0.010, socket=None),
    # The fine one: a thinner haft, the iron in a socket.
    dict(u=0.022, w=-0.036, lean=2.5, butt=0.56, haft=1.30, haft_r=0.012, block=0.0, block_side=None,
         shank_r=0.0045, head=0.04, head_r=0.008, socket=(0.08, 0.0125)),
]
PILUM_IRON = 0.67               # the iron beyond the haft: half its length is riveted into the haft


def _pilum(b, p, detail):
    sides = {0: 4, 1: 6, 2: 12}[detail]
    lean = math.radians(p["lean"])
    axis = Vector((math.sin(lean), -math.cos(lean), 0.0))       # from the butt up, in (u, v, w)
    base = Vector((p["u"], p["butt"], p["w"]))
    across = Vector((1.0, 0.0, 0.0)) - axis * axis.x
    across.normalize()
    out = axis.cross(across)

    def ring(t, radius, square=False):
        centre = base + axis * t
        pts = []
        for k in range(sides if not square else 4):
            a = 2 * math.pi * (k + (0.5 if square else 0.0)) / (sides if not square else 4)
            r = radius * (math.sqrt(2) if square else 1.0)
            pts.append(b.vert(centre + across * (r * math.cos(a)) + out * (r * math.sin(a))))
        return pts

    def tube(sections, slot):
        """sections: (t, radius) along the axis; caps at both ends."""
        rows = [ring(t, r) for t, r in sections]
        b.grid(rows, slot=slot, close_u=True)
        bottom = b.vert(base + axis * sections[0][0])
        top = b.vert(base + axis * sections[-1][0])
        b.fan(bottom, rows[0], slot=slot, flip=True)
        b.fan(top, rows[-1], slot=slot)

    haft, iron = p["haft"], PILUM_IRON
    if p["block"]:
        start = haft - p["block"]
        tube([(0.0, p["haft_r"]), (start, p["haft_r"])], 0)
        # The square block, tapering towards the iron.
        lo, hi = p["block_side"]
        rows = [ring(start, lo / 2, True), ring(haft, hi / 2, True)]
        b.grid(rows, slot=0, close_u=True)
        b.fan(b.vert(base + axis * start), rows[0], slot=0, flip=True)
        b.fan(b.vert(base + axis * haft), rows[1], slot=0)
        tube([(haft - 0.01, p["shank_r"]), (haft + iron - p["head"], p["shank_r"])], 1)
    else:
        tube([(0.0, p["haft_r"]), (haft, p["haft_r"] * 0.95)], 0)
        length, radius = p["socket"]
        tube([(haft - length, radius), (haft, radius * 0.9), (haft + 0.02, p["shank_r"] * 1.4),
              (haft + iron - p["head"], p["shank_r"])], 1)
    # Barbed pyramidal head: four-sided, widest a little above its base.
    tip = haft + iron
    neck = b.vert(base + axis * (tip - p["head"]))
    barbs = []
    for k in range(4):
        a = 2 * math.pi * (k + 0.5) / 4
        c = base + axis * (tip - p["head"] * 0.7)
        barbs.append(b.vert(c + across * (p["head_r"] * math.cos(a)) + out * (p["head_r"] * math.sin(a))))
    point = b.vert(base + axis * tip)
    b.fan(neck, barbs, slot=1, flip=True)
    b.fan(point, barbs, slot=1)


def build_pila(detail, materials, name="Pila"):
    """The two pila, in the left fist (placed like the shield). Slots: 0
    wood, 1 iron."""
    b = Builder()
    for p in PILA:
        _pilum(b, p, detail)
    obj = b.object(name, [materials["wood"], materials["iron"]], smooth=detail > 0)
    recalc_normals(obj)
    roman_shield.place(obj, roman_hands.grip_axis_point(1), S)
    return obj
