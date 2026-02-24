module.exports = {
  default: {
    require: ["features/step_definitions/*.js"],
    format: [
      "progress",
      "json:reports/cucumber-report.json",
      "junit:reports/junit-report.xml"
    ]
  }
};