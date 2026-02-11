import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { CameraDirector } from './CameraDirector';

function makeCamera(): THREE.PerspectiveCamera {
  return new THREE.PerspectiveCamera(50, 16 / 9, 0.1, 100);
}

describe('CameraDirector', () => {
  describe('idle position', () => {
    it('returns to idle position after returnToIdle', () => {
      const camera = makeCamera();
      const director = new CameraDirector(camera);
      director.returnToIdle();
      director.update(2.0, []);
      expect(camera.position.z).toBeGreaterThanOrEqual(14);
      expect(camera.position.y).toBeGreaterThanOrEqual(6);
    });
  });

  describe('dice tracking', () => {
    it('enters tracking mode on startTracking', () => {
      const camera = makeCamera();
      const director = new CameraDirector(camera);
      director.startTracking(0.1);
      expect(director.isActive()).toBe(true);
    });

    it('moves camera toward a single die position', () => {
      const camera = makeCamera();
      camera.position.set(0, 6, 14);
      const director = new CameraDirector(camera);
      director.startTracking(0.1);

      // Die at y=5 inside the tower
      for (let i = 0; i < 30; i++) {
        director.update(1 / 60, [{ x: 0, y: 5, z: -0.2 }]);
      }

      // Camera Y should have moved toward the die's Y
      expect(camera.position.y).toBeLessThan(8);
      expect(camera.position.y).toBeGreaterThan(3);
    });

    it('pulls camera back further when multiple dice are spread apart', () => {
      const camera = makeCamera();
      camera.position.set(0, 6, 14);
      const director = new CameraDirector(camera);
      director.startTracking(0.1);

      // Two dice spread wide enough to exceed MIN_TRACKING_DISTANCE
      const spread = [
        { x: -2.5, y: 5, z: 0 },
        { x: 2.5, y: 5, z: 0 },
      ];
      for (let i = 0; i < 60; i++) {
        director.update(1 / 60, spread);
      }
      const zSpread = camera.position.z;

      // Single die — should be closer
      const camera2 = makeCamera();
      camera2.position.set(0, 6, 14);
      const director2 = new CameraDirector(camera2);
      director2.startTracking(0.1);

      for (let i = 0; i < 60; i++) {
        director2.update(1 / 60, [{ x: 0, y: 5, z: 0 }]);
      }
      const zSingle = camera2.position.z;

      // Spread dice should push camera further back (higher z)
      expect(zSpread).toBeGreaterThan(zSingle);
    });
  });

  describe('tray pivot', () => {
    it('transitions to tray view on notifyTrayHit', () => {
      const camera = makeCamera();
      camera.position.set(0, 5, 6);
      const director = new CameraDirector(camera);
      director.startTracking(0.1);

      // Update in tracking mode first
      director.update(0.1, [{ x: 0, y: 3, z: 0 }]);

      // Trigger tray hit
      director.notifyTrayHit();

      // Advance several frames to let the transition play out
      for (let i = 0; i < 120; i++) {
        director.update(1 / 60, [{ x: 0, y: 0.1, z: 2.75 }]);
      }

      // Camera should now be looking down at the tray (y > trayFloorY, z in tray range)
      expect(camera.position.y).toBeGreaterThan(0.1);
      expect(camera.position.y).toBeLessThan(6);
    });

    it('ignores second trayHit notification', () => {
      const camera = makeCamera();
      const director = new CameraDirector(camera);
      director.startTracking(0.1);
      director.update(0.1, [{ x: 0, y: 3, z: 0 }]);

      director.notifyTrayHit();
      // Advance partway through transition
      for (let i = 0; i < 10; i++) {
        director.update(1 / 60, [{ x: 0, y: 0.1, z: 2 }]);
      }
      const posAfterFirst = camera.position.clone();

      // Second notification should not reset the transition
      director.notifyTrayHit();
      director.update(1 / 60, [{ x: 0, y: 0.1, z: 2 }]);

      // Camera should continue moving smoothly, not jump
      const diff = camera.position.distanceTo(posAfterFirst);
      expect(diff).toBeLessThan(1.0); // smooth, no jump
    });
  });

  describe('returnToIdle', () => {
    it('smoothly returns from tray view to idle', () => {
      const camera = makeCamera();
      const director = new CameraDirector(camera);
      director.startTracking(0.1);
      director.update(0.1, [{ x: 0, y: 3, z: 0 }]);
      director.notifyTrayHit();

      // Advance past tray transition
      for (let i = 0; i < 120; i++) {
        director.update(1 / 60, []);
      }

      director.returnToIdle();
      director.update(2.0, []);

      expect(camera.position.z).toBeGreaterThanOrEqual(14);
      expect(camera.position.y).toBeGreaterThanOrEqual(6);
    });
  });
});
