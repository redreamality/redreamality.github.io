# **OpenSpec 深度研究报告：规格驱动开发（SDD）在 AI 辅助编程中的架构与实践**

## **1\. 引言：AI 辅助编程的范式转移**

随着大语言模型（LLM）能力的指数级增长，软件工程领域正经历一场深刻的变革。开发者从传统的逐行编码（Character-by-Character）转向了意图驱动的编排（Intent-Driven Orchestration）。然而，这种转变并非没有代价。在当前的 AI 编程实践中，普遍存在一种被称为“直觉式编程”（Vibe Coding）的现象——开发者通过非结构化的自然语言对话与 AI 交互，需求散落在冗长的聊天记录中，缺乏持久性和系统性 1。

### **1.1 “直觉式编程”的困境**

尽管“直觉式编程”降低了入门门槛，但其在复杂项目中的不可持续性日益凸显。当上下文窗口（Context Window）被填满时，AI 往往会表现出“健忘”症状，导致逻辑断层、代码回退甚至严重的幻觉（Hallucination）。研究表明，当上下文使用率超过 40% 时，AI 的性能会显著下降，之前的需求细节在后续的对话中被遗忘或篡改 3。此外，这种模式使得代码审查变得极其困难，因为评审者无法将生成的代码与明确的、成文的需求规格进行比对。

### **1.2 OpenSpec 的诞生与使命**

在此背景下，OpenSpec 作为一种标准化的“规格驱动开发”（Spec-Driven Development, SDD）框架应运而生。它不仅是一个工具，更是一种工程方法论，旨在通过“先结构，后代码”（Structure before Code）的原则，解决 AI 编程中的上下文丢失和不可控问题 5。

OpenSpec 的核心价值主张在于其“棕地优先”（Brownfield-first）的策略。与许多专注于从零构建新应用（Greenfield, 0→1）的 AI 工具不同，OpenSpec 被专门设计用于应对现有代码库的演进（1→n）。它通过将当前系统状态（Source of Truth）与拟议变更（Change Proposals）在文件系统中物理隔离，确保了变更的原子性和可审计性 6。这种架构使得 AI 代理（Agent）不再仅仅是生成代码的黑盒，而是成为能够理解、规划并执行明确任务的智能协作者。

## **2\. 核心架构与设计哲学**

OpenSpec 的架构设计体现了极简主义与实用主义的结合。它拒绝了复杂的数据库依赖，转而采用以 Markdown 为基础的文件系统存储方案。这种设计确保了规格说明书（Spec）能够与源代码一同驻留在版本控制系统（如 Git）中，成为“活的文档”（Living Documentation）1。

### **2.1 存储库结构解析**

当 OpenSpec 在项目中初始化时，它会注入一个标准化的目录结构，充当 AI 代理的“外部长期记忆”。这种结构不仅人类可读，更是为机器解析进行了优化 6。

#### **2.1.1 根目录结构概览**

一个典型的 OpenSpec 项目包含以下核心组件：

project\_root/  
├── openspec/  
│ ├── AGENTS.md \# AI 代理的指令集与行为准则  
│ ├── project.md \# 全局项目上下文、技术栈与规范  
│ ├── specs/ \# 当前系统的“真实信源”（Source of Truth）  
│ │ ├── auth-login/ \# 按能力（Capability）组织的规格文件夹  
│ │ │ └── spec.md  
│ │ └── payment/  
│ │ └── spec.md  
│ └── changes/ \# 活跃的变更提案（工作区）  
│ └── add-oauth-login/  
│ ├── proposal.md \# 变更意图与高层设计  
│ ├── design.md \# 技术架构决策  
│ ├── tasks.md \# 原子化的实施任务清单  
│ └── specs/ \# 规格增量（Deltas：新增/修改/移除）

#### **2.1.2 真实信源（specs/）**

