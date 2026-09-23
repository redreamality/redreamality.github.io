---
title: "Jev × Claude Code：别当聊天模型用，先搞清四条落地路径和 25 行最小实现"
description: "YouTube 爆款把 Jev 绑上 Claude Code，但 Jev 不能当 CLI 背后的聊天模型。本文整理官方 skill、边界钩子、MCP、按轮路由四条路径，对照 NobodyWho 的 25 行最小实现，并讨论 OpenAI 跟进压力。"
pubDate: 2026-09-23T14:40:00.000Z
author: "Remy"
tags: ["Jev", "Claude Code", "Agents", "开发者工具", "System One"]
lang: "zh"
---

过去两天，一条标题为「Jev will 10x your Claude Code」的视频在 YouTube 上迅速冲到约 41 万次播放。[1] 它把两件最近最热的东西绑在一起：TypeSafe 的决策模型 Jev，以及 Anthropic 的编码智能体 Claude Code。口号很诱人，但真正落地时最容易踩的坑，恰恰是把 Jev 当成「换个 base URL 就能当聊天模型」。

站内已经有一篇 [Jev 的使用前景与具体场景](/cn/blog/typesafe-jev-use-cases/)。那篇是**场景目录**：浏览器选下一步、模型路由、工单分流、引用核查、上下文管理，以及上线前怎么用真实样本验收。[2] **本篇不重做场景清单**，只回答更急的三件事：

1. **Jev 能不能直接当 Claude Code / Codex 的底层聊天模型？**
2. **如果不能，编码智能体上真正能接上的路径有哪些，安装与核对步骤怎么写？**
3. **「25 行 Python 复刻 Jev」在说明什么机制，以及大厂会不会很快跟进？**

一句话对照：场景文告诉你「在哪儿用判断」；本文告诉你「编码 agent 怎么接上判断层，机制是什么，竞争压力从哪来」。

## 先破一个最常见的误解

Jev **不能**作为 Claude Code 或 Codex 背后的聊天模型。[3]

Claude Code 走的是 Anthropic Messages API，Codex 走的是 OpenAI Responses API。即便你改了 base URL，线格式仍然要求「生成助手消息」：要有可渲染的 assistant 文本流、可解析的工具调用。Jev 的接口完全不同——你提交一份 `state` 和一组预先定义好类型的 `questions`，它返回带概率的结构化答案，**不生成自然语言字符串**。[4][5]

TypeSafe 公开文档里的主评估入口是 `POST /v1/systemone`，另有 `GET /v1/models` 列出账号可用的别名；默认模型是 `jev-latest`，也接受诸如 `jev-1.13.0` 的版本化 ID。[3][5] 文档里没有 `/v1/chat/completions`，也没有 Anthropic Messages 兼容接口。任何「把 Claude Code 指到 Jev 上就能跑」的说法，都把两类产品混为一谈了。

更准确的分工是：

- **Claude Code / Codex**：负责规划、写代码、改文件、解释结果。
- **Jev**：负责回路里那些「必须快、必须结构化、最好带校准概率」的判断——路由、门禁、压缩、验收。

这也是 LangChain 团队把 Jev 放进智能体编排层（harness）中间件时的表述：用 LLM 做开放推理与生成，用 Jev 做沿途的快速结构化决策。[6] 厂商自己的说法同样清楚：Jev 像一个「前沿智能的函数调用」——非结构化状态进，带类型与概率的决策出；它主动放弃字符串生成，换来并行输出与「不会产生类型错误」的产品约束。[4]

请求形状可以压成下面这种直觉（字段以官方文档为准）：

```json
{
  "model": "jev-latest",
  "state": "Deploy failed twice; customers see 500s. Can someone look now?",
  "questions": {
    "is_urgent": {
      "type": "noul",
      "instructions": "The message conveys urgency or time-sensitivity"
    }
  }
}
```

