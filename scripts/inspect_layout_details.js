const { chromium } = require('playwright');
const fs = require('fs');
const { signAccessToken } = require('../server/dist/utils/jwt.js');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const adminToken = signAccessToken({ userId: '6af0a01a7d27b76a8fee65f8', username: 'admin', role: 'admin' });
const adminUser = {
  _id: '6af0a01a7d27b76a8fee65f8', phoneNumber: '+998889008081', displayName: 'Admin', username: 'admin',
  avatar: '/uploads/images/1794157660529_b161afc1f3c88198d553a8425bced12a.jpg', bio: "BecuGram a'zosi 🚀",
  isOnline: true, isVerified: true, role: 'admin', isProfileComplete: true, createdAt: '2026-11-08T16:15:22.907Z',
};

async function testMobileAndDesktop() {
  const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });

  // 1. Inspect Desktop 1440
  const ctxDesktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const pDesktop = await ctxDesktop.newPage();
  await pDesktop.addInitScript(({ token, user }) => {
    localStorage.setItem('becugram_token', token);
    localStorage.setItem('becugram_user', JSON.stringify(user));
    localStorage.setItem('auth-storage', JSON.stringify({ state: { token, user, isAuthenticated: true }, version: 0 }));
  }, { token: adminToken, user: adminUser });

  await pDesktop.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await pDesktop.waitForTimeout(500);

  // click chat
  await pDesktop.locator('text=Aripov').or(pDesktop.locator('.chat-item-clickable')).first().click();
  await pDesktop.waitForTimeout(500);

  const desktopInfo = await pDesktop.evaluate(() => {
    const bubbles = Array.from(document.querySelectorAll('[id^="msg-"]')).map(el => {
      const rect = el.getBoundingClientRect();
      const bubbleEl = el.querySelector('[class*="rounded-"]');
      const bRect = bubbleEl ? bubbleEl.getBoundingClientRect() : rect;
      const computed = bubbleEl ? window.getComputedStyle(bubbleEl) : null;
      return {
        id: el.id,
        bubbleWidth: Math.round(bRect.width),
        bubbleHeight: Math.round(bRect.height),
        bgColor: computed ? computed.backgroundColor : '',
        borderRadius: computed ? computed.borderRadius : '',
        padding: computed ? computed.padding : '',
        fontSize: computed ? computed.fontSize : '',
      };
    });

    const composer = document.querySelector('form');
    const cRect = composer ? composer.getBoundingClientRect() : null;
    const cComputed = composer ? window.getComputedStyle(composer) : null;

    const chatPane = document.querySelector('.messages-layout, [class*="messagesContainer"], [class*="overflow-y-auto"]');
    const pComputed = chatPane ? window.getComputedStyle(chatPane) : null;

    return {
      bubblesCount: bubbles.length,
      sampleBubbles: bubbles.slice(0, 5),
      composer: {
        width: cRect ? Math.round(cRect.width) : 0,
        height: cRect ? Math.round(cRect.height) : 0,
      },
      chatPaneBg: pComputed ? pComputed.backgroundColor : '',
      bodyScrollWidth: document.body.scrollWidth,
      windowInnerWidth: window.innerWidth,
    };
  });

  console.log('--- Desktop 1440 Inspection ---');
  console.log(JSON.stringify(desktopInfo, null, 2));

  // 2. Inspect Mobile 390
  const ctxMobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const pMobile = await ctxMobile.newPage();
  await pMobile.addInitScript(({ token, user }) => {
    localStorage.setItem('becugram_token', token);
    localStorage.setItem('becugram_user', JSON.stringify(user));
    localStorage.setItem('auth-storage', JSON.stringify({ state: { token, user, isAuthenticated: true }, version: 0 }));
  }, { token: adminToken, user: adminUser });

  await pMobile.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await pMobile.waitForTimeout(500);

  // click chat
  await pMobile.locator('text=Aripov').or(pMobile.locator('.chat-item-clickable')).first().click();
  await pMobile.waitForTimeout(500);

  const mobileInfo = await pMobile.evaluate(() => {
    const composer = document.querySelector('form');
    const cRect = composer ? composer.getBoundingClientRect() : null;

    const header = document.querySelector('.h-14, [class*="Top Header"]');
    const hRect = header ? header.getBoundingClientRect() : null;

    return {
      bodyScrollWidth: document.body.scrollWidth,
      windowInnerWidth: window.innerWidth,
      hasHorizontalOverflow: document.body.scrollWidth > window.innerWidth,
      composerWidth: cRect ? Math.round(cRect.width) : 0,
      headerWidth: hRect ? Math.round(hRect.width) : 0,
    };
  });

  console.log('--- Mobile 390 Inspection ---');
  console.log(JSON.stringify(mobileInfo, null, 2));

  await browser.close();
}

testMobileAndDesktop().catch(console.error);
