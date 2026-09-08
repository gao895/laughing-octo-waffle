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
import { getStageConfig } from "../data/stages";
import { getAnomaliesForStage } from "../data/anomalies";
import type { GameState, PlayerAction } from "../types/gameTypes";

export interface HudFrameInfo {
  promptAction: PlayerAction | null;
  fps: number;
  loopIndex: number;
  mistakes: number;
  maxMistakes: number;
}

export interface GameManagerCallbacks {
  onStateChange?: (state: GameState) => void;
  onStageLabel?: (name: string, subtitle: string) => void;
  onJudgement?: (result: JudgementResult) => void;
  onGameOver?: () => void;
  onStageClear?: (stageId: number, isFinalStage: boolean) => void;
  onFrame?: (info: HudFrameInfo) => void;
  onPointerLockLost?: () => void;
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

  /** ゲーム開始（新規 or つづきから） */
  startStage(stageId: number) {
    const config = getStageConfig(stageId);
    if (!config || !config.implemented) return;
    this.currentStageId = stageId;

    this.audioManager.init(this.saveManager.getSettings());
    this.audioManager.startAmbience();

    const runtime = buildStage01(this.sceneManager.scene, this.lightingManager, this.audioManager);
    this.stageManager.loadStage(runtime);

    this.loopManager = new LoopManager(this.saveManager.getSettings().difficulty, config.loopsToClear);
    this.anomalyManager.reset();

    this.placeAtSpawn();
    this.anomalyManager.rollForLoop(stageId, this.loopManager.loopIndex, runtime, false);

    this.callbacks.onStageLabel?.(config.name, config.subtitle);
    this.saveManager.setReachedStage(stageId);

    this.playerController.requestLock();
    this.setState("PLAYING");
    this.lastTime = performance.now();
    if (this.rafId === null) this.loop();
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
      this.tryInteract();
    }
  };

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
    if (this.anomalyManager.activeAnomaly?.id === "extra_footstep") {
      this.audioManager.playExtraFootstepGhost();
    }
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
        this.saveManager.addMistake();
        this.endingManager.resolveBadEnd();
        this.setState("GAME_OVER");
        this.playerController.exitLock();
        this.callbacks.onGameOver?.();
        return;
      }
      if (outcome.stageCleared) {
        const config = getStageConfig(this.currentStageId);
        const isFinal = !!config && this.currentStageId === 10;
        this.endingManager.resolveStageClear(this.currentStageId, isFinal);
        this.setState("STAGE_CLEAR");
        this.playerController.exitLock();
        this.callbacks.onStageClear?.(this.currentStageId, isFinal);
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
