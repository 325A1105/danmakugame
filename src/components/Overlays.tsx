import React from 'react';
import { DIFFICULTY_CONFIGS, Difficulty, GameState, RunSummary } from '../game/types';

interface OverlaysProps {
  gameState: GameState;
  difficulty: Difficulty;
  highScore: number;
  summary: RunSummary | null;
  onSelectDifficulty: (d: Difficulty) => void;
  onStartGame: () => void;
  onResumeGame: () => void;
  onReturnToTitle: () => void;
}

function formatTime(seconds: number): string {
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const Overlays: React.FC<OverlaysProps> = ({
  gameState,
  difficulty,
  highScore,
  summary,
  onSelectDifficulty,
  onStartGame,
  onResumeGame,
  onReturnToTitle,
}) => {
  if (gameState === 'PLAYING') return null;

  if (gameState === 'TITLE_MENU') {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-xl border border-white/12 bg-[#0D1323]/92 p-7 shadow-2xl backdrop-blur-md">
          <div className="mb-6">
            <p className="text-xs font-medium text-sky-400">
              カーソル回避アクション · ハイスコア {highScore.toLocaleString()}
            </p>
            <h1 className="mt-1.5 text-3xl font-black tracking-tight text-slate-50">
              弾幕回避
            </h1>
            <p className="mt-2.5 text-sm leading-relaxed text-slate-300">
              マウスカーソルを動かして四方から迫る弾幕を避け続けるゲームです。
              白い中心点（当たり判定）が弾に触れないよう回避し、弾幕の中に出現するアイテムを拾ってハイスコアを狙いましょう。
            </p>
          </div>

          {/* Item Legend */}
          <div className="mb-6 border-y border-white/10 py-4">
            <h2 className="mb-3 text-xs font-bold text-slate-300">弾幕の中のアイテム</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="font-bold text-amber-400">★</span>
                <span className="font-semibold text-slate-100">ボーナス星</span>
                <span className="text-slate-400">得点＋倍率アップ</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="font-bold text-emerald-400">◆</span>
                <span className="font-semibold text-slate-100">バリア</span>
                <span className="text-slate-400">被弾を1回無効化</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="font-bold text-sky-400">◎</span>
                <span className="font-semibold text-slate-100">弾幕消去</span>
                <span className="text-slate-400">画面内の弾を全て得点化</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="font-bold text-purple-400">⧗</span>
                <span className="font-semibold text-slate-100">スロー</span>
                <span className="text-slate-400">4.5秒間 弾速が低下</span>
              </div>
            </div>
          </div>

          {/* Difficulty Selector */}
          <div className="mb-6">
            <h2 className="mb-2.5 text-xs font-bold text-slate-300">難易度を選択</h2>
            <div className="grid grid-cols-3 gap-2">
              {(['EASY', 'NORMAL', 'HARD'] as Difficulty[]).map((id) => {
                const cfg = DIFFICULTY_CONFIGS[id];
                const active = difficulty === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onSelectDifficulty(id)}
                    className={`rounded-lg border px-3 py-2.5 text-left transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
                      active
                        ? 'border-sky-400 bg-sky-500/15 text-slate-50'
                        : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07]'
                    }`}
                  >
                    <div className="text-sm font-bold whitespace-nowrap">{cfg.label}</div>
                    <div className="mt-0.5 text-[11px] text-slate-400 whitespace-nowrap truncate">
                      {cfg.subtitle}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-slate-400">
              弾のすぐ近くをかすめる（グレイズ）とスコア倍率が上昇します
            </p>
            <button
              type="button"
              onClick={onStartGame}
              className="rounded-lg bg-sky-500 px-6 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-sky-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 whitespace-nowrap shrink-0 cursor-pointer"
            >
              ゲームスタート
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'PAUSED') {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-xl border border-white/12 bg-[#0D1323] p-6 shadow-2xl">
          <h2 className="text-xl font-bold text-slate-50">一時停止中</h2>
          <p className="mt-1.5 text-xs text-slate-400">
            Esc または P キーでプレイを再開できます
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={onResumeGame}
              className="w-full rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition-colors hover:bg-sky-400 whitespace-nowrap cursor-pointer"
            >
              ゲームを再開
            </button>
            <button
              type="button"
              onClick={onStartGame}
              className="w-full rounded-lg border border-white/12 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-100 transition-colors hover:bg-white/10 whitespace-nowrap cursor-pointer"
            >
              最初からやり直す
            </button>
            <button
              type="button"
              onClick={onReturnToTitle}
              className="w-full rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 whitespace-nowrap cursor-pointer"
            >
              タイトルへ戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'GAME_OVER' && summary) {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-xl border border-white/12 bg-[#0D1323] p-7 shadow-2xl">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-2xl font-black text-slate-50">ゲームオーバー</h2>
            <span className="text-xs font-medium text-slate-400">
              {DIFFICULTY_CONFIGS[summary.difficulty].label}
            </span>
          </div>

          <div className="mt-5 border-y border-white/10 py-5">
            <div className="text-xs text-slate-400">最終スコア</div>
            <div className="mt-1 flex items-baseline gap-3">
              <span className="font-mono-tabular text-4xl font-bold text-slate-50">
                {summary.score.toLocaleString()}
              </span>
              {summary.isNewHighScore && (
                <span className="text-xs font-bold text-amber-300">自己ベスト更新</span>
              )}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-y-3 gap-x-6 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">到達ウェーブ</span>
                <span className="font-mono-tabular font-bold text-slate-100">
                  WAVE {summary.wave}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">生存時間</span>
                <span className="font-mono-tabular font-bold text-slate-100">
                  {formatTime(summary.elapsedSeconds)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">最大倍率</span>
                <span className="font-mono-tabular font-bold text-amber-300">
                  x{summary.maxMultiplier.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">グレイズ回数</span>
                <span className="font-mono-tabular font-bold text-sky-300">
                  {summary.grazeCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">アイテム取得</span>
                <span className="font-mono-tabular font-bold text-emerald-300">
                  {summary.itemsCollected} 個
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">ハイスコア</span>
                <span className="font-mono-tabular font-bold text-slate-200">
                  {summary.highScore.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={onStartGame}
              className="flex-1 rounded-lg bg-sky-500 px-5 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-sky-400 whitespace-nowrap cursor-pointer"
            >
              もう一度プレイ
            </button>
            <button
              type="button"
              onClick={onReturnToTitle}
              className="rounded-lg border border-white/12 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10 whitespace-nowrap cursor-pointer"
            >
              タイトルへ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
