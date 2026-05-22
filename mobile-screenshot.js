const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();

  console.log('1. Navigating to http://localhost:81...');
  await page.goto('http://localhost:81', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Click the Sign In tab first to make sure we're on the right form
  const signInTab = await page.$('button:has-text("Sign In"):not([class*="gradient"])');
  if (signInTab) {
    console.log('Clicking Sign In tab...');
    await signInTab.click();
    await page.waitForTimeout(1000);
  }

  // Fill in the login form
  const emailInput = await page.$('input[type="email"], input[name="email"], input[placeholder*="email" i], input[placeholder*="Email"]');
  const passwordInput = await page.$('input[type="password"], input[name="password"], input[placeholder*="password" i], input[placeholder*="Password"]');
  
  if (emailInput && passwordInput) {
    console.log('2. Filling login credentials...');
    await emailInput.click();
    await emailInput.fill('nickjoseph8087@gmail.com');
    await page.waitForTimeout(500);
    await passwordInput.click();
    await passwordInput.fill('Weareone504');
    await page.waitForTimeout(500);
    
    // Click the gradient Sign In button (the actual submit button)
    const submitBtn = await page.$('button.w-full:has-text("Sign In")');
    if (submitBtn) {
      console.log('Clicking submit Sign In button...');
      await submitBtn.click();
    } else {
      console.log('No submit button found, pressing Enter...');
      await passwordInput.press('Enter');
    }
    
    // Wait for navigation after login
    await page.waitForTimeout(6000);
    console.log(`URL after login attempt: ${page.url()}`);
  }

  // Take a debug screenshot to see if login worked
  await page.screenshot({ path: '/home/z/my-project/upload/debug-after-login.png', fullPage: false });

  // Check if login succeeded or if we're still on the login page
  const signInButtons = await page.$$('button:has-text("Sign In")');
  const hasLoginForm = await page.$('input[type="password"]');
  
  if (hasLoginForm && signInButtons.length > 0) {
    console.log('Login may have failed. Trying with a demo user instead...');
    // Try clicking one of the demo user buttons
    const demoBtn = await page.$('button:has-text("Zara")');
    if (demoBtn) {
      console.log('Clicking demo user Zara...');
      await demoBtn.click();
      await page.waitForTimeout(5000);
      console.log(`URL after demo login: ${page.url()}`);
    }
  }

  await page.screenshot({ path: '/home/z/my-project/upload/debug-after-demo.png', fullPage: false });

  // Dismiss modals
  console.log('3. Dismissing modals...');
  await page.waitForTimeout(2000);

  // Try multiple dismiss approaches
  const tryDismiss = async () => {
    const selectors = [
      'button:has-text("Let\'s Go")',
      'button:has-text("Skip")',
      'button:has-text("Close")',
      'button:has-text("Got it")',
      'button:has-text("Not Now")',
      'button:has-text("Maybe Later")',
      'button:has-text("X")',
      '[aria-label="Close"]',
      '[aria-label="close"]',
      '[class*="close" i]',
    ];
    for (const sel of selectors) {
      try {
        const el = await page.$(sel);
        if (el && await el.isVisible().catch(() => false)) {
          console.log(`Dismissing with: ${sel}`);
          await el.click().catch(() => {});
          await page.waitForTimeout(1500);
          return true;
        }
      } catch (e) {}
    }
    await page.keyboard.press('Escape');
    return false;
  };

  await tryDismiss();
  await page.waitForTimeout(1000);

  // Take home screenshot
  console.log('6. Taking mobile home screenshot...');
  await page.screenshot({ path: '/home/z/my-project/upload/mobile-home.png', fullPage: false });
  console.log('Home screenshot saved.');

  // Now let's explore the page structure to find the profile
  const allInteractive = await page.evaluate(() => {
    const results = [];
    document.querySelectorAll('button, a, img, [role="button"], [role="tab"]').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        results.push({
          tag: el.tagName,
          class: el.className?.toString()?.substring(0, 120),
          text: el.textContent?.trim()?.substring(0, 80),
          href: el.href || '',
          src: el.src?.substring(0, 120) || '',
          alt: el.alt || '',
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          w: Math.round(rect.width),
          h: Math.round(rect.height),
          ariaLabel: el.getAttribute('aria-label') || '',
          id: el.id || '',
        });
      }
    });
    return results;
  });
  
  console.log('\n=== All interactive elements ===');
  allInteractive.forEach(el => console.log(JSON.stringify(el)));

  // Look for profile tab/navigation
  console.log('\n7. Looking for profile navigation...');
  
  // Check for bottom navigation bar
  const bottomNav = await page.evaluate(() => {
    const nav = document.querySelector('nav, [class*="bottom-nav" i], [class*="BottomNav"], [class*="tab-bar" i], [class*="TabBar"], [class*="navigation" i]');
    if (nav) {
      const rect = nav.getBoundingClientRect();
      return { x: rect.x, y: rect.y, w: rect.width, h: rect.height, html: nav.innerHTML?.substring(0, 500) };
    }
    return null;
  });
  console.log('Bottom nav:', JSON.stringify(bottomNav));

  // Look for a profile/person icon in bottom nav or header
  // Common patterns: 5 tabs at bottom (Home, Search, Create, Notifications, Profile)
  
  // Strategy: Look for profile-related elements and click them
  let profileNavigated = false;

  // Try clicking all nav items to find profile
  const navButtons = await page.$$('nav button, nav a, [class*="nav"] button, [class*="Nav"] button, [role="tab"]');
  console.log(`Found ${navButtons.length} navigation buttons`);
  
  for (let i = 0; i < navButtons.length; i++) {
    const btn = navButtons[i];
    const text = await btn.textContent().catch(() => '').then(t => t.trim());
    const ariaLabel = await btn.getAttribute('aria-label').catch(() => '');
    console.log(`Nav button ${i}: text="${text}" aria-label="${ariaLabel}"`);
    
    if (text.toLowerCase().includes('profile') || ariaLabel.toLowerCase().includes('profile') || 
        text.toLowerCase().includes('me') || text.toLowerCase().includes('account')) {
      console.log(`Clicking profile nav button ${i}...`);
      await btn.click();
      profileNavigated = true;
      await page.waitForTimeout(3000);
      break;
    }
  }

  // If still not found, try clicking in the bottom-right area (common profile position)
  if (!profileNavigated) {
    console.log('Trying bottom-right area for profile tab...');
    // In a typical mobile app, profile is the rightmost tab
    await page.mouse.click(340, 780); // Bottom right of iPhone viewport
    await page.waitForTimeout(3000);
  }

  console.log(`Current URL: ${page.url()}`);
  
  // Dismiss any new modals
  await tryDismiss();
  await page.waitForTimeout(2000);

  // Take profile screenshot
  console.log('9. Taking profile screenshots...');
  await page.screenshot({ path: '/home/z/my-project/upload/mobile-profile.png', fullPage: false });
  console.log('Profile screenshot saved.');

  // Scroll and capture more
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/home/z/my-project/upload/mobile-profile-scroll1.png', fullPage: false });

  await page.evaluate(() => window.scrollTo(0, 800));
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/home/z/my-project/upload/mobile-profile-scroll2.png', fullPage: false });

  // Full page
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/home/z/my-project/upload/mobile-profile-fullpage.png', fullPage: true });

  await browser.close();
  console.log('\n=== FINAL SCREENSHOT PATHS ===');
  console.log('Home: /home/z/my-project/upload/mobile-home.png');
  console.log('Profile: /home/z/my-project/upload/mobile-profile.png');
  console.log('Profile fullpage: /home/z/my-project/upload/mobile-profile-fullpage.png');
})();
