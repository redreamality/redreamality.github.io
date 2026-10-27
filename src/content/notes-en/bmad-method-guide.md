---
title: "BMAD Method Guide: Install, Run a Workflow, and Inspect the Outputs"
description: "Install BMAD and verify a first small change: isolated 6.12.4 installation and skill rendering, a downloadable exercise with seven tests, troubleshooting, and preserved 6.12.0 version notes."
date: 2026-01-10
source: "https://github.com/bmad-code-org/BMAD-METHOD"
tags: ["ai-development", "Agile", "bmad", "sdd", "multi-agent-systems"]
lang: "en"
translatedFrom: "bmad-method-guide"
---

**BMAD Method is an open-source method and toolkit for guiding AI coding assistants through requirements, planning, and review.** The [official repository](https://github.com/bmad-code-org/BMAD-METHOD) supplies an installer and skill definitions. Product, architecture, and development roles bring different questions to the work. It fits changes that need durable decisions and several stages of delivery; role names do not provide filesystem isolation.

Start with a small workflow whose results are easy to inspect before adopting more planning. This guide uses the published npm package **bmad-method 6.12.0**, checked on **2026-09-25 UTC**. Installation and local skill rendering were verified in an empty directory outside the repository. No live model, paid service, or implementation of the exercise below was run.

## Go from installation to a verifiable small change

On October 26, 2026, npm's `latest` was **6.12.4**. A fresh directory outside the repository was used to install BMM and the Claude Code integration. It produced 29 skill entry points and a readable build workflow. The older sections below preserve the 6.12.0 record; September's distribution tags are not today's latest version.

```bash
pnpm dlx bmad-method@6.12.4 install --directory . --modules bmm --tools claude-code --yes
```

Change into a new practice directory before running this command. After installation, read `.claude/skills/bmad-build/SKILL.md` and run its rendering command with the actual absolute paths. The command checked here has this form:

```bash
uv run --no-cache "<practice>/_bmad/scripts/render_skill.py" --project-root "<practice>" --skill "<practice>/.claude/skills/bmad-build"
```

The successful output points to `_bmad/render/bmad-build/.../workflow.md`. That file references an existing `step-01-clarify-and-route.md`. This confirms that the installed workflow can be loaded, not that a model completed clarification, implementation, or review.

Use the [complete shared task and acceptance contract](/assets/jev-bmad-search-repair/small-change-task.md): add a whitespace-normalization function for display names. Invoke `/bmad-build` in the assistant opened in the practice directory and supply the task. It explicitly uses Python's Unicode whitespace semantics, returns an empty string for empty input, and raises `TypeError` for non-strings. Identity validation and transliteration are outside its scope. These decisions prevent an implementation from converting `None` to text or handling only ASCII spaces.

Download the [acceptance tests](/assets/jev-bmad-search-repair/test_normalize_name.py). Once the assistant creates `normalize_name.py`, run:

```bash
uv run --no-project python -B -m unittest -v test_normalize_name.py
```

Seven tests cover trimming and collapsing, empty input, newlines and tabs, Unicode whitespace, Chinese text preservation, invalid types, and idempotence. An [author-written reference implementation](/assets/jev-bmad-search-repair/normalize_name.py) is also provided. Its actual local run returned `Ran 7 tests` and `OK`. This demonstrates the reference passing acceptance tests, not a BMAD model run. To evaluate an assistant, supply the task and tests first, then compare its result with the reference.

Read the assistant's actual `spec-<slug>.md` and connect each behavior to code and test evidence. The 6.12.4 template retains intent, status, implementation notes, and review records; simplified routes can omit planning sections. Creating a file marked `done` is not a substitute for executing a workflow, and checked task boxes alone do not prove correct behavior.

Use these checks when installation does not lead to a completed change:

<div class="content-table-scroll" role="region" aria-label="Symptom / Next check" tabindex="0">

| Symptom | Next check |
| --- | --- |
| Chat cannot find `bmad-build` | Verify the host's working directory and `.claude/skills/bmad-build/SKILL.md`, then reopen it |
| Installation passes but rendering fails | Check `uv --version`, actual paths, and the script error; model work has not begun |
| Workflow exists but no spec or code appears | Check whether the skill was invoked in chat and whether the host model service is available |
| Test module is missing | Complete or repair implementation; installation is not feature completion |
| Unicode or invalid-type checks fail | Resolve the behavior against the task instead of deleting failing cases |

</div>

Sources are the [6.12.4 build entry point](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.12.4/src/bmm-skills/ship/bmad-build/SKILL.md), [spec template](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.12.4/src/bmm-skills/ship/bmad-build/spec-template.md), and the installed files. No host model was started. For tool selection on this same task, read the [SDD comparison](/blog/-sddbmad-vs-spec-kit-vs-openspec-vs-promptx/).

## Which Version to Install

At verification time, npm's `latest` pointed to 6.12.0, `next` to 6.12.1-next.0, and `rollback` to 4.39.0; no `alpha` tag was returned. Tags move, so the commands below pin a version. `@latest` is not a permanent alias for v4, and v6 should no longer be described as uniformly alpha.

This installer requires **Node.js 20.12.0+**. Skills such as `bmad-build` also require **uv** to run Python scripts; the release README lists Python 3.10+. Without uv, installation may finish with a warning, but the build skill stops. Successful installation is not proof that the workflow is ready. Model-driven work additionally needs a supported coding assistant and an available model service. Git is an installation prerequisite only for external or custom modules fetched from Git.

In an empty practice directory, inspect the help, then install BMM with the Claude Code integration:

```bash
pnpm dlx bmad-method@6.12.0 install --help
pnpm dlx bmad-method@6.12.0 install --directory . --modules bmm --tools claude-code --yes
```

`--yes` accepts defaults and `--directory .` selects the current directory. This already installs BMAD into the project; the old `*workflow-init` is not needed to create its directories. For another host, run the same version's `install --list-tools` and select its actual tool ID rather than guessing from the product name.

## Inspect the Installed Files

The Claude Code installation produced these important paths:

```text
_bmad/
  config.toml
  config.user.toml
  _config/
    bmad-help.csv
  custom/
  scripts/
    render_skill.py
    resolve_config.py
  render/
_bmad-output/
.claude/
  skills/
    bmad-help/
      SKILL.md
    bmad-build/
      SKILL.md
      spec-template.md
```

`_bmad/` contains shared configuration and supporting scripts. `.claude/skills/` contains entry points for the chosen host. `_bmad-output/` is the output location, but it need not contain requirements or implementation documents immediately after installation. An empty output directory does not show that a workflow has run.

In 6.12.0, `_bmad/config.toml` is installer-managed and regenerated on installation. Persistent team overrides belong in `_bmad/custom/config.toml`; personal overrides use `_bmad/custom/config.user.toml`. Before changing installer settings, inspect the same version's `install --list-options`. The generated defaults include:

```toml
[modules.bmm]
planning_artifacts = "{project-root}/_bmad-output/planning-artifacts"
implementation_artifacts = "{project-root}/_bmad-output/implementation-artifacts"
project_knowledge = "{project-root}/docs"
```

This is an excerpt from the actual configuration, not a new configuration format to invent. Earlier v6 documentation describing `_bmad/bmm/config.yaml` applies to a different version. Neither `.bmad` nor `.bmad-core` describes this release's installation. `BmadElixir`, cited by the older article, is a separate third-party project; its fields are not an official BMAD-METHOD configuration contract.

## First Workflow: Help, Build, and Inspect

Open the selected coding assistant in the practice directory. These are **skill invocations inside Claude Code chat, not shell commands**:

```text
/bmad-help I have finished installation. Explain this project's current state and how to begin a small change.
```

`bmad-help` uses the installed `_bmad/_config/bmad-help.csv`, configuration, and existing artifacts to suggest the next step. Confirm that it recognizes the practice project and can find `bmad-build`. If not, inspect the startup directory and `.claude/skills/bmad-help/SKILL.md`, then reopen the host. Do not assume IDE file-watching permissions are the cause.

Give `bmad-build` a locally testable request without external side effects:

```text
/bmad-build Add normalize_name.py and test_normalize_name.py in this practice directory.
Use only the Python standard library. normalize_name(value) trims leading and trailing
whitespace and collapses internal whitespace to one space. Empty strings return an
empty string. Non-string input raises TypeError. Do not access the network, install
third-party dependencies, commit, or push. Ask me first if the behavior is unclear.
```

This is an exercise for the reader, not a record of code generated during verification. This release's build workflow generally clarifies, plans, implements, reviews, and presents the result. A small, low-risk request with no intent gaps may take the simplified `oneshot` route. Do not expect a separate approval prompt at every stage of every task.

### Expected Artifacts and Checks

The release's template stores `spec-<slug>.md` under the configured `implementation_artifacts` location. For this example, it might be `_bmad-output/implementation-artifacts/spec-normalize-name.md`; the actual task determines the slug. The spec preserves intent, status, and implementation notes. The fuller route also records boundaries, input/output scenarios, tasks, and verification; the simplified route may omit some sections.

Inspect the actual paths reported by the assistant, then read `normalize_name.py`, `test_normalize_name.py`, and the spec. Do not accept a completion claim without checking the behavior:

| Input | Expected result |
| --- | --- |
| `"  Ada   Lovelace  "` | `"Ada Lovelace"` |
| `""` or whitespace-only text | `""` |
| Text containing newlines and tabs | Words separated by single spaces |
| `None` or a number | `TypeError` |

Have the tests cover these cases, then run from the practice directory:

```bash
uv run --no-project python -m unittest -v test_normalize_name.py
```

This command requires the workflow to have created the test file. A missing file or failing test means the exercise is unfinished; address the cause rather than marking the spec `done`. Review the source changes and confirm they are limited to the function, tests, and BMAD artifacts, without network access or unrelated dependencies.

You can then ask:

```text
/bmad-help Explain the workflow just completed. List the actual artifacts, verification evidence, and unfinished work.
```

## What Was Actually Verified

Installation succeeded in an empty Windows directory with Node.js 26.7.0, pnpm 10.28.2, and uv 0.12.17, producing the paths above. The local `render_skill.py` command from the installed `bmad-build/SKILL.md` also produced a workflow under `_bmad/render/bmad-build/.../workflow.md`.

That verifies the package, installer, host entry-point files, and skill rendering. It does not verify that a model follows the workflow correctly. Python feature generation, conversational help, and application test results were not executed here and are not reported as observed successes. The installer needs no model credentials, but executing skills in a host may use a subscription or metered model service.

## Roles, Quality Gates, and Context Cost

Product, architecture, and development roles provide different questions and review perspectives. A developer instruction can ask the agent to report an architecture conflict, but that does not prove it lacks permission to edit database files. Filesystem restrictions, sandboxing, approvals, and network permissions belong to the host and execution environment.

Likewise, adding an invented `quality.pre_commit` field does not create an officially supported commit gate. To block unsuitable changes, configure real test commands, Git hooks, or CI and verify the failure path with a failing test. This guide did not implement or verify those enforcement mechanisms.

Splitting documents and loading only relevant context may reduce repeated input. Savings depend on the model, task, caching, and review iterations. There is no fixed token-saving percentage or accuracy guarantee here.

For work spanning domains, sessions, or important architectural decisions, use `bmad-help` to select requirements, architecture, or deeper planning. Typo fixes and mechanical formatting may not need the full process. If the main need is maintaining specification files around one existing-project change, compare [OpenSpec's workflow and artifacts](/garden/notes/openspec-guide/).

## Versioned Sources

- [6.12.0 installation guide](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.12.0/docs/start/install-bmad.md): prerequisites, installation, and updates.
- [6.12.0 first-change tutorial](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.12.0/docs/start/build-your-first-change.md): the published `bmad-build` entry point.
- [6.12.0 bmad-help](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.12.0/src/core-skills/bmad-help/SKILL.md): data used by the help skill.
- [6.12.0 build template](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.12.0/src/bmm-skills/ship/bmad-build/spec-template.md): artifact fields and simplification conditions.
- [npm distribution tags](https://registry.npmjs.org/-/package/bmad-method/dist-tags): mutable; use the pinned version for reproduction.
