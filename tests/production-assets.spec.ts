import { expect, test, type Page } from '@playwright/test';
import { bruno, brunoDemoAudio } from '../src/config/characters/bruno';
import { brunoThinkingOfYou } from '../src/config/gifts/brunoThinkingOfYou';
import { durationFor, timeline } from '../src/experiences/BrunoThinkingOfYou/timeline';

// Deliberately neutral test pixel and deterministic audio double, never shipped
// as Bruno art/voice. These test integration, not production creative approval.
const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=', 'base64');
async function installAudio(page: Page, duration = 8) {
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
async function stats(page: Page) {
  return page.evaluate(() => (window as unknown as { audioStats: { starts: number; stops: number; active: number; ended: number; gain: number; resumes: number } }).audioStats);
}
async function reachRecognition(page: Page) {
  await page.getByRole('button', { name: 'Open it' }).click();
  for (const [index, step] of timeline.entries()) {
    if (step.id === 'recognition') break;
    await page.clock.runFor(durationFor(index, brunoThinkingOfYou));
  }
  await expect(page.locator('main')).toHaveAttribute('data-phase', 'recognition');
}

test('canonical production paths and voice identity are configured', async () => {
  expect(brunoThinkingOfYou.character).toEqual(bruno);
  expect(brunoThinkingOfYou.prop).toBeNull();
  expect(bruno.branding).toBe('Bruno paw-heart');
  expect(bruno.voice).toMatchObject({ name: 'BRUNOJI', provider: 'heygen', id: 'M9QQyAAoUtDSmALeZnRw', language: 'en' });
  expect(bruno.image).toBe('/characters/bruno/bruno.png');
  expect(brunoThinkingOfYou.audio).toEqual({
    recognition: '/audio/bruno-recognition.mp3', introduction: '/audio/bruno-introduction.mp3',
    message: '/audio/bruno-message.mp3', exit: '/audio/bruno-exit.mp3',
  });
});

test('configured image preserves alpha layout; unavailable asset uses original fallback', async ({ page }) => {
  await page.route('**/characters/bruno/bruno.png', route => route.fulfill({ contentType: 'image/png', body: pixel }));
  await page.goto('/');
  await expect(page.locator('.character-layer')).toHaveAttribute('data-asset', 'production');
  await expect(page.locator('.character-art')).toHaveCSS('object-fit', 'contain');
  await expect(page.locator('.bear')).toHaveCSS('mask-image', 'none');
  await expect(page.locator('.placeholder')).toHaveCount(0);
  await page.route('**/characters/bruno/bruno.png', route => route.fulfill({ status: 404, body: '' }));
  await page.reload();
  await expect(page.locator('.character-layer')).toHaveAttribute('data-asset', 'fallback');
  await expect(page.locator('.placeholder')).toHaveCount(1);
  await expect(page.locator('.character-art')).toHaveCount(0);
});

test('long voice holds captions, mute preserves progress, replay stops old audio', async ({ page }) => {
  await installAudio(page);
  await page.clock.install();
  const requested = new Set<string>();
  page.on('request', request => { if (request.url().includes('/audio/')) requested.add(new URL(request.url()).pathname); });
  await page.goto('/');
  expect((await stats(page)).starts).toBe(0);
  await reachRecognition(page);
  await expect.poll(async () => (await stats(page)).starts).toBe(1);
  expect([...requested].sort()).toEqual(Object.values(brunoDemoAudio).sort());
  await page.clock.runFor(3000);
  await expect(page.getByText('Psst… Leticia?')).toBeVisible();
  await page.getByRole('button', { name: 'Sound on' }).click();
  expect((await stats(page)).gain).toBe(0);
  expect((await stats(page)).active).toBe(1);
  await page.clock.runFor(1000);
  await page.getByRole('button', { name: 'Sound off' }).click();
  expect((await stats(page)).gain).toBe(1);
  await page.clock.runFor(4250);
  await expect(page.locator('main')).toHaveAttribute('data-phase', 'introduction');
  for (const [index, step] of timeline.entries()) {
    if (index < timeline.findIndex(step => step.id === 'introduction')) continue;
    await expect(page.locator('main')).toHaveAttribute('data-phase', step.id);
    await page.clock.runFor(['introduction', 'message', 'exit'].includes(step.id) ? 8250 : durationFor(index, brunoThinkingOfYou));
  }
  await expect(page.getByRole('button', { name: 'Replay' })).toBeVisible();
  expect((await stats(page)).active).toBe(0);
  expect((await stats(page)).ended).toBe(4);
  await page.getByRole('button', { name: 'Replay' }).click();
  await page.clock.runFor(20000);
  expect((await stats(page)).starts).toBe(4);
  await expect(page.locator('main')).toHaveAttribute('data-phase', 'idle');
  await reachRecognition(page);
  await expect.poll(async () => (await stats(page)).starts).toBe(5);
  expect((await stats(page)).active).toBe(1);
});

test('pause cancels speech and resumes the current beat after a fresh gesture', async ({ page }) => {
  await installAudio(page);
  await page.clock.install();
  await page.goto('/');
  await reachRecognition(page);
  await expect.poll(async () => (await stats(page)).starts).toBe(1);
  await page.getByRole('button', { name: 'Pause experience' }).click();
  expect((await stats(page)).active).toBe(0);
  await page.clock.runFor(20000);
  await expect(page.locator('main')).toHaveAttribute('data-phase', 'recognition');
  await page.getByRole('button', { name: 'Resume experience' }).click();
  await expect.poll(async () => (await stats(page)).starts).toBe(2);
  expect((await stats(page)).resumes).toBe(2);
  await page.clock.runFor(8250);
  await expect(page.locator('main')).toHaveAttribute('data-phase', 'introduction');
});

test('404 and invalid clips fall back to captions through CTA at narrow width', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.route('**/audio/bruno-*.mp3', route => route.fulfill({ status: route.request().url().includes('message') ? 200 : 404, body: 'not audio' }));
  await page.clock.install();
  await page.goto('/');
  await reachRecognition(page);
  for (const [index, step] of timeline.entries()) {
    if (index < timeline.findIndex(step => step.id === 'recognition')) continue;
    await expect(page.locator('main')).toHaveAttribute('data-phase', step.id);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (step.id === 'exit') {
      const text = await page.locator('.dialogue').boundingBox();
      const controls = await page.locator('.playback-controls').boundingBox();
      expect(text!.y + text!.height).toBeLessThanOrEqual(controls!.y);
    }
    await page.clock.runFor(durationFor(index, brunoThinkingOfYou));
  }
  await expect(page.getByRole('button', { name: 'Send Bruno to Someone' })).toBeVisible();
});


