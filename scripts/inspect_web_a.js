const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function main() {
  const screenshotDir = path.join(__dirname, '..', 'audit_screenshots', 'phase4_6');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();

  console.log('Navigating to https://web.telegram.org/a/ ...');
  let webAStyles = {};
  let webATitle = '';
  try {
    const res = await page.goto('https://web.telegram.org/a/', { waitUntil: 'domcontentloaded', timeout: 45000 });
    webATitle = await page.title();
    console.log(`Telegram Web A loaded. Title: ${webATitle}`);
    await page.waitForTimeout(6000);
    await page.screenshot({ path: path.join(screenshotDir, 'telegram_initial.png') });

    // Inspect styles and DOM
    webAStyles = await page.evaluate(() => {
      const body = document.body;
      const computedBody = window.getComputedStyle(body);
      const rootStyles = window.getComputedStyle(document.documentElement);
      
      // Look for common Telegram Web A classes and CSS variables
      const cssVars = {};
      for (let i = 0; i < document.styleSheets.length; i++) {
        try {
          const sheet = document.styleSheets[i];
          const rules = sheet.cssRules || sheet.rules;
          for (let j = 0; j < rules.length; j++) {
            const rule = rules[j];
            if (rule.style) {
              for (let k = 0; k < rule.style.length; k++) {
                const prop = rule.style[k];
                if (prop.startsWith('--')) {
                  cssVars[prop] = rule.style.getPropertyValue(prop).trim();
                }
              }
            }
          }
        } catch (e) {}
      }

      const elements = Array.from(document.querySelectorAll('*')).slice(0, 30).map(el => ({
        tag: el.tagName,
        id: el.id,
        className: el.className,
        computedFont: window.getComputedStyle(el).fontFamily,
        computedBg: window.getComputedStyle(el).backgroundColor,
        computedColor: window.getComputedStyle(el).color
      }));

      return {
        bodyBg: computedBody.backgroundColor,
        bodyColor: computedBody.color,
        bodyFont: computedBody.fontFamily,
        cssVarsCount: Object.keys(cssVars).length,
        sampleCssVars: Object.fromEntries(Object.entries(cssVars).slice(0, 50)),
        elementsSample: elements.slice(0, 10),
        htmlContentLength: document.documentElement.outerHTML.length
      };
    });
    console.log('Telegram Web A extracted styles:', JSON.stringify(webAStyles, null, 2));
  } catch (err) {
    console.error('Error loading Telegram Web A:', err.message);
  }

  console.log('Navigating to http://localhost:5173/ ...');
  try {
    const { signAccessToken } = require('../server/dist/utils/jwt.js');
    const adminToken = signAccessToken({
      userId: '6af0a01a7d27b76a8fee65f8',
      username: 'admin',
      role: 'admin',
    });
    const adminUser = {
      _id: '6af0a01a7d27b76a8fee65f8',
      phoneNumber: '+998889008081',
      displayName: 'Admin',
      username: 'admin',
      avatar: '/uploads/images/1794157660529_b161afc1f3c88198d553a8425bced12a.jpg',
      bio: "BecuGram a'zosi 🚀",
      isOnline: true,
      isVerified: true,
      role: 'admin',
      isProfileComplete: true,
      createdAt: '2026-11-08T16:15:22.907Z',
    };

    const becuContext = await browser.newContext({
      viewport: { width: 1440, height: 900 }
    });
    const becuPage = await becuContext.newPage();
    await becuPage.addInitScript(({ token, user }) => {
      localStorage.setItem('becugram_token', token);
      localStorage.setItem('auth-storage', JSON.stringify({ state: { token, user, isAuthenticated: true }, version: 0 }));
    }, { token: adminToken, user: adminUser });

    await becuPage.goto('http://localhost:5173/', { waitUntil: 'load', timeout: 15000 });
    await becuPage.waitForTimeout(3000);
    await becuPage.screenshot({ path: path.join(screenshotDir, 'becugram_main.png') });
    console.log('Saved becugram_main.png');
    
    // Select first conversation if present
    const firstChat = await becuPage.$('.chat-item, div[role="button"], div[class*="cursor-pointer"]');
    if (firstChat) {
      await firstChat.click();
      await becuPage.waitForTimeout(1500);
      await becuPage.screenshot({ path: path.join(screenshotDir, 'becugram_chat.png') });
      console.log('Saved becugram_chat.png');
    }
  } catch (err) {
    console.error('Error loading local BecuGram:', err.message);
  }

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
