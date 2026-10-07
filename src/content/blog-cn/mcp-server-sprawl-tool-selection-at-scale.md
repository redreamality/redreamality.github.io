---
title: "MCP server 接多了，agent 反而选不准工具：从 tool search、Code Mode 到 ToolSearcher"
description: "MCP server 一多，光工具 schema 就占掉几万 token，选错工具、重名冲突和投毒风险也跟着来。本文以 arXiv ToolSearcher（类别约束判别、事件级搜索奖励、轨迹对齐分配）为锚，对照 Anthropic 与 OpenAI 的 tool search / defer_loading、Claude Code、Spring AI、VS Code 虚拟工具、MCP 2026-07-28 规范、Cloudflare Code Mode 和 Docker MCP Gateway，梳理五类修法，并附一份 N 个 MCP server 的运维清单。"
pubDate: 2026-10-07T16:40:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "mcp", "developer-tools"]
lang: "zh"
---

给 agent 接 MCP server 通常是这样：先接 GitHub，再接 Slack、Jira、Sentry、数据库，每个都很顺手。接到第五六个，会话还没开始，上下文里已经塞满了工具说明；再往后，agent 开始在两个名字差不多的工具之间选错。

本文讲的就是：**工具一多，上下文变贵，选择变差，攻击面变大**，以及目前的几类修法。锚点是 9 月 25 日挂上 arXiv 的 ToolSearcher（浙江大学与蚂蚁集团，NeurIPS 2026），它把「从上万个工具里搜、辨、选」当成强化学习问题来训。[1] 工程上更常用的是 tool search、Code Mode、网关这些不用训练模型的办法，所以放在一起对照。

站内相邻的文章：[Pi 1.0 把 MCP 折进 Codemode](/cn/blog/pi-1-0-codemode-mcp-minimal-harness/) 讲一个具体 harness；[Progressive Disclosure](/cn/blog/progressive-disclosure-agent-skills/) 和 [SkillDelta](/cn/blog/skilldelta-selective-skill-activation/) 讲技能的按需加载与「该不该注入」；[Agent Skills 2026 综述](/cn/blog/agent-skills-2026-survey-lifecycle-map/) 讲技能生命周期；[Google MCP Toolbox 的 SSRF](/cn/blog/google-mcp-toolbox-ssrf-tool-path-boundary/) 讲单个工具路径的出网边界。这里只看「工具数量」本身。标「判断」的是我的看法。

## 先算账：工具定义在上下文里有多贵

Anthropic 在 2025 年 11 月的工程博客里给过一组很具体的数字：一个五个 server 的常见配置，GitHub 35 个工具约 26K token，Slack 11 个约 21K，Sentry 5 个约 3K，Grafana 5 个约 3K，Splunk 2 个约 2K，合计 58 个工具、约 55K token，对话还没开始就花掉了；再加一个 Jira（单它就约 17K），很快就逼近 100K。他们内部见过优化前工具定义吃掉 134K token 的情况。[2] Claude API 的 tool search 文档也沿用了「约 55K」这个例子。[3]

按这组数推算，GitHub 平均每个工具约 740 token，Slack 每个接近 1,900 token。

更极端的例子来自 Cloudflare。他们的 API 有 2,500 多个端点，如果每个端点做成一个原生 MCP 工具，2,594 个工具的完整 schema 约 117 万 token；只保留必填参数也还有约 24.4 万 token，超过了大多数模型的整个上下文窗口。[4][5]

客户端也开始设硬上限。VS Code 里一次 chat 请求最多只能启用 128 个工具，超了会直接报错「Cannot have more than 128 tools per request」。[6] Claude Code 则在另一头设限：单个 MCP 工具的输出超过 10,000 token 会警告，默认上限 25,000 token。[7]

判断：工具定义是**每一轮都要付的固定成本**，跟这一轮用了几个工具无关。prompt cache 能降低重复计费，但占掉的上下文一点不少。

## 不只是 token：四种失败一起出现

### 选错工具，填错参数

Anthropic 在文档里写得很直接：工具超过 30 到 50 个之后，Claude 选对工具的能力就开始下降。[3] 工程博客也说，最常见的失败是选错工具和参数填错，尤其是名字相近的工具，比如 `notification-send-user` 和 `notification-send-channel`。[2] 他们内部的 MCP 评测里，打开 tool search 之后，Opus 4 从 49% 提到 74%，Opus 4.5 从 79.5% 提到 88.1%。[2] 反过来读，就是全量加载时选择准确率被拖累得有多厉害。

