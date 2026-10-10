// Runs axe on every built page in light and dark, checks horizontal overflow at 320/768/1440,
// keyboard focus visibility, and reduced-motion. Needs `npm run preview` running (PREVIEW_URL).
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const origin = process.env.PREVIEW_URL ?? 'http://localhost:4321';
const base = (process.env.BASE_PATH ?? '/GoPortfolio').replace(/\/$/, '');
const pages = ['/', '/apps/toolbelt/', '/apps/golesync/', '/apps/rago-lens/', '/how-i-build/', '/thanks/', '/credits/', '/404.html'];
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? '/opt/pw-browsers/chromium' });
let failures = 0;

for (const theme of ['light', 'dark']) {
  const ctx = await browser.newContext({ colorScheme: theme, viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  for (const p of pages) {
    await page.goto(`${origin}${base}${p}`);
    await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze();
    console.log(`axe [${theme}] ${p}: ${r.violations.length} violations, ${r.passes.length} rules passed`);
    for (const v of r.violations) { failures++; console.log(`  - ${v.id} (${v.impact}): ${v.help} -> ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`); }
  }
  await ctx.close();
}

for (const w of [320, 768, 1440]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
  const page = await ctx.newPage();
  for (const p of pages) {
    await page.goto(`${origin}${base}${p}`);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    console.log(`overflow @${w}px ${p}: ${over > 0 ? 'HORIZONTAL SCROLL +' + over + 'px' : 'none'}`);
    if (over > 0) failures++;
  }
  await ctx.close();
}

{ // keyboard: first Tab reaches the skip link, every tab stop has a visible focus outline
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${origin}${base}/`);
  const stops = [];
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press('Tab');
    stops.push(await page.evaluate(() => {
      const e = document.activeElement; const s = getComputedStyle(e);
      return { name: (e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 28), outline: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2 };
    }));
  }
  console.log('keyboard tab order:', stops.map((s) => s.name).join(' > '));
  const bad = stops.filter((s) => !s.outline);
  console.log(`keyboard: first stop "${stops[0].name}", ${bad.length} stops without a visible focus outline`);
  if (stops[0].name !== 'Skip to main content' || bad.length) failures++;
  await ctx.close();
}

{ // reduced motion: the tag animation must be off
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(`${origin}${base}/`);
  const name = await page.evaluate(() => getComputedStyle(document.querySelector('.tag')).animationName);
  console.log(`reduced motion: .tag animation-name = ${name}`);
  if (name !== 'none') failures++;
  const ctx2 = await browser.newContext({ reducedMotion: 'no-preference' });
  const p2 = await ctx2.newPage();
  await p2.goto(`${origin}${base}/`);
  console.log(`no preference: .tag animation-name = ${await p2.evaluate(() => getComputedStyle(document.querySelector('.tag')).animationName)}`);
}

{ // theme persistence without flash: set dark, reload, read attribute before scripts run
  const ctx = await browser.newContext({ colorScheme: 'light' });
  const page = await ctx.newPage();
  await page.goto(`${origin}${base}/`);
  await page.click('[data-set="dark"]');
  await page.reload();
  const t = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  console.log(`theme saved: data-theme=${t}, body background=${bg}`);
  if (t !== 'dark') failures++;
}

await browser.close();
console.log(failures ? `\nFAILED: ${failures} problem(s)` : '\nAll accessibility and layout checks passed.');
process.exit(failures ? 1 : 0);
