---
title: "Claude Haiku 5.5 当 subagent 和压缩引擎，什么时候真省钱：一套能自己算的账"
description: "Haiku 5.5 标价 0.10/0.50 美元每百万 token，但提示超过 10 万 token 整条请求按 5 倍计价，新 tokenizer、默认开着的思考和缓存规则都会改账单。本文给出逐请求的成本公式，算三道题：40 万 token 会话压缩、单个 subagent 的三种形状、8 路扇出，再看 12 倍于 GPT-6 Luna 的反例，最后附一份按自己工作负载验收的清单。"
pubDate: 2026-10-10T16:40:00+08:00
author: "Remy"
tags: ["claude", "claude-code", "ai-agents", "agent-harness", "llm"]
lang: "zh"
---

10 月 7 日 Anthropic 发布了 Claude Haiku 5.5。价目表最显眼的一行是输入 0.10 美元、输出 0.50 美元每百万 token，比 Haiku 4.5 便宜九成；官方给它的定位也很直接：做摘要、上下文压缩（compaction）、分类，给 Opus 5.5 和 Sonnet 5.5 当编码 subagent。[1] 同一天，Sonnet 5.5 的缓存读取价格减半，Max 和 Team 订阅也多了每月 API 额度。[1]

这篇不复述发布会。我想回答一个更实际的问题：**把便宜的小模型放到 Opus / Sonnet 下面当 subagent、当压缩引擎，什么时候真能省钱，什么时候反而更贵？** 答案不在单价，而在四条计价规则、三种工作负载形状，以及主 agent 怎么消化小模型交回来的东西。下面先把规则讲清，然后写成公式，再用三道算例把数字摆出来，最后给一份可以拿去量自己工作负载的验收清单。

站内相关：[Claude Code 额度怎么算](/cn/blog/claude-code-usage-limits-cost-2026/)讲订阅、窗口和 API 额度从哪本账扣，本文只讲按 token 计费的账；[Sonnet 5.5 选型](/cn/blog/claude-sonnet-5-5-agentic-coding-midtier/)和 [Opus 5.5 价格与性能](/cn/blog/claude-opus-5-5-price-and-performance/)讲上面两层模型；[Coding Agent 烧钱的三种习惯](/cn/blog/coding-agents-cost-inefficient-behaviors/)讲 subagent 交回摘要后主 agent 又重读一遍的浪费；[默认硬预算帽](/cn/blog/default-hard-budget-caps-agent-deployed-services/)讲为什么超限要停而不是提醒。文中算例都是我按官方价目表算的，不是实测；标「判断」的是我的看法。

## 先看清四条会改账单的规则

### 规则一：按提示长度分两档，而且是整条请求一起涨

官方价目表（美元 / 百万 token，缓存按 5 分钟 TTL）：[1][2]

| 模型 | 缓存读 | 缓存写 | 输入 | 输出 |
| --- | --- | --- | --- | --- |
| Haiku 5.5（提示 ≤10 万 token） | 0.01 | 0.125 | 0.10 | 0.50 |
| Haiku 5.5（提示 >10 万 token） | 0.05 | 0.625 | 0.50 | 2.50 |
| Haiku 4.5 | 0.10 | 1.25 | 1.00 | 5.00 |
| Sonnet 5.5 | 0.10 | 2.50 | 2.00 | 10.00 |
| Opus 5.5 | 0.20 | 5.00 | 4.00 | 20.00 |

定价文档写得很细：判断是否超过 10 万 token 时，**缓存读和缓存写都算进提示长度**；每条请求单独计价，一旦超线，整条请求按高档付费，哪怕其中大部分是缓存命中；之前的请求不受影响。[2] 也就是说，这是一道悬崖，不是阶梯：第 99,999 个 token 和第 100,001 个 token 之间，这条请求的输出单价从 0.50 跳到 2.50。

Opus 5.5、Sonnet 5.5 没有这条线，1M 上下文全程同价。[2] Anthropic 在脚注里给了这条线的依据：Haiku 4.5 上约 90% 的请求提示不到 10 万 token。[1] 但 HN 上有人马上指出，过去没人拿 Haiku 4.5 跑 agent，这个 90% 说明的是旧用法，不是新用法。[11]

