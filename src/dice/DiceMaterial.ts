import * as THREE from 'three';
import type { DiceType } from './DiceConfig';
import { DICE_CONFIGS, D4_FACE_VERTEX_VALUES } from './DiceConfig';

const CANVAS_SIZE = 256;
const C = CANVAS_SIZE / 2; // center

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

// D4 triangle layout in canvas space (y-down). Circumradius matches DiceGeometry UV mapping.
const D4_CANVAS_R = 0.4 * CANVAS_SIZE; // 102.4 px
const D4_CANVAS_TOP = { x: C, y: C - D4_CANVAS_R };
const D4_CANVAS_BL = { x: C - D4_CANVAS_R * Math.sin(Math.PI / 3), y: C + D4_CANVAS_R * 0.5 };
const D4_CANVAS_BR = { x: C + D4_CANVAS_R * Math.sin(Math.PI / 3), y: C + D4_CANVAS_R * 0.5 };

// Number positions: 65% from center toward each vertex (canvas space)
const INSET = 0.65;
const D4_NUMBER_POSITIONS: { x: number; y: number; rotation: number }[] = [
  { // top vertex: upright
    x: C + (D4_CANVAS_TOP.x - C) * INSET,
    y: C + (D4_CANVAS_TOP.y - C) * INSET,
    rotation: 0,
  },
  { // bottom-left vertex: text "up" points toward BL
    x: C + (D4_CANVAS_BL.x - C) * INSET,
    y: C + (D4_CANVAS_BL.y - C) * INSET,
    rotation: -(2 * Math.PI) / 3,
  },
  { // bottom-right vertex: text "up" points toward BR
    x: C + (D4_CANVAS_BR.x - C) * INSET,
    y: C + (D4_CANVAS_BR.y - C) * INSET,
    rotation: (2 * Math.PI) / 3,
  },
];

function createD4FaceTexture(faceIndex: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext('2d')!;

  // Dark obsidian background
  ctx.fillStyle = '#1a1025';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  const values = D4_FACE_VERTEX_VALUES[faceIndex];
  const fontSize = CANVAS_SIZE * 0.22;
  ctx.font = `bold ${fontSize}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let i = 0; i < 3; i++) {
    const pos = D4_NUMBER_POSITIONS[i];
    const text = String(values[i]);

    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(pos.rotation);

    // Outer glow
    ctx.shadowColor = '#8855ff';
    ctx.shadowBlur = fontSize * 0.2;
    ctx.fillStyle = '#bb99ff';
    ctx.fillText(text, 0, 0);

    // Inner crisp text
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#e8ddf8';
    ctx.fillText(text, 0, 0);

    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.flipY = false;
  texture.needsUpdate = true;
  return texture;
}

export function createDiceMaterial(type: DiceType): THREE.Material | THREE.Material[] {
  const config = DICE_CONFIGS[type];

  if (type === 'd4') {
    return D4_FACE_VERTEX_VALUES.map((_, faceIndex) => {
      return new THREE.MeshStandardMaterial({
        map: createD4FaceTexture(faceIndex),
        roughness: 0.2,
        metalness: 0.1,
        emissive: new THREE.Color(0x442266),
        emissiveIntensity: 0.6,
      });
    });
  }

  // Create per-face materials with number textures for all other dice types
  return config.faceValues.map((val) => {
    return new THREE.MeshStandardMaterial({
      map: createFaceTexture(val, type),
      roughness: 0.2,
      metalness: 0.1,
      emissive: new THREE.Color(0x442266),
      emissiveIntensity: 0.6,
    });
  });
}
