import { useEffect, useRef } from "react";
import type { MutableRefObject } from "react";
import type { HudFrameInfo } from "../game/GameManager";
import type { JudgementResult } from "../game/AnomalyManager";

interface Props {
  frameHandlerRef: MutableRefObject<((info: HudFrameInfo) => void) | null>;
  stageLabel: { name: string; subtitle: string } | null;
  judgement: JudgementResult | null;
  pointerLockLost: boolean;
  onRequestLock: () => void;
}

/**
 * ゲームプレイ中のHUD。頻繁に変化するプロンプト/FPS/ミス表示は
 * Reactの再レンダリングを避けるため、refを介したDOM直接更新で行う。
 */
export default function GameHUD({ frameHandlerRef, stageLabel, judgement, pointerLockLost, onRequestLock }: Props) {
  const promptRef = useRef<HTMLDivElement>(null);
  const fpsRef = useRef<HTMLDivElement>(null);
  const mistakesRef = useRef<HTMLDivElement>(null);
  const judgementRef = useRef<HTMLDivElement>(null);
  const stageLabelRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<number | null>(null);

  useEffect(() => {
    frameHandlerRef.current = (info: HudFrameInfo) => {
      if (promptRef.current) {
        const text = info.promptAction === "PROCEED" ? "E 進む" : info.promptAction === "RETURN" ? "E 戻る" : "";
        promptRef.current.textContent = text;
        promptRef.current.classList.toggle("visible", !!info.promptAction);
      }
      if (fpsRef.current) {
        fpsRef.current.textContent = `${info.fps} FPS`;
      }
      if (mistakesRef.current) {
        const dots = Array.from({ length: info.maxMistakes }, (_, i) => i < info.mistakes);
        mistakesRef.current.innerHTML = dots
          .map((filled) => `<div class="hud-mistake-dot${filled ? " filled" : ""}"></div>`)
          .join("");
      }
    };
    return () => {
      frameHandlerRef.current = null;
    };
  }, [frameHandlerRef]);

  useEffect(() => {
    if (!stageLabel || !stageLabelRef.current) return;
    const el = stageLabelRef.current;
    el.classList.add("visible");
    const t = window.setTimeout(() => el.classList.remove("visible"), 3200);
    return () => window.clearTimeout(t);
  }, [stageLabel]);

  useEffect(() => {
    if (!judgement || !judgementRef.current) return;
    const el = judgementRef.current;
    el.classList.add("visible");
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => el.classList.remove("visible"), 1100);
  }, [judgement]);

  return (
    <div className="hud-root">
      <div className="hud-dot" />
      <div ref={promptRef} className="hud-prompt" />
      <div ref={stageLabelRef} className="hud-stage-label">
        <div className="num">STAGE {String(1).padStart(2, "0")}</div>
        <div className="sub">{stageLabel?.subtitle}</div>
      </div>
      <div
        ref={judgementRef}
        className={`hud-judgement ${judgement?.correct ? "correct" : "wrong"}`}
      >
        {judgement ? (judgement.correct ? "正解" : "異変を見誤った") : ""}
      </div>
      <div ref={mistakesRef} className="hud-mistakes" />
      <div ref={fpsRef} className="hud-fps" />
      <div className="hud-crosshair-hint">WASD 移動　MOUSE 視点　SHIFT ダッシュ　E 調べる　ESC ポーズ</div>
      {pointerLockLost && (
        <div className="click-to-play" style={{ pointerEvents: "auto" }} onClick={onRequestLock}>
          クリックして再開
        </div>
      )}
    </div>
  );
}
