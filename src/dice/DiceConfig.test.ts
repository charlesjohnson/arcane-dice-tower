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
