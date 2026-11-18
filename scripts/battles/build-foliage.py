"""Builds public/battles/textures/foliage.webp: the pictures the plants of the
battle scene are made of (engine/vegetation.ts), from photographs of leaves
and bark.

    python scripts/battles/build-foliage.py [folder of the ambientCG packs]

The folder (default E:/World_History_Platform_assets/textures/ambientcg) holds
the unpacked 1K-JPG packs LeafSet016, LeafSet005 and Bark012 of ambientCG
(CC0, see art/CREDITS.md). Needs Pillow and numpy.

The picture is 1024 x 1024 with four squares:

    top left      BROAD   a spray of broad leaves (oak) on twigs
    top right     FINE    a spray of narrow leaves on twigs
    bottom left   BLADES  reeds rising from the foot of the square
    bottom right  BARK    bark, for trunks and limbs (opaque)

Every leaf is cut from a photograph. Its colour is divided by the mean colour
of its leaf, so that the mean of a square is a light grey: the scene tints it
with the colour of the plant, and what stays of the photograph is the shape
of the leaf, its veins and its shading. Leaves further back in a spray are
darker. The same script always writes the same picture.
"""

import math
import os
import random
import sys

import numpy as np
from PIL import Image, ImageDraw

SOURCE = sys.argv[1] if len(sys.argv) > 1 else "E:/World_History_Platform_assets/textures/ambientcg"
OUT = os.path.join(os.path.dirname(__file__), "..", "..", "public", "battles", "textures", "foliage.webp")
TILE = 512
GREY = 185.0


def load(pack, kind):
    return Image.open(os.path.join(SOURCE, pack, f"{pack}_1K-JPG_{kind}.jpg"))


