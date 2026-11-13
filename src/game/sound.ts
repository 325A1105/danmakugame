class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private lastGrazeTime: number = 0;

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public unlock(): void {
    this.ensureContext();
  }

  public playStart(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    this.tone(ctx, 440, 660, 0.08, now, 'triangle', 0.08);
    this.tone(ctx, 660, 880, 0.12, now + 0.06, 'triangle', 0.08);
  }

  public playGraze(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const nowMs = performance.now();
    if (nowMs - this.lastGrazeTime < 45) return;
    this.lastGrazeTime = nowMs;

    const now = ctx.currentTime;
    this.tone(ctx, 1180, 1520, 0.045, now, 'sine', 0.045);
  }

  public playPickup(kind: 'SCORE' | 'SHIELD' | 'CLEAR' | 'SLOW' | 'HEAL'): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (kind === 'SCORE') {
      this.tone(ctx, 784, 1174, 0.1, now, 'sine', 0.09);
      this.tone(ctx, 1174, 1568, 0.12, now + 0.05, 'sine', 0.07);
    } else if (kind === 'SHIELD') {
      this.tone(ctx, 523, 784, 0.12, now, 'triangle', 0.1);
      this.tone(ctx, 784, 1046, 0.16, now + 0.07, 'triangle', 0.09);
    } else if (kind === 'CLEAR') {
      this.tone(ctx, 880, 220, 0.28, now, 'sawtooth', 0.08);
      this.tone(ctx, 1320, 1760, 0.2, now + 0.04, 'sine', 0.09);
    } else if (kind === 'SLOW') {
      this.tone(ctx, 660, 330, 0.24, now, 'sine', 0.1);
      this.tone(ctx, 495, 293, 0.22, now + 0.08, 'triangle', 0.08);
    } else {
      this.tone(ctx, 587, 880, 0.12, now, 'sine', 0.1);
      this.tone(ctx, 880, 1174, 0.16, now + 0.08, 'sine', 0.09);
    }
  }

  public playShieldBreak(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    this.tone(ctx, 620, 190, 0.22, now, 'sawtooth', 0.11);
    this.tone(ctx, 420, 140, 0.2, now + 0.03, 'triangle', 0.09);
  }

  public playHit(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    this.tone(ctx, 210, 58, 0.26, now, 'sawtooth', 0.14);
    this.tone(ctx, 140, 48, 0.28, now + 0.02, 'square', 0.09);
  }

  public playWaveUp(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    this.tone(ctx, 523.25, 523.25, 0.08, now, 'triangle', 0.06);
    this.tone(ctx, 659.25, 659.25, 0.08, now + 0.07, 'triangle', 0.06);
    this.tone(ctx, 783.99, 1046.5, 0.15, now + 0.14, 'triangle', 0.07);
  }

  public playGameOver(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    this.tone(ctx, 392, 349, 0.16, now, 'triangle', 0.1);
    this.tone(ctx, 349, 293, 0.18, now + 0.14, 'triangle', 0.1);
    this.tone(ctx, 261, 146, 0.36, now + 0.28, 'sawtooth', 0.09);
  }

  private tone(
    ctx: AudioContext,
    startFreq: number,
    endFreq: number,
    duration: number,
    startTime: number,
    type: OscillatorType,
    volume: number,
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), startTime + duration);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }
}

export const sound = new SoundEngine();
