---
title: "默认硬预算帽：被 agent 部署出去的服务也要有停机线"
description: "按量计费服务需要默认硬预算帽——超限直接切断返回错误，而不是半夜发一封警告邮件。Coding / personal agent 降低了拉起会继续计费的下游服务的摩擦；AWS 项目 spend limit 与 Google Cloud Spend Caps 正在把硬停做成产品趋势。本文区分 agent token 账本与被 agent 部署出去的服务账单，并给出选型与默认勾选清单。"
pubDate: 2026-10-04T10:40:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "developer-tools"]
lang: "zh"
---

半夜醒来，邮箱里躺着一封「用量接近预算」的提醒。你打开控制台，发现昨晚 agent 随手部署的那个小 demo——调了付费 API、挂了对象存储、又开了一台会自动扩的算力——在你睡觉的时候又跑了几百甚至上千刀。提醒邮件没能拦住它；软预算只负责通知，不负责停机。Simon Willison 在 2026-10-03 的短文里把这件事说死了：**按量计费的服务，需要默认硬预算帽**——每月到了 \$X，切断并返回错误；「到了 \$X 发邮件」不够用。[1]

这不是又一篇「云账单吓人」的软新闻。站内已经写过两层成本控制：一层是 [Harness 控成本](/cn/blog/control-the-harness-control-the-cost/)——企业怎么路由 agent **自己的**模型花费；另一层是 [Coding Agent 的浪费习惯](/cn/blog/coding-agents-cost-inefficient-behaviors/)——轨迹里被覆盖的检索、相似脚本、空转测试。本篇切的是第三条账本：**agent 部署出去、接上付费 API / 存储 / 计算的那些下游服务**。token 账本再干净，也挡不住一只在云上跑了一夜的「玩具」。把三篇并排放：前两篇管的是「agent 在跑的时候买了什么」；本篇管的是「agent 走了之后，它留下的东西还在买什么」。

## 软帽与硬帽：产品语义差在「谁来停」

软预算帽（soft cap）的产品语义通常是：越过阈值 → 发邮件 / 推 webhook / 在仪表盘标红。人还要醒着、要看懂、要找到关停入口。硬预算帽（hard cap）则是：**越过阈值 → 下一次会计费的请求直接失败**，服务进入暂停或拒绝状态，而不是继续跑着等你来救。

Willison 写得很直白：没人想半夜收到警告，醒来却发现 rogue service 又多烧了几百、几千刀。反对硬帽的常见理由是「业务应用不能因为预算超了就开始报错」。他的反驳同样直白——多数个人与公司，宁可看到错误，也不愿看到一张意外的五位数账单。[1] 把这句话落到产品评审里，其实是在问：你们更怕「偶发 429 / 暂停」还是更怕「无人值守的无限计费」？对个人项目、周末 demo、agent 自动开的沙箱，答案几乎总是后者。

这里有一个容易被 UI 文案抹平的细节：**「预算」二字在控制台里经常同时指软、硬两种机制**。AWS Budgets 一类工具长期更偏告警与预测；真正「到线就暂停项目 / 阻断新用量」是另一类控件。选型时别只看页面上有没有 Budget 字样，要看触发后是通知还是拒绝。Dreaming Press 对 agent 侧花费的拆法也适用到下游服务：观测（observability alert）与执法（synchronous refusal）不是同一件事——告警异步，执法要在下一次请求进账前挡住。[2]

再拆一层时间窗。软帽的失败模式不是「没发邮件」，而是「邮件到了，人没在」。agent 部署出去的服务按机器速度计费：重试回路、webhook 风暴、被爬的公开 endpoint、忘记关的 GPU，都可以在你睡觉的几小时里把月预算打穿。硬帽把决策从「人是否及时响应」改成「计费路径是否允许再通过一次」。邮件仍然有用——它告诉你发生了什么——但它不该是唯一防线。

## 为什么 agent 改了风险形状

过去，个人项目要烧出一张离谱云账单，通常得有人亲手写脚本、配密钥、点部署、再忘了关。摩擦本身就是一层防护：步骤多，半夜乱拉服务的概率就低。即便脚本写出来了，也常要过 IAM、账单告警、同事 review 几道关。这些关卡不一定设计成「成本治理」，但客观上拉高了「无意中无限计费」的门槛。

