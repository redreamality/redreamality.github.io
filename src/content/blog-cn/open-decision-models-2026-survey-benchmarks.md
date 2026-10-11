---
title: "Jev 之后一个月：开放决策模型全景、榜单反例与选型清单"
description: "Jev 带火了「决策模型」：Cloudflare、Liquid、Perplexity、微软、OpenAI 和一批社区模型都跟进了。本文按实现路线把十几家放在一起，拿厂商说法逐条对 Decision Index、JevBench 和 Red Hat 的实测，讲清公开题与新领域题的落差、校准到底对谁、延迟口径为何不可比，最后给出对照表和 agent 回路接入前的验收清单。"
pubDate: 2026-10-11T10:40:00+08:00
author: "Remy"
tags: ["jev", "System One", "evaluation", "agent-loop", "open-source", "ai-agents"]
lang: "zh"
---

九月 TypeSafe 推出 Jev 时，说法很简单：给它一段 `state` 和几个类型化的问题（是/否、多选一、0–5 打分），它直接返回每个选项的概率，不生成文字，只按输入 token 收费，官方价 0.042 美元/百万 token。[1] 一个月后，这个形态已经从一家公司的产品变成了一个品类：Cloudflare 开源了 Clef，Liquid 先上托管 d1、又放出 d1-3B 和 d1-omni-600M，Perplexity、H2O、vLLM Semantic Router 各自发了开放权重，微软在 Foundry 上了 Microsoft-Decision-1，OpenAI 的 Decisions API 进了公开 beta，社区里还有蒸馏 Jev 的 JEV-27B、编码器路线的 Laya、对比学习路线的 CLM，以及能把任意 LLM 改成决策接口的 AnyJev。[3][5][14][18][19][20][22]

站内此前八篇 Jev 都是在看 Jev 本身（文末有索引）。这篇换个角度，看整个品类：**这么多家都说自己「校准」「最快」「榜首」，这些话能对上哪个榜、哪种口径；什么情况下该用决策模型，什么情况下老老实实用 LLM 评委或者训一个小分类器。**

所有数字都来自模型卡、官方文档、榜单原始 JSON 或作者原文，读取时间是 2026 年 10 月 10–11 日（北京时间）。拿不到原文的我会标出来，不引用数字。

## 先说清楚：决策模型到底在读什么

决策模型对外的约定基本一致：输入是一段状态加一组带选项的问题，输出是每个选项的概率分布，输出 token 为零或接近零。Jev 的接口是 `POST /v1/systemone`，三种原语分别叫 Noul（是/否）、Choice（多选一）、Score（0–5 级）。[1] 这个接口已经变成事实标准：Clef、Laya 自带的服务、Strands Decider、H2O 的 shim、llama.cpp 的 `llama-server` 都暴露了 `/v1/systemone`；vLLM 在 10 月 8 日合入了通用的 `/v1/systemone` 端点，次日去掉了需要手动开启的开关。[4][9][15][17][19][28] OpenAI 是例外，它的 Decisions API 用自己的一套 schema（`predicate`、`choices`、`levels`，还带一个 refusal 答案类型），不能直接替换。[20][21]

接口一样，底下的做法差很多，大致四条路线：

**第一条，读选项标签的 logits。** 让一个普通自回归 LLM 读完提示，在下一个位置只看 A/B/C 或 yes/no 这些标签 token 的概率，做一次 softmax。vLLM 的通用端点就是这么做的，usage 里输出 token 记为 2。[17] AnyJev 的「L0」也是这条路，不训练，只在前面加去偏和校准，能挂在 Ollama、vLLM 或 OpenAI 兼容服务后面。[22] 这条路最便宜，代价是原始 logits 对选项顺序很敏感：AnyJev 在 Qwen3-8B 上测 BANKING77 的 20 类子集，光是换选项顺序，原始读法有 23% 的答案会变。[22]

**第二条，在冻结或 LoRA 的骨干上加一个专门的决策头。** Clef 在 Qwen3.8-27B 后面接了一个小的 transformer「联合 schema 头」，用 Brier 损失加 RLCD 训练；Perplexity 的 pplx-decider 用了非因果注意力的读出方式；H2O-Lightning-4B、Microsoft-Decision-1 都是在 Qwen3.5 上做后训练；Strands Decider 2B 给出了完整可复现的配方，8 张 H100 跑 1 小时 10 分钟。[4][14][15][18][19]

