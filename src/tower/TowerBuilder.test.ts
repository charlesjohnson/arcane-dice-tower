import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { buildTower } from './TowerBuilder';
import { DICE_MATERIAL } from '../dice/DiceBody';

const TOWER_RADIUS = 2.0;
const COLLISION_WALL_HALF = 0.5;
const MAX_DIE_DIAMETER = 1.2; // largest die radius (0.6) × 2
const MIN_DIE_RADIUS = 0.5; // smallest die (d4)

describe('Tower physics containment', () => {
  it('has a front wall physics body that blocks dice from exiting the open front', () => {
    const scene = new THREE.Scene();
    const physics = new PhysicsWorld();
    buildTower(scene, physics);

    const bodies = (physics.world as unknown as { bodies: CANNON.Body[] }).bodies;
    const frontWallBodies = bodies.filter((b: CANNON.Body) => {
      return Math.abs(b.position.z - TOWER_RADIUS) < 0.2 && b.position.y > 2;
    });

    expect(frontWallBodies.length).toBeGreaterThan(0);
  });

  it('has baffles close enough to the front wall that dice cannot escape the gap', () => {
    const scene = new THREE.Scene();
    const physics = new PhysicsWorld();
    buildTower(scene, physics);

    const bodies = (physics.world as unknown as { bodies: CANNON.Body[] }).bodies;

    // The front wall starts above y=2 to allow the ramp-to-tray exit.
    // Baffles must extend close enough to the front wall in z that dice
    // can't fit through the gap during the baffle zig-zag phase.
    const baffleBodies = bodies.filter((b: CANNON.Body) => {
      if (b.mass !== 0) return false;
      if (b.position.y < 1.0 || b.position.y > 7.5) return false;
      return Math.abs(b.quaternion.z) > 0.01;
    });

    const frontWallInnerZ = TOWER_RADIUS - COLLISION_WALL_HALF; // 1.5

    for (const baffle of baffleBodies) {
      const shape = baffle.shapes[0] as CANNON.Box;
      const frontEdge = baffle.position.z + shape.halfExtents.z;
      const gap = frontWallInnerZ - frontEdge;

      expect(
        gap,
        `Baffle at y=${baffle.position.y}: z-gap to front wall ${gap.toFixed(2)} must be < ${MIN_DIE_RADIUS} (smallest die radius)`
      ).toBeLessThan(MIN_DIE_RADIUS);
    }
  });
});

