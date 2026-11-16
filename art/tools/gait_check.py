"""Strides and foot slip of the walk and run clips of a unit model (.glb),
measured the way the 3D scene measures them (plantedStride in
src/components/battle/engine/figures/model.ts).

    python art/tools/gait_check.py public/battles/models/roman-legionary.glb [--rows]
    python art/tools/gait_check.py NEW.glb --before OLD.glb --plot out.jpg [--title TEXT]

Needs numpy; --plot also needs matplotlib. Reads the file itself (no
Blender, no three.js): skins the sole vertices of LOD0 with every frame of
the clip, as the scene's vertex shader does.

The scene's measure: sole vertices are those within 3 cm of the lowest
point of LOD0 at rest; a sole within 2 cm of the lowest point of the clip
in two frames running is on the ground and slides back under the figure at
the speed the figure travels. The stride (ground covered in one loop) is
the median of those speeds times the loop's length. "Slip" here is how far
the lowest sole of a foot on the ground strays from that speed in a frame,
as a share of it.
"""

import argparse
import json
import struct

import numpy as np

SOLE_HEIGHT = 0.03
SOLE_SAMPLES = 240
GROUND_REACH = 0.02
FPS = 30
GAITS = ("walk", "run")

_COMPONENTS = {5126: np.float32, 5125: np.uint32, 5123: np.uint16, 5121: np.uint8}
_WIDTH = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4, "MAT4": 16}


def _quat(q):
    x, y, z, w = np.asarray(q, float) / np.linalg.norm(q)
    return np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
                     [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
                     [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])


class Glb:
    """The parts of a binary glTF this check needs."""

    def __init__(self, path):
        with open(path, "rb") as f:
            data = f.read()
        n = struct.unpack("<I", data[12:16])[0]
        self.doc = json.loads(data[20:20 + n])
        o = 20 + n
        m = struct.unpack("<I", data[o:o + 4])[0]
        self.bin = data[o + 8:o + 8 + m]
        self.nodes = self.doc["nodes"]
        self.parent = {c: i for i, node in enumerate(self.nodes) for c in node.get("children", [])}

    def accessor(self, i):
        a = self.doc["accessors"][i]
        view = self.doc["bufferViews"][a["bufferView"]]
        width = _WIDTH[a["type"]]
        dtype = np.dtype(_COMPONENTS[a["componentType"]])
        start = view.get("byteOffset", 0) + a.get("byteOffset", 0)
        stride = view.get("byteStride") or width * dtype.itemsize
        raw = np.frombuffer(self.bin, np.uint8, stride * (a["count"] - 1) + width * dtype.itemsize, start)
        rows = np.lib.stride_tricks.as_strided(raw, (a["count"], width * dtype.itemsize), (stride, 1))
        out = np.frombuffer(np.ascontiguousarray(rows).tobytes(), dtype).reshape(a["count"], width).astype(float)
        if a.get("normalized"):
            out /= np.iinfo(dtype).max
        return out

    def world(self, pose=None):
        """World matrix of a node, with the local values in `pose`
        ({(node, path): value}) in place of the file's."""
        pose = pose or {}
        cache = {}

        def matrix(i):
            if i not in cache:
                node = self.nodes[i]
                t = pose.get((i, "translation"), node.get("translation", (0.0, 0.0, 0.0)))
                r = pose.get((i, "rotation"), node.get("rotation", (0.0, 0.0, 0.0, 1.0)))
                s = pose.get((i, "scale"), node.get("scale", (1.0, 1.0, 1.0)))
                m = np.eye(4)
                m[:3, :3] = _quat(r) @ np.diag(s)
                m[:3, 3] = t
                cache[i] = matrix(self.parent[i]) @ m if i in self.parent else m
            return cache[i]
        return matrix


