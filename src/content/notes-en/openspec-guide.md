---
title: "What Is OpenSpec? Workflow, Files, and When to Use It"
description: "An independent OpenSpec guide to proposals, spec deltas, and archiving: when it fits your project, what files it creates, and where to find the official docs and CLI tutorial."
date: 2026-01-11
source: "https://github.com/Fission-AI/OpenSpec"
tags: ["ai-development", "openspec", "sdd", "ai-agents"]
lang: "en"
translatedFrom: "openspec-guide"
---

**OpenSpec is an open-source tool for maintaining requirements together with an AI coding assistant.** It stores the reason for a change, requirements, technical decisions, and implementation tasks as project files. Reviewers can compare code with the intended behavior without reconstructing requirements from chat history. Fission AI maintains the [official repository and documentation](https://github.com/Fission-AI/OpenSpec); this page is an independent guide, not official documentation.

Start with one distinction: `openspec/specs/` describes accepted system behavior, while `openspec/changes/<name>/` describes a proposed change to that behavior. After implementation and testing, you merge the change's spec deltas into the main specifications and archive the change.

For installation and a complete first example, continue to the [OpenSpec CLI tutorial](/blog/openspec-tutorial-cli-commands-agents-md-examples/). This page explains whether the tool fits, what files you will maintain, and what to review at each step. The baseline is the published npm release **OpenSpec 1.13.2**, checked on **2026-09-25 UTC**. The official main branch and other releases may differ.

## When OpenSpec Fits

OpenSpec is useful for ongoing changes to an existing application. Adding a login method, for example, requires decisions about eligible users, expired links, and whether password login stays available. Written requirements give implementation, tests, and review a shared reference.

It can also help when a feature spans several conversations or different coding assistants. Files preserve decisions, but someone still needs to verify their accuracy, have the current tool read them, and update them when requirements change.

You do not need to introduce it for every task:

- A disposable experiment that only checks whether an API works may not need maintained specifications.
- An unclear product problem may need investigation before implementation documents. Exploration can come first.
- An existing requirements, testing, and review process may already cover the change. A duplicate specification would add maintenance without useful information.
- Installing OpenSpec does not provide access control, test coverage, or compliance approval. Those require separate execution mechanisms.

Adopt it to address a specific information gap, not because you expect it to guarantee correct model output. Compared with [BMAD's roles and planning workflows](/garden/notes/bmad-method-guide/), this guide focuses on organizing requirements around one change. It does not rank tools without a common benchmark.

## The Lifecycle of One Change

Consider adding email magic-link login while keeping the existing password flow. Only the new, single-use-link path is in scope.

| Step | Action and artifact | Human review |
| --- | --- | --- |
| Clarify intent | Record motivation, scope, capabilities, and impact in `proposal.md` | Check that registration, billing, or a page redesign has not slipped into scope |
| Describe behavior | Write the delta in `specs/auth/spec.md` | Cover success, expiry, reuse, and the existing login flow |
| Design and split work | Record decisions in `design.md` and tasks in `tasks.md` | Check token storage, invalidation, and the testing strategy |
| Validate and implement | Check spec structure with the CLI; implement and run application tests | Structural validation is not a security or functionality test |
| Review and archive | Merge deltas into main specs and move the change to the archive | Confirm implementation is complete and specs describe accepted behavior |

This is a working sequence, not an irreversible state machine. If implementation reveals another constraint, return to the proposal, requirements, and tasks, then revisit affected tests. A checked task list is not a reason to leave a new decision only in chat.

## Where the Files Live

This is a completed change layout using the `spec-driven` schema. **A single `new change` command does not write all these document bodies.**

```text
openspec/
  config.yaml
  specs/
  changes/
    add-magic-link-login/
      .openspec.yaml
      proposal.md
      design.md
      tasks.md
      specs/
        auth/
          spec.md
```

`config.yaml` records the selected schema and can supply project context and writing rules. Do not put secrets there. `.openspec.yaml` holds change metadata. The Markdown documents contain reviewable decisions. Main specs are organized by capability; their folders do not have to mirror source-code directories.

Before archiving, the new requirements live at `openspec/changes/add-magic-link-login/specs/auth/spec.md`. After archiving, they are included in `openspec/specs/auth/spec.md`, and the original change moves to `openspec/changes/archive/YYYY-MM-DD-add-magic-link-login/`. The date comes from the actual archive operation.

Older tutorials may list `openspec/project.md` or `openspec/AGENTS.md`. Do not treat these as required generated files in 1.13.2. Integrations create skills or command files for the selected coding tool. A handwritten root `AGENTS.md` is an optional project policy, separate from the OpenSpec specifications.

## A Spec Delta Is More Than a Task Description

A proposal explains why something should change; a specification describes the required behavior afterward. Save this example inside the change's `specs/auth/spec.md`, rather than pasting it into a proposal and treating that as a spec:

```markdown
## ADDED Requirements

### Requirement: Reject a reused magic link
The system SHALL reject a magic link that has already been used.

#### Scenario: Link reuse
- **WHEN** a user submits a previously used magic link
- **THEN** the system rejects it without creating a session
```

Keep the parser's English structural markers and the normative term `SHALL`. Each Requirement needs a concrete Scenario; heading levels are part of the format. Prose can follow your project's language policy, but structural markers should not be translated arbitrarily.

Use `ADDED` for new requirements, `MODIFIED` for the complete revised text of an existing requirement, and `REMOVED` for deleted requirements. When modifying behavior, compare against the current main spec. “Update login” is not enough to show reviewers what must remain unchanged, even if the document structure passes validation.

This short example only demonstrates the format. A login feature also needs success, expiry, and password-login regression scenarios. The [complete first-change tutorial](/blog/openspec-tutorial-cli-commands-agents-md-examples/) includes the accompanying proposal, delta, design, and tasks.

## Terminal Commands and Assistant Commands

With Node.js 20.19.0 or later and pnpm installed, start in a new, empty practice directory:

```bash
pnpm dlx @fission-ai/openspec@1.13.2 --help
pnpm dlx @fission-ai/openspec@1.13.2 init . --tools none
pnpm dlx @fission-ai/openspec@1.13.2 new change add-magic-link-login
```

`--tools none` lets you learn the file workflow without installing a coding-assistant integration. These commands do not call a model or implement login. Fill in the files using the tutorial before running:

```bash
pnpm dlx @fission-ai/openspec@1.13.2 validate add-magic-link-login --strict --json --no-interactive
```

The other entry points are assistant actions such as `/opsx:propose`, `/opsx:apply`, and `/opsx:archive`. These are not shell commands. A 1.13.2 initialization with `--tools claude --profile core` generated propose, explore, apply, archive, sync, and update. Tool-specific spellings differ; use the initialization output. Additional actions depend on the selected profile, so do not assume every command in an older example is enabled by default.

CLI file operations and structural validation do not require model credentials. Generating documents, implementing, or reviewing through an assistant depends on that host and its model service. Assess their costs and data access separately.

## Keeping Specs Useful in an Existing Project

Start with a small change and clear acceptance criteria rather than immediately documenting the entire repository. Reviewers should be able to follow a proposal to its requirements and those requirements to their tests. Descriptions of historical behavior need confirmation against existing code and tests; model inference is not established fact.

Before archiving, inspect unfinished tasks, actual test results, and the scope of the main-spec update. Structural validation does not run your application tests or prove that a single-use token resists concurrent replay. If unsuitable code must be blocked from merging, configure real CI checks, branch protection, and approval rules. Writing “must pass” in Markdown is not enforcement.

When requirements change again, update the relevant documents and tests together. OpenSpec provides a structure for storing and checking the information; its accuracy still depends on how the team maintains it.

## Official Sources and Next Steps

- [OpenSpec 1.13.2 README](https://github.com/Fission-AI/OpenSpec/blob/v1.13.2/README.md): prerequisites, default workflow, and tool entry points.
- [1.13.2 CLI reference](https://github.com/Fission-AI/OpenSpec/blob/v1.13.2/docs/cli.md): command behavior; consult the same version's `--help` for exact options.
- [1.13.2 OPSX workflow](https://github.com/Fission-AI/OpenSpec/blob/v1.13.2/docs/opsx.md): artifact dependencies and iteration.
- [Our complete CLI tutorial](/blog/openspec-tutorial-cli-commands-agents-md-examples/): pinned installation, first change, validation, and archiving.
