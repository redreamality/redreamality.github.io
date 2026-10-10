---
title: "Gemini Enterprise 的 agent 有了自己的工作邮箱：把 agent 当同事，身份、审计、花费三件事怎么管"
description: "Google 在 Gemini at Work 2026 发布 Gemini Enterprise 的统一 agent：给目标不给指令，委派 subagents、加载 skills、接任意 MCP，同事型 agent 有独立 Workspace 账号。本文对照 OpenAI dots、Claude Cowork、Meta Muse 拆身份、审计、花费三件套，并讲 Gems 改 skills 的方向，附上线前检查清单。"
pubDate: 2026-10-10T11:35:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "security", "mcp", "Agent Skills"]
lang: "zh"
---

10 月 8 日的 Gemini at Work 2026 上，Google Cloud CEO Thomas Kurian 发布了 Gemini Enterprise 里的「Gemini agent」，说法是「一个面向工作的通用 agent」。最常被引用的一句是：**你给它目标，不给它指令**（objectives, not instructions）[1]。TechCrunch 的 Sarah Perez 当天跟进（10 月 8 日 11:18 PDT，即北京时间 10 月 9 日 02:18）[2]，The Verge 的 Emma Roth 也写了（10 月 8 日 14:28 UTC，即北京时间 10 月 8 日 22:28），并说明这个 agent 目前只对企业客户开放私有预览 [3]。

发布会内容很多，这篇不逐条复述，只抓一条线：**当一个 agent 被设计成「同事」——有自己的邮箱、日历、Drive，在通讯录里有名字，能被 @——企业要提前想清楚三件事：它以谁的身份做事、做了什么能不能查到是谁让它做的、花多少钱由谁来踩刹车。** 我把这叫治理三件套。Google 这次三件都正面写了，但写了不等于讲清了，没讲清的地方后面会列出来。

站内这条线已经铺过几块砖：[OpenAI dots 拆解](/cn/blog/openai-dots-always-on-agent-engineering/)讲常驻 agent 的唤醒、授权与预算，[Claude Cowork 改到云端执行](/cn/blog/claude-cowork-cloud-sandbox-where-agents-run/)讲 agent 的「手」放在哪，[Meta Muse 的「始终允许」](/cn/blog/meta-muse-allow-always-agent-permission-defaults/)讲一次授权批出去了什么，[默认硬预算帽](/cn/blog/default-hard-budget-caps-agent-deployed-services/)讲超限要切断而不是提醒。这篇把 Gemini Enterprise 放进同一张表对照，再说 Gems 改 skills 透露的方向，最后附上线前清单。

## 先把发布内容理清：一个 agent，两种用法

按 Google 的一级源 [1]，Gemini agent 有几条架构原则，跟治理相关的是这几条：

- **统一入口、到处可用。** 聊天、自主完成目标、写代码都在同一个界面和 API 里，可以派活、排定时任务或响应事件；Web、手机、桌面、命令行、Workspace、Microsoft 365、Slack 都能进，还能作为 headless agent（没有专属界面、嵌在第三方应用里跑）。
- **在云端持续执行。** 各设备共用一套记忆和上下文，几小时甚至几天的活，合上电脑也会继续。
- **多 agent 编排。** Gemini 能临时拉起一批 subagent——为某项具体工作临时创建、**每个都有自己的身份**——并行或串行地协作，可以跑几小时到几天。
- **同事型 agent（coworker agent）。** 跟临时 subagent 不同，它有持久、明确的角色，跨天、跨会话地存在，有专属身份，包括自己的 `@agents.company.com` 邮箱和持久存储，**只能接触你或同事提供给它的上下文** [1]。
- **工具与 skills 注册表。** 能连 Confluence、Slack、Jira、Salesforce、BigQuery、Snowflake 等，也能连公司网络内外**任意 MCP server**，并有企业工具注册表和 skills 注册表 [1]。
- **模型可选。** agent 和底下的模型分开：默认它自己挑模型，目前能在 Gemini 系列和 Anthropic 的 Claude 之间编排，以后会加别的私有模型和开源模型 [1][2]。

