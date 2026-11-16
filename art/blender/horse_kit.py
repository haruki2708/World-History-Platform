"""The horse's coat, mane and tail, and its tack for 216 BCE.

The source's mane and tail are hair particles, which a game mesh cannot
carry; they are rebuilt here as meshes: a short upright (hogged) mane, as on
many horses in Greek and Italic art, and a tail of hair hanging from the
dock. The tack is built from scratch, each piece its own mesh so the rider
models (T-022) can show or hide it per kind of horseman:

    horse-cloth      saddle cloth with a girth: no saddle tree, no stirrups
                     (neither existed yet)
    horse-bridle     headstall, noseband, rings at the corners of the mouth
                     and reins up to the rider's hands
    horse-neckrope   a rope round the neck: the Numidians rode without
                     saddle or bridle

Every piece is laid on the body by casting rays from inside it outwards, so
the tack follows this horse's shape; weights are copied from the nearest
point of the body (whp_skin.WeightSource).
"""

import math

import bpy
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

import horse_rig
import whp_skin
from whp_common import log
from whp_mesh import Builder, new_mesh_object, smoothstep

# Linear colours.
BAY = (0.150, 0.050, 0.018)
BAY_LIGHT = (0.215, 0.090, 0.036)
POINTS = (0.020, 0.016, 0.014)          # black lower legs ("points") of a bay
MUZZLE = (0.050, 0.026, 0.018)
HAIR = (0.016, 0.013, 0.011)
HOOF = (0.040, 0.034, 0.030)
WOOL = (0.235, 0.045, 0.028)            # madder-red wool
WOOL_BORDER = (0.060, 0.030, 0.022)
LEATHER = (0.070, 0.034, 0.016)
IRON = (0.200, 0.200, 0.205)
ROPE = (0.300, 0.230, 0.140)

COAT_ATTR = "whp_color"          # not "color": Cycles reads that name as something else (black bakes)


# --------------------------------------------------------------------------
# Materials
# --------------------------------------------------------------------------

def material(name, color=None, roughness=0.6, metallic=0.0, attribute=False, noise=0.0, streaks=False):
    """Principled material: a plain colour, or the mesh's colour attribute;
    with `noise`, a little variation (baked into the atlas)."""
    old = bpy.data.materials.get(name)
    if old is not None:
        bpy.data.materials.remove(old)
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    tree = mat.node_tree
    bsdf = tree.nodes["Principled BSDF"]
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if attribute:
        node = tree.nodes.new("ShaderNodeVertexColor")
        node.layer_name = COAT_ATTR
        base = node.outputs["Color"]
    else:
        rgb = tree.nodes.new("ShaderNodeRGB")
        rgb.outputs[0].default_value = (*color, 1.0)
        base = rgb.outputs[0]
    if noise:
        coords = tree.nodes.new("ShaderNodeTexCoord")
        mapping = tree.nodes.new("ShaderNodeMapping")
        mapping.inputs["Scale"].default_value = (12.0, 12.0, 1.5) if streaks else (18.0, 18.0, 18.0)
        tex = tree.nodes.new("ShaderNodeTexNoise")
        tex.inputs["Scale"].default_value = 6.0
        tex.inputs["Detail"].default_value = 6.0
        ramp = tree.nodes.new("ShaderNodeMapRange")
        ramp.inputs["To Min"].default_value = 1.0 - noise
        ramp.inputs["To Max"].default_value = 1.0 + noise * 0.6
        mix = tree.nodes.new("ShaderNodeMix")
        mix.data_type = "RGBA"
        mix.blend_type = "MULTIPLY"
        mix.inputs["Factor"].default_value = 1.0
        tree.links.new(coords.outputs["Object"], mapping.inputs["Vector"])
        tree.links.new(mapping.outputs["Vector"], tex.inputs["Vector"])
        tree.links.new(tex.outputs["Fac"], ramp.inputs["Value"])
        tree.links.new(base, mix.inputs["A"])
        tree.links.new(ramp.outputs["Result"], mix.inputs["B"])
        base = mix.outputs["Result"]
    tree.links.new(base, bsdf.inputs["Base Color"])
    return mat


