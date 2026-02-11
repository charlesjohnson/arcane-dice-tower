# Dice Remove Buttons Design

## Problem

The dice selector UI has no discoverable way to remove dice once added. The only mechanism is right-click (contextmenu), which is hidden and doesn't work on touch devices.

## Solution

Two new controls:

### Per-Type Minus Button
- Small "−" button on the top-left corner of each dice button
- Appears only when that die type's count > 0
- Clicking decrements count by 1; disappears when count reaches 0
- Styled as a small pill matching the count badge, with a muted red/pink tint

### Clear All Button
- "×" button at the right end of the dice selector bar, after the last dice button
- Visible only when at least one die is selected
- Clicking clears the entire selection and emits a change event
- Same muted red/pink styling as the minus buttons

### Unchanged Behavior
- Left-click to increment stays the same
- Right-click to decrement stays (not removed, just no longer the only way)
- Count badge remains at top-right of each dice button
