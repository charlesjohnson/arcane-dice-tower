# Arcane Dice Tower — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a physics-driven 3D dice roller PWA with an ivory dice tower, arcane visual effects, and over-the-top magical theming.

**Architecture:** Vanilla TypeScript + Three.js for rendering + Cannon-es for physics. UI is thin HTML/CSS overlays on a full-screen 3D scene. State is managed via a simple event-driven approach — no framework needed.

**Tech Stack:** Vite, TypeScript, Three.js, Cannon-es, Vitest, vite-plugin-pwa

**Design doc:** `docs/plans/2026-02-09-dice-roller-design.md`

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.ts`
- Create: `src/style.css`

**Step 1: Initialize Vite project with TypeScript**

```bash
npm create vite@latest . -- --template vanilla-ts
```

Accept overwriting if prompted. This creates the base project structure.

**Step 2: Install dependencies**

```bash
npm install three cannon-es
npm install -D @types/three vitest vite-plugin-pwa
```

**Step 3: Replace `index.html` with our shell**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
    <title>Arcane Dice Tower</title>
    <link rel="stylesheet" href="/src/style.css" />
  </head>
  <body>
    <canvas id="scene"></canvas>
    <div id="ui-root"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

**Step 4: Replace `src/style.css` with base styles**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #0a0a0f;
  font-family: 'Segoe UI', system-ui, sans-serif;
  color: #e0d8c8;
}

#scene {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

#ui-root {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

#ui-root > * {
  pointer-events: auto;
}
```

**Step 5: Replace `src/main.ts` with a placeholder**

```typescript
import './style.css';

console.log('Arcane Dice Tower initializing...');
```

**Step 6: Update `vite.config.ts`**

```typescript
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
});
```

**Step 7: Verify it runs**

```bash
npx vite --open
```

Expected: Browser opens, black page, console shows "Arcane Dice Tower initializing..."

**Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + TypeScript + Three.js + Cannon-es project"
```

---

## Task 2: Three.js Scene Foundation

**Files:**
- Create: `src/scene/SceneManager.ts`
- Modify: `src/main.ts`

**Step 1: Create SceneManager**

```typescript
// src/scene/SceneManager.ts
import * as THREE from 'three';

export class SceneManager {
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;
  private clock = new THREE.Clock();

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0f);

    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.position.set(0, 5, 12);
    this.camera.lookAt(0, 2, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    this.setupLighting();
    this.setupResizeHandler();
  }

  private setupLighting(): void {
    const ambient = new THREE.AmbientLight(0x2a1a3a, 0.4);
    this.scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xfff0dd, 1.0);
    keyLight.position.set(5, 10, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x8866bb, 0.3);
    fillLight.position.set(-3, 5, -2);
    this.scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xaa88ff, 0.5, 20);
    rimLight.position.set(0, 8, -5);
    this.scene.add(rimLight);
  }

  private setupResizeHandler(): void {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  getDelta(): number {
    return this.clock.getDelta();
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }
}
```

**Step 2: Wire up main.ts with render loop**

```typescript
// src/main.ts
import './style.css';
import { SceneManager } from './scene/SceneManager';

const canvas = document.getElementById('scene') as HTMLCanvasElement;
const sceneManager = new SceneManager(canvas);

// Temporary test cube to verify rendering
import * as THREE from 'three';
const testGeo = new THREE.BoxGeometry(1, 1, 1);
const testMat = new THREE.MeshStandardMaterial({ color: 0xaa88ff });
const testMesh = new THREE.Mesh(testGeo, testMat);
testMesh.position.set(0, 2, 0);
sceneManager.scene.add(testMesh);

function animate(): void {
  requestAnimationFrame(animate);
  const delta = sceneManager.getDelta();
  testMesh.rotation.y += delta * 0.5;
  sceneManager.render();
}

animate();
```

**Step 3: Verify visually**

```bash
npx vite --open
```

Expected: A purple spinning cube in the center of a dark scene with soft lighting.

**Step 4: Commit**

```bash
git add src/scene/SceneManager.ts src/main.ts
git commit -m "feat: add Three.js scene with lighting and render loop"
```

---

## Task 3: Physics World

**Files:**
- Create: `src/physics/PhysicsWorld.ts`
- Create: `src/physics/PhysicsWorld.test.ts`

**Step 1: Write the failing test**

```typescript
// src/physics/PhysicsWorld.test.ts
import { describe, it, expect } from 'vitest';
import { PhysicsWorld } from './PhysicsWorld';

describe('PhysicsWorld', () => {
  it('creates a world with downward gravity', () => {
    const pw = new PhysicsWorld();
    expect(pw.world.gravity.y).toBeLessThan(0);
  });

  it('steps the simulation forward', () => {
    const pw = new PhysicsWorld();
    const initialTime = pw.world.time;
    pw.step(1 / 60);
    expect(pw.world.time).toBeGreaterThan(initialTime);
  });

  it('detects when all bodies are settled', () => {
    const pw = new PhysicsWorld();
    // No bodies = settled
    expect(pw.areBodiesSettled()).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/physics/PhysicsWorld.test.ts
```

Expected: FAIL — module not found.

**Step 3: Implement PhysicsWorld**

```typescript
// src/physics/PhysicsWorld.ts
import * as CANNON from 'cannon-es';

const VELOCITY_THRESHOLD = 0.05;
const ANGULAR_VELOCITY_THRESHOLD = 0.1;

export class PhysicsWorld {
  readonly world: CANNON.World;
  private dynamicBodies: CANNON.Body[] = [];

  constructor() {
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.82, 0),
    });
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    this.world.allowSleep = true;
    this.world.defaultContactMaterial.friction = 0.3;
    this.world.defaultContactMaterial.restitution = 0.3;
  }

  addDynamicBody(body: CANNON.Body): void {
    this.dynamicBodies.push(body);
    this.world.addBody(body);
  }

  addStaticBody(body: CANNON.Body): void {
    this.world.addBody(body);
  }

  removeDynamicBody(body: CANNON.Body): void {
    this.dynamicBodies = this.dynamicBodies.filter((b) => b !== body);
    this.world.removeBody(body);
  }

  clearDynamicBodies(): void {
    for (const body of this.dynamicBodies) {
      this.world.removeBody(body);
    }
    this.dynamicBodies = [];
  }

  step(delta: number): void {
    this.world.step(1 / 60, delta, 3);
  }

  areBodiesSettled(): boolean {
    if (this.dynamicBodies.length === 0) return true;
    return this.dynamicBodies.every((body) => {
      const v = body.velocity;
      const w = body.angularVelocity;
      return (
        v.length() < VELOCITY_THRESHOLD &&
        w.length() < ANGULAR_VELOCITY_THRESHOLD
      );
    });
  }
}
```

**Step 4: Run tests to verify they pass**

```bash
npx vitest run src/physics/PhysicsWorld.test.ts
```

Expected: 3 tests PASS.

**Step 5: Commit**

```bash
git add src/physics/
git commit -m "feat: add physics world with gravity and settle detection"
```

---

## Task 4: Dice Configuration & Geometry

**Files:**
- Create: `src/dice/DiceConfig.ts`
- Create: `src/dice/DiceConfig.test.ts`
- Create: `src/dice/DiceGeometry.ts`
- Create: `src/dice/DiceGeometry.test.ts`

**Step 1: Write failing test for dice config**

```typescript
// src/dice/DiceConfig.test.ts
import { describe, it, expect } from 'vitest';
import { DICE_CONFIGS, DiceType } from './DiceConfig';

describe('DiceConfig', () => {
  it('defines all 7 standard dice types', () => {
    const types: DiceType[] = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];
    for (const t of types) {
      expect(DICE_CONFIGS[t]).toBeDefined();
    }
  });

  it('has correct face counts', () => {
    expect(DICE_CONFIGS.d4.faceCount).toBe(4);
    expect(DICE_CONFIGS.d6.faceCount).toBe(6);
    expect(DICE_CONFIGS.d8.faceCount).toBe(8);
    expect(DICE_CONFIGS.d10.faceCount).toBe(10);
    expect(DICE_CONFIGS.d12.faceCount).toBe(12);
    expect(DICE_CONFIGS.d20.faceCount).toBe(20);
    expect(DICE_CONFIGS.d100.faceCount).toBe(10);
  });

  it('d100 is flagged as percentile', () => {
    expect(DICE_CONFIGS.d100.isPercentile).toBe(true);
    expect(DICE_CONFIGS.d20.isPercentile).toBeUndefined();
  });

  it('each die has mass and size', () => {
    for (const key of Object.keys(DICE_CONFIGS)) {
      const cfg = DICE_CONFIGS[key as DiceType];
      expect(cfg.mass).toBeGreaterThan(0);
      expect(cfg.radius).toBeGreaterThan(0);
    }
  });
});
```

**Step 2: Run to verify failure**

```bash
npx vitest run src/dice/DiceConfig.test.ts
```

Expected: FAIL — module not found.

**Step 3: Implement DiceConfig**

```typescript
// src/dice/DiceConfig.ts
export type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