返回的不是一段助手回复，而是类似 `{"is_urgent": {"type": "noul", "noul": 0.999}}` 的类型化答案。[6] 你的代码拿这个概率去分支；CLI 仍然需要另一个会写代码的模型。

## 和站内场景文怎么分工

再强调一次，避免读者把两篇当成同一篇的长短版：

| | [场景文](/cn/blog/typesafe-jev-use-cases/) | 本文 |
| --- | --- | --- |
| 核心问题 | Jev 适合哪些业务判断？ | 编码 agent 怎么接 Jev？机制与竞争压力是什么？ |
| 证据结构 | 浏览器 / 路由 / 工单 / RAG / 上下文等场景 + 验收顺序 | skill / 钩子 / MCP / 按轮路由的可复现步骤 + 踩坑 |
| 对社区仓库 | 强调 README ≠ 上线证据 | 强调星标 ≠ 成熟度，并给出 fail-open 等工程约束 |
| 不覆盖 | 不展开 CLI 插件安装细节 | 不重做场景目录与业务验收清单 |

两篇都坚持同一条证据纪律：仓库收录、演示 GIF、作者自测，都不能直接当成生产可靠性。[2]

## 四条真正能接上 Claude Code 的路径

按对现有流程的改动面从小到大排列。命令、仓库与价格以 2026-09-20 前后可核公开材料为准（主要核对来源是 APIMaster 的集成指南，更新日期写到 2026-09-21）；社区仓库每天都在变，安装前请再读一遍 README。[3]

### 1. 官方 Agent Skill（首选，几乎不改行为）

这是 TypeSafe 官方支持的集成：教编码智能体写出正确的 Jev 调用，而不是劫持 CLI。[3][7]

**安装（Claude Code 插件）：**

```bash
claude plugin marketplace add typesafe-ai/skills
claude plugin install typesafe@typesafe-ai
```

**更新后加载：**

```bash
claude plugin marketplace update typesafe-ai
claude plugin update typesafe@typesafe-ai
```

然后重启 Claude Code，或运行 `/reload-plugins`。也可在 `/plugin` → Marketplaces → typesafe-ai 打开自动更新。[7][8]

**其他智能体（skills 安装器）：**

```bash
npx skills add typesafe-ai/skills --skill typesafe-ai
```

安装器会询问目标 agent；默认按项目安装，加 `-g` 可全局安装。[7]

**怎么确认装上了：**

1. 在 Claude Code 里直接调用 `/typesafe:typesafe-ai`，或在提示里写「use the TypeSafe skill」。[8]
2. 让 agent 基于同一份 `state` **一次请求里问多个问题**（含暂时用不上的探索性问题），而不是一问一调。TypeSafe 文档明确指出：编码智能体比人更容易掉进「一问一调」习惯，skill 就是来纠正这件事的。[5][8]
3. 若 agent 开始发明不存在的请求/响应字段，先按安装方式更新 skill 再重试——官方把这列为常见问题。[8]

Skill 改变的是**写法习惯**，不是拦截工具调用。TypeSafe 自己的并行问题示例把约 13 个问题打进一次请求，并在 cookbook / building guide 里分别报告约 12.2× 更便宜与 10.0× 更快、以及约 11.5× / 9.6× 的数字（厂商自测，同一测试两页数字略有出入，应视为数量级参考而非独立评测）。[3][5] 请求还有大约 32,000 token 的共享预算（state + 全部 questions），大约对应 15 万英文字符量级，需要按文档预留上限。[3]

### 2. 边界钩子（PreToolUse / 压缩 / Stop）

真正省钱、省时间的往往发生在边界上：工具执行前、长输出进上下文前、会话声称「完成」时。社区已经出现一批钩子：会话压缩、危险 shell 门禁、对「done」声明的二次核对、终端输出裁剪等。[3] LangChain 的 `AutoModeMiddleware` 把同一思路做成中间件：在工具执行前用 Jev 检查风险。[6]

