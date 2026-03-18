# BDD Playwright TypeScript Framework

A robust BDD (Behavior-Driven Development) test automation framework built with **Playwright**, **Cucumber**, and **TypeScript**.

---

## 📁 Project Structure

```
bdd-playwright/
├── features/
│   └── search.feature          # BDD feature files (Gherkin — no inline data)
├── src/
│   ├── data/
│   │   ├── testData.json       # ✅ All test data lives here
│   │   └── testDataLoader.ts   # Typed loader + helper methods
│   ├── hooks/
│   │   └── hooks.ts            # Before/After hooks (setup & teardown)
│   ├── pages/
│   │   ├── BasePage.ts         # Base page object (shared Playwright helpers)
│   │   ├── SearchPage.ts       # Search page object
│   │   └── UserDetailsPage.ts  # User details page object
│   ├── steps/
│   │   └── searchSteps.ts      # Cucumber step definitions
│   └── utils/
│       ├── browserManager.ts   # Browser lifecycle management
│       ├── envConfig.ts        # Environment configuration
│       └── generateReport.js   # HTML report generator
├── reports/                    # Generated test reports & screenshots
├── .env.example                # Environment variable template
├── cucumber.js                 # Cucumber configuration
├── package.json
└── tsconfig.json
```

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
npx playwright install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your application URL
```

### 3. Run Tests

```bash
# Run all tests
npm test

# Run with HTML report
npm run test:report

# Run specific feature
npx cucumber-js features/search.feature

# Run with visible browser (headed mode)
HEADLESS=false npm test

# Run with a specific browser
BROWSER=firefox npm test

# Slow down for debugging
HEADLESS=false SLOW_MO=500 npm test
```

---

## 🗂️ Test Data

All test data is stored in **`src/data/testData.json`**. No emails or user values are hardcoded in feature files or step definitions.

```json
{
  "search": {
    "users": [
      {
        "id": "user_001",
        "email": "john.doe@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "Admin",
        "status": "Active"
      }
    ],
    "defaultUser": "user_001",
    "invalidEmails": ["notfound@nowhere.com"]
  }
}
```

**`testDataLoader.ts`** exposes typed helpers used inside step definitions:

| Method | Description |
|--------|-------------|
| `testData.getDefaultUser()` | Returns the user pointed to by `defaultUser` key |
| `testData.getUserById(id)` | Looks up a user record by `id` |
| `testData.getUserByEmail(email)` | Looks up a user record by email |
| `testData.getAllUsers()` | Returns all user records |
| `testData.getInvalidEmails()` | Returns invalid email list |

To add or change test users, edit **`testData.json`** only — no code changes needed.

---

## 🧩 Feature Scenario

```gherkin
Scenario: Search text in Application
  Given I open Application
  When I search for email "john.doe@example.com"
  And I click the search button
  Then I should see the email "john.doe@example.com" in the results
  When I click Edit
  Then I should see the user details page
```

---

## 🏗️ Architecture

### Page Object Model (POM)
Each page in the application has a corresponding page object class:
- **`BasePage`** — shared utilities (click, fill, assert, wait helpers)
- **`SearchPage`** — search form interactions & result assertions
- **`UserDetailsPage`** — user detail form interactions & assertions

### BDD Layer (Cucumber)
- **Feature files** (`.feature`) describe behavior in plain English (Gherkin)
- **Step definitions** map Gherkin steps to Playwright actions
- **Hooks** manage browser lifecycle and screenshot capture on failure

### Utilities
- **`BrowserManager`** — singleton managing browser, context, and page
- **`EnvConfig`** — centralised environment variable resolution

---

## 📊 Reports

After running `npm run test:report`, open:
- `reports/cucumber-report.html` — built-in Cucumber HTML report
- `reports/html-report/index.html` — rich multiple-cucumber-html-reporter

Screenshots of failed tests are saved to `reports/screenshots/`.

---

## ➕ Adding New Scenarios

1. Add a `Scenario` block in the relevant `.feature` file (or create a new one in `features/`)
2. Add page object methods in `src/pages/`
3. Implement step definitions in `src/steps/`
4. Run tests with `npm test`

---

## 🛠️ Customisation

| Variable       | Default                        | Description                          |
|----------------|--------------------------------|--------------------------------------|
| `BASE_URL`     | `https://aucklandcounciluat.customfleetpoolcar.co.nz/SysAdmin/DriverRegister.aspx`   | Application base URL                 |
| `BROWSER`      | `chromium`                     | `chromium` / `firefox` / `webkit`    |
| `HEADLESS`     | `true`                         | Set `false` to watch the browser     |
| `SLOW_MO`      | `0`                            | Milliseconds to slow down actions    |
| `TIMEOUT`      | `30000`                        | Global step timeout (ms)             |
| `RECORD_VIDEO` | `false`                        | Record video of each run             |
