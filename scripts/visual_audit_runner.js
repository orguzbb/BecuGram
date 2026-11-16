const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACTS_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\488a2d5f-72c4-43de-a15c-abbf8d7ca837';
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

async function runVisualAudit() {
  console.log('Starting Playwright browser for Visual Audit...');
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  // Inject authentication into localStorage prior to navigation
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

  // Click on "Saqlanganlar" in the chat list
  console.log('Selecting Saqlanganlar chat from list...');
  const chatItem = page.locator('div:has-text("Saqlanganlar")').last();
  await chatItem.click();
  await page.waitForTimeout(1000);

  // 1. Capture Main Chat View
  console.log('Capturing audit_01_chat_view.png...');
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'audit_01_chat_view.png'),
    fullPage: false,
  });

  // 2. Send test message
  console.log('Sending test message...');
  const input = page.locator('input[placeholder*="Xabar"], input[type="text"]').last();
  await input.waitFor({ state: 'visible', timeout: 5000 });
  await input.fill('Salom! Bu BecuGram Phase 3 vizual audit testi 🚀');
  await input.press('Enter');
  await page.waitForTimeout(1000);

  // Capture Bubble Layout
  console.log('Capturing audit_02_bubble_incoming_outgoing.png...');
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'audit_02_bubble_incoming_outgoing.png'),
    fullPage: false,
  });

  // 3. Open Context Menu on the sent message
  console.log('Opening Context Menu on sent message...');
  const lastBubble = page.locator('div[id^="msg-"] > div.cursor-pointer').last();
  await lastBubble.scrollIntoViewIfNeeded();
  await lastBubble.click({ button: 'right' });
  await page.waitForTimeout(800);

  console.log('Capturing audit_05_context_menu_reactions.png...');
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'audit_05_context_menu_reactions.png'),
    fullPage: false,
  });

  // 4. Click 'Javob berish' (Reply)
  console.log('Testing Reply action...');
  const replyBtn = page.locator('button:has-text("Javob berish")');
  await replyBtn.waitFor({ state: 'visible', timeout: 5000 });
  await replyBtn.click();
  await page.waitForTimeout(600);

  console.log('Capturing audit_03_reply_input_bar.png...');
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'audit_03_reply_input_bar.png'),
    fullPage: false,
  });

  // Send reply
  await input.fill('Bu iqtibos qilingan xabarga berilgan javob! 💬');
  await input.press('Enter');
  await page.waitForTimeout(1000);

  console.log('Capturing audit_04_reply_in_bubble.png...');
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'audit_04_reply_in_bubble.png'),
    fullPage: false,
  });

  // 5. Test Edit Message
  console.log('Testing Edit action...');
  const replyBubble = page.locator('div[id^="msg-"] > div.cursor-pointer').last();
  await replyBubble.click({ button: 'right' });
  await page.waitForTimeout(600);

  const editBtn = page.locator('button:has-text("Tahrirlash")');
  await editBtn.waitFor({ state: 'visible', timeout: 5000 });
  await editBtn.click();
  await page.waitForTimeout(500);

  await input.fill('Bu tahrirlangan xabar matni (muvaffaqiyatli!) ✏️');
  await input.press('Enter');
  await page.waitForTimeout(1000);

  console.log('Capturing audit_08_edited_message.png...');
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'audit_08_edited_message.png'),
    fullPage: false,
  });

  // 6. Test Reactions
  console.log('Testing Reactions...');
  const targetBubble = page.locator('div[id^="msg-"] > div.cursor-pointer').last();
  await targetBubble.click({ button: 'right' });
  await page.waitForTimeout(600);

  // Click a reaction button in context menu
  const reactBtn = page.locator('.grid button').first();
  await reactBtn.waitFor({ state: 'visible', timeout: 5000 });
  await reactBtn.click();
  await page.waitForTimeout(1000);

  console.log('Capturing audit_06_reaction_capsule.png...');
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'audit_06_reaction_capsule.png'),
    fullPage: false,
  });

  // 7. Test Pin Message
  console.log('Testing Pin action...');
  await targetBubble.click({ button: 'right' });
  await page.waitForTimeout(600);

  const pinBtn = page.locator('button:has-text("Qadash")');
  await pinBtn.waitFor({ state: 'visible', timeout: 5000 });
  await pinBtn.click();
  await page.waitForTimeout(1000);

  console.log('Capturing audit_07_pinned_message_banner.png...');
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'audit_07_pinned_message_banner.png'),
    fullPage: false,
  });

  // 8. Test Forward Modal & Complete Forward
  console.log('Testing Forward modal...');
  await targetBubble.click({ button: 'right' });
  await page.waitForTimeout(600);

  const forwardBtn = page.locator('button:has-text("Uzatish")');
  await forwardBtn.waitFor({ state: 'visible', timeout: 5000 });
  await forwardBtn.click();
  await page.waitForTimeout(800);

  console.log('Capturing audit_09_forward_modal.png...');
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'audit_09_forward_modal.png'),
    fullPage: false,
  });

  // Click on the destination chat inside the forward modal to complete forwarding
  console.log('Selecting forward destination chat...');
  const destinationChat = page.locator('.divide-y > div, div:has-text("Saqlanganlar")').last();
  await destinationChat.click();
  await page.waitForTimeout(1200);

  console.log('Capturing audit_10_forwarded_message.png...');
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'audit_10_forwarded_message.png'),
    fullPage: false,
  });

  // 9. Test Delete Confirmation Modal
  console.log('Testing Delete modal...');
  const bubbleToDelete = page.locator('div[id^="msg-"] > div.cursor-pointer').last();
  await bubbleToDelete.scrollIntoViewIfNeeded();
  await bubbleToDelete.click({ button: 'right' });
  await page.waitForTimeout(600);

  const deleteBtn = page.locator('button:has-text("O‘chirish"), button:has-text("O\'chirish")');
  await deleteBtn.waitFor({ state: 'visible', timeout: 5000 });
  await deleteBtn.click();
  await page.waitForTimeout(800);

  console.log('Capturing audit_11_delete_modal.png...');
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'audit_11_delete_modal.png'),
    fullPage: false,
  });

  // Cancel deletion
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // 10. Test Mobile Viewport
  console.log('Testing Mobile Viewport (375x812)...');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(800);

  console.log('Capturing audit_12_mobile_view.png...');
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'audit_12_mobile_view.png'),
    fullPage: false,
  });

  await browser.close();
  console.log('Visual audit finished successfully! All 12 screenshots saved.');
}

runVisualAudit().catch((err) => {
  console.error('Visual audit runner error:', err);
  process.exit(1);
});
