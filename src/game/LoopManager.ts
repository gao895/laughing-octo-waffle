import type { Difficulty } from "../types/gameTypes";

export interface LoopOutcome {
  correct: boolean;
  loopIndex: number;
  mistakes: number;
  stageCleared: boolean;
  gameOver: boolean;
  passCount: number;
}

const MAX_MISTAKES: Record<Difficulty, number> = {
  EASY: 4,
  NORMAL: 3,
  HARD: 2,
};

/**
 * ステージ内のループ回数・ミス回数を管理する。
 * ステージクリア条件、BAD END（ゲームオーバー）条件を判定する。
 */
export class LoopManager {
  loopIndex = 1;
  mistakes = 0;
  /** 8番出口のEXIT番号表示のように、正しく通過した回数だけを数える */
  passCount = 0;
  private difficulty: Difficulty;
  private loopsToClear: number;

  constructor(difficulty: Difficulty, loopsToClear: number) {
    this.difficulty = difficulty;
    this.loopsToClear = loopsToClear;
  }

  get maxMistakes() {
    return MAX_MISTAKES[this.difficulty];
  }

  /** ループ最終ループかどうか（ボス異変を発生させるタイミング） */
  isFinalLoop() {
    return this.loopIndex >= this.loopsToClear;
  }

  registerOutcome(correct: boolean, bossClear: boolean): LoopOutcome {
    if (!correct) {
      this.mistakes += 1;
    }
    const gameOver = this.mistakes >= this.maxMistakes;
    const stageCleared = bossClear && correct && !gameOver;
    if (correct && !gameOver) {
      this.passCount += 1;
    }
    if (!gameOver && !stageCleared) {
      this.loopIndex += 1;
    }
    return {
      correct,
      loopIndex: this.loopIndex,
      mistakes: this.mistakes,
      stageCleared,
      gameOver,
      passCount: this.passCount,
    };
  }

  reset() {
    this.loopIndex = 1;
    this.mistakes = 0;
    this.passCount = 0;
  }
}
