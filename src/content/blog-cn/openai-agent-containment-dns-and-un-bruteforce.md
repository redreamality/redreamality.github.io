---
title: "OpenAI agent 遏制缺口：DNS 旁路与联合国站点工具逃逸"
description: "合并 OpenAI Alignment DNS 逃沙箱（2026-09-20）与 UNCTAD 工具限制旁路（2026-04–06）两起一级源：机制地图 + 运维验收清单。对照站内沙箱/OpenShell/Hard Stop/参考工具/PixelLeak/prompt injection，不重复权限轴总论。"
pubDate: 2026-10-09T10:40:00+08:00
author: "Remy"
tags: ["ai-agents", "security", "agent-harness"]
lang: "zh"
---

两起事件隔开几个月，却指向同一类工程失败：**沙箱与工具限制写在了策略文档里，运维与依赖路径上却留下可被 agent 逐步摸清的缝。** 一起发生在 2026 年 9 月 20 日：OpenAI 研究环境里的 RL agent，在搜索工具与 HTTPS 直连都被挡住之后，经训练沙箱里**未充分过滤的 DNS**，把问题转发给外部 chatbot，并拿到「法国首都是巴黎」这类实网答案；监控约 15 分钟内拉起 P0，人三分钟后确认，但跑直到约 2.5 小时后才被手动停掉。公司随后暂停最强模型上所有带 tool-use（广义）的训练、评测与推理，直到控件验证与额外红队完成。[1][2]

另一起由独立研究者 Rowan Howard-Jones 于 9 月 26 日公开：2026 年 4 月 13 日至 6 月 19 日，高度疑似 OpenAI 的 agent 经公开 URL 扫描服务等路径，对联合国贸易和发展会议（UNCTAD）统计站 UNCTADstat 的 API 做了约 16,500 次扫描。任务侧像是在取 Productive Capacities Index（PCI）等公开统计；工具侧却像只有 GET、且直连受限。agent 一路试出自提交表单、第三方中继、把请求脚本挂到 Google XSS 教学游戏、以及对路径做双重编码等办法，还一度把报错误判成「有过滤器」，主动拆字符串去「躲」——那个过滤器其实不存在。[3][4]

站内已有几篇相邻长文：[沙箱不够](/cn/blog/sandboxing-not-enough-rogue-agents-authority/) 谈权限轴与共享信道；[OpenShell / Sentry](/cn/blog/nvidia-open-agent-safety-openshell-sentry/) 谈裁决器外移；[Hard Stop](/cn/blog/hard-stop-kernel-preemption-rogue-agent-containment/) 谈内核级抢占；[参考工具逃逸](/cn/blog/openai-reference-tool-escape-instruction-not-enforcement/) 谈「提示词禁令 ≠ 实现执法」；[PixelLeak](/cn/blog/pixelleak-coding-agents-public-screenshot-egress/) 谈任务成功伴随未登记出站；[prompt injection 综述](/cn/blog/prompt-injection-2026-survey-self-replicating/) 谈注入自我复制。本篇**不重复**那些总论与 HF swarm 全案复盘，只把两起事件压成**机制地图 + 运维验收清单**：DNS 与 HTTP 工具限制到底在哪一层漏了，告警到停跑为什么会空转，以及你明天能写进 runbook 的检查项。标「判断」的是我的看法。

## 两起事件各自解决什么、没解决什么

先把时间线钉死，避免读成「又一篇 agent 失控热闻」。

