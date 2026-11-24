---
title: "pstack 0.15.48 实测 /reframe：说不清要做什么时，先学会这一行怎么叫它"
description: "pstack 0.15.43 到 0.15.48 的实质变化有两件：新增手动触发的 /reframe，以及评审面板的 Gemini 座位换成 gemini-4-neon-xhigh。本文把 0.15.48 装进 Claude Code，用同一份 SKILL.md 对模糊、清楚、精确三种描述各跑一次 /reframe，再用一份旧规则文件跑一次 /setup-pstack 的 Gemini 迁移，并跑仓库自带的检查和测试。"
author: Remy
pubDate: 2026-11-24T09:30:00+08:00
lang: zh
tags:
  - ai-agents
  - agent-harness
  - ai-coding
  - claude-code
  - software-engineering
series: pstack
---

**结论先说：** pstack 从 0.15.43 到 0.15.48 的五个版本里，值得你动手的只有两件事。一是新 skill `/reframe`：你知道自己想要什么、却说不出这一行管它叫什么的时候，它教你 8 到 12 个专业术语，从相邻领域借词，再用这些词重写你的描述；0.15.48 又让它在描述含糊时先列出两三个「它可能是的问题」。[1][2] 二是评审和设计面板里的 Gemini 座位从 `gemini-4-carbon-high` 换成了 `gemini-4-neon-xhigh`，存过规则文件的人要自己重跑一次 `/setup-pstack`，因为没有任何东西会提醒你。[4][5]

| 你现在的情况 | 该做什么 |
| --- | --- |
| 用 Cursor 或 Grok Bot | 插件自动更新，作者原话是 "it's autoupdated"。[11] 确认版本是 0.15.48 即可。 |
| 用 Claude Code | 第三方 marketplace 不会自动更新。先跑 `claude plugin marketplace update cursor-plugins`，再跑 `claude plugin update pstack@cursor-plugins`，然后重启。命令名是 `/pstack:reframe`。 |
| 想让 agent 做一件事，但说不清它是什么 | 在项目目录里跑 `/reframe <你自己的话>`，让它读你的文件。拿到重写后的描述，可以再跑 `/sharpen`，然后交给 `/poteto-mode`。[9] |
| 已经知道术语，只想把 prompt 写得更深 | 直接用 `/sharpen`，不需要 `/reframe`。 |
| 规则文件的面板角色里有 `gemini-4-carbon-high` 或 `gemini-4-neon-high` | 重跑 `/setup-pstack`，它会换成 `gemini-4-neon-xhigh`。`# defaults: 3` 这一行没变，`/poteto-mode` 不会催你重跑。 |
| 你在面板里手选过 `gemini-4-neon-medium` 这类低档 | 重跑时按 `large` 预算会被抬回 `xhigh`。想留住低档，就选 `medium` 或 `small` 预算，或者在确认那一步改回来。 |
| 在 Claude Code 里用面板 | Gemini 座位映射成 `inherit-parent`，这次迁移对你没有影响。[8] |
| 在原生 Windows 上用 `/statechart` | 用 `node --disable-warning=ExperimentalWarning <skill dir>/scripts/statechart.ts`，Node 22.18 到 22.x，或 23.6 以上。[6] |

这是 pstack 系列的第二篇。上一篇 [Claude Code 装 pstack 0.15.43 实测](/cn/blog/pstack-0-15-43-hands-on/) 讲的是路由封顶和 Orchestrate 的去向，站内的 [pstack skills 使用指南](/cn/garden/notes/pstack-skills-guide/) 是按 0.15.32 写的总览。下面只讲 0.15.43 之后的变化。

## 五个版本，两件正事

先把五次合并摆在一起。时间都换算成了上海时间。

| 版本 | 合并时间 | PR | 改了什么 |
| --- | --- | --- | --- |
| 0.15.44 | 11-19 14:26 | #1283 | 面板里的 Gemini 座位从 Carbon 换成 `gemini-4-neon-high`，`setup-pstack` 学会迁移旧的 `gemini-4-*` 条目。[4] |
| 0.15.45 | 11-20 05:53 | #1284 | 座位升到 `gemini-4-neon-xhigh`，旧的 `high` 默认值也一并迁到 `xhigh`。[5] |
| 0.15.46 | 11-20 06:12 | #1292 | `/statechart` 能在原生 Windows 上跑了，顺带修掉 TLC 输出 `\r\n` 行尾时报错报不对的 bug。[6] |
| 0.15.47 | 11-24 06:32 | #1324 | 新增 `/reframe`。[1] |
| 0.15.48 | 11-24 08:41 | #1326 | `/reframe` 遇到含糊的描述，先列出它可能是的两三个问题。[2] |

