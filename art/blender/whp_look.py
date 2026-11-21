"""Each man his own look (T-061, B1): colour slots, variant shapes and shield
designs, from a unit module's LOOKS through the stages lod and export. A
model without LOOKS is built exactly as before.

What the file carries (docs/ARCHITECTURE.md, "Mỗi lính một vẻ"):

  - the vertex attribute _LOOK on every LOD, one number: the vertex's
    primary colour slot + 8 x its secondary slot (0: none) + 64 x its
    variant shape (0: always drawn); the same over a part, so a part's
    vertices never mix two looks;
  - the dye mask in the red channel of the metallicRoughness image, baked
    like roughness from the detailed materials: 1 dyes a texel as its
    vertex's primary slot, 0.5 as its secondary, 0 keeps the atlas colour
    (iron, bronze, leather, a purple border); metal never dyes;
  - the designs: grey masks in a room of the colour atlas, laid across the
    shield by its frame (centre, long and short axes, extents; in the
    JSON), so no second UV map is needed;
  - scenes[0].extras.whp_looks, a JSON string: the slots with their colours
    and weights, the variant groups, the designs and their colours.

The scene draws each man's choices from his own random number, the same at
every level of detail.
"""

import json
import math

import bmesh
import bpy
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

from whp_common import log

ATTRIBUTE = "_LOOK"             # exported as is: glTF custom attributes start with "_"
SECONDARY_STEP, VARIANT_STEP = 8, 64   # _LOOK = primary + 8 secondary + 64 variant
EXTRAS_KEY = "whp_looks"        # key of the JSON in the glTF scene's extras (and on the Blender scene)
PRIMARY, SECONDARY = 1.0, 0.5   # dye mask values
MAX_SLOTS = 7                   # primary and secondary slot each in 1..7 (0: none), under SECONDARY_STEP
MAX_OPTIONS = 8
MAX_GROUPS = 4
MAX_VARIANTS = 15
MAX_DESIGNS = 8

# The room of the atlas for the designs: a grid of tiles, each the shield's
# face (its oval inscribed), in texels at the colour image's size.
DESIGN_TILE = (104, 184)
DESIGN_GRID = (4, 2)
DESIGN_GAP = 8


ONE = (1.0, 1.0, 1.0)
# Slots LOD2 leaves out (Looks.near_only): at that range a man is a few pixels
# tall, and a skin a little lighter or darker does not show.
NEAR_ONLY = ("skin",)


def srgb(r, g, b):
    """Linear RGB of an sRGB colour given in 0..255."""
    def f(c):
        c /= 255.0
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return (round(f(r), 5), round(f(g), 5), round(f(b), 5))


class Slot:
    """A slot of colour. `mode`: "tint" multiplies the atlas colour by the
    choice; "dye" takes the atlas luminance over the slot's mean and
    multiplies the choice by it (to change hue: a red tunic into an undyed
    one). `options`: (weight, linear RGB)."""

    def __init__(self, name, mode, options):
        if mode not in ("tint", "dye"):
            raise ValueError(f"slot {name}: mode {mode}")
        if not 1 <= len(options) <= MAX_OPTIONS:
            raise ValueError(f"slot {name}: {len(options)} options")
        self.name, self.mode = name, mode
        self.options = [(float(w), tuple(float(c) for c in rgb)) for w, rgb in options]


class Variants:
    """A group of variant shapes (beards, hair): `options` (weight, the
    name of a Part, or None for none of them)."""

    def __init__(self, name, options):
        if not 1 <= len(options) <= MAX_OPTIONS:
            raise ValueError(f"variants {name}: {len(options)} options")
        self.name = name
        self.options = [(float(w), part) for w, part in options]


class Designs:
    """Designs on the paint of slot `slot` (the shield): `options` (weight,
    a name of design_mask, or None for a plain shield), `colours` (weight,
    linear RGB, laid on with the paint's light and shade)."""

    def __init__(self, slot, options, colours):
        self.slot = slot
        self.options = [(float(w), d) for w, d in options]
        self.colours = [(float(w), tuple(float(c) for c in rgb)) for w, rgb in colours]
        if len(self.names) > MAX_DESIGNS or len(self.colours) > MAX_OPTIONS or len(self.options) > MAX_OPTIONS + 1:
            raise ValueError("too many designs")

    @property
    def names(self):
        return sorted({d for _, d in self.options if d})


