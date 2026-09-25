---
title: "Strands Harness: Productizing Agent-Loop Control as a Shippable SDK"
description: "A source-checked read of Strands harness and the Harness SDK—how they turn context management, sessions, tool gates, and loop control into a product—plus a selection checklist against ECC, Growing Harness, and Claude Code harness."
pubDate: 2026-09-25T00:00:00+08:00
author: "Remy"
tags: ["agent-harness", "ai-agents", "LLM", "developer-tools", "agent-loop", "SDK"]
lang: "en"
---

For the past year, the default move when a team “builds an agent” has often been: swap orchestration frameworks, stack another prompt layer, wire a few MCP servers. Demos run. Production stalls on the same class of problems—when to compress context, when a tool must wait for a human, how sessions resume, how failures avoid looking like success. Those are not “does the model think well?” questions. They are questions about whether **agent-loop control has been productized**.

[Strands Agents](https://github.com/strands-agents/harness-sdk) made that line unusually explicit around **2026-09-21**: ship an assembled **Strands harness** (`pip install strands-harness` / `npm install @strands-agents/harness`) while positioning the underlying **Strands Harness SDK** as the layer you reach for when you would otherwise hand-roll an agent loop. The product blog even leads with a cost claim—roughly **28% lower token cost** versus several popular harnesses on the same Claude/GPT models (attribution and caveats below). As of **2026-09-25** (Asia/Shanghai), the GitHub API showed the monorepo `strands-agents/harness-sdk` at about **8,273** stars under **Apache-2.0**; PyPI listed `strands-harness` **0.1.2** and `strands-agents` **1.57.0**. Stars measure attention, not quality. Numbers below are tagged to sources; we do not invent scores we did not open.

This site already has a harness deep-dive line: [Inside Claude Code’s agent harness](/blog/inside-claude-code-agent-harness/) for the five production layers around a loop; [ECC](/blog/ecc-agent-harness-optimization/) for a verifiable optimization OS around existing coding agents; [Grow the harness, not the context](/blog/grow-the-harness-not-the-context/) for sinking repeated control into executable code. This post places an **explicit harness product** on the same map. What it sells is not another multi-agent demo framework, but a deliverable: installable defaults, overridable configuration, and a path from CLI prototype to container deploy. Skills distribution—see [Cloudflare’s security-audit-skill](/blog/cloudflare-security-audit-skill-for-coding-agents/)—is the vertical capability pack; Strands is the factory and SDK those packs hang on.

## Why an explicit harness product is worth a long post now

Textbook ReAct fits on a slide: reason, act, observe, repeat, stop. The [Claude Code harness](/blog/inside-claude-code-agent-harness/) piece already argued that what keeps an agent alive in production is context compression, streaming execution, error recovery, permissions, and interruption—the harness. The industry gap is that most teams still treat harness work as **private glue**: no versioned defaults, no comparable cost/accuracy claims, no “one factory call to run, then override field by field” product path.

Framework waves solve a different problem: graph orchestration, role split, tool registration. Useful—but when enterprise requirements hit, the missing pieces are usually:

1. **Whether context economics are correct by default** — truncate/offload large tool results, when to summarize, how to recover from overflow.
2. **Whether control is structural or prompt persuasion** — can a destructive action talk its way past “please ask a human first.”
3. **Where audit evidence lives** — only in model traces, or also in graph state / code paths.
4. **Whether prototype and deploy are the same object** — can a CLI-tuned config `/export` into code that belongs in the repo.

Strands’ product story sits on those four points: the assembled harness ships benchmarked context defaults; the SDK ships lifecycle controls, hooks, guardrails, sessions, and evals; the CLI makes “chat then export” a path. Versus stacking frameworks and prompts, the difference is not branding. It is whether **defaults can be pinned by benchmarks and a configuration table**.

## What Strands actually ships: product layer vs SDK layer

Checking the [repo README](https://github.com/strands-agents/harness-sdk), the [official announcement](https://strandsagents.com/blog/introducing-strands-harness/), and the [Harness docs](https://strandsagents.com/docs/user-guide/harness/), the monorepo splits cleanly into two layers (the names blur—nail them first):

| Layer | Packages (docs / PyPI / npm) | What you get |
| --- | --- | --- |
| **Strands harness (assembled product)** | Python `strands-harness`; TS `@strands-agents/harness`; CLI `@strands-agents/cli` | `create_harness()` / `createHarness()`: a general-purpose agent with benchmarked defaults (not coding-only) |
| **Strands Harness SDK (control plane)** | Python `strands-agents`; TS `@strands-agents/sdk` | Agent loop, model providers, tools/MCP, multi-agent patterns, memory/session, streaming, guardrails, tracing, evals |

The README’s positioning is blunt: **choose Strands when you would otherwise write your own agent loop**. It runs in your process with no hosted control plane; it covers the jobs a hand-rolled loop grows into. The assembled harness sits on the SDK; the return value is a plain `strands.Agent` with no hidden wrapper. Every default is overridable, and you can replace down to the SDK.

### What the assembled harness includes out of the box

From “What the default harness does” and the configuration reference, documented defaults include:

- **Model portability**: Amazon Bedrock (documented default), Anthropic, OpenAI, Google, Ollama, LiteLLM; a shared `effort` knob maps reasoning intensity (`auto` / `low` / `medium` / `high`, etc., subject to provider support).
- **A tuned system contract**: explore before changing things, confirm before irreversible actions, verify before finishing (documentation claim—not a legal-grade policy engine).
- **Built-in tools**: shell, `read` / `write` / `edit`, web (`web_fetch` / `web_search`), `programmatic_tool_caller` (orchestrate other tools in code), `subagent` (delegate open-ended subtasks).
- **Context and caching**: `caching="auto"`; `context_manager="auto"` offloads/summarizes bulky tool results and caches reusable request prefixes where the provider supports it.
- **Sessions and long-term memory**: conversations can persist on disk (docs cite `./.agent/sessions`); pass a `session.id` to resume; `memory` can distill facts across runs.
- **Built-in plugins**: default `todos` and `environment`; Agent Skills loading (default scan `./.agent/skills`).
- **Interventions**: gate tool calls behind approval or policy (`ask` / `smart` / policy string / Cedar file—see docs).

The product blog also publishes concrete context thresholds (still **vendor self-measurement**, not our re-run): tool results over roughly **1,500** tokens get truncated/offloaded; summarization (compaction) triggers above about **85%** of the context window; context recovery runs inside the loop on overflow. Strands attributes most of the same-model **~28% lower cost with equal-or-better accuracy** versus Claude Code, Codex, and other popular harnesses to these defaults. The test setup is described as distributed benchmarking on EC2 with Harbor. A sharper comparison: with **Fable 5**, cost was about **77% lower** than Claude Code with a higher Terminal Bench 2.1 score. Deepseek Harness is described as the most token-efficient overall but typically the lowest accuracy. A follow-up paper is promised; until then treat the percentages as **announcement claims**, not procurement SLAs.

### What the SDK control plane adds

When you want to own the loop, the SDK README lists: lifecycle controls (turn limits, token budgets, cancellation, stop reasons), tools and structured output, MCP, multi-agent patterns, memory and sessions, model portability, streaming, guardrails, tracing, and evals. Hooks intercept steps for logging, validation, or redirection; steering handlers are described as helping agents correct themselves instead of failing silently. Production docs point at containerized deploy paths; the announcement lists Modal, Cloudflare Containers, Azure Container Apps, Cloud Run, ECS, Bedrock AgentCore, and similar “Linux container” targets.

One-line split: **the harness product sells good defaults you can override; the SDK sells the full loop-control surface you would eventually build yourself.** The CLI is a third on-ramp: configure interactively, `/export` to Python/TypeScript, and connect “it chats” to “it ships in CI.”

## When enterprise requirements hit: what a 45-run bakeoff actually shows

[sunnydachs’ Dev.to write-up](https://dev.to/sunnydachs/what-happens-when-enterprise-requirements-hit-strands-langgraph-and-crewai-45-runs-measured-ocg) is not an official Strands benchmark. It is a third-party study using one recorder proxy, one model, and the same tools across **human approval gates, audit-trail reconstruction, and structured output** (45 runs in that article; the companion repo claims a larger total). It compares **three control-flow philosophies**—Strands, LangGraph, CrewAI—not “who is smarter.” Cite it with the author’s own limits: **one model, about three runs per cell, directional not definitive; scripted humans; simulated destructive actions.**

Checkable contrasts:

| Concern | LangGraph (as implemented) | CrewAI (as implemented) | Strands (model-driven loop) |
| --- | --- | --- | --- |
| Human approval | `interrupt()` suspends the graph; `Command(resume=...)` continues; reject routes via edge conditions—**structure enforces** the gate | `Task(human_input=True)`; rejects often re-run the task | Mostly prompt-only “ask before publish”; order can hold, but one run **double-fired** the same publish after approval |
| Audit readability | Rationale 100% in their scoring; tool order/args **0%** on the framework-level trace (tools invoked in code, not on the wire) | Rationale 100%; tool order/args ~50% | Rationale and tool order/args 100%—strongest audit story, paired with silent-failure risk |
| Scariest failure shape | Structurally hard to emit “success with empty deliverable” | Mis-handled rejection feedback can spin (one case: 131 LLM calls) | **Exit 0 with empty final output** (three times): the full result lived in a validator tool argument; runners that only check exit status miss it |

For enterprise selection, the durable lessons are not “avoid Strands.” They are:

1. **Gates for destructive actions must live in structure or at the execution boundary**—graph edges, interrupts, idempotency keys, approval operation IDs. Prompt-only gates fail on the run that is confident and wrong.
2. **Model-driven loops’ audit strength and silent failures are the same coin**: traces are rich; success-shaped emptiness is stealthy. Application contracts need non-empty deliverables and operation dedup.
3. **Evidence location differs**: some frameworks keep tool calls in code paths—reading code explains order; reading only the trace does not. Compliance design starts by asking which layer an auditor opens.

Boundary note: the bakeoff measures **model-driven Strands framework behavior**. It does **not** re-measure the assembled harness’s 28% cost claim. Same product-line philosophy, different evidence tiers—do not mash them into one score.

## Mechanism map against three in-site harness posts

Placing Strands on the existing coordinate system beats another feature laundry list.

| Dimension | [Claude Code harness](/blog/inside-claude-code-agent-harness/) | [ECC](/blog/ecc-agent-harness-optimization/) | [Growing Harness](/blog/grow-the-harness-not-the-context/) | **Strands harness / SDK** |
| --- | --- | --- | --- | --- |
| Problem statement | Textbook loops lack production layers | Verifiable optimization OS around existing coding agents | Stop re-inventing control in every trajectory | Stop hand-rolling the whole loop; ship deployable defaults |
| Persistence object | Runtime loop + compression pipeline (source-level) | Skills/Hooks/Instincts/Memory Vault config assets | **Executable harness programs** grown from failure windows | Factory defaults + overridable config + plain `Agent` objects |
| Context strategy | Multi-stage compact (budget/snip/micro/auto) | SessionStart caps, instinct gates, earlier compact habits | Sink stable control out of context | ~1,500-token tool offload, ~85% summarization, caching (announcement/docs) |
| Safety / governance | Permissions and interrupts inside the loop | AgentShield, GateGuard, hooks outside the model | Success-first transactional rollback | `interventions`, guardrails, hooks—you still design structural gates |
| Growth mode | Product evolution | Humans install/configure a horizontal OS | Task feedback grows code | Humans override defaults → drop to SDK; load Skills |
| Best fit | Teams dissecting production loops | Teams locked to Claude Code/Codex/Cursor | Stable task families amortizing control cost | Teams needing a general agent runtime, multi-model, CLI→container |

Working claims for a team memo:

- **Versus the Claude Code harness anatomy**: Strands productizes many of those “five layers” as an installable package. You buy industrial defaults you can override—not a line-by-line replacement for `query.ts`. If your moat is a deeply custom compression/permission state machine, the SDK layer matters more; the assembled layer is a starting point.
- **Versus ECC**: ECC assumes you already run Claude Code/Codex/Cursor and adds Skills/Hooks/memory/security scanning around them. Strands assumes you may need a **general (not coding-only)** agent from scratch, with optional Skills loading. Vertical skills (including Cloudflare-style packs) can land under `./.agent/skills`. ECC is closer to a multi-harness operations system; Strands is closer to an embeddable runtime plus assembled defaults.
- **Versus Growing Harness**: the paper grows control into code from failure feedback; Strands ships a written control default set you override or deepen. One learns controllers; one ships controllers. Mature teams often want both: get an observable loop quickly with Strands, then decide which branches should harden into owned code (Growing Harness spirit) instead of living forever as prompts.

## Selection checklist: when to take an SDK-grade harness, when to keep building

Decision questions—not brand loyalty.

### Signals that favor Strands harness (assembled layer)

1. You were about to write (or already maintain) a private agent loop whose needs land on multi-model support, tools+MCP, session resume, context offload, sub-agents, and basic observability.
2. The workload is a **general agent** (research, ops assistant, internal knowledge work), not a hard dependency on one coding-IDE extension ecosystem.
3. You want defaults explainable from a config table: every `create_harness(...)` field has a documented default and an off switch.
4. You need CLI → `/export` → repo as one object, not a permanent fork between “chat config” and “prod config.”
5. Deploy targets are self-managed Linux containers/functions; you accept an in-process runtime and do not need a vendor-hosted control plane.

### Signals that favor continuing to self-build or choosing graph orchestration (LangGraph-class)

1. **Destructive actions must be structurally enforced**: money movement, publish, drop-database, outbound send—gates belong on edges/interrupts/workflow engines, not only in “please ask first” system text.
2. Compliance needs tool order and arguments in **fixed-schema business events**, not only model traces; you must define operation IDs, idempotency keys, and retention yourself.
3. Control flow is mostly a deterministic state machine with the model filling slots—graphs/workflows express that more directly.
4. You are deeply bound to Claude Code/Cursor and the pain is token/memory/security scanning—[ECC](/blog/ecc-agent-harness-optimization/)-style outer OS may be cheaper than swapping runtimes.
5. Task families are highly repetitive and control has stabilized—per [Growing Harness](/blog/grow-the-harness-not-the-context/), sinking control into code often beats forever calling “smart defaults.”

### Boundaries to add immediately if you adopt Strands

1. **Treat the official 28% / 77% cost figures as hypotheses, not SLAs**—re-run on your task set with the same model. The announcement itself points to a follow-up paper.
2. **Idempotency at the execution boundary**: operation IDs on publish/delete/pay tools; prevent double-fire (the bakeoff already demonstrated it).
3. **Runner contracts**: beyond exit codes, check non-empty deliverables, critical file hashes, or business receipts—catch “exit 0 + empty final answer.”
4. **`interventions` ≠ structural gates**: test approval UX, timeouts, and resume after process death as production workflows—not only “did the model comply.”
5. **Cap Skills and MCP count**: same lesson as ECC/Claude Code—tool descriptions eat context; strong assembled defaults cannot save you from fifty MCP servers.
6. **Separate session from memory**: docs distinguish conversation resume from long-term fact distillation; do not mix “remember user preferences” with “restore half-finished task state” under one directory policy.
7. **Bound sub-agent depth and permissions**: delegation is on by default; narrow high-privilege tools so child loops do not enlarge blast radius.

### A two-week minimal validation

1. Same model, same task set: bare SDK loop / `create_harness()` defaults / your current framework. Record only **success criteria, tokens, empty-output rate, double-fire rate**.
2. One real destructive action: prompt-only gate vs `interventions`/external approval. Check whether reject paths are bypassable.
3. Turn on tracing and run an “auditor reads only the trace” drill: can you reconstruct rationale, tool order, args, model identity—bakeoff scoring as a method, not as scores to copy.
4. If cost-sensitive, A/B context management (`context_manager` / caching) alone and confirm offload/summary did not destroy critical intermediate state.


## Reading the factory as a control-plane contract

Do not select on stars alone. Treat `create_harness(...)` as a **control-plane contract**: each argument answers which slice of loop infrastructure is owned by default. From the [configuration reference](https://strandsagents.com/docs/user-guide/harness/reference/configuration/) and the `harness-py` README, at least these deserve an explicit team sign-off:

| Argument (Python) | Default (docs) | What you are actually buying | What to think when you change it |
| --- | --- | --- | --- |
| `model` / `effort` | Frontier model on Bedrock; `effort="auto"` | Provider abstraction + one dial for reasoning intensity | Passing a raw `Model` instance can ignore some factory knobs (with a warning) |
| `builtin_tools` | shell/read-write-edit/web/programmatic_tool_caller/subagent | Primitive tools models already know, not one bespoke tool per task | A list **pins** the set; a mapping is for “defaults minus one”; privilege grows with the tool surface |
| `caching` / `context_manager` | both `"auto"` | Primary knobs for cost and long-task coherence | Turning context management off also disables offloading; summaries can eat critical mid-state |
| `session` / `memory` | sessions may persist; memory can be on | Resume vs cross-run fact distillation | Directory policy, retention, whether secrets land in memory files |
| `skills` | scan `./.agent/skills` | Hook into the Agent Skills ecosystem | Skill descriptions consume context—budget them like MCP servers |
| `interventions` | none | Pre-tool approval / policy gate | Not the same as graph-edge enforcement; test crash-resume and timeouts |
| `builtin_plugins` | `todos`, `environment` | Checklist + environment metadata | Use `[]` when you do not want implicit behavior |
| `background_tasks` | docs default allows background for compatible tools | Async completion policy for tools/subtasks | Do not blindly disable `wait_for_completion` unless your app re-invokes |

`instructions` appends a domain block; it does not replace the full system contract unless you pass an explicit `system_prompt` (passthrough wins). That matters: many teams believe “another system prompt” means they own the harness, while the default contract still runs. The right move is to understand what exported pieces like `HARNESS_CONTRACT` / `build_system_prompt` constrain, then choose append-via-`instructions` versus dropping to the SDK.

Sub-agents inherit interventions and hooks by default (docs stress that approval gates should reach delegates). That is a real reason to buy the assembled layer versus wiring two agents by hand: a child loop should not silently bypass the parent gate. Conversely, plugins that keep per-agent state on `self` instead of `agent.state` will share mutable state across parent and child—an operational footgun, not a theoretical one.

## How to read the cost numbers: announcement, bakeoff, in-house eval

The common failure mode in public discussion is collapsing three evidence tiers into “Strands is 28% cheaper.” Keep them stacked:

1. **Vendor announcement** ([Introducing Strands harness](https://strandsagents.com/blog/introducing-strands-harness/)): same Claude/GPT models, six benchmarks, versus Claude Code/Codex-class harnesses; claims ~**28%** lower cost with equal-or-better accuracy; Fable 5 versus Claude Code ~**77%** cheaper with a higher Terminal Bench 2.1 score; setup described as EC2 + Harbor. Use: form hypotheses and motivate context defaults.
2. **Third-party enterprise-constraint layer** ([45-run bakeoff](https://dev.to/sunnydachs/what-happens-when-enterprise-requirements-hit-strands-langgraph-and-crewai-45-runs-measured-ocg)): not a token leaderboard—failure shapes under approval, audit, and structured output. Use: design gates and runner contracts.
3. **In-house task layer**: the only tier that belongs in a budget meeting. Fix at least four columns—task success definition, tokens, empty-final-output rate, destructive double-fire rate—then decide whether to switch runtimes.

On this site, [ECC](/blog/ecc-agent-harness-optimization/) frames “performance” first as token/context quality, not a mystery accelerator; [Growing Harness](/blog/grow-the-harness-not-the-context/) shows call-count and cost drops when control sinks into code. Strands’ announcement takes a third path: **encode industrial defaults into a product, then claim those defaults win on public benches.** The three paths can stack: Strands defaults to ship, ECC-style budgets for Skills/MCP, Growing Harness hardening for stable task families.

## One more fork versus “just stack a framework”

If your pain is “how roles split and how the graph is drawn,” LangGraph/CrewAI-class tools still fit. If your pain is “how the loop survives long tasks, multi-model, and CLI-to-container,” an explicit harness product fits better. If your pain is “regulated actions must not depend on model compliance,” you need **structural enforcement plus execution-boundary idempotency**—framework brand is secondary. The bakeoff’s LangGraph `interrupt()` versus Strands double-fire writes that sentence clearly.

Internal one-liner: **orchestration shapes collaboration; harness keeps the loop alive; governance defines boundaries the model cannot talk past.** Strands productizes entry points for the latter two—it does not finish your workflow modeling or legal audit schema.

## Closing

Agent competition is shifting from “who can call tools” to “who ships loop control as versioned defaults—and who admits how model-driven loops and structural gates fail differently.” Strands’ contribution is moving harness from a slogan into an **installable product layer plus a deepen-able SDK**. The engineering discipline that still compounds: defaults must be measurable, gates must live where the model cannot talk past them, and success must look like success.