class Model:
    def __init__(self, path):
        g = self.g = Glb(path)
        skin = g.doc["skins"][0]
        self.joints = skin["joints"]
        self.ibm = g.accessor(skin["inverseBindMatrices"]).reshape(-1, 4, 4).transpose(0, 2, 1)
        mesh = next(m for m in g.doc["meshes"] if m["name"] == "LOD0")
        prims = mesh["primitives"]
        self.pos = np.concatenate([g.accessor(p["attributes"]["POSITION"]) for p in prims])
        self.jnt = np.concatenate([g.accessor(p["attributes"]["JOINTS_0"]) for p in prims]).astype(int)
        self.wgt = np.concatenate([g.accessor(p["attributes"]["WEIGHTS_0"]) for p in prims])
        bind = self.skin(None, np.arange(len(self.pos)))
        soles = np.flatnonzero(bind[:, 1] < bind[:, 1].min() + SOLE_HEIGHT)
        self.soles = soles[::max(int(np.ceil(len(soles) / SOLE_SAMPLES)), 1)]
        self.left = bind[self.soles, 0] > 0          # the figure faces +Z: its left is +X

    def skin(self, pose, verts):
        world = self.g.world(pose)
        mats = np.array([world(j) @ self.ibm[k] for k, j in enumerate(self.joints)])
        p = np.c_[self.pos[verts], np.ones(len(verts))]
        out = np.zeros((len(verts), 3))
        for k in range(4):
            out += self.wgt[verts, k:k + 1] * np.einsum("nij,nj->ni", mats[self.jnt[verts, k]], p)[:, :3]
        return out

    def track(self, clip):
        """The sole vertices in every frame of a clip: (frames, n, 3)."""
        anim = next(a for a in self.g.doc["animations"] if a["name"] == clip)
        channels = []
        for c in anim["channels"]:
            s = anim["samplers"][c["sampler"]]
            channels.append((c["target"]["node"], c["target"]["path"], self.g.accessor(s["input"])[:, 0],
                             self.g.accessor(s["output"])))
        frames = int(round(max(ch[2][-1] for ch in channels) * FPS))
        out = []
        for f in range(frames):
            pose = {(node, path): values[int(np.argmin(np.abs(times - f / FPS)))]
                    for node, path, times, values in channels}
            out.append(self.skin(pose, self.soles))
        return np.array(out)


def measure(track, left):
    """Ground speed (m/s), stride (m per loop) and, per frame and foot, the
    slip of the lowest sole on the ground (share of the ground speed; NaN
    while that foot is in the air)."""
    frames = len(track)
    ground = track[:, :, 1].min()
    on = track[:, :, 1] <= ground + GROUND_REACH
    both = on & np.roll(on, -1, axis=0)
    step = np.roll(track, -1, axis=0) - track
    speed = np.hypot(step[..., 0], step[..., 2]) * FPS
    median = float(np.median(speed[both]))
    slip = np.full((frames, 2), np.nan)
    for col, mask in enumerate((left, ~left)):
        index = np.flatnonzero(mask)
        for f in range(frames):
            k = index[np.argmin(track[f, index, 1])]
            if both[f, k]:
                d = step[f, k] * FPS
                slip[f, col] = np.hypot(d[0], d[2] + median) / median   # backwards is -Z
    return median, median * frames / FPS, slip


def report(path, rows=False):
    model = Model(path)
    out = {}
    for clip in GAITS:
        track = model.track(clip)
        speed, stride, slip = measure(track, model.left)
        out[clip] = (speed, stride, slip)
        worst = np.nanmax(slip) * 100
        print(f"{clip}: {len(track)} frames, {len(track) / FPS:.3f} s; ground speed {speed:.3f} m/s; "
              f"{stride:.3f} m per loop; worst slip of a planted foot {worst:.0f}%")
        if rows:
            for f, (left, right) in enumerate(slip):
                cells = ["   -" if np.isnan(v) else f"{v * 100:3.0f}%" for v in (left, right)]
                print(f"  {f:3d}  left {cells[0]}  right {cells[1]}")
    return out


def plot(new, old, path, title):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    fig, axes = plt.subplots(1, 2, figsize=(12, 4.2), dpi=110)
    for ax, clip in zip(axes, GAITS):
        for data, style, label in ((old, "--", "before"), (new, "-", "after")):
            slip = data[clip][2]
            frames = np.arange(len(slip))
            for col, (side, colour) in enumerate((("left foot", "#2f6db5"), ("right foot", "#c2532b"))):
                ax.plot(frames, slip[:, col] * 100, style, color=colour, marker="o", markersize=3,
                        label=f"{side}, {label}")
        ax.set_title(f"{clip}: {new[clip][1]:.2f} m per loop, {new[clip][0]:.2f} m/s")
        ax.set_xlabel("frame (30 per second)")
        ax.set_ylabel("slip of the planted foot, % of ground speed")
        ax.set_ylim(0, 140)
        ax.grid(alpha=0.3)
        ax.legend(fontsize=7, loc="upper right")
    fig.suptitle(title, fontsize=11)
    fig.tight_layout()
    fig.savefig(path, pil_kwargs={"quality": 88})
    print("wrote", path)


def main():
    parser = argparse.ArgumentParser(prog="gait_check.py")
    parser.add_argument("glb")
    parser.add_argument("--rows", action="store_true", help="slip of each foot in every frame")
    parser.add_argument("--before", help="an older file of the same model, to compare with")
    parser.add_argument("--plot", help="write a chart of the slip (with --before: both files)")
    parser.add_argument("--title", default="Walk and run: slip of the planted foot")
    args = parser.parse_args()
    new = report(args.glb, args.rows)
    old = None
    if args.before:
        print("before:")
        old = report(args.before, args.rows)
    if args.plot:
        plot(new, old or new, args.plot, args.title)


if __name__ == "__main__":
    main()
