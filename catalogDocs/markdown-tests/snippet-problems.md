---
title: Snippet problems
description: Misplaced and unclosed snippet markers, which switch off every snippet swap on the page.
sidebar_position: 11
---

A marker problem anywhere on a page keeps the fallback text for every snippet on that page, so these cases live apart from the working snippets.

## Known snippet beside a problem

<!-- snippet:use-example-json -->

Stale fallback text that stays because the page has marker problems.

<!-- /snippet:use-example-json -->

## Marker inside a list

1. Markers inside a list are ignored, so this item shows as written.

   <!-- snippet:use-example-json -->

   Listed snippet fallback is shown.

   <!-- /snippet:use-example-json -->

## Unclosed marker

<!-- snippet:use-example-json -->

Unclosed snippet fallback is shown.
