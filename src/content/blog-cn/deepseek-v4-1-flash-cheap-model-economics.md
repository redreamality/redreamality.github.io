---
title: "DeepSeek Flash 便宜在哪、贵在哪：V4.1 Flash 的 agent 成本账与选型清单"
description: "DeepSeek V4.1 Flash 的缓存命中价只要未命中价的 2%，长上下文也不加价，但输出价是 Haiku 5.5 和 GPT-6 Luna 的 2.4 倍，高峰时段又正好压在北京上班时间。本文把 HN 上的争论落到四种任务形状上算账，再讲 subagent、路由、错峰、自托管各自怎么用，它在基准、工具调用、长上下文和合规上会在哪里出问题，最后给出选型表和验收清单。"
pubDate: 2026-10-11T10:40:00+08:00
author: "Remy"
tags: ["deepseek", "llm", "ai-agents", "agent-harness", "open-source"]
lang: "zh"
---

10 月 7 日，一篇题为《为什么业界没有为 DeepSeek 4.1 Flash 慌起来？》的博客上了 Hacker News。作者说自己在十几个项目里重度用了一个月，干活时不看模型名就分不出是 DeepSeek 还是 Opus，一整天的会话也很少超过 1 美元。[1] 到 10 月 11 日我抓取时，这条讨论已经有约 1,100 分、900 多条评论，[2] 吵得很凶：一边说「订阅这么便宜，谁还在乎 API 单价」，一边说「它一个任务要多烧几倍 token，单价便宜是假象」。

这篇不复述发布会。我想回答的是做 agent 的人真正关心的问题：**DeepSeek V4.1 Flash 便宜在哪一行价目上？这些便宜在什么任务形状下兑现，在什么形状下会被别的成本吃掉？**

和站内文章的关系：[Haiku 5.5 当 subagent 的成本账](/cn/blog/claude-haiku-5-5-subagent-compaction-cost-model/)已经有一段 DeepSeek V4.1 Flash 对 Haiku 的小样本对照，本文不重复，而是沿用那篇的任务形状把 DeepSeek 加进来；[DeepSeek V4 评测地图](/cn/blog/deepseek-v4-benchmarks-guide/)讲各个基准测什么；[Cordis 与 DeepSeek Harness](/cn/blog/cordis-spatiotemporal-composability-deepseek-harness/)讲官方 harness 的插件架构；[Coding Agent 烧钱的三种习惯](/cn/blog/coding-agents-cost-inefficient-behaviors/)和[默认硬预算帽](/cn/blog/default-hard-budget-caps-agent-deployed-services/)讲省钱之外的浪费和止损。文中金额按官方价目表算，标「算例」的是我用脚本算的，标「判断」的是我的看法，来自论坛的说法会注明是二手。

## 先说清楚它是什么

按模型卡和技术报告，V4.1 Flash 是一个 552B 参数的多模态 MoE 模型，支持 100 万 token 上下文，权重用 MIT 许可证发布。[3][4] 和成本直接相关的有四点：

- **读和写用的参数量不一样。** 它采用因果编码器-解码器（Causal Encoder-Decoder，CED）结构：40 层里前 20 层是编码器，后 20 层是解码器，解码器的全局 KV 由编码器最后一层投影出来。结果是预填充（prefill，即读入提示）时每个 token 只激活 8B 参数，生成时激活 16B。[3] 技术报告的说法是，长程 agent 让工作负载越来越偏「输入多、输出少」，工具调用频繁触发预填充，所以要专门压低读入的成本。[4]
- **KV 缓存压到了每 token 890 字节**，约为 V4-Flash 的 1/4；落到 SSD 或主机内存的持久 KV 约为 V4-Flash 的 1/8。[3][4] DeepSeek 在发布公告里直说：缓存命中费用往往占 agent 成本的大头，压缩缓存就是为了降这块钱。[6]
- **推理强度可调。** 模型内部的 effort 是 1–100 的整数，API 只开放 low、high、max 三档，分别对应 50、75、100；[4] 默认开启思考，默认档是 high。[8] 注意：模型卡上的指令模型成绩全部是在 max（100）下测的。[3]
- **体积。** HF 上的权重文件合计约 510 GB，[3] 其中包括 196B 参数的 Engram 条件记忆（按 token 查表的稀疏记忆）。[3] HN 上有人拆过：主干约 307 GB，n-gram 表约 203 GB，后者可以放在主机内存里（二手）。[2]