specs/ 目录是 OpenSpec 的核心资产库。它按功能模块（Capabilities）组织，存储了系统当前的业务逻辑和技术约束。例如，auth-login/spec.md 可能详细定义了登录流程的输入验证规则、错误处理机制和安全要求。当 AI 代理接到修改任务时，它首先会检索此目录，以理解系统的既有行为。这种机制有效地防止了 AI 在修改一个功能时意外破坏另一个功能的逻辑，解决了长对话中的“灾难性遗忘”问题 3。

#### **2.1.3 变更工作区（changes/）**

OpenSpec 引入了类似 Git 分支的变更管理模型。所有的功能请求或 Bug 修复最初都体现为 changes/ 目录下的一个独立子文件夹。这种隔离至关重要——它允许开发者和 AI 在不污染主规格库的情况下，对需求进行反复迭代和验证。只有在变更被实施并验收后，这些临时的规格增量才会被合并回 specs/ 主目录 6。

#### **2.1.4 代理接口（AGENTS.md）**

AGENTS.md 文件被形象地称为“机器人的自述文件”（README for Robots）。它不同于给人类看的 README.md，而是包含了针对 AI 模型的精细指令，指导其如何读取项目上下文、如何格式化输出以及如何遵循 OpenSpec 的工作流状态机 10。该文件的存在使得 OpenSpec 具有极高的通用性——即使是未原生集成 OpenSpec 的 AI 工具，只要能读取此文件，也能遵循规范进行开发 11。

### **2.2 状态机模型与生命周期**

OpenSpec 强制执行一种严格的软件演进状态机，将开发过程划分为四个不可逆的阶段：

| 阶段 | 核心动作 | 输出产物 | 目的 |
| :---- | :---- | :---- | :---- |
| **1\. 提案 (Proposal)** | /openspec:proposal | proposal.md, tasks.md, design.md | 明确意图，制定计划，分解任务。 5 |
| **2\. 定义 (Definition)** | openspec validate | specs/ (Deltas) | 编写具体的规格增量（新增、修改、移除）。 11 |
| **3\. 实施 (Apply)** | /openspec:apply | 源代码变更 | AI 根据任务清单和规格编写代码。 7 |
| **4\. 归档 (Archive)** | /openspec:archive | 合并后的 specs/ | 将变更固化为永久文档，清理工作区。 6 |

这种结构化的生命周期确保了文档永远不会落后于代码，从根本上解决了软件工程中“文档腐烂”的顽疾 7。

## **3\. 环境配置与系统初始化**

OpenSpec 作为一个基于 Node.js 的命令行工具（CLI），其安装和配置过程设计得尽可能轻量化，不需要复杂的依赖链，也不依赖于任何特定的 SaaS 平台 API 密钥，这对于注重数据隐私的企业环境尤为重要 5。

### **3.1 安装先决条件与步骤**

要运行 OpenSpec，宿主系统必须安装 Node.js，且版本建议在 v20.19.0 或以上，以确保对最新的文件系统操作 API 的支持 14。

全局安装：  
OpenSpec 通常通过 npm 进行全局安装，以便在任何项目路径下调用：

Bash

npm install \-g @fission-ai/openspec@latest

安装完成后，可以通过 openspec \--version 命令验证安装的完整性 6。

### **3.2 交互式初始化**

进入项目根目录后，运行初始化命令启动配置向导：

Bash

openspec init

此过程是上下文感知的。OpenSpec 会引导用户选择当前开发团队所使用的主要 AI 辅助工具。支持的选项包括但不限于：

* **Claude Code**：Anthropic 的命令行代理。  
* **Cursor**：集成了 AI 的 IDE。  
* **GitHub Copilot**：广泛使用的代码补全工具。  
* **Windsurf / Kilo Code**：新型的 AI 原生编辑器。  
* **其他（Generic）**：对于未列出的工具，系统会生成通用的 AGENTS.md 指令。

