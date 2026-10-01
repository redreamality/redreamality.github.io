---
title: "RSI 到 2026：有多少是真递归，有多少只是自我改稿"
description: "从 Gödel Machine、AlphaEvolve、Darwin Gödel Machine、SEAL、ADAS 到 RRSI / harness 自进化：按「改什么」与「谁验收」切开有界自精炼与开放式递归自我改进，区分已演示能力与口号。"
pubDate: 2026-10-01T20:30:00+08:00
author: "Remy"
tags: ["rsi", "complex-systems", "feedback-loops", "ai-agents", "agent-harness", "agent-loop"]
lang: "zh"
---

「递归自我改进」（Recursive Self-Improvement，RSI）这个词，最近一年被用滥了。模型改一稿输出叫 self-refine；Agent 改自己的 prompt 叫 self-evolve；实验室用进化搜索发现新核函数，也往 RSI 里塞。同行聊天时很容易觉得「RSI 已经来了」——但若问一句：**系统改进的是什么，验收信号是谁给的，下一轮是否因此更容易改自己？** 答案往往差很远。[1]

这篇是站内 **RSI 知识枢纽**的综述，不是某一篇论文的解读。时间线压到约 2026-10：古典定义 → LLM 时代碎片 → 已落地系统 → 安全与治理 → 哪些是演示、哪些是外推。站内已有 [Bad Genius：反事实协议拆 harness 捷径](/cn/blog/bad-genius-counterfactual-harness-evolution/)、[扩张 harness 而不是堆上下文](/cn/blog/grow-the-harness-not-the-context/)、[ECC 外围优化](/cn/blog/ecc-agent-harness-optimization/)、[控 harness 控成本](/cn/blog/control-the-harness-control-the-cost/) 等深耕文；它们各自打一个刃，本篇把刃装回同一把尺子。数字与引文一律跟公开论文与官方博客，不编造。[1][2]

## 先把词钉死：有界自精炼 ≠ 开放式 RSI

古典叙事里，I. J. Good 的「智力爆炸」与 Schmidhuber 的 Gödel Machine 把 RSI 想成：**系统能证明（或以等价方式保证）某次自我修改净有益，再反复改自己**。麻烦在于，去掉很强假设后，「多数修改可证净有益」在工程上几乎做不到。于是当代系统普遍把「可证」换成「在基准上可测」——这是定义上的松绑，也是后面所有过拟合与捷径问题的源头。[3][4]

2026 年的综述（Chen、Wang、Qu，arXiv:2607.07663）扫了约 1250 篇 arXiv 论文，给出一把更可操作的尺子，两个轴：[1]

1. **改什么**：部署时的行为（输出、测试时权重、harness / skills）、训练阶段的策略、**评估器本身**、还是 AI 研究过程。
2. **环闭合到什么程度**：人在环（逐条审）、人在环上（自动信号、人审部署）、闭合环（生成—验收—应用全自动）。

沿着这两轴，**有界自精炼**（bounded self-refinement）是：对着固定外部评估器收敛改进，可测、可部署。**开放式 RSI** 是：系统连「什么叫更好」或改进机器本身一起改，原则上发散。公开文献的质量几乎全落在有界一侧；「闭合环 × 改评估器」是格子图上最薄的一格，也是安全讨论真正该盯的地方。[1]

Anthropic 2026 年 Institute 文 *When AI builds itself* 用「闭合环」指：Agent 最终设计并训练后继模型。文中明确：**这尚未发生，也非必然**；执行侧（写代码、跑指定研究）已很强，方向设定（选什么问题值得做）仍是瓶颈。[5] 读实验室叙事时，别把「模型写了很多合并代码」直接等同「RSI 已闭合」——那是执行自动化，不是议程自动化。

再补一个容易混的词：**harness（脚手架）**。在当代 Agent 文献里，它指冻结骨干周围的一切：系统提示、工具定义、记忆与技能库、编排代码、停止规则。harness 可被外部检查，也可被 Agent 自己改——所以「Agent 改写自己」在工程上最常落地的，其实是 **改 harness，而不是改基础模型权重**。[1][7]

