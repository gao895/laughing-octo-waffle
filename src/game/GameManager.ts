import * as THREE from "three";
import { SceneManager } from "../three/SceneManager";
import { CameraManager } from "../three/CameraManager";
import { LightingManager } from "../three/LightingManager";
import { PlayerController } from "./PlayerController";
import { StageManager } from "./StageManager";
import { AnomalyManager, type JudgementResult } from "./AnomalyManager";
import { LoopManager } from "./LoopManager";
import { AudioManager } from "./AudioManager";
import { SaveManager } from "./SaveManager";
import { EndingManager } from "./EndingManager";
import { buildStage01 } from "../stages/stage01/build";
import { buildStage02 } from "../stages/stage02/build";
import { buildStage03 } from "../stages/stage03/build";
import { buildStage04 } from "../stages/stage04/build";
import { buildStage05 } from "../stages/stage05/build";
import { buildStage06 } from "../stages/stage06/build";
import { buildStage07 } from "../stages/stage07/build";
import { buildStage08 } from "../stages/stage08/build";
import { getStageConfig } from "../data/stages";
import { getAnomaliesForStage } from "../data/anomalies";
import type { GameState, PlayerAction } from "../types/gameTypes";
import type { StageRuntime } from "./StageManager";

/** ステージIDごとのシーン構築関数レジストリ。新ステージ追加時はここに登録する。 */
const STAGE_BUILDERS: Record<number, (scene: THREE.Scene, lighting: LightingManager, audio: AudioManager) => StageRuntime> = {
  1: buildStage01,
  2: buildStage02,
  3: buildStage03,
  4: buildStage04,
  5: buildStage05,
  6: buildStage06,
  7: buildStage07,
  8: buildStage08,
};

export interface HudFrameInfo {
  promptAction: PlayerAction | null;
  fps: number;
  loopIndex: number;
  mistakes: number;
  maxMistakes: number;
  passCount: number;
}

export interface GameManagerCallbacks {
  onStateChange?: (state: GameState) => void;
  onStageLabel?: (stageId: number, name: string, subtitle: string) => void;
  onJudgement?: (result: JudgementResult) => void;
  onGameOver?: () => void;
  onStageClear?: (stageId: number, isFinalStage: boolean) => void;
  onFrame?: (info: HudFrameInfo) => void;
  onPointerLockLost?: () => void;
  /** ジャンプスケア発生の通知（UIの一瞬のフラッシュ演出トリガー用） */
  onJumpscare?: () => void;
}

const JUDGEMENT_LOCK_SEC = 1.4;

/**
 * ゲーム全体のオーケストレーター。
 * 各サブシステム(Player/Stage/Anomaly/Loop/Audio/Save/Ending)を統括し、
 * requestAnimationFrameループを実行する。
 */
export class GameManager {
  readonly sceneManager: SceneManager;
  readonly cameraManager: CameraManager;
  readonly lightingManager: LightingManager;
  readonly playerController: PlayerController;
  readonly stageManager: StageManager;
  readonly anomalyManager = new AnomalyManager();
  readonly saveManager = new SaveManager();
  readonly endingManager: EndingManager;
  readonly audioManager = new AudioManager();
  loopManager: LoopManager | null = null;

  private callbacks: GameManagerCallbacks = {};
  private state: GameState = "TITLE";
  private currentStageId = 1;
  private rafId: number | null = null;
  private lastTime = 0;
  private judgementLockTimer = 0;
  private fpsAccum = 0;
  private fpsFrames = 0;
  private fpsValue = 60;
  private debugGodMode = false;
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.sceneManager = new SceneManager(container);
    this.cameraManager = new CameraManager(this.sceneManager.aspect, this.saveManager.getSettings().fov);
    this.lightingManager = new LightingManager(this.sceneManager.scene, this.saveManager.getSettings().brightness);
    this.playerController = new PlayerController(this.sceneManager.renderer.domElement, this.cameraManager);
    this.stageManager = new StageManager(this.sceneManager.scene);
    this.endingManager = new EndingManager(this.saveManager);

    this.playerController.setSensitivity(this.saveManager.getSettings().mouseSensitivity);
    this.playerController.onFootstep = () => this.handleFootstep();
    this.playerController.onLockChange = (locked) => {
      if (!locked && this.state === "PLAYING") {
        this.callbacks.onPointerLockLost?.();
      }
    };

    window.addEventListener("keydown", this.handleKeyDown);

