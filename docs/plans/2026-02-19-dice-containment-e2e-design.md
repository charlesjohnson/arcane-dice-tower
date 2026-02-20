# Dice Containment E2E Tests

## Problem

Users report dice flying outside the tower during rolls. Existing E2E tests in `TowerBuilder.test.ts` drop bare `CANNON.Body` objects with controlled angular velocities. They don't exercise the `RollOrchestrator` spawn path, which applies `applyRandomRollForce()` (random angular velocity up to +/-10 rad/s, random position jitter up to +/-0.15 per axis).

## Solution

Add `src/roll/RollContainment.test.ts` that uses `RollOrchestrator.roll()` with a real tower and physics world.

### Test Matrix

7 dice types x 7 = 49 combinations. Each combo is 3 of a "base" type + 1 "variant":

```
[d4,d4,d4,d4], [d4,d4,d4,d6], ..., [d4,d4,d4,d100]
[d6,d6,d6,d4], [d6,d6,d6,d6], ..., [d6,d6,d6,d100]
...
[d100,d100,d100,d4], ..., [d100,d100,d100,d100]
```

D100 expands to 2 physical dice (tens + units), so combos with d100 create multi-batch scenarios naturally.

### Assertions

1. **Tower containment**: Every physics frame, no die has |x| beyond wall inner edge, y < -2, or escapes the tower front.
2. **Tray finish**: After settlement, every die is in the tray (z > TOWER_RADIUS - 0.5, y < 1.5).

### Determinism

Seed `Math.random` before each test so failures are reproducible while forces remain realistic.

### Test Infrastructure

- Build real tower with `buildTower()` + `PhysicsWorld`
- Use `RollOrchestrator.roll()` for production spawn path
- Wire `onBatchReady` to `spawnNextBatch()` for multi-batch combos
- Step physics manually, checking positions each frame
- Track all die bodies via `physics.world.bodies` (dynamic only)

### Fixing Failures

After tests are written, iterate on production code until all 49 combos pass. Likely fixes:
- Position jitter bounds in `applyRandomRollForce`
- Wall thickness or placement
- Front wall coverage
