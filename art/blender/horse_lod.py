"""Stage "lod" of the horse: game meshes in three levels, one atlas, one material.

Four groups of meshes, each with its own LOD0..LOD2 objects, because the
rider models (T-022) show the tack per kind of horseman:

    horse_LOD<n>           body, mane, tail
    horse_cloth_LOD<n>     saddle cloth and girth
    horse_bridle_LOD<n>    headstall, noseband, rings, reins
    horse_neckrope_LOD<n>  the Numidians' neck rope

All of them share one UV atlas and one material ("horse"): colour (with
ambient occlusion), normals and roughness/metalness baked with Cycles on
the CPU, as lane 1 does for the soldiers (whp_lod, whp_unit_lod). The body's
low mesh is the source skin without the inside of the mouth and the eye
shells, decimated; the mane, tail and tack are built at game resolution and
bake from copies of themselves. LOD1 is decimated from LOD0 (same UVs and
weights). LOD2 is a stand-in of a few tubes along the bones (the decimator
tears thin legs apart at 150 triangles), coloured flat from the atlas.
"""

import math

import bmesh
import bpy
import numpy as np
from mathutils import Vector

import horse_rig as rig
import whp_lod as lod
import whp_proxy
import whp_unit_lod as ul
from whp_common import delete_objects, deselect_all, duplicate_object, log, triangle_count

MODEL = "horse"
GROUPS = ("horse", "horse_cloth", "horse_bridle", "horse_neckrope")
GROUP_OF = {"body": "horse", "mane": "horse", "tail": "horse", "mane_far": "horse", "tail_far": "horse",
            "cloth": "horse_cloth", "bridle": "horse_bridle", "neckrope": "horse_neckrope"}
# Triangles at LOD0, LOD1, LOD2 (LOD2 for the body is the stand-in).
BUDGET = {
    "body": (2780, 600, None),
    "mane": (None, 0, 0),             # decimated it turns into a spike; the body's crest suffices
    "tail": (None, 40, 0),
    "cloth": (None, 60, 12),
    "bridle": (None, 0, 0),           # thin, loose pieces: decimated they tear; unseen at that range
    "neckrope": (None, 24, 0),
    "mane_far": (None, 0, 0),         # the "hi" ladder only (HI_HAIR)
    "tail_far": (None, 0, 0),
}
LIMITS = (3500, 700, 150)       # per horse with all its tack (task T-020)
# The "hi" ladder of four levels (horse_build --hi): the body's LOD0 is
# HI_BODY times its game budget; then as whp_unit_lod's HI_MID and HI_FAR.
# The mane and the tail are locks of hair there, and keep their shape down
# to LOD1; below that they are cut down hard.
HI_BODY = 3.6
HI_LIMITS = (13500, 4200, 1100, 150)
# Mane and tail at LOD1, LOD2, LOD3 (None: whole, 0: absent). The locks go
# down to LOD1; below it the plain far pieces stand in (horse_kit.MANE_FAR).
HI_HAIR = {"mane": (None, 0, 0), "tail": (None, 0, 0), "mane_far": (0, None, 0), "tail_far": (0, 60, 0)}
FAR = ("mane_far", "tail_far")
SOURCE = {"body": rig.BODY_NAME, "mane": "horse-mane", "tail": "horse-tail", "mane_far": "horse-mane-far",
          "tail_far": "horse-tail-far", "cloth": "horse-cloth",
          "bridle": "horse-bridle", "neckrope": "horse-neckrope"}
INNER_SLOTS = (2, 3, 5)          # gums, teeth, cornea (horse_kit.INNER_SLOTS)


def _body_shell(body):
    """Copy of the body without the faces inside the mouth and the shells
    over the eyes."""
    shell = duplicate_object(body, "body")
    shell.modifiers.clear()
    shell.parent = None
    bm = bmesh.new()
    bm.from_mesh(shell.data)
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.material_index in INNER_SLOTS], context="FACES")
    loose = [v for v in bm.verts if not v.link_faces]
    bmesh.ops.delete(bm, geom=loose, context="VERTS")
    bm.to_mesh(shell.data)
    bm.free()
    for layer in list(shell.data.uv_layers):
        shell.data.uv_layers.remove(layer)
    return shell


TACK = ("mane", "tail", "cloth", "bridle", "neckrope")


def low_parts(keys=TACK, uv=1.0, hi=False):
    """LOD0 parts, each with its own UV islands, and the detailed objects
    each bakes from: the body, and the pieces in `keys` (default all; a
    rider model takes the tack its horsemen used). `uv`: texel density
    weight (whp_lod.set_uv_weight) when the horse shares an atlas. `hi`:
    the body of the "hi" ladder."""
    parts, sources = [], []
    body = bpy.data.objects[rig.BODY_NAME]
    shell = _body_shell(body)
    lod.triangulate(shell)
    lod.set_uv_weight(shell, lambda slot: uv)
    lod.project_uvs(shell)
    lod.decimate(shell, int(BUDGET["body"][0] * HI_BODY) if hi else BUDGET["body"][0])
    parts.append(shell)
    sources.append([body])
    if hi:
        keys = tuple(keys) + FAR
    for key in keys:
        obj = bpy.data.objects[SOURCE[key]]
        low = duplicate_object(obj, key)
        low.modifiers.clear()
        low.parent = None
        lod.triangulate(low)
        lod.set_uv_weight(low, lambda slot: uv)
        lod.project_uvs(low)
        parts.append(low)
        sources.append([obj])
    for p in parts:
        log(f"LOD0 {p.name}: {triangle_count(p)} triangles")
    return parts, sources


