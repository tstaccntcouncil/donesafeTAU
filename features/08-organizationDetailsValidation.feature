
Feature: Organization Details Data Field Validation
  As a QA engineer
  I want to verify that the Organization Details page fields are correctly validated
  So that data integrity and format requirements are enforced

  Background:
    Given the Organization Details page is displayed

 # ─────────────────────────────────────────────
  # Data Match Verification
  # ─────────────────────────────────────────────
  @regression
  Scenario Outline: Verify each organization field displays the expected test data
    Then all organization fields should match the test data file