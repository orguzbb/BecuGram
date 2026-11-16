const fs = require('fs');
const path = require('path');
const manifest = JSON.parse(fs.readFileSync('scripts/rea_exported_scripts/manifest.json', 'utf8'));

for (const s of manifest.scripts) {
  const p = path.join('scripts/rea_exported_scripts/files', s.content.relative_path);
  const code = fs.readFileSync(p, 'utf8');

  const matches = [...code.matchAll(/`M\s*[-0-9.][^`]+`/g)];
  if (matches.length > 0) {
    console.log(path.basename(s.url), 'has template literal paths:', matches.length);
    for (const m of matches.slice(0, 5)) {
      console.log('Path:', m[0].substring(0, 100));
    }
  }
}
