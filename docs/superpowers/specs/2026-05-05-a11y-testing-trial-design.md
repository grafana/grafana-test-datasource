# A11y Testing Trial in grafana-test-datasource

**Date:** 2026-05-05
**Branch:** new branch off `bump-plugin-e2e` (which carries the `@grafana/plugin-e2e ^3.7.0` bump that this trial needs - separate PR keeps the dep bump small and reviewable)
**Related:** [plugin-tools PR #2600](https://github.com/grafana/plugin-tools/pull/2600), [#2462](https://github.com/grafana/plugin-tools/pull/2462), [issue #2475](https://github.com/grafana/plugin-tools/issues/2475), [issue #2457](https://github.com/grafana/plugin-tools/issues/2457)

## Context

Plugin-e2e gained an `@alpha` accessibility-testing feature in PR #2462 - a `scanForA11yViolations` fixture wrapping `@axe-core/playwright`'s `AxeBuilder`, plus a `toHaveNoA11yViolations` matcher. It was merged on grafana/grafana's timeline and has only ever been exercised inside grafana itself; it has never been used in an actual plugin.

PR #2600 is documenting the feature, but we held off on announcing it because:

1. The fixture+matcher contract was never validated outside grafana.
2. A custom Playwright reporter (`AxeA11yReporter`) lives in [grafana/grafana e2e-playwright/utils/axe-a11y/](https://github.com/grafana/grafana/blob/main/e2e-playwright/utils/axe-a11y/reporter.ts) and aggregates the per-test `axe-N` JSON attachments into a single report. Issue #2475 tracks moving it into plugin-e2e once it stabilizes - but that decision needs data, not gut feel.

This spec covers a focused trial in this plugin to produce that data: ensure the alpha feature actually works in a plugin, and run grafana's reporter as a second consumer to inform the extraction discussion.

## Goal

Two outcomes from a single piece of work:

1. **Lasting**: real a11y test coverage for grafana-test-datasource.
2. **Throwaway**: a findings document that informs (a) whether the fixture/matcher are ready to drop `@alpha`, and (b) whether grafana's reporter is ready to extract into plugin-e2e or needs reshaping first.

## Non-goals

- Removing the `@alpha` label from plugin-e2e itself - separate PR after the findings.
- Building a fresh, plugin-shaped reporter from scratch - we picked "vendor grafana's reporter as-is" deliberately so any friction is data, not a prejudged answer.
- Fixing the actual a11y violations the trial uncovers - those become follow-up issues.
- CI integration / making a11y failures gate PR merges - keep `npm run e2e` as the only entry point for now.

## Architecture

Three additions to this plugin:

### 1. `tests/a11y.spec.ts` (permanent)

A dedicated spec mirroring grafana's [smoke-tests-suite/accessibility.spec.ts](https://github.com/grafana/grafana/blob/main/e2e-playwright/smoke-tests-suite/accessibility.spec.ts) pattern. Tagged `@a11y` so it can be filtered with `--grep @a11y`. One `test.describe` block per UI surface:

| Surface | How to reach it | Existing spec to mirror |
|---|---|---|
| Datasource config page | `createDataSourceConfigPage({ type })` | `configEditor.spec.ts` |
| Query editor | `panelEditPage` + `panelEditPage.datasource.set(ds.name)` | `queryEditor.spec.ts` |
| Variable editor | from `variableEditPage` | `variableEditor.spec.ts` |
| Annotation editor | from `annotationEditPage` | `annotationsEditor.spec.ts` |
| Alert rule editor | `alertRuleEditPage` (semver-gated `>=9.5.0`) | `alertRule.spec.ts` |

Each test:
- Navigates to the surface and waits for it to be visible (reusing the same locator the existing functional spec uses for its visibility assertion).
- Calls `await scanForA11yViolations()` (or the scoped variant - see below).
- Asserts `expect(results).toHaveNoA11yViolations({ threshold, ignoredRules })`.

### 2. Scoped-include test (permanent)

At least one test in `a11y.spec.ts` exercises the plugin-relevant API shape:

```ts
const results = await scanForA11yViolations({
  include: panelEditPage.getQueryEditorRow('A'),
});
```

This is the case from issue #2457: a plugin author scoping a scan to *just their widget*, not all of Grafana. We have to exercise it because it's the public API surface most plugin authors will actually use.

### 3. Vendored reporter (throwaway, branch-only)

- Copy `reporter.ts` and `types.ts` from grafana verbatim into `tests/utils/axe-a11y/`. **No edits.** The point is to test the contract as Paul wrote it.
- Wire into `playwright.config.ts`:
  ```ts
  reporter: [
    ['html'],
    ['./tests/utils/axe-a11y/reporter.ts'],
  ],
  ```
- Add `@axe-core/playwright` as a `devDependency`. Plugin-e2e declares it as a peer dep and the fixture imports it lazily (throwing a helpful error if missing). We need to install it ourselves.
- Run with `AXE_A11Y_REPORT_PATH=axe-report.json npm run e2e` to produce the aggregate JSON.

**Pre-merge cleanup:** strip `tests/utils/axe-a11y/`, revert the `reporter` array to `'html'`, ensure `axe-report.json` is gitignored or never committed.

## Workflow

1. **Build** - add `a11y.spec.ts` with `threshold: 0` everywhere and no `ignoredRules` (deliberately strict for the first run); vendor the reporter; install the peer dep.
2. **First run** - `AXE_A11Y_REPORT_PATH=axe-report.json npm run e2e`. Tests almost certainly fail. Capture: terminal output, `playwright-report/`, `axe-report.json`.
3. **Analysis** - Claude drives. For every violation in `axe-report.json`:
   - Classify by **ownership** (plugin / Grafana chrome / ambiguous).
   - Classify by **rule category** (color-contrast, label, aria-*, heading-order, region, ...) so systemic issues become visible.
   - Note axe's `impact` field (`minor` / `moderate` / `serious` / `critical`).
   - Render a one-line summary per violation in a markdown table.
   - Build a per-surface recommendation: which violations become `ignoredRules` (chrome-owned, document why), which become a temporary `threshold: N` (plugin-owned, file follow-up), which to fix in this PR if trivial.
   - Surface ambiguous rows for the user to disambiguate.
4. **Apply baselines** - update `a11y.spec.ts` per the analysis. Every `ignoredRules` entry gets an inline comment naming the chrome element responsible. Every `threshold: N > 0` entry links to a follow-up issue.
5. **Second run** - confirm green.
6. **Findings doc** - `docs/a11y-reporter-trial.md`, structured as:
   1. Setup friction (peer dep, reporter wiring, anything not obvious without docs).
   2. Fixture API observations (`include`/`exclude`/`options` behavior, awkward edges).
   3. Matcher API observations (failure-message readability, `threshold`/`ignoredRules` adequacy).
   4. Reporter portability (grafana-specific assumptions surfaced; output JSON shape usefulness for a single-plugin context).
   5. Recommendation - drop `@alpha`? Extract reporter as-is, reshape, or skip?
7. **Strip scaffolding** - vendored reporter out, `playwright.config.ts` reverted, `axe-report.json` not committed. The committed delta is `a11y.spec.ts` + `@axe-core/playwright` devDependency + `docs/a11y-reporter-trial.md`.

## Critical files

- New: `tests/a11y.spec.ts`
- New (throwaway): `tests/utils/axe-a11y/reporter.ts`, `tests/utils/axe-a11y/types.ts`
- New: `docs/a11y-reporter-trial.md`
- Modified: `playwright.config.ts` (reporter array - reverted before merge)
- Modified: `package.json` (`@axe-core/playwright` devDependency)
- Reference (do not modify): `tests/configEditor.spec.ts`, `tests/queryEditor.spec.ts`, `tests/variableEditor.spec.ts`, `tests/annotationsEditor.spec.ts`, `tests/alertRule.spec.ts` - they show the navigation pattern for each surface.
- Reference (upstream sources): `/Users/erik/code/grafana/plugin-tools/packages/plugin-e2e/src/fixtures/scanForA11yViolations.ts`, `/Users/erik/code/grafana/plugin-tools/packages/plugin-e2e/src/matchers/toHaveNoA11yViolations.ts`, `/Users/erik/code/grafana/grafana/e2e-playwright/utils/axe-a11y/reporter.ts`, `/Users/erik/code/grafana/grafana/e2e-playwright/utils/axe-a11y/types.ts`.

## Verification

- `npm run e2e` runs all specs including `a11y.spec.ts`; all green.
- The Playwright HTML report (`playwright-report/index.html`) shows each a11y test with `axe-1.json` (and `axe-2.json` etc. where multiple scans run) attached.
- `AXE_A11Y_REPORT_PATH=axe-report.json npm run e2e` produces a populated aggregate JSON containing `summary`, `violations` and `rawReports` sections.
- Forced-failure check: temporarily set `threshold: -1` on one test, confirm the matcher's failure output is readable and includes rule descriptions plus offending HTML.
- Analysis pass produces a triage table covering 100% of violations from the first run.
- Every `ignoredRules` entry in the final spec has an inline comment naming the responsible chrome element.
- Every `threshold: N > 0` entry links to a follow-up issue.
- Findings doc covers all 5 sections.
- Pre-merge cleanup removed the vendored reporter directory and reverted the `reporter` array in `playwright.config.ts`.
