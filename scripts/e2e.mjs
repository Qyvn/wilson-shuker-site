// Headless browser checks (Playwright/Chromium) against `vite preview`.
// Usage: npm run build && npm run e2e
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const PORT = 4179;
const URL = `http://localhost:${PORT}/`;
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'pipe' });
await new Promise((r) => { server.stdout.on('data', (d) => String(d).includes('localhost') && r()); setTimeout(r, 8000); });

const results = [];
const check = (name, ok, info = '') => { results.push({ name, ok, info }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${info}`); };
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const rot = (page) => page.locator('.wheel-ring').getAttribute('data-rotation').then(Number);

try {
  for (const vp of [{ name: 'desktop', width: 1440, height: 900, touch: false }, { name: 'mobile', width: 375, height: 740, touch: true }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, hasTouch: vp.touch, isMobile: vp.touch });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(URL);
    await page.waitForSelector('.disc-slot');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(`${vp.name}: no horizontal overflow`, overflow <= 0, `(scrollWidth - innerWidth = ${overflow})`);
    if (vp.name === 'desktop') await page.screenshot({ path: 'screenshots/desktop-hero.png' });

    await page.locator('#music').scrollIntoViewIfNeeded();
    const stage = page.locator('.wheel-stage');
    const box = await stage.boundingBox();
    const before = await rot(page);
    // pointer drag (mouse on desktop; Playwright mouse emits pointer events of type mouse — touch emulated via pointer below)
    if (vp.touch) {
      await stage.dispatchEvent('pointerdown', { pointerId: 7, pointerType: 'touch', clientX: box.x + box.width * 0.7, clientY: box.y + 100, button: 0, isPrimary: true });
      for (let i = 1; i <= 10; i++) await stage.dispatchEvent('pointermove', { pointerId: 7, pointerType: 'touch', clientX: box.x + box.width * 0.7 - i * 20, clientY: box.y + 100, isPrimary: true });
      await stage.dispatchEvent('pointerup', { pointerId: 7, pointerType: 'touch', clientX: box.x + box.width * 0.7 - 200, clientY: box.y + 100, isPrimary: true });
    } else {
      await page.mouse.move(box.x + box.width * 0.7, box.y + 60);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.2, box.y + 60, { steps: 12 });
      await page.mouse.up();
    }
    await page.waitForTimeout(800);
    const after = await rot(page);
    check(`${vp.name}: drag rotates wheel`, Math.abs(after - before) >= 30, `(rotation ${before} -> ${after})`);
    check(`${vp.name}: wheel snaps to a CD after drag`, Math.abs(after % 60) < 0.5 || Math.abs(Math.abs(after % 60) - 60) < 0.5);

    // select via click on front disc
    await page.locator('.disc-slot.is-front').click();
    await page.waitForTimeout(900);
    const selected = await page.locator('.disc-slot.is-selected').count();
    check(`${vp.name}: click selects a CD`, selected === 1);
    const ov2 = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(`${vp.name}: no overflow after interaction`, ov2 <= 0, `(${ov2})`);
    if (vp.name === 'mobile') await page.screenshot({ path: 'screenshots/mobile-music.png', fullPage: false });
    check(`${vp.name}: no page errors`, errors.length === 0, errors.join('; '));
    await ctx.close();
  }

  // Real audio: select song-001 (45s file), play, verify it plays and stops at <= 30s.
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(URL);
  await page.locator('#music').scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: /^Placeholder One/ }).click();
  await page.waitForTimeout(900);
  await page.getByRole('button', { name: 'Play preview', exact: true }).click();
  await page.waitForTimeout(2500);
  const st1 = await page.getByTestId('status').textContent();
  check('real audio: status Playing after play', st1 === 'Playing', `(${st1})`);
  await page.screenshot({ path: 'screenshots/desktop-music-playing.png' });
  // wait in real time for the cap (file is 45s long)
  await page.waitForFunction(() => document.querySelector('[data-testid="status"]').textContent === 'Preview ended', null, { timeout: 40000 });
  const now = await page.locator('.progress').getAttribute('aria-valuenow');
  check('real audio: 45s file stopped at 30s cap', now === '30', `(aria-valuenow=${now})`);
  await page.getByRole('button', { name: /Replay/ }).click();
  await page.waitForTimeout(1500);
  check('real audio: replay plays again', (await page.getByTestId('status').textContent()) === 'Playing');
  // switch -> previous stops
  await page.getByRole('button', { name: 'Rotate to next CD' }).click();
  await page.getByRole('button', { name: /^Load/ }).click();
  await page.waitForTimeout(500);
  check('real audio: switching stops playback', (await page.getByTestId('status').textContent()) === 'Paused');
  // unavailable song
  for (let i = 0; i < 2; i++) await page.getByRole('button', { name: 'Rotate to next CD' }).click();
  await page.getByRole('button', { name: /^Load/ }).click();
  await page.waitForTimeout(500);
  check('unavailable song shows message', await page.getByText(/No preview is available/).isVisible());
  await ctx.close();

  // reduced motion
  const rctx = await browser.newContext({ viewport: { width: 1024, height: 800 }, reducedMotion: 'reduce' });
  const rp = await rctx.newPage();
  await rp.goto(URL);
  const reducedClass = await rp.locator('.wheel-stage.reduced').count();
  check('reduced motion: wheel uses no-transition mode', reducedClass === 1);
  await rp.getByRole('button', { name: 'Rotate to next CD' }).click();
  check('reduced motion: buttons still rotate', (await rot(rp)) !== 0);
  await rctx.close();
} finally {
  await browser.close();
  server.kill();
}
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
