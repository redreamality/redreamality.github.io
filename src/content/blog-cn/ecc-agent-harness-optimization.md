---
title: "ECC：给 Claude Code / Codex / Cursor 加一层可核验的 Harness 优化"
description: "拆解 affaan-m/ECC：它如何用 Skills、Hooks、Instincts、Memory Vault 与 AgentShield 做性能/记忆/安全优化；哪些适配 Claude Code、Codex、Cursor；企业可抄什么、哪里仍是路线图与宣传。"
pubDate: 2026-09-24T00:00:00+08:00
author: "Remy"
tags: ["ECC", "agent-harness", "Claude Code", "Codex", "Cursor", "Agent Skills", "memory", "security", "developer-tools"]
lang: "zh"
---

编程 Agent 越来越会写代码，团队却越来越难回答三个更硬的问题：**钱花在哪、记了什么、谁在替它执行危险动作。** 把「省 token / 记经验 / 别乱删」写进一句 system prompt，短期好看，长期通常塌在三件事上——上下文被规则和 MCP 描述挤爆、跨会话记忆变成不可审计的黏糊文本、安全策略只存在于模型「记得住」的幻觉里。

[affaan-m/ECC](https://github.com/affaan-m/ECC)（Everything Claude Code）把另一条路摊开：不替换 Claude Code / Codex / Cursor 的核心循环，而是在外围装一套 **Harness 操作系统**——Skills、Agents、Hooks、Rules、Instincts、Memory Vault，以及面向配置面的 AgentShield。口号写在 README 里很直白：

> Optimize the context window. Persist everything else.

截至 **2026-09-24**（Asia/Shanghai），GitHub API 显示该仓库约有 **266,395** star、约 **38,814** fork，许可证为 **MIT**；仓库根 `VERSION` / 文档示例指向 **ecc-universal 2.2.2**，npm `latest` 与 GitHub Releases 页面当时可见标签为 **v2.2.1**——下文以公开 README、`docs/`、安全指南与设计文档为准，**不以星标当质量证明，也不编造未公开的基准数字**。仓库体量极大（约 52k，含海量 skills/agents），本文只核验文档里可对照的子系统，不假装读完整个 monorepo。

站内可对照：[Claude Code Agent Harness](/cn/blog/inside-claude-code-agent-harness/)、[Agent Skills 入门](/cn/blog/agentskills-io-starter-guide/)、[Cloudflare security-audit-skill](/cn/blog/cloudflare-security-audit-skill-for-coding-agents/)、[Jev × Claude Code](/cn/blog/jev-claude-code-10x-and-25-lines/)，以及 [Agents of Chaos](/cn/blog/agents-of-chaos-ai-agent-failures/) 里失败模式清单。学术侧可对照站内 [扩张 Harness，而不是堆上下文](/cn/blog/grow-the-harness-not-the-context/)（源论文 [arXiv:2609.26760](https://arxiv.org/abs/2609.26760)）。

## 它优化的不是模型，是驾驭层

站内 [Agent Harness 模式](/cn/blog/inside-claude-code-agent-harness/) 讲过：教科书 ReAct 循环与生产循环之间的鸿沟，就是 harness 工程。ECC 不声称自己发明了新的 `query.ts`；它假设你已经有一个会调用工具的 coding agent，然后回答：

1. **性能（主要是 token / 上下文经济学）** — 模型路由、thinking 预算、提前 compact、MCP 工具数量上限、SessionStart 注入字符上限。
2. **记忆** — 会话摘要与 instincts（带置信度的原子行为）；跨 harness 的 Memory Vault（可检查的 Markdown，而不是把 vendor transcript 原样拷贝）。
3. **安全** — 把 hooks / MCP / skills / 权限面当成可扫描的配置攻击面；GateGuard 拦截破坏性 shell；AgentShield 扫 harness 自身。

这三件事叠在同一句话里时很容易听成营销。拆开看文档，边界其实很清楚：

| 层 | ECC 实际交付（文档可核） | 它不是 |
| --- | --- | --- |
| Skills / Agents | 按需加载的工作流与委派角色 | 更强的基座模型 |
| Hooks | 在模型上下文外跑的确定性脚本 | 沙箱 / 隔离运行时本身 |
| Instincts | 从会话观察抽取出的带置信度短规则 | 已审核的公司政策 |
| Memory Vault | `ecc.memory.v1` Markdown + CLI/MCP | 可执行指令或自动晋升的规则 |
| AgentShield | 对 prompts/hooks/MCP/权限/密钥面的扫描器 | 替代你做沙箱与身份隔离 |

README 的对照表也写得很实在：没有系统时，「请用 TDD」只是模型可能忘掉的提醒；有 ECC 时，TDD 变成带证据的 RED → GREEN → REFACTOR 闸门，审查走**新鲜上下文**，质量检查可以落在 hook 上，AgentShield 把 harness **自己**当成攻击面来扫。

## 组件怎么分工：别把整个仓库灌进上下文

公开目录声明大致是：约 **68** 个 agents、**292** 个 skills、**94** 条兼容 slash command、外加 hooks、rules、scripts 与多 harness 适配目录（`.claude-plugin/`、`.codex/`、`.cursor/`、`.opencode/` 等）。根目录是源真相，平台适配器只是打包/映射，而不是各维护一份副本。

关键分工表（README）：

| 概念 | 干什么 | 对上下文的行为 |
| --- | --- | --- |
| Skills | TDD、安全审查、深研等可复用工作流 | 任务需要时再加载 |
| Agents | 有自己上下文与工具权限的scoped worker | 把规划/实现/审查隔离 |
| Rules | 长期项目或语言标准 | **总是加载**，所以要选择性安装 |
| Hooks | 由 harness 事件触发的脚本 | 在模型上下文外运行 |
| Instincts | 从真实会话学到的、带置信度的模式 | 相关时再召回 |

这和 [Agent Skills 入门](/cn/blog/agentskills-io-starter-guide/) 的主张同向：能力要可分发、可触发、可边界，而不是再挂一个只会在聊天里说教的 bot。Cloudflare 的 [security-audit-skill](/cn/blog/cloudflare-security-audit-skill-for-coding-agents/) 是安全垂直的高强度样本；ECC 则是横向「操作系统」——把很多垂直 skill 装进同一套安装、配置与学习闭环。

有一个工程细节值得抄进自己的 harness：**不要叠安装路径**。README 明确写：可以同时给 Claude Code、Codex 等装 ECC，但每个 harness 只选一条安装通道；同一 harness 叠 plugin + 全量手工拷贝，会复制 skills/commands/hooks。排障入口是 Reset / Uninstall，而不是再 `npx` 一次碰运气。

## 性能：文档里能核验的，是设置与习惯，不是神秘加速器

「性能优化」在 ECC 里首先是 **token 与上下文质量**，不是声称把推理延迟砍掉百分之多少。`docs/token-optimization.md` 与 README 的推荐默认值（面向大多数用户）包括：

| 设置 | 文档默认/常见值 | 推荐 | 文档声称的作用 |
| --- | --- | --- | --- |
| `model` | opus | **sonnet** | 约 60% 成本下降；日常编码约 80%+ 任务够用 |
| `MAX_THINKING_TOKENS` | 31,999 | **10,000** | 隐藏 thinking 成本约降 70%；琐事可设 `0` |
| `CLAUDE_CODE_SUBAGENT_MODEL` | 继承主模型 | **haiku** | 探索/读文件/跑测更便宜 |
| `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` | 95 | **50**（社区有争议） | 更早 compact；部分构建 reportedly 只能下调阈值 |
| MCP / tools | — | &lt;10 MCP、&lt;80 tools | 避免 200k 窗口被工具描述挤到约 70k |

这些百分比来自 **ECC 自己的文档主张**，不是我们复测后的结果。文档也诚实写了：社区反馈部分 Claude Code 构建对 auto-compact 覆盖行为不一致——若异常，删掉 override，改靠手动 `/compact` 与 `strategic-compact` skill。

日常节奏也很朴素：`/model sonnet` 做默认；架构难题再 `/model opus`；无关任务之间 `/clear`；研究结束、里程碑完成、换路线之前 `/compact`；**实现中途不要 compact**（会丢变量名、路径与半成品状态）。Agent Teams 会复制多份上下文窗口——只在真正并行有收益时用；简单串行任务，subagent 更省。

企业可立刻抄的，往往不是「装全套 292 skills」，而是：

1. **给 SessionStart 设上限** — `ECC_SESSION_START_MAX_CHARS`（默认 8000），本地小模型可直接 `ECC_SESSION_START_CONTEXT=off`。
2. **给 instincts 注入设闸** — 默认最多注入 6 条、置信度阈值 0.7，并可按项目/技术栈相关性排序。
3. **用 minimal / 无 hooks 配置面** — `npx ecc-universal@2.2.2 install --profile minimal --target claude` 刻意排除 `hooks-runtime`；需要时再显式 `--enable-hooks`。
4. **选择性装 rules** — rules 永远占上下文；语言无关的 `common/` 与语言目录分开选。

这和 arXiv:2609.26760 的方向一致：**先长 harness（可复用 specialist / skill / verifier），再堆上下文。** 差别是：ECC 给你一份可安装的工程化清单；论文给你可发表的抽象。二者都提醒：把「再贴一段更长的 CLAUDE.md」当唯一手段，迟早撞墙。

## 记忆：两套机制，别混成「Agent 会记住」

ECC 文档里至少有两套常被营销话术糊在一起的记忆机制。

### 1）Continuous Learning v2：Instincts

`skills/continuous-learning-v2/SKILL.md` 把会话观察变成原子 **instinct**：一个 trigger、一个 action、置信度 0.3–0.9、带 domain 与证据。v2.1 默认 **项目作用域**，用 git remote / 路径哈希隔离，避免 React 习惯污染 Python 仓库；跨项目重复出现再 promote 到 global。进化路径是 instincts → cluster → skill/command/agent，而不是一次 Stop hook 直接吐出一个巨型 skill。

命令面有 `/instinct-status`、`/instinct-import`、`/instinct-export`、`/evolve`、`/prune` 等。SessionStart 注入受 `ECC_MAX_INJECTED_INSTINCTS` 与 `ECC_INSTINCT_CONFIDENCE_THRESHOLD` 约束——这是「记忆」里真正影响性能的旋钮：学得越多，越容易把上下文喂胖。

### 2）Memory Vault：跨 harness 的可检查手递

README 与 `docs/design/ecc-memory-vault.md` 把 Memory Vault 写成另一类东西：本地优先的 `ecc.memory.v1` Markdown，放在 `.ecc/memory/`（project/team）与 `~/.ecc/memory/`（user）。CLI / 可选 MCP（`memory_save|search|read|doctor`）共享同一合同。关键约束值得原样抄进企业规范：

- **记忆是未审核上下文，不是可执行政策**；首发条目 `trust: "unreviewed"`，不能默默变成 rules/skills。
- **只创建、不覆盖**；取代靠新文档显式链接。
- 拒绝已知密钥形态；读者不跟随符号链接。
- 项目记忆 fail-closed `.gitignore`；team 作用域即使提交，仍是未审核上下文。
- MCP 身份由服务器侧 `ECC_MEMORY_HARNESS` 绑定，调用方不能伪造；user scope 还要 `ECC_MEMORY_ALLOW_USER_SCOPE=1`。
- 威胁模型诚实声明：它不是同一 OS 用户下并发进程之间的安全边界。

插件/极简安装**不会**自动把 Memory Vault 放进 `PATH`；需要先 `npm install -g ecc-universal`，再 `ecc memory init`。这点写进运维手册，比星标有用。

安全指南里的提醒更狠：持久记忆像汽油。Microsoft 的 recommendation poisoning、野外部署里观察到的间接注入，都说明 payload 不必一次成功——可以碎片化进记忆，再组装。所以高风险、整天读外来附件的工作流，应该关掉或轮换长寿记忆。这和站内 [Agents of Chaos](/cn/blog/agents-of-chaos-ai-agent-failures/) 的失败叙事同频：记忆层是能力，也是失败放大器。

## 安全：扫 harness 自身，外加「最低门槛清单」

ECC 安全叙事分三层，别只看「有扫描器」。

**分发面。** 只认官方：GitHub `affaan-m/ECC`、npm `ecc-universal` / `ecc-agentshield`、插件 slug `ecc@ecc`、GitHub App、`ecc.tools`。SECURITY.md 点名若干撞元数据的非官方包，要求未核验前不要装。供应链规则包括 Actions 钉 SHA、避免把未信任 GitHub context 直接拼进 `run:`。

**运行时闸门。** README 写：GateGuard 在执行前闸住破坏性 shell（含 `rm`、危险 `git checkout`、破坏性 `find -exec`）；CI 有供应链 IOC 扫描；`/security-scan` 走 AgentShield。hooks 会跑 shell、MCP 会持凭证、项目说明会进上下文——三者都要当「可执行配置」对待。插件已装时，不要再把 `hooks/hooks.json` 手工复制进 `~/.claude/settings.json`，否则可能双触发。

**方法论。** `the-security-guide.md` 把沙箱、消毒、最小权限、可观测、kill switch、窄记忆写成 2026 年自主 agent 的**最低门槛**，并引用 Claude Code CVE、Snyk ToxicSkills（公开 skills 中大量注入样本）、暴露的 OpenClaw 实例等公开材料。AgentShield 在此定位很清楚：扫可疑 hooks、隐藏注入模式、过宽权限、危险 MCP、密钥暴露——**补人工漏看的配置面**，不是替代容器隔离与独立身份。

这和 Cloudflare [security-audit-skill](/cn/blog/cloudflare-security-audit-skill-for-coding-agents/) 形成对照：后者把「审计目标代码」做成可验证阶段与三态结论；ECC / AgentShield 更偏「审计你给 agent 的配置与工具链」。企业两边都要：一个管产物，一个管驾驭面。

架构文档里的 Non-Goals 也很有用：托管遥测前先把本地事件模型做稳；**没有 verifier 证据就不要自动改用户 harness 配置**；不把单一 harness 当成唯一规范接口。路线图里的「Self-Improving Harness Loop」「AgentShield Enterprise」大量仍是 backlog 形状——读文档时要把 **已发布能力** 与 **愿景** 分开。

## 怎么接到 Claude Code / Codex / Cursor

文档矩阵（README Platform Support）比「支持一切」诚实：

| Harness | 状态（文档用语） | 推荐分发 | 重要限制 |
| --- | --- | --- | --- |
| Claude Code | Stable primary | 插件或选择性安装 | 插件会把已安装目录暴露给模型；上下文紧时用 selective/manual；部分 shell skill 不跨 OS |
| Codex | Supported native plugin | Codex marketplace / 仓库配置 | 原生 hooks 需显式 trust；不走 Claude hook profile；legacy sync 仅兼容 |
| Cursor | Beta project adapter | 装进 `.cursor/` | Agent 发现随 Cursor 构建变化；hook 集合尚未完全对齐（公开 issue #2419） |
| OpenCode 等 | Beta / Experimental | 各自 selective target | **不声称** Claude 功能对等 |
| GitHub Copilot | Instruction-only | 检入的 instructions | 无 ECC hooks / 运行时 agents / 原生 skill 发现 |

安装入口（文档示例，钉版本时请自行核对 registry）：

```bash
# Claude Code 引导式插件安装
npx ecc-universal@2.2.2 setup

# 多 harness 引导（Claude / Codex / Kimi）
npx ecc-universal@2.2.2 install --guided

# 低上下文、不要 hooks
npx ecc-universal@2.2.2 install --profile minimal --target claude
```

Claude 与 Cursor 同机时，用 `ECC_AGENT_DATA_HOME` 隔开会话摘要与 learned skills，避免互相覆盖。Windows 原生路径对 continuous-learning v2 observer、部分 memory 写入仍有公开缺陷；WSL / Git Bash 更稳——这是运维事实，不是小字免责。

## 企业可抄 vs 容易变成噱头

**值得抄进内部平台的：**

1. **职责分离合同** — Skills（按需）/ Rules（常驻慎选）/ Hooks（上下文外强制）/ Agents（新鲜上下文审查）写进自己的 AGENTS.md 模板。
2. **Instinct 晋升闸门** — 置信度、项目作用域、cluster 后再变成 skill；禁止「会话结束直接写进全局政策」。
3. **Memory Vault 信任模型** — 未审核、只创建、密钥拒绝、身份绑定、doctor 失败即拒绝假装完整读取。
4. **Token 预算清单** — 主模型 / thinking / subagent / SessionStart 字符 / MCP 数量五件套。
5. **配置面扫描** — 把 hooks、MCP、skills 当供应链工件；对照 Cloudflare skill 的「发现与确认拆开」。
6. **安装状态机** — profile、dry-run、doctor、repair、uninstall；禁止静默装进所有检测到的 harness。

**容易变成噱头、要压住预期的：**

1. **星标与「操作系统」话术** — 星标证明传播，不证明你的 monorepo 装得下 292 skills。
2. **一次装全** — 文档自己警告：插件会把目录广告给模型；上下文紧时必须 selective。
3. **跨 harness 功能对等** — Cursor / Copilot / 实验适配器写明了限制；「一个配置打天下」不成立。
4. **把 Memory / Instincts 当政策源** — 文档反复说要人工晋升到受治理文档。
5. **把 AgentShield 当沙箱** — 扫描 ≠ 隔离；最低门槛仍是独立身份、短时凭证、默认无出站、kill switch。
6. **路线图当 GA** — ECC 2.0 参考架构里的企业策略包、SARIF、自改进 harness loop，很多仍是待验证 backlog。

和 [Jev × Claude Code](/cn/blog/jev-claude-code-10x-and-25-lines/) 对照也很有用：Jev 线强调「判断与生成拆开、小而可核的契约」；ECC 强调「把工程仪式装进 harness」。两者都在反对同一件事——让同一个膨胀上下文既当运动员又当裁判，还顺便当档案室。

## 落地清单（可直接贴进内部 runbook）

1. 先读 [Platform Support](https://github.com/affaan-m/ECC#platform-support) 矩阵，选定**一个**主 harness 与一条安装通道。
2. 从 `minimal` 或 `core --no-hooks` 起步；确认 `/plugin list` 或目标目录内容，再决定是否启用 hooks。
3. 写入 token 默认值与 `ECC_SESSION_START_*` / instincts 阈值；订阅制用户可关 API-rate 成本警告，但保留上下文耗尽警告。
4. 需要跨工具交接时再装 Memory Vault runtime；handoff 用 `--body-file`，team 记忆提交前人工审。
5. 对已装 hooks/MCP/skills 跑 AgentShield（或你们自己的配置扫描）；对照安全指南最低门槛补沙箱与身份。
6. 只把重复出现、有证据的 instincts promote 成内部 skill；其余当草稿。
7. 定期 `/context-budget` 式清理：禁用闲置 MCP、卸掉用不到的 rules，而不是再贴更长的总则。



## 和「只写更好的 CLAUDE.md」差在哪

很多团队第一次接触 harness 优化，会本能地做三件事：把规范写得更长、把 MCP 开得更多、把「记住上次教训」塞进用户级记忆文件。短期可能变好，长期通常坏在同一处——**常驻上下文变成垃圾场**，而真正该强制的步骤（测试红灯、新鲜上下文审查、危险命令闸门）仍然只靠模型自觉。

ECC 的设计偏好是反过来的：

- **该常驻的少而硬**（少量 rules、hook 闸门）。
- **该按需的多而可发现**（skills / agents 目录大，但是任务触发时再进上下文）。
- **该跨会话的要可检查**（instincts 带置信度与证据；Memory Vault 是 Markdown 文件，不是隐藏向量库里的唯一真源）。
- **该晋升的走人工或 verifier**（文档写明：记忆不自动变政策；架构 Non-Goals 写明：没有 verifier 证据就不要自动改用户配置）。

站内 [Jev](/cn/blog/jev-claude-code-10x-and-25-lines/) 文强调「判断与生成拆开」；ECC 把类似精神扩到工程仪式：计划、测试、实现、审查、验证、记忆、改进，写成默认流水线，而不是每次聊天重说一遍。你仍然可以只用 25 行级的小契约做关键判断——但日常交付靠的是可重复的闸门，而不是英雄式 prompt。

## 选择性安装：大体量仓库的真正工程题

ECC 体量大，不是 bug，是产品选择：它想覆盖多语言审查、TDD、安全、ML、内容与运营等工作流。对个人爱好者，「全装」可能只是磁盘与目录噪音；对企业平台组，**全装几乎一定是事故**——模型会看到巨大的 skill/agent 广告面，SessionStart 与 rules 再叠一层，上下文还没干活先薄了一截。

`docs/SELECTIVE-INSTALL-ARCHITECTURE.md` 把问题说得很直：当前安装路径已有 profile / module 基础，但仍有耦合；目标态是模块目录、配置文件、目标适配器分层，并带 `list-installed` / `uninstall` / `doctor` / `repair` 生命周期。对读者更重要的是**现在就能用的纪律**：

1. 用 `--profile minimal|core|...` 与 `--with capability:...` 显式选能力，而不是「检测到什么装什么」。
2. 引导安装会预检并要求最终确认；自动化路径要把 scope、hook profile、harness 写死。
3. hooks 物化前必须显式 `--enable-hooks` 或 `--no-hooks`，否则安装器停住——这是防「默默获得执行能力」的合同。
4. 每个 harness 一条通道；重复安装优先卸载修复，而不是叠加。

企业抄作业时，不妨把「选择性安装」上升成平台原则：内部 skill 目录再漂亮，默认下发也必须是最小集；扩展靠工单与配置评审，而不是开发者本机 `npx` 偶然成功。

## 验证环与「新鲜上下文审查」

Longform / README 把 verification loop、eval-harness、checkpoint 写成与记忆、并行化并列的主题。公开材料里的主张很朴素：**结果不只是代码，还是证据链**——计划、失败测试、通过测试、审查发现、最终校验。审查 agent 用有限工具集、独立上下文，专门找回归与盲点；实现上下文不再既当作者又当唯一裁判。

这和 Cloudflare security-audit-skill 的「新 verifier 证伪候选」同构，也和 [Agents of Chaos](/cn/blog/agents-of-chaos-ai-agent-failures/) 里常见失败——同一会话自我确认——相反。企业若只抄 ECC 的 skill 名字、不抄「新鲜上下文 + 结构化证据」这两点，收获多半是更长的聊天记录。

并行化部分（worktree、多实例）文档有写，但成本警告同样醒目：Agent Teams 复制窗口；只在多模块、并行审查等场景划算。平台组应把「并行」做成显式开关与预算，而不是默认炫技。

## Hook profile 与「确定性强制」的边界

Hooks 是 ECC 相对「纯 prompt 规范」最硬的一层：匹配工具事件后跑脚本，例如在编辑 `*.ts` 时警告 `console.log`。运行时可用 `ECC_HOOK_PROFILE`、`ECC_DISABLED_HOOKS` 微调。文档同时警告：hooks 能跑 shell，等于扩展了攻击面；现代 Claude Code 会自动加载插件内 `hooks/hooks.json`，重复声明或手工再拷一份会导致双触发与历史踩坑（README 引用过多次 fix/revert issue）。

所以企业边界应写成：

- **允许的 hook**：只读检查、告警、拒绝已知破坏性模式、写审计日志。
- **高风险 hook**：任何会改仓库、碰密钥、出站网络的动作，必须进变更评审，并与 AgentShield / 内部扫描一起回归。
- **本地模型 / 低上下文**：优先关 SessionStart 附加上下文，甚至走 no-hooks profile，再逐步加回。

「确定性强制」很香，但强制的是**你写进脚本的策略**；策略本身仍要版本管理与审查。把第三方 skill 仓库的 hooks 整包信任，等于把供应链扩到每一次工具调用。

## 和站内其他文怎么串

读完 ECC，建议按这条线串站内文章，而不是平行收藏：

1. [Claude Code Agent Harness](/cn/blog/inside-claude-code-agent-harness/) — 先理解核心循环与生产鸿沟。
2. 本文 — 在循环外装性能/记忆/安全子系统。
3. [Agent Skills 入门](/cn/blog/agentskills-io-starter-guide/) — 学会把能力收成可分发包。
4. [Cloudflare security-audit-skill](/cn/blog/cloudflare-security-audit-skill-for-coding-agents/) — 看垂直安全工作流如何把发现与确认拆开。
5. [Jev × Claude Code](/cn/blog/jev-claude-code-10x-and-25-lines/) — 提醒小契约与判断层，避免 harness  alone 变成形式主义。
6. [Agents of Chaos](/cn/blog/agents-of-chaos-ai-agent-failures/) — 用失败模式压测你的记忆、权限与并行假设。

学术对照继续用外部链接 [arXiv:2609.26760](https://arxiv.org/abs/2609.26760)：标题已经把主张说清——长的是 harness，不是无限上下文。ECC 是该主张在工程目录上的一个大声样本；它是否适合你的组织，取决于你能不能执行「选择性安装 + 晋升闸门 + 配置面扫描」，而不是取决于今天的星标数。



## 版本与供应链：钉住什么、别钉错什么

公开材料里同时出现 **2.2.2**（仓库 `VERSION`、README 安装示例）与 **v2.2.1**（GitHub Releases / npm `latest` 在抓取当下可见）。这对读者的实践含义很简单：

1. 安装命令里的版本钉是**可复现性**，不是安全审计；README 自己写：版本钉不等于完整性校验，跑包前仍要看源与 registry。
2. 企业流水线应固定到**你们评审过的** tag / commit / npm 版本，并保留卸载与回滚路径；不要默默追 `latest`。
3. 只从官方 surface 取包；SECURITY.md 已点名若干撞库元数据的非官方包名。
4. `mcp-configs/mcp-servers.json` 是模板：真实密钥走环境变量或密钥管理，不要写进会进 `claude doctor`、截图或 issue 的用户配置。

把「装 ECC」当成一次供应链变更来管理，比争论它是不是「真·操作系统」更有生产意义。星标可以说明传播速度；变更评审、版本钉死与官方分发面，才说明你敢不敢把它放进开发者默认环境。

## 结语

ECC 值得写进「长期主义」选题，不是因为它短暂冲上星标榜，而是因为它把 harness 优化拆成了**可安装、可配置、可拒绝、可审计**的子系统：上下文经济学、带闸门的学习记忆、跨工具的未审核手递、以及把配置面当攻击面的扫描器。企业真正该抄的是这些合同与清单；该警惕的是把目录规模、路线图与星标误当成已经替你完成了生产加固。

核心循环仍在 Claude Code / Codex / Cursor 手里——见站内 [Agent Harness](/cn/blog/inside-claude-code-agent-harness/)。ECC 做的是：在循环外围，把「省、记、防」从祈祷式 prompt，变成工程对象。优化上下文窗口，把其余沉淀到可检查的地方——这句话比任何软广都耐用。
