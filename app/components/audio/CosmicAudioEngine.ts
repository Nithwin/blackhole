// Procedural Web Audio API Sound Engine for Cosmic Black Hole & 5D Tesseract Experience

export class CosmicAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted = true;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  // Sound nodes
  private subBassOsc: OscillatorNode | null = null;
  private subBassGain: GainNode | null = null;

  private plasmaNoiseNode: AudioBufferSourceNode | null = null;
  private plasmaFilter: BiquadFilterNode | null = null;
  private plasmaGain: GainNode | null = null;

  private tesseractGains: GainNode[] = [];
  private tesseractOscs: OscillatorNode[] = [];

  private shepardOscs: OscillatorNode[] = [];
  private shepardGains: GainNode[] = [];

  public init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      // Master output & visualizer analyzer
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      // 1. Cosmic Sub-Bass Hum
      this.setupSubBass();

      // 2. Accretion Disk Plasma Noise
      this.setupPlasmaNoise();

      // 3. Gravitational Shear (Shepard-style descending drone)
      this.setupShepardTone();

      // 4. 5D Tesseract Resonant Harmonics
      this.setupTesseractChimes();
    } catch (e) {
      console.warn('Web Audio API not supported or user interaction required', e);
    }
  }

  private setupSubBass() {
    if (!this.ctx || !this.masterGain) return;

    this.subBassOsc = this.ctx.createOscillator();
    this.subBassOsc.type = 'sine';
    this.subBassOsc.frequency.setValueAtTime(45.0, this.ctx.currentTime);

    this.subBassGain = this.ctx.createGain();
    this.subBassGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(110, this.ctx.currentTime);

    this.subBassOsc.connect(filter);
    filter.connect(this.subBassGain);
    this.subBassGain.connect(this.masterGain);

    this.subBassOsc.start();
  }

  private setupPlasmaNoise() {
    if (!this.ctx || !this.masterGain) return;

    // Generate 3 seconds of pink/brownian noise loop
    const bufferSize = this.ctx.sampleRate * 3;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // 1-pole filter for brownian/pink characteristics
      output[i] = (lastOut + 0.025 * white) / 1.025;
      lastOut = output[i];
      output[i] *= 3.5; // Gain boost
    }

    this.plasmaNoiseNode = this.ctx.createBufferSource();
    this.plasmaNoiseNode.buffer = noiseBuffer;
    this.plasmaNoiseNode.loop = true;

    this.plasmaFilter = this.ctx.createBiquadFilter();
    this.plasmaFilter.type = 'bandpass';
    this.plasmaFilter.frequency.setValueAtTime(280, this.ctx.currentTime);
    this.plasmaFilter.Q.setValueAtTime(2.5, this.ctx.currentTime);

    this.plasmaGain = this.ctx.createGain();
    this.plasmaGain.gain.setValueAtTime(0.05, this.ctx.currentTime);

    this.plasmaNoiseNode.connect(this.plasmaFilter);
    this.plasmaFilter.connect(this.plasmaGain);
    this.plasmaGain.connect(this.masterGain);

    this.plasmaNoiseNode.start();
  }

  private setupShepardTone() {
    if (!this.ctx || !this.masterGain) return;

    // 4 layered sine tones spanning 4 octaves
    const baseFreqs = [55, 110, 220, 440];
    baseFreqs.forEach((freq) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();

      this.shepardOscs.push(osc);
      this.shepardGains.push(gain);
    });
  }

  private setupTesseractChimes() {
    if (!this.ctx || !this.masterGain) return;

    // Celestial frequencies based on 432 Hz Pythagorean sacred ratios
    const notes = [216, 324, 432, 648, 864];
    notes.forEach((f) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0, this.ctx.currentTime); // Initially silent

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();

      this.tesseractOscs.push(osc);
      this.tesseractGains.push(gain);
    });
  }

  public update(progress: number, velocityFraction: number) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;

    // Sub-bass frequency modulates with proximity to event horizon
    if (this.subBassOsc) {
      const targetFreq = 40 + (1.0 - Math.min(1.0, progress * 1.3)) * 25;
      this.subBassOsc.frequency.setTargetAtTime(targetFreq, now, 0.1);
    }

    // Plasma noise swells around the accretion disk (progress 0.20 - 0.60)
    if (this.plasmaGain && this.plasmaFilter) {
      let plasmaLevel = 0.0;
      if (progress >= 0.15 && progress <= 0.7) {
        // Peak at 0.4
        const dist = Math.abs(progress - 0.4);
        plasmaLevel = Math.max(0.0, 1.0 - dist / 0.3) * 0.35;
      }
      this.plasmaGain.gain.setTargetAtTime(plasmaLevel, now, 0.15);
      this.plasmaFilter.frequency.setTargetAtTime(250 + velocityFraction * 900, now, 0.15);
    }

    // Tesseract ethereal chimes swell inside the 5D portal (progress > 0.65)
    const tesseractActive = Math.max(0.0, Math.min(1.0, (progress - 0.65) / 0.25));
    this.tesseractGains.forEach((gainNode, i) => {
      // Gentle arpeggiated breathing modulation
      const pulse = Math.sin(now * (1.2 + i * 0.4)) * 0.02 + 0.04;
      gainNode.gain.setTargetAtTime(tesseractActive * pulse, now, 0.2);
    });

    // Modulate pitch of gravitational shear descent
    this.shepardOscs.forEach((osc, idx) => {
      const base = 55 * Math.pow(2, idx);
      const pitchShift = 1.0 - (progress * 0.35);
      osc.frequency.setTargetAtTime(base * pitchShift, now, 0.15);
    });
  }

  public toggleMute(): boolean {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }

    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const targetGain = this.isMuted ? 0.0 : 0.65;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }
    return !this.isMuted;
  }

  public getAudioData(): Uint8Array {
    if (!this.analyser || this.isMuted) {
      return new Uint8Array(32);
    }
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }
}
