---
title: "Claude Code Leak: A Deep Dive into Anthropic's AI Coding Agent Architecture"
pubDate: 2026-03-31T00:00:00.000Z
description: "Claude Code's source was briefly exposed. We read all 1,884 TypeScript files. Here is what the architecture reveals about where AI coding tools are actually heading."
author: "Remy"
tags: ["AI", "Claude Code", "Architecture", "Developer Tools", "Agents", "Anthropic"]
lang: "en"
---

# Claude Code Leak: A Deep Dive into Anthropic's AI Coding Agent Architecture

Claude Code's source code was briefly exposed to the public. We read all 1,884 TypeScript files across 150+ directories. What we found is not just a chatbot with tool access. It is a full operating system for AI-assisted software development — with a multi-agent runtime, a plugin marketplace, a cross-session memory system, and a security model that treats the human as the final authority at every layer.

This post is a technical deep dive into the architecture. If you build AI tools, agent frameworks, or developer infrastructure, these design decisions are worth studying closely.

## The big picture: five layers, one philosophy

Claude Code is organized into five layers, each with a clear separation of concerns:

```
Layer 1: Entrypoints     CLI / Desktop / Web / SDK / IDE Extensions
Layer 2: Runtime          REPL loop / Query executor / Hook system / State manager
Layer 3: Engine           QueryEngine / Context coordinator / Model manager / Compact
Layer 4: Tools & Caps     100+ tools / Plugin / MCP / Skill / Agent / Command
Layer 5: Infrastructure   Auth / Storage / Cache / Analytics / Bridge transport
```

The philosophy behind this layering is worth calling out: Claude Code is not a single-purpose CLI. It is a **platform runtime** that happens to ship with a terminal interface. The same core engine powers the desktop app, the web client, IDE extensions, and the programmatic SDK. The Bridge layer abstracts the transport, so the engine never needs to know which frontend is driving it.

This is architecturally closer to VS Code's extension host or Emacs's Lisp core than to a typical AI wrapper.

## The heart: QueryEngine and the AsyncGenerator loop

The entire conversation is driven by a `QueryEngine` singleton that owns a `mutableMessages` array — the single source of truth for all conversation state.

The core loop is an **async generator**:

```
User message
  → build system prompt (layered context injection)
  → API request (streaming)
  → yield tokens to UI
  → if tool_use block received:
      → check permissions (hook → policy → user approval)
      → execute tool
      → append tool_result
      → continue loop (natural tail recursion)
  → if end_turn: break
```

This is elegant. The generator pattern means:

1. **Streaming is native** — tokens flow through `yield`, not callbacks
2. **Tool calls are recursive** — `tool_use → tool_result → continue` is just another iteration
3. **Interruption is clean** — `AbortController` cancels the generator, no cleanup spaghetti
4. **Budget control is trivial** — check `maxTurns` or `maxBudget` at each iteration boundary

Most AI tool frameworks use a state machine or an event loop. Claude Code's generator approach is simpler and more composable.

## Context system: not just a system prompt

The system prompt is not a static string. It is assembled from six layers at each query:

| Layer | Source | Purpose |
|-------|--------|---------|
| 1 | `defaultSystemPrompt` | Base behavioral instructions |
| 2 | `memoryMechanics` | Memory system instructions |
| 3 | `appendPrompt` | Additional prompt fragments |
| 4 | `userContext` | CLAUDE.md files (user + project level) |
| 5 | `systemContext` | Git status, environment, dynamic state |
| 6 | `workerToolsContext` | Coordinator-mode tool descriptions |

This layered injection means different contexts can override or extend each other without collision. CLAUDE.md files at the project level can customize behavior without touching the core prompt. This is the mechanism that makes Claude Code feel "project-aware" — it literally reads your repo's instructions on every query.

## Context compression: four levels of defense

Context windows are finite. Claude Code handles this with a four-tier compression system:

| Tier | Mechanism | When |
|------|-----------|------|
| 1 | `autoCompact` | Context approaching limit |
| 2 | `apiMicrocompact` | API-native `context_management` |
| 3 | `reactiveCompact` | After API returns context-too-large error |
| 4 | `snip` | Emergency: discard non-critical content |

The `compact()` function strips images, calls a compression API to summarize the conversation, then restores file references and skill state. After compression, `preservedSegment` boundaries allow selective recovery.

This is more sophisticated than "just truncate old messages." It is a managed degradation pipeline.

## Multi-agent architecture: three isolation levels

Claude Code doesn't just spawn sub-agents. It has a full taxonomy of agent types and isolation models:

### Agent sources

| Type | Source | Example |
|------|--------|---------|
| BuiltInAgent | Hardcoded | `explore`, `plan`, `verify`, `general-purpose` |
| CustomAgent | Settings files | User or project-level `.claude/agents/*.md` |
| PluginAgent | Plugin packages | Marketplace-distributed agents |

