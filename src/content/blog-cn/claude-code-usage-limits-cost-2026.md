---
title: "Claude Code 额度怎么算：5 小时窗口、周上限、API 额度与省额度清单（2026）"
description: "Claude Code 的用量从哪本账扣、怎么计？本文拆解 2026 年秋的计量机制：5 小时窗口与周上限、撞线后的收尾与自动续跑、claude -p 走订阅还是 API 额度、模型与 effort 价差、Haiku 5.5 当 subagent 的利弊，并与 Codex 各档对照，附省额度清单。"
pubDate: 2026-10-08T16:45:00+08:00
author: "Remy"
tags: ["claude-code", "anthropic", "openai", "agent-harness", "developer-tools"]
lang: "zh"
---

最近两周，跟 Claude Code 额度有关的改动挤在了一起。9 月 26 日，Anthropic 开发者账号宣布：任务进行到一半撞上 5 小时上限时，Claude Code 不再在改文件中途断掉，而是从周额度里借一小段固定额度，找个合适的点收尾。[1][2] 9 月 29 日，OpenAI 在 DevDay 上推出 500 美元的 Pro 档，同时把 200 美元档在 Codex 里的额度从 Plus 的 20 倍降到 10 倍。[22] 10 月 7 日，Anthropic 发布 Haiku 5.5，Sonnet 5.5 的缓存读取价格减半，并给 Max 和 Team 订阅加了每月 API 额度。[9][8]

每次有这种改动，社区里最常见的问题都差不多：「我的额度怎么一下就没了」「`claude -p` 跑的脚本算不算订阅」「换 Haiku 当 subagent 到底省多少」。这篇不复述新闻，而是把计量机制画成一张图：用量从哪几本账扣，两个时钟怎么同时走，撞线之后会发生什么，token 实际花在哪，再跟 Codex 的档位对照，最后给一份能照着做的清单。

站内相关：[Coding Agent 烧钱的三种习惯](/cn/blog/coding-agents-cost-inefficient-behaviors/) 详细拆了 arXiv 2609.30725 那篇论文，本文只取跟额度有关的结论；[默认硬预算帽](/cn/blog/default-hard-budget-caps-agent-deployed-services/) 讲为什么超限应该直接停；[Claude Code 扩展全景](/cn/blog/claude-code-extension-stack-mods-plugins/) 讲 Skills、Hooks、Subagents 各管什么；[Agent Harness 模式](/cn/blog/inside-claude-code-agent-harness/) 讲核心循环。文中数字均来自文末列出的官方文档、帮助中心和一手发布；标「判断」的是我的看法。

## 先分清几本账

Claude Code 本身不决定你付多少钱，决定的是你**用什么身份登录**。官方成本文档说得很直白：如果组织里混用了登录方式，每个开发者按他实际认证的那种方式计量。[3] 按 2026 年 10 月的文档，可以分成六类：

| 登录 / 计费方式 | 怎么计量 | 上限在哪 | 什么时候恢复 |
| --- | --- | --- | --- |
| Pro / Max 订阅 | 计划内额度，和 claude.ai 聊天共用一个池 | 5 小时滚动窗口 + 周上限，部分模型另有单独上限 | 窗口重置 |
| 订阅 + usage credits（额外用量） | 超出计划后按标准 API 价扣 | 自己设的月度花费上限 | 月度 |
| Team / Enterprise 席位 | 每席额度，和聊天、Cowork 共用 | 5 小时 + 周窗口；管理员可开额外用量并设限 | 窗口重置 |
| Console API key | 按 token 计费 | workspace 花费上限、TPM/RPM 速率限制 | 无窗口，按量 |
| Bedrock / Agent Platform / Foundry | 按 token 计到云账单 | 云厂商自己的预算工具 | 无窗口 |
| Max / Team 每月 API 额度（10 月新增） | 抵扣 Claude Platform 上的 API 调用 | 额度用完即停，除非另有余额或自动充值 | 每个账单周期 |

