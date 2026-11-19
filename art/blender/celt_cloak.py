"""A light cloak for the Gallic horseman (T-050), over his tunic (celt_tunic).

Polybius 2.28.7: the Insubres and the Boii (the Cisalpine Gauls who fought
for Hannibal) stood at Telamon in their trousers and light cloaks.
Diodorus 5.30.1: striped cloaks, fastened by a brooch on the shoulder,
heavy for winter and light for summer, set with close checks of many
colours. The cloak here is that: a short cape on the shoulders and the
back, open in front, woad blue with close checks of madder red and weld
yellow, a bronze brooch at the front of the right shoulder. How it is
draped and its colours are choices: no source describes the cloak of a
horseman at Cannae.

Built standing, in the rig's rest pose, from the body's own shape (with
the tunic, if it is built first: BODY): the cloth lies on the shoulders
(a little off them) and hangs from them, straight down from the widest
point above, a little flared towards the hem.
It is short enough to clear the horse: the hem at the back stops above the
seat, at the sides above the hips, where the seated thighs come up. The
skin weights (weights) follow the spine and the pelvis only, a little of
the clavicles over the shoulders: never the arms or the legs, which would
drag the cloth with them.

Space: built in finished metres (the rig's), carried into the Celt's own
space (larger by 1 / RIG_SCALE) as the rest of his kit (celt_kit).
"""

import math

import bpy
import numpy as np

from whp_common import log
from whp_mesh import Builder, get_coords, recalc_normals, smoothstep
from whp_skeleton import CELT_SOLE_Z, RIG_SCALE

BODY = ("Celt_body", "Celt_belt", "Celt_legs", "Tunic")       # the tunic (celt_tunic) too, if built

# Finished metres, the Celt at rest (whp_skeleton: the bones' heads).
PELVIS_Z = 0.906
SPINE_Z = (1.027, 1.149, 1.271)              # spine_01, spine_02, spine_03
CENTRE_Y = 0.05                              # the axis the cloth is laid round (the spine at y 0.03-0.04)

CLOAK = dict(
    centre_y=CENTRE_Y,
    reach=math.radians(96.0),   # round from the middle of the back to each front edge
    top_back=1.425,             # the collar at the back of the neck
    top_front=1.392,            # and at the front edges, on the shoulders
    hem_back=0.790,             # the hem at the back (seated: some 0.12 m over the seat)
    hem_side=0.985,             # and at the front edges (over the hips)
    hem_power=0.8,              # how the hem rises from the back to the front edges (cos(angle) ** this)
    clear_top=0.010,            # off the skin on the shoulders
    clear=0.022,                # and lower down
    flare=0.025,                # more round the hem
    drape=0.30,                 # below the shoulder blades it comes in towards the back, 0.3 m a metre
                                # (lying on his back, a cloak hanging straight lifted him off the ground)
    arms_x=0.245,               # body points further out than this are the arms (A pose), not the trunk
    band=0.012,                 # half the height of a slice of the body
    bin=math.radians(7.0),      # half the width of a slice's sector
    thickness=0.009,
)
GRID = {2: (40, 26), 0: (15, 9)}          # columns, rows: detailed, and the game copy (".low")
ROW_POWER = 1.7                            # rows closer together at the top (the cloth turns over the shoulders)

# The weave: close checks (Diodorus 5.30.1), PERIOD metres a repeat.
PERIOD = 0.09
BLUE = (0.040, 0.085, 0.230)                # woad
BLUE_DARK = (0.025, 0.055, 0.160)
RED = (0.300, 0.045, 0.030)                 # madder
YELLOW = (0.420, 0.300, 0.050)              # weld
STRIPES = ((0.00, 0.11, RED), (0.50, 0.57, YELLOW))     # where each band lies in the repeat
BROOCH = dict(radius=0.026, thickness=0.008, sides={2: 12, 0: 6})


# --------------------------------------------------------------------------
# Shape
# --------------------------------------------------------------------------

def to_finished(co):
    """The Celt's own space -> finished metres (as whp_skeleton.to_canonical)."""
    return (co - (0.0, 0.0, CELT_SOLE_Z)) * RIG_SCALE


def to_celt(co):
    return co / RIG_SCALE + (0.0, 0.0, CELT_SOLE_Z)


def body_points(names=BODY):
    """Vertices of the Celt's meshes `names`, finished metres."""
    return np.concatenate([to_finished(get_coords(bpy.data.objects[n])) for n in names if n in bpy.data.objects])


def profile(points, phi, z, c):
    """How far the body reaches from the axis towards angle `phi` at height z."""
    band = points[np.abs(points[:, 2] - z) < c["band"]]
    band = band[np.abs(band[:, 0]) < c["arms_x"]]
    if not len(band):
        return 0.0
    dx, dy = band[:, 0], band[:, 1] - c["centre_y"]
    angle = np.arctan2(dx, dy)
    near = np.abs(angle - phi) < c["bin"]
    if not near.any():
        return 0.0
    return float(np.hypot(dx[near], dy[near]).max())


