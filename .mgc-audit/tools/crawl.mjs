// Credit-free BFS crawler for mgcglobalconsulting.com. GET only; never POSTs forms.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const OUT = path.dirname(new URL(import.meta.url).pathname);
const HOSTS = new Set(['mgcglobalconsulting.com', 'www.mgcglobalconsulting.com']);
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128 Safari/537.36 MGC-audit';
const EXCLUDE = [/^\/\.netlify\/functions\//]; // never hit function endpoints

const seeds = JSON.parse(fs.readFileSync(path.join(OUT, 'seeds.json'), 'utf8'));

function norm(u) {
  try {
    const x = new URL(u, 'https://mgcglobalconsulting.com/');
    if (!HOSTS.has(x.hostname)) return null;
    x.hostname = 'mgcglobalconsulting.com';
    x.protocol = 'https:';
    x.hash = '';
    if (x.pathname === '') x.pathname = '/';
    return x.toString();
  } catch { return null; }
}

const decode = s => (s || '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#x27;/g, "'").replace(/&mdash;/g, '—').replace(/&ndash;/g, '–').replace(/&middot;/g, '·');
const strip = s => decode(s.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const attr = (tag, name) => { const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i')); return m ? decode(m[2] ?? m[3] ?? m[4] ?? '') : null; };

function parse(html, base) {
  const body = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
  const metas = [...html.matchAll(/<meta\b[^>]*>/gi)].map(m => m[0]);
  const metaBy = k => { const t = metas.find(m => (attr(m, 'name') || attr(m, 'property') || '').toLowerCase() === k); return t ? attr(t, 'content') : null; };
  const links = [...html.matchAll(/<link\b[^>]*>/gi)].map(m => m[0]);
  const canon = links.find(l => (attr(l, 'rel') || '').toLowerCase() === 'canonical');
  const heads = [...body.matchAll(/<(h[1-3])\b[^>]*>([\s\S]*?)<\/\1>/gi)].map(m => `${m[1].toLowerCase()}: ${strip(m[2]).slice(0, 140)}`);
  const anchors = [...body.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map(m => ({ href: attr('<a ' + m[1] + '>', 'href'), text: strip(m[2]).slice(0, 80), aria: attr('<a ' + m[1] + '>', 'aria-label') }));
  // also hrefs inside scripts (window.location, onclick) for discovery
  const scriptHrefs = [...html.matchAll(/(?:href|location(?:\.href)?)\s*=\s*['"]([^'"#][^'"]*)['"]/gi)].map(m => m[1]);
  const imgs = [...body.matchAll(/<img\b[^>]*>/gi)].map(m => ({ src: attr(m[0], 'src'), alt: attr(m[0], 'alt'), w: attr(m[0], 'width'), h: attr(m[0], 'height'), loading: attr(m[0], 'loading') }));
  const vids = [...body.matchAll(/<video\b([^>]*)>([\s\S]*?)<\/video>/gi)].map(m => ({ attrs: m[1].trim().replace(/\s+/g, ' ').slice(0, 200), sources: [...m[2].matchAll(/src\s*=\s*["']([^"']+)/gi)].map(s => s[1]).concat(attr('<v ' + m[1] + '>', 'src') || []) }));
  const iframes = [...body.matchAll(/<iframe\b[^>]*>/gi)].map(m => ({ src: attr(m[0], 'src'), title: attr(m[0], 'title') }));
  const forms = [...body.matchAll(/<form\b([^>]*)>([\s\S]*?)<\/form>/gi)].map(m => {
    const ft = '<f ' + m[1] + '>';
    const inner = m[2];
    const ids = new Set([...inner.matchAll(/<label\b[^>]*for\s*=\s*["']([^"']+)/gi)].map(x => x[1]));
    const fields = [...inner.matchAll(/<(input|select|textarea)\b[^>]*>/gi)].map(x => x[0]).filter(t => !/type\s*=\s*["']?(hidden|submit|button)/i.test(t));
    const unlabeled = fields.filter(t => { const id = attr(t, 'id'); return !(id && ids.has(id)) && !attr(t, 'aria-label') && !attr(t, 'aria-labelledby'); }).map(t => attr(t, 'name') || attr(t, 'id') || attr(t, 'placeholder') || '?');
    return { id: attr(ft, 'id'), action: attr(ft, 'action'), method: attr(ft, 'method'), fields: fields.length, unlabeled };
  });
  const text = strip(html);
  const phones = [...new Set([...text.matchAll(/(?:\+?1[\s.-]?)?\(?\b\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/g)].map(m => m[0].trim()))];
  const telLinks = [...new Set(anchors.filter(a => a.href && a.href.startsWith('tel:')).map(a => a.href))];
  const emails = [...new Set([...html.matchAll(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g)].map(m => m[0].toLowerCase()))].filter(e => !/\.(png|jpe?g|webp|svg|gif)$/.test(e));
  const htmlTag = html.match(/<html\b[^>]*>/i);
  return {
    lang: htmlTag ? attr(htmlTag[0], 'lang') : null,
    title: (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]?.trim().replace(/\s+/g, ' ') ?? null,
    description: metaBy('description'),
    robots: metaBy('robots'),
    viewport: metaBy('viewport'),
    ogTitle: metaBy('og:title'), ogImage: metaBy('og:image'), ogUrl: metaBy('og:url'),
    canonical: canon ? attr(canon, 'href') : null,
    jsonld: (html.match(/application\/ld\+json/gi) || []).length,
    headings: heads,
    h1count: heads.filter(h => h.startsWith('h1')).length,
    anchors, scriptHrefs, imgs, vids, iframes, forms, phones, telLinks, emails,
    words: text.split(' ').length,
    sha: crypto.createHash('sha1').update(text).digest('hex').slice(0, 12),
  };
}

async function fetchChain(url) {
  const chain = [];
  let cur = url;
  for (let i = 0; i < 8; i++) {
    const r = await fetch(cur, { redirect: 'manual', headers: { 'user-agent': UA } });
    const loc = r.headers.get('location');
    chain.push({ url: cur, status: r.status });
    if (r.status >= 300 && r.status < 400 && loc) { cur = new URL(loc, cur).toString(); continue; }
    const ct = r.headers.get('content-type') || '';
    const buf = ct.includes('html') ? await r.text() : null;
    if (!buf) await r.arrayBuffer().catch(() => {});
    return { chain, final: cur, status: r.status, ct, html: buf, xrobots: r.headers.get('x-robots-tag'), len: Number(r.headers.get('content-length')) || (buf ? buf.length : null) };
  }
  return { chain, final: cur, status: 'redirect-loop' };
}

const queue = [...new Set(seeds.map(norm).filter(Boolean))];
const seen = new Set(queue);
const pages = {};
const assets = new Set();
const external = new Set();
fs.mkdirSync(path.join(OUT, 'html'), { recursive: true });

while (queue.length) {
  const batch = queue.splice(0, 6);
  await Promise.all(batch.map(async u => {
    const p = new URL(u).pathname;
    if (EXCLUDE.some(r => r.test(p))) { pages[u] = { excluded: 'function endpoint' }; return; }
    try {
      const r = await fetchChain(u);
      const rec = { status: r.status, final: r.final, chain: r.chain.length > 1 ? r.chain.map(c => `${c.status} ${c.url}`) : undefined, ct: r.ct, xrobots: r.xrobots, bytes: r.len };
      if (r.html) {
        const fn = crypto.createHash('sha1').update(u).digest('hex').slice(0, 10) + '.html';
        fs.writeFileSync(path.join(OUT, 'html', fn), r.html);
        rec.file = fn;
        Object.assign(rec, parse(r.html, r.final));
        if (r.status === 200 && new URL(r.final).hostname.endsWith('mgcglobalconsulting.com')) {
          const hrefs = rec.anchors.map(a => a.href).concat(rec.scriptHrefs).filter(Boolean);
          for (const h of hrefs) {
            if (/^(mailto|tel|javascript|sms|data):/i.test(h)) continue;
            let abs; try { abs = new URL(h, r.final); } catch { continue; }
            if (!/^https?:$/.test(abs.protocol)) continue;
            if (!HOSTS.has(abs.hostname)) { external.add(abs.origin + abs.pathname); continue; }
            const n = norm(abs.toString());
            if (/\.(png|jpe?g|webp|gif|svg|mp4|webm|mov|pdf|css|js|ico|woff2?)$/i.test(new URL(n).pathname)) { assets.add(n); continue; }
            if (!seen.has(n)) { seen.add(n); queue.push(n); }
          }
          for (const i of rec.imgs) if (i.src && !i.src.startsWith('data:')) { const n = norm(i.src); if (n) assets.add(n); }
          for (const v of rec.vids) for (const s of v.sources) { const n = norm(s); if (n) assets.add(n); }
        }
      }
      pages[u] = rec;
    } catch (e) { pages[u] = { status: 'error', error: String(e.message || e) }; }
  }));
}

// asset checks (HEAD, fall back to GET range)
const assetRes = {};
const al = [...assets];
for (let i = 0; i < al.length; i += 8) {
  await Promise.all(al.slice(i, i + 8).map(async a => {
    try {
      let r = await fetch(a, { method: 'HEAD', headers: { 'user-agent': UA } });
      assetRes[a] = { status: r.status, bytes: Number(r.headers.get('content-length')) || null, ct: r.headers.get('content-type') };
    } catch (e) { assetRes[a] = { status: 'error', error: String(e.message) }; }
  }));
}

fs.writeFileSync(path.join(OUT, 'pages.json'), JSON.stringify(pages, null, 1));
fs.writeFileSync(path.join(OUT, 'assets.json'), JSON.stringify(assetRes, null, 1));
fs.writeFileSync(path.join(OUT, 'external.json'), JSON.stringify([...external].sort(), null, 1));
console.log('pages', Object.keys(pages).length, 'assets', al.length, 'external', external.size);
