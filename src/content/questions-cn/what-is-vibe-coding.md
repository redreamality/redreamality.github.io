---
title: "Vibe coding 是什么意思？"
description: "Vibe coding 指用自然语言让 AI 写代码、自己基本不读代码、靠运行结果来判断对错的编程方式。本文说明这个词的来历、它适合和不适合的场景。"
date: 2026-10-16
tags: ["vibe-coding"]
lang: "zh"
---

Vibe coding（氛围编程）是指你用自然语言告诉 AI 要什么，让它生成和修改代码，自己基本不读代码，只看程序跑起来的效果对不对。

这个词来自 Andrej Karpathy 在 2025 年 2 月发的一条帖子。他的原意很直白：完全顺着感觉走，接受 AI 给的所有改动，报错就把错误信息原样贴回去，「忘了代码本身的存在」。他当时说的是周末随手做的小项目，不是生产系统。后来这个词传播得太快，Collins 词典把它选为 2025 年度词汇，含义也被泛化成「用 AI 写代码」的统称。

## 它和普通的 AI 辅助编程有什么区别

区别在于你还审不审代码。用 Copilot 补全、让 Cursor 改一个函数、然后自己逐行看 diff，这是 AI 辅助编程。Vibe coding 的关键是放弃审查：你只验证结果，不验证实现。

所以它的边界也很清楚。做一个原型、一个内部小工具、一个验证想法的 demo，代码寿命以天计，vibe coding 很划算。代码要长期维护、要处理用户数据、要让别人接手的时候，不读代码就意味着没人知道里面有什么，这时候省下的时间迟早要连本带利还回去。

我的看法是，vibe coding 本身不是问题，问题是把原型阶段的习惯带进了生产。很多团队后来转向规格驱动开发，就是想在「让 AI 写」和「知道它写了什么」之间找回平衡。

## 延伸阅读

- [2026 AI 编程工具大战：Vibe Coding 正在把开发者工作流一分为二](/cn/blog/ai-coding-tools-war-vibe-coding-mainstream/)
- [规格驱动开发（spec-driven development）是什么？](/cn/garden/questions/what-is-spec-driven-development/)
- Karpathy 的原帖：[x.com/karpathy/status/1886192184808149383](https://x.com/karpathy/status/1886192184808149383)
