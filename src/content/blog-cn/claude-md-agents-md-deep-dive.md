---
title: 'AGENTS.md 与 CLAUDE.md 怎么选：加载规则、共存配置与模板'
pubDate: 2026-04-25T00:00:00.000Z
updatedDate: 2026-10-26T00:00:00.000Z
description: '按 Claude Code 版本说明 AGENTS.md 与 CLAUDE.md 的读取、共存和回退，区分 Codex 加载规则，提供验证步骤与可复用模板。'
author: 'Remy'
tags: ['claude-code', 'ai-agents', 'Context Engineering']
---

## AGENTS.md 和 CLAUDE.md 该用哪个？

**跨工具共享的仓库规则，以及给 Codex 的规则，放 AGENTS.md；Claude Code 专用规则放 CLAUDE.md。** 两种工具都用时，我建议把共同规则写在 `AGENTS.md`，再用一个很短的 `CLAUDE.md` 通过 `@AGENTS.md` 导入。这样只维护一份共同规则，也不依赖每位同事的 Claude 版本和回退设置。[1] [2] [3]

**Claude Code 会直接读 AGENTS.md 吗？** 从 **v2.1.277** 起，支持该功能的会话可以直接读取，但默认情况下，工作目录或祖先目录只要存在 `CLAUDE.md`、`.claude/CLAUDE.md` 或 `CLAUDE.local.md`，就会阻止 AGENTS 回退。用户级 `~/.claude/CLAUDE.md`、组织管理的指令和 `.claude/rules/` 不阻止回退。两个文件都在，不代表两个都会读。[1]

