import { test, expect } from '@grafana/plugin-e2e';

test('Should render query editor', async ({ panelEditPage, readProvisionedDataSource }) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  await panelEditPage.datasource.set(ds.name);
  await panelEditPage.setVisualization('Table');
  await expect(await panelEditPage.getQueryEditorRow('A').getByRole('textbox', { name: 'Query Text' })).toBeVisible();
});
