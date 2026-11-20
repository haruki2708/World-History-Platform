"""Read the clips of the Universal Animation Library (Quaternius, CC0).

The library ships each pack as one .glb: a mannequin skinned to a 65-bone
Unreal-style skeleton and some forty clips. This module reads the file
itself (JSON chunk and binary buffer) with numpy, without Blender's glTF
importer, so the numbers that feed the retarget are exactly the file's.

Everything is returned in Blender's axes, the same as the shared rig:
metres, Z up, the figure facing -Y. The library's own file is glTF (Y up,
facing +Z), so a point (x, y, z) there is (x, -z, y) here.

We read the versions without root motion ("Unreal-Godot/UAL*_Standard.glb",
not "_RM"): the hips move in place and the scene moves the figure.
"""

import json
import os
import struct

import numpy as np

from whp_common import SOURCES_DIR

UAL_DIR = os.path.join(SOURCES_DIR, "quaternius-ual", "unzipped")
PACKS = {
    "ual1": os.path.join(UAL_DIR, "Universal Animation Library[Standard]", "Unreal-Godot", "UAL1_Standard.glb"),
    "ual2": os.path.join(UAL_DIR, "Universal Animation Library 2[Standard]", "Unreal-Godot", "UAL2_Standard.glb"),
}
FPS = 30                        # the library is keyed at 30 frames per second

# glTF (Y up, +Z forward) -> Blender (Z up, -Y forward).
TO_BLENDER = np.array(((1.0, 0.0, 0.0, 0.0),
                       (0.0, 0.0, -1.0, 0.0),
                       (0.0, 1.0, 0.0, 0.0),
                       (0.0, 0.0, 0.0, 1.0)))

_COMPONENTS = {5126: np.float32, 5125: np.uint32, 5123: np.uint16, 5121: np.uint8}
_WIDTH = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4, "MAT4": 16}


def quat_to_matrix(q):
    """3x3 rotation of a glTF quaternion (x, y, z, w); q may be (..., 4)."""
    q = np.asarray(q, dtype=np.float64)
    q = q / np.linalg.norm(q, axis=-1, keepdims=True)
    x, y, z, w = q[..., 0], q[..., 1], q[..., 2], q[..., 3]
    m = np.empty(q.shape[:-1] + (3, 3))
    m[..., 0, 0] = 1 - 2 * (y * y + z * z)
    m[..., 0, 1] = 2 * (x * y - z * w)
    m[..., 0, 2] = 2 * (x * z + y * w)
    m[..., 1, 0] = 2 * (x * y + z * w)
    m[..., 1, 1] = 1 - 2 * (x * x + z * z)
    m[..., 1, 2] = 2 * (y * z - x * w)
    m[..., 2, 0] = 2 * (x * z - y * w)
    m[..., 2, 1] = 2 * (y * z + x * w)
    m[..., 2, 2] = 1 - 2 * (x * x + y * y)
    return m


class Clip:
    """One animation: per bone, sampled translation, rotation and scale."""

    def __init__(self, name, duration, channels):
        self.name = name
        self.duration = duration
        self.channels = channels            # (node, path) -> (times, values)

    @property
    def frames(self):
        """Number of frame intervals (a loop of n intervals has n + 1 keys,
        the last equal to the first)."""
        return int(round(self.duration * FPS))


