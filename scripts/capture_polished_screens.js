const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\488a2d5f-72c4-43de-a15c-abbf8d7ca837\\polished';

if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

const { signAccessToken } = require('../server/dist/utils/jwt.js');
const adminToken = signAccessToken({ userId: '6af0a01a7d27b76a8fee65f8', username: 'admin', role: 'admin' });
const adminUser = {
  _id: '6af0a01a7d27b76a8fee65f8', phoneNumber: '+998889008081', displayName: 'Admin', username: 'admin',
  avatar: '/uploads/images/1794157660529_b161afc1f3c88198d553a8425bced12a.jpg', bio: "BecuGram a'zosi 🚀",
  isOnline: true, isVerified: true, role: 'admin', isProfileComplete: true, createdAt: '2026-11-08T16:15:22.907Z',
};

async function captureScreen(browser, name, width, height, theme = 'dark') {
  const ctx = await browser.newContext({ viewport: { width, height } });
  const p = await ctx.newPage();

  await p.addInitScript(({ token, user, themeMode }) => {
    localStorage.setItem('becugram_token', token);
    localStorage.setItem('becugram_user', JSON.stringify(user));
    localStorage.setItem('becugram_theme', themeMode);
    localStorage.setItem('auth-storage', JSON.stringify({ state: { token, user, isAuthenticated: true }, version: 0 }));
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, { token: adminToken, user: adminUser, themeMode: theme });

  await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(600);

  // Click explicitly on Saqlanganlar chat
  const chatItem = p.locator('text=Saqlanganlar').first();
  if (await chatItem.isVisible()) {
    await chatItem.click();
    await p.waitForTimeout(1000);
  }

  const destPath = path.join(ARTIFACTS_DIR, `${name}.png`);
  await p.screenshot({ path: destPath });
  console.log(`Saved: ${name}.png`);
  await ctx.close();
}

async function captureListOnly(browser, name, width, height, theme = 'dark') {
  const ctx = await browser.newContext({ viewport: { width, height } });
  const p = await ctx.newPage();

  await p.addInitScript(({ token, user, themeMode }) => {
    localStorage.setItem('becugram_token', token);
    localStorage.setItem('becugram_user', JSON.stringify(user));
    localStorage.setItem('becugram_theme', themeMode);
    localStorage.setItem('auth-storage', JSON.stringify({ state: { token, user, isAuthenticated: true }, version: 0 }));
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, { token: adminToken, user: adminUser, themeMode: theme });

  await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(600);

  const destPath = path.join(ARTIFACTS_DIR, `${name}.png`);
  await p.screenshot({ path: destPath });
  console.log(`Saved: ${name}.png`);
  await ctx.close();
}

async function main() {
  const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });
  try {
    // 1. Desktop Dark active chat
    await captureScreen(browser, '01_desktop_dark_chat', 1440, 900, 'dark');
    // 2. Desktop Light active chat
    await captureScreen(browser, '02_desktop_light_chat', 1440, 900, 'light');
    // 3. Mobile Dark chat list
    await captureListOnly(browser, '03_mobile_dark_list', 390, 844, 'dark');
    // 4. Mobile Dark active chat
    await captureScreen(browser, '04_mobile_dark_chat', 390, 844, 'dark');
    // 5. Mobile Light active chat
    await captureScreen(browser, '05_mobile_light_chat', 390, 844, 'light');
    // 6. Mobile 360 small screen active chat
    await captureScreen(browser, '06_mobile_360_small_chat', 360, 740, 'dark');
  } finally {
    await browser.close();
  }
  console.log('All polished screens captured!');
}

main().catch(console.error);