### Task types (7 variants)

| Task | Isolation | Use case |
|------|-----------|----------|
| `InProcessTeammate` | AsyncLocalStorage | Same-process, shared terminal |
| `LocalAgentTask` | Async background | Non-blocking sub-agent |
| `RemoteAgentTask` | Remote CCR | Cloud execution |
| `LocalShellTask` | Child process | Shell commands |
| `DreamTask` | Background | Memory consolidation |
| `LocalWorkflowTask` | Background | Workflow scripts |
| `MonitorMcpTask` | Background | MCP server monitoring |

### The Team model

Multiple agents coordinate through a file-based Team system:

```
~/.claude/teams/{team-name}/config.json
├── members: [{ agentId: "researcher@my-team", status: "idle" }]
└── task list: ~/.claude/tasks/{team-name}/
```

Communication is async via **Mailboxes** — each teammate has an independent message queue. The protocol supports structured messages: `shutdown_request`, `plan_approval_response`, permission bubbling.

**Key design decisions:**

- `model: 'inherit'` ensures child agents share the parent's prompt cache — byte-level alignment for cache hits
- `TEAMMATE_MESSAGES_UI_CAP = 50` prevents memory leaks (they hit 36.8GB with 292 agents before adding this)
- `omitClaudeMd` on read-only agents (Explore, Plan) saves ~5-15 GTok/week across their fleet
- `AsyncLocalStorage` provides implicit context isolation without explicit parameter passing

## Tool system and security model

### 30+ built-in tools

The tool list reads like a small IDE: `BashTool`, `FileReadTool`, `FileEditTool`, `FileWriteTool`, `GlobTool`, `GrepTool`, `WebFetchTool`, `WebSearchTool`, `NotebookEditTool`, `AgentTool`, `SendMessageTool`, `TaskCreate/Get/List/Update`, `TeamCreate/Delete`, `EnterPlanMode`, `EnterWorktree`, `ScheduleCron`, `MCPTool`, `LSPTool`, `PowerShellTool`, and more.

Each tool inherits from a `Tool` base class with:
- JSON Schema for parameters
- Permission declarations
- Execution function
- Result formatting

### Execution pipeline

```
LLM outputs tool_use block
  → Parse parameters
  → Hook: PreToolUse (can intercept or modify)
  → Permission check (mode + allowlist + policy)
  → Execute tool
  → Hook: PostToolUse (audit, notify)
  → Return result to LLM
```

### Sandbox

BashTool runs commands in a platform-specific sandbox:
- **macOS**: `sandbox-exec` (seatbelt profiles)
- **Linux**: Namespace isolation
- **Windows**: Restricted mode

The sandbox limits network access, filesystem scope, and process creation. This is not a "trust the model" system. It is a "verify every action" system.

### Permission model