**第三条，不用解码器。** Laya 是 ModernBERT-large（4.21 亿参数）加选项标记头；d1-omni-600M 建在 LFM2.5-Encoder-350M 上，能吃文本加图片或音频；CLM 走对比学习，把状态和候选动作分别编码成向量再比相似度，概率只在给定候选集内部有意义。[6][9][10]

**第四条，蒸馏 Jev，或者不确定时切到「想一想」。** AutoTrust 的 JEV-27B-VL 和 JEV-9B 直接拿 Jev 1.13 的输出分布当蒸馏目标；JEV-9B 在 25,376 道留出题上和老师的平均 KL 散度约 0.019，作者的说法是「按 KL 已经和闭源原版分不出来」。[11][12] GEV-26B-Decide 和 AnyJev 的 Tacit 模式则是在置信度不够时让模型先生成一段推理再决策，这时「零输出 token」就不成立了。[13][22]

顺序偏差主要出在第一条；「校准是对谁校准」在第四条上最尖锐；第三条最快，但零样本能力最弱。

## 这一波都有谁：按「能不能自己部署」分四类

**只能调托管 API 的。** Jev 1.13：只吃文本，单次请求 64k token（`state` 加最长问题 32k），同一套权重服务所有客户，不能微调，英语是主训练语言，官方明说中日韩文字「能处理但效果不如英语」。[1] OpenAI Decisions：模型是 gpt-6-luna，支持图片输入，公开 beta。[20] Microsoft-Decision-1：基于 Qwen3.5-9B 后训练，在 Foundry 和 OpenRouter 上，输入 0.042 美元/百万 token，输出免费。[18] Liquid 的托管 d1 在 9 月底上线，底座未公开，通过 Liquid API 的 Python 和 TypeScript SDK 调用。[7][8]

**大厂放出的开放权重。** Cloudflare Clef（27B）和 Clef-flash（9.4B），Apache-2.0，Workers AI 上也能直接调，同时推出了一个 RL 微调平台。[3][4] Liquid d1-3B（3.1B，建在 LFM2.5-VL-3B 上，文本加图片，32k 上下文）和 d1-omni-600M（5.87 亿参数），注意许可证是 LFM Open License 1.0，不是 Apache。[5][6][7] Perplexity pplx-decider v1 和 v1.1（27B，Apache-2.0）。[14] H2O-Lightning-4B（Apache-2.0，标准 vLLM 加一个开源 shim）。[19] vLLM-SR 的 Decision 2.0 是一个从 0.6B 到 27B 的家族，旗舰叫 Vega 27B。[16]

**社区和独立团队。** AutoTrust 的 JEV-27B-VL、JEV-9B、GEV-26B-Decide；Convai 的 Laya；Contrastive-LM 的 CLM-v0.1-8B；Strands Labs 的 Strands Decider 2B。[9][10][11][12][13][15]

**工具和榜单。** 工具层有 Nokia 应用研究院的 AnyJev、vLLM 的通用端点和 llama.cpp 的 GGUF 支持。[17][22][28] 榜单有三个：社区维护的 Jev Decision Index（10 月 10 日快照共 117 个条目，另有视觉榜）、Benchmark Heaven 的 JevBench（开放权重榜和 API 榜分开）、hotchpotch 的 S1MB（拼了一百多个基准）。[23][24][25]

热度方面只说一句：Hugging Face 上 Laya 和 JEV-27B-VL 的点赞都过了三千，这只说明大家在看，不说明好用。

## 拿厂商说法去对榜：四种常见落差

### 落差一：公开题高分，新领域题掉分

Decision Index 0.3.1 的总分不是单一数字，它把题目分成三块：公开题占 20%，同类技能的私有题占 50%，全新领域的私有题占 30%。[23] 这个设计专门用来抓「对着公开题调参」。看几个关键条目的公开题和新领域题（10 月 10 日 15:54 北京时间快照）：

