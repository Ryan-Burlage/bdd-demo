const { Given, When, Then, Before, After, setDefaultTimeout } = require("@cucumber/cucumber");
setDefaultTimeout(60 * 1000);const { chromium } = require("playwright");
const assert = require("assert");

let browser;
let page;

Before(async () => {
  browser = await chromium.launch({ headless: false });
  page = await browser.newPage();
});

After(async () => {
  if (browser) await browser.close();
});

Given("I open the Vehicle Insurance application", async function () {
  // The form flow is on app.php
  await page.goto("https://sampleapp.tricentis.com/101/app.php");
});

When('I select "Automobile"', async function () {
  // Top navigation tab
  await page.click("text=Automobile");
});

When("I enter automobile vehicle data", async function () {
  // Vehicle Data (Automobile)
  await page.selectOption("#make", { label: "Audi" });
  await page.fill("#engineperformance", "110");
  await page.fill("#dateofmanufacture", "06/12/1980");
  await page.selectOption("#numberofseats", { label: "5" });
  await page.selectOption("#fuel", { label: "Petrol" });
  await page.fill("#listprice", "30000");
  await page.fill("#licenseplatenumber", "DMK1234");
  await page.fill("#annualmileage", "10000");

  // Go to next step
  await page.click("text=Next »");
});

Then("I should be on the Insurant Data step", async function () {
  // The Insurant step contains First Name / Last Name fields (e.g., #firstname)
  await page.waitForSelector("#firstname", { state: "visible" });
  const isEnabled = await page.isEnabled("#firstname");
  assert.strictEqual(isEnabled, true);
});
