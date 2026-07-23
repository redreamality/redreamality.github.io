# Loop Engineering：概念、边界与可视化叙事研究

- 研究日期：2026-07-23
- 研究目的：为“什么是 Loop Engineering”交互可视化提供可核验材料
- 取证原则：优先采用提出或系统化该概念的作者、AI 厂商工程文章、官方文档、官方仓库提交与论文原文；二手教程只用于发现线索，不作为关键结论依据
- 置信度：概念内核为高；“谁最早首创”仅为中低，因为术语在 2026 年快速传播、社交媒体内容并不完整，且同名词组早已存在于其他学科

## 摘要结论

在当前 AI Agent / AI 编程语境中，**Loop Engineering 是把人从逐轮提示者的位置移到循环系统设计者的位置**：先定义目标、证据和停止条件，再配置触发器、上下文与技能、工具与权限、隔离与多代理、验证反馈、持久状态和人工审批，使 Agent 能够反复行动、观察、修正，直到达标、受阻或预算耗尽。

最短、最稳妥的厂商定义来自 Claude Code 团队：

> “On the Claude Code team, we define loops as agents repeating cycles of work until a stop condition is met.”

即：**Loop 是 Agent 重复工作周期，直到满足停止条件。** Loop Engineering 则是设计这个循环怎样触发、怎样获得真实反馈、怎样判断完成、怎样恢复、怎样控制成本和副作用。[Claude / Anthropic, 2026-06-30](https://claude.com/blog/getting-started-with-loops)

Addy Osmani 给出了最有传播力的角色转换定义：

> “Loop engineering is replacing yourself as the person who prompts the agent. You design the system that does it instead.”

并把 Loop 描述为一个递归目标：人定义目的，AI 反复迭代直到完成。[Addy Osmani, 2026-06-07](https://addyosmani.com/blog/loop-engineering/)

需要特别避免三个误解：

1. **Loop Engineering 不是“无限重试”。** 没有可验证目标、失败反馈、停止条件和预算的循环，只是失控的 while loop。
2. **它不是 Prompt Engineering 或 Context Engineering 的替代品。** Prompt、上下文、工具和 Harness 都是循环内部仍然需要设计的部件。
3. **它不是“不要人类”。** Agent 可以拥有执行能力；发布、风险承诺和后果仍由人负责。独立 Checker 也是 Agent，不能自动变成最终真相。

## 术语起源与证据边界

### 可以确定的时间线

| 日期 | 一手来源 | 可以确认的事实 | 对概念的贡献 |
| --- | --- | --- | --- |
| 2024-12-19 | [Anthropic《Building effective agents》](https://www.anthropic.com/research/building-effective-agents) | Anthropic 已把 Agent 描述为依靠环境反馈使用工具的循环，并强调 ground truth、人工 checkpoint、停止条件、成本与累积错误 | 奠定 Agent 内循环和 evaluator-optimizer 的工程基础，但未使用 “Loop Engineering” 名称 |
| 2025-09-29 | [Anthropic《Effective context engineering for AI agents》](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) | Context Engineering 是在每次推理前从不断变化的信息宇宙中策划有限上下文 | 明确了 Loop 内“每轮给模型看什么”的子问题 |
| 2025-11-26 | [Anthropic《Effective harnesses for long-running agents》](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) | 长任务需在上下文窗口之外保存 feature list、进度、Git 状态，并要求增量执行和真实端到端测试 | 奠定跨会话持久状态、恢复和验证的实践基础 |
| 2026-04-19 | [Addy Osmani《Agent Harness Engineering》](https://addyosmani.com/blog/agent-harness-engineering/) | Harness 是模型之外的提示、工具、上下文策略、Hooks、沙箱、子代理、反馈和恢复路径 | 为区分 Harness 与 Loop 提供明确边界 |
| 2026-05-11 | [OpenAI Cookbook《Build an Agent Improvement Loop with Traces, Evals, and Codex》](https://developers.openai.com/cookbook/examples/agents_sdk/agent_improvement_loop)；[首次提交](https://github.com/openai/openai-cookbook/commit/05fe56240be4a27b1f6b3f424cb2e3c9bcf9980e) | 初始提交已经写出 “the larger idea of loop engineering is the durable part” | 目前本次检索找到的、早于 6 月传播潮且可稳定核验的 AI 官方精确用词；其对象是 Agent 的持续改进飞轮 |
| 2026-06-07 | [Peter Steinberger 原始 X 帖](https://x.com/steipete/status/2063697162748260627) | “You shouldn’t be prompting coding agents anymore. You should be designing loops that prompt your agents.” | 形成“设计循环，而非逐轮提示”的社区口号；帖子本身没有使用名词 “Loop Engineering” |
| 2026-06-07 | [Addy Osmani《Loop Engineering》](https://addyosmani.com/blog/loop-engineering/) | 以该词为标题，给出角色转换、递归目标、外层系统和“五件套+记忆” | 目前找到的最早、最系统、最直接的公开命名与定义之一 |
| 2026-06-16 | [LangChain《The Art of Loop Engineering》](https://www.langchain.com/blog/the-art-of-loop-engineering) | 把 Agent、验证、事件触发、Harness 改进表示为四层堆叠循环 | 将 Loop Engineering 从“跑任务”扩展为“循环之上的循环” |
| 2026-06-30 | [Claude / Anthropic《Loop engineering: Getting started with loops》](https://claude.com/blog/getting-started-with-loops) | Claude Code 团队按触发方式与停止方式区分 turn-based、goal-based、time-based、proactive loops | 给出厂商可操作定义和成本边界 |
| 2026-07-15 | [Addy Osmani《Own the Outer Loop》](https://addyosmani.com/blog/own-the-outer-loop/) | Loop 被进一步定义为 investigation → implementation → verification → repeat；独立证据决定是否完成，人拥有外层 Verdict 与 Answerability | 把问责、证据和人工边界纳入概念 |
| 2026-07-17 | [IBM《What is loop engineering?》](https://www.ibm.com/think/topics/loop-engineering) | IBM 定义其为设计迭代引导 Agent 完成用户目标、尽量减少人工干预的 Agentic Workflow 实践 | 表明术语开始被大型厂商作为新兴 Agent Engineering 实践采用 |

### 不应声称“某人绝对首创”

本次检索能证明：OpenAI Cookbook 在 2026-05-11 已精确使用 “loop engineering”；Peter Steinberger 和 Addy Osmani 在 2026-06-07 推动了“设计循环而不是逐轮提示”的社区表达；Addy 同日提供了最完整、最有传播力的系统定义之一。**这些证据不足以证明某个个人是所有 AI 语境下的绝对首创者。**

Addy 文中转引 Claude Code 负责人 Boris Cherny：

> “I don’t prompt Claude anymore. I have loops running that prompt Claude and figuring out what to do. My job is to write loops.”

但 Addy 链接的是 Rohan Paul 的转述帖，该帖子现已无法通过 X 官方嵌入接口访问；本次未找到 Boris 的原始发言页面。因此应标注为“经 Addy 转引，未独立核实”，不能作为起源结论的唯一证据。

### 同名异义：这个词并非 AI 首次使用

2025 年分子生物学论文 [《Loop engineering improves prime editing efficiency》](https://pubmed.ncbi.nlm.nih.gov/41341749/)（[DOI](https://doi.org/10.1016/j.omtn.2025.102764)）使用了完全相同的词组。该文的 “loop engineering” 是改造 prime-editing guide RNA 的 loop 2 / tetraloop / stem-loop，把额外 PBS-RTT 序列插入 loop 2，从而把部分靶点的 prime editing 效率提高 40%–147%。它与 AI Agent 无关。

因此可视化标题或 SEO 描述应写成 **“AI Agent 语境中的 Loop Engineering”**，避免把裸词宣称为 2026 年才诞生的唯一概念。

## 一个更精确的工作定义

综合 Addy、Claude、IBM、LangChain、Anthropic 和 OpenAI 的一手材料，可采用下面这个工作定义：

> **Loop Engineering 是设计、运行和持续改进有边界的 Agent 闭环：系统以目标和触发器启动，让 Agent 在 Harness 中获取上下文、调用工具并改变环境，以独立证据观察结果，把失败反馈到下一轮，并在成功、受阻、人工升级或预算耗尽时停止；跨轮状态保存在模型上下文之外，重要后果由人类批准和负责。**

这不是任何来源逐字给出的“标准”，而是对多份一手资料的综合。它包含六个不可缺的语义：

1. **目标**：不是“继续工作”，而是明确的结果。
2. **反馈**：环境输出、测试、评审或用户信号必须改变下一步。
3. **验证**：完成由证据判断，不由执行者自报。
4. **停止**：成功、最大轮次、预算、阻塞或升级条件都可以结束一次运行。
5. **持久性**：状态和经验不能只存在单次上下文窗口内。
6. **治理**：权限、副作用、可逆性和最终责任需要外部边界。

## 最适合解释该概念的“五层循环”

“Loop Engineering”在不同文章中指向的对象略有不同。把它画成五层嵌套，比画成单一圆环更准确。

### 第 1 层：Agent 内循环——执行

最内层是模型与工具的基本循环：

`理解当前状态 → 选择/调用工具 → 读取环境反馈 → 更新判断 → 再行动`

Anthropic 早在 2024 年就把 Agent 概括为“基于环境反馈循环使用工具的 LLM”，并强调每一步都应从工具调用或代码执行中获得 ground truth。[Anthropic, 2024-12-19](https://www.anthropic.com/research/building-effective-agents)

LangChain 2026 年的说法更简洁：“At its core, an agent is just a model calling tools in a loop until a task is complete.” [LangChain, 2026-06-16](https://www.langchain.com/blog/the-art-of-loop-engineering)

这一层解释了 **Agentic Coding 是什么**：模型读代码、编辑文件、运行命令、读取错误，再决定下一步。它本身已经是循环，但还没有回答谁触发、怎样复原、何时升级、怎样持续运行。

### 第 2 层：验证循环——收敛

在 Agent 输出外增加独立 Grader / Checker：

`Agent 尝试 → 依据 Rubric/测试评分 → 不通过则返回具体反馈 → Agent 重试`

Anthropic 的 evaluator-optimizer 模式是一方生成、另一方在循环中评估和反馈；它适用于“评价标准清晰，迭代改进价值可测”的任务。[Anthropic, 2024-12-19](https://www.anthropic.com/research/building-effective-agents)

Claude Code 的 goal-based loop 也采用这一结构：执行 Agent 每次准备停止时，由 evaluator 模型检查条件，直到达标或达到用户设置的最大轮数；确定性的测试数、分数阈值等尤其适合作为退出条件。[Claude / Anthropic, 2026-06-30](https://claude.com/blog/getting-started-with-loops)

关键点：**反馈必须携带可行动的信息。** “失败了”不够；应告诉下一轮哪个测试失败、哪条 Rubric 不满足、观察到什么偏差。

### 第 3 层：任务/运行循环——自动推进

Addy 主要在这一层定义 Loop Engineering：系统不等人手工发送下一条 Prompt，而是自己发现工作、分派、检查、记录并决定下一件事。[Addy Osmani, 2026-06-07](https://addyosmani.com/blog/loop-engineering/)

Claude 团队按触发与停止方式把运行分为四类：

| 类型 | 触发 | 停止 | 适用 |
| --- | --- | --- | --- |
| Turn-based | 用户 Prompt | Agent 认为完成或需要更多上下文 | 一次性、较短、探索性任务 |
| Goal-based | 人实时下达目标 | 达到可验证目标或最大轮数 | 测试、性能阈值、迁移等可定义 Done 的任务 |
| Time-based | 时间间隔 | 用户取消或外部任务完成 | PR 跟进、CI 修复、周期报告 |
| Proactive | 事件或计划，无人实时值守 | 每项任务达标退出；Routine 持续到关闭 | Bug 流、Issue 分诊、依赖升级等稳定队列 |

这里“循环”的对象不再只是一次模型调用，而是一个可以跨会话、跨工作区和跨外部系统的运行过程。

### 第 4 层：改进循环——让 Harness 学习

OpenAI Cookbook 的用法更偏“Agent Improvement Loop”：

`运行 Traces → 人类/模型反馈 → 生成可复用 Evals → 诊断 Harness 缺口 → Codex 实施修改 → 用同一 Evals 回归验证 → 新运行`

其结论是：Traces 捕获行为，人工反馈加入判断，Evals 固化期望，优化器把证据转成 Harness 改动，Codex 实施下一版；“反馈、测试和实现被连接进一个循环”才是可持续的 Loop Engineering。[OpenAI Cookbook, 2026-05-11](https://developers.openai.com/cookbook/examples/agents_sdk/agent_improvement_loop)

LangChain 把这层称为 hill-climbing loop：生产 Traces 由分析 Agent 总结，再去修改 Prompt、工具、Grader、记忆甚至模型训练；外层回箭头不是只触发下一次任务，而是伸进内部改变系统本身。[LangChain, 2026-06-16](https://www.langchain.com/blog/the-art-of-loop-engineering)

### 第 5 层：人类外循环——问责

Addy 在《Own the Outer Loop》中把 Agent 定义为“模型 + 文件、工具、记忆、技能、沙箱、权限、可观测性和恢复组成的 Harness”，并把 Loop 定义为：

`investigation → implementation → verification → repeat`

独立检查而不是模型自报决定何时完成；证据跨出系统边界后，人类作出 ship、block、redirect、加 Guardrail 或 reject 的 Verdict，并对原因保持 Answerability。[Addy Osmani, 2026-07-15](https://addyosmani.com/blog/own-the-outer-loop/)

LangChain 同样强调：自动化不等于移除人。链接是否有效可以自动判定，但表达是否适合受众仍需人的经验和品味；金融交易、数据库操作等敏感行为需要实时人工审批。[LangChain, 2026-06-16](https://www.langchain.com/blog/the-art-of-loop-engineering)

### 五层关系的一句话版本

- **内循环**让 Agent 做事。
- **验证循环**让结果收敛。
- **运行循环**让工作自动到来并持续推进。
- **改进循环**让 Harness 从运行证据中变好。
- **人类外循环**决定哪些结果可以进入真实世界，并承担后果。

## 与相邻概念的边界

| 概念 | 优化对象 | 典型时间尺度 | 与 Loop Engineering 的关系 |
| --- | --- | --- | --- |
| Prompt Engineering | 一条指令怎样措辞 | 一次调用/一轮 | Loop 内的控制输入；差 Prompt 会被循环放大，不会因有 Loop 而消失 |
| Context Engineering | 每次推理时模型看见哪些高信号 Token | 每一轮推理前 | Loop 内的信息策划层；负责写入、选择、压缩、隔离和按需检索上下文 |
| Harness Engineering | 单个 Agent 周围的执行脚手架：工具、权限、Hooks、沙箱、上下文策略、反馈、恢复 | 一次 Agent 运行到跨会话运行 | Loop 使用 Harness 作为执行载体；Addy 称 Loop “sits one floor above the harness” |
| Agentic Coding | Agent 使用工具自主修改和验证代码的工作方式 | 一项编码任务 | 常见应用场景，也是最内层 Agent Loop；不自动等于完整的触发、状态和治理系统 |
| Evaluation / Verification Loop | 输出是否满足 Rubric，失败反馈什么 | 一次尝试到若干重试 | Loop Engineering 的关键子层，但不覆盖触发、权限、外部状态和长期改进 |
| Feedback Loop | 输出/观察反过来影响下一次输入/调整的通用因果结构 | 任意 | Loop 的必要结构，但仅有回箭头还不构成可靠的 Agent 运行系统 |
| Long-running Agent | 跨上下文窗口、沙箱、小时或天持续前进的 Agent | 多会话、长时段 | Loop Engineering 的重要需求场景；必须解决持久状态、交接、恢复和验证 |
| Software Factory | 大量 Loop 并行、批量生产软件 | 多任务、多 Agent、组织级 | “Loops at scale”；它放大吞吐，也放大评审、治理和理解瓶颈 |

Anthropic 对 Context Engineering 的直接定义是：从不断演化的候选信息中，策划进入有限上下文窗口的内容；它优化的是 Token 的效用，而不是整套运行生命周期。[Anthropic, 2025-09-29](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)

Addy 对 Harness 的直接定义是：模型之外的代码、配置与执行逻辑；包括提示、工具、上下文策略、Hooks、沙箱、子代理、反馈循环和恢复路径。[Addy Osmani, 2026-04-19](https://addyosmani.com/blog/agent-harness-engineering/)

## 一个可靠 Loop 的核心组成

下列结构比记忆某个平台的命令更具普适性。

### 1. 运行合同

Addy 的 Agentic Autonomy Levels 建议每次运行前明确：[Addy Osmani, 2026-07-02](https://addyosmani.com/blog/agentic-autonomy-levels/)

- **Goal**：要实现的结果，不是活动或技术手段。
- **Scope**：允许操作的领域和技术。
- **Non-goals**：明确不做什么。
- **Tools and permissions**：可以怎样接触真实世界。
- **Stopping condition**：最好是可测变量；也应有最大尝试次数。
- **Evidence**：测试、截图、日志、数据库记录等独立于 Agent 自述的证明。
- **Escalation**：什么情况下由谁介入。
- **Budget**：时间、Token、尝试次数和并行度上限。

这是可视化中最值得让用户亲手配置的一组参数。

### 2. 执行内核

IBM 把基本 Agent Loop 提炼为：[IBM, 2026-07-17](https://www.ibm.com/think/topics/loop-engineering)

1. **Goal**：本轮持续对照的递归目标和退出条件。
2. **Action**：写代码、运行测试、调用 API、修改 Ticket 等。
3. **Observation**：读取 CI、编译器、浏览器、日志或真实用户结果。
4. **Adjustment**：根据观察修正计划，然后开始下一轮。

注意：这个四步模型适合解释“为什么是闭环”，但工程实现仍需下面的状态、隔离和治理设施。

### 3. 运行基础设施

Addy 的文章把常见实现归为“五件套 + 记忆”：[Addy Osmani, 2026-06-07](https://addyosmani.com/blog/loop-engineering/)

- **Automations / triggers**：时间、Webhook、Issue、CI 或人工目标启动运行。
- **Worktrees / sandboxes**：隔离并行修改和不可信执行。
- **Skills**：把项目规范、验证步骤和事故经验固化为可复用流程。
- **Plugins / connectors**：连接代码仓库、Issue Tracker、数据库、Slack、浏览器和 CI。
- **Sub-agents**：探索、实现、审查等角色拆分，尤其是 Maker / Checker 分离。
- **Durable memory / spine**：在 Markdown、JSON、Git、数据库或任务系统中保存 Done、Next、Tried、Blocked 和证据。

这组清单是平台实践总结，不是所有 Loop 必须逐字满足的正式标准。例如单仓库的小型测试修复 Loop 不一定需要多个 Sub-agent；确定性任务甚至应直接使用脚本，而不是额外套一层 Agent。

OpenAI 的定时任务文档也强调：定时任务可以在本地项目或隔离 Worktree 中运行，可组合 Skills 和 Plugins；无人值守运行应采用满足任务所需的最窄权限，先手动测试 Prompt，并审查最初几次输出。[OpenAI Codex Scheduled Tasks](https://developers.openai.com/codex/app/automations)

### 4. 验证与终止控制器

验证器应回答四个问题：

1. 哪些证据算通过？
2. 哪些失败能自动重试？
3. 哪些失败必须升级给人？
4. 到了多少轮、多少成本或多长时间必须停？

一个可接受的终止集合是：

`PASS | BLOCKED | ESCALATE | BUDGET_EXHAUSTED | CANCELLED`

只设计 `PASS`、没有失败出口，会把“未完成”错误地变成“继续烧 Token”。

### 5. 可观测性和改进

至少记录：输入合同、关键决策、工具调用、环境观察、每轮 Diff、验证结果、成本、停止原因和人工 Verdict。只有留下 Trace，失败才能转成新 Eval、Skill、Hook、测试或权限规则，而不是下一次重新踩坑。

## 典型工作流

下面是一条适合可视化的、平台无关的主线：

1. **Trigger**：新 Issue、CI 失败、定时器或用户目标到达。
2. **Contract**：读取 Goal、Scope、Non-goals、权限、预算、证据和退出条件。
3. **Recover state**：读取上次进度、已尝试方案、开放阻塞和当前代码状态。
4. **Investigate / Context**：收集相关代码、日志、文档和约束，不把所有信息一次塞进上下文。
5. **Plan and act**：在隔离环境中做一个小而可逆的改动。
6. **Observe ground truth**：运行测试、编译、浏览器 E2E、静态分析或读取外部系统结果。
7. **Independent verification**：Checker 按原始合同和 Rubric 检查，而不是复述 Maker 的解释。
8. **Branch**：
   - 通过：生成证据包，进入人工或策略 Verdict；
   - 可修复失败：把失败变成下一轮上下文；
   - 阻塞/高风险：升级给人；
   - 超预算：停止并报告当前状态。
9. **Persist**：写入进度、Trace、证据、停止原因和下一步，保证新会话可以接续。
10. **Improve the loop**：重复失败被固化为测试、Skill、Hook、Grader 或 Harness 修改。

### Addy 给出的完整运营实例

每日 Automation 读取昨天的 CI 失败、开放 Issue 和最近提交，通过 Triage Skill 写入状态文件；每个值得处理的问题进入独立 Worktree，由 Maker Sub-agent 起草修复，Checker Sub-agent 对照项目 Skills 和测试审查；Connector 打开 PR、更新 Ticket；无法处理的内容进入 Inbox；第二天依据持久状态继续。这个例子完整覆盖触发、隔离、知识、连接、验证和记忆。[Addy Osmani, 2026-06-07](https://addyosmani.com/blog/loop-engineering/)

### Anthropic 的跨上下文窗口实例

Anthropic 的长任务 Harness 使用一次性的 Initializer Agent 建立环境和全面 Feature List，再反复启动 Coding Agent，每次只做一个 Feature，提交 Git、写 Progress File，并通过浏览器等工具做人类视角的端到端验证。其设计针对三类常见失败：一次做太多导致上下文耗尽、下一会话不知道之前发生了什么、Agent 没有正确测试却标记完成。[Anthropic, 2025-11-26](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)

## 风险、边界与故障模式

| 风险 | 表现 | 根因 | 设计对策 |
| --- | --- | --- | --- |
| 无界循环 / Token 失控 | 反复尝试但不收敛 | 目标含糊、反馈无信息、无轮次和预算上限 | 可测 Done、最大轮数、时间/Token/并行度预算；先小规模 Pilot |
| 错误过早停止 | Agent 自信报告完成，功能实际不可用 | 执行者给自己打分；只做单元测试或静态检查 | 独立 Checker、真实环境 Ground Truth、E2E、明确失败出口 |
| 测试过拟合 | 全部已知测试通过，用户目标仍未满足 | Rubric 窄、Agent 修改测试或绕过指标 | 冻结关键验收条件、加入用户场景、人工品味判断、对抗性测试 |
| 上下文失忆/漂移 | 重复旧尝试、推翻已有修复、基于过期假设行动 | 状态只在会话里；缺少交接和刷新 | 外部 Progress/Feature List/Git/Trace；每轮重读当前事实 |
| 权限与外部副作用 | 自动推送、合并、发消息、改数据库或泄露信息 | Connector 权限过宽、审批疲劳 | 最小权限、沙箱、Allowlist、敏感工具前人工审批、可回滚 |
| 并行冲突 | 多 Agent 改同一文件、结论相互覆盖 | 隔离和任务分解不足 | Worktree/沙箱、明确所有权、限制并行写操作；集中合并审查 |
| 评审瓶颈 | Agent 吞吐上涨，但 PR 和证据堆积 | 人的 Review Bandwidth 没有同步扩张 | 控制并行度、风险分级、生成可审计证据包，不以 Agent 数量作为目标 |
| 理解债 | 团队拥有大量“能跑但没人理解”的代码 | 生成速度超过阅读和维护速度 | 小变更、解释意图、人工抽查关键路径、保留设计与因果记录 |
| 意图债 | 技术上正确但违背产品或架构目标 | 项目意图未被编码，Agent 自行补全空白 | Goals/Non-goals、AGENTS/Skills、ADR、示例和禁止事项 |
| 认知投降 | 人无条件接受摘要和 Checker 的结论 | 把自动化误当成责任转移 | 人类保留 Verdict；查看 Diff、测试、日志、截图和已知缺口 |
| 自我改进回归 | 自动修改 Prompt/工具/Grader 后整体变差 | 只优化近期 Trace，缺少稳定回归集 | 人审 Harness 修改；固定 Evals；Canary/回滚；比较成本和缺陷逃逸率 |

来源一致强调以下边界：

- Anthropic 建议从最简单方案开始；Agent 系统用更高延迟和成本换取任务表现，并可能产生累积错误，应在沙箱中充分测试并设置停止条件。[Anthropic, 2024-12-19](https://www.anthropic.com/research/building-effective-agents)
- Claude 团队建议清晰成功条件和 Turn Cap、先 Pilot、确定性工作用脚本、Routine 不要运行得比信号变化更频繁，并持续查看 Token 使用。[Claude / Anthropic, 2026-06-30](https://claude.com/blog/getting-started-with-loops)
- LangChain 认为验证循环会增加延迟和成本；敏感 Tool Call、金融交易和数据库操作必须保留人工检查。[LangChain, 2026-06-16](https://www.langchain.com/blog/the-art-of-loop-engineering)
- IBM 明确指出：“A checker agent is still just an agent, and human developers are ultimately responsible for all shipped code.” 并把 Unverified Code、Comprehension Debt、Intent Debt、Cognitive Surrender 列为核心风险。[IBM, 2026-07-17](https://www.ibm.com/think/topics/loop-engineering)

## 可视化叙事建议

### 核心叙事：从“我在循环里”到“我设计循环”

第一幕展示人不断输入 Prompt：

`人 → Agent → 结果 → 人检查 → 人再输入`

随后把人的重复动作外化成系统：

`Trigger → Agent/Harness → Evidence → Checker → Retry/Stop → State`

人从每一箭头的搬运工，移到最外层设置合同、批准高风险结果和修改循环规则。这一转换直接对应 Peter Steinberger 与 Addy 的核心表达。

### 主图：不要只画一个圆，画嵌套的五层

建议中心向外依次为：

1. **Agent Loop**：Model ↔ Tools/Environment
2. **Verification Loop**：Attempt ↔ Evidence/Grader
3. **Operations Loop**：Trigger → Dispatch → Run → Persist → Next
4. **Improvement Loop**：Traces → Feedback → Evals → Harness change
5. **Human Outer Loop**：Goal、Permissions、Budget、Verdict、Accountability

这样能同时容纳 Addy 的运行系统、Claude 的触发/停止分类、LangChain 的堆叠 Loop 和 OpenAI 的改进飞轮。

### 交互实验：让用户“造一个 Loop”

可让用户调节：

- Goal 是否可测
- Checker：无 / 同一 Agent / 独立 Agent / 确定性测试 + 人
- 最大轮数与 Token 预算
- 状态：仅上下文 / 外部 Progress File
- 权限：只读 / 写工作区 / 外部系统 / 自动合并
- 触发：手动 / 定时 / 事件
- 隔离：共享目录 / Worktree

画面实时给出四个结果指标：**成功率、平均成本、失控风险、人工负担**。它能直观说明“更自治”并不自动等于“更可靠”。

### 故障演示：拿掉一个部件会怎样

- 拿掉 **Stop/Budget**：圆环加速、Token 计数失控。
- 拿掉 **Evidence**：Agent 每轮都说“完成”，但产品状态不变。
- 拿掉 **Memory**：每次回到起点，重复同一个错误。
- 拿掉 **Isolation**：两个 Worker 的修改互相覆盖。
- 拿掉 **Human Verdict**：高风险结果直接越过边界进入生产。
- 拿掉 **Harness Improvement**：同类失败每天重演，没有沉淀为测试或 Skill。

### 适合显示但应加注释的“演进阶梯”

可以画：

`Prompt → Context → Harness → Loop → Factory`

但必须注明这不是严格的历史替代关系，而是嵌套的设计尺度：Loop 仍由 Prompt 构成，仍需 Context，并运行在 Harness 中；Factory 只是大量 Loop 的规模化组织。

### 推荐的一句话收尾

> **Loop Engineering 不是让 AI 一直做，而是设计它怎样知道下一步、怎样证明做对、怎样在该停时停下，并把每次失败变成下一次的系统改进。**

## 内容创作时应避免的断言

1. 不要写“Loop Engineering 由 Addy Osmani 首创”。更稳妥的是“Addy 在 2026-06-07 提供了目前可核验的早期系统定义之一，并推动概念传播”。
2. 不要写“Boris Cherny 在某次演讲中首先提出”，除非以后找到原视频、文字稿或本人帖子。现有可访问证据是 Addy 的转引。
3. 不要把 Addy 的 Automations、Worktrees、Skills、Connectors、Sub-agents、Memory 称为全球统一的“六大标准”。这是有代表性的实现框架。
4. 不要写“Prompt Engineering 已死”。Loop 会自动生成或选择 Prompt，但 Prompt 质量仍会影响每一轮。
5. 不要把循环画成只能“成功后退出”。Blocked、Escalate、Budget Exhausted、Cancelled 同样是正确终态。
6. 不要暗示 Checker 能证明绝对正确。Checker 可能与 Maker 共享盲点，确定性测试也可能验证了错误目标。
7. 不要把 Agent 数量、循环频率或无人值守时间当成成熟度本身。成熟度取决于证据质量、可逆性、发现错误的速度和责任边界。
8. 不要把分子生物学论文的同名术语与 AI Agent 概念混为一谈。

## 主要来源清单

### 直接定义与术语传播

1. Addy Osmani. [Loop Engineering](https://addyosmani.com/blog/loop-engineering/). 2026-06-07。
   用途：角色转换定义、递归目标、Loop 位于 Harness 之上、五件套加记忆、风险与完整运行实例。
2. Peter Steinberger. [X status 2063697162748260627](https://x.com/steipete/status/2063697162748260627). 2026-06-07。
   用途：“designing loops that prompt your agents”的原始社区表达；作者和正文已通过 X 官方 oEmbed 核验。
3. Delba de Oliveira, Michael Segner / Claude by Anthropic. [Loop engineering: Getting started with loops](https://claude.com/blog/getting-started-with-loops). 2026-06-30。
   用途：Claude Code 团队定义、四类 Loop、Goal Evaluator、代码质量与 Token 管理。
4. Ivan Belcic, Cole Stryker / IBM. [What is loop engineering?](https://www.ibm.com/think/topics/loop-engineering). 2026-07-17。
   用途：厂商正式定义、Goal–Action–Observation–Adjustment、组件和人类责任。
5. Sydney Runkle / LangChain. [The Art of Loop Engineering](https://www.langchain.com/blog/the-art-of-loop-engineering). 2026-06-16。
   用途：Agent / Verification / Event-driven / Hill-climbing 四层 Loop，以及 Human-in-the-loop 边界。

### 基础工程模式

6. Anthropic. [Building effective agents](https://www.anthropic.com/research/building-effective-agents). 2024-12-19。
   用途：Workflow 与 Agent 区分、环境 Ground Truth、停止条件、Evaluator-optimizer、成本与累积错误。
7. Anthropic. [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents). 2025-09-29。
   用途：Context Engineering 定义、有限注意力、Just-in-time Context。
8. Anthropic. [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents). 2025-11-26。
   用途：跨上下文窗口持久状态、Initializer/Coding Agent、Feature List、Progress File、Git 与端到端测试。
9. Addy Osmani. [Agent Harness Engineering](https://addyosmani.com/blog/agent-harness-engineering/). 2026-04-19。
   用途：Agent = Model + Harness，以及 Harness 的具体范围。
10. Addy Osmani. [Agentic Autonomy Levels](https://addyosmani.com/blog/agentic-autonomy-levels/). 2026-07-02。
    用途：运行合同、风险与可逆性、证据、升级和预算字段。
11. Addy Osmani. [Own the Outer Loop](https://addyosmani.com/blog/own-the-outer-loop/). 2026-07-15。
    用途：Investigation–Implementation–Verification–Repeat、独立检查、Verdict、Answerability 和人类外循环。

### 官方实现与改进飞轮

12. OpenAI Cookbook. [Build an Agent Improvement Loop with Traces, Evals, and Codex](https://developers.openai.com/cookbook/examples/agents_sdk/agent_improvement_loop). 首次仓库提交 2026-05-11，作者提交信息署名 Wesley Pasfield；[commit 05fe562](https://github.com/openai/openai-cookbook/commit/05fe56240be4a27b1f6b3f424cb2e3c9bcf9980e)。
    用途：AI 官方精确使用 “loop engineering” 的较早可核验证据；Traces → Feedback → Evals → Harness Changes → Codex 的持续改进飞轮。
13. OpenAI Codex. [Scheduled tasks](https://developers.openai.com/codex/app/automations). 访问于 2026-07-23。
    用途：定时触发、Worktree、Skills/Plugins、无人值守权限和测试建议。
14. OpenAI Codex. [Subagents](https://developers.openai.com/codex/subagents). 访问于 2026-07-23。
    用途：并行专业化 Agent、上下文隔离、Token 成本和写操作协调风险。
15. OpenAI Codex. [Build skills](https://developers.openai.com/codex/skills). 访问于 2026-07-23。
    用途：把可复用工作流、说明、资源和脚本固化为 Skill。

### 同名异义

16. Bailun Li et al. [Loop engineering improves prime editing efficiency](https://pubmed.ncbi.nlm.nih.gov/41341749/). *Molecular Therapy: Nucleic Acids*, 2025；DOI [10.1016/j.omtn.2025.102764](https://doi.org/10.1016/j.omtn.2025.102764)。
    用途：证明相同词组在 AI 语境之前已用于分子生物学，含义完全不同。

## 研究限制

- 搜索引擎对 2026 年 6–7 月的新内容索引不完整，且 “Loop” 会被 Microsoft Loop、编程循环和控制系统大量污染。
- X 帖可能删除、限制索引或只有视频片段；本笔记只把能通过作者页面、官方 oEmbed 或稳定文章核验的内容当作直接证据。
- Peter 的帖子写有 “monthly reminder”，暗示此前可能有类似表达；本次没有核尽所有更早社交媒体用例。
- OpenAI 2026-05-11 的用法侧重“Agent 改进飞轮”，Addy 2026-06-07 的用法侧重“自动运行任务的外层系统”。两者共享闭环、证据和 Harness 改进思想，但不应被假定为完全相同的定义。
- IBM、Claude 和 LangChain 的文章均发布在概念快速成形期，术语边界仍可能变化；当前最稳妥的做法是把它称为“新兴实践标签”，而不是已有正式规范、认证或学术共识的工程学科。
