import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "../..");
const REPORTS = path.join(ROOT, "evidence", "reports");

interface ValidationResult {
  field: string;
  status: "pass" | "fail" | "warn";
  message: string;
}

function main() {
  fs.mkdirSync(REPORTS, { recursive: true });

  const appJsonPath = path.join(ROOT, "app.json");
  if (!fs.existsSync(appJsonPath)) {
    console.error("app.json not found");
    process.exit(1);
  }

  const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf-8"));
  const expo = appJson.expo || {};
  const results: ValidationResult[] = [];

  function check(
    field: string,
    value: unknown,
    required: boolean = true
  ) {
    if (value !== undefined && value !== null && value !== "") {
      results.push({ field, status: "pass", message: `${field}: ${value}` });
    } else if (required) {
      results.push({
        field,
        status: "fail",
        message: `${field} is missing (required)`,
      });
    } else {
      results.push({
        field,
        status: "warn",
        message: `${field} is missing (recommended)`,
      });
    }
  }

  check("expo.name", expo.name);
  check("expo.slug", expo.slug);
  check("expo.version", expo.version);
  check("ios.bundleIdentifier", expo.ios?.bundleIdentifier);
  check("android.package", expo.android?.package);
  check("expo.icon", expo.icon);
  check("expo.splash.image", expo.splash?.image, false);

  const hasEncryptionFlag =
    expo.ios?.infoPlist?.ITSAppUsesNonExemptEncryption !== undefined;
  results.push({
    field: "ios.ITSAppUsesNonExemptEncryption",
    status: hasEncryptionFlag ? "pass" : "warn",
    message: hasEncryptionFlag
      ? `Encryption flag set: ${expo.ios.infoPlist.ITSAppUsesNonExemptEncryption}`
      : "Encryption compliance flag not set (recommended)",
  });

  const privacyPolicyExists = fs.existsSync(
    path.join(ROOT, "app", "privacy-policy.tsx")
  );
  results.push({
    field: "privacyPolicy",
    status: privacyPolicyExists ? "pass" : "fail",
    message: privacyPolicyExists
      ? "Privacy policy screen found"
      : "Privacy policy screen missing (required)",
  });

  const tosExists = fs.existsSync(
    path.join(ROOT, "app", "terms-of-service.tsx")
  );
  results.push({
    field: "termsOfService",
    status: tosExists ? "pass" : "warn",
    message: tosExists
      ? "Terms of service screen found"
      : "Terms of service screen missing (recommended)",
  });

  const helpExists = fs.existsSync(
    path.join(ROOT, "app", "help-support.tsx")
  );
  results.push({
    field: "helpSupport",
    status: helpExists ? "pass" : "warn",
    message: helpExists
      ? "Help & support screen found"
      : "Help & support screen missing (recommended)",
  });

  const hasAuth =
    fs.existsSync(path.join(ROOT, "app", "(auth)", "login.tsx")) ||
    fs.existsSync(path.join(ROOT, "contexts", "AuthContext.tsx"));

  if (hasAuth) {
    results.push({
      field: "auth.detected",
      status: "pass",
      message: "Authentication detected in app",
    });

    const hasDemoEmail = !!process.env.E2E_DEMO_EMAIL;
    const hasDemoPassword = !!process.env.E2E_DEMO_PASSWORD;

    results.push({
      field: "E2E_DEMO_EMAIL",
      status: hasDemoEmail ? "pass" : "warn",
      message: hasDemoEmail
        ? "E2E_DEMO_EMAIL env var set"
        : "E2E_DEMO_EMAIL env var not set (needed for CI E2E tests)",
    });

    results.push({
      field: "E2E_DEMO_PASSWORD",
      status: hasDemoPassword ? "pass" : "warn",
      message: hasDemoPassword
        ? "E2E_DEMO_PASSWORD env var set"
        : "E2E_DEMO_PASSWORD env var not set (needed for CI E2E tests)",
    });

    const storageContent = fs.existsSync(path.join(ROOT, "lib", "storage.ts"))
      ? fs.readFileSync(path.join(ROOT, "lib", "storage.ts"), "utf-8")
      : "";
    const hasSeedDemo = storageContent.includes("seedDemoData");
    results.push({
      field: "demoAccount.seedData",
      status: hasSeedDemo ? "pass" : "warn",
      message: hasSeedDemo
        ? "Demo data seeding function found"
        : "Demo data seeding not found (recommended for App Review)",
    });
  }

  const guidelinesExists = fs.existsSync(
    path.join(ROOT, "app", "community-guidelines.tsx")
  );
  results.push({
    field: "communityGuidelines",
    status: guidelinesExists ? "pass" : "warn",
    message: guidelinesExists
      ? "Community guidelines screen found"
      : "Community guidelines screen missing (recommended)",
  });

  const accountScreen = fs.existsSync(
    path.join(ROOT, "app", "(tabs)", "account.tsx")
  )
    ? fs.readFileSync(
        path.join(ROOT, "app", "(tabs)", "account.tsx"),
        "utf-8"
      )
    : "";
  const hasDeleteAccount =
    accountScreen.includes("deleteAccount") ||
    accountScreen.includes("Delete Account");
  results.push({
    field: "accountDeletion",
    status: hasDeleteAccount ? "pass" : "fail",
    message: hasDeleteAccount
      ? "Account deletion flow found (Guideline 5.1.1(v))"
      : "Account deletion flow missing (required by Guideline 5.1.1(v))",
  });

  const passes = results.filter((r) => r.status === "pass").length;
  const fails = results.filter((r) => r.status === "fail").length;
  const warns = results.filter((r) => r.status === "warn").length;

  const report = {
    timestamp: new Date().toISOString(),
    appName: expo.name || "unknown",
    bundleId: {
      ios: expo.ios?.bundleIdentifier || null,
      android: expo.android?.package || null,
    },
    version: expo.version || null,
    summary: { total: results.length, pass: passes, fail: fails, warn: warns },
    overallStatus: fails === 0 ? "PASS" : "FAIL",
    results,
  };

  const outputPath = path.join(REPORTS, "metadata-validation.json");
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`Metadata validation report written to ${outputPath}`);
  console.log(
    `Result: ${report.overallStatus} (${passes} pass, ${fails} fail, ${warns} warn)`
  );

  for (const r of results) {
    const icon = r.status === "pass" ? "PASS" : r.status === "fail" ? "FAIL" : "WARN";
    console.log(`  [${icon}] ${r.message}`);
  }

  if (fails > 0) {
    process.exit(1);
  }
}

main();
