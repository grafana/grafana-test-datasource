# A11y Testing Trial Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Validate plugin-e2e's `@alpha` `scanForA11yViolations` fixture and `toHaveNoA11yViolations` matcher in a real plugin, and trial grafana's `AxeA11yReporter` as a second consumer to inform whether to extract it into plugin-e2e.

**Architecture:** Add a permanent `tests/a11y.spec.ts` that scans the plugin's 5 UI surfaces (datasource config, query editor, variable editor, annotation editor, alert rule editor). Vendor grafana's reporter into `tests/utils/axe-a11y/` as throwaway scaffolding wired into `playwright.config.ts`, run once with `AXE_A11Y_REPORT_PATH` set, classify every violation found, set per-surface `threshold`/`ignoredRules` baselines, then strip the scaffolding and write a findings doc.

**Tech Stack:** TypeScript, Playwright, `@grafana/plugin-e2e` `^3.7.0`, `@axe-core/playwright`, axe-core, Docker (for `npm run server`).

**Spec:** [docs/superpowers/specs/2026-05-05-a11y-testing-trial-design.md](../specs/2026-05-05-a11y-testing-trial-design.md)

---

## Pre-task: Branch and environment

- [ ] **Step 1: Create the working branch off `bump-plugin-e2e`**

The plan assumes you are at the repo root: `/Users/erik/code/grafana/plugins/grafana-test-datasource`. The `bump-plugin-e2e` branch carries the `@grafana/plugin-e2e` `^3.7.0` bump that this trial requires.

Run:
```bash
git checkout bump-plugin-e2e
git pull --ff-only
git checkout -b a11y-testing-trial
```

Expected: `Switched to a new branch 'a11y-testing-trial'`.

- [ ] **Step 2: Confirm Grafana is running locally**

The Playwright tests hit a Grafana instance at `http://localhost:3000`. The plugin's `npm run server` brings up Grafana via Docker.

Run (in a separate terminal, leave it running for the rest of the work):
```bash
npm run server
```

Then verify:
```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/api/health
```

Expected: `200`.

If you do not have Docker available, stop here and surface the blocker.

---

## Task 1: Install `@axe-core/playwright` peer dependency

The fixture imports `@axe-core/playwright` lazily and throws a helpful error if it is missing. Plugin-e2e declares it as a peer dep but does not install it for consumers.

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Install the peer dep**

Run:
```bash
npm install --save-dev @axe-core/playwright
```

Expected: lockfile updates, `@axe-core/playwright` appears under `devDependencies` in `package.json`.

- [ ] **Step 2: Verify the install**

Run:
```bash
node -e "console.log(require('@axe-core/playwright').AxeBuilder.name)"
```

Expected output: `AxeBuilder`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @axe-core/playwright as devDependency for a11y tests"
```

---

## Task 2: Vendor grafana's `AxeA11yReporter` into the plugin

Copy the reporter and its types verbatim from grafana. **Do not edit them.** The point of the trial is to discover whether the contract holds outside grafana - any edits we make would prejudge the answer.

**Files:**
- Create: `tests/utils/axe-a11y/reporter.ts`
- Create: `tests/utils/axe-a11y/types.ts`

- [ ] **Step 1: Create the directory and copy the reporter**

Run:
```bash
mkdir -p tests/utils/axe-a11y
cp /Users/erik/code/grafana/grafana/e2e-playwright/utils/axe-a11y/reporter.ts tests/utils/axe-a11y/reporter.ts
cp /Users/erik/code/grafana/grafana/e2e-playwright/utils/axe-a11y/types.ts tests/utils/axe-a11y/types.ts
```

Verify both files exist:
```bash
ls tests/utils/axe-a11y/
```

Expected: `reporter.ts  types.ts`.

- [ ] **Step 2: Confirm the reporter compiles in this project**

Run:
```bash
npx tsc --noEmit tests/utils/axe-a11y/reporter.ts tests/utils/axe-a11y/types.ts
```

Expected: no output (success). If it fails because of `axe-core` types, install them - `axe-core` is a transitive dep of `@axe-core/playwright` so types should already resolve. Surface any other failures.

- [ ] **Step 3: Commit**

```bash
git add tests/utils/axe-a11y/
git commit -m "test: vendor grafana's AxeA11yReporter for trial (throwaway scaffolding)"
```

---

## Task 3: Wire the reporter into `playwright.config.ts`

**Files:**
- Modify: `playwright.config.ts`

- [ ] **Step 1: Replace the `reporter: 'html'` line**

Find the line in `playwright.config.ts`:
```ts
  reporter: 'html',
