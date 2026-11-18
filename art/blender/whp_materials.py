"""Procedural materials for the generated kit.

The exported model carries one baked colour texture, one baked normal map
and one baked metallicRoughness map, so these materials only have to look
right as plain colour plus bump, plus a roughness and a metalness each: the
bakes read whatever feeds "Base Color", the shading normal, and the
Principled BSDF's Roughness and Metallic values (whp_lod.SurfaceSwap).
Colours are linear RGB. For the metals the base colour is the colour of
the metal's reflection (glTF metallic-roughness), so it is light: polished
iron reflects about sRGB (196, 197, 199), copper (250, 209, 194), and tin
bronze lies between copper and gold. The "dark" partner of each colour is
the tarnish mixed in by noise, not a shadow.
"""

import math

import bpy
import numpy as np

# Bronze is kept saturated: in the battle scene the metal mirrors a pale
# blue sky, which washes out a paler gold until it reads as silver.
BRONZE = (0.80, 0.47, 0.17)         # sRGB about (231, 182, 115)
BRONZE_DARK = (0.52, 0.27, 0.08)
IRON = (0.56, 0.57, 0.59)           # sRGB about (197, 198, 201)
IRON_DARK = (0.34, 0.34, 0.35)
# Roughness: polished bronze 0.3-0.45, iron a little rougher, mail 0.5-0.6.
BRONZE_ROUGHNESS = 0.40
IRON_ROUGHNESS = 0.42
MAIL_ROUGHNESS = 0.55
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
    mat, tree, bsdf = _new("whp-bronze", BRONZE_ROUGHNESS, metallic=1.0)
    _noise_mix(tree, bsdf, BRONZE, BRONZE_DARK, 30.0, contrast=(0.2, 0.75), bump=0.08)
    return mat


def iron():
    mat, tree, bsdf = _new("whp-iron", IRON_ROUGHNESS, metallic=1.0)
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


def shield_paint(color=SHIELD_RED, dark=SHIELD_RED_DARK):
    """Paint on a shield face; red unless a model asks for another colour."""
    mat, tree, bsdf = _new("whp-shield-paint", 0.7)
    _noise_mix(tree, bsdf, color, dark, 9.0, detail=6.0, contrast=(0.3, 0.75), bump=0.1)
    return mat


def plain(name, color, dark, roughness=0.8, scale=40.0, bump=0.2):
    """A non-metal of one colour with a little noise: rawhide, cord, cloth."""
    mat, tree, bsdf = _new("whp-" + name, roughness)
    _noise_mix(tree, bsdf, color, dark, scale, contrast=(0.3, 0.7), bump=bump)
    return mat


def hair(dark=(0.014, 0.010, 0.008), light=(0.055, 0.038, 0.027), roughness=0.85):
    """Dark hair (T-047): matte, in low-contrast streaks, curls in the bump
    (Voronoi cells). The plain material it replaces was a smooth sheen."""
    mat, tree, bsdf = _new("whp-hair", roughness)
    coord = tree.nodes.new("ShaderNodeTexCoord")
    cells = tree.nodes.new("ShaderNodeTexVoronoi")
    cells.inputs["Scale"].default_value = 160.0
    tree.links.new(coord.outputs["Object"], cells.inputs["Vector"])
    streak = tree.nodes.new("ShaderNodeTexNoise")
    streak.inputs["Scale"].default_value = 90.0
    streak.inputs["Detail"].default_value = 8.0
    streak.inputs["Distortion"].default_value = 2.0
    tree.links.new(coord.outputs["Object"], streak.inputs["Vector"])
    ramp = tree.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (*dark, 1.0)
    ramp.color_ramp.elements[1].color = (*light, 1.0)
    ramp.color_ramp.elements[0].position = 0.35
    ramp.color_ramp.elements[1].position = 0.75
    tree.links.new(streak.outputs["Fac"], ramp.inputs["Fac"])
    tree.links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
    bump = tree.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.7
    bump.inputs["Distance"].default_value = 0.003
    tree.links.new(cells.outputs["Distance"], bump.inputs["Height"])
    tree.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    return mat


FUR = (0.20, 0.155, 0.11)
FUR_DARK = (0.055, 0.045, 0.035)


def fur():
    """A wolf's pelt: grey-brown, in coarse streaks along the hair."""
    mat, tree, bsdf = _new("whp-fur", 0.95)
    _noise_mix(tree, bsdf, FUR, FUR_DARK, 1.0, detail=8.0, contrast=(0.25, 0.75), bump=0.6,
               stretch=(140.0, 140.0, 22.0))
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
        color[..., i] = channel * shade
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
    mat, tree, bsdf = _new("whp-mail", MAIL_ROUGHNESS, metallic=0.85)
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
