@locationDetailsValidation
Feature: Location Details Data Field Validation
  As a QA engineer
  I want to verify that the Location Details page fields are correctly validated
  So that data integrity and format requirements are enforced

  Background:
    Given the Location Details page is displayed

 # ─────────────────────────────────────────────
  # Data Match Verification
  # ─────────────────────────────────────────────
  @dataMatch
  Scenario Outline: Verify each location field displays the expected test data
    Then all location fields should match the test data file