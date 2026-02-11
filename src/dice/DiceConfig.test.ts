import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { DICE_CONFIGS, getMaxValue, formatFaceLabel } from './DiceConfig';
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

  it('d10 faceValues match standard D10 arrangement (opposite faces sum to 9)', () => {
    const values = DICE_CONFIGS.d10.faceValues;
    expect(values).toHaveLength(10);
    // Every value 0-9 must appear exactly once
    expect([...values].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    // Opposite faces (i and i+5) must sum to 9
    for (let i = 0; i < 5; i++) {
      expect(values[i] + values[i + 5]).toBe(9);
    }
    // Standard arrangement: 3, 7, 1, 9, 5, 6, 2, 8, 0, 4
    expect(values).toEqual([3, 7, 1, 9, 5, 6, 2, 8, 0, 4]);
  });

  it('d100 faceValues match d10 arrangement scaled by 10', () => {
    const d10Values = DICE_CONFIGS.d10.faceValues;
    const d100Values = DICE_CONFIGS.d100.faceValues;
    expect(d100Values).toHaveLength(10);
    for (let i = 0; i < 10; i++) {
      expect(d100Values[i]).toBe(d10Values[i] * 10);
    }
  });

  it('formatFaceLabel zero-pads d100 values to two digits', () => {
    expect(formatFaceLabel(0, 'd100')).toBe('00');
    expect(formatFaceLabel(10, 'd100')).toBe('10');
    expect(formatFaceLabel(90, 'd100')).toBe('90');
  });

  it('formatFaceLabel does not pad non-percentile dice', () => {
    expect(formatFaceLabel(0, 'd10')).toBe('0');
    expect(formatFaceLabel(6, 'd6')).toBe('6');
    expect(formatFaceLabel(20, 'd20')).toBe('20');
  });

  it('d8 opposite faces sum to 9 (standard d8 convention)', () => {
    const values = DICE_CONFIGS.d8.faceValues;
    // Three.js OctahedronGeometry opposite face pairs: (0,5), (1,4), (2,7), (3,6)
    const oppositePairs: [number, number][] = [[0, 5], [1, 4], [2, 7], [3, 6]];
    for (const [a, b] of oppositePairs) {
      expect(values[a] + values[b]).toBe(9);
    }
  });

  it('d6 faceValues maps opposite BoxGeometry faces to sum to 7', () => {
    // Three.js BoxGeometry face order: +X, -X, +Y, -Y, +Z, -Z (indices 0-5)
    // Standard D6: opposite faces sum to 7 (1↔6, 2↔5, 3↔4)
    const vals = DICE_CONFIGS.d6.faceValues;
    expect(vals).toHaveLength(6);
    // +X (index 0) + -X (index 1) = 7
    expect(vals[0] + vals[1]).toBe(7);
    // +Y (index 2) + -Y (index 3) = 7
    expect(vals[2] + vals[3]).toBe(7);
    // +Z (index 4) + -Z (index 5) = 7
    expect(vals[4] + vals[5]).toBe(7);
  });

  it('d6 faceValues matches standard die net layout', () => {
    // From the standard unrolled D6 cross pattern:
    //        [1]         <- back (-Z, index 5)
    //        [2]         <- top  (+Y, index 2)
    //   [3]  [6]  [4]   <- left (-X, index 1), front (+Z, index 4), right (+X, index 0)
    //        [5]         <- bottom (-Y, index 3)
    const vals = DICE_CONFIGS.d6.faceValues;
    expect(vals[0]).toBe(4);  // +X = right = 4
    expect(vals[1]).toBe(3);  // -X = left  = 3
    expect(vals[2]).toBe(2);  // +Y = top   = 2
    expect(vals[3]).toBe(5);  // -Y = bottom = 5
    expect(vals[4]).toBe(6);  // +Z = front = 6
    expect(vals[5]).toBe(1);  // -Z = back  = 1
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
