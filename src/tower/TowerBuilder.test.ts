import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { buildTower } from './TowerBuilder';

const TOWER_RADIUS = 1.5;

describe('Tower physics containment', () => {
  it('has a front wall physics body that blocks dice from exiting the open front', () => {
    const scene = new THREE.Scene();
    const physics = new PhysicsWorld();
    buildTower(scene, physics);

    // Inspect all bodies in the physics world for one at the front face (Z ≈ TOWER_RADIUS)
    // positioned in the upper portion of the tower (Y > 2).
    const bodies = (physics.world as unknown as { bodies: CANNON.Body[] }).bodies;
    const frontWallBodies = bodies.filter((b: CANNON.Body) => {
      return Math.abs(b.position.z - TOWER_RADIUS) < 0.2 && b.position.y > 2;
    });

    expect(frontWallBodies.length).toBeGreaterThan(0);
  });
});
