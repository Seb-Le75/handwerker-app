import { spawnSync } from "node:child_process";

const severityRank = { info: 0, low: 1, moderate: 2, high: 3, critical: 4 };
const threshold = severityRank.high;

// npm published this advisory before a patched picomatch release existed.
// Keep the exception narrow and short-lived so every other high advisory still fails CI.
const temporaryAllowlist = new Map([
  [
    1247710,
    {
      advisory: "GHSA-fc5q-39xc-vjpf",
      expires: "2026-12-15",
      reason: "No patched picomatch release is available in the npm registry yet; affected use is build tooling only."
    }
  ]
]);

const audit = spawnSync("npm", ["audit", "--json"], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
if (!audit.stdout) {
  console.error(audit.stderr || "npm audit returned no report");
  process.exit(1);
}

let report;
try {
  report = JSON.parse(audit.stdout);
} catch {
  console.error("npm audit returned invalid JSON");
  process.exit(1);
}

if (report.error || report.auditReportVersion !== 2) {
  console.error(report.error?.summary ?? report.error?.message ?? "npm audit did not return a complete report");
  process.exit(1);
}

const advisories = new Map();
for (const vulnerability of Object.values(report.vulnerabilities ?? {})) {
  for (const via of vulnerability.via ?? []) {
    if (typeof via !== "object" || severityRank[via.severity] < threshold) continue;
    advisories.set(via.source, via);
  }
}

const today = new Date().toISOString().slice(0, 10);
const failures = [];
for (const advisory of advisories.values()) {
  const allowed = temporaryAllowlist.get(advisory.source);
  if (!allowed || allowed.expires < today) failures.push(advisory);
  else console.warn(`Temporarily allowing ${allowed.advisory} until ${allowed.expires}: ${allowed.reason}`);
}

if (failures.length > 0) {
  for (const advisory of failures) {
    console.error(`${advisory.severity}: ${advisory.title} (${advisory.url})`);
  }
  process.exit(1);
}

console.log("Dependency audit passed: no unapproved high or critical advisories.");
