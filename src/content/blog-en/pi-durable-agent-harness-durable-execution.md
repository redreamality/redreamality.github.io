---
title: "What Durable Agent Harnesses Actually Guarantee: Pi Durable in Context"
seoTitle: "Pi Durable vs Temporal, Durable Objects, LangGraph: durable agent harnesses"
description: "When an agent must keep going after a crash, do you need Pi Durable, Temporal, Durable Objects, or a LangGraph checkpointer? What checkpoints, tool replay, and requestId each protect, and what durable still cannot guarantee for external side effects."
pubDate: 2026-10-19T22:30:00+08:00
author: "Remy"
tags: ["agent-harness", "ai-agents", "developer-tools"]
lang: "en"
---

Most coding agents assume someone is watching the terminal. If the process dies, you inspect the damage and click continue. [Pi Durable](https://earendil.com/posts/pi-durable/), shipped by Earendil with Pi 1.0, targets a different job: Slack on-call bots, overnight investigations, support workspaces where several people chase the same incident. Nobody is sitting at a TTY, so the session has to survive crashes, rolling deploys, and dropped clients, on any JavaScript runtime. In practice that is an experimental harness of about 15,000 lines without tests, keeping storage, checkpoints, tool replay, forks, documents, and multiplayer views on one atomic commit line.[1]

Related reading on this site covers [environment legibility](/blog/ai-harness-environment-legibility/), the [Claude Code harness pattern](/blog/inside-claude-code-agent-harness/), [Strands as a production runtime](/blog/strands-harness-sdk-production-agent-runtime/), and [where exactly-once lives](/blog/exactly-once-model-harness-tool-contract/). After those pieces, the next question is usually which layer Pi Durable, Temporal, Durable Objects, and LangGraph checkpointers each own when progress is lost versus when a write can fire twice.

[![Screenshot of Earendil’s Pi Durable announcement](/assets/pi-durable-agent-harness-durable-execution/earendil-pi-durable.webp)](https://earendil.com/posts/pi-durable/)

*Earendil: Pi Durable ships with Pi 1.0 for agent sessions that can resume on any JS runtime.[1]*

## What “harness” means here

Pi’s definition is blunt: storage, plus the machinery to run one or more LLM conversations in parallel, plus the tools those models call and the execution environments those tools run in.[1]

A conversation leaves a chronological conversation record (the Pi docs call it a transcript). An agent is the model, its settings, and the tools it may call; tools touch files or a shell only through an execution environment. Every step the harness runs, model request, tool call, or a state machine you define, is scheduled as a task. Recovery therefore has a clear unit: not “what the model roughly said,” but “which task stopped at which checkpoint.”[1]

That also splits duties from the terminal Pi coding agent. Both share pi-ai and a minimal, malleable ethos, but the coding agent serves one person on one machine, while Durable serves any surface, long-lived sessions, and several humans steering the same agent.[1] Picture a support workspace: the main channel is debugging a failed deploy while someone opens a thread about rollback. If both conversations live only in process memory, a container roll wipes them. Durable is meant to keep that kind of cross-process session state.

The npm package `@earendil-works/pi-durable` (1.3.0 at writing) commits conversations, model turns, tool calls, and app state before anything is shown, so reopening storage resumes after a crash. The package is experimental.[2] About 15,000 readable lines let an agent modify the harness; storage backends (~3,000 lines) are often skippable when extending.[1]

[![Screenshot of the npm page for @earendil-works/pi-durable](/assets/pi-durable-agent-harness-durable-execution/npm-pi-durable.webp)](https://www.npmjs.com/package/@earendil-works/pi-durable)

*npm: experimental durable conversation, task, and document runtime.[2]*

## Three different guarantees: checkpoints, replay, requestId

Three mechanisms sound like “exactly once” and protect three different things.

Task checkpoints land before each phase advances. After a new process opens storage and calls `resume()`, unfinished work continues from the last checkpoint. A cut-off model request is sent again, and the conversation record keeps the partial answer marked aborted; messages already in the inbox stay queued.[1][2] Consequence: an overnight migration that OOMs at 3 a.m. need not restart from the first diff, but you still accept that truncated model answer sitting in history.

Tool replay policy commits the tool’s intent before `execute()` runs. After a crash, only tools declared `replay: "safe"` rerun automatically; otherwise the model gets an interrupted result plus whatever output was already committed, and decides what to do.[1][2] Searching an issue tracker can be safe because a second search is usually harmless. A refund or deploy usually is not: if the process dies after the charge left your process but before the receipt was committed, auto-replay becomes a second charge. MindStudio’s reading matches the design: durable is conservative by default; replay only when declared.[3]

requestId gives exactly-once admission. Retrying a submit with the same requestId returns the original submission instead of admitting the same user text twice.[1][2] On HN someone doubted that an ID alone yields exactly-once; maintainers answered that the requestId *is* the idempotency key for admission.[4] That lines up with this site’s [exactly-once piece](/blog/exactly-once-model-harness-tool-contract/): admission exactly-once is not end-to-end exactly-once for external side effects. Even if the submit is not double-admitted, a refund tool still needs a payment-side key or a task phase that is safe to rerun.

Custom `defineTask` machines add phases, waiting children, and `failFast` so one declined card aborts sibling payments and runs abort refunds. The checkout example folds structured concurrency, ownership, and phase checkpoints into one API instead of inventing a separate workflow DSL.[1][2] Approvals that must survive a restart belong in a task memo where the first write wins, so a reboot does not ask again.[1]

Busy-conversation inboxes matter in products. Default follow-ups start after the current run answers; `whenBusy: "steer"` joins after the current tool round to redirect work in flight; `reject` refuses. In a support workspace where three people @mention the agent at once, without a durable inbox you invent a queue that dies with the process.[1][2]

![Diagram of checkpoints and tool replay policy](/assets/pi-durable-agent-harness-durable-execution/diagram-checkpoint-en.svg)

*On recovery: safe tools may rerun; undeclared tools report interrupted. requestId covers admission, not external side effects.[1][2]*

Subagents are ordinary conversations owned by the tool task that created them. Mark the tool `replay: "safe"` and a rerun finds the same child and the same requestId submission.[1] Ownership decides abort scope: Esc tears down owned tasks and child conversations bottom-up, while `background: true` work can outlive the turn, useful for “check the weather in two minutes.”[1][2]

## Storage, forks, documents, malleability

Built-in backends include Memory, SQLite, JSONL, and a Durable Object SQLite adapter; SQLite/JSONL cores avoid Node APIs for Bun or DO, and custom backends should pass conformance first.[2] One process owns a storage. Default SQLite survives process crashes but may lose the newest commit on host power loss.[2][3] Prefer SQLite over JSONL for long agents; claim durability on Postgres or KV only after conformance.[2]

Memory holds only the working set: active conversation records, live tasks, and pending submissions. Active records are bounded by the model window because compaction summarizes before overflow, so a conversation with tens of thousands of messages can still fit if you accept summarization loss and keep older messages searchable in storage.[1] “Who decided on Postgres last week?” in a support workspace comes from stored history, not from a verbatim window.

One harness runs many conversations at once. `fork` branches at an entry; the child sees parent history up to that point without copying the whole record.[1] In support, the channel is one conversation and a thread is a fork of a reply: both run without blocking each other. HN asked why Durable dropped the old entry-parent tree; maintainers called that coding-agent design the worse one. A conversation is now a chronological immutable list, with parentage hanging off an entry in another conversation, same capability, flatter structure.[4]

Typed documents change in the same commits as the conversation record, with fork policies asOf, current, or initial. UIs subscribe to committed state; late joiners start from the current view instead of replaying the full event stream.[1][2] If ticket state lives in another database while the conversation record lives in the harness, a crash can leave “model thinks closed, DB still open.” Documents shrink that tear to one commit.

The registry can hot-replace an extension under the same name: in-flight calls finish on old code, the next call uses new code, and conversations store names rather than code.[1] You can change agent behavior without stopping sessions, but old and new code may briefly coexist, so tests must cover that edge.

Compaction is itself a task: background summary near the window limit, blocking only when the next request would not fit. Older messages stay searchable. `reset` or handoff starts a new context without deleting history.[1][2] Persistence solves process death; it does not enlarge the context window.[3]

## Platform glue: Cloudflare, Vercel, Rivet

Pi Durable is a library. Idle hibernation, alarms, and function-timeout takeover come from platforms.

On Cloudflare, a follow-up post maps one Pi session to one Durable Object: embedded SQLite, hibernatable WebSockets, and Pi scheduled work projected onto the object alarm. On wake, the object restores event streams and recomputes alarms from the persisted task set. Alarms are at-least-once, so handlers must be idempotent and stable schedule requestIds must prevent submitting “check weather in two minutes” twice.[5] A support bot can sleep when nobody is talking and wake on schedule without a always-on VM.

[![Screenshot of Pi Durable on Cloudflare](/assets/pi-durable-agent-harness-durable-execution/earendil-cloudflare.webp)](https://earendil.com/posts/pi-durable-on-cloudflare/)

*One session per Durable Object: hibernation, alarms, forks, search subagents.[5]*

On Vercel, recommended `durable-harness/pi-durable` runs Pi 1.0’s full Harness on a Workflow SDK World log; `durable-harness/pi` wraps only the agent loop. After a crash or timeout, a new function continues from the log: model calls rerun, safe tools rerun, others return interrupted or possibly run. Chat routes, Queues delivery, `recoverAfterMs` (default 120 seconds without a commit can look like a crash), and virtual workspaces or Sandboxes keep tools off the function’s local disk.[6][7] If a refund tool runs ninety seconds without writing output, the default takeover window may steal the turn, raise the limit for that class of tool.

[![Screenshot of Vercel Running Agent Harnesses Durably](/assets/pi-durable-agent-harness-durable-execution/vercel-agent-harnesses.webp)](https://vercel.com/docs/agent-harnesses)

*Sessions live in a durable log; Queues redeliver after a function dies.[6]*

[![Screenshot of Vercel Running Pi Durably](/assets/pi-durable-agent-harness-durable-execution/vercel-pi-durable.webp)](https://vercel.com/docs/agent-harnesses/pi)

*Recommended variant: full Harness with extensions, compaction, and forks.[7]*

On Rivet, the agent lives in an Actor’s SQLite, sleeps when idle, and resumes after crashes or upgrades, Pi Durable underneath. Without a sandbox, read/write/edit land in the Actor database; bash needs a sandbox. Upgrades give running work up to a default fifteen-minute grace window.[8] A tool that ignores abort signals blocks sleep and upgrades, which shows up as “deploy stuck, object will not sleep.”

[![Screenshot of Rivet’s Pi agent docs](/assets/pi-durable-agent-harness-durable-execution/rivet-pi.webp)](https://rivet.dev/agents/docs/pi/)

*Rivet Actor plus Pi Durable: one agent per key, sleep when idle.[8]*

All three prove the same split: checkpoint, replay, and fork semantics travel; hibernation, leases, queues, and alarms are platform features. Pick the cloud you already run, then embed Pi Durable if it fits. Watch the platform pits: Cloudflare alarms are at-least-once, Vercel silence can look like a crash, Rivet tools must honor abort.[5][7][8]

## How this compares to general durable execution

Spread the map into four layers. Left is closer to agent-graph semantics; right is stronger at cross-service orchestration.

![Four-layer durable stack comparison](/assets/pi-durable-agent-harness-durable-execution/diagram-stack-en.svg)

*Rightward: stronger cross-service timers and signals. Leftward: closer to the model loop and tool policy.[1][6][9]*

| Concern | Pi Durable | LangGraph checkpointer | Temporal-class full replay | Restate / DBOS / Inngest | CF Workflows / DO hosting |
| --- | --- | --- | --- | --- | --- |
| Recovery unit | task / conversation | graph node state | workflow event history | step / journal | DO state or workflow step |
| Model calls | cut-off → resend | your design | must be Activities | must be steps | must be persisted |
| Tool side effects | explicit `replay` | your job | Activity + idempotency | step idempotency | your job |
| Multi-convo / fork | first-class | build it | build it | build it | depends on glue |
| Long waits / signals | timers + platform alarms | weak | strong (Signals) | strong | alarms / managed FSM |
| What you buy | agent-semantics library | graph state | orchestration engine | code-first orchestration | object lifecycle |

Temporal (and Azure Durable Functions) event-source workflows: on resume the workflow function re-executes from the top while recorded Activity results inject without re-running. Orchestration must be deterministic; LLM and tool I/O belong in Activities.[9] You get industrial long sleeps and approval signals, but conversation records, compaction, steer, forks, and replay labels still grow on Activity boundaries. For “wait three days for approval, then fulfill,” this layer often fits better than an agent harness.

Restate, DBOS, and Inngest memoize finished steps; good for ordinary-function workflows, but you still decide how agent turns, tool failures, and forks map onto steps.[9] Cloudflare Workflows keep steps in the platform; Durable Objects keep code on a hibernatable object, which is what Pi Durable on Cloudflare embeds.[5][9] LangGraph checkpointers resume a single graph and usually miss day-long waits, function-timeout takeover, and multiplayer steer; with Temporal you can keep an in-memory checkpointer.[9][10]

A practical contrast is where you draw the determinism boundary. Temporal forces deterministic workflow code and side effects in Activities. Pi Durable forces tool authors to declare replay and conversation state into commits. LangGraph forces clear node boundaries and serializable state. All three can run again after death, but who may re-execute a side effect differs. The classic failure is transparent framework retry turning one refund into two; exactly-once experiments show transparent sdk-retry hurting success rates for that reason.

HN noted durable agents are quieter than local coding agents, yet majors build here for unattended runs, harness/compute separation, and multiplayer.[4] Checkpoints rebuild harness views, not “browser already on page N,” unless you drive the environment declaratively, snapshot the machine, or return interrupted. Armin: it depends; full sandboxes often need snapshots; many agents do not need full VMs.[4] If the environment is not queryable, durability is a hallucination.

[![Screenshot of the Hacker News thread on Pi Durable](/assets/pi-durable-agent-harness-durable-execution/hn-pi-durable.webp)](https://news.ycombinator.com/item?id=49925969)

*HN: library versus batteries-included SDKs, sandbox state, requestId semantics.[4]*

[![Screenshot of MindStudio’s Pi Durable explainer](/assets/pi-durable-agent-harness-durable-execution/mindstudio-pi-durable.webp)](https://www.mindstudio.ai/blog/pi-durable-long-running-agents)

*MindStudio: experimental APIs, default SQLite power-loss semantics, persistence is not infinite context.[3]*

## Do not weld the words together

“We went durable, so we cannot double-write” usually welds three guarantees: checkpoints for task phases, replay-safe for auto-rerun, requestId for admission only.[1][2][4] Hibernation belongs to the platform; Vercel’s World log continues commits on another function.[5][6][7][8] Debug double refunds via safe tags and payment keys, duplicate prompts via requestId, lost progress via checkpoints.

## What durable does not guarantee

End-to-end exactly-once for external side effects is out of scope for requestId and safe replay; irreversible mail and charges still need contract-level keys (see the exactly-once post). Implicit world state in execution environments, unsnapshotted browsers, undeclarative shells, wall-clock scripts, will disagree with the conversation record after resume. Model context capacity does not grow because full history sits on disk; compaction and handoff remain product problems.[1][3] Default storage power-loss semantics need a separate look: Memory is not durable, and default SQLite may lose the newest commit on host failure.[2][3] APIs are still experimental, so budget migration and conformance tests.[2][8] Sandboxing is not a first-class built-in: execution environments are an interface, and Gondolin-style sandboxes plug in. HN wanted first-class sandboxing; maintainers argue bring-your-own matches malleability.[4]

## Decision framework: do you need this?

![Decision diagram for when you need a durable harness](/assets/pi-durable-agent-harness-durable-execution/diagram-decision-en.svg)

*Ask whether the turn still matters after process death, then side effects and platform needs.[1][6][9]*

Four questions. Human will click Continue after a crash? Terminal Pi or Claude Code may suffice; Slack bots and overnight jobs need durability. Lost progress versus double write? Checkpoints versus tool contracts and keys, not merely a new harness. Need hibernation, alarms, or function-timeout takeover? Glue on Durable Objects, Queues, or Rivet first; multi-day cross-service approval fits Temporal-class engines. Need forks, multiplayer steer, and documents atomic with the conversation record? An agent-native harness like Pi Durable saves glue; a LangGraph checkpointer may suffice for linear graphs.

Three scenes help. An on-call Slack bot, channel as one conversation, thread as a fork, several @mentions, rolling restarts, is a Pi Durable plus Durable Object or Queues sweet spot.[1][5] Overnight migrations that mostly read and open PRs often need only safe replay plus checkpoints; merge and production mutations stay non-safe with external keys. Fulfillment across billing and inventory belongs in Temporal, Restate, or DBOS, with the agent as an Activity or a brain that calls orchestration APIs, not as a fake distributed transaction engine.

My view is direct. For productized multi-surface, recoverable, multi-thread agent apps, Pi Durable is one of the few open libraries with first-class tool replay and conversation forks or documents, which is why Cloudflare, Vercel, and Rivet glue matter. For enterprise cross-system orchestration, pick a Temporal-class engine and cage model calls in Activities. Stack them if you draw the line: harness owns conversation records and tool policy; the orchestration engine owns cross-service lifecycle.

Readable failure labels matter as much as resume: `interrupted`, inbox, owned subagents, and abort trees answer where a charge tool stopped. Without them you only have “the agent said success.”

Do not romanticize the library path. Vendors sell managed products; Pi Durable stays composable, so you still glue hibernation and sandboxes, or buy platform glue when bandwidth is thin.[4] The vocabulary of replay, ownership, and documents remains useful even if you never depend on the package.

## How this connects on-site

See [environment legibility](/blog/ai-harness-environment-legibility/), [Claude Code harness](/blog/inside-claude-code-agent-harness/), [Strands](/blog/strands-harness-sdk-production-agent-runtime/), and [exactly-once](/blog/exactly-once-model-harness-tool-contract/). Classify lost progress versus double write first, then learn replay and ownership, then pick Durable Objects, Queues, or Temporal.

## Closing

Pi Durable pulls agent sessions out of process memory into a commitable, recoverable, forkable, multiplayer state machine, and makes “what may auto-retry” the tool author’s job via replay. Cloudflare, Vercel, and Rivet show that semantics can live inside hibernating objects and queues. It still will not save external side effects, implicit sandbox worlds, context windows, or experimental APIs. Draw the line first: progress versus consistency; agent semantics versus cross-service orchestration. Drawn clearly, durable is leverage, not another retrier that charges twice.

Tool-author default: treat externally mutating tools as non-replayable after a crash, then argue why a few reads may be safe. That matches production truth, and Pi Durable’s own design, better than “the framework will retry.”

## References

1. Earendil, [Pi Durable](https://earendil.com/posts/pi-durable/) (2026-10-01).
2. npm, [@earendil-works/pi-durable](https://www.npmjs.com/package/@earendil-works/pi-durable) README (1.3.0); source in [earendil-works/pi](https://github.com/earendil-works/pi).
3. MindStudio, [Pi Durable: What It Is and Why It Matters for Agent Apps](https://www.mindstudio.ai/blog/pi-durable-long-running-agents) (2026-10-04).
4. Hacker News, [Pi Durable](https://news.ycombinator.com/item?id=49925969) (515 points; requestId, sandbox state, library vs SDK).
5. Earendil, [Pi Durable on Cloudflare](https://earendil.com/posts/pi-durable-on-cloudflare/) (2026-10-16); sample [pi-durable-cloudflare](https://github.com/earendil-works/pi-durable-cloudflare).
6. Vercel, [Running Agent Harnesses Durably](https://vercel.com/docs/agent-harnesses).
7. Vercel, [Running Pi Durably on Vercel](https://vercel.com/docs/agent-harnesses/pi); [vercel-labs/durable-harness](https://github.com/vercel-labs/durable-harness).
8. Rivet, [Pi](https://rivet.dev/agents/docs/pi/) (Agents docs).
9. Comparative survey: ChangeGamer [Durable Execution for Long-Running Agents](https://changegamer.ai/resources/durable-execution-for-agents) and vendor docs (Temporal, Restate, DBOS, Inngest, Cloudflare Workflows).
10. Temporal, [LangGraph integration](https://docs.temporal.io/develop/python/integrations/langgraph) (in-memory checkpointer when Temporal owns durability).
