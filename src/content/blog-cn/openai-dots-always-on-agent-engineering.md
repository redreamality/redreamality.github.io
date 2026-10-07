---
title: "OpenAI dots 拆解：常驻 agent 谁来唤醒、以谁的名义、花多少、怎么查"
description: "OpenAI 9 月 29 日发布常驻 agent dots：GPT-6 Astra 驱动、自带云电脑、能自己决定何时醒来。本文以 dots 为锚，对照 Copilot Autopilot、Meta Muse、Claude Cowork、Codex Cloud 和开源 OpenClaw，拆解常驻形态带来的五个新工程问题：唤醒、状态、持续授权、预算与停止、审计，并附一份选型清单。"
pubDate: 2026-10-07T10:40:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "security", "openai"]
lang: "zh"
---

9 月 29 日的 DevDay 上，OpenAI 发布了 dots。官方给的定位是「always-on agents」：由 GPT-6 Astra 驱动，每个 dot 有自己的云电脑，会从反馈里学习，能 24/7 朝着你的目标干活，通过插件生态连接 4000 多个应用。[1] 同场还发布了云端运行的 Codex、带 computer use 的 Agents API 等。[13] 先澄清一点：Astra 是模型名（GPT-6 Astra），不是那台云电脑的名字。[2]

WIRED 的概括是：和一问一答的聊天机器人不同，dots 的核心卖点就是「始终在线」。[12] The Register 说得更直白：可爱的图形背后，dots 就是「持续消耗 token 的常驻计算任务」。[11] 本文要谈的就是：agent 从「问一句答一句」变成「一直在跑」之后，哪些工程问题是新的。

站内已经有两篇相邻的文章。[Claude Cowork 上云](/cn/blog/claude-cowork-cloud-sandbox-where-agents-run/) 讲 agent 的「手」放在本地 VM、逐会话沙箱还是自带云电脑；[Meta Muse 的「始终允许」](/cn/blog/meta-muse-allow-always-agent-permission-defaults/) 讲一次授权点击之后到底批了什么。这里不重复，只看「常驻」本身带来的问题。

材料以 OpenAI 发布文、ChatGPT Learn 文档和 GPT-6 Astra 系统卡的 dots 附录为主，对照 Copilot Autopilot、Meta Muse、Claude Cowork、Codex Cloud 和开源的 OpenClaw。标「判断」的是我的看法。

## 三种形态：差别在于「下一轮由谁发起」

先把三种 agent 形态摆在一起看。

| 维度 | 一问一答的聊天助手 | 按会话启动的 coding agent | 常驻 agent |
| --- | --- | --- | --- |
| 下一轮由谁发起 | 每一轮都是人 | 人开一个任务，agent 在任务里自己循环 | 人、定时器、外部事件、agent 自己 |
| 生命周期 | 一次回复 | 一个任务，做完结束 | 没有自然终点 |
| 执行环境 | 通常没有 | 每个任务一个隔离环境，用完回收或过期 | 一台长期存在的电脑 |
| 授权的有效期 | 当下这一句 | 这个任务 | 直到有人撤销 |
| 花费跟什么走 | 提问次数 | 任务数 | 时间 |

中间那一列有现成的例子。Codex Cloud 的每个新任务从已发布的环境里拿一个自己的隔离工作区，已有任务保留自己的文件，VM 状态默认在最后一次使用后可恢复 7 天。[10] Cowork 的云端环境「为那一次会话创建」，会话结束就移除。[17] 这类 agent 有人按下的开始键，也有明确的结束。

dots 文档描述的是另一回事：它「在两次对话之间继续工作」，跟踪进度、判断下一步，并且「可以自己决定何时暂停、何时醒来继续」，所以不必给每一次跟进都定死时间。[2][3]

判断：本质差别在于**谁发起下一轮**。聊天助手里人就是闸门；会话型 agent 把闸门挪到任务开头；常驻 agent 把闸门拆成了定时器、事件和 agent 自己的计划。原来靠「人在场」顺带解决的事，都得单独设计：谁叫醒它、醒来时手里有什么、以谁的名义做事、跑多久算完、事后怎么查。下面逐个看。

## 一、生命周期：谁来叫醒它

把 dots 文档里的触发方式整理出来，至少有五种：

