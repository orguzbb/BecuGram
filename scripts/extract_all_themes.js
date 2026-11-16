const { chromium } = require('playwright');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function extractAllThemes() {
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('https://web.telegram.org/a/', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(4000);

  const themeRules = await page.evaluate(() => {
    const results = [];
    for (let sheet of document.styleSheets) {
      try {
        for (let rule of sheet.cssRules || sheet.rules) {
          if (rule.style && rule.style.getPropertyValue('--color-background')) {
            results.push({
              selector: rule.selectorText,
              bg: rule.style.getPropertyValue('--color-background'),
              bgSecondary: rule.style.getPropertyValue('--color-background-secondary'),
              bgOwn: rule.style.getPropertyValue('--color-background-own'),
              text: rule.style.getPropertyValue('--color-text'),
              textSecondary: rule.style.getPropertyValue('--color-text-secondary'),
              chatActive: rule.style.getPropertyValue('--color-chat-active'),
              chatHover: rule.style.getPropertyValue('--color-chat-hover'),
              primary: rule.style.getPropertyValue('--color-primary')
            });
          }
        }
      } catch (e) {}
    }
    return results;
  });

  console.log('Theme rules:', JSON.stringify(themeRules, null, 2));
  await browser.close();
}

extractAllThemes().catch(console.error);
