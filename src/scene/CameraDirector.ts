// src/scene/CameraDirector.ts
import * as THREE from 'three';
import { computeDiceCentroid, computeBoundingRadius, computeTrackingDistance } from './CameraTracker';
import type { Vec3 } from './CameraTracker';

type CameraMode = 'idle' | 'tracking' | 'tray-pivot' | 'tray' | 'returning';

const DAMPING_SPEED = 5;
const TRAY_PIVOT_DURATION = 0.7;

// Fixed tray-view camera position and look-at
const TRAY_VIEW_OFFSET_Y = 3.5;
const TRAY_VIEW_Z = 5;
const TRAY_LOOK_Z = 2.5;

export class CameraDirector {
  private camera: THREE.PerspectiveCamera;
  private idlePosition = new THREE.Vector3(0, 6, 14);
  private idleLookAt = new THREE.Vector3(0, 2.0, 0);
  private currentLookAt = new THREE.Vector3();

  private mode: CameraMode = 'idle';
  private trayFloorY = 0;

  // Tracking state
  private smoothedCentroid = new THREE.Vector3();

  // Tray-pivot transition state
  private pivotProgress = 0;
  private pivotStartPos = new THREE.Vector3();
  private pivotStartLookAt = new THREE.Vector3();
  private pivotEndPos = new THREE.Vector3();
  private pivotEndLookAt = new THREE.Vector3();

  // Return-to-idle transition
  private returnProgress = 0;
  private returnDuration = 1.5;
  private returnStartPos = new THREE.Vector3();
  private returnStartLookAt = new THREE.Vector3();

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.currentLookAt.copy(this.idleLookAt);
  }

  startTracking(trayFloorY: number): void {
    this.trayFloorY = trayFloorY;
    this.mode = 'tracking';
    this.smoothedCentroid.copy(this.camera.position);
    this.smoothedCentroid.z = 0; // start centroid inside tower
  }

  notifyTrayHit(): void {
    if (this.mode !== 'tracking') return;

    this.mode = 'tray-pivot';
    this.pivotProgress = 0;
    this.pivotStartPos.copy(this.camera.position);
    this.pivotStartLookAt.copy(this.currentLookAt);
    this.pivotEndPos.set(0, this.trayFloorY + TRAY_VIEW_OFFSET_Y, TRAY_VIEW_Z);
    this.pivotEndLookAt.set(0, this.trayFloorY + 0.5, TRAY_LOOK_Z);
  }

  returnToIdle(): void {
    this.mode = 'returning';
    this.returnProgress = 0;
    this.returnStartPos.copy(this.camera.position);
    this.returnStartLookAt.copy(this.currentLookAt);
  }

  update(delta: number, dicePositions?: Vec3[]): void {
    const positions = dicePositions ?? [];

    switch (this.mode) {
      case 'tracking':
        this.updateTracking(delta, positions);
        break;
      case 'tray-pivot':
        this.updateTrayPivot(delta);
        break;
      case 'tray':
        // Static — camera stays put
        break;
      case 'returning':
        this.updateReturning(delta);
        break;
      case 'idle':
        break;
    }
  }

  private updateTracking(delta: number, positions: Vec3[]): void {
    if (positions.length === 0) return;

    const centroid = computeDiceCentroid(positions);
    const boundingRadius = computeBoundingRadius(positions, centroid);
    const distance = computeTrackingDistance(
      boundingRadius,
      this.camera.fov,
      this.camera.aspect
    );

    // Smooth the centroid to prevent jitter
    const lerpFactor = 1 - Math.exp(-DAMPING_SPEED * delta);
    this.smoothedCentroid.x += (centroid.x - this.smoothedCentroid.x) * lerpFactor;
    this.smoothedCentroid.y += (centroid.y - this.smoothedCentroid.y) * lerpFactor;
    this.smoothedCentroid.z += (centroid.z - this.smoothedCentroid.z) * lerpFactor;

    // Camera position: in front of the tower, at dice height
    const targetPos = new THREE.Vector3(
      this.smoothedCentroid.x * 0.3, // subtle x tracking, mostly centered
      this.smoothedCentroid.y,
      this.smoothedCentroid.z + distance
    );

    // Smoothly move camera toward target
    this.camera.position.x += (targetPos.x - this.camera.position.x) * lerpFactor;
    this.camera.position.y += (targetPos.y - this.camera.position.y) * lerpFactor;
    this.camera.position.z += (targetPos.z - this.camera.position.z) * lerpFactor;

    // Look at the smoothed centroid
    this.currentLookAt.copy(this.smoothedCentroid);
    this.camera.lookAt(this.currentLookAt);
  }

  private updateTrayPivot(delta: number): void {
    this.pivotProgress += delta / TRAY_PIVOT_DURATION;
    if (this.pivotProgress >= 1) {
      this.pivotProgress = 1;
      this.mode = 'tray';
    }

    const t = this.easeInOut(this.pivotProgress);
    this.camera.position.lerpVectors(this.pivotStartPos, this.pivotEndPos, t);
    this.currentLookAt.lerpVectors(this.pivotStartLookAt, this.pivotEndLookAt, t);
    this.camera.lookAt(this.currentLookAt);
  }

  private updateReturning(delta: number): void {
    this.returnProgress += delta / this.returnDuration;
    if (this.returnProgress >= 1) {
      this.returnProgress = 1;
      this.mode = 'idle';
    }

    const t = this.easeInOut(this.returnProgress);
    this.camera.position.lerpVectors(this.returnStartPos, this.idlePosition, t);
    this.currentLookAt.lerpVectors(this.returnStartLookAt, this.idleLookAt, t);
    this.camera.lookAt(this.currentLookAt);
  }

  private easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  isActive(): boolean {
    return this.mode !== 'idle';
  }
}
