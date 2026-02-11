# Dice Viewer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a keyboard-triggered full-screen overlay that displays a single auto-rotating die for visual inspection.

**Architecture:** New `DiceViewer` class in `src/ui/` owns a full-screen overlay div containing its own Three.js canvas/renderer/scene/camera. It creates die meshes using the existing `createDiceGeometry` + `createDiceMaterial` pipeline. Keyboard listener in `main.ts` maps keys 1-7 to die types and delegates to the viewer. The viewer runs its own `requestAnimationFrame` loop only while visible.

**Tech Stack:** Three.js (existing), TypeScript, Vitest with jsdom for UI tests.

---

### Task 1: DiceViewer class — construction and DOM structure

**Files:**
- Create: `src/ui/DiceViewer.ts`
- Test: `src/ui/DiceViewer.test.ts`

**Step 1: Write the failing test**

```typescript
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { DiceViewer } from './DiceViewer';

// Reuse the same WebGL stub from DiceSelector.test.ts
beforeEach(() => {
  // ... (copy the WebGL2 stub from DiceSelector.test.ts)
});

describe('DiceViewer', () => {
  it('creates an overlay div that is hidden by default', () => {
    const root = document.createElement('div');
    new DiceViewer(root);
    const overlay = root.querySelector('.dice-viewer-overlay') as HTMLElement;
    expect(overlay).not.toBeNull();
    expect(overlay.style.display).toBe('none');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/ui/DiceViewer.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

```typescript
// src/ui/DiceViewer.ts
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

    // Lighting
    this.scene.add(new THREE.AmbientLight(0x3d2a50, 0.6));
    const key = new THREE.DirectionalLight(0xfff0dd, 1);
    key.position.set(2, 3, 4);
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0x8866bb, 0.4);
    fill.position.set(-2, 1, -1);
    this.scene.add(fill);
  }

  // ... methods added in subsequent tasks
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/ui/DiceViewer.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/ui/DiceViewer.ts src/ui/DiceViewer.test.ts
git commit -m "feat(dice-viewer): scaffold DiceViewer class with hidden overlay"
```

---

### Task 2: show() and hide() methods

**Files:**
- Modify: `src/ui/DiceViewer.ts`
- Modify: `src/ui/DiceViewer.test.ts`

**Step 1: Write the failing tests**

```typescript
it('show() displays the overlay with the requested die type', () => {
  const root = document.createElement('div');
  const viewer = new DiceViewer(root);
  viewer.show('d6');
  const overlay = root.querySelector('.dice-viewer-overlay') as HTMLElement;
  expect(overlay.style.display).toBe('flex');
});

it('show() updates the label to the die name', () => {
  const root = document.createElement('div');
  const viewer = new DiceViewer(root);
  viewer.show('d20');
  const label = root.querySelector('.dice-viewer-label') as HTMLElement;
  expect(label.textContent).toBe('D20');
});

it('hide() hides the overlay', () => {
  const root = document.createElement('div');
  const viewer = new DiceViewer(root);
  viewer.show('d6');
  viewer.hide();
  const overlay = root.querySelector('.dice-viewer-overlay') as HTMLElement;
  expect(overlay.style.display).toBe('none');
});

