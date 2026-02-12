import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createDiceGeometry } from './DiceGeometry';
import { DICE_CONFIGS } from './DiceConfig';
import { findUpwardFaceIndex } from './DiceResult';

/** Compute face normals by averaging all triangle normals per face —
 *  mirrors the RollOrchestrator.extractFaceNormals algorithm. */
function extractFaceNormals(
  geo: THREE.BufferGeometry,
  faceCount: number
): THREE.Vector3[] {
  const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
  const totalTriangles = posAttr.count / 3;
  const trianglesPerFace = Math.floor(totalTriangles / faceCount);
  const normals: THREE.Vector3[] = [];

  for (let face = 0; face < faceCount; face++) {
    const avg = new THREE.Vector3();
    for (let t = 0; t < trianglesPerFace; t++) {
      const base = (face * trianglesPerFace + t) * 3;
      const v0 = new THREE.Vector3().fromBufferAttribute(posAttr, base);
      const v1 = new THREE.Vector3().fromBufferAttribute(posAttr, base + 1);
      const v2 = new THREE.Vector3().fromBufferAttribute(posAttr, base + 2);
      const e1 = new THREE.Vector3().subVectors(v1, v0);
      const e2 = new THREE.Vector3().subVectors(v2, v0);
      avg.add(new THREE.Vector3().crossVectors(e1, e2).normalize());
    }
    normals.push(avg.normalize());
  }
  return normals;
}

