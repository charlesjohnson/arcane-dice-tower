import * as THREE from 'three';
import type { DiceType } from '../dice/DiceConfig';
import { DICE_CONFIGS, getMaxValue } from '../dice/DiceConfig';
import { createDiceGeometry } from '../dice/DiceGeometry';
import { createDiceMaterial } from '../dice/DiceMaterial';
import { createDiceBody, applyRandomRollForce } from '../dice/DiceBody';
import { findUpwardFaceIndex } from '../dice/DiceResult';
import { PhysicsWorld, VELOCITY_THRESHOLD, ANGULAR_VELOCITY_THRESHOLD } from '../physics/PhysicsWorld';
import type { Tower } from '../tower/TowerBuilder';

export interface DieInstance {
  mesh: THREE.Mesh;
  body: import('cannon-es').Body;
  type: DiceType;
  /** For D100 pairs: 'tens' or 'units'. Undefined for non-D100 dice. */
  d100Role?: 'tens' | 'units';
  result: number | null;
}

export type RollState = 'idle' | 'rolling' | 'settled';

export interface RollResult {
  dice: { type: DiceType; value: number }[];
  total: number;
  maxTotal: number;
}

type StateChangeListener = (state: RollState, result: RollResult | null) => void;
type SubtotalListener = (subtotal: number) => void;

const SETTLE_WAIT_TIME = 1.0; // seconds to wait before checking settlement
export const MAX_CONCURRENT_DICE = 4;
export const MAX_TRAY_DICE = 8;
const MAX_SPREAD_X = 1.2; // TOWER_RADIUS (2.0) - die radius (0.6) - margin (0.2)

/** Compute the clamped horizontal offset for the i-th die out of total. */
export function computeSpawnOffsetX(index: number, total: number): number {
  const rawOffsetX = (index - (total - 1) / 2) * 0.8;
  return Math.max(-MAX_SPREAD_X, Math.min(MAX_SPREAD_X, rawOffsetX));
}

type SpawnEntry = { type: DiceType; d100Role?: 'tens' | 'units' };

export class RollOrchestrator {
  private scene: THREE.Scene;
  private physics: PhysicsWorld;
  private tower: Tower;

  private dice: DieInstance[] = [];
  private state: RollState = 'idle';
  private settleTimer = 0;
  private listeners: StateChangeListener[] = [];
  private subtotalListeners: SubtotalListener[] = [];
  private pendingBatches: SpawnEntry[][] = [];
  private currentBatchBodies: import('cannon-es').Body[] = [];
  private accumulatedSubtotal = 0;
  private accumulatedMaxTotal = 0;
  private accumulatedDice: { type: DiceType; value: number }[] = [];

  constructor(scene: THREE.Scene, physics: PhysicsWorld, tower: Tower) {
    this.scene = scene;
    this.physics = physics;
    this.tower = tower;
  }

  onStateChange(listener: StateChangeListener): void {
    this.listeners.push(listener);
  }

  onSubtotalUpdate(listener: SubtotalListener): void {
    this.subtotalListeners.push(listener);
  }

  getState(): RollState {
    return this.state;
  }

  getDicePositions(): { x: number; y: number; z: number }[] {
    return this.dice.map(die => ({
      x: die.body.position.x,
      y: die.body.position.y,
      z: die.body.position.z,
    }));
  }

  roll(diceList: DiceType[]): void {
    this.clearDice();
    this.settleTimer = 0;
    this.pendingBatches = [];
    this.currentBatchBodies = [];
    this.accumulatedSubtotal = 0;
    this.accumulatedMaxTotal = 0;
    this.accumulatedDice = [];
    this.setState('rolling', null);

    // Expand D100 into two D10 bodies (tens + units)
    const spawnList: SpawnEntry[] = [];
    for (const type of diceList) {
      if (type === 'd100') {
        spawnList.push({ type: 'd100', d100Role: 'tens' });
        spawnList.push({ type: 'd10', d100Role: 'units' });
      } else {
        spawnList.push({ type });
      }
    }

    // Split into batches of MAX_CONCURRENT_DICE
    for (let i = 0; i < spawnList.length; i += MAX_CONCURRENT_DICE) {
      this.pendingBatches.push(spawnList.slice(i, i + MAX_CONCURRENT_DICE));
    }

    this.spawnNextBatch();
  }

