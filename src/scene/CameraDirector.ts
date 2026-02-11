// src/scene/CameraDirector.ts
import * as THREE from 'three';

interface CameraKeyframe {
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
  time: number; // normalized 0-1
}

export class CameraDirector {
  private camera: THREE.PerspectiveCamera;
  private idlePosition = new THREE.Vector3(0, 7, 16);
  private idleLookAt = new THREE.Vector3(0, 4, 0);
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
      { position: this.camera.position.clone(), lookAt: this.currentLookAt.clone(), time: 0 },
      { position: new THREE.Vector3(0, towerTopY + 2, 10), lookAt: new THREE.Vector3(0, towerTopY, 0), time: 0.15 },
      { position: new THREE.Vector3(3, towerTopY * 0.6, 6), lookAt: new THREE.Vector3(0, towerTopY * 0.5, 0), time: 0.35 },
      { position: new THREE.Vector3(2, trayY + 3, 7), lookAt: new THREE.Vector3(0, trayY + 1, 2), time: 0.65 },
      { position: new THREE.Vector3(0, trayY + 4, 5), lookAt: new THREE.Vector3(0, trayY + 0.5, 2.5), time: 1.0 },
    ];
    this.duration = 3.5;
    this.progress = 0;
    this.active = true;
  }

  returnToIdle(): void {
    this.keyframes = [
      { position: this.camera.position.clone(), lookAt: this.currentLookAt.clone(), time: 0 },
      { position: this.idlePosition.clone(), lookAt: this.idleLookAt.clone(), time: 1.0 },
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