describe('createDiceGeometry', () => {
  it('creates a tetrahedron for d4', () => {
    const geo = createDiceGeometry('d4');
    expect(geo.getAttribute('position')).toBeDefined();
  });

  it('creates a cube for d6', () => {
    const geo = createDiceGeometry('d6');
    expect(geo.getAttribute('position')).toBeDefined();
  });

  it('creates an octahedron for d8', () => {
    const geo = createDiceGeometry('d8');
    expect(geo.getAttribute('position')).toBeDefined();
  });

  it('creates a pentagonal trapezohedron for d10', () => {
    const geo = createDiceGeometry('d10');
    expect(geo.getAttribute('position')).toBeDefined();
  });

  it('creates a dodecahedron for d12', () => {
    const geo = createDiceGeometry('d12');
    expect(geo.getAttribute('position')).toBeDefined();
  });

  it('creates an icosahedron for d20', () => {
    const geo = createDiceGeometry('d20');
    expect(geo.getAttribute('position')).toBeDefined();
  });

  it('d100 reuses d10 geometry', () => {
    const geo = createDiceGeometry('d100');
    const d10Geo = createDiceGeometry('d10');
    const positions100 = geo.getAttribute('position');
    const positions10 = d10Geo.getAttribute('position');
    expect(positions100.count).toBe(positions10.count);
  });

  it.each(['d4', 'd8', 'd10', 'd12', 'd20', 'd100'] as const)(
    '%s UV centroid is at (0.5, 0.5) so face numbers are centered',
    (type) => {
      const geo = createDiceGeometry(type);
      const uv = geo.getAttribute('uv') as THREE.BufferAttribute;
      const pos = geo.getAttribute('position') as THREE.BufferAttribute;
      const faceCount = DICE_CONFIGS[type].faceCount;
      const verticesPerFace = pos.count / faceCount;

      for (let face = 0; face < faceCount; face++) {
        const start = face * verticesPerFace;
        let sumU = 0, sumV = 0;
        for (let v = 0; v < verticesPerFace; v++) {
          sumU += uv.getX(start + v);
          sumV += uv.getY(start + v);
        }
        const avgU = sumU / verticesPerFace;
        const avgV = sumV / verticesPerFace;

        expect(avgU).toBeCloseTo(0.5, 2);
        expect(avgV).toBeCloseTo(0.5, 2);
      }
    }
  );

  it('d10 mid-ring vertices have symmetric V coordinates across each kite face', () => {
    const geo = createDiceGeometry('d10');
    const uvAttr = geo.getAttribute('uv') as THREE.BufferAttribute;
    const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
    const faceCount = 10;
    const verticesPerFace = posAttr.count / faceCount;
    const r = DICE_CONFIGS.d10.radius;

    for (let face = 0; face < faceCount; face++) {
      const start = face * verticesPerFace;

      for (let v = 0; v < verticesPerFace; v++) {
        const y = posAttr.getY(start + v);
        // Mid-ring vertices (|y| much less than radius) should all be at V=0.5
        if (Math.abs(y) < r * 0.5) {
          expect(uvAttr.getY(start + v)).toBeCloseTo(0.5, 2);
        }
      }
    }
  });

  it('d10 kite faces are subdivided into 4 triangles for better texture mapping', () => {
    const geo = createDiceGeometry('d10');
    const pos = geo.getAttribute('position') as THREE.BufferAttribute;
    // 10 faces × 4 triangles × 3 vertices = 120
    expect(pos.count).toBe(120);
  });

  it('d10 UV mapping gives all triangles of each kite face meaningful area', () => {
    const geo = createDiceGeometry('d10');
    const uvAttr = geo.getAttribute('uv') as THREE.BufferAttribute;
    const faceCount = 10;
    const verticesPerFace = uvAttr.count / faceCount;

    for (let face = 0; face < faceCount; face++) {
      const start = face * verticesPerFace;

      // Check each triangle in the face (2 per kite)
      for (let t = 0; t < verticesPerFace; t += 3) {
        const u0 = uvAttr.getX(start + t);
        const v0 = uvAttr.getY(start + t);
        const u1 = uvAttr.getX(start + t + 1);
        const v1 = uvAttr.getY(start + t + 1);
        const u2 = uvAttr.getX(start + t + 2);
        const v2 = uvAttr.getY(start + t + 2);

        // Triangle area in UV space via cross product
        const area = 0.5 * Math.abs(
          (u1 - u0) * (v2 - v0) - (u2 - u0) * (v1 - v0)
        );

        // Both triangles must have real area (not degenerate slivers)
        expect(area).toBeGreaterThan(0.01);
      }
    }
  });

  it.each(['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'] as const)(
    '%s has all triangle normals pointing outward',
    (type) => {
      let geo = createDiceGeometry(type);
      if (geo.getIndex()) geo = geo.toNonIndexed();
      const pos = geo.getAttribute('position') as THREE.BufferAttribute;
      const triCount = pos.count / 3;

      for (let t = 0; t < triCount; t++) {
        const v0 = new THREE.Vector3().fromBufferAttribute(pos, t * 3);
        const v1 = new THREE.Vector3().fromBufferAttribute(pos, t * 3 + 1);
        const v2 = new THREE.Vector3().fromBufferAttribute(pos, t * 3 + 2);
        const e1 = new THREE.Vector3().subVectors(v1, v0);
        const e2 = new THREE.Vector3().subVectors(v2, v0);
        const normal = new THREE.Vector3().crossVectors(e1, e2);
        const center = new THREE.Vector3().add(v0).add(v1).add(v2).divideScalar(3);

        expect(normal.dot(center)).toBeGreaterThan(0);
      }
    }
  );

  it('d10 face normals are distinct enough for reliable upward-face detection', () => {
    const geo = createDiceGeometry('d10');
    const faceCount = 10;
    const normals = extractFaceNormals(geo, faceCount);

    // Every pair of face normals must be sufficiently separated.
    // D10 faces are arranged 36 degrees apart — adjacent normals should
    // differ by at least ~18 degrees (dot < 0.95) for robust detection.
    for (let i = 0; i < normals.length; i++) {
      for (let j = i + 1; j < normals.length; j++) {
        expect(normals[i].dot(normals[j])).toBeLessThan(0.95);
      }
    }
  });

  it('d10 findUpwardFaceIndex correctly identifies every face', () => {
    const geo = createDiceGeometry('d10');
    const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
    const faceCount = 10;
    const verticesPerFace = posAttr.count / faceCount;

    // Compute "true" face normals by averaging all triangle normals per face
    const trueNormals: THREE.Vector3[] = [];
    for (let face = 0; face < faceCount; face++) {
      const start = face * verticesPerFace;
      const avg = new THREE.Vector3();
      for (let t = 0; t < verticesPerFace; t += 3) {
        const v0 = new THREE.Vector3().fromBufferAttribute(posAttr, start + t);
        const v1 = new THREE.Vector3().fromBufferAttribute(posAttr, start + t + 1);
        const v2 = new THREE.Vector3().fromBufferAttribute(posAttr, start + t + 2);
        const e1 = new THREE.Vector3().subVectors(v1, v0);
        const e2 = new THREE.Vector3().subVectors(v2, v0);
        avg.add(new THREE.Vector3().crossVectors(e1, e2).normalize());
      }
      trueNormals.push(avg.normalize());
    }

    // Compute detection normals the way extractFaceNormals does it
    const detectionNormals = extractFaceNormals(geo, faceCount);

    // For each face, create a quaternion simulating the die at rest with
    // that face's true normal pointing upward, then verify detection.
    const UP = new THREE.Vector3(0, 1, 0);
    for (let face = 0; face < faceCount; face++) {
      const q = new THREE.Quaternion().setFromUnitVectors(trueNormals[face], UP);
      const detected = findUpwardFaceIndex(detectionNormals, q);
      expect(detected).toBe(face);
    }
  });
});
