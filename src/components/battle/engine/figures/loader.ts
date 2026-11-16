/**
 * Reads a unit model file, public/battles/models/<model>.glb, into a source
 * for buildUnitModel. Any file that keeps the contract works: one skeleton,
 * skinned meshes named LOD0..LOD2 and clips named after UNIT_CLIPS.
 *
 * Only models named in the model index (MODEL_INDEX_URL) are requested, so a
 * model that does not exist yet costs no request and no 404 in the console.
 */

import {
  DoubleSide,
  type Material,
  type MeshStandardMaterial,
  type Object3D,
  type SkinnedMesh,
  Texture,
} from "three";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MODEL_INDEX_URL, type ModelIndex, UNIT_LODS } from "@/lib/battle";
import type { SkinnedSource, SurfaceMaps } from "./model";

function isSkinnedMesh(object: Object3D): object is SkinnedMesh {
  return (object as SkinnedMesh).isSkinnedMesh === true;
}

function isModelIndex(value: unknown): value is ModelIndex {
  if (typeof value !== "object" || value === null) return false;
  const models = (value as { models?: unknown }).models;
  return Array.isArray(models) && models.every((model) => typeof model === "string");
}

/**
 * The unit models that exist, from the model index. A missing or malformed
 * index yields an empty set: every unit is then drawn as a placeholder, and
 * no model file is requested on the chance that it exists.
 */
export async function loadModelIndex(signal: AbortSignal): Promise<Set<string>> {
  try {
    const response = await fetch(MODEL_INDEX_URL, { signal });
    if (!response.ok) {
      console.warn(`Model index ${MODEL_INDEX_URL} is missing (${response.status}); drawing placeholder figures.`);
      return new Set();
    }
    const data: unknown = await response.json();
    if (!isModelIndex(data)) {
      console.warn(`Model index ${MODEL_INDEX_URL} is not { models: string[] }; drawing placeholder figures.`);
      return new Set();
    }
    return new Set(data.models);
  } catch (error) {
    if (signal.aborted) throw error;
    console.warn(`Model index ${MODEL_INDEX_URL} could not be read; drawing placeholder figures.`, error);
    return new Set();
  }
}

/** The level a mesh belongs to, from its own name or the name of a parent. */
function lodLevel(mesh: Object3D): number {
  for (let node: Object3D | null = mesh; node; node = node.parent) {
    const match = /LOD[ _-]?(\d)/i.exec(node.name);
    if (match) return Number(match[1]);
  }
  return -1;
}

function triangleCount(mesh: SkinnedMesh): number {
  const geometry = mesh.geometry;
  return (geometry.index ? geometry.index.count : geometry.attributes.position.count) / 3;
}

/**
 * The normal and roughness-metalness maps of a glTF material, for the
 * detailed material of close figures. GLTFLoader gives a
 * MeshStandardMaterial with the factors and maps of the file.
 */
function surfaceMaps(material: Material): SurfaceMaps | null {
  const standard = material as Partial<MeshStandardMaterial>;
  if (!standard.isMeshStandardMaterial) return null;
  const normalMap = standard.normalMap ?? null;
  // glTF packs both into one texture: roughness in G, metalness in B.
  const roughnessMap = standard.roughnessMap ?? null;
  const metalnessMap = standard.metalnessMap ?? null;
  if (!normalMap && !roughnessMap && !metalnessMap) return null;
  return {
    normalMap,
    // GLTFLoader may have flipped y for meshes without tangents; the engine
    // sets the sign itself, from the tangents it keeps (see buildUnitModel).
    normalStrength: Math.abs(standard.normalScale?.x ?? 1),
    roughnessMap,
    metalnessMap,
    roughness: standard.roughness ?? 1,
    metalness: standard.metalness ?? 0,
  };
}

/**
 * Resolves to null when the file does not exist or is not a usable model, so
 * the caller can fall back to the placeholder figure.
 */
export async function loadModelSource(
  model: string,
  signal: AbortSignal,
): Promise<SkinnedSource | null> {
  const url = `/battles/models/${encodeURIComponent(model)}.glb`;
  let buffer: ArrayBuffer;
  try {
    const response = await fetch(url, { signal });
    if (!response.ok) {
      console.warn(`Unit model ${model}.glb is in the model index but could not be loaded (${response.status}); using the placeholder figure.`);
      return null;
    }
    if ((response.headers.get("content-type") ?? "").includes("text/html")) return null;
    buffer = await response.arrayBuffer();
  } catch (error) {
    if (signal.aborted) throw error;
    return null;
  }

  try {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    const gltf = await loader.parseAsync(buffer, "");
    signal.throwIfAborted();

    const meshes: SkinnedMesh[] = [];
    gltf.scene.traverse((object) => {
      if (isSkinnedMesh(object)) meshes.push(object);
    });

    const release = () => {
      gltf.scene.traverse((object) => {
        const mesh = object as SkinnedMesh;
        if (!mesh.isMesh) return;
        mesh.geometry.dispose();
        const materials: Material[] = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const material of materials) {
          for (const value of Object.values(material)) {
            if (value instanceof Texture) {
              value.dispose();
              (value.image as { close?: () => void } | null)?.close?.();
            }
          }
          material.dispose();
        }
      });
    };

    if (meshes.length === 0) {
      console.warn(`Unit model ${model}.glb has no skinned mesh; using the placeholder figure.`);
      release();
      return null;
    }

    const lods: SkinnedMesh[][] = UNIT_LODS.map(() => []);
    for (const mesh of meshes) {
      const level = lodLevel(mesh);
      if (level >= 0 && level < lods.length) lods[level].push(mesh);
    }
    if (lods.every((level) => level.length === 0)) {
      // No LOD names: take the meshes from most to least detailed.
      meshes.sort((a, b) => triangleCount(b) - triangleCount(a));
      meshes.slice(0, lods.length).forEach((mesh, level) => lods[level].push(mesh));
    }

    const first = (lods.find((level) => level.length > 0) ?? [meshes[0]])[0];
    const material = Array.isArray(first.material) ? first.material[0] : first.material;
    const map = (material as { map?: Texture | null }).map ?? null;

    return {
      name: model,
      placeholder: false,
      root: gltf.scene,
      lods,
      clips: gltf.animations,
      map,
      surface: surfaceMaps(material),
      doubleSided: material.side === DoubleSide,
      release,
    };
  } catch (error) {
    if (signal.aborted) throw error;
    console.warn(`Unit model ${model}.glb could not be read; using the placeholder figure.`, error);
    return null;
  }
}
