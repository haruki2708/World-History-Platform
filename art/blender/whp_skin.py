"""Skin weights and linear blend skinning with numpy.

Weights are copied from an already skinned body (the Celt) by looking up
the nearest point on its surface, then smoothed over the mesh. The same
weights drive `blend`, which moves a mesh with one affine matrix per bone:
this is how a model is brought from its own pose and proportions onto the
shared rig.
"""

import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from mathutils.interpolate import poly_3d_calc

MAX_INFLUENCES = 4


def blend(coords, weights, matrices):
    """Linear blend skinning. coords (n, 3), weights (n, b), matrices (b, 4, 4)."""
    homogeneous = np.concatenate([coords, np.ones((len(coords), 1))], axis=1)
    # Blend the matrices per vertex, then apply.
    out = np.zeros((len(coords), 3))
    for b in np.nonzero(weights.sum(axis=0) > 0)[0]:
        out += weights[:, b:b + 1] * (homogeneous @ matrices[b][:3, :].T)
    return out


class _Surface:
    def __init__(self, coords, triangles):
        self.triangles = triangles
        self.tree = BVHTree.FromPolygons([tuple(c) for c in coords], [tuple(int(i) for i in t) for t in triangles])


class WeightSource:
    """A skinned surface to copy weights from.

    Lookups are by side: a point on the body's left never takes weights
    from a part of the surface that belongs to a right limb, and the other
    way round. Without this, the inside of one leg picks up the other leg
    wherever the two bodies' legs do not line up exactly.
    """

    CENTRE = 0.003      # metres either side of x = 0 that may use both sides

    def __init__(self, coords, triangles, weights, bone_names):
        self.coords = coords
        self.weights = weights
        left = np.array([name.endswith("_l") for name in bone_names])
        right = np.array([name.endswith("_r") for name in bone_names])
        self.left_bones, self.right_bones = left, right
        tri_weights = weights[triangles].mean(axis=1)
        is_left = tri_weights[:, left].sum(axis=1) > 0.5
        is_right = tri_weights[:, right].sum(axis=1) > 0.5
        self.any = _Surface(coords, triangles)
        self.not_right = _Surface(coords, triangles[~is_right])
        self.not_left = _Surface(coords, triangles[~is_left])

    def _lookup(self, surface, banned, p):
        location, _normal, tri, _dist = surface.tree.find_nearest(Vector(p))
        a, b, c = surface.triangles[tri]
        bary = poly_3d_calc([Vector(self.coords[a]), Vector(self.coords[b]), Vector(self.coords[c])], location)
        w = bary[0] * self.weights[a] + bary[1] * self.weights[b] + bary[2] * self.weights[c]
        w = np.where(banned, 0.0, w)
        return w / max(float(w.sum()), 1e-9)

    def sample(self, points):
        """Weights at the nearest surface point of each query point.

        A point on the centre line can be exactly as far from a left face
        as from its mirror image on the right; which one the lookup returns
        then varies from run to run. Such points take the mean of a
        left-side and a right-side lookup: the same every time, and
        symmetric."""
        out = np.zeros((len(points), self.weights.shape[1]), dtype=np.float32)
        for i, p in enumerate(points):
            if p[0] > self.CENTRE:
                out[i] = self._lookup(self.not_right, self.right_bones, p)
            elif p[0] < -self.CENTRE:
                out[i] = self._lookup(self.not_left, self.left_bones, p)
            else:
                out[i] = 0.5 * (self._lookup(self.not_right, self.right_bones, p)
                                + self._lookup(self.not_left, self.left_bones, p))
        return out


def mesh_edges(mesh):
    edges = np.empty(len(mesh.edges) * 2, dtype=np.int64)
    mesh.edges.foreach_get("vertices", edges)
    return edges.reshape(-1, 2)


def smooth(weights, edges, iterations, factor=0.5):
    """Laplacian smoothing of the weights over the mesh's edges."""
    n = len(weights)
    degree = np.zeros(n)
    np.add.at(degree, edges[:, 0], 1.0)
    np.add.at(degree, edges[:, 1], 1.0)
    degree = np.maximum(degree, 1.0)[:, None]
    for _ in range(iterations):
        total = np.zeros_like(weights)
        np.add.at(total, edges[:, 0], weights[edges[:, 1]])
        np.add.at(total, edges[:, 1], weights[edges[:, 0]])
        weights = (1.0 - factor) * weights + factor * (total / degree)
    return weights


def merge_bones(weights, bone_index, groups):
    """Fold the weights of some bones into another: {target: [sources]}."""
    for target, sources in groups.items():
        t = bone_index[target]
        for source in sources:
            s = bone_index[source]
            weights[:, t] += weights[:, s]
            weights[:, s] = 0.0
    return weights


def prune(weights, limit=MAX_INFLUENCES, threshold=0.01):
    """Keep the strongest `limit` bones per vertex and renormalise."""
    weights = np.where(weights < threshold, 0.0, weights)
    if weights.shape[1] > limit:
        cut = np.partition(weights, -limit, axis=1)[:, -limit][:, None]
        weights = np.where(weights >= np.maximum(cut, 1e-9), weights, 0.0)
    total = weights.sum(axis=1, keepdims=True)
    return weights / np.where(total > 0, total, 1.0)


def rigid(count, bone_count, bone):
    weights = np.zeros((count, bone_count), dtype=np.float32)
    weights[:, bone] = 1.0
    return weights


def write_groups(obj, weights, bone_names):
    """Replace the object's vertex groups with the weight matrix."""
    obj.vertex_groups.clear()
    for b in np.nonzero(weights.max(axis=0) > 0)[0]:
        group = obj.vertex_groups.new(name=bone_names[b])
        column = weights[:, b]
        verts = np.nonzero(column > 0)[0]
        # Batch vertices that share a weight (rigid parts are one call).
        values, inverse = np.unique(np.round(column[verts], 4), return_inverse=True)
        for k, value in enumerate(values):
            group.add([int(i) for i in verts[inverse == k]], float(value), "REPLACE")


def read_groups(obj, bone_names):
    """The object's vertex groups as a weight matrix."""
    index = {name: i for i, name in enumerate(bone_names)}
    weights = np.zeros((len(obj.data.vertices), len(bone_names)), dtype=np.float32)
    group_bone = {g.index: index[g.name] for g in obj.vertex_groups if g.name in index}
    for v in obj.data.vertices:
        for g in v.groups:
            bone = group_bone.get(g.group)
            if bone is not None:
                weights[v.index, bone] = g.weight
    return weights