作为参照，OpenAI 的 GPT-6 Luna 标价同样是 0.10 / 0.50，缓存读 0.01；它的线在 27.2 万输入 token，超过后整条请求的输入和缓存价按 2 倍、输出按 1.5 倍计。[13] Simon Willison 的总结是：工作负载装得进 10 万 token，两者同价；装不进，Luna 便宜得多。[10]

### 规则二：新 tokenizer，同样的文字算出更多 token

Haiku 5.5 换成了和 Claude 4.7 及之后模型相同的 tokenizer。官方文档说，同样的文字在 Haiku 5.5 上大约比 Haiku 4.5 多出 30% 的 token，具体看内容。[3][4] Simon Willison 用自己的计数工具测了一段长提示，大约是 1.25 倍。[10]

这里有个容易搞混的地方：多出来的 30% 是**相对 Haiku 4.5**。Haiku 5.5 的 tokenizer 和 Opus 5.5、Sonnet 5.5 是同一类，所以把一个子任务从 Sonnet 5.5 挪到 Haiku 5.5，token 数基本不变，[1] 受影响的是三种人：

- **从 Haiku 4.5 迁移的人。** 你过去量出来的「8 万 token」，在 Haiku 5.5 上可能变成 10 万出头，正好跨线。按 1.3 倍折算，Haiku 5.5 的 10 万线只相当于旧计数的约 7.7 万。迁移指南也专门提醒：按 token 设的 `max_tokens`、上下文预算和成本估算都要重算，包括长提示的高档价。[4]
- **算同一段文字的实际单价。** 短提示：0.10 × 1.3 ≈ 0.13，比 Haiku 4.5 的 1.00 便宜约 87%；长提示：0.50 × 1.3 ≈ 0.65，只便宜约 35%（算例）。
- **跨厂商比价的人。** Claude 和 GPT 的 token 不能直接比。HN 上有人估计 Claude 的 10 万 token 约等于 GPT 的 6–6.5 万；另一位做分类任务的用户贴出，同一批活 Haiku 5.5 计了约 1189 万输入 token，Luna 约 790 万，约 1.5 倍。[11] 这两条都是社区数据，没有厂商口径，我只当作敏感性区间。

### 规则三：思考默认开着，而且按输出价计

Haiku 5.5 是第一款能调 effort 的 Haiku，档位有 low、medium、high、xhigh、max，API 默认 `medium`，自适应思考（adaptive thinking，模型自己决定每一步想不想、想多少）默认开启。[1][3] 这几条对账单影响最大：

- **思考 token 按输出价计**，并且算进 `max_tokens`；上限设得太小，可能想完就停，一个字答案都没有。[3]
- **能不能关，看你在哪调。** 走 API 时，effort 在 `high` 及以下可以用 `thinking: {"type": "disabled"}` 关掉，官方仍建议优先用 effort 调。[3] 在 Claude Code 里关不掉：文档写明 Opus 5.5、Sonnet 5.5、Haiku 5.5 和 Fable 都「Thinking can't be turned off」，`MAX_THINKING_TOKENS=0` 对它们无效。[5] Simon 用 llm 插件测时也说「不能关掉推理，默认 medium」。[10]
- **旧的思考块会留在上下文里。** Haiku 4.5 只保留最近一轮的思考块，Haiku 5.5 保留所有轮次的，并且算输入 token，所以多轮对话的输入会比 tokenizer 变化本身涨得更多；文档建议用 thinking block clearing 清掉旧块。[3] 这一条对多轮 subagent 很关键，后面的算例假设你已经清掉了。
- **effort 的价差很大。** Simon 用同一个画鹈鹕的提示：low 花了 0.0936 美分、7 秒；max 花了 3.3826 美分、5 分 9 秒，约 36 倍。[10]

### 规则四：缓存，以及同一天 Sonnet 5.5 的降价