配置生成的逻辑：  
如果用户选择了 "Cursor" 或 "Claude Code"，OpenSpec 会自动配置这些工具专用的 Slash Commands（斜杠命令，如 /openspec:proposal）。例如，对于 GitHub Copilot CLI，它会在 .github/prompts/ 下生成特定的提示词模板；对于 Windsurf，则会在 .windsurf/workflows/ 下生成工作流定义 14。  
非交互式初始化（CI/CD 友好）：  
对于自动化脚本或批量部署，可以使用参数跳过向导：

Bash

openspec init \--tools claude,cursor

这使得 OpenSpec 易于集成到企业级的项目脚手架中 17。

### **3.3 关键配置文件详解**

初始化后，项目中最关键的两个静态配置文件是 openspec/project.md 和 openspec/AGENTS.md。

1\. 全局上下文锚点：project.md  
此文件不仅仅是项目介绍，它是 AI 理解整个工程的“世界观”。开发者应在此处详尽描述：

* **技术栈**：明确版本号（如 TypeScript 5.0, React 18），防止 AI 使用过时或不兼容的语法。  
* **架构模式**：例如，“所有数据库访问必须通过 Repository 层，严禁在 Controller 中直接查询”。  
* **代码规范**：命名约定、目录结构偏好。  
* 业务领域知识：特定行业的术语和规则。  
  这种预置的上下文能够极大地减少 AI 的“幻觉”，使其生成的代码更符合项目惯例 11。

2\. 代理行为准则：AGENTS.md  
这个文件包含了一段特殊的 XML 风格标记块 ... ，用于被 openspec update 命令自动维护。它指示 AI：“当用户请求包含‘计划’、‘提案’或‘规格’等词汇时，必须首先读取本文件” 11。这种机制相当于为 AI 注入了一条底层的系统指令，强制其进入 OpenSpec 的工作模式。

## **4\. OpenSpec 工作流全解析**

OpenSpec 将开发过程重构为一个闭环的工程循环。本节将详细拆解每个阶段的操作细节和背后的逻辑。

### **4.1 第一阶段：提案与规划（Proposal）**

在传统开发中，开发者可能会直接告诉 AI：“帮我加一个带双因素认证的登录功能”。而在 OpenSpec 流程中，这一请求转化为一个结构化的提案过程。

触发方式：  
在 Cursor 或 Claude Code 中输入：  
/openspec:proposal Add user authentication with 2FA  
注：不同工具的触发前缀可能微调，如 Kilo Code 使用 /openspec-proposal.md 9。  
**AI 的推理过程：**

1. **上下文检索**：AI 读取 project.md 和 specs/ 目录下的相关文件，分析现有系统的认证模块状态。  
2. **脚手架生成**：AI 在 openspec/changes/ 下创建一个名为 add-user-auth 的新目录。  
3. **文档生成**：  
   * **proposal.md**：阐述变更的动机（Motivation）、范围（Scope）和预期影响。这相当于一份简化的 PRD（产品需求文档）5。  
   * **tasks.md**：这是 AI 为自己生成的“行动指南”。它将复杂的任务拆解为不可再分的原子步骤。例如：“1.1 在用户表添加 OTP 密钥字段”、“2.1 实现 TOTP 生成算法”、“3.1 更新前端登录表单 UI”。这种拆解至关重要，它允许 AI 在后续实施阶段每完成一步就“打钩”，从而保持对进度的掌控 14。  
   * **design.md**（可选）：记录技术决策，如选择哪种加密库、数据库索引策略等 3。

### **4.2 第二阶段：规格定义与增量（Spec Deltas）**

这是 OpenSpec 与普通任务管理工具的分水岭。在此阶段，AI 必须明确指出它打算如何修改系统的行为。OpenSpec 采用“增量”（Delta）模式来描述需求变更。

**增量类型：**

* **ADDED**：全新的功能需求。  
* **MODIFIED**：对现有逻辑的修改。必须包含修改后的完整需求文本。  
* **REMOVED**：被废弃的功能。

示例：双因素认证的规格增量  
AI 会在 changes/add-user-auth/specs/auth/spec.md 中生成如下内容：

## **ADDED Requirements**

