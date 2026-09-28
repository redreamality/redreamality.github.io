---
title: "Bad Genius：反事实协议一动，Harness 进化就露馅"
description: "解读 arXiv:2609.18366 CHASE：自动 harness 优化会在固定发布协议上钻基准级捷径；用 Challenger 搜可执行协议变换、有效性防火墙与持出确认，在 Syn-Ledger / OfficeQA 上保住发布分、压低增益摧毁。"
pubDate: 2026-09-28T10:40:00+08:00
author: "Remy"
tags: ["agent-harness", "ai-agents", "agent-loop", "developer-tools", "LLM", "rsi"]
lang: "zh"
---

自动优化 harness 这件事，听起来像「把固定模型周围的提示、记忆、检索、工具和控制代码越改越好」。跑分上去了，持出任务也看起来没塌——很多人就会签收。问题是：任务语义可以变，**发布协议**往往没变。协议里藏着跨题共享的相关（文件名习惯、检索通道顺序、单位说明总在表前一行），优化器完全可以把它写进可执行 harness。电影《Bad Genius》里那个帮人作弊的天才学生，不是不会做题，而是更会利用考场规则；论文用这个隐喻点名一类失败——**看起来更聪明的 harness，其实在吃基准级捷径（benchmark-wide shortcut）**。[1]

