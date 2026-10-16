---
title: "Cursor 多少钱？各档价格和模型怎么计费"
description: "截至 2026-10-16，Cursor 随 X Subscription 出售：Free 0、Plus 每月 8 美元、Premium 30 美元、Super 100 美元、Ultra 200 美元。本文说明每档包含什么、第三方模型怎么收费。"
date: 2026-10-16
tags: ["cursor"]
lang: "zh"
---

截至 2026-10-16，Cursor 个人版有五档：Free 免费，Plus 每月 8 美元，Premium 每月 30 美元，Super 每月 100 美元，Ultra 每月 200 美元；按年付分别是 80、300、1,000、2,000 美元，价格都不含税。

现在 Cursor 是作为 X Subscription 的一部分出售的，同一份订阅同时覆盖 Grok、Cursor 和 X。每个付费档有一个每周刷新的用量池，Cursor 里的 Agent、CLI、Cloud Agents 和 Grok 的各个应用都从这一个池子里扣。Premium 的用量是 Plus 的 4 倍，Super 是 15 倍，Ultra 是 50 倍。

## 每档的关键差别

| 档位 | 月费 | 用量 | 第三方模型 |
| --- | --- | --- | --- |
| Free | 0 | 有限 | 不可用 |
| Plus | 8 美元 | 基准 | 不可用 |
| Premium | 30 美元 | Plus 的 4 倍 | 按 API 标价，从预充值扣 |
| Super | 100 美元 | Plus 的 15 倍 | 同上 |
| Ultra | 200 美元 | Plus 的 50 倍 | 同上 |

Plus 只能用 Cursor 自家模型（Grok 4.7、4.6、4.5 和 Composer 2.5），而且设置固定，没有 Cloud Agents、Bugbot 和自带 API key。想用 Claude、GPT、Gemini，至少要 Premium。Teams 按座位收费，每座 30、100 或 200 美元，对应 Premium、Super、Ultra 的用量。

## 模型怎么计费

用量池只覆盖 Cursor 自家模型。超出每周额度后按模型单价扣预充值：Composer 2.5 每百万 token 输入 0.5 美元、输出 2.5 美元，Grok 4.7 输入 2 美元、输出 6 美元。第三方模型从第一个请求起就按厂商 API 标价收费，比如 Claude Opus 5.5 输入 4 美元、输出 20 美元。Teams 和 Enterprise 调用第三方模型时，每百万 token 还要加 0.25 美元的 Cursor Token Rate，个人版没有这笔。

我的建议是：主要用 Agent 写日常代码，从 Premium 起步就够；每天长时间跑 agent 再考虑 Super。如果你重度依赖 Claude 或 GPT，真正的花销在预充值那一侧，月费反而是小头。

老的 Pro、Pro+、Ultra 等套餐对已有用户继续有效，规则不变。价格经常调整，下单前以官方 [Cursor 定价页](https://cursor.com/pricing) 和 [模型与价格文档](https://cursor.com/docs/models) 为准。

## 延伸阅读

- [Claude Code 额度怎么算：5 小时窗口、周上限与 API 额度](/cn/blog/claude-code-usage-limits-cost-2026/)
- [2026 AI 编程工具大战](/cn/blog/ai-coding-tools-war-vibe-coding-mainstream/)
