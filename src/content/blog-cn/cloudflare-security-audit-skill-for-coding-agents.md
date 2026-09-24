---
title: "Cloudflare 开源 security-audit-skill：给编程 Agent 装上可验证的安全审计流程"
description: "拆解 cloudflare/security-audit-skill：Skill 分发形态、六阶段审计、confirmed / needs_validation / rejected 三态结论、对抗式校验与无沙箱时的 fail-open。说明安装用法、企业可抄点与安全边界。"
pubDate: 2026-09-24T00:00:00+08:00
author: "Remy"
tags: ["Cloudflare", "security", "Agent Skills", "安全审计", "agent-harness", "developer-tools", "agent-loop"]
lang: "zh"
---

编程 Agent 越来越会改代码，安全团队却越来越难回答一个问题：**「这次改动有没有引入可利用的边界破坏？」** 把整段安全方法论塞进一句 system prompt，短期好看，长期通常塌在三件事上——覆盖说不清、结论不可复核、一跑就想执行目标代码。Cloudflare 开源的 [security-audit-skill](https://github.com/cloudflare/security-audit-skill) 把另一条路摊开：先把审计流程做成可安装的 **Agent Skill**，用结构化产物与独立校验把「发现」和「确认」拆开；它还是 Cloudflare 内部漏洞发现 harness 的单仓库起点，官方在博文 [Build your own vulnerability harness](https://blog.cloudflare.com/build-your-own-vulnerability-harness) 里写过从 Skill 长成车队级流水线的过程。

截至 2026-09-24，该仓库约有 **20,703** star、约 **1,176** fork，许可证为 **MIT**。下文星标与流程描述以公开 README / `SKILL.md` / Cloudflare 博文为准；未在公开材料出现的内部命中率、美元成本等数字，一律不编造。

站内可对照阅读：[Agent Skills 入门](/cn/blog/agentskills-io-starter-guide/)、[AI 编码代理与真实漏洞研究](/cn/blog/anthropic-mozilla-ai-vulnerability-research/)、[Open Code Review 确定性流水线](/cn/blog/alibaba-open-code-review-deterministic-pipeline/)、[Claude Code Agent Harness](/cn/blog/inside-claude-code-agent-harness/)，以及 [Jev × Claude Code](/cn/blog/jev-claude-code-10x-and-25-lines/) 里「判断与生成拆开」的边界讨论。

## 为什么是 Skill，而不是又一个安全 Bot

Skill 解决的是**分发与触发**：把「何时启用、按什么阶段跑、产出什么文件、怎样才算确认」写成编程 Agent 能加载的说明书，而不是再挂一个只能在 GitHub 上留言的机器人。站内 [Agent Skills 入门](/cn/blog/agentskills-io-starter-guide/) 讲过 Skills 作为可分发能力包的形态；security-audit-skill 则是安全垂直场景里的高强度样本——文件多、阶段硬、校验脚本齐全。

README 写得很直白：这是 Cloudflare 漏洞发现 harness 的种子；harness 后来长成多阶段、跨仓库的车队系统，而这个 Skill 是它演化出来之前的**单仓库起点**。对企业读者，这句话比星标更重要：你抄的是「可安装的审计工作流」，不是「已经替你扫完全舰队的 SaaS」。

和 Open Code Review 的对照也很有用。OCR 把**代码审查**里不能错的步骤（选文件、打包、定位）做成确定性工程；security-audit-skill 把**安全审计**里不能混的步骤（侦察台账、隔离狩猎、对抗校验、结构化结论）做成 Skill 工作流。一个偏 PR 门禁，一个偏漏洞狩猎与报告；二者都在回答同一类问题——别让模型同时当运动员和裁判。

## 六阶段在干什么（以及三态结论为什么重要）

Skill 把一次完整审计拆成六个阶段（以仓库 README 为准）：

1. **Reconnaissance（侦察）** — 梳理架构、信任边界、输入面、既有证据，并写入确定性覆盖台账：`architecture.md` 与 `coverage-ledger.json`。
2. **Coverage-led hunting（按覆盖狩猎）** — 按台账单元指派隔离的 hunter，记录检查项，再用 coverage critic 找缺口。
3. **Candidate validation（候选校验）** — 每个独特候选交给**新的** verifier，任务是尽量证伪。
4. **Structured output（结构化输出）** — 把 `confirmed`、`needs_validation`、`rejected` 写入 `findings.json`，并用 `report-schema.json` 做校验。
5. **Independent record verification（独立记录复核）** — 再用新的 agent 核对最终源码主张；若发生实质性替换，再过一轮独立 verifier。
6. **Target-neutral reporting（目标中立报告）** — 从已核验记录与覆盖台账派生 `REPORT.md`、`FINDINGS-DETAIL.md`、`NEEDS-VALIDATION.md`。

父 agent 会在台账创建后与每次更新后跑 `validate-coverage-ledger.cjs`；在第 4 阶段以及第 5 阶段每次替换后跑 `validate-findings.cjs`。这不是装饰：JSON schema + 零依赖校验脚本，等于把「报告长什么样」从模型自由发挥里拽回可回归的合同。

三态结论必须分开理解：

| 结论 | 含义（按 README） | 不该做什么 |
| --- | --- | --- |
| `confirmed` | 有完整源码追溯，且有边界清晰的观察结果 | 不要把「看起来很危险」直接升格为 confirmed |
| `needs_validation` | 有精确的未决事实，**不带严重级别** | 不要给它打 High/Critical 去吓业务方 |
| `rejected` | 候选已被证伪 | 不要删记录装成「从没误报」；保留证伪轨迹更有价值 |

这套状态机直接针对安全 Agent 最常见的翻车：把「检查清单偏差」「纵深防御缺口」「还缺一个部署侧事实」写成已确认漏洞。README 的设计原则写明：**纵深防御缺口不是漏洞**——若 A 层已经挡住攻击，缺少 B 层应记为加固建议，而不是漏洞条目；**严重级别需要影响**——是可能性 × 影响，不是偏离清单的程度。

## 阶段产物与校验脚本：把合同写进文件系统

若只记住「六阶段」四个字，落地时仍会漂。更值得抄进 runbook 的，是 README 列清的**文件级合同**：

| 阶段 | 关键产物 | 机械校验 |
| --- | --- | --- |
| 侦察 | `architecture.md`、`coverage-ledger.json` | 创建台账后跑 `validate-coverage-ledger.cjs`；之后每次改台账再跑 |
| 按覆盖狩猎 | 台账单元上的检查记录、critic 指出的缺口 | 台账更新后再跑 coverage 校验 |
| 候选校验 | 待写入 `findings.json` 的候选（先证伪） | — |
| 结构化输出 | `findings.json`（`confirmed` / `needs_validation` / `rejected`） | 对照 `report-schema.json`，跑 `validate-findings.cjs` |
| 独立复核 | 可能替换后的 findings 记录 | 每次实质性替换后再跑 `validate-findings.cjs` |
| 目标中立报告 | `REPORT.md`、`FINDINGS-DETAIL.md`、`NEEDS-VALIDATION.md` | 报告由已核验记录派生，而不是另起炉灶自由发挥 |

仓库还提供 `validate-findings.test.cjs` 与 `validate-coverage-ledger.test.cjs`，说明校验器本身是可测的，不是「脚本在那儿摆着」。企业自研类似流程时，最低标准应是：**人读报告之前，机器先拒收不合 schema 的 JSON。** 否则三态结论会在第一次模型跑偏时塌掉。

`SKILL.md`、`RECONNAISSANCE.md`、`HUNTING.md`、`VALIDATION-AND-REPORTING.md` 以及多份攻击类文档，是阶段提示词与方法论；`report-schema.json` 与两个 `validate-*.cjs` 则是阶段之间的硬门。前者可以随目标类型裁剪加载，后者不宜当成可选项关掉。

## 安装与触发：先分清「指导模式」和「完整审计」

安装走 [Skills CLI](https://skills.sh)：

```bash
npx skills add https://github.com/cloudflare/security-audit-skill \
  --skill security-audit
```

用户级安装加 `--global`：

```bash
npx skills add https://github.com/cloudflare/security-audit-skill \
  --skill security-audit \
  --global
```

装好后，在目标代码库打开你的编程 Agent，用自然语句触发，例如：

```text
security audit this codebase
```

```text
find security vulnerabilities in ./src
```

```text
do a security review, output to ~/audits/my-project
```

`SKILL.md` 强调一个容易被忽略的开关：**默认是指导模式（guidance）**。加载 Skill 并不等于授权完整六阶段或自动写报告目录。完整审计模式只在用户明确要求审计 / 渗透测试代码库、要求端到端安全评审、或明确索要报告产物时启用。若请求可能两可，先问一句再开跑——这是在防「随口问个安全问题，Agent 却把仓库扫出一堆文件」。

完整审计若未指定输出目录，默认落在 `~/security-audit-skill/<repo-name>/run-<N>`。只有当你**明确**选中一个已被版本控制忽略的目录时，工作流才写进目标仓库内部。对企业来说，这是基本卫生：审计产物默认外置，避免秘密与半可信报告被误提交。

运行要求也很具体：

- 支持工具调用与并行子 agent 的编程 Agent；
- 用 Node.js 跑零依赖的 findings / coverage-ledger 校验器；
- **OS 强制沙箱**：对目标控制的构建、测试、进程、浏览器、模拟器、fuzz、fixture 处理生效——禁用外网、净化并白名单环境变量、限制资源、只允许写到分配的 scratch。若这些控制做不到，工作流应把线索留在 `needs_validation`，**而不是去执行目标代码**。

最后一条就是标题里说的 fail-open / 安全边界：**宁可少确认，也不要在无沙箱时假装能动态验证。**

## 对抗式校验与写隔离：这才是「能信」的来源

README 原则写着：**检查发现的 agent，绝不是发现它的那个 agent。** Cloudflare 博文把同一思想扩成车队级 harness：发现与验证用不同模型、不同阶段，并把状态外置，避免上下文窗口把早上找到的洞「忘掉」。Skill 版是单仓库缩影——隔离 hunter、新鲜 verifier、独立记录复核，再加 schema 校验。

`SKILL.md` 对写隔离更细：父 agent 独占共享文件（如 `run-metadata.json`、`architecture.md`、`coverage-ledger.json`、`findings.json` 与报告文件）；每个 hunter / verifier 有独立目录，scratch 与 artifacts 分离；提升产物时要做 path 校验、no-follow、常规文件与链接数检查、字节上限等。你未必在第一周就复刻全部描述符级加固，但应抄下纪律：

1. **发现者不能终审自己的洞；**
2. **目标进程只能写 scratch；**
3. **进入保留区的文件必须经可信父流程提升；**
4. **缺沙箱就停在 needs_validation。**

这和站内讨论 Agent 失败模式时的提醒一致：把不可信目标与编排层缠在一起，是事故高发区（参见 [Agents of Chaos](/cn/blog/agents-of-chaos-ai-agent-failures/) 一类「Agent 失控」讨论）。安全审计 Skill 把「目标代码可能敌对」当成默认前提，而不是事后补丁。

## 覆盖台账：单次跑不完，是特性不是 bug

README 写明：对同一仓库的多次运行是**可叠加的**。Skill 会利用既有 ledger 与 findings 去打缺口、重验已变源码，并在源码仍成立时继承证据——**不会把过期或未决工作当成已覆盖**。设计原则还给出可核口径：在他们的测试运行里，**单次运行大约只找到多次运行合计漏洞的一半左右**。

这句话应写成运营策略，而不是失望：

- 第 1 次跑：建立架构图与覆盖台账，收第一批高置信 `confirmed`；
- 第 2–N 次：专打 critic 指出的缺口与 `needs_validation`；
- 源码变更后：重验相关单元，而不是整库盲扫装「全新」。

企业若把「只跑一次 Skill」当成年度审计闭环，会系统性低估残留风险。更合理的 KPI 是：覆盖台账单元的填满速度、`needs_validation` 的消化周期、`confirmed` 经人工受理的比例——而不是单次报告页数。

## 攻击面文件：按目标类型加载，而不是一次塞进所有恐惧

仓库除了 `SKILL.md` / `RECONNAISSANCE.md` / `HUNTING.md` / `VALIDATION-AND-REPORTING.md`，还按目标类型拆了多份狩猎类文档，例如：

- 内存安全与二进制 / 内核；
- AI / LLM（提示注入、agent/工具、输出处理）；
- Web 协议与认证；
- 客户端 / 浏览器；
- 供应链与发布；
- 云与部署；
- RPC / 消息；
- 资源耗尽与可用性；
- 数据隔离与生命周期；
- 桌面 / 移动 / 本地 IPC。

这不是让你每次审计把所有文档灌进上下文。正确用法是：侦察阶段先判断产品类型，再加载相关攻击类。对 LLM 应用，优先 AI/LLM 与数据隔离；对原生解析器，优先内存安全；对纯业务 API，优先认证与租户隔离。上下文窗口有限时，「全开」等于「全糊」。

## 和企业已有安全流程怎么接

可以把 Skill 想成「研究员助手的标准作业程序」，而不是替换 SAST/DAST/人工红队：

1. **PR 级**：太重。PR 门禁更适合 OCR 一类高信号审查（见 [Open Code Review](/cn/blog/alibaba-open-code-review-deterministic-pipeline/)）加上常规 SAST。
2. **版本发布前 / 重大重构后**：适合完整审计模式，输出外置目录，安全同事只看 `confirmed` 与分了优先级的 `needs_validation`。
3. **专题狩猎**：例如「本季度只查租户隔离」，用指导模式 + 相关攻击类文档，避免六阶段全开。
4. **与真实漏洞研究工作流衔接**：Skill 解决的是可重复的源码优先审计；协调披露、CVE、维护者确认仍要走人类流程。站内 [Anthropic × Mozilla 漏洞研究](/cn/blog/anthropic-mozilla-ai-vulnerability-research/) 说明：可信度来自可验证工作流，而不是模型自评。

落地时建议固定三个角色：

- **平台工程**：维护 Skills 安装、沙箱镜像、输出目录策略；
- **安全工程**：维护攻击类优先级、受理 `confirmed`、关闭误报；
- **业务仓库 Owner**：处理补丁与回归，不把 Agent 报告直接当变更单。

## 和 OCR、红队、常规扫描怎么分工（对照表）

把三条线写在一张表上，能少开很多会：

| 维度 | Open Code Review | security-audit-skill | 人工红队 / 专项研究 |
| --- | --- | --- | --- |
| 主问题 | 这次 diff 有没有高信号缺陷？ | 这个仓库有没有可确认的边界破坏？ | 在真实约束下能否打出业务影响？ |
| 典型触发 | PR / 本地 `ocr review` | 显式「完整审计」或专题狩猎 | 发布前、合规、高风险变更 |
| 证据形态 | 行级评论、规则 ID | `findings.json` 三态 + 报告 | 利用链、报告、披露材料 |
| 与模型关系 | 确定性选文件 / 定位 + Agent 推理 | 覆盖台账 + 对抗式多 agent | 人主导，Agent 可辅助 |
| 失败时默认 | 更高精准、更低召回（以官方基准叙述为准） | 无沙箱则 `needs_validation` | 范围外不做、授权外不做 |

站内 [Open Code Review](/cn/blog/alibaba-open-code-review-deterministic-pipeline/) 适合做日常门禁；本 Skill 适合做版本级或专题级源码审计；[AI 编码代理与真实漏洞研究](/cn/blog/anthropic-mozilla-ai-vulnerability-research/) 一文提醒：真正进入 CVE / 维护者确认的，仍然依赖可验证工作流与人类责任。三者叠代，而不是互相替换。

也和 [Agent Harness](/cn/blog/inside-claude-code-agent-harness/) 对照：Skill 提供可分发 SOP，Harness 提供循环与状态外置；Cloudflare 博文描述的车队 harness，正是 Skill 方法论在持久化编排上的延长线。急着「上舰队」却还不能让人信 `confirmed`，通常只是把噪声放大。

## 安全注意事项：fail-open、范围与「不要扫生产」

公开材料里最值得写成红线的有这些：

1. **无 OS 沙箱就不要执行目标代码** — 线索留在 `needs_validation`，并写明缺的是哪项控制。
2. **不要探测已部署端点、外网服务、共享基建、生产身份、他人数据或实时控制面** — `SKILL.md` 把源码优先与本地夹具边界写得很死。
3. **不要用真实密钥与真实租户** — 用虚拟主体与 fixture。
4. **指导模式勿擅自升级为全量审计** — 防止「问一句」变成「写一目录报告」。
5. **`needs_validation` 不打严重级别** — 避免未决事实在工单系统里变成虚假 CVSS。
6. **纵深防御缺口 ≠ 漏洞** — 防止报告被加固建议刷屏，稀释真洞。
7. **多次运行才接近「他们测试中的合计发现」** — 单次报告不得宣称穷尽。

若你的编程 Agent 跑在开发者笔记本上、且没有隔离，务实策略是：只跑侦察与纯静态狩猎，动态验证全部人工接管；或者把完整审计丢进专用 CI 沙箱机。把「能跑 Skill」理解成「已获得攻击目标的授权」是常见误读——Skill 是流程，不是授权书。

## 沙箱与 fail-open：缺控制时该停在哪

README 对沙箱的要求可以拆成可检查清单，而不是一句「注意安全」：

1. **禁外网** — 目标控制的构建 / 测试 / 浏览器 / fuzz 不能借审计过程打到公网或内网邻居。
2. **净化并白名单环境变量** — 避免把开发者笔记本上的云密钥、npm token、Kube 凭证泄漏进目标进程。
3. **资源上限** — CPU、内存、进程数、文件大小、磁盘与墙钟时间都要有显式限制，降低「审计变成挖矿或 fork 炸弹」的风险。
4. **只写分配的 scratch** — 目标进程不能改仓库源码、不能写共享输出目录；保留产物只能由可信父流程提升。

`SKILL.md` 把提升过程写得很硬：校验相对路径、拒绝符号链接组件、no-follow 打开、确认是常规文件且链接数为 1、按字节上限拷贝、目标侧同样做目录穿越防护。你未必第一周就复刻全部描述符级细节，但必须保留四条纪律：**发现者不能终审自己的洞；目标只能写 scratch；保留区只经父流程写入；缺沙箱就停在 `needs_validation`。**

这就是 fail-open 的工程含义：不是「出错也放行合并」，而是「动态证据拿不到时，宁可留在未决，也不假装已确认」。对安全工单系统，对应规则应是：`needs_validation` 可以进调研队列，但**不能**自动变成带 CVSS 的漏洞单。

## 和 Harness、Jev、OCR 放在同一张能力图上

一张简化的能力图：

| 能力 | 代表 | 解决什么 |
| --- | --- | --- |
| 可分发知识包 | Agent Skills | 如何触发、如何分段、产出什么 |
| 循环与状态 | Agent Harness | 上下文、恢复、工具边界 |
| 结构化判断 | Jev 一类决策层 | 快、可校准的分支判断 |
| PR 高信号审查 | Open Code Review | 选文件 / 定位 / 低噪声评论 |
| 安全审计 SOP | security-audit-skill | 覆盖台账、对抗校验、三态结论 |

Cloudflare 博文的核心论点之一是：**harness 比单次模型会话更长久**；模型可换，编排与状态外置才是资产。Skill 是 harness 的可分发前端——先让单仓库跑通方法论，再在有需要时外置数据库、跨仓追踪、去重与修复流水线。企业抄袭顺序建议是：

1. 先能正确安装并区分指导 / 完整模式；
2. 先能在沙箱里跑通一次六阶段；
3. 先能让安全同事信任三态结论；
4. 再谈跨仓与车队级编排。

跳过前三步直接「上舰队」，通常会得到更快的噪声机器。

## 误用案例：这些做法看起来勤快，其实在挖坑

下面几条来自公开设计原则的反面教材化——不是仓库点名批评某家公司，而是把 README / `SKILL.md` 已经写明的边界翻译成「别这么干」：

1. **把 Skill 当 PR 机器人每次必跑** — 六阶段 + 多 agent 对每个小 PR 过重，也容易把 `needs_validation` 刷进审查噪声。PR 更适合 OCR + SAST。
2. **无沙箱仍让 Agent「跑起来看看」** — 直接违反「缺控制就不要执行目标代码」。笔记本上的云密钥、内网可达性，足够把一次审计变成一次事故。
3. **给 `needs_validation` 填上 Critical** — 未决事实没有严重级别；一进 Jira 就变成虚假风险账本，安全与业务都会失去对三态的信任。
4. **把纵深防御缺口写成漏洞清单** — README 写明：若 A 层已挡住，缺 B 层是加固建议。否则报告会变成无法排期的「建议海洋」。
5. **跑一次就宣称「已全覆盖」** — 公开测试叙述是：单次大约只找到多次运行合计的一半左右。正确说法是「本轮台账进度与 confirmed 集合」，不是「仓库已无洞」。
6. **指导模式问题被默认升级成全量审计** — `SKILL.md` 要求两可时先问；静默写报告目录，会破坏开发者对 Agent 的基本信任。
7. **输出写进仓库且未忽略** — 默认应外置到 `~/security-audit-skill/...`；只有显式选中被 ignore 的目录才写进目标库，否则秘密与半可信报告容易被误提交。
8. **发现者自己点确认** — 对抗式校验是信任来源；关掉独立 verifier「为了省钱」，等于回到 system prompt 审自己。

若你正在用 Skill 却反复撞上 [Agents of Chaos](/cn/blog/agents-of-chaos-ai-agent-failures/) 里写过的失控模式——工具边界不清、状态不可审计、失败不可复盘——优先回到覆盖台账、三态结论与沙箱清单，而不是再加一条更长的提示词。

## 一条十四天试用计划

**第 1–2 天**：用 Skills CLI 装到一台**有沙箱**的代理环境；选一个非生产、可丟的示例仓库；先跑指导模式问两个具体问题，确认不会擅自写全量报告。

**第 3–5 天**：对同一示例仓库跑一次完整审计；人工抽查：`confirmed` 是否真有源码链与边界结果；`needs_validation` 是否每条都有「精确未决事实」；`rejected` 是否保留了证伪理由。

**第 6–8 天**：不改代码再跑一轮，看台账是否转向缺口而不是简单重复；对照 README「单次约一半」的预期，检查第二轮是否仍有增量。

**第 9–11 天**：选一个真实内部服务仓库（只读镜像），只启用与之匹配的攻击类文档；输出目录外置；安全工程师做受理演练。

**第 12–14 天**：写组织红线：无沙箱禁动态验证、禁扫生产、`needs_validation` 不进漏洞 KPI、完整审计需显式指令。决定是否进入更大范围试点。

退出标准：若安全工程师不愿受理 `confirmed`，先别扩面——先改攻击类范围、验证严格度与报告模板，再谈推广。


## 结语

security-audit-skill 值得写进安全与平台团队的联合雷达，不是因为它星标高，而是因为它把三句常被当成口号的话做成了可安装工件：**发现与验证分离；未决事实不要假装已确认；没有沙箱就 fail-open 到 needs_validation。** Skill 分发解决「如何让编程 Agent 按同一 SOP 工作」；六阶段与覆盖台账解决「如何证明扫过什么」；三态结论与对抗式校验解决「如何让人敢信」。

它不是 PR 上的自动评论机器人，也不是一键替换红队。把它当作单仓库审计的标准作业程序，接上你们的沙箱、受理与披露流程，才会从星标项目变成组织能力。若你同时在看审查门禁，请把本文与 [Open Code Review](/cn/blog/alibaba-open-code-review-deterministic-pipeline/) 对照：一条线降 PR 噪声，一条线抬高漏洞证据质量——两者都需要确定性结构，而不是更长的提示词。

## 参考来源

1. [cloudflare/security-audit-skill](https://github.com/cloudflare/security-audit-skill)（README、星标、MIT；查阅于 2026-09-24）
2. 仓库内 `skills/security-audit/SKILL.md`（指导模式 / 完整审计、沙箱与写隔离）
3. [Build your own vulnerability harness](https://blog.cloudflare.com/build-your-own-vulnerability-harness)（Cloudflare 博文，Skill 到车队 harness 的上下文）
4. [Skills CLI / skills.sh](https://skills.sh)（安装入口）
5. 站内相关：[Agent Skills 入门](/cn/blog/agentskills-io-starter-guide/)、[AI 编码代理与真实漏洞研究](/cn/blog/anthropic-mozilla-ai-vulnerability-research/)、[Open Code Review](/cn/blog/alibaba-open-code-review-deterministic-pipeline/)
