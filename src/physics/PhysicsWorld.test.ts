import { describe, it, expect } from 'vitest';
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
});
