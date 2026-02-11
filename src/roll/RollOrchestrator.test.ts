// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import { computeSpawnOffsetX, RollOrchestrator, MAX_CONCURRENT_DICE } from './RollOrchestrator';
import type { RollResult } from './RollOrchestrator';
import { createDiceBody, applyRandomRollForce } from '../dice/DiceBody';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import type { Tower } from '../tower/TowerBuilder';

vi.mock('../dice/DiceMaterial', () => ({
  createDiceMaterial: () => new THREE.MeshStandardMaterial(),
}));

const TOWER_RADIUS = 2.0;

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
          body.position.set(offsetX, 8.5, 0);
          applyRandomRollForce(body);

          expect(Math.abs(body.position.x)).toBeLessThan(
            TOWER_RADIUS - maxDieRadius + 0.2
          );
        }
      }
    }
  });
});

function createOrchestrator() {
  const physics = new PhysicsWorld();
  const scene = new THREE.Scene();
  const tower = { dropPosition: { x: 0, y: 8.5, z: 0 } } as Tower;
  const orchestrator = new RollOrchestrator(scene, physics, tower);
  return { orchestrator, scene, physics };
}

function zeroAllVelocities(physics: PhysicsWorld) {
  for (const body of physics.world.bodies) {
    body.velocity.setZero();
    body.angularVelocity.setZero();
  }
}

