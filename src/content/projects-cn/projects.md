---
title: "我的项目与课题"
description: "本页面展示了我近期关注的领域、开源项目及研究成果。"
pubDate: 2025-01-22
author: "redreamality"
lang: "zh"
---

最近更新于 2025年8月24日。

> 欢迎来到我的开源项目和研究成果集合。这些项目涵盖了人工智能/机器学习、Web 开发、数据处理和研究工具等多个领域。

## 自动化构建智能体

### The Agent Builder
>**网站:** [the-agent-builder.com](https://the-agent-builder.com/)  **状态:** Alpha 版本 - 免费使用

一个全面的 AI 智能体开发平台，提供从概念到现实的完整工具链。The Agent Builder 将 AI 能力从单纯的“代码生成”转向“需求澄清和规划设计”，从源头解决软件开发的痛点。

**核心特性:**

- **交互式需求澄清**: 利用 LLM 的对话能力主动澄清模糊需求，挖掘隐藏意图。
- **结构化任务规划**: 输出“思维蓝图”，拒绝黑盒操作，生成详细的实施计划。
- **集成开源工具生态**: 智能整合现有生态资源，在规划阶段即可连接开发工具。
- **标准化设计文档输出**: 自动生成“建设蓝图”，助力知识资产积累。
- **全自动化执行**: 端到端实现，支持多语言框架和 CI/CD 流程。

**开发工具链:**

- **Plan**: 智能规划 - AI 驱动的项目规划工具（已上线）。
- **Code**: 代码生成 - 基于规划自动生成高质量代码（即将推出）。
- **Test**: 自动化测试 - 智能生成测试用例（即将推出）。
- **Publish**: 一键发布 - 自动化部署流程（即将推出）。

### GTPlanner: AI 驱动的 PRD 生成工具
**代码仓库:** [OpenSQZ/GTPlanner](https://github.com/OpenSQZ/GTPlanner)
**编程语言:** Python | **星标:** 18 | **分叉:** 12
**网站:** [the-agent-builder.com](https://the-agent-builder.com/)

GTPlanner 是 The Agent Builder 的开源规划引擎，是专为 "Vibe Coding"（氛围编程）设计的智能产品需求文档 (PRD) 生成工具，能够将自然语言描述快速转换为结构化的技术文档。

**主要特性:**

- **自然语言处理**: 将零散的需求描述转换为结构化的 PRD。
- **多语言支持**: 完整支持中、英、西、法、日等多种语言。
- **异步处理**: 基于异步管道设计，确保高效的响应性能。
- **多轮优化**: 通过交互式反馈循环不断迭代优化文档质量。
- **结构化输出**: 生成标准化且可高度定制的技术文档。
- **可扩展架构**: 模块化节点设计，易于二次开发和功能扩展。

**使用方式:**

- **Web UI**: 现代化的在线规划体验（推荐）。
- **CLI 模式**: 支持交互式和直接执行两种模式。
- **FastAPI 后端**: 提供标准的 REST API 服务。
- **MCP 集成**: 与 AI 助手无缝集成。

**技术架构:**

- 基于 PocketFlow 的异步节点架构。
- 支持多种主流 LLM 模型。
- 内置自动文件管理和语言检测功能。
- 提供完整的开发者工具链。

## 🔬 过往研究

在大模型时代到来之前，我主要深耕于信息抽取和知识图谱领域。

### WebKE: 知识三元组提取
**代码仓库:** [redreamality/webke](https://github.com/redreamality/webke)  
**编程语言:** Python | **星标:** 13 | **分叉:** 3

利用预训练标记语言模型从半结构化网页中提取知识。该项目实现了发表于 CIKM 2021 的研究论文 "WebKE: Knowledge Triple Extraction from Semi-structured Web with Pre-trained Markup Language Models"。

**主要特性:**

- 使用预训练的 HTMLBERT 模型进行网页内容理解。
- 从半结构化网页中高效提取知识三元组。
- 提供研究级实现，并附带全面的评估工具。

### RERE: 关系抽取
**代码仓库:** [redreamality/RERE-relation-extraction](https://github.com/redreamality/RERE-relation-extraction)  
**编程语言:** Python | **星标:** 20 | **分叉:** 4

论文 "Revisiting the Negative Data of Distantly Supervised Relation Extraction" 的官方实现。该项目通过创新方法解决了远程监督关系抽取中噪声负数据的挑战。

**主要特性:**

- 提出了一种处理远程监督中负数据的全新方法。
- 在标准基准数据集上进行了全面评估。
- 提供可供研究和复现的高质量代码库。
