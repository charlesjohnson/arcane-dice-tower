import './style.css';
import { SceneManager } from './scene/SceneManager';

const canvas = document.getElementById('scene') as HTMLCanvasElement;
const sceneManager = new SceneManager(canvas);

// Temporary test cube to verify rendering
import * as THREE from 'three';
const testGeo = new THREE.BoxGeometry(1, 1, 1);
const testMat = new THREE.MeshStandardMaterial({ color: 0xaa88ff });
const testMesh = new THREE.Mesh(testGeo, testMat);
testMesh.position.set(0, 2, 0);
sceneManager.scene.add(testMesh);

function animate(): void {
  requestAnimationFrame(animate);
  const delta = sceneManager.getDelta();
  testMesh.rotation.y += delta * 0.5;
  sceneManager.render();
}

animate();