以 `jev-axi` 的 PreToolUse 形态为例（社区方案，不是 TypeSafe 官方产品）。安装后可用 `setup safety` 挂到 Claude Code / Codex 的 Bash 前置钩子；本地能判定的常规命令会直接放行，可疑命令再打 Jev。[9]

```bash
npm install -g jev-axi
export TYPESAFE_API_KEY=...
jev-axi setup safety
```

作者公开的演示里，下载并执行未审查脚本一类命令会被高概率标为 `remote_code` 并拒绝；`pnpm test` 一类常规命令则走本地启发式、不耗 Jev 调用。`guard` 还可以筛网页/issue 里的注入指令，README 展示过约 375ms、约 $0.00004 量级的单次筛查（作者自测）。[9]

**工程上更重要的不是演示数字，而是失败策略。** 较好的实现会写明 **fail-open**：判断失败、读不到 transcript、超时或服务不可用时，放行或降级，而不是卡死 CLI。[3][9] 例如 `jev-axi` 写明：钩子读不到 agent transcript 时什么也不做；`jev-belay` 一类 stop hook 则强调只在「有改动且没有通过检查」时才花一次多问题 Jev 调用，并在错误时 fail-open。[3]

这类仓库大多在几天内冒出。星标代表注意力，不代表成熟度；`fast-jev-compaction` 一类高星项目同样适用这条纪律。[3]

### 3. MCP 工具

若希望模型主动调用「判断工具」，社区有 `@jkudish/jev-mcp` 等 MCP 服务器，把校验、筛选、分类、门禁等封装成工具。[3][10] TypeSafe 文档本身未把 MCP 列为一等公民，因此这是社区方案，不是官方保证。[3]

**Claude Code 添加（把密钥放在环境变量里，不要写进聊天或提交到仓库）：**

```bash
claude mcp add jev -e TYPESAFE_API_KEY=sk-... -- npx -y @jkudish/jev-mcp
```

**Codex（`~/.codex/config.toml`）：**

```toml
[mcp_servers.jev]
command = "npx"
args = ["-y", "@jkudish/jev-mcp"]
env = { TYPESAFE_API_KEY = "sk-..." }
```

该服务器暴露十个工具，例如 `jev_verify`、`jev_screen`、`jev_classify`、`jev_gate` 等；README 称单次判断大约 150–500ms、成本是「几分钱的几分之一」量级（作者自述）。[10] 设计意图很清楚：把 frontier 模型懒得每页、每条声明都跑一遍的机械检查，变成可调用工具。

命名陷阱：npm 上同时存在 scoped 的 `@jkudish/jev-mcp` 和另一个不相关的裸名 `jev-mcp`。配置里请钉死 scoped 包名，避免将来 `npx` 解析到错误包。[3]

### 4. 按轮模型路由（收益高，对现有流程改动也最大）

`jev-router` 在 CLI 前挂一个回环代理：每个新用户轮次用一次 Jev 选择模型档位，再把请求交给原来的 Claude Code / Codex。[3][11]

```bash
npm install -g jev-router
echo "JEV_API_KEY=..." > ~/.jev-router.env
jev-claude   # Claude Code；在 /model 里选 Jev Router
jev-codex    # Codex；临时 Jev Router provider
```

需要 Node.js 20.12+，以及已登录的 Claude Code 或 Codex。代理转发 CLI 自带的授权头，不读取、不存储、不改写；不涉及额外的 Anthropic / OpenAI API key。[11] 在模型选择器里选具体模型会暂停路由，再选回「Jev Router」则恢复。工具循环、权限、会话、`/compact`、`/resume` 仍是原 CLI 行为，因为写代码的仍然是原模型。[11]

默认档位映射（以仓库 README 为准）：

| 档位 | Claude Code 默认 | Codex 默认 |
| --- | --- | --- |
| Fast | Haiku | `gpt-5.6-luna` |
| Balanced | Sonnet | `gpt-5.6-terra` |
| Strong | Opus | `gpt-5.6-sol` |
| Long | Fable（需显式开启） | `gpt-6-astra` |