Gemini 换座位是维护性质的改动，`/statechart` 的修复只影响 Windows 用户。真正改变你怎么用 pstack 的，是最后两个版本加起来的 `/reframe`。所以这篇大部分篇幅给它。

## /reframe 解决的是「词汇缺口」

pstack 里已经有 `/sharpen`。它问的是「这一行的顶尖从业者会多做什么」，然后把你的 prompt 改得更深。`/sharpen` 有一个前提：你得先能把要做的东西说出来。很多时候卡住你的恰恰是这一步。你看得见症状，比如「设置页有些字段立刻保存，有些要点提交，用户会丢修改」，但你不知道这在行话里叫「保存模型不统一」，也不知道相关的还有「dirty state」「lost update」。词不对，agent 就只能按字面理解你的话，做出来的东西也就停在字面上。

`/reframe` 补的就是这个缺口。它的 `SKILL.md` 只有 202 个英文词，比 `/sharpen` 的 124 词稍长，结构很直接：[3]

1. 从你的文件、代码和你自己的描述出发，不从摘要出发。
2. 如果描述可能指向不止一个问题，先列出两三个候选，每个配一个命名它的术语和一个能把它和其他候选区分开的信号，再挑最可能的一个，说明理由。这一段是 0.15.48 加的。
3. 给 8 到 12 个术语，按「会在多大程度上改变你要造的东西」排序。每个术语要有一句白话解释、对应你描述里的哪一部分、一个这样用它的真实项目或论文（带链接），以及它能让你向 agent 提出什么要求。
4. 找 2 到 3 个用别的名字解决过同一类问题的相邻领域，说清哪些能搬过来、类比在哪里失效、能带回哪些词。
5. 指出你没提、但应该关心的事。
6. 用新词重写你的描述。

最后还有一条硬约束：每个链接都要打开，确认它真的这样用这个词，确认不了的引用就删掉。

<figure class="not-prose my-6"><svg viewBox="0 0 640 556" role="img" aria-label="/reframe 0.15.48 的流程：模糊描述先列候选问题，再教术语、借相邻领域的词、重写描述" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:640px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor" fill-opacity="0.6"/></marker></defs><rect x="150" y="16" width="340" height="40" rx="8" fill="#2563eb" fill-opacity="0.1"/><text x="320" y="41" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">输入：你的描述 + 你仓库里的文件</text><polyline points="320,56 320,80" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah)"/><rect x="110" y="80" width="420" height="48" rx="8" fill="#d97706" fill-opacity="0.12" stroke="#d97706" stroke-width="1.5"/><text x="320" y="109" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">这段描述能指向不止一个问题吗？</text><text x="536" y="76" font-size="11" text-anchor="start" font-weight="bold" fill="#d97706" fill-opacity="1">0.15.48 新增</text><polyline points="180,128 180,150" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah)"/><text x="188" y="143" font-size="12" text-anchor="start" font-weight="bold" fill="#d97706" fill-opacity="1">是</text><rect x="20" y="150" width="290" height="56" rx="8" fill="#d97706" fill-opacity="0.08" stroke="#d97706" stroke-width="1.5"/><text x="165" y="173" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">列出 2–3 个它可能是的问题</text><text x="165" y="194" font-size="12" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">每个：1 个术语 + 1 个区分信号</text><polyline points="165,206 165,226" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah)"/><rect x="20" y="226" width="290" height="40" rx="8" fill="#d97706" fill-opacity="0.08" stroke="#d97706" stroke-width="1.5"/><text x="165" y="251" font-size="13" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">选最可能的那个，并说明理由</text><polyline points="165,266 165,300" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah)"/><polyline points="530,104 606,104 606,300" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah)"/><text x="548" y="98" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.7">否</text><rect x="330" y="150" width="256" height="56" rx="8" fill="#6b7280" fill-opacity="0.06" stroke="#6b7280" stroke-width="1.5" stroke-dasharray="5 4"/><text x="458" y="173" font-size="12" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">每个链接都要打开，确认它</text><text x="458" y="192" font-size="12" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">真这样用这个词；确认不了就删</text><polyline points="458,206 458,300" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" stroke-dasharray="4 4" marker-end="url(#ah)"/><text x="466" y="262" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.7">约束 ①</text><rect x="20" y="300" width="600" height="178" rx="8" fill="#2563eb" fill-opacity="0.07" stroke="#2563eb" stroke-width="1.5"/><text x="36" y="326" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">① 8–12 个术语，按「会改变你造什么」排序</text><text x="52" y="346" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.8">每个：一句话含义 · 对应你哪句话 · 一个真实项目或论文的链接 · 能向 agent 要什么</text><text x="36" y="376" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">② 2–3 个相邻领域</text><text x="52" y="396" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.8">能搬过来什么 · 类比在哪里断 · 带回哪些词</text><text x="36" y="426" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">③ 你没提、但该关心的事</text><text x="36" y="458" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">④ 用这些新词重写你的描述</text><polyline points="320,478 320,500" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah)"/><rect x="70" y="500" width="500" height="40" rx="8" fill="#2563eb" fill-opacity="0.12"/><text x="320" y="525" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">输出：重写后的描述 → 可再跑 /sharpen → 交给 /poteto-mode</text></svg></figure>

