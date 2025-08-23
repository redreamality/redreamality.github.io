---
title: "我的课题"
description: "本页包含了我最近热衷的事情、开源项目和研究。"
pubDate: 2025-01-22
author: "redreamality"
lang: "zh"
---

最近更新于 2025年8月24日。

>欢迎来到我的开源项目和研究贡献集合。这些项目涵盖了人工智能/机器学习、Web开发、数据处理和研究工具等多个领域。


## 总体介绍




## 自动化构建智能体



### The Agent Builder
>**网站:** [the-agent-builder.com](https://the-agent-builder.com/)  **状态:** Alpha版本 - 免费使用

一个全面的AI智能体开发平台，提供从概念到现实的完整工具链。The Agent Builder将AI能力从"代码生成"转向"需求澄清和规划设计"，从源头解决软件开发痛点。

**核心特性:**

- **交互式需求澄清**: 通过LLM对话能力主动澄清模糊需求，挖掘隐藏意图
- **结构化任务规划**: 输出"思维蓝图"，拒绝黑盒，生成详细实施计划
- **集成开源工具生态**: 智能整合现有生态资源，在规划阶段连接开发工具
- **标准化设计文档输出**: 自动生成"建设蓝图"，积累资产
- **全自动化执行**: 端到端实现，支持多语言框架和CI/CD流程

**开发工具链:**

- **Plan**: 智能规划 - AI驱动的项目规划工具 (已可用)
- **Code**: 代码生成 - 基于规划自动生成高质量代码 (即将推出)
- **Test**: 自动化测试 - 智能生成测试用例 (即将推出)
- **Publish**: 一键发布 - 自动化部署流程 (即将推出)

### GTPlanner: AI驱动的PRD生成工具
**代码仓库:** [OpenSQZ/GTPlanner](https://github.com/OpenSQZ/GTPlanner)
**编程语言:** Python | **星标:** 18 | **分叉:** 12
**网站:** [the-agent-builder.com](https://the-agent-builder.com/)

GTPlanner是The Agent Builder的开源规划引擎，专为"氛围编程"设计的智能产品需求文档(PRD)生成工具，能够将自然语言描述转换为结构化技术文档。

**主要特性:**

- **自然语言处理**: 将需求描述转换为结构化PRD
- **多语言支持**: 完整支持英语、中文、西班牙语、法语和日语
- **异步处理**: 完全异步管道确保响应性能
- **多轮优化**: 通过交互式反馈循环迭代优化文档
- **结构化输出**: 生成标准化和可定制的技术文档
- **可扩展架构**: 模块化节点设计，易于定制和扩展

**使用方式:**

- **Web UI**: 现代化的在线规划体验 (推荐)
- **CLI模式**: 交互式和直接执行模式
- **FastAPI后端**: REST API服务
- **MCP集成**: 与AI助手无缝集成

**技术架构:**

- 基于PocketFlow的异步节点架构
- 支持多种LLM模型
- 自动文件管理和语言检测
- 完整的开发者工具链

## 🔬 过往研究

大模型时代以前，我过去的主要擅长是信息抽取和知识图谱。

### WebKE: 知识三元组提取
**代码仓库:** [redreamality/webke](https://github.com/redreamality/webke)  
**编程语言:** Python | **星标:** 13 | **分叉:** 3

使用预训练标记语言模型从半结构化网页中提取知识。该项目实现了发表在CIKM 2021的研究论文"WebKE: Knowledge Triple Extraction from Semi-structured Web with Pre-trained Markup Language Models"。

**主要特性:**

- 用于网页内容理解的预训练HTMLBERT模型
- 从半结构化网页提取知识三元组
- 具有全面评估的研究级实现

### RERE: 关系抽取
**代码仓库:** [redreamality/RERE-relation-extraction](https://github.com/redreamality/RERE-relation-extraction)  
**编程语言:** Python | **星标:** 20 | **分叉:** 4

论文"Revisiting the Negative Data of Distantly Supervised Relation Extraction"的实现。该项目解决了远程监督关系抽取中噪声负数据的挑战。

**主要特性:**

- 处理远程监督中负数据的新方法
- 在标准基准上的全面评估
- 可研究复现的代码库

### 集体损失函数 (cPU)
**代码仓库:** [redreamality/cPU](https://github.com/redreamality/cPU)

用于机器学习优化的集体损失函数的研究实现。

## 🔧 开发工具与实用程序

### PocketFlow
我是 https://github.com/The-Pocket/PocketFlow 的主要贡献者之一，并且写了一些周边的工具链。


#### 可观测性
**代码仓库:** [redreamality/pocketflow-tracing](https://github.com/redreamality/pocketflow-tracing)  
**编程语言:** Python | **星标:** 1 | **分叉:** 1

PocketFlow应用程序的追踪和调试工具，提供工作流执行和性能监控的洞察。

**主要特性:**
- 工作流执行追踪
- 性能监控
- 调试友好的输出
- 与PocketFlow生态系统集成

#### PocketFlow FastAPI 模板
**代码仓库:** [redreamality/pocketflow-fastapi-template](https://github.com/redreamality/pocketflow-fastapi-template)  
**编程语言:** Python | **星标:** 3

演示FastAPI、PocketFlow和pocketflow-tracing集成的最小工作示例。非常适合开始使用基于PocketFlow的应用程序。

**主要特性:**
- FastAPI集成
- PocketFlow工作流示例
- 追踪集成
- 生产就绪模板

### Git LaTeX 差异工具
**代码仓库:** [redreamality/git-latexdiff](https://github.com/redreamality/git-latexdiff)  
**编程语言:** Batchfile | **星标:** 18 | **分叉:** 5

用于与预览版本比较LaTeX文件差异的工具，使跟踪学术论文和文档中的更改变得更容易。

**主要特性:**
- LaTeX感知的差异比较
- 可视化预览生成
- Git集成
- 跨平台支持

## 📚 精选列表与资源

### Awesome Manus
**代码仓库:** [redreamality/awesome-manus](https://github.com/redreamality/awesome-manus)  
**编程语言:** Markdown | **星标:** 1

与Manus技术栈相关的开源项目精选列表，涵盖多模态模型、工作流编排、多智能体系统和工具集成。

**涵盖类别:**
- 多模态模型 (OpenFlamingo, LLaVA, IDEFICS)
- 工作流编排 (Argo, Prefect, Airflow)
- 多智能体系统 (AutoGen, LangGraph, CrewAI)
- 工具集成 (LangChain, LlamaIndex)
- 模型服务框架 (vLLM, TGI)


## 🌐 Web应用程序

### WiFi卡片生成器
**代码仓库:** [redreamality/wificard](https://github.com/redreamality/wificard)  
**编程语言:** TypeScript | **星标:** 7

用于生成WiFi网络共享二维码的Web应用程序。创建WiFi连接卡片的简单、清洁界面。

**主要特性:**
- WiFi凭据的二维码生成
- 多种安全协议支持
- 清洁、响应式UI
- 无数据存储 - 注重隐私

### EPUB转文本转换器
**代码仓库:** [redreamality/epub2txt](https://github.com/redreamality/epub2txt)  
**编程语言:** Python

用于电子书转换的简单FastAPI服务器，支持EPUB到文本格式的转换，具有清洁的API接口。


Python应用程序的部署工具和配置，最初来自Coding.net项目。

## 🎤 演示文稿与幻灯片

### 多智能体系统幻灯片
**代码仓库:** [redreamality/multi-agent-system-slides](https://github.com/redreamality/multi-agent-system-slides)  
**编程语言:** Vue

介绍多智能体系统(MAS)的交互式幻灯片，使用现代Web技术构建，提供引人入胜的演示。

### GT规划器幻灯片
**代码仓库:** [redreamality/gtplanner-slides](https://github.com/redreamality/gtplanner-slides)  
**编程语言:** Vue

GT规划器项目的演示幻灯片，展示规划算法和方法论。

## 🌟 特色项目

上述项目代表了多样化的兴趣和专业领域:

- **研究影响**: 在顶级会议(CIKM)发表论文，提供可复现代码
- **实用工具**: 解决开发者和研究人员实际问题的实用程序
- **社区资源**: 帮助社区其他人的精选列表和模板
- **教育内容**: 分享知识的幻灯片和文档

## 🤝 贡献

这些项目中的大多数都欢迎贡献！欢迎您:
- 报告问题和错误
- 建议新功能
- 提交拉取请求
- 改进文档
- 分享您的使用案例

## 📞 联系方式

如有关于任何这些项目的问题，请随时:
- 在相应的GitHub仓库中开启issue
- 访问我的网站: [redreamality.com](https://redreamality.com)
- 通过我网站上的联系信息与我联系

---

*此页面会随着新项目的发布和现有项目的发展而定期更新。最后更新: 2025年1月*
