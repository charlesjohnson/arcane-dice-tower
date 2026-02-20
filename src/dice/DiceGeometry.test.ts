import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createDiceGeometry } from './DiceGeometry';
import { DICE_CONFIGS } from './DiceConfig';

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

  it('d10 has 60 vertices (10 kite faces × 2 triangles × 3 vertices)', () => {
    const geo = createDiceGeometry('d10');
    const pos = geo.getAttribute('position') as THREE.BufferAttribute;
    expect(pos.count).toBe(60);
  });

  it('d10 has 10 congruent kite faces (same edge lengths)', () => {
    const geo = createDiceGeometry('d10');
    const pos = geo.getAttribute('position') as THREE.BufferAttribute;
    const verticesPerFace = 6; // 2 triangles × 3 vertices

    function getEdgeLengths(face: number): number[] {
      const start = face * verticesPerFace;
      // Two triangles per kite: (pole, wing1, mid) and (pole, mid, wing2)
      const pole = new THREE.Vector3().fromBufferAttribute(pos, start);
      const wing1 = new THREE.Vector3().fromBufferAttribute(pos, start + 1);
      const mid = new THREE.Vector3().fromBufferAttribute(pos, start + 2);
      const wing2 = new THREE.Vector3().fromBufferAttribute(pos, start + 5);
      // Kite edges: pole→wing1, wing1→mid, mid→wing2, wing2→pole
      return [
        pole.distanceTo(wing1),
        wing1.distanceTo(mid),
        mid.distanceTo(wing2),
        wing2.distanceTo(pole),
      ].sort((a, b) => a - b);
    }

    const refEdges = getEdgeLengths(0);
    for (let face = 1; face < 10; face++) {
      const edges = getEdgeLengths(face);
      for (let e = 0; e < 4; e++) {
        expect(edges[e]).toBeCloseTo(refEdges[e], 5);
      }
    }
  });

  it('d10 opposite faces (i and i+5) have antiparallel normals', () => {
    const geo = createDiceGeometry('d10');
    const pos = geo.getAttribute('position') as THREE.BufferAttribute;
    const verticesPerFace = 6;

    function faceNormal(face: number): THREE.Vector3 {
      const start = face * verticesPerFace;
      // Average normals of both triangles (kite faces are slightly non-planar)
      const normal = new THREE.Vector3();
      for (let t = 0; t < verticesPerFace; t += 3) {
        const v0 = new THREE.Vector3().fromBufferAttribute(pos, start + t);
        const v1 = new THREE.Vector3().fromBufferAttribute(pos, start + t + 1);
        const v2 = new THREE.Vector3().fromBufferAttribute(pos, start + t + 2);
        const e1 = new THREE.Vector3().subVectors(v1, v0);
        const e2 = new THREE.Vector3().subVectors(v2, v0);
        normal.add(new THREE.Vector3().crossVectors(e1, e2));
      }
      return normal.normalize();
    }

    for (let i = 0; i < 5; i++) {
      const n1 = faceNormal(i);
      const n2 = faceNormal(i + 5);
      expect(n1.dot(n2)).toBeCloseTo(-1, 1);
    }
  });

  it('d10 both triangles in each kite face share the same vertex normal', () => {
    const geo = createDiceGeometry('d10');
    const normalAttr = geo.getAttribute('normal') as THREE.BufferAttribute;
    const verticesPerFace = 6;

    for (let face = 0; face < 10; face++) {
      const start = face * verticesPerFace;
      // All 6 vertices of this kite face should have the same normal
      const refNormal = new THREE.Vector3().fromBufferAttribute(normalAttr, start);
      for (let v = 1; v < verticesPerFace; v++) {
        const n = new THREE.Vector3().fromBufferAttribute(normalAttr, start + v);
        expect(refNormal.dot(n)).toBeCloseTo(1.0, 4);
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
