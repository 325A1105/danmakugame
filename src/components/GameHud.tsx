import React from 'react';
import { Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { GameState, HudSnapshot } from '../game/types';

interface GameHudProps {
  gameState: GameState;
  hud: HudSnapshot;
  muted: boolean;
  onToggleMute: () => void;
  onTogglePause: () => void;
}

function formatTime(seconds: number): string {
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const GameHud: React.FC<GameHudProps> = ({
  gameState,
  hud,
  muted,
  onToggleMute,
  onTogglePause,
}) => {
  const isPlayingOrPaused = gameState === 'PLAYING' || gameState === 'PAUSED';

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-8 border-b border-white/10 bg-[#0D1323] px-5">
      {/* Zone 1: Brand Title */}
      <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
        <span className="text-base font-bold tracking-tight text-slate-50">弾幕回避</span>
      </div>

      {/* Zone 2: Clean Unboxed Tabular Metrics */}
      <div className="hidden md:flex items-center gap-6 text-xs text-slate-400">
        <div className="flex items-baseline gap-2 whitespace-nowrap">
          <span>スコア</span>
          <span className="font-mono-tabular text-base font-bold text-slate-50">
            {hud.score.toLocaleString()}
          </span>
        </div>

        <span aria-hidden="true" className="text-white/15">
          /
        </span>

        <div className="flex items-baseline gap-2 whitespace-nowrap">
          <span>ベスト</span>
          <span className="font-mono-tabular text-sm font-semibold text-slate-200">
            {hud.highScore.toLocaleString()}
          </span>
        </div>

        <span aria-hidden="true" className="text-white/15">
          /
        </span>

        <div className="flex items-baseline gap-2 whitespace-nowrap">
          <span>倍率</span>
          <span className="font-mono-tabular text-sm font-bold text-amber-300">
            x{hud.multiplier.toFixed(1)}
          </span>
        </div>

        <span aria-hidden="true" className="text-white/15">
          /
        </span>

        <div className="flex items-baseline gap-2 whitespace-nowrap">
          <span>グレイズ</span>
          <span className="font-mono-tabular text-sm font-semibold text-sky-300">
            {hud.grazeCount}
          </span>
        </div>

        <span aria-hidden="true" className="text-white/15">
          /
        </span>

        <div className="flex items-baseline gap-2 whitespace-nowrap">
          <span>WAVE {hud.wave}</span>
          <span className="text-white/25">·</span>
          <span className="font-mono-tabular text-sm font-semibold text-slate-200">
            {formatTime(hud.elapsedSeconds)}
          </span>
        </div>

        {isPlayingOrPaused && (
          <>
            <span aria-hidden="true" className="text-white/15">
              /
            </span>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span>ライフ</span>
              <span className="font-mono-tabular text-sm font-bold text-rose-400">
                {hud.hp}/{hud.maxHp}
              </span>
              {hud.hasShield && (
                <span className="text-emerald-400 font-semibold">· バリア有</span>
              )}
              {hud.slowRemaining > 0 && (
                <span className="font-mono-tabular text-purple-300 font-semibold">
                  · スロー {hud.slowRemaining.toFixed(1)}s
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Mobile compact score */}
      <div className="flex md:hidden items-center gap-3 text-xs whitespace-nowrap">
        <span className="font-mono-tabular text-sm font-bold text-slate-50">
          {hud.score.toLocaleString()} pts
        </span>
        {isPlayingOrPaused && (
          <span className="font-mono-tabular text-rose-400 font-bold">
            HP {hud.hp}/{hud.maxHp}
          </span>
        )}
      </div>

      {/* Zone 3: Interactive Controls */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onToggleMute}
          aria-label={muted ? 'サウンドをオンにする' : 'サウンドをミュートする'}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-medium text-slate-200 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 whitespace-nowrap shrink-0 cursor-pointer"
        >
          {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          <span>{muted ? 'ミュート' : '効果音'}</span>
        </button>

        {isPlayingOrPaused && (
          <button
            type="button"
            onClick={onTogglePause}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-medium text-slate-100 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {gameState === 'PAUSED' ? (
              <>
                <Play className="h-3.5 w-3.5" />
                <span>再開</span>
              </>
            ) : (
              <>
                <Pause className="h-3.5 w-3.5" />
                <span>一時停止</span>
              </>
            )}
          </button>
        )}
      </div>
    </header>
  );
};
