// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import { RollOrchestrator, MAX_CONCURRENT_DICE } from './RollOrchestrator';
import type { RollResult } from './RollOrchestrator';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import type { Tower } from '../tower/TowerBuilder';
import type { DiceType } from '../dice/DiceConfig';

vi.mock('../dice/DiceMaterial', () => ({
  createDiceMaterial: () => new THREE.MeshStandardMaterial(),
}));

// --- Combination generation utilities ---

const DICE_TYPES: DiceType[] = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];

function physicalCost(type: DiceType): number {
  return type === 'd100' ? 2 : 1;
}

/**
 * Generate all multisets of dice types where total physical cost
 * is between 1 and maxSlots (d100 costs 2, all others cost 1).
 * Automatically adapts when MAX_CONCURRENT_DICE changes.
 */
function generateAllCombinations(maxSlots: number): DiceType[][] {
  const results: DiceType[][] = [];

  function recurse(startIdx: number, remaining: number, current: DiceType[]) {
    if (current.length > 0) {
      results.push([...current]);
    }
    if (remaining <= 0) return;

    for (let i = startIdx; i < DICE_TYPES.length; i++) {
      const cost = physicalCost(DICE_TYPES[i]);
      if (cost <= remaining) {
        current.push(DICE_TYPES[i]);
        recurse(i, remaining - cost, current);
        current.pop();
      }
    }
  }

  recurse(0, maxSlots, []);
  return results;
}

function formatCombo(combo: DiceType[]): string {
  const counts = new Map<DiceType, number>();
  for (const die of combo) {
    counts.set(die, (counts.get(die) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([type, count]) => `${count}${type}`)
    .join(' + ');
}

function physicalDiceCount(combo: DiceType[]): number {
  return combo.reduce((sum, type) => sum + physicalCost(type), 0);
}

// --- Test helpers ---

function createOrchestrator() {
  const physics = new PhysicsWorld();
  const scene = new THREE.Scene();
  const tower = { dropPosition: { x: 0, y: 9, z: 0 } } as Tower;
  const orchestrator = new RollOrchestrator(scene, physics, tower);
  return { orchestrator, scene, physics };
}

function zeroAllVelocities(physics: PhysicsWorld) {
  for (const body of physics.world.bodies) {
    body.velocity.setZero();
    body.angularVelocity.setZero();
  }
}

// --- Tests ---

const allCombinations = generateAllCombinations(MAX_CONCURRENT_DICE);

describe('Dice batch combination coverage', () => {
  it('every generated combo has physical cost between 1 and MAX_CONCURRENT_DICE', () => {
    expect(allCombinations.length).toBeGreaterThan(0);
    for (const combo of allCombinations) {
      const cost = physicalDiceCount(combo);
      expect(cost).toBeGreaterThanOrEqual(1);
      expect(cost).toBeLessThanOrEqual(MAX_CONCURRENT_DICE);
    }
  });

  it.each(
    allCombinations.map((combo) => [formatCombo(combo), combo] as const)
  )(
    '%s — rolls, settles, and produces correct results',
    (_label, combo) => {
      const { orchestrator, scene, physics } = createOrchestrator();
      const expectedPhysical = physicalDiceCount(combo);
      // d100 produces 1 logical result despite 2 physical dice
      const expectedLogical = combo.length;

      let capturedResult: RollResult | null = null;
      orchestrator.onStateChange((state, result) => {
        if (state === 'settled') capturedResult = result;
      });

      orchestrator.roll(combo);
      expect(orchestrator.getState()).toBe('rolling');

      // All physical dice fit in one batch since cost ≤ MAX_CONCURRENT_DICE
      expect(scene.children.length).toBe(expectedPhysical);

      // Settle the single batch
      zeroAllVelocities(physics);
      orchestrator.update(1.1);

      expect(orchestrator.getState()).toBe('settled');
      expect(capturedResult).not.toBeNull();
      expect(capturedResult!.dice.length).toBe(expectedLogical);
      expect(capturedResult!.total).toBeGreaterThanOrEqual(expectedLogical);
    },
  );
});
