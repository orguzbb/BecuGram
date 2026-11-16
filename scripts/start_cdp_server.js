const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--remote-debugging-port=9222', '--no-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  console.log('Navigating to https://web.telegram.org/a/ ...');
  await page.goto('https://web.telegram.org/a/', { waitUntil: 'domcontentloaded', timeout: 45000 });
  console.log('Telegram Web A loaded. Page title:', await page.title());

  // Keep alive for CDP connections
  console.log('Browser ready for REA CDP inspection on http://127.0.0.1:9222');
  await new Promise(() => {}); // stay alive
})();
