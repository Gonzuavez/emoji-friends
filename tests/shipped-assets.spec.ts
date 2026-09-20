import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { brunoDemoAudio } from '../src/config/characters/bruno';

const recordings = [
  { cue: 'recognition', duration: 1.464, sha256: 'c430311fb525b2913e49f201e4f0b6199334d821ec3ba9d6d899fdb50372cc50' },
  { cue: 'introduction', duration: 3.456, sha256: '8c46a1b3224d89f1259f2327583dd2771e0b571573dcc9a52b89a0113bc59340' },
  { cue: 'message', duration: 3.120, sha256: '04e34f1d0fe427fba664bb3347e98fad0de4d0507860080b0472ebf7639d9318' },
  { cue: 'exit', duration: 4.416, sha256: 'd561b92a0fb04cb5dec5fa2e9b251774f86b35be2ded994304984367bee80273' },
] as const;

test('supplied master and voice recordings are unchanged', async () => {
  expect(createHash('sha256').update(readFileSync('public/characters/bruno/bruno.png')).digest('hex')).toBe('e8f7968f1e6ec7c4beea9b7e24e8dd26ebfefc86dd1526bd8a70fcb0e2973d37');
  for (const recording of recordings) {
    expect(createHash('sha256').update(readFileSync(`public/audio/bruno-${recording.cue}.mp3`)).digest('hex')).toBe(recording.sha256);
  }
});

test('real production image and all four MP3s load and play through CTA', async ({ page }, testInfo) => {
  test.setTimeout(70000);
  const errors: string[] = [];
  const audioResponses: Record<string, number> = {};
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => {
    const path = new URL(response.url()).pathname;
    if (path.endsWith('.mp3')) audioResponses[path] = response.status();
  });
  // Observe actual native playback without replacing decoding, sound, or time.
  await page.addInitScript(() => {
    const stats = { started: [] as number[], ended: 0 };
    Object.assign(window, { shippedAudioStats: stats });
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args: Parameters<typeof start>) {
      stats.started.push(this.buffer?.duration ?? 0);
      this.addEventListener('ended', () => stats.ended++);
      return start.apply(this, args);
    };
  });
  await page.goto('/g/bruno-thinking-of-you');
  await expect(page.locator('.character-layer')).toHaveAttribute('data-asset', 'production');
  expect(await page.locator('.character-art').evaluate((image: HTMLImageElement) => [image.naturalWidth, image.naturalHeight])).toEqual([1024, 1536]);
  await expect(page.locator('.placeholder')).toHaveCount(0);
  expect(audioResponses).toEqual({});
  await page.getByRole('button', { name: 'Open it' }).click();
  await expect(page.locator('main')).toHaveAttribute('data-phase', 'paw', { timeout: 15000 });
  await expect(page.locator('.glass-paw')).toHaveCSS('display', 'none');
  await page.screenshot({ path: testInfo.outputPath('production-paw.png'), animations: 'disabled' });
  await expect(page.locator('main')).toHaveAttribute('data-phase', 'message', { timeout: 15000 });
  await page.screenshot({ path: testInfo.outputPath('production-message.png'), animations: 'disabled' });
  await expect(page.getByRole('button', { name: 'Send Bruno to Someone' })).toBeVisible({ timeout: 25000 });
  const playback = await page.evaluate(() => (window as unknown as { shippedAudioStats: { started: number[]; ended: number } }).shippedAudioStats);
  expect(playback.ended).toBe(4);
  expect(playback.started).toHaveLength(4);
  for (const [index, recording] of recordings.entries()) {
    expect(audioResponses[brunoDemoAudio[recording.cue]]).toBe(200);
    // Native decoders may remove MP3 encoder padding (up to ~50 ms here).
    expect(Math.abs(playback.started[index] - recording.duration)).toBeLessThan(0.1);
  }
  await testInfo.attach('decoded-durations.json', { body: JSON.stringify(playback), contentType: 'application/json' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Replay' }).click();
  await expect(page.locator('main')).toHaveAttribute('data-phase', 'idle');
  await expect(page.locator('.character-layer')).toHaveAttribute('data-asset', 'production');
  expect(errors).toEqual([]);
});