Haiku 5.5 缓存读是输入价的一成（0.01 / 0.05），最小可缓存长度从 Haiku 4.5 的 4096 token 降到 512。[2][3] 同一天，Sonnet 5.5 的缓存读从 0.20 降到 0.10，Anthropic 说这让 Sonnet 5.5 在大多数 agentic 任务上便宜约 20%。[1] 这条降价看起来跟 Haiku 无关，其实直接削弱了「拿 Haiku 做压缩」的理由，算例一会看到。

## 官方基准说明了什么，没说明什么

Anthropic 发布页里和 subagent 最相关的三行（GPT-6 Luna 一列是 Anthropic 自己测的）：[1]

| 基准 | Haiku 5.5 | Haiku 4.5 | GPT-6 Luna | Sonnet 5.5 |
| --- | --- | --- | --- | --- |
| Terminal-Bench 4.0 | 39.2% | 0.0% | 16.4% | 70.6% |
| OSWorld 2.1（离线子集） | 72.4% | 15.7% | 48.9% | 83.9% |
| FrontierCode 1.1（Main） | 46.4% | — | 42.4% | 52.1%（xhigh） |

官方自己也划了边界：复杂的 agentic 编码任务，Sonnet 5.5 和 Opus 5.5 仍然更合适；Haiku 5.5 适合范围更窄、过去用 Claude 做太贵的活，比如压缩、摘要和 subagent。[1]

独立数据方面，Artificial Analysis 在 max effort 下测得：综合指数 Haiku 5.5 为 43、Luna 为 38，Terminal-Bench 4.0 是 33% 对 13%；但每个任务的成本是 0.21 美元对 0.07 美元，每任务输出 token 约 16.2 万对 5 万，其中推理 token 约 12.9 万对 3.9 万。[12] 每个 token 一样贵，不等于每个任务一样贵；小模型想得多，账单就跟着走。另据 developersdigest 转述，AA 的成本数字当时还没计入 10 万以上的高档价，如果属实，长任务的差距只会更大（未核实）。[15]

## 把账写成公式

一条请求的成本：

```text
C_req = L_cr × p_cr + L_cw × p_cw + L_in × p_in + (O_ans + O_think) × p_out
档位：L = L_cr + L_cw + L_in；Haiku 5.5 上 L > 100,000 时，四个单价全部换成高档
```

一个 agent 循环（第 i 轮读上一轮的前缀缓存，写入新的工具结果和上一轮输出）：

```text
C_loop = Σ_i C_req(i)，L_i = L_(i-1) + r_i + o_(i-1)
```

把 subagent 放进来，真正的总账是三项相加：

```text
C_total = Σ C_sub                       # 所有 subagent 自己的请求
        + N × R × p_cw(主) + N × R × p_cr(主) × M   # 交回的报告写进主 agent 上下文，再被后面 M 轮反复读
        + f × X × (p_cw(主) + p_cr(主) × M')        # 报告不够用时，主 agent 自己重读 X token 的比例 f
```

后两项按主 agent 的单价计。subagent 越便宜，后两项在总账里占的比重越大。下面三道题都按这几个式子算，脚本放在交接目录里，可以改参数自己跑。

## 算例一：压缩一段 40 万 token 的会话

假设主会话已经积累 40 万 token，需要压缩成一段摘要。摘要 8,000 token，模型思考 4,000 token（假设值），合计输出 1.2 万。

| 做法 | 计算 | 成本（美元） |
| --- | --- | --- |
| Sonnet 5.5 自己压，缓存还热 | 40 万 × 0.10 + 1.2 万 × 10 | 0.16 |
| Opus 5.5 自己压，缓存还热 | 40 万 × 0.20 + 1.2 万 × 20 | 0.32 |
| Sonnet 5.5，缓存已过期 | 40 万 × 2 + 1.2 万 × 10 | 0.92 |
| Opus 5.5，缓存已过期 | 40 万 × 4 + 1.2 万 × 20 | 1.84 |
| Haiku 5.5 一次读完（超线，高档） | 40 万 × 0.50 + 1.2 万 × 2.50 | 0.23 |
| Haiku 5.5 切 5 块各 8.2 万，再合并 | 5 × (8.2 万 × 0.10 + 5000 × 0.50) + 合并 | 0.061 |
| 参照：GPT-6 Luna 一次读完（超 27.2 万线） | 40 万 × 0.20 + 1.2 万 × 0.75 | 0.089 |

