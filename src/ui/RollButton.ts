// src/ui/RollButton.ts
export class RollButton {
  private button: HTMLButtonElement;
  private onClick: () => void;

  constructor(uiRoot: HTMLElement, onClick: () => void) {
    this.onClick = onClick;
    this.button = document.createElement('button');
    this.button.className = 'roll-btn';
    this.button.textContent = 'Roll';
    this.button.addEventListener('click', () => this.onClick());
    uiRoot.appendChild(this.button);
  }

  setDisabled(disabled: boolean): void {
    this.button.disabled = disabled;
  }
}
