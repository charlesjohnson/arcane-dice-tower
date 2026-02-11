import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { CameraDirector } from './CameraDirector';

function makeCamera(): THREE.PerspectiveCamera {
  return new THREE.PerspectiveCamera(50, 1, 0.1, 100);
}

describe('CameraDirector', () => {
  describe('idle position', () => {
    it('sets idle position further back to show full tower', () => {
      const camera = makeCamera();
      const director = new CameraDirector(camera);
      // Idle Z should be >= 14 (pulled back from original 12)
      director.returnToIdle();
      // Advance to completion
      director.update(2.0);
      expect(camera.position.z).toBeGreaterThanOrEqual(14);
    });

    it('sets idle Y higher to see tower top', () => {
      const camera = makeCamera();
      const director = new CameraDirector(camera);
      director.returnToIdle();
      director.update(2.0);
      expect(camera.position.y).toBeGreaterThanOrEqual(6);
    });
  });

  describe('playRollSequence', () => {
    it('starts from the current camera position, not a fixed keyframe', () => {
      const camera = makeCamera();
      camera.position.set(5, 10, 20);
      const director = new CameraDirector(camera);

      director.playRollSequence(8, -2);
      // At t=0, the camera should still be at its starting position
      director.update(0.001);
      expect(camera.position.x).toBeCloseTo(5, 0);
      expect(camera.position.y).toBeCloseTo(10, 0);
      expect(camera.position.z).toBeCloseTo(20, 0);
    });

    it('ends at the tray view position', () => {
      const camera = makeCamera();
      const director = new CameraDirector(camera);
      const trayY = -2;

      director.playRollSequence(8, trayY);
      // Advance well past the duration to reach the end
      director.update(10.0);
      // Final position should be near tray level, zoomed in
      expect(camera.position.y).toBeCloseTo(trayY + 4, 0);
      expect(camera.position.z).toBeLessThanOrEqual(6);
    });

    it('has a longer duration than 3 seconds to accommodate pullback', () => {
      const camera = makeCamera();
      const director = new CameraDirector(camera);

      director.playRollSequence(8, -2);
      // At 3 seconds the animation should still be active
      director.update(3.0);
      expect(director.isActive()).toBe(true);
    });
  });
});
