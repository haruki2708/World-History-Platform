/**
 * What is in the air: the javelins and sling stones of the units that fight
 * at a distance, and the javelins thrown over the front rank of a fight hand
 * to hand. The crowd (units.ts) says every frame which missiles are in
 * flight and how far along; this file only draws them, each on its arc.
 *
 * No missile is kept from one frame to the next: where it is follows from
 * the moment its thrower let go, so a seek shows the same flight as playing
 * up to that moment.
 */

import {
  BufferAttribute,
  BufferGeometry,
  DynamicDrawUsage,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  Matrix4,
  MeshLambertMaterial,
  Quaternion,
  Vector3,
} from "three";

export type MissileKind = "javelin" | "stone";

/** Missiles of one kind drawn at once; more than this are not drawn. */
const CAPACITY = 1536;
/** A javelin as drawn, metres (figures are drawn larger than life, and so is what they throw). */
const JAVELIN_LENGTH = 5.4;
const JAVELIN_HALF_WIDTH = 0.075;
const STONE_RADIUS = 0.24;
/** How hard the ground pulls at the size things are drawn, m/s²: sets how high an arc rises. */
const GRAVITY = 9.8 * 3;

const WOOD = [0.2, 0.13, 0.07];
const IRON = [0.3, 0.31, 0.33];

/** A shaft of square section along +Z with an iron head, its middle at the origin. */
function javelinGeometry(): BufferGeometry {
  const half = JAVELIN_LENGTH / 2;
  const neck = half - JAVELIN_LENGTH * 0.16;
  const w = JAVELIN_HALF_WIDTH;
  const positions: number[] = [];
  const colors: number[] = [];
  const corner = (k: number, z: number, width: number) => {
    const a = (k * Math.PI) / 2 + Math.PI / 4;
    return [Math.cos(a) * width, Math.sin(a) * width, z];
  };
  const triangle = (a: number[], b: number[], c: number[], color: number[]) => {
    positions.push(...a, ...b, ...c);
    colors.push(...color, ...color, ...color);
  };
  for (let k = 0; k < 4; k++) {
    const a0 = corner(k, -half, w);
    const b0 = corner(k + 1, -half, w);
    const a1 = corner(k, neck, w);
    const b1 = corner(k + 1, neck, w);
    triangle(a0, b0, b1, WOOD);
    triangle(a0, b1, a1, WOOD);
    // The head: wider than the shaft where it begins, then to a point.
    const a2 = corner(k, neck, w * 1.9);
    const b2 = corner(k + 1, neck, w * 1.9);
    triangle(a2, b2, [0, 0, half], IRON);
    triangle(a1, b1, b2, IRON);
    triangle(a1, b2, a2, IRON);
  }
  // The butt.
  triangle(corner(0, -half, w), corner(2, -half, w), corner(1, -half, w), WOOD);
  triangle(corner(0, -half, w), corner(3, -half, w), corner(2, -half, w), WOOD);
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute("color", new BufferAttribute(new Float32Array(colors), 3));
  geometry.computeVertexNormals();
  return geometry;
}

const AHEAD = new Vector3(0, 0, 1);

export class Missiles {
  readonly group = new Group();
  private readonly javelins: InstancedMesh;
  private readonly stones: InstancedMesh;
  private javelinCount = 0;
  private stoneCount = 0;
  private readonly matrix = new Matrix4();
  private readonly position = new Vector3();
  private readonly direction = new Vector3();
  private readonly turn = new Quaternion();
  private readonly scale = new Vector3(1, 1, 1);

  constructor() {
    this.javelins = new InstancedMesh(javelinGeometry(), new MeshLambertMaterial({ vertexColors: true }), CAPACITY);
    this.stones = new InstancedMesh(
      new IcosahedronGeometry(STONE_RADIUS, 0),
      new MeshLambertMaterial({ color: 0x6d6a66 }),
      CAPACITY,
    );
    for (const mesh of [this.javelins, this.stones]) {
      mesh.instanceMatrix.setUsage(DynamicDrawUsage);
      // They are all over the field: one sphere round them would be the field.
      mesh.frustumCulled = false;
      mesh.count = 0;
      this.group.add(mesh);
    }
  }

  /** Before the crowd tells what is in the air this frame. */
  begin(): void {
    this.javelinCount = 0;
    this.stoneCount = 0;
  }

  /**
   * A missile `share` (0..1) of the way along its flight: thrown from
   * (x, y, z) in the world, towards `east`, `north` (a unit vector on the
   * field), to land `distance` metres on and `drop` metres higher (lower:
   * negative), after `seconds` in the air.
   */
  add(
    kind: MissileKind,
    x: number,
    y: number,
    z: number,
    east: number,
    north: number,
    distance: number,
    drop: number,
    seconds: number,
    share: number,
  ): void {
    const stone = kind === "stone";
    const index = stone ? this.stoneCount : this.javelinCount;
    if (index >= CAPACITY) return;
    // The height it gains above the straight line, at its most in the middle.
    const lift = (GRAVITY * seconds * seconds) / 8;
    this.position.set(
      x + east * distance * share,
      y + drop * share + 4 * lift * share * (1 - share),
      z - north * distance * share,
    );
    if (stone) {
      this.turn.identity();
    } else {
      // It flies point first: along the way it is going.
      this.direction.set(east * distance, drop + 4 * lift * (1 - 2 * share), -north * distance).normalize();
      this.turn.setFromUnitVectors(AHEAD, this.direction);
    }
    this.matrix.compose(this.position, this.turn, this.scale);
    (stone ? this.stones : this.javelins).setMatrixAt(index, this.matrix);
    if (stone) this.stoneCount++;
    else this.javelinCount++;
  }

  /** After the crowd is done: what was told is what is drawn until the next `begin`. */
  end(): void {
    this.javelins.count = this.javelinCount;
    this.stones.count = this.stoneCount;
    if (this.javelinCount > 0) {
      this.javelins.instanceMatrix.clearUpdateRanges();
      this.javelins.instanceMatrix.addUpdateRange(0, this.javelinCount * 16);
      this.javelins.instanceMatrix.needsUpdate = true;
    }
    if (this.stoneCount > 0) {
      this.stones.instanceMatrix.clearUpdateRanges();
      this.stones.instanceMatrix.addUpdateRange(0, this.stoneCount * 16);
      this.stones.instanceMatrix.needsUpdate = true;
    }
  }

  /** How many are in the air, for tests. */
  get flying(): number {
    return this.javelinCount + this.stoneCount;
  }

  dispose(): void {
    for (const mesh of [this.javelins, this.stones]) {
      mesh.geometry.dispose();
      (mesh.material as MeshLambertMaterial).dispose();
      mesh.dispose();
    }
  }
}
