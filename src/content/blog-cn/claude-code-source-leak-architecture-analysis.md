---
title: "Claude Code 源码泄露：Anthropic AI 编程智能体架构深度解析"
pubDate: 2026-03-31T00:00:00.000Z
description: "Claude Code 源码短暂公开。我们读完了全部 1,884 个 TypeScript 文件。以下是这套架构揭示的 AI 编程工具真正走向。"
author: "Remy"
tags: ["AI", "Claude Code", "架构", "开发者工具", "Agents", "Anthropic"]
lang: "zh"
translatedFrom: "claude-code-source-leak-architecture-analysis"
---

# Claude Code 源码泄露：Anthropic AI 编程智能体架构深度解析

Claude Code 的源码曾短暂公开。我们通读了全部 1,884 个 TypeScript 文件、150+ 个目录。发现的不是一个带工具调用的聊天机器人，而是一套完整的 AI 辅助软件开发操作系统 — 内含多 Agent 运行时、插件市场、跨会话记忆系统，以及一个在每一层都把人类作为最终决策者的安全模型。

本文是一篇技术深度解析。如果你在做 AI 工具、Agent 框架或开发者基础设施，这些设计决策值得仔细研究。

## 全局视角：五层架构，一个哲学

Claude Code 被组织为五层，每层职责清晰分离：

```
第一层：入口点       CLI / Desktop / Web / SDK / IDE 扩展
第二层：运行时       REPL 循环 / 查询执行器 / Hook 系统 / 状态管理器
第三层：核心引擎     QueryEngine / Context 协调器 / 模型管理器 / Compact
第四层：工具与能力   100+ 工具 / Plugin / MCP / Skill / Agent / Command
第五层：基础设施     认证 / 存储 / 缓存 / 分析 / Bridge 传输层
```

值得指出的设计哲学：Claude Code 不是一个单一用途的 CLI。它是一个**平台运行时**，碰巧以终端作为默认界面。同一个核心引擎驱动着桌面应用、Web 客户端、IDE 扩展和编程式 SDK。Bridge 层抽象了传输协议，引擎永远不需要知道是哪个前端在驱动它。

架构上更接近 VS Code 的 Extension Host 或 Emacs 的 Lisp 内核，而非典型的 AI 封装层。

## 心脏：QueryEngine 与 AsyncGenerator 循环

整个对话由一个 `QueryEngine` 单例驱动，它拥有 `mutableMessages` 数组 — 全部对话状态的唯一真实来源。

核心循环是一个**异步生成器**：

```
用户消息
  → 构建 system prompt（分层上下文注入）
  → API 请求（流式）
  → yield token 到 UI
  → 如果收到 tool_use block：
      → 检查权限（hook → policy → 用户审批）
      → 执行工具
      → 追加 tool_result
      → 继续循环（自然尾递归）
  → 如果 end_turn：break
```

这个设计很优雅。Generator 模式意味着：

1. **流式天然支持** — token 通过 `yield` 流出，不是回调
2. **工具调用是递归的** — `tool_use → tool_result → continue` 只是下一次迭代
3. **中断干净利落** — `AbortController` 取消 generator，不需要清理逻辑
4. **预算控制简单直接** — 在每次迭代边界检查 `maxTurns` 或 `maxBudget`

大多数 AI 工具框架用状态机或事件循环。Claude Code 的 generator 方式更简单，也更可组合。

## 上下文系统：不只是 system prompt

System prompt 不是静态字符串，它在每次查询时从六个层组装而成：

| 层 | 来源 | 用途 |
|----|------|------|
| 1 | `defaultSystemPrompt` | 基础行为指令 |
| 2 | `memoryMechanics` | Memory 系统指令 |
| 3 | `appendPrompt` | 追加提示片段 |
| 4 | `userContext` | CLAUDE.md 文件（用户级 + 项目级） |
| 5 | `systemContext` | Git 状态、环境、动态信息 |
| 6 | `workerToolsContext` | Coordinator 模式下的工具描述 |

分层注入意味着不同上下文可以互相覆盖或扩展而不冲突。项目级的 CLAUDE.md 可以定制行为而不碰核心 prompt。这就是 Claude Code 感觉"了解你的项目"的机制 — 它字面上在每次查询时读取你仓库中的指令。

## 上下文压缩：四级防御

上下文窗口有限。Claude Code 用四级压缩系统应对：

| 级别 | 机制 | 触发时机 |
|------|------|---------|
| 1 | `autoCompact` | 上下文接近限制 |
| 2 | `apiMicrocompact` | API 原生 `context_management` |
| 3 | `reactiveCompact` | API 返回上下文过大错误后 |
| 4 | `snip` | 紧急：丢弃非关键内容 |

`compact()` 函数先清理图片，调用压缩 API 摘要对话，再恢复文件引用和技能状态。压缩后通过 `preservedSegment` 边界支持选择性恢复。

这比"直接截断旧消息"精密得多。这是一条可管理的降级流水线。

## 多 Agent 架构：三级隔离

Claude Code 不只是生成子 Agent。它有完整的 Agent 类型分类和隔离模型。