策略比「永远选最便宜」更保守：用户写「use opus」一类显式指定优先；低置信度不降级，升级也封顶到 balanced；长会话会拒绝为省钱而毁掉 prompt cache 的降级；不可用档位向上走而不是悄悄换弱模型；长档默认关闭，需 `JEV_ALLOW_FABLE=1`。失败时 **fail-open**，保留当前模型；退出启动器时恢复 CLI 原先的默认模型。[11]

这是最容易被误解成「用 Jev 跑 Claude Code」的路径。事实上，**写代码的仍然是原来的 frontier 模型**；Jev 只负责选档。

## 常见踩坑（比安装命令更值得先看）

1. **「不兼容端点」神话的反面：以为改 base URL 就行。** 没有 Anthropic / OpenAI 形态的兼容接口可指。这是近期相关内容里最常见的错误。[3]
2. **一问一调。** 决策模型的经济账来自「同一 state 上并行多问」。一问一请求既拖慢响应，也丢掉批处理优势；官方 skill 的主要纠正对象就是这件事。[3][5]
3. **把 confidence 当成 accuracy。** confidence 描述的是分布有多尖、该不该自动执行或升级人工；它不是「这次一定判对」的百分比。校准有用，是因为你知道何时不该盲目相信。[3][5]
4. **钩子不写 fail-open。** 判断层挂掉就卡死 CLI，比误放行一次更糟。成熟一点的社区实现会把失败路径写进 README。[3]
5. **星标 ≠ 成熟度。** 压缩插件可以几千星，仓库仍可能只有几天历史；验收靠你自己的任务集，不靠排行榜。[3]
6. **转发价格只在核对日有效。** APIMaster 在 2026-09-21 核对过 `jev-latest` 等路由价（例如宣称约 $0.042 / 1M input、$0 output），并强调渠道价随供给浮动、以当日卡片为准。本文只作日期附注引用，不把任何转发价写成长期价目表。[3]
7. **算术、日期、计数仍放在你自己的代码里。** TypeSafe 文档把这些区域标成不可靠；路由再聪明，也不该把账算交给快判断模型。[3][5]

## 25 行最小实现：在说明机制，不是在替代产品

NobodyWho 发表了《Jev in 25 lines of Python》：用本地 GGUF 模型、对选项 token 的 logits 做归一化，得到分类概率。[12] HN 讨论迅速跟上。[13]

核心动作可以压缩成三段（完整脚本与依赖声明见原文；此处只保留机制）：

```python
# Load any GGUF (example from the post)
model = Llama.from_pretrained(
    repo_id="Qwen/Qwen3-0.6B-GGUF",
    filename="Qwen3-0.6B-Q8_0.gguf",
    n_ctx=512,
    logits_all=True,
    verbose=False,
)

labels = ["A", "B", "C"]
choices = ["Legitimate", "Spam", "Phishing"]
# ... build chat prompt, then:
logits = model.scores[model.n_tokens - 1]
token_ids = [model.tokenize(text=label.encode(), add_bos=False)[0] for label in labels]
choice_logits = numpy.asarray([logits[token_id] for token_id in token_ids])
logprobs = choice_logits - numpy.logaddexp.reduce(choice_logits)
probabilities = numpy.exp(logprobs)
```

作者有意省略产品叙事：不叫 System One、不调 TypeSafe API、不做大规模合成数据、也不跑 RLCD。[12] 文末还标注这是 parody，并指向更完整的开源实现。剥离品牌之后，核心动作仍然是：「给定选项，读下一 token 分布，归一化成决策」。

这和 Arcturus Labs 的技术分析一致：对 `noul` 看 `true`/`false` 一类 token；对 `choice` 看选项标签 token 的相对概率。[14] OpenAI 多年前就在工具调用里用「下一个 token 是不是工具调用」做微型分类器；差别在于 Jev 把**通用、可校准的分类**做成了独立的对外接口与产品能力。[14]

