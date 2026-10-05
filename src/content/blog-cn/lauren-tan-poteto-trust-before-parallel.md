---
title: "信任够了才谈得上并行：Lauren Tan 这场演讲在讲的机制"
description: "Lauren Tan 在直播里主张，吞吐量来自信任而不是多开 agent。本文按她给出的五层纠错、验证 skill 和代码库约束写清机制与边界，并标明哪些数字只是她自己的说法。"
author: Remy
pubDate: 2026-10-05T19:30:00+08:00
lang: zh
tags:
  - ai-agents
  - agent-harness
  - ai-coding
  - code-review
  - software-engineering
---

Lauren Tan 在 X 上是 [@poteto](https://x.com/poteto)，GitHub 也是 [poteto](https://github.com/poteto)。2026-09-21 她发了一条帖，[原帖在这里](https://x.com/poteto/status/2102050467505430555/)。帖子标题里的数字是 2,500，原话大意是：上个月我把 2,500 个 PR 送进了生产环境。这场内容原定在 Cursor Compile London，后来改成给 Grok @Bot Galaxy 的直播。视频大约 38 分钟，合 2281 秒，视频 id 是 `2101938030122868736`。

口播不是这个数。逐字稿来自 X 的自动英文字幕，不是人工校对。字幕里她说的是：上个月往生产环境合了大约 2,000 个 pull request。**2,500 只属于那条帖的标题；大约 2,000 只属于这场口播的逐字稿。** 两个数都留下，不合并，也不用其中一个去改另一个。

她的论点很窄。吞吐量来自信任，不是来自多开 agent。信任指人不在旁边时，agent 仍能交出质量够用的工作。环境铺好以后，产量会上去，看起来有点像个人或团队的「软件工厂」。她不喜欢这个词，更愿意比作米其林厨房：不是流水线复制，人仍对最后端出去的东西负责。agent 接手组件之后，要安排的是灶边的人、工具、训练，以及打下手和做菜的配比。后文她把「软件工厂」划掉。

自动字幕里有一批听错的专名，正文不用那些错词。账号写成 poteto，插件写成 PStack，框架写成 Dune，产品写成 Grok Bot，性能采样写成 heap snapshot，静态检查写成 lint，审查机器人写成 Bugbot。

## 没有信任时，一百个 cloud agent 只是垃圾

演讲里，她把起点放在大约六个月前：她刚加入 Cursor，公司当时还没并进 SpaceXAI。没有现成的 agent skill（写给 agent 的可复用做法），代码库和产品对她都是新的。Cursor 当时在做 IDE 的替代，也就是新的 agents 窗口。她加入之前，这个窗口的性能问题已经很多。主管请她帮忙，理由是她进 Cursor 之前在 React 团队待过。

她做过性能，挡不住的是合入速度。pull request 像一堵墙不断涌进来，她无法判断应用性能有没有在退步。早期时间几乎耗在 Chrome 的开发者工具上：看性能面板、采 trace、做 heap snapshot。手工到她自己烦了。既然已经有 agent，人还在这些面板前面干什么。

于是她开始想验证 skill。让 agent 自己把应用跑起来，自己采 trace，看懂 trace，找到热点，再把性能往上推。她说这六个月里自己的产出上去了，但她从未把「一个月大约 2,000 个 PR」当成目标。回看那些 skill、工具和代码库改动，它们叠在同一件事上：信任。当时更直白的句子是，我是瓶颈，得把工程师知道的东西交到这组 agent 里，这样不是每件事都卡在我身上。

公开履历另写她 2026 年 4 月加入 Cursor。演讲里的「大约六个月」和这份入职月份都来自已核对材料，本文不把它们折算成同一天，也不把后面要说的「第二天修 Cursor 3」并进这段 agents 窗口的叙述。

她描述起步时的工作方式：同时只敢盯 1 到 5 个对话。每个聊天都得看着，不断改方向。人不在，要么什么都不发生，要么 agent 做错。她认为这一段最难走出来，因为看不清出口。出不去，是因为还不信任 agent 交出来的东西。这时候一下子开 100 个 sub-agent 或 cloud agent（放到云端跑的 agent），得到的是一堆垃圾 pull request、回归和 bug。没有人会高兴。

所以问题不是还能再开几个，而是怎样才敢不再盯着。

## 纠一次错，先问最强的那一层能不能接住

她纠正 agent 时，按从强到弱排了五层。顺序是论点的一部分。越靠前，越不依赖某一次对话里，agent 或人记得去读一段提示。

模型会沿用上下文里已经有的东西。agent 读过、打开过的文件就在上下文里。它不会在每个 PR 里把旧代码重构掉，它是接着写。因此仓库里留下的样子，比聊天里的一次纠正更耐久。纠正如果只停在对话里，下一个会话看不到。纠正如果变成「这种写法写不出来」或「CI 会失败」，下一个会话也躲不开。

第一层是代码库和架构，让坏写法在类别上就不可能。她把代码库看成 agent 的记忆。现有的反模式也会被当成记忆：一个小小的绕过办法，或一段解释这个绕过的注释，几天到几周就会被复制成事实上的标准写法。她把这种扩散比成病毒，也比成花园里不该留的生长。你希望被复制的状态，必须是你自己也愿意让下一个 agent 照抄的状态。这一层包括数据结构和做法上的改动。与其每次口头纠正同一种错，不如让那种错无法被写出来。她认为，如果团队真相信以后的代码大多由 agent 写，这件事就是最值得投入的工程，而不只是多写几条提示。

第二层是静态分析：lint、编译器和 CI。这些是可以在仓库里强制的约束。agent 反复犯同一种错，可以加 lint；更好的情况仍是回到第一层，让错误在类别上不可能。看到技术债或坏模式时，她的第一反应是先写一条 lint。不一定马上清干净。先止血，让它不再长大，然后再花时间让 agent 去清。她没有点名具体的 linter 或 CI 产品。不要把某家厂商的工具名补进这层。

第三层是规则、Bugbot 和 skill。这里已经从硬约束变成引导。[Bugbot](https://cursor.com/bugbot) 的文档在[这里](https://cursor.com/docs/bugbot)。规则和 skill 多数时候会被用到，但 agent 可能忘了读规则，开着 agent 的人也可能不理它们。所以这层重要，却不能当成已经强制。漏读一次，约束就等于没发生。

第四层是风格指南和人工 review。风格指南如果没有写进规则、Bugbot 或 skill，就只在人审代码时生效。人得看每一行、记得留言。PR 速度上去之后，这做不到。她不建议只靠风格指南。人审适合用来发现缺了什么，然后把时间投进前面几层，而不是把人审本身当成扩容办法。review 评论里反复出现的同一类意见，说明它还停在第四层，还没被收进架构、lint 或规则。

第五层是验证 skill。它能证明正确性，不能自动证明性能或代码质量。正确性在她这里是：这个功能或这段代码有没有做成你要它做的事。验证 skill 可以拿出经验证据，例如一条路径真的走通了。它不告诉你这块功能快不快，也不告诉你代码写得好不好。性能要另采指标和遥测。代码质量要靠另一类 skill，教 agent 按工程师的做法做事，而不是只证明「跑通了」。

光谱的另一端是形式化方法。[Lean](https://lean-lang.org) 和 [TLA+](https://lamport.azurewebsites.net/tla/tla.html) 可以用来检查业务不变量是不是恒成立，应用是不是处在能被形式化证明的状态。她说自己没走这条路。形式化仍然难，也仍是开放问题，很少有人真的把它和验证 skill 一起用。她的判断是：没有形式化，验证 skill 也能走很远。这是边界，不是「形式化没用」。她没有声称验证 skill 覆盖了形式化要证的那类不变量。

收束时她让听众记住纠错时的顺序。发现自己在追着 agent 改的时候，选最有效的一步：先让这种模式在代码库、架构或数据结构上变得不可能；做不到就上静态分析；再叠规则、Bugbot 和 skill。质量向的 skill 要另外花时间。这些层叠起来，信任才够让 agent 自己往前走。她说这不是窍门，是大量的工作。人审和风格指南用来发现缺口；验证 skill 用来拿正确性的证据。两件都不要拿去代替第一层。

## Control Glass 只是内部的验证 skill

她加入 Cursor、开始做 agents 窗口的性能时，做的第一个 skill 叫 Control Glass。这是验证 skill。**它没有公开页面。** 下文不附链接，也没有公开文档可以对着读。不要把它写成已发布的产品。

它教 agent 怎么把应用跑起来并采 trace，走的是 [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)。她说结构是迭代以后才看清的，一开始并不是这样。验证 skill 有两块。

一块是可复现的 CLI，放在 skill 目录里，而不是让 agent 每次现写脚本。会话之间的脚本会漂，同一条性能线会量出不一样的东西。固定的 CLI 负责跑应用、收集 trace 和 heap snapshot，以及「代码在工作、性能线有没有达到」的经验证据。这块要持续投入，才能覆盖不同用法，而不是演示一次就停。

另一块她叫做 feature map，可以理解成写进仓库的功能地图。她说这个名字是自己起的，灵感接近网站地图，本质是落盘的记忆：应用怎么工作、有哪些功能、用户怎么到达、快捷键是什么、要点哪些 DOM、每个功能做什么。feature map 放在代码库的 skill 目录里，并且有一套自动化在维护。这里的「自动化」是她对这张图的说法，不要把它说成某份已经公开的产品功能清单。

两块分开时都不够。内部 Slack 里常有很模糊的报告：一小块界面截图，再加三个问号。agent 能把应用跑起来，但只能猜用户指的是哪里。CLI 加上 feature map 之后，agent 才能稳定地控制应用、采 trace，并读懂内部和外部用户的请求。她说团队很快把这类用来控制应用的验证 skill 当成关键基础设施，要一直维护。agent 能核对自己的工作，是信任里很实的一块，他们在这个 skill 上花了很多时间。

边界再说清楚。Control Glass 回答的是「做成了没有」，以及性能采样能不能被同一种方法采出来。采得到 trace，不等于代码质量过关，也不等于你已经做了形式化证明。它也不是一套外人可以安装的文档。你若要做同类东西，要自备能复现的 CLI，并把功能怎么到达写进 skill 目录，而不是去找一个并不存在的公开页。

## Dune 把捷径收成唯一的正路

在 Grok Bot 的代码库里，他们做了一套自己叫做 Dune 的客户端框架，目标是让 agent 写起来不容易走歪。**Dune 没有公开页面。** 不要把它写成已经有文档站的产品，这里也不放链接。

直接起因是 Cursor 的 agents 窗口上的性能问题，不少做法是从那里带出来的。她定下的原则是：agent 喜欢走捷径。那就让捷径等于正路。这样的代码库对人类会很烦，能做和不能做都被收得很死。她认为这恰恰适合 agent，尤其是上下文很少的 agent。以后往仓库里交改动的不会只有工程师。设计、产品、CEO 这类很忙、上下文很少的人也会进来做功能。默认就能做对，比指望他们先读完风格指南更靠得住。

代码库是记忆，反过来说也成立。反模式会自己长。她要的状态是：锁到人类写起来难受，但约定强到连看起来无辜的模式也不会被留下。她举的例子是注释。一开始她觉得 agent 留注释不一定坏。人也会在边界情况和绕过办法旁边给同事留笔记。后来在 Cursor 的代码库里看到，agent 把注释当成不修真正问题的理由，用短期办法把 bug 糊过去。所以在给 Grok Bot 用的 Dune 里，他们禁止注释，避免这个写法被复制到整个仓库。注释从「给人看的说明」变成了「给下一个 agent 的错误范本」。

她给这个角色起名叫园丁。仓库会像花园一样长出你不想要的东西，要在它铺开之前掐掉。她说自己并不懂园艺，比喻就停在这里：得有人专门看，什么东西正在钻进代码库。Dune 背后她强调三件事。删掉已经有的技术债，因为 agent 会抄。大多数该被鼓励的模式只留一条铺好的路，agent 不必猜；代码库、CI 和 lint 里要有足够的引导，把它赶到这条路上。看到技术债或坏模式，本能是写 lint。先止血，再让 agent 把旧的清掉，让仓库保持在「被抄也没关系」的状态。

她没有把 Dune 的目录逐项讲完，只举了一条从 Cursor agent 窗口学来、又在架构里消掉的性能问题。[Electron](https://www.electronjs.org) 主进程上跑的东西，不允许跑到 renderer。窗口那边出现过代码被误导入 renderer，慢代码跟着进去。renderer 要维持界面流畅，不能扛超过帧预算的长任务：大约 16 毫秒对应每秒 60 帧，大约 8 毫秒对应每秒 120 帧。工作得拆开做，不能堆在同一段。Dune 用导入依赖图把这条边界定死，让这类误导入在类别上不可能。她说单条例子不重要，重要的是你自己的框架可以把资深工程师的经验从风格指南和 review 评论里抽出来，写进代码库。代码库就成了你希望 agent 去延伸的那份已经落盘的状态。下一次进来的 agent 更可能接着把这个状态保持住，而不是从一条过时的评论里学一个绕过。

Grok Bot 这边她把仓库锁到几乎写不出坏代码。上下文很少、推理也不强的 agent，进来仍可能写出过得去的代码。这是路被收窄了，不是对话开多了。

## 外环是接工具，不是做一个公司大脑

演讲后段，她把 Grok Bot 和 Cursor 分成不同的位置。Grok Bot 擅长她说的外环：接到各种连接器上，把信息收拢，用来做决定。她举例提到 Slack、Datadog、Sentry、PlanetScale，以及你正在用的那些服务。**这是举例，不是一份固定的集成清单。** 四个名字不要写成已经配齐的套餐，也不要补上她没说的工具。

有人把这种接法叫做公司大脑。她不接受一个花哨的版本。她觉得不必搞那么复杂，因为 agent 本来就擅长用工具。工具接到 Grok Bot 上，再让它自动踢起 cloud agent，并不需要先做一大套基础设施。她再次划掉「软件工厂」，改口说可以用 Grok Bot 给自己搭那间厨房。routine（按订阅或条件自动把任务踢起来）让你订 Slack 线程、订 Sentry 告警，并自动开工。公开说明在 [Grok Bot](https://x.ai/bot) 的[概述](https://docs.x.ai/grok-bot/overview)，以及 [skill、routine 和自动化](https://docs.x.ai/grok-bot/skills-routines-and-automations)。

这些和前面的层是叠加上去的，不是另起一套系统。代码库、规则、skill 先在，Grok Bot 才能对外环来的事件做反应，再踢 cloud agent。Cursor 这边还可以用 [automations](https://cursor.com/docs/cloud-agent/automations) 和 [TypeScript SDK](https://cursor.com/docs/sdk/typescript) 再搭 bot，复用已经铺好的 agent 基础设施，去做更复杂的任务。她给直播看了一些 Cursor 上的自动化截图：自动复现 bug 报告，自动开 pull request。她的说法是，这些东西叠起来，是在给整个团队增加能用的产出。这里没有独立的第三方产量数字。截图是她的演示，不是一份已审计的报表。

[Cloud Agents](https://cursor.com/docs/cloud-agent) 和 [agents 窗口](https://cursor.com/agents) 是公开产品入口。它们解决不了「还没有信任就并行」。外环若跑在还没锁住的仓库上，自动化会把垃圾 PR 放大。先有第一层到第三层，再谈订阅告警、自动开 PR。

PStack 是她放在引导层里的那类工程 playbook。演讲里她特意说今天不多讲这个插件。它是她做的 Cursor 插件，一组 skill，来自她自己做调试、做功能、做原型时的做法。公开页在 [Cursor 的插件市场](https://cursor.com/marketplace/cursor/pstack)，指南在[插件仓库里的说明](https://github.com/cursor/plugins/blob/main/pstack/docs/guide/README.md)。入口是 `/poteto-mode`。用法上先 `/setup-pstack` 选模型，再进入 `/poteto-mode`。她说这是她在 Cursor 每天用的 skill，目标是少写、写对，而不是堆行数。更有经验的工程师可以把这类 skill 收成团队仓库，让 agent 按你们要的方式写。验证 skill 加上这些工作流，agent 才不只是证明做对了，而是有机会碰到质量。性能数字仍然要靠那条可复现的采样链路去采，不是靠 playbook 的名字。

## 做 agent 的人可以拿走的顺序，以及她没说的话

纠错时往哪一层放，比上个月合了多少 PR 更值得先看。人还停在 1 到 5 个对话里时，先别把并行当成进度。同一种错如果只在聊天里改过，下一个会话还会再犯。人审里反复出现的同一类意见，说明它还没变成架构、lint 或规则。引导层默认会被漏掉，不能当唯一的闸。

她没有说的，要单独留在账上。验证 skill 只提供正确性的经验证据，不代替性能指标，也不代替 Lean 或 TLA+ 要证的不变量。她自己没走形式化。Control Glass 和 Dune 都没有公开页，本文不给它们补链接。Slack、Datadog、Sentry、PlanetScale 是举例，不是固定清单。她不主张先做一个花哨的公司大脑。帖子标题的 2,500 和口播的大约 2,000 出处不同。口播里她明确说，大约 2,000 个 PR 不是她设过的目标。一百个 cloud agent 是没有信任时的反例，不是推荐配置。外环只有在仓库已经值得被复制时，才是在加产出，否则是在把垃圾 PR 自动放大。

## 这套方法从哪段已核对的履历里长出来

公开材料能对上的路径是：前端和类型系统出身，在 Netflix 做过内容工作室的工具，在 Meta 做过 React 编译器，现在把「让 agent 自己验证」用在 Cursor 和 Grok Bot 上。地点是她自己标的南加州。近况看 [LinkedIn](https://www.linkedin.com/in/laurenelizabethtan)。旧站 [no.lol](https://www.no.lol) 还停在 Facebook 和前 Netflix 的介绍，已经过时，不要当现职来读。

她是自学转行。最早做 UI 设计，后来自己把设计做成能跑的界面。[about.me](https://about.me/lauren.tan) 写她有金融方面的学历，伦敦政经和莫纳什。那一页停在她还在 Meta 当工程经理的时候。

2014 到 2016 年的博客几乎都是 Ember.js，人在 DockYard。GitHub 从 2012 年就有。仓库里最有名的是 [hiring-without-whiteboards](https://github.com/poteto/hiring-without-whiteboards)。

Netflix 阶段她是工程经理，做 Studio UI，也就是从选题 pitch 到上线的内容制作工具。更早带过 Studio Programming，给原创内容排期。旧站上还留着三场演讲：2018 年 RubyConf 的 [Building the World's Largest Studio](https://www.no.lol/speaking/2018/rubyconf/)，2019 年 TSConf 的 [Just Use Any](https://www.no.lol/speaking/2019/tsconf/)，2019 年 Netflix UI 的 [Ambitious UIs for Pitch to Play](https://www.no.lol/speaking/2019/netflix/)。最后这场的技术栈是 React、TypeScript 和 GraphQL。这些页面说明她当时在做什么工具，不说明她现在的头衔。

Meta 大约六年，2026 年 3 月中离开。2026-04-07 的 LinkedIn 帖写的是离开大约三周。在 React 组织里，公开介绍覆盖这些工作：Server Components 的原型、Relay 的编译器和运行时、React 18、React Compiler、useEffectEvent、跨平台 React，后来也参与组织 AI 方面的策略。React Conf 2021 的介绍页写，当时她是 React 的工程经理，进管理之前在 Meta 带 Server Components 的原型。页面在 [这里](https://conf.reactjs.org/speakers/lauren)。

同一份 LinkedIn 自述里，她后来以个人贡献者重写 React Compiler：从按语句做分析，改成基于自定义控制流图（CFG）的表达式分析。她提到 SSA、hoisting、validation、eslint-plugin-react-compiler，以及实验性的 compiler LSP，并负责开源。**这段是她的自述。里面的加速数字没有经本文独立核实。** 她写 Instagram Web、Threads、Quest Store、Facebook.com 上线之后，交互快 2.5 倍，加载和导航快 12%，内存不增。React 的 CI 从 CircleCI 换到 GitHub Actions，她称更便宜，并且快了超过 50%。2.5 倍、12%、内存不增、超过 50%，都只出现在这份 LinkedIn 自述里，不是这场演讲的口播，也不是第三方测量。引用时必须带着「她自己这么写，未经独立核实」，不能写成已经证实的产品成绩。

2026 年 4 月她加入 Cursor。她的帖写，第二天就在修 Cursor 3 客户端的性能：教 agent 自己跑应用、做 profile、采 trace，再顺着指标处理内存泄漏和渲染。演讲里则是 agents 窗口上那段先手工、再收成验证 skill 的 Chrome 性能工作。两处都是她的叙述。本文不把它们收成同一次改动，也不补一个对得上的 PR 编号。5 月她开源了 PStack。她的帖称，那一周工程团队用这些 skill 大约 1 万次。1 万次同样是她的说法，不是独立统计。Cursor 并进 SpaceXAI 之后，她的头衔是 Grok Bot at SpaceXAI。现在的公开画像是：在 SpaceXAI 做 Grok Bot 和 Cursor，同时在 React Compiler 的核心团队。

和演讲对得上的是同一件事的两头：编译器和性能出身，到了 Cursor 把手工 trace、heap snapshot 收成验证 skill，再把不该被抄的模式收成仓库里的硬约束。帖子上的 2,500 和口播里的大约 2,000 都是走完这段之后写下来的数字，不是方法。她在结尾留的联系方式是 X 上的 poteto。
