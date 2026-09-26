---
title: "OpenSpec 是什么？变更工作流、文件结构与适用场景"
description: "独立 OpenSpec 指南：了解规范、变更提案与归档如何协作，判断是否适合现有项目，并找到官方文档和完整 CLI 入门教程。"
date: 2026-01-11
source: "https://github.com/Fission-AI/OpenSpec"
tags: ["ai-development", "openspec", "规格驱动开发", "sdd", "AI代理"]
lang: "zh"
---

**OpenSpec 是一个帮助人和 AI 编码助手共同维护需求规范的开源工具。** 它把一次功能变更的原因、需求、技术方案和任务清单保存为项目中的文件，让评审者能够对照预期行为检查代码，而不必从聊天记录里寻找需求。[官方仓库与文档入口](https://github.com/Fission-AI/OpenSpec)由 Fission AI 维护；本文是独立使用指南，不是官方文档。

先理解一个区别：`openspec/specs/` 记录已经接受的系统行为，`openspec/changes/<name>/` 记录准备如何改变这些行为。完成实现和测试后，再把变更中的规范增量合并回主规范并归档。

需要直接安装并完成第一个示例，可以进入[OpenSpec CLI 教程](/cn/blog/openspec-tutorial-cli-commands-agents-md-examples/)。这里先解释是否值得引入、实际会留下哪些文件，以及每个环节需要检查什么。下文以 npm 已发布的 **OpenSpec 1.13.2** 为基线，核验日期为 **2026-09-25 UTC**；官方 main 或其他版本可能不同。

## 适合什么任务，什么时候可以不用

OpenSpec 比较适合已有项目中的持续变更。例如增加一种登录方式时，我们需要说明哪些用户可以使用、过期链接如何处理、原有密码登录是否保留。把这些决定写成规范，后续实现、测试和评审就可以引用同一份文件。

团队跨几次会话完成一个功能，或者使用不同编码助手时，也可以从中受益。文件能够保留决定，但仍需要有人确认内容准确、让当前工具读取它，并在需求变化时更新。

下面几种情况不必急着引入：

- 一次性实验，只想验证某个 API 是否可用，实验结果不会成为长期维护的功能。
- 需求尚不清楚，需要先调查用户问题。可以先探索，不必立即生成一整套实施文档。
- 已有需求、测试和评审流程能覆盖当前变更，再维护一份规范只会增加重复劳动。
- 希望安装后自动解决权限控制、测试覆盖或合规审批。OpenSpec 不能代替这些执行机制。

选用它的理由应是能够减少哪些具体的信息断裂，而不是预期它保证模型不出错。相较于[BMAD 的角色与规划工作流](/cn/garden/notes/bmad-method-guide/)，本页关注的是围绕一次变更组织需求文件，不做没有统一基准的优劣排名。

## 一次变更如何走完

以新增邮件魔法链接登录为例。我们希望保留原来的密码登录，只增加一条使用一次性链接的路径。

| 环节 | 实际动作和产物 | 人工检查 |
| --- | --- | --- |
| 澄清意图 | 在 `proposal.md` 记录原因、范围、能力和影响 | 是否误把注册、账单或整页改版也包括进来 |
| 描述行为 | 在 `specs/auth/spec.md` 写规范增量 | 正常、过期、重用和原有登录流程是否都有明确结果 |
| 设计与拆解 | 在 `design.md` 记录方案，在 `tasks.md` 列任务 | token 存储、失效和测试策略是否具体 |
| 验证与实现 | CLI 检查规范结构，开发者或编码助手实现并运行测试 | 结构验证通过不等于安全性或功能测试通过 |
| 评审与归档 | 将规范增量合并到主规范，移动变更到 archive | 实现是否已经完成，主规范是否准确反映接受的行为 |

这是一种工作顺序，不是不可回头的状态机。实现时发现新约束，可以返回修改提案、规范和任务，再检查受影响的测试。不要因为任务清单已经有勾选，就把新决定留在聊天里。

## 文件到底保存在哪里

下面是 `spec-driven` schema 下，一个已经补齐文档的变更布局。**不是运行一次 `new change` 就会自动生成所有正文。**

```text
openspec/
  config.yaml
  specs/
  changes/
    add-magic-link-login/
      .openspec.yaml
      proposal.md
      design.md
      tasks.md
      specs/
        auth/
          spec.md
```

`config.yaml` 记录所选 schema，并可提供项目上下文和写作规则；它不应该包含密钥。`.openspec.yaml` 是变更元数据。其余 Markdown 文件承载可评审的内容，主规范按能力组织，不必照搬源码目录。

在这个例子里，归档前的新需求位于 `openspec/changes/add-magic-link-login/specs/auth/spec.md`。归档后，它进入 `openspec/specs/auth/spec.md`，原变更目录进入 `openspec/changes/archive/YYYY-MM-DD-add-magic-link-login/`。日期由实际归档时刻决定。

旧教程可能列出 `openspec/project.md`、`openspec/AGENTS.md`。不要把它们当成 1.13.2 的必备生成文件。工具集成会根据所选编码工具生成对应的 skills 或命令文件；手写仓库根目录 `AGENTS.md` 是可选项目约束，与 OpenSpec 规范本身是两回事。

## 规范增量与普通任务描述有什么区别

提案说明为什么修改，规范说明修改后必须有什么行为。以下片段应保存到上面列出的变更内 `specs/auth/spec.md`，不能只放进 proposal 后就认为已经有了 spec：

```markdown
## ADDED Requirements

### Requirement: Reject a reused magic link
The system SHALL reject a magic link that has already been used.

#### Scenario: Link reuse
- **WHEN** a user submits a previously used magic link
- **THEN** the system rejects it without creating a session
```

示例保留解析器识别的英文标题和 `SHALL`。每个 Requirement 都应有具体 Scenario；标题层级也是格式的一部分。正文可以按项目语言约定编写，不能随意翻译结构标记。

`ADDED` 用于新需求，`MODIFIED` 用于已有需求的完整新版本，`REMOVED` 用于删除需求。修改旧需求时应对照现有主规范，不要只写一句“登录流程有调整”。否则即使格式符合要求，评审者也无法判断哪些行为应该保留。

这个片段只是说明结构。登录功能还需要成功、过期和密码登录回归场景；[完整教程中的首个变更](/cn/blog/openspec-tutorial-cli-commands-agents-md-examples/)给出配套 proposal、delta、design 和 tasks。

## CLI 与编码助手里的命令

在新建的空练习目录里，安装了 Node.js 20.19.0 或更高版本及 pnpm 后，可以运行：

```bash
pnpm dlx @fission-ai/openspec@1.13.2 --help
pnpm dlx @fission-ai/openspec@1.13.2 init . --tools none
pnpm dlx @fission-ai/openspec@1.13.2 new change add-magic-link-login
```

`--tools none` 便于先理解文件工作流，不安装编码助手集成。它不调用模型，也不会实现登录功能。然后按教程补齐文件，再运行：

```bash
pnpm dlx @fission-ai/openspec@1.13.2 validate add-magic-link-login --strict --json --no-interactive
```

另一类入口是编码助手里的 `/opsx:propose`、`/opsx:apply`、`/opsx:archive`。这些不是 shell 命令。1.13.2 使用 `--tools claude --profile core` 初始化时，实测生成 propose、explore、apply、archive、sync、update。工具可能把它们显示成不同名称，应以初始化输出为准。额外命令取决于 profile，不能假定所有旧示例中的命令都默认可用。

CLI 的文件管理和结构验证不需要模型密钥；通过编码助手生成文档、实现或评审则依赖宿主及其模型服务。两条路径的费用和数据访问边界要分别判断。

## 引入现有项目时怎样避免多维护一份过期文档

从一个有明确验收标准的小变更开始，不必立即为整个仓库补写规范。先让评审者能够从提案找到需求，再从需求找到测试。对历史行为的描述需要对照现有代码和测试，不能把模型推断直接当成已经确认的事实。

归档前检查未完成任务、实际测试结果和主规范的更新范围。CLI 结构验证不会执行应用测试，也不能证明一次性 token 不存在并发重放问题。需要阻止不合格代码合并时，在实际 CI、分支保护和审批流程中配置检查，而不是只在 Markdown 里写“必须通过”。

后续需求发生变化时，同时更新相关文件和测试。OpenSpec 提供保存与检查这些信息的结构；它是否准确，仍取决于团队如何使用。

## 官方资料与继续阅读

- [OpenSpec 1.13.2 README](https://github.com/Fission-AI/OpenSpec/blob/v1.13.2/README.md)：版本要求、默认工作流和工具入口。
- [1.13.2 CLI 参考](https://github.com/Fission-AI/OpenSpec/blob/v1.13.2/docs/cli.md)：命令含义；实际参数以同版本 `--help` 为准。
- [1.13.2 OPSX 工作流](https://github.com/Fission-AI/OpenSpec/blob/v1.13.2/docs/opsx.md)：产物依赖和迭代方式。
- [本站完整 CLI 教程](/cn/blog/openspec-tutorial-cli-commands-agents-md-examples/)：固定版本安装、首个变更、验证和归档。
