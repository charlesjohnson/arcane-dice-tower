import * as THREE from 'three';
import type { DiceType } from './DiceConfig';
import { DICE_CONFIGS } from './DiceConfig';

export function createDiceGeometry(type: DiceType): THREE.BufferGeometry {
  const config = DICE_CONFIGS[type];
  const r = config.radius;

  switch (type) {
    case 'd4':
      return addFaceGroupsAndUVs(new THREE.TetrahedronGeometry(r), config.faceCount);
    case 'd6':
      // BoxGeometry already has built-in face groups for 6 materials
      return new THREE.BoxGeometry(r * 1.2, r * 1.2, r * 1.2);
    case 'd8':
      return addFaceGroupsAndUVs(new THREE.OctahedronGeometry(r), config.faceCount);
    case 'd10':
    case 'd100':
      // D10 is indexed; convert to non-indexed so we can assign per-face UVs
      return addFaceGroupsAndUVs(createD10Geometry(r).toNonIndexed(), config.faceCount);
    case 'd12':
      return addFaceGroupsAndUVs(new THREE.DodecahedronGeometry(r), config.faceCount);
    case 'd20':
      return addFaceGroupsAndUVs(new THREE.IcosahedronGeometry(r), config.faceCount);
  }
}

function addFaceGroupsAndUVs(
  geometry: THREE.BufferGeometry,
  faceCount: number
): THREE.BufferGeometry {
  const posAttr = geometry.getAttribute('position');
  const vertexCount = posAttr.count;
  const verticesPerFace = vertexCount / faceCount;
  const uvs = new Float32Array(vertexCount * 2);

  for (let face = 0; face < faceCount; face++) {
    const start = face * verticesPerFace;

    // Add material group for this face
    geometry.addGroup(start, verticesPerFace, face);

    // Collect face vertices and compute center
    const faceVertices: THREE.Vector3[] = [];
    const center = new THREE.Vector3();
    for (let v = 0; v < verticesPerFace; v++) {
      const vertex = new THREE.Vector3().fromBufferAttribute(posAttr, start + v);
      faceVertices.push(vertex);
      center.add(vertex);
    }
    center.divideScalar(verticesPerFace);

    // Compute face normal from first triangle
    const edge1 = new THREE.Vector3().subVectors(faceVertices[1], faceVertices[0]);
    const edge2 = new THREE.Vector3().subVectors(faceVertices[2], faceVertices[0]);
    const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();

    // Create tangent/bitangent basis for planar UV projection
    const tangent = new THREE.Vector3();
    if (Math.abs(normal.y) < 0.99) {
      tangent.crossVectors(new THREE.Vector3(0, 1, 0), normal).normalize();
    } else {
      tangent.crossVectors(new THREE.Vector3(1, 0, 0), normal).normalize();
    }
    const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize();

    // Project vertices onto face plane
    const projected: [number, number][] = [];
    let minU = Infinity, maxU = -Infinity;
    let minV = Infinity, maxV = -Infinity;
    for (const vertex of faceVertices) {
      const diff = new THREE.Vector3().subVectors(vertex, center);
      const u = diff.dot(tangent);
      const v = diff.dot(bitangent);
      projected.push([u, v]);
      minU = Math.min(minU, u); maxU = Math.max(maxU, u);
      minV = Math.min(minV, v); maxV = Math.max(maxV, v);
    }

    // Normalize UVs: center the face in texture space with padding
    const range = Math.max(maxU - minU, maxV - minV) || 1;
    const centerU = (minU + maxU) / 2;
    const centerV = (minV + maxV) / 2;

    for (let v = 0; v < verticesPerFace; v++) {
      const [pu, pv] = projected[v];
      uvs[(start + v) * 2] = 0.5 + ((pu - centerU) / range) * 0.8;
      uvs[(start + v) * 2 + 1] = 0.5 + ((pv - centerV) / range) * 0.8;
    }
  }

  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  return geometry;
}

function createD10Geometry(radius: number): THREE.BufferGeometry {
  // Pentagonal trapezohedron: 12 vertices, 10 kite faces (20 triangles)
  const vertices: number[] = [];
  const indices: number[] = [];

  // Top and bottom apex
  vertices.push(0, radius, 0); // index 0: top
  vertices.push(0, -radius, 0); // index 1: bottom

  // 10 middle vertices in a zigzag ring
  const heightOffset = radius * 0.105;
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI * 2) / 10;
    const y = heightOffset * (i % 2 === 0 ? 1 : -1);
    vertices.push(
      Math.cos(angle) * radius,
      y,
      Math.sin(angle) * radius
    );
  }

  // Build faces: each kite = 2 triangles
  for (let i = 0; i < 10; i++) {
    const curr = i + 2;
    const next = ((i + 1) % 10) + 2;

    if (i % 2 === 0) {
      indices.push(0, curr, next);
      indices.push(curr, 1, next);
    } else {
      indices.push(curr, 0, next);
      indices.push(1, curr, next);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(vertices, 3)
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
