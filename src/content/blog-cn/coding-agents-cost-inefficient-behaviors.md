---
title: "Coding Agent 烧钱的三种习惯：被覆盖的检索、相似脚本、重跑测试"
description: "解读 Purdue arXiv:2609.30725：在 Claude Code 与 Mini-SWE-Agent 的 1200 条轨迹上，三种成本浪费行为覆盖 79%–98% 任务、最高占任务花费 22.75%；结构感知检索可能反抬成本，开发者设计的 Skills 约可翻倍于 agent 自合成。"
pubDate: 2026-09-28T16:40:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "agent-loop", "developer-tools"]
lang: "zh"
---

Coding agent 的账单，很多人先盯模型单价、缓存命中、路由策略。站内 [Harness 控成本](/cn/blog/control-the-harness-control-the-cost/) 谈的正是这一层：谁在选模型、谁在管 prompt cache、子代理默认跟谁。另一层浪费更隐蔽——**任务已经能过，轨迹里却反复做同一类「看起来合理」的动作**：再读一遍已经被读过的代码、再生成一份只改几行的脚本、在没改 patch 时把同一组测试又跑一遍。这些动作每次都不离谱，叠起来却会吃掉可观的 token 与墙钟时间。[1]

Purdue 的 Hu、Jiang、Liang、Dey、Wu、Tan 在预印本 [arXiv:2609.30725](https://arxiv.org/abs/2609.30725)（HTML：[全文](https://arxiv.org/html/2609.30725)）做了据作者称的**首次系统性轨迹行为成本研究**：在 SWE-bench Verified 上分析 Claude Code（CC）与 Mini-SWE-Agent（MSA）共 **1,200** 条轨迹（四个配置），标出三种反复出现的成本浪费行为——**subsumed retrieval（被覆盖的检索，SubRetrv）**、**similar script generation（相似脚本生成，SimScrpt）**、**test re-execution（测试重执行，ReTest）**；再在 held-out 的 Verified 与 Pro 上跑三类缓解，合计约 **1 万**条轨迹。主结论很硬：(1) 三种行为合计影响 **79.00%–98.00%** 的任务，最高占任务货币成本 **22.75%**；(2) 结构感知检索（以 CodeGraph 为代表）并不天然省钱，部分设定成本反而升到 **+28.14%**；(3) agent 自合成的 Skills（SynSkills）最多砍约 **22.32%**，且偏轨迹细节；(4) 开发者设计的高阶 Skills（DevSkills）在八个设定里有六个稳健降本 **7.88%–41.73%**，大约是 SynSkills 最大收益的两倍。[1]

本篇不是「又一篇 SWE-bench 刷分新闻」，而是把数字接到站内 harness / skills 线上：上午刚写的 [Exactly-Once 落在哪](/cn/blog/exactly-once-model-harness-tool-contract/) 切的是**副作用可靠性**；这篇切的是**轨迹层的重复花费**。对照阅读时，别把「省钱」和「不双写」混成同一药方。

## 三类行为合在一起有多贵

单独看 SubRetrv / SimScrpt / ReTest 容易低估。Table 1 的「任一行为」行把三者并起来：任务覆盖率从 CC 的 **79.00%** 拉到 MSA 若干配置的 **98.00%**；货币成本占比从约 **6.86%** 拉到最高 **22.75%**。也就是说，在最差的配置–任务组合里，大约五分之一的任务花费可以被标成「同一类可检测的重复劳动」，而不是「必要的探索」。[1]

时间分布也提示观测该往哪盯。SubRetrv 堆在轨迹前半——正是定位与读代码的阶段；ReTest 滑向中后段——开始用测试验 patch；SimScrpt 贯穿复现、改码与验证，不像前两者那样挤在一个窗口。若你的内部仪表只在「任务结束」看总 token，会错过「前半段检索重复」「后半段测试空转」这两种不同的修法。[1]

CC 在整体低效率水平上 consistently 更低，作者在附录里专门讨论原因。正文已经给出几条可核对的机制：内置「非必要不建文件」压住了落盘版 SimScrpt；带行号的 Read 与回报编辑结果的工具面压住了 Within-Sequence / Patch-Adjacent SubRetrv；子代理分工则把一部分 SubRetrv 变成 Cross-Agent 形态（摘要回传 → 主 agent 再读）。缓解评测里还有一条对称观察：**MSA 上干预收益通常更大，CC 的系统提示与工具抽象已经压掉一部分浪费，留给 Skills 的空间更小**；技能类方法在 Verified-200 上总体也好于 Pro-100——部分因为技能从 Verified 轨迹导出，迁到 Pro 有泛化压力。[1]

## 研究设计：先发现行为，再测缓解

作者把问题拆成三个 RQ。RQ1 问：coding agent 里有哪些可复现的成本浪费行为？RQ2 问：结构感知检索能不能压住检索类浪费？RQ3 问：agent 自合成的 Skills 与开发者手写的 Skills，谁更能压住三类行为与端到端花费？[1]

配置侧选了两条常见 harness 路线。**Claude Code（CC）** 配 Sonnet 4.6（文中记为 S46）；**Mini-SWE-Agent（MSA）** 分别配 S46、MiniMax-M3（MM3）、Qwen-3.5 Plus（Q35+）。RQ1 在各仓库按创建日期切出最早 **300** 道 SWE-bench Verified 任务，四配置共 **1,200** 条轨迹；动作标签用作者 taxonomy + 规则与 LLM 辅助，再对手标定行为检测器。缓解评测把同仓库剩余 **200** 道 Verified 留作 held-out（Verified-200），并另采 **100** 道 SWE-bench Pro（Pro-100，覆盖 11 个仓库、偏向更贵任务）；CodeGraph、SynSkills、DevSkills 都在这 300 道任务上重复跑，以吸收执行随机性。摘要写的「over 10k trajectories」指的就是这条缓解评测规模。[1]

轨迹归一化之后，作者按时间轴看三类行为的落点：SubRetrv 更集中在轨迹前半（检索重的阶段）；ReTest 偏向中后段（开始用测试验 patch）；SimScrpt 分布更散，贯穿复现、改码与验证。CC 在整体低效率水平上 consistently 更低——后文会看到，这和它内置的「少建文件」指引、带行号的 Read、以及子代理分工都有关，而不是「模型更聪明」一句能盖住。[1]

## 一张账单切片：django-13158

引言用 Claude Code 跑 SWE-bench Verified 的 `django-13158` 把问题钉死。任务要求修好 `QuerySet.none()` 在组合 queryset 上返回空结果。agent 把探索交给子代理、再取上下文、打 patch、用生成测试与仓库测试验证——任务最终通过，但三种浪费行为合起来占了该任务成本的 **17.25%**：[1]

1. **SubRetrv（6.96%）**：主 agent 又读了 `query.py` 20 行、`compiler.py` 85 行——这些内容其实已被子代理检索覆盖。
2. **SimScrpt（7.10%）**：生成四份高度相似的内联测试脚本，共享 21 行逻辑，只做小改动。
3. **ReTest（3.19%）**：在没更新 patch 的情况下，以相同方式把 `test_qs_combinators` 跑了八次，反复撞上同一模块错误。

这不是「模型偶尔抽风」。后文统计会显示：在 300 道分析集任务上，三类行为几乎成了默认模式；django 例子只是把机制摊开给人看。

## 行为一：SubRetrv——被覆盖的检索

定义很干净：对一次返回至少五行非空内容的检索 \(b\)，向前找最近一次返回上下文**完全覆盖** \(b\) 的检索 \(a\)，则把 \(b\) 标成一次 SubRetrv。Table 1 显示它是三者里最常见的：影响 **64.33%–92.33%** 的任务，每任务约 **2.15–6.37** 次，占任务成本 **5.01%–11.41%**；上限 **92.33% / 11.41%** 就是摘要里「最流行」那句的出处。[1]

机制随架构分叉（Table 2）。在 **CC** 上，**Cross-Agent SubRetrv**——主 agent 再读一遍子代理已经取过的代码——占其 SubRetrv 的 **50.15%**。根因很工程：子代理回的是**摘要**，不是原始代码；主 agent 后头要用细节时，只能再 Read 一遍。看起来像「协作税」，账单上就是重复输入。[1]

**MSA** 则是另一套故事：

- **Patch-Adjacent SubRetrv**（紧挨 patch 前后再读）：MSA 占 **17.96%–26.47%**，CC 仅 **8.67%**。MSA 靠 `sed -i` 或生成脚本改文件，反馈弱甚至静默失败，agent 只好再读一遍做定位或验改；CC 的编辑工具会回报更新后的代码与行号，这类场景更少。[1]
- **Within-Sequence SubRetrv**（同一段连续检索里先宽读再 zoom-in）：MSA 的 `cat` 不带行号，常跟 `grep -n` / `sed -n`；CC 的 `Read` 自带行号，少一轮「再取一遍」。[1]
- **Long-Distance SubRetrv**（两次检索相隔 ≥10 步）：长调试环里早期上下文被「忘了」再取；在 MSA<sub>MM3</sub> 上最突出（**52.40%**），与其最长平均轨迹（**77.99** 步 vs 其它配置 **29.99–58.06**）一致。[1]

Finding 1 的工程含义：砍 SubRetrv 不是加一个「更聪明的搜索工具」就完事——**子代理返回什么、编辑工具给不给反馈、定位命令有没有行号**，都会改重复读的形状。站内 [扩张 harness 而不是堆上下文](/cn/blog/grow-the-harness-not-the-context/) 强调把控制长进代码；这里多了一条：控制面还要管「已经读过什么」的可见性，否则主循环会用钱补信息缺口。

## 行为二：SimScrpt——相似脚本生成

SimScrpt 指：不编辑已有脚本，而是再生成一份高度相似的新脚本，浪费输出 token，也放弃复用。作者抽 ephemeral 脚本（如 `python -c`、heredoc）与落盘 `.py`，去掉空行与纯注释，保留 ≥5 行；对生成动作 \(b\)，找最近一次行级 Jaccard ≥ **0.60** 的前序脚本 \(a\)（阈值经每配置 20 对人工标定：更低易匹配到通用脚手架）。[1]

严重程度上限：**最多 68.00%** 任务出现，最多占任务成本 **9.57%**。差距几乎全在架构：MSA 上 **51.33%–68.00%** 任务、**7.91%–9.57%** 成本、每任务 **2.54–4.29** 次；CC 仅 **20.67%** 任务、**1.02%** 成本、**0.43** 次——频率上 MSA 是 CC 的约 **5.91–9.98×**。MSA 还有明显长尾：每配置有 **42–66** 道任务至少出现六次 SimScrpt，CC 只有两道。[1]

时间上，**39.89%–48.84%** 的发生紧接上一份相似脚本（典型是小改动却整份重生）；**21.71%–34.60%** 则隔了至少六步。形态上更有意思：ephemeral 脚本里 **81.03%–93.45%** 是 inspection probe（打印对象、属性、状态）；落盘脚本则更多 assertion test，MSA 上还有 patch script。CC 几乎只有 ephemeral——与其内置指引「NEVER create files unless they're absolutely necessary」一致；MSA 没有这条约束，就会反复重生测试与改码脚本。[1]

Finding 2 给 harness 的处方很直白：**可复用逻辑落盘并修订；一次性探针才用内联。** 这和站内 [Cloudflare 安全审计 Skill](/cn/blog/cloudflare-security-audit-skill-for-coding-agents/)、[Agent Skills 入门](/cn/blog/agentskills-io-starter-guide/) 谈的「把做法包成可复用单元」是同一方向——只是这里证据来自轨迹浪费，而不是安全清单。

## 行为三：ReTest——没改 patch 却重跑测试

作者按「两次 patch 之间」切窗口：新 patch 之后重跑测试可以合理；**同一窗口内、同一组测试、patch 未更新**的前序执行标为 ReTest，只保留最后一次作为可能决策相关。结果：影响 **49.67%–83.00%** 任务，最多占任务成本 **5.39%**；MSA<sub>MM3</sub> 最高频，平均每任务 **5.29** 次，超过其它配置两倍以上。[1]

三条常见原因：(1) **仓库测试知识缺口**——不熟悉 runner / 配置，反复踩同一失败；(2) **测试信号回收**——输出被截断、含糊或没被 agent 接住，只好再跑一遍「看清楚」；(3) **进度停滞**——长推理环不更新 patch，对着同一诊断反复测。django-13158 里八次同测，就是第三类的教科书形态。[1]

Finding 3 对产品侧的提醒：ReTest 不全是「模型固执」。输出截断策略、测试 harness 文档是否进上下文、失败时是否强制要求「先改再测」，都会改这条曲线。站内 [ECC 外围优化](/cn/blog/ecc-agent-harness-optimization/) 谈的是把循环外围做成可配置操作系统；这里可以加一条观测：**同 patch 指纹下的重复测试调用**，就是可报警的成本信号。

## 缓解一：结构感知检索可能反抬账单

直觉上，CodeGraph 一类结构感知检索该减少盲目翻文件，从而压 SubRetrv。RQ2 的结果泼了冷水：**它既不 consistently 降低 SubRetrv，也不改善任务成本效率。**[1]

在 CC 上，SubRetrv 在两个 benchmark 上都能掉 **75%+**，但成本在 Verified-200 升 **8.30%**，在 Pro-100 稳健升 **12.19%**。机制写在 Table 4：CodeGraph 把 LLM / 工具调用砍了约 **19.72%–23.21%** / **26.61%–31.47%**，可每次查询返回的 token 是其它检索的约 **8.2–16.6×**；总 token 几乎不动。同时，更便宜的 H45 子代理调用从每任务 **4.81 / 11.03** 掉到 **零**，主 agent（S46）调用几乎不变——等量 token 挪到单价约 **3×** 的 S46 上，账单反而涨。[1]

在 MSA 上更糟的一幕是**叠加而非替换**：部分设定里普通检索几乎不动，却额外加 **5.65–6.75** 次 CodeGraph 调用；冗长反馈把总 token 抬 **9.11%–29.29%**，成本稳健升 **8.39%–28.14%**（摘要里的 **+28.14%** 上限来自这里）。即便在「用 CodeGraph 替换普通检索」的设定里，冗长反馈也让总 token 几乎不降，成本与基线难分伯仲。Pass@1 大体不动（除 MSA<sub>Q35+</sub> 在 Verified-200 上 **+5.33** 个百分点）。[1]

Finding 4 的一句话版：**检索「更聪明」不等于端到端更便宜。** 要同时看反馈体积、工具怎么接入循环、以及模型编排有没有被悄悄改写（例如子代理被挤掉）。这和 [Harness 控成本](/cn/blog/control-the-harness-control-the-cost/) 的交叉定价故事同构：你以为在优化检索，实际在改「谁在烧哪一档费率」。

## 缓解二：SynSkills vs DevSkills——细节规则打不过高阶原则

Skills（Anthropic 意义上的 agent skills）是轻量干预：把指导预装进 system prompt，让 agent 在整条轨迹上自适应执行。作者试了两条路线。[1]

**SynSkills**：用各配置的骨干模型当轻量分析 agent，从 RQ1 轨迹蒸馏纠正规则，再经 Trace2Skill 收成配置专属技能集——规模约 **23–41** 条操作规则，内容很「贴地」：怎么处理失败的字符串替换、shell 引号、权限错误等。**DevSkills**：作者按 RQ1 发现手写**七条**跨配置通用行为原则——检索前先陈述具体假设、复用已有上下文、必要重读要说理（对 SubRetrv）；脚本落盘并修订而不是再生近副本（对 SimScrpt）；先搞懂测试 harness、接住输出、仅在代码变更或新证据出现时重跑（对 ReTest）。原则是：(1) 跨配置可泛化；(2) 压浪费但不牺牲任务表现。[1]

数字对比很干净。SynSkills 在八个设定里有三个稳健降本 **8.86%–22.32%**，没有稳健成本上升，也没有 Pass@1 崩掉——但天花板就是约 **22.32%**。DevSkills 在**六个**设定稳健降本 **7.88%–41.73%**，最大降幅约是 SynSkills 最大收益的两倍；行为层最大削减跨三类行为达 **38.57%–88.91%**（例如 Table 3 里 SimScrpt 出现 **-88.91%**、ReTest **-38.57%** 这类峰值）。Pass@1 仅见一处小跌：CC 在 Verified-200 上 **-1.50** 个百分点。以 MSA<sub>S46</sub> 为例，DevSkills 在两个 benchmark 上三类行为都降，SubRetrv 分别 **-51.52% / -43.57%**；同设定 SynSkills 只 **-11.38%**，甚至有一处 **+2.50%**。[1]

机制解释也很工程：SynSkills 留下低阶、轨迹特异的指令（何时用 ephemeral、何时覆盖脚本、怎么处理非 ASCII shell），换仓库就弱；DevSkills 用一条「持久化并复用工件，而不是再生近副本」盖住整类问题。Finding 5 因此不是「人比模型强」的鸡汤，而是可操作的分工：**从轨迹里挖证据，用人类抽象写成 trace-agnostic 原则，再预装进 harness。** 站内 [SpecHarness：规格握笔](/cn/blog/specharness-spec-holds-the-pen/) 谈规格控行为；这里是行为原则控花费——同一「把控制放进 harness，而不是指望模型下次自觉」的家族。

还有一个放大效应值得单独记：任务总成本的变化，往往比「行为归因成本」的变化更大。作者在图上拟合斜率约 **2.83**（Verified-200）与 **1.33**（Pro-100）。两条通道：(1) 少一次浪费动作会缩短轨迹，后续 LLM 调用少读一遍缓存上下文；(2) 被挡住的浪费动作还会触发未标注的连锁（例如一次 ReTest 会带出解读输出、重复诊断）。所以 DevSkills 的「行为层 -X%」在账单上可能变成更大的端到端节约——这也解释了为什么只盯单次工具价目表会低估 harness 级干预。[1]


## 三种缓解怎么排座次

跨配置、跨 benchmark 并排看，作者总结出三条模式。第一，缓解强度大体按 **CodeGraph → SynSkills → DevSkills** 递增：CodeGraph 对 SubRetrv 的削减不稳定，还在八个设定里有四个稳健抬高成本；SynSkills 中等节约；DevSkills 在任务成本与三类行为上都最宽。第二，收益依赖架构与 benchmark：MSA 上通常更大，CC 空间更小；Verified-200 上识别到的行为改善总体好于 Pro-100。第三，端到端任务成本的变化相对「行为归因成本」会被放大——前文斜率 **2.83 / 1.33** 说的就是这件事。[1]

这对选型很实用。若团队正准备「上一个代码图 MCP 来省钱」，先看 CodeGraph 故事：局部 SubRetrv 指标可以很好看（CC 上 **-75%+**），账单仍可能 **+8%–+12%**，因为反馈太胖、编排被改写。若团队准备「让 agent 自己从失败轨迹总结 Skills」，SynSkills 说明这条路有上限（约 **22.32%**）且细则难泛化。若团队愿意花一次人工，把 RQ1 式发现压成几条高阶原则预装进 harness，DevSkills 给出目前最稳的一侧：**六 / 八** 设定稳健降本，上限约 **41.73%**，行为层峰值可到 **88.91%**（SimScrpt）与 **38.57%**（ReTest）。[1]

Pro-100 上 CodeGraph 还有一个实现细节：13 道任务跑不起来，作者只在剩余 **87** 道上比——读表时别把「全 Pro-100」当成样本口径。[1]


## 和站内成本线怎么拼

站内已经有几块拼图，这篇补的是「轨迹习惯」那一块：

| 站内文 | 切的成本面 | 和本篇关系 |
| --- | --- | --- |
| [Harness 控成本](/cn/blog/control-the-harness-control-the-cost/) | 模型路由、缓存边界、子代理继承 | 互补：那边管「按哪档费率买」，这边管「同一档费率下买了多少重复动作」 |
| [扩张 Harness](/cn/blog/grow-the-harness-not-the-context/) | 把控制长进代码而非堆上下文 | SubRetrv 说明「上下文可见性」也是控制——子代理摘要会制造再读 |
| [ECC 外围优化](/cn/blog/ecc-agent-harness-optimization/) | 循环外围旋钮 | 可加三类行为检测器当仪表 |
| [Exactly-Once](/cn/blog/exactly-once-model-harness-tool-contract/) | 工具副作用恰好一次 | 不同切面：那边防双写，这边防同态重复劳动 |
| [Agent Skills / Cloudflare Skill](/cn/blog/agentskills-io-starter-guide/) | Skills 包装 | DevSkills 证据：高阶、跨轨迹原则 > 轨迹细则堆叠 |
| [SpecHarness](/cn/blog/specharness-spec-holds-the-pen/) | 规格控笔 | 同属「把控制放进 harness」；本篇控的是花费行为 |

拼完之后，企业侧可以有一条更完整的成本叙事：**路由与缓存决定费率形状，工具反馈与子代理契约决定重复读的形状，Skills 原则决定 agent 会不会主动避开三类浪费，契约层决定写副作用会不会双写。** 四条不要互相替代，也不要用一条 KPI（比如「上了代码图」）假装覆盖全部。

## 工程含义：观测、工具面、Skills 分层

把论文压成可落地的清单，而不是口号。

**1. 先建行为观测，再谈「省 token」。** SubRetrv / SimScrpt / ReTest 都有可操作的检测定义（覆盖检索对、Jaccard 脚本对、同 patch 窗口内同测）。在 CI 或内部评测里对采样轨迹打这三类标签，比只看 Pass@1 与总花费更能指出该改工具反馈还是该改 Skills。站内 [ECC](/cn/blog/ecc-agent-harness-optimization/) 的外围旋钮若配上这类仪表，才谈得上闭环。

**2. 工具面优先修「反馈缺口」。** CC 比 MSA 更少 Patch-Adjacent / Within-Sequence SubRetrv，很大程度因为 Read 带行号、编辑回报新代码。给 shell 编辑补 diff 回显、给 `cat` 类读取补行号、让子代理在需要时回传关键代码片段而不是只回摘要——这些改动不换模型，却直接改 SubRetrv 形状。反过来，往循环里塞一个返回特别冗长的「智能检索」，可能像 CodeGraph 一样：局部指标好看，总账单变差。

**3. Skills 分层：高阶原则默认开，轨迹细则当补丁。** DevSkills 七条原则已经覆盖三类行为；SynSkills 那种 23–41 条操作细则更适合当「某仓库 / 某失败模式」的补丁，而不是唯一策略。包装形态可参考 [Agent Skills 入门](/cn/blog/agentskills-io-starter-guide/) 与 [Cloudflare 审计 Skill](/cn/blog/cloudflare-security-audit-skill-for-coding-agents/)：原则进全局 skill，细则进项目级 skill，避免把一次轨迹里的 shell 引号技巧写成全体默认。

**4. 和「可靠性成本」分开记账。** 上午 [Exactly-Once](/cn/blog/exactly-once-model-harness-tool-contract/) 里，透明重试会把丢 ACK 变成双写——那是副作用正确性。本文的 ReTest / SimScrpt 是**同一状态下的重复劳动**。两者都叫「别盲目再来一次」，药方不同：前者要幂等键与契约；后者要假设驱动检索、工件复用、测前先改码。混用会开错单。

**5. 别用「换更强检索 / 让 agent 自己总结 Skills」当默认省钱按钮。** 论文在四配置 × 两 benchmark 上把这两条都测了：结构感知检索可到 **+28.14%** 成本；SynSkills 上限约 **22.32%** 且不如 DevSkills 稳。省钱杠杆仍在 harness 设计——工具语义、子代理契约、预装行为原则——与 [Harness 控成本](/cn/blog/control-the-harness-control-the-cost/) 的路由杠杆互补，而不是互相替代。


若要把论文检测器接到自己的评测集，可以用一条最小流水线：(1) 归一化轨迹里的检索返回文本与脚本正文；(2) 按覆盖关系打 SubRetrv、按 Jaccard 打 SimScrpt、按 patch 指纹窗口打 ReTest；(3) 把三类次数与归因 token/美元并到任务级报表；(4) 先改工具反馈或预装七条式原则做 A/B，再决定要不要上结构检索。注意论文的货币成本是按当时价目与轨迹计量的任务花费占比——复现时应用你自己的价目表重算，保留行为计数作跨价目可比的指标。[1]

## 局限与读法


写正式 blog 时我们刻意避开「又一篇刷分新闻」的写法：SWE-bench 分数几乎没被这篇论文当主角——Pass@1 在多数缓解设定上大体不动，故事在**行为与账单**。若你的内部看板仍只有 resolve rate，这篇最该催你加的，是三类浪费的任务覆盖率与归因花费占比；有了这两列，才谈得上「Skills 原则是否生效」而不是「感觉轨迹短了一点」。[1]

作者自己写明：预算只覆盖四配置、Verified 分析集与 100 道 Pro；更长时程、交互式任务上的行为与干预效果可能不同；CodeGraph 代表一类流行结构检索，不能外推到所有工具。读这篇时，把 **79%–98% / 22.75% / +28.14% / 7.88%–41.73% / ~2×** 当成「在本文设定下的量级」，接到自己的 harness 时先复现检测器，再决定要不要上 DevSkills 式原则。[1]

对站内内容线，这篇补的是 t248 那条「成本在 harness」叙事的行为解剖学：不是只有选错模型会烧钱，**选对了模型、任务也过了，轨迹习惯仍可吃掉两成上下的任务花费**。下一步若做内部评测，优先问三个问题——主循环是否在重读子代理已覆盖的代码？脚本是在修订还是在重生？同 patch 下测试是否在空转？——往往比再谈一轮价目表更接近可动手的工程。

## 参考文献

[1] Yiran Hu, Nan Jiang, Shanchao Liang, Anik Dey, Yi Wu, Lin Tan. *Analyzing and Mitigating Cost-Inefficient Behaviors in Coding Agents*. arXiv:2609.30725, 2026. <https://arxiv.org/abs/2609.30725>
