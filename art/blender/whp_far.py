"""The far levels of the game ladder with few seams (T-047).

Every vertex the GPU skins costs as much as any other, and a vertex is
split wherever its triangles disagree on a UV. LOD1 used LOD0's islands
(the decimator keeps their seams) and LOD2 gave every triangle its own
point of the atlas: 2.3-3.4 and 3.1-3.6 vertices for every distinct
position (T-031). Here:

LOD1  Each piece is decimated from its LOD0 part as before, then cut into
      a few charts grown over its surface (chart_unwrap) and unwrapped
      angle-based. Its islands are packed into the same atlas as LOD0's, at
      LOD1_DENSITY of LOD0's texel density (whp_lod.unwrap_atlas), and
      coloured after the bake by reading the finished LOD0 atlas at the
      nearest point of the LOD0 part (transfer): the same colours, AO
      included. Its normals are the mesh's own (flat in the normal map):
      at the distances LOD1 is drawn at, LOD0's normal map averages out.
LOD2  A small palette (whp_palette), in cells of the atlas no island uses
      (free_cells).
"""

import heapq
import math

import bmesh
import bpy
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from mathutils.interpolate import poly_3d_calc

import whp_lod as lod
from whp_common import duplicate_object, log, select_only, triangle_count
from whp_mesh import merge_by_distance

LOD1_DENSITY = 0.25     # texel density of LOD1's islands against LOD0's (linear)
LOD1_CONE = 90.0        # degrees: a chart's faces keep within this of its mean normal
LOD1_PAD = 3            # texels round LOD1's islands filled with their edge colours (the atlas margin)
WELD = 1e-5             # metres: corners this close are one vertex of a LOD1 piece
SPECK = 3               # faces: smaller loose pieces of a LOD1 piece are dropped


def far_name(name):
    return f"{name}.lod1"


# --------------------------------------------------------------------------
# LOD1: decimate, chart, unwrap
# --------------------------------------------------------------------------

def chart_unwrap(obj, cone=LOD1_CONE):
    """Cut a low mesh into charts and unwrap them angle-based into the
    atlas UV layer. A chart grows from the largest face not yet taken,
    always by the face nearest its mean normal (a priority queue), while
    that face is within `cone` of the mean and joining it keeps the chart
    a disc (it shares one or two edges with the chart and touches it
    nowhere else). Seams go on the borders between charts. Returns the
    number of charts."""
    mesh = obj.data
    for layer in list(mesh.uv_layers):
        mesh.uv_layers.remove(layer)
    mesh.uv_layers.new(name=lod.UV_NAME)
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bm.faces.ensure_lookup_table()
    bm.edges.ensure_lookup_table()
    limit = math.cos(math.radians(cone))
    chart = {}
    order = sorted(range(len(bm.faces)), key=lambda i: (-round(bm.faces[i].calc_area(), 9), i))
    count = 0
    for seed in order:
        if seed in chart:
            continue
        cid = count
        count += 1
        total = bm.faces[seed].normal * bm.faces[seed].calc_area()
        chart[seed] = cid
        verts = {v.index for v in bm.faces[seed].verts}
        heap = []

        def push(face, mean):
            for edge in face.edges:
                for other in edge.link_faces:
                    if other.index not in chart:
                        heapq.heappush(heap, (-round(other.normal.dot(mean), 9), other.index))

        push(bm.faces[seed], total.normalized())
        while heap:
            _key, gi = heapq.heappop(heap)
            if gi in chart:
                continue
            face = bm.faces[gi]
            mean = total.normalized()
            if face.normal.dot(mean) < limit:
                continue
            shared = sum(1 for edge in face.edges
                         if any(chart.get(h.index) == cid for h in edge.link_faces if h is not face))
            touched = sum(1 for v in face.verts if v.index in verts)
            if shared == 0 or shared == 3 or touched != shared + 1:
                continue
            chart[gi] = cid
            total += face.normal * face.calc_area()
            verts.update(v.index for v in face.verts)
            push(face, total.normalized())
    count = _merge_charts(bm, chart, limit)
    for edge in bm.edges:
        edge.seam = len({chart[f.index] for f in edge.link_faces}) > 1 or len(edge.link_faces) < 2
    bm.to_mesh(mesh)
    bm.free()
    select_only(obj)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.unwrap(method="ANGLE_BASED", fill_holes=True, correct_aspect=True, margin=0.002)
    bpy.ops.object.mode_set(mode="OBJECT")
    return count


