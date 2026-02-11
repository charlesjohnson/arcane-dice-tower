import { describe, it, expect } from 'vitest';
import * as CANNON from 'cannon-es';
import { PhysicsWorld } from './PhysicsWorld';

describe('PhysicsWorld', () => {
  it('creates a world with downward gravity', () => {
    const pw = new PhysicsWorld();
    expect(pw.world.gravity.y).toBeLessThan(0);
  });

  it('steps the simulation forward', () => {
    const pw = new PhysicsWorld();
    const initialTime = pw.world.time;
    pw.step(1 / 60);
    expect(pw.world.time).toBeGreaterThan(initialTime);
  });

  it('detects when all bodies are settled', () => {
    const pw = new PhysicsWorld();
    // No bodies = settled
    expect(pw.areBodiesSettled()).toBe(true);
  });

  it('has default friction high enough to keep dice from sliding everywhere', () => {
    const pw = new PhysicsWorld();
    // Default friction is the fallback for contacts without a registered
    // ContactMaterial. Must be high enough to stop dice on flat surfaces
    // (tray floor, walls) but low-friction surfaces like ramps and baffles
    // use explicit ContactMaterials instead.
    expect(pw.world.defaultContactMaterial.friction).toBeGreaterThanOrEqual(0.2);
  });

  it('handles frame drops without losing physics steps', () => {
    const pw = new PhysicsWorld();

    // Drop a body and step with a 200ms frame hiccup
    const body = new CANNON.Body({ mass: 1, shape: new CANNON.Sphere(0.5) });
    body.position.set(0, 10, 0);
    pw.addDynamicBody(body);
    pw.step(0.2);

    // With proper sub-stepping (≥12 steps for 200ms at 1/60),
    // the body falls ~0.20 units under gravity.
    // With only 3 sub-steps it falls ~0.016 units.
    // Require at least 0.1 to ensure enough sub-steps are taken.
    const distanceFallen = 10 - body.position.y;
    expect(
      distanceFallen,
      `Body fell only ${distanceFallen.toFixed(4)} units in 200ms; physics is dropping sub-steps`
    ).toBeGreaterThan(0.1);
  });
});
