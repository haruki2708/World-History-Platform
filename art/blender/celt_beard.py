"""Beards for the Gauls (T-061): each man his own look.

Diodorus 5.28.3: of the Gauls, some shave the beard and others let it grow
a little; the nobles shave the cheeks but let the moustache grow until it
covers the mouth. The Celt model has the moustache (in the head's
texture); a beard is a thin shell over the jaw, chin and lower cheeks of the
head: its faces copied and pushed out along their normals, as
roman_faces.build_shell does for the Roman head. Built at the start of the
stage lod on the rigged head (finished metres), so a shell keeps the head's
skin weights and follows the jaw. The mouth and the moustache stay bare.

A model lists the shells as variant parts of its LOOKS (whp_look); their
material is the colour of the head's hair, so the hair slot dyes beard and
hair alike.
"""

import bmesh
import bpy
import numpy as np

from whp_common import log

# Where a beard grows, finished metres at rest (Celt_head: the chin's
# underside at about z 1.425, the lower lip 1.465, the nose tip 1.512 at
# y -0.110; the head faces -Y).
SHAPES = {
    "Beard_short": dict(low=1.418, high=1.490, back=-0.012, offset=0.0035),
    "Beard_full": dict(low=1.395, high=1.505, back=0.000, offset=0.0075),
}
BARE = dict(half_width=0.042, low=1.458, front=-0.066)   # the mouth, the moustache and the nose
MIN_ISLAND = 30                                          # faces: smaller pieces are dropped


def _in_shape(c, shape):
    x, y, z = c
    if not (shape["low"] < z < shape["high"] and y < shape["back"]):
        return False
    return not (abs(x) < BARE["half_width"] and z > BARE["low"] and y < BARE["front"])


def hair_colour(head, is_hair, low):
    """The colour of the hair on the head, linear: the median of the texels
    under its faces above `low` (metres; not the gold torc on the neck) that
    `is_hair` (a function of h, s, v in sRGB-like values) takes for hair."""
    import colorsys
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
    # The hair as one sees it: its lighter strands (the median falls in the
    # shadows between them, and a beard of that colour reads as a dark patch).
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
    mat = bpy.data.materials.get("whp-beard")
    if mat is not None:
        return mat
    import whp_materials
    dark = tuple(c * 0.5 for c in colour)
    return whp_materials.plain("beard", colour, dark, roughness=0.85, scale=420.0, bump=0.5)


TAPER = 3       # rings of vertices from the shell's edge over which it thins into the skin


def build(head_name, colour):
    """The shells of SHAPES over the rigged head `head_name`; returns their
    objects, named after SHAPES."""
    head = bpy.data.objects[head_name]
    mat = _material(colour)
    made = []
    for name, shape in SHAPES.items():
        bm = bmesh.new()
        bm.from_mesh(head.data)
        world = head.matrix_world
        drop = [f for f in bm.faces if not _in_shape(world @ f.calc_center_median(), shape)]
        bmesh.ops.delete(bm, geom=drop, context="FACES")
        # Small pieces at the region's edges: drop them.
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
        # Thin at the edge, full a few rings in: a beard has no cut edge.
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