所以它的定位并不是「小模型」。552B 总参数放在别家可以叫 Pro，它叫 Flash，是因为每个 token 激活得少、KV 小，能用很低的成本服务很长的上下文。理解了这一点，后面的价目表就好读了。

## 价目表：便宜的是缓存命中，不是单价

DeepSeek 官方价目（美元 / 百万 token；人民币价目见中文页）：[5]

| 计费项 | 空闲时段 | 高峰时段 |
| --- | --- | --- |
| 输入（缓存命中） | 0.003 | 0.006 |
| 输入（缓存未命中） | 0.15 | 0.30 |
| 输出 | 0.60 | 1.20 |

人民币价目是：空闲时段命中 0.02 元、未命中 1 元、输出 4 元，高峰翻倍。[5] 高峰时段是北京时间工作日 9:00–12:00 和 14:00–18:00，中国法定节假日和周末全天都算空闲。[5]

放在一起看几家的标准价（美元 / 百万 token）：[5][14][15][16]

| 模型 | 缓存读 | 未命中输入 | 输出 | 长上下文规则 |
| --- | --- | --- | --- | --- |
| DeepSeek V4.1 Flash（高峰） | 0.006 | 0.30 | 1.20 | 1M 内同价，缓存写不另收费 |
| Claude Haiku 5.5（≤10 万） | 0.01 | 0.10 | 0.50 | 提示超 10 万，整条请求按 5 倍 |
| GPT-6 Luna（≤27.2 万） | 0.01 | 0.10 | 0.50 | 超 27.2 万，输入和缓存 2 倍、输出 1.5 倍 |
| Gemini 3.8 Flash（2026 年内） | 0.075 | 0.75 | 3.75 | 2027 年 1 月 1 日起全线翻倍，缓存另收存储费 |

（Haiku 的 5 分钟缓存写入价和 Luna 的缓存写入价都是 0.125。）

这张表能看出三件事：

1. **按单价，DeepSeek 并不便宜。** 高峰时，它的未命中输入是 Haiku/Luna 的 3 倍，输出是 2.4 倍；空闲时也还是 1.5 倍和 1.2 倍。（算例）
2. **它便宜在缓存命中和长上下文。** 命中价只有未命中价的 2%，别家是 10%；1M 以内不分档，也不收缓存写入费。Agent 循环每一轮都要把前面的上下文重读一遍，这一行恰恰是 agent 账单最大的那一行。
3. **便宜不是常数。** 据价格追踪站 benchr 的记录（二手），V4-Flash 年初是不分时段的 0.14/0.28；8 月 16 日改成分时计价，高峰涨到 0.44/1.32；9 月 10 日换成 V4.1 Flash 后降到现在的 0.30/1.20，仍高于年初。[21] 官方更新日志也确认了 8 月 16 日起实行峰谷价、9 月 10 日随 V4.1 降价。[7] HN 上有老用户说，正是 8 月涨价后他回到了订阅制；还有人说原文的「10 美元月费几乎用不完」像是几个月前写的草稿。[2]

### 高峰时段正好是北京的上班时间

这一条对中文读者最重要。我按「工作日本地 9:00–18:00 均匀用量」算了三个地方的高峰占比（10 月 12 日这一周，欧美还在夏令时）：（算例）

| 用量分布 | 落在高峰的比例 | 相当于高峰价的 |
| --- | --- | --- |
| 北京 9:00–18:00 | 77.8% | 0.889 倍 |
| 柏林 9:00–18:00 | 33.3% | 0.667 倍 |
| 旧金山 9:00–18:00 | 0% | 0.5 倍 |
| 全天 24 小时均匀 | 20.8% | 0.604 倍 |

