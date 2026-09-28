---
title: "MCP 工具路径上的 SSRF：Google MCP Toolbox 与 HTTP 出网边界"
description: "解读 CVE-2026-14540 / GHSA-3x3x-8ffg-ghcv：MCP HTTP 工具路径上的 SSRF（CWE-918）为何对 agent 危险；SSRFGuard 默认拒绝私网；MCP 工具服务器为何落在经典 SCA 调用图之外；升级 1.5.0+ 与配置旋钮。"
pubDate: 2026-09-28T16:40:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "developer-tools", "security"]
lang: "zh"
---

Agent 真正危险的动作，往往不是「多写了几行代码」，而是**以服务端身份代发 HTTP**。模型选工具、填参数；harness 转发；MCP（Model Context Protocol）工具服务器再去打真正的后端。这一跳一旦缺少目的地边界，就不是「提示词写得不好」的问题，而是经典的服务端请求伪造——SSRF（Server-Side Request Forgery，服务端请求伪造）。

过去一年，团队把越来越多的「查库、调内部 API、拼业务 HTTP」封成 MCP tool，图的是复用与可观测。副作用是：以前只出现在少数后端网关里的代发能力，现在跟着 agent 会话高频出现。会话里的自然语言、检索片段、甚至别的工具返回值，都可能间接改写 path 一类参数。边界若只写在 README 的「请勿指向内网」，在生产里等于没有边界。

2026 年 7 月公开的 **CVE-2026-14540**（GHSA-3x3x-8ffg-ghcv）落在 Google 的 `googleapis/mcp-toolbox` 通用 HTTP source / tool 路径上：受影响版本 **0.3.0–1.4.0**，在 **1.5.0+** 经 PR #3448 引入 **SSRFGuard** 修复。顾问记录把它归到 **CWE-918**；GitHub Advisory 标 **high**，CVSS v4 常见引用分约 **8.0**（同条记录里 CVSS v3.1 为 6.1）。[1][2][3]

本文不复盘「怎么打」，只讲三件事：**缺了什么边界**、**为什么 agent / MCP 场景特别咬人**、**修完之后默认策略与配置该怎么读**。站内对照：今早的 [Exactly-Once 住在哪](/cn/blog/exactly-once-model-harness-tool-contract/) 谈工具副作用契约；[Traces 可被篡改](/cn/blog/llm-agents-tamper-own-traces-append-only-audit/) 谈审计完整性；[Harness 控成本](/cn/blog/control-the-harness-control-the-cost/) 与 [硬停与抢占](/cn/blog/hard-stop-kernel-preemption-rogue-agent-containment/) 谈控制面长在哪一层。本篇补的是另一条控制面——**HTTP 工具的出网边界**。安全审计工作流可另见 [Cloudflare security-audit-skill](/cn/blog/cloudflare-security-audit-skill-for-coding-agents/)。

## 这是哪一类缺陷：重定向边界与目的地 IP

顾问描述很干净：toolbox 对用户可控参数做了基线清洗，但底层 HTTP 客户端在初始化时**没有收紧的 `CheckRedirect` 策略**，也**缺少对目标 IP 的校验**。于是「路径一类参数」一旦能诱导后端发生开放重定向，或在效果上把后续请求拽向另一目的地，客户端就可能**盲目跟随**，以 toolbox 进程的网络身份去访问内网或任意外部端点。[1]

用机制语言说，这是 SSRF 里很常见的一截：**信任了「接下来要跟的 Location」**，却没有在跟随前后再问一句——解析出来的地址是不是本不该由这台服务代访的网段？缺的不是「再多写一句 prompt 别乱填 URL」，而是**出站请求的目的地策略**。

可以把失败模式拆成两层，仍然停在概念层：

