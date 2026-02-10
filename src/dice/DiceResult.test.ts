import { describe, it, expect } from 'vitest';
import { findUpwardFaceIndex } from './DiceResult';
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
