import type { SaveData, SettingsData, EndingType } from "../types/gameTypes";
import { DEFAULT_SAVE, DEFAULT_SETTINGS } from "../types/gameTypes";

const STORAGE_KEY = "otherworld_save_v1";

/** localStorageを用いたセーブデータの読み書きを担当する */
export class SaveManager {
  private data: SaveData;

  constructor() {
    this.data = this.load();
  }

  private load(): SaveData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(DEFAULT_SAVE);
      const parsed = JSON.parse(raw) as SaveData;
      return {
        ...structuredClone(DEFAULT_SAVE),
        ...parsed,
        settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
      };
    } catch {
      return structuredClone(DEFAULT_SAVE);
    }
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // ストレージが使用できない場合は無視（インメモリのみで続行）
    }
  }

  hasSave(): boolean {
    return this.data.reachedStage > 1 || this.data.clearedStages.length > 0;
  }

  getData(): SaveData {
    return this.data;
  }

  getSettings(): SettingsData {
    return this.data.settings;
  }

  updateSettings(patch: Partial<SettingsData>) {
    this.data.settings = { ...this.data.settings, ...patch };
    this.persist();
  }

  setReachedStage(stageId: number) {
    this.data.reachedStage = Math.max(this.data.reachedStage, stageId);
    this.persist();
  }

  markStageCleared(stageId: number) {
    if (!this.data.clearedStages.includes(stageId)) {
      this.data.clearedStages.push(stageId);
    }
    this.persist();
  }

  addMistake() {
    this.data.totalMistakes += 1;
    this.persist();
  }

  unlockEnding(ending: EndingType) {
    if (!this.data.unlockedEndings.includes(ending)) {
      this.data.unlockedEndings.push(ending);
    }
    this.persist();
  }

  resetProgress() {
    this.data = { ...structuredClone(DEFAULT_SAVE), settings: this.data.settings };
    this.persist();
  }
}