1. **参数层。** HTTP tool 允许调用方影响 path（或等价字段）。在 agent 栈里，这些字段很少是「管理员手填的常量」，更常是模型根据对话拼出来的。
2. **客户端层。** 即便 base URL 看起来指向「合法上游」，若上游（或中间环节）返回重定向，客户端是否无条件跟随、跟随前是否重新裁决目的地 IP，决定了信任有没有在跳转时断裂。

顾问把第二层写清楚了：缺收紧的重定向钩子，又缺目标 IP 校验，等于把「跟到哪里」交给了外部环境。[1] 对安全工程来说，这比纠结某一个具体 path 字符串更重要——**品类问题是「代发客户端有没有目的地策略」**，不是「某个示例 URL 长什么样」。

PR #3448 公开文档把默认策略写明白了：HTTP source 默认对 SSRF 以及与 DNS 重绑定相关的竞态类问题采取严格防护——拦截、解析，并阻止连向私网（RFC 1918）、回环（如 `127.0.0.1`）以及链路本地（文档举例云厂商元数据地址 `169.254.169.254`）。[3] 也就是说，修复意图不是「再拦一层字符串黑名单」，而是把**解析后的 IP 是否允许连接**变成默认否决（default-deny）。

这里刻意停在概念层：公开材料点名了「缺 `CheckRedirect` / 缺 IP 校验」与「路径参数可与重定向耦合」——足够理解风险与补丁方向；逐步复现、可操作的内网探测步骤不属于本文范围，也不应出现在工程分享里。若你的岗位需要验证补丁是否生效，应在隔离环境用**供应商测试与回归套件**验证守卫行为，而不是把生产凭证拿去「试探内网」。

## 为什么 MCP / Agent 场景特别危险

在传统 Web 应用里，SSRF 往往要求攻击者能直接碰某个「代发 URL」的接口。Agent 栈把这个接口日常化了：

1. **参数经常受提示词影响。** 工具 schema 里的 path、query、resource id，最终可能来自用户输入、检索片段、甚至工具描述里的诱导文本。顾问明确写了：攻击者或**恶意数据驱动的 prompt** 都可能成为路径参数的来源。[1]
2. **执行身份是服务端。** 请求从 toolbox / MCP 主机发出，带的是部署侧凭证与网络可达性，不是浏览器沙箱。云上常见的链路本地元数据、VPC 内管理面、仅集群内可达的管理 API，对「跑在节点上的工具进程」往往比对外网关更近。
3. **模型不替你守网段。** 是否调用某工具，由运行时模型在输入条件下决定；经典程序里「这段代码会不会跑到」还能从调用图推，MCP 上更稳妥的立场是：**清单里暴露的工具，默认都应视为可达**——除非你在模型之外另有允许列表、作用域或人工确认。[4]
4. **失败看起来像「工具偶尔 5xx」。** 出网被滥用时，业务侧第一眼常见的是超时、奇怪的错误体、或偶发成功——不一定会触发「安全事件」工单。若日志不区分「被守卫拒绝」与「上游业务错误」，响应会更慢。

所以这件事和「工具契约」是同一张图的两边。今早那篇谈的是：写副作用时，恰好一次落在模型、harness 还是接口。[5] 本篇谈的是：读/代发 HTTP 时，**目的地允许集**落在哪一层。两边都不是「换更强模型就自然好」——模型既不保证幂等，也不保证不跟进私网。

再连一条审计线：若 agent 还能改自己的 traces，事后很难分清「该不该发出那次请求」。[6] 出网边界若只靠模型自觉，审计再完整也补不回一次已经打到元数据服务或内网管理面的请求。边界要长在 **HTTP 客户端与部署网络策略**上，而不是长在对话记录里。

还有一个容易被忽略的组织因素：**MCP 服务器常常由应用团队引入，安全团队的 SCA 流水线却仍按「语言包依赖」计费与告警。** 结果是：应用仓库的 CVE 面板很绿，agent 运行时却挂着一台带通用 HTTP tool 的旁路进程。CVE-2026-14540 正好打在这种缝上——不是因为 Google 的项目「特别差」，而是因为品类默认假设还停留在「库函数可达性分析」。[4]

