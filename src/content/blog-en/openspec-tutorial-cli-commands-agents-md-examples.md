---
title: 'OpenSpec Tutorial: Install the CLI and Run Your First Change'
pubDate: 2026-06-16T08:15:00.000Z
description: 'Install and initialize OpenSpec, create your first change, validate specs, and archive completed work. Includes CLI commands and AGENTS.md examples.'
author: 'Remy'
tags: ['openspec', 'sdd', 'ai-coding', 'agents.md', 'cli']
---

## OpenSpec Quick Start

This tutorial covers the OpenSpec CLI workflow: initialize a repository, create a change, write its proposal and specifications, then validate and archive the completed work. The examples use the published **1.13.2** package, Node.js **20.19.0+**, and pnpm. Validation was checked with Node.js 26.7.0 and pnpm 10.28.2 in an empty directory, without model calls. Start in a new practice directory outside your application:

```bash
pnpm dlx @fission-ai/openspec@1.13.2 --help
pnpm dlx @fission-ai/openspec@1.13.2 init . --tools none
```

The first command runs help without a global installation; the second creates the OpenSpec structure without assistant integrations. Use an existing project only after reviewing what initialization will add. For definitions and suitability, read the independent [OpenSpec workflow and files guide](/garden/notes/openspec-guide/); this tutorial focuses on executing the first change.

## What is OpenSpec?

**OpenSpec** is an AI-native system for spec-driven development. In practice, it gives your AI coding workflow a durable structure: instead of asking an agent to “just implement this feature,” you describe the intended change as a proposal, validate the spec, let the agent implement against that spec, and then archive the completed change back into your main source of truth.

That makes OpenSpec especially useful for **brownfield projects**: existing codebases where most work is not a greenfield rewrite, but a steady stream of bug fixes, features, refactors, and product changes.

If you are comparing the broader landscape, I also wrote a longer SDD comparison: [BMAD vs spec-kit vs OpenSpec vs PromptX](/blog/-sddbmad-vs-spec-kit-vs-openspec-vs-promptx/). This tutorial focuses only on using OpenSpec day to day.

## When should you use OpenSpec?

Use OpenSpec when you want AI coding agents to operate with more determinism and less prompt drift.

Good fits:

- You already have a working codebase and want safer AI-assisted changes.
- You need a lightweight spec workflow without adopting a heavy enterprise process.
- You want a clear record of what changed, why it changed, and which requirements were updated.
- You work with multiple AI tools and want shared project instructions.
- You want reviewers to evaluate the **intent and acceptance criteria** before code is generated.

OpenSpec is less necessary for a one-off throwaway prototype. It becomes valuable when a repository must keep accumulating reliable decisions.

## Install or run the OpenSpec CLI

The npm package is:

```bash
@fission-ai/openspec
```

Run the pinned package with pnpm:

```bash
pnpm dlx @fission-ai/openspec@1.13.2 --help
```

The CLI entrypoint is `openspec`. Bare commands below, including the cheat sheet and optional AGENTS.md example, assume a separately installed CLI of the same version; otherwise use the `pnpm dlx @fission-ai/openspec@1.13.2` prefix:

```bash
openspec --help
```

The top-level help includes commands such as:

```text
init            Initialize OpenSpec in your project
update          Update OpenSpec instruction files
list            List changes or specs
view            Display an interactive dashboard
new change      Create a new change directory
validate        Validate changes and specs
show            Show a change or spec
archive         Archive a completed change and update main specs
status          Display artifact completion status
instructions    Output enriched artifact/task instructions
```

## Initialize OpenSpec in a project

For an interactive installation, run this from the intended project root. This is an alternative to the practice directory's `--tools none`, not another required initialization:

```bash
pnpm dlx @fission-ai/openspec@1.13.2 init .
```

If you want to configure AI tools non-interactively, use `--tools`:

```bash
pnpm dlx @fission-ai/openspec@1.13.2 init . --tools claude,codex,cursor,gemini,github-copilot
```

You can also use:

```bash
pnpm dlx @fission-ai/openspec@1.13.2 init . --tools all
pnpm dlx @fission-ai/openspec@1.13.2 init . --tools none
```

The CLI help currently lists many supported tools, including `claude`, `codex`, `cursor`, `gemini`, `github-copilot`, `kilocode`, `qwen`, `windsurf`, `cline`, `continue`, `opencode`, `roocode`, `trae`, and others.

## The core OpenSpec workflow

A simple OpenSpec loop looks like this:

1. **Initialize** OpenSpec in the repository.
2. **Create a change** for one feature, bug fix, or refactor.
3. **Write the proposal and spec deltas** before implementation.
4. **Validate** the change.
5. **Ask your AI agent to implement** against the approved change.
6. **Review and test** the code.
7. **Archive** the completed change so the main specs stay current.

This tutorial uses **spec review before implementation** as a project policy. OpenSpec's artifact workflow is iterative: if implementation changes your assumptions, update the proposal, delta, design, and tasks, then validate again. The CLI does not enforce an irreversible sequence.

## Create a new OpenSpec change

Use `openspec new change <name>`:

```bash
pnpm dlx @fission-ai/openspec@1.13.2 new change add-user-login
```

You can include a description:

```bash
pnpm dlx @fission-ai/openspec@1.13.2 new change add-user-login \
  --description "Add email/password login with session persistence"
```

The published 1.13.2 `new change --help` includes:

```text
--goal <text>         Optional goal metadata to store with the change
--schema <name>       Workflow schema to use, default: spec-driven
--json                Output as JSON
```

Do not copy the old `--areas` or `--initiative` workspace options into this version's commands. `--goal` remains available; it is optional metadata, not a mandatory workspace configuration. Check the installed version rather than mixing npm behavior with the main branch.

A good change name should be specific and action-oriented:

```text
add-user-login
fix-billing-retry-idempotency
refactor-search-indexing
improve-onboarding-empty-state
```

Avoid vague names:

```text
updates
misc-fixes
new-stuff
ai-work
```

## Example: a brownfield feature change

Suppose you maintain a SaaS app and want to add magic-link login.

Create the change:

```bash
pnpm dlx @fission-ai/openspec@1.13.2 new change add-magic-link-login --description "Allow users to sign in with one-time email magic links"
```

Then define the intent before coding. A strong proposal answers:

- What user problem does this solve?
- Which existing flows are affected?
- What must remain backward compatible?
- What are the acceptance criteria?
- What should the AI agent not change?

Save the following as `openspec/changes/add-magic-link-login/proposal.md`. The command above creates metadata and a README from the description; it does not create a complete proposal or delta:

```markdown
# Change: add-magic-link-login

## Why
Users forget passwords and support receives frequent reset requests. Magic-link login should reduce friction while preserving existing password login.

## What Changes
- Add a magic-link request form.
- Send a single-use email token.
- Validate the token and create a session.
- Keep existing email/password login unchanged.

## Capabilities
### New Capabilities
- `auth`: Single-use magic-link login alongside password login.
### Modified Capabilities
- None. This practice project has no existing auth spec.

## Impact
Authentication routes, token storage, email delivery, and login tests.

## Non-goals
- Do not remove password login.
- Do not redesign the entire auth page.
- Do not change billing or account settings.

## Acceptance criteria
- A valid link signs the user in once.
- Expired or reused links fail safely.
- Existing password login tests still pass.
```

In a real application with an existing auth spec, review that spec first: an existing requirement may need `MODIFIED`, not another `ADDED` entry. This exercise deliberately starts without a main auth specification.

### Write the actual spec delta

Create the directory `openspec/changes/add-magic-link-login/specs/auth/`, then save this complete file as `openspec/changes/add-magic-link-login/specs/auth/spec.md`:

```markdown
## Purpose
Allow existing users to sign in with a single-use email link while preserving the existing password sign-in flow.

## ADDED Requirements

### Requirement: Single-use magic-link sign-in
The system SHALL allow an existing user to sign in with a valid, unexpired, unused email link, consume it atomically, and reject expired or reused links without creating a session.

#### Scenario: Valid link
- **WHEN** an existing user submits a valid, unexpired, unused link
- **THEN** the system creates a session and marks the link as used

#### Scenario: Expired link
- **WHEN** a user submits an expired link
- **THEN** the system rejects it without creating a session

#### Scenario: Reused link
- **WHEN** a user submits a previously used link
- **THEN** the system rejects it without creating a session

### Requirement: Preserve password sign-in
The system SHALL retain the existing email and password sign-in behavior.

#### Scenario: Existing password login
- **WHEN** an existing user submits correct email and password credentials
- **THEN** the system signs the user in through the existing flow
```

`## ADDED Requirements`, `### Requirement:`, and `#### Scenario:` are parser-facing structure. Keep those headings and normative `SHALL` wording. The proposal's acceptance list is not a substitute for this file. Validation checks structure, not whether token consumption is actually atomic.

### Add design and implementation tasks

Save `openspec/changes/add-magic-link-login/design.md`:

```markdown
## Context
Add magic-link login without removing password login.

## Goals / Non-Goals
Support existing users only. Registration, billing, and page redesign are out of scope.

## Decisions
Store a hash of each random token with a user ID, expiry, and used status.
Consume an unexpired token atomically before creating a session.
Keep the existing password flow and use a local email test double.

## Risks / Trade-offs
Concurrent requests could replay a token unless consumption is atomic.
Expired, reused, and concurrent requests need application tests.

## Migration Plan
Add token storage behind a feature flag; disabling it preserves password login.
```

Save `openspec/changes/add-magic-link-login/tasks.md`:

```markdown
## 1. Implementation
- [ ] 1.1 Add token storage and a request endpoint with a local email test double.
- [ ] 1.2 Implement atomic token consumption and session creation.

## 2. Verification
- [ ] 2.1 Test valid, expired, reused, and concurrent token submissions.
- [ ] 2.2 Run existing password-login regression tests and review the diff.
```

These documents make the change ready to discuss, not ready to ship. Check tasks only after implementation and tests produce evidence. To inspect the schema's artifact state, run:

```bash
pnpm dlx @fission-ai/openspec@1.13.2 status --change add-magic-link-login --json
```

## Validate changes and specs

Before implementation, run validation:

```bash
pnpm dlx @fission-ai/openspec@1.13.2 validate add-magic-link-login
```

For stricter checks:

```bash
pnpm dlx @fission-ai/openspec@1.13.2 validate add-magic-link-login --strict --json --no-interactive
```

Validate everything:

```bash
pnpm dlx @fission-ai/openspec@1.13.2 validate --all
```

Useful validation flags:

```text
--all              Validate all changes and specs
--changes          Validate all changes
--specs            Validate all specs
--type <type>      Specify change or spec when ambiguous
--strict           Enable strict validation mode
--json             Output validation results as JSON
--no-interactive   Disable interactive prompts
```

For CI, `--json` and `--no-interactive` are especially useful:

```bash
pnpm dlx @fission-ai/openspec@1.13.2 validate --all --strict --json --no-interactive
```

## List and inspect OpenSpec items

List active changes:

```bash
pnpm dlx @fission-ai/openspec@1.13.2 list
```

List specs instead:

```bash
pnpm dlx @fission-ai/openspec@1.13.2 list --specs
```

Get machine-readable output:

```bash
pnpm dlx @fission-ai/openspec@1.13.2 list --json
```

Show a change or spec:

```bash
pnpm dlx @fission-ai/openspec@1.13.2 show add-magic-link-login
```

Show JSON:

```bash
pnpm dlx @fission-ai/openspec@1.13.2 show add-magic-link-login --json
```

If a name is ambiguous, specify the type:

```bash
pnpm dlx @fission-ai/openspec@1.13.2 show add-magic-link-login --type change
```

For change review automation, `--deltas-only` can be helpful:

```bash
pnpm dlx @fission-ai/openspec@1.13.2 show add-magic-link-login --json --deltas-only
```

## How AGENTS.md fits into OpenSpec

Many AI coding tools read repository instruction files. `AGENTS.md` has become a common convention for telling agents how to behave inside a codebase.

OpenSpec generates tool-specific skills and command files. For example, a separate 1.13.2 initialization with `--tools claude` creates `.claude/skills/openspec-propose/SKILL.md` and `.claude/commands/opsx/propose.md`. It does not require a generated `openspec/AGENTS.md`. The following rules are optional, handwritten project policy:

- Do not implement before reading the change proposal.
- Keep implementation scoped to the approved change.
- Update tests and docs when required by the spec.
- Run validation before claiming the task is done.
- Archive only after implementation and review are complete.

A practical `AGENTS.md` section for OpenSpec might look like this:

```markdown
## OpenSpec workflow

- Before coding, check active OpenSpec changes with `openspec list`.
- For a new feature or behavior change, create or use a change under `openspec/changes/`.
- Do not implement broad unrelated refactors inside a feature change.
- Run `openspec validate <change-name> --strict` before implementation handoff.
- After code and tests pass, archive with `openspec archive <change-name>`.
```

The value of `AGENTS.md` is not that it magically makes AI perfect. The value is that every compatible assistant starts from the same operational contract.

## Implement with your AI coding agent

Once the change is written and validated, give the agent a focused instruction:

```text
Implement the OpenSpec change `add-magic-link-login`.
Read the proposal and spec deltas first.
Keep the implementation scoped to this change.
Run relevant tests and report any deviations from the spec.
```

This prompt is much better than:

```text
Add magic link login.
```

The OpenSpec version gives the agent a durable source of truth, a boundary, and a review target.

## Archive a completed change

After implementation, review, and tests, archive the change:

```bash
pnpm dlx @fission-ai/openspec@1.13.2 archive add-magic-link-login
```

To skip confirmation prompts:

```bash
pnpm dlx @fission-ai/openspec@1.13.2 archive add-magic-link-login --yes
```

Check that the active change has moved to `openspec/changes/archive/YYYY-MM-DD-add-magic-link-login/` and that `openspec/specs/auth/spec.md` contains both requirements. Then validate the main spec:

```bash
pnpm dlx @fission-ai/openspec@1.13.2 validate auth --type spec --strict --json --no-interactive
```

The isolated CLI check for this article exercised init, new, strict validation, and archive using the files above. It did not implement authentication or send email. In the dry run, unchecked application tasks were retained as a warning; archive success is not evidence that those tasks were completed. In a real project, finish implementation, run the tests, and update the task list before archiving. Do not bypass validation to make this example pass.

The delta's `## Purpose` supplies the purpose when this new capability is created. Without it, archive can generate a placeholder that fails strict main-spec validation; an existing main spec's placeholder must be edited there directly. `--skip-specs` is only for changes that genuinely need no spec update; this login example needs its delta merged.

## OpenSpec command cheat sheet

| Task | Command |
|---|---|
| Show CLI help | `openspec --help` |
| Initialize a repo | `openspec init .` |
| Initialize with tools | `openspec init . --tools claude,codex,cursor` |
| Create a change | `openspec new change add-user-login` |
| List active changes | `openspec list` |
| List specs | `openspec list --specs` |
| Show a change or spec | `openspec show <name>` |
| Validate one item | `openspec validate <name>` |
| Strict validation | `openspec validate <name> --strict` |
| Validate everything | `openspec validate --all --strict` |
| Archive completed change | `openspec archive <name>` |
| Archive without prompts | `openspec archive <name> --yes` |
| Update instruction files | `openspec update .` |

## Best practices for OpenSpec

### 1. Keep each change small

OpenSpec works best when a change maps to one coherent feature, bug fix, or refactor. If a proposal includes authentication, pricing, onboarding, and a redesign, split it.

### 2. Write non-goals explicitly

AI agents can overreach. A `Non-goals` section makes scope expansion easier to identify; it is not a filesystem permission boundary.

### 3. Validate before implementation

Validation catches structural problems before the AI writes code. That is cheaper than debugging generated code based on a weak spec.

### 4. Use JSON output for automation

Commands such as `openspec list --json`, `openspec show --json`, and `openspec validate --json` are useful in scripts and CI checks.

### 5. Archive consistently

If completed changes are never archived, your repository accumulates stale proposals. The archive step is what keeps the main specs aligned with reality.

## Common mistakes

### Mistake: using OpenSpec as a documentation dump

OpenSpec is not just a place to store random docs. It is a workflow for controlled change.

### Mistake: creating one huge change

Large changes make AI implementation harder to review. Prefer multiple small changes with clear acceptance criteria.

### Mistake: skipping validation

If the spec is invalid, the generated code is likely to drift. Validate early.

### Mistake: asking the agent to infer everything

Do not make the agent guess the product intent. Write the proposal, define non-goals, and specify acceptance criteria.

## OpenSpec vs spec-kit vs BMAD: quick positioning

- **OpenSpec**: best for lightweight, brownfield, change-centric workflows.
- **GitHub spec-kit**: stronger for structured greenfield or enterprise-style gated flows.
- **BMAD**: useful when you want a role-based AI planning team before development.
- **PromptX**: more of a context/persona platform than a strict spec workflow.

If your team is asking “how do we safely use AI agents in an existing repo?”, OpenSpec is one of the most practical starting points.

## Versioned References

- [OpenSpec 1.13.2 README](https://github.com/Fission-AI/OpenSpec/blob/v1.13.2/README.md)
- [1.13.2 CLI reference](https://github.com/Fission-AI/OpenSpec/blob/v1.13.2/docs/cli.md)
- [1.13.2 OPSX workflow](https://github.com/Fission-AI/OpenSpec/blob/v1.13.2/docs/opsx.md)

## Final takeaway

OpenSpec is valuable because it turns AI coding from a chat-only activity into a reviewable change-management loop:

```text
proposal -> spec delta -> validation -> implementation -> review -> archive
```

That loop is simple, but it solves a real problem: AI agents need durable context and boundaries. OpenSpec gives them both.