- Jev：公开 57.96，新领域 54.98，差 3 分，总分 60.11，排第 3。
- pplx-decider v1.1：62.25 对 55.57，差 6.7 分，总分 62.75，排第 1。
- Clef：61.71 对 41.88，差将近 20 分，总分 53.08，排第 19。
- Clef-flash：56.15 对 42.50，差 13.7 分，总分 47.61，排第 33。
- d1-3B：48.99 对 27.96，差 21 分，总分 40.08，排第 53。

Cloudflare 发布博客说 Clef 是 Decision Index 上的领先者，卡片里的对比表也确实是 Clef 赢的多。[3][4] 但仔细看，卡片写的是「我们在 0.2.1 套件上的内部运行」，链接指向 Cloudflare 自己部署的评测站。[4] 换到有私有题、有新领域题的 0.3.1，Clef 的公开题成绩仍是第一梯队，新领域题却掉到四十出头。这不等于 Clef 不好用。它在工具调用和意图分类上确实强：BFCL 98.5，BANKING77 宏平均 F1 94.2，都高于 Jev。[4] 但同一张表里，GPQA Diamond 是 48.0 对 Jev 的 78.3，MMLU-Pro 是 65.9 对 82.7，BBH 是 73.7 对 92.9，凡是要多步推理的题，差距都很大。[4] 博客挑出来展示的，正好是它擅长的那一类。

### 落差二：同一个模型，换个榜就换了名次

JevBench 的总分把智能、校准、速度、成本四个轴按 25% 等权加起来。[24] 这样一来，H2O-Lightning-4B 以 72.5 分排开放权重榜第 1，Jev 是 71.5。但如果只看「能力分」（智能和校准的平均），pplx-decider v1.1 是 82.8，Clef 是 75.3，都高于 H2O 的 75.0；两者的总分却只有 20.6 和 16.8，因为成本轴把 27B 模型压到了底。[24]

关键在于这个成本是怎么来的：开放权重模型没有官方价，JevBench 按底座模型的参考市场价来估，并注明「是估算，不是实际计费」，pplx 估成每千次决策 0.217 美元，Clef 估成 0.249 美元，Jev 按官方价是 0.032 美元。[24] 你要是自己有 GPU，这个估法和你的实际成本可能差很远。所以「谁是第一」很大程度上取决于你给四个轴配的权重，以及你接不接受它的成本估法。

版本也在变。Jev 在 Decision Index 0.2.1 上是 57.9 分左右，GEV 和 pplx 的卡片都引用过这个数；到 0.3.1 总分变成 60.11。[13][14][23] 不同卡片引用的「Jev 分数」来自不同版本，不能横着比。

### 落差三：「最快」用的是哪种延迟

微软说 Decision-1 在它的 36 个基准对比里准确率最高、速度最快，比第二名 H2O-Lightning-4B 快 2.5 倍，比 GPT-6 Sol 快 35 倍。[18] JevBench 在 Azure Foundry 上实测，Decision-1 的中位延迟是 0.46 秒，能力分 70.8，排 API 榜第 7，低于 Jev 的 77.1，还有 21 次因为超出上下文上限而失败。[24]

为什么会差这么多？JevBench 对自托管模型的延迟有一个调整：实测值乘 2 再加 0.15 秒，标注是「假设，不是测量」。H2O 实测中位延迟 29 毫秒，调整后变成 209 毫秒。[24] H2O 在模型卡里写，微软拿去比的正是这个调整后的数字，而微软自己报的是 85 毫秒。[19] 微软博客原文里的数字表是图片，我没法逐项核对，所以 85 毫秒这个数字只能算 H2O 的转述。

托管 API 本身的延迟也不稳定。Jev 在 JevBench v1.5 测出来中位 0.62 秒，v1.6 变成 0.24 秒；Decision Index 的单请求测量又是 524 毫秒，而且明确写了「包含 HTTPS 和服务调度」。[23][24] 同一个模型，口径一换差两倍多。

### 落差四：榜首一周一换

JEV-27B-VL 的模型卡写着「视觉榜 20 个模型里第 1」。[11] 10 月 10 日 07:53（北京时间）的视觉榜数据里，第 1 已经是 pplx-decider v1.1（70.58），JEV-27B-VL 以 69.60 排第 2。[23] 这个品类的榜单几乎每天都在更新，JevBench 10 月 10 日一天就发了好几个修订版。[24] 模型卡上的名次只能代表写卡那天。

