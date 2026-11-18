"""Builds the three pictures that give the structures of the battle scene
their grain (engine/structures.ts), from photographs:

    public/battles/textures/cloth.jpg     woven cloth      (ambientCG Fabric030)
    public/battles/textures/masonry.jpg   a wall of blocks (ambientCG Bricks085)
    public/battles/textures/planks.jpg    sawn wood        (ambientCG Planks021)

    python scripts/battles/build-materials.py [folder of the ambientCG packs]

Each is 512 x 512, grey, with a mean of one half: the scene multiplies the
colour of a wall, a roof or a tent by twice its value, so the photograph
gives the surface its joints, weave or grain and the scene gives the colour.
Contrast is raised, since the photographs are lit flat. Needs Pillow and numpy.
"""

import os
import sys

import numpy as np
from PIL import Image

SOURCE = sys.argv[1] if len(sys.argv) > 1 else "E:/World_History_Platform_assets/textures/ambientcg"
OUT = os.path.join(os.path.dirname(__file__), "..", "..", "public", "battles", "textures")

for name, pack, contrast in (("cloth", "Fabric030", 3.2), ("masonry", "Bricks085", 1.25), ("planks", "Planks021", 1.9)):
    grey = np.asarray(
        Image.open(os.path.join(SOURCE, pack, f"{pack}_1K-JPG_Color.jpg")).convert("L").resize((512, 512), Image.LANCZOS),
        dtype=np.float32,
    )
    grey = (grey - grey.mean()) * contrast + 127.5
    path = os.path.normpath(os.path.join(OUT, f"{name}.jpg"))
    Image.fromarray(np.clip(grey, 0, 255).astype(np.uint8), "L").save(path, quality=82)
    print(f"wrote {path}: {os.path.getsize(path) // 1024} KB, spread {np.clip(grey, 0, 255).std() / 255:.3f}")