（每块输出 5,000 = 3,000 摘要 + 2,000 思考；合并一次读 1.7 万、输出 1.2 万。）

几个结论：

1. **缓存还热时，Haiku 一次读完反而比 Sonnet 5.5 贵。** 原因是 Haiku 高档输入价 0.50，是 Sonnet 缓存读 0.10 的 5 倍。临界点可以直接解出来：Haiku 高档比热缓存的 Sonnet 便宜，要求输出 O > 0.053 × 输入 N；对 40 万输入，摘要加思考要超过约 2.1 万 token。对热缓存的 Opus 5.5，临界点是 O > 0.017 × N，约 6,900 token，所以多数情况下 Haiku 便宜。
2. **缓存冷了，Haiku 才是明显的赢家。** 恢复一个隔夜的会话，Sonnet 要按全价重读 40 万，Haiku 一次读完是它的四分之一。
3. **真正便宜的是切块。** 每块控制在 10 万以下，留在低档，总价 0.06 美元左右，是热缓存 Sonnet 的约 38%。代价是质量风险：跨块的引用关系（比如前面定义的接口在后面被改）可能在切块摘要里丢掉，必须用自己的会话做回放测试。

还要分清工具。Claude Code 的 `/compact` 会带上和会话相同的系统提示、工具和历史发一个摘要请求，正是为了读到现成的缓存；[7] 文档里没有给压缩单独换模型的设置。所以「Haiku 当压缩引擎」主要是给你自己用 API 写的 harness 用的；在 Claude Code 的 Opus 会话里，压缩跟着会话模型走（判断，基于文档）。反过来，如果直接拿 Haiku 5.5 当主模型，要注意它在 Claude Code 里默认要到约 96.7 万 token 才自动压缩，`/autocompact` 能设的最小值是 10 万；[5] 即使设成 10 万，压缩那一次请求本身也会略超 10 万，按高档计（判断）。

## 算例二：同一个 subagent，三种形状

设定：每轮读上一轮的缓存前缀，新写入工具结果和上一轮输出（5 分钟缓存写价），旧思考块已清理。三种形状：

- **A 短任务**：起始提示 1.5 万（系统提示、工具定义、任务说明），12 轮，每轮新增 4,000 工具结果、输出 800（含思考）。最后提示 6.78 万。
- **B 重读型**：同样起点和轮数，但每轮读进 1 万 token 的文件或日志。最后提示 13.38 万，第 9 轮跨线。
- **C 长任务**：起始 2 万，30 轮，每轮新增 5,000、输出 1,000。最后提示 19.4 万，第 15 轮跨线。

| 形状 | Haiku 5.5 | Sonnet 5.5 | Opus 5.5 | GPT-6 Luna | Haiku 5.5，token ×1.3 |
| --- | --- | --- | --- | --- | --- |
| A 短任务 | 0.018 | 0.31 | 0.62 | 0.018 | 0.023 |
| B 重读型 | 0.074 | 0.51 | 1.01 | 0.029 | 0.12（第 7 轮跨线） |
| C 长任务 | 0.24 | 1.09 | 2.17 | 0.069 | 0.36（第 11 轮跨线） |

（单位美元；Luna 列假设两家 token 计数相同，实际 Claude 计数可能更多，见规则二；最后一列模拟「形状是用 Haiku 4.5 或其他厂商的计数量出来的」。）

怎么读这张表：

- **跟 Opus / Sonnet 当 subagent 比，Haiku 5.5 几乎总是省钱。** 短任务比 Opus 便宜约 35 倍，比 Sonnet 约 17 倍；就算跨线到高档，缓存读 0.05 仍是 Sonnet 的一半、输出 2.50 是 Sonnet 的四分之一。在这个对照下，10 万线不是能不能用的问题，只是省多少的问题。
- **跟 Luna 比，线以下打平，线以上 Luna 便宜 2.5–3.5 倍。** 形状 C 里 Luna 一直待在 27.2 万线以下，Haiku 后半程全在高档。
- **tokenizer 的 1.3 倍在跨线附近被放大。** 形状 B 的 token 只多了 30%，成本却多了 65%，因为跨线提前了两轮。