HN 讨论补充了机制教学时不该漏掉的边界：聊天模型的 logprobs 会被「想写散文」稀释；选项字母存在位置偏差；未经校准的概率往往过度自信；多问题并行与校准训练，远不是再添几行 Python 就自动出现的。[13] 因此，25 行 demos 的正确读法是：

- **它能教你机制**：分类 ≈ 在约束好的选项上，读取下一 token 概率并归一化。
- **它不能代替 TypeSafe 的宣称优势**：并行多问、校准、工作流评测上的性价比前沿位置，以及「无法产生类型错误」的产品约束，都需要回到官方材料与你自己的任务评测。[4][5]
- **它也不能用「本地很快」偷换「前沿智能」。** 0.6B 量化模型能演示读 logits；它不能自动继承厂商对 workflow evals 的主张。[12][4]

站内场景文已经写过：项目清单和 README 不等于上线证据。[2] 对 25 行 demos 也应同样谨慎。

## OpenAI 会不会很快跟进？

Arcturus Labs 的论点是：若 Jev 接近「常规 LLM + 读取选项 token 概率 + 校准训练」，OpenAI 有能力快速跟进；更有威胁的不是单独做一个分类 API，而是把校准判断**嵌进**旗舰模型的思考轨迹——用于安全门禁、是否继续推理、是否升级模型，且不必离开 GPU。[14]

文中引用 TypeSafe 联合创始人 Diogo Almeida 的说法：他们更像数据研究实验室，绝大多数研究花在「真正通用」的合成数据上，并用 RLCD 做校准。[14][4] 护城河是否足够，取决于这些数据与训练过程是否难复制，以及公开评测之外、真实任务上的 jaggedness（能力锯齿）是否可接受。[14][5]

对 Claude Code 用户而言，短期结论更务实，不必先押注护城河叙事：

1. **先接 skill**，让智能体学会正确批处理问题，并会去查 `.md` 文档入口。
2. **再挑一个痛点钩子**（危险命令或上下文膨胀），确认 fail-open。
3. **路由放到账单已经大到可测量之后**；先能对比「总费用 / 成功率 / 完成时间」，再谈档位分布。
4. 算术、日期、计数等锯齿区，继续放在你自己的代码里。[3][5]

LangChain 的中间件示例也提示了同一优先级：先把判断嵌进编排层（路由中间件、Auto Mode 门禁），而不是幻想 CLI 背后换掉生成模型。[6]


## 把 skill 真正用起来：一次可核对的最小实验

装上 skill 之后，很多人会问「怎么知道它有用」。一个不依赖口号的最小实验是：

1. 准备一份真实一点的 `state`：例如失败的 CI 日志摘要、一条带情绪的工单、或一次可疑的 shell 命令说明。不要用只有十个词的玩具句。
2. 让 agent **在同一次 TypeSafe 调用里**同时问：是否紧急（`noul`）、主请求类型（`choice`）、挫败程度（`score`）。这三种原语的返回形状不同：Noul 给「是」的概率；Choice 给选项与分布；Score 给等级上的位置与分布。[5]
3. 在代码里用阈值组合答案，而不是让模型用自然语言「综合建议」。官方 primitives 文档的核心主张正是：复杂判断拆成小问题，权重放在你的代码里。[5]
4. 再故意做一次对照：把同样三个问题拆成三次请求。观察的是延迟与费用数量级，不是答案措辞——厂商示例报告过约 10× 量级差异，你自己的结果应以你的 key、区域与模型版本为准。[3][5]

LangChain 的 `TypeSafeClassifier` 也走同一契约：`.invoke()` 返回分类结果，不是聊天消息。[6]

```python
from langchain_typesafe import Noul, TypeSafeClassifier

classifier = TypeSafeClassifier()
response = classifier.invoke({
    "state": (
        "The deploy failed twice and customers are seeing 500s. "
        "Can someone look now?"
    ),
    "questions": {
        "urgent": Noul(instructions="Does this need attention right now?"),
    },
})
urgency = response.nouls["urgent"].noul
```

