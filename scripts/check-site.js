const fs = require('node:fs');

const html = fs.readFileSync('index.html', 'utf8');
const javascript = fs.readFileSync('script.js', 'utf8');
const forbidden = [
  ['link vuoti', /href=["']#["']/i],
  ['chiavi API Google', /AIza[\w-]+/],
  ['RSS2JSON', /rss2json/i]
];

const failures = forbidden
  .filter(([, pattern]) => pattern.test(`${html}\n${javascript}`))
  .map(([label]) => label);

const requiredListeningPlatforms = [
  ['Spotify', /podcasters\.spotify\.com\/pod\/show\/call-me-mamma8/i],
  ['Amazon Music', /music\.amazon\.it\/podcasts\/ee7b8ac8-a2b2-4ef5-aaa1-84f648aa963b/i],
  ['Apple Podcasts', /podcasts\.apple\.com\/it\/podcast\/call-me-mamma\/id6806308823/i]
];

for (const [label, pattern] of requiredListeningPlatforms) {
  if (!pattern.test(html)) failures.push(`piattaforma di ascolto mancante: ${label}`);
}

for (const asset of ['assets/logo.png', 'assets/hero-bg.png', 'assets/chiara.jpg', 'assets/single-earbud.png']) {
  if (!fs.existsSync(asset)) failures.push(`risorsa mancante: ${asset}`);
}

if (failures.length) {
  console.error(`Controlli falliti: ${failures.join(', ')}`);
  process.exit(1);
}

console.log('Controlli del sito superati.');
