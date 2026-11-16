const { chromium } = require('playwright');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\488a2d5f-72c4-43de-a15c-abbf8d7ca837\\fixes_verified';

const { signAccessToken } = require('../server/dist/utils/jwt.js');
const adminToken = signAccessToken({ userId: '6af0a01a7d27b76a8fee65f8', username: 'admin', role: 'admin' });
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
  const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();

  await p.addInitScript(({ token, user }) => {
    localStorage.setItem('becugram_token', token);
    localStorage.setItem('becugram_user', JSON.stringify(user));
    localStorage.setItem('becugram_theme', 'dark');
    localStorage.setItem('auth-storage', JSON.stringify({ state: { token, user, isAuthenticated: true }, version: 0 }));
    document.documentElement.classList.add('dark');
  }, { token: adminToken, user: adminUser });

  await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1000);

  // Click on "Qo'ng'iroqlar" tab at bottom
  await p.locator('button:has-text("Qo‘ng‘iroqlar")').first().click();
  await p.waitForTimeout(1000);

  // Click audio call button on first contact
  const callBtn = p.locator('button[title*="Audio"], button:has(svg.lucide-phone)').first();
  if (await callBtn.isVisible()) {
    await callBtn.click();
    await p.waitForTimeout(1500);
    await p.screenshot({ path: path.join(OUT_DIR, '08_call_modal_screen.png') });
    console.log('Saved 08_call_modal_screen.png');
  }

  await browser.close();
}

run().catch(console.error);
