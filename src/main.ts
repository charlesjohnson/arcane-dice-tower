import './style.css';
import { SceneManager } from './scene/SceneManager.ts';
import { CameraDirector } from './scene/CameraDirector.ts';
import { PhysicsWorld } from './physics/PhysicsWorld.ts';
import { buildTower } from './tower/TowerBuilder.ts';
import { RollOrchestrator } from './roll/RollOrchestrator.ts';
import { EffectsManager } from './effects/EffectsManager.ts';
import { AmbientBackground } from './effects/AmbientBackground.ts';
import { AudioManager } from './audio/AudioManager.ts';
import { injectStyles } from './ui/UIStyles.ts';
import { DiceSelector } from './ui/DiceSelector.ts';
import { RollButton } from './ui/RollButton.ts';
import { ResultsDisplay } from './ui/ResultsDisplay.ts';
import { PresetsPanel } from './ui/PresetsPanel.ts';
import type { DiceType } from './dice/DiceConfig.ts';
import type { RollResult } from './roll/RollOrchestrator.ts';
import type { Preset } from './ui/PresetsPanel.ts';

// --- Initialize core systems ---
const canvas = document.getElementById('scene') as HTMLCanvasElement;
const sceneManager = new SceneManager(canvas);
const physics = new PhysicsWorld();
const tower = buildTower(sceneManager.scene, physics);
const orchestrator = new RollOrchestrator(sceneManager.scene, physics, tower);
const cameraDirector = new CameraDirector(sceneManager.camera);
const effects = new EffectsManager(sceneManager.scene, tower);
const ambientBackground = new AmbientBackground(sceneManager.scene);
const audio = new AudioManager();

// --- Initialize UI ---
injectStyles();
const uiRoot = document.getElementById('ui-root')!;
const diceSelector = new DiceSelector(uiRoot);
const resultsDisplay = new ResultsDisplay(uiRoot);
const presetsPanel = new PresetsPanel(uiRoot);

// --- Audio initialization on first interaction ---
let audioInitialized = false;
function ensureAudio(): void {
  if (!audioInitialized) {
    audio.initialize();
    audioInitialized = true;
  }
}

// --- Wire baffle impact effects and audio via collision events ---
import * as THREE from 'three';

for (const baffleBody of tower.baffleBodies) {
  baffleBody.addEventListener('collide', (event: { contact: { ri: { x: number; y: number; z: number } } }) => {
    const contactPoint = new THREE.Vector3(
      baffleBody.position.x + event.contact.ri.x,
      baffleBody.position.y + event.contact.ri.y,
      baffleBody.position.z + event.contact.ri.z
    );
    effects.baffleImpact(contactPoint);
    if (audioInitialized) audio.playImpact(0.8);
  });
}

tower.trayFloorBody.addEventListener('collide', () => {
  if (audioInitialized) audio.playImpact(0.5);
});

// --- Wire Roll Button ---
const rollButton = new RollButton(uiRoot, () => {
  ensureAudio();
  const dice = diceSelector.getSelectedDice();
  if (dice.length === 0) return;
  orchestrator.roll(dice);
});

// --- Wire orchestrator state changes ---
orchestrator.onStateChange((state: string, result: RollResult | null) => {
  if (state === 'rolling') {
    rollButton.setDisabled(true);
    resultsDisplay.hide();
    cameraDirector.playRollSequence(tower.dropPosition.y, tower.trayFloorY);
    effects.conjureDice(tower.dropPosition);
  } else if (state === 'settled' && result) {
    rollButton.setDisabled(false);
    resultsDisplay.show(result);

    // Play result chimes with staggered timing
    result.dice.forEach((_die, i) => {
      setTimeout(() => audio.playChime(1 + i * 0.1), i * 150);
    });

    // Check for crits on d20s
    for (const die of result.dice) {
      if (die.type === 'd20' && die.value === 20) {
        effects.criticalHit(tower.dropPosition);
        audio.playCritSuccess();
      } else if (die.type === 'd20' && die.value === 1) {
        effects.criticalFail(tower.dropPosition);
        audio.playCritFail();
      }
    }

    // Camera stays on tray for results; roll sequence handles pullback
  }
});

// --- Wire presets ---
presetsPanel.onPresetSelected((preset: Preset) => {
  diceSelector.clear();
  const dice: DiceType[] = [];
  for (const [type, count] of Object.entries(preset.dice)) {
    for (let i = 0; i < (count || 0); i++) {
      dice.push(type as DiceType);
    }
  }
  if (dice.length > 0) {
    ensureAudio();
    orchestrator.roll(dice);
  }
});

// --- Animation loop ---
let elapsed = 0;

function animate(): void {
  requestAnimationFrame(animate);
  const delta = sceneManager.getDelta();
  elapsed += delta;

  physics.step(delta);
  orchestrator.update(delta);
  cameraDirector.update(delta);
  effects.update(delta);
  ambientBackground.update(elapsed);
  diceSelector.updateMiniDice(elapsed);
  sceneManager.render();
}

animate();
