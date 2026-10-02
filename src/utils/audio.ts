/**
 * Web Audio API Synthesizer for Retro 8-bit Game Audio & Catchy BGM
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private bgmMuted: boolean = false;
  private bgmGainNode: GainNode | null = null;
  private masterGainNode: GainNode | null = null;
  private isBgmPlaying: boolean = false;
  private bgmIntervalId: number | null = null;
  private bgmStep: number = 0;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  public initCtx() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGainNode = this.ctx.createGain();
      this.masterGainNode.gain.value = 0.45;
      this.masterGainNode.connect(this.ctx.destination);

      this.bgmGainNode = this.ctx.createGain();
      this.bgmGainNode.gain.value = 0.32;
      this.bgmGainNode.connect(this.masterGainNode);
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public ensureAudioReady() {
    this.initCtx();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (this.isBgmPlaying && !this.bgmMuted && !this.isMuted) {
      // Ensure timer is ticking
      if (this.bgmIntervalId === null) {
        this.restartBGMInterval();
      }
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.ensureAudioReady();
    if (this.masterGainNode && this.ctx) {
      this.masterGainNode.gain.setValueAtTime(this.isMuted ? 0 : 0.45, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public toggleBgm(): boolean {
    this.bgmMuted = !this.bgmMuted;
    this.ensureAudioReady();
    if (this.bgmGainNode && this.ctx) {
      this.bgmGainNode.gain.setValueAtTime(this.bgmMuted ? 0 : 0.32, this.ctx.currentTime);
    }
    if (!this.bgmMuted && !this.isBgmPlaying) {
      this.startBGM();
    }
    return !this.bgmMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public getBgmMuted(): boolean {
    return this.bgmMuted;
  }

  // 1. Bomb Drop
  public playBombDrop() {
    if (this.isMuted) return;
    this.ensureAudioReady();
    if (!this.ctx || !this.masterGainNode) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.1);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGainNode);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  // 2. Explosion
  public playExplosion() {
    if (this.isMuted) return;
    this.ensureAudioReady();
    if (!this.ctx || !this.masterGainNode) return;

    const now = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.45);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(70, now + 0.45);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGainNode);

    noise.start(now);
    noise.stop(now + 0.46);

    // Deep sub bass thud
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(130, now);
    subOsc.frequency.exponentialRampToValueAtTime(28, now + 0.35);

    subGain.gain.setValueAtTime(0.5, now);
    subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    subOsc.connect(subGain);
    subGain.connect(this.masterGainNode);
    subOsc.start(now);
    subOsc.stop(now + 0.36);
  }

  // 3. Item Pickup
  public playItemPickup() {
    if (this.isMuted) return;
    this.ensureAudioReady();
    if (!this.ctx || !this.masterGainNode) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGainNode) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = now + idx * 0.05;

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.25, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + 0.09);

      osc.connect(gain);
      gain.connect(this.masterGainNode);

      osc.start(start);
      osc.stop(start + 0.1);
    });
  }

  // 4. Bomb Kick
  public playKick() {
    if (this.isMuted) return;
    this.ensureAudioReady();
    if (!this.ctx || !this.masterGainNode) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.18);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGainNode);

    osc.start(now);
    osc.stop(now + 0.21);
  }

  // 5. Kangaroo Hop
  public playKangarooHop() {
    if (this.isMuted) return;
    this.ensureAudioReady();
    if (!this.ctx || !this.masterGainNode) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(750, now + 0.15);

    gain.gain.setValueAtTime(0.38, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    osc.connect(gain);
    gain.connect(this.masterGainNode);

    osc.start(now);
    osc.stop(now + 0.23);
  }

  // 6. Kangaroo Shield Saved (escape sound)
  public playKangarooRescue() {
    if (this.isMuted) return;
    this.ensureAudioReady();
    if (!this.ctx || !this.masterGainNode) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.linearRampToValueAtTime(1400, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.3);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGainNode);

    osc.start(now);
    osc.stop(now + 0.36);
  }

  // 7. Player Death
  public playDeath() {
    if (this.isMuted) return;
    this.ensureAudioReady();
    if (!this.ctx || !this.masterGainNode) return;

    const freqs = [440, 392, 349, 293, 220, 160];
    const now = this.ctx.currentTime;

    freqs.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGainNode) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = now + idx * 0.08;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.3, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGainNode);

      osc.start(start);
      osc.stop(start + 0.13);
    });
  }

  // 8. Stage Clear Fanfare
  public playStageClear() {
    if (this.isMuted) return;
    this.ensureAudioReady();
    if (!this.ctx || !this.masterGainNode) return;

    const notes = [
      { f: 523.25, d: 0.12 },
      { f: 659.25, d: 0.12 },
      { f: 783.99, d: 0.12 },
      { f: 1046.5, d: 0.25 },
      { f: 880.0, d: 0.15 },
      { f: 1046.5, d: 0.4 },
    ];

    let offset = 0;
    const now = this.ctx.currentTime;

    notes.forEach((note) => {
      if (!this.ctx || !this.masterGainNode) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = now + offset;

      osc.type = 'square';
      osc.frequency.setValueAtTime(note.f, start);

      gain.gain.setValueAtTime(0.35, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + note.d);

      osc.connect(gain);
      gain.connect(this.masterGainNode);

      osc.start(start);
      osc.stop(start + note.d + 0.02);

      offset += note.d * 1.05;
    });
  }

  // 9. Retro Arcade Bomberman BGM
  public startBGM() {
    this.ensureAudioReady();
    if (this.isBgmPlaying && this.bgmIntervalId !== null) return;
    this.isBgmPlaying = true;
    this.bgmStep = 0;
    this.restartBGMInterval();
  }

  private restartBGMInterval() {
    if (this.bgmIntervalId !== null) {
      clearInterval(this.bgmIntervalId);
    }

    // Classic 32-step upbeat Bomberman melody & bassline
    // Frequencies (Hz):
    // C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88
    // C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77, C6: 1046.50
    const melody: number[] = [
      523.25, 0,      659.25, 783.99, 1046.5, 783.99, 659.25, 523.25, // Bar 1 (C)
      698.46, 0,      880.00, 1046.5, 880.00, 698.46, 587.33, 0,      // Bar 2 (F)
      783.99, 0,      987.77, 1174.6, 987.77, 783.99, 659.25, 587.33, // Bar 3 (G)
      523.25, 659.25, 783.99, 1046.5, 0,      1046.5, 0,      0,       // Bar 4 (C resolve)
    ];

    const bassline: number[] = [
      130.81, 261.63, 130.81, 261.63, 130.81, 261.63, 164.81, 196.00, // C bass
      174.61, 349.23, 174.61, 349.23, 174.61, 349.23, 196.00, 174.61, // F bass
      196.00, 392.00, 196.00, 392.00, 196.00, 392.00, 220.00, 196.00, // G bass
      130.81, 261.63, 130.81, 261.63, 196.00, 164.81, 130.81, 0,      // C bass
    ];

    const stepDuration = 140; // ~107 BPM 16th notes

    this.bgmIntervalId = window.setInterval(() => {
      if (!this.ctx || !this.bgmGainNode || this.bgmMuted || this.isMuted) {
        this.bgmStep = (this.bgmStep + 1) % melody.length;
        return;
      }

      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
        return;
      }

      const now = this.ctx.currentTime;
      const stepIdx = this.bgmStep % melody.length;

      // 1. Bass Note (Triangle Wave)
      const bassFreq = bassline[stepIdx];
      if (bassFreq > 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(bassFreq, now);

        bassGain.gain.setValueAtTime(0.28, now);
        bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        bassOsc.connect(bassGain);
        bassGain.connect(this.bgmGainNode);
        bassOsc.start(now);
        bassOsc.stop(now + 0.13);
      }

      // 2. Melody Lead (Square Wave with chiptune tone)
      const melFreq = melody[stepIdx];
      if (melFreq > 0) {
        const melOsc = this.ctx.createOscillator();
        const melGain = this.ctx.createGain();
        melOsc.type = 'square';
        melOsc.frequency.setValueAtTime(melFreq, now);

        melGain.gain.setValueAtTime(0.22, now);
        melGain.gain.exponentialRampToValueAtTime(0.008, now + 0.11);

        melOsc.connect(melGain);
        melGain.connect(this.bgmGainNode);
        melOsc.start(now);
        melOsc.stop(now + 0.12);
      }

      // 3. Rhythm Drum:
      // Kick drum on beats 0, 4, 8, 12, 16, 20, 24, 28
      if (stepIdx % 4 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(140, now);
        kickOsc.frequency.exponentialRampToValueAtTime(35, now + 0.08);

        kickGain.gain.setValueAtTime(0.3, now);
        kickGain.gain.exponentialRampToValueAtTime(0.005, now + 0.09);

        kickOsc.connect(kickGain);
        kickGain.connect(this.bgmGainNode);
        kickOsc.start(now);
        kickOsc.stop(now + 0.095);
      }

      // Snare / Hi-hat on beats 2, 6, 10, 14, etc.
      if (stepIdx % 2 === 1) {
        const buffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.04), this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const isSnare = stepIdx % 4 === 2;
        const filter = this.ctx.createBiquadFilter();
        filter.type = isSnare ? 'bandpass' : 'highpass';
        filter.frequency.setValueAtTime(isSnare ? 2500 : 6000, now);

        const drumGain = this.ctx.createGain();
        drumGain.gain.setValueAtTime(isSnare ? 0.15 : 0.07, now);
        drumGain.gain.exponentialRampToValueAtTime(0.001, now + (isSnare ? 0.05 : 0.03));

        noise.connect(filter);
        filter.connect(drumGain);
        drumGain.connect(this.bgmGainNode);
        noise.start(now);
        noise.stop(now + 0.055);
      }

      this.bgmStep = (this.bgmStep + 1) % melody.length;
    }, stepDuration);
  }

  public stopBGM() {
    if (this.bgmIntervalId !== null) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
    this.isBgmPlaying = false;
  }
}

export const sound = new SoundEngine();