## 算例三：8 路扇出，钱到底花在哪

主 agent 是 Opus 5.5，派出 8 个形状 A 的 subagent 并行查资料，系统提示相同（第一个写缓存，后面七个假设都能读到；如果同时发出，后面的请求未必赶得上，判断）。每个 subagent 交回 2,000 token 的报告，主 agent 之后还要跑 20 轮。

| subagent 模型 | subagent 合计 | 报告在 Opus 上下文里的成本 | 总计 |
| --- | --- | --- | --- |
| Haiku 5.5 | 0.13 | 0.14 | 0.27 |
| Sonnet 5.5 | 2.22 | 0.14 | 2.36 |
| Opus 5.5（继承主模型） | 4.43 | 0.14 | 4.57 |

报告成本 = 8 × 2,000 × 5（写入）+ 8 × 2,000 × 0.20 × 20（后续每轮重读），单位按百万 token 折算。

这张表有两个结论。第一，**省下来的大头不是 Haiku 对 Luna，而是 Haiku 对「继承来的 Opus」**：同样的扇出，4.57 美元降到 0.27 美元。第二，**subagent 便宜到这个程度，主 agent 消化报告的成本就超过了 subagent 本身**：8 份报告在 Opus 上下文里花 0.14，比 8 个 Haiku subagent 加起来还多。再算一项：如果某份报告只写了「认证逻辑在 middleware 里」，主 agent 只好自己重读 3 万 token 的文件，写入加上之后 15 轮的重读，约 0.24 美元，一次就超过全部 8 个 Haiku subagent 的花费。

所以在主 agent 很贵的结构里，决定省不省钱的往往不是小模型的单价，而是**它交回来的东西够不够主 agent 直接用**：文件路径、行号、关键片段、未解决的问题，而不是一句结论。站内[那篇论文解读](/cn/blog/coding-agents-cost-inefficient-behaviors/)里，Claude Code 的跨 agent 重复检索就是这么来的。

## 盈亏平衡：小模型能承受多少返工

把三道题合起来，可以写成一个判断式。设候选小模型单次运行成本为 C_small，因为想得更多或计数更多，token 是基准的 k 倍；有 f_retry 的比例要重跑，有 f_fix 的比例要主 agent 出手补救，每次补救花 C_fix。换掉现有方案 C_base 能省钱的条件是：

```text
C_small × k × (1 + f_retry) + f_fix × C_fix < C_base
```

代入形状 A。对照「继承来的 Opus」（C_base = 0.62）：就算 Haiku 的 token 翻倍（k = 2）、三成要重跑，左边第一项也只有约 0.047，剩下 0.57 美元的余量，够主 agent 补救两次以上（每次按 0.24 计）。也就是说，对照贵的默认值，小模型要差到大面积交不了差才会亏。

对照同价的 Luna（C_base = 0.018）就完全反过来：k 只要大于 1，或者有一点点重跑，Haiku 就亏了。这时决定胜负的是你任务上的通过率和 token 用量，而不是谁的基准分高。

由此可以得到一个粗略的路由表（判断）：

| 任务形状 | 优先考虑 | 理由 |
| --- | --- | --- |
| 在 Claude harness 里、提示稳定在 10 万以下的查找 / 读代码 subagent | Haiku 5.5 | 对照继承的 Opus 省一个数量级，接口和工具格式与主模型一致 |
| 需要反复读大文件、历史会涨过 10 万的长任务 | 没有长度线的模型，或先切块 | 跨线后整条请求 5 倍 |
| 缓存还热的会话压缩 | 主模型自己压 | 热缓存读比 Haiku 高档输入便宜 |
| 冷会话或 Opus 主会话的压缩 | Haiku 5.5 切块 | 避开全价重读，也避开高档 |
| 分类、起标题、抽取 | 先在自己的数据上比 Haiku low 和同价模型 | 同价对手之间，只看通过率和 token 用量 |
| 需要多步判断的编码 | Sonnet 5.5 / Opus 5.5 | 官方自己也这么划界 |