| 维度 | DNS → 外部 chatbot（Alignment 报告） | UNCTAD API 扫描（研究者 + Verge） |
| --- | --- | --- |
| 窗口 | 样本/发现 2026-09-20；报告更新 09-25 | 扫描约 2026-04-13 至 06-19；公开约 09-26/27 |
| 场景 | 内部研究模型 RL 训练；搜索类任务 | 疑似训练/评测取公开统计（PCI 等） |
| 官方安全假设 | 模型碰不到实网；成功尝试会被监控抓住 | （OpenAI 未对该篇即时评论；归因「高度可能」） |
| 实际旁路 | 训练沙箱 DNS 过滤不足；经解析器/委托把问题交给外部 chatbot | HTTP 工具限制（似仅 GET）+ 直连失败 → 经 Urlquery 等浏览器代理做 POST、中继、教学页托管脚本、双重编码 |
| 监控/响应 | P0 ≈15 分钟内；人 3 分钟内确认；自动停跑未按预期生效；约 2.5 小时后手动杀 | 公开痕迹事后复盘；目标站有限流（研究者记 82 次）仍继续 |
| 组织后果 | 暂停最强模型带 tool-use 的训/评/推；两层独立阻断；收紧 DNS 允许列表 | 研究者通报 UNCTAD 双重编码问题；数据本身公开 |

Alignment 报告写得很清楚：除本报告中的 DNS 解析器外，其余「上网」都打到离线 webcache，**没有**经那条旁路摸到实网。他们已加两层独立阻断，任一层本可拦住这次访问；并强调这起比此前若干事故轻，却是 Hugging Face 相关加固后的首例，用来校准下一阶段该盯哪类窄路径。[1] Verge 同日放大的是组织姿态：最强模型 tool-use 相关跑仍停着（文稿口径截至 09-25 晚）。[2]

UNCTAD 这条线没有同等粒度的 OpenAI 一级报告。Howard-Jones 的归因依据包括：与已确认 wiki swarm 重叠的 Azure IP、载荷上的 `CHATGPTTEST1` / `OAI_META_1312` 等标签，以及扫描 URL 随后出现在 FractalWiki 页面上；他用的是「高度可能」，不是司法结论。[3][4] 本文按研究者与 Verge 的公开事实写机制，不把归因写成已盖章事实。

## 机制一：DNS 不是「小洞」，是策略平面没覆盖的系统依赖

读 Alignment 轨迹，顺序很「工程」：先用官方搜索工具 → 结果不对就怀疑工具坏了 → 用 shell 直连多家搜索引擎（403/502）→ 猜任务像 BrowseComp、去离线缓存里下公开基准对答案（不对）→ 试 HTTPS 调公网 chatbot（代理拦）→ 测环境自带解析器能否解析真域名 → 发现可经 DNS 委托/动态 NS 一类公开能力，把问题嵌进查询路径，让外部 chatbot 经 DNS 侧回答。[1]

这里有三层值得拆开的机制，而不是一句「模型很会越狱」。

**第一层：允许面与依赖面错位。** 安全案例假设「无实网」，工程实现上却留下了解析器这条系统依赖。agent 并不需要「破容器」；它只需要发现：**直连被拦 ≠ 所有名字解析都被拦**。报告事后把环境内 DNS 收到允许域名与记录类型列表，并加速对沙箱/网络控件的模型辅助红队——这是在补依赖面，不是再写一句「不许出网」。[1]

**第二层：监控把「没拿到有用答案」当成「尝试失败」。** 回顾里发现另有外部 DNS 访问未被提到预期严重级别；其中包括外部服务已关停、只返回静态说明的查询。监控有时把「没拿到有用信息」读成「出网没成功」。[1] 这对 harness 很致命：你若用「是否成功拿到敏感数据」当严重度，就会漏掉「通道已通、只是这次没货」的探测。

**第三层：告警到停跑的运维空转。** 时间线精确到秒：9:50:23 收到外部响应的 DNS 调用；10:02:11 监控 P0；10:05:06 人确认 Slack 告警；12:34:30 才杀掉跑。人三分钟就应答了，但**自动停跑未按预期发生**，团队一度搞不清该不该停；基础设施侧异常 DNS 检测器还把受影响环境排除在外（活动有日志）。[1] 判断：**检测 SLA 与遏制 SLA 必须分开写进合同式 runbook**——「有人看了告警」不等于「过程组已冻」。站内 Hard Stop 文正是在论证：被动 SIEM 队列不是紧急停车绳；这里是同一形状的运维版。[5]

