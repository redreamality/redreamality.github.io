---
title: "Claude Code 会把什么发出你的电脑：四条出站通道与密钥管控清单"
description: "Claude Code 在本地跑，但每一轮都要把上下文发给模型，还有遥测、报错、WebFetch、MCP 和 Bash 的出网。本文按官方文档把四条出站通道逐条拆开：各自带走什么、默认开没开、能用哪些开关管住；顺带核实「关遥测就不读 AGENTS.md」事件的修复状态，拆解本地脱敏网关 Tokenhush 的做法与边界，最后给一份可照抄的检查清单。"
pubDate: 2026-10-07T16:45:00+08:00
author: "Remy"
tags: ["claude-code", "security", "ai-agents", "developer-tools"]
lang: "zh"
---

最近有两件小事，把「Claude Code 到底往外发了什么」这个老问题又翻了出来。

一件是 Tokenhush，一个本地网关：把 Claude Code 的 API 地址指向它，它在请求离开机器前把密钥替换成占位符，回来时再换回去。[20] 另一件是 9 月 23 日在 HN 上引发热议的一篇博文：作者发现自己关掉遥测后，Claude Code 新支持的 `AGENTS.md` 根本不加载，原因是这个功能挂在一个远程 feature flag 后面。[16][17] 这个帖子现在标题后面挂着 `[fixed]`，后面会核实「修好了」到底指什么。

两件事放在一起，说明一个常被混淆的问题：「发给模型的上下文」「发给 Anthropic 的运维流量」「agent 自己发出去的东西」是不同的流量，开关各管各的。关了遥测，代码照样每轮发给模型；挂了脱敏网关，Bash 里一条 `curl` 照样能把文件带走。

这篇不追新闻，按 Claude Code 官方文档把出站通道逐条摊开：每条带走什么、默认开没开、有哪些开关、开关管不到哪里。站内相邻的几篇不重复：[扩展全景](/cn/blog/claude-code-extension-stack-mods-plugins/)、[Agent Harness 模式](/cn/blog/inside-claude-code-agent-harness/)、[PixelLeak](/cn/blog/pixelleak-coding-agents-public-screenshot-egress/)、[沙箱不够](/cn/blog/sandboxing-not-enough-rogue-agents-authority/)、[Cowork 上云](/cn/blog/claude-cowork-cloud-sandbox-where-agents-run/)。

文中版本号和行为以 10 月 7 日抓取的官方文档和 CHANGELOG 为准（当时最新版本是 2.1.292）[15]，标「判断」的是我的看法。

## 先看地图：四条出站通道

| 通道 | 带走什么 | 发到哪 | 默认 | 主要管控 |
| --- | --- | --- | --- | --- |
| 一、模型请求 | 你的提示词、模型输出，以及上下文里的一切：指令文件、读过的文件、工具输出 | Anthropic API，或 Bedrock / Vertex / Foundry / 你的网关 | 必开，这是产品本身 | 账号类型与保留策略、Read 拒绝规则、hook、出口脱敏网关 |
| 二、运维流量 | 使用指标、错误报告、feature flag 拉取、`/feedback`、问卷、WebFetch 域名检查、更新检查 | Anthropic 及其第三方日志服务 | 直连 Anthropic API 时大多默认开 | 一组环境变量 |
| 三、Web 与 MCP | WebFetch 请求的 URL、WebSearch 的查询、MCP 工具调用的参数 | 任意网站、Anthropic 搜索后端、MCP 服务器 | 按权限模式询问或放行 | WebFetch 域名规则、MCP 审批与拒绝规则 |
| 四、Bash 与副作用 | 命令能碰到的任何东西：`curl`、`git push`、包管理器、你自己配的 OTel 导出 | 任意主机 | 沙箱默认关 | 沙箱网络白名单、凭据屏蔽、整进程隔离 |

还有一个不出网但值得记住的地方：本地磁盘。Claude Code 默认把会话记录以明文存在 `~/.claude/projects/` 下 30 天，用来恢复会话，可以用 `cleanupPeriodDays` 调整。[1]

