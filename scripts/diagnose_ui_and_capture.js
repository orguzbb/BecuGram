const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\488a2d5f-72c4-43de-a15c-abbf8d7ca837\\diagnostics';

if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

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

async function inspectViewport(browser, name, width, height) {
  const ctx = await browser.newContext({ viewport: { width, height } });
  const page = await ctx.newPage();

  await page.addInitScript(({ token, user }) => {
    localStorage.setItem('becugram_token', token);
    localStorage.setItem('becugram_user', JSON.stringify(user));
    localStorage.setItem('auth-storage', JSON.stringify({ state: { token, user, isAuthenticated: true }, version: 0 }));
  }, { token: adminToken, user: adminUser });

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Check overflow issues
  const overflowElements = await page.evaluate(() => {
    const issues = [];
    document.querySelectorAll('*').forEach((el) => {
      if (el.scrollWidth > el.clientWidth && el.clientWidth > 0 && !['HTML', 'BODY'].includes(el.tagName)) {
        const style = window.getComputedStyle(el);
        if (style.overflowX !== 'auto' && style.overflowX !== 'scroll') {
          issues.push({
            tag: el.tagName,
            id: el.id,
            className: typeof el.className === 'string' ? el.className.substring(0, 80) : '',
            scrollWidth: el.scrollWidth,
            clientWidth: el.clientWidth,
          });
        }
      }
    });
    return issues.slice(0, 10);
  });

  console.log(`[${name} ${width}x${height}] Overflow issues found:`, overflowElements.length);
  if (overflowElements.length > 0) {
    console.log(overflowElements);
  }

  // Click on the first chat to view conversation
  const chatItem = await page.$('.chat-item-clickable, [class*="chat-item"], div[class*="rounded-xl"][class*="cursor-pointer"]');
  if (chatItem) {
    await chatItem.click();
    await page.waitForTimeout(1000);
  }

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, `${name}_chat.png`) });
  console.log(`Saved screenshot: ${name}_chat.png`);

  await ctx.close();
}

async function main() {
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    await inspectViewport(browser, 'desktop_1440', 1440, 900);
    await inspectViewport(browser, 'laptop_1280', 1280, 800);
    await inspectViewport(browser, 'tablet_768', 768, 1024);
    await inspectViewport(browser, 'mobile_390', 390, 844);
    await inspectViewport(browser, 'mobile_360', 360, 740);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