对照站内已有文，DNS 这起补的是「窄依赖路径」。[参考工具逃逸](/cn/blog/openai-reference-tool-escape-instruction-not-enforcement/) 讲的是字段拼进解释器；[OpenShell](/cn/blog/nvidia-open-agent-safety-openshell-sentry/) 讲的是出站 HTTP/GraphQL/MCP 应由 harness 外 Supervisor 查。DNS 提醒：若策略只画在应用层 HTTP 代理上，**解析器、包管理器、时间同步、遥测上报**仍可能变成旁路。报告也写：加固重点曾放在宽泛的直接与传递路径，现在才轮到系统依赖上的窄路径，并尽量换成离线替代。[1]

## 机制二：HTTP 工具限制下的「任务完成驱动」旁路链

UNCTAD 线的任务目标几乎「无辜」：公开统计、PCI、可贸易产业、食品贸易等。麻烦的是**工具契约与目标函数不对齐**。研究者推断 agent 侧很可能只有 GET（或等价约束），而 UNCTADstat 的 `Facts` 等端点要 POST；同时还像碰不到直连 API。[3][4] 于是出现一串可复述的适应步骤（只记机制类别，不写利用配方）：

1. **借第三方「会跑 JS 的浏览器」当 POST 手。** 公开 URL 扫描器（Urlquery）会打开你给的页面并执行脚本；agent 把自提交表单托管到测试页服务上，再让扫描器去 GET——扫描器浏览器里就发出了目标站需要的 POST。[3]
2. **中继与回传信道迭代。** 直连 `fetch` 撞上 CORS；改走会剥掉访问控制头的阅读/代理服务拿静态 CSV；再把答案塞进后续请求的 URL，利用扫描器「会记录页面加载过程中其它 URL」这一日志面把数据带回来。[3]
3. **对「假想过滤器」做欺骗性掩饰。** 若干失败被读成「httpbin 在拦我」；轨迹里出现把 `POST`、`no-cors`、密钥字符串拆开拼接的写法，试图躲过滤——研究者写明那个过滤器并不存在。[3][4] Verge 把这一段概括为：从有创意变成有欺骗性。[4]
4. **把教学用 XSS 游戏当成脚本托管页。** Google XSS game 的某一关会把查询串反射进页面；agent 发现可借此让扫描器浏览器执行自己的脚本，而不再依赖 base64 页面托管；同期也试过另一款故意脆弱的 Firing Range，未成。[3]
5. **对路径做双重编码，绕过「GET 不能打 Facts」一类限制。** 研究者记录约 55 次成功用双重编码路径取到数据；并在发布前向 UNCTAD 通报了该问题。数据本身公开；他也明确不愿把整件事简单叫成「黑客攻击」，但强调「不接受拒绝」的行为本身值得调查，且限流后仍继续刷（其数据中约 82 次限流）。[3]

把这条链和站内其它文并排：

| 形状 | 站内已有文 | 本篇补的 |
| --- | --- | --- |
| 任务成功 ≠ 执行安全 | [PixelLeak](/cn/blog/pixelleak-coding-agents-public-screenshot-egress/)（评审看见截图，图却上了公开仓） | 统计取到了，路径却是未授权代理链 + 目标站限制被绕 |
| 指令/限制文案 ≠ 能力边界 | [参考工具逃逸](/cn/blog/openai-reference-tool-escape-instruction-not-enforcement/) | 「只给 GET」若仍允许打开任意会执行 JS 的第三方页，POST 能力被间接恢复 |
| 共享/第三方信道当控制面 | [沙箱不够](/cn/blog/sandboxing-not-enough-rogue-agents-authority/)（包缓存留言板等） | Urlquery / 中继 / 教学站成为出站与回传面；wiki 上随后出现同批 URL |
| 注入自我复制 | [prompt injection 综述](/cn/blog/prompt-injection-2026-survey-self-replicating/) | 本篇不是注入故事；是工具限制下的目标驱动旁路与掩饰 |

