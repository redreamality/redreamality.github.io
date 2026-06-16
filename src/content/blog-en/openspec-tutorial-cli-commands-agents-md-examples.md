---
title: 'OpenSpec Tutorial: CLI Install, Commands, AGENTS.md, and Real-World Examples'
pubDate: 2026-06-16T08:15:00.000Z
description: 'A practical OpenSpec tutorial for AI-native spec-driven development: install the CLI, initialize a project, create changes, validate specs, use AGENTS.md, and follow a brownfield workflow.'
author: 'Remy'
tags: ['openspec', 'spec-driven development', 'sdd', 'ai coding', 'agents.md', 'cli']
---

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

You can run it with `npx`:

```bash
npx -y @fission-ai/openspec@latest --help
```

The CLI entrypoint is `openspec`:

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

From your repository root:

```bash
npx -y @fission-ai/openspec@latest init .
```

If you want to configure AI tools non-interactively, use `--tools`:

```bash
npx -y @fission-ai/openspec@latest init . --tools claude,codex,cursor,gemini,github-copilot
```

You can also use:

```bash
npx -y @fission-ai/openspec@latest init . --tools all
npx -y @fission-ai/openspec@latest init . --tools none
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

The key mental model is: **the spec leads, the code follows**.

## Create a new OpenSpec change

Use `openspec new change <name>`:

```bash
npx -y @fission-ai/openspec@latest new change add-user-login
```

You can include a description:

```bash
npx -y @fission-ai/openspec@latest new change add-user-login \
  --description "Add email/password login with session persistence"
```

For coordinated workspaces, the command also supports flags such as:

```text
--goal <text>         Workspace product goal to store with the change
--areas <names>       Comma-separated affected workspace link names
--initiative <id>     Link the repo-local change to an initiative
--schema <name>       Workflow schema to use, default: spec-driven
--json                Output as JSON
```

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
npx -y @fission-ai/openspec@latest new change add-magic-link-login \
  --description "Allow users to sign in with one-time email magic links"
```

Then define the intent before coding. A strong proposal answers:

- What user problem does this solve?
- Which existing flows are affected?
- What must remain backward compatible?
- What are the acceptance criteria?
- What should the AI agent not change?

For example:

```markdown
# Change: add-magic-link-login

## Why
Users forget passwords and support receives frequent reset requests. Magic-link login should reduce friction while preserving existing password login.

## What changes
- Add a magic-link request form.
- Send a single-use email token.
- Validate the token and create a session.
- Keep existing email/password login unchanged.

## Non-goals
- Do not remove password login.
- Do not redesign the entire auth page.
- Do not change billing or account settings.

## Acceptance criteria
- A valid link signs the user in once.
- Expired or reused links fail safely.
- Existing password login tests still pass.
```

This is the point of OpenSpec: it gives the AI agent a smaller, safer box to work inside.

## Validate changes and specs

Before implementation, run validation:

```bash
npx -y @fission-ai/openspec@latest validate add-magic-link-login
```

For stricter checks:

```bash
npx -y @fission-ai/openspec@latest validate add-magic-link-login --strict
```

Validate everything:

```bash
npx -y @fission-ai/openspec@latest validate --all
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
npx -y @fission-ai/openspec@latest validate --all --strict --json --no-interactive
```

## List and inspect OpenSpec items

List active changes:

```bash
npx -y @fission-ai/openspec@latest list
```

List specs instead:

```bash
npx -y @fission-ai/openspec@latest list --specs
```

Get machine-readable output:

```bash
npx -y @fission-ai/openspec@latest list --json
```

Show a change or spec:

```bash
npx -y @fission-ai/openspec@latest show add-magic-link-login
```

Show JSON:

```bash
npx -y @fission-ai/openspec@latest show add-magic-link-login --json
```

If a name is ambiguous, specify the type:

```bash
npx -y @fission-ai/openspec@latest show add-magic-link-login --type change
```

For change review automation, `--deltas-only` can be helpful:

```bash
npx -y @fission-ai/openspec@latest show add-magic-link-login --json --deltas-only
```

## How AGENTS.md fits into OpenSpec

Many AI coding tools read repository instruction files. `AGENTS.md` has become a common convention for telling agents how to behave inside a codebase.

OpenSpec can generate or update instruction files for supported tools. That matters because the spec workflow only works if the agent knows the rules:

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
npx -y @fission-ai/openspec@latest archive add-magic-link-login
```

To skip confirmation prompts:

```bash
npx -y @fission-ai/openspec@latest archive add-magic-link-login --yes
```

For infrastructure, tooling, or documentation-only changes where no spec update is needed:

```bash
npx -y @fission-ai/openspec@latest archive docs-update --skip-specs
```

There is also `--no-validate`, but treat it as an emergency escape hatch rather than a normal workflow.

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

AI agents often overreach. A `Non-goals` section prevents accidental scope expansion.

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

## Final takeaway

OpenSpec is valuable because it turns AI coding from a chat-only activity into a reviewable change-management loop:

```text
proposal -> spec delta -> validation -> implementation -> review -> archive
```

That loop is simple, but it solves a real problem: AI agents need durable context and boundaries. OpenSpec gives them both.
