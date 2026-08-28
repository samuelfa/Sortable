# CI Documentation

This document describes the Continuous Integration workflows for Sortable.

## Workflows Overview

| Workflow             | Trigger                | Purpose                          |
| -------------------- | ---------------------- | -------------------------------- |
| **Lint**             | All PRs                | Code style & formatting          |
| **Test**             | Code changes only      | Build & Playwright tests         |
| **Security Audit**   | Package file changes   | Dependency vulnerability scan    |
| **Knip**             | Source/package changes | Unused code/dependency detection |
| **Code Coverage**    | Weekly + manual        | JS code coverage (Chromium)      |
| **CodeQL**           | Push/PR/weekly         | Static analysis (SAST)           |
| **Bundle Size**      | PR on source changes   | Bundle size tracking             |
| **Dependabot**       | Weekly schedule        | Automated dependency updates     |
| **Dependency Check** | Weekly + manual        | Outdated dependency report       |

---

## Lint Workflow (`.github/workflows/lint.yml`)

**Runs on:** All pull requests

**Jobs:**

- `lint`: ESLint + Prettier format check

```bash
npm run lint
npm run format:check
```

---

## Test Workflow (`.github/workflows/test.yml`)

**Runs on:** Pull requests with code changes (ignores docs-only changes)

**Paths ignored:**

- `**/*.md`
- `CHANGELOG*`
- `LICENSE*`

**Jobs:**

- `test`: Build + Playwright tests

```bash
npm run build
npm run test
```

**Caching:** Playwright browsers cached via `actions/cache@v6`

---

## Security Audit Workflow (`.github/workflows/security.yml`)

**Runs on:** Pull requests modifying `package.json` or `package-lock.json`

**Jobs:**

- `audit`: Runs `npm audit` (fails on any vulnerability)

```bash
npm audit
```

**Reports:** All vulnerability severities (no `--audit-level` filter)

---

## Knip Workflow (`.github/workflows/knip.yml`)

**Runs on:** Pull requests modifying source files, plugins, tests, or package files

**Paths watched:**

- `package.json`
- `package-lock.json`
- `knip.json`
- `src/**`
- `plugins/**`
- `tests/**`

**Jobs:**

- `knip`: Runs knip to detect unused files, exports, and dependencies

```bash
npx knip
```

**Configuration:** `knip.json` defines entries, project files, and ignored patterns

---

## Code Coverage Workflow (`.github/workflows/coverage.yml`)

**Runs on:** Weekly (Monday 10am) + manual dispatch

**Jobs:**

- `coverage`: Runs coverage test on Chromium only

```bash
npm run build
npm run test:coverage
```

**Details:**

- Uses Playwright's native Coverage API (Chromium only)
- Converts V8 coverage to Istanbul format via `v8-to-istanbul`
- Uploads `coverage/coverage.json` as artifact (14-day retention)
- Posts summary to GitHub Step Summary

**Coverage baseline:** ~53% statements, ~58% functions

---

## CodeQL Workflow (`.github/workflows/codeql.yml`)

**Runs on:** Push to master, PRs to master, weekly (Monday 11am)

**Jobs:**

- `analyze`: GitHub CodeQL static analysis

**Details:**

- Language: JavaScript
- Query suite: `security-and-quality` (OWASP Top 10, CWE, etc.)
- Free for open source
- Results in Security tab + PR checks

---

## Bundle Size Workflow (`.github/workflows/bundle-size.yml`)

**Runs on:** PRs modifying source, plugins, scripts, or build config

**Paths watched:**

- `src/**`
- `plugins/**`
- `scripts/**`
- `package.json`
- `package-lock.json`
- `rollup.config.js`

**Jobs:**

- `bundle-size`: Builds and reports bundle sizes

**Outputs (raw + gzipped):**

- `Sortable.js` / `Sortable.min.js`
- `modular/sortable.esm.js`
- `modular/sortable.core.esm.js`
- `modular/sortable.complete.esm.js`

**Artifacts:** Uploaded (7-day retention)
**Summary:** Posted to PR Step Summary

---

## Dependabot (`.github/dependabot.yml`)

**Schedule:** Weekly Monday 9am

**Groups:**

- `development-dependencies` - all dev deps
- `babel` - @babel/* packages
- `rollup` - @rollup/*, rollup

**Auto-merge:** Patch/minor updates (major ignored)

---

## Dependency Check Workflow (`.github/workflows/deps.yml`)

**Runs on:** Weekly Monday 9am + manual dispatch

**Jobs:**

- `outdated`: Runs `npm outdated` + `npm-check-updates`

```bash
npm outdated
npx npm-check-updates
```

**Summary:** Posted to GitHub Step Summary

---

## Local Development

### Run all CI checks locally

```bash
# Lint & format
npm run lint
npm run format:check

# Tests
npm run build
npm run test

# Security audit
npm audit

# Knip (unused code detection)
npx knip

# Coverage
npm run test:coverage
# or
npm run coverage  # builds + coverage
```

### One-shot setup

```bash
./setup.sh
```

Installs dependencies, Playwright browsers, and OS dependencies.

---

## Node Version

Defined in `.nvmrc` (currently Node 24). Used by:

- `actions/setup-node@v7` in all workflows
- Local development via `nvm use`

---

## Adding New Workflows

1. Create `.github/workflows/<name>.yml`
2. Use `node-version-file: '.nvmrc'` for Node version
3. Use `actions/cache@v6` for Playwright browser cache (if applicable)
4. Add `concurrency` to cancel in-progress runs
5. Update this document
