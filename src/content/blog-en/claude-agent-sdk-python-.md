---
title: 'Claude Agent SDK (Python) Learning Guide'
pubDate: 2025-10-17T00:00:00.000Z
description: 'A complete guide to the Claude Agent SDK, covering architecture, queries, custom MCP tool extensions, the Hook system for automation, debugging, and implementation.'
author: 'Remy'
tags: ['claude code', 'vibe coding', 'python']
---
**Document Version**: 1.0  
**Generated**: 2025-10-15  
**SDK Version**: 0.1.3  
**Level**: Standard (Estimated Study Time: 2–4 hours)  
**Target Audience**: Intermediate Python Developers  

---

## Table of Contents

1. [Project Overview](#-project-overview)
2. [Quick Start (15 min)](#-quick-start15-min)
3. [Core Concepts (20 min)](#-core-concepts20-min)
4. [Main Features (30 min)](#-main-features30-min)
5. [Architecture Design (20 min)](#-architecture-design20-min)
6. [Hands-On Examples (30 min)](#-hands-on-examples30-min)
7. [Learning Path Recommendations](#-learning-path-recommendations)
8. [FAQ & Troubleshooting](#-faq--troubleshooting)
9. [References](#-references)
10. [Appendix](#-appendix)

---

## 📖 Project Overview

### 1.1 Project Introduction

**Claude Agent SDK for Python** is the official Python SDK from Anthropic for programmatic interaction with Claude Code. It wraps the Claude Code CLI and provides a concise, Pythonic API that supports:

- **Bidirectional conversation**: multi-turn interactive chats with Claude  
- **Custom tools**: extend Claude’s capabilities via in-process MCP servers  
- **Hook system**: inject custom logic before/after tool execution  
- **Permission control**: fine-grained tool-usage permissions  
- **Async-first**: cross-platform async support built on `anyio`

**Project Type**: SDK / Developer Library  
**Language**: Python 3.10+  
**License**: MIT  
**Repository**: https://github.com/anthropics/claude-agent-sdk-python

### 1.2 Core Features

1. **Two Usage Modes**
   - `query()`: simple one-shot queries for stateless scenarios  
   - `ClaudeSDKClient`: interactive, stateful conversations  

2. **In-Process MCP Tools**
   - Define custom tools quickly with the `@tool` decorator  
   - No separate process—faster than external MCP servers  
   - Direct access to application state and variables  

3. **Powerful Control**
   - Hook system: lifecycle hooks such as PreToolUse, PostToolUse  
   - Permission callbacks: dynamic tool-usage decisions  
   - Interruption support: stop long-running tasks at any time  

4. **Type Safety**
   - Full type annotations (mypy compatible)  
   - Strongly typed messages and content blocks  
   - IDE autocompletion and type checking  

5. **Async Design**
   - Built on `anyio`; supports asyncio and trio  
   - Streaming message processing with low memory footprint  
   - Concurrent task management  

### 1.3 When to Use the SDK

**Good fits**:
- Building chat apps or conversational UIs  
- Automating code generation and analysis tools  
- Integrating Claude into existing Python applications  
- Creating custom dev assistants or CI/CD tools  
- Enterprise apps that need custom tools and permission control  

**Not ideal for**:
- Simple one-off scripts (use the CLI directly)  
- Non-Python projects (use SDKs in other languages)  
- Non-programmatic interaction (use the Claude Code GUI)

### 1.4 Learning Objectives

After completing this guide you will be able to:

✅ Understand the SDK’s architecture and how it works  
✅ Perform basic and advanced queries with `query()` and `ClaudeSDKClient`  
✅ Create custom MCP tools to extend Claude’s capabilities  
✅ Automate and control behavior with the Hook system  
✅ Debug and resolve common issues  
✅ Design and implement production-grade Claude integrations  

---

## 🚀 Quick Start (15 min)

### 2.1 Prerequisites

#### Required Knowledge
- **Python fundamentals (3.10+)**: data types, classes, decorators, async  
- **Async programming**: `async`/`await`, async iterators, basic `anyio`  
- **Type hints**: `typing` module, TypedDict, Literal  

#### Recommended Knowledge
- **Inter-process communication**: stdin/stdout/stderr, subprocess management  
- **JSON**: serialization / deserialization  
- **MCP protocol**: Model Context Protocol basics (optional)

### 2.2 Environment Setup

#### Step 1: Check Python Version

```bash
python --version
# Needs 3.10 or newer
```

If the version is too low, upgrade:

```bash
# Ubuntu/Debian
sudo apt install python3.10

# macOS
brew install python@3.10

# Windows: download from https://python.org/downloads/
```

#### Step 2: Install Claude Code CLI

The CLI is a required dependency.

```bash
# Install Claude Code CLI
npm install -g @anthropic-ai/claude-code

# Verify
claude -v
# Should show 2.0.0 or higher
```

#### Step 3: Set API Key

```bash
# Linux/macOS
export ANTHROPIC_API_KEY="sk-ant-api03-your-key-here"

# Windows (PowerShell)
$env:ANTHROPIC_API_KEY = "sk-ant-api03-your-key-here"

# Permanent (Linux/macOS)
echo 'export ANTHROPIC_API_KEY="sk-ant-api03-..."' >> ~/.bashrc
source ~/.bashrc
```

Obtain your key at https://platform.claude.com/.

#### Step 4: Install the SDK

```bash
# Option 1: from PyPI (recommended)
pip install claude-agent-sdk

# Option 2: from source (dev)
cd claude-agent-sdk-python
pip install -e .
```

#### Step 5: Verify Installation

```bash
python -c "import claude_agent_sdk; print(claude_agent_sdk.__version__)"
# Should print: 0.1.3
```

### 2.3 First Example

Create `hello_claude.py`:

```python
#!/usr/bin/env python3
"""First Claude Agent SDK example"""

import anyio
from claude_agent_sdk import query, AssistantMessage, TextBlock

async def main():
    """Simple query example"""
    print("Asking Claude...")

    async for message in query(prompt="What is 2 + 2?"):
        if isinstance(message, AssistantMessage):
            for block in message.content:
                if isinstance(block, TextBlock):
                    print(f"Claude: {block.text}")

if __name__ == "__main__":
    anyio.run(main)
```

Run:

```bash
python hello_claude.py
```

Expected output:

```
Asking Claude...
Claude: 2 + 2 equals 4.
```

### 2.4 Verification

If the example runs successfully, you’re set!

If you see errors:

- `CLINotFoundError`: check that the CLI is installed  
- `ImportError`: verify the SDK is installed  
- `ProcessError`: confirm the API key is set  

See [FAQ](#-faq--troubleshooting) for detailed troubleshooting.

---

## 📚 Core Concepts (20 min)

### 3.1 Core Concepts Checklist

Sorted by learning priority:

1. **Claude Code CLI** ⭐⭐⭐⭐⭐ – underlying execution engine  
2. **Claude Agent SDK** ⭐⭐⭐⭐⭐ – Python wrapper layer  
3. **Message Types** ⭐⭐⭐⭐⭐ – data structures  
4. **Tools** ⭐⭐⭐⭐⭐ – tool system  
5. **MCP** ⭐⭐⭐⭐ – Model Context Protocol  
6. **Hooks** ⭐⭐⭐⭐ – lifecycle hooks  
7. **Permission System** ⭐⭐⭐⭐ – security controls  
8. **anyio** ⭐⭐⭐⭐ – async library  
9. **Transport** ⭐⭐⭐ – transport abstraction  
10. **Agent Definitions** ⭐⭐⭐ – custom agents  

### 3.2 Concept Deep Dive

#### Concept 1: Claude Code CLI

**Definition**: Official CLI from Anthropic that provides the low-level interface to Claude AI.

**Role**: The SDK spawns the CLI as a subprocess; the CLI talks to the Anthropic API.

**Install**: `npm install -g @anthropic-ai/claude-code`

**Key points**:
- Version requirement: ≥ 2.0.0  
- Communicates via stdin/stdout using JSONL  
- Supports streaming (bidirectional)

#### Concept 2: Claude Agent SDK

**Definition**: Python SDK that wraps the CLI and exposes a Pythonic API.

**Two usage modes**:
- `query()`: stateless, single-shot queries  
- `ClaudeSDKClient`: stateful, interactive sessions  

**Core benefits**:
- Simplified interface  
- Type safety  
- In-process MCP tools  
- Hooks and permission controls  

#### Concept 3: Message Types

**Definition**: The various message structures inside the SDK.

**Main types**:
- `UserMessage`: user message  
- `AssistantMessage`: Claude’s reply  
- `SystemMessage`: system message  
- `ResultMessage`: result & cost info  
- `StreamEvent`: streaming events  

**Content block types**:
- `TextBlock`: plain text  
- `ThinkingBlock`: reasoning content  
- `ToolUseBlock`: tool invocation  
- `ToolResultBlock`: tool result  

#### Concept 4: Tools

**Definition**: Functions Claude can call to perform tasks.

**Two kinds**:
- **Built-in**: Read, Write, Bash, Edit, Glob, Grep, etc.  
- **Custom**: defined with `@tool`  

**Example**:

```python
from claude_agent_sdk import tool

@tool("add", "Add two numbers", {"a": float, "b": float})
async def add_numbers(args):
    result = args["a"] + args["b"]
    return {
        "content": [{"type": "text", "text": f"Result: {result}"}]
    }
```

#### Concept 5: MCP (Model Context Protocol)

**Definition**: Standard protocol defining how tools communicate with AI models.

**SDK implementations**:
- **SDK MCP Server** (in-process): created with `create_sdk_mcp_server()`  
- **External MCP Server** (external process): communicates via stdio/SSE/HTTP  

**Benefits**:
- Standardized tool interface  
- Multiple transport options  
- Extensible  

#### Concept 6: Hooks

**Definition**: Callbacks executed at specific points in the Claude agent loop.

**Supported events**:
- `PreToolUse`: before tool use (permission control)  
- `PostToolUse`: after tool use (add context)  
- `UserPromptSubmit`: after user prompt submission  
- `Stop`: stop event  
- `SubagentStop`: sub-agent stop  
- `PreCompact`: before compaction  

**Use cases**:
- Logging  
- Dynamic permission control  
- Tool behavior modification  
- Auditing & monitoring  

#### Concept 7: Permission System

**Definition**: Controls which actions Claude is allowed to perform.

**Permission modes**:
- `default`: CLI prompts user for dangerous actions  
- `acceptEdits`: auto-approve file edits  
- `plan`: planning mode—no tools executed  
- `bypassPermissions`: skip all permission checks (dangerous!)  

**Permission callback**:

```python
async def permission_callback(tool_name, input_data, context):
    if tool_name == "Bash" and "rm -rf" in input_data.get("command", ""):
        return PermissionResultDeny(message="Dangerous command")
    return PermissionResultAllow()
```

#### Concept 8: anyio

**Definition**: Cross-runtime async library that unifies asyncio and trio APIs.

**Why use it**:
- Unified async API  
- Multiple backends supported  
- Simplifies cross-platform async programming  

**Basic usage**:

```python
import anyio

async def main():
    await anyio.sleep(1)
    async with anyio.create_task_group() as tg:
        tg.start_soon(task1)
        tg.start_soon(task2)

anyio.run(main)
```

### 3.3 Concept Map

```
External Dependencies
┌─────────────────────────────────────────┐
│ Node.js → Claude Code CLI (≥2.0.0)      │
│ Python 3.10+ → anyio → mcp              │
└─────────────────────────────────────────┘
            ↓
Protocol Layer
┌─────────────────────────────────────────┐
│ MCP (Model Context Protocol)            │
│ SDK Control Protocol                    │
└─────────────────────────────────────────┘
            ↓
SDK Core
┌─────────────────────────────────────────┐
│ Claude Agent SDK                        │
│   ├─ query() [simple queries]           │
│   └─ ClaudeSDKClient [interactive]      │
└─────────────────────────────────────────┘
            ↓
Feature Layer
┌─────────────────────────────────────────┐
│ Tools | Permissions | Hooks              │
└─────────────────────────────────────────┘
            ↓
Application Layer
┌─────────────────────────────────────────┐
│ Your Python Application                 │
└─────────────────────────────────────────┘
```

### 3.4 Suggested Learning Order

```
Step 1: Python basics + async programming
  ↓
Step 2: Install and use Claude Code CLI
  ↓
Step 3: Claude Agent SDK basics (query function)
  ↓
Step 4: Message types and content blocks
  ↓
Step 5: MCP protocol and tool system
  ↓
Step 6: ClaudeSDKClient interactive sessions
  ↓
Step 7: Permission system
  ↓
Step 8: Hooks
```

---

## 🔧 Main Features (30 min)

### 4.1 API Overview

The SDK exposes two primary interfaces:

| API | Use Case | Characteristics |
|-----|----------|-----------------|
| `query()` | Simple queries, batch jobs | Stateless, streaming one-way |
| `ClaudeSDKClient` | Interactive apps, multi-turn chat | Stateful, streaming two-way |

### 4.2 Usage Modes

#### Mode 1: `query()` Function

**Use case**: one-shot queries or batch tasks.

**Basic usage**:

```python
from claude_agent_sdk import query

async for message in query(prompt="What is 2 + 2?"):
    print(message)
```

**Query with options**:

```python
from claude_agent_sdk import query, ClaudeAgentOptions

options = ClaudeAgentOptions(
    system_prompt="You are a helpful assistant",
    allowed_tools=["Read", "Write"],
    max_turns=5
)

async for message in query(prompt="Create a hello.txt file", options=options):
    print(message)
```

**Characteristics**:
- Stateless—each call is independent  
- Manages connection lifecycle automatically  
- Ideal for scripts and automation  

#### Mode 2: `ClaudeSDKClient` Class

**Use case**: multi-turn conversations, interruption control, real-time apps.

**Basic usage**:

```python
from claude_agent_sdk import ClaudeSDKClient

async with ClaudeSDKClient() as client:
    # Turn 1
    await client.query("What's the capital of France?")
    async for msg in client.receive_response():
        print(msg)

    # Turn 2 (keeps context)
    await client.query("What's its population?")
    async for msg in client.receive_response():
        print(msg)
```

**Core methods**:
- `connect()`: establish connection  
- `query(prompt)`: send query  
- `receive_messages()`: receive all messages  
- `receive_response()`: receive one full response  
- `interrupt()`: send interrupt  
- `set_permission_mode(mode)`: change permission mode  
- `disconnect()`: close connection  

**Characteristics**:
- Stateful—maintains conversation context  
- Supports interruption and dynamic config  
- Ideal for chat apps and interactive UIs  

### 4.3 Configuration Options

#### Common `ClaudeAgentOptions`

```python
from claude_agent_sdk import ClaudeAgentOptions

options = ClaudeAgentOptions(
    # System prompt
    system_prompt="You are a helpful assistant",

    # Tool permissions
    allowed_tools=["Read", "Write", "Bash"],
    disallowed_tools=["Edit"],

    # Permission mode
    permission_mode="default",  # or "acceptEdits", "plan", "bypassPermissions"

    # Conversation limits
    max_turns=10,

    # Model
    model="claude-sonnet-4-5",

    # Working directory
    cwd="/path/to/project",

    # MCP servers
    mcp_servers={
        "my-server": {...}
    },

    # Tool permission callback
    can_use_tool=my_permission_callback,

    # Hooks
    hooks={
        "PreToolUse": [HookMatcher(...)],
        "PostToolUse": [HookMatcher(...)]
    },

    # Streaming
    include_partial_messages=True
)
```

### 4.4 Message Types

#### Message Type Hierarchy

```python
Message = UserMessage | AssistantMessage | SystemMessage | ResultMessage | StreamEvent
```

#### UserMessage

```python
from claude_agent_sdk import UserMessage

# Text message
user_msg = UserMessage(
    content="Hello Claude",
    parent_tool_use_id=None
)

# List of content blocks
user_msg = UserMessage(
    content=[
        {"type": "text", "text": "Hello"},
        {"type": "image", "source": {...}}
    ],
    parent_tool_use_id=None
)
```

#### AssistantMessage

```python
from claude_agent_sdk import AssistantMessage, TextBlock, ToolUseBlock

for message in messages:
    if isinstance(message, AssistantMessage):
        for block in message.content:
            if isinstance(block, TextBlock):
                print(f"Text: {block.text}")
            elif isinstance(block, ToolUseBlock):
                print(f"Tool: {block.name}, Input: {block.input}")
```

#### ResultMessage

```python
from claude_agent_sdk import ResultMessage

if isinstance(message, ResultMessage):
    print(f"Duration: {message.duration_ms} ms")
    print(f"Cost: ${message.total_cost_usd}")
    print(f"Turns: {message.num_turns}")
    print(f"Error: {message.is_error}")
```

### 4.5 Custom Tools

#### Creating an SDK MCP Server

```python
from claude_agent_sdk import tool, create_sdk_mcp_server, ClaudeAgentOptions

# 1. Define tool
@tool("calculate_sum", "Add two numbers", {"a": float, "b": float})
async def calculate_sum(args):
    result = args["a"] + args["b"]
    return {
        "content": [{"type": "text", "text": f"Sum: {result}"}]
    }

# 2. Create server
server = create_sdk_mcp_server(
    name="math-tools",
    version="1.0.0",
    tools=[calculate_sum]
)

# 3. Configure
options = ClaudeAgent