def _merge_charts(bm, chart, limit):
    """Merge charts into a neighbour while the two stay a disc together
    (the border they share is one unbroken run of edges, and neither has
    another border with the other) and their faces keep within the cone of
    the merged mean normal; smallest charts first, each into its largest
    such neighbour. Returns the number of charts left."""
    members = {}
    for f in bm.faces:
        members.setdefault(chart[f.index], []).append(f.index)
    faces = bm.faces

    def mean_normal(ids):
        n = Vector()
        for i in ids:
            n += faces[i].normal * faces[i].calc_area()
        return n.normalized()

    changed = True
    while changed:
        changed = False
        for cid in sorted(members, key=lambda c: (len(members[c]), c)):
            if cid not in members:
                continue
            borders = {}
            for i in members[cid]:
                for edge in faces[i].edges:
                    for other in edge.link_faces:
                        oc = chart[other.index]
                        if oc != cid:
                            borders.setdefault(oc, set()).add(edge.index)
            for oc in sorted(borders, key=lambda c: (-len(members[c]), c)):
                edges = [bm.edges[e] for e in sorted(borders[oc])]
                # One unbroken run: a path, its ends the only vertices of degree one.
                degree = {}
                for e in edges:
                    for v in e.verts:
                        degree[v.index] = degree.get(v.index, 0) + 1
                ends = sum(1 for d in degree.values() if d == 1)
                if ends != 2 or any(d > 2 for d in degree.values()) or len(degree) != len(edges) + 1:
                    continue
                # ... and they touch nowhere else (a corner in common would leave a hole).
                mine = {v.index for i in members[cid] for v in faces[i].verts}
                theirs = {v.index for i in members[oc] for v in faces[i].verts}
                if mine & theirs != set(degree):
                    continue
                union = members[cid] + members[oc]
                mean = mean_normal(union)
                if any(faces[i].normal.dot(mean) < limit for i in union):
                    continue
                for i in members[cid]:
                    chart[i] = oc
                members[oc] = union
                del members[cid]
                changed = True
                break
    return len(members)


def _drop_specks(obj, smallest):
    """Delete the connected pieces of fewer than `smallest` faces; returns
    how many faces went."""
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    seen, specks = set(), []
    for face in bm.faces:
        if face.index in seen:
            continue
        piece, stack = [], [face]
        seen.add(face.index)
        while stack:
            f = stack.pop()
            piece.append(f)
            for edge in f.edges:
                for g in edge.link_faces:
                    if g.index not in seen:
                        seen.add(g.index)
                        stack.append(g)
        if len(piece) < smallest:
            specks += piece
    if specks:
        verts = {v for f in specks for v in f.verts}
        bmesh.ops.delete(bm, geom=specks, context="FACES_ONLY")
        bmesh.ops.delete(bm, geom=[v for v in verts if not v.link_faces], context="VERTS")
        bm.to_mesh(obj.data)
        obj.data.update()
    bm.free()
    return len(specks)


def lod1_pieces(names, lows, budgets, after=None):
    """LOD1 pieces from LOD0 parts (before the atlas is packed): each part
    with a budget is decimated as before (the LOD0 part's UVs still on it,
    so the shape comes out as it did), its coincident corners welded,
    charted and unwrapped
    (chart_unwrap), its texel density weight cut to LOD1_DENSITY.
    `after(name, piece)` may change a piece once decimated. Returns the
    pieces, named <part>.lod1."""
    pieces = []
    for name, low, budget in zip(names, lows, budgets):
        if not budget:
            continue
        piece = duplicate_object(low, far_name(name))
        lod.decimate(piece, budget)
        if after is not None:
            after(name, piece)
        # A source mesh split along its own seams (the Celt) would cut every chart short there.
        merge_by_distance(piece, WELD)
        # Loose bits of a face or two left by the decimator (inside the head, under the hair): a
        # chart of one triangle unwraps to nothing, and the exporter's tangents and normals for it
        # came out different from one build to the next.
        dropped = _drop_specks(piece, SPECK)
        weights = np.empty(len(piece.data.polygons))
        attr = piece.data.attributes.get(lod.UV_WEIGHT)
        if attr is None or attr.domain != "FACE":
            weights.fill(1.0)
            if attr is not None:
                piece.data.attributes.remove(attr)
            attr = piece.data.attributes.new(lod.UV_WEIGHT, "FLOAT", "FACE")
        else:
            attr.data.foreach_get("value", weights)
        charts = chart_unwrap(piece)
        attr = piece.data.attributes[lod.UV_WEIGHT]
        attr.data.foreach_set("value", (weights * LOD1_DENSITY).tolist())
        pieces.append(piece)
        log(f"LOD1 {name}: {triangle_count(piece)} triangles, {charts} charts"
            + (f", {dropped} loose faces dropped" if dropped else ""))
    return pieces


