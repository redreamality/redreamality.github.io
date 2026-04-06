---
title: "Anatomy of Claude Code's Agent Loop: A ReAct Loop on Steroids"
pubDate: 2026-04-06T00:00:00.000Z
description: "A deep dive into how Claude Code's agent loop actually works under the hood — from the entry point down to streaming tool execution, with exact file paths and line numbers."
author: 'Remy'
tags: ['claude-code', 'agent-loop', 'react', 'architecture']
lang: 'en'
translatedFrom: 'anatomy-of-claude-code-agent-loop'
---

## The Question That Started It All

I was staring at the Claude Code open-source repository, wondering: *how does the agent loop actually work?* Not the hand-wavy "it calls the API and runs tools" explanation — I wanted the real call stack, the exact control flow, the termination conditions. So I dug in.

What I found was a ~1700-line `while(true)` loop that is, at its core, a classic **ReAct (Reasoning + Acting) loop** — but wrapped in so many layers of engineering that the simple pattern is almost invisible.

## The Full Call Stack

Here's the complete invocation chain, from user input to the spinning agent loop:

```
CLI REPL (cli/print.ts:2147)
  └─ ask() — QueryEngine.ts:1186
       └─ new QueryEngine().submitMessage() — QueryEngine.ts:209
            ├─ fetchSystemPromptParts() — build system prompt
            ├─ processUserInput() — handle slash commands
            └─ for await (msg of query()) — QueryEngine.ts:675
                 └─ query() — query.ts:219
                      └─ queryLoop() — query.ts:241  ★ THE LOOP
```

The `QueryEngine` is the session layer — it manages message history, usage tracking, and transcript persistence. The actual agent loop lives in `queryLoop()`.

## Inside the while(true)

Each iteration of the main loop represents **one API round-trip**. Here's what happens:

### Phase 1: Context Preparation (line 365–550)

Before calling the API, the loop applies a cascade of context management strategies:

1. **Tool result budget** — cap aggregate tool output size
2. **Snip compact** — surgically remove old message segments
3. **Microcompact** — compress individual tool results
4. **Context collapse** — project a collapsed view of history
5. **Auto-compact** — full summarization when context gets too large

This is one of the most engineering-heavy parts. The context window is a finite resource, and the loop manages it aggressively.

### Phase 2: Streaming API Call (line 659–863)

```typescript
for await (const message of deps.callModel({
  messages: prependUserContext(messagesForQuery, userContext),
  systemPrompt: fullSystemPrompt,
  tools: toolUseContext.options.tools,
  signal: toolUseContext.abortController.signal,
  // ...
}))
```

`deps.callModel` is `queryModelWithStreaming()` (services/api/claude.ts:752), which wraps the Anthropic SDK's streaming API. But here's the key insight — **tool execution starts during streaming**:

```typescript
if (streamingToolExecutor && !aborted) {
  for (const toolBlock of msgToolUseBlocks) {
    streamingToolExecutor.addTool(toolBlock, message)  // line 842
  }
}
```

The `StreamingToolExecutor` (services/tools/StreamingToolExecutor.ts:40) tracks tools through a state machine: `queued → executing → completed → yielded`. While the model is still generating text and more tool calls, earlier tools are already running.

### Phase 3: The Decision Point (line 1062)

After streaming completes, one boolean decides everything:

```typescript
if (!needsFollowUp) {
  // No tool calls → try recovery or exit
  return { reason: 'completed' }
}
// Has tool calls → execute remaining tools → continue loop
```

This is the ReAct termination condition: **if the model didn't call any tools, it's done**.

### Phase 4: Tool Execution (line 1360–1408)

Tools are orchestrated by `runTools()` (services/tools/toolOrchestration.ts:19), which partitions tool calls into batches:

- **Concurrent-safe tools** (reads, searches) run in parallel (up to 10)
- **Non-concurrent tools** (writes, edits) run serially

Each tool call goes through `runToolUse()` (services/tools/toolExecution.ts:337), which handles permission checking, input validation, and the actual tool invocation.

### Phase 5: Next Iteration (line 1715–1728)

```typescript
state = {
  messages: [...messagesForQuery, ...assistantMessages, ...toolResults],
  turnCount: nextTurnCount,
  transition: { reason: 'next_turn' },
}
// Back to while(true)
```

The loop assembles the full message history (original + assistant response + tool results) and continues.

## The Recovery Machine

What makes this more than a textbook ReAct loop is the **7 recovery paths** — cases where the loop `continue`s instead of returning:

| Recovery Path | Trigger | What Happens |
|---|---|---|
| Collapse drain | Context too long (413) | Drain staged context collapses |
| Reactive compact | 413 after collapse | Emergency summarization |
| Token escalation | Output hit 8k cap | Retry with 64k limit |
| Multi-turn recovery | Output still truncated | Inject "resume" prompt, retry up to 3x |
| Stop hook blocking | Hook returns errors | Inject error, let model fix itself |
| Token budget continuation | Budget remaining | Inject nudge to keep going |
| Normal next turn | Tool calls present | Standard ReAct cycle |

And **10+ termination conditions**: `completed`, `max_turns`, `aborted_streaming`, `aborted_tools`, `prompt_too_long`, `model_error`, `blocking_limit`, `stop_hook_prevented`, `hook_stopped`, `image_error`.

## Is It Really a ReAct Loop?

Yes. Strip away the recovery logic, the context management, and the streaming optimization, and the skeleton is:

```
while (true) {
  response = callModel(messages)           // Reason + Act
  if (no tool calls in response) break     // Final Answer
  results = executeTools(response.tools)   // Observe
  messages += response + results           // Append
}
```

But the differences from a textbook implementation are significant:

| Aspect | Classic ReAct | Claude Code |
|---|---|---|
| Thought/Action | Separate text parsing | Native API `tool_use` blocks |
| Tools per turn | 1 | Multiple, concurrent |
| Execution timing | After response | **During streaming** |
| Context management | None | 5-layer compression cascade |
| Error recovery | None | 7 recovery paths |
| Termination | Parse "Final Answer:" | `tool_use blocks === 0` |

## The Takeaway

Claude Code's agent loop is a masterclass in production engineering around a simple pattern. The ReAct skeleton is maybe 20 lines of logic. The other 1680 lines handle everything that goes wrong in the real world: context overflow, output truncation, model fallback, user interruption, and graceful degradation.

If you're building your own agent loop, start with the 20-line version. But know that the gap between "works in a demo" and "works in production" is roughly 1700 lines of hard-won edge case handling.
