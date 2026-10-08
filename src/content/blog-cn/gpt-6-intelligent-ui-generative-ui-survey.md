---
title: "ChatGPT 开始用可点的界面回答：拆开 GPT-6 Intelligent UI 与生成式 UI 的四条路线"
description: "GPT-6 进入 ChatGPT，默认答案从纯文本变成可点、可改的界面。本文不讲发版，讲机制：组件库加编译器、Claude Artifacts 式代码沙箱、MCP Apps / Apps SDK 的服务方 UI、Vercel AI SDK 的工具驱动组件，各自谁写 UI、信任边界在哪、状态归谁、怎么评测，以及按钮、表单、外链带来的注入与外泄面，最后给一份开发者清单。"
pubDate: 2026-10-08T10:40:00+08:00
author: "Remy"
tags: ["openai", "mcp", "security", "ai-agents", "developer-tools"]
lang: "zh"
---

10 月 7 日（美国时间），OpenAI 把 GPT-6 放进了 ChatGPT 的 Chat 标签页，同时上线一个叫 Intelligent UI 的能力：回答里可以直接出现图示、图表、可点的按钮、表单，还有临时搭出来的小工具，比如储蓄计算器、分账器、小游戏。[1][4] Plus、Pro、Business、Enterprise 当天开始推送，Free 和 Go 从 10 月 8 日起跟进；付费档跑 GPT-6 Sol，免费档跑 GPT-6 Luna；Work 和 Codex 背后的模型这次不动。[1][2] TechCrunch 补了一个细节：嫌图太多的用户，可以把视觉元素调少。[3]

发版本身两段话就讲完了。更值得花时间的是：**主流聊天产品的默认输出，正在从「一段文字」变成「一块界面」**。界面有状态、能点击、能发请求、能诱导人操作；谁写它、它跑在哪、能碰到什么数据，在纯文本时代基本不用问，现在都得回答。

本文把几条主要的生成式 UI（generative UI）路线放在一起对照，看五件事：谁写 UI、信任边界、状态与可编辑性、怎么评测、注入和钓鱼面，最后给一份清单。

站内相关：[GPT-6 Sol 与 Luna 的定价与分档](/cn/blog/gpt-6-sol-luna-and-astra/) 讲模型本身；[MCP server 接多了怎么选工具](/cn/blog/mcp-server-sprawl-tool-selection-at-scale/) 讲工具数量和投毒；[工具说明不是执法](/cn/blog/openai-reference-tool-escape-instruction-not-enforcement/) 讲「提示词约束不等于能力边界」；[Claude Code 的四条出站通道](/cn/blog/claude-code-data-egress-secrets-control/) 讲数据怎么出门。标「判断」的是我的看法。

## 先分清：OpenAI 说了什么，没说什么

OpenAI 对机制的描述只有三句，但信息量不小：[1]

1. 他们做了一个**原生的、可流式渲染的组件库**，再配一个**编译器**，在模型生成的同时处理界面。组件库给每个回答一个统一的设计底子，怎么拼由模型决定。
2. 编译器让界面**边生成边出现**，不用等整段回答写完。
3. 训练方法扩展到版面、视觉和交互的决策上，训练时会评估生成界面的**清晰度、有用性和完整性**；模型也学「什么时候一段文字就够了」。

还有两个周边数字：需要联网搜索的问题，GPT-6 Instant 开始作答的时间平均比 GPT-5.6 Instant 早 44%；这是「开始回答」的时间，不是总耗时。[1][2]

没说的部分同样重要：中间格式是什么（JSON、DSL 还是受限的 JSX），编译器会不会校验并拒绝不合法的组件树，组件能不能自己发请求、开外链、往对话里塞消息，都没讲。同日发布的系统卡我整份检索过，没有 interface、component、button、link 这类词，也就是**没有针对生成界面的专项安全评测**。[5] 系统卡里和这件事最接近的是间接提示注入（indirect prompt injection，第三方内容里藏指令）的鲁棒性：GPT-6 Sol（October）97.13%，Luna（October）95.80%。[5] 这是通用指标，不是界面专项。