*图：0.15.48 的 `/reframe` 流程。黄色部分是 0.15.48 新增的步骤，虚线框是贯穿第 ① 步的引用核对。内容来自 `reframe/SKILL.md`。[3]*

这个 skill 的提交记录也说明了它的定位。它最早叫 `name-it`，后来改名 `reframe`，并且「像 sharpen 那样写成 meta-prompt」。[1] PR 里的解释是：`sharpen` 和 `reframe` 都是作用在 prompt 上的动词，`reframe` 指的是「透过专家和相邻领域的词去看这个任务」。它和 `sharpen` 一样带 `disable-model-invocation: true`，只有你亲手输入时才会运行，`/poteto-mode` 不会自动调它。

0.15.48 加的那一段看起来不起眼，作用却很实在。PR 的理由是：描述含糊时，先列出可能的问题，就不会为错的问题教一整套词。[2] 这和医生的鉴别诊断是一回事。先说「这可能是 A、B 或 C，分别看什么信号」，再按最可能的那个往下查。

## 测试环境

测试机上有 Claude Code 2.1.278，沿用上一篇那个装着 0.15.43 的独立配置目录。升级只需要两条命令：

![Claude Code 把 pstack 从 0.15.43 升到 0.15.48：先更新 marketplace，再更新插件；常驻 token 估算从 3514 涨到 3563，reframe 按需约 270 token](/assets/pstack-0-15-48-reframe-hands-on/claude-code-update.webp)

*图：在 Claude Code 里从 0.15.43 升级到 0.15.48，以及 `claude plugin details` 给出的 token 估算对比。*

skill 从 58 个变成 59 个，多出来的就是 `reframe`。代价很小：每个会话的常驻成本从约 3,514 涨到约 3,563 token，差不多就是 `reframe` 那一行 description 的分量；调用一次的成本约 270 token。`setup-pstack` 因为多了 Gemini 迁移规则，按需成本从约 2,000 涨到约 2,200。

这台机器的 Claude Code 没有登录，`claude -p '/pstack:reframe ...'` 只会返回 `Not logged in · Please run /login`。所以真正跑 skill 用的是 OpenCode 2.3.2 和它的免费模型 `opencode/deepseek-v4.1-flash-free`。OpenCode 的 `skills` 配置可以指向任意目录，[16] 我把它直接指向 Claude Code 插件缓存里 0.15.48 的 `skills/reframe` 和 `skills/setup-pstack`。模型读到的就是你装到的那份文件，一个字都没改。

要记住一点：这是一个免费的小模型，不是 pstack 默认路由里的 Opus 5.5。下面的输出说明这份 skill 文本能驱动一个普通模型做到什么程度。换成更强的模型，结果只会更好，不会更差。

## 三种描述，三次真跑

我准备了三个小项目，每个只有几个文件，然后各用一句话描述问题。三句话由含糊到精确排开。

### 含糊的：「我的 bot 有时重复干活，有时又漏掉」

第一个项目是三个靠 cron 定时跑的 Python 脚本，用一堆 JSON 文件当台账：`trends.py` 给候选词查热度，`writer.py` 把入选的行写成草稿。我输入的是：

```text
@reframe my bots sometimes do the same work twice and sometimes skip it. I want them to be more reliable.
```

![对含糊描述跑 /reframe：先读 crontab 和两个脚本，打开 12 个网页核对引用，然后列出三种可能的问题并选了第一种](/assets/pstack-0-15-48-reframe-hands-on/reframe-vague.webp)

*图：含糊描述这次的运行记录节选，中间的术语列表、相邻领域和风险清单省略了。*

0.15.48 新加的那一步在这里表现得最好。它先读完 `crontab.txt`、`writer.py` 和 `trends.py`，然后说这句话可能指三种问题：

1. 崩溃后不一致、不幂等的任务处理。术语是「at-least-once 执行下的幂等」。区分信号是：cron 准时触发了，重跑或者中途崩溃还是会再生成一遍同样的草稿。
2. 并发执行时没有互斥。术语是 lease 或分布式锁。区分信号是：同一时刻有两个进程活着，或者一次长时间运行压到了下一次调度。
3. 调度本身不可靠。术语是 dead man's switch（预期的心跳没来就报警）。区分信号是：预定时间根本没有日志和心跳。

