// src/effects/AmbientBackground.ts
import * as THREE from 'three';

export class AmbientBackground {
  private geometries: THREE.LineSegments[] = [];

  constructor(scene: THREE.Scene) {
    const material = new THREE.LineBasicMaterial({
      color: 0x331155,
      transparent: true,
      opacity: 0.15,
    });

    // Rotating arcane circles
    for (let i = 0; i < 3; i++) {
      const radius = 6 + i * 3;
      const segments = 64;
      const points: THREE.Vector3[] = [];
      for (let j = 0; j <= segments; j++) {
        const angle = (j / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius
        ));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const circle = new THREE.LineSegments(
        new THREE.WireframeGeometry(geo),
        material.clone()
      );
      circle.position.y = -2 + i * 0.5;
      circle.rotation.x = Math.PI / 2 + i * 0.1;
      scene.add(circle);
      this.geometries.push(circle);
    }

    // Pentagram
    const pentPoints: THREE.Vector3[] = [];
    for (let i = 0; i < 5; i++) {
      const angle1 = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      const angle2 = (((i + 2) % 5) * 2 * Math.PI) / 5 - Math.PI / 2;
      pentPoints.push(
        new THREE.Vector3(Math.cos(angle1) * 8, 0, Math.sin(angle1) * 8),
        new THREE.Vector3(Math.cos(angle2) * 8, 0, Math.sin(angle2) * 8)
      );
    }
    const pentGeo = new THREE.BufferGeometry().setFromPoints(pentPoints);
    const pentagram = new THREE.LineSegments(pentGeo, material.clone());
    pentagram.position.y = -3;
    scene.add(pentagram);
    this.geometries.push(pentagram);
  }

  update(time: number): void {
    for (let i = 0; i < this.geometries.length; i++) {
      const geo = this.geometries[i];
      geo.rotation.y = time * 0.05 * (i % 2 === 0 ? 1 : -1);
      const mat = geo.material as THREE.LineBasicMaterial;
      mat.opacity = 0.1 + Math.sin(time * 0.5 + i) * 0.05;
    }
  }
}