describe('Tower baffle geometry prevents dice from getting stuck', () => {
  function getBaffleBodies(physics: PhysicsWorld): CANNON.Body[] {
    const bodies = (physics.world as unknown as { bodies: CANNON.Body[] }).bodies;
    // Baffles are static bodies positioned between Y=2 and Y=7 with rotated quaternions
    return bodies.filter((b: CANNON.Body) => {
      if (b.mass !== 0) return false;
      if (b.position.y < 1.0 || b.position.y > 7.5) return false;
      // Baffles have Z-axis rotation (non-identity quaternion around Z)
      const q = b.quaternion;
      const isRotated = Math.abs(q.z) > 0.01;
      return isRotated;
    });
  }

  it('leaves a gap wider than the largest die on at least one side of each baffle', () => {
    const scene = new THREE.Scene();
    const physics = new PhysicsWorld();
    buildTower(scene, physics);

    const baffleBodies = getBaffleBodies(physics);
    expect(baffleBodies.length).toBe(4);

    for (const baffle of baffleBodies) {
      const shape = baffle.shapes[0] as CANNON.Box;
      const halfWidth = shape.halfExtents.x;

      // The baffle's effective X extent at its position
      const baffleLeftEdge = baffle.position.x - halfWidth;
      const baffleRightEdge = baffle.position.x + halfWidth;

      // Gap between baffle edges and tower walls
      const leftGap = baffleLeftEdge - (-TOWER_RADIUS);
      const rightGap = TOWER_RADIUS - baffleRightEdge;

      // At least one side must have a gap wider than the largest die radius
      // so dice can fall past the baffle
      const maxGap = Math.max(leftGap, rightGap);
      expect(
        maxGap,
        `Baffle at y=${baffle.position.y}: max gap ${maxGap.toFixed(2)} must exceed die radius 0.6`
      ).toBeGreaterThan(0.6);
    }
  });

  it('has baffle angles steep enough to slide dice off (at least 20 degrees)', () => {
    const scene = new THREE.Scene();
    const physics = new PhysicsWorld();
    buildTower(scene, physics);

    const baffleBodies = getBaffleBodies(physics);
    expect(baffleBodies.length).toBe(4);

    const minAngleDegrees = 20;
    const minAngleRad = (minAngleDegrees * Math.PI) / 180;

    for (const baffle of baffleBodies) {
      // Extract Z rotation angle from quaternion
      const q = baffle.quaternion;
      const sinZ = 2 * (q.w * q.z + q.x * q.y);
      const cosZ = 1 - 2 * (q.y * q.y + q.z * q.z);
      const angleZ = Math.atan2(sinZ, cosZ);

      expect(
        Math.abs(angleZ),
        `Baffle at y=${baffle.position.y}: angle ${(Math.abs(angleZ) * 180 / Math.PI).toFixed(1)}° must be ≥ ${minAngleDegrees}°`
      ).toBeGreaterThanOrEqual(minAngleRad);
    }
  });

  it('slopes each baffle down toward its open gap, not toward the wall', () => {
    const scene = new THREE.Scene();
    const physics = new PhysicsWorld();
    buildTower(scene, physics);

    const baffleBodies = getBaffleBodies(physics);
    expect(baffleBodies.length).toBe(4);

    for (const baffle of baffleBodies) {
      const shape = baffle.shapes[0] as CANNON.Box;
      const halfWidth = shape.halfExtents.x;

      const leftGap = (baffle.position.x - halfWidth) - (-TOWER_RADIUS);
      const rightGap = TOWER_RADIUS - (baffle.position.x + halfWidth);

      // Determine which side has the larger gap (where dice should fall through)
      const gapIsOnLeft = leftGap > rightGap;

      // Extract Z rotation angle from quaternion
      const q = baffle.quaternion;
      const sinZ = 2 * (q.w * q.z + q.x * q.y);
      const cosZ = 1 - 2 * (q.y * q.y + q.z * q.z);
      const angleZ = Math.atan2(sinZ, cosZ);

      // Positive rotZ → left side drops (slopes left)
      // Negative rotZ → right side drops (slopes right)
      // Baffle must slope DOWN toward the gap side
      const slopesLeft = angleZ > 0;
      const slopesRight = angleZ < 0;

      if (gapIsOnLeft) {
        expect(
          slopesLeft,
          `Baffle at y=${baffle.position.y}: gap is on left but baffle slopes right (rotZ=${angleZ.toFixed(2)})`
        ).toBe(true);
      } else {
        expect(
          slopesRight,
          `Baffle at y=${baffle.position.y}: gap is on right but baffle slopes left (rotZ=${angleZ.toFixed(2)})`
        ).toBe(true);
      }
    }
  });

  it('has side wall collision bodies thick enough to prevent tunneling', () => {
    const scene = new THREE.Scene();
    const physics = new PhysicsWorld();
    buildTower(scene, physics);

    const bodies = (physics.world as unknown as { bodies: CANNON.Body[] }).bodies;

    // Side walls are at x = ±TOWER_RADIUS, span full tower height
    const sideWallBodies = bodies.filter((b: CANNON.Body) => {
      return Math.abs(Math.abs(b.position.x) - TOWER_RADIUS) < 0.01 &&
        b.position.y > 2;
    });

    expect(sideWallBodies.length).toBe(2);

    for (const wall of sideWallBodies) {
      const shape = wall.shapes[0] as CANNON.Box;
      // Must be at least 0.4 half-extent (0.8 total) to prevent tunneling
      // in the wider tower where dice build more speed
      expect(
        shape.halfExtents.x,
        `Side wall at x=${wall.position.x}: half-extent ${shape.halfExtents.x} too thin`
      ).toBeGreaterThanOrEqual(0.4);
    }
  });

  it('has wall-side gaps too narrow for dice to enter and jam', () => {
    const scene = new THREE.Scene();
    const physics = new PhysicsWorld();
    buildTower(scene, physics);

    const baffleBodies = getBaffleBodies(physics);
    expect(baffleBodies.length).toBe(4);

    for (const baffle of baffleBodies) {
      const shape = baffle.shapes[0] as CANNON.Box;
      const halfWidth = shape.halfExtents.x;

      const leftGap = (baffle.position.x - halfWidth) - (-TOWER_RADIUS);
      const rightGap = TOWER_RADIUS - (baffle.position.x + halfWidth);
      const minGap = Math.min(leftGap, rightGap);

      expect(
        minGap,
        `Baffle at y=${baffle.position.y}: wall-side gap ${minGap.toFixed(2)} must be < ${MIN_DIE_RADIUS} so dice can't enter`
      ).toBeLessThan(MIN_DIE_RADIUS);
    }
  });

  it('has baffles flush with the back wall so dice cannot slip behind', () => {
    const scene = new THREE.Scene();
    const physics = new PhysicsWorld();
    buildTower(scene, physics);

    const baffleBodies = getBaffleBodies(physics);
    expect(baffleBodies.length).toBe(4);

    const backWallInner = -(TOWER_RADIUS - COLLISION_WALL_HALF); // -1.75

    for (const baffle of baffleBodies) {
      const shape = baffle.shapes[0] as CANNON.Box;
      const backEdge = baffle.position.z - shape.halfExtents.z;

      expect(
        backEdge,
        `Baffle at y=${baffle.position.y}: back edge ${backEdge.toFixed(2)} must be within ${MIN_DIE_RADIUS} of back wall ${backWallInner}`
      ).toBeLessThanOrEqual(backWallInner + MIN_DIE_RADIUS);
    }
  });

  it('has a low-friction front wall so dice pinned against it slide down', () => {
    const scene = new THREE.Scene();
    const physics = new PhysicsWorld();
    buildTower(scene, physics);

    const bodies = (physics.world as unknown as { bodies: CANNON.Body[] }).bodies;

    // Baffles extend close to the front wall, so dice may contact both a
    // baffle and the front wall simultaneously. The front wall must have a
    // low-friction material so dice slide down instead of stalling.
    const frontWallBodies = bodies.filter((b: CANNON.Body) => {
      if (b.mass !== 0) return false;
      if (Math.abs(b.position.z - TOWER_RADIUS) > 0.6) return false;
      const shape = b.shapes[0] as CANNON.Box;
      return shape.halfExtents.x >= 1.0 && b.position.y > 2;
    });

    expect(frontWallBodies.length).toBeGreaterThan(0);

    for (const wall of frontWallBodies) {
      const mat = wall.material as CANNON.Material;
      expect(
        mat,
        `Front wall at z=${wall.position.z.toFixed(2)}: must have a CANNON.Material assigned`
      ).toBeTruthy();
      // cannon-es box-box solver needs friction=0 for boxes to slide on walls
      expect(
        mat.friction,
        `Front wall friction ${mat.friction} must be 0 for box sliding`
      ).toBe(0);
    }
  });

  it('has drop gaps at least 1.5× the die radius for reliable passage', () => {
    const scene = new THREE.Scene();
    const physics = new PhysicsWorld();
    buildTower(scene, physics);

    const baffleBodies = getBaffleBodies(physics);
    expect(baffleBodies.length).toBe(4);

    const minGap = MAX_DIE_DIAMETER / 2 * 1.5; // 0.9 units

    for (const baffle of baffleBodies) {
      const shape = baffle.shapes[0] as CANNON.Box;
      const halfWidth = shape.halfExtents.x;

      const leftGap = (baffle.position.x - halfWidth) - (-TOWER_RADIUS);
      const rightGap = TOWER_RADIUS - (baffle.position.x + halfWidth);
      const maxGap = Math.max(leftGap, rightGap);

      expect(
        maxGap,
        `Baffle at y=${baffle.position.y}: max gap ${maxGap.toFixed(2)} must be ≥ ${minGap} (1.5× die radius)`
      ).toBeGreaterThanOrEqual(minGap);
    }
  });

  it('contains dice within tower walls during a simulated drop', () => {
    const scene = new THREE.Scene();
    const physics = new PhysicsWorld();
    const tower = buildTower(scene, physics);

    // Drop a sphere die from the top of the tower
    const dieRadius = 0.6;
    const die = new CANNON.Body({
      mass: 0.3,
      shape: new CANNON.Sphere(dieRadius),
    });
    die.position.set(0, tower.dropPosition.y, 0);
    die.angularVelocity.set(10, -5, 8);
    physics.addDynamicBody(die);

    // Simulate 5 seconds of physics
    const steps = 300;
    for (let i = 0; i < steps; i++) {
      physics.step(1 / 60);

      const x = die.position.x;
      const wallInner = TOWER_RADIUS - COLLISION_WALL_HALF;
      expect(
        Math.abs(x),
        `Die escaped side wall at step ${i}: x=${x.toFixed(2)}, wall inner at ±${wallInner}`
      ).toBeLessThan(wallInner);
    }
  });

  it('has a low-friction ramp so dice slide into the tray', () => {
    const scene = new THREE.Scene();
    const physics = new PhysicsWorld();
    buildTower(scene, physics);

    const bodies = (physics.world as unknown as { bodies: CANNON.Body[] }).bodies;

    // The ramp is a static body with X-axis rotation (tilted forward),
    // positioned in the lower portion of the tower (Y < 1.5).
    const rampBodies = bodies.filter((b: CANNON.Body) => {
      if (b.mass !== 0) return false;
      if (b.position.y > 1.5 || b.position.y < 0) return false;
      const q = b.quaternion;
      // Has X-axis rotation (forward tilt)
      const hasXRot = Math.abs(q.x) > 0.01;
      // No Z-axis rotation (not a baffle)
      const hasZRot = Math.abs(q.z) > 0.01;
      return hasXRot && !hasZRot;
    });

    expect(rampBodies.length).toBeGreaterThan(0);

    for (const ramp of rampBodies) {
      const mat = ramp.material as CANNON.Material;
      expect(
        mat,
        `Ramp/slope at y=${ramp.position.y.toFixed(2)}: must have a CANNON.Material assigned`
      ).toBeTruthy();
      // cannon-es box-box solver needs friction=0 for D6 boxes to slide
      expect(
        mat.friction,
        `Ramp/slope at y=${ramp.position.y.toFixed(2)}: friction ${mat.friction} must be 0`
      ).toBe(0);
    }
  });

  it('has frictionless baffle surfaces so D6 box shapes slide off', () => {
    const scene = new THREE.Scene();
    const physics = new PhysicsWorld();
    buildTower(scene, physics);

    const baffleBodies = getBaffleBodies(physics);
    expect(baffleBodies.length).toBe(4);

    for (const baffle of baffleBodies) {
      // cannon-es box-box solver needs friction=0 for boxes to slide.
      // Normal forces from the angled surface still redirect dice.
      const mat = baffle.material as CANNON.Material;
      expect(
        mat,
        `Baffle at y=${baffle.position.y}: must have a CANNON.Material assigned`
      ).toBeTruthy();
      expect(
        mat.friction,
        `Baffle at y=${baffle.position.y}: friction ${mat.friction} must be 0`
      ).toBe(0);
    }
  });

  it('has enough vertical space between consecutive baffles for dice to pass', () => {
    const scene = new THREE.Scene();
    const physics = new PhysicsWorld();
    buildTower(scene, physics);

    const baffleBodies = getBaffleBodies(physics);
    expect(baffleBodies.length).toBe(4);

    // Sort by Y position descending (top to bottom)
    const sorted = [...baffleBodies].sort((a, b) => b.position.y - a.position.y);

    for (let i = 0; i < sorted.length - 1; i++) {
      const upper = sorted[i];
      const lower = sorted[i + 1];
      const verticalGap = upper.position.y - lower.position.y;

      // Gap must be at least 1.5× the largest die diameter to prevent trapping
      expect(
        verticalGap,
        `Gap between baffles at y=${upper.position.y} and y=${lower.position.y}: ${verticalGap.toFixed(2)} must be ≥ ${MAX_DIE_DIAMETER * 1.5}`
      ).toBeGreaterThanOrEqual(MAX_DIE_DIAMETER * 1.5);
    }
  });
});

