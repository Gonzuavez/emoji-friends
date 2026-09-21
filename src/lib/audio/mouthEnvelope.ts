/** Amplitude, not phoneme/viseme lip sync. Replace this signal source later
 * without exposing the audio graph to the character renderer. */
export interface MouthSignal {
  subscribe(listener: (value: number) => void): () => void;
}
export class MouthEnvelope {
  value = 0;
  update(samples: Float32Array, elapsedMs: number) {
    let energy = 0;
    for (const sample of samples) energy += sample * sample;
    const rms = Math.sqrt(energy / Math.max(1, samples.length));
    const target = Math.min(1, Math.max(0, (rms - 0.012) / 0.24));
    const tau = target > this.value ? 45 : 130;
    this.value += (target - this.value) * (1 - Math.exp(-Math.max(0, elapsedMs) / tau));
    if (this.value < 0.001) this.value = 0;
    return this.value;
  }
}

/** One analysis loop, only while speech or its short release is active and a
 * renderer is listening. The graph tap is supplied by the existing player. */
export class MouthDriver implements MouthSignal {
  private listeners = new Set<(value: number) => void>();
  private envelope = new MouthEnvelope();
  private analyser?: AnalyserNode;
  private samples = new Float32Array(512);
  private frame = 0;
  private last = 0;
  subscribe = (listener: (value: number) => void) => {
    this.listeners.add(listener);
    listener(this.envelope.value);
    if (this.analyser) this.schedule();
    return () => { this.listeners.delete(listener); if (!this.listeners.size) this.cancel(); };
  };
  start(analyser: AnalyserNode) {
    this.analyser = analyser;
    this.samples = new Float32Array(analyser.fftSize);
    this.last = performance.now();
    this.schedule();
  }
  stop(immediate = false) {
    this.analyser = undefined;
    if (immediate || !this.listeners.size) {
      this.cancel();
      this.envelope.value = 0;
      this.emit(0);
    } else this.schedule();
  }
  private emit(value: number) { for (const listener of this.listeners) listener(value); }
  private cancel() { cancelAnimationFrame(this.frame); this.frame = 0; }
  private schedule() {
    if (!this.frame && this.listeners.size) this.frame = requestAnimationFrame(this.tick);
  }
  private tick = (now: number) => {
    this.frame = 0;
    this.samples.fill(0);
    this.analyser?.getFloatTimeDomainData(this.samples);
    this.emit(this.envelope.update(this.samples, Math.min(100, now - this.last)));
    this.last = now;
    if (this.analyser || this.envelope.value > 0) this.schedule();
  };
}
