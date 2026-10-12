---
title: "Codex 上云之后：可复用环境、Codex Security Cloud 与带 computer use 的 Agents API（DevDay 2026 拆解）"
seoTitle: "Codex Cloud、Codex Security Cloud 与 Agents API：DevDay 2026 拆解"
description: "OpenAI DevDay 2026 发了 20 多项更新，其中三条讲的是同一件事：coding agent 的 harness 变成可以买、可以租的产品。本文拆解 Codex Cloud 的可复用环境、Codex Security Cloud 的扫描—验证—修复循环、Agents API 的 computer use 与多 agent，旁注 Decisions API，对照 Claude Cowork 云沙箱与本地 CLI，附选型清单。"
pubDate: 2026-10-12T16:45:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "ai-coding", "security", "mcp"]
lang: "zh"
---

9 月 29 日的 OpenAI DevDay，官方回顾里列了 20 多项发布，覆盖 ChatGPT、Codex、模型和几种新的协作方式。[1] 站内已经单独写过最显眼的 [dots](/cn/blog/openai-dots-always-on-agent-engineering/)，这篇不再复述。剩下的发布里，有三条放在一起看更清楚：**Codex in the cloud**（带可复用开发环境的云端 Codex）、**Codex Security Cloud**（在云端扫仓库、验证漏洞、准备修复），以及 **Agents API 加上 computer use**，同时把 Codex 的多 agent、工具搜索、工具调用和上下文压缩搬进你自己的应用。[1]

三条说的是同一件事：coding agent 的 harness——模型外面那层循环、工具、沙箱和状态管理——正在被拆成可以单独买、单独租的产品。Codex Cloud 卖的是「agent 在哪台机器上干活」；Security Cloud 卖的是「拿同一套机器去找漏洞」；Agents API 卖的是「把整套循环嵌进你的产品」。选型时真正要问的，是每一层归谁管、出了事谁兜底。

站内相关：[Claude Cowork 改到云端执行](/cn/blog/claude-cowork-cloud-sandbox-where-agents-run/)已经把本地 VM、逐会话云沙箱、自带云电脑三种形态对照过一遍，Codex Cloud 的默认 VM 规格也在那篇里，这里不重复；harness 本身的结构见 [Agent Harness 模式](/cn/blog/inside-claude-code-agent-harness/)；今天上午那篇 [DeepSeek DSec](/cn/blog/deepseek-dsec-agent-rl-sandbox-execution-layer/) 讲的是**训练**用的沙箱，这篇讲的是**产品**里卖给你的沙箱，可以对着看。材料以 OpenAI 发布回顾、开发者文档和帮助中心为主；标「判断」的是我的看法。

## 先把三条发布摆在一张表上

| 发布 | 给谁用 | agent 跑在哪 | 发布时的可用范围 |
| --- | --- | --- | --- |
| Codex in the cloud | 开发者、团队 | OpenAI 管理的云端 VM，每个任务一个隔离工作区[2][3] | Plus、Pro、Business、Healthcare、Education、Enterprise[1] |
| Codex Security Cloud | 安全团队、维护者 | Codex 云端的临时隔离容器[8] | Pro、Business、Enterprise、Edu 的桌面端和网页端[1]；研究预览[6] |
| Agents API（computer use） | 做产品的开发者 | OpenAI 托管沙箱、你自己的环境，或不要环境[12] | API；在 Codex 与 ChatGPT Work 里限 Pro 500 和 Enterprise[1] |

同场还有几条相关的：Codex CLI 改版，支持语音发起和引导任务，新增 `/agents` 视图同时追踪多个任务，改进了编辑提示词、恢复会话和 worktree 的流程；桌面端新的 Code Review 可以在你离开时让 Codex 先在云端过一遍 PR。[1] 这些是本地端和审查端的配套，下文只在对照时带到。

## Codex Cloud：环境变成一个要「发布」的东西

旧的思路是：云端 agent 要一个容器，你写个 setup 脚本，跑完就开干。新版 Codex Cloud 把这一步做成了一个有版本感的对象，叫 **cloud environment**：仓库、依赖、工具和访问设置打包在一起，供任务复用。[2]

