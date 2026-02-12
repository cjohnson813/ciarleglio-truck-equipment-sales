/**
 * Netlify build script: writes public_html/js/config.js from API_URL env var.
 * Run from repo root: node scripts/set-api-url.js
 * Set API_URL in Netlify (e.g. https://your-app.onrender.com) so the frontend calls the right backend.
 */
const fs = require('fs');
const path = require('path');

const apiUrl = (process.env.API_URL || '').trim().replace(/\/$/, '');
const outPath = path.join(__dirname, '..', 'public_html', 'js', 'config.js');
const content =
  '// Injected by Netlify build from API_URL; other scripts fall back to http://localhost:4000 if empty.\n' +
  "window.API_BASE = " + JSON.stringify(apiUrl) + ";\n";

fs.writeFileSync(outPath, content, 'utf8');
console.log('Wrote', outPath, 'with API_BASE =', apiUrl || '(empty, scripts will use fallback)');
