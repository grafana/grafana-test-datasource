import { QueryEditor } from 'components/QueryEditor';
import { DEFAULT_QUERY } from './types';

export const annotationSupport = {
  getDefaultQuery() {
    return DEFAULT_QUERY;
  },
  prepareQuery(q: any) {
    return q.target;
  },
  QueryEditor: QueryEditor,
};
