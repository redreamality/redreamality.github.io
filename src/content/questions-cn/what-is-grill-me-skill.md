---
title: "Grill me skill 是什么？"
description: "grill-me 是 Matt Pocock 开源的一个 agent skill：你输入 /grill-me 和一个粗糙的想法，agent 一轮一轮追问，直到方案里每个决策都有答案。本文说明它怎么用、和 grill-with-docs 的区别。"
date: 2026-10-16
tags: ["agent-skills"]
lang: "zh"
---

grill-me 是 TypeScript 讲师 Matt Pocock 在开源仓库 mattpocock/skills 里发布的一个 agent skill：你输入 `/grill-me` 并讲一个还很粗糙的想法，agent 会不停地追问你，直到方案里每一个决策分支都定下来为止。

Pocock 的出发点是，软件开发里最常见的失败是「没对齐」。agent 写错东西的速度很快，写得再快也还是错的。所以他把需求访谈做成一个 skill，让 agent 在动手写代码之前先把你问清楚。

## 它怎么运作

- **只能由你手动触发**：agent 不会自己调用它，你得输入 `/grill-me`，而且官方文档建议在一个新会话里开始，不要叠在 agent 已经写好的计划上。
- **按轮次提问**：每一轮问的是所有前提已经确定的问题，所以不会问到依赖你还没回答的事情。
- **不留任何文件**：它是无状态的，不需要仓库，也不限于代码，产品规划、商业决策、写作构思都能用。产出只是你脑子里一个更清楚的方案。

这个仓库用 MIT 许可开源，并不是 Anthropic 官方出品的 skill。在 Claude Code 里，用 `claude plugin install mattpocock-skills@claude-plugins-official` 可以一次装好整套，之后作者更新时会自动同步；如果你用的是 Codex 或别的 agent，可以用 `npx skills add https://github.com/mattpocock/skills --skill grill-me` 只把这一个装进项目目录。

## 和 grill-with-docs 的区别

两者底层用的是同一个 `grilling` skill。区别是 grill-with-docs 有状态：它会读你的代码库，把讨论中确定下来的术语和决策写进 `GLOSSARY.md` 和架构决策记录（ADR）。想法还没落到具体仓库时用 grill-me，要改一个真实代码库时用 grill-with-docs。

我觉得它好用的地方在于逆转了角色：平时是你问 agent，这里是 agent 问你。很多需求漏洞不是 agent 理解错了，而是你自己根本没想过那个分支。

## 延伸阅读

- [agentskills.io 入门：用技能和工具构建 AI 代理](/cn/blog/agentskills-io-starter-guide/)
- [规格驱动开发是什么？](/cn/garden/questions/what-is-spec-driven-development/)
- [mattpocock/skills 仓库](https://github.com/mattpocock/skills)
- [grill-me 官方说明](https://github.com/mattpocock/skills/blob/main/docs/productivity/grill-me.md)
