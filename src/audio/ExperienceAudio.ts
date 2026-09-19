import type { Gift } from '../config/gifts/brunoThinkingOfYou';
import { isDialogue, type Phase } from '../experiences/BrunoThinkingOfYou/timeline';

/** One lifecycle per gift. Audio failure must never block the visual timeline. */
export class ExperienceAudio {
  private context?: AudioContext;
  private muted = false;
  private generation = 0;

  async unlock(): Promise<boolean> {
    try {
      this.context ??= new AudioContext();
      // Called synchronously from the initial tap, before any timeline effect.
      await this.context.resume();
      return this.context.state === 'running';
    } catch { return false; }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (muted) this.stop();
  }

  play(phase: Phase, gift: Gift) {
    this.stop();
    if (phase.startsWith('knock')) this.knock();
    if (isDialogue(phase) && gift.audio[phase]) {
      const generation = this.generation;
      // Decode through the gesture-unlocked context (including mobile Safari).
      // Recordings are optional; a missing/invalid file silently leaves captions.
      const context = this.context;
      if (!context || context.state !== 'running' || this.muted) return;
      void fetch(gift.audio[phase]!)
        .then(response => { if (!response.ok) throw new Error('Audio unavailable'); return response.arrayBuffer(); })
        .then(buffer => context.decodeAudioData(buffer))
        .then(buffer => {
          if (generation !== this.generation || this.muted) return;
          const source = context.createBufferSource();
          source.buffer = buffer;
          source.connect(context.destination);
          source.start();
          this.activeSource = source;
        }).catch(() => {});
    }
  }

  private activeSource?: AudioBufferSourceNode;
  private knock() {
    const context = this.context;
    if (!context || context.state !== 'running' || this.muted) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(210, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(70, context.currentTime + 0.12);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.15);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.16);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }

  stop() {
    this.generation++;
    this.activeSource?.stop();
    this.activeSource?.disconnect();
    this.activeSource = undefined;
  }
  dispose() {
    this.stop();
    void this.context?.close().catch(() => {});
    this.context = undefined;
  }
}