    if (import.meta.env.DEV) {
      (window as unknown as { __game: GameManager }).__game = this;
    }
  }

  setCallbacks(cb: GameManagerCallbacks) {
    this.callbacks = cb;
  }

  private setState(s: GameState) {
    this.state = s;
    this.callbacks.onStateChange?.(s);
  }

  get currentState() {
    return this.state;
  }

  get debugAnomalyList() {
    return getAnomaliesForStage(this.currentStageId);
  }

  toggleGodMode() {
    this.debugGodMode = !this.debugGodMode;
    return this.debugGodMode;
  }

  /** ゲーム開始（新規 or つづきから）。stageIdに対応するビルダーが未登録の場合は何もしない */
  startStage(stageId: number) {
    const config = getStageConfig(stageId);
    const builder = STAGE_BUILDERS[stageId];
    if (!config || !config.implemented || !builder) return;
    this.currentStageId = stageId;

    this.audioManager.init(this.saveManager.getSettings());
    this.audioManager.stopAmbience();
    this.audioManager.startAmbience();

    const runtime = builder(this.sceneManager.scene, this.lightingManager, this.audioManager);
    this.stageManager.loadStage(runtime);

    this.loopManager = new LoopManager(this.saveManager.getSettings().difficulty, config.loopsToClear);
    this.anomalyManager.reset();

    this.placeAtSpawn();
    this.anomalyManager.rollForLoop(stageId, this.loopManager.loopIndex, runtime, false);

    this.callbacks.onStageLabel?.(stageId, config.name, config.subtitle);
    this.saveManager.setReachedStage(stageId);

    this.playerController.requestLock();
    this.setState("PLAYING");
    this.lastTime = performance.now();
    if (this.rafId === null) this.loop();
  }

  /** 現在のステージの次に実装済みステージがあるか（リザルト画面のNEXT STAGE表示用） */
  isNextStageAvailable(): boolean {
    const next = getStageConfig(this.currentStageId + 1);
    return !!next && next.implemented;
  }

  startNextStage() {
    this.startStage(this.currentStageId + 1);
  }

  private placeAtSpawn() {
    const runtime = this.stageManager.current;
    if (!runtime) return;
    this.playerController.position.copy(runtime.spawnPosition);
    this.playerController.setYaw(runtime.spawnYaw);
    this.playerController.resetKeys();
  }

  resume() {
    this.playerController.requestLock();
    this.setState("PLAYING");
    this.lastTime = performance.now();
  }

  pause() {
    if (this.state !== "PLAYING") return;
    this.playerController.exitLock();
    this.setState("PAUSED");
  }

  quitToTitle() {
    this.playerController.exitLock();
    this.audioManager.stopAmbience();
    this.stageManager.unload();
    this.setState("TITLE");
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === "Escape") {
      if (this.state === "PLAYING") this.pause();
      else if (this.state === "PAUSED") this.resume();
    }
    if (e.code === "KeyE" && this.state === "PLAYING") {
      this.interact();
    }
  };

  /** E調べる操作。タッチUIのボタンからも呼び出される公開エントリーポイント */
  interact() {
    if (this.state !== "PLAYING") return;
    this.tryInteract();
  }

  private tryInteract() {
    const runtime = this.stageManager.current;
    if (!runtime || this.judgementLockTimer > 0) return;
    const pos = this.playerController.position;

    const distToDoor = pos.distanceTo(runtime.doorInteractPoint);
    const distToGate = pos.distanceTo(runtime.startGateInteractPoint);

    if (distToDoor <= runtime.interactRadius && distToDoor <= distToGate) {
      this.submitAction("PROCEED");
    } else if (distToGate <= runtime.interactRadius) {
      this.submitAction("RETURN");
    }
  }

  private handleFootstep() {
    this.audioManager.playFootstep();
    const activeId = this.anomalyManager.activeAnomaly?.id;
    if (activeId === "extra_footstep") {
      this.audioManager.playExtraFootstepGhost();
    } else if (activeId === "monitor_sync") {
      this.audioManager.playHeartbeat(999);
    }
  }

  /**
   * ジャンプスケア演出。乱用を避けるため、BAD END直前とボス異変を
   * 正しく見抜いてステージクリアする瞬間のみに限定して使用する。
   * （DebugMenuからの動作確認用に公開メソッドとしても呼べる）
   */
  triggerJumpscare() {
    this.cameraManager.shake(4.5);
    this.audioManager.playStinger();
    this.callbacks.onJumpscare?.();
  }

  private submitAction(action: PlayerAction) {
    if (!this.loopManager || !this.stageManager.current) return;
    const result = this.anomalyManager.judge(action);
    const effectiveCorrect = this.debugGodMode ? true : result.correct;
    const outcome = this.loopManager.registerOutcome(effectiveCorrect, result.isBossClear);

    this.callbacks.onJudgement?.(result);
    if (effectiveCorrect) this.audioManager.playCorrectChime();
    else this.audioManager.playWrongBuzz();

    this.judgementLockTimer = JUDGEMENT_LOCK_SEC;

    window.setTimeout(() => {
      if (outcome.gameOver) {
        // 失敗の瞬間だけジャンプスケアを使用する。演出を見せてから結果画面へ切り替える。
        this.triggerJumpscare();
        window.setTimeout(() => {
          this.saveManager.addMistake();
          this.endingManager.resolveBadEnd();
          this.setState("GAME_OVER");
          this.playerController.exitLock();
          this.callbacks.onGameOver?.();
        }, 450);
        return;
      }
      if (outcome.stageCleared) {
        if (result.isBossClear) this.triggerJumpscare();
        window.setTimeout(
          () => {
            const config = getStageConfig(this.currentStageId);
            const isFinal = !!config && this.currentStageId === 10;
            this.endingManager.resolveStageClear(this.currentStageId, isFinal);
            this.setState("STAGE_CLEAR");
            this.playerController.exitLock();
            this.callbacks.onStageClear?.(this.currentStageId, isFinal);
          },
          result.isBossClear ? 450 : 0
        );
        return;
      }
      // 次のループへ
      this.placeAtSpawn();
      const runtime = this.stageManager.current!;
      this.anomalyManager.rollForLoop(
        this.currentStageId,
        this.loopManager!.loopIndex,
        runtime,
        this.loopManager!.isFinalLoop()
      );
    }, JUDGEMENT_LOCK_SEC * 1000);
  }

  private loop = () => {
    this.rafId = requestAnimationFrame(this.loop);
    const now = performance.now();
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    this.fpsAccum += dt;
    this.fpsFrames += 1;
    if (this.fpsAccum >= 0.5) {
      this.fpsValue = Math.round(this.fpsFrames / this.fpsAccum);
      this.fpsFrames = 0;
      this.fpsAccum = 0;
    }

    if (this.judgementLockTimer > 0) this.judgementLockTimer -= dt;

    if (this.state === "PLAYING") {
      const runtime = this.stageManager.current;
      if (runtime && this.judgementLockTimer <= 0) {
        this.playerController.update(dt, runtime.bounds);
      }
      this.lightingManager.update(dt);
      this.stageManager.update(dt, this.playerController.position);
      this.reportFrame();
    }

    this.sceneManager.render(this.cameraManager.camera);
  };

  private reportFrame() {
    const runtime = this.stageManager.current;
    let promptAction: PlayerAction | null = null;
    if (runtime && this.judgementLockTimer <= 0) {
      const pos = this.playerController.position;
      const distToDoor = pos.distanceTo(runtime.doorInteractPoint);
      const distToGate = pos.distanceTo(runtime.startGateInteractPoint);
      if (distToDoor <= runtime.interactRadius && distToDoor <= distToGate) promptAction = "PROCEED";
      else if (distToGate <= runtime.interactRadius) promptAction = "RETURN";
    }
    this.callbacks.onFrame?.({
      promptAction,
      fps: this.fpsValue,
      loopIndex: this.loopManager?.loopIndex ?? 1,
      mistakes: this.loopManager?.mistakes ?? 0,
      maxMistakes: this.loopManager?.maxMistakes ?? 3,
      passCount: this.loopManager?.passCount ?? 0,
    });
  }

  applySettingsLive() {
    const s = this.saveManager.getSettings();
    this.playerController.setSensitivity(s.mouseSensitivity);
    this.cameraManager.setFov(s.fov);
    this.lightingManager.setBrightness(s.brightness);
    this.audioManager.applySettings(s);
  }

  handleResize() {
    this.cameraManager.setAspect(this.sceneManager.aspect);
  }

  dispose() {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    window.removeEventListener("keydown", this.handleKeyDown);
    this.playerController.dispose();
    this.stageManager.unload();
    this.audioManager.dispose();
    this.sceneManager.dispose();
  }
}
