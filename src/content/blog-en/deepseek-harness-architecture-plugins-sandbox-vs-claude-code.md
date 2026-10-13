---
title: "DeepSeek Harness, Taken Apart: The Loop, PTC, Four Modes, Plugins and Sandbox, and How It Compares with Claude Code, Codex and Pi"
seoTitle: "DeepSeek Harness Architecture: PTC, Plugins, Sandbox"
description: "DeepSeek Harness is not just another coding CLI: its agent loop is itself a Cordis plugin, PTC lets the model write programs that call tools, the four modes are four presets, and sandbox, approval and permission presets each guard a different stage. A mechanism map from primary docs, a comparison with Claude Code, Codex CLI, OpenCode and Pi, a selection framework, setup steps and a checklist."
pubDate: 2026-10-13T11:15:00+08:00
author: "Remy"
tags: ["agent-harness", "ai-agents", "deepseek", "developer-tools", "security"]
lang: "en"
---

DeepSeek published the deepseek-harness repo on August 13, and that day's "DeepSeek Harness developer preview" thread on Hacker News passed 700 points (747 as of October 13). In the October 2 thread about the desktop app, someone asked the plain question: "What is a harness, in the end?" [1][2] DeepSeek Harness (DSH below; the command is `dsh`) looks like Claude Code or Codex CLI, but its choices underneath differ: there is no untouchable core, and even the agent loop is a replaceable plugin. [3][4]

I'll skip desktop installation (36Kr covered the 0.1.7-rc desktop preview) [5]. From the official site, repo docs, design notes and release notes, this post covers how the loop runs; where PTC, the four modes, multi-agent, plugins and the sandbox sit; how DSH diverges from Claude Code, Codex CLI, OpenCode and Pi; and who should try it, how, and what to watch. [6][7] As of October 13 the latest tag is dsh-v0.2.1-alpha.2 (October 9, 19:09 Beijing time), and the README's first screen says "developer preview, THERE WILL BE COMPATIBILITY-BREAKING CHANGES". All of the below is pinned to it. [8][3]

## The short version

- **DSH is an assemblable harness, not a fixed product.** A running `dsh` is a plugin tree built from config; model adapters, tool registry, session log and agent loop are all Cordis plugins. [4]
- **PTC is Programmatic Tool Calling**: the model writes a TypeScript program that calls tools in bulk, and only what it prints or returns goes back into context. [9][10]
- **The Standard, PTC, Minimal and Creator modes are four agent presets** sharing one loop. [11][10]
- **Safety is three independent knobs**: file sandbox, approval policy, permission presets. The file sandbox **does not cover the network**, and the project says it has not been security-audited. [12][13]
- **It suits teams that want to modify or study harnesses.** For a stable daily tool, Claude Code or Codex CLI is still the safer bet.

## One layered picture: from Cordis to a single tool call

DSH sits on Cordis, a plugin framework in which plugins register services, events and reversible side effects (effects) on a shared context; unload a plugin and its registrations unwind automatically. [4][14] Cordis's spatiotemporal composition has its own post ([Cordis deep dive](/blog/cordis-spatiotemporal-composability-deepseek-harness/)); one point here: there is no privileged core, and you extend DSH by hanging another plugin beside it. On the plugin page in the official demo, "Agent loop", "Subagents" and "Terminal" share one list with the Pomodoro-timer plugin the user had the agent write. [6]

Above Cordis is composition. A **profile** is a named composition listing the **bundles** it stacks plus the user's `cordis.patch.yml`; a bundle is config rows plus the code they mount. The shipped `web`, `headless`, `sdk` and `acp` profiles build on `dsh-base` (`sdk-minimal` stands alone), which holds model adapters, tools, persistence, sandbox and approval, credentials and telemetry. [4] Layers stack in a fixed order: bundles, profile patch, home-directory patch, then command-line `--patch`. A higher layer can replace any lower row by id, and `dsh --profile web --dump-config` prints the tree that actually starts. [4]

Desktop is just another entry point: an Electron shell running the full Web app and the same profile launcher. [15]

