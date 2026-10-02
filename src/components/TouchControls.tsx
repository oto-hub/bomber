import React from 'react';
import { Direction } from '../types/game';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Bomb, Sparkles } from 'lucide-react';

interface TouchControlsProps {
  onDirectionChange: (dir: Direction | null) => void;
  onPlantBomb: () => void;
  onKangarooJump: () => void;
  hasKangaroo: boolean;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onDirectionChange,
  onPlantBomb,
  onKangarooJump,
  hasKangaroo,
}) => {
  const handlePointerDown = (dir: Direction) => {
    onDirectionChange(dir);
  };

  const handlePointerUp = () => {
    onDirectionChange(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-2 flex items-center justify-between px-4 select-none touch-none lg:hidden">
      {/* Virtual D-Pad */}
      <div className="relative w-36 h-36 bg-slate-900/80 rounded-full border border-slate-700/60 p-2 shadow-inner">
        {/* UP */}
        <button
          className="absolute top-1 left-1/2 -translate-x-1/2 w-11 h-11 rounded-t-xl bg-slate-800 active:bg-amber-500 text-slate-200 active:text-slate-950 flex items-center justify-center transition-colors shadow"
          onPointerDown={() => handlePointerDown('UP')}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <ArrowUp className="w-6 h-6" />
        </button>

        {/* DOWN */}
        <button
          className="absolute bottom-1 left-1/2 -translate-x-1/2 w-11 h-11 rounded-b-xl bg-slate-800 active:bg-amber-500 text-slate-200 active:text-slate-950 flex items-center justify-center transition-colors shadow"
          onPointerDown={() => handlePointerDown('DOWN')}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <ArrowDown className="w-6 h-6" />
        </button>

        {/* LEFT */}
        <button
          className="absolute left-1 top-1/2 -translate-y-1/2 w-11 h-11 rounded-l-xl bg-slate-800 active:bg-amber-500 text-slate-200 active:text-slate-950 flex items-center justify-center transition-colors shadow"
          onPointerDown={() => handlePointerDown('LEFT')}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        {/* RIGHT */}
        <button
          className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 rounded-r-xl bg-slate-800 active:bg-amber-500 text-slate-200 active:text-slate-950 flex items-center justify-center transition-colors shadow"
          onPointerDown={() => handlePointerDown('RIGHT')}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <ArrowRight className="w-6 h-6" />
        </button>

        {/* Center hub */}
        <div className="absolute inset-0 m-auto w-8 h-8 rounded-full bg-slate-950 border border-slate-700 pointer-events-none" />
      </div>

      {/* Action Buttons: BOMB & JUMP */}
      <div className="flex items-center gap-4">
        {/* Kangaroo Jump (Special Action) */}
        <button
          onPointerDown={onKangarooJump}
          className={`flex flex-col items-center justify-center w-16 h-16 rounded-full border shadow-lg transition-transform active:scale-95 ${
            hasKangaroo
              ? 'bg-emerald-600 border-emerald-400 text-white shadow-emerald-500/40 animate-pulse'
              : 'bg-slate-800/80 border-slate-700 text-slate-500'
          }`}
        >
          <Sparkles className="w-6 h-6 mb-0.5" />
          <span className="text-[10px] font-bold">跳躍</span>
        </button>

        {/* Plant Bomb */}
        <button
          onPointerDown={onPlantBomb}
          className="flex flex-col items-center justify-center w-18 h-18 rounded-full bg-rose-600 active:bg-rose-500 border-2 border-rose-400 text-white shadow-lg shadow-rose-600/50 transition-transform active:scale-95"
        >
          <Bomb className="w-8 h-8 mb-0.5" />
          <span className="text-xs font-bold tracking-tight">爆弾</span>
        </button>
      </div>
    </div>
  );
};
