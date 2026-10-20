// Astrum (astrumuae.com) scraper: renders pages with Playwright, extracts content,
// brand info, images, screenshots. Polite: sequential, ~800ms between requests.
import { createRequire } from 'module';
import fs from 'fs/promises';
import path from 'path';
const require = createRequire('/opt/node-tools/node_modules/');
const { chromium } = require('playwright');

const BASE = 'https://astrumuae.com';
const OUT = '/home/user/Websites/scraper/output';
const UA = 'AstrumRedesignScraper/1.0 (site redesign source collection; polite crawler)';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const START = ['/', '/beeldbronnen.html'];
for (const d of ['pages', 'assets', 'screenshots']) await fs.mkdir(path.join(OUT, d), { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, userAgent: UA });
const page = await ctx.newPage();
const mediaUrls = new Set();
page.on('response', r => { const t = r.request().resourceType(); if (['image', 'media', 'font'].includes(t)) mediaUrls.add(r.url()); });

const norm = u => { const x = new URL(u, BASE); x.hash = ''; for (const k of [...x.searchParams.keys()]) if (/^(utm_|fbclid|gclid)/.test(k)) x.searchParams.delete(k); return x.href; };
const queue = START.map(p => norm(BASE + p)); const seen = new Set(queue);
const results = [];
const failures = [];

