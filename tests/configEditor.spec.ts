import { test, expect } from '@grafana/plugin-e2e';

test('should render config editor', async ({ createDataSourceConfigPage, readProvisionedDataSource, page }) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  await createDataSourceConfigPage({ type: ds.type });
  await expect(page.getByLabel('Path')).toBeVisible();
});

test('should be successful if config is valid', async ({
  createDataSourceConfigPage,
  readProvisionedDataSource,
  page,
}) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  const datasourceConfigPage = await createDataSourceConfigPage({ type: ds.type });
  await page.getByLabel('Path').fill('example.com');
  await expect(datasourceConfigPage.saveAndTest()).toBeOK();
  await expect(datasourceConfigPage).toHaveAlert('success');
});

test('should return error if API key is missing', async ({
  createDataSourceConfigPage,
  readProvisionedDataSource,
  page,
}) => {
  console.log('hello');
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  const datasourceConfigPage = await createDataSourceConfigPage({ type: ds.type });
  await page.getByLabel('Path').fill('');
  await expect(datasourceConfigPage.saveAndTest()).not.toBeOK();
  await expect(datasourceConfigPage).toHaveAlert('error', { hasText: 'API key is missing' });
});
