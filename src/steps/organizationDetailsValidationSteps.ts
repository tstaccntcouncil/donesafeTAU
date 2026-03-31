import { Given, When, Then, Before, After, setDefaultTimeout, ITestCaseHookParameter } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page, chromium, expect } from '@playwright/test';
import { OrganizationDetailsPage } from '../pages/OrganizationDetailsPage';
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

Before({ tags: '@organizationDetailsValidation' }, async function (this: CustomWorld, scenario: ITestCaseHookParameter) {
  console.log(`🟢 BEFORE: "${scenario.pickle.name}" — creating new context`);
  const { context, page } = await BrowserManager.newScenarioPage();
  this.context         = context;
  this.page            = page;
  this.baseUrl         = config.baseUrl; // Capture the initial URL as baseUrl
  this.currentOrganization     = null;
  this.organizationDetailsPage = new OrganizationDetailsPage(page);
  console.log(`   Page state: ${this.page.isClosed() ? 'CLOSED ❌' : 'OPEN ✅'}`);
});

After({ tags: '@organizationDetailsValidation' },  async function (this: CustomWorld, scenario: ITestCaseHookParameter) {
  console.log(`🔴 AFTER: "${scenario.pickle.name}" — closing context`);
  await this.page.waitForTimeout(1000);
  // ...
});

Given('the Organization Details page is displayed', async function (this: CustomWorld) {
  this.organizationDetailsPage = new OrganizationDetailsPage(this.page);
  console.log('🟡 Navigating to Organization Details page...');
  const isLoaded = await this.organizationDetailsPage.isPageLoaded();
  console.log(`   Page loaded: ${isLoaded}`);
  expect(isLoaded).toBe(true);
});

// ─────────────────────────────────────────────────────────────────────────────
// THEN steps
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Data-match: verify the field currently shows the expected value.
 */


Then('all organization fields should match the test data file', async function (this: CustomWorld) {
  this.organizationDetailsPage = new OrganizationDetailsPage(this.page);

  await this.page.waitForSelector('input[name="external_uuid"]', { 
    state: 'visible', 
    timeout: 30_000 
  });

  const dataPath = path.resolve('src/data/testOrganizationData.json');
  const raw = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  const organizationId = raw.search.defaultOrganization;
  const organization = raw.search.organizations.find((o: any) => o.externalUuid === organizationId);
  if (!organization) throw new Error(`No organization found with id "${organizationId}"`);

  const fieldMapping: Record<string, string> = {
    name:           'name',
    level:          'level',
    parent:         'parent',
    hoursWorked:    'hoursWorked',
    externalUuid:   'externalUuid',
  };

  const errors: string[] = [];

  for (const [jsonKey, fieldName] of Object.entries(fieldMapping)) {

    console.log(`🔍 Validating field "${fieldName}" against test data key "${jsonKey}"...`);
    
    const expectedValue = organization[jsonKey];

    if (expectedValue === undefined) {
      errors.push(`Field "${jsonKey}" is missing from test data for organization "${organizationId}"`);
      continue;
    }

    // Fail if locator is not found/visible
    const locator = this.organizationDetailsPage.getField(fieldName);
    const isVisible = await locator.isVisible();

    if (!isVisible) {
      errors.push(`Locator for field "${fieldName}" was not visible on the page`);
      continue;
    }

    // Fail on value mismatch
    //const actualValue = null;
    let actualValue: string;

      if (['parent'].includes(fieldName))
        {
          actualValue = await this.page.locator('#organisation-form-parent-organisation option:checked').textContent() ?? '';
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


