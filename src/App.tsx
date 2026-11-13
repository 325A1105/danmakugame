import { useCallback, useEffect, useState } from 'react';
import { DanmakuCanvas } from './components/DanmakuCanvas';
import { GameHud } from './components/GameHud';
import { Overlays } from './components/Overlays';
import { sound } from './game/sound';
import {
  DIFFICULTY_CONFIGS,
  Difficulty,
  GameState,
  HudSnapshot,
  RunSummary,
} from './game/types';

const HIGH_SCORE_STORAGE_KEY = 'danmaku_cursor_high_scores_v1';

function loadHighScores(): Record<Difficulty, number> {
  try {
    const raw = localStorage.getItem(HIGH_SCORE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Record<Difficulty, number>>;
      return {
        EASY: typeof parsed.EASY === 'number' ? parsed.EASY : 0,
        NORMAL: typeof parsed.NORMAL === 'number' ? parsed.NORMAL : 0,
        HARD: typeof parsed.HARD === 'number' ? parsed.HARD : 0,
      };
    }
  } catch {
    // Ignore storage errors
  }
  return { EASY: 0, NORMAL: 0, HARD: 0 };
}

function saveHighScores(scores: Record<Difficulty, number>): void {
  try {
    localStorage.setItem(HIGH_SCORE_STORAGE_KEY, JSON.stringify(scores));
  } catch {
    // Ignore storage errors
  }
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [difficulty, setDifficulty] = useState<Difficulty>('NORMAL');
  const [highScores, setHighScores] = useState<Record<Difficulty, number>>(loadHighScores);
  const [runId, setRunId] = useState<number>(1);
  const [muted, setMuted] = useState<boolean>(false);
  const [summary, setSummary] = useState<RunSummary | null>(null);

  const currentHighScore = highScores[difficulty];

  const [hud, setHud] = useState<HudSnapshot>(() => ({
    score: 0,
    highScore: highScores.NORMAL,
    multiplier: 1.0,
    grazeCount: 0,
    elapsedSeconds: 0,
    wave: 1,
    hp: DIFFICULTY_CONFIGS.NORMAL.initialHp,
    maxHp: DIFFICULTY_CONFIGS.NORMAL.maxHp,
    hasShield: false,
    slowRemaining: 0,
    itemsCollected: 0,
  }));

  const handleSelectDifficulty = useCallback(
    (next: Difficulty) => {
      setDifficulty(next);
      setHud((prev) => ({
        ...prev,
        highScore: highScores[next],
        hp: DIFFICULTY_CONFIGS[next].initialHp,
        maxHp: DIFFICULTY_CONFIGS[next].maxHp,
      }));
    },
    [highScores],
  );

  const handleStartGame = useCallback(() => {
    sound.unlock();
    sound.playStart();
    setSummary(null);
    setRunId((id) => id + 1);
    setGameState('PLAYING');
  }, []);

  const handleTogglePause = useCallback(() => {
    setGameState((prev) => {
      if (prev === 'PLAYING') return 'PAUSED';
      if (prev === 'PAUSED') return 'PLAYING';
      return prev;
    });
  }, []);

  const handleResumeGame = useCallback(() => {
    setGameState('PLAYING');
  }, []);

  const handleReturnToTitle = useCallback(() => {
    setSummary(null);
    setRunId((id) => id + 1);
    setGameState('TITLE_MENU');
  }, []);

  const handleToggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      sound.setMuted(next);
      return next;
    });
  }, []);

  const handleGameOver = useCallback(
    (runSummary: RunSummary) => {
      setSummary(runSummary);
      setGameState('GAME_OVER');
      if (runSummary.highScore > highScores[runSummary.difficulty]) {
        const updated = {
          ...highScores,
          [runSummary.difficulty]: runSummary.highScore,
        };
        setHighScores(updated);
        saveHighScores(updated);
      }
    },
    [highScores],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (gameState === 'PLAYING' || gameState === 'PAUSED') {
          e.preventDefault();
          handleTogglePause();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gameState, handleTogglePause]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#080C18] text-slate-100">
      <GameHud
        gameState={gameState}
        hud={hud}
        muted={muted}
        onToggleMute={handleToggleMute}
        onTogglePause={handleTogglePause}
      />

      <main className="relative flex-1 overflow-hidden">
        <DanmakuCanvas
          gameState={gameState}
          difficulty={difficulty}
          highScore={currentHighScore}
          runId={runId}
          onHudUpdate={setHud}
          onGameOver={handleGameOver}
        />

        <Overlays
          gameState={gameState}
          difficulty={difficulty}
          highScore={currentHighScore}
          summary={summary}
          onSelectDifficulty={handleSelectDifficulty}
          onStartGame={handleStartGame}
          onResumeGame={handleResumeGame}
          onReturnToTitle={handleReturnToTitle}
        />
      </main>
    </div>
  );
}