Coding agent 与「包了一层更友好 UI 的 personal agent」把这层摩擦压薄了。Willison 的观察是：它们大大降低了「拉起一段能干活的代码」的成本；有时这些事会花钱——调付费 API、托管 Web 应用、按存储与计算继续计费的系统。[1] 你不必再手写完整的扩缩容与重试逻辑；agent 会补上「看起来很合理」的默认：失败就重试、没监控就先上线、配额先开大一点。结果是：**制造会持续计费的回路，从「需要一个会运维的人」变成「一次会话里就能发生」。**

风险形状因此变了。以前常见的是「账号权限过大 + 人忘了关」；现在还要加上「agent 以很低摩擦创建了付费依赖，而依赖默认没有硬停」。受害者不一定是资深 SRE——更可能是第一次用云、让 agent「帮我部署一个能跑的 demo」的开发者。这也解释了为什么「默认」二字比「提供一个高级设置」更重要：能找到高级设置的人，往往不是最需要硬帽保护的那批人。

还有一个容易被忽略的耦合：agent 不仅会部署服务，还会给服务接上「继续调用模型 / 搜索 / 第三方 API」的密钥。于是下游回路可以在云账单与 API 账单两边同时膨胀。你只盯着 Claude / GPT 的工作区花费，可能完全看不到对象存储、出网流量、或另一家 embedding API 的表。风险不是单点，而是**低摩擦创建 + 多账本并行**。治理若只锁住 agent 会话，等于只关了水龙头的一半。

## 两本账：agent 自己的 token，与它部署出去的服务

把成本混成一笔「AI 账单」会误导治理。至少要分开两本账：

**第一本是 agent 循环本身的账。** 模型调用、工具往返、子代理扇出、prompt cache 是否命中——这是 [Harness 控成本](/cn/blog/control-the-harness-control-the-cost/) 讨论的路由与治理问题：谁在选模型、谁在管缓存边界、子代理默认跟谁。轨迹层还有另一类浪费：同一段代码被反复检索、相似脚本连写、patch 没变却重跑测试——见 [Coding Agent 烧钱的三种习惯](/cn/blog/coding-agents-cost-inefficient-behaviors/)。这两篇管的是 **agent 运行时买了多少 token、买得有多浪费**。企业采购若只谈「哪档模型贵」，却不谈 harness 默认，账单会在默认配置里长大——那是第一本账的经典误判。

**第二本是下游服务的账。** Agent 写出并部署的服务去调 Stripe / OpenAI / 搜索 API，或挂在 AWS / GCP 上按量扩。这笔钱可能完全不经过你用来跑 agent 的那个 API key。会话预算把 agent 掐停了，已部署的进程与定时任务仍可继续计费。反过来也对：云项目设了硬帽，agent 自己的模型 route 仍可能在另一条账本上失控。第二本账的典型误判是：「我们给 coding agent 设了月度上限，所以云也不会出事」——两句话谈的不是同一个 meter。

两本账要两套执法点。第一本适合落在 gateway、harness 的 run / session 预算、迭代上限；第二本适合落在云厂商的项目 / 服务级 spend limit、API 平台的硬配额、以及「推荐带硬帽的供应商」这一产品偏好。本篇的主论题是第二本；第一本只在后文作互补对照，不替代。实务上还可以加一条组织约定：任何由 agent 创建、且会离开笔记本的资源，必须在创建剧本里声明它落在哪本账、硬帽设在哪、谁有权 lift。

## 云厂商在往硬停走：AWS 与 GCP

Willison 点名最想看到硬帽的服务是 AWS——很多人因为担心 runaway 账单而不敢把个人项目放上 AWS，也有人已经被烧过。2026-09-16，AWS 在 *New AWS experience helps builders get started and ship faster* 里写到：升级到付费计划后，可以按用量模式为项目设置月度 spend limit；**项目用量触及 spend limit 时，该项目在当月会被暂停**。[1][3] 公告语境是新的简化 builder 体验：先用合理默认开工，付费后再谈 spend limit，而不是一上来就把企业级 IAM 与计费旋钮全部摊开。对「agent 帮新手部署」这一场景，这种叙事方向是对的——前提是硬帽真的出现在默认路径上。

