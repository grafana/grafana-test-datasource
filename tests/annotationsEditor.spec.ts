import * as semver from 'semver';
import { expect, test } from '@grafana/plugin-e2e';

test('should render annotations editor', async ({ annotationEditPage, page, readProvisionedDataSource }) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  await annotationEditPage.datasource.set(ds.name);
  await expect(page.getByRole('textbox', { name: 'Query Text' })).toBeVisible();
});

test('goto existing annotation', async ({ grafanaVersion, gotoAnnotationEditPage }) => {
  const annotationEditPage = await gotoAnnotationEditPage({ id: '1', dashboard: { uid: 'de6s050il06wwb' } });
  await expect(annotationEditPage.runQuery()).toBeOK();
  if (semver.gte(grafanaVersion, '11.0.0')) {
    await expect(annotationEditPage).toHaveAlert('success');
  }
});

test('create new, successful annotation query', async ({
  grafanaVersion,
  annotationEditPage,
  readProvisionedDataSource,
  page,
}) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  await annotationEditPage.datasource.set(ds.name);
  await page.getByRole('textbox', { name: 'Query Text' }).fill('annotationQuery');
  await expect(annotationEditPage.runQuery()).toBeOK();
  if (semver.gte(grafanaVersion, '11.0.0')) {
    await expect(annotationEditPage).toHaveAlert('success');
  }
});

test('create new, unsuccessful annotation query', async ({
  grafanaVersion,
  annotationEditPage,
  readProvisionedDataSource,
  page,
}) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  await annotationEditPage.datasource.set(ds.name);
  await page.getByRole('textbox', { name: 'Query Text' }).fill('error');
  await expect(annotationEditPage.runQuery()).not.toBeOK();
  if (semver.gte(grafanaVersion, '11.0.0')) {
    await expect(annotationEditPage).toHaveAlert('error');
  }
});