describe('Batch dice rolling', () => {
  it('exports MAX_CONCURRENT_DICE as 4', () => {
    expect(MAX_CONCURRENT_DICE).toBe(4);
  });

  it('spawns only the first batch when rolling more than MAX_CONCURRENT_DICE', () => {
    const { orchestrator, scene } = createOrchestrator();
    const dice = Array(8).fill('d6') as import('../dice/DiceConfig').DiceType[];

    orchestrator.roll(dice);

    // Only first batch of 4 should be spawned
    expect(scene.children.length).toBe(MAX_CONCURRENT_DICE);
    expect(orchestrator.getState()).toBe('rolling');
  });

  it('spawns all dice immediately when at or below MAX_CONCURRENT_DICE', () => {
    const { orchestrator, scene } = createOrchestrator();
    const dice = Array(3).fill('d6') as import('../dice/DiceConfig').DiceType[];

    orchestrator.roll(dice);

    expect(scene.children.length).toBe(3);
  });

  it('spawns next batch after first batch settles, stays rolling', () => {
    const { orchestrator, scene, physics } = createOrchestrator();
    const dice = Array(8).fill('d6') as import('../dice/DiceConfig').DiceType[];

    orchestrator.onBatchReady(() => orchestrator.spawnNextBatch());
    orchestrator.roll(dice);
    expect(scene.children.length).toBe(4);

    // Settle the first batch
    zeroAllVelocities(physics);
    orchestrator.update(1.1);

    // Second batch should now be spawned (8 total in scene)
    expect(scene.children.length).toBe(8);
    // State should still be rolling (more dice to process)
    expect(orchestrator.getState()).toBe('rolling');
  });

  it('transitions to settled after final batch settles with all results', () => {
    const { orchestrator, physics } = createOrchestrator();
    const dice = Array(8).fill('d6') as import('../dice/DiceConfig').DiceType[];

    let capturedResult: RollResult | null = null;
    orchestrator.onStateChange((state, result) => {
      if (state === 'settled') capturedResult = result;
    });

    orchestrator.onBatchReady(() => orchestrator.spawnNextBatch());
    orchestrator.roll(dice);

    // Settle first batch
    zeroAllVelocities(physics);
    orchestrator.update(1.1);

    // Settle second batch
    zeroAllVelocities(physics);
    orchestrator.update(1.1);

    expect(orchestrator.getState()).toBe('settled');
    expect(capturedResult).not.toBeNull();
    expect(capturedResult!.dice.length).toBe(8);
  });

  it('includes maxTotal in roll result', () => {
    const { orchestrator, physics } = createOrchestrator();
    // 2d6: max is 6+6 = 12
    orchestrator.roll(['d6', 'd6']);

    let capturedResult: RollResult | null = null;
    orchestrator.onStateChange((state, result) => {
      if (state === 'settled') capturedResult = result;
    });

    zeroAllVelocities(physics);
    orchestrator.update(1.1);

    expect(orchestrator.getState()).toBe('settled');
    expect(capturedResult).not.toBeNull();
    expect(capturedResult!.maxTotal).toBe(12);
    expect(capturedResult!.total).toBeLessThanOrEqual(capturedResult!.maxTotal);
  });

  describe('Batch-aware position queries', () => {
    it('getCurrentBatchPositions returns only current batch positions', () => {
      const { orchestrator } = createOrchestrator();
      const dice = Array(6).fill('d6') as import('../dice/DiceConfig').DiceType[];

      orchestrator.roll(dice);

      // Only first batch (4 dice) is spawned
      const batchPositions = orchestrator.getCurrentBatchPositions();
      expect(batchPositions.length).toBe(4);
    });

    it('hasPendingBatches returns true when more batches remain', () => {
      const { orchestrator } = createOrchestrator();
      const dice = Array(8).fill('d6') as import('../dice/DiceConfig').DiceType[];

      orchestrator.roll(dice);
      expect(orchestrator.hasPendingBatches()).toBe(true);
    });

    it('hasPendingBatches returns false for single-batch rolls', () => {
      const { orchestrator } = createOrchestrator();
      const dice = Array(3).fill('d6') as import('../dice/DiceConfig').DiceType[];

      orchestrator.roll(dice);
      expect(orchestrator.hasPendingBatches()).toBe(false);
    });
  });

  describe('Batch-ready callback', () => {
    it('fires onBatchReady when a non-final batch settles', () => {
      const { orchestrator, physics } = createOrchestrator();
      const dice = Array(8).fill('d6') as import('../dice/DiceConfig').DiceType[];

      let batchReadyCalled = false;
      orchestrator.onBatchReady(() => { batchReadyCalled = true; });
      orchestrator.roll(dice);

      // Settle first batch
      zeroAllVelocities(physics);
      orchestrator.update(1.1);

      expect(batchReadyCalled).toBe(true);
      expect(orchestrator.getState()).toBe('rolling');
    });

    it('does not fire onBatchReady when final batch settles', () => {
      const { orchestrator, physics } = createOrchestrator();
      const dice = Array(3).fill('d6') as import('../dice/DiceConfig').DiceType[];

      let batchReadyCalled = false;
      orchestrator.onBatchReady(() => { batchReadyCalled = true; });
      orchestrator.roll(dice);

      // Settle the only batch
      zeroAllVelocities(physics);
      orchestrator.update(1.1);

      expect(batchReadyCalled).toBe(false);
      expect(orchestrator.getState()).toBe('settled');
    });

    it('pauses until spawnNextBatch is called externally', () => {
      const { orchestrator, scene, physics } = createOrchestrator();
      const dice = Array(8).fill('d6') as import('../dice/DiceConfig').DiceType[];

      orchestrator.onBatchReady(() => {
        // Don't call spawnNextBatch yet
      });
      orchestrator.roll(dice);
      expect(scene.children.length).toBe(4);

      // Settle first batch
      zeroAllVelocities(physics);
      orchestrator.update(1.1);

      // Still only 4 dice (paused)
      expect(scene.children.length).toBe(4);

      // Now externally trigger next batch
      orchestrator.spawnNextBatch();
      expect(scene.children.length).toBe(8);
    });

    it('fires onBatchReady only once per batch settlement', () => {
      const { orchestrator, physics } = createOrchestrator();
      const dice = Array(8).fill('d6') as import('../dice/DiceConfig').DiceType[];

      let callCount = 0;
      orchestrator.onBatchReady(() => { callCount++; });
      orchestrator.roll(dice);

      // Settle first batch
      zeroAllVelocities(physics);
      orchestrator.update(1.1);
      // Additional updates while waiting
      orchestrator.update(0.5);
      orchestrator.update(0.5);

      expect(callCount).toBe(1);
    });
  });

  it('resets settle timer between batches', () => {
    const { orchestrator, scene, physics } = createOrchestrator();
    const dice = Array(8).fill('d6') as import('../dice/DiceConfig').DiceType[];

    orchestrator.onBatchReady(() => orchestrator.spawnNextBatch());
    orchestrator.roll(dice);

    // Settle first batch
    zeroAllVelocities(physics);
    orchestrator.update(1.1);
    expect(scene.children.length).toBe(8);

    // Call update with small delta - should NOT settle yet (timer was reset)
    zeroAllVelocities(physics);
    orchestrator.update(0.5);
    expect(orchestrator.getState()).toBe('rolling');

    // After enough time passes, should settle
    orchestrator.update(0.6);
    expect(orchestrator.getState()).toBe('settled');
  });
});

