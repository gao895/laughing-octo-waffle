import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { FilmicShader } from "./FilmicShader";

/**
 * Three.jsのレンダラー・シーンのライフサイクルを管理する。
 * 影は限定的にし、ポストプロセスはブルーム+ビネット/粒状感/色収差の
 * 1パスのみに絞って軽量さを保っている。
 */
export class SceneManager {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  private resizeObserver: ResizeObserver;
  private container: HTMLElement;
  private rafId: number | null = null;

  private composer: EffectComposer | null = null;
  private bloomPass: UnrealBloomPass | null = null;
  private filmicPass: ShaderPass | null = null;
  private startTime = performance.now();

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x000000, 0.045);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    container.appendChild(this.renderer.domElement);
    this.setSize();

    this.resizeObserver = new ResizeObserver(() => this.setSize());
    this.resizeObserver.observe(container);
  }

  private setSize() {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.composer?.setSize(w, h);
  }

  get aspect(): number {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    return w / h;
  }

  private setupPostProcessing(camera: THREE.Camera) {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;

    const composer = new EffectComposer(this.renderer);
    composer.addPass(new RenderPass(this.scene, camera));

    const bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 0.5, 0.45, 0.86);
    composer.addPass(bloomPass);
    this.bloomPass = bloomPass;

    const filmicPass = new ShaderPass(FilmicShader);
    composer.addPass(filmicPass);
    this.filmicPass = filmicPass;

    composer.addPass(new OutputPass());

    this.composer = composer;
  }

  render(camera: THREE.Camera) {
    if (!this.composer) this.setupPostProcessing(camera);
    if (this.filmicPass) {
      this.filmicPass.uniforms.time.value = (performance.now() - this.startTime) / 1000;
    }
    this.composer!.render();
  }

  dispose() {
    this.resizeObserver.disconnect();
    this.composer?.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
    this.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else if (mat) mat.dispose();
    });
  }
}