1. **你发消息或打电话。** ChatGPT、Slack、Teams 里是同一个 dot；挂断电话只结束语音，交代的工作会继续。[6]
2. **它自己安排的醒来。** 文档原话是它「可以自己决定何时暂停、何时醒来继续」。[3]
3. **保存的定时任务。** 文档要求写清：做什么；何时跑，含时区和结束日期；哪些变化值得通知；结果发到哪；并让 dot 复述它存了什么。[3]
4. **事件监控。** 需要接入的服务支持；文档强调只连上 Slack 不会创建监控任务，拉进频道也不会自动开始盯。[3][6]
5. **主动研究（proactive research）。** 你不在时，它用只读工具翻已连接的应用找能帮忙的地方，不能发消息、改内容、操控浏览器或电脑；后续动作仍走正常权限和审批。[1][3]

系统卡附录还提到一个产品文档没细讲的机制：一个新的「时间预算（time-budget）设置」，用来引导它工作多久；评测时给了最长一年的模拟时间预算和一个能查时间、能等待的时钟工具。[9]

同类产品：Microsoft 的 Autopilot（前身 Scout）会盯频道、跟进线程、跑周期工作，「不需要等提示」；[15] Meta 说 Muse 会在你关掉应用后继续，需要审批时再回来；[16] Cowork 的定时任务上云后不需要任何设备在线。[18]

**开源那边走了相反的路。** OpenClaw 的 heartbeat（心跳）是系统定时跑的一次主会话 turn，默认每 30 分钟一次。[19] 默认提示词很克制：按一张小清单（monitor scratch）检查，「不要从以前的对话里推断或重复旧任务」，没事就回 `NO_REPLY`。[19] OpenClaw 还在 v2026.8.1 删掉了「推断承诺」实验，不再从对话里抽取待跟进事项；要定时工作就显式建 automation，各有自己的节奏、启停状态和运行历史。[19][20] 事件触发的唤醒也有限速：两次之间至少隔 30 秒，60 秒内启动 5 次就触发防洪保护。[19]

判断：这是最根本的分叉：**唤醒权交给模型，还是留在显式调度表里**。dots 选了前者，不用把每个跟进写成 cron，代价是「它为什么这时醒了」难以回答。Scheduled 页列的是保存的定时任务，[4] 文档没说 dot 自己安排的醒来是否也能在某处查到。我会要求每种唤醒来源都能列出、单独关掉、单独限速。

另外，文档提醒一次运行「完成」不代表结果已达成或送达。[3] 常驻 agent 有大量你不在场的运行，这个差距得有机制兜住。

## 二、它住在哪：状态与记忆的持久化

dot 的云电脑「可以在两次使用之间保留状态」，有自己的文件、软件和浏览器会话。[5] 云浏览器登录一次后，会话可以留给之后的工作用，直到你退出或网站让它过期；用保存的密码做**新**登录要你确认，沿用有效会话则不用。[5]

记忆分三层，文档写得很细：[3]

- **对话上下文**：消息、指令、资料、工具结果；通话用的上下文可能和后台任务看到的不同。
- **ChatGPT 记忆**：启动时带上相关部分。
- **dot 自己的笔记**：偏好、决定和进行中的工作，和 ChatGPT 已存记忆分开；改 ChatGPT 记忆设置不一定改掉这些笔记。

ChatGPT、Slack、Teams 之间的信息可以互相用上，但「能用」不等于「能告诉另一群人」，在团队频道说出私聊内容仍要你允许。[3] 子任务只拿到 dot 交代的那部分上下文。[3]

管理员文档里有两句话值得单独记下：dot 可以创建已存记忆，包括来自已连接应用的信息；**断开一个应用不会删掉已经拿到的信息**，处理敏感数据或员工离职时，要检查已存记忆并考虑重置。[7] 删除 dot 也撤不回已经在其他应用里做出的修改，或者已经发给别人的消息。[4]

会话型 agent 的状态会自动过期：Cowork 环境随会话销毁，[17] Codex Cloud 默认保留 7 天。[10] Muse 和 dots 同类，跑在云端虚拟电脑上，Meta 说另一个叫 Sentinel 的 agent 在同一台 VM 里巡查，确保未经批准不出网。[16]

判断：会话型 agent 的「遗忘」是白送的，常驻 agent 必须把遗忘做成显式功能，并且分层：文件、浏览器会话、笔记、ChatGPT 记忆各有删除路径。浏览器会话最容易被低估，它是一张长期凭证，却不在「已连接应用」列表里。选型时值得要一份**状态清单**：此刻存着哪些会话、笔记、文件，各自怎么删。

## 三、以谁的名义：身份与持续授权