def body_materials():
    """One material per source slot, in the source's order:
    body, hooves, gums, teeth, eyes, cornea, hair."""
    return [
        material("horse-coat", roughness=0.62, attribute=True, noise=0.12),
        material("horse-hoof", HOOF, roughness=0.5, noise=0.1, streaks=True),
        material("horse-gums", (0.30, 0.08, 0.07), roughness=0.4),
        material("horse-teeth", (0.60, 0.55, 0.45), roughness=0.4),
        material("horse-eye", (0.012, 0.009, 0.007), roughness=0.08),
        material("horse-cornea", (0.012, 0.009, 0.007), roughness=0.08),
        material("horse-hair", HAIR, roughness=0.55, noise=0.25, streaks=True),
    ]


SLOT_COAT, SLOT_HOOF, SLOT_GUMS, SLOT_TEETH, SLOT_EYE, SLOT_CORNEA, SLOT_HAIR = range(7)
INNER_SLOTS = (SLOT_GUMS, SLOT_TEETH, SLOT_CORNEA)     # inside the mouth, or a shell over the eye


# --------------------------------------------------------------------------
# The body: landmarks, surface, coat colours
# --------------------------------------------------------------------------

class Body:
    """The body mesh in game space, as numpy arrays and a ray tree of its
    outer skin (coat and hooves: no teeth, gums or eye shells)."""

    def __init__(self, obj, weights, rest, scale):
        mesh = obj.data
        self.scale = scale
        self.obj = obj
        self.rest = rest
        self.co = np.array([v.co[:] for v in mesh.vertices])
        self.weights = weights
        mesh.calc_loop_triangles()
        tris = np.array([t.vertices[:] for t in mesh.loop_triangles], dtype=np.int64)
        slots = np.array([mesh.polygons[t.polygon_index].material_index for t in mesh.loop_triangles])
        outer = tris[np.isin(slots, (SLOT_COAT, SLOT_HOOF, SLOT_EYE))]
        self.tree = BVHTree.FromPolygons([tuple(c) for c in self.co], [tuple(int(i) for i in t) for t in outer])
        self.source = whp_skin.WeightSource(self.co, outer, weights, horse_rig.GAME_NAMES)
        self.bone = {n: i for i, n in enumerate(horse_rig.GAME_NAMES)}
        coat = np.zeros(len(self.co), dtype=bool)
        for p in mesh.polygons:
            if p.material_index == SLOT_COAT:
                coat[list(p.vertices)] = True
        self.coat = coat

    def head(self, bone):
        return np.array(self.rest[bone][:3, 3])

    def weight_of(self, bones):
        return self.weights[:, [self.bone[b] for b in bones]].sum(axis=1)

    def top_z(self, y, x=0.0):
        """Height of the body's top surface at (x, y), by a ray cast down."""
        hit, _n, _i, _d = self.tree.ray_cast(Vector((x, y, 4.0)), Vector((0.0, 0.0, -1.0)), 5.0)
        return float(hit.z)

    def section(self, point, normal, half=0.012, select=None):
        """Coat vertices within `half` of a plane: their centroid."""
        d = (self.co - point) @ normal
        sel = self.coat & (np.abs(d) < half)
        if select is not None:
            sel &= select
        return self.co[sel]

    def cast(self, origin, direction, reach=1.5):
        """First surface point along a ray from inside the body, and the
        outward normal there."""
        direction = Vector(direction).normalized()
        hit, normal, _i, _d = self.tree.ray_cast(Vector(origin), direction, reach)
        if hit is None:
            return None, None
        if normal.dot(direction) < 0:
            normal = -normal
        return np.array(hit), np.array(normal)

    def cast_in(self, centre, direction, reach=0.6):
        """The outer surface along a direction from `centre`: a ray cast
        back towards it from `reach` away (rays from inside the head catch
        the inside of the mouth and nostrils first)."""
        direction = Vector(direction).normalized()
        origin = Vector(centre) + direction * reach
        hit, normal, _i, _d = self.tree.ray_cast(origin, -direction, reach)
        if hit is None:
            return None, None
        if normal.dot(direction) < 0:
            normal = -normal
        return np.array(hit), np.array(normal)

    def push_out(self, p, clearance):
        """Move a point out of the body to at least `clearance` above it."""
        near, normal, _i, _d = self.tree.find_nearest(Vector(p))
        if near is None:
            return p
        rel = Vector(p) - near
        n = Vector(normal)
        if rel.dot(n) < clearance:
            return np.array(near + n * clearance)
        return p

    def sample_weights(self, points):
        return self.source.sample(np.asarray(points))


