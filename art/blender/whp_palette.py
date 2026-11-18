"""A small palette for the farthest level (LOD2): few vertices, flat colours.

LOD2 used to give every triangle its own point in the atlas
(whp_lod.flat_colour_uvs), so no two triangles shared a corner: about 3.4
vertices for every distinct position (T-031). Here every triangle gets one
entry of a small palette instead, and triangles of the same entry share
their corners.

  1. Each triangle's colour is read from the atlas under it (seven samples,
     the one nearest their mean, as flat_colour_uvs does), with its
     roughness and metalness.
  2. The colours are merged into a palette (OKLab, area-weighted means)
     while the two nearest entries are less than MERGE apart.
  3. A triangle may take the entry of a neighbour when that changes its
     colour by less than CAP and saves corners: each corner it would stop
     splitting off is worth SPLIT_COST of colour difference (iterated
     conditional modes, in a fixed order).
  4. Each entry is a CELL x CELL square of one colour in a part of the
     atlas no island uses (PaletteCells); the normal map is flat there and
     the metallicRoughness map holds the entry's values. Every corner of a
     triangle points at the centre of its entry's square: the UVs do not
     vary across a triangle, so the GPU reads the full-size image there.

The exporter writes JPEGs, which keep colour in blocks of 16 x 16 texels:
a square is 32 texels in the colour image and 16 in the half-size normal
and metallicRoughness maps, aligned to those blocks, so each entry comes
out of the file as it went in.
"""

import numpy as np

import whp_far
import whp_lod as lod
from whp_common import log

MERGE = 0.04            # OKLab distance under which two palette entries are merged
CAP = 0.12              # most a triangle's colour may change to take a neighbour's entry
SPLIT_COST = 0.03       # colour difference a shared corner is worth
CELL = 32               # texels of one entry's square at the colour image's size (16 in the half-size maps)


# --------------------------------------------------------------------------
# Colour
# --------------------------------------------------------------------------

def srgb_to_linear(c):
    c = np.clip(c, 0.0, 1.0)
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


_M1 = np.array([[0.4122214708, 0.5363325363, 0.0514459929], [0.2119034982, 0.6806995451, 0.1073969566],
                [0.0883024619, 0.2817188376, 0.6299787005]])
_M2 = np.array([[0.2104542553, 0.7936177850, -0.0040720468], [1.9779984951, -2.4285922050, 0.4505937099],
                [0.0259040371, 0.7827717662, -0.8086757660]])


def oklab(linear):
    return np.cbrt(linear @ _M1.T) @ _M2.T


def from_oklab(lab):
    lms = (lab @ np.linalg.inv(_M2).T) ** 3
    return np.clip(lms @ np.linalg.inv(_M1).T, 0.0, 1.0)


# --------------------------------------------------------------------------
# Where the entries go
# --------------------------------------------------------------------------

class PaletteCells:
    """Where the entries go: squares of CELL texels of the colour image
    (origin at the bottom left, as Blender's UVs) that no island uses
    (whp_far.free_cells), aligned to CELL."""

    def __init__(self, cells, size):
        for x, y in cells:
            assert x % CELL == 0 and y % CELL == 0 and (size - y) % CELL == 0
        self.cells, self.size = list(cells), size
        self.capacity = len(self.cells)

    def cell(self, k):
        """Texel origin of entry k's square."""
        return self.cells[k]

    def uv(self, k):
        x, y = self.cell(k)
        return ((x + CELL / 2) / self.size, (y + CELL / 2) / self.size)


# --------------------------------------------------------------------------
# Sampling the atlas under each triangle
# --------------------------------------------------------------------------

def _triangles(obj):
    """Loop UVs (n, 3, 2), vertex indices (n, 3) and areas (n,) of a triangulated mesh."""
    mesh = obj.data
    n = len(mesh.polygons)
    uv = np.empty(len(mesh.loops) * 2)
    mesh.uv_layers[lod.UV_NAME].data.foreach_get("uv", uv)
    verts = np.empty(len(mesh.loops), dtype=np.int64)
    mesh.loops.foreach_get("vertex_index", verts)
    areas = np.empty(n)
    mesh.polygons.foreach_get("area", areas)
    return uv.reshape(n, 3, 2), verts.reshape(n, 3), areas


