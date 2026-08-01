import type { Celebration } from "@/lib/types";

type Tone = {
  freq: number;
  type?: OscillatorType;
  duration: number;
  delay?: number;
  gain?: number;
  slideTo?: number;
};

class PackSoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private muted = false;
  private unlocked = false;

  isMuted() {
    return this.muted;
  }

  setMuted(next: boolean) {
    this.muted = next;
    if (this.master) this.master.gain.value = next ? 0 : 0.55;
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  async unlock() {
    if (typeof window === "undefined") return;
    const ctx = this.ensure();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        /* ignore autoplay blocks until next gesture */
      }
    }
    this.unlocked = ctx.state === "running";
  }

  private ensure() {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.55;
      this.master.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  private now() {
    return this.ensure()?.currentTime ?? 0;
  }

  private dest() {
    this.ensure();
    return this.master;
  }

  private tone({ freq, type = "sine", duration, delay = 0, gain = 0.18, slideTo }: Tone) {
    const ctx = this.ensure();
    const dest = this.dest();
    if (!ctx || !dest || this.muted) return;

    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    if (slideTo != null) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(20, slideTo),
        ctx.currentTime + delay + duration,
      );
    }
    g.gain.setValueAtTime(0.0001, ctx.currentTime + delay);
    g.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + delay + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);
    osc.connect(g);
    g.connect(dest);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration + 0.02);
  }

  private noise(duration: number, delay = 0, gain = 0.12, filterFreq = 1800) {
    const ctx = this.ensure();
    const dest = this.dest();
    if (!ctx || !dest || this.muted) return;

    const samples = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, samples, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < samples; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / samples);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = filterFreq;
    filter.Q.value = 0.7;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, ctx.currentTime + delay);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);
    src.connect(filter);
    filter.connect(g);
    g.connect(dest);
    src.start(ctx.currentTime + delay);
  }

  playRip() {
    void this.unlock();
    this.noise(0.18, 0, 0.22, 2200);
    this.noise(0.28, 0.05, 0.16, 900);
    this.tone({ freq: 180, type: "triangle", duration: 0.22, gain: 0.1, slideTo: 70 });
    this.tone({ freq: 420, type: "sawtooth", duration: 0.12, delay: 0.04, gain: 0.05, slideTo: 140 });
  }

  playWhoosh() {
    this.noise(0.35, 0, 0.1, 600);
    this.tone({ freq: 220, type: "sine", duration: 0.35, gain: 0.06, slideTo: 90 });
  }

  playFlip() {
    this.tone({ freq: 620, type: "triangle", duration: 0.08, gain: 0.1 });
    this.tone({ freq: 880, type: "sine", duration: 0.12, delay: 0.04, gain: 0.08 });
    this.noise(0.08, 0.02, 0.06, 2800);
  }

  playFoil() {
    this.tone({ freq: 1400, type: "sine", duration: 0.18, gain: 0.05 });
    this.tone({ freq: 1900, type: "triangle", duration: 0.22, delay: 0.05, gain: 0.04 });
    this.tone({ freq: 2400, type: "sine", duration: 0.28, delay: 0.1, gain: 0.03 });
  }

  playSuspense(level: Celebration) {
    void this.unlock();
    const depth =
      level === "jackpot" ? 1 : level === "hit" ? 0.85 : level === "foil" ? 0.65 : level === "glow" ? 0.4 : 0.2;
    this.tone({
      freq: 80 + depth * 20,
      type: "sine",
      duration: 0.9 + depth,
      gain: 0.04 + depth * 0.05,
      slideTo: 55,
    });
    this.tone({
      freq: 160,
      type: "triangle",
      duration: 0.7 + depth * 0.5,
      delay: 0.1,
      gain: 0.03 + depth * 0.03,
      slideTo: 110,
    });
    if (depth > 0.5) {
      this.noise(0.8 + depth * 0.4, 0.15, 0.04 + depth * 0.03, 400);
    }
  }

  playLand(level: Celebration) {
    this.tone({ freq: 140, type: "triangle", duration: 0.12, gain: 0.12, slideTo: 70 });
    this.noise(0.1, 0, 0.08, 900);
    if (level === "glow" || level === "foil") this.playFoil();
    if (level === "hit") this.playHit();
    if (level === "jackpot") this.playJackpot();
  }

  playHit() {
    this.tone({ freq: 330, type: "sawtooth", duration: 0.18, gain: 0.08, slideTo: 220 });
    this.tone({ freq: 520, type: "triangle", duration: 0.25, delay: 0.05, gain: 0.1 });
    this.tone({ freq: 780, type: "sine", duration: 0.35, delay: 0.12, gain: 0.08 });
    this.noise(0.25, 0, 0.1, 1600);
  }

  playJackpot() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      this.tone({ freq, type: "triangle", duration: 0.35, delay: i * 0.08, gain: 0.12 });
      this.tone({ freq: freq * 2, type: "sine", duration: 0.4, delay: i * 0.08 + 0.02, gain: 0.04 });
    });
    this.noise(0.5, 0, 0.12, 2000);
  }

  playSummary() {
    this.tone({ freq: 392, type: "sine", duration: 0.2, gain: 0.08 });
    this.tone({ freq: 523.25, type: "triangle", duration: 0.28, delay: 0.1, gain: 0.08 });
    this.tone({ freq: 659.25, type: "sine", duration: 0.35, delay: 0.2, gain: 0.07 });
  }

  playUiTap() {
    this.tone({ freq: 740, type: "sine", duration: 0.06, gain: 0.05 });
  }
}

export const packSounds = new PackSoundEngine();

export function celebrationHeadline(level: Celebration): string | null {
  switch (level) {
    case "jackpot":
      return "ONE OF ONE";
    case "hit":
      return "MAJOR HIT";
    case "foil":
      return "CHROME FOIL";
    case "glow":
      return "REFRACTOR";
    default:
      return null;
  }
}

export function suspenseMs(level: Celebration): number {
  switch (level) {
    case "jackpot":
      return 2200;
    case "hit":
      return 1600;
    case "foil":
      return 1100;
    case "glow":
      return 700;
    default:
      return 180;
  }
}

export function revealIntensity(level: Celebration): number {
  switch (level) {
    case "jackpot":
      return 5;
    case "hit":
      return 4;
    case "foil":
      return 3;
    case "glow":
      return 2;
    default:
      return 1;
  }
}
