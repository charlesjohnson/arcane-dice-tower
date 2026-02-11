# Dice Viewer — Design

## Purpose

Debug/inspection overlay that lets you view any die type up close, auto-rotating to show all faces.

## Trigger

- Keys `1`–`7` map left-to-right: 1=d4, 2=d6, 3=d8, 4=d10, 5=d12, 6=d20, 7=d100
- Pressing a key opens the viewer for that die (or switches to it if already open)
- Pressing the same key again or `Escape` closes the viewer
- Viewer does not interfere with normal app usage when closed

## Overlay

- Full-screen dark semi-transparent backdrop (`rgba(0,0,0,0.85)`)
- Z-indexed above all other UI
- Contains its own `<canvas>` with dedicated Three.js renderer, scene, camera, and lighting
- Completely independent from the main scene

## Die Display

- Centered in viewport, scaled to ~60% of the smaller viewport dimension
- Uses the same `createDiceGeometry` + `createDiceMaterial` pipeline as the game
- Auto-rotates on two axes (Y + tilted X) at different speeds to tumble and show every face
- No manual orbit controls

## Lighting

- Similar purple/warm scheme as main scene, tuned for single-object viewing
- Key light, fill light, subtle ambient
- Dark background matching app aesthetic

## D100 Handling

- Shows a single d100 (tens) die, since the geometry is the same as d10 but with different face labels
