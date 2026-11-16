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

  // Click on chat
  await p.locator('text=Saqlanganlar').first().click();
  await p.waitForTimeout(1000);

  // Trigger Context menu by dispatching contextmenu on the last message bubble
  await p.evaluate(() => {
    const bubbles = Array.from(document.querySelectorAll('[class*="bg-[#E1FFC7]"], [class*="bg-[#766AC8]"], [class*="bubble"]'));
    const target = bubbles[bubbles.length - 1] || document.querySelector('p:has-text("Salom")');
    if (target) {
      const rect = target.getBoundingClientRect();
      const event = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
      });
      target.dispatchEvent(event);
    }
  });

  await p.waitForTimeout(800);
  await p.screenshot({ path: path.join(OUT_DIR, '02_mobile_context_menu_reactions.png') });
  console.log('Saved 02_mobile_context_menu_reactions.png');

  // Now trigger call from chat header
  await p.evaluate(() => {
    const callBtn = document.querySelector('button[title*="qo‘ng‘iroq"], button:has(svg.lucide-phone)') ||
      Array.from(document.querySelectorAll('button')).find((b) => b.querySelector('svg.lucide-phone'));
    if (callBtn) callBtn.click();
  });

  await p.waitForTimeout(1200);
  await p.screenshot({ path: path.join(OUT_DIR, '08_call_modal_screen.png') });
  console.log('Saved 08_call_modal_screen.png');

  await browser.close();
}

run().catch(console.error);
