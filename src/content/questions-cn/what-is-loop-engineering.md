---
title: "Loop engineering（循环工程）是什么？"
description: "Loop engineering 指不再手动给 coding agent 写提示词，而是设计一套按计划或事件触发、带机器可验证停止条件的循环，让系统去驱动 agent。本文说明它的组成和风险。"
date: 2026-10-16
tags: ["loop-engineering"]
lang: "zh"
---

Loop engineering（循环工程）是指你不再一轮一轮地给 coding agent 写提示词，而是设计一个系统：它按定时或仓库事件启动 agent，让 agent 反复执行，直到一个机器能检查的条件成立才停下。

这个说法是 2026 年 6 月前后在开发者圈子里流行起来的。Peter Steinberger 的说法是「不该再给 coding agent 写提示词了，应该设计给 agent 写提示词的循环」；Claude Code 负责人 Boris Cherny 也说过他的工作已经变成「写循环」。Addy Osmani 随后写了一篇长文，把它归纳成几个基础构件，并指出 Claude Code 和 Codex 都已经具备。

## 一个像样的循环包含什么

按目前的讨论，大家对一个设计良好的循环有几点共识：

- **触发方式**：定时运行，或者在 PR、issue、CI 失败等事件发生时启动。
- **停止条件**：必须是机器能判断的，比如「test/auth 下的测试全部通过且 lint 干净」，不能是「看起来差不多了」。
- **状态文件**：记录做到哪一步、试过什么，否则每一轮都从零开始。
- **独立的验证者**：写代码的 agent 不能自己判定完成，另一个 agent 或模型来检查。
- **预算和上报**：限定 token 和尝试次数，没有进展时交给人。

Claude Code 和 Codex 里的 `/goal` 就是这个思路的会话内版本：给一个完成条件，每轮结束后由另一个小模型判断是否达成。

## 我怎么看

循环把人从「盯着 agent」里解放出来，代价是错误也会自动重复。2026 年 8 月一篇 arXiv 论文挖掘了 36,710 个仓库，在启发式命中的 256 个里确认 217 个确实在跑自主循环，但几乎没有一个把循环的状态文件提交进版本库。也就是说配置有人管，运行时发生了什么却没人留底。

所以上线一个循环之前，先让它只出报告不改代码，把验证者和停止条件做扎实，再逐步放权。验证这一环偷工，循环只会更快地产出错误。

## 延伸阅读

- [Ralph Wiggum 循环与 OpenSpec 对比](/cn/blog/ralph-wiggum-loop-vs-open-spec/)
- [控制 harness 就是控制成本](/cn/blog/control-the-harness-control-the-cost/)
- [Addy Osmani：Loop Engineering](https://addyo.substack.com/p/loop-engineering)
- [Loop Engineering: Building Blocks, Adoption, and Impact（arXiv:2608.21884）](https://arxiv.org/abs/2608.21884)