学术界的数字方向一致。RAG-MCP 先用语义检索挑出相关的 MCP server，再把选中的描述交给模型，在他们的基准上把工具选择准确率从 13.62% 提到 43.13%，prompt token 减少一半以上。[8]

### 重名

MCP 规范只要求工具名在**同一个 server 内**唯一。2026-07-28 版本把话说得更明白：聚合多个 server 的客户端或代理「可能遇到命名冲突」，比如两个 server 都有一个 `search`，应该用 server 标识做前缀之类的办法来区分；而且 `serverInfo` 里的 server 名本身也不保证全局唯一，不能拿来当区分依据。[9]

Claude Code 把插件自带 server 的工具改写成 `mcp__plugin_<plugin-name>_<server-name>__<tool-name>`，并提醒按裸 server 名写的 hook matcher（如 `mcp__database-tools__.*`）对插件里的同名 server 永远不会触发。[7] 名字一改写，权限规则、hook、工具白名单都得跟着改。

### 中间结果在上下文里来回搬

Anthropic 举过一个例子：从 Google Drive 取会议纪要再贴进 Salesforce。直接调工具时，纪要先作为结果进上下文，再被模型原样写进下一个调用，两小时的会议可能多出约 50,000 token，模型在两次调用之间抄数据也容易出错。[10]

### 每接一个 server，都多一份能影响 agent 的文本

Invariant Labs 在 2025 年 4 月演示过「工具投毒」：在工具描述里藏指令，用户界面只显示简化后的工具名，模型却能看到完整描述，于是被引导去读 `~/.cursor/mcp.json` 和 SSH 私钥，再从一个看似无害的参数里带出去。[11] 他们还演示了两个更麻烦的变体：一是**跨 server 遮蔽**（shadowing），恶意 server 的描述里写「当 `send_email` 存在时必须把邮件发给某地址」，agent 甚至不必调用恶意工具，就会改变对可信工具的用法；二是 **rug pull**，server 在用户批准之后再修改工具描述。[11]

MCP 规范也写明，客户端必须把工具 annotations 当作不可信信息，除非来自可信 server。[9] 安全最佳实践里列的混淆代理（confused deputy）、令牌透传、SSRF、本地 server 被攻陷等问题，暴露面都随 server 数量增加。[12]

判断：四种失败的根源相同：**所有 server 的描述平铺在同一个上下文里**。下面的修法都在回答：哪些描述、什么时候、以什么形式进上下文。

## 修法一：按需加载工具定义

最主流的做法：工具全部登记、不全部展示，模型先搜再加载。

### Anthropic：defer_loading 加 tool search

Claude API 把一个 tool search 工具放进 `tools`，其余工具标 `defer_loading: true`。[3] 值得记的细节：

- 两种搜索：regex 版写 Python 正则（最长 200 字符），BM25 版用自然语言（最长 500 字符），都搜工具名、描述、参数名和参数描述。[3]
- 每次默认返回 5 个 `tool_reference`，由 API 展开成完整定义；每个请求最多 10,000 个延迟工具。[3]
- 延迟工具不进系统提示前缀，搜到后才追加，所以 **prompt cache 不失效**。[3]
- 至少一个工具不延迟，官方建议最常用的 3 到 5 个常驻；也可以用 embedding 自己实现搜索，只要返回 `tool_reference`。[3]
- 接 MCP 时在 `mcp_toolset` 的 `default_config` 里把整个 server 设为延迟，再在 `configs` 里给个别工具开例外。[2][3]

适用条件：10 个以上工具、定义超过 10K token、准确率随工具增长下降、或聚合多个 MCP server（200 个以上工具）；少于 10 个工具或每次都用全部工具时不值得。[3] 博客的例子是从约 77K 降到约 8.7K，减少约 85%。[2]

### Claude Code：默认开启，有阈值模式

Claude Code 默认开着 tool search：会话开始时只加载工具名和 server instructions，文档说不设每个 server 的工具上限，实际限制是上下文预算。[7] 可调的有：

- `ENABLE_TOOL_SEARCH=auto` 是阈值模式：定义总量低于上下文窗口 10% 时全量加载，达到才延迟；`auto:5` 改成 5%。[7]
- 每轮都要用的 server 写 `alwaysLoad: true`；`ANTHROPIC_BASE_URL` 指向第三方地址时自动关闭，因为多数代理不转发 `tool_reference`。[7]
- 工具描述和 server instructions 默认截断到 2,048 字符。文档建议 server 作者在 instructions 里写清处理哪类任务、什么时候该来搜，因为这是模型最先看到的文字。[7]

