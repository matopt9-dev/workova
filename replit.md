# Workova - Service Marketplace App

## Overview
Workova is a two-sided service marketplace mobile app built with Expo React Native. Customers can post jobs and hire workers, while workers can create profiles and submit offers.

## Architecture
- **Frontend**: Expo React Native with TypeScript, Expo Router for navigation
- **Backend**: Express server (port 5000) serving landing page and API
- **State**: AsyncStorage for local data persistence, React Context for shared state
- **Fonts**: DM Sans (Google Fonts)

## Key Features
- Authentication (email/password with AsyncStorage)
- Guest mode: browse home and jobs without login (App Store Guideline 5.1.1)
- Demo account with pre-populated sample data (Guideline 2.1)
- Job creation & listing with categories
- Worker onboarding (profile setup with categories, bio, radius)
- Offer system (workers submit offers on jobs, customers accept/reject)
- In-app messaging (chat threads per job)
- Role switching (customer/worker/both)
- Account management with settings
- Account deletion flow (Guideline 5.1.1(v))
- Content moderation (keyword filter on job/offer creation)
- Report system (flag inappropriate jobs/content)
- Legal/support pages (Privacy Policy, Terms of Service, Help & Support, Community Guidelines)

## Project Structure
```
app/
  _layout.tsx          - Root layout with providers (Auth, QueryClient)
  (auth)/              - Modal auth flow (login, register)
  (tabs)/              - Tab navigation (Home, Jobs, Messages, Account)
  job-create.tsx       - Modal for creating jobs
  job/[id].tsx         - Job detail with offers + report
  offer-create.tsx     - Form sheet for submitting offers
  chat/[id].tsx        - Chat thread
  worker-onboarding.tsx - Worker profile setup modal
  privacy-policy.tsx   - Privacy policy content page
  terms-of-service.tsx - Terms of service content page
  help-support.tsx     - Help & Support with FAQ
  community-guidelines.tsx - Community guidelines page

components/ui/
  theme.ts             - Design tokens (colors, radii, spacing, shadows, fonts)
  Button.tsx           - PrimaryButton, SecondaryButton with spring animations
  Card.tsx             - Card component with shadow/border
  EmptyState.tsx       - Empty state with icon + text
  TrustBadgesRow.tsx   - Trust/safety microcopy (auth, payment, provider variants)
  Screen.tsx           - Screen wrapper
  ServiceIconTile.tsx  - Category tile with icon

contexts/
  AuthContext.tsx       - Auth state management (signIn, signUp, signOut, signInAsDemo)

lib/
  storage.ts           - AsyncStorage data layer (includes deleteAccount, seedDemoData, createReport)
  moderation.ts        - Content moderation keyword filter
  categories.ts        - Job categories with icons
  query-client.ts      - React Query setup

constants/
  colors.ts            - Theme colors (aligned with design tokens)
```

## Design System
- **Theme file**: `components/ui/theme.ts` defines all design tokens
- **Primary**: #0D9488 (teal), **Accent**: #F59E0B (amber)
- **Font**: DM Sans (Regular, Medium, SemiBold, Bold)
- **Surfaces**: #F7F8FA (bg), #FFFFFF (surface), #F1F5F9 (secondary)
- **Radii**: xs(8), sm(12), card(18), button(16), tile(20)
- **Shadows**: Platform-specific (iOS shadowColor, Android elevation)
- **Micro-animations**: Spring scale on buttons/pressables (scale 0.97 on press)
- **TrustBadgesRow**: 3 variants (auth, payment, provider) for trust/safety microcopy
- Clean, minimal marketplace aesthetic inspired by TaskRabbit/Thumbtack

## App Store Compliance
- Guest mode: Home and Jobs (Browse tab) accessible without login (Guideline 5.1.1)
- Account deletion: Full data removal (user, jobs, offers, chats, messages, worker profile) (Guideline 5.1.1(v))
- Demo account: "Try Demo Account" on login screen seeds sample data (Guideline 2.1)
- Content moderation: Keyword filter on job/offer text fields (Guideline 1.2)
- Report system: Flag icon on job details for reporting (Spam, Inappropriate, Fraud, Other) (Guideline 1.2)
- Block user: Ban icon on job detail header and chat header; blocks user and removes their content from feed instantly (Guideline 1.2)
- Blocked users management: Unblock users from Account > Blocked Users section
- EULA checkbox: Register screen requires explicit agreement to Terms, Privacy Policy, Community Guidelines with "zero tolerance" language (Guideline 1.2)
- Zero tolerance policy: Community Guidelines and Terms of Service include explicit zero-tolerance for objectionable content
- 24-hour moderation commitment: Reports reviewed within 24 hours, offending users ejected
- Community Guidelines: Accessible from Account settings
- Legal pages: Privacy Policy, Terms of Service, Help & Support
- WeatherKit: App does NOT use WeatherKit (note for App Store Connect review notes)

