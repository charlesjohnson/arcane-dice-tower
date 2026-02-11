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

/**
 * D4 tetrahedron vertex positions (unit vectors matching Three.js TetrahedronGeometry).
 * Scale by radius for world-space positions.
 */
const s = 1 / Math.sqrt(3);
export const D4_VERTEX_POSITIONS = [
  [s, s, s],      // vertex 0
  [-s, -s, s],    // vertex 1
  [-s, s, -s],    // vertex 2
  [s, -s, -s],    // vertex 3
] as const;

/** Value assigned to each tetrahedron vertex (index → die value). */
export const D4_VERTEX_VALUES = [1, 2, 3, 4] as const;

/**
 * For each face (in Three.js TetrahedronGeometry buffer order),
 * the three vertex VALUES displayed on that face.
 * Order: [top UV vertex, bottom-left UV vertex, bottom-right UV vertex].
 */
export const D4_FACE_VERTEX_VALUES: readonly [number, number, number][] = [
  [3, 2, 1],  // Face 0: buffer vertices v2, v1, v0
  [1, 4, 3],  // Face 1: buffer vertices v0, v3, v2
  [2, 4, 1],  // Face 2: buffer vertices v1, v3, v0
  [3, 4, 2],  // Face 3: buffer vertices v2, v3, v1
];

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
    faceValues: [1, 2, 3, 4, 5, 6],
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
    faceValues: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
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
