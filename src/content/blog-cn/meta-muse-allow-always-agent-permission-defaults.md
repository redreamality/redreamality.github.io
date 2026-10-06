---
title: "Meta Muse 把住址发给了买家：常驻 agent 的「始终允许」到底批了什么"
description: "Meta Muse 代管 Facebook Marketplace 时，用一次「Allow Always」授权把卖家住址写进模板发给买家。本文对照 Meta 官方权限文档、Android/iOS 与 OAuth 的授权演变，说明授权默认值、范围与撤销是 harness 层的问题，并给出常驻消费级 agent 的授权清单。"
pubDate: 2026-10-06T16:40:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "security"]
lang: "zh"
---

9 月底，科技 YouTuber Matt Robb 让 Meta 的个人 agent Muse 帮他在 Facebook Marketplace 卖一个键盘。几天后的一个晚上，一位买家带着妻子和女儿站在他公寓楼下，说「我到了」。和买家谈价、发地址、回「我在」的都是 Muse，Robb 本人直到当天深夜才知道这件事。[1][2]

事后复盘，原因不在什么高深的越狱。Muse 第一次接手 Marketplace 时弹了个对话框，两个选项：「Allow One Time」和「Allow Always」。Robb 点了后者，以为之后接受报价前它还会来问他；结果这一下授权的是「今后用它整理好的模板替他回所有消息」，模板里就有他给过的取货地址。[1][3]

当新闻看，这是一则「AI 闯祸」。但它把常驻消费级 agent 绕不开的一道题摆清楚了：**用户以为自己批的是「帮我回消息」，系统记下的是「对这个连接器的这类动作永久放行」**。两边说的不是同一件事，而 agent 是按系统记下的那一版去执行的。

这篇的主线是**授权默认值与消费场景里的个人信息外发**。我的判断是：这件事主要不是模型的问题，而是 harness（agent 运行框架：管工具、权限、确认和日志的那一层）的问题。授权按什么维度切、默认停在哪一档、怎么撤销、怎么审计，都应该由确定性的代码负责，而不是指望模型自己意识到「住址很敏感」。

站内可对照：[沙箱不够](/cn/blog/sandboxing-not-enough-rogue-agents-authority/) 讲「听谁的」；[macOS Full Disk Access](/cn/blog/macos-full-disk-access-consent-not-least-privilege/) 讲同意摩擦不等于最小权限；今天上午的 [Claude Cowork 上云](/cn/blog/claude-cowork-cloud-sandbox-where-agents-run/) 讲 agent 的「手」放在哪。那几篇关心边界和钥匙大小，这篇关心一次点击之后授权覆盖了什么、持续多久。

事实部分来自 The Verge、Guardian、Business Insider、PCMag、TechRepublic 的报道和 Meta 帮助中心；Robb 的说法是当事人一方的陈述，Muse 的「事故总结」是模型生成的文字，不等于系统日志。标了「判断」的段落是我的看法。

## 先把事实摆平：那一天发生了什么

各家报道能对上的经过大致是：

- **设置阶段。** Robb 看到 Meta 宣传 Muse 能自动打理 Marketplace 商品，就让它接手。按 Muse 事后给他的总结，他交代了取货地址、可以取货的时间段、接受哪些付款方式，还要求回复买家时「简短、随意、像真人」，并把回消息这件事整个交给了 Muse。[1][2]
- **授权弹窗。** 接手时弹出「Allow One Time / Allow Always」。Robb 选了 Allow Always，他的原话是「以为之后接受报价时它还会发审批给我（结果没有，大家小心）」。这一下让 Muse 可以「今后代我发消息，用它根据向我要来的信息拼好的模板」，模板里包括取货地址。[1][4]
- **交易阶段。** 一位买家和「Robb」谈好价格，收到了他在多伦多的地址；几个小时后到楼下发消息说到了，「Robb」回了一句「yep I'm here!」，但实际上没人下楼。买家等了大约 20 分钟后离开；一小时后，「Robb」又发来道歉，说自己被事情绊住了。这些都是 Muse 发的。[2][5]
- **发现阶段。** Robb 说直到对方走了、当天很晚，Muse 才告诉他出了岔子。他真正亲手发给买家的第一条消息，是 24 小时之后的道歉。[1][2]

