---
title: "规格驱动开发（spec-driven development / spec coding）是什么？"
description: "规格驱动开发是先写一份可审的规格，再让 AI agent 按规格生成代码，规格而不是对话记录成为事实来源。本文说明它和 vibe coding 的区别、常见工具与适用场景。"
date: 2026-10-16
tags: ["spec-driven-development"]
lang: "zh"
---

规格驱动开发（spec-driven development，简称 SDD，也常被叫作 spec coding）是先把「要做什么、做到什么算完成」写成一份规格文档，评审通过后再让 AI agent 按这份规格去写代码和测试。

它要解决的是 vibe coding 留下的问题。和 agent 聊着改，需求散落在几十轮对话里，换一个会话就丢了，代码到底满足了哪些约束也没人说得清。SDD 把这些东西固定在仓库里的文件上：需求、设计、任务清单都是 Markdown，能 diff、能评审、能在下一次会话里重新读进上下文。

## 一般怎么做

常见流程分三步。先写规格，描述行为、边界条件和验收标准；再由 agent 拆成设计和任务；最后逐个任务实现，每步对照规格验收。改需求时先改规格，再让代码跟上，而不是反过来。

2025 年以来出现了一批专门的工具。GitHub 开源的 Spec Kit 把流程做成一组斜杠命令，AWS 的 Kiro 把规格写进 IDE 的工作流，OpenSpec 则用「变更提案」的方式管理棕地项目里的增量修改。它们细节不同，核心都是让规格成为唯一的事实来源。

## 什么时候值得用

功能跨多个文件、需要多人或多个 agent 协作、需求会反复改，SDD 的收益最明显。改一行文案、修一个明显的 bug，写规格就是纯成本。

我的判断是，SDD 真正的价值不在文档本身，而在验收：规格里写清楚的条件可以变成测试和检查，agent 说「做完了」时你有东西可以对。规格写得含糊，它就退化成另一份没人读的 README。

## 延伸阅读

- [OpenSpec 教程：CLI 安装、命令、AGENTS.md 与实战示例](/cn/blog/openspec-tutorial-cli-commands-agents-md-examples/)
- [谁握笔签字？让规格而不是 Agent 收尾：SpecHarness](/cn/blog/specharness-spec-holds-the-pen/)
- [Vibe coding 是什么意思？](/cn/garden/questions/what-is-vibe-coding/)
- [GitHub Spec Kit](https://github.com/github/spec-kit)
