"""Shared helpers for the World History Platform Blender scripts.

Every entry script is run headless:

    blender --background --factory-startup --disable-autoexec \
        --python art/blender/<script>.py -- <arguments>

Source downloads live outside the repo, under WHP_ASSETS (default
E:/World_History_Platform_assets). Intermediate files go to art/build/,
which is git-ignored.
"""

import math
import os
import sys

import bpy
from mathutils import Matrix, Vector

BLENDER_DIR = os.path.dirname(os.path.abspath(__file__))
ART_DIR = os.path.dirname(BLENDER_DIR)
REPO_DIR = os.path.dirname(ART_DIR)
BUILD_DIR = os.path.join(ART_DIR, "build")
RENDER_DIR = os.path.join(ART_DIR, "renders")
MODELS_DIR = os.path.join(REPO_DIR, "public", "battles", "models")

ASSETS_DIR = os.environ.get("WHP_ASSETS", r"E:\World_History_Platform_assets")
SOURCES_DIR = os.path.join(ASSETS_DIR, "sources")


def script_args():
    """Arguments after the lone "--" on the Blender command line."""
    argv = sys.argv
    return argv[argv.index("--") + 1:] if "--" in argv else []


def log(*parts):
    print("[whp]", *parts, flush=True)


def ensure_dir(path):
    if path:
        os.makedirs(path, exist_ok=True)
    return path


def reset_scene():
    """Empty file with metric units; the same start for every run."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0
    return scene


def save_blend(path):
    ensure_dir(os.path.dirname(path))
    bpy.ops.wm.save_as_mainfile(filepath=path, check_existing=False, compress=True)
    backup = path + "1"
    if os.path.exists(backup):
        os.remove(backup)


def open_blend(path):
    bpy.ops.wm.open_mainfile(filepath=path, load_ui=False, use_scripts=False)


# --------------------------------------------------------------------------
# Selection and object helpers (operators need a clean, explicit context).
# --------------------------------------------------------------------------

def deselect_all():
    for obj in bpy.context.view_layer.objects:
        obj.select_set(False)


def select_only(objs, active=None):
    if not isinstance(objs, (list, tuple)):
        objs = [objs]
    if bpy.context.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")
    deselect_all()
    for obj in objs:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = active or objs[0]


def delete_objects(objs):
    for obj in list(objs):
        data = obj.data
        bpy.data.objects.remove(obj, do_unlink=True)
        if data is not None and data.users == 0:
            if isinstance(data, bpy.types.Mesh):
                bpy.data.meshes.remove(data)
            elif isinstance(data, bpy.types.Armature):
                bpy.data.armatures.remove(data)


def apply_transform(obj, location=True, rotation=True, scale=True):
    select_only(obj)
    bpy.ops.object.transform_apply(location=location, rotation=rotation, scale=scale)


def join_objects(objs, name):
    """Join meshes into the first one and rename it."""
    objs = list(objs)
    if len(objs) > 1:
        select_only(objs, active=objs[0])
        bpy.ops.object.join()
    joined = objs[0]
    joined.name = name
    joined.data.name = name
    return joined


def duplicate_object(obj, name):
    copy = obj.copy()
    copy.data = obj.data.copy()
    copy.name = name
    copy.data.name = name
    for coll in obj.users_collection:
        coll.objects.link(copy)
    return copy


def link_object(obj, collection=None):
    (collection or bpy.context.scene.collection).objects.link(obj)
    return obj


def mesh_objects(scene=None):
    scene = scene or bpy.context.scene
    return sorted((o for o in scene.objects if o.type == "MESH"), key=lambda o: o.name)


def triangle_count(obj):
    mesh = obj.data
    mesh.calc_loop_triangles()
    return len(mesh.loop_triangles)


def world_bounds(objs):
    """Axis-aligned bounds of the given mesh objects, in world space."""
    lo = Vector((math.inf,) * 3)
    hi = Vector((-math.inf,) * 3)
    deps = bpy.context.evaluated_depsgraph_get()
    for obj in objs:
        ev = obj.evaluated_get(deps)
        mesh = ev.to_mesh()
        mw = ev.matrix_world
        for v in mesh.vertices:
            p = mw @ v.co
            for i in range(3):
                lo[i] = min(lo[i], p[i])
                hi[i] = max(hi[i], p[i])
        ev.to_mesh_clear()
    return lo, hi


# --------------------------------------------------------------------------
# FBX import
# --------------------------------------------------------------------------

def import_fbx(path):
    """Import an FBX and return the new objects."""
    if not os.path.isfile(path):
        raise FileNotFoundError(
            f"Source file not found: {path}\n"
            "Set WHP_ASSETS to the folder that holds sources/ (see art/README.md)."
        )
    before = set(bpy.data.objects)
    bpy.ops.import_scene.fbx(filepath=path)
    return sorted((o for o in bpy.data.objects if o not in before), key=lambda o: o.name)


def find_texture(folders, stem):
    """Find <stem>.<image extension> in the first folder that has it."""
    for folder in folders:
        for ext in (".jpeg", ".jpg", ".png"):
            path = os.path.join(folder, stem + ext)
            if os.path.isfile(path):
                return path
    return None