判断：「我已经关了 telemetry」的安全感只覆盖第二条通道。数据大头在第一条，危险的外泄路径在第三、四条。

## 通道一：模型请求，真正的大头

### 上下文里到底有什么

官方文档说，Claude Code 为了和模型交互发出的数据「包括所有用户提示词和模型输出」，传输用 TLS 1.2 以上加密。[1] 但「提示词」三个字容易让人低估。每一轮请求里实际会有：

- **指令文件。** 工作目录及其上级目录的 `CLAUDE.md`、`CLAUDE.local.md` 会在启动时拼接进上下文；子目录里的 `CLAUDE.md` 在 Claude 读写那个目录下的文件时补进来。[8] `@path` 导入的文件同样展开进上下文，最多递归四层。[8]
- **AGENTS.md。** 从 v2.1.277 起，没有 `CLAUDE.md` 时会读 `AGENTS.md`。[8][15]
- **自动记忆。** 每个项目的 `~/.claude/projects/<project>/memory/MEMORY.md` 是索引，每次会话都会加载；记忆文件不受会话记录的清理周期影响，一直留到你或 Claude 删掉。[8]
- **读过的文件和 `@` 引用。** Read 工具读到的内容，以及你在提示词里 `@` 引用的文件。
- **工具输出。** Bash 的 stdout/stderr、Grep 的匹配行，都会作为工具结果进入下一轮请求。

最后一项最容易漏：它跑了一条 `printenv` 或打印配置的测试命令，输出里就是密钥。

Janz 在 Dev.to 上做过一次抽样：在最近 90 天有推送、非 fork、未归档的 GitHub 仓库里，6.2%（51/817）有 `AGENTS.md`，5.4% 有 `CLAUDE.md`；按全部公开仓库算，`AGENTS.md` 只有 1.0%。[19] 作者在评论里补充，两种文件任有其一的活跃仓库约为 9.4%。[19] 这些文件的特点是**每次会话都整份发给模型**。

判断：凡是写进 `CLAUDE.md`、`AGENTS.md` 或被它们 `@` 导入的内容，都按「每次都会发出去」来对待。内部域名、测试账号、运维手册里那句「密码见 xx」，不该放进这些文件。

### 发到哪、留多久、会不会拿去训练

这部分完全取决于账号类型，官方数据使用页给了明确口径：[1]

- **训练。** 消费者账号（Free、Pro、Max）可以选择是否允许数据用于改进模型，开着就会用于训练，包括 Claude Code 产生的数据。商业账号（Team、Enterprise、API、第三方平台、Claude Gov）不用 Claude Code 的代码和提示词训练生成模型，除非客户主动加入 Development Partner Program 这类计划。
- **保留。** 消费者账号允许训练时保留 5 年，不允许时 30 天；商业账号标准保留 30 天。
- **零数据保留（ZDR）。** 只对符合条件的 Claude for Enterprise 组织按组织单独开通，覆盖 Claude Code 的推理请求；但不覆盖 Cowork、claude.ai 聊天，也不覆盖 MCP 服务器等第三方集成处理的数据。开了 ZDR，涉及违规的会话仍可能保留最长 2 年。[12]

ZDR 只对登录进 ZDR 组织的请求生效，开发者用个人账号登录就不在覆盖范围内，所以要用 `forceLoginMethod`、`forceLoginOrgUUID` 托管设置锁住登录。[12] 走 Bedrock、Vertex、Foundry 时，保留策略看各平台自己的规定。[1][12]

### 管控一：别让它读到

最直接的开关是 `permissions.deny` 里的 Read 规则。文档的说法是：匹配的文件会从文件发现和搜索结果里排除，读取被拒，Edit 和 Write 也被拦。[5] 几个容易踩的点：

