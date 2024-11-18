import { expect, test } from '@grafana/plugin-e2e';

test('should render variable editor', async ({ variableEditPage, page, readProvisionedDataSource }) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  await variableEditPage.datasource.set(ds.name);
  await expect(page.getByRole('textbox', { name: 'Query Text' })).toBeVisible();
});
