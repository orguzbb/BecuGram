const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function extract() {
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });

  console.log('Navigating to Telegram Web A...');
  await page.goto('https://web.telegram.org/a/', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(6000);

  const designTokens = await page.evaluate(() => {
    // Get all CSS rules
    const lightTokens = {};
    const darkTokens = {};
    const allVars = {};

    for (let sheet of document.styleSheets) {
      try {
        const rules = sheet.cssRules || sheet.rules;
        for (let rule of rules) {
          if (rule.selectorText) {
            const isDark = rule.selectorText.includes('dark') || rule.selectorText.includes('.theme-dark');
            const isLight = rule.selectorText.includes('light') || rule.selectorText.includes('.theme-light') || rule.selectorText === ':root';

            if (rule.style) {
              for (let prop of rule.style) {
                if (prop.startsWith('--')) {
                  const val = rule.style.getPropertyValue(prop).trim();
                  allVars[prop] = val;
                  if (isDark) darkTokens[prop] = val;
                  if (isLight) lightTokens[prop] = val;
                }
              }
            }
          }
        }
      } catch (e) {}
    }

    return {
      totalVars: Object.keys(allVars).length,
      allVars,
      lightTokens,
      darkTokens
    };
  });

  console.log(`Extracted ${designTokens.totalVars} design tokens from Telegram Web A!`);
  fs.writeFileSync(
    path.join(__dirname, 'telegram_tokens.json'),
    JSON.stringify(designTokens, null, 2)
  );

  await browser.close();
}

extract().catch(console.error);
