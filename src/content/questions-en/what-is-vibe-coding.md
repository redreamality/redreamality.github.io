---
title: "What is vibe coding?"
description: "Vibe coding means describing what you want in plain language, letting AI write the code, and judging it only by whether it runs. Where the term came from and when it makes sense."
date: 2026-10-16
tags: ["vibe-coding"]
lang: "en"
---

Vibe coding is a way of programming where you tell an AI what you want in plain language, accept the code it writes, and judge the result by whether the program works, not by reading the code.

Andrej Karpathy coined the term in a post on X in February 2025. He described fully giving in to the vibes: accept every change, paste error messages back without comment, and "forget that the code even exists." He was talking about throwaway weekend projects. The term spread fast enough that Collins Dictionary named it a Word of the Year for 2025, and in casual use it now often means any coding with AI.

## How it differs from AI-assisted coding

The difference is whether you still review the code. If you let Copilot complete a line or ask Cursor to change a function and then read the diff, that is AI-assisted coding. Vibe coding drops the review. You check the outcome, not the implementation.

That makes the trade-off easy to state. For a prototype, a small internal tool, or a demo that lives for a few days, vibe coding saves real time. For code that must be maintained, handles user data, or gets handed to someone else, nobody knows what is inside it, and that cost arrives later with interest.

In my view the habit itself is fine. The trouble starts when prototype habits reach production. Spec-driven development grew partly as a way to keep AI doing the typing while you still know what it built.

## Related reading

- [The 2026 AI coding tools war: vibe coding splits developer workflows](/blog/ai-coding-tools-war-vibe-coding-mainstream/)
- [What is spec-driven development?](/garden/questions/what-is-spec-driven-development/)
- Karpathy's original post: [x.com/karpathy/status/1886192184808149383](https://x.com/karpathy/status/1886192184808149383)