def coat_colours(body):
    """Per-vertex coat colour: bay, black lower legs, a dark muzzle, a
    lighter belly."""
    co = body.co
    legs = body.weight_of([b for b in horse_rig.GAME_NAMES
                           if any(k in b for k in ("cannon", "pastern", "hoof", "forearm", "gaskin"))])
    dark_legs = np.clip(legs, 0, 1) * smoothstep(0.62, 0.40, co[:, 2])
    tip = co[np.argmin(co[:, 1])]
    muzzle = smoothstep(0.17, 0.07, np.linalg.norm(co - tip, axis=1))
    belly = smoothstep(0.95, 0.80, co[:, 2]) * (1 - np.clip(legs, 0, 1)) * (co[:, 2] > 0.6)
    colour = np.array(BAY)[None] * (1 - belly[:, None]) + np.array(BAY_LIGHT)[None] * belly[:, None]
    colour = colour * (1 - muzzle[:, None]) + np.array(MUZZLE)[None] * muzzle[:, None]
    colour = colour * (1 - dark_legs[:, None]) + np.array(POINTS)[None] * dark_legs[:, None]
    set_colour(body.obj, colour)


def set_colour(obj, colours):
    mesh = obj.data
    attr = mesh.color_attributes.get(COAT_ATTR) or mesh.color_attributes.new(COAT_ATTR, "FLOAT_COLOR", "POINT")
    rgba = np.concatenate([colours, np.ones((len(colours), 1))], axis=1)
    attr.data.foreach_set("color", rgba.astype(np.float32).ravel())


# --------------------------------------------------------------------------
# Building blocks
# --------------------------------------------------------------------------

def _object(builder, name, mats, weights, colours=None):
    """Mesh from a Builder, vertices kept one to one with `weights` and
    `colours` (no merging)."""
    mats = mats if isinstance(mats, (list, tuple)) else [mats]
    obj = new_mesh_object(name, builder.verts, builder.faces, mats, builder.slots, smooth=True)
    whp_skin.write_groups(obj, whp_skin.prune(weights), horse_rig.GAME_NAMES)
    if colours is not None:
        set_colour(obj, colours)
    return obj


def _frame(direction):
    d = np.asarray(direction, dtype=float)
    d /= np.linalg.norm(d)
    ref = np.array([0.0, 0.0, 1.0]) if abs(d[2]) < 0.9 else np.array([1.0, 0.0, 0.0])
    u = ref - ref.dot(d) * d
    u /= np.linalg.norm(u)
    return d, u, np.cross(d, u)


def tube(builder, path, radius, sides, closed=False, phase=0.0, flat=None):
    """Rings along `path` (points), radius per point (number or list).
    `flat`: (width, thickness) for a strap instead of round. Returns the
    ring vertex index lists."""
    path = np.asarray(path, dtype=float)
    n = len(path)
    radii = np.broadcast_to(np.asarray(radius, dtype=float), (n,))
    rings = []
    for i in range(n):
        a = path[(i - 1) % n] if closed or i > 0 else path[i]
        b = path[(i + 1) % n] if closed or i < n - 1 else path[i]
        d, u, v = _frame(b - a)
        ring = []
        for k in range(sides):
            ang = phase + 2 * math.pi * k / sides
            if flat:
                offs = (flat[0] / 2) * math.cos(ang) * v + (flat[1] / 2) * math.sin(ang) * u
            else:
                offs = radii[i] * (math.cos(ang) * u + math.sin(ang) * v)
            ring.append(builder.vert(path[i] + offs))
        rings.append(ring)
    pairs = list(zip(rings, rings[1:])) + ([(rings[-1], rings[0])] if closed else [])
    for r0, r1 in pairs:
        for k in range(sides):
            j = (k + 1) % sides
            builder.face((r0[k], r0[j], r1[j], r1[k]))
    return rings


