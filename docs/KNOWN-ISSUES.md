# Known Issues

Issues identified during code review. Status tracked inline.

---

## ~~1. D100 rolls as a single die instead of paired D10s~~ (FIXED)

**Files:** `src/dice/DiceConfig.ts`, `src/roll/RollOrchestrator.ts`

**Resolution:** D100 now spawns two D10 bodies (tens + units). RollOrchestrator pairs them during `readResults()`, with 00+0=100 per D&D convention.

---

## ~~2. Missing tower-to-tray transition physics~~ (FIXED)

**File:** `src/tower/TowerBuilder.ts`

**Resolution:** Added a sloped ramp (visual mesh + physics body) at the tower base. The ramp sits inside the tower, angled from y=1.0 at the back wall down to y=0.15 at the front opening, funneling dice forward into the tray.

---

## ~~3. Baffle impact effects defined but never triggered~~ (FIXED)

**Files:** `src/effects/EffectsManager.ts`, `src/main.ts`

**Resolution:** Collision event listeners on baffle bodies now trigger `effects.baffleImpact(contactPoint)` in main.ts.

---

## ~~4. Impact audio never played during rolls~~ (FIXED)

**Files:** `src/audio/AudioManager.ts`, `src/main.ts`

**Resolution:** Same collision event listeners from issue 3 also call `audio.playImpact()`. Tray floor collisions trigger a softer impact sound.

---

## Previous Non-Critical Issues (All Resolved)

- ~~No UI to save new presets~~ — Save button added to PresetsPanel
- ~~Preset loading clears dice selector~~ — Now populates selector with preset dice
- ~~7 WebGL contexts for mini-dice~~ — Consolidated to single shared renderer
- ~~Particle system GC pressure~~ — Uses scratch vector instead of per-frame allocation
- ~~Portrait FOV not applied on initial load~~ — FOV now set in constructor
- ~~`playAmbientHum()` creates unstoppable oscillator~~ — Now stores refs with stop method
- ~~`innerHTML` with preset names~~ — Replaced with textContent/createElement