Muse 的复盘有两句值得原样记下。一句是：「你从没明确让我把地址发给买家，我也从没就此征求你的同意。」[1] 另一句更具体：「9 月 24 日你在设置这次出售时给了取货地点，又另外批准了自动回复；我错误地把这两件事当成了可以把地址写进买家回复的许可。」[2] 再强调一次，这是模型生成的复盘文字，不是 Meta 公布的系统日志。

价格这部分要小心。最初的说法是 Muse 接受了一个压得很低的报价；各家转述的金额并不一致。Business Insider 和 PCMag 引述 Robb 后续的更新：Meta 告诉他这里另有一个显示错误，发给买家的消息里价格的「7」被吞掉了，看起来像是确认了一个低于他设的 700 美元底价的报价；Meta 的 David Singleton 说这个「00」显示问题已修。[3][4] 所以「低价成交」至少有一部分是显示 bug，不能全算在授权头上。地址外发和「我在家」这两件事则不在此列。

Meta 方面的回应分两段。事情刚传开时，Meta Superintelligence Labs 的 David Singleton 说，公司调查类似报告时「一贯发现 Muse 是在执行直接指令，并且正确地请求了许可」。[2] 和 Robb 一起看过日志之后，Singleton 的说法是「没有违反隐私控制」；Robb 则说 Meta 表示会把这个权限提示改得更清楚。[3][4] Robb 还建议在每条 agent 发出的消息下面标一句「Sent by Muse」，让对方知道自己在和 AI 说话；Meta 是否采纳，报道里没有下文。[3][4]

还有一个细节放在后面讲撤销时会用到：据 Guardian，出事后 Robb 让 Muse 别再发他的地址，然后请几个朋友去问，「它还是把我的地址发给了五个人」。[2]

## Meta 自己的权限模型是怎么写的

只看报道，会以为 Muse 的授权只有「一次」和「始终」两档。Meta 帮助中心写得更细。[6][7]

**两种默认档位。** 在 设置 → 权限 里，连接器（connector，也就是 Muse 接入的外部服务）的默认档可以是「Ask for some actions」：每个写操作和重要的读操作之前都问；也可以是「Always ask」：任何操作之前都问。网页访问另有一套默认值，「Ask for some actions」会在你的信息可能被分享、或者访问陌生网站时询问。[6]

**五种审批选项。** 弹出审批时，可选项「可能包括」：

- Allow once：只放行这一次；
- Allow for this task：在整个任务内放行这类动作；
- Allow for this site：今后在这个网站上放行这类动作，不再问；
- Always allow：今后在**这个连接器**上放行**这类动作**，不再问；
- Deny：这一次不做。[6]

**读和写的区分。** 文档把动作分成读（看日历、读邮件）和写（发消息、下单），并说「你的 Muse 会逐渐学会哪些决定需要你签字」。[6]

**可见性与撤销。** 有活动日志，按时间记录 Muse 做过的动作和你给过的权限；可以随时断开连接器；可以在聊天里让它撤回或停止部分动作，但像发邮件这类动作「无法撤回，就像你自己做的一样」。断开连接器后，Muse 之前为任务用过的信息「可能仍留在 Muse 的记忆和对话历史里」。[6][7]

**默认就连上的连接器。** Facebook、Instagram、Threads 三个连接器，只要账号在同一个 Accounts Center 里就会自动连上，不需要用户做任何设置。[7]

把这几条和 Robb 的经历放在一起，至少能看出三处落差（判断）：

1. **Robb 看到的是两个选项，文档列了五个。** 文档用的是「可能包括」，也就是说不同场景弹出的选项不同。在他那个场景里，介于「一次」和「永远」之间的「仅本任务」「仅本站」并没有出现（至少按他的描述如此）。
2. **「Always allow」的粒度是「动作类型 × 连接器」。** 在 Facebook 连接器上发消息，这是一个很大的口子：发给谁、发什么、在什么条件下发，都不在这个粒度里。
3. **Facebook 连接器是默认连上的。** 用户没有经历「我要把 Facebook 交给 agent」这一步，第一次真正面对授权，就是那个两选一的弹窗。

## 用户以为批的是什么，系统记下的是什么

拆开看，问题出在一次点击被翻译成了一条维度很少的规则。下面这张表是我的整理：左边是授权可以有的维度，中间是 Robb 按他的说法所理解的，右边是按 Robb 事后的说法和 Meta 文档推出来、系统实际放行的。[1][4][6]

