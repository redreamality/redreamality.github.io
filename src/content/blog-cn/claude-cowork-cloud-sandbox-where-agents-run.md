---
title: "Claude Cowork 改到云端执行：agent 的「手」该放在本地 VM、会话沙箱还是自己的云电脑"
description: "10 月 6 日起，Claude Cowork 的 Pro/Max 新任务默认在云端逐会话沙箱里跑，本地文件改由桌面应用代理。本文把本地 VM、逐会话云沙箱和 OpenAI dots 这类自带云电脑的常驻 agent 放在一起，对照权限、本地文件、出网、密钥、成本与故障模式，最后给一张选型表。"
pubDate: 2026-10-06T10:40:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "security", "developer-tools", "anthropic"]
lang: "zh"
---

Anthropic 的 Felix Rieseberg 在 10 月 5 日解释了 Claude Cowork 的一次架构调整，Simon Willison 把这段话摘了出来：「旧版」Cowork 的模型推理在云端，工具调用则在 Anthropic 随应用装到你电脑上的 VM 里执行；「新版」把推理和 VM 都放到云端，每个会话一个独立沙箱，彼此不共享状态；VM 需要用户设备上的东西（比如一个文件）时，由桌面应用负责这次文件访问的工具调用。[1] 帮助中心同时给了时间表：2026 年 10 月 6 日起，Pro 和 Max 套餐的新 Cowork 任务在云端运行，设置里的「Only on your computer」选项被移除。[2]

当新闻读，这条就是「Cowork 上云了」。但它回答的是一个做 agent 的团队迟早要面对的问题：**agent 的「手」——跑命令、读写文件、开浏览器的那部分——到底该在哪台机器上执行？** 同一时期，OpenAI 发布了自带云电脑的常驻 agent dots，并把 Codex 搬进云环境；[5][6][8] Microsoft 的 Autopilot 也在租户里有「自己的身份、记忆、电脑和工作区」。[13] 答案不同，取舍可以放进同一张表。

站内相关的地基：[沙箱不够](/cn/blog/sandboxing-not-enough-rogue-agents-authority/) 讲隔离之外还要管权限；[OpenShell 与 Sentry](/cn/blog/nvidia-open-agent-safety-openshell-sentry/) 讲把执行边界挪出 harness；[PixelLeak](/cn/blog/pixelleak-coding-agents-public-screenshot-egress/) 讲 agent 自己开出站通道；[MCP Toolbox 的 SSRF](/cn/blog/google-mcp-toolbox-ssrf-tool-path-boundary/) 讲工具路径上的网络边界。

## 先把事实摆平：Cowork 这次改了什么

把几份一手材料对齐，差别如下。

**旧版（本地执行）。** 推理在云端。Felix 说 VM 是出于能力和安全考虑加的，只映射你明确加进会话的数据。[1] 架构文档更细：agent loop 原生跑在设备上，负责对话、在已连接文件夹里读写文件、web fetch 和本地插件的 MCP server，由应用层权限系统把关；shell 命令和 Claude 写的代码跑在一台专用 Linux VM 里，由 hypervisor 和宿主隔离（macOS 用 Apple Virtualization.framework，Windows 用 Hyper-V），VM 自带出网过滤、syscall 限制和逐会话用户隔离。[3] 所以严格讲，旧版是文件和网页工具在宿主上、代码执行在 VM 里。

Felix 说用户不喜欢本地 VM 带来的磁盘、电量和性能开销，也不喜欢合上笔记本工作就停。[1]

**新版（云端执行）。** agent loop 和代码执行都跑在 Anthropic 管理的一个隔离临时沙箱里：会话开始时创建、结束时销毁，沙箱之间、组织之间不共享状态；这套基础设施和 Anthropic 的公司、研究、训练环境分开。[3] 关键属性有五条：[3]

