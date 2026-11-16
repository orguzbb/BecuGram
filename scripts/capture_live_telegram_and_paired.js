const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\488a2d5f-72c4-43de-a15c-abbf8d7ca837';
const PAIRED_DIR = path.join(ARTIFACTS_DIR, 'rea_paired');

if (!fs.existsSync(PAIRED_DIR)) {
  fs.mkdirSync(PAIRED_DIR, { recursive: true });
}

async function main() {
  console.log('Connecting to live Telegram Web A over CDP...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const contexts = browser.contexts();
  const pages = contexts[0].pages();
  const page = pages.find(p => p.url().includes('telegram.org')) || pages[0];

  await page.setViewportSize({ width: 1440, height: 900 });
  const tgScreenshotPath = path.join(PAIRED_DIR, 'real_telegram_web_a.png');
  await page.screenshot({ path: tgScreenshotPath });
  console.log('Saved real Telegram Web A screenshot to', tgScreenshotPath);

  // Copy BecuGram screenshots to artifacts for user viewing
  const becuScreens = [
    '01_rebuilt_main_light.png',
    '02_rebuilt_chat_grouped_bubbles.png',
    '03_rebuilt_hamburger_drawer.png',
    '04_rebuilt_sticker_picker.png',
    '05_rebuilt_dark_chat.png',
    '06_rebuilt_mobile_list.png',
    '07_rebuilt_mobile_chat.png'
  ];

  for (const s of becuScreens) {
    const src = path.join(__dirname, '..', 'audit_screenshots', 'overhaul', s);
    if (fs.existsSync(src)) {
      const dest = path.join(PAIRED_DIR, 'becugram_' + s);
      fs.copyFileSync(src, dest);
      console.log('Copied', s, 'to', dest);
    }
  }
}

main().catch(err => console.error(err));
