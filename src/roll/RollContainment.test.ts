import { describe, it, expect, vi, beforeAll } from 'vitest';
import * as THREE from 'three';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { buildTower } from '../tower/TowerBuilder';
import { RollOrchestrator } from './RollOrchestrator';
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
  allInTray: boolean;
  trayDetail: string;
  settled: boolean;
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

    orchestrator.onBatchReady(() => orchestrator.spawnNextBatch());
    orchestrator.roll(combo);

    let escaped = false;
    let escapeDetail = '';

    const maxSteps = 1800;
    for (let step = 0; step < maxSteps; step++) {
      physics.step(1 / 60);
      orchestrator.update(1 / 60);

      for (const body of physics.world.bodies.filter(b => b.mass > 0)) {
        const x = body.position.x;
        const y = body.position.y;
        const z = body.position.z;

        if (Math.abs(x) > 3.0) {
          escaped = true;
          escapeDetail = `Side escape at step ${step}: x=${x.toFixed(2)}, y=${y.toFixed(2)}, z=${z.toFixed(2)}`;
        }
        if (y < -1) {
          escaped = true;
          escapeDetail = `Floor escape at step ${step}: x=${x.toFixed(2)}, y=${y.toFixed(2)}, z=${z.toFixed(2)}`;
        }
        if (z < -3.0) {
          escaped = true;
          escapeDetail = `Back escape at step ${step}: x=${x.toFixed(2)}, y=${y.toFixed(2)}, z=${z.toFixed(2)}`;
        }
        if (z > 5.5) {
          escaped = true;
          escapeDetail = `Front escape at step ${step}: x=${x.toFixed(2)}, y=${y.toFixed(2)}, z=${z.toFixed(2)}`;
        }
      }

      if (orchestrator.getState() === 'settled') break;
    }

    let allInTray = true;
    let trayDetail = '';
    for (const body of physics.world.bodies.filter(b => b.mass > 0)) {
      const z = body.position.z;
      const y = body.position.y;
      if (!(z > 1.5 && y < 1.5 && y > -0.5)) {
        allInTray = false;
        trayDetail = `Body not in tray: x=${body.position.x.toFixed(2)}, y=${y.toFixed(2)}, z=${z.toFixed(2)}`;
      }
    }

    return {
      escaped,
      escapeDetail,
      allInTray,
      trayDetail,
      settled: orchestrator.getState() === 'settled',
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

      it('all dice finish in the tray', () => {
        expect(result.settled, 'orchestrator did not reach settled state').toBe(true);
        expect(result.allInTray, result.trayDetail).toBe(true);
      });
    });
  }
}
