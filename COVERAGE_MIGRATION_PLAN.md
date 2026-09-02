# Coverage Migration Plan: rollup-plugin-istanbul → babel-plugin-istanbul

## Executive Summary

**Goal**: Migrate from unmaintained `rollup-plugin-istanbul` to `babel-plugin-istanbul` + `@rollup/plugin-babel` to fix Playwright code coverage reporting (`window.__coverage__`) and eliminate unmaintained dependency.

**Status**: CRITICAL - Current implementation is BROKEN (0% coverage on all browsers)

---

## Current State Analysis

### What's Working ✅

- Build system works (Rollup + Babel + Rollup plugins)
- Playwright tests run on 3 browsers (Chromium, Firefox, WebKit) - 81 tests pass
- Istanbul instrumentation runs during build (cov_* functions generated)
- Playwright tests execute on Chromium, Firefox, WebKit

### What's BROKEN ❌

- **Coverage always 0%** - `window.__coverage__` is undefined in browser
- Istanbul's `cov_*` functions exist in IIFE scope but NOT on `window.__coverage__`
- `babel-plugin-istanbul` installed but NOT configured in babel.config.json (missing "test" env)
- `BABEL_ENV=test` not set during build

### Root Cause

1. **babel.config.json** missing `"test"` env with `istanbul` plugin
2. `BABEL_ENV=test` not set during build
3. `rollup-plugin-istanbul` doesn't properly expose `window.__coverage__` in IIFE bundle
4. Coverage fixture tries to find `cov_*` functions on `window` but they're in IIFE closure scope

---

## Migration Plan: rollup-plugin-istanbul → babel-plugin-istanbul

### Phase 1: Configuration Fixes (HIGH PRIORITY)

#### 1.1 Update babel.config.json

Add "test" env with istanbul plugin:

```json
{
	"env": {
		"test": {
			"plugins": [
				[
					"istanbul",
					{
						"exclude": [
							"test/**/*",
							"entry/**",
							"scripts/**",
							"node_modules/**"
						],
						"instrumenterConfig": {
							"coverageGlobalScope": "window",
							"coverageGlobalScopeFunc": false
						}
					}
				]
			]
		}
	}
}
```

#### 1.2 Update build.js - Remove rollup-plugin-istanbul

- Remove `rollup-plugin-istanbul` import and usage
- Keep `babel` with `babelHelpers: 'bundled'`
- Always use `format: 'iife'` for coverage builds
- Set `output.name: 'Sortable'` for IIFE global binding

#### 1.3 Set BABEL_ENV=test during coverage build

```bash
BABEL_ENV=test COVERAGE=true npm run build
```

---

## Phase 2: Build Script Updates

### scripts/build.js

- Remove `rollup-plugin-istanbul` import
- Remove `isCoverage` logic for format (always use 'iife' for coverage)
- Keep `babel` with `babelHelpers: 'bundled'`
- Remove `rollup-plugin-istanbul` plugin setup

### scripts/umd-build.js - Add second output for IIFE coverage build

```javascript
export default [
	{
		...build,
		input: 'entry/entry-complete.js',
		output: { ...build.output, file: './Sortable.js', format: 'umd' },
	},
	{
		...build,
		input: 'entry/entry-complete.js',
		output: {
			...build.output,
			file: './Sortable.js',
			format: 'iife',
			name: 'Sortable',
		},
	},
];
```

---

### Phase 2: Babel Configuration

#### Create babel.config.json

```json
{
  "presets": [["@babel/preset-env", { "targets": "defaults" }]],
  "plugins": ["@babel/plugin-transform-object-assign"],
  "env": {
    "test": {
      "plugins": [["istanbul", {
        "exclude": ["test/**/*", "entry/**", "scripts/**", "node_modules/**"],
        "instrumenterConfig": {
          "coverageGlobalScope": "window",
          "coverageGlobalScopeFunc": false
        }]
      }]
    },
    "es": {
      "presets": [["@babel/preset-env", { "modules": false }]]
    },
    "umd": {
      "presets": [["@babel/preset-env", { "modules": false }]]
    }
  }
}
```

---

### Phase 3: Build Script Updates

#### scripts/build.js

- Remove `rollup-plugin-istanbul` import
- Remove `isCoverage` logic for format (always use 'iife' for coverage)
- Keep `babel` with `babelHelpers: 'bundled'`
- Remove `rollup-plugin-istanbul` plugin setup

### scripts/umd-build.js - Add second output for IIFE coverage build