## 反例一：Red Hat 把它们放进护栏场景

上面都是在比决策模型之间谁强。Red Hat 的文章换了个问题：如果你本来就有现成的小分类器，决策模型值不值得换？[26]

他们用 NeMo Guardrails 和 EvalHub 测了两个护栏任务，全部是英文。提示注入检测：专门训练的 deberta 分类器（约 2 亿参数，在 M1 的 CPU 上跑）准确率 89.01%，延迟 54 毫秒；Qwen3.6-35B 用 LLM 评委的方式拿到最高的 89.31%；Jev 是 86.35%，延迟 348 毫秒；Laya 85.44%。内容安全：Jev 以 86.20% 排第一，Nemotron 只差 1.13 个百分点；只有 1.25 亿参数的 granite-guardian-hap 是 80.27%，延迟 33 毫秒；Laya 掉到 57.87%。[26]

更值得注意的是提示词。他们给 Laya 调了一套提示，准确率提高了 17.83 个百分点；同一套提示放到 Jev 上，反而降了 3.67 个百分点。[26] 也就是说，决策模型之间的提示词不能通用，换模型就要重新调。

Red Hat 自己的结论很克制：预训练的小分类器在它擅长的任务上，和决策模型持平甚至更好，而且便宜、快、能离线跑；决策模型的价值在于不用训练数据就能起步，以及类别经常变化的场景。[26] 有几个限制要记住：只测了英文，网络延迟最少加了 56 毫秒，LLM 评委的提示是从别的任务改过来的。另外，正文表格里 Shieldstral 的两个数字（72.02% 和 74.80%）和附录正好对调了，不影响结论，但说明这类评测文章也要对着附录看。[26]

## 反例二：「校准概率」是对谁校准

几乎每一家都说自己的概率是校准过的。Alex Molas 九月底的短文把问题讲得很透：校准不是模型单独的属性，而是模型和数据分布一起的属性。两家公司对垃圾邮件的定义一样，但邮件分布不同，Jev 对同样的输入给出同样的概率，不可能同时对两家都校准。[27] 他的建议也很实际：拿几百条自己的标注数据，在 Jev 的分数上拟合一个 Platt scaling（用逻辑回归把分数映射成概率）；在这之前，把它当成「排序很好的分数」，别当成概率直接拿去算阈值或期望成本。[27]

榜单数据支持他的判断。Decision Index 0.3.1 上，Jev 的平均置信度 0.81，实际准确率 0.74，ECE（期望校准误差）0.074。分箱看更清楚：置信度在 0.7 到 0.8 之间的题，实际只对了 59%；0.8 到 0.9 之间，对了 71%；0.9 以上，对了 93%。[23] 整体是偏自信的。TypeSafe 自己的文档也承认，Jev 在多选题里会偏向排在第一位的选项，处理日期也不可靠。[2]

**蒸馏模型的「校准」要特别小心。** JEV-9B 和 JEV-27B 卡片上的 ECE 是 0.0007 和 0.0009，好得惊人。但这是拿老师 Jev 的分布当标准答案算出来的，衡量的是「和老师有多像」，不是「和真实答案有多准」。JEV-9B 的卡片自己也写了，它会照搬老师的错误。[11][12] 放到 Decision Index 上，JEV-27B 的 ECE 是 0.0759，和 Jev 本身差不多。[23]

**其他几种情况：**

- Laya 出厂就偏自信，卡片建议用自己的数据重新拟合温度，ECE 能从 0.466 降到 0.081；英文版在非拉丁文字上会崩，高棉语准确率 0，置信度却有 0.952。[9]
- H2O 在 JevBench 公开题的 74 道是/否题里，没有一道的概率落在 0.2 到 0.8 之间。[19] 概率分得这么开，不等于校准得好，只说明它很少说「不确定」，三档阈值策略在它身上可能根本用不上中间档。
- AnyJev 的 L0 校准把 ECE 从 0.240 降到 0.184，还是不低；但它报了一个更有用的指标：在错误率不超过 5% 的前提下，能自动判掉的题从 7.7% 提到 46.3%。[22] 对 agent 回路来说，这个「给定风险下的自动化覆盖率」比单一 ECE 更接近你真正关心的东西。

