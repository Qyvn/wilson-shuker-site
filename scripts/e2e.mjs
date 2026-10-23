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
    await page.waitForTimeout(300);
    await page.screenshot({ path: `screenshots/${vp.name}-hero.png` });

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
    const step = 360 / (await page.locator('.disc-slot').count());
    const rem = Math.abs(after % step);
    check(`${vp.name}: wheel snaps to a CD after drag`, rem < 0.5 || Math.abs(rem - step) < 0.5, `(step ${step})`);

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
  await page.getByRole('button', { name: /^Feel-A/ }).click();
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
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Rotate to next CD' }).click();
  await page.getByRole('button', { name: /^Load/ }).click();
  await page.waitForTimeout(500);
  check('unavailable song shows message', await page.getByText(/No preview is available/).isVisible());
  await ctx.close();


  // ---- New features (mobile width) ----
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
    await page.goto(URL);
    // Vault disc
    await page.getByRole('button', { name: /locked vault disc/ }).focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(800);
    check('vault: panel shows locked state with countdown', (await page.getByRole('timer').count()) === 1 && /Locked until/.test(await page.getByTestId('vault-state').textContent()));
    check('vault: example label visible', await page.getByText(/EXAMPLE placeholder/).isVisible());
    check('vault: no signup without endpoint', (await page.getByTestId('vault-signup').count()) === 0);
    await page.getByTestId('vault-panel').scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'screenshots/mobile-vault.png' });
    // Mixtape
    await page.locator('#mixtape').scrollIntoViewIfNeeded();
    for (const t of ['Hold Tight', 'Feel-A', 'Emotional Song']) await page.getByRole('button', { name: `Add ${t} to mixtape` }).click();
    await page.getByRole('button', { name: 'Move Feel-A up' }).click();
    await page.getByLabel('Name your tape').fill('Sunday drive');
    await page.locator('.swatch', { hasText: 'Shirt blue' }).click();
    await page.getByRole('button', { name: 'Copy link' }).click();
    await page.waitForTimeout(300);
    const copiedOk = await page.getByText('Link copied!').count();
    const link = await page.getByTestId('mixtape-link').getAttribute('href');
    check('mixtape: link generated with order + name + colour', /mixtape=1/.test(link) && /s=feel-a%2Chold-tight%2Cemotional-song/.test(link) && /c=blue/.test(link) && /t=Sunday\+drive/.test(link), link);
    check('mixtape: copy link reports result', copiedOk === 1 || (await page.getByText(/Couldn’t copy/).count()) === 1);
    await page.locator('.mix-tape-area').scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'screenshots/mobile-mixtape.png' });
    const ov = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check('mobile: no overflow with new sections', ov <= 0, `(${ov})`);
    // Shared view
    await page.goto(link);
    await page.waitForSelector('[data-testid="shared-mixtape"]');
    check('shared mixtape: shows title', (await page.locator('#shared-mix-title').textContent()) === 'Sunday drive');
    await page.getByRole('button', { name: /Play mixtape/ }).click();
    await page.waitForTimeout(2000);
    const st = await page.getByTestId('mix-status').textContent();
    check('shared mixtape: plays first track for real', /1\. Feel-A: playing/.test(st), st);
    await page.screenshot({ path: 'screenshots/mobile-shared-mixtape.png' });
    // Tour
    await page.goto(URL + '#tour');
    await page.locator('#tour').scrollIntoViewIfNeeded();
    check('tour: example event shown', await page.getByText('EXAMPLE event: not a real show').isVisible());
    check('tour: coming-soon button disabled, no pay button', (await page.getByTestId('tickets-soon').isDisabled()) && (await page.getByRole('button', { name: /Paystack/ }).count()) === 0);
    const psLoaded = await page.evaluate(() => !!document.querySelector('script[src*="paystack"]'));
    check('tour: Paystack script not loaded without key', !psLoaded);
    await page.getByTestId('event-example-show').scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'screenshots/mobile-tickets.png' });
    check('features: no page errors', errs.length === 0, errs.join('; '));
    await ctx.close();
  }

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
