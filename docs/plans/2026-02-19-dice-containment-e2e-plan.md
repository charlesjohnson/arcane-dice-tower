# Dice Containment E2E Tests Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add E2E tests verifying all dice stay inside the tower and finish in the tray when rolled through the RollOrchestrator, across all 49 type combinations. Then fix production code until all tests pass.

**Architecture:** A 7×7 matrix of dice combos (3 base + 1 variant) exercises `RollOrchestrator.roll()` with real tower physics. Per-frame position checks catch wall escapes; post-settlement checks verify tray arrival. Seeded PRNG ensures reproducibility.

**Tech Stack:** Vitest, Three.js, cannon-es, RollOrchestrator, PhysicsWorld, TowerBuilder

---

### Task 1: Write the E2E containment test

**Files:**
- Create: `src/roll/RollContainment.test.ts`
- Reference: `src/roll/RollOrchestrator.ts`, `src/tower/TowerBuilder.ts`, `src/dice/DiceBody.ts`

**Step 1: Write the test file**

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import * as THREE from 'three';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { buildTower } from '../tower/TowerBuilder';
import { RollOrchestrator } from './RollOrchestrator';
import type { DiceType } from '../dice/DiceConfig';
import { DICE_CONFIGS } from '../dice/DiceConfig';

// Mock canvas-based material creation (needs DOM; geometry is pure math)
vi.mock('../dice/DiceMaterial', () => ({
  createDiceMaterial: () => new THREE.MeshStandardMaterial(),
}));

const TOWER_RADIUS = 2.0;
const COLLISION_WALL_HALF = 0.5;
const TRAY_DEPTH = 2.5;
const ALL_TYPES: DiceType[] = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];

// Mulberry32 seedable PRNG for reproducible random forces
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

    // Generous escape bounds — well outside any valid position
    const sideBound = TOWER_RADIUS + COLLISION_WALL_HALF + 0.5;   // 3.0
    const backBound = -(TOWER_RADIUS + COLLISION_WALL_HALF + 0.5); // -3.0
    const frontBound = TOWER_RADIUS + TRAY_DEPTH + 1.0;            // 5.5
    const floorBound = -1;

    let escaped = false;
    let escapeDetail = '';

    const maxSteps = 1800; // 30 seconds at 60fps
    const dt = 1 / 60;

    for (let step = 0; step < maxSteps; step++) {
      physics.step(dt);
      orchestrator.update(dt);

      // Check all dynamic bodies each frame
      for (const body of physics.world.bodies) {
        if (body.mass === 0) continue;

        const { x, y, z } = body.position;
        if (Math.abs(x) > sideBound) {
          escaped = true;
          escapeDetail = `Side escape: x=${x.toFixed(2)} at step ${step}`;
        }
        if (y < floorBound) {
          escaped = true;
          escapeDetail = `Floor escape: y=${y.toFixed(2)} at step ${step}`;
        }
        if (z < backBound) {
          escaped = true;
          escapeDetail = `Back escape: z=${z.toFixed(2)} at step ${step}`;
        }
        if (z > frontBound) {
          escaped = true;
          escapeDetail = `Front escape: z=${z.toFixed(2)} at step ${step}`;
        }
      }

      if (orchestrator.getState() === 'settled') break;
    }

    // Check final positions — all remaining dynamic bodies should be in tray
    const dynamicBodies = physics.world.bodies.filter(b => b.mass > 0);
    const notInTray = dynamicBodies.filter(b => {
      const inTray = b.position.z > TOWER_RADIUS - 0.5 && b.position.y < 1.5 && b.position.y > -0.5;
      return !inTray;
    });

    const allInTray = notInTray.length === 0;
    const trayDetail = notInTray.length > 0
      ? `${notInTray.length} dice not in tray: ` +
        notInTray.map(b =>
          `(${b.position.x.toFixed(2)}, ${b.position.y.toFixed(2)}, ${b.position.z.toFixed(2)})`
        ).join(', ')
      : '';

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
    const label = `${DICE_CONFIGS[base].label}×3 + ${DICE_CONFIGS[variant].label}`;
    const seed = ALL_TYPES.indexOf(base) * 7 + ALL_TYPES.indexOf(variant) + 42;

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
```

**Step 2: Run the tests**

Run: `npx vitest run src/roll/RollContainment.test.ts`
Expected: Tests run; some may fail if dice escape (that's what we're testing for).

**Step 3: Commit the test**

```bash
git add src/roll/RollContainment.test.ts
git commit -m "test: add E2E dice containment tests for all 49 type combinations"
```

### Task 2: Fix containment failures

This task is iterative. Repeat until all tests pass.

**Step 1: Analyze failures**

Look at the test output. Categorize failures:
- **Side escape** (`|x| > 3.0`): spawn offset or wall issue
- **Floor escape** (`y < -1`): missing floor or tunneling
- **Front/back escape**: front wall gap or missing wall
- **Not in tray**: die stuck on baffle/ramp or never reached tray

**Step 2: Fix root cause**

Likely candidates (investigate in this order):
1. `applyRandomRollForce` in `src/dice/DiceBody.ts` — position jitter may push dice too close to walls at spawn. Reduce jitter range or clamp final position.
2. Front wall in `src/tower/TowerBuilder.ts` — the gap below y=2.5 may let dice escape forward. Consider lowering the front wall or adding a guard.
3. Wall thickness in `src/tower/TowerBuilder.ts` — if dice tunnel through walls at high velocity.
4. Baffle geometry — if dice get stuck between baffles and walls.

**Step 3: Re-run containment tests**

Run: `npx vitest run src/roll/RollContainment.test.ts`
Repeat from Step 1 if failures remain.

**Step 4: Run full test suite**

Run: `npx vitest run`
Verify no regressions.

**Step 5: Commit fixes**

```bash
git add <changed files>
git commit -m "fix: ensure dice stay inside tower and reach tray for all type combinations"
```

### Task 3: Final verification

**Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass, including the 98 new containment assertions.

**Step 2: Verify test count**

The new file should contribute 49 describes × 2 its = 98 test cases.