### **Requirement: Two-Factor Authentication**

用户在登录时必须提供第二验证因子。

#### **Scenario: 需要 OTP 验证**

* **GIVEN** 用户已启用 2FA  
* **WHEN** 提供了正确的用户名和密码  
* THEN 系统应返回 OTP 挑战请求，而不是直接颁发令牌  
  这种结构化的 GIVEN/WHEN/THEN 格式（类似 Cucumber/Gherkin）使得需求既清晰又具有可测试性 11。

验证（Validation）：  
在进入编码之前，开发者运行验证命令：

Bash

openspec validate add-user-auth

此命令会严格检查规格文件的语法：是否包含必要的 Scenario？是否使用了规范的用语（SHALL/MUST）？这层校验相当于代码编译前的静态检查，拦截了模糊不清的需求 13。

### **4.3 第三阶段：实施与编码（Apply）**

当规格经过人工审查和机器验证无误后，真正的编码工作才开始。

执行命令：  
/openspec:apply add-user-auth  
**AI 的执行逻辑：**

1. **读取任务**：加载 tasks.md。  
2. **参照规格**：AI 将 proposal.md 和 specs/ 中的增量视为不可违背的指令。  
3. **循序渐进**：AI 按照任务列表的顺序，逐个修改源代码文件。它不会“凭感觉”写代码，而是严格实现规格中定义的行为。  
4. **状态同步**：每完成一个任务，AI 可能会更新 tasks.md 中的状态标记 7。

由于 AI 在此阶段只需关注“如何实现”（How）而不是“实现什么”（What），其认知负荷大大降低，代码生成的准确率显著提高。

### **4.4 第四阶段：归档与合并（Archive）**

功能开发完成并通过测试后，变更生命周期进入尾声。

执行命令：  
/openspec:archive add-user-auth \--yes  
**系统动作：**

1. **规格合并**：CLI 工具将 changes/ 目录下的规格增量智能合并到主目录 specs/ 中。新增的需求被追加，修改的需求覆盖旧版本。  
2. **清理现场**：add-user-auth 目录被移除或移动到归档区。  
3. **单一信源更新**：此时，specs/ 目录准确反映了包含新功能在内的系统最新状态，为下一次迭代做好了准备 6。

## **5\. AI 代理集成与工具生态**

OpenSpec 的强大之处在于其跨平台的兼容性。它通过特定的适配层与主流 AI 编程工具无缝集成。

### **5.1 Cursor 集成**

Cursor 是目前 OpenSpec 支持最完善的 IDE 之一。

* **原理**：OpenSpec 利用 Cursor 的自定义 Slash Command 功能。  
* **体验**：用户无需离开编辑器，直接在 Chat 窗口输入 /openspec:proposal 即可唤起流程。OpenSpec 生成的文件（如 proposal.md）会直接在编辑器中打开，供用户审阅和修改。  
* **优势**：Cursor 的 AI 能够很好地理解文件系统上下文，使得多文件修改（如同时更新前后端代码）变得流畅 5。

### **5.2 Claude Code 集成**

Claude Code 提供了强大的推理能力，特别适合处理复杂的重构任务。

* **原理**：OpenSpec 通过配置 Claude Code 的 config.toml 或类似机制注册自定义命令。  
* **特点**：Claude Code 在执行 /openspec:proposal 时，表现出极强的逻辑规划能力。它能够递归地读取现有代码，生成的 design.md 往往包含深刻的架构洞察 4。  
* **注意**：在使用 Claude Code 时，有时会遇到“Plan Mode”（计划模式）限制，导致无法直接执行文件操作（如归档）。此时需明确授权或手动运行 CLI 命令 20。

### **5.3 GitHub Copilot CLI 集成**

* **原理**：OpenSpec 在 .github/prompts/ 目录下生成 .prompt.md 文件。  
* **用法**：Copilot CLI 会自动识别这些提示词文件，将其转化为斜杠命令。这使得 OpenSpec 的工作流可以无缝嵌入到 GitHub 的原生生态中，便于企业级用户采纳 16。