```javascript
export default [
	{
		...build,
		input: 'entry/entry-complete.js',
		output: { ...build.output, file: './Sortable.js', format: 'umd' },
	},
	{
		...build,
		input: 'entry/entry-complete.js',
		output: {
			...build.output,
			file: './Sortable.js',
			format: 'iife',
			name: 'Sortable',
		},
	},
];
```

### scripts/umd-build.js - Add second output for IIFE coverage build

```javascript
export default [
	{
		...build,
		input: 'entry/entry-complete.js',
		output: {
			...build.output,
			file: './Sortable.js',
			format: 'umd',
		},
	},
	{
		...build,
		input: 'entry/entry-complete.js',
		output: {
			...build.output,
			file: './Sortable.js',
			format: 'iife',
			name: 'Sortable',
		},
	},
];
```

---

### Phase 2: Babel Configuration

#### Create babel.config.json

```json
{
  "presets": [["@babel/preset-env", { "targets": "defaults" }]],
  "plugins": ["@babel/plugin-transform-object-assign"],
  "env": {
    "test": {
      "plugins": [["istanbul", {
        "exclude": ["test/**/*", "entry/**", "scripts/**", "node_modules/**"],
        "instrumenterConfig": {
          "coverageGlobalScope": "window",
          "coverageGlobalScopeFunc": false
        }]
      }]
    },
    "es": {
      "presets": [["@babel/preset-env", { "modules": false }]]
    },
    "umd": {
      "presets": [["@babel/preset-env", { "modules": false }]]
    }
  }
}
```

---

### Phase 3: Build Script Updates

#### package.json Scripts Updates

```json
{
	"test:coverage": "BABEL_ENV=test COVERAGE=true npx playwright test --project=chromium --project=firefox --project=webkit",
	"coverage": "npm run build && npm run test:coverage && npx nyc report --reporter=text --reporter=html --reporter=lcov",
	"coverage:ci": "npm run coverage"
}
```

### nyc config with 80% thresholds

```json
"nyc": {
  "all": true,
  "include": ["src/**/*.js", "plugins/**/*.js"],
  "exclude": ["tests/**", "entry/**", "scripts/**", "node_modules/**"],
  "reporter": ["text", "html", "lcov"],
  "report-dir": "./coverage",
  "instrument": false,
  "thresholds": {
    "statements": 80,
    "branches": 80,
    "functions": 80,
    "lines": 80
  }
}
```

---

### Phase 3: Cleanup & Thresholds

1. **Remove obsolete files**:
   - `tests/coverage.test.js`
   - `tests/coverage-full-suite.test.js`
   - `tests/fixtures/coverage-map.ts`
   - `tests/fixtures/coverage.ts`

2. **Remove unused dependencies**:
   - `v8-to-istanbul`
   - `istanbul-lib-coverage`
   - `istanbul-lib-report`
   - `istanbul-reports`
   - `istanbul-lib-coverage`
   - `istanbul-lib-report`
   - `istanbul-reports`

3. **Keep**:
   - `nyc` (for report generation)
   - `babel-plugin-istanbul` (new)

---

### Phase 4: Documentation Updates

1. **docs/ci.md** - Update with correct coverage workflow
2. **CONTRIBUTING.md** - Add `test:coverage` command reference
3. **Remove obsolete coverage test files** from docs

---

## Verification Steps

```bash
# 1. Build with coverage
BABEL_ENV=test COVERAGE=true npm run build

# 2. Verify bundle has __coverage__
grep -c "__coverage__" Sortable.js

# 2. Run coverage tests on all browsers
COVERAGE=true npm run test:coverage

# 3. Generate reports
npm run coverage
```

---

## Risk Mitigation

| Risk                | Probability | Impact | Mitigation                              |
| ------------------- | ----------- | ------ | --------------------------------------- |
| Build breaks        | Low         | High   | Git rollback available                  |
| Coverage still 0%   | Medium      | High   | Fallback to rollup-plugin-istanbul      |
| Babel config errors | Low         | Medium | Validate with `npx babel --show-config` |
| Tests fail          | Low         | Medium | Existing tests pass without coverage    |

## Rollback Plan

```bash
git checkout HEAD -- package.json scripts/build.js scripts/umd-build.js scripts/esm-build.js babel.config.js
npm install
npm run build
```

---

## Questions for Review

1. **Target browsers**: Confirm Chromium + Firefox + WebKit (all three)?
2. **Threshold**: Keep 80% for all metrics?
3. **CI schedule**: Keep weekly Monday 10am?
4. **Any other coverage requirements?** (e.g. specific files to exclude/include)

---

## Ready to Proceed?

Once approved, I'll execute the implementation in phases:

1. Config fixes (babel.config.json, build.js)
2. Dependency updates
3. Build script updates
4. Test & verification