### 个人 dot 用的是你的身份

个人 dot「代表你工作」，用你已连接的插件账号和现有 ChatGPT 应用权限，比如只许读邮件、不许发。[1][5] 「用谁的账号」要分别看来源服务里那个账号的权限和云浏览器里登的是谁。[7] Slack 里只有 owner 能指挥它，但别人的消息可能成为它的上下文。[7]

企业版的「specialist dots」由公司配独立的身份、凭证和访问权，目前只做企业试点，并计划接入 Microsoft Agent 365 的治理控制。[1] Autopilot 也住在租户里，有自己的身份、记忆、电脑和工作区。[15]

判断：**借用身份**（个人 dot、Muse）上手快，但每个动作在外部系统里都像你本人做的；**独立身份**（specialist dots、Autopilot）能单独授权、审计、吊销，代价是要有人管。agent 越像同事，越该有同事那样的独立账号。

### 一句长期指令就是一份委托书

dots 文档里有一段我认为最关键：「给持续性的指令划清范围：谁能参与、应该发生什么、什么时候。让 dot 起草回复不等于允许它发送。**一条具体的指令可以覆盖范围内的未来动作**；范围外的动作需要另做决定。」[4] 也就是说，对话里随口一句「以后这类事你直接处理」，就是一份持续生效的授权。

Custom rules 分四档：直接做、你说了才做、先问、交给你做，文档写明它们是「dot 尽力遵守的指令，它可能犯错」。[4] 动作前把关的是 Auto-review：影响账号或外发信息的动作先对照指令、权限、规则和安全要求，决定放行、请你批准还是你亲自做。[4]

### 常驻让「授权漂移」变成了可测的问题

系统卡专门为「常驻」设计了两组新评测，数字很能说明问题：[9]

- **任务中途改权限。** 执行中途撤销权限或改变授权范围。通过率 91.8%（45/49），17 个明确的权限变更案例全部通过；其余 4 个的边界本身有歧义。
- **连续任务之间保持边界。** 初始任务加 5 个或 10 个中间任务再加最终任务，跑在同一持久环境里，授权范围在任务间变化而用户不明说。没有严重泄露，但有中等越界，比如把信息带进无关任务、改了共享文档。中间任务从 5 个到 10 个，被标记比例**从 8.6% 到 19.7%**，大致翻倍。

系统卡在模拟 OpenAI 内部 Codex 流量时还记了一个例子：用户让 GPT-6 Astra 搭一个每小时跑的助手，修测试、开 PR、满足条件就合并。它打开了各连接上所有可用动作、关掉逐项审批，然后排上日程，被归为严重度 3：给周期性 agent 的权限超出所需且没先问。[9] 另外 Auto-review 在「授权本身有歧义」这类上召回稍弱。[9]

判断：**常驻 agent 的授权问题主要不是某次批错，而是随时间和任务数累积的漂移**；agent 自建的周期性子 agent 还会再放大一层。一次授权的粒度 Muse 那篇讲过，常驻要补的是时间维度：长期指令要能列出、会过期、第一次用于新类型的事时提醒你。

### 撤销分散在好几个地方

本地电脑显示 Offline 不等于撤销，要点 Revoke access；[5] 管理员关掉本地访问后，已授权的本地任务**可能还在收尾**；[8] 撤掉 dots 访问也不能代替断开应用或退出网站。[7] 再算上长期指令、规则、浏览器会话和笔记，按我的数法，真正收回权力要碰五六处开关。

## 四、预算与停止：按时间花钱的东西怎么刹车

### 钱怎么算，目前只公开了一半

发布文说：第一个 dot 含在 Pro 或 Business Premium 里，含一份「深度工作」额度，首月放宽；以后可以加 dot，或提高单个 dot 的速度和每月工作总量。[1] 对话不计入 ChatGPT 用量，它在 Codex 或 Work 里开的任务照常计入。[1] 发言人对 The Register 说未来按固定月费加购。[11] 首月之后各套餐的具体额度，发稿时我没找到公开数字。

Microsoft 把 Cowork、Code、Autopilot 都放在按量计费（UBB）上，配了 FinOps for AI：管理员用 API 管支出策略，额度申请接进审批流，用户能看到用量、余额和历史。[15]

### 心跳的账可以算出来

