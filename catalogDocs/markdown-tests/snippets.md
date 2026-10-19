---
title: Snippets
description: Shared snippets that the parser swaps for current text, and the cases where the fallback shows instead.
sidebar_position: 10
---

## Known snippet

<!-- snippet:use-example-json -->

Stale fallback text that should not render.

<!-- /snippet:use-example-json -->

## Snippet with a value

<!-- snippet:add-data-source -->

Stale add data source text that should not render.

<!-- /snippet:add-data-source -->

## Unknown snippet name

<!-- snippet:not-a-real-snippet -->

Unknown snippet fallback is shown.

<!-- /snippet:not-a-real-snippet -->

## Marker inside a list

1. Markers inside a list are ignored, so this item shows as written.

   <!-- snippet:use-example-json -->

   Listed snippet fallback is shown.

   <!-- /snippet:use-example-json -->

## Unclosed marker

<!-- snippet:use-example-json -->

Unclosed snippet fallback is shown.