它选了第一种，把第二种当成放大器，理由全部来自代码。`writer.py` 先检查 `status == "shortlisted"`，写完草稿再改状态，中间崩溃就会重复干活。`trends.py` 碰到 429 就 `time.sleep(60); continue`，那一行这一轮直接被跳过，限流的行一多，整次运行还会压到下一次 cron。两个脚本都用 `json.dump(row, open(path, "w"))`，这会先把文件清空，写到一半崩溃就会留下一个坏 JSON，下一次 `json.load` 抛异常，后面所有行都被漏掉。「重复」和「漏掉」两个症状都在这里，跟 cron 准不准没关系。

后面 12 个术语的排序也说得通：idempotency key 排第一，接着是原子认领（compare-and-swap）、lease 加 fencing token、idempotent consumer，最后才是 dead man's switch。三个相邻领域是数据库事务、消息中间件、流处理和工作流编排。每个都讲了类比在哪里失效。比如它说，一台机器上不存在网络分区，用不着 Raft 或 Redlock；但进程暂停和 cron 重叠是真的，所以只有 lease、没有 fencing token 仍然不安全。

最有价值的是「你没提但该关心的」那一节。它发现 `crontab.txt` 里引用了 `bots/digest.py`，但仓库里根本没有这个文件。这一条是我做测试项目时漏掉的，它算一条真问题。重写后的描述把这件事说成了一份可以交给 agent 的需求：至少一次投递加幂等处理、带 fencing token 的 lease、死信、巡检循环、防重叠和原子提交，最后还补了一句：「按你的规模，用不着 Kafka 或 Temporal，一张 SQLite 表加 `flock` 和一个巡检脚本就能实现大部分。」

### 清楚的：设置页一部分字段立刻保存

第二个项目就是 pstack 指南第 2 章里那个例子：设置页的开关调 `patchUser` 立刻保存，文本框要点 Save 才调 `saveProfile`。[9]

```text
@reframe the settings page saves some fields right away and others only on submit, and people lose edits.
```

![对设置页描述跑 /reframe：读完两个源文件后仍列出三种可能，最可能的是保存模型不统一，最后用 save model、unit of work、single source of truth 等词重写描述](/assets/pstack-0-15-48-reframe-hands-on/reframe-settings.webp)

*图：设置页描述这次的运行记录节选。*

我本来以为这句话够清楚，不会触发新步骤。结果它还是列了三种：保存模型不统一、lost update、状态归属混乱（form 只在挂载时从 props 取一次值）。它选了第一种，但同时指出第三种已经实实在在写在代码里了：开关读的是 `user.emailDigest` 这个 prop，`patchUser` 返回完整的 user 却被直接丢掉。所以就算你把保存方式统一了，修改照样会丢。它还发现两个函数都没检查 `res.ok`，而 `fetch` 碰到 4xx 和 5xx 不会抛异常，保存失败看起来也像成功。

12 个术语里有 save model、unit of work、dirty state、optimistic update、If-Match、debounce、navigation guard。每个都附了 VS Code、React、React Router、MDN、Stripe 这类来源。如果你是那个说「用户会丢修改」的人，拿到这份重写，基本就能直接决定要哪种保存模型了。

### 精确的：wiki 页面后保存的人覆盖了前一个人

第三句话我故意写得很精确，症状就是教科书上的 lost update：

```text
@reframe when two people open the same wiki page and both save, the second save silently overwrites the first person's changes. Nobody sees an error.
```

![对精确描述跑 /reframe：第一句就点名 lost update，但仍列出三种读法：lost update、有检测但没显示的编辑冲突、本该合并的并发修改](/assets/pstack-0-15-48-reframe-hands-on/reframe-precise.webp)

*图：精确描述这次的运行记录节选。*

第一句话它就说「这是 lost update」，但还是列了三种读法：没有并发控制；有冲突检测，但 UI 吞掉了错误；两个人改的是不同段落，本来应该合并。后两种不是凑数。第二种决定你要不要先查日志里有没有 409，第三种其实是个产品决策：拒绝后保存的人，还是把两份修改合起来。它选第一种，理由是 `save_page.py` 里 `pages.get`、改 `body`、`pages.put` 之间没有任何版本检查。

### 三次放在一起看

| | 含糊（bot） | 清楚（设置页） | 精确（wiki） |
| --- | --- | --- | --- |
| 先列候选问题 | 3 个 | 3 个 | 3 个 |
| 术语 | 12 | 12 | 12 |
| 相邻领域 | 3 | 3 | 3 |
| 最终引用的链接 | 12 | 13 | 12 |
| 运行中实际打开的网址 | 23 | 20 | 35 |
| 耗时 | 约 3.5 分钟 | 约 3 分钟 | 约 5 分钟 |

