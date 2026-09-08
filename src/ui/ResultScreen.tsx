interface Props {
  stageId: number;
  isFinalStage: boolean;
  onContinue: () => void;
}

export default function ResultScreen({ stageId, isFinalStage, onContinue }: Props) {
  return (
    <div className="overlay-panel" style={{ pointerEvents: "auto" }}>
      <div className="panel-box">
        <div className="panel-title">STAGE {String(stageId).padStart(2, "0")} CLEAR</div>
        <div className="result-text">
          {isFinalStage
            ? "全ての異界を抜け、あなたは現実へ戻った。"
            : "異変を見抜き、ループを抜け出した。\n\nつづく――（STAGE 02 は現在開発中です）"}
        </div>
        <button className="menu-btn" onClick={onContinue}>
          タイトルへ戻る
        </button>
      </div>
    </div>
  );
}
