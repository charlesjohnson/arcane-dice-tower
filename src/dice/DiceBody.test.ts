import { describe, it, expect } from 'vitest';
import * as CANNON from 'cannon-es';
import { createDiceBody, applyRandomRollForce } from './DiceBody';

const TOWER_RADIUS = 1.5;

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

  it('biases Z offset toward back of tower (away from open front)', () => {
    // Over many samples the average Z offset should be negative (toward back wall),
    // not centered at zero, so dice fall toward the baffles rather than the open front.
    let totalZ = 0;
    const samples = 1000;

    for (let i = 0; i < samples; i++) {
      const body = createDiceBody('d6');
      body.position.set(0, 9, 0);
      applyRandomRollForce(body);
      totalZ += body.position.z;
    }

    const averageZ = totalZ / samples;
    expect(averageZ).toBeLessThan(0);
  });
});