几个容易踩的点：

- 环境里设了 `ANTHROPIC_API_KEY`，Claude Code 会优先用这个 key 认证，而不是你的订阅，结果是按 API 计费，而不是消耗订阅额度。帮助中心专门写了这一条；错误文档也建议用 `/status` 确认当前凭据，因为「一个多余的 `ANTHROPIC_API_KEY` 可能让请求走到低档 key 上」。[7][4]
- Enterprise 不是「包月随便用」：定价页写的是每席每月 20 美元，用量另按 API 价计。[6]
- Team 的席位分 Standard 和 Premium：Standard 比 Pro 多，Premium 是 Standard 的 5 倍。[6]

## 两个时钟一起走：5 小时窗口和周上限

定价页 FAQ 的原话是：每个计划都有按 5 小时滚动窗口重置的用量上限，付费计划在此之上再加周上限；网页、桌面、手机上的 Claude 和 Claude Code 都从同一个池里扣，没有固定的消息条数。Pro 每 5 小时至少是 Free 的 5 倍，Max 每 5 小时是 Pro 的 5 倍或 20 倍。[6]

周上限不是新东西。2025 年 7 月 28 日，Anthropic 宣布从 8 月 28 日起给 Pro 和 Max 加周上限，理由是有人把 Claude Code「24/7 在后台连续跑」，还有共享账号和转卖；当时估计只会影响不到 5% 的订阅用户。[19]

错误文档里有一句很关键：**同一笔用量会同时计入 5 小时额度和周额度**，一次大规模的工作流扇出（fanout，一次派出大量并行 agent）可能在 5 小时窗口重置之前就把周额度用完。[4] 撞线时你会看到四种提示：session limit、weekly limit、Opus limit、Sonnet limit。前两种对所有模型共享，换模型没用；后两种只限某个模型家族，用 `/model` 换到别的家族就能继续干活。[4] 但换模型有代价：每个模型有自己的提示缓存，切过去的下一次请求要把整段对话重新读一遍，一点缓存都命中不了。[4][13]

怎么看自己还剩多少：

- 快用完时会有「已用 85%」一类的提醒。[4]
- `/usage` 显示计划用量条，并按 skills、subagents、plugins、各个 MCP server 拆出占比；占近期用量 10% 以上的行为（比如长上下文、缓存未命中）会被单独标出来；按 `d` / `w` 在 24 小时和 7 天之间切换。注意这些数字只来自本机的会话历史，其他设备和 claude.ai 的用量不在里面。[3]
- 自定义 status line 可以读 `rate_limits.five_hour.used_percentage` 和 `rate_limits.seven_day.used_percentage`，一直挂在底部。[17]

判断：5 小时窗口决定节奏，周上限才是真正的预算。日常卡你的多半是 5 小时窗口，但真正让一周后半段没法干活的是周上限。所以安排重活时，与其盯着 5 小时窗口还剩多少，不如看 7 天视图的斜率。

## 撞线以后会怎样：收尾、自动续跑、额外用量

现在撞线之后有三层机制，按时间顺序排：

**第一层：收尾额度（graceful wind-down）。** ClaudeDevs 9 月 25 日（UTC，北京时间 26 日凌晨）发帖：任务中途撞上 5 小时上限时，Claude Code 会尽量找一个合适的停止点，而不是在编辑中途断开；这段收尾用的是从你周额度里扣的一小段固定额度。跟帖说明了适用范围：Pro 每周一次；Max 和 Team Premium 每次撞上 5 小时上限都有；收尾之后还想继续，可以用额外用量。[1][2] 「一小段」到底多少，帖子没写，我抓取的几页官方文档里也还没有这个机制的说明，所以没法给数字。

