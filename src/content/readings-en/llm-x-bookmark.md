---
title: 'LLM x Bookmark: turn bookmarks into (bi)lingual notes'
description: 'A practical workflow that scrapes bookmarked pages, summarizes them, and turns them into Markdown notes via CI.'
pubDate: 2025-12-17T00:00:00.000Z
url: 'https://nekonull.me/posts/llm_x_bookmark/'
tags: ['llm', 'bookmark', 'automation', 'workflow']
lang: 'en'
---

## What this is about

This post demonstrates a simple but powerful idea: treat your bookmarks as a content pipeline.

You maintain **one “bookmarks list” Markdown file** as the source of truth. Then a CI workflow:

1. Fetches the linked web page (crawl)
2. Extracts the readable content
3. Uses an LLM to generate a *structured note* (summary, key takeaways, etc.)
4. Writes the note back to the repo as a Markdown file

## Why it’s useful

- Your bookmarks stop being a “graveyard” and become searchable knowledge.
- Notes are version-controlled (diffable + reviewable).
- You can publish them directly on your site.

## Key takeaways

- Keep the input simple: a single list of URLs + a stable slug.
- Put all generated content under a dedicated folder so the site can render it as a section.
- Make the workflow idempotent: skip already-generated entries unless forced.
- Generate both English and Chinese pages so the same reading note can be accessed in either language.

## Links

- Source: <https://nekonull.me/posts/llm_x_bookmark/>