def _sample(image_pixels, uv):
    h, w = image_pixels.shape[:2]
    x = np.clip((uv[..., 0] * w).astype(np.int64), 0, w - 1)
    y = np.clip((uv[..., 1] * h).astype(np.int64), 0, h - 1)
    return image_pixels[y, x, :3]


def _triangle_colours(uv, colour, surface):
    """Per triangle: the sample (of seven under it) nearest their mean colour,
    and the surface values at that sample."""
    centre = uv.mean(axis=1)
    points = [centre] + [centre + 0.6 * (uv[:, i] - centre) for i in range(3)] + \
             [centre + 0.6 * ((uv[:, i] + uv[:, (i + 1) % 3]) / 2 - centre) for i in range(3)]
    points = np.stack(points, axis=1)                       # (n, 7, 2)
    samples = _sample(colour, points)                       # (n, 7, 3), sRGB-encoded
    mean = samples.mean(axis=1, keepdims=True)
    best = np.argmin(np.linalg.norm(samples - mean, axis=2), axis=1)
    rows = np.arange(len(uv))
    chosen = points[rows, best]
    return samples[rows, best], _sample(surface, chosen)


# --------------------------------------------------------------------------
# The palette
# --------------------------------------------------------------------------

def _merge(lab, area, threshold):
    """Agglomerative merging of the triangles' colours: returns the entry
    of each triangle and the entries' OKLab colours."""
    keys = {}
    clusters = []                                   # [weighted sum, weight, members]
    for i, value in enumerate(lab):
        key = tuple(np.round(value, 5))
        if key not in keys:
            keys[key] = len(clusters)
            clusters.append([np.zeros(3), 0.0, []])
        c = clusters[keys[key]]
        c[0] = c[0] + value * max(area[i], 1e-9)
        c[1] += max(area[i], 1e-9)
        c[2].append(i)
    centres = np.array([c[0] / c[1] for c in clusters])
    weights = [c[1] for c in clusters]
    members = [c[2] for c in clusters]
    while len(centres) > 1:
        d = np.linalg.norm(centres[:, None] - centres[None], axis=2)
        np.fill_diagonal(d, np.inf)
        i, j = np.unravel_index(int(np.argmin(d)), d.shape)
        if d[i, j] > threshold:
            break
        i, j = min(i, j), max(i, j)
        total = weights[i] + weights[j]
        centres[i] = (centres[i] * weights[i] + centres[j] * weights[j]) / total
        weights[i] = total
        members[i] = members[i] + members[j]
        centres = np.delete(centres, j, axis=0)
        del weights[j]
        del members[j]
    entry = np.empty(len(lab), dtype=np.int64)
    for k, m in enumerate(members):
        entry[m] = k
    return entry, centres


def _smooth(entry, lab, centres, pieces):
    """Iterated conditional modes: a triangle takes the entry, among its own
    and its neighbours', that costs least (colour difference plus SPLIT_COST
    per corner shared with a triangle of another entry), never one more
    than CAP from its colour. `pieces`: (first triangle, vertex indices
    (n, 3)) of each mesh; triangles of different meshes share no corner."""
    corner_tris = []                                # per triangle: for each corner, the other triangles there
    for first, verts in pieces:
        at = {}
        for t, tri in enumerate(verts):
            for v in tri:
                at.setdefault(int(v), []).append(first + t)
        for t, tri in enumerate(verts):
            corner_tris.append([[g for g in at[int(v)] if g != first + t] for v in tri])
    for _ in range(30):
        changed = 0
        for t in range(len(entry)):
            options = {int(entry[t])}
            for others in corner_tris[t]:
                options.update(int(entry[g]) for g in others)
            best, best_cost = int(entry[t]), None
            for k in sorted(options):
                diff = float(np.linalg.norm(lab[t] - centres[k]))
                if k != entry[t] and diff > CAP:
                    continue
                split = sum(1 for others in corner_tris[t] for g in others if entry[g] != k)
                cost = diff + SPLIT_COST * split
                if best_cost is None or cost < best_cost - 1e-12:
                    best, best_cost = k, cost
            if best != entry[t]:
                entry[t] = best
                changed += 1
        if not changed:
            break
    return entry