TechCrunch 补了一级源里不够显眼的细节：用户可以在「tasks inbox」里看到 Gemini 的思考过程、委派给哪些 subagent、加载了哪些 skill、写的代码和进度；模型默认由 AI 挑，用户也可以自己选 [2]。

在 Workspace 里，你描述需要的角色，Gemini 就创建一个同事型 agent：它有自己的 Workspace 账号、邮箱、日历、Drive，出现在公司通讯录里。同事把它拉进 Chat 群或 @ 它就能协作；在文档评论里点名它，它会提修改建议并回复，**版本历史里显示的是它自己的名字** [1]。TechCrunch 的说法是，它知道公司里谁在哪个团队、在哪个时区、**谁需要审批什么**，执行动作时写下的审计记录归在 agent 名下，而不是某个人 [2]。

TechCrunch 说早期测试者包括运动品牌 On、Shopify 和 PayPal [2]。Google 原文更具体：On 测试的是动态选模型；Shopify 和 PayPal 是作为大规模用多模型的例子被提到——Shopify 为数百万商家混用前沿模型，PayPal 每周路由 1000 万次多模型请求 [1]。

上线状态先交代清楚：目前是企业客户私有预览 [3]，官方 FAQ 把多步骤后台委派、移动和桌面访问、第三方模型选择列为早期访问功能 [4]，大部分发布没有定价和 GA 日期 [5]。下文讨论的是**设计意图**，不是已经能在生产里验证的行为。

## 为什么「当同事」会把治理问题逼出来

Google 在发布稿里自己列了四个问题，是整篇最值得抄下来的部分 [1]：

1. 这个 agent 是谁，它有什么身份？
2. 它被允许做什么，拿到了什么权限？
3. 它做了什么，我在哪里能看到？
4. 它绝对不能碰什么？

Google 的回答是：前三个靠身份、策略和可观测性，第四个靠 Agent Gateway——进出 agent 的流量都过这道 AI 防火墙，策略写一次、对公司所有 agent 生效（例：「不得打开 Need to Know 文档」）；agent 在自带网络边界的 Agent Sandbox 里执行 [1]。

聊天助手时代这些问题不尖锐，因为每句话你都看着、每个动作都是你点的确认。一旦变成「给目标、过几天回来看结果」，中间的读、写、外发、花钱都发生在你没盯着的时候。这时要问的是：出了事，**能不能定位到哪个 agent、替谁干的、谁批的，能不能在钱烧穿之前停下来**。

第四个问题我并进身份一节。下面每节先说 Google 怎么做，再对照同类产品，最后说缺口。

## 身份：agent 以谁的名义做事

### Google 的做法：给 agent 发一张「工牌」

每个 agent 都有自己的身份，**经过密码学证明（cryptographically attested），像员工一样被管理**，按最小权限；身份盖进工作日志，也带进它拉起的虚拟机 [1]。权限按角色、由安全管理员审批；连外部系统时经 OAuth 映射传递 [1]。

同事型 agent 更进一步：完整的 Workspace 账号，以**自己的身份**行事，只看你共享给它的东西；访问跟随团队现有共享，Google 强调没有外部连接器持有你的数据 [1]。

Futurum 的评价是：企业会用管员工的那套流程来开通、授权和审计 agent；Microsoft 在 Entra 里也在做 agent 身份，这正在变成企业 agent 平台的标配 [5]。

### 同类产品怎么做

