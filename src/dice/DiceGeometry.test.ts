import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createDiceGeometry } from './DiceGeometry';

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

  it('d10 UV mapping gives both triangles of each kite face meaningful area', () => {
    const geo = createDiceGeometry('d10');
    const uvAttr = geo.getAttribute('uv') as THREE.BufferAttribute;
    const faceCount = 10;
    const verticesPerFace = uvAttr.count / faceCount; // 6 (2 triangles × 3 verts)

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
});
