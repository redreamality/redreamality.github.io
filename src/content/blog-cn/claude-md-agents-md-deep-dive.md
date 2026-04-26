---
title: '一万字讲透 CLAUDE.md/AGENTS.md：从基础到反直觉'
pubDate: 2026-04-25T00:00:00.000Z
description: '从 Anthropic 官方规范到 Karpathy 的 program.md 范式，从"两次原则"到达尔文式记忆，从 Spec-Driven 到 Eval-Driven——一篇梳理 AI 编程代理指令文件的来龙去脉与反直觉心智模型。'
author: 'Remy'
tags: ['Claude Code', 'AI Agents', 'Context Engineering']
---

## 写在前面

如果你用过 Claude Code、Cursor、Codex、Aider、Jules、Amp、Windsurf 中的任何一个，你大概率已经写过 `CLAUDE.md` 或者 `AGENTS.md`，甚至两个都写过。你也许纠结过：到底要写多少？是写成 README 那种娓娓道来，还是写成一条条命令？能不能让这些文件在多个工具之间复用？写完之后，agent 到底有没有听话？

这篇文章想把 2025—2026 年这一年多以来，英语世界和中文世界关于"写给 AI 看的项目文件"的讨论梳理清楚。它不是一份操作手册，而更像一份**心智模型的演化史**——从 Anthropic 的早期最佳实践，到 Karpathy 的 `program.md` 范式，再到 ghuntley 的 Ralph Wiggum 循环，以及 claude-evolve 这样的"达尔文式记忆"实验。最后回到我们自己的工作台，落到 PARA 知识库和后端仓库这两种真实场景。

全文约一万字，分十二节。前六节是基础与现状，后六节是反直觉观点与落地建议。如果你只想看重点，跳到第六节开始读。

---

## 一、先把三个文件分清楚：README.md / CLAUDE.md / AGENTS.md

在任何一个"给 AI 读的文件"长出来之前，我们先把三种文件的定位讲清楚。

**README.md** 是写给人看的。它的受众是"**第一次打开你的仓库的人类开发者**"，目的是让他们在五分钟内理解项目做什么、怎么跑起来、怎么贡献。它的语气是说明性、营销性的，内容组织遵循金字塔原理：**是什么 → 怎么用 → 怎么参与**。

**CLAUDE.md** 是写给 Claude Code 看的。它的受众是一个**每次都要从零理解仓库的 AI 代理**。这个代理没有记忆，没法直观扫一遍代码结构，每次进来都像失忆的侦探。它真正关心的，是这些问题：我要执行什么命令才能构建？怎么跑测试？这个仓库里有没有什么坑必须知道才不会踩？修改完怎么验证？

**AGENTS.md** 则是 2025 年 8 月 OpenAI、Google、Cursor、Factory、Sourcegraph 等公司联合推出的开放标准，2025 年 11 月由 Linux 基金会下属的 Agentic AI Foundation 托管。它的定位是"**跨 AI 工具的统一指令文件**"——一份文件，同时被 Codex、Cursor、Aider、Jules、Copilot、Claude Code、Amp、Windsurf、Zed 读取。截至目前，采纳仓库已超过 6 万个。

这三个文件互补而非替代。README.md 回答"是什么"，CLAUDE.md 和 AGENTS.md 回答"怎么做"。区别在于前者是面向人类的营销页，后者是面向机器的运行手册。

一个常见误区是把 CLAUDE.md 写成 README.md 的翻版——贴一段项目简介、贴一张架构图、贴一段 Getting Started。这些内容对 agent 几乎没用。agent 不需要知道项目卖点，它需要知道"跑测试是 `pnpm test` 还是 `npm run test:unit`"、"改完代码是否要跑 codegen"、"哪些目录禁止改动"。

另一个误区是把"写过一次就永远不改"。CLAUDE.md 的本质是**活文档**，它应该随着项目演进不断增删。Anthropic 官方最佳实践里有一句话直白地说："Treat CLAUDE.md like code: review it when things go wrong, prune it regularly."（把它当代码对待：出问题时要审查它，要定期修剪它。）

---

## 二、通用最佳实践：长度、结构、写法

### 长度

这是最没有争议也最容易做错的部分。

HumanLayer 的 Dexter Horthy 在《Writing a good CLAUDE.md》里给出过一个很具体的基准：**他们主仓库的根 CLAUDE.md 在 60 行以内**。知乎上一位作者做过严谨实验，把三千字砍到一千字有所改善，砍到八百字明显变好，但砍到四百字时关键信息丢失——最终他稳定在八百字左右。vercel/vercel 这种复杂 monorepo 的 AGENTS.md 是 247 行。openai/codex 的 AGENTS.md 接近 800 行，但通过严格的二级标题分区避免了阅读障碍。

