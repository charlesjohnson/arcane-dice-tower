export type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

export interface DiceConfigEntry {
  faceCount: number;
  label: string;
  mass: number;
  radius: number;
  faceValues: number[];
  fontScale: number;
  isPercentile?: boolean;
}

/** Returns the maximum possible value for a single die of the given type. */
export function getMaxValue(type: DiceType): number {
  if (type === 'd100') return 100;
  return Math.max(...DICE_CONFIGS[type].faceValues);
}

export const DICE_CONFIGS: Record<DiceType, DiceConfigEntry> = {
  d4: {
    faceCount: 4,
    label: 'D4',
    mass: 3,
    radius: 0.6,
    faceValues: [1, 2, 3, 4],
    fontScale: 0.3,
  },
  d6: {
    faceCount: 6,
    label: 'D6',
    mass: 4,
    radius: 0.5,
    faceValues: [4, 3, 2, 5, 6, 1],
    fontScale: 0.4,
  },
  d8: {
    faceCount: 8,
    label: 'D8',
    mass: 3.5,
    radius: 0.55,
    faceValues: [1, 2, 3, 4, 5, 6, 7, 8],
    fontScale: 0.3,
  },
  d10: {
    faceCount: 10,
    label: 'D10',
    mass: 4,
    radius: 0.55,
    faceValues: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    fontScale: 0.35,
  },
  d12: {
    faceCount: 12,
    label: 'D12',
    mass: 4.5,
    radius: 0.6,
    faceValues: [12, 11, 5, 10, 2, 9, 7, 8, 1, 3, 6, 4],
    fontScale: 0.35,
  },
  d20: {
    faceCount: 20,
    label: 'D20',
    mass: 4,
    radius: 0.6,
    faceValues: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    fontScale: 0.22,
  },
  d100: {
    faceCount: 10,
    label: 'D100',
    mass: 4,
    radius: 0.55,
    faceValues: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90],
    fontScale: 0.3,
    isPercentile: true,
  },
};
