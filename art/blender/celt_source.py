"""Stage "source" for the Gaul: the Celt model, which is already the rig's.

Source: "Celt - rigged for UE4/5" by Andywoodhead (CC BY 4.0), the model
the shared skeleton comes from: bare torso, trousers, belt, torc,
moustache, in the rig's own A pose. His meshes keep their shape; what
changes:

  - the blue body paint is taken off the skin textures (painted Britons
    are Caesar's; nothing says the Gauls at Cannae were painted);
  - the neon green and purple stripes of the trousers are dyed in plant
    colours, ochre and madder brown (Diodorus 5.30: dyed, many-coloured
    clothes and breeches);
  - his round shield and short sword are replaced (celt_kit) and only
    used to find where his fists hold them;
  - with fists=True his open hands are closed into fists (celt_hands).

Space: the Celt's own, unscaled (metres, Z up, facing -Y, 2.09 m tall);
the rig stage scales everything by RIG_SCALE.
"""

import os

import bpy
import numpy as np
from mathutils import Matrix

import celt_hands
from whp_common import SOURCES_DIR, delete_objects, find_texture, import_fbx, log, triangle_count
from whp_skeleton import CELT_FBX

CELT_TEXTURES = [os.path.join(SOURCES_DIR, "celt-andywoodhead", "textures")]
# Source mesh -> name in the build (the rig stage imports the Celt again for
# his weights, under the original names) and its roughness.
MESHES = {
    "Body": ("Celt_body", 0.55),
    "Hands": ("Celt_arms", 0.55),
    "Head": ("Celt_head", 0.55),
    "Legs": ("Celt_legs", 0.85),
    "Belt": ("Celt_belt", 0.6),
}
REFERENCE = ("Shield", "Sword")             # kept as Ref_<name> only to place the new kit

# Trousers: stripes dyed in these colours (sRGB, as stored in the texture).
DYES = {"green": (0.60, 0.47, 0.25), "purple": (0.40, 0.19, 0.13)}


# --------------------------------------------------------------------------
# Texture edits, on the pixels (sRGB-encoded, as Blender stores them)
# --------------------------------------------------------------------------

def _hsv(rgb):
    mx, mn = rgb.max(axis=1), rgb.min(axis=1)
    d = mx - mn
    s = np.where(mx > 1e-6, d / np.maximum(mx, 1e-6), 0.0)
    r, g, b = rgb[:, 0], rgb[:, 1], rgb[:, 2]
    safe = np.maximum(d, 1e-6)
    h = np.where(mx == r, ((g - b) / safe) % 6.0, np.where(mx == g, (b - r) / safe + 2.0, (r - g) / safe + 4.0)) / 6.0
    return np.where(d > 1e-6, h, 0.0), s, mx


def _band(h, lo, hi, soft=0.03):
    """1 for hues in [lo, hi], fading out over `soft`."""
    return np.clip(np.minimum(h - lo + soft, hi + soft - h) / soft, 0.0, 1.0)


PAINT_GROW = 4               # texels: the dark outlines round the paint go too


def _grow(mask, shape, radius):
    grid = mask.reshape(shape)
    out = grid.copy()
    for dy in range(-radius, radius + 1):
        for dx in range(-radius, radius + 1):
            if dx * dx + dy * dy <= radius * radius:
                out = np.maximum(out, np.roll(np.roll(grid, dy, axis=0), dx, axis=1))
    return out.ravel()