class Pack:
    """One library file: its skeleton at rest and its clips."""

    def __init__(self, path):
        if not os.path.isfile(path):
            raise FileNotFoundError(
                f"Animation library not found: {path}\n"
                "Download the Universal Animation Library (see art/README.md) into "
                "%WHP_ASSETS%\\sources\\quaternius-ual\\ and unzip it into unzipped\\."
            )
        with open(path, "rb") as f:
            data = f.read()
        json_length = struct.unpack("<I", data[12:16])[0]
        self.doc = json.loads(data[20:20 + json_length])
        offset = 20 + json_length
        bin_length = struct.unpack("<I", data[offset:offset + 4])[0]
        self.binary = data[offset + 8:offset + 8 + bin_length]

        nodes = self.doc["nodes"]
        self.node_names = [n.get("name", f"node{i}") for i, n in enumerate(nodes)]
        self.parent = {}
        for i, node in enumerate(nodes):
            for child in node.get("children", []):
                self.parent[child] = i
        skin = self.doc["skins"][0]
        self.joints = list(skin["joints"])                    # node indices, parents first
        self.bone_names = [self.node_names[j] for j in self.joints]
        self.index = {name: i for i, name in enumerate(self.bone_names)}
        self.rest_local = [self._node_trs(nodes[j]) for j in self.joints]
        # The chain above the skeleton (the "Armature" node): fixed.
        root = self.joints[0]
        above = np.eye(4)
        node = self.parent.get(root)
        while node is not None:
            above = self._matrix(*self._node_trs(nodes[node])) @ above
            node = self.parent.get(node)
        self.above = TO_BLENDER @ above
        self.bone_parent = [self.index.get(self.node_names[self.parent[j]]) if j in self.parent else None
                            for j in self.joints]
        self.clips = {}
        for anim in self.doc.get("animations", []):
            channels = {}
            duration = 0.0
            for channel in anim["channels"]:
                target = channel["target"]
                if target["node"] not in self.joints or target["path"] not in ("translation", "rotation", "scale"):
                    continue
                sampler = anim["samplers"][channel["sampler"]]
                times = self._accessor(sampler["input"])[:, 0].astype(np.float64)
                values = self._accessor(sampler["output"]).astype(np.float64)
                channels[(self.joints.index(target["node"]), target["path"])] = (times, values)
                duration = max(duration, float(times[-1]))
            self.clips[anim["name"]] = Clip(anim["name"], duration, channels)
        self.rest = self._world(self.rest_local)

    # -- reading the file ----------------------------------------------------

    def _accessor(self, index):
        acc = self.doc["accessors"][index]
        view = self.doc["bufferViews"][acc["bufferView"]]
        width = _WIDTH[acc["type"]]
        start = view.get("byteOffset", 0) + acc.get("byteOffset", 0)
        stride = view.get("byteStride")
        dtype = np.dtype(_COMPONENTS[acc["componentType"]])
        if stride and stride != width * dtype.itemsize:
            raise ValueError("interleaved accessors are not supported")
        values = np.frombuffer(self.binary, dtype, acc["count"] * width, start)
        return values.reshape(acc["count"], width)

    @staticmethod
    def _node_trs(node):
        if "matrix" in node:
            raise ValueError("matrix nodes are not supported")
        return (np.array(node.get("translation", (0.0, 0.0, 0.0)), dtype=np.float64),
                np.array(node.get("rotation", (0.0, 0.0, 0.0, 1.0)), dtype=np.float64),
                np.array(node.get("scale", (1.0, 1.0, 1.0)), dtype=np.float64))

    @staticmethod
    def _matrix(t, r, s):
        m = np.eye(4)
        m[:3, :3] = quat_to_matrix(r) @ np.diag(s)
        m[:3, 3] = t
        return m

    def _world(self, local):
        """World matrices (Blender axes) of all bones from their local TRS."""
        world = [None] * len(local)
        for i, trs in enumerate(local):
            m = self._matrix(*trs)
            parent = self.bone_parent[i]
            world[i] = (world[parent] if parent is not None else self.above) @ m
        return np.array(world)

    # -- sampling ------------------------------------------------------------

    def clip(self, name):
        if name not in self.clips:
            raise KeyError(f"no clip {name!r} in the library; it has: {', '.join(sorted(self.clips))}")
        return self.clips[name]

    def _local(self, clip, t):
        """Local (translation, rotation, scale) of every bone at time t."""
        local = []
        for i, (t0, r0, s0) in enumerate(self.rest_local):
            trs = [t0, r0, s0]
            for slot, path in enumerate(("translation", "rotation", "scale")):
                channel = clip.channels.get((i, path))
                if channel is None:
                    continue
                times, values = channel
                if path == "rotation":
                    k = int(np.clip(np.searchsorted(times, t), 1, len(times) - 1))
                    a, b = values[k - 1], values[k]
                    if np.dot(a, b) < 0.0:          # take the short way round
                        b = -b
                    u = 0.0 if times[k] == times[k - 1] else (t - times[k - 1]) / (times[k] - times[k - 1])
                    u = min(max(u, 0.0), 1.0)
                    value = a + (b - a) * u
                    value = value / np.linalg.norm(value)
                else:
                    value = np.array([np.interp(t, times, values[:, c]) for c in range(values.shape[1])])
                trs[slot] = value
            local.append(trs)
        return local

    def sample(self, name, frame, motion=None, still=0.0):
        """World matrices (bones, 4, 4) at a frame of a clip; fractional
        frames are interpolated (linear, quaternions normalised), frames
        past either end hold the end.

        motion: {bone name: weight} to tone down some bones: each one's
        local transform is blended between the clip at frame `still` (0)
        and the clip at `frame` (1)."""
        clip = self.clip(name)

        def at(f):
            return self._local(clip, min(max(f / FPS, 0.0), clip.duration))

        local = at(frame)
        if motion:
            calm = at(still)
            for bone, w in motion.items():
                i = self.index[bone]
                for slot in range(3):
                    a, b = calm[i][slot], local[i][slot]
                    if slot == 1:
                        if np.dot(a, b) < 0.0:
                            b = -b
                        v = a + (b - a) * w
                        local[i][slot] = v / np.linalg.norm(v)
                    else:
                        local[i][slot] = a + (b - a) * w
        return self._world([tuple(trs) for trs in local])

    def blend(self, a, b, weight):
        """World matrices of a blend of two clip frames, a = (clip, frame)
        and b likewise: each bone's local transform goes from a's (0) to
        b's (1) by weight(bone name), or by `weight` if it is a number."""
        sampled = []
        for name, frame in (a, b):
            clip = self.clip(name)
            sampled.append(self._local(clip, min(max(frame / FPS, 0.0), clip.duration)))
        local = []
        for i, (ta, tb) in enumerate(zip(*sampled)):
            w = weight(self.bone_names[i]) if callable(weight) else weight
            trs = []
            for slot in range(3):
                x, y = ta[slot], tb[slot]
                if slot == 1:
                    if np.dot(x, y) < 0.0:
                        y = -y
                    v = x + (y - x) * w
                    trs.append(v / np.linalg.norm(v))
                else:
                    trs.append(x + (y - x) * w)
            local.append(tuple(trs))
        return self._world(local)

    def head(self, matrices, name):
        return matrices[self.index[name]][:3, 3]

    # -- poses as local transforms (for clips pieced together from several) --

    def local(self, name, frame):
        """Local (translation, rotation, scale) of every bone at a frame of
        a clip, as `sample` takes them (frames past either end hold it)."""
        clip = self.clip(name)
        return [tuple(trs) for trs in self._local(clip, min(max(frame / FPS, 0.0), clip.duration))]

    def world(self, local):
        """World matrices (bones, 4, 4) of a pose given as local transforms."""
        return self._world(local)

    def mix(self, a, b, weight):
        """Local transforms going from pose a (0) to pose b (1) by
        weight(bone name), or by `weight` if it is a number; as `blend`
        does, quaternions taking the short way and normalised."""
        local = []
        for i, (ta, tb) in enumerate(zip(a, b)):
            w = weight(self.bone_names[i]) if callable(weight) else weight
            trs = []
            for slot in range(3):
                x, y = ta[slot], tb[slot]
                if slot == 1:
                    if np.dot(x, y) < 0.0:
                        y = -y
                    v = x + (y - x) * w
                    trs.append(v / np.linalg.norm(v))
                else:
                    trs.append(x + (y - x) * w)
            local.append(tuple(trs))
        return local

    def mirrored(self, local):
        """The same pose seen in a mirror: left and right change places
        (the figure's X is turned round), each bone taking the turn from
        rest of its counterpart on the other side."""
        world = self._world(local)
        flip = np.diag((-1.0, 1.0, 1.0))
        out = np.empty_like(world)
        for i, name in enumerate(self.bone_names):
            j = self.index[mirror_name(name)]
            turn = _orthonormal(world[j][:3, :3]) @ _orthonormal(self.rest[j][:3, :3]).T
            out[i] = np.eye(4)
            out[i][:3, :3] = flip @ turn @ flip @ self.rest[i][:3, :3]
            out[i][:3, 3] = flip @ world[j][:3, 3]
        mirrored = []
        for i in range(len(self.bone_names)):
            parent = self.bone_parent[i]
            m = np.linalg.inv(out[parent] if parent is not None else self.above) @ out[i]
            scale = np.linalg.norm(m[:3, :3], axis=0)
            mirrored.append((m[:3, 3].copy(), matrix_to_quat(m[:3, :3] / scale), scale))
        return mirrored


