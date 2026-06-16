---
title: 'OpenSpec 教程：CLI 安装、命令、AGENTS.md 与实战示例'
pubDate: 2026-06-16T08:15:00.000Z
description: '面向 AI 原生规范驱动开发的 OpenSpec 实用教程：安装 CLI、初始化项目、创建变更、验证规范、使用 AGENTS.md，以及棕地项目工作流实战。'
author: 'Remy'
tags: ['openspec', 'spec-driven development', 'sdd', 'ai coding', 'agents.md', 'cli', '规范驱动开发', 'AI 编码']
lang: 'zh'
translatedFrom: 'openspec-tutorial-cli-commands-agents-md-examples'
---

## 什么是 OpenSpec？

**OpenSpec** 是一个面向 AI 原生的规范驱动开发系统。在实际使用中，它为你的 AI 编码工作流提供了持久化的结构：你不再需要让 Agent 去"直接实现这个功能"，而是将预期的变更描述为一个提案，验证规范，让 Agent 依据规范实现，最后将已完成的变更归档回主要的知识源。

这使得 OpenSpec 在**棕地项目**中尤为实用：在现有代码库中，大多数工作并非从零重写，而是持续不断的 Bug 修复、功能迭代、重构和产品变更。

如果你想对比更广泛的方案，我也写了一篇关于 SDD 的详细比较文章：[BMAD vs spec-kit vs OpenSpec vs PromptX](/blog/-sddbmad-vs-spec-kit-vs-openspec-vs-promptx/)。本教程仅聚焦于 OpenSpec 的日常使用。

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

你可以用 `npx` 直接运行：

```bash
npx -y @fission-ai/openspec@latest --help
```

CLI 入口命令为 `openspec`：

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

在仓库根目录执行：

```bash
npx -y @fission-ai/openspec@latest init .
```

如果你想以非交互方式配置 AI 工具，使用 `--tools`：

```bash
npx -y @fission-ai/openspec@latest init . --tools claude,codex,cursor,gemini,github-copilot
```

也可以使用：

```bash
npx -y @fission-ai/openspec@latest init . --tools all
npx -y @fission-ai/openspec@latest init . --tools none
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

核心思维模型是：**规范先行，代码跟随**。

## 创建新的 OpenSpec 变更

使用 `openspec new change <name>`：

```bash
npx -y @fission-ai/openspec@latest new change add-user-login
```

可以附带描述：

```bash
npx -y @fission-ai/openspec@latest new change add-user-login \
  --description "Add email/password login with session persistence"
```

对于协作工作区，该命令还支持以下参数：

```text
--goal <text>         工作区产品目标，随变更一起存储
--areas <names>       逗号分隔的受影响工作区链接名称
--initiative <id>     将仓库本地变更关联到某个计划
--schema <name>       使用的工作流 schema，默认：spec-driven
--json                以 JSON 格式输出
```

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
npx -y @fission-ai/openspec@latest new change add-magic-link-login \
  --description "Allow users to sign in with one-time email magic links"
```

然后在编码之前定义意图。一个好的提案需要回答：

- 这解决了什么用户问题？
- 哪些现有流程受到影响？
- 什么必须保持向后兼容？
- 验收标准是什么？
- AI Agent 不应该修改什么？

示例如下：

```markdown
# 变更：add-magic-link-login

## 原因
用户忘记密码，支持团队频繁收到重置请求。魔法链接登录应该在保留现有密码登录的同时降低使用摩擦。

## 变更内容
- 添加魔法链接请求表单。
- 发送一次性邮件 token。
- 验证 token 并创建会话。
- 保持现有的邮箱/密码登录不变。

## 非目标
- 不删除密码登录。
- 不重新设计整个认证页面。
- 不修改账单或账户设置。

## 验收标准
- 有效链接只能让用户登录一次。
- 过期或已使用的链接安全失败。
- 现有密码登录测试仍然通过。
```

这正是 OpenSpec 的意义所在：它给 AI Agent 提供了一个更小、更安全的工作边界。

## 验证变更和规范

实现之前，运行验证：

```bash
npx -y @fission-ai/openspec@latest validate add-magic-link-login
```

更严格的检查：

```bash
npx -y @fission-ai/openspec@latest validate add-magic-link-login --strict
```

验证全部内容：

```bash
npx -y @fission-ai/openspec@latest validate --all
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
npx -y @fission-ai/openspec@latest validate --all --strict --json --no-interactive
```

## 列出和检查 OpenSpec 条目

列出活跃变更：

```bash
npx -y @fission-ai/openspec@latest list
```

列出规范：

```bash
npx -y @fission-ai/openspec@latest list --specs
```

获取机器可读输出：

```bash
npx -y @fission-ai/openspec@latest list --json
```

显示某个变更或规范：

```bash
npx -y @fission-ai/openspec@latest show add-magic-link-login
```

以 JSON 格式显示：

```bash
npx -y @fission-ai/openspec@latest show add-magic-link-login --json
```

如果名称有歧义，指定类型：

```bash
npx -y @fission-ai/openspec@latest show add-magic-link-login --type change
```

对于变更评审自动化，`--deltas-only` 可能很有用：

```bash
npx -y @fission-ai/openspec@latest show add-magic-link-login --json --deltas-only
```

## AGENTS.md 在 OpenSpec 中的角色

许多 AI 编码工具会读取仓库指令文件。`AGENTS.md` 已成为告知 Agent 如何在代码库中行为的通用约定。

OpenSpec 可以为支持的工具生成或更新指令文件。这一点很重要，因为规范工作流只有在 Agent 了解规则的情况下才能正常运转：

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
npx -y @fission-ai/openspec@latest archive add-magic-link-login
```

跳过确认提示：

```bash
npx -y @fission-ai/openspec@latest archive add-magic-link-login --yes
```

对于基础设施、工具或纯文档变更，无需更新规范时：

```bash
npx -y @fission-ai/openspec@latest archive docs-update --skip-specs
```

也有 `--no-validate` 参数，但应将其视为紧急逃生口，而非常规工作流。

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

AI Agent 常常容易超出范围。`非目标` 章节可以防止意外的范围扩展。

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

## 总结

OpenSpec 的价值在于，它将 AI 编码从纯聊天式活动转变为可评审的变更管理循环：

```text
提案 -> 规范增量 -> 验证 -> 实现 -> 评审 -> 归档
```

这个循环很简单，但它解决了一个真实的问题：AI Agent 需要持久的上下文和明确的边界。OpenSpec 同时提供了这两者。
