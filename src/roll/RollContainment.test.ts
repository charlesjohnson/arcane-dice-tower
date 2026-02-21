import { describe, it, expect, vi, beforeAll } from 'vitest';
import * as THREE from 'three';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { buildTower } from '../tower/TowerBuilder';
import { RollOrchestrator, MAX_CONCURRENT_DICE } from './RollOrchestrator';
import type { DiceType } from '../dice/DiceConfig';

vi.mock('../dice/DiceMaterial', () => ({
  createDiceMaterial: () => new THREE.MeshStandardMaterial(),
}));

const TOWER_RADIUS = 2.0;
const COLLISION_WALL_HALF = 0.5;
const TRAY_DEPTH = 2.5;

const ALL_TYPES: DiceType[] = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];

function mulberry32(seed: number): () => number {
  return () => {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

interface ContainmentResult {
  escaped: boolean;
  escapeDetail: string;
  allRemainingInTray: boolean;
  trayDetail: string;
  settled: boolean;
  batchClears: number;
}

function testContainment(combo: DiceType[], seed: number): ContainmentResult {
  const rng = mulberry32(seed);
  const origRandom = Math.random;
  Math.random = rng;
  try {
    const scene = new THREE.Scene();
    const physics = new PhysicsWorld();
    const tower = buildTower(scene, physics);
    const orchestrator = new RollOrchestrator(scene, physics, tower);

    let batchClears = 0;
    orchestrator.onSubtotalUpdate(() => { batchClears++; });
    orchestrator.onBatchReady(() => orchestrator.spawnNextBatch());
    orchestrator.roll(combo);

    const sideBound = TOWER_RADIUS + COLLISION_WALL_HALF + 0.5;
    const backBound = -(TOWER_RADIUS + COLLISION_WALL_HALF + 0.5);
    const frontBound = TOWER_RADIUS + TRAY_DEPTH + 1.0;
    const floorBound = -1;

    let escaped = false;
    let escapeDetail = '';

    // Scale simulation time with expected batch count (d100 expands to 2 physical dice)
    const physicalCount = combo.reduce((n, t) => n + (t === 'd100' ? 2 : 1), 0);
    const expectedBatches = Math.ceil(physicalCount / MAX_CONCURRENT_DICE);
    const maxSteps = 1800 * expectedBatches;
    for (let step = 0; step < maxSteps && !escaped; step++) {
      physics.step(1 / 60);
      orchestrator.update(1 / 60);

      for (const body of physics.world.bodies) {
        if (body.mass === 0) continue;
        const { x, y, z } = body.position;

        if (Math.abs(x) > sideBound) {
          escaped = true;
          escapeDetail = `Side escape at step ${step}: x=${x.toFixed(2)}, y=${y.toFixed(2)}, z=${z.toFixed(2)}`;
          break;
        }
        if (y < floorBound) {
          escaped = true;
          escapeDetail = `Floor escape at step ${step}: x=${x.toFixed(2)}, y=${y.toFixed(2)}, z=${z.toFixed(2)}`;
          break;
        }
        if (z < backBound) {
          escaped = true;
          escapeDetail = `Back escape at step ${step}: x=${x.toFixed(2)}, y=${y.toFixed(2)}, z=${z.toFixed(2)}`;
          break;
        }
        if (z > frontBound) {
          escaped = true;
          escapeDetail = `Front escape at step ${step}: x=${x.toFixed(2)}, y=${y.toFixed(2)}, z=${z.toFixed(2)}`;
          break;
        }
      }

      if (orchestrator.getState() === 'settled') break;
    }

    // Only the final batch's dice remain in the physics world (earlier batches are cleared)
    const dynamicBodies = physics.world.bodies.filter(b => b.mass > 0);
    const notInTray = dynamicBodies.filter(b => {
      // z > TOWER_RADIUS - 1.0: includes dice resting on the ramp at the tower-tray transition
      const inTray = b.position.z > TOWER_RADIUS - 1.0 && b.position.y < 1.5 && b.position.y > -0.5;
      return !inTray;
    });
    const allRemainingInTray = notInTray.length === 0;
    const trayDetail = notInTray.length > 0
      ? `${notInTray.length} dice not in tray: ` +
        notInTray.map(b =>
          `(${b.position.x.toFixed(2)}, ${b.position.y.toFixed(2)}, ${b.position.z.toFixed(2)})`
        ).join(', ')
      : '';

    return {
      escaped,
      escapeDetail,
      allRemainingInTray,
      trayDetail,
      settled: orchestrator.getState() === 'settled',
      batchClears,
    };
  } finally {
    Math.random = origRandom;
  }
}

for (const base of ALL_TYPES) {
  for (const variant of ALL_TYPES) {
    const combo: DiceType[] = [base, base, base, variant];
    const seed = ALL_TYPES.indexOf(base) * 7 + ALL_TYPES.indexOf(variant) + 42;
    const label = `[${combo.join(', ')}]`;

    describe(`Containment: ${label}`, { timeout: 30_000 }, () => {
      let result: ContainmentResult;

      beforeAll(() => {
        result = testContainment(combo, seed);
      });

      it('all dice stay inside the tower walls', () => {
        expect(result.escaped, result.escapeDetail).toBe(false);
      });

      it('remaining dice finish in the tray', () => {
        expect(result.settled, 'orchestrator did not reach settled state').toBe(true);
        expect(result.allRemainingInTray, result.trayDetail).toBe(true);
      });
    });
  }
}

// Multi-batch tests: verify batch clearing behavior with >4 dice
// d100 expands to 2 physical dice each, so use 4 to get 8 physical dice (2 batches)
const MULTI_BATCH_COMBOS: { label: string; dice: DiceType[]; seed: number }[] = ALL_TYPES.map((type, i) => {
  const count = type === 'd100' ? 4 : 8;
  return {
    label: `${count}×${type}`,
    dice: Array(count).fill(type) as DiceType[],
    seed: i * 13 + 99,
  };
});

for (const { label, dice, seed } of MULTI_BATCH_COMBOS) {
  describe(`Multi-batch containment: ${label}`, { timeout: 60_000 }, () => {
    let result: ContainmentResult;

    beforeAll(() => {
      result = testContainment(dice, seed);
    });

    it('all dice stay inside the tower walls', () => {
      expect(result.escaped, result.escapeDetail).toBe(false);
    });

    it('settled batches are cleared from the tray', () => {
      expect(result.batchClears).toBeGreaterThan(0);
    });

    it('final batch dice finish in the tray', () => {
      expect(result.settled, 'orchestrator did not reach settled state').toBe(true);
      expect(result.allRemainingInTray, result.trayDetail).toBe(true);
    });
  });
}