# --------------------------------------------------------------------------
# The atlas: which texels the islands use, colouring LOD1's
# --------------------------------------------------------------------------

def _triangles(obj):
    """UVs (n, 3, 2) and vertex coordinates (n, 3, 3) of a triangulated mesh."""
    mesh = obj.data
    n = len(mesh.polygons)
    uv = np.empty(len(mesh.loops) * 2)
    mesh.uv_layers[lod.UV_NAME].data.foreach_get("uv", uv)
    vi = np.empty(len(mesh.loops), dtype=np.int64)
    mesh.loops.foreach_get("vertex_index", vi)
    co = np.empty(len(mesh.vertices) * 3)
    mesh.vertices.foreach_get("co", co)
    return uv.reshape(n, 3, 2), co.reshape(-1, 3)[vi].reshape(n, 3, 3)


def rasterise(obj, size):
    """Texels whose centres lie in the mesh's UV triangles, at a `size`
    image: rows, columns, triangle and barycentric weights (k, 3)."""
    uv, _co = _triangles(obj)
    px = uv * size - 0.5                       # texel centres at integers
    rows, cols, tris, bary = [], [], [], []
    for t in range(len(px)):
        a, b, c = px[t]
        lo = np.floor(np.minimum(np.minimum(a, b), c)).astype(int)
        hi = np.ceil(np.maximum(np.maximum(a, b), c)).astype(int)
        lo = np.clip(lo, 0, size - 1)
        hi = np.clip(hi, 0, size - 1)
        xs, ys = np.meshgrid(np.arange(lo[0], hi[0] + 1), np.arange(lo[1], hi[1] + 1))
        p = np.stack([xs.ravel(), ys.ravel()], axis=1).astype(np.float64)
        d = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1])
        if abs(d) < 1e-12:
            continue
        w0 = ((b[1] - c[1]) * (p[:, 0] - c[0]) + (c[0] - b[0]) * (p[:, 1] - c[1])) / d
        w1 = ((c[1] - a[1]) * (p[:, 0] - c[0]) + (a[0] - c[0]) * (p[:, 1] - c[1])) / d
        w2 = 1.0 - w0 - w1
        inside = (w0 >= -1e-6) & (w1 >= -1e-6) & (w2 >= -1e-6)
        if not inside.any():
            continue
        rows.append(p[inside, 1].astype(int))
        cols.append(p[inside, 0].astype(int))
        tris.append(np.full(int(inside.sum()), t))
        bary.append(np.stack([w0[inside], w1[inside], w2[inside]], axis=1))
    if not rows:
        return np.zeros(0, int), np.zeros(0, int), np.zeros(0, int), np.zeros((0, 3))
    return np.concatenate(rows), np.concatenate(cols), np.concatenate(tris), np.vstack(bary)


def _bilinear(image, uv):
    h, w = image.shape[:2]
    x = np.clip(uv[:, 0] * w - 0.5, 0, w - 1)
    y = np.clip(uv[:, 1] * h - 0.5, 0, h - 1)
    x0, y0 = np.floor(x).astype(int), np.floor(y).astype(int)
    x1, y1 = np.minimum(x0 + 1, w - 1), np.minimum(y0 + 1, h - 1)
    fx, fy = (x - x0)[:, None], (y - y0)[:, None]
    return (image[y0, x0] * (1 - fx) * (1 - fy) + image[y0, x1] * fx * (1 - fy)
            + image[y1, x0] * (1 - fx) * fy + image[y1, x1] * fx * fy)


