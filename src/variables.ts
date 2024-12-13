import { DataSourceVariableSupport, VariableSupportType } from '@grafana/data';
import { DataSource } from 'datasource';
import { DEFAULT_QUERY, MyQuery } from 'types';

export class VariableSupport extends DataSourceVariableSupport<DataSource> {
  getType(): VariableSupportType {
    return VariableSupportType.Datasource;
  }

  getDefaultQuery(): Partial<MyQuery> {
    return DEFAULT_QUERY;
  }
}