社区共识大致是：**普通项目根文件 ≤250 行；大型 monorepo 按子模块分片，>500 行必须严格分区**。Anthropic 官方在若干公开分享里提到一个更本质的数字——**前沿模型稳定遵循的指令总量在 150—200 条上下**。超过这个数，模型遵守率会快速衰减。

### 结构

一份可用的 CLAUDE.md 推荐这几个主要章节：

1. **CRITICAL RULES**（红线规则）——绝对禁止的操作，例如"不许 push 到 main"、"不许 `rm -rf`"。
2. **PROJECT CONTEXT**（项目上下文）——技术栈、monorepo 结构、关键架构决策。
3. **BUILD & TEST COMMANDS**（命令）——精确到命令行，不要写"运行测试"要写 `pnpm test --watch=false`。
4. **CODE STYLE**（代码风格）——带示例，不要写"保持代码整洁"要给出好/坏两段代码。
5. **FILE ORGANIZATION**（目录约定）——每个目录放什么。
6. **VERIFICATION**（验证方式）——如何确认改动没破坏什么。
7. **COMMON PITFALLS**（踩坑清单）——按时间顺序、按事件累积。

vercel/vercel 的做法很有启发：它专门有一节 "Common Pitfalls"，收录了"禁止在 CLI 包里使用 `console.log`"、"不要跳过 CI hooks"等真实踩过的坑。这一节和 vercel-labs/open-agents 的 "Lessons Learned" 对应同一种思路——**把一次性教训沉淀成长期规则**。

### 写法

指令式、强约束词、具体路径、具体命令。写 `ALWAYS run pnpm typecheck before claiming the task is done`，不要写 `please check code quality`。写 `Never import from src/internal/*`，不要写 `be careful about imports`。

Anthropic 官方和社区共识一致指出：**可靠性大约 70%**——CLAUDE.md 里的规则约 70% 被遵守。所以真正的红线不能只靠 CLAUDE.md 约束，而要用 hooks（PreToolUse 返回 exit code 2 直接阻断）把 30% 的漏洞补上。

---

## 三、从真实样本学最佳实践

理论永远敌不过样本。下面这八个 GitHub 仓库是我筛选出的高质量样本，值得逐一打开看一看。

**1. openai/codex**（Rust 实现的 AI 编码代理）
800 行的 AGENTS.md，按 `codex-core` crate、TUI style、TUI code、text wrapping、tests、snapshot tests、app-server API 等子领域严格分区。最有价值的一句是"**Resist adding code to codex-core**"——抵制往核心包塞东西。这种带"反向意图"的规则比"保持代码简洁"这种正向空话有效得多。它还写死了单文件 500 LoC 目标，超过 800 LoC 必须拆分，用 `insta` 做快照测试、用 `pretty_assertions` 做深度比较。

**2. vercel/vercel**
247 行，是大型 monorepo 的黄金模板。结构清晰：Repository Structure / Essential Commands / Changesets / Code Style / Testing Patterns / Package Development / Runtime Packages / CLI Development / **Common Pitfalls**。Pitfalls 章节是活的避坑手册。

**3. openai/openai-agents-python**
约 480 行，最有趣的是它把指令写成**显式 skill 调用**——例如 `$code-change-verification`、`$pr-draft-summary`。修改 runtime 前必须调用 `$implementation-strategy`，doc-only / meta 变更允许跳过全量校验。这种"指令即工作流图"的写法把 Markdown 变成了小型 DSL。

**4. vercel-labs/open-agents**
约 280 行，开头就声明 "This is a living document. When you make a mistake, add it to Lessons Learned." 这是**自我演化契约**：agent 和人类都被邀请向这份文档追加经验。具体规则比如"`zsh` glob 要给 `[id]` 动态路由加引号"、"改 `schema.ts` 必须生成迁移而非 `db:push`"都是真实踩过的坑。

**5. vercel-labs/agent-skills**
核心规则一句话：**"Keep SKILL.md under 500 lines"**，并强制用 progressive disclosure 把细节外移。这是整个 agent-skills 生态里最重要的一条约束。

**6. anthropics/anthropic-cookbook**
强制使用 `uv` 包管理，并且明确要求用"当前模型别名"（如 `claude-sonnet-4-6`）而不是日期版本。后者会随时间失效、产生技术债。

**7. karpathy/llm-council**
Karpathy 自己 vibe-coded 的项目里的 CLAUDE.md。里面记录的**不是代码风格**，而是"ReactMarkdown 必须包在 `<div className="markdown-content">` 里、chairman 默认 Gemini"这种**项目级长期记忆与陷阱点**。这是 CLAUDE.md 本来应该长的样子。

