---
title: "What is spec-driven development (spec coding)?"
description: "Spec-driven development means writing a reviewable spec first and having an AI agent build from it, so the spec, not the chat history, is the source of truth. How it differs from vibe coding and when it pays off."
date: 2026-10-16
tags: ["spec-driven-development"]
lang: "en"
---

Spec-driven development (SDD, often called spec coding) means you first write down what to build and what counts as done, get that spec reviewed, and then have an AI agent write the code and tests against it.

It answers the main weakness of vibe coding. When you steer an agent through chat, requirements scatter across dozens of turns, a new session forgets them, and nobody can say which constraints the code actually meets. SDD pins those decisions to files in the repo: requirements, design, and task lists in Markdown that you can diff, review, and load into the next session.

## How it usually works

The common flow has three steps. Write the spec, covering behavior, edge cases, and acceptance criteria. Let the agent turn it into a design and a task list. Then implement one task at a time and check each against the spec. When requirements change, change the spec first and let the code follow.

Several tools appeared from 2025 onward. GitHub's open-source Spec Kit packages the flow as slash commands, AWS Kiro builds specs into its IDE workflow, and OpenSpec tracks incremental changes in existing codebases as change proposals. The details differ; all of them make the spec the single source of truth.

## When it is worth it

SDD pays off when a feature spans many files, several people or agents work on it, or requirements keep moving. For a copy change or an obvious bug fix, writing a spec is pure overhead.

In my view the value is not the document but the acceptance check. Conditions written clearly in a spec can become tests, so when the agent says it is done you have something to check it against. A vague spec turns into one more README nobody reads.

## Related reading

- [OpenSpec tutorial: CLI, commands, AGENTS.md, and examples](/blog/openspec-tutorial-cli-commands-agents-md-examples/)
- [SpecHarness: let the spec, not the agent, sign off](/blog/specharness-spec-holds-the-pen/)
- [What is vibe coding?](/garden/questions/what-is-vibe-coding/)
- [GitHub Spec Kit](https://github.com/github/spec-kit)