北京只有中午 12 点到 2 点不算高峰。旧金山的白天整个落在空闲时段，美国开发者白天用，付的一直是半价。这就能解释为什么 HN 上一片「便宜得离谱」，而同一个模型在北京上班时间实时跑，账单接近高峰价。读海外的测评时，先换算一下时区。

## 业界为什么没有「慌」：HN 上的几种反对意见

把 900 多条评论按论点归一下，反对「没人慌」这个说法的主要是四种：[2]

1. **订阅补贴。** 回复最多的一串（250 多条）说，多数人用的是重度补贴的订阅，有人在 OpenRouter 最便宜的服务商那里几天花掉 50 美元，等于 Codex 订阅月费的四分之一，而订阅里同样的 token 量用不完。另有人比过 100 美元的 GLM 订阅和 100 美元的 Claude 订阅，能用到的量差得不多。
2. **按任务算并不便宜。** 有人说同样的任务 V4.1 Flash 要用掉十倍于 GPT-6.1 Sol 的 token。独立评测方 Artificial Analysis（下称 AA）的数据比这个温和，但方向一致：跑它的综合指数，DeepSeek 每个任务平均输出约 8.9 万 token，Luna 约 5 万；每任务成本 0.27 美元，Luna 是 0.07，Haiku 5.5 是 0.21（都是 max effort）。[18][19]
3. **能力不均匀。** 有人把它同时用作编排者和执行者，结果编排层质量明显下滑：做决定时没把相关上下文都考虑进去、经常不经讨论就凭空设计、文档写得啰嗦，最后换回 GLM 当编排者，但「写清楚规格的实现任务，它完全能独立完成」。也有人说它不擅长技术决策的追问式讨论，解释不清。还有人直接说它「幻觉多」「刷榜」。
4. **信任与摩擦。** 不放心中国公司的 agent 拿到本机权限、公司不会为中国产品付费、企业客户要求零数据保留（ZDR），以及「Cursor 的模型列表里没有，它对我就不存在」。

支持的一方也有具体数据：有人说过去 30 天在 DeepSeek API 上用了 400 多亿 token，花了 800 多美元，复杂任务要拆阶段、加验证、让主 agent 再审一遍；有人让 Opus 管理一批 DeepSeek Flash subagent，说省下了大量 Claude token；有人在订阅窗口的最后 1.5 小时开了 50 个并发 subagent 逆向一款老游戏的 C 代码，找出 100 多个新函数。[2]

两边其实不矛盾。我的判断是：**它对「读得多、轮次多、缓存命中高」的工作负载确实便宜一个量级，对「短、实时、在北京上班时间跑」的工作负载并不便宜，对「需要可靠判断」的位置则不是价格问题。** 下面用数字说明。

## 把账算到任务形状上

沿用 [Haiku 5.5 那篇](/cn/blog/claude-haiku-5-5-subagent-compaction-cost-model/)的设定：每轮读上一轮的缓存前缀，新写入工具结果和上一轮输出（含思考）。三个形状照搬，再加一个「全天会话」：

- **A 短任务**：起始 1.5 万，12 轮，每轮新增 4,000、输出 800。
- **B 重读型**：同上，每轮新增 1 万。最后提示 13.38 万。
- **C 长任务**：起始 2 万，30 轮，每轮新增 5,000、输出 1,000。最后提示 19.4 万。
- **D 全天会话**：起始 2 万，150 轮，每轮新增 3,000、输出 600。最后提示约 55.6 万，不压缩。

| 形状 | DeepSeek 高峰 | DeepSeek 空闲 | Haiku 5.5 | GPT-6 Luna | Gemini 3.8 Flash |
| --- | --- | --- | --- | --- | --- |
| A 短任务 | 0.034 | 0.017 | 0.018 | 0.018 | 0.12 |
| B 重读型 | 0.056 | 0.028 | 0.074 | 0.029 | 0.19 |
| C 长任务 | 0.11 | 0.056 | 0.24 | 0.069 | 0.48 |
| D 全天会话 | 0.53 | 0.27 | 2.58 | 0.91 | 3.96 |

