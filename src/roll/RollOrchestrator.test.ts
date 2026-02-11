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

  it('resets settle timer between batches', () => {
    const { orchestrator, scene, physics } = createOrchestrator();
    const dice = Array(8).fill('d6') as import('../dice/DiceConfig').DiceType[];

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
