const { chromium } = require('playwright');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  console.log('--- Inspecting Telegram Web A Root & Architecture ---');
  await page.goto('https://web.telegram.org/a/', { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(5000);

  const webAData = await page.evaluate(() => {
    // Collect all class names in DOM
    const classes = new Set();
    const tags = new Set();
    document.querySelectorAll('*').forEach(el => {
      tags.add(el.tagName);
      if (el.className && typeof el.className === 'string') {
        el.className.split(/\s+/).forEach(c => {
          if (c) classes.add(c);
        });
      }
    });

    const rootChildren = Array.from(document.body.children).map(c => ({
      tag: c.tagName,
      id: c.id,
      className: c.className,
      rect: c.getBoundingClientRect()
    }));

    // Find main container elements
    const mainEls = Array.from(document.querySelectorAll('div[class*="main"], div[class*="container"], div[id*="main"], #root, #MiddleColumn, #LeftColumn, .LeftColumn, .MiddleColumn')).map(el => ({
      id: el.id,
      className: el.className,
      rect: el.getBoundingClientRect(),
      computedBg: window.getComputedStyle(el).backgroundColor,
      computedWidth: window.getComputedStyle(el).width,
      computedHeight: window.getComputedStyle(el).height,
    }));

    return {
      title: document.title,
      rootChildren,
      mainEls: mainEls.slice(0, 20),
      sampleClasses: Array.from(classes).filter(c => !c.startsWith('css-')).slice(0, 100),
      bodyStyles: {
        fontFamily: window.getComputedStyle(document.body).fontFamily,
        fontSize: window.getComputedStyle(document.body).fontSize,
        lineHeight: window.getComputedStyle(document.body).lineHeight,
        color: window.getComputedStyle(document.body).color,
        backgroundColor: window.getComputedStyle(document.body).backgroundColor
      }
    };
  });

  console.log('Web A Data:', JSON.stringify(webAData, null, 2));

  console.log('--- Inspecting Telegram Public Channel for Real Message Components ---');
  await page.goto('https://t.me/s/telegram', { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(4000);

  const tmeData = await page.evaluate(() => {
    const msg = document.querySelector('.tgme_widget_message_wrap');
    if (!msg) return { error: 'No message found' };
    const bubble = msg.querySelector('.tgme_widget_message_bubble');
    const text = msg.querySelector('.tgme_widget_message_text');
    const footer = msg.querySelector('.tgme_widget_message_footer');
    const photo = msg.querySelector('.tgme_widget_message_photo_wrap');

    return {
      bubbleStyles: bubble ? {
        borderRadius: window.getComputedStyle(bubble).borderRadius,
        padding: window.getComputedStyle(bubble).padding,
        backgroundColor: window.getComputedStyle(bubble).backgroundColor,
        boxShadow: window.getComputedStyle(bubble).boxShadow,
      } : null,
      textStyles: text ? {
        fontFamily: window.getComputedStyle(text).fontFamily,
        fontSize: window.getComputedStyle(text).fontSize,
        lineHeight: window.getComputedStyle(text).lineHeight,
        color: window.getComputedStyle(text).color,
      } : null,
      footerStyles: footer ? {
        fontSize: window.getComputedStyle(footer).fontSize,
        color: window.getComputedStyle(footer).color,
      } : null
    };
  });

  console.log('t.me Data:', JSON.stringify(tmeData, null, 2));

  await browser.close();
})();