### **5.4 Windsurf 与 Kilo Code**

这些新兴工具通常具有自动发现工作流的能力。

* **配置**：openspec init 会在 .kilocode/workflows/ 等目录下放置定义文件。  
* **自动化**：在这些工具中，/openspec-apply 可以触发更高级的代理行为，甚至可以配置为在代码生成后自动运行单元测试，只有测试通过才标记任务完成 14。

## **6\. 高级应用模式与最佳实践**

对于大型团队或遗留项目，OpenSpec 提供了一些高级模式以应对复杂场景。

### **6.1 “翻新”模式（Retrofitting）**

面对没有文档的遗留代码（Legacy Code），OpenSpec 可以作为逆向工程工具。

* **操作**：创建一个名为 baseline 的变更提案。  
* **指令**：提示 AI “阅读 src/legacy-module 的源码，并反向生成描述其当前行为的 OpenSpec 规格文件”。  
* **价值**：这不仅生成了文档，还为重构提供了基准（Baseline）。在后续重构中，可以让 AI 确保新的实现仍然符合这些基准规格，从而保证行为一致性 13。

### **6.2 令牌效率优化（Token Efficiency）**

在大型项目中，直接将所有代码扔给 AI 会瞬间耗尽 Token。OpenSpec 通过结构化文件实现了“按需加载”：

* **策略**：AI 只需读取 project.md（全局概览）、tasks.md（当前任务）和相关的 spec.md（具体需求）。  
* **效果**：这种精简的上下文输入使得 AI 能够专注于当前切片，显著降低了 Token 消耗，同时提高了响应速度和准确性 3。

### **6.3 团队协作与 CI/CD 集成**

OpenSpec 的文件系统架构天然支持 Git 工作流。

* **代码审查**：在提交 PR 时，评审者不仅看代码（Diff），还可以看 changes/ 目录下的 proposal.md 和 specs/。这使得评审者能先判断“意图是否正确”，再看“实现是否正确”。  
* **自动化校验**：可以在 CI 流水线中加入 openspec validate 步骤，强制要求所有提交的规格文件必须符合语法规范，防止低质量的需求文档混入仓库 4。

## **7\. 故障排除与常见问题指南**

尽管 OpenSpec 流程严谨，但在实际操作中仍可能遇到问题。以下是针对常见故障的诊断与修复方案。

| 问题现象 | 可能原因 | 解决方案 |
| :---- | :---- | :---- |
| **AI 忽略规格直接写代码** | 上下文过载或 AGENTS.md 未被读取 | 1\. 运行 openspec update 刷新指令。 2\. 在 Prompt 中显式要求：“Read @openspec/AGENTS.md first”。 11 |
| **命令 openspec 未找到** | npm 全局路径未加入 PATH 环境变量 | 检查 npm list \-g \--depth=0，并将 Node bin 目录加入 Shell 配置文件（如 .zshrc）。 6 |
| **无法归档（Plan Mode）** | AI 代理处于安全受限模式，禁止文件删除操作 | 1\. 尝试在 Chat 中授权。 2\. 降级为手动在终端运行 openspec archive \<id\>。 20 |
| **规格验证失败** | 规格文件缺少 Scenario 或 Header 格式错误 | 运行 openspec validate 查看具体报错，确保每个 Requirement 至少包含一个 Scenario。 13 |
| **AI 产生幻觉/引用不存在的库** | project.md 中未明确技术栈版本 | 更新 project.md，明确指定依赖库的版本（如 "Use React 18, not 16"）。 11 |

## **8\. 竞品分析：OpenSpec vs. SpecKit vs. Kiro**

在 AI 辅助开发领域，OpenSpec 并非唯一的选择。通过对比可以更清晰地定位其适用场景。

