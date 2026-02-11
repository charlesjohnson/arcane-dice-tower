# Batch Dice Rolling Design

## Problem

Too many dice in the tower at once causes physics congestion. Dice collide with each other in the narrow tower pathway, slowing or blocking progress.

## Solution

Introduce a configurable `MAX_CONCURRENT_DICE` limit (starting at 4). When rolling more dice than this limit, split them into batches. Each batch is dropped into the tower sequentially — the next batch only drops after the current batch has settled. All dice accumulate in the tray so the user sees the full set at the end.

## Data Model Changes (RollOrchestrator)

- `MAX_CONCURRENT_DICE = 4` — exported constant
- `pendingBatches: DiceType[][]` — queued batches waiting to drop
- `currentBatchBodies: CANNON.Body[]` — bodies from the in-flight batch, used for settlement detection
- `settleElapsed` resets to 0 when each new batch spawns
- Existing `dice: DieInstance[]` accumulates across all batches

## Flow

1. `roll(diceList)` splits into chunks of MAX_CONCURRENT_DICE. Spawns first chunk, queues rest.
2. `update()` syncs all meshes (all batches), but checks settlement only on `currentBatchBodies`.
3. When current batch settles:
   - If `pendingBatches` non-empty: spawn next batch, reset settle timer
   - If empty: read results from all accumulated dice, transition to 'settled'

## Settlement Detection

Check velocity and angular velocity directly on `currentBatchBodies` in the orchestrator rather than using `PhysicsWorld.areBodiesSettled()` (which checks all bodies including already-settled ones from prior batches).

## Spawn Position

Each batch computes spawn offsets relative to its own size (not the total dice count), so dice in each batch are properly spread within the tower opening.