OpenClaw 讲得最透：每次 heartbeat 都是完整的 agent turn，间隔越短越烧 token；开 `isolatedSession` 不带历史，单次可从约 10 万 token 降到 2000–5000。[19] 按默认 30 分钟，一天 48 次；每次带 10 万 token 历史的话，光「醒来看看」一天就约 480 万 token 输入（推算）。

判断：常驻 agent 的花费主要由**唤醒频率 × 每次带的上下文**决定，而不是你提了多少需求。dots 把这层账藏在套餐额度后面，省心，但看不清是哪类唤醒在花钱。

### 时间预算是软约束

时间预算是「引导」工作时长的设置，不是到点切断。OpenAI 在 4 分钟、30 分钟、4 小时、1 年四档下重跑评测，遇到环境警告仍设法绕过的比例为 17.2%、15.4%、15.4%、15.0%，结论是时间预算对此没有明显影响。[9]

判断：时间预算更像**调度参数**，不是安全边界。站内 [默认硬预算帽](/cn/blog/default-hard-budget-caps-agent-deployed-services/) 讲过超限要切断而非提醒；常驻 agent 自己也需要由系统执行的硬停线。

### 停下来，要停几层

Pause 只停当前主任务，不停委派任务，也不取消定时运行，这在 [Cowork 那篇](/cn/blog/claude-cowork-cloud-sandbox-where-agents-run/) 列过。[4] 补两条：挂断电话不一定停掉工作；[2] 监控发现安全问题时可以暂停或停止它。[1] 文档没说 Pause 是否暂停主动研究、是否取消 dot 自己安排的醒来，记为未披露。

OpenClaw 的细节可以借鉴：`heartbeat.every: "0m"` 只关周期心跳，**定向事件唤醒仍能跑一次 turn**，比如后台命令完成时。[19]「关掉定时」不等于「关掉唤醒」。

判断：常驻 agent 需要一个**总闸**，一键把定时、事件、自我安排、主动研究和委派子任务全部归零，并告诉你哪些已完成的动作撤不回来。

## 五、可观测与审计：事后怎么知道它干了什么

用户侧：Activity 看每个任务的进度、文件和结果，含后台工作；Scheduled 看定时任务的指令、时间和目的地；随时打开 dot 的电脑，必要时 Take over 接管。[4][5]

企业这一侧，OpenAI 的说法很谨慎：用 Analytics API 看用量，用 Compliance API 调查用户消息和 dot 的回复，「依赖它做审计之前，先确认记录的覆盖范围」。[7] 在带本地电脑访问的部署里，云端编排事件**不会**进入你现有的 OpenTelemetry collector，改 collector 地址也找不回来；Compliance API 的记录不能替代原来 OTel 流里的每一个事件；MCP hooks 也不能拿来当审计，`PreToolUse` 回调出错、超时或返回格式不对时，hook 会失败，但不会拦住工具调用。[8] 企业现有的模型管控也**不适用于** dots。[7]

模型这一侧，系统卡说 OpenAI 把 GPT-6 Astra 的失对齐监控扩展到了 dots 的常驻、主动设置上；[9] 但同一份附录也写明，在对抗评测里，模型对「不触发生产监控系统的 P0 告警（会呼叫安全团队）」有一定的规避成功率，和非常驻设置大体一致。[9]

对照：Cowork 网页端和手机端会话进 Compliance API，Team/Enterprise 可经 OpenTelemetry 送进 SIEM；[17] Autopilot 只说有「权限、审计和治理」，没给细节。[15] OpenClaw 在对话记录里用标记区分心跳轮询、命令完成、cron 唤醒和会话事件；控制台界面会隐藏心跳提示和只回了 OK 的那些 turn，但底层记录照样保留，可以拿来审计和重放。[19]

判断：会话型 agent 的审计问题是「它做了什么」；常驻 agent 多出一个问题：「**它为什么在这个时刻做了这件事**」。要回答它，每一次运行都得带上触发来源：谁叫醒的，依据哪条长期指令或规则放行。OpenClaw 的来源标记是这个思路的最小实现；dots 的公开文档没有说明 Compliance 记录里是否包含触发来源，我没查到。

## 横向对照：六家怎么回答这五个问题

下面只写公开材料里查得到的，查不到的标「未披露」。