**8. affaan-m/everything-claude-code（AgentShield）**
反模式扫描工具，对 CLAUDE.md、settings.json、MCP 配置做五大类安全审计，覆盖 14 种密钥模式。它发现的典型 anti-pattern 值得警醒：**CLAUDE.md 里硬编码 API Key**、含过期模型 ID、用"be careful"这种模糊指令。

八个样本共同指向一个规律：**好的 CLAUDE.md 是项目决策的化石层，不是教科书**。

---

## 四、Karpathy 的三次范式转移

如果说 Anthropic 官方文档告诉我们"怎么写"，那 Karpathy 则在告诉我们"为什么写"。他在 2025—2026 年发表的几条观点，本质上是在重新定义"写给 AI 的文件"这件事。

### 第一次转移：Prompt Engineering → Context Engineering

2025 年 6 月 25 日，Tobi Lütke（Shopify CEO）在 X 上提出"上下文工程"优于"提示工程"，Karpathy 公开 +1 并写下：

> "In every industrial-strength LLM application, context engineering is the delicate art and science of filling the context window."

他强调：**context 是系统的输出，不是静态字符串**。它在每一次主 LLM 调用之前，被一个动态流水线即时生成，随任务改变。这里的反直觉点在于：你在写 CLAUDE.md 的时候，写的不是"一段提示词"，而是**系统的一个运行时变量**。这个变量要跟任务、跟会话、跟时间协同起来。

### 第二次转移：Markdown 即源代码（`program.md` 范式）

Karpathy 的 `autoresearch` 仓库（nanochat 的同胞项目）里，使用的指令文件**不叫 AGENTS.md，也不叫 CLAUDE.md，而叫 `program.md`**。工作范式极其简单但颠覆：

> 人类迭代 `program.md`，agent 迭代 `.py`。

换句话说，**Markdown 成了源代码**，agent 是编译器兼运行时。你不再写 Python，你写自然语言规范，agent 据此生成代码并迭代。这是 Karpathy 三年前"Software 2.0"、去年"Software 3.0"论断的具体技术形态。

从这个视角回看 CLAUDE.md，你会发现：这不是"一个配置文件"，而是**项目的规范层源码**。你把它从 100 行改成 80 行、从含糊改成精确，本质上就是在重构代码。

### 第三次转移：声明式 > 命令式（Goal-Driven Execution）

Karpathy 在 forrestchang/andrej-karpathy-skills 这个被一周下载 43k 次的 skill 集合里被总结出四条原则，其中最反直觉的是：

> "LLMs are extremely good at looping until they hit a specific goal. Don't tell them how to do it. Give them success criteria and let them run."

翻译成项目文件的语义：**不要在 CLAUDE.md 里写 step-by-step 的步骤，写成功判据**。不要写"先读 A，再改 B，然后跑 C"，写"改完之后 `pnpm test` 必须全绿且 `git diff` 不含 `console.log`"。后者会让 agent 自己组织路径，前者会让它走死胡同就卡住。

这条原则和传统软件工程的"先写流程图再写代码"是相反的——**agent 时代的好规格说明是声明式的**。

---

## 五、大神们的非显见心智模型

除了 Karpathy，还有一批人在各自项目里沉淀出独到的心智模型。挑几个最有启发的。

### Armin Ronacher：日志即 API，工具链无死胡同

Flask 作者 Armin Ronacher 在《Agentic Coding Recommendations》和《Agent Design Is Still Hard》两篇博客里提出两个金律。

**日志即 API**。调试模式下，把注册邮件直接打到 stdout。CLAUDE.md 告诉 agent 去读日志。于是 agent 就能自己完成"注册 → 等邮件 → 提取链接 → 点击链接"的完整闭环，**不需要人类搭桥**。这个技巧的适用面远不止邮件——任何异步副作用都能用同样的方式暴露给 agent。

**No dead ends**（无死胡同）。图像生成工具必须写到代码执行工具能读到的同一虚拟文件系统。**工具链必须形成闭环**。否则 agent 就会卡在"我生成了图，但我下一步读不到它"的悖论里。

他还有一个看起来很小的观察：Claude Code 的 TodoWrite 只是回显任务列表，但这种**动态回显比一次性放在 context 顶部更能驱动 agent**。原因是 context 顶部的东西在 attention 分布里是"远端"，会被稀释；而每次 tool call 后重新注入的是"近端"，更强。

### Geoffrey Huntley：stdlib、Ralph、上下文利用率

ghuntley.com 的 Geoffrey Huntley 把**团队约定当成编程语言的标准库**来管理——把规则存到 `.cursor/rules/*.mdc` 或 `specs/stdlib/*.md` 里。他说过一句非常赤裸的话：