（单位美元，算例。假设各家 token 计数相同、缓存全部命中；Gemini 未计缓存存储费；DeepSeek 的缓存是尽力而为，不保证命中。[9]）

怎么读：

- **短任务，高峰的 DeepSeek 贵一倍。** 形状 A 里 59% 的钱花在新写入的 token 上，这一行 DeepSeek 是 3 倍单价。空闲时段才和 Haiku、Luna 打平。
- **越长越占优。** 形状 D 里 Haiku 和 Luna 八成以上的钱花在重读缓存上，Haiku 第 24 轮跨过 10 万线，Luna 第 72 轮跨过 27.2 万线；DeepSeek 的命中价只有它们低档的六成，而且不跨档。0.53 美元跑完一天，和原文作者说的「一整天不到 1 美元」对得上。
- **形状 C 是分水岭。** 高峰的 DeepSeek（0.11）比 Luna（0.069）贵，比 Haiku（0.24）便宜一半；到了空闲时段（0.056）三家里最便宜。
- **Gemini 3.8 Flash 不在同一个价位。** 它的单价是 Luna 的 7.5 倍，明年还要翻倍；AA 给它的综合指数是 41，高于 DeepSeek 的 39，[20] 适合需要语音、视频输入的场景，单纯比 token 账不划算。

### 啰嗦会吃掉多少优势

上表假设输出一样多。AA 的数据说明 DeepSeek 输出更多（8.9 万对 Luna 的 5 万，约 1.78 倍；Haiku 在 max 下是 16.2 万，更多）。[18][19] 我把 DeepSeek 的输出量乘一个系数 k，求它和对手打平时的 k：（算例）

| 形状 | 高峰 vs Haiku | 高峰 vs Luna | 空闲 vs Luna |
| --- | --- | --- | --- |
| A 短任务 | 不可能打平 | 不可能打平 | 1.05 |
| C 长任务 | 3.73 | 0.09 | 1.56 |
| D 全天会话 | 12.7 | 3.20 | 8.44 |

「不可能打平」的意思是光输入那部分就已经更贵。读法很简单：**短任务里 DeepSeek 只要多说一点就亏；全天会话里，它多说三倍还比 Luna 便宜。** 这个系数只放大了输出，现实里更啰嗦往往还意味着更多轮次，所以短任务那一栏应当看得更悲观一点。

AA 是按高峰价 0.30/1.20 算的每任务 0.27 美元。[17] 如果全部按空闲价算，是 0.135 美元，仍是 Luna 的 1.9 倍，但低于 Haiku 的 0.21。（算例）

## 放进 agent 架构里，四种用法分别怎么看

### 当 subagent：钱不在 worker 身上

沿用 Haiku 那篇的扇出结构：主 agent 是 Opus 5.5，派 8 个形状 A 的 worker，每个交回 2,000 token 的报告，主 agent 之后再跑 20 轮。

| worker 模型 | 8 个 worker 合计 | 报告在 Opus 上下文里的成本 | 总计 |
| --- | --- | --- | --- |
| DeepSeek 高峰 | 0.24 | 0.14 | 0.39 |
| DeepSeek 空闲 | 0.12 | 0.14 | 0.27 |
| Haiku 5.5 | 0.13 | 0.14 | 0.27 |
| Gemini 3.8 Flash | 0.88 | 0.14 | 1.03 |

（单位美元，算例。）

worker 在 DeepSeek 和 Haiku 之间换，总账只差一毛多；而主 agent 只要因为报告不够用、自己重读一次 3 万 token 的文件，就要多花 0.24 美元。[Haiku 那篇](/cn/blog/claude-haiku-5-5-subagent-compaction-cost-model/)的结论在这里同样成立：**选 worker 主要看它交回的东西能不能让主 agent 直接用，单价是次要的。**

