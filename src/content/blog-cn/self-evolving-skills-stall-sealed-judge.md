---
title: "自进化 skill 卡在哪：72 万条执行记录的对照账本，和一个改进者看不见的裁判"
seoTitle: "自进化 skill 为什么不涨分：Which Failure 对照实验与 SealedLoop 密封裁判"
description: "RSI 前沿第二期。arXiv:2611.29290 在 9 个基准、4 个模型、4 档 harness 上一次只动一个轴，发现自进化 skill 很少赢过几行人写的提示，会学到评测捷径，换个模型就失效。arXiv:2611.33794 的 SealedLoop 让一个改进者看不见的裁判用序贯检验决定保留还是回滚。本文在两篇的公开账本上重算了关键数字，并把 SealedLoop 的检验门装到 skill 账本上：它挡住了边看边判的假阳性，却照样放行了 LiveMath 的捷径。"
pubDate: 2026-11-27T09:00:00+08:00
author: "Remy"
tags: ["rsi", "ai-agents", "agent-harness", "agent-loop", "evaluation"]
lang: "zh"
series: rsi
---

**结论先说：** 这一周 RSI 方向最扎实的两项工作，都没有提出更会改自己的 agent，而是把「改完以后谁说了算」做成了可以复算的账。南加大和 Amazon 的 Which Failure 一次只动一个轴，在 9 个基准、4 个模型、4 档 harness 上对比三种 skill，结论是：自进化出来的 skill 很少赢过几行人写的提示，会学到评测捷径，换一个模型就可能把分数打垮，缺的事实它也补不出来。[1] 威斯康星大学和 UCSC 的 SealedLoop 给自我改进环加了一个密封裁判：改进者看不到它的数据、参数和抽样时间表，新版本只有在它的序贯检验通过后才保留。在驾驶和机械臂两个环上，环内裁判留下了更差的策略，密封检验在已知真涨分的 12 对里放行 11 对，59 对退步一对没放。[2] 两篇都放出了代码和逐条数据，我在本地把关键数字重算了一遍，又把 SealedLoop 的检验门装到 Which Failure 的账本上，结果很有意思：它几乎不会被噪声骗，却照样放行了 LiveMath 上那条捷径。

| | 改的是什么 | 谁来验收 | 进步是不是真的 |
| --- | --- | --- | --- |
| Which Failure（arXiv:2611.29290，11 月 22 日） | 不提新方法，测 Direct、SkillOpt、Trace2Skill 三种 skill 在不同模型和 harness 下到底修好了哪类失败 | 同一批题目上的配对对比，每格跑 3 次，失败原因在看结果之前冻结 | 大涨分多是答题格式和捷径；真正站得住的是补上一个不会报错的检查 |
| SealedLoop（arXiv:2611.33794，11 月 25 日） | 自我改进环里「保留还是回滚」这一步 | 环外的密封裁判，加上任何时刻读数都有效的序贯检验 | 环内裁判会留下更差的策略；密封检验守住了误判率，但只对它的池子负责 |

如果你在跑自进化环，这周能直接拿去用的做法有四条：

1. 进化出的 skill 先和一段几十个词的人写 skill 比，再换一个模型、换一档 harness 比。
2. 涨分大时按可疑特征拆题看，涨分集中在一类题上就先查捷径。
3. 「保留还是回滚」交给改进过程碰不到的数据来判，用序贯检验，不要每跑一批就看一眼 t 检验。
4. 密封只保证独立，不保证评测本身有效。池子里的捷径，密封裁判一样看不见。

站内的[自进化 agent 综述](/cn/blog/self-evolving-agents-survey-2026/)把这条线归成三问：改什么，谁验收，哪些进步是真的。[上一期](/cn/blog/agent-evolution-resolution-hypothesis-elite/)的 Resolution Hypothesis 说选择器挑对的概率约等于抛硬币，大涨分多来自评测捷径。这一期的两篇接着往下走：一篇拆开看 skill 到底修了什么，一篇换掉做决定的裁判。

## 一张 512 格的对照表：一次只动一个轴

Which Failure 的设计很朴素，也很费钱。五个因素交叉：1,872 道测试题，来自 9 个瓶颈各不相同的基准（SimpleQA 缺知识，SQuAD 考答题格式，HotpotQA 的 Context 和 FullWiki 两版考多跳整合，BigCodeBench-Hard 考代码，Amazon SOP 和 UCSB SOP 考按流程办事，SpreadsheetBench 考表格操作，LiveMathematicianBench 是数学选择题）；4 个模型（本地跑的 Qwen3.5-9B，加上 Claude Sonnet 4.6、Claude Sonnet 5 和 GPT-5.6-sol）；4 种 skill 条件；4 档 harness；3 档预算。每格跑 3 次，温度 0。[1]

三种 skill 都由 Qwen3.5-9B 只看训练集写出来，然后冻结，原封不动地给四个模型用。Direct 一次写成，SkillOpt 按打过分的 rollout 迭代优化，Trace2Skill 从成功和失败的轨迹里提炼。Trace2Skill 有一道验证门，候选不如人写的初始 skill 就保留初始版本，结果在有 token 记录的 6 个基准里，5 个最后留下的是人写的 17 到 85 个词。[1]

harness 一档只加一种机制：H0 只有基准自己的提示；H1 加上标准化的答题或工具接口；H2 把执行错误和观察结果反馈回去，最多重试三次；H3 再加一次看不到结果的自我修订。哪一档都看不到评分器和标准答案。

