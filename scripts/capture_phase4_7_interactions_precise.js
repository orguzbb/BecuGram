const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_DIR = path.join(__dirname, '..', 'audit_screenshots', 'phase4_7');
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

async function copyArtifact(srcPath, name) {
  if (fs.existsSync(srcPath)) {
    const dest = path.join(ARTIFACTS_DIR, name);
    fs.copyFileSync(srcPath, dest);
  }
}

async function run() {
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  await page.addInitScript(({ token, user }) => {
    localStorage.setItem('becugram_token', token);
    localStorage.setItem('becugram_user', JSON.stringify(user));
    localStorage.setItem('auth-storage', JSON.stringify({ state: { token, user, isAuthenticated: true }, version: 0 }));
    localStorage.setItem('becugram_theme', 'light');
    localStorage.setItem('becugram_accent', '#3390EC');
  }, { token: adminToken, user: adminUser });

  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('text=Yuklanmoqda...', { state: 'detached', timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2000);

  // 1. Open chat by clicking "Saqlanganlar"
  const saqlanganlar = page.locator('text=Saqlanganlar').first();
  await saqlanganlar.click();
  await page.waitForTimeout(1500);

  // Send a fresh message
  const inp = page.locator('input[placeholder="Xabar"]').last();
  if (await inp.count() > 0) {
    await inp.fill('Telegram Web A — BecuGram Phase 4.7 mukammal yakuniy sinov! 🚀✨');
    await inp.press('Enter');
    await page.waitForTimeout(1000);
  }

  // 2. Open Emoji & Sticker Picker
  const smileBtn = page.locator('button[title*="Reaksiyalar"]').first();
  if (await smileBtn.count() > 0) {
    await smileBtn.click();
    await page.waitForTimeout(800);

    // Save Sticker tab screenshot
    const pSticker = path.join(BASE_DIR, 'interaction_states', 'sticker_picker_light.png');
    await page.screenshot({ path: pSticker });
    await copyArtifact(pSticker, 'phase4_7_sticker_picker_light.png');
    console.log('Saved sticker_picker_light.png');

    // Switch to Emoji tab
    const emojiTab = page.locator('button:has-text("Emojilar")');
    if (await emojiTab.count() > 0) {
      await emojiTab.click();
      await page.waitForTimeout(500);
      const pEmoji = path.join(BASE_DIR, 'interaction_states', 'emoji_picker_light.png');
      await page.screenshot({ path: pEmoji });
      await copyArtifact(pEmoji, 'phase4_7_emoji_picker_light.png');
      console.log('Saved emoji_picker_light.png');
    }

    // Close picker by clicking smileBtn again
    await smileBtn.click();
    await page.waitForTimeout(500);
  }

  // 3. Open Context Menu on message
  const msgBubble = page.locator('div[id^="msg-"]').last();
  if (await msgBubble.count() > 0) {
    const box = await msgBubble.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' });
      await page.waitForTimeout(700);
      const pContext = path.join(BASE_DIR, 'interaction_states', 'context_menu_light.png');
      await page.screenshot({ path: pContext });
      await copyArtifact(pContext, 'phase4_7_context_menu_light.png');
      console.log('Saved context_menu_light.png');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
  }

  // 4. Open Settings View via Hamburger Drawer
  const menuBtn = page.locator('button[title="Menyu"]').first();
  if (await menuBtn.count() > 0) {
    await menuBtn.click();
    await page.waitForTimeout(600);
    const settingsOption = page.locator('button:has-text("Sozlamalar")').first();
    if (await settingsOption.count() > 0) {
      await settingsOption.click();
      await page.waitForTimeout(1000);
      const pSettings = path.join(BASE_DIR, 'interaction_states', 'settings_view_light.png');
      await page.screenshot({ path: pSettings });
      await copyArtifact(pSettings, 'phase4_7_settings_view_light.png');
      console.log('Saved settings_view_light.png');
    }
  }

  await page.close();
  await ctx.close();

  // 5. Mobile Chat (375x812)
  const ctxMob = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const pMob = await ctxMob.newPage();
  await pMob.addInitScript(({ token, user }) => {
    localStorage.setItem('becugram_token', token);
    localStorage.setItem('becugram_user', JSON.stringify(user));
    localStorage.setItem('auth-storage', JSON.stringify({ state: { token, user, isAuthenticated: true }, version: 0 }));
    localStorage.setItem('becugram_theme', 'light');
    localStorage.setItem('becugram_accent', '#3390EC');
  }, { token: adminToken, user: adminUser });

  await pMob.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await pMob.waitForSelector('text=Yuklanmoqda...', { state: 'detached', timeout: 10000 }).catch(() => {});
  await pMob.waitForTimeout(2000);

  const saqlanganlarMob = pMob.locator('text=Saqlanganlar').first();
  await saqlanganlarMob.click();
  await pMob.waitForTimeout(1200);

  const pMobChat = path.join(BASE_DIR, 'mobile', 'mobile_375x812_chat.png');
  await pMob.screenshot({ path: pMobChat });
  await copyArtifact(pMobChat, 'phase4_7_mobile_375x812_chat.png');
  console.log('Saved mobile_375x812_chat.png');

  await pMob.close();
  await ctxMob.close();
  await browser.close();
  console.log('Precise capture completed successfully!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