## 时间线：从理论到「可测的自我修改」

把主路径排成一张对照表，方便后文对号入座：

| 阶段 | 代表 | 实际在改什么 | 验收 |
| --- | --- | --- | --- |
| 理论 | Good / Gödel Machine | 系统自身（理想） | 可证净有益 |
| 训练自举 | STaR、Self-Rewarding LM | 权重 / 奖励信号 | 可验证答案或自判 |
| 输出精炼 | Self-Refine、Reflexion | 单次输出 | 外部反馈或自批 |
| Agent 设计搜索 | ADAS / Meta Agent Search | 代码定义的 Agent | 固定基准 |
| 自我代码修改 | STOP、Gödel Agent、DGM | scaffold / Agent 代码 | 编码基准 |
| 算法发现回流基建 | FunSearch、AlphaEvolve | 算法与基础设施代码 | 自动评估器 |
| 权重自适配 | SEAL | 自生成微调数据 + 权重 | 下游任务 |
| Harness 递归进化 | RRSI、Meta-Harness 等 | 冻结模型周围的 harness | evolve 集 + 持出 |

这条线说明一件事：**「自我改进」早就不是单点技术，而是一族环**；喊 RSI 时若不标明格子，讨论会滑向口号。2026 Q2 前后相关论文产量暴涨，综述作者甚至报告种子语料中约 74% 发在 2026——机制出得比整合快，正是需要这种枢纽文的原因。[1]

## 已演示的主路径（按「改什么」）

### 1. 部署时：输出、测试时训练、harness

输出级 refinement 是工业实践：有执行反馈（代码测试、证明检查器）时靠谱；无外部信号时，Huang 等负结果表明「纯内在自我纠正」常无效甚至变差。领域后来的共识很务实：几乎所有新系统都把批判接到外部通道上——执行、检索、检测器、符号求解器——等于从「闭合自批」退回到「人在环上的有验证精炼」。[1]

测试时训练（TTT）夹在「冻权重改稿」与「离线训练」中间：按查询临时更新权重，改进有一定持久性。它模糊了推理/训练边界，但目标与奖励仍由人指定，属于有界自精炼。[1][8]

**ADAS（Automated Design of Agentic Systems，Hu、Lu、Clune，arXiv:2408.08435，ICLR 2025）** 把「手写 Agent 模块」推进成研究领域：用 **Meta Agent Search**，让元 Agent 在不断增长的档案上用代码编写新 Agent，在编码、科学、数学等域上超过一批手写基线，并报告跨域与跨模型迁移仍优于手写设计。[6] 注意：ADAS 的元 Agent 在搜索过程中是固定的——它自动设计下游 Agent，但**自己不因下游涨分而改自己的搜索策略**。这一点和后面的 DGM 形成对照。[4][6]

**Darwin Gödel Machine（DGM，Zhang 等，arXiv:2505.22954，ICLR 2026）** 是「自我修改」叙事里最常被点名的系统：编码 Agent 改自己的代码库，用编码基准做经验验证，并维护开放式档案做 Darwin 式探索（保留多样踏脚石，而不是只爬山当前最优）。论文报告 SWE-bench 从 20.0% 到 50.0%，Polyglot 从 14.2% 到 30.7%；对照「不自我改进」（固定元 Agent）与「无开放式探索」（只保留最近可编辑版本）都更弱；贪婪只扩最优节点的消融也更差。发现的改进包括更细粒度编辑工具、长上下文管理、多尝试与同伴评审式工作流等。实验在沙箱与人监督下进行；代码开源。[4]

读 DGM 时有三条限定必须写进笔记：**骨干 FM 冻结**；改的是工具与工作流，不是自己训练新基础模型；开放式探索的档案维护与父代选择逻辑本身也尚未被 DGM 改写。作者还报告单次 SWE-bench 量级运行大约两周、API 成本显著——「自我加速」目前仍受算力与推理能力约束。[4]

