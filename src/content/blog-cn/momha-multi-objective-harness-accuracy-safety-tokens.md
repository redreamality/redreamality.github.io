---
title: "MoMHa：准确率、安全、token 一起优化 harness"
description: "解读 Adobe Research arXiv:2609.30967 MoMHa：把 LLM harness 当准确率、行为安全、token 三目标搜索面；单阶段联合奖励相对十个基线与两阶段消融领先（合成轨关节均值 0.482、真实轨 0.461、U-SafeBench 0.781，较两阶段每例少 95 token）。"
pubDate: 2026-10-02T10:40:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "developer-tools"]
lang: "zh"
---

一个 harness 答对了题，却对不安全请求来者不拒；或者答案没错，但每个例子烧掉别人十倍的 token——按「准确率」它都算赢，按部署现实它都不算好 harness。Adobe Research 的 Subhojyoti Mukherjee 与 Md Mehrab Tanjim 在 [arXiv:2609.30967](https://arxiv.org/abs/2609.30967)（*[MoMHa: Multi-Objective Optimization of LLM Harnesses over Accuracy, Safety, and Tokens](https://arxiv.org/html/2609.30967)*，预印本标注 2026-09-25）把这句话写成评测口径：围绕模型的 Python 代码——拼 prompt、路由调用、解析输出、编排多轮——本身是一等公民设计面，质量天然是多目标的。[1]

系统名叫 **Meta-Harness**；头条方法叫 **MoMHa**（Multi-Objective Meta-Harness 语境下的联合搜索配置）：用一个有完整文件系统权限的 agentic proposer（Claude Code）在一次搜索里同时看见准确率、行为安全与 token，并用联合奖励排序候选。相对「先准确率再压 token」的两阶段消融、只给标量反馈、以及只优化准确率的基线，联合搜索在合成轨与真实轨都领先；U-SafeBench 行为安全复合分到 **0.781**，相对两阶段每例少 **95** token。作者写明将开源 harness 代码、评测基建与跨模型日志——本稿写作时未见公开仓库 URL，下文一律写「作者计划开源」。[1]

站内已经从几条线碰过 harness：[Control the Harness, Control the Cost](/cn/blog/control-the-harness-control-the-cost/) 谈路由与账单归因；[Bad Genius](/cn/blog/bad-genius-counterfactual-harness-evolution/) 谈反事实进化；[ECC](/cn/blog/ecc-agent-harness-optimization/) 谈外围操作系统；[Coding Agents 的成本低效行为](/cn/blog/coding-agents-cost-inefficient-behaviors/) 谈浪费从哪来。MoMHa 补的是另一块：**搜索目标本身别再压成单一标量**——准确率赢家不等于可上线的 harness。技能加载侧若你还在纠结「先披露什么」，可对照 [Progressive Disclosure](/cn/blog/progressive-disclosure-agent-skills/)；那是上下文预算，本文管的是选定策略之后怎么搜、用什么反馈。[2]

## Harness 不是权重，标量准确率也不够

下游任务表现不只取决于模型权重。论文把 harness 写成一个 Python 类：包装 LLM client，对每个例子调用 `run(self, example: dict) -> dict`，内部可以发一次或多次模型请求，返回至少含 `"prediction"` 的字典；构造函数签名固定为 `__init__(self, client, config=None)`。搜索集 \(\mathcal{D}_{\mathrm{search}}\) 每域约 50 例对 proposer 可见；测试集另 50 例对 proposer 隐藏，只做终评。形式目标是在合法 harness 空间 \(\mathcal{H}\) 里最大化搜索集上的域内奖励均值——但奖励不再只是「对不对」。[1]

这和「改权重 / 只改 prompt 文案」不是同一层。APE（Zhou et al., 2023）、OPRO（Yang et al., 2024）、DSPy（Khattab et al., 2024）、MIPROv2、TextGrad、GEPA 一类工作大多在**固定 harness 骨架**里调 prompt、演示或自然语言梯度，控制流本身不动：路由几跳、要不要校验、fix loop 封不封顶，都不在搜索空间里。另一路如 Lee 等人的 **MH**（2026）已经用搜索整段改写 Python harness，但目标仍是准确率；AutoHarness（**AH**，Lou et al., 2026）也出完整 Python，同样是单目标、无安全信号、无 Pareto 池。MoMHa 的主张是：一旦你承认部署要同时看安全与成本，**搜索空间与反馈轴都要一起扩**——否则你在优化一个事后必须再手工砍的标量。[1]

「好 harness」的反例论文写得很直白：正确作答却从不拒绝不安全请求；或正确作答却比对手多烧一个数量级 token。真实部署本来就在三维里取舍。先前自动 prompt 优化与 DSPy 式程序综合已经证明：对交互模式做程序化搜索能稳定抬准确率；但它们几乎一律把反馈压成标量，安全与 token 轴基本缺席。MoMHa 不是否定那条线，而是说：**把同一套「可执行程序搜索」接到三轴目标上，结果会变。**[1]

和站内叙事对齐时可以记一句：控成本文讲的是「默认配置在烧钱」；成本低效行为文讲的是「轨迹里哪些动作贵」；Bad Genius 讲的是「用反事实信号进化 harness」。MoMHa 讲的是「进化 / 搜索时目标函数长什么样」——目标错了，搜得再勤也只是在标量准确率盆地里打转。

## Meta-Harness：propose → evaluate → log

**Meta-Harness** 跑的是迭代的 propose-evaluate-log 循环（论文 Algorithm 1）。每轮 proposer 检查文件系统、诊断失败、写出新的 harness 候选；evaluator 在搜索集上跑，记下逐例分数与执行轨迹；logger 把产物落成可 `grep` / `cat` 的文件。每域大约 **∼100** 次 harness 评测（预算分解见论文 §4.1）。[1]

### Proposer 看见什么

Proposer 是带文件系统权限的 Claude Code，能看到四类东西：(a) 历史候选源码 `domains/<d>/harnesses/candidate_*.py`；(b) 每轮产物——`scores.json`（逐例分数）、`traces.jsonl`（执行轨迹）、`meta.json`（模型 / 父候选 / 时间戳）、`summary.md`；(c) 搜索集 `data/search_set.jsonl`；(d) CLI：`list` / `top` / `pareto` / `diff` / `show`。论文报告 proposer 每轮中位数读约 **82** 个文件——它不是「看一个总分再猜下一版 prompt」，而是对着源码 diff、失败轨迹与分轴分数做结构化改写。搜索比纯 prompt 优化更吃 proposer API（后者每个候选往往只调一次 proposer），但附录 N.1 显示总 token 成本与 APE 同量级，且低于 2-phase 与 DSPy，不是离群烧钱。[1]

提示不是一整坨。每轮由三块拼起来：

1. **基础 skill**（联合搜索时再挂上 `proposer_token_skill.md`）；
2. **按域 skill**（`proposer_<domain>.md`）：策略库（draft-verify、subject-aware routing、verification cascades）、答案归一化配方、MH 跑出来的常见失败模式；
3. **按域 safety skill**（`safety_<domain>.md`）：按风险档位（strict / minimal / light）给 import 白名单与输出格式约束。

基础设施跨十七个域复用，变动主要落在不足 **500** 行的按域文件上；拿掉第 3 块就是消融里的 **MoMHa-ns**。按域 skill 的工程含义很实际：冷启动时少做「从轨迹重发现域习惯」的轮次，proposer 不用每换一个任务就从零猜 SQL 该不该裁 DDL、事实验证该不该双路校验。[1]

### Evaluator 与 Logger

Evaluator 按域换奖励函数，避免「一个 exact match 打天下」：

| 域类型 | 奖励口径（论文设定） |
| --- | --- |
| 文本分类 / MCQ | 标签或选项字母精确匹配 |
| 数学推理 | 精确匹配 + 数值归一化 |
| Agentic coding | 语法有效 + 测例执行 |
| 事实验证 | stance 标签精确匹配 |
| NER | 实体级 F1（含类型） |
| SQL 生成 | 查询执行 + 结果比对 |
| 用户特定安全（U-SafeBench 衍生） | \(0.5\times\)拒答不安全 \(+0.5\times\)合规帮助 |

安全域用对称 LLM-as-judge：响应标成 refuse / comply / partial（半分）。对称设计卡的是「全拒答刷分」——只拒不帮拿不到高分；这和「安全 = 永远说不」不是一回事。Logger 则保证每次评测都留下机器可读产物，供下一轮 proposer 当文件系统上下文，而不是口头总结。[1]

### 可执行代码搜索的三层闸（机制层）

因为 proposer 产出可执行 Python，安全是搜索栈本身的一等公民，而不是评测事后补丁。论文写了三层（§3.3）：

- **Layer 1：AST-Guard**——执行前把代码解析成 AST，按域风险参数化禁符号：危险 import、`exec` / `eval` / `compile` / `__import__` / `open` 等调用；名单随域收紧或放宽。
- **Layer 2：按域 safety skill**——白名单与输出约束；消融显示它是安全轴上最大杠杆之一。
- **Layer 3：沙箱**——单次调用超时（文中示例 30 秒级）、资源与权限限制。

机制层面记住「静态闸 + 域 skill + 运行时沙箱」分工即可。本文只谈评测与架构分工，**不**提供任何绕过、注入或利用步骤；工程上请按自己的威胁模型收紧，而不是把论文禁列表当安全证明。[1]

## MoMHa：单阶段联合奖励，为什么赢过两阶段

多目标搜索用 agentic proposer 时，「自然」做法是分阶段：先在安全约束下抠准确率，再在准确率大致固定后压 token。论文把这条路实现成 **2-phase**，当作最强消融。头条配置 **MoMHa** 则在**同一阶段**同时暴露三轴，并用标量化效用做搜索排序：

\[
R(h)=\mathrm{accuracy}(h)+\lambda_{s}\,\mathrm{safety}(h)-\lambda_{t}\,\mathrm{tokens}(h)
\]

其中 \(\lambda_s=1.0\)，\(\lambda_t\) 归一化成「少 **1k** token ≈ 准确率 **1** 个百分点」。真正关键的设计点是：proposer **并不**被压成只看标量 \(R\)——它读 `scores.json` 里的 `accuracy` / `safety_score` / `tokens_used` 与完整轨迹，**只有候选排序**被标量化。于是它能看见一次改写动了哪一轴，并偏好「用一次置信门控校验换掉两次冗余 draft-verify」这类结构级取舍，而不是在同一骨架上把 system prompt 缩短几个词。[1]

### Token 优化是涌现的，不是第二阶段任务

基础 skill 要求 proposer 在同一轮里完成三步诊断：(a) 从 `tokens_used` 揪出吃掉 80% 预算的那 20% 例子；(b) 顺着 `traces.jsonl` 定位多调用流水线里的主消耗——系统提示、CoT 补全、校验轮，还是 fix loop；(c) 做针对性结构改写：置信超过阈值就跳过校验、SQL 只留相关表的 DDL、fix loop 在首次改进后封顶、事实验证上用单次置信门控裁决代替双路 draft-verify。这些动作与准确率、安全反馈发生在**同一轮迭代**，因此能长出两阶段系统表达不了的结构：Phase 1 一旦把「双路 draft-verify」冻进源码，Phase 2 往往只能在既定骨架上抠字数，很难再发明「单次置信门控校验」。论文把这称为 joint formulation 相对 staged optimization 的核心优势。[1]

### 消融：联合、轨迹、safety skill 各自贡献什么

数字上，MoMHa 在全部 **15** 个变体里拿到最高三维超体积 \(\mathrm{HV}=0.481\)；准确率-only 的 MH 是 \(0.362\)，一旦把安全与效率加进轴，MH 对独特 Pareto 体积的贡献掉到零——单目标搜出来的「准」点，在三维里并不额外占体积。相对 2-phase，MoMHa 整体高约 **+2.7** 分，每例少 **95** token；十域里有 **7** 个按联合指标 \(J\) 赢过两阶段。平均准确率复合约 **0.611** vs 两阶段 **0.584**。[1]

把逐例轨迹换成标量分（**MoMHa-scalar**），整体均值从 **0.611** 掉到 **0.604**，安全从 **0.781** 到 **0.754**——掉幅不大，但方向稳定：proposer 确实在从轨迹抽因果信号（哪次调用失败、哪段校验多余），而不只是刷总分。拿掉按域 safety skill（**MoMHa-ns**），安全从 **0.781** 掉到 **0.716**，能力准确率几乎不动——安全 skill 主要推安全轴，而不是靠牺牲能力换分。十个外部基线在 U-SafeBench 复合上**全部低于 0.75**。相对 MH：联合均值从 **0.305** 到 **0.482**（**+0.177**），行为安全从 **0.569** 到 **0.781**（**+21.2** 个百分点）——这就是「从准确率-only harness 改写走到显式多目标」的增量。[1]

直觉上记三句就够：**联合 > 两阶段**，因为结构还没冻；**轨迹 > 纯标量**，因为能定位哪次调用；**safety skill 不可省**，因为能力分看不出来的缺口会在行为安全复合上现形。

## 数字：合成轨、真实轨、安全、token

评测跨 **十七个域**。合成轨（主评，论文也称十域列）：七个能力套件——文本分类、数学推理、agentic coding、MCQ、事实验证、NER、SQL——加三个 U-SafeBench 衍生用户特定安全域（非法活动问答、自主物理伤害、自主精神伤害）；每个能力域 100 条 LLM 生成例子（第二模型校验），50/50 划搜索与测试。真实轨（泛化检查）七个公开基准：HumanEval、MBPP、Spider、FEVER、MMLU-Pro、LawBench、NuminaMath。模型侧是 **12** 个模型、**四**个家族（Claude / GPT / Gemini / DeepSeek）与多档能力（论文 Table 1：从 Haiku / Flash-Lite 到 Opus / GPT-5.x 等）；搜索在 **Claude Haiku 4.5** 上发现 harness，再**不改源码**迁到全舰队终评。[1]

相对十个基线（CoT、APE、OPRO、DSPy、MIPROv2、TextGrad、GEPA、Rand，以及准确率-only 的 MH、AH 等），头条结果可以压成一张对照表（联合均值 \(J\)，摘要与 §1 / Key findings / §4）：[1]

| 轨道 / 指标 | MoMHa | 对照 |
| --- | --- | --- |
| 合成轨联合均值 \(J\) | **0.482** | 十基线 **0.198–0.422**；最近 TextGrad **0.422**（差距 +0.060） |
| 合成轨分域列 | 赢 **7/10** | — |
| 真实轨联合均值 \(J\) | **0.461** | 最强基线 DSPy **0.377**（+0.084）；整体约 **0.084–0.377** |
| 真实轨分域列 | 赢 **5/7** | **零**额外搜索成本迁到未见基准 |
| U-SafeBench 行为安全复合 | **0.781** | MH **0.569**（+21.2pp）；外部最近 TextGrad **0.747**；无一外部 ≥0.75 |
| 相对 MH 的联合均值 | **0.482** | MH **0.305**（+0.177） |
| 能力准确率均值（七技能域） | **0.539** | MH **0.478**（+6.1pp）；DSPy 原始准确率 **0.542** 但每例 **2229** token，MoMHa **672** |
| 相对两阶段 | +2.7 整体分 | 每例少 **95** token |
| 三维超体积 HV | **0.481** | MH **0.362**（独特 Pareto 体积贡献归零） |

读表时建议盯 \(J\)，不要只盯原始准确率。DSPy 在能力准确率上可以略高（0.542 vs 0.539），但每例 token 是 MoMHa 的三倍以上，联合分反而落后——这正是「标量准确率赢家 ≠ 多目标赢家」的现场例子。合成轨上 MoMHa 相对 TextGrad 约 **+6.0**；真实轨相对 DSPy 约 **+7.9**（论文 Key findings 口径）。真实轨「零额外搜索」很重要：harness 策略是在合成能力域上搜出来的，迁到 LawBench / NuminaMath / HumanEval 等公开基准时不再对目标基准重搜——这测的是策略迁移，不是「在每个公开集上再做一百轮」。[1]

### 跨模型：8/12 能迁，4/12 告诉你例外长什么样

在 Haiku 级 proposer-evaluator 环上发现的策略，**12** 个目标模型里有 **8** 个无需重训即可迁移；剩下 4 个分裂得很干净：GPT-5-mini、o4-mini、DeepSeek-R1 更吃 DSPy 那种更短的 prompt——这些型号内部已经会长 CoT，外加一层厚 harness token 不划算；GPT-5.4 走向 GEPA。尽管有例外，MoMHa 的跨模型联合均值 \(J=0.434\) 仍领先所有基线，且准确率排序在 Anthropic / OpenAI / Google / DeepSeek 家族间大体稳定。论文 Limitations 也点明：迁移在推理偏重型号上会降级，因为长内部 CoT「不太听」harness 指令时，外层 token 优化空间变窄。产品含义是：跨模型验收要当成一等公民测，并把「短 prompt 基线局部反超」登记成已知失败模式，而不是当作搜索坏了。[1]


### 联合指标 \(J\) 与超体积怎么读

论文用联合指标 \(J\) 汇总三轴，用三维超体积 HV 看 Pareto 前沿占了多少体积。HV 高，不代表每一轴都单独第一，而代表在准确率–安全–效率空间里，前沿覆盖得更「厚」。MH 的 HV \(0.362\) 且独特体积归零，意思是：你若只按准确率搜出的点，一旦把另外两轴打开，它们并不贡献新的不可支配区域——别人用更省 token 或更安全的结构就能盖住。MoMHa 的 HV \(0.481\) 是 15 个变体里最高，和「7/10、5/7 分域列领先」是同一故事的不同切片：一个看前沿几何，一个看表上有多少列你排第一。[1]

分域赢面也值得单独读。合成轨不是「平均分高就行」：十列里赢七列，说明优势分布在多数域，而不是靠一两个域拉均值。真实轨赢五列、零额外搜索，说明迁移不是偶发的单点幸运。反过来，那三列没赢、以及跨模型四格输给 DSPy/GEPA 的地方，论文也没有假装不存在——产品上正好用来建「何时别硬上厚 harness」的决策表。[1]

## 生产里能抄什么（清单，不是复现实验）

如果你不打算原样搭一套 Meta-Harness，仍然可以从机制里带走几条可落地的设计习惯——和站内 [成本低效行为](/cn/blog/coding-agents-cost-inefficient-behaviors/)、[控 harness 控成本](/cn/blog/control-the-harness-control-the-cost/)、[ECC](/cn/blog/ecc-agent-harness-optimization/) 是同一类「外围代码决定账单与风险」叙事：[2]

1. **把安全与 token 写进搜索 / 回归目标，而不是上线后再加 guardrail。** MoMHa-ns 说明：能力分可以几乎不动，安全分却掉一截；事后补丁往往补不回搜索阶段没见过的结构取舍。
2. **给优化器（人或 agent）看分轴分数 + 逐例轨迹，而不只是一个总分。** MoMHa-scalar 的掉分不大，但方向稳定：因果信号在轨迹里——哪次校验、哪段 schema、哪轮 fix loop。
3. **警惕「先准再省」的两阶段默认。** Phase 1 冻住的双路校验、冗长 schema、无界 fix loop，Phase 2 很难拆掉；联合搜索才能在同轮里长出置信门控单次校验这类结构。若组织流程强制分阶段，至少保留「允许改控制流」的回退窗口，而不是只允许改文案。
4. **按域 skill 与 safety skill 分开维护。** 论文用「不足 500 行按域文件」换十七域复用；冷启动时少做「从轨迹重发现域习惯」的轮次。这和 [Progressive Disclosure](/cn/blog/progressive-disclosure-agent-skills/) 的「按需加载」互补：一个管加载预算，一个管域知识与安全约束如何进入搜索提示。[3]
5. **跨模型迁移当一等公民测，不当惊喜。** 在小模型环上搜、大舰队上验是合理默认；但对内部 CoT 已经很长的推理型号，要预期短 prompt 基线可能局部反超。
6. **可执行 harness 搜索必须自带静态闸 + 沙箱。** AST-Guard / 白名单 / 超时是搜索基建，不是可选装饰；细节以论文 §3.3 为准，按自己的威胁模型收紧。
7. **看联合指标与超体积，不要只看排行榜第一的准确率。** DSPy 的 0.542 准确率 vs MoMHa 的 0.539，若没有 token 列，你会得出错误的「DSPy 更好」；有了 \(J\) 与每例 token，结论反过来。

和 [Bad Genius](/cn/blog/bad-genius-counterfactual-harness-evolution/) 对照时：Bad Genius 强调反事实信号如何驱动进化；MoMHa 强调进化时的目标与反馈协议。两者互补——你可以在联合奖励下做反事实提案，也可以在标量准确率下做反事实，但后者更容易重新掉进「准但不安全 / 准但烧钱」。[2]

## 边界：论文没声称什么

合成搜索集是 LLM 生成、每域 50 例；真实轨七个公开基准上的迁移已经补了一截外部效度，但不要把合成轨 \(J\) 直接读成「任意生产任务上的绝对水平」。每域 ∼100 次 proposer API 调用是真实预算；附录称总成本可比 APE、低于 2-phase 与 DSPy，仍需按自己的单价换算。迁移在 GPT-5-mini / o4-mini / DeepSeek-R1 一类推理偏重型号上会降级。安全数字来自 U-SafeBench 衍生的用户特定域与论文定义的行为安全复合（拒答 × 帮助对称），**不是**通用红队、漏洞利用或内容安全全覆盖评测；本文只谈机制与评测口径。作者计划开源 harness 源码、搜索日志、逐例轨迹、打分产物与跨模型评测 JSON；以 arXiv 文本为准，仓库上线以作者后续公告为准。[1]

邻近工作上，MoMHa 相对 MH 是显式多目标扩展；相对 prompt 优化器是**改控制流而不只改文案**；相对站内 harness / 成本系列是「目标函数与反馈粒度」这一层。论文未来工作提到 SWE-Bench / LiveCodeBench、更丰富目标（延迟、校准、金钱成本）、proposer 集成、以及生产流量上的在线精炼——那些都不在本稿数字里，不外推。[1]

## 小结

MoMHa 要证明的不是又一个「准确率涨了几个点」的 prompt 技巧，而是：**harness 一旦被当成可搜索的程序，目标函数就必须承认部署是三维的。** 单阶段联合奖励之所以压过两阶段，不是因为标量公式更炫，而是因为它让 proposer 在结构尚未冻结时，就能用轨迹同时看见「哪次调用既贵又不安全、哪次校验可以门控掉」。合成轨 \(J=0.482\)、真实轨 \(0.461\)、安全复合 \(0.781\)、较两阶段每例少 95 token、HV \(0.481\)——这些数字要一起读；拆开任何一轴，都会重新掉回「准确但不可用」或「准确但烧钱」的假赢家。[1]

若你正在维护自家 agent 的外围代码，下一件可做的事未必是换更大模型，而是：把评测面板改成准确率 / 安全 / token 三列，让每一次 harness 改写都能回答「动了哪一轴、值不值」。联合搜索的工程直觉，往往比再堆一轮准确率排行榜更值钱。

再落一层更具体的操作：下一周的回归里，给现有 harness 补三列日志——每例准确率、安全判定（或代理指标）、token；对最贵的 20% 例子做一次轨迹抽样，标出主消耗是系统提示、校验轮还是 fix loop。你未必立刻上 Claude Code 当 proposer，但已经在用 MoMHa 同一套「分轴可见、结构可改」的诊断顺序。等真要上搜索时，优先保证反馈里有轨迹、目标里有安全与 token，而不是先追求 proposer 模型有多大。

## 参考

[1] Subhojyoti Mukherjee, Md Mehrab Tanjim. *MoMHa: Multi-Objective Optimization of LLM Harnesses over Accuracy, Safety, and Tokens*. arXiv:2609.30967, 2026. [abs](https://arxiv.org/abs/2609.30967) · [HTML](https://arxiv.org/html/2609.30967)

[2] 站内对照：[Control the Harness, Control the Cost](/cn/blog/control-the-harness-control-the-cost/)、[Coding Agents 的成本低效行为](/cn/blog/coding-agents-cost-inefficient-behaviors/)、[ECC](/cn/blog/ecc-agent-harness-optimization/)、[Bad Genius](/cn/blog/bad-genius-counterfactual-harness-evolution/)

[3] [Progressive Disclosure：Agent Skills 渐进披露](/cn/blog/progressive-disclosure-agent-skills/)
