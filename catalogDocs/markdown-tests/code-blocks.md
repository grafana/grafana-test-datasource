---
title: Code blocks
description: Fenced code in several languages, an unknown language and no language.
sidebar_position: 3
---

Use `inline code` for short snippets.

## SQL

```sql
SELECT id, name FROM users WHERE active = true ORDER BY created_at DESC
```

## JSON

```json
{
  "type": "clock",
  "options": { "mode": "countdown", "refresh": 1000 }
}
```

## YAML

```yaml
apiVersion: 1
datasources:
  - name: Test
    type: sunker-docstest-datasource
```

## Bash

```bash
npm run docs:serve # start the preview
```

## TypeScript

```typescript
export function add(a: number, b: number): number {
  return a + b;
}
```

## Short language name

```js
const message = 'highlighted through the js alias';
```

## Unknown language

```hcl
resource "grafana_dashboard" "clock" {
  config_json = file("dashboard.json")
}
```

## No language

```
Plain text with no language and no highlighting.
```

## Plain text language

```text
Output that should never be highlighted.
```