### OpenAI：tool_search 和 namespace

OpenAI Responses API 也有 `tool_search`，只支持 gpt-5.4 及之后的模型。[13] 它和 Anthropic 的差别在于「开始时模型能看到什么」：

- 单个延迟函数，模型开始时仍能看到函数名和描述，延迟的主要是参数 schema。
- namespace 或 MCP server，模型开始时只看到 namespace 或 server 的名字和描述。

所以官方建议优先用 namespace 或 MCP server，说模型主要针对这两种形式训练，每个 namespace 最好少于 10 个函数。[13] 搜索可以托管给 OpenAI，也可以由模型发出 `tool_search_call`、你的程序自己查，后者适合可用工具取决于租户状态的场景。新加载的工具追加在上下文末尾，以保住缓存。[13]

### Spring AI：同一个模式，换成跨厂商实现

Spring AI 把这个模式做成一个 advisor（拦截器）：工具先进本地索引（Lucene、向量或正则），第一次请求只发搜索工具，搜到什么再加什么。[14][15] 在 28 个工具（3 个相关）的演示任务上，三家模型总 token 省 34% 到 64%，请求次数从 3 到 4 次变成 4 到 5 次；博客注明这是几次手工测量，只能当示意。[14] 顺带一提，社区版里的检索接口就叫 `ToolSearcher`，和锚点论文同名但毫无关系。[14]

### VS Code：虚拟工具分组

VS Code 的办法是「虚拟工具」：工具数超过阈值（默认 128）时分组成像目录一样的虚拟工具，模型调用某组后组内工具才出现。[16] 按开发团队的说明，工具少的 server 整体一组，工具多的按类别细分，内置工具不分组。[17]

### 学术界的同类做法

MCP-Zero 让模型主动写出结构化的工具需求，再先 server、后工具两级做语义路由；数据集是 308 个 server、2,797 个工具，报告在 APIBank 上 token 减少 98%。[18]

判断：几家实现的主要差别，在于**会话开始时给模型看多少目录信息**：Anthropic API 可以只给一个搜索工具，Claude Code 给工具名，OpenAI 给 namespace 描述，VS Code 给分组名。给得越少越省，但模型越依赖「知道去搜什么」，所以 server instructions 和 namespace 描述成了新的路由表。

## 修法二：协议能帮什么忙

MCP 协议本身不定义「工具搜索」，但几个机制决定了客户端能做到多好。

- **列表可分页、可变化。** `tools/list` 支持分页；声明 `listChanged` 的 server 在列表变化时应发通知。[9] Claude Code 收到后重新拉取，失败时保留旧列表；文档记着 v2.1.214 之前一次临时错误会把工具清空。[7]
- **列表稳定，才能缓存。** 2026-07-28 版要求 `tools/list` 不随连接变化，建议按确定顺序返回，以提高 prompt cache 命中率；结果还新增 `ttlMs` 和 `cacheScope` 作为缓存提示。[9][19]
- **按授权返回工具。** server 可以根据请求携带的授权返回不同工具集，比如只返回调用方 scope 允许的。[9]
- **变化通知改走订阅。** 新版去掉协议级会话，客户端用 `subscriptions/listen` 订阅 `toolsListChanged`。[19]

判断：协议的进展是让工具列表**稳定、可缓存、可按权限裁剪**，但「这一轮给模型看哪些」仍是客户端或网关的事。「按授权返回工具」值得优先用：最便宜的节省，是让模型根本看不到它没权限调的工具。

## 修法三：别让模型直接调工具，让它写代码

既然模型擅长写代码，就把 MCP 工具变成代码 API。

### Cloudflare Code Mode

Cloudflare 在 2025 年 9 月提出 Code Mode：把 MCP schema 转成带注释的 TypeScript API，模型只拿到一个「执行代码」的工具，在沙箱里写代码调用，用 `console.log` 交回结果。[20] 理由是模型见过大量真实代码，却只见过少量人工构造的工具调用样本。沙箱是 V8 isolate，不能直接上网，只能通过代表 MCP server 的 binding（绑定对象）访问；密钥留在监管进程里。[20] 当时整个 TypeScript API 仍是一次性加载进上下文的。[20]

