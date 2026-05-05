# Plugin-e2e a11y testing trial - findings

**Date:** 2026-05-05
**Plugin under test:** grafana-test-datasource
**Plugin-e2e version:** `^3.7.0`
**Reporter under test:** grafana/grafana's `AxeA11yReporter` (vendored verbatim from [`e2e-playwright/utils/axe-a11y/`](https://github.com/grafana/grafana/blob/main/e2e-playwright/utils/axe-a11y/))
**Related:** [plugin-tools PR #2600](https://github.com/grafana/plugin-tools/pull/2600), [#2462](https://github.com/grafana/plugin-tools/pull/2462), [issue #2475](https://github.com/grafana/plugin-tools/issues/2475), [issue #2457](https://github.com/grafana/plugin-tools/issues/2457)
**Spec:** [`docs/superpowers/specs/2026-05-05-a11y-testing-trial-design.md`](superpowers/specs/2026-05-05-a11y-testing-trial-design.md)

This document captures observations from exercising the `@alpha` `scanForA11yViolations` fixture and `toHaveNoA11yViolations` matcher in a real plugin for the first time, plus running grafana's reporter as a second consumer to inform the extraction discussion in [#2475](https://github.com/grafana/plugin-tools/issues/2475).

---

## 1. Setup friction

**Peer dependency was not obvious.** Plugin-e2e declares `@axe-core/playwright` as a peer dep but does not surface this in the docs PR (#2600) or the README. The fixture imports it lazily and throws a helpful runtime error if missing, but a plugin author setting this up the first time has no signal until they run a test. The docs PR should call out the install step explicitly.

**Reporter wiring is straightforward, but the env-var-gated output is undocumented.** Wiring the vendored `AxeA11yReporter` into `playwright.config.ts` was a one-line change (add to the `reporter` array). The reporter only writes its aggregate JSON when `AXE_A11Y_REPORT_PATH` is set. There is no documentation of that env var (it lives in the source); a plugin author wouldn't know it exists.

**Playwright's `--reporter=` CLI flag silently overrides the config's `reporter` array.** During the trial we ran `npx playwright test --reporter=list ...`, expecting both the list reporter AND the configured `AxeA11yReporter` to fire. The CLI flag replaces the config reporter array entirely - the aggregate JSON was silently not written. Workaround: pass `--reporter=list --reporter=./tests/utils/axe-a11y/reporter.ts` (multi-reporter on the CLI) or omit `--reporter` and let the config provide it. This is a Playwright behavior, not a plugin-e2e issue, but worth flagging in any docs we write because the failure mode (no error, just no output) is hard to debug.

---

## 2. Fixture API observations

### Bug: `include` does not accept Playwright Locators

This is the headline finding of the trial.

The fixture forwards its `include` argument straight to [`AxeBuilder.include()`](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright):

```ts
// node_modules/@grafana/plugin-e2e/dist/fixtures/scanForA11yViolations.js
if (context?.include) {
  builder.include(context.include);
}
```

`AxeBuilder.include()` only accepts CSS selector strings (or arrays of strings). But the example in [issue #2457](https://github.com/grafana/plugin-tools/issues/2457) and the docs PR (#2600) suggests a Playwright Locator:

```ts
// from issue #2457 - looks valid, fails at runtime
const results = await scanForA11yViolations({
  include: panelEditPage.getQueryEditorRow('A'),
});
```

When run, this throws:

```
Error: Attempting to serialize unexpected value at position
"context.include[0]._frame._platform.boxedStackPrefixes": () => { ... }
  at AxeBuilder.runPartialRecursive
  at AxeBuilder.analyze
  at scanForA11yViolations.js:32:38
```

Since scoping a scan to a plugin-owned widget is THE plugin-relevant API shape (full-page scans are noisy - see §2.2), this bug effectively neuters the plugin-relevant use case until it's fixed.

**Workaround used in this trial:** pass a CSS selector string. We initially tried `'[data-testid="data-testid Query editor row"]'` (mirroring the convention from full-page violation HTML), but that matched zero elements. The plugin-e2e helper `getByGrafanaSelector` resolves bare selector strings (like `"Query editor row"`) to `[aria-label="..."]` (not `[data-testid="..."]`) when the string doesn't start with `"data-testid"` - see [`utils.js:10-16`](https://github.com/grafana/plugin-tools/blob/main/packages/plugin-e2e/src/models/utils.ts) in plugin-e2e. Switching to `'[aria-label="Query editor row"]'` worked. This is a non-trivial archaeology dig for a plugin author.

**Recommended fix:** the fixture should accept a Playwright Locator and either (a) extract the underlying selector via Playwright internals, or (b) get an `ElementHandle` and pass that to AxeBuilder, which accepts handles. Option (b) is probably the cleaner path - `Locator.elementHandle()` exists and AxeBuilder.include() will accept an ElementHandle.

### `tag` defaults are sensible but undocumented

The fixture defaults to `wcag2a, wcag2aa, wcag21a, wcag21aa` (and exports `DEFAULT_A11Y_TAGS` for callers who want to override). Sensible default. The docs PR (#2600) doesn't currently mention which tags run by default, which matters because plugin authors rely on this for their compliance baseline.

### `options` pass-through works

We didn't extensively exercise `options` in this trial because the defaults were sufficient, but the pass-through to AxeBuilder.options() is wired correctly - we relied on it indirectly via the `runOnly`/`tag` interaction in the matcher.

### Multiple scans per test work

The fixture increments an `inc` counter per call so multiple scans in one test produce `axe-1`, `axe-2`, ... attachments. Worked fine. We didn't write a test that uses this, but the reporter's per-test loop confirms the naming holds.

---

## 3. Matcher API observations

### Failure messages are good

Forced-failure check (`threshold: -1` on the query editor full-page test) produced this message:

```
Error: 3 Axe violations found (Threshold: -1)

Axe Violations:
- Rule:   Ensure all ARIA attributes have valid values
  ID:     aria-valid-attr-value (https://dequeuniversity.com/rules/axe/4.11/aria-valid-attr-value?application=playwright)
  Impact: critical
  Affected nodes:
  - <div role="separator" aria-valuemin="0" aria-valuemax="100" ... aria-label="Pane resize widget" tabindex="0" ...></div>
  - <div role="separator" aria-valuemin="0" aria-valuemax="100" ... aria-label="Pane resize widget" tabindex="0" ...></div>
- Rule:   Ensure buttons have discernible text
  ID:     button-name (https://dequeuniversity.com/rules/axe/4.11/button-name?application=playwright)
  Impact: critical
  Affected nodes:
  - <button class="css-gitbl3-button" type="button" data-testid="data-testid Options group Panel options toggle" ...>
  ...
```

Per-rule heading + description, rule ID with help URL, impact, all affected nodes with HTML. A plugin author can take this output straight to a fix without further investigation. No complaints.

### Edge case: clean test forced to fail produces a confusing message

Setting `threshold: -1` on a test that finds zero violations produces:

```
Error: 0 Axe violations found (Threshold: -1)

Axe Violations:

```

The "Axe Violations:" header is printed with an empty body. Minor cosmetic issue. The matcher could check `violations.length > 0` before printing the header, OR the threshold semantics could be tightened so `threshold < 0` is rejected outright (a negative threshold has no real-world use).

### `ignoredRules` is the right shape

We used `ignoredRules` extensively to filter out chrome violations (see §4). It works as documented. We didn't hit a case where we wanted per-impact filtering (`ignoredImpacts: ['minor', 'moderate']`) or per-rule thresholds (some rules tolerate N violations, others zero), but those would be useful in a more mature use case.

### `threshold` semantics are blunt

`threshold: 5` means "tests pass with up to 5 violations of any kind." For real-world a11y baselining, what plugin authors usually want is per-rule thresholds: "OK to have 3 known `color-contrast` violations on this page, but zero of anything else." The current API forces an all-or-nothing rule ignore, which loses signal.

Not blocking for `@alpha` removal, but worth thinking about before public stabilization.

---

## 4. Reporter portability

### What worked

- The `axe-N` attachment naming contract held - the reporter found and aggregated all per-test attachments without modification.
- The `AXE_A11Y_REPORT_PATH` env var gating worked as expected (no output when unset, file written when set).
- Aggregate JSON shape (`summary`, `violations`, `rawReports`) was directly usable.

### What didn't transfer cleanly

- **No grafana-specific assumptions surfaced** in the actual reporter code - it really is plugin-agnostic. That is a strong signal the contract is stable.
- The `playwright-report/data/` attachment files we expected (per the original plan's verification) didn't materialize - all attachments were in-memory `body` mode. The HTML report still embedded them, just not as separate files. Not a defect, but the plan's verification step assumed otherwise.

### Output shape - is it useful for a single-plugin context?

The reporter writes a `summary` (totals) + `violations` (flat list) + `rawReports` (per-test full Axe results). For a single-plugin trial, this is roughly the right shape, though:

- `rawReports` is keyed by full test path (`"chromium > a11y.spec.ts > a11y > query editor (full page) has no a11y violations"`). For grafana with many suites, that disambiguation is necessary. For a single plugin, the keys are noisy. Not breaking, just shapes a particular consumer.
- `violations` is denormalized (each entry has its full `testName` repeated). Convenient for downstream filtering, but inflates the JSON for large runs. For a single plugin our JSON was 50KB; for grafana it's likely much larger.

### Reporter as a deliverable

The plugin authors who would use this aren't going to run a custom JSON reporter for a 5-test suite. The HTML report's per-test attachments are sufficient for ad-hoc inspection. Where the reporter pays off is: (a) CI gates that need a structured artifact, (b) trend-tracking over time, (c) cross-plugin aggregation if a team owns many plugins. Those use cases exist but are not the median case.

---

## 5. Recommendation

### Drop `@alpha` from fixture/matcher?

**Not yet - block on the `include`-Locator fix.** The current fixture API doesn't actually support the use case the issue (#2457) was designed around. Until passing a Locator works, plugin authors who follow the docs example will hit a runtime error. That is not the experience to ship under a stable label.

Specific blockers before dropping `@alpha`:

1. **`include` must accept `Locator | ElementHandle | string | string[]`** (currently only `string` works in practice).
2. **Document the peer dep install** for `@axe-core/playwright` in the docs PR.
3. **Document the default tags** so authors understand the compliance baseline they're inheriting.
4. (Nice to have) **Tighten the `threshold < 0` edge case** in the matcher message.

`ignoredRules` and `threshold` semantics are reasonable; per-rule thresholds and per-impact ignores can wait for a v2.

### Extract reporter into plugin-e2e?

**Yes, but as opt-in - not as a default reporter.** The contract held outside grafana with zero edits; the only thing we added was the env-var-gated filename. Recommended path:

- Move `reporter.ts` and `types.ts` from `grafana/grafana/e2e-playwright/utils/axe-a11y/` into plugin-e2e under `src/reporters/` (or similar).
- Export it as a named import so plugin authors can opt in:
  ```ts
  // playwright.config.ts
  import { defineConfig } from '@playwright/test';
  reporter: [
    ['html'],
    ['@grafana/plugin-e2e/reporters/axe-a11y'],
  ],
  ```
- Document the env var (`AXE_A11Y_REPORT_PATH`) in the docs PR alongside the fixture.

The output shape can stay as-is for v1; refinements (per-plugin sharding, denormalizing tradeoffs) can wait for real consumer feedback.

### Other follow-ups

- **The full-page-scan-in-a-plugin pattern is mostly noise.** Every scan against a plugin's editor surface in this trial was dominated by Grafana chrome violations (panel header buttons, breadcrumbs, sidebar, react-select internals, pane resize widgets). Plugin authors who do full-page scans will spend their time `ignoredRules`-ing things they can't fix. The docs should lead with the scoped-include pattern, not the full-page pattern - which makes the `include`-Locator fix even more urgent.
- **The chrome violations themselves are upstream issues** for the grafana team to triage. Notably `label` (react-select hidden inputs) and `button-name` (panel options group toggles) appear in nearly every editor surface and are marked `critical`.

### Cross-version drift (added after CI)

The plugin's CI runs the e2e suite across a Grafana version matrix (8.5.27, 9.3.16, 11.0.11, 12.1.10, 13.0.1, dev-preview-react19, nightly). Even with this small a11y suite, two distinct version-drift problems showed up immediately:

1. **New chrome elements add new violations on newer Grafana.** The variable editor's "Static Options toggle" switch (added in Grafana 13+) lacks a label and triggers a `label` violation. Versions 8.5.27 - 12.1.10 don't have it. Tests that passed yesterday's matrix can fail on tomorrow's chrome.
2. **The string-only `include` is brittle across versions.** The selector `[aria-label="Query editor row"]` matches on stable Grafana but matches nothing on dev-preview-react19 and nightly - the row's aria-label was apparently dropped on those builds. We worked around it by OR-falling-back to a data-testid prefix selector, but this is exactly the kind of fragility a Locator-aware `include` API would eliminate (because the plugin-e2e PageObjectModel locator finds the element across all matrix versions; only our hand-written CSS struggles).

These two together strengthen the recommendation in §5: until the fixture accepts Locators, plugin authors who want stable a11y CI across a Grafana version matrix have to either babysit per-version selectors or expand `ignoredRules` reactively as Grafana's UI evolves. Neither is sustainable.

---

## Appendix: violations summary from the trial

5 a11y tests run. 4 of 5 had violations on the first run; all violations were chrome-owned (zero in plugin code). After applying chrome-rule `ignoredRules` baselines per surface, all 6 a11y tests pass.

| Surface | Initial violations | Rules ignored (chrome) |
|---|---|---|
| datasource config page | 0 | none |
| query editor (full page) | 3 rules / 23 nodes | `aria-valid-attr-value`, `button-name`, `label` |
| query editor row (scoped include) | n/a (Locator bug) | none after spec fix |
| variable editor | 1 rule / 1 node | `link-in-text-block` |
| annotation editor | 1 rule / 7 nodes | `label` |
| alert rule editor | 2 rules / 7 nodes | `aria-input-field-name`, `label` |
