// src/ui/PresetsPanel.ts
import type { DiceType } from '../dice/DiceConfig';

export interface Preset {
  name: string;
  dice: Partial<Record<DiceType, number>>;
}

const STORAGE_KEY = 'arcane-dice-presets';

export class PresetStore {
  getAll(): Preset[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  }

  save(preset: Preset): void {
    const all = this.getAll();
    all.push(preset);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }

  delete(name: string): void {
    const all = this.getAll().filter((p) => p.name !== name);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }
}

export type PresetSelectedListener = (preset: Preset) => void;

export class PresetsPanel {
  private panel: HTMLDivElement;
  private toggle: HTMLButtonElement;
  private list: HTMLDivElement;
  private store: PresetStore;
  private isOpen = false;
  private listeners: PresetSelectedListener[] = [];
  private saveListeners: ((name: string) => void)[] = [];

  constructor(uiRoot: HTMLElement) {
    this.store = new PresetStore();

    this.toggle = document.createElement('button');
    this.toggle.textContent = '\u2630';
    this.toggle.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 30;
      width: 40px; height: 40px; border-radius: 8px;
      background: rgba(10,10,20,0.7); border: 1px solid rgba(136,85,255,0.3);
      color: #bb99ff; font-size: 20px; cursor: pointer;
      backdrop-filter: blur(10px);
    `;
    this.toggle.addEventListener('click', () => this.togglePanel());
    uiRoot.appendChild(this.toggle);

    this.panel = document.createElement('div');
    this.panel.style.cssText = `
      position: fixed; top: 0; right: -300px; width: 280px; height: 100%;
      background: rgba(10,10,20,0.9); backdrop-filter: blur(15px);
      border-left: 1px solid rgba(136,85,255,0.3); z-index: 25;
      padding: 70px 16px 16px; transition: right 0.3s; overflow-y: auto;
    `;
    uiRoot.appendChild(this.panel);

    const heading = document.createElement('h3');
    heading.textContent = 'Saved Rolls';
    heading.style.cssText = 'color: #bb99ff; margin-bottom: 16px; font-size: 16px;';
    this.panel.appendChild(heading);

    this.list = document.createElement('div');
    this.panel.appendChild(this.list);

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save Current Roll';
    saveBtn.style.cssText = `
      width: 100%; padding: 10px; margin-top: 12px; border-radius: 8px;
      background: rgba(136,85,255,0.2); border: 1px solid rgba(136,85,255,0.4);
      color: #bb99ff; font-size: 14px; cursor: pointer;
    `;
    saveBtn.addEventListener('click', () => {
      const name = prompt('Preset name:');
      if (name && name.trim()) {
        for (const l of this.saveListeners) l(name.trim());
      }
    });
    this.panel.appendChild(saveBtn);

    this.renderPresets();
  }

  onPresetSelected(listener: PresetSelectedListener): void {
    this.listeners.push(listener);
  }

  onSaveRequested(listener: (name: string) => void): void {
    this.saveListeners.push(listener);
  }

  addPreset(name: string, dice: Partial<Record<DiceType, number>>): void {
    this.store.save({ name, dice });
    this.renderPresets();
  }

  private togglePanel(): void {
    this.isOpen = !this.isOpen;
    this.panel.style.right = this.isOpen ? '0' : '-300px';
  }

  private renderPresets(): void {
    this.list.replaceChildren();
    for (const preset of this.store.getAll()) {
      const item = document.createElement('div');
      item.style.cssText = `
        display: flex; justify-content: space-between; align-items: center;
        padding: 10px; margin-bottom: 8px; border-radius: 8px;
        background: rgba(136,85,255,0.1); border: 1px solid rgba(136,85,255,0.2);
        cursor: pointer; transition: background 0.2s;
      `;
      item.addEventListener('mouseenter', () => { item.style.background = 'rgba(136,85,255,0.2)'; });
      item.addEventListener('mouseleave', () => { item.style.background = 'rgba(136,85,255,0.1)'; });

      const info = document.createElement('div');
      const nameEl = document.createElement('div');
      nameEl.style.cssText = 'color:#e0d8c8;font-weight:bold';
      nameEl.textContent = preset.name;
      info.appendChild(nameEl);
      const diceEl = document.createElement('div');
      diceEl.style.cssText = 'color:#8877aa;font-size:12px';
      diceEl.textContent = this.formatDice(preset.dice);
      info.appendChild(diceEl);
      item.appendChild(info);

      const del = document.createElement('button');
      del.textContent = '\u00d7';
      del.style.cssText = 'background:none;border:none;color:#aa5555;font-size:18px;cursor:pointer;';
      del.addEventListener('click', (e) => {
        e.stopPropagation();
        this.store.delete(preset.name);
        this.renderPresets();
      });
      item.appendChild(del);

      item.addEventListener('click', () => {
        for (const l of this.listeners) l(preset);
      });

      this.list.appendChild(item);
    }
  }

  private formatDice(dice: Partial<Record<DiceType, number>>): string {
    return Object.entries(dice)
      .filter(([, count]) => count && count > 0)
      .map(([type, count]) => `${count}${type}`)
      .join(' + ');
  }
}
