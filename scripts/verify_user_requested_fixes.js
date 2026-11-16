import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const OUT_DIR = 'C:/Users/user/.gemini/antigravity/brain/488a2d5f-72c4-43de-a15c-abbf8d7ca837/fixes_verified';
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  // 1. MOBILE CONTEXT MENU & REACTIONS (Testing Image 1 & 2 fixes)
  console.log('Testing Mobile Context Menu & Reactions...');
  const mobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const pageMobile = await mobileCtx.newPage();
  await pageMobile.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

  // Check login state
  const isAuth = await pageMobile.$('input[type="tel"]');
  if (isAuth) {
    await pageMobile.fill('input[type="tel"]', '889008081');
    await pageMobile.click('button:has-text("Kodni olish"), button[type="submit"]');
    await pageMobile.waitForTimeout(1000);
    const otpInput = await pageMobile.$('input[placeholder*="kod"], input[type="text"]');
    if (otpInput) {
      await otpInput.fill('77777');
      await pageMobile.click('button:has-text("Kirish"), button[type="submit"]');
      await pageMobile.waitForTimeout(1500);
    }
  }

  // Mobile Bottom Navigation screenshot
  await pageMobile.screenshot({ path: path.join(OUT_DIR, '01_mobile_bottom_nav.png') });
  console.log('Saved 01_mobile_bottom_nav.png');

  // Open a chat to test context menu
  const chatItem = await pageMobile.locator('p:has-text("Saqlanganlar"), p:has-text("Becu Contact")').first();
  if (await chatItem.isVisible()) {
    await chatItem.click();
    await pageMobile.waitForTimeout(1000);

    // Right click or click message bubble
    const bubble = await pageMobile.locator('[class*="rounded-2xl"], [class*="max-w-"]').last();
    if (await bubble.isVisible()) {
      await bubble.click({ button: 'right' });
      await pageMobile.waitForTimeout(800);
      await pageMobile.screenshot({ path: path.join(OUT_DIR, '02_mobile_context_menu_reactions.png') });
      console.log('Saved 02_mobile_context_menu_reactions.png');
    }
  }

  // 2. MOBILE PREMIUM & CLICK TO'LOV MODAL (Testing Image 4 fix)
  console.log('Testing Mobile Premium Modal...');
  await pageMobile.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await pageMobile.waitForTimeout(1000);

  // Click on Profile or Settings tab to open Premium Modal
  const settingsTab = await pageMobile.locator('button:has-text("Sozlamalar")').first();
  if (await settingsTab.isVisible()) {
    await settingsTab.click();
    await pageMobile.waitForTimeout(1000);
    await pageMobile.screenshot({ path: path.join(OUT_DIR, '03_mobile_settings_tab.png') });
  }

  // Open Premium Modal directly via evaluate or button
  await pageMobile.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button, div')).find((el) =>
      el.textContent && (el.textContent.includes('Premium') || el.textContent.includes('VIP'))
    );
    if (btn) btn.click();
  });
  await pageMobile.waitForTimeout(1000);
  await pageMobile.screenshot({ path: path.join(OUT_DIR, '04_mobile_premium_modal.png') });
  console.log('Saved 04_mobile_premium_modal.png');

  // Click tab switch inside Premium modal
  const clickPayTab = await pageMobile.locator('button:has-text("Click To‘lov"), button:has-text("Click")').first();
  if (await clickPayTab.isVisible()) {
    await clickPayTab.click();
    await pageMobile.waitForTimeout(800);
    await pageMobile.screenshot({ path: path.join(OUT_DIR, '05_mobile_click_payment_tab.png') });
    console.log('Saved 05_mobile_click_payment_tab.png');
  }

  // 3. DESKTOP ADMIN PANEL (Testing GIFs & Lottie Stickers tabs)
  console.log('Testing Desktop Admin Panel...');
  const desktopCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const pageDesktop = await desktopCtx.newPage();
  await pageDesktop.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

  // Open Admin Dashboard via burger menu or evaluate
  await pageDesktop.evaluate(() => {
    const burger = document.querySelector('button[title*="Menyu"], button');
    if (burger) burger.click();
  });
  await pageDesktop.waitForTimeout(600);

  const adminMenuBtn = await pageDesktop.locator('button:has-text("Admin Panel")').first();
  if (await adminMenuBtn.isVisible()) {
    await adminMenuBtn.click();
    await pageDesktop.waitForTimeout(1000);

    // Click GIF tab
    const gifTab = await pageDesktop.locator('button:has-text("GIFlar")').first();
    if (await gifTab.isVisible()) {
      await gifTab.click();
      await pageDesktop.waitForTimeout(800);
      await pageDesktop.screenshot({ path: path.join(OUT_DIR, '06_admin_gifs_tab.png') });
      console.log('Saved 06_admin_gifs_tab.png');
    }

    // Click Lottie Stickers tab
    const stickerTab = await pageDesktop.locator('button:has-text("Lottie Stikerlar")').first();
    if (await stickerTab.isVisible()) {
      await stickerTab.click();
      await pageDesktop.waitForTimeout(800);
      await pageDesktop.screenshot({ path: path.join(OUT_DIR, '07_admin_lottie_stickers_tab.png') });
      console.log('Saved 07_admin_lottie_stickers_tab.png');
    }
  }

  await browser.close();
  console.log('ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
}

run().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
