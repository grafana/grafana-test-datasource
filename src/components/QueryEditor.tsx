import React, { ChangeEvent, useEffect } from 'react';
import * as ui from '@grafana/ui';
import { QueryEditorProps, SelectableValue, toOption } from '@grafana/data';
import { DataSource } from '../datasource';
import { MyDataSourceOptions, MyQuery } from '../types';
import { InlineSwitch, Select } from '@grafana/ui';
import { config } from '@grafana/runtime';

type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

export function QueryEditor({ query, onChange, onRunQuery, datasource }: Props) {
  const { Input, InlineField } = ui;
  const Wrapper = ui.Stack ?? React.Fragment;
  const onQueryTextChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...query, queryText: event.target.value });
  };

  const onConstantChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...query, constant: parseFloat(event.target.value) });
    // executes the query
    onRunQuery();
  };

  const onProjectChange = (option: SelectableValue<string>) => {
    onChange({ ...query, project: option.value! });
  };

  const [projects, setProjects] = React.useState([]);

  useEffect(() => {
    datasource.getProjects().then((projects) => {
      setProjects(projects);
    });
  }, [datasource]);

  const { queryText, constant, project } = query;

  // @ts-ignore
  const tlsEnabled = config.featureToggles.tlsEnabled;

  return (
    <Wrapper>
      <InlineField label="Constant">
        <Input
          id="query-editor-constant"
          onChange={onConstantChange}
          value={constant}
          width={8}
          type="number"
          step="0.1"
        />
      </InlineField>
      <InlineField label="Projects">
        <Select
          options={projects.map(toOption)}
          inputId="query-editor-project"
          onChange={onProjectChange}
          value={project}
          width={8}
        />
      </InlineField>
      <InlineField label="Query Text" labelWidth={16} tooltip="Not used yet">
        <Input
          id="query-editor-query-text"
          onChange={onQueryTextChange}
          value={queryText || ''}
          required
          placeholder="Enter a query"
        />
      </InlineField>
      {tlsEnabled && (
        <InlineField label="TLS enabled">
          <InlineSwitch
            // the InlineSwitch label needs to match the label of the InlineField
            label="TLS Enabled"
            value={query.tls}
            onChange={(e) => onChange({ ...query, tls: e.currentTarget.checked })}
          />
        </InlineField>
      )}
    </Wrapper>
  );
}
