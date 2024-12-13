import { expect, test } from '@grafana/plugin-e2e';
import * as semver from 'semver';

test('should evaluate to true if query is valid', async ({
  grafanaVersion,
  page,
  alertRuleEditPage,
  selectors,
  readProvisionedDataSource,
}) => {
  test.skip(semver.lt(grafanaVersion, '9.5.0'));
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  const queryA = alertRuleEditPage.getAlertRuleQueryRow('A');
  await queryA.datasource.set(ds.name);
  await page.getByRole('textbox', { name: 'Query Text' }).fill('some query');
  await expect(alertRuleEditPage.evaluate()).toBeOK();
});

test('should evaluate to false if query is invalid', async ({
  grafanaVersion,
  page,
  alertRuleEditPage,
  readProvisionedDataSource,
}) => {
  test.skip(semver.lt(grafanaVersion, '9.5.0'));
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  const queryA = alertRuleEditPage.getAlertRuleQueryRow('A');
  await queryA.datasource.set(ds.name);
  await page.getByRole('textbox', { name: 'Query Text' }).fill('error');
  await expect(alertRuleEditPage.evaluate()).not.toBeOK();
});
