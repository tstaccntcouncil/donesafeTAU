@userDetailsValidation
Feature: User Details Data Field Validation
  As a QA engineer
  I want to verify that the User Details page fields are correctly validated
  So that data integrity and format requirements are enforced

  Background:
    Given the User Details page is displayed

 # ─────────────────────────────────────────────
  # Data Match Verification
  # ─────────────────────────────────────────────
  @dataMatch
  Scenario Outline: Verify field displays the expected test data
    Then all fields should match the test data file