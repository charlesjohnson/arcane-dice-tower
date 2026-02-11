# Dice Tray Overflow Design

## Problem

When the dice tray fills up, dice escape through walls into the world. Two issues:
1. No front tray wall; side/back walls too short (0.6 units vs 0.5-0.6 dice radii)
2. Big rolls accumulate all dice in the tray, exceeding its capacity

## Fix 1: Tray Containment

- Add front tray wall (visual + physics) at z=TOWER_RADIUS
- Increase all tray walls from 0.6 to 1.5 units tall
- Wall physics bodies match new dimensions

## Fix 2: Tray Overflow Clearing

- Before spawning each batch: if `currentDice + nextBatchSize > 8`, clear tray first
- Clear = read settled dice results, accumulate running subtotal, remove from scene/physics
- Fire `onSubtotalUpdate(subtotal)` callback so UI shows running counter
- `ResultsDisplay.showRunningTotal(total)` displays the accumulating number
- Final `show(result)` combines last batch results + accumulated subtotal

## Flow Example (20d6)

1. Batches 1-2 spawn and settle (8 dice)
2. Before batch 3: clear tray, show subtotal counter, spawn batch 3
3. Batches 3-4 settle (8 dice)
4. Before batch 5: clear tray, update counter, spawn batch 5
5. Batch 5 settles: show final results with grand total
