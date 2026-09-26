---
title: 'OpenSpec 教程：CLI 安装、命令、AGENTS.md 与实战示例'
pubDate: 2026-06-16T08:15:00.000Z
description: '面向 AI 原生规范驱动开发的 OpenSpec 实用教程：安装 CLI、初始化项目、创建变更、验证规范、使用 AGENTS.md，以及棕地项目工作流实战。'
author: 'Remy'
tags: ['openspec', 'sdd', 'ai-coding', 'agents.md', 'cli', '规范驱动开发', 'AI 编码']
lang: 'zh'
translatedFrom: 'openspec-tutorial-cli-commands-agents-md-examples'
---

## OpenSpec 快速开始

本文使用 npm 已发布的 **OpenSpec 1.13.2**，需要 Node.js **20.19.0+** 和 pnpm。验证环境为 Node.js 26.7.0、pnpm 10.28.2；在仓库外空目录验证文件工作流，没有调用模型。先进入新建的练习目录，再运行：

```bash
pnpm dlx @fission-ai/openspec@1.13.2 --help
pnpm dlx @fission-ai/openspec@1.13.2 init . --tools none
```

`--tools none` 只初始化规范目录，不安装编码助手集成。熟悉生成文件后，再决定如何引入现有项目。定义、适用边界和文件关系见[OpenSpec 独立指南](/cn/garden/notes/openspec-guide/)；本教程专门完成第一个变更。

## 什么是 OpenSpec？

**OpenSpec** 是一个面向 AI 原生的规范驱动开发系统。在实际使用中，它为你的 AI 编码工作流提供了持久化的结构：你不再需要让 Agent 去"直接实现这个功能"，而是将预期的变更描述为一个提案，验证规范，让 Agent 依据规范实现，最后将已完成的变更归档回主要的知识源。

这使得 OpenSpec 在**棕地项目**中尤为实用：在现有代码库中，大多数工作并非从零重写，而是持续不断的 Bug 修复、功能迭代、重构和产品变更。

如果你想对比更广泛的方案，可以阅读 SDD 比较文章：[BMAD vs spec-kit vs OpenSpec vs PromptX](/cn/blog/-sddbmad-vs-spec-kit-vs-openspec-vs-promptx/)。本教程仅聚焦于 OpenSpec 的日常使用。

## 什么时候应该使用 OpenSpec？

当你希望 AI 编码 Agent 以更高的确定性运行、减少提示漂移时，请使用 OpenSpec。

适合的场景：

- 你已有一个可运行的代码库，希望 AI 辅助变更更加安全。
- 你需要一个轻量级的规范工作流，而不想引入繁重的企业级流程。
- 你希望清晰记录改了什么、为什么改、哪些需求被更新了。
- 你使用多种 AI 工具，希望共享项目指令。
- 你希望评审者在代码生成之前，先评估**意图和验收标准**。

对于一次性的临时原型，OpenSpec 并非必须。但当一个仓库需要持续积累可靠的决策时，它的价值就体现出来了。

## 安装或运行 OpenSpec CLI

npm 包名为：

```bash
@fission-ai/openspec
```

使用 pnpm 运行固定版本：

```bash
pnpm dlx @fission-ai/openspec@1.13.2 --help
```

CLI 入口命令为 `openspec`。后文速查表与可选 AGENTS.md 示例中的裸命令，要求已经单独安装同版本 CLI；否则都使用 `pnpm dlx @fission-ai/openspec@1.13.2` 前缀：

```bash
openspec --help
```

顶级帮助包含如下命令：

```text
init            在项目中初始化 OpenSpec
update          更新 OpenSpec 指令文件
list            列出变更或规范
view            显示交互式仪表板
new change      创建新的变更目录
validate        验证变更和规范
show            显示某个变更或规范
archive         归档已完成的变更并更新主规范
status          显示制品完成状态
instructions    输出增强的制品/任务指令
```

## 在项目中初始化 OpenSpec

如果希望交互选择编码工具，在目标项目根目录执行下面的命令。它是练习中 `--tools none` 的替代选项，不是必须再次初始化：