describe('Ramp-to-tray transition', () => {
  it('tray floor uses a Plane (no edges to catch die corners)', () => {
    const scene = new THREE.Scene();
    const physics = new PhysicsWorld();
    buildTower(scene, physics);

    const bodies = (physics.world as unknown as { bodies: CANNON.Body[] }).bodies;

    // The tray floor should be a Plane, not a Box. Box edges have vertical
    // front faces that act as walls, catching D6 corners poking below the
    // ramp surface and stalling dice at the ramp exit.
    const planeBody = bodies.find((b: CANNON.Body) =>
      b.mass === 0 &&
      b.shapes[0] instanceof CANNON.Plane
    )!;
    expect(planeBody, 'tray floor Plane body not found').toBeTruthy();

    // Must be frictionless so D6 boxes slide (cannon-es box-plane solver)
    expect(planeBody.material, 'tray floor must have a material').toBeTruthy();
    expect(
      (planeBody.material as CANNON.Material).friction,
      'tray floor must be frictionless'
    ).toBe(0);
  });

  it('D6 settles deep in the tray, not at the ramp edge', () => {
    const scene = new THREE.Scene();
    const physics = new PhysicsWorld();
    const tower = buildTower(scene, physics);

    const d6Half = (0.6 * 1.2) / 2;
    const die = new CANNON.Body({
      mass: 0.3,
      shape: new CANNON.Box(new CANNON.Vec3(d6Half, d6Half, d6Half)),
      material: DICE_MATERIAL,
      linearDamping: 0.5,
      angularDamping: 0.5,
    });
    die.allowSleep = false;
    die.position.set(tower.dropPosition.x, tower.dropPosition.y, tower.dropPosition.z);
    die.angularVelocity.set(5, -3, 4);
    physics.addDynamicBody(die);

    for (let i = 0; i < 900; i++) {
      physics.step(1 / 60);
    }

    // Die must be well inside the tray (Z > 2.5), not stuck at the ramp edge (~1.98)
    expect(
      die.position.z,
      `Die stopped at Z=${die.position.z.toFixed(3)}, stuck near ramp edge instead of in tray`
    ).toBeGreaterThan(2.5);
  });
});