def transfer(pieces, sources, color_image, normal_image, surface_image):
    """Colour LOD1's islands from the finished LOD0 atlas: each texel takes
    the colour (and roughness, metalness) of the nearest point of the LOD0
    part it was decimated from. The normal map is flat there. The islands
    are padded LOD1_PAD texels with their own edge colours."""
    color = lod.pixels_of(color_image)[..., :3].copy()
    normal = lod.pixels_of(normal_image)[..., :3].copy()
    surface = lod.pixels_of(surface_image)[..., :3].copy()
    size = color.shape[0]
    mine = np.zeros(color.shape[:2], dtype=bool)
    new_rgb = np.zeros_like(color)
    new_surface = np.zeros_like(color)
    for piece, source in zip(pieces, sources):
        rows, cols, tris, bary = rasterise(piece, size)
        _uv, co = _triangles(piece)
        points = (co[tris] * bary[:, :, None]).sum(axis=1)
        suv, sco = _triangles(source)
        tree = BVHTree.FromPolygons([tuple(v) for v in sco.reshape(-1, 3)],
                                    [(3 * t, 3 * t + 1, 3 * t + 2) for t in range(len(sco))])
        hit_uv = np.empty((len(points), 2))
        for k, p in enumerate(points):
            location, _n, t, _d = tree.find_nearest(Vector(p))
            w = poly_3d_calc([Vector(sco[t, 0]), Vector(sco[t, 1]), Vector(sco[t, 2])], location)
            hit_uv[k] = w[0] * suv[t, 0] + w[1] * suv[t, 1] + w[2] * suv[t, 2]
        new_rgb[rows, cols] = _bilinear(color, hit_uv)
        new_surface[rows, cols] = _bilinear(surface, hit_uv)
        mine[rows, cols] = True
        log(f"LOD1 {piece.name}: {len(rows)} texels coloured from {source.name}")
    padded_rgb, grown = lod.dilate(new_rgb, mine, LOD1_PAD)
    padded_surface, _ = lod.dilate(new_surface, mine, LOD1_PAD)
    color[grown] = padded_rgb[grown]
    # The half-size maps: a texel is LOD1's when any of its four is.
    half = normal.shape[0]
    factor = size // half
    small = lod.downsample(grown[..., None].astype(np.float32), factor)[..., 0] > 0
    small_surface = lod.downsample(padded_surface * grown[..., None], factor)
    weight = lod.downsample(grown[..., None].astype(np.float32), factor)[..., 0]
    small_surface = small_surface / np.maximum(weight, 1e-6)[..., None]
    normal[small] = (0.5, 0.5, 1.0)
    if surface.shape[0] == half:
        surface[small] = small_surface[small]
    rewrite(color_image, color)
    rewrite(normal_image, normal)
    rewrite(surface_image, surface)
    return grown


def coverage(objs, size, pad):
    """Texels any island of `objs` uses, grown by `pad` texels."""
    mask = np.zeros((size, size), dtype=bool)
    for obj in objs:
        rows, cols, _t, _b = rasterise(obj, size)
        mask[rows, cols] = True
        # Thin triangles may cover no texel centre: mark their corners too.
        uv, _co = _triangles(obj)
        corners = np.clip((uv.reshape(-1, 2) * size).astype(int), 0, size - 1)
        mask[corners[:, 1], corners[:, 0]] = True
    for _ in range(pad):
        grow = mask.copy()
        grow[1:] |= mask[:-1]
        grow[:-1] |= mask[1:]
        grow[:, 1:] |= mask[:, :-1]
        grow[:, :-1] |= mask[:, 1:]
        mask = grow
    return mask


def free_cells(used, cell, count):
    """`count` squares of `cell` texels, aligned to `cell`, that no used
    texel touches; from the top of the image down, left to right."""
    size = used.shape[0]
    cells = []
    for y in range(size - cell, -1, -cell):
        for x in range(0, size, cell):
            if not used[y:y + cell, x:x + cell].any():
                cells.append((x, y))
                if len(cells) == count:
                    return cells
    return cells


def rewrite(image, rgb):
    """Put new pixels into an image that whp_lod.save_image made (saved as
    a PNG and packed): packing again stores the changed pixels (the PNG in
    art/build keeps the atlas as baked)."""
    h, w = rgb.shape[:2]
    rgba = np.concatenate([np.clip(rgb, 0.0, 1.0), np.ones((h, w, 1))], axis=2).astype(np.float32)
    image.pixels.foreach_set(rgba.ravel())
    image.update()
    image.pack()
