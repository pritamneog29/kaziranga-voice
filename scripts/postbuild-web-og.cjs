const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const indexPath = path.join(distDir, 'index.html');
const sourceImagePath = path.join(rootDir, 'assets', 'og-kaziranga-voice.png');
const outputImagePath = path.join(distDir, 'og-kaziranga-voice.png');
const siteUrl = 'https://kazirangavoice.in';

if (!fs.existsSync(indexPath)) {
  throw new Error(`Missing built web file: ${indexPath}. Run "expo export --platform web" first.`);
}

if (!fs.existsSync(sourceImagePath)) {
  throw new Error(`Missing OG image: ${sourceImagePath}. Add the PNG before building.`);
}

let html = fs.readFileSync(indexPath, 'utf8');

const ogBlock = `  <!-- og-tags:start -->
  <meta property="og:title" content="Kaziranga Voice" />
  <meta property="og:description" content="Send your voice to protect Kaziranga’s eco-sensitive zone and wildlife corridors." />
  <meta property="og:image" content="${siteUrl}/og-kaziranga-voice.png" />
  <meta property="og:url" content="${siteUrl}" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Kaziranga Voice" />
  <meta name="twitter:description" content="Send your voice to protect Kaziranga’s eco-sensitive zone and wildlife corridors." />
  <meta name="twitter:image" content="${siteUrl}/og-kaziranga-voice.png" />
  <!-- og-tags:end -->`;

const blockRegex = /[ \t]*<!-- og-tags:start -->[\s\S]*?<!-- og-tags:end -->/m;
if (blockRegex.test(html)) {
  html = html.replace(blockRegex, ogBlock);
} else if (html.includes('</head>')) {
  html = html.replace('</head>', `${ogBlock}\n</head>`);
} else {
  throw new Error(`Could not find </head> in ${indexPath}.`);
}

fs.writeFileSync(indexPath, html, 'utf8');
fs.copyFileSync(sourceImagePath, outputImagePath);

console.log(`Injected OG tags into ${indexPath}`);
console.log(`Copied OG image to ${outputImagePath}`);