另一个比单价更大的变量是 harness。模型卡给了同一个模型在不同框架下的成绩：DeepSWE v1.1 上，mini-SWE 74.2、DeepSeek Harness Minimal 72.6、Claude Code 69.8、Codex 65.6，最大差 8.6 分；Terminal-Bench 2.1 上从 84.1 到 90.6。[3] 社区也有人说某个 harness 专门为 Flash 调过，效果明显好。[2] 拿 DeepSeek 当 worker，先在你实际用的 harness 里测，不要拿模型卡的最高分去比。

### 当路由的一档：让它执行，不让它拍板

HN 上的成功案例大多是同一种结构：强模型规划和审查，DeepSeek 执行写清楚规格的任务；失败案例大多是让它当编排者做设计决策。[2] AA 的分项也指向同一个画像：自动化流程类的 AutomationBench 上它是 69%，Haiku 35%、Luna 53%；但专业文档推理 GDP.pdf 只有 13%（Haiku 21%、Luna 23%），衡量知识可靠性的 AA-Omniscience 指数是 −5（Haiku 11、Luna 1）。这个指数答对加分、答错扣分、拒答不扣分，负数意味着它在知识题上答错的比答对的还多。[18][19] 我的判断是：按任务形状路由，长读入、多轮工具循环、规格明确的执行交给它；需要事实可靠、需要做取舍的位置留给更强的模型。

速度也是路由时要算的一项。AA 在 max effort 下测得 DeepSeek 首 token 1.03 秒、首个答案 token 10.2 秒，Luna 是 101.5 秒，Haiku 是 296 秒；输出速度 DeepSeek 217 token/秒，Haiku 240，Luna 137。[18][19] 对要等结果的交互式子任务，它是这几家里最快给出答案的。

### 批处理与错峰：空闲价是实时的半价

DeepSeek 文档里我没找到 Batch API，空闲时段的半价起的就是批处理折扣的作用，而且是实时返回，不用排队。[5] 但别家也有半价：Haiku 5.5 的 Batch 是 0.05/0.25，Luna 的 Batch 和 Flex 也是标准价的一半。[14][15] 所以：

- **单次请求的批量任务**（分类、抽取、打标签）：Haiku/Luna 的 Batch 单价比 DeepSeek 空闲价还低，只要能接受异步。
- **夜里跑的 agent 循环**（批量修 issue、回归评测、文档回填）：Batch API 不适合多轮交互，DeepSeek 的空闲时段正好合适，形状 C 只要 0.056 美元。

对国内团队，最直接的省钱办法是把能等的 agent 任务挪到晚上 6 点以后和周末，那时的单价只有白天高峰的一半。

### 自托管：为了数据，不是为了省钱

原文作者说，单为省钱自托管永远回不了本。[1] 我按 HN 上的二手数字算了一下：有人说 4 台 DGX Spark 约 2 万美元能跑起来，按 24 个月摊销，每月要替代 833 美元的 API 开销才回本，相当于每月按高峰价跑 7,421 次形状 C，或者全天候持续输出 268 token/秒。另一位在 M5 Ultra（256 GB）上跑出预填充约 2,500 token/秒、生成约 40 token/秒，单路生成跑满一个月约 1.04 亿 token，按高峰输出价也只值 124 美元。[2]（算例，未计电费和运维。）

还要注意，API 上那个 0.006 的命中价，来自 DeepSeek 自己的磁盘缓存系统；[9] 自托管时你得自己搭 KV 落盘和前缀匹配，否则长会话每轮都要重新预填充。DeepSeek 在公告里说欢迎「2,000 卡加存储集群规模」的部署来谈，[6] 也说明这套经济性需要很大的规模才能复现。所以自托管的理由应该是数据控制、合规、离线环境，而不是单价。

## 它会在哪里出问题

### 基准：测的设置和你用的不一样

