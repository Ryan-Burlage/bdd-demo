Feature: Automobile quote - vehicle data entry

  @BB-1 @AUTOMOBILE @smoke
  Scenario: Enter automobile vehicle data successfully
    Given I open the Vehicle Insurance application
    When I select "Automobile"
    And I enter automobile vehicle data
    Then I should be on the Insurant Data step
