import * as THREE from 'three';
import type { DiceType } from './DiceConfig';
import { DICE_CONFIGS, formatFaceLabel } from './DiceConfig';

const CANVAS_SIZE = 256;

function createFaceTexture(value: number | string, dieType: DiceType): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext('2d')!;

  // Dark obsidian background
  ctx.fillStyle = '#1a1025';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  // Glowing number
  const text = String(value);
  const fontScale = DICE_CONFIGS[dieType].fontScale;
  ctx.font = `bold ${CANVAS_SIZE * fontScale}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Outer glow (scale blur with font size to avoid clipping on small faces)
  ctx.shadowColor = '#8855ff';
  ctx.shadowBlur = CANVAS_SIZE * fontScale * 0.2;
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

  // Create per-face materials with number textures for all dice types
  return config.faceValues.map((val) => {
    return new THREE.MeshStandardMaterial({
      map: createFaceTexture(formatFaceLabel(val, type), type),
      roughness: 0.2,
      metalness: 0.1,
      emissive: new THREE.Color(0x442266),
      emissiveIntensity: 0.6,
    });
  });
}