- **OpenAI dots：个人版借你的身份，专家版才有自己的。** 个人 dot 用你已连接的应用和现有的 ChatGPT 应用权限；专家型 dot（specialist dots）由公司给它配独立的身份、凭证和访问权，目前只做企业试点，并计划接入 Microsoft Agent 365 的治理控制 [6]。管理员文档还写了两条容易漏的：企业现有的模型管控和默认设置**不适用于** dots；撤掉 dots 访问也不能代替断开应用、退出网站 [7]。
- **Claude Cowork：始终是你。** 云端每个会话一个隔离的临时环境，连不到你家或公司的网络，结束即删除；但 Anthropic 明说，隔离限制的是代码在哪跑，**不限制它读什么、做什么** [8]。文档专门有一节「你的责任」：Claude 代表你做的所有动作，包括定时任务，都由你负责 [8]。
- **Claude for Google Workspace：权限跟着你的 Google 共享走。** 侧栏 add-on 默认是「Ask before edits」，每个改动弹审批卡；切到「Accept all edits」就一路改下去；配套的 Docs/Sheets/Slides 连接器（beta）的访问范围等于你现有的 Google 共享权限 [9]。
- **Meta Muse：一次「始终允许」，变成长期代你发消息的权力。** YouTuber Matt Robb 让 Muse 代管 Facebook Marketplace，在「Allow One Time / Allow Always」里选了后者，以为接受报价前还会再问；结果这等于授权 Muse 以后用它拼的模板代他发消息，模板里带着取货住址，住址就这样发给了出价的陌生人，低价也被接受了 [10]。

### 判断：独立身份解决了归属，也带来了三个新问题

借用身份（个人 dot、Cowork、Muse）上手快，但在外部系统看来，每个动作都是你本人做的。Muse 事件的根子就在这里：消息以 Robb 的名义发出，权限边界只剩那一次点击。独立身份（Gemini 同事型 agent、specialist dots）让 agent 能单独授权、审计、吊销，方向是对的。

但它带来三个新问题，Google 发布稿里都没展开：

1. **「只看你共享给它的」等于把共享设置变成了权限系统。** 同事型 agent 的访问跟着团队现有的共享和成员关系走 [1]。公司 Drive 本来就共享得松的话，agent 一进部门群就全继承了。上线前先查共享，再查 agent。
2. **subagent 每个都有身份，身份数量会膨胀。** 一级源说临时 subagent「各有自己的身份」[1]。归属是细了，但任务结束后这些身份是否吊销、权限能不能超过父 agent，发布稿都没说。
3. **agent 账号的「主人」是谁。** 员工离职有交接流程，创建 agent 的人离职、调岗时它归谁？Futurum 提到 Google 不打算对同事型 agent 按席位收费 [5]，门槛低了，agent 账号也可能比员工账号长得更快。

## 审计：记录要回答「谁、替谁、谁批的」

### Google 的做法：动作归到 agent 名下，身份带进虚拟机

一级源写得很明确：Gemini 做的每个动作都写进审计记录，**归属到 agent 而不是某个人**；因为身份会带进它为跑代码而拉起的虚拟机，你可以用 Google 的可观测性工具实时盯这些日志，在异常行为造成后果之前发现它 [1]。面向用户的一侧是 tasks inbox：能看到思考、委派、技能加载、代码和进度 [2]；文档里的修改会以 agent 的名字出现在版本历史里 [1]。

### 同类产品怎么做

- **dots**：用户侧有 Activity 视图看后台工作；企业侧用 Compliance API 调查用户消息和 dot 的回复，并且文档原话是「依赖它做审计之前，先确认记录的覆盖范围」[7]。
- **Cowork**：网页端和手机端的会话会进 Compliance API；Team 和 Enterprise 的管理员可以通过 OpenTelemetry 把 Cowork 事件推到 SIEM 和可观测性工具 [8]。
- **Claude for Workspace**：Enterprise 套餐的 Compliance API、客户自管密钥（CMEK）和 OpenTelemetry 审计导出同样覆盖这个 add-on [9]。

### 判断：「归到 agent」还不够，要能追到发起人和批准人

审计要回答的其实是三个问题：**谁做的、替谁做的、谁批准的。** 只归到 agent 名下，第一个回答了，后两个没有。一个同事型 agent 服务整个团队，三个人在群里给它派活，它又拉起五个 subagent；事后查一封外发邮件，只看到「events-coordinator@agents.公司」发的，远远不够。TechCrunch 说 agent 知道「谁需要审批什么」[2]，但发布材料没说审计记录里是否带着**委派链**（谁派的活、经过哪个父 agent）和**审批记录**（哪条策略放行、哪个人点了确认）。这一条我没查到，记为未披露，上线前要找 Google 要样例日志。

