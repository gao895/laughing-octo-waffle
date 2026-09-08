import * as THREE from "three";

/**
 * 一人称視点カメラ。PlayerControllerから位置・回転を受け取って更新される。
 */
export class CameraManager {
  readonly camera: THREE.PerspectiveCamera;
  private baseFov: number;
  private targetFov: number;
  private shakeOffset = new THREE.Vector3();
  private shakeIntensity = 0;

  constructor(aspect: number, fov = 75) {
    this.baseFov = fov;
    this.targetFov = fov;
    this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.05, 500);
    this.camera.position.set(0, 1.7, 0);
  }

  setAspect(aspect: number) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  setFov(fov: number) {
    this.baseFov = fov;
    this.targetFov = fov;
    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();
  }

  /** ダッシュ時などの一時的な視野角変化 */
  setTemporaryFov(fov: number) {
    this.targetFov = fov;
  }

  resetFov() {
    this.targetFov = this.baseFov;
  }

  /** ジャンプスケアや衝撃演出用の軽いカメラシェイク */
  shake(intensity: number) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
  }

  update(dt: number) {
    if (Math.abs(this.camera.fov - this.targetFov) > 0.01) {
      this.camera.fov += (this.targetFov - this.camera.fov) * Math.min(1, dt * 6);
      this.camera.updateProjectionMatrix();
    }
    if (this.shakeIntensity > 0.001) {
      this.shakeOffset.set(
        (Math.random() - 0.5) * this.shakeIntensity,
        (Math.random() - 0.5) * this.shakeIntensity,
        0
      );
      this.camera.position.x += this.shakeOffset.x * 0.02;
      this.camera.position.y += this.shakeOffset.y * 0.02;
      this.shakeIntensity *= Math.max(0, 1 - dt * 4);
    }
  }
}