describe('Tray overflow clearing', () => {
  it('clears tray when spawning next batch would exceed 8 dice', () => {
    const { orchestrator, scene, physics } = createOrchestrator();
    // 12 dice = 3 batches of 4. After batches 1+2 (8 dice), before batch 3 clear.
    const dice = Array(12).fill('d6') as import('../dice/DiceConfig').DiceType[];

    orchestrator.onBatchReady(() => orchestrator.spawnNextBatch());
    orchestrator.roll(dice);
    expect(scene.children.length).toBe(4); // batch 1

    // Settle batch 1
    zeroAllVelocities(physics);
    orchestrator.update(1.1);
    expect(scene.children.length).toBe(8); // batch 1 + batch 2

    // Settle batch 2 — should trigger clear before spawning batch 3
    zeroAllVelocities(physics);
    orchestrator.update(1.1);
    // After clear: 8 dice removed, 4 new spawned = 4 in scene
    expect(scene.children.length).toBe(4);
  });

  it('fires subtotal callback when clearing tray mid-roll', () => {
    const { orchestrator, physics } = createOrchestrator();
    const dice = Array(12).fill('d6') as import('../dice/DiceConfig').DiceType[];

    let subtotalValue: number | null = null;
    orchestrator.onSubtotalUpdate((subtotal: number) => {
      subtotalValue = subtotal;
    });

    orchestrator.onBatchReady(() => orchestrator.spawnNextBatch());
    orchestrator.roll(dice);

    // Settle batch 1
    zeroAllVelocities(physics);
    orchestrator.update(1.1);

    // Settle batch 2 — should fire subtotal
    zeroAllVelocities(physics);
    orchestrator.update(1.1);

    expect(subtotalValue).not.toBeNull();
    expect(subtotalValue).toBeGreaterThanOrEqual(0);
  });

  it('includes accumulated subtotal in final result total', () => {
    const { orchestrator, physics } = createOrchestrator();
    const dice = Array(12).fill('d6') as import('../dice/DiceConfig').DiceType[];

    let finalResult: RollResult | null = null;
    orchestrator.onStateChange((state, result) => {
      if (state === 'settled') finalResult = result;
    });

    let subtotalValue = 0;
    orchestrator.onSubtotalUpdate((subtotal: number) => {
      subtotalValue = subtotal;
    });

    orchestrator.onBatchReady(() => orchestrator.spawnNextBatch());
    orchestrator.roll(dice);

    // Settle batch 1
    zeroAllVelocities(physics);
    orchestrator.update(1.1);

    // Settle batch 2 — triggers clear
    zeroAllVelocities(physics);
    orchestrator.update(1.1);

    // Settle batch 3 — final
    zeroAllVelocities(physics);
    orchestrator.update(1.1);

    expect(finalResult).not.toBeNull();
    // Final result includes ALL dice (accumulated + last batch)
    expect(finalResult!.dice.length).toBe(12);
    // Total should equal sum of all dice values
    const allDiceTotal = finalResult!.dice.reduce((sum, d) => sum + d.value, 0);
    expect(finalResult!.total).toBe(allDiceTotal);
    // And the subtotal should be a portion of the grand total
    expect(subtotalValue).toBeGreaterThan(0);
    expect(subtotalValue).toBeLessThan(finalResult!.total);
  });

  it('does not clear tray when total dice would stay at or below 8', () => {
    const { orchestrator, scene, physics } = createOrchestrator();
    // 8 dice = 2 batches of 4. After batch 1 (4 dice), spawning 4 more = 8, no clear needed.
    const dice = Array(8).fill('d6') as import('../dice/DiceConfig').DiceType[];

    orchestrator.onBatchReady(() => orchestrator.spawnNextBatch());
    orchestrator.roll(dice);
    expect(scene.children.length).toBe(4);

    // Settle batch 1
    zeroAllVelocities(physics);
    orchestrator.update(1.1);
    // All 8 dice should be in scene — no clearing happened
    expect(scene.children.length).toBe(8);
  });

  it('resets subtotal between separate rolls', () => {
    const { orchestrator, physics } = createOrchestrator();
    const dice = Array(12).fill('d6') as import('../dice/DiceConfig').DiceType[];

    const subtotals: number[] = [];
    orchestrator.onSubtotalUpdate((subtotal: number) => {
      subtotals.push(subtotal);
    });

    orchestrator.onBatchReady(() => orchestrator.spawnNextBatch());
    // First roll
    orchestrator.roll(dice);
    zeroAllVelocities(physics);
    orchestrator.update(1.1);
    zeroAllVelocities(physics);
    orchestrator.update(1.1);
    zeroAllVelocities(physics);
    orchestrator.update(1.1);

    // Second roll — subtotal should start from 0
    orchestrator.roll(dice);
    zeroAllVelocities(physics);
    orchestrator.update(1.1);
    zeroAllVelocities(physics);
    orchestrator.update(1.1);
    zeroAllVelocities(physics);
    orchestrator.update(1.1);

    // Both rolls should have fired subtotal callbacks
    expect(subtotals.length).toBe(2);
  });
});

