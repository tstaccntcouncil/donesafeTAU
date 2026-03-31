
Feature: Post-Login Navigation
As an admin  
I want to access Settings via the landing page
So that I can manage user, locations, and organizations records

  Background:
    Given I am on the welcome page

  @regression
  Scenario: Access Settings through the Landing Page
    When I click the profile menu
    And I click the settings button
    Then I am on the settings page
    Then  I should click Users link
