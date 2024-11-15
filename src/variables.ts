import { DataSourceVariableSupport, VariableSupportType } from '@grafana/data';
import { DataSource } from 'datasource';

export class VariableSupport extends DataSourceVariableSupport<DataSource> {
  getType(): VariableSupportType {
    return VariableSupportType.Datasource;
  }
}