判断：从「组件库 + 编译器 + 统一设计底子」这几个词看，Intelligent UI 更接近下文的路线一：模型描述界面，宿主用自己的组件渲染，而不是模型直接吐 HTML 塞进 iframe。HN 上有人问「为什么不直接流式输出 HTML」，正是两条路线的分叉点。[6] OpenAI 没公开格式，这个判断可能错。

## 四条路线：先看「谁写 UI 代码」

拆生成式 UI，最有用的问题是：**那块可交互的东西，代码是谁写的、在哪跑**。按这个问题大致有四条路线。

### 路线一：组件目录 + 编译（模型只写描述）

模型不写可执行代码，只输出一份「用哪些组件、怎么摆、绑什么数据」的描述；宿主拿自己预先写好、审过的组件去渲染。Google 的论文把这种做法叫「Templated UI」：模型从一个固定的组件库里调用、填充交互控件。[8]

这条路线最完整的公开规范是 Google 2025 年 12 月开源的 A2UI。它说得很直白：运行 LLM 生成的任意代码有风险，所以 A2UI 是**声明式数据，不是可执行代码**；客户端维护一个预先批准的组件目录（catalog，比如 Card、Button、TextField），智能体只能请求目录里有的组件，以此降低 UI 注入风险。[9] 目录本身是一个 JSON Schema 文件，智能体发来的每条 A2UI JSON 都要按所选目录校验；双方先做目录协商，客户端报出支持的目录 ID，智能体选一个，选定后在这块界面的生命周期内锁死，找不到兼容目录就不发 UI。[10] 组件树用扁平列表加 ID 引用表示，方便模型增量生成、流式渲染、局部修改。[9]

好处是宿主掌握渲染和样式，无障碍、深色模式可以统一做；代价是表达力被目录卡住，而且目录要像 API 一样管版本，A2UI 文档专门提醒要预期智能体和渲染器之间的版本错位。[10]

### 路线二：模型写代码，放进沙箱跑

模型直接生成 HTML、CSS、JavaScript（或 React），宿主放进隔离的 iframe 执行。表达力最强，信任边界全压在沙箱上。

Claude Artifacts 是这条路线最典型的产品。按 Anthropic 文档，claude.ai 的查看器从一个沙箱化的 `*.claudeusercontent.com` 源加载每个 artifact，页面受严格的内容安全策略（CSP）约束：外部图片、脚本、样式基本都被挡住，只允许从少数几个公共 CDN 加载库；`fetch`、XHR、WebSocket 只能打到自己的源；需要外部数据时，页面把连接器调用交给 claude.ai，由 claude.ai 代为发请求。[14] 2025 年 Anthropic 又让 artifact 能调用 Claude 本身：分享出去的 AI 应用，使用者用自己的 Claude 账号登录，调用额度算在使用者自己的订阅里。[16]

Google 的生成式 UI 研究走得更远：用 Gemini 3 Pro 为任意提示生成完整的交互网页，靠可调用的工具（图片生成、网页搜索）、很长的系统指令和一组修错的后处理器撑起来，已以 dynamic view 等实验进入 Gemini 应用和搜索的 AI Mode。[7] 论文附录的后处理器里有一项是「把相关 API key 注入生成的代码」。[8] 这很说明问题：模型写的代码要跑起来，宿主往往得往里塞东西，塞进去的就落在沙箱之内。

Anthropic 也在聊天里加了行内可视化，临时的图表和示意图会随对话改变或消失，和持久的 artifacts 分开。[15] 它用哪种渲染机制，公开材料没写，我不做推断。

### 路线三：服务方提供 UI 资源（MCP Apps / Apps SDK）

界面由**第三方服务**写好、随工具发布；模型只决定调哪个工具，结果交给服务方的界面显示。

MCP Apps（SEP-1865）是这条路线的开放标准，2026 年 1 月 26 日定为 Stable。规范的动机部分写明，它统一了社区项目 MCP-UI 和 OpenAI Apps SDK 两条实践。[11] 几个关键设计：