创建流程是对话式的。选 GitHub 仓库，Codex 自己检查仓库、装依赖和工具、跑一遍工作流；缺权限或信息时问你；你看过 setup 报告、配置和文件，确认没问题后点 **Publish**。[2] Codex 会把验证过的步骤记成两个字段：**Install script**（装依赖、准备开发资源的命令）和 **Start skill**（启动服务并检查是否就绪的说明）。[2] 文档说你不需要自己写安装脚本——这一点和 [DSec](/cn/blog/deepseek-dsec-agent-rl-sandbox-execution-layer/) 里「环境自举」的思路相近，只是一个面向训练集群，一个面向你的仓库。

发布之后，状态怎么流转是这套设计的核心：[2]

- **新任务**从已发布环境准备好的文件系统起步；
- **已有任务**继续用自己保存的文件，包括未提交的改动和装过的工具；
- **仓库刷新**在后台自动进行，保留依赖缓存，不重跑安装和启动命令；
- 改环境要走 Edit → 让 Codex 准备并测试 → **Republish**，只有之后的新任务才用新配置，已有任务保留原状态。

帮助中心补了一条：任务保存的 VM 状态默认在最后一次发起回合或恢复任务后最多保留 7 天，这是 VM 状态的恢复窗口，不是对话历史的保留期。[3] 新任务拿不到另一个任务未提交的改动，文档反复提醒：重要的东西提交到源码管理。[2][3]

判断：「发布 / 重新发布」这个动作把环境从一次性脚本变成了团队共享的基线，有点像镜像仓库里的 tag。好处是新任务启动快、大家起点一致；代价是你多了一个要维护的东西——依赖升级了要记得 republish，否则新任务会一直从旧快照起步。

### 凭证、网络和共享

凭证分两类。**环境变量**直接传给程序；**网络密钥（network secret）**只给程序一个占位符，请求发往允许的域名时由代理替换成真值，仅限 443 端口 HTTPS，原始凭证不进本地进程或文件。[2] 还有一个 **Personal vault**：共享环境可以声明「需要某个 key」，每个人从自己账号里填，共享的是需求，不是你的凭证。[2]

在 Enterprise 工作区里可以把环境共享给整个工作区。文档说得很细：能用这个环境，不等于能看别人的任务，也不等于能改环境；但环境里准备好的文件、环境自带的凭证、云身份和 VPN 连接，确实会给同事带来共享的服务访问。[2][3] 仓库访问和个人连接取决于跑任务的那个账号。[2]

出网由两层叠加：环境自己的 internet access 设置（可选 Package managers 预设、仅自定义域名或不限），加上管理员在 **Agent Security** 里配的工作区要求。[2][5] Agent Security 文档有两句值得抄下来：Agent Security 里允许的域名**不会**覆盖环境设置里的限制；如果策略允许完全的沙箱提权并且被批准了，那次执行可以绕过命令代理。[5] 私网用 VPN（目前只支持 Tailscale），云资源用 OIDC 拿短期凭证，OIDC 需要 Enterprise 申请开通。[2]

当前限制也要看清：云环境暂不支持 computer 和 browser use，也不支持 GitLab 和自托管的 GitHub Enterprise Server；仓库里的 skills 能用，本机的个人 skills 不会同步上去。[2] 过渡期内，Code Review、Security Review 以及 Linear、GitHub 集成仍跑在 Codex Cloud（Legacy）上；旧环境可以手动迁移，迁移不改动原环境。[3] 帮助中心还写明：云端 Codex 不在 OpenAI 的 BAA 覆盖范围内，不要拿来处理受保护的健康信息。[3]

OpenAI 的官方介绍视频把场景概括成一句：在电脑上开个 Codex 任务，合上笔记本，用手机接着看，然后把带仓库、网络和密钥的环境分享给团队。[4]（视频约 3 分半，我只核对了标题和简介，没有逐字稿可引。）

## Codex Security Cloud：扫描、验证、修复放进同一个环境

Codex Security 本身有本地版（桌面端插件、CLI 和 TypeScript SDK），这次新增的 **Codex Security Cloud** 是单独的插件，专门扫连接到 Codex 云端的 GitHub 仓库。[6] 回顾里的说法是：可以按需或定时扫整个仓库，持续检查新提交；Codex 调查发现、去重、在云端准备修复，笔记本合上也照常跑。[1]

文档把流程拆成四步：[8]

