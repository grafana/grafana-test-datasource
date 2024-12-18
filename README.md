# Grafana data source plugin template

This datasource plugin is used for testing purposes. Among other things, it's used internally in the [@grafana/plugin-e2e](https://github.com/grafana/plugin-tools/tree/main/packages/plugin-e2e) source code to e2e test data source plugin capabilities.

## Distributing changes in the plugin

If you need to add new functionality or change existing functionality and use it in the [internal test suite](https://github.com/grafana/plugin-tools/tree/main/packages/plugin-e2e/tests) of plugin-e2e, follow this procedure:

1. Make the necessary changes in the plugin source code.

2. Bump package version: `npm version major|minor|patch -m "Upgrade to %s for reasons"`

3. Create tag: `git tag vx.x.x`

4. Push tag: `git push origin vx.x.x`

This will start the [release](./.github/workflows/release.yml) workflow which will create a new Github release.

5. Publish the release. (https://github.com/grafana/grafana-test-datasource/releases)

6. Point to the new release of the plugin in the plugin-e2e [docker-compose file](https://github.com/grafana/plugin-tools/blob/2086d38bb26fa0b8b300073a6e355437ee1b6399/packages/plugin-e2e/docker-compose.yaml#L5).
