import React from 'react';
import { GameMode, BattleScore } from '../types/game';
import { Trophy, RotateCcw, ArrowRight, Play, Home } from 'lucide-react';

interface GameOverModalProps {
  type: 'ROUND_WIN' | 'MATCH_WIN' | 'STAGE_CLEAR' | 'GAME_OVER' | 'ALL_CLEAR';
  winnerName?: string;
  winnerColor?: string;
  currentRound?: number;
  stageNumber?: number;
  score?: number;
  battleScores?: BattleScore[];
  targetWins?: number;
  onNextRound?: () => void;
  onNextStage?: () => void;
  onRetry?: () => void;
  onReturnTitle: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  type,
  winnerName,
  winnerColor = '#f59e0b',
  stageNumber = 1,
  score = 0,
  battleScores = [],
  targetWins = 2,
  onNextRound,
  onNextStage,
  onRetry,
  onReturnTitle,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl text-slate-100 text-center">
        {/* Header icon / title */}
        {type === 'ROUND_WIN' && (
          <div>
            <div className="text-4xl mb-2">⭐</div>
            <h2 className="text-2xl font-bold font-['DotGothic16'] text-amber-400">
              ラウンド終了！
            </h2>
            <div
              className="text-lg font-bold mt-2"
              style={{ color: winnerColor }}
            >
              {winnerName} の勝利！
            </div>

            {/* Score standings */}
            <div className="mt-4 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <div className="text-slate-400 mb-2 font-semibold">現在の星獲得数 (先取目標: {targetWins})</div>
              <div className="flex justify-center gap-3">
                {battleScores.map((bs) => (
                  <div key={bs.playerId} className="flex flex-col items-center">
                    <span className="font-bold" style={{ color: bs.color }}>
                      {bs.name}
                    </span>
                    <span className="text-base font-bold text-amber-300">
                      {'★'.repeat(bs.wins) || '―'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={onReturnTitle}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Home className="w-4 h-4" />
                タイトル
              </button>
              <button
                onClick={onNextRound}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>次のラウンドへ</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {type === 'MATCH_WIN' && (
          <div>
            <div className="text-5xl mb-2">🏆</div>
            <h2 className="text-2xl font-bold font-['DotGothic16'] text-amber-400">
              優勝決定！
            </h2>
            <div
              className="text-2xl font-bold mt-2 font-['DotGothic16']"
              style={{ color: winnerColor }}
            >
              🎉 {winnerName} の完全制覇！
            </div>
            <p className="text-xs text-slate-400 mt-2">
              規定の {targetWins} 勝を達成し、ボンバーキングの栄冠に輝きました！
            </p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={onReturnTitle}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Home className="w-4 h-4" />
                タイトルへ
              </button>
              <button
                onClick={onRetry}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                もう一度対戦！
              </button>
            </div>
          </div>
        )}

        {type === 'STAGE_CLEAR' && (
          <div>
            <div className="text-5xl mb-2">🎉</div>
            <h2 className="text-2xl font-bold font-['DotGothic16'] text-emerald-400">
              ステージ {stageNumber} クリア！
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              敵を撃破し、脱出ゲートに到達しました！
            </p>

            <div className="my-4 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400">現在の累計スコア: </span>
              <span className="font-mono font-bold text-amber-400 text-sm">
                {score.toLocaleString()}
              </span>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={onReturnTitle}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Home className="w-4 h-4" />
                タイトル
              </button>
              <button
                onClick={onNextStage}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>次ステージへ進む</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {type === 'GAME_OVER' && (
          <div>
            <div className="text-5xl mb-2">💀</div>
            <h2 className="text-2xl font-bold font-['DotGothic16'] text-rose-500">
              GAME OVER
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              すべての残機を失いました...
            </p>

            <div className="my-4 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400">最終獲得スコア: </span>
              <span className="font-mono font-bold text-amber-400 text-sm">
                {score.toLocaleString()}
              </span>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={onReturnTitle}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Home className="w-4 h-4" />
                タイトル
              </button>
              <button
                onClick={onRetry}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                ステージやり直し
              </button>
            </div>
          </div>
        )}

        {type === 'ALL_CLEAR' && (
          <div>
            <div className="text-5xl mb-2">👑</div>
            <h2 className="text-2xl font-bold font-['DotGothic16'] text-amber-400">
              全ステージ完全制覇！！
            </h2>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              メカキングを撃退し、平和を取り戻しました！お見事です！
            </p>

            <div className="my-4 p-4 bg-slate-950 rounded-xl border border-amber-500/40 text-xs">
              <div className="text-slate-400 mb-1">ハイスコア</div>
              <div className="font-mono font-bold text-amber-300 text-lg">
                {score.toLocaleString()} PTS
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={onReturnTitle}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Home className="w-4 h-4" />
                タイトルへ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
