---
title: "谁握笔签字？让规格而不是 Agent 收尾：SpecHarness 与规格权威"
description: "解读 arXiv:2609.29921 SpecHarness：把可见规格编译成可验证义务，Agent 只提案、外部运行时凭合格证据提交状态与收尾；对照 OpenSpec/SDD 与站内 harness 叙事，并给出可落地的提案–权威分离清单。"
pubDate: 2026-09-25T00:00:00+08:00
author: "Remy"
tags: ["sdd", "openspec", "agent-harness", "ai-agents", "agent-loop", "specification"]
lang: "zh"
---

编码 Agent 的日常里有一种很隐蔽的合并：任务说明、指南、输出 schema、`SKILL.md` 本来是「外部规格」，但运行时它们往往只是同一模型的上下文——同一模型规划、调用工具、自评结果，再自己宣布「做完了」。提案与验收塌缩进一个回路，规格没有独立的权威边界。UT Arlington 与合著者在 [arXiv:2609.29921](https://arxiv.org/abs/2609.29921) 把问题钉死：**谁握笔签字，决定什么叫合规完成。** 论文提出的 SpecHarness，把可见规格编译成带溯源的义务（obligation），用版本化账本与合格证据决定状态提交与收尾——一句话：**Agent 提案，SpecHarness 提交。**

这篇是站内 OpenSpec / SDD / harness 主线的运行时落地文，不是软新闻。它和「把规格写清楚给人与模型看」互补，但不等于 Fission-AI 的 OpenSpec 产品本身；SpecHarness 是研究侧的运行时权威架构。数字只取论文报告，不外推。

## 两个结构缺口：懂了不等于做到，说完不等于成立

论文用图 1 拆开两种失败。

**理解–执行缺口（understanding–execution gap, U–E）。** 模型可以正确理解要求——例如步骤顺序、参数约束、产物形态——却在执行中漏做、做错、或把约束拼错。理解写在上下文里，并不自动变成被遵守的执行轨迹。

**状态–权威缺口（state–authority gap, S–A）。** 更硬的一层：Agent 的解释或完成声明，并不能证明规格所要求的状态已经成立。它可以诚实以为做完了，也可以策略性早停；无论哪种，**自述完成 ≠ 权威完成**。

多数系统缺的不是「再多一点提示」，而是**规格权威边界**：谁有权建立规格所管辖的状态，并授权收尾。训练对齐（RLHF、Constitutional AI）仍把行动与评判绑在同一模型上；推理时干预则常落在三种范式之一——事后核验、完成门控、运行时强制——各自有用，但很少同时管辖「执行过程」与「被证据授权的状态提交」。SpecHarness 要补的正是这条边界。

## SkillsBench 上的可核对数字（只取论文）

作者在全部 **87** 道 SkillsBench 任务上量化两个缺口。编译器候选来自七个模型，用仅来自 Agent 可见材料的开发集标注按既定协议选型，并在评测前冻结；最终选用 **GPT-5.6 Sol**。该编译器只从 Agent 可见的任务提示、工作区信息与注入的 skill 规格中抽取 **509** 条源 grounded 任务方向（source-grounded task directions），**不**把 held-out 官方 verifier 或 oracle 解法用于义务构造与运行时反馈。

跨七个任务 Agent 模型，这些方向的满足率仅为 **79.6%–86.4%**——看得见的要求，仍有相当比例在执行里落空。更刺眼的是完成声明：Agent 的 completion-claim 率高出官方评测器通过率 **28.7–37.9** 个百分点。缺口不是某一家模型的脾气问题。

测量面本身也值得强调：509 条方向来自冻结编译器对 Agent 可见材料的抽取，作为跨模型、跨条件共用的源 grounded 分母；满足与否由执行证据判定，而不是由官方 verifier 反推「模型心里懂不懂」。U–E 因此度量的是**未实现的源 grounded 单元**，不是潜在理解力测验。事后对齐审计显示这些方向与 585 个 held-out 官方测试函数中的 573 个有对齐关系（含 406 个细粒度匹配）——这衡量的是对齐程度，不是把 verifier 语义原样恢复进义务。读数字时保持这个分母意识，才不会把「方向满足率」和「官方 Pass」混成一件事。

七个模型（论文命名）：GPT-5.6、Claude Fable 5、Gemini 3.1、Kimi K3、GLM-5.2、Qwen3.7、DeepSeek-V4（表中任务 Agent 常写作 DeepSeek-V4-Pro / Qwen3.7-Max 等变体名）。它们既做编译器候选，也在 SkillsBench / GuideBench 上分别充当任务 Agent；编译器选型冻结为 GPT-5.6 Sol 后，方向索引与义务 IR 对所有条件共用。Raw 与 SpecHarness 均以 **OpenHands** 为共享执行底座，预算、超时与工具访问在配对条件间对齐，避免「一边多给工具、一边少给预算」的假对比。

主结果（Table 1，七模型未加权宏平均）：

| 条件 | Pass↑ | U–E↓ | S–A↓ |
| --- | --- | --- | --- |
| Raw | 61.1% | 17.4% | 32.8% |
| SpecHarness | 73.1% | 9.3% | 12.8% |
| 相对 Raw | **+12.0 pp** | −8.1 pp | **−20.0 pp** |

Pass 是官方 verifier 通过率；U–E / S–A 是诊断指标。宏平均 Pass 提升的 95% 配对任务 bootstrap 区间不含零；逐模型 McNemar 经 Holm 校正仍显著（附录 D.1）。论文明确：主对比评估的是含在线校验、反馈与修复的**完整受管辖运行时**，不是在匹配算力下单独抽出「提交」这一刀的效应；计算开销见附录 D.3。S–A 降幅大于 Pass 升幅，与「修复失败 + 拒绝无证据完成声明」同时发生一致。

## State Authority Principle：提案自主，状态权威外置

论文把区分写成 **State Authority Principle（状态权威原则）**：对可靠 grounded 且可验证的条件，**规格定义什么可以被接受**；**外部运行时判定所需状态是否已成立**。Agent 仍可解释任务、规划、选型工具与 skill、实现与修复，但这些动作只产生提案（proposal）——行动提案、修复提案、收尾请求。权威状态只能由合格 provider 给出的 admissible evidence 建立。

形式化直觉（不必背公式）：运行时维护版本化义务账本；账本条目变更必须伴随对应义务、可接受证据与 commit 事件。Agent 的输出、自评与「我觉得过了」不能直接写账本。于是分工清楚：**Agent proposes; SpecHarness commits.** Commit 可以记录通过或失败；是否「满足」另有 freshness 与满足判定——失败也可以被权威地记下，以便驱动修复，而不是假装没发生。

这对站内读者并不陌生：[Jev × Claude Code](/cn/blog/jev-claude-code-10x-and-25-lines/) 与 [Jev-Mem](/cn/blog/jev-mem-system-one-agentic-memory/) 讨论的是「生成与判断拆开」；[扩张 Harness](/cn/blog/grow-the-harness-not-the-context/) 讨论的是「控制沉进代码」。SpecHarness 推到更硬的一层：**完成签字权不该握在执行者手里。**

用论文里的数组处理例子把链路说具体一点。Agent 可以提案「跑一次数组处理」；运行时先核对前置条件、参数与顺序约束，允许或阻断该行动。行动结束后，权威义务状态**不会**因为 Agent 说「数组已经写好」而翻转——只有绑定的 validator 确认路径、形状、数据类型与有限值等要求，并把 admissible evidence 提交进账本之后，对应条目才成立。若 validator 返回失败，失败本身也可以被 commit，用来驱动修复提案；失败被记下 ≠ 义务被满足。这正是「提案自主」与「状态权威」拆开后的日常形态：模型仍负责想办法，签字权留在证据链上。

再对照日常编码 Agent：CI 绿了、Agent 说「测试都过了」、PR 描述里写 Done——三者经常被混成同一种「完成」。State Authority Principle 要求你先问：绿勾来自哪家合格 provider？证据版本是否仍 fresh？有没有强制义务还停在 stale / unknown？若答案含糊，完成声明就只是提案，不该自动变成仓库真相。

## SpecHarness 架构：编译义务 → 中介/校验 → 账本 → 失败关闭收尾

图 4 的流水线可以按工程语言读。

**1. 从可见规格编译源链接义务。** 任务提示、适用指南、注入 skill、可观察工作区被切成可寻址源单元，并赋予 disposition：`hard` / `advisory` / `abstain` / `residual`。硬义务进入强制集合：参数须源 grounded、须有授权证据 provider、validator 须按开发协议具备 blocking 资格；否则留作 advisory 引导，或 abstain / residual，不制造独立阻断规则。方向索引用于测量与归因；义务 IR（Γ★）才管辖授权、校验、提交与收尾——二者不必一一对应。

**2. Agent 接口只交提案。** 提案分三类：带参行动、针对已报失败的修复、finalize 请求。Agent 保留原任务上下文、skill 与残余上下文，并收到源链接反馈与 advisory 指导，但**不能**改账本、注入 validator 结果、自行标记义务已满足，或自行授权收尾。

**3. 行动授权与受控执行。** 提案先规范化为规范动作，再匹配相关义务，得到 allow / block / unclear。对闭包审计过的动作表面（closure-audited surface），可走 mediate-and-commit：无 bypass 路径须经授权；对安全隔离通道则走 validate-and-commit（先执行再校验效应）。SkillsBench 上，硬义务约 **44.0%** 落在可中介表面，**56.0%** 走校验后提交；GuideBench 无物理动作闭包面，规则局部决策状态义务 **100%** 用 validate-and-commit（Table 7）。这框定了主张边界：管辖的是 grounded、可观察的强制部分，不是整份自然语言规格。

**4. 效应校验、版本化提交与 freshness。** 受信任观察者产出证据，绑定 validator 返回 passed / failed；仅当证据可信、上下文条件满足且结果明确时，才原子更新账本并记 provenance。Agent 声明、validator 错误、无可接受证据的效应，都不能创建权威状态。满足还要求依赖摘要与当前产物 / 输入 / validator / 环境 / 依赖义务版本一致（fresh）；突变会使受影响条目与依赖变 stale 或 unknown，直到重验。附录 Table 6：在 248 次针对性依赖突变上，去掉 freshness 时过时证据对完成全部仍可接受；完整 SpecHarness 使受影响条目全部失效，经重验恢复 **95.8%**，任务修复后恢复 **95.6%**。

**5. Finalize 失败关闭。** 收尾允许仅当当前证据版本下，所有新鲜的强制义务均已满足。突变后须重验；Agent 可再提案修复，但只有新的 admissible evidence 能重新提交状态。

义务对象本身也值得看一眼结构。论文把 grounded obligation 写成五元组：来源溯源、行动匹配与授权、执行与校验、状态提交与满足、依赖与强制控制。工程上可以翻译成：这条规则从哪来、匹配哪些动作、怎么跑/怎么验、成功失败如何入账、与谁形成依赖、能不能阻断。缺授权 provider 或 validator 不够格 blocking 时，就不要硬塞进 `𝒪_hard`——那会制造虚假安全感。方向（directions）服务测量与轨迹归因；义务 IR 服务授权与收尾。团队若只统计「提示里提过多少要求」，却没有义务账本，测到的仍是上下文覆盖，不是权威状态。

消融（Table 5，固定 GPT-5.6 Sol）进一步说明机制互补：去掉 mediation 主要抬高 U–E；去掉效应校验抬高无支撑接受；去掉 commitment 对 S–A 伤害最大；去掉 blocking 资格看似压低 S–A，却以牺牲 Raw-pass 保留为代价——保守拒收 ≠ 可靠权威。去掉 skill 派生义务也会扩大两个缺口。完整链路要的是行动控制、效应证据、权威接受与选择性阻断一起工作。

## 三种干预范式：事后核验、完成门控、运行时强制

论文图 2 / Table 2 用同一底座（固定 GPT-5.6 Sol）对照四类方法（数字为 SkillsBench 官方 Pass / U–E / S–A）：

| 范式 | 代表（论文评测适配） | Pass | U–E | S–A | 溯源 / 效应校验 / 版本提交 |
| --- | --- | --- | --- | --- | --- |
| 事后核验 | Agentic Rubrics | 74.7 | 12.6 | 23.0 | 部分 / 部分 / 无 |
| 完成门控 | VeriMAP | 79.3 | 9.6 | 20.7 | 部分 / 有 / 无 |
| 运行时强制 | AgentSpec | 78.2 | 8.8 | 24.1 | 有 / 无 / 无 |
| Mediate-and-commit | SpecHarness | **85.1** | **6.3** | **6.9** | 有 / 有 / 有 |

读法要克制：这是论文对既有方法的**适配对照**，不是本站复现实验。有启发的是分工——AgentSpec 类运行时强制更能压 U–E（约束行动），但 S–A 仍可偏高（效应未必被立为权威状态）；VeriMAP 类完成门控更擅长过滤终端声明，却不管辖此前轨迹；事后核验擅长诊断，默认不提交权威任务状态。SpecHarness 把收尾做成**最终 commit**，而不是唯一核验点：源链接义务管覆盖到的执行，fresh 强制义务全满足才签字。

相关工作还点到 VIGIL、FORGE、verify-gated completion、AgentRx 等：它们改进观测、门控或行为合规，但论文主张仍缺一条同时管辖执行与证据授权状态提交的规格权威边界。SpecHarness 显式借用经典 reference monitor、runtime verification 与 transactional commit 原则，贡献点在于：**把异构可见规格编译成源链接义务，并用合格证据管辖版本化状态与收尾。**

## GuideBench：原则延伸到决策状态

SkillsBench 管的是工具使用与产物 / 环境状态。GuideBench 有 **1,042** 道指南约束决策任务；去掉重复规则后得到 **297** 个义务模板、**5,817** 个任务级实例。宏平均上 SpecHarness 相对 Raw：Pass **86.2%→91.3%**，U–E **10.4%→5.0%**，S–A **13.8%→6.9%**（Table 3）。固定 GPT-5.6 Sol 的范式对照（Table 4）里，SpecHarness 同样同时压低两个缺口；SatLM 一类把声明式规则丢给外部求解器，可压 U–E，但若求解输出不作为权威决策状态提交，S–A 仍可更高。

含义对产品很直接：回答「看起来对」不够——可能漏规则、弄错优先级、或依赖无支撑判断。规格权威要落到**规则局部决策状态**是否被合格证据提交，而不只是终端答案像不像。

## 边界：不是银弹，也不是把 NL 规格全硬化

论文自己划线，读的时候别吹过线：

1. **未 grounded / 主观 / 冲突 / 不可验证的要求留 advisory 或 abstain**，继续引导 Agent，但不进硬强制。保证覆盖 grounded 强制义务，不是整份自然语言规格。
2. **Held-out 官方 verifier 不参与义务构造与运行时反馈**；只用于终评 Pass 与事后对齐审计。编译器只吃 Agent 可见材料，开发集选型后冻结，避免「用答案写考题」。
3. **开销真实存在。** 附录 D.3：相对 Raw，SpecHarness 平均约 **1.53×** 任务 Agent token、**1.24×** 条件执行墙钟时间、每任务多约 **0.36** 次任务 Agent 调用；主对比含在线校验 / 反馈 / 修复，不是纯 commit 的零成本。
4. **中介无 bypass 仅对闭包审计表面成立**；隔离通道靠事后效应校验；最终仍靠 fresh 强制义务全满足才 finalize。
5. **SpecHarness 是研究运行时架构**，不是 OpenSpec CLI / stores 的产品名。下面对照站内工具，是叙事互补，不是宣称同源实现。

还有一层常被忽略的边界：主结果把「完整受管辖运行时」与 Raw 对照，因此收益里同时含校验反馈与修复回路；你不能把 +12 pp Pass 直接读成「只加一个 commit 原语就涨这么多」。论文自己也提醒：他们没有在匹配轨迹与算力下单独隔离 commitment。对工程决策，正确读法是——若你愿意为权威边界支付在线校验与修复成本，SkillsBench / GuideBench 报告范围内缺口会缩小；若你只想零成本贴一个 finalize 开关，请不要挪用这些数字。

## 和站内 OpenSpec / SDD / harness 怎么对照

把层位说清楚，避免把「写规格」「跑 Agent」「谁有权签字」混成一件事。

- [OpenSpec 教程](/cn/blog/openspec-tutorial-cli-commands-agents-md-examples/) 与 [OpenSpec 1.5 Stores](/cn/blog/openspec-1-5-stores-beta-update-guide/)：规格如何被编写、变更、以 change / archive 生命周期管理，并进入 Agent 可读上下文。这是 **SDD 工具面**——让规格成为协作真源。
- [Ralph Wiggum loop vs OpenSpec](/cn/blog/ralph-wiggum-loop-vs-open-spec/)：循环策略与规格驱动如何分工；规格写得好，不等于运行时已把完成权从 Agent 手里拿走。
- [SDD 框架对比：BMAD / spec-kit / OpenSpec / PromptX](/cn/blog/-sddbmad-vs-spec-kit-vs-openspec-vs-promptx/)：不同开源路线如何组织规格与工作流；多数仍停在「规格进上下文 / 进流程」，较少显式做证据授权提交。
- [扩张 Harness，而不是堆上下文](/cn/blog/grow-the-harness-not-the-context/)：反复控制沉进代码；SpecHarness 补的是另一旋钮——**权威状态与收尾**。
- [Strands Harness SDK](/cn/blog/strands-harness-sdk-production-agent-runtime/) 与 [ECC Agent Harness 优化](/cn/blog/ecc-agent-harness-optimization/)：生产循环如何存活与优化；可把「义务账本 + fail-closed finalize」看成 harness 上应挂的权威层，而不是再往 prompt 里塞验收散文。

一句话：**OpenSpec / SDD 解决「规格如何被写清、变更与共享」；SpecHarness 解决「规格如何在运行时握笔签字」。** 前者是提案与协作的输入面，后者是提交与收尾的权威面。可以一起用，不要互相冒充。

落地时常见的错配有两种。第一种：规格写得很漂亮（OpenSpec change 齐全、acceptance 条目清楚），但 Agent loop 仍以「模型说 Done + 人眼扫一眼」收尾——规格权威在文档里，不在运行时。第二种：上了很多 hooks / linter / 测试，却没有版本化义务状态与 freshness——检查跑过了，改完代码旧绿勾仍被当成完成证据。SpecHarness 的启发是把这两种错配同时堵住：规格要能编译成可检查义务；检查结果要能以合格证据提交；收尾只看 fresh 强制义务。

若你的团队已经在用 Stores / archive 管理规格演进，下一步不必重写工具链，只要在 Agent 出口加一层「finalize admission」：读义务账本，而不是读模型最后一句话。这与 verify-gated completion 同向，但论文强调核验应围绕源 grounded 义务与状态转移组织，而不是只在终点卡一次。

## 实操清单：在 OpenSpec / SDD 编码 Agent 循环里拆开提案与权威

不必等待一个叫 SpecHarness 的商业产品。团队可以按同一原则改自己的 coding-agent loop。目标不是「把 Agent 绑死」，而是把**签字权**移到可审计的证据链上，让模型继续在提案空间里探索与修复。

最小可行切片可以是：选定一类变更（例如 API schema + 契约测试），把 acceptance 编成 10–30 条硬义务；每条绑定一条命令或校验脚本；PR 机器人只在账本全绿且 fresh 时允许 merge 标签。跑两周后看三件事：无证据完成声明是否下降、真实回归是否下降、校验成本是否可接受。再决定是否扩到更多任务族。

1. **义务编译，而不是只注入全文。** 从 OpenSpec change、acceptance criteria、`SKILL.md`、CI schema 抽出可检查条目；每条绑定源地址（哪份规格、哪一节）。不能自动检查的标明 advisory，不要假装 hard。
2. **证据 provider 白名单。** 测试命令、linter、类型检查、artifact schema 校验、路径/形状检查——谁有资格出证据写清楚；Agent 自述与聊天里的「LGTM」不进白名单。
3. **提案三类标签。** act / repair / finalize 分开；finalize 只读账本，不读模型心情。
4. **能中介的中介，不能中介的校验后提交。** 危险工具调用走授权；文件产物走执行后 validator；两者都要把结果写进版本化义务状态。
5. **Freshness 与依赖。** 改了代码或输入，相关义务变 stale，直到重跑对应检查；禁止用过时绿勾收尾。
6. **Fail-closed finalize。** 任一 fresh 强制义务未满足 → 拒绝完成；返回源链接失败给 Agent 修，而不是人工「差不多了」。
7. **Held-out 验收集不要泄漏进义务编译。** 内部 hidden tests 只做终评，与论文协议同构，避免自我循环。
8. **量开销，别装免费。** 多跑的校验与修复轮次会吃 token 与墙钟；用「拒收无证据完成」换来的质量，要和成本一起记账。
9. **审计轨迹。** 保留义务 ID、证据摘要、commit 事件，便于事后问「谁握笔签的这张完成单」。
10. **先试点任务族。** 选 schema / 测试 / 产物路径清晰的变更类型；主观文案与开放设计先留 advisory，再谈硬化。

若要把清单收成一句口令，可以用：**编译义务 → 白名单证据 → 版本化提交 → 失败关闭收尾。** 口令背后仍是 State Authority Principle；缺任何一环，规格就又退回「给模型看的上下文」。

## 结语：规格升格为外部权威

SpecHarness 把「跟不跟规格」从纯推理或纯核验问题，改写成**状态权威**问题。贡献不是又一个孤立 validator，而是一条 Agent 特有的权威边界：提案、行动与自评不能直接建立规格管辖状态。在 SkillsBench 与 GuideBench 的报告范围内，完整义务–证据–提交架构抬高官方 Pass、压低两个结构缺口，并付出可度量的运行时开销。对已经在用 OpenSpec / SDD 的团队，可迁移的不是论文代号，而是分工——**规格定义可接受什么；外部运行时凭合格证据决定是否提交；Agent 负责提案与修复，不负责最终签字。** 若你下周只改一件事，优先把 finalize 从「模型最后一句」改成「义务账本全绿且 fresh」；其余优化都可以排在这条权威边界之后。

## 参考

1. Haiqing Li, Xin Ma, Yinhao Wu, et al. *Who Holds the Pen? Let Specifications, Not Agents, Sign Off.* arXiv:2609.29921, 2026. https://arxiv.org/abs/2609.29921
2. SkillsBench（论文引用 Li et al. 2026b）. https://arxiv.org/abs/2602.12670
3. GuideBench（Diao et al., ACL 2025）. 见论文参考文献条目。
4. OpenHands（Wang et al. 2025b，论文共享执行底座）. 见 SpecHarness 论文实验设置。
5. 站内相关：[OpenSpec 教程](/cn/blog/openspec-tutorial-cli-commands-agents-md-examples/)、[OpenSpec 1.5](/cn/blog/openspec-1-5-stores-beta-update-guide/)、[Ralph vs OpenSpec](/cn/blog/ralph-wiggum-loop-vs-open-spec/)、[扩张 Harness](/cn/blog/grow-the-harness-not-the-context/)、[Strands](/cn/blog/strands-harness-sdk-production-agent-runtime/)、[ECC Harness](/cn/blog/ecc-agent-harness-optimization/)。