- 模型卡成绩都在 max（effort 100）下测，API 默认是 high（75）。[3][4][8] 你按默认值用，拿到的不是表上的分数。
- 同一项数字在两处不一致：NL2Repo-Bench 在模型卡上是 64.0，在更新日志里是 65.4。[3][7]
- Terminal-Bench 4.0 自报 31.2，AA 实测 27%；AA 测的 Haiku 5.5 是 33%。[3][19]
- 技术报告自己也承认，基准分差距很小，不等于在最难的推理和边缘情况上追平了闭源前沿模型。[4]

至于「刷榜」，HN 上没有人拿出证据，只有体感。[2] 更可靠的读法是看独立评测的分项分布：它在自动化流程上很强，在事实可靠性上偏弱。这和社区说的「好用但会编」是一致的。

### 工具调用：先排除解析问题，再谈模型

V4.1 的工具调用标记（DSML）和 V4 不同。据一家服务商的技术博客（二手），旧版 vLLM 解析器认不出新格式时不会报错，而是把工具调用当普通文本返回，看起来像模型「不愿意调工具」。[24] vLLM 的一个 PR 描述说，在它之前，vLLM Python 侧的 V4.1 构建器即使开了 `strict=true`，也会放过缺失、重复、未声明和类型错误的参数；这个 PR 改用 XGrammar 按 schema 约束，9 月 15 日合并，但要配合新版 XGrammar。修复 V4.1 流式返回失败的 PR 截至我查时还没合并。[22][23] 官方 API 上也有一例用户报告：9 月 22 日起工具调用标记泄漏到正文，切到 GLM 就恢复；不过工具方回复说更像客户端的问题，没有定论。[25]

接入时还要注意三条官方规则：带 `tools` 的请求必须把之前所有轮次的 `reasoning_content` 回传，并会拼进上下文，所以思考 token 会累积成输入；[8] Chat Completions 接口不支持在对话中途插入非模型生成的工具调用，需要的话改用 Anthropic 或 Responses 格式的接口；strict 模式还是 Beta，要换 `/beta` 地址，schema 里所有字段都必须 required，且 `additionalProperties` 必须为 false。[10]

### 长上下文：缓存续接处是已知的薄弱点

技术报告在局限性一节里写得很坦白：CSA2 的稀疏选择可能出错，SWA 有界重放（Bounded Replay）在「缓存续接边界」做的是近似状态重建，在没测到的边界情况下可能退化；接下来要重点测长上下文稀疏检索和缓存续接。[4] 基座模型的 LongBench-V2 是 45.2，低于 V4-Pro 基座的 51.5；[3] 不过 AA 的长上下文推理 AA-LCR 是 84%，和 Haiku、Luna 持平。[19]

缓存规则本身也会影响账单：缓存按「前缀单元」完整匹配，第一轮是 A+B、第二轮是 A+C，就命中不了；缓存不用后通常几小时到几天内清掉。[9] 一个隔夜恢复的长会话，第一轮可能要按未命中价全额重读，也正好落在技术报告说的续接边界上。官方建议 `max_tokens` 至少 256K，[3] 但没有预算帽的话，这也意味着单次输出的上限很高。

### 合规：数据存在哪、谁能保留

DeepSeek 隐私政策写明，数据在中华人民共和国境内收集、处理和存储，用于运营、开发和改进服务；[12] 开放平台条款适用中国大陆法律。[13] 我在 API 文档里没找到零数据保留选项。HN 上有人说可以通过声明 ZDR 的第三方服务商使用开源权重（二手），但也有人提醒，不同服务商的量化精度不同，体验差别很大；还有人说 OpenRouter 上的计价和缓存跟官方不一样。[2]

对国内团队，这一条正好反过来：数据在境内处理，很多时候是加分项，具体合规要求以你所在行业的规定为准。官方 API 还支持传 `user_id`，按你自己的终端用户隔离 KV 缓存和调度。[11] 对需要欧美数据驻留的业务，Luna 提供 EU 数据驻留（加价 10%），Claude 有 `inference_geo` 指定美国推理（1.1 倍）；[14][15] DeepSeek 只能走第三方托管或自托管。