class Spec:
    """What whp_unit_lod's bakes need to know of a horse part."""

    def __init__(self, name, sources, ao_alone):
        self.name = name
        self.bake = [o.name for o in sources]
        self.extrusion = 0.012
        self.ray = 0.03
        self.ao_alone = ao_alone


def specs(parts, sources):
    return [Spec(p.name, s, p.name in ("cloth", "bridle", "neckrope")) for p, s in zip(parts, sources)]


class Unskinned:
    """The detailed objects bake in their rest pose, without the armature:
    their modifiers are switched off for rendering meanwhile."""

    def __init__(self, objs):
        self.objs = objs

    def __enter__(self):
        for o in self.objs:
            for m in o.modifiers:
                m.show_render = False
        return self

    def __exit__(self, *exc):
        for o in self.objs:
            for m in o.modifiers:
                m.show_render = True
        return False


def bake(parts, sources):
    detailed = [o for s in sources for o in s]
    with Unskinned(detailed):
        parts, final, color_image, clean_up = ul.bake_atlas(MODEL, specs(parts, sources), parts, detailed)
    clean_up()
    return parts, final, color_image


def _joint(rest, name):
    return Vector(rest[name][:3, 3].tolist())


def _slice(co, y, half=0.04):
    """Top, bottom and half width of the trunk at `y` (legs left out)."""
    near = co[np.abs(co[:, 1] - y) < half]
    mid = near[np.abs(near[:, 0]) < 0.08]
    top = float(mid[:, 2].max())
    bottom = float(mid[mid[:, 2] > 0.5, 2].min())
    centre = (top + bottom) / 2
    band = near[np.abs(near[:, 2] - centre) < 0.08]
    return top, bottom, float(np.abs(band[:, 0]).max())


def lod2_body(parts, rest, color_image):
    """Stand-in for the far body: an elliptic barrel of three rings, neck,
    head, four legs of two tubes each and the tail, each shape following
    one bone, coloured flat from the atlas."""
    body = next(p for p in parts if p.name == "body")
    tail = next((p for p in parts if p.name == "tail_far"), None) or next(p for p in parts if p.name == "tail")
    # Measured on the detailed skin (the decimated one is too sparse).
    detailed = bpy.data.objects[rig.BODY_NAME].data
    co = np.empty(len(detailed.vertices) * 3)
    detailed.vertices.foreach_get("co", co)
    co = co.reshape(-1, 3)
    pb = whp_proxy.ProxyBuilder()
    j = lambda n: _joint(rest, n)  # noqa: E731

    # Barrel: rings at the croup, the middle and the chest.
    hips, chest = j("horse_hips"), j("horse_spine_5")
    stations = [(hips.y - 0.02, "horse_hips"), ((hips.y + chest.y) / 2, "horse_spine_3"), (chest.y - 0.12, "horse_spine_5")]
    rings = []
    for y, bone in stations:
        top, bottom, half = _slice(co, y)
        centre = Vector((0.0, y, (top + bottom) / 2))
        rings.append((centre, pb._ring(centre, Vector((1, 0, 0)), Vector((0, 0, 1)), half * 0.97, (top - bottom) / 2 * 0.97,
                                       6, bone, math.pi / 6)))
    # The rings run counter-clockwise about -Y (X then Z), the way the
    # barrel runs from the croup to the chest: bands outward that way.
    for (_c0, back), (_c1, front) in zip(rings, rings[1:]):
        pb._band(back, front)
    pb._fan(pb._vert(rings[0][0] + Vector((0, 0.10, 0)), stations[0][1]), rings[0][1], flip=True)
    pb._fan(pb._vert(rings[-1][0] + Vector((0, -0.12, 0)), stations[-1][1]), rings[-1][1])
    # Neck and head.
    neck_base = Vector((0.0, j("horse_neck_1").y, j("horse_neck_1").z + 0.06))
    poll = j("horse_head")
    pb.tube(neck_base, poll, (0.15, 0.085), 4, "horse_neck_2", extend=(0.05, 0.0), phase=math.pi / 4)
    head = co[(co[:, 1] < poll.y + 0.02) & (co[:, 2] > 1.1)]
    tip = Vector(head[np.argmin(head[:, 1])].tolist())
    pb.tube(poll, tip, (0.085, 0.055), 4, "horse_head", extend=(0.04, 0.0), caps=(False, True), cap_length=0.3,
            phase=math.pi / 4)
    # Legs: elbow/stifle (inside the barrel) to knee/hock, then down to the ground.
    for s in ("l", "r"):
        for upper, joint_bone, low_bone, r_up in (
                (f"horse_forearm_{s}", f"horse_fore_cannon_{s}", f"horse_fore_cannon_{s}", 0.07),
                (f"horse_gaskin_{s}", f"horse_hind_cannon_{s}", f"horse_hind_cannon_{s}", 0.075)):
            top = j(upper) + Vector((0, 0, 0.10))
            knee = j(joint_bone)
            hoof = j(low_bone.replace("cannon", "hoof"))
            foot = Vector((hoof.x, hoof.y, 0.0))
            pb.tube(top, knee, (r_up, 0.045), 3, upper, extend=(0.0, 0.02), phase=math.pi / 2)
            pb.tube(knee, foot, (0.04, 0.045), 3, low_bone, phase=math.pi / 2)
    proxy = pb.object("lod2-proxy")
    tail_low = duplicate_object(tail, "tail.lod2")
    lod.decimate(tail_low, 8)
    source = duplicate_object(body, "body.src")
    lod.flat_colour_uvs(proxy, source, color_image)
    delete_objects([source])
    from whp_common import join_objects
    proxy = join_objects([proxy, tail_low], "body.lod2")
    log(f"LOD2 body stand-in: {triangle_count(proxy)} triangles")
    return proxy


