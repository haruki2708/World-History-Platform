"""Long hair for the Gallic horseman (T-050), on the Celt's head.

Diodorus 5.28.1-2: the Gauls' hair is blond, and they make it lighter still,
washing it in lime-water and drawing it back from the forehead to the nape,
so that it is thick like a horse's mane. Strabo 4.4.3: they let their hair
grow long. The Celt model's hair is short and curly (a texture on the
head), so the horseman is given more:

  - the scalp: the head's hair-coloured faces above the brows and the
    ears, as a thick shell (roman_faces.build_hair does the same for the
    Numidian), thicker towards the back, where it is drawn to;
  - the mane: hair hanging from the back of the head down the nape onto
    the cloak's collar, a closed shell laid round the head and neck as the
    cloak is round the trunk (celt_cloak.surface), coming in a little
    towards the neck.

Both are one mesh, "Hair", with the blond hair material. Its skin weights
(weights): the head, and down the mane the neck and the top of the spine.
"""

import colorsys
import math

import bmesh
import bpy
import numpy as np
from mathutils import Vector, noise

import celt_cloak
from roman_faces import _drop_specks
from whp_common import join_objects, link_object, log
from whp_mesh import Builder, canonicalise, get_coords, recalc_normals, set_coords, smoothstep
from whp_skeleton import RIG_SCALE

# Hair faces of the head: the texture's blond, and where (finished metres):
# not the torc round the neck, nor the brows and moustache in front.
HAIR_HUE = (0.09, 0.20)
HAIR_MIN_SATURATION = 0.30
HAIR_MIN_VALUE = 0.25
SCALP_LOW = 1.490           # nothing below this (the torc, the neck)
FRONT_Y = -0.035            # in front of this, only above the hairline
HAIRLINE = 1.615

SCALP = dict(offset=0.014, back=0.006, lump=0.45, curl=0.018, ragged=0.010)     # finished metres
MANE = dict(
    centre_y=0.035,
    reach=math.radians(70.0),
    top_back=1.570, top_front=1.590,        # inside the scalp's shell
    hem_back=1.392, hem_side=1.475,         # onto the cloak's collar at the back (1.425)
    clear_top=0.012, clear=0.012,
    flare=0.006,
    drape=0.75,                              # it comes in towards the nape
    arms_x=0.20,
    band=0.008,
    bin=math.radians(8.0),
    row_power=1.0,
    hem_power=1.0,
    thickness=0.016,
)
MANE_GRID = (13, 9)
BLOND = ((0.17, 0.100, 0.030), (0.45, 0.300, 0.090))      # dark and light streaks (linear)


def _hair_mask(head):
    """Faces of the Celt's head that carry hair, by the colour of the
    texture under each face and where the face is."""
    mesh = head.data
    image = next(n.image for n in head.data.materials[0].node_tree.nodes if n.name == "whp-color")
    w, h = image.size
    px = np.empty(w * h * 4, dtype=np.float32)
    image.pixels.foreach_get(px)
    px = px.reshape(h, w, 4)
    uv = np.empty(len(mesh.loops) * 2)
    mesh.uv_layers.active.data.foreach_get("uv", uv)
    uv = uv.reshape(-1, 2)
    co = celt_cloak.to_finished(get_coords(head))
    keep = np.zeros(len(mesh.polygons), dtype=bool)
    for f, poly in enumerate(mesh.polygons):
        u = uv[list(poly.loop_indices)].mean(axis=0)
        x = min(max(int(u[0] % 1.0 * w), 0), w - 1)
        y = min(max(int(u[1] % 1.0 * h), 0), h - 1)
        hue, sat, val = colorsys.rgb_to_hsv(*px[y, x, :3])
        c = co[list(poly.vertices)].mean(axis=0)
        blond = HAIR_HUE[0] < hue < HAIR_HUE[1] and sat > HAIR_MIN_SATURATION and val > HAIR_MIN_VALUE
        keep[f] = blond and c[2] > SCALP_LOW and (c[1] > FRONT_Y or c[2] > HAIRLINE)
    return keep


def _scalp(head, material, name, s=SCALP):
    """The hair faces of the head, pushed out along their normals: thicker
    towards the back, in lumps, the edge tapering into the head."""
    keep = _hair_mask(head)
    bm = bmesh.new()
    bm.from_mesh(head.data)
    bm.faces.ensure_lookup_table()
    bmesh.ops.delete(bm, geom=[f for f, k in zip(bm.faces, keep) if not k], context="FACES")
    _drop_specks(bm, 200)
    bm.normal_update()
    edge = {v for v in bm.verts if v.is_boundary}
    ring1 = {n for v in edge for e in v.link_edges for n in e.verts} - edge
    ring2 = {n for v in ring1 for e in v.link_edges for n in e.verts} - edge - ring1
    scale = 1.0 / RIG_SCALE
    for v in bm.verts:
        taper = 0.15 if v in edge else 0.5 if v in ring1 else 0.8 if v in ring2 else 1.0
        fin = celt_cloak.to_finished(np.array(v.co))
        back = float(smoothstep(-0.03, 0.10, fin[1]))
        lump = 1.0 + s["lump"] * noise.noise(Vector(fin) / s["curl"])
        v.co += v.normal * (s["offset"] + s["back"] * back) * taper * lump * scale
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    link_object(obj)
    mesh.materials.clear()
    mesh.materials.append(material)
    for poly in mesh.polygons:
        poly.use_smooth = True
    canonicalise(obj)
    log(f"{name}: {len(mesh.polygons)} faces of hair from the head's {int(keep.sum())} hair-coloured faces")
    return obj


def _mane(material, name, c=MANE):
    columns, rows = MANE_GRID
    points = celt_cloak.body_points(("Celt_head", "Celt_body"))
    grid, uv = celt_cloak.surface(columns, rows, c, points)
    b = Builder()
    uvs = []
    celt_cloak.shell(b, grid, uv, c["thickness"], uvs)
    obj = b.object(name, [material], smooth=True)
    set_coords(obj, celt_cloak.to_celt(get_coords(obj)))
    recalc_normals(obj)
    log(f"{name}: {len(obj.data.polygons)} faces, down to {grid[-1, :, 2].min():.3f} m at the back")
    return obj


def build(materials, name="Hair"):
    """The scalp and the mane, one mesh (material "hair")."""
    head = bpy.data.objects["Celt_head"]
    scalp = _scalp(head, materials["hair"], name)
    mane = _mane(materials["hair"], name + "_mane")
    obj = join_objects([scalp, mane], name)
    canonicalise(obj)
    return obj


def material():
    import whp_materials

    return whp_materials.hair(dark=BLOND[0], light=BLOND[1], roughness=0.8)


def weights(obj, names):
    """Skin weights of the hair (rig stage, the Celt's space): the head,
    and down the nape the neck, then the top of the spine."""
    index = {n: i for i, n in enumerate(names)}
    z = celt_cloak.to_finished(get_coords(obj))[:, 2]
    w = np.zeros((len(z), len(names)), dtype=np.float32)
    head = smoothstep(1.44, 1.49, z)
    neck = (1.0 - head) * smoothstep(1.385, 1.43, z)
    w[:, index["head"]] = head
    w[:, index["neck_01"]] = neck
    w[:, index["spine_03"]] = 1.0 - head - neck
    return w
