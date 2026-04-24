---
title: 'DeepSeek V4 评测地图：读懂 2026 前沿 LLM 基准'
pubDate: 2026-04-24T00:00:00.000Z
description: '从 LiveCodeBench 到 SWE-bench Pro，再到 ClawBench 家族——把 DeepSeek V4 报告里的十六个评测集一次讲清楚，顺便梳理 2026 年前沿模型评测的整体格局。'
author: 'Remy'
tags: ['DeepSeek', 'Benchmark', 'AI Agent']
lang: 'zh'
---

2026 年 4 月 24 日 DeepSeek 发布 V4-Pro 预览版，技术报告里塞进了大约 **16 个不同的评测集**，横跨编程、推理、知识、长上下文和 Agent 任务。如果你翻着那张成绩单纳闷"这些缩写到底在测什么"，这篇就是一张地图。

## 为什么今年突然这么多基准？

一年前，前沿模型的报告里写 MMLU + HumanEval + GSM8K 基本就够了。到 2026 年这三个已经饱和——Artificial Analysis 在一月份把 MMLU-Pro、AIME 2025、LiveCodeBench 从 Intelligence Index v4.0 里拿掉，原因就是前沿模型的分数差距已经读不出来。

新基准沿两条轴扩张：**更硬的推理**（HLE、CritPt、Putnam），以及 **更长链条的 Agent 任务**（SWE-bench Pro、Terminal-Bench、Toolathlon、MCPAtlas）。

## 编程与软件工程

### LiveCodeBench
无污染的竞赛题库，持续从 LeetCode、AtCoder、Codeforces 抓新题。每题带发布日期——对训练截止后出现的题目做"未见题"评估。V4-Pro-Max 得 **93.5**，开源模型新高。

### Codeforces (CodeElo)
不像 LiveCodeBench 自建判题，CodeElo 用提交机器人直接对接 Codeforces 官方判题机。零假阳性、支持 Special Judge，最终换算成人类可比的 Elo 分数。V4-Pro-Max **3206 分**，约等于人类选手 #23。

### SWE-bench Verified & SWE-bench Pro
SWE-bench Verified（OpenAI 精选 500 道 GitHub issue→PR 任务）已经饱和，前沿模型普遍 70%+。**SWE-bench Pro** 是 Scale AI 的接班人：1865 题，41 个仓库，单题平均改 107 行代码、4 个文件。分 public（731）、held-out（858）、commercial（276 来自早期创业公司私有库）三套，只用 copyleft 许可仓库来抗训练污染。

V4-Pro-Max：Verified **80.6**，Pro **55.4**——这个落差才是重点，Pro 才是"长链条能力"的公道裁判。

### Terminal-Bench Hard & 2.0
Stanford + Laude Institute。Agent 在 Docker 里拿到真实终端，要编译代码、训模型、配服务器。V4-Pro-Max 2.0 版 **67.9**，仍落后闭源前沿。

### SciCode
80 个主问题拆成 338 个子问题，题源是物理学家、化学家的实际研究脚本。同时考察知识召回 + 推理 + 代码合成，覆盖 6 个科学领域。

### MCPAtlas & Toolathlon
更新的 Agent 编程基准。V4-Pro-Max MCPAtlas **73.6**（仅次于 Opus-4.6-Max 的 73.8），Toolathlon **51.8**——在这项上反超 Gemini-3.1-Pro。

## 推理与数学

### GPQA Diamond
198 道研究生级自然科学选择题，筛选条件是"博士专家答对、有网非专家答不对"。专家 ~65%，非专家有 Google 也只有 34%。目前已饱和（Gemini 3.1 Pro 94.1%，Claude Opus 4.7 94.2%）。

### Humanity's Last Exam (HLE)
2500 道专家审核题，覆盖数学、自然科学、人文。CAIS + Scale AI 2025 年 1 月发布，定位"学术闭卷终考"。前沿模型目前仍在 40 分出头。

### CritPt
71 道来自 50 多位物理学家的**未发表**研究级物理题。GPQA Diamond 已经区分不了前沿模型，但 CritPt 还能——最强的 GPT-5.4 Pro xhigh 也只有 30%，基线模型 4%。

### Putnam-2025
Putnam 数学竞赛的形式化证明评测，用 Lean/Isabelle 流水线。V4-Pro-Max **120/120** 满分。

## 知识与事实性

### SimpleQA-Verified
Epoch AI 从 OpenAI SimpleQA 里精选的 1000 题——短问答、单一答案、对抗性收集。V4-Pro-Max **57.9**，大幅领先前最强开源模型。

### AA-Omniscience
考察"事实性减幻觉"的综合得分，−100 到 +100 分：答对 +1，幻觉 −1，弃权 0。负分意味着模型"胡说比知道的还多"。

## Agent 与工具使用

### τ²-Bench Telecom
**双向控制**的对话 Agent 基准：Agent 和模拟用户双方都能执行动作，必须协作才能解决电信客服场景。不是单轮工具调用，而是多轮状态共享。

### GDPval-AA
OpenAI 的 GDPval（220 个真实可交付物，来自 44 个职业、9 大 GDP 行业、平均 14 年经验的行业专家撰写）套上 Artificial Analysis 的评测框架。评分方式是**盲对比 Elo**，锚点是 GPT-5.1 Non-Reasoning = 1000 分。

### IFBench
58 个可验证的 out-of-domain 指令约束——模型到底会不会严格遵守你的输出格式要求。

## 长上下文

### AA-LCR
100 道难题，文档量 ~100k tokens，覆盖 7 类文档（财报、法律、学术、政府咨询、营销……）。最低要求 128K context。Qwen3 做等值判定器。

## ClawBench 家族

DeepSeek 报告里没出现，但属于同一波 Agent 评测潮，了解一下：

- **ClawBench**（clawbenchlab）——30 个业务流任务，覆盖办公、研究、内容、数据、软件工程 5 类，**故意埋坑**：命名不一致、目录缺失、日期陷阱
- **MM-ClawBench**——MiniMax 基于 OpenClaw 的 Agent 基准
- **LiveClawBench**——Triple-Axis 复杂度框架（环境/认知/运行时），并用 controlled pairs 做归因分析
- **WildClawBench**（书生 InternLM 出品）——60 个手工原创任务，Ground truth 在 Agent 完成后才注入，杜绝泄漏

## 结论

V4 的成绩单印证了一个规律：**纯编程**开源已经追上（LiveCodeBench 93.5、Codeforces 3206）；**长链条 Agent**（SWE-bench Pro、Terminal-Bench 2.0）闭源前沿仍领先；**前沿推理**（HLE、GPQA Diamond）大家挤在一起，评测集被替换的速度已经超过模型饱和它的速度。

选基准作报告的话，2026 年一条经验法则：优先选**有现役抗污染机制**（带日期的题、私有子集、或仅用 copyleft 源）的、且**离天花板还有明显距离**的。
