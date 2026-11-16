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

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1500);

  // 1. Open chat
  const saqlanganlar = page.locator('div:has-text("Saqlanganlar")').last();
  if (await saqlanganlar.count() > 0) {
    await saqlanganlar.click();
  } else {
    const row = page.locator('div[class*="rounded-xl"][class*="cursor-pointer"]').first();
    await row.click();
  }
  await page.waitForTimeout(1200);

  // 2. Send message
  const inp = page.locator('input[placeholder="Xabar"], input[type="text"]').last();
  if (await inp.count() > 0) {
    await inp.fill('Telegram Web A — BecuGram Phase 4.7 mukammal yakuniy sinov! 🚀✨');
    await inp.press('Enter');
    await page.waitForTimeout(800);
  }

  // 3. Bubbles & Tails
  const pBubbles = path.join(BASE_DIR, 'interaction_states', 'bubbles_and_tails_light.png');
  await page.screenshot({ path: pBubbles });
  await copyArtifact(pBubbles, 'phase4_7_bubbles_and_tails_light.png');
  console.log('Saved bubbles_and_tails_light.png');

  // 4. Right-click context menu
  const msgBubble = page.locator('div[id^="msg-"] div[class*="rounded-2xl"]').last();
  const pContext = path.join(BASE_DIR, 'interaction_states', 'context_menu_light.png');
  if (await msgBubble.count() > 0) {
    await msgBubble.click({ button: 'right' });
    await page.waitForTimeout(600);
    await page.screenshot({ path: pContext });
    await copyArtifact(pContext, 'phase4_7_context_menu_light.png');
    console.log('Saved context_menu_light.png');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
  }

  // 5. Emoji & Sticker Picker
  const smileBtn = page.locator('button[title*="stikerlar"], button[title*="Reaksiyalar"]').last();
  const pSticker = path.join(BASE_DIR, 'interaction_states', 'sticker_picker_light.png');
  const pEmoji = path.join(BASE_DIR, 'interaction_states', 'emoji_picker_light.png');
  if (await smileBtn.count() > 0) {
    await smileBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: pSticker });
    await copyArtifact(pSticker, 'phase4_7_sticker_picker_light.png');
    console.log('Saved sticker_picker_light.png');

    const emojiTab = page.locator('button:has-text("Emojilar")');
    if (await emojiTab.count() > 0) {
      await emojiTab.click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: pEmoji });
      await copyArtifact(pEmoji, 'phase4_7_emoji_picker_light.png');
      console.log('Saved emoji_picker_light.png');
    }
    await smileBtn.click();
    await page.waitForTimeout(400);
  }

  // 6. Settings modal
  const menuBtn = page.locator('button[title="Menyu"]').first();
  const pSettings = path.join(BASE_DIR, 'interaction_states', 'settings_view_light.png');
  if (await menuBtn.count() > 0) {
    await menuBtn.click();
    await page.waitForTimeout(500);
    const settingsOption = page.locator('button:has-text("Sozlamalar")').first();
    if (await settingsOption.count() > 0) {
      await settingsOption.click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: pSettings });
      await copyArtifact(pSettings, 'phase4_7_settings_view_light.png');
      console.log('Saved settings_view_light.png');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    }
  }

  await page.close();
  await ctx.close();

  // 7. Mobile Chat (375x812)
  const ctxMob = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const pMob = await ctxMob.newPage();
  await pMob.addInitScript(({ token, user }) => {
    localStorage.setItem('becugram_token', token);
    localStorage.setItem('becugram_user', JSON.stringify(user));
    localStorage.setItem('auth-storage', JSON.stringify({ state: { token, user, isAuthenticated: true }, version: 0 }));
    localStorage.setItem('becugram_theme', 'light');
    localStorage.setItem('becugram_accent', '#3390EC');
  }, { token: adminToken, user: adminUser });

  await pMob.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 20000 });
  await pMob.waitForTimeout(1500);
  const rowMob = pMob.locator('div:has-text("Saqlanganlar")').last();
  if (await rowMob.count() > 0) {
    await rowMob.click();
  } else {
    const firstMob = pMob.locator('div[class*="rounded-xl"]').first();
    await firstMob.click();
  }
  await pMob.waitForTimeout(1000);
  const pMobChat = path.join(BASE_DIR, 'mobile', 'mobile_375x812_chat.png');
  await pMob.screenshot({ path: pMobChat });
  await copyArtifact(pMobChat, 'phase4_7_mobile_375x812_chat.png');
  console.log('Saved mobile_375x812_chat.png');

  await pMob.close();
  await ctxMob.close();
  await browser.close();
  console.log('Interactions capture complete!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