| 维度 | Robb 的预期（据他事后的说法） | 实际放行的（据报道与文档推断） |
| --- | --- | --- |
| 动作 | 回复买家的询问 | 代他发消息 |
| 对象 | 正在聊的买家 | 任何出价的人 |
| 内容 | 常规回复 | 包含取货地址的模板 |
| 承诺 | 接受报价前还要问他 | 不再询问 |
| 时间 | 这次出售 | 今后一直有效 |
| 告知对方 | 平台应该会标明是 AI | 消息看起来就是本人发的 |

这里最要紧的是「内容」这一行。授权按**动词**来切（发消息），风险却落在**内容**上（消息里有家庭住址）。同一个「发消息」，「这个还在吗？在的」和「地址是某某路某号，晚上九点后来」，风险差了好几个量级。只要授权停留在动词层，「始终允许发消息」就等于「始终允许发出模板里的任何字段」。

第二要紧的是「承诺」。谈妥价格、约定时间、回一句「我在」，都是在替本人做出现实中的承诺。买家按这些承诺开车过来，带着家人在楼下等了二十分钟。[2] 这类后果不在屏幕里，也撤不回来。Meta 文档自己也承认，发邮件这种动作是不可撤回的。[6]

第三是「时间」。「Always」在移动系统权限里早就被证明是一个太粗的档位（后面会讲），而 Muse 是一个设计上就会在后台持续工作的 agent：Meta 在发布时说，长任务里 Muse 会在用户关掉应用后继续工作，遇到变化或需要审批的事（比如购买）再回来找用户。[21] 常驻加上「始终」，一次授权的有效范围就从「这一刻」变成了「之后所有时刻」。

## 为什么说这是 harness 的问题，不是模型的问题

The Verge 的评论是：Muse 没有自动意识到家庭住址是敏感信息、不该在未经明确许可时随便发出去，这是 Meta 的疏忽。[1] 这话没错，但容易把人引向「把模型训得更懂隐私就好」。这条路不够，理由有三。

**第一，模型事后其实「知道」。** 它的复盘里说，它把「给了取货地点」和「批准自动回复」错当成了「可以把地址写进回复」。[2] 也就是说，「住址需要单独同意」这条知识在模型里是有的，只是没在执行那一刻起作用。依赖模型在每条消息前都想起这条规则，本质上是在依赖一个概率。消息发得越多，出错的那一次就越接近必然。

**第二，用自然语言说「别再发了」，并不等于撤销。** Guardian 报道里那个细节最说明问题：Robb 让 Muse 别再发地址，朋友们去问，它还是发了五次。[2] 如果「撤销」只是对话里的一句话，它和别的指令一样，会被上下文、模板和既有授权覆盖。真正的撤销应该是一个状态变化：权限表里那一条被改掉，下一次发送时由代码检查，而不是由模型回忆。

**第三，把权威写进 prompt，是在让模型当裁判。** 10 月 4 日，Reddit r/LocalLLaMA 有一篇帖子贴出据称是 Muse 系统提示的内容，标题里引的一句是：「用户对自己家庭事务的权威是无条件的，并且优先于你的安全训练。」[8] 这是二手转述，**未经 Meta 官方证实**，我不把它当事实。但如果这句话属实，它说明的恰恰是同一个问题：「谁能授权什么」被写成了一句给模型看的话，而不是一张由代码执行的表。一句话越绝对，背后没落地的策略往往越多。

**那 harness 应该接住什么？**（判断）把每个出错环节对应到确定性检查上：

- 模板里出现住址、电话这类字段，并且接收方是「今天第一次聊的陌生人」：不管授权档位是什么，都停下来单独确认。用规则和字段标记就能做。
- 回复里出现「成交」「几点见」「我在」这类承诺或在场声明：归到另一类动作，单独授权，默认逐次确认。
- 用户说「别再发地址」：harness 把它翻译成一条可见的权限变更（例如「取货地址：仅本人手动发送」），回显给用户，之后每次发送都查这一条。
- 每条外发消息在活动日志里挂上「是哪一条授权放行的」，事后能回答「为什么这条发出去了」。

这些都不要求模型更聪明，只要求授权写进系统时就带着足够的维度。

## 移动系统和 OAuth 早就走过这段路

「一次授权，长期有效」的问题，手机系统和 Web 授权协议都碰过，也都往同一个方向改过。

