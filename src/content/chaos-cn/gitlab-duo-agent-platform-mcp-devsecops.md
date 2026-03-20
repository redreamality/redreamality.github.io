---
title: "GitLab Duo Agent Platform + MCP：GitLab 想成为 AI 编码代理的操作系统"
pubDate: 2026-03-17T00:00:00.000Z
description: "GitLab 正在把 AI 编码从单点 copilot 推向受治理的工作流基础设施，通过外部 agents、托管凭证、审计轨迹与 MCP 连接整个 DevSecOps 栈。"
author: "Remy"
tags: ["AI", "GitLab", "DevSecOps", "MCP", "AI Agents", "开发者工具"]
lang: "zh"
translatedFrom: "gitlab-duo-agent-platform-mcp-devsecops"
---

# GitLab Duo Agent Platform + MCP：GitLab 想成为 AI 编码代理的操作系统

大多数 AI 编码新闻，讨论的还是同一个问题：到底哪个模型写代码更强。GitLab 押注的方向不一样。它在推动的不是“更好的代码生成”，而是“谁来控制 AI 编码工作流”。

这也是 GitLab Duo Agent Platform 真正值得关注的原因。

2026 年 1 月 15 日，GitLab 正式宣布 Duo Agent Platform 进入 GA。当前文档显示，GitLab 已支持托管外部 agents，包括 Claude Code、OpenAI Codex、Amazon Q 和 Gemini；而最近发布的 MCP 教程则进一步展示了 GitLab 如何作为 MCP 客户端，把这些工作流连接到 Jira、Slack、Confluence 等外部系统。

把这几件事放在一起看，这已经不是“GitLab 也加了 AI 功能”那么简单。GitLab 想做的是一个更大的角色：让人类开发者、内部流程和第三方 coding agents 全部汇聚到同一个受治理的控制平面里。

## 真正的变化，是从 copilot 走向 orchestration

第一波 AI 编码产品，核心逻辑基本都是“在开发者身边放一个助手”。模型可以补全代码、回答问题、提出修改建议，主要服务的是个体开发者。

这当然有价值，但当企业开始希望 AI 真正进入完整的软件生命周期时，重点就变了。只要 AI 开始参与 issue、merge request、审批流程、分支策略和发布管道，核心问题就不再只是“模型会不会写代码”，而会变成：

- 谁可以触发 agent
- 它以什么身份、什么权限运行
- 它的动作在哪里被记录
- 它如何连接外部系统
- 它的输出在进入生产前经过什么治理

GitLab 的优势恰恰在这里。它本来就已经占据了软件交付流程中的关键位置。现在它要做的，不是再造一个更花哨的聊天框，而是把 agent 嵌进现有的 DevSecOps 系统。

## GitLab 正在拥抱外部 agents，而不只是自家 AI

这次文档里最关键的战略信号之一，是 GitLab 并没有把 Duo Agent Platform 限制在“只服务 GitLab 自己的 AI 能力”上。它明确列出的 GitLab 托管外部 agents 包括：

- Claude Code
- OpenAI Codex
- Amazon Q
- Gemini

这件事非常重要。

它意味着 GitLab 不必亲自赢下模型竞赛，也有机会赢下工作流竞赛。未来最强的 coding agents 很可能来自不同供应商，但 GitLab 仍然可以成为企业部署、授权、审计这些 agents 的统一平台。

这会直接改变竞争框架。问题不再是 GitLab 能不能在模型质量上打赢 Anthropic 或 OpenAI，而是它能不能成为所有这些 agents 都必须经过的治理层。

## MCP 是这套战略的放大器

MCP 让这套布局的含义比表面上更大。

如果 GitLab Duo Agent Platform 能作为 MCP 客户端工作，就意味着 GitLab 内部的 coding agent 不再只能看到仓库本身。它还可以连接那些真正承载软件协作的外部系统：工单、规格文档、聊天线程、监控面板、审批工具。

这点非常关键，因为现实中的软件工作天然是碎片化的。计划在 Jira，文档在 Confluence，协作在 Slack，代码和交付在 GitLab。如果一个 coding agent 只看到代码仓库，它其实对整个工作流是“半盲”的。

MCP 减少了这种盲区。它让 GitLab 不需要假装所有上下文都已经收敛在自己平台内，也能提高 agent 的实际价值。

更大的战略含义是：AI 编码竞争的胜负手，未必是哪个模型 demo 最惊艳，而可能是谁能在保持控制力的前提下，接入最多真实上下文。

## 治理能力才是真正的护城河

GitLab 这套故事最强的地方，并不只是“支持更多 agent”。真正关键的是，它把 agent 定义成了企业工作流中的受治理执行者。

无论是文档还是发布内容，都在强调一些在真实组织里远比 demo 更重要的能力：

- agent 行为的审计轨迹
- service account 或复合身份执行
- 对受支持外部 agent 的托管凭证
- 工具访问的审批控制
- agent 创建分支和提交时的安全、规则约束

这也是为什么 DevSecOps 视角如此重要。企业真正想要的，不只是一个会写代码的 AI，而是一个可以在策略、可追踪性和责任边界之内运行的 AI。

所以 GitLab 这一步看起来远比“再发一个 AI assistant”更严肃。它是在把 agentic development 打包成基础设施。

## 这对 Claude Code、Codex 和其他 agent 厂商意味着什么

这里还藏着一个更大的市场信号。Claude Code、Codex、Gemini、Amazon Q 可以在能力、体验和模型质量上竞争，但如果 GitLab 成为了企业调用、审计和审批这些 agents 的地方，权力结构就会变化。

那时，agent 厂商掌握“智能”，而 GitLab 掌握“工作流杠杆”。

这在企业软件里其实是很经典的格局。最难被替换的，往往不是底层引擎最炫的一家，而是那个处在权限、系统和团队交汇点上的平台。

GitLab 现在明显就在争夺这个位置：agentic software development 的操作层。

## 开发者和平台团队真正该看到什么

最实际的结论不是“所有团队现在都该上 GitLab Duo Agent Platform”。真正该看到的是，AI 编码竞争正在上移到更高一层。

接下来更重要的竞争层，会越来越围绕 orchestration 展开：

- agent 如何被触发
- 它如何继承身份和权限
- 它如何获取外部上下文
- 它如何被审查、被约束
- 它的动作如何融入现有交付控制

对平台团队来说，这远比“哪个模型自动补全略强一点”更值得关注。AI 越接近生产工作流，治理问题就越重要。

GitLab 很清楚这一点。Duo Agent Platform 加上 MCP，本质上是在争夺一个位置：把 AI 编码从独立的效率功能，变成 DevSecOps 的操作系统级基础设施。

如果这条路走通，长期赢家未必是模型提供商本身，而可能是那个掌握编排、权限和跨工具工作流控制的平台。

## 参考来源

- [GitLab：GitLab Duo Agent Platform is generally available](https://about.gitlab.com/blog/gitlab-duo-agent-platform-is-generally-available/)
- [GitLab 文档：GitLab Duo Agent Platform](https://docs.gitlab.com/user/duo_agent_platform/)
- [GitLab 文档：External agents](https://docs.gitlab.com/user/duo_agent_platform/agents/external/)
- [GitLab：Extend GitLab Duo Agent Platform, connect any tool with MCP](https://about.gitlab.com/blog/extend-gitlab-duo-agent-platform-connect-any-tool-with-mcp/)