def ribbon(builder, points, normals, width):
    """A strap lying on the body: one row of quads, facing out."""
    points = np.asarray(points)
    left, right = [], []
    for i, (p, n) in enumerate(zip(points, normals)):
        a = points[max(i - 1, 0)]
        b = points[min(i + 1, len(points) - 1)]
        side = np.cross(b - a, n)
        side /= max(np.linalg.norm(side), 1e-9)
        left.append(builder.vert(p + side * width / 2))
        right.append(builder.vert(p - side * width / 2))
    for i in range(len(points) - 1):
        builder.face((left[i], right[i], right[i + 1], left[i + 1]))
    return left + right


def loop_on_body(body, centre, normal, count, clearance, start=0.0, inward=False):
    """A closed loop on the body's surface round `centre`, in the plane
    through it with this normal: (points, outward normals). `inward`: find
    the surface from outside (for the head)."""
    d, u, v = _frame(normal)
    pts, nrm = [], []
    cast = body.cast_in if inward else body.cast
    for k in range(count):
        ang = start + 2 * math.pi * k / count
        hit, n = cast(centre, math.cos(ang) * u + math.sin(ang) * v)
        pts.append(hit + n * clearance)
        nrm.append(n)
    return np.array(pts), np.array(nrm)


# --------------------------------------------------------------------------
# Mane and tail
# --------------------------------------------------------------------------

def build_mane(body, hair):
    """A hogged mane: an upright brush along the crest, from behind the
    ears to the withers, tufted along its top."""
    ears = body.co[body.weight_of(["horse_head"]) > 0.5]
    y_poll = float(ears[ears[:, 2] > np.percentile(ears[:, 2], 97), 1].max()) + 0.015
    y_withers = withers_y(body)
    stations = np.linspace(y_poll, y_withers - 0.05, 16)
    b = Builder()
    rings = []
    base_points = []
    for i, y in enumerate(stations):
        t = i / (len(stations) - 1)
        z = body.top_z(y)
        height = 0.085 * smoothstep(0.0, 0.12, t) * smoothstep(1.0, 0.75, t) + 0.015
        height += 0.012 if i % 2 else -0.004               # tufts
        half = 0.022 * (1 - 0.3 * t) + 0.008
        base = np.array([0.0, y, z - 0.012])
        top = np.array([0.0, y + 0.01, z + height])
        rings.append([b.vert(base + [-half, 0, 0]), b.vert(top + [-half * 0.45, 0, 0]),
                      b.vert(top + [half * 0.45, 0, 0]), b.vert(base + [half, 0, 0])])
        base_points.append(base + [0, 0, 0.012])
    for r0, r1 in zip(rings, rings[1:]):
        for k in range(3):
            b.face((r0[k], r1[k], r1[k + 1], r0[k + 1]))
    b.face(tuple(rings[0]))
    b.face(tuple(rings[-1][::-1]))
    w = np.repeat(body.sample_weights(np.array(base_points)), 4, axis=0)
    obj = _object(b, "horse-mane", hair, w)
    log(f"mane: {len(stations)} stations, poll y {y_poll:.2f}, withers y {y_withers:.2f}")
    return obj


def withers_y(body):
    """The withers: on the back just behind the top of the shoulder blades
    (the point the horse's height is measured to; horse_rig.Frame)."""
    scale = body.scale
    return float(body.head("horse_shoulder_l")[1] + horse_rig.WITHERS_BEHIND_SHOULDER * scale)


