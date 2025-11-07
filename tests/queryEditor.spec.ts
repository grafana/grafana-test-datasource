import { test, expect } from '@grafana/plugin-e2e';

test('should render query editor', async ({ grafanaVersion, panelEditPage, readProvisionedDataSource }) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  await panelEditPage.datasource.set(ds.name);
  console.log(grafanaVersion);
  await expect(panelEditPage.getQueryEditorRow('A').getByRole('textbox', { name: 'Query Text' })).toBeVisible();
});