```

Replace with:
```ts
  reporter: [
    ['html'],
    ['./tests/utils/axe-a11y/reporter.ts'],
  ],
```

- [ ] **Step 2: Sanity-check the config still loads**

Run:
```bash
npx playwright test --list --reporter=list 2>&1 | head -20
```

Expected: a list of test titles, no parse errors. (We have not added the a11y spec yet, so the existing 5 specs' tests are listed.)

- [ ] **Step 3: Commit**

```bash
git add playwright.config.ts
git commit -m "test: wire AxeA11yReporter into playwright config (throwaway scaffolding)"
```

---

## Task 4: Add `tests/a11y.spec.ts` with strict initial settings

Strict initial settings means `threshold: 0` and no `ignoredRules` for every surface, including the scoped-include test. The first run is expected to fail; the failures are the data we analyze in Task 5.

The spec mirrors the navigation patterns of the 5 existing functional specs so we reuse known-working ways of reaching each surface.

**Files:**
- Create: `tests/a11y.spec.ts`

- [ ] **Step 1: Create the spec file**

Write to `tests/a11y.spec.ts`:

```ts
import { expect, test } from '@grafana/plugin-e2e';
import * as semver from 'semver';

test.describe(
  'a11y',
  {
    tag: ['@a11y'],
  },
  () => {
    test('datasource config page has no a11y violations', async ({
      createDataSourceConfigPage,
      readProvisionedDataSource,
      page,
      scanForA11yViolations,
    }) => {
      const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
      await createDataSourceConfigPage({ type: ds.type });
      await expect(page.getByLabel('Path')).toBeVisible();

      const results = await scanForA11yViolations();
      expect(results).toHaveNoA11yViolations();
    });

    test('query editor (full page) has no a11y violations', async ({
      panelEditPage,
      readProvisionedDataSource,
      scanForA11yViolations,
    }) => {
      const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
      await panelEditPage.datasource.set(ds.name);
      await expect(
        panelEditPage.getQueryEditorRow('A').getByRole('textbox', { name: 'Query Text' })
      ).toBeVisible();

      const results = await scanForA11yViolations();
      expect(results).toHaveNoA11yViolations();
    });

    test('query editor row (scoped include) has no a11y violations', async ({
      panelEditPage,
      readProvisionedDataSource,
      scanForA11yViolations,
    }) => {
      const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
      await panelEditPage.datasource.set(ds.name);
      const queryRow = panelEditPage.getQueryEditorRow('A');
      await expect(queryRow.getByRole('textbox', { name: 'Query Text' })).toBeVisible();

      // exercises the plugin-relevant API shape from issue #2457:
      // scan only the plugin-owned widget, not Grafana chrome.
      const results = await scanForA11yViolations({ include: queryRow });
      expect(results).toHaveNoA11yViolations();
    });

    test('variable editor has no a11y violations', async ({
      variableEditPage,
      readProvisionedDataSource,
      page,
      scanForA11yViolations,
    }) => {
      const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
      await variableEditPage.datasource.set(ds.name);
      await expect(page.getByRole('textbox', { name: 'Query Text' })).toBeVisible();

      const results = await scanForA11yViolations();
      expect(results).toHaveNoA11yViolations();
    });

    test('annotation editor has no a11y violations', async ({
      annotationEditPage,
      readProvisionedDataSource,
      page,
      scanForA11yViolations,
    }) => {
      const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
      await annotationEditPage.datasource.set(ds.name);
      await expect(page.getByRole('textbox', { name: 'Query Text' })).toBeVisible();

      const results = await scanForA11yViolations();
      expect(results).toHaveNoA11yViolations();
    });

    test('alert rule editor has no a11y violations', async ({
      grafanaVersion,
      alertRuleEditPage,
      readProvisionedDataSource,
      page,
      scanForA11yViolations,
    }) => {
      test.skip(semver.lt(grafanaVersion, '9.5.0'));
      const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
      const queryA = await alertRuleEditPage.getQueryRow('A');
      await queryA.datasource.set(ds.name);
      await expect(page.getByRole('textbox', { name: 'Query Text' })).toBeVisible();

      const results = await scanForA11yViolations();
      expect(results).toHaveNoA11yViolations();
    });
  }
);
```

- [ ] **Step 2: Type-check the spec**

Run:
```bash
npx tsc --noEmit -p tsconfig.json 2>&1 | grep -i "tests/a11y" || echo "OK"
```

Expected: `OK` (no type errors specific to the a11y spec).

If the project's `tsconfig.json` excludes `tests/`, this command will print `OK` because no errors are emitted for the file. That is fine. The spec types are exercised when Playwright runs.

- [ ] **Step 3: Verify the spec is discovered by Playwright**

Run:
```bash
npx playwright test tests/a11y.spec.ts --list 2>&1 | head -20
```

Expected: 6 test titles listed under `tests/a11y.spec.ts` (datasource config, query editor full, query editor scoped, variable editor, annotation editor, alert rule editor).

- [ ] **Step 4: Commit**

```bash
git add tests/a11y.spec.ts
git commit -m "test: add a11y spec for plugin UI surfaces (strict initial settings)"
```

---

## Task 5: First run - capture data for analysis

Run with the reporter env var set so the aggregate JSON is written. Tests are expected to fail; do not react to failures yet.

**Files:**
- Generated (not committed): `axe-report.json`, `playwright-report/`, `test-results/`

- [ ] **Step 1: Add `axe-report.json` to gitignore**

Open `.gitignore` and append a new line at the end:
```
axe-report.json
```

Verify it is recognized:
```bash
git check-ignore -v axe-report.json && echo "ignored"
```

Expected: shows the matching gitignore line and prints `ignored`. (The file does not exist yet but the rule is in place.)

- [ ] **Step 2: Run the a11y suite with the reporter env var**

Run:
```bash
AXE_A11Y_REPORT_PATH=axe-report.json npx playwright test tests/a11y.spec.ts --reporter=list 2>&1 | tee axe-run-1.log
```

Expected: tests run; some or all are likely to fail with `Axe violations found` matcher messages. The console will print `Axe a11y report written to axe-report.json` at the end.

If Playwright hangs waiting for an auth dependency, the auth project (`projects[0]`) hasn't run yet. Run `npx playwright test --project=auth` once first, then re-run the command above.

- [ ] **Step 3: Confirm the aggregate report and per-test attachments exist**

Run:
```bash
test -f axe-report.json && jq '.summary' axe-report.json
ls playwright-report/data 2>/dev/null | grep -E '\.json$' | head -5
```

Expected: `summary` section prints a JSON object with `totalTests`, `testsWithViolations`, `failedTests`, `violationsCount`. The second command lists `axe-*` JSON attachments.

- [ ] **Step 4: Commit the gitignore change only (not the report)**

```bash
git add .gitignore
git commit -m "test: gitignore axe-report.json"
```

Do NOT commit `axe-report.json`, `axe-run-1.log`, `playwright-report/` or `test-results/`.

- [ ] **Step 5: Stop here for analysis**

Hand control to the operator/reviewing agent before continuing. Task 6 is interactive.

---

## Task 6: Analysis pass (interactive - Claude drives)

Goal: turn raw violations into per-surface decisions about `threshold` and `ignoredRules`.

**Files:**
- Read: `axe-report.json` (uncommitted)
- Working notes: `tests/utils/axe-a11y/analysis-notes.md` (throwaway, not committed)

- [ ] **Step 1: Load the report**

Run:
```bash
jq '.summary, (.violations | group_by(.testName) | map({testName: .[0].testName, count: length}))' axe-report.json
```

Expected: prints the summary plus per-test violation counts.

- [ ] **Step 2: Build the triage table**

For every entry in `.violations[]`, classify along three axes:

- **Ownership** - one of `plugin` (the plugin's own UI), `chrome` (Grafana shell - top nav, sidebar, breadcrumbs, page header), `ambiguous` (e.g., a `@grafana/ui` component instantiated by the plugin where responsibility is unclear).
- **Rule category** - the axe rule id (`color-contrast`, `label`, `aria-required-parent`, `heading-order`, `region`, etc.). Group by category to surface systemic issues.
- **Impact** - copied from `violation.impact` (`minor` / `moderate` / `serious` / `critical`).

Format each row of the table as:

```
| Surface (test name) | Rule id | Impact | Ownership | One-line summary | Proposed action |
```

Where Proposed action is one of:
- `ignore (chrome)` - add to `ignoredRules: [...]` for this surface, with comment naming the chrome element.
- `threshold N` - this surface gets `threshold: N` (current count of plugin-owned violations of this rule), with a follow-up issue link.
- `fix in PR` - trivial, fix it in this PR (rare; only if it is clearly in plugin code and a one-liner).
- `needs decision` - ambiguous; surface to the operator.

Save the table to `tests/utils/axe-a11y/analysis-notes.md` (throwaway file, do not commit).

- [ ] **Step 3: Surface ambiguous rows**

If any rows are tagged `needs decision`, list them in chat and ask the operator to disambiguate before continuing. Wait for the response.

- [ ] **Step 4: Per-surface recommendation**

Collapse the table into a per-surface decision block, e.g.:

```
datasource config page:
  threshold: 0
  ignoredRules: ['region']  // grafana page chrome doesn't expose a <main>