class Looks:
    """`parts`: Part name -> (primary slot, secondary slot or None).
    `materials`: detailed material name -> the slot its texels take, or a
    function (tree, bsdf, node) -> socket giving PRIMARY, SECONDARY or 0 per
    texel, for a texture of two slots (hair and skin on one head); `node`
    makes a node that is removed after the bake. `near_only`: slots left
    out of LOD2, where a figure is a few pixels tall: each slot there keeps
    the stand-in's faces and palette apart, and splits their vertices."""

    def __init__(self, slots, parts, materials, variants=(), designs=None, near_only=NEAR_ONLY):
        self.slots = list(slots)
        self.near_only = tuple(near_only)
        names = [s.name for s in self.slots]
        if len(names) > MAX_SLOTS or len(set(names)) != len(names):
            raise ValueError(f"slots {names}")
        self.parts = dict(parts)
        self.materials = dict(materials)
        self.variants = list(variants)
        if len(self.variants) > MAX_GROUPS:
            raise ValueError("too many variant groups")
        self.designs = designs
        for primary, secondary in self.parts.values():
            for name in (primary, secondary):
                if name is not None and name not in names:
                    raise ValueError(f"unknown slot {name}")
        self.variant_id = {}
        for group in self.variants:
            for _, part in group.options:
                if part and part not in self.variant_id:
                    self.variant_id[part] = len(self.variant_id) + 1
        if len(self.variant_id) > MAX_VARIANTS:
            raise ValueError("too many variant shapes")
        if designs is not None and designs.slot not in names:
            raise ValueError(f"designs on unknown slot {designs.slot}")

    def slot(self, name):
        return 0 if name is None else [s.name for s in self.slots].index(name) + 1

    def far(self, value):
        """A look (primary, secondary, variant) as LOD2 draws it: without the
        slots in `near_only`."""
        primary, secondary, variant = (int(x) for x in value)
        names = [s.name for s in self.slots]
        drop = lambda k: 0 if k and names[k - 1] in self.near_only else k  # noqa: E731
        return (float(drop(primary)), float(drop(secondary)), float(variant))

    def far_pieces(self, pieces):
        """Rewrite the _LOOK of LOD2's pieces as LOD2 draws it (Looks.far)."""
        for piece in pieces:
            if not len(piece.data.vertices):
                continue
            values = read(piece)
            _write(piece.data, [pack(self.far(v)) for v in values])

    def look(self, part):
        primary, secondary = self.parts.get(part, (None, None))
        return (float(self.slot(primary)), float(self.slot(secondary)), float(self.variant_id.get(part, 0)))

    @property
    def variant_parts(self):
        return set(self.variant_id)

    def dye(self, specs):
        """The red value each detailed material bakes to (whp_lod.SurfaceSwap):
        PRIMARY or SECONDARY as its slot is the primary or secondary slot of
        the part that bakes it, 0 for no slot; or its function."""
        out = {}
        for part in specs:
            primary, secondary = self.parts.get(part.name, (None, None))
            for name in part.bake:
                for mat in bpy.data.objects[name].data.materials:
                    if mat is None:
                        continue
                    spec = self.materials.get(mat.name)
                    if callable(spec):
                        value = spec
                    elif spec is None:
                        value = 0.0
                    elif spec == primary:
                        value = PRIMARY
                    elif spec == secondary:
                        value = SECONDARY
                    else:
                        raise ValueError(f"{mat.name}: slot {spec} is not one of part {part.name}'s")
                    if mat.name in out and out[mat.name] != value:
                        raise ValueError(f"{mat.name}: baked by parts of different slots")
                    out[mat.name] = value
        log("dye mask: " + ", ".join(f"{k} {'texture' if callable(v) else v}" for k, v in sorted(out.items())))
        return out

    def extras(self, refs, tiles, frame=None):
        """The JSON of scenes[0].extras.whp_looks. `refs`: mean luminance of
        each slot's dyed texels; `tiles`: the designs' UV rectangles, glTF
        convention (origin top left), in the order of Designs.names;
        `frame`: the shield's (shield_frame), turned into glTF axes."""
        doc = {"version": 1, "slots": []}
        for s in self.slots:
            doc["slots"].append({
                "name": s.name, "mode": s.mode, "ref": round(float(refs.get(s.name, 1.0)), 5),
                "options": [[round(c, 5) for c in rgb] + [w] for w, rgb in s.options],
            })
        if self.variants:
            doc["variants"] = [{"name": g.name, "options": [[self.variant_id.get(p, 0) if p else 0, w]
                                                            for w, p in g.options]} for g in self.variants]
        if self.designs is not None:
            names = self.designs.names
            doc["designs"] = {
                "slot": self.slot(self.designs.slot),
                "tiles": [[round(float(x), 6) for x in t] for t in tiles],
                "options": [[names.index(d) if d else -1, w] for w, d in self.designs.options],
                "colors": [[round(c, 5) for c in rgb] + [w] for w, rgb in self.designs.colours],
            }
            if frame is not None:
                c, e1, e2, (u0, u1), (v0, v1) = frame
                gltf = lambda v: [round(float(v[0]), 5), round(float(v[2]), 5), round(float(-v[1]), 5)]
                doc["designs"]["frame"] = gltf(c) + gltf(e1) + gltf(e2)
                doc["designs"]["extent"] = [round(float(x), 5) for x in (u0, u1, v0, v1)]
        return json.dumps(doc, separators=(",", ":"))