test('approved performance order stays intact without a permanent prop', async ({ page }) => {
  expect(timeline.map(step => step.id)).toEqual([
    'opening', 'knock1', 'knock2', 'knock3', 'capPeek', 'eyesRise', 'peek', 'paw',
    'recognition', 'introduction', 'message', 'reaction', 'exit', 'wave', 'wink', 'turn', 'depart',
  ]);
  await page.clock.install();
  await page.goto('/');
  await page.getByRole('button', { name: 'Open it' }).click();
  for (const [index, step] of timeline.entries()) {
    await expect(page.locator('main')).toHaveAttribute('data-phase', step.id);
    await expect(page.locator('.character-layer')).toHaveAttribute('data-pose', step.id);
    await expect(page.locator('.emotional-prop')).toHaveCount(0);
    await page.clock.runFor(durationFor(index, brunoThinkingOfYou));
  }
  await expect(page.getByRole('button', { name: 'Send Bruno to Someone' })).toBeVisible();
});

test('slow downloads time out and cannot start stale speech after the beat', async ({ page }) => {
  await installAudio(page);
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/audio/bruno-*.mp3', async route => {
    await held;
    await route.fulfill({ body: Buffer.from([0]) }).catch(() => {});
  });
  await page.clock.install();
  await page.goto('/');
  await reachRecognition(page);
  await page.clock.runFor(durationFor(timeline.findIndex(step => step.id === 'recognition'), brunoThinkingOfYou));
  await expect(page.locator('main')).toHaveAttribute('data-phase', 'introduction');
  release();
  await page.clock.runFor(500);
  expect((await stats(page)).starts).toBe(0);
});

test('real Web Audio decodes a local clip and ends before advancing', async ({ page }) => {
  // 120 ms of PCM silence: a codec fixture, not a replacement Bruno recording.
  const sampleRate = 8000;
  const sampleCount = 960;
  const wav = Buffer.alloc(44 + sampleCount * 2);
  wav.write('RIFF', 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(sampleRate, 24); wav.writeUInt32LE(sampleRate * 2, 28);
  wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
  wav.write('data', 36); wav.writeUInt32LE(sampleCount * 2, 40);
  await page.route('**/audio/bruno-*.mp3', route => route.fulfill({ contentType: 'audio/wav', body: wav }));
  await page.addInitScript(() => {
    const stats = { started: 0, ended: 0 };
    Object.assign(window, { realAudioStats: stats });
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args: Parameters<typeof start>) {
      stats.started++;
      this.addEventListener('ended', () => stats.ended++);
      return start.apply(this, args);
    };
  });
  await page.clock.install();
  await page.goto('/');
  await reachRecognition(page);
  await expect.poll(() => page.evaluate(() => (window as unknown as { realAudioStats: { ended: number } }).realAudioStats.ended)).toBe(1);
  await expect(page.locator('main')).toHaveAttribute('data-phase', 'recognition');
  await page.clock.runFor(durationFor(timeline.findIndex(step => step.id === 'recognition'), brunoThinkingOfYou));
  await expect(page.locator('main')).toHaveAttribute('data-phase', 'introduction');
});
