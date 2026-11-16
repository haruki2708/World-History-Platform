"""Stages "source" and "strip": import the source model, drop the Imperial kit.

Source: "Roman Soldier - T pose" by Andywoodhead (CC BY 4.0): 16 separate
meshes, no armature, 280k triangles, standing in a T pose and facing -Y.
"""

import os

import bpy
import numpy as np

from whp_lod import METAL_FROM_GREY

from whp_common import (
    SOURCES_DIR,
    apply_transform,
    delete_objects,
    find_texture,
    import_fbx,
    log,
    mesh_objects,
    select_only,
    triangle_count,
)

ROMAN_DIR = os.path.join(SOURCES_DIR, "roman-soldier-andywoodhead")
ROMAN_FBX = os.path.join(ROMAN_DIR, "source", "Old man head 12 FBX test.fbx")
ROMAN_TEXTURES = [os.path.join(ROMAN_DIR, "textures")]

# Mesh name -> why it goes. Everything else is kept.
REMOVED = {
    "Armour_top": "lorica segmentata: plate armour of the Principate, 1st century CE onwards",
    "Ties": "the lacing of the lorica segmentata (and it has no UVs)",
    "Helmet3": "Imperial Gallic helmet, 1st century CE",
    "Scutum_04_01": "rectangular Imperial scutum; the Republican shield is a tall oval",
    "Dangles": "studded apron straps of the military belt, 1st century CE",
    "Wrist_guard1": "leather bracers: a film convention, not attested for legionaries",
    "Full_figure_42_T_pose": "a patch of the torso that is fully hidden under the tunic",
}

# The sword's texture: a steel blade (grey) on a bone and wood grip.
METAL_FROM_GREY_STEMS = {"Sword2_1"}

# Roughness of the source materials; the export bakes it into the
# metallicRoughness map. None of them is metal (but see METAL_FROM_GREY_STEMS).
ROUGHNESS = {
    "New_head": 0.55,
    "New_arms": 0.55,
    "New_legs": 0.55,
    "New_eye": 0.2,
    "New_eye_2": 0.2,
    "Tunic_1": 0.9,
    "Boots": 0.7,
    "Scabbard": 0.6,
    "Sword2_1": 0.4,
}


def _rebuild_material(mat, stem, folders):
    """Wire <stem>_TXTR / <stem>_NM from the textures folder into a plain
    Principled material. The FBX points at files that do not exist and comes
    in as fully metallic."""
    mat.use_nodes = True
    tree = mat.node_tree
    tree.nodes.clear()
    out = tree.nodes.new("ShaderNodeOutputMaterial")
    bsdf = tree.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Metallic"].default_value = 0.0
    bsdf.inputs["Roughness"].default_value = ROUGHNESS.get(stem, 0.7)
    bsdf.inputs["Alpha"].default_value = 1.0
    tree.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    if stem in METAL_FROM_GREY_STEMS:
        mat[METAL_FROM_GREY] = True

    color_path = find_texture(folders, stem + "_TXTR")
    if color_path:
        tex = tree.nodes.new("ShaderNodeTexImage")
        tex.name = "whp-color"
        tex.image = bpy.data.images.load(color_path, check_existing=True)
        tree.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    else:
        log("no colour texture for", stem)

    normal_path = find_texture(folders, stem + "_NM")
    if normal_path:
        tex = tree.nodes.new("ShaderNodeTexImage")
        tex.name = "whp-normal"
        tex.image = bpy.data.images.load(normal_path, check_existing=True)
        tex.image.colorspace_settings.name = "Non-Color"
        nmap = tree.nodes.new("ShaderNodeNormalMap")
        nmap.name = "whp-normal-map"
        tree.links.new(tex.outputs["Color"], nmap.inputs["Color"])
        tree.links.new(nmap.outputs["Normal"], bsdf.inputs["Normal"])


def import_roman():
    """Import model 07 with transforms applied: metres, Z up, facing -Y."""
    objs = import_fbx(ROMAN_FBX)
    meshes = [o for o in objs if o.type == "MESH"]
    delete_objects([o for o in objs if o.type != "MESH"])
    for obj in meshes:
        apply_transform(obj)
        for mat in obj.data.materials:
            if mat is not None:
                _rebuild_material(mat, obj.name, ROMAN_TEXTURES)
        for poly in obj.data.polygons:
            poly.use_smooth = True
        # The file's stored normals would go stale once the mesh is re-posed.
        if obj.data.has_custom_normals:
            select_only(obj)
            bpy.ops.mesh.customdata_custom_splitnormals_clear()
        log(f"imported {obj.name}: {triangle_count(obj)} triangles")
    # Drop the placeholder images the importer made for the missing files.
    for image in list(bpy.data.images):
        if image.users == 0:
            bpy.data.images.remove(image)
    return meshes


def strip_imperial_kit():
    """Remove the meshes listed in REMOVED; return the ones that stay."""
    gone = []
    for obj in mesh_objects():
        if obj.name in REMOVED:
            log(f"removed {obj.name}: {REMOVED[obj.name]}")
            gone.append(obj)
    delete_objects(gone)
    kept = mesh_objects()
    log("kept:", ", ".join(f"{o.name} ({triangle_count(o)})" for o in kept))
    return kept