还有两条值得记住：

- **tasks inbox 不是审计日志。** 它是给派活的人看的、方便纠偏；审计是给安全和合规看的、事后不能改的记录，保留期限、导出、防篡改的要求都不一样。
- **日志得放在 agent 改不到的地方。** 站内[那篇 trace 篡改的论文解读](/cn/blog/llm-agents-tamper-own-traces-append-only-audit/)讲过：很多本地 harness 把会话记录放在 agent 可写的路径里，审计在主机内就失效了。Google 把身份盖进日志、交给平台侧工具，方向对；但 agent 身份**没有**权限改删这些日志这一点，要实测，不能只信架构图。

## 花费：上限要能真的停下来

### Google 的做法：项目级实时花费上限，触发即暂停

Google 的背景说法是：2024 年以来每 token 价格降了 98%，但企业 AI 用量暴涨，简单循环都走顶级模型，预算很快扛不住 [1]。对策有三条：多模型编排、Smart Routing 自动给负载分配性价比最高的模型，以及**实时花费上限**——在 Cloud Billing 控制台给一个项目的 AI 支出设硬上限，由 Gemini 执行；它监控 token 用量和沙箱成本，触发上限后该项目的 agent 暂停，你可以在控制台一键恢复；因为按项目计，公司可以把 AI 成本分摊回各部门 [1]。

### 现有 Spend Caps 文档里藏着的边界

Cloud Billing 里已经有一个 Spend Caps 功能，站内[硬预算帽那篇](/cn/blog/default-hard-budget-caps-agent-deployed-services/)讲过。它的文档（10 月 7 日 UTC 更新）写了几条硬边界 [11]：

- 只能针对**单个项目里的单个合格服务**，周期固定为按月；文件夹、组织、标签、多项目或多服务的预算都不在范围内。
- 用按标价估算的毛成本来触发，所以比账单报表快，但**执行不是瞬时的**，延迟期间的超额照常计费；文档建议把上限设得比你的真实底线略低。
- 触发后**新**用量暂停，正在处理的请求会跑完并照常计费；持久资源（计算、存储）的固定费用继续计。
- 手动解除后，本周期内**不会再触发**，除非你调高上限。
- **订阅类费用不在范围内，文档原话举的例子就是 Gemini Enterprise 订阅。**

文档里列的合格服务是 Gemini API、Gemini Enterprise Agent Platform（原 Vertex AI）、Cloud Run 和 Cloud Run functions [11]。Gemini agent 的上限是否建在这套机制上、token 和沙箱费用算在哪个服务下、「一键恢复」是否也意味着本周期不再触发——发布稿没说，文档也没写到 agent。建议按这份文档的语义做最坏假设：**上限不是瞬时的，解除后不会再自动保护你。**

### 同类产品怎么做

- **dots**：第一个 dot 含在 Pro 或 Business Premium 里，带一份「深度工作」额度，首月放宽；以后可以加 dot 或提高单个 dot 的工作量；它在 Codex 或 ChatGPT Work 里开的任务照常计入用量 [6]。站内 dots 那篇讲过，它的「时间预算」更像调度参数，不是安全边界。
- **Cowork / Claude for Workspace**：按付费套餐使用 [8][9]，公开材料里没看到针对单个任务或 agent 的硬上限。
- **Futurum 的提醒**：同事型 agent 不按席位收费 [5]，成本问题就转到 Google 怎么计量 agent 的活动上，而计量方式还没公布。

### 判断：按项目设帽，粒度不一定对得上 agent

