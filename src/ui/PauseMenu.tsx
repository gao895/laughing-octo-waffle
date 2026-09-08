interface Props {
  onResume: () => void;
  onSettings: () => void;
  onQuit: () => void;
}

export default function PauseMenu({ onResume, onSettings, onQuit }: Props) {
  return (
    <div className="overlay-panel" style={{ pointerEvents: "auto" }}>
      <div className="panel-box">
        <div className="panel-title">PAUSED</div>
        <button className="menu-btn" onClick={onResume}>
          再開する
        </button>
        <button className="menu-btn" onClick={onSettings}>
          SETTINGS
        </button>
        <button className="menu-btn" onClick={onQuit}>
          タイトルへ戻る
        </button>
      </div>
    </div>
  );
}
