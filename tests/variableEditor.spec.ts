import { expect, test } from '@grafana/plugin-e2e';

test('should render variable editor', async ({ variableEditPage, page, readProvisionedDataSource }) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  await variableEditPage.datasource.set(ds.name);
  await expect(page.getByRole('textbox', { name: 'Query Text' })).toBeVisible();
});

test.skip('create new, successful variable query', async ({ variableEditPage, readProvisionedDataSource, page }) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  await variableEditPage.datasource.set(ds.name);
  await page.getByRole('textbox', { name: 'Query Text' }).fill('annotationQuery');
  const queryDataRequest = variableEditPage.waitForQueryDataRequest();
  await variableEditPage.runQuery();
  await queryDataRequest;
  await expect(variableEditPage).toDisplayPreviews(['A', 'B']);
});
