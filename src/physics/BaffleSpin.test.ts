import { describe, it, expect } from 'vitest';
import * as CANNON from 'cannon-es';
import { enableBaffleSpin } from './BaffleSpin';

describe('BaffleSpin', () => {
  it('applies angular impulse to sphere-shaped dice on baffle collision', () => {
    const baffleBody = new CANNON.Body({ mass: 0 });
    const diceBody = new CANNON.Body({
      mass: 1,
      shape: new CANNON.Sphere(0.5),
    });

    enableBaffleSpin([baffleBody]);

    const before = diceBody.angularVelocity.clone();

    baffleBody.dispatchEvent({
      type: 'collide',
      body: diceBody,
    } as unknown as CANNON.IBodyEvent);

    const after = diceBody.angularVelocity;
    const delta = new CANNON.Vec3();
    after.vsub(before, delta);
    expect(delta.length()).toBeGreaterThan(0);
  });

  it('does not apply impulse to static bodies', () => {
    const baffleBody = new CANNON.Body({ mass: 0 });
    const wallBody = new CANNON.Body({ mass: 0 });

    enableBaffleSpin([baffleBody]);

    baffleBody.dispatchEvent({
      type: 'collide',
      body: wallBody,
    } as unknown as CANNON.IBodyEvent);

    expect(wallBody.angularVelocity.length()).toBe(0);
  });

  it('does not apply impulse to box-shaped dice (D6)', () => {
    const baffleBody = new CANNON.Body({ mass: 0 });
    const half = 0.3;
    const diceBody = new CANNON.Body({
      mass: 4,
      shape: new CANNON.Box(new CANNON.Vec3(half, half, half)),
    });

    enableBaffleSpin([baffleBody]);

    const before = diceBody.angularVelocity.clone();

    baffleBody.dispatchEvent({
      type: 'collide',
      body: diceBody,
    } as unknown as CANNON.IBodyEvent);

    // Box shapes get natural tumbling from off-center contacts
    expect(diceBody.angularVelocity.x).toBe(before.x);
    expect(diceBody.angularVelocity.y).toBe(before.y);
    expect(diceBody.angularVelocity.z).toBe(before.z);
  });

  it('keeps impulse magnitude within a reasonable range', () => {
    const magnitudes: number[] = [];
    for (let i = 0; i < 50; i++) {
      const baffleBody = new CANNON.Body({ mass: 0 });
      const diceBody = new CANNON.Body({
        mass: 1,
        shape: new CANNON.Sphere(0.5),
      });
      diceBody.angularVelocity.set(0, 0, 0);

      enableBaffleSpin([baffleBody]);

      baffleBody.dispatchEvent({
        type: 'collide',
        body: diceBody,
      } as unknown as CANNON.IBodyEvent);

      magnitudes.push(diceBody.angularVelocity.length());
    }

    // MAX_IMPULSE=3 per axis → max magnitude = sqrt(3)*3 ≈ 5.2
    for (const mag of magnitudes) {
      expect(mag).toBeGreaterThan(0);
      expect(mag).toBeLessThan(6);
    }
  });

  it('skips impulse when dice is already spinning fast', () => {
    const baffleBody = new CANNON.Body({ mass: 0 });
    const diceBody = new CANNON.Body({
      mass: 1,
      shape: new CANNON.Sphere(0.5),
    });

    // Set angular velocity above the threshold (3 rad/s)
    diceBody.angularVelocity.set(2, 2, 2); // length ≈ 3.46
    const before = diceBody.angularVelocity.clone();

    enableBaffleSpin([baffleBody]);

    baffleBody.dispatchEvent({
      type: 'collide',
      body: diceBody,
    } as unknown as CANNON.IBodyEvent);

    expect(diceBody.angularVelocity.x).toBe(before.x);
    expect(diceBody.angularVelocity.y).toBe(before.y);
    expect(diceBody.angularVelocity.z).toBe(before.z);
  });
});
