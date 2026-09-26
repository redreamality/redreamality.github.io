---
title: 'Claude Agent SDK (Python) Learning Guide'
pubDate: 2025-10-17T00:00:00.000Z
description: 'A version-pinned Python guide to query(), ClaudeSDKClient lifecycle, hooks, MCP tools, timeouts and cleanup, with runnable examples and offline verification boundaries.'
author: 'Remy'
tags: ['claude-code', 'vibe-coding', 'python']
---

[Claude Agent SDK for Python](https://github.com/anthropics/claude-agent-sdk-python/tree/v0.1.3) lets a Python application drive Claude Code and consume typed messages. This guide retains the original **claude-agent-sdk==0.1.3** baseline. It is a versioned explanation of that published release, not a recommendation to deploy an old SDK or a claim that these are the newest interfaces.

The practical distinction is between two operations named `query`. Module-level `query()` returns an asynchronous message iterator. `ClaudeSDKClient.query()` sends input and returns `None`; receive the answer through `receive_response()`. Hooks belong in `ClaudeAgentOptions.hooks`, using `HookMatcher` and asynchronous callbacks. There is no separate synchronous client to substitute here.

The examples below separate local checks from requests that contact a model. The local checks need no API key, do not start Claude Code and incur no model usage. Live examples require independently configured authentication and may incur charges. Any suggested live output is a condition to check, not a transcript of an online run.

## Installation and Version Check

The [v0.1.3 README](https://github.com/anthropics/claude-agent-sdk-python/blob/v0.1.3/README.md) specifies Python 3.10+, Node.js and Claude Code 2.0.0+. That is the release's historical prerequisite, not proof that every later CLI works with this old SDK. Install the Python package in a disposable directory with [uv](https://docs.astral.sh/uv/pip/environments/), which manages virtual environments and Python packages:

```bash
uv venv --python 3.12 .venv
uv pip install --python .venv "claude-agent-sdk==0.1.3" "mcp==1.18.0" "anyio==4.11.0"
```

On Windows run the following files with `.venv\Scripts\python.exe`; on macOS or Linux use `.venv/bin/python`. These explicit paths avoid accidentally using a globally installed SDK. Do not activate several environments and infer the version from whichever `python` happens to resolve first.

Save this first example as `inspect_install.py`:

```python
import inspect
from importlib.metadata import version

from claude_agent_sdk import ClaudeAgentOptions, ClaudeSDKClient, HookMatcher, query

def main():
    assert version("claude-agent-sdk") == "0.1.3"
    assert inspect.isasyncgenfunction(query)
    assert inspect.iscoroutinefunction(ClaudeSDKClient.query)
    assert set(inspect.signature(HookMatcher).parameters) == {"matcher", "hooks"}
    ClaudeAgentOptions(max_turns=2, setting_sources=[])
    print("SDK 0.1.3: imports and signatures OK")

if __name__ == "__main__":
    main()
```

```bash
# Windows
.venv\Scripts\python.exe inspect_install.py
# macOS / Linux
.venv/bin/python inspect_install.py
```

Expected local output is `SDK 0.1.3: imports and signatures OK`. This establishes imports and selected signatures, not network connectivity, model access or tool permissions. Package metadata is a clearer version check than assuming every package exposes a particular module attribute.

The MCP and AnyIO pins are intentional. Installing only SDK 0.1.3 in the verification environment resolved MCP 2.2.0; creating an SDK MCP server then failed because `Server.list_tools` was absent. The local examples use MCP 1.18.0 and AnyIO 4.11.0 instead. A successful package installation is not a compatibility test. These historical pins reproduce the tutorial, not a security or support recommendation for a new service.

Before a live run, record `claude --version` and its resolved executable alongside the Python dependency versions. Follow the [official authentication guidance](https://code.claude.com/docs/en/agent-sdk/overview) for your environment; do not place credentials in the script or a committed shell profile. No credentials need to be inspected for the local tests in this article. If the CLI is absent, stop at local validation rather than installing an unrelated package named `claude`.

## Query and Message Types

The [versioned query implementation](https://github.com/anthropics/claude-agent-sdk-python/blob/v0.1.3/src/claude_agent_sdk/query.py) accepts keyword-only `prompt` and optional `options` and `transport`. Use `query(prompt="...")`, not a positional prompt. Its asynchronous iterator yields message objects; neither the iterator nor an arbitrary message should be treated as the final answer string.

`AssistantMessage` can contain several blocks. Inspect `TextBlock` for prose and `ToolUseBlock` for a proposed tool invocation. `ResultMessage` marks a completed turn and carries `is_error`, duration, session information and optional cost data. A text block alone does not establish successful completion: the model may speak before a tool fails or before the transport stops.

Save this live example as `query_once.py`. It includes its own imports, asynchronous entry point and runner:

```python
from contextlib import aclosing
import anyio
from claude_agent_sdk import (
    AssistantMessage, ClaudeAgentOptions, ResultMessage, TextBlock, query,
)

async def main():
    completed = False
    failure = None
    options = ClaudeAgentOptions(max_turns=1, setting_sources=[])
    async with aclosing(query(
        prompt="Reply with the number obtained by adding 2 and 2. Do not use tools.",
        options=options,
    )) as messages:
        async for message in messages:
            if isinstance(message, AssistantMessage):
                for block in message.content:
                    if isinstance(block, TextBlock):
                        print(block.text)
            elif isinstance(message, ResultMessage):
                completed = True
                print(f"result: is_error={message.is_error}")
                if message.is_error:
                    failure = message.subtype
    if failure is not None:
        raise RuntimeError(f"Turn failed: {failure}")
    if not completed:
        raise RuntimeError("Stream ended without ResultMessage")

if __name__ == "__main__":
    anyio.run(main)
```

Run it with the same interpreter command, replacing the filename with `query_once.py`. A successful live execution should answer the arithmetic question and print `result: is_error=False`. Exact wording is not guaranteed. The prompt's request not to use tools is an instruction, not an OS security boundary.

The example drains the iterator before raising a model-result error. In 0.1.3, closing the outer generator with `aclosing` does not reliably close its nested generator in the same task after an early consumer exception. Local testing reproduced a cancellation-scope error in that case. This is a historical cleanup limitation, not a general exception-safety guarantee. For application cancellation, use the explicitly owned client lifecycle below.

Module-level queries ordinarily create separate executions, but calling them absolutely stateless is misleading. This release already has `resume` and `continue_conversation` options. Resuming stored conversation context is different from retaining a connected Python client. Select the behavior deliberately, and record the session identity when diagnosing a continuation problem.

## ClaudeSDKClient Lifecycle and Cleanup

The [client source](https://github.com/anthropics/claude-agent-sdk-python/blob/v0.1.3/src/claude_agent_sdk/client.py) defines this sequence: construct, connect, send, receive, optionally repeat, disconnect. Construction alone does not connect. `async with ClaudeSDKClient(...)` calls `connect()` on entry and `disconnect()` on exit. In a manual lifecycle, put cleanup in `finally`, including when connection initialization raises.

Keep connection and disconnection in the same asynchronous task and context. This version holds an AnyIO task group open across that interval. Connecting inside one task and disconnecting in another is not equivalent to handing an ordinary HTTP client between functions. Share application requests through a queue if needed; give the connected client a clear owner.

Save the following as `lifecycle.py`. The optional `transport` argument exists for a local test fixture; ordinary callers leave it unset. The code sends two prompts sequentially and consumes each result before sending the next:

```python
import anyio
from claude_agent_sdk import ClaudeAgentOptions, ClaudeSDKClient, ResultMessage

async def run_turns(transport=None, seconds=30, cleanup_seconds=5):
    client = ClaudeSDKClient(
        options=ClaudeAgentOptions(max_turns=2, setting_sources=[]),
        transport=transport,
    )
    cleanup_completed = False
    with anyio.CancelScope() as lifecycle_scope:
        try:
            await client.connect()
            for prompt in ("Remember the word cedar. Do not use tools.",
                           "What word did I ask you to remember? Do not use tools."):
                completed = False
                with anyio.fail_after(seconds):
                    await client.query(prompt)
                    async for message in client.receive_response():
                        if isinstance(message, ResultMessage):
                            completed = True
                            if message.is_error:
                                raise RuntimeError(f"Turn failed: {message.subtype}")
                if not completed:
                    raise RuntimeError("Stream ended without ResultMessage")
                print("turn complete")
        except TimeoutError:
            print("turn deadline exceeded; outcome unknown")
            raise
        finally:
            lifecycle_scope.shield = True
            lifecycle_scope.deadline = anyio.current_time() + cleanup_seconds
            await client.disconnect()
            cleanup_completed = True
    if not cleanup_completed:
        raise RuntimeError("cleanup deadline exceeded; resources may remain")
    await anyio.lowlevel.checkpoint()

async def main():
    await run_turns()

if __name__ == "__main__":
    anyio.run(main)
```

Run `lifecycle.py` with the same interpreter. The expected success markers are two lines of `turn complete`. They confirm that two non-error results were consumed, not that the second answer correctly remembered the word: this compact example does not inspect answer content. A model-quality assertion would need to inspect the returned text separately.

The turn timeout scope ends before `disconnect()`. A still-cancelled caller scope can nevertheless interrupt transport cleanup. Enter `lifecycle_scope` before connecting; in `finally`, change that existing scope's `shield` and `deadline`. Do not enter a new shielding scope around `disconnect()`: the SDK must exit its task group in stack order. These are separate turn and cleanup budgets, not startup plus both turns plus shutdown.

Use a positive `cleanup_seconds`. Cleanup gets five seconds by default, shielding cancellation from ancestor AnyIO scopes while its own deadline remains active. The final checkpoint propagates cancellation that arrived during otherwise successful cleanup. If the cleanup deadline expires, the function reports incomplete cleanup instead of success; that error takes precedence over the interrupted turn. Discard that client and let its process supervisor handle remaining resources. Shielding does not cover raw `asyncio.Task.cancel()`, process termination or blocking code that never yields.

There is also a release-specific limit: the v0.1.3 `disconnect()` implementation closes resources through its internal query object. Failure before that object exists is not evidence that every partially started transport was cleaned up. A custom transport must own its partial-start cleanup; a production deployment needs process-level supervision as well. A `finally` block demonstrates an attempted cleanup path, not an unconditional guarantee against leaked child processes.

`Stop` is an agent event, not Python client disposal. `interrupt()` requests interruption over the control channel; it does not replace `disconnect()` or roll back completed tools. After cancellation, record an unknown outcome until the tool's external effects are reconciled. Blindly retrying a deployment, payment or file mutation can duplicate work even when no final response arrived.

## Hooks and Permission Decisions

The [v0.1.3 type definitions](https://github.com/anthropics/claude-agent-sdk-python/blob/v0.1.3/src/claude_agent_sdk/types.py) expose six hook events: `PreToolUse`, `PostToolUse`, `UserPromptSubmit`, `Stop`, `SubagentStop` and `PreCompact`. Register callbacks through options before connecting. Do not copy a TypeScript event table into this release, or invent a client decorator to register events.

A callback receives `input_data`, `tool_use_id` and `context`. It is an `async def` function returning a hook-output dictionary. For `PreToolUse`, an explicit refusal belongs under `hookSpecificOutput` with the matching `hookEventName` and `permissionDecision="deny"`. Returning `{}` contributes no decision; it is not an explicit approval and does not override other permission checks.

Save `hooks_demo.py` below. Its default mode directly tests a callback without a model. The optional `--live` mode asks for a harmless Bash command, while the callback rejects every Bash invocation. Rejecting a whole tool makes this example easier to inspect than a blacklist of command substrings.

```python
import argparse
import anyio
from claude_agent_sdk import (
    ClaudeAgentOptions, ClaudeSDKClient, HookMatcher, ResultMessage,
)

async def deny_bash(input_data, tool_use_id, context):
    if input_data["tool_name"] != "Bash":
        return {}
    print("PreToolUse: deny Bash")
    return {
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": "Bash is disabled in this example",
        }
    }

async def audit_tool(input_data, tool_use_id, context):
    print(f"PostToolUse: {input_data['tool_name']}")
    return {}

def make_options():
    return ClaudeAgentOptions(
        max_turns=2,
        setting_sources=[],
        hooks={
            "PreToolUse": [HookMatcher(matcher="Bash", hooks=[deny_bash])],
            "PostToolUse": [HookMatcher(matcher=None, hooks=[audit_tool])],
        },
    )

async def main(live=False):
    if not live:
        result = await deny_bash(
            {"hook_event_name": "PreToolUse", "session_id": "fixture",
             "transcript_path": "", "cwd": ".", "tool_name": "Bash",
             "tool_input": {"command": "echo hook-check"}},
            "fixture-tool", {"signal": None},
        )
        assert result["hookSpecificOutput"]["permissionDecision"] == "deny"
        make_options()
        print("offline hook contract OK")
        return
    async with ClaudeSDKClient(options=make_options()) as client:
        await client.query("Use Bash to run: echo hook-check")
        completed = False
        async for message in client.receive_response():
            if isinstance(message, ResultMessage):
                completed = True
                print(f"result: is_error={message.is_error}")
                if message.is_error:
                    raise RuntimeError(f"Turn failed: {message.subtype}")
        if not completed:
            raise RuntimeError("Stream ended without ResultMessage")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--live", action="store_true")
    anyio.run(main, parser.parse_args().live)
```

Run `hooks_demo.py` with the same interpreter for deterministic output:

```text
PreToolUse: deny Bash
offline hook contract OK
```

Only add `--live` after configuring and authorizing a model request. The model might not select Bash, so absence of the first log line does not automatically mean hook registration failed. Conversely, a printed refusal from the direct local call does not establish that the CLI enforced it. A live enforcement test must observe an actual tool request and confirm that its side effect did not occur.

`PostToolUse` belongs after a tool has executed. It can support auditing, but cannot undo that execution. Do not log complete prompts, tool inputs or file contents by default: a small diagnostic record containing the event, tool name and invocation ID is often sufficient. The example deliberately logs names rather than command contents.

This demonstration is not a general sandbox. Blocking Bash does not block every way another tool could modify a file or contact a service. Likewise, `allowed_tools` and a prompt are not replacements for filesystem isolation. For a real policy, define permitted operations, explicitly handle unknown tools, and test alternate paths in an isolated workspace. A permission callback under `can_use_tool` is a separate API whose decisions also need the streaming control channel.

## Module Query with Streaming Hooks

The [internal client implementation](https://github.com/anthropics/claude-agent-sdk-python/blob/v0.1.3/src/claude_agent_sdk/_internal/client.py) makes an important version-specific distinction. It passes hooks into the query object, but initializes the control protocol only when the prompt is an asynchronous iterable. Therefore, “module query never supports hooks” is too broad, while “string and streaming prompts are interchangeable” is also wrong for this release.

Place `stream_query.py` beside `hooks_demo.py`; it deliberately imports the callback configuration from that preceding example. The event keeps the input stream open until a result has been received. Without coordinating input completion, a one-message generator can close stdin before a later control response needs to be written.

```python
from contextlib import aclosing
import anyio
from claude_agent_sdk import ResultMessage, query
from hooks_demo import make_options

async def main():
    done = anyio.Event()

    async def prompts():
        yield {
            "type": "user",
            "message": {"role": "user", "content": "Use Bash: echo hook-check"},
            "parent_tool_use_id": None,
            "session_id": "default",
        }
        await done.wait()

    completed = False
    failure = None
    try:
        async with aclosing(query(prompt=prompts(), options=make_options())) as messages:
            async for message in messages:
                if isinstance(message, ResultMessage):
                    completed = True
                    done.set()
                    if message.is_error:
                        failure = message.subtype
                    else:
                        print("stream result received")
    finally:
        done.set()
    if failure is not None:
        raise RuntimeError(f"Turn failed: {failure}")
    if not completed:
        raise RuntimeError("Stream ended without ResultMessage")

if __name__ == "__main__":
    anyio.run(main)
```

Run `stream_query.py` with the same interpreter; it is a live example. A successful run prints `stream result received`; the denial log additionally requires an actual Bash request. This arrangement illustrates the old release's input lifetime, not a recommendation to implement an unbounded service with it. If output never arrives, the generator stays open. Use a supervised execution boundary for live experiments, or the per-turn client deadline above when application-controlled waiting is required.

## Timeouts at Different Layers

Do not add `timeout=` to `ClaudeSDKClient` or `HookMatcher` in this version. The inspected constructor signatures do not accept it. The [control-protocol source](https://github.com/anthropics/claude-agent-sdk-python/blob/v0.1.3/src/claude_agent_sdk/_internal/query.py) uses a 60-second wait for its own outgoing control requests. That internal wait is not a deadline for every model turn, every incoming callback or the entire application.

<div class="overflow-x-auto" role="region" aria-label="Timeout layers comparison" tabindex="0">

| Layer | Meaning in this guide | What it does not establish |
| --- | --- | --- |
| Connection/control request | v0.1.3 internally waits for a control reply | Maximum total model execution time |
| Hook callback's own I/O | Bound your awaited database or HTTP operation locally | A configurable `HookMatcher.timeout` in v0.1.3 |
| Asynchronous hook output | `async_` selects deferred output; `asyncTimeout` is milliseconds in this tag | That every `async def` hook runs in the background |
| Application turn | `anyio.fail_after(seconds)` covers send and receive in `lifecycle.py` | A startup or cleanup deadline |
| Whole job | A supervising process must own the full lifetime and child-process cleanup | Rollback of remote side effects |

</div>

The [current Python reference](https://code.claude.com/docs/en/agent-sdk/python) describes forwarding `API_TIMEOUT_MS` through environment options for CLI/API request timing. That is a current CLI contract, not a parameter verified against this historical SDK/CLI pair. Retries can make several request windows longer than one request timeout. Do not silently add that setting to the pinned example and label the whole combination tested.

For an approval lookup inside a hook, a useful application policy is to catch the lookup's timeout and return an explicit refusal. This requires an actual asynchronous cancellation point. A blocking library call or CPU loop inside an async callback can prevent timely cancellation; merely writing `async def` does not make its work interruptible.

Keep deferred auditing separate from approval. Returning `async_` is not proof that a permission check finished. Nor should this old tutorial claim a universal CLI action after a hook error or timeout. Those outcomes depend on the event and CLI release. Test whether the tool executed, whether the session continued and whether the client closed, rather than inferring all three from one timeout exception.

## Custom MCP Tools

MCP, the Model Context Protocol, lets the agent call tools with structured inputs and outputs. The [v0.1.3 SDK tool implementation](https://github.com/anthropics/claude-agent-sdk-python/blob/v0.1.3/src/claude_agent_sdk/__init__.py) provides `tool` and `create_sdk_mcp_server` at the package root. An in-process server avoids a separate server process; it does not establish a measured performance advantage or isolate the tool from the Python application's privileges.

Save this complete local example as `mcp_demo.py`:

```python
import anyio
from claude_agent_sdk import ClaudeAgentOptions, create_sdk_mcp_server, tool

@tool("calculate_sum", "Add two numbers", {"a": float, "b": float})
async def calculate_sum(args):
    return {"content": [{"type": "text", "text": str(args["a"] + args["b"])}]}

def make_options():
    server = create_sdk_mcp_server(
        name="math-tools", version="1.0.0", tools=[calculate_sum],
    )
    return ClaudeAgentOptions(
        mcp_servers={"math": server},
        allowed_tools=["mcp__math__calculate_sum"],
        setting_sources=[],
    )

async def main():
    make_options()
    result = await calculate_sum.handler({"a": 15.0, "b": 27.0})
    assert result["content"][0]["text"] == "42.0"
    print("local MCP handler: 42.0")

if __name__ == "__main__":
    anyio.run(main)
```

Run `mcp_demo.py` with the same interpreter. Expected output is `local MCP handler: 42.0`. The local handler call checks arithmetic and the returned dictionary, not CLI discovery or model selection. For a live integration, pass `make_options()` into the earlier client pattern and ask it to call the named tool. Inspect the actual tool invocation and returned result before claiming the integration works.

The exposed name uses the `mcp_servers` dictionary key `math`, followed by the tool name `calculate_sum`. The server's display name `math-tools` is not the key used in `mcp__math__calculate_sum`. Avoid reconstructing the name from whatever descriptive label appears in a UI. This small distinction can otherwise look like a hook-matcher failure.

## Troubleshooting and Verification Boundaries

When a hook appears silent, check evidence in order: the installed versions, the selected input mode, the initialization handshake, the actual tool name, the matcher, callback entry and callback output. `allowed_tools` does not force the model to choose a tool. A plain text answer without a tool invocation cannot demonstrate either success or failure of a tool hook.

For connection failures, distinguish a missing executable from an invalid working directory, a CLI exit, a malformed message and an authentication failure. A generic `ProcessError` is not proof that the API key is missing. Preserve the exit code and suitably redacted stderr. Avoid automatically upgrading only one dependency and attributing a changed result to a single cause.

Local verification for this guide uses Python 3.12 and the pinned package. Imports, signatures, all Python blocks, the direct hook callback and the MCP handler are checked without a model. A simulated transport additionally exercises the real SDK's initialization, two sequential responses, hook routing, streaming input, missing-result timeout and cleanup paths. Its messages are fixtures, not Claude's answers.

The fixture cannot prove CLI permission enforcement, an actual callback timeout policy, operating-system child cleanup, model memory, authentication, cost or network reliability. A live acceptance run must record the exact CLI release, observe a real denied tool call with no side effect, observe an allowed tool's post-hook, and exercise cancellation in a disposable workspace. Do not report these checks as passed merely because a page renders or the source parses.

For deployment, pin the complete dependency set after choosing a maintained SDK/CLI combination and rerun these contracts. The examples retain 0.1.3 to explain the original article consistently; current documentation is useful for planning migration, not for silently changing the meaning of old signatures.

### A Reproducible Failure Checklist

Start each investigation with one prompt and one client in a disposable working directory. Record the expected terminal condition before executing anything: a non-error `ResultMessage`, a specific refusal, a local exception, or a deadline. Without that expectation, a stream ending early can be mistaken for a fast response, and a denied tool can be mistaken for an application crash.

For a missing-result test, a fixture should acknowledge initialization and accept the prompt, then keep its message stream open without emitting `ResultMessage`. That exercises the application's waiting deadline. A second fixture should close the stream immediately after accepting the prompt. That exercises the explicit missing-result check instead. These cases look similar in a UI, but one is a timeout and the other is an incomplete stream.

For cleanup coverage, make the fixture's `close()` await a checkpoint before recording completion. Verify `close_completed`, not just `close_started`, after success, internal timeout, an error result and external AnyIO cancellation. The local regression also cancels during cleanup and bounds a deliberately stalled close; it checks cancellation propagation, no second prompt after failure, and usable scope ordering afterward. These are real SDK tests with simulated transport, not evidence of a real CLI process leak.

For hook coverage, capture the initialization payload and use the callback ID that the SDK actually registered. Send a simulated `hook_callback` control request and inspect the resulting control response. Directly calling `deny_bash()` only verifies application policy; routing through the actual SDK also verifies registration and dictionary serialization. Neither test establishes what a particular CLI will do with the refusal.

Finally, distinguish a retryable read from an operation whose outcome is unknown. Even an apparently read-only prompt may activate tools with broader permissions than intended. Before retrying, identify the tool invocation, inspect its external state and decide whether an application-level idempotency key is needed. A connection error is a transport observation, not authorization to repeat every earlier action.

### Configuration and Error Records

Keep model selection in `ClaudeAgentOptions(model=...)` when a specific available model is required. The examples leave it unspecified because model availability is an account and runtime condition, not something an offline import check can establish. Do not attach `temperature` or `max_tokens` to `client.query()` based on an unrelated messages API.

`max_turns` limits agent turns; it is not a wall-clock deadline or a guaranteed monetary ceiling. A result may include `total_cost_usd=None`, so formatting it unconditionally as a decimal can itself crash error reporting. Treat absent accounting data as unknown, and keep the operational outcome separate from cost reporting.

For reproducible diagnostics, retain the SDK, MCP, AnyIO and Python versions, the exact CLI executable/version, operating system, working directory, input mode, enabled hook events, last message type and elapsed time. Redact secrets and personal data before sharing a record. The examples set `setting_sources=[]` to avoid opting into filesystem settings sources, but this is not a sandbox and does not remove inherited environment variables or machine-level privileges.

### Connecting Turn Deadlines to an Application

If a web request waits ten seconds but a client turn allows thirty, decide what happens after the browser disconnects. Do not quietly continue modifying files behind a failed UI and then start the same operation again when the user retries. Cancel and reconcile the outcome, or expose an identified background job that the user can inspect later. Both designs need a job identifier and a recorded termination reason.

A total job deadline includes queueing, connection, sending, receiving and cleanup. The example separates turn and cleanup budgets but does not bound startup. Multiplying the turn deadline by the number of turns does not bound other stages or retries. A hard job limit belongs with the process supervisor. Exiting a process still does not undo external effects.

To test a post-hook, do not demand a post-hook log for the same tool that the pre-hook deliberately denied. Prepare a separate, allowed, side-effect-free tool such as the addition handler. Observe permission, tool completion and the post-hook independently. This guide supplies the two callback forms and handler, but does not claim an online combined test of them.

Logging can also fail. A callback that blocks while writing to an unavailable remote audit service can prolong waiting after a tool has already completed. Give log delivery its own error handling. If business policy requires an audit record, explicitly decide whether failure means refusal or a pending state. Do not assume an exception automatically applies the desired permission policy, or swallow every exception and report a complete audit.

Keep the evidence separate: an offline protocol test establishes that a callback was invoked and returned the expected structure; a real command test establishes the selected CLI's behavior. That separation makes later dependency upgrades testable without treating a single generic pass record as proof of every layer.

## References

- [Official v0.1.3 repository and README](https://github.com/anthropics/claude-agent-sdk-python/tree/v0.1.3): baseline and historical prerequisites.
- [Client lifecycle](https://github.com/anthropics/claude-agent-sdk-python/blob/v0.1.3/src/claude_agent_sdk/client.py) and [query input handling](https://github.com/anthropics/claude-agent-sdk-python/blob/v0.1.3/src/claude_agent_sdk/_internal/client.py): send/receive semantics and streaming initialization.
- [Types and hook fields](https://github.com/anthropics/claude-agent-sdk-python/blob/v0.1.3/src/claude_agent_sdk/types.py) and [control protocol](https://github.com/anthropics/claude-agent-sdk-python/blob/v0.1.3/src/claude_agent_sdk/_internal/query.py): events, timeout units and cleanup implementation.
- [Current Python reference](https://code.claude.com/docs/en/agent-sdk/python) and [current hooks guide](https://code.claude.com/docs/en/agent-sdk/hooks): migration references, not the API contract for 0.1.3.
- [AnyIO cancellation guidance](https://anyio.readthedocs.io/en/stable/cancellation.html): deadlines, cancellation scopes and cleanup ordering.
