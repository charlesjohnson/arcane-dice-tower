// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { ResultsDisplay } from './ResultsDisplay';
import type { RollResult } from '../roll/RollOrchestrator';

describe('ResultsDisplay', () => {
  it('shows total as rolled/max format', () => {
    const root = document.createElement('div');
    const display = new ResultsDisplay(root);

    const result: RollResult = {
      dice: [
        { type: 'd6', value: 4 },
        { type: 'd6', value: 5 },
      ],
      total: 9,
      maxTotal: 12,
    };

    display.show(result);

    const totalEl = root.querySelector('.result-total') as HTMLElement;
    expect(totalEl).not.toBeNull();
    expect(totalEl.textContent).toBe('= 9/12 (75%)');
  });

  it('shows correct max for mixed dice', () => {
    const root = document.createElement('div');
    const display = new ResultsDisplay(root);

    const result: RollResult = {
      dice: [
        { type: 'd20', value: 15 },
        { type: 'd6', value: 3 },
      ],
      total: 18,
      maxTotal: 26,
    };

    display.show(result);

    const totalEl = root.querySelector('.result-total') as HTMLElement;
    expect(totalEl.textContent).toBe('= 18/26 (69%)');
  });

  it('rounds percentage down to nearest integer', () => {
    const root = document.createElement('div');
    const display = new ResultsDisplay(root);

    const result: RollResult = {
      dice: [{ type: 'd6', value: 1 }],
      total: 1,
      maxTotal: 6,
    };

    display.show(result);

    const totalEl = root.querySelector('.result-total') as HTMLElement;
    // 1/6 = 16.666...% → 17% rounded
    expect(totalEl.textContent).toBe('= 1/6 (17%)');
  });
});