def build_tail(body, hair):
    """Tail hair from the dock down to about the hocks, following the tail
    bones, then hanging straight; weights along the bones."""
    chain = [f"horse_tail_{i}" for i in range(1, 6)]
    heads = [body.head(n) for n in chain]
    end = heads[-1] + (heads[-1] - heads[-2]) * 1.0
    path = heads[1:] + [end]
    hang = np.array([0.0, 0.03, -1.0])
    hang /= np.linalg.norm(hang)
    tip_z = 0.62
    extra = max(end[2] - tip_z, 0.1)
    for k in (1, 2, 3):
        path.append(end + hang * extra * k / 3)
    path = np.array(path)
    n = len(path)
    radius = [0.040, 0.050, 0.060, 0.068, 0.072, 0.068, 0.060, 0.040]
    radius = np.interp(np.linspace(0, 1, n), np.linspace(0, 1, len(radius)), radius)
    b = Builder()
    rings = tube(b, path, radius, 8)
    tip = b.vert(path[-1] + hang * 0.05)
    for k in range(8):
        b.face((rings[-1][k], rings[-1][(k + 1) % 8], tip))
    # Weights: each station follows the tail bone whose segment it is on;
    # the hanging hair follows the last one.
    bones = ["horse_tail_2", "horse_tail_3", "horse_tail_4", "horse_tail_5"] + ["horse_tail_5"] * (n - 4)
    idx = horse_rig.GAME_NAMES.index
    w = np.zeros((n * 8 + 1, len(horse_rig.GAME_NAMES)), dtype=np.float32)
    for i, bone in enumerate(bones):
        w[i * 8:(i + 1) * 8, idx(bone)] = 1.0
    w[-1, idx("horse_tail_5")] = 1.0
    obj = _object(b, "horse-tail", hair, w)
    log(f"tail: {n} stations, tip {path[-1][2]:.2f} m above the ground")
    return obj


# --------------------------------------------------------------------------
# Tack
# --------------------------------------------------------------------------

CLOTH_FRONT = -0.06      # metres behind the withers (negative: in front)
CLOTH_LENGTH = 0.66
CLOTH_DROP = 0.34        # how far down the sides it hangs, from the top of the back
SEAT_BACK = 0.30         # the rider sits this far behind the withers
GIRTH_BACK = 0.12


def barrel_centre(body, y):
    """Middle of the barrel at `y` (on the centre line) and the top of the
    back there, from rays cast up and down from a point inside."""
    inside = np.array([0.0, y, body.top_z(y) - 0.2])
    top, _n = body.cast(inside, (0, 0, 1))
    bottom, _n = body.cast(inside, (0, 0, -1))
    return (top + bottom) / 2, float(top[2])


