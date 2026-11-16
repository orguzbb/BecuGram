const fs = require('fs');
const path = require('path');
const manifest = JSON.parse(fs.readFileSync('scripts/rea_exported_scripts/manifest.json', 'utf8'));

for (const s of manifest.scripts) {
  const p = path.join('scripts/rea_exported_scripts/files', s.content.relative_path);
  const code = fs.readFileSync(p, 'utf8');

  // Look for SVG path d="..." or path definitions
  const paths = [...code.matchAll(/d=["']([M][0-9., -]+[a-zA-Z0-9., -]+)["']/g)];
  if (paths.length > 0) {
    console.log('--- ' + path.basename(s.url) + ' has ' + paths.length + ' paths ---');
    for (const p of paths.slice(0, 10)) {
      if (p[1].length < 150) {
        console.log('Path:', p[1]);
      }
    }
  }
}
