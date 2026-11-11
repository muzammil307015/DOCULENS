/**
 * DOCULENS Procedural Ambient Audio Controller
 *
 * Uses the native Web Audio API to generate a subtle, warm, original ambient harmonic
 * atmosphere ONLY when the user explicitly selects [ LISTEN ].
 * Never autoplays, requires zero external audio files, and handles browser policies gracefully.
 */

class AmbientSoundController {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private isPlaying: boolean = false;

  /**
   * Starts the subtle ambient soundscape after explicit user interaction.
   */
  public async start(): Promise<boolean> {
    if (this.isPlaying && this.ctx) {
      if (this.ctx.state === "suspended") {
        await this.ctx.resume().catch(() => {});
      }
      return true;
    }

    try {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return false;

      const ctx = new AudioContextClass();
      this.ctx = ctx;

      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(0.022, ctx.currentTime + 2.4);

      // Warm low-pass filter to keep the harmonic pad soft and atmospheric
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(340, ctx.currentTime);
      filter.Q.setValueAtTime(0.7, ctx.currentTime);

      filter.connect(masterGain);
      masterGain.connect(ctx.destination);
      this.masterGain = masterGain;

      // Subtle A-minor 9th / C-major 7th warm harmonic frequencies (Hz)
      const frequencies = [110.0, 164.81, 220.0, 261.63, 329.63];
      const detunes = [-4, 3, -2, 5, -3];

      this.oscillators = frequencies.map((freq, index) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();

        osc.type = index % 2 === 0 ? "sine" : "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.detune.setValueAtTime(detunes[index], ctx.currentTime);

        oscGain.gain.setValueAtTime(index === 0 ? 0.35 : 0.16, ctx.currentTime);

        osc.connect(oscGain);
        oscGain.connect(filter);
        osc.start();
        return osc;
      });

      this.isPlaying = true;
      return true;
    } catch {
      this.isPlaying = false;
      return false;
    }
  }

  /**
   * Plays a delicate, restrained harmonic pulse when transitioning into DOCULENS.
   */
  public triggerEntryTransitionTone(): void {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      const chimeOsc = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();

      chimeOsc.type = "sine";
      chimeOsc.frequency.setValueAtTime(440, now);
      chimeOsc.frequency.exponentialRampToValueAtTime(587.33, now + 0.9);

      chimeGain.gain.setValueAtTime(0.0001, now);
      chimeGain.gain.exponentialRampToValueAtTime(0.018, now + 0.15);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(this.ctx.destination);

      chimeOsc.start(now);
      chimeOsc.stop(now + 1.45);
    } catch {
      // Ignore audio errors
    }
  }

  /**
   * Smoothly fades out and stops all Web Audio nodes.
   */
  public stop(): void {
    if (!this.ctx || !this.masterGain) {
      this.isPlaying = false;
      return;
    }

    try {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(Math.max(0.0001, this.masterGain.gain.value), now);
      this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

      const currentOscs = [...this.oscillators];
      const currentCtx = this.ctx;
      this.oscillators = [];
      this.isPlaying = false;

      setTimeout(() => {
        currentOscs.forEach(osc => {
          try {
            osc.stop();
            osc.disconnect();
          } catch {
            // Already stopped
          }
        });
        try {
          currentCtx.close();
        } catch {
          // Ignore close error
        }
      }, 500);
    } catch {
      this.isPlaying = false;
    }
  }

  public getStatus(): boolean {
    return this.isPlaying;
  }
}

export const ambientSound = new AmbientSoundController();
