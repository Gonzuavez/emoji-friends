import type { Page } from '@playwright/test';

export async function installAudio(page: Page, duration = 8) {
  await page.addInitScript(({ duration }) => {
    const stats = { starts: 0, stops: 0, ended: 0, active: 0, resumes: 0, gain: 1 };
    Object.assign(window, { audioStats: stats });
    class Source {
      buffer: unknown;
      onended: (() => void) | null = null;
      timer = 0;
      running = false;
      connect() { return this; }
      disconnect() {}
      start() {
        this.running = true; stats.starts++; stats.active++;
        this.timer = window.setTimeout(() => {
          this.running = false; stats.active--; stats.ended++; this.onended?.();
        }, duration * 1000);
      }
      stop() {
        if (this.running) { this.running = false; stats.active--; stats.stops++; }
        window.clearTimeout(this.timer);
      }
    }
    class Context {
      constructor() { Object.assign(window, { testAudioContext: this }); }
      state = 'suspended'; currentTime = 0; destination = {}; onstatechange: (() => void) | null = null;
      async resume() { stats.resumes++; this.state = 'running'; }
      async close() { this.state = 'closed'; }
      async decodeAudioData() { return { duration }; }
      createBufferSource() { return new Source(); }
      createGain() { return { gain: {
        set value(value: number) { stats.gain = value; },
        setValueAtTime() {}, exponentialRampToValueAtTime() {},
      }, connect() { return this; }, disconnect() {} }; }
      createOscillator() { return { frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() { return this; }, disconnect() {}, start() {}, stop() {}, onended: null }; }
    }
    Object.defineProperty(window, 'AudioContext', { value: Context });
  }, { duration });
  await page.route('**/audio/bruno-*.mp3', route => route.fulfill({ contentType: 'audio/mpeg', body: Buffer.from([0]) }));
}
