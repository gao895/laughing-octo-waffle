import type { StageConfig } from "../types/gameTypes";

// ステージ定義（データ駆動）。STAGE01のみ実装済み、02〜10は将来拡張用のメタデータのみ。
export const STAGES: StageConfig[] = [
  {
    id: 1,
    key: "stage01",
    name: "地下通路",
    subtitle: "UNDERGROUND",
    theme: "違和感",
    implemented: true,
    loopsToClear: 6,
  },
  { id: 2, key: "stage02", name: "廃病院", subtitle: "HOSPITAL", theme: "生きている病院", implemented: true, loopsToClear: 6 },
  { id: 3, key: "stage03", name: "廃校", subtitle: "SCHOOL", theme: "存在しない生徒", implemented: true, loopsToClear: 6 },
  { id: 4, key: "stage04", name: "夜神社", subtitle: "SHRINE", theme: "振り返ってはいけない", implemented: true, loopsToClear: 6, specialRule: "異変を発見したら振り返る" },
  { id: 5, key: "stage05", name: "ホテル666", subtitle: "HOTEL 666", theme: "泊まってはいけないホテル", implemented: true, loopsToClear: 6 },
  { id: 6, key: "stage06", name: "終電", subtitle: "LAST TRAIN", theme: "乗ってはいけない電車", implemented: true, loopsToClear: 6 },
  { id: 7, key: "stage07", name: "廃遊園地", subtitle: "AMUSEMENT PARK", theme: "笑っているもの", implemented: true, loopsToClear: 6 },
  { id: 8, key: "stage08", name: "廃村", subtitle: "VILLAGE", theme: "村人はあなたを知っている", implemented: true, loopsToClear: 6 },
  { id: 9, key: "stage09", name: "自宅", subtitle: "HOME", theme: "ここが一番安全だと思った？", implemented: true, loopsToClear: 6 },
  { id: 10, key: "stage10", name: "異界", subtitle: "THE OTHERWORLD", theme: "世界そのものが異変", implemented: false, loopsToClear: 10 },
];

export function getStageConfig(id: number): StageConfig | undefined {
  return STAGES.find((s) => s.id === id);
}
