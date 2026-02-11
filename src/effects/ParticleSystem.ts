// src/effects/ParticleSystem.ts
import * as THREE from 'three';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
  color: THREE.Color;
}

const _scratch = new THREE.Vector3();

export class ParticleSystem {
  private particles: Particle[] = [];
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private points: THREE.Points;
  private maxParticles: number;

  constructor(scene: THREE.Scene, maxParticles = 500) {
    this.maxParticles = maxParticles;
    this.geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(maxParticles * 3);
    const colors = new Float32Array(maxParticles * 3);
    const sizes = new Float32Array(maxParticles);

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    this.material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    scene.add(this.points);
  }

  emit(origin: THREE.Vector3, count: number, options: {
    color?: THREE.Color;
    speed?: number;
    life?: number;
    spread?: number;
    size?: number;
  } = {}): void {
    const {
      color = new THREE.Color(0xddaa44),
      speed = 3,
      life = 1.0,
      spread = 1,
      size = 0.08,
    } = options;

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      this.particles.push({
        position: origin.clone(),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * spread * speed,
          (Math.random() - 0.5) * spread * speed,
          (Math.random() - 0.5) * spread * speed
        ),
        life,
        maxLife: life,
        size,
        color: color.clone(),
      });
    }
  }

  update(delta: number): void {
    this.particles = this.particles.filter((p) => {
      p.life -= delta;
      if (p.life <= 0) return false;
      p.position.add(_scratch.copy(p.velocity).multiplyScalar(delta));
      p.velocity.y -= 2 * delta; // gentle gravity
      return true;
    });

    const positions = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    const colors = this.geometry.getAttribute('color') as THREE.BufferAttribute;
    const sizes = this.geometry.getAttribute('size') as THREE.BufferAttribute;

    for (let i = 0; i < this.maxParticles; i++) {
      if (i < this.particles.length) {
        const p = this.particles[i];
        const fadeRatio = p.life / p.maxLife;
        positions.setXYZ(i, p.position.x, p.position.y, p.position.z);
        colors.setXYZ(i, p.color.r * fadeRatio, p.color.g * fadeRatio, p.color.b * fadeRatio);
        sizes.setX(i, p.size * fadeRatio);
      } else {
        positions.setXYZ(i, 0, -100, 0);
        sizes.setX(i, 0);
      }
    }

    positions.needsUpdate = true;
    colors.needsUpdate = true;
    sizes.needsUpdate = true;
    this.geometry.setDrawRange(0, this.particles.length);
  }
}