1. **分析**：为仓库生成威胁模型（threat model）——项目概览加攻击面细节，包括入口点、信任边界、认证假设和高风险组件；
2. **扫描**：一次性扫整个仓库，或者盯默认分支上的新提交，也可以回看历史提交；
3. **验证**：在干净的隔离容器里尝试复现疑似漏洞，复现成功的标为已验证，用来压低误报；
4. **修复**：给出修复建议，能生成时附上最小可执行的 diff，供人审过再开 PR。

几个边界很明确。每个分析和验证任务都跑在临时的 Codex 容器里，工具只在会话内有效，产物提取出来后容器就销毁。[8] 补丁**不会**自动应用，也不会直接改你的 PR 分支；要点「Create draft pull request」才会开草稿 PR。[7][8] 它不靠 fuzzing 或特征签名，而是靠语言模型推理、测试时计算、工具和长上下文；[9] 文档也明说它是 SAST 的补充，不是替代，也替代不了人工的可利用性判断和威胁评估。[8] 威胁模型可以看、可以改，官方建议随架构变化持续修正。[8][9]

和 Codex Cloud 的关系在于：扫描需要一个兼容的 Codex 云环境，新建扫描时可以选 **Auto** 自动建一个，也可以选已有环境；验证阶段如果有助于复现，它可能会在容器里尝试构建项目。[7][8] 权限上，Enterprise 和 Edu 工作区要同时打开 Codex Cloud 和 Codex Security 两项，并可以按角色、组（含 SCIM 同步的组）限制；管理扫描配置还要单独的 admin 权限。[9]

**Daybreak Blue** 那句要读仔细。回顾说 Security Cloud 包含通过 Daybreak Blue 提供的模型，不用单独申请 Daybreak。[1] Daybreak 是 OpenAI 的网络安全可信访问计划，Blue 档对 GPT-6 Sol、GPT-6 Luna 等主线模型放宽拒答，用于漏洞分级、安全代码审查、补丁验证等防御工作。[10] 但帮助中心限定了范围：Security Cloud 附带的 Daybreak Blue 只在这个云产品里有效，不给你其他 Codex Security 产品或 API 里的 Daybreak Blue。[9]

计费在发布后两天就定了：2026 年 10 月 1 日太平洋时间 12:53（北京时间 10 月 2 日 03:53）之后设置的仓库扫描和持续扫描，按 token 用量以套餐费率计费，**不计入**套餐自带的用量额度；截止前没设持续扫描的符合条件账号，改拿 500 美元免费扫描额度，工作区内共享、不过期，用完再按量计费；截止前已设好的持续扫描免费到 10 月 15 日，之后不开付费就暂停。[8] 每次扫描可以看输入、缓存输入和输出 token 及费用。[8]

判断：Security Cloud 真正有意思的地方，是它和写代码的 agent 共用同一套环境对象。漏洞能不能复现，取决于环境能不能把项目跑起来；你为 Codex 写代码配好的环境，顺手就成了安全验证的基础。反过来，环境配得糙，误报和「无法验证」也会多。官方的上线建议也很朴素：先挑少量仓库和固定的审阅人；不用 GitHub Cloud 的团队，先拿低风险或非生产仓库评估；修复 PR 再用 Codex Code Review 过一遍，防止修复带进回归。[9]

## Agents API：把 Codex harness 租给你的应用

前两条是 OpenAI 自己的产品。Agents API 则是把同一套东西做成接口：文档第一句就是「Agents API 让你的应用通过 OpenAI 托管的 API 使用 Codex harness」。[11] OpenAI 管会话、编排、上下文压缩和故障恢复，你的应用提供工具、选择执行环境。[11]

概念只有四个：**Agent**（模型、指令、工具、MCP server）、**Environment**（可选的沙箱或电脑）、**Session**（持久的 agent 实例）、**Events and items**（输入和输出）。[11] 环境有三种选法：[12][13][14]

- **不要环境**：适合只回答问题或调外部服务的 agent。这时内置的 Bash、apply-patch、工作区文件都用不了。
- **OpenAI 托管沙箱**：带 Python、Node.js 和常用命令行工具的 Linux 工作区。规格可选 1 vCPU/1 GB、2 vCPU/4 GB、4 vCPU/16 GB；网络可以全开、全关，或限定 1–100 个精确主机名（不支持通配符，子域名和重定向目标要单独列）；没有活动和 keep-alive 超过一小时，沙箱可能被删，这个时限不能改。[13]
- **自托管环境**：在你的笔记本、容器或远程沙箱里跑 executor（就是 Codex CLI），它用一个受限的环境 key 出站连 WebSocket，执行 harness 下发的命令；所有连接都是出站的。[14] 文档列了 Modal、Cloudflare、Vercel、Daytona、E2B 等现成适配。[14]

