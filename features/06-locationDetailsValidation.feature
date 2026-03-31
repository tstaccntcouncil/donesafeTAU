@locationDetailsValidation
Feature: Location Details 
As a Test Lead  
I want to verify the data shown on the Location Details page
So that the displayed information matches what is expected

  Background:
    Given the Location Details page is displayed

  @regression
  Scenario Outline: Verify each location field displays the expected test data
    Then all location fields should match the test data file