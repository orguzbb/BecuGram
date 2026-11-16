const { chromium } = require('playwright');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function extractLight() {
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('https://web.telegram.org/a/', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(4000);

  const tokens = await page.evaluate(() => {
    // Find all css rules in all stylesheets that have .theme-light or :root
    const light = {};
    for (let sheet of document.styleSheets) {
      try {
        for (let rule of sheet.cssRules || sheet.rules) {
          if (rule.selectorText && (rule.selectorText.includes('.theme-light') || rule.selectorText.includes(':root'))) {
            for (let prop of rule.style) {
              if (prop.startsWith('--color-') || prop.startsWith('--border-radius-') || prop.startsWith('--composer-')) {
                light[prop] = rule.style.getPropertyValue(prop).trim();
              }
            }
          }
        }
      } catch (e) {}
    }
    return light;
  });

  console.log('Light theme tokens count:', Object.keys(tokens).length);
  console.log(JSON.stringify(tokens, null, 2));
  await browser.close();
}

extractLight().catch(console.error);
