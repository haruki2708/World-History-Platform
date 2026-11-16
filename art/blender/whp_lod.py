"""Game meshes from the detailed model: reduce, unwrap into one atlas, bake.

The detailed model is many objects with their own materials and textures.
The game model is three meshes (LOD0..LOD2) that share one colour texture
and one normal map. The steps:

  1. per part, a low-poly copy (decimated source mesh, or a generated one);
  2. one UV atlas for all parts of LOD0;
  3. per part, bake colour, normals and ambient occlusion from the
     detailed objects onto the low-poly part (Cycles, selected to active);
  4. LOD1 and LOD2 are decimated from the baked LOD0 parts, so they keep
     its UVs and skin weights.
"""

import math
import os

import bmesh
import bpy
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

from whp_common import deselect_all, duplicate_object, ensure_dir, join_objects, log, select_only, triangle_count  # noqa: F401

UV_NAME = "atlas"
UV_WEIGHT = "whp_uv_weight"


# --------------------------------------------------------------------------
# Low-poly parts
# --------------------------------------------------------------------------

def low_copy(objs, name):
    """Joined copy of some objects, without modifiers, keeping vertex groups."""
    copies = []
    for obj in objs:
        copy = duplicate_object(obj, f"{name}.tmp")
        copy.modifiers.clear()
        copy.parent = None
        copy.hide_render = False
        copy.hide_viewport = False
        copies.append(copy)
    low = join_objects(copies, name)
    for layer in list(low.data.uv_layers):
        low.data.uv_layers.remove(layer)
    return low


def _tree(objs):
    verts, polys = [], []
    for obj in objs:
        base = len(verts)
        verts.extend(v.co.copy() for v in obj.data.vertices)
        polys.extend([base + i for i in p.vertices] for p in obj.data.polygons)
    return BVHTree.FromPolygons(verts, polys)


def remove_covered(obj, covers, reach=0.03, poke=0.012):
    """Delete the faces of `obj` that lie under the `covers` objects. A
    corner is hidden when, along its normal, it sees a cover within `reach`
    in front of it, or lies less than `poke` outside a cover's surface (it
    pokes through a layer it should be under: an arm through a sleeve).
    A face goes when all its corners are hidden."""
    tree = _tree(covers)
    mesh = obj.data
    hidden = np.zeros(len(mesh.vertices), dtype=bool)
    for v in mesh.vertices:
        hit = tree.ray_cast(v.co + v.normal * 0.0005, v.normal, reach)
        if hit[0] is not None:
            hidden[v.index] = True
            continue
        back = tree.ray_cast(v.co + v.normal * 0.0005, -v.normal, poke)
        hidden[v.index] = back[0] is not None and back[1].dot(v.normal) > 0.0
    bm = bmesh.new()
    bm.from_mesh(mesh)
    gone = [f for f in bm.faces if all(hidden[v.index] for v in f.verts)]
    bmesh.ops.delete(bm, geom=gone, context="FACES")
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()
    return len(gone)


def wrap_over(obj, covers, reach=0.035, clearance=0.0005, where=None):
    """Push vertices of `obj` out along their normals to the outermost
    surface of `covers` within `reach`. `where(co, normal)` picks the
    vertices to move (default: all). Used to bring the sole of the foot
    down to the sole of the sandal."""
    tree = _tree(covers)
    moved = 0
    for v in obj.data.vertices:
        if where is not None and not where(v.co, v.normal):
            continue
        origin = v.co - v.normal * 0.002
        travelled, far = 0.0, None
        while travelled < reach:
            hit = tree.ray_cast(origin, v.normal, reach - travelled)
            if hit[0] is None:
                break
            far = hit[0]
            travelled += hit[3] + 1e-4
            origin = hit[0] + v.normal * 1e-4
        if far is not None:
            v.co = far + v.normal * clearance
            moved += 1
    obj.data.update()
    return moved


def decimate(obj, triangles):
    """Collapse-decimate to about `triangles` (never more)."""
    current = triangle_count(obj)
    if current <= triangles:
        return obj
    for _ in range(4):
        mod = obj.modifiers.new("Decimate", "DECIMATE")
        mod.decimate_type = "COLLAPSE"
        mod.ratio = max(triangles / current * 0.985, 0.0005)
        mod.use_collapse_triangulate = True
        select_only(obj)
        bpy.ops.object.modifier_apply(modifier=mod.name)
        current = triangle_count(obj)
        if current <= triangles:
            break
    return obj


