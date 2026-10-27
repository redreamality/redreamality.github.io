---
title: 'AGENTS.md vs CLAUDE.md: Which file loads, coexistence, and templates'
pubDate: 2026-04-26T00:00:00.000Z
updatedDate: 2026-10-26T00:00:00.000Z
description: 'Choose AGENTS.md or CLAUDE.md, check Claude Code version-specific loading and Codex fallback rules, verify active instructions, and reuse working templates.'
author: 'Remy'
tags: ['claude-code', 'ai-agents', 'Context Engineering']
lang: 'en'
translatedFrom: 'claude-md-agents-md-deep-dive'
---

## Which file should you use?

Use **AGENTS.md for shared repository instructions and Codex**. Use **CLAUDE.md for Claude Code-specific instructions**. For a team using both tools, my default is one shared `AGENTS.md` and a small `CLAUDE.md` that imports it with `@AGENTS.md`. This keeps the common rules in one place without depending on every teammate's Claude version and fallback settings. [1] [2] [3]

**Does Claude Code read AGENTS.md?** Since **v2.1.277**, supported sessions can read it directly. By default, a project or ancestor `CLAUDE.md`, `.claude/CLAUDE.md`, or `CLAUDE.local.md` prevents that fallback. Your user-level `~/.claude/CLAUDE.md`, managed instructions, and `.claude/rules/` do not prevent it. Having both filenames does not, by itself, mean both load. [1]

