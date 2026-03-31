
Feature: Login 
As an admin  
I want to log in to the application
So that I can access and manage users, locations, and organizations

  Background:
    Given I am on the login page

  @smoke 
  Scenario: Successful login with valid credentials
    When I enter username "${USERNAME}"
    And I enter password "${PASSWORD}"
    And I click the login button
    Then I should be redirected to the dashboard
    And I should see the welcome page