- 默认够不到你的网络：不能访问私网、内网、link-local 和云元数据地址，也够不到 Anthropic 内部系统。
- 网络访问沿用现有策略：和本地 Cowork、chat 同一个设置；Enterprise 默认不开网络。
- 出网在沙箱外强制：所有出站流量过一个沙箱改不了、绕不开的代理，只有白名单目的地可达。
- 只给短期凭证：会话级 token 几小时内过期；connector 授权 token 不进沙箱，调用在服务端发起。
- 数据层按租户隔离：每条存储记录绑定到组织和账号。

**本地文件怎么办。** 云端会话需要本地文件或浏览器时，请求经 Anthropic 中转的连接发给那台设备上的 Claude 桌面应用；只限桌面端连接过的文件夹，每次本地工具调用前都按用户权限检查；桌面应用离线就够不到设备。[3] 任务需要某个文件时，Claude 取的是**那一个文件的副本**，删除会话时副本一并删除。[2] 网页端和手机端要读写本地文件，前提是桌面应用开着、**并且会话是从桌面端发起的**；应用关了，会话照常跑，只是碰不到本地文件。[2]

**迁移细节。** 已在本机启动的任务留在本机做完，顶部可下载对话记录转到 Claude Code。定时任务也搬到云端，用到本地文件的需要桌面应用开着。想继续在本机跑，官方的路是桌面版 Claude Code，但项目和定时任务不会迁过去。[2] 本地连接器和带本地 MCP server 的插件只能经桌面应用工作，本地 MCP server 不在云端会话里运行。[2][3]

## 三种原型：把「脑」「循环」「手」拆开

讨论「agent 在哪跑」时，最容易混的是三层东西。OpenAI 的企业文档有一句很干净的拆法：任务分**协调**和**执行**两部分，协调决定走哪些步骤、推着对话往前，执行是工具干的活，比如跑一条 shell 命令。[10] 再加上模型推理，就是三层：

| 层 | 干什么 | Cowork 旧版 | Cowork 新版 |
| --- | --- | --- | --- |
| 推理（脑） | 生成下一步 | 云端 | 云端 |
| agent loop / 协调 | 决定调用哪个工具、管理上下文 | 本机原生 | 云端沙箱 |
| 执行（手） | 跑命令、读写文件、浏览器 | 代码在本机 VM，文件工具在宿主 | 代码在云端沙箱；本地文件、浏览器经桌面应用回连 |

按这三层，可以归纳出三种原型（这是我的归类，不是哪家的官方术语）：

**原型 A：本地 VM。** 循环和执行都在用户设备上，代码进本地 VM，旧版 Cowork 是典型。数据不离开设备，但吃本机资源、设备一关就停。

**原型 B：逐会话云沙箱。** 每个会话或任务开一个临时隔离环境，用完销毁或过期。新版 Cowork 是这一类；Codex Cloud 也接近：每个新任务从已发布的环境里拿一个自己的隔离工作区，Pro/Business/Enterprise 默认 4 vCPU、16 GiB 内存、32 GiB 磁盘，任务的 VM 状态在最后一次使用后默认可恢复 7 天。[8]

**原型 C：常驻 agent 自带云电脑。** agent 有一台长期存在的电脑，状态跨任务保留，没人找它时也在干活。OpenAI 的 dots 文档说，dot 住在云端，有自己的电脑和浏览器，你的电脑关机它也在；这台电脑可以在两次使用之间保留状态，有自己的文件、软件和浏览器会话。[6] Microsoft 的 Autopilot 也是云端托管，在租户里有自己的身份、记忆、电脑和工作区。[13]

还有一种常见的**混合形态**：协调在云端，执行留在本机。OpenAI 的 Work Cloud 本地访问把协调搬到云端，但不会把每个工具和文件都搬离电脑，需要本机的步骤仍由电脑提供。[10] 新版 Cowork 本质上是 B 加一条回连通道。dots 也能连一台个人电脑（默认关闭，同时只能连一台），在上面创建本地 Work 或 Codex 任务。[6]

## 逐项对照：搬到云端之后，什么变了