def triangulate(obj):
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bmesh.ops.triangulate(bm, faces=bm.faces)
    bm.to_mesh(obj.data)
    bm.free()


def set_uv_weight(obj, weight_of_slot):
    """Per-face texel density weight, by the face's (old) material slot."""
    mesh = obj.data
    attr = mesh.attributes.get(UV_WEIGHT) or mesh.attributes.new(UV_WEIGHT, "FLOAT", "FACE")
    attr.data.foreach_set("value", [float(weight_of_slot(p.material_index)) for p in mesh.polygons])


def single_material(obj, material):
    mesh = obj.data
    mesh.materials.clear()
    mesh.materials.append(material)
    mesh.polygons.foreach_set("material_index", [0] * len(mesh.polygons))
    mesh.polygons.foreach_set("use_smooth", [True] * len(mesh.polygons))
    mesh.update()


def flat_colour_uvs(target, source, image):
    """Give every triangle of `target` one flat colour from the atlas:
    sample the surface of `source` (which carries the atlas UVs) at seven
    points under the triangle and use the UV of the sample closest to their
    mean colour, so that a dark gap between mail rings does not stand for
    a whole patch of mail. For far LODs, whose big triangles would smear
    texture across several atlas islands."""
    from mathutils.interpolate import poly_3d_calc

    triangulate(source)
    smesh = source.data
    scoords = [v.co.copy() for v in smesh.vertices]
    stris = [tuple(p.vertices) for p in smesh.polygons]
    suv = np.empty(len(smesh.loops) * 2)
    smesh.uv_layers[UV_NAME].data.foreach_get("uv", suv)
    suv = suv.reshape(len(stris), 3, 2)
    tree = BVHTree.FromPolygons(scoords, stris)
    pixels = pixels_of(image)
    h, w = pixels.shape[:2]

    triangulate(target)
    mesh = target.data
    if UV_NAME not in mesh.uv_layers:
        mesh.uv_layers.new(name=UV_NAME)
    out = np.zeros((len(mesh.polygons), 3, 2))
    for f, poly in enumerate(mesh.polygons):
        corners = [mesh.vertices[i].co for i in poly.vertices]
        centre = (corners[0] + corners[1] + corners[2]) / 3
        points = [centre] + [centre.lerp(c, 0.6) for c in corners] + \
                 [centre.lerp((corners[i] + corners[(i + 1) % 3]) / 2, 0.6) for i in range(3)]
        uvs, colours = [], []
        for p in points:
            location, _normal, tri, _dist = tree.find_nearest(p)
            a, b, c = stris[tri]
            bary = poly_3d_calc([scoords[a], scoords[b], scoords[c]], location)
            uv = bary[0] * suv[tri, 0] + bary[1] * suv[tri, 1] + bary[2] * suv[tri, 2]
            px = min(max(int(uv[0] * w), 0), w - 1)
            py = min(max(int(uv[1] * h), 0), h - 1)
            uvs.append(uv)
            colours.append(pixels[py, px, :3])
        colours = np.array(colours)
        best = int(np.argmin(np.linalg.norm(colours - colours.mean(axis=0), axis=1)))
        out[f] = uvs[best]
    mesh.uv_layers[UV_NAME].data.foreach_set("uv", out.ravel())
    mesh.update()


# --------------------------------------------------------------------------
# UV atlas
# --------------------------------------------------------------------------

def project_uvs(obj, angle=66.0):
    """Smart UV projection of one object into the "atlas" layer. Run it on
    the dense mesh, before decimation: smooth surfaces give large islands,
    and the collapse decimator keeps UV seams."""
    mesh = obj.data
    for layer in list(mesh.uv_layers):
        mesh.uv_layers.remove(layer)
    mesh.uv_layers.new(name=UV_NAME)
    select_only(obj)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(angle), island_margin=0.002, area_weight=0.0,
                             correct_aspect=True, scale_to_bounds=False)
    bpy.ops.object.mode_set(mode="OBJECT")


def _uv_and_face_areas(mesh):
    """UV area and 3D area of each triangle (the mesh must be triangulated)."""
    n = len(mesh.polygons)
    areas = np.empty(n, dtype=np.float64)
    mesh.polygons.foreach_get("area", areas)
    uv = np.empty(len(mesh.loops) * 2, dtype=np.float64)
    mesh.uv_layers[UV_NAME].data.foreach_get("uv", uv)
    uv = uv.reshape(-1, 3, 2)
    d1 = uv[:, 1] - uv[:, 0]
    d2 = uv[:, 2] - uv[:, 0]
    uv_areas = 0.5 * np.abs(d1[:, 0] * d2[:, 1] - d1[:, 1] * d2[:, 0])
    return uv_areas, areas


