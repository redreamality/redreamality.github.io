---
title: "What is loop engineering?"
description: "Loop engineering means you stop prompting a coding agent turn by turn and instead design a loop that starts it on a schedule or event and stops it when a machine-checkable condition holds. What a good loop contains and where it goes wrong."
date: 2026-10-16
tags: ["loop-engineering"]
lang: "en"
---

Loop engineering means you stop prompting a coding agent turn by turn and instead design a system that starts the agent on a schedule or a repository event and keeps it running until a machine-checkable condition is true.

The term caught on among developers around June 2026. Peter Steinberger put it as "you shouldn't be prompting coding agents anymore, you should be designing loops that prompt your agents," and Boris Cherny, who leads Claude Code at Anthropic, said his job had become writing loops. Addy Osmani then summarized the idea as a handful of building blocks that both Claude Code and Codex now have.

## What a good loop contains

The writing so far broadly agrees on these parts:

- **A trigger**: a schedule, or an event such as a new PR, an issue, or a failed CI run.
- **A stop condition a machine can check**, such as "all tests in test/auth pass and lint is clean."
- **A state file** that records progress and past attempts, so each run doesn't start from zero.
- **A separate verifier**, because the agent that wrote the code should not decide it is done.
- **Budgets and escalation**: token and attempt limits, and a hand-off to a person when progress stalls.

The `/goal` command in Claude Code and Codex is the in-session version: you state a done condition, and a separate small model checks it after each turn.

## My view

Loops free you from watching the agent, but they also repeat mistakes automatically. An August 2026 arXiv study mined 36,710 repositories and confirmed autonomous agent loops in 217 of the 256 its heuristics matched, yet almost none committed the loops' state files. The configuration is versioned; what happened at runtime is not.

Before you trust a loop, run it report-only, make the verifier and stop condition solid, and widen its permissions step by step. A loop with a weak verifier just produces errors faster.

## Related reading

- [Ralph Wiggum loop vs OpenSpec](/blog/ralph-wiggum-loop-vs-open-spec/)
- [Addy Osmani: Loop Engineering](https://addyo.substack.com/p/loop-engineering)
- [Loop Engineering: Building Blocks, Adoption, and Impact (arXiv:2608.21884)](https://arxiv.org/abs/2608.21884)