### 权限：能力边界和行为规则是两回事

新版 Cowork 的权限有两层。一层是**能力边界**：云端会话只能碰连过的文件夹，每次本地工具调用都要过权限检查；管理员可以关掉云端会话、设网络策略、关掉持久的「always allow」，还能要求可信设备登记。[3] 另一层是**审批模式**：「Manually approve」「Automatically approve」（执行前先审每个动作）和「Skip all approvals」（什么都不检查）；任何模式下永久删除文件都要你确认。[4]

dots 这边，可能影响账号或外发信息的动作在执行前会自动审查，决定放行、请你批准，还是必须你亲自做（比如改密码）；自定义规则有四档：直接做、你说了才做、先问、交给你做。[7] 文档写明这些规则「是 dot 尽力遵守的指令，它可能犯错」，且**不授予**任何访问。[7]

我的读法：两家都把「能碰什么」（系统强制的能力边界）和「什么时候停下来问」（靠模型遵守的行为规则）分开了，选型时要分清你依赖的是哪一种；把后者当前者用的后果，见站内 [工具说明不是执法](/cn/blog/openai-reference-tool-escape-instruction-not-enforcement/)。还有个例外：Anthropic 明说 computer use 「没有沙箱隔在 Claude 和你屏幕之间」，也不走其他工具的权限检查。[4] 一旦开了它，执行位置实际上又回到了你的桌面。

### 本地文件：从「文件不出门」到「文件夹不出门、副本出门」

旧版的承诺是只把你明确加进来的数据映射进本地 VM。[1] 新版的说法要仔细读：「你的文件夹留在你的电脑上」，但任务需要某个文件时，Claude 会把**那个文件的副本**取到云端；会话在 Anthropic 服务器上跑，所以它经桌面应用打开的本地文件也在 Anthropic 服务器上处理，而不是只留在你的设备上。[2][4] 安全指南还特意提醒：如果电脑由组织管理，连接本地文件夹就意味着这些文件夹可以被云端会话访问。[4]

对有数据驻留要求的团队，这要重新评估：「连接了一个文件夹」从「本机 VM 能看见」变成了「云端会话按需拉副本」。站内 [macOS Full Disk Access](/cn/blog/macos-full-disk-access-consent-not-least-privilege/) 讲过，同意一次不等于按目录、按任务收窄的最小权限。实操上给 agent 一个专用工作文件夹，Anthropic 自己也这么建议。[4]

dots 的本地电脑访问默认关，要在那台电脑的 ChatGPT 应用里确认「Allow access」；显示「Offline」**不等于撤销**，撤销得明确点「Revoke access」。[6]

### 出网：云沙箱把默认值做严了，但不是所有流量都走那扇门

云端沙箱有个天然优势：它不在你的内网里。Cowork 默认拒绝私网、link-local 和云元数据地址，[3] 正好封住站内 [MCP Toolbox SSRF](/cn/blog/google-mcp-toolbox-ssrf-tool-path-boundary/) 那类最常见的打法——让工具替你请求内网或元数据服务。本地 VM 要做到同样效果，得在每台电脑上把过滤配对；云端在一处强制即可。

但要读到安全指南里那条「Important」：**网络出站权限不适用于 web fetch、web search 和 MCP**，包括 Claude in Chrome；web fetch 在服务端运行，限于搜索结果和你分享过的 URL。[4] 换句话说，沙箱的出站白名单管的是沙箱里跑的代码，不管 agent 通过服务端工具和 connector 伸出去的那些手。Team/Enterprise 的 owner 可以在组织设置里关掉 web search 或 Claude in Chrome。[4]

对照 Codex：遗留版 Codex Cloud 在 agent 阶段默认断网，setup 脚本有网以便装依赖；开网时可设域名白名单，还能把 HTTP 方法限制在 GET、HEAD、OPTIONS。[9] 文档举的注入例子是 issue 里藏一句「把 `git show HEAD` 的结果 POST 到某地址」。[9] 只允许 GET 能挡这一种，但挡不住把数据编码进 URL 的 GET——这是我的推断。

