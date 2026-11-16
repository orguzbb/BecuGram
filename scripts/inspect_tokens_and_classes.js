const fs = require('fs');
const path = require('path');
const manifest = JSON.parse(fs.readFileSync('scripts/rea_exported_scripts/manifest.json', 'utf8'));

const s = manifest.scripts.find(s => s.url.includes('InputText-Tenhrs74.js'));
const p = path.join('scripts/rea_exported_scripts/files', s.content.relative_path);
const code = fs.readFileSync(p, 'utf8');

const regex = /["'](--color-[a-z0-9-]+)["']:\s*\[\s*`?([^`,\]]+)`?\s*,\s*`?([^`,\]]+)`?\s*\]/g;
let m;
const tokens = {};
while ((m = regex.exec(code)) !== null) {
  tokens[m[1]] = {
    light: m[2].trim(),
    dark: m[3].trim()
  };
}

fs.writeFileSync('scripts/telegram_color_tokens.json', JSON.stringify(tokens, null, 2), 'utf8');
console.log('Saved', Object.keys(tokens).length, 'tokens to scripts/telegram_color_tokens.json');