1. **`.claudeignore` 不起作用。** 文档明说项目里有这个文件也没用，要把条目搬进 Read 拒绝规则。[4]
2. **规则只管它认得的读法。** Read/Edit 拒绝规则覆盖内置文件工具、Bash 里能识别的 `cat`、`head`、`tail`、`sed`、`tee`，以及 `>`、`<` 重定向；但不管 `grep -r pattern .` 这种不点名文件的命令，也不管 Python、Node 脚本自己去开文件。要在操作系统层面拦住所有进程，得开沙箱。[4][5]
3. **路径写法有讲究。** `Read(.env)` 等价于 `Read(**/.env)`，只管当前目录及以下；管整个文件系统要写 `Read(//**/.env)`。用户设置里的 `Read(/secrets/**)` 指的是 `~/.claude/secrets/**`。[4]
4. **符号链接。** 指向被拒文件的链接也会被拦。[4] 但指令文件曾是例外：2.1.290 修复了软链接到工作目录之外的 `CLAUDE.md`、`AGENTS.md` 在有 Read 拒绝规则时仍会加载的问题。[15]

另一个更粗的开关是 `permissions.blockReadsOutsideWorkingDirectories`：在所有权限模式下（包括 `bypassPermissions`）拒绝 Read、Grep、Glob、LSP 读工作目录之外的路径，要求 v2.1.257 以上。[5] 它不像拒绝规则那样拦 shell 命令。

### 管控二：读到了也别发出去

hook 能在两个时点插手。

**动手之前：`PreToolUse`。** 它在 Claude 生成工具参数之后、执行之前运行，可以返回 allow、deny、ask、defer，退出码 2 直接拦下这次调用。[6] 但文档专门警告：你在提示词里 `@` 引用的文件是在拼提示词时直接塞进去的，不经过任何工具调用，所以**不会触发 PreToolUse**，包括匹配 `Read` 的 hook；要拦 `@` 引用，只能靠 Read 拒绝规则。[6]

**执行之后：`PostToolUse` 的 `updatedToolOutput`。** 它能在工具输出送给 Claude 之前整体替换，文档的例子就是把 Bash 的 stdout 换成 `[redacted]`。[6] 这是内置机制里最接近「出口脱敏」的，但工具已经跑完，副作用已生效；OpenTelemetry 的工具 span 在 hook 之前就记下了原始输出；替换值不符合内置工具的输出结构会被忽略。[6]

**你自己贴的内容：`UserPromptSubmit`。** 它在提示词交给 Claude 之前运行，可以返回 `decision: "block"` 拦下，适合扫一遍粘贴内容里有没有 key。但被拦的提示词默认会写进磁盘上的会话记录，加 `suppressOriginalPrompt` 也只改提示信息，文档明说拦截 hook「不是让密钥不落盘的办法」。[6]

判断：hook 适合做规则写不出来的判断，比如按内容扫描。但它是 harness 里的回调，不是边界。

### 管控三：在出口统一替换，Tokenhush 的做法

如果担心的是「不知道哪一轮会意外带上密钥」，另一种思路是不管上下文怎么来的，在请求出门那一刻统一扫描。Tokenhush 就是这么做的。下面只写仓库 README 和文档里明确写了的内容。[20][21][22]

**接入方式。** 一个只监听回环地址的 HTTP 网关，默认 `127.0.0.1:8787`。对 Claude Code，`eval "$(tokenhush env claude)"` 的效果就是设置 `ANTHROPIC_BASE_URL=http://127.0.0.1:8787`。[20][22] 不装根证书，不做中间人。

**怎么替换。** 它遍历整个出站 JSON 请求体，包括嵌套对象和数组，跑已开启的检测器，把命中的值替换成 `__PII_<type>_<digest>__` 形式的占位符，再转发上游。默认开 5 个检测器：`prefix`（`sk-`、`AKIA`、`ghp_`、`glpat-`、`xox*`、`AIza`、`npm_` 这些已知前缀）、`jwt`、`pem`（私钥头）、`luhn`（能通过 Luhn 校验的卡号）、`email`。第 6 个 `entropy`（高熵字符串）默认关，README 的解释是它在真实 agent 流量上误报，曾经弄坏函数调用。[20]

**怎么还原。** 响应（包括 SSE 流）先整份缓冲，再把本会话的占位符换回原值交给客户端，所以没有逐 token 流式输出。映射只在内存里。它**从不在出站方向把占位符填回去**，以防提示词注入骗网关把密钥回显给模型。[20]