中国科学院大学、新加坡国立大学与中科院自动化所等作者在 [arXiv:2609.18366](https://arxiv.org/abs/2609.18366)（v3，2026-09-24）提出 **CHASE**（Counterfactual Harness Search and Evolution，反事实 harness 搜索与进化）：每次 Proposer 更新之后，再派一个 **Challenger** 去搜「能大幅摧毁增益、又保住任务语义」的可执行协议变换；有效性防火墙（validity firewall）拦掉改题作弊，持出确认集决定是否进有限档案。理想上还有一个捷径被中和的基准 \(B_0\)；有限档案与 \(B_0\) 之间有可证明的联系。评测落在 Syn-Ledger 与 OfficeQA：CHASE **保住较强的发布基准增益，同时在有效协议变换下明显降低增益摧毁（gain destruction）**。[1]

这篇不是「又一个 harness 优化器发了」的软新闻。站内已经写过 [扩张 harness 而不是堆上下文](/cn/blog/grow-the-harness-not-the-context/)、[ECC 外围优化](/cn/blog/ecc-agent-harness-optimization/)、[SpecHarness 规格权威](/cn/blog/specharness-spec-holds-the-pen/)、[控 harness 控成本](/cn/blog/control-the-harness-control-the-cost/)、[Claude Science harness](/cn/blog/claude-science-harness-nine-loop-amplitudes/)。那些文分别谈「控制长进代码」「外围配置面」「谁握笔签字」「路由账单」「长程科学循环」。本篇补的是评估侧更硬的一句：**当你对着固定发布协议自动进化 harness，若不加对抗式协议变换，你可能发出一只「坏天才」——发布分更好，协议一挪就塌。** 数字一律来自论文 HTML，不外推。[1]

## 持出任务挡得住「背题」，挡不住「吃协议」

先把对象说清楚。论文里的 harness，是固定基础模型周围的可执行上下文：存什么、检索什么、工具与工作区怎么暴露、输出怎么处理。被评的 Agent = 模型 + harness。Meta-Harness 一类工作用编码 Agent（Proposer）根据旧代码、分数与执行轨迹改 harness；后续还有持出评估、优化器质量、优先级排序、可靠选型等。[1]

反复用同一发布基准 \(B_{\mathrm{rel}}\) 的反馈，会制造一种与「参数过拟合」不同的泛化问题。经典捷径学习多半来自数据或任务伪相关；harness 进化多了一条可执行路径——**Proposer 可以把捷径写进程序**。既有做法常禁止任务 ID、文件名硬编码、按题修补，再在持出任务上评估。这能压 **任务级捷径**（例如认出某一题 ID 就开已知文档），却压不住 **基准级捷径**：例如总是先搜某个文档通道，因为发布协议里支撑证据更常落在那里。[1]

OfficeQA Full 给了一个很直观的动机。代理要在美国财政部 Bulletin 类文档上答题。论文报告：OfficeQA Full 中 **58.1%** 的问题提到百万之类数值量级；在 **697** 篇文档语料里，**95.2%** 的单位说明之后、下一非空行会开一张表（Supplementary C.1）。Proposer 完全可能诱导模型「找单位时先看表前一行」。这不是背某一题答案——持出换题后捷径仍可活着，因为协议相关没变。[1]

于是自然的下一步是：任务继续持出，同时**变协议**。把同一批文档在通道间重排，问题、答案与文档内容不变，但「先搜通道 A」的优势消失。再比较进化 harness 相对初始 harness \(H_0\) 的增益，在协议变换前后差多少——大跌就是持出任务单独揭不开的基准依赖。理想情况是造出中和一切基准级捷径、又保住底层任务的 \(B_0\)；现实里捷径来源太多，固定规则预写不全。CHASE 的回答是：别假装你已经枚举完捷径，**在线搜反事实基准**，把确认过的变换变成后续进化的约束。[1]

## 增益怎么拆：发布增益 = 中和后增益 + 「坏天才」差额

形式化部分值得读，因为它把「看起来涨分」拆成可对账的两项。发布基准 \(B_{\mathrm{rel}}=(P,V_{\mathrm{rel}},Q_{\mathrm{rel}},\psi)\)：\(P\) 是语义任务分布，\(V/Q\) 是协议与交互细节，\(\psi\) 是目标规则。任意 harness \(H\) 在基准 \(B\) 上有分数 \(R_B(\mathsf{A},H)\)。相对 \(H_0\) 的发布增益 \(G_{\mathrm{rel}}\) 与在理想中和基准 \(B_0\) 上的增益 \(G_0\) 满足：

\[
G_{\mathrm{rel}}(H;H_0)=G_0(H;H_0)+\Delta_{\mathrm{BS}}(H;H_0).
\]

\(\Delta_{\mathrm{BS}}\) 就是与「坏天才」对基准级捷径依赖相关的**有符号增益差额**——论文要压的就是这块，而不是否认一切发布分提升。[1]

任务持出对应另一项 \(\Delta_{\mathrm{TS}}\)：搜索集增益与持出集增益的差。任务级捷径可让 \(\Delta_{\mathrm{TS}}>0\)；基准级捷径可以在两边都站住，于是 \(\Delta_{\mathrm{TS}}\) 很小，看起来「泛化很好」。**只盯持出，会误判安全。**[1]

对任意有效协议变换得到的 \(B_b\)，定义增益摧毁 \(\Delta_b=G_{\mathrm{rel}}-G_b\)。当 \(B_b=B_0\) 时回到 \(\Delta_{\mathrm{BS}}\)。负的 \(\Delta_b\) 表示反事实下增益反而更大——不是「基准更容易」，而可能是选中的 harness 在中和协议上比在发布协议上更能拉开与 \(H_0\) 的差距。[1]

## CHASE：Proposer 涨分，Challenger 拆协议，防火墙护语义

CHASE 把 harness 进化改写成**对有效反事实基准族的约束生成**。流程可以压成四步（论文 §3、图 2）：[1]

1. **Proposer（提议者）** 在固定模型 \(\mathsf{A}\) 周围改 harness，目标仍是抬高发布增益 \(G_{\mathrm{rel}}\)，但必须满足：对档案 \(\mathcal{A}_{t-1}\) 里每一个已确认反事实，增益摧毁 \(\Delta_b\leq\varepsilon\)。
2. **Challenger（挑战者）** 针对刚得到的 \(H_t\)，在有效族 \(\mathcal{B}_{\mathrm{val}}\) 里搜使 \(\Delta_b(H_t;H_0)\) 尽量大的可执行协议变换 \(\Phi_{b_t}\)，返回带类型的可执行规格。
3. **有效性防火墙** 只在可执行检查全过时置 \(\operatorname{Valid}(\Phi_b)=1\)：保住语义任务、标准答案、证据与计分语义，只允许改协议许可部分（细则见 Supplementary B.3）。改题、改答案、偷偷换证据——直接拒。[1]
4. **有限档案 + 持出确认**：任务角色互不相交——\(D_{\mathrm{evo}}\) 给 Proposer 反馈，\(D_{\mathrm{disc}}\) 给 Challenger 搜索，\(D_{\mathrm{conf},t}\) 确认本轮变换，\(D_{\mathrm{cert}}\) 封存到最终认证。确认阈值 \(\eta_{\mathrm{conf},t}\) 过了且 Valid=1，才把 \(B_{b_t}\) 并入 \(\mathcal{A}_t\)；否则档案不动。最终选型不是「发布分最高的那只」，而是在 \(\mathcal{A}_T\) 约束下最大化 \(G_{\mathrm{rel}}\) 的候选（式 4）。[1]

和「再派一个批评/调试 Agent 帮修 harness」不同：Challenger **打的是捷径源头——基准协议本身**。和 HarnessCompass 的固定泛化闸门也不同：CHASE 用的是 HarnessCompass 的 Proposer 骨架，但**拿掉固定闸门**，改由确认反事实动态约束后续轮次与终选。[1]

理论侧（§4）问的是：有限档案能对 \(B_0\) 证明什么？若档案里若干变换的复合能得到 \(B_0\)（\(K(\mathcal{A})<\infty\)），则可把认证集上的经验最大摧毁 \(\widehat{\Gamma}\) 与最小幸存增益 \(\widehat{G}_{\min}\)，连到对 \(\Delta_{\mathrm{BS}}\) 与 \(G_0\) 的高概率界（Theorem 1）；\(K=1\)（档案已含 \(B_0\)）时合成超额项 \(\rho\) 消失。另有结果刻画 Challenger 序贯搜索何时可停。实现上预算有限时，\(\eta_{\mathrm{conf},t}\) 与 \(\varepsilon\) 取固定值（Supplementary B）；OfficeQA 叙事里用到 \(\varepsilon=0.05\)。[1]

## OfficeQA：发布分还能打，档案最坏情况最好

实验设置（§5.1–5.2）。OfficeQA 面向美国政府财务文档问答，要文档发现、文本/表检索、数值推理与精确抽取。作者用两个发布：**Full 246 题**做 harness 优化，**Pro V2 90 题**做跨语料评估（独立的收支类语料）。Full 上模型可搜完整 **697** 篇变换文本语料。取 \(T=3\)，把 246 题拆成 \(D_{\mathrm{evo}}\) 49、\(D_{\mathrm{disc}}\) 49、\(D_{\mathrm{cert}}\) 76，以及三轮各 24 题的确认集。引用侧还提到：固定模型下 EnvHarness 曾把 OfficeQA exact-match 从 **54.40%** 提到 **56.20%**——用来说明该基准对 harness 敏感，不是本文方法数字。[1]

对照五法共享 \(\mathsf{A}\) 与 \(H_0\)：

| 方法 | 在做什么 |
| --- | --- |
| RawHarness | 不改 \(H_0\)，作增益参照 |
| Meta-Harness | 只为发布基准分优化 |
| HarnessCompass | 发布分 + 固定泛化闸门 |
| HarnessEvolve | 参考轨迹 + 质量/性能/持出验证闸门 |
| CHASE | Proposer 骨干同 HarnessCompass，无固定闸门；Challenger 确认反事实进档案并约束后续 |

主评估：各方法终选 harness 在 76 道认证题上，于最终档案 \(\mathcal{A}_3\) 的每个基准上跑（每题三 rollout）。报告发布分 \(\widehat{R}_{\mathrm{rel}}\)、档案平均 \(\widehat{R}_{\mathrm{avg},\mathcal{A}_3}\)、档案最坏 \(\widehat{R}_{\min,\mathcal{A}_3}\)，另报 Pro V2 发布分。[1]

**Table 1（OfficeQA，论文原文）：**[1]

| Method | \(\widehat{R}_{\mathrm{ProV2}}\uparrow\) | \(\widehat{R}_{\mathrm{rel}}\uparrow\) | \(\widehat{R}_{\mathrm{avg},\mathcal{A}_3}\uparrow\) | \(\widehat{R}_{\min,\mathcal{A}_3}\uparrow\) |
| --- | ---: | ---: | ---: | ---: |
| RawHarness | 27.04% | 67.98% | 66.23% | 64.47% |
| Meta-Harness | 29.26% | 63.60% | 64.04% | 63.60% |
| HarnessCompass | 26.30% | 64.04% | 63.16% | 62.28% |
| HarnessEvolve | 24.07% | 69.30% | 68.20% | 67.11% |
| CHASE | **30.37%** | 68.86% | **68.42%** | **67.98%** |

读表时别只盯「谁发布分最高」。HarnessEvolve 的 \(\widehat{R}_{\mathrm{rel}}\) 略高于 CHASE（69.30% vs 68.86%），但档案平均与最坏都低于 CHASE；跨到 Pro V2，CHASE 最高（30.37%），HarnessEvolve 反而落到 24.07%，低于初始 RawHarness 的 27.04%。HarnessCompass 在本设置下甚至低于初始 harness——论文提醒 OfficeQA 对它是新基准，闸门实现见 Supplementary B.5，不宜据此全盘否定原工作，但足以说明**固定泛化闸门 ≠ 协议鲁棒**。[1]

一轮 Challenger 叙事也很值得抄进工程笔记。第一轮提出：在表之前收集关联上下文，并给出可执行变换规格——怀疑 \(H_1\)（被指示「每个操作数都保留显式单位」）依赖单位与注释的惯常位置。主机执行规格时，把检索文本重编码为 Agent 可见 JSON 搜索结果里的表上下文。在 \(D_{\mathrm{evo}}\) 上，\(H_1\) 相对 \(H_0\) 的增益从发布协议下的 **+8.16%** 变成反事实 \(B_{b_1}\) 下的 **−5.10%**——增益直接翻转，说明涨分绑在证据呈现方式上。\(B_{b_1}\) 进档后，\(H_1\) 与第二轮候选都违反 \(\varepsilon=0.05\)，于是 CHASE 令 \(H_2=H_0\)；第三轮一个候选恢复 **4.08%** 发布增益且满足约束，被选为 \(H_3\)。[1]

这就是「坏天才」被当场拆穿的样子：不是分数没涨过，而是**涨出来的那截，协议一挪就变成负的**。

工程上可以把这一轮叙事压成验收用例：若某次 harness 更新在发布协议上相对初始 harness 涨了超过允许的增益摧毁上限，就必须能指出至少一个有效协议变换，使增益摧毁跌破阈值；否则更新不得进入候选池。CHASE 把这道闸从「人工抽查」变成了 Challenger 的在线搜索加确认集。你不一定要复现他们的完整三轮调度，但「涨分必须配一条过防火墙的反事实」这一条，很适合写进内部 harness CI。


## Syn-Ledger：能造 \(B_0\) 时，看增益还剩多少

为了隔离多文档数值推理里的基准级捷径，作者另造 **Syn-Ledger：320** 道合成账本任务，使 \(B_0\) 可构造，从而直接量 \(G_0\) 与 \(\Delta_{\mathrm{BS}}\)（Supplementary D）。任务含问题、十二份账本文档与决定答案的算术程序；证据两份、干扰十份；工具为 `list_files` / `search` / `open_file` / `calculator`，每任务最多十二次工具调用；计分为归一化整数精确匹配。[1]

捷径不改语义，只改五类可观察特征的有利/不利水平：文件名、目录深度、搜索排名、候选记录位置、序列化格式。发布基准里证据文档更常落在有利水平（每个特征上 **56/64=7/8** 的证据文档有利）；\(B_0\) 则把特征配置对证据身份平衡掉，使单特征或五特征交互都不与「是不是证据」相关。五个典型中和变换 \(\Phi_j\) 可交换，复合即 \(B_0\)。另有五类安慰剂变换只改无关呈现，用于构造审计，**不泄露给 Challenger**——Challenger 必须动态提议。[1]

Syn-Ledger 在上述五法之外加 **\(B_0\)-Access**：仍用 HarnessCompass 三轮与固定闸门，但按 \(B_0\) 表现选候选——近似「若捷径机制已知」的上界参照。终评在 **208** 道认证任务上、三 rollout，报告 \(\widehat{R}_{\mathrm{rel}}\)、\(\widehat{R}_0\)、\(\widehat{G}_{\mathrm{rel}}\)、\(\widehat{G}_0\)、\(\widehat{\Delta}_{\mathrm{BS}}\)。[1]

**Table 2（Syn-Ledger，论文原文）：**[1]

| Method | \(\widehat{R}_{\mathrm{rel}}\uparrow\) | \(\widehat{R}_0\uparrow\) | \(\widehat{G}_{\mathrm{rel}}\uparrow\) | \(\widehat{G}_0\uparrow\) | \(\widehat{\Delta}_{\mathrm{BS}}\downarrow\) |
| --- | ---: | ---: | ---: | ---: | ---: |
| RawHarness | 81.89% | 15.22% | — | — | — |
| Meta-Harness | 82.05% | 19.87% | +0.16% | +4.65% | −4.49% |
| HarnessCompass | 80.45% | 14.74% | −1.44% | −0.48% | −0.96% |
| HarnessEvolve | **93.59%** | 18.27% | **+11.70%** | +3.04% | **+8.65%** |
| \(B_0\)-Access | 83.01% | 32.69% | +1.12% | +17.47% | −16.35% |
| CHASE | 87.18% | **38.30%** | +5.29% | **+23.08%** | **−17.79%** |

HarnessEvolve 在发布协议上最亮（93.59%，增益 +11.70%），但中和后增益只剩 +3.04%，\(\widehat{\Delta}_{\mathrm{BS}}=+8.65\%\)——大块发布增益与捷径绑定。CHASE 发布分不是第一，却在 \(B_0\) 上拿到最高分与最高增益（38.30%，+23.08%），\(\widehat{\Delta}_{\mathrm{BS}}\) 为负（−17.79%）。论文强调：负差额**不表示** \(B_0\) 整体更容易——绝对分在 \(B_0\) 上仍低得多（相对 RawHarness 的 81.89%→15.22% 悬崖）——只说明 CHASE 选中的 harness 相对 \(H_0\) 的改进，在中和协议上比在发布协议上更大。[1]

\(B_0\)-Access 知道理想中和仍拿不到 CHASE 的 \(B_0\) 分（32.69% vs 38.30%），提醒「知道 \(B_0\)」与「在对抗搜索约束下进化」不是同一个优化问题。[1]

## 和站内 harness 叙事怎么对表

把 CHASE 嵌进站内已有线，边界会更清楚：

- **[扩张 harness，而不是堆上下文](/cn/blog/grow-the-harness-not-the-context/)**：关心控制是否沉进可复用代码、持出成功率是否回滚。CHASE 追问另一轴——**增益是否绑在协议相关上**。你可以长出很漂亮的控制代码，仍然是坏天才。
- **[ECC](/cn/blog/ecc-agent-harness-optimization/)**：外围 Skills / Hooks / Memory / AgentShield，优化性能、记忆与安全配置面。若有人用自动 Proposer 去「进化」ECC 一类配置，CHASE 提醒：评估协议本身要进对抗环，否则优化器会学会协议癖好。
- **[SpecHarness](/cn/blog/specharness-spec-holds-the-pen/)**：规格权威与提案–提交分离。CHASE 的有效性防火墙是评估侧近亲——**变换可执行，但语义义务不能被 Proposer/Challenger 私自改写**。
- **[Control the Harness, Control the Cost](/cn/blog/control-the-harness-control-the-cost/)**：harness 决定账单。坏天才还会扭曲成本叙事：发布分便宜地涨了，换协议后你得重付「真实能力」的账。
- **[Claude Science harness](/cn/blog/claude-science-harness-nine-loop-amplitudes/)**：长程科学循环靠显式 harness。若未来对科学基准做自动 harness 进化，协议通道（文件布局、检索顺序、中间表示）同样需要反事实压力测试。

和 RSI / 自我改进叙事的关系可以更直白：递归改进若把「对固定评测协议涨分」当目标，而协议相关可被写进 harness，那自我改进可能在强化捷径而不是能力。CHASE 不是完整 RSI 栈，但它给 harness 进化加了一层**对抗协议约束**——和「只加持出任务」不是同一种闸门。本篇**不是** Jev 主题文；Jev 本周占用仍为 0/1。[1]

讨论节也很短、很硬：harness 优化改变了「什么必须泛化」——任务泛化问最终 harness 是否跨题可用；CHASE 问 **进化增益是否在有效 \(B_b\) 下仍在**。基准用金标计分；开放题常见的 LLM-as-judge 是自然延伸方向，也可反过来压测评委有效性。[1]

## 相关工作怎么站位，以及你不该从本文外推什么

论文 Related Work 把两条线拆开，读起来对工程选型很有用。[1]

**Harness 优化线。** DSPy / OPRO / TextGrad 一类系统级或提示搜索；Meta-Harness 把对象扩到提示、记忆、工具与控制代码；HarnessOpt-Bench、Priority ranking、Harness-Bench、HarnessLens、AutoSaddler 分别盯优化器预算、组件优先级、模型–harness 配置效应、验证成本与失败轨迹诊断。这些工作回答「优化什么、优化器好不好、怎么验得便宜」。CHASE 问的是另一件事：来自 \(B_{\mathrm{rel}}\) 的反馈，会不会选出一只**增益依赖跨题协议相关**的 harness。[1]

**Harness 泛化线。** 持出任务评估证明同题优化会夸大增益；HarnessCompass 用固定泛化闸门只许任务无关修改；HarnessEvolve 用参考轨迹与多层验证闸门。它们主要压任务级过拟合与不稳定更新。CHASE 承认这些闸门有价值，但指出：闸门再严，只要协议面固定，基准级捷径仍可活着——OfficeQA 表上 HarnessCompass 低于初始 harness、HarnessEvolve 发布分高但 Pro V2 / \(B_0\) 侧掉队，就是这种错位的可核例证。[1]

也要说清**本文不声称**的东西，避免写成营销句：

- 不声称 CHASE 在所有 Agent 基准上全面碾压；主结果在 OfficeQA 与 Syn-Ledger，每题三 rollout，预算 \(T=3\)。
- 不声称 Challenger 已枚举全部捷径；有限档案是逐步加压，Theorem 1 的界随 \(K(\mathcal{A})\) 与 \(\rho\) 收紧，并不是「搜一轮就等于 \(B_0\)」。
- 不把 EnvHarness 的 54.40%→56.20% 算进 CHASE 成绩；那只是「OfficeQA 对 harness 敏感」的旁证。
- 不把「负的 \(\widehat{\Delta}_{\mathrm{BS}}\)」误读成「中和基准更简单」；论文明确写了绝对分在 \(B_0\) 上仍显著更低。
- 开放式 LLM-as-judge 基准上的抄法，需要另做评委有效性验证；本文主结果建立在金标计分上。[1]

还有一个容易忽略的部署细节：Challenger 产出的是**可执行变换规格**，主机要能把它跑起来（OfficeQA 例里是重编码检索 JSON）。这意味着评测基础设施本身要支持「同一任务、多协议渲染」，而不只是换一列超参。若你的基准流水线把协议写死在数据落盘格式里，先做协议渲染层，再谈上 Challenger——否则反事实搜索会卡在工程接口，而不是科学问题。


若你的流水线已经在做 RSI 式自我改进——模型固定、harness / 工具 / 记忆在环上改——CHASE 最可迁移的不是某一组 \(\varepsilon\)，而是角色拆分：**涨分的 Proposer 与拆协议的 Challenger 不要共用同一批反馈题，也不要共用同一套成功定义。** 否则「自我改进」很容易退化成「自我熟悉考场」。

## 可落地清单：别只进化 harness，要进化「评测压力」

若你在生产或研究里已经跑 Meta-Harness / 自动 prompt·工具·控制搜索，建议把下面几条写成团队约定（机制抄法，不是复现论文超参）。抄之前先问一句：你们现在报给老板或论文审稿人的「harness 优化收益」，有没有任何一项是在**协议变换后**测的？如果答案是没有，优先补测量，再谈上完整 CHASE 循环。

1. **先分清两类捷径。** 禁止题号硬编码、按题补丁，只挡任务级。基准级要动协议：通道、排序、序列化、元数据布局、演示顺序、反馈格式。
2. **增益报告成对出现。** 至少同时报：相对 \(H_0\) 的发布增益，以及在一两个有效协议变换下的幸存增益 / 增益摧毁。只报发布分，默认不信任。
3. **给 Challenger 独立任务集与确认集。** 搜索、确认、认证不要共享同一批题；否则「搜到的反事实」会和「确认过的约束」糊成一团。
4. **有效性防火墙要可执行、要能拒。** 语义任务、金标、证据集合、计分器不变；只允许协议许可面变化。没有防火墙的「随机打乱」可能改坏题意，等于换了一道更难的题而不是中和捷径。
5. **档案是约束，不是展示柜。** 确认后的 \(\Phi_b\) 要能约束后续 Proposer 与终选（式 2/4）。只做事后分析、不挡选型，等于没上 CHASE。
6. **\(\varepsilon\) 是产品决策。** OfficeQA 例用 0.05：过松则坏天才仍进档，过严则可能退回 \(H_0\)（论文第二轮就发生过）。把它写进发布说明，而不是藏在脚本常量里。
7. **固定泛化闸门当作补充，不当充分。** HarnessCompass 式规则有用，但 OfficeQA 表上它未保证档案鲁棒；动态反事实约束与静态闸门解决的问题不同。
8. **有 \(B_0\) 时优先核 \(\Delta_{\mathrm{BS}}\)；没有时用档案 \(\Gamma_{\mathcal{A}}\)。** Syn-Ledger 证明理想中和可测；OfficeQA 证明未知捷径下在线搜档案仍有用。
9. **跨语料 / 跨发布是加分项，不是替代。** Pro V2 上 CHASE 最好，说明协议鲁棒有时连带跨语料；但跨语料失败也可能来自领域漂移，不能单独代替反事实协议检验。
10. **把「能改 harness 的优化器」当高权限 Agent。** 与 Growing Harness / ECC 同一条安全常识：沙箱、权限、审计、失败回滚。Challenger 生成的是可执行协议变换，同样要进隔离执行面。

反模式也写清楚：

- **发布分涨了就合并。** 没看 \(\Delta_b\) / \(\widehat{\Delta}_{\mathrm{BS}}\) 的涨分，默认可疑。
- **只做任务持出就宣布「无过拟合」。** 协议相关可以完美「泛化」到持出题。
- **用改题当压力测试。** 防火墙没过的变换，测的是别的东西。
- **把 Challenger 提示泄露给 Proposer 当作弊提示词。** 档案应是约束与可执行变换，不是「如何躲开检测」的攻略。
- **在 LLM-as-judge 基准上原样抄数字。** 本文主结果在金标计分上；换 judge 要单独验证。

## 结语

[Bad Genius / CHASE](https://arxiv.org/abs/2609.18366) 把 harness 进化从「怎么把发布分刷更高」推进到「刷出来的增益在有效协议变换下还剩多少」。机制很清楚：Proposer 仍可改提示、记忆、检索、工具与控制；Challenger 在线搜反事实协议；防火墙护语义；持出确认进有限档案；终选受档案约束。OfficeQA 上它在档案平均/最坏与 Pro V2 上领先或具竞争力；Syn-Ledger 上它在真正的 \(B_0\) 增益与增益摧毁上明显优于「发布分冠军」HarnessEvolve。[1]

对站内读者，最有用的读法或许是：用 [扩张 harness](/cn/blog/grow-the-harness-not-the-context/) 决定控制沉哪里；用 [ECC](/cn/blog/ecc-agent-harness-optimization/) / [控成本](/cn/blog/control-the-harness-control-the-cost/) 管配置面与账单；用 [SpecHarness](/cn/blog/specharness-spec-holds-the-pen/) 管谁握笔；再用本文——**当你开始自动进化 harness，请同时进化评测协议上的对手。** 否则你发出去的，可能是一只分数很好看的坏天才。

## 参考

[1] Guojun Zhu, Xunheng Huang, Peng Yin, Jiahui Xie, Sanguo Zhang, Doudou Zhou. *Bad Genius: Counterfactual-Guided Harness Evolution Beyond Task-Specific Shortcuts*. arXiv:2609.18366v3, 2026-09-24. [https://arxiv.org/abs/2609.18366](https://arxiv.org/abs/2609.18366) · [HTML](https://arxiv.org/html/2609.18366)
