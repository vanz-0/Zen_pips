import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  await page.goto('http://localhost:3000');
  
  // Wait for the desktop nav links Journal button
  await page.waitForSelector('nav button');
  
  console.log('Clicking Journal Tab...');
  const buttons = await page.$$('nav button');
  let clicked = false;
  for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text === 'Journal') {
          await btn.click();
          clicked = true;
          break;
      }
  }
  
  if (clicked) {
    console.log('Clicked, waiting...');
    await new Promise(r => setTimeout(r, 3000));
  } else {
    console.log('Journal tab not found');
  }

  await browser.close();
})();
