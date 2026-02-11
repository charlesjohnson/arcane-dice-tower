// src/tower/TowerBuilder.ts
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { DICE_MATERIAL } from '../dice/DiceBody';

const TOWER_HEIGHT = 8;
const TOWER_RADIUS = 2.0;
const TRAY_WIDTH = 4;
const TRAY_DEPTH = 2.5;
const WALL_THICKNESS = 0.15;
const COLLISION_WALL_HALF = 0.5;

export interface Tower {
  group: THREE.Group;
  baffles: THREE.Mesh[];
  baffleBodies: CANNON.Body[];
  trayFloorBody: CANNON.Body;
  runeGlowMeshes: THREE.Mesh[];
  interiorLights: THREE.PointLight[];
  trayFloorY: number;
  dropPosition: THREE.Vector3;
}

export function buildTower(
  scene: THREE.Scene,
  physics: PhysicsWorld
): Tower {
  const group = new THREE.Group();
  const baffles: THREE.Mesh[] = [];
  const baffleBodies: CANNON.Body[] = [];
  const runeGlowMeshes: THREE.Mesh[] = [];

  const ivoryMaterial = new THREE.MeshStandardMaterial({
    color: 0xfff8ee,
    roughness: 0.15,
    metalness: 0.05,
    envMapIntensity: 1.0,
  });

  const trayMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a0a2e,
    roughness: 0.9,
    metalness: 0.0,
  });

  const runeGlowMaterial = new THREE.MeshStandardMaterial({
    color: 0xddaa44,
    emissive: 0xddaa44,
    emissiveIntensity: 0.8,
    transparent: true,
    opacity: 0.6,
  });

  // --- Tower body: back + side walls (front is open / cutaway) ---
  // Back wall
  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(TOWER_RADIUS * 2, TOWER_HEIGHT, WALL_THICKNESS),
    ivoryMaterial
  );
  backWall.position.set(0, TOWER_HEIGHT / 2, -TOWER_RADIUS);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  group.add(backWall);

  // Left wall
  const sideWall = new THREE.BoxGeometry(WALL_THICKNESS, TOWER_HEIGHT, TOWER_RADIUS * 2);
  const leftWall = new THREE.Mesh(sideWall, ivoryMaterial);
  leftWall.position.set(-TOWER_RADIUS, TOWER_HEIGHT / 2, 0);
  leftWall.castShadow = true;
  group.add(leftWall);

  // Right wall
  const rightWall = new THREE.Mesh(sideWall.clone(), ivoryMaterial);
  rightWall.position.set(TOWER_RADIUS, TOWER_HEIGHT / 2, 0);
  rightWall.castShadow = true;
  group.add(rightWall);

  // --- Rune strips along edges ---
  const runeStripGeo = new THREE.BoxGeometry(0.05, TOWER_HEIGHT, 0.05);
  const edgePositions = [
    [-TOWER_RADIUS, TOWER_HEIGHT / 2, -TOWER_RADIUS],
    [TOWER_RADIUS, TOWER_HEIGHT / 2, -TOWER_RADIUS],
    [-TOWER_RADIUS, TOWER_HEIGHT / 2, TOWER_RADIUS],
    [TOWER_RADIUS, TOWER_HEIGHT / 2, TOWER_RADIUS],
  ];
  for (const [x, y, z] of edgePositions) {
    const rune = new THREE.Mesh(runeStripGeo, runeGlowMaterial.clone());
    rune.position.set(x, y, z);
    group.add(rune);
    runeGlowMeshes.push(rune);
  }

  // --- Internal baffles (angled shelves) ---
  // Baffles span nearly the full tower depth: flush with the back wall and
  // leaving only a ~0.2 unit gap to the front wall (too narrow for any die
  // to enter). The front wall uses a low-friction ContactMaterial so dice
  // touching it while on a baffle still slide off the slope.
  const baffleHalfZ = 1.4; // flush with back wall, front gap < die radius
  const baffleCenterZ = -(TOWER_RADIUS - COLLISION_WALL_HALF) + baffleHalfZ; // -0.65
  const baffleGeo = new THREE.BoxGeometry(TOWER_RADIUS * 0.8, 0.1, baffleHalfZ * 2);
  const bafflePositions = [
    { x: 0.8, y: 7.0, z: baffleCenterZ, rotZ: 0.55 },
    { x: -0.8, y: 5.0, z: baffleCenterZ, rotZ: -0.55 },
    { x: 0.85, y: 3.0, z: baffleCenterZ, rotZ: 0.55 },
    { x: -0.75, y: 1.2, z: baffleCenterZ, rotZ: -0.50 },
  ];

  // Frictionless baffles: cannon-es's box-box friction solver applies
  // far more friction than specified for any non-zero coefficient, so
  // D6 box shapes stall on angled surfaces. Friction=0 disables the
  // friction solver entirely. Normal forces from the angled surface
  // still redirect dice in the zig-zag pattern; friction isn't needed.
  const baffleSurfaceMaterial = new CANNON.Material({
    friction: 0,
    restitution: 0.3,
  });

  // Register explicit ContactMaterial so cannon-es uses friction=0
  // instead of falling back to defaultContactMaterial (0.3).
  physics.world.addContactMaterial(new CANNON.ContactMaterial(
    DICE_MATERIAL, baffleSurfaceMaterial, { friction: 0, restitution: 0.3 }
  ));

  for (const bp of bafflePositions) {
    const baffle = new THREE.Mesh(baffleGeo, ivoryMaterial.clone());
    baffle.position.set(bp.x, bp.y, bp.z);
    baffle.rotation.z = bp.rotZ;
    baffle.castShadow = true;
    baffle.receiveShadow = true;
    group.add(baffle);
    baffles.push(baffle);

    // Physics collider for baffle
    const halfExtents = new CANNON.Vec3(
      TOWER_RADIUS * 0.4,
      0.05,
      baffleHalfZ
    );
    const baffleBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(halfExtents),
      material: baffleSurfaceMaterial,
    });
    baffleBody.position.set(bp.x, bp.y, bp.z);
    baffleBody.quaternion.setFromEuler(0, 0, bp.rotZ);
    physics.addStaticBody(baffleBody);
    baffleBodies.push(baffleBody);
  }

  // --- Tower base ramp (guides dice from baffles into the tray) ---
  // Frictionless surface: cannon-es's box-box friction solver applies far
  // more friction than specified for low coefficients (box contacts create
  // many constraint points). Only friction=0 reliably disables friction
  // forces and lets D6 box shapes slide on the shallow ~12° ramp.
  const rampSurfaceMaterial = new CANNON.Material({
    friction: 0,
    restitution: 0.3,
  });

  physics.world.addContactMaterial(new CANNON.ContactMaterial(
    DICE_MATERIAL, rampSurfaceMaterial, { friction: 0, restitution: 0.3 }
  ));

  const rampDepth = TOWER_RADIUS * 2;
  const rampWidth = TOWER_RADIUS * 2;
  const rampThickness = 0.1;
  const rampBackY = 1.0;   // height at back wall
  const rampFrontY = 0.15; // height at front opening, near tray floor
  const rampCenterY = (rampBackY + rampFrontY) / 2;
  const rampAngleX = Math.atan2(rampBackY - rampFrontY, rampDepth);

  const rampMesh = new THREE.Mesh(
    new THREE.BoxGeometry(rampWidth, rampThickness, rampDepth),
    ivoryMaterial
  );
  rampMesh.position.set(0, rampCenterY, 0);
  rampMesh.rotation.x = rampAngleX;
  rampMesh.receiveShadow = true;
  group.add(rampMesh);

  const rampBody = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(
      new CANNON.Vec3(rampWidth / 2, rampThickness / 2, rampDepth / 2)
    ),
    material: rampSurfaceMaterial,
  });
  rampBody.position.set(0, rampCenterY, 0);
  rampBody.quaternion.setFromEuler(rampAngleX, 0, 0);
  physics.addStaticBody(rampBody);

  // --- Tray ---
  const trayFloorY = 0.1;

  // Tray floor
  const trayFloor = new THREE.Mesh(
    new THREE.BoxGeometry(TRAY_WIDTH, 0.1, TRAY_DEPTH),
    trayMaterial
  );
  trayFloor.position.set(0, trayFloorY, TOWER_RADIUS + TRAY_DEPTH / 2);
  trayFloor.receiveShadow = true;
  group.add(trayFloor);

  // Tray floor physics — use a Plane instead of a Box so there are no
  // vertical front-face edges. Box edges act as walls that catch D6
  // corners poking below the ramp surface, stalling dice at the ramp exit.
  // A Plane only pushes upward (no backward force from edge normals).
  const floorBody = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Plane(),
    material: rampSurfaceMaterial,
  });
  floorBody.position.set(0, trayFloorY, 0);
  floorBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // face upward
  physics.addStaticBody(floorBody);

  // Tray walls (left, right, back)
  const trayWallGeo = new THREE.BoxGeometry(WALL_THICKNESS, 0.6, TRAY_DEPTH);
  const leftTrayWall = new THREE.Mesh(trayWallGeo, ivoryMaterial);
  leftTrayWall.position.set(-TRAY_WIDTH / 2, trayFloorY + 0.3, TOWER_RADIUS + TRAY_DEPTH / 2);
  group.add(leftTrayWall);

  const rightTrayWall = new THREE.Mesh(trayWallGeo.clone(), ivoryMaterial);
  rightTrayWall.position.set(TRAY_WIDTH / 2, trayFloorY + 0.3, TOWER_RADIUS + TRAY_DEPTH / 2);
  group.add(rightTrayWall);

  const backTrayWall = new THREE.Mesh(
    new THREE.BoxGeometry(TRAY_WIDTH, 0.6, WALL_THICKNESS),
    ivoryMaterial
  );
  backTrayWall.position.set(0, trayFloorY + 0.3, TOWER_RADIUS + TRAY_DEPTH);
  group.add(backTrayWall);

  // Tray wall physics
  const trayWallPositions = [
    { pos: [-TRAY_WIDTH / 2, trayFloorY + 0.3, TOWER_RADIUS + TRAY_DEPTH / 2] as const, half: [WALL_THICKNESS / 2, 0.3, TRAY_DEPTH / 2] as const },
    { pos: [TRAY_WIDTH / 2, trayFloorY + 0.3, TOWER_RADIUS + TRAY_DEPTH / 2] as const, half: [WALL_THICKNESS / 2, 0.3, TRAY_DEPTH / 2] as const },
    { pos: [0, trayFloorY + 0.3, TOWER_RADIUS + TRAY_DEPTH] as const, half: [TRAY_WIDTH / 2, 0.3, WALL_THICKNESS / 2] as const },
  ];
  for (const tw of trayWallPositions) {
    const wallBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(new CANNON.Vec3(tw.half[0], tw.half[1], tw.half[2])),
    });
    wallBody.position.set(tw.pos[0], tw.pos[1], tw.pos[2]);
    physics.addStaticBody(wallBody);
  }

  // No bridge/slope between ramp and tray. Any box-shaped body in this
  // region has a vertical front face that catches D6 corners poking
  // below the ramp surface, stalling dice at the ramp edge.
  // The tray floor (frictionless) is low enough that its front face
  // can't catch die corners, and linearDamping 0.5 slows dice in the tray.

  // Tower interior wall physics (back + sides)
  // Physics bodies are thicker than visual walls to give the solver enough
  // margin to resolve collisions when dice are pressed against walls by
  // baffle contact forces. The extra thickness extends outward (away from
  // the tower interior) so it doesn't shrink the playable space.
  const backBody = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(TOWER_RADIUS, TOWER_HEIGHT / 2, COLLISION_WALL_HALF)),
  });
  backBody.position.set(0, TOWER_HEIGHT / 2, -TOWER_RADIUS);
  physics.addStaticBody(backBody);

  const sideHalf = new CANNON.Vec3(COLLISION_WALL_HALF, TOWER_HEIGHT / 2, TOWER_RADIUS);
  const leftBody = new CANNON.Body({ mass: 0, shape: new CANNON.Box(sideHalf) });
  leftBody.position.set(-TOWER_RADIUS, TOWER_HEIGHT / 2, 0);
  physics.addStaticBody(leftBody);

  const rightBody = new CANNON.Body({ mass: 0, shape: new CANNON.Box(sideHalf) });
  rightBody.position.set(TOWER_RADIUS, TOWER_HEIGHT / 2, 0);
  physics.addStaticBody(rightBody);

  // Invisible front wall prevents dice from flying out the open front.
  // Starts at y=2.5 to leave a tall gap for the ramp-to-tray exit.
  // Dice bouncing off the bottom baffle (y=1.2) with upward velocity
  // can reach y≈2 temporarily; the extra clearance prevents them from
  // catching the wall's bottom edge. The baffles extend to z=1.3
  // (only 0.2 unit gap to the wall at z=1.5), preventing dice from
  // escaping during the baffle zig-zag phase.
  const frontWallHeight = TOWER_HEIGHT - 2.5;
  // Frictionless front wall so dice pinned between a baffle and the front
  // wall slide down instead of stalling. Uses the same zero-friction surface
  // as the ramp (cannon-es box-box solver needs friction=0 to actually slide).
  const frontBody = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(TOWER_RADIUS, frontWallHeight / 2, COLLISION_WALL_HALF)),
    material: rampSurfaceMaterial,
  });
  frontBody.position.set(0, TOWER_HEIGHT - frontWallHeight / 2, TOWER_RADIUS);
  physics.addStaticBody(frontBody);

  // --- Interior point lights at each baffle level ---
  const interiorLights: THREE.PointLight[] = [];
  const interiorLightHeights = [7.0, 5.0, 3.0, 1.2];
  for (const h of interiorLightHeights) {
    const light = new THREE.PointLight(0x9966ff, 0.8, 4, 1.5);
    light.position.set(0, h, 0.5);
    group.add(light);
    interiorLights.push(light);
  }

  scene.add(group);

  return {
    group,
    baffles,
    baffleBodies,
    trayFloorBody: floorBody,
    runeGlowMeshes,
    interiorLights,
    trayFloorY,
    dropPosition: new THREE.Vector3(0, TOWER_HEIGHT + 1, 0),
  };
}
