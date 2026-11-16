"""A segmented low-poly figure for the farthest LOD.

Decimating a detailed figure to a couple of hundred triangles tears it
apart: its pieces are open shells (a shirt, a sleeve, a skin with holes
under them) and collapse into slivers. This builds a closed stand-in from
simple shapes laid along the skeleton instead: a tube per limb segment, an
elliptic tube for the trunk and the skirt, an ellipsoid for the head. Each
shape is sized from the vertices of the detailed figure around it and
follows one bone. Colours come from the shared atlas afterwards
(whp_lod.flat_colour_uvs).
"""

import math

import numpy as np
from mathutils import Vector

from whp_mesh import new_mesh_object


class ProxyBuilder:
    def __init__(self):
        self.verts = []
        self.faces = []
        self.bones = []            # bone name per vertex

    def _vert(self, co, bone):
        self.verts.append(tuple(float(c) for c in co))
        self.bones.append(bone)
        return len(self.verts) - 1

    def _ring(self, center, u, v, rx, ry, sides, bone, phase=0.0):
        rx, ry = float(rx), float(ry)     # numpy scalars do not multiply Vectors
        return [self._vert(center + rx * math.cos(a) * u + ry * math.sin(a) * v, bone)
                for a in (phase + 2 * math.pi * i / sides for i in range(sides))]

    def _band(self, lower, upper):
        """Quads between two rings (both counter-clockwise about the axis
        that runs from lower to upper): normals point outwards."""
        n = len(lower)
        for i in range(n):
            j = (i + 1) % n
            self.faces.append((lower[i], lower[j], upper[j], upper[i]))

    def _fan(self, center, ring, flip=False):
        n = len(ring)
        for i in range(n):
            face = (center, ring[i], ring[(i + 1) % n])
            self.faces.append(face[::-1] if flip else face)

    @staticmethod
    def _basis(direction, reference=(0.0, 0.0, 1.0)):
        d = Vector(direction).normalized()
        ref = Vector(reference)
        if abs(d.dot(ref)) > 0.95:
            ref = Vector((0.0, -1.0, 0.0))
        u = (ref - ref.dot(d) * d).normalized()
        v = d.cross(u)
        return d, u, v

    def tube(self, a, b, radii, sides, bone, extend=(0.0, 0.0), caps=(False, False), cap_length=0.0, phase=0.0):
        """A tube from a to b, radius radii[0] at a and radii[1] at b,
        lengthened by `extend` at either end (overlaps hide the joints)."""
        a, b = Vector(a), Vector(b)
        d, u, v = self._basis(b - a)
        a = a - d * extend[0]
        b = b + d * extend[1]
        lower = self._ring(a, u, v, radii[0], radii[0], sides, bone, phase)
        upper = self._ring(b, u, v, radii[1], radii[1], sides, bone, phase)
        self._band(lower, upper)
        if caps[0]:
            self._fan(self._vert(a - d * cap_length * radii[0], bone), lower, flip=True)
        if caps[1]:
            self._fan(self._vert(b + d * cap_length * radii[1], bone), upper)

    def stack(self, rings, sides, top=None, bottom=None):
        """Horizontal elliptic rings from the bottom up: (centre, rx, ry, bone).
        `top` / `bottom`: (point, bone) to close that end with a fan."""
        ids = [self._ring(Vector(c), Vector((1, 0, 0)), Vector((0, 1, 0)), rx, ry, sides, bone)
               for c, rx, ry, bone in rings]
        for lower, upper in zip(ids, ids[1:]):
            self._band(lower, upper)
        if top is not None:
            self._fan(self._vert(top[0], top[1]), ids[-1])
        if bottom is not None:
            self._fan(self._vert(bottom[0], bottom[1]), ids[0], flip=True)

    def ellipsoid(self, center, radii, sides, rings, bone):
        c = Vector(center)
        ids = []
        for k in range(1, rings):
            lat = -math.pi / 2 + math.pi * k / rings
            z = c.z + float(radii[2]) * math.sin(lat)
            ids.append(self._ring(Vector((c.x, c.y, z)), Vector((1, 0, 0)), Vector((0, 1, 0)),
                                  radii[0] * math.cos(lat), radii[1] * math.cos(lat), sides, bone))
        for lower, upper in zip(ids, ids[1:]):
            self._band(lower, upper)
        self._fan(self._vert((c.x, c.y, c.z + float(radii[2])), bone), ids[-1])
        self._fan(self._vert((c.x, c.y, c.z - float(radii[2])), bone), ids[0], flip=True)

    def object(self, name, material=None):
        obj = new_mesh_object(name, self.verts, self.faces, [material] if material else [], smooth=True)
        groups = {}
        for index, bone in enumerate(self.bones):
            groups.setdefault(bone, []).append(index)
        for bone, indices in groups.items():
            obj.vertex_groups.new(name=bone).add(indices, 1.0, "REPLACE")
        return obj


# --------------------------------------------------------------------------
# Measuring the detailed figure
# --------------------------------------------------------------------------

class Samples:
    """Vertices of the detailed figure with the bone that moves each most."""

    def __init__(self, objs):
        coords, owners = [], []
        for obj in objs:
            names = {g.index: g.name for g in obj.vertex_groups}
            for v in obj.data.vertices:
                best = max(v.groups, key=lambda g: g.weight, default=None)
                coords.append(tuple(v.co))
                owners.append(names.get(best.group) if best is not None else None)
        self.coords = np.array(coords)
        self.owners = np.array(owners, dtype=object)

    def of(self, bones):
        mask = np.isin(self.owners, list(bones))
        return self.coords[mask]

    def radii_along(self, a, b, bones, percentile=85, floor=0.02):
        """Radius of the body around segment a-b near either end."""
        pts = self.of(bones)
        a, b = np.array(a), np.array(b)
        d = b - a
        length = np.linalg.norm(d)
        d = d / length
        t = (pts - a) @ d / length
        radial = np.linalg.norm((pts - a) - np.outer(t * length, d), axis=1)
        out = []
        for lo, hi in ((-0.1, 0.4), (0.6, 1.1)):
            sel = radial[(t > lo) & (t < hi) & (radial < 0.25)]
            out.append(max(float(np.percentile(sel, percentile)), floor) if len(sel) else floor)
        return out

    def slice(self, z, bones, half=0.025, max_abs_x=0.32, percentile=96):
        """Half width, half depth and centre (y) of a horizontal slice."""
        pts = self.of(bones)
        sel = pts[(np.abs(pts[:, 2] - z) < half) & (np.abs(pts[:, 0]) < max_abs_x)]
        if len(sel) == 0:
            return None
        cy = float((np.percentile(sel[:, 1], 98) + np.percentile(sel[:, 1], 2)) / 2)
        rx = float(np.percentile(np.abs(sel[:, 0]), percentile))
        ry = float(np.percentile(np.abs(sel[:, 1] - cy), percentile))
        return rx, ry, cy
