import { useEffect, useRef } from "react";
import type { GameManager } from "../game/GameManager";

interface Props {
  gameManager: GameManager;
  onPause: () => void;
}

const JOY_RADIUS = 46;

/**
 * スマートフォン向け仮想操作UI。
 * 左：仮想スティック（移動）／右：ドラッグで視点操作／ボタン：ダッシュ・調べる・ポーズ。
 * CSSの `@media (pointer: coarse)` によりタッチデバイスでのみ表示される。
 */
export default function TouchControls({ gameManager, onPause }: Props) {
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const lookAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const base = baseRef.current;
    const knob = knobRef.current;
    const lookArea = lookAreaRef.current;
    if (!base || !knob || !lookArea) return;

    let joyTouchId: number | null = null;
    let joyCenter = { x: 0, y: 0 };

    const updateJoy = (clientX: number, clientY: number) => {
      let dx = clientX - joyCenter.x;
      let dy = clientY - joyCenter.y;
      const dist = Math.hypot(dx, dy);
      if (dist > JOY_RADIUS) {
        dx = (dx / dist) * JOY_RADIUS;
        dy = (dy / dist) * JOY_RADIUS;
      }
      knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      gameManager.playerController.setVirtualMove(dx / JOY_RADIUS, dy / JOY_RADIUS);
    };

    const resetJoy = () => {
      knob.style.transform = "translate(-50%, -50%)";
      gameManager.playerController.setVirtualMove(0, 0);
    };

    const onJoyStart = (e: TouchEvent) => {
      if (joyTouchId !== null) return;
      e.preventDefault();
      const t = e.changedTouches[0];
      joyTouchId = t.identifier;
      const rect = base.getBoundingClientRect();
      joyCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      updateJoy(t.clientX, t.clientY);
    };
    const onJoyMove = (e: TouchEvent) => {
      const t = Array.from(e.changedTouches).find((c) => c.identifier === joyTouchId);
      if (!t) return;
      e.preventDefault();
      updateJoy(t.clientX, t.clientY);
    };
    const onJoyEnd = (e: TouchEvent) => {
      const t = Array.from(e.changedTouches).find((c) => c.identifier === joyTouchId);
      if (!t) return;
      joyTouchId = null;
      resetJoy();
    };

    base.addEventListener("touchstart", onJoyStart, { passive: false });
    window.addEventListener("touchmove", onJoyMove, { passive: false });
    window.addEventListener("touchend", onJoyEnd, { passive: false });
    window.addEventListener("touchcancel", onJoyEnd, { passive: false });

    // 視点操作（ドラッグ）
    let lookTouchId: number | null = null;
    let lastX = 0;
    let lastY = 0;

    const onLookStart = (e: TouchEvent) => {
      if (lookTouchId !== null) return;
      e.preventDefault();
      const t = e.changedTouches[0];
      lookTouchId = t.identifier;
      lastX = t.clientX;
      lastY = t.clientY;
    };
    const onLookMove = (e: TouchEvent) => {
      const t = Array.from(e.changedTouches).find((c) => c.identifier === lookTouchId);
      if (!t) return;
      e.preventDefault();
      const dx = t.clientX - lastX;
      const dy = t.clientY - lastY;
      lastX = t.clientX;
      lastY = t.clientY;
      gameManager.playerController.addLookDelta(dx, dy);
    };
    const onLookEnd = (e: TouchEvent) => {
      const t = Array.from(e.changedTouches).find((c) => c.identifier === lookTouchId);
      if (!t) return;
      lookTouchId = null;
    };

    lookArea.addEventListener("touchstart", onLookStart, { passive: false });
    lookArea.addEventListener("touchmove", onLookMove, { passive: false });
    lookArea.addEventListener("touchend", onLookEnd, { passive: false });
    lookArea.addEventListener("touchcancel", onLookEnd, { passive: false });

    return () => {
      base.removeEventListener("touchstart", onJoyStart);
      window.removeEventListener("touchmove", onJoyMove);
      window.removeEventListener("touchend", onJoyEnd);
      window.removeEventListener("touchcancel", onJoyEnd);
      lookArea.removeEventListener("touchstart", onLookStart);
      lookArea.removeEventListener("touchmove", onLookMove);
      lookArea.removeEventListener("touchend", onLookEnd);
      lookArea.removeEventListener("touchcancel", onLookEnd);
    };
  }, [gameManager]);

  return (
    <div className="touch-controls">
      <div ref={lookAreaRef} className="touch-look-area" />
      <div ref={baseRef} className="touch-joystick-base">
        <div ref={knobRef} className="touch-joystick-knob" />
      </div>
      <button
        className="touch-btn touch-btn-pause"
        onTouchStart={(e) => {
          e.preventDefault();
          onPause();
        }}
      >
        ⏸
      </button>
      <button
        className="touch-btn touch-btn-dash"
        onTouchStart={(e) => {
          e.preventDefault();
          gameManager.playerController.setVirtualDash(true);
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          gameManager.playerController.setVirtualDash(false);
        }}
        onTouchCancel={(e) => {
          e.preventDefault();
          gameManager.playerController.setVirtualDash(false);
        }}
      >
        DASH
      </button>
      <button
        className="touch-btn touch-btn-interact"
        onTouchStart={(e) => {
          e.preventDefault();
          gameManager.interact();
        }}
      >
        E
      </button>
    </div>
  );
}