若你的目标是编码编排层，而不是单独脚本，可以把同样判断嵌进中间件：`ModelRouterMiddleware` 按最新用户消息选档；`AutoModeMiddleware` 在工具执行前拦风险调用。[6] 这和 Claude Code 社区钩子是同一设计家族，只是挂载点从 CLI hook 换成了 LangChain middleware。

## 压缩、裁剪与「完成」核对：边界钩子还能做什么

除了危险命令门禁，边界层还有三类高频痛点，APIMaster 的目录把它们列得很清楚：[3]

- **会话压缩**：`fast-jev-compaction` 之类插件用逐条 keep/drop 判断，替换「整段摘要式压缩」。高星不代表你可以直接上生产，但模式本身值得理解——压缩决策是分类，不是续写。[3]
- **终端输出裁剪**：长 Bash 输出进上下文之前，先判断哪些片段对当前任务仍有用。省的是上下文窗口与后续生成，不是「让模型更聪明」。[3]
- **Stop / 完成核对**：会话声称 done 时，对照 transcript、改动文件与检查结果，问一组「是否真完成」问题。好的实现会限制触发条件，并在错误时 fail-open，避免把收尾钩子变成新的单点故障。[3]

社区还有一次性打包钩子、路由 skill 与 PreToolUse 的安装器（例如 `jev-use`）。它支持 `TYPESAFE_API_KEY` / `OPENROUTER_API_KEY` / `AI_GATEWAY_API_KEY`，并提供 `JEV_BACKEND=mock` 做无密钥干跑，用来确认钩子是否挂在你期望的位置。[3] 干跑不能证明判断质量，但能证明接线。

选型建议仍然按痛点，而不是按星标：

1. 长会话烧钱 → 先看压缩 / 裁剪。
2. 不放心 shell → 先看 PreToolUse 门禁。
3. 经常「做完了其实没做完」→ 先看 stop hook。
4. 都想要、又愿意接受更大改动面 → 再考虑打包安装器或路由代理。

## 路由装好后如何核对（不要只看模型名）

`jev-router` 装上后，最容易误判成功的方式是：看到模型选择器里有「Jev Router」就以为省到了钱。更靠谱的核对顺序是：[11]

1. 用 `jev-claude` 或 `jev-codex` 启动，确认仍能复用现有登录，不必另配 Anthropic / OpenAI API key。
2. 发一条明显简单的请求（例如「what is 2+2?」）和一条明显困难的请求，观察状态行 / commentary 是否给出不同档位；在 Claude 侧可用 `/jev-explain`，Codex 侧可用 `$jev-explain` 查看最近一次路由的因素拆解。[11]
3. 手动在 `/model` 里选一个具体模型，确认路由暂停；再选回 Jev Router，确认恢复。
4. 人为去掉或写错 `JEV_API_KEY`，确认 CLI **不会卡死**，而是 fail-open 到当前模型，并在 commentary / 日志里给出可理解的提示。[11]
5. 退出启动器后，确认普通 `claude` / `codex` 的默认模型被恢复，没有被永久改写。[11]

还要记住一项隐私边界：用户提示文本会发给 TypeSafe 做路由决策；仓库声明不会转发其他内容。团队环境里这需要进数据分级讨论，而不是事后才发现。[11]

## 机制对照：厂商产品能力 vs 本地读取 logits

把 TypeSafe 官方介绍、Arcturus 技术读法与 NobodyWho 演示放在一张对照表里，有助于避免「功能表面上像，产品承诺就一样」：