**第二层：自动续跑。** 从 v2.1.234 起，交互式会话用 claude.ai 订阅登录时，撞线后 Claude Code 会在原会话里等，窗口重置后自己接着做，默认开启。它不会重发你上一条消息，而是提示 Claude 从停下的地方继续；如果再次撞线，最多自动重新排队两次，之后停下等你处理。权限确认照常弹出，所以人不在时也可能卡在一个权限提示上。[5]

几个不会自动等的情况：重置时间在 24 小时以后（周上限可能要等好几天）；后台会话和 `-p` 运行；API key、云厂商和按量计费（没有窗口可等）。不想让它无人值守地续跑，可以在 `/config` 里关掉，或者设 `autoContinueAtUsageLimit: false`。[5]

**第三层：额外用量（usage credits）。** Pro 和 Max 可以开启 usage credits，超出计划后按标准 API 价继续用，并设月度花费上限；Team 和 Enterprise 由管理员在组织、分组或成员层面设限。[3][7] 这里有个不太显眼的变化：在计划额度内，主对话请求的是 1 小时缓存 TTL（缓存存活时间）；一旦开始扣 usage credits，Claude Code 会把主对话降到 5 分钟 TTL，因为写缓存更便宜。[13] 也就是说，额外用量阶段离开电脑十分钟再回来，下一条消息很可能要把整段上下文重新算一遍。

判断：收尾额度本质上是**向周额度预支**。对 Max 用户来说，每次撞线都能体面停下，代价是周额度被一点点挪走；对 Pro 用户来说一周只有一次，最好留给真正长的任务。长任务最好自己设检查点（比如每完成一个子任务就提交一次），别把「能不能停在干净的状态」全指望在收尾额度上。

## 哪些调用吃订阅，哪些走 API

这是最近问得最多的问题，答案取决于凭据，而不是命令本身。

帮助中心「每月 API 额度」那页列得很清楚：[8]

- 额度：Max 5x 每月 100 美元，Max 20x 每月 200 美元；Team 每个 Standard 席 20 美元、每个 Premium 席 100 美元，全队合并，上限 500 美元。Pro 和 Enterprise 没有。新订阅要满 7 天才能领。
- 能用在：Messages API 和 Batches API、Console 里的 Playground、Claude Managed Agents、Claude Agent SDK。
- 不能用在：交互式 Claude Code（终端、IDE、桌面、网页），以及 Claude、Claude Code、Cowork 里的额外用量，也不能用在 Bedrock、Vertex AI、Foundry 上。
- 关于 `claude -p`：用关联的 Console 组织里的 API key 跑 `claude -p` 或 Agent SDK，算 Agent SDK 用量，可以抵扣；用订阅登录跑，照样扣订阅额度，不用 API 额度。GitHub Action、IDE 插件、桌面应用发起的运行都算 Claude Code 用量，即使带了 `-p` 也不能抵扣。
- 不结转，每个周期用完作废；额度先于你自己买的 credits 扣；用完后如果组织里没有其他余额，API 请求直接停，不会扣到订阅上。

Simon Willison 补了一个实用细节：Console 里可以关掉自动充值，余额用完请求就停——拿这笔额度做实验时，正好不用担心账单。[10]

跟无头运行（headless，不开交互界面、用脚本调用）有关的几条文档：

- `claude --bare -p` 跳过 hooks、skills、plugins、MCP、CLAUDE.md 的自动加载，**也不读订阅登录**，必须设 `ANTHROPIC_API_KEY`。文档说 `--bare` 是脚本和 SDK 调用的推荐模式，以后会成为 `-p` 的默认。[15] 换句话说，这条路天然就是 API 计费。
- `--max-budget-usd` 和 `--max-turns` 只在 print 模式下生效。前者按 Claude Code 在客户端估算的花费判断，subagent 的花费也算进去；到上限后新 subagent 会报 `Budget limit reached`，还在跑的后台 subagent 会被停掉。[16]
- 有一个坑：如果计划里 Fable 要扣 usage credits，交互式会话会先弹确认，`-p` 和不显示提示的 Agent SDK 应用**不会问，直接扣**。[11]