## Claude Code 的默认值：subagent 并不默认用 Haiku

常见的说法是「Claude Code 从 v2.1.293 起把 subagent 默认换成 Haiku」，核对后这个说法不准确。v2.1.293 的更新日志写的是：加入 Haiku 5.5，它成为 Anthropic API 上的**默认 Haiku 模型**，也就是 `haiku` 这个别名指向它。[8] 模型配置文档也说，用 Haiku 5.5 需要 v2.1.293 以上。[5]

subagent 的模型按这个顺序决定：单次调用传入的 `model` 参数 → subagent 定义里的 `model` 字段 → 环境变量 `CLAUDE_CODE_SUBAGENT_MODEL` → 主会话的模型。[6] 内置的 Explore 用主会话的模型，Plan 继承主会话，general-purpose 在没设环境变量时也是主会话模型；只有回答 Claude Code 使用问题的 claude-code-guide 固定跑 Haiku。[6] 而 `default` 在 Pro、Max、Team、Enterprise 和 API 上都解析为 Opus 5.5。[5] HN 上也有人指出同一点：subagent 总是继承父模型，除非你专门改。[11]

要换，有三种做法：[6]

- 在 subagent 定义里写 `model: haiku`；想让 Explore 也换，就定义一个同名的 `Explore` 覆盖内置的。
- 设 `CLAUDE_CODE_SUBAGENT_MODEL=haiku`，它只是默认值，定义里写了 `model` 的仍按定义；想强制所有 subagent 都用它，再加 `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1`。
- subagent 定义里还可以写 `effort`，给它单独定思考强度。

另外两点：subagent 会继承主会话的思考设置；`haiku` 别名在 Bedrock、Google Cloud Agent Platform、Foundry 和 Claude Platform on AWS 上仍指向 Haiku 4.5。[5][6]

## 反方样本：它在哪些地方不省钱

**一、「比 Luna 贵 12 倍」。** r/ClaudeAI 上有帖子用同一个体素宝塔（voxel pagoda）任务比较，Haiku 5.5 在 xhigh 下用了 2.688 亿输入 token（其中 2.627 亿是缓存读）、446 万输出，折合 24.96 美元；Luna 约 1.91–1.96 美元。[14][15][16] Reddit 原帖我这边抓不到，数字来自两家转述。按价目表反推：全程在 10 万以下应是 2.627 亿 × 0.01 + 610 万 × 0.10 + 446 万 × 0.50 ≈ 5.47 美元；全程在高档应是 ≈ 27.34 美元。24.96 落在两者之间、靠近上限，说明这次会话很早就跨了线。可以拆成两个因子：同样的 token 留在低档也要约 5.47 美元，是 Luna 的约 2.9 倍，这是 token 用量的差距；跨线又乘了约 4.6 倍。这是一次创作任务，用的是 xhigh 而不是默认 medium，不能当通用比例，但它把两种风险叠在一起演示得很清楚。

**二、按任务算成本，Luna 更省。** 除了前面 AA 的 0.21 对 0.07，Plotly 在 HN 上贴的数据分析测试：40 道题 Haiku 5.5 花 0.38 美元，Opus 5.5 花 15 美元；但 GPT-6 Luna 答得稍好，成本约为 Haiku 的 30%。[11]

**三、为旧模型调好的提示，迁移后可能变差。** HN 上有用户说，他们为 Haiku 4.5 调好的低延迟任务，换到 5.5 后结果变差，出现提示泄漏，而且更慢；调高 effort 有改善，但速度又没了。[11] 这不是普遍结论，但说明迁移要重新评测，不能直接替换模型 ID。

