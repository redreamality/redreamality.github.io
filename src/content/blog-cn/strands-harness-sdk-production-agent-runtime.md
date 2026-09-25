---
title: "Strands Harness：把 Agent 循环控制做成可发货的 SDK"
description: "对照官方公告与 harness-sdk 仓库，拆解 Strands harness / Harness SDK 如何把上下文管理、会话、工具闸门与循环控制产品化；对照站内 ECC、Growing Harness、Claude Code harness，给出选型与落地清单。"
pubDate: 2026-09-25T00:00:00+08:00
author: "Remy"
tags: ["agent-harness", "ai-agents", "LLM", "developer-tools", "agent-loop", "SDK"]
lang: "zh"
---

过去一年，团队搭 Agent 的默认动作常常是：换一个编排框架、再堆一层 prompt、再挂几个 MCP。演示能跑，上线却卡在同一类问题上——上下文何时压缩、工具何时必须等人批、会话如何续跑、失败时如何不静默成功。这些问题不在「模型会不会想」，而在 **agent 循环的控制面有没有被产品化**。

[Strands Agents](https://github.com/strands-agents/harness-sdk) 在 2026-09-21 前后把这条线说得很直白：一边发布组装好的 **Strands harness**（`pip install strands-harness` / `npm install @strands-agents/harness`），一边把底层 **Strands Harness SDK** 摆成「你本来就会自己写 agent loop 时该用的那一层」。官方公告标题甚至直接打出成本主张——同模型下相对若干热门 harness **约 28% 更低 token 成本**（见下文核对口径）。截至 **2026-09-25**（Asia/Shanghai），GitHub API 显示 monorepo `strands-agents/harness-sdk` 约 **8,273** star，许可证 **Apache-2.0**；PyPI `strands-harness` 当时可见版本 **0.1.2**，`strands-agents` **1.57.0**。星标只说明关注度，不证明质量；下文数字一律标出处，复测不到的就不外推。

站内已经有一条 harness 深耕线：[Claude Code Agent Harness](/cn/blog/inside-claude-code-agent-harness/) 讲生产循环五层结构；[ECC](/cn/blog/ecc-agent-harness-optimization/) 讲在现有 coding agent 外挂可核验优化层；[扩张 Harness，而不是堆上下文](/cn/blog/grow-the-harness-not-the-context/) 讲把反复出现的控制沉成代码。本文把 **显式 harness 产品** 放进同一坐标系：它卖的不是又一个「多智能体 demo 框架」，而是把循环控制做成可安装、可覆盖默认值、可部署的交付物。Skills 分发形态可对照站内 [Cloudflare security-audit-skill](/cn/blog/cloudflare-security-audit-skill-for-coding-agents/)——那是垂直能力包；Strands 则是把能力包挂进同一套工厂函数与 SDK。

## 为何「显式 harness 产品」现在值得写

教科书里的 ReAct 只要五行：推理、行动、观察、重复、结束。站内 [Claude Code harness](/cn/blog/inside-claude-code-agent-harness/) 已经拆过：真正让 Agent 在生产里活下来的，是上下文压缩、流式执行、错误恢复、权限与中断——也就是 harness。问题在于，多数团队仍把 harness 当成「写在自家仓库里的一堆 glue」：没有版本化默认值、没有可对照的成本/准确率主张、没有「一行创建就能跑、再逐项覆盖」的产品路径。

框架热潮解决的是另一件事：图编排、角色分工、工具注册。它们很有用，但企业需求撞墙时，缺口往往不在「能不能画图」，而在：

1. **上下文经济学是否默认正确** — 大工具结果要不要截断/外置、何时摘要、溢出如何恢复。
2. **控制是结构强制还是 prompt 劝说** — 破坏性动作是否能绕过「请先问人」。
3. **审计证据落在哪** — 只在模型 trace 里，还是也在图状态/代码路径里。
4. **从原型到部署是否同一条对象** — CLI 里调通的配置，能否 `/export` 成可进仓库的代码。

Strands 的产品叙事正好卡在这四点上：组装好的 harness 给出可复测的默认上下文策略；SDK 给出生命周期、hooks、guardrails、会话与评测；CLI 把「先聊后导出」做成路径。对照只堆 framework/prompt，差别不是品牌，而是 **默认值是否可被基准与配置表钉住**。

## Strands 实际交付了什么：产品层 vs SDK 层

核对 [仓库 README](https://github.com/strands-agents/harness-sdk) 与 [官方公告](https://strandsagents.com/blog/introducing-strands-harness/)、[Harness 文档](https://strandsagents.com/docs/user-guide/harness/)，可以把 monorepo 拆成两层（名字容易混，先钉死）：

| 层 | 包名（文档/PyPI/npm 可核） | 你拿到什么 |
| --- | --- | --- |
| **Strands harness（组装产品）** | Python `strands-harness`；TS `@strands-agents/harness`；CLI `@strands-agents/cli` | `create_harness()` / `createHarness()`：带基准化默认值的通用 Agent（非仅 coding agent） |
| **Strands Harness SDK（控制面）** | Python `strands-agents`；TS `@strands-agents/sdk` | Agent 循环、模型提供方、工具/MCP、多 Agent 模式、memory/session、streaming、guardrails、tracing、evals |

官方表述很清楚：**Choose Strands when you would otherwise write your own agent loop**——它跑在你的进程里，没有托管控制面；你要的是把手写循环迟早会长出的能力一次性收齐。组装 harness 建立在 SDK 之上；返回值是普通 `strands.Agent`，没有隐藏包装，默认值可覆盖，也可一路替换到底层 SDK。

### 组装 harness 开箱带什么

文档「What the default harness does」与配置参考表可核对的默认能力包括：

- **模型可移植**：Amazon Bedrock（文档默认）、Anthropic、OpenAI、Google、Ollama、LiteLLM；`effort` 统一映射推理强度（`auto` / `low` / `medium` / `high` 等，具体以提供方支持为准）。
- **调过的系统约定**：先探索再改动、不可逆动作先确认、结束前校验（文档表述；不是法律级策略引擎）。
- **内置工具面**：shell、`read` / `write` / `edit`、web（`web_fetch` / `web_search`）、`programmatic_tool_caller`（用代码编排其它工具）、`subagent`（子任务委派）。
- **上下文与缓存**：`caching="auto"`；`context_manager="auto"`，把笨重工具结果外置/摘要，并对可复用请求片段做 prompt caching（提供方支持时）。
- **会话与长期记忆**：会话默认可落盘（文档写 `./.agent/sessions`），给 `session.id` 可续聊；`memory` 默认可开，蒸馏跨会话事实。
- **内置插件**：默认 `todos`、`environment`；可加载 Agent Skills（默认扫 `./.agent/skills`）。
- **干预（interventions）**：可对工具调用设审批或策略门（`ask` / `smart` / 策略字符串 / Cedar 文件等，以文档为准）。

官方公告还把默认上下文策略写到了可对照的阈值（仍是 **厂商自测主张**，不是本文复测）：工具结果超过约 **1500** token 会截断/外置；上下文占用超过约 **85%** 触发摘要（compaction）；溢出时在循环内做 context recovery。公告称这些默认是同模型下相对 Claude Code、Codex 等 **约 28% 更低成本、准确率持平或更好** 的主要原因；测试环境写为 EC2 上分布式评测 + Harbor。另有一条更刺眼的对比：用 **Fable 5** 时，相对 Claude Code **成本约低 77%**，且在 Terminal Bench 2.1 上分数更高。Deepseek Harness 在公告里被写成「最省 token，但准确率通常最低」。厂商承诺后续有研究论文；在论文落地前，这些数字应标成 **公告主张**，用于选型启发，不宜当采购合同里的验收线。

### SDK 控制面补什么

当你需要自己拥有循环时，SDK README 列出的能力面包括：生命周期控制（回合上限、token 预算、取消、停止原因）、工具与结构化输出、MCP、多 Agent 模式、memory 与 session、模型可移植、streaming、guardrails、tracing、evals。Hooks 可拦截步骤做日志/校验/改道；steering handlers 被描述为让 Agent「自我纠正而不是静默失败」。生产部署文档指向容器化路径；公告列举 Modal、Cloudflare Containers、Azure Container Apps、Cloud Run、ECS、Bedrock AgentCore 等「能跑 Linux 容器」的目标。

一句话分层：**harness 产品卖「好默认 + 可覆盖」；SDK 卖「你本来会自建的那整层循环控制」。** CLI 则是第三条入口：交互配置后 `/export` 成 Python/TypeScript，把「能聊」接到「能进 CI」。

## 企业需求撞墙：45-run bakeoff 告诉我们什么（与局限）

[sunnydachs 的 Dev.to 文](https://dev.to/sunnydachs/what-happens-when-enterprise-requirements-hit-strands-langgraph-and-crewai-45-runs-measured-ocg) 不是官方 Strands 基准，而是第三方用同一 recorder proxy、同一模型、同一工具集，在 **人工审批闸门、审计重建、结构化输出** 上各跑若干次（文中称本篇 45 runs；仓库累计宣称更多）。它对照的是 **Strands / LangGraph / CrewAI 三种控制流哲学**，重点不在「谁更聪明」，而在「企业约束下如何失败」。引用时必须带着作者自己写的局限：**单模型、每格约 3 次、方向性而非排行榜；人工审批是脚本化的；破坏性动作是模拟的。**

可核对的对照点：

| 关切 | LangGraph（文中实现） | CrewAI（文中实现） | Strands（文中：模型驱动循环） |
| --- | --- | --- | --- |
| 人工审批 | `interrupt()` 挂起整图，`Command(resume=...)` 续跑；拒绝走边条件，结构强制 | `Task(human_input=True)`；拒绝后常重跑任务 | 主要靠 prompt「先问再发」；顺序可守住，但出现过批准后 **双发** 同一 publish |
| 审计可读性 | 文中评分：理由 100%，但工具顺序/参数在 **框架级 trace** 上为 0%（工具在代码里调，不在 wire 上） | 理由 100%；工具顺序/参数约 50% | 理由与工具顺序/参数 100%；模型看见的几乎都在 trace——审计故事最强，也伴随静默失败风险 |
| 最吓人的失败形态 | 结构上难产出「成功但空结果」 | 拒绝反馈若处理不当可自旋（文中一例 131 次 LLM 调用） | **exit 0 但最终输出为空**（3 次）：结果其实在校验工具参数里，runner 只看退出码会漏 |

对企业选型，这篇 bakeoff 的可沉淀教训不是「别用 Strands」，而是：

1. **破坏性动作的闸门必须长在结构或执行边界上**——图边、`interrupt`、idempotency key、审批操作 ID；prompt-only 在「自信且错」的回合最容易垮。
2. **模型驱动循环的审计优势与静默失败是同一枚硬币**：trace 全，但成功形空虚更隐蔽；应用层要加「非空交付物」「操作去重」一类契约。
3. **证据落点不同**：有的框架把工具调用藏在代码路径里——读代码懂顺序，只读 trace 不够；合规设计要先问「审计员打开的是哪一层」。

注意边界：bakeoff 测的是 **Strands 模型驱动框架行为**，不等于已经复测了「Strands harness 组装产品」的 28% 成本主张。两者同属一条产品线哲学，证据层级不同，不要混写成一个分数。

## 与站内三条 harness 文的机制对照

把 Strands 放进站内已有坐标系，比再写一遍功能清单更有用。

| 维度 | [Claude Code harness](/cn/blog/inside-claude-code-agent-harness/) | [ECC](/cn/blog/ecc-agent-harness-optimization/) | [Growing Harness](/cn/blog/grow-the-harness-not-the-context/) | **Strands harness / SDK** |
| --- | --- | --- | --- | --- |
| 问题陈述 | 教科书循环缺生产层 | 现有 coding agent 外的可核验优化 OS | 别让模型每次重发明控制 | 别手写一整圈 loop；给可部署默认值 |
| 持久化对象 | 运行时循环与压缩流水线（源码级） | Skills/Hooks/Instincts/Memory Vault 配置资产 | **可执行 harness 程序**（从失败窗口长出） | 工厂默认值 + 可覆盖配置 + 普通 `Agent` 对象 |
| 上下文策略 | 多级 compact（预算/snip/micro/auto） | SessionStart 上限、instinct 闸、早 compact 习惯 | 把稳定控制沉出上下文 | 约 1500 token 工具结果外置、约 85% 摘要、缓存（公告/文档） |
| 安全/治理 | 权限与中断在循环内 | AgentShield、GateGuard、hooks 在模型外 | 闸门成功率优先的事务回滚 | `interventions`、guardrails、hooks；结构闸门仍需你设计 |
| 增长方式 | 产品演进（闭源/开源片段） | 人安装与配置横向 OS | 任务反馈自动长代码 | 人覆盖默认 → 下沉 SDK；Skills 加载 |
| 最适合谁 | 要理解生产循环解剖 | 已绑定 Claude Code/Codex/Cursor | 稳定任务族、要摊销控制成本 | 要通用 Agent 运行时、多模型、从 CLI 到容器 |

几条对照主张可以写进团队备忘：

- **相对 Claude Code harness 解剖文**：Strands 把「五层里很多默认」产品化成可安装包；你买到的是可覆盖的工业默认，不是对 `query.ts` 的逐行替代。若你的护城河是深度定制的压缩/权限状态机，SDK 层更相关，组装层只是起点。
- **相对 ECC**：ECC 假设你已有 Claude Code/Codex/Cursor，在外围加 Skills/Hooks/记忆/安全扫描；Strands 假设你可能从零要一个 **通用（非仅 coding）** Agent，并可选加载 Skills。Skills 分发（含 Cloudflare 那类垂直 skill）可以进 `./.agent/skills`；ECC 更像「多 harness 运营系统」，Strands 更像「可嵌入运行时 + 组装默认」。
- **相对 Growing Harness**：论文路线是让控制从失败反馈长成代码；Strands 路线是先给你一套已经写好的控制默认，再让你覆盖或下沉。一个偏「学习控制器」，一个偏「发货控制器」。成熟团队往往两者都要：用 Strands 快速得到可观测循环，再用任务族反馈决定哪些分支该沉成自家代码（Growing Harness 精神），而不是永远停在 prompt。

## 落地清单：何时选 SDK 级 harness，何时继续自建

下面清单按「决策问题」写，不按品牌忠诚度写。

### 更倾向直接用 Strands harness（组装层）的信号

1. 你本来就要写/已在写私有 agent loop，且需求落在：多模型、工具+MCP、会话续跑、上下文外置、子 Agent、基础观测。
2. 任务是 **通用 Agent**（研究、运维助手、内部知识工作），不是必须绑死某一家 coding IDE 的扩展生态。
3. 你希望默认值可被配置表解释：`create_harness(...)` 的每一项都有文档默认与关闭方式。
4. 原型路径需要 CLI → `/export` → 进仓库，而不是两套永久分叉的「聊天配置」与「生产配置」。
5. 部署目标是自管 Linux 容器/函数，接受进程内运行时，不需要对方托管控制面。

### 更应继续自建或选用图编排（LangGraph 类）的信号

1. **破坏性动作必须结构强制**：资金、发布、删库、对外发送——闸门要长在边条件/中断/工作流引擎上，不能只靠 system prompt「先问再做」。
2. 合规审计要求「工具顺序与参数」在 **固定 schema 的业务事件** 里，而不仅是模型 trace；你需要自己定义 operation ID、幂等键、保留策略。
3. 控制流以确定性状态机为主，模型只填槽——图/工作流框架的表达力更直接。
4. 你已深度绑定 Claude Code/Cursor，且痛点是 token/记忆/安全扫描——先看 [ECC](/cn/blog/ecc-agent-harness-optimization/) 这类外围 OS，可能比换运行时更便宜。
5. 任务族高度重复、控制已稳定——按 [Growing Harness](/cn/blog/grow-the-harness-not-the-context/) 把控制沉成代码，长期成本曲线往往优于永远调用「聪明默认」。

### 采用 Strands 时建议立刻加上的边界

1. **把官方 28% / 77% 成本数字当假设，不当 SLA**——用自家任务集 + 同一模型重跑；公告明确还有后续论文。
2. **在执行边界做幂等**：工具层对 publish/delete/pay 使用操作 ID；防止模型双发（bakeoff 已示范）。
3. **runner 契约**：退出码之外检查非空交付物、关键文件哈希或业务回执；防止「exit 0 + 空最终答案」。
4. **interventions 打开不等于结构闸门**：审批 UX、超时、进程崩溃后续跑，要按生产工作流测，不要只测「模型遵不遵从」。
5. **Skills 与 MCP 数量设上限**：与 ECC/Claude Code 经验相同——工具描述会吃掉上下文；组装默认再强，也挡不住你挂 50 个 MCP。
6. **分清 session 与 memory**：文档区分会话续聊与长期记忆蒸馏；别把「记得用户偏好」和「恢复半成品任务状态」混在一个目录策略里。
7. **子 Agent 深度与权限**：默认会委派；对高权限工具做收窄，避免子循环放大爆炸半径。

### 两周内可执行的最小验证

1. 用同一模型、同一任务集，对比：裸 SDK 循环 / `create_harness()` 默认 / 你现有框架；只记 **成功判定、token、空输出率、双发率**。
2. 挑一个真实破坏性动作，分别用 prompt 门与 `interventions`/外置审批各跑一组；看拒绝路径是否可绕过。
3. 打开 tracing，做一次「审计员只读 trace」演练：七类事实（理由、工具序、参数、模型身份等）能否重建——参考 bakeoff 的评分思路，不必抄它的分数。
4. 若成本敏感，单独 A/B 上下文管理开关（`context_manager` / caching），确认外置与摘要没有毁掉你的关键中间状态。


## 工厂函数读成「控制面契约」

选型时别只盯星标。把 `create_harness(...)` 的参数表当成一份 **控制面契约** 更有用——每一项都在回答「循环外哪一块默认被接管了」。结合 [配置参考](https://strandsagents.com/docs/user-guide/harness/reference/configuration/) 与 `harness-py` README，值得团队逐项签字的至少有这些：

| 参数（Python） | 默认（文档） | 你其实在买什么 | 关掉/改掉时要想什么 |
| --- | --- | --- | --- |
| `model` / `effort` | Bedrock 上的默认前沿模型；`effort="auto"` | 提供方抽象 + 推理强度一次设 | 自管 `Model` 实例时，部分工厂旋钮会被忽略并告警 |
| `builtin_tools` | shell/读写改/web/programmatic_tool_caller/subagent | 「模型已经会用」的原语工具面，而不是一任务一工具 | 列表会 **钉死** 全集；映射才适合「默认减一」；权限面随工具面膨胀 |
| `caching` / `context_manager` | 均为 `"auto"` | 成本与长任务连贯性的主旋钮 | 关上下文管理会连带关掉外置；关键中间态可能被摘要吃掉 |
| `session` / `memory` | 会话可默认可落盘；memory 可开 | 续聊 vs 跨会话事实蒸馏 | 目录策略、保留周期、密钥是否进记忆文件 |
| `skills` | 扫 `./.agent/skills` | 与 Agent Skills 生态对接 | 技能描述同样占上下文；要像装 MCP 一样设预算 |
| `interventions` | 默认无 | 工具调用前的审批/策略门 | 不等于图边强制；崩溃续跑与超时要单测 |
| `builtin_plugins` | `todos`、`environment` | 清单与环境元数据 | 不需要时可 `[]`，少一条默认就少一份隐式行为 |
| `background_tasks` | 文档默认允许对兼容工具做 background | 子任务/工具异步完成策略 | 应用若不回调再 invoke，别盲关 `wait_for_completion` |

`instructions` 只追加领域块，不替换整份系统约定——除非你显式传入完整 `system_prompt`（passthrough 优先）。这很重要：很多团队以为「再写一段 system prompt」等于接管 harness，实际上默认合同仍在。正确做法是：先读懂 `HARNESS_CONTRACT` / `build_system_prompt` 导出件在约束什么，再决定是追加 `instructions`，还是下沉到 SDK 自组循环。

子 Agent 默认会继承干预与 hooks（文档强调审批门应传到委派侧）。这意味着：你在父 Agent 上开的闸门，不应被「再开一个子循环」悄悄绕过——这是组装层相对「手写两个 Agent 互调」更值得买的一点。反过来，共享插件若把状态放在 `self` 而不是 `agent.state`，父子会踩同一份可变状态；这是落地时的真实坑，不是理论题。

## 成本数字怎么读：公告、bakeoff、自家评测三层

公开讨论里最容易犯的错，是把三种证据捏成一句「Strands 更省 28%」。分层读会干净很多：

1. **厂商公告层**（[Introducing Strands harness](https://strandsagents.com/blog/introducing-strands-harness/)）：同 Claude/GPT 模型、六项基准、相对 Claude Code/Codex 等 harness；主张约 **28%** 更低成本、准确率持平或更好；Fable 5 vs Claude Code 约 **77%** 成本优势并在 Terminal Bench 2.1 更高；环境为 EC2 + Harbor。用途：形成假设与默认上下文策略的动机。
2. **第三方企业约束层**（[45-run bakeoff](https://dev.to/sunnydachs/what-happens-when-enterprise-requirements-hit-strands-langgraph-and-crewai-45-runs-measured-ocg)）：不比 token 排行，比审批/审计/结构化输出下的失败形态。用途：设计闸门与 runner 契约。
3. **自家任务层**：唯一能进预算会议的一层。建议最少固定四列——任务成功定义、token、空最终输出率、破坏性工具双发率——再决定要不要换运行时。

站内 [ECC](/cn/blog/ecc-agent-harness-optimization/) 把「性能」首先写成 token/上下文质量而不是神秘加速器；[Growing Harness](/cn/blog/grow-the-harness-not-the-context/) 则用调用次数与成本下降证明「控制沉进代码」的账。Strands 公告走的是第三条路：**先把工业默认写进产品，再声称这些默认在公开基准上更省。** 三条路并不互斥：你可以在 Strands 默认上跑通，再用 ECC 式预算习惯管 Skills/MCP 数量，再对稳定任务族做 Growing Harness 式下沉。

## 与「只堆 framework」的决策分叉（再钉一次）

若你的痛点是「角色怎么分工、图怎么画」，LangGraph/CrewAI 类工具仍然对口。若你的痛点是「循环如何在长任务里不炸上下文、如何多模型、如何从原型进容器」，显式 harness 产品更对口。若你的痛点是「受监管动作绝不能靠模型自觉」，你需要的是 **结构强制 + 执行边界幂等**，框架品牌是第二位的——bakeoff 里 LangGraph 的 `interrupt()` 与 Strands 的双发，把这句话写得很清楚。

把分叉写成团队内部一句话：**编排解决协作形状；harness 解决循环存活；治理解决模型说不动的边界。** Strands 强在后两者的产品化入口；它不自动替你完成第一者的企业工作流建模，也不自动满足第三的法务审计格式。

## 结语

Agent 竞争正在从「谁会调工具」转向「谁把循环控制做成可发货的默认值，并承认模型驱动与结构强制各自会怎么失败」。Strands 的价值，是把 harness 从口头禅推进到 **可安装的产品层 + 可下沉的 SDK 层**；真正可沉淀的工程纪律，仍是：默认值要可测，闸门要长在模型说不动的地方，成功必须长得像成功。