先运行 `claude --version`，再看 `/config` 的 **Project instructions** 和 `/context`，用 `/memory` 检查 AGENTS 路径。旧客户端或混合团队直接用下面的[导入模板](#可复制的共同规则与导入模板)；想让两个文件直接共存，查看[版本与共存条件](#不同版本与文件布局会加载什么)。Codex 使用[另一套发现规则](#codex-的发现与回退规则)。

## 不同版本与文件布局会加载什么

以下按 **2026 年 10 月 26 日核对的官方文档**说明，不能套用到所有历史版本。[1]

| 版本或配置 | 实际行为 |
| --- | --- |
| 早于 v2.1.277、关闭 AGENTS 内置插件，或部分从 v2.1.276 及更早版本升级后的首次会话 | 不能直接加载 AGENTS；使用 CLAUDE 导入。升级后另开新会话。 |
| v2.1.277 至 v2.1.280 | 已有直接读取能力，但 Bedrock、关闭遥测等部分会话仍需升级或导入。 |
| 支持该功能，默认 `claude-md-or-agents-md` | 工作目录和祖先目录没有阻断回退的 CLAUDE 文件时，才读 AGENTS。 |
| `claude-md-and-agents-md` | 两种都读；每个目录先 CLAUDE、后 AGENTS；已被导入的 AGENTS 会去重。 |
| `claude-md` | 只直接读 CLAUDE；显式 `@AGENTS.md` 导入仍可用。 |
| `managed-only` | 启动时只读组织管理指令和自动记忆；子目录及按路径匹配的规则仍可按需加载，不是全面禁用项目规则。 |

在 `/config` 设置 **Project instructions**。要直接改用户配置，把下面片段合入 `~/.claude/settings.json`，保留已有设置：

```json
{
  "pluginConfigs": {
    "cc-plugin-agents-md@builtin": {
      "options": { "instructionFiles": "claude-md-and-agents-md" }
    }
  }
}
```

**v2.1.285 之前**要用 `agents-md@builtin` 作为键；v2.1.285 起两种 ID 都接受。此选项从用户设置、`--settings` 或组织管理设置读取，**项目和 local 设置文件里的值会被忽略**，修改从下一条消息起生效。因此，把它写进 `.claude/settings.json` 不会让全团队自动切换到双文件加载。[1]

Claude 的原生支持会读 `AGENTS.md` 和 `.claude/AGENTS.md`，不读 `AGENTS.override.md`、`AGENTS.local.md` 或 `.agents/` 目录中的指令文件。满足回退条件时，Claude 用 Read 工具打开子目录文件，才会按需加载该目录的 AGENTS。这个规则与 Codex 的 override 规则不同；加载先后也不意味着冲突的自然语言规则一定有确定结果，应直接消除冲突。[1] [2]

## 可复制的共同规则与导入模板

下面适用于已有 `pnpm build` 和 `pnpm test` 脚本的仓库。采用前把命令和生成目录替换成项目实际使用的值。根目录 `AGENTS.md`：

```markdown
## 工作约定
- Node 依赖使用 pnpm，Python 依赖使用 uv。
- 保留工作区中与本次任务无关的改动。
- 修改源文件，不直接编辑生成的 dist/ 目录。

## 验证
- 修改代码后运行 pnpm test 和 pnpm build。
- 检查无法运行时，说明具体命令及阻塞原因。
- 交付时说明行为变化、已做检查和剩余限制。
```

在同一目录的 `CLAUDE.md` 写：

```markdown
@AGENTS.md

## Claude Code
- 修改计费行为前，先提出受影响的场景和测试。
```

文章用代码块展示内容，但在**实际文件中**，`@AGENTS.md` 不能包在反引号或代码块里。"请读取 AGENTS.md"只是让模型执行一个请求；`@AGENTS.md` 则由 Claude Code 的导入机制处理。相对路径以导入文件为基准，所以 `.claude/CLAUDE.md` 应写 `@../AGENTS.md`。当前递归导入上限是四跳。有 Windows 同事时，导入比符号链接更容易保持一致。[1]

## 怎样确认规则真的加载了

1. 在终端运行 `claude --version` 和 `codex --version`，记下启动目录与相关设置。
2. 从仓库启动新的 Claude 会话，查看 `/context` 的 **Memory files**，再用 `/memory` 找 AGENTS 路径。v2.1.280 之前，直接读取的 AGENTS 不出现在这两个列表里；升级或改用导入更容易诊断。
3. 在临时测试仓库加入无副作用的独特指令，例如"询问验证标签时，回复 `instruction-check-26`"。提问时不要重复标签，观察回答，并同时检查文件加载路径。
4. 验证嵌套规则时，让 Claude 读取该目录中的普通文件，查看终端的 `Loaded` 提示。仅看启动列表，不能判断按需加载的文件是否失效。
5. 修改 Codex 指令后重新启动，让它列出指令来源和验证命令，再与实际文件核对；必要时查看 TUI 日志。

这几步把"是否加载"和"是否执行"分开检查。文件加载成功，模糊的要求仍可能执行不一致。Claude 的 `InstructionsLoaded` hook 能跟踪 CLAUDE 导入及规则，但**不会**为插件直接读取的 AGENTS 触发；没有 hook 事件，不能据此认定 AGENTS 没读到。[1] [2]

## Codex 的发现与回退规则

Codex 在启动时，从自己的 home 目录，以及项目根目录到当前工作目录构建指令链。项目路径上每层最多选择一个非空文件，顺序为 `AGENTS.override.md`、`AGENTS.md`、配置的 fallback 文件名，较深目录内容排在后面。与 Claude 的回退算法不同，Codex 还用 `project_doc_max_bytes` 限制合计长度，默认上限是 **32 KiB**。[2]

只有 CLAUDE.md 的旧仓库，可以在 `~/.codex/config.toml` 合入：

```toml
project_doc_fallback_filenames = ["CLAUDE.md"]
```

重新启动 Codex 后，CLAUDE.md 是**回退候选**，不是同目录 AGENTS.md 的附加文件。也不要假设 Codex 会展开 Claude 的 `@` 导入。两种工具共用项目时，共同规则直接放 AGENTS.md 更好检查。验证嵌套目录可以运行：

```bash
codex --cd services/payments "列出当前生效的指令来源和验证命令，不要修改文件。"
```

目录须实际存在。预期启动链包括全局文件、仓库文件及沿途选中的文件，并不代表所有兄弟包都在启动时加载。需要进一步查证时，用 `codex -c log_dir=./.codex-log` 启动，检查 `codex-tui.log`；日志可能包含项目私有内容。[2]

## 写在前面

为什么同样的规则换一个文件名，执行结果就不同？因为文件名、启动目录、客户端版本和设置共同决定模型能看到什么，文字本身写得好不好，是加载成功之后的问题。

下面保留十二节讨论，继续解释上下文、记忆、团队协作和非代码仓库。我更看重能让下一次任务少走弯路的具体决定，以及能检查结果的办法。堆积规则不能补上验证缺口。

---

## 一、先把三个文件分清楚：README.md / CLAUDE.md / AGENTS.md

在任何一个"给 AI 读的文件"长出来之前，我们先把三种文件的定位讲清楚。

**README.md** 是写给人看的。它的受众是"**第一次打开你的仓库的人类开发者**"，目的是让他们在五分钟内理解项目做什么、怎么跑起来、怎么贡献。它的语气是说明性、营销性的，内容组织遵循金字塔原理：**是什么 → 怎么用 → 怎么参与**。

**CLAUDE.md** 给 Claude Code 提供持久指令。新会话有新的上下文窗口，并不等于没有记忆：指令文件和自动记忆能把信息带到下一次会话。项目文件适合记录验证命令、仓库限制，以及从代码中看不出的决定。[1]

**AGENTS.md** 是由 Linux 基金会下属 Agentic AI Foundation 管理的开放 Markdown 格式，没有必填字段或固定 schema。不同工具可以共享内容，但文件发现、设置及继承方式仍然不同。Claude Code 和 Codex 应分别按上面的加载规则配置，不能把生态支持理解为所有工具行为相同。[3]

这三个文件互补而非替代。README.md 回答"是什么"，CLAUDE.md 和 AGENTS.md 回答"怎么做"。区别在于前者是面向人类的营销页，后者是面向机器的运行手册。

一个常见误区是把 CLAUDE.md 写成 README.md 的翻版——贴一段项目简介、贴一张架构图、贴一段 Getting Started。这些内容对 agent 几乎没用。agent 不需要知道项目卖点，它需要知道"跑测试是 `pnpm test` 还是 `npm run test:unit`"、"改完代码是否要跑 codegen"、"哪些目录禁止改动"。

另一个误区是把"写过一次就永远不改"。CLAUDE.md 的本质是**活文档**，它应该随着项目演进不断增删。Anthropic 官方最佳实践里有一句话直白地说："Treat CLAUDE.md like code: review it when things go wrong, prune it regularly."（把它当代码对待：出问题时要审查它，要定期修剪它。）

---

## 二、通用最佳实践：长度、结构、写法

### 长度

这是最没有争议也最容易做错的部分。

HumanLayer 署名 Kyle 的《Writing a good CLAUDE.md》建议缩短根指令，把细节拆到独立文档。大型仓库的行数不是自己项目的目标：检查方式、目录结构和加载预算都不同，不能仅按字符数判断效果。

Anthropic 当前建议每份 CLAUDE.md 少于 200 行。这是写作建议，不是所有模型都适用的指令数量上限。导入文件会和父文件一起加载，拆成 `@` 导入本身不节省上下文。只对部分代码生效的要求，应放到对应目录或按路径匹配的规则中，再验证触发条件。[1]

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

不存在一个通用遵守率，可以证明 Markdown 规则足以保障操作安全。必须阻止的操作，需要权限、沙盒或阻断式 hook。写"不要部署"是在给模型指令；权限边界才决定它能不能部署。[1]

---

## 三、从真实样本学最佳实践

理论永远敌不过样本。下面这八个 GitHub 仓库是我筛选出的高质量样本，值得逐一打开看一看。

**1. openai/codex**（Rust 实现的 AI 编码代理）
800 行的 AGENTS.md，按 `codex-core` crate、TUI style、TUI code、text wrapping、tests、snapshot tests、app-server API 等子领域严格分区。最有价值的一句是"**Resist adding code to codex-core**"——抵制往核心包塞东西。这种带"反向意图"的规则比"保持代码简洁"这种正向空话有效得多。它还写死了单文件 500 LoC 目标，超过 800 LoC 必须拆分，用 `insta` 做快照测试、用 `pretty_assertions` 做深度比较。

**2. vercel/vercel**
可以重点看它如何区分仓库结构、常用命令、changeset、测试和包开发，再把常见问题集中到 Common Pitfalls。值得借鉴的是分类方式，不是某一时刻的行数。

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

在开发环境把注册邮件输出到 stdout，并在指令中说明日志位置，agent 就有机会完成注册、提取确认链接和访问链接的验证流程。这里重要的是给出可观察的结果，而不是只写一句"确认注册成功"；其他异步操作也应提供对应的检查入口。

**No dead ends**（无死胡同）。图像生成工具必须写到代码执行工具能读到的同一虚拟文件系统。**工具链必须形成闭环**。否则 agent 就会卡在"我生成了图，但我下一步读不到它"的悖论里。

他还有一个看起来很小的观察：Claude Code 的 TodoWrite 只是回显任务列表，但这种**动态回显比一次性放在 context 顶部更能驱动 agent**。原因是 context 顶部的东西在 attention 分布里是"远端"，会被稀释；而每次 tool call 后重新注入的是"近端"，更强。

### Geoffrey Huntley：stdlib、Ralph、上下文利用率

ghuntley.com 的 Geoffrey Huntley 把**团队约定当成编程语言的标准库**来管理——把规则存到 `.cursor/rules/*.mdc` 或 `specs/stdlib/*.md` 里。他说过一句非常赤裸的话：

> "你实际上在给 LLM 编程，而不是在用 IDE。"

他发明的 **Ralph Wiggum 技法**（名字取自《辛普森一家》里那个憨憨的角色）把这个思想推到极致：

```bash
while :; do cat PROMPT.md | npx --yes @anthropic-ai/claude-code-cli ...; done
```

每轮限定一个仓库和一项任务，并通过 PROMPT.md 传递要求，可以减少循环中不必要的范围变化。复制别人的提示时仍要检查它依赖的工具和测试，因为别人在特定环境观察出来的规则，未必适用于当前项目。

他的另一个核心指标：**上下文窗口利用率目标 40—60%**。超过就产出质量下降。整个 advanced context engineering for coding agents 工作流都围绕"频繁的、有意的 compaction"设计。

### Simon Willison：AGENTS.md 写运行时异常

Simon Willison 在 simonw/research 仓库的 AGENTS.md 里专门针对**沙盒网络限制**写提示——这提醒我们：AGENTS.md 应该包括**运行时环境的异常**，不只是代码规范。如果 agent 会在某个 IP 段被阻断、某个端口不可用，这些都要明文写出来。

他还做过一个长时间线的观察：**"写 Markdown 让 agent 先读"这种模式最早出现在 2023 年的 ChatGPT Code Interpreter**。也就是说，CLAUDE.md 并不是凭空出现的新物种，而是一个用了三年的老模式被重新标准化。

### Hamel Husain：Eval 即活 PRD

Hamel Husain 提出一个让整个评测领域尴尬的观点：**好的 eval prompt 本身就是活的 PRD**——它实时、持续地测试 AI 行为。他反对把 prompt 放进 LangSmith 等"一层额外的平台"，主张**把 prompts 存进 Git、像软件制品一样版本化**。

这个观点对 CLAUDE.md 的启示是，指令本身也需要验证。例如写了"ALWAYS run typecheck"之后，应在可重复的任务中检查命令是否真的执行，而不是只看最终回答有没有说"已验证"。

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

Claude Code 区分团队维护的指令和自动记忆。记忆索引通常位于 `~/.claude/projects/<project>/memory/MEMORY.md`，启动时读取前 **200 行或 25 KB，先到者为准**。随便在仓库根目录放一个 MEMORY.md，不会因为文件名相同就获得这种行为。[1]

自动记忆适合观察和偏好，团队确认的决定放共享指令。细节可以放按需读取的主题文件。本机记忆不是向所有同事分发仓库规则的可靠办法。[1]

记住的命令在执行前仍要与当前项目脚本核对。迁移前正确的记录，可能在记忆文件完全没改动时就过期了。

### Auto Dream：记忆卫生

自动清理记忆可以作为可选工作流，不能仅凭文件名就假设后台已经在做。可执行的维护包括把相对日期改成已知的绝对日期、删除失效的临时修复，以及为一个限制补上当初的决策依据。

记忆需要卫生——这是我看到过最反直觉的一条。记忆不是只增不减的日志，而是**需要持续清洗的活数据**。

### "两次原则"（Two Strikes Rule）

Anthropic 把重复错误列为添加规则的理由之一，也包括代码审查发现和新同事需要知道的信息。等第二次发生适合筛选偶发故障，不意味着必须让一次代价很高的错误再发生，才有资格记录。[1]

单次失败可能来自临时网络问题或命令输错，应先诊断，再决定是否增加永久规则。重复发生更可能说明有可复用的教训，但严重程度和审查证据，比凑够某个次数更重要。

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

在 `.claude/rules/` 中，YAML 的 `paths:` 可以把规则限定到匹配文件。普通 AGENTS.md 里写一个 `paths:` 标题不会获得这套机制。根文件仍应简短，组件规则放到独立规则文件，再通过读取匹配文件验证。按需加载减少无关内容，不代表几千行根 CLAUDE.md 没有成本。[1]

### Versioned Changelog 顶置

变更记录可以解释规则为什么改变，但标题本身不会触发与上一会话的自动比较。需要比较时，明确要求检查 Git diff。当前规则应能直接读懂，不必重建全部历史才能执行。

---

## 七、团队工程化层：把 CLAUDE.md 当代码对待

单个开发者的最佳实践和一个团队的最佳实践是两回事。上文的一切技巧，放到五人、五十人、五百人的团队里，就会遇到完全不同的问题：规则冲突、版本漂移、执行偏差、无法衡量 ROI。

### AGENTS.md 是跨工具契约

跨工具协作既需要共同内容，也需要验证加载方式。开放格式减少重复维护，但 Claude 的导入不会配置 Codex，Codex 的 override 文件也不是 Claude 的覆盖文件。把文件发布到网站上，同样不会自动配置本地编码会话。[1] [2] [3]

混合团队把共同命令和限制放 AGENTS.md，CLAUDE.md 使用前面的显式导入，Claude 专用指令写在导入下面。若客户端配置成原生双文件加载，仍须检查规则冲突，不能假定后加载的文本一定严格覆盖前者。[1]

<span id="claudelocalmd-已废弃用-imports"></span>

### CLAUDE.local.md 仍受支持，但影响回退

当前官方文档仍支持 `CLAUDE.local.md`，用于项目内个人指令。把它加入 `.gitignore`。它会阻止默认 AGENTS 回退，因此同时保留显式导入，或开启双文件加载。要跨 worktree 复用个人指令，可以改用外部 `@path` 导入，但要满足批准和会话限制；当前递归上限是四跳。[1]

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

追踪、hook 和命令日志可以显示哪些检查确实执行了，却不能证明每条指令都影响了模型。还要检查观测方式：原生 AGENTS 加载不会触发 `InstructionsLoaded`，CLAUDE 导入则会。应对照文件发现、实际命令与产物，不能只信模型说自己遵守了规则。[1]

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
5. 维护约定（"检查重复故障，删除过时的临时处理办法"）

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
- `CLAUDE.md` 使用实际的 `@AGENTS.md` 导入，不能放在代码块中；Claude 专用指令写在下面
- `.agents/decisions.md` 版本化记录架构决策
- `.claude/skills/meta/claude-md-editing.md` 规范如何编辑 CLAUDE.md 本身

### 引入"两次原则"

偶发失败先记下观察，再检查是否重复；已知有破坏性的操作或审查发现，应立即记录限制。团队规则应写进共享文件，不能依赖某位开发者本机的自动记忆。

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

记录模型难以自行推断的决定，让加载路径可以检查，再验证实际结果。增加层级之前，先确认团队从常用目录启动时，必要的指令是否都能读到。

共同内容放 AGENTS.md，Claude 专用内容放 CLAUDE.md。更新客户端、增加个人设置或换到另一个 worktree 后，再检查一次加载情况。维护指令时，也要考虑真正执行它的环境。

---

## 参考资料

[1]: https://code.claude.com/docs/en/memory "Claude Code 记忆、加载、导入与版本边界"
[2]: https://developers.openai.com/codex/guides/agents-md/ "Codex 官方指令发现规则"
[3]: https://agents.md/ "AGENTS.md 开放格式"

- [1. Claude Code 记忆与 AGENTS.md 加载](https://code.claude.com/docs/en/memory)
- [2. Codex 自定义指令与回退文件名](https://developers.openai.com/codex/guides/agents-md/)
- [3. AGENTS.md 格式与常见问题](https://agents.md/)

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