| 维度 | TypeSafe Jev（厂商材料） | 25 行本地读取 logits |
| --- | --- | --- |
| 接口 | `state` + typed `questions` → typed `answers` | 自写 prompt + 读选项 token |
| 输出约束 | 产品侧保证落在你给的选项/等级内 | 取决于你是否约束/检查分布覆盖 |
| 多问 | 同请求并行评估，追加问题几乎不增加端到端等待时间 | 可以做，但 25 行 demos 通常只演示单问 |
| 校准 | 宣称 RLCD + 合成数据训练；confidence 由分布统计得到 | 未校准；HN 讨论强调过神经网过度自信 |
| 成本模型 | 文档价约 $0.042 / MTok input，output 计为免费 | 本地算力与模型体量 |
| 你获得的 | 工作流评测叙事、SDK、skill、企业合同边界 | 机制直觉与可本地调试的玩具 |

厂商对更强主张也写了限定：首页量级加速/降本来自特定 workflow evals，且偏乐观端；公开材料不足以让外人完整复现训练栈。[4] 这不是要你「不信」，而是要你把信的对象换成**自己的任务集**。



## 和站内场景文配对阅读时怎么用

实务上我建议这样读两篇：先用场景文判断「这个判断该不该存在」——错误代价、样本、阈值、人工回退是否想清楚；再用本文判断「编码 agent 上该挂哪一层」——skill 纠正写法，钩子守边界，MCP 暴露工具，路由选档位。顺序反了，很容易装上一堆插件，却说不清成功标准。[2][3]

团队分工也可以按这两篇切开：业务 / 产品方盯场景文里的验收顺序；平台 / 工具链方盯本文的安装、fail-open 与数据边界。两边共用同一条纪律：没有自己的任务集，就不把厂商数字或社区星标写成结论。

## 小结

「Jev 让 Claude Code 快 10 倍」这个口号，真正成立的部分通常不是「换底层模型」，而是：**把回路里大量琐碎判断从慢速生成中拆出去**。官方 skill、边界钩子、MCP、按轮路由，是目前可核的四条路。25 行最小实现帮你看清机制；OpenAI 跟进叙事提醒你，产品窗口可能不长，所以更要把价值锚在自己的工作流评测上，而不是锚在口号或星标上。

若你还没读场景文，建议配对阅读：[Jev 的使用前景与具体场景](/cn/blog/typesafe-jev-use-cases/) 负责「判断用在何处」；本文负责「编码 agent 如何接入、如何理解机制与竞争压力」。

## 参考来源

1. [Jay E | RoboNuggets：Jev will 10x your Claude Code（YouTube）][1]
2. [站内：Jev 的使用前景与具体场景][2]
3. [APIMaster：How to Use Jev in Claude Code and Codex][3]
4. [TypeSafe：Introducing System One Models & Jev][4]
5. [TypeSafe Docs：Primitives / Models][5]
6. [LangChain：Building a Harness with Jev][6]
7. [typesafe-ai/skills][7]
8. [TypeSafe Docs：Agent skill][8]
9. [shiftynick/jev-axi][9]
10. [jkudish/jev-mcp][10]
11. [gargpratyush/jev-router][11]
12. [NobodyWho：Jev in 25 lines of Python][12]
13. [HN 讨论：Jev in 25 Lines of Python][13]
14. [Arcturus Labs：Will OpenAI Eat Jev's Lunch?][14]

[1]: https://www.youtube.com/watch?v=tTnUcSj-QPA
[2]: https://redreamality.com/cn/blog/typesafe-jev-use-cases/
[3]: https://apimaster.ai/blog/jev-claude-code-codex
[4]: https://typesafe.ai/blog/introducing-system-one-models-and-jev
[5]: https://docs.typesafe.ai/primitives
[6]: https://www.langchain.com/blog/building-a-harness-with-jev
[7]: https://github.com/typesafe-ai/skills
[8]: https://docs.typesafe.ai/agent-skill
[9]: https://github.com/shiftynick/jev-axi
[10]: https://github.com/jkudish/jev-mcp
[11]: https://github.com/gargpratyush/jev-router
[12]: https://www.nobodywho.ai/posts/jev-in-25-lines/
[13]: https://news.ycombinator.com/item?id=49812769
[14]: https://arcturus-labs.com/blog/2026/09/21/will-openai-eat-jevs-lunch/
