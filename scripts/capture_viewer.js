const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACTS_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\488a2d5f-72c4-43de-a15c-abbf8d7ca837';
const WORKSPACE_DIR = 'c:\\Users\\user\\Desktop\\becugram\\audit_screenshots';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

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
};

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  await page.addInitScript(
    ({ token, user }) => {
      localStorage.setItem('becugram_token', token);
      localStorage.setItem('becugram_user', JSON.stringify(user));
    },
    { token: adminToken, user: adminUser }
  );

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const chatItem = page.locator('div:has-text("Saqlanganlar")').last();
  await chatItem.click();
  await page.waitForTimeout(1000);

  // Click on the image container
  const img = page.locator('img[src*="/uploads/images/"]').first();
  await img.waitFor({ state: 'visible', timeout: 5000 });
  await img.click();
  await page.waitForTimeout(1200);

  const p1 = path.join(ARTIFACTS_DIR, 'phase4_09_fullscreen_media_viewer.png');
  const p2 = path.join(WORKSPACE_DIR, 'phase4_09_fullscreen_media_viewer.png');
  await page.screenshot({ path: p1 });
  fs.copyFileSync(p1, p2);
  console.log('Saved phase4_09_fullscreen_media_viewer.png');
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