Three modes for agent permissions:
- `ask`: Every tool use requires human confirmation
- `bubble`: Permission prompts float up to the team leader
- `allow`: Auto-approve (bounded by leader's own permissions)

Tools can be whitelisted (`tools: [...]`) or blacklisted (`disallowedTools: [...]`) per agent. Hooks add another layer — `PreToolUse` can block or modify any tool call before execution.

## Plugin ecosystem: a real marketplace

This is where Claude Code stops looking like a CLI and starts looking like a platform.

### Plugin manifest

```json
{
  "name": "my-plugin",
  "commands": "./commands",
  "agents": ["./agents"],
  "skills": "./skills",
  "hooks": { ... },
  "mcpServers": { ... },
  "lspServers": { ... },
  "userConfig": {
    "api_key": { "type": "string", "sensitive": true }
  }
}
```

A single plugin can contribute: slash commands, agents, skills, hooks, MCP servers, LSP servers, and settings. Sensitive config values go to the system keychain, not to disk.

### Marketplace architecture

Plugins are distributed through Marketplaces — registries that can be GitHub repos, npm packages, URLs, or local directories. Plugin IDs are `name@marketplace` scoped. Dependencies are resolved transitively with cycle detection. Cross-marketplace dependencies require explicit allowlisting.

```
~/.claude/plugins/cache/marketplace/plugin/version/
```

Version pinning supports commit SHA for Git sources. Corporate environments can lock down to `strictKnownMarketplaces` and block untrusted sources.

### Skill system: progressive disclosure

Skills are Markdown files with YAML frontmatter:

```markdown
---
name: My Skill
description: Analyze TypeScript patterns
when-to-use: When the user asks to refactor TypeScript code
paths: [src/**/*.ts]
allowed-tools: [Read, Grep, Bash]
context: inline
---

Detailed instructions for the model...
```

The `paths` field enables **progressive disclosure**: skills with path filters start hidden, and only become visible when the model touches matching files. This keeps the initial skill list small and relevant — the model doesn't get overwhelmed with 200 options on startup.

## Memory: the feature that changes everything

Most AI tools are stateless between sessions. Claude Code is not.

### Four-type memory taxonomy

| Type | Purpose | Example |
|------|---------|---------|
| User | Who the user is | "Senior Go engineer, new to React" |
| Feedback | How to behave | "Don't mock the database in tests" |
| Project | What's happening | "Merge freeze after March 5 for mobile release" |
| Reference | Where to look | "Pipeline bugs tracked in Linear project INGEST" |

### Memory architecture

```
~/.claude/projects/<slug>/memory/
├── MEMORY.md           # Index (200 lines max, always loaded)
├── user_role.md        # Individual memory files
├── feedback_testing.md
├── project_auth.md
└── reference_linear.md
```

`MEMORY.md` is always injected into the context. Individual memory files are loaded on demand. The system auto-extracts memories from conversations and consolidates them through a **Dream** mechanism — a background task that processes session logs into structured memories without interrupting the user.

This is the feature that makes Claude Code feel like it "knows you." After a few sessions, it remembers your preferences, your project context, your team's constraints. No other mainstream AI coding tool has this.

## Unique features worth noting

**Buddy**: A procedurally generated companion with deterministic "bones" (species, rarity, attributes) and AI-generated "soul" (name, personality). Legendary rarity cannot be forged. This is pure product craft — making a CLI tool feel personal.

**Thinkback**: Records and replays the AI's thinking process. Useful for debugging agent behavior.

**Voice mode**: Streaming speech-to-text with keyword recognition and multi-language support.

**Vim mode**: Full Vim keybinding support — motions, operators, text objects, mode switching. Not a toy implementation.

**Dream**: Background memory consolidation that processes session logs into structured knowledge. Fires on time + session thresholds.

**Cost tracking**: Full transparency — per-model costs, cache hit rates, token breakdowns, code change statistics.

## Bridge: one engine, four frontends

The Bridge layer is how Claude Code supports CLI, Desktop, Web, and IDE simultaneously:

- **REPL Bridge**: Local CLI, direct interaction
- **Remote Bridge**: Desktop/Web/IDE, via SSE or polling
- **Hybrid Transport**: Switches between local and remote transparently

Session management handles creation, resumption, persistence, and JWT authentication for remote mode. The `entrypoints/` directory shows distinct entry paths for CLI, SDK, and bridge modes, all converging on the same QueryEngine.

## Feature flags hint at the future

The source contains several feature flags for unreleased capabilities:

- **KAIROS**: Long-term assistant mode (append-only logs)
- **VOICE_MODE**: Full voice interaction
- **WORKFLOW_SCRIPTS**: Programmable workflow automation
- **PROACTIVE**: Proactive interaction (agent initiates, not just responds)
- **DAEMON**: Background daemon mode

The PROACTIVE flag is the most interesting. Current AI tools are reactive — they wait for you to ask. A proactive Claude Code could monitor your repo, suggest fixes, flag issues, or prepare context before you even open a terminal.

## What this means for the industry

### 1. AI coding tools are becoming platforms

Claude Code is not competing with GitHub Copilot on autocomplete. It is competing with VS Code on extensibility. The plugin marketplace, the hook system, the multi-agent runtime — these are platform primitives. The message is clear: the winning AI coding tool will be the one with the best ecosystem, not the best model.

### 2. Memory is the next moat

Stateless AI assistants are a commodity. Any tool can call Claude or GPT-4 with your code context. But an assistant that remembers your preferences, your project constraints, your team's conventions, and your past debugging sessions — that creates switching costs. Claude Code's Memory + Dream system is an early implementation of this idea.

### 3. Security must be architecture, not policy

Claude Code doesn't just tell the model "be careful." It enforces safety through sandbox isolation, layered permissions, hook interception, and human-in-the-loop approval flows. The `PreToolUse` hook alone is more security infrastructure than most AI tools have in total. As agents get more capable, this kind of structural safety will be table stakes.

### 4. Multi-agent is real, and it's messy

The 36.8GB memory leak with 292 agents is a telling detail. Multi-agent systems are powerful but create real engineering challenges around resource management, message routing, and isolation. Claude Code's `TEAMMATE_MESSAGES_UI_CAP`, `AsyncLocalStorage` isolation, and prompt cache alignment are practical solutions to problems that most agent frameworks haven't even encountered yet.

### 5. The CLI is not dead

Claude Code chose the terminal as its primary interface. Not a web app. Not a VS Code sidebar. A CLI — with Vim bindings, voice input, a buddy companion, and stickers. This is a bet that developers want AI tools that live where they already work, not in yet another browser tab.

---

*This analysis is based on a reading of 1,884 TypeScript source files across 150+ directories. The source code has since been taken down. All findings reflect the architecture as observed at the time of analysis.*