安全页的提醒很直白：agent 生成的代码能碰到环境里的文件、凭证和网络；环境 key 会被 agent 代码读到，所以它只能用来连接环境，别的 API 操作都不行；第三方凭证应留在环境外，托管沙箱用 vault 密钥加代理替换，自托管的要你自己搭可信代理。[15] 这和 Codex Cloud 的网络密钥是同一种做法。

计费：模型按 API 费率，OpenAI 工具按标准费率，托管沙箱按标准容器费率。[11] 我没有在这些页面上找到更具体的数字，这里不展开。

### computer use：浏览器跑在 OpenAI 那边

加 `computer_use` 工具，环境设成 OpenAI 托管并打开 desktop，agent 就能在托管浏览器里操作网页，适合测试网站、收集信息或通过 UI 用一个应用。[16] 有意思的是控制点放在哪：

- **按来源（origin）审批**：浏览器访问每个新的网站来源前都要用户批准，公开网站也一样；打开网络访问并不等于批准。[16]
- **不按动作审批**：文档专门写了一节，说来源审批**不保证**每个动作前都有确认。如果你必须保证下单、破坏性修改这类动作前有人确认，要么把托管浏览器限制在做不了这些事的资源上，要么换成你自己控制的浏览器运行时；靠一个「确认」函数工具，取决于 agent 会不会去调它。[16]
- **网页内容不可信**：它不能授予权限，也不能推翻用户指令。[16]
- **登录走专用通道**：用户填的账号、密码、验证码通过单独的事件提交，不进模型输入，在会话历史里也会被略去；目前不支持 passkey 和二维码登录。[16]
- **截图是敏感数据**：只给有权限的用户看，别进日志。[16]

判断：这几条正好对上站内写过的 [DNS 旁路和工具逃逸](/cn/blog/openai-agent-containment-dns-and-un-bruteforce/)，以及 [沙箱不够](/cn/blog/sandboxing-not-enough-rogue-agents-authority/) 里的权限轴：沙箱和来源白名单管的是「能去哪」，管不了「到了以后做什么」。OpenAI 自己在文档里把这条线画出来了，算是诚实。还有个容易漏的对照：Codex Cloud 的云环境**暂不支持** computer 和 browser use，[2] 而 Agents API 的托管环境支持。想让 coding agent 在云端顺手点开预览页验收 UI，目前得走 Agents API 这条路。

### 多 agent：共享一个文件系统

开 `multi_agent` 之后，harness 自带创建、发消息、等待、打断子 agent 的工具，不用你声明；`max_concurrent_subagents` 默认 6，不含协调者。[17] 关键细节有三条：[17]

- 协调者和子 agent **共享同一个环境的文件系统**，创建子 agent 不会多开环境；
- 子 agent 继承 MCP 工具（含凭证和允许的工具）和 web search 设置，但**不支持函数工具**；
- 事件流不给完整的 agent 间对话记录；想知道哪条命令是谁跑的，要按回合查 `subagent_id`。

判断：共享文件系统让并行子任务交接方便，也意味着一个子 agent 搞坏的文件，其他人都会看到。需要隔离的子任务，应该拆成不同 session、不同环境，而不是指望子 agent 之间有边界。可观测性那条也要提前规划：审计要能回答「谁跑了这条命令」，就得把回合和子 agent 的映射存下来。

顺带一句：**Bedrock Managed Agents** 把 Agents API 的核心能力搬到 AWS，harness 和推理跑在 Bedrock，命令和工具由 AgentCore Runtime 或自托管计算执行，用 IAM 鉴权；文档也提醒概念相同不代表接口和功能完全一致。[1][18]

## 旁注：Decisions API 是控制面的一块

DevDay 还有一条小发布：**Decisions API** 让 Luna 只回答你预先定义好的一组问题、从有限的答案里选，输入可以是文字或图片，用来做内容分类、请求路由，或者决定 agent 下一步做什么；发布时是有限预览。[1] TechCrunch 报道说 Altman 在台上解释，把模型聚焦在这个选择上可以做得非常快，同时保留图像理解、多语言和安全防护；报道还把它和 TypeSafe 的 Jev 这类「快速决策模型」放在一起比较。[19]

