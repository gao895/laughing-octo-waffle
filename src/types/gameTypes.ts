// ゲーム全体で共有される型定義

/** ゲーム全体の状態 */
export type GameState =
  | "TITLE"
  | "HOW_TO_PLAY"
  | "SETTINGS"
  | "LOADING"
  | "PLAYING"
  | "PAUSED"
  | "JUDGEMENT_RESULT"
  | "STAGE_CLEAR"
  | "GAME_OVER"
  | "ENDING";

/** 難易度 */
export type Difficulty = "EASY" | "NORMAL" | "HARD";

/** プレイヤーがループの終端で取る行動 */
export type PlayerAction = "PROCEED" | "RETURN";

/** 異変の分類 */
export type AnomalyCategory =
  | "VISUAL"
  | "CHARACTER"
  | "AUDIO"
  | "LIGHT"
  | "WORLD"
  | "PLAYER"
  | "SPECIAL";

/** 異変の発生区分 */
export type AnomalyClass = "FORCED" | "RANDOM" | "SPECIAL" | "BOSS";

/** エンディング種別 */
export type EndingType = "GOOD" | "NORMAL" | "BAD";

export interface Vector3Like {
  x: number;
  y: number;
  z: number;
}

/** 異変データ定義（データ駆動） */
export interface AnomalyData {
  id: string;
  stageId: number;
  name: string;
  description: string;
  type: AnomalyCategory;
  anomalyClass: AnomalyClass;
  /** このループで異変が発生する条件（最小ループ数） */
  minLoop: number;
  /** ランダム抽選時の重み（0〜1） */
  probability: number;
  visualChanges: string;
  audioChanges: string;
  gameplayEffect: string;
  /** 正しいプレイヤー行動 */
  correctAction: PlayerAction;
}

/** ステージ設定 */
export interface StageConfig {
  id: number;
  key: string;
  name: string;
  subtitle: string;
  theme: string;
  implemented: boolean;
  /** ステージクリアに必要な正解ループ数 */
  loopsToClear: number;
  /** 特殊ルール：異変を見つけたら「戻る」ではなく「振り返る」等 */
  specialRule?: string;
}

export interface EndingData {
  type: EndingType;
  title: string;
  description: string;
}

export interface SettingsData {
  bgmVolume: number;
  seVolume: number;
  voiceVolume: number;
  mouseSensitivity: number;
  brightness: number;
  fov: number;
  motionBlur: boolean;
  flashEffects: boolean;
  difficulty: Difficulty;
}

export interface SaveData {
  version: number;
  reachedStage: number;
  clearedStages: number[];
  unlockedEndings: EndingType[];
  settings: SettingsData;
  totalMistakes: number;
}

export const DEFAULT_SETTINGS: SettingsData = {
  bgmVolume: 0.6,
  seVolume: 0.8,
  voiceVolume: 0.8,
  mouseSensitivity: 0.5,
  brightness: 0.5,
  fov: 75,
  motionBlur: true,
  flashEffects: true,
  difficulty: "NORMAL",
};

export const DEFAULT_SAVE: SaveData = {
  version: 1,
  reachedStage: 1,
  clearedStages: [],
  unlockedEndings: [],
  settings: DEFAULT_SETTINGS,
  totalMistakes: 0,
};
