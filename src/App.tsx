import { useEffect, useRef, useState } from "react";
import { GameManager, type HudFrameInfo } from "./game/GameManager";
import type { JudgementResult } from "./game/AnomalyManager";
import type { GameState, SettingsData, EndingData } from "./types/gameTypes";
import TitleScreen from "./ui/TitleScreen";
import GameHUD from "./ui/GameHUD";
import PauseMenu from "./ui/PauseMenu";
import SettingsMenu from "./ui/SettingsMenu";
import ResultScreen from "./ui/ResultScreen";
import EndingScreen from "./ui/EndingScreen";
import HowToPlay from "./ui/HowToPlay";
import DebugMenu from "./ui/DebugMenu";

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameManagerRef = useRef<GameManager | null>(null);
  const frameHandlerRef = useRef<((info: HudFrameInfo) => void) | null>(null);

  const [gameState, setGameState] = useState<GameState>("TITLE");
  const [stageLabel, setStageLabel] = useState<{ name: string; subtitle: string } | null>(null);
  const [judgement, setJudgement] = useState<JudgementResult | null>(null);
  const [pointerLockLost, setPointerLockLost] = useState(false);
  const [stageClearInfo, setStageClearInfo] = useState<{ stageId: number; isFinal: boolean } | null>(null);
  const [endingData, setEndingData] = useState<EndingData | null>(null);
  const [hasSave, setHasSave] = useState(false);
  const [hauntedTitle, setHauntedTitle] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showDebugMenu, setShowDebugMenu] = useState(false);
  const [settings, setSettings] = useState<SettingsData | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const gm = new GameManager(containerRef.current);
    gameManagerRef.current = gm;

    gm.setCallbacks({
      onStateChange: (s) => setGameState(s),
      onStageLabel: (name, subtitle) => setStageLabel({ name, subtitle }),
      onJudgement: (result) => setJudgement(result),
      onGameOver: () => setEndingData(gm.endingManager.getEnding("BAD")),
      onStageClear: (stageId, isFinal) => setStageClearInfo({ stageId, isFinal }),
      onFrame: (info) => frameHandlerRef.current?.(info),
      onPointerLockLost: () => setPointerLockLost(true),
    });

    setSettings(gm.saveManager.getSettings());
    setHasSave(gm.saveManager.hasSave());
    setHauntedTitle(gm.saveManager.getData().unlockedEndings.includes("BAD"));

    const onResize = () => gm.handleResize();
    window.addEventListener("resize", onResize);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "F1" && import.meta.env.DEV) {
        e.preventDefault();
        setShowDebugMenu((v) => !v);
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKeyDown);
      gm.dispose();
      gameManagerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!pointerLockLost) return;
    const onClick = () => {
      if (gameState === "PLAYING") gameManagerRef.current?.playerController.requestLock();
    };
    const onLockChange = () => {
      if (document.pointerLockElement) setPointerLockLost(false);
    };
    document.addEventListener("pointerlockchange", onLockChange);
    return () => document.removeEventListener("pointerlockchange", onLockChange);
  }, [pointerLockLost, gameState]);

  const handleStart = () => {
    setStageLabel(null);
    setJudgement(null);
    setStageClearInfo(null);
    setEndingData(null);
    setPointerLockLost(false);
    gameManagerRef.current?.startStage(1);
  };

  const handleContinue = () => {
    const reached = gameManagerRef.current?.saveManager.getData().reachedStage ?? 1;
    setStageLabel(null);
    setJudgement(null);
    setStageClearInfo(null);
    setEndingData(null);
    setPointerLockLost(false);
    gameManagerRef.current?.startStage(reached === 1 ? 1 : 1);
  };

  const handleSettingsChange = (patch: Partial<SettingsData>) => {
    const gm = gameManagerRef.current;
    if (!gm) return;
    gm.saveManager.updateSettings(patch);
    const next = gm.saveManager.getSettings();
    setSettings(next);
    gm.applySettingsLive();
  };

  const backToTitle = () => {
    gameManagerRef.current?.quitToTitle();
    setHasSave(gameManagerRef.current?.saveManager.hasSave() ?? false);
    setHauntedTitle(gameManagerRef.current?.saveManager.getData().unlockedEndings.includes("BAD") ?? false);
  };

  return (
    <div className="app-root">
      <div className="game-canvas-container" ref={containerRef} />

      {gameState === "TITLE" && (
        <TitleScreen
          hasSave={hasSave}
          hauntedTitle={hauntedTitle}
          onStart={handleStart}
          onContinue={handleContinue}
          onSettings={() => setShowSettings(true)}
          onHowToPlay={() => setShowHowToPlay(true)}
        />
      )}

      {(gameState === "PLAYING" || gameState === "PAUSED") && (
        <GameHUD
          frameHandlerRef={frameHandlerRef}
          stageLabel={stageLabel}
          judgement={judgement}
          pointerLockLost={pointerLockLost && gameState === "PLAYING"}
          onRequestLock={() => gameManagerRef.current?.playerController.requestLock()}
        />
      )}

      {gameState === "PAUSED" && !showSettings && (
        <PauseMenu
          onResume={() => gameManagerRef.current?.resume()}
          onSettings={() => setShowSettings(true)}
          onQuit={backToTitle}
        />
      )}

      {gameState === "STAGE_CLEAR" && stageClearInfo && (
        <ResultScreen stageId={stageClearInfo.stageId} isFinalStage={stageClearInfo.isFinal} onContinue={backToTitle} />
      )}

      {gameState === "GAME_OVER" && endingData && <EndingScreen ending={endingData} onBackToTitle={backToTitle} />}

      {showSettings && settings && (
        <SettingsMenu settings={settings} onChange={handleSettingsChange} onClose={() => setShowSettings(false)} />
      )}

      {showHowToPlay && <HowToPlay onClose={() => setShowHowToPlay(false)} />}

      {showDebugMenu && gameManagerRef.current && (
        <DebugMenu gameManager={gameManagerRef.current} onClose={() => setShowDebugMenu(false)} />
      )}
    </div>
  );
}