2026 年 2 月的第二篇补上了这块：Cloudflare API 的 MCP server 只暴露 `search()` 和 `execute()` 两个工具，约 1,000 token，端点再多也不变。`search` 让模型写 JavaScript 去查已经展开好 `$ref` 的 OpenAPI 文档，`execute` 拿到一个已鉴权的请求函数去真正调用。他们的例子从搜索端点、查看 schema 到列出和读取规则集，一共四次工具调用。[4] 开发文档还提到，最终响应限制在约 6,000 token，超出会标 `--- TRUNCATED ---`，并提醒截断不会撤销已经执行过的 API 操作。[21]

### Anthropic：code execution with MCP 和 Programmatic Tool Calling

Anthropic 2025 年 11 月的版本是把工具生成文件树，每个工具一个文件（如 `servers/google-drive/getDocument.ts`），agent 先列目录、再读需要的文件；例子里 token 从 150,000 降到 2,000，减少 98.7%。[10] 文中还建议给 server 加一个带详细程度参数（只要名字、加描述、或完整 schema）的 `search_tools`；中间数据留在执行环境里，客户端可以先把邮箱、电话替换成占位符再给模型看。[10]

产品化的版本是 Programmatic Tool Calling：工具定义里加 `allowed_callers`，Claude 写 Python 在代码执行环境里调用这些工具，中间结果不进上下文。在复杂研究任务上，平均 token 从 43,588 降到 27,297，少了 37%。[2]

判断：Code Mode 同时解决了两个问题：工具定义的体积和中间结果的搬运。但它把「选工具」变成了「在代码里搜 API」，也把风险换了个地方：你不再审每一次工具调用，而是在跑模型写的程序。沙箱、出网控制、凭证隔离这些，就从可选项变成了前提。

## 修法四：在网关上收口

Docker MCP Gateway 的 Dynamic MCP 是一个具体样子：客户端连上网关后拿到一组管理工具，`mcp-find` 在目录里搜 server，`mcp-add` 加进当前会话，另有 `mcp-config-set`、`mcp-remove`、`mcp-exec` 和 `code-mode`。动态加入的 server 只在当前会话有效，不写回配置；目录范围由你决定。[22] 文档标明这是实验功能，`code-mode` 还不可靠。[22]

网关适合做的几件事，正好对应前面的失败：

- **重名**：在网关统一加前缀，规范也建议聚合方这样做。[9]
- **筛选**：只把调用方有权限的工具列出来，正好用上规范允许的「按授权返回工具」。[9]
- **投毒和 rug pull**：Invariant 建议客户端固定 server 和工具版本，用哈希校验工具描述有没有被改过，并在 server 之间做数据流隔离。[11] 这些放在网关上统一做，比每个客户端各做一遍可靠。

但网关本身也是代理。MCP 安全最佳实践里的混淆代理问题正是针对代理第三方 API 的 MCP server：静态 client ID、动态客户端注册和同意 cookie 组合在一起，可能让恶意客户端在用户没真正同意时拿到授权码。[12]

判断：网关最大的价值是**把工具清单变成一份有人维护的配置**。像 `mcp-add` 这样让模型自己扩充工具的能力很方便，但等于让模型自己决定攻击面有多大，所以我会把它限定在一个经过筛选的目录里。

## 修法五：把「搜和选」学出来：ToolSearcher

前面几类都不改模型。ToolSearcher 问的是：能不能直接训练模型，让它更会在大工具库里搜和选？[1]

### 任务设定

论文把工具选择定义为：给定用户需求、一个大工具库和一个检索引擎，模型要多轮调用检索，最后输出一组工具名。每个工具的文档包括功能描述、输入约束和输出 schema。[1] 实验用 StableToolBench：16,464 个来自 RapidAPI 的 REST API，分 49 个大类、500 多个细分集合；测试集 765 条，每个任务平均需要 2.35 个 API，最多 6 个；训练集 14,418 条。[1][23] 检索器是 Qwen3-Embedding-0.6B，每轮返回 5 个工具文档，最多 8 轮；提示词要求输出格式为「类别.工具.API」，并明确要求「只根据搜索结果返回，不要编造」。[1]

作者的出发点是：现有搜索型强化学习方法为知识问答设计，只管补齐信息，不考虑工具之间能不能接上。[1]

### 三个设计

