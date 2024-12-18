// import { VariableSupportBase, VariableSupportType } from '@grafana/data';
// import { DEFAULT_QUERY, MyQuery } from './types';
// import { DataSource } from './datasource';

// export class VariableSupport extends VariableSupportBase<DataSource> {
//   constructor(private _: DataSource) {
//     super();
//   }

//   // editor = QueryEditor;
//   getType(): VariableSupportType {
//     return VariableSupportType.Datasource;
//   }

//   getDefaultQuery(): Partial<MyQuery> {
//     return DEFAULT_QUERY;
//   }
// }

// uncomment the code above to test DataSourceVariableSupport

import { CustomVariableSupport, DataQueryRequest, VariableSupportType } from '@grafana/data';
import { QueryEditor } from './components/QueryEditor';
import { DataSource } from './datasource';
import { DEFAULT_QUERY, MyQuery } from 'types';

export class VariableSupport extends CustomVariableSupport<DataSource> {
  constructor(private datasource: DataSource) {
    super();
    this.query = this.query.bind(this);
  }

  editor = QueryEditor;

  query(request: DataQueryRequest<any>) {
    request.targets = request.targets.map((target) => {
      return {
        refId: target.refId ?? 'variableQuery',
        ...target,
      };
    });

    return this.datasource.query(request);
  }

  getType(): VariableSupportType {
    return VariableSupportType.Custom;
  }

  getDefaultQuery(): Partial<MyQuery> {
    return DEFAULT_QUERY;
  }
}