def normalise_density(obj):
    """Scale an object's UVs so that UV area per square metre is the same in
    every part, times the square of each face's UV weight."""
    mesh = obj.data
    uv_areas, areas = _uv_and_face_areas(mesh)
    scale = math.sqrt(areas.sum() / max(uv_areas.sum(), 1e-12))
    weights = np.empty(len(mesh.polygons), dtype=np.float64)
    mesh.attributes[UV_WEIGHT].data.foreach_get("value", weights)
    uv = np.empty(len(mesh.loops) * 2, dtype=np.float64)
    mesh.uv_layers[UV_NAME].data.foreach_get("uv", uv)
    uv = uv.reshape(-1, 2) * (scale * np.repeat(weights, 3))[:, None]
    mesh.uv_layers[UV_NAME].data.foreach_set("uv", uv.ravel())


def _pack(joined, method, margin):
    select_only(joined)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.select_all(action="SELECT")
    bpy.ops.uv.pack_islands(rotate=True, scale=True, margin_method=method, margin=margin)
    bpy.ops.object.mode_set(mode="OBJECT")


def unwrap_atlas(parts, margin=0.003, pixels=None, size=2048):
    """Pack the parts' UV islands into one atlas. Each part already has its
    islands (project_uvs). Returns the parts, separated again.

    By default the gap between islands is Blender's "scaled" margin.
    With `pixels`, every island instead gets that many texels of a
    `size` x `size` image clear on each side: packs much tighter when
    there are many small islands, and keeps a bake's margin from spilling
    onto the next island (bake margins should be at most `pixels`)."""
    names = [p.name for p in parts]
    tags = []
    for part in parts:
        triangulate(part)
        normalise_density(part)
        tag = bpy.data.materials.new(f"part:{part.name}")
        single_material(part, tag)
        tags.append(tag)
    joined = join_objects(parts, "atlas-work")

    if pixels is None:
        _pack(joined, "SCALED", margin)
    else:
        # The "add" margin is in the UVs' own units, before packing scales
        # them: pack once to learn the scale, then again with the margin
        # that comes out at `pixels` texels.
        before = _uv_and_face_areas(joined.data)[0].sum()
        start = np.empty(len(joined.data.loops) * 2)
        joined.data.uv_layers[UV_NAME].data.foreach_get("uv", start)
        guess = pixels / size * 2.6
        for attempt in range(4):
            if attempt:
                joined.data.uv_layers[UV_NAME].data.foreach_set("uv", start)
            _pack(joined, "ADD", guess)
            after = _uv_and_face_areas(joined.data)[0].sum()
            texels = guess * math.sqrt(after / before) * size
            if texels >= pixels and texels - pixels < 0.2:
                break
            guess *= (pixels + 0.05) / texels
        log(f"atlas: {after * 100:.1f}% of the UV square covered, {texels:.2f} texels clear round each island")

    select_only(joined)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.separate(type="MATERIAL")
    bpy.ops.object.mode_set(mode="OBJECT")

    out = {}
    for obj in bpy.context.selected_objects:
        tag = obj.data.materials[0].name
        name = tag.split(":", 1)[1]
        obj.name = name
        obj.data.name = name
        out[name] = obj
    for tag in tags:
        bpy.data.materials.remove(tag)
    return [out[name] for name in names]


# --------------------------------------------------------------------------
# Baking
# --------------------------------------------------------------------------

def new_target(name, size, color=(0.0, 0.0, 0.0, 0.0), non_color=False):
    old = bpy.data.images.get(name)
    if old is not None:
        bpy.data.images.remove(old)
    image = bpy.data.images.new(name, size, size, alpha=True, float_buffer=True)
    image.generated_color = color
    image.colorspace_settings.name = "Non-Color" if non_color else "Linear Rec.709"
    return image


def bake_material(name="whp-bake"):
    old = bpy.data.materials.get(name)
    if old is not None:
        bpy.data.materials.remove(old)
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    node = mat.node_tree.nodes.new("ShaderNodeTexImage")
    node.name = "target"
    mat.node_tree.nodes.active = node
    return mat


def set_target(material, image):
    node = material.node_tree.nodes["target"]
    node.image = image
    material.node_tree.nodes.active = node


