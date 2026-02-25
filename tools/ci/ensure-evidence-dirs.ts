import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "../..");
const EVIDENCE = path.join(ROOT, "evidence");

const dirs = [
  path.join(EVIDENCE, "reports"),
  path.join(EVIDENCE, "screenshots", "ios", "iphone-67"),
  path.join(EVIDENCE, "screenshots", "ios", "iphone-61"),
  path.join(EVIDENCE, "screenshots", "ios", "ipad-129"),
  path.join(EVIDENCE, "screenshots", "android", "phone"),
  path.join(EVIDENCE, "screenshots", "android", "tablet"),
];

for (const dir of dirs) {
  fs.mkdirSync(dir, { recursive: true });
}

const gitkeep = path.join(EVIDENCE, ".gitkeep");
if (!fs.existsSync(gitkeep)) {
  fs.writeFileSync(gitkeep, "");
}

const readme = path.join(EVIDENCE, "README.md");
if (!fs.existsSync(readme)) {
  fs.writeFileSync(
    readme,
    "# Evidence\n\nAuto-generated submission readiness evidence.\n"
  );
}

console.log("Evidence directories created successfully.");
process.exit(0);