```bash
pnpm dlx @fission-ai/openspec@1.13.2 init .
```

如果你想以非交互方式配置 AI 工具，使用 `--tools`：

```bash
pnpm dlx @fission-ai/openspec@1.13.2 init . --tools claude,codex,cursor,gemini,github-copilot
```

也可以使用：

```bash
pnpm dlx @fission-ai/openspec@1.13.2 init . --tools all
pnpm dlx @fission-ai/openspec@1.13.2 init . --tools none
```

CLI 帮助中目前列出了众多支持的工具，包括 `claude`、`codex`、`cursor`、`gemini`、`github-copilot`、`kilocode`、`qwen`、`windsurf`、`cline`、`continue`、`opencode`、`roocode`、`trae` 等。

## OpenSpec 核心工作流

一个简单的 OpenSpec 循环如下：

1. **初始化** OpenSpec 到仓库。
2. 为一个功能、Bug 修复或重构**创建一个变更**。
3. 在实现之前**撰写提案和规范增量**。
4. **验证**变更。
5. **让 AI Agent 依据已批准的变更实现**代码。
6. **评审并测试**代码。
7. **归档**已完成的变更，使主规范保持最新。

本教程采用**先评审规范，再实现代码**的项目约定。OpenSpec 的产物工作流可以反复修改：实现中发现新约束时，返回更新 proposal、delta、design 和 tasks，再次验证。CLI 不强制不可回头的线性顺序。

## 创建新的 OpenSpec 变更

使用 `openspec new change <name>`：

```bash
pnpm dlx @fission-ai/openspec@1.13.2 new change add-user-login
```

可以附带描述：

```bash
pnpm dlx @fission-ai/openspec@1.13.2 new change add-user-login \
  --description "Add email/password login with session persistence"
```

已发布的 1.13.2 中，`new change --help` 列出：

```text
--goal <text>         随变更存储的可选目标元数据
--schema <name>       使用的工作流 schema，默认：spec-driven
--json                以 JSON 格式输出
```

不要把旧 workspace 示例中的 `--areas`、`--initiative` 复制到此版本。`--goal` 仍然有效，但它是可选元数据，不是必需的工作区配置。判断参数时使用同版本帮助，不混用 npm 发布包与官方 main。

好的变更名称应该具体且面向行动：

```text
add-user-login
fix-billing-retry-idempotency
refactor-search-indexing
improve-onboarding-empty-state
```

避免模糊的名称：

```text
updates
misc-fixes
new-stuff
ai-work
```

## 示例：棕地功能变更

假设你在维护一个 SaaS 应用，想添加魔法链接登录功能。

创建变更：

```bash
pnpm dlx @fission-ai/openspec@1.13.2 new change add-magic-link-login --description "Allow users to sign in with one-time email magic links"
```

然后在编码之前定义意图。一个好的提案需要回答：

- 这解决了什么用户问题？
- 哪些现有流程受到影响？
- 什么必须保持向后兼容？
- 验收标准是什么？
- AI Agent 不应该修改什么？

将下面内容保存为 `openspec/changes/add-magic-link-login/proposal.md`。上面的命令只生成元数据和带描述的 README，不会自动补齐 proposal 与 delta。示例保留工具模板的英文结构标题，解释与评审使用中文：

```markdown
# Change: add-magic-link-login

## Why
本例假定用户忘记密码，支持团队频繁收到重置请求。希望在保留现有密码登录的同时，增加一次性邮件链接供已有用户使用；不把注册或账户恢复扩展到本次变更中。

## What Changes
- 添加魔法链接请求表单。
- 发送一次性邮件 token。
- 验证 token 并创建会话。
- 保持现有的邮箱/密码登录不变。

## Capabilities
### New Capabilities
- `auth`：在密码登录之外提供一次性链接登录。
### Modified Capabilities
- 无。练习项目尚无现存 auth 规范。

## Impact
认证路由、token 存储、邮件发送和登录测试。

## Non-goals
- 不删除密码登录。
- 不重新设计整个认证页面。
- 不修改账单或账户设置。

## Acceptance criteria
- 有效链接只能让用户登录一次。
- 过期或已使用的链接安全失败。
- 现有密码登录测试仍然通过。
```