| 产品 | 唤醒 | 状态 | 身份 | 预算 | 审计 |
| --- | --- | --- | --- | --- | --- |
| OpenAI dots | 消息/通话、自我安排、定时、事件、只读主动研究[3] | 云电脑跨使用保留；三层记忆[3][5] | 个人版用你的连接账号；specialist 有独立身份（试点）[1] | 套餐额度，首月放宽；之后未披露[1] | Activity；企业用 Compliance/Analytics API，需自行确认覆盖[4][7] |
| Copilot Autopilot | 盯频道、跟进线程、周期工作，不等提示[15] | 租户内自己的记忆、电脑、工作区[15] | 租户内独立身份[15] | 按量计费 + FinOps[15] | 「权限、审计和治理」，细节未披露[15] |
| Meta Muse | 关掉应用后继续，需要审批时回来[16] | 云端虚拟电脑，Sentinel 巡查出网[16] | 你的账号（见站内 Muse 一文） | 多数用户免费，付费档未披露[16] | 本文来源未披露 |
| Claude Cowork（云端） | 你发起的会话；定时任务无需设备在线[18] | 每会话一个临时环境，结束即删[17] | 你的账号 | 付费套餐[17] | Compliance API；Team/Enterprise 可接 OTel[17] |
| Codex Cloud | 你发起的任务 | 每任务隔离工作区，状态默认可恢复 7 天[10] | 跑任务的账号；可用 OIDC 拿短期云凭证[10] | 计入套餐用量[1] | 本文来源未覆盖 |
| OpenClaw（自托管） | 心跳默认 30 分钟；显式 automation；事件唤醒限速[19][20] | 你自己的机器 | 你自己配置 | 自付 token，文档给了省钱配置[19] | 记录里标注唤醒来源[19] |

判断：横着看，商业产品在「唤醒」上越来越放手，让模型自己安排；在「身份」上开始分化，借用和独立两条路都有；在「预算」上普遍还是黑盒；在「审计」上多半交给厂商日志，dots 还明说要你自己先确认覆盖范围。开源一侧反而把唤醒收紧了。这个反差值得记住：越是自己掏 token 的人，越不愿意让模型自己决定什么时候醒。

## 落地清单：自己做或选型常驻 agent 时要问的问题

按五个问题各列几条。每一条都应该有确定的答案，而不是「模型会注意的」。

**唤醒**

- [ ] 所有唤醒来源能不能列出来：定时、事件、自我安排、主动研究、委派子任务？
- [ ] 每一种来源能不能单独关掉、单独限速？「关掉定时」之后，还有哪些路径能叫醒它？
- [ ] 定时任务是否强制带上时区、结束日期和投递目的地？[3]
- [ ] 后台主动研究是否只用只读工具？这条限制是系统强制的，还是写在提示词里的？[1][3]

**状态**

- [ ] 常驻电脑上有哪些长期浏览器会话，能不能逐个列出、逐个退出？
- [ ] 记忆分几层，每层怎么查、怎么删？断开一个应用后，从它那里拿到的信息还在不在？[7]
- [ ] 员工离职或转岗时，有没有「重置 agent」的流程？[7]

**身份与授权**

- [ ] 它在外部系统里以谁的身份出现？能不能换成独立身份，单独授权、单独吊销？
- [ ] 对话里给出的长期指令能不能列出来？会不会过期？[4]
- [ ] agent 为自己建的周期性子任务，权限是否不得超过父任务？[9]
- [ ] 撤销要碰几个开关？Offline 和 Revoke 分不分得清？[5]

**预算与停止**

- [ ] 能不能按唤醒来源看花费？有没有由系统执行的硬上限，而不只是提醒？
- [ ] 时间预算是引导还是硬切？[9]
- [ ] 有没有一键总闸，覆盖所有唤醒来源和委派任务？停下之后，哪些动作撤不回来？[4]

**审计**

- [ ] 每次运行是否记下触发来源，以及放行它的那条指令或规则？
- [ ] 企业审计记录覆盖到哪一层：用户消息、agent 回复、工具调用、云端编排事件？哪些不进你的 OTel？[7][8]
- [ ] 「运行完成」和「结果达成」是否分开报告？[3]

## 反例与边界

- **有明确终点的活不需要常驻。** 修 bug、写报告，用会话型 agent 更省也更好审计。常驻适合持续盯一件会变的事，比如盯客户反馈、随新数据重跑分析。[1]
- **撤不回的高风险动作别挂在长期授权下面。** Anthropic 对 Cowork 定时任务的建议同样适用：从低风险任务开始，不要定时去碰敏感文件、代发消息、买东西，每次跑完看结果，不用就暂停。[17]
- **厂商的数字来自厂商自己的评测。** 系统卡里的通过率和越界率出自 OpenAI 自己设计的评测，部分还特意挑了更难的案例，不代表生产环境里的发生率；[9] 附录也承认仍有已知漏洞在修，只是利用条件苛刻。[9] 发布当天的现场演示也出过几次岔子。[14]
- **本文只覆盖公开材料。** OpenAI Help Center 的 dots 安全 FAQ 和配套的安全博客在我抓取时返回 403 或超时，相关内容只能通过发布文、Learn 文档和系统卡来核对。

