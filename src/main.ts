// src/main.ts
import './style.css';
import { SceneManager } from './scene/SceneManager';
import { PhysicsWorld } from './physics/PhysicsWorld';
import { buildTower } from './tower/TowerBuilder';

const canvas = document.getElementById('scene') as HTMLCanvasElement;
const sceneManager = new SceneManager(canvas);
const physics = new PhysicsWorld();

buildTower(sceneManager.scene, physics);

function animate(): void {
  requestAnimationFrame(animate);
  const delta = sceneManager.getDelta();
  physics.step(delta);
  sceneManager.render();
}

animate();