def mirror_name(name):
    """The bone on the other side ("hand_l" <-> "hand_r"), or the bone itself."""
    for a, b in (("_l", "_r"), ("_r", "_l")):
        if name.endswith(a):
            return name[:-len(a)] + b
    return name


def _orthonormal(m):
    u, _s, vt = np.linalg.svd(m)
    return u @ vt


def matrix_to_quat(m):
    """glTF quaternion (x, y, z, w) of a 3x3 rotation."""
    m = np.asarray(m, dtype=np.float64)
    trace = m[0, 0] + m[1, 1] + m[2, 2]
    if trace > 0.0:
        s = 2.0 * np.sqrt(trace + 1.0)
        q = ((m[2, 1] - m[1, 2]) / s, (m[0, 2] - m[2, 0]) / s, (m[1, 0] - m[0, 1]) / s, 0.25 * s)
    elif m[0, 0] > m[1, 1] and m[0, 0] > m[2, 2]:
        s = 2.0 * np.sqrt(1.0 + m[0, 0] - m[1, 1] - m[2, 2])
        q = (0.25 * s, (m[0, 1] + m[1, 0]) / s, (m[0, 2] + m[2, 0]) / s, (m[2, 1] - m[1, 2]) / s)
    elif m[1, 1] > m[2, 2]:
        s = 2.0 * np.sqrt(1.0 + m[1, 1] - m[0, 0] - m[2, 2])
        q = ((m[0, 1] + m[1, 0]) / s, 0.25 * s, (m[1, 2] + m[2, 1]) / s, (m[0, 2] - m[2, 0]) / s)
    else:
        s = 2.0 * np.sqrt(1.0 + m[2, 2] - m[0, 0] - m[1, 1])
        q = ((m[0, 2] + m[2, 0]) / s, (m[1, 2] + m[2, 1]) / s, 0.25 * s, (m[1, 0] - m[0, 1]) / s)
    q = np.array(q)
    return q / np.linalg.norm(q)


_PACKS = {}


def pack(name):
    """The library file `name` ("ual1" or "ual2"), read once."""
    if name not in _PACKS:
        _PACKS[name] = Pack(PACKS[name])
    return _PACKS[name]