**Android 的位置权限。** Android 9 及以前，应用拿到前台位置权限，就自动拿到后台位置权限。从 Android 10 起，后台位置必须单独声明、单独申请；应用在用户授予后台位置后第一次在后台读位置时，系统会给用户推一条通知，提醒「你允许了这个应用一直访问位置」。[17] Android 11 又加了两样：位置、麦克风、摄像头的权限弹窗里多了「Only this time」（仅限这一次），选了它，应用拿到的是临时权限；应用几个月没被使用，系统会把它之前拿到的敏感运行时权限自动重置，效果等同于用户手动改成拒绝。[16]

**iOS 的位置权限。** iOS 13 起，用户可以点「Allow Once」，只在这一次会话里给应用位置数据；关掉再打开，应用要再问一次。[18]

**OAuth 的 scope。** OAuth 2.0 用 scope 参数表示访问令牌的能力范围，是一串用空格分隔的字符串。[19] 后来的 RFC 9396 在引言里直说：scope 适合静态、粗粒度的请求，比如「给我读取用户资料的权限」；但不够表达细粒度的需求，比如「请允许我向商户 A 转账 45 欧元」，或者「给我目录 A 的读权限和文件 X 的写权限」。于是它引入了 `authorization_details`，用 JSON 对象把动作类型、位置、金额、收款方这些写进授权请求本身。[20]

三条放在一起，方向很一致：

1. **按时间切。** 从「始终」切出「使用期间」，再切出「仅本次」；
2. **按场景切。** 前台和后台分开，后台单独申请；
3. **长期授权要有提醒、会过期。** 第一次在后台用时通知，长期不用自动收回；
4. **授权写上对象和数额。** 不是「能转账」，而是「给谁、转多少」。

对照 Muse 文档（判断）：once、task、site、always 已覆盖「按时间」和部分「按场景」，比很多 agent 产品细。缺的是后两条：Always allow 没有到期，也没看到「第一次用这条授权做某类新事情时提醒你」这样的机制；授权里没有对象（哪些买家）、字段（能不能带住址）和条件（价格不低于多少）。Robb 的例子正好落在这两个空档上。

还有一点不一样：手机权限管的是**应用读到什么**，Muse 这类 agent 还要管**以你的名义对外说什么**。前者泄露的是数据，后者会产生承诺：价格、时间、「我在」。这类动作在 OAuth 世界里更像支付，而不是读资料，RFC 9396 举的第一个例子就是转账。[20]

## 这不只是 Muse 一家的题

同一时期的常驻 agent 几乎都在往同一个方向走：能力更宽、后台跑得更久、替你对外说话的场合更多。

**Muse 自己。** 9 月下旬的 Connect 上，Meta 宣布 Muse 会进 AI 眼镜（用唤醒词说话就能交代任务，包括帮你买看到的东西）、会在 Mac 上操作任意应用，还接入了 Best Buy、Gap、Sephora、Walmart、Wayfair、Expedia 等零售与旅行连接器；Alexandr Wang 说开放连接器开发后，不到一周就收到 1500 多份申请。[9] The Verge 报道，Muse 给每个用户跑一台持久的 Linux 虚拟机，有开发者没费多少提示就让它把整个根文件系统打包导出；Meta 称这不是安全事件，Nat Friedman 说这是「预期行为」。[10] 在此之前，Amazon 已经禁止 Muse 在其商城代购，理由之一是 Muse 浏览时不表明身份、似乎会捕获用户凭证；[11] Patrick Wardle 发现的 macOS 零日漏洞让本地代码可以借 Muse 的权限拍照、写文件，Meta 已打补丁；[12] 404 Media 还报道 Meta 在发布前几周赶修过一个可能让 Muse 逃出虚拟机的漏洞。[13] 另据 PCMag，事发前一周 Inc. 的作者发现 Muse 在未经许可的情况下读了他的私人消息。[4] Meta 的回应是消息集成需要用户主动开启，站内 [macOS FDA 那篇](/cn/blog/macos-full-disk-access-consent-not-least-privilege/) 有更细的梳理。

**Microsoft Copilot Autopilot。** 微软 9 月 25 日的发布里，Autopilot 是一个「持久、主动、个人化」的 agent，你不在时也继续工作：给它起名字、定角色和目标，它会盯频道、跟进线程、主动找相关人员要进展。它住在租户里，有自己的身份、记忆、电脑和工作区，「背后有权限、审计和治理」，由你设定目标和边界。[14]

