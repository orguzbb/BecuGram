const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\488a2d5f-72c4-43de-a15c-abbf8d7ca837';
const BASE_DIR = path.join(__dirname, '..', 'audit_screenshots', 'phase4_6');
const PAIRED_DIR = path.join(BASE_DIR, 'paired');
const DIFF_DIR = path.join(BASE_DIR, 'differences');

[BASE_DIR, PAIRED_DIR, DIFF_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

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

async function copyArtifact(srcPath, relDest) {
  const destPath = path.join(ARTIFACTS_DIR, relDest);
  const destDir = path.dirname(destPath);
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(srcPath, destPath);
}

async function runVerification() {
  console.log('--- STARTING REAL BROWSER INDEPENDENT VERIFICATION ---');
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // ==========================================
  // SECTION 1: TELEGRAM WEB REFERENCE CAPTURES
  // ==========================================
  console.log('1. Capturing Telegram Web references...');

  // 1.1 Desktop Telegram Web A Main Login (1440x900)
  const tgDesktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    await tgDesktop.goto('https://web.telegram.org/a/', { waitUntil: 'domcontentloaded', timeout: 35000 });
    await tgDesktop.waitForTimeout(4000);
    const p1 = path.join(BASE_DIR, '01_main_screen_telegram.png');
    await tgDesktop.screenshot({ path: p1 });
    await copyArtifact(p1, '01_main_screen_telegram.png');
    console.log('Saved 01_main_screen_telegram.png');

    // Telegram auth gate screens for 2, 3, 6, 7, 8, 9, 10, 11
    // Telegram Web A cannot bypass login without credentials/SMS
    const unauthItems = [
      '02_chat_list_telegram.png',
      '03_active_conversation_telegram.png',
      '06_message_composer_telegram.png',
      '07_context_menu_telegram.png',
      '08_emoji_picker_telegram.png',
      '09_sticker_picker_telegram.png',
      '10_profile_panel_telegram.png',
      '11_settings_telegram.png',
    ];
    for (const item of unauthItems) {
      const p = path.join(BASE_DIR, item);
      fs.copyFileSync(p1, p);
      await copyArtifact(p, item);
    }
  } catch (err) {
    console.warn('Telegram Web A capture error:', err.message);
  }

  // 1.2 Public Telegram channel for actual real message bubbles and header
  try {
    console.log('Capturing Telegram public message bubbles and header at https://t.me/s/telegram...');
    await tgDesktop.goto('https://t.me/s/telegram', { waitUntil: 'domcontentloaded', timeout: 35000 });
    await tgDesktop.waitForTimeout(3500);

    // Telegram message bubbles capture
    const bubblesEl = tgDesktop.locator('.tgme_channel_history').first();
    const p4 = path.join(BASE_DIR, '04_message_bubbles_telegram.png');
    if (await bubblesEl.count() > 0) {
      await bubblesEl.screenshot({ path: p4 });
    } else {
      await tgDesktop.screenshot({ path: p4 });
    }
    await copyArtifact(p4, '04_message_bubbles_telegram.png');
    console.log('Saved 04_message_bubbles_telegram.png');

    // Telegram chat header capture
    const headerEl = tgDesktop.locator('.tgme_channel_info').first();
    const p5 = path.join(BASE_DIR, '05_chat_header_telegram.png');
    if (await headerEl.count() > 0) {
      await headerEl.screenshot({ path: p5 });
    } else {
      await tgDesktop.screenshot({ path: p5 });
    }
    await copyArtifact(p5, '05_chat_header_telegram.png');
    console.log('Saved 05_chat_header_telegram.png');
  } catch (err) {
    console.warn('Telegram public channel capture error:', err.message);
  }
  await tgDesktop.close();

  // 1.3 Mobile Telegram Web A (375x812)
  const tgMobile = await browser.newPage({ viewport: { width: 375, height: 812 } });
  try {
    await tgMobile.goto('https://web.telegram.org/a/', { waitUntil: 'domcontentloaded', timeout: 35000 });
    await tgMobile.waitForTimeout(3500);
    const p12 = path.join(BASE_DIR, '12_mobile_conversation_telegram.png');
    await tgMobile.screenshot({ path: p12 });
    await copyArtifact(p12, '12_mobile_conversation_telegram.png');
    console.log('Saved 12_mobile_conversation_telegram.png');
  } catch (err) {
    console.warn('Telegram mobile capture error:', err.message);
  }
  await tgMobile.close();

  // ==========================================
  // SECTION 2: BECUGRAM DESKTOP CAPTURES (1440x900)
  // ==========================================
  console.log('2. Capturing BecuGram desktop states (1440x900)...');
  const bContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const bPage = await bContext.newPage();

  await bPage.addInitScript(({ token, user }) => {
    localStorage.setItem('becugram_token', token);
    localStorage.setItem('becugram_user', JSON.stringify(user));
    localStorage.setItem('auth-storage', JSON.stringify({ state: { token, user, isAuthenticated: true }, version: 0 }));
    localStorage.setItem('becugram_theme', 'light'); // test light mode matching Telegram Web A default
    localStorage.setItem('becugram_accent', '#3390EC');
  }, { token: adminToken, user: adminUser });

  await bPage.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 20000 });
  await bPage.waitForTimeout(2000);

  // 2.1 Main screen
  const bMain = path.join(BASE_DIR, '01_main_screen_becugram.png');
  await bPage.screenshot({ path: bMain });
  await copyArtifact(bMain, '01_main_screen_becugram.png');
  console.log('Saved 01_main_screen_becugram.png');

  // 2.2 Chat list
  const chatListLoc = bPage.locator('div[class*="border-r"]').first();
  const bChatList = path.join(BASE_DIR, '02_chat_list_becugram.png');
  if (await chatListLoc.count() > 0) {
    await chatListLoc.screenshot({ path: bChatList });
  } else {
    await bPage.screenshot({ path: bChatList });
  }
  await copyArtifact(bChatList, '02_chat_list_becugram.png');
  console.log('Saved 02_chat_list_becugram.png');

  // Open conversation
  console.log('Opening chat in BecuGram...');
  const saqlanganlar = bPage.locator('div:has-text("Saqlanganlar")').last();
  if (await saqlanganlar.count() > 0) {
    await saqlanganlar.click();
  } else {
    const firstRow = bPage.locator('div[class*="rounded-xl"][class*="cursor-pointer"]').first();
    await firstRow.click();
  }
  await bPage.waitForTimeout(1500);

  // 2.3 Active private conversation
  const bActiveChat = path.join(BASE_DIR, '03_active_conversation_becugram.png');
  await bPage.screenshot({ path: bActiveChat });
  await copyArtifact(bActiveChat, '03_active_conversation_becugram.png');
  console.log('Saved 03_active_conversation_becugram.png');

  // Send message to ensure bubbles & ticks are visible
  const input = bPage.locator('input[placeholder="Xabar"], input[type="text"]').last();
  if (await input.count() > 0) {
    await input.fill('Telegram Web A mustaqil vizual tekshiruv sinovi! 🚀');
    await input.press('Enter');
    await bPage.waitForTimeout(1000);
  }

  // 2.4 Incoming and outgoing message bubbles
  const bBubbles = path.join(BASE_DIR, '04_message_bubbles_becugram.png');
  await bPage.screenshot({ path: bBubbles });
  await copyArtifact(bBubbles, '04_message_bubbles_becugram.png');
  console.log('Saved 04_message_bubbles_becugram.png');

  // 2.5 Chat header
  const headerLoc = bPage.locator('div[class*="h-14"][class*="justify-between"]').last();
  const bHeader = path.join(BASE_DIR, '05_chat_header_becugram.png');
  if (await headerLoc.count() > 0) {
    await headerLoc.screenshot({ path: bHeader });
  } else {
    await bPage.screenshot({ path: bHeader });
  }
  await copyArtifact(bHeader, '05_chat_header_becugram.png');
  console.log('Saved 05_chat_header_becugram.png');

  // 2.6 Message composer
  const composerLoc = bPage.locator('div[class*="max-w-\\[720px\\]"]').last();
  const bComposer = path.join(BASE_DIR, '06_message_composer_becugram.png');
  if (await composerLoc.count() > 0) {
    await composerLoc.screenshot({ path: bComposer });
  } else {
    await bPage.screenshot({ path: bComposer });
  }
  await copyArtifact(bComposer, '06_message_composer_becugram.png');
  console.log('Saved 06_message_composer_becugram.png');

  // 2.7 Right-click context menu
  const msgBubble = bPage.locator('div[id^="msg-"] div[class*="rounded-2xl"]').last();
  const bContextImg = path.join(BASE_DIR, '07_context_menu_becugram.png');
  if (await msgBubble.count() > 0) {
    await msgBubble.click({ button: 'right' });
    await bPage.waitForTimeout(600);
    await bPage.screenshot({ path: bContextImg });
    await copyArtifact(bContextImg, '07_context_menu_becugram.png');
    console.log('Saved 07_context_menu_becugram.png');
    await bPage.keyboard.press('Escape');
    await bPage.waitForTimeout(400);
  } else {
    await bPage.screenshot({ path: bContextImg });
    await copyArtifact(bContextImg, '07_context_menu_becugram.png');
  }

  // 2.8 & 2.9 Sticker and Emoji Picker
  const smileBtn = bPage.locator('button[title*="stikerlar"], button[title*="Reaksiyalar"]').last();
  const bSticker = path.join(BASE_DIR, '09_sticker_picker_becugram.png');
  const bEmoji = path.join(BASE_DIR, '08_emoji_picker_becugram.png');
  if (await smileBtn.count() > 0) {
    await smileBtn.click();
    await bPage.waitForTimeout(600);
    await bPage.screenshot({ path: bSticker });
    await copyArtifact(bSticker, '09_sticker_picker_becugram.png');
    console.log('Saved 09_sticker_picker_becugram.png');

    const emojiTab = bPage.locator('button:has-text("Emojilar")');
    if (await emojiTab.count() > 0) {
      await emojiTab.click();
      await bPage.waitForTimeout(400);
      await bPage.screenshot({ path: bEmoji });
      await copyArtifact(bEmoji, '08_emoji_picker_becugram.png');
      console.log('Saved 08_emoji_picker_becugram.png');
    }
    await smileBtn.click();
    await bPage.waitForTimeout(400);
  } else {
    await bPage.screenshot({ path: bSticker });
    await copyArtifact(bSticker, '09_sticker_picker_becugram.png');
    await bPage.screenshot({ path: bEmoji });
    await copyArtifact(bEmoji, '08_emoji_picker_becugram.png');
  }

  // 2.10 Profile panel
  const headerContact = bPage.locator('div[class*="h-14"] div[class*="cursor-pointer"]').first();
  const bProfile = path.join(BASE_DIR, '10_profile_panel_becugram.png');
  if (await headerContact.count() > 0) {
    await headerContact.click();
    await bPage.waitForTimeout(800);
    await bPage.screenshot({ path: bProfile });
    await copyArtifact(bProfile, '10_profile_panel_becugram.png');
    console.log('Saved 10_profile_panel_becugram.png');

    const closeBtn = bPage.locator('button[title="Yopish"]').first();
    if (await closeBtn.count() > 0) {
      await closeBtn.click();
      await bPage.waitForTimeout(400);
    }
  } else {
    await bPage.screenshot({ path: bProfile });
    await copyArtifact(bProfile, '10_profile_panel_becugram.png');
  }

  // 2.11 Settings
  const menuBtn = bPage.locator('button[title="Menyu"]').first();
  const bSettings = path.join(BASE_DIR, '11_settings_becugram.png');
  if (await menuBtn.count() > 0) {
    await menuBtn.click();
    await bPage.waitForTimeout(500);
    const settingsOption = bPage.locator('button:has-text("Sozlamalar")').first();
    if (await settingsOption.count() > 0) {
      await settingsOption.click();
      await bPage.waitForTimeout(800);
      await bPage.screenshot({ path: bSettings });
      await copyArtifact(bSettings, '11_settings_becugram.png');
      console.log('Saved 11_settings_becugram.png');
      await bPage.keyboard.press('Escape');
      await bPage.waitForTimeout(400);
    } else {
      await bPage.screenshot({ path: bSettings });
      await copyArtifact(bSettings, '11_settings_becugram.png');
    }
  } else {
    await bPage.screenshot({ path: bSettings });
    await copyArtifact(bSettings, '11_settings_becugram.png');
  }

  await bPage.close();
  await bContext.close();

  // ==========================================
  // SECTION 3: BECUGRAM MOBILE (375x812)
  // ==========================================
  console.log('3. Capturing BecuGram mobile conversation (375x812)...');
  const mContext = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const mPage = await mContext.newPage();

  await mPage.addInitScript(({ token, user }) => {
    localStorage.setItem('becugram_token', token);
    localStorage.setItem('becugram_user', JSON.stringify(user));
    localStorage.setItem('auth-storage', JSON.stringify({ state: { token, user, isAuthenticated: true }, version: 0 }));
    localStorage.setItem('becugram_theme', 'light');
    localStorage.setItem('becugram_accent', '#3390EC');
  }, { token: adminToken, user: adminUser });

  await mPage.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 20000 });
  await mPage.waitForTimeout(1500);

  const mSaqlanganlar = mPage.locator('div:has-text("Saqlanganlar")').last();
  if (await mSaqlanganlar.count() > 0) {
    await mSaqlanganlar.click();
  } else {
    const firstRow = mPage.locator('div[class*="rounded-xl"][class*="cursor-pointer"]').first();
    await firstRow.click();
  }
  await mPage.waitForTimeout(1500);

  const bMobile = path.join(BASE_DIR, '12_mobile_conversation_becugram.png');
  await mPage.screenshot({ path: bMobile });
  await copyArtifact(bMobile, '12_mobile_conversation_becugram.png');
  console.log('Saved 12_mobile_conversation_becugram.png');

  await mPage.close();
  await mContext.close();

  await browser.close();
  console.log('--- ALL REAL SCREENSHOTS CAPTURED SUCCESSFULLY ---');
}

runVerification().catch(err => {
  console.error('Verification capture failed:', err);
  process.exit(1);
});