<figure class="not-prose my-6"><svg viewBox="0 0 600 396" role="img" aria-label="DeepSeek Harness architecture layers" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:600px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor" fill-opacity="0.7"/></marker></defs><text x="10" y="26" font-size="16" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">DeepSeek Harness layers: from the Cordis kernel to the surfaces</text><rect x="10" y="44" width="430" height="56" rx="8" fill="#3b82f6" fill-opacity="0.14"/><text x="22" y="67" font-size="14.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">Surfaces</text><text x="22" y="88" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.85">Desktop (Electron) · Web · headless · SDK · ACP</text><rect x="10" y="110" width="430" height="56" rx="8" fill="#10b981" fill-opacity="0.16"/><text x="22" y="133" font-size="14.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">Agent presets (modes)</text><text x="22" y="154" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.85">Standard · PTC · Minimal · Creator: each picks tools and prompts</text><rect x="10" y="176" width="430" height="56" rx="8" fill="#f59e0b" fill-opacity="0.18"/><text x="22" y="199" font-size="14.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">Shared layer: dsh-base</text><text x="22" y="220" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.85">LLM adapters · tools · storage · sandbox · approval · telemetry</text><rect x="10" y="242" width="430" height="56" rx="8" fill="#94a3b8" fill-opacity="0.18"/><text x="22" y="265" font-size="14.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">Composition (profile)</text><text x="22" y="286" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.85">ordered bundles → profile patch → home patch → --patch</text><rect x="10" y="308" width="430" height="56" rx="8" fill="#3b82f6" fill-opacity="0.3"/><text x="22" y="331" font-size="14.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">Cordis kernel</text><text x="22" y="352" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.85">plugins · services · events · effects that unwind on unload</text><rect x="452" y="44" width="138" height="318" rx="8" fill="#8b5cf6" fill-opacity="0.12" stroke="#8b5cf6" stroke-width="1.5"/><text x="521" y="70" font-size="14.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">Session log</text><text x="521" y="90" font-size="12" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.8">(append-only)</text><text x="521" y="122" font-size="12.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">Everything the</text><text x="521" y="142" font-size="12.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">model sees</text><text x="521" y="162" font-size="12.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">is logged</text><text x="521" y="202" font-size="12.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">fork · resume</text><text x="521" y="222" font-size="12.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">search · replay</text><text x="521" y="242" font-size="12.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">telemetry</text><text x="521" y="282" font-size="12.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">the loop itself</text><text x="521" y="302" font-size="12.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">is a plugin</text><text x="10" y="384" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.7">Any config row can be replaced by id from a higher layer</text></svg></figure>

*Figure: DSH layers. Every layer is Cordis plugins or their config; the session log on the right feeds replay and telemetry [4]*

## The loop: turns, steps, and "model-visible means logged"

The docs use two units. A **step** is one model request plus the tools it calls; a **turn** is zero or more steps, from claiming the first input until no work is outstanding. [4] A step roughly: claim input, assemble prompt and tool schemas, pass `agent/pre-step` (plugins may rewrite or reject input) and `agent/request` (routing), freeze the request and stream the model; tool calls then pass `tools/pre-execute`, `tools/execute` and `tools/post-execute` and land as `tool/result`. [4] `turn/*` and `tool/*` are durable logged events; `agent/*` and `tools/*` are runtime interception points, mostly waterfalls where a listener must call `next()` to continue. You change behavior by attaching to one, not by editing the loop.

The session log matters more. The architecture doc sums it up as **Model-visible means logged**: everything the model sees must be reconstructible from the log. System prompt, reasoning, tool calls and results, subagent dispatches and every context injection go into an append-only session log, and fork, resume, search, replay and telemetry all derive from it. [4][1] One HN developer called this the "killer feature": closed models often hide reasoning traces, and improving tooling starts with seeing what the model thought was happening. [16]