def surface(columns, rows, c, points):
    """A cloth hanging round the vertical axis through (0, c["centre_y"]):
    columns from angle -c["reach"] (the figure's right) to +c["reach"]
    round the back, rows from the top edge down to the hem. Each point lies
    `clear` off the body (`points`), and hangs from the widest point above
    it, coming back in by at most c["drape"] metres a metre of drop (0:
    straight down). Returns the outer surface, (rows, columns, 3) finished
    metres, and each point's (u, v) along the cloth in metres."""
    phis = np.linspace(-c["reach"], c["reach"], columns)
    ts = (np.arange(rows) / (rows - 1)) ** c.get("row_power", ROW_POWER)
    drape = c.get("drape", 0.0)
    grid = np.zeros((rows, columns, 3))
    for j, phi in enumerate(phis):
        side = abs(phi) / c["reach"]
        top = c["top_back"] + (c["top_front"] - c["top_back"]) * side ** 2
        back = max(math.cos(phi), 0.0) ** c.get("hem_power", 1.5)
        hem = c["hem_side"] + (c["hem_back"] - c["hem_side"]) * back
        widest, last = 0.0, top
        for i, t in enumerate(ts):
            z = top + (hem - top) * t
            clear = c["clear_top"] + (c["clear"] - c["clear_top"]) * float(smoothstep(0.0, 0.35, t))
            widest = max(widest - drape * (last - z), profile(points, phi, z, c) + clear)
            last = z
            r = widest + c["flare"] * float(smoothstep(0.3, 1.0, t))
            grid[i, j] = (r * math.sin(phi), c["centre_y"] + r * math.cos(phi), z)
    # (u, v) in metres along the cloth: arc lengths.
    du = np.linalg.norm(np.diff(grid, axis=1), axis=2)
    dv = np.linalg.norm(np.diff(grid, axis=0), axis=2)
    u = np.concatenate([np.zeros((rows, 1)), np.cumsum(du, axis=1)], axis=1)
    v = np.concatenate([np.zeros((1, columns)), np.cumsum(dv, axis=0)], axis=0)
    u -= u[:, columns // 2:columns // 2 + 1]
    return grid, np.stack([u, v], axis=2)


def normals(grid):
    """Outward normals of the grid (columns run to the figure's left, rows down)."""
    du = np.gradient(grid, axis=1)
    dv = np.gradient(grid, axis=0)
    n = np.cross(du, dv)
    return n / np.maximum(np.linalg.norm(n, axis=2, keepdims=True), 1e-9)


# --------------------------------------------------------------------------
# Mesh
# --------------------------------------------------------------------------

def shell(b, grid, uv, thickness, uvs):
    """Add to Builder `b` a thin closed shell on the grid: the outer face,
    an inner face `thickness` in, the rim between them. Appends each new
    vertex's UV (`uv` of its grid point) to `uvs`."""
    rows, columns = grid.shape[:2]
    inner = grid - normals(grid) * thickness

    def layer(points):
        out = []
        for i in range(rows):
            row = []
            for j in range(columns):
                row.append(b.vert(points[i, j]))
                uvs.append(tuple(uv[i, j]))
            out.append(row)
        return out

    outer_rows, inner_rows = layer(grid), layer(inner)
    b.grid(outer_rows)
    b.grid(inner_rows, flip=True)
    edges = ([(outer_rows[0][j], inner_rows[0][j]) for j in range(columns)][::-1],
             [(outer_rows[-1][j], inner_rows[-1][j]) for j in range(columns)],
             [(outer_rows[i][0], inner_rows[i][0]) for i in range(rows)],
             [(outer_rows[i][-1], inner_rows[i][-1]) for i in range(rows)][::-1])
    for k, edge in enumerate(edges):
        for (a0, a1), (b0, b1) in zip(edge, edge[1:]):
            b.face([a0, b0, b1, a1] if k in (0, 3) else [a0, a1, b1, b0])


def finish(b, name, mats, uvs, uv_name):
    """The Builder's mesh as an object in the Celt's space, with the UVs
    `uvs` (one per vertex) as the map `uv_name`, normals outwards."""
    uvs = uvs + [(0.0, 0.0)] * (len(b.verts) - len(uvs))
    obj = b.object(name, mats, smooth=True)
    if len(obj.data.vertices) != len(uvs):
        raise RuntimeError(f"{name}: vertices merged ({len(obj.data.vertices)} of {len(uvs)}): the UVs would be off")
    layer_uv = obj.data.uv_layers.new(name=uv_name)
    loops = np.empty(len(obj.data.loops), dtype=np.int64)
    obj.data.loops.foreach_get("vertex_index", loops)
    layer_uv.data.foreach_set("uv", np.array(uvs)[loops].astype(np.float32).ravel())
    obj.data.vertices.foreach_set("co", to_celt(get_coords(obj)).ravel())
    obj.data.update()
    recalc_normals(obj)
    return obj


def build(detail, materials, name="Cloak", c=CLOAK):
    """The cloak as a thin closed shell (outer face, inner face, the rim),
    and the brooch. Slots: 0 the wool, 1 bronze. UV map "cloth": metres
    along the cloth / PERIOD."""
    columns, rows = GRID[detail]
    grid, uv = surface(columns, rows, c, body_points())
    b = Builder()
    uvs = []
    shell(b, grid, uv / PERIOD, c["thickness"], uvs)
    face_count = len(b.faces)
    _brooch(b, grid, normals(grid), detail)
    obj = finish(b, name, [materials["cloak"], materials["bronze"]], uvs, "cloth")
    log(f"{name}: {len(obj.data.polygons)} faces ({face_count} of cloth), hem at "
        f"{grid[-1, :, 2].min():.3f}..{grid[-1, :, 2].max():.3f} m, "
        f"{np.linalg.norm(grid[-1, columns // 2, :2] - (0.0, c['centre_y'])):.3f} m off the axis at the back")
    return obj


def _brooch(b, grid, normals, detail):
    """A round bronze brooch on the front edge over the right shoulder."""
    i = max(1, len(grid) // 8)
    centre = grid[i, 1]
    n = normals[i, 1]
    side = np.cross(n, (0.0, 0.0, 1.0))
    side /= np.linalg.norm(side)
    up = np.cross(side, n)
    sides = BROOCH["sides"][detail]
    rings = []
    for depth in (0.0, BROOCH["thickness"]):
        ring = []
        for k in range(sides):
            a = 2.0 * math.pi * k / sides
            p = centre + n * depth + (side * math.cos(a) + up * math.sin(a)) * BROOCH["radius"]
            ring.append(b.vert(p))
        rings.append(ring)
    b.grid(rings, slot=1, close_u=True, flip=True)
    b.fan(b.vert(centre + n * BROOCH["thickness"]), rings[1], slot=1)


# --------------------------------------------------------------------------
# Material and weights
# --------------------------------------------------------------------------

def _weave():
    """One repeat of the check: woad ground, bands of madder and weld both
    ways, a little unevenness of the yarn."""
    n = 96
    t = (np.arange(n) + 0.5) / n
    yy, xx = np.meshgrid(t, t, indexing="ij")
    rgb = np.empty((n, n, 3))
    rgb[:] = BLUE
    grain = 0.5 + 0.5 * np.sin(xx * n * 1.7 + 3.0 * np.sin(yy * 31.0)) * np.sin(yy * n * 1.3)
    rgb = rgb * (1.0 - 0.25 * grain[..., None]) + np.array(BLUE_DARK) * 0.25 * grain[..., None]
    for lo, hi, colour in STRIPES:
        for coord in (xx, yy):
            band = (coord >= lo) & (coord < hi)
            rgb[band] = rgb[band] * 0.45 + np.array(colour) * 0.55 if coord is yy else np.array(colour)
    pixels = np.concatenate([rgb, np.ones((n, n, 1))], axis=2)
    return pixels


def material():
    """The cloak's wool: the weave on the "cloth" UVs, matte."""
    from whp_materials import _image, _new

    mat, tree, bsdf = _new("whp-cloak", 0.9)
    uv = tree.nodes.new("ShaderNodeUVMap")
    uv.uv_map = "cloth"
    tex = tree.nodes.new("ShaderNodeTexImage")
    tex.image = _image("whp-cloak-weave", _weave(), False)
    tex.interpolation = "Linear"
    tree.links.new(uv.outputs["UV"], tex.inputs["Vector"])
    tree.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    return mat


def weights(obj, names):
    """Skin weights of the cloak (rig stage, rest pose, the Celt's space):
    spine_03 from the shoulders up, blended down the spine to spine_01, then
    half and half spine_01 and pelvis below the waist; over the shoulders a
    share of the clavicles."""
    index = {n: i for i, n in enumerate(names)}
    co = to_finished(get_coords(obj))
    z, ax = co[:, 2], np.abs(co[:, 0])
    w = np.zeros((len(co), len(names)), dtype=np.float32)
    s1, s2, s3 = SPINE_Z
    a = smoothstep(s2, s3 + 0.03, z)                     # spine_02 -> spine_03
    b = smoothstep(s1, s2, z)                            # spine_01 -> spine_02
    low = 0.5 * smoothstep(s1, PELVIS_Z - 0.02, z)       # spine_01 -> half pelvis
    w[:, index["spine_03"]] = a
    w[:, index["spine_02"]] = (1.0 - a) * b
    w[:, index["spine_01"]] = (1.0 - a) * (1.0 - b) * (1.0 - low)
    w[:, index["pelvis"]] = (1.0 - a) * (1.0 - b) * low
    shoulder = 0.5 * smoothstep(0.10, 0.22, ax) * smoothstep(1.24, 1.34, z)
    for side, sign in (("l", 1.0), ("r", -1.0)):
        mine = shoulder * (np.sign(co[:, 0]) == sign)
        w *= (1.0 - mine)[:, None]
        w[:, index[f"clavicle_{side}"]] += mine
    return w
