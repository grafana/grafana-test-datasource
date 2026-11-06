---
title: Collapsible sections
description: Closed, open and nested details blocks with markdown inside.
sidebar_position: 8
---

## Closed section

<details>
<summary>Show the closed example</summary>

Content with **bold**, `code` and a [link](./links.md).

</details>

## Open section

<details open>
<summary>Open by default</summary>

This content is visible when the page loads.

</details>

## Section with a code block

<details>
<summary>Show the code</summary>

```json
{ "collapsed": true }
```

</details>

## Nested sections

<details>
<summary>Outer section</summary>

Outer content.

<details>
<summary>Inner section</summary>

Inner content.

</details>

</details>

## Section with a heading

<details>
<summary>Show the section with a heading</summary>

### Heading inside a collapsed section

Content under a heading that the table of contents does not list.

</details>

## Section with a list

<details>
<summary>Show the list</summary>

- First item
- Second item

</details>