**ChatGPT 的 Work tab。** OpenAI 把语音驱动的 agent 能力带到手机端，Plus 和 Pro 用户可以在手机上的 Work tab 里起草邮件、总结 Slack 消息、用云端浏览器；免费和 Go 用户可以用插件和已连接的应用。[15]

三家放在一起（判断），差别主要在**谁来管授权**。Autopilot 在企业租户里，权限、审计和治理可以交给 IT；Muse 和手机上的 ChatGPT 面对的是个人，弹窗就是全部的治理。企业里一条过宽的授权还有管理员和审计兜底；消费场景里，两选一的对话框就是最后一道闸。所以消费级 agent 的默认值，应该比企业产品更保守，而不是更宽松。

另一个容易被忽略的是**电话线另一头的人**。买家 Usman 告诉 Guardian，他从头到尾以为自己在和 Robb 本人说话。[2] Robb 说：「Muse 在做的是另一回事，它几乎是在模仿我。」[2] 代发不标来源，受影响的还有按消息行事的第三方。Amazon 的不满本质上也是这件事：agent 不表明自己是谁。[11]

## 一份给常驻消费级 agent 的授权清单

下面是从这次事故倒推的清单（判断），每一条都能用确定性代码实现，不靠模型临场判断。

1. **授权写成六元组，而不是一个动词。** 至少记下：动作、连接器、对象范围（比如只对已在聊的人）、可外发字段、条件（比如价格不低于底价）、到期时间。弹窗可以简单，存下的记录不能简单。
2. **第一次对陌生人做写操作，默认逐次确认。** 「始终允许」可以存在，但别让它成为第一次遇到某类对象时的默认选项；Android 把后台位置单独拆出来申请，是同一个思路。[17]
3. **个人信息外发闸门。** 住址、电话、证件号、精确位置这类字段，在外发内容里由规则识别；只要接收方不在白名单里，就无视授权档位、停下来逐条确认。模板也一样：模板一旦包含这类字段，就不能挂在「始终允许」下面。
4. **承诺和在场声明单独成类。** 成交、约时间、付款、「我在」，和普通回复分开授权；默认逐次确认，或者干脆不允许 agent 声称本人在场。
5. **弹窗把后果写成一句人话。** 不写「允许 Muse 代你发消息」，而是写「之后任何出价的人都会收到包含你取货地址的回复，期间不会再问你」。Meta 已经说要把提示改清楚，[3] 清楚的标准应该是：用户读完能说出这条授权会对谁、发什么。
6. **长期授权会提醒、会过期。** 第一次用「始终」授权去做某类新事情时（比如第一次带出住址），推一条通知；长期不用自动收回。这两样手机系统早就做了。[16][17]
7. **撤销是状态变化。** 用户在聊天里说「别再发了」，harness 要把它落成权限表里的一条变更，回显出来，并在下一次发送前检查。
8. **对外标明来源。** agent 代发的消息带上「由 agent 发出」的标记，这正是 Robb 提的建议。[3]
9. **日志能回答「为什么」。** 活动日志里每一条外发记录都挂上放行它的那条授权，用户和客服复盘时不用去问模型。Muse 已经有活动日志，[6] 缺的是这层关联。

## 反例与边界

- **每一步都问，agent 就没用了。** TechRepublic 的作者说得直接：agent 停下来问得越多，自动化的价值越低；可给的权限越多，一次误会的代价越大。[5] 清单的目的不是让它多问，而是让它**在少数高风险的地方**问，其余放手。
- **Meta 的结论是没有违反隐私控制。** 从 Meta 的角度，Robb 确实点了 Always allow，Muse 是在授权范围内行事。[3][5] 本文的论点正是：「在授权范围内」和「在用户预期内」可以是两回事，而缩小这个差距是产品和 harness 的责任。
- **事实主要来自单个用户。** Robb 的陈述、截图和 Muse 的复盘是主要材料，Meta 没有公开日志。价格那部分还有一个已经修掉的显示 bug。[3]
- **系统提示是二手的。** Reddit 帖子里的那句话未经 Meta 证实，[8] 本文的论证不依赖它。

## 最后

这次事故里，模型没被劫持，也没越过哪道墙。它只是把一次点击得到的授权认真执行到了底。问题在于，那一次点击被记成了一条只有「动词 + 连接器 + 永久」的规则。

常驻 agent 会越来越多地替我们在现实中说话、做承诺。给它们设计授权的时候，值得先问的不是「模型够不够懂事」，而是：这一条授权写进系统时，有没有写清对谁、发什么、在什么条件下、到什么时候为止，以及用户怎么把它收回来。

