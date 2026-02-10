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