def leaves_of(pack, least=2500):
    """The single leaves of an atlas, as RGBA pictures, stalk down, colour evened out to grey."""
    colour = np.asarray(load(pack, "Color").convert("RGB"), dtype=np.float32)
    opacity = np.asarray(load(pack, "Opacity").convert("L"), dtype=np.float32)
    mask = opacity > 128
    height, width = mask.shape
    seen = np.zeros_like(mask)
    found = []
    for y0 in range(0, height, 4):
        for x0 in range(0, width, 4):
            if not mask[y0, x0] or seen[y0, x0]:
                continue
            stack = [(y0, x0)]
            seen[y0, x0] = True
            ys, xs = [], []
            while stack:
                y, x = stack.pop()
                ys.append(y)
                xs.append(x)
                for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                    if 0 <= ny < height and 0 <= nx < width and mask[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        stack.append((ny, nx))
            if len(ys) < least:
                continue
            top, bottom, left, right = min(ys), max(ys) + 1, min(xs), max(xs) + 1
            part = np.zeros((bottom - top, right - left), dtype=bool)
            part[np.array(ys) - top, np.array(xs) - left] = True
            rgb = colour[top:bottom, left:right]
            mean = rgb[part].mean(axis=0)
            even = np.clip(rgb / mean * GREY, 0, 255)
            alpha = np.where(part, opacity[top:bottom, left:right], 0)
            found.append(Image.fromarray(np.dstack([even, alpha]).astype(np.uint8), "RGBA"))
    return found


def spray(leaves, rng, count, length, narrow=1.0):
    """A spray: twigs from the middle outwards, leaves along them, the far ones first and darker."""
    tile = Image.new("RGBA", (TILE, TILE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(tile)
    centre = TILE / 2
    reach = TILE * 0.44
    places = []
    twigs = 9
    for t in range(twigs):
        angle = (t + rng.random() * 0.6) * 2 * math.pi / twigs
        bend = (rng.random() - 0.5) * 0.9
        points = []
        for step in range(13):
            f = step / 12
            a = angle + bend * f
            r = reach * f * (0.8 + 0.2 * rng.random())
            points.append((centre + math.cos(a) * r, centre + math.sin(a) * r * 0.94))
        draw.line(points, fill=(96, 82, 64, 255), width=3)
        for i in range(count // twigs):
            f = 0.12 + 0.88 * rng.random() ** 0.8
            at = min(int(f * 12), 11)
            x = points[at][0] + (rng.random() - 0.5) * 26
            y = points[at][1] + (rng.random() - 0.5) * 26
            # A leaf points away from its twig, more or less outwards.
            way = angle + bend * f + (rng.random() - 0.5) * 2.2
            places.append((rng.random(), x, y, way))
    # A few more in the middle, where the twigs meet.
    for i in range(count // 6):
        r = rng.random() * reach * 0.35
        a = rng.random() * 2 * math.pi
        places.append((rng.random(), centre + math.cos(a) * r, centre + math.sin(a) * r, rng.random() * 2 * math.pi))
    places.sort()
    for depth, x, y, way in places:
        leaf = rng.choice(leaves)
        size = length * (0.75 + 0.5 * rng.random())
        scale = size / leaf.height
        w = max(int(leaf.width * scale * narrow), 3)
        h = max(int(leaf.height * scale), 6)
        piece = leaf.resize((w, h), Image.LANCZOS)
        # Further back, darker: in the shade of the leaves in front.
        shade = 0.62 + 0.42 * depth + (rng.random() - 0.5) * 0.1
        rgb = np.asarray(piece, dtype=np.float32)
        rgb[..., :3] = np.clip(rgb[..., :3] * shade, 0, 255)
        piece = Image.fromarray(rgb.astype(np.uint8), "RGBA")
        # The stalk is at the bottom of the picture: turn the leaf to point along `way`.
        piece = piece.rotate(-math.degrees(way) - 90, expand=True, resample=Image.BICUBIC)
        px = int(x + math.cos(way) * size * 0.5 - piece.width / 2)
        py = int(y + math.sin(way) * size * 0.5 - piece.height / 2)
        tile.alpha_composite(piece, (max(min(px, TILE - piece.width), 0), max(min(py, TILE - piece.height), 0)))
    return tile


def blades(leaves, rng, count):
    """Reeds: long narrow leaves rising from the foot of the square, leaning a little, some with a plume."""
    tile = Image.new("RGBA", (TILE, TILE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(tile)
    order = sorted((rng.random(), i) for i in range(count))
    for depth, i in order:
        x0 = 24 + rng.random() * (TILE - 48)
        tall = TILE * (0.5 + 0.46 * rng.random())
        lean = (rng.random() - 0.5) * 0.5
        shade = 0.6 + 0.45 * depth
        if rng.random() < 0.55:
            # A stem: a line, with a plume at its head on some.
            tone = int(GREY * shade)
            x1 = x0 + math.sin(lean) * tall
            y1 = TILE - math.cos(lean) * tall
            mid = ((x0 + x1) / 2 + lean * 14, (TILE + y1) / 2)
            draw.line([(x0, TILE), mid, (x1, y1)], fill=(tone, tone, int(tone * 0.92), 255), width=3, joint="curve")
            if rng.random() < 0.45:
                draw.ellipse([x1 - 6, y1 - 24, x1 + 6, y1 + 10], fill=(int(tone * 1.05), int(tone * 0.98), int(tone * 0.86), 255))
            continue
        leaf = rng.choice(leaves)
        h = int(tall)
        w = max(int(h * 0.055), 5)
        piece = leaf.resize((w, h), Image.LANCZOS)
        rgb = np.asarray(piece, dtype=np.float32)
        rgb[..., :3] = np.clip(rgb[..., :3] * shade, 0, 255)
        piece = Image.fromarray(rgb.astype(np.uint8), "RGBA").rotate(-math.degrees(lean), expand=True, resample=Image.BICUBIC)
        px = int(x0 + math.sin(lean) * tall / 2 - piece.width / 2)
        tile.alpha_composite(piece, (max(min(px, TILE - piece.width), 0), TILE - piece.height))
    return tile


def bark():
    colour = np.asarray(load("Bark012", "Color").convert("RGB").resize((TILE, TILE), Image.LANCZOS), dtype=np.float32)
    shade = np.asarray(load("Bark012", "AmbientOcclusion").convert("L").resize((TILE, TILE), Image.LANCZOS), dtype=np.float32) / 255
    even = colour / colour.reshape(-1, 3).mean(axis=0) * GREY
    # Deepen the cracks: the photograph is lit flat.
    even = np.clip((even - GREY) * 1.5 + GREY, 0, 255) * (0.55 + 0.45 * shade[..., None])
    return Image.fromarray(np.dstack([np.clip(even, 0, 255), np.full((TILE, TILE), 255.0)]).astype(np.uint8), "RGBA")


def main():
    rng = random.Random(20261119)
    broad = leaves_of("LeafSet016")
    narrow = leaves_of("LeafSet005")
    print(f"leaves: {len(broad)} broad, {len(narrow)} narrow")
    sheet = Image.new("RGBA", (TILE * 2, TILE * 2), (0, 0, 0, 0))
    sheet.alpha_composite(spray(broad, rng, 150, 62), (0, 0))
    sheet.alpha_composite(spray(narrow, rng, 210, 64, narrow=0.5), (TILE, 0))
    sheet.alpha_composite(blades(narrow, rng, 85), (0, TILE))
    sheet.alpha_composite(bark(), (TILE, TILE))
    # Where nothing is drawn, the colour of what is nearest: no dark fringe when the picture is seen small.
    data = np.asarray(sheet, dtype=np.float32)
    alpha = data[..., 3:4] / 255
    spread = data[..., :3] * alpha
    weight = alpha.copy()
    for _ in range(24):
        for axis in (0, 1):
            spread = spread + np.roll(spread, 1, axis) + np.roll(spread, -1, axis)
            weight = weight + np.roll(weight, 1, axis) + np.roll(weight, -1, axis)
        norm = max(float(weight.max()), 1e-6)
        spread = spread / norm
        weight = weight / norm
    filled = np.where(weight > 1e-9, spread / np.maximum(weight, 1e-9), GREY)
    data[..., :3] = np.where(alpha > 0.02, data[..., :3], filled)
    out = os.path.normpath(OUT)
    Image.fromarray(np.clip(data, 0, 255).astype(np.uint8), "RGBA").save(out, "WEBP", quality=86, method=6, exact=True)
    print(f"wrote {out}: {os.path.getsize(out) // 1024} KB")


main()