### Agent 来源

| 类型 | 来源 | 示例 |
|------|------|------|
| BuiltInAgent | 硬编码 | `explore`、`plan`、`verify`、`general-purpose` |
| CustomAgent | settings 文件 | 用户或项目级 `.claude/agents/*.md` |
| PluginAgent | 插件包 | 通过市场分发的 Agent |

### Task 类型（7 种变体）

| Task | 隔离方式 | 用途 |
|------|---------|------|
| `InProcessTeammate` | AsyncLocalStorage | 同进程，共享终端 |
| `LocalAgentTask` | 异步后台 | 非阻塞子 Agent |
| `RemoteAgentTask` | 远程 CCR | 云端执行 |
| `LocalShellTask` | 子进程 | Shell 命令 |
| `DreamTask` | 后台 | 记忆整合 |
| `LocalWorkflowTask` | 后台 | 工作流脚本 |
| `MonitorMcpTask` | 后台 | MCP 服务器监控 |

### Team 模型

多个 Agent 通过文件系统的 Team 结构协调：

```
~/.claude/teams/{team-name}/config.json
├── members: [{ agentId: "researcher@my-team", status: "idle" }]
└── 任务列表: ~/.claude/tasks/{team-name}/
```

通信通过 **Mailbox** 异步实现 — 每个 teammate 有独立消息队列。协议支持结构化消息：`shutdown_request`、`plan_approval_response`、权限冒泡。

**关键设计决策**：

- `model: 'inherit'` 确保子 Agent 共享父级的 prompt cache — 字节级对齐以命中缓存
- `TEAMMATE_MESSAGES_UI_CAP = 50` 防止内存泄漏（加这个之前 292 个 agent 搞出了 36.8GB 内存占用）
- `omitClaudeMd` 让只读 Agent（Explore、Plan）省掉约 5-15 GTok/周
- `AsyncLocalStorage` 提供隐式上下文隔离，无需显式传参

## 工具系统与安全模型

### 30+ 内置工具

工具列表读起来像一个小型 IDE：`BashTool`、`FileReadTool`、`FileEditTool`、`FileWriteTool`、`GlobTool`、`GrepTool`、`WebFetchTool`、`WebSearchTool`、`NotebookEditTool`、`AgentTool`、`SendMessageTool`、`TaskCreate/Get/List/Update`、`TeamCreate/Delete`、`EnterPlanMode`、`EnterWorktree`、`ScheduleCron`、`MCPTool`、`LSPTool`、`PowerShellTool` 等。

### 执行流水线

```
LLM 输出 tool_use block
  → 解析参数
  → Hook: PreToolUse（可拦截或修改）
  → 权限检查（mode + allowlist + policy）
  → 执行工具
  → Hook: PostToolUse（审计、通知）
  → 结果返回给 LLM
```

### 沙箱

BashTool 在平台特定的沙箱中执行命令：
- **macOS**: `sandbox-exec`（seatbelt profile）
- **Linux**: Namespace 隔离
- **Windows**: 受限模式

沙箱限制网络访问、文件系统范围和进程创建。这不是一个"信任模型"的系统，而是一个"验证每个操作"的系统。

### 权限模型

Agent 权限的三种模式：
- `ask`: 每次工具使用都需要人类确认
- `bubble`: 权限提示冒泡到团队 leader
- `allow`: 自动批准（受限于 leader 自身权限）

工具可按 Agent 白名单（`tools: [...]`）或黑名单（`disallowedTools: [...]`）配置。Hook 添加另一层 — `PreToolUse` 可以在执行前阻止或修改任何工具调用。

## 插件生态系统：一个真正的市场

这是 Claude Code 从 CLI 变成平台的转折点。

### 插件清单

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

一个插件可以贡献：斜杠命令、Agent、Skill、Hook、MCP 服务器、LSP 服务器和设置。敏感配置值存入系统钥匙链，不落盘。

### Marketplace 架构

插件通过 Marketplace 分发 — 注册中心可以是 GitHub 仓库、npm 包、URL 或本地目录。插件 ID 采用 `name@marketplace` 作用域。依赖支持传递解析和循环检测。跨 Marketplace 依赖需要显式白名单。

企业环境可以锁定到 `strictKnownMarketplaces` 并阻止不受信任的源。

### Skill 系统：渐进式展开

Skill 是带 YAML frontmatter 的 Markdown 文件：

```markdown
---
name: My Skill
description: 分析 TypeScript 模式
when-to-use: 当用户要求重构 TypeScript 代码时
paths: [src/**/*.ts]
allowed-tools: [Read, Grep, Bash]
context: inline
---

给模型的详细指令...
```

`paths` 字段启用**渐进式展开**：带路径过滤器的 Skill 启动时隐藏，只在模型接触到匹配文件后才变得可见。这保持初始 Skill 列表小而相关 — 模型不会在启动时被 200 个选项淹没。

## Memory：改变一切的功能

大多数 AI 工具在会话之间是无状态的。Claude Code 不是。

### 四元组记忆分类

