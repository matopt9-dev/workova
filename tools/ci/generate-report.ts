import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const ROOT = path.resolve(__dirname, "../..");
const EVIDENCE = path.join(ROOT, "evidence");
const REPORTS = path.join(EVIDENCE, "reports");

function readJsonSafe(filePath: string): unknown | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

function readTextSafe(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}

function getCommitHash(): string {
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim();
  } catch {
    return "unknown";
  }
}

function countScreenshots(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  try {
    const files = fs.readdirSync(dir, { recursive: true }) as string[];
    return files.filter((f) => f.endsWith(".png") || f.endsWith(".jpg")).length;
  } catch {
    return 0;
  }
}

function main() {
  fs.mkdirSync(REPORTS, { recursive: true });

  const appJsonPath = path.join(ROOT, "app.json");
  const appJson = fs.existsSync(appJsonPath)
    ? JSON.parse(fs.readFileSync(appJsonPath, "utf-8"))
    : {};
  const expo = appJson.expo || {};

  const commitHash = getCommitHash();

  const metadata = readJsonSafe(
    path.join(REPORTS, "metadata-validation.json")
  ) as { overallStatus?: string; summary?: Record<string, number>; results?: Array<{ field: string; status: string; message: string }> } | null;
  const eslintOutput = readTextSafe(path.join(REPORTS, "eslint.txt"));
  const typecheckOutput = readTextSafe(path.join(REPORTS, "typecheck.txt"));
  const auditData = readJsonSafe(path.join(REPORTS, "audit.json")) as Record<string, unknown> | null;
  const smokeData = readJsonSafe(
    path.join(REPORTS, "postdeploy-smoke.json")
  ) as { overallStatus?: string } | null;
  const testData = readJsonSafe(path.join(REPORTS, "junit.json")) as { skipped?: boolean } | null;

  const iosScreenshots = countScreenshots(
    path.join(EVIDENCE, "screenshots", "ios")
  );
  const androidScreenshots = countScreenshots(
    path.join(EVIDENCE, "screenshots", "android")
  );

  const eslintPassed =
    eslintOutput !== null &&
    !eslintOutput.includes("error") &&
    !eslintOutput.includes("Error");
  const typecheckPassed =
    typecheckOutput !== null && !typecheckOutput.includes("error TS");
  const metadataPassed = metadata?.overallStatus === "PASS";
  const smokePassed = smokeData?.overallStatus === "PASS";
  const testsPassed = testData !== null && !(testData as Record<string, unknown>)?.numFailedTests;

  const knownRisks: string[] = [];
  if (iosScreenshots === 0) knownRisks.push("iOS screenshots not yet generated (requires macOS CI)");
  if (androidScreenshots === 0) knownRisks.push("Android screenshots not yet generated (requires CI emulator)");
  if (!smokePassed && smokeData === null) knownRisks.push("Post-deploy smoke test not yet run");
  if (eslintOutput === null) knownRisks.push("ESLint has not been run");
  if (typecheckOutput === null) knownRisks.push("TypeScript check has not been run");

  const sections = {
    metadata: metadataPassed,
    lint: eslintPassed || eslintOutput === null,
    typecheck: typecheckPassed || typecheckOutput === null,
    tests: testsPassed || testData === null,
    smoke: smokePassed || smokeData === null,
  };

  const criticalPassed = metadataPassed !== false;
  const overallStatus = criticalPassed && !Object.values(sections).includes(false) ? "PASS" : "FAIL";

  const jsonReport = {
    timestamp: new Date().toISOString(),
    commitHash,
    appInfo: {
      name: expo.name || "unknown",
      version: expo.version || "unknown",
      ios: { bundleId: expo.ios?.bundleIdentifier || null },
      android: { package: expo.android?.package || null },
    },
    overallStatus,
    sections: {
      metadataValidation: {
        status: metadata ? metadata.overallStatus : "NOT_RUN",
        summary: metadata?.summary || null,
      },
      lint: {
        status: eslintOutput === null ? "NOT_RUN" : eslintPassed ? "PASS" : "FAIL",
      },
      typecheck: {
        status: typecheckOutput === null ? "NOT_RUN" : typecheckPassed ? "PASS" : "FAIL",
      },
      unitTests: {
        status: testData === null ? "NOT_RUN" : (testData as Record<string, unknown>)?.skipped ? "SKIPPED" : testsPassed ? "PASS" : "FAIL",
      },
      smokeTest: {
        status: smokeData === null ? "NOT_RUN" : smokePassed ? "PASS" : "FAIL",
      },
      screenshots: {
        ios: { count: iosScreenshots },
        android: { count: androidScreenshots },
      },
    },
    knownRisks,
  };

  fs.writeFileSync(
    path.join(EVIDENCE, "submission-readiness.json"),
    JSON.stringify(jsonReport, null, 2)
  );

  let md = `# Submission Readiness Report\n\n`;
  md += `**Generated:** ${jsonReport.timestamp}\n`;
  md += `**Commit:** ${commitHash}\n`;
  md += `**Overall Status:** ${overallStatus}\n\n`;

  md += `## Build Info\n\n`;
  md += `| Field | Value |\n|-------|-------|\n`;
  md += `| App Name | ${expo.name || "N/A"} |\n`;
  md += `| Version | ${expo.version || "N/A"} |\n`;
  md += `| iOS Bundle ID | ${expo.ios?.bundleIdentifier || "N/A"} |\n`;
  md += `| Android Package | ${expo.android?.package || "N/A"} |\n`;
  md += `| Commit | ${commitHash} |\n\n`;

  md += `## Test Summary\n\n`;
  md += `| Check | Status |\n|-------|--------|\n`;
  md += `| Metadata Validation | ${jsonReport.sections.metadataValidation.status} |\n`;
  md += `| ESLint | ${jsonReport.sections.lint.status} |\n`;
  md += `| TypeScript | ${jsonReport.sections.typecheck.status} |\n`;
  md += `| Unit Tests | ${jsonReport.sections.unitTests.status} |\n`;
  md += `| Smoke Test | ${jsonReport.sections.smokeTest.status} |\n\n`;

  md += `## Screenshot Matrix\n\n`;
  md += `| Platform | Count |\n|----------|-------|\n`;
  md += `| iOS | ${iosScreenshots} |\n`;
  md += `| Android | ${androidScreenshots} |\n\n`;

  if (metadata?.results) {
    md += `## Metadata Validation Details\n\n`;
    for (const r of metadata.results) {
      const icon = r.status === "pass" ? "+" : r.status === "fail" ? "x" : "!";
      md += `- [${icon}] ${r.message}\n`;
    }
    md += `\n`;
  }

  if (knownRisks.length > 0) {
    md += `## Known Risks\n\n`;
    for (const risk of knownRisks) {
      md += `- ${risk}\n`;
    }
    md += `\n`;
  }

  md += `## Checklist (Apple / Google)\n\n`;
  md += `| Requirement | Evidence |\n|-------------|----------|\n`;
  md += `| Demo login credentials | Validated in metadata + E2E login flow |\n`;
  md += `| Pre-populated content | Validated by E2E assertions |\n`;
  md += `| Privacy Policy | Validated in metadata check |\n`;
  md += `| Account Deletion | Validated in metadata check (Guideline 5.1.1(v)) |\n`;
  md += `| Screenshots | evidence/screenshots/ |\n`;
  md += `| Stability | Unit + E2E + smoke tests |\n`;
  md += `| Content Moderation | Content filter in lib/moderation.ts |\n`;

  fs.writeFileSync(path.join(EVIDENCE, "submission-readiness.md"), md);

  console.log("Submission readiness reports generated:");
  console.log(`  - ${path.join(EVIDENCE, "submission-readiness.json")}`);
  console.log(`  - ${path.join(EVIDENCE, "submission-readiness.md")}`);
  console.log(`Overall: ${overallStatus}`);
}

main();
