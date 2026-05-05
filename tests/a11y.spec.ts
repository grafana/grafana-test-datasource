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
