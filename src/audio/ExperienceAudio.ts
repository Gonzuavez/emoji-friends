import { MouthDriver } from '../lib/audio/mouthEnvelope';
import type { Gift } from '../config/gifts/brunoThinkingOfYou';
import { isDialogue, type Phase } from '../experiences/BrunoThinkingOfYou/timeline';

export const audioTiming = { loadTimeout: 2500, endPadding: 250, stallGrace: 1500 };

/** Gesture-unlocked, cached local clips. Every pending operation has a bounded
 * lifetime; no network/decode/playback failure can strand the performance.
 */
export class ExperienceAudio {
  readonly mouth = new MouthDriver();
  private analyser?: AnalyserNode;
  private context?: AudioContext;
  private output?: GainNode;
  private muted = false;
  private generation = 0;
  private buffers = new Map<string, Promise<AudioBuffer | null>>();
  private requests = new Set<AbortController>();
  private cancelPlayback?: () => void;
  private knocks = new Set<OscillatorNode>();
  onInterrupted?: () => void;

  async unlock(): Promise<boolean> {
    try {
      if (!this.context || this.context.state === 'closed') {
        const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return false;
        this.context = new AudioContextClass();
        this.output = this.context.createGain();
        this.output.gain.value = this.muted ? 0 : 1;
        this.output.connect(this.context.destination);
        this.context.onstatechange = () => {
          if (this.context?.state !== 'running' && this.cancelPlayback) this.onInterrupted?.();
        };
      }
      // Invoked directly from Open/Resume; never wait for a fetch before resume.
      const context = this.context;
      let timeout: number | undefined;
      try {
        await Promise.race([
          context.resume(),
          new Promise((_, reject) => { timeout = window.setTimeout(() => reject(new Error('Audio unavailable')), audioTiming.loadTimeout); }),
        ]);
        return context.state === 'running';
      } finally { window.clearTimeout(timeout); }
    } catch { return false; }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    // Keep playback time moving silently, so unmute does not restart a sentence.
    if (this.output) this.output.gain.value = muted ? 0 : 1;
  }

  preload(gift: Gift) {
    if (this.context?.state !== 'running') return;
    for (const url of Object.values(gift.audio)) void this.load(url);
  }

  private load(url: string): Promise<AudioBuffer | null> {
    const cached = this.buffers.get(url);
    if (cached) return cached;
    const context = this.context;
    if (!context) return Promise.resolve(null);
    const controller = new AbortController();
    this.requests.add(controller);
    let timeout: number | undefined;
    const task = Promise.race([
      fetch(url, { signal: controller.signal }).then(response => {
        if (!response.ok) throw new Error('Missing optional clip');
        return response.arrayBuffer();
      }).then(data => context.decodeAudioData(data)),
      new Promise<never>((_, reject) => {
        timeout = window.setTimeout(() => { controller.abort(); reject(new Error('Clip timed out')); }, audioTiming.loadTimeout);
      }),
    ]).catch(() => null).finally(() => {
      window.clearTimeout(timeout);
      this.requests.delete(controller);
    });
    this.buffers.set(url, task);
    return task;
  }

  async play(phase: Phase, gift: Gift): Promise<void> {
    this.stop();
    if (phase.startsWith('knock')) this.knock();
    if (!isDialogue(phase) || !gift.audio[phase]) return;
    const generation = this.generation;
    const context = this.context;
    if (!context || context.state !== 'running') return;
    const buffer = await this.load(gift.audio[phase]!);
    if (!buffer || generation !== this.generation || context.state !== 'running' || !this.output) return;
    await new Promise<void>(resolve => {
      const source = context.createBufferSource();
      source.buffer = buffer;
      // Read speech before the master gain: mute does not stop articulation.
      // Older/limited audio contexts can still play without analysis support.
      try {
        this.analyser ??= context.createAnalyser();
        this.analyser.fftSize = 512;
        source.connect(this.analyser);
        this.analyser.connect(this.output!);
        this.mouth.start(this.analyser);
      } catch { source.connect(this.output!); }
      let settled = false;
      let padding: number | undefined;
      let watchdog: number | undefined;
      const finish = () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(padding);
        window.clearTimeout(watchdog);
        source.onended = null;
        try { source.stop(); } catch { /* Already stopped or never started. */ }
        source.disconnect();
        this.analyser?.disconnect();
        this.mouth.stop();
        if (this.cancelPlayback === finish) this.cancelPlayback = undefined;
        resolve();
      };
      this.cancelPlayback = finish;
      source.onended = () => { this.mouth.stop(); padding = window.setTimeout(finish, audioTiming.endPadding); };
      // Handles OS interruptions or a browser that never dispatches ended.
      watchdog = window.setTimeout(finish, buffer.duration * 1000 + audioTiming.stallGrace);
      try { source.start(); } catch { finish(); }
    });
  }

  private knock() {
    const context = this.context;
    if (!context || context.state !== 'running' || !this.output) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(210, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(70, context.currentTime + 0.12);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.15);
    oscillator.connect(gain).connect(this.output);
    this.knocks.add(oscillator);
    oscillator.onended = () => { this.knocks.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
    oscillator.start();
    oscillator.stop(context.currentTime + 0.16);
  }

  stop() {
    this.generation++;
    this.mouth.stop(true);
    this.cancelPlayback?.();
    for (const oscillator of this.knocks) { try { oscillator.stop(); } catch { /* Finished. */ } }
    this.knocks.clear();
  }
  reset() {
    this.stop();
    for (const request of this.requests) request.abort();
    this.requests.clear();
    this.buffers.clear();
  }
  dispose() {
    this.reset();
    if (this.context) this.context.onstatechange = null;
    void this.context?.close().catch(() => {});
    this.context = undefined;
    this.output = undefined;
    this.analyser = undefined;
  }
}
