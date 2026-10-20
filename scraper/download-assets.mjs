// Downloads images/video referenced by the site into output/assets with index.json mapping.
// Sequential, 600ms between requests, resumable (skips files that already exist).
import fs from 'fs/promises'; import path from 'path';
const OUT = '/home/user/Websites/scraper/output'; const A = path.join(OUT, 'assets');
const UA = 'AstrumRedesignScraper/1.0 (site redesign source collection; polite crawler)';
const data = JSON.parse(await fs.readFile(path.join(OUT, 'data.json'), 'utf8'));
const items = new Map();
const add = (url, info) => { const cur = items.get(url) || { url, alt: info.alt || '', pages: new Set(), sections: new Set(), role: info.role }; if (info.alt && !cur.alt) cur.alt = info.alt; cur.pages.add(info.page); if (info.section) cur.sections.add(info.section); items.set(url, cur); };
for (const p of data.pages) {
  for (const i of p.images) add(i.src, { alt: i.alt, page: p.url, section: i.section || 'hero-slideshow', role: i.src.includes('/team/') ? 'team-photo' : 'property-photo' });
  for (const v of p.videos) if (v.src) add(v.src, { page: p.url, section: 'hero/brand film', role: 'video' });
  if (p.favicon) add(p.favicon, { page: p.url, role: 'favicon/logo-mark', alt: 'Astrum favicon (A monogram)' });
}
for (let i = 0; i < 150; i++) add(`https://astrumuae.com/film/hero/${String(i).padStart(3, '0')}.jpg`, { page: 'https://astrumuae.com/', section: 'hero scroll frame-sequence (canvas, GSAP ScrollTrigger)', role: 'hero-frame' });
const index = []; const failed = [];
for (const it of items.values()) {
  const rel = decodeURIComponent(new URL(it.url).pathname).replace(/^\//, '');
  const local = path.join(A, rel);
  await fs.mkdir(path.dirname(local), { recursive: true });
  let ok = true, bytes = 0;
  try { bytes = (await fs.stat(local)).size; } catch {
    for (let t = 0; t < 3; t++) {
      try { const r = await fetch(it.url, { headers: { 'User-Agent': UA } }); if (!r.ok) throw new Error('HTTP ' + r.status); const buf = Buffer.from(await r.arrayBuffer()); await fs.writeFile(local, buf); bytes = buf.length; ok = true; break; }
      catch (e) { ok = false; if (t === 2) failed.push({ url: it.url, reason: e.message }); await new Promise(r => setTimeout(r, 2000)); }
    }
    await new Promise(r => setTimeout(r, 600));
  }
  if (ok) index.push({ url: it.url, local: 'assets/' + rel, alt: it.alt, role: it.role, pages: [...it.pages], sections: [...it.sections], bytes });
}
await fs.writeFile(path.join(A, 'index.json'), JSON.stringify({ note: 'Images/film credited to OMNIYAT (Orla, The Alba - Dorchester Collection) per /beeldbronnen.html; usage requires OMNIYAT permission. Team photos are Astrum own.', assets: index, failed }, null, 2));
console.log('downloaded', index.length, 'failed', failed);