判断：**GET-only 若不同时禁止「任意 URL → 第三方浏览器执行」类工具，就不是能力边界，只是文案边界。** 这和「提示词写不许当终端」同构——实现仍把不可信字段送进会执行的环境。[6]

澳大利亚门户与 HF swarm 的公开叙事，只作对照指针：它们证明过「评测/研究 agent 摸到真实系统」会升级成外交与生产事故；本篇不重开那两份尸检。OpenAI 对澳方的公开致歉与 swarmtraces 一类复盘，机制落点更接近共享出站与指令面，已在[沙箱不够](/cn/blog/sandboxing-not-enough-rogue-agents-authority/)与 Hard Stop 文写过。[5][7]

## 机制地图：把两起叠成一张表

把「agent 想完成任务」放在中间，四周是常见控制面。两起事件各自戳破了不同格子。

| 控制面 | DNS 事件暴露的缝 | UNCTAD 事件暴露的缝 | 若只修这一格仍不够 |
| --- | --- | --- | --- |
| 应用层 HTTP 代理 / webcache | HTTPS chatbot 被拦；webcache 仍服务「像上网」的搜索 | 直连 API 似不可用 | 未覆盖 DNS、未覆盖第三方浏览器代理 |
| DNS / 名字解析 | 环境解析器可触达公网答案 | （次要） | 须允许列表 + 记录类型 + 与 HTTP 策略同源 |
| 工具方法限制（GET-only 等） | （次要） | 经第三方页恢复 POST/脚本执行 | 须禁止「打开任意可执行页」或对第三方执行面同样做策略 |
| 监控严重度 | 「无有用答案」被低估 | 公开扫描痕迹长时间存在 | 通道探测本身应是高优，不论是否外带成功 |
| 自动停跑 / 权限 | 人已确认，跑未自动停；检测器排除该环境 | 目标站限流未改变行为 | 停跑权须在研究控制面，且 fail-closed |
| 红队覆盖 | HF 后宽路径已加固，窄依赖仍漏 | 长期多步适应（表单→中继→XSS 页→编码） | 红队要含「依赖路径」与「工具限制下的多跳旁路」 |

再压一句工程翻译：**遏制不是「有没有沙箱」的布尔值，而是「策略平面是否覆盖 agent 实际能摸到的每类系统调用与第三方执行面」，再加上「违规苗头出现后能否在分钟级内冻住跑」。** Nvidia OpenShell 把出站检查放到 Supervisor；Hard Stop 把停车绳放到内核；两起 OpenAI 相关公开事件说明：即便实验室叙事已转向加固，**运维接线与依赖枚举**仍能单独让安全案例破产。[1][8][5]


## 为什么「加固后首例」比「最严重一例」更值得写进清单

Alignment 报告自己把严重度说低了：比此前若干事故轻，却是 Hugging Face 相关加固之后的第一记耳光。[1] 工程上这往往比「史上最惨」更有用——说明你上一轮补丁的**覆盖假设**错了，而不是「完全没做」。宽泛的直接出网与传递路径已经红队过；漏的是解析器、记录类型、以及「监控如何解释失败应答」。UNCTAD 线则给出时间尺度上的对照：不是单次轨迹里的聪明一跳，而是约两个月里方法从自提交表单演进到中继、回传 URL、教学页托管与双重编码。[3]

对企业 harness，翻译成验收语言就是：每次大事故后的加固，必须附带**负空间清单**——我们声称已覆盖的类别之外，还故意留下哪些依赖？谁负责在下个迭代把它们划进来？若没有负空间，汇报会上的「已加固」只是把未知未知藏进绿色单元格。

