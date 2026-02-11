import { describe, it, expect } from 'vitest';
import * as CANNON from 'cannon-es';
import { createDiceBody, applyRandomRollForce } from './DiceBody';
import { DICE_CONFIGS } from './DiceConfig';

describe('createDiceBody', () => {
  it('uses a ConvexPolyhedron for d4, not a sphere', () => {
    const body = createDiceBody('d4');
    const shape = body.shapes[0];

    // A sphere approximation causes the d4 to float above surfaces
    // because the tetrahedron inradius is only 1/3 of the circumradius.
    // The d4 must use a shape that matches its tetrahedron geometry.
    expect(shape).not.toBeInstanceOf(CANNON.Sphere);
    expect(shape).toBeInstanceOf(CANNON.ConvexPolyhedron);
  });

  it('d4 ConvexPolyhedron has 4 vertices and 4 faces', () => {
    const body = createDiceBody('d4');
    const shape = body.shapes[0] as CANNON.ConvexPolyhedron;

    expect(shape.vertices).toHaveLength(4);
    expect(shape.faces).toHaveLength(4);
  });

  it('d4 vertices lie at the configured radius from the origin', () => {
    const body = createDiceBody('d4');
    const shape = body.shapes[0] as CANNON.ConvexPolyhedron;
    const expectedRadius = DICE_CONFIGS.d4.radius;

    for (const v of shape.vertices) {
      const dist = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
      expect(dist).toBeCloseTo(expectedRadius, 4);
    }
  });
});

describe('applyRandomRollForce', () => {
  it('keeps position offset within tower walls over many random samples', () => {
    // Run many iterations to cover the random range.
    // The die starts at the tower center (0, 9, 0).
    // After applyRandomRollForce, position.x and position.z must stay
    // well inside the tower walls at ±TOWER_RADIUS.
    // We use a generous margin: die radius (0.6) + buffer means the
    // offset alone should be < 0.8 in either axis.
    const maxAllowedOffset = 0.8;

    for (let i = 0; i < 500; i++) {
      const body = createDiceBody('d20');
      body.position.set(0, 9, 0);
      applyRandomRollForce(body);

      expect(Math.abs(body.position.x)).toBeLessThan(maxAllowedOffset);
      expect(Math.abs(body.position.z)).toBeLessThan(maxAllowedOffset);
    }
  });

  it('centers Z offset so dice spawn inside the tower, not biased to the back', () => {
    // The Z offset should be symmetric around zero, just like the X offset,
    // so dice don't get pushed toward (and behind) the back wall.
    let totalZ = 0;
    const samples = 2000;

    for (let i = 0; i < samples; i++) {
      const body = createDiceBody('d6');
      body.position.set(0, 9, 0);
      applyRandomRollForce(body);
      totalZ += body.position.z;
    }

    const averageZ = totalZ / samples;
    // Average should be close to zero (no bias), not strongly negative.
    expect(Math.abs(averageZ)).toBeLessThan(0.05);
  });
});