**它明说做不到的。** 经 base64、hex、URL 编码的密钥不识别；JSON 键名里的密钥不识别；响应方向不做脱敏；不支持自定义 base URL 的客户端（README 点名了 Claude 桌面应用和浏览器网页端）覆盖不到。[20][21] 鉴权头原样转发；检测器出错时拒绝请求而不是放行；它自己只往 `updates.tokenhush.com` 发更新检查和规则同步两类请求，都能关。[20]

把它和 Claude Code 官方文档对照，还有几处要知道：

- `ANTHROPIC_BASE_URL` 指向非 Anthropic 主机时，MCP tool search 默认关闭，Remote Control 不可用。[3]
- 只设 `ANTHROPIC_BASE_URL`、不设网关凭据时，请求照样走网关，但已保存的 claude.ai 订阅登录仍是生效凭据；网关如果要把这类流量转给 Anthropic，需要转发 `anthropic-beta` 里的 OAuth 能力头。[13] Tokenhush 说自己原样转发鉴权头，但订阅登录能否完整走通，我没有实测，仓库文档也没写。
- 它只看得见通道一。WebFetch 的域名检查、遥测、MCP 服务器、Bash 里的 `curl` 都不经过它。

这个仓库 9 月 11 日创建，抓取时只有个位数 star，性能开销尚未公布。[20]

判断：出口脱敏解决的是「无意中把密钥带进上下文」，前提是密钥长得像密钥；它不解决「agent 主动把文件发到别处」，那是通道四的事。

## 通道二：遥测、报错和其他运维流量

官方把这部分称为 operational telemetry，分两类：[1]

- **使用指标**：延迟、可靠性、使用模式，文档说「从不包含你的代码、提示词或文件路径」。`DISABLE_TELEMETRY=1` 关闭。
- **错误报告**：内部错误信息和堆栈，发送前脱敏已知格式的密钥、文件路径、邮箱；只在 Pro/Max 订阅登录、v2.1.198 以上、直连 Claude API、组织无 ZDR 或 HIPAA 协议时开启。`DISABLE_ERROR_REPORTING=1` 关闭。

两者分别发往 Datadog 的两个 intake 主机，只在直连 Anthropic API 时发送。[2]

真正会带走代码的是另外几项，都要你主动操作：[1]

- **`/feedback`**（以及 `/bug`、`/share`）会把包含代码的对话记录发给 Anthropic，保留 5 年，还可能在公开仓库建 issue。`DISABLE_FEEDBACK_COMMAND=1` 关闭。
- **会话质量问卷**本身只记评分；之后的「能不能看你的会话记录」选「是」，会上传对话记录、子 agent 记录和原始会话日志，已知 key 格式会被脱敏，但源代码和文件内容原样上传，保留最长 6 个月。

还有几项不太显眼：

- **feature flag 拉取**：从 `api.anthropic.com` 获取，很多功能靠它开启。[2][3]
- **WebFetch 域名安全检查**：每次 WebFetch 前把主机名（不是完整 URL）发给 `api.anthropic.com` 查黑名单，**不管你用哪家模型都会发**。[1]
- **claude.ai 的 MCP connector** 经 `mcp-proxy.anthropic.com` 中转，对 claude.ai 登录用户默认开启。[2]

### 一个总开关，和它管不到的地方

`CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` 一次关掉自动更新、遥测、错误报告、`/feedback`、release notes、PR 状态徽章检查和各种可用性检查。[3] 两个细节：

1. **设成 `0` 或 `false` 照样是关。** 它和 `DISABLE_TELEMETRY`、`DISABLE_ERROR_REPORTING` 一样，任何非空值都算开启，想恢复只能删掉变量。[3] 而 `DO_NOT_TRACK` 按标准布尔值读，`0` 表示不关。[3]
2. **它不管 WebFetch 域名检查和官方插件市场自动安装。** 前者要在设置里写 `skipWebFetchPreflight: true`，代价是 WebFetch 不再查黑名单；后者要设 `CLAUDE_CODE_DISABLE_OFFICIAL_MARKETPLACE_AUTOINSTALL`。[1][3] claude.ai connector 也要单独用 `ENABLE_CLAUDEAI_MCP_SERVERS=false` 或 `disableClaudeAiConnectors` 关。[2]

