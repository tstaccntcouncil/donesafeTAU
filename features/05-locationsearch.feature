
Feature: Location Search
As an admin  
I want to access Settings and navigate to Locations from the landing page
So that I can view location records

  Background:
   
  @regression
  Scenario: Navigate to Locations within Settings
    Given I am on a feature page
    When I click the profile account menu
    And I click the settings menu item
    Then I should click the Locations link on the settings webpage

  @regression
  Scenario: Search location and display record details
    Given I am on the Location Search page
    When  I search for the default location name
    And   I see the default location name in the results
    Then  I should click the location name link to view details