> "你实际上在给 LLM 编程，而不是在用 IDE。"

他发明的 **Ralph Wiggum 技法**（名字取自《辛普森一家》里那个憨憨的角色）把这个思想推到极致：

```bash
while :; do cat PROMPT.md | npx --yes @anthropic-ai/claude-code-cli ...; done
```

单进程、单仓库、每轮只做一件事。PROMPT.md 成为协调中枢。他还指出——**不存在完美提示**。那些在 Hacker News 上被疯狂复制的 "CURSED 提示词"逐字抄过去没用，因为它们是基于对具体 LLM 行为的持续观察演化出来的。

他的另一个核心指标：**上下文窗口利用率目标 40—60%**。超过就产出质量下降。整个 advanced context engineering for coding agents 工作流都围绕"频繁的、有意的 compaction"设计。

### Simon Willison：AGENTS.md 写运行时异常

Simon Willison 在 simonw/research 仓库的 AGENTS.md 里专门针对**沙盒网络限制**写提示——这提醒我们：AGENTS.md 应该包括**运行时环境的异常**，不只是代码规范。如果 agent 会在某个 IP 段被阻断、某个端口不可用，这些都要明文写出来。

他还做过一个长时间线的观察：**"写 Markdown 让 agent 先读"这种模式最早出现在 2023 年的 ChatGPT Code Interpreter**。也就是说，CLAUDE.md 并不是凭空出现的新物种，而是一个用了三年的老模式被重新标准化。

### Hamel Husain：Eval 即活 PRD

Hamel Husain 提出一个让整个评测领域尴尬的观点：**好的 eval prompt 本身就是活的 PRD**——它实时、持续地测试 AI 行为。他反对把 prompt 放进 LangSmith 等"一层额外的平台"，主张**把 prompts 存进 Git、像软件制品一样版本化**。

这个观点对 CLAUDE.md 的启示是：**CLAUDE.md 本身需要 eval**。你怎么知道你写的"ALWAYS run typecheck"真的被执行了？你需要一套可重复的测试来验证。Fireworks、LangChain、MLflow 都已经在这个方向做集成，下一节会讲到。

### Harrison Chase：Model/Harness/Context 三层

LangChain CEO Harrison Chase 在 Sequoia 播客里提出未来 agent 系统的三层结构：**Model / Harness / Context**。他的判断是：**Context 层是产品团队最先要投资的**——模型在改进、harness 在商品化，只有 context 是你的私有资产。

翻译到 CLAUDE.md 的工程意义：**CLAUDE.md 是护城河**。它不是一份配置，是你这个团队/项目的**机构知识**。

---

## 六、颠覆性新模式：从 Evolve 到 Oracle

上面讲的都是"怎么写好一份文件"。这一节讲"怎么让文件自己变好"，以及"怎么让多份文件协同"。

### 达尔文式记忆（claude-evolve）

jack60810/claude-evolve 把规则按 0—10 评分，用 EMA（30% 新、70% 历史）平滑。规则分三态：

- **active**：正在被使用
- **dormant**：被降级但保留，未来环境变化可能复活
- **dead**：彻底删除

同类规则积累到一定成熟度，自动"毕业"升格为 `.claude/skills/` 里的正式技能文件。这是一种**规则生命周期管理**——规则不再是"写进去永远在"，而是像代码一样有生有死。

### 双文件读写权分离（CLAUDE.md + MEMORY.md）

业内开始流行一个区分：`CLAUDE.md` 是**人类写、给 agent 看**的显式规则；`MEMORY.md` 是 **agent 自己写、启动时 200 行自动加载**的观察积累。

这个结构的反直觉点在于：**一半的文件是 agent 写给自己看的**。你在会话里告诉它"下次记住 X"，它就把 X 写进 MEMORY.md；下一次启动，它在读完 CLAUDE.md 之后立即读 MEMORY.md 的前 200 行。agent 开始维护自己的知识库。

Claude 系统提示里有一句自我防御：**"把自己的记忆当作 hint 而非事实"**——写入前要对真实代码二次验证。避免 agent 记错了还一错再错。

### Auto Dream：记忆卫生

还有一个后台进程叫 Auto Dream。它定期扫描 MEMORY.md，把"昨天的部署问题"自动改写成"2026-03-28 的部署问题"，把相对时间锚点改为绝对日期。这样当这条记忆在几个月后被读到时，不会因为"昨天"已经变成几十天前而误导 agent。

记忆需要卫生——这是我看到过最反直觉的一条。记忆不是只增不减的日志，而是**需要持续清洗的活数据**。