export interface DiceConfigEntry {
  faceCount: number;
  label: string;
  mass: number;
  radius: number;
  faceValues: number[];
  isPercentile?: boolean;
}

export const DICE_CONFIGS: Record<DiceType, DiceConfigEntry> = {
  d4: {
    faceCount: 4,
    label: 'D4',
    mass: 3,
    radius: 0.6,
    faceValues: [1, 2, 3, 4],
  },
  d6: {
    faceCount: 6,
    label: 'D6',
    mass: 4,
    radius: 0.5,
    faceValues: [1, 2, 3, 4, 5, 6],
  },
  d8: {
    faceCount: 8,
    label: 'D8',
    mass: 3.5,
    radius: 0.55,
    faceValues: [1, 2, 3, 4, 5, 6, 7, 8],
  },
  d10: {
    faceCount: 10,
    label: 'D10',
    mass: 4,
    radius: 0.55,
    faceValues: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  },
  d12: {
    faceCount: 12,
    label: 'D12',
    mass: 4.5,
    radius: 0.6,
    faceValues: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  },
  d20: {
    faceCount: 20,
    label: 'D20',
    mass: 4,
    radius: 0.6,
    faceValues: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
  },
  d100: {
    faceCount: 10,
    label: 'D100',
    mass: 4,
    radius: 0.55,
    faceValues: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90],
    isPercentile: true,
  },
};
```

**Step 4: Run config tests**

```bash
npx vitest run src/dice/DiceConfig.test.ts
```

Expected: PASS.

**Step 5: Write failing test for dice geometry**

```typescript
// src/dice/DiceGeometry.test.ts
import { describe, it, expect } from 'vitest';
import { createDiceGeometry } from './DiceGeometry';

