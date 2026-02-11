import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);

export function findUpwardFaceIndex(
  faceNormals: THREE.Vector3[],
  quaternion: THREE.Quaternion
): number {
  let bestIndex = 0;
  let bestDot = -Infinity;

  for (let i = 0; i < faceNormals.length; i++) {
    const rotatedNormal = faceNormals[i].clone().applyQuaternion(quaternion);
    const dot = rotatedNormal.dot(UP);
    if (dot > bestDot) {
      bestDot = dot;
      bestIndex = i;
    }
  }

  return bestIndex;
}

export function findUpwardVertexIndex(
  vertexPositions: THREE.Vector3[],
  quaternion: THREE.Quaternion
): number {
  let bestIndex = 0;
  let bestY = -Infinity;

  for (let i = 0; i < vertexPositions.length; i++) {
    const rotated = vertexPositions[i].clone().applyQuaternion(quaternion);
    if (rotated.y > bestY) {
      bestY = rotated.y;
      bestIndex = i;
    }
  }

  return bestIndex;
}
