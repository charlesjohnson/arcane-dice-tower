import { describe, it, expect } from 'vitest';
import { DICE_CONFIGS, getMaxValue, formatFaceLabel } from './DiceConfig';
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

  it('d10 faceValues match standard D10 arrangement (opposite faces sum to 9)', () => {
    const values = DICE_CONFIGS.d10.faceValues;
    expect(values).toHaveLength(10);
    // Every value 0-9 must appear exactly once
    expect([...values].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    // Opposite faces (i and i+5) must sum to 9
    for (let i = 0; i < 5; i++) {
      expect(values[i] + values[i + 5]).toBe(9);
    }
    // Standard arrangement: 3, 7, 1, 9, 5, 6, 2, 8, 0, 4
    expect(values).toEqual([3, 7, 1, 9, 5, 6, 2, 8, 0, 4]);
  });

  it('d100 faceValues match d10 arrangement scaled by 10', () => {
    const d10Values = DICE_CONFIGS.d10.faceValues;
    const d100Values = DICE_CONFIGS.d100.faceValues;
    expect(d100Values).toHaveLength(10);
    for (let i = 0; i < 10; i++) {
      expect(d100Values[i]).toBe(d10Values[i] * 10);
    }
  });

  it('formatFaceLabel zero-pads d100 values to two digits', () => {
    expect(formatFaceLabel(0, 'd100')).toBe('00');
    expect(formatFaceLabel(10, 'd100')).toBe('10');
    expect(formatFaceLabel(90, 'd100')).toBe('90');
  });

  it('formatFaceLabel does not pad non-percentile dice', () => {
    expect(formatFaceLabel(0, 'd10')).toBe('0');
    expect(formatFaceLabel(6, 'd6')).toBe('6');
    expect(formatFaceLabel(20, 'd20')).toBe('20');
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
