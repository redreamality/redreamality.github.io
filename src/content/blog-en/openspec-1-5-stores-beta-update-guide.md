---
title: 'OpenSpec 1.5 Explained: Stores Beta, Explore-first Workflow, and Team-scale Spec Collaboration'
pubDate: 2026-07-02T01:30:00.000Z
description: 'A detailed update and usage guide for OpenSpec 1.5.0, covering Stores Beta, /opsx:explore, brownfield adoption, command frontmatter fixes, and the shift from repo-local specs to shared planning context.'
author: 'Remy'
tags: ['openspec', 'spec-driven development', 'sdd', 'ai coding', 'stores', 'ai agents', 'cli']
lang: 'en'
translatedFrom: 'openspec-1-5-stores-beta-update-guide'
---

OpenSpec’s recent updates are not just a collection of small CLI improvements. The larger story is a shift in its operating model: OpenSpec is moving from a lightweight repo-local spec workflow toward a shared specification collaboration layer for multiple repositories, teams, and AI coding agents.

If there is one keyword to remember, it is **Stores**. If there is one workflow to remember, it is:

```text
explore → propose → apply → archive
```

This article is based on the `Fission-AI/OpenSpec` `v1.5.0` source code, `CHANGELOG`, `docs/cli.md`, `docs/commands.md`, `docs/explore.md`, `docs/existing-projects.md`, and the related command implementations. It explains what changed, how to use the new features, and what the changes mean for real engineering teams.

If you are new to OpenSpec, start with the practical tutorial first: [OpenSpec Tutorial: CLI Install, Commands, AGENTS.md, and Real-World Examples](/blog/openspec-tutorial-cli-commands-agents-md-examples/). This article focuses on what changed around 1.5 and how to reason about it.

## One-sentence summary

OpenSpec 1.5 introduces **Stores Beta** to separate specs, changes, and planning context from a single repository; it also makes explore-first more prominent, improves brownfield adoption guidance, and hardens command/frontmatter/config behavior across AI tool adapters.

In practice, OpenSpec is trying to answer harder questions than “how do I generate a proposal?”

- Can team-level requirements live outside a single code repository?
- Can one project reference another team’s specification context?
- Can an AI agent reliably know which OpenSpec root it is acting on?
- Can a fuzzy idea be explored before it becomes a formal change?

## OpenSpec 1.5.0: Stores Beta is the main event

The current package is `@fission-ai/openspec@1.5.0`, described as:

> AI-native system for spec-driven development

The CLI entrypoint is still:

```bash
openspec
```

But 1.5.0 adds **Stores very early beta**. The official docs define a Store as:

> A store is a standalone OpenSpec repo you've registered on this machine.

A Store can be:

- a shared team planning repository;
- a product, contract, architecture, or platform spec repository;
- reusable context across multiple projects;
- an external OpenSpec root you do not want to put inside the current code repo.

Once registered, normal OpenSpec commands can act in that Store from anywhere by passing `--store <id>`:

```bash
openspec list --store team-context
openspec show auth --type spec --store team-context
openspec new change add-billing-api --store team-context
openspec status --change add-billing-api --store team-context
openspec archive add-billing-api --store team-context
```

That is the key difference from the old mental model. Previously, OpenSpec mostly assumed a local `openspec/` directory under the current repository. Now it has to manage multiple OpenSpec roots explicitly.

## What problem do Stores solve?

For a small single-repo project, keeping `openspec/specs` and `openspec/changes` in the same repository is often enough. Real teams, however, run into more complex cases:

- one product capability spans several repositories;
- a platform team maintains requirements that many product teams need to reference;
- the code repo is large, but planning should evolve independently;
- AI agents work in different repos while relying on the same business constraints;
- an existing project wants a lighter onboarding path without a full local `openspec/` tree.

Stores lift specs from “a folder inside one codebase” to “registered, diagnosable, referenceable, selectable engineering assets.”

