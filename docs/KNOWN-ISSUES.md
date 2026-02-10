# Known Critical Issues

Issues identified during final code review. All four are incomplete integrations — the code exists but isn't wired up or is missing logic.

---

## 1. D100 rolls as a single die instead of paired D10s

**Files:** `src/dice/DiceConfig.ts`, `src/roll/RollOrchestrator.ts`

The design spec says D100 should be "Two D10s (tens + units)." Currently only one die is spawned with `faceValues: [0, 10, 20, ..., 90]`, so D100 can only produce multiples of 10 — never values like 37 or 83.

**Fix:** When a D100 is requested, spawn two D10 bodies — one percentile (tens) and one units (1-10). Combine their results after settling. The RollOrchestrator needs to pair them during `readResults()`.

---

## ~~2. Missing tower-to-tray transition physics~~ (FIXED)

**File:** `src/tower/TowerBuilder.ts`

~~The tray floor sits at `z = TOWER_RADIUS + TRAY_DEPTH / 2` (in front of the tower), but there is no physics collider guiding dice from the tower interior bottom into the tray. Dice can fall through the gap between the tower base and the tray, or exit sideways through the open front.~~

**Resolution:** Added a sloped ramp (visual mesh + physics body) at the tower base. The ramp sits inside the tower, angled from y=1.0 at the back wall down to y=0.15 at the front opening, funneling dice forward into the tray.

---

## 3. Baffle impact effects defined but never triggered

**Files:** `src/effects/EffectsManager.ts` (has `baffleImpact()`), `src/main.ts` (never calls it)

The design spec requires particle bursts and rune flashes on baffle impacts. The `baffleImpact()` method is fully implemented but no collision event listener connects physics contacts to effects.

**Fix:** Add a Cannon-es collision event listener (`body.addEventListener('collide', ...)` on baffle bodies or `world.addEventListener('postStep', ...)`) in RollOrchestrator or main.ts. On contact, call `effects.baffleImpact(contactPoint)`.

---

## 4. Impact audio never played during rolls

**Files:** `src/audio/AudioManager.ts` (has `playImpact()`), `src/main.ts` (never calls it)

Same root cause as issue 3. The `playImpact()` method exists but no collision events trigger it. The design spec requires dice clatter on baffle impacts and felt thud on tray landing.

**Fix:** Wire up the same collision event listener from issue 3 to also call `audio.playImpact()`. Differentiate baffle hits from tray landings for different audio treatment.

---

## Important (Non-Critical) Issues

- **No UI to save new presets** — PresetsPanel can load/delete but has no "save" button
- **Preset loading clears dice selector** instead of populating it with preset dice
- **7 WebGL contexts for mini-dice** — at browser limit, will break on some mobile devices
- **Particle system GC pressure** — allocates Vector3 per particle per frame; use scratch vector
- **Portrait FOV not applied on initial load** — only triggers on resize event
- **`playAmbientHum()` creates unstoppable oscillator** — no stop reference retained
- **`innerHTML` with preset names** — minor XSS vector via localStorage