describe('cannon-es box-on-slope friction workaround', () => {
  // Documents a cannon-es limitation: its box-box friction solver applies
  // far more friction than specified for any non-zero coefficient. Only
  // friction=0 reliably allows D6 box shapes to slide on angled surfaces.
  // Spheres work correctly with any friction value.

  function testSlide(
    angleDeg: number,
    friction: number,
    shape: 'box' | 'sphere'
  ): number {
    const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });
    world.broadphase = new CANNON.SAPBroadphase(world);

    const slopeMat = new CANNON.Material({ friction });
    const dieMat = new CANNON.Material({ friction: 0.4 });
    world.addContactMaterial(new CANNON.ContactMaterial(dieMat, slopeMat, {
      friction,
      restitution: 0.3,
    }));

    const angle = (angleDeg * Math.PI) / 180;
    const slope = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(new CANNON.Vec3(2, 0.05, 4)),
      material: slopeMat,
    });
    slope.quaternion.setFromEuler(angle, 0, 0);
    slope.position.set(0, 2, 0);
    world.addBody(slope);

    const die = new CANNON.Body({
      mass: 0.3,
      shape: shape === 'box'
        ? new CANNON.Box(new CANNON.Vec3(0.36, 0.36, 0.36))
        : new CANNON.Sphere(0.36),
      material: dieMat,
      linearDamping: 0.5,
      angularDamping: 0.5,
    });
    die.allowSleep = false;
    die.position.set(0, 3, -2);
    world.addBody(die);

    const initialZ = die.position.z;
    for (let i = 0; i < 300; i++) {
      world.step(1 / 60);
    }
    return die.position.z - initialZ;
  }

  it('sphere slides on 12° slope with friction 0.02', () => {
    const dz = testSlide(12, 0.02, 'sphere');
    expect(dz, `Sphere moved ${dz.toFixed(3)}`).toBeGreaterThan(0.5);
  });

  it('box does NOT slide on 12° slope with friction 0.02 (known cannon-es bug)', () => {
    // Box should slide (tan(12°)=0.21 >> 0.02) but cannon-es box solver stalls it
    const dz = testSlide(12, 0.02, 'box');
    expect(dz, `Box moved ${dz.toFixed(3)}`).toBeLessThan(0.5);
  });

  it('box DOES slide on 12° slope with friction 0.0 (workaround)', () => {
    // With friction=0, the friction solver is bypassed entirely
    const dz = testSlide(12, 0.0, 'box');
    expect(dz, `Box moved ${dz.toFixed(3)}`).toBeGreaterThan(0.5);
  });
});