def setup_cycles(scene, samples):
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = samples
    scene.cycles.use_denoising = False
    scene.cycles.seed = 0
    scene.render.bake.margin = 3
    scene.render.bake.margin_type = "EXTEND"
    scene.render.bake.use_clear = False
    scene.render.bake.use_selected_to_active = True
    scene.render.bake.use_cage = False
    scene.render.bake.target = "IMAGE_TEXTURES"
    if scene.world is None:
        scene.world = bpy.data.worlds.new("whp-bake-world")
    scene.world.light_settings.distance = 0.15


class EmissionSwap:
    """Temporarily make every material emit its base colour, so an EMIT
    bake reads plain albedo whatever the lighting."""

    def __init__(self, objs):
        self.materials = {m for o in objs for m in o.data.materials if m is not None}
        self.undo = []

    def __enter__(self):
        for mat in self.materials:
            tree = mat.node_tree
            out = next(n for n in tree.nodes if n.type == "OUTPUT_MATERIAL")
            bsdf = next(n for n in tree.nodes if n.type == "BSDF_PRINCIPLED")
            emit = tree.nodes.new("ShaderNodeEmission")
            base = bsdf.inputs["Base Color"]
            if base.is_linked:
                tree.links.new(base.links[0].from_socket, emit.inputs["Color"])
            else:
                emit.inputs["Color"].default_value = base.default_value
            tree.links.new(emit.outputs["Emission"], out.inputs["Surface"])
            self.undo.append((tree, out, bsdf, emit))
        return self

    def __exit__(self, *exc):
        for tree, out, bsdf, emit in self.undo:
            tree.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
            tree.nodes.remove(emit)
        return False


# A material with this custom property set takes its metalness from the
# saturation of its base colour: grey texels are bare metal (a steel blade),
# coloured ones are not (a wooden or bone grip). See SurfaceSwap.
METAL_FROM_GREY = "whp_metal_from_grey"
GREY_METAL_ROUGHNESS = 0.35


class SurfaceSwap:
    """Temporarily make every material emit (1, roughness, metallic), read
    from its Principled BSDF, so an EMIT bake writes the glTF
    metallicRoughness image: green is roughness, blue is metalness."""

    def __init__(self, objs):
        self.materials = {m for o in objs for m in o.data.materials if m is not None}
        self.undo = []

    def __enter__(self):
        for mat in sorted(self.materials, key=lambda m: m.name):
            tree = mat.node_tree
            out = next(n for n in tree.nodes if n.type == "OUTPUT_MATERIAL")
            bsdf = next(n for n in tree.nodes if n.type == "BSDF_PRINCIPLED")
            rough = bsdf.inputs["Roughness"].default_value
            metal = bsdf.inputs["Metallic"].default_value
            added = []

            def node(kind):
                n = tree.nodes.new(kind)
                added.append(n)
                return n

            combine = node("ShaderNodeCombineColor")
            combine.inputs["Red"].default_value = 1.0
            combine.inputs["Green"].default_value = rough
            combine.inputs["Blue"].default_value = metal
            base = bsdf.inputs["Base Color"]
            if mat.get(METAL_FROM_GREY) and base.is_linked:
                hsv = node("ShaderNodeSeparateColor")
                hsv.mode = "HSV"
                tree.links.new(base.links[0].from_socket, hsv.inputs["Color"])
                grey = node("ShaderNodeMapRange")       # saturation 0.12 -> metal, 0.28 -> not
                grey.inputs["From Min"].default_value = 0.12
                grey.inputs["From Max"].default_value = 0.28
                grey.inputs["To Min"].default_value = 1.0
                grey.inputs["To Max"].default_value = 0.0
                tree.links.new(hsv.outputs["Green"], grey.inputs["Value"])
                mix = node("ShaderNodeMix")
                mix.data_type = "FLOAT"
                mix.inputs["A"].default_value = rough
                mix.inputs["B"].default_value = GREY_METAL_ROUGHNESS
                tree.links.new(grey.outputs["Result"], mix.inputs["Factor"])
                tree.links.new(mix.outputs["Result"], combine.inputs["Green"])
                tree.links.new(grey.outputs["Result"], combine.inputs["Blue"])
            emit = node("ShaderNodeEmission")
            tree.links.new(combine.outputs["Color"], emit.inputs["Color"])
            tree.links.new(emit.outputs["Emission"], out.inputs["Surface"])
            self.undo.append((tree, out, bsdf, added))
        return self

    def __exit__(self, *exc):
        for tree, out, bsdf, added in self.undo:
            tree.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
            for n in added:
                tree.nodes.remove(n)
        return False


