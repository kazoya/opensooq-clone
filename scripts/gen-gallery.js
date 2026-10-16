// node scripts/gen-gallery.js -> client/public/demo/<slug>-2.svg and -3.svg (extra gallery views for demo ads; own artwork)
const fs = require('fs'); const path = require('path');
const seed = require('../server/seed-data'); const out = path.join(__dirname, '..', 'client', 'public', 'demo');
const pal = [['#1e3a5f', '#0b1622', '#fb8c4a'], ['#3f1d38', '#120a10', '#f9a8d4'], ['#14332a', '#06140e', '#86efac'], ['#3b2f14', '#140f05', '#fde68a']];
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
seed.ads.forEach(([slug, , , , label], i) => {
  for (const n of [2, 3]) {
    const [a, b, c] = pal[(i + n) % pal.length];
    const shape = n === 2
      ? `<circle cx="400" cy="270" r="120" fill="none" stroke="${c}" stroke-width="10"/><circle cx="400" cy="270" r="40" fill="${c}" opacity=".6"/>`
      : `<path d="M260 360 L400 160 L540 360 Z" fill="none" stroke="${c}" stroke-width="10" stroke-linejoin="round"/>`;
    fs.writeFileSync(path.join(out, `${slug}-${n}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" role="img" aria-label="${esc(label)} ${n}/3">
<defs><linearGradient id="g" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
<rect width="800" height="600" fill="url(#g)"/>${shape}
<text x="400" y="520" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="36" font-weight="700" fill="#fff">${esc(label)} · ${n}/3</text></svg>`);
  }
});
console.log(seed.ads.length * 2, 'gallery svgs');