# How far the scabbard moves out to clear the mail shirt, after mirroring.
SCABBARD_SHIFT = (-0.014, -0.010, 0.0)


def scabbard_to_right_hip(scabbard):
    """Mirror the scabbard to the right side. The source wears it on the
    left, as later centurions did; Polybius (6.23.6) has the sword on the
    right thigh."""
    mesh = scabbard.data
    for v in mesh.vertices:
        v.co.x = -v.co.x + SCABBARD_SHIFT[0]
        v.co.y += SCABBARD_SHIFT[1]
        v.co.z += SCABBARD_SHIFT[2]
    mesh.flip_normals()
    mesh.update()


# --------------------------------------------------------------------------
# Recolouring the source textures (cloth dyed otherwise, other skin tones)
# --------------------------------------------------------------------------

def _colour_nodes(obj):
    mat = obj.data.materials[0]
    tree = mat.node_tree
    tex = tree.nodes["whp-color"]
    bsdf = next(n for n in tree.nodes if n.type == "BSDF_PRINCIPLED")
    return tree, tex, bsdf


def _mean_luminance(image):
    px = np.empty(image.size[0] * image.size[1] * 4, dtype=np.float32)
    image.pixels.foreach_get(px)
    px = px.reshape(-1, 4)
    lum = px[:, 0] * 0.2126 + px[:, 1] * 0.7152 + px[:, 2] * 0.0722
    lum = lum[lum > 0.01]                       # unused black texels
    return float(np.median(lum)) if len(lum) else 0.5


def recolour(obj, color, border=None, border_color=None, contrast=0.6):
    """Dye a cloth texture another colour: keep its light and shade (the
    folds and weave, as luminance relative to the texture's median, softened
    by `contrast`) and replace its hue by `color` (linear RGB). `border`
    names a colour attribute (border_attribute) where `border_color` is
    woven in instead."""
    tree, tex, bsdf = _colour_nodes(obj)
    median = _mean_luminance(tex.image)
    bw = tree.nodes.new("ShaderNodeRGBToBW")
    tree.links.new(tex.outputs["Color"], bw.inputs["Color"])
    shade = tree.nodes.new("ShaderNodeMath")            # 1 + contrast * (lum / median - 1)
    shade.operation = "MULTIPLY_ADD"
    shade.inputs[1].default_value = contrast / median
    shade.inputs[2].default_value = 1.0 - contrast
    tree.links.new(bw.outputs["Val"], shade.inputs[0])
    out = None
    for col, factor in ((color, None), (border_color, border)):
        if col is None:
            continue
        mix = tree.nodes.new("ShaderNodeMix")
        mix.data_type = "RGBA"
        mix.blend_type = "MULTIPLY"
        mix.inputs["Factor"].default_value = 1.0
        mix.inputs["A"].default_value = (*col, 1.0)
        tree.links.new(shade.outputs["Value"], mix.inputs["B"])
        if out is None:
            out = mix
            continue
        blend = tree.nodes.new("ShaderNodeMix")
        blend.data_type = "RGBA"
        attr = tree.nodes.new("ShaderNodeAttribute")
        attr.attribute_name = factor
        tree.links.new(attr.outputs["Fac"], blend.inputs["Factor"])
        tree.links.new(out.outputs["Result"], blend.inputs["A"])
        tree.links.new(mix.outputs["Result"], blend.inputs["B"])
        out = blend
    tree.links.new(out.outputs["Result"], bsdf.inputs["Base Color"])
    log(f"recoloured {obj.name}: median luminance {median:.3f}")


def tint(obj, color):
    """Multiply a skin texture by `color` (a darker or more olive skin)."""
    tree, tex, bsdf = _colour_nodes(obj)
    mix = tree.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.blend_type = "MULTIPLY"
    mix.inputs["Factor"].default_value = 1.0
    mix.inputs["B"].default_value = (*color, 1.0)
    tree.links.new(tex.outputs["Color"], mix.inputs["A"])
    tree.links.new(mix.outputs["Result"], bsdf.inputs["Base Color"])


def border_attribute(obj, width, name="whp_border", hem=True, sleeves=True):
    """Mark a woven border on a tunic as a point colour attribute (1 in the
    border, 0 elsewhere): `width` up from the hem and in from the ends of
    the sleeves. In the source model's space, so the border follows the
    cloth once it is posed."""
    co = np.empty(len(obj.data.vertices) * 3)
    obj.data.vertices.foreach_get("co", co)
    co = co.reshape(-1, 3)
    mark = np.zeros(len(co))
    if hem:
        mark = np.maximum(mark, np.clip((co[:, 2].min() + width - co[:, 2]) / 0.004 + 0.5, 0.0, 1.0))
    if sleeves:
        reach = np.abs(co[:, 0])
        mark = np.maximum(mark, np.clip((reach - (reach.max() - width)) / 0.004 + 0.5, 0.0, 1.0))
    attr = obj.data.color_attributes.new(name, "FLOAT_COLOR", "POINT")
    values = np.repeat(mark[:, None], 4, axis=1)
    values[:, 3] = 1.0
    attr.data.foreach_set("color", values.astype(np.float32).ravel())
    log(f"{obj.name}: border on {int((mark > 0.5).sum())} of {len(mark)} vertices")
