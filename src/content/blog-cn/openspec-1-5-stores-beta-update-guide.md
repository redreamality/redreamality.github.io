---
title: 'OpenSpec Stores 多仓库实战：配置、共享规范与同步排错'
pubDate: 2026-07-02T01:30:00.000Z
updatedDate: 2026-10-26T00:00:00.000Z
description: '用 OpenSpec Stores 连接两个代码仓库，配置共享规范引用和本地任务，处理 Git 同步、根目录选择与冲突，并区分 1.15.0 发布版和 Beta 功能边界。'
author: 'Remy'
tags: ['openspec', 'sdd', 'ai-coding', 'stores', 'ai-agents', 'cli', '规范驱动开发']
lang: 'zh'
translatedFrom: 'openspec-1-5-stores-beta-update-guide'
---

## 在两个代码仓库中使用 Stores

2026 年 10 月 26 日更新：**npm `latest` 已发布 1.15.0，其中包含 Stores，但 Stores 功能仍标为 Beta。** npm 的 `beta` 标签目前指向更早的 `1.6.0-beta.1`，不要因为功能叫 Stores Beta 就安装该标签。下面的命令使用 1.15.0 发布包，不依赖尚未发布的 `main`。

Store 让 API 仓库和 Web 仓库读取同一份规范，同时各自维护实现变更。它不会把任务分发给不同仓库，不授予文件权限，也不自动同步 Git。我建议把需要独立测试和评审的组件任务留在本地；只有团队确实希望共用一套规划生命周期时，才把默认规划位置指向外部 Store。

