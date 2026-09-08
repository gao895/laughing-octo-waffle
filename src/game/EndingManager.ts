import type { EndingType } from "../types/gameTypes";
import { ENDINGS } from "../data/endings";
import type { SaveManager } from "./SaveManager";

/**
 * エンディング判定・記録を担当する。
 * プロトタイプ段階ではSTAGE01のみのため、GOOD/NORMAL到達には
 * 将来の全ステージクリアが前提となる。ここではBAD ENDの記録と
 * STAGE01単体クリア時のNORMAL相当の扱いを提供する。
 */
export class EndingManager {
  constructor(private save: SaveManager) {}

  resolveBadEnd() {
    this.save.unlockEnding("BAD");
    return ENDINGS.BAD;
  }

  resolveStageClear(stageId: number, isFinalStage: boolean) {
    this.save.markStageCleared(stageId);
    if (isFinalStage) {
      this.save.unlockEnding("NORMAL");
      return ENDINGS.NORMAL;
    }
    return null;
  }

  getEnding(type: EndingType) {
    return ENDINGS[type];
  }
}
