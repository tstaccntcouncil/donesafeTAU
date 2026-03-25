
Feature: Location Search
  As a logged-in user
  I want to navigate to Settings and Locations
  So that I can view the location records

  Background:
   
  @wip
  Scenario: Navigate to Locations within Settings
    Given I am on the DoneSafe page
    When I click the profile account menu
    And I click the settings menu item
    Then I should click the Locations link on the settings webpage

  @wip
  Scenario: Search location and display record details
    Given I am on the Location Search page
    When  I search for the default location name
    And   I see the default location name in the results
    Then  I should click the location name link to view details

