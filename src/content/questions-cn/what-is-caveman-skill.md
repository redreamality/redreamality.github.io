---
title: "Caveman skill 是什么？真能省 65% 的 token 吗？"
description: "Caveman 是一个让 coding agent 像原始人一样说短话、以减少输出 token 的 skill。官方宣称省约 65%，但在真实 agent 任务上的独立测试只省了约 8.5%，甚至有测试更费。"
date: 2026-10-16
tags: ["agent-skills"]
lang: "zh"
---

Caveman 是一个给 coding agent 用的 skill，作用是让 agent 回答时像原始人说话一样省掉冠词、代词和客套，只留结论，以此减少输出 token；代码、命令、文件路径和报错原文则一字不改。

它出自 GitHub 上的 JuliusBrussee/caveman，口号是「why use many token when few token do trick」。在 Claude Code 里可以用 `claude plugin marketplace add JuliusBrussee/caveman && claude plugin install caveman@caveman` 安装，之后输入 `/caveman` 开启，说 `stop caveman` 关闭。它还有 lite、ultra 等压缩档位，以及一个在本地运行的代理，用来压缩 agent 读进去的日志、JSON 和测试输出。

## 官方数字和独立测试差多少

项目宣传的是省约 65% 的 token。这个数主要来自聊天式的问答，回答里大部分是解释性文字，压缩空间很大。

真实的 agent 任务不一样。JetBrains 在 2026 年 7 月用 SkillsBench 做了 82 组成对测试，强制每次回复都开启 Caveman，输出 token 只少了约 8.5%，任务质量没有可测出的下降。原因是 agent 会话里占大头的是代码、diff 和工具调用，这些 Caveman 本来就不压缩，能压的只有工具调用之间那几句旁白。另一家机构 Glia 在 20 个终端任务上测出的结果更差：输出 token 的中位数反而多了 17.7%，只有一个特别长的任务省下了很多。

还要算上它自己的成本。官方文档写明 `SKILL.md` 本身约 1,650 个 token，每次调用都作为输入带上，问一句话的短对话里可能得不偿失。

## 该不该装

如果你主要是在聊天里问问题、嫌回答啰嗦，Caveman 确实能让回答变短。如果你想靠它给 agent 省钱，预期应该放低到「最多一成左右」。想真正省 token，先看 agent 读了多少不必要的上下文，那一侧的浪费通常比回答长度大得多。

## 延伸阅读

- [Claude Code 额度怎么算](/cn/blog/claude-code-usage-limits-cost-2026/)
- [Coding agent 里的低效行为与成本](/cn/blog/coding-agents-cost-inefficient-behaviors/)
- [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman)
- [JetBrains：Speaking to AI Agents like Cavemen Saves 65% of Tokens. We Test.](https://blog.jetbrains.com/ai/2026/07/speak-to-ai-agents-like-cavemen-tosave-tokens/)
- [Glia：The Caveman skill is built to cut output tokens. It added 17.7%.](https://gliai.com/research/caveman-skill-benchmark)