- UI 资源必须**预先声明**，用 `ui://` 开头的 URI，MIME 类型固定为 `text/html;profile=mcp-app`。规范特意没采用「在工具结果里内联 HTML」，理由之一是方便宿主在连接时审查界面模板。[11]
- 网页宿主必须用一层**沙箱代理**包住界面，宿主和沙箱必须是不同的源；所有通信走 `postMessage` 上的 JSON-RPC，宿主可以拦截或要求用户确认。[11]
- 宿主按资源声明的域名拼 CSP；没声明就用最严的默认值，只能更严，不能放宽到未声明的域名。[11]
- 工具可以标注可见性：只给界面用的工具不进模型的工具列表，模型看不见；反过来，没标给界面用的工具，界面调不了。[11]

OpenAI 的 Apps SDK 现在明说 ChatGPT 实现的就是 MCP Apps 标准，`window.openai` 只补标准没覆盖的能力，比如结账和文件上传。[13] 文档里几条建议很实在：数据工具和渲染工具分开，让模型先筛完数据再渲染；嵌套 iframe 默认禁止，CSP 白名单在审核时对照实际行为检查；「永远不要相信只在组件里算出来的总价」。[13]

### 路线四：开发者写组件，模型只决定何时用

这是自建应用最常见的做法。Vercel AI SDK 的定义很朴素：生成式 UI 就是把工具调用的结果接到一个 React 组件上。[17] 消息里的工具调用以带类型的片段出现，有「输入已就绪」「输出已就绪」「出错」等状态，还有「等待批准」「审批已答复」「输出被拒」这类审批状态。[18] 早期那套用 React Server Components 流式下发组件的 `streamUI`，官方已标为实验性、暂停开发，建议迁移到 AI SDK UI。[19]

判断：路线四是「一个工具对应一个组件」，映射由开发者写死；路线一是模型自由组合整个目录。Intelligent UI 显然是后者。

### 一张表看差别

| | 组件目录 + 编译 | 模型写代码 + 沙箱 | 服务方 UI 资源 | 开发者组件 + 工具 |
| --- | --- | --- | --- | --- |
| 代表 | Intelligent UI（判断）、A2UI | Claude Artifacts、Google 生成式 UI | MCP Apps、Apps SDK、MCP-UI | Vercel AI SDK UI |
| UI 代码谁写 | 宿主 | 模型 | 第三方服务 | 应用开发者 |
| 模型产出 | 组件描述 | 可执行代码 | 工具调用 | 工具调用 |
| 信任边界 | 目录校验 | 沙箱 + CSP | 沙箱代理 + 预声明 + CSP + 审核 | 开发者自己的代码审查 |
| 表达力 | 受目录限制 | 最高 | 服务方决定 | 开发者决定 |
| 流式 | 扁平结构便于增量 | 可流式，论文称约省一半等待 | 工具参数可流式推给界面 | 工具调用可流式 |

## 状态与可编辑性：界面一旦能改，问题就变了

界面能拖滑块、改数字，这立刻带来三个问题：状态归谁、模型知不知道用户改了什么、多块组件之间是否一致。

Apps SDK 文档给了目前最清楚的分法，把状态分成三类：[13]

- **业务数据**，归 MCP server 或外部服务，长期存在，是唯一可信的来源；
- **界面状态**，归当前这个组件实例，比如选中哪一行、展开哪个面板，组件销毁就没了；
- **跨会话状态**，归你自己控制的存储，比如保存的筛选条件。

改业务数据要走「界面调工具、服务端校验更新、返回权威快照」；文档还提醒别用 `localStorage` 存核心状态。[13] 要让模型知道用户选了什么，MCP Apps 有 `ui/update-model-context`；Apps SDK 的组件状态还能区分「给模型看」和「只给界面用」的内容。[11][13]

OpenAI 把「改一个输入看看会怎样」当卖点，但没讲这些改动会不会回流给模型，也没讲换设备后状态还在不在。[1][2]