def rider_lift():
    """How far whp_cavalry.mount lifted a horseman's rest pose (x, y, z
    metres), zeros for a man on foot: shapes and heights given for a man
    standing are moved by it."""
    import whp_skeleton
    rig = bpy.data.objects.get(whp_skeleton.RIG_NAME)
    if rig is None or "whp_rider_lift" not in rig:
        return np.zeros(3)
    return np.array(rig["whp_rider_lift"], dtype=np.float64)


def woven_border(attribute="whp_border", secondary=True):
    """The dye mask of a tunic with a woven border (roman_source.border_attribute,
    a colour attribute 1 in the border): a function for Looks.materials. The
    cloth takes the part's primary slot; the border its secondary slot, or
    keeps its colour (secondary=False)."""
    low = SECONDARY if secondary else 0.0

    def red(tree, bsdf, node):
        attr = node("ShaderNodeAttribute")
        attr.attribute_name = attribute
        out = node("ShaderNodeMath")
        out.operation = "MULTIPLY_ADD"          # PRIMARY + (low - PRIMARY) x border
        tree.links.new(attr.outputs["Fac"], out.inputs[0])
        out.inputs[1].default_value = low - PRIMARY
        out.inputs[2].default_value = PRIMARY
        return out.outputs["Value"]
    return red


# --------------------------------------------------------------------------
# The attribute
# --------------------------------------------------------------------------

def pack(value):
    """(primary, secondary, variant) -> the one number of _LOOK."""
    primary, secondary, variant = value
    return float(primary + SECONDARY_STEP * secondary + VARIANT_STEP * variant)


def _write(me, packed):
    attr = me.attributes.get(ATTRIBUTE)
    if attr is None:
        attr = me.attributes.new(ATTRIBUTE, "FLOAT", "POINT")
    attr.data.foreach_set("value", np.asarray(packed, dtype=np.float32))


def assign(obj, value):
    """_LOOK = `value` (primary, secondary, variant) on every vertex of `obj`."""
    _write(obj.data, np.full(len(obj.data.vertices), pack(value), dtype=np.float32))


