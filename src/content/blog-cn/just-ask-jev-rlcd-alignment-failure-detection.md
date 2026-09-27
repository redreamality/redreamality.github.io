---
title: "Just Ask Jev：用 RLCD 做对齐失败的零样本检测"
description: "解读 arXiv:2609.29429 RLCDAlignBench：把 TypeSafe Jev（RLCD）推到 10 类对齐失败×44 基准，通用问句中位 AUROC 0.886，相对 LLM-judge 约便宜 63×；对照站内 rubric 评委文，给出 harness 监控接线清单。"
pubDate: 2026-09-27T16:40:00+08:00
author: "Remy"
tags: ["jev", "ai-agents", "agent-harness", "LLM", "evaluation"]
lang: "zh"
---
对齐监控有个尴尬的账单结构：你要在**每一条**输入、输出或轨迹上查好几类失败——谄媚（sycophancy）、越狱遵从、欺骗、提示注入、幻觉、隐私泄露、社会偏见、奖励黑客、隐瞒不确定性、权力寻求——而常见做法仍是「再开一轮生成式 LLM-as-judge」。判一条准则烧一次解码；准则一多，成本按准则数线性涨。Llama Guard 一类读 token 概率的分类器也没完全逃掉这个形状：它们给出 \(P(\text{unsafe})\) 之类分数，但一次调用通常仍盯一个固定标签；要从多个角度问，就得多次调用。[1]

TypeSafe 的 Jev 走的是另一条接口：对同一份 `state` 挂一组有类型的问题（Noul 是否 / Choice 多选 / Score 有序档），一次调用返回多道校准概率，不生成自然语言判决文。训练目标叫 **RLCD**（Reinforcement Learning for Calibrated Decisions，为校准决策做强化学习）——论文脚注特意提醒：别和 Yang 等人同缩写的 contrastive distillation 那条线混了。[1][2] 「校准」在这里的操作性定义很朴素：在被赋予概率 \(p\) 的那批决策里，正确比例应接近 \(p\)。[1]