两点值得说。

第一，候选问题那一步三次全部触发了，包括那句精确的描述。规则写的是「如果描述可能指向不止一个问题」，而几乎任何一句话都「可能」指向不止一个问题。我不觉得这是坏事。它只多出一百来个词，列出的另外两种读法往往正好是你还没想过的产品问题。如果你确实已经知道这事叫什么，那你需要的是 `/sharpen`，不是 `/reframe`。

第二，「每个链接都要打开」这条约束被认真执行了。三次的最终答案一共引用 37 个链接，去重后 35 个，每一个都在运行过程中被打开过，现在逐个请求也全部返回 200。模型打开的网址比最终引用的多得多，精确那次打开了 35 个，最后只留下 12 个。比如它先打开了 7 个维基百科页面，最后一个都没引用。PR #1324 里作者自己的测试是 42 个引用全部确认、没有编造。[1] 这次的结果和它一致。

## 遇到的问题

**Claude Code 没登录就跑不了 skill。** `claude plugin` 的安装、更新、查看都不需要登录，但只要真正开会话，就会停在 `Not logged in`。如果你只想看 skill 文本，`claude plugin details` 和插件缓存目录就够了。

**非交互运行时，结尾的退出码是 1。** 三次 `/reframe` 的最后一行都是 `Error: Cancelled a request for input this run cannot answer: Web Search`。原因是模型想调网页搜索，而 `opencode run` 没法在非交互模式下回答这类权限请求。它随后改用 WebFetch 和自己写的抓取脚本完成了核对，答案是完整的。如果你在脚本或 CI 里批量跑 `/reframe`，别拿退出码判断成败，要看输出本身。

**仓库检查要先装依赖。** 不装依赖的话，`validate-plugins.mjs` 会报找不到 `ajv`，`differential.test.ts` 会报找不到 `fast-check`。CI 用的是 `npm install --no-save ajv ajv-formats fast-check@4.5.3`。[17] 在没有 `package.json` 的目录里，这条命令报了 `Tracker "idealTree" already exists`；放一个只有 `{"private":true}` 的临时 `package.json` 之后就能装上。

## Gemini 座位：从 Carbon 到 Neon xhigh

这次面板改动分了两步。0.15.44 先把座位从 `gemini-4-carbon-high` 换成 `gemini-4-neon-high`。0.15.45 又升到 `gemini-4-neon-xhigh`。升档的理由写在 PR #1284 里：作者对两个档位做了盲测，两者都抓到了全部预先埋下的缺陷，`xhigh` 还多找出一些没人埋过的真问题，代价是每次多花大约 50% 的时间。PR 的原话是「面板正是 pstack 为深度付费的地方」。[5]

对老用户来说，麻烦在于迁移不会自己发生。PR #1283 写得很清楚：`# defaults: 3` 这个标记没改，所以 `/poteto-mode` 不会因为这次改动提醒你重跑 `/setup-pstack`。你存下来的规则文件会一直用 Carbon，直到你自己重跑。[4]

`setup-pstack` 第 2 步的新规则是：面板角色（`arena runners`、`arena cross-judge pool`、`interrogate reviewers`）里，凡是 `gemini-4-neon-high`，或者不是 Neon 的 `gemini-4-*`，都算旧默认值，统一改成 `gemini-4-neon-xhigh`。其他 Neon 档位算你自己的选择。不在面板角色里的 Gemini 条目不动。[7]