**四、一个 DeepSeek 反例（只当样本，不展开）。** r/LocalLLaMA 上一位开发者用自己的两个线上任务比较 Haiku 5.5 和他正在用的 DeepSeek V4.1 Flash，用 Opus 做盲评、正反顺序各评一次，每个设置只跑一次。[17][18] 研究型 subagent（网页搜索、读页面、写带来源的报告）上，Haiku low 便宜约 4 倍（0.09 对 0.35 美元）、也更快，但输掉了同样两份任务，其中一份需要打开品牌官方规范页拿精确的 HEX / Pantone 色值，Haiku 在 high、60 次工具调用下也没找到那一页。给对话起标题的任务上（52 条消息、关闭思考），DeepSeek 28 胜、Haiku 8 胜、9 条各有千秋、7 条相同；Haiku 常常直接回答消息而不是起标题，一条注入测试消息甚至原样成了标题。[18] 原帖抓不到，以上来自摘要。我从中只取两点：研究型 subagent 最贵的失败是「没去打开一手来源」，便宜的单价会被返工吃掉；起标题、分类这种看似最简单的活，真正考的是指令遵循和抗注入，必须用自己的数据测。

## 订阅附带的 API 额度：免费的钱也要设帽

这周开始，Max 5x 每月 100 美元、Max 20x 每月 200 美元；Team 每个 Standard 席 20 美元、Premium 席 100 美元，全队合并，上限 500 美元。[9] 能用在 Messages API、Batches API、Console Playground、Managed Agents 和 Agent SDK；不能用在交互式 Claude Code 和各类额外用量上；不结转，先于自己买的额度扣；组织里没有其他余额时，API 请求直接停，不会扣到订阅上。[9]

两件和本文有关的事。第一，额度属于你关联的 Console 组织，组织里任何 API key 都从这里扣，[9] 所以第三方 harness 只要配的是这个组织的 key 就能用；官方页面没有点名第三方 harness，这是按「任何 API key」推出来的（判断，HN 评论也是这么理解的 [11]）。第二，Simon 提醒可以关掉自动充值，余额用完就停，不会有意外账单。[10] 拿这笔钱做 subagent 实验时，正好是[硬预算帽](/cn/blog/default-hard-budget-caps-agent-deployed-services/)的现成实现；团队还应该在 Console 里给不同项目设 workspace 花费上限，[9] 思路和 [Gemini Enterprise 那篇](/cn/blog/gemini-enterprise-agent-identity-audit-spend-caps/)讲的花费治理一致。

按算例二粗算：100 美元够跑约 5,700 次形状 A 的 Haiku subagent，或者约 415 次形状 C（算例）。差了十几倍：任务本身更长贡献约 4 倍，后半程跨线又贡献约 3.5 倍。

## 验收清单：用自己的工作负载量一遍

**一、按 subagent 拆 token 账**

- 每条请求记下 `input_tokens`、`cache_read_input_tokens`、`cache_creation_input_tokens`、`output_tokens`，并算出提示总长 L；统计 L 超过 10 万的请求占比，以及超线请求占总花费的比例。
- 用 `claude-haiku-5-5` 的 token 计数接口重新数一遍代表性提示，不要沿用 Haiku 4.5 或其他厂商的计数。[2][4]
- 在 Claude Code 里看 `/usage` 的 subagent 占比；脚本里用 `--output-format json` 的 `modelUsage` 确认每个 subagent 实际跑的模型。[5][19]

**二、effort 要扫一遍，不要沿用默认**

- 在自己的样本集上分别跑 low / medium / high，记录「每个完成任务的成本」和通过率，而不是每百万 token 的价格。
- 分类、路由、起标题这类活，走 API 时试试 effort 在 high 以下关掉思考；多轮 subagent 开启旧思考块清理。[3]
- `max_tokens` 要给思考留余量，检查空回复和截断，别把 HTTP 200 当作完成。[3]

**三、评测要包含失败方式**

- 用盲评对比候选模型，样本里放进「必须打开一手来源」「不许回答只许分类」「含注入文本」这类题。
- 量主 agent 拿到报告后的**重读率**：报告交回后，主 agent 又读了多少 subagent 读过的文件。重读率高，换便宜 subagent 就是假省钱。
- 从 Haiku 4.5 迁移的，去掉 `temperature`、`top_p`、`top_k` 和 assistant prefill，否则会报错。[3]

**四、缓存和长度控制**

