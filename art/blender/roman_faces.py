"""Other faces on the Roman source body: beards, hair and skin tone.

Every model built on "Roman Soldier - T pose" has the same head. For the
peoples of Hannibal's army the skin texture is tinted (roman_source.tint)
and a beard or a cap of hair is added as a thin shell over the head mesh:
the faces of a region of the head, copied and pushed out along their
normals. Regions are boxes in the source model's space (metres, T pose,
Z up, facing -Y), read off cross sections of the head: chin about
z 1.58-1.60, mouth 1.63, nose tip 1.67, brows 1.73, crown 1.84.
"""

import bmesh
import bpy
import numpy as np

from whp_common import link_object, log
from whp_mesh import canonicalise

# Skin tints, multiplied into the source textures.
SKIN = {
    "libyan": (0.66, 0.50, 0.40),        # North African: darker, warm
    "iberian": (0.88, 0.76, 0.64),       # olive
    "balearic": (0.80, 0.66, 0.54),      # olive, weathered
}

# Hair colours (linear RGB), for the hair material.
HAIR_DARK = ((0.050, 0.034, 0.022), (0.016, 0.011, 0.008))


def _beard(c):
    """Chin, jaw and cheeks below the cheekbones, in front of the ears, but
    not the lips."""
    x, y, z = c[:, 0], c[:, 1], c[:, 2]
    jaw = (z > 1.548) & (z < 1.632) & (y < 0.025)
    cheeks = (z > 1.548) & (z < 1.664) & (np.abs(x) > 0.060) & (y > -0.060) & (y < 0.020)
    lips = (np.abs(x) < 0.030) & (z > 1.610) & (y < -0.070)
    moustache = (np.abs(x) < 0.045) & (z > 1.632) & (z < 1.652) & (y < -0.080)
    return (jaw | cheeks | moustache) & ~lips


def _scalp(c):
    """The hair of the head: above the ears and brows, all round."""
    x, y, z = c[:, 0], c[:, 1], c[:, 2]
    front = (y < -0.06)
    return (z > 1.735) | ((z > 1.665) & ~front & (y > -0.03)) | ((z > 1.60) & (y > 0.06))


REGIONS = {"beard": _beard, "scalp": _scalp}


MIN_ISLAND = 40         # faces: smaller separate pieces of a selection are dropped


def _drop_specks(bm, smallest):
    """Delete connected pieces of fewer than `smallest` faces."""
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
        if len(piece) < smallest:
            specks += piece
    if specks:
        bmesh.ops.delete(bm, geom=specks, context="FACES")


def build_shell(head, region, offset, materials, name):
    """Copy the faces of `head` whose centres lie in REGIONS[region] and push
    them out by `offset` (source units) along the vertex normals. Material:
    "hair"."""
    bm = bmesh.new()
    bm.from_mesh(head.data)
    bm.faces.ensure_lookup_table()
    centres = np.array([f.calc_center_median() for f in bm.faces])
    keep = REGIONS[region](centres)
    bmesh.ops.delete(bm, geom=[f for f, k in zip(bm.faces, keep) if not k], context="FACES")
    _drop_specks(bm, MIN_ISLAND)
    bm.normal_update()
    # Full thickness inside, tapering to the skin over the last two rings of
    # vertices, so the ragged edge of the face selection melts into the head.
    edge = {v for v in bm.verts if v.is_boundary}
    near = {n for v in edge for e in v.link_edges for n in e.verts} - edge
    for v in bm.verts:
        v.co += v.normal * offset * (0.15 if v in edge else 0.6 if v in near else 1.0)
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    link_object(obj)
    obj.matrix_world = head.matrix_world
    mesh.materials.clear()
    mesh.materials.append(materials["hair"])
    for poly in mesh.polygons:
        poly.use_smooth = True
    canonicalise(obj)
    log(f"{name}: {len(mesh.polygons)} faces from the {region} of {head.name}")
    return obj
