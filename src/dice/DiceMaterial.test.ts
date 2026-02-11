import { describe, it, expect } from 'vitest';
import { D4_CANVAS_R, D4_INSET, D4_FONT_SCALE } from './DiceMaterial';

/**
 * For an equilateral triangle with circumradius R, the inradius (center to
 * nearest edge) is R/2. A point at fraction f along center→vertex has minimum
 * distance to the nearest edge of: (R/2) * (1 - f).
 *
 * For D4 numbers not to clip, this distance must be >= half the font size.
 */
describe('D4 face texture layout', () => {
  it('numbers are positioned with enough clearance from triangle edges', () => {
    const inradius = D4_CANVAS_R / 2;
    const edgeClearance = inradius * (1 - D4_INSET);
    const halfFont = (256 * D4_FONT_SCALE) / 2;

    expect(edgeClearance).toBeGreaterThanOrEqual(halfFont);
  });
});
