---
title: "The Agent Harness Pattern: Lessons from Claude Code's Core Loop"
pubDate: 2026-04-07T00:00:00.000Z
description: "What makes a production agent loop survive the real world? We extract the Agent Harness Pattern from Claude Code's source — a generalizable blueprint for building resilient, self-recovering AI agent runtimes."
author: 'Remy'
tags: ['harness-engineering', 'agent-harness', 'claude-code', 'react-pattern', 'llm-engineering']
lang: 'en'
translatedFrom: 'inside-claude-code-agent-harness'
---

## Beyond the Textbook ReAct Loop

Every tutorial on AI agents shows the same diagram:

```
Reason → Act → Observe → Repeat → Done
```

It's elegant. It fits on a slide. And it will crash and burn the moment it touches production.

Real-world agent loops must handle streaming interrupts, context window overflow, API rate limits, tool execution timeouts, user cancellations, model fallbacks, and a dozen other failure modes — all while maintaining a coherent conversation state. The gap between the textbook loop and a production-grade agent runtime is where **harness engineering** lives.

After reading Claude Code's open-source `query.ts` line by line, I found a pattern that generalizes well beyond this specific codebase. I'm calling it the **Agent Harness Pattern**.

## The Core Insight: A Loop Is Not Enough

Claude Code's agent loop is, at its skeleton, a standard ReAct loop:

```typescript
// query.ts:307 — the actual loop
while (true) {
  // Reason + Act: call the model
  for await (const msg of callModel({...})) {     // :659
    if (msg has tool_use blocks) needsFollowUp = true
  }
  // Observe: no tools called → done
  if (!needsFollowUp) return { reason: 'completed' }  // :1357
  // Execute tools, append results, continue
  for await (const update of runTools(...)) { ... }    // :1384
  state = { messages: [...old, ...assistant, ...toolResults] }
}
```

Five lines of pseudocode. But the real file is ~1,700 lines. Where do the other 1,695 lines go?

They go into the **harness** — the infrastructure that wraps the bare loop and makes it production-ready.

## The Agent Harness Pattern

After extracting the recurring structures from Claude Code, the pattern has five layers:

### Layer 1: Context Management (Before the API Call)

Before each iteration sends messages to the model, a production harness must **compress, trim, and reshape** the context to fit within limits.

Claude Code runs a pipeline of four compactors in sequence:

| Compactor | What It Does | Code Reference |
|---|---|---|
| `applyToolResultBudget` | Caps per-message tool result size | `query.ts:379` |
| `snipCompactIfNeeded` | Removes stale middle-history | `query.ts:403` |
| `microcompactMessages` | Collapses verbose tool outputs | `query.ts:414` |
| `autoCompactIfNeeded` | Full LLM-powered summarization | `query.ts:454` |

**The lesson:** Context is not "just append messages." A production harness needs a compaction pipeline that runs before every API call, preserving the most relevant information while staying under token limits.

### Layer 2: Streaming Execution (During the API Call)

The textbook loop waits for the full response, then executes tools. Claude Code does something smarter — it starts executing tools *while the model is still streaming*:

```
API stream:  ┃ text ┃ tool_A ┃ text ┃ tool_B ┃ end ┃
                       │                 │
              addTool(A)│        addTool(B)│
                  ▼     │            ▼    │
Tools:       ┏━━━━━━━━━┿━━━━━┓  ┏━━━━━━━┿━━┓
             ┃ exec A  │     ┃  ┃ exec B│  ┃
             ┗━━━━━━━━━┿━━━━━┛  ┗━━━━━━━┿━━┛
```

The `StreamingToolExecutor` (`StreamingToolExecutor.ts:40`) maintains a state machine for each tool (`queued → executing → completed → yielded`) and partitions them into concurrent-safe and serial batches via `partitionToolCalls` (`toolOrchestration.ts:91`).

**The lesson:** Don't wait for the full response. A streaming executor that overlaps model output with tool execution can cut turn latency significantly. Partition tools by safety — read-only tools can run in parallel, write tools must be serialized.

### Layer 3: Recovery Paths (After the API Call)

This is where Claude Code's harness truly distinguishes itself. The loop has **7 distinct recovery paths** — each a `state = next; continue` that retries the iteration with adjusted parameters:

| Recovery | Trigger | Strategy |
|---|---|---|
| Collapse drain | Prompt too long (413) | Commit staged context collapses |
| Reactive compact | 413 persists | Full LLM summarization on the spot |
| Token escalation | Output truncated at 8k | Retry at 64k limit |
| Multi-turn recovery | Output still truncated | Inject "resume directly" prompt |
| Stop hook retry | Hook reports blocking errors | Append error, retry |
| Token budget continuation | Budget not exhausted | Inject nudge to keep going |
| Normal next turn | Tools executed | Append results, continue |

Each recovery path writes a new `State` object with a `transition` tag (e.g., `{ reason: 'reactive_compact_retry' }`) that prevents infinite loops — if the same recovery fires twice in a row without progress, it falls through to the next strategy or exits.

**The lesson:** Don't just `try/catch` and bail. A production harness should have a **recovery ladder** — multiple strategies ordered from cheapest to most expensive, with circuit breakers to prevent loops.

### Layer 4: Termination Conditions (When to Stop)

The textbook says "stop when the model doesn't call tools." Reality demands 10 distinct exit paths:

```
completed          — Model finished naturally (no tool calls)
max_turns          — Turn limit reached
aborted_streaming  — User interrupted during API call
aborted_tools      — User interrupted during tool execution
prompt_too_long    — Context overflow, all recovery exhausted
model_error        — API threw an unrecoverable error
blocking_limit     — Hard token ceiling hit
image_error        — Media processing failed
stop_hook_prevented — External hook vetoed continuation
hook_stopped       — Hook signaled hard stop
```

Each exit yields a `Terminal` object with a `reason` field, giving the caller full observability into *why* the loop ended.

**The lesson:** "Done" is not one state. A production harness needs typed terminal states so callers can distinguish user cancellation from context overflow from natural completion — and react accordingly.

### Layer 5: State Threading (Across Iterations)

The loop carries a mutable `State` object across iterations:

```typescript
// query.ts:204
type State = {
  messages: Message[]
  toolUseContext: ToolUseContext
  autoCompactTracking: AutoCompactTrackingState | undefined
  maxOutputTokensRecoveryCount: number
  hasAttemptedReactiveCompact: boolean
  turnCount: number
  transition: Continue | undefined  // why we continued
  // ... more fields
}
```

At every `continue` site, a fresh `State` is constructed with the exact fields needed for the next iteration. The `transition` field creates an audit trail of recovery decisions.

**The lesson:** Don't use scattered mutable variables. Bundle loop state into a single typed object that is reconstructed at each continue site. This makes the loop's behavior inspectable and testable.

## The Pattern, Generalized

Strip away Claude Code specifics and the Agent Harness Pattern looks like this:

```
┌─────────────── Agent Harness ───────────────┐
│                                              │
│  while (true) {                              │
│    ┌─ Context Pipeline ─────────────────┐    │
│    │  compress → trim → reshape         │    │
│    └────────────────────────────────────┘    │
│              │                               │
│    ┌─ Model Call (streaming) ───────────┐    │
│    │  yield events                      │    │
│    │  start tools in parallel           │    │
│    └────────────────────────────────────┘    │
│              │                               │
│    ┌─ Recovery Ladder ──────────────────┐    │
│    │  cheapest fix first                │    │
│    │  circuit breakers on each          │    │
│    │  fall through on failure           │    │
│    └────────────────────────────────────┘    │
│              │                               │
│    ┌─ Termination Check ────────────────┐    │
│    │  typed exit reasons                │    │
│    │  caller can distinguish why        │    │
│    └────────────────────────────────────┘    │
│              │                               │
│    ┌─ Tool Execution ──────────────────┐     │
│    │  partition: concurrent vs serial   │    │
│    │  collect results → state.messages  │    │
│    └────────────────────────────────────┘    │
│              │                               │
│    state = new State({...})                  │
│  }                                           │
└──────────────────────────────────────────────┘
```

## Why This Matters

If you're building an AI agent — whether a coding assistant, a data pipeline orchestrator, or an autonomous research tool — you'll eventually need to solve the same problems Claude Code solves:

1. **Context won't fit.** You need a compaction pipeline.
2. **APIs fail.** You need a recovery ladder.
3. **Users interrupt.** You need clean abort handling.
4. **Tools conflict.** You need concurrency partitioning.
5. **"Done" has many meanings.** You need typed terminal states.

The ReAct loop is the kernel. The harness is what makes it a product.

## Takeaway

Next time you build an agent loop, don't start with the LLM call. Start with the harness. Ask yourself: what happens when the context overflows? When the model hallucinates a tool name? When the user hits Ctrl+C mid-tool? When the API returns a 413 three times in a row?

If your loop doesn't have answers to those questions, you don't have a harness — you have a demo.