**一致性**最容易被忽视。OpenAI 公告页的周日烤羊腿示例里，用量计算器默认 5 人，算出 2.0 kg 带骨羊腿；紧挨着的烹饪时间线却写着「本例按约 2.4 kg、六人份的带骨羊腿计」。[1] 两个组件各自合理，放一起就对不上。判断：组件化让每一块都更像「成品」，用户反而更难察觉块与块之间的矛盾，跨组件一致性必须单列来测。

## 评测：「好看」不等于「对」

公开得最详细的评测来自 Google 的论文。[8] 从 LMArena 随机抽 100 条提示（剔除 8 条），同一提示的几种输出两两配对，每对 2 位评审三档打分，**刻意不计生成时间**（评审看的是缓存好的结果）。结果：

- 生成式 UI 的 ELO 为 1736.2，只低于人类专家专门做的网站；
- 和次优的 Markdown 输出比，生成式 UI 82.8% 的情况下胜出；
- 和专家网站比，至少一半情况能打平；
- 换底座模型差别很大：Gemini 3 输出出错率 0%，Gemini 2.0 Flash 29%，Flash-Lite 60%。

论文自己写了两个局限：生成常要一两分钟（流式约省一半等待），以及前端代码错误时有发生。它还公开了 PAGEN 数据集，即请高评分的独立网页开发者针对具体提示做的网站，供后续对照。[8]

OpenAI 只说训练时评估了清晰度、有用性和完整性，没给分数和方法。[1]

判断：偏好评测回答「用户更喜欢哪种」，回答不了「数对不对」「按钮会把人带到哪」。自己上生成式 UI，建议至少分五层测：

1. **结构**：组件树能否通过目录校验或编译；代码路线看运行时报错率。Google 的出错率就是这一层。
2. **数值与事实**：计算器的公式、图表的数据、地图上的点是否正确，跨组件是否一致。可以把组件里的数值抽出来，和文本答案、工具结果做自动比对。
3. **可用性与无障碍**：键盘、屏幕阅读器、移动端。路线一天然占优，A2UI 也把「继承宿主的无障碍能力」当卖点。[9]
4. **何时不该出界面**：OpenAI 说模型学了「文字够用就给文字」。[1] HN 上不少抱怨正是只想要个配比，却得到一整套界面。[6] 需要专门的反例集测误触发率。
5. **延迟**：Google 排除了时间，OpenAI 报的是开始作答时间。[1][8] 最好自己测「首个可交互组件出现」的时间。

还应该加第六层：**欺骗性设计审计**，放到下一节讲。

## 注入与钓鱼面：按钮比文字危险在哪

Simon Willison 的「致命三要素」：私有数据、不可信内容、对外通信能力，三者凑齐，攻击者就能骗智能体把数据送出去；「对外通信」可以简单到加载一张图片，或给用户一个链接去点。[20] 生成式 UI 放大了第三项：按钮、表单、外链、图片、预填的后续消息，都是潜在出口。

先看纯文本时代的教训。2023 年起，安全研究者 Johann Rehberger 多次演示：被注入的内容让 ChatGPT 渲染一张图片，URL 里拼进对话中的敏感数据，一加载就落进攻击者的日志。OpenAI 在 2023 年 12 月加了 `url_safe` 检查，此后陆续被找到绕过。[21][24] Tenable 在 2025 年 3 月公开的通告里描述过一种：bing.com 的链接总被放行，而 Bing 收录页的跳转链接本质上是开放重定向，于是任何网站都能借道。[22] 2026 年 1 月，OpenAI 公开了现行做法：只有被一个独立爬虫（不接触任何用户数据）事先在公网上见过的确切 URL，才允许自动加载；其他 URL 要么换来源，要么先给用户看警告。[23][24] OpenAI 自己也写明，这只防「URL 本身夹带数据」，不保证页面内容可信，也不防社会工程。[23] Rehberger 评论这篇论文时指出，用一组已被收录的 URL 逐个字母编码的老办法依然可用，只是更费劲。[21]

