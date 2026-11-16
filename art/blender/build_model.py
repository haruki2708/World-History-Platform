"""Build unit models for the 3D battle scenes.

    blender --background --factory-startup --disable-autoexec \
        --python art/blender/build_model.py -- --model MODEL [--from STAGE] [--to STAGE] [--preview] [--check]

MODEL is a model id (one per unit_<id>.py module, e.g. roman-legionary) or
"all". Stages: source, kit, rig, anim, lod, export (see whp_build). With no
stage arguments everything runs from the source files, writes
public/battles/models/<model>.glb, lists it in index.json and checks it.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import whp_build  # noqa: E402
from whp_common import script_args  # noqa: E402

if __name__ == "__main__":
    whp_build.main(script_args())
