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

Lauren Tan 在 X 和 GitHub 上都叫 poteto（[X](https://x.com/poteto)、[GitHub](https://github.com/poteto)）。2026-09-21 她发了[一条帖](https://x.com/poteto/status/2102050467505430555/)，标题大意是「上个月我把 2,500 个 PR 送进了生产环境」。帖里附的是一段约 38 分钟（2281 秒，视频 id `2101938030122868736`）的直播，内容原本准备在 Cursor Compile London 讲，后来改成了给 Grok @Bot Galaxy 的直播。

直播里她说的是上个月往生产环境合了大约 2,000 个 pull request（比帖子标题少 500）。不过数字不是重点。她的论点很窄：吞吐量来自信任，而不是来自多开几个 agent。这里的信任指的是人不在旁边时，agent 交出来的东西质量仍然够用。环境铺好以后产量自然会上去，看着像个人或团队的「软件工厂」，但她不喜欢这个词，宁可比作米其林厨房。厨房不是流水线，菜不是复制出来的，人仍然要对端出去的每道菜负责，要安排的是灶边站谁、用什么工具、怎么训练，以及打下手和掌勺的比例。

## 没有信任时，一百个 cloud agent 只是垃圾

故事从大约六个月前讲起。她刚加入 Cursor，公司那时还没并进 SpaceXAI；手上没有现成的 agent skill（写给 agent 的可复用做法），代码库和产品对她来说都是新的。Cursor 当时在做 IDE 的替代品，也就是新的 agents 窗口，而这个窗口在她来之前已经积了一堆性能问题。主管找她帮忙，是因为她在 React 团队待过。

性能她会做，挡不住的是合入速度。pull request 一堵墙似地涌进来，她根本判断不了应用是不是在变慢。早期的时间几乎都耗在 Chrome 开发者工具里，看性能面板、采 trace、做 heap snapshot，手工到她自己都烦了：既然已经有 agent，为什么还是人坐在这些面板前面？

这就是验证 skill 的起点。让 agent 自己把应用跑起来、采 trace、读懂 trace、找到热点，再把性能往上推。她说这六个月产出确实上去了，可「一个月大约 2,000 个 PR」从来不是她定的目标。回头看那些 skill、工具和代码库改动，它们都叠在同一件事上，就是信任。她当时的想法更直白：我是瓶颈，得把工程师脑子里的东西交给 agent，别让每件事都卡在我这里。

（按她公开的履历，她是 2026 年 4 月加入 Cursor 的。演讲里的「大约六个月」是口语上的估算；后文提到的「第二天就在修 Cursor 3」出自另一条帖，和这段 agents 窗口的经历不一定是同一件事。）

起步时她同时只敢盯 1 到 5 个对话。每个聊天都得看着、随时改方向，人一走开，要么什么都没发生，要么 agent 做错了。她觉得这一段最难熬，因为看不到出口；而出不去的原因，说到底是还不信任 agent 交出来的东西。这时候一口气开 100 个 sub-agent 或 cloud agent（放到云端跑的 agent），换来的只会是一堆垃圾 pull request、回归和 bug，谁都不会高兴。

所以该问的不是还能再开几个，而是怎样才敢不再盯着。

## 纠一次错，先问最强的那一层能不能接住

她把纠正 agent 的手段从强到弱排成五层，而这个顺序本身就是论点：越靠前的层，越不依赖 agent 或人在某次对话里记得去读某段提示。

道理在于模型会沿用上下文里已有的东西。agent 读过、打开过的文件都在上下文里，它不会在每个 PR 里顺手把旧代码重构掉，只会接着往下写。因此仓库里留下来的样子，比聊天里的一次纠正耐久得多。一次纠正如果只停在对话里，下一个会话根本看不到；如果变成「这种写法写不出来」或者「CI 会挂」，下一个会话想躲也躲不开。

**第一层是代码库和架构，让坏写法在类别上就写不出来。** 她把代码库看成 agent 的记忆，而现有的反模式同样会被记住：一个小小的绕过办法，或者一段解释这个绕过的注释，几天到几周就会被复制成事实上的标准写法。她拿病毒打比方，也拿花园里不该留的杂草打比方。意思是，仓库里每一处你都得愿意让下一个 agent 照抄。这一层包括数据结构和做法上的改动，与其每次口头纠正同一种错，不如让那种错根本写不出来。在她看来，如果团队真相信以后大多数代码由 agent 写，这才是最值得投入的工程，远比多写几条提示有用。

**第二层是静态分析，也就是 lint、编译器和 CI。** 这些都是能在仓库里强制执行的约束。agent 反复犯同一种错，就加一条 lint；当然更好的是退回第一层，让这种错写不出来。她看到技术债或坏模式时的第一反应就是写 lint，不急着马上清干净，先止血、让它别再扩散，然后再花时间让 agent 去清。她没有点名用哪家的 linter 或 CI。

**第三层是规则、Bugbot 和 skill，**到这里已经从硬约束变成了引导。（[Bugbot](https://cursor.com/bugbot) 的文档在[这里](https://cursor.com/docs/bugbot)。）规则和 skill 多数时候会被用上，但 agent 可能忘了读，开着 agent 的人也可能不理会。这一层很重要，却不能当成已经强制了，因为漏读一次，约束就等于不存在。

**第四层是风格指南和人工 review。** 风格指南如果没写进规则、Bugbot 或 skill，就只在人审代码时起作用，而这要求人看每一行、记得留言，PR 速度一上来根本做不到。她不建议只靠风格指南。人审更适合用来发现缺了什么，然后把时间投到前面几层去，而不是靠加人审来扩容。review 里如果总在留同一类意见，说明那条规矩还停在第四层，没被收进架构、lint 或规则。

**第五层是验证 skill，它能证明功能做对了，但证明不了快不快、写得好不好。** 她说的正确性，是指这个功能或这段代码有没有做成你要它做的事。验证 skill 能拿出经验证据，比如某条路径真的走通了；性能得另外采指标和遥测，代码质量则要靠另一类 skill，教 agent 按工程师的方式做事，而不只是证明「跑通了」。

光谱的另一端是形式化方法。[Lean](https://lean-lang.org) 和 [TLA+](https://lamport.azurewebsites.net/tla/tla.html) 可以检查业务不变量是否恒成立、应用是否处在可证明的状态。她自己没走这条路：形式化仍然难，仍是开放问题，真正把它和验证 skill 一起用的人很少。她的判断是，没有形式化，验证 skill 也能走很远。这句话划的是边界，并不是说形式化没用，她也没说验证 skill 能覆盖形式化要证的那类不变量。

收尾时她请听众记住这个顺序。发现自己在追着 agent 改的时候，挑最有效的那一步：先让这种模式在代码库、架构或数据结构上不可能出现；做不到就上静态分析；再往上叠规则、Bugbot 和 skill；质量方面的 skill 要另外花时间做。这些层叠够了，信任才足以让 agent 自己往前走。她强调这不是什么窍门，而是大量的工作。人审和风格指南负责发现缺口，验证 skill 负责拿正确性的证据，两者都替代不了第一层。

我同意这个排序，而且觉得它最有用的地方在于给了一个很具体的判断问题：这次纠正，能不能往上挪一层？

## Control Glass 只是内部的验证 skill

她加入 Cursor 后为 agents 窗口性能做的第一个 skill 叫 Control Glass，是个验证 skill，目前没有公开页面或文档。

它教 agent 通过 [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/) 把应用跑起来并采 trace。她说现在的结构是迭代出来的，一开始并不是这样，最后定型成两块。

第一块是放在 skill 目录里的一个可复现 CLI，而不是让 agent 每次现写脚本。脚本每个会话都会漂一点，同一条性能基线就会量出不一样的结果。固定的 CLI 负责跑应用、收集 trace 和 heap snapshot，并给出「代码在工作、性能达标没有」的经验证据。这块需要持续投入才能覆盖各种用法，演示一次就停是不够的。

第二块她叫 feature map，可以理解成写进仓库的功能地图。名字是她自己起的，灵感接近网站地图，本质上是落了盘的记忆：应用怎么工作、有哪些功能、用户从哪里进去、快捷键是什么、要点哪些 DOM 元素、每个功能做什么。feature map 也放在 skill 目录里，按她的说法由一套自动化在维护。

只有其中一块都不够用。内部 Slack 里常有很模糊的报告，一小块界面截图加三个问号；agent 能把应用跑起来，却只能猜用户指的是哪里。CLI 和 feature map 合在一起，agent 才能稳定地操控应用、采 trace，并读懂内外部用户的请求。团队很快就把这类操控应用的验证 skill 当成关键基础设施来维护。agent 能核对自己的工作，是信任里很实在的一块，他们在这上面花了很多时间。

Control Glass 回答的是「做成了没有」，以及性能数据能不能用同一种方法稳定采到。能采到 trace 不等于代码质量过关，更不等于做了形式化证明。想做同类东西，就得自己准备一个可复现的 CLI，再把功能的入口写进 skill 目录。

## Dune 把捷径收成唯一的正路

在 Grok Bot 的代码库里，他们做了一套叫 Dune 的客户端框架（同样没有公开页面），目标是让 agent 写起来不容易走歪。

直接起因是 Cursor agents 窗口上的性能问题，不少做法就是从那里带过来的。她的原则是：agent 爱走捷径，那就让捷径等于正路。这样的代码库对人来说很烦，能做什么、不能做什么都被卡得很死，但她认为这恰好适合 agent，尤其是上下文很少的 agent。以后往仓库里交改动的不会只有工程师，设计、产品、CEO 这些很忙、上下文很少的人也会进来做功能，与其指望他们先读完风格指南，不如让默认写法就是对的。

「代码库是记忆」反过来也成立：反模式会自己长。她要的状态是锁到人写起来难受，但约定强到连看起来无害的模式也留不下来。她举的例子是注释。起初她觉得 agent 留注释未必是坏事，人也会在边界情况和绕过办法旁边给同事留笔记。后来在 Cursor 的代码库里她发现，agent 会把注释当成不修真问题的理由，用短期办法把 bug 糊过去。所以在 Grok Bot 用的 Dune 里，注释被直接禁掉了，免得这种写法被复制到整个仓库。对 agent 来说，注释已经不是给人看的说明，而是给下一个 agent 的错误范本。

她给这个角色起名叫园丁：仓库会像花园一样长出你不想要的东西，得有人专门盯着，在它铺开之前掐掉（她自己笑说并不懂园艺）。Dune 背后她强调三件事。一是删掉现有的技术债，因为 agent 会照抄。二是对大多数该鼓励的模式只留一条铺好的路，agent 不用猜，代码库、CI 和 lint 里也要有足够的引导把它赶到这条路上。三是看到技术债或坏模式就先写 lint，先止血，再让 agent 把旧的清掉，让仓库始终处在「被抄也没关系」的状态。

Dune 的细节她没有逐项讲，只举了一条从 Cursor agents 窗口学来、在架构里直接消掉的性能问题。[Electron](https://www.electronjs.org) 主进程上跑的东西，不允许跑进 renderer。agents 窗口那边出现过代码被误导入 renderer、慢代码跟着进去的情况。renderer 要保证界面流畅，扛不住超过帧预算的长任务：60 帧每秒大约是 16 毫秒一帧，120 帧每秒大约是 8 毫秒，工作必须拆开做。Dune 用导入依赖图把这条边界定死，误导入从此写不出来。她说这一条例子本身不重要，重要的是自己的框架可以把资深工程师的经验从风格指南和 review 评论里抽出来，直接写进代码库。这样代码库就是你希望 agent 延续的那个状态，下一个进来的 agent 更可能把它保持住，而不是从一条过时的注释里学会一个绕过办法。

在 Grok Bot 这边，她把仓库锁到几乎写不出坏代码，上下文很少、推理也不强的 agent 进来也能写出过得去的代码。产量是靠把路收窄换来的，不是靠多开对话。

## 外环是接工具，不是做一个公司大脑

演讲后半段，她把 Grok Bot 和 Cursor 放在不同的位置。Grok Bot 擅长她说的外环：接上各种连接器，把信息收拢起来用于决策。她随口举了 Slack、Datadog、Sentry、PlanetScale，以及「你正在用的那些服务」，这只是举例，不是一份固定的集成清单。

有人把这种接法叫公司大脑，她不买账，至少不买那个花哨的版本。agent 本来就擅长用工具，把工具接到 Grok Bot 上、让它自动拉起 cloud agent，并不需要先搭一大套基础设施。她再次划掉「软件工厂」，改口说可以用 Grok Bot 给自己搭那间厨房。routine（按订阅或条件自动触发任务）可以订阅 Slack 线程、Sentry 告警，然后自动开工。公开说明见 [Grok Bot](https://x.ai/bot) 的[概述](https://docs.x.ai/grok-bot/overview)，以及 [skill、routine 和自动化](https://docs.x.ai/grok-bot/skills-routines-and-automations)。

这些是叠在前面那几层之上的，不是另起炉灶。先有代码库、规则和 skill，Grok Bot 才能对外环进来的事件做出反应、再拉起 cloud agent。Cursor 这边还可以用 [automations](https://cursor.com/docs/cloud-agent/automations) 和 [TypeScript SDK](https://cursor.com/docs/sdk/typescript) 再搭 bot，复用已经铺好的 agent 基础设施去做更复杂的任务。她在直播里展示了几张 Cursor 自动化的截图，包括自动复现 bug 报告、自动开 pull request，说这些叠起来是在给整个团队加产出。这些截图是她自己的演示，没有第三方的产量数字可以对照。

[Cloud Agents](https://cursor.com/docs/cloud-agent) 和 [agents 窗口](https://cursor.com/agents) 是公开的产品入口，但它们解决不了「还没信任就并行」的问题。外环如果跑在一个还没锁住的仓库上，自动化只会把垃圾 PR 放大。先把第一到第三层做好，再谈订阅告警和自动开 PR。

PStack 属于她放在引导层里的那类工程 playbook，演讲里她特意说今天不展开。它是她做的 Cursor 插件，一组 skill，来自她自己调试、做功能、做原型时的习惯。公开页在 [Cursor 插件市场](https://cursor.com/marketplace/cursor/pstack)，使用指南在[插件仓库的说明](https://github.com/cursor/plugins/blob/main/pstack/docs/guide/README.md)。用法是先 `/setup-pstack` 选模型，再进入 `/poteto-mode`。她说这是她在 Cursor 每天都用的 skill，目标是少写、写对，而不是堆行数；更有经验的工程师可以把这类 skill 收成团队自己的仓库，让 agent 按团队要的方式写。验证 skill 加上这类工作流，agent 才不只是证明做对了，而是有机会碰到质量。至于性能数字，还是得靠那条可复现的采样链路去采。

## 做 agent 的人可以拿走的顺序，以及她没说的话

我觉得这场演讲最值得带走的，是「纠错时往哪一层放」，而不是上个月合了多少 PR。如果你还停在同时盯 1 到 5 个对话的阶段，先别把并行当成进度。同一种错只在聊天里改过，下一个会话还会再犯；review 里反复出现的同一类意见，说明它还没变成架构、lint 或规则；引导层默认会被漏掉，不能当唯一的闸门。

她也有几件事没说，读的时候别替她补上。验证 skill 只提供正确性的经验证据，替代不了性能指标，也替代不了 Lean 或 TLA+ 要证的不变量，而她自己没走形式化这条路。她不主张先造一个花哨的公司大脑。一百个 cloud agent 是没有信任时的反例，不是推荐配置；外环只有在仓库已经值得被复制时才是在加产出，否则就是把垃圾 PR 自动放大。至于那个大约 2,000 的数字，她在直播里明确说过，从来不是目标。

## 这套方法从哪段已核对的履历里长出来

能和公开材料对上的路径是：前端和类型系统出身，在 Netflix 做内容工作室的工具，在 Meta 做 React 编译器，现在把「让 agent 自己验证」用在 Cursor 和 Grok Bot 上。她自己标的地点是南加州，近况看 [LinkedIn](https://www.linkedin.com/in/laurenelizabethtan)。旧站 [no.lol](https://www.no.lol) 还停在 Facebook 和前 Netflix 时期的介绍，已经过时了。

她是自学转行的，最早做 UI 设计，后来干脆自己把设计做成能跑的界面。[about.me](https://about.me/lauren.tan) 上写她有金融方面的学历（伦敦政经和莫纳什），那一页停在她还在 Meta 当工程经理的时候。

2014 到 2016 年，她的博客几乎全是 Ember.js，那时人在 DockYard。GitHub 账号从 2012 年就有了，最有名的仓库是 [hiring-without-whiteboards](https://github.com/poteto/hiring-without-whiteboards)。

在 Netflix 她是工程经理，做 Studio UI，也就是从选题 pitch 到上线的内容制作工具；更早还带过 Studio Programming，给原创内容排期。旧站上留着三场演讲：2018 年 RubyConf 的 [Building the World's Largest Studio](https://www.no.lol/speaking/2018/rubyconf/)、2019 年 TSConf 的 [Just Use Any](https://www.no.lol/speaking/2019/tsconf/)，以及 2019 年 Netflix UI 的 [Ambitious UIs for Pitch to Play](https://www.no.lol/speaking/2019/netflix/)，最后这场用的是 React、TypeScript 和 GraphQL。

她在 Meta 待了大约六年，2026 年 3 月中离开（2026-04-07 的 LinkedIn 帖里说已经离开大约三周）。在 React 组织里，公开介绍提到的工作包括 Server Components 原型、Relay 的编译器和运行时、React 18、React Compiler、useEffectEvent、跨平台 React，后来也参与了 AI 方面的组织策略。[React Conf 2021 的讲者介绍](https://conf.reactjs.org/speakers/lauren)写的是，她当时是 React 的工程经理，转管理之前在 Meta 带 Server Components 的原型。

同一份 LinkedIn 自述里，她说后来以个人贡献者身份重写了 React Compiler，把按语句做的分析改成基于自定义控制流图（CFG）的表达式分析，涉及 SSA、hoisting、validation、eslint-plugin-react-compiler 和实验性的 compiler LSP，并负责开源。她写到，编译器在 Instagram Web、Threads、Quest Store 和 Facebook.com 上线后，交互快了 2.5 倍，加载和导航快了 12%，内存没有增加；React 的 CI 从 CircleCI 换到 GitHub Actions 后更便宜，也快了 50% 以上。这些数字都出自她的自述，我没有找到独立的测量可以核对。

2026 年 4 月她加入 Cursor。按她的帖子，入职第二天就在修 Cursor 3 客户端的性能：教 agent 自己跑应用、做 profile、采 trace，再顺着指标处理内存泄漏和渲染问题。这和演讲里 agents 窗口那段先手工、后收成验证 skill 的经历很像，但两处都是她的叙述，未必是同一次改动。5 月她开源了 PStack，据她说那一周工程团队用了这些 skill 大约 1 万次。Cursor 并进 SpaceXAI 之后，她的头衔是 Grok Bot at SpaceXAI，现在在 SpaceXAI 做 Grok Bot 和 Cursor，同时也在 React Compiler 的核心团队。

和演讲对得上的，是同一件事的两头：编译器和性能出身，到了 Cursor 先把手工的 trace 和 heap snapshot 收成验证 skill，再把不该被抄的模式收成仓库里的硬约束。2,500 也好，大约 2,000 也好，都是走完这段之后的结果，不是方法本身。想找她，X 上搜 poteto 就行。