判断：最省心的做法是两条路分开。人坐在终端前的交互工作走订阅；cron、CI、批处理一律用 `--bare` 加关联组织的 API key，吃那笔每月 API 额度，并且同时设 `--max-budget-usd`、关掉自动充值、在 Console 设 workspace 花费上限。这正是[默认硬预算帽](/cn/blog/default-hard-budget-caps-agent-deployed-services/)那篇主张的「超限即停」，只不过这次是落在 agent 自己的 token 账上。

## 模型和 effort：同一件事，价差能差几十倍

先看价目表（美元 / 百万 token，缓存价按 5 分钟 TTL）：[6][9]

| 模型 | 缓存读 | 缓存写 | 输入 | 输出 |
| --- | --- | --- | --- | --- |
| Fable 5.1 | 0.25 | 12.50 | 10 | 50 |
| Opus 5.5 | 0.20 | 5 | 4 | 20 |
| Sonnet 5.5 | 0.10 | 2.50 | 2 | 10 |
| Haiku 5.5（提示 ≤10 万 token） | 0.01 | 0.125 | 0.10 | 0.50 |
| Haiku 5.5（提示 >10 万 token） | 0.05 | 0.625 | 0.50 | 2.50 |

几件文档里写明、但很多人没注意的事：

- 订阅和 API 上，`default` 现在都解析为 Opus 5.5。[11] 成本文档却说 Sonnet 能很好地处理大多数编码任务，比 Opus 便宜，Opus 留给复杂的架构决策和多步推理。[3] 默认值和推荐值不一致，是额度消耗快的一个常见原因。
- Opus 5.5、Sonnet 5.5、Haiku 5.5 的 effort 默认是 `medium`，档位有 low、medium、high、xhigh、max；这几个模型都**关不掉思考**，思考 token 按输出价计。[11][3] 文档对 `max` 的提醒是：可能收益递减，还容易想过头。[11]
- `opusplan` 在计划模式用 Opus，执行时自动换 Sonnet。[11]
- Fast mode 让 Opus 最多快 2.5 倍，Opus 5.5 上价格是输入 8 美元、输出 40 美元，正好是标准价的两倍；订阅用户**只能用 usage credits 付**，不计入计划额度。第一次在一段对话里打开时，整段上下文要按 fast mode 的未缓存输入价重算一次，所以越晚打开越贵。[12]

**Haiku 5.5 怎么用。** 官方定位很明确：做摘要、上下文压缩、分类，给 Opus 5.5 和 Sonnet 5.5 当编码 subagent；同时承认复杂的 agentic 编码任务 Sonnet 和 Opus 仍然更合适——Terminal-Bench 4.0 上 Haiku 5.5 是 39.2%，Sonnet 5.5 是 70.6%。[9] 它是第一款能调 effort 的 Haiku，在 Anthropic API 上默认 1M 上下文。[9][11] 两个隐藏成本：一是提示超过 10 万 token 时单价变成 5 倍；二是 Simon Willison 实测同一段长提示的 token 数约为 Haiku 4.5 的 1.25 倍（换了新 tokenizer）。[10] 官方也承认新 tokenizer 每个任务会多用一点 token，并说已经算进「平均便宜约 75%」里了。[9] 在 Claude Code 里用要 v2.1.293 以上；`haiku` 别名在 Anthropic API 上指向 Haiku 5.5，但在 Bedrock、Agent Platform、Foundry 上仍指向 Haiku 4.5。[11]

