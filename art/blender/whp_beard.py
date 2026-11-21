"""Beards as variant shapes (T-061): each man his own look.

A beard is a thin shell over the jaw, chin and lower cheeks of a head: the
head's faces in a region copied and pushed out along their normals, as
roman_faces.build_shell does at the stage kit. Here it is built at the start
of the stage lod (a unit module's before_lod) on the rigged head, in
finished metres at rest, so the shell keeps the head's skin weights and
follows the jaw. The shell thins over its last rings of vertices, so it has
no cut edge.

The shapes of a head are its own (celt_beard for the Celt, roman_beard for
the Roman head): each `low`, `high` (z), `back` (y; the head faces -Y),
`offset` (metres out from the skin) and `bare`, boxes kept bare (the mouth,
the nose, a moustache drawn in the texture): (half width in x, z from, z to,
y in front of). A model lists the shells as variant parts of its LOOKS
(whp_look), in the hair slot, so one colour dyes hair and beard alike.

Kit that lies close on the face (a helmet's cheek pieces, a collar) is
passed as `avoid`: the beard stops short of it, so it never shows through.
The shapes are given for a man on foot; a horseman's are moved by the lift
of his rest pose (whp_look.rider_lift).
"""

import colorsys

import bmesh
import bpy
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

import whp_look
from whp_common import log

MIN_ISLAND = 30     # faces: smaller pieces at the region's edges are dropped
TAPER = 3           # rings of vertices from the shell's edge over which it thins into the skin
CLEAR = 0.003       # metres kept between the beard's surface and kit it must not show through
MATERIAL = "whp-beard"


def _in_shape(c, shape):
    x, y, z = c
    if not (shape["low"] < z < shape["high"] and y < shape["back"]):
        return False
    return not any(abs(x) < hw and lo < z < hi and y < front for hw, lo, hi, front in shape["bare"])


def hair_colour(head, is_hair, low):
    """The colour of the hair on the head, linear: of the texels under its
    faces above `low` (metres; not a torc on the neck) that `is_hair` (a
    function of h, s, v in sRGB-like values) takes for hair, the lighter
    strands (55th to 85th percentile of luminance): the median falls in the
    shadows between them, and a beard of that colour reads as a dark patch."""
    image = head.data.materials[0].node_tree.nodes["whp-color"].image
    w, h = image.size
    px = np.empty(w * h * 4, dtype=np.float32)
    image.pixels.foreach_get(px)
    px = px.reshape(h, w, 4)[..., :3]
    me = head.data
    uvs = me.uv_layers.active.data
    world = head.matrix_world
    picked = []
    for poly in me.polygons:
        if (world @ poly.center).z <= low:
            continue
        uv = np.mean([uvs[li].uv[:] for li in poly.loop_indices], axis=0)
        c = px[min(int(uv[1] * h), h - 1), min(int(uv[0] * w), w - 1)]
        if is_hair(*colorsys.rgb_to_hsv(*c)):
            picked.append(c)
    if picked:
        picked = np.array(picked)
        lum = picked @ np.array([0.2126, 0.7152, 0.0722])
        lo, hi = np.percentile(lum, 55), np.percentile(lum, 85)
        rgb = picked[(lum >= lo) & (lum <= hi)].mean(axis=0)
    else:
        rgb = np.array((0.75, 0.62, 0.40))
    linear = np.where(rgb <= 0.04045, rgb / 12.92, ((rgb + 0.055) / 1.055) ** 2.4)
    log(f"beard colour from {len(picked)} faces of hair: sRGB {(rgb * 255).round()}")
    return tuple(float(c) for c in linear)


def _material(colour):
    mat = bpy.data.materials.get(MATERIAL)
    if mat is not None:
        return mat
    import whp_materials
    dark = tuple(c * 0.5 for c in colour)
    return whp_materials.plain(MATERIAL[len("whp-"):], colour, dark, roughness=0.85, scale=420.0, bump=0.5)


def _trees(names):
    """BVH trees of the objects `names`, in world space (finished metres at rest)."""
    trees = []
    for name in names:
        obj = bpy.data.objects[name]
        m = obj.matrix_world
        trees.append(BVHTree.FromPolygons([m @ v.co for v in obj.data.vertices],
                                          [tuple(p.vertices) for p in obj.data.polygons]))
    return trees


def _too_close(trees, point, reach):
    for tree in trees:
        loc, _normal, _index, dist = tree.find_nearest(point, reach)
        if loc is not None and dist < reach:
            return True
    return False


def build(head_name, shapes, colour, avoid=(), material=None):
    """The shells `shapes` (name -> shape) over the rigged head `head_name`,
    in `material` (a model's own hair) or else MATERIAL of `colour`
    (linear), short of the objects `avoid`; returns their objects."""
    head = bpy.data.objects[head_name]
    mat = material or _material(colour)
    trees = _trees(avoid)
    shift = Vector(whp_look.rider_lift())
    made = []
    for name, shape in shapes.items():
        bm = bmesh.new()
        bm.from_mesh(head.data)
        world = head.matrix_world
        reach = shape["offset"] + CLEAR
        drop = []
        for f in bm.faces:
            c = world @ f.calc_center_median()
            if not _in_shape(c - shift, shape) or (trees and _too_close(trees, c, reach)):
                drop.append(f)
        bmesh.ops.delete(bm, geom=drop, context="FACES")
        seen, specks = set(), []
        for face in bm.faces:
            if face in seen:
                continue
            piece, stack = [], [face]
            seen.add(face)
            while stack:
                f = stack.pop()
                piece.append(f)
                for e in f.edges:
                    for g in e.link_faces:
                        if g not in seen:
                            seen.add(g)
                            stack.append(g)
            if len(piece) < MIN_ISLAND:
                specks += piece
        if specks:
            bmesh.ops.delete(bm, geom=specks, context="FACES")
        bm.normal_update()
        ring = {v: 0 for v in bm.verts if any(e.is_boundary for e in v.link_edges)}
        frontier = list(ring)
        for step in range(1, TAPER + 1):
            nxt = []
            for v in frontier:
                for e in v.link_edges:
                    w = e.other_vert(v)
                    if w not in ring:
                        ring[w] = step
                        nxt.append(w)
            frontier = nxt
        for v in bm.verts:
            v.co += v.normal * shape["offset"] * (0.15 + 0.85 * min(ring.get(v, TAPER), TAPER) / TAPER)
        mesh = bpy.data.meshes.new(name)
        bm.to_mesh(mesh)
        bm.free()
        # No canonicalise: only deletions, which keep the faces in order; and it would drop the weights.
        mesh.materials.clear()
        mesh.materials.append(mat)
        obj = bpy.data.objects.new(name, mesh)
        for collection in head.users_collection:
            collection.objects.link(obj)
        obj.parent = head.parent
        obj.matrix_world = head.matrix_world.copy()
        for group in head.vertex_groups:
            obj.vertex_groups.new(name=group.name)
        for mod in head.modifiers:
            if mod.type == "ARMATURE":
                new = obj.modifiers.new(mod.name, "ARMATURE")
                new.object = mod.object
        for poly in mesh.polygons:
            poly.use_smooth = True
        log(f"{name}: {len(mesh.polygons)} faces over the jaw, {shape['offset'] * 1000:.1f} mm out")
        made.append(obj)
    return made