query editor (full page):
  threshold: 3   // tracked in <issue link>
  ignoredRules: ['color-contrast']  // grafana sidebar uses theme tokens we can't fix here
...
```

This becomes the diff applied in Task 7.

- [ ] **Step 5: Commit the analysis notes? No.**

`tests/utils/axe-a11y/analysis-notes.md` is throwaway. Leave it untracked.

---

## Task 7: Apply baselines to `tests/a11y.spec.ts`

**Files:**
- Modify: `tests/a11y.spec.ts`

- [ ] **Step 1: Update each test's matcher call**

For each test in `tests/a11y.spec.ts`, change the assertion from:

```ts
expect(results).toHaveNoA11yViolations();
```

to (example - actual values come from Task 6):

```ts
expect(results).toHaveNoA11yViolations({
  threshold: 3, // TODO: tighten - tracked in https://github.com/grafana/grafana-test-datasource/issues/<N>
  ignoredRules: [
    'color-contrast', // grafana sidebar - not plugin-owned
  ],
});
```

Rules:
- Every `threshold: N > 0` MUST have a comment with a follow-up issue link.
- Every entry in `ignoredRules` MUST have a comment naming the responsible chrome element or rationale.
- If a surface has zero violations (or only chrome-ignorable ones), `threshold` defaults to 0 - omit it or write `threshold: 0` for clarity.

- [ ] **Step 2: File follow-up issues for plugin-owned violations**

For each `threshold: N > 0` in the spec, file a GitHub issue in `grafana/grafana-test-datasource` titled `a11y: <rule-id> on <surface>` describing the violation and linking to the spec line. Use the issue URL in the inline comment from Step 1.

Run (per issue):
```bash
gh issue create --repo grafana/grafana-test-datasource --title "a11y: <rule-id> on <surface>" --body "..."
```

- [ ] **Step 3: Commit the baseline**

```bash
git add tests/a11y.spec.ts
git commit -m "test: apply per-surface a11y baselines from first-run analysis"
```

---

## Task 8: Second run - confirm green

**Files:**
- (none modified)

- [ ] **Step 1: Re-run the a11y suite**

Run:
```bash
AXE_A11Y_REPORT_PATH=axe-report.json npx playwright test tests/a11y.spec.ts --reporter=list
```

Expected: all tests pass. The console prints `Axe a11y report written to axe-report.json`.

- [ ] **Step 2: If any test still fails**

Re-enter Task 6 with the new `axe-report.json` for that test. The most common reason for a still-failing test is an under-counted baseline (e.g., a violation with multiple node instances counted as one). Adjust threshold up by the missing count, file/update the issue, return to Task 7.

---

## Task 9: Forced-failure check - validate matcher output quality

This is one of the explicit verification items from the spec: confirm the matcher's failure message is readable.

**Files:**
- Temporarily modify: `tests/a11y.spec.ts` (revert before commit)

- [ ] **Step 1: Pick the smallest test** (probably the scoped-include query editor row) and temporarily add `threshold: -1`:

```ts
expect(results).toHaveNoA11yViolations({ threshold: -1 });
```

Save the file - DO NOT commit yet.

- [ ] **Step 2: Run that single test**

Run:
```bash
npx playwright test tests/a11y.spec.ts -g "scoped include" --reporter=list 2>&1 | tee axe-forced-failure.log
```

Expected: test fails with a matcher message containing:
- A line `N Axe violations found (Threshold: -1)`
- Per-violation lines: `Rule:`, `ID:` (with helpUrl), `Impact:`, `Affected nodes:` showing the offending HTML.

- [ ] **Step 3: Capture an excerpt of the failure message** for the findings doc (Task 10). Save it inline somewhere you'll find it. Do not commit `axe-forced-failure.log`.

- [ ] **Step 4: Revert the `threshold: -1` change**

Edit `tests/a11y.spec.ts` to restore the previous matcher options for that test. Verify with:

```bash
git diff tests/a11y.spec.ts
```

Expected: no diff (file matches the committed Task 7 baseline).

- [ ] **Step 5: No commit needed** - the file is back to the baseline state.

---

## Task 10: Write the findings doc

**Files:**
- Create: `docs/a11y-reporter-trial.md`

- [ ] **Step 1: Draft the findings doc**

Write to `docs/a11y-reporter-trial.md`. Cover all five sections from the spec:

1. **Setup friction** - what we had to install (`@axe-core/playwright`), how we wired the reporter, anything not obvious without docs (e.g., the env-var-gated output, the lazy peer-dep import error).
2. **Fixture API observations** - did `include`/`exclude`/`options` behave as expected? Anything awkward when scanning inside Grafana chrome? Did the `axe-N` attachment naming work with our (now multi-)reporter setup?
3. **Matcher API observations** - is the violation message readable (use the excerpt captured in Task 9)? Does `threshold`/`ignoredRules` cover real-world needs we hit, or did we want anything else (e.g., `ignoredImpacts`, per-rule thresholds)?
4. **Reporter portability** - did the vendored reporter run cleanly outside grafana? Any grafana-specific assumptions surfaced (paths, env vars, output shape, expected attachment naming)? Is the output JSON shape useful for a single-plugin context, or shaped for grafana's many-suites scale?
5. **Recommendation** - based on the above:
   - Ready to drop `@alpha` from the fixture/matcher? If not, what needs to change first?
   - Ready to extract the reporter into plugin-e2e? Extract as-is, reshape (and how), or skip?

Each section should be 2-5 paragraphs of concrete observations with file/line references where relevant. No filler.

- [ ] **Step 2: Self-review the findings doc**

Re-read it with fresh eyes. Every claim should be backed by an observation from the actual run, not speculation. If any section is short on data, note that explicitly ("we did not exercise X in this trial").

- [ ] **Step 3: Commit**

```bash
git add docs/a11y-reporter-trial.md
git commit -m "docs: a11y reporter trial findings"
```

---

## Task 11: Strip throwaway scaffolding

The vendored reporter and the multi-reporter `playwright.config.ts` change were trial scaffolding. Remove them before the PR.

**Files:**
- Delete: `tests/utils/axe-a11y/` (whole directory)
- Modify: `playwright.config.ts` (revert reporter array)

- [ ] **Step 1: Delete the vendored reporter directory**

Run:
```bash
rm -rf tests/utils/axe-a11y
```

If `tests/utils/` is now empty, remove it too:
```bash
rmdir tests/utils 2>/dev/null || true
```

- [ ] **Step 2: Revert the reporter in `playwright.config.ts`**

Find the lines:
```ts
  reporter: [
    ['html'],
    ['./tests/utils/axe-a11y/reporter.ts'],
  ],