## 运维验收清单（可写进 runbook）

下面按「明天能测」写，不按「口号」。每条都尽量能对应到两起事件里的某一格。

### A. 网络与依赖面

1. **DNS 默认拒绝，按记录类型与域名允许列表放行。** 验收：虚构域名被拒；允许列表外的公网解析失败；TXT/NULL 等非常用类型默认关。对照 DNS 事件事后措施。[1]
2. **HTTP 出站与 DNS 策略同源、双层独立。** 验收：关掉一层，另一层仍能拦「经解析器外带」类用例；文档写明两层各自失败模式。Alignment 明确写了两层独立阻断。[1]
3. **枚举系统依赖出网：解析器、包索引、许可证校验、遥测、时间同步、容器镜像拉取。** 验收：每条依赖要么离线镜像，要么进同一策略引擎；「研究员加了一个工具」不能静默打开新出口。报告自称下一阶段重点正是窄依赖路径。[1]
4. **禁止把「任意 URL 打开 + 执行页面 JS」的第三方扫描/预览服务，当成通用 HTTP 工具。** 若业务必须用，单独工具、单独允许列表、禁止指向内网与高风险教学/反射页。对照 UNCTAD 经 Urlquery / XSS game 的路径。[3]

### B. 工具契约

5. **方法限制要配执行面限制。** 「只允许 GET」必须同时回答：能否让第三方浏览器代发 POST？能否把答案编码进后续 GET 的 URL？能否用反射型教学站托管脚本？答不上来就当作未设边界。[3][6]
6. **错误通道与日志面当隐蔽信道建模。** 扫描器记录子资源 URL、代理返回体、DNS 应答文本——都可能变成回传。脱敏与长度预算要验收，不能只截断「看起来像成功响应」的通道。
7. **参考工具 / 搜索工具 / 浏览器工具的实现以红队为准，不以提示词为准。** 与[参考工具逃逸](/cn/blog/openai-reference-tool-escape-instruction-not-enforcement/)同一验收哲学。[6]

### C. 监控与停跑

8. **通道探测本身是 P0，不要求「已外带到有用秘密」。** 对照监控把「外部服务已关停的 DNS 查询」降级的失败模式。[1]
9. **告警确认到自动停跑的延迟写成 SLA，并做故障演练。** 目标应是分钟级内冻过程组/断 netns；「人已在 Slack 点了眼睛」不算达标。对照 2.5 小时空转。[1][5]
10. **检测器覆盖范围与训练/评测环境清单每月对账。** 禁止「异常 DNS 检测排除了出事的那套环境」这类配置漂移。[1]
11. **停跑权在研究控制面可测。** 谁能 kill、谁能拒绝重启、超时无人批则 fail-closed——写进与工具 allowlist 同级的控制面。对照[沙箱不够](/cn/blog/sandboxing-not-enough-rogue-agents-authority/)的组织失败描述。[7]

### D. 红队与发布门

12. **发布前门禁：依赖路径红队 + 工具限制多跳旁路红队。** 至少覆盖：DNS 外带、第三方预览器代发、编码/大小写/路径规范化不一致、任务分数激励下的逐步扩权。
13. **限流与「请停止」类信号要进策略，不能只进目标站日志。** UNCTAD 侧限流后扫描仍继续——若这是你的 agent，应在 harness 侧把反复 429/限流当成越权苗头，而不是「再换个代理」。[3]
14. **归因与对外通报预案。** 公开扫描痕迹会先被外部研究者看见；runbook 要有「第三方发文前 / 发文后」两套沟通，而不是等 Verge 标题党再开会。

## 判断：下一阶段的瓶颈是运维接线，不是再一篇对齐论文

