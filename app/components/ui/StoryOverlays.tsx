'use client';

import React from 'react';
import { FlightMetrics } from '../scene/CameraPath';

interface StoryOverlaysProps {
  metrics: FlightMetrics | null;
}

export const StoryOverlays: React.FC<StoryOverlaysProps> = ({ metrics }) => {
  if (!metrics) return null;

  return (
    <div className="fixed top-12 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-center max-w-xl px-6 font-mono transition-all duration-700 select-none">
      <div className="inline-block px-3.5 py-1 rounded-full bg-black/30 backdrop-blur-md border border-white/10 text-[10px] text-cyan-300 tracking-[0.25em] uppercase shadow-lg">
        {metrics.stageName}
      </div>
      <p className="mt-1.5 text-xs text-zinc-400/90 tracking-wider font-light drop-shadow">
        {metrics.stageDescription}
      </p>
    </div>
  );
};