def _remove_paint(rgb, shape):
    """Blue paint (and the dark outlines round it) -> the skin's tone, with a
    little of the light and shade."""
    h, s, v = _hsv(rgb)
    # Blue to violet: the paint (skin is red-orange).
    paint = _band(h, 0.48, 0.90, soft=0.04) * np.clip((s - 0.05) / 0.07, 0.0, 1.0)
    skin = (h < 0.11) & (s > 0.18) & (s < 0.75) & (v > 0.25)
    if not skin.any() or not (paint > 0.5).any():
        return rgb, None
    paint = _grow(paint, shape, PAINT_GROW)
    # Fill from the bare skin round each patch: the mean of the unpainted
    # skin nearby, from the widest window down to the narrowest that still
    # holds enough of it (big patches have no skin close to their middle).
    weight = ((1.0 - paint) * ((h < 0.14) & (s > 0.12) & (v > 0.2))).reshape(shape)
    fill = np.repeat(np.median(rgb[skin], axis=0)[None, :], len(rgb), axis=0).reshape(*shape, 3)
    image = rgb.reshape(*shape, 3)
    for radius in (160, 64, 24, 10):
        total = _box(weight, radius)
        ok = total > 0.08
        for c in range(3):
            mean = _box(image[..., c] * weight, radius) / np.maximum(total, 1e-6)
            fill[..., c] = np.where(ok, mean, fill[..., c])
    fill = fill.reshape(-1, 3)
    return rgb * (1 - paint[:, None]) + fill * paint[:, None], paint


def _box(a, r):
    """Sum of `a` over a (2r+1)-square window round each texel (integral image)."""
    pad = np.pad(a, r + 1, mode="edge").cumsum(axis=0).cumsum(axis=1)
    n0, n1 = a.shape
    k = 2 * r + 1
    return (pad[k:k + n0, k:k + n1] - pad[0:n0, k:k + n1] - pad[k:k + n0, 0:n1] + pad[0:n0, 0:n1])


def _dye_stripes(rgb, shape):
    h, s, v = _hsv(rgb)
    out = rgb.copy()
    count = 0
    for key, (lo, hi) in (("green", (0.17, 0.48)), ("purple", (0.68, 0.92))):
        mask = _band(h, lo, hi) * np.clip((s - 0.15) / 0.1, 0.0, 1.0)
        if not (mask > 0.5).any():
            continue
        shade = np.clip(v / np.median(v[mask > 0.5]), 0.4, 1.5)
        new = np.array(DYES[key])[None, :] * shade[:, None]
        out = out * (1 - mask[:, None]) + new * mask[:, None]
        count += int((mask > 0.5).sum())
    log(f"dyed {count} texels of stripes")
    return out, None


EDITS = {"Body": _remove_paint, "Hands": _remove_paint, "Head": _remove_paint, "Legs": _dye_stripes}


def _edited_image(path, edit, name, non_color=False):
    """A packed copy of an image with edit(rgb, shape) -> (rgb, mask)
    applied; returns the image and the mask (or None)."""
    src = bpy.data.images.load(path, check_existing=False)
    w, h = src.size
    px = np.empty(w * h * 4, dtype=np.float32)
    src.pixels.foreach_get(px)
    px = px.reshape(-1, 4)
    rgb, mask = edit(px[:, :3].astype(np.float64), (h, w))
    px[:, :3] = np.clip(rgb, 0.0, 1.0)
    image = bpy.data.images.new(name, w, h, alpha=False)
    if non_color:
        image.colorspace_settings.name = "Non-Color"
    image.pixels.foreach_set(px.ravel())
    image.pack()
    bpy.data.images.remove(src)
    if mask is not None:
        log(f"{name}: {int((mask > 0.5).sum())} texels changed")
    return image, mask


# --------------------------------------------------------------------------
# Import
# --------------------------------------------------------------------------

