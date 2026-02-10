import { describe, it, expect } from 'vitest';
import { createDiceGeometry } from './DiceGeometry';

describe('createDiceGeometry', () => {
  it('creates a tetrahedron for d4', () => {
    const geo = createDiceGeometry('d4');
    expect(geo.getAttribute('position')).toBeDefined();
  });

  it('creates a cube for d6', () => {
    const geo = createDiceGeometry('d6');
    expect(geo.getAttribute('position')).toBeDefined();
  });

  it('creates an octahedron for d8', () => {
    const geo = createDiceGeometry('d8');
    expect(geo.getAttribute('position')).toBeDefined();
  });

  it('creates a pentagonal trapezohedron for d10', () => {
    const geo = createDiceGeometry('d10');
    expect(geo.getAttribute('position')).toBeDefined();
  });

  it('creates a dodecahedron for d12', () => {
    const geo = createDiceGeometry('d12');
    expect(geo.getAttribute('position')).toBeDefined();
  });

  it('creates an icosahedron for d20', () => {
    const geo = createDiceGeometry('d20');
    expect(geo.getAttribute('position')).toBeDefined();
  });

  it('d100 reuses d10 geometry', () => {
    const geo = createDiceGeometry('d100');
    const d10Geo = createDiceGeometry('d10');
    const positions100 = geo.getAttribute('position');
    const positions10 = d10Geo.getAttribute('position');
    expect(positions100.count).toBe(positions10.count);
  });
});