## SSRFGuard：默认拒绝私网，再谈例外

修复以 **SSRFGuard** 为中心，挂在 HTTP source 的客户端构造路径上。公开文档与配置表给出的旋钮是：

| 配置项 | 默认（文档） | 含义 |
| --- | --- | --- |
| `allowPrivateNetworks` | `false` | 为 true 时才允许请求/重定向进入回环与私网（RFC 1918 / link-local） |
| `allowedIpRanges` | 空 | 显式放行的 IP 或 CIDR（白名单覆盖） |
| `customBlockedIpRanges` | 空 | 额外显式拉黑的 IP 或 CIDR |

文档示例是：把 `baseUrl` 指到公司内网 API 时，用 `allowedIpRanges` 只信任需要的子网，再用 `customBlockedIpRanges` 挡住子网里个别敏感主机——**先开窄门，再堵特例**，而不是一上来 `allowPrivateNetworks: true` 把整片私网打开。[3]

从 PR 可见的防护落点（仍保持高层面描述）包括：

- **解析后的 IP 裁决**：在连接控制点判断地址是否被拦截，而不是只看主机名字符串。只拦字面量 `localhost` 之类字符串，挡不住「名字无害、解析结果有害」的一类问题；守卫把裁决放到 IP 层，意图正在于此。[3]
- **重定向路径上的再校验**：`CheckRedirect` 对后续 Location 做解析与拦截；解析失败或命中拦截则拒绝跟随。信任不能「只在第一跳检查一次」。
- **配置期快速失败**：若 YAML 里的 `baseUrl` 直接写成被拦 IP，初始化即可失败，避免带着危险基址启动。
- **默认严格集合**：在未放宽私网时，非全局单播或私有地址一类目标按拦截处理（实现细节以上游代码为准）。[3]
- **与 DNS 重绑定 / TOCTOU 相关的防护意图**：文档写明默认防护覆盖这类问题；工程含义是——不能假设「解析那一刻安全，连接那一刻仍安全」可以靠侥幸成立，而要在跟随与连接路径上反复裁决。[3]

对运维来说，读配置时最容易踩的坑是：内网合法集成需要私网可达，于是整段打开 `allowPrivateNetworks`。更稳的默认是保持 **false**，用 `allowedIpRanges` 点名放行；敏感主机再进 `customBlockedIpRanges`。把「公司内网 API」和「链路本地元数据 / 本机管理口」当成同一档可达性，是历史 SSRF 事故里反复出现的分类错误——文档把元数据地址写进默认拦截举例，正是在提醒这一档。[3]

配置评审时可以用三句人话过关：

1. **这台 toolbox 到底需要打哪些网段？** 写进 CIDR，写进变更单，而不是「整个 VPC 都行」。
2. **有没有永远不该代访的地址？** 元数据、本机 agent 端口、兄弟租户的管理面——进自定义黑名单或直接从网络策略掐断。
3. **放宽是否可逆？** `allowPrivateNetworks: true` 应视为临时例外，带过期时间与负责人，而不是默认模板里的一行。

## 升级与处置：先到 1.5.0+，再审配置

顾问范围写得很清楚：`googleapis/mcp-toolbox` **0.3.0 到 1.4.0**。[1] 公开修复落在 PR #3448；工程侧处置应把运行中的 toolbox **升到 1.5.0 及以上**，再核对 HTTP source 是否仍依赖「隐式可达私网」的旧行为。[2][3]

建议按「加固清单」而不是「漏洞新闻」处理：