文档侧（*Create a spend limit in AWS Settings*）仍明确提示：新体验目前只向有限客户开放，未必人人都能看到。[4] 公开说明里还能核对几条产品语义（以文档为准，不外推全员 GA）：limit 是项目级税前费用上限，不是额外收费；接近上限会通知（例如实际费用到 50% / 75% / 90% 一类阈值），触及后暂停项目；可调高 limit 以恢复；早期成本控制还可选停止新资源启动、暂停空闲资源等；可设 limit 的项目数量也有上限。[4] 对个人与小团队，关键词是 **pause the project**——这已经是硬停语义，而不是「再发一封邮件」。但「limited release」意味着：今天让 agent「默认推荐 AWS」时，仍不能假设每个账号都自带这层保护。脚手架若生成 CloudFormation / Terraform，应把「是否已启用项目 spend limit」写成显式检查，而不是默认「AWS = 有帽」。

Google Cloud 在 2026-07 前后把类似能力做成 Budgets 上的 **Spend Caps**（预览）：可对项目内**特定合格服务**设月度财务上限；累计花费触及上限后，系统自动限制该服务在该项目内继续产生费用的用量。[1][5] 文档写明：触发后新用量被暂停，直到你手动 lift；告警约在 50% / 80% / 100%；当前合格服务包括 Gemini API、Gemini Enterprise Agent Platform（原 Vertex AI）、Cloud Run、Cloud Run functions；范围是单项目 + 单服务 + 按月；文件夹 / 组织 / 多项目或多服务预算不在范围内；用估算毛成本做更快执法，但执法仍非瞬时，延迟期间的超额仍按常规计费；订阅类费用等也可能不在帽内。[5][6] 对 AI 工作负载，文档还强调相对传统账单对账，Spend Caps 可以更快触发——这正是对抗「一夜打穿」所需要的时间尺度，但仍要记住「更快 ≠ 瞬时」。

两家产品形态不同——AWS 叙述偏「项目暂停」，GCP 偏「单服务用量暂停、资源不删」——但方向一致：**告警不够，要能停**。Willison 的总结是：这看起来正在成为趋势。[1] 对写 agent 与脚手架的人，含义很具体：推荐云与 API 时，应偏向「有硬帽、且默认打开或极易打开」的路径，并明确警告无硬帽、按量无限的组合。也要诚实写清边界：limited release、Preview、单服务范围、估算延迟——别把「厂商有公告」写成「你的账号已经安全」。

## 「默认」到底指什么：opt-out，不是埋在设置里的软提醒

「提供硬预算帽」与「默认硬预算帽」差一个产品决策。前者可以是高级页里的可选开关，默认关闭；后者是：**开箱就有一条会真正切断的线**，想拿掉这条线必须显式承担责任。

Willison 建议的勾选文案很值得直接放进产品评审：

> Remove the budget cap. My application will not be shut down if I exceed the configured budget limit, and I will be responsible for subsequent charges.[1]

要点有三。第一，**opt-in 去帽，而不是 opt-in 戴帽**——危险模式要主动选择。第二，文案必须说清后果：超限后应用不会被关停，后续费用自负。第三，勾选应出现在显眼位置，而不是埋在「账单偏好 → 高级 → 实验功能」三层菜单之后。对 agent 生成的基础设施剧本，同理：脚手架若自动创建云资源 / API key，应默认带上硬帽配置；去掉硬帽应变成一次需要人确认的显式步骤，而不是静默省略。

企业侧常见反对是「生产不能报错」。可以分层：生产核心路径用更高的硬帽 + 人工 on-call；实验项目、个人沙箱、agent 自动开的 throwaway 环境用更紧的默认帽。硬帽不是消灭弹性，而是把「无限计费」从默认值里拿掉。若业务真的需要无限，那也应该是签过字的无限，而不是忘记关的无限。另一条常见反对是「帽设太低会误杀」。那是调参问题，不是取消硬停的理由——把默认帽设在「痛但不致命」的位置，并提供清晰的 lift / 调高路径，通常比「默认无限 + 事后追责」更可控。

