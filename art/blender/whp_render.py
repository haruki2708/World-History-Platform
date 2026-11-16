"""Lighting, cameras and still renders for previews and review images."""

import math
import os

import bpy
from mathutils import Vector

from whp_common import ensure_dir, log, world_bounds

# Direction the camera looks FROM, for a figure that faces -Y in Blender.
VIEW_DIRS = {
    "front": Vector((0.0, -1.0, 0.0)),
    "back": Vector((0.0, 1.0, 0.0)),
    "left": Vector((1.0, 0.0, 0.0)),    # the figure's left side (shield side)
    "right": Vector((-1.0, 0.0, 0.0)),  # the figure's right side (sword side)
    "front34": Vector((0.62, -1.0, 0.0)),
    "back34": Vector((-0.62, 1.0, 0.0)),
    "top": Vector((0.0, -0.001, 1.0)),
}


def setup_render(scene, width=900, height=900, samples=32, transparent=False):
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = width
    scene.render.resolution_y = height
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = transparent
    scene.eevee.taa_render_samples = samples
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    scene.display_settings.display_device = "sRGB"


def setup_world(scene, color=(0.62, 0.64, 0.66), strength=0.55):
    world = bpy.data.worlds.get("whp-world") or bpy.data.worlds.new("whp-world")
    world.use_nodes = True
    nodes = world.node_tree.nodes
    nodes.clear()
    out = nodes.new("ShaderNodeOutputWorld")
    # Camera rays see a flat backdrop; everything else gets soft sky light.
    backdrop = nodes.new("ShaderNodeBackground")
    backdrop.inputs["Color"].default_value = (*color, 1.0)
    backdrop.inputs["Strength"].default_value = 1.0
    ambient = nodes.new("ShaderNodeBackground")
    ambient.inputs["Color"].default_value = (0.85, 0.9, 1.0, 1.0)
    ambient.inputs["Strength"].default_value = strength
    path = nodes.new("ShaderNodeLightPath")
    mix = nodes.new("ShaderNodeMixShader")
    links = world.node_tree.links
    links.new(path.outputs["Is Camera Ray"], mix.inputs["Fac"])
    links.new(ambient.outputs["Background"], mix.inputs[1])
    links.new(backdrop.outputs["Background"], mix.inputs[2])
    links.new(mix.outputs["Shader"], out.inputs["Surface"])
    scene.world = world


def _sun(name, direction, energy, color=(1.0, 1.0, 1.0)):
    data = bpy.data.lights.new(name, "SUN")
    data.energy = energy
    data.color = color
    data.angle = math.radians(8.0)
    obj = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(obj)
    # A sun shines along its local -Z; point that away from `direction`.
    obj.rotation_euler = Vector(direction).to_track_quat("Z", "Y").to_euler()
    return obj


def setup_lights(scene):
    """Key from the front left above, a cool fill, and a rim from behind."""
    for obj in [o for o in scene.objects if o.type == "LIGHT"]:
        bpy.data.objects.remove(obj, do_unlink=True)
    return [
        _sun("whp-key", (0.55, -0.75, 0.9), 3.2, (1.0, 0.97, 0.92)),
        _sun("whp-fill", (-0.8, -0.5, 0.35), 1.0, (0.85, 0.9, 1.0)),
        _sun("whp-rim", (-0.2, 0.9, 0.6), 1.6, (1.0, 1.0, 1.0)),
    ]


def add_ground(scene, z=0.0, size=40.0, color=(0.55, 0.56, 0.57)):
    mesh = bpy.data.meshes.new("whp-ground")
    h = size / 2
    mesh.from_pydata([(-h, -h, z), (h, -h, z), (h, h, z), (-h, h, z)], [], [(0, 1, 2, 3)])
    obj = bpy.data.objects.new("whp-ground", mesh)
    scene.collection.objects.link(obj)
    mat = bpy.data.materials.new("whp-ground")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = 1.0
    mesh.materials.append(mat)
    return obj


def get_camera(scene, name="whp-camera"):
    obj = bpy.data.objects.get(name)
    if obj is None:
        obj = bpy.data.objects.new(name, bpy.data.cameras.new(name))
        scene.collection.objects.link(obj)
    scene.camera = obj
    return obj


def aim_camera(scene, lo, hi, view="front", ortho=True, margin=1.08, lens=85.0, elevation=0.0):
    """Frame the box lo..hi from one of VIEW_DIRS (or a direction vector)."""
    cam = get_camera(scene)
    direction = Vector(VIEW_DIRS[view] if isinstance(view, str) else view).normalized()
    if elevation:
        direction = (direction + Vector((0, 0, math.tan(math.radians(elevation))))).normalized()
    lo, hi = Vector(lo), Vector(hi)
    center = (lo + hi) / 2
    # A camera looks along its local -Z, so +Z points back at the viewer.
    cam.rotation_euler = direction.to_track_quat("Z", "Y").to_euler()
    bpy.context.view_layer.update()
    basis = cam.rotation_euler.to_matrix()
    right = basis @ Vector((1, 0, 0))
    up = basis @ Vector((0, 1, 0))
    corners = [Vector((x, y, z)) for x in (lo[0], hi[0]) for y in (lo[1], hi[1]) for z in (lo[2], hi[2])]
    w = max(abs((c - center).dot(right)) for c in corners) * 2
    h = max(abs((c - center).dot(up)) for c in corners) * 2
    aspect = scene.render.resolution_x / scene.render.resolution_y
    # Horizontal span that covers the box in both directions.
    span = max(w, h * aspect) * margin
    radius = (hi - lo).length / 2
    cam.data.sensor_fit = "HORIZONTAL"
    if ortho:
        cam.data.type = "ORTHO"
        cam.data.ortho_scale = span
        distance = radius + 10.0
    else:
        cam.data.type = "PERSP"
        cam.data.lens = lens
        fov = 2 * math.atan(cam.data.sensor_width / (2 * lens))
        distance = (span / 2) / math.tan(fov / 2) + radius * 0.5
    cam.location = center + direction * distance
    cam.data.clip_start = 0.05
    cam.data.clip_end = distance + radius + 50.0
    return cam


def render_still(scene, path, quality=90):
    ensure_dir(os.path.dirname(path))
    ext = os.path.splitext(path)[1].lower()
    settings = scene.render.image_settings
    if ext in (".jpg", ".jpeg"):
        settings.file_format = "JPEG"
        settings.quality = quality
        settings.color_mode = "RGB"
    else:
        settings.file_format = "PNG"
        settings.color_mode = "RGBA" if scene.render.film_transparent else "RGB"
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    log("rendered", path)


def render_views(scene, objs, path_pattern, views=("front", "left", "back"), size=900, ortho=True, pad=0.0):
    """Quick previews of a set of objects: one file per view."""
    setup_render(scene, size, size)
    setup_world(scene)
    setup_lights(scene)
    lo, hi = world_bounds(objs)
    lo -= Vector((pad,) * 3)
    hi += Vector((pad,) * 3)
    for view in views:
        aim_camera(scene, lo, hi, view, ortho=ortho)
        render_still(scene, path_pattern.format(view=view))
