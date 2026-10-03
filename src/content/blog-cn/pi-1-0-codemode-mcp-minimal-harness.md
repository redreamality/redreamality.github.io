---
title: "Pi 1.0：把 MCP 折进 Codemode 的最小 coding-agent harness"
description: "解读 Earendil Pi 1.0：用 QuickJS Codemode 沙箱组合/并行/过滤 MCP 与其它工具调用，并配合 deferred tools、virtual models、会话中途 system message——少工具面、可扩展控制面，而不是又一个功能堆满的 CLI。"
pubDate: 2026-10-03T10:40:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "developer-tools"]
lang: "zh"
---

Coding agent 这一年几乎每周都有新 CLI。多数发布帖的叙事很像：多挂几个模型、多塞几个内置模式、再加一层「更聪明」的默认工作流。Earendil 在 2026-10-01 发的 [Pi 1.0](https://earendil.com/posts/pi-1-0/) 走的是另一条路——他们反复强调 **最小、可扩展的 agent harness**：默认刻意不做 sub-agent、不做 plan mode，把「你想怎么用」留给扩展、skills、模板与包；1.0 真正写进核心的，是一套让 MCP 在小 harness 里说得通的控制面：**Codemode**（模型写一段在 QuickJS 沙箱里跑的 JavaScript，去组合、并行、过滤工具调用），再加上 deferred tool loading、virtual models、会话中途可改的 system message，以及 Anthropic 侧的 cache warming。[1][2]

HN 上 Pi 1.0 帖子互动很高（Algolia 检索可见约 **1645** 分 / **575** 评，抓取时间约 2026-10-03），但热度本身解释不了机制。更值得写的，是他们两天前那篇 *[You Said No MCP!](https://earendil.com/posts/you-said-no-mcp/)* 里坦白的转向：过去 pi.dev 上公开写过「不支持 MCP」，播客里也多次唱衰；现在 MCP 进了核心。原因不是「跟风协议」，而是他们发现：**要让现代模型的 deferred tools / mid-conversation system messages 用好，工具侧必须带足够的 exposure 元数据——而 Codemode 正好需要同一套元数据。** 把 MCP 收进核心，等于同时升级了 harness 的工具装载面。[3]

站内已经有一条 harness 深耕线：[Strands](/cn/blog/strands-harness-sdk-production-agent-runtime/) 谈把循环控制产品化成 SDK；[OpenShell / Sentry](/cn/blog/nvidia-open-agent-safety-openshell-sentry/) 谈把沙箱边界挪出 harness；[CIR](/cn/blog/cir-causal-evaluation-harness-recovery/) 谈恢复决策别只看平均成功率；[MoMHa](/cn/blog/momha-multi-objective-harness-accuracy-safety-tokens/) 与 [Grow the Harness](/cn/blog/grow-the-harness-not-the-context/) 分别谈多目标搜索与「先扩外围再堆上下文」。Pi 1.0 补的是另一块：**在「少默认功能」的前提下，如何用一个 JS 编排沙箱把 MCP 从「往上下文里倒工具描述」改成「可组合的 OpenAPI 式发现 + 结构化结果」。**[1][3]

下文按机制展开：先看最小 harness 的默认纪律与权限诚实声明；再顺着「You Said No MCP」复盘为什么 MCP 进核心；然后把 Codemode 的沙箱边界、工具发现与会话状态钉死；接着串起 deferred tools、virtual models 与 mid-conversation system message；最后给一张可迁移到自研栈的验收清单。数字与行为描述均来自官方博文与 pi.dev 文档，不外推未核对的星标或基准分。[1][2][3][5]

## 最小 harness，不是功能更少的玩具

Pi 官方自我定位写得很干净：*a minimal, extensible agent harness that you can make your own*。README 明确说：自带强默认，但**跳过** sub-agents 与 plan mode；你可以用扩展、skills、prompt templates、themes 定制，再打成 Pi packages 经 npm 或 git 分享。交互用法之外，还有 print / JSON 模式、RPC，以及 TypeScript SDK；OpenClaw 被点名为真实集成样例。[2]

这和「又一个 coding CLI」的差别，首先在**默认复杂度预算**。很多 agent 产品把「看起来全能」当成护城河：内置规划、子代理、记忆、浏览器、几十个快捷命令。Pi 的赌注相反——**核心保持可理解、可改写**；缺的东西让用户/扩展自己长出来，甚至「让 Pi 帮你写扩展」。1.0 发布帖把这件事说成纪律：agent 工具每周都在变，他们等到机制被证明站得住，才往核心里加；墙上贴过、又掉下来的想法比留下的多。[1][2]

1.0 写入核心的清单也值得按「控制面 vs 表面功能」拆开看：[1]

- **Codemode**：原生支持 MCP，以及非 LLM 模型（分类器、图像模型等）；
- **virtual models 的扩展支持**：一次选择，按请求路由到不同物理模型；
- **deferred tool loading**：工具可以晚进上下文，而不是开局全量声明；
- **Anthropic 模型的 cache warming**；
- **mid-conversation system messages**：transcript 感知的 prompt / 工具变更；
- 新 TUI 主题、默认全屏等交互层改动。

同一天他们还拆出实验包 **Pi Durable**（`@earendil-works/pi-durable` 等）：面向更长跑、更多入口的 agent 应用，刻意不把「耐久会话」硬塞进最小 CLI 核心。这是产品上的拆分，不是营销话术——最小根保持，另开一条实验枝。[1]

权限边界同样诚实：Pi **没有**内置限制文件系统 / 进程 / 网络 / 凭证的权限系统，默认继承启动它的用户与进程权限。需要更强边界时，文档指向容器化与沙箱模式（Gondolin 微 VM、纯 Docker、以及 OpenShell）。这和站内 [OpenShell](/cn/blog/nvidia-open-agent-safety-openshell-sentry/) 的叙事是对齐的：**编排 harness 与强制沙箱可以分属不同信任域**；Codemode 再强，也不等于进程隔离。[2][4]

## 为什么 MCP 从「不进核心」变成「必须进核心」

*[You Said No MCP!](https://earendil.com/posts/you-said-no-mcp/)* 的论证顺序很清楚。[3]

第一，世界变了。今天的 MCP 不是一年前的 MCP；但这还不够构成「进核心」的理由——Pi 本来就有扩展生态，MCP 完全可以、而且曾经就是扩展。

第二，真正推动进核心的，是 **MCP 所需的改动，对 Pi 自己也有用**。他们写：Pi 需要的东西与 MCP 需要的东西很像——一个可玩的解释器沙箱。同一套改动也让非 LLM 分类器之类模型更容易在 Pi 里用上（官方举例里出现过分类器；本文不把它写成专题）。

第三，MCP 仍有硬伤：**难组合（compose）**。即便有 Codemode 这种「小沙箱来组合工具调用」，很多 MCP server 仍按「把工具描述倒进上下文、用文本换 token」的旧 harness 习惯来建：返回文本、为 token 效率在 server 侧做妥协。Earendil 的目标图景更接近 **带智能发现的 OpenAPI**：工具返回结构化数据，靠文档与描述可发现。CLI 之所以好用，是因为 agent 能用 bash 把管道拼起来；他们问的是——**为什么 MCP 不能同样被拼？** Pi 的答案是：把工具暴露给 JavaScript 沙箱，让模型写脚本编排（文中也提到其它 harness 如 Codex 有类似思路）。[3]

第四，也是最关键的工程点：**为什么不「只做 Codemode、MCP 继续当扩展」？** 因为现代模型已经支持 deferred tool loading、会话中途 system message、推理档位变更；Pi 最近几个月在模型侧跟上了这些能力，但工具装载面还没升级到能吃满它们。在 Codemode 世界里，你必须能声明：某个工具是给 LLM 直接看的，还是**只给 Codemode 脚本调用**。普通 MCP 扩展拿不到足够的 tool loadout 元数据，体验做不圆。于是他们把「可 deferred / 可 Codemode-only」写进核心工具模型，并顺势把 MCP 一齐收进来——既解决自己的装载问题，也想参与塑造「小 harness 友好的 MCP 用法」，而不是站在场外继续唱衰。[3]

读到这里，Pi 1.0 的主张就清楚了：**不是「终于支持 MCP」的功能勾选，而是「用 Codemode + exposure 元数据，把 MCP 从上下文垃圾堆里捞出来」。**

## Codemode：跑在 harness 侧的编排沙箱

官方 Codemode 文档把机制写得很硬核，值得逐条对齐。[5]

**输入不是 JSON 参数表，而是一段原始 JavaScript 源码**（不是 markdown 代码围栏）。它作为 async 函数体在 **QuickJS** 沙箱里执行，因此顶层 `await` 与 `return` 可用。沙箱**没有** Node API、文件系统、网络、定时器；脚本接触外部的唯一通道是 `tools` 与 `models`。可选首行 `// @options: {...}` 可设 `max_output_tokens`（默认 10000）与硬超时 `timeout_ms`。[5]

**为什么说它是编排层，而不是又一个 bash 工具？** *[You Said No MCP!](https://earendil.com/posts/you-said-no-mcp/)* 区分了两类执行位置：工具常常跑在「不太受信」的沙箱里；agent loop 跑在相对受信的 harness 环境。Codemode **特殊在于它跑在 harness 这一侧**：用来协调工具调用的顺序、并行与合并，状态也进入 **session transcript**（而不是散落在文件系统）。语言选 JavaScript，是因为可嵌入的小型 JS（含 WASM 形态）更容易做隔离与分发。[3][5]

脚本侧的关键全局量包括：[5]

- `tools.<name>(args)`：调用会话里可调用的工具；MCP 名里的非法标识符字符会变成 `_`（例如 `mcp__dev-radius__search` → `tools.mcp__dev_radius__search`）；
- `text` / `image` / `console` / `return` / `exit`：控制回给模型的输出；
- `store` / `load`：跨多次 Codemode 调用保存小型 JSON（成功脚本才写入；值进 transcript 的 `codemode-store` 自定义条目，分支可见性跟着会话树走）；
- `ALL_TOOLS`、`searchTools`、`describeTool`、`describeNamespace`：在描述预算不够时做工具发现；
- `models`：列出并运行**非 LLM**模型（分类器、图像生成等）；聊天模型可列出但不可在脚本里跑。

有几条边界对写 harness 的人特别要紧：[5]

1. **只有脚本输出进模型上下文。** 中间可以并行打几十上百次工具，再过滤、聚合，模型只看见压缩结果——这直接打在「MCP 吃 token」的痛点上。
2. **`codemode.mode`：`on`（默认）还是 `only`。** `on` 时其它工具仍可对模型声明，但描述会引导「从脚本调用」；`only` 时其它工具对模型隐藏，只出现在 Codemode 描述里——模型被迫走脚本编排。
3. **deferred / Codemode exposure 的工具默认不塞进 Codemode 描述列表**，靠 `searchTools` 等发现，从而在 MCP server 陆续连上时保持描述稳定；内联声明有约 **3000** token 的预算（`codemode.inlineBudget`）。
4. **失败语义：** 失败脚本保留部分输出；失败前已发生的真实工具调用**不会回滚**；脚本结束时仍在跑的调用会被取消。
5. **资源上限：** VM 内存 **256 MB**；输出与调用次数有硬顶；不能嵌套启动另一个 Codemode；无定时器时，永远等不到的 promise 会立即失败。

官方举例里有一段「用 Codemode 拉 Linear 议题 + 分类器打情绪标签、四路 worker 并行」的会话回放：大量工具调用发生在沙箱内，模型最终只拿到计数与 flagged 列表，中间结果还可 `store` 供后续深挖。[3][5] 你不必关心例子里用了哪家分类器——机制上重要的是：**编排逻辑从「多轮自然语言 tool call」下沉成「一次脚本 + 并行 Promise」**，上下文与延迟画像完全不同。

Pi 在配置了 MCP 时会自动加载 Codemode，也可以把它加进默认工具；文档甚至鼓励「让 Pi 自己改配置打开 Codemode」。[3]

## Deferred tools、virtual models、会话中途改 prompt：同一张控制面

Codemode 不是孤立功能。1.0 一起推出的几块，共同回答：**工具与模型装载如何跟上「现代 LLM API」**。[1][6][7]

### 工具 exposure：谁看得见、谁调得着

扩展文档把 `exposure` 写成五种语义（与 MCP tool annotations 的 hint 体系并列）：[6]

| exposure | 含义（摘要） |
| --- | --- |
| `direct`（默认） | 激活时对模型声明，且可调用 |
| `model-only` | 对模型声明，但不可被其它工具/`executeTool` 调用（适合「编排型」门面工具） |
| `codemode` | 注册即可被 Codemode 调用并列入其列表；除非显式激活，否则不对模型声明 |
| `deferred` | 类似 `codemode`，但连 Codemode 列表也不进；靠 `tool_search` 发现并激活 |
| `hidden` | 注册但不可达（用来撤回） |

命名空间（`namespace`）把一组工具（典型是一个 MCP server）收成一块：Codemode 描述里按命名空间标题列出；更长的用法说明放在 `instructions`，脚本用 `describeNamespace` 读取。[6]

这套表解决的正是「Codemode 世界」的元数据缺口：**同一个物理工具，可以只对脚本可见、或延迟发现、或只当模型侧门面。** MCP 进核心，是因为否则扩展层拼不出稳定体验。[3][6]

动态激活路径也很明确：先全部 `registerTool`，可选工具保持未激活，再用 loader / `tool_search` / `pi.setActiveTools()` 挑选。Pi 把初始 prompt 与工具集记在 transcript 的**第一条** system message，之后在下次模型请求前**追加**工具与 prompt 变更；若 provider 表达不了这种增量，就会落到完整 transcript checkpoint——可能打掉 prompt cache 前缀。这就是「mid-conversation system messages」在工程上的落点：变更可回放、可分支，而不是偷偷改全局单例。[6][7]

### Virtual models：选择与派发拆开

Virtual model 是用户可选的「逻辑模型」，每次请求由 `route(request, ctx)` 映射到物理模型 + thinking level。例如发布帖演示：扩展写出 `router/auto`，规划走强模型、实现走另一家，分类器辅助判断何时切换；`/session` 能按物理模型拆成本与缓存。[1][8]

文档强调两套账要分开：选择（virtual）记在 `model_change` / thinking 变更；派发（physical）写在每条 assistant message 上。续跑与重试默认 sticky 在上一物理模型，是为了保住 prompt cache 与 thinking signature；用户新消息才允许换路由。Router 还可返回可序列化的 `state`（如 `plan` / `build` 阶段），跟着会话树走，压缩后仍在。[8]

对 harness 设计者，这比「在 system prompt 里写：简单题用小模型」靠谱：路由是**可测试的函数**，有 reason（`user` / `continuation` / `retry` / `direct`）、失败上下文、以及显式状态，而不是又一坨自然语言约定。

### 和「堆上下文」路线的对照

站内 [Grow the Harness](/cn/blog/grow-the-harness-not-the-context/) 主张：反复出现的控制先沉成外围代码，而不是无限加长 prompt。[Exactly-once 工具契约](/cn/blog/exactly-once-model-harness-tool-contract/) 谈模型—harness—工具之间的语义边界。[Claude Code harness](/cn/blog/inside-claude-code-agent-harness/) 拆过生产循环的多层结构。Pi 的 Codemode 属于同一光谱上的「外围下沉」：**把组合逻辑从多轮聊天挪进沙箱脚本**；deferred / virtual model 则是装载与路由层的下沉。MCP 旧用法（开局 dump 全量工具）几乎是反面教材——官方自己也批评许多 server 仍为这种 harness 优化。[3][5]

## 组合问题：bash 管道 vs MCP 脚本

把「难组合」说具体一点。传统 CLI 世界里，agent 写的是：

```bash
gh issue list --json number,title,body \
  | jq '.[0:20]' \
  | somewhere_classify \
  | jq 'map(select(.frustration != "none"))'
```

中间结果可以很大，但模型上下文里通常只留下最后一截——**管道本身就是过滤器**。MCP 旧用法经常变成：模型看见 30 个工具 schema → 一轮 call 拿回一大段文本 → 再一轮 call → 文本继续堆进 transcript。token 与注意力都被中间结果占满；并行也难，因为「下一轮」天然串行。[3]

Codemode 把管道搬进 JS：`Promise.all` 四路拉评论、本地聚合、`store` 缓存、最后 `return` 一张小表。官方文档还强调：带 `outputSchema` 的工具对脚本返回 `structuredContent`，对模型仍可给文本 `content`——同一工具，对人（模型）与对程序（脚本）两条通道。[5][6] 这正是他们说的「更接近 OpenAPI」：发现靠描述与文档，消费靠结构，而不是靠「把一切序列化成给 LLM 读的段落」。[3]

还有一层容易忽略的细节：**Codemode 描述里列出的工具声明共享约 3000 token 预算**；预算外的靠 `searchTools`（BM25，默认 limit 8）、`describeTool`、`describeNamespace` 或过滤 `ALL_TOOLS`。也就是说，MCP server 变多时，默认策略不是「描述越来越长」，而是「热路径内联 + 冷路径搜索」。这和「开局 dump 全量工具」是两种完全不同的缩放曲线。[5]

`store` / `load` 的会话语义也值得单独记一笔：写入只在脚本**成功**时提交；每个成功脚本把变更追加为 transcript 里的 `codemode-store` 自定义条目；恢复会话能带回这些值；分支只看见自己路径上写过的键。单值 JSON 上限、总值上限都有硬顶，图像数据明确禁止塞进 store——大块应写文件工具或用 `image()` 展示。这等于把「脚本侧小型工作记忆」做成了**可回放、可分支**的 harness 状态，而不是藏在 `/tmp` 里的隐式缓存。[5]

## Pi Durable：最小核心旁的长跑实验枝

1.0 同日推出的 Pi Durable，官方定位是实验包：把 Pi 的最小主义与「超可塑性」伸到更长跑、更多入口的 agent 应用，而不是把耐久会话硬塞进 coding CLI。安装面是 `@earendil-works/pi-durable` 与 `pi-ai`、`chord` 等；MIT。发布帖把动机说成：很多人想在终端之外的表面使用 Pi，需要可达性与更长任务；他们选择**另开包**，而不是稀释核心。[1]

对读者，这条拆分本身就是 harness 产品课：当需求形状变了（长跑、多表面），你可以：

- **改核心默认**——风险是失去「仍像 Pi」的简单感；
- **或开平行实验枝**——核心继续服务每日 coding loop，实验枝验证耐久运行时。

Earendil 选了后者。若你的团队正在把「聊天 coding agent」扭成「常驻自动化」，对照 Pi Durable 的拆法，比争论「要不要在同一二进制里加 scheduler」更有用。[1]

## 和站内其它 harness 文怎么对表

再补一层坐标系，避免读成发版软文：

- **[Strands](/cn/blog/strands-harness-sdk-production-agent-runtime/)**：显式产品化循环（上下文、会话、工具闸门），强调可安装 SDK 与成本主张。Pi 更强调核心克制与用户侧扩展；两者都承认「循环控制面」是一等公民，只是交付物形状不同。
- **[OpenShell / Sentry](/cn/blog/nvidia-open-agent-safety-openshell-sentry/)**：策略执行移出 harness 信任域。Pi README 直接把 OpenShell 列为容器化选项之一——说明他们不把「Codemode 沙箱」误宣传成「进程隔离」。[2][4]
- **[CIR](/cn/blog/cir-causal-evaluation-harness-recovery/)**：恢复要不要做，用配对因果评。Codemode 改变的是工具编排路径；若你在 Codemode 脚本里加「失败就再查一遍」，CIR 的教训仍然适用——别用平均成功率掩盖 clean 轨迹上的伤害。
- **[Grow the Harness](/cn/blog/grow-the-harness-not-the-context/) / [MoMHa](/cn/blog/momha-multi-objective-harness-accuracy-safety-tokens/)**：先扩外围控制、目标别压成单一标量。Codemode、virtual model、deferred tools 都是外围控制；token、准确率、安全仍可能冲突——尤其当你把 `codemode.mode` 打成 `only`、强迫一切走脚本时，延迟与失败模式都会变。
- **[Claude Code harness](/cn/blog/inside-claude-code-agent-harness/) / [Exactly-once 契约](/cn/blog/exactly-once-model-harness-tool-contract/)**：生产循环分层与工具语义边界。Pi 的 exposure 表与「失败前调用不回滚」是同一类边界问题的具体实现。[5][6]

Claude Code 产品侧还有 Mods / Plugins / Projects 一类「可组合 harness」讨论（例如 Latent Space 对 Thariq 的访谈方向），那是另一条「产品能力如何模块化」的线；本文不以未发站内长文为前提做对照，只提醒：模块化可以发生在产品插件层，也可以发生在 Pi 这种「极小核心 + 脚本编排」层——问题形状相近，答案不必相同。

## 少工具面 + 可扩展控制面：和「又一个 CLI」差在哪

可以用一张对照表把主张钉死：

| 维度 | 常见「全能 CLI」叙事 | Pi 1.0 叙事（据官方） |
| --- | --- | --- |
| 默认功能 | 规划 / 子代理 / 多模式尽量内置 | 跳过 sub-agent、plan mode；用扩展长出来 [2] |
| MCP | 工具描述倒进上下文，模型逐个 call | Codemode 脚本组合；结构化结果 + 发现 API [3][5] |
| 工具可见性 | 大多始终对模型可见 | `direct` / `codemode` / `deferred` 等 exposure [6] |
| 多模型 | 手动 `/model` 或 prompt 约定 | virtual model 按请求路由，sticky 保 cache [1][8] |
| 会话变更 | 重启或覆盖整段 system prompt | mid-conversation system message 追加/替换可回放 [6][7] |
| 安全边界 | 常与 harness 同进程「软提示」 | 明确：无内置权限系统；请容器化 / OpenShell 等 [2] |

[Strands](/cn/blog/strands-harness-sdk-production-agent-runtime/) 走的是「把循环控制做成可安装 SDK / 产品」；Pi 走的是「极小核心 + 超可塑扩展」。两者不互斥：一个强调交付物与默认成本主张，一个强调核心可理解与用户侧二次开发。选型时问的应是：你的团队更需要**开箱一致的工厂函数**，还是**可改写的最小控制面**？[1][2]

安全上再钉一句：Codemode 跑在 harness 侧、能编排真实工具，意味着**脚本能力接近 harness 信任级**。文档写沙箱无 Node/网络，但 `tools.*` 一旦包含 bash、写文件、MCP 写操作，危害面仍在。Pi 自己承认默认无权限闸门；若你的威胁模型要求策略外置，应把 Pi 放进 [OpenShell](/cn/blog/nvidia-open-agent-safety-openshell-sentry/) 一类边界，而不是指望 QuickJS  alone。[2][4][5]

## 给 harness 作者的落地清单

不写安装教程复读，只收可迁移的设计检查项（对照官方行为，便于你在自研栈里验收）：

1. **先定工具 exposure 矩阵。** 每个工具标清：模型直接可见？仅脚本可调？延迟发现？门面（model-only）？没有这张表，就做不出 Codemode，也做不好 deferred loading。[6]
2. **编排层与执行层分信任域。** 明确「组合逻辑」跑在哪一侧、状态进 transcript 还是进磁盘；不要把编排脚本默认扔进与不可信工具同一沙箱，也不要把受信 harness 当成「已经隔离」。[3][5]
3. **默认假设：MCP 返回应结构化。** 文本大包适合给人看，不适合脚本过滤；推动 server 提供 schema / `structuredContent`，脚本侧用 `Promise.all` / `allSettled` 做并行与部分失败。[3][5][6]
4. **描述预算当一等公民。** 内联工具声明有 token 顶；其余走 search / describe。MCP 连接抖动时，描述文本不应跟着抖。[5]
5. **会话变更必须可回放。** prompt 段落增删、工具加卸载，写成 transcript 里的 system / 变更条目；provider 不支持增量时，接受 cache 失效并记账——别静默改内存。[6][7]
6. **多模型路由写成函数，不写咒语。** virtual model 的 `reason` / sticky / `state` 比「请自行判断用哪个模型」可测。[8]
7. **失败与部分执行要有语义。** Codemode「前半成功不回滚」是现实；你的 harness 若假装事务，会在 MCP 写操作上撒谎。[5]
8. **权限另开一层。** 最小 harness 可以不内置权限系统，但文档与部署清单必须写清：谁负责容器 / 策略 runtime；对照 OpenShell 外置边界。[2][4]
9. **用输出过滤证明「省上下文」。** 验收脚本：同任务对比「逐轮 tool call 全量回灌」vs「Codemode 只回摘要」的 token 与正确率，而不是只看演示是否炫。[5]
10. **扩展与核心的边界纪律。** 问一句 Earendil 问过的：这件事该进核心，还是该当扩展？进核心的判据应是「解锁一类控制面元数据」，不是「热度高」。[1][3]

## 什么时候不该照搬 Pi

机制值得学，默认值不必神化。几个反例场景：

- **强合规、强审计的企业环境。** Pi 默认无内置权限闸门；你若不能接受「继承启动用户权限 + 另配容器」，先解决部署边界，再谈 Codemode 编排收益。[2]
- **工具几乎都是只读、数量极少。** 开局 dump 三五个工具可能更简单；Codemode 的收益出现在「工具多、结果大、需要并行过滤」时。[3][5]
- **团队不会写（也不想维护）扩展与脚本约定。** Pi 的可塑性建立在「有人愿意改配置 / 写扩展」上；若组织只想要一条不可改的官方工作流，Strands 一类「装上就能跑的 harness 产品」可能更合适。[1][2]
- **把分类器路由当银弹。** Virtual model 可以在路由里调用分类器，但每次路由前的额外模型调用会抬高首 token 延迟；官方文档也承认这一点。路由策略要测 cache 命中与切换频率，而不是演示一次「自动换模型」就当完成。[8]

一句话：学的是**控制面形状**（exposure、编排沙箱、可回放变更、选择/派发拆开），不是学「必须装同一个 CLI」。

## 读完可以带走什么

1. **Pi 1.0 的新闻点不是「又一个 coding CLI 发版」，而是最小 harness 把 MCP 折进 Codemode。** 模型写 JS，在 QuickJS 里组合 / 并行 / 过滤工具；只有脚本输出进上下文。[1][5]
2. **MCP 进核心，是因为 deferred tools 与 mid-conversation system messages 需要 exposure 元数据；Codemode 也需要同一套元数据。** 「只做 Codemode、MCP 继续当扩展」在他们看来体验做不圆。[3][6]
3. **Codemode 跑在 harness 侧，状态进 transcript。** 它是编排协调层，不是普通 bash 替代品；同时意味着信任级接近 harness，必须另配进程/策略边界。[3][2][5]
4. **Virtual models、deferred loading、可回放的 system message 变更，与 Codemode 同属一张控制面。** 共同目标是：少默认功能、多可组合装载，而不是开局把工具与模型策略堆进 prompt。[1][6][8]
5. **对照站内其它 harness 文：Strands 偏产品化循环 SDK；OpenShell 偏沙箱外置；CIR / MoMHa / Grow the Harness 偏评测与外围扩张。** Pi 偏「小核心 + JS 编排沙箱」——选型时看你的团队缺的是交付物、隔离，还是可改写的最小控制面。[1][2][4]

若你只带走一个验收问题，用这一句：**列出每个工具对「模型 / Codemode / tool_search」各自是否可见与可调；再问 MCP 结果是给模型读的大段文本，还是给脚本过滤的结构化数据——答不清这两问，就不该宣称自己「支持了现代 MCP」。**[3][5][6]

## 参考

[1] Earendil. *Pi 1.0.* 2026-10-01. https://earendil.com/posts/pi-1-0/

[2] earendil-works/pi. *README*（Pi：minimal, extensible agent harness；安装、包结构、权限与容器化说明）. https://github.com/earendil-works/pi

[3] Earendil Engineering. *“You Said No MCP!”* 2026-09-29. https://earendil.com/posts/you-said-no-mcp/

[4] 站内：[NVIDIA OpenShell / Sentry：把 agent 安全边界外移到 runtime](/cn/blog/nvidia-open-agent-safety-openshell-sentry/)

[5] Pi Documentation. *Codemode.* https://pi.dev/docs/latest/codemode

[6] Pi Documentation. *Extensions*（含 tool exposure、MCP 注册、动态激活与 mid-conversation 变更记录）. https://pi.dev/docs/latest/extensions

[7] Pi Documentation. *Message Types*（SystemMessage：后续 system 消息可增删 prompt 段落与工具）. https://pi.dev/docs/latest/message-types

[8] Pi Documentation. *Virtual Models.* https://pi.dev/docs/latest/virtual-models

[9] 站内对照：[Strands Harness SDK](/cn/blog/strands-harness-sdk-production-agent-runtime/)、[CIR](/cn/blog/cir-causal-evaluation-harness-recovery/)、[MoMHa](/cn/blog/momha-multi-objective-harness-accuracy-safety-tokens/)、[Grow the Harness](/cn/blog/grow-the-harness-not-the-context/)、[Claude Code Agent Harness](/cn/blog/inside-claude-code-agent-harness/)、[Exactly-once 工具契约](/cn/blog/exactly-once-model-harness-tool-contract/)
