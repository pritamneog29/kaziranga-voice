const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const publicDir = path.join(rootDir, 'public');
const indexPath = path.join(distDir, 'index.html');
const appPath = path.join(distDir, 'app.html');
const appDir = path.join(distDir, 'app');
const appIndexPath = path.join(appDir, 'index.html');
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
  <title>Kaziranga Voice (kazirangavoice.in)</title>
  <meta property="og:title" content="Kaziranga Voice (kazirangavoice.in)" />
  <meta property="og:description" content="Send your voice to protect Kaziranga's eco-sensitive zone and wildlife corridors." />
  <meta property="og:image" content="${siteUrl}/og-kaziranga-voice.png" />
  <meta property="og:url" content="${siteUrl}" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Kaziranga Voice (kazirangavoice.in)" />
  <meta name="twitter:description" content="Send your voice to protect Kaziranga's eco-sensitive zone and wildlife corridors." />
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

// Save React app as app.html instead of index.html
fs.writeFileSync(appPath, html, 'utf8');
fs.mkdirSync(appDir, { recursive: true });
fs.writeFileSync(appIndexPath, html, 'utf8');
fs.copyFileSync(sourceImagePath, outputImagePath);

console.log(`Saved React app to ${appPath}`);
console.log(`Saved React app to ${appIndexPath}`);
console.log(`Injected OG tags into ${appPath}`);
console.log(`Copied OG image to ${outputImagePath}`);

// Copy policy files from public/ into dist/
const policyFiles = ['privacy-policy.html', 'terms-of-service.html'];
for (const file of policyFiles) {
  const srcPath = path.join(publicDir, file);
  const destPath = path.join(distDir, file);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied ${file} to ${destPath}`);
  }
}

// Copy and inject Firebase config into landing page
const landingPageSrc = path.join(publicDir, 'landing-index.html');
const landingPageDest = indexPath;
if (fs.existsSync(landingPageSrc)) {
  let landingHtml = fs.readFileSync(landingPageSrc, 'utf8');
  
  // Inject the same Firebase config used by the app bundle.
  const firebaseConfig = {
    apiKey: 'AIzaSyA1qE6J4bk-1vOWBrsbljFVGD_L4Z14T8A',
    authDomain: 'kaziranga-voice.firebaseapp.com',
    projectId: 'kaziranga-voice',
    storageBucket: 'kaziranga-voice.firebasestorage.app',
    messagingSenderId: '886924812961',
    appId: '1:886924812961:web:94870384fb981f84b986e0',
    measurementId: 'G-X0KGHM820L',
  };
  
  const configStr = JSON.stringify(firebaseConfig);
  landingHtml = landingHtml.replace('__FIREBASE_CONFIG__', configStr);
  
  fs.writeFileSync(landingPageDest, landingHtml, 'utf8');
  console.log(`Copied landing page to ${landingPageDest} (root index.html)`);
} else {
  throw new Error(`Landing page not found at ${landingPageSrc}`);
}

console.log('Build complete: landing page at / and React app at /app plus /app.html');