## 选型表：什么时候先试哪一个

（判断）

| 场景 | 先试 | 理由 |
| --- | --- | --- |
| 长会话、多轮工具循环、读得多写得少 | DeepSeek Flash 官方 API | 命中价 0.006 / 0.003，1M 内不分档 |
| 能等到晚上或周末的 agent 任务 | DeepSeek 空闲时段 | 实时返回的半价，形状 C 三家最低 |
| 北京上班时间实时跑的短 subagent、分类、起标题 | Luna 或 Haiku 5.5 | 未命中输入和输出单价低三分之二和近六成 |
| 单次请求的大批量任务 | Haiku / Luna 的 Batch | 0.05 / 0.25，比 DeepSeek 空闲价还低 |
| 已经在 Claude harness 里、提示稳定在 10 万以下 | Haiku 5.5 | 接口一致，见站内那篇 |
| 需要事实可靠、做设计取舍、当编排者 | 前沿模型，DeepSeek 只做执行 | 独立评测的幻觉指标偏弱 |
| 要欧美数据驻留或 ZDR | Luna / Claude，或可信托管、自托管 | DeepSeek 官方 API 数据在境内 |
| 要语音、视频输入 | Gemini 3.8 Flash | DeepSeek 只支持图像输入 |

## 验收清单：用自己的工作负载量一遍

**一、时段和缓存**

- 把上个月的请求按北京时间分到高峰和空闲两桶，算出你的实际单价倍数；能挪的任务挪到空闲时段。
- 记录每条请求的 `prompt_cache_hit_tokens` 和 `prompt_cache_miss_tokens`，[9] 算命中率；系统提示和工具定义放稳定前缀，不要在前面插入会变的内容。
- 单独测一次「隔夜续接」：会话停几个小时再继续，看第一轮是否全额未命中，结果有没有变差。

**二、effort 和 token**

- 在自己的样本上分别跑 low / high / max，记「每个通过任务的成本」和耗时，而不是每百万 token 的单价。
- 统计输出 token 和对照模型之比，套进上面的打平系数：短任务里比值超过约 1，就该换掉。

**三、工具调用**

- 统计解析失败率：正文里出现 DSML 标记、`tool_calls` 为空但正文里有调用意图，都算失败。
- 自托管时核对 vLLM 版本和工具解析器配置；用官方 API 时确认 `reasoning_content` 按规则回传。
- 需要严格 JSON 的工具，评估 strict 模式能不能满足它的 schema 限制。

**四、质量和角色**

- 用盲评比较候选模型，样本里放进「必须打开一手来源」「不许编数字」这类题；看它当执行者和当编排者时分别的通过率。
- 量主 agent 的重读率：报告交回后，主 agent 又读了多少 worker 读过的文件。

**五、合规和预算**

- 确认数据路径：官方 API、哪家第三方、什么量化精度、有没有 ZDR；对外合同里写清楚。
- 价目随时可能调整，[5] 把单价写成配置，按月核对；并发上限是每账号 2,500，超了返回 429，要有重试和降级路由。[11]
- 设硬预算帽，超了就停，做法见[默认硬预算帽](/cn/blog/default-hard-budget-caps-agent-deployed-services/)。

最后说一下我的判断。业界没有为 DeepSeek V4.1 Flash 慌起来，主要原因不是它不够好，而是它的优势只在一种特定的账单形状上兑现：长上下文、高缓存命中、能错峰、对事实可靠性要求不高的执行工作。这恰好是长程 agent 越来越多的那部分活，所以它值得认真放进路由表；但只看单价，或者拿美国开发者白天的体验来套北京上班时间的账，都会算错。

## 参考来源