describe('End-to-end: D6 reaches the tray', () => {
  // The hardest case: a D6 (box shape) has flat faces that create
  // more friction and can catch on edges. If the tower works for a
  // D6, it works for all dice.

  function dropD6(
    angularVelocity: [number, number, number],
    offsetX = 0
  ): { finalPos: CANNON.Vec3; stuck: boolean; escapedWalls: boolean; fellThrough: boolean } {
    const scene = new THREE.Scene();
    const physics = new PhysicsWorld();
    const tower = buildTower(scene, physics);

    // Create a D6 box body matching DiceBody.ts (radius 0.6, half = 0.36)
    const d6Half = (0.6 * 1.2) / 2; // 0.36
    const die = new CANNON.Body({
      mass: 0.3,
      shape: new CANNON.Box(new CANNON.Vec3(d6Half, d6Half, d6Half)),
      material: DICE_MATERIAL,
      linearDamping: 0.5,
      angularDamping: 0.5,
    });
    // Disable sleep so cannon-es doesn't freeze the die prematurely when
    // box-box contacts briefly create a zero-velocity state on baffles.
    die.allowSleep = false;

    die.position.set(
      tower.dropPosition.x + offsetX,
      tower.dropPosition.y,
      tower.dropPosition.z
    );
    die.angularVelocity.set(...angularVelocity);
    physics.addDynamicBody(die);

    const wallInner = TOWER_RADIUS - COLLISION_WALL_HALF;
    let escapedWalls = false;
    let fellThrough = false;

    // Simulate 15 seconds (900 steps at 1/60) — low-spin dice need extra
    // time to traverse frictionless baffles before reaching the ramp.
    for (let i = 0; i < 900; i++) {
      physics.step(1 / 60);

      if (Math.abs(die.position.x) > wallInner + 0.5) escapedWalls = true;
      if (die.position.y < -2) fellThrough = true;
    }

    // Die is "stuck" if it's still inside the tower after 10 seconds.
    // Tray is at z > TOWER_RADIUS. A die in the tray or past the front
    // wall exit is considered successful.
    const inTray = die.position.z > TOWER_RADIUS - 0.5 && die.position.y < 1.5;
    const stuck = !inTray && !fellThrough;

    return { finalPos: die.position, stuck, escapedWalls, fellThrough };
  }

  // Test multiple angular velocities covering different drop scenarios:
  // centered, off-center, high spin, low spin, various axes.
  const trials: { name: string; angVel: [number, number, number]; offsetX: number }[] = [
    { name: 'centered, moderate spin',    angVel: [5, -3, 4],     offsetX: 0 },
    { name: 'centered, high spin',        angVel: [15, -10, 12],  offsetX: 0 },
    { name: 'centered, low spin',         angVel: [2, -1, 2],     offsetX: 0 },
    { name: 'left offset, spin right',    angVel: [-8, 3, -6],    offsetX: -0.5 },
    { name: 'right offset, spin left',    angVel: [8, -3, 6],     offsetX: 0.5 },
    { name: 'no spin (worst case)',       angVel: [0, 0, 0],      offsetX: 0 },
    { name: 'pure Z spin',               angVel: [0, 0, 15],     offsetX: 0 },
    { name: 'pure X spin',               angVel: [15, 0, 0],     offsetX: 0 },
    { name: 'max offset left',           angVel: [10, -5, 8],    offsetX: -1.0 },
    { name: 'max offset right',          angVel: [-10, 5, -8],   offsetX: 1.0 },
  ];

  for (const trial of trials) {
    it(`reaches the tray: ${trial.name}`, () => {
      const result = dropD6(trial.angVel, trial.offsetX);

      expect(
        result.fellThrough,
        `Die fell through floor! Final pos: (${result.finalPos.x.toFixed(2)}, ${result.finalPos.y.toFixed(2)}, ${result.finalPos.z.toFixed(2)})`
      ).toBe(false);

      expect(
        result.escapedWalls,
        `Die escaped tower walls! Final pos: (${result.finalPos.x.toFixed(2)}, ${result.finalPos.y.toFixed(2)}, ${result.finalPos.z.toFixed(2)})`
      ).toBe(false);

      expect(
        result.stuck,
        `Die stuck in tower! Final pos: (${result.finalPos.x.toFixed(2)}, ${result.finalPos.y.toFixed(2)}, ${result.finalPos.z.toFixed(2)})`
      ).toBe(false);
    });
  }
});