async function autoScroll() {
  await page.evaluate(async () => {
    const h = () => document.documentElement.scrollHeight;
    for (let y = 0; y < h(); y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(800);
}

while (queue.length) {
  const url = queue.shift();
  try {
    const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
    const status = resp?.status();
    if (status >= 400) { failures.push({ url, reason: 'HTTP ' + status }); continue; }
    await autoScroll();
    const data = await page.evaluate(() => {
      const abs = u => u ? new URL(u, location.href).href : null;
      const vis = el => { const s = getComputedStyle(el); return s.display !== 'none' && s.visibility !== 'hidden' && !el.closest('[hidden]'); };
      const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => ({ level: +h.tagName[1], text: h.innerText.trim() })).filter(h => h.text);
      const ctas = [...document.querySelectorAll('a,button')].map(e => ({ tag: e.tagName.toLowerCase(), text: e.innerText.replace(/\s+/g, ' ').trim(), href: e.getAttribute('href') ? abs(e.getAttribute('href')) : null, ariaLabel: e.getAttribute('aria-label'), inModal: !!e.closest('[role=dialog]'), section: e.closest('section,header,footer,nav')?.id || e.closest('section,header,footer,nav')?.tagName.toLowerCase() || null }));
      const images = [...document.querySelectorAll('img')].map(i => ({ src: i.currentSrc || abs(i.getAttribute('src')), srcset: i.getAttribute('srcset'), alt: i.getAttribute('alt'), width: i.naturalWidth, height: i.naturalHeight, section: i.closest('section,header,footer')?.id || null }));
      const bgImages = [...document.querySelectorAll('*')].map(e => [e, getComputedStyle(e).backgroundImage]).filter(([, b]) => b && b.includes('url(')).map(([e, b]) => ({ src: abs(b.match(/url\(["']?([^"')]+)/)[1]), alt: e.getAttribute('aria-label') || null, type: 'background', section: e.closest('section,header,footer')?.id || null }));
      const videos = [...document.querySelectorAll('video')].map(v => ({ src: abs(v.currentSrc || v.getAttribute('src') || v.querySelector('source')?.getAttribute('src')), poster: abs(v.getAttribute('poster')), autoplay: v.autoplay, muted: v.muted, loop: v.loop }));
      const forms = [...document.querySelectorAll('form')].map(f => ({ name: f.getAttribute('name'), hiddenNetlifyStub: f.hidden, method: f.getAttribute('method'), action: f.getAttribute('action'), netlify: f.hasAttribute('data-netlify') || f.hasAttribute('netlify'), inModal: !!f.closest('[role=dialog]'), fields: [...f.querySelectorAll('input,textarea,select')].map(i => ({ tag: i.tagName.toLowerCase(), name: i.name, type: i.type, required: i.required, placeholder: i.placeholder || null, label: (i.closest('label,fieldset')?.querySelector('span,legend')?.innerText || i.labels?.[0]?.innerText || '').trim() || null, options: i.tagName === 'SELECT' ? [...i.options].map(o => o.text) : (i.type === 'radio' || i.type === 'checkbox') ? i.value : undefined })), buttons: [...f.querySelectorAll('button')].map(b => b.innerText.trim()) }));
      // Markdown of main content (skip nav, footer, hidden, dialogs, forms' honeypot)
      const root = document.querySelector('main') || document.body;
      const lines = [];
      const skip = el => el.matches('nav,footer,header > nav,script,style,noscript,svg,[hidden],[aria-hidden=true],[role=dialog]') || el.closest('[role=dialog]') || !vis(el);
      const inline = el => el.innerText.replace(/\s+/g, ' ').trim();
      const walk = el => {
        for (const c of el.children) {
          if (skip(c)) continue;
          const t = c.tagName;
          if (/^H[1-6]$/.test(t)) { const x = inline(c); if (x) lines.push('\n' + '#'.repeat(+t[1]) + ' ' + x + '\n'); }
          else if (t === 'P' || t === 'BLOCKQUOTE') { const x = inline(c); if (x) lines.push((t === 'BLOCKQUOTE' ? '> ' : '') + x + '\n'); }
          else if (t === 'LI') { const x = inline(c); if (x) lines.push('- ' + x); }
          else if (t === 'IMG') { lines.push(`![${c.alt || ''}](${c.currentSrc || c.src})\n`); }
          else if (t === 'A' && !c.querySelector('h1,h2,h3,p')) { const x = inline(c); if (x) lines.push(`[${x}](${c.href})\n`); }
          else if (t === 'BUTTON') { const x = inline(c); if (x && x.length > 2) lines.push(`[Knop: ${x}]\n`); }
          else if (t === 'LABEL' && c.querySelector('input[name=bot-field]')) continue;
          else if (c.children.length === 0) { const x = inline(c); if (x) lines.push(x + '\n'); }
          else walk(c);
        }
      };
      walk(root);
      const cs = getComputedStyle(document.body);
      return { title: document.title, lang: document.documentElement.lang, metaDescription: document.querySelector('meta[name=description]')?.content || null, themeColor: document.querySelector('meta[name=theme-color]')?.content || null, favicon: abs(document.querySelector('link[rel~=icon]')?.getAttribute('href')), sectionIds: [...document.querySelectorAll('[id]')].map(e => e.id), headings, bodyText: document.body.innerText, markdown: lines.join('\n').replace(/\n{3,}/g, '\n\n').trim(), ctas, images, bgImages, videos, forms, bodyFont: cs.fontFamily, bodyColor: cs.color, bodyBg: cs.backgroundColor };
    });
    // internal links
    const links = await page.$$eval('a[href]', as => as.map(a => a.href));
    for (const l of links) { try { const u = new URL(l); if (u.hostname.replace(/^www\./, '') === 'astrumuae.com' && /^https?:/.test(u.protocol)) { const n = norm(l); if (!seen.has(n)) { seen.add(n); queue.push(n); } } } catch {} }
    const p = new URL(url).pathname;
    const slug = p === '/' ? 'index' : p.replace(/^\//, '').replace(/\.html$/, '').replace(/\//g, '_');
    await fs.writeFile(path.join(OUT, 'pages', slug + '.md'), `---\nurl: ${url}\ntitle: ${data.title}\ndescription: ${data.metaDescription || ''}\n---\n\n${data.markdown}\n`);
    await page.screenshot({ path: path.join(OUT, 'screenshots', `${slug}-1440.png`), fullPage: true });
    results.push({ url, status, slug, ...data });
    console.log('OK', url, status);
  } catch (e) { failures.push({ url, reason: e.message }); console.log('FAIL', url, e.message); }
  await sleep(800);
}

// Homepage extras: modal form, carousel steps, mobile screenshot, computed brand styles
await page.goto(BASE + '/', { waitUntil: 'networkidle' }); await autoScroll();
const styles = await page.evaluate(() => {
  const pick = sel => { const e = document.querySelector(sel); if (!e) return null; const s = getComputedStyle(e); return { selector: sel, fontFamily: s.fontFamily, fontSize: s.fontSize, fontWeight: s.fontWeight, letterSpacing: s.letterSpacing, textTransform: s.textTransform, lineHeight: s.lineHeight, color: s.color, background: s.backgroundColor, borderRadius: s.borderRadius }; };
  const root = getComputedStyle(document.documentElement);
  const vars = {}; for (const v of ['--cream', '--gold', '--ink', '--sand', '--stone', '--line', '--line-light', '--serif', '--sans', '--gutter']) vars[v] = root.getPropertyValue(v).trim();
  const colorCount = {};
  for (const e of document.querySelectorAll('body *')) { const s = getComputedStyle(e); for (const c of [s.color, s.backgroundColor, s.borderTopColor]) if (c && c !== 'rgba(0, 0, 0, 0)') colorCount[c] = (colorCount[c] || 0) + 1; }
  const sections = [...document.querySelectorAll('section,header,footer')].map(s => ({ id: s.id || null, tag: s.tagName.toLowerCase(), cls: s.className, bg: getComputedStyle(s).backgroundColor, color: getComputedStyle(s).color }));
  return { cssVariables: vars, elements: ['body', 'h1', 'h2', 'h3', 'p', 'nav a', 'button', 'header button', '.updates-submit', 'footer'].map(pick).filter(Boolean), colorUsage: Object.entries(colorCount).sort((a, b) => b[1] - a[1]).slice(0, 20), sections, fontsLoaded: [...document.fonts].filter(f => f.status === 'loaded').map(f => `${f.family} ${f.weight} ${f.style}`) };
});
// Logo: inline svg / brand mark in header
const logo = await page.evaluate(() => { const a = document.querySelector('a[href="#top"]'); return a ? { html: a.innerHTML.slice(0, 5000), text: a.innerText, fontFamily: getComputedStyle(a).fontFamily, letterSpacing: getComputedStyle(a).letterSpacing } : null; });
// Open "Plan een gesprek" modal
let modal = null;
try {
  await page.locator('header button', { hasText: /plan een gesprek/i }).first().click();
  await page.waitForSelector('[role=dialog]', { state: 'visible', timeout: 5000 });
  await page.waitForTimeout(800);
  modal = await page.evaluate(() => { const d = document.querySelector('[role=dialog]'); return { text: d.innerText, html: d.outerHTML.length, fields: [...d.querySelectorAll('input,textarea,select')].map(i => ({ tag: i.tagName.toLowerCase(), name: i.name, type: i.type, required: i.required, placeholder: i.placeholder || null, label: (i.closest('label,fieldset')?.querySelector('span,legend')?.innerText || '').trim() || null, value: (i.type === 'radio' || i.type === 'checkbox') ? i.value : undefined })), links: [...d.querySelectorAll('a')].map(a => ({ text: a.innerText, href: a.href })) }; });
  await page.screenshot({ path: path.join(OUT, 'screenshots', 'index-modal-kennismaking-1440.png') });
  await page.keyboard.press('Escape');
} catch (e) { failures.push({ url: BASE + '/#modal', reason: 'modal: ' + e.message }); }
// Viewport screenshots of the hero and each section
await page.goto(BASE + '/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
await page.screenshot({ path: path.join(OUT, 'screenshots', 'index-hero-viewport-1440.png') });
for (const id of ['diensten', 'werkwijze', 'updates', 'over', 'team', 'blog', 'contact']) {
  const el = await page.$('#' + id); if (!el) continue;
  await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(1200);
  try { await el.screenshot({ path: path.join(OUT, 'screenshots', `section-${id}-1440.png`) }); } catch {}
}
// Mobile screenshot
const m = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: UA, isMobile: true });
const mp = await m.newPage(); await mp.goto(BASE + '/', { waitUntil: 'networkidle' });
await mp.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } window.scrollTo(0, 0); });
await mp.waitForTimeout(800); await mp.screenshot({ path: path.join(OUT, 'screenshots', 'index-mobile-390.png'), fullPage: true });
await m.close();

await fs.writeFile(path.join(OUT, 'data.json'), JSON.stringify({ scrapedAt: new Date().toISOString(), pages: results.map(({ markdown, ...r }) => r), homepageModal: modal, failures }, null, 2));
await fs.writeFile(path.join(OUT, 'raw-extras.json'), JSON.stringify({ styles, logo, modal, mediaUrlsSeen: [...mediaUrls] }, null, 2));
await browser.close();
console.log('pages', results.length, 'failures', failures);
