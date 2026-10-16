---
title: "GPT-6 Astra 什么时候发布的？"
description: "OpenAI 在 2026 年 9 月 3 日（美国时间）发布 GPT-6 Astra，当天先开放给少数机构，随后几天内扩展到 ChatGPT Plus、Pro、Business、Enterprise 和 API。本文整理发布节奏、API 价格和后续的 Sol、Luna。"
date: 2026-10-16
tags: ["gpt-6"]
lang: "zh"
---

GPT-6 Astra 已经发布了：OpenAI 在 2026 年 9 月 3 日（美国时间）正式推出它，当天只开放给一小批机构，之后几天内陆续开放给 ChatGPT Plus、Pro、Business、Enterprise 用户，以及 OpenAI API、Microsoft Azure 和 AWS Bedrock。

## 发布节奏

- **9 月 3 日**：发布 GPT-6 Astra，先给有限的机构使用。Pro、Business、Enterprise 用户还能用 GPT-6 Astra Pro；Enterprise 需要管理员手动开启，默认关闭。
- **9 月 22 日**：GPT-6 家族加入更便宜的 Sol 和 Luna。
- **9 月 29 日**：推出 GPT-6.1 Sol，先在 ChatGPT Work 和 Codex 里给 Pro 用户。
- **10 月 7 日**：ChatGPT 的 Chat 标签页换上 GPT-6 和 Intelligent UI，付费用户用 Sol，Free 和 Go 用 Luna；Pro 推理选项仍然走 Astra。

## API 价格

在 API 里模型名是 `gpt-6-astra`。标准价格是每百万输入 token 10 美元、每百万输出 token 50 美元，缓存读写另计。Fast 模式速度最高到标准的 2 倍，价格也是 2 倍。

## 为什么它卡得比较严

OpenAI 把 Astra 定为在网络安全能力上达到其 Preparedness 框架「Critical」等级的模型，所以上线时加了额外的安全监控：系统判断 agent 可能理解错指令时，ChatGPT 和 Codex 里的任务会暂停，等你确认；API 里任务会直接停止。官方也承认这些检查有时会打断正常工作。对开发者来说，这意味着用 Astra 跑长任务时要预留被中断的处理逻辑。

## 延伸阅读

- [GPT-6 Sol 与 Luna：把 Astra 的智能铺到更便宜的档位](/cn/blog/gpt-6-sol-luna-and-astra/)
- [OpenAI：GPT-6 Astra: A new generation of intelligence](https://openai.com/index/gpt-6-astra/)
- [OpenAI：ChatGPT release notes](https://help.openai.com/en/articles/6825453-chatgpt-release-notes)