**精度和量化也会改答案。** Liquid 在 d1-omni-600M 卡片上写了，bf16 推理时有 0.8% 的文本题和 1.7% 的音频题，最高概率的答案和全精度不一样。[6] bartowski 的 Clef-flash GGUF 量化卡说得更直接：决策模型不生成 token，所以没法用 imatrix 做量化校准，决策头只能保持在 Q8_0，「下面这些量化到底损失多少，没有办法测」。[28] Reddit 上有人发过 Clef Q8 对比 Jev 的测试，但帖子正文我抓不到，这里不引用它的数字，只说明有人在测。[29] 量化之后，校准和准确率都要自己重测。

**托管模型会漂移。** Decision Index 在测 Jev 延迟时顺便发现，和 9 月 19 日的正式运行相比，有 20 道多选题的答案变了。[23] TypeSafe 的 `jev-latest` 这类别名也会指向新版本。[1] 用托管 API 就要锁定带版本号的模型 ID，并定期回放固定题集。

**顺序偏差各家不同。** 在 16 个选项的题上，光换顺序，老师 Jev 有 7.0% 的答案会变，JEV-27B 是 7.4%，JEV-9B 是 11.5%；JEV-27B 卡片建议正反两个顺序各问一次取平均，两次一致的比例约 96%。[11][12] 微软说 Decision-1 在八种扰动下平均只有 1.3% 的翻转，打乱或倒序选项时为零，这是厂商自测。[18]

## 什么时候该用决策模型，什么时候别用

### 和 LLM 评委比

JevBench 的 API 榜给了一个干净的对照：GPT-6 Luna 低推理档能力分 97.8，Jev 是 77.1；代价是每千次决策 0.108 美元对 0.032 美元（约 3.4 倍），中位延迟 1.85 秒对 0.24 秒（约 7.7 倍）。[24] 绝对成本其实都不高，每千次差 7 美分。所以如果这个判断不在关键路径上，比如离线打标、每天跑一次的质检，准确率又最重要，直接用 LLM 评委更省心。

决策模型的优势在两个地方。一是延迟会累积：微软举的例子是，20 步串行的决策每步多 100 毫秒，整个流程就多 2 秒。[18] 二是同一个状态要问很多问题：Jev 把 `state` 读一次，所有问题并行评估，按输入 token 计费。[1] 站内那篇 rubric 评委的文章里，Jev 和 flash 级 LLM 在多数配对上准确率分不出显著差异，成本差 29 到 325 倍，延迟差 30 到 220 倍，但错误高度相关，所以「便宜的先判、不确定再交给 LLM」的级联最多只多出约 1.5 个百分点。见 [Jev 当 Rubric 评委](/cn/blog/jev-rubric-judges-cheaper-faster-correlated-errors/)。

### 和微调小分类器比

如果你有几千条标注、类别相对稳定，Red Hat 的结果说得很清楚：几亿参数的专用分类器在准确率上不输，延迟低一个数量级，还能在 CPU 上跑。[26] 决策模型适合三种情况：冷启动没有数据；类别每周都在改；有很多零散的小判断，每个都不值得单独训一个模型。还有一种折中：先用决策模型给数据打标，再拿标注训小模型。Laya 的卡片就展示了微调的效果，某个任务上准确率从 0.362 提到 0.766。[9]

### 按五个维度过一遍

- **延迟**：自托管的 4B 以下模型能做到几十毫秒甚至个位数毫秒（d1-3B 在 Decision Index 上中位 16 毫秒，Laya 6 毫秒）；托管 API 通常在 0.2 到 0.5 秒，含网络。[23] 先弄清你比的是哪种口径。
- **成本**：托管决策 API 每千次几美分；自托管 27B 模型的真实成本取决于你的 GPU 利用率，榜单的估算只能参考。[24]
- **校准和漂移**：没有哪家能保证在你的数据上开箱即准，预留几百条标注做温度或 Platt 校准；托管 API 要锁版本、定期回放，开放权重可以完全锁死，但部署和升级要自己管。[1][23][27]
- **可审计**：开放权重加公开配方最好查。Strands 公开了各阶段耗时、配置和训练数据的 SHA-256；vLLM-SR 说它把训练数据逐行和 Decision Index 的全部测试题做过比对；托管 API 至少要记录返回的模型版本号。[15][16] 但要记得，概率能审计阈值，不能解释原因，JEV-9B 卡片明说 System 1 不会解释自己的判断。[12]

