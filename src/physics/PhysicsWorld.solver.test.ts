import { describe, it, expect } from 'vitest';
import { PhysicsWorld } from './PhysicsWorld';

describe('PhysicsWorld solver', () => {
  it('uses at least 10 solver iterations to prevent tunneling through walls', () => {
    const pw = new PhysicsWorld();
    const solver = pw.world.solver as { iterations: number };
    expect(solver.iterations).toBeGreaterThanOrEqual(10);
  });
});
