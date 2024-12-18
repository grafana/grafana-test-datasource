import { DataSourceWithBackend, getTemplateSrv } from '@grafana/runtime';
import { CoreApp, DataQueryRequest, DataQueryResponse, DataSourceInstanceSettings, ScopedVars } from '@grafana/data';

import { MyQuery, MyDataSourceOptions, DEFAULT_QUERY } from './types';
import { VariableSupport } from 'variables';
import { annotationSupport } from 'annotations';
import { Observable } from 'rxjs';

export class DataSource extends DataSourceWithBackend<MyQuery, MyDataSourceOptions> {
  baseUrl: string;

  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);
    this.variables = new VariableSupport(this);
    this.baseUrl = instanceSettings.url!;
    this.annotations = annotationSupport;
  }

  query(request: DataQueryRequest<MyQuery>): Observable<DataQueryResponse> {
    request.targets = request.targets.map((target) => {
      return {
        ...target,
        queryText: getTemplateSrv().replace(target.queryText, request.scopedVars),
      };
    });
    return super.query(request);
  }

  getDefaultQuery(_: CoreApp): Partial<MyQuery> {
    return DEFAULT_QUERY;
  }

  applyTemplateVariables(query: MyQuery, scopedVars: ScopedVars) {
    return {
      ...query,
      queryText: getTemplateSrv().replace(query.queryText, scopedVars),
    };
  }

  filterQuery(query: MyQuery): boolean {
    // if no query has been provided, prevent the query from being executed
    return !!query.queryText;
  }

  getProjects() {
    return this.getResource('projects').then((response) => response.projects);
  }
}
