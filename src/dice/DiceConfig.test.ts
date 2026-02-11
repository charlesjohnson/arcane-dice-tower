import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { DICE_CONFIGS, getMaxValue } from './DiceConfig';
import type { DiceType } from './DiceConfig';

describe('DiceConfig', () => {
  it('defines all 7 standard dice types', () => {
    const types: DiceType[] = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];
    for (const t of types) {
      expect(DICE_CONFIGS[t]).toBeDefined();
    }
  });

  it('has correct face counts', () => {
    expect(DICE_CONFIGS.d4.faceCount).toBe(4);
    expect(DICE_CONFIGS.d6.faceCount).toBe(6);
    expect(DICE_CONFIGS.d8.faceCount).toBe(8);
    expect(DICE_CONFIGS.d10.faceCount).toBe(10);
    expect(DICE_CONFIGS.d12.faceCount).toBe(12);
    expect(DICE_CONFIGS.d20.faceCount).toBe(20);
    expect(DICE_CONFIGS.d100.faceCount).toBe(10);
  });

  it('d100 is flagged as percentile', () => {
    expect(DICE_CONFIGS.d100.isPercentile).toBe(true);
    expect(DICE_CONFIGS.d20.isPercentile).toBeUndefined();
  });

  it('each die has mass and size', () => {
    for (const key of Object.keys(DICE_CONFIGS)) {
      const cfg = DICE_CONFIGS[key as DiceType];
      expect(cfg.mass).toBeGreaterThan(0);
      expect(cfg.radius).toBeGreaterThan(0);
    }
  });

  it('getMaxValue returns correct max for each die type', () => {
    expect(getMaxValue('d4')).toBe(4);
    expect(getMaxValue('d6')).toBe(6);
    expect(getMaxValue('d8')).toBe(8);
    expect(getMaxValue('d10')).toBe(9);
    expect(getMaxValue('d12')).toBe(12);
    expect(getMaxValue('d20')).toBe(20);
    expect(getMaxValue('d100')).toBe(100);
  });

  it('d12 opposite faces sum to 13 (standard D12 convention)', () => {
    // Compute face normals from DodecahedronGeometry to determine which faces are opposite
    const geom = new THREE.DodecahedronGeometry(DICE_CONFIGS.d12.radius);
    const posAttr = geom.getAttribute('position');
    const faceCount = 12;
    const verticesPerFace = posAttr.count / faceCount;

    const faceNormals: THREE.Vector3[] = [];
    for (let face = 0; face < faceCount; face++) {
      const start = face * verticesPerFace;
      const faceVertices: THREE.Vector3[] = [];
      for (let v = 0; v < verticesPerFace; v++) {
        faceVertices.push(new THREE.Vector3().fromBufferAttribute(posAttr, start + v));
      }
      const normal = new THREE.Vector3();
      for (let t = 0; t < verticesPerFace; t += 3) {
        const e1 = new THREE.Vector3().subVectors(faceVertices[t + 1], faceVertices[t]);
        const e2 = new THREE.Vector3().subVectors(faceVertices[t + 2], faceVertices[t]);
        normal.add(new THREE.Vector3().crossVectors(e1, e2));
      }
      normal.normalize();
      faceNormals.push(normal);
    }

    // Find opposite face pairs (normals pointing in opposite directions)
    const { faceValues } = DICE_CONFIGS.d12;
    for (let i = 0; i < faceCount; i++) {
      for (let j = i + 1; j < faceCount; j++) {
        const dot = faceNormals[i].dot(faceNormals[j]);
        if (dot < -0.99) {
          // Faces i and j are opposite — their values must sum to 13
          expect(faceValues[i] + faceValues[j]).toBe(13);
        }
      }
    }
  });

  it('d12 face 12 is adjacent to faces 3, 8, 7, 9, 11 (matching reference net)', () => {
    // Build adjacency from DodecahedronGeometry face centers
    const geom = new THREE.DodecahedronGeometry(DICE_CONFIGS.d12.radius);
    const posAttr = geom.getAttribute('position');
    const faceCount = 12;
    const verticesPerFace = posAttr.count / faceCount;

    const faceCenters: THREE.Vector3[] = [];
    for (let face = 0; face < faceCount; face++) {
      const start = face * verticesPerFace;
      const center = new THREE.Vector3();
      for (let v = 0; v < verticesPerFace; v++) {
        center.add(new THREE.Vector3().fromBufferAttribute(posAttr, start + v));
      }
      center.divideScalar(verticesPerFace);
      faceCenters.push(center);
    }

    const { faceValues } = DICE_CONFIGS.d12;
    const face12Index = faceValues.indexOf(12);

    // Find 5 nearest face centers (neighbors)
    const distances = faceCenters
      .map((c, i) => ({ index: i, dist: c.distanceTo(faceCenters[face12Index]) }))
      .filter((d) => d.index !== face12Index)
      .sort((a, b) => a.dist - b.dist);

    const neighborValues = distances.slice(0, 5).map((d) => faceValues[d.index]);
    neighborValues.sort((a, b) => a - b);

    expect(neighborValues).toEqual([3, 7, 8, 9, 11]);
  });

  it('dice with smaller faces have smaller fontScale', () => {
    // d20 has the smallest faces (20 triangles), needs smallest text
    // d6 has large square faces, can have larger text
    expect(DICE_CONFIGS.d20.fontScale).toBeLessThan(DICE_CONFIGS.d6.fontScale);
    expect(DICE_CONFIGS.d4.fontScale).toBeLessThan(DICE_CONFIGS.d6.fontScale);
    for (const key of Object.keys(DICE_CONFIGS)) {
      const cfg = DICE_CONFIGS[key as DiceType];
      expect(cfg.fontScale).toBeGreaterThan(0);
      expect(cfg.fontScale).toBeLessThanOrEqual(0.4);
    }
  });
});