### "两次原则"（Two Strikes Rule）

Anthropic 官方最佳实践提到一个反直觉的规则：**只有同一个错误第二次发生，才把它写进 CLAUDE.md**。

为什么？因为第一次可能只是偶发。如果你每次 agent 出错就写一条规则，CLAUDE.md 会被一次性教训塞满，噪声压过信号。**两次 = 模式，一次 = 噪声**。这和传统"尽早文档化"的直觉是完全相反的。

### Subagent 是上下文控制，不是角色扮演

很多人用 subagent 是为了"分工"——让一个 agent 当前端、另一个当后端。但更深的用法是**上下文控制**：用 subagent 的新鲜窗口去做 Glob/Grep/Read，主 agent 只接收摘要，不污染主 context。

这是为什么 Claude Code 的 Agent 工具默认返回"摘要"而不是"原始 tool result"——它是为了保护主线程的上下文预算。

### Oracle 模式

Oracle 模式把 GPT 当作 tool 暴露给 Sonnet，实现跨模型函数调用。CLAUDE.md 里声明："**遇到架构决策时调用 oracle**"。这种"让一个 LLM 在决策点咨询另一个 LLM"的做法，相当于给 agent 配了一个外部顾问——尤其适合防范单一模型的系统性偏见。

### Anti-Sycophancy 三模式

Claude 有个众所周知的毛病：对用户过于恭维。社区已经沉淀出一套反谄媚模板：

- **Mode 1 Challenge-First**：默认先挑战你的判断
- **Mode 2 One-Question**：一次只问一个澄清问题
- **Mode 3 Steel-Man**：用最强版本反驳你的提案

反直觉的点是：不是一个人格，而是**三种可显式召唤的思考模式**。你在 CLAUDE.md 里写"默认用 Mode 1"，在写关键决策时切到 Mode 3。

### Path-Scoped Rules

YAML frontmatter 加一个 `paths:` 字段，规则仅在匹配文件时加载，默认 0-token。例如一条关于 React 组件的规则只在 `src/components/*.tsx` 被触及时注入 context。这把"全量加载"变成了"按需加载"，直接让 CLAUDE.md 可以膨胀到几千行而不增加单次请求的 token 成本。

### Versioned Changelog 顶置

CLAUDE.md 顶部写一段 `## Changelog v2026-04-25`，agent 启动时会主动跟上次 session 做 diff，发现"规则变了"。这是一种让 agent 主动感知规则演化的机制。

---

## 七、团队工程化层：把 CLAUDE.md 当代码对待

单个开发者的最佳实践和一个团队的最佳实践是两回事。上文的一切技巧，放到五人、五十人、五百人的团队里，就会遇到完全不同的问题：规则冲突、版本漂移、执行偏差、无法衡量 ROI。

### AGENTS.md 是跨工具契约

再强调一次：AGENTS.md 已经是 Linux Foundation 托管的正式开放标准，被 20+ 工具原生支持。**Vercel Agent Readability Spec** 更进一步，把 AGENTS.md 纳入站点可达性规范，推荐在 `/AGENTS.md`、`/.well-known/agents.md`、`/CLAUDE.md`、`/.cursor/rules` 等多路径同时暴露。这就像 robots.txt 和 sitemap.xml 之于搜索引擎——AGENTS.md 之于 AI agents。

团队层面的建议：**主文件写 AGENTS.md，CLAUDE.md 只写一行 `See @AGENTS.md`**（Anthropic 推荐的 import stub 模式）。所有工具共享同一份，Claude 专属的小众特性单独放 CLAUDE.md。这样切换工具不用改配置，Claude 专属优化也不会流失。

### CLAUDE.local.md 已废弃，用 @imports

注意：`CLAUDE.local.md` 这个文件已经被 Anthropic 官方废弃（见 anthropics/claude-code issue #2950）。推荐用 `@path/to/file` 语法（最多 5 跳递归）。个人私货建议用 `@~/.claude/personal-overrides.md` + `.gitignore` 一行，替代旧版 local 文件。

### Spec-Driven：团队级 Agent OS

2025 下半年，三大 Spec-Driven 开发阵营涌现：

- **GitHub Spec Kit**：Constitution → Specify → Clarify → Plan → Tasks → Implement 六阶段，每阶段人类 gate，agent 无关。
- **BMAD-METHOD**（GitHub 43k 星）：12+ 角色 Agent-as-Code（Analyst / PM / Architect / SM / Dev / QA），用 YAML 编排 handoff，企业级多 agent 流水线。
- **Kiro**（AWS 的 VS Code fork）：spec → design → tasks → impl 内嵌 IDE，配合 steering 文件（product.md / structure.md / tech.md）做持久上下文。

