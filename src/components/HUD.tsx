import React from 'react';
import { Character, GameMode, BattleScore } from '../types/game';
import { Volume2, VolumeX, Music, HelpCircle, Pause, Play, RotateCcw } from 'lucide-react';

interface HUDProps {
  mode: GameMode;
  stageNumber?: number;
  timeRemaining: number;
  player: Character;
  battleScores: BattleScore[];
  isMuted: boolean;
  bgmMuted: boolean;
  isPaused: boolean;
  onToggleMute: () => void;
  onToggleBgm: () => void;
  onTogglePause: () => void;
  onOpenGuide: () => void;
  onExitToTitle: () => void;
  singlePlayerLives: number;
  singlePlayerScore: number;
}

export const HUD: React.FC<HUDProps> = ({
  mode,
  stageNumber = 1,
  timeRemaining,
  player,
  battleScores,
  isMuted,
  bgmMuted,
  isPaused,
  onToggleMute,
  onToggleBgm,
  onTogglePause,
  onOpenGuide,
  onExitToTitle,
  singlePlayerLives,
  singlePlayerScore,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <header className="w-full max-w-4xl mx-auto mb-3 px-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-lg text-slate-200">
      {/* Top Bar: Mode, Time, Controls */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-2 mb-2">
        {/* Left: Mode Title */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-base tracking-wide text-amber-400 font-['DotGothic16']">
            {mode === 'BATTLE' ? '💣 バトル対戦モード' : `🗺️ ステージ ${stageNumber}`}
          </span>
          {mode === 'ADVENTURE' && (
            <div className="flex items-center gap-1 text-xs text-rose-400 font-semibold ml-2">
              <span>残機:</span>
              <span className="text-base text-rose-300">{'❤️'.repeat(Math.max(0, singlePlayerLives))}</span>
            </div>
          )}
        </div>

        {/* Center: Timer Clock */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-1 rounded-md border border-slate-800 font-mono">
          <span className="text-xs text-slate-400">TIME</span>
          <span
            className={`text-base font-bold tabular-nums ${
              timeRemaining <= 30 ? 'text-red-400 animate-pulse' : 'text-emerald-400'
            }`}
          >
            {formatTime(timeRemaining)}
          </span>
        </div>

        {/* Right: Sound & Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenGuide}
            title="アイテム＆操作ガイド"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-sky-400" />
          </button>
          <button
            onClick={onToggleBgm}
            title={bgmMuted ? 'BGM ON' : 'BGM OFF'}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Music className={`w-4 h-4 ${bgmMuted ? 'text-slate-500' : 'text-emerald-400'}`} />
          </button>
          <button
            onClick={onToggleMute}
            title={isMuted ? '効果音 ON' : '効果音 OFF'}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-amber-400" />
            )}
          </button>
          <button
            onClick={onTogglePause}
            title={isPaused ? '再開' : '一時停止'}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {isPaused ? (
              <Play className="w-4 h-4 text-emerald-400" />
            ) : (
              <Pause className="w-4 h-4 text-amber-400" />
            )}
          </button>
          <button
            onClick={onExitToTitle}
            title="タイトルへ戻る"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors ml-1"
          >
            <RotateCcw className="w-4 h-4 text-slate-400 hover:text-rose-400" />
          </button>
        </div>
      </div>

      {/* Bottom Bar: Player 1 Items & Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Item Stat Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Bomb Capacity */}
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800">
            <span className="text-sm">💣</span>
            <span className="text-slate-400">爆弾:</span>
            <span className="font-bold text-slate-100 tabular-nums">
              {player.activeBombs}/{player.maxBombs}
            </span>
          </div>

          {/* Fire Range */}
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800">
            <span className="text-sm">🔥</span>
            <span className="text-slate-400">火力:</span>
            <span className="font-bold text-amber-400 tabular-nums">{player.fireRange}</span>
          </div>

          {/* Speed */}
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800">
            <span className="text-sm">👟</span>
            <span className="text-slate-400">速度:</span>
            <span className="font-bold text-cyan-400 tabular-nums">
              {Math.round(player.speed * 10) / 10}
            </span>
          </div>

          {/* Bomb Kick Item */}
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded border ${
              player.hasKick
                ? 'bg-rose-950/70 border-rose-600 text-rose-200'
                : 'bg-slate-950/40 border-slate-800/60 text-slate-600'
            }`}
          >
            <span>👢</span>
            <span className="font-medium">キック</span>
            <span className="font-bold">{player.hasKick ? 'OK' : '―'}</span>
          </div>

          {/* Pierce Bomb Item */}
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded border ${
              player.hasPierce
                ? 'bg-amber-950/70 border-amber-500 text-amber-200'
                : 'bg-slate-950/40 border-slate-800/60 text-slate-600'
            }`}
          >
            <span>⚡</span>
            <span className="font-medium">貫通弾</span>
            <span className="font-bold">{player.hasPierce ? 'OK' : '―'}</span>
          </div>

          {/* Kangaroo Mount */}
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded border ${
              player.kangaroo
                ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200 shadow-sm shadow-emerald-500/30'
                : 'bg-slate-950/40 border-slate-800/60 text-slate-600'
            }`}
          >
            <span>🦘</span>
            <span className="font-bold">
              {player.kangaroo
                ? player.kangaroo.jumpCooldown > 0
                  ? 'ジャンプ冷却中'
                  : 'カンガルー騎乗中 (跳躍可能!)'
                : '未騎乗'}
            </span>
          </div>
        </div>

        {/* Score or Battle Wins */}
        <div>
          {mode === 'BATTLE' ? (
            <div className="flex items-center gap-2">
              <span className="text-slate-400">勝利星:</span>
              <div className="flex items-center gap-1.5">
                {battleScores.map((bs) => (
                  <span
                    key={bs.playerId}
                    className="px-1.5 py-0.5 rounded text-[11px] font-bold"
                    style={{ backgroundColor: `${bs.color}22`, color: bs.color }}
                  >
                    {bs.name}: {bs.wins}勝
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-slate-300">
              <span className="text-slate-400">スコア:</span>
              <span className="font-mono font-bold text-amber-400 tabular-nums">
                {singlePlayerScore.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
