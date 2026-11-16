const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\488a2d5f-72c4-43de-a15c-abbf8d7ca837';

const { signAccessToken } = require('../server/dist/utils/jwt.js');
const adminToken = signAccessToken({ userId: '6af0a01a7d27b76a8fee65f8', username: 'admin', role: 'admin' });
const adminUser = {
  _id: '6af0a01a7d27b76a8fee65f8', phoneNumber: '+998889008081', displayName: 'Admin', username: 'admin',
  avatar: '/uploads/images/1794157660529_b161afc1f3c88198d553a8425bced12a.jpg', bio: "BecuGram a'zosi 🚀",
  isOnline: true, isVerified: true, role: 'admin', isProfileComplete: true, createdAt: '2026-11-08T16:15:22.907Z',
};

async function run() {
  const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });

  // 1. Desktop 1440x900
  const ctxDesktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const pDesktop = await ctxDesktop.newPage();
  await pDesktop.addInitScript(({ token, user }) => {
    localStorage.setItem('becugram_token', token);
    localStorage.setItem('becugram_user', JSON.stringify(user));
    localStorage.setItem('auth-storage', JSON.stringify({ state: { token, user, isAuthenticated: true }, version: 0 }));
  }, { token: adminToken, user: adminUser });

  await pDesktop.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await pDesktop.waitForTimeout(1000);
  await pDesktop.screenshot({ path: path.join(ARTIFACTS_DIR, 'current_desktop_main.png') });

  // Click on first chat
  const chatRows = await pDesktop.$$('.cursor-pointer');
  for (const row of chatRows) {
    const text = await row.innerText();
    if (text.includes('Aripov') || text.includes('Sharqshunoslik') || text.includes('Gulnoza') || text.includes('Saqlanganlar')) {
      await row.click();
      break;
    }
  }
  await pDesktop.waitForTimeout(1000);
  await pDesktop.screenshot({ path: path.join(ARTIFACTS_DIR, 'current_desktop_active_chat.png') });

  // 2. Mobile 390x844
  const ctxMobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const pMobile = await ctxMobile.newPage();
  await pMobile.addInitScript(({ token, user }) => {
    localStorage.setItem('becugram_token', token);
    localStorage.setItem('becugram_user', JSON.stringify(user));
    localStorage.setItem('auth-storage', JSON.stringify({ state: { token, user, isAuthenticated: true }, version: 0 }));
  }, { token: adminToken, user: adminUser });

  await pMobile.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await pMobile.waitForTimeout(1000);
  await pMobile.screenshot({ path: path.join(ARTIFACTS_DIR, 'current_mobile_chat_list.png') });

  // Click on first chat on mobile
  const mChatRows = await pMobile.$$('.cursor-pointer');
  for (const row of mChatRows) {
    const text = await row.innerText();
    if (text.includes('Aripov') || text.includes('Sharqshunoslik') || text.includes('Gulnoza') || text.includes('Saqlanganlar')) {
      await row.click();
      break;
    }
  }
  await pMobile.waitForTimeout(1000);
  await pMobile.screenshot({ path: path.join(ARTIFACTS_DIR, 'current_mobile_active_chat.png') });

  await browser.close();
  console.log('Screenshots captured successfully!');
}

run().catch(console.error);