1. **盘点版本与暴露面。** 哪些环境跑了 mcp-toolbox？HTTP source / 通用 HTTP tool 是否启用？是否对不可信 prompt 或不可信工具描述开放？镜像标签、Helm values、本地开发用的 compose 文件都要扫，避免「生产升了、笔记本上的 agent 还钉着 1.4.0」。
2. **升级到含 SSRFGuard 的发行版（1.5.0+）。** 升级后默认应更严：原先「碰巧能打到私网」的集成可能突然失败——这通常是好事，说明边界开始生效。把这类失败当成迁移任务，而不是立刻用全局放行换安静。
3. **显式配置例外，不要全局放行。** 需要内网 API 时写清 CIDR；元数据与回环保持在默认拦截语义下，除非有经过评审的、极窄的例外。
4. **把出网策略写进部署层。** 容器网络策略、egress proxy、云厂商对 metadata 访问的额外限制，与应用内 SSRFGuard 是纵深，不是二选一。应用守卫被误配时，网络层还应能托底。
5. **把 MCP 工具清单纳入变更评审。** `tools/list` 返回的入口与 schema，就是你的「第二依赖清单」——谁能改清单，谁就在改攻击面。[4]
6. **核对观测。** 升级后确认日志/指标能区分「被 SSRF 守卫拒绝」与普通上游错误，避免值班把加固当成故障风暴。

披露时间线（研究者公开 write-up）：2026-07-03 CVE 由 Google 预留；2026-07-31 公开，修复合入 PR #3448，研究者具名致谢。全程协调披露。[4] 对站内读者，时间线的意义不是「谁先发」，而是：**修复是实质性的守卫与配置面，不是换一句警告日志**。

分数怎么读：公开讨论里常引用 **CVSS 8.0** 一档（与顾问记录中的 CVSS v4 分一致）；同条 GHSA 也给出 CVSS v3.1 **6.1**。对分诊来说，更有用的是 **high + CWE-918 + 落在 agent 代发路径**，而不是在两个矢量字符串之间争论一位小数。[1]

## SCA 为什么看不见这类依赖

研究者 Anas Mohiuddin Syed 的 write-up 里更耐读的一段，不是 CVSS，而是：**软件成分分析（SCA）习惯从应用代码建调用图，再问「脆弱函数是否可达」——这个问题对 import 进来的库成立，对 MCP 服务器不成立。**[4]

MCP 服务器经 stdio 或 HTTP 上的 JSON-RPC 被调用。应用并不直接调用服务器内部函数，只发消息。调用图停在传输边界，对岸的 handler 对经典可达性分析等于不存在。于是出现两条推论：

1. **边不在同一张图里，而在另一份工件里。** 服务器的 `tools/list` 枚举了可调用入口与 JSON schema。分析必须是双侧的：先解析部署实际暴露了哪些工具，再以那些 handler 为根进入服务端。[4]
2. **调用方是模型，会打穿「代码距离」叙事。** 普通程序里函数是否执行多半由代码决定；工具是否执行由运行时模型在（可能被部分污染的）输入上决定。更稳妥的立场是：**对 MCP，暴露约等于可达**——只有模型外的控制（允许列表、作用域、人工确认）才能收窄，而不是「调用图上离得远」。[4]

这解释了为什么「周末写成的静态规则」也能扫出官方工具箱里的高危问题：不是规则神奇，而是**这一依赖品类相对部署速度，几乎没被对抗式盯过**。研究者提到的 `mcp-safeguard`（PyPI，Zenodo 存档）对工具清单与 handler 做 CVSS 打分式静态规则，覆盖未校验重定向目标与 SSRF、经工具描述的注入、允许/拒绝列表绕过模式、过宽权限与凭证暴露等——规则本身不炫，缺的是把 MCP 服务器当成一等依赖来扫。[4]

对企业安全与平台团队，可执行的翻译是：

- 依赖清单不能只停在 `go.mod` / `package-lock.json`；还要有一份 **MCP 服务器与已启用 tools 的清单**（含版本、配置摘要、网络身份）。
- PR 审查要问：这个 tool 的 HTTP 出站是否有目的地策略？凭证是按 tool 收窄还是一把梭？
- 红队 / 审计工单里，「agent 能否触达元数据与内网管理面」应与「应用 SSRF」并列，而不是当成提示词问题。
- 采购与开源引入清单里，把「MCP 工具服务器」单列一类：有没有默认拒绝私网？有没有重定向再校验？配置例外是否可审计？
- 不要用「我们不用 Google 那套 toolbox」当免死金牌：自研或其它厂商的 HTTP tool，只要「模型填 path + 服务端代发」，威胁模型同构。

