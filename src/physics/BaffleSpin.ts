import type { Body, IBodyEvent } from 'cannon-es';
import { Box, Vec3 } from 'cannon-es';

const MIN_IMPULSE = 1;
const MAX_IMPULSE = 3;
const SPIN_THRESHOLD = 3;

/**
 * Registers collision listeners on baffle bodies that apply random angular
 * impulses to dice on contact. This compensates for the zero-friction baffle
 * surfaces by adding realistic tumbling to sphere-shaped dice.
 *
 * Box shapes (D6) are excluded: their off-center contact points naturally
 * generate torque from baffle bounces. Spheres can't generate rotation
 * from frictionless contacts because the normal force passes through the
 * center of mass.
 */
export function enableBaffleSpin(baffleBodies: Body[]): void {
  for (const baffle of baffleBodies) {
    baffle.addEventListener('collide', (event: IBodyEvent) => {
      const diceBody = event.body;
      if (!diceBody || diceBody.mass === 0) return;

      // Box shapes (D6) get natural tumbling from off-center contact
      // points. Only sphere shapes need artificial spin.
      if (diceBody.shapes.some(s => s instanceof Box)) return;

      // Skip if already spinning fast enough — avoids runaway
      // accumulation across multiple baffles.
      if (diceBody.angularVelocity.length() > SPIN_THRESHOLD) return;

      const impulse = new Vec3(
        randomRange(-MAX_IMPULSE, MAX_IMPULSE),
        randomRange(-MAX_IMPULSE, MAX_IMPULSE),
        randomRange(-MAX_IMPULSE, MAX_IMPULSE),
      );

      // Ensure minimum magnitude so there's always noticeable spin
      const mag = impulse.length();
      if (mag < MIN_IMPULSE) {
        impulse.scale(MIN_IMPULSE / mag, impulse);
      }

      diceBody.angularVelocity.vadd(impulse, diceBody.angularVelocity);
    });
  }
}

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
