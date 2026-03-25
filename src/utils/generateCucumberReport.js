const report = require('multiple-cucumber-html-reporter');
const path = require('path');

report.generate({
  jsonDir: 'reports',
  reportPath: 'reports/html-report',
  metadata: {
    browser: {
      name: process.env.BROWSER || 'chromium',
      version: 'latest',
    },
    device: 'Local Machine',
    platform: {
      name: process.platform,
    },
  },
  customData: {
    title: 'BDD Playwright Test Report',
    data: [
      { label: 'Framework', value: 'Playwright + Cucumber BDD' },
      { label: 'Language', value: 'TypeScript' },
      { label: 'Executed', value: new Date().toLocaleString() },
    ],
  },
});

console.log('📊 HTML Report generated at: reports/html-report/index.html');