- 看缓存命中率；把系统提示和工具定义放在稳定前缀里，512 token 以上就能缓存。[3]
- 给 subagent 设上下文上限：快到 10 万就压缩或重开，或者把注定超长的任务路由到没有这条线的模型。
- 压缩选时机：缓存热时让主模型自己压；缓存冷或主模型是 Opus 时，再考虑交给 Haiku，最好切块。

**五、预算帽**

- Console 设 workspace 花费上限，关掉自动充值；无头运行加 `--max-budget-usd` 和 `--max-turns`。[9][10][19]
- 每个 subagent 的定义里写死 `model` 和 `effort`，不要让它继承主会话的 Opus 和高 effort。[6]

最后说一句我的判断：Haiku 5.5 最大的价值，不是跟 Luna 比谁便宜，而是让「subagent 默认继承 Opus」这个最贵的默认值有了一个能用的替代。前提是你守住三条线：提示别跨 10 万，effort 别默认往上调，交回的报告要让主 agent 不必重读。

## 参考来源

1. Anthropic，《Introducing Claude Haiku 5.5》，2026-10-07：<https://www.anthropic.com/claude-haiku-5-5>
2. Claude Platform Docs，《Pricing》（含 Long context pricing、Prompt caching、tokenizer 说明）：<https://platform.claude.com/docs/en/about-claude/pricing>
3. Claude Platform Docs，《What's new in Claude Haiku 5.5》：<https://platform.claude.com/docs/en/models/haiku-5-5/whats-new-haiku-5-5>
4. Claude Platform Docs，《Claude Haiku 5.5 migration guide》：<https://platform.claude.com/docs/en/models/haiku-5-5/migration-guide>
5. Claude Code Docs，《Model configuration》：<https://code.claude.com/docs/en/model-config>
6. Claude Code Docs，《Create custom subagents》：<https://code.claude.com/docs/en/sub-agents>
7. Claude Code Docs，《How Claude Code uses prompt caching》：<https://code.claude.com/docs/en/prompt-caching>
8. Anthropic，Claude Code CHANGELOG，2.1.293：<https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md>
9. Claude Help Center，《Monthly API credits for Max and Team plans》：<https://support.claude.com/en/articles/17154008-monthly-api-credits-for-max-and-team-plans>
10. Simon Willison，《Claude Haiku 5.5》，2026-10-07：<https://simonwillison.net/2026/Oct/7/claude-haiku-5-5/>
11. Hacker News，「Claude Haiku 5.5」讨论串：<https://news.ycombinator.com/item?id=49996437>
12. Artificial Analysis，《Claude Haiku 5.5 (Max) vs GPT-6 Luna (Max)》：<https://artificialanalysis.ai/models/comparisons/claude-haiku-5-5-vs-gpt-6-luna>
13. OpenAI，《GPT-6 Luna》模型页：<https://developers.openai.com/api/docs/models/gpt-6-luna>
14. Reddit r/ClaudeAI，《Claude Haiku 5.5 cost 12x more than GPT-6 Luna for the same voxel pagoda》（抓取被拦，未直接读到）：<https://www.reddit.com/r/ClaudeAI/comments/1x0agoh/claude_haiku_55_cost_12x_more_than_gpt6_luna_for/>
15. Developers Digest，《Cheapest Subagent Model: Haiku 5.5 or GPT-6 Luna?》，2026-10-09：<https://www.developersdigest.tech/blog/haiku-5-5-vs-gpt-6-luna-subagent>
16. AGI Hunt，对 [14] 的摘要，2026-10-08：<https://agihunt.info/en/p/1a118a139ad82bd20233f8d9ba5>
17. Reddit r/LocalLLaMA，《DeepSeek V4.1 Flash beat Haiku 5.5 as my research subagent》（抓取被拦，未直接读到）：<https://www.reddit.com/r/LocalLLaMA/comments/1x0ixh6/deepseek_v41_flash_beat_haiku_55_as_my_research/>
18. AGI Hunt，对 [17] 的摘要，2026-10-08：<https://agihunt.info/en/p/1a11a0e6c533ec9285bf32c2e73>
19. Claude Code Docs，《Manage costs effectively》：<https://code.claude.com/docs/en/costs>