<figure class="not-prose my-6"><svg viewBox="0 0 640 440" role="img" aria-label="setup-pstack 0.15.48 怎样处理旧规则里的 Gemini 条目" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:640px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor" fill-opacity="0.6"/></marker></defs><rect x="150" y="16" width="280" height="36" rx="8" fill="#2563eb" fill-opacity="0.1"/><text x="290" y="39" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">旧 rule 里的一个 gemini-4-* 条目</text><polyline points="290,52 290,76" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah)"/><rect x="20" y="76" width="380" height="52" rx="8" fill="#6b7280" fill-opacity="0.07" stroke="#6b7280" stroke-width="1.5"/><text x="210" y="98" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">在面板角色里吗？</text><text x="210" y="117" font-size="10.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.8">arena runners · arena cross-judge pool · interrogate reviewers</text><polyline points="400,102 428,102" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah)"/><text x="404" y="95" font-size="11" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.7">否</text><rect x="428" y="76" width="192" height="64" rx="8" fill="#6b7280" fill-opacity="0.05" stroke="#6b7280" stroke-width="1.5"/><text x="524" y="96" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">保持原样</text><text x="524" y="114" font-size="10.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.8" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">例：judgment and prose:</text><text x="524" y="130" font-size="10.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.8" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">gemini-4-carbon-high</text><polyline points="210,128 210,150" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah)"/><text x="218" y="144" font-size="11" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.7">是</text><rect x="20" y="150" width="380" height="40" rx="8" fill="#6b7280" fill-opacity="0.07" stroke="#6b7280" stroke-width="1.5"/><text x="210" y="175" font-size="12.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">是 gemini-4-neon-high，或非 Neon 的 gemini-4-*？</text><polyline points="105,190 105,220" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah)"/><text x="113" y="210" font-size="11" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.7">是</text><polyline points="315,190 315,220" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah)"/><text x="323" y="210" font-size="11" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.7">否</text><rect x="20" y="220" width="180" height="54" rx="8" fill="#d97706" fill-opacity="0.1" stroke="#d97706" stroke-width="1.5"/><text x="110" y="242" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">旧默认值</text><text x="110" y="262" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">→ gemini-4-neon-xhigh</text><rect x="220" y="220" width="180" height="54" rx="8" fill="#2563eb" fill-opacity="0.08" stroke="#2563eb" stroke-width="1.5"/><text x="310" y="242" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">其他 Neon 档位</text><text x="310" y="262" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">第 2 步：算你的选择</text><polyline points="110,274 110,300" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah)"/><polyline points="310,274 310,300" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah)"/><rect x="20" y="300" width="380" height="60" rx="8" fill="#2563eb" fill-opacity="0.1" stroke="#2563eb" stroke-width="1.5"/><text x="210" y="324" font-size="12.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">第 3(b) 步：面板里的 Neon 条目按预算定档</text><text x="210" y="346" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">large → xhigh · medium → high · small → medium</text><polyline points="210,360 210,384" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah)"/><rect x="20" y="384" width="380" height="40" rx="8" fill="#2563eb" fill-opacity="0.12"/><text x="210" y="409" font-size="11.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">写出新 rule（# defaults: 3 不变，不会提醒你重跑）</text><rect x="428" y="168" width="192" height="192" rx="8" fill="#d97706" fill-opacity="0.1" stroke="#d97706" stroke-width="1.5"/><text x="440" y="192" font-size="11.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">实测：旧 rule 里</text><text x="440" y="215" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="1">interrogate reviewers 的</text><text x="440" y="238" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="1">gemini-4-neon-medium，</text><text x="440" y="261" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="1">选 large 重跑后变成</text><text x="440" y="284" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="1">gemini-4-neon-xhigh。</text><text x="440" y="307" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="1">想留低档：选更低预算，</text><text x="440" y="330" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="1">或在 3(c) 确认时改回。</text><polyline points="428,330 402,330" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" stroke-dasharray="4 4" marker-end="url(#ah)"/></svg></figure>

*图：`setup-pstack` 0.15.48 处理旧规则里 Gemini 条目的路径。右侧是这次实测看到的结果。规则来自 `setup-pstack/SKILL.md` 第 2 步和第 3(b) 步。[7]*

我用一份 0.15.43 格式的规则文件做输入，里面埋了四种 Gemini 条目：`arena runners` 里的 `gemini-4-carbon-high`、`arena cross-judge pool` 里的 `gemini-4-neon-high`、`interrogate reviewers` 里手选的 `gemini-4-neon-medium`，以及非面板角色 `judgment and prose` 里的 `gemini-4-carbon-high`。在 OpenCode 里用同一个免费模型跑 `/setup-pstack`。因为是非交互运行，我在 prompt 里先贴好了可用的模型列表，并给出了答案：预算选 `large`，按原样接受，第 7、8 步的两个可选项都不要。规则文件放在一个临时的 home 目录里。

![setup-pstack 实际运行：三个面板里的 Gemini 条目都变成 gemini-4-neon-xhigh，judgment and prose 的 gemini-4-carbon-high 保持不动](/assets/pstack-0-15-48-reframe-hands-on/setup-gemini-migration.webp)

*图：`/setup-pstack` 的运行输出和改动前后的 diff。*

结果和文字规则一致：三个面板条目都变成了 `gemini-4-neon-xhigh`，`judgment and prose` 的 Carbon 没动，`bug-fix: inherit-parent` 也没动。

有一处值得细看：`gemini-4-neon-medium`。按第 2 步，它是「你的选择」，应该保留。但第 3(b) 步又规定面板里的 Neon 条目按预算重新定档，`large` 对应 `xhigh`。两步连起来，你手选的 `medium` 在 `large` 预算下一定会被抬回 `xhigh`。模型给出的最终值是对的，但它把这一条归进了「替换了 3 个旧面板默认值」，理由说错了。这不影响结果，但说明一件事：想在面板里留一个低档 Gemini，改规则文件留不住。要么选 `medium` 或 `small` 预算，要么在第 3(c) 步确认时手动改，而且以后每次重跑都得再改一次。