**一个默认值值得专门改。** 内置的 Explore subagent（只读，负责找文件、搜代码）在订阅、Console 或网关上跑的是 `opus` 别名指向的 Opus。[14] 也就是说，默认情况下，「去代码库里翻一翻」这种活用的是最贵的常用模型。文档给的办法是在用户或项目里定义一个同名的 `Explore` subagent，写上 `model: haiku`；或者同时设 `CLAUDE_CODE_SUBAGENT_MODEL=haiku` 和 `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1`，把所有 subagent 都压到同一个模型上。[14] 文档也提醒，subagent 自己的请求同样算进你的额度。[14]

判断：便宜 subagent 不是白赚。那篇论文发现，Claude Code 里一半（50.15%）的重复检索来自「跨 agent」：subagent 读过的代码只把摘要带回主对话，主 agent 之后需要细节时又自己读一遍。[18] 主 agent 是 Opus，这次重读就是按 Opus 的价付的。论文里还有一个反例：接入 CodeGraph 后，Haiku 4.5 subagent 的调用降到 0，差不多同样多的 token 转到了单价是它 3 倍的 Sonnet 4.6 上，结果 Claude Code 的成本反而涨了 8.30%（Verified）和 12.19%（Pro）。[18] 所以选 subagent 模型时，要看的不只是单价，还有「它带回来的东西够不够主 agent 直接用」：让 Explore 返回文件路径、行号和关键片段，而不是一句「auth 逻辑在 middleware 里」。

还有一点要分清：Claude Code 做 `/compact` 时，会用和对话相同的系统提示、工具和历史发一个摘要请求，好读到现成的缓存。[13] 所以「Haiku 5.5 当压缩引擎」这个用途，更适合你自己用 API 写的 agent；在 Claude Code 的 Opus 会话里，压缩跟着会话模型走，换成 Haiku 反而拿不到缓存（判断，基于文档对压缩机制的描述）。

## token 实际花在哪

成本文档有一节「长会话里用量为什么会涨」，基本就是一张漏水点清单：[3]

1. **长上下文。** 每次请求都带上完整对话，每次工具调用又多一次请求。有缓存时按缓存价重读，但开了一整天的会话里，问一句一行字的问题也要为整段对话付费。
2. **缓存未命中。** 中断超过缓存寿命再回来，第一条消息要重新处理全部上下文。订阅计划内是 1 小时，扣 usage credits 时是 5 分钟，API key 和云厂商默认也是 5 分钟。
3. **定时任务、跨会话消息、目标检查。** 定时任务在会话空闲时照样触发；另一个会话发来的消息会作为新一轮投递；有活跃目标时，Claude Code 会在空闲时最多做三次检查。每一次都带上完整上下文。
4. **subagents、工作流、agent teammates。** 每个都在主对话之外发自己的请求。agent teams 在计划模式下大约是普通会话的 7 倍 token。
5. **压缩本身。** `/compact` 要读一遍它要总结的对话；如果你只想重新开始，`/clear` 是免费的。

拿价目表算一个例子（算例，非实测）：一段 30 万 token 的上下文，在 Opus 5.5 上每次请求按缓存读算约 0.06 美元，一百次工具往返就是 6 美元；Sonnet 5.5 是一半；Haiku 5.5 因为超过 10 万 token 走高档价，是 0.015 美元一次。如果缓存冷了，这 30 万 token 要按写缓存价重新计，Opus 5.5 一次约 1.5 美元，是热缓存读的 25 倍。订阅额度没有按 token 公布，但文档明确说重读历史时「按缓存价」消耗额度，所以这个比例关系在订阅下也成立。[3][6]

作为参照：成本文档给的企业部署平均是每个开发者每个活跃日约 13 美元、每月 150–250 美元，90% 的用户每个活跃日低于 30 美元。[3]

**轨迹里的浪费。** Purdue 那篇论文在 SWE-bench Verified 上分析了 1200 条轨迹，找出三类浪费：读已经读过的代码、重新生成几乎一样的脚本、补丁没改就重跑测试。三者合计覆盖 79%–98% 的任务，最高占任务成本的 22.75%；Claude Code（Sonnet 4.6 主 + Haiku 4.5 subagent）是四种配置里最省的，覆盖 79.00% 的任务、占 6.86% 的成本。[18] 对额度最有用的是两个结论：

