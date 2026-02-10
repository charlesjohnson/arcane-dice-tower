import * as THREE from 'three';
import type { DiceType } from './DiceConfig';
import { DICE_CONFIGS } from './DiceConfig';

export function createDiceGeometry(type: DiceType): THREE.BufferGeometry {
  const config = DICE_CONFIGS[type];
  const r = config.radius;

  switch (type) {
    case 'd4':
      return new THREE.TetrahedronGeometry(r);
    case 'd6':
      return new THREE.BoxGeometry(r * 1.2, r * 1.2, r * 1.2);
    case 'd8':
      return new THREE.OctahedronGeometry(r);
    case 'd10':
    case 'd100':
      return createD10Geometry(r);
    case 'd12':
      return new THREE.DodecahedronGeometry(r);
    case 'd20':
      return new THREE.IcosahedronGeometry(r);
  }
}

function createD10Geometry(radius: number): THREE.BufferGeometry {
  // Pentagonal trapezohedron: 12 vertices, 10 kite faces (20 triangles)
  const vertices: number[] = [];
  const indices: number[] = [];

  // Top and bottom apex
  vertices.push(0, radius, 0); // index 0: top
  vertices.push(0, -radius, 0); // index 1: bottom

  // 10 middle vertices in a zigzag ring
  const heightOffset = radius * 0.105;
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI * 2) / 10;
    const y = heightOffset * (i % 2 === 0 ? 1 : -1);
    vertices.push(
      Math.cos(angle) * radius,
      y,
      Math.sin(angle) * radius
    );
  }

  // Build faces: each kite = 2 triangles
  for (let i = 0; i < 10; i++) {
    const curr = i + 2;
    const next = ((i + 1) % 10) + 2;

    if (i % 2 === 0) {
      indices.push(0, curr, next);
      indices.push(curr, 1, next);
    } else {
      indices.push(curr, 0, next);
      indices.push(1, curr, next);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(vertices, 3)
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
