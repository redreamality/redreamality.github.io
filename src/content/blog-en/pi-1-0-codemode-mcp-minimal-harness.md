---
title: "Pi 1.0: Folding MCP into Codemode—a Minimal Coding-Agent Harness"
description: "Reading Earendil’s Pi 1.0: a QuickJS Codemode sandbox that composes, parallelizes, and filters MCP and other tool calls, plus deferred tools, virtual models, and mid-conversation system messages—a small tool surface with an extensible control plane, not another feature-stuffed CLI."
pubDate: 2026-10-03T10:40:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "developer-tools"]
lang: "en"
---

Almost every week brings another coding-agent CLI. Most launch posts rhyme: more model backends, more built-in modes, another “smarter” default workflow. Earendil’s [Pi 1.0](https://earendil.com/posts/pi-1-0/) post on 2026-10-01 takes a different bet. They keep calling Pi a **minimal, extensible agent harness**: by default it skips sub-agents and plan mode, and leaves “how you want to work” to extensions, skills, templates, and packages. What 1.0 actually hardens into the core is a control plane that makes MCP usable inside a *small* harness: **Codemode** (the model writes JavaScript that runs in a QuickJS sandbox to compose, parallelize, and filter tool calls), plus deferred tool loading, virtual models, mid-conversation system messages, and Anthropic-side cache warming.[1][2]

The Pi 1.0 thread drew heavy Hacker News engagement (Algolia search showed roughly **1645** points / **575** comments as of about 2026-10-03), but scoreboards do not explain the mechanism. The more useful primary source is their *[You Said No MCP!](https://earendil.com/posts/you-said-no-mcp/)* note two days earlier: pi.dev once proudly said Pi did not support MCP; podcasts repeated dismissals; MCP is now core. The pivot is not “protocol FOMO.” They found that **to use modern deferred tools and mid-conversation system messages well, the tool loadout needs exposure metadata—and Codemode needs the same metadata.** Bringing MCP into core upgrades that loadout surface.[3]

This site already has a harness thread: [Strands](/blog/strands-harness-sdk-production-agent-runtime/) on productizing loop control as an SDK; [OpenShell / Sentry](/blog/nvidia-open-agent-safety-openshell-sentry/) on moving sandbox policy outside the harness; [CIR](/blog/cir-causal-evaluation-harness-recovery/) on evaluating recovery as a causal decision; [MoMHa](/blog/momha-multi-objective-harness-accuracy-safety-tokens/) and [Grow the Harness](/blog/grow-the-harness-not-the-context/) on multi-objective search and growing the periphery before stacking context. Pi 1.0 fills another cell: **under a deliberately thin default feature set, how a JS orchestration sandbox turns MCP from “dump tool descriptions into context” into composable, OpenAPI-like discovery plus structured results.**[1][3]

The rest of this piece follows the mechanism: default discipline and an honest permission story; why MCP entered core; Codemode’s sandbox boundaries, discovery, and session state; then deferred tools, virtual models, and mid-conversation system messages; ending in a checklist you can port to a home-grown stack. Numbers and behaviors are taken from Earendil posts and pi.dev docs—no invented star counts or benchmarks.[1][2][3][5]

## A minimal harness is not a toy with fewer buttons

Pi’s self-description is clean: *a minimal, extensible agent harness that you can make your own*. The README is explicit: strong defaults, but **no** built-in sub-agents or plan mode. Customize with extensions, skills, prompt templates, and themes; ship them as Pi packages via npm or git. Beyond interactive use there are print/JSON modes, RPC, and a TypeScript SDK; OpenClaw is cited as a real integration.[2]

The difference from “yet another coding CLI” starts with a **default complexity budget**. Many agent products treat looking omniscient as a moat: planners, sub-agents, memory, browsers, dozens of slash commands. Pi’s wager is the opposite—**keep the core understandable and rewritable**; grow missing pieces via users and extensions, even “ask Pi to write the extension.” The 1.0 post frames this as discipline: agent tooling churns weekly; they wait until a mechanism has proven itself before adopting it. The list of ideas that fell off the wall is longer than the list that stuck.[1][2]

Read the 1.0 core list as control plane versus surface chrome:[1]

- **Codemode**: native MCP, plus non-LLM models (classifiers, image models, and the like);
- **extension support for virtual models**: one selection, route each request to different physical models;
- **deferred tool loading**: tools can enter context late instead of being declared all at once;
- **cache warming for Anthropic models**;
- **mid-conversation system messages**: transcript-aware prompt and tool changes;
- a new TUI theme and full-screen-by-default interaction polish.

The same day they shipped experimental **Pi Durable** (`@earendil-works/pi-durable` and related packages): a substrate for longer-running, multi-surface agent apps—explicitly *not* shoving durability into the minimal CLI core. That split is product architecture, not marketing: keep the minimal root; grow an experimental branch beside it.[1]

The permission story is equally blunt. Pi **does not** ship a built-in permission system for filesystem, process, network, or credential access; it inherits the user and process that launched it. Stronger boundaries mean containerization patterns (Gondolin micro-VM, plain Docker, OpenShell). That aligns with this site’s [OpenShell](/blog/nvidia-open-agent-safety-openshell-sentry/) line: **orchestration harness and enforced sandbox can live in different trust domains**. Codemode power is not process isolation.[2][4]

## Why MCP moved from “not in core” to “must be in core”

*[You Said No MCP!](https://earendil.com/posts/you-said-no-mcp/)* argues in order.[3]

First, the world moved. Today’s MCP is not last year’s MCP—but that alone does not justify core status. Pi already has an extension ecosystem; MCP could be, and was, an extension.

Second, what pushed MCP into core is that **the changes MCP required were generally useful to Pi**. They write that what Pi needs looks a lot like what MCP needs: an interpreter sandbox to play in. The same changes also make non-LLM classifier-style models easier to use inside Pi (their examples include classifiers; this article does not turn that into a separate product story).

Third, MCP’s hard remaining problem is **composition**. Even with Codemode—“a neat little sandbox to compose tool calls”—many MCP servers are still built for harnesses that dump tools into context and optimize token cost by returning text. Earendil’s target picture is closer to **OpenAPI with intelligent discovery**: structured returns, discoverable via documentation and description. CLIs work because agents can wire pipes with bash; they ask why MCP cannot be wired the same way. Pi’s answer: expose tools to a JavaScript sandbox and let the model write orchestration scripts (they note other harnesses such as Codex share a similar idea).[3]

Fourth—and this is the engineering key—**why not “Codemode only, MCP stays an extension”?** Modern models already support deferred tool loading, mid-conversation system messages, and reasoning-level changes. Pi spent recent months making sense of those model capabilities, but had not yet upgraded the tool loadout to scale with them. In a Codemode world you must decide whether a tool is available to the LLM directly or **only to the Codemode half**. A normal MCP extension lacks enough metadata from Pi’s tool loadout to make that experience clean. So they made tools configurable as deferred or Codemode-specific, then folded MCP into core—to fix their own loadout *and* to help shape MCP patterns that work in small harnesses instead of watching from the sidelines.[3]

At that point the 1.0 claim is clear: **not a checkbox for “MCP support,” but Codemode plus exposure metadata that pulls MCP out of the context landfill.**

## Codemode: an orchestration sandbox on the harness side

The official Codemode docs are concrete enough to quote as engineering constraints.[5]

**Input is raw JavaScript source, not a JSON argument bag** (and not a markdown fence). It runs as the body of an async function in a **QuickJS** sandbox, so top-level `await` and `return` work. The sandbox has **no** Node APIs, filesystem, network, or timers; scripts reach the outside world only through `tools` and `models`. An optional first line `// @options: {...}` can set `max_output_tokens` (default 10000) and a hard `timeout_ms`.[5]

**Why call it orchestration rather than “another bash tool”?** *[You Said No MCP!](https://earendil.com/posts/you-said-no-mcp/)* splits execution loci: tools often run in a weakly trusted sandbox; the agent loop runs in a relatively trusted harness environment. Codemode is special because **it runs where the harness runs**: it coordinates order, parallelism, and merges; its state lives in the **session transcript**, not as ad-hoc files. JavaScript wins because small embeddable engines (including WASM shapes) are practical to ship with isolation.[3][5]

Key globals include `tools.*` (MCP names sanitize illegal identifier characters to `_`), output helpers (`text` / `image` / `console` / `return` / `exit`), `store`/`load`, discovery (`ALL_TOOLS`, `searchTools`, `describeTool`, `describeNamespace`), and `models` for **non-LLM** classifiers and image models (chat models listable but not runnable from scripts).[5]

Harness-relevant boundaries:[5] only script output reaches the model (parallel calls can stay out of context); `codemode.mode` is `on` (other tools stay declared, steered toward scripts) or `only` (other tools hidden—model must orchestrate via scripts); deferred/Codemode-exposed tools stay off the inline list so connecting MCP servers do not churn descriptions (inline budget ≈ **3000** tokens via `codemode.inlineBudget`); failed scripts keep partial output and earlier real calls are **not rolled back**; VM memory is **256 MB**, with hard output/call caps, no nested Codemode, and immediate failure on never-settling promises (no timers).

Their published session replay—pull Linear issues, classify tone with a classifier model, four workers in parallel—shows the pattern: most tool traffic stays inside the sandbox; the model sees counts and a flagged list; intermediates can be `store`d for later digs.[3][5] Which classifier vendor appears in the demo is beside the point. Mechanically, **orchestration drops from multi-turn natural-language tool calling into one script plus `Promise` parallelism**, with a different latency and context profile.

When MCP is configured, Pi loads Codemode automatically; you can also add it as a default tool—docs even suggest asking Pi to reconfigure itself to enable Codemode.[3]

## Deferred tools, virtual models, mid-conversation prompt edits: one control plane

Codemode is not a lone feature. The 1.0 companions answer a shared question: **how do tool and model loadouts catch up to modern LLM APIs?**[1][6][7]

### Tool exposure: who sees it, who can call it

The Extensions docs define five `exposure` values (alongside MCP-style annotation hints):[6]

| exposure | Meaning (summary) |
| --- | --- |
| `direct` (default) | Declared to the model while active, and callable while active |
| `model-only` | Declared while active, never callable via `executeTool` / peer tools (facade / orchestrator tools) |
| `codemode` | Callable whenever registered and listed by Codemode; not declared to the model unless activated |
| `deferred` | Like `codemode`, but not listed by Codemode either; `tool_search` finds and activates it |
| `hidden` | Registered but unreachable (used to withdraw a tool) |

Namespaces group related tools (typically one MCP server). Codemode lists a namespace under one heading; longer usage guidance lives in `instructions`, read from scripts via `describeNamespace`.[6]

That table fills the metadata gap of a Codemode world: **the same physical tool can be script-only, late-discovered, or a model-facing facade.** MCP entered core because extensions alone could not make that stable.[3][6]

Dynamic activation is explicit: register everything first, keep optional tools inactive, then select with a loader / `tool_search` / `pi.setActiveTools()`. Pi records the initial prompt and tool set in the transcript’s **first** system message, then **appends** tool and prompt changes before the next model request. Providers that cannot represent the transition get a full transcript checkpoint—which can invalidate a cached prefix. That is the engineering footprint of “mid-conversation system messages”: changes are replayable and branch-aware, not silent mutations of a global singleton.[6][7]

### Virtual models: selection vs dispatch

A virtual model is a user-selectable logical model whose `route(request, ctx)` maps each request to a physical model plus thinking level. The launch demo shows an extension defining `router/auto`: plan on a strong model, implement on another, with a classifier helping decide when to switch; `/session` breaks down cost and cache by physical model.[1][8]

Docs keep two ledgers apart: selection (virtual) lives in `model_change` / thinking-level entries; dispatch (physical) is written on each assistant message. Continuations and retries sticky to the previous physical model to preserve prompt caches and thinking signatures; a fresh user message may re-route. Routers can also return serializable `state` (e.g. `plan` / `build` phases) that follows the session tree and survives compaction.[8]

For harness designers this beats “please use a small model for easy questions” in the system prompt: routing is a **testable function** with `reason` (`user` / `continuation` / `retry` / `direct`), failure context, and explicit state—not another pile of natural-language convention.

### Against the “stack more context” path

[Grow the Harness](/blog/grow-the-harness-not-the-context/) argues that recurring control should sink into peripheral code before prompts grow without bound. [Exactly-once tool contracts](/blog/exactly-once-model-harness-tool-contract/) talk about semantic boundaries among model, harness, and tools. [Inside Claude Code’s harness](/blog/inside-claude-code-agent-harness/) unpacks production loop layers. Codemode sits on the same spectrum of **peripheral sink**: move composition out of multi-turn chat into sandbox scripts; deferred tools and virtual models sink loadout and routing. The old MCP habit—dump every tool at turn zero—is nearly the anti-pattern; Earendil themselves criticize servers still optimized for that harness shape.[3][5]

## Composition: bash pipes vs MCP scripts

Make “hard to compose” concrete. In a CLI world an agent writes something like:

```bash
gh issue list --json number,title,body \
  | jq '.[0:20]' \
  | somewhere_classify \
  | jq 'map(select(.frustration != "none"))'
```

Intermediates can be huge, but the model context usually keeps only the last slice—**the pipe is the filter**. Old MCP usage often becomes: model sees thirty tool schemas → one call returns a wall of text → another call → text keeps accumulating in the transcript. Tokens and attention drown in intermediates; parallelism is awkward because the next turn is serial by default.[3]

Codemode moves the pipe into JS: `Promise.all` with four workers, local aggregation, `store` for caches, a small table via `return`. Docs also stress that tools with `outputSchema` resolve to `structuredContent` for scripts while the model may still see text `content`—two channels, human-facing and program-facing.[5][6] That is the “closer to OpenAPI” claim: discover by description, consume by structure, instead of serializing everything into paragraphs for an LLM.[3]

Another easy-to-miss detail: **inline tool declarations in the Codemode description share ~3000 tokens of budget**; the rest goes through `searchTools` (BM25, default limit 8), `describeTool`, `describeNamespace`, or filtering `ALL_TOOLS`. As MCP servers multiply, the default scaling curve is “hot path inline + cold path search,” not “ever-longer dumps.”[5]

`store` / `load` commit only on script **success**, append `codemode-store` transcript entries, follow session branches, and cap JSON size—replayable harness state, not a hidden `/tmp` cache (and not for image bytes).[5]

## Pi Durable: long runs beside the minimal core

Pi Durable shipped the same day as an experimental package (`@earendil-works/pi-durable` with `pi-ai`, `chord`; MIT): stretch malleability into longer-running, multi-surface apps instead of bloating the coding CLI. Motive: people want Pi outside the terminal; they chose a **parallel package** rather than diluting the core. The lesson for harness product design is the split itself—when demand shape changes, either change core defaults (and risk losing “still feels like Pi”) or prove durability on a side branch. Earendil chose the latter.[1]

## Small tool surface + extensible control plane: not “yet another CLI”

A contrast table nails the claim:

| Dimension | Typical “do-everything CLI” story | Pi 1.0 story (per official sources) |
| --- | --- | --- |
| Defaults | Plan / sub-agents / modes built in | Skip sub-agent and plan mode; grow via extensions [2] |
| MCP | Dump schemas into context; serial calls | Codemode scripts compose; structured results + discovery APIs [3][5] |
| Tool visibility | Mostly always model-visible | `direct` / `codemode` / `deferred` exposures [6] |
| Multi-model | Manual `/model` or prompt conventions | Virtual model routes per request; sticky for cache [1][8] |
| Session change | Restart or overwrite the whole system prompt | Mid-conversation system messages, append/replace, replayable [6][7] |
| Safety boundary | Soft prompts in-process with the harness | Explicit: no built-in permission system; containerize / OpenShell [2] |

[Strands](/blog/strands-harness-sdk-production-agent-runtime/) productizes loop control as an installable SDK; Pi doubles down on a tiny core plus extreme malleability. They are not mutually exclusive: one sells a deliverable with default cost claims; the other sells an understandable, user-rewritable control plane. Ask which gap your team actually has.[1][2]

One more safety nail: Codemode runs on the harness side and can orchestrate real tools, so **script capability sits near harness trust**. Docs say the VM has no Node/network, but once `tools.*` includes bash, file writes, or mutating MCP calls, the blast radius remains. Pi admits there is no built-in permission gate; if your threat model needs out-of-band policy, put Pi behind [OpenShell](/blog/nvidia-open-agent-safety-openshell-sentry/)-class boundaries rather than trusting QuickJS alone.[2][4][5]

## Site cross-links in one paragraph

[Strands](/blog/strands-harness-sdk-production-agent-runtime/) productizes loops as an SDK; Pi keeps a tiny core. [OpenShell / Sentry](/blog/nvidia-open-agent-safety-openshell-sentry/) moves policy outside the harness—Pi’s README already lists OpenShell as an option, so Codemode is not marketed as process isolation.[2][4] [CIR](/blog/cir-causal-evaluation-harness-recovery/) still applies if your scripts “look again on failure”: do not hide clean-trajectory harm behind averages. [Grow the Harness](/blog/grow-the-harness-not-the-context/) and [MoMHa](/blog/momha-multi-objective-harness-accuracy-safety-tokens/) warn that peripheral control (Codemode, virtual models, deferred tools) can still trade tokens, accuracy, and safety—especially under `codemode.mode: only`. [Claude Code’s harness](/blog/inside-claude-code-agent-harness/) and [exactly-once tool contracts](/blog/exactly-once-model-harness-tool-contract/) are the same boundary problems in other clothes: exposure tables and “no rollback of earlier calls” are concrete instances.[5][6] Product-side Mods / Plugins discussions ask a similar modularity question with different answers; this piece does not depend on an unpublished site essay for that line.

## When not to copy Pi’s defaults

Mechanisms transfer; defaults should not be idolized. Skip Codemode-first designs if you need a built-in permission gate Pi does not ship, if you only have a handful of read-only tools, or if the org will not maintain extensions and script conventions—then a Strands-shaped “install and run” harness may fit better.[1][2][3][5] Treat classifier-based virtual routing as a measured trade (extra latency before first token, cache sticky behavior), not a demo checkbox.[8] Learn the **control-plane shape**—exposure, orchestration sandbox, replayable changes, selection/dispatch split—not “must install the same CLI.”

## A portability checklist for harness authors

Not an install tutorial—acceptance checks you can apply to a home-grown stack:

1. **Draw a tool exposure matrix.** For each tool: model-direct? script-only? deferred discovery? model-only facade? Without that table you cannot build Codemode or deferred loading cleanly.[6]
2. **Split trust domains for orchestration vs execution.** Decide where composition runs and whether state lands in the transcript or on disk; do not drop orchestration into the same sandbox as untrusted tools, and do not treat a trusted harness as already isolated.[3][5]
3. **Default to structured MCP returns.** Text blobs are for humans; scripts need schemas / `structuredContent`, with `Promise.all` / `allSettled` for parallelism and partial failure.[3][5][6]
4. **Treat description budget as a first-class resource.** Cap inline declarations; search/describe the rest. Connecting MCP servers should not thrash the description text.[5]
5. **Make session changes replayable.** Prompt section edits and tool add/remove become transcript system/change entries; if a provider cannot do incremental updates, accept cache invalidation and account for it—do not silently mutate memory.[6][7]
6. **Encode multi-model routing as a function, not a spell.** Virtual-model `reason` / sticky / `state` beat “please decide which model to use.”[8]
7. **Define failure and partial-execution semantics.** Codemode’s “no rollback of earlier calls” is reality; pretending transactions around mutating MCP ops is a lie.[5]
8. **Put permissions on a separate layer.** A minimal harness may omit a built-in permission system, but docs and deploy checklists must name who owns containers / policy runtimes—compare OpenShell’s out-of-band boundary.[2][4]
9. **Prove context savings with filtered output.** A/B the same task: full multi-turn tool re-injection versus Codemode returning a summary—measure tokens and correctness, not demo sparkle.[5]
10. **Keep extension-vs-core discipline.** Ask Earendil’s question: does this unlock a class of control-plane metadata, or is it merely hot? Only the former belongs in core.[1][3]

## What to take away

1. **Pi 1.0’s story is not “another coding CLI shipped.”** It is a minimal harness folding MCP into Codemode: the model writes JS in QuickJS to compose / parallelize / filter tools; only script output enters context.[1][5]
2. **MCP entered core because deferred tools and mid-conversation system messages need exposure metadata—and Codemode needs the same metadata.** “Codemode only, MCP stays an extension” failed their experience bar.[3][6]
3. **Codemode runs on the harness side; state lives in the transcript.** It is an orchestration layer, not a bash substitute—and its trust level sits near the harness, so process/policy boundaries still matter.[3][2][5]
4. **Virtual models, deferred loading, and replayable system-message changes share one control plane with Codemode.** The shared goal is fewer baked-in features and more composable loadout—not dumping tools and routing policy into the opening prompt.[1][6][8]
5. **Against other site posts: Strands skews productized loop SDKs; OpenShell skews sandbox externalization; CIR / MoMHa / Grow the Harness skew evaluation and peripheral growth.** Pi skews “tiny core + JS orchestration sandbox.” Choose by whether your gap is deliverable, isolation, or a rewritable minimal control plane.[1][2][4]

If you leave with one acceptance question, use this: **For every tool, list whether it is visible/callable to the model, to Codemode, and to `tool_search`; then ask whether MCP results are large text for the model or structured data for scripts. If you cannot answer both, you have not really “supported modern MCP.”**[3][5][6]

## References

[1] Earendil. *Pi 1.0.* 2026-10-01. https://earendil.com/posts/pi-1-0/

[2] earendil-works/pi. *README* (Pi as a minimal, extensible agent harness; install, packages, permissions and containerization). https://github.com/earendil-works/pi

[3] Earendil Engineering. *“You Said No MCP!”* 2026-09-29. https://earendil.com/posts/you-said-no-mcp/

[4] On this site: [NVIDIA OpenShell / Sentry: move agent safety boundaries out to the runtime](/blog/nvidia-open-agent-safety-openshell-sentry/)

[5] Pi Documentation. *Codemode.* https://pi.dev/docs/latest/codemode

[6] Pi Documentation. *Extensions* (tool exposure, MCP registration, dynamic activation, mid-conversation change recording). https://pi.dev/docs/latest/extensions

[7] Pi Documentation. *Message Types* (SystemMessage: later system messages can add/remove prompt sections and tools). https://pi.dev/docs/latest/message-types

[8] Pi Documentation. *Virtual Models.* https://pi.dev/docs/latest/virtual-models

[9] Site crosslinks: [Strands Harness SDK](/blog/strands-harness-sdk-production-agent-runtime/), [CIR](/blog/cir-causal-evaluation-harness-recovery/), [MoMHa](/blog/momha-multi-objective-harness-accuracy-safety-tokens/), [Grow the Harness](/blog/grow-the-harness-not-the-context/), [Claude Code Agent Harness](/blog/inside-claude-code-agent-harness/), [Exactly-once tool contracts](/blog/exactly-once-model-harness-tool-contract/)