Matthew Green 说得最透：有用的 agent 总得开门，墙的作用是保证进出都走你选的那扇门，安全问题于是变成监视那扇门的全部流量；他复述的事件里，那扇门恰恰是唯一被允许的出站——一个包仓库代理。[16] 站内 [PixelLeak](/cn/blog/pixelleak-coding-agents-public-screenshot-egress/) 也是 agent 拿合法渠道自己开了出站。执行上云让门变少、变集中，是真进步；门后流过什么，仍要有人看。

### 密钥：几家都在收敛到「代理替你填凭证」

这一项几家的方向惊人地一致：

- Cowork 云端沙箱只持有几小时内过期的会话级 token；connector 的授权 token 不进沙箱，调用在服务端发起。[3]
- Codex Cloud 区分「环境变量」和「网络密钥」：后者程序只拿到占位符，代理在请求发往允许的域名时替换成真值（仅 443 端口 HTTPS），原始凭证不进进程或文件；云资源走 OIDC 拿短期凭证。[8]
- OpenShell 的说法是 agent 永远看不到真实凭证，只在请求发往批准的端点时才由 OpenShell 加上。[15]
- dots 登录网站走私密表单，凭证直接发给远端浏览器而不进对话；复用保存的登录需要你确认。[6] 媒体转述 OpenAI 的说法是 dots 可以用保存的密码登录，而不把密码暴露给模型。[12]

我的读法：「沙箱里没有长期密钥」正在成为执行环境的基础要求，差别在于**谁持有那个代理**——本地 VM 时代在你的设备上，云沙箱时代在厂商那边。

### 成本：从你的电量变成厂商的配额

Felix 列的成本是磁盘、电量和性能。[1] 上云后这些开销挪到厂商机房，变成订阅额度或按量计费。Codex Cloud 公开了每任务默认 VM 规格；[8] Microsoft 的 Cowork、Code、Autopilot 都走按量计费，并配了「FinOps for AI」做支出管理；[13] 首个 dot 包含在 Pro 和 Business Premium 套餐里。[11]

推断：原型 C 没人找时也在干活（dots 会用只读工具做主动研究[7]），花费不再和你发起的任务数挂钩。站内 [默认硬预算帽](/cn/blog/default-hard-budget-caps-agent-deployed-services/) 说下游服务要有硬停线，常驻 agent 本身也该有。

### 故障模式：新出现的是「半连接」

三种原型坏掉的方式不同：

- **本地 VM 起不来。** Cowork 文档写得很实在：VM 不可用时，文件和网页工具照常跑，shell 和代码执行报「workspace unavailable」，直到 VM 恢复。[3]
- **云沙箱，本地那半断了。** 桌面应用关了，会话继续跑，但读不到本地文件。[2] 任务没停，只是少了一只手。我的建议：依赖本地文件的任务，拿不到文件时应停下来问，而不是用旧副本或猜测继续。
- **常驻 agent，停不干净。** dots 文档专门区分了三种停：Pause 只停当前主任务，不停已委派的任务，也不取消以后的定时运行；委派任务要单独停；定时任务要去 Scheduled 里关。停下来也不会撤销已完成的动作，删除 dot 不会撤回已经发给别人的消息。[7] 云浏览器被网站挡住时，还可以让 dot 改用已连接的电脑，这可能新开一个本地任务[6]——执行位置可能在任务中途变化。

定时任务是共同的放大器。Anthropic 建议从低风险任务开始，不要定时去碰敏感文件、代发消息、买东西，每次跑完看结果，不用就暂停。[4]

### 可观测性：EDR 看不见了，换成厂商日志

这一点最容易漏。Cowork 架构文档的 FAQ 直说：端点检测（EDR）工具看不到本地 VM 里面，这是有意设计；云端会话完全在端点之外，EDR 同样看不到；合规依赖端点可见性的，上线前要想清楚。[3] 替代手段是 Compliance API 和面向 Team/Enterprise 的 OpenTelemetry 事件流。[3][4]

