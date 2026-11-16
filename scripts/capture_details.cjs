const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\488a2d5f-72c4-43de-a15c-abbf8d7ca837';
const LOCAL_DIR = path.resolve('audit_screenshots', 'phase4_6');

async function capture() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  // login if needed
  const userInput = page.locator('input[type="text"]').first();
  if (await userInput.isVisible()) {
    await userInput.fill('testuser1');
    const passInput = page.locator('input[type="password"]').first();
    await passInput.fill('password123');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(2000);
  }

  // Open first chat
  const chatItem = page.locator('div[class*="cursor-pointer"]').first();
  if (await chatItem.isVisible()) {
    await chatItem.click();
    await page.waitForTimeout(1000);
  }

  // Find composer element
  const composer = page.locator('div[class*="max-w-[720px]"]').first();
  if (await composer.isVisible()) {
    const composerBuf = await composer.screenshot();
    fs.writeFileSync(path.join(LOCAL_DIR, 'becugram_composer.png'), composerBuf);
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'becugram_composer.png'), composerBuf);
    console.log('Captured becugram_composer.png');
  }

  // Click emoji/sticker button
  const smileBtn = page.locator('button').filter({ has: page.locator('svg.lucide-smile') }).first();
  if (await smileBtn.isVisible()) {
    await smileBtn.click();
    await page.waitForTimeout(1000);
    const pickerBuf = await page.screenshot();
    fs.writeFileSync(path.join(LOCAL_DIR, 'becugram_picker.png'), pickerBuf);
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'becugram_picker.png'), pickerBuf);
    console.log('Captured becugram_picker.png');
  }

  await browser.close();
  console.log('Done detail captures');
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});