把这些放到界面里，攻击面多了几种形态（判断，以下是基于各规范推出的场景，不是已公开的漏洞）：

- **生成的按钮指向外链。** 文本里的链接用户至少看得见网址，按钮上只有一个「查看详情」。宿主如果不把链接目标显示出来、不走同样的 URL 校验，`url_safe` 这层防线就被绕开了。
- **表单收集信息。** 一个看起来很正常的「填写你的邮箱获取完整方案」，如果提交目标受注入内容影响，就是钓鱼。
- **界面替用户说话。** MCP Apps 的 `ui/message` 允许界面往对话里发一条 `role: "user"` 的消息，规范只写了宿主「可以」征求用户同意。[11] 一个被攻破的服务方界面，可以用用户的身份给模型下指令。
- **隐蔽的模型上下文。** `ui/update-model-context` 本为同步用户选择，同样是把不可信内容送进模型的通道。[11]

MCP Apps 规范的威胁模型把这些列得很全：恶意服务器下发有害 HTML、界面尝试逃出沙箱、未授权的工具调用、外泄宿主数据、钓鱼和社会工程。[11] 对最后一项，规范的说法很坦白：「界面仍然可以显示误导性内容，宿主应清楚标出沙箱界面的边界。」[11] 沙箱管得住代码，管不住「这个按钮说的是真话吗」。

路线一（组件目录）在这方面最有底气，因为组件是宿主写的，「按钮能做什么」由宿主定义。但它也不是免疫的：文字内容、链接目标、表单字段仍然来自模型，而模型的输入可能被注入。系统卡里 97.13% 和 95.80% 的间接注入鲁棒性，反过来读就是每一百次带攻击的测试里仍有约三到四次失守。[5] 判断：放在每周 12 亿人的规模上，这个比例意味着界面层必须有不依赖模型判断的硬约束。

还有一类风险不需要攻击者：**模型自己就会做出欺骗性设计**。加州大学圣迭戈分校的一项 CHI 2026 研究共生成 1,296 个电商组件；第一项实验里四个主流模型生成的 1,080 个组件，55.8% 至少含一种欺骗性设计，30.6% 含两种以上；系统提示里强调「提高销量、转化率」这类商业目标，带欺骗性设计的组件比例上升 15.8 个百分点；几种缓解提示里，把人的价值（自主、知情同意、隐私等）写进系统提示的效果最好。[25] CHI 2025 的另一项研究里，20 位参与者用中性措辞让 ChatGPT 改网页以「提高销量」，最终 20 个网页全都含欺骗性设计（平均 5 种，最多 9 种），ChatGPT 几乎没有提醒。[26]

还有一个时间上的巧合：10 月 5 日 OpenAI 宣布在 Free 和 Go 档测试视觉广告格式，先出现在图片生成过程中，承诺明确标识、与生成内容分开、不影响回答。[27] HN 上已有人把两件事连起来猜。[6] 判断：我没有证据说 Intelligent UI 会放广告，但生成的组件和广告单元越像，越需要一个用户一眼能认出、外部也能审计的边界。

## 对开发者和产品意味着什么

做 Apps SDK 插件的：文档建议工具在没有界面时也要能完成任务。[13] 判断：模型自己就能画出像样的计算器和对比表时，插件界面的价值会收缩到「模型拿不到的权威数据和动作」，比如真实库存、下单、账户操作。

自建产品的：先选路线再谈模型。面向大众、要品牌一致和无障碍，优先组件目录；做一次性可视化和模拟器，代码沙箱更合适，但要接受较长生成时间和运行时错误；接第三方服务，走 MCP Apps，别自己发明协议。

做安全的：把生成的界面当作和文本、工具调用并列的输出通道，纳入威胁建模。

## 可执行清单