- **省下来的会被放大。** 论文把「被标记行为的成本变化」和「任务总成本变化」做线性拟合，Verified 上斜率 2.83，Pro 上 1.33。原因是去掉一个无效动作就缩短了轨迹，后面每次请求重读的缓存也跟着少了。[18]
- **人写的高层原则比 agent 自己总结的规则管用。** 七条开发者写的原则（检索前先说清假设、复用已有上下文、脚本存下来改而不是重写、只有代码改了才重跑测试、发现兜圈子就停）在 Claude Code 上把 Verified 成本降了 13.94%，在 Mini-SWE-Agent + Sonnet 4.6 上最高降 41.73%。[18]

完整解读见[那篇](/cn/blog/coding-agents-cost-inefficient-behaviors/)，这里不重复。

## 和 Codex 对照：档位、速度倍率、撞线规则

| | Claude（Anthropic） | Codex（OpenAI） |
| --- | --- | --- |
| 入门付费档 | Pro 20 美元/月 [6] | Plus 20 美元/月 [20] |
| 高档 | Max 5x（100 美元）、Max 20x（200 美元）[6][8] | Pro 100 / 200 / 500 美元 [20] |
| 5 小时窗口 | 所有计划都有 [6] | Plus、Standard Business 有；Pro 各档目前没有 [20] |
| 周上限 | 付费计划都有，未公布数值 [6] | 可能适用，未公布数值 [20] |
| 提速 | Fast mode：只走 usage credits，Opus 5.5 单价翻倍 [12] | Fast：计划内按 2.5 倍扣、credits 按 2 倍；Astra Ultrafast：计划内按 8 倍、credits 按 6 倍 [20][21] |
| 撞线时 | 收尾额度从周额度扣；Pro 每周一次 [1][2] | 正在进行的那一轮可以做完，受公平使用限制 [20] |
| 订阅附带 API 额度 | Max/Team 每月 100–500 美元 [8] | 本次未查到对应官方说明 |

OpenAI 这边的几个数字：Plus 每 5 小时的本地消息估算，GPT-6 Astra 是 5–45 条，GPT-6.1 Sol 是 15–160 条，GPT-6 Luna 是 350–3000 条；官方强调这只是估算，不是固定上限。[20] Ultrafast 只在 Pro 500 和符合条件的 Enterprise、Edu 上提供，生成 token 最多快 8 倍，先扣计划内额度，用完再扣 credits；Pro 100 和 Pro 200 就算买了 credits 也用不了。[21] 据 TNW 报道，从 10 月 30 日起，Pro 200 在 Work 和 Codex 里的额度从 Plus 的 20 倍降到 10 倍；老用户保留旧额度到 10 月 29 日，并拿到一次性 2500 美元的 credits；OpenAI 表示不会给 Pro 200 恢复 5 小时上限。[22]

Theo（t3.gg）那期视频的简介说，500 美元档的 Ultrafast 模式能在 2 小时内把周额度用光。[23] 这是创作者的说法，我没看视频，也没有官方数据能核实。不过按 8 倍的扣减倍率算，2 小时 Ultrafast 相当于 16 小时标准速度的用量，这个量级并不离谱（判断）。

Simon Willison 认为，OpenAI 仍然允许把 Codex 订阅用于个人 API 调用，对重度 API 用户更划算，而 Anthropic 这笔新的 API 额度在一定程度上缩小了差距。[10] 我没有找到 OpenAI 对此的官方页面，只当作他的观点。