NVIDIA 的五条原则里有两条正好对上：执行必须 out-of-band（控制不在 agent 里，也不在它够得着的地方）；通向模型的路径是控制点，因为 agent 没有下一个想法就没法行动。[14] 在原型 B 和 C 里，这两个控制点都在厂商那边，你得到的是厂商愿意导出的日志和开关，而不是自己插在链路上的探针。站内 [Hard Stop](/cn/blog/hard-stop-kernel-preemption-rogue-agent-containment/) 讲过两侧都要有强行停机的手段；放到托管 agent 上，问题变成厂商的停止按钮到底停掉了什么。

## 隔离限制的是代码在哪跑，不是 agent 读什么、做什么

Anthropic 安全指南里有一句我认为最诚实的话：「隔离限制的是 Claude 的代码在哪里跑，它不限制 Claude 读什么或做什么。」云端会话照样能浏览网页、通过 connector 读邮件和文档、在连接的文件夹里干活，每一条都是不可信内容进来、agent 动作出去的通道。[4] 文档给的判据是：提示注入要得手，必须**同时**能读到信任边界之外的内容、又能执行可能危害你的动作；去掉一条，攻击就难得多。[4]

这和 Green 的第三个框架一致：他担心的是一群从不离开沙箱、乖乖照做的 agent，只是下指令的人不该下指令；把共享包缓存换成邮件、Slack 和共享文档，就有了蠕虫的全部原料。[16] 云沙箱对这类风险帮助不大，因为攻击走的是 agent 本来就有权用的通道。

插件让这件事更要紧。Anthropic 开源的 knowledge-work-plugins 每个插件打包了 skills、connectors、slash commands 和 sub-agents，connector 经 `.mcp.json` 接 MCP server，全是 markdown 和 JSON。[18] 安全指南提醒：装一个插件可能显著扩大行动范围，插件里打包的本地 MCP server 在你电脑上以普通程序的权限运行。[4] 再结合「本地 MCP server 不在云端会话里跑」[3]，我的推断是：**上云之后，风险最高的那部分执行其实没有搬走**，只是调用方换成了云端。企业可以用 MDM 键 `isLocalDevMcpEnabled` 关掉本地 MCP server；关掉后云端会话只剩按文件夹限制的桌面文件工具。[3]

## 其他家的位置，以及隔离为什么变便宜了

把几家的公开描述放在一起：

- **Microsoft**：Copilot 的 Code 在沙箱里运行，可托管在你的租户内；Copilot Managed Runtime 让代码在公司自己的 Microsoft 365 环境里跑，由 IT 管；Autopilot 是有自己身份和电脑的常驻 agent。[13] 注意 Copilot 里也有个叫 Cowork 的委派模式，和 Claude Cowork 无关。[13]
- **OpenAI**：dots 自带云电脑；Codex Cloud 是逐任务 VM；Agents API 加了 computer use，底层基础设施由 OpenAI 运行；Bedrock Managed Agents 则能让 OpenAI 的 agent 完全跑在 AWS 里。[5]
- **NVIDIA**：OpenShell 是开源（Apache 2.0）运行时，每个 agent 一个沙箱，在内核层对文件、系统调用和网络连接执行策略，用形式化验证检查策略变更多放开了什么；能在本地跑，也能用 Helm 部署到 Kubernetes。[15] 也就是说，「执行位置」和「谁定策略」可以拆开，这是 A/B/C 之外的另一条轴。

隔离成本也在下降。gVisor 10 月 2 日宣布捐给 CNCF，博客说它的进程模型能做到 VM 类运行时达不到的装箱密度，且不需要硬件或嵌套虚拟化；列出的采用者包括 Google、Ant Group、OpenAI 和 Anthropic。[17] 要说清楚：博客**没有**说 Cowork 的云沙箱用的是 gVisor，我也没找到相关公开说法。它说明的是趋势：逐会话开隔离环境的边际成本在变低，这是原型 B 能当默认值的前提。

