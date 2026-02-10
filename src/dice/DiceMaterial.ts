import * as THREE from 'three';
import type { DiceType } from './DiceConfig';
import { DICE_CONFIGS } from './DiceConfig';

const CANVAS_SIZE = 256;

function createFaceTexture(value: number | string, _dieType: DiceType): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext('2d')!;

  // Dark obsidian background
  ctx.fillStyle = '#1a1025';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  // Glowing number
  const text = String(value);
  ctx.font = `bold ${CANVAS_SIZE * 0.4}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Outer glow
  ctx.shadowColor = '#8855ff';
  ctx.shadowBlur = 20;
  ctx.fillStyle = '#bb99ff';
  ctx.fillText(text, CANVAS_SIZE / 2, CANVAS_SIZE / 2);

  // Inner crisp text
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#e8ddf8';
  ctx.fillText(text, CANVAS_SIZE / 2, CANVAS_SIZE / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function createDiceMaterial(type: DiceType): THREE.Material | THREE.Material[] {
  const config = DICE_CONFIGS[type];

  if (type === 'd6') {
    // BoxGeometry uses 6 materials, one per face
    return config.faceValues.map((val) => {
      return new THREE.MeshStandardMaterial({
        map: createFaceTexture(val, type),
        roughness: 0.2,
        metalness: 0.1,
        emissive: new THREE.Color(0x221133),
        emissiveIntensity: 0.3,
      });
    });
  }

  // For polyhedra, use a single material with a composite texture
  return new THREE.MeshStandardMaterial({
    color: 0x1a1025,
    roughness: 0.2,
    metalness: 0.1,
    emissive: new THREE.Color(0x221133),
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.9,
  });
}
