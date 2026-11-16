"""Mail shirt (lorica hamata), shoulder doubling and belt, generated.

All three are shells cut out of the source tunic and pushed outwards, so
they follow the body and deform with it: the shirt from mid-thigh to the
neck with short cap sleeves, the doubled shoulder pieces as a yoke with two
flaps on the chest, the belt as a band at the waist. The ring pattern is a
material (whp_materials.mail). Source-model space: T pose, Z up, facing -Y.
"""

import bmesh
import bpy
from mathutils import Vector

from whp_common import link_object, log
from whp_mesh import Builder

TORSO_Y = 0.03          # the tunic's front-to-back middle

HEM_Z = 0.755           # mid-thigh
SLEEVE_X = 0.285        # where the cap sleeves end
SHIRT_OFFSET = 0.010

YOKE_OFFSET = 0.017     # from the tunic: 7 mm proud of the shirt
YOKE_BACK_Z = 1.365
YOKE_FLAP_Z = 1.315     # lower end of the chest flaps
YOKE_FLAP_X = (0.048, 0.172)
YOKE_STEP_Z = 1.445     # above this the yoke runs out to the sleeve
YOKE_BORDER = 0.013     # width of the leather binding

BELT_Z = (1.030, 1.078)
BELT_OFFSET = 0.0145
BELT_PLATE_X = 0.034    # half width of the bronze buckle plate


def _bisect(bm, co, no):
    geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
    bmesh.ops.bisect_plane(bm, geom=geom, dist=1e-5, plane_co=co, plane_no=no)


def _cut_planes(bm, xs=(), zs=()):
    for x in xs:
        for side in (1, -1):
            _bisect(bm, (x * side, 0, 0), (1, 0, 0))
    for z in zs:
        _bisect(bm, (0, 0, z), (0, 0, 1))


