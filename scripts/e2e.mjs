// Headless browser checks (Playwright/Chromium) against `vite preview`.
// Usage: npm run build && npm run e2e
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const PORT = 4179;
const URL = process.env.BASE_URL ?? `http://localhost:${PORT}/`;
const server = process.env.BASE_URL ? null : spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'pipe' });
if (server) await new Promise((r) => { server.stdout.on('data', (d) => String(d).includes('localhost') && r()); setTimeout(r, 8000); });

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

  // Real Apple previews on desktop + mobile: play, check time advances from real media events, no media errors.
  for (const vp of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'mobile', width: 390, height: 844, isMobile: true, hasTouch: true }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, hasTouch: vp.hasTouch });
    const page = await ctx.newPage();
    const mediaFails = [];
    page.on('requestfailed', (r) => { if (/itunes|mzstatic/.test(r.url()) && !/ABORTED/.test(r.failure()?.errorText ?? '')) mediaFails.push(r.url() + ' ' + r.failure()?.errorText); });
    page.on('response', (r) => { if (/itunes|mzstatic/.test(r.url()) && r.status() >= 400) mediaFails.push(`${r.status()} ${r.url()}`); });
    await page.goto(URL);
    const val = () => page.locator('.progress').getAttribute('aria-valuenow').then(Number);
    for (const title of ['Feel-A', 'Nsimbi Yamahumusha']) {
      await page.locator('#music').scrollIntoViewIfNeeded();
      while (!(await page.locator('.wheel-caption').textContent()).includes(title)) await page.getByRole('button', { name: 'Rotate to next CD' }).click();
      await page.getByRole('button', { name: /^Load/ }).click();
      await page.waitForTimeout(900);
      check(`${vp.name} ${title}: no autoplay`, (await page.getByTestId('status').textContent()) === 'Paused');
      check(`${vp.name} ${title}: Apple credit link`, /music\.apple\.com/.test(await page.getByTestId('preview-credit').locator('a').getAttribute('href')));
      await page.getByRole('button', { name: 'Play preview', exact: true }).click();
      await page.waitForFunction(() => Number(document.querySelector('.progress').getAttribute('aria-valuenow')) >= 2, null, { timeout: 15000 }).catch(() => {});
      const t1 = await val(); await page.waitForTimeout(2000); const t2 = await val();
      const st = await page.getByTestId('status').textContent();
      check(`${vp.name} ${title}: real audio plays, currentTime advances`, st === 'Playing' && t2 > t1 && t1 >= 1, `(${st}, ${t1}s -> ${t2}s)`);
      check(`${vp.name} ${title}: no media error`, (await page.getByRole('alert').count()) === 0);
      if (title === 'Feel-A') await page.screenshot({ path: `screenshots/${vp.name}-real-preview-playing.png` });
      await page.getByRole('button', { name: 'Pause preview' }).click();
    }
    check(`${vp.name}: Apple media/artwork requests OK`, mediaFails.length === 0, mediaFails.join(', '));
    // YouTube fallback (click-to-load)
    while (!(await page.locator('.wheel-caption').textContent()).includes('Hold Tight')) await page.getByRole('button', { name: 'Rotate to next CD' }).click();
    await page.getByRole('button', { name: /^Load/ }).click();
    await page.waitForTimeout(500);
    check(`${vp.name}: no-preview song says unavailable`, (await page.getByTestId('status').textContent()) === 'Preview unavailable');
    await page.getByRole('button', { name: /Load official video/ }).click();
    check(`${vp.name}: YouTube embed loads on request`, /youtube-nocookie\.com\/embed\/Y2zcUAX5l2I/.test(await page.locator('.embed-fallback iframe').getAttribute('src')));
    await ctx.close();
  }
  // 30s cap with a real Apple preview (desktop)
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(URL);
    await page.getByRole('button', { name: /^Feel-A/ }).click();
    await page.waitForTimeout(900);
    await page.getByRole('button', { name: 'Play preview', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('[data-testid="status"]').textContent === 'Preview ended', null, { timeout: 45000 });
    const now = Number(await page.locator('.progress').getAttribute('aria-valuenow'));
    check('real audio: preview ends at or before the 30s cap', now <= 30 && now >= 25, `(${now})`);
    await page.getByRole('button', { name: /Replay/ }).click();
    await page.waitForTimeout(2000);
    check('real audio: replay plays again', (await page.getByTestId('status').textContent()) === 'Playing');
    await ctx.close();
  }

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
  server?.kill();
}
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