[![Hacker News comment screenshot: SwellJoe calls the append-only session log a killer feature](/assets/deepseek-harness-architecture-plugins-sandbox-vs-claude-code/hn-swelljoe-session-log-killer-feature.webp)](https://news.ycombinator.com/item?id=49288435)

*Screenshot: SwellJoe quotes the "Every run is traceable" passage and explains why it matters (Hacker News, captured Oct 2026) [16]*

Context compaction is optional and writes locked log events at start and end, so a crash leaves an orphaned lock ("started, never finished") rather than a false "done". [17] The built-in presets also attach a tool-result pruner with a threshold of 8192 characters, keeping the first 4096 and last 1024. [11]

## PTC: the model writes a program that calls tools

First the acronym. An August 25 repo design note says Code Mode was renamed PTC (programmatic tool calls), user-facing "PTC mode"; the in-app description says "PTC means Programmatic Tool Calling", that is, calling tools through a program. [9][10]

The note is blunt about why: normally the model emits one tool call per step and every intermediate result is stuffed back into context on the next request, so multi-step tool work is token-hungry and serial; iterating, branching, fanning out and aggregating each cost a model round trip. [18] The inspiration is Cloudflare's Code Mode: models have seen far more real code than synthetic tool-call traces, so writing code suits them better than filling in arguments. [18][19]

DSH does it in three parts: [18]

1. **The tool registry decides presentation.** Config `mode` is either `native` or `ptc`. Under `ptc` the model's tool list holds one reserved tool, `run_code` (arguments `code` and `description`), and all other tools appear as generated TypeScript declarations in the system prompt. 0.2.1-alpha.2 removed the old mixed mode, so an agent is fully native or fully PTC. [8]
2. **Code execution is its own capability interface.** `ctx.ptcRuntime` only does "take a program and some named async functions, run it, report the result"; it knows nothing about tools. Language and environment are details; a Python runtime came later. [20][8]
3. **The shipped runtime is a fresh Node process per program**, so global state is always fresh, bound by the calling session's sandbox policy. Tool calls use a control channel separate from stdout, and the host validates each frame before dispatch. [18]

<figure class="not-prose my-6"><svg viewBox="0 0 600 380" role="img" aria-label="native vs PTC tool calling" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:600px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor" fill-opacity="0.7"/></marker></defs><text x="10" y="26" font-size="16" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">Native tool calling vs PTC (Programmatic Tool Calling)</text><text x="150" y="54" font-size="13.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">Native: one round trip per call</text><rect x="95" y="66" width="110" height="26" rx="5" fill="#3b82f6" fill-opacity="0.8"/><text x="150" y="84" font-size="12.5" text-anchor="middle" font-weight="bold" fill="#fff" fill-opacity="1">Model</text><line x1="150" y1="93" x2="150" y2="103" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.6" marker-end="url(#ah)"/><rect x="95" y="104" width="110" height="26" rx="5" fill="#f59e0b" fill-opacity="0.85"/><text x="150" y="122" font-size="12.5" text-anchor="middle" font-weight="bold" fill="#fff" fill-opacity="1">Tool A</text><line x1="150" y1="131" x2="150" y2="141" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.6" marker-end="url(#ah)"/><text x="212" y="141" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">result → context</text><rect x="95" y="142" width="110" height="26" rx="5" fill="#3b82f6" fill-opacity="0.8"/><text x="150" y="160" font-size="12.5" text-anchor="middle" font-weight="bold" fill="#fff" fill-opacity="1">Model</text><line x1="150" y1="169" x2="150" y2="179" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.6" marker-end="url(#ah)"/><rect x="95" y="180" width="110" height="26" rx="5" fill="#f59e0b" fill-opacity="0.85"/><text x="150" y="198" font-size="12.5" text-anchor="middle" font-weight="bold" fill="#fff" fill-opacity="1">Tool B</text><line x1="150" y1="207" x2="150" y2="217" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.6" marker-end="url(#ah)"/><text x="212" y="217" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">result → context</text><rect x="95" y="218" width="110" height="26" rx="5" fill="#3b82f6" fill-opacity="0.8"/><text x="150" y="236" font-size="12.5" text-anchor="middle" font-weight="bold" fill="#fff" fill-opacity="1">Model</text><line x1="150" y1="245" x2="150" y2="255" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.6" marker-end="url(#ah)"/><rect x="95" y="256" width="110" height="26" rx="5" fill="#f59e0b" fill-opacity="0.85"/><text x="150" y="274" font-size="12.5" text-anchor="middle" font-weight="bold" fill="#fff" fill-opacity="1">Tool C</text><line x1="150" y1="283" x2="150" y2="293" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.6" marker-end="url(#ah)"/><text x="212" y="293" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">result → context</text><rect x="95" y="294" width="110" height="26" rx="5" fill="#3b82f6" fill-opacity="0.8"/><text x="150" y="312" font-size="12.5" text-anchor="middle" font-weight="bold" fill="#fff" fill-opacity="1">Model</text><text x="150" y="340" font-size="12" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">every intermediate result</text><text x="150" y="356" font-size="12" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">re-enters the context</text><line x1="300" y1="44" x2="300" y2="372" stroke="currentColor" stroke-opacity="0.18"/><text x="450" y="54" font-size="13.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">PTC: one program orchestrates calls</text><rect x="395" y="66" width="110" height="26" rx="5" fill="#3b82f6" fill-opacity="0.8"/><text x="450" y="84" font-size="12.5" text-anchor="middle" font-weight="bold" fill="#fff" fill-opacity="1">Model</text><line x1="450" y1="93" x2="450" y2="106" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.6" marker-end="url(#ah)"/><rect x="320" y="108" width="260" height="150" rx="8" fill="#10b981" fill-opacity="0.12" stroke="#10b981" stroke-width="1.5"/><text x="332" y="128" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">run_code: one TypeScript program</text><rect x="334" y="140" width="110" height="26" rx="5" fill="#f59e0b" fill-opacity="0.85"/><text x="389" y="158" font-size="12" text-anchor="middle" font-weight="bold" fill="#fff" fill-opacity="1">tools.a()</text><rect x="456" y="140" width="110" height="26" rx="5" fill="#f59e0b" fill-opacity="0.85"/><text x="511" y="158" font-size="12" text-anchor="middle" font-weight="bold" fill="#fff" fill-opacity="1">tools.b()</text><text x="450" y="182" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">read-only calls may overlap (Promise.all)</text><rect x="395" y="192" width="110" height="26" rx="5" fill="#ef4444" fill-opacity="0.8"/><text x="450" y="210" font-size="12" text-anchor="middle" font-weight="bold" fill="#fff" fill-opacity="1">tools.c()</text><text x="450" y="234" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">mutating calls run alone, in order</text><text x="450" y="250" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">filter · aggregate · handle errors in code</text><line x1="450" y1="259" x2="450" y2="274" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.6" marker-end="url(#ah)"/><rect x="345" y="276" width="210" height="26" rx="5" fill="#3b82f6" fill-opacity="0.8"/><text x="450" y="294" font-size="12" text-anchor="middle" font-weight="bold" fill="#fff" fill-opacity="1">only printed/returned output</text><text x="450" y="324" font-size="12" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">each sub-call still runs the full</text><text x="450" y="340" font-size="12" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">tool pipeline and logs tool/ptc-dispatch</text></svg></figure>

*Figure: native tool calling vs PTC. Under PTC the model sees only run_code; sub-calls inside the program still pass policy and are logged [18]*

The difference from "give the model bash" is in the details. Each tool call inside the program goes back through the full tool pipeline, so permissions and approvals still apply, and each sub-call logs a `tool/ptc-dispatch` entry. Independent read-only calls may run in parallel via `Promise.all`; side-effecting calls run one at a time in submission order. Failed programs are not rerun, since side effects may have landed, and no persistent kernel keeps state across `run_code` calls, since that state would be missing from the log and the request could not be rebuilt. [18] Failures fall into eight distinct kinds, such as timeout, cancellation, process death and sandbox setup failure. [20]

Pi's Codemode shares the idea, landing elsewhere: it runs scripts in QuickJS with no Node APIs, file system, network or timers, so they reach the outside only through `tools` and `models`. DSH gives the program a real Node process fenced by an OS-level sandbox; the note explicitly rejects `node:vm` as a security mechanism, since language-level isolation cannot stop direct file and process operations. [21][18] More on Codemode in the earlier [Pi 1.0 post](/blog/pi-1-0-codemode-mcp-minimal-harness/).

Official expectations are modest: Standard mode can script batch work too, PTC only reorganizes tool calls, and speed and tokens depend on the task and the program. Examples have lots of intermediate data but need only a summary: validating a batch of JSON against a schema or grouping and counting log errors. [10]

## Four modes, really four presets

36Kr calls the four Agent-mode settings Standard, PTC, Minimal and Creator. [5] In the repo they are four patch files under the `web-app` bundle, each declaring a `dsh-agent-preset` with ids `standard`, `ptc`, `minimal` and `cordis` (Creator in the UI), ordered 1 to 4. [11] A preset picks the tools, prompts and skills the agent sees; the loop is the same.

| Mode (preset id) | What it loads | Suggested use |
| --- | --- | --- |
| Standard (standard) | Shell, file read/write/search, background and scheduled tasks, skills, plan mode, compaction, subagents and workflows, web tools | Default for everyday work |
| PTC (ptc) | Like Standard, presentation set to `ptc`, workflow tools off | Batch jobs a program should aggregate |
| Minimal (minimal) | One persistent shell and a fixed prompt; no skills, plan mode or compaction | Baseline for controlled comparisons |
| Creator (cordis) | Standard tools plus runtime inspection, plugin management, plugin-authoring guide | Having the agent write plugins and your own modes |

*Table: composition of the four built-in modes, from the preset configs and in-app descriptions [11][10]*

Two design notes. Plan mode is an isolated plugin group plus a prompt, not a tool swap: for request-cache stability the tool catalog stays identical across modes, and rules stop the model from editing files until the user approves via `exit_plan_mode`. [11] Minimal mode's description warns that comparisons should fix model, permissions, input and starting workspace, and that fewer tools does not mean friendlier to beginners. [10]

Creator mode shows "everything is a plugin" best. In the official demo, the prompt "write me a Pomodoro timer plugin" has the agent load the `cordis-plugin-development` skill, query runtime slots, write files, then install and verify through the plugin manager, in 5 minutes 24 seconds. [6] HN users report having it write plugins to change font size or ring a bell when a task finishes. [2]

## Multi-agent: one interface, different executors

Subagents are a single delegation interface with providers behind it. Local `spawn` (new subagent) and `fork` (branch the current session) keep a persistent session you can keep messaging; the ACP, DSH SDK, Codex and Claude Code providers are one-shot. [22] Built-in presets deny subagents the four scheduling tools by default, so they cannot schedule work themselves. [11]

Easy to miss: DSH can delegate to the **real** Claude Code or Codex. Its bundle starts a fresh unattended session in the parent's workspace, runs one self-contained task and returns only the final answer or a failure diagnosis; reasoning, tool traffic and workspace diff stay out of the parent session, and auth uses each tool's native config. [23][24] 0.2.1-alpha.2 added them to the official plugin list. [8] DSH wants to be a harness that dispatches other harnesses.

Above that sits experimental Agent Teams: the root session is Lead, teammates have a persistent roster and task state, and messages go straight to each other's inboxes. [25] An HN user says parent and child agents can message each other both ways mid-task while the main thread keeps chatting. [2]

## "Everything is a plugin" in practice

The architecture doc's "where new behavior goes" table is an extension map. New model provider: register an adapter on `ctx.llm`. New capability for the model: register on `ctx.tools`. Restrict child processes: wrap argv with a `ctx.sandbox` backend. Intercept requests, tools or turns: hook the matching `agent/*` or `tools/*` event. Durable session state: extend the session event table, rendered and replayed from the log. [4] The concept underneath is the capability seam: a capability splits into interface, implementation and consumers, each swappable. Point the file-system and subprocess providers at a remote sandbox, and Bash, PTY and LSP all move with them. [4]

For existing Claude Code or Codex setups there are bridges: `dsh-hooks-claude-code` runs your existing Claude Code `hooks.json` as is, and `dsh-hooks-codex` supports Codex's five hook points. [26][27] 0.2.1-alpha.1 added an experimental Claude Code Mods compatibility layer; the release notes say frankly it mainly checks that the Claude Code Mods API is roughly a subset of DSH plugin capabilities, not full compatibility. [8]

The cost: a long-time HN user says that when "everything" includes core features, tweaking behavior still means downstream patches to core plugins; he has about 25 downstream commits and 0 new plugins. [28] Plugins are code, and the official security statement lists untrusted plugins as a risk. [13]

## Sandbox and permissions: three knobs, three stages

**Knob one: file sandbox mode.** `read-only` denies writes, `workspace-write` allows the workspace and temp directories, `danger-full-access` has no limits. Local backends are bwrap plus Landlock on Linux, Seatbelt on macOS and an ACL restricted token on Windows; over SSH the remote end enforces the same policy. [12] The docs say the mode **covers file side effects only; network and process visibility are outside it**. Enforcement completeness is reported separately, and older Landlock and Windows ACLs enforce only partially. [12]

**Knob two: approval policy**, just `ask` or `never`. `ask` goes to a registered answerer (such as a Web dialog), yielding `unavailable` if none exists; `never` rejects outright. Of four outcomes only `allowed-once` lets the call through, and only once. [29]

**Knob three: permission presets**, bundling the first two. The Web UI has Read Only, Workspace Write and Full access. Experimental Auto review has the current model assess each tool call first; a pass runs it with full access, otherwise the user is asked. Its description admits it may let unsafe actions through and costs extra tokens. [30][31] New sessions default to `workspace-write` plus `ask`; setting `DSH_PERMISSION_MODE` to `danger-full-access` switches approval to `never`. [32]

<figure class="not-prose my-6"><svg viewBox="0 0 600 424" role="img" aria-label="permission flow for a tool call" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:600px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor" fill-opacity="0.7"/></marker></defs><text x="10" y="26" font-size="16" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">The permission gates one tool call passes</text><rect x="150" y="44" width="300" height="34" rx="6" fill="#94a3b8" fill-opacity="0.16" stroke="#94a3b8" stroke-width="1.5"/><text x="300.0" y="66" font-size="12.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">tool/call is logged first</text><line x1="300.0" y1="79" x2="300.0" y2="92" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.6" marker-end="url(#ah)"/><rect x="150" y="94" width="300" height="34" rx="6" fill="#f59e0b" fill-opacity="0.16" stroke="#f59e0b" stroke-width="1.5"/><text x="300.0" y="116" font-size="12.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">tools/pre-execute: hooks · permission · sandbox</text><line x1="300.0" y1="129" x2="300.0" y2="142" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.6" marker-end="url(#ah)"/><rect x="150" y="144" width="300" height="34" rx="6" fill="#f59e0b" fill-opacity="0.16" stroke="#f59e0b" stroke-width="1.5"/><text x="300.0" y="166" font-size="12.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">registered guards: deny or abstain</text><line x1="300.0" y1="179" x2="300.0" y2="192" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.6" marker-end="url(#ah)"/><rect x="150" y="194" width="300" height="34" rx="6" fill="#8b5cf6" fill-opacity="0.16" stroke="#8b5cf6" stroke-width="1.5"/><text x="300.0" y="216" font-size="12.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">needs approval → ctx.approval</text><line x1="300.0" y1="229" x2="300.0" y2="242" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.6" marker-end="url(#ah)"/><rect x="150" y="244" width="300" height="34" rx="6" fill="#10b981" fill-opacity="0.16" stroke="#10b981" stroke-width="1.5"/><text x="300.0" y="266" font-size="12.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">tools/execute: sandbox backend wraps argv</text><line x1="300.0" y1="279" x2="300.0" y2="292" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.6" marker-end="url(#ah)"/><rect x="150" y="294" width="300" height="34" rx="6" fill="#f59e0b" fill-opacity="0.16" stroke="#f59e0b" stroke-width="1.5"/><text x="300.0" y="316" font-size="12.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">tools/post-execute: accept · block · replace</text><line x1="300.0" y1="329" x2="300.0" y2="342" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.6" marker-end="url(#ah)"/><rect x="150" y="344" width="300" height="34" rx="6" fill="#3b82f6" fill-opacity="0.2" stroke="#3b82f6" stroke-width="1.5"/><text x="300.0" y="366" font-size="12.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">tool/result goes to the model</text><line x1="450" y1="211" x2="468" y2="211" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.6" marker-end="url(#ah)"/><rect x="470" y="154" width="122" height="114" rx="6" fill="#ef4444" fill-opacity="0.1" stroke="#ef4444" stroke-width="1.5"/><text x="531" y="174" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">ask → answerer</text><text x="531" y="192" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">never → rejected</text><text x="531" y="210" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">no answerer →</text><text x="531" y="228" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">unavailable → deny</text><text x="531" y="246" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">only allowed-once</text><text x="531" y="264" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">passes, once</text><rect x="8" y="44" width="132" height="300" rx="6" fill="#94a3b8" fill-opacity="0.1"/><text x="74" y="66" font-size="13.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">Three knobs</text><text x="74" y="90" font-size="12.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">Sandbox mode</text><text x="74" y="109" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">read-only</text><text x="74" y="128" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">workspace-write</text><text x="74" y="147" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">danger-full-access</text><text x="74" y="166" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">(files only)</text><text x="74" y="204" font-size="12.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">Approval policy</text><text x="74" y="223" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">ask / never</text><text x="74" y="261" font-size="12.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">Permission presets</text><text x="74" y="280" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">Read Only</text><text x="74" y="299" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">Workspace Write</text><text x="74" y="318" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">Full access</text><text x="10" y="412" font-size="12" text-anchor="start" font-weight="bold" fill="#ef4444" fill-opacity="1">Network and process visibility are outside the sandbox modes</text></svg></figure>

*Figure: the gates a tool call passes, and the three independent knobs [33][12][29]*

Within one tool call: it is logged, passes `tools/pre-execute` and the guards, goes to `ctx.approval` if approval is needed, and is denied if nobody can answer. At execution, shell-type tools have the sandbox backend wrap the command. `tools/post-execute` may block or rewrite the result before it becomes `tool/result`. [33] PTC programs obey the same session sandbox policy, and each sub-call runs this pipeline. [18]

Telemetry: in the HN desktop thread a user found Desktop has telemetry on by default while `dsh web` reports only when you send feedback, and posted config disabling the relevant plugins before first launch. [28] The docs agree: Desktop collects product analytics events following the in-app toggle, the plain Web client collects none, session-log telemetry defaults to feedback-only, and setting `DSH_TELEMETRY_DISABLED` to any non-empty value opts the process out. [34][15][32]

[![Hacker News comment screenshot: wren6991 on Desktop telemetry defaults and about 25 downstream commits](/assets/deepseek-harness-architecture-plugins-sandbox-vs-claude-code/hn-wren6991-desktop-telemetry-patches.webp)](https://news.ycombinator.com/item?id=49933838)

*Screenshot: wren6991 on Desktop telemetry defaults and maintaining downstream patches to core plugins (Hacker News, captured Oct 2026) [28]*

## Next to Claude Code, Codex CLI, OpenCode and Pi

Architecture only, not model quality; cells map to the docs under the table, and unchecked cells say "not verified here".

| Dimension | DeepSeek Harness | Claude Code | Codex CLI | OpenCode | Pi |
| --- | --- | --- | --- | --- | --- |
| Core and extension | Plugin tree; even the loop is swappable | Fixed core; plugins bundle skills, agents, hooks, MCP | Fixed core; `hooks.json`-style hooks | Fixed core; plugins | Deliberately small core plus extensions |
| Programmatic tool calls | PTC: whole-agent switch, Node process in OS sandbox | Not verified here | Not verified here | Not verified here | Codemode: QuickJS, no Node APIs |
| OS sandbox | Files only: bwrap+Landlock / Seatbelt / Windows ACL | Off by default; Seatbelt or bubblewrap, network via proxy with domain allowlist | No network, workspace-only writes by default; Seatbelt, bwrap+seccomp on Linux | No built-in OS sandbox found | None; run the process in a container |
| Approval and permissions | `ask`/`never` plus three presets; Auto review experimental | Several modes incl. plan, acceptEdits, bypassPermissions, classifier-driven auto | Sandbox mode plus approval policy (e.g. on-request) | Per-tool allow/ask/deny | None built in |
| Multi-agent | Continuable spawn/fork; delegates to Claude Code, Codex | Subagents with own context, up to three nesting levels by default | Not verified here | Primary agents plus subagents | Not in core |
| Surfaces | Web, desktop, headless, SDK, ACP | CLI, IDE, more | CLI, IDE extension | Terminal, more | CLI, SDK, RPC |

*Table: architecture choices of five harnesses. DSH: [4][18][12][29][22]; Claude Code: [35][36][37][38]; Codex: [39][27]; OpenCode: [40][41]; Pi: [21][42]*

Three fault lines show up.

**Can the core be swapped?** Claude Code, Codex and OpenCode keep a stable core with extensions around it; Pi's core is small but still a core; DSH lets you replace even the loop, at the cost of maintaining patches when you change defaults. On HN one person said it could become "the Emacs of harnesses"; another argued that as models get stronger, harnesses get thinner until about Pi's size is left. [2] It depends on whether you bet on the model or on the engineering control plane.

**Which layer does isolation live in?** Pi isolates in the scripting language and leaves process permissions alone; DSH and Codex delegate to the OS; Claude Code's sandbox is off by default and, once on, also routes network through a proxy allowlist. [42][39][36] If exfiltration worries you more than deleted files, DSH's current file sandbox is not enough; add network isolation outside it. The site's [DSec post](/blog/deepseek-dsec-agent-rl-sandbox-execution-layer/) covers DeepSeek's training-side sandbox, a different thing.

**Observability.** DSH treats "model-visible means logged" as an invariant. [4] Against the context management, streaming execution and recovery ladder in the earlier [Claude Code agent harness](/blog/inside-claude-code-agent-harness/) teardown, which is about keeping the loop stable, DSH also stresses keeping it inspectable.

## Who should use it: a selection framework

| Your situation | Suggestion |
| --- | --- |
| You want the harness as a platform: swap the loop, add a UI, build custom modes | DSH; Creator mode lets the agent write plugins |
| Harness research or controlled comparisons | DSH Minimal mode as baseline |
| Batch work that reads a lot and summarizes a little | DSH PTC or Pi Codemode; measure tokens on a small task first |
| The team needs a stable daily coding tool | Start with Claude Code or Codex CLI |
| You fear exfiltration or run untrusted repos | Wrap it in a VM or container first |
| You have Claude Code / Codex hooks | Try DSH's bridges; they cover only a subset of command hooks |
| Customer-facing production agent | Not yet; the project says it is not production-ready |

*Table: selection framework, based on the sections above and the official security statement [13][26]*

Then models. DSH has a built-in direct DeepSeek adapter, reaches Anthropic, OpenAI, Kimi, GLM and others via pi-ai, or connects to a self-hosted gateway over OpenAI Chat Completions, OpenAI Responses or Anthropic Messages; OAuth-login providers (such as Codex) are not supported yet. [43] Without credit, Desktop needs a top-up and real-name verification, or you can enter an API key directly. [5]

## Getting started: a reproducible trial path

Only commands and flags from the official docs; preferably in a VM or separate account.

Step 1: check Node. The repo's `package.json` requires Node 22.x at 22.19 or later, or 24 and above. [44]

```bash
node --version
mkdir -p ~/dsh-trial && cd ~/dsh-trial
git init
```

Step 2: start the Web UI. It listens on local port 3080 by default; `--no-open` skips opening a browser. [3][45]

```bash
npx @deepseek-ai/dsh web --no-open
```

Enter your DeepSeek API key under Settings → Models (stored in the credentials file in the DSH home directory), then pick the directory above with Choose workspace. [43]

Step 3: save the plugin tree that actually starts, for later debugging. [4]

```bash
npx @deepseek-ai/dsh --profile web --dump-config > dsh-tree.txt
```

Step 4: a scriptable headless run, read-only first; `--json` emits the event stream line by line. [46][45]

```bash
DSH_PERMISSION_MODE=read-only npx @deepseek-ai/dsh headless --json "Summarize the main modules of this repository"
```

Step 5: compare modes as the docs suggest: one small bug, fixed model, permissions and starting state, run in Standard and in Minimal, then compare completion, tool calls and changes. [10] Under headless, `DSH_TOOLS_MODE=ptc` turns on PTC. [46]

```bash
DSH_TOOLS_MODE=ptc npx @deepseek-ai/dsh headless "Check the JSON files under configs/ against schema.json, write problems to issues.csv, do not modify the originals"
```

Step 6: to skip telemetry, set the environment variable before launch; on Desktop also check the settings toggle. [32][15]

```bash
DSH_TELEMETRY_DISABLED=1 npx @deepseek-ai/dsh web --no-open
```

## Pitfalls to watch

- [ ] **Record the version.** Preview tags land every few days; 0.2.1-alpha.2 removed the mixed tool mode. [8]
- [ ] **The network is outside the sandbox.** The file sandbox governs file writes only; add network isolation outside it to prevent exfiltration. [12]
- [ ] **Check enforcement completeness.** Landlock on older kernels and Windows ACLs enforce only partially. [12]
- [ ] **Approval with no answerer.** `ask` with no answerer yields `unavailable`, i.e. denied; in headless or CI runs without a UI, do not mistake it for task failure (my inference from the docs, untested). [29]
- [ ] **Don't grant full access lightly.** Under `danger-full-access` approval becomes `never`; there is no confirmation. [32]
- [ ] **PTC side effects don't roll back.** Failed programs are not replayed, but writes already done may have landed. [18]
- [ ] **Auto review is experimental.** It may pass dangerous actions and costs extra tokens. [31]
- [ ] **Review diffs when delegating to Claude Code or Codex.** Child workspace changes don't enter the parent session. [23]
- [ ] **Plugins are code.** Download only from official channels and read third-party plugin source first; an HN user mentioned a third-party packaging site on a similar-looking domain. [13][2]
- [ ] **Changing core behavior means maintaining patches.** Replacing a core plugin by id is easy; merging it on each upgrade is on you. [28]
- [ ] **Source build size.** One HN user reports about 47MB downloaded and about 1.5GB after building, mostly dependencies. [1]
- [ ] **Not your only safety control.** The project advises least privilege, ideally a disposable VM or container, backups, and reviewing plugins and commands before running. [13]

## Closing

What matters in DeepSeek Harness isn't the desktop installer but that it splits the harness into replaceable layers: the loop is a plugin, tool presentation is a registry setting, modes are presets, safety is three knobs guarding separate stages, and all of it answers to a replayable session log. Teams building or seriously comparing harnesses can use it as a base; teams wanting a stable coding assistant can wait until it leaves preview.

## References

1. Hacker News. "DeepSeek Harness developer preview" thread (2026-08-13): <https://news.ycombinator.com/item?id=49285244>
2. Hacker News. "DeepSeek Harness Desktop for macOS and Windows" thread (2026-10-02): <https://news.ycombinator.com/item?id=49929489>
3. deepseek-ai/deepseek-harness. README (MIT): <https://github.com/deepseek-ai/deepseek-harness>
4. deepseek-ai/deepseek-harness. docs/architecture.md: <https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md>
5. AI Front / 36Kr. "DeepSeek Harness desktop preview is live" (Chinese, 2026-09-25): <https://eu.36kr.com/zh/p/3998199345500040>
6. DeepSeek. DeepSeek Harness official page (Chinese): <https://www.deepseek.com/harness>
7. DeepSeek. DeepSeek Harness official page (English): <https://www.deepseek.com/en/harness/>
8. deepseek-ai/deepseek-harness. Releases (incl. dsh-v0.2.1-alpha.1 / alpha.2 notes): <https://github.com/deepseek-ai/deepseek-harness/releases>
9. deepseek-ai/deepseek-harness. Agent Note: Rename code-mode to ptc (2026-08-25): <https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/archived/architecture/2026-08-25-rename-code-mode-to-ptc.md>
10. deepseek-ai/deepseek-harness. Built-in mode guide copy, guide-locales.ts: <https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-agent-preset/src/client/guide-locales.ts>
11. deepseek-ai/deepseek-harness. packages/bundle/web-app/presets (the four shipped presets): <https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/bundle/web-app/presets>
12. deepseek-ai/deepseek-harness. docs/subsystems/sandbox.md: <https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/sandbox.md>
13. deepseek-ai/deepseek-harness. SAFETY.md: <https://github.com/deepseek-ai/deepseek-harness/blob/master/SAFETY.md>
14. A Programming Paradigm for Spatiotemporal Composability (Cordis paper, arXiv 2608.25512): <https://arxiv.org/abs/2608.25512>
15. deepseek-ai/deepseek-harness. apps/desktop README: <https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/desktop/README.md>
16. Hacker News. Comment by SwellJoe on the append-only session log: <https://news.ycombinator.com/item?id=49288435>
17. deepseek-ai/deepseek-harness. docs/subsystems/compaction.md: <https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/compaction.md>
18. deepseek-ai/deepseek-harness. Agent Note: PTC mode (2026-06-15): <https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/feature/2026-06-15-ptc.md>
19. Cloudflare. Code Mode (cited by the PTC design note): <https://blog.cloudflare.com/code-mode/>
20. deepseek-ai/deepseek-harness. docs/subsystems/ptc-runtime.md: <https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/ptc-runtime.md>
21. Pi Documentation. Codemode: <https://pi.dev/docs/latest/codemode>
22. deepseek-ai/deepseek-harness. packages/subagent/subagent README: <https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/subagent/subagent/README.md>
23. deepseek-ai/deepseek-harness. dsh-subagent-claude-code README: <https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/subagent/subagent-claude-code/README.md>
24. deepseek-ai/deepseek-harness. dsh-subagent-codex README: <https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/subagent/subagent-codex/README.md>
25. deepseek-ai/deepseek-harness. docs/subsystems/agent-team.md: <https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/agent-team.md>
26. deepseek-ai/deepseek-harness. dsh-hooks-claude-code README: <https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/experimental/hooks-claude-code/README.md>
27. deepseek-ai/deepseek-harness. dsh-hooks-codex README: <https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/experimental/hooks-codex/README.md>
28. Hacker News. Comment by wren6991 on Desktop telemetry and downstream patches: <https://news.ycombinator.com/item?id=49933838>
29. deepseek-ai/deepseek-harness. docs/subsystems/approval.md: <https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/approval.md>
30. deepseek-ai/deepseek-harness. dsh-client-ui-permission-presets README: <https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-permission-presets/README.md>
31. deepseek-ai/deepseek-harness. dsh-experimental-auto-review README: <https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/experimental/auto-review/README.md>
32. deepseek-ai/deepseek-harness. packages/bundle/base/cordis.patch.yml (shared defaults): <https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/base/cordis.patch.yml>
33. deepseek-ai/deepseek-harness. docs/tool-execution-pipeline.md: <https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/tool-execution-pipeline.md>
34. deepseek-ai/deepseek-harness. docs/subsystems/product-telemetry.md: <https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/product-telemetry.md>
35. Anthropic. Claude Code Docs: Plugins: <https://code.claude.com/docs/en/plugins>
36. Anthropic. Claude Code Docs: Sandboxing: <https://code.claude.com/docs/en/sandboxing>
37. Anthropic. Claude Code Docs: Permissions: <https://code.claude.com/docs/en/permissions>
38. Anthropic. Claude Code Docs: Subagents: <https://code.claude.com/docs/en/sub-agents>
39. OpenAI. Codex Docs: Sandbox and approvals: <https://developers.openai.com/codex/sandbox>
40. OpenCode Docs: Permissions: <https://opencode.ai/docs/permissions/>
41. OpenCode Docs: Agents: <https://opencode.ai/docs/agents/>
42. earendil-works/pi. README (Permissions & Containerization): <https://github.com/earendil-works/pi>
43. deepseek-ai/deepseek-harness. docs/user/guide/providers.md: <https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/providers.md>
44. deepseek-ai/deepseek-harness. package.json (engines field): <https://github.com/deepseek-ai/deepseek-harness/blob/master/package.json>
45. deepseek-ai/deepseek-harness. docs/cli-help.md: <https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cli-help.md>
46. deepseek-ai/deepseek-harness. dsh-headless README: <https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/headless/README.md>
