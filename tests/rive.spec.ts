import { test, expect } from '@playwright/test';
import { brunoStateMap, BrunoStateDriver, requiredInputs, validateInputs } from '../src/lib/rive/brunoStateMap';
import { MouthEnvelope } from '../src/lib/audio/mouthEnvelope';
import { timeline } from '../src/experiences/BrunoThinkingOfYou/timeline';
import { installAudio } from './helpers/audio';

test('every phase has the correct declarative Rive action and entry-only triggers', () => {
  const expectedTriggers = { capPeek: 'peekTrigger', eyesRise: 'riseTrigger', paw: 'pawTrigger', reaction: 'winkTrigger', wave: 'waveTrigger', wink: 'winkTrigger', turn: 'turnTrigger', depart: 'departTrigger' };
  const phases = ['idle', ...timeline.map(step => step.id), 'cta'] as const;
  expect(Object.keys(brunoStateMap).sort()).toEqual([...phases].sort());
  const fired: string[] = [];
  const types = { boolean: 59, number: 56, trigger: 58 };
  const list = Object.entries(requiredInputs).map(([name, kind]) => ({ name, type: types[kind], value: 0 as number | boolean, fire: () => fired.push(name) }));
  const inputs = validateInputs(list, types)!;
  const driver = new BrunoStateDriver(inputs);
  for (const phase of phases) {
    expect(brunoStateMap[phase]).toEqual({
      showBruno: !['idle', 'opening', 'knock1', 'knock2', 'knock3', 'cta'].includes(phase),
      talking: ['recognition', 'introduction', 'message', 'exit'].includes(phase),
      ...phase in expectedTriggers ? { trigger: expectedTriggers[phase as keyof typeof expectedTriggers] } : {},
    });
    driver.apply(phase, false); driver.apply(phase, true); driver.apply(phase, false);
    driver.mouth(2, phase, false);
    expect(inputs.mouthOpen.value).toBe(brunoStateMap[phase].talking ? 1 : 0);
  }
  expect(fired).toEqual(Object.values(expectedTriggers));
  driver.apply('idle', false); driver.apply('capPeek', false);
  expect(fired.at(-1)).toBe('peekTrigger');
  expect(validateInputs(list.slice(1), types)).toBeNull();
  expect(validateInputs(list.map(input => ({ ...input, type: 0 })), types)).toBeNull();
});

test('mouth envelope normalizes, smooths attack/release and settles at rest', () => {
  const quiet = new MouthEnvelope(); const loud = new MouthEnvelope();
  const sample = (amplitude: number) => new Float32Array(512).fill(amplitude);
  expect(quiet.update(sample(0), 16)).toBe(0);
  expect(loud.update(sample(.16), 16)).toBeGreaterThan(quiet.update(sample(.03), 16));
  const peak = loud.value;
  const release = loud.update(sample(0), 16);
  expect(release).toBeGreaterThan(0); expect(release).toBeLessThan(peak);
  for (let i = 0; i < 100; i++) loud.update(sample(0), 16);
  expect(loud.value).toBe(0);
  for (let i = 0; i < 100; i++) expect(loud.update(sample(2), 16)).toBeLessThanOrEqual(1);
});

test('missing Rive keeps PNG, speech, captions, replay and CTA operational', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.route('**/rive/bruno/bruno.riv', route => route.fulfill({ status: 404, body: '' }));
  await installAudio(page, .1);
  await page.clock.install();
  await page.goto('/g/bruno-thinking-of-you');
  await page.getByRole('button', { name: 'Open it' }).click();
  for (let i = 0; i < 42; i++) await page.clock.runFor(1000);
  await expect(page.getByRole('button', { name: 'Send Bruno to Someone' })).toBeVisible();
  await expect(page.locator('[data-bruno-renderer]')).toHaveAttribute('data-bruno-renderer', 'png');
  expect(await page.evaluate(() => (window as unknown as { audioStats: { ended: number } }).audioStats.ended)).toBe(4);
  await page.getByRole('button', { name: 'Replay' }).click();
  await expect(page.locator('main')).toHaveAttribute('data-phase', 'idle');
  expect(errors).toEqual([]);
});

