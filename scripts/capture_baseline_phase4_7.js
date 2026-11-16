const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BEFORE_DIR = path.join(__dirname, '..', 'audit_screenshots', 'phase4_7', 'before');
const ARTIFACTS_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\488a2d5f-72c4-43de-a15c-abbf8d7ca837';

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

async function run() {
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // 1. Desktop Light
  const contextLight = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const pageLight = await contextLight.newPage();
  await pageLight.addInitScript(({ token, user }) => {
    localStorage.setItem('becugram_token', token);
    localStorage.setItem('becugram_user', JSON.stringify(user));
    localStorage.setItem('auth-storage', JSON.stringify({ state: { token, user, isAuthenticated: true }, version: 0 }));
    localStorage.setItem('becugram_theme', 'light');
    localStorage.setItem('becugram_accent', '#3390EC');
  }, { token: adminToken, user: adminUser });

  await pageLight.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 20000 });
  await pageLight.waitForTimeout(1500);
  await pageLight.screenshot({ path: path.join(BEFORE_DIR, 'before_main_desktop.png') });

  const chatRow = pageLight.locator('div[class*="rounded-xl"][class*="cursor-pointer"]').first();
  if (await chatRow.count() > 0) {
    await chatRow.click();
    await pageLight.waitForTimeout(1000);
    await pageLight.screenshot({ path: path.join(BEFORE_DIR, 'before_chat_desktop.png') });
  }

  await pageLight.close();
  await contextLight.close();

  // 2. Desktop Dark
  const contextDark = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const pageDark = await contextDark.newPage();
  await pageDark.addInitScript(({ token, user }) => {
    localStorage.setItem('becugram_token', token);
    localStorage.setItem('becugram_user', JSON.stringify(user));
    localStorage.setItem('auth-storage', JSON.stringify({ state: { token, user, isAuthenticated: true }, version: 0 }));
    localStorage.setItem('becugram_theme', 'dark');
    localStorage.setItem('becugram_accent', '#8774E1');
  }, { token: adminToken, user: adminUser });

  await pageDark.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 20000 });
  await pageDark.waitForTimeout(1500);
  const chatRowDark = pageDark.locator('div[class*="rounded-xl"][class*="cursor-pointer"]').first();
  if (await chatRowDark.count() > 0) {
    await chatRowDark.click();
    await pageDark.waitForTimeout(1000);
  }
  await pageDark.screenshot({ path: path.join(BEFORE_DIR, 'before_dark_desktop.png') });

  await pageDark.close();
  await contextDark.close();

  // 3. Mobile
  const contextMob = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const pageMob = await contextMob.newPage();
  await pageMob.addInitScript(({ token, user }) => {
    localStorage.setItem('becugram_token', token);
    localStorage.setItem('becugram_user', JSON.stringify(user));
    localStorage.setItem('auth-storage', JSON.stringify({ state: { token, user, isAuthenticated: true }, version: 0 }));
    localStorage.setItem('becugram_theme', 'light');
    localStorage.setItem('becugram_accent', '#3390EC');
  }, { token: adminToken, user: adminUser });

  await pageMob.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 20000 });
  await pageMob.waitForTimeout(1500);
  const mobChatRow = pageMob.locator('div[class*="rounded-xl"][class*="cursor-pointer"]').first();
  if (await mobChatRow.count() > 0) {
    await mobChatRow.click();
    await pageMob.waitForTimeout(1000);
  }
  await pageMob.screenshot({ path: path.join(BEFORE_DIR, 'before_mobile.png') });

  await pageMob.close();
  await contextMob.close();

  await browser.close();
  console.log('Baseline screenshots captured in audit_screenshots/phase4_7/before/');
}

run().catch(console.error);
