import * as semver from 'semver';
import { expect, test } from '@grafana/plugin-e2e';

test('should render annotations editor', async ({ annotationEditPage, page, readProvisionedDataSource }) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  await annotationEditPage.datasource.set(ds.name);
  await expect(page.getByRole('textbox', { name: 'Query Text' })).toBeVisible();
});
