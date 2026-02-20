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
      return addFaceGroupsAndUVs(createD10Geometry(r), config.faceCount);
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
  // Pentagonal trapezohedron as dual of regular pentagonal antiprism.
  // Antiprism: two rings of 5 vertices, offset by π/5, at heights ±h.
  // Dual: face centroids become equatorial vertices, cap centroids become poles.
  const R = 1;
  const h = R / 2; // half-height for regular pentagonal antiprism

  // Antiprism vertices
  const topRing: [number, number, number][] = [];
  const bottomRing: [number, number, number][] = [];
  for (let i = 0; i < 5; i++) {
    const topAngle = (2 * Math.PI * i) / 5;
    topRing.push([R * Math.cos(topAngle), h, R * Math.sin(topAngle)]);
    const botAngle = topAngle + Math.PI / 5;
    bottomRing.push([R * Math.cos(botAngle), -h, R * Math.sin(botAngle)]);
  }

  // Dual vertices: 2 poles + 10 equatorial (triangle face centroids)
  const topPole: [number, number, number] = [0, h, 0];
  const bottomPole: [number, number, number] = [0, -h, 0];

  // eq[2i]   = centroid of upper triangle (T_i, B_i, T_{i+1})
  // eq[2i+1] = centroid of lower triangle (B_i, T_{i+1}, B_{i+1})
  const eq: [number, number, number][] = [];
  for (let i = 0; i < 5; i++) {
    const next = (i + 1) % 5;
    eq.push([
      (topRing[i][0] + bottomRing[i][0] + topRing[next][0]) / 3,
      (topRing[i][1] + bottomRing[i][1] + topRing[next][1]) / 3,
      (topRing[i][2] + bottomRing[i][2] + topRing[next][2]) / 3,
    ]);
    eq.push([
      (bottomRing[i][0] + topRing[next][0] + bottomRing[next][0]) / 3,
      (bottomRing[i][1] + topRing[next][1] + bottomRing[next][1]) / 3,
      (bottomRing[i][2] + topRing[next][2] + bottomRing[next][2]) / 3,
    ]);
  }

  // Scale all vertices so circumradius matches the desired radius
  const allVerts = [topPole, bottomPole, ...eq];
  let maxDist = 0;
  for (const v of allVerts) {
    maxDist = Math.max(maxDist, Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2));
  }
  const scale = radius / maxDist;
  for (const v of allVerts) {
    v[0] *= scale;
    v[1] *= scale;
    v[2] *= scale;
  }

  // Build 10 kite faces, each split into 2 triangles along the symmetry axis.
  // Face 2k   (top-pole kite):    topPole,    eq[2k], eq[2k-1], eq[2k-2]
  // Face 2k+1 (bottom-pole kite): bottomPole, eq[2k-1], eq[2k], eq[2k+1]
  // Winding produces outward-facing normals.
  const vertices: number[] = [];
  const e = (j: number) => eq[((j % 10) + 10) % 10];

  for (let f = 0; f < 10; f++) {
    const isTop = f % 2 === 0;
    const pole = isTop ? topPole : bottomPole;
    const mid = e(f - 1);
    const wing1 = isTop ? e(f) : e(f - 2);
    const wing2 = isTop ? e(f - 2) : e(f);

    // Triangle 1: pole, wing1, mid
    vertices.push(...pole, ...wing1, ...mid);
    // Triangle 2: pole, mid, wing2
    vertices.push(...pole, ...mid, ...wing2);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

  // Compute per-kite-face normals (averaged across both triangles) so each
  // face renders flat. computeVertexNormals() would give per-triangle normals,
  // creating visible creases because the kite faces are slightly non-planar.
  const posAttr = geometry.getAttribute('position');
  const normals = new Float32Array(posAttr.count * 3);
  const verticesPerFace = 6;
  for (let face = 0; face < 10; face++) {
    const start = face * verticesPerFace;
    const faceNormal = new THREE.Vector3();
    for (let t = 0; t < verticesPerFace; t += 3) {
      const v0 = new THREE.Vector3().fromBufferAttribute(posAttr, start + t);
      const v1 = new THREE.Vector3().fromBufferAttribute(posAttr, start + t + 1);
      const v2 = new THREE.Vector3().fromBufferAttribute(posAttr, start + t + 2);
      const e1 = new THREE.Vector3().subVectors(v1, v0);
      const e2 = new THREE.Vector3().subVectors(v2, v0);
      faceNormal.add(new THREE.Vector3().crossVectors(e1, e2));
    }
    faceNormal.normalize();
    for (let v = 0; v < verticesPerFace; v++) {
      normals[(start + v) * 3] = faceNormal.x;
      normals[(start + v) * 3 + 1] = faceNormal.y;
      normals[(start + v) * 3 + 2] = faceNormal.z;
    }
  }
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));

  return geometry;
}