| 类型 | 用途 | 示例 |
|------|------|------|
| User | 用户是谁 | "资深 Go 工程师，React 新手" |
| Feedback | 应该怎么做 | "测试中不要 mock 数据库" |
| Project | 正在发生什么 | "3月5日后冻结合并，移动端发版" |
| Reference | 去哪里找 | "管道 bug 在 Linear 项目 INGEST 中跟踪" |

### Memory 架构

```
~/.claude/projects/<slug>/memory/
├── MEMORY.md           # 索引（最多 200 行，始终加载）
├── user_role.md        # 单独的记忆文件
├── feedback_testing.md
├── project_auth.md
└── reference_linear.md
```

`MEMORY.md` 始终注入到上下文中。单独的记忆文件按需加载。系统从对话中自动提取记忆，并通过 **Dream** 机制整合 — 一个后台任务处理会话日志为结构化记忆，不打断用户。

这就是让 Claude Code 感觉"认识你"的功能。几次会话后，它记住你的偏好、你的项目上下文、你团队的约束。目前没有其他主流 AI 编程工具做到这一点。

## 值得关注的独特功能

**Buddy**：程序化生成的伴侣，确定性的"骨骼"（物种、稀有度、属性）加上 AI 生成的"灵魂"（名字、个性）。Legendary 稀有度无法伪造。纯粹的产品匠心 — 让 CLI 工具有温度。

**Thinkback**：记录和回放 AI 的思考过程。对调试 Agent 行为很有用。

**Voice 模式**：流式语音转文字，关键词识别，多语言支持。

**Vim 模式**：完整的 Vim 键绑定 — 移动、操作符、文本对象、模式切换。不是玩具实现。

**Dream**：后台记忆整合，将会话日志处理为结构化知识。基于时间 + 会话阈值触发。

**成本追踪**：完全透明 — 按模型成本、缓存命中率、token 细分、代码变更统计。

## Bridge：一个引擎，四个前端

Bridge 层是 Claude Code 同时支持 CLI、Desktop、Web 和 IDE 的关键：

- **REPL Bridge**: 本地 CLI，直接交互
- **Remote Bridge**: Desktop/Web/IDE，通过 SSE 或轮询
- **Hybrid Transport**: 本地和远程之间透明切换

会话管理处理创建、恢复、持久化和远程模式的 JWT 认证。`entrypoints/` 目录展示了 CLI、SDK 和 Bridge 模式的不同入口路径，全部汇聚到同一个 QueryEngine。

## Feature Flag 暗示的未来

源码中包含几个未完全启用的功能标记：

- **KAIROS**: 长期助手模式（追加式日志）
- **VOICE_MODE**: 完整语音模式
- **WORKFLOW_SCRIPTS**: 可编程工作流自动化
- **PROACTIVE**: 主动式交互（Agent 发起，而非仅响应）
- **DAEMON**: 后台守护进程模式

其中 PROACTIVE 标记最有意思。当前 AI 工具是被动的 — 它们等你提问。一个主动式的 Claude Code 可以监控你的仓库、建议修复、标记问题，或在你打开终端之前就准备好上下文。

## 这对行业意味着什么

### 1. AI 编程工具正在变成平台

Claude Code 不是在自动补全层面和 GitHub Copilot 竞争。它是在可扩展性层面和 VS Code 竞争。插件市场、Hook 系统、多 Agent 运行时 — 这些是平台原语。信号很清楚：赢得 AI 编程工具之战的将是拥有最好生态系统的那个，而非最好模型。

### 2. Memory 是下一个护城河

无状态 AI 助手是商品化的。任何工具都能拿你的代码上下文去调用 Claude 或 GPT-4。但一个记住你偏好、你的项目约束、你团队的规范、你过去调试经历的助手 — 那才创造切换成本。Claude Code 的 Memory + Dream 系统是这个理念的早期实现。

### 3. 安全必须是架构，不能是策略

Claude Code 不是告诉模型"小心点"。它通过沙箱隔离、分层权限、Hook 拦截和人在环中的审批流来**强制执行**安全。仅 `PreToolUse` hook 一项，就比大多数 AI 工具的全部安全基础设施还多。随着 Agent 能力增强，这种结构性安全将成为基本要求。

### 4. 多 Agent 是真实的，而且很复杂

292 个 agent 的 36.8GB 内存泄漏是一个有说服力的细节。多 Agent 系统很强大，但在资源管理、消息路由和隔离方面带来真实的工程挑战。Claude Code 的 `TEAMMATE_MESSAGES_UI_CAP`、`AsyncLocalStorage` 隔离和 prompt cache 对齐，是大多数 Agent 框架还没遇到的问题的实用解决方案。

### 5. CLI 没有死

Claude Code 选择终端作为主要界面。不是 Web 应用。不是 VS Code 侧边栏。一个 CLI — 带 Vim 绑定、语音输入、伴侣系统和贴纸。这是一个赌注：开发者想要的 AI 工具应该活在他们已经工作的地方，而不是又一个浏览器标签页。

---

*本分析基于对 1,884 个 TypeScript 源文件、150+ 目录的完整阅读。源码已被撤下。所有发现反映分析时观察到的架构。*
