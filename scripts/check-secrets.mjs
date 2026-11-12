import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const patterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /(?:api[_-]?key|client[_-]?secret|access[_-]?token)\s*[:=]\s*["'][^"']{16,}["']/i,
  /\b(?:ghp|github_pat|sk_live|sk_test)_[A-Za-z0-9_\-]{20,}\b/
];

const files = execFileSync("git", ["ls-files", "-co", "--exclude-standard"], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean)
  .filter((file) => existsSync(file))
  .filter((file) => !file.endsWith("package-lock.json"));

const findings = [];

for (const file of files) {
  const contents = readFileSync(file, "utf8");
  if (patterns.some((pattern) => pattern.test(contents))) {
    findings.push(file);
  }
}

if (findings.length > 0) {
  console.error(`Potential secrets found in: ${findings.join(", ")}`);
  process.exitCode = 1;
} else {
  console.log(`Secret scan passed for ${files.length} files.`);
}
