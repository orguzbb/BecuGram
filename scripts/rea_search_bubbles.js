const fs = require('fs');
const path = require('path');
const manifest = JSON.parse(fs.readFileSync('scripts/rea_exported_scripts/manifest.json', 'utf8'));

// We want to find message bubble DOM classes, SVG tails, and layout rules
for (const s of manifest.scripts) {
  const p = path.join('scripts/rea_exported_scripts/files', s.content.relative_path);
  const code = fs.readFileSync(p, 'utf8');

  // search for tail SVG or tail class
  const matches = [...code.matchAll(/(?:has-tail|bubble-tail|tail-container|svg-tail|Message\.module|message-date|message-content)[^"'{};]*/g)];
  if (matches.length > 0) {
    console.log('--- ' + path.basename(s.url) + ' ---');
    for (const m of matches.slice(0, 10)) {
      console.log('Match:', m[0].substring(0, 120));
    }
  }
}