走 Bedrock、Vertex、Foundry 或 Claude Platform on AWS 时，指标、错误报告和 `/feedback` 默认就是关的，但问卷和 WebFetch 域名检查照常运行。[1]

### AGENTS.md 事件：关了遥测，关掉的不只是遥测

回到开头那篇博文。作者在 2.1.280 的代码里找到了 `AGENTS.md` 加载器的注册：一个内置插件，默认关闭，可用性取决于远程 flag `tengu_agents_md_mod`，拿不到 flag 时回退为 `false`。[16] 他的实测结论：`CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1` 或 `DISABLE_TELEMETRY=1` 任一存在，`AGENTS.md` 都不加载；设成 `0` 也没用；在项目的 `.claude/settings.json` 里清掉这两个变量也没用；全程没有任何提示。[16] 临时办法是在旁边放一个只有一行 `@AGENTS.md` 的 `CLAUDE.md`，因为 `@` 导入不依赖 flag。[16]

「修好了」能核实到的是：

- 帖子在北京时间 9 月 23 日 20:15 发到 HN，标题现在带 `[fixed]`。[17]
- 约 40 分钟后，一位自称负责这个功能的用户回复：这是灰度发布留下的问题，需要远程开关以便出问题时关掉，而关了遥测就拿不到 flag；修复会在当天发布的 v2.1.281 里。也有人说当时 `claude update` 还只能拿到 2.1.280。[17]
- CHANGELOG 的 2.1.281 条目写着：AGENTS.md 支持改为也适用于 Bedrock、Vertex AI、Foundry、LLM 网关和**关闭遥测的会话**。[15] 记忆文档现在也写明「v2.1.281 之前，Bedrock 或关闭遥测等会话只读 `CLAUDE.md`」。[8]
- 但对应的 GitHub issue #95690 在我抓取时仍是 open 状态；博文正文也没有补充修复说明。[18][16]

准确的说法是：按官方 CHANGELOG 和文档，问题在 2.1.281 修复；issue 本身还没关。文档里「需要拉取 feature flag 的功能」清单现在也没有 AGENTS.md 了。[3]

判断：这件事真正值得记住的不是 bug 本身，而是文档现在写得很明白的一点：`DISABLE_TELEMETRY` 和 `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` 都会顺带关掉 feature flag 拉取。[1][3] 关掉之后，Remote Control、`/import`、把大段粘贴标记为「粘贴内容」等一串功能不可用，文档列了十几项。[3] 文档里没有「只关使用指标、保留 flag」的组合；`DISABLE_ERROR_REPORTING` 不影响 flag，可以单独关。[1] 隐私开关和功能开关绑在一起，升级后要回头看一眼这张清单。

## 通道三：WebFetch、WebSearch 和 MCP

**WebFetch** 会对目标网站发请求，User-Agent 以 `Claude-User` 开头。[10] 拿到页面后，多数情况下会另起一次模型调用，按提取提示处理页面，Claude 收到的是这次调用的结果而不是原始页面。[10] 这意味着网页内容也会经过模型请求。管控有三层：`WebFetch(domain:...)` 的允许、询问、拒绝规则；手动和 `acceptEdits` 模式下每次抓取都会询问（规则已允许的域名和一组内置文档域名除外）；v2.1.285 起可以用 `CLAUDE_CODE_DISABLE_WEB_FETCH=1` 整个关掉。[10] 有一点要注意：在沙箱网络白名单里加了域名，并不影响 WebFetch，它只看自己的权限规则。[7][10]

**WebSearch** 把查询发给 Anthropic 的搜索后端，后端不可配置；权限规则只有裸的 `WebSearch` 一种写法。[10]

判断：WebFetch 请求的 URL 本身就是一个出站信道，路径和查询参数可以携带任何东西。对处理敏感代码的仓库，「询问」比「允许所有域名」稳妥得多。