def read(obj):
    """(primary, secondary, variant) of each vertex (n, 3), zeros where there is none."""
    me = obj.data
    packed = np.zeros(len(me.vertices), dtype=np.float32)
    attr = me.attributes.get(ATTRIBUTE)
    if attr is not None:
        attr.data.foreach_get("value", packed)
    n = np.round(packed).astype(np.int64)
    return np.stack([n % SECONDARY_STEP, (n // SECONDARY_STEP) % (VARIANT_STEP // SECONDARY_STEP),
                     n // VARIANT_STEP], axis=1).astype(np.float32)


def assign_from_nearest(target, source, far=None):
    """Each face of `target` (the LOD2 stand-in) takes the _LOOK of the
    nearest face of `source` (the parts it is coloured from), as `far`
    (Looks.far) gives it; edges between faces of different looks are split,
    so every vertex has one look."""
    smesh = source.data
    looks = read(source)
    tree = BVHTree.FromPolygons([v.co.copy() for v in smesh.vertices], [tuple(p.vertices) for p in smesh.polygons])
    face_look = [tuple(looks[p.vertices[0]]) for p in smesh.polygons]
    if far is not None:
        face_look = [far(v) for v in face_look]
    bm = bmesh.new()
    bm.from_mesh(target.data)
    bm.faces.ensure_lookup_table()
    mine = {}
    for face in bm.faces:
        _loc, _normal, index, _dist = tree.find_nearest(face.calc_center_median())
        mine[face] = face_look[index]
    edges = [e for e in bm.edges if len(e.link_faces) == 2 and mine[e.link_faces[0]] != mine[e.link_faces[1]]]
    if edges:
        bmesh.ops.split_edges(bm, edges=edges)
    bm.verts.ensure_lookup_table()
    values = np.zeros((len(bm.verts), 3), dtype=np.float32)
    for face in bm.faces:
        for v in face.verts:
            values[v.index] = mine[face]
    bm.to_mesh(target.data)
    bm.free()
    _write(target.data, [pack(v) for v in values])
    kinds = sorted({tuple(int(x) for x in v) for v in values})
    log(f"{target.name}: looks {kinds}, {len(edges)} edges split between them")


def triangle_keys(obj):
    """_LOOK of each triangle (of its first corner)."""
    looks = read(obj)
    verts = np.empty(len(obj.data.loops), dtype=np.int64)
    obj.data.loops.foreach_get("vertex_index", verts)
    first = verts.reshape(-1, 3)[:, 0]
    return [tuple(int(x) for x in looks[v]) for v in first]


# --------------------------------------------------------------------------
# Shield designs
# --------------------------------------------------------------------------

def design_room():
    """Texels of the designs' grid, (width, height)."""
    tw, th = DESIGN_TILE
    cols, rows = DESIGN_GRID
    return cols * tw + (cols - 1) * DESIGN_GAP, rows * th + (rows - 1) * DESIGN_GAP


def design_mask(name, width, height, tw, th):
    """Coverage 0..1 of one design over a tile of tw x th texels: the shield's
    face (`width` x `height` metres) is the oval inscribed in the tile. The
    lines wander a little, as painted by hand."""
    ss = 3
    xs = (np.arange(tw * ss) + 0.5) / (tw * ss) * 2.0 - 1.0
    ys = (np.arange(th * ss) + 0.5) / (th * ss) * 2.0 - 1.0
    x, y = np.meshgrid(xs, ys)
    x = x + 0.018 * np.sin(y * 5.3 + 1.1) + 0.010 * np.sin(y * 13.0 + x * 4.0)
    y = y + 0.012 * np.sin(x * 4.1 + 0.7) + 0.008 * np.sin(x * 11.0 - y * 3.0)
    X, Y = x * width / 2.0, y * height / 2.0
    r = np.sqrt(x * x + y * y)
    R = np.sqrt(X * X + Y * Y)
    inside = r < 0.97
    theta = np.arctan2(Y, X)
    if name == "rim":
        m = (r > 0.84) & inside
    elif name == "band":
        m = (np.abs(Y) < 0.07) & inside
    elif name == "cross":
        m = ((np.abs(X) < 0.045) | (np.abs(Y) < 0.045)) & inside
    elif name == "rings":
        m = (((R > 0.10) & (R < 0.14)) | ((R > 0.21) & (R < 0.25))) & inside
    elif name == "diagonal":
        a = math.radians(55)
        m = (np.abs(X * math.cos(a) - Y * math.sin(a)) < 0.06) & inside
    elif name == "lunettes":
        m = np.zeros_like(inside)
        for s in (1, -1):
            m |= (np.hypot(X, Y - s * 0.30) < 0.15) & ~(np.hypot(X, Y - s * 0.36) < 0.13)
        m &= inside
    elif name == "triskele":
        m = R < 0.045
        for j in range(3):
            centre = 2.0 * math.pi * j / 3.0 + R / 0.075
            d = np.angle(np.exp(1j * (theta - centre)))
            m |= (np.abs(d) * R < 0.028) & (R > 0.03) & (R < 0.24)
        m &= inside
    elif name == "rays":
        m = (np.abs(np.angle(np.exp(1j * theta * 4))) < 0.5) & (R > 0.07) & inside & (r < 0.8)
    else:
        raise ValueError(f"no design {name}")
    return m.reshape(th, ss, tw, ss).mean(axis=(1, 3)).astype(np.float32)


def shield_frame(obj):
    """The shield's own axes from its LOD0 part at rest: centre, the long
    axis (pointing up), the short one, and its extents along them."""
    me = obj.data
    co = np.empty(len(me.vertices) * 3)
    me.vertices.foreach_get("co", co)
    m = np.array(obj.matrix_world)
    co = co.reshape(-1, 3) @ m[:3, :3].T + m[:3, 3]
    c = co.mean(axis=0)
    _vals, vecs = np.linalg.eigh(np.cov((co - c).T))
    e1, e2 = vecs[:, 2], vecs[:, 1]
    if e1[2] < 0:
        e1 = -e1
    if np.cross(e1, e2) @ vecs[:, 0] < 0:
        e2 = -e2
    p1, p2 = (co - c) @ e1, (co - c) @ e2
    return c, e1, e2, (p2.min(), p2.max()), (p1.min(), p1.max())


def paint_designs(looks, color_pixels, origin, width, height):
    """Draw the designs into the colour image (RGB array, rows from the
    bottom) at texel `origin` (x, y of the grid's bottom left). Returns their
    UV rectangles, glTF convention."""
    size = color_pixels.shape[0]
    tw, th = DESIGN_TILE
    tiles = []
    for k, name in enumerate(looks.designs.names):
        col, row = k % DESIGN_GRID[0], k // DESIGN_GRID[0]
        x = origin[0] + col * (tw + DESIGN_GAP)
        y = origin[1] + row * (th + DESIGN_GAP)
        mask = design_mask(name, width, height, tw, th)
        color_pixels[y:y + th, x:x + tw] = mask[:, :, None]
        tiles.append((x / size, 1.0 - (y + th) / size, tw / size, th / size))
    log(f"designs {looks.designs.names} in the atlas at {origin}, tiles {tw} x {th}")
    return tiles


# --------------------------------------------------------------------------
# Mean luminance of each slot's dyed texels (the "dye" mode divides by it)
# --------------------------------------------------------------------------

def slot_luminance(looks, pieces, color_pixels, surface_pixels):
    """`pieces`: LOD0's parts (with their _LOOK); the images as arrays (the
    colour sRGB-encoded). Returns slot name -> mean linear luminance."""
    import whp_far
    size = color_pixels.shape[0]
    half = surface_pixels.shape[0]
    sums = {s.name: [0.0, 0] for s in looks.slots}
    names = [s.name for s in looks.slots]
    for piece in pieces:
        primary, secondary, _variant = (int(x) for x in read(piece)[0]) if len(piece.data.vertices) else (0, 0, 0)
        if not primary and not secondary:
            continue
        rows, cols, _t, _b = whp_far.rasterise(piece, size)
        rgb = color_pixels[rows, cols, :3]
        rgb = np.where(rgb <= 0.04045, rgb / 12.92, ((rgb + 0.055) / 1.055) ** 2.4)
        lum = rgb @ np.array([0.2126, 0.7152, 0.0722])
        red = surface_pixels[rows * half // size, cols * half // size, 0]
        for slot, sel in ((primary, red >= 0.75), (secondary, (red >= 0.25) & (red < 0.75))):
            if slot and sel.any():
                entry = sums[names[slot - 1]]
                entry[0] += float(lum[sel].sum())
                entry[1] += int(sel.sum())
    refs = {k: (v[0] / v[1] if v[1] else 1.0) for k, v in sums.items()}
    log("slot luminance: " + ", ".join(f"{k} {v:.3f}" for k, v in refs.items()))
    return refs