**类别约束判别（CCTD）。** 给检索工具加一个可选的 `category` 参数，训练前 30% 的数据（56 步里的前 17 步）强制在单个类别里搜索，之后再放开全局搜索。在同一类别里搜，返回的都是功能相近的工具，模型只能靠读懂文档来区分，而不是靠打磨查询词。[1] 论文用基座模型验证了这个环境确实更难：Qwen2.5-7B 在类别约束下的搜索召回从全局搜索的 0.724 掉到 0.401。[1]

**事件级搜索建模（ESM）。** 把一条搜索轨迹拆成一个个搜索事件，**只奖励第一次找到某个目标工具的那次搜索**，重复搜到已找到的工具不给分。每个事件的优势值取它首次找到的那些工具在同组轨迹间比较后的最大值。另外，检索回来的文档 token 不参与梯度计算，防止模型去背工具文档。[1]

**轨迹对齐的奖励分配（TCA）。** 同一任务的多条轨迹进度不同：有的做完了，有的工具找齐了但选错了，有的还停在搜索阶段。TCA 的规则是：只有搜索阶段找齐了全部目标工具的轨迹，最终的选择才计奖励；而同组里大家都已经能找到的工具，相关搜索事件不再给分。这样学习信号会集中在还没掌握的那一步上。[1]

### 结果

主结果（StableToolBench，整体 F1）：[1]

| 基座 | 未训练多轮搜索 | Search-R1 | GDPO（次优） | ToolSearcher |
| --- | --- | --- | --- | --- |
| Qwen2.5-7B-Instruct | 0.098 | 0.327 | 0.496 | 0.513 |
| Qwen3-4B-Instruct | 0.408 | 0.505 | 0.518 | 0.531 |

完全匹配率（Match）在 7B 上从 0.046 提到 0.278，在 4B 上从 0.169 提到 0.316。[1] 对比次优方法，整体 F1 只高出 1.7 个点，差距主要在跨集合的多工具场景（I3）：7B 上 0.294，比 GDPO、MARAG-R1、GSPO、Search-R1 分别高 6.6、8.3、9.8、10.0 个点。[1] 作为参照，一次性取 top-100 文档的 RAG 在 7B 上只有 0.194，加监督微调后是 0.441。[1]

我觉得最有意思的是搜索召回和最终召回的对比。未训练的 Qwen2.5-7B 在全局搜索里能把 72.4% 的目标工具搜出来，最终 F1 却只有 0.098。[1] 论文的解释是，这个模型搜得到，但读不懂、选不出；ToolSearcher 略微降低了它的搜索召回，却让最终召回在 I1、I2、I3 上分别提高了 43.08、39.58、21.09 个点。[1]

分布外的 AppWorld（9 个应用、457 个 API；下游由 gpt-5-mini 驱动的 FullCodeRefl 写代码执行）上，7B 的选择 F1 为 0.514（GDPO 0.483），任务完成率 TGC 平均 0.334、场景完成率 SGC 0.228，均比 GDPO 高 5.7 个点；4B 上 TGC 0.372、SGC 0.257，比次优的 Search-R1 高 5.8 和 2.9 个点。[1]

消融（7B，StableToolBench）：去掉 CCTD，F1 从 0.513 降到 0.477；去掉 TCA 降到 0.461；去掉 ESM 降得最多，到 0.394，搜索召回从 0.680 降到 0.456，平均搜索轮数也从约 4 轮缩到约 2 轮。只有最终结果奖励时，模型倾向于少搜。[1]

### 局限，作者自己写了

- 训练数据由大模型合成，工具组合大多是并列关系而不是先后依赖；AppWorld 的 API 多半有状态，所以提升有限。[1]
- 训练时最多 8 轮交互（约 5,000 token），而 AppWorld 一个场景平均涉及的 API 超过 8 个。[1]
- 训练在一台 8 卡 A100（80G）上完成，模型只到 7B。[1]

判断：ToolSearcher 对做工程的人有三点可以直接拿来用，不必训练模型。第一，**分开测「搜到」和「选对」**，7B 基座的例子说明两者可以差很远，只看端到端成功率会找错瓶颈。第二，给搜索工具加一个类别过滤参数，几乎没有成本，又能让检索结果更集中。第三，强制「只能从搜索结果里选名字」，这和 tool search 返回引用、由 API 展开定义的做法是一个道理。同时也要看清：最好的整体 F1 也只有 0.53 左右，完全匹配也就三成左右，大规模工具选择远没有解决。