1. dgt.is，《Why Isn't The Industry Freaking Out About DeepSeek 4.1 Flash?》，2026-10-07：<https://www.dgt.is/blog/2026-10-07-deepseek-freek-out/>
2. Hacker News 讨论串（item 50000488，经 Algolia API 读取全部评论）：<https://news.ycombinator.com/item?id=50000488>
3. Hugging Face，DeepSeek-V4.1-Flash 模型卡与仓库文件：<https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash>
4. DeepSeek-AI，《DeepSeek-V4.1-Flash: Pushing the Limits of KV Cache Compression》技术报告：<https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/DeepSeek_V41_Tech_Report.pdf>
5. DeepSeek API Docs，《Models & Pricing》（英文页；中文页含人民币价目与北京时间）：<https://api-docs.deepseek.com/quick_start/pricing> ；<https://api-docs.deepseek.com/zh-cn/quick_start/pricing>
6. DeepSeek，《DeepSeek-V4.1-Flash Release》，2026-09-10：<https://api-docs.deepseek.com/news/news260910>
7. DeepSeek API Docs，《Change Log》：<https://api-docs.deepseek.com/updates>
8. DeepSeek API Docs，《Thinking Mode》：<https://api-docs.deepseek.com/guides/thinking_mode>
9. DeepSeek API Docs，《Context Caching》：<https://api-docs.deepseek.com/guides/kv_cache>
10. DeepSeek API Docs，《Tool Calls》：<https://api-docs.deepseek.com/guides/tool_calls>
11. DeepSeek API Docs，《Rate Limit & Isolation》：<https://api-docs.deepseek.com/quick_start/rate_limit>
12. DeepSeek，《Privacy Policy》，2026-02-10 更新：<https://cdn.deepseek.com/policies/en-US/deepseek-privacy-policy.html>
13. DeepSeek，《Open Platform Terms of Service》，2026-04-29 生效：<https://cdn.deepseek.com/policies/en-US/deepseek-open-platform-terms-of-service.html>
14. Claude Platform Docs，《Pricing》：<https://platform.claude.com/docs/en/about-claude/pricing>
15. OpenAI，《GPT-6 Luna》模型页：<https://developers.openai.com/api/docs/models/gpt-6-luna>
16. Google AI for Developers，《Gemini Developer API pricing》：<https://ai.google.dev/gemini-api/docs/pricing>
17. Artificial Analysis，《DeepSeek V4.1 Flash (max)》：<https://artificialanalysis.ai/models/deepseek-v4-1-flash>
18. Artificial Analysis，《GPT-6 Luna (Max) vs DeepSeek V4.1 Flash (Max)》：<https://artificialanalysis.ai/models/comparisons/deepseek-v4-1-flash-vs-gpt-6-luna>
19. Artificial Analysis，《Claude Haiku 5.5 (Max) vs DeepSeek V4.1 Flash (Max)》：<https://artificialanalysis.ai/models/comparisons/deepseek-v4-1-flash-vs-claude-haiku-5-5>
20. Artificial Analysis，《Gemini 3.8 Flash (high)》：<https://artificialanalysis.ai/models/gemini-3-8-flash>
21. benchr，《DeepSeek raised prices and made the clock part of the bill》（第三方价格追踪，2026-09-11 更新）：<https://benchr.org/articles/deepseek-peak-pricing>
22. vLLM PR #56408，《Use XGrammar schema constraints for DeepSeek V4.1》（2026-09-15 合并）：<https://github.com/vllm-project/vllm/pull/56408>
23. vLLM PR #58822，《DeepSeek V4.1 Flash failed to stream back to the client》（查阅时未合并）：<https://github.com/vllm-project/vllm/pull/58822>
24. OrcaRouter 博客，《DeepSeek V4.1 Flash Tool Calling Lands in vLLM: What the Spaced Tags Broke》（服务商文章，二手）：<https://www.orcarouter.ai/blog/deepseek-v4-1-tool-calling-vllm>
25. GitHub CommandCodeAI/command-code issue #909，《deepseek-v4.1-flash tool-calling regression》：<https://github.com/CommandCodeAI/command-code/issues/909>