按项目设上限、按项目分摊，对财务很友好。但「项目」和「agent」不是一回事：一个同事型 agent 可能服务好几个团队，一个项目里也可能跑好几个 agent 和一堆 subagent。触发时停的是整个项目，还是花钱最多的那个？长任务停在一半，已发出的邮件、改了一半的表怎么办？这些都得在试点里实测。另外 agent 花的不只是 token：沙箱、数据作业、它部署出去的服务各自计费，项目上限不一定都覆盖。

## 横向对照：四家怎么回答三件套

只写公开材料里查得到的，查不到的标「未披露」。

| 产品 | 身份 | 审计 | 花费 |
| --- | --- | --- | --- |
| Gemini Enterprise 的 Gemini agent | 每个 agent 自有身份、密码学证明；同事型 agent 有独立 Workspace 账号和 `@agents.company.com` 邮箱；subagent 各有身份 [1] | 每个动作写入审计记录、归到 agent；身份带进 VM 日志；tasks inbox 展示过程 [1][2] | 项目级实时花费上限，触发即暂停、一键恢复；多模型与 Smart Routing [1]；定价未披露 [5] |
| OpenAI dots | 个人版用你的连接账号；specialist dots 有独立身份（企业试点）[6] | Activity 视图；Compliance API，需先确认覆盖范围 [7] | 套餐内额度；以后可加量 [6] |
| Claude Cowork（云端） | 你的账号；会话级隔离沙箱 [8] | Compliance API；Team/Enterprise 可接 OTel [8] | 付费套餐；单任务硬上限未披露 |
| Meta Muse | 你的账号，按「一次 / 始终」授权 [10] | 本文来源未披露 | 本文来源未披露 |

横着看：**身份**一栏，四家里只有 Google 把「agent 有自己的工作账号」放进了公开发布的形态，OpenAI 还在试点；**审计**一栏，大家都说有记录，但都没公开说明记录里能不能追到委派链和审批人；**花费**一栏，只有 Google 把硬停写进了发布稿，但粒度是项目，执行语义要看 Billing 文档。

## Gems 改 skills：自定义人设收敛成可组合的能力

另一条伴线是 9 月底的消息。TechCrunch 9 月 28 日（10:29 PDT，即北京时间 9 月 29 日 01:29）报道，Google 要关停 2024 年推出的 Gems——用户自建的特定任务助手，比如学习教练、跑步教练——自动迁移成 skills；应用内提示写的是 11 月 17 日起 Gems 变为 skills，用户无需操作 [12]。Google 博客（9 月 30 日）补了时间表：个人账号 11 月起停用 Gems，Workspace 商业、企业和非营利客户在 2027 年 3 月，教育客户在 2027 年 6 月；skills 输入 `/` 加名字调用，可以叠着用、带参考文件，Gemini 还能从聊天里帮你生成 skill，并在提示匹配时自动运行；Google Labs 的 Gems 会关停但**不会**迁移 [13]。9to5Google 补充，分享链接、添加 Drive 文件等 Gems 原有功能会在之后几周补齐 [14]。

把这条消息和 Gemini at Work 放在一起看，方向就很清楚了：

- **Gem 是一个「人设」，skill 是一项「能力」。** Gem 有自己的名字和入口，你要先选「跟哪个助手聊」；skill 是同一个 agent 按需加载的说明书。企业版说得更直白：skills 是存成模块化提示词的可复用指令、知识或流程，有全局库、公司共享注册表和个人 skill，**Gemini 自己挑用哪些 skill 和工具** [1]。
- **agent 只有一个，能力可以组合。** 「写作风格 skill + 品牌规范 skill」叠着用 [13]，就不再需要一个「品牌文案 Gem」。这跟 Gemini at Work 的「单一 agent」是同一个思路：入口收敛，能力拆小。
- **agent 会给自己写 skill。** 一级源说 Gemini 的程序性记忆里包括「它为自己写的 skills」[1]。

对企业来说，这意味着**治理对象从「助手」变成了「skill」**。几件事要跟上：

