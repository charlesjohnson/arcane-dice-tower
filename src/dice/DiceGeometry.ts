import * as THREE from 'three';
import type { DiceType } from './DiceConfig';
import { DICE_CONFIGS } from './DiceConfig';

export function createDiceGeometry(type: DiceType): THREE.BufferGeometry {
  const config = DICE_CONFIGS[type];
  const r = config.radius;

  switch (type) {
    case 'd4':
      return addD4FaceGroupsAndUVs(new THREE.TetrahedronGeometry(r));
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

// Circumradius for the equilateral UV triangle centered at (0.5, 0.5).
// D4 textures use flipY=false, so UV y matches canvas y (y=0 at top).
const D4_UV_R = 0.4;
const D4_UV_VERTICES: [number, number][] = [
  [0.5, 0.5 - D4_UV_R],                                          // top
  [0.5 - D4_UV_R * Math.sin(Math.PI / 3), 0.5 + D4_UV_R * 0.5], // bottom-left
  [0.5 + D4_UV_R * Math.sin(Math.PI / 3), 0.5 + D4_UV_R * 0.5], // bottom-right
];

function addD4FaceGroupsAndUVs(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  const vertexCount = 12; // 4 faces × 3 vertices
  const uvs = new Float32Array(vertexCount * 2);

  for (let face = 0; face < 4; face++) {
    geometry.addGroup(face * 3, 3, face);
    for (let v = 0; v < 3; v++) {
      const idx = face * 3 + v;
      uvs[idx * 2] = D4_UV_VERTICES[v][0];
      uvs[idx * 2 + 1] = D4_UV_VERTICES[v][1];
    }
  }

  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  return geometry;
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

    // Compute face normal as area-weighted average of all triangle normals
    const normal = new THREE.Vector3();
    for (let t = 0; t < verticesPerFace; t += 3) {
      const e1 = new THREE.Vector3().subVectors(faceVertices[t + 1], faceVertices[t]);
      const e2 = new THREE.Vector3().subVectors(faceVertices[t + 2], faceVertices[t]);
      normal.add(new THREE.Vector3().crossVectors(e1, e2));
    }
    normal.normalize();

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

    // Normalize UVs: center on face centroid (projected origin) with padding
    const maxExtent = Math.max(
      Math.abs(minU), Math.abs(maxU), Math.abs(minV), Math.abs(maxV)
    );
    const range = maxExtent * 2 || 1;

    for (let v = 0; v < verticesPerFace; v++) {
      const [pu, pv] = projected[v];
      uvs[(start + v) * 2] = 0.5 + (pu / range) * 0.8;
      uvs[(start + v) * 2 + 1] = 0.5 + (pv / range) * 0.8;
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
      indices.push(0, next, curr);
      indices.push(next, 1, curr);
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