describe('End-to-end: D6 settles in the tray', () => {
  // After traversing the tower, the die must come to rest quickly in the
  // tray so the game can read results. Uses production thresholds from
  // PhysicsWorld.areBodiesSettled() (speed < 0.05, angSpeed < 0.1) and
  // requires settling within 3 seconds of entering the tray.

  const SETTLE_SPEED = 0.05;        // matches PhysicsWorld VELOCITY_THRESHOLD
  const SETTLE_ANG_SPEED = 0.1;     // matches PhysicsWorld ANGULAR_VELOCITY_THRESHOLD
  const SETTLE_BUDGET_STEPS = 300;  // 5 seconds at 60fps

  function dropAndSettle(
    angularVelocity: [number, number, number],
    offsetX = 0
  ): { settled: boolean; settleSteps: number; finalPos: CANNON.Vec3; finalSpeed: number; finalAngSpeed: number } {
    const scene = new THREE.Scene();
    const physics = new PhysicsWorld();
    const tower = buildTower(scene, physics);

    const d6Half = (0.6 * 1.2) / 2;
    const die = new CANNON.Body({
      mass: 0.3,
      shape: new CANNON.Box(new CANNON.Vec3(d6Half, d6Half, d6Half)),
      material: DICE_MATERIAL,
      linearDamping: 0.5,
      angularDamping: 0.5,
    });
    // Match production dice: sleep enabled so die freezes once at rest
    die.allowSleep = true;
    die.sleepSpeedLimit = 0.05;
    die.sleepTimeLimit = 0.5;

    die.position.set(
      tower.dropPosition.x + offsetX,
      tower.dropPosition.y,
      tower.dropPosition.z
    );
    die.angularVelocity.set(...angularVelocity);
    physics.addDynamicBody(die);

    let trayEntryStep = -1;
    let settleStep = -1;
    const maxSteps = 1800; // 30 seconds total budget

    for (let i = 0; i < maxSteps; i++) {
      physics.step(1 / 60);

      const inTray = die.position.z > TOWER_RADIUS - 0.5 && die.position.y < 1.5;
      if (inTray && trayEntryStep < 0) {
        trayEntryStep = i;
      }

      // Check production-level settlement after tray entry
      if (trayEntryStep >= 0) {
        const speed = die.velocity.length();
        const angSpeed = die.angularVelocity.length();
        if (speed < SETTLE_SPEED && angSpeed < SETTLE_ANG_SPEED) {
          settleStep = i;
          break;
        }
        // Give up if past budget
        if (i - trayEntryStep >= SETTLE_BUDGET_STEPS) {
          break;
        }
      }
    }

    const speed = die.velocity.length();
    const angSpeed = die.angularVelocity.length();
    const settleSteps = settleStep >= 0 ? settleStep - trayEntryStep : -1;
    const settled = settleStep >= 0;

    return { settled, settleSteps, finalPos: die.position, finalSpeed: speed, finalAngSpeed: angSpeed };
  }

  const settleTrials: { name: string; angVel: [number, number, number]; offsetX: number }[] = [
    { name: 'moderate spin',   angVel: [5, -3, 4],     offsetX: 0 },
    { name: 'high spin',       angVel: [15, -10, 12],  offsetX: 0 },
    { name: 'no spin',         angVel: [0, 0, 0],      offsetX: 0 },
    { name: 'offset with spin', angVel: [8, -3, 6],    offsetX: 0.5 },
  ];

  for (const trial of settleTrials) {
    it(`settles within 5s of tray entry: ${trial.name}`, () => {
      const result = dropAndSettle(trial.angVel, trial.offsetX);

      expect(
        result.settled,
        `Die did not settle within 5s! speed=${result.finalSpeed.toFixed(3)}, ` +
        `angSpeed=${result.finalAngSpeed.toFixed(3)}, ` +
        `pos=(${result.finalPos.x.toFixed(2)}, ${result.finalPos.y.toFixed(2)}, ${result.finalPos.z.toFixed(2)})`
      ).toBe(true);
    });
  }
});