也可以换个比方：经典 SCA 像在检查「你 import 的图书馆里有没有被划破的书」；MCP 工具服务器更像「你另雇的一位跑腿，口头听模型吩咐去取件」。跑腿的问题不会出现在图书馆检索系统里——除非你单独给跑腿建花名册和行程规则。

## 和「工具契约 / 审计完整性」怎么拼在一张图上

把近几篇站内文章叠在一起，控制面大致是四层：

| 层 | 问题 | 站内线索 |
| --- | --- | --- |
| 模型 | 是否谨慎验证、是否诚实上报 | Exactly-once 第一区；勿信成功自报 |
| Harness | 重试、挂键、拦不可验证重复、成本与停机 | 控成本；硬停与抢占 |
| 工具契约 | 幂等键、状态查询、可见性滞后 | Exactly-once 第二区 |
| **出网边界** | 代发 HTTP 的目的地是否默认拒绝私网 | **本篇 / SSRFGuard** |

审计完整性（append-only、防篡改 traces）回答「事后能否信记录」；出网边界回答「事中该不该发出去」。少了后者，前者只能证明你完整地记录了一次不该发生的内网访问。少了前者，你甚至说不清是模型、工具还是人工改了轨迹。[5][6]

再补一句与安全 Skill 的分工：把审计流程做成可安装 Skill，解决的是「如何可复核地找洞」；[7] SSRFGuard 解决的是「HTTP 工具运行时默认不替你扫内网」。一个偏发现与证据，一个偏运行时否决——都需要确定性结构，而不是更长的 system prompt。

若你正在设计 agent 平台的「最低安全基线」，不妨把出网边界写成与幂等键同级的验收项：**凡是通用 HTTP tool，必须能演示 default-deny 私网，并拿出 CIDR 例外清单。** 做不到就不进生产工具目录。这比在 system prompt 里写「请勿访问内网」可执行得多。

## 工程上可以立刻做的（只含加固）

下面这些步骤都停在防御侧，不包含任何复现攻击的操作说明：

1. **升级**：mcp-toolbox → **1.5.0+**；确认构建产物确实包含 PR #3448 一类 SSRF 守卫，而不是只升了无关小版本号。[1][3]
2. **读配置**：HTTP source 保持 `allowPrivateNetworks` 默认 false；内网需求走 `allowedIpRanges`；敏感点进 `customBlockedIpRanges`。[3]
3. **缩工具面**：生产 agent 只挂需要的 tools；通用「任意 path 的 HTTP 工具」对不可信输入默认视为高风险能力。能拆成「固定 path 的专用 tool」就不要留万能 path。
4. **缩网络面**：给跑 MCP 工具服务器的身份单独的 egress 策略；元数据服务、链路本地、管理网段与公网 API 分域。
5. **把 MCP 纳入 SCA 邻近流程**：即使经典调用图扫不到，也要用清单级扫描或专项规则覆盖「工具服务器」品类；研究者公开提到的方向是对 manifest + handler 做静态规则，而不是幻想 import 图会自动长过去。[4]
6. **变更门禁**：新增 HTTP tool / 放宽 IP 范围，走与开放入站端口同级的评审。
7. **事件假设**：把「prompt 间接驱动的工具参数」写进威胁模型；不要假设「只有管理员会填 path」。
8. **文档与值班手册**：写明升级后可能出现的「合法内网调用被拒」，给出扩 CIDR 的标准流程，避免值班人员随手打开 `allowPrivateNetworks`。

