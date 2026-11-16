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

async function copyToArtifacts(subpath, filename) {
  const src = path.join(BASE_DIR, subpath, filename);
  if (fs.existsSync(src)) {
    const dest = path.join(ARTIFACTS_DIR, `phase4_7_${subpath.replace(/[\\/]/g, '_')}_${filename}`);
    fs.copyFileSync(src, dest);
  }
}

async function runAudit() {
  console.log('--- STARTING PHASE 4.7 COMPREHENSIVE BROWSER AUDIT ---');
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // 1. DESKTOP VIEWPORTS (1920x1080, 1600x900, 1440x900, 1366x768, 1280x800)
  const desktopSizes = [
    { name: '1920x1080', width: 1920, height: 1080 },
    { name: '1600x900', width: 1600, height: 900 },
    { name: '1440x900', width: 1440, height: 900 },
    { name: '1366x768', width: 1366, height: 768 },
    { name: '1280x800', width: 1280, height: 800 },
  ];

  for (const vp of desktopSizes) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const p = await ctx.newPage();
    await p.addInitScript(({ token, user }) => {
      localStorage.setItem('becugram_token', token);
      localStorage.setItem('becugram_user', JSON.stringify(user));
      localStorage.setItem('auth-storage', JSON.stringify({ state: { token, user, isAuthenticated: true }, version: 0 }));
      localStorage.setItem('becugram_theme', 'light');
      localStorage.setItem('becugram_accent', '#3390EC');
    }, { token: adminToken, user: adminUser });

    await p.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 20000 });
    await p.waitForTimeout(1000);
    const fname = `desktop_${vp.name}.png`;
    await p.screenshot({ path: path.join(BASE_DIR, 'desktop', fname) });
    await copyToArtifacts('desktop', fname);

    // Open chat
    const row = p.locator('div[class*="rounded-xl"][class*="cursor-pointer"]').first();
    if (await row.count() > 0) {
      await row.click();
      await p.waitForTimeout(800);
      const chatFname = `desktop_${vp.name}_chat.png`;
      await p.screenshot({ path: path.join(BASE_DIR, 'desktop', chatFname) });
      await copyToArtifacts('desktop', chatFname);
    }
    await p.close();
    await ctx.close();
    console.log(`Captured desktop ${vp.name}`);
  }

  // 2. TABLET VIEWPORTS (1024x768, 768x1024)
  const tabletSizes = [
    { name: '1024x768', width: 1024, height: 768 },
    { name: '768x1024', width: 768, height: 1024 },
  ];
  for (const vp of tabletSizes) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const p = await ctx.newPage();
    await p.addInitScript(({ token, user }) => {
      localStorage.setItem('becugram_token', token);
      localStorage.setItem('becugram_user', JSON.stringify(user));
      localStorage.setItem('auth-storage', JSON.stringify({ state: { token, user, isAuthenticated: true }, version: 0 }));
      localStorage.setItem('becugram_theme', 'light');
      localStorage.setItem('becugram_accent', '#3390EC');
    }, { token: adminToken, user: adminUser });

    await p.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 20000 });
    await p.waitForTimeout(1000);
    const row = p.locator('div[class*="rounded-xl"][class*="cursor-pointer"]').first();
    if (await row.count() > 0) {
      await row.click();
      await p.waitForTimeout(800);
    }
    const fname = `tablet_${vp.name}.png`;
    await p.screenshot({ path: path.join(BASE_DIR, 'tablet', fname) });
    await copyToArtifacts('tablet', fname);
    await p.close();
    await ctx.close();
    console.log(`Captured tablet ${vp.name}`);
  }

  // 3. MOBILE VIEWPORTS (430x932, 390x844, 375x812, 360x800)
  const mobileSizes = [
    { name: '430x932', width: 430, height: 932 },
    { name: '390x844', width: 390, height: 844 },
    { name: '375x812', width: 375, height: 812 },
    { name: '360x800', width: 360, height: 800 },
  ];
  for (const vp of mobileSizes) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const p = await ctx.newPage();
    await p.addInitScript(({ token, user }) => {
      localStorage.setItem('becugram_token', token);
      localStorage.setItem('becugram_user', JSON.stringify(user));
      localStorage.setItem('auth-storage', JSON.stringify({ state: { token, user, isAuthenticated: true }, version: 0 }));
      localStorage.setItem('becugram_theme', 'light');
      localStorage.setItem('becugram_accent', '#3390EC');
    }, { token: adminToken, user: adminUser });

    await p.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 20000 });
    await p.waitForTimeout(1000);
    // 1. Mobile chat list view
    const listFname = `mobile_${vp.name}_list.png`;
    await p.screenshot({ path: path.join(BASE_DIR, 'mobile', listFname) });
    await copyToArtifacts('mobile', listFname);

    // 2. Mobile active chat view
    const row = p.locator('div[class*="rounded-xl"][class*="cursor-pointer"]').first();
    if (await row.count() > 0) {
      await row.click();
      await p.waitForTimeout(800);
      const chatFname = `mobile_${vp.name}_chat.png`;
      await p.screenshot({ path: path.join(BASE_DIR, 'mobile', chatFname) });
      await copyToArtifacts('mobile', chatFname);
    }
    await p.close();
    await ctx.close();
    console.log(`Captured mobile ${vp.name}`);
  }

  // 4. INTERACTION STATES & THEMES (Desktop 1440x900)
  const ctxInter = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const pInter = await ctxInter.newPage();
  await pInter.addInitScript(({ token, user }) => {
    localStorage.setItem('becugram_token', token);
    localStorage.setItem('becugram_user', JSON.stringify(user));
    localStorage.setItem('auth-storage', JSON.stringify({ state: { token, user, isAuthenticated: true }, version: 0 }));
    localStorage.setItem('becugram_theme', 'light');
    localStorage.setItem('becugram_accent', '#3390EC');
  }, { token: adminToken, user: adminUser });

  await pInter.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 20000 });
  await pInter.waitForTimeout(1500);

  // 4.1 After Main View
  await pInter.screenshot({ path: path.join(BASE_DIR, 'after', 'after_main_light.png') });
  await copyToArtifacts('after', 'after_main_light.png');

  // Open Chat
  const rowInter = pInter.locator('div[class*="rounded-xl"][class*="cursor-pointer"]').first();
  if (await rowInter.count() > 0) {
    await rowInter.click();
    await pInter.waitForTimeout(1000);
  }

  // 4.2 After Active Chat
  await pInter.screenshot({ path: path.join(BASE_DIR, 'after', 'after_chat_light.png') });
  await copyToArtifacts('after', 'after_chat_light.png');

  // Send message
  const inp = pInter.locator('input[placeholder="Xabar"], input[type="text"]').last();
  if (await inp.count() > 0) {
    await inp.fill('Telegram Web A — BecuGram Phase 4.7 mukammal yakuniy sinov! 🚀✨');
    await inp.press('Enter');
    await pInter.waitForTimeout(800);
  }

  // 4.3 Message Bubbles & Tails
  await pInter.screenshot({ path: path.join(BASE_DIR, 'interaction_states', 'bubbles_and_tails_light.png') });
  await copyToArtifacts('interaction_states', 'bubbles_and_tails_light.png');

  // 4.4 Right click context menu
  const msgBubble = pInter.locator('div[id^="msg-"] div[class*="rounded-2xl"]').last();
  if (await msgBubble.count() > 0) {
    await msgBubble.click({ button: 'right' });
    await pInter.waitForTimeout(600);
    await pInter.screenshot({ path: path.join(BASE_DIR, 'interaction_states', 'context_menu_light.png') });
    await copyToArtifacts('interaction_states', 'context_menu_light.png');
    await pInter.keyboard.press('Escape');
    await pInter.waitForTimeout(400);
  }

  // 4.5 Emoji & Sticker Picker
  const smileBtn = pInter.locator('button[title*="stikerlar"], button[title*="Reaksiyalar"]').last();
  if (await smileBtn.count() > 0) {
    await smileBtn.click();
    await pInter.waitForTimeout(600);
    await pInter.screenshot({ path: path.join(BASE_DIR, 'interaction_states', 'sticker_picker_light.png') });
    await copyToArtifacts('interaction_states', 'sticker_picker_light.png');

    const emojiTab = pInter.locator('button:has-text("Emojilar")');
    if (await emojiTab.count() > 0) {
      await emojiTab.click();
      await pInter.waitForTimeout(400);
      await pInter.screenshot({ path: path.join(BASE_DIR, 'interaction_states', 'emoji_picker_light.png') });
      await copyToArtifacts('interaction_states', 'emoji_picker_light.png');
    }
    await smileBtn.click();
    await pInter.waitForTimeout(400);
  }

  // 4.6 Settings Modal
  const menuBtn = pInter.locator('button[title="Menyu"]').first();
  if (await menuBtn.count() > 0) {
    await menuBtn.click();
    await pInter.waitForTimeout(500);
    const settingsOption = pInter.locator('button:has-text("Sozlamalar")').first();
    if (await settingsOption.count() > 0) {
      await settingsOption.click();
      await pInter.waitForTimeout(800);
      await pInter.screenshot({ path: path.join(BASE_DIR, 'interaction_states', 'settings_view_light.png') });
      await copyToArtifacts('interaction_states', 'settings_view_light.png');
      await pInter.keyboard.press('Escape');
      await pInter.waitForTimeout(400);
    }
  }

  await pInter.close();
  await ctxInter.close();

  // 5. DARK THEME COMPLETE AUDIT (Desktop 1440x900)
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
  await pDark.screenshot({ path: path.join(BASE_DIR, 'after', 'after_main_dark.png') });
  await copyToArtifacts('after', 'after_main_dark.png');

  const rowDark = pDark.locator('div[class*="rounded-xl"][class*="cursor-pointer"]').first();
  if (await rowDark.count() > 0) {
    await rowDark.click();
    await pDark.waitForTimeout(1000);
    await pDark.screenshot({ path: path.join(BASE_DIR, 'after', 'after_chat_dark.png') });
    await copyToArtifacts('after', 'after_chat_dark.png');
  }

  await pDark.close();
  await ctxDark.close();

  await browser.close();
  console.log('--- ALL PHASE 4.7 SCREENSHOTS CAPTURED AND PERSISTED SUCCESSFULLY ---');
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