```

Replace with:
```ts
  reporter: 'html',
```

- [ ] **Step 3: Verify the config still loads and the a11y spec still passes**

Run:
```bash
npx playwright test tests/a11y.spec.ts --reporter=list
```

Expected: all a11y tests pass (we no longer write `axe-report.json`, but the per-test attachments still go into the HTML report - that is fine).

- [ ] **Step 4: Confirm the cleanup is complete**

Run:
```bash
git status
```

Expected: deleted `tests/utils/axe-a11y/reporter.ts` and `tests/utils/axe-a11y/types.ts`, modified `playwright.config.ts`. No stray `axe-report.json` or `analysis-notes.md` in the diff.

- [ ] **Step 5: Commit the cleanup**

```bash
git add tests/ playwright.config.ts
git commit -m "test: remove vendored AxeA11yReporter scaffolding (trial complete)"
```

---

## Task 12: Final verification + draft PR

- [ ] **Step 1: Full local verification**

Run the whole e2e suite (not just a11y) to ensure nothing else broke:

```bash
npm run e2e
```

Expected: all specs pass.

- [ ] **Step 2: Open the Playwright HTML report and visually confirm attachments**

Run:
```bash
npx playwright show-report
```

Expected: each test under the `a11y` describe block has at least one `axe-*` attachment in its details.

- [ ] **Step 3: Push the branch**

Run:
```bash
git push -u origin a11y-testing-trial
```

- [ ] **Step 4: Create a draft PR**

Per the user's global instructions, PRs are always created in draft mode. The PR description should link the design spec, the findings doc, and the related upstream issues.

Run:
```bash
gh pr create --draft --title "test: trial plugin-e2e a11y fixture + matcher + reporter" --body "$(cat <<'EOF'
## Summary

- Adds permanent a11y test coverage for grafana-test-datasource using plugin-e2e's @alpha `scanForA11yViolations` fixture and `toHaveNoA11yViolations` matcher.
- Trials grafana's `AxeA11yReporter` (since stripped) as a second consumer to inform whether to extract it into plugin-e2e (issue grafana/plugin-tools#2475).
- Findings written up in `docs/a11y-reporter-trial.md`.

Design spec: `docs/superpowers/specs/2026-05-05-a11y-testing-trial-design.md`.

## Test plan

- [x] `npm run e2e` is green
- [x] HTML report shows axe attachments per a11y test
- [x] Forced-failure check confirms matcher message is readable
- [x] Per-surface baselines link to follow-up issues

## Related

- grafana/plugin-tools#2600
- grafana/plugin-tools#2462
- grafana/plugin-tools#2475
- grafana/plugin-tools#2457
EOF
)"
```

Expected: PR URL printed.

- [ ] **Step 5: Surface the PR URL** to the operator and stop.
