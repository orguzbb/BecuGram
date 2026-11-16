const fs = require('fs');
const path = require('path');
const manifest = JSON.parse(fs.readFileSync('scripts/rea_exported_scripts/manifest.json', 'utf8'));

for (const s of manifest.scripts) {
  const p = path.join('scripts/rea_exported_scripts/files', s.content.relative_path);
  const code = fs.readFileSync(p, 'utf8');

  // Search for class names like Message, message-list, MiddleHeader, etc.
  const classMatches = [...code.matchAll(/["']([a-zA-Z0-9_-]*(?:Message|Bubble|Composer|ChatList|MiddleHeader|LeftColumn|RightColumn)[a-zA-Z0-9_-]*)["']/g)];
  if (classMatches.length > 0) {
    const unique = [...new Set(classMatches.map(m => m[1]))].filter(x => x.length > 4);
    if (unique.length > 0) {
      console.log('=== ' + path.basename(s.url) + ' ===');
      console.log(unique.slice(0, 20).join(', '));
    }
  }
}