describe('createDiceGeometry', () => {
  it('creates a tetrahedron for d4', () => {
    const geo = createDiceGeometry('d4');
    // Tetrahedron has 4 faces = 12 position values (4 triangles * 3 verts * 3 coords)
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
```

**Step 6: Run to verify failure**

```bash
npx vitest run src/dice/DiceGeometry.test.ts
```

Expected: FAIL.

**Step 7: Implement DiceGeometry**

```typescript
// src/dice/DiceGeometry.ts
import * as THREE from 'three';
import { DiceType, DICE_CONFIGS } from './DiceConfig';

export function createDiceGeometry(type: DiceType): THREE.BufferGeometry {
  const config = DICE_CONFIGS[type];
  const r = config.radius;

  switch (type) {
    case 'd4':
      return new THREE.TetrahedronGeometry(r);
    case 'd6':
      return new THREE.BoxGeometry(r * 1.2, r * 1.2, r * 1.2);
    case 'd8':
      return new THREE.OctahedronGeometry(r);
    case 'd10':
    case 'd100':
      return createD10Geometry(r);
    case 'd12':
      return new THREE.DodecahedronGeometry(r);
    case 'd20':
      return new THREE.IcosahedronGeometry(r);
  }
}

function createD10Geometry(radius: number): THREE.BufferGeometry {
  // Pentagonal trapezohedron: 12 vertices, 10 kite faces (20 triangles)
  const vertices: number[] = [];
  const indices: number[] = [];

  // Top and bottom apex
  vertices.push(0, radius, 0); // index 0: top
  vertices.push(0, -radius, 0); // index 1: bottom

  // 10 middle vertices in a zigzag ring
  const heightOffset = radius * 0.105;
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI * 2) / 10;
    const y = heightOffset * (i % 2 === 0 ? 1 : -1);
    vertices.push(
      Math.cos(angle) * radius,
      y,
      Math.sin(angle) * radius
    );
  }

  // Build faces: each kite = 2 triangles
  for (let i = 0; i < 10; i++) {
    const curr = i + 2;
    const next = ((i + 1) % 10) + 2;

    if (i % 2 === 0) {
      // Even: top apex + curr + next
      indices.push(0, curr, next);
      // Even: curr + bottom apex + next
      indices.push(curr, 1, next);
    } else {
      // Odd: curr + top apex + next
      indices.push(curr, 0, next);
      // Odd: bottom apex + curr + next
      indices.push(1, curr, next);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(vertices, 3)
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
```

**Step 8: Run geometry tests**

```bash
npx vitest run src/dice/DiceGeometry.test.ts
```

Expected: PASS.

**Step 9: Commit**

```bash
git add src/dice/
git commit -m "feat: add dice configuration and geometry for all standard D&D dice"
```

---

## Task 5: Dice Material & Face Textures

**Files:**
- Create: `src/dice/DiceMaterial.ts`

**Step 1: Implement dice material with canvas-based face textures**

```typescript
// src/dice/DiceMaterial.ts
import * as THREE from 'three';
import { DiceType, DICE_CONFIGS } from './DiceConfig';

const CANVAS_SIZE = 256;

function createFaceTexture(value: number | string, dieType: DiceType): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext('2d')!;

  // Dark obsidian background
  ctx.fillStyle = '#1a1025';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  // Glowing number
  const text = String(value);
  ctx.font = `bold ${CANVAS_SIZE * 0.4}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Outer glow
  ctx.shadowColor = '#8855ff';
  ctx.shadowBlur = 20;
  ctx.fillStyle = '#bb99ff';
  ctx.fillText(text, CANVAS_SIZE / 2, CANVAS_SIZE / 2);

  // Inner crisp text
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#e8ddf8';
  ctx.fillText(text, CANVAS_SIZE / 2, CANVAS_SIZE / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function createDiceMaterial(type: DiceType): THREE.Material | THREE.Material[] {
  const config = DICE_CONFIGS[type];

  if (type === 'd6') {
    // BoxGeometry uses 6 materials, one per face
    return config.faceValues.map((val) => {
      return new THREE.MeshStandardMaterial({
        map: createFaceTexture(val, type),
        roughness: 0.2,
        metalness: 0.1,
        emissive: new THREE.Color(0x221133),
        emissiveIntensity: 0.3,
      });
    });
  }

  // For polyhedra, use a single material with a composite texture
  // The face-value mapping will be handled by UV mapping or face identification
  return new THREE.MeshStandardMaterial({
    color: 0x1a1025,
    roughness: 0.2,
    metalness: 0.1,
    emissive: new THREE.Color(0x221133),
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.9,
  });
}
```

**Step 2: Verify visually by temporarily adding a die to main.ts**

Replace the test cube in `src/main.ts` with:

```typescript
import { createDiceGeometry } from './dice/DiceGeometry';
import { createDiceMaterial } from './dice/DiceMaterial';

const geo = createDiceGeometry('d20');
const mat = createDiceMaterial('d20');
const mesh = new THREE.Mesh(geo, mat);
mesh.position.set(0, 2, 0);
sceneManager.scene.add(mesh);
```

```bash
npx vite --open
```

Expected: A dark semi-translucent icosahedron visible in the scene.

**Step 3: Commit**

```bash
git add src/dice/DiceMaterial.ts src/main.ts
git commit -m "feat: add dice materials with emissive glow"
```

---

## Task 6: Dice Physics Bodies & Result Reading

**Files:**
- Create: `src/dice/DiceBody.ts`
- Create: `src/dice/DiceResult.ts`
- Create: `src/dice/DiceResult.test.ts`

**Step 1: Write failing test for result reading**

```typescript
// src/dice/DiceResult.test.ts
import { describe, it, expect } from 'vitest';
import { findUpwardFaceIndex } from './DiceResult';
import * as THREE from 'three';

describe('findUpwardFaceIndex', () => {
  it('identifies the top face of a box at identity rotation', () => {
    // A box at identity rotation: face normals are along axes
    // The +Y face should be "up"
    const normals = [
      new THREE.Vector3(1, 0, 0),   // +X
      new THREE.Vector3(-1, 0, 0),  // -X
      new THREE.Vector3(0, 1, 0),   // +Y  <-- this is up
      new THREE.Vector3(0, -1, 0),  // -Y
      new THREE.Vector3(0, 0, 1),   // +Z
      new THREE.Vector3(0, 0, -1),  // -Z
    ];
    const quaternion = new THREE.Quaternion(); // identity
    const result = findUpwardFaceIndex(normals, quaternion);
    expect(result).toBe(2); // +Y face
  });

  it('identifies the top face after rotation', () => {
    const normals = [
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0, -1),
    ];
    // Rotate 90 degrees around Z axis: +X becomes +Y
    const quaternion = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 0, 1),
      Math.PI / 2
    );
    const result = findUpwardFaceIndex(normals, quaternion);
    expect(result).toBe(0); // +X face is now pointing up
  });
});
```

**Step 2: Run to verify failure**

```bash
npx vitest run src/dice/DiceResult.test.ts
```

Expected: FAIL.

**Step 3: Implement DiceResult**

```typescript
// src/dice/DiceResult.ts
import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);

export function findUpwardFaceIndex(
  faceNormals: THREE.Vector3[],
  quaternion: THREE.Quaternion
): number {
  let bestIndex = 0;
  let bestDot = -Infinity;

  for (let i = 0; i < faceNormals.length; i++) {
    const rotatedNormal = faceNormals[i].clone().applyQuaternion(quaternion);
    const dot = rotatedNormal.dot(UP);
    if (dot > bestDot) {
      bestDot = dot;
      bestIndex = i;
    }
  }

  return bestIndex;
}
```

**Step 4: Run tests**

```bash
npx vitest run src/dice/DiceResult.test.ts
```

Expected: PASS.

**Step 5: Implement DiceBody**

```typescript
// src/dice/DiceBody.ts
import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { DiceType, DICE_CONFIGS } from './DiceConfig';

export function createDiceBody(type: DiceType): CANNON.Body {
  const config = DICE_CONFIGS[type];
  const actualType = type === 'd100' ? 'd10' : type;

  const body = new CANNON.Body({
    mass: config.mass,
    shape: createCollisionShape(actualType, config.radius),
    material: new CANNON.Material({
      friction: 0.4,
      restitution: 0.3,
    }),
    linearDamping: 0.1,
    angularDamping: 0.1,
  });

  body.allowSleep = true;
  body.sleepSpeedLimit = 0.05;
  body.sleepTimeLimit = 0.5;

  return body;
}

function createCollisionShape(type: DiceType, radius: number): CANNON.Shape {
  if (type === 'd6') {
    const half = (radius * 1.2) / 2;
    return new CANNON.Box(new CANNON.Vec3(half, half, half));
  }

  // For all other dice, approximate with a sphere
  // (ConvexPolyhedron for exact shapes can be added later for precision)
  return new CANNON.Sphere(radius);
}

export function applyRandomRollForce(body: CANNON.Body): void {
  const angX = (Math.random() - 0.5) * 20;
  const angY = (Math.random() - 0.5) * 20;
  const angZ = (Math.random() - 0.5) * 20;
  body.angularVelocity.set(angX, angY, angZ);

  // Slight random horizontal offset
  const offsetX = (Math.random() - 0.5) * 0.5;
  const offsetZ = (Math.random() - 0.5) * 0.5;
  body.position.x += offsetX;
  body.position.z += offsetZ;
}
```

**Step 6: Commit**

```bash
git add src/dice/DiceBody.ts src/dice/DiceResult.ts src/dice/DiceResult.test.ts
git commit -m "feat: add dice physics bodies and result reading via face normals"
```

---

## Task 7: Dice Tower Structure

**Files:**
- Create: `src/tower/TowerBuilder.ts`
- Modify: `src/main.ts`

**Step 1: Implement tower builder**

```typescript
// src/tower/TowerBuilder.ts
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { PhysicsWorld } from '../physics/PhysicsWorld';

const TOWER_HEIGHT = 8;
const TOWER_RADIUS = 1.5;
const TRAY_WIDTH = 3;
const TRAY_DEPTH = 2.5;
const WALL_THICKNESS = 0.15;

export interface Tower {
  group: THREE.Group;
  baffles: THREE.Mesh[];
  runeGlowMeshes: THREE.Mesh[];
  trayFloorY: number;
  dropPosition: THREE.Vector3;
}

export function buildTower(
  scene: THREE.Scene,
  physics: PhysicsWorld
): Tower {
  const group = new THREE.Group();
  const baffles: THREE.Mesh[] = [];
  const runeGlowMeshes: THREE.Mesh[] = [];

  const ivoryMaterial = new THREE.MeshStandardMaterial({
    color: 0xfff8ee,
    roughness: 0.15,
    metalness: 0.05,
    envMapIntensity: 1.0,
  });

  const trayMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a0a2e,
    roughness: 0.9,
    metalness: 0.0,
  });

  const runeGlowMaterial = new THREE.MeshStandardMaterial({
    color: 0xddaa44,
    emissive: 0xddaa44,
    emissiveIntensity: 0.8,
    transparent: true,
    opacity: 0.6,
  });

  // --- Tower body: back + side walls (front is open / cutaway) ---
  // Back wall
  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(TOWER_RADIUS * 2, TOWER_HEIGHT, WALL_THICKNESS),
    ivoryMaterial
  );
  backWall.position.set(0, TOWER_HEIGHT / 2, -TOWER_RADIUS);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  group.add(backWall);

  // Left wall
  const sideWall = new THREE.BoxGeometry(WALL_THICKNESS, TOWER_HEIGHT, TOWER_RADIUS * 2);
  const leftWall = new THREE.Mesh(sideWall, ivoryMaterial);
  leftWall.position.set(-TOWER_RADIUS, TOWER_HEIGHT / 2, 0);
  leftWall.castShadow = true;
  group.add(leftWall);

  // Right wall
  const rightWall = new THREE.Mesh(sideWall.clone(), ivoryMaterial);
  rightWall.position.set(TOWER_RADIUS, TOWER_HEIGHT / 2, 0);
  rightWall.castShadow = true;
  group.add(rightWall);

  // --- Rune strips along edges ---
  const runeStripGeo = new THREE.BoxGeometry(0.05, TOWER_HEIGHT, 0.05);
  const edgePositions = [
    [-TOWER_RADIUS, TOWER_HEIGHT / 2, -TOWER_RADIUS],
    [TOWER_RADIUS, TOWER_HEIGHT / 2, -TOWER_RADIUS],
    [-TOWER_RADIUS, TOWER_HEIGHT / 2, TOWER_RADIUS],
    [TOWER_RADIUS, TOWER_HEIGHT / 2, TOWER_RADIUS],
  ];
  for (const [x, y, z] of edgePositions) {
    const rune = new THREE.Mesh(runeStripGeo, runeGlowMaterial.clone());
    rune.position.set(x, y, z);
    group.add(rune);
    runeGlowMeshes.push(rune);
  }

  // --- Internal baffles (angled shelves) ---
  const baffleGeo = new THREE.BoxGeometry(TOWER_RADIUS * 1.6, 0.1, TOWER_RADIUS * 1.2);
  const bafflePositions = [
    { x: 0.4, y: 6.5, z: -0.2, rotZ: -0.3 },
    { x: -0.4, y: 5.0, z: -0.2, rotZ: 0.3 },
    { x: 0.3, y: 3.5, z: -0.2, rotZ: -0.25 },
    { x: -0.3, y: 2.0, z: -0.2, rotZ: 0.25 },
  ];

  for (const bp of bafflePositions) {
    const baffle = new THREE.Mesh(baffleGeo, ivoryMaterial.clone());
    baffle.position.set(bp.x, bp.y, bp.z);
    baffle.rotation.z = bp.rotZ;
    baffle.castShadow = true;
    baffle.receiveShadow = true;
    group.add(baffle);
    baffles.push(baffle);

    // Physics collider for baffle
    const halfExtents = new CANNON.Vec3(
      TOWER_RADIUS * 0.8,
      0.05,
      TOWER_RADIUS * 0.6
    );
    const baffleBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(halfExtents),
    });
    baffleBody.position.set(bp.x, bp.y, bp.z);
    baffleBody.quaternion.setFromEuler(0, 0, bp.rotZ);
    physics.addStaticBody(baffleBody);
  }

  // --- Tray ---
  const trayFloorY = 0.1;

  // Tray floor
  const trayFloor = new THREE.Mesh(
    new THREE.BoxGeometry(TRAY_WIDTH, 0.1, TRAY_DEPTH),
    trayMaterial
  );
  trayFloor.position.set(0, trayFloorY, TOWER_RADIUS + TRAY_DEPTH / 2);
  trayFloor.receiveShadow = true;
  group.add(trayFloor);

  // Tray floor physics
  const floorBody = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(TRAY_WIDTH / 2, 0.05, TRAY_DEPTH / 2)),
  });
  floorBody.position.set(0, trayFloorY, TOWER_RADIUS + TRAY_DEPTH / 2);
  physics.addStaticBody(floorBody);

  // Tray walls (left, right, back)
  const trayWallGeo = new THREE.BoxGeometry(WALL_THICKNESS, 0.6, TRAY_DEPTH);
  const leftTrayWall = new THREE.Mesh(trayWallGeo, ivoryMaterial);
  leftTrayWall.position.set(-TRAY_WIDTH / 2, trayFloorY + 0.3, TOWER_RADIUS + TRAY_DEPTH / 2);
  group.add(leftTrayWall);

  const rightTrayWall = new THREE.Mesh(trayWallGeo.clone(), ivoryMaterial);
  rightTrayWall.position.set(TRAY_WIDTH / 2, trayFloorY + 0.3, TOWER_RADIUS + TRAY_DEPTH / 2);
  group.add(rightTrayWall);

  const backTrayWall = new THREE.Mesh(
    new THREE.BoxGeometry(TRAY_WIDTH, 0.6, WALL_THICKNESS),
    ivoryMaterial
  );
  backTrayWall.position.set(0, trayFloorY + 0.3, TOWER_RADIUS + TRAY_DEPTH);
  group.add(backTrayWall);

  // Tray wall physics
  const trayWallPositions = [
    { pos: [-TRAY_WIDTH / 2, trayFloorY + 0.3, TOWER_RADIUS + TRAY_DEPTH / 2], half: [WALL_THICKNESS / 2, 0.3, TRAY_DEPTH / 2] },
    { pos: [TRAY_WIDTH / 2, trayFloorY + 0.3, TOWER_RADIUS + TRAY_DEPTH / 2], half: [WALL_THICKNESS / 2, 0.3, TRAY_DEPTH / 2] },
    { pos: [0, trayFloorY + 0.3, TOWER_RADIUS + TRAY_DEPTH], half: [TRAY_WIDTH / 2, 0.3, WALL_THICKNESS / 2] },
  ];
  for (const tw of trayWallPositions) {
    const wallBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(new CANNON.Vec3(...tw.half as [number, number, number])),
    });
    wallBody.position.set(...tw.pos as [number, number, number]);
    physics.addStaticBody(wallBody);
  }

  // Tower interior wall physics (back + sides)
  const backBody = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(TOWER_RADIUS, TOWER_HEIGHT / 2, WALL_THICKNESS / 2)),
  });
  backBody.position.set(0, TOWER_HEIGHT / 2, -TOWER_RADIUS);
  physics.addStaticBody(backBody);

  const sideHalf = new CANNON.Vec3(WALL_THICKNESS / 2, TOWER_HEIGHT / 2, TOWER_RADIUS);
  const leftBody = new CANNON.Body({ mass: 0, shape: new CANNON.Box(sideHalf) });
  leftBody.position.set(-TOWER_RADIUS, TOWER_HEIGHT / 2, 0);
  physics.addStaticBody(leftBody);

  const rightBody = new CANNON.Body({ mass: 0, shape: new CANNON.Box(sideHalf) });
  rightBody.position.set(TOWER_RADIUS, TOWER_HEIGHT / 2, 0);
  physics.addStaticBody(rightBody);

  scene.add(group);

  return {
    group,
    baffles,
    runeGlowMeshes,
    trayFloorY,
    dropPosition: new THREE.Vector3(0, TOWER_HEIGHT + 1, 0),
  };
}
```

**Step 2: Update main.ts to show the tower**

Replace the temporary die visual test in `src/main.ts`:

```typescript
// src/main.ts
import './style.css';
import { SceneManager } from './scene/SceneManager';
import { PhysicsWorld } from './physics/PhysicsWorld';
import { buildTower } from './tower/TowerBuilder';

const canvas = document.getElementById('scene') as HTMLCanvasElement;
const sceneManager = new SceneManager(canvas);
const physics = new PhysicsWorld();

const tower = buildTower(sceneManager.scene, physics);

function animate(): void {
  requestAnimationFrame(animate);
  const delta = sceneManager.getDelta();
  physics.step(delta);
  sceneManager.render();
}

animate();
```

**Step 3: Verify visually**

```bash
npx vite --open
```

Expected: Ivory-colored tower structure visible with cutaway front, glowing rune strips on edges, dark tray at the base.

**Step 4: Commit**

```bash
git add src/tower/TowerBuilder.ts src/main.ts
git commit -m "feat: add ivory dice tower with baffles, tray, and physics colliders"
```

---

## Task 8: Roll Orchestrator (Dice Dropping End-to-End)

**Files:**
- Create: `src/roll/RollOrchestrator.ts`
- Modify: `src/main.ts`

**Step 1: Implement RollOrchestrator**

```typescript
// src/roll/RollOrchestrator.ts
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { DiceType, DICE_CONFIGS } from '../dice/DiceConfig';
import { createDiceGeometry } from '../dice/DiceGeometry';
import { createDiceMaterial } from '../dice/DiceMaterial';
import { createDiceBody, applyRandomRollForce } from '../dice/DiceBody';
import { findUpwardFaceIndex } from '../dice/DiceResult';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { Tower } from '../tower/TowerBuilder';

export interface DieInstance {
  mesh: THREE.Mesh;
  body: CANNON.Body;
  type: DiceType;
  result: number | null;
}

export type RollState = 'idle' | 'rolling' | 'settled';

export interface RollResult {
  dice: { type: DiceType; value: number }[];
  total: number;
}

type RollListener = (state: RollState, result?: RollResult) => void;

export class RollOrchestrator {
  private scene: THREE.Scene;
  private physics: PhysicsWorld;
  private tower: Tower;
  private activeDice: DieInstance[] = [];
  private state: RollState = 'idle';
  private settleCheckTimer = 0;
  private listeners: RollListener[] = [];

  constructor(scene: THREE.Scene, physics: PhysicsWorld, tower: Tower) {
    this.scene = scene;
    this.physics = physics;
    this.tower = tower;
  }

  onStateChange(listener: RollListener): void {
    this.listeners.push(listener);
  }

  private emit(state: RollState, result?: RollResult): void {
    this.state = state;
    for (const l of this.listeners) l(state, result);
  }

  roll(diceList: DiceType[]): void {
    if (this.state === 'rolling') return;

    // Clear previous dice
    this.clearDice();
    this.emit('rolling');

    // Spawn each die above the tower with staggered timing
    for (let i = 0; i < diceList.length; i++) {
      const type = diceList[i];
      const geo = createDiceGeometry(type);
      const mat = createDiceMaterial(type);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const body = createDiceBody(type);
      const drop = this.tower.dropPosition;
      body.position.set(
        drop.x + (Math.random() - 0.5) * 0.5,
        drop.y + i * 0.5,
        drop.z + (Math.random() - 0.5) * 0.3
      );
      applyRandomRollForce(body);

      this.scene.add(mesh);
      this.physics.addDynamicBody(body);

      this.activeDice.push({ mesh, body, type, result: null });
    }

    this.settleCheckTimer = 0;
  }

  update(delta: number): void {
    // Sync Three.js meshes to Cannon-es bodies
    for (const die of this.activeDice) {
      die.mesh.position.copy(die.body.position as unknown as THREE.Vector3);
      die.mesh.quaternion.copy(die.body.quaternion as unknown as THREE.Quaternion);
    }

    if (this.state !== 'rolling') return;

    this.settleCheckTimer += delta;
    if (this.settleCheckTimer < 1.0) return; // Wait at least 1 second

    if (this.physics.areBodiesSettled()) {
      this.readResults();
    }
  }

  private readResults(): void {
    const results: { type: DiceType; value: number }[] = [];
    let total = 0;

    for (const die of this.activeDice) {
      const config = DICE_CONFIGS[die.type];
      // For simple result reading, use the physics body's orientation
      // Build face normals from the geometry
      const geo = die.mesh.geometry;
      const faceNormals = this.extractFaceNormals(geo, config.faceCount);
      const quat = new THREE.Quaternion(
        die.body.quaternion.x,
        die.body.quaternion.y,
        die.body.quaternion.z,
        die.body.quaternion.w
      );
      const faceIndex = findUpwardFaceIndex(faceNormals, quat);
      const value = config.faceValues[faceIndex % config.faceValues.length];
      die.result = value;
      results.push({ type: die.type, value });
      total += value;
    }

    // Handle D100: find the tens die and units die, combine them
    // D100 pairs will be handled at a higher level if needed

    this.emit('settled', { dice: results, total });
  }

  private extractFaceNormals(
    geo: THREE.BufferGeometry,
    faceCount: number
  ): THREE.Vector3[] {
    // Compute face normals from geometry
    geo.computeVertexNormals();
    const normals: THREE.Vector3[] = [];
    const normal = geo.getAttribute('normal');
    const position = geo.getAttribute('position');
    const index = geo.getIndex();

    if (index) {
      // Indexed geometry: compute per-face normals
      const trianglesPerFace = Math.max(1, Math.floor(index.count / 3 / faceCount));
      for (let f = 0; f < faceCount; f++) {
        const triIdx = f * trianglesPerFace;
        const i0 = index.getX(triIdx * 3);
        const i1 = index.getX(triIdx * 3 + 1);
        const i2 = index.getX(triIdx * 3 + 2);

        const v0 = new THREE.Vector3().fromBufferAttribute(position, i0);
        const v1 = new THREE.Vector3().fromBufferAttribute(position, i1);
        const v2 = new THREE.Vector3().fromBufferAttribute(position, i2);

        const faceNormal = new THREE.Vector3()
          .crossVectors(
            new THREE.Vector3().subVectors(v1, v0),
            new THREE.Vector3().subVectors(v2, v0)
          )
          .normalize();
        normals.push(faceNormal);
      }
    } else {
      // Non-indexed: every 3 vertices = 1 triangle
      const trianglesPerFace = Math.max(1, Math.floor(position.count / 3 / faceCount));
      for (let f = 0; f < faceCount; f++) {
        const vIdx = f * trianglesPerFace * 3;
        const v0 = new THREE.Vector3().fromBufferAttribute(position, vIdx);
        const v1 = new THREE.Vector3().fromBufferAttribute(position, vIdx + 1);
        const v2 = new THREE.Vector3().fromBufferAttribute(position, vIdx + 2);

        const faceNormal = new THREE.Vector3()
          .crossVectors(
            new THREE.Vector3().subVectors(v1, v0),
            new THREE.Vector3().subVectors(v2, v0)
          )
          .normalize();
        normals.push(faceNormal);
      }
    }

    return normals;
  }

  private clearDice(): void {
    for (const die of this.activeDice) {
      this.scene.remove(die.mesh);
      die.mesh.geometry.dispose();
    }
    this.physics.clearDynamicBodies();
    this.activeDice = [];
  }

  getState(): RollState {
    return this.state;
  }
}
```

**Step 2: Wire into main.ts with a temporary keyboard trigger**

```typescript
// src/main.ts
import './style.css';
import { SceneManager } from './scene/SceneManager';
import { PhysicsWorld } from './physics/PhysicsWorld';
import { buildTower } from './tower/TowerBuilder';
import { RollOrchestrator } from './roll/RollOrchestrator';
import { DiceType } from './dice/DiceConfig';

const canvas = document.getElementById('scene') as HTMLCanvasElement;
const sceneManager = new SceneManager(canvas);
const physics = new PhysicsWorld();
const tower = buildTower(sceneManager.scene, physics);
const orchestrator = new RollOrchestrator(sceneManager.scene, physics, tower);

orchestrator.onStateChange((state, result) => {
  if (state === 'settled' && result) {
    console.log('Roll result:', result.dice.map((d) => `${d.type}=${d.value}`).join(', '));
    console.log('Total:', result.total);
  }
});

// Temporary: press space to roll 2d6 + 1d20
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && orchestrator.getState() !== 'rolling') {
    const dice: DiceType[] = ['d6', 'd6', 'd20'];
    orchestrator.roll(dice);
  }
});

function animate(): void {
  requestAnimationFrame(animate);
  const delta = sceneManager.getDelta();
  physics.step(delta);
  orchestrator.update(delta);
  sceneManager.render();
}

animate();
```

**Step 3: Verify by pressing Space**

```bash
npx vite --open
```

Expected: Pressing Space drops 3 dice into the tower, they tumble through baffles, land in the tray, and results appear in the console.

**Step 4: Commit**

```bash
git add src/roll/RollOrchestrator.ts src/main.ts
git commit -m "feat: add roll orchestrator — dice drop through tower end-to-end"
```

---

## Task 9: Camera Animation System

**Files:**
- Create: `src/scene/CameraDirector.ts`
- Modify: `src/main.ts`

**Step 1: Implement CameraDirector**

```typescript
// src/scene/CameraDirector.ts
import * as THREE from 'three';

interface CameraKeyframe {
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
  time: number; // normalized 0-1
}

export class CameraDirector {
  private camera: THREE.PerspectiveCamera;
  private idlePosition = new THREE.Vector3(0, 5, 12);
  private idleLookAt = new THREE.Vector3(0, 3, 0);
  private keyframes: CameraKeyframe[] = [];
  private progress = 0;
  private duration = 0;
  private active = false;
  private currentLookAt = new THREE.Vector3();

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.currentLookAt.copy(this.idleLookAt);
  }

  playRollSequence(towerTopY: number, trayY: number): void {
    this.keyframes = [
      // Wide shot: see the whole tower
      { position: new THREE.Vector3(0, towerTopY + 2, 10), lookAt: new THREE.Vector3(0, towerTopY, 0), time: 0 },
      // Follow dice down the interior
      { position: new THREE.Vector3(3, towerTopY * 0.6, 6), lookAt: new THREE.Vector3(0, towerTopY * 0.5, 0), time: 0.3 },
      // Watch dice exit into tray
      { position: new THREE.Vector3(2, trayY + 3, 7), lookAt: new THREE.Vector3(0, trayY + 1, 2), time: 0.6 },
      // Zoom in on settled dice in tray
      { position: new THREE.Vector3(0, trayY + 4, 5), lookAt: new THREE.Vector3(0, trayY + 0.5, 2.5), time: 1.0 },
    ];
    this.duration = 3.0; // seconds
    this.progress = 0;
    this.active = true;
  }

  returnToIdle(): void {
    this.keyframes = [
      {
        position: this.camera.position.clone(),
        lookAt: this.currentLookAt.clone(),
        time: 0,
      },
      {
        position: this.idlePosition.clone(),
        lookAt: this.idleLookAt.clone(),
        time: 1.0,
      },
    ];
    this.duration = 1.5;
    this.progress = 0;
    this.active = true;
  }

  update(delta: number): void {
    if (!this.active || this.keyframes.length < 2) return;

    this.progress += delta / this.duration;
    if (this.progress >= 1) {
      this.progress = 1;
      this.active = false;
    }

    const t = this.easeInOut(this.progress);

    // Find the two keyframes we're between
    let fromIdx = 0;
    for (let i = 0; i < this.keyframes.length - 1; i++) {
      if (t >= this.keyframes[i].time && t <= this.keyframes[i + 1].time) {
        fromIdx = i;
        break;
      }
    }

    const from = this.keyframes[fromIdx];
    const to = this.keyframes[fromIdx + 1];
    const segmentT = (t - from.time) / (to.time - from.time);
    const smoothT = this.easeInOut(segmentT);

    this.camera.position.lerpVectors(from.position, to.position, smoothT);
    this.currentLookAt.lerpVectors(from.lookAt, to.lookAt, smoothT);
    this.camera.lookAt(this.currentLookAt);
  }

  private easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  isActive(): boolean {
    return this.active;
  }
}
```

**Step 2: Wire into main.ts**

Add to `src/main.ts` after orchestrator setup:

```typescript
import { CameraDirector } from './scene/CameraDirector';

const cameraDirector = new CameraDirector(sceneManager.camera);

orchestrator.onStateChange((state, result) => {
  if (state === 'rolling') {
    cameraDirector.playRollSequence(tower.dropPosition.y, tower.trayFloorY);
  } else if (state === 'settled' && result) {
    console.log('Roll result:', result.dice.map((d) => `${d.type}=${d.value}`).join(', '));
    console.log('Total:', result.total);
    // Return to idle after a delay
    setTimeout(() => cameraDirector.returnToIdle(), 2000);
  }
});
```

And add `cameraDirector.update(delta);` to the animate loop.

**Step 3: Verify visually — camera should track dice through tower**

```bash
npx vite --open
```

Expected: Camera follows dice down the tower and zooms to tray on settle.

**Step 4: Commit**

```bash
git add src/scene/CameraDirector.ts src/main.ts
git commit -m "feat: add cinematic camera director for roll sequences"
```

---

## Task 10: Particle Effects System

**Files:**
- Create: `src/effects/ParticleSystem.ts`
- Create: `src/effects/EffectsManager.ts`

**Step 1: Implement ParticleSystem**

```typescript
// src/effects/ParticleSystem.ts
import * as THREE from 'three';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
  color: THREE.Color;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private points: THREE.Points;
  private maxParticles: number;

  constructor(scene: THREE.Scene, maxParticles = 500) {
    this.maxParticles = maxParticles;
    this.geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(maxParticles * 3);
    const colors = new Float32Array(maxParticles * 3);
    const sizes = new Float32Array(maxParticles);

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    this.material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    scene.add(this.points);
  }

  emit(
    origin: THREE.Vector3,
    count: number,
    options: {
      color?: THREE.Color;
      speed?: number;
      life?: number;
      spread?: number;
      size?: number;
    } = {}
  ): void {
    const {
      color = new THREE.Color(0xddaa44),
      speed = 3,
      life = 1.0,
      spread = 1,
      size = 0.08,
    } = options;

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;

      this.particles.push({
        position: origin.clone(),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * spread * speed,
          (Math.random() - 0.5) * spread * speed,
          (Math.random() - 0.5) * spread * speed
        ),
        life,
        maxLife: life,
        size,
        color: color.clone(),
      });
    }
  }

  update(delta: number): void {
    // Update particles
    this.particles = this.particles.filter((p) => {
      p.life -= delta;
      if (p.life <= 0) return false;

      p.position.add(p.velocity.clone().multiplyScalar(delta));
      p.velocity.y -= 2 * delta; // gentle gravity
      return true;
    });

    // Write to buffers
    const positions = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    const colors = this.geometry.getAttribute('color') as THREE.BufferAttribute;
    const sizes = this.geometry.getAttribute('size') as THREE.BufferAttribute;

    for (let i = 0; i < this.maxParticles; i++) {
      if (i < this.particles.length) {
        const p = this.particles[i];
        const fadeRatio = p.life / p.maxLife;
        positions.setXYZ(i, p.position.x, p.position.y, p.position.z);
        colors.setXYZ(i, p.color.r * fadeRatio, p.color.g * fadeRatio, p.color.b * fadeRatio);
        sizes.setX(i, p.size * fadeRatio);
      } else {
        positions.setXYZ(i, 0, -100, 0); // hide unused
        sizes.setX(i, 0);
      }
    }

    positions.needsUpdate = true;
    colors.needsUpdate = true;
    sizes.needsUpdate = true;
    this.geometry.setDrawRange(0, this.particles.length);
  }
}
```

**Step 2: Implement EffectsManager**

```typescript
// src/effects/EffectsManager.ts
import * as THREE from 'three';
import { ParticleSystem } from './ParticleSystem';
import { Tower } from '../tower/TowerBuilder';

export class EffectsManager {
  private particles: ParticleSystem;
  private tower: Tower;
  private ambientTimer = 0;

  constructor(scene: THREE.Scene, tower: Tower) {
    this.particles = new ParticleSystem(scene, 1000);
    this.tower = tower;
  }

  conjureDice(position: THREE.Vector3): void {
    this.particles.emit(position, 30, {
      color: new THREE.Color(0x8855ff),
      speed: 2,
      life: 0.8,
      spread: 0.8,
      size: 0.12,
    });
  }

  baffleImpact(position: THREE.Vector3): void {
    this.particles.emit(position, 15, {
      color: new THREE.Color(0xddaa44),
      speed: 4,
      life: 0.5,
      spread: 0.6,
      size: 0.06,
    });
  }

  criticalHit(position: THREE.Vector3): void {
    // Golden fireworks
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.particles.emit(position, 40, {
          color: new THREE.Color(0xffdd44),
          speed: 6,
          life: 1.5,
          spread: 1.2,
          size: 0.15,
        });
      }, i * 100);
    }
    // Flash tower runes
    for (const rune of this.tower.runeGlowMeshes) {
      const mat = rune.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 3.0;
    }
  }

  criticalFail(position: THREE.Vector3): void {
    this.particles.emit(position, 30, {
      color: new THREE.Color(0x440022),
      speed: 2,
      life: 2.0,
      spread: 0.5,
      size: 0.1,
    });
    // Dim tower runes
    for (const rune of this.tower.runeGlowMeshes) {
      const mat = rune.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.1;
    }
  }

  update(delta: number): void {
    this.particles.update(delta);
    this.updateAmbient(delta);
    this.updateRuneGlow(delta);
  }

  private updateAmbient(delta: number): void {
    this.ambientTimer += delta;

    // Emit ember-like particles drifting upward from tower base
    if (Math.random() < delta * 2) {
      const x = (Math.random() - 0.5) * 2;
      const z = (Math.random() - 0.5) * 2;
      this.particles.emit(new THREE.Vector3(x, 0.5, z), 1, {
        color: new THREE.Color(0x664422),
        speed: 0.5,
        life: 3.0,
        spread: 0.2,
        size: 0.04,
      });
    }
  }

  private updateRuneGlow(delta: number): void {
    // Gentle breathing pulse on runes
    for (const rune of this.tower.runeGlowMeshes) {
      const mat = rune.material as THREE.MeshStandardMaterial;
      const target = 0.6 + Math.sin(this.ambientTimer * 1.5) * 0.2;
      mat.emissiveIntensity += (target - mat.emissiveIntensity) * delta * 2;
    }
  }
}
```

**Step 3: Wire into main.ts**

Add to the animate loop and roll events.

**Step 4: Verify visually**

Expected: Ambient particles drift upward, runes pulse, conjure effect on roll, baffle impacts spark.

**Step 5: Commit**

```bash
git add src/effects/
git commit -m "feat: add particle system and effects manager with ambient, conjure, impact, crit effects"
```

---

## Task 11: UI — Dice Selector with 3D Mini Dice

**Files:**
- Create: `src/ui/DiceSelector.ts`
- Create: `src/ui/UIStyles.ts`

**Step 1: Implement UIStyles (shared CSS-in-JS helpers)**

```typescript
// src/ui/UIStyles.ts
export function injectStyles(): void {
  const style = document.createElement('style');
  style.textContent = `
    .dice-selector {
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 12px;
      padding: 12px 20px;
      background: rgba(10, 10, 20, 0.7);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      border: 1px solid rgba(136, 85, 255, 0.3);
      z-index: 20;
    }

    .dice-btn {
      position: relative;
      width: 60px;
      height: 70px;
      background: none;
      border: 1px solid rgba(136, 85, 255, 0.2);
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      color: #e0d8c8;
      font-size: 12px;
      padding: 4px;
    }

    .dice-btn:hover {
      border-color: rgba(136, 85, 255, 0.6);
      background: rgba(136, 85, 255, 0.1);
    }

    .dice-btn canvas {
      width: 36px;
      height: 36px;
    }

    .dice-btn .count-badge {
      position: absolute;
      top: -6px;
      right: -6px;
      min-width: 20px;
      height: 20px;
      background: linear-gradient(135deg, #8855ff, #aa77ff);
      color: white;
      font-size: 11px;
      font-weight: bold;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 8px rgba(136, 85, 255, 0.6);
    }

    .dice-btn .count-badge.hidden {
      display: none;
    }

    .roll-summary {
      position: fixed;
      bottom: 155px;
      left: 50%;
      transform: translateX(-50%);
      color: #bb99ff;
      font-size: 18px;
      font-weight: bold;
      text-shadow: 0 0 10px rgba(136, 85, 255, 0.5);
      z-index: 20;
    }

    .roll-btn {
      position: fixed;
      bottom: 16px;
      left: 50%;
      transform: translateX(-50%);
      width: 160px;
      height: 50px;
      background: linear-gradient(135deg, #2a1050, #4a2080);
      border: 2px solid rgba(136, 85, 255, 0.5);
      border-radius: 25px;
      color: #e0d8c8;
      font-size: 18px;
      font-weight: bold;
      cursor: pointer;
      text-transform: uppercase;
      letter-spacing: 3px;
      box-shadow: 0 0 20px rgba(136, 85, 255, 0.3);
      transition: all 0.3s;
      z-index: 20;
    }

    .roll-btn:hover:not(:disabled) {
      box-shadow: 0 0 40px rgba(136, 85, 255, 0.6);
      transform: translateX(-50%) scale(1.05);
    }

    .roll-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .results-bar {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 16px;
      align-items: center;
      padding: 12px 24px;
      background: rgba(10, 10, 20, 0.7);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      border: 1px solid rgba(136, 85, 255, 0.3);
      z-index: 20;
      opacity: 0;
      transition: opacity 0.5s;
    }

    .results-bar.visible {
      opacity: 1;
    }

    .result-value {
      font-size: 22px;
      font-weight: bold;
      color: #bb99ff;
      text-shadow: 0 0 10px rgba(136, 85, 255, 0.5);
    }

    .result-label {
      font-size: 11px;
      color: #8877aa;
    }

    .result-total {
      font-size: 28px;
      font-weight: bold;
      color: #ffdd66;
      text-shadow: 0 0 15px rgba(255, 200, 50, 0.5);
      margin-left: 8px;
      padding-left: 16px;
      border-left: 1px solid rgba(136, 85, 255, 0.3);
    }
  `;
  document.head.appendChild(style);
}
```

**Step 2: Implement DiceSelector with mini 3D dice**

```typescript
// src/ui/DiceSelector.ts
import * as THREE from 'three';
import { DiceType, DICE_CONFIGS } from '../dice/DiceConfig';
import { createDiceGeometry } from '../dice/DiceGeometry';

const DICE_TYPES: DiceType[] = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];

export type DiceSelectionChangeListener = (selection: Map<DiceType, number>) => void;

export class DiceSelector {
  private container: HTMLDivElement;
  private summary: HTMLDivElement;
  private selection = new Map<DiceType, number>();
  private miniRenderers: { renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera; mesh: THREE.Mesh }[] = [];
  private listeners: DiceSelectionChangeListener[] = [];

  constructor(uiRoot: HTMLElement) {
    this.summary = document.createElement('div');
    this.summary.className = 'roll-summary';
    uiRoot.appendChild(this.summary);

    this.container = document.createElement('div');
    this.container.className = 'dice-selector';
    uiRoot.appendChild(this.container);

    for (const type of DICE_TYPES) {
      this.createDiceButton(type);
    }
  }

  onChange(listener: DiceSelectionChangeListener): void {
    this.listeners.push(listener);
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

  private createDiceButton(type: DiceType): void {
    const config = DICE_CONFIGS[type];
    const btn = document.createElement('button');
    btn.className = 'dice-btn';

    // Mini 3D canvas
    const miniCanvas = document.createElement('canvas');
    miniCanvas.width = 72;
    miniCanvas.height = 72;
    btn.appendChild(miniCanvas);

    // Label
    const label = document.createElement('span');
    label.textContent = config.label;
    btn.appendChild(label);

    // Count badge
    const badge = document.createElement('div');
    badge.className = 'count-badge hidden';
    badge.textContent = '0';
    btn.appendChild(badge);

    // Setup mini Three.js renderer for this die
    const renderer = new THREE.WebGLRenderer({ canvas: miniCanvas, alpha: true, antialias: true });
    renderer.setSize(72, 72);
    renderer.setPixelRatio(2);

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

    this.miniRenderers.push({ renderer, scene, camera, mesh });

    // Click to add
    btn.addEventListener('click', () => {
      const current = this.selection.get(type) || 0;
      this.selection.set(type, current + 1);
      this.updateDisplay();
      this.emitChange();

      // Flare effect on button
      btn.style.boxShadow = '0 0 20px rgba(136, 85, 255, 0.8)';
      setTimeout(() => { btn.style.boxShadow = ''; }, 300);
    });

    // Right-click to remove
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
    let i = 0;
    for (const type of DICE_TYPES) {
      const count = this.selection.get(type) || 0;
      const badge = badges[i] as HTMLElement;
      badge.textContent = String(count);
      badge.classList.toggle('hidden', count === 0);
      i++;
    }

    // Summary text
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
    for (const { renderer, scene, camera, mesh } of this.miniRenderers) {
      mesh.rotation.x = time * 0.5;
      mesh.rotation.y = time * 0.7;
      mesh.position.y = Math.sin(time * 2) * 0.05;
      renderer.render(scene, camera);
    }
  }
}
```

**Step 3: Wire into main.ts**

```typescript
import { DiceSelector } from './ui/DiceSelector';
import { injectStyles } from './ui/UIStyles';

injectStyles();
const uiRoot = document.getElementById('ui-root')!;
const diceSelector = new DiceSelector(uiRoot);
```

Replace the keyboard listener with a Roll button wired to the selector.

**Step 4: Verify visually**

Expected: Bottom bar shows 7 miniature spinning 3D dice. Click to add, right-click to remove. Summary text updates.

**Step 5: Commit**

```bash
git add src/ui/
git commit -m "feat: add dice selector UI with miniature 3D spinning dice"
```

---

## Task 12: UI — Roll Button & Results Display

**Files:**
- Create: `src/ui/RollButton.ts`
- Create: `src/ui/ResultsDisplay.ts`
- Modify: `src/main.ts`

**Step 1: Implement RollButton**

```typescript
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
```

**Step 2: Implement ResultsDisplay**

```typescript
// src/ui/ResultsDisplay.ts
import { RollResult } from '../roll/RollOrchestrator';
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
```

**Step 3: Wire everything together in main.ts**

Update main.ts to use RollButton and ResultsDisplay instead of keyboard shortcuts.

**Step 4: Verify end-to-end**

Expected: Select dice, click Roll, watch them tumble, see results at the top.

**Step 5: Commit**

```bash
git add src/ui/RollButton.ts src/ui/ResultsDisplay.ts src/main.ts
git commit -m "feat: add roll button and results display UI"
```

---

## Task 13: UI — Presets Panel

**Files:**
- Create: `src/ui/PresetsPanel.ts`
- Create: `src/ui/PresetsPanel.test.ts`

**Step 1: Write failing test for preset storage**

```typescript
// src/ui/PresetsPanel.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { PresetStore, Preset } from './PresetsPanel';

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
```

**Step 2: Run to verify failure**

```bash
npx vitest run src/ui/PresetsPanel.test.ts
```

**Step 3: Implement PresetStore and PresetsPanel**

```typescript
// src/ui/PresetsPanel.ts
import { DiceType } from '../dice/DiceConfig';

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

  constructor(uiRoot: HTMLElement) {
    this.store = new PresetStore();

    // Toggle button
    this.toggle = document.createElement('button');
    this.toggle.textContent = '\u2630'; // hamburger
    this.toggle.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 30;
      width: 40px; height: 40px; border-radius: 8px;
      background: rgba(10,10,20,0.7); border: 1px solid rgba(136,85,255,0.3);
      color: #bb99ff; font-size: 20px; cursor: pointer;
      backdrop-filter: blur(10px);
    `;
    this.toggle.addEventListener('click', () => this.togglePanel());
    uiRoot.appendChild(this.toggle);

    // Panel
    this.panel = document.createElement('div');
    this.panel.style.cssText = `
      position: fixed; top: 0; right: -300px; width: 280px; height: 100%;
      background: rgba(10,10,20,0.9); backdrop-filter: blur(15px);
      border-left: 1px solid rgba(136,85,255,0.3); z-index: 25;
      padding: 70px 16px 16px; transition: right 0.3s; overflow-y: auto;
    `;
    uiRoot.appendChild(this.panel);

    // Heading
    const heading = document.createElement('h3');
    heading.textContent = 'Saved Rolls';
    heading.style.cssText = 'color: #bb99ff; margin-bottom: 16px; font-size: 16px;';
    this.panel.appendChild(heading);

    this.list = document.createElement('div');
    this.panel.appendChild(this.list);

    this.renderPresets();
  }

  onPresetSelected(listener: PresetSelectedListener): void {
    this.listeners.push(listener);
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
    this.list.innerHTML = '';
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
      info.innerHTML = `<div style="color:#e0d8c8;font-weight:bold">${preset.name}</div>
        <div style="color:#8877aa;font-size:12px">${this.formatDice(preset.dice)}</div>`;
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
```

**Step 4: Run tests**

```bash
npx vitest run src/ui/PresetsPanel.test.ts
```

Expected: PASS.

**Step 5: Wire into main.ts**

**Step 6: Commit**

```bash
git add src/ui/PresetsPanel.ts src/ui/PresetsPanel.test.ts src/main.ts
git commit -m "feat: add presets panel with localStorage persistence"
```

---

## Task 14: Audio System

**Files:**
- Create: `src/audio/AudioManager.ts`

**Step 1: Implement AudioManager using Web Audio API for procedural sounds**

```typescript
// src/audio/AudioManager.ts
export class AudioManager {
  private ctx: AudioContext | null = null;
  private initialized = false;

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  initialize(): void {
    if (this.initialized) return;
    this.getContext();
    this.initialized = true;
  }

  playImpact(intensity = 1): void {
    const ctx = this.getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200 * intensity, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3 * intensity, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  }

  playChime(pitch = 1): void {
    const ctx = this.getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800 * pitch, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200 * pitch, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  }

  playCritSuccess(): void {
    const ctx = this.getContext();
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
      gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.5);
    });
  }

  playCritFail(): void {
    const ctx = this.getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.8);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.8);
  }

  playAmbientHum(): void {
    const ctx = this.getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, ctx.currentTime);
    gain.gain.setValueAtTime(0.02, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    // This runs continuously — store reference if we need to stop it
  }
}
```

**Step 2: Wire audio triggers into RollOrchestrator and EffectsManager**

**Step 3: Verify with sound on**

Expected: Thunks on baffle hits, chimes on result read, fanfare on nat 20, rumble on nat 1.

**Step 4: Commit**

```bash
git add src/audio/
git commit -m "feat: add procedural audio via Web Audio API"
```

---

## Task 15: Ambient Background Effects

**Files:**
- Create: `src/effects/AmbientBackground.ts`
- Modify: `src/main.ts`

**Step 1: Implement arcane geometry background**

```typescript
// src/effects/AmbientBackground.ts
import * as THREE from 'three';

export class AmbientBackground {
  private geometries: THREE.LineSegments[] = [];

  constructor(scene: THREE.Scene) {
    const material = new THREE.LineBasicMaterial({
      color: 0x331155,
      transparent: true,
      opacity: 0.15,
    });

    // Rotating arcane circles
    for (let i = 0; i < 3; i++) {
      const radius = 6 + i * 3;
      const segments = 64;
      const points: THREE.Vector3[] = [];
      for (let j = 0; j <= segments; j++) {
        const angle = (j / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius
        ));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const circle = new THREE.LineSegments(
        new THREE.WireframeGeometry(geo),
        material.clone()
      );
      circle.position.y = -2 + i * 0.5;
      circle.rotation.x = Math.PI / 2 + i * 0.1;
      scene.add(circle);
      this.geometries.push(circle);
    }

    // Pentagram
    const pentPoints: THREE.Vector3[] = [];
    for (let i = 0; i < 5; i++) {
      const angle1 = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      const angle2 = (((i + 2) % 5) * 2 * Math.PI) / 5 - Math.PI / 2;
      pentPoints.push(
        new THREE.Vector3(Math.cos(angle1) * 8, 0, Math.sin(angle1) * 8),
        new THREE.Vector3(Math.cos(angle2) * 8, 0, Math.sin(angle2) * 8)
      );
    }
    const pentGeo = new THREE.BufferGeometry().setFromPoints(pentPoints);
    const pentagram = new THREE.LineSegments(pentGeo, material.clone());
    pentagram.position.y = -3;
    scene.add(pentagram);
    this.geometries.push(pentagram);
  }

  update(time: number): void {
    for (let i = 0; i < this.geometries.length; i++) {
      const geo = this.geometries[i];
      geo.rotation.y = time * 0.05 * (i % 2 === 0 ? 1 : -1);

      // Breathing opacity
      const mat = geo.material as THREE.LineBasicMaterial;
      mat.opacity = 0.1 + Math.sin(time * 0.5 + i) * 0.05;
    }
  }
}
```

**Step 2: Wire into main.ts and animate loop**

**Step 3: Verify visually**

Expected: Faint rotating arcane geometry (circles + pentagram) visible in the background beneath the tower.

**Step 4: Commit**

```bash
git add src/effects/AmbientBackground.ts src/main.ts
git commit -m "feat: add rotating arcane geometry background effects"
```

---

## Task 16: Final main.ts Integration

**Files:**
- Modify: `src/main.ts`

**Step 1: Write the final integrated main.ts**

This task brings everything together — scene, physics, tower, orchestrator, camera, effects, audio, and all UI. Wire all event listeners: roll button triggers orchestrator, orchestrator state changes drive camera/effects/audio/results display.

Key integration points:
- Roll button click → get dice from selector → `orchestrator.roll(dice)` → camera plays → effects conjure
- Orchestrator `rolling` event → disable roll button, hide results, play camera sequence
- Orchestrator `settled` event → show results, enable roll button, trigger crit/fumble effects if applicable, return camera to idle
- Physics contact events → `effects.baffleImpact()` + `audio.playImpact()`
- Animate loop calls: `physics.step()`, `orchestrator.update()`, `cameraDirector.update()`, `effects.update()`, `ambientBackground.update()`, `diceSelector.updateMiniDice()`, `sceneManager.render()`

**Step 2: Full manual test**

```bash
npx vite --open
```

Test checklist:
- [ ] Tower renders in ivory with glowing runes
- [ ] Mini 3D dice spin in selector
- [ ] Click dice to add, right-click to remove
- [ ] Summary text updates
- [ ] Roll button drops dice into tower
- [ ] Dice tumble through baffles with particle sparks
- [ ] Camera follows the action
- [ ] Dice settle in tray, results appear
- [ ] Ambient particles and background geometry visible
- [ ] Audio plays on impacts and results

**Step 3: Commit**

```bash
git add src/main.ts
git commit -m "feat: integrate all systems in main entry point"
```

---

## Task 17: PWA Setup

**Files:**
- Modify: `vite.config.ts`
- Create: `public/manifest.json`

**Step 1: Update vite.config.ts with PWA plugin**

```typescript
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Arcane Dice Tower',
        short_name: 'Dice Tower',
        description: 'A magical 3D dice roller for tabletop RPGs',
        theme_color: '#0a0a0f',
        background_color: '#0a0a0f',
        display: 'standalone',
        orientation: 'any',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'node',
  },
});
```

**Step 2: Create placeholder icons**

Use a simple canvas-generated icon or placeholder PNGs in `public/icons/`.

**Step 3: Build and test PWA**

```bash
npx vite build
npx vite preview
```

Verify: Service worker registers, app is installable from browser.

**Step 4: Commit**

```bash
git add vite.config.ts public/
git commit -m "feat: add PWA support with manifest and service worker"
```

---

## Task 18: Responsive Polish & Mobile Touch

**Files:**
- Modify: `src/ui/UIStyles.ts`
- Modify: `src/scene/SceneManager.ts`

**Step 1: Add responsive breakpoints to UIStyles**

Add media queries for mobile:
- Larger tap targets (minimum 44px)
- Stack dice selector if too narrow
- Adjust font sizes
- Ensure Roll button is easily thumb-reachable

**Step 2: Adjust camera framing for portrait vs landscape**

In SceneManager's resize handler, adjust `camera.fov` and position based on aspect ratio so the tower and tray are always fully visible.

**Step 3: Test on mobile viewport**

Use Chrome DevTools device toolbar to test various screen sizes.

**Step 4: Commit**

```bash
git add src/ui/UIStyles.ts src/scene/SceneManager.ts
git commit -m "feat: add responsive layout and mobile-friendly touch targets"
```

---

## Task 19: Final Testing & Polish Pass

**Files:**
- Run all tests
- Visual QA

**Step 1: Run all unit tests**

```bash
npx vitest run
```

Expected: All tests pass.

**Step 2: Full manual QA checklist**

- [ ] All 7 dice types roll correctly (D4, D6, D8, D10, D12, D20, D100)
- [ ] D100 renders as two D10s and combines results
- [ ] Physics feels natural — dice bounce off baffles and settle in tray
- [ ] Camera smoothly follows the action
- [ ] Nat 20 triggers golden fireworks + fanfare
- [ ] Nat 1 triggers dark effects + rumble
- [ ] Ambient effects run when idle (particles, rune pulse, background geometry)
- [ ] Presets save and load correctly
- [ ] PWA installs from browser
- [ ] Works on mobile (touch, responsive layout)

**Step 3: Fix any issues found**

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: final polish and QA pass"
```
