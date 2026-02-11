// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { ResultsDisplay } from './ResultsDisplay';
import type { RollResult } from '../roll/RollOrchestrator';

describe('ResultsDisplay', () => {
  function createDisplay() {
    const root = document.createElement('div');
    const display = new ResultsDisplay(root);
    return { display, root };
  }

  it('shows total as rolled/max format', () => {
    const { display, root } = createDisplay();

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
    const { display, root } = createDisplay();

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
    const { display, root } = createDisplay();

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

  it('showRunningTotal displays the subtotal in the results bar', () => {
    const { display, root } = createDisplay();
    display.showRunningTotal(42);

    const bar = root.querySelector('.results-bar') as HTMLElement;
    expect(bar.classList.contains('visible')).toBe(true);
    expect(bar.textContent).toContain('42');
  });

  it('showRunningTotal updates when called again with a higher value', () => {
    const { display, root } = createDisplay();
    display.showRunningTotal(20);
    display.showRunningTotal(55);

    const bar = root.querySelector('.results-bar') as HTMLElement;
    expect(bar.textContent).toContain('55');
    expect(bar.textContent).not.toContain('20');
  });

  it('show() includes subtotal in final total display', () => {
    const { display, root } = createDisplay();
    display.show({
      dice: [{ type: 'd6', value: 4 }, { type: 'd6', value: 3 }],
      total: 49,
      maxTotal: 72,
    });

    const bar = root.querySelector('.results-bar') as HTMLElement;
    expect(bar.querySelector('.result-total')!.textContent).toContain('49');
  });
});