若你维护的是自研 MCP 服务器而不是 Google 这套 toolbox，PR 文档里的默认策略仍然值得抄：**解析后 IP 上的 default-deny、重定向再校验、配置期失败、显式 CIDR 例外。** 品类教训比 CVE 编号更长久。


## 不要把「修了 CVE」当成「MCP 安全做完了」

SSRFGuard 解决的是 HTTP 代发路径上非常具体的一截：目的地是否默认落在不该去的网段。它不自动解决工具描述注入、过宽凭证、把破坏性写操作暴露给不可信会话、或 harness 层透明重试造成的双写。那些问题要分别落到 schema 审查、密钥分层、工具契约与审计上。[4][5]

换句话说，把本 CVE 当**品类抽检样本**最合适：若你们的流水线连「官方 toolbox 的 HTTP source 缺目的地守卫」都扫不到，那么自研 MCP 服务器上的同类缺口，也不太可能被现有 SCA 面板点亮。补丁要打；清单与守卫基线更要留下。

## 收束

CVE-2026-14540 看起来像又一条「HTTP 客户端没管好重定向」的旧新闻，但它扎在 **agent 已经把 MCP 工具服务器当成生产依赖** 的时刻。缺的是出网边界；修的是 SSRFGuard 与默认拒绝私网；教训是 **SCA 的调用图在 JSON-RPC 工具边界处断裂，暴露约等于可达**。[1][3][4]

升级到 **1.5.0+**，收紧 `allowPrivateNetworks` / `allowedIpRanges` / `customBlockedIpRanges`，并把 MCP 工具清单写进依赖与变更流程——这些比追一条热搜 CVE 标题更有用。模型可以帮你选工具；**不能**替你决定哪些 IP 永远不该被代访。控制面要继续往下钉：契约管副作用次数，守卫管代发去向，审计管事后能否信——三件都到位，agent 才比较像能上生产的系统，而不是「带工具的聊天框」。

若你只带走一句话，就带走这句：**把 MCP 工具服务器当成新的依赖品类，把 HTTP 出网的 default-deny 当成与鉴权同级的基线。** CVE 编号会过时；品类边界不会。

## 参考

[1] GitHub Advisory GHSA-3x3x-8ffg-ghcv（CVE-2026-14540）：受影响 `googleapis/mcp-toolbox` 0.3.0–1.4.0；CWE-918；high；CVSS v4 ≈8.0 / v3.1 6.1。 <https://github.com/advisories/GHSA-3x3x-8ffg-ghcv>

[2] CVE Record CVE-2026-14540. <https://www.cve.org/CVERecord?id=CVE-2026-14540> · NVD: <https://nvd.nist.gov/vuln/detail/CVE-2026-14540>

[3] googleapis/mcp-toolbox PR #3448（SSRFGuard 与 HTTP source 文档：`allowPrivateNetworks` / `allowedIpRanges` / `customBlockedIpRanges`；默认拦截私网、回环、链路本地含 `169.254.169.254`）. <https://github.com/googleapis/mcp-toolbox/pull/3448>

[4] Anas Mohiuddin Syed, *I found an SSRF in Google's official MCP Toolbox*（协调披露 write-up；SCA 盲区；exposure≈reachability；`mcp-safeguard`；时间线 2026-07-03 / 2026-07-31）. <https://anas-security-portfolio.vercel.app/google-mcp-ssrf.html>

[5] 站内：[Exactly-Once 住在哪](/cn/blog/exactly-once-model-harness-tool-contract/)（模型 / harness / 工具契约）

[6] 站内：[LLM agents 篡改自身 traces](/cn/blog/llm-agents-tamper-own-traces-append-only-audit/) 与 append-only 审计

[7] 站内：[Cloudflare security-audit-skill](/cn/blog/cloudflare-security-audit-skill-for-coding-agents/) 与 [Harness 控成本](/cn/blog/control-the-harness-control-the-cost/)、[硬停与抢占](/cn/blog/hard-stop-kernel-preemption-rogue-agent-containment/)
