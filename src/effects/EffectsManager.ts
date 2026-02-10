// src/effects/EffectsManager.ts
import * as THREE from 'three';
import { ParticleSystem } from './ParticleSystem';
import type { Tower } from '../tower/TowerBuilder';

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
    for (const rune of this.tower.runeGlowMeshes) {
      const mat = rune.material as THREE.MeshStandardMaterial;
      const target = 0.6 + Math.sin(this.ambientTimer * 1.5) * 0.2;
      mat.emissiveIntensity += (target - mat.emissiveIntensity) * delta * 2;
    }
  }
}