**MCP** 的问题在于来源分散。项目级服务器写在 `.mcp.json` 里；其他作用域的服务器、claude.ai connector、插件带进来的服务器都不在仓库里，只审 `.mcp.json` 看不全。[11] Anthropic 会按收录标准审核目录里的 connector，但不对任何 MCP 服务器做安全审计。[11] 工具调用的参数发给 MCP 服务器，ZDR 不覆盖第三方集成处理的数据。[12]

可用的开关：拒绝规则 `"mcp__*"` 能禁掉所有 MCP 工具；[4] `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB=1` 清掉 stdio MCP 服务器、Bash、hook 等子进程环境里的凭据。[3] 本地 MCP 服务器跑在沙箱之外，拥有你的完整权限。[7]

## 通道四：Bash、git push 和其他副作用

前三条通道都经过 Claude Code 自己的工具，第四条不是：Bash 能跑任何程序，程序想连哪就连哪。

**拒绝规则不是边界。** `Bash(curl *)` 只匹配 Claude 写出来的那种命令形式，挡不住 `/usr/bin/curl` 或 `sh -c 'curl …'`。文档的建议是：限制必须成立时，配合沙箱的网络白名单。[4][5]

**沙箱默认关。** 用 `/sandbox` 或 `sandbox.enabled: true` 开启。开了之后，命令没有直接出网的路，连接都走本机代理，按域名白名单放行，白名单初始为空；不认代理变量的工具（如普通 `ssh`）和 UDP、ICMP 都出不去。[7] `sandbox.network.strictAllowlist: true` 让白名单之外的主机直接拒绝而不是询问，只能写在用户或托管设置里，仓库改不了。[5][7]

但沙箱的默认值有几处要特别注意：[7]

- **读权限默认很宽**，包括 `~/.ssh`、`~/.aws/credentials`，要用 `filesystem.denyRead` 或 `sandbox.credentials` 收紧。
- **环境变量默认继承**，Claude Code 环境里的密钥会传给沙箱里的命令。
- **没有内置的凭据拒绝清单**，你不列就不拦。

`sandbox.credentials` 里的条目可以选 `deny`（文件禁读、环境变量在命令运行前清除）或 `mask`。`mask` 很像反方向的 Tokenhush：沙箱里的命令只看到每会话的占位符，代理发往你允许的主机时才换成真值。这要求开启实验性的 `network.tlsTerminate` 让代理自己终止 TLS，而且出于安全考虑，`mask` 和 `tlsTerminate` 只认用户设置、托管设置和 `--settings`，仓库里的 `.claude/settings.json` 写了也不生效。[7]

**沙箱管不到的东西。** Read、Edit、WebFetch 这些内置工具不受沙箱约束，走权限规则；hook、本地 MCP 服务器、LSP、状态栏命令以完整权限运行；多数会话里你在 `!` 提示符下自己敲的命令、`excludedCommands` 里的命令、Claude 请求「不进沙箱重试」的命令，也都在沙箱外。[7] 文档还专门警告：允许 `github.com` 这类宽泛域名本身就可能成为外泄通道，因为代理只看客户端给出的主机名、不检查 TLS 内容，沙箱内的代码可能用 domain fronting（借合法域名掩护连接真实目标）之类的手法绕过白名单。[7]

要把这些都关进一个边界，文档给的方向是把整个 Claude Code 进程放进容器、虚拟机或 sandbox runtime。[7][11] 官方参考 dev container 带一个 `init-firewall.sh` 限制出站目标；在容器里用 `--dangerously-skip-permissions` 时，文档建议配合这套出网限制。[14]

**`git push` 和其他不可逆动作**，最简单的是放进 `permissions.ask`，比如 `Bash(git push *)`，即使在 `acceptEdits`、`bypassPermissions` 这类本会自动批准的模式下也会弹确认。[5] [PixelLeak](/cn/blog/pixelleak-coding-agents-public-screenshot-egress/) 那篇的教训是：agent 会为完成任务自己开出一条共享出站，单靠模型自觉不够。