## 反例与边界：什么时候本地仍然更合适

以下几种情况，原型 A 或混合形态仍然更合适：

1. **数据不能离开设备。** 新版 Cowork 经桌面应用打开的本地文件在 Anthropic 服务器上处理。[4] 有硬性驻留要求的，走本地 Claude Code，或者干脆不连那个文件夹。
2. **合规依赖 EDR。** 云端会话在端点之外，EDR 看不见。[3]
3. **工具链只在本机。** 本地 MCP server、内网依赖、本机登录态。Codex Cloud 提供 VPN（目前支持 Tailscale）和 OIDC 把云端任务接进私网，[8] 但这等于在你的网络上为 agent 开一个入口，要单独评估。
4. **要在同一环境里反复试错。** 原型 B 每次从干净环境开始；Codex 的已有任务会保留自己的文件和已装工具，[8] 原型 C 的电脑则跨任务保留状态。[6]

原型 C 适合持续盯着某件事的工作，但会放大成本、停机和权限漂移；原型 B 是多数一次性委派任务的合理默认值。

## Cowork 用户 10 月 6 日之后的检查

如果你在用 Pro/Max 的 Cowork，以下几条可以照着过一遍（依据帮助中心和安全指南）：[2][3][4]

1. 列出所有连过的本地文件夹，删掉不需要的，换成一个专用工作文件夹。
2. 检查定时任务：哪些用到本地文件（需要桌面应用开着），哪些会发消息、碰敏感数据。
3. 正在本机跑的旧任务，做完前下载对话记录；需要继续本地执行的，转到 Claude Code。
4. 审视装过的插件，特别是带本地 MCP server 的；它们仍在你的电脑上以你的权限运行。
5. 涉及敏感账号、首次使用的工具或难以撤销的动作，切到「Manually approve」。
6. 企业管理员：确认云端会话开关、网络策略、是否关闭持久「always allow」、是否要求可信设备；评估 EDR 不可见对合规的影响；按需用 MDM 关闭本地 MCP server 和桌面扩展。

## 选型表：团队怎么决定 agent 在哪跑

| 问题 | 倾向本地 VM（A） | 倾向逐会话云沙箱（B） | 倾向常驻云电脑（C） |
| --- | --- | --- | --- |
| 数据能否离开设备 | 不能 | 可以，按文件拉副本可接受 | 可以，且接受长期驻留 |
| 任务形态 | 交互式、短 | 一次性委派、可并行 | 持续、主动、跨天 |
| 需要设备离线后继续 | 否 | 是 | 是 |
| 需要本机工具 / 登录态 | 是 | 偶尔，经回连通道 | 偶尔，经已连接电脑 |
| 合规依赖端点可见性 | 是（但 VM 内部 EDR 也看不到[3]） | 否，改用厂商日志 | 否，改用厂商日志 |
| 对内网的需求 | 天然在内网 | 默认隔离，需 VPN / OIDC 另开 | 同 B，且长期在线 |
| 成本敏感点 | 设备资源 | 每任务额度 | 持续消耗，需硬上限 |
| 主要故障 | VM 起不来 | 回连断开（半连接） | 停不干净、权限漂移 |

不管选哪一列，下面这份清单都适用：

- [ ] 沙箱里没有长期密钥；凭证由沙箱外的代理按目的地注入。
- [ ] 出站白名单在沙箱外强制，并且清楚列出**哪些流量不走它**（服务端工具、connector、浏览器）。
- [ ] 默认拒绝私网、link-local 和云元数据地址。
- [ ] 本地访问按文件夹、按会话授权；离线和撤销是两个不同状态，团队知道怎么撤销。
- [ ] 区分系统强制的能力边界和模型遵守的行为规则；高风险动作依赖前者。
- [ ] 回连断开时任务的行为有明确约定：停下来问，而不是用旧数据继续。
- [ ] 停止按钮停掉的范围有文档：主任务、委派任务、定时任务分别怎么停。
- [ ] 审计来源确定：EDR、厂商 Compliance API、OpenTelemetry，哪一路覆盖哪一段。
- [ ] 长时间运行或常驻的 agent 有硬预算上限，而不只是提醒。
- [ ] 插件和 MCP server 走评审；本地 MCP server 按「本机程序」的标准管。

