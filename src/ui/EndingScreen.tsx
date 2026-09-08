import type { EndingData } from "../types/gameTypes";

interface Props {
  ending: EndingData;
  onBackToTitle: () => void;
}

export default function EndingScreen({ ending, onBackToTitle }: Props) {
  return (
    <div className="overlay-panel" style={{ pointerEvents: "auto" }}>
      <div className="panel-box">
        <div className="ending-badge">{ending.title}</div>
        <div className="result-text">{ending.description}</div>
        <button className="menu-btn" onClick={onBackToTitle}>
          タイトルへ戻る
        </button>
      </div>
    </div>
  );
}
