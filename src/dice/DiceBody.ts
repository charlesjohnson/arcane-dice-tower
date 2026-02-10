import * as CANNON from 'cannon-es';
import type { DiceType } from './DiceConfig';
import { DICE_CONFIGS } from './DiceConfig';

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
  return new CANNON.Sphere(radius);
}

export function applyRandomRollForce(body: CANNON.Body): void {
  const angX = (Math.random() - 0.5) * 20;
  const angY = (Math.random() - 0.5) * 20;
  const angZ = (Math.random() - 0.5) * 20;
  body.angularVelocity.set(angX, angY, angZ);

  // Small random offset, biased toward the back of the tower so dice
  // don't miss the baffles and fall out the open front.
  const offsetX = (Math.random() - 0.5) * 0.3;
  const offsetZ = (Math.random() - 0.5) * 0.3 - 0.15;
  body.position.x += offsetX;
  body.position.z += offsetZ;
}
