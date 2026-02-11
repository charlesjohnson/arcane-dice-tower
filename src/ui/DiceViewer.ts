import * as THREE from 'three';
import type { DiceType } from '../dice/DiceConfig';
import { DICE_CONFIGS } from '../dice/DiceConfig';
import { createDiceGeometry } from '../dice/DiceGeometry';
import { createDiceMaterial } from '../dice/DiceMaterial';

const DICE_TYPES: DiceType[] = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];

export class DiceViewer {
  private overlay: HTMLDivElement;
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private label: HTMLDivElement;
  private mesh: THREE.Mesh | null = null;
  private currentType: DiceType | null = null;
  private animationId: number | null = null;

  constructor(root: HTMLElement) {
    this.overlay = document.createElement('div');
    this.overlay.className = 'dice-viewer-overlay';
    this.overlay.style.display = 'none';

    this.canvas = document.createElement('canvas');
    this.overlay.appendChild(this.canvas);

    this.label = document.createElement('div');
    this.label.className = 'dice-viewer-label';
    this.overlay.appendChild(this.label);

    root.appendChild(this.overlay);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    this.camera.position.set(0, 0, 3);

    this.scene.add(new THREE.AmbientLight(0x3d2a50, 0.6));
    const key = new THREE.DirectionalLight(0xfff0dd, 1);
    key.position.set(2, 3, 4);
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0x8866bb, 0.4);
    fill.position.set(-2, 1, -1);
    this.scene.add(fill);
  }

  show(type: DiceType): void {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
    }

    const geometry = createDiceGeometry(type);
    const material = createDiceMaterial(type);
    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);

    this.currentType = type;
    this.label.textContent = DICE_CONFIGS[type].label;
    this.overlay.style.display = 'flex';

    this.resize();
    this.startAnimation();
  }

  hide(): void {
    this.overlay.style.display = 'none';
    this.currentType = null;
    this.stopAnimation();
  }

  isOpen(): boolean {
    return this.overlay.style.display !== 'none';
  }

  getCurrentType(): DiceType | null {
    return this.currentType;
  }

  handleKey(key: string): void {
    if (key === 'Escape') {
      if (this.isOpen()) this.hide();
      return;
    }

    const index = parseInt(key, 10) - 1;
    if (isNaN(index) || index < 0 || index >= DICE_TYPES.length) return;

    const type = DICE_TYPES[index];
    if (this.isOpen() && this.currentType === type) {
      this.hide();
    } else {
      this.show(type);
    }
  }

  dispose(): void {
    this.hide();
    if (this.mesh) {
      this.mesh.geometry.dispose();
      const materials = Array.isArray(this.mesh.material) ? this.mesh.material : [this.mesh.material];
      for (const mat of materials) mat.dispose();
    }
    this.renderer.dispose();
    this.overlay.remove();
  }

  private resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private startAnimation(): void {
    if (this.animationId !== null) return;
    const animate = (): void => {
      this.animationId = requestAnimationFrame(animate);
      if (this.mesh) {
        this.mesh.rotation.y += 0.008;
        this.mesh.rotation.x += 0.005;
      }
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  private stopAnimation(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}