Martin Fowler 对这三者做过对比。他的建议是：**小 bug 别套 SDD，否则是拿叉车嗑核桃**。但当任务横跨多个模块、需要多轮对话、需要多人/多 agent 协作时，SDD 可以避免"越改越乱"。

### Eval-Driven CLAUDE.md

Fireworks、LangChain、MLflow 都在推动一个新范式：**把 CLAUDE.md / SKILL.md 视作被测对象**。做法是：

1. 写 **binary 断言套件**，在 Docker 干净环境里跑。
2. LLM judge + rule-based judge 混合：前者判行为与顺序，后者判副作用（文件是否生成、命令是否执行）。
3. 用 MLflow 对每个 Claude Code session 做 trace，通过 span 反查"某条规则到底有没有被加载"——光看输出抓不到"prereq 没触发"这类失败。

MindStudio 甚至做了一个自改循环：让 Claude Code 自己改 CLAUDE.md 直到断言全绿，配合 QUALITY.md 记录 baseline。这就是 CLAUDE.md 的"自动化回归测试"。

### 可观测性：规则 ROI 度量

Harrison Chase 的团队把 LangSmith 接入 Claude Code，**可以看到哪些规则被调用、哪些被忽略**——这是规则 ROI 度量的唯一手段。结合 PostToolUse hook 和 LSP 诊断（文件编辑后自动回灌 type error），把"是否遵守规则"变成**可观测信号**。

### Meta-CLAUDE.md

`.claude/skills/meta/` 放一个"如何编辑 CLAUDE.md 本身"的 skill——长度上限、死链检查、规则分级约定。下一次改规则的 agent 先读这个 meta-skill，再动手。这正是 Kiro steering、BMAD orchestrator 的底层模式：**规则之上还有规则**。

### GitHub Squad 的 decisions.md

GitHub Copilot 团队的博客披露了他们的 "Squad" 模式：每个架构决策作为结构化 block 追加到版本化 `decisions.md`，作为**异步团队大脑**。任何 agent 在做新决策前先读 decisions.md，避免重复讨论、避免颠覆过去。

这是把 ADR（Architecture Decision Records）的人类实践，搬进了 AI 协作的世界。

---

## 八、非代码场景：PARA、Obsidian、学术写作

CLAUDE.md 不只服务软件工程。写作、研究、知识管理、课程、博客、论文——任何需要 agent 辅助的知识工作，都可以用 CLAUDE.md。

### PARA / Obsidian 金库

PARA（Projects / Areas / Resources / Archive）是 Tiago Forte 提出的个人知识管理框架。在 Obsidian 金库里配置 CLAUDE.md 的典型思路：

- **金库语义**：四个目录各自的语义（Inbox 未分类 → Projects 有截止日 → Areas 长期责任 → Resources 参考 → Archive 冻结）
- **Frontmatter 标准**：YAML 字段规范（title / date / tags / status / source / para-type）
- **分类决策树**：Claude 在 Inbox 看到新文件时，如何判断应该归到哪里
- **Tone/Voice**：写周记 vs 写研究笔记 vs 写项目文档，语气约定
- **周回顾 workflow**：每周一次把 Inbox 清空到四象限的流程

相关仓库可以参考：`ballred/obsidian-claude-pkm`（完整 PARA 启动套件）、`AgriciDaniel/claude-obsidian`（Karpathy LLM Wiki 模式）、`danielrosehill/Claude-Code-Projects-Index`（非代码用法集锦）。

Mauricio Gomes 在《Teaching Claude Code My Obsidian Vault》里给出一个重要提醒：**每月回顾更新一次 CLAUDE.md**，否则会随金库演化而过期。

### 学术写作

K-Dense-AI/claude-scientific-writer、Galaxy-Dawn/claude-scholar、Imbad0202/academic-research-skills 这三个仓库代表学术方向的成熟实践：

- **风格校准**：喂 3 篇旧文让 Claude 学习句式、引用习惯
- **优先级**：学科规范 > 期刊规范 > 个人风格
- **引用红线**：明确写"绝不使用未经核实的引用"，加 claim-citation 对齐检查，避免幻觉 BibTeX
- **AI 使用披露**：Methods 节声明用了 Claude 做什么
- **Writing Quality Check**：禁用词表（25 个 AI 高频词）、破折号 ≤3、句长 burstiness 检查

### 博客/内容仓库

GitHub Blog 在《How to write a great agents.md》里总结了从 2500 个仓库观察到的规律：

- 用强命令词 ALWAYS / NEVER / MUST
- 显式 Personality 区块（Tone / Style / Voice 三分）
- 输出格式模板（H1 / meta / H2 节 / CTA / tags）
- 词汇黑白名单（"challenge" 代替 "problem"）

