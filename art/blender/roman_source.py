"""Stages "source" and "strip": import the source model, drop the Imperial kit.

Source: "Roman Soldier - T pose" by Andywoodhead (CC BY 4.0): 16 separate
meshes, no armature, 280k triangles, standing in a T pose and facing -Y.
"""

import os

import bpy

from whp_common import (
    SOURCES_DIR,
    apply_transform,
    delete_objects,
    find_texture,
    import_fbx,
    log,
    mesh_objects,
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

# Roughness for the preview materials (the export bakes plain colour).
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
