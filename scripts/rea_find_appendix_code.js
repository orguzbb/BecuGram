const fs = require('fs');
const path = require('path');
const manifest = JSON.parse(fs.readFileSync('scripts/rea_exported_scripts/manifest.json', 'utf8'));

for (const s of manifest.scripts) {
  const p = path.join('scripts/rea_exported_scripts/files', s.content.relative_path);
  const code = fs.readFileSync(p, 'utf8');

  // Search for appendix class or data-has-custom-appendix or appendix svg
  const re = /(appendix|has-appendix|custom-appendix|bubble-tail)/gi;
  let match;
  while ((match = re.exec(code)) !== null) {
    console.log('=== ' + path.basename(s.url) + ' at ' + match.index + ' ===');
    console.log(code.substring(Math.max(0, match.index - 150), Math.min(code.length, match.index + 250)).replace(/\s+/g, ' '));
  }
}
