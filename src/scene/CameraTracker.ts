export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export function computeDiceCentroid(positions: Vec3[]): Vec3 {
  if (positions.length === 0) return { x: 0, y: 0, z: 0 };
  const sum = positions.reduce(
    (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y, z: acc.z + p.z }),
    { x: 0, y: 0, z: 0 }
  );
  const n = positions.length;
  return { x: sum.x / n, y: sum.y / n, z: sum.z / n };
}

export function computeBoundingRadius(positions: Vec3[], centroid: Vec3): number {
  let maxDist = 0;
  for (const p of positions) {
    const dx = p.x - centroid.x;
    const dy = p.y - centroid.y;
    const dz = p.z - centroid.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist > maxDist) maxDist = dist;
  }
  return maxDist;
}

const MIN_TRACKING_DISTANCE = 3.5;

/**
 * Compute camera distance to fit all dice in view.
 * Uses the narrower of vertical/horizontal FOV to ensure nothing is clipped.
 * Applies a 1/0.9 multiplier (10% margin) per the "90% as close as possible" requirement.
 */
export function computeTrackingDistance(
  boundingRadius: number,
  fovDegrees: number,
  aspect: number
): number {
  const halfFovRad = (fovDegrees / 2) * (Math.PI / 180);
  const halfHFov = Math.atan(Math.tan(halfFovRad) * aspect);
  const minHalf = Math.min(halfFovRad, halfHFov);
  const geometricDist = boundingRadius / Math.tan(minHalf);
  const withMargin = geometricDist / 0.9;
  return Math.max(MIN_TRACKING_DISTANCE, withMargin);
}
