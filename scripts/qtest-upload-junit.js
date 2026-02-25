const fs = require("fs");
const path = require("path");
const https = require("https");
const { parseStringPromise } = require("xml2js");

const QTEST_URL = process.env.QTEST_URL;                 // e.g. https://<tenant>.qtestnet.com
const QTEST_TOKEN = process.env.QTEST_TOKEN;             // Bearer token
const QTEST_PROJECT_ID = process.env.QTEST_PROJECT_ID;   // numeric project id
const QTEST_TEST_CYCLE = process.env.QTEST_TEST_CYCLE;   // test cycle id or pid
const JUNIT_PATH = process.env.JUNIT_PATH || "reports/junit-report.xml";

const MODULE_NAMES = (process.env.QTEST_MODULE_NAMES || "BDD,Playwright,Cucumber")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function mapStatus(tc) {
  if (tc.skipped) return "SKIP";
  if (tc.failure || tc.error) return "FAIL";
  return "PASS";
}

function postJson(url, token, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = Buffer.from(JSON.stringify(body), "utf8");

    const req = https.request(
      {
        method: "POST",
        hostname: u.hostname,
        path: u.pathname + u.search,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": data.length,
          Authorization: `Bearer ${token}`,
        },
      },
      (res) => {
        let out = "";
        res.on("data", (d) => (out += d));
        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 300) return resolve(out);
          reject(new Error(`qTest API ${res.statusCode}: ${out}`));
        });
      }
    );

    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

(async () => {
  if (!QTEST_URL || !QTEST_TOKEN || !QTEST_PROJECT_ID || !QTEST_TEST_CYCLE) {
    console.error("Missing env vars. Need QTEST_URL, QTEST_TOKEN, QTEST_PROJECT_ID, QTEST_TEST_CYCLE");
    process.exit(2);
  }

  const junitFullPath = path.resolve(JUNIT_PATH);
  if (!fs.existsSync(junitFullPath)) {
    console.error(`JUnit file not found: ${junitFullPath}`);
    process.exit(2);
  }

  const xml = fs.readFileSync(junitFullPath, "utf8");
  const parsed = await parseStringPromise(xml, { explicitArray: false });

  const suites = parsed.testsuites?.testsuite
    ? (Array.isArray(parsed.testsuites.testsuite) ? parsed.testsuites.testsuite : [parsed.testsuites.testsuite])
    : parsed.testsuite
      ? (Array.isArray(parsed.testsuite) ? parsed.testsuite : [parsed.testsuite])
      : [];

  const now = new Date().toISOString();

  const test_logs = [];
  for (const s of suites) {
    const testcases = s.testcase
      ? (Array.isArray(s.testcase) ? s.testcase : [s.testcase])
      : [];

    for (const tc of testcases) {
      const name = tc.$?.name || "Unnamed";
      const classname = tc.$?.classname || "BDD";
      const status = mapStatus(tc);

      test_logs.push({
        name,
        automation_content: `${classname}::${name}`,
        status,
        exe_start_date: now,
        exe_end_date: now,
        module_names: MODULE_NAMES,
      });
    }
  }

  if (test_logs.length === 0) {
    console.log("No testcases found in JUnit. Nothing to upload.");
    return;
  }

  const endpoint = `${QTEST_URL.replace(/\/$/, "")}/api/v3/projects/${QTEST_PROJECT_ID}/auto-test-logs?type=automation`;

  const payload = {
    test_cycle: QTEST_TEST_CYCLE,
    test_logs,
  };

  console.log(`Uploading ${test_logs.length} test logs to qTest...`);
  const resp = await postJson(endpoint, QTEST_TOKEN, payload);
  console.log("qTest response:", resp);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});