def material_images(material):
    """The colour, normal and metallicRoughness images of the model's one
    material (whp_lod.final_material)."""
    found = {}
    for link in material.node_tree.links:
        node = link.from_node
        if node.type != "TEX_IMAGE":
            continue
        to = link.to_node
        if to.type == "BSDF_PRINCIPLED" and link.to_socket.name == "Base Color":
            found["color"] = node.image
        elif to.type == "NORMAL_MAP":
            found["normal"] = node.image
        elif to.type == "SEPRGB" or to.bl_idname == "ShaderNodeSeparateColor":
            found["surface"] = node.image
    return found["color"], found["normal"], found["surface"]


def apply(objs, color_image, normal_image, surface_image, cells):
    """Give the LOD2 meshes `objs` (triangulated, with atlas UVs) palette
    colours: write the entries into the three images (in `cells`) and point
    every triangle's UVs at its entry. Returns the number of entries."""
    colour = lod.pixels_of(color_image)
    surface = lod.pixels_of(surface_image)
    data = [_triangles(o) for o in objs]
    srgb, surf, areas, pieces = [], [], [], []
    first = 0
    for uv, verts, area in data:
        c, s = _triangle_colours(uv, colour, surface)
        srgb.append(c)
        surf.append(s)
        areas.append(area)
        pieces.append((first, verts))
        first += len(verts)
    srgb, surf, areas = np.vstack(srgb), np.vstack(surf), np.concatenate(areas)
    lab = oklab(srgb_to_linear(srgb))
    entry, centres = _merge(lab, areas, MERGE)
    entry = _smooth(entry, lab, centres, pieces)

    # Entries in use, in order of first use; their colours as the means of their triangles.
    used = []
    for k in entry:
        if int(k) not in used:
            used.append(int(k))
    if len(used) > cells.capacity:
        raise RuntimeError(f"palette of {len(used)} entries, free cells for {cells.capacity}")
    index = {k: i for i, k in enumerate(used)}
    entry = np.array([index[int(k)] for k in entry])
    error = []
    rgb_out = colour[..., :3].copy()
    normal = lod.pixels_of(normal_image)[..., :3].copy()
    surface_out = surface[..., :3].copy()
    nscale = normal.shape[0] / cells.size
    sscale = surface.shape[0] / cells.size
    for k in range(len(used)):
        mine = entry == k
        w = areas[mine] + 1e-9
        mean_lab = (lab[mine] * w[:, None]).sum(axis=0) / w.sum()
        error.append(np.linalg.norm(lab[mine] - mean_lab, axis=1))
        value = lod.linear_to_srgb(from_oklab(mean_lab[None]))[0]
        rough = float((surf[mine, 1] * w).sum() / w.sum())
        metal = float((surf[mine, 2] * w).sum() / w.sum())
        x, y = cells.cell(k)
        rgb_out[y:y + CELL, x:x + CELL] = value
        nx, ny, nc = int(x * nscale), int(y * nscale), max(int(CELL * nscale), 1)
        normal[ny:ny + nc, nx:nx + nc] = (0.5, 0.5, 1.0)
        sx, sy, sc = int(x * sscale), int(y * sscale), max(int(CELL * sscale), 1)
        surface_out[sy:sy + sc, sx:sx + sc] = (1.0, rough, metal)
    error = np.concatenate(error)
    whp_far.rewrite(color_image, rgb_out)
    whp_far.rewrite(normal_image, normal)
    whp_far.rewrite(surface_image, surface_out)

    for obj, (start, verts) in zip(objs, pieces):
        n = len(verts)
        uv = np.array([cells.uv(int(k)) for k in entry[start:start + n]])
        obj.data.uv_layers[lod.UV_NAME].data.foreach_set("uv", np.repeat(uv, 3, axis=0).ravel())
        obj.data.update()
    log(f"LOD2 palette: {len(used)} colours for {len(entry)} triangles; colour change mean {error.mean():.4f}, "
        f"largest {error.max():.4f} (OKLab)")
    return len(used)