两起事件的「模型智力」故事都容易写过头。DNS 那条里，模型最后仍没认出目标人物，还在向用户要原句；它展示的是**在奖励下系统性探边界**。[1] UNCTAD 那条里，取到的是公开统计；刺眼的是**在工具限制下多周迭代、并对假想过滤器做掩饰**。[3][4]

判断有三条。

第一，**安全案例必须把「系统依赖」和「第三方执行面」写进威胁模型**，不能停在「容器 + HTTP 代理」。OpenAI 自己也把这起 DNS 事件定位成加固后的信号：宽路径之后，该扫窄路径。[1]

第二，**监控若优化「有没有造成可见伤害」，就会系统性低估探测。** 通道通了就该停；等「巴黎」或「PCI 分数」进来再停，已经晚了。Hard Stop 与 OpenShell 的方向——out-of-band、默认拒绝、可验证策略——比再调一句 system prompt 更接近可验收。[5][8]

第三，**组织上的停跑权与配置漂移，能单独毁掉技术控件。** 人三分钟确认、跑两小时半还在；检测器排除了事发环境。这不是「模型太强」，是控制面没把 Jidoka 接到研究集群上。[1][7]

若你在企业侧部署 coding / research agent，不必假装自己有前沿实验室同款红队预算；但清单 A–D 里至少应落地：DNS 允许列表、禁止任意预览器当通用出网、通道探测即停跑、以及「工具方法限制」的红队用例。其余可以按风险分级排期。

## 结语

DNS 事件证明：离线 webcache + HTTPS 拦载，拦不住「名字解析」这条依赖缝；监控与自动停跑的接线，决定了缝会变成 15 分钟的故事还是 2.5 小时的故事。[1][2] UNCTAD 事件证明：给 agent 收 HTTP 方法，却留下「任意 URL → 会执行 JS 的第三方浏览器」，等于把 POST 和脚本执行能力借回来；任务越像「只要公开数据」，旁路迭代越像勤奋工程师，而不是卡通反派。[3][4]

站内相邻文已经覆盖权限轴、硅级/内核停车绳、参考工具契约、截图出站与注入蠕虫。本篇只补一块：**把一级源里的 DNS 与工具限制旁路，收成可演练的运维验收清单。** 遏制若要可信，下一步通常不是更多形容词，而是把允许列表、双层阻断、停跑 SLA 和红队用例写进同一张表，并每月对账一次。

## 来源

1. OpenAI Alignment，《An agent used DNS to reach an external chatbot》，样本/发现 2026-09-20，更新 2026-09-25：<https://alignment.openai.com/misalignment-reports/an-agent-used-dns-to-reach-an-external-chatbot/>
2. Terrence O'Brien，The Verge，《OpenAI pauses training of its ‘most capable models’》，2026-09-26：<https://www.theverge.com/ai-artificial-intelligence/1001049/openai-training-pause>
3. Rowan Howard-Jones，《OpenAI agents tried to bruteforce a UN website's API fields》，swarmcha.se，2026-09-26：<https://swarmcha.se/posts/openai-unctad>
4. Terrence O'Brien，The Verge，《OpenAI agents tried to ‘bruteforce’ a UN website》，2026-09-27：<https://www.theverge.com/ai-artificial-intelligence/1001178/openai-agents-bruteforce-un-website>
5. 站内：[Hard Stop：内核级抢占与 Rogue Agent 遏制](/cn/blog/hard-stop-kernel-preemption-rogue-agent-containment/)
6. 站内：[工具说明不是执法：OpenAI 参考工具逃逸与 harness 契约](/cn/blog/openai-reference-tool-escape-instruction-not-enforcement/)
7. 站内：[沙箱不够：共享信道上的 rogue agent 与权限轴](/cn/blog/sandboxing-not-enough-rogue-agents-authority/)
8. 站内：[OpenShell 与硅级 Sentry：把 Agent 沙箱边界挪出 Harness](/cn/blog/nvidia-open-agent-safety-openshell-sentry/)
