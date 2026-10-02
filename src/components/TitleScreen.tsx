import React, { useState } from 'react';
import { GameMode } from '../types/game';
import { Swords, Compass, HelpCircle, Trophy, Volume2, Music, Users, User } from 'lucide-react';

interface TitleScreenProps {
  onStartGame: (mode: GameMode, options: { isTwoPlayer: boolean; targetWins: number; cpuDifficulty: 'NORMAL' | 'HARD' }) => void;
  onOpenGuide: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStartGame, onOpenGuide }) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>('BATTLE');
  const [isTwoPlayer, setIsTwoPlayer] = useState<boolean>(false);
  const [targetWins, setTargetWins] = useState<number>(2);
  const [cpuDifficulty, setCpuDifficulty] = useState<'NORMAL' | 'HARD'>('NORMAL');

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center p-4">
      {/* Arcade Title Box */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/80 shadow-2xl">
        {/* Banner Image */}
        <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-slate-950 flex items-center justify-center">
          <img
            src="/src/assets/images/bomber_title_banner_1790914628929.jpg"
            alt="ボンバーアリーナ＆カンガルーアドベンチャー"
            className="w-full h-full object-cover object-center brightness-95 contrast-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

          {/* Title Overlay */}
          <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1 font-['DotGothic16']">
                <span>RETRO ARCADE 16-BIT</span>
                <span>·</span>
                <span>FULL ACTION</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-wide font-['DotGothic16'] drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                ボンバーアリーナ
                <span className="text-amber-400 block sm:inline sm:ml-2">＆ カンガルー騎乗</span>
              </h1>
            </div>

            {/* Mascot badge */}
            <div className="hidden sm:block w-18 h-18 rounded-2xl overflow-hidden border-2 border-emerald-400 shadow-lg shadow-emerald-500/30">
              <img
                src="/src/assets/images/bomber_kangaroo_mascot_1790914641294.jpg"
                alt="カンガルー mascot"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {/* Mode Selection Tabs */}
          <div className="flex items-center gap-3 p-1.5 bg-slate-950/80 rounded-xl border border-slate-800 mb-6">
            <button
              onClick={() => setSelectedMode('BATTLE')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm transition-all ${
                selectedMode === 'BATTLE'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Swords className="w-5 h-5" />
              <span>対戦バトルモード</span>
            </button>
            <button
              onClick={() => setSelectedMode('ADVENTURE')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm transition-all ${
                selectedMode === 'ADVENTURE'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-5 h-5" />
              <span>一人用アドベンチャー</span>
            </button>
          </div>

          {/* Mode Details & Settings */}
          {selectedMode === 'BATTLE' ? (
            <div className="space-y-4 mb-6 bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">💥</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-200">
                    4人サバイバルバトル（CPUまたは2人対戦）
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    壁を壊してアイテム（個数UP・火力UP・速度UP・キック・ブロック貫通弾）やカンガルーを集め、最後まで生き残れ！60秒経過するとサドンデスで外周から鉄球ブロックが落下！
                  </p>
                </div>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800">
                {/* 1P vs 2P */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                    プレイヤー数
                  </label>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setIsTwoPlayer(false)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1 ${
                        !isTwoPlayer
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold'
                          : 'bg-slate-900 border-slate-700 text-slate-400'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      1P vs 3CPU
                    </button>
                    <button
                      onClick={() => setIsTwoPlayer(true)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1 ${
                        isTwoPlayer
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold'
                          : 'bg-slate-900 border-slate-700 text-slate-400'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      2P対戦 (共有鍵盤)
                    </button>
                  </div>
                </div>

                {/* Target Wins */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                    勝利本数
                  </label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3].map((w) => (
                      <button
                        key={w}
                        onClick={() => setTargetWins(w)}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border ${
                          targetWins === w
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                            : 'bg-slate-900 border-slate-700 text-slate-400'
                        }`}
                      >
                        {w}本先取
                      </button>
                    ))}
                  </div>
                </div>

                {/* CPU Difficulty */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                    CPU 強さ
                  </label>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setCpuDifficulty('NORMAL')}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border ${
                        cpuDifficulty === 'NORMAL'
                          ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-bold'
                          : 'bg-slate-900 border-slate-700 text-slate-400'
                      }`}
                    >
                      ふつう
                    </button>
                    <button
                      onClick={() => setCpuDifficulty('HARD')}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border ${
                        cpuDifficulty === 'HARD'
                          ? 'bg-red-500/20 border-red-500 text-red-300 font-bold'
                          : 'bg-slate-900 border-slate-700 text-slate-400'
                      }`}
                    >
                      つよい
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 mb-6 bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">🏰</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-200">
                    全4ステージ制覇アドベンチャー
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    ステージ内の敵モンスターをすべて爆破し、ソフトブロックのどこかに隠された『脱出ワープ扉（EXIT）』を見つけて脱出しよう！ステージ4では巨大ボス『メカキング』が降臨！
                  </p>
                </div>
              </div>

              {/* Stage previews */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-xs">
                <div className="p-2 rounded bg-slate-900/80 border border-emerald-900/60">
                  <div className="font-bold text-emerald-400">STAGE 1</div>
                  <div className="text-[11px] text-slate-400">グリーンガーデン</div>
                </div>
                <div className="p-2 rounded bg-slate-900/80 border border-orange-900/60">
                  <div className="font-bold text-orange-400">STAGE 2</div>
                  <div className="text-[11px] text-slate-400">マグマケイブ</div>
                </div>
                <div className="p-2 rounded bg-slate-900/80 border border-sky-900/60">
                  <div className="font-bold text-sky-400">STAGE 3</div>
                  <div className="text-[11px] text-slate-400">メカノ要塞</div>
                </div>
                <div className="p-2 rounded bg-slate-900/80 border border-red-900/60">
                  <div className="font-bold text-rose-400">STAGE 4 (BOSS)</div>
                  <div className="text-[11px] text-slate-400">決戦！メカキング</div>
                </div>
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              onClick={onOpenGuide}
              className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-sky-400" />
              <span>アイテム＆カンガルー解説書</span>
            </button>

            <button
              onClick={() => onStartGame(selectedMode, { isTwoPlayer, targetWins, cpuDifficulty })}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-extrabold text-base tracking-wider font-['DotGothic16'] shadow-xl shadow-amber-500/25 transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              <span>ゲームスタート！</span>
              <span className="text-xl">➔</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