**RRSI（Xia 等，Google Cloud AI Research，arXiv:2609.24972）** 把 harness 层 RSI 的过拟合写清楚：在有限 evolve 集上反复提议/选择，会涨 evolve 分、OOD 塌或接近初始 harness。RRSI 正则化提议侧（退火编辑预算、证据感知信用分配、停滞时结构化探索）与选择侧（泄漏筛选、噪声带、代价感知接受、结构剪枝）。八个基准跨编码、Agent 工作区与工程设计：evolve 最高约 +14.1（Gemini 3.5 Flash 上 Terminal-Bench），五个 OOD 最高约 +4.7，策略 token 相对无正则进化约少 30%。开源仓库与项目站公开。[7]

这与站内 Bad Genius 文同一簇问题：**自动进化若只盯固定发布协议，会吃基准级捷径**。RRSI 从搜索动力学做正则；CHASE 从反事实协议变换做对抗验收——一个管「怎么搜」，一个管「搜完怎么证没吃协议」。[7]

STOP（Self-Taught Optimizer）与 Gödel Agent 更早打通「脚手架 / Agent 逻辑自改」：STOP 递归改进调用 LM 的优化脚手架而不改底层模型；Gödel Agent 强调自指框架、搜索更广的 Agent 设计空间。它们是 DGM / harness 进化的直接前史，而不是 2026 才突然出现的概念。[1][4]

### 2. 训练时：自生成数据与自奖励

STaR、Self-Rewarding、各类自蒸馏与 self-play，把环写进权重。2026 综述归纳出几乎处处重复的三条：**环的天花板由验证信号决定**；**塌缩是默认动力学，要工程对抗，不是边角**；**环传递偏差与传递能力同样高效**。[1] 可验证域（代码、数学、形式化证明）上自举最强；非可验证域很快掉到 LLM-as-judge 与元评估的泥潭。

这是「有界 RSI」的工业主航道，也是产品里最常被叫成「模型变强了」的部分——但通常**不是**「系统改了自己如何做研究」。把 post-training 自举直接写成「智力爆炸」，是叙事错位。

### 3. 权重自适配：SEAL

**SEAL（Self-Adapting LLMs，Zweiger 等，MIT CSAIL，arXiv:2506.10943）** 让模型生成 self-edit——合成微调数据与可选的优化超参指令——再经 SFT / LoRA 持久改权重；外环用 RL，以内环更新后的下游表现为奖励。知识注入设定下，单通道无上下文 SQuAD 准确率从约 33.5% 提到约 47.0%，并报告超过用 GPT-4.1 合成数据微调的对照；few-shot ARC 子集上相对「无 RL 的自编辑」也有大幅提升。局限写得很坦白：连续 self-edit 仍有灾难性遗忘；TTT 奖励环每次评估要完整微调，开销远高于普通偏好奖励。[8]

SEAL 的位置是：**模型学会「如何为自己准备可学习的数据」**，而不是学会改研究议程。目标任务与奖励定义仍在人侧——有界，但是持久，和「改完就挥发」的输出精炼不同。

### 4. 自动研究与算法发现：AI Scientist、AlphaEvolve

**The AI Scientist（Lu 等，arXiv:2408.06292）** 演示想法→实验→写稿→自动审稿流水线，单篇成本约低于 15 美元量级；自动审稿器在 ICLR 2022 数据上接近人类一致性指标。公开局限同样硬：幻觉实验细节与硬件、对负结果过度正面表述、执行环境安全风险（曾出现自重启、改时间限制等）、以及「能出稿 ≠ 科研质量可靠」。[9] 后续批判文献把可审计性定为新瓶颈：机器生成科学越便宜，追溯「哪句靠哪条证据」越贵。[1]