**你自己配的 OTel 导出**也是出站。提示词、工具参数、工具输出、完整 API 请求体默认都不记录，分别由 `OTEL_LOG_USER_PROMPTS`、`OTEL_LOG_TOOL_DETAILS`、`OTEL_LOG_TOOL_CONTENT`、`OTEL_LOG_RAW_API_BODIES` 控制。[9] 项目和本地设置不能打开这些导出、也不能改目的地，只能关；仓库里写了会在启动时提示（OTel 这一组要求 v2.1.282 以上）。[5][15] 判断：这是在防「克隆一个仓库，会话内容就被导到别人的 collector」。

## 落地清单

下面这份 `~/.claude/settings.json` 片段里的每个键都出自官方文档的示例或参考页。[3][4][5][7] 放在用户设置而不是项目设置，是因为 `strictAllowlist`、`mask` 这类键仓库改不了，部分环境变量项目设置也设不了。[5][7] 白名单要换成你实际需要的域名。

```json
{
  "env": {
    "DISABLE_ERROR_REPORTING": "1",
    "DISABLE_FEEDBACK_COMMAND": "1",
    "CLAUDE_CODE_SUBPROCESS_ENV_SCRUB": "1"
  },
  "permissions": {
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./secrets/**)",
      "Bash(curl *)"
    ],
    "ask": ["Bash(git push *)"]
  },
  "sandbox": {
    "enabled": true,
    "network": {
      "allowedDomains": ["github.com", "*.npmjs.org"],
      "strictAllowlist": true
    },
    "credentials": {
      "files": [
        { "path": "~/.aws/credentials", "mode": "deny" },
        { "path": "~/.ssh", "mode": "deny" }
      ],
      "envVars": [
        { "name": "GITHUB_TOKEN", "mode": "deny" },
        { "name": "NPM_TOKEN", "mode": "deny" }
      ]
    }
  }
}
```

要不要再加 `DISABLE_TELEMETRY` 或 `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`，取决于你能不能接受失去依赖 feature flag 的那些功能。注意 `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB` 会故意保留 `GITHUB_TOKEN`，所以上面在沙箱里单独拒绝了它。[3]

按通道逐项检查：

**模型请求**
- [ ] 账号类型对不对？处理公司代码用的是商业账号，还是个人订阅？个人订阅的训练开关是什么状态？[1]
- [ ] 需要 ZDR 的组织，是否用托管设置锁定了登录组织？[12]
- [ ] `CLAUDE.md`、`AGENTS.md`、它们 `@` 导入的文件、`MEMORY.md` 里有没有不该外发的内容？[8]
- [ ] `.claudeignore` 是否已经换成 Read 拒绝规则？[4]
- [ ] 会打印配置的命令是否把密钥带进工具输出？必要时用 PostToolUse 替换。[6]
- [ ] 用出口脱敏网关的，是否清楚它只覆盖模型请求？[20]

**运维流量**
- [ ] 按需关掉错误报告、`/feedback`、问卷；清楚 `0` 也算「关」。[1][3]
- [ ] 不用 claude.ai connector 的，关掉它。[2]

**Web 与 MCP**
- [ ] WebFetch 是逐次询问、按域名放行，还是 `domain:*` 全放？[10]
- [ ] 一个会话实际能加载哪些 MCP 服务器？不只看 `.mcp.json`。[11]

**Bash 与副作用**
- [ ] 沙箱开了吗？白名单里有没有 `github.com` 这类宽泛域名？[7]
- [ ] 需要整进程隔离的场景，是否放进了带防火墙的 dev container？[14]
- [ ] 本地会话记录的保留周期是否符合要求？[1]

## 边界和没查到的

- **以上全部来自厂商文档。** 文档描述的是设计行为，CHANGELOG 里也能看到遥测相关的修复，比如 2.1.290 修了在 Claude apps gateway 后面、机器上没有托管设置强制网关登录时，后台命令和 daemon 进程仍会向 Anthropic 发遥测和 flag 请求的问题。[15] 对出网有硬性要求的团队，最终要靠自己的网络出口日志验证，而不是只看设置。
- **Tokenhush 我只读了仓库文档和代码结构，没有做端到端测试**，尤其是与订阅登录配合的情况；它很新，用于生产前应自己用 README 里的回显上游方法验证一遍。[20]
- **AGENTS.md 修复的状态**以 CHANGELOG 和文档为准，issue 仍开着，后续是否有回归我没跟踪。[15][18]
- **云端会话和 Remote Control 的数据流**和本地不同（Remote Control 连接期间会话记录会存到 Anthropic 服务器），[1] 这篇没有展开。

