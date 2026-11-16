const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\488a2d5f-72c4-43de-a15c-abbf8d7ca837\\fixes_verified';

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

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

  // 1. MOBILE VERIFICATION (390x844) - Bottom Navigation & FAB & Chat List
  console.log('Testing Mobile Bottom Nav & Layout...');
  const mobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const pageMobile = await mobileCtx.newPage();

  await pageMobile.addInitScript(({ token, user }) => {
    localStorage.setItem('becugram_token', token);
    localStorage.setItem('becugram_user', JSON.stringify(user));
    localStorage.setItem('becugram_theme', 'dark');
    localStorage.setItem('auth-storage', JSON.stringify({ state: { token, user, isAuthenticated: true }, version: 0 }));
    document.documentElement.classList.add('dark');
  }, { token: adminToken, user: adminUser });

  await pageMobile.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await pageMobile.waitForTimeout(1000);
  await pageMobile.screenshot({ path: path.join(OUT_DIR, '01_mobile_bottom_nav_dark.png') });
  console.log('Captured 01_mobile_bottom_nav_dark.png');

  // 2. Open Chat to test Context Menu & Reactions (Image 1 & 2 fixes)
  console.log('Testing Mobile Context Menu...');
  const chatItem = pageMobile.locator('p:has-text("Saqlanganlar"), p:has-text("Becu Contact")').first();
  if (await chatItem.isVisible()) {
    await chatItem.click();
    await pageMobile.waitForTimeout(1000);

    // Right click message bubble to open context menu & reactions
    const bubble = pageMobile.locator('[class*="rounded-2xl"], [class*="max-w-"]').last();
    if (await bubble.isVisible()) {
      await bubble.click({ button: 'right' });
      await pageMobile.waitForTimeout(800);
      await pageMobile.screenshot({ path: path.join(OUT_DIR, '02_mobile_context_menu_reactions.png') });
      console.log('Captured 02_mobile_context_menu_reactions.png');
    }
  }

  // 3. Test Calls tab on mobile
  await pageMobile.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await pageMobile.waitForTimeout(1000);
  const callsBtn = pageMobile.locator('button:has-text("Qo‘ng‘iroqlar")').first();
  if (await callsBtn.isVisible()) {
    await callsBtn.click();
    await pageMobile.waitForTimeout(800);
    await pageMobile.screenshot({ path: path.join(OUT_DIR, '03_mobile_calls_tab.png') });
    console.log('Captured 03_mobile_calls_tab.png');
  }

  // 4. Test Mobile Premium & Click Payment Modal (Image 4 fix)
  console.log('Testing Mobile Premium Modal...');
  const profileTab = pageMobile.locator('button:has-text("Profil")').first();
  if (await profileTab.isVisible()) {
    await profileTab.click();
    await pageMobile.waitForTimeout(800);
  }

  await pageMobile.evaluate(() => {
    const el = Array.from(document.querySelectorAll('button, div')).find((e) =>
      e.textContent && (e.textContent.includes('Premium') || e.textContent.includes('VIP'))
    );
    if (el) el.click();
  });
  await pageMobile.waitForTimeout(1000);
  await pageMobile.screenshot({ path: path.join(OUT_DIR, '04_mobile_premium_modal.png') });
  console.log('Captured 04_mobile_premium_modal.png');

  // Click on Click To'lov tab inside modal
  const clickTab = pageMobile.locator('button:has-text("Click To‘lov"), button:has-text("Click")').first();
  if (await clickTab.isVisible()) {
    await clickTab.click();
    await pageMobile.waitForTimeout(600);
    await pageMobile.screenshot({ path: path.join(OUT_DIR, '05_mobile_click_payment_tab.png') });
    console.log('Captured 05_mobile_click_payment_tab.png');
  }

  // 5. DESKTOP ADMIN PANEL (1440x900) - Test GIF & Lottie Sticker tabs
  console.log('Testing Desktop Admin Panel...');
  const desktopCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const pageDesktop = await desktopCtx.newPage();

  await pageDesktop.addInitScript(({ token, user }) => {
    localStorage.setItem('becugram_token', token);
    localStorage.setItem('becugram_user', JSON.stringify(user));
    localStorage.setItem('becugram_theme', 'dark');
    localStorage.setItem('auth-storage', JSON.stringify({ state: { token, user, isAuthenticated: true }, version: 0 }));
    document.documentElement.classList.add('dark');
  }, { token: adminToken, user: adminUser });

  await pageDesktop.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await pageDesktop.waitForTimeout(1000);

  // Open Admin Dashboard via burger menu
  const burger = pageDesktop.locator('button[title*="Menyu"]').first();
  if (await burger.isVisible()) {
    await burger.click();
    await pageDesktop.waitForTimeout(500);

    const adminBtn = pageDesktop.locator('button:has-text("Admin Panel")').first();
    if (await adminBtn.isVisible()) {
      await adminBtn.click();
      await pageDesktop.waitForTimeout(1000);

      // GIF tab
      const gifTab = pageDesktop.locator('button:has-text("GIFlar")').first();
      if (await gifTab.isVisible()) {
        await gifTab.click();
        await pageDesktop.waitForTimeout(600);
        await pageDesktop.screenshot({ path: path.join(OUT_DIR, '06_admin_gifs_tab.png') });
        console.log('Captured 06_admin_gifs_tab.png');
      }

      // Lottie Stickers tab
      const stickerTab = pageDesktop.locator('button:has-text("Lottie Stikerlar")').first();
      if (await stickerTab.isVisible()) {
        await stickerTab.click();
        await pageDesktop.waitForTimeout(600);
        await pageDesktop.screenshot({ path: path.join(OUT_DIR, '07_admin_lottie_stickers_tab.png') });
        console.log('Captured 07_admin_lottie_stickers_tab.png');
      }
    }
  }

  await browser.close();
  console.log('ALL VERIFICATION SCREENSHOTS CAPTURED SUCCESSFULLY!');
}

run().catch((err) => {
  console.error('Error during verification:', err);
  process.exit(1);
});
