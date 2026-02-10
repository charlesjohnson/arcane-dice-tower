import './style.css';
import { SceneManager } from './scene/SceneManager';
import { PhysicsWorld } from './physics/PhysicsWorld';
import { buildTower } from './tower/TowerBuilder';
import { RollOrchestrator } from './roll/RollOrchestrator';
import type { DiceType } from './dice/DiceConfig';

const canvas = document.getElementById('scene') as HTMLCanvasElement;
const sceneManager = new SceneManager(canvas);
const physics = new PhysicsWorld();
const tower = buildTower(sceneManager.scene, physics);
const orchestrator = new RollOrchestrator(sceneManager.scene, physics, tower);

orchestrator.onStateChange((state, result) => {
  if (state === 'settled' && result) {
    console.log('Roll result:', result.dice.map((d) => `${d.type}=${d.value}`).join(', '));
    console.log('Total:', result.total);
  }
});

// Temporary: press space to roll 2d6 + 1d20
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && orchestrator.getState() !== 'rolling') {
    const dice: DiceType[] = ['d6', 'd6', 'd20'];
    orchestrator.roll(dice);
  }
});

function animate(): void {
  requestAnimationFrame(animate);
  const delta = sceneManager.getDelta();
  physics.step(delta);
  orchestrator.update(delta);
  sceneManager.render();
}

animate();