1. **公司注册表要有发布流程。** 谁能发、要不要评审、怎么管版本和下架，跟内部 npm 仓库是同一类问题。站内 [Agent Skills 2026 综述](/cn/blog/agent-skills-2026-survey-lifecycle-map/)按写、装、选、用、学、验、管排过全生命周期，可以直接拿来当框架。
2. **自动选 skill 会带来悄悄顶替。** [同类 skill 互相顶替](/cn/blog/co-installed-agent-skills-conflicts/)那篇讲过一项实证：功能相近的 skill 装在一起时，被顶替后任务照样通过，专属的硬约束却丢了，回复里几乎不会说明用了哪个。全局、公司、个人三层库叠在一起再让模型自己挑，只会更常见。tasks inbox 能显示加载了哪个 skill [2]，要把它当验收项，而不只是进度条。
3. **agent 自己写的 skill 要能审。** 它从执行中「学会」的流程下次会自动用上 [1]；没人看过就进了程序性记忆，等于一段没审过的代码进了生产。至少要能列出、对比、撤回。

## 上线前检查清单

按三件套加两项补充，每一条都应该能拿到确定的回答，而不是「模型会注意的」。

**身份与权限**

- [ ] 同事型 agent 由谁创建、谁是负责人？负责人离职或调岗时，agent 账号怎么交接或停用？
- [ ] agent 能访问的范围是否等于「共享给它的」？上线前先盘一遍相关团队 Drive 和 Chat 群的共享设置，收紧「整个部门可见」。
- [ ] subagent 的身份是否随任务结束吊销？权限能不能超过父 agent？
- [ ] 连到外部系统时，OAuth 授权给的是 agent 身份还是某个员工的身份？范围是否最小？
- [ ] 用 Agent Gateway 写出「永远不能碰」的策略（比如机密等级文档、薪资表、外部收件人），并实际测一次被拦下来的样子。

**审计**

- [ ] 拿一条样例审计记录：能否看出是哪个 agent、替谁做的、谁派的活、经过哪个父 agent、哪条策略或哪个人批准的？
- [ ] 审计记录能否导出到你自己的 SIEM，保留多久？
- [ ] agent 的身份有没有权限改写或删除自己的日志？用测试账号试一次。
- [ ] 外发动作（邮件、外部共享、对客户的消息）是否单独标记、单独可查？

**花费**

- [ ] 每个试点项目先设花费上限，并设得比真实底线低一截（执行不是瞬时的 [11]）。
- [ ] 弄清触发后暂停的范围：整个项目、单个 agent，还是单个任务？半途停下的长任务怎么收尾？
- [ ] 解除上限后本周期是否不再保护？谁有权一键恢复？
- [ ] agent 拉起的沙箱、数据作业、部署出去的服务分别算在哪里，项目上限是否覆盖？
- [ ] 定价和计量方式公布前，不要把试点扩到全公司。

**skills 与连接器**

- [ ] 公司 skill 注册表的发布、评审、版本和下架流程是否就位？
- [ ] 同功能 skill 是否去重？关键 skill 的硬约束有没有独立测试，而不是只看任务是否通过？
- [ ] agent 自己写的 skill 能否列出、审阅和撤回？
- [ ] 接入的 MCP server 是否来自可信来源，分清只读工具和写工具，写工具默认要确认。

**停止与回退**

- [ ] 有没有一个总闸，能一次停掉某个 agent 的定时任务、事件触发和正在跑的 subagent？
- [ ] 停下之后，哪些已经发生的动作撤不回来，是否会明确告诉你？

## 边界与没说清的地方

- **大部分能力还在预览**（见开头），上面关于三件套的描述是 Google 的设计说明，不是第三方验证过的行为。
- **客户数字多来自旧部署。** Futurum 提醒，发布会里列的客户成效大多来自此前的 Gemini Enterprise 部署，不是这个新的统一 agent [5]。On、Shopify、PayPal 是早期测试者，但没有公开针对新 agent 的量化结果。
- **「每 token 价格降了 98%」「近 90% 的财富 100 强在用 Gemini Enterprise」是 Google 自己的数字** [1][2]，没有独立来源。
- **审计里的委派链和审批人、spend cap 和现有 Billing Spend Caps 的关系、subagent 身份的生命周期**，公开材料都没讲清，我没查到就不替它补。

