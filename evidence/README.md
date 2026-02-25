# Evidence Directory

This directory contains auto-generated submission readiness evidence for App Store and Google Play submissions.

## Structure

```
evidence/
  reports/
    metadata-validation.json   - App config validation results
    eslint.txt                 - Lint results
    typecheck.txt              - TypeScript type checking results
    audit.json                 - Dependency audit results
    postdeploy-smoke.json      - Post-deploy smoke test results
  screenshots/
    ios/
      iphone-67/              - iPhone 6.7" screenshots
      iphone-61/              - iPhone 6.1" screenshots
      ipad-129/               - iPad 12.9" screenshots
    android/
      phone/                  - Android phone screenshots
      tablet/                 - Android tablet screenshots
  submission-readiness.md      - Human-readable submission report
  submission-readiness.json    - Machine-readable submission report
```

## Generation

Run locally (where possible):
```bash
npm run evidence:build
```

Or via GitHub Actions CI workflows for full evidence including screenshots.

## Notes

- iOS screenshots require macOS CI runners (GitHub Actions)
- Android screenshots can run on Ubuntu CI
- All files in this directory are auto-generated; do not edit manually