describe('D100 batch pairing', () => {
  it('never splits a D100 tens/units pair across batch boundaries', () => {
    const { orchestrator, scene } = createOrchestrator();
    // ['d6', 'd100', 'd100'] expands to:
    //   [d6, d100-tens, d10-units, d100-tens, d10-units]
    // Naive slicing at index 4 puts d100-tens in batch 1 without its d10-units.
    orchestrator.roll(['d6', 'd100', 'd100']);

    // First batch should be 3 (d6 + 1 complete d100 pair),
    // not 4 (which would orphan a tens die).
    const firstBatchSize = scene.children.length;
    expect(firstBatchSize).toBe(3);
  });

  it('produces correct D100 results in mixed rolls requiring batching', () => {
    const { orchestrator, physics } = createOrchestrator();
    let finalResult: RollResult | null = null;
    orchestrator.onStateChange((state, result) => {
      if (state === 'settled') finalResult = result;
    });
    orchestrator.onBatchReady(() => orchestrator.spawnNextBatch());
    // Mixed roll that forces batch split within a D100 pair
    orchestrator.roll(['d6', 'd100', 'd100']);

    // Settle all batches
    for (let i = 0; i < 5; i++) {
      zeroAllVelocities(physics);
      orchestrator.update(1.1);
    }

    expect(finalResult).not.toBeNull();
    // Should have 1 d6 + 2 d100 results
    expect(finalResult!.dice.length).toBe(3);
    const d100Results = finalResult!.dice.filter(d => d.type === 'd100');
    const d6Results = finalResult!.dice.filter(d => d.type === 'd6');
    expect(d100Results.length).toBe(2);
    expect(d6Results.length).toBe(1);
    for (const die of d100Results) {
      expect(die.value).toBeGreaterThanOrEqual(1);
      expect(die.value).toBeLessThanOrEqual(100);
    }
  });
});
