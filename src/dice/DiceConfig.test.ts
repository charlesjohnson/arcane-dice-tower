import { describe, it, expect } from 'vitest';
import { DICE_CONFIGS, getMaxValue } from './DiceConfig';
import type { DiceType } from './DiceConfig';

describe('DiceConfig', () => {
  it('defines all 7 standard dice types', () => {
    const types: DiceType[] = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];
    for (const t of types) {
      expect(DICE_CONFIGS[t]).toBeDefined();
    }
  });

  it('has correct face counts', () => {
    expect(DICE_CONFIGS.d4.faceCount).toBe(4);
    expect(DICE_CONFIGS.d6.faceCount).toBe(6);
    expect(DICE_CONFIGS.d8.faceCount).toBe(8);
    expect(DICE_CONFIGS.d10.faceCount).toBe(10);
    expect(DICE_CONFIGS.d12.faceCount).toBe(12);
    expect(DICE_CONFIGS.d20.faceCount).toBe(20);
    expect(DICE_CONFIGS.d100.faceCount).toBe(10);
  });

  it('d100 is flagged as percentile', () => {
    expect(DICE_CONFIGS.d100.isPercentile).toBe(true);
    expect(DICE_CONFIGS.d20.isPercentile).toBeUndefined();
  });

  it('each die has mass and size', () => {
    for (const key of Object.keys(DICE_CONFIGS)) {
      const cfg = DICE_CONFIGS[key as DiceType];
      expect(cfg.mass).toBeGreaterThan(0);
      expect(cfg.radius).toBeGreaterThan(0);
    }
  });

  it('getMaxValue returns correct max for each die type', () => {
    expect(getMaxValue('d4')).toBe(4);
    expect(getMaxValue('d6')).toBe(6);
    expect(getMaxValue('d8')).toBe(8);
    expect(getMaxValue('d10')).toBe(9);
    expect(getMaxValue('d12')).toBe(12);
    expect(getMaxValue('d20')).toBe(20);
    expect(getMaxValue('d100')).toBe(100);
  });

  it('d8 opposite faces sum to 9 (standard d8 convention)', () => {
    const values = DICE_CONFIGS.d8.faceValues;
    // Three.js OctahedronGeometry opposite face pairs: (0,5), (1,4), (2,7), (3,6)
    const oppositePairs: [number, number][] = [[0, 5], [1, 4], [2, 7], [3, 6]];
    for (const [a, b] of oppositePairs) {
      expect(values[a] + values[b]).toBe(9);
    }
  });

  it('d6 faceValues maps opposite BoxGeometry faces to sum to 7', () => {
    // Three.js BoxGeometry face order: +X, -X, +Y, -Y, +Z, -Z (indices 0-5)
    // Standard D6: opposite faces sum to 7 (1↔6, 2↔5, 3↔4)
    const vals = DICE_CONFIGS.d6.faceValues;
    expect(vals).toHaveLength(6);
    // +X (index 0) + -X (index 1) = 7
    expect(vals[0] + vals[1]).toBe(7);
    // +Y (index 2) + -Y (index 3) = 7
    expect(vals[2] + vals[3]).toBe(7);
    // +Z (index 4) + -Z (index 5) = 7
    expect(vals[4] + vals[5]).toBe(7);
  });

  it('d6 faceValues matches standard die net layout', () => {
    // From the standard unrolled D6 cross pattern:
    //        [1]         <- back (-Z, index 5)
    //        [2]         <- top  (+Y, index 2)
    //   [3]  [6]  [4]   <- left (-X, index 1), front (+Z, index 4), right (+X, index 0)
    //        [5]         <- bottom (-Y, index 3)
    const vals = DICE_CONFIGS.d6.faceValues;
    expect(vals[0]).toBe(4);  // +X = right = 4
    expect(vals[1]).toBe(3);  // -X = left  = 3
    expect(vals[2]).toBe(2);  // +Y = top   = 2
    expect(vals[3]).toBe(5);  // -Y = bottom = 5
    expect(vals[4]).toBe(6);  // +Z = front = 6
    expect(vals[5]).toBe(1);  // -Z = back  = 1
  });

  it('dice with smaller faces have smaller fontScale', () => {
    // d20 has the smallest faces (20 triangles), needs smallest text
    // d6 has large square faces, can have larger text
    expect(DICE_CONFIGS.d20.fontScale).toBeLessThan(DICE_CONFIGS.d6.fontScale);
    expect(DICE_CONFIGS.d4.fontScale).toBeLessThan(DICE_CONFIGS.d6.fontScale);
    for (const key of Object.keys(DICE_CONFIGS)) {
      const cfg = DICE_CONFIGS[key as DiceType];
      expect(cfg.fontScale).toBeGreaterThan(0);
      expect(cfg.fontScale).toBeLessThanOrEqual(0.4);
    }
  });
});