Claude Code 用户可以跳过这一节。Claude Code 的适配文档把默认的 `gemini-4-neon-xhigh` 映射成 `inherit-parent`，也就是让这个座位跑在父会话的模型上。[8]

## /statechart 在 Windows 上终于能跑了

这是 0.15.46 唯一的修复，但 bug 本身挺有意思。原生 Windows 上，`/statechart` 有两处地方会去调 `/bin/sh`（杀进程组和清理临时目录），所以根本跑不起来。更隐蔽的是，Windows 上的 TLC 输出用 `\r\n` 换行，连 `@!@!@ENDMSG` 这个消息结束标记也带着 `\r`。原来的代码只按 `\n` 切行，标记的正则匹配不上，后面所有消息就都被嵌套进了第一条。于是一个规则确实被违反的规格，会报出「TLC exited 12 ... but its output names no rule that broke」，而一个完全正确的规格，可能带着错误的理由以 0 退出。[6]

修法是一个按 `\r?\n` 切行的 `splitLines`，所有读 TLC 输出的地方都改用它。杀进程组搬进 `kill.ts`，Windows 上用 `taskkill /t /f`。清理进程变成 `janitor.ts`，由命令自己的运行时启动。PR 作者在 macOS 上把真实的 TLC 强制改成 `\r\n` 输出，33 个语料用例在 main 上只过 8 个，修复后全过。作者也直说没在 Windows 上实际跑过，所有关于 Windows 的结论都是推断。

我在 Linux 上跑了 CI 同款的检查：

![cursor/plugins 9e278fe 上的仓库检查：validate-plugins 通过，harness 树是最新的，check-pstack-docs 0 个问题，node --test 共 374 个测试，304 个通过，0 个失败，70 个跳过](/assets/pstack-0-15-48-reframe-hands-on/repo-checks.webp)

*图：在 `cursor/plugins` 的 `9e278fe`（0.15.48 的合并提交）上跑仓库自带的检查和测试。*

测试从上一篇的 340 个涨到 374 个，通过数从 270 涨到 304，失败 0。跳过的 70 个需要 Java 和 TLC，这台机器没装。`check-pstack-docs` 现在数到 59 个 skill、35 个命令，35 个都在指南里出现过。这说明 `/reframe` 不只是加了一个文件，README、`poteto-help` 的路由表和指南第 2 章都同步写进去了。

## X 上的反应

![Lauren Tan 在 X 上宣布 /reframe：you can only prompt what you can imagine](/assets/pstack-0-15-48-reframe-hands-on/x-poteto-reframe.webp)

*图：@poteto 在 2026-11-24 上海时间 08:50 发的帖子。[10]*

作者宣布 `/reframe` 时只写了一句：「you can only prompt what you can imagine」，并补充它适合「你知道自己想要什么、但说不出来」的时候，和 `/sharpen` 搭配效果很好。[10] 三天前那条 v0.15.46 的更新帖，讲的是精简 skill 和把 Gemini 4 Neon 加进评审面板，有三千九百多个赞。[11]

![Lauren Tan 的 v0.15.46 更新帖：skill 大幅精简，Gemini 4 Neon 加入面板评审，Grok Bot 和 Cursor 用户自动更新](/assets/pstack-0-15-48-reframe-hands-on/x-poteto-0-15-46.webp)

*图：@poteto 在 2026-11-21 上海时间 01:03 发的 v0.15.46 更新帖。[11]*

回复里有两个问题，上面的实测都能回答。有人问 `/reframe` 是只用你自己领域的词，还是也会从相邻领域借词。[12] 答案是都有，相邻领域是固定的第 2 步，三次实测都给了 3 个。另一个人问 `/reframe` 和 `/sharpen` 先用哪个。[13] 官方指南的顺序是先 `/reframe`，把重写后的描述发出去，或者再跑一次 `/sharpen`。[9] 也有刚用了一周的用户说，先用 `/sharpen` 把 prompt 写细再交给 `/poteto-mode`，感觉准确度提高了。[14] 我建议把三步连起来：`/reframe` 解决「叫什么」，`/sharpen` 解决「做多深」，`/poteto-mode` 负责做。

还有一点要提醒。Claude Code 社区早在 3 月就有人发过一个也叫 `/reframe` 的 slash command，做的是一种认知科学的换框技巧，和 pstack 毫无关系。[15] 在 Claude Code 里，pstack 的版本叫 `/pstack:reframe`，不会撞名，但搜教程时别看错了。

## 测了什么，没测什么

实际跑过的：

