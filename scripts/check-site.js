const fs = require('node:fs');

const html = fs.readFileSync('index.html', 'utf8');
const javascript = fs.readFileSync('script.js', 'utf8');
const forbidden = [
  ['link vuoti', /href=["']#["']/i],
  ['Spotify', /spotify/i],
  ['Apple Podcasts', /apple podcasts/i],
  ['chiavi API Google', /AIza[\w-]+/],
  ['RSS2JSON', /rss2json/i]
];

const failures = forbidden
  .filter(([, pattern]) => pattern.test(`${html}\n${javascript}`))
  .map(([label]) => label);

for (const asset of ['assets/logo.png', 'assets/hero-bg.png', 'assets/chiara.jpg', 'assets/earbuds-cutout.png']) {
  if (!fs.existsSync(asset)) failures.push(`risorsa mancante: ${asset}`);
}

if (failures.length) {
  console.error(`Controlli falliti: ${failures.join(', ')}`);
  process.exit(1);
}

console.log('Controlli del sito superati.');
