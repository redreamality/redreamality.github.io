---
title: "Augment Code 凭什么估值 10 亿美元？"
description: "从用户、定价、融资到投资人背景拆解 Augment Code——最能说明问题的不是产品，而是股东名单。"
date: 2026-04-24
tags: ["ai", "startup", "vc", "coding-assistant"]
lang: "zh"
---

2024 年 4 月，Augment Code 以 9.77 亿美元投后估值完成 2.27 亿美元 B 轮，和 Cursor、Cognition 挤进同一档。但和 Cursor 不同，Augment 几乎没有消费者认知。那投资人到底在买什么？

我带着这个问题去查资料，最后发现最能说明问题的信号不在产品页，而在 cap table（股东名单）。

## 先看硬数据

- **营收**：2025 年 10 月约 2000 万美元 ARR（Latka 数据，非官方）
- **团队**：约 188 人（2026-02）
- **累计融资**：约 2.52 亿美元（A 轮 2500 万 + B 轮 2.27 亿 + 11 月扩展轮）
- **估值**：9.77 亿美元投后（2024-04），尚无 C 轮公开报道
- **定价**（2025-10 改为 credits 制）：Indie $20/月，Standard $60/用户/月，Max $200/用户/月，Enterprise 定制
- **用户数**：**未公开总数**。披露的企业侧覆盖：DXC 约 5 万开发者、Pure Storage 约 2000、Tekion 约 1300

对比一下，同期 GitHub Copilot 已有 130 万+ 付费用户。Augment 显然不是在打这场仗。

## 真正的信号：谁在 cap table 上

Augment 的投资人清晰地分成三条战略主线，每一条都在告诉你公司真正的方向。

### 主线一：企业级公司建造

**Sutter Hill Ventures** 领投 A 轮，B 轮加码。Sutter Hill 在硅谷是异类——常青基金，每年只孵化 2–3 家，合伙人亲自出任创始 CEO 直到团队跑通。他们用这套剧本建出了 **Snowflake、Pure Storage、Nvidia、Sumo Logic**。

两位 Sutter Hill 合伙人坐在 Augment 董事会上：**Michael Speiser**（Augment 的 founding CEO，也是 Snowflake 和 Pure Storage 的同款操盘手）和 **Palmer Rampell**。这不是被动下注——Augment 从 day one 就装上了 Snowflake 级的企业运营系统。

据报道，Augment 是 Sutter Hill **在 AI 领域的首次重注**。对照他们在数据仓库做 Snowflake 的模式：低调的企业 GTM、长周期建造、最终赛道统治。

### 主线二：带安全基因的开发者基础设施

**Index Ventures** 派来的是 **Shardul Shah**——多次入选 Forbes Midas List 的合伙人，他的履历基本就是一部云安全名人堂：**Datadog、Wiz、Duo Security（被思科收购）、Adallom（被微软收购）、Signal Sciences、Coalition、Expel**。仅 Wiz 一家，若 Google 的 320 亿美元收购完成，Index 就能拿回约 35 亿美元。

**Evolution Equity Partners** 领投了 2024 年 11 月的 B 轮扩展。他们是**全球最大的网络安全专项 VC**，AUM 25 亿美元，2024-04 刚关了 11 亿美元的新基金。Augment CEO 明确说，选 Evolution 就是看中他们的**安全专长**。

信号很明确：Augment 在走**企业代码安全 + AI 编码**的路线，不是 Copilot 的替代品。面向的是代码库治理、权限、审计、合规——是能让世界 500 强的 CISO 签字过审的那种产品。

### 主线三：AI 前沿 + 晚期资本接力

**Lightspeed Venture Partners** 2025 年 12 月刚关了 90 亿美元的新基金群，投资组合里有 **Anthropic、xAI、Mistral、Databricks、Glean、Reflection AI**——AI 生态的入场券。

**Innovation Endeavors** 是 **Eric Schmidt（前 Google CEO）的基金**。Schmidt 公开点名 Augment Code，认为它证明了 AI 编码已经越过"vibe coding"阶段，进入真实工程效用（"能修 flaky 测试、能重构代码"）。

**Meritech Capital** 是专做 IPO 前接力的晚期机构，组合清单是 **Facebook、Salesforce、Snowflake、Datadog、Zoom、Palo Alto Networks**。Meritech 在 B 轮出现，意味着成熟的 pre-IPO 资金已经把 Augment 当成可上市的候选。

## 股东结构透露的战略

把三条主线叠起来，画面就清晰了：

| 主线 | 代表机构 | 带来的能力 |
|------|----------|-----------|
| 企业 GTM + 公司建造 | Sutter Hill（Speiser、Rampell） | Snowflake/Pure Storage 级操盘 |
| 安全 + 开发者基础设施 | Index（Shah）、Evolution | Wiz/Datadog 的企业销售打法 |
| AI 前沿 + IPO 接力资本 | Lightspeed、Innovation Endeavors、Meritech | 模型生态、Schmidt 背书、公开市场定价经验 |

**没有**主攻消费者/个人开发者的早期 VC，**没有**消费级增长专家，**没有**任何一笔投向 Cursor 风格的赌注。

## 结论

只看 Augment 的产品页，你会以为这是"又一个 AI 编码工具"。但看 cap table，你会看到一家在被建造成**向世界 500 强工程组织卖'治理级 AI 编码基础设施'**的公司——还带着一套能穿透企业采购流程的安全叙事。

9.77 亿美元的估值不是在给当下的产品定价，而是在给一个论点定价：**企业级、安全可审计的 AI 编码**是独立于消费级 AI 编码赛道的一个单独类别，而 Augment 有 Speiser 建公司、Shah 把战略，是赢下这个类别最合适的人选。

这个论点最终能不能立住，是另一个问题。但投资人已经用钱投票了。读 cap table，不是读路演 PPT。