| 特性维度 | OpenSpec | SpecKit | Kiro |
| :---- | :---- | :---- | :---- |
| **核心场景** | **棕地开发 (1→n)**：擅长在现有代码基础上迭代。 | **绿地开发 (0→1)**：擅长从零构建新应用。 | 全集成 IDE 体验。 |
| **变更管理机制** | **集中式**：每个变更的所有相关文件都在一个独立的 changes/ 文件夹中。 | **分散式**：更新直接散落在多个规格文件中。 | 基于 UI 的管理，文件不可见性较高。 |
| **轻量级程度** | **极高**：纯 CLI，基于 Markdown，无服务器依赖。 | **中等**：生成大量脚手架文件。 | **低**：需要特定的 IDE 环境或 SaaS 账户。 |
| **成本与隐私** | **免费/开源**：无需 API Key，数据本地化。 | **免费/开源** | 部分功能收费/需云端同步。 |
| **设计哲学** | 结构先行 (Structure First) | 规格先行 (Spec First) | 可视化 SDD |

深度对比分析：  
OpenSpec 的最大优势在于其“变更隔离”机制。SpecKit 倾向于直接修改主规格文件，这在多人协作时容易导致冲突。而 OpenSpec 的 changes/ 目录设计使得每个功能开发都像是一个独立的微型项目，直到最后一刻才合并。这种设计更符合现代软件工程的 Git Flow 或 Trunk Based Development 模式 7。

## **9\. 结论与展望**

OpenSpec 代表了 AI 辅助软件开发的一次重要成熟化演进。它深刻地认识到，虽然 LLM 具备强大的代码生成能力，但缺乏维持长期架构一致性和业务逻辑完整性的内在机制。通过引入轻量级但严格的文件结构和状态机工作流（Proposal \-\> Apply \-\> Archive），OpenSpec 成功地将“直觉式编程”的随意性转化为可重复、可审计的工程过程。

对于致力于将 AI 深度整合进核心开发流程的团队而言，OpenSpec 提供了一个低成本、高回报的解决方案。它不仅解决了 Token 上下文限制和幻觉问题，更重要的是，它重新确立了“规格”在开发中的核心地位——代码只是实现的细节，而规格才是系统的灵魂。随着 AI 代理能力的进一步提升，像 OpenSpec 这样能够架起人类意图与机器执行之间桥梁的框架，必将成为未来软件工业的基础设施。

---

参考文献索引：

1

#### **Works cited**

