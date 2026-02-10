import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { buildTower } from './TowerBuilder';

const TOWER_RADIUS = 1.5;
const MAX_DIE_DIAMETER = 1.2; // largest die radius (0.6) × 2

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
      // The thin dimension (X) must be at least 0.2 half-extent to give the
      // solver enough margin to resolve collisions when dice are pressed
      // against walls by baffle contact forces
      expect(
        shape.halfExtents.x,
        `Side wall at x=${wall.position.x}: half-extent ${shape.halfExtents.x} too thin`
      ).toBeGreaterThanOrEqual(0.2);
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
