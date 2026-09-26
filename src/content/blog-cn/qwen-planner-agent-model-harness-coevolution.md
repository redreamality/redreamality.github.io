---
title: "Qwen-Planner-Agent：闭环 AI-for-AI 里的 Planner + Harness 共演化"
description: "解读 arXiv:2609.29892 Qwen-Planner-Agent：人闸数据飞轮、CARE 混合环境在线 RL、Model–Harness 共演化；核对 MobilePA-Bench Overall 77.05 与 CARE −32.5% 输出 token，并对照站内 Jev-Mobile 与 Growing Harness。"
pubDate: 2026-09-26T00:00:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "mobile", "reinforcement-learning", "qwen"]
lang: "zh"
---

移动规划 Agent 同时踩两条约束：任务要跨 App、跨会话、能恢复失败，长程可靠才算完成；真机交互又贵、又难并行，开发与评测都扩不起来。阿里 MAI Team / Token Hub 在 [arXiv:2609.29892](https://arxiv.org/abs/2609.29892) 里提出的 **Qwen-Planner-Agent**，把这条张力当成闭环试验场——用执行反馈驱动数据生产、训练策略与运行时编排，而不是只把更大模型塞进手机任务。[1]

论文自称探索的是 **AI-for-AI**：AI 既是被开发的对象，也参与下一轮系统的建造。落到工程上，是三条相互咬合的阶段——**(i) AI for Data** 人闸数据飞轮；**(ii) AI for Training** 规划冷启动 + 混合环境在线 agentic RL，并提出 **CARE**（Competence-Aware Reward-and-Advantage Engineering）；**(iii) AI for Harness** 运行时编排 Memory / Skills / Tools，失败轨迹回流，通向 **Model–Harness 共演化**。在 MobilePA-Bench 上，Qwen-Planner-Agent 27B 取得评测表中最高 Overall **77.05**，估计输出成本（含 thinking）约 **$2.41 / 1000 tasks**。[1]

站内昨天刚写过 [Jev-Mobile](/cn/blog/jev-mobile-system-one-gui-executor/)：低频 VLM 定局部目标，高频 typed 执行器在现树候选上连选动作——那是 GUI 执行层的切片。更早还有 [扩张 Harness 而不是堆上下文](/cn/blog/grow-the-harness-not-the-context/)、[Claude Code Agent Harness](/cn/blog/inside-claude-code-agent-harness/)、[ECC harness 优化](/cn/blog/ecc-agent-harness-optimization/)、[SpecHarness](/cn/blog/specharness-spec-holds-the-pen/) 等文，谈的是控制如何沉进代码、运行时如何活下来。本篇换到另一层：**完整的 Planner + Harness 生产栈**，以及「模型参数固定服务、离线审阅后改 Harness」这条共演化路径。数字只核论文 Table 1、CARE 训练动态与共演化表；边界也按作者写法保留——他们自称这是发展路径，不是已实现的完全自主共演化。[1]

## 为什么移动规划适合讲「执行反馈驱动开发」

手机上的高阶目标很少是单步工具调用。用户说「帮我订好行程并设置监控」，Agent 要在多个应用间协调动作、状态变化时保持上下文、失败后恢复，并验证结果真的达成。论文把这类任务写成：环境状态不完全暴露给策略，Harness 用历史、检索到的 Memory、加载的 Skills 拼出上下文，策略在当前结构化动作集上选动作；任务特定验证器用交互历史与执行证据判完成。[1]

难点不只在「会不会规划」，而在**开发可扩展性**。真机会话成本高、并行难、重置麻烦；若每条训练轨迹都走真机，数据飞轮转不动。反过来，任务特定验证又提供了机会：执行轨迹与可观测结果，本身就是评估进度、定位缺口、指导下一步改什么的证据。于是移动规划成了合适的试验场——既考验长程可靠，又逼着你用混合环境与反馈闭环把开发做大。[1]

这和「再堆一点上下文 / 再换一个更大闭源模型」不是同一条路。堆上下文解决的是单次请求里模型看见什么；换模型解决的是参数能力上限。Qwen-Planner-Agent 问的是：执行经验如何同时改动**数据该采什么、RL 该奖励什么、运行时该暴露什么 Skills/Memory**。三条改动落在同一套 action–feedback–verification 契约上，才叫闭环，而不是三个独立项目拼贴。[1]

## 三阶段框架：Data → Training → Harness，中间用开发集而不是终评集

文字上可以把生命周期压成一张图：

1. **AI for Data。** 任务构造 Agent 把能力目标翻成可执行任务规格（用户目标、可用资源、初始条件、目标能力、完成标准），不规定唯一参考轨迹。自动化 rollout 在混合后端上收集轨迹；成功与失败都保留——失败要能看清分叉点、有没有尝试恢复、为何未完成。策展把验证通过与「适不适合进训练集」分开；低置信、冲突、安全敏感案例走人审。训练与开发集反馈再驱动：已掌握任务降采样、不稳定行为加重、缺口能力构造新任务。每一轮数据发布前有人闸。[1]

2. **AI for Training。** 先用策展轨迹做规划向冷启动（SFT，并对轨迹策展里标错的 turn 做 loss mask），再在混合环境里做在线 agentic RL。冷启动学的是分解、排序、工具使用、状态条件重规划与恢复；在线 RL 补的是演示覆盖不到、随策略变化出现的交互分布。CARE 在这一阶段按组成功率切换奖励重点，并校准 advantage，避免成功饱和后效率差被放大成主信号。[1]

3. **AI for Harness。** 服务时把 Planner Model 接到统一 Harness：Scenario Adapter 按当前暴露的工具装配 Skills；Persistent Memory 跨会话存取证据；Executor 执行动作并回传结构化反馈。模型参数在服务期固定；部署轨迹与开发集反馈离线诊断后，分别回流到数据侧与 Harness 指令配置 \(\eta\) 的修订。修订要版本化、受规则检查；低置信与发布关键决策仍人审。[1]

中间评测刻意用**留出开发集**，不用最终 MobilePA-Bench 测试集。开发任务与轨迹不直接进训练；它们的评测结果与失败模式，只用来指导下一轮任务生成、采样调整与 Harness 修订。这是共演化实验里「evolve set」的同构设计——没有独立开发反馈，Harness 修订就会偷看终评。[1]

## 混合环境：沙箱、LLM 模拟、真机各干一件事

数据与在线 RL 都依赖可扩展交互。论文把三类后端接到同一套 agent 面向接口：

- **程序化沙箱**：对结构化应用库做类型化工具调用，转移确定、可重置、可用状态验证——适合高吞吐、可复现任务；覆盖受限于已实现工具与转移。
- **LLM 模拟环境**：为难以写死逻辑的长尾交互生成响应，扩覆盖；但可能与先验动作/状态不一致，轨迹要用任务特定校验再进训练。
- **真机会话**：捕获权限、鉴权服务、跨 App 依赖与运行时变化；成本高、并行难，只对「完成依赖真实设备/服务行为」的任务优先使用。[1]

策略是：可复现状态变化走沙箱，长尾走模拟，真机按优先级补。后端内部状态可以不同，但暴露兼容的任务、动作、观测与验证记录，才能进同一策展与 rollout 管线。训练层与环境管理层分离：一边调度分布式 rollout 与参数更新，一边创建/清理环境实例——模型算力与环境容量可以独立扩。[1]

对工程团队，这比「全真机」或「全模拟」更贴近生产：你要的是**可核的完成证据**与**可扩的采样量**同时成立，而不是某一个后端在宣传材料里看起来更真。

## CARE：按组成功率切换 progress / outcome / efficiency

固定奖励设计很难同时服务三种组：成功稀疏的组需要进度信号；成败参半的组需要巩固完成；成功已饱和的组才该盯执行效率。标准组内归一化还有副作用——成功饱和后，微小效率差会被拉到与成败混合组相近的 advantage 尺度，效率优化可能压过「先做对」。[1]

CARE 的做法可以分成两层。

**奖励调度。** 对每个任务采一组 \(G\) 条轨迹，用组成功率 \(\bar{s}\) 选制度：低成功走 progress shaping（成功指示 + 验证进度）；中间区间只巩固 outcome（成功指示）；高成功再叠效率惩罚。阈值与权重由有界的 LLM 控制器，按训练统计与开发集反馈周期性配置，但可选制度本身是预定义的——AI 配参，不是让模型现场发明奖励公式。[1]

**质量保持的 advantage 校准。** 在效率精炼制度里，对归一化分母加成功导出的地板 \(\sigma_{\mathrm{anchor}}=\sqrt{p_{\mathrm{high}}(1-p_{\mathrm{high}})}\)，限制小效率差被放大。论文用极限情形说明：全成功组里，标准归一化会把效率系数几乎消掉，advantage 仍接近单位尺度；地板保留了效率权重的依赖，同时压住过压缩轨迹的诱惑。[1]

训练动态（同一 27B 基线设定）：**完整 CARE 与 Vanilla RL 准确度相当，最终绘制步上输出 token −32.5%**；去掉 advantage 校准后输出更短，但准确度明显更低、平台期更差。这正好对应「短不等于好」——没有校准的效率信号会鼓励过度压缩。[1]

可复用直觉：**先用组能力决定「现在该学做对还是学省」；再用 advantage 地板防止「已经做对之后，省一点点被当成主课」。** 这和 Growing Harness 的 success-first 闸门同构——成本下降不能补偿质量回退。[2]

## Harness：服务期改上下文，不改 \(\theta\)；离线才改 \(\eta\)

部署不是终点，而是可执行证据的持续来源。工具清单、操作规则、用户信息、交互历史都会变——全写进参数要反复重训，全塞进 prompt 又长又吵。Harness 夹在 Planner 与环境之间，承担两件时间尺度不同的事：

**在线。** 请求到来时装配活跃上下文：对话历史、当前暴露的工具规格、Scenario Adapter 给出的程序性指导、Persistent Memory 检索到的证据、运行时约束。Planner 产出结构化动作；Executor 作用到应用/设备并回传工具结果、可观测状态或错误。Skill 描述「资源该怎么用」；Memory 提供「已经知道或发生过什么」。Memory 按功能分（用户模型、情节、长期巩固、前瞻意图），检索结果当证据进上下文，不自动获得调工具或改外部状态的权限。[1]

**离线。** 每条部署轨迹保留工具/Skill 配置、Memory 出处、动作与参数、Executor 响应、状态证据、错误与验证结果。诊断拆成两侧：**模型侧**——分解错、路由错、参数接地错、状态跟踪错、恢复错、过早收工；**Harness 侧**——Skill 缺失或冲突、工具暴露不当、检索错、陈旧 Memory、反馈格式不完整。模型侧回流任务构造与数据修复；Harness 侧生成对 \(\eta\)（指令配置）的候选修订。候选不自动上线服务。[1]

共演化公式在论文里写得很清楚：一轮在固定 \(\eta^{(k)}\) 下用 RL 更新 \(\theta\)，再用同一 \(\eta\) 在 evolve/开发集上取反馈，LLM 编辑器据此修订 \(\eta^{(k+1)}\)，下一轮训练在新上下文分布上继续。Harness 改的不只是当次执行，还有后续模型学习所见的经验分布——这是「共演化」比「外挂一个更好的 prompt」更重的地方。[1]

隐私与权限单独成节：用户私有记忆与可共享经验分离；共享前降低用户特定细节；访问控制、可检查/可删除/可撤回。读产品时不要跳过——能写 Memory 的 Agent，默认扩大的是数据面。[1]

## MobilePA-Bench：只核 Table 1 与成本口径

MobilePA-Bench 含 1700+ 可执行任务、200+ 移动工具、13 个查询–任务域；从受控初态起步，用工具调用、终态变化或 Agent 行为验证完成。Qwen-Planner-Model 指训练后的规划器（无部署 Harness）；Qwen-Planner-Agent 指加 Harness 的完整系统。[1]

Table 1 关键行（Overall 与分项，百分制）：

| 系统 | Overall | Tool Use | Memory | Skills | Sub-agent |
| --- | ---: | ---: | ---: | ---: | ---: |
| GPT-6 Astra | 76.84 | 75.71 | 74.73 | 93.25 | 53.93 |
| Claude Opus 5 | 75.71 | 77.60 | 71.81 | 83.00 | 59.55 |
| **Qwen-Planner-Agent 27B** | **77.05** | **77.79** | **74.76** | **86.25** | **59.55** |
| Qwen-Planner-Model 27B | 71.90 | 72.79 | 70.74 | 79.25 | 55.06 |
| Qwen Baseline 27B | 67.22 | 68.37 | 67.82 | 73.75 | 47.19 |
| Qwen-Planner-Agent 35B-A3B | 69.91 | 71.25 | 67.02 | 78.00 | 52.81 |
| Qwen-Planner-Model 35B-A3B | 64.79 | 66.15 | 61.17 | 71.00 | 52.81 |
| Qwen Baseline 35B-A3B | 54.90 | 64.04 | 44.41 | 47.50 | 44.94 |

同 backbone 的阶梯很清楚：**27B Baseline 67.22 → Planner-Model 71.90 → Agent(+Harness) 77.05**；**35B-A3B Baseline 54.90 → Model 64.79 → Agent 69.91**。固定 27B checkpoint 时，Harness 单独贡献 Overall +5.15pp（71.90→77.05），Skills 从 79.25 到 86.25 的跳变尤其明显。评测表中 Agent 27B Overall 第一，略高于 GPT-6 Astra 76.84 与 Claude Opus 5 75.71；Sub-agent 与 Claude Opus 5 并列 59.55，Skills 仍低于 Astra 的 93.25——读「全面领先」时要按分项留余地。[1]

成本：图中估计输出成本（含 thinking token）约 **$2.41 / 1000 tasks**，对照其他模型约 **$3.06–$67.76**。口径是均输出 token × 输出单价，**不含**输入 token、外部工具、设备执行与额外 Harness 处理。传播时写清「仅输出侧估算」，避免被读成端到端账单。[1]

长历史（Table 3）：无 Harness 时 BEAM 随历史变长明显掉；加 Harness 后匹配的 Qwen 对在 BEAM-500K/1M/10M 上全面抬升。例如 **27B Planner：BEAM-10M 21.99→67.24**（Agent 带 Memory Harness）。短历史基准上变化不大、个别对还有小幅回退——收益集中在「相关证据超出活跃上下文」的设定，而不是万能加分。[1]

共演化（Table 2，另一 27B 基线 checkpoint）：MobilePA-Internal Overall **82.67→88.50（+5.83pp，4 轮）**；MCPMark **38.00→46.98（+8.98pp，3 轮）**。对比「Model+Harness」静态配置（Internal 84.23 / MCPMark 42.26），多轮交替训练与修订仍有额外增益。evolve 集反馈只用于改 Harness，任务与轨迹不进训练——和主文开发集纪律一致。[1]


## 轨迹长什么样：Memory、Skill 前置、工具替换与子 Agent

定量表之外，论文用六条定性轨迹说明 Planner 与 Harness 怎么分工。它们不是新分数，但能把「结构化工具 + 证据进上下文」钉成可想象的产品行为。[1]

1. **Memory 与现场状态对账。** 行程里已有深圳与广州，深圳监控已在跑——Agent 只补广州监控，不重写已有记录与阈值。记住的意图必须和当前应用状态一起决定动作，否则就会重复劳动。
2. **从已验证执行状态续跑。** 投屏场景里，历史已记录无线会话仍活跃；即便界面回了一句误导性成功，仍先停旧会话、等空闲，再开卧室投屏并保留无线模式。状态以工具确认为准，不以口头确认为准。
3. **Skill 把依赖变成关机前的硬前置。** 紧急关机请求还要求先存便签：加载 note / power / 冲突仲裁 Skills 后，先拿到已存便签的持久标识，再发关机。程序性指导在这里不是「建议」，而是执行前置条件。
4. **按观测分支并守住顺序。** 耳机处于通透模式时，先开勿扰、等成功返回，再切降噪——条件请求被翻成「是否需要」与「何时可发」两层决策。
5. **工具失败后替换路径。** 单位换算工具连吃两次拒绝后，用计算器按标准系数算 154.32 磅，再发给历史里的教练联系人。计划的数据依赖保住了，工作流可以继续。
6. **子 Agent 交接等结果、传产物。** 等 WhatsApp 会话回报三个下载完成，再启 File Manager，并把文件名与目标文件夹一并写入第二条指令。跨应用依赖落在完成结果上，而不是两条提示的书写顺序。[1]

这些例子共同支持一句工程话：**Harness 负责把正确的证据与规程放进上下文；Planner 负责在结构化动作集上做可验证的下一步。** 缺一侧，失败账就会糊成「模型胡说」。

## 规划能力有没有「只卷手机」

Table 4 把 Planner-Model（无部署 Harness）和同尺寸 Qwen 基线对照到一批非移动 agentic 基准（Claw-Eval、BFCL-v4、MCP-Atlas、Tau-3、Toolathlon、SWE-Multilingual、SWE-Pro）以及 MMLU-Redux / C-Eval / IFEval。35B-A3B 与 27B 分别在七个 agentic 基准里的六个与五个上超过基线；通用能力平均分接近，略有小幅回落。论文据此主张：训练菜谱强化的是可迁移的规划与工具使用，而不是用手机专用过拟合换分——读法保持克制：增益并不均匀，也不是「通用能力零代价」。[1]

对站内读者，这一点决定选题是否值得进正式博客：若分数只在 MobilePA 上好看、一出域就塌，那就更像基准特化；若非移动工具与编码基准也抬、通用能力大体保住，才支撑「Planner 栈」而不是「手机刷分脚本」。

## 对照 Jev-Mobile：执行器切片 vs Planner+Harness 全栈

[Jev-Mobile](/cn/blog/jev-mobile-system-one-gui-executor/) 解决的是 Android GUI 环上的成本与可观测性：VLM 低频定局部目标，typed decision 在**当前**可访问性树候选上连选，DONE/BLOCKED 显式交还；成功轨迹相对逐步 VLM 端到端时间 −32.7%、模型 API 成本 −73.4%，全量成功率 79% 贴近 SeeAct-V。[3]

和本文并读时，层位不要混：

| | Jev-Mobile | Qwen-Planner-Agent |
| --- | --- | --- |
| 主问题 | 逐步 VLM grounding 贵、动作难类型化 | 长程规划可靠 + 真机开发不可扩 |
| 模型角色 | 通用 VLM 做委派；Jev 做执行选择 | 训练出的 Planner 做分解/工具/恢复 |
| 动作接口 | 现树候选上的 typed 选择（偏 GUI） | 结构化工具为主（可回传视觉观测） |
| Harness 含义 | 委派状态机 + 候选生成 + 事件账本 | Skills + Persistent Memory + Executor + \(\eta\) 修订 |
| 学习环 | 第一版明确不要求新训练 | 冷启动 + CARE 在线 RL + 共演化轮次 |
| 代表数字 | AndroidWorld 成功轨迹效率 | MobilePA-Bench 77.05；CARE −32.5% token |

一句话：**Jev-Mobile 是 typed 执行器切片；Qwen-Planner-Agent 是 Planner+Harness 生产栈与共演化叙事。** 前者回答「这一屏怎么点得省」；后者回答「规划能力、运行时上下文、训练数据如何用同一套执行证据一起迭代」。两者可以互补——生产系统里完全可能是「外层 Planner+Harness 定跨 App 计划，内层 typed GUI 执行器 consummate 触控」；论文本身没有做这个拼装实验，站内对照只负责把层位钉清。[1][3]

## 对照 Growing Harness / ECC / Strands：都在长控制，对象不同

[Growing Harness](/cn/blog/grow-the-harness-not-the-context/) 的主张是：反复出现的控制决策应沉成可执行代码，上下文留给任务特有证据；失败窗口、函数级轨迹、success-first 闸门回滚。[2] [ECC](/cn/blog/ecc-agent-harness-optimization/) 与公开 skill/harness 产品线，更多谈可移植 `SKILL.md`、钩子与跨运行时分发。[Claude Code harness](/cn/blog/inside-claude-code-agent-harness/) 谈的是生产循环存活：压缩、流式、权限、恢复。[SpecHarness](/cn/blog/specharness-spec-holds-the-pen/) 则把规格当控制笔。

Qwen-Planner-Agent 的 Harness 优化对象，主要是**可编辑指令配置 \(\eta\)** 与 Memory/Skills 装配策略，而不是从无策略脚手架长出整段控制器源码。共演化实验里，模型与 Harness 交替更新；Growing Harness 则常固定模型、增长程序。同向的地方是：控制不应无限挤占语义带宽；失败要能归因；接受更新要有版本与闸门。不同的地方是：本文同时训练 Planner，并用 CARE 在 RL 里做能力感知的效率；Growing Harness 把「这次电话本来就不该打」沉进代码。[1][2]

相关工作节也点了 AutoHarness、Meta-Harness、Natural-Language Agent Harnesses、MemoHarness 等——作者强调自己的区分点是 **Harness 修订与模型学习的耦合**：改 \(\eta\) 会改变下一轮策略训练所见的经验分布。读站内系列时，用「优化面是代码 / 指令 / 规格 / 记忆策略」分类，比用「又一个 harness 论文」分类更清楚。[1]

## 可复用清单（以及论文自己划的边界）

若你在做移动或长程工具 Agent，可抄的不是「27B 这个分数」，而是机制纪律：

1. **人闸数据飞轮。** AI 构造任务、收轨迹、提采样调整；发布前人类批准数据集与采样配置。没有闸门的合成数据，只会放大策展错误。
2. **混合环境分层。** 可复现走沙箱，长尾走模拟，真机按保真需求点射；统一 agent 面向记录，不假设模拟与真机反馈同可靠。
3. **Competence-aware 奖励。** 按组成功率切换 progress / outcome / efficiency；效率制度加 advantage 地板。准确度持平再谈 −32.5% 这类 token 收益。
4. **失败归因分模型侧 / Harness 侧。** 分解与接地错进数据与训练；Skill/Memory/暴露错进 \(\eta\) 与检索策略。混成一个「模型不行」无法共演化。
5. **共演化要有 evolve set 与版本门。** 开发/evolve 任务不进训练；服务期 \(\theta\) 固定；离线修订版本化；发布关键与冲突案例人审。
6. **长历史用 Memory Harness，而不是只加窗口。** BEAM-10M 一类数字说明：相关证据超出上下文时，检索+巩固比硬截断更有用；短历史上不要期待同样涨幅。
7. **成本数字写清口径。** 论文 $2.41/1000 tasks 是输出侧（含 thinking）估算；端到端还要加输入、工具、设备与 Harness 自身。

边界按作者结论写死：他们把机制表述为**通向 model–Harness 共演化的发展路径**，并明确**不声称**已建立持续自主共演化；未来工作仍包括减少数据精炼、训练适配与 Harness 更新中的人工干预，同时在安全关键决策点保留人审。[1] 站内 [Agents of Chaos](/cn/blog/agents-of-chaos-ai-agent-failures/) 已经收过「能改运行时的 Agent」失败面——把 \(\eta\) 或 Memory 策略交给 LLM 编辑器时，沙箱、权限与回滚不是附录，是前提。

## 收束

Qwen-Planner-Agent 值得写长文，不是因为又一个「开源追上闭源」标题，而是因为它把三件常被拆开做的事接进同一闭环：**数据飞轮听训练反馈、CARE 按能力调 RL 信号、Harness 用失败轨迹与模型交替修订**。MobilePA-Bench 上 Agent 27B Overall 77.05、同 backbone 阶梯与 CARE −32.5% token，提供了可核的系统级证据；对照 Jev-Mobile，则提醒移动 Agent 至少有两层——typed 执行器管「点得省」，Planner+Harness 管「规划与运行时一起长」。

若你只带走一句：移动规划的瓶颈往往不在单次推理是否聪明，而在**执行证据有没有正式的回流管道**——回流到该采的数据、该调的奖励、该改的 Skills/Memory，而不是只回流到下一轮更长的 prompt。

## 参考

[1] MAI Team, Alibaba Token Hub. *Qwen-Planner-Agent: A Closed-Loop AI-for-AI Framework for Real-World Mobile Planner Agents*. arXiv:2609.29892, 2026. https://arxiv.org/abs/2609.29892

[2] Growing Harness（站内解读）：[/cn/blog/grow-the-harness-not-the-context/](/cn/blog/grow-the-harness-not-the-context/)；原文 arXiv:2609.26760。

[3] Jev-Mobile（站内解读）：[/cn/blog/jev-mobile-system-one-gui-executor/](/cn/blog/jev-mobile-system-one-gui-executor/)；原文 arXiv:2609.30186。
