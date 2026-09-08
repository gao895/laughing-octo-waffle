import * as THREE from "three";
import type { CorridorBounds } from "./PlayerController";

/** 各ステージのランタイム実装が満たすインターフェース */
export interface StageRuntime {
  group: THREE.Group;
  bounds: CorridorBounds;
  spawnPosition: THREE.Vector3;
  spawnYaw: number;
  doorInteractPoint: THREE.Vector3;
  startGateInteractPoint: THREE.Vector3;
  interactRadius: number;
  /** 現在ループの異変を適用する。nullで異変なし状態にリセット */
  applyAnomaly(anomalyId: string | null): void;
  update(dt: number, playerPos: THREE.Vector3): void;
  dispose(): void;
}

/**
 * 現在アクティブなステージのThree.jsコンテンツをシーンに出し入れする。
 */
export class StageManager {
  private scene: THREE.Scene;
  current: StageRuntime | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  loadStage(runtime: StageRuntime) {
    this.unload();
    this.current = runtime;
    this.scene.add(runtime.group);
  }

  unload() {
    if (this.current) {
      this.scene.remove(this.current.group);
      this.current.dispose();
      this.current = null;
    }
  }

  update(dt: number, playerPos: THREE.Vector3) {
    this.current?.update(dt, playerPos);
  }
}
