import { useEffect, useState } from "react";

interface Props {
  hasSave: boolean;
  onStart: () => void;
  onContinue: () => void;
  onSettings: () => void;
  onHowToPlay: () => void;
  /** BAD END到達後、タイトル画面自体にプレイヤーが立っている演出 */
  hauntedTitle: boolean;
}

export default function TitleScreen({ hasSave, onStart, onContinue, onSettings, onHowToPlay, hauntedTitle }: Props) {
  const [shift, setShift] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setShift((s) => {
        let next = s + (Math.random() > 0.5 ? 1 : -1) * (6 + Math.random() * 10);
        next = Math.max(-40, Math.min(40, next));
        return next;
      });
    }, 4200 + Math.random() * 2000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="title-screen">
      <div className="title-corridor" />
      <div className="title-fog" />
      <div
        className="title-figure"
        style={{ ["--shift" as string]: `${hauntedTitle ? 0 : shift}px`, bottom: hauntedTitle ? "12%" : "22%" }}
      />
      <div className="title-name">10番目の異界</div>
      <div className="title-copy">
        異変を見つけろ。
        <br />
        でも――見つけてはいけないものもある。
      </div>
      <div className="title-menu">
        <button className="menu-btn" onClick={onStart}>
          START
        </button>
        <button className="menu-btn" onClick={onContinue} disabled={!hasSave}>
          CONTINUE
        </button>
        <button className="menu-btn" onClick={onSettings}>
          SETTINGS
        </button>
        <button className="menu-btn" onClick={onHowToPlay}>
          HOW TO PLAY
        </button>
      </div>
    </div>
  );
}