## Release Readiness System

### Local Commands
```bash
npx tsx tools/ci/ensure-evidence-dirs.ts    # Create evidence directories
npx tsx tools/ci/validate-metadata.ts       # Validate app.json metadata
bash tools/ci/run-checks.sh                 # Run lint + typecheck + audit
npx tsx tools/ci/generate-report.ts         # Generate submission report
PROD_API_URL=https://your-url npx tsx tools/ci/smoke-test-api.ts  # Post-deploy smoke test
```

### CI Workflows (GitHub Actions)
- `ci.yml` — Runs on PR: lint, typecheck, audit, metadata validation, report (ubuntu)
- `screenshots-ios.yml` — On demand: iOS simulator screenshots (macos)
- `screenshots-android.yml` — On demand: Android emulator screenshots (ubuntu)
- `post-deploy-smoke.yml` — On demand: post-deploy smoke tests

### Evidence Artifacts
All generated to `/evidence/`:
- `reports/metadata-validation.json` — App config validation
- `reports/eslint.txt`, `reports/typecheck.txt` — Code quality
- `reports/audit.json` — Dependency audit
- `reports/postdeploy-smoke.json` — Smoke test results
- `screenshots/ios/`, `screenshots/android/` — Store screenshots (CI only)
- `submission-readiness.md` / `.json` — Final submission report

### E2E Flows (Maestro)
- `tools/e2e/maestro/flow-login.yaml` — Login with demo credentials
- `tools/e2e/maestro/flow-core.yaml` — Core navigation through all tabs

### Environment Variables (for CI)
- `E2E_DEMO_EMAIL` — Demo account email for E2E tests
- `E2E_DEMO_PASSWORD` — Demo account password for E2E tests
- `PROD_API_URL` — Production API URL for smoke tests

### API Endpoints
- `GET /api/health` — Health check (status + timestamp)
- `GET /api/version` — App version info (name + version)

### Project Structure (tools)
```
tools/
  ci/
    ensure-evidence-dirs.ts  - Create evidence directory structure
    validate-metadata.ts     - Validate app.json for store requirements
    run-checks.sh            - Run lint, typecheck, audit, tests
    generate-report.ts       - Generate submission readiness reports
    smoke-test-api.ts        - Post-deploy API smoke tests
  e2e/
    maestro/
      flow-login.yaml        - Maestro login E2E flow
      flow-core.yaml         - Maestro core navigation flow
  screenshots/
    take-screenshots-ios.sh  - iOS simulator screenshots (macOS CI)
    take-screenshots-android.sh - Android emulator screenshots (ubuntu CI)
evidence/                    - Auto-generated evidence output
.github/workflows/           - GitHub Actions CI/CD workflows
```

## Recent Changes
- 2026-02-21: Initial build of complete Workova app
- 2026-02-21: Comprehensive design system with theme tokens and reusable UI primitives
- 2026-02-21: Applied design system across all screens (tabs, modals, auth)
- 2026-02-21: Added trust/safety microcopy via TrustBadgesRow component
- 2026-02-21: Created Privacy Policy, Terms of Service, Help & Support pages
- 2026-02-24: App Store compliance: guest mode, account deletion, demo account, content moderation, report system, community guidelines
- 2026-02-24: Submission Readiness System: CI/CD scripts, evidence generation, Maestro E2E flows, screenshot tooling, GitHub Actions workflows, health/version API endpoints, testID props
- 2026-02-25: Apple Build 2 rejection fixes: EULA checkbox on register, block user UI (job detail + chat), blocked user content filtering, unblock in account settings, zero-tolerance language in Terms/Guidelines, 24-hour moderation commitment, report-then-block flow
