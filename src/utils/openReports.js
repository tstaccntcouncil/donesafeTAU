// open-reports.js
// Launches two browser windows to display test reports after `npm test` completes.
// Requires @playwright/test to be installed.
// Usage: node open-reports.js  (or chained via npm test in package.json)

const { chromium } = require('@playwright/test');
const path = require('path');

// ─── Configuration ────────────────────────────────────────────────────────────
const REPORTS = [
  {
    label: 'Cucumber Report',
    // Relative path from project root – adjust if your outputFolder differs
    url: `file://${path.resolve(__dirname, '../../reports/cucumber-report.html')}`,
  },
  {
    label: 'Playwright BDD Analyzer Report',
    // Allure serves on a local port; swap for a file:// path if you pre-build it
    //url: 'http://localhost:12345/index.html',
    url: `file://${path.resolve(__dirname, '../../playwright-bdd-report.html')}`,
  },
];

// How long (ms) to keep the report browsers open before auto-closing.
// Set to 0 to keep them open until the process is killed manually.
const AUTO_CLOSE_AFTER_MS = 0;
// ─────────────────────────────────────────────────────────────────────────────

async function openReports() {
  console.log('\n📊  Opening test reports...\n');

  const browsers = [];

  for (const report of REPORTS) {
    try {
      const browser = await chromium.launch({
        headless: false,
        args: [
          '--start-maximized',         // open maximised
          `--window-position=${browsers.length * 960},0`, // tile side-by-side
        ],
      });

      const context = await browser.newContext({
        viewport: null, // respect the OS window size
      });

      const page = await context.newPage();
      await page.goto(report.url, { waitUntil: 'domcontentloaded' });
      await page.bringToFront();

      console.log(`  ✅  ${report.label}`);
      console.log(`      ${report.url}\n`);

      browsers.push(browser);
    } catch (err) {
      console.error(`  ❌  Failed to open "${report.label}": ${err.message}\n`);
    }
  }

  if (browsers.length === 0) {
    console.error('No report browsers were opened. Exiting.');
    process.exit(1);
  }

  if (AUTO_CLOSE_AFTER_MS > 0) {
    console.log(`\n⏱   Browsers will close automatically in ${AUTO_CLOSE_AFTER_MS / 1000}s.`);
    console.log('    Press Ctrl+C to close them now.\n');
    await new Promise((resolve) => setTimeout(resolve, AUTO_CLOSE_AFTER_MS));
    await closeAll(browsers);
  } else {
    console.log('ℹ️   Browsers will stay open until you close them or press Ctrl+C.\n');
    // Keep the Node process alive until the user interrupts
    await new Promise((resolve) => {
      process.on('SIGINT', async () => {
        console.log('\n\n🛑  Closing report browsers...');
        await closeAll(browsers);
        resolve();
      });
    });
  }
}

async function closeAll(browsers) {
  for (const browser of browsers) {
    try {
      await browser.close();
    } catch {
      // already closed – ignore
    }
  }
  console.log('✔   Done.\n');
}

openReports().catch((err) => {
  console.error('Unexpected error in open-reports.js:', err);
  process.exit(1);
});