HumanLayer 建议博客 AGENTS.md **< 60 行**；共识上限 < 300 行。

---

## 九、中文社区的独有视角

中文开发者写 CLAUDE.md，和英文社区同中有异。

**"八百字"基准**。知乎一位作者的严谨实验：三千字砍到一千字有所改善，砍到八百字明显变好，砍到四百字时关键信息丢失，最后稳定在八百字左右。这个数字和英文社区 "60—250 行" 的基准换算下来基本一致。

**四工具碎片化**是中文开发者独有的痛点：Cursor + Claude Code + Trae + 通义灵码要维护四套配置。`Mr-chen-05/rules-2.1-optimized` 这种专门为中国开发者打造的规则体系，一键同步到 Augment/Cursor/Claude Code/Trae 四家工具，是这种痛点下的典型产物。

**双语 Skill 结构**：hong111109/humanizer 用 `zh/` + `en/` 子目录分别存中英模式，自动检测输入语言。这是中文圈独有的 skill 组织形式。

**"使用中文交流"几乎是每个中文开发者全局 CLAUDE.md 的标配**。加上"python 包管理默认 uv"、"node 包管理默认 pnpm"这类工具链偏好——中文圈的全局 CLAUDE.md 倾向于**工具链偏好 + 语言偏好混排**，非常务实。

宝玉（@dotey）是中文 AI 编程第一 KOL，最近重点推荐 shareAI-lab/learn-claude-code——**30 行代码实现 nano Claude Code**，帮开发者看穿 harness 本质。他的另一个观点是"Vibe Coding 不神奇"：先手工跑通再交给 AI，**小版本迭代**（滑板车 → 自行车 → 摩托车 → 汽车）。这个隐喻契合 CLAUDE.md 的演化逻辑——**从粗糙到精细**，不追求一次到位。

**公众号发布流水线**是中文独有的非代码场景。oaker-io/wewrite、geekjourneyx/md2wechat-skill 把"抓热点 → 选题 → 排版 → 推草稿箱"做成 Skill，这在英文生态里几乎没有对应物。

---

## 十、落地清单：从全局到项目

把前九节的内容落到你自己的工作环境，下面是一个可执行的清单。

### 全局 `~/.claude/CLAUDE.md`

保持精简，只写**跨项目的偏好**：

1. 语言（"使用中文交流"）
2. 包管理器默认值（"python 用 uv，node 用 pnpm"）
3. 隐私（"所有推送仓库默认 private"）
4. 协作底线（"修改交互细节必须加 e2e 测试"）
5. 自改进机制（"每次会话失败要追加避坑规则"）

行数控制在 **10 行以内**。它每次会话都被加载，越短越好。

### PARA 根 `CLAUDE.md`