## 五类修法放在一起看

| 修法 | 主要省掉什么 | 代价 | 现成实现 | 新增风险 |
| --- | --- | --- | --- | --- |
| 按需加载（tool search） | 未用工具的定义 | 多一到两次往返；依赖搜得准 | Claude API、Claude Code、OpenAI、Spring AI、VS Code[3][7][13][15][16] | 搜不到就用不了；描述写得差会被埋没 |
| 协议机制 | 重复拉取和无权限工具 | 需要 server 配合 | MCP 2026-07-28[9][19] | 较少 |
| Code Mode | 定义和中间结果 | 必须有沙箱 | Cloudflare、Anthropic[4][10][20] | 执行模型生成的代码 |
| 网关收口 | 重名、越权、未审 server | 多一层要运维 | Docker MCP Gateway[22] | 网关本身成为代理和单点 |
| 学出来的选择 | 选错和漏选 | 需要训练与数据 | ToolSearcher[1] | 离线数据和真实工具库不一致 |

判断：这几类不互斥。比较稳的组合是网关管清单和权限，tool search 管上下文，长链路或大数据量任务交给 Code Mode。学出来的选择目前更适合借鉴评测思路，还不是能直接装上的组件。

## 落地清单：你手上有 N 个 MCP server 时

**盘点**

- [ ] 列出每个 server 的工具数和定义 token 数，按占用排序；一两个大 server 往往占掉大半。[2]
- [ ] 查有没有跨 server 的同名或近名工具（`search`、`send_message` 之类），统一加 server 前缀。[9]
- [ ] 记下客户端的硬限制：VS Code 每个请求 128 个工具，Claude Code 工具输出默认 25,000 token。[6][7]

**加载**

- [ ] 工具超过 10 个，或定义超过 10K token，就打开 tool search 或延迟加载。[3]
- [ ] 只把最常用的 3 到 5 个工具常驻；整个 server 每轮都用时，再考虑 `alwaysLoad`。[3][7]
- [ ] 认真写 server instructions 和 namespace 描述：处理哪类任务、什么时候该来搜；关键信息放在前 2,048 字符内。[7][13]
- [ ] 工具描述里写用户实际会用的词，方便被搜到。[3]

**执行**

- [ ] 三步以上的依赖调用、或者只需要汇总结果的大数据量任务，改用 Code Mode 或 Programmatic Tool Calling。[2][10]
- [ ] 用 Code Mode 时：沙箱默认不出网，凭证只留在宿主进程，返回结果设大小上限。[20][21]

**安全**

- [ ] 固定 server 版本，记录工具描述的哈希，变了就报警，防 rug pull。[11]
- [ ] 让 server 按调用方权限返回工具列表，没权限的工具不进上下文。[9]
- [ ] 动态加 server 的能力只对一个经过筛选的目录开放。[22]

**评测**

- [ ] 分开记录「目标工具有没有被搜出来」和「最后有没有选对」，参照 ToolSearcher 的 SRecall 和 Recall。[1]
- [ ] 每加一个 server，用固定任务集重跑选择准确率，不只看 token。
- [ ] 记录 agent 实际搜了哪些工具、加载了哪些，回头改描述。[3]

## 反例与边界

- **工具少就别折腾。** 工具很少、或每次都用到全部工具时，搜索多出的往返不划算；Anthropic 的门槛是 10 个工具，Spring AI 指南写的是 20 个。[3][15]
- **厂商数字来自厂商自己的测试。** 49% 到 74%、85%、98.7% 这些都是内部评测或演示任务，Spring AI 的 34% 到 64% 更是作者自己注明的手工初测。[2][10][14]
- **ToolSearcher 的工具库不是 MCP。** StableToolBench 是 RapidAPI 的 REST API，模型也只到 7B；能借鉴的是训练和评测的思路，不是具体分数。[1][23]
- **Code Mode 换来的是另一类风险。** Anthropic 自己也说，跑模型写的代码需要沙箱、资源限制和监控，直接调工具不会有这些运维负担。[10]
- **本文没覆盖的。** Cursor 等客户端、商业 MCP 网关的过滤策略，我没拿到可核对的一手文档，所以没写。

## 最后

接 MCP server 的成本不在接入那一刻，而在之后每一轮：多一份定义要付 token，多几个工具要分辨，也多一个能影响 agent 的文本来源。现有修法大体是三层分工：网关决定能看到哪些工具，tool search 决定这一轮加载哪些，Code Mode 决定中间结果放在哪里。ToolSearcher 补上的是评测上的一课：「搜到」和「选对」要分开测。