中文场景单独说一句：Jev 官方承认中日韩效果不如英语，Red Hat 只测了英文，Laya 英文版在非拉丁文字上会崩。[1][9][26] 如果你的状态是中文，所有结论都要在中文数据上重测一遍。

## 一张对照表

分数取自 Decision Index 0.3.1 总分（10 月 10 日快照）或 JevBench v1.6.1；「—」表示没有找到公开的一手数据。[23][24]

| 模型 | 规模 | 许可 | 接口 | 上下文/模态 | 公开基准 | 在哪跑 |
|---|---|---|---|---|---|---|
| Jev 1.13 | 未公开 | 闭源 | `/v1/systemone` 原生 | 64k；文本 | DI 60.11（#3）；JevBench 能力 77.1 | TypeSafe API |
| OpenAI Decisions | 未公开 | 闭源 | 自有 schema | 文本、图片 | JevBench 能力 73.5 | OpenAI API |
| Microsoft-Decision-1 | 9B（Qwen3.5） | 闭源 | Foundry / OpenRouter | —；文本 | JevBench 能力 70.8 | Azure、OpenRouter |
| d1（托管） | 未公开 | 闭源 | Liquid SDK（Python/TS） | — | JevBench 能力 74.4 | Liquid API |
| Clef | 27B（Qwen3.8） | Apache-2.0 | `/v1/systemone` | 默认 16k；文本、图片 | DI 53.08（#19） | 自托管、Workers AI |
| Clef-flash | 9.4B | Apache-2.0 | `/v1/systemone`、GGUF | 文本、图片 | DI 47.61（#33） | 自托管、llama.cpp |
| d1-3B | 3.1B | LFM Open 1.0 | Python `system_one()` | 32k；文本、图片 | DI 40.08（#53） | 本地 GPU、端侧 |
| d1-omni-600M | 587M | LFM Open 1.0 | Python | 16k；文本、图片、音频 | DI 9.45（#99） | 端侧 |
| pplx-decider v1.1 | 27B | Apache-2.0 | 自带推理代码 | 8k；文本、图片 | DI 62.75（#1）；视觉榜 #1 | 自托管 |
| H2O-Lightning-4B | 4B | Apache-2.0 | vLLM + shim | 40k；文本 | JevBench 开放榜综合 #1 | 自托管 |
| Decision 2.0 Vega | 27B | Apache-2.0 | transformers | 32k；文本 | DI 55.88（#13） | 自托管 |
| JEV-27B-VL | 27B | Apache-2.0 | `/v1/decide` | 文本、图片 | DI 55.64（#14）；视觉榜 #2 | 自托管 |
| JEV-9B | 9B | Apache-2.0 | `/v1/decide` | 文本 | DI 45.21（#39） | 自托管 |
| GEV-26B-Decide | 26B-A4B | Apache-2.0 | `/v1/decide` | 256k；文本、图片 | DI 56.17（#11，仅 System 1） | 自托管 |
| Laya | 421M | Apache-2.0 | `/v1/systemone` | 默认 1k，最多 8k；文本 | DI 4.43；Red Hat 注入 85.44% | CPU 也能跑 |
| CLM-v0.1-8B | 8B | Apache-2.0 | 自有客户端 | 文本 | DI 6.24 | 自托管 |
| Strands Decider 2B | 2B | Apache-2.0 | `/v1/systemone` | 4k；文本 | DI 21.75（#84） | 自托管 |
| AnyJev | 套在任意 LLM 上 | 开源工具 | `/v1/decide` | 取决于底座 | 自报 BANKING77 等 | Ollama、vLLM |

两点补充。GEV 卡片自报的 62.48 分包含了「想一想」模式，榜上的 56.17 只算 System 1；pplx v1.1 自报 61.56，和榜上的成绩一致。[13][14][23] 另外 vLLM 还有几个 PR 没合，包括 d1-3B、Laya 和 OpenAI Decisions schema 的支持，说明接口还在两套标准之间摇摆。[17]

## 接进 agent 回路前的验收清单

路由、护栏、评委这三种用法，共用下面这些检查：

