# Resolved Issues Archive

All issues below are fixed. This file is historical reference only.

- D100 now spawns paired D10s (tens+units) with 00+0=100 convention — `DiceConfig.ts`, `RollOrchestrator.ts`
- Tower ramp funnels dice from tower base into tray — `TowerBuilder.ts`
- Baffle collision events trigger impact effects and audio — `main.ts`
- Preset save/load works correctly — `PresetsPanel.ts`
- Single shared WebGL renderer for mini-dice previews — `DiceSelector.ts`
- Particle system uses scratch vectors (no per-frame allocation) — `ParticleSystem.ts`
- Portrait FOV set in constructor — `SceneManager.ts`
- Audio oscillators properly tracked and stoppable — `AudioManager.ts`
- All user content uses textContent/createElement (no innerHTML) — `PresetsPanel.ts`