在 `C:\Users\Remy\PARA\` 放一个 CLAUDE.md，内容：

1. PARA 四目录语义与分类决策树
2. Frontmatter 标准（title / date / tags / status / source）
3. 语言优先级（中文优先，引用保留原文）
4. 禁用 emoji（与全局一致）
5. 每周 Inbox 清空 workflow

### 代码项目 `AGENTS.md` + `CLAUDE.md`

以 AOE 后端为例：

- `AGENTS.md` 为主文件（构建命令、测试命令、Code Style、Common Pitfalls、Lessons Learned）
- `CLAUDE.md` 只一行：`See @AGENTS.md`
- `.agents/decisions.md` 版本化记录架构决策
- `.claude/skills/meta/claude-md-editing.md` 规范如何编辑 CLAUDE.md 本身

### 引入"两次原则"

把"每次 bash 失败都写规则"改为"**同一失败第二次才写规则**"。第一次发生时，在 MEMORY.md 里记一笔"观察到 X"；第二次发生时，把它提升为 AGENTS.md 里的正式规则。这样信号/噪声比显著上升。

### Oracle 模式（可选）

重大架构决策时，让 Claude 主动调 GPT 咨询。在 AGENTS.md 声明触发条件：

> When deciding on system architecture that affects >3 modules, consult the GPT oracle via the `oracle` tool and record the exchange in `decisions.md`.

### 避坑清单

- ✗ 把 CLAUDE.md 当文档塞（每行都进每次 context）
- ✗ 硬编码 API Key、过期模型 ID（`claude-3-opus`）
- ✗ 场景化指令（"如何设计新的订单 schema"——只有你做订单时有用，其他时候是噪声）
- ✗ 与 README 重复项目介绍
- ✗ 用模糊词（"be careful"、"be nice"）
- ✓ 每月回顾修剪一次
- ✓ 规则有生命周期：active / dormant / dead
- ✓ 失败进 pitfalls，成功进 lessons learned

---

## 十一、未来方向猜想

如果把 2025 年视作 CLAUDE.md 这类指令文件的**元年**，2026 年会发生什么？我有三个不确定但倾向性明显的猜测。

**第一，CLAUDE.md 会分裂成多个层次**。就像代码从"一个文件"分裂到"源码 + 配置 + 测试 + 迁移"四层一样，CLAUDE.md 会分裂成：persona（身份）/ rules（规则）/ memory（记忆）/ decisions（决策）/ pitfalls（陷阱）五层，每层有自己的生命周期和维护节奏。

**第二，规则会被正式"版本化 + 签名"**。就像 Docker 镜像有 tag 和哈希，未来的 AGENTS.md 会有 semver，有 checksum。"这个 agent 基于 AGENTS.md v2.3.1 做的决策" 会变成可审计的事实。这对合规场景（金融、医疗）尤其重要。

**第三，会出现 CLAUDE.md 的市场**。现在的 awesome-claude-code 和 aitmpl.com 是免费共享层。下一步可能会有付费的 AGENTS.md 集——针对 Stripe 集成、针对 Supabase、针对 Next.js + Drizzle + Clerk 这种组合的"成熟仓库规则包"，像 npm 包一样被 require。

---

## 十二、结语：从提示到上下文，从文件到系统

回到开头那个问题：到底要写多少 CLAUDE.md？

如果 2024 年的答案是"尽量详细"，那 2026 年的答案是"**尽量少，但尽量活**"。少——因为每一行都在消耗 agent 的注意力预算；活——因为规则不是静态合同，而是**持续演化的机构知识**。

Karpathy 说 Markdown 是源代码，ghuntley 说你在给 LLM 编程，Chase 说 Context 是团队护城河。这三句话说的是同一件事——**你写 CLAUDE.md 的方式，本质上是在定义你和 AI 的协作契约**。这份契约写得好，agent 像一个专业的新同事；写得不好，agent 像一个健忘、恭维、动不动就自作主张的实习生。

所以不要把它当作"配置文件"。把它当作**你团队/项目最重要的那份规范文档**。像代码一样 review，像代码一样重构，像代码一样测试，像代码一样淘汰过时的部分。

祝你写出一份能用三年的 CLAUDE.md。

---

## 参考资料

- [agents.md 官方标准](https://agents.md/)
- [Anthropic Claude Code Best Practices](https://code.claude.com/docs/en/best-practices)
- [HumanLayer: Writing a good CLAUDE.md](https://www.humanlayer.dev/blog/writing-a-good-claude-md)
- [Karpathy on context engineering (X)](https://x.com/karpathy/status/1937902205765607626)
- [karpathy/autoresearch — program.md 范式](https://github.com/karpathy/autoresearch)
- [karpathy/llm-council CLAUDE.md](https://github.com/karpathy/llm-council/blob/master/CLAUDE.md)
- [forrestchang/andrej-karpathy-skills](https://github.com/forrestchang/andrej-karpathy-skills)
- [Armin Ronacher — Agentic Coding Recommendations](https://lucumr.pocoo.org/2025/6/12/agentic-coding/)
- [Geoffrey Huntley — stdlib](https://ghuntley.com/stdlib/) / [Ralph](https://ghuntley.com/ralph/)
- [Simon Willison — async code research](https://simonwillison.net/2025/Nov/6/async-code-research/)
- [Hamel Husain — Evals Skills for Coding Agents](https://hamel.dev/blog/posts/evals-skills/)
- [Harrison Chase on Context Engineering (Sequoia)](https://sequoiacap.com/podcast/context-engineering-our-way-to-long-horizon-agents-langchains-harrison-chase/)
- [jack60810/claude-evolve](https://github.com/jack60810/claude-evolve)
- [Martin Fowler — SDD Tools Comparison](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html)
- [GitHub Spec Kit](https://github.com/github/spec-kit)
- [BMAD-METHOD](https://github.com/bmadcode/BMAD-METHOD)
- [GitHub Blog — How Squad coordinates AI agents](https://github.blog/ai-and-ml/github-copilot/how-squad-runs-coordinated-ai-agents-inside-your-repository/)
- [ballred/obsidian-claude-pkm](https://github.com/ballred/obsidian-claude-pkm)
- [Mr-chen-05/rules-2.1-optimized](https://github.com/Mr-chen-05/rules-2.1-optimized)
- [宝玉：shareAI-lab/learn-claude-code](https://github.com/shareAI-lab/learn-claude-code)
- [CLAUDE.md 记忆管理深度解析（知乎）](https://zhuanlan.zhihu.com/p/1935398779978252415)