it('isOpen() returns true when visible', () => {
  const root = document.createElement('div');
  const viewer = new DiceViewer(root);
  expect(viewer.isOpen()).toBe(false);
  viewer.show('d6');
  expect(viewer.isOpen()).toBe(true);
  viewer.hide();
  expect(viewer.isOpen()).toBe(false);
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/ui/DiceViewer.test.ts`
Expected: FAIL — show/hide/isOpen not defined

**Step 3: Write minimal implementation**

Add to `DiceViewer`:

```typescript
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
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/ui/DiceViewer.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/ui/DiceViewer.ts src/ui/DiceViewer.test.ts
git commit -m "feat(dice-viewer): add show/hide/isOpen methods"
```

---

### Task 3: Animation loop (auto-rotation)

**Files:**
- Modify: `src/ui/DiceViewer.ts`
- Modify: `src/ui/DiceViewer.test.ts`

**Step 1: Write the failing test**

```typescript
it('show() with a different type switches the die without closing', () => {
  const root = document.createElement('div');
  const viewer = new DiceViewer(root);
  viewer.show('d6');
  viewer.show('d20');
  expect(viewer.isOpen()).toBe(true);
  expect(viewer.getCurrentType()).toBe('d20');
  const label = root.querySelector('.dice-viewer-label') as HTMLElement;
  expect(label.textContent).toBe('D20');
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/ui/DiceViewer.test.ts`
Expected: FAIL — getCurrentType not defined (or wrong behavior)

**Step 3: Implement animation and resize**

Add to `DiceViewer`:

```typescript
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
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/ui/DiceViewer.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/ui/DiceViewer.ts src/ui/DiceViewer.test.ts
git commit -m "feat(dice-viewer): animation loop and die switching"
```

---

### Task 4: Keyboard handler

**Files:**
- Modify: `src/ui/DiceViewer.ts`
- Modify: `src/ui/DiceViewer.test.ts`

**Step 1: Write the failing tests**

```typescript
describe('keyboard handling', () => {
  it('handleKey opens the viewer for keys 1-7', () => {
    const root = document.createElement('div');
    const viewer = new DiceViewer(root);
    viewer.handleKey('1');
    expect(viewer.isOpen()).toBe(true);
    expect(viewer.getCurrentType()).toBe('d4');
  });

  it('handleKey maps keys to correct dice types', () => {
    const root = document.createElement('div');
    const viewer = new DiceViewer(root);
    const expected: [string, string][] = [
      ['1', 'd4'], ['2', 'd6'], ['3', 'd8'],
      ['4', 'd10'], ['5', 'd12'], ['6', 'd20'], ['7', 'd100'],
    ];
    for (const [key, type] of expected) {
      viewer.handleKey(key);
      expect(viewer.getCurrentType()).toBe(type);
    }
  });

  it('handleKey with same key toggles off', () => {
    const root = document.createElement('div');
    const viewer = new DiceViewer(root);
    viewer.handleKey('2');
    expect(viewer.isOpen()).toBe(true);
    viewer.handleKey('2');
    expect(viewer.isOpen()).toBe(false);
  });

  it('handleKey with Escape closes the viewer', () => {
    const root = document.createElement('div');
    const viewer = new DiceViewer(root);
    viewer.handleKey('3');
    expect(viewer.isOpen()).toBe(true);
    viewer.handleKey('Escape');
    expect(viewer.isOpen()).toBe(false);
  });

  it('handleKey with different key switches the die', () => {
    const root = document.createElement('div');
    const viewer = new DiceViewer(root);
    viewer.handleKey('1');
    viewer.handleKey('6');
    expect(viewer.isOpen()).toBe(true);
    expect(viewer.getCurrentType()).toBe('d20');
  });

  it('handleKey ignores unrecognized keys', () => {
    const root = document.createElement('div');
    const viewer = new DiceViewer(root);
    viewer.handleKey('a');
    expect(viewer.isOpen()).toBe(false);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/ui/DiceViewer.test.ts`
Expected: FAIL — handleKey not defined

**Step 3: Implement handleKey**

Add to `DiceViewer`:

```typescript
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
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/ui/DiceViewer.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/ui/DiceViewer.ts src/ui/DiceViewer.test.ts
git commit -m "feat(dice-viewer): keyboard handling with toggle and switching"
```

---

### Task 5: Styles

**Files:**
- Modify: `src/ui/UIStyles.ts`

**Step 1: Write the failing test**

No separate test — this is CSS. Verified visually and by existing DOM tests checking class names.

**Step 2: Add overlay styles to `injectStyles()`**

Append to the style string in `UIStyles.ts`:

```css
.dice-viewer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  z-index: 100;
}

.dice-viewer-overlay canvas {
  width: 100%;
  height: 100%;
}

.dice-viewer-label {
  position: absolute;
  bottom: 40px;
  color: #bb99ff;
  font-size: 24px;
  font-weight: bold;
  text-shadow: 0 0 15px rgba(136, 85, 255, 0.5);
  letter-spacing: 2px;
}
```

**Step 3: Run all tests to verify nothing broke**

Run: `npx vitest run`
Expected: All PASS

**Step 4: Commit**

```bash
git add src/ui/UIStyles.ts
git commit -m "feat(dice-viewer): overlay and label styles"
```

---

### Task 6: Wire into main.ts

**Files:**
- Modify: `src/main.ts`

**Step 1: Add import and instantiation**

```typescript
import { DiceViewer } from './ui/DiceViewer.ts';
// After other UI construction:
const diceViewer = new DiceViewer(uiRoot);
```

**Step 2: Add keyboard listener**

```typescript
window.addEventListener('keydown', (e) => {
  diceViewer.handleKey(e.key);
});
```

**Step 3: Run all tests**

Run: `npx vitest run`
Expected: All PASS

**Step 4: Manual smoke test**

Run: `npm run dev`
- Press 1-7 to open viewer for each die
- Verify die auto-rotates showing all faces
- Press same key to close
- Press Escape to close
- Press different key while open to switch

**Step 5: Commit**

```bash
git add src/main.ts
git commit -m "feat(dice-viewer): wire keyboard listener into main"
```

---

### Task 7: Cleanup and dispose

**Files:**
- Modify: `src/ui/DiceViewer.ts`
- Modify: `src/ui/DiceViewer.test.ts`

**Step 1: Write the failing test**

```typescript
it('dispose() removes the overlay from the DOM', () => {
  const root = document.createElement('div');
  const viewer = new DiceViewer(root);
  viewer.dispose();
  expect(root.querySelector('.dice-viewer-overlay')).toBeNull();
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/ui/DiceViewer.test.ts`
Expected: FAIL — dispose not defined

**Step 3: Implement dispose**

```typescript
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
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/ui/DiceViewer.test.ts`
Expected: PASS

**Step 5: Run all tests**

Run: `npx vitest run`
Expected: All PASS

**Step 6: Commit**

```bash
git add src/ui/DiceViewer.ts src/ui/DiceViewer.test.ts
git commit -m "feat(dice-viewer): add dispose method for cleanup"
```