判断：两家都不公布周上限的具体数值，所以「每美元能跑多少小时 agent」没法比，能比的是机制。Anthropic 把提速放在订阅额度**外面**（Fast mode 只能单独付钱），OpenAI 把提速放在额度**里面**（按倍率扣）。前者账单清楚，但订阅用户想提速就得另掏钱；后者用起来顺手，但一个开关就能让周额度的消耗速度变成原来的 8 倍。撞线规则上，OpenAI 让当前这一轮跑完，Anthropic 是从周额度里拿一段固定额度收尾。两种做法都在解决同一个问题：长程 agent 不该在写文件写到一半时被掐断。

## 清单：拉长额度、给花费封顶

**先确认在用哪本账**

- 跑 `/status`，看 Login method 是订阅还是 API key；没打算按量付费，就清掉 shell 里的 `ANTHROPIC_API_KEY`。[4][7]
- 每周看一次 `/usage` 的 7 天视图和占比拆分，被标出来的「长上下文」「缓存未命中」就是最先该改的地方。[3]
- status line 挂上 `five_hour` 和 `seven_day` 两个百分比。[17]

**上下文卫生**

- 换不相关的任务时用 `/clear`（免费）；需要连续性才用 `/compact`，并告诉它保留什么，比如 `/compact Focus on code samples and API usage`；想放弃某条路，用 `/rewind` 回到已缓存的前缀，比压缩更省。[3][13]
- CLAUDE.md 控制在 200 行以内，按需的流程挪到 skills。[3]
- 关掉不用的 MCP server；有 `gh`、`aws` 这类 CLI 就优先用 CLI。[3]
- 用 PreToolUse hook 过滤测试输出，只留失败行；装语言服务器插件，用「跳转到定义」代替「grep 加读一堆候选文件」。[3]

**模型与 effort**

- 开会话时就选好模型和 effort，任务中途少切换，切换会让缓存失效。[13]
- 日常编码用 Sonnet 5.5，架构和难题再上 Opus，或者用 `opusplan`；effort 先用默认的 `medium`，确实不够再加，`max` 先试再推广。[3][11]
- Fast mode 只在真的需要低延迟时开，而且在会话一开始就开。[12]

**Subagents**

- 定义一个 `model: haiku` 的 `Explore`，让它返回路径、行号和代码片段，别只给摘要。[14][18]
- 提示超过 10 万 token 的 Haiku 5.5 子任务，记得它的单价是 5 倍。[9]
- agent teams 保持小规模，活干完就关掉 teammate。[3]

**无头运行和定时任务**

- cron、CI 用 `--bare` 加关联组织的 API key，吃每月 API 额度；同时设 `--max-budget-usd`、`--max-turns`，Console 里关掉自动充值、设 workspace 花费上限。[8][15][16][10]
- 检查有没有在空闲时触发的定时任务、跨会话消息、目标检查：不需要的话，`crossSessionInbound` 设为 `hold`，`CLAUDE_CODE_GOAL_CHECKIN_MINUTES` 设为 `0`。[3]
- `-p` 里不要用会扣 credits 的 Fable，它不会提示确认。[11]

**撞线策略**

- 长任务拆成能单独提交的小块，让收尾额度落在干净的检查点上。[1]
- 无人值守又不希望自动续跑，就把 `autoContinueAtUsageLimit` 关掉。[5]
- 开 usage credits 就设月度花费上限；记住这时主对话缓存只有 5 分钟。[3][13]
- 团队管理员可以用 `modelPricing` 让 `/usage` 和遥测按合同价显示；要按人实时归因，用 OpenTelemetry。[3]

## 查不到或没核实的

- 收尾额度到底多大、Team Standard 席有没有，ClaudeDevs 的帖子没写，我抓取的官方文档页里也没找到对这个机制的说明。
- 两家都没公布周上限的数值。2025 年 TechCrunch 报道过一组按小时算的估计，那是 Sonnet 4 / Opus 4 时代的数字，不能套用到现在。[19]
- OpenAI 帮助中心的 Pro 档说明页对我的抓取返回 403，Pro 200 额度调整的细节引用的是 TNW 的报道和 OpenAI 开发文档。[22][20]
- Theo 视频「2 小时用完周额度」只来自视频简介，没有核实。[23]
- `/usage` 和 `--max-budget-usd` 用的都是客户端估算，权威账单以 Console 或 claude.ai 的用量页为准。[3][16]