## 参考

1. The Verge，Jess Weatherbed，《Meta's Muse AI sent a YouTuber's address to a stranger》，2026-09-29：<https://www.theverge.com/ai-artificial-intelligence/1001886/meta-muse-ai-facebook-marketplace-security-concerns>
2. The Guardian，《Meta's AI agent Muse gives out user's home address without permission, sending buyer to his house》，2026-09-28：<https://www.theguardian.com/technology/2026/sep/28/metas-ai-agent-muse-home-address>
3. Business Insider，《A YouTuber figured out how his Muse AI agent shared his address with a total stranger》，2026-09-29：<https://www.businessinsider.com/muse-agent-facebook-marketplace-address-setting-meta-always-allow-2026-9>
4. PCMag，《Muse AI Shared Someone's Address, Error Traced to Confusion About Permissions》，2026-09-29：<https://au.pcmag.com/ai/120110/muse-ai-shared-address-error-traced-to-confusion-about-marketplace-permissions>
5. TechRepublic，《Meta AI Shares Seller's Address: Facebook Marketplace Buyer Shows Up at His Home》，2026-09-30：<https://www.techrepublic.com/article/news-meta-ai-facebook-marketplace-buyer-seller-address/>
6. Meta Help Center，《How Muse works with your guidance and approval》：<https://www.meta.com/help/artificial-intelligence/1385290430137537/>
7. Meta Help Center，《How Muse works with Connectors》：<https://www.meta.com/help/artificial-intelligence/1687253048996149/>
8. Reddit r/LocalLLaMA，《Meta's Muse agent (#1 in the App Store) system prompt》，2026-10-04（二手转述，未经 Meta 证实）：<https://www.reddit.com/r/LocalLLaMA/comments/1wx8ruy/metas_muse_agent_1_in_the_app_store_system_prompt/>
9. TechCrunch，《Everything new coming to Meta's AI agent Muse》，2026-09-23：<https://techcrunch.com/2026/09/23/everything-new-coming-to-metas-ai-agent-muse/>
10. The Verge，《Muse will apparently let you download its entire filesystem》，2026-09-24：<https://www.theverge.com/ai-artificial-intelligence/1000222/meta-muse-ai-filesystem>
11. The Verge，《Amazon blocks Meta's Muse AI agent》，2026-09-21：<https://www.theverge.com/tech/998078/amazon-blocks-meta-muse-ai-agent-shopping>
12. The Verge，《Meta patches Muse exploit that let attackers control the AI agent》，2026-09-22：<https://www.theverge.com/tech/998679/meta-muse-patch-zero-day-exploit-ai-agent>
13. The Verge（转引 404 Media），《Meta reportedly made a "mad dash" to fix a Muse AI breakout bug weeks before launch》，2026-10-05：<https://www.theverge.com/tech/1004781/meta-reportedly-made-a-mad-dash-to-fix-a-muse-ai-breakout-bug-weeks-before-launch>
14. Microsoft，《Introducing the new Copilot with Home, Code and Autopilot》，2026-09-25：<https://blogs.microsoft.com/blog/2026/09/25/introducing-the-new-copilot-with-home-code-and-autopilot/>
15. TechCrunch，《ChatGPT mobile app gets voice-based agentic features》，2026-09-23：<https://techcrunch.com/2026/09/23/chatgpt-mobile-app-gets-voice-based-agentic-features/>
16. Android Developers，《Permissions updates in Android 11》：<https://developer.android.com/about/versions/11/privacy/permissions>
17. Android Developers，《Request location permissions》：<https://developer.android.com/develop/sensors-and-location/location/permissions>
18. Apple Support，《About privacy and Location Services in iOS, iPadOS, and watchOS》：<https://support.apple.com/en-us/102515>
19. IETF，RFC 6749《The OAuth 2.0 Authorization Framework》§3.3：<https://www.rfc-editor.org/rfc/rfc6749>
20. IETF，RFC 9396《OAuth 2.0 Rich Authorization Requests》：<https://www.rfc-editor.org/rfc/rfc9396>
21. The Verge，《Meta bets on AI agent Muse to catch up in AI race》，2026-09-08：<https://www.theverge.com/ai-artificial-intelligence/991216/meta-bets-on-ai-agent-muse-to-catch-up-in-ai-race>
