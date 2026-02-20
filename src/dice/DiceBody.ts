import * as CANNON from 'cannon-es';
import type { DiceType } from './DiceConfig';
import { DICE_CONFIGS } from './DiceConfig';

/** Shared material for all dice bodies, used to register ContactMaterials. */
export const DICE_MATERIAL = new CANNON.Material({
  friction: 0.4,
  restitution: 0.3,
});

export function createDiceBody(type: DiceType): CANNON.Body {
  const config = DICE_CONFIGS[type];
  const actualType = type === 'd100' ? 'd10' : type;

  const body = new CANNON.Body({
    mass: config.mass,
    shape: createCollisionShape(actualType, config.radius),
    material: DICE_MATERIAL,
    linearDamping: 0.45,
    angularDamping: 0.5,
  });

  body.allowSleep = true;
  // Low threshold so dice on the ramp (speed ~0.03–0.05) don't go to
  // sleep and can still wake neighbouring dice on contact. cannon-es
  // only wakes a sleeping body when the touching body's speed exceeds
  // sleepSpeedLimit * √2 ≈ 0.014, so a slow-sliding ramp die at 0.03
  // can wake tray dice that would otherwise act as immovable walls.
  body.sleepSpeedLimit = 0.01;
  body.sleepTimeLimit = 0.5;

  return body;
}

function createCollisionShape(type: DiceType, radius: number): CANNON.Shape {
  if (type === 'd4') {
    return createTetrahedronShape(radius);
  }

  if (type === 'd6') {
    const half = (radius * 1.2) / 2;
    return new CANNON.Box(new CANNON.Vec3(half, half, half));
  }

  // For all other dice, approximate with a sphere
  return new CANNON.Sphere(radius);
}

function createTetrahedronShape(radius: number): CANNON.ConvexPolyhedron {
  // Match Three.js TetrahedronGeometry vertices: a regular tetrahedron
  // with all vertices at distance `radius` from the origin.
  const s = radius / Math.sqrt(3);
  const vertices = [
    new CANNON.Vec3(s, s, s),
    new CANNON.Vec3(-s, -s, s),
    new CANNON.Vec3(-s, s, -s),
    new CANNON.Vec3(s, -s, -s),
  ];

  // Faces wound counter-clockwise when viewed from outside
  const faces = [
    [0, 2, 1],
    [0, 1, 3],
    [0, 3, 2],
    [1, 2, 3],
  ];

  return new CANNON.ConvexPolyhedron({ vertices, faces });
}

export function applyRandomRollForce(body: CANNON.Body): void {
  const angX = (Math.random() - 0.5) * 20;
  const angY = (Math.random() - 0.5) * 20;
  const angZ = (Math.random() - 0.5) * 20;
  body.angularVelocity.set(angX, angY, angZ);

  // Small random position jitter so stacked dice don't overlap.
  // Kept to ±0.1 to maintain clearance from tower walls at max spread.
  const offsetX = (Math.random() - 0.5) * 0.2;
  const offsetZ = (Math.random() - 0.5) * 0.2;
  body.position.x += offsetX;
  body.position.z += offsetZ;
}
