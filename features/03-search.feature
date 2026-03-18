@search
Feature: Search Record 
  As a user of the application
  I want to search for records by id
  So that I can find and manage user details efficiently

  Background:
    Given I am on the search page

  # Uses the defaultUser entry from src/data/testData.json
  Scenario: Search and view default user record
    When  I search for the default fullname
    And   I see the default fullname in the results
    Then  I click the fullname link
    Then  I should see the user details 

