const { chromium } = require('playwright');
const fs = require('fs');

async function main() {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const contexts = browser.contexts();
  const pages = contexts[0].pages();
  const page = pages.find(p => p.url().includes('telegram.org')) || pages[0];

  console.log('Connected to page:', await page.title(), page.url());

  // Evaluate the live DOM of Telegram Web A
  const inspection = await page.evaluate(() => {
    // Collect all loaded stylesheets and rules
    const allRules = [];
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        for (const rule of Array.from(sheet.cssRules || [])) {
          if (rule.selectorText && (
            rule.selectorText.includes('Message') ||
            rule.selectorText.includes('bubble') ||
            rule.selectorText.includes('chat') ||
            rule.selectorText.includes('composer') ||
            rule.selectorText.includes('sidebar') ||
            rule.selectorText.includes('middle') ||
            rule.selectorText.includes('avatar') ||
            rule.selectorText.includes('ListItem') ||
            rule.selectorText.includes('badge') ||
            rule.selectorText.includes('input')
          )) {
            allRules.push(rule.cssText);
          }
        }
      } catch (e) {
        // cross-origin stylesheet
      }
    }

    // Inspect body computed styles
    const bodyStyles = window.getComputedStyle(document.body);
    const bodyInfo = {
      fontFamily: bodyStyles.fontFamily,
      fontSize: bodyStyles.fontSize,
      backgroundColor: bodyStyles.backgroundColor,
      color: bodyStyles.color
    };

    // Find main container nodes
    const rootEl = document.getElementById('root') || document.body;
    const structure = [];
    function scanNode(el, depth = 0) {
      if (depth > 5) return;
      structure.push({
        depth,
        tag: el.tagName,
        id: el.id,
        className: typeof el.className === 'string' ? el.className : '',
        computedWidth: el.offsetWidth,
        computedHeight: el.offsetHeight
      });
      for (const child of Array.from(el.children)) {
        scanNode(child, depth + 1);
      }
    }
    scanNode(rootEl, 0);

    return {
      bodyInfo,
      sampleRules: allRules.slice(0, 100),
      structure: structure.slice(0, 60)
    };
  });

  fs.writeFileSync('scripts/live_telegram_inspection.json', JSON.stringify(inspection, null, 2), 'utf8');
  console.log('Saved inspection with', inspection.sampleRules.length, 'CSS rules and', inspection.structure.length, 'DOM structure nodes.');
  console.log('Body Info:', inspection.bodyInfo);
  console.log('Top structure:');
  for (const s of inspection.structure.slice(0, 15)) {
    console.log('  '.repeat(s.depth) + s.tag + (s.id ? '#' + s.id : '') + (s.className ? '.' + s.className.split(' ').join('.') : '') + ' [' + s.computedWidth + 'x' + s.computedHeight + ']');
  }
}

main().catch(err => console.error(err));
