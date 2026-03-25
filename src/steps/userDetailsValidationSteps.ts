import { Given, When, Then, Before, After, setDefaultTimeout, ITestCaseHookParameter } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page, chromium, expect } from '@playwright/test';
import { UserDetailsPage } from '../pages/UserDetailsPage';
import * as fs from 'fs';
import * as path from 'path';
import { CustomWorld } from '../hooks/hooks'; 
import { BrowserManager } from '../utils/browserManager';
import { getEnvConfig } from '../utils/envConfig';


// ── Timeout ────────────────────────────────────────────────────────────────
setDefaultTimeout(30_000);

// ── World state ────────────────────────────────────────────────────────────
const config = getEnvConfig();

// ── Hooks ──────────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────────────
// GIVEN steps
// ─────────────────────────────────────────────────────────────────────────────

Before({ tags: '@userDetailsValidation' }, async function (this: CustomWorld, scenario: ITestCaseHookParameter) {
  console.log(`🟢 BEFORE: "${scenario.pickle.name}" — creating new context`);
  const { context, page } = await BrowserManager.newScenarioPage();
  this.context         = context;
  this.page            = page;
  this.baseUrl         = config.baseUrl; // Capture the initial URL as baseUrl
  this.currentUser     = null;
  this.userDetailsPage = new UserDetailsPage(page);
  console.log(`   Page state: ${this.page.isClosed() ? 'CLOSED ❌' : 'OPEN ✅'}`);
});

After({ tags: '@userDetailsValidation' },  async function (this: CustomWorld, scenario: ITestCaseHookParameter) {
  console.log(`🔴 AFTER: "${scenario.pickle.name}" — closing context`);
  await this.page.waitForTimeout(1000);
  // ...
});

Given('the User Details page is displayed', async function (this: CustomWorld) {
  this.userDetailsPage = new UserDetailsPage(this.page);
  //this.userDetailsPage.waitForLoad();
  const isLoaded = await this.userDetailsPage.isPageLoaded();
  console.log(`   Page loaded: ${isLoaded}`);
  expect(isLoaded).toBe(true);
});

// ─────────────────────────────────────────────────────────────────────────────
// THEN steps
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Data-match: verify the field currently shows the expected value.
 */



/*
Then('all fields should match the test data file', async function (this: CustomWorld) {
  // 1. Verify file path resolves correctly
  const dataPath = path.resolve('src/data/testData.json');
  console.log('📁 Data path:', dataPath);

  // 2. Verify JSON parses correctly
  const raw = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  console.log('📄 Raw JSON keys:', Object.keys(raw));
  console.log('🔍 Search section:', JSON.stringify(raw.search, null, 2));

  // 3. Verify defaultUser resolves to a real user
  const defaultId = raw.search.defaultUser;
  console.log('🎯 Default user ID:', defaultId);

  const user = raw.search.users.find((u: any) => u.id === defaultId);
  console.log('👤 Resolved user:', JSON.stringify(user, null, 2));
  if (!user) throw new Error(`No user found with id "${defaultId}"`);

  const fieldMapping: Record<string, string> = {
    id:         'employeeId',
    firstName:  'firstName',
    lastName:   'lastName',
    email:      'email',
    role:       'role',
    manager:    'manager',
    location:   'location',
    organization: 'organization',
    usertype:   'userType',
     

  };

  // 4. Check each field one by one
  for (const [jsonKey, fieldName] of Object.entries(fieldMapping)) {
    const expectedValue = user[jsonKey];
    console.log(`🔎 Checking field "${fieldName}" — expected: "${expectedValue}"`);

    if (expectedValue !== undefined) {
      // 5. Check the locator is visible before asserting
      const locator = this.userDetailsPage.getField(fieldName);
      const isVisible = await locator.isVisible();
      console.log(`   👁️  Locator visible: ${isVisible}`);

      if (!isVisible) {
        console.warn(`   ⚠️  Skipping "${fieldName}" — locator not visible on page`);
        continue;
      }

      const actualValue = await locator.inputValue();
      console.log(`   ✅ Actual value: "${actualValue}"`);

      await this.userDetailsPage.assertFieldValue(fieldName, expectedValue);
    }
  }
});

*/

Then('all fields should match the test data file', async function (this: CustomWorld) {
  this.userDetailsPage = new UserDetailsPage(this.page);
  
  // Wait for a key field to be visible before doing anything
  await this.page.waitForSelector('input[id*="user-external-id"]', { 
    state: 'visible', 
    timeout: 30_000 
  });

  const dataPath = path.resolve('src/data/testData.json');
  const raw = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  const defaultId = raw.search.defaultUser;
  const user = raw.search.users.find((u: any) => u.id === defaultId);
  if (!user) throw new Error(`No user found with id "${defaultId}"`);

  const fieldMapping: Record<string, string> = {
    id:           'employeeId',
    firstName:    'firstName',
    lastName:     'lastName',
    email:        'email',
    role:         'role',
    manager:      'manager',
    location:     'location',
    organization: 'organization',
    userType:     'userType',
  };

  const errors: string[] = [];

  for (const [jsonKey, fieldName] of Object.entries(fieldMapping)) {
    const expectedValue = user[jsonKey];

    if (expectedValue === undefined) {
      errors.push(`Field "${jsonKey}" is missing from test data for user "${defaultId}"`);
      continue;
    }

    // Fail if locator is not found/visible
    const locator = this.userDetailsPage.getField(fieldName);
    const isVisible = await locator.isVisible();

    if (!isVisible) {
      errors.push(`Locator for field "${fieldName}" was not visible on the page`);
      continue;
    }

    // Fail on value mismatch
    //const actualValue = null;
    let actualValue: string;

      if (['role', 'manager','location','organization','userType'].includes(fieldName))
        {
           actualValue = await locator.evaluate(
            (select: HTMLSelectElement) => select.options[select.selectedIndex].text);
        }
        else {
           actualValue = await locator.inputValue();
        }

    if (actualValue !== expectedValue) {
      errors.push(`Field "${fieldName}" mismatch — expected: "${expectedValue}", actual: "${actualValue}"`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Field validation failed:\n${errors.map((e, i) => `  ${i + 1}. ${e}`).join('\n')}`);
  }
});


/**
 * Required-field: field error is visible and mentions "required".

Then(
  'the field {string} should show a required field error',
  async (fieldName: string) => {
    await userDetailsPage.assertRequiredError(fieldName);
  }
);

 */


/**
 * Numeric: field error is visible and mentions numeric/number.

Then(
  'the field {string} should show a numeric validation error',
  async (fieldName: string) => {
    await userDetailsPage.assertNumericError(fieldName);
  }
);

 */

/**
 * Email format: email error is visible and mentions invalid email.

Then('the field {string} should show an email format error', async (_fieldName: string) => {
  await userDetailsPage.assertEmailFormatError();
});

 */


/**
 * No error: field error locator should NOT be visible.

Then(
  'the field {string} should not show a validation error',
  async (fieldName: string) => {
    await userDetailsPage.assertNoValidationError(fieldName);
  }
);

 */

/**
 * Multiple required errors visible.

Then('I should see multiple required field errors', async () => {
  await userDetailsPage.assertMultipleRequiredErrors();
});

 */


