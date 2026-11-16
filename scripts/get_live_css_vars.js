const { chromium } = require('playwright');
const fs = require('fs');

async function main() {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const contexts = browser.contexts();
  const pages = contexts[0].pages();
  const page = pages.find(p => p.url().includes('telegram.org')) || pages[0];

  const cssVars = await page.evaluate(() => {
    const styleSheets = Array.from(document.styleSheets);
    const vars = {};
    for (const sheet of styleSheets) {
      try {
        for (const rule of Array.from(sheet.cssRules || [])) {
          if (rule.selectorText === ':root' || rule.selectorText === 'body' || rule.selectorText === 'html') {
            const text = rule.cssText;
            const matches = text.matchAll(/(--[a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g);
            for (const m of matches) {
              vars[m[1]] = m[2].trim();
            }
          }
        }
      } catch (e) {}
    }

    // Also get all inline styles or computed styles starting with --
    const computed = window.getComputedStyle(document.documentElement);
    for (let i = 0; i < computed.length; i++) {
      const prop = computed[i];
      if (prop.startsWith('--')) {
        vars[prop] = computed.getPropertyValue(prop).trim();
      }
    }

    return vars;
  });

  fs.writeFileSync('scripts/telegram_live_css_vars.json', JSON.stringify(cssVars, null, 2), 'utf8');
  console.log('Total live CSS variables extracted:', Object.keys(cssVars).length);
  for (const [k, v] of Object.entries(cssVars).slice(0, 30)) {
    console.log(k + ': ' + v);
  }
}

main().catch(err => console.error(err));