放在这篇的框架里，它的位置很清楚：harness 里有很多不需要长推理的决策点——这个请求交给哪个 agent、这个动作要不要拦下来送审——用便宜、快的有限选择模型来做，就是一块控制面组件。站内 [Control the Harness, Control the Cost](/cn/blog/control-the-harness-control-the-cost/) 讨论过路由对成本的影响，这里不展开。目前公开信息很少，TechCrunch 也说还没看到开发者实测。[19]

## 横向对照：同一层，不同的归属

| 维度 | Codex Cloud | Codex Security Cloud | Agents API（托管 / 自托管） | Claude Cowork 云端会话 | 本地 Codex CLI |
| --- | --- | --- | --- | --- | --- |
| 谁跑 harness | OpenAI[3] | OpenAI[8] | OpenAI[12] | Anthropic[20] | 你的电脑[5] |
| 谁跑执行 | OpenAI 云 VM[3] | 临时 Codex 容器[8] | OpenAI 沙箱，或你接入的环境[12][14] | 逐会话临时沙箱[20] | 你的电脑[5] |
| 环境怎么来 | 对话式准备并发布，可共享[2] | 自动建或选已有云环境[7] | 请求参数 / 模板，或自备镜像[13][14] | 会话开始创建、结束销毁[20] | 你的本机 |
| 状态 | 已有任务保留文件，VM 状态默认可恢复 7 天[3] | 任务完成即销毁[8] | 无活动 1 小时可能删（托管）[13] | 随会话销毁[20] | 你自己管 |
| 凭证 | 网络密钥占位替换、Personal vault、OIDC[2] | 继承环境；补丁不自动应用[7][8] | vault 占位替换；环境 key 只能连接[15] | 会话级 token 数小时过期，connector token 不进沙箱[20] | 本机凭证 |
| 出网 | 环境设置叠加 Agent Security[2][5] | 依赖环境设置[7] | 全开 / 全关 / 1–100 主机[13] | 默认够不到私网；Enterprise 默认无网[20] | 本地策略与 MDM[5] |
| 浏览器 | 暂不支持[2] | 不适用 | 托管浏览器，按来源审批[16] | 经桌面应用访问本机浏览器[20] | 取决于本地工具 |

表里最值得注意的是第一行：除了本地 CLI，其他方案的 harness 都在厂商那边。这意味着你能调的是**参数和策略**，不是循环本身；想改循环的团队，还是要看 [Pi 1.0](/cn/blog/pi-1-0-codemode-mcp-minimal-harness/) 这类可以自己改的 harness。

## 选型清单

**如果你是用 Codex 的团队：**

1. 先决定哪些任务要上云：需要跑很久、需要合上电脑继续的、需要多人复用同一起点的，上云划算；要碰本机私有工具链或本地登录态的，留在本地 CLI。
2. 把环境当代码管：记录每次 republish 改了什么，依赖升级后主动重新发布，定期拿新任务验证起点是干净的。
3. 凭证优先用网络密钥，只有程序必须读到原值时才用环境变量；共享环境前检查里面的文件、环境自带凭证、VPN 和 OIDC 身份。[2]
4. 出网从 Package managers 预设起步，按需加域名；在 Agent Security 里测一次允许的请求、一次应该被拦的请求，再测一次提权后的命令。[5]
5. 涉及健康数据的，先确认 BAA 覆盖范围。[3]

**如果你在评估 Codex Security Cloud：**

1. 先挑少量仓库、固定审阅人，读一遍自动生成的威胁模型并改到符合实际架构。[9]
2. 把「已验证」和「未验证」分开排队，未验证的不要直接当噪音丢掉，看日志判断是不是环境问题。[8]
3. 补丁走正常代码审查，最好再过一遍 Code Review。[9]
4. 设好预算：看清截止时间后的计费规则、免费额度余额和每次扫描的 token 消耗。[8]
5. 别把它当 SAST 的替代，原有确定性扫描保留。[8]

**如果你要在产品里嵌 Agents API：**

1. 先想清楚环境：不需要文件就选「不要环境」；要私网或自有镜像就自托管，并按用户或工作负载隔离。[12][14][15]
2. computer use 只开给能承受「来源已批准、动作未逐项确认」的场景；涉及付款、删除、对外发送的，换自己控制的浏览器运行时，或把能做这些事的资源挡在外面。[16]
3. 登录凭证只走专用事件，界面上遮蔽、不进日志、提交不自动重试。[16]
4. 多 agent 默认共享文件系统；需要隔离的拆 session。保存回合与 `subagent_id` 的映射，审计时才能追到人。[17]
5. 关闭事件流不会停任务，要停得显式取消回合；做好断线恢复。[16]