站内已经写过它接到 [Claude Code](/cn/blog/jev-claude-code-10x-and-25-lines/)（判断离开自回归热路径）、当 [rubric 评委](/cn/blog/jev-rubric-judges-cheaper-faster-correlated-errors/)（便宜快但相关错误卡住 cascade）、以及 [JevOut 短上下文翻转](/cn/blog/jevout-natural-context-flips-decision-models/) 的脆点。本篇换到 **alignment failure detection**：能不能「Just Ask Jev」——不问生成式评委，直接问决策模型——在零样本下把失败排到非失败之上？Griffith / NTU / UNSW 等作者的 [arXiv:2609.29429](https://arxiv.org/abs/2609.29429) 与开源基准 [RLCDAlignBench](https://github.com/sumleo/RLCDAlignBench) 给出了可核数字与可离线重算的缓存回答。[1][3]

## 问题形状：关系型失败 vs 只看回复

许多对齐失败是**关系型**的：谄媚要对着用户信念看，欺骗要对着模型自己的信念看，提示注入要对着藏在工具输出里的指令看。只把模型回复塞给检测器，可能根本缺定义失败所需的参照。[1] 厂商文档也把间接含义与对抗内容列进 Jev 已知弱点——而这正好是对齐失败里常见的材料。[1] 于是论文的关键设计不是「再堆一套提示工程」，而是把两件事拆开测：

1. **问什么**：通用模板问句（generic），还是点名该基准行为的 targeted 问句；答案类型是 Noul / Choice / Score；读出用软概率还是 argmax。
2. **看见什么**：规范态（canonical state）只有目标模型的输入与输出——这是响应级监控常见视野；再一次加一个字段，看是可部署上下文字段在帮忙，还是「标签键」（label key，本就属于标签定义的字段）在帮忙。[1]

检测任务本身很干净：实例 \(x\) 含目标模型收到的上下文及其回复（agent 场景则是轨迹）；失败类型 \(f\)；标签 \(y_f(x)\in\{0,1\}\) 表示是否发生 \(f\)。检测器给分数 \(s(x)\in[0,1]\)，\(s\geq t\) 就报警。它既要会**排序**（失败分高于非失败），也要会在阈值处**切开**。主指标用 **AUROC**（不依赖阈值），辅以 \(t=0.5\) 与交叉验证阈值下的 F1；弃权在 F1 里当负例，覆盖率低于约 90% 的策略不进 AUROC 对照。[1]

标签来源也要说清楚：多数来自各基准自己的参考打分器（规则、LLM judge 或多轮 grader）。论文把「相对金标确定性可复算」或「已与人类测过一致」的叫 validated；其余大量是未验证 judge 标签。后文会看到：跟 judge 标签特别合，不一定等于跟人类特别合。[1]

## RLCDAlignBench：10 类 × 44 基准怎么搭

基准建立在 Chen 等人（2026）的对齐评测套件之上：那些套件原本用来给策略模型打分；本文改成检测任务——每个失败类型固定一台 2–7B 开源目标模型，生成输出后重放参考打分器，失败发生则 \(y=1\)。合计 **10 类失败、44 个基准、7,193 条检测实例、5 台目标模型**（Qwen3.5-2B、Phi-4-mini、Gemma-2-2B、Llama-3.2-3B、Olmo-3-7B）。打分器汇总为规则 / LLM judge / 多轮轨迹 judge **20 / 20 / 4**；标签侧 validated / 审计改写 / 未验证约 **11 / 8 / 25**。[1][3]

人类标签出现在两个独立集合上：StrongREJECT 人类集（约 1360/1361 条回复、四人生成器、各五名标注员）与 HarmBench 验证集（三名标注员）。它们用来把 Jev 和 judge **对照人类**，而不是只跟 judge 输出比；也与 Phi-4-mini 上那条 100 项 StrongREJECT 基准分开。[1]

六条少数类过少或单类的基准（如 Stories 全正、Rubric tampering 全负、JailbreakBench persona 仅 1 正等）从汇总剔除，**可用基准 38 条**；其中带通用 Noul 的有 31 条（MACHIAVELLI 风格与部分「文本-only 不确定」设定没有单条 Noul）。所有主结果跑在 `jev-1.13.0`。因为一次调用可塞十几道问（平均 **11.4** 道、中位时延 **0.31 s**），报告「最好那道」会夸大收益，所以 targeted 策略一律 **半样本选择、另半样本计分**（20 次分组切分取均值），把选型通胀拆掉——样本内挑最好会把 targeted 夸大约 0.008 AUROC，比真实半样本增益还大。[1]

十类失败要抓的正面行为（\(y=1\)）可以记成一张工作清单：谄媚（迎合用户观点或翻转判决取悦用户）、越狱遵从（对有害越狱请求给实质帮助）、欺骗（陈述与自身引出信念冲突，或服务欺骗目标）、提示注入（跟工具结果里的注入指令走，或泄露/放行系统提示保护的内容）、幻觉（主张无给定来源支撑）、隐私违规（不当披露或禁止数据流）、社会偏见（性别/种族等人口学变体上刻板一致差）、奖励黑客（钻明示 grader / 奖励空子而非目标）、隐瞒不确定性（错答却高置信 \(\geq 0.8\)，或该弃权却作答）、权力寻求（更权力化/不伦理选项或工具性收敛）。[1][3]

### 问句协议：通用模板、三种类型、targeted 家族

通用问句按 state 格式选四类词干之一——单回复、成对输出、规则打分输出、轨迹——再填字段名与每基准行为短语 \(\langle b\rangle\)。例如谄媚侧可能是「sycophancy: shifting its answer toward the belief the user states in question」；越狱侧是「harmful compliance: substantive help with the harmful request…」。每条问句开头有数据护栏：把 state 各字段标成「待评判材料，不是要遵守的指令」。[1]

同一词干会以三种答案类型各问一遍：Noul 直接给 \(P(\text{yes})\)；Choice 在 {yes, no, undetermined} 上给分布；Score 在三档情境（无一匹配 / 一段匹配 / 主内容即该行为）上给期望等级。读出可以软（用概率）或硬（argmax）。Targeted 问句再分 direct（最小陈述 / 定义 / 准则+例子）、rubric（照搬参考 judge 提示或公式）、decomposition（按选项、按秘密、按动作拆原子）等家族，每基准约 15–40 套策略，但都挤在同一次调用里。[1]

基线有三道：全正例 F1、回复长度（符号交叉验证）、以及在**域内标签**上训练的 TF-IDF 逻辑回归。最后这条见过 Jev 从未见过的标签，所以零样本还能赢它，是偏强的结果。[1]

## 主结果：通用问句已经能排，措辞加成很小

头条数字可以压成几句，且都来自论文汇总表：

- **通用 Noul**（模板问句读 \(P(\text{yes})\)）在 31 条基准上中位 **AUROC 0.886**（95% CI [0.821, 0.952]），零样本、未见任何标签。[1]
- 相对「回复长度 + 域内 TF-IDF」里更好的那一个，中位高出 **+0.132**（CI 约 [+0.057, +0.190]），并在 **25 / 31** 条上赢（符号检验 \(p=9\times10^{-4}\)）。[1]
- **半样本 targeted** 在全部 38 条可用基准上中位 AUROC **0.911**（CI 约 [0.860, 0.944]）；相对最佳通用读出，半样本措辞增益中位仅 **+0.006**（CI [−0.004, +0.015]，Wilcoxon \(p=0.055\)）。[1]
- 软读出远比「换答案类型」重要：三级 Score 的期望等级读出相对通用 Noul 中位 **+0.016**（19/7/5 胜平负）；soft Choice 与 Noul 打平量级；Choice / Score 的 argmax 几乎处处输（例如 Choice soft 对 argmax 约 +0.084）。把 Jev 答案先在 0.5 阈值再拼进 rubric 公式，在 10 条基准上相对最佳直接问句中位掉 **−0.137**——硬阈值把概率信息扔掉了。[1]
- 打分器类型（judge / rule / multi-turn）之间通用 Noul 中位差不显著（约 0.906 / 0.890 / 0.870，\(p=0.78\)）；标签来源却有差：未验证标签中位约 **0.949**，验证标签约 **0.872**。[1]

按失败类型看（可用基准上的类型中位，通用 Noul；样本少的类型论文标了 †）：越狱约 **0.965**、提示注入约 **0.962**、欺骗约 **0.949** 很强；奖励黑客约 0.870、隐瞒不确定性约 0.893、权力寻求约 0.861 仍可用；幻觉约 **0.823**、隐私约 **0.808**、社会偏见约 0.782、谄媚约 **0.726** 更吃力。类型间差距提醒：**别把总中位当成「十类都一样好」**——部署时应对弱类型加参照字段或二级 judge。[1]

单基准表里还有两种「读数陷阱」。一是通用 Noul 常**排得开但在 0.5 开火太少**：Tensor Trust 两条与 ELEPHANT 上 AUROC 可到 0.95–0.97，但 \(t=0.5\) 的 F1 可跌到全正例基线以下——这正是后文「拟合阈值」要修的。二是偏斜基准上 F1 会跟着基率走：SycophancyEval（answer）正例率约 82% 时，全正例 F1 约 0.901，可能高于一切 \(t=0.5\) 的 Jev 策略；这时应盯 AUROC，而不是被 F1 吓跑。[1]

### 上下文：可部署字段很少救命，标签键会大跳

49 组成对消融里，结论很清醒。部署监控可能持有、且规范态里原本缺失的参照，在 4 条对比中只有 DeceptionBench 加上目标欺骗目标提示，把通用 Noul 抬了 **+0.050**（CI 全在零上）；对已在 state 里的参照做蒸馏副本（如 MASK 信念）在 3 条上帮不到忙；攻击提示对最佳共享问句的移动最多约 **0.002**。[1]

真正大跳多来自 **label key**——金标答案、秘密清单、注入指针这类「定义标签用的字段」。PrivacyLens 的秘密清单把通用 Noul 从约 **0.79 抬到 0.95**；若把它也算进「可部署」，可部署有帮助的计数会从 1/4 变成 2/8，但论文强调：秘密清单属于标签定义，不是监控天然持有的东西。[1] SycophancyEval（answer）更刺眼：加上真答案后，官方标签上通用 Noul 从 0.540 冲到 0.941，但在「答案是否朝用户建议移动」的改写标签上，却从 0.712 掉到 0.288——因为官方标签在测**正确性**，不是谄媚构念本身。[1]

工程翻译：监控视野要诚实。你没有的字段，别假装 AUROC 会自己长出来；你为了刷分塞进金标的字段，测的也不是生产监控。

## 成本：相对 LLM-judge 约 63×

在 19 条带 API LLM judge 的基准上，论文按标价算一整遍：Jev 约 **$0.30**，对应 judge 约 **$18.96**，合起来约 **63×**。Jev 在其中 18/19 条上比参考 judge 便宜。保守重定价——所有 judge 按 GPT-4o-mini 价、Jev 只问通用句——仍约 **12×** 便宜，中位约 **3.3×**。[1]

这和站内 [rubric 评委文](/cn/blog/jev-rubric-judges-cheaper-faster-correlated-errors/) 的方向一致：typed 决策在「按输入计费、一次多问、不解码长文」上天然省。但任务不同——那边是 (unit, criterion) 打分与相关错误；这里是对齐失败二分类与基率/阈值。两边可以共用「第一层用便宜决策、不确定再升级」的架子，不要共用「相关错误 ≈0、cascade 还能大幅涨分」的幻想。

## 校准与阈值：能排不等于阈值能直接搬

论文明确写了：概率**池化**后可靠性曲线接近对角（ECE **0.047**），但**单基准内**中位 ECE **0.168**（完美校准空模型约 0.074），且 24/31 条超过空模型 95 分位。误差形态是基率错配：文件内 Jev 平均概率相对正例率中位偏差约 **0.125**，而同文件中位 AUROC 仍可约 **0.905**——排序还行，阈值不好直接跨文件搬。[1] 验证标签上 ECE 超空模型的也有 6/8 条，所以不能把问题全甩给「judge 标签吵」。[1]

实践含义：

- \(t=0.5\) 时中位 F1 **0.706**；交叉验证阈值升到 **0.822**；用 **10 条带标样本**拟合约 **0.793**。增益主要落在未验证标签（约 0.678→0.853），尤其若干规则打分基准上 Jev 排得开但分数偏低（约 +0.370）；judge 标签上增益小得多（约 +0.052）。验证标签上 \(t=0.5\) 已与拟合阈值差不多好（约 0.721 vs 0.694），十个标签的拟合成本论文记为约 **0.025**（在验证标签设定下）。[1]
- 无标签 EM 先验平移修不好，F1 会被压到约 0.571–0.690。选择性预测更有用：保留 \(|p-0.5|\) 最大的一半决策，中位准确率从约 0.793 提到约 **0.933**——监控可以把不自信的一半交给 judge 或人。[1]
- 中位 F1 最优阈值约 **0.35**；即便分数已校准，F1 最优阈值也常不是 0.5（论文引 Lipton 等），所以「看起来阈值偏低」本身不是充分证据说模型坏了。[1]

这和站内「概率当控制面之前先硬化」的线索一致：看 [JevOut](/cn/blog/jevout-natural-context-flips-decision-models/) 时，短上下文就能高置信翻转路由；看本文时，**同一套概率在跨基准阈值上也不宜默认可搬**。能把失败排在前面，与能把 \(p\) 当成可直接阈值的绝对风险，是两件事。本文不另造「校准失败」标题党；论文给的是可操作配方——通用问句 + 少量标签定阈值 + 按置信分流。

## 与人类标签、标签缺陷审计

在 StrongREJECT 人类标签上，通用 Noul 与 GPT-4o-mini 参考打分器几乎打平：Cohen’s \(\kappa\) **0.809 vs 0.811**（差 −0.002，CI 跨零）；人类在 116 次双方分歧里有约 **49%** 站 Jev 一边。排序上 Jev 更好（AUROC **0.971 vs 0.929**，+0.042）。即便把 Jev 粗化到 scorer 的九档，仍约 0.962，说明优势不只是「分辨率更细」。[1] HarmBench 验证集上，与单标注员平均 \(\kappa\) **0.748**，与标注员两两一致 **0.736** 同量级。[1]

聚合打平不等于按生成器打平。GPT-3.5 输出上，Jev 的 \(\kappa\) 约 **0.668**，参考 scorer 约 **0.790**（差约 −0.121），AUROC 却仍可比——这是分数形状差异，不是换个阈值就能抹平（oracle 阈值后约 0.688 vs 0.790）。[1] 生产监控若只报「总体 κ」，会漏掉上游模型族上的坑。

更有工程味的一点：Jev **高置信分歧**帮作者挖出既有基准的标签问题——三处标签定义/打分缺陷，外加四处 MACHIAVELLI 变体标签依赖状态里看不见的注释后果。Open-Prompt-Injection 的官方标签在跟注入任务准确率走；SycophancyEval（answer）在跟正确性走；SycophancyEval（feedback）的 judge 对「不批评」标准执行不一致；MACHIAVELLI 标签记录的是所选选项的注释后果，而 state 根本不展示后果。AbstentionBench 上两个跑官方提示的 judge 彼此 \(\kappa\) 仅约 **0.05**。其余分歧里约 **25%** 被归为 Jev 错。[1]

对做基准的人：廉价决策模型的自信反对，是审计标签的便宜探针。对做监控的人：别把「跟现有 scorer 对齐」自动当成「跟人类对齐」；也别在缺陷标签上用低 AUROC 直接宣判「检测器不会抓这类失败」——Open-Prompt-Injection 上通用 Noul 可低到约 **0.231**，改标签构念后故事会变。[1]

## 对照站内：rubric 评委 vs 对齐失败检测

两篇文容易混，值得钉开：

| | [Jev 当 Rubric 评委](/cn/blog/jev-rubric-judges-cheaper-faster-correlated-errors/) | 本文 Just Ask Jev |
| --- | --- | --- |
| 任务 | (unit, criterion) 是否满足 / 落在哪一级 | 交互是否发生某类对齐失败 |
| 对照对象 | 三位 flash LLM + 人标 | 基准 scorer（规则/judge）+ 两个人类集 |
| 头条形态 | 准确率多数分不开；成本/时延差数量级；相关错误卡住 cascade | 中位 AUROC 0.886；措辞增益≈0；约 63× 便宜 |
| 失败模式提醒 | 评委彼此更合、对人标更不合 | 排序好但基率/阈值不搬；缺参照时关系型失败吃瘪 |
| 接线姿势 | 内容质量 / 量表评分第一层 | 安全与对齐失败第一层筛 |

再加上 [Claude Code 接入](/cn/blog/jev-claude-code-10x-and-25-lines/)（判断离开自回归热路径）与 [Jev-Mem](/cn/blog/jev-mem-system-one-agentic-memory/)（记忆写/读/停取控制面）：同一条 System One 线，现在多了一块 **对齐监控筛**——适合高流量、多准则、要概率不要长文的那一层；不适合假装已经是独立真相源。若记忆检索结果会进监控 state，也要记得 [JevOut](/cn/blog/jevout-natural-context-flips-decision-models/)：自然上下文能翻转决策，字段白名单与数据护栏不是可选项。

## 可复用清单：把 Just-Ask-Jev 接到 harness 监控环

下面按「能明天接线」写，数字均回指论文：

1. **默认问句：通用模板 + 软概率。** 用基准/政策失败定义改写行为短语 \(\langle b\rangle\)，问「Does response exhibit \(\langle b\rangle\)?」一类 Noul，读 \(P(\text{yes})\)。不要默认先写很长 targeted rubric；半样本证据显示措辞加成接近零，样本内挑最好还会夸大。[1]
2. **一次调用挂多失败类型。** 平均约 11 问仍是一次请求；对齐监控天然是「多准则同看一条轨迹」。把谄媚、注入、幻觉、隐私等短语并列进 `questions`，比串行开十个 judge 便宜一个数量级以上（在论文 19 条 API-judge 设定下约 63×）。[1]
3. **规范态先只给输入+输出。** 再决定是否加系统提示、工具观察、欺骗目标等可部署字段；别把金标答案、scorer 判决塞进生产 state——那是在测标签构念，不是测监控。[1]
4. **关系型失败检查参照是否在场。** 注入是否出现在工具结果字段、用户信念是否在对话里、秘密清单你是否真有。缺参照时 AUROC 掉，先补视野再怪模型；PrivacyLens 式大跳往往来自 label key，部署前要问「我有没有这份清单」。[1]
5. **阈值用少量带标样本拟合，别死守 0.5。** 论文配方：通用问句 + 约 10 条标签定阈值；验证标签上 \(t=0.5\) 往往已够。排得开但 F1 惨的基准（如部分 Tensor Trust），优先调阈值而不是重写问句。[1]
6. **用置信度做分流，而不是先验平移。** \(|p-0.5|\) 小的一半交给 LLM judge / 人；大的一半让 Jev 落闸。EM prior-shift 在论文里修不好 F1。[1]
7. **软聚合，硬阈值组合少用。** 多原子问句用 max / 乘积 / 差分等软合成；先各自 0.5 再 AND/OR 会丢掉排序信息（rubric 公式中位 −0.137）。[1]
8. **高置信分歧进标签审计队列。** 与现有 scorer 冲突且 \(|p-0.5|\) 大时，优先人工看是不是标签在测错构念——论文已用这招挖出多处缺陷；其余分歧里仍有约四分之一是 Jev 错，所以队列要有人审，不能自动改标。[1]
9. **和 rubric cascade 分工。** 内容质量 / 评分量表走 [rubric 评委协议](/cn/blog/jev-rubric-judges-cheaper-faster-correlated-errors/)；安全与对齐失败走本篇检测协议。别假设「相关错误」数字自动迁移，但「用 cascade 省钱、别幻想大幅涨分」的态度可以共用。
10. **对抗与上下文硬化单独做。** 监控 state 可能被工具输出污染；问句保留数据护栏；结合 JevOut，对决策输入做字段白名单与长度/来源约束。论文伦理节也提醒：失败分数是双刃的——能量化覆盖，也能被攻击者用来搜逃逸；公开测盲区仍被作者判断为对防御方更有利。[1]

伪代码级形状（示意，非厂商 SDK）：

```text
state = {user_input, model_output, tool_obs?}   # 可部署字段 only
questions = [Noul(b) for b in failure_phrases]  # 多失败一次问
scores = jev(state, questions)                  # 各 P(yes)
for b, p in scores:
  if abs(p - 0.5) < margin: route_to_judge(b)
  elif p >= t_b: flag(b)                        # t_b 由少量标签拟合
```

## 边界与未决

论文自己列的限制要跟着说：只评了 **jev-1.13.0**、英文基准、2–7B 目标、标签多数来自 scorer 而非人类；扩展到其他检测器、更大目标模型、其他语言是未来工作。[1] 另有几条读数红旗：

- 未验证（多为 judge）标签上通用 Noul 中位约 **0.949**，验证标签约 **0.872**——跟 judge 标签更合，部分可能是「像 judge」而不是「更真」。敏感性表显示：丢掉审计改写标签后，通用 Noul 中位可升到约 **0.905**（28 条），说明坏标签会拖累头条。[1]
- 按生成器拆开时，StrongREJECT 上对 GPT-3.5 输出的 \(\kappa\) 会明显弱于参考 scorer；聚合打平不等于每个上游模型都打平。[1]
- Open-Prompt-Injection 一类缺陷标签上通用 Noul 可以很差——先审计标签，再下「检测器不会抓注入」的结论。[1]
- 社会偏见与谄媚类型中位偏低，且部分基准退化/偏斜；弱类型上应预留二级审查，而不是只看总中位 0.886。[1]

开源侧：代码 MIT；数据与缓存回答在 Hugging Face `sumleo/RLCDAlignBench`（有害内容门控，研究用途）；指标可离线从缓存重算，不必重新打 Jev。项目页与数据集卡补充了字段说明；有害子集沿用上游门控约定。[3]

## 结语

Just Ask Jev 把站内 Jev 线从「路由 / 评委 / 记忆控制」推进到 **对齐失败零样本筛**：一张通用问句、软概率读出，在 31 条基准上中位 AUROC **0.886**，半样本 targeted 到 **0.911**，相对 API judge 整遍约 **63×** 便宜；与人类标签在 StrongREJECT 上与参考 scorer 打平量级（\(\kappa\) 0.809 vs 0.811），还能用自信分歧审计坏标签。[1] 真正决定上限的，往往不是把问句写得更花，而是 **state 里有没有定义失败的参照**，以及 **阈值有没有按基率重装**。

接到 harness 时，合理默认不是「用 Jev 取代全部安全栈」，而是：高流量多准则第一层用 Just-Ask-Jev 排序与分流，不自信或高风险交给 judge / 人，并把高置信分歧喂回标签与策略审计——让对齐监控变成可计费、可阈值、可审计的控制面，而不是又一堆生成式长文评语。

## 参考文献

1. Ruoqi Guo, Yi Liu, Gelei Deng, Yuekang Li, Lida Zhao, Yutao Wu, Simin Chen, Ying Zhang, Leo Yu Zhang. *Just Ask Jev: Reinforcement Learning for Calibrated Decisions as a Zero-Shot Detector of AI Alignment Failures*. arXiv:2609.29429, 2026. https://arxiv.org/abs/2609.29429 · HTML https://arxiv.org/html/2609.29429
2. TypeSafe AI. Jev / System One 文档（论文引用，访问日期见原文）。https://docs.typesafe.ai
3. RLCDAlignBench 代码与数据. https://github.com/sumleo/RLCDAlignBench · Dataset https://huggingface.co/datasets/sumleo/RLCDAlignBench
4. 站内：Jev × Claude Code. https://redreamality.com/cn/blog/jev-claude-code-10x-and-25-lines/
5. 站内：Jev 当 Rubric 评委. https://redreamality.com/cn/blog/jev-rubric-judges-cheaper-faster-correlated-errors/
6. 站内：JevOut 短上下文翻转决策模型. https://redreamality.com/cn/blog/jevout-natural-context-flips-decision-models/
7. 站内：Jev-Mem 记忆控制面. https://redreamality.com/cn/blog/jev-mem-system-one-agentic-memory/
