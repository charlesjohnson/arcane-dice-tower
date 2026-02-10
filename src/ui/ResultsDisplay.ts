// src/ui/ResultsDisplay.ts
import type { RollResult } from '../roll/RollOrchestrator';
import { DICE_CONFIGS } from '../dice/DiceConfig';

export class ResultsDisplay {
  private container: HTMLDivElement;

  constructor(uiRoot: HTMLElement) {
    this.container = document.createElement('div');
    this.container.className = 'results-bar';
    uiRoot.appendChild(this.container);
  }

  show(result: RollResult): void {
    this.container.innerHTML = '';

    for (const die of result.dice) {
      const item = document.createElement('div');
      item.style.textAlign = 'center';

      const value = document.createElement('div');
      value.className = 'result-value';
      value.textContent = String(die.value);
      item.appendChild(value);

      const label = document.createElement('div');
      label.className = 'result-label';
      label.textContent = DICE_CONFIGS[die.type].label;
      item.appendChild(label);

      this.container.appendChild(item);
    }

    const total = document.createElement('div');
    total.className = 'result-total';
    total.textContent = `= ${result.total}`;
    this.container.appendChild(total);

    this.container.classList.add('visible');
  }

  hide(): void {
    this.container.classList.remove('visible');
  }
}
