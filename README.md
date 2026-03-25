# bdd-playwright-typescript

BDD Framework with Playwright and TypeScript

![Playwright](https://img.shields.io/badge/Playwright-1.44.0-2EAD33?logo=playwright&logoColor=white) ![Cucumber](https://img.shields.io/badge/Cucumber-10.8.0-23D96C?logo=cucumber&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-blue?logo=typescript&logoColor=white) ![License](https://img.shields.io/badge/License-MIT-blue)

## Table of Contents

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

## Getting Started

### Prerequisites

- Node.js >=18
- npm package manager

### Installation

```bash
git clone <repo-url>
cd bdd-playwright-typescript

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install --with-deps
```

### Environment Variables

```bash
cp .env.example .env
```

| Variable     | Description            | Default                  |
|---|---|---|
| `BASE_URL`   | Application base URL   | `http://localhost:3000` |
| `BROWSER`    | Browser to use         | `chromium`             |
| `HEADLESS`   | Run headless           | `true`                 |
| `ENV`        | Target environment     | `dev`                  |

## Project Structure

```
bdd-playwright-typescript/
│   ├── .vscode/                        # VS Code workspace settings & tasks
│   ├── .vscode/tasks.json              # Tasks for generating README and running tests
│   ├── .vscode/settings.json           # Workspace settings (Run on Save, etc.)
│   ├── features/                       # Gherkin BDD feature files
│   ├── src/                            # All source code
│   ├── src/data/                       # Test data (JSON) and typed loader
│   ├── src/hooks/                      # Cucumber Before/After hooks
│   ├── src/pages/                      # Playwright Page Object Models
│   ├── src/steps/                      # Cucumber step definitions
│   ├── src/utils/                      # Browser manager, env config, report utils
│   ├── reports/                        # Generated HTML reports & screenshots (git-ignored)
│   ├── .env.example                    # Environment variable template
│   ├── cucumber.js                     # Cucumber runner configuration
│   ├── package.json                    # Project manifest & scripts
│   ├── tsconfig.json                   # TypeScript configuration
```

## Configuration

### Cucumber (`cucumber.js`)

```js
module.exports = {
  default: {
    require: ['dotenv/config','src/hooks/*.ts', 'src/steps/*.ts'],
    requireModule: ['ts-node/register'],
    format: [
      'progress-bar',
      'html:reports/cucumber-report.html',
      'json:reports/cucumber-report.json',
    ],
    formatOptions: { snippetInterface: 'async-await' },
    paths: ['features/**/*.feature'],
  },
};
```

### Environment Variables (`.env.example`)

```bash
# ─── Application ──────────────────────────────────────────────────────────────
BASE_URL=https://your-app-url.com

# ─── Browser Settings ──────────────────────────────────────────────────────────
# Options: chromium | firefox | webkit
BROWSER=chromium

# HEADLESS=true  → invisible (CI/CD pipelines)
# HEADLESS=false or unset → browser window opens (default for local runs)
HEADLESS=false

# Slow down each Playwright action by N milliseconds (useful for debugging)
SLOW_MO=0

# Global step timeout in milliseconds
TIMEOUT=30000

# Set to true to record video of each test run
RECORD_VIDEO=false
```

## Running Tests

```bash
# Run all scenarios
npm run test

# Run in a specific environment
ENV=staging npm run test

# Run headed (see the browser)
HEADLESS=false npm run test

# Generate HTML report after run
node src/utils/generateReport.js
```

## Feature Files

Written in **Gherkin** syntax. All test data is externalised to `src/data/testData.json` — no inline data tables in feature files.

| File | Scenarios | Sample Scenarios |
|---|---|---|
| `features\01-login.feature` | 1 | `Successful login with valid credentials` |
| `features\02-postLogin.feature` | 1 | `Navigate to Users within Settings` |
| `features\03-search.feature` | 1 | `Search and view default user record` |
| `features\04-userDetailsValidation.feature` | 1 | `Verify field displays the expected test data` |
| `features\05-locationsearch.feature` | 2 | `Navigate to Locations within Settings`, `Search location and display record details` |
| `features\06-locationDetailsValidation.feature` | 1 | `Verify each location field displays the expected test data` |

## Step Definitions

Cucumber step definitions that map Gherkin steps to Playwright page actions.

| File | Lines | Sample Steps |
|---|---|---|
| `src\steps\locationDetailsValidationSteps.ts` | 193 | `the Location Details page is displayed`, `all location fields should match the test data file`, `the field {string} should show a required field error` |
| `src\steps\locationSearchSteps.ts` | 119 | `I am on the DoneSafe page`, `I click the profile account menu`, `I click the settings menu item` |
| `src\steps\loginSteps.ts` | 83 | `I am on the login page`, `I enter username {string}`, `I enter password {string}` |
| `src\steps\postLoginSteps.ts` | 73 | `I am on the welcome page`, `I click the profile menu`, `I click the settings button` |
| `src\steps\searchSteps.ts` | 86 | `I am on the search page`, `I search for the default fullname`, `I see the default fullname in the results` |
| `src\steps\userDetailsValidationSteps.ts` | 238 | `the User Details page is displayed`, `all fields should match the test data file`, `the field {string} should show a required field error` |

## Page Objects

All page objects extend `BasePage` which provides shared Playwright helpers (waits, clicks, fills, assertions).

| File | Type | Key Methods |
|---|---|---|
| `src\pages\BasePage.ts` | 🧱 Base | `navigateTo()`, `waitForElement()`, `clickElement()`, `fillInput()`, `getText()` |
| `src\pages\LocationDetailsPage.ts` | 📄 Page | `isPageLoaded()`, `assertFieldValue()`, `getFieldValue()`, `getField()`, `navigate()` |
| `src\pages\LocationSearchPage.ts` | 📄 Page | `navigateToProfile()`, `navigateToSettings()`, `navigateToLocations()`, `enterSearchLocationName()`, `waitForTableToLoad()` |
| `src\pages\LoginPage.ts` | 📄 Page | `navigateToLoginPage()`, `enterUsername()`, `enterPassword()`, `clickLoginButton()`, `login()` |
| `src\pages\PostLoginPage.ts` | 📄 Page | `navigateToProfile()`, `navigateToSettings()`, `navigateToUsers()`, `verifyWelcomePageLoaded()`, `verifySettingsPageLoaded()` |
| `src\pages\SearchPage.ts` | 📄 Page | `navigateToSearchPage()`, `enterSearchEmail()`, `enterSearchId()`, `enterSearchFullName()`, `waitForTableToLoad()` |
| `src\pages\UserDetailsPage.ts` | 📄 Page | `getUserEmail()`, `getUserFirstName()`, `getUserLastName()`, `isPageLoaded()`, `assertFieldValue()` |

## Test Data

All test data lives in `src/data/` — **no hardcoded values in feature files or step definitions**.

**Top-level keys in `src\data\testData.json`:** `search`

| File | Purpose |
|---|---|
| `src\data\testData.json` | Centralised test data (no hardcoded values in steps or features) |
| `src\data\testDataLoader.ts` | Typed loader with helper methods for accessing test data |
| `src\data\testLocationData.json` | Centralised test data (no hardcoded values in steps or features) |
| `src\data\testLocationDataLoader.ts` | Typed loader with helper methods for accessing test data |

## Hooks

Cucumber lifecycle hooks handle browser setup, page creation, and teardown.

| File | Before Hooks | After Hooks |
|---|---|---|
| `src\hooks\hooks.ts` | 1 | 1 |

## Utilities

| File | Purpose |
|---|---|
| `src\utils\browserManager.ts` | Playwright browser lifecycle — launch, context, and page management |
| `src\utils\envConfig.ts` | Reads and validates environment variables from `.env` |
| `src\utils\generateCucumberReport.js` | — |
| `src\utils\generateReadme.js` | — |
| `src\utils\openReports.js` | — |

## Reports

Test reports are generated in `reports/` after each run.

```bash
# Generate HTML report
npm run report

# Open the report (Mac)
open reports/index.html

# Open the report (Windows)
start reports/index.html
```

> `reports/` is git-ignored — reports are regenerated fresh on each run.

## npm Scripts

| Script | Command |
|---|---|
| `pretest` | `node src/utils/generateReadme.js` |
| `test` | `cucumber-js && node playwrightbddanalyzer.js && node src/utils/OpenReports.js` |
| `test:report` | `cucumber-js && node src/utils/generateCucumberReport.js` |
| `lint` | `tsc --noEmit` |
| `docs` | `node src/utils/generateReadme.js` |
| `analyze` | `node playwrightbddanalyzer.js` |

## CI/CD

### Recommended GitHub Actions Workflow

```yaml
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
```

---

_This README was auto-generated on **2026-03-25** by `src/utils/generate-readme.js`.  
Run `node src/utils/generate-readme.js` to refresh it._