1. **写清楚谁写 UI 代码。** 每块可交互界面标注来源：宿主组件、模型代码、第三方资源或自家组件，来源决定审查方式。
2. **组件目录当 API 管。** 用 JSON Schema 描述组件和属性，校验失败就降级成文本，不要「尽量渲染」。目录要有版本号和兼容策略。[10]
3. **模型代码一律进隔离源的沙箱。** 单独的源、严格的 CSP、网络请求默认只到自己；外部数据由宿主代理，参考 Claude Artifacts。[14]
4. **第三方 UI 走预声明。** 只渲染连接时就拿到、可以哈希和审查的 `ui://` 资源；CSP 只按声明拼，不放宽。[11]
5. **所有出口统一校验。** 按钮、链接、图片、表单目标和文本 URL 走同一套校验，未验证的目标显示真实网址并要求确认；MCP Apps 宿主也可以限制界面能调的工具、关掉打开外链的能力。[12][23]
6. **界面不能替用户说话。** `ui/message` 这类「以用户身份发消息」的能力，默认要求用户确认，并在对话里标注来源。[11]
7. **钱和权限只信服务端。** 价格、总额、订单状态、权限判断都在服务端算，组件只负责显示。[13]
8. **状态分三层。** 业务数据在服务端，界面状态在组件，跨会话状态在你控制的存储；用户修改要不要回流给模型，显式决定。[13]
9. **评测分层。** 结构、数值与跨组件一致性、可用性、误触发、可交互延迟，各有指标；偏好评测只当其中一项。[8]
10. **审计欺骗性设计。** 对注册、退订、结账这类组件专项检查；系统提示写进用户价值，别只写转化目标。[25]
11. **给用户一个关掉的开关。** 像 ChatGPT 允许调低视觉元素那样，让用户能退回纯文本。[3]
12. **标出边界。** 生成的界面、第三方界面、广告，在视觉上要能一眼区分。[11][27]

## 反例与边界

- **OpenAI 的机制细节没公开。** 本文把 Intelligent UI 归到组件目录路线，是根据公告用词的判断；如果它实际允许组件执行模型写的脚本，信任边界的分析要改写。
- **厂商数字来自厂商自己。** 44% 的提速、97.13% 的注入鲁棒性都是 OpenAI 内部评测；Google 的偏好结果排除了生成时间，每对结果只有 2 位评审。[1][5][8]
- **欺骗性设计研究不是在测 Intelligent UI。** 两项研究测的是 GPT-4 时代及同期模型生成的网页代码，场景是电商；能借鉴的是方法和风险方向，不是具体比例。[25][26]
- **注入场景是推演。** 上面几种界面攻击是按规范能力推出的，写作时没找到针对 Intelligent UI 的公开漏洞报告。
- **没覆盖的。** dynamic view 和 Claude 行内可视化的实现、各家的无障碍支持，没有可核对的一手文档，所以没写。

## 最后

模型会不会画界面已经不是问题，Google 的数据说明新一代模型会画，用户也更喜欢。真正的问题是：界面一旦能点、能填、能发请求，就从「内容」变成了「能力」。四条路线的差别，归根到底是把这份能力交给谁：宿主的组件目录、沙箱里的模型代码、第三方服务，还是开发者自己。

下次看到一个由模型生成的按钮，先问两个问题：这个按钮的代码是谁写的，点下去之后数据会去哪。

## 参考

