import { describe, it, expect } from 'vitest';
import { computeSpawnOffsetX } from './RollOrchestrator';
import { createDiceBody, applyRandomRollForce } from '../dice/DiceBody';

const TOWER_RADIUS = 1.5;

describe('Dice spawn position clamping', () => {
  it('clamps horizontal offset so all dice stay inside tower walls', () => {
    const maxDieRadius = 0.6;
    const maxAllowed = TOWER_RADIUS - maxDieRadius; // 0.9

    // With 5 dice, unclamped outermost offsets would be ±1.6
    for (const total of [1, 2, 3, 4, 5, 6, 8]) {
      for (let i = 0; i < total; i++) {
        const offsetX = computeSpawnOffsetX(i, total);
        expect(Math.abs(offsetX)).toBeLessThanOrEqual(maxAllowed + 0.1);
      }
    }
  });

  it('keeps final position within walls after random force is applied', () => {
    const maxDieRadius = 0.6;

    for (let trial = 0; trial < 50; trial++) {
      for (const total of [1, 3, 5]) {
        for (let i = 0; i < total; i++) {
          const body = createDiceBody('d20');
          const offsetX = computeSpawnOffsetX(i, total);
          body.position.set(offsetX, 9, 0);
          applyRandomRollForce(body);

          expect(Math.abs(body.position.x)).toBeLessThan(
            TOWER_RADIUS - maxDieRadius + 0.2
          );
        }
      }
    }
  });
});
