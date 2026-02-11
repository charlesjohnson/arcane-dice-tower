import { describe, it, expect } from 'vitest';
import { computeDiceCentroid, computeBoundingRadius, computeTrackingDistance } from './CameraTracker';

describe('computeDiceCentroid', () => {
  it('returns the single die position for one die', () => {
    const result = computeDiceCentroid([{ x: 1, y: 5, z: -0.2 }]);
    expect(result.x).toBeCloseTo(1);
    expect(result.y).toBeCloseTo(5);
    expect(result.z).toBeCloseTo(-0.2);
  });

  it('returns average position for multiple dice', () => {
    const positions = [
      { x: -1, y: 7, z: 0 },
      { x: 1, y: 5, z: -0.4 },
    ];
    const result = computeDiceCentroid(positions);
    expect(result.x).toBeCloseTo(0);
    expect(result.y).toBeCloseTo(6);
    expect(result.z).toBeCloseTo(-0.2);
  });

  it('returns origin for empty array', () => {
    const result = computeDiceCentroid([]);
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
    expect(result.z).toBe(0);
  });
});

describe('computeBoundingRadius', () => {
  it('returns 0 for a single die', () => {
    const centroid = { x: 2, y: 5, z: 0 };
    const result = computeBoundingRadius([{ x: 2, y: 5, z: 0 }], centroid);
    expect(result).toBeCloseTo(0);
  });

  it('returns the max distance from centroid to any die', () => {
    const positions = [
      { x: -1, y: 6, z: 0 },
      { x: 1, y: 6, z: 0 },
    ];
    const centroid = { x: 0, y: 6, z: 0 };
    const result = computeBoundingRadius(positions, centroid);
    expect(result).toBeCloseTo(1.0);
  });

  it('returns 0 for empty array', () => {
    const result = computeBoundingRadius([], { x: 0, y: 0, z: 0 });
    expect(result).toBe(0);
  });
});

describe('computeTrackingDistance', () => {
  it('returns a minimum distance for a single die (radius=0)', () => {
    const dist = computeTrackingDistance(0, 50, 16 / 9);
    expect(dist).toBeGreaterThan(2);
    expect(dist).toBeLessThan(5);
  });

  it('increases distance as bounding radius grows', () => {
    const small = computeTrackingDistance(0.5, 50, 16 / 9);
    const large = computeTrackingDistance(2.0, 50, 16 / 9);
    expect(large).toBeGreaterThan(small);
  });

  it('applies 10% margin (1/0.9 multiplier) over the geometric minimum', () => {
    const radius = 2.0;
    const fov = 50;
    const aspect = 16 / 9;
    const halfFovRad = (fov / 2) * (Math.PI / 180);
    const halfHFov = Math.atan(Math.tan(halfFovRad) * aspect);
    const minHalf = Math.min(halfFovRad, halfHFov);
    const geometricMin = radius / Math.tan(minHalf);
    const dist = computeTrackingDistance(radius, fov, aspect);
    expect(dist).toBeCloseTo(geometricMin / 0.9, 0);
  });
});