That is why Stores should be understood as an organizational model change, not just a new command group.

## Store commands at a glance

The docs still mark Stores as Beta: command names, flags, file formats, and JSON output may change. The current surface is already clear enough to experiment with.

### Create and register a Store

```bash
openspec store setup team-context --path ~/openspec/team-context
```

Skip Git initialization if needed:

```bash
openspec store setup team-context --path ~/openspec/team-context --no-init-git
```

For agents and scripts, use explicit inputs and JSON output:

```bash
openspec store setup team-context \
  --path ~/openspec/team-context \
  --no-init-git \
  --json
```

### Register an existing Store

```bash
openspec store register ~/openspec/team-context --id team-context
```

### Forget a local registration without deleting files

```bash
openspec store unregister team-context
```

Use this when a Store was moved, cloned elsewhere, or should no longer be shown by OpenSpec on this machine.

### Remove the local Store folder

```bash
openspec store remove team-context --yes
```

The docs emphasize that `remove` deletes the local folder. Interactive mode shows the exact folder first; scripts and JSON callers must pass `--yes`. The implementation also checks matching metadata to avoid deleting the wrong folder.

### List registered Stores

```bash
openspec store list
openspec store ls --json
```

### Diagnose Store health

```bash
openspec store doctor
openspec store doctor team-context --json
```

`doctor` is diagnostic-only. It does not clone, pull, push, or repair. For AI agents, the `status` arrays in JSON mode are the reliable machine-readable signal.

## Source-level view: how the Store registry works

The Store implementation lives mainly in:

```text
src/core/store/foundation.ts
src/core/store/registry.ts
src/core/store/operations.ts
src/core/root-selection.ts
src/commands/store.ts
```

`foundation.ts` defines the machine-local registry file name:

```ts
export const STORE_REGISTRY_FILE_NAME = 'registry.yaml';
```

Conceptually, the registry looks like this:

```yaml
version: 1
stores:
  team-context:
    id: team-context
    root: /Users/you/openspec/team-context
    # backend / metadata / remote fields
```

Important operations include:

- `readStoreRegistryState()` to read the registry;
- `writeStoreRegistryState()` to write it;
- `updateStoreRegistryState()` to update it under a lock;
- `listStoreRegistryEntries()` to list entries;
- `registerStore()` to register a Store;
- `unregisterStoreRegistration()` to remove a local registration;
- conflict checks to prevent one id from pointing to inconsistent roots or backends;
- metadata validation to catch registry id and Store metadata mismatches.

OpenSpec is not merely storing a path. It is treating a Store as an identifiable context unit with health, metadata, Git/remote information, and a local registry.

## Root selection: why `--store` matters

With Stores, many commands must first answer: **which OpenSpec root should this command act on?**

Commands such as `list`, `show`, `validate`, `status`, `instructions`, `new change`, `archive`, `doctor`, and `context` resolve one root before acting.

A practical mental model is:

1. explicit `--store <id>` wins;
2. otherwise use the local repo OpenSpec root when present;
3. otherwise use the default `store:` declared in `openspec/config.yaml`;
4. otherwise fail with diagnostics.

This matters a lot for AI agents. Without explicit root selection, an agent may run a command in the wrong directory or confuse a repo-local root with an external planning context. The newer JSON outputs and diagnostics carry root/store information so agents can verify where they are operating.

## References: read-only context, not write ownership

A project can declare Store references in `openspec/config.yaml`:

```yaml
schema: spec-driven
references:
  - team-context
```

Or include a remote source:

```yaml
references:
  - { id: team-context, remote: "git@github.com:acme/team-context.git" }
```

After that, `openspec instructions` includes an index of referenced Store specs:

- spec id;
- a one-line summary extracted from the Purpose section;
- a fetch command such as:

```bash
openspec show <spec-id> --type spec --store team-context
```