落到 agent 产品本身：当 agent 建议「用某某云把服务部署上去」时，回复里应包含硬帽检查清单，而不是只贴一行 `terraform apply`。理想行为是：先问预算上限 → 选带硬帽的提供方或打开 spend limit → 再生成部署剧本；若用户坚持无帽，再弹出与 Willison 类似的责任确认。这不是礼貌，这是把控制面做进对话默认。

## 互补：agent 循环上的天花板，替不了下游硬帽

把下游服务帽说清楚之后，再回头看 agent 循环上的天花板——它们重要，但是**另一本账**。

Dreaming Press 的论点很硬：不能让 agent 自己执行自己的预算，因为 runaway loop 恰恰是 agent 已停止按指令行事的状态；帽必须落在 agent 与模型供应商之间的 gateway，并且是同步拒绝（例如 429），而不是异步告警。还要同时设美元预算与迭代上限——只设钱会漏掉「很便宜但永不结束」的空转。[2] 文中也提醒：gateway 预算在并发下是分布式一致性问题；LiteLLM 等网关在 2026 年出现过多起记账绕过类缺陷，配置里的数字是声明，被拒绝的请求才是证明。[2] 把这套逻辑映射到下游服务：云控制台里的 soft alert 也一样——若执法不在计费路径上同步发生，你拥有的只是一张更好看的账单事后图。

Docker Agent 的 budget 配置把同一思想产品化：`max_cost` / `max_tokens` / `max_time` 都是可选，**未设置即无限**；触顶则停止 run，并给出明确是哪条 limit 触发。[7] 也就是说，即便工具支持硬停，**默认仍可能是不设帽**——和云厂商「默认有没有帽」是同一产品问题。命名预算（named budgets）还可以让多个 agent 共用一个钱包，避免子代理扇出把「单 agent 上限」乘成 N 倍——这对 harness 设计很有启发，但仍停留在会话账本。[7] AgentBudget 一类 SDK 则尝试在会话层给 LLM / 工具 / 外部 API 做美元硬限与回路检测，作为应用内互补。[8]

这些控件管的是：**这一次 agent 跑起来，最多烧多少 token / 时间 / 会话美元**。它们不自动覆盖「agent 已经 push 上去、带着自己的密钥在跑」的下游服务。理想栈是两层都在：会话结束有天花板；部署出去的服务在云 / API 侧还有默认硬帽。只做一层，另一层仍可能在你睡觉时继续计费。验收时也要分两场撞墙测试：一场打满 agent session 预算，确认 429 / `budget_exceeded`；一场打满云 / API 硬帽，确认部署服务真的停或拒，而不是只亮灯。

## 给建造者与 agent 的选型清单

把机制收成可执行的检查项：

1. **分账本。** 分清「agent 运行时 token」与「被部署服务的云 / API 账单」。仪表盘、告警、on-call 路由不要混成一条「AI 花费」。采购合同与内部 chargeback 也应分开谈，否则省了模型价却在下游爆炸。
2. **问硬停语义。** 供应商说的 budget / cap / limit，触发后是邮件还是拒绝 / 暂停？拒绝作用在项目、服务，还是单个 API key？暂停是否删除数据，还是只挡新用量？
3. **默认戴帽。** 新项目、新 API key、agent 脚手架生成的环境，默认带硬帽；去帽要显式勾选并确认责任文案。把「未设置 = 无限」当成缺陷，而不是灵活。
4. **偏好有硬帽的供应商。** Agent 推荐基础设施时，应偏向已提供项目 / 服务级硬帽的路径，并警告「unlimited pay-as-you-go + 无硬停」的组合——与 Willison 的期望一致。[1]
5. **个人与实验环境优先紧帽。** 沙箱、demo、一夜脚本用低上限；生产用更高上限，而不是生产与玩具共用无限。Agent 开 throwaway 环境时，默认选最低一档硬帽。
6. **agent 循环另设天花板。** 在 gateway / harness 上设 session 美元、迭代、时间上限（如 Docker Agent budget、LiteLLM session cap、AgentBudget 一类）；并把「未设置 = 无限」当成风险，而不是便利。[2][7][8]
7. **别把软告警当执法。** 邮件、Slack、看板是必要的可观测性，但不是停机线。停机线要在计费路径上同步生效。告警用来解释，执法用来止血。
8. **验收要撞墙。** 故意打满帽，确认真的返回错误 / 暂停，而不是只亮灯。记账与并发下的绕过是真实风险；对 gateway 与云帽都要做一次故意 runaway。[2]
9. **文档写清两本账。** README / runbook 写明：agent 预算管什么、云 spend limit 管什么、谁有权 lift、lift 之后会不会当月不再触发。把责任确认文案留在变更记录里，方便事后审计。

