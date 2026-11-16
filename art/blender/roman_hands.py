"""Close the open hands of the source model into grips.

The source stands in a T pose with flat, open hands, palms down, and the
sword simply laid under the right palm. The four fingers are curled as one
block around three hinge lines (knuckles and the two finger joints), the
thumb is swung down, and the sword is nudged into the hollow of the fist.
The left hand gets the same grip for the handle of the shield.

All numbers are in the source model's own space (metres, T pose, arms
along X, the figure facing -Y).
"""

import math

import numpy as np

from whp_mesh import get_coords, rotate_about_axis, set_coords, smoothstep

# Distance from the body's centre line along the arm.
KNUCKLES = 0.844      # metacarpophalangeal joints (middle finger)
JOINT_2 = 0.889
JOINT_3 = 0.917
FINGER_Z = 1.491      # height of the finger centre lines
FINGERS_Y = (0.008, 0.093)  # front and back edge of the four fingers
# Bend at each hinge, degrees, for a grip around a 36 mm handle.
BENDS = (60.0, 73.0, 49.0)
# The knuckle line is an arc: index and little finger sit further back.
ARC = 0.010

# Where the axis of a gripped handle runs (parallel to Y).
GRIP_CENTER = (0.832, 1.458)   # distance along the arm, height
GRIP_Y = 0.050                 # middle of the four fingers
# The sword handle in the source file: centre line and middle.
SWORD_HANDLE = (0.8335, 1.462)

THUMB_PIVOT = (0.795, 1.478)
THUMB_SWING = 58.0


def curl_hand(arms, side):
    """Curl the fingers of one hand. side: +1 left (x > 0), -1 right."""
    co = get_coords(arms)
    s = co[:, 0] * side            # distance along this arm
    hand = s > 0.72
    pts = co[hand].copy()
    pts[:, 0] *= side              # work on a left hand, mirror back at the end
    rest = pts.copy()
    y_mid = (FINGERS_Y[0] + FINGERS_Y[1]) / 2
    y_half = (FINGERS_Y[1] - FINGERS_Y[0]) / 2
    arc = ARC * ((rest[:, 1] - y_mid) / y_half) ** 2
    # Thumb verts lie in front of the index finger; keep them out of the curl.
    fingers = smoothstep(-0.004, 0.010, rest[:, 1])
    fingers = np.where(rest[:, 0] > 0.885, 1.0, fingers)

    hinges = list(zip((KNUCKLES, JOINT_2, JOINT_3), BENDS, (1.0, 1.4, 1.8)))
    for line, bend, arc_scale in reversed(hinges):
        # 0 before the hinge, 1 beyond it, over a 14 mm blend.
        weight = smoothstep(-0.007, 0.007, rest[:, 0] - (line - arc * arc_scale)) * fingers
        pts = rotate_about_axis(pts, (line, 0.0, FINGER_Z), (0.0, 1.0, 0.0), math.radians(bend) * weight)

    # Thumb: swing it down about an axis along Y through its base.
    thumb = (1.0 - smoothstep(-0.012, 0.006, rest[:, 1])) * smoothstep(0.765, 0.795, rest[:, 0])
    thumb *= 1.0 - smoothstep(0.875, 0.885, rest[:, 0])
    pts = rotate_about_axis(
        pts, (THUMB_PIVOT[0], 0.0, THUMB_PIVOT[1]), (0.0, 1.0, 0.0), math.radians(THUMB_SWING) * thumb
    )

    pts[:, 0] *= side
    co[hand] = pts
    set_coords(arms, co)


def seat_sword(sword):
    """Move the sword so its handle lies on the grip axis of the right fist."""
    co = get_coords(sword)
    co[:, 0] += -(GRIP_CENTER[0] - SWORD_HANDLE[0])   # right hand: x is negative
    co[:, 2] += GRIP_CENTER[1] - SWORD_HANDLE[1]
    set_coords(sword, co)


def grip_axis_point(side):
    """A point on the grip axis of a fist, in model space."""
    return (GRIP_CENTER[0] * side, GRIP_Y, GRIP_CENTER[1])