## 最后

把 agent 当同事，最大的变化不是它更聪明，而是它开始在你没看着的时候，以某个身份花钱、改东西、往外发消息。Google 难得把「它是谁、做了什么、能花多少」放在同一页上，自己列的四个治理问题就是一份不错的需求清单。但能不能上生产，要看你在试点里能不能拿到三样东西：一条能追到人的审计记录、一个真能停下来的花费上限、一份看得懂也撤得回的 skill 清单。先拿到，再扩大。

## 参考来源

[1] Thomas Kurian（Google Cloud）. *Gemini at Work 2026: Introducing Gemini agent*. Google Cloud Blog, 2026-10-08. https://cloud.google.com/blog/products/ai-machine-learning/welcome-to-gemini-at-work-2026

[2] Sarah Perez. *Google brings agentic AI to Gemini, starting with businesses*. TechCrunch, 2026-10-08 11:18 PDT（北京时间 10-09 02:18）. https://techcrunch.com/2026/10/08/google-brings-agentic-ai-to-gemini-starting-with-businesses/

[3] Emma Roth. *Google is launching a one-stop Gemini agent for your work tasks*. The Verge, 2026-10-08 14:28 UTC（北京时间 22:28）. https://www.theverge.com/tech/1007904/google-gemini-ai-agent-enterprise

[4] Liz Ticong. *Google's New Gemini Agent Can Handle Work Across Multiple Apps*. TechRepublic, 2026-10-09. https://www.techrepublic.com/article/news-google-gemini-agent-workplace-apps/

[5] Keith Kirkpatrick. *Google Collapses Enterprise AI Into a Single Gemini Agent at Gemini at Work 2026*. Futurum, 2026-10-09. https://futurumgroup.com/insights/google-collapses-enterprise-ai-into-a-single-gemini-agent-at-gemini-at-work-2026/

[6] OpenAI. *Introducing dots*. 2026-09-29. https://openai.com/index/introducing-dots/

[7] OpenAI ChatGPT Learn. *Manage dots permissions and capabilities*. https://learn.chatgpt.com/docs/enterprise/dots-admin-guide

[8] Claude Help Center. *Use Claude Cowork safely*. https://support.claude.com/en/articles/13364135-use-claude-cowork-safely ；另见 *Use Claude Cowork on web, desktop, and mobile*. https://support.claude.com/en/articles/15520349-use-claude-cowork-on-web-desktop-and-mobile

[9] Anthropic. *Claude now works with Google Docs, Sheets, and Slides*. https://claude.com/blog/claude-now-works-in-google-docs-sheets-and-slides

[10] Jess Weatherbed. *Meta's Muse AI sent a YouTuber's address to a stranger*. The Verge, 2026-09-29 14:08 UTC（北京时间 22:08）. https://www.theverge.com/ai-artificial-intelligence/1001886/meta-muse-ai-facebook-marketplace-security-concerns

[11] Google Cloud Documentation. *Manage spend cap budgets*（最后更新 2026-10-07 UTC）. https://docs.cloud.google.com/billing/docs/how-to/budgets-spend-caps

[12] Sarah Perez. *Google is killing off Gemini's Gems in favor of 'skills'*. TechCrunch, 2026-09-28 10:29 PDT（北京时间 09-29 01:29）. https://techcrunch.com/2026/09/28/google-is-killing-off-geminis-gems-in-favor-of-skills/

[13] Deven Tokuno（Google）. *Let skills in Gemini tackle your most repetitive tasks*. Google Blog, 2026-09-30. https://blog.google/products-and-platforms/products/gemini/automate-tasks-with-skills/

[14] Abner Li. *Google details Gems to skills migration, including free access*. 9to5Google, 2026-09-30. https://9to5google.com/2026/09/30/gemini-skills-free/