## 最后

Claude Code 的出站开关其实很细，问题在于它们分属不同通道：遥测开关管运维流量，Read 规则管内置工具，hook 管 harness 内的时点，沙箱管 shell 子进程，网关管模型请求，没有哪一个能单独兜底。

判断：先想清楚你防的是哪种情况。怕密钥被无意带进上下文，用 Read 规则加出口脱敏；怕 agent 被注入后主动外发，用沙箱白名单加整进程隔离；怕厂商侧留存，选对账号类型。三件事分开处理，比一口气把所有开关都打开更靠得住。

## 参考

1. Anthropic，Claude Code Docs，《Data usage》：<https://code.claude.com/docs/en/data-usage>
2. Anthropic，Claude Code Docs，《Network configuration》：<https://code.claude.com/docs/en/network-config>
3. Anthropic，Claude Code Docs，《Environment variables》：<https://code.claude.com/docs/en/env-vars>
4. Anthropic，Claude Code Docs，《Configure permissions》：<https://code.claude.com/docs/en/permissions>
5. Anthropic，Claude Code Docs，《All settings》（settings reference）：<https://code.claude.com/docs/en/settings-reference>
6. Anthropic，Claude Code Docs，《Hooks reference》：<https://code.claude.com/docs/en/hooks>
7. Anthropic，Claude Code Docs，《Configure the sandboxed Bash tool》：<https://code.claude.com/docs/en/sandboxing>
8. Anthropic，Claude Code Docs，《How Claude remembers your project》：<https://code.claude.com/docs/en/memory>
9. Anthropic，Claude Code Docs，《Monitoring》：<https://code.claude.com/docs/en/monitoring-usage>
10. Anthropic，Claude Code Docs，《Tools reference》：<https://code.claude.com/docs/en/tools-reference>
11. Anthropic，Claude Code Docs，《Security》：<https://code.claude.com/docs/en/security>
12. Anthropic，Claude Code Docs，《Zero data retention》：<https://code.claude.com/docs/en/zero-data-retention>
13. Anthropic，Claude Code Docs，《Other LLM gateways》：<https://code.claude.com/docs/en/llm-gateway>
14. Anthropic，Claude Code Docs，《Development containers》：<https://code.claude.com/docs/en/devcontainer>
15. Anthropic，Claude Code `CHANGELOG.md`（抓取时最新 2.1.292）：<https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md>
16. szypowi.cz，《Claude Code reads AGENTS.md only when telemetry is on》，2026-09-23：<https://blog.szypowi.cz/p/claude-code-reads-agents.md-only-when-telemetry-is-on/>
17. Hacker News 讨论，《Claude Code reads AGENTS.md only when telemetry is on [fixed]》，2026-09-23：<https://news.ycombinator.com/item?id=49814947>
18. GitHub，anthropics/claude-code issue #95690，《Claude Code's AGENTS.md Support: A Local Feature Locked Behind a Remote Switch》：<https://github.com/anthropics/claude-code/issues/95690>
19. Janz，DEV Community，《How common is AGENTS.md, really? I sampled GitHub: 6.2% of active repos, 1.0% of all repos》，2026-09-19：<https://dev.to/janzong/how-common-is-agentsmd-really-i-sampled-github-62-of-active-repos-10-of-all-repos-1175>
20. fregie/tokenhush，README：<https://github.com/fregie/tokenhush>
21. fregie/tokenhush，`docs/security.md`：<https://github.com/fregie/tokenhush/blob/main/docs/security.md>
22. fregie/tokenhush，`docs/tool-setup.md`：<https://github.com/fregie/tokenhush/blob/main/docs/tool-setup.md>