  private spawnNextBatch(): void {
    const batch = this.pendingBatches.shift();
    if (!batch) return;

    this.currentBatchBodies = [];
    this.settleTimer = 0;
    const dropPos = this.tower.dropPosition;

    for (let i = 0; i < batch.length; i++) {
      const { type, d100Role } = batch[i];
      const geometry = createDiceGeometry(type);
      const material = createDiceMaterial(type);
      const mesh = new THREE.Mesh(geometry, material);

      const body = createDiceBody(type);

      const offsetX = computeSpawnOffsetX(i, batch.length);
      const offsetY = i * 0.5;
      body.position.set(
        dropPos.x + offsetX,
        dropPos.y + offsetY,
        dropPos.z
      );

      applyRandomRollForce(body);

      mesh.position.set(body.position.x, body.position.y, body.position.z);
      mesh.quaternion.set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w);

      mesh.castShadow = true;
      mesh.receiveShadow = true;

      this.scene.add(mesh);
      this.physics.addDynamicBody(body);

      const die: DieInstance = { mesh, body, type, d100Role, result: null };
      this.dice.push(die);
      this.currentBatchBodies.push(body);
    }
  }

  update(delta: number): void {
    // Sync Three.js meshes to Cannon-es body positions
    for (const die of this.dice) {
      die.mesh.position.set(die.body.position.x, die.body.position.y, die.body.position.z);
      die.mesh.quaternion.set(die.body.quaternion.x, die.body.quaternion.y, die.body.quaternion.z, die.body.quaternion.w);
    }

    if (this.state !== 'rolling') return;

    this.settleTimer += delta;

    if (this.settleTimer < SETTLE_WAIT_TIME) return;

    if (this.areCurrentBatchSettled()) {
      if (this.pendingBatches.length > 0) {
        const nextBatchSize = this.pendingBatches[0].length;
        if (this.dice.length + nextBatchSize > MAX_TRAY_DICE) {
          this.clearTrayWithSubtotal();
        }
        this.spawnNextBatch();
      } else {
        const result = this.readResults();
        // Include accumulated subtotal from cleared batches
        result.total += this.accumulatedSubtotal;
        result.maxTotal += this.accumulatedMaxTotal;
        result.dice = [...this.accumulatedDice, ...result.dice];
        this.setState('settled', result);
      }
    }
  }

  private areCurrentBatchSettled(): boolean {
    if (this.currentBatchBodies.length === 0) return true;
    return this.currentBatchBodies.every((body) => {
      const v = body.velocity;
      const w = body.angularVelocity;
      return (
        v.length() < VELOCITY_THRESHOLD &&
        w.length() < ANGULAR_VELOCITY_THRESHOLD
      );
    });
  }

  private readResults(): RollResult {
    const results: { type: DiceType; value: number }[] = [];

    // Read raw values for each physical die
    let pendingTensValue: number | null = null;

    for (const die of this.dice) {
      const config = DICE_CONFIGS[die.type];
      const faceNormals = this.extractFaceNormals(die.mesh.geometry, config.faceCount);
      const quaternion = new THREE.Quaternion(
        die.body.quaternion.x,
        die.body.quaternion.y,
        die.body.quaternion.z,
        die.body.quaternion.w
      );
      const faceIndex = findUpwardFaceIndex(faceNormals, quaternion);
      const value = config.faceValues[faceIndex % config.faceValues.length];
      die.result = value;

      if (die.d100Role === 'tens') {
        // D100 tens die: hold value, wait for the units die
        pendingTensValue = value;
      } else if (die.d100Role === 'units') {
        // D100 units die: combine with tens value
        const tens = pendingTensValue ?? 0;
        const units = value;
        // 00 + 0 = 100 in D&D convention
        const combined = tens + units === 0 ? 100 : tens + units;
        results.push({ type: 'd100', value: combined });
        pendingTensValue = null;
      } else {
        results.push({ type: die.type, value });
      }
    }

    const total = results.reduce((sum, d) => sum + d.value, 0);
    const maxTotal = results.reduce((sum, d) => sum + getMaxValue(d.type), 0);
    return { dice: results, total, maxTotal };
  }

  private extractFaceNormals(
    geometry: THREE.BufferGeometry,
    faceCount: number
  ): THREE.Vector3[] {
    const posAttr = geometry.getAttribute('position');
    const index = geometry.getIndex();

    const normals: THREE.Vector3[] = [];
    let totalTriangles: number;

    if (index) {
      totalTriangles = index.count / 3;
    } else {
      totalTriangles = posAttr.count / 3;
    }

    const trianglesPerFace = Math.max(
      1,
      Math.floor(totalTriangles / faceCount)
    );

    const vA = new THREE.Vector3();
    const vB = new THREE.Vector3();
    const vC = new THREE.Vector3();
    const edge1 = new THREE.Vector3();
    const edge2 = new THREE.Vector3();
    const faceNormal = new THREE.Vector3();

    for (let face = 0; face < faceCount; face++) {
      // Use the first triangle of each face to compute the normal
      const triIndex = face * trianglesPerFace;

      if (index) {
        const a = index.getX(triIndex * 3);
        const b = index.getX(triIndex * 3 + 1);
        const c = index.getX(triIndex * 3 + 2);
        vA.fromBufferAttribute(posAttr, a);
        vB.fromBufferAttribute(posAttr, b);
        vC.fromBufferAttribute(posAttr, c);
      } else {
        const baseVertex = triIndex * 3;
        vA.fromBufferAttribute(posAttr, baseVertex);
        vB.fromBufferAttribute(posAttr, baseVertex + 1);
        vC.fromBufferAttribute(posAttr, baseVertex + 2);
      }

      edge1.subVectors(vB, vA);
      edge2.subVectors(vC, vA);
      faceNormal.crossVectors(edge1, edge2).normalize();

      normals.push(faceNormal.clone());
    }

    return normals;
  }

  private clearTrayWithSubtotal(): void {
    const partialResult = this.readResults();
    this.accumulatedSubtotal += partialResult.total;
    this.accumulatedMaxTotal += partialResult.maxTotal;
    this.accumulatedDice.push(...partialResult.dice);
    this.clearDice();
    for (const listener of this.subtotalListeners) {
      listener(this.accumulatedSubtotal);
    }
  }

  private clearDice(): void {
    for (const die of this.dice) {
      this.scene.remove(die.mesh);
      if (die.mesh.geometry) {
        die.mesh.geometry.dispose();
      }
      if (Array.isArray(die.mesh.material)) {
        for (const mat of die.mesh.material) {
          mat.dispose();
        }
      } else if (die.mesh.material) {
        die.mesh.material.dispose();
      }
      this.physics.removeDynamicBody(die.body);
    }
    this.dice = [];
  }

  private setState(state: RollState, result: RollResult | null): void {
    this.state = state;
    for (const listener of this.listeners) {
      listener(state, result);
    }
  }
}
