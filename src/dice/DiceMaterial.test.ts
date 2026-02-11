import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { D4_CANVAS_R, D4_INSET, D4_FONT_SCALE } from './DiceMaterial';
import { createDiceGeometry } from './DiceGeometry';
import { D4_VERTEX_POSITIONS, D4_VERTEX_VALUES, D4_FACE_VERTEX_VALUES } from './DiceConfig';

/**
 * For an equilateral triangle with circumradius R, the inradius (center to
 * nearest edge) is R/2. A point at fraction f along center→vertex has minimum
 * distance to the nearest edge of: (R/2) * (1 - f).
 *
 * For D4 numbers not to clip, this distance must be >= half the font size.
 */
describe('D4 face texture layout', () => {
  it('numbers are positioned with enough clearance from triangle edges', () => {
    const inradius = D4_CANVAS_R / 2;
    const edgeClearance = inradius * (1 - D4_INSET);
    const halfFont = (256 * D4_FONT_SCALE) / 2;

    expect(edgeClearance).toBeGreaterThanOrEqual(halfFont);
  });

  it('D4_FACE_VERTEX_VALUES assigns consistent vertex numbers across shared vertices', () => {
    const geo = createDiceGeometry('d4');
    const pos = geo.getAttribute('position') as THREE.BufferAttribute;
    const radius = 0.6; // from DiceConfig

    // Build normalized reference vertices
    const refVerts = D4_VERTEX_POSITIONS.map(
      ([x, y, z]) => new THREE.Vector3(x, y, z).normalize().multiplyScalar(radius)
    );

    // For each face, identify which geometric vertex each position slot maps to
    const faceVertexIndices: number[][] = [];
    for (let face = 0; face < 4; face++) {
      const indices: number[] = [];
      for (let v = 0; v < 3; v++) {
        const p = new THREE.Vector3().fromBufferAttribute(pos, face * 3 + v);
        let bestIdx = -1;
        let bestDist = Infinity;
        for (let r = 0; r < 4; r++) {
          const d = p.distanceTo(refVerts[r]);
          if (d < bestDist) {
            bestDist = d;
            bestIdx = r;
          }
        }
        expect(bestDist).toBeLessThan(0.01); // should match a known vertex
        indices.push(bestIdx);
      }
      faceVertexIndices.push(indices);
    }

    // Compute what D4_FACE_VERTEX_VALUES SHOULD be based on actual geometry
    const expectedFaceValues: [number, number, number][] = [];
    for (let face = 0; face < 4; face++) {
      const vals = faceVertexIndices[face].map(idx => D4_VERTEX_VALUES[idx]) as [number, number, number];
      expectedFaceValues.push(vals);
    }

    // Show actual vs expected for debugging
    expect(expectedFaceValues).toEqual(
      Array.from(D4_FACE_VERTEX_VALUES)
    );
  });
});