for (const scenario of ['missing-input', 'wrong-type', 'wrong-artboard']) {
  test(`invalid Rive contract (${scenario}) falls back without page errors`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    // Only the injected test runtime consumes this marker; never a shipped .riv.
    await page.route('**/rive/bruno/bruno.riv', route => route.fulfill({ body: 'RIVE-test-double' }));
    await page.goto(`http://127.0.0.1:4174/tests/harness/index.html?scenario=${scenario}`);
    await expect(page.locator('[data-renderer="rive"]')).toHaveCount(0);
    await expect(page.locator('[data-bruno-renderer]')).toHaveAttribute('data-bruno-renderer', 'png');
    await page.getByRole('button', { name: 'message', exact: true }).click();
    await expect(page.locator('.character-art')).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('validated runtime hands off once, freezes inputs on pause, replays and restores PNG on failure', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.route('**/rive/bruno/bruno.riv', route => route.fulfill({ body: 'RIVE-test-double' }));
  await page.goto('http://127.0.0.1:4174/tests/harness/index.html');
  await expect(page.locator('[data-bruno-renderer]')).toHaveAttribute('data-bruno-renderer', 'rive');
  await expect(page.locator('.png-renderer')).toBeHidden();
  await page.getByRole('button', { name: 'capPeek', exact: true }).click();
  await page.getByRole('button', { name: 'pause toggle' }).click();
  await page.getByRole('button', { name: 'pause toggle' }).click();
  expect(await page.evaluate(() => (window as unknown as { riveStats: { triggers: string[] } }).riveStats.triggers)).toEqual(['peekTrigger']);
  await page.getByRole('button', { name: 'message', exact: true }).click();
  await page.evaluate(() => {
    const driver = (window as unknown as { mouthDriver: { start(node: unknown): void } }).mouthDriver;
    driver.start({ fftSize: 512, getFloatTimeDomainData(samples: Float32Array) { samples.fill(.12); } });
  });
  await expect.poll(() => page.evaluate(() => (window as unknown as { riveStats: { values: { mouthOpen: number } } }).riveStats.values.mouthOpen)).toBeGreaterThan(.1);
  await page.getByRole('button', { name: 'pause toggle' }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { riveStats: { values: { mouthOpen: number } } }).riveStats.values.mouthOpen)).toBe(0);
  await page.getByRole('button', { name: 'pause toggle' }).click();
  await page.evaluate(() => (window as unknown as { mouthDriver: { stop(): void } }).mouthDriver.stop());
  await expect.poll(() => page.evaluate(() => (window as unknown as { riveStats: { values: { mouthOpen: number } } }).riveStats.values.mouthOpen)).toBe(0);
  await page.getByRole('button', { name: 'idle', exact: true }).click();
  await page.getByRole('button', { name: 'capPeek', exact: true }).click();
  expect(await page.evaluate(() => (window as unknown as { riveStats: { created: number } }).riveStats.created)).toBe(1);
  await page.evaluate(() => (window as unknown as { failRive(): void }).failRive());
  await expect(page.locator('[data-bruno-renderer]')).toHaveAttribute('data-bruno-renderer', 'png');
  await expect(page.locator('.character-art')).toBeVisible();
});

test('late runtime readiness waits for replay and reduced motion always retains PNG', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.route('**/rive/bruno/bruno.riv', route => route.fulfill({ body: 'RIVE-test-double' }));
  await page.goto('http://127.0.0.1:4174/tests/harness/index.html?scenario=late');
  await page.getByRole('button', { name: 'message', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { riveStats: { values: Record<string, unknown> } }).riveStats.values.showBruno)).toBe(false);
  await expect(page.locator('[data-bruno-renderer]')).toHaveAttribute('data-bruno-renderer', 'png');
  await page.getByRole('button', { name: 'idle', exact: true }).click();
  await expect(page.locator('[data-bruno-renderer]')).toHaveAttribute('data-bruno-renderer', 'rive');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('[data-bruno-renderer]')).toHaveAttribute('data-bruno-renderer', 'png');
  await expect(page.locator('[data-renderer="rive"]')).toHaveCount(0);
});

test('actual BRUNOJI speech drives the mouth before mute gain and closes on stop', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.route('**/rive/bruno/bruno.riv', route => route.fulfill({ body: 'RIVE-test-double' }));
  await page.goto('http://127.0.0.1:4174/tests/harness/index.html');
  await expect(page.locator('[data-bruno-renderer]')).toHaveAttribute('data-bruno-renderer', 'rive');
  const mouth = () => page.evaluate(() => (window as unknown as { riveStats: { values: { mouthOpen: number } } }).riveStats.values.mouthOpen);
  await page.getByRole('button', { name: 'mute audio', exact: true }).click();
  await page.getByRole('button', { name: 'real speech', exact: true }).click();
  await expect.poll(mouth).toBeGreaterThan(.05);
  await page.getByRole('button', { name: 'stop audio', exact: true }).click();
  await expect.poll(mouth).toBe(0);
  await page.getByRole('button', { name: 'real speech', exact: true }).click();
  await expect.poll(mouth).toBeGreaterThan(.05);
  await expect.poll(mouth, { timeout: 7000 }).toBe(0);
});

test('speaking layout preserves caption and control space at all required sizes', async ({ page }) => {
  await installAudio(page, .1);
  await page.clock.install();
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 412, height: 915 }, { width: 1280, height: 720 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.getByRole('button', { name: 'Open it' }).click();
    await expect(page.locator('main')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
    for (const step of timeline) {
      if (step.id === 'message') break;
      await page.clock.runFor(step.duration);
    }
    await expect(page.locator('main')).toHaveAttribute('data-phase', 'message');
    const character = await page.locator('.character-layer').boundingBox();
    const caption = await page.locator('.dialogue').boundingBox();
    const controls = await page.locator('.playback-controls').boundingBox();
    expect(character!.y + character!.height).toBeLessThanOrEqual(caption!.y);
    expect(caption!.y + caption!.height).toBeLessThanOrEqual(controls!.y);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
