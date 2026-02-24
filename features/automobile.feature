Feature: Automobile quote - vehicle data entry

  @AUTOMOBILE @smoke @BS-48
  Scenario: Enter automobile vehicle data
    Given I open the Vehicle Insurance application
    When I select "Automobile"
    And I enter automobile vehicle data
    Then I should be on the Insurant Data step
