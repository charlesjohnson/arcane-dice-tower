// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { PresetStore } from './PresetsPanel';

describe('PresetStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves and retrieves a preset', () => {
    const store = new PresetStore();
    store.save({ name: 'Attack', dice: { d20: 1 } });
    const presets = store.getAll();
    expect(presets).toHaveLength(1);
    expect(presets[0].name).toBe('Attack');
  });

  it('deletes a preset', () => {
    const store = new PresetStore();
    store.save({ name: 'Attack', dice: { d20: 1 } });
    store.save({ name: 'Damage', dice: { d6: 2 } });
    store.delete('Attack');
    expect(store.getAll()).toHaveLength(1);
    expect(store.getAll()[0].name).toBe('Damage');
  });

  it('persists across instances', () => {
    const store1 = new PresetStore();
    store1.save({ name: 'Fireball', dice: { d6: 8 } });

    const store2 = new PresetStore();
    expect(store2.getAll()).toHaveLength(1);
  });
});
