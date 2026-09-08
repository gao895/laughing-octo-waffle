interface Props {
  stageId: number;
  isFinalStage: boolean;
  hasNextStage: boolean;
  onNextStage: () => void;
  onBackToTitle: () => void;
}

export default function ResultScreen({ stageId, isFinalStage, hasNextStage, onNextStage, onBackToTitle }: Props) {
  return (
    <div className="overlay-panel" style={{ pointerEvents: "auto" }}>
      <div className="panel-box">
        <div className="panel-title">STAGE {String(stageId).padStart(2, "0")} CLEAR</div>
        <div className="result-text">
          {isFinalStage
            ? "全ての異界を抜け、あなたは現実へ戻った。"
            : hasNextStage
              ? "異変を見抜き、ループを抜け出した。"
              : "異変を見抜き、ループを抜け出した。\n\nつづく――（この先のステージは現在開発中です）"}
        </div>
        {hasNextStage && (
          <button className="menu-btn" onClick={onNextStage}>
            NEXT STAGE
          </button>
        )}
        <button className="menu-btn" onClick={onBackToTitle}>
          タイトルへ戻る
        </button>
      </div>
    </div>
  );
}