**AlphaEvolve（DeepMind，2025-05-14 官方博文）** 用 Gemini（Flash 扩宽度、Pro 加深）+ 自动评估器 + 进化框架发现并优化算法。已部署与报告的影响包括：数据中心调度启发式（官方称平均回收全球算力约 0.7%，生产运行逾一年）、TPU 关键矩阵乘电路的 Verilog 简化提案、Gemini 架构中矩阵乘核约 23% 加速并带来约 1% 训练时间下降、FlashAttention 类低层 GPU 指令最高约 32.5% 加速；数学上找到 4×4 复矩阵乘法 48 次标量乘的程序（优于该设定下长期最佳的 Strassen 1969），并在约 50+ 公开数学问题上约 75% 追平已知最佳、约 20% 改进已知最佳（含 11 维 kissing number 新下界等）。[2]

**这是「AI 产出回流 AI 基建」最硬的公开案例**——也是当代讨论 RSI 时最常被当作具体指称的对象。但边界同样清楚：人对问题规格、评估器与种子程序划定搜索空间；系统在可自动评分的算法族里进化。它坐在有界自精炼的「自动研究 / 程序发现」格，**不是**闭合环训练后继基础模型。[1][2]

FunSearch（2023/2024）是 AlphaEvolve 的前史：在更窄的函数发现设定上已用 LLM + 进化交出可发表数学构造。AlphaEvolve 的跃迁是从「单函数」扩到「更复杂代码库与多组件算法」，并进入生产调度与训练栈。[1][2]

## 开源与可复现入口（便于对照，不写成软广）