1. **锁版本。** 托管 API 记下带版本号的模型 ID；开放权重记下仓库 commit 和量化格式。精度或量化一改，整套验收重跑。[6][28]
2. **自建题集。** 至少几百条来自真实流量的标注，困难样本单独分层；再留一块「新领域」题，模拟榜单里那 30% 的私有新题。中文场景必须有中文题。
3. **设三个基线。** 规则或关键词、训练过的小分类器（有数据的话）、LLM 评委。决策模型要赢至少一个维度才值得上。
4. **看对指标。** 分类别准确率或 F1；护栏看拦截召回率；ECE 加可靠性分箱图；给定错误率下的自动化覆盖率；端到端 p50/p95 延迟（含网络）；每千次决策成本。
5. **测鲁棒性。** 打乱选项顺序算翻转率；换说法；加无关上下文和长 `state`；按 [JevOut](/cn/blog/jevout-natural-context-flips-decision-models/) 的方法加短小、自然、不改答案的诱导句。
6. **自己做校准。** 按问题类型分别拟合温度或 Platt 参数，校准之后再定阈值。[27]
7. **三档阈值。** 高于上限直接执行，低于下限直接拒绝或换路，中间交给更强的模型或人；给升级到 LLM 的比例设上限，AnyJev 的 Tacit 就有这类开关。[22] 先确认你的模型真的会给出中间档的概率。[19]
8. **测相关错误。** 级联里便宜那层和兜底那层错在同一批题上，级联就没用了。
9. **监控漂移。** 每周回放固定题集，答案一变就报警。
10. **按用法补检查。** 护栏：超时、超长、报错一律按「拦」处理，不要只靠决策模型挡提示注入。评委：正反两个顺序各问一次，别把它当强化学习唯一的奖励。路由：加「其他」选项，置信度低就走默认路径。
11. **留审计记录。** 每次决策存下 `state` 的哈希、问题、完整概率分布、模型版本、当时的阈值和最终动作。

## 和站内 Jev 系列怎么对着读

这篇是品类地图和选型。想看单点细节可以接着读：机制和接入看 [Jev 接 Claude Code 与 25 行 logits](/cn/blog/jev-claude-code-10x-and-25-lines/)；适用场景看 [TypeSafe Jev 用例](/cn/blog/typesafe-jev-use-cases/)；判决稳定性看 [ContractNLI 均分相近、判决不同](/cn/blog/jev-vs-llm-contractnli-same-scores-different-decisions/)；对齐检测看 [Just Ask Jev](/cn/blog/just-ask-jev-rlcd-alignment-failure-detection/)；记忆和 GUI 执行看 [Jev-Mem](/cn/blog/jev-mem-system-one-agentic-memory/) 和 [Jev-Mobile](/cn/blog/jev-mobile-system-one-gui-executor/)。

## 结语

一个月里，决策模型从一家公司的接口变成了一个有十几家参与、有三个榜单、有通用推理端点的品类。速度和成本的优势是真的，但很多宣传语要打折听：「榜首」要看是哪个榜、哪个版本、有没有私有题；「最快」要看是实测还是调整后的数字；「校准」要看是对真实标签还是对老师。S1MB 在说明里写得很老实：分数不能证明模型能泛化到没见过的任务，也不能证明训练数据和测试题没有重叠。[25] 这句话对这个品类里的每一张榜都适用。

没数据、判断在关键路径上、同一状态要问很多问题：用决策模型。有标注、类别稳定：先训一个小分类器。准确率优先又不在关键路径上：每千次多付几美分给 LLM 评委。不管选哪个，上线前都要在自己的数据上重新校准一遍。

## 参考文献