def build_cloth(body, wool, leather):
    """Saddle cloth over the back and a girth round the barrel. Returns the
    object and the seat point (top of the cloth where the rider sits)."""
    yw = withers_y(body)
    ys = np.linspace(yw + CLOTH_FRONT, yw + CLOTH_FRONT + CLOTH_LENGTH, 8)
    # The side angle where the cloth ends, found at the middle of the cloth.
    centre, top = barrel_centre(body, ys[len(ys) // 2])
    theta_max = 90.0
    for deg in np.arange(30.0, 130.0, 1.0):
        hit, _n = body.cast(centre, (math.sin(math.radians(deg)), 0, math.cos(math.radians(deg))))
        if hit[2] < top - CLOTH_DROP:
            theta_max = deg
            break
    angles = np.radians(np.linspace(-theta_max, theta_max, 13))
    b = Builder()
    grid, colours, base_points = [], [], []
    for i, y in enumerate(ys):
        c, _top = barrel_centre(body, y)
        row = []
        for j, a in enumerate(angles):
            hit, n = body.cast(c, (math.sin(a), 0, math.cos(a)))
            p = hit + n * 0.014
            row.append(b.vert(p))
            base_points.append(hit)
            edge = min(i, len(ys) - 1 - i, j, len(angles) - 1 - j)
            colours.append(WOOL_BORDER if edge == 0 else WOOL)
        grid.append(row)
    for i in range(len(ys) - 1):
        for j in range(len(angles) - 1):
            b.face((grid[i][j], grid[i][j + 1], grid[i + 1][j + 1], grid[i + 1][j]))
    # A fold under the hem on each side and at both ends, so the cloth has
    # some thickness seen from below.
    def lip(edge_ids, inward):
        new = []
        for vid, dirn in zip(edge_ids, inward):
            p = np.array(b.verts[vid]) + dirn * 0.012
            new.append(b.vert(p))
            base_points.append(base_points[vid])
            colours.append(WOOL_BORDER)
        return new
    sides = []
    for j in (0, len(angles) - 1):
        ids = [grid[i][j] for i in range(len(ys))]
        inward = [np.array([-np.sign(b.verts[v][0]), 0.0, 0.0]) for v in ids]
        under = lip(ids, inward)
        for i in range(len(ys) - 1):
            f = (ids[i], ids[i + 1], under[i + 1], under[i])
            b.face(f if j == 0 else f[::-1])
        sides.append(under)
    n_cloth = len(b.verts)

    # Girth: a band round the barrel, over the cloth where they meet.
    yg = ys[0] + GIRTH_BACK
    rings = []
    for y in (yg - 0.025, yg + 0.025):
        c, _top = barrel_centre(body, y)
        ring = []
        for k in range(20):
            a = 2 * math.pi * k / 20
            hit, n = body.cast(c, (math.sin(a), 0, math.cos(a)))
            over = abs(math.degrees(math.atan2(math.sin(a), math.cos(a)))) <= theta_max + 2
            ring.append(b.vert(hit + n * (0.024 if over else 0.008)))
            base_points.append(hit)
            colours.append(LEATHER)
        rings.append(ring)
    for k in range(20):
        j = (k + 1) % 20
        b.face((rings[0][k], rings[1][k], rings[1][j], rings[0][j]))

    weights = body.sample_weights(np.array(base_points))
    obj = _object(b, "horse-cloth", wool, weights, np.array(colours))
    obj["whp_cloth_vertices"] = n_cloth

    # Seat: top of the cloth on the centre line, SEAT_BACK behind the withers.
    c, _top = barrel_centre(body, yw + SEAT_BACK)
    hit, n = body.cast(c, (0, 0, 1))
    seat = hit + n * 0.014
    log(f"cloth: {math.degrees(angles[-1]):.0f} degrees down each side, {CLOTH_LENGTH} m long; "
        f"girth {yg - yw:.2f} m behind the withers; seat at {seat.round(3).tolist()}")
    return obj, seat


def head_landmarks(body):
    """Muzzle tip, poll (top of the head behind the ears), and the corners
    of the mouth, in game space."""
    head_w = body.weight_of(["horse_head"])
    pts = body.co[(head_w > 0.5) & body.coat]
    tip = pts[np.argmin(pts[:, 1])]
    ears_top = pts[pts[:, 2] > np.percentile(pts[:, 2], 98)]
    y_ears = float(ears_top[:, 1].max())
    poll_y = y_ears + 0.03
    poll = np.array([0.0, poll_y, body.top_z(poll_y)])
    axis = (tip - poll) / np.linalg.norm(tip - poll)
    # Mouth corners: at a section about 12 cm behind the muzzle tip, low on
    # the side of the face.
    at = tip - axis * 0.12
    sec = body.section(at, axis, select=head_w > 0.5)
    lo, hi = sec[:, 2].min(), sec[:, 2].max()
    zc = lo + 0.30 * (hi - lo)
    band = sec[np.abs(sec[:, 2] - zc) < 0.012]
    x = float(np.abs(band[:, 0]).max())
    corner = np.array([x, float(band[:, 1].mean()), zc])
    return tip, poll, axis, corner


def build_bridle(body, leather, iron):
    """Headstall over the poll down both cheeks to rings at the corners of
    the mouth, a noseband, and reins from the rings to the rider's hands
    above the withers."""
    tip, poll, axis, corner = head_landmarks(body)
    head_w = body.weight_of(["horse_head"])
    b = Builder()
    points, colours = [], []

    def add_points(ps, colour):
        points.extend(ps)
        colours.extend([colour] * len(ps))

    # Noseband: a loop round the nose 15 cm behind the tip.
    at = tip - axis * 0.15
    sec = body.section(at, axis, select=head_w > 0.5)
    loop, normals = loop_on_body(body, sec.mean(axis=0), axis, 12, 0.008, inward=True)
    log(f"noseband: {len(sec)} section points, loop {np.round(loop.min(axis=0), 3).tolist()} .. "
        f"{np.round(loop.max(axis=0), 3).tolist()}")
    n0 = len(b.verts)
    ribbon(b, np.vstack([loop, loop[:1]]), np.vstack([normals, normals[:1]]), 0.025)
    add_points([np.array(b.verts[i]) for i in range(n0, len(b.verts))], LEATHER)

    # Headstall: from each corner of the mouth up the cheek to below the
    # ear, and over the poll just behind the ears. A guide line through
    # those points, each point snapped to the nearest skin.
    def snap(p):
        near, n, _i, _d = body.tree.find_nearest(Vector(p))
        n = np.array(n)
        if n.dot(np.array(p) - np.array(near)) < 0 and np.linalg.norm(np.array(p) - np.array(near)) > 0.02:
            n = -n
        return np.array(near) + n * 0.008, n

    top = poll + np.array([0.0, 0.035, 0.0])
    guide = []
    for sx in (1, -1):
        c = corner * [sx, 1, 1] + [0.0, 0.0, 0.02]
        ear = np.array([0.075 * sx, top[1] - 0.01, top[2] - 0.11])
        side = [c + (ear - c) * t for t in np.linspace(0, 1, 6)]
        side += [ear + (top + [0.035 * sx, 0, 0] - ear) * t for t in (0.5, 1.0)]
        guide.append(side)
    path = guide[0] + [top] + guide[1][::-1]
    snapped = [snap(p) for p in path]
    n0 = len(b.verts)
    ribbon(b, np.array([p for p, _n in snapped]), np.array([n for _p, n in snapped]), 0.022)
    add_points([np.array(b.verts[i]) for i in range(n0, len(b.verts))], LEATHER)

    # Rings at the corners of the mouth (flat iron loops, both faces).
    rings_at = []
    for sx in (1, -1):
        c = corner * [sx, 1, 1] + [0.012 * sx, 0.0, 0.0]
        rings_at.append(c)
        n0 = len(b.verts)
        outer, inner = [], []
        for k in range(6):
            a = 2 * math.pi * k / 6
            off = np.array([0.0, math.cos(a), math.sin(a)])
            outer.append(b.vert(c + off * 0.030))
            inner.append(b.vert(c + off * 0.020))
        for k in range(6):
            j = (k + 1) % 6
            b.face((outer[k], outer[j], inner[j], inner[k]), slot=1)
            b.face((outer[k], inner[k], inner[j], outer[j]), slot=1)
        add_points([np.array(b.verts[i]) for i in range(n0, len(b.verts))], IRON)

    # Reins: from each ring up the side of the neck to the hands, a little
    # in front of the withers and above them; kept clear of the neck.
    yw = withers_y(body)
    hands = np.array([0.0, yw - 0.16, body.top_z(yw) + 0.16])
    for c in rings_at:
        sx = 1 if c[0] > 0 else -1
        end = hands + [0.05 * sx, 0.0, 0.0]
        path = []
        for t in np.linspace(0, 1, 8):
            p = c + (end - c) * t + np.array([0.0, 0.0, -0.08 * math.sin(math.pi * t)])
            p = body.push_out(p, 0.02)
            path.append(p)
        n0 = len(b.verts)
        tube(b, path, 0.007, 3)
        add_points([np.array(b.verts[i]) for i in range(n0, len(b.verts))], LEATHER)
    weights = body.sample_weights(np.array(points))
    obj = _object(b, "horse-bridle", [leather, iron], weights, np.array(colours))
    log(f"bridle: muzzle tip {tip.round(3).tolist()}, poll {poll.round(3).tolist()}, "
        f"mouth corner {corner.round(3).tolist()}, hands {hands.round(3).tolist()}")
    return obj


def build_neckrope(body, rope):
    """A rope round the base of the neck (the Numidians' only tack)."""
    a = body.head("horse_neck_1")
    c = body.head("horse_neck_3")
    axis = (c - a) / np.linalg.norm(c - a)
    at = a + (c - a) * 0.35
    sec = body.section(at, axis, select=body.weight_of(["horse_neck_1", "horse_neck_2", "horse_spine_5"]) > 0.3)
    loop, _n = loop_on_body(body, sec.mean(axis=0), axis, 14, 0.014)
    b = Builder()
    tube(b, loop, 0.011, 3, closed=True)
    pts = [np.array(v) for v in b.verts]
    obj = _object(b, "horse-neckrope", rope, body.sample_weights(np.array(pts)), np.array([ROPE] * len(pts)))
    log(f"neck rope: loop of {len(loop)} points round the neck")
    return obj


def tack_materials():
    return {
        "wool": material("horse-wool", roughness=0.92, attribute=True, noise=0.15),
        "leather": material("horse-leather", roughness=0.62, attribute=True, noise=0.10),
        "rope": material("horse-rope", roughness=0.85, attribute=True, noise=0.25, streaks=True),
        "iron": material("horse-iron", IRON, roughness=0.4, metallic=1.0),
    }
