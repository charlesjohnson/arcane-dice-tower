import * as CANNON from 'cannon-es';

const VELOCITY_THRESHOLD = 0.05;
const ANGULAR_VELOCITY_THRESHOLD = 0.1;

export class PhysicsWorld {
  readonly world: CANNON.World;
  private dynamicBodies: CANNON.Body[] = [];

  constructor() {
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.82, 0),
    });
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    this.world.allowSleep = true;
    this.world.defaultContactMaterial.friction = 0.3;
    this.world.defaultContactMaterial.restitution = 0.3;
  }

  addDynamicBody(body: CANNON.Body): void {
    this.dynamicBodies.push(body);
    this.world.addBody(body);
  }

  addStaticBody(body: CANNON.Body): void {
    this.world.addBody(body);
  }

  removeDynamicBody(body: CANNON.Body): void {
    this.dynamicBodies = this.dynamicBodies.filter((b) => b !== body);
    this.world.removeBody(body);
  }

  clearDynamicBodies(): void {
    for (const body of this.dynamicBodies) {
      this.world.removeBody(body);
    }
    this.dynamicBodies = [];
  }

  step(delta: number): void {
    this.world.step(1 / 60, delta, 3);
  }

  areBodiesSettled(): boolean {
    if (this.dynamicBodies.length === 0) return true;
    return this.dynamicBodies.every((body) => {
      const v = body.velocity;
      const w = body.angularVelocity;
      return (
        v.length() < VELOCITY_THRESHOLD &&
        w.length() < ANGULAR_VELOCITY_THRESHOLD
      );
    });
  }
}
