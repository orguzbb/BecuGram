const fs = require('fs');
const path = require('path');
const manifest = JSON.parse(fs.readFileSync('scripts/rea_exported_scripts/manifest.json', 'utf8'));

function findSnippets(filename, regex, limit = 6) {
  const item = manifest.scripts.find(s => s.url.includes(filename));
  if (!item) {
    console.log('Not found:', filename);
    return;
  }
  const p = path.join('scripts/rea_exported_scripts/files', item.content.relative_path);
  const content = fs.readFileSync(p, 'utf8');
  let match;
  let count = 0;
  console.log('=== ' + filename + ' matches for ' + regex + ' ===');
  while ((match = regex.exec(content)) !== null && count < limit) {
    const start = Math.max(0, match.index - 100);
    const end = Math.min(content.length, match.index + match[0].length + 100);
    console.log('[' + (count + 1) + '] ...' + content.substring(start, end).replace(/\s+/g, ' ') + '...');
    count++;
  }
}

findSnippets('fallback-DWPtSCi9.js', /tail/gi, 10);
findSnippets('fallback-DWPtSCi9.js', /class(Name)?:\s*"[^"]*message[^"]*"/gi, 10);
findSnippets('InputText-Tenhrs74.js', /tail/gi, 6);
findSnippets('InputText-Tenhrs74.js', /composer/gi, 6);
findSnippets('colors-BYwPMJZr.js', /var\(--/g, 10);
