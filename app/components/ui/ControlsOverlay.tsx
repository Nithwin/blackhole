'use client';

import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Eye,
  Lock,
  BookOpen,
  RotateCcw,
  Sparkles,
  X,
  Layers,
} from 'lucide-react';

interface ControlsOverlayProps {
  audioActive: boolean;
  onToggleAudio: () => void;
  freeLook: boolean;
  onToggleFreeLook: () => void;
  onResetView: () => void;
}

export const ControlsOverlay: React.FC<ControlsOverlayProps> = ({
  audioActive,
  onToggleAudio,
  freeLook,
  onToggleFreeLook,
  onResetView,
}) => {
  const [showTheoryModal, setShowTheoryModal] = useState(false);

  return (
    <>
      {/* Action Buttons Floating Controls */}
      <div className="fixed bottom-24 right-6 z-30 flex flex-col gap-2.5 font-mono">
        {/* Audio Toggle */}
        <button
          onClick={onToggleAudio}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl backdrop-blur-md border text-xs tracking-wider transition-all duration-300 shadow-xl cursor-pointer ${
            audioActive
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
              : 'bg-black/60 text-zinc-400 border-white/10 hover:text-white hover:bg-white/10'
          }`}
          title="Toggle Procedural Audio"
        >
          {audioActive ? (
            <>
              <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>SOUND ON</span>
            </>
          ) : (
            <>
              <VolumeX className="w-4 h-4" />
              <span>SOUND MUTED</span>
            </>
          )}
        </button>

        {/* Free-Look vs Cinematic Scroll Mode Toggle */}
        <button
          onClick={onToggleFreeLook}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl backdrop-blur-md border text-xs tracking-wider transition-all duration-300 shadow-xl cursor-pointer ${
            freeLook
              ? 'bg-amber-500/20 text-amber-300 border-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
              : 'bg-black/60 text-zinc-400 border-white/10 hover:text-white hover:bg-white/10'
          }`}
          title="Toggle 360° Free Look"
        >
          {freeLook ? (
            <>
              <Eye className="w-4 h-4 text-amber-400" />
              <span>FREE LOOK</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>SCROLL LOCK</span>
            </>
          )}
        </button>

        {/* Astrophysics / Theory Guide */}
        <button
          onClick={() => setShowTheoryModal(true)}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-xs text-zinc-400 hover:text-white hover:bg-white/10 tracking-wider transition-all duration-300 shadow-xl cursor-pointer"
          title="General Relativity & Kip Thorne Physics"
        >
          <BookOpen className="w-4 h-4" />
          <span>ASTROPHYSICS</span>
        </button>

        {/* Reset Orbit */}
        <button
          onClick={onResetView}
          className="flex items-center justify-center p-2.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all duration-300 shadow-xl cursor-pointer"
          title="Return to Orbit"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Center Bottom Scroll Prompt (fades out when scrolled) */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center gap-1 text-zinc-400 text-xs font-mono animate-bounce opacity-80">
        <span className="tracking-widest uppercase text-[11px] text-cyan-300">
          Scroll down to enter the black hole
        </span>
        <div className="w-4 h-6 rounded-full border border-white/30 flex items-start justify-center p-1">
          <div className="w-1 h-2 bg-cyan-400 rounded-full animate-ping" />
        </div>
      </div>

      {/* Theory / Astrophysics Modal */}
      {showTheoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-zinc-950 border border-white/15 rounded-2xl p-6 text-zinc-300 font-mono shadow-2xl">
            <button
              onClick={() => setShowTheoryModal(false)}
              className="absolute top-5 right-5 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-cyan-400 text-base font-bold mb-4">
              <Sparkles className="w-5 h-5" />
              <span>GENERAL RELATIVITY & GARGANTUA PHYSICS</span>
            </div>

            <div className="space-y-4 text-xs leading-relaxed text-zinc-300">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <h4 className="text-white font-semibold mb-1 text-sm text-cyan-300">
                  1. Kip Thorne Gravitational Lensing Halo
                </h4>
                <p>
                  In Christopher Nolan’s <em>Interstellar</em>, Nobel laureate Kip Thorne calculated how light from the accretion disk bends around Gargantua. Light originating from the <em>back</em> of the disk is bent over the top and under the bottom by extreme spacetime curvature, producing the iconic glowing halo arch above and below the horizon.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <h4 className="text-white font-semibold mb-1 text-sm text-amber-300">
                  2. Relativistic Doppler Beaming
                </h4>
                <p>
                  Plasma in the accretion disk orbits at relativistic velocities ($v \approx 0.5c - 0.8c$). Material moving toward the observer is Doppler-boosted in brightness by $\delta^4$ and blueshifted, while material moving away is significantly dimmed and redshifted into deep amber and infrared.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <h4 className="text-white font-semibold mb-1 text-sm text-emerald-300">
                  3. The Photon Sphere ($r = 1.5 r_s$)
                </h4>
                <p>
                  At 1.5 times the Schwarzschild radius, gravity is strong enough to force photons into circular orbits. This boundary creates an intensely brilliant, razor-sharp ring where trapped light makes multiple circuits before escaping or plunging into the abyss.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <h4 className="text-white font-semibold mb-1 text-sm text-purple-300">
                  4. The 5D Tesseract / Timeline Corridor
                </h4>
                <p>
                  Inside the event horizon, space and time invert: time flows toward the singularity like a physical direction. In <em>Interstellar</em>, higher-dimensional beings build a 5D tesseract where time is laid out as a spatial coordinate, allowing gravitational interactions across past, present, and future worldlines.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowTheoryModal(false)}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs transition cursor-pointer"
              >
                RETURN TO MISSION
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
