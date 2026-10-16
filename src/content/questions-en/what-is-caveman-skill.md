---
title: "What is the Caveman skill, and does it really save 65% of tokens?"
description: "Caveman is a skill that makes a coding agent talk like a caveman to cut output tokens. It advertises about 65% savings; independent tests on real agent tasks found about 8.5%, and one found it used more."
date: 2026-10-16
tags: ["agent-skills"]
lang: "en"
---

Caveman is a skill for coding agents that makes the agent drop articles, pronouns, and filler and answer in short bursts, to cut output tokens. Code, commands, file paths, and exact error strings pass through unchanged.

It lives at JuliusBrussee/caveman on GitHub under the slogan "why use many token when few token do trick." In Claude Code, install it with `claude plugin marketplace add JuliusBrussee/caveman && claude plugin install caveman@caveman`, turn it on with `/caveman`, and say `stop caveman` to turn it off. It also has stronger compression levels and a local proxy that shrinks the logs, JSON, and test output the agent reads.

## Advertised numbers vs independent tests

The project advertises about 65% fewer tokens. That figure comes mostly from chat-style answers, which are mostly prose and compress well.

Agent work is different. In July 2026 JetBrains ran 82 paired SkillsBench tasks in Claude Code with Caveman forced on for every reply. Output tokens fell about 8.5%, with no measurable drop in quality. Most tokens in an agent session are code, diffs, and tool calls, which Caveman deliberately leaves alone, so only the narration between tool calls shrinks. Glia's test of 20 terminal tasks went the other way: median output tokens rose 17.7%, and one unusually long task accounted for nearly all of the savings.

The skill also costs input tokens. Its docs say `SKILL.md` is about 1,650 tokens and rides along on every call, so on a one-line question it can cost more than it saves.

## Should you install it

If you mostly chat with an assistant and find the answers wordy, Caveman makes them shorter. If you want it to cut agent bills, expect about 10% at best. Bigger savings usually come from what the agent reads, not from how much it says.

## Related reading

- [How Claude Code usage limits work](/blog/claude-code-usage-limits-cost-2026/)
- [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman)
- [JetBrains: Speaking to AI Agents like Cavemen Saves 65% of Tokens. We Test.](https://blog.jetbrains.com/ai/2026/07/speak-to-ai-agents-like-cavemen-tosave-tokens/)
- [Glia: The Caveman skill is built to cut output tokens. It added 17.7%.](https://gliai.com/research/caveman-skill-benchmark)