Check `claude --version`, then `/config` → **Project instructions** and `/context`. Use `/memory` to inspect the AGENTS path. For older clients or mixed teams, use the [import template](#copyable-templates). For both-file loading, use the [version matrix](#loading-and-coexistence). For Codex, inspect its [separate discovery rules](#codex-discovery).

## Loading and coexistence

The following describes official documentation checked on **October 26, 2026**, rather than every historical Claude Code release. [1]

| Version or layout | What happens |
| --- | --- |
| Before v2.1.277, disabled AGENTS plugin, or some first sessions after upgrading from v2.1.276 or earlier | Direct AGENTS loading is unavailable. Use a CLAUDE import; after upgrading, start a new session. |
| v2.1.277–v2.1.280 | Direct support exists, but some sessions, including Bedrock or telemetry-disabled sessions, still require an upgrade or import. |
| Supported session, default `claude-md-or-agents-md` | AGENTS files load only when no blocking CLAUDE file exists in the working directory or ancestors. |
| `claude-md-and-agents-md` | Both load; within each directory CLAUDE content precedes AGENTS content. Already imported AGENTS files are deduplicated. |
| `claude-md` | Only CLAUDE files load directly; an explicit `@AGENTS.md` import still works. |
| `managed-only` | Managed instructions and auto memory load at startup. This is not a blanket ban on later on-demand subdirectory or path-scoped rules. |

Set **Project instructions** in `/config`. For a shared user settings file, merge this fragment into `~/.claude/settings.json`, preserving other settings:

```json
{
  "pluginConfigs": {
    "cc-plugin-agents-md@builtin": {
      "options": { "instructionFiles": "claude-md-and-agents-md" }
    }
  }
}
```

Before **v2.1.285**, the key is `agents-md@builtin`; v2.1.285 and later accept either ID. This option is read from user settings, `--settings`, or managed settings, **not project or local settings**. The change applies from the next message. Do not paste it into `.claude/settings.json` and assume the whole team now loads both files. [1]

Claude's native AGENTS support reads `AGENTS.md` and `.claude/AGENTS.md`, but not `AGENTS.override.md`, `AGENTS.local.md`, or files under `.agents/`. A nested AGENTS file can load when Claude reads a file there, provided that directory has no blocking CLAUDE file. This differs from Codex's override convention. Load order also does not make contradictory natural-language rules deterministic; remove the contradiction. [1] [2]

## Copyable templates

For a repository with `pnpm build` and `pnpm test` scripts, use this as the root `AGENTS.md`. Replace commands and generated-file paths to match the repository before adopting it:

```markdown
## Working agreements
- Use pnpm for Node dependencies and uv for Python dependencies.
- Preserve unrelated changes in the working tree.
- Edit source files; do not edit generated dist/ output.

## Verification
- After code changes, run pnpm test and pnpm build.
- If a check cannot run, report the command and blocker.
- Report changed behavior, checks performed, and remaining limitations.
```

In a neighboring root `CLAUDE.md`, put:

```markdown
@AGENTS.md

## Claude Code
- Before changing billing behavior, propose the affected cases and tests.
```

The article displays a code block so you can copy its contents. In the **actual file**, `@AGENTS.md` must be outside backticks and fenced code. A sentence saying "read AGENTS.md" is a request to the model, whereas `@AGENTS.md` is an import processed by Claude Code. Relative imports resolve from the importing file; `.claude/CLAUDE.md` would need `@../AGENTS.md`. Current import recursion is limited to four hops. Prefer the import to a symlink for teams with Windows users. [1]

## Verify what actually loaded

1. Run `claude --version` and `codex --version` in your terminal. Record the starting directory and relevant settings.
2. Start a fresh Claude session in the repository. Use `/context` to inspect **Memory files**, and `/memory` to locate AGENTS files. Before v2.1.280, directly loaded AGENTS files were absent from those lists; upgrade or use the import route to make diagnosis clearer.
3. Test a harmless, distinctive instruction in a scratch repository, such as "When asked for the verification label, reply `instruction-check-26`." Ask for that label without repeating it in your prompt. Check the loaded file path as well as the answer.
4. For a nested rule, ask Claude to read an ordinary file in that directory. Check the terminal's `Loaded` notice. A startup list alone cannot prove a lazily loaded file was missed.
5. In Codex, start a new run after edits and ask it to list instruction sources and summarize the verification commands. Compare the answer with the files and, when needed, the TUI log.

These checks separate discovery from behavior: a file can load correctly while a vague instruction is still followed inconsistently. For Claude, `InstructionsLoaded` hooks can trace CLAUDE imports and rules, but do **not** fire for AGENTS files read directly through the plugin. A missing hook event is therefore not proof that a native AGENTS file was skipped. [1] [2]

## Codex discovery

Codex builds its startup instruction chain from its home directory and from the project root down to the working directory. At each project directory it selects at most one non-empty file: `AGENTS.override.md`, then `AGENTS.md`, then configured fallback names. Deeper guidance comes later. The default combined budget is **32 KiB**, controlled by `project_doc_max_bytes`. This is not Claude's fallback algorithm. [2]

For a legacy repository containing only CLAUDE.md, merge this into `~/.codex/config.toml`:

```toml
project_doc_fallback_filenames = ["CLAUDE.md"]
```

Restart Codex. This makes CLAUDE.md a **fallback**, not an additional file beside AGENTS.md in the same directory. Do not assume Codex expands Claude's `@` imports. For mixed-tool projects, the shared AGENTS file above is easier to inspect than a chain of tool-specific fallback files. To test a nested directory:

```bash
codex --cd services/payments "List the active instruction sources and verification commands. Do not edit files."
```

Use an existing directory. The expected startup chain is the global file, the repository file, then any selected files along that path. Do not infer that all sibling packages loaded at startup. For deeper diagnosis, launch with `codex -c log_dir=./.codex-log` and inspect `codex-tui.log`; logs may contain private project context. [2]

## Why Bother

Why can two files containing identical instructions produce different results? The filename, working directory, client version, and configuration decide which text reaches the model. The quality of that text matters only after discovery succeeds.

The twelve sections below retain the broader discussion of context, memory, team workflows, and non-code repositories. My view is that a useful instruction file records decisions the agent cannot reliably infer from source code, then points to a way to verify the work. More rules do not compensate for missing evidence.

---

## 1. Three Files, Three Audiences: README.md vs CLAUDE.md vs AGENTS.md

Before any "file written for AI" can mature, the three files have to be cleanly separated.

**README.md** is for humans. The audience is the developer who just opened your repo for the first time. The goal is to get them to "what does this project do, how do I run it, how do I contribute" within five minutes. The voice is descriptive and a little promotional. The shape is the pyramid principle: **what → how → how to participate**.

**CLAUDE.md** supplies persistent instructions to Claude Code. A fresh context window does not mean an absence of memory: instruction files and auto memory can carry information across sessions. What belongs in the project file is operational knowledge such as verification commands, repository constraints, and decisions that the code does not explain. [1]

**AGENTS.md** is an open Markdown format stewarded by the Agentic AI Foundation under the Linux Foundation. It has no required fields or fixed schema. Tools can share its content while differing in discovery, configuration, and inheritance. Use the loading rules above for Claude Code and Codex instead of treating ecosystem adoption as a promise of identical behavior. [3]

The three files are complementary, not substitutes. README.md answers "what". CLAUDE.md and AGENTS.md answer "how". The first is a marketing page for humans; the others are an operations manual for machines.

A common failure mode is writing CLAUDE.md as a re-skin of README.md — pasting the project blurb, the architecture diagram, the Getting Started snippet. None of that is what the agent needs. The agent does not care about your project's value proposition; it cares whether the test command is `pnpm test` or `npm run test:unit`, whether codegen needs to run after edits, which directories are off-limits.

The second failure mode is treating CLAUDE.md as written-once. Anthropic's best practices put it bluntly: "**Treat CLAUDE.md like code: review it when things go wrong, prune it regularly.**" It is a living document, and its lifecycle is a code lifecycle.

---

## 2. Universal Best Practices: Length, Structure, Voice

### Length

This is the least controversial and most-often-violated dimension.

HumanLayer's *Writing a good CLAUDE.md*, credited to Kyle, recommends keeping the root instructions small and moving detail into separate documents. A large repository's line count is not a target for your project: its checks, directory structure, and instruction-loading budget differ.

Anthropic currently recommends fewer than 200 lines per CLAUDE.md file. That is guidance, not a measured universal instruction limit. Imports organize text but load with their parent; they do not save context by themselves. Move narrow rules to appropriate directories or path-scoped rules, then verify that they load when needed. [1]

### Structure

A workable CLAUDE.md tends to have:

1. **CRITICAL RULES** — the red lines. "Never push to main." "Never `rm -rf`."
2. **PROJECT CONTEXT** — stack, monorepo layout, key architectural decisions.
3. **BUILD & TEST COMMANDS** — concrete, copy-pasteable. Not "run the tests"; `pnpm test --watch=false`.
4. **CODE STYLE** — with examples. Not "keep code clean"; show a good and a bad snippet.
5. **FILE ORGANIZATION** — what lives where.
6. **VERIFICATION** — how to confirm the change did not regress something.
7. **COMMON PITFALLS** — accumulated over time, in event order.

The `vercel/vercel` AGENTS.md is instructive: it has a dedicated *Common Pitfalls* section collecting concrete bites — "no `console.log` in CLI packages", "do not skip CI hooks". `vercel-labs/open-agents` has its parallel *Lessons Learned*. Both implement the same idea: **convert one-time pain into long-lived rules.**

### Voice

Imperative, strong modals, concrete paths and commands. Write `ALWAYS run pnpm typecheck before claiming the task is done`, not "please verify code quality". Write `Never import from src/internal/*`, not "be careful with imports".

There is no universal compliance percentage that makes a Markdown rule safe to rely on. Use permissions, sandboxing, or a blocking hook when an action must be prevented. A reminder to avoid deployment can guide the model; a permission boundary determines whether deployment can happen. [1]

---

## 3. Eight Real Samples Worth Reading

Theory always loses to a real file. Eight samples worth opening:

**1. openai/codex** — 800 lines, partitioned by crate (`codex-core`, TUI style, TUI code, text wrapping, tests, snapshot tests, app-server API). The most valuable rule in the file is **"Resist adding code to codex-core."** A negative-intent rule like that beats "keep code simple" by a wide margin. The file also pins concrete numbers — 500 LoC target per file, 800 LoC hard split, `insta` for snapshots, `pretty_assertions` for deep equality.

**2. vercel/vercel** — 247 lines, a gold-standard monorepo template. Clean structure: Repository Structure / Essential Commands / Changesets / Code Style / Testing Patterns / Package Development / Runtime Packages / CLI Development / **Common Pitfalls**. The pitfalls section is a living trap-avoidance manual.

**3. openai/openai-agents-python** — 480 lines, and the interesting part is that instructions are written as **explicit skill invocations**: `$code-change-verification`, `$pr-draft-summary`. Runtime changes must call `$implementation-strategy` first. Doc-only and meta changes are allowed to skip full validation. It treats Markdown as a small DSL for workflow.

**4. vercel-labs/open-agents** — 280 lines, opening with "This is a living document. When you make a mistake, add it to Lessons Learned." That single line is a **self-evolution contract**: both agent and human are invited to append. Concrete rules include "quote `[id]` dynamic-route paths to dodge zsh globbing", "edits to `schema.ts` must generate a migration, never `db:push`".

**5. vercel-labs/agent-skills** — its single most important constraint is "**Keep SKILL.md under 500 lines**", with progressive disclosure for everything below.

**6. anthropics/anthropic-cookbook** — mandates `uv` for Python, mandates **model aliases** (`claude-sonnet-4-6`) over date-pinned IDs. Date-pinned IDs rot.

**7. karpathy/llm-council** — Karpathy's own vibe-coded project's CLAUDE.md. It records **not code style**, but project-level long-term memory and traps: "ReactMarkdown must be wrapped in `<div className="markdown-content">`", "chairman defaults to Gemini". This is what CLAUDE.md is supposed to look like.

**8. affaan-m/everything-claude-code (AgentShield)** — an anti-pattern scanner for CLAUDE.md, settings.json, and MCP configs. Five audit categories, fourteen secret-pattern detectors. Common anti-patterns it surfaces: hard-coded API keys in CLAUDE.md, expired model IDs, vague directives like "be careful".

The eight samples agree on one thing: **a good CLAUDE.md is a fossil layer of project decisions, not a textbook.**

---

## 4. Karpathy's Three Paradigm Shifts

If Anthropic's docs tell us *how* to write, Karpathy spent 2025-2026 redefining *why* we write it.

### Shift 1: Prompt Engineering → Context Engineering

On 25 June 2025, Tobi Lütke argued for "context engineering" over "prompt engineering". Karpathy publicly +1'd and added:

> "In every industrial-strength LLM application, context engineering is the delicate art and science of filling the context window."

The emphasis: **context is a system output, not a static string.** It is generated by a dynamic pipeline immediately before each main LLM call, varying by task. The counterintuitive consequence is that when you write CLAUDE.md, you are not authoring a prompt — you are authoring **a runtime variable in a system**. The variable has to interact with task, session, and time.

### Shift 2: Markdown as Source Code (`program.md`)

Karpathy's `autoresearch` repo (sibling to nanochat) uses an instruction file called **`program.md`** — not AGENTS.md, not CLAUDE.md. The working model is brutal but elegant:

> Humans iterate on `program.md`. The agent iterates on `.py`.

Markdown becomes the source. The agent is compiler and runtime. You no longer write Python; you write a natural-language specification, and the agent generates and refines code from it. This is the concrete shape of "Software 2.0" and "Software 3.0" he has been signaling for years.

Looking back at CLAUDE.md from this angle: it is not a config file. It is **the spec layer of your project's source**. Cutting it from 100 lines to 80 is refactoring.

### Shift 3: Goal-Driven Execution (Declarative > Imperative)

Karpathy's principles, as packaged in `forrestchang/andrej-karpathy-skills` (43k installs in a week), include this counterintuitive line:

> "LLMs are extremely good at looping until they hit a specific goal. Don't tell them how to do it. Give them success criteria and let them run."

Translated to project files: **do not write step-by-step instructions in CLAUDE.md. Write success criteria.** Not "read A, modify B, then run C", but "after the change, `pnpm test` must be green and `git diff` must contain no `console.log`." The latter lets the agent organize its own path. The former hits dead ends and stalls.

This inverts the classic engineering instinct of "draw the flowchart first". **In the agent era, a good spec is declarative.**

---

## 5. Mental Models from the Other Heavyweights

### Armin Ronacher: Logs as APIs, No Dead Ends

The Flask author has two posts that should be required reading: *Agentic Coding Recommendations* and *Agent Design Is Still Hard*. Two rules.

**Logs as APIs.** In debug mode, dump signup confirmation emails straight to stdout. CLAUDE.md tells the agent to read the logs. The agent then completes the entire "register → wait for email → extract link → click" flow on its own — **no human bridge needed**. The technique generalizes: any asynchronous side effect can be exposed to the agent through the same mechanism.

**No dead ends.** The image-generation tool must write into the same virtual filesystem the code-execution tool reads. The toolchain must form a closed loop. Otherwise the agent gets stuck in "I made the image but I cannot read it" paradoxes.

A subtler observation: Claude Code's `TodoWrite` is just an echo of the task list, but **dynamic re-injection beats one-time top-of-context placement**. Things at the top of the context window get diluted by attention; things re-injected after each tool call stay fresh.

### Geoffrey Huntley: stdlib, Ralph, Window Utilization

Geoffrey Huntley treats team conventions as **a programming language's standard library**. Rules live in `.cursor/rules/*.mdc` or `specs/stdlib/*.md`. He puts it bluntly:

> "You are programming the LLM, not using an IDE."

His **Ralph Wiggum technique** (named after the dim Simpsons character) takes this to its extreme:

```bash
while :; do cat PROMPT.md | npx --yes @anthropic-ai/claude-code-cli ...; done
```

One process, one repo, one task per loop. PROMPT.md is the coordination hub. He insists that **there is no perfect prompt** — those CURSED prompts copy-pasted from Hacker News do not work because they were evolved against specific LLM behavior in a specific context.

His core operational metric: **target 40-60% context window utilization**. Above that, output quality drops. The whole *advanced context engineering for coding agents* workflow is built around frequent, intentional compaction.

### Simon Willison: AGENTS.md for Runtime Anomalies

Simon Willison's `simonw/research` repo uses AGENTS.md specifically for **sandbox network limits**. The reminder generalizes: AGENTS.md should describe **runtime environment anomalies**, not just code conventions. If the agent will hit a blocked IP range or an unavailable port, write it down explicitly.

Also a longer-arc observation from him: the "write Markdown, have the agent read it first" pattern actually emerged in 2023 with ChatGPT Code Interpreter. CLAUDE.md is not new. It is a three-year-old pattern that finally got a name and a standard.

### Hamel Husain: Eval as Living PRD

Hamel Husain has a sentence that quietly embarrasses the entire eval industry: **a good eval prompt is itself a living PRD** — it tests AI behavior continuously, in real time. He pushes against putting prompts into LangSmith and similar "extra layer of indirection" platforms, and argues prompts belong in Git, versioned like any other software artifact.

The implication for CLAUDE.md: **CLAUDE.md itself needs evals**. How do you know "ALWAYS run typecheck" actually got executed? You need a repeatable test. Fireworks, LangChain, and MLflow are now building integrations for exactly this.

### Harrison Chase: Model / Harness / Context

Harrison Chase, on the Sequoia podcast, names three layers in any agent system: **Model / Harness / Context**. His thesis: **the Context layer is what product teams should invest in first.** Models keep improving. Harnesses commoditize. Only context is your private moat.

Translation to CLAUDE.md: **CLAUDE.md is a moat.** Not a config file. It is your team's institutional knowledge.

---

## 6. The Counterintuitive Patterns

The previous sections were about writing the file well. This section is about the file writing itself, and about coordinating multiple files.

### Darwinian Memory (claude-evolve)

`jack60810/claude-evolve` rates each rule from 0 to 10 and smooths it with EMA (30% new, 70% historical). Rules have three states:

- **active** — currently in use
- **dormant** — demoted but kept; environmental change might bring them back
- **dead** — actually deleted

When enough similar rules mature, they "graduate" into formal skill files under `.claude/skills/`. This is **rule lifecycle management**. Rules are no longer "write once, live forever". They are born, age, and die.

### Read/Write Separation (CLAUDE.md + MEMORY.md)

Claude Code separates maintained instructions from auto memory. Its memory index normally lives at `~/.claude/projects/<project>/memory/MEMORY.md`; startup reads the first **200 lines or 25 KB, whichever comes first**. A random repository-root MEMORY.md does not acquire that behavior from its name. [1]

Use auto memory for observations and preferences, and shared instructions for decisions the team has adopted. Details can live in topic files read on demand. Machine-local memory is not a reliable way to distribute repository policy to teammates. [1]

Check a remembered command against the current package scripts before running it. A note that was correct before a migration can become wrong without any change to the memory file.

### Auto Dream: Memory Hygiene

Treat automatic memory cleanup as an optional workflow, not a property you can assume from the filename. A useful maintenance task is to replace relative dates with known absolute dates, remove resolved workarounds, and link a remembered constraint to the decision that established it.

Memory needs hygiene. Memory is not an append-only log. It is **live data that requires continuous cleaning.**

### The Two-Strikes Rule

Anthropic lists a repeated mistake as one reason to add a rule, alongside review findings and information a new teammate needs. Waiting for a second occurrence is a useful filter for incidental failures, not a requirement to repeat a costly mistake before documenting it. [1]

An isolated failure can come from a temporary network problem or an incorrect command. Diagnose it before adding a permanent rule. Repetition makes a reusable lesson more likely, but severity and review evidence matter more than an arbitrary count.

### Subagents Are Context Control, Not Role Play

People reach for subagents to divide labor — one for frontend, one for backend. The deeper use is **context control**: spawn a subagent with a fresh window to do Glob/Grep/Read, have it return a summary, never let raw tool output pollute the main agent's context.

This is precisely why Claude Code's Agent tool returns "summaries" rather than "raw tool results" by default — to protect the main thread's context budget.

### Oracle Mode

Oracle mode exposes GPT as a tool to Sonnet (or vice versa), enabling cross-model function calls. CLAUDE.md declares: **"On architectural decisions, consult the oracle."** It gives the agent an external advisor — useful as a counterweight against the systematic biases of any single model.

### Anti-Sycophancy in Three Modes

Claude is known for over-affirming the user. The community has converged on three explicit modes:

- **Mode 1 — Challenge-First**: default to challenging the user's framing
- **Mode 2 — One-Question**: ask one clarifying question at a time
- **Mode 3 — Steel-Man**: argue back with the strongest counter-version of the user's proposal

The counterintuitive piece: not one persona, but **three explicitly summonable thinking modes**. CLAUDE.md says "default to Mode 1; switch to Mode 3 for high-stakes decisions."

### Path-Scoped Rules

In `.claude/rules/`, YAML `paths:` frontmatter scopes a rule to matching files. Putting a `paths:` heading into an ordinary AGENTS.md does not create that mechanism. Keep the root file short, put the component rule in a separate rules file, and exercise a matching file to test discovery. This reduces irrelevant loading; it does not make an oversized root CLAUDE.md free. [1]

### Versioned Changelog at the Top

A changelog can explain why a rule changed. Its heading does not trigger an automatic comparison with the previous session. If that comparison matters, ask for it explicitly or inspect the Git diff. Keep the current instruction readable without reconstructing its entire history.

---

## 7. The Team Engineering Layer

Solo best practices and team best practices are different problems. Scale up to five, fifty, or five hundred engineers and a new set of issues emerges: rule conflicts, version drift, compliance variance, and no way to measure ROI.

### AGENTS.md as a Cross-Tool Contract

A cross-tool contract needs both shared text and a tested loading path. The open format reduces duplicate writing, but tool-specific discovery still matters. A Claude import does not configure Codex, and a Codex override filename is not a Claude override. Publishing the file on a website does not configure a local coding session. [1] [2] [3]

For a mixed team, maintain common commands and constraints in AGENTS.md, with the explicit CLAUDE import shown above. Keep Claude-only instructions below that import. On clients configured for native both-file loading, check for contradictory rules rather than assuming the later file enforces a strict override. [1]

<span id="claudelocalmd-is-deprecated-use-imports"></span>

### CLAUDE.local.md remains supported and affects fallback

Current official documentation supports `CLAUDE.local.md` for personal project instructions. Add it to `.gitignore`. Its presence blocks default native AGENTS fallback, so retain the explicit import or enable both-file loading. An external `@path` import is an alternative for sharing personal instructions across worktrees, subject to approval and session restrictions. The current recursion limit is four hops. [1]

### Spec-Driven: Team-Level Agent OS

Late 2025 saw three spec-driven development camps emerge:

- **GitHub Spec Kit** — six phases (Constitution → Specify → Clarify → Plan → Tasks → Implement), each gated by a human, agent-agnostic.
- **BMAD-METHOD** (43k stars) — twelve-plus role agents (Analyst / PM / Architect / SM / Dev / QA), YAML-orchestrated handoffs, enterprise-scale multi-agent pipeline.
- **Kiro** (an AWS VS Code fork) — spec → design → tasks → impl baked into the IDE, with steering files (product.md / structure.md / tech.md) holding persistent context.

Martin Fowler's comparison piece is the canonical reference. His advice: **don't apply SDD to small bugs — that's a forklift cracking a walnut.** But for tasks that span modules, require multi-turn dialog, or need multi-person/multi-agent coordination, SDD prevents the gradual descent into chaos.

### Eval-Driven CLAUDE.md

Fireworks, LangChain, and MLflow are pushing a new pattern: **treat CLAUDE.md and SKILL.md as objects under test.**

1. Write a binary assertion suite. Run it in a clean Docker environment.
2. Mix LLM judges and rule-based judges: the former for behavior and ordering, the latter for side effects (was the file generated, was the command run).
3. Use MLflow to trace each Claude Code session. Use spans to verify "was this rule actually loaded?" — output alone cannot catch "prereq did not fire" failures.

MindStudio took it further: a self-modification loop where Claude Code rewrites its own CLAUDE.md until the assertion suite is fully green, with QUALITY.md tracking the baseline. CLAUDE.md gains an automated regression suite.

### Observability: Rule ROI

Traces, hooks, and command logs can show which checks actually ran. They do not prove every instruction influenced the model. Check the observation mechanism as well: native AGENTS loading does not emit `InstructionsLoaded`, while a CLAUDE import does. Compare file discovery, executed commands, and resulting artifacts instead of relying on the model's claim that it complied. [1]

### Meta-CLAUDE.md

`.claude/skills/meta/` holds a skill on **how to edit CLAUDE.md itself** — line caps, dead-link checks, the rule-tier convention. The next agent that wants to change rules reads the meta-skill first, then acts. This is the underlying pattern in Kiro steering and BMAD orchestrator: **rules above rules.**

### GitHub Squad's decisions.md

GitHub's Copilot team described their "Squad" workflow: each architectural decision gets appended as a structured block to a versioned `decisions.md` — an **asynchronous team brain**. Any agent making a new decision reads `decisions.md` first, avoiding rehashed debates and accidental policy reversals.

This is ADR (Architecture Decision Records) ported into the AI collaboration era.

---

## 8. Non-Code Repositories: PARA, Obsidian, Academic Writing

CLAUDE.md serves more than software. Writing, research, knowledge management, courses, blogs, papers — any knowledge work that benefits from agent assistance can use it.

### PARA / Obsidian Vaults

PARA (Projects / Areas / Resources / Archive) is Tiago Forte's PKM framework. A typical CLAUDE.md for an Obsidian PARA vault contains:

- **Vault semantics** — what each top-level folder means (Inbox is uncategorized; Projects have deadlines; Areas are ongoing; Resources are reference; Archive is frozen).
- **Frontmatter standards** — YAML field conventions: `title`, `date`, `tags`, `status`, `source`, `para-type`.
- **Triage decision tree** — how Claude classifies a new Inbox file into the four PARA quadrants.
- **Tone/voice** — diary vs research note vs project doc, each with its own register.
- **Weekly review workflow** — clearing Inbox into the four quadrants every Sunday.

Reference repos: `ballred/obsidian-claude-pkm` (a complete PARA starter kit), `AgriciDaniel/claude-obsidian` (a Karpathy-style LLM Wiki), and `danielrosehill/Claude-Code-Projects-Index` (a non-code use-case anthology).

Mauricio Gomes, in *Teaching Claude Code My Obsidian Vault*, leaves a useful warning: **review and update the vault's CLAUDE.md monthly**. Otherwise it rots as the vault evolves.

### Academic Writing

Three repos define the academic-writing playbook: K-Dense-AI/claude-scientific-writer, Galaxy-Dawn/claude-scholar, and Imbad0202/academic-research-skills. Recurring patterns:

- **Style calibration** — feed three of your old papers so Claude internalizes voice and citation habits.
- **Priority** — discipline conventions > journal style > personal preference.
- **Citation red lines** — explicit "never use unverified citations"; claim-citation alignment checks; no hallucinated BibTeX entries.
- **AI-use disclosure** — declare in Methods what Claude was used for.
- **Writing quality check** — banned-word lists (twenty-five AI-tell-tale words), em-dashes ≤ 3, sentence-length burstiness checks.

### Blog and Content Repos

GitHub Blog's *How to write a great agents.md* — distilling lessons from 2,500 repos — finds these patterns recur:

- Strong modal verbs: ALWAYS / NEVER / MUST.
- Explicit Personality block (Tone / Style / Voice).
- Output format templates (H1 / meta / H2 sections / CTA / tags).
- Vocabulary white/black-lists ("challenge" replaces "problem").

HumanLayer recommends a blog AGENTS.md under 60 lines. Community ceiling: under 300.

---

## 9. The Chinese Community Lens

Chinese developers write CLAUDE.md with the same shape but with two unique twists.

**The "800-character" anchor.** A Zhihu author's careful experiment — 3,000 → 1,000 helps; → 800 is best; → 400 loses critical info — converts cleanly to the 60-250 line range from English-language sources.

**Four-tool fragmentation** is the pain Chinese developers face most acutely: Cursor + Claude Code + **Trae** (ByteDance) + **通义灵码** (Alibaba) all need configuration. Repos like `Mr-chen-05/rules-2.1-optimized` exist precisely to one-shot sync rules across Augment / Cursor / Claude Code / Trae.

**Bilingual skill structures**: `hong111109/humanizer` separates `zh/` and `en/` subdirectories, auto-detecting input language. A pattern that exists almost exclusively in the Chinese ecosystem.

**"Use Chinese for replies"** is a near-standard line in nearly every Chinese developer's global CLAUDE.md — together with toolchain preferences ("Python uses uv; Node uses pnpm"). Pragmatic, terse, and load-bearing.

**Baoyu (@dotey)** is the most-followed Chinese AI-coding voice. He recently spotlighted `shareAI-lab/learn-claude-code` — **30 lines of code that reproduce a nano Claude Code**, helping developers see through the harness. Another of his lines: "Vibe Coding is not magic." Make it work by hand first; iterate in small versions (scooter → bicycle → motorcycle → car). The metaphor maps neatly onto CLAUDE.md evolution: **rough first, refined later**, never expecting perfection in one shot.

**WeChat publishing pipelines** — capturing trending topics, drafting, formatting, pushing to draft inbox — are a non-code use case with virtually no parallel in the English-speaking world. See `oaker-io/wewrite` and `geekjourneyx/md2wechat-skill`.

---

## 10. The Practical Checklist

Take everything above and make it actionable.

### Global `~/.claude/CLAUDE.md`

Keep it minimal. Only **cross-project preferences**:

1. Language ("Use Chinese for replies").
2. Package manager defaults ("Python uses uv; Node uses pnpm").
3. Privacy ("All pushed repos default to private").
4. Collaboration baselines ("Interaction-detail changes require corresponding e2e tests").
5. Maintenance ("Review recurring failures and remove obsolete workarounds").

Target line count: **under 10**. This file loads on every session. Shorter is better.

### Vault Root `CLAUDE.md`

For an Obsidian-style PARA vault, include:

1. PARA semantics + classification decision tree.
2. Frontmatter standards (title / date / tags / status / source).
3. Language priority (Chinese first; preserve original quotes).
4. No emoji (consistent with global rule).
5. Weekly Inbox-clearing workflow.

### Code Project `AGENTS.md` + `CLAUDE.md`

For a backend repo:

- `AGENTS.md` is the main file: build commands, test commands, code style, common pitfalls, lessons learned.
- `CLAUDE.md` contains the actual `@AGENTS.md` import, outside a code fence, with any Claude-only instructions below it.
- `.agents/decisions.md` versions architectural decisions.
- `.claude/skills/meta/claude-md-editing.md` formalizes how to edit CLAUDE.md itself.

### Adopt the Two-Strikes Rule

For an incidental failure, record the observation and check whether it recurs before adding a permanent rule. For a known damaging action or a review finding, document the constraint immediately. Put team policy in the shared file rather than relying on one developer's auto memory.

### Oracle Mode (Optional)

For high-stakes architecture decisions, have Claude consult GPT. Declare the trigger in AGENTS.md:

> When deciding on system architecture that affects > 3 modules, consult the GPT oracle via the `oracle` tool, and record the exchange in `decisions.md`.

### Anti-Pattern Checklist

- ✗ Stuffing CLAUDE.md as if it were documentation (every line costs context every turn).
- ✗ Hard-coding API keys or expired model IDs (`claude-3-opus`).
- ✗ Scenario-specific rules ("how to design a new orders schema" — useless when you are not working on orders).
- ✗ Repeating the README's project description.
- ✗ Vague verbs ("be careful", "be nice").
- ✓ Review and prune monthly.
- ✓ Rules have a lifecycle: active / dormant / dead.
- ✓ Failures into pitfalls; successes into lessons learned.

---

## 11. Predictions for 2026

If 2025 was the inception year for files-written-for-AI, what does 2026 look like? Three loosely-held but directionally-confident guesses.

**One: CLAUDE.md fragments into layered files.** Just as code fragmented from "one file" into "source + config + tests + migrations", CLAUDE.md will split into persona / rules / memory / decisions / pitfalls — five layers, each with its own lifecycle and maintenance cadence.

**Two: rules get formally versioned and signed.** Like Docker images with tags and hashes, future AGENTS.md will carry semver and checksums. "This agent decision was made under AGENTS.md v2.3.1" becomes auditable. Critical for compliance domains — finance, medical.

**Three: a marketplace for CLAUDE.md emerges.** `awesome-claude-code` and `aitmpl.com` are the free-sharing layer today. Next: paid AGENTS.md packs targeting specific stacks — Stripe integrations, Supabase, Next.js + Drizzle + Clerk — required like npm packages.

---

## 12. Closing: From Prompt to Context, From File to System

Record decisions the model cannot infer reliably, keep the loading path inspectable, and test the resulting work. Before adding more layers, check whether the necessary instructions load from the directories your team actually uses.

Put shared content in AGENTS.md and Claude-specific content in CLAUDE.md. After a client upgrade, a personal configuration change, or a move to another worktree, verify discovery again. Maintain the instructions together with the environment that executes them.

---

## References

[1]: https://code.claude.com/docs/en/memory "Claude Code memory, loading, imports, and version boundaries"
[2]: https://developers.openai.com/codex/guides/agents-md/ "Official Codex instruction discovery"
[3]: https://agents.md/ "AGENTS.md open format"

- [1. Claude Code memory and AGENTS.md loading](https://code.claude.com/docs/en/memory)
- [2. Codex custom instructions and fallback filenames](https://developers.openai.com/codex/guides/agents-md/)
- [3. AGENTS.md format and FAQ](https://agents.md/)

- [agents.md — official site](https://agents.md/)
- [Anthropic Claude Code Best Practices](https://code.claude.com/docs/en/best-practices)
- [HumanLayer: Writing a good CLAUDE.md](https://www.humanlayer.dev/blog/writing-a-good-claude-md)
- [Karpathy on context engineering (X)](https://x.com/karpathy/status/1937902205765607626)
- [karpathy/autoresearch — program.md paradigm](https://github.com/karpathy/autoresearch)
- [karpathy/llm-council CLAUDE.md](https://github.com/karpathy/llm-council/blob/master/CLAUDE.md)
- [forrestchang/andrej-karpathy-skills](https://github.com/forrestchang/andrej-karpathy-skills)
- [Armin Ronacher — Agentic Coding Recommendations](https://lucumr.pocoo.org/2025/6/12/agentic-coding/)
- [Geoffrey Huntley — stdlib](https://ghuntley.com/stdlib/) and [Ralph](https://ghuntley.com/ralph/)
- [Simon Willison — async code research](https://simonwillison.net/2025/Nov/6/async-code-research/)
- [Hamel Husain — Evals Skills for Coding Agents](https://hamel.dev/blog/posts/evals-skills/)
- [Harrison Chase on Context Engineering (Sequoia)](https://sequoiacap.com/podcast/context-engineering-our-way-to-long-horizon-agents-langchains-harrison-chase/)
- [jack60810/claude-evolve](https://github.com/jack60810/claude-evolve)
- [Martin Fowler — SDD Tools Comparison](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html)
- [GitHub Spec Kit](https://github.com/github/spec-kit)
- [BMAD-METHOD](https://github.com/bmadcode/BMAD-METHOD)
- [GitHub Blog — How Squad coordinates AI agents](https://github.blog/ai-and-ml/github-copilot/how-squad-runs-coordinated-ai-agents-inside-your-repository/)
- [ballred/obsidian-claude-pkm](https://github.com/ballred/obsidian-claude-pkm)
- [Mr-chen-05/rules-2.1-optimized](https://github.com/Mr-chen-05/rules-2.1-optimized)
- [Baoyu: shareAI-lab/learn-claude-code](https://github.com/shareAI-lab/learn-claude-code)
