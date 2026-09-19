import { expect, test } from '@playwright/test';
import { brunoThinkingOfYou } from '../src/config/gifts/brunoThinkingOfYou';
import { durationFor, timeline } from '../src/experiences/BrunoThinkingOfYou/timeline';

test('complete gift, send notice, and clean replay without browser errors', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.clock.install();
  await page.goto('/g/bruno-thinking-of-you');
  await expect(page.getByRole('heading', { name: 'Someone sent you a little something…' })).toBeVisible();
  await page.screenshot({ animations: 'disabled', path: testInfo.outputPath('arrival.png') });
  await page.getByRole('button', { name: 'Open it' }).click();
  for (const [index, step] of timeline.entries()) {
    await expect(page.locator('main')).toHaveAttribute('data-phase', step.id);
    if (step.id === 'recognition') await expect(page.getByText('Psst… Leticia?')).toBeVisible();
    if (step.id === 'introduction') await expect(page.getByText('Hi! I’m Bruno. Angel asked me to bring you something.')).toBeVisible();
    if (step.id === 'exit') await expect(page.getByText('Okay… my job here is done. But don’t tell Angel I ate the snacks.')).toBeVisible();
    if (step.id === 'message') {
      if (testInfo.project.name === 'reduced-motion') {
        await expect(page.locator('.dialogue-line')).toHaveCSS('animation-name', 'none');
        await expect(page.locator('.bear')).toHaveCSS('transition-duration', '0s');
      }
      await expect(page.getByText(brunoThinkingOfYou.message)).toBeVisible();
      await page.screenshot({ animations: 'disabled', path: testInfo.outputPath('message.png') });
    }
    await page.clock.runFor(durationFor(index, brunoThinkingOfYou));
  }
  const send = page.getByRole('button', { name: 'Send Bruno to Someone' });
  await expect(send).toBeVisible();
  await expect(send).toBeFocused();
  await page.screenshot({ animations: 'disabled', path: testInfo.outputPath('reveal.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await send.click();
  await expect(page.getByText('Bruno’s first little outing. Sending your own gift is coming next.')).toBeVisible();
  await page.getByRole('button', { name: 'Replay' }).click();
  await expect(page.locator('main')).toHaveAttribute('data-phase', 'idle');
  await expect(page.getByRole('button', { name: 'Open it' })).toBeFocused();
  await page.getByRole('button', { name: 'Open it' }).click();
  for (const [index] of timeline.entries()) await page.clock.runFor(durationFor(index, brunoThinkingOfYou));
  await expect(send).toBeVisible();
  expect(errors).toEqual([]);
});

test('audio unavailable still completes; pause prevents skipped beats', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'AudioContext', { value: undefined }); });
  await page.clock.install();
  await page.goto('/');
  await page.getByRole('button', { name: 'Open it' }).click();
  await expect(page.getByRole('button', { name: 'Playing quietly' })).toBeVisible();
  await page.getByRole('button', { name: 'Pause experience' }).click();
  await page.clock.runFor(60000);
  await expect(page.locator('main')).toHaveAttribute('data-phase', 'opening');
  await page.getByRole('button', { name: 'Resume experience' }).click();
  for (const [index] of timeline.entries()) await page.clock.runFor(durationFor(index, brunoThinkingOfYou));
  await expect(page.getByRole('button', { name: 'Send Bruno to Someone' })).toBeVisible();
});

test('unknown gift has a helpful fallback', async ({ page }) => {
  await page.goto('/g/missing');
  await expect(page.getByRole('heading', { name: 'This gift isn’t here.' })).toBeVisible();
  await page.getByRole('link', { name: 'Meet Bruno instead' }).click();
  await expect(page.getByRole('button', { name: 'Open it' })).toBeVisible();
});

test('narrow and landscape screens contain all content', async ({ page }) => {
  for (const viewport of [{ width: 320, height: 568 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Open it' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});
