# CI Documentation

This document describes the Continuous Integration workflows for Sortable.

## Workflows Overview

| Workflow           | Trigger                | Purpose                          |
| ------------------ | ---------------------- | -------------------------------- |
| **Lint**           | All PRs                | Code style & formatting          |
| **Test**           | Code changes only      | Build & Playwright tests         |
| **Security Audit** | Package file changes   | Dependency vulnerability scan    |
| **Knip**           | Source/package changes | Unused code/dependency detection |

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
