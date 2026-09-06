'use client';

import React from 'react';
import { BASE_STAGES } from '../scene/CameraPath';
import { ChevronRight, Infinity as InfinityIcon } from 'lucide-react';

interface ChapterNavProps {
  currentProgress: number;
  currentStageIndex: number;
  onSelectStage: (targetProgress: number) => void;
}

const CHAPTER_MILESTONES = [
  { name: 'Orbit', progress: 0.0 },
  { name: 'Infall', progress: 0.32 },
  { name: 'Photon Ring', progress: 0.52 },
  { name: 'Horizon', progress: 0.68 },
  { name: '5D Portal', progress: 0.85 },
  { name: 'Deep Bulk', progress: 1.5 },
];

export const ChapterNav: React.FC<ChapterNavProps> = ({
  currentProgress,
  currentStageIndex,
  onSelectStage,
}) => {
  const isInfinitePortal = currentProgress >= 0.75;

  return (
    <nav aria-label="Journey Chapters" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 max-w-3xl w-[90vw] px-4 py-2.5 rounded-xl bg-black/50 backdrop-blur-lg border border-white/10 shadow-2xl font-mono">
      {/* Chapter Indicator Buttons */}
      <div className="w-full flex items-center justify-between gap-1 overflow-x-auto no-scrollbar py-0.5">
        {CHAPTER_MILESTONES.map((milestone, idx) => {
          const isActive =
            idx === currentStageIndex ||
            (idx === 5 && currentProgress >= 1.2);

          return (
            <button
              key={milestone.name}
              onClick={() => onSelectStage(milestone.progress)}
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all duration-300 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  isActive
                    ? 'bg-cyan-400 scale-125 shadow-[0_0_8px_#38bdf8]'
                    : 'bg-zinc-600'
                }`}
              />
              <span className="font-medium text-[11px] tracking-wide">
                {milestone.name}
              </span>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />}
            </button>
          );
        })}
      </div>

      {/* Infinite Progress Track */}
      <div className="w-full flex items-center gap-3 text-[10px] text-zinc-400">
        <span className="font-mono">
          {isInfinitePortal ? `Z: -${((currentProgress - 0.75) * 200).toFixed(0)}m` : `${(Math.min(1, currentProgress / 0.75) * 100).toFixed(0)}%`}
        </span>
        <div
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickPos = (e.clientX - rect.left) / rect.width;
            onSelectStage(clickPos * 1.5);
          }}
          className="relative flex-1 h-1.5 bg-zinc-800/80 rounded-full overflow-hidden cursor-pointer group"
        >
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 via-amber-500 to-purple-500 transition-all duration-150"
            style={{
              width: isInfinitePortal
                ? `${Math.min(100, 75 + ((currentProgress - 0.75) % 1.0) * 25)}%`
                : `${(currentProgress / 0.75) * 75}%`,
            }}
          />
        </div>
        <div className="flex items-center gap-1 font-mono text-cyan-400/80">
          <InfinityIcon className="w-3.5 h-3.5 animate-pulse" />
          <span>INFINITE</span>
        </div>
      </div>
    </nav>
  );
};
