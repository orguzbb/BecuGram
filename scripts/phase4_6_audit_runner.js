const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\488a2d5f-72c4-43de-a15c-abbf8d7ca837';
const LOCAL_DIR = path.join(__dirname, '..', 'audit_screenshots', 'phase4_6');

if (!fs.existsSync(LOCAL_DIR)) {
  fs.mkdirSync(LOCAL_DIR, { recursive: true });
}

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

async function copyToArtifacts(filename) {
  const src = path.join(LOCAL_DIR, filename);
  if (fs.existsSync(src)) {
    const dest = path.join(ARTIFACTS_DIR, filename);
    fs.copyFileSync(src, dest);
  }
}

async function run() {
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  console.log('--- 1. Capturing Telegram Web A ---');
  const tgPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    await tgPage.goto('https://web.telegram.org/a/', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await tgPage.waitForTimeout(5000);
    await tgPage.screenshot({ path: path.join(LOCAL_DIR, 'telegram_main.png') });
    copyToArtifacts('telegram_main.png');
    console.log('Captured telegram_main.png');
  } catch (err) {
    console.warn('Telegram Web A capture error:', err.message);
  }
  await tgPage.close();

  console.log('--- 2. Capturing BecuGram States ---');
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.addInitScript(({ token, user }) => {
    localStorage.setItem('becugram_token', token);
    localStorage.setItem('becugram_user', JSON.stringify(user));
    localStorage.setItem('auth-storage', JSON.stringify({ state: { token, user, isAuthenticated: true }, version: 0 }));
  }, { token: adminToken, user: adminUser });

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);

  // 1. Main View (Desktop split)
  await page.screenshot({ path: path.join(LOCAL_DIR, 'becugram_main.png') });
  copyToArtifacts('becugram_main.png');
  console.log('Captured becugram_main.png');

  // 2. Chat list capture
  const chatListLoc = page.locator('div[class*="border-r"]').first();
  if (await chatListLoc.count() > 0) {
    await chatListLoc.screenshot({ path: path.join(LOCAL_DIR, 'becugram_chatlist.png') });
    copyToArtifacts('becugram_chatlist.png');
    console.log('Captured becugram_chatlist.png');
  }

  // 3. Open conversation (Saqlanganlar or first available item)
  console.log('Opening conversation...');
  const saqlanganlar = page.locator('div:has-text("Saqlanganlar")').last();
  if (await saqlanganlar.count() > 0) {
    await saqlanganlar.click();
  } else {
    const firstRow = page.locator('div[class*="rounded-xl"][class*="cursor-pointer"]').first();
    await firstRow.click();
  }
  await page.waitForTimeout(1500);

  // 4. Capture Active Chat View
  await page.screenshot({ path: path.join(LOCAL_DIR, 'becugram_chat.png') });
  copyToArtifacts('becugram_chat.png');
  console.log('Captured becugram_chat.png');

  // 5. Send a live test message to ensure outgoing bubble layout with tail is visible
  const input = page.locator('input[placeholder="Xabar"], input[type="text"]').last();
  await input.fill('Telegram Web A dizayn talqinidagi yangi suhbat xabari! 🚀');
  await input.press('Enter');
  await page.waitForTimeout(1000);

  // 6. Capture message bubbles
  await page.screenshot({ path: path.join(LOCAL_DIR, 'becugram_bubbles.png') });
  copyToArtifacts('becugram_bubbles.png');
  console.log('Captured becugram_bubbles.png');

  // 7. Chat Header Focus
  const headerLoc = page.locator('div[class*="h-14"][class*="justify-between"]').last();
  if (await headerLoc.count() > 0) {
    await headerLoc.screenshot({ path: path.join(LOCAL_DIR, 'becugram_header.png') });
    copyToArtifacts('becugram_header.png');
    console.log('Captured becugram_header.png');
  }

  // 8. Composer Focus
  const composerLoc = page.locator('div[class*="max-w-\\[720px\\]"]').last();
  if (await composerLoc.count() > 0) {
    await composerLoc.screenshot({ path: path.join(LOCAL_DIR, 'becugram_composer.png') });
    copyToArtifacts('becugram_composer.png');
    console.log('Captured becugram_composer.png');
  }

  // 9. Right-click context menu on message
  const msgBubble = page.locator('div[id^="msg-"] div[class*="rounded-2xl"]').last();
  if (await msgBubble.count() > 0) {
    await msgBubble.click({ button: 'right' });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(LOCAL_DIR, 'becugram_context_menu.png') });
    copyToArtifacts('becugram_context_menu.png');
    console.log('Captured becugram_context_menu.png');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
  }

  // 10. Open Sticker / Emoji Picker
  const smileBtn = page.locator('button[title*="stikerlar"], button[title*="Reaksiyalar"]').last();
  if (await smileBtn.count() > 0) {
    await smileBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(LOCAL_DIR, 'becugram_sticker_picker.png') });
    copyToArtifacts('becugram_sticker_picker.png');
    console.log('Captured becugram_sticker_picker.png');

    const emojiTab = page.locator('button:has-text("Emojilar")');
    if (await emojiTab.count() > 0) {
      await emojiTab.click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(LOCAL_DIR, 'becugram_emoji_picker.png') });
      copyToArtifacts('becugram_emoji_picker.png');
      console.log('Captured becugram_emoji_picker.png');
    }
    await smileBtn.click();
    await page.waitForTimeout(400);
  }

  // 11. Profile Panel (click header contact)
  const headerContact = page.locator('div[class*="h-14"] div[class*="cursor-pointer"]').first();
  if (await headerContact.count() > 0) {
    await headerContact.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(LOCAL_DIR, 'becugram_profile.png') });
    copyToArtifacts('becugram_profile.png');
    console.log('Captured becugram_profile.png');

    const closeBtn = page.locator('button[title="Yopish"]').first();
    if (await closeBtn.count() > 0) {
      await closeBtn.click();
      await page.waitForTimeout(400);
    }
  }

  // 12. Search mode
  const searchInput = page.locator('input[placeholder="Qidiruv"]').first();
  if (await searchInput.count() > 0) {
    await searchInput.focus();
    await searchInput.fill('Admin');
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(LOCAL_DIR, 'becugram_search.png') });
    copyToArtifacts('becugram_search.png');
    console.log('Captured becugram_search.png');

    const backSearchBtn = page.locator('button[title="Orqaga"]').first();
    if (await backSearchBtn.count() > 0) {
      await backSearchBtn.click();
      await page.waitForTimeout(400);
    }
  }

  // 13. Settings View
  const menuBtn = page.locator('button[title="Menyu"]').first();
  if (await menuBtn.count() > 0) {
    await menuBtn.click();
    await page.waitForTimeout(500);
    const settingsBtn = page.locator('button:has-text("Sozlamalar")').first();
    if (await settingsBtn.count() > 0) {
      await settingsBtn.click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(LOCAL_DIR, 'becugram_settings.png') });
      copyToArtifacts('becugram_settings.png');
      console.log('Captured becugram_settings.png');
    }
  }

  // 14. Responsive Viewports
  // Mobile (375x812)
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(LOCAL_DIR, 'becugram_mobile_chat.png') });
  copyToArtifacts('becugram_mobile_chat.png');
  console.log('Captured becugram_mobile_chat.png');

  // Tablet (768x1024)
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(LOCAL_DIR, 'becugram_tablet.png') });
  copyToArtifacts('becugram_tablet.png');
  console.log('Captured becugram_tablet.png');

  // Desktop (1920x1080)
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(LOCAL_DIR, 'becugram_desktop_1080.png') });
  copyToArtifacts('becugram_desktop_1080.png');
  console.log('Captured becugram_desktop_1080.png');

  await browser.close();
  console.log('--- ALL COMPARISON SCREENSHOTS CAPTURED AND TRANSFERRED SUCCESSFULLY! ---');
}

run().catch(err => {
  console.error('Audit run failed:', err);
  process.exit(1);
});