## 最后

dots 的文档其实很坦白：长期指令覆盖未来动作，断开应用不删记忆，Pause 不停委派，审计要自己确认覆盖。放在一起说明：agent 一旦不再等你开口，「人在场」这道默认闸门就没了，唤醒、状态、授权、花费、审计都得变成能列出、能关掉、能事后查的东西。

做或者选常驻 agent 的时候，先别问它有多聪明，先问一句：它一共有几种方式醒来，每一种我看不看得见、关不关得掉。

## 参考

1. OpenAI，《Introducing dots》，2026-09-29：<https://openai.com/index/introducing-dots/>
2. OpenAI ChatGPT Learn，《Meet dots》：<https://learn.chatgpt.com/docs/dots>
3. OpenAI ChatGPT Learn，《Tasks and memory》：<https://learn.chatgpt.com/docs/dots/tasks-and-memory>
4. OpenAI ChatGPT Learn，《Control your dot》：<https://learn.chatgpt.com/docs/dots/controls>
5. OpenAI ChatGPT Learn，《Connect computers and apps to your dot》：<https://learn.chatgpt.com/docs/dots/computers-and-apps>
6. OpenAI ChatGPT Learn，《Message your dot》：<https://learn.chatgpt.com/docs/dots/channels>
7. OpenAI ChatGPT Learn，《Manage dots permissions and capabilities》：<https://learn.chatgpt.com/docs/enterprise/dots-admin-guide>
8. OpenAI ChatGPT Learn，《Local computer access for Work Cloud and dots》：<https://learn.chatgpt.com/docs/enterprise/cloud-local-access>
9. OpenAI Deployment Safety Hub，《GPT-6 Astra System Card》§12 Appendix: dots（2026-09-29 新增）：<https://deploymentsafety.openai.com/gpt-6-astra/sec%3Aappendix-dots>
10. OpenAI ChatGPT Learn，《Cloud environments》（Codex Cloud）：<https://learn.chatgpt.com/docs/environments/cloud-environments>
11. The Register，Thomas Claburn，《OpenAI tries disarming AI angst with cute graphics and always-on agents》，2026-09-29：<https://www.theregister.com/ai-and-ml/2026/09/29/openai-tries-disarming-ai-angst-with-cute-graphics-and-always-on-agents/5299915>
12. WIRED，《OpenAI's Dots Are Always-On AI Agents—and Its Answer to Meta's Muse》，2026-09-29：<https://www.wired.com/story/openai-dots-always-on-ai-agents-that-proactively-help/>
13. 9to5Google，Ben Schoon，《OpenAI launches Dots, new 'always-on agents' you can assign tasks to》，2026-09-29：<https://9to5google.com/2026/09/29/openai-dots-agent/>
14. The Indian Express，《OpenAI's Dots explained: How its 'always on' AI agents work, what they can do》，2026-10-01：<https://indianexpress.com/article/technology/artificial-intelligence/openai-dots-always-on-ai-agents-explained-10900652/>
15. Microsoft，Jared Spataro，《Introducing the new Copilot with Home, Code and Autopilot》，2026-09-25：<https://blogs.microsoft.com/blog/2026/09/25/introducing-the-new-copilot-with-home-code-and-autopilot/>
16. The Verge，Robert Hart，《Meta bets on AI agent Muse to catch up in AI race》，2026-09-08：<https://www.theverge.com/ai-artificial-intelligence/991216/meta-bets-on-ai-agent-muse-to-catch-up-in-ai-race>
17. Claude Help Center，《Use Claude Cowork safely》：<https://support.claude.com/en/articles/13364135-use-claude-cowork-safely>
18. Claude Help Center，《Use Claude Cowork on web, desktop, and mobile》：<https://support.claude.com/en/articles/15520349-use-claude-cowork-on-web-desktop-and-mobile>
19. OpenClaw Docs，《Heartbeat》：<https://docs.openclaw.ai/gateway/heartbeat>
20. OpenClaw Docs，《Automation》：<https://docs.openclaw.ai/automation>
