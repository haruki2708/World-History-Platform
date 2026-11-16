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
import roman_weapons
import whp_build
import whp_materials
from roman_fit import FINAL_SCALE
from whp_common import delete_objects, log
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


def materials(detail, extra=()):
    """The kit materials by short name: made afresh for the detailed kit,
    the same ones looked up for the low copies. `extra`: (short name,
    maker) pairs for materials a model adds or recolours; each maker makes
    a material called "whp-<short name>" (the shield paint is
    "whp-shield-paint", looked up as "shield")."""
    if detail == 2:
        mats = whp_materials.library()
        for key, maker in extra:
            mats[key] = maker()
    else:
        mats = {m.name[4:]: m for m in bpy.data.materials if m.name.startswith("whp-")}
    mats["shield"] = bpy.data.materials["whp-shield-paint"]
    return mats


def prepare_body(sword="hand"):
    """Close the fists and move the scabbard to the right hip (Polybius
    6.23.6). The sword goes into the right fist (sword="hand") or, when
    that hand holds something else, into the scabbard ("sheathed"); "none"
    takes away both sword and scabbard."""
    objs = bpy.data.objects
    for side in (1, -1):
        roman_hands.curl_hand(objs["New_arms"], side)
    roman_source.scabbard_to_right_hip(objs["Scabbard"])
    if sword == "hand":
        roman_hands.seat_sword(objs[WEAPON])
    elif sword == "sheathed":
        roman_weapons.sheathe(objs[WEAPON], objs["Scabbard"])
    elif sword == "none":
        delete_objects([objs[WEAPON], objs["Scabbard"]])
    else:
        raise ValueError(sword)


def helmet(detail, mats, suffix="", cheeks=True, crest=True):
    """Montefortino helmet, with cheek pieces and a crest unless told not."""
    made = [roman_helmet.build_bowl(detail, mats, "Helmet" + suffix)]
    if cheeks:
        made.append(roman_helmet.build_cheeks(detail, mats, "Helmet_cheeks" + suffix))
    if crest:
        made.append(roman_helmet.build_crest(detail, mats, 1.0 / FINAL_SCALE, "Helmet_crest" + suffix))
    return made


def scutum(detail, mats, suffix=""):
    """The oval scutum in the left fist."""
    shield = roman_shield.build(detail, mats, "Scutum" + suffix)
    roman_shield.place(shield, roman_hands.grip_axis_point(1), 1.0 / FINAL_SCALE)
    return shield


def helmet_and_shield(detail, mats, suffix=""):
    """Montefortino helmet with cheek pieces and crest; the scutum in the
    left fist. Returns the new objects."""
    return helmet(detail, mats, suffix) + [scutum(detail, mats, suffix)]


def hide_low(objs):
    """The game-resolution copies (".low"): the LOD stage uses them as the
    low meshes and bakes the detailed kit onto them."""
    for obj in objs:
        obj.hide_render = True
        log(f"{obj.name}: {len(obj.data.polygons)} faces")


def rig_extras(armature, matrices, index, weapon=WEAPON, shield=True):
    """Store on the armature how the shield sits on the left hand and where
    the weapon in the right fist points, at rest (whp_clips.Kit). A model
    whose right hand holds something else than the sword passes its name
    (functools.partial); one without a shield passes shield=False."""
    if shield:
        hand = matrices[index["hand_l"]][:3, :3] / roman_fit.BASE_SCALE
        down, out = roman_shield.axes_in_source()
        armature["whp_shield_down"] = [float(x) for x in hand @ np.array(down)]
        armature["whp_shield_out"] = [float(x) for x in hand @ np.array(out)]
    held = get_coords(bpy.data.objects[weapon])
    hand_r = np.array(armature.data.bones["hand_r"].head_local)
    armature["whp_weapon_axis"] = [float(x) for x in whp_build.weapon_axis(held, hand_r)]
