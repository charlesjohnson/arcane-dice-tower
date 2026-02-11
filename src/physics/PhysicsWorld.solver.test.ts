import { describe, it, expect } from 'vitest';
import { GSSolver } from 'cannon-es';
import { PhysicsWorld } from './PhysicsWorld';

describe('PhysicsWorld solver', () => {
  it('uses at least 10 solver iterations to prevent tunneling through walls', () => {
    const pw = new PhysicsWorld();
    const { solver } = pw.world;
    if (!(solver instanceof GSSolver)) throw new Error('Expected GSSolver');
    expect(solver.iterations).toBeGreaterThanOrEqual(10);
  });
});
