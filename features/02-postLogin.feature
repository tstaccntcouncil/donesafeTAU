
Feature: Post-Login Navigation
  As a logged-in user
  I want to navigate to Settings and Users
  So that I can manage users records

  Background:
    Given I am on the welcome page

  @regression
  Scenario: Navigate to Users within Settings
    When I click the profile menu
    And I click the settings button
    And I am on the settings page
    Then  I should click Users link