The important rule is: **references are read-only context**. They do not change where the command writes. Work stays in the repo’s own root unless you explicitly use `--store <id>`.

This keeps context and lifecycle separate. A change belongs to one root; a reference only helps the agent understand background information.

## Declaring a default external Store

A repo whose planning is fully externalized can declare a default Store:

```yaml
store: team-context
```

Then normal commands resolve to that Store automatically:

```bash
openspec list
openspec new change add-login
openspec status --change add-login
```

Explicit `--store` still wins. If the directory already contains real planning folders, the local root is not silently overridden by the pointer.

## Context and Worksets: assembling the agent’s working set

Two related commands answer different questions:

```bash
openspec doctor [--store <id>] [--json]
openspec context [--store <id>] [--json]
```

Use this mental model:

- `doctor` asks: is this root and its referenced Stores healthy?
- `context` asks: what root and referenced Stores make up this working set?

`context` can also write a VS Code workspace with `--code-workspace`, combining the root and available referenced Stores into one workspace. Worksets are more personal and local: named views of folders you work on together. They are not committed, not shared, and not derived from declarations.

## Explore-first: the workflow moves earlier

The other major signal in the documentation update is the stronger positioning of `/opsx:explore`.

The command docs say it plainly:

> Start here when you're unsure.

`/opsx:explore` does not create a change. It acts as a no-stakes thinking partner: it reads the codebase, compares options, and sharpens a fuzzy idea before artifacts or code exist.

The recommended habit becomes:

```text
/opsx:explore   # explore when the problem is still fuzzy
/opsx:propose   # create a formal change and planning artifacts
/opsx:apply     # implement tasks
/opsx:archive   # archive completed work back into specs
```

This is different from the default vibe of many AI coding tools, which encourage “just implement X.” OpenSpec is now more explicit: if the requirement is unclear, do not rush into a proposal, and definitely do not rush into code.

## Terminal CLI vs AI slash commands

The docs repeatedly clarify a common source of confusion:

- `openspec init/update/list/validate/status/...` are terminal commands;
- `/opsx:explore`, `/opsx:propose`, `/opsx:apply`, and `/opsx:archive` are typed in the AI assistant chat.

A typical flow looks like this:

```bash
# terminal
npx -y @fission-ai/openspec@latest init .
npx -y @fission-ai/openspec@latest update
```

Then in your AI tool:

```text
/opsx:explore redesign billing flow
/opsx:propose add-usage-based-billing
/opsx:apply
/opsx:archive
```

The CLI manages files, schemas, roots, status, and validation. The AI slash commands make the agent act against the same artifact contract.

## Brownfield projects: do not document the whole system first

The enhanced existing-projects guidance shows that OpenSpec is not only for greenfield templates. For brownfield projects, the better path is delta-first:

- do not try to document the entire system up front;
- start with one real change;
- add only the specs needed for the affected area;
- let proposal, design, tasks, and spec deltas constrain this change;
- archive completed work so the main specs grow over time.

This matters because many spec-driven tools fail by asking teams to create too much documentation before they get value. OpenSpec’s brownfield path is lighter: solve the current change, then let knowledge accumulate.

## YAML frontmatter fix: small bug, large surface area

OpenSpec 1.5 also fixes YAML frontmatter escaping for generated command descriptions.

The shared helper now lives in:

```text
src/core/command-generation/yaml.ts
```

The core function is:

```ts
export function escapeYamlValue(value: string): string {
  const needsQuoting = /[:\n\r#{}[\],&*!|>'"%@`]|^\s|\s$/.test(value);
  if (needsQuoting) {
    const escaped = value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r');
    return `"${escaped}"`;
  }
  return value;
}
```

It is shared by adapters including Claude, Cursor, Windsurf, Pi, and Bob.

This may look minor, but command files are integration surfaces. If CRLF or YAML line folding silently corrupts a frontmatter value, the command may look correct to a human while being interpreted differently by the tool. Centralizing this helper makes the behavior consistent across adapters.

## Config JSON container parsing fix

OpenSpec 1.5 also fixes config parsing when values are wrapped in a JSON container. This matters when editors, AI tools, or automation scripts generate configuration.

Together with the YAML fix, this shows OpenSpec hardening itself as a protocol layer between tools. The more AI tool integrations it supports, the less it can rely on “the file looks fine to a human.”

## v1.4: more tool integrations and compatibility fixes

The 1.4 releases are worth reading together with 1.5.

`v1.4.0` added:

- Kimi CLI support;
- Mistral Vibe support;
- `/opsx:sync` generated by default in the core profile;
- case-insensitive requirement headers;
- zsh / oh-my-zsh completion fixes;
- clearer validation hints when `SHALL` / `MUST` appear in the wrong place.

`v1.4.1` fixed:

- `openspec update` being misled by a project’s own `workspace.yaml`;
- beta workspace view state being moved to `.openspec-workspace/view.yaml`;
- top-level `openspec update` no longer incorrectly routing to workspace update.

These updates show both ecosystem expansion and cleanup of workspace-era edge cases. Stores are the more systematic response to those boundaries.

## When should you use a Store?

Keep using repo-local `openspec/` when:

- you have one code repository;
- specs and code share the same lifecycle;
- you do not need cross-repo planning context;
- your main goal is safer AI-assisted changes.

Consider a Store when:

- one product capability spans multiple repositories;
- you have team-level shared specifications;
- platform, API contract, or design system specs should live independently;
- you want the code repo to stay light while referencing external planning context;
- multiple AI agents need the same source of planning truth.

Be cautious with Stores when:

- you cannot tolerate beta command or format changes;
- your team has not yet formed a spec maintenance habit;
- you are building a throwaway prototype;
- your problem is not complex enough to need multiple roots.

## A recommended team workflow

Create a team-level Store:

```bash
openspec store setup team-context \
  --path ~/openspec/team-context \
  --remote git@github.com:acme/team-context.git
```

Reference it from a product repo:

```yaml
# openspec/config.yaml
schema: spec-driven
references:
  - { id: team-context, remote: "git@github.com:acme/team-context.git" }
```

During daily work:

```bash
openspec doctor --json
openspec context --json
openspec instructions --change add-billing-api --json
```

In the AI chat:

```text
/opsx:explore usage-based billing edge cases
/opsx:propose add-usage-based-billing
/opsx:apply
/opsx:archive
```

If the change itself belongs to the team Store rather than the local repo:

```bash
openspec new change update-billing-contract --store team-context
```

Then let the AI agent continue generating artifacts against that change.

## Product direction: what OpenSpec is becoming

This update points in three directions.

First, OpenSpec is moving from command generation to workflow runtime. Early value came from generating commands and skills for AI coding tools. Now it is investing in root selection, artifact state, validation, archive, and JSON contracts.

Second, it is moving from a single-project tool to a multi-project collaboration layer. Stores, references, context, and worksets all help specs live outside a single code repository and be assembled into an agent’s working context.

Third, it is emphasizing constraints on AI implementation rather than documentation for its own sake. The value of `explore → propose → apply → archive` is not more Markdown; it is a closed loop from intent to acceptance criteria, tasks, implementation, and final spec delta.

## Conclusion

The most important part of OpenSpec 1.5 is not one command. It is a new model for where specifications live, who owns them, how they are referenced, and which AI agent is allowed to act on which root.

For individual developers, the best habit is: **when unsure, start with `/opsx:explore` instead of asking the AI to edit code immediately.**

For teams and multi-repo systems, the best experiment is: **extract shared specifications into a Store, use references for read-only context, and use `--store` to make write ownership explicit.**

Stores are still early beta, but the direction is clear: OpenSpec is evolving from a spec file template for AI coding into a specification collaboration layer for AI-native software development.
