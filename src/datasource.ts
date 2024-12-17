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
    this.baseUrl = instanceSettings.url!;
    this.variables = new VariableSupport(this);
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

  // // @ts-ignore
  // async query(options: DataQueryRequest<MyQuery>): Promise<DataQueryResponse> {
  //   const { range } = options;
  //   const from = range!.from.valueOf();
  //   const to = range!.to.valueOf();

  //   let data: DataFrame[] = [];
  //   console.log('query', options);
  //   if (options.targets.length && options.targets[0].queryText === 'variableQuery') {
  //     data = [
  //       createDataFrame({
  //         refId: 'A',
  //         fields: [
  //           { name: 'Time', values: [from, to], type: FieldType.time },
  //           { name: 'Test', values: [1, 2], type: FieldType.number },
  //           { name: 'Value', values: ['A', 'B'], type: FieldType.string },
  //         ],
  //       }),
  //     ];
  //   } else {
  //     data = options.targets.map((target) => {
  //       return createDataFrame({
  //         refId: target.refId,
  //         fields: [
  //           { name: 'Time', values: [from, to], type: FieldType.time },
  //           { name: 'Value', values: [target.constant, target.constant], type: FieldType.number },
  //         ],
  //       });
  //     });
  //   }

  //   return { data };
  // }

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
