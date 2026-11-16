const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

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
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  });

  const mobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p = await mobileCtx.newPage();

  await p.addInitScript(({ token, user }) => {
    localStorage.setItem('becugram_token', token);
    localStorage.setItem('becugram_user', JSON.stringify(user));
    localStorage.setItem('becugram_theme', 'dark');
    localStorage.setItem('auth-storage', JSON.stringify({ state: { token, user, isAuthenticated: true }, version: 0 }));
    document.documentElement.classList.add('dark');
  }, { token: adminToken, user: adminUser });

  await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1000);

  // 1. Open chat and trigger right-click context menu & reactions
  console.log('Opening chat...');
  const chatItem = p.locator('text=Saqlanganlar').first();
  if (await chatItem.isVisible()) {
    await chatItem.click();
    await p.waitForTimeout(1000);

    // Send a message first so there is a fresh outgoing bubble
    const composer = p.locator('textarea, input[placeholder*="Xabar"]').first();
    if (await composer.isVisible()) {
      await composer.fill('Salom, BecuGram!');
      await p.keyboard.press('Enter');
      await p.waitForTimeout(800);
    }

    // Right-click the last message
    const msgBubbles = p.locator('.cursor-pointer');
    const count = await msgBubbles.count();
    if (count > 0) {
      await msgBubbles.nth(count - 1).click({ button: 'right' });
      await p.waitForTimeout(600);
      await p.screenshot({ path: path.join(OUT_DIR, '02_mobile_context_menu_reactions.png') });
      console.log('Saved 02_mobile_context_menu_reactions.png');
    }

    // 2. Click Call button in chat header to test Telegram Call Modal
    console.log('Testing call modal...');
    const callBtn = p.locator('button[title*="qo‘ng‘iroq"], button:has(svg.lucide-phone)').first();
    if (await callBtn.isVisible()) {
      await callBtn.click();
      await p.waitForTimeout(1200);
      await p.screenshot({ path: path.join(OUT_DIR, '08_call_modal_screen.png') });
      console.log('Saved 08_call_modal_screen.png');

      // Hang up
      const hangupBtn = p.locator('button[title*="yakunlash"]').first();
      if (await hangupBtn.isVisible()) {
        await hangupBtn.click();
        await p.waitForTimeout(600);
      }
    }
  }

  // 3. Open Click To'lov in modal
  await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(800);
  await p.locator('button:has-text("Profil")').first().click();
  await p.waitForTimeout(600);
  await p.locator('button:has-text("BecuGram Premium"), button:has-text("VIP")').first().click();
  await p.waitForTimeout(600);
  await p.locator('button:has-text("Click To‘lov")').first().click();
  await p.waitForTimeout(600);
  await p.screenshot({ path: path.join(OUT_DIR, '05_mobile_click_payment_tab.png') });
  console.log('Saved 05_mobile_click_payment_tab.png');

  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