真实项目如果已有 auth 规范，需要先检查原文：已有需求可能应使用 `MODIFIED`，而不是再添加一个 `ADDED`。本练习特意从没有主 auth 规范的目录开始。

### 补齐实际的规范增量文件

创建 `openspec/changes/add-magic-link-login/specs/auth/` 目录，把下列完整内容保存为 `openspec/changes/add-magic-link-login/specs/auth/spec.md`：

```markdown
## Purpose
Allow existing users to sign in with a single-use email link while preserving the existing password sign-in flow.

## ADDED Requirements

### Requirement: Single-use magic-link sign-in
The system SHALL allow an existing user to sign in with a valid, unexpired, unused email link, consume it atomically, and reject expired or reused links without creating a session.

#### Scenario: Valid link
- **WHEN** an existing user submits a valid, unexpired, unused link
- **THEN** the system creates a session and marks the link as used

#### Scenario: Expired link
- **WHEN** a user submits an expired link
- **THEN** the system rejects it without creating a session

#### Scenario: Reused link
- **WHEN** a user submits a previously used link
- **THEN** the system rejects it without creating a session

### Requirement: Preserve password sign-in
The system SHALL retain the existing email and password sign-in behavior.

#### Scenario: Existing password login
- **WHEN** an existing user submits correct email and password credentials
- **THEN** the system signs the user in through the existing flow
```

两条需求分别要求一次性链接登录和保留密码登录；四个场景覆盖有效、过期、已使用的链接，以及原有密码登录。`## ADDED Requirements`、`### Requirement:`、`#### Scenario:` 是解析器识别的结构，示例保留英文标记和 `SHALL`。提案里的验收列表不能替代这个文件。格式验证也不能证明 token 消费确实具有原子性。

### 补齐设计和实施任务

保存为 `openspec/changes/add-magic-link-login/design.md`：

```markdown
## Context
增加魔法链接登录，保留现有密码登录。

## Goals / Non-Goals
只支持已有用户；注册、账单和页面重新设计不在范围内。

## Decisions
保存随机 token 的哈希值、用户 ID、到期时间与使用状态。
先原子地消费未过期 token，再创建会话。
保留密码流程，使用本地邮件测试替身。

## Risks / Trade-offs
非原子消费可能让并发请求重放 token。
需要覆盖过期、重用和并发请求的应用测试。

## Migration Plan
使用功能开关引入 token 存储；关闭后仍保留密码登录。
```

保存为 `openspec/changes/add-magic-link-login/tasks.md`：

```markdown
## 1. Implementation
- [ ] 1.1 添加 token 存储和请求端点，使用本地邮件测试替身。
- [ ] 1.2 实现原子 token 消费与会话创建。

## 2. Verification
- [ ] 2.1 测试有效、过期、重用和并发提交 token 的情况。
- [ ] 2.2 运行现有密码登录回归测试并检查变更差异。
```

文档齐备意味着可以评审，不代表功能已经交付。只有实现和测试有了证据，才勾选对应任务。检查 schema 产物状态：

```bash
pnpm dlx @fission-ai/openspec@1.13.2 status --change add-magic-link-login --json
```

## 验证变更和规范

实现之前，运行验证：

```bash
pnpm dlx @fission-ai/openspec@1.13.2 validate add-magic-link-login
```

更严格的检查：

```bash
pnpm dlx @fission-ai/openspec@1.13.2 validate add-magic-link-login --strict --json --no-interactive
```

验证全部内容：

```bash
pnpm dlx @fission-ai/openspec@1.13.2 validate --all
```

常用验证参数：

```text
--all              验证所有变更和规范
--changes          验证所有变更
--specs            验证所有规范
--type <type>      在有歧义时指定变更或规范
--strict           启用严格验证模式
--json             以 JSON 格式输出验证结果
--no-interactive   禁用交互式提示
```