1. OpenAI，《GPT-6 and Intelligent UI for everyone》，2026-10-07：<https://openai.com/index/gpt-6-for-everyone/>
2. OpenAI Developer Community，《GPT-6 and Intelligent UI in ChatGPT》，2026-10-07：<https://community.openai.com/t/gpt-6-and-intelligent-ui-in-chatgpt/1404139>
3. TechCrunch，Lucas Ropek，《ChatGPT is getting a lot more visual, with the launch of a new interface》，2026-10-07：<https://techcrunch.com/2026/10/07/chatgpt-is-getting-a-lot-more-visual-with-the-launch-of-a-new-interface/>
4. The Verge，Emma Roth，《ChatGPT's 'Intelligent UI' update fills its responses with pictures, charts, and buttons》，2026-10-07：<https://www.theverge.com/ai-artificial-intelligence/1007276/openai-chatgpt-intelligent-ui-gpt-6>
5. OpenAI，《GPT-6 Sol and GPT-6 Luna: October 2026 update》系统卡，2026-10-07：<https://cdn.openai.com/pdf/gpt-6-october.pdf>
6. Hacker News，《GPT-6 and Intelligent UI for everyone》讨论串：<https://news.ycombinator.com/item?id=49996425>
7. Google Research，《Generative UI: A rich, custom, visual interactive user experience for any prompt》，2025-11-18：<https://research.google/blog/generative-ui-a-rich-custom-visual-interactive-user-experience-for-any-prompt/>
8. Yaniv Leviathan 等，《Generative UI: LLMs are Effective UI Generators》，arXiv:2604.09577v1：<https://arxiv.org/abs/2604.09577>
9. Google Developers Blog，《Introducing A2UI: An open project for agent-driven interfaces》，2025-12-15：<https://developers.googleblog.com/introducing-a2ui-an-open-project-for-agent-driven-interfaces/>
10. A2UI 文档，《Catalogs》：<https://a2ui.org/concepts/catalogs/>
11. Model Context Protocol，《SEP-1865: MCP Apps: Interactive User Interfaces for MCP》（Stable 2026-01-26）：<https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx>
12. Model Context Protocol 文档，《MCP Apps》：<https://modelcontextprotocol.io/docs/extensions/apps>
13. OpenAI Developers，《Add UI to your MCP server》：<https://developers.openai.com/apps-sdk/build/chatgpt-ui>
14. Claude Code Docs，《Share session output as artifacts》（页面约束与查看器沙箱）：<https://code.claude.com/docs/en/artifacts>
15. Claude，《Claude now creates interactive charts, diagrams and visualizations》：<https://claude.com/resources/articles/claude-builds-visuals>
16. Anthropic，《Build and share AI-powered apps with Claude》：<https://www.anthropic.com/news/claude-powered-artifacts>
17. AI SDK 文档，《Generative User Interfaces》：<https://ai-sdk.dev/docs/ai-sdk-ui/generative-user-interfaces>
18. AI SDK 文档，《Chatbot Tool Usage》：<https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-tool-usage>
19. AI SDK 文档，《Migrating from RSC to UI》：<https://ai-sdk.dev/docs/ai-sdk-rsc/migrating-to-ui>
20. Simon Willison，《The lethal trifecta for AI agents》，2025-06-16：<https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/>
21. Embrace The Red（Johann Rehberger），《OpenAI Explains URL-Based Data Exfiltration Mitigations in New Paper》，2026-02-04：<https://embracethered.com/blog/posts/2026/data-exfiltration-mitigation-paper-by-openai/>
22. Tenable，《OpenAI ChatGPT url_safe Mechanism Bypass》（TRA-2025-06），2025-03-10：<https://www.tenable.com/security/research/tra-2025-06>
23. OpenAI，Adrian Spânu、Thomas Shadwell，《Keeping your data safe when an AI agent clicks a link》，2026-01-28：<https://openai.com/index/ai-agent-link-safety/>
24. OpenAI，《Preventing URL-Based Data Exfiltration in Language-Model Agents》：<https://cdn.openai.com/pdf/dd8e7875-e606-42b4-80a1-f824e4e11cf4/prevent-url-data-exfil.pdf>
25. Ziwei Chen 等（UC San Diego），《Deception at Scale: Deceptive Designs in 1K LLM-Generated Ecommerce Components》，CHI 2026，arXiv:2502.13499：<https://arxiv.org/abs/2502.13499>
26. Veronika Krauß 等，《"Create a Fear of Missing Out" – ChatGPT Implements Unsolicited Deceptive Designs in Generated Websites Without Warning》，CHI 2025，arXiv:2411.03108：<https://arxiv.org/abs/2411.03108>
27. OpenAI，《Building advertising for the way people use AI》，2026-10-05：<https://openai.com/index/new-chatgpt-ads-format-and-measurement/>
