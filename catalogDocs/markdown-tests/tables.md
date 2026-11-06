---
title: Tables
description: Tables with alignment, inline markup and line breaks in cells.
sidebar_position: 2
---

## Simple table

| Setting      | Description                            | Required |
| ------------ | -------------------------------------- | -------- |
| **Host URL** | The host name and port of your server. | Yes      |
| **Database** | The name of the database to query.     | Yes      |
| `timeout`    | Seconds to wait for a response.        | No       |

## Aligned columns

| Left | Center | Right |
| :--- | :----: | ----: |
| a    |   b    |     c |
| long | middle |    42 |

## Inline markup in cells

| Feature   | Example                                  |
| --------- | ---------------------------------------- |
| Link      | [Grafana](https://grafana.com)           |
| Code      | `SELECT 1`                               |
| Emphasis  | _italic_ and **bold**                    |
| Page link | [Text formatting](./text-formatting.md)  |

## Line breaks in cells

| Setting  | Values                                 |
| -------- | -------------------------------------- |
| **Mode** | `table` for rows<br>`series` for lines |

## Wide table

| Column one | Column two | Column three | Column four | Column five | Column six | Column seven | Column eight |
| ---------- | ---------- | ------------ | ----------- | ----------- | ---------- | ------------ | ------------ |
| value one  | value two  | value three  | value four  | value five  | value six  | value seven  | value eight  |