在 CI 中，`--json` 和 `--no-interactive` 特别有用：

```bash
pnpm dlx @fission-ai/openspec@1.13.2 validate --all --strict --json --no-interactive
```

## 列出和检查 OpenSpec 条目

列出活跃变更：

```bash
pnpm dlx @fission-ai/openspec@1.13.2 list
```

列出规范：

```bash
pnpm dlx @fission-ai/openspec@1.13.2 list --specs
```

获取机器可读输出：

```bash
pnpm dlx @fission-ai/openspec@1.13.2 list --json
```

显示某个变更或规范：

```bash
pnpm dlx @fission-ai/openspec@1.13.2 show add-magic-link-login
```

以 JSON 格式显示：

```bash
pnpm dlx @fission-ai/openspec@1.13.2 show add-magic-link-login --json
```

如果名称有歧义，指定类型：

```bash
pnpm dlx @fission-ai/openspec@1.13.2 show add-magic-link-login --type change
```

对于变更评审自动化，`--deltas-only` 可能很有用：

```bash
pnpm dlx @fission-ai/openspec@1.13.2 show add-magic-link-login --json --deltas-only
```

## AGENTS.md 在 OpenSpec 中的角色

许多 AI 编码工具会读取仓库指令文件。`AGENTS.md` 已成为告知 Agent 如何在代码库中行为的通用约定。

OpenSpec 生成的是工具对应的 skills 和命令文件。例如，另一次 1.13.2 初始化选择 `--tools claude` 后，会生成 `.claude/skills/openspec-propose/SKILL.md` 和 `.claude/commands/opsx/propose.md`，不要求存在自动生成的 `openspec/AGENTS.md`。下面这些是可以手写的可选项目约束：

- 在阅读变更提案之前不要实现。
- 将实现范围限定在已批准的变更内。
- 在规范要求时更新测试和文档。
- 在声明任务完成之前运行验证。
- 只有在实现和评审都完成后才归档。

一个针对 OpenSpec 的 `AGENTS.md` 实用示例如下：

```markdown
## OpenSpec 工作流

- 编码前，用 `openspec list` 检查活跃的 OpenSpec 变更。
- 对于新功能或行为变更，在 `openspec/changes/` 下创建或使用一个变更。
- 不要在功能变更中实现大范围的无关重构。
- 在交付实现前运行 `openspec validate <change-name> --strict`。
- 代码和测试通过后，使用 `openspec archive <change-name>` 归档。
```

`AGENTS.md` 的价值不在于它能神奇地让 AI 完美运行。它的价值在于，每个兼容的助手都从相同的操作契约出发。

## 使用 AI 编码 Agent 实现

一旦变更已撰写并验证，给 Agent 一条聚焦的指令：

```text
实现 OpenSpec 变更 `add-magic-link-login`。
先阅读提案和规范增量。
将实现范围限定在此变更内。
运行相关测试，并报告任何与规范的偏差。
```

这比以下提示要好得多：

```text
添加魔法链接登录。
```

OpenSpec 版本为 Agent 提供了持久的知识源、明确的边界和可评审的目标。

## 归档已完成的变更

在实现、评审和测试完成后，归档变更：

```bash
pnpm dlx @fission-ai/openspec@1.13.2 archive add-magic-link-login
```

跳过确认提示：

```bash
pnpm dlx @fission-ai/openspec@1.13.2 archive add-magic-link-login --yes
```

检查活跃变更已移至 `openspec/changes/archive/YYYY-MM-DD-add-magic-link-login/`，并确认 `openspec/specs/auth/spec.md` 已包含两条需求。随后验证主规范：

```bash
pnpm dlx @fission-ai/openspec@1.13.2 validate auth --type spec --strict --json --no-interactive
```

本次在隔离目录使用上述文件验证了 init、new、严格验证和 archive，没有实现认证，也没有发送邮件。演练保留未勾选的应用任务，archive 会发出警告；归档成功不能证明这些任务完成。真实项目必须先完成实现、测试和任务状态更新，再归档，不应跳过验证来让示例通过。