def _push_out(obj, distance):
    """Move a decimated cloth out along its normals: its flatter faces
    would otherwise cut into the body's curve."""
    mesh = obj.data
    for v in mesh.vertices:
        v.co += v.normal * distance
    mesh.update()


def levels(parts, rest, color_image):
    """The pieces of each group's LOD0, LOD1 and LOD2 from the baked LOD0
    parts: {group: [[LOD0 objects], [LOD1], [LOD2]]}, for the parts there are."""
    by_name = {p.name: p for p in parts}
    levels = {g: [[], [], []] for g in GROUPS}
    for key, budget in BUDGET.items():
        if key not in by_name:
            continue
        group = GROUP_OF[key]
        low = by_name[key]
        levels[group][0].append(low)
        if budget[1]:
            copy = duplicate_object(low, f"{key}.lod1")
            lod.decimate(copy, budget[1])
            if key == "cloth":
                _push_out(copy, 0.012)
            levels[group][1].append(copy)
        if key == "body":
            levels[group][2].append(lod2_body(parts, rest, color_image))
        elif budget[2]:
            copy = duplicate_object(low, f"{key}.lod2")
            lod.decimate(copy, budget[2])
            if key == "cloth":
                _push_out(copy, 0.02)
            levels[group][2].append(copy)
    return levels


def levels_hi(parts, rest, color_image):
    """As levels, for the "hi" ladder: {group: [[LOD0], [LOD1], [LOD2], [LOD3]]}."""
    by_name = {p.name: p for p in parts}
    out = {g: [[], [], [], []] for g in GROUPS}
    for key, budget in BUDGET.items():
        if key not in by_name:
            continue
        group = GROUP_OF[key]
        low = by_name[key]
        first = budget[0] if budget[0] is not None else triangle_count(low)
        if key in HI_HAIR:
            targets = HI_HAIR[key]
        elif key == "body":
            targets = (int(first * ul.HI_MID), int((budget[1] or 0) * ul.HI_FAR), None)
        else:
            # Tack: whole at LOD1 (cut down, straps tear), then the game ladder's lower levels.
            targets = (None, int((budget[1] or 0) * ul.HI_FAR), budget[2] or 0)
        if key not in FAR:
            out[group][0].append(low)
        for level, target in zip((1, 2, 3), targets):
            if level == 3 and key == "body":
                out[group][3].append(lod2_body(parts, rest, color_image))
                continue
            if target == 0:
                continue
            copy = duplicate_object(low, f"{key}.lod{level}")
            if target is not None:
                lod.decimate(copy, target)
                if key == "cloth":
                    _push_out(copy, 0.012 if level < 3 else 0.02)
            out[group][level].append(copy)
            log(f"LOD{level} {key}: {triangle_count(copy)} triangles")
    return out


def build(armature, rest, hi=False):
    parts, sources = low_parts(hi=hi)
    parts, final, color_image = bake(parts, sources)
    count = 4 if hi else 3
    limits = HI_LIMITS if hi else LIMITS
    levels_ = levels_hi(parts, rest, color_image) if hi else levels(parts, rest, color_image)
    out = {}
    totals = [0] * count
    for group in GROUPS:
        for i in range(count):
            objs = levels_[group][i]
            if not objs:
                continue
            name = f"{group}_LOD{i}"
            obj = ul.finish_lod(objs, name, limits[i], armature, final)
            # The coat colours live in the atlas now; a colour attribute
            # left on the mesh would be exported (COLOR_0) and multiply it.
            for attr in list(obj.data.color_attributes):
                obj.data.color_attributes.remove(attr)
            out[name] = obj
            totals[i] += triangle_count(obj)
    for i in range(count):
        log(f"LOD{i} with all tack: {totals[i]} triangles (target about {limits[i]})")
    deselect_all()
    return out, totals
