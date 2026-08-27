# SortableJS — Upstream Modernization Plan

Goal: turn `samuelfa/Sortable` into the visibly maintained reference fork, then carry the work
into `SortableJS/Sortable` (upstream) phase by phase.

Status when this was written:

- Fork `master`: Playwright stack fully merged, **108/108 green** across chromium/firefox/webkit/mobile-touch (2 workers), CI workflow active.
- Upstream `master` (`48b626b`, pushed 2026-03-24): **no GitHub Actions at all**, CircleCI dead since 2019, still TestCafe-era tooling.
- Upstream open PRs: 39 (triage summary in appendix).
- GitHub auth: two accounts configured (`samuelfa` active, `sfe-efficy` secondary).
  ⚠️ This running shell may still export the old invalid `GITHUB_TOKEN` — if `gh api` 401s,
  run `unset GITHUB_TOKEN` first (`.bashrc` is already cleaned for future terminals).

## Workflow rule

**Every change goes through a PR — no direct commits to `master`, on either repo.**

- Fork changes → branch off fork `master` (e.g. `chore/<topic>`), push, open PR into
  `samuelfa/Sortable master`; let CI run green before merging.
- Upstream changes → branch off **upstream** `master` pushed to the fork
  (e.g. `docs/remove-legacy-ci`, `ci/playwright-migration`), PR into `SortableJS/Sortable`.
- One topic per PR; stacked PRs allowed for big ports (toolchain → tests → artifacts).

---

## Phase 1 — Docs & hygiene PR on upstream _(easy, do first)_

Zero behavior change; builds trust with maintainers.

Branch: off upstream `master`, e.g. `docs/remove-legacy-ci`.

Checklist (exact locations verified in upstream master):

- [ ] README.md line 1: remove dead **CircleCI** badge
- [ ] README.md line 7: remove **Sauce Labs** banner + link (`st/saucelabs.svg`)
- [ ] README.md lines ~60-62: remove **Bower** install section (Bower is EOL)
- [ ] delete `.circleci/config.yml`
- [ ] delete `.testcaferc.json`
- [ ] package.json: drop devDeps `testcafe`, `testcafe-browser-provider-saucelabs`,
      `testcafe-reporter-xunit` (leave `"test"` script pointing at old runner for now —
      removal belongs to Phase 2 to avoid a red script)
- [ ] CONTRIBUTING.md: soften references to Sauce/TestCafe where trivially wrong

PR body should link this plan and note Phase 2 incoming.

---

## Phase 2 — CI & toolchain PR on upstream _(the real one)_

Purpose: give upstream a green CI so all further PRs get automated signal.

Build steps:

1. Branch fresh off **current upstream master**: `ci/playwright-migration`.
   Do NOT merge fork master (it carries fork-specific bits).
2. Copy over from fork master, group by group:
   - CI: `.github/workflows/ci.yaml`, `setup.sh`
   - Tests: `playwright.config.js`, `tests/*.test.js`, `tests/fixtures.js`,
     updated fixture HTMLs (viewport meta, nested layout fix), `tests/style.css`
   - Quality gates: `eslint.config.js`, `.prettierrc`, `.prettierignore`,
     package scripts `lint` / `lint:fix` / `format:check` / `format:write` / `test` / `build:*`
   - Toolchain: new `package.json` + regenerated `package-lock.json`
     (out: testcafe/saucelabs/xunit; in: @playwright/test, rollup v4 @rollup/* plugins)
   - Rebuilt artifacts: `Sortable.js`, `Sortable.min.js`, `modular/*`
   - Removals: `.circleci/`, `.testcaferc.json`, `scripts/test*.js`, `serve.json` stays
3. Conflict watch-outs (upstream moved since fork base):
   - `#2463` multidrag dragEl memory-leak fix (Mar 2026) — verify it survives reformat/rebuild;
     add a regression test if cheap
   - Any other upstream commits touching `src/` after Aug 2025: diff-list them before starting
4. Validate: `./setup.sh && npm run lint && npm run format:check && npm run build && npm test`
   expect 108/108 (+ any new upstream-parity tests)
5. Push branch to fork, open PR into `SortableJS/Sortable`.

Review-aid: split into stacked PRs if reviewers balk (a: toolchain+CI, b: tests, c: artifacts).

---

## Phase 0 — Visibility issue on upstream _(open whenever fork feels ready)_

One issue on SortableJS/Sortable proposing adoption:

- link fork + live Actions badge showing green multi-engine runs
- summarize findings: no CI currently exists upstream; 39 open PRs with zero checks;
  stale TestCafe/SauceLabs tooling
- attach triage highlights (appendix) and propose the phase order
- positions samuelfa (already listed in package.json maintainers) as hands-on maintainer

---

## Appendix — Upstream PR triage snapshot

Verdict groups (details in conversation log / regenerate anytime):

| Group                                                          | PRs                                                                                                                            |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Dependabot dev-dep bumps (low severity, superseded by Phase 2) | 2170, 2172, 2226, 2233, 2237, 2242(dirty), 2250, 2256                                                                          |
| Quick-win bugfixes (clean, small)                              | 1754, 2152, 2365, 2429, 2465, 2418, 2373, 2193, 1702, 2421                                                                     |
| Needs functional review                                        | 2164, 2083(rebase), 1691(heavy rebase)                                                                                         |
| Features with priority                                         | 2368 RTL (**approved review**, top pick), 2459 moveBefore                                                                      |
| Discuss API design first                                       | 2198 drag events, 2195 revert option                                                                                           |
| Mutually exclusive pair — maintainer must choose               | 2245 fallbackParent **vs** 2473 fallbackOnto                                                                                   |
| Security                                                       | 2447 ReDoS prettify (rework), 2449 SECURITY.md (merge)                                                                         |
| Stale / close candidates                                       | 1952 (104-file mega), 1790 (changes-requested 2021), 2395 (vague scope), 1327 (2018), 2470 (superseded by Playwright coverage) |

Key fact: **zero of the 39 have any CI checks** — upstream has no workflows at all.
That is why Phase 2 precedes serious PR merging.

---

## Cheat sheet

```bash
# upstream workspace (recreate if /tmp wiped)
git clone https://github.com/SortableJS/Sortable.git /tmp/opencode/upstream-sortable
cd /tmp/opencode/upstream-sortable
git fetch origin pull/N/head:pr-N     # local PR inspection, no API quota

# fork validation
./setup.sh && npm run lint && npm run format:check && npm run build && npm test

# identity reminders
unset GITHUB_TOKEN        # only needed in shells opened before .bashrc cleanup
gh auth switch -u samuelfa
```
