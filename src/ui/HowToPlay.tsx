interface Props {
  onClose: () => void;
}

export default function HowToPlay({ onClose }: Props) {
  return (
    <div className="overlay-panel" style={{ pointerEvents: "auto" }}>
      <div className="panel-box">
        <div className="panel-title">HOW TO PLAY</div>
        <div className="howto-text">
          {`一本道の通路を進み、扉にたどり着いたら "E" で調べる。

通路の様子がいつもと違うと感じたら、
振り返って引き返し、スタート地点の背後で "E" を押して「戻る」。

何の異変も無いと確信したら、
そのまま扉の前で "E" を押して「進む」。

判断を3回間違えると、その日は終わる。

WASD：移動　MOUSE：視点操作
SHIFT：ダッシュ　ESC：ポーズ`}
        </div>
        <button className="menu-btn" onClick={onClose}>
          閉じる
        </button>
      </div>
    </div>
  );
}
