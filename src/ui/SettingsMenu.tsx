import type { Difficulty, SettingsData } from "../types/gameTypes";

interface Props {
  settings: SettingsData;
  onChange: (patch: Partial<SettingsData>) => void;
  onClose: () => void;
}

const DIFFICULTIES: Difficulty[] = ["EASY", "NORMAL", "HARD"];

export default function SettingsMenu({ settings, onChange, onClose }: Props) {
  return (
    <div className="overlay-panel" style={{ pointerEvents: "auto" }}>
      <div className="panel-box">
        <div className="panel-title">SETTINGS</div>

        <div className="settings-row">
          <div className="row-label">
            <span>BGM音量</span>
            <span>{Math.round(settings.bgmVolume * 100)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={settings.bgmVolume}
            onChange={(e) => onChange({ bgmVolume: Number(e.target.value) })}
          />
        </div>

        <div className="settings-row">
          <div className="row-label">
            <span>SE音量</span>
            <span>{Math.round(settings.seVolume * 100)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={settings.seVolume}
            onChange={(e) => onChange({ seVolume: Number(e.target.value) })}
          />
        </div>

        <div className="settings-row">
          <div className="row-label">
            <span>ボイス音量</span>
            <span>{Math.round(settings.voiceVolume * 100)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={settings.voiceVolume}
            onChange={(e) => onChange({ voiceVolume: Number(e.target.value) })}
          />
        </div>

        <div className="settings-row">
          <div className="row-label">
            <span>マウス感度</span>
            <span>{Math.round(settings.mouseSensitivity * 100)}</span>
          </div>
          <input
            type="range"
            min={0.05}
            max={1}
            step={0.01}
            value={settings.mouseSensitivity}
            onChange={(e) => onChange({ mouseSensitivity: Number(e.target.value) })}
          />
        </div>

        <div className="settings-row">
          <div className="row-label">
            <span>明るさ</span>
            <span>{Math.round(settings.brightness * 100)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={settings.brightness}
            onChange={(e) => onChange({ brightness: Number(e.target.value) })}
          />
        </div>

        <div className="settings-row">
          <div className="row-label">
            <span>FOV</span>
            <span>{settings.fov}</span>
          </div>
          <input
            type="range"
            min={60}
            max={100}
            step={1}
            value={settings.fov}
            onChange={(e) => onChange({ fov: Number(e.target.value) })}
          />
        </div>

        <div className="toggle-row">
          <span>モーションブラー</span>
          <input
            type="checkbox"
            checked={settings.motionBlur}
            onChange={(e) => onChange({ motionBlur: e.target.checked })}
          />
        </div>
        <div className="toggle-row">
          <span>フラッシュ演出</span>
          <input
            type="checkbox"
            checked={settings.flashEffects}
            onChange={(e) => onChange({ flashEffects: e.target.checked })}
          />
        </div>

        <div className="settings-row">
          <span>難易度</span>
          <div className="difficulty-row">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                className={`difficulty-btn${settings.difficulty === d ? " active" : ""}`}
                onClick={() => onChange({ difficulty: d })}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <button className="menu-btn" onClick={onClose}>
          閉じる
        </button>
      </div>
    </div>
  );
}