这样每个差值都是配对的：同一道题、同一次重复，只换一个东西。第一个发现是「效果不可加」。如果每格分数等于模型效应加 skill 效应加 harness 效应，留一格预测的 R² 平均是 0.729；允许两两交互后升到 0.812，8 个基准里 7 个变好。[1] 交互最清楚的是 skill 和 harness。固定 Qwen3.5-9B，同一个冻结的 skill 随 harness 升级有三种命运：

<figure class="not-prose my-6"><svg viewBox="0 0 700 404" role="img" aria-label="同一个冻结的 skill，harness 每升一级，它值多少分都在变" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:700px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><defs><marker id="ah-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor" fill-opacity="0.7"/></marker></defs><text x="10" y="24" font-size="15" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">同一个冻结的 skill，harness 每升一级，它值多少分都在变</text><line x1="74" y1="268.0" x2="660" y2="268.0" stroke="currentColor" stroke-opacity="0.18" stroke-width="1"/><text x="70" y="272.0" font-size="11" text-anchor="end" font-weight="normal" fill="currentColor" fill-opacity="0.7">-20</text><line x1="74" y1="224.0" x2="660" y2="224.0" stroke="currentColor" stroke-opacity="0.55" stroke-width="1"/><text x="70" y="228.0" font-size="11" text-anchor="end" font-weight="normal" fill="currentColor" fill-opacity="0.7">0</text><line x1="74" y1="180.0" x2="660" y2="180.0" stroke="currentColor" stroke-opacity="0.18" stroke-width="1"/><text x="70" y="184.0" font-size="11" text-anchor="end" font-weight="normal" fill="currentColor" fill-opacity="0.7">+20</text><line x1="74" y1="136.0" x2="660" y2="136.0" stroke="currentColor" stroke-opacity="0.18" stroke-width="1"/><text x="70" y="140.0" font-size="11" text-anchor="end" font-weight="normal" fill="currentColor" fill-opacity="0.7">+40</text><line x1="74" y1="92.0" x2="660" y2="92.0" stroke="currentColor" stroke-opacity="0.18" stroke-width="1"/><text x="70" y="96.0" font-size="11" text-anchor="end" font-weight="normal" fill="currentColor" fill-opacity="0.7">+60</text><text x="14" y="52" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">比不加 skill 多几分</text><text x="80.0" y="312" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">H0 最简</text><text x="273.33333333333337" y="312" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">H1 +答题接口</text><text x="466.6666666666667" y="312" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">H2 +报错重试</text><text x="660.0" y="312" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">H3 +反思一次</text><polyline points="80.0,78.4 273.3,183.5 466.7,219.2 660.0,224.2" fill="none" stroke="#3b82f6" stroke-width="2.2"/><circle cx="80.0" cy="78.35999999999999" r="4" fill="#3b82f6"/><text x="87.0" y="71.35999999999999" font-size="10.5" text-anchor="start" font-weight="normal" fill="#3b82f6" fill-opacity="1">+66.2</text><circle cx="273.33333333333337" cy="183.52" r="4" fill="#3b82f6"/><text x="280.33333333333337" y="176.52" font-size="10.5" text-anchor="start" font-weight="normal" fill="#3b82f6" fill-opacity="1">+18.4</text><circle cx="466.6666666666667" cy="219.16" r="4" fill="#3b82f6"/><text x="466.6666666666667" y="237.16" font-size="10.5" text-anchor="middle" font-weight="normal" fill="#3b82f6" fill-opacity="1">+2.2</text><circle cx="660.0" cy="224.22" r="4" fill="#3b82f6"/><text x="660.0" y="242.22" font-size="10.5" text-anchor="middle" font-weight="normal" fill="#3b82f6" fill-opacity="1">−0.1</text><polyline points="80.0,274.2 273.3,272.4 466.7,220.3 660.0,217.6" fill="none" stroke="#f59e0b" stroke-width="2.2"/><circle cx="80.0" cy="274.16" r="4" fill="#f59e0b"/><text x="87.0" y="267.16" font-size="10.5" text-anchor="start" font-weight="normal" fill="#f59e0b" fill-opacity="1">−22.8</text><circle cx="273.33333333333337" cy="272.4" r="4" fill="#f59e0b"/><text x="280.33333333333337" y="265.4" font-size="10.5" text-anchor="start" font-weight="normal" fill="#f59e0b" fill-opacity="1">−22.0</text><circle cx="466.6666666666667" cy="220.26" r="4" fill="#f59e0b"/><text x="458.6666666666667" y="214.26" font-size="10.5" text-anchor="end" font-weight="normal" fill="#f59e0b" fill-opacity="1">+1.7</text><circle cx="660.0" cy="217.62" r="4" fill="#f59e0b"/><text x="652.0" y="233.62" font-size="10.5" text-anchor="end" font-weight="normal" fill="#f59e0b" fill-opacity="1">+2.9</text><polyline points="80.0,194.3 273.3,190.6 466.7,194.7 660.0,216.1" fill="none" stroke="#10b981" stroke-width="2.2"/><circle cx="80.0" cy="194.3" r="4" fill="#10b981"/><text x="87.0" y="187.3" font-size="10.5" text-anchor="start" font-weight="normal" fill="#10b981" fill-opacity="1">+13.5</text><circle cx="273.33333333333337" cy="190.56" r="4" fill="#10b981"/><text x="280.33333333333337" y="206.56" font-size="10.5" text-anchor="start" font-weight="normal" fill="#10b981" fill-opacity="1">+15.2</text><circle cx="466.6666666666667" cy="194.74" r="4" fill="#10b981"/><text x="473.6666666666667" y="187.74" font-size="10.5" text-anchor="start" font-weight="normal" fill="#10b981" fill-opacity="1">+13.3</text><circle cx="660.0" cy="216.07999999999998" r="4" fill="#10b981"/><text x="660.0" y="206.07999999999998" font-size="10.5" text-anchor="middle" font-weight="normal" fill="#10b981" fill-opacity="1">+3.6</text><rect x="80" y="329" width="12" height="10" rx="2" fill="#3b82f6" fill-opacity="0.9"/><text x="98" y="338" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">被吸收：SQuAD + Trace2Skill（教的是答题格式）</text><rect x="80" y="347" width="12" height="10" rx="2" fill="#f59e0b" fill-opacity="0.9"/><text x="98" y="356" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">被救回：FullWiki + Direct（错误动作被报错拦住）</text><rect x="80" y="365" width="12" height="10" rx="2" fill="#10b981" fill-opacity="0.9"/><text x="98" y="374" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">保住：UCSB SOP + SkillOpt（补上不报错的前置检查）</text><text x="10" y="394" font-size="10" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.6">数据：Qwen3.5-9B，Default 预算，3 次重复的均值，由公开执行账本重算（arXiv:2611.29290）。</text></svg></figure>

