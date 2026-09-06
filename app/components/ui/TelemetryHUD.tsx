'use client';

import React from 'react';
import { FlightMetrics } from '../scene/CameraPath';

interface TelemetryHUDProps {
  metrics: FlightMetrics | null;
  audioActive: boolean;
  audioData?: Uint8Array;
}

export const TelemetryHUD: React.FC<TelemetryHUDProps> = ({
  metrics,
  audioActive,
  audioData,
}) => {
  if (!metrics) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-30 select-none font-mono text-xs">
      {/* Top Right: Minimalist Audio Visualizer Waves (Only when sound is active) */}
      {audioActive && audioData && (
        <div className="absolute top-6 right-6 flex items-center gap-1 p-2 rounded-lg bg-black/30 backdrop-blur-md border border-white/5 shadow-lg">
          <div className="flex items-center gap-0.5 h-4">
            {Array.from({ length: 12 }).map((_, i) => {
              const val = audioData[i * 2] || 10;
              const heightPct = Math.max(15, Math.min(100, (val / 255) * 100));
              return (
                <div
                  key={i}
                  className="w-0.5 bg-cyan-400/70 rounded-full transition-all duration-75"
                  style={{ height: `${heightPct}%` }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Screen Center Subtle Reticle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 pointer-events-none opacity-15">
        <div className="absolute inset-0 border border-white/40 rounded-full" />
        <div className="absolute top-1/2 left-0 w-2.5 h-px bg-white/60 -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-2.5 h-px bg-white/60 -translate-y-1/2" />
        <div className="absolute left-1/2 top-0 w-px h-2.5 bg-white/60 -translate-x-1/2" />
        <div className="absolute left-1/2 bottom-0 w-px h-2.5 bg-white/60 -translate-x-1/2" />
      </div>

      {/* Cinematic Viewport Corner Framing Brackets */}
      <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-white/20" />
      <div className="absolute top-4 right-4 w-4 h-4 border-t border-r border-white/20" />
      <div className="absolute bottom-4 left-4 w-4 h-4 border-b border-l border-white/20" />
      <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-white/20" />
    </div>
  );
};