def _material(mat, stem, roughness):
    mat.name = f"Celt_{stem}"          # not the FBX name: the rig stage imports the Celt again
    mat.use_nodes = True
    tree = mat.node_tree
    tree.nodes.clear()
    out = tree.nodes.new("ShaderNodeOutputMaterial")
    bsdf = tree.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Metallic"].default_value = 0.0
    bsdf.inputs["Roughness"].default_value = roughness
    tree.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    color = find_texture(CELT_TEXTURES, stem + "_TXTR")
    tex = tree.nodes.new("ShaderNodeTexImage")
    tex.name = "whp-color"
    mask = None
    if stem in EDITS:
        tex.image, mask = _edited_image(color, EDITS[stem], f"whp-celt-{stem.lower()}")
    else:
        tex.image = bpy.data.images.load(color, check_existing=True)
    tree.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    normal = find_texture(CELT_TEXTURES, stem + "_NM")
    if normal:
        tex = tree.nodes.new("ShaderNodeTexImage")
        if mask is not None:
            # The paint's outlines are in the relief too: flatten it there.
            def flatten(rgb, shape):
                return rgb * (1 - mask[:, None]) + np.array((0.5, 0.5, 1.0))[None, :] * mask[:, None], None
            tex.image, _ = _edited_image(normal, flatten, f"whp-celt-{stem.lower()}-normal", non_color=True)
        else:
            tex.image = bpy.data.images.load(normal, check_existing=True)
            tex.image.colorspace_settings.name = "Non-Color"
        nmap = tree.nodes.new("ShaderNodeNormalMap")
        tree.links.new(tex.outputs["Color"], nmap.inputs["Color"])
        tree.links.new(nmap.outputs["Normal"], bsdf.inputs["Normal"])
    # The gold torc and arm rings, the belt fittings: the source's metal maps.
    metal = find_texture(CELT_TEXTURES, stem + "_MET") or find_texture(CELT_TEXTURES, stem + " MET")
    if metal:
        tex = tree.nodes.new("ShaderNodeTexImage")
        tex.image = bpy.data.images.load(metal, check_existing=True)
        tex.image.colorspace_settings.name = "Non-Color"
        tree.links.new(tex.outputs["Color"], bsdf.inputs["Metallic"])


def import_celt(fists=False):
    """Import the Celt: his body meshes in his own space, renamed; his shield
    and sword as references (REFERENCE); the armature removed. With `fists`
    his hands are closed first (celt_hands), and the hollow of each fist is
    kept on Celt_arms (celt_hands.GRIP_POINT, GRIP_AXIS)."""
    objs = import_fbx(CELT_FBX)
    grips = {}
    if fists:
        armature = next(o for o in objs if o.type == "ARMATURE")
        grips = celt_hands.close(armature, [o for o in objs if o.type == "MESH" and o.name in MESHES])
    keep = []
    for obj in objs:
        if obj.type != "MESH" or obj.name not in MESHES and obj.name not in REFERENCE:
            continue
        world = obj.matrix_world.copy()
        obj.parent = None
        obj.data.transform(world)
        obj.matrix_world = Matrix.Identity(4)
        for mod in list(obj.modifiers):
            obj.modifiers.remove(mod)
        obj.vertex_groups.clear()
        if obj.name in REFERENCE:
            obj.name = "Ref_" + obj.name
        else:
            stem = obj.name
            obj.name, roughness = MESHES[stem]
            obj.data.name = obj.name
            for mat in obj.data.materials:
                if mat is not None:
                    _material(mat, stem, roughness)
            for poly in obj.data.polygons:
                poly.use_smooth = True
            log(f"imported {obj.name}: {triangle_count(obj)} triangles")
        keep.append(obj)
    delete_objects([o for o in objs if o not in keep])
    arms = bpy.data.objects["Celt_arms"]
    for side, (point, axis) in grips.items():
        arms[celt_hands.GRIP_POINT.format(side)] = [float(x) for x in point]
        arms[celt_hands.GRIP_AXIS.format(side)] = [float(x) for x in axis]
    for image in list(bpy.data.images):
        if image.users == 0:
            bpy.data.images.remove(image)
    return keep


def build(bone_names, rig_joints, report=None):
    """fit() for whp_build: the Celt already stands in the rig's rest pose,
    in the rig's own space."""
    if report:
        report("the Celt is the rig's own model: identity for every bone")
    return np.tile(np.eye(4), (len(bone_names), 1, 1))