这些行为以[官方 1.15.0 Stores 指南](https://github.com/Fission-AI/OpenSpec/blob/v1.15.0/docs/stores-beta/user-guide.md)和[CLI 参考](https://github.com/Fission-AI/OpenSpec/blob/v1.15.0/docs/cli.md)为准。安装或 PATH 有问题，先看[CLI 安装教程](/cn/blog/openspec-tutorial-cli-commands-agents-md-examples/)。原有 1.5 版本分析保留在后文，章节链接不变。

<a id="multi-repo-practice"></a>

### 建立共享契约和两个本地变更

先进入一个练习目录，下面会在其中创建同级的 `team-contracts`、`checkout-api` 和 `checkout-web`。终端命令假定已安装 1.15.0；尚未全局安装时，把 `openspec` 换成 `pnpm dlx @fission-ai/openspec@1.15.0`：

```bash
openspec --version
openspec store setup team-contracts --path ./team-contracts --no-init-git --json
git init checkout-api
git init checkout-web
```

`--no-init-git` 让练习 Store 不自动初始化 Git 或创建提交。setup 会生成 `.openspec-store/store.yaml`、OpenSpec 根目录和本机注册，不会创建或发布远程仓库。实际团队默认使用私有仓库保存共享规范，除非明确希望公开。

创建 `team-contracts/openspec/specs/promotion/spec.md`，写入完整练习契约：

```markdown
## Purpose
Define the shared response used by the checkout API and web client.

## Requirements

### Requirement: Promotion eligibility
The API SHALL return an eligible boolean and a reason string for a promotion.

#### Scenario: Ineligible promotion
- **WHEN** the promotion cannot be used
- **THEN** eligible is false and reason explains why
```

这份契约要求 API 返回 `eligible` 布尔值和 `reason` 字符串，优惠不可用时返回 false 并说明原因。示例从已接受的练习规范起步；生产项目应先评审契约提案，再把它视为已接受的行为。验证文件并初始化两个组件：

```bash
openspec validate promotion --type spec --store team-contracts --strict --json --no-interactive
cd checkout-api
openspec init . --tools none
cd ../checkout-web
openspec init . --tools none
```

在两个代码仓库的 `openspec/config.yaml` 中合并以下字段，保留已有 context 和 rules：

```yaml
schema: spec-driven
references:
  - team-contracts
```

进入各自目录创建组件任务：

```bash
cd ../checkout-api
openspec new change implement-promotion-api
openspec instructions proposal --change implement-promotion-api --json
openspec context --json
cd ../checkout-web
openspec new change implement-promotion-ui
openspec instructions proposal --change implement-promotion-ui --json
openspec context --json
openspec show promotion --type spec --store team-contracts
```

继续之前检查返回的 `root.path`，它必须是当前组件仓库。`references` 数组应包含 `promotion` 和带 `--store team-contracts` 的读取命令。两个变更目录分别位于组件自己的 `openspec/changes/`，不能出现在 Store 中。这些检查证明文件位置和引用关系正确，不证明 API 或界面已经实现。

各组件 proposal 应引用 `promotion`，并记录采用的 Store 提交。API 任务定义响应行为及测试；UI 任务定义用户如何看到 `eligible: false` 和 `reason`。然后补齐各自 design 与规范增量，验证格式，运行应用测试，再评审和归档。[首个变更教程](/cn/blog/openspec-tutorial-cli-commands-agents-md-examples/)提供完整产物格式。

需要修改共享契约本身时，显式选择 Store：

```bash
openspec new change revise-promotion-contract --store team-contracts
openspec status --change revise-promotion-contract --store team-contracts --json
```

引用索引只包含 `openspec/specs/` 中的主规范，不包含 Store 内尚未归档的活跃变更。实施必须跟随未完成契约时，等变更产物存在后，用 `openspec show revise-promotion-contract --store team-contracts` 显式读取，并关联 Store 分支和两个组件的评审。workset 可以把目录一起打开供编辑器读取，但不会给 agent 分派组件任务。

### 用 Git 共享和同步契约

真实协作时，通过正常 Git 流程初始化并提交 Store，再添加实际的私有远端。其他成员克隆后运行 `openspec store register <local-path> --id team-contracts`。每台机器都需要注册；`remote:` 声明只是提供克隆指引，不会自动下载仓库。

读取共享契约前先检查检出状态。以下命令要求 Store 已有 Git 仓库、`origin` 和上游跟踪分支：

```bash
git -C team-contracts status --short
git -C team-contracts fetch origin
git -C team-contracts log --oneline HEAD..@{upstream}
git -C team-contracts pull --ff-only
git -C team-contracts rev-parse HEAD
openspec doctor --store team-contracts --json
```

这段使用 Bash 语法；PowerShell 中把范围写成 `'HEAD..@{upstream}'`。工作区已有修改时，先按团队分支流程处理，再拉取。无法快进时，检查两边提交，明确选择合并或变基；不要为清掉冲突直接覆盖另一边规范。把最终 Store 提交记入两个组件 proposal，评审者才能核对同一版契约。

`doctor` 只能看到本地已取得的 Git 信息，不访问远端、不同步文件，也不修复问题。检出目录过旧，引用摘要就会过旧。`/opsx:sync` 是把规范增量合并到主规范，不是 Git 同步命令。

### 排查引用缺失和写错目录

<div class="content-table-scroll" role="region" aria-label="现象 / 检查与处理" tabindex="0">

| 现象 | 检查与处理 |
| --- | --- |
| 找不到引用 | 在组件中运行 `openspec doctor --json`，按需克隆，再注册实际目录 |
| 同一 Store ID 对应另一个目录 | 每台机器每个 ID 只对应一个检出目录；核对两边路径后，再 unregister 并注册目标目录 |
| 组件变更写进 Store | 检查显式 `--store`、配置中的 `store:` 和全局 `defaultStore`；独立组件任务使用本地根目录加 `references` |
| 引用仍是旧内容 | 核对 Store 分支和提交，取得并评审 Git 更新，再运行 instructions |
| 引用缺失但退出码为 0 | 检查 `references[].status`，`doctor` 不会因健康检查发现问题就返回失败 |

</div>

1.15.0 的选择顺序是显式 `--store`、最近的真实规划根目录、项目 `store:` 指针、全局 `defaultStore`。都不适用时，有已注册 Store 就要求明确选择，没有注册则保持当前目录的传统行为。引用不会选择写入位置。

[可下载的检查脚本](/assets/openspec-search-repair/check-examples.mjs)在临时目录创建本例，并通过 `XDG_DATA_HOME`、`XDG_CONFIG_HOME` 隔离注册表。准备 Node.js、pnpm 和 Git 后运行 `node check-examples.mjs`；Windows 把 pnpm 的 `bin/pnpm.cjs` 完整路径作为第一个参数。可选第二个参数指向本站检出目录，额外重放三语教程片段。脚本不调用模型，也不访问 Git 远端。

## 1.5 版本的历史背景

OpenSpec 1.5 引入了把共享规划放到代码仓库外的 Stores。以下章节保留该版本的设计与工具适配分析；当前配置和根目录选择以开头的固定版本练习为准。

如果只看一个关键词，就是 **Stores**。如果只看一条工作流，就是：

```text
explore → propose → apply → archive
```

历史章节依据[1.5.0 更新记录](https://github.com/Fission-AI/OpenSpec/blob/v1.5.0/CHANGELOG.md)及该标签下的 CLI、命令、探索和既有项目文档，解释引入 Stores 的原因及工具适配修复对团队的影响。

如果你还不熟悉 OpenSpec 的基础用法，可以先读这篇教程：[OpenSpec 教程：CLI 安装、命令、AGENTS.md 与实战示例](/cn/blog/openspec-tutorial-cli-commands-agents-md-examples/)。后文解释 1.5 引入这些能力的背景。

## 一句话总结

OpenSpec 1.5 的主线是：**用 Stores Beta 把 specs、changes 和 planning context 从单个 repo 里抽象出来；同时把 explore-first 变成更明确的推荐习惯，并补齐 brownfield 项目、AI command frontmatter、JSON 输出和多工具适配的稳定性。**

这意味着 OpenSpec 不再只是“让 AI 按规范写代码”的文件模板，而是在尝试解决更难的问题：

- 团队的规格和需求能否独立于代码仓库存在？
- 一个项目能否引用另一个团队维护的规格上下文？
- AI agent 能否在执行前知道“当前工作到底属于哪个 OpenSpec root”？
- 模糊需求能否先被探索，再进入正式变更流程？

## OpenSpec 1.5.0：Stores Beta 是核心变化

这里回顾的历史版本是 `@fission-ai/openspec@1.5.0`，npm 包描述是：

> AI-native system for spec-driven development

CLI 入口仍是：

```bash
openspec
```

但 1.5.0 开始，OpenSpec 新增了 **Stores very early beta**。官方文档对 Store 的定义很直接：

> A store is a standalone OpenSpec repo you've registered on this machine.

也就是说，Store 是一个可以被本机注册的独立 OpenSpec 仓库。它可以是：

- 团队共用的 planning repo；
- 产品/合约/架构规格仓库；
- 跨项目复用的需求上下文；
- 不想放进当前代码仓库的外部 spec root。

注册后，很多普通命令都可以通过 `--store <id>` 指向这个外部 root：

```bash
openspec list --store team-context
openspec show auth --type spec --store team-context
openspec new change add-billing-api --store team-context
openspec status --change add-billing-api --store team-context
openspec archive add-billing-api --store team-context
```

这就是它和旧模型的关键差异：过去 OpenSpec 更多假设你在当前 repo 的 `openspec/` 目录下工作；现在它开始明确管理“多个 OpenSpec root”。

## Stores 解决了什么问题？

在单人小项目中，把 `openspec/specs`、`openspec/changes` 放在当前 repo 里通常够用。但真实工程里经常会出现这些情况：

- 一个产品能力跨越多个 repo；
- 平台团队维护的规范要被多个业务团队引用；
- 代码仓库很大，但需求规格希望独立演进；
- AI agent 在不同 repo 中工作，但需要共享同一套业务约束；
- 既有项目不想一开始就引入完整 `openspec/` 目录。

Stores 的方向就是把规格从“某个代码仓库里的文件夹”提升为“可注册、可诊断、可引用、可选择的工程资产”。

这也是为什么我认为 Stores 不是一个小功能，而是 OpenSpec 的组织模型重构。

## Store 命令速览

官方 CLI 文档中，Store 相关能力仍标为 Beta：命令名、flag、文件格式和 JSON 输出都可能继续变化。但当前核心命令已经很清楚。

### 创建并注册一个 Store

```bash
openspec store setup team-context --path ~/openspec/team-context
```

如果你希望跳过 Git 初始化：

```bash
openspec store setup team-context --path ~/openspec/team-context --no-init-git
```

面向 agent 或脚本时，建议使用 `--json`，并显式传入 id 和 path：

```bash
openspec store setup team-context \
  --path ~/openspec/team-context \
  --no-init-git \
  --json
```

### 注册已有 Store

```bash
openspec store register ~/openspec/team-context --id team-context
```

### 只忘记本地注册，不删除文件

```bash
openspec store unregister team-context
```

这适合 Store 被移动、重新克隆，或你只是想让本机 OpenSpec 不再显示它。

### 删除本地 Store 文件夹

```bash
openspec store remove team-context --yes
```

文档中特别强调：`remove` 会删除本地文件夹，交互模式会显示将要删除的路径；脚本和 JSON 调用必须传 `--yes`。源码里也能看到它会校验 metadata，避免误删不匹配的目录。

### 列出本机 Store

```bash
openspec store list
openspec store ls --json
```

### 诊断 Store 健康状态

```bash
openspec store doctor
openspec store doctor team-context --json
```

`doctor` 只诊断，不会 clone、pull、push 或修复。它会报告 root、metadata、Git、references 等状态。对于 AI agent 来说，`--json` 输出里的 `status` 数组是更可靠的机器可读信号。

## 源码视角：Store Registry 如何工作

从源码看，Stores 的核心实现集中在：

```text
src/core/store/foundation.ts
src/core/store/registry.ts
src/core/store/operations.ts
src/core/root-selection.ts
src/commands/store.ts
```

其中 `foundation.ts` 定义了本机 registry 的文件名：

```ts
export const STORE_REGISTRY_FILE_NAME = 'registry.yaml';
```

Registry 的结构可以概括为：

```yaml
version: 1
stores:
  team-context:
    id: team-context
    root: /Users/you/openspec/team-context
    # backend / metadata / remote 等信息
```

源码里有几类关键操作：

- `readStoreRegistryState()`：读取本机 registry；
- `writeStoreRegistryState()`：写入 registry；
- `updateStoreRegistryState()`：带 lock 更新 registry，避免并发写冲突；
- `listStoreRegistryEntries()`：列出 stores；
- `registerStore()`：注册 Store；
- `unregisterStoreRegistration()`：移除本机注册；
- 冲突检查：防止同一个 id 指向不一致的 root 或 backend；
- metadata 校验：防止 registry id 与 Store 自身 metadata id 不一致。

这说明 OpenSpec 并不是简单地“记一个路径”。它开始把 Store 当成有身份、有健康状态、有本机注册表、有 Git/remote 元数据的上下文单元。

## Root selection：为什么 `--store` 很重要

OpenSpec 1.5 之后，很多命令都需要先回答一个问题：**当前命令应该作用在哪个 OpenSpec root 上？**

文档中提到，`list`、`show`、`validate`、`status`、`instructions`、`new change`、`archive`、`doctor`、`context` 等命令都会解析一个 root。

当前 1.15.0 的优先级是：

1. 显式 `--store <id>`；
2. 当前 repo 的本地 OpenSpec root；
3. `openspec/config.yaml` 中声明的默认 `store:`；
4. 全局配置的 `defaultStore`；
5. 都不适用时，有已注册 Store 就提示选择；没有则使用当前目录。

这对 AI agent 很关键。过去 agent 很容易在错误的目录下执行命令，或者把当前 repo 的 `openspec/` 和外部 workspace 状态混在一起。现在 JSON 输出和错误诊断会携带 root/store 信息，让 agent 更容易判断“我到底在改哪里”。

## References：只读引用，不改变写入位置

Store 还有一个很实用的用法：在项目的 `openspec/config.yaml` 里声明引用。

```yaml
schema: spec-driven
references:
  - team-context
```

或者带上远端来源：

```yaml
references:
  - { id: team-context, remote: "git@github.com:acme/team-context.git" }
```

之后，`openspec instructions` 会把引用 Store 的 spec 索引带进输出，包括：

- spec id；
- 从 Purpose 段落提取的一行 summary；
- 可用于拉取完整内容的命令，例如：

```bash
openspec show <spec-id> --type spec --store team-context
```

`references` 提供只读上下文，不改变命令的写入位置。在这个已有本地规划根目录的例子里，工作仍写在当前仓库；需要修改引用 Store 时，显式使用 `--store <id>`。

这个设计很重要：它避免了“引用上下文”和“生命周期归属”混在一起。一个 change 仍属于一个 root，reference 只是帮助 agent 理解背景。

## 默认外部 Store：把规划完全外置

如果某个 repo 不想本地保留 `openspec/specs` 或 `openspec/changes`，可以在 `openspec/config.yaml` 中声明默认 Store：

```yaml
store: team-context
```

这样普通命令会自动解析到这个 Store：

```bash
openspec list
openspec new change add-login
openspec status --change add-login
```

显式 `--store` 仍然优先；如果当前目录已经有真实 planning folders，本地 root 也不会被这个 pointer 强行覆盖。

## Context 与 Worksets：给 agent 的“工作集合”

OpenSpec 还引入了 `doctor` 和 `context` 两个相关但不同的问题：

```bash
openspec doctor [--store <id>] [--json]
openspec context [--store <id>] [--json]
```

可以这样理解：

- `doctor` 回答：这个 root 和它引用的 stores 健康吗？
- `context` 回答：这个工作到底由哪些 root/store 组成？

`context` 的 JSON 输出适合 agent 消费；它也可以通过 `--code-workspace` 生成 VS Code workspace，把当前 root 和可用引用 Store 组合成一个可打开的工作区。

Worksets 则更偏个人本地视图：把你经常一起工作的文件夹命名保存，方便重新打开。它是本地的、不提交、不共享，也不会从 declarations 自动推导。

## Explore-first：OpenSpec 的工作流重心前移

除了 Stores，6 月文档更新中另一个信号非常明显：OpenSpec 把 `/opsx:explore` 放到了更靠前的位置。

官方命令文档写得很直接：

> Start here when you're unsure.

`/opsx:explore` 的定位不是创建 change，而是作为“无风险的思考伙伴”：它可以先读代码、比较方案、澄清模糊想法，在 artifact 或 code 产生前把问题收敛成计划。

推荐习惯变成：

```text
/opsx:explore   # 不确定做什么时先探索
/opsx:propose   # 形成正式 change 和规划 artifacts
/opsx:apply     # 根据 tasks 实施
/opsx:archive   # 完成后归档并更新主规格
```

这和很多 AI coding 工具的默认体验很不同。大多数工具鼓励你直接说“实现 X”；OpenSpec 现在更强调：当需求还不清楚时，不要急着生成 proposal，更不要急着改代码。

## 终端命令和 AI Slash Commands 的分工

OpenSpec 文档反复强调一个容易混淆的点：

- `openspec init/update/list/validate/status/...` 是终端 CLI；
- `/opsx:explore`、`/opsx:propose`、`/opsx:apply`、`/opsx:archive` 是在 AI assistant 聊天里输入的命令。

一个典型流程是：

```bash
# terminal
pnpm dlx @fission-ai/openspec@1.15.0 init .
pnpm dlx @fission-ai/openspec@1.15.0 update
```

然后在 AI 工具中：

```text
/opsx:explore redesign billing flow
/opsx:propose add-usage-based-billing
/opsx:apply
/opsx:archive
```

这也是 OpenSpec 的特殊之处：CLI 负责文件、schema、root、状态、验证；AI slash command 负责让 agent 按同一套 artifact contract 行动。

## Brownfield 项目：不要一口气文档化全系统

`docs/existing-projects.md` 的增强说明 OpenSpec 已经不只面向新项目模板。对既有项目，它更推荐 delta-first 的方式：

- 不要试图一开始把整个系统都写成 specs；
- 从一个真实 change 开始；
- 只为受影响区域补充必要规格；
- 让 proposal、design、tasks、spec delta 约束这一次变更；
- 归档后再逐渐积累主规格。

这对真实团队很关键。很多规范驱动工具失败，不是因为理念错，而是因为要求团队先完成一大坨前置文档。OpenSpec 的 brownfield 路径更轻：先解决眼前变更，再让知识沉淀下来。

## YAML frontmatter 修复：小 bug，大影响

1.5.0 还有一个看似细节但很重要的修复：命令描述的 YAML frontmatter 现在会正确 escape 回车和换行。

源码中新增了共享 helper：

```text
src/core/command-generation/yaml.ts
```

核心函数是：

```ts
export function escapeYamlValue(value: string): string {
  const needsQuoting = /[:\n\r#{}[\],&*!|>'"%@`]|^\s|\s$/.test(value);
  if (needsQuoting) {
    const escaped = value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r');
    return `"${escaped}"`;
  }
  return value;
}
```

它被多个 command adapters 复用，包括：

- Claude；
- Cursor；
- Windsurf；
- Pi；
- Bob。

这类 bug 对普通用户可能不显眼，但对 AI 工具适配很重要：如果 frontmatter 被 YAML line folding 或 CRLF 污染，命令描述可能看似能生成，实际被工具读取时语义已经变了。集中 helper 之后，同类问题可以在一个地方修。

## Config JSON container 解析修复

1.5.0 还修复了配置值被包在 JSON container 中时的解析问题。这通常会影响编辑器、AI 工具或自动化脚本生成配置的场景。

从产品角度看，它和 YAML 修复属于同一类：OpenSpec 正在变成多个工具之间的“协议层”，所以配置和命令文件必须足够稳。越多 AI 工具接入，越不能依赖“人眼看起来没问题”。

## v1.4 系列：工具适配继续扩展

6 月初的 `v1.4.0` 和 `v1.4.1` 也值得放在一起看。

`v1.4.0` 增加了：

- Kimi CLI support；
- Mistral Vibe support；
- 新安装 core profile 默认生成 `/opsx:sync`；
- requirement headers 大小写不敏感；
- zsh / oh-my-zsh completion 修复；
- validate 对 `SHALL` / `MUST` 放错位置时给出更清楚提示。

`v1.4.1` 修复了：

- 当项目本身有 `workspace.yaml` 时，`openspec update` 被误导的问题；
- beta workspace view state 被移到 `.openspec-workspace/view.yaml`；
- 顶层 `openspec update` 不再错误路由到 workspace update。

这些更新说明 OpenSpec 的生态适配还在扩张，但同时也在修 workspace-era 模型带来的边界问题。Stores 的出现，某种程度上就是对这些边界问题的系统性回应。

## 实战建议：什么时候该用 Store？

你可以用这个判断标准。

继续用 repo-local `openspec/`，如果：

- 只有一个代码仓库；
- spec 和 code 生命周期高度一致；
- 团队不需要跨 repo 共享需求；
- 你只是想让 AI 变更更可控。

考虑 Store，如果：

- 一个产品能力横跨多个 repo；
- 有团队级共享规范；
- 有平台/协议/设计系统之类的独立规格资产；
- 你希望代码 repo 保持轻量，只引用外部 planning root；
- 多个 AI agent 需要共享同一个上下文来源。

暂时谨慎使用 Store，如果：

- 你不能接受 beta 的命令/格式变化；
- 团队还没有形成 spec 维护习惯；
- 只是一次性原型或短期 demo；
- 当前问题还没复杂到需要多 root。

## 一个推荐的团队落地流程

假设你有一个团队级 Store：

```bash
openspec store setup team-context \
  --path ~/openspec/team-context \
  --remote git@github.com:acme/team-context.git
