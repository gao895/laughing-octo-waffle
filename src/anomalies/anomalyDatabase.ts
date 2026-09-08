import type { AnomalyData } from "../types/gameTypes";
import { getAnomaliesForStage } from "../data/anomalies";

/**
 * ステージ・ループ数に応じて、そのループで発生させる異変を1つ選ぶ。
 * - BOSS/SPECIAL異変は明確な条件下で優先発生
 * - それ以外はminLoopを満たすRANDOM異変から確率抽選
 * - 何も当選しなければ null（異変なし＝進むが正解のループ）
 */
export function pickAnomalyForLoop(
  stageId: number,
  loopIndex: number,
  alreadyUsed: Set<string>,
  forceBoss: boolean
): AnomalyData | null {
  const pool = getAnomaliesForStage(stageId);

  if (forceBoss) {
    const boss = pool.find((a) => a.anomalyClass === "BOSS" && loopIndex >= a.minLoop);
    if (boss) return boss;
  }

  const special = pool.find(
    (a) => a.anomalyClass === "SPECIAL" && loopIndex >= a.minLoop && !alreadyUsed.has(a.id)
  );
  if (special && Math.random() < 0.6) return special;

  const candidates = pool.filter(
    (a) =>
      a.anomalyClass === "RANDOM" &&
      loopIndex >= a.minLoop &&
      !alreadyUsed.has(a.id)
  );

  for (const anomaly of shuffle(candidates)) {
    if (Math.random() < anomaly.probability) {
      return anomaly;
    }
  }
  return null;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getAnomalyById(stageId: number, id: string): AnomalyData | undefined {
  return getAnomaliesForStage(stageId).find((a) => a.id === id);
}
