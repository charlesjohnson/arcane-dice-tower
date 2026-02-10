import { describe, it, expect } from 'vitest';
import { createDiceBody, applyRandomRollForce } from './DiceBody';

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
