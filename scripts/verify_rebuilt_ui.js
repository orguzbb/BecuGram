const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT_DIR = path.join(__dirname, '..', 'audit_screenshots', 'overhaul');
const ARTIFACTS_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\488a2d5f-72c4-43de-a15c-abbf8d7ca837';

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
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

async function copyArtifact(srcPath, name) {
  if (fs.existsSync(srcPath)) {
    const dest = path.join(ARTIFACTS_DIR, name);
    fs.copyFileSync(srcPath, dest);
  }
}

async function run() {
  console.log('--- Starting Rebuilt UI Browser Verification ---');
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.addInitScript(({ token, user }) => {
    localStorage.setItem('becugram_token', token);
    localStorage.setItem('becugram_user', JSON.stringify(user));
    localStorage.setItem('auth-storage', JSON.stringify({ state: { token, user, isAuthenticated: true }, version: 0 }));
    localStorage.setItem('becugram_theme', 'light');
    localStorage.setItem('becugram_accent', '#3390EC');
  }, { token: adminToken, user: adminUser });

  console.log('Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1500);

  // 1. Capture Main Screen (Light Theme)
  const pMainLight = path.join(OUT_DIR, '01_rebuilt_main_light.png');
  await page.screenshot({ path: pMainLight });
  await copyArtifact(pMainLight, 'overhaul_01_main_light.png');
  console.log('Captured 01_rebuilt_main_light.png');

  // 2. Open chat "Saqlanganlar"
  const saqlanganlar = page.locator('text=Saqlanganlar').first();
  if (await saqlanganlar.count() > 0) {
    await saqlanganlar.click();
    await page.waitForTimeout(1200);
  }

  // Send a sequence of 3 messages in a row to verify grouping & tail rendering
  const inp = page.locator('input[placeholder="Xabar"]').last();
  if (await inp.count() > 0) {
    await inp.fill('Telegram Web A — 1-xabar (Guruh boshi)');
    await inp.press('Enter');
    await page.waitForTimeout(400);

    await inp.fill('Telegram Web A — 2-xabar (Guruh o‘rtasi)');
    await inp.press('Enter');
    await page.waitForTimeout(400);

    await inp.fill('Telegram Web A — 3-xabar (Guruh oxiri va dumcha) 🚀✨');
    await inp.press('Enter');
    await page.waitForTimeout(1000);
  }

  // 3. Capture Active Chat with grouped bubbles
  const pChatLight = path.join(OUT_DIR, '02_rebuilt_chat_grouped_bubbles.png');
  await page.screenshot({ path: pChatLight });
  await copyArtifact(pChatLight, 'overhaul_02_chat_grouped_bubbles.png');
  console.log('Captured 02_rebuilt_chat_grouped_bubbles.png');

  // 4. Open Hamburger Drawer
  const menuBtn = page.locator('button[title="Menyu"]').first();
  if (await menuBtn.count() > 0) {
    await menuBtn.click();
    await page.waitForTimeout(600);
    const pDrawer = path.join(OUT_DIR, '03_rebuilt_hamburger_drawer.png');
    await page.screenshot({ path: pDrawer });
    await copyArtifact(pDrawer, 'overhaul_03_hamburger_drawer.png');
    console.log('Captured 03_rebuilt_hamburger_drawer.png');

    // Close drawer by pressing Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
  }

  // 5. Open Emoji/Sticker Picker
  const smileBtn = page.locator('button[title*="Reaksiyalar"]').first();
  if (await smileBtn.count() > 0) {
    await smileBtn.click();
    await page.waitForTimeout(600);
    const pPicker = path.join(OUT_DIR, '04_rebuilt_sticker_picker.png');
    await page.screenshot({ path: pPicker });
    await copyArtifact(pPicker, 'overhaul_04_sticker_picker.png');
    console.log('Captured 04_rebuilt_sticker_picker.png');
    await smileBtn.click();
    await page.waitForTimeout(400);
  }

  await page.close();
  await ctx.close();

  // 6. Test Dark Theme (1440x900)
  const ctxDark = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const pDark = await ctxDark.newPage();
  await pDark.addInitScript(({ token, user }) => {
    localStorage.setItem('becugram_token', token);
    localStorage.setItem('becugram_user', JSON.stringify(user));
    localStorage.setItem('auth-storage', JSON.stringify({ state: { token, user, isAuthenticated: true }, version: 0 }));
    localStorage.setItem('becugram_theme', 'dark');
    localStorage.setItem('becugram_accent', '#8774E1');
  }, { token: adminToken, user: adminUser });

  await pDark.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 20000 });
  await pDark.waitForTimeout(1500);

  const saqlanganlarDark = pDark.locator('text=Saqlanganlar').first();
  if (await saqlanganlarDark.count() > 0) {
    await saqlanganlarDark.click();
    await pDark.waitForTimeout(1200);
  }

  const pDarkChat = path.join(OUT_DIR, '05_rebuilt_dark_chat.png');
  await pDark.screenshot({ path: pDarkChat });
  await copyArtifact(pDarkChat, 'overhaul_05_dark_chat.png');
  console.log('Captured 05_rebuilt_dark_chat.png');

  await pDark.close();
  await ctxDark.close();

  // 7. Test Mobile (375x812)
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

  // Mobile list view
  const pMobList = path.join(OUT_DIR, '06_rebuilt_mobile_list.png');
  await pMob.screenshot({ path: pMobList });
  await copyArtifact(pMobList, 'overhaul_06_mobile_list.png');
  console.log('Captured 06_rebuilt_mobile_list.png');

  // Open chat on mobile
  const saqlanganlarMob = pMob.locator('text=Saqlanganlar').first();
  if (await saqlanganlarMob.count() > 0) {
    await saqlanganlarMob.click();
    await pMob.waitForTimeout(1000);
    const pMobChat = path.join(OUT_DIR, '07_rebuilt_mobile_chat.png');
    await pMob.screenshot({ path: pMobChat });
    await copyArtifact(pMobChat, 'overhaul_07_mobile_chat.png');
    console.log('Captured 07_rebuilt_mobile_chat.png');
  }

  await pMob.close();
  await ctxMob.close();

  await browser.close();
  console.log('--- Verification Complete. Console Errors:', consoleErrors.length, '---');
  if (consoleErrors.length > 0) {
    console.log('Errors:', consoleErrors.slice(0, 5));
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