清单的核心只有一句：**默认切断，显式选择继续烧钱。** Agent 让「创建会计费的东西」变容易了；产品与脚手架就得让「默认不会无限计费」同样容易。若你维护的是会替用户选云、写部署剧本的 coding agent，这条清单应写进系统提示与工具策略，而不是只写在博客里。


最后补一句给脚手架作者：硬帽不是「上线后再加的 FinOps 插件」，而是创建资源时的默认字段——和 region、实例规格并列。缺了这一字段的模板，等于默认签发一张无上限的信用卡。把字段写进模板，比事后写一篇事故复盘便宜得多。

## 结语

Coding agent 没有发明云账单风险，但它们改变了风险出现的频率与路径：从「懂运维的人手误」，变成「一次低摩擦会话就能拉起持续计费的回路」。软预算把责任推回睡眠中的人；硬预算把责任留在计费路径上——到线就停，错误优于意外账单。

站内 [Harness 控成本](/cn/blog/control-the-harness-control-the-cost/) 与 [轨迹浪费行为](/cn/blog/coding-agents-cost-inefficient-behaviors/) 继续管好 agent 自己的 token；本篇补的是被它部署出去的那一层。AWS 项目 spend limit 与 Google Cloud Spend Caps 说明厂商也在朝硬停移动，但仍有 limited release / 服务范围等边界。建造者与 agent 不该等「全员 GA」才改默认——**现在就该把硬帽当成按量服务的默认控件，并把去帽做成需要勾选的责任声明。** 等账单来了再谈治理，通常已经晚了一个睡眠周期。

## 参考

[1] Simon Willison, [*We're going to need default hard budget caps on pretty much everything*](https://simonwillison.net/2026/Oct/3/default-hard-budget-caps/), 2026-10-03.

[2] Dex Mareno, [*How to Put a Hard Spending Cap on an AI Agent*](https://dreaming.press/posts/how-to-cap-ai-agent-spending.html), Dreaming Press, 2026-07-03.

[3] Amazon Web Services, [*New AWS experience helps builders get started and ship faster*](https://aws.amazon.com/about-aws/whats-new/2026/09/New-AWS-Builder-Experience/), 2026-09-16.

[4] AWS Account Management, [*Create a spend limit in AWS Settings*](https://docs.aws.amazon.com/accounts/latest/reference/create-spend-limit.html)（文档注明 limited release）.

[5] Google Cloud, [*New early anomalies and spend caps on Google Cloud Budgets*](https://cloud.google.com/blog/topics/cost-management/new-early-anomalies-and-spend-caps-on-google-cloud-budgets); 文档 [*Manage spend cap budgets*](https://docs.cloud.google.com/billing/docs/how-to/budgets-spend-caps)（Preview；合格服务与限制以文档为准）.

[6] Google Cloud Billing release notes, 2026-07-27: Spend cap budgets available for a limited set of services (Preview).

[7] Docker Docs, [*Docker Agent — Budget*](https://docs.docker.com/ai/docker-agent/configuration/budget/).

[8] AgentBudget, [GitHub: AgentBudget/agentbudget](https://github.com/AgentBudget/agentbudget)（会话级美元硬限 SDK，概念对照）.