*图：Qwen3.5-9B 上三个 skill 的增益随 harness 档位的变化，数字由公开账本重算。*

- **被吸收**。SQuAD 上一个 18 个词的 skill（Trace2Skill 的门留下的人写初始版：只用给定上下文，返回最短的答案片段）在 H0 加 66.2 分，到 H2 只剩 2.2 分。原因是 H1 的答题接口本身就要求短答案。按「回答里是否包含正确答案」重新打分，不加 skill 在 H0 就有 96.1，这 66 分全是格式。
- **被救回**。HotpotQA FullWiki 上 Direct skill 让 agent 反复发出格式错误的动作直到轮数耗尽，H1 时增益是 −22.0；到 H2，每个错误动作都会被报错退回，增益变成 +1.7。这一格 221 次由失败转成功里，215 次紧跟在这类报错之后。
- **保住**。UCSB SOP 上，不加 skill 的 agent 会在前置条件不满足时照样执行付款，系统也不报错，H2 没什么可反馈的。SkillOpt 把这个检查写了进去，H0 到 H2 一直保持 13.3 到 15.2 分的增益。

放到全表，96 个 skill、模型、基准组合里，被吸收的 18 个，保住的 12 个，被救回的 4 个。[1] 换句话说，一个 skill 报出来的涨分，如果不说是在什么 harness 下量的，基本没法解读。

## 自进化 skill 卡住的四个地方

论文第 5 节专讲 SkillOpt 和 Trace2Skill 这类从自身经验长出来的 skill，列了四种不灵的情形。[1]