delta 中的 `## Purpose` 会在首次创建能力规范时提供用途说明。缺少它时，archive 可能生成占位文字，导致主规范严格验证失败；已有主规范的占位文字需要直接修改主规范。`--skip-specs` 只适用于确实无需更新规范的变更，本登录示例需要合并 delta，不能跳过。

## OpenSpec 命令速查表

| 任务 | 命令 |
|---|---|
| 显示 CLI 帮助 | `openspec --help` |
| 初始化仓库 | `openspec init .` |
| 初始化并指定工具 | `openspec init . --tools claude,codex,cursor` |
| 创建变更 | `openspec new change add-user-login` |
| 列出活跃变更 | `openspec list` |
| 列出规范 | `openspec list --specs` |
| 显示变更或规范 | `openspec show <name>` |
| 验证单个条目 | `openspec validate <name>` |
| 严格验证 | `openspec validate <name> --strict` |
| 验证全部 | `openspec validate --all --strict` |
| 归档已完成变更 | `openspec archive <name>` |
| 归档（跳过提示） | `openspec archive <name> --yes` |
| 更新指令文件 | `openspec update .` |

## OpenSpec 最佳实践

### 1. 保持每个变更足够小

当一个变更对应一个连贯的功能、Bug 修复或重构时，OpenSpec 效果最佳。如果一个提案包含了认证、定价、引导和重新设计，请拆分它。

### 2. 明确写出非目标

AI Agent 可能超出范围。`非目标` 章节让评审更容易发现范围变化，但它不是文件写入权限控制。

### 3. 实现前先验证

验证在 AI 编写代码之前捕获结构性问题。这比基于薄弱规范调试生成代码要便宜得多。

### 4. 使用 JSON 输出进行自动化

`openspec list --json`、`openspec show --json` 和 `openspec validate --json` 等命令在脚本和 CI 检查中非常有用。

### 5. 坚持归档

如果已完成的变更从不归档，仓库会积累过期的提案。归档步骤才能保证主规范与现实保持一致。

## 常见错误

### 错误：把 OpenSpec 当成文档仓库

OpenSpec 不仅仅是存放随机文档的地方。它是一个受控变更的工作流。

### 错误：创建一个巨大的变更

大型变更使 AI 实现难以评审。优先选择多个带有明确验收标准的小变更。

### 错误：跳过验证

如果规范无效，生成的代码可能会偏离。尽早验证。

### 错误：让 Agent 自行推断一切

不要让 Agent 猜测产品意图。撰写提案、定义非目标、明确验收标准。

## OpenSpec vs spec-kit vs BMAD：快速定位

- **OpenSpec**：最适合轻量级、棕地、以变更为中心的工作流。
- **GitHub spec-kit**：更适合结构化的绿地或企业级门控流程。
- **BMAD**：在开发前需要基于角色的 AI 规划团队时有用。
- **PromptX**：更像一个上下文/角色平台，而非严格的规范工作流。

如果你的团队在问"我们如何在现有仓库中安全地使用 AI Agent？"，OpenSpec 是最实用的起点之一。

## 版本化参考资料

- [OpenSpec 1.13.2 README](https://github.com/Fission-AI/OpenSpec/blob/v1.13.2/README.md)
- [1.13.2 CLI 参考](https://github.com/Fission-AI/OpenSpec/blob/v1.13.2/docs/cli.md)
- [1.13.2 OPSX 工作流](https://github.com/Fission-AI/OpenSpec/blob/v1.13.2/docs/opsx.md)

## 总结

OpenSpec 的价值在于，它将 AI 编码从纯聊天式活动转变为可评审的变更管理循环：

```text
提案 -> 规范增量 -> 验证 -> 实现 -> 评审 -> 归档
```

这个循环很简单，但它解决了一个真实的问题：AI Agent 需要持久的上下文和明确的边界。OpenSpec 同时提供了这两者。