Cowork 这次调整本身不复杂。值得记住的是 Anthropic 自己写下的那条边界：隔离决定代码在哪跑，不决定 agent 能读什么、做什么。[4] 执行位置是工程选择，权限设计才是安全选择，两件事要分开评估。

## 参考

1. Simon Willison，《A quote from Felix Rieseberg》，2026-10-05：<https://simonwillison.net/2026/Oct/5/felix-rieseberg/>
2. Claude Help Center，《Use Claude Cowork on web, desktop, and mobile》：<https://support.claude.com/en/articles/15520349-use-claude-cowork-on-web-desktop-and-mobile>
3. Claude Help Center，《Claude Cowork architecture overview》：<https://support.claude.com/en/articles/14479288-claude-cowork-architecture-overview>
4. Claude Help Center，《Use Claude Cowork safely》：<https://support.claude.com/en/articles/13364135-use-claude-cowork-safely>
5. OpenAI，《DevDay 2026 Recap》，2026-09-29：<https://openai.com/index/devday-2026-recap/>
6. OpenAI Learn，《Connect computers and apps to your dot》：<https://learn.chatgpt.com/docs/dots/computers-and-apps>
7. OpenAI Learn，《Control your dot》：<https://learn.chatgpt.com/docs/dots/controls>
8. OpenAI Learn，《Cloud environments》（Codex Cloud）：<https://learn.chatgpt.com/docs/environments/cloud-environments>
9. OpenAI Learn，《Codex Cloud (Legacy): internet access》：<https://learn.chatgpt.com/docs/cloud/internet-access>
10. OpenAI Learn，《Local computer access for Work Cloud and dots》：<https://learn.chatgpt.com/docs/enterprise/cloud-local-access>
11. 9to5Google，《OpenAI launches Dots, new 'always-on agents' you can assign tasks to》，2026-09-29：<https://9to5google.com/2026/09/29/openai-dots-agent/>
12. The Indian Express，《OpenAI's Dots explained》，2026-10-01：<https://indianexpress.com/article/technology/artificial-intelligence/openai-dots-always-on-ai-agents-explained-10900652/>
13. Microsoft，《Introducing the new Copilot with Home, Code and Autopilot》，2026-09-25：<https://blogs.microsoft.com/blog/2026/09/25/introducing-the-new-copilot-with-home-code-and-autopilot/>
14. NVIDIA Developer Blog，《NVIDIA Open Agent Safety Platform: A Reference for Continuous In-Silicon Agent Monitoring》，2026-09-28：<https://developer.nvidia.com/blog/nvidia-open-agent-safety-platform-a-reference-for-continuous-in-silicon-agent-monitoring/>
15. NVIDIA/OpenShell README：<https://github.com/NVIDIA/OpenShell>
16. Matthew Green，《Is sandboxing sufficient to contain rogue agents?》，2026-09-30：<https://blog.cryptographyengineering.com/2026/09/30/is-sandboxing-sufficient-to-contain-rogue-agents/>
17. gVisor Blog，《gVisor is being donated to CNCF》，2026-10-02：<https://gvisor.dev/blog/2026/10/02/gvisor-cncf/>
18. anthropics/knowledge-work-plugins README：<https://github.com/anthropics/knowledge-work-plugins>

说明：OpenAI 的 dots 发布页（openai.com/index/introducing-dots/）与其帮助中心文章抓取时返回 403，本文关于 dots 的事实取自 OpenAI Learn 文档 [6][7][10]、DevDay 回顾 [5] 和媒体转述 [11][12]。