def _shell(tunic, name, keep, xs, zs, offset, smooth, slot_of, materials):
    """Cut the part of the tunic where keep(centre) holds, relax it, and push
    it out along the normals by `offset`. The cut edges get a strip back down
    to the tunic so the shell reads as thick. slot_of(centre) picks the
    material slot of each face."""
    bm = bmesh.new()
    bm.from_mesh(tunic.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    # Make sure "out" is away from the body's axis.
    bm.normal_update()
    outward = sum(
        f.normal.dot(Vector((f.calc_center_median().x, f.calc_center_median().y - TORSO_Y, 0.0)))
        for f in bm.faces if abs(f.calc_center_median().x) < 0.2
    )
    if outward < 0:
        bmesh.ops.reverse_faces(bm, faces=bm.faces)

    _cut_planes(bm, xs, zs)
    gone = [f for f in bm.faces if not keep(f.calc_center_median())]
    bmesh.ops.delete(bm, geom=gone, context="FACES")

    inner = [v for v in bm.verts if not v.is_boundary]
    for _ in range(smooth):
        bmesh.ops.smooth_vert(bm, verts=inner, factor=0.5, use_axis_x=True, use_axis_y=True, use_axis_z=True)
    bm.normal_update()
    normals = {v: v.normal.copy() for v in bm.verts}

    for f in bm.faces:
        f.material_index = slot_of(f.calc_center_median())
        f.smooth = True
    rim_slot = len(materials) - 1
    border = [e for e in bm.edges if e.is_boundary]
    extruded = bmesh.ops.extrude_edge_only(bm, edges=border)
    for item in extruded["geom"]:
        if isinstance(item, bmesh.types.BMFace):
            item.material_index = rim_slot
    for v, normal in normals.items():
        v.co += normal * offset

    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    for mat in materials:
        mesh.materials.append(mat)
    obj = link_object(bpy.data.objects.new(name, mesh))
    log(f"{name}: {len(mesh.polygons)} faces")
    return obj


def build_shirt(tunic, materials, name="Mail"):
    def keep(c):
        return c.z > HEM_Z and abs(c.x) < SLEEVE_X

    return _shell(tunic, name, keep, (SLEEVE_X,), (HEM_Z,), SHIRT_OFFSET, 6,
                  lambda c: 0, [materials["mail"], materials["iron"]])


def _in_yoke(x, y, z):
    ax = abs(x)
    if ax >= SLEEVE_X:
        return False
    if y > TORSO_Y:                       # back
        return z > YOKE_BACK_Z
    if z > YOKE_STEP_Z:                   # over the shoulders
        return ax > YOKE_FLAP_X[0]
    return z > YOKE_FLAP_Z and YOKE_FLAP_X[0] < ax < YOKE_FLAP_X[1]


def build_yoke(tunic, materials, name="Mail_yoke"):
    b = YOKE_BORDER
    xs = (SLEEVE_X, SLEEVE_X - b, YOKE_FLAP_X[0], YOKE_FLAP_X[0] + b, YOKE_FLAP_X[1], YOKE_FLAP_X[1] - b)
    zs = (YOKE_BACK_Z, YOKE_BACK_Z + b, YOKE_FLAP_Z, YOKE_FLAP_Z + b, YOKE_STEP_Z, YOKE_STEP_Z + b)

    def keep(c):
        return _in_yoke(c.x, c.y, c.z)

    def slot_of(c):
        """Leather binding along every cut edge."""
        d = b * 0.6
        probes = ((d, 0), (-d, 0), (0, d), (0, -d))
        edge = any(not _in_yoke(c.x + dx * (1 if c.x >= 0 else -1), c.y, c.z + dz) for dx, dz in probes)
        return 1 if edge else 0

    return _shell(tunic, name, keep, xs, zs, YOKE_OFFSET, 6, slot_of,
                  [materials["mail"], materials["leather"], materials["leather"]])


def build_belt(tunic, materials, name="Belt"):
    def keep(c):
        return BELT_Z[0] < c.z < BELT_Z[1]

    def slot_of(c):
        return 1 if (abs(c.x) < BELT_PLATE_X and c.y < TORSO_Y) else 0

    return _shell(tunic, name, keep, (BELT_PLATE_X,), BELT_Z, BELT_OFFSET, 10, slot_of,
                  [materials["leather"], materials["bronze"], materials["leather"]])


def build_chest_hook(yoke, materials, detail, name="Mail_hook"):
    """The bronze bar that fastens the two chest flaps of the yoke."""
    z0, z1 = YOKE_FLAP_Z + 0.030, YOKE_FLAP_Z + 0.046
    half = YOKE_FLAP_X[0] + 0.030
    mesh = yoke.data
    # Front surface of the flaps near the bar, to sit just proud of it.
    front = [v.co for v in mesh.vertices if z0 - 0.01 < v.co.z < z1 + 0.01 and v.co.y < TORSO_Y and abs(v.co.x) < half + 0.02]

    def surface_y(x):
        near = [co.y for co in front if abs(abs(co.x) - abs(x)) < 0.02]
        return min(near) if near else min(co.y for co in front)

    b = Builder()
    steps = {0: 2, 1: 4, 2: 8}[detail]
    outer_lo, outer_hi, inner_lo, inner_hi = [], [], [], []
    for i in range(steps + 1):
        x = -half + 2 * half * i / steps
        y = surface_y(x if abs(x) > YOKE_FLAP_X[0] else YOKE_FLAP_X[0] + 0.005)
        outer_lo.append(b.vert((x, y - 0.006, z0)))
        outer_hi.append(b.vert((x, y - 0.006, z1)))
        inner_lo.append(b.vert((x, y + 0.004, z0)))
        inner_hi.append(b.vert((x, y + 0.004, z1)))
    b.grid([outer_lo, outer_hi], flip=True)
    b.grid([outer_hi, inner_hi], flip=True)
    b.grid([inner_lo, outer_lo], flip=True)
    for end, flip in ((0, True), (steps, False)):
        b.face([outer_lo[end], outer_hi[end], inner_hi[end], inner_lo[end]], flip=flip)
    return b.object(name, [materials["bronze"]], smooth=False)