```

在业务项目中引用它：

```yaml
# openspec/config.yaml
schema: spec-driven
references:
  - { id: team-context, remote: "git@github.com:acme/team-context.git" }
```

日常开发时：

```bash
openspec doctor --json
openspec context --json
openspec instructions proposal --change add-billing-api --json
```

AI 聊天中：

```text
/opsx:explore usage-based billing edge cases
/opsx:propose add-usage-based-billing
/opsx:apply
/opsx:archive
```

如果某个变更本身应该进入团队 Store，而不是当前 repo：

```bash
openspec new change update-billing-contract --store team-context
```

上面的本地 instructions 命令要求当前仓库已经存在 `add-billing-api`。变更归 Store 所有时，后续工作流命令继续带 `--store team-context`。setup 和 instructions 都不会创建应用代码。

## 对 OpenSpec 产品方向的判断

这轮更新透露出三个方向。

第一，OpenSpec 正在从 command generator 走向 workflow runtime。早期价值是给不同 AI coding tools 生成 commands/skills；现在它在加强 root selection、artifact state、validation、archive、JSON contract。

第二，它正在从单项目工具走向多项目协作层。Stores、references、context、worksets 的组合，都是为了让规格能在 repo 之外独立存在，并被 agent 装配进工作上下文。

第三，它越来越强调“约束 AI 实施”，而不是“写文档”。`explore → propose → apply → archive` 的意义不是生成更多 Markdown，而是让意图、验收标准、任务和最终 spec delta 形成闭环。

## 结论

OpenSpec 1.5 最值得关注的不是某个命令，而是它对“规格在哪里、归谁管、被谁引用、由哪个 agent 执行”的重新建模。

如果你是个人开发者，短期内最值得养成的习惯是：**不确定时先 `/opsx:explore`，不要直接让 AI 改代码。**

如果你是团队或多 repo 项目，最值得试验的是：**把共享规格抽成 Store，用 references 给项目提供只读上下文，用 `--store` 明确写入归属。**

Stores 仍然是 early beta，但方向很清楚：OpenSpec 正在从“AI coding 的 spec 文件模板”升级为“AI coding 的规格协作层”。
