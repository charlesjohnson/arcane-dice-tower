// src/ui/DiceSelector.ts
import * as THREE from 'three';
import type { DiceType } from '../dice/DiceConfig';
import { DICE_CONFIGS } from '../dice/DiceConfig';
import { createDiceGeometry } from '../dice/DiceGeometry';

const DICE_TYPES: DiceType[] = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];

export type DiceSelectionChangeListener = (selection: Map<DiceType, number>) => void;

export class DiceSelector {
  private container: HTMLDivElement;
  private summary: HTMLDivElement;
  private clearAllBtn!: HTMLButtonElement;
  private selection = new Map<DiceType, number>();
  private sharedRenderer: THREE.WebGLRenderer;
  private miniDice: { canvas: HTMLCanvasElement; scene: THREE.Scene; camera: THREE.PerspectiveCamera; mesh: THREE.Mesh }[] = [];
  private listeners: DiceSelectionChangeListener[] = [];

  constructor(uiRoot: HTMLElement) {
    // Single shared WebGL renderer for all mini-dice previews
    const offscreen = document.createElement('canvas');
    this.sharedRenderer = new THREE.WebGLRenderer({ canvas: offscreen, alpha: true, antialias: true, preserveDrawingBuffer: true });
    this.sharedRenderer.setSize(72, 72);
    this.sharedRenderer.setPixelRatio(2);

    this.summary = document.createElement('div');
    this.summary.className = 'roll-summary';
    uiRoot.appendChild(this.summary);

    this.container = document.createElement('div');
    this.container.className = 'dice-selector';
    uiRoot.appendChild(this.container);

    for (const type of DICE_TYPES) {
      this.createDiceButton(type);
    }

    this.clearAllBtn = document.createElement('button');
    this.clearAllBtn.className = 'clear-all-btn hidden';
    this.clearAllBtn.textContent = '\u00d7';
    this.clearAllBtn.addEventListener('click', () => {
      this.selection.clear();
      this.updateDisplay();
      this.emitChange();
    });
    this.container.appendChild(this.clearAllBtn);

    this.setSelection(new Map([['d6' as DiceType, 1]]));
  }

  onChange(listener: DiceSelectionChangeListener): void {
    this.listeners.push(listener);
  }

  getSelection(): Map<DiceType, number> {
    return new Map(this.selection);
  }

  getSelectedDice(): DiceType[] {
    const result: DiceType[] = [];
    for (const [type, count] of this.selection) {
      for (let i = 0; i < count; i++) result.push(type);
    }
    return result;
  }

  clear(): void {
    this.selection.clear();
    this.updateDisplay();
  }

  setSelection(selection: Map<DiceType, number>): void {
    this.selection = new Map(selection);
    this.updateDisplay();
  }

  private createDiceButton(type: DiceType): void {
    const config = DICE_CONFIGS[type];
    const btn = document.createElement('button');
    btn.className = 'dice-btn';

    const miniCanvas = document.createElement('canvas');
    miniCanvas.width = 144;
    miniCanvas.height = 144;
    miniCanvas.style.width = '72px';
    miniCanvas.style.height = '72px';
    btn.appendChild(miniCanvas);

    const label = document.createElement('span');
    label.textContent = config.label;
    btn.appendChild(label);

    const badge = document.createElement('div');
    badge.className = 'count-badge hidden';
    badge.textContent = '0';
    btn.appendChild(badge);

    const minusBtn = document.createElement('div');
    minusBtn.className = 'minus-btn hidden';
    minusBtn.textContent = '\u2212';
    btn.appendChild(minusBtn);

    minusBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const current = this.selection.get(type) || 0;
      if (current > 0) {
        this.selection.set(type, current - 1);
        if (this.selection.get(type) === 0) this.selection.delete(type);
        this.updateDisplay();
        this.emitChange();
      }
    });

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 10);
    camera.position.set(0, 0, 2.5);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 2);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x8855ff, 0.4));

    const geo = createDiceGeometry(type);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x1a1025,
      roughness: 0.3,
      metalness: 0.1,
      emissive: 0x221133,
      emissiveIntensity: 0.5,
    });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    this.miniDice.push({ canvas: miniCanvas, scene, camera, mesh });

    btn.addEventListener('click', () => {
      const current = this.selection.get(type) || 0;
      this.selection.set(type, current + 1);
      this.updateDisplay();
      this.emitChange();
      btn.style.boxShadow = '0 0 20px rgba(136, 85, 255, 0.8)';
      setTimeout(() => { btn.style.boxShadow = ''; }, 300);
    });

    btn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const current = this.selection.get(type) || 0;
      if (current > 0) {
        this.selection.set(type, current - 1);
        if (this.selection.get(type) === 0) this.selection.delete(type);
        this.updateDisplay();
        this.emitChange();
      }
    });

    this.container.appendChild(btn);
  }

  private updateDisplay(): void {
    const badges = this.container.querySelectorAll('.count-badge');
    const minusBtns = this.container.querySelectorAll('.minus-btn');
    let i = 0;
    for (const type of DICE_TYPES) {
      const count = this.selection.get(type) || 0;
      const badge = badges[i] as HTMLElement;
      badge.textContent = String(count);
      badge.classList.toggle('hidden', count === 0);
      const minusBtn = minusBtns[i] as HTMLElement;
      minusBtn.classList.toggle('hidden', count === 0);
      i++;
    }

    const hasAny = this.selection.size > 0;
    this.clearAllBtn.classList.toggle('hidden', !hasAny);

    const parts: string[] = [];
    for (const [type, count] of this.selection) {
      if (count > 0) parts.push(`${count}${type}`);
    }
    this.summary.textContent = parts.length > 0 ? parts.join(' + ') : '';
  }

  private emitChange(): void {
    for (const l of this.listeners) l(this.selection);
  }

  updateMiniDice(time: number): void {
    for (const { canvas, scene, camera, mesh } of this.miniDice) {
      mesh.rotation.x = time * 0.5;
      mesh.rotation.y = time * 0.7;
      mesh.position.y = Math.sin(time * 2) * 0.05;
      this.sharedRenderer.render(scene, camera);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(this.sharedRenderer.domElement, 0, 0);
      }
    }
  }
}