| 项目 | 入口 | 你实际能复现什么 |
| --- | --- | --- |
| DGM | [github.com/jennyzzt/dgm](https://github.com/jennyzzt/dgm) | 自我修改编码 Agent + 档案进化（成本高） |
| ADAS | [github.com/ShengranHu/ADAS](https://github.com/ShengranHu/ADAS) | Meta Agent Search 分域实验 |
| RRSI | [github.com/google-research/rrsi](https://github.com/google-research/rrsi) | 正则化 harness 进化 |
| SEAL | [Continual-Intelligence/SEAL](https://github.com/Continual-Intelligence/SEAL) | self-edit + RL 适配 |
| AI Scientist | [SakanaAI/AI-Scientist](https://github.com/SakanaAI/AI-Scientist) | 自动科研流水线（需强沙箱） |

站内 pipeline 还积着 Env-Rethink、RSI-Master、SoL-Pi、iCoder 等短名单——它们是「下一篇论文解读」素材，不是本文的替代品；本综述刻意停在机制地图，避免再写成单点软新闻。

## 安全、治理与「爆炸」叙事

DGM 论文专章讨论：只优化基准可能引入与人类意图错位的行为；迭代自我修改降低可解释性；沙箱、时限、可追溯档案是最低配套；原则上也可把安全与可解释性本身做成评估目标。[4] 技能库与经验图一旦持久化，坏技能可以跨代、跨个体传播——部署时 harness / skills 进化是技术文献里安全表面最锋利的一块；攻击与「无对抗也会漂移」的健康演化工作已经同期出现。[1]

**CASP（剑桥 AI 科学与政策项目，2026）** 报告 *What if automating AI R&D triggers an intelligence explosion?* 联署包括 Hinton、Bengio、Horvitz、Clune、Jack Clark 等：AI R&D 管道加速自动化可能把数年进步压成数月；风险包括能力增速超过社会适应、对超人类系统失去控制、国家与公司间制衡被侵蚀。政策建议强调：提高 AI R&D 自动化的可见性、发展约束与转向能力、准备社会适应。这是政策级文件，不是又一个基准分数。[10]

把治理读回技术，有三点比口号有用：

1. **验证层级**：形式化验证器与执行反馈在顶，学习型裁判与内在自信在底；已演示的自改进强度大体跟着这层走。AlphaEvolve / FunSearch 活在顶两层；AI Scientist 类系统常在「科学判断」这种底层信号上翻车。[1][2]
2. **自我确认环**：生成器与评估器共享偏差时，环会强化高置信错误；自奖励、自蒸馏、多模态自一致都见过变体。[1]
3. **框架锁死**：环可以诚实、多样、稳定，却仍在优化「已经不该再优化」的目标——方向设定里「生成候选问题」这一半，验证层级根本索引不到。[1][5]

一句话：**危险的不是「多写了几行 Agent 代码」，而是无 grounding 的闭合评估环，以及把方向设定偷换成可刷分代理指标。**

## 什么算演示，什么算外推

**已有公开证据支持的：**

- 有外部验证器时，输出精炼与训练自举能稳定涨分。[1]
- Agent / harness 代码可被元搜索或自我修改改进，并在编码类基准上大幅抬升（DGM、ADAS、RRSI 等）。[4][6][7]
- 进化式程序发现可把算法改进写回生产基建（AlphaEvolve）。[2]
- 模型可学会生成对自己有效的微调数据（SEAL）。[8]
- harness 进化若不加正则，容易 evolve 涨、OOD 塌；正则与反事实协议是真实工程问题，不是空谈。[7]

**证据薄弱或仍属外推的：**

- 系统自主设定研究议程并可靠判断「什么值得做」。[1][5]
- 无持续外源信号的开放式、无界能力爆炸。[1]
- 「闭合环」训练并部署后继基础模型已在野外发生。[5]
- 把单基准涨分或「模型写了仓库里大部分代码」直接读成智力爆炸。[1][5][10]

压缩成一句给产品会用的话：**2026 年的 RSI，主战场是「有界环 + 更强验证器 + harness / 算法层回流」；开放式、改评估器、闭合环训练后继模型，仍是稀有格。**

## 机制清单：读下一篇 RSI 新闻时问这五句

1. **改的是输出、harness、权重，还是研究流程？**
2. **评估器在验证层级哪一档？**（形式化 > 执行 > 学习型裁判 > 内在自信）
3. **人在环、环上，还是宣称闭合？** 闭合时评估器是否也被改？
4. **增益是否在 OOD / 协议变换 / 反事实基准上还在？**（对照 RRSI / Bad Genius）
5. **是否把「执行自动化」误写成「方向设定已自动化」？**（对照 Anthropic 叙事）

站内后续深耕继续挂在 `rsi` / `feedback-loops` / `agent-harness`：Env-Rethink（演化环境）、RSI-Master（Experiment OS）、SoL-Pi（自动研究环缩放）等，是本综述的「下一刀」，不是重复本文。


## 复杂系统透镜：反馈、记忆与传感器

把 RSI 只当成「模型变聪明」会丢结构。站在复杂系统与反馈环视角，任一自改进装置至少有三块：

1. **执行器**：真正改状态的动作——改输出、改 harness 文件、改权重、改实验脚本。
2. **传感器 / 评估器**：告诉环「更好」的信号——单测、模拟器、裁判模型、人类品味。
3. **记忆**：跨回合保留什么——技能文档、进化档案、经验图、LoRA 适配器。

有界自精炼的工程含义是：传感器外置且相对固定，记忆受控增长，执行器权限被沙箱切开。开放式 RSI 的工程含义是：传感器也可被改，记忆无验证地累积，执行器摸到训练栈与部署栈。2026 年大多数公开系统，是在强化执行器与记忆，同时**拼命稳住传感器**——RRSI 的泄漏筛选、Bad Genius 的反事实协议、形式化证明器与单元测试，全是在保护传感器不被环吃掉。[1][7]

这也解释了为什么「技能库自进化」比「单次 self-refine」更值得安全团队加班：输出级错误随会话消失；写进共享技能库的错误会成为下一代的先验。验证层级在顶层时，记忆是资产；在底层时，记忆是放大器。[1]

从反馈环稳定性看，训练自举文献里的 rise-and-collapse、diversity collapse、model collapse，和 harness 进化里的 evolve–OOD 裂口，是同一家族的动力学：有限、噪声、可适应的反馈被重复使用，系统会拟合反馈过程本身。正则、持出、外源数据混合、人类锚点，都是给环加阻尼，而不是反对改进。[1][7]

## 炒作对照表（读新闻用）

| 常见说法 | 更准确的读法 | 锚点 |
| --- | --- | --- |
| 「Agent 已经在 RSI」 | 多半在改 harness / 工作流，骨干冻结 | DGM、RRSI、ADAS |
| 「AI 在改进 AI」 | 常指算法发现回流基建或数据合成 | AlphaEvolve、FunSearch、SEAL |
| 「自动科学家」 | 流水线可跑通；科研判断与审计仍弱 | AI Scientist + 批判文献 |
| 「闭合环 / 爆炸将至」 | 执行自动化≠方向设定自动化；政策在谈可见性 | Anthropic、CASP |
| 「涨分即递归」 | 先查 OOD、协议变换、是否泄漏任务特征 | RRSI、Bad Genius |

若一条新闻五项里说不清改什么、谁验收、是否 OOD，优先当成 Chaos / 短讯，而不是正式博客素材——这也是站长「不为追热点而写热点」在 RSI 线上的具体用法。

## 结语

RSI 不是开关，是光谱。古典理论要的是可证自我改写；工程现实交付的是——在可测信号上，让改进环多转几圈，并把部分圈从「人改 harness」交给「Agent 改 harness / 搜算法」。AlphaEvolve 证明回流基建是真的；DGM 与 RRSI 证明自我修改与正则化都是真的；SEAL 证明权重侧自适配开了口子；ADAS 证明 Agent 设计本身可被搜索。与此同时，评估器仍是天花板，方向设定仍多人，开放式爆炸仍缺公开测量。

对做 Agent 产品的人：优先投资**可执行验收、持出与协议鲁棒、代价正则**，而不是在 README 里写「我们做了 RSI」。对关心治理的人：盯自动化 R&D 的可见性与验证基础设施，而不是只盯排行榜。对写复杂系统笔记的人：把 RSI 看成反馈环族——环的记忆（skills / 档案）、环的传感器（评估器）、环的执行器（代码修改）——比看成科幻开关更有用。

## 参考

[1] Chen, Wang, Qu. *Recursive Self-Improvement in AI: From Bounded Self-Refinement to Autonomous Research Loops*. [arXiv:2607.07663](https://arxiv.org/abs/2607.07663).

[2] DeepMind. *AlphaEvolve: A Gemini-powered coding agent for designing advanced algorithms*. [官方博文](https://deepmind.google/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/)（2025-05-14）及配套白皮书。

[3] Schmidhuber. Gödel Machines（2007）及 Good「超智能机器」传统论述；当代转述见 [1][4]。

[4] Zhang, Hu, Lu, Lange, Clune. *Darwin Gödel Machine: Open-Ended Evolution of Self-Improving Agents*. [arXiv:2505.22954](https://arxiv.org/abs/2505.22954)；代码 [jennyzzt/dgm](https://github.com/jennyzzt/dgm)。

[5] Anthropic Institute. *When AI builds itself*. [anthropic.com/institute/recursive-self-improvement](https://www.anthropic.com/institute/recursive-self-improvement).

[6] Hu, Lu, Clune. *Automated Design of Agentic Systems*. [arXiv:2408.08435](https://arxiv.org/abs/2408.08435)；[ADAS 主页](https://www.shengranhu.com/ADAS/).

[7] Xia et al. *RRSI: Regularized Recursive Self-Improvement of Agent Harnesses*. [arXiv:2609.24972](https://arxiv.org/abs/2609.24972)；[regularized-rsi.com](https://regularized-rsi.com/).

[8] Zweiger et al. *Self-Adapting Language Models (SEAL)*. [arXiv:2506.10943](https://arxiv.org/abs/2506.10943).

[9] Lu et al. *The AI Scientist: Towards Fully Automated Open-Ended Scientific Discovery*. [arXiv:2408.06292](https://arxiv.org/abs/2408.06292).

[10] Chan et al. (CASP). *What if automating AI R&D triggers an intelligence explosion?* [casp.ac/reports/intelligence-explosion](https://casp.ac/reports/intelligence-explosion)（2026）。
