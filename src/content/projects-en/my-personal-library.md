---
title: "My Personal Library"
description: "An operational Python pipeline for private Markdown archives, Qwen summaries, keyword search, and weekly digests, processing bookmarks in hourly batches."
pubDate: 2026-10-01
author: "redreamality"
lang: "en"
type: "tool"
status: "active"
---

[My Personal Library](https://github.com/redreamality/my-personal-library) is my personal reading-material pipeline. It started as a README holding osmos bookmarks and memos. It now uses Python managed with uv, has completed local processing checks and a real GitHub Actions run, and has written archive output to a private repository. A working pipeline does not mean that every bookmark has been processed or that every source can be extracted.

The inspiration is [Nekonull's article on LLMs and bookmark management](https://nekonull.me/posts/llm_x_bookmark/). The goal is to find the text and review its main points later, rather than save only a link. The public repository contains processing code and documentation, while complete outputs stay in a separate private repository. An allowlist of fields publishes successful entries' titles, sources, and summaries to this site's [reading notes](/garden/notes/), alongside handwritten notes. Raw full text, internal processing state, and credentials are not published.

## From Links to Searchable Material

The pipeline first attempts extraction through Jina Reader and falls back to direct extraction when the service is unavailable. The direct fallback has been verified against a real article. Successfully extracted text is saved in full as Markdown. Summarization uses the service configured for qwen-task, with the model fixed to `unsloth/Qwen3.8-27B-NVFP4`, to produce bullet points and a one-line summary. Summaries help with review; they do not replace the source text or fill gaps in material that could not be retrieved.

JSON state records each URL's outcome, and URL deduplication avoids duplicate archive entries. Repeated runs skip successfully processed entries, while failures retain their reasons for later retries. A SQLite full-text index provides keyword queries over saved material; a Chinese query has also been verified in practice. This is keyword search, not RAG, and it does not answer questions beyond the saved material.

GitHub Actions supports push, scheduled, and manual triggers. The schedule is configured to process one batch per hour, with up to 12 entries per batch, gradually working through pending bookmarks. Weekly digests follow deterministic rules: the same input records and time window produce the same digest, without asking a model to rearrange it each time. Workflow completion and individual entry outcomes are tracked separately. A green workflow does not mean that every entry succeeded.

## Failures and Preservation Limits

Pages that are blocked, require login, or present a CAPTCHA remain explicit failures when their text cannot be retrieved. Model calls can also fail: summarization failures have been recorded during real operation and must not be counted as completed entries. The pipeline does not infer missing text from titles or disguise failed extraction with generated summaries. Retrying offers another attempt, not a bypass of access restrictions or a guarantee of success.

A Markdown archive is a snapshot of the text at extraction time. It does not keep the original website online or reproduce every image, interaction, and later update. Wayback submission is opt-in and best effort; the actual submission attempt returned unavailable, so an independent backup cannot be claimed. Separating private output from public code also does not make processing entirely offline. Material sent to extraction and summarization services must still meet the owner's privacy requirements.
