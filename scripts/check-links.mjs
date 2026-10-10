// Checks every internal link, image, script and stylesheet reference in dist/ resolves to a file.
import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve('dist');
const base = (process.env.BASE_PATH ?? '/GoPortfolio').replace(/\/$/, '');
const site = process.env.SITE_URL ?? 'https://pewpiece.github.io';

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)],
  );
}

function resolves(p) {
  const rel = p.slice(base.length).replace(/^\//, '');
  const target = path.join(dist, rel);
  return (
    (fs.existsSync(target) && fs.statSync(target).isFile()) ||
    fs.existsSync(path.join(target, 'index.html'))
  );
}

const pages = walk(dist).filter((f) => f.endsWith('.html'));
const ids = new Map();
const idsOf = (file) => {
  if (!ids.has(file)) ids.set(file, new Set([...fs.readFileSync(file, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  return ids.get(file);
};
const broken = [];
let count = 0;
for (const file of pages) {
  const html = fs.readFileSync(file, 'utf8');
  const refs = [...html.matchAll(/\s(?:href|src|srcset)="([^"]+)"/g)].flatMap((m) =>
    m[0].includes('srcset') ? m[1].split(',').map((s) => s.trim().split(/\s+/)[0]) : [m[1]],
  );
  for (let ref of refs) {
    if (/^(mailto:|tel:|data:|javascript:)/.test(ref)) continue;
    if (ref.startsWith(site)) ref = ref.slice(site.length);
    if (/^https?:\/\//.test(ref)) continue; // external: not checked offline
    count++;
    const [pathname, hash] = ref.split('#');
    const abs = pathname ? pathname : '';
    if (abs && !abs.startsWith(base)) { broken.push(`${path.relative(dist, file)}: ${ref} (outside base ${base})`); continue; }
    if (abs && !resolves(abs)) { broken.push(`${path.relative(dist, file)}: ${ref} (no such file)`); continue; }
    if (hash) {
      const target = abs
        ? (() => { const r = abs.slice(base.length).replace(/^\//, ''); const t = path.join(dist, r); return fs.existsSync(t) && fs.statSync(t).isFile() ? t : path.join(t, 'index.html'); })()
        : file;
      if (target.endsWith('.html') && !idsOf(target).has(hash)) broken.push(`${path.relative(dist, file)}: ${ref} (no element with id "${hash}")`);
    }
  }
}
console.log(`Checked ${count} internal references across ${pages.length} pages.`);
if (broken.length) { console.error(`BROKEN (${broken.length}):\n` + broken.map((b) => '  ' + b).join('\n')); process.exit(1); }
console.log('All internal links resolve.');
