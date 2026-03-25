#!/usr/bin/env node

/**
 * generate-readme.js
 * Auto-generates README.md based on your BDD Playwright project structure.
 *
 * Usage:
 *   node src/utils/generate-readme.js
 *   node src/utils/generate-readme.js --dry-run   (preview without writing)
 */

const fs   = require('fs');
const path = require('path');

// ─── Config ───────────────────────────────────────────────────────────────────

const args    = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const ROOT    = process.cwd();  // always run from project root
const OUTPUT  = path.join(ROOT, 'README.md');

// ─── Project-specific paths ───────────────────────────────────────────────────

const PATHS = {
  features:   'features',
  data:       'src/data',
  hooks:      'src/hooks',
  pages:      'src/pages',
  steps:      'src/steps',
  utils:      'src/utils',
  reports:    'reports',
  cucumber:   'cucumber.js',
  envExample: '.env.example',
  tsconfig:   'tsconfig.json',
  packageJson: 'package.json',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function readFile(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, 'utf8');
}

function collect(dir, exts = ['.ts', '.js', '.json', '.feature']) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  const results = [];
  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (exts.includes(path.extname(entry.name))) {
        results.push(path.relative(ROOT, full));
      }
    }
  }
  walk(abs);
  return results.sort();
}

function readPackageJson() {
  try { return JSON.parse(readFile(PATHS.packageJson)); } catch { return null; }
}

function detectPM() {
  if (exists('yarn.lock'))       return 'yarn';
  if (exists('pnpm-lock.yaml'))  return 'pnpm';
  return 'npm';
}

/** Extract Scenario names from a .feature file */
function extractScenarios(filePath) {
  const src = readFile(filePath);
  if (!src) return [];
  return [...src.matchAll(/^\s*(?:Scenario|Scenario Outline):\s*(.+)$/gm)]
    .map(m => m[1].trim());
}