1. TypeSafe. *Models (jev-1.13)*. https://docs.typesafe.ai/models
2. TypeSafe. *Jev 1.13 jaggedness*. https://docs.typesafe.ai/model-jaggedness/jev-1.13
3. Cloudflare. *Introducing Clef: our open-source decision models, and new RL fine-tuning platform*. https://blog.cloudflare.com/clef-decision-models/
4. Cloudflare. *Cloudflare/clef* and *Cloudflare/clef-flash* model cards. https://huggingface.co/Cloudflare/clef · https://huggingface.co/Cloudflare/clef-flash
5. Liquid AI. *Open d1: Edge decision models for text, vision, and audio*. https://www.liquid.ai/blog/d1-open
6. Liquid AI. *LiquidAI/d1-3B* and *LiquidAI/d1-omni-600M* model cards. https://huggingface.co/LiquidAI/d1-3B · https://huggingface.co/LiquidAI/d1-omni-600M
7. Liquid AI. *Decision Models* documentation. https://docs.liquid.ai/lfm/models/decision-models
8. MarkTechPost. *Liquid AI Releases d1, a Decision Model That Returns Calibrated Probabilities with Zero Output Tokens* (secondary source). https://www.marktechpost.com/2026/09/29/liquid-ai-releases-d1-a-decision-model-that-returns-calibrated-probabilities-with-zero-output-tokens/
9. Convai Innovations. *convaiinnovations/laya* model card. https://huggingface.co/convaiinnovations/laya
10. Contrastive-LM. *CLM-v0.1-8B* model card. https://huggingface.co/Contrastive-LM/CLM-v0.1-8B
11. AutoTrust. *JEV-27B-VL* model card. https://huggingface.co/autotrust/JEV-27B-VL
12. AutoTrust. *JEV-9B* model card. https://huggingface.co/autotrust/JEV-9B
13. AutoTrust. *GEV-26B-Decide* model card. https://huggingface.co/autotrust/GEV-26B-Decide
14. Perplexity. *pplx-decider-v1-27b* and *pplx-decider-v1.1-27b* model cards. https://huggingface.co/perplexity-ai/pplx-decider-v1-27b · https://huggingface.co/perplexity-ai/pplx-decider-v1.1-27b
15. Strands Labs. *strands-decider-2B-hobson-v19* model card. https://huggingface.co/StrandsAgents/strands-decider-2B-hobson-v19
16. vLLM Semantic Router. *Decision-2.0-Vega-27B* model card. https://huggingface.co/vllm-sr/Decision-2.0-Vega-27B
17. vLLM. PR #59299 *Structured decisions endpoint (/v1/systemone)*, PR #60677 *Expose /v1/systemone without an opt-in flag*, open PRs #60676, #58429, #60465. https://github.com/vllm-project/vllm/pull/59299 · https://github.com/vllm-project/vllm/pull/60677
18. Microsoft. *Introducing Microsoft-Decision-1, our model for fast decision-making*. https://commandline.microsoft.com/microsoft-decision-1-model-foundry/
19. H2O.ai. *h2oai/h2o-lightning-4b* model card. https://huggingface.co/h2oai/h2o-lightning-4b
20. OpenAI. *Decisions* API guide. https://developers.openai.com/api/docs/guides/decisions
21. Simon Willison. *Release: llm-openai-decisions 0.1a0*. https://simonwillison.net/2026/Oct/6/llm-openai-decisions/
22. Nokia Applied Research. *AnyJev*. https://github.com/nokia-applied-research/AnyJev
23. multimodalart. *Jev Decision Index* (data/index.json snapshot 2026-10-10 07:54 UTC; data/vision.json 2026-10-09 23:53 UTC). https://huggingface.co/spaces/multimodalart/jev-decision-index
24. Benchmark Heaven. *JevBench* open-weights and API boards (v1.6.1 artifact; API board read 2026-10-11). https://benchmarkheaven.com/jev-models · https://benchmarkheaven.com/jev-models/api
25. hotchpotch. *S1MB leaderboard*. https://huggingface.co/spaces/hotchpotch/s1mb-leaderboard
26. Red Hat Developer. *Benchmarking AI decision models against traditional guardrails*. https://developers.redhat.com/articles/2026/10/02/benchmarking-ai-decision-models-against-traditional-guardrails
27. Alex Molas. *Jev can't be calibrated*. https://www.alexmolas.com/2026/09/23/jev-cant-be-calibrated.html
28. bartowski. *Cloudflare_clef-flash-GGUF* model card. https://huggingface.co/bartowski/Cloudflare_clef-flash-GGUF
29. u/3VITAERC. *Benchmarking decision models is fun: Clef Q8 vs Jev* (Reddit r/LocalLLaMA; body not retrievable, no figures cited). https://www.reddit.com/r/LocalLLaMA/comments/1wxloam/benchmarking_decision_models_is_fun_clef_q8_vs_jev/
