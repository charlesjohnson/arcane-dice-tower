import { describe, it, expect } from 'vitest';
import { findUpwardFaceIndex, findUpwardVertexIndex } from './DiceResult';
import * as THREE from 'three';

describe('findUpwardFaceIndex', () => {
  it('identifies the top face of a box at identity rotation', () => {
    const normals = [
      new THREE.Vector3(1, 0, 0),   // +X
      new THREE.Vector3(-1, 0, 0),  // -X
      new THREE.Vector3(0, 1, 0),   // +Y  <-- this is up
      new THREE.Vector3(0, -1, 0),  // -Y
      new THREE.Vector3(0, 0, 1),   // +Z
      new THREE.Vector3(0, 0, -1),  // -Z
    ];
    const quaternion = new THREE.Quaternion(); // identity
    const result = findUpwardFaceIndex(normals, quaternion);
    expect(result).toBe(2); // +Y face
  });

  it('identifies the top face after rotation', () => {
    const normals = [
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0, -1),
    ];
    // Rotate 90 degrees around Z axis: +X becomes +Y
    const quaternion = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 0, 1),
      Math.PI / 2
    );
    const result = findUpwardFaceIndex(normals, quaternion);
    expect(result).toBe(0); // +X face is now pointing up
  });
});

describe('findUpwardVertexIndex', () => {
  const s = 1 / Math.sqrt(3);
  const tetraVertices = [
    new THREE.Vector3(s, s, s),      // vertex 0
    new THREE.Vector3(-s, -s, s),    // vertex 1
    new THREE.Vector3(-s, s, -s),    // vertex 2
    new THREE.Vector3(s, -s, -s),    // vertex 3
  ];

  it('returns the vertex with the highest Y at identity rotation', () => {
    const quaternion = new THREE.Quaternion(); // identity
    const result = findUpwardVertexIndex(tetraVertices, quaternion);
    // Vertices 0 and 2 both have y = s ≈ 0.577, but vertex 0 is first
    expect(result).toBe(0);
  });

  it('returns vertex 1 when rotated so vertex 1 points up', () => {
    // Vertex 1 is at (-s, -s, s). Rotate 180° around Z to flip it up:
    // (-s, -s, s) → (s, s, s) after 180° Z rotation... that doesn't isolate v1.
    // Instead, use a quaternion that rotates v1 direction to +Y.
    const v1dir = new THREE.Vector3(-s, -s, s).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(v1dir, up);
    const result = findUpwardVertexIndex(tetraVertices, quaternion);
    expect(result).toBe(1);
  });

  it('returns vertex 3 when rotated so vertex 3 points up', () => {
    const v3dir = new THREE.Vector3(s, -s, -s).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(v3dir, up);
    const result = findUpwardVertexIndex(tetraVertices, quaternion);
    expect(result).toBe(3);
  });
});