/** Extract step definitions (Given/When/Then) from a steps file */
function extractSteps(filePath) {
  const src = readFile(filePath);
  if (!src) return [];
  const matches = [...src.matchAll(/(?:Given|When|Then|And)\s*\(\s*['"`\/]([^'"`\/]{3,60})/g)];
  return [...new Set(matches.map(m => m[1].trim()))].slice(0, 5);
}

/** Extract public async methods from a TypeScript class */
function extractMethods(filePath) {
  const src = readFile(filePath);
  if (!src) return [];
  return [...src.matchAll(/(?:async\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*\S+\s*)?\{/g)]
    .map(m => m[1])
    .filter(m => !['constructor', 'beforeAll', 'afterAll', 'if', 'for', 'while'].includes(m))
    .slice(0, 5);
}

function lineCount(filePath) {
  try { return readFile(filePath)?.split('\n').length || 0; } catch { return 0; }
}

// ─── Badges ───────────────────────────────────────────────────────────────────

function makeBadges(pkg) {
  const badges = [];

  const pw = pkg?.devDependencies?.['@playwright/test'] || pkg?.dependencies?.['@playwright/test'];
  if (pw) badges.push(`![Playwright](https://img.shields.io/badge/Playwright-${pw.replace(/[^0-9.]/g, '')}-2EAD33?logo=playwright&logoColor=white)`);

  const cu = pkg?.devDependencies?.['@cucumber/cucumber'] || pkg?.dependencies?.['@cucumber/cucumber'];
  if (cu) badges.push(`![Cucumber](https://img.shields.io/badge/Cucumber-${cu.replace(/[^0-9.]/g, '')}-23D96C?logo=cucumber&logoColor=white)`);

  const ts = pkg?.devDependencies?.typescript || pkg?.dependencies?.typescript;
  if (ts) badges.push(`![TypeScript](https://img.shields.io/badge/TypeScript-blue?logo=typescript&logoColor=white)`);

  const node = pkg?.engines?.node;
  if (node) badges.push(`![Node](https://img.shields.io/badge/Node-${node.replace(/[^0-9.x]/g, '')}-339933?logo=node.js&logoColor=white)`);

  badges.push(`![License](https://img.shields.io/badge/License-${(pkg?.license || 'MIT').replace(/-/g, '--')}-blue)`);

  return badges.join(' ');
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function sectionOverview(pkg) {
  const name = pkg?.name || 'bdd-playwright';
  const desc = pkg?.description || 'BDD end-to-end test suite built with Playwright and Cucumber.';
  return `# ${name}

${desc}

${makeBadges(pkg)}
`;
}

function sectionTableOfContents() {
  return `## Table of Contents

- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Running Tests](#running-tests)
- [Feature Files](#feature-files)
- [Step Definitions](#step-definitions)
- [Page Objects](#page-objects)
- [Test Data](#test-data)
- [Hooks](#hooks)
- [Utilities](#utilities)
- [Reports](#reports)
- [npm Scripts](#npm-scripts)
- [CI/CD](#cicd)
`;
}

function sectionGettingStarted(pkg) {
  const pm      = detectPM();
  const install = pm === 'yarn' ? 'yarn' : `${pm} install`;

  return `## Getting Started

### Prerequisites

- Node.js ${pkg?.engines?.node || '>=18'}
- ${pm} package manager

### Installation

\`\`\`bash
git clone <repo-url>
cd ${pkg?.name || 'bdd-playwright'}

# Install dependencies
${install}

# Install Playwright browsers
npx playwright install --with-deps
\`\`\`

### Environment Variables

\`\`\`bash
cp .env.example .env
\`\`\`

| Variable     | Description            | Default                  |
|---|---|---|
| \`BASE_URL\`   | Application base URL   | \`http://localhost:3000\` |
| \`BROWSER\`    | Browser to use         | \`chromium\`             |
| \`HEADLESS\`   | Run headless           | \`true\`                 |
| \`ENV\`        | Target environment     | \`dev\`                  |
`;
}

function sectionProjectStructure(pkg) {
  const name = pkg?.name || 'bdd-playwright';

  const entries = [
    ['.vscode/',              'VS Code workspace settings & tasks'],
    ['.vscode/tasks.json',    'Tasks for generating README and running tests'],
    ['.vscode/settings.json', 'Workspace settings (Run on Save, etc.)'],
    ['features/',             'Gherkin BDD feature files'],
    ['src/',                  'All source code'],
    ['src/data/',             'Test data (JSON) and typed loader'],
    ['src/hooks/',            'Cucumber Before/After hooks'],
    ['src/pages/',            'Playwright Page Object Models'],
    ['src/steps/',            'Cucumber step definitions'],
    ['src/utils/',            'Browser manager, env config, report utils'],
    ['reports/',              'Generated HTML reports & screenshots (git-ignored)'],
    ['.env.example',          'Environment variable template'],
    ['cucumber.js',           'Cucumber runner configuration'],
    ['package.json',          'Project manifest & scripts'],
    ['tsconfig.json',         'TypeScript configuration'],
  ];

  // Always show .vscode entries regardless of whether they exist yet
  const alwaysShow = ['.vscode/', '.vscode/tasks.json', '.vscode/settings.json'];

  const lines = entries
    .filter(([rel]) => alwaysShow.includes(rel) || exists(rel))
    .map(([rel, desc]) => {
      const pad = ' '.repeat(Math.max(1, 32 - rel.length));
      return `│   ├── ${rel}${pad}# ${desc}`;
    });

  return `## Project Structure

\`\`\`
${name}/
${lines.join('\n')}
\`\`\`
`;
}

function sectionConfiguration() {
  const cucumberSrc = readFile(PATHS.cucumber);
  const envSrc      = readFile(PATHS.envExample);

  const cucumberBlock = cucumberSrc
    ? `### Cucumber (\`cucumber.js\`)\n\n\`\`\`js\n${cucumberSrc.trim()}\n\`\`\`\n`
    : '';

  const envBlock = envSrc
    ? `### Environment Variables (\`.env.example\`)\n\n\`\`\`bash\n${envSrc.trim()}\n\`\`\`\n`
    : '';

  return `## Configuration

${cucumberBlock}
${envBlock}`;
}

function sectionRunningTests(pkg) {
  const pm  = detectPM();
  const run = pm === 'yarn' ? 'yarn' : `${pm} run`;
  const scripts = pkg?.scripts || {};
  const reportCmd = scripts.report ? `${run} report` : 'node src/utils/generateReport.js';

  return `## Running Tests

\`\`\`bash
# Run all scenarios
${run} test

# Run in a specific environment
ENV=staging ${run} test

# Run headed (see the browser)
HEADLESS=false ${run} test

# Generate HTML report after run
${reportCmd}
\`\`\`
`;
}

function sectionFeatureFiles() {
  const features = collect(PATHS.features, ['.feature']);
  if (!features.length) return `## Feature Files\n\n_No \`.feature\` files found._\n`;

  const rows = features.map(f => {
    const scenarios = extractScenarios(f);
    const preview   = scenarios.length
      ? scenarios.slice(0, 3).map(s => `\`${s}\``).join(', ')
      : '—';
    return `| \`${f}\` | ${scenarios.length} | ${preview} |`;
  });

  return `## Feature Files

Written in **Gherkin** syntax. All test data is externalised to \`src/data/testData.json\` — no inline data tables in feature files.

| File | Scenarios | Sample Scenarios |
|---|---|---|
${rows.join('\n')}
`;
}

function sectionStepDefinitions() {
  const steps = collect(PATHS.steps, ['.ts', '.js']);
  if (!steps.length) return `## Step Definitions\n\n_No step files found._\n`;

  const rows = steps.map(f => {
    const names   = extractSteps(f);
    const preview = names.length ? names.slice(0, 3).map(n => `\`${n}\``).join(', ') : '—';
    return `| \`${f}\` | ${lineCount(f)} | ${preview} |`;
  });

  return `## Step Definitions

Cucumber step definitions that map Gherkin steps to Playwright page actions.

| File | Lines | Sample Steps |
|---|---|---|
${rows.join('\n')}
`;
}

function sectionPageObjects() {
  const pages = collect(PATHS.pages, ['.ts']);
  if (!pages.length) return `## Page Objects\n\n_No page object files found._\n`;

  const rows = pages.map(f => {
    const methods  = extractMethods(f);
    const isBase   = path.basename(f).startsWith('Base');
    const preview  = methods.length ? methods.map(m => `\`${m}()\``).join(', ') : '—';
    const type     = isBase ? '🧱 Base' : '📄 Page';
    return `| \`${f}\` | ${type} | ${preview} |`;
  });

  return `## Page Objects

All page objects extend \`BasePage\` which provides shared Playwright helpers (waits, clicks, fills, assertions).

| File | Type | Key Methods |
|---|---|---|
${rows.join('\n')}
`;
}

function sectionTestData() {
  const dataFiles = collect(PATHS.data, ['.json', '.ts', '.js']);
  if (!dataFiles.length) return `## Test Data\n\n_No test data files found._\n`;

  let jsonPreview = '';
  const jsonFile  = dataFiles.find(f => f.endsWith('.json'));
  if (jsonFile) {
    try {
      const data = JSON.parse(readFile(jsonFile));
      const keys = Object.keys(data).slice(0, 8);
      jsonPreview = `\n**Top-level keys in \`${jsonFile}\`:** ${keys.map(k => `\`${k}\``).join(', ')}\n`;
    } catch {}
  }

  const rows = dataFiles.map(f => {
    const desc = f.endsWith('.json')
      ? 'Centralised test data (no hardcoded values in steps or features)'
      : 'Typed loader with helper methods for accessing test data';
    return `| \`${f}\` | ${desc} |`;
  });

  return `## Test Data

All test data lives in \`src/data/\` — **no hardcoded values in feature files or step definitions**.
${jsonPreview}
| File | Purpose |
|---|---|
${rows.join('\n')}
`;
}

function sectionHooks() {
  const hooks = collect(PATHS.hooks, ['.ts', '.js']);
  if (!hooks.length) return `## Hooks\n\n_No hook files found._\n`;

  const rows = hooks.map(f => {
    const src    = readFile(f) || '';
    const before = (src.match(/Before\s*\(/g) || []).length;
    const after  = (src.match(/After\s*\(/g)  || []).length;
    return `| \`${f}\` | ${before} | ${after} |`;
  });

  return `## Hooks

Cucumber lifecycle hooks handle browser setup, page creation, and teardown.

| File | Before Hooks | After Hooks |
|---|---|---|
${rows.join('\n')}
`;
}

function sectionUtilities() {
  const utils = collect(PATHS.utils, ['.ts', '.js'])
    .filter(f => !f.includes('generate-readme'));

  if (!utils.length) return `## Utilities\n\n_No utility files found._\n`;

  const knownDescriptions = {
    browserManager:  'Playwright browser lifecycle — launch, context, and page management',
    envConfig:       'Reads and validates environment variables from \`.env\`',
    generateReport:  'Generates an HTML report from Cucumber JSON output',
  };

  const rows = utils.map(f => {
    const name = path.basename(f, path.extname(f));
    const desc = knownDescriptions[name] || '—';
    return `| \`${f}\` | ${desc} |`;
  });

  return `## Utilities

| File | Purpose |
|---|---|
${rows.join('\n')}
`;
}

function sectionReports() {
  return `## Reports

Test reports are generated in \`reports/\` after each run.

\`\`\`bash
# Generate HTML report
npm run report

# Open the report (Mac)
open reports/index.html

# Open the report (Windows)
start reports/index.html
\`\`\`

> \`reports/\` is git-ignored — reports are regenerated fresh on each run.
`;
}

function sectionNpmScripts(pkg) {
  if (!pkg?.scripts) return `## npm Scripts\n\n_No scripts found in \`package.json\`._\n`;

  const rows = Object.entries(pkg.scripts)
    .map(([k, v]) => `| \`${k}\` | \`${v.replace(/\|/g, '\\|')}\` |`);

  return `## npm Scripts

| Script | Command |
|---|---|
${rows.join('\n')}
`;
}

function sectionCICD() {
  const ghDir = path.join(ROOT, '.github', 'workflows');
  let existing = '';

  if (fs.existsSync(ghDir)) {
    const files = fs.readdirSync(ghDir).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
    if (files.length) {
      existing = '\n**Existing workflows:**\n\n' + files.map(f => `- \`.github/workflows/${f}\``).join('\n') + '\n';
    }
  }

  return `## CI/CD
${existing}
### Recommended GitHub Actions Workflow

\`\`\`yaml
# .github/workflows/playwright-bdd.yml
name: BDD Playwright Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - run: npx playwright install --with-deps

      - run: npm test

      - run: npm run report
        if: always()

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: cucumber-report
          path: reports/
          retention-days: 30
\`\`\`
`;
}

function sectionFooter() {
  const now = new Date().toISOString().split('T')[0];
  return `---

_This README was auto-generated on **${now}** by \`src/utils/generate-readme.js\`.  
Run \`node src/utils/generate-readme.js\` to refresh it._
`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const pkg = readPackageJson();

  console.log(`\n📋  BDD Playwright README Generator`);
  console.log(`   Root  : ${ROOT}`);
  console.log(`   Output: ${OUTPUT}`);
  if (DRY_RUN) console.log(`   Mode  : DRY RUN (nothing will be written)\n`);

  const sections = [
    sectionOverview(pkg),
    sectionTableOfContents(),
    sectionGettingStarted(pkg),
    sectionProjectStructure(pkg),
    sectionConfiguration(),
    sectionRunningTests(pkg),
    sectionFeatureFiles(),
    sectionStepDefinitions(),
    sectionPageObjects(),
    sectionTestData(),
    sectionHooks(),
    sectionUtilities(),
    sectionReports(),
    sectionNpmScripts(pkg),
    sectionCICD(),
    sectionFooter(),
  ];

  const readme = sections.join('\n');

  if (DRY_RUN) {
    console.log('\n──── Preview ────────────────────────────────────────────\n');
    console.log(readme);
    console.log('\n──── End Preview ────────────────────────────────────────\n');
  } else {
    fs.writeFileSync(OUTPUT, readme, 'utf8');
    console.log(`\n✅  README.md written to ${OUTPUT}\n`);
  }
}

main();
