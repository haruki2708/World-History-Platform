"""Procedural materials for the generated kit.

The exported model carries one baked colour texture, one baked normal map
and one baked metallicRoughness map, so these materials only have to look
right as plain colour plus bump, plus a roughness and a metalness each: the
bakes read whatever feeds "Base Color", the shading normal, and the
Principled BSDF's Roughness and Metallic values (whp_lod.SurfaceSwap).
Colours are linear RGB; for the metals the base colour is the colour of
the metal's reflection.
"""

import math

import bpy
import numpy as np

BRONZE = (0.44, 0.235, 0.06)
BRONZE_DARK = (0.16, 0.08, 0.02)
IRON = (0.23, 0.24, 0.26)
IRON_DARK = (0.09, 0.09, 0.10)
LEATHER = (0.16, 0.085, 0.04)
LEATHER_DARK = (0.07, 0.04, 0.02)
WOOD = (0.30, 0.19, 0.10)
WOOD_DARK = (0.13, 0.075, 0.035)
SHIELD_RED = (0.30, 0.03, 0.025)
SHIELD_RED_DARK = (0.15, 0.018, 0.016)
FEATHER = (0.30, 0.02, 0.045)
FEATHER_DARK = (0.07, 0.008, 0.02)


def _new(name, roughness, metallic=0.0):
    old = bpy.data.materials.get(name)
    if old is not None:
        bpy.data.materials.remove(old)
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    tree = mat.node_tree
    tree.nodes.clear()
    out = tree.nodes.new("ShaderNodeOutputMaterial")
    bsdf = tree.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    tree.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat, tree, bsdf


def _object_coords(tree, scale):
    coord = tree.nodes.new("ShaderNodeTexCoord")
    mapping = tree.nodes.new("ShaderNodeMapping")
    mapping.inputs["Scale"].default_value = scale if isinstance(scale, tuple) else (scale,) * 3
    tree.links.new(coord.outputs["Object"], mapping.inputs["Vector"])
    return mapping.outputs["Vector"]


def _noise_mix(tree, bsdf, color_a, color_b, scale, detail=4.0, contrast=(0.35, 0.7), bump=0.0, stretch=None):
    """Base colour = two colours mixed by noise; optional bump from the same noise."""
    vector = _object_coords(tree, stretch or scale)
    noise = tree.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 1.0 if stretch else 1.0
    noise.inputs["Detail"].default_value = detail
    noise.inputs["Roughness"].default_value = 0.6
    tree.links.new(vector, noise.inputs["Vector"])
    ramp = tree.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = contrast[0]
    ramp.color_ramp.elements[0].color = (*color_b, 1.0)
    ramp.color_ramp.elements[1].position = contrast[1]
    ramp.color_ramp.elements[1].color = (*color_a, 1.0)
    tree.links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    tree.links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
    if bump:
        node = tree.nodes.new("ShaderNodeBump")
        node.inputs["Strength"].default_value = bump
        node.inputs["Distance"].default_value = 0.002
        tree.links.new(noise.outputs["Fac"], node.inputs["Height"])
        tree.links.new(node.outputs["Normal"], bsdf.inputs["Normal"])
    return ramp


def bronze():
    mat, tree, bsdf = _new("whp-bronze", 0.38, metallic=1.0)
    _noise_mix(tree, bsdf, BRONZE, BRONZE_DARK, 30.0, contrast=(0.2, 0.75), bump=0.08)
    return mat


def iron():
    mat, tree, bsdf = _new("whp-iron", 0.45, metallic=1.0)
    _noise_mix(tree, bsdf, IRON, IRON_DARK, 45.0, contrast=(0.25, 0.6), bump=0.15)
    return mat


def leather():
    mat, tree, bsdf = _new("whp-leather", 0.75)
    _noise_mix(tree, bsdf, LEATHER, LEATHER_DARK, 60.0, contrast=(0.3, 0.7), bump=0.25)
    return mat


def wood():
    mat, tree, bsdf = _new("whp-wood", 0.8)
    # Long grain: noise stretched along the shield's long axis (X in the T pose).
    _noise_mix(tree, bsdf, WOOD, WOOD_DARK, 1.0, contrast=(0.35, 0.7), bump=0.2, stretch=(6.0, 90.0, 90.0))
    return mat


