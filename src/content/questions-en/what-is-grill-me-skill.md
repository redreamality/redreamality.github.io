---
title: "What is the grill-me skill?"
description: "grill-me is an open-source agent skill by Matt Pocock: type /grill-me with a loose idea and the agent questions you in rounds until every decision in the plan is settled. How it works and how it differs from grill-with-docs."
date: 2026-10-16
tags: ["agent-skills"]
lang: "en"
---

grill-me is an agent skill that Matt Pocock publishes in his open-source mattpocock/skills repository: you type `/grill-me` with a loose idea, and the agent interviews you relentlessly until every branch of the plan's decision tree is resolved.

Pocock's premise is that misalignment is the most common failure in software work. An agent that builds the wrong thing quickly is still building the wrong thing, so the skill puts a grilling session before any code gets written.

## How it works

- **You start it.** The agent never invokes it on its own. The docs recommend a fresh conversation, not one on top of a plan an agent already wrote.
- **It asks in rounds.** Each round covers every question whose prerequisites you have already settled, so it never asks about something that depends on an answer you haven't given.
- **It writes nothing.** The skill is stateless, needs no repo, and works for business decisions or writing as well as code. The result is a clearer plan in your head.

In Claude Code, install the whole set with `claude plugin install mattpocock-skills@claude-plugins-official`. For Codex and other agents, `npx skills add https://github.com/mattpocock/skills --skill grill-me` adds just this skill. The repository is MIT-licensed and is not published by Anthropic.

## grill-me vs grill-with-docs

Both run on the same underlying `grilling` skill. grill-with-docs is stateful: it reads your codebase and records the terms and decisions it settles in `GLOSSARY.md` and architecture decision records. Use grill-me for an idea with no repo yet, and grill-with-docs for a change to a real codebase.

What I like about it is the role reversal. Usually you question the agent; here the agent questions you, and many requirement gaps turn out to be branches you never thought about.

## Related reading

- [agentskills.io starter guide](/blog/agentskills-io-starter-guide/)
- [What is spec-driven development?](/garden/questions/what-is-spec-driven-development/)
- [mattpocock/skills on GitHub](https://github.com/mattpocock/skills)
- [grill-me docs](https://github.com/mattpocock/skills/blob/main/docs/productivity/grill-me.md)
