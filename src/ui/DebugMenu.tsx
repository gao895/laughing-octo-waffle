import type { GameManager } from "../game/GameManager";
import { useState } from "react";

interface Props {
  gameManager: GameManager;
  onClose: () => void;
}

/** 開発用デバッグメニュー（F1）。本番ビルドでは呼び出されない想定。 */
export default function DebugMenu({ gameManager, onClose }: Props) {
  const [godMode, setGodMode] = useState(false);
  const anomalies = gameManager.debugAnomalyList;

  return (
    <div className="debug-menu">
      <h3>DEBUG MENU (F1)</h3>
      <div>state: {gameManager.currentState}</div>
      <h3>異変を強制発生</h3>
      {anomalies.map((a) => (
        <button
          key={a.id}
          onClick={() => {
            const runtime = gameManager.stageManager.current;
            if (runtime) runtime.applyAnomaly(a.id);
          }}
        >
          {a.id} - {a.name}
        </button>
      ))}
      <button
        onClick={() => {
          const runtime = gameManager.stageManager.current;
          if (runtime) runtime.applyAnomaly(null);
        }}
      >
        異変リセット
      </button>
      <h3>チート</h3>
      <button
        onClick={() => {
          const v = gameManager.toggleGodMode();
          setGodMode(v);
        }}
      >
        GOD MODE: {godMode ? "ON" : "OFF"}
      </button>
      <h3>&nbsp;</h3>
      <button onClick={onClose}>閉じる (F1)</button>
    </div>
  );
}
