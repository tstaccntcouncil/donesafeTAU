
Feature: Organization Search
  As a logged-in user
  I want to navigate to Settings and Organizations
  So that I can view the organization records

  Background:
   
  @regression
  Scenario: Navigate to Organizations within Settings
    Given I am on the DoneSafe page from any previous scenario
    When I click profile account menu
    And I click settings menu item
    Then I should click the Organizations link on the settings webpage

   @regression
  Scenario: Search organization and display record details
    Given I am on the Organization Search page
    When  I search for the default organization name
    And   I see the default organization name in the results
    Then  I should click the organization name link to view details