def bake_pass(scene, low, sources, kind, extrusion, reach):
    """Bake one pass from `sources` onto `low` (into its active image)."""
    if bpy.context.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")
    deselect_all()
    for obj in sources:
        obj.select_set(True)
    low.select_set(True)
    bpy.context.view_layer.objects.active = low
    scene.render.bake.cage_extrusion = extrusion
    scene.render.bake.max_ray_distance = reach
    bpy.ops.object.bake(type=kind, use_selected_to_active=True, cage_extrusion=extrusion, max_ray_distance=reach,
                        margin=3, use_clear=False, normal_space="TANGENT")


# --------------------------------------------------------------------------
# Texture post-processing
# --------------------------------------------------------------------------

def pixels_of(image):
    w, h = image.size
    data = np.empty(w * h * 4, dtype=np.float32)
    image.pixels.foreach_get(data)
    return data.reshape(h, w, 4)


def dilate(rgb, mask, iterations):
    """Grow covered texels into empty ones (padding against mip bleeding)."""
    rgb = rgb.copy()
    mask = mask.copy()
    for _ in range(iterations):
        total = np.zeros_like(rgb)
        count = np.zeros(mask.shape, dtype=np.float32)
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                if dx == 0 and dy == 0:
                    continue
                shifted_mask = np.roll(np.roll(mask, dy, axis=0), dx, axis=1)
                shifted = np.roll(np.roll(rgb, dy, axis=0), dx, axis=1)
                total += shifted * shifted_mask[..., None]
                count += shifted_mask
        grow = (~mask) & (count > 0)
        rgb[grow] = total[grow] / count[grow][:, None]
        mask = mask | grow
    return rgb, mask


def linear_to_srgb(x):
    x = np.clip(x, 0.0, 1.0)
    return np.where(x <= 0.0031308, x * 12.92, 1.055 * np.power(x, 1 / 2.4) - 0.055)


def downsample(a, factor):
    h, w = a.shape[:2]
    return a.reshape(h // factor, factor, w // factor, factor, -1).mean(axis=(1, 3))


def save_image(name, rgb, path, srgb):
    """8-bit image from an (h, w, 3) array of values as they are to be
    stored (already sRGB-encoded for a colour image): the pixels of a byte
    image are its raw bytes / 255, whatever its colour space."""
    old = bpy.data.images.get(name)
    if old is not None:
        bpy.data.images.remove(old)
    h, w = rgb.shape[:2]
    image = bpy.data.images.new(name, w, h, alpha=False)
    image.colorspace_settings.name = "sRGB" if srgb else "Non-Color"
    rgba = np.concatenate([np.clip(rgb, 0.0, 1.0), np.ones((h, w, 1))], axis=2).astype(np.float32)
    image.pixels.foreach_set(rgba.ravel())
    ensure_dir(os.path.dirname(path))
    image.filepath_raw = path
    image.file_format = "PNG"
    image.save()
    image.pack()
    return image


def final_material(name, color_image, normal_image, roughness=0.72, surface_image=None):
    """The model's one material. With `surface_image` (glTF
    metallicRoughness: green roughness, blue metalness) roughness and
    metalness come from it; otherwise roughness is constant, no metal."""
    old = bpy.data.materials.get(name)
    if old is not None:
        bpy.data.materials.remove(old)
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    tree = mat.node_tree
    tree.nodes.clear()
    out = tree.nodes.new("ShaderNodeOutputMaterial")
    bsdf = tree.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Metallic"].default_value = 0.0
    bsdf.inputs["Roughness"].default_value = roughness
    tree.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    color = tree.nodes.new("ShaderNodeTexImage")
    color.image = color_image
    tree.links.new(color.outputs["Color"], bsdf.inputs["Base Color"])
    if normal_image is not None:
        tex = tree.nodes.new("ShaderNodeTexImage")
        tex.image = normal_image
        nmap = tree.nodes.new("ShaderNodeNormalMap")
        nmap.uv_map = UV_NAME
        tree.links.new(tex.outputs["Color"], nmap.inputs["Color"])
        tree.links.new(nmap.outputs["Normal"], bsdf.inputs["Normal"])
    if surface_image is not None:
        tex = tree.nodes.new("ShaderNodeTexImage")
        tex.image = surface_image
        split = tree.nodes.new("ShaderNodeSeparateColor")     # the exporter reads G and B from this
        tree.links.new(tex.outputs["Color"], split.inputs["Color"])
        tree.links.new(split.outputs["Green"], bsdf.inputs["Roughness"])
        tree.links.new(split.outputs["Blue"], bsdf.inputs["Metallic"])
    return mat