## 参考

1. ClaudeDevs（X），关于 5 小时上限优雅收尾的帖子，2026-09-25（UTC）：<https://x.com/ClaudeDevs/status/2103561342057943314>
2. ClaudeDevs（X），同一帖的适用范围跟帖，2026-09-25（UTC）：<https://x.com/ClaudeDevs/status/2103561343391735842>；IT之家转述，《Claude Code 新机制：AI 任务中途触发 5 小时上限将优雅收尾》，2026-09-26：<https://www.ithome.com/1/007/369.htm>
3. Anthropic，Claude Code Docs，《Manage costs effectively》：<https://code.claude.com/docs/en/costs>
4. Anthropic，Claude Code Docs，《Error reference》（Usage limits 一节）：<https://code.claude.com/docs/en/errors>
5. Anthropic，Claude Code Docs，《Interactive mode》（Wait for a usage limit to reset 一节）：<https://code.claude.com/docs/en/interactive-mode>
6. Anthropic，《Pricing》（计划、FAQ 与模型价目）：<https://claude.com/pricing>
7. Claude Help Center，《Use Claude Code with your Pro or Max plan》：<https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan>
8. Claude Help Center，《Monthly API credits for Max and Team plans》：<https://support.claude.com/en/articles/17154008-monthly-api-credits-for-max-and-team-plans>
9. Anthropic，《Introducing Claude Haiku 5.5》，2026-10-07：<https://www.anthropic.com/claude-haiku-5-5>
10. Simon Willison，《Claude Haiku 5.5》，2026-10-07：<https://simonwillison.net/2026/Oct/7/claude-haiku-5-5/>
11. Anthropic，Claude Code Docs，《Model configuration》：<https://code.claude.com/docs/en/model-config>
12. Anthropic，Claude Code Docs，《Speed up responses with fast mode》：<https://code.claude.com/docs/en/fast-mode>
13. Anthropic，Claude Code Docs，《How Claude Code uses prompt caching》：<https://code.claude.com/docs/en/prompt-caching>
14. Anthropic，Claude Code Docs，《Create custom subagents》：<https://code.claude.com/docs/en/sub-agents>
15. Anthropic，Claude Code Docs，《Run Claude Code programmatically》：<https://code.claude.com/docs/en/headless>
16. Anthropic，Claude Code Docs，《CLI reference》：<https://code.claude.com/docs/en/cli-reference>
17. Anthropic，Claude Code Docs，《Customize your status line》：<https://code.claude.com/docs/en/statusline>
18. Hu et al.，《Analyzing and Mitigating Cost-Inefficient Behaviors in Coding Agents》，arXiv:2609.30725：<https://arxiv.org/abs/2609.30725>
19. Maxwell Zeff，TechCrunch，《Anthropic unveils new rate limits to curb Claude Code power users》，2025-07-28：<https://techcrunch.com/2025/07/28/anthropic-unveils-new-rate-limits-to-curb-claude-code-power-users/>
20. OpenAI，Codex 文档，《Pricing》：<https://learn.chatgpt.com/docs/pricing>
21. OpenAI，Codex 文档，《Speed》：<https://learn.chatgpt.com/docs/agent-configuration/speed>
22. TNW，《OpenAI halves Pro 200 usage and launches a $500 ChatGPT plan at DevDay》，2026-09-29：<https://thenextweb.com/news/openai-devday-pro-200-usage-cut-pro-500-plan>
23. Theo（t3.gg），YouTube，《Does the $200 Codex plan suck now?》，2026-10-07（PT）：<https://www.youtube.com/watch?v=nYA0yASgaZI>
