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
    this.camera.position.set(0, 5, 12);
    this.camera.lookAt(0, 2, 0);

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
    this.renderer.toneMappingExposure = 1.2;

    this.setupLighting();
    this.setupResizeHandler();
  }

  private setupLighting(): void {
    const ambient = new THREE.AmbientLight(0x2a1a3a, 0.4);
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
  }

  private setupResizeHandler(): void {
    window.addEventListener('resize', () => {
      const aspect = window.innerWidth / window.innerHeight;
      this.camera.aspect = aspect;

      // Widen FOV in portrait mode so tower and tray are visible
      if (aspect < 1) {
        this.camera.fov = 65;
      } else {
        this.camera.fov = 50;
      }

      this.camera.updateProjectionMatrix();
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
