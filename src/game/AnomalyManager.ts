import type { AnomalyData, PlayerAction } from "../types/gameTypes";
import { pickAnomalyForLoop } from "../anomalies/anomalyDatabase";
import type { StageRuntime } from "./StageManager";

export interface JudgementResult {
  correct: boolean;
  anomaly: AnomalyData | null;
  playerAction: PlayerAction;
  isBossClear: boolean;
}

/**
 * 現在ループの異変状態を管理し、ステージランタイムへ視覚/音響効果を適用する。
 * また、プレイヤーの行動（進む/戻る）が正しいかどうかを判定する。
 */
export class AnomalyManager {
  private current: AnomalyData | null = null;
  private usedIds = new Set<string>();

  get activeAnomaly(): AnomalyData | null {
    return this.current;
  }

  /** そのループの異変を抽選し、ステージへ適用する */
  rollForLoop(stageId: number, loopIndex: number, stage: StageRuntime, forceBoss: boolean): AnomalyData | null {
    const anomaly = pickAnomalyForLoop(stageId, loopIndex, this.usedIds, forceBoss);
    this.current = anomaly;
    if (anomaly) this.usedIds.add(anomaly.id);
    stage.applyAnomaly(anomaly ? anomaly.id : null);
    return anomaly;
  }

  /** 現在の異変状態を維持したままステージ表示だけリセットする際に使用 */
  clearWithoutRoll(stage: StageRuntime) {
    this.current = null;
    stage.applyAnomaly(null);
  }

  judge(playerAction: PlayerAction): JudgementResult {
    const anomaly = this.current;
    const correctAction: PlayerAction = anomaly ? anomaly.correctAction : "PROCEED";
    const correct = playerAction === correctAction;
    const isBossClear = correct && anomaly?.anomalyClass === "BOSS";
    return { correct, anomaly, playerAction, isBossClear };
  }

  reset() {
    this.current = null;
    this.usedIds.clear();
  }
}