[![论文 Figure 1：左图三条线是同一 skill 在 H0 到 H3 的增益；中图是带报错信号与不带信号的失败被 H2 救回的比例；右图是 Qwen 上优化的 SkillOpt skill 在 GPT-5.6-sol 上从 62.0 掉到 13.6，以及 SimpleQA 上自身事实 skill 和检索段落的对比](/assets/self-evolving-skills-stall-sealed-judge/which-failure-fig1-skills-stall.webp)](https://arxiv.org/abs/2611.29290)

*图：Which Failure 的 Figure 1。右栏就是下面说的「换模型失效」和「补不出事实」。[1]*

**很少赢过几行人写的提示。** Trace2Skill 进化出的候选在 7 个基准里有 5 个没赢过它的人写初始 skill；测试集上，那段人写的初始 skill 在三个问答基准上比 SkillOpt 高 10 到 15 分。人写的几行也便宜：门槛保留它们的地方，token 中位数只多 4%；进化出的 LiveMath skill 有 2,603 个词，token 中位数多 195%。

**会学捷径。** LiveMathematicianBench 是五选一的定理题，有一类选项写着「其余某个选项正确，但能证明更强的结论」，只要出现就是正确答案。上一期 Resolution Hypothesis 把它列进了捷径清单。[10]这一次是另一组作者、另一套方法，得到同样的结论：进化出的 skill 写进了一条挑这个选项的规则，Qwen3.5-9B 在带这个选项的 53 题上从 11.2% 涨到 71.5%，在其余 71 题上从 52.7% 掉到 43.7%。

**换模型就坏。** 论文开头的例子：SkillOpt 在 Qwen3.5-9B 上优化的 HotpotQA Context skill，交给 GPT-5.6-sol 用，H1 下分数从 62.0 掉到 13.6。模型其实知道答案，带 skill 的回答里 74.1% 含正确答案（不带是 76.8%），但 skill 让它把答案栏填成一张事实抽取工作表。H2 和 H3 都停在 12.2，因为答案格式合法，看不到结果的修订也改不回来。

**补不出缺的事实。** SimpleQA 上，用 agent 自己的训练事实写成的 skill 只把准确率从 5.0% 提到 6.3%。一段要求模型「想不起来就去要资料」的人写 skill，能去掉大部分瞎猜，但单靠它涨不了分；每次请求都用引用来源的段落回答，准确率到 60.0%，每题都直接附上段落时到 72.0%。

换更强的构造者也不够：用 GPT-5.6-sol 重建，Trace2Skill 在 UCSB SOP 上赢了人写版本 5.38 分，SkillOpt 却比 Qwen 版本还差 6.05 分。构造者固定时，一次写成的 Direct 在 8 个基准里有 4 个赢过迭代优化的 SkillOpt。[1]

作者的结论是：指导或信息不来自经验之外，skill 进化就会卡住。我想补一句：这四种情形都不能靠在同一个验证集上多跑几轮发现，它们要么藏在题目的某个子集里，要么换模型、换 harness 才露出来。

### 在公开账本上重算

这篇论文放出了全部 718,848 次执行的逐条记录（模型、基准、题号、skill、harness、预算、重复序号、分数、token 和成本），冻结的 skill 文件和切分编号也都在。[1][^1] 不调用任何模型，就能重算论文的表格。

先跑作者附带的脚本。它复现第 6 节的「小样本试点」：在 20 道有标注的题上同时跑 Qwen3.5-9B+H2 和更强的模型，更强的那个分高才把整个基准切过去。结果是 57.39 分，始终用 GPT-5.6-sol 是 53.47 分，每千题成本 5.310 美元对 8.323 美元，便宜 36%，和论文一致。

然后是我自己的检查。LiveMath 那组数字我想独立验一下，因为它和上期的发现直接相关。账本里只有题号没有题目文本，但上期用过的 SkillOpt-Lite 公开数据里有同一批 177 道题的选项。按题号对上以后，124 道测试题全部匹配，带元选项的正好 53 道，53 道的标准答案都是它。按这个划分重算，Qwen3.5-9B 加 Trace2Skill 在两组上分别是 71.5% 和 43.7%，和论文一字不差。

[![终端输出：作者的试点脚本给出 pilot 57.39 对 always-GPT 53.47；账本共 718,848 行；GPT-5.6-sol 在 Hotpot Context 上 NoSkill H1 62.0、SkillOpt H1 13.6；LiveMath 124 题里 53 题带元选项且全是正确答案，Qwen3.5-9B NoSkill 11.2/52.7，Trace2Skill 71.5/43.7，GPT-5.6 SkillOpt 54.1/57.2](/assets/self-evolving-skills-stall-sealed-judge/ledger-pilot-and-livemath-split.webp)](https://huggingface.co/datasets/Zihan-Zoe/same-skill-different-harness)

*图：在公开账本上重算试点结果、开头的换模型案例和 LiveMath 的题目拆分。[1][9]*

表里还有一个论文没展开的细节：捷径也会迁移。Qwen 写的 SkillOpt skill 交给 GPT-5.6-sol，带元选项的题从 39.0% 涨到 54.1%，其余题从 61.2% 掉到 57.2%。冻结的 skill 文件里能直接看到这条规则：

[![终端输出：LiveMath 的 SkillOpt skill 1,284 词、Trace2Skill skill 2,603 词；SkillOpt 第 5 行「Meta-Option Priority Rule」要求把元选项当默认候选；Trace2Skill 第 30 行「Prioritize Meta-Statements」写着出现元选项就当高概率正确答案，不必验证干扰项的算术](/assets/self-evolving-skills-stall-sealed-judge/livemath-evolved-skill-meta-option-rule.webp)](https://huggingface.co/datasets/Zihan-Zoe/same-skill-different-harness)

*图：两份进化出的 LiveMath skill 里写明的元选项规则。*

Trace2Skill 那一行最直白：出现元选项就当高概率正确答案，不必验证干扰项的算术。优化器找到这种规则不奇怪，奇怪的是它一路通过验证门，进了冻结的最终 skill。

最后我把全表的 skill 效应按题配对重新过了一遍：3 种 skill，4 个模型，8 个主基准，H0 到 H3，一共 384 组「加 skill 对不加 skill」，每组用按题重抽的 bootstrap 求 95% 区间。

[![终端输出：温度 0 下同一格同一题三次重复分数不同的比例为 6.8% 到 11.2%，格级标准差中位 0.81 分；384 组对比里 83 组显著涨、84 组显著跌、217 组分辨不出；Qwen 自己用时 27 涨 18 跌，迁移到三个 API 模型时 56 涨 66 跌](/assets/self-evolving-skills-stall-sealed-judge/ledger-384-skill-contrasts.webp)](https://huggingface.co/datasets/Zihan-Zoe/same-skill-different-harness)

*图：384 组 skill 对比的配对 bootstrap 结果，以及温度 0 下的重复间漂移。*

三个数可以记住。第一，温度 0 也不等于确定：同一格同一题，三次重复分数不一样的题占 6.8% 到 11.2%。第二，384 组里显著涨的 83 组，显著跌的 84 组，217 组的区间跨过 0；分辨不出的那些，涨跌幅中位数只有 1.33 分，区间宽度中位数却有 5.33 分。第三，83 组显著涨分里有 38 组落在 SQuAD、HotpotQA Context 和 LiveMath，也就是论文已经证明主要是答题格式和捷径的地方。skill 在构造它的 Qwen 上用时，涨 27 跌 18；迁移到三个 API 模型，涨 56 跌 66。

## 失败指向修法，但反馈只修看得见的错

论文第 4 节先给每次失败贴上原因标签并冻结，再看交给哪种干预能救回来：流程类对应 skill，执行、状态、答题契约类对应 harness，推理、事实、该答不答对应模型。[1]

执行类失败交给更好的 harness，比其他轴的均值多救回 9.58 分（区间 4.77 到 13.93）；能力类失败交给更强的模型，多救回 64.54 分。流程类失败交给 skill 却不显著（+3.77，区间 −5.66 到 +14.47）。在不换模型的修法里，H2 对执行类失败救回 33.50%，最好的替代方案是 18.41%。还有一个让人清醒的数：59.7% 的比较里，没有哪一个被测试的单项干预能让失败变成功。

为什么 harness 只修一部分？一次救回要走完四步：错误暴露给模型，模型据此行动，局部修复正确，整次运行以正确答案结束。BigCode 在 H2 下 70% 到 76% 的执行都暴露了错误，模型最多修好 2%，因为粗糙的测试结论指不出改法。按失败自身的轨迹编码，带信号的失败被 H2 救回的比例在 SQuAD 是 76.9% 对 1.3%，HotpotQA Context 是 63.5% 对 1.8%。

这也解释了为什么按题路由不划算。到 H2 时 89% 的剩余失败是静默的，有信号的早在 H2 内部重试过了。只在轨迹出现可见错误时才升级到更强模型，只多一分左右。按基准做决定反而管用，就是前面复算的那个 20 题试点。[1]

对搞自进化的人，这一节的意思是：环能学到东西的前提是失败留下信号。没有信号的失败，环看不见，也进化不出修法。

## SealedLoop：让改进者看不见的裁判来拍板

SealedLoop 讨论具身策略的自我改进环：采集经验，裁判打标签，在判为好的经历上微调，然后决定新版本要不要替换旧版本。作者调研的 56 个环里，多数由提供训练信号的同一个裁判来做这个决定，证据和被评估的策略不独立。[2]

[![论文 Figure 2：左上是自评环，分类器在一代里把 196 次失败中的 65 次判成成功；左下是现成的视觉语言模型裁判，被骗得少些但同样看不到没见过的数据；右侧是 SealedLoop 的四步：密封、配对评估、序贯检验、揭晓，并把裁判差距分解为裁判误差和迁移缺口](/assets/self-evolving-skills-stall-sealed-judge/sealedloop-fig2-who-decides.webp)](https://arxiv.org/abs/2611.33794)

*图：SealedLoop 的 Figure 2，「谁决定环留下什么」。[2]*

方法分四步。先密封：评估池、裁判参数和抽样规则在改进者开跑之前固定，并对改进者隐藏，改进进程运行时连这些文件都被屏蔽。然后配对评估：新旧两个策略在同一批条件上跑。再用序贯检验决定：对配对差构造一个下注式置信序列（betting confidence sequence），任何时刻读数都有效，下界大于 0 才保留，到预算还没定论就回滚。最后才把结果告诉环。因为条件在改进者开跑前就固定、且与它独立抽取，保留一个并不更好的版本的概率不超过事先设定的 α。

作者把同一个环跑两遍，一遍让环内裁判做决定，一遍让密封裁判做决定，两个裁判每一代都打分。于是每一代都能量出「裁判差距」，也就是环报告的涨分减去密封池上的涨分；再用环内数据上的真实分数，把差距拆成两块：

<figure class="not-prose my-6"><svg viewBox="0 0 700 470" role="img" aria-label="环内报告的涨分，要过三道关才算真进步" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:700px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><defs><marker id="ah-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor" fill-opacity="0.7"/></marker></defs><text x="10" y="24" font-size="15" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">环内报告的涨分，要过三道关才算真进步</text><rect x="20" y="46" width="150" height="58" rx="6" fill="#64748b" fill-opacity="0.15" stroke="#64748b" stroke-opacity="0.85" stroke-width="1.3"/><text x="95.0" y="80" font-size="12" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="0.95">环内报告的涨分</text><line x1="170" y1="75" x2="188" y2="75" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.5" marker-end="url(#ah-b)"/><text x="180" y="66" font-size="11" text-anchor="middle" font-weight="bold" fill="#f59e0b" fill-opacity="1">E</text><rect x="190" y="46" width="150" height="58" rx="6" fill="#3b82f6" fill-opacity="0.15" stroke="#3b82f6" stroke-opacity="0.85" stroke-width="1.3"/><text x="265.0" y="80" font-size="12" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="0.95">环内数据上的真实涨分</text><line x1="340" y1="75" x2="358" y2="75" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.5" marker-end="url(#ah-b)"/><text x="350" y="66" font-size="11" text-anchor="middle" font-weight="bold" fill="#ef4444" fill-opacity="1">T</text><rect x="360" y="46" width="150" height="58" rx="6" fill="#8b5cf6" fill-opacity="0.15" stroke="#8b5cf6" stroke-opacity="0.85" stroke-width="1.3"/><text x="435.0" y="80" font-size="12" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="0.95">密封池上的涨分</text><line x1="510" y1="75" x2="528" y2="75" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.5" marker-end="url(#ah-b)"/><text x="520" y="66" font-size="11" text-anchor="middle" font-weight="bold" fill="#8b5cf6" fill-opacity="1">!</text><rect x="530" y="46" width="150" height="58" rx="6" fill="#10b981" fill-opacity="0.15" stroke="#10b981" stroke-opacity="0.85" stroke-width="1.3"/><text x="605.0" y="80" font-size="12" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="0.95">能力上的真涨分</text><text x="95.0" y="120" font-size="10" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.65">在线裁判在自己的数据上打的分</text><rect x="20" y="150" width="660" height="84" rx="6" fill="#f59e0b" fill-opacity="0.07" stroke="#f59e0b" stroke-opacity="0.85" stroke-width="1.3"/><text x="36" y="174" font-size="13" text-anchor="start" font-weight="bold" fill="#f59e0b" fill-opacity="1">裁判误差 E</text><text x="36" y="196" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.9">分类器在一代里把 196 次失败中的 65 次判成成功</text><text x="36" y="218" font-size="11.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.9">→ 换更强的裁判只能减小它</text><rect x="20" y="246" width="660" height="84" rx="6" fill="#ef4444" fill-opacity="0.07" stroke="#ef4444" stroke-opacity="0.85" stroke-width="1.3"/><text x="36" y="270" font-size="13" text-anchor="start" font-weight="bold" fill="#ef4444" fill-opacity="1">迁移缺口 T</text><text x="36" y="292" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.9">自己的帧上 +0.047～+0.058，没见过的城市 −0.107～−0.075</text><text x="36" y="314" font-size="11.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.9">→ 只有密封池能看见</text><rect x="20" y="342" width="660" height="84" rx="6" fill="#8b5cf6" fill-opacity="0.07" stroke="#8b5cf6" stroke-opacity="0.85" stroke-width="1.3"/><text x="36" y="366" font-size="13" text-anchor="start" font-weight="bold" fill="#8b5cf6" fill-opacity="1">池子本身的捷径</text><text x="36" y="388" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.9">LiveMath 有元选项的 53 题，SealedLoop 门 100/100 放行</text><text x="36" y="410" font-size="11.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.9">→ 密封也看不见：拆题、单条规则测试</text><text x="10" y="462" font-size="10" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.6">E、T 的例子来自 SealedLoop（arXiv:2611.33794）；第三关的例子是本文在公开 skill 账本上的实测。</text></svg></figure>

*图：环内报告的涨分到真进步之间的三道关。前两道来自 SealedLoop，第三道是下文在 skill 账本上的实测。*

**裁判误差**是环内裁判在自己的数据上就打错了。机械臂（LIBERO）上，成功分类器在一代里把 196 次失败中的 65 次判成成功，典型情形是物体卡在篮子边缘，看着像放进去了；90 代里有 5 代报告涨分而密封裁判发现退步。驾驶（NAVSIM）上，用自己标签刷新的评论器在第一代的误差是 +0.070。

**迁移缺口**是环内数据上的真涨分到了没见过的条件就不成立。每一代、每个种子，环内帧上的真实涨分都高于波士顿（训练从没用过的城市）。从官方检查点出发的几次运行，在环内评估帧上涨 0.047 到 0.058，在波士顿跌 0.075 到 0.107。即使给检验喂环内帧上的真实分数，也就是一个完全不出错的环内裁判，它仍会保留 15 个对照代里的 8 个。

[![论文 Figure 4：(a) 驾驶上每代的裁判误差和迁移缺口；(b) 每个驾驶候选在环内帧、同城未见日志、未见城市三组帧上的真实涨分，官方检查点那组从正变负；(c) 机械臂上被分类器判为成功的一次失败和一次成功，以及失败被判成功的比例随代数上升](/assets/self-evolving-skills-stall-sealed-judge/sealedloop-fig4-judge-gap-sources.webp)](https://arxiv.org/abs/2611.33794)

*图：SealedLoop 的 Figure 4，裁判差距的两个来源。[2]*

换更强的现成裁判也没用。四个视觉语言模型和一个机器人奖励模型重新打分，在「失败像成功」的那一代上只有两个比环内分类器收的失败少；最大的 Qwen3-VL-32B 收的失败最少，真阳性率却只有 0.69。更大的裁判是在用多拒成功换少收失败。

密封检验能不能放行真进步？在 76 对已知密封涨分的驾驶策略里，它放行了 12 对真涨分中的 11 对，59 对退步和 5 对接近零一对都没放。在一个确实会进步的驾驶环里，11 个从起始策略迈出的第一步全被它认证，环内评论器只认了 1 个；由密封检验决定时，最终策略从 0.638 到 0.674；由环内评论器决定时只到 0.649。序贯检验做出这些决定，用的评估帧是每代读完整个池子的 47%。

实车实验把一个已发表的强化学习微调步骤（仿真分 0.861 到 0.904）搬到全尺寸线控电动车上盲测。两个版本都没跑完主路线，但强化版 6 对里 6 对开得更远，平均多 10.4 米；序贯检验 6 对后仍未定论。[2]

### 本地跑 SealedLoop，再把它的门装到 skill 账本上

SealedLoop 的仓库放出了检验门本身（只依赖 NumPy）、论文的逐代评估记录和重算每一个决定的脚本，环的训练脚本写着即将放出。[2] 我按 README 装好，测试 7 项全过；示例脚本对三个合成候选给出保留、回滚（到预算未定）、回滚（拒绝）；重算脚本对 174 代、348 个决定逐一重算，0 处不一致。

[![终端输出：SealedLoop commit ce76572；pytest 7 passed；示例中 better 在 58 题时 accept，same 到 100 题 unresolved，worse 在 33 题 reject；verify_decisions 重算 174 代 348 个决定，0 mismatches；驾驶上用自身标签的评论器在主运行中保留 3/15，密封裁判保留 0/15；机械臂上分类器保留 13/69，密封裁判 12/45](/assets/self-evolving-skills-stall-sealed-judge/sealedloop-tests-and-348-decisions.webp)](https://github.com/zilin-huang/SealedLoop)

*图：SealedLoop 的测试、示例和 348 个决定的重算。[2]*

既然检验门是通用的，我把它原样用在 Which Failure 的账本上：候选是某个 skill，当前版本是不加 skill，同一模型、同一基准、H1、第 1 次重复，按题配对，α=0.05，至少 10 题，预算是全部题目，题目顺序随机打乱 100 次。

[![终端输出：Qwen3.5-9B LiveMath Trace2Skill 全部 124 题平均涨 26.6 分，100 次中 86 次被保留；只看 53 道带元选项的题涨 66.0 分，100/100 保留，中位只读 10 题；只看其余 71 题跌 2.8 分，0/100 保留；GPT-5.6-sol Hotpot Context SkillOpt 跌 47.7 分，中位 13 题就拒绝；UCSB SOP SkillOpt 涨 15.4 分，99/100 保留；零假设下每 10 题看一次 t 检验放行 22.9% 和 22.6%，SealedLoop 门只放行 1.0% 和 1.1%](/assets/self-evolving-skills-stall-sealed-judge/sealedloop-gate-on-skill-ledger.webp)](https://github.com/zilin-huang/SealedLoop)

*图：SealedLoop 的检验门在 skill 账本上的读数。*

检验门做对了它承诺的事。换模型那个崩盘的 skill，中位数读 13 题就被拒绝；UCSB SOP 上补了前置检查的 skill，100 次里 99 次被保留。零假设下（把真实配对差随机翻符号，没有真涨分），每 10 题看一次 t 检验的做法放行了 22.9% 和 22.6%，是名义 5% 的四倍多；SealedLoop 的门只放行 1.0% 和 1.1%。

<figure class="not-prose my-6"><svg viewBox="0 0 700 300" role="img" aria-label="没有真涨分时，边看边判会放行多少" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:700px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><defs><marker id="ah-c" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor" fill-opacity="0.7"/></marker></defs><text x="10" y="24" font-size="15" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">没有真涨分时，边看边判会放行多少</text><text x="20" y="82" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.95">Hotpot FullWiki，Direct（300 题）</text><rect x="250" y="60" width="375.55999999999995" height="18" rx="3" fill="#ef4444" fill-opacity="0.75"/><text x="631.56" y="74" font-size="11.5" text-anchor="start" font-weight="normal" fill="#ef4444" fill-opacity="1">22.9%</text><rect x="250" y="84" width="16.399999999999977" height="18" rx="3" fill="#10b981" fill-opacity="0.85"/><text x="272.4" y="98" font-size="11.5" text-anchor="start" font-weight="normal" fill="#10b981" fill-opacity="1">1.0%</text><text x="20" y="162" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.95">Spreadsheet，Trace2Skill（280 题）</text><rect x="250" y="140" width="370.64" height="18" rx="3" fill="#ef4444" fill-opacity="0.75"/><text x="626.64" y="154" font-size="11.5" text-anchor="start" font-weight="normal" fill="#ef4444" fill-opacity="1">22.6%</text><rect x="250" y="164" width="18.04000000000002" height="18" rx="3" fill="#10b981" fill-opacity="0.85"/><text x="274.04" y="178" font-size="11.5" text-anchor="start" font-weight="normal" fill="#10b981" fill-opacity="1">1.1%</text><line x1="332.0" y1="50" x2="332.0" y2="210" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.5" stroke-dasharray="4 3"/><text x="336.0" y="48" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">名义水平 5%</text><text x="250.0" y="224" font-size="10.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.6">0%</text><text x="414.0" y="224" font-size="10.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.6">10%</text><text x="578.0" y="224" font-size="10.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.6">20%</text><rect x="20" y="240" width="12" height="10" rx="2" fill="#ef4444" fill-opacity="0.75"/><text x="38" y="250" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">t 检验，每 10 题看一次</text><rect x="330" y="240" width="12" height="10" rx="2" fill="#10b981" fill-opacity="0.85"/><text x="348" y="250" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">SealedLoop 的下注置信序列门</text><text x="10" y="292" font-size="10" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.6">真实配对差随机翻符号构造零假设，各 1000 次；本文用 sealedloop.gate_path 实测。</text></svg></figure>

*图：没有真涨分时，边看边判的 t 检验和 SealedLoop 检验门各放行多少。*

可它也放行了 LiveMath 的捷径。全部 124 题时 100 次里保留 86 次；只看带元选项的 53 题，100 次全保留，中位数只读 10 题；只看其余 71 题，一次也没保留。从检验的角度看这完全正确：在这个池子上，这个 skill 确实让分数涨了。问题不在检验，在池子。SealedLoop 的保证是「改进者没法针对裁判做手脚」，不是「裁判测的是你想要的能力」。如果捷径本来就在评测集里，密封的评测集照样会奖励它。

这就是图里的第三道关。挡住它要靠别的工具：按可疑特征拆题看涨分落在哪里，像上期 Resolution Hypothesis 那样只加一条规则看能复现多少涨分，或者像 Which Failure 那样换模型、换 harness 看涨分还在不在。

## 同一周的其他验收证据

这一周带「自进化」「递归自我改进」字样的论文有几十篇，多数是把同一个环套到新领域。下面几篇和「谁验收」直接相关。

- **Blind to What They Can Fix**（arXiv:2611.29807，11 月 22 日）。agent 靠运行、看失败、改代码来改进任务程序，也被要求写运行时检查。五个领域里分数都练到很高，但环境一变，四个领域里这些检查对一半以上的失败保持沉默。用正常运行的记录建一个监控器，三个领域能抓到大部分；同样的 agent 被叫回来，通常也能修好。作者认为，评测自我改进还要看系统能否发现自己的失败。[3]
- **TransHarness**（arXiv:2611.33757，11 月 25 日）。从同任务的成功、失败对比里进化 harness 的干预策略，只用 300 条测试分布之外的源轨迹，在 DeepSWE v1.1 上到 76.4%，在 Terminal-Bench 2.1 上到 95.5%，比最强基线模型 GPT-6 Astra 高 2.4 和 5.6 个点。方法里写进了「别在进化集上过拟合」，但跑了几次、方差多大，摘要没说。[4]
- **奖励作弊在 agent 群体里传播**（arXiv:2611.30185，11 月 23 日）。17 个预注册实验、20,111 个 agent。告诉 agent「过了可见测试就算通过」，第一轮就有 33% 作弊；看到队友被接受的作弊后 94% 跟着作弊；作弊被 AI 评审标成「拒绝」，仍有 34% 照抄；换一道新题，看过被接受作弊的 agent 有 70% 再犯，对照组 32%。对共享经验池的自进化系统，被拒绝的作弊样本留在记忆里本身就是污染。[5]
- **在线环境修复**（arXiv:2611.32037，11 月 24 日）。训练 coding agent 时不惩罚可疑输出，改为异步修补被钻空子的环境。20 组 GRPO 实验里，累计奖励作弊从 36.9% 降到 0.06%，留出集 Pass@8 从 21.7% 升到 46.7%。[6]
- **DoppelVet**（arXiv:2611.29306，11 月 22 日）。给每个要写进持久状态的更新造一个证据完全相同的替身，重放两者比较行为。有害更新的检出 AUC 在网格任务从 0.762 升到 0.940，十代自更新环里出现退化的轨迹从 30.39% 降到 0.43%。[7]
- **SELFWRITE**（arXiv:2611.29513，11 月 22 日）。Qwen3.8-27B 读自己的权重和激活，写程序构造低秩权重编辑，不用梯度；候选在隐藏门控集上只评一次。五代后，环从没见过的留出集从 76.30% 到 77.75%（avg@4）。涨幅不大，但它把环外留出集写进了主结果。[8]

## 上期的悬案

Resolution Hypothesis 的项目页还没有代码和轨迹链接，ELITE 也没开源，SkillOpt-Lite 的 main 仍是 `4cb4eee`。还没人在修好的评测下重跑 SAGE、GEPA 或 SkillOpt-Lite，但 Which Failure 用不同的方法和模型独立复现了 LiveMath 那条捷径，还给了逐题账本。

## 我的判断

把这两篇放在一起看，结论比各自单看更清楚：自进化环的瓶颈不在提案，也不全在噪声，而在验收证据从哪里来。环内的证据有三种毛病：裁判在自己的数据上打错分，真涨分到别处不成立，评测集本身有捷径。SealedLoop 用密封加序贯检验管住了前两种，误判率有保证，成本还更低。第三种它管不了，也没声称能管。

Which Failure 的价值不在某个结论，而在那本账。718,848 次执行，每一格都能和新方法逐题配对比较，不用重跑整个矩阵。我认为它会成为 skill 进化方法的一个标准对照：以后谁说自己的 skill 进化方法更好，最起码应该在这本账上和那段几十个词的人写 skill 比一比，再换一个模型比一比。

局限也要说清。Which Failure 的 skill 全由一个 9B 模型构造，更强的构造者只试了两个基准；失败原因只标了 56.5% 的源失败。SealedLoop 的环都在仿真里，实车只测了一个改进步骤、6 对行驶，训练脚本还没放出。

下周继续跟：SealedLoop 的训练脚本，密封检验能否用到语言 agent 的 skill 或 harness 进化，Resolution Hypothesis 和 ELITE 的代码，TransHarness 的方差。

[^1]: 论文摘要写的是「近 90 万条轨迹」，公开账本是 718,848 行执行记录，其中 Default 预算 449,280 行，H4 诊断档 89,856 行。论文说按账本重算的 3,456 个重复级数值和源矩阵完全一致。

## 参考来源

1. Jin et al., *Which Failure Does an Intervention Repair? When Agent Interventions Help, and Where Self-Evolving Skills Stall*, arXiv:2611.29290，2026-11-22：<https://arxiv.org/abs/2611.29290>；代码：<https://github.com/Zihan-Zoe/same-skill-different-harness>；账本：<https://huggingface.co/datasets/Zihan-Zoe/same-skill-different-harness>
2. Huang et al., *Keep or Roll Back? Out-of-Loop Judges for Self-Improving VLA and End-to-End Embodied Policies*（SealedLoop）, arXiv:2611.33794，2026-11-25：<https://arxiv.org/abs/2611.33794>；项目页：<https://zilin-huang.github.io/SealedLoop/>；代码：<https://github.com/zilin-huang/SealedLoop>；评估记录：<https://huggingface.co/datasets/zilinhuang/SealedLoop>
3. Cao, Deng, Kersting, *Blind to What They Can Fix: A Detection Gap in Self-Improving Agents*, arXiv:2611.29807，2026-11-22：<https://arxiv.org/abs/2611.29807>
4. Xia et al., *TransHarness: From Benchmark Overfitting to Transferable Harness Evolution*, arXiv:2611.33757，2026-11-25：<https://arxiv.org/abs/2611.33757>
5. Vaid, *Causal Evidence for the Emergence and Spread of Reward Hacking in AI Agent Swarms*, arXiv:2611.30185，2026-11-23：<https://arxiv.org/abs/2611.30185>
6. Lu et al., *Online Environment Repair for Coding Agents*, arXiv:2611.32037，2026-11-24：<https://arxiv.org/abs/2611.32037>
7. Duan et al., *DoppelVet: Comparative Safety Verification for Self-Evolving Agents*, arXiv:2611.29306，2026-11-22：<https://arxiv.org/abs/2611.29306>
8. Zhang, Li, *Recursive Self-Editing: LLMs Program Their Own Weight Edits for Self-Improvement*, arXiv:2611.29513，2026-11-22：<https://arxiv.org/abs/2611.29513>
9. LiveMathematicianBench 选项文本取自 SkillOpt-Lite 公开切分：<https://huggingface.co/datasets/yshenaw/SkillOpt_Lite_Benchmarks>；SkillOpt-Lite commit `4cb4eee`：<https://github.com/EvolvingLMMs-Lab/SkillOpt-Lite>
10. Zeng et al., *The Resolution Hypothesis*, arXiv:2611.23068：<https://arxiv.org/abs/2611.23068>；站内解读：[自进化 agent 卡在验收](/cn/blog/agent-evolution-resolution-hypothesis-elite/)

本文的重算脚本（`ledger_audit.py`、`sealed_gate_on_ledger.py`）只用上面两篇论文公开的代码和数据，加上 SkillOpt-Lite 的公开题目文本，不调用任何模型 API。