- Claude Code 2.1.278 从 0.15.43 升级到 0.15.48，确认版本、59 个 skill 和 token 估算。
- 0.15.43 和 0.15.48 两份 `pstack/` 目录的逐文件对比。`SKILL.md` 正文合计从 26,346 词变成 26,709 词，多出来的 363 词里，202 词是 `reframe`，102 词是 `setup-pstack` 的迁移规则。
- 用 0.15.48 的 `reframe/SKILL.md`，在 OpenCode 2.3.2 加免费模型上对三种描述各跑一次 `/reframe`，并且逐个核对了最终引用的链接。
- 用 0.15.48 的 `setup-pstack/SKILL.md`，对一份带四种 Gemini 条目的旧规则文件跑一次 `/setup-pstack`。
- `validate-plugins`、`generate-pstack-harness-trees --check`、`check-pstack-docs` 和 CI 的 `node --test`。

没测到的：

- Claude Code 或 Cursor 里真实的 `/reframe` 会话。Claude Code 没登录，测试机上没有 Cursor。
- 用 pstack 默认的 Opus 5.5 跑 `/reframe`。上面三次用的是免费小模型。
- 交互式的 `/setup-pstack`：预算和确认的答案是预先写进 prompt 的，模型列表也是贴进去的，不是从 Task 工具里检测出来的。
- Windows 上的 `/statechart`，以及需要 Java 和 TLC 的 70 个测试。

我的结论是：值得升级，而且 `/reframe` 值得放进你的日常流程。它便宜，每个会话只多约 50 token，用一次约 270 token。它也不碰你的代码，只帮你把需求说准，而需求说准往往是一个任务最难的那一步。0.15.48 加的候选问题步骤几乎每次都会触发，好在它说出来的另外两种读法通常都值得看一眼。存过规则文件的人，记得重跑一次 `/setup-pstack`，看它把哪些 Gemini 条目换成了 Neon。

## 参考来源

1. cursor/plugins PR #1324，feat(pstack): add /reframe to learn the expert words for what you're building：<https://github.com/cursor/plugins/pull/1324>
2. cursor/plugins PR #1326，feat(pstack): have /reframe list the problems a vague description could be：<https://github.com/cursor/plugins/pull/1326>
3. pstack 0.15.48，`reframe/SKILL.md`：<https://github.com/cursor/plugins/blob/9e278fe4d4ecd8bfe98b1b79bf4be662efb338cc/pstack/skills/reframe/SKILL.md>
4. cursor/plugins PR #1283，chore(pstack): route the Gemini seat to Gemini 4 Neon：<https://github.com/cursor/plugins/pull/1283>
5. cursor/plugins PR #1284，chore(pstack): run the Gemini panel seat at gemini-4-neon-xhigh：<https://github.com/cursor/plugins/pull/1284>
6. cursor/plugins PR #1292，fix(pstack): run /statechart on native Windows and read TLC's \r\n line ends：<https://github.com/cursor/plugins/pull/1292>
7. pstack 0.15.48，`setup-pstack/SKILL.md`：<https://github.com/cursor/plugins/blob/9e278fe4d4ecd8bfe98b1b79bf4be662efb338cc/pstack/skills/setup-pstack/SKILL.md>
8. pstack 0.15.48，Claude Code adapter：<https://github.com/cursor/plugins/blob/9e278fe4d4ecd8bfe98b1b79bf4be662efb338cc/pstack/docs/harness/claude-code.md>
9. pstack 0.15.48，guide 第 2 章 `02-poteto-mode.md`：<https://github.com/cursor/plugins/blob/9e278fe4d4ecd8bfe98b1b79bf4be662efb338cc/pstack/docs/guide/02-poteto-mode.md>
10. @poteto 在 X 上宣布 /reframe（2026-11-24）：<https://x.com/poteto/status/2125029185379008573>
11. @poteto 在 X 上的 v0.15.46 更新帖（2026-11-21）：<https://x.com/poteto/status/2123824683862855898>
12. @AnthonySunAI 在 X 上的回复（2026-11-24）：<https://x.com/AnthonySunAI/status/2125035809854402936>
13. @RushabhShah 在 X 上的回复（2026-11-24）：<https://x.com/RushabhShah/status/2125034855620645367>
14. @ddpi_dev 在 X 上的帖子（2026-11-23）：<https://x.com/ddpi_dev/status/2124668618067845409>
15. r/ClaudeAI，另一个同名的 /reframe slash command（2026-03）：<https://www.reddit.com/r/ClaudeAI/comments/1s51msf/made_a_reframe_slash_command_for_claude_code_that/>
16. OpenCode 文档，Skills：<https://opencode.ai/docs/skills/>
17. cursor/plugins，`validate-plugins.yml`：<https://github.com/cursor/plugins/blob/9e278fe4d4ecd8bfe98b1b79bf4be662efb338cc/.github/workflows/validate-plugins.yml>
