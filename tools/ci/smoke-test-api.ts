import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "../..");
const REPORTS = path.join(ROOT, "evidence", "reports");

interface EndpointResult {
  endpoint: string;
  status: number | null;
  ok: boolean;
  responseTime: number;
  error?: string;
  body?: unknown;
}

async function fetchWithTimeout(
  url: string,
  timeoutMs: number = 10000
): Promise<{ status: number; body: unknown; time: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const start = Date.now();

  try {
    const res = await fetch(url, { signal: controller.signal });
    const time = Date.now() - start;
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = await res.text().catch(() => null);
    }
    return { status: res.status, body, time };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  fs.mkdirSync(REPORTS, { recursive: true });

  const baseUrl = process.env.PROD_API_URL;
  if (!baseUrl) {
    console.error("PROD_API_URL environment variable is required");
    const report = {
      timestamp: new Date().toISOString(),
      baseUrl: null,
      overallStatus: "FAIL",
      error: "PROD_API_URL not set",
      endpoints: [],
    };
    fs.writeFileSync(
      path.join(REPORTS, "postdeploy-smoke.json"),
      JSON.stringify(report, null, 2)
    );
    process.exit(1);
  }

  const cleanBase = baseUrl.replace(/\/+$/, "");
  const endpoints: { path: string; critical: boolean }[] = [
    { path: "/api/health", critical: true },
    { path: "/api/version", critical: false },
  ];

  const results: EndpointResult[] = [];

  for (const ep of endpoints) {
    const url = `${cleanBase}${ep.path}`;
    console.log(`Testing ${url}...`);
    try {
      const { status, body, time } = await fetchWithTimeout(url);
      const ok = status >= 200 && status < 300;
      results.push({ endpoint: ep.path, status, ok, responseTime: time, body });
      console.log(`  ${ok ? "OK" : "FAIL"} - ${status} (${time}ms)`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({
        endpoint: ep.path,
        status: null,
        ok: false,
        responseTime: 0,
        error: msg,
      });
      console.log(`  FAIL - ${msg}`);
    }
  }

  const criticalFails = endpoints
    .filter((ep) => ep.critical)
    .filter((ep) => {
      const result = results.find((r) => r.endpoint === ep.path);
      return !result?.ok;
    });

  const overallStatus = criticalFails.length === 0 ? "PASS" : "FAIL";

  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: cleanBase,
    overallStatus,
    summary: {
      total: results.length,
      passed: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
    },
    endpoints: results,
  };

  const outputPath = path.join(REPORTS, "postdeploy-smoke.json");
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`\nSmoke test report written to ${outputPath}`);
  console.log(`Overall: ${overallStatus}`);

  if (overallStatus === "FAIL") {
    process.exit(1);
  }
}

main();
