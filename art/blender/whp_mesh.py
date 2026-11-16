"""Small mesh helpers: numpy access to vertices and generated geometry."""

import math

import bmesh
import bpy
import numpy as np


def get_coords(obj):
    mesh = obj.data
    co = np.empty(len(mesh.vertices) * 3, dtype=np.float64)
    mesh.vertices.foreach_get("co", co)
    return co.reshape(-1, 3)


def set_coords(obj, co):
    mesh = obj.data
    mesh.vertices.foreach_set("co", np.asarray(co, dtype=np.float64).ravel())
    mesh.update()


def smoothstep(edge0, edge1, x):
    t = np.clip((np.asarray(x, dtype=np.float64) - edge0) / (edge1 - edge0), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def rotate_about_axis(points, pivot, axis, angles):
    """Rotate each point about the line through `pivot` along the unit vector
    `axis` by its own angle (radians, array)."""
    axis = np.asarray(axis, dtype=np.float64)
    axis = axis / np.linalg.norm(axis)
    rel = points - np.asarray(pivot, dtype=np.float64)
    cos = np.cos(angles)[:, None]
    sin = np.sin(angles)[:, None]
    dot = (rel @ axis)[:, None]
    cross = np.cross(np.broadcast_to(axis, rel.shape), rel)
    return rel * cos + cross * sin + axis * dot * (1.0 - cos) + pivot


def new_mesh_object(name, verts, faces, materials=(), face_materials=None, smooth=True, collection=None):
    """Create a mesh object from vertex and face lists. `face_materials`
    gives a material slot index per face."""
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata([tuple(v) for v in verts], [], [tuple(f) for f in faces])
    for mat in materials:
        mesh.materials.append(mat)
    if face_materials is not None:
        mesh.polygons.foreach_set("material_index", list(face_materials))
    mesh.polygons.foreach_set("use_smooth", [smooth] * len(mesh.polygons))
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    (collection or bpy.context.scene.collection).objects.link(obj)
    return obj


def recalc_normals(obj, inside=False):
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    if inside:
        bmesh.ops.reverse_faces(bm, faces=bm.faces)
    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()


def merge_by_distance(obj, distance=1e-5):
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=distance)
    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()


def apply_modifiers(obj):
    """Bake the modifier stack into the mesh data."""
    deps = bpy.context.evaluated_depsgraph_get()
    evaluated = obj.evaluated_get(deps)
    mesh = bpy.data.meshes.new_from_object(evaluated, preserve_all_data_layers=True, depsgraph=deps)
    old = obj.data
    obj.modifiers.clear()
    obj.data = mesh
    mesh.name = old.name
    if old.users == 0:
        bpy.data.meshes.remove(old)
    return obj


def set_material(obj, material):
    obj.data.materials.clear()
    obj.data.materials.append(material)


class Builder:
    """Collects vertices and faces of a generated mesh, with one material
    slot index per face."""

    def __init__(self):
        self.verts = []
        self.faces = []
        self.slots = []

    def vert(self, co):
        self.verts.append((float(co[0]), float(co[1]), float(co[2])))
        return len(self.verts) - 1

    def face(self, indices, slot=0, flip=False):
        indices = list(indices)
        if len(set(indices)) < 3:
            return
        self.faces.append(indices[::-1] if flip else indices)
        self.slots.append(slot)

    def grid(self, rows, slot=0, flip=False, close_u=False, slot_fn=None):
        """Faces between consecutive rows of vertex indices. Rows are lists
        of equal length; `close_u` joins the last column to the first.
        `slot_fn(row, column)` overrides the slot per quad."""
        for r in range(len(rows) - 1):
            a, b = rows[r], rows[r + 1]
            n = len(a)
            for c in range(n if close_u else n - 1):
                d = (c + 1) % n
                s = slot_fn(r, c) if slot_fn else slot
                self.face([a[c], a[d], b[d], b[c]], s, flip)

    def fan(self, center, ring, slot=0, flip=False, close=True):
        n = len(ring)
        for c in range(n if close else n - 1):
            self.face([center, ring[c], ring[(c + 1) % n]], slot, flip)

    def object(self, name, materials, smooth=True, collection=None):
        obj = new_mesh_object(name, self.verts, self.faces, materials, self.slots, smooth, collection)
        merge_by_distance(obj, 1e-6)
        return obj


def ring_points(center, radius_x, radius_y, z, segments, start=0.0):
    """Points of a horizontal ellipse, counter-clockwise seen from above."""
    pts = []
    for i in range(segments):
        a = start + 2.0 * math.pi * i / segments
        pts.append((center[0] + radius_x * math.cos(a), center[1] + radius_y * math.sin(a), z))
    return pts
