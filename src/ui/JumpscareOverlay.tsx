import { useEffect, useRef, useState } from "react";

interface Props {
  /** 値が変化するたびに1回だけジャンプスケアを発火させる */
  trigger: number;
  /** 設定「フラッシュ演出」がOFFの場合は光学的な演出を出さない（音・カメラ揺れのみ） */
  flashEnabled: boolean;
}

/**
 * 画面いっぱいに一瞬だけ顔が迫る演出。
 * GameManager側でBAD END直前・ボス異変クリアの瞬間など、
 * 重要な場面に限定して発火される。
 * 表示時間はCSSアニメーション(jumpscareFlash)の終了イベントに連動させ、
 * 別系統のJSタイマーとズレないようにしている。
 */
export default function JumpscareOverlay({ trigger, flashEnabled }: Props) {
  const [activeKey, setActiveKey] = useState<number | null>(null);
  const prevTrigger = useRef(trigger);

  useEffect(() => {
    if (trigger === prevTrigger.current) return;
    prevTrigger.current = trigger;
    if (!flashEnabled) return;
    setActiveKey(trigger);
  }, [trigger, flashEnabled]);

  useEffect(() => {
    if (activeKey === null) return;
    // animationendが何らかの理由で発火しない場合の保険（アニメーション長より十分長い猶予）
    const fallback = window.setTimeout(() => setActiveKey(null), 1000);
    return () => window.clearTimeout(fallback);
  }, [activeKey]);

  if (activeKey === null) return null;

  return (
    <div key={activeKey} className="jumpscare-overlay" onAnimationEnd={() => setActiveKey(null)}>
      <div className="jumpscare-face">
        <div className="jumpscare-eye left" />
        <div className="jumpscare-eye right" />
        <div className="jumpscare-mouth" />
      </div>
    </div>
  );
}
