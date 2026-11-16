"""What the Roman models share: the body made ready for the kit, the helmet
and shield, the skinning rules and the armature data the clips need.

All built in the source model's space (T pose, Z up, facing -Y); the rig
stage carries everything into the rig's pose.
"""

import bpy
import numpy as np

import roman_fit
import roman_hands
import roman_helmet
import roman_shield
import roman_source
import whp_build
import whp_materials
from roman_fit import FINAL_SCALE
from whp_common import log
from whp_mesh import get_coords

# Parts that follow one bone without bending.
RIGID = {
    "Helmet": "head",
    "Helmet_cheeks": "head",
    "Helmet_crest": "head",
    "New_eye": "head",
    "New_eye_2": "head",
    "Scutum": "hand_l",
    "Sword2_1": "hand_r",
}
# Parts that follow two bones half and half without bending: the scabbard
# hangs from the belt but swings with the thigh (and lies along it).
SHARED = {"Scabbard": ("pelvis", "thigh_r")}
WEAPON = "Sword2_1"


def materials(detail):
    """The kit materials by short name: made afresh for the detailed kit,
    the same ones looked up for the low copies."""
    if detail == 2:
        mats = whp_materials.library()
    else:
        mats = {m.name[4:]: m for m in bpy.data.materials if m.name.startswith("whp-")}
    mats["shield"] = bpy.data.materials["whp-shield-paint"]
    return mats


def prepare_body():
    """Close the fists, put the sword in the right one, move the scabbard to
    the right hip (Polybius 6.23.6)."""
    objs = bpy.data.objects
    for side in (1, -1):
        roman_hands.curl_hand(objs["New_arms"], side)
    roman_hands.seat_sword(objs[WEAPON])
    roman_source.scabbard_to_right_hip(objs["Scabbard"])


def helmet_and_shield(detail, mats, suffix=""):
    """Montefortino helmet with cheek pieces and crest; the scutum in the
    left fist. Returns the new objects."""
    made = [
        roman_helmet.build_bowl(detail, mats, "Helmet" + suffix),
        roman_helmet.build_cheeks(detail, mats, "Helmet_cheeks" + suffix),
        roman_helmet.build_crest(detail, mats, 1.0 / FINAL_SCALE, "Helmet_crest" + suffix),
    ]
    shield = roman_shield.build(detail, mats, "Scutum" + suffix)
    roman_shield.place(shield, roman_hands.grip_axis_point(1), 1.0 / FINAL_SCALE)
    made.append(shield)
    return made


def hide_low(objs):
    """The game-resolution copies (".low"): the LOD stage uses them as the
    low meshes and bakes the detailed kit onto them."""
    for obj in objs:
        obj.hide_render = True
        log(f"{obj.name}: {len(obj.data.polygons)} faces")


def rig_extras(armature, matrices, index):
    """Store on the armature how the shield sits on the left hand and where
    the sword points from the right fist, at rest (whp_clips.Kit)."""
    hand = matrices[index["hand_l"]][:3, :3] / roman_fit.BASE_SCALE
    down, out = roman_shield.axes_in_source()
    armature["whp_shield_down"] = [float(x) for x in hand @ np.array(down)]
    armature["whp_shield_out"] = [float(x) for x in hand @ np.array(out)]
    sword = get_coords(bpy.data.objects[WEAPON])
    hand_r = np.array(armature.data.bones["hand_r"].head_local)
    armature["whp_weapon_axis"] = [float(x) for x in whp_build.weapon_axis(sword, hand_r)]
