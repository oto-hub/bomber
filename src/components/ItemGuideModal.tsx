import React from 'react';
import { X, Flame, Plus, Zap, Footprints, ShieldCheck, Sparkles } from 'lucide-react';

interface ItemGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ItemGuideModal: React.FC<ItemGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const items = [
    {
      title: '爆弾アップ (+1)',
      icon: '💣',
      lucide: Plus,
      desc: '同時に設置できる爆弾の個数が+1増えます（最大8個まで）。',
      color: 'text-sky-400 border-sky-500/40 bg-sky-950/40',
    },
    {
      title: '火力アップ (FIRE)',
      icon: '🔥',
      lucide: Flame,
      desc: '爆発の炎の届く距離（マス数）が+1伸びます。',
      color: 'text-amber-400 border-amber-500/40 bg-amber-950/40',
    },
    {
      title: 'スピードアップ (SPEED)',
      icon: '👟',
      lucide: Zap,
      desc: '移動速度が上がります。爆風からの退避や敵の回避に有効！',
      color: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/40',
    },
    {
      title: 'ボムキック (KICK)',
      icon: '👢',
      lucide: Footprints,
      desc: '爆弾に向かって歩くと、爆弾を直進させて蹴飛ばすことができます！壁やブロックに当たると停止します。',
      color: 'text-rose-400 border-rose-500/40 bg-rose-950/40',
    },
    {
      title: 'ブロック貫通弾 (PIERCE)',
      icon: '⚡',
      lucide: Zap,
      desc: '爆風がソフトブロック（レンガ）で止まらず、そのまま一直線に突き抜けて破壊します！大逆転の超強力アイテム。',
      color: 'text-amber-300 border-amber-400/40 bg-amber-950/40',
    },
    {
      title: 'カンガルー騎乗 (ルーイ)',
      icon: '🦘',
      lucide: Sparkles,
      desc: 'カンガルーの卵を取ると騎乗！\n① 身代わり防御：爆風や敵の接触を受けてもカンガルーが身代わりとなり、プレイヤーは無傷で生還！\n② 特殊ジャンプ：[Space]キーまたは[跳躍]ボタンで、目の前のブロックや爆弾を1マス飛び越えることができます！',
      color: 'text-emerald-400 border-emerald-500/50 bg-emerald-950/40',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📜</span>
            <h2 className="text-xl font-bold font-['DotGothic16'] text-amber-400 tracking-wider">
              アイテム＆カンガルー操作マニュアル
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {items.map((item, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border ${item.color} flex flex-col gap-1.5`}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{item.icon}</span>
                <span className="font-bold text-sm font-['DotGothic16']">{item.title}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Keyboard Controls Guide */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
          <h3 className="text-sm font-bold text-slate-300 mb-2 font-['DotGothic16']">
            🎮 操作方法 (キーボード)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400 font-mono">
            <div>
              <span className="text-amber-400 font-bold">1P 移動:</span> 矢印キー または [W][A][S][D]
            </div>
            <div>
              <span className="text-amber-400 font-bold">1P 爆弾設置:</span> [Space] または [J]
            </div>
            <div>
              <span className="text-emerald-400 font-bold">カンガルージャンプ:</span> [K] または [Shift]
            </div>
            <div>
              <span className="text-sky-400 font-bold">2P 移動 (対戦時):</span> テンキー [8][4][5][6] または [I][J][K][L]
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