下次准备再接一个 MCP server 之前，先问两个问题：它的工具定义要占多少 token，和现有工具里有没有名字或功能相近、容易混淆的。

## 参考

1. Zhenlong Dai 等（浙江大学、蚂蚁集团），《ToolSearcher: Optimizing Tool Selection at Scale via Reinforcement Learning》，arXiv:2609.30906，2026-09-25，NeurIPS 2026：<https://arxiv.org/abs/2609.30906>
2. Anthropic Engineering，《Introducing advanced tool use on the Claude Developer Platform》，2025-11-24：<https://www.anthropic.com/engineering/advanced-tool-use>
3. Claude API Docs，《Tool search tool》：<https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool>
4. Cloudflare Blog，Matt Carey，《Code Mode: give agents an entire API in 1,000 tokens》，2026-02-20：<https://blog.cloudflare.com/code-mode-mcp/>
5. Cloudflare Agents Docs，《Cloudflare's own MCP servers》：<https://developers.cloudflare.com/agents/model-context-protocol/cloudflare/servers-for-cloudflare/>
6. Visual Studio Code Docs，《Use tools with agents》：<https://code.visualstudio.com/docs/agents/run/tools>
7. Claude Code Docs，《Connect Claude Code to tools via MCP》：<https://code.claude.com/docs/en/mcp>
8. Tiantian Gan、Qiyao Sun，《RAG-MCP: Mitigating Prompt Bloat in LLM Tool Selection via Retrieval-Augmented Generation》，arXiv:2505.03275，2025-05-06：<https://arxiv.org/abs/2505.03275>
9. Model Context Protocol Specification 2026-07-28，《Tools》：<https://modelcontextprotocol.io/specification/2026-07-28/server/tools>
10. Anthropic Engineering，Adam Jones、Conor Kelly，《Code execution with MCP: Building more efficient agents》，2025-11-04：<https://www.anthropic.com/engineering/code-execution-with-mcp>
11. Invariant Labs，《MCP Security Notification: Tool Poisoning Attacks》，2025-04-01：<https://invariantlabs.ai/blog/mcp-security-notification-tool-poisoning-attacks>
12. Model Context Protocol Specification 2025-11-25，《Security Best Practices》：<https://modelcontextprotocol.io/specification/2025-11-25/basic/security_best_practices>
13. OpenAI API Docs，《Tool search》：<https://developers.openai.com/api/docs/guides/tools-tool-search>
14. Spring AI Community，《Smart Tool Selection: Achieving 34-64% Token Savings with Spring AI's Dynamic Tool Discovery》：<https://springaicommunity.mintlify.app/blog/tools/tool-search>
15. Spring AI Reference，《Dynamic Tool Discovery with Tool Search Tool》：<https://docs.spring.io/spring-ai/reference/guides/dynamic-tool-search.html>
16. Visual Studio Code Docs，《AI settings reference》（`github.copilot.chat.virtualTools.threshold`）：<https://code.visualstudio.com/docs/agents/reference/ai-settings>
17. microsoft/vscode Issue #258360，《Test: virtual tools and limit behaviors》，2025-07-28：<https://github.com/microsoft/vscode/issues/258360>
18. Xiang Fei 等，《MCP-Zero: Active Tool Discovery for Autonomous LLM Agents》，arXiv:2506.01056：<https://arxiv.org/abs/2506.01056>
19. Model Context Protocol Specification 2026-07-28，《Key Changes》：<https://modelcontextprotocol.io/specification/2026-07-28/changelog>
20. Cloudflare Blog，Kenton Varda、Sunil Pai，《Code Mode: the better way to use MCP》，2025-09-26：<https://blog.cloudflare.com/code-mode/>
21. Cloudflare Agents Docs，《Build a search and execute MCP server》：<https://developers.cloudflare.com/agents/model-context-protocol/guides/build-codemode-openapi-mcp-server/>
22. Docker Docs，《Dynamic MCP》：<https://docs.docker.com/ai/mcp-catalog-and-toolkit/dynamic-mcp/>
23. Zhicheng Guo 等，《StableToolBench: Towards Stable Large-Scale Benchmarking on Tool Learning of Large Language Models》，arXiv:2403.07714：<https://arxiv.org/abs/2403.07714>
