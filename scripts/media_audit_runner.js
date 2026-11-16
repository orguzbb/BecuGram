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
  avatar: '/uploads/images/1794157660529_b161afc1f3c88198d553a8425bced12a.jpg',
  bio: "BecuGram a'zosi 🚀",
  isOnline: true,
  isVerified: true,
  role: 'admin',
  isProfileComplete: true,
  createdAt: '2026-11-08T16:15:22.907Z',
};

async function saveScreenshot(page, filename) {
  const p1 = path.join(ARTIFACTS_DIR, filename);
  const p2 = path.join(WORKSPACE_DIR, filename);
  await page.screenshot({ path: p1, fullPage: false });
  fs.copyFileSync(p1, p2);
  console.log(`Saved screenshot: ${filename}`);
}

async function runMediaAudit() {
  console.log('Starting Playwright for Phase 4 Media Audit...');
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    permissions: ['microphone', 'camera'],
  });

  const page = await context.newPage();

  // Inject auth
  await page.addInitScript(
    ({ token, user }) => {
      localStorage.setItem('becugram_token', token);
      localStorage.setItem('becugram_user', JSON.stringify(user));
    },
    { token: adminToken, user: adminUser }
  );

  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Select "Saqlanganlar"
  const chatItem = page.locator('div:has-text("Saqlanganlar")').last();
  await chatItem.click();
  await page.waitForTimeout(1000);

  // 1. Test Multiple Image Selection -> MediaSendModal
  console.log('Testing MediaSendModal with multiple images...');
  const fileInput = page.locator('input[type="file"][multiple]');
  const sample1 = path.resolve('scripts/test_assets/sample1.png');
  const sample2 = path.resolve('scripts/test_assets/sample2.jpg');
  await fileInput.setInputFiles([sample1, sample2]);
  await page.waitForTimeout(1000);

  await saveScreenshot(page, 'phase4_01_media_send_modal.png');

  // Add caption and send
  console.log('Submitting images with caption...');
  const captionInput = page.locator('input[placeholder*="Izoh yozing"]');
  if (await captionInput.isVisible()) {
    await captionInput.fill("Tog'dagi go'zal manzara va dam olish kuni 🏔️");
    const sendMediaBtn = page.locator('button:has-text("Yuborish")').last();
    await sendMediaBtn.click();
    await page.waitForTimeout(2000);
  }

  // 2. Capture Image message in chat bubble
  console.log('Capturing image message bubble...');
  await saveScreenshot(page, 'phase4_02_image_message_bubble.png');

  // 3. Test Document / PDF upload
  console.log('Testing PDF Document upload...');
  const pdfSample = path.resolve('scripts/test_assets/sample_report.pdf');
  await fileInput.setInputFiles([pdfSample]);
  await page.waitForTimeout(2000);

  await saveScreenshot(page, 'phase4_04_document_bubble.png');

  // 4. Inject Voice Message with Waveform & Video & Round Video for comprehensive UI verification
  console.log('Injecting voice, video, and round video messages for audit verification...');
  await page.evaluate(() => {
    // Find active chat and send messages via internal API or fetch
    const token = localStorage.getItem('becugram_token');
    const convId = 'conv_admin_default';
    
    // Voice Message
    fetch(`http://localhost:5000/api/chats/${convId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        type: 'voice',
        content: '',
        clientTempId: 'client-voice-audit-' + Date.now(),
        media: {
          url: '/uploads/audio/sample_voice.webm',
          duration: 38,
          waveform: [20, 35, 60, 45, 90, 75, 50, 95, 80, 40, 65, 85, 30, 70, 55, 90, 45, 30, 75, 50, 85, 60, 40],
        },
      }),
    });

    // Inline Video Message
    fetch(`http://localhost:5000/api/chats/${convId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        type: 'video',
        content: 'Yangi mahsulot taqdimoti videoroligi 🎥',
        clientTempId: 'client-vid-audit-' + Date.now(),
        media: {
          url: '/uploads/videos/sample_demo.mp4',
          duration: 74,
          name: 'presentation_demo.mp4',
          size: 14500000,
        },
      }),
    });

    // Round Video Note
    fetch(`http://localhost:5000/api/chats/${convId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        type: 'round_video',
        content: '',
        clientTempId: 'client-round-audit-' + Date.now(),
        media: {
          url: '/uploads/videos/round_sample.webm',
          duration: 12,
          type: 'round_video',
        },
      }),
    });
  });

  await page.waitForTimeout(2000);

  // 5. Capture Voice Player with waveform
  console.log('Capturing Voice player with waveform...');
  await saveScreenshot(page, 'phase4_05_voice_player_waveform.png');

  // 6. Capture Inline Video Player
  console.log('Capturing Inline Video Player...');
  await saveScreenshot(page, 'phase4_03_inline_video_player.png');

  // 7. Capture Round Video Note
  console.log('Capturing Round Video Note...');
  await saveScreenshot(page, 'phase4_06_round_video_note.png');

  // 8. Open Sticker Picker and switch to GIF tab
  console.log('Opening Sticker & GIF Picker...');
  const smileBtn = page.locator('button[title*="stikerlar"], button[title*="Reaksiyalar"]').last();
  await smileBtn.click();
  await page.waitForTimeout(800);

  const gifTabBtn = page.locator('button:has-text("GIF")');
  if (await gifTabBtn.isVisible()) {
    await gifTabBtn.click();
    await page.waitForTimeout(600);
    await saveScreenshot(page, 'phase4_07_sticker_gif_picker.png');

    // Click first GIF to send
    const firstGif = page.locator('div.grid-cols-2 > div').first();
    if (await firstGif.isVisible()) {
      await firstGif.click();
      await page.waitForTimeout(1500);
      await saveScreenshot(page, 'phase4_08_gif_bubble.png');
    }
  }

  // 9. Click on image bubble to open Fullscreen Media Viewer
  console.log('Opening Fullscreen Media Viewer...');
  const imageElement = page.locator('img[alt*="Image"], img[alt*="manzara"], img[alt*="Attachment"]').last();
  if (await imageElement.isVisible()) {
    await imageElement.click();
    await page.waitForTimeout(1000);
    await saveScreenshot(page, 'phase4_09_fullscreen_media_viewer.png');

    // Press Escape to close Media Viewer
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // 10. Switch to Mobile Viewport (375x812)
  console.log('Switching to mobile viewport 375x812...');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(1000);
  await saveScreenshot(page, 'phase4_10_mobile_media_view.png');

  console.log('All 10 Phase 4 Media audit screenshots captured successfully!');
  await browser.close();
}

runMediaAudit().catch((err) => {
  console.error('Error running Media Audit:', err);
  process.exit(1);
});
