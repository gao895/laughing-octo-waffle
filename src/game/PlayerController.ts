import * as THREE from "three";
import type { CameraManager } from "../three/CameraManager";

export interface CorridorBounds {
  /** 指定Z座標における通路の左右境界（ワールドX座標） */
  halfWidthAt(z: number): number;
  minZ: number;
  maxZ: number;
  centerX: number;
}

const WALK_SPEED = 2.2;
const DASH_SPEED = 4.2;
const DASH_DURATION = 0.9;
const DASH_COOLDOWN = 2.5;

/**
 * 一人称プレイヤーの移動・視点操作を管理する。
 * Pointer Lock APIでマウス視点、WASDで移動、Shiftで短時間ダッシュ。
 */
export class PlayerController {
  readonly position = new THREE.Vector3(0, 0, 0);
  private yaw = 0;
  private pitch = 0;
  private keys = new Set<string>();
  private domElement: HTMLElement;
  private cameraManager: CameraManager;
  private sensitivity = 0.5;
  private locked = false;

  private dashTimer = 0;
  private dashCooldownTimer = 0;
  private footstepDistance = 0;

  onFootstep: (() => void) | null = null;
  onLockChange: ((locked: boolean) => void) | null = null;

  private handleMouseMove = (e: MouseEvent) => {
    if (!this.locked) return;
    const s = 0.0022 * (0.3 + this.sensitivity * 1.4);
    this.yaw -= e.movementX * s;
    this.pitch -= e.movementY * s;
    this.pitch = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, this.pitch));
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keys.add(e.code);
  };
  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };

  private handlePointerLockChange = () => {
    this.locked = document.pointerLockElement === this.domElement;
    this.onLockChange?.(this.locked);
  };

  constructor(domElement: HTMLElement, cameraManager: CameraManager) {
    this.domElement = domElement;
    this.cameraManager = cameraManager;
    document.addEventListener("mousemove", this.handleMouseMove);
    document.addEventListener("keydown", this.handleKeyDown);
    document.addEventListener("keyup", this.handleKeyUp);
    document.addEventListener("pointerlockchange", this.handlePointerLockChange);
  }

  setSensitivity(v: number) {
    this.sensitivity = v;
  }

  requestLock() {
    if (document.pointerLockElement !== this.domElement) {
      this.domElement.requestPointerLock();
    }
  }

  exitLock() {
    if (document.pointerLockElement === this.domElement) {
      document.exitPointerLock();
    }
  }

  get isLocked() {
    return this.locked;
  }

  setYaw(v: number) {
    this.yaw = v;
  }

  resetKeys() {
    this.keys.clear();
  }

  /** 見た目上のカメラのXZ平面での前方向 */
  getForwardVector(): THREE.Vector3 {
    return new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
  }

  update(dt: number, bounds: CorridorBounds) {
    let moveX = 0;
    let moveZ = 0;
    const forward = this.keys.has("KeyW") || this.keys.has("ArrowUp");
    const backward = this.keys.has("KeyS") || this.keys.has("ArrowDown");
    const left = this.keys.has("KeyA") || this.keys.has("ArrowLeft");
    const right = this.keys.has("KeyD") || this.keys.has("ArrowRight");

    if (forward) moveZ -= 1;
    if (backward) moveZ += 1;
    if (left) moveX -= 1;
    if (right) moveX += 1;

    const moving = moveX !== 0 || moveZ !== 0;

    // ダッシュ処理
    const wantsDash = this.keys.has("ShiftLeft") || this.keys.has("ShiftRight");
    if (wantsDash && moving && this.dashTimer <= 0 && this.dashCooldownTimer <= 0) {
      this.dashTimer = DASH_DURATION;
      this.dashCooldownTimer = DASH_COOLDOWN;
    }
    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
    }
    if (this.dashCooldownTimer > 0) this.dashCooldownTimer -= dt;

    const speed = this.dashTimer > 0 ? DASH_SPEED : WALK_SPEED;
    if (this.dashTimer > 0) this.cameraManager.setTemporaryFov(82);
    else this.cameraManager.resetFov();

    if (moving) {
      const len = Math.hypot(moveX, moveZ);
      moveX /= len;
      moveZ /= len;
      // yawに基づいてワールド座標へ変換
      const sinY = Math.sin(this.yaw);
      const cosY = Math.cos(this.yaw);
      const worldX = moveX * cosY + moveZ * sinY;
      const worldZ = -moveX * sinY + moveZ * cosY;

      const nextX = this.position.x + worldX * speed * dt;
      const nextZ = this.position.z + worldZ * speed * dt;

      const halfWidth = bounds.halfWidthAt(nextZ) - 0.35;
      const clampedX = Math.max(bounds.centerX - halfWidth, Math.min(bounds.centerX + halfWidth, nextX));
      const clampedZ = Math.max(bounds.minZ + 0.4, Math.min(bounds.maxZ - 0.4, nextZ));

      this.position.x = clampedX;
      this.position.z = clampedZ;

      this.footstepDistance += speed * dt;
      const stepInterval = this.dashTimer > 0 ? 0.55 : 0.75;
      if (this.footstepDistance >= stepInterval) {
        this.footstepDistance = 0;
        this.onFootstep?.();
      }
    }

    // 頭の上下揺れ（歩行時のヘッドボブ）
    const bobPhase = performance.now() * 0.006;
    const bob = moving ? Math.sin(bobPhase) * 0.02 : 0;

    this.cameraManager.camera.position.set(this.position.x, 1.65 + bob, this.position.z);
    this.cameraManager.camera.rotation.set(this.pitch, this.yaw, 0, "YXZ");
    this.cameraManager.update(dt);
  }

  dispose() {
    document.removeEventListener("mousemove", this.handleMouseMove);
    document.removeEventListener("keydown", this.handleKeyDown);
    document.removeEventListener("keyup", this.handleKeyUp);
    document.removeEventListener("pointerlockchange", this.handlePointerLockChange);
  }
}