def shield_paint():
    mat, tree, bsdf = _new("whp-shield-paint", 0.7)
    _noise_mix(tree, bsdf, SHIELD_RED, SHIELD_RED_DARK, 9.0, detail=6.0, contrast=(0.3, 0.75), bump=0.1)
    return mat


def feather():
    mat, tree, bsdf = _new("whp-feather", 0.6)
    # Barbs: fine streaks across the feather.
    _noise_mix(tree, bsdf, FEATHER, FEATHER_DARK, 1.0, contrast=(0.3, 0.7), bump=0.3, stretch=(400.0, 400.0, 25.0))
    return mat


# --------------------------------------------------------------------------
# Mail: a tileable ring pattern drawn with numpy, projected from three sides.
# --------------------------------------------------------------------------

MAIL_TILE = 128         # pixels
MAIL_RINGS = 4          # ring columns per tile; rows are twice as dense
MAIL_PITCH = 0.0125     # metres between ring centres in the source model's space


def _mail_images():
    """Colour and height of interlinked rings: rows of rings, every other
    row shifted by half a pitch and leaning the other way."""
    n = MAIL_TILE
    ys, xs = np.mgrid[0:n, 0:n].astype(np.float64)
    pitch = n / MAIL_RINGS
    height = np.zeros((n, n))
    rows = MAIL_RINGS * 2
    for row in range(-1, rows + 1):
        cy = (row + 0.5) * pitch / 2
        shift = pitch / 2 if row % 2 else 0.0
        lean = 0.35 if row % 2 else -0.35
        for col in range(-1, MAIL_RINGS + 1):
            cx = col * pitch + shift + pitch / 2
            # Wrap distances so the tile repeats.
            dx = (xs - cx + n / 2) % n - n / 2
            dy = (ys - cy + n / 2) % n - n / 2
            # A ring seen at an angle: an ellipse, squashed vertically.
            du = dx + lean * dy
            radius = np.sqrt((du / (pitch * 0.46)) ** 2 + (dy / (pitch * 0.30)) ** 2)
            wire = np.clip(1.0 - np.abs(radius - 0.8) / 0.26, 0.0, 1.0)
            ring = np.sqrt(wire) * (0.75 if row % 2 else 1.0)
            height = np.maximum(height, ring)
    shade = 0.14 + 0.86 * height ** 1.2
    color = np.empty((n, n, 4))
    for i, channel in enumerate(IRON):
        color[..., i] = (channel * 1.45) * shade
    color[..., 3] = 1.0
    grey = np.repeat(height[..., None], 4, axis=2)
    grey[..., 3] = 1.0
    return color, grey


def _image(name, pixels, non_color):
    old = bpy.data.images.get(name)
    if old is not None:
        bpy.data.images.remove(old)
    h, w = pixels.shape[:2]
    image = bpy.data.images.new(name, w, h, alpha=False, float_buffer=True)
    image.colorspace_settings.name = "Non-Color" if non_color else "Linear Rec.709"
    image.pixels.foreach_set(pixels.astype(np.float32).ravel())
    image.pack()
    return image


def mail():
    mat, tree, bsdf = _new("whp-mail", 0.5, metallic=0.85)
    color, height = _mail_images()
    scale = 1.0 / (MAIL_PITCH * MAIL_RINGS)
    vector = _object_coords(tree, scale)
    nodes = []
    for name, pixels, non_color in (("whp-mail-color", color, False), ("whp-mail-height", height, True)):
        tex = tree.nodes.new("ShaderNodeTexImage")
        tex.image = _image(name, pixels, non_color)
        tex.projection = "BOX"
        tex.projection_blend = 0.2
        tex.interpolation = "Cubic"
        tree.links.new(vector, tex.inputs["Vector"])
        nodes.append(tex)
    tree.links.new(nodes[0].outputs["Color"], bsdf.inputs["Base Color"])
    bump = tree.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.9
    bump.inputs["Distance"].default_value = 0.003
    tree.links.new(nodes[1].outputs["Color"], bump.inputs["Height"])
    tree.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    return mat


def library():
    """All kit materials by short name."""
    return {
        "bronze": bronze(),
        "iron": iron(),
        "leather": leather(),
        "wood": wood(),
        "shield": shield_paint(),
        "feather": feather(),
        "mail": mail(),
    }
