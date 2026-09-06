'use client';

import React, { useEffect, useState } from 'react';
import { BlackHoleCanvas } from './components/BlackHoleCanvas';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black text-white">
      {mounted ? (
        <BlackHoleCanvas />
      ) : (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-black text-cyan-400 font-mono">
          <div className="relative flex items-center justify-center mb-6">
            <div className="w-20 h-20 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
            <div className="absolute w-8 h-8 rounded-full bg-cyan-400/20 animate-pulse" />
          </div>
          <div className="tracking-[0.3em] uppercase text-sm font-semibold text-cyan-300">
            INITIALIZING RELATIVISTIC GRAVITATIONAL SIMULATOR
          </div>
          <div className="text-zinc-500 text-xs mt-2 tracking-widest">
            CALCULATING KERR METRIC TENSORS & EINSTEIN RINGS...
          </div>
        </div>
      )}
    </main>
  );
}
