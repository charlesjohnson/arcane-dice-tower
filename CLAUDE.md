# Arcane Dice Tower

3D physics-driven dice tower PWA. Three.js rendering + cannon-es physics. Users pick polyhedral dice (d4-d100), roll through animated tower with baffles, see results with effects and sound.

## Commands

```
npm run dev                              # Dev server
npm run build                            # tsc && vite build
npx vitest run                           # All tests
npx vitest run src/path/to/File.test.ts  # Single test file
```

## Stack

Three.js 0.182, cannon-es 0.20, TypeScript 5.9 (strict), Vite 7.3 + PWA plugin, Vitest 4.0

Test environment: node by default, jsdom for `src/ui/**` (configured in vite.config.ts `test.environmentMatchGlobs`).

## Architecture

```
src/main.ts              — Wires all systems, animation loop, collision event listeners
src/dice/DiceConfig.ts   — DiceType union, DICE_CONFIGS record, face value arrays, D4 vertex data
src/dice/DiceGeometry.ts — Creates Three.js geometry per die type
src/dice/DiceMaterial.ts — Canvas-textured materials with face numbers
src/dice/DiceBody.ts     — cannon-es rigid bodies, mass/shape per type, random roll forces
src/dice/DiceResult.ts   — Reads upward face/vertex after settlement
src/roll/RollOrchestrator.ts — State machine (idle→rolling→settled), batch spawning, D100 pairing
src/physics/PhysicsWorld.ts  — cannon-es world wrapper, velocity thresholds for settlement
src/physics/BaffleSpin.ts    — Animated baffle rotation
src/tower/TowerBuilder.ts   — Tower walls, baffles, ramp, tray floor (visual + physics)
src/scene/SceneManager.ts   — Three.js scene, renderer, lighting
src/scene/CameraDirector.ts — Camera states: tracking dice, sweep between batches, tray view
src/scene/CameraTracker.ts  — Smooth camera follow logic
src/effects/EffectsManager.ts  — Baffle sparks, conjure effect, crit hit/fail effects
src/effects/ParticleSystem.ts  — Pool-based particle system (scratch vectors, no GC pressure)
src/effects/AmbientBackground.ts — Animated background
src/audio/AudioManager.ts   — Lazy-init Web Audio, impact/chime/crit sounds
src/ui/DiceSelector.ts      — Dice picker with mini 3D previews (shared WebGL renderer)
src/ui/DiceViewer.ts         — Full-size 3D die viewer (keyboard shortcut V to toggle)
src/ui/RollButton.ts         — Roll trigger button
src/ui/ResultsDisplay.ts     — Shows roll results, running subtotals for large rolls
src/ui/PresetsPanel.ts       — Save/load dice presets (localStorage)
src/ui/UIStyles.ts           — Injects all CSS dynamically
```

## Domain Rules

- **D100** = two physical D10 dice. First is "tens" (values 00-90), second is "units" (0-9). Combined: `tens + units`, except `00 + 0 = 100` (D&D convention). The tens die uses `DiceType='d100'`, units die uses `DiceType='d10'` with `d100Role` markers.
- **D4** result is read by upward vertex, not upward face (tetrahedra land on faces). Uses `findUpwardVertexIndex` + `D4_VERTEX_VALUES`.
- **All other dice** result is read by upward face normal. Uses `findUpwardFaceIndex` + `config.faceValues[faceIndex]`.
- **Settlement** = all dice velocity < `VELOCITY_THRESHOLD` and angular velocity < `ANGULAR_VELOCITY_THRESHOLD` for 1 second.
- **Batch rolling** = when >4 dice, they spawn in batches of MAX_CONCURRENT_DICE (4). Max 8 dice in tray; earlier dice are cleared and subtotaled.
- **Critical effects** trigger on d20 rolls: value 20 = crit hit, value 1 = crit fail.
- All UI is dynamically generated. No static HTML besides the canvas and ui-root container.

## Conventions

- Tests beside source: `Foo.ts` / `Foo.test.ts`
- UI tests need `@vitest-environment jsdom` comment directive at top of file
- Direct class instantiation over complex mocking
- No `index.ts` barrel files — import from specific modules

## Behavioral Rules

Do not assume. Do not hide confusion. Surface tradeoffs.

- State assumptions explicitly before implementing. If uncertain, ask.
- If multiple approaches exist, present them — do not pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- Minimum code that solves the problem. No speculative features, no unnecessary abstractions, no error handling for impossible scenarios.
- Surgical changes only. Touch only what is required. Do not "improve" adjacent code, comments, or formatting. Match existing style. Every changed line must trace to the request.
- Remove imports/variables/functions that YOUR changes made unused. Do not remove pre-existing dead code unless asked.
- Transform tasks into verifiable goals before starting. "Fix the bug" → "Write a test that reproduces it, then make it pass."

## TDD Required

Red-green-refactor for all changes. No production code without a failing test first. Run `npx vitest run` to verify before claiming done.

## Workflow Skills

Use these slash commands at the appropriate phase:

| Phase | Skill |
|---|---|
| Creative/new feature work | `/brainstorming` |
| Multi-step planning | `/writing-plans` |
| Executing a plan | `/executing-plans` |
| Feature/bugfix implementation | `/test-driven-development` |
| Bug investigation | `/systematic-debugging` |
| Before claiming done | `/verification-before-completion` |
| Feature complete | `/requesting-code-review` |
| Processing review feedback | `/receiving-code-review` |
| Integrating finished work | `/finishing-a-development-branch` (prefer PR over merge) |
| Independent parallel tasks | `/dispatching-parallel-agents` or `/subagent-driven-development` |
| Isolated feature branches | `/using-git-worktrees` |

## Compaction Guidance

When compacting context, always preserve: list of modified files, current test status (passing/failing), any pending verification steps, and the active task goal.