1. OpenSpec: NEW Toolkit Ends Vibe Coding\! 100x Better Than Vibe Coding (Full Tutorial), accessed January 9, 2026, [https://www.youtube.com/watch?v=gHkdrO6IExM](https://www.youtube.com/watch?v=gHkdrO6IExM)  
2. OpenSpec: Build Reliable Apps 100x Faster with Spec-Driven AI Development (Future of Vibe Coding\!) \- YouTube, accessed January 9, 2026, [https://www.youtube.com/watch?v=UtZyvtexJRM](https://www.youtube.com/watch?v=UtZyvtexJRM)  
3. Spec-driven development is underhyped\! Here's how you build better with Cursor\! \- Reddit, accessed January 9, 2026, [https://www.reddit.com/r/cursor/comments/1nomd8t/specdriven\_development\_is\_underhyped\_heres\_how/](https://www.reddit.com/r/cursor/comments/1nomd8t/specdriven_development_is_underhyped_heres_how/)  
4. A Practical Development Guide Based on OpenSpec \+ Claude CLI | by HBLOG | Dec, 2025, accessed January 9, 2026, [https://jxausea.medium.com/a-practical-development-guide-based-on-openspec-claude-cli-26da7df71356](https://jxausea.medium.com/a-practical-development-guide-based-on-openspec-claude-cli-26da7df71356)  
5. OpenSpec \- Lightweight & portable spec driven framework for AI coding assistants\!, accessed January 9, 2026, [https://forum.cursor.com/t/openspec-lightweight-portable-spec-driven-framework-for-ai-coding-assistants/134052](https://forum.cursor.com/t/openspec-lightweight-portable-spec-driven-framework-for-ai-coding-assistants/134052)  
6. @fission-ai/openspec \- npm, accessed January 9, 2026, [https://www.npmjs.com/package/@fission-ai/openspec](https://www.npmjs.com/package/@fission-ai/openspec)  
7. From Vibe Coding to Spec-Driven Development: Building Software That Scales \- Medium, accessed January 9, 2026, [https://medium.com/elevate-tech/from-vibe-coding-to-spec-driven-development-building-software-that-scales-4d459e77d8fb](https://medium.com/elevate-tech/from-vibe-coding-to-spec-driven-development-building-software-that-scales-4d459e77d8fb)  
8. Beads \+ Claude Code reduced my compaction regression loop a lot : r/ClaudeCode \- Reddit, accessed January 9, 2026, [https://www.reddit.com/r/ClaudeCode/comments/1pyxtad/beads\_claude\_code\_reduced\_my\_compaction/](https://www.reddit.com/r/ClaudeCode/comments/1pyxtad/beads_claude_code_reduced_my_compaction/)  
9. OpenSpec vs Spec Kit: Choosing the Right AI-Driven Development Workflow for Your Team, accessed January 9, 2026, [https://hashrocket.com/blog/posts/openspec-vs-spec-kit-choosing-the-right-ai-driven-development-workflow-for-your-team](https://hashrocket.com/blog/posts/openspec-vs-spec-kit-choosing-the-right-ai-driven-development-workflow-for-your-team)  
10. AGENTS.md, accessed January 9, 2026, [https://agents.md/](https://agents.md/)  
11. How to make AI follow your instructions more for free (OpenSpec) \- DEV Community, accessed January 9, 2026, [https://dev.to/webdeveloperhyper/how-to-make-ai-follow-your-instructions-more-for-free-openspec-2c85](https://dev.to/webdeveloperhyper/how-to-make-ai-follow-your-instructions-more-for-free-openspec-2c85)  
12. AGENTS.md \- Fission-AI/OpenSpec \- GitHub, accessed January 9, 2026, [https://github.com/Fission-AI/OpenSpec/blob/main/AGENTS.md](https://github.com/Fission-AI/OpenSpec/blob/main/AGENTS.md)  
13. openspec-retrofit.md \- GitHub Gist, accessed January 9, 2026, [https://gist.github.com/mvdmakesthings/cd4a9432cc8665be7cb5060740158806](https://gist.github.com/mvdmakesthings/cd4a9432cc8665be7cb5060740158806)  
14. Fission-AI/OpenSpec: Spec-driven development (SDD) for AI coding assistants. \- GitHub, accessed January 9, 2026, [https://github.com/Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec)  
15. Wannabe Exceptional \- Wannabe Exceptional, accessed January 9, 2026, [https://jpmrblood.github.io/](https://jpmrblood.github.io/)  
16. Feature Request: Support custom slash commands from .github/prompts directory · Issue \#618 · github/copilot-cli, accessed January 9, 2026, [https://github.com/github/copilot-cli/issues/618](https://github.com/github/copilot-cli/issues/618)  
17. Issue \#385 · Fission-AI/OpenSpec \- CLI Options \- GitHub, accessed January 9, 2026, [https://github.com/Fission-AI/OpenSpec/issues/385](https://github.com/Fission-AI/OpenSpec/issues/385)  
18. How to generate consistent code using OpenSpec, which makes specification-driven development easy to adopt \- GIGAZINE, accessed January 9, 2026, [https://gigazine.net/gsc\_news/en/20251026-openspec/](https://gigazine.net/gsc_news/en/20251026-openspec/)  
19. Spec-driven development with AI: Get started with a new open source toolkit \- The GitHub Blog, accessed January 9, 2026, [https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/](https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/)  
20. Mwahahahaha\! It lives\! · Issue \#391 · Fission-AI/OpenSpec \- GitHub, accessed January 9, 2026, [https://github.com/Fission-AI/OpenSpec/issues/391](https://github.com/Fission-AI/OpenSpec/issues/391)