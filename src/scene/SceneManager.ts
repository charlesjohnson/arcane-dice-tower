import * as THREE from 'three';

export class SceneManager {
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;
  private clock = new THREE.Clock();

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0f);

    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.position.set(0, 6, 14);
    this.camera.lookAt(0, 2.0, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.4;

    this.setupLighting();
    this.applyFov();
    this.setupResizeHandler();
  }

  private setupLighting(): void {
    const ambient = new THREE.AmbientLight(0x3d2a50, 0.6);
    this.scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xfff0dd, 1.0);
    keyLight.position.set(5, 10, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x8866bb, 0.3);
    fillLight.position.set(-3, 5, -2);
    this.scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xaa88ff, 0.5, 20);
    rimLight.position.set(0, 8, -5);
    this.scene.add(rimLight);

    // Front light to illuminate the open face of the tower
    const frontLight = new THREE.DirectionalLight(0xddc8ff, 0.5);
    frontLight.position.set(0, 6, 8);
    this.scene.add(frontLight);
  }

  private applyFov(): void {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera.aspect = aspect;
    this.camera.fov = aspect < 1 ? 65 : 50;
    this.camera.updateProjectionMatrix();
  }

  private setupResizeHandler(): void {
    window.addEventListener('resize', () => {
      this.applyFov();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  getDelta(): number {
    return this.clock.getDelta();
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }
}