## 判断：这一轮 OpenAI 在卖什么

第一，**环境成了一等公民。** 过去 harness 的竞争集中在循环和工具上，这次 OpenAI 花了大量文档在环境的准备、发布、共享、凭证和网络上。谁能让「agent 的起点」稳定、可复用、可审计，谁的 agent 就更像一个能交给团队用的工具。

第二，**安全扫描是环境的第二个用法。** 同一个环境对象既给写代码的 agent 用，也给验证漏洞的 agent 用。这个复用很聪明，也意味着环境质量会同时影响开发效率和安全信号。

第三，**控制点写在文档里，读的人要接住。** 按来源审批不等于按动作确认，Agent Security 的钩子出错可能不拦截，提权可能绕过代理——这些都是 OpenAI 自己写明的。[5][16] 买托管 harness 省掉的是搭建成本，不省「哪些动作必须有人确认」这个设计决定。

## 结语

DevDay 2026 最热闹的是 dots 和新模型，但对做 coding agent 的团队，更实在的是这三条：Codex 有了可以发布和共享的云环境，安全扫描拿同一套环境做验证，Agents API 把整套 harness 连同浏览器和子 agent 一起租给你。先选好 agent 在哪台机器上跑、凭证怎么进、谁来确认关键动作，再决定用哪一个。

## 参考来源

1. [OpenAI：DevDay 2026 Recap（2026-09-29）](https://openai.com/index/devday-2026-recap/)
2. [OpenAI ChatGPT Learn：Cloud environments（Codex Cloud）](https://learn.chatgpt.com/docs/environments/cloud-environments)
3. [OpenAI Help Center：Using Codex Cloud](https://help.openai.com/en/articles/20001545-using-codex-cloud)
4. [OpenAI（YouTube）：Meet the all new Codex Cloud（2026-09-29）](https://www.youtube.com/watch?v=7Bv68f5szSU)
5. [OpenAI Developers：Agent Security（Codex Enterprise）](https://developers.openai.com/codex/enterprise/agent-security)
6. [OpenAI Developers：Codex Security](https://developers.openai.com/codex/security)
7. [OpenAI Developers：Codex Security Cloud setup](https://developers.openai.com/codex/security/setup)
8. [OpenAI Developers：Codex Security Cloud FAQ](https://developers.openai.com/codex/security/faq)
9. [OpenAI Help Center：Codex Security](https://help.openai.com/en/articles/20001107-codex-security)
10. [OpenAI Help Center：OpenAI Daybreak - Trusted Access for Cyber Overview](https://help.openai.com/en/articles/20001258-openai-daybreak-trusted-access-for-cyber-overview)
11. [OpenAI API Docs：Agents API overview](https://developers.openai.com/api/docs/guides/agents-api/overview)
12. [OpenAI API Docs：Agents API architecture](https://developers.openai.com/api/docs/guides/agents-api/architecture)
13. [OpenAI API Docs：OpenAI-hosted environments](https://developers.openai.com/api/docs/guides/agents-api/environments/openai-hosted)
14. [OpenAI API Docs：Self-hosted environments](https://developers.openai.com/api/docs/guides/agents-api/environments/self-hosted)
15. [OpenAI API Docs：Environment security](https://developers.openai.com/api/docs/guides/agents-api/environments/security)
16. [OpenAI API Docs：Computer use（Agents API）](https://developers.openai.com/api/docs/guides/agents-api/tools/computer-use)
17. [OpenAI API Docs：Multi-agent（Agents API）](https://developers.openai.com/api/docs/guides/agents-api/multi-agent)
18. [OpenAI API Docs：Bedrock Managed Agents](https://developers.openai.com/api/docs/guides/agents-api/bedrock-managed-agents)
19. [TechCrunch：OpenAI's Jev clone could help the frontier lab stop its swarming agents（2026-09-30）](https://techcrunch.com/2026/09/30/openais-jev-clone-could-help-the-frontier-lab-stop-its-swarming-agents/)
20. [Claude Help Center：Claude Cowork architecture overview](https://support.claude.com/en/articles/14479288-claude-cowork-architecture-overview)
