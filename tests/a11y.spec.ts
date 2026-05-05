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
      // every violation in this scan is in grafana chrome (panel header toggles,
      // breadcrumbs, sidebar, react-select internals, pane resize widget) -
      // not the plugin's UI. full-page scans are noisy for plugins; the scoped
      // test below is the meaningful one. tracked in the trial findings doc.
      expect(results).toHaveNoA11yViolations({
        ignoredRules: [
          'aria-valid-attr-value', // grafana panel pane resize widget
          'button-name', // grafana panel options toggles, breadcrumbs, sidebar
          'label', // grafana Panel Title input, react-select hidden inputs
        ],
      });
    });

    test('query editor row (scoped include) has no a11y violations', async ({
      panelEditPage,
      readProvisionedDataSource,
      scanForA11yViolations,
    }) => {
      const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
      await panelEditPage.datasource.set(ds.name);
      await expect(
        panelEditPage.getQueryEditorRow('A').getByRole('textbox', { name: 'Query Text' })
      ).toBeVisible();

      // exercises the plugin-relevant API shape from issue #2457:
      // scan only the plugin-owned widget, not Grafana chrome.
      // NOTE: the fixture's `include` is forwarded to AxeBuilder.include(),
      // which only accepts CSS selector strings - NOT Playwright Locators.
      // passing a Locator (as suggested in #2457) fails with a serialization
      // error. tracked in the trial findings doc.
      const results = await scanForA11yViolations({
        // string-only include is fragile across grafana versions: the row's
        // aria-label is gone on react19/nightly but still present on stable.
        // we OR-fallback to a data-testid prefix to cover both. exact reason
        // a Locator-aware include API would be better; tracked in the findings.
        include:
          '[aria-label="Query editor row"], [data-testid^="data-testid Query editor row"]',
      });
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
      expect(results).toHaveNoA11yViolations({
        ignoredRules: [
          'link-in-text-block', // grafana docs link in variable editor description
          'label', // grafana 13+ "Static Options toggle" switch lacks a label
        ],
      });
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
      expect(results).toHaveNoA11yViolations({
        ignoredRules: [
          'label', // grafana react-select hidden inputs
        ],
      });
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
      expect(results).toHaveNoA11yViolations({
        ignoredRules: [
          'aria-input-field-name', // grafana alert rule editor listbox
          'label', // grafana react-select hidden inputs
        ],
      });
    });
  }
);
