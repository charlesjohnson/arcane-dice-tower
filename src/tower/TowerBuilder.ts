// src/tower/TowerBuilder.ts
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { PhysicsWorld } from '../physics/PhysicsWorld';

const TOWER_HEIGHT = 8;
const TOWER_RADIUS = 1.5;
const TRAY_WIDTH = 3;
const TRAY_DEPTH = 2.5;
const WALL_THICKNESS = 0.15;

export interface Tower {
  group: THREE.Group;
  baffles: THREE.Mesh[];
  baffleBodies: CANNON.Body[];
  trayFloorBody: CANNON.Body;
  runeGlowMeshes: THREE.Mesh[];
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
  const baffleGeo = new THREE.BoxGeometry(TOWER_RADIUS * 1.6, 0.1, TOWER_RADIUS * 1.2);
  const bafflePositions = [
    { x: 0.4, y: 6.5, z: -0.2, rotZ: -0.3 },
    { x: -0.4, y: 5.0, z: -0.2, rotZ: 0.3 },
    { x: 0.3, y: 3.5, z: -0.2, rotZ: -0.25 },
    { x: -0.3, y: 2.0, z: -0.2, rotZ: 0.25 },
  ];

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
      TOWER_RADIUS * 0.8,
      0.05,
      TOWER_RADIUS * 0.6
    );
    const baffleBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(halfExtents),
    });
    baffleBody.position.set(bp.x, bp.y, bp.z);
    baffleBody.quaternion.setFromEuler(0, 0, bp.rotZ);
    physics.addStaticBody(baffleBody);
    baffleBodies.push(baffleBody);
  }

  // --- Tower base ramp (guides dice from baffles into the tray) ---
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

  // Tray floor physics
  const floorBody = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(TRAY_WIDTH / 2, 0.05, TRAY_DEPTH / 2)),
  });
  floorBody.position.set(0, trayFloorY, TOWER_RADIUS + TRAY_DEPTH / 2);
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

  // --- Sloped floor to funnel dice from tower base into tray ---
  const slopeLength = TOWER_RADIUS + TRAY_DEPTH * 0.3;
  const slopeAngle = Math.atan2(trayFloorY, slopeLength); // gentle slope
  const slopeGeo = new THREE.BoxGeometry(TOWER_RADIUS * 1.8, 0.1, slopeLength);
  const slopeMesh = new THREE.Mesh(slopeGeo, ivoryMaterial);
  slopeMesh.position.set(0, trayFloorY / 2, slopeLength / 2 - TOWER_RADIUS * 0.3);
  slopeMesh.rotation.x = slopeAngle;
  slopeMesh.receiveShadow = true;
  group.add(slopeMesh);

  // Physics collider for the slope
  const slopeBody = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(TOWER_RADIUS * 0.9, 0.05, slopeLength / 2)),
  });
  slopeBody.position.set(0, trayFloorY / 2, slopeLength / 2 - TOWER_RADIUS * 0.3);
  slopeBody.quaternion.setFromEuler(slopeAngle, 0, 0);
  physics.addStaticBody(slopeBody);

  // Front lip on tray to keep dice from bouncing out
  const frontLipBody = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(TRAY_WIDTH / 2, 0.15, WALL_THICKNESS / 2)),
  });
  frontLipBody.position.set(0, trayFloorY + 0.15, TOWER_RADIUS);
  physics.addStaticBody(frontLipBody);

  // Tower interior wall physics (back + sides)
  const backBody = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(TOWER_RADIUS, TOWER_HEIGHT / 2, WALL_THICKNESS / 2)),
  });
  backBody.position.set(0, TOWER_HEIGHT / 2, -TOWER_RADIUS);
  physics.addStaticBody(backBody);

  const sideHalf = new CANNON.Vec3(WALL_THICKNESS / 2, TOWER_HEIGHT / 2, TOWER_RADIUS);
  const leftBody = new CANNON.Body({ mass: 0, shape: new CANNON.Box(sideHalf) });
  leftBody.position.set(-TOWER_RADIUS, TOWER_HEIGHT / 2, 0);
  physics.addStaticBody(leftBody);

  const rightBody = new CANNON.Body({ mass: 0, shape: new CANNON.Box(sideHalf) });
  rightBody.position.set(TOWER_RADIUS, TOWER_HEIGHT / 2, 0);
  physics.addStaticBody(rightBody);

  scene.add(group);

  return {
    group,
    baffles,
    baffleBodies,
    trayFloorBody: floorBody,
    runeGlowMeshes,
    trayFloorY,
    dropPosition: new THREE.Vector3(0, TOWER_HEIGHT + 1, 0),
  };
}
