---
title: "DeepSeek Super-agent 拆解：当瓶颈从模型变成人的注意力，agent 该怎么搭"
seoTitle: "DeepSeek Super-agent 架构：Router、Worker 与事件驱动"
description: "DeepSeek Harness 团队 10 月 31 日发布 Super-agent 设计长文并开源 dsh-superagent 原型。本文拆解 Router/Worker 双层架构、Trigger 过滤与 Thread 订阅、异步 ReAct、存算分离和 Watchdog，读懂官方消融实验的数字和代价，对照社区实测与安全审计，再把它放进 Claude Tag、Copilot coding agent、Managed Agents 的 2026 年版图里比较。"
pubDate: 2026-11-02T22:30:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "deepseek", "multi-agent", "developer-tools"]
lang: "zh"
---

10 月 31 日晚上，DeepSeek Harness 团队在公众号发了一篇长文《Super-agent 设计探索：迈向更自主的 Agent 系统》，同一时间在 GitHub 开源了配套原型 `dsh-superagent-prototype`。[1][3] 第二天彭博社的标题是「DeepSeek 推出增强版编码 agent，剑指 Anthropic」，南华早报和 IT之家也当天跟进。[7][8][14] 两天后仓库已经有一万多颗星。

标题容易让人以为 DeepSeek 发了新产品甚至新模型，其实都不是。README 第一句就写着「仅供研究参考，不是 DeepSeek 官方产品」，长文开头也说明这是工程架构探讨，不是功能介绍。[1][3] 它真正交出来的是一套设计思路、两组初步实验，以及一份能跑但很粗糙的参考实现。

我认为这篇文章值得细读，原因不在「对标 Claude Code」。它把一个大家隐约感到、却很少有人正面写出来的判断讲清楚了：**单个任务能做多好，取决于模型；同时推进多少任务，取决于人的注意力。** 如果这个判断成立，下一代 agent 的竞争点就从模型和 harness 挪到了系统设计上，而系统设计恰好是计算机科学积累了几十年的老本行。下面按这个思路拆。

## 它到底发布了什么

这次发布有三样东西：

- 一篇中文长文，英文全译也已经流传，共九节，从问题定义写到五个模块、两组实验和四个开放问题。[1][2]
- 一个 MIT 协议的 GitHub 仓库，版本 0.1.0，只有一次提交，提交时间是北京时间 10 月 31 日 20:05。代码以 TypeScript 为主，约两万五千行，附九篇按顺序阅读的设计文档。[3]
- 一个具体场景：原型盯住**一个** GitHub 仓库，可选接入飞书。白名单里的人 @ 它提需求，它就开一张工单，在独立的会话和目录里干活，最后回到原来的对话里交付，通常是一个 pull request。一个网页面板只列出需要人处理的事。[3]

[![dsh-superagent-prototype 仓库首页截图，README 开头写明这是研究原型而非官方产品](/assets/deepseek-super-agent-router-worker-architecture/github-readme.webp)](https://github.com/deepseek-ai/dsh-superagent-prototype)

*截图：dsh-superagent-prototype 仓库首页（2026-11-02 截取，当时 11.9k 星、1.2k fork）[3]*

README 还有一句容易被略过：发布版做过改编，和内部版本、和长文描述的实现都不完全一样，文中有些设计只是未来方向，原型里没有。[3] 所以读的时候要分两层：长文讲的是 DeepSeek 内部在跑的那套系统和它背后的想法，原型是一份缩小版的可运行样本。

DeepSeek Harness 本身站内写过两篇，一篇讲[主循环、PTC 和插件体系](/cn/blog/deepseek-harness-architecture-plugins-sandbox-vs-claude-code/)，一篇讲[底层 Cordis 的插件组合](/cn/blog/cordis-spatiotemporal-composability-deepseek-harness/)。Super-agent 在这个 harness 上面又加了一层，管的不再是「一个会话怎么跑」，而是「很多会话怎么组织」。

## 问题出在会话这个单位上

长文开头的观察很朴素：现在主流的 agent 都以单个 Session 为工作单位，不同 Session 互相独立。你同时推进几件事，就得自己在几个 Session 之间切换，记住每个 Session 里有什么上下文。按他们的观察，一个人通常只能同时跟进三到五个活跃的 Session。[1]

同时开过好几个 Claude Code 或 Codex 窗口的人都有体会：开到第四个，你开始忘记第二个窗口在等你回答什么。模型越强，单个任务越不需要你盯，这个瓶颈反而越明显。

给本地 CLI 接个 MCP 或飞书机器人，确实能收到群消息，但长文指出它还是卡在三件事上：一个长命令跑着，新消息只能排队；多个任务的上下文搅在一起；本地设备一休眠，agent 就停了。[1]

所以他们要打破「一个 agent 等于一个手动开启的会话」这层绑定，让 agent 变成一个持续存在的实体。长文给这种形态定了四个特征：**连续**（在 IM、GitHub 评论等不同入口跟它说话，感觉始终是同一个 agent）、**高效**（多个任务并行，不必等上一个做完）、**主动**（观察环境事件，值得做的事主动推进，不需要时保持安静）、**持久**（一直在线，出错能自己恢复）。[1]

一个 ReAct 循环同时满足不了这四条。连续性要求所有消息进同一个上下文，高效又要求任务分开并行，两者天然冲突。下面五个模块，基本都是在处理这个冲突。

## Router 和 Worker：把连续性和吞吐量拆到两层

所有事件塞进一个 Session，上下文最连续，但只能串行，任务一多就慢，细节还互相污染；每个事件开一个新 Session，并发最高，可任务之间一有关联，结果就各说各的，几个 Session 分别回复用户也让人困惑。[1]

DeepSeek 的做法是把「维护全局连续性」和「高并发执行」分给两层：

<figure class="not-prose my-6"><svg viewBox="0 0 680 470" role="img" aria-label="Super-agent：事件从哪进来，谁来处理" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:680px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor" fill-opacity="0.7"/></marker></defs><text x="10" y="24" font-size="16" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">Super-agent：事件从哪进来，谁来处理</text><text x="10" y="52" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">环境事件（Trigger）</text><rect x="10" y="62" width="150" height="30" rx="6" fill="#64748b" fill-opacity="0.12" stroke="#64748b" stroke-opacity="0.8"/><text x="85" y="82" font-size="12" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">飞书 / IM 群聊</text><line x1="162" y1="77" x2="186" y2="150" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.6" marker-end="url(#ah)"/><rect x="10" y="102" width="150" height="30" rx="6" fill="#64748b" fill-opacity="0.12" stroke="#64748b" stroke-opacity="0.8"/><text x="85" y="122" font-size="12" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">GitHub Issue、PR 评论</text><line x1="162" y1="117" x2="186" y2="150" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.6" marker-end="url(#ah)"/><rect x="10" y="142" width="150" height="30" rx="6" fill="#64748b" fill-opacity="0.12" stroke="#64748b" stroke-opacity="0.8"/><text x="85" y="162" font-size="12" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">CI 结果</text><line x1="162" y1="157" x2="186" y2="150" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.6" marker-end="url(#ah)"/><rect x="10" y="182" width="150" height="30" rx="6" fill="#64748b" fill-opacity="0.12" stroke="#64748b" stroke-opacity="0.8"/><text x="85" y="202" font-size="12" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">邮件、日程</text><line x1="162" y1="197" x2="186" y2="150" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.6" marker-end="url(#ah)"/><rect x="186" y="105" width="128" height="90" rx="6" fill="#f59e0b" fill-opacity="0.15" stroke="#f59e0b" stroke-opacity="0.8"/><text x="250" y="127" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">过滤</text><text x="250" y="150" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">代码规则：快路径</text><text x="250" y="170" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">模型判断：慢路径</text><line x1="316" y1="135" x2="328" y2="112" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.6" marker-end="url(#ah)"/><text x="312" y="96" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.75">新事件</text><rect x="330" y="62" width="150" height="96" rx="6" fill="#3b82f6" fill-opacity="0.15" stroke="#3b82f6" stroke-opacity="0.8"/><text x="405" y="84" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">Router（常驻）</text><text x="405" y="106" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">对人说话、分派任务</text><text x="405" y="124" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">全局记忆，不执行任务</text><text x="405" y="142" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">可用轻量模型</text><rect x="510" y="52" width="160" height="44" rx="6" fill="#10b981" fill-opacity="0.15" stroke="#10b981" stroke-opacity="0.8"/><text x="590" y="79" font-size="12" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">Worker A：复现 bug</text><line x1="482" y1="110" x2="507" y2="74" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.6" marker-end="url(#ah)"/><rect x="510" y="110" width="160" height="44" rx="6" fill="#10b981" fill-opacity="0.15" stroke="#10b981" stroke-opacity="0.8"/><text x="590" y="137" font-size="12" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">Worker B：跟进 PR</text><line x1="482" y1="110" x2="507" y2="132" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.6" marker-end="url(#ah)"/><rect x="510" y="168" width="160" height="44" rx="6" fill="#10b981" fill-opacity="0.15" stroke="#10b981" stroke-opacity="0.8"/><text x="590" y="195" font-size="12" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">Worker C：写新功能</text><line x1="482" y1="110" x2="507" y2="190" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.6" marker-end="url(#ah)"/><text x="570" y="244" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.8">各自隔离上下文，用最强模型</text><path d="M250,197 L250,262 L655,262 L655,226" fill="none" stroke="#10b981" stroke-width="1.8" stroke-dasharray="6 4" marker-end="url(#ah)"/><text x="415" y="280" font-size="11.5" text-anchor="middle" font-weight="normal" fill="#10b981" fill-opacity="1">已订阅的 Thread：代码直送 Worker，不经过 Router</text><text x="495" y="46" font-size="10.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.7">汇报进度</text><rect x="10" y="300" width="660" height="40" rx="6" fill="#ef4444" fill-opacity="0.1" stroke="#ef4444" stroke-opacity="0.8" stroke-dasharray="5 4"/><text x="340" y="325" font-size="12" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">Watchdog：定时检查 Worker 有没有实质进展、是否跑偏</text><rect x="10" y="352" width="660" height="40" rx="6" fill="#8b5cf6" fill-opacity="0.12" stroke="#8b5cf6" stroke-opacity="0.8"/><text x="340" y="377" font-size="12" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">云端：无状态计算 + 数据库存会话状态</text><line x1="120" y1="394" x2="120" y2="414" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.6" marker-end="url(#ah)"/><rect x="60" y="416" width="120" height="30" rx="6" fill="#64748b" fill-opacity="0.12" stroke="#64748b" stroke-opacity="0.8"/><text x="120" y="436" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">开发机</text><line x1="340" y1="394" x2="340" y2="414" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.6" marker-end="url(#ah)"/><rect x="280" y="416" width="120" height="30" rx="6" fill="#64748b" fill-opacity="0.12" stroke="#64748b" stroke-opacity="0.8"/><text x="340" y="436" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">CI 机器</text><line x1="560" y1="394" x2="560" y2="414" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.6" marker-end="url(#ah)"/><rect x="500" y="416" width="120" height="30" rx="6" fill="#64748b" fill-opacity="0.12" stroke="#64748b" stroke-opacity="0.8"/><text x="560" y="436" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">云主机</text><text x="340" y="462" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">设备上的轻量 daemon（BYOM）：只执行命令</text></svg></figure>

*示意图：Super-agent 的事件路径与分层（按官方长文第 2–6 节整理）[1]*

**Router 层**常驻，负责所有入口的人类交互和任务分派，是全局的排序点、协调点和记忆。为了不让它变成瓶颈，它被设计成不执行具体任务，长文甚至说它可以没有 Bash 工具。它的工作比看上去简单，用轻量模型往往就够了。[1]

**Worker 层**由上下文互相隔离的会话组成，每个 Worker 挂完整的执行工具，专注一个任务，通常配能力最强的模型。Worker 不直接和人说话，推理过程和工具调用不外泄到群里，而是向 Router 汇报，由 Router 统一回复。[1]

这看起来像 Agent Team，区别在于 Agent Team 用来拆解**一个**复杂任务，Team Lead 要深入理解任务、频繁协调成员；Router 只管任务之间的关系和分派，不拆单个任务的内部。[1] 我觉得这个区分很关键：Team Lead 是一个忙碌的技术负责人，Router 更像一个前台加调度员。前者越聪明越好，后者需要的是快和稳。

一个常驻 Router 会不会扛不住？长文给的答案是批处理。Router 每轮推理期间到达的事件会攒起来，下一轮一起注入。Router 的每一步通常是长输入、短输出，合并后的事件在 prefill 阶段并行计算，单次请求耗时的增长远慢于批量大小。压测里，需要决策的 Trigger 从每分钟约 1 条增加到约 40 条，平均批量从 1.0 涨到 2.8，单次请求耗时只从 2.5 秒涨到 3.9 秒，分摊到每个决策的推理时间反而从 6.4 秒降到 1.6 秒。[1] 消息越堵，单个决策越便宜。这和数据库的 group commit 是同一个道理，在 LLM 的成本结构下照样成立。

规模再大，Router 可能要分片，那时又回到连续性和吞吐量的取舍：分得越细，跨分片的记忆越断。[1]

## 事件驱动：先过滤，再订阅，再按需召回

要让 agent 主动，输入就不能只是人一条条敲进去的提示词，而是群聊消息、邮件和日程提醒、代码审查评论、CI 结果这些半结构化的环境事件，长文统一叫 Trigger。[1]

接进真实群聊之后，事件流的特点是噪声高、需要行动的比例低。每条消息都让大模型从头判断一遍，延迟和成本都吃不消。所以第一步是两级过滤：代码先按来源、群范围、用户白名单这些确定条件快速放行或丢弃，这是快路径；剩下的候选事件才交给模型，按提示词里写的策略判断要不要行动，这是慢路径。[1] 慢路径同时也是给人留的自然语言接口，想加一条规则，改提示词就行。

第二步是路由。同一个 PR、同一个 IM 话题、同一串邮件里陆续来的事件构成一个 Thread。Router 根据 Thread 的第一个事件创建 Worker 之后，这个 Worker 直接订阅该 Thread，后续事件由代码直接投递给它，不再经过 Router。订阅是多对多的，两个 Worker 碰到同一个 PR 时会收到同样的事件，不需要点对点通信就有机会自己发现冲突。[1] 熟悉消息队列的人会觉得眼熟，这就是按 topic 订阅。

第三步是上下文怎么装。长文把上下文窗口当缓存管，借了编译器里的两个词：Inline 是把马上可能用到的信息直接放进窗口，省掉工具调用的往返；Spill 是把超出预算或不常用的内容留在窗口外，只放引用或摘要。[1] 起步只给当前对象的 ID 和摘要，再按局部性内联邻近内容，比如一条 IM 消息前后几条和它回复的那条，超长的截断并留一个续读入口。

在这个基础上，他们给 Trigger、Thread、Worker Session 等对象都分配唯一 ID，每个对象注入时都内联相关对象的 ID，形成一张引用图。模型从当前事件出发，顺着 ID 一跳一跳找回旧上下文：消息所在的 Thread，负责它的 Worker，那个 Worker 关联的另一个审查 Thread。长文把这叫 Chain of Recall（链式召回），用来对付 Router 长期运行后记不住早期任务的问题。[1]

最后一个机制是投机执行。CPU 会在分支结果确定前先往下算，agent 也可以在确定结果有用之前先在后台动手。他们在内部 DeepSeek Harness 用户群里配了一条「静默复现并修复」的规则：有人报告问题或讨论改动时，agent 先在后台尝试复现、找修法，确认问题存在且有简单修法才开口，否则全程不说话。[1] 长文里的例子是群里还在讨论方案，Super-agent 已经在后台提交了修复 PR。这一条最能体现「主动」的含义，也是最容易出事的一条，后面谈安全时再说。

## 异步 ReAct 和按信道说话

经典 ReAct 循环里，模型调用一个同步的 `run()`，循环就卡住，直到工具返回。这期间新消息只能等。长文的改法是把耗时的命令和子任务改成异步的 `start()` 和 `stop()`：调用 `start()` 立刻拿到「已启动」，循环继续；后台跑完，结果作为一条新事件送回会话；跑太久的，模型可以根据上下文调 `stop()` 终止。[1] 这样对话就从半双工变成了全双工，前台说话和后台干活互不阻塞。这个机制已经在 DeepSeek Harness 里实现，但默认没有开启；原型用了一个更朴素的办法，前台 shell 命令超过 5 秒就转成后台作业。[1][3]

另一半是输出要匹配信道。把为单人终端设计的界面原样搬进群聊，满屏的推理过程和工具调用会把一起协作的人淹没。长推理已经被关在 Worker 里，剩下的靠提示词按信道调整：IM 里像同事一样只在需要决策或验收时开口，他们实测有效的一条硬规则是单次回复不超过 100 个词；GitHub 和邮件里则要结构化，PR 描述写全问题、改动和验证结果。[1]

原型把这套想法写成了一条总原则：**尽量少占人的注意力，尽量多给价值。** 它只在被请求、或团队写好的规则允许时才行动；只在有人必须行动、或者有结果可用时才说话；一次只问一个具体问题。[4] 我认为这份 `000-philosophy.md` 是整个仓库里最值得抄的文件，它直接回答了「一个能替整个团队干活的 agent 怎么才不变成噪音源」。

## 存算分离和 Watchdog：让它一直活着

本地 agent 把推进循环的计算、会话状态和执行环境绑在同一台设备上，设备一休眠，agent 就停。长文分两步解耦。[1]

第一步，Agent Loop 的计算放进云端无状态容器，会话状态存数据库，容器可以随时重启或替换。第二步，执行环境留在原地，设备上只装一个不存状态、只执行命令的轻量 daemon。这就是 BYOM（Bring Your Own Machine）：把日常用的开发机接到云端 agent 上，设备重新上线后，云端还能自动补跑需要在那台机器上做的任务。[1]

长文明确说，这和 Anthropic 的「把大脑和双手解耦」是同一个思路：Managed Agents 把会话日志、harness 和沙箱拆开，容器挂了只算一次工具调用失败，harness 挂了就读回日志继续。[1][15] 区别在场景：Anthropic 讲的是托管服务里按需创建的沙箱和客户 VPC 里的资源，DeepSeek 首先要接的是人们每天用的个人电脑，可能断断续续在线，还带着未提交的改动和本地凭据。[1] 这个区别后面会变成安全问题。

持久运行还需要一个独立于主系统之外的控制回路。长文的判断我很认同：agent 系统的很多故障不是进程崩了，而是模型陷进无效循环，或者慢慢偏离目标，传统的存活探针看不出来。所以他们在主系统外配了一个定时驱动的 Watchdog Session，除了处理接口报错，还让模型判断每个 Worker 有没有实质进展、有没有跑偏。它本身也是一个有完整工具的 agent，维护者可以直接问它出了什么故障，甚至让它在运行中改主系统的提示词和触发规则。[1]

## 实验数字该怎么读

批处理压测前面说过了，这里看端到端的消融实验：用群聊和 GitHub CI 消息流驱动四种方案，每次约 300 条消息，其中约 20 条是工作请求，其余是闲聊、跟进、叫停和 CI 消息；编码工作用一个只消耗时间的工具代替；每种方案跑 5 次。[1]

<figure class="not-prose my-6"><svg viewBox="0 0 680 360" role="img" aria-label="官方消融实验：约 300 条消息、20 个工作请求、每种方案跑 5 次" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:680px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor" fill-opacity="0.7"/></marker></defs><text x="10" y="24" font-size="15" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">官方消融实验：约 300 条消息、20 个工作请求、每种方案跑 5 次</text><text x="10" y="48" font-size="12" fill="currentColor" fill-opacity="0.85">任务完成时间（分钟）  <tspan fill="#3b82f6">■</tspan> p50  <tspan fill="#ef4444">■</tspan> p95</text><text x="470" y="48" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.85">读缓存 token（百万）</text><text x="10" y="78" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">Super-agent</text><rect x="10" y="84" width="124.0" height="14" rx="2" fill="#3b82f6" fill-opacity="0.85"/><text x="140.0" y="96" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">12.4</text><rect x="10" y="102" width="157.0" height="14" rx="2" fill="#ef4444" fill-opacity="0.8"/><text x="173.0" y="114" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">15.7</text><rect x="470" y="90" width="108.9" height="18" rx="2" fill="#8b5cf6" fill-opacity="0.75"/><text x="584.890625" y="104" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">23.23</text><text x="10" y="144" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">Super-agent，去掉直送</text><rect x="10" y="150" width="126.0" height="14" rx="2" fill="#3b82f6" fill-opacity="0.85"/><text x="142.0" y="162" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">12.6</text><rect x="10" y="168" width="155.0" height="14" rx="2" fill="#ef4444" fill-opacity="0.8"/><text x="171.0" y="180" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">15.5</text><rect x="470" y="156" width="148.9" height="18" rx="2" fill="#8b5cf6" fill-opacity="0.75"/><text x="624.921875" y="170" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">31.77</text><text x="10" y="210" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">单 Session + Subagent，中性提示</text><rect x="10" y="216" width="204.0" height="14" rx="2" fill="#3b82f6" fill-opacity="0.85"/><text x="220.0" y="228" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">20.4</text><rect x="10" y="234" width="295.0" height="14" rx="2" fill="#ef4444" fill-opacity="0.8"/><text x="311.0" y="246" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">29.5</text><rect x="470" y="222" width="28.4" height="18" rx="2" fill="#8b5cf6" fill-opacity="0.75"/><text x="504.359375" y="236" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">6.05</text><text x="10" y="276" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">单 Session + Subagent，提示优先委派</text><rect x="10" y="282" width="138.0" height="14" rx="2" fill="#3b82f6" fill-opacity="0.85"/><text x="154.0" y="294" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">13.8</text><rect x="10" y="300" width="290.0" height="14" rx="2" fill="#ef4444" fill-opacity="0.8"/><text x="306.0" y="312" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">29.0</text><rect x="470" y="288" width="50.7" height="18" rx="2" fill="#8b5cf6" fill-opacity="0.75"/><text x="526.71875" y="302" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">10.82</text><line x1="455" y1="60" x2="455" y2="330" stroke="currentColor" stroke-opacity="0.2"/><text x="10" y="348" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.7">编码工作用只耗时的假工具代替，测的是调度不是写代码。数据见参考 [1][9]</text></svg></figure>

*示意图：四种方案的任务完成时间和读缓存 token（Super-agent 两项 token 数取自长文正文，其余数值取自长文表格图）[1][9]*

Super-agent 的 p50 是 12.4 分钟、p95 是 15.7 分钟。单 Session 加 Subagent 工具、用中性提示（「合适时使用 subagent」）的方案，p95 到了 29.5 分钟，原因很有意思：5 次运行里模型**一次都没有**调用 Subagent，所有工作都在主会话里做，还不断被新消息打断。换成优先委派的提示词后，5 次里有 4 次委派了，p50 降到 13.8 分钟，接近 Super-agent；剩下那次模型判断工作「很小」自己做了，p95 仍然是 29.0 分钟。[1][9]

我觉得这组数据里最有价值的不是「快了将近一倍」，而是它证明了一件很多人在实践中感觉到的事：**靠提示词让模型自己决定要不要分工，是不稳定的。** 模型在每一刻都要判断「这件事我自己做还是交出去」，而它倾向于自己做。双层架构把这个判断从模型手里拿走，Router 根本不执行具体工作，Worker 只收自己订阅的 Thread 的消息。用结构代替提示词，这条经验适用范围比 Super-agent 本身大得多。

代价也写得很清楚。Super-agent 一次实验的读缓存 token 是 2323 万，中性提示的单 Session 方案只有 605 万，差不多是后者的 3.8 倍。[1][9] 它是在用 token 换更短、更稳定的完成时间。去掉订阅直送之后，完成时间基本不变，但 Router 要做的决策多了约 30%，读缓存 token 从 2323 万涨到 3177 万，多了约 37%。[1] 也就是说，直送机制不提速，它省的是 Router 的开销。

负载是合成的，编码工作是假的，官方也没公布用的哪个模型。[1][9][10] 所以这组数字说明的是「这种分层在嘈杂输入下更稳」，不是「接到你的仓库里能多修几个 bug」。

## 原型和长文之间的距离

社区这两天的反应很能说明问题。Reddit r/singularity 上介绍架构的帖子拿到九百多个赞，Hacker News 上的几个帖子反而几乎没有讨论。[12][11] 中文圈的讨论更热，有开发者在 X 上说，这个理念大致对标 Slack 里的 Claude Tag，示例主要展示的是「飞书群聊和 GitHub 之间持续推进任务」。[13]

[![X 用户 @lijiankuan 的帖子截图：DeepSeek Harness 团队开源 super-agent 原型，理念对标 Slack 里的 Claude Tag](/assets/deepseek-super-agent-router-worker-architecture/x-lijiankuan-post.webp)](https://x.com/lijiankuan/status/2116565847967924286)

*截图：X 上 @lijiankuan 对 Super-agent 的评论，配图是官方长文开头（2026-11-02 截取）[13]*

真正动手装的人结论比较一致：设计值得学，安装和容错还没准备好。[9] 有人在 Node.js 24 上发现服务脚本找不到自己的进程，因为 Node 24 把主线程改名为 `MainThread`，`ps` 里不再显示 `node`，结果服务明明在跑，`status` 却报没在跑；还发现 GitHub 通知的时间窗口和游标配合有问题，晚到的 @ 评论会永久丢失。有人装了一整夜，评价是「思路很喜欢，安装很反感」，插件版本一不对，整个 DSH 的网页界面都起不来。也有人在 Ubuntu 上接私有仓库，把一个 Issue 一路做到了 PR，中途靠打开 `observeIssues` 和 `observeComments` 才绕过通知收不到的问题。[9]

更值得注意的是权限。部署文档写得很直白：Router 和 Worker 都以 `danger-full-access` 在操作者的系统用户下运行，Worker 能按路径执行程序、读你的主目录，账户包装只是换了凭据，并不隔离进程；要隔离，就用一个只放 agent 凭据的独立系统账号。[6] 一份独立安全审计报告了两个问题：本机管理 API 只校验 Host 和一个在文档里公开写明的请求头 `x-orchestrator-request: 1`，任何能连本机端口的进程都能改 CLI 路径和授权名单；另外，同一批次里被拒绝的消息可以「借用」白名单成员的授权开工单。截至 11 月 1 日上游没有修复。[9]

好在原型的默认值是保守的。主动接活默认是 `observe` 模式：模型判断「本来会接」的事只记录下来，不执行，团队看过记录再决定要不要切到 `auto`；显式请求在任何模式下都有效，但发起人必须在名单里。[5] 我觉得这是整套设计里最务实的一笔：先让 agent 证明它的判断靠谱，再给它动手的权利。

## 放进 2026 年的 agent 版图里看

DeepSeek 不是第一个想到「常驻、多人、主动」的。把几家放在一起看，能看出方向在收敛：

| 系统 | 入口 | 谁决定动手 | 执行在哪 | 形态 |
|---|---|---|---|---|
| DeepSeek Super-agent [1][3] | 飞书、GitHub | 显式请求，或团队规则加模型判断（默认只记录） | 云端循环加设备 daemon；原型跑在本机 | 设计长文加 MIT 原型 |
| Anthropic Claude Tag [16][17] | Slack 频道 | @Claude，或开启 ambient 后主动跟进 | Anthropic 托管 | 商业产品（Team、Enterprise 测试版） |
| GitHub Copilot coding agent [18] | 把 Issue 指派给 Copilot | 人指派 | GitHub 托管的执行环境 | 商业产品 |
| OpenAI Codex 的 GitHub 集成 [19] | PR 评论里写 `@codex review` | 人 @，或开启自动审查 | OpenAI 云端 | 商业产品 |
| Anthropic Managed Agents [15] | API | 开发者自己编排 | 按需创建的沙箱 | 托管基础设施 |

最接近的是 Claude Tag。按 Anthropic 6 月的发布说明，一个 Slack 频道里只有一个 Claude，所有人都能接着上一个人的话继续；它跟随频道积累上下文；开启 ambient 模式后会主动跟进没人收尾的话题，还能给自己排期推进几天的项目。[16] 8 月的更新让它能读完整对话、自己决定什么时候插话。[17] Anthropic 还说，他们产品团队 65% 的代码由内部版 Claude Tag 产出。[16]

把这两者放在一起，「连续、主动、持久」几乎一一对应。长文里那句「相似的设计约束会导向相似的架构选择」，在这里得到了印证。[1] 区别在发布方式：Anthropic 卖的是调好的产品，内部怎么分层没有公开；DeepSeek 把分层、路由、实验数据和失败的对照组都摊开了，还附了能改的代码。想自己搭团队 agent，DeepSeek 这份材料更有用；只想明天就在 Slack 里 @ 一个靠谱的助手，Claude Tag 更省事。

彭博社把这件事写成「挑战 Claude Code」，我觉得没说到点子上。[7] Claude Code 是单会话工具，Super-agent 讨论的是单会话之上那一层。它和 Claude Code 是叠加关系，不是替代关系：长文自己就说，Worker 内部完全可以再开 Subagent，或者本身就是一个 Agent Team。[1]

## 我怎么看

先说值得抄的四条：Router 不干活，用结构而不是提示词保证分工；Thread 订阅加直送，让后续事件绕过中心节点；外部 Watchdog 检查进展而不是存活；主动行为先 `observe`，攒够证据再放开。这四条都不依赖 DeepSeek Harness。

再说没解决的。长文第 8 节列了四个开放问题，我认为最要紧的是安全。[1] 事件驱动意味着 agent 的输入不再只来自信任的操作者，任何能在公开仓库评论、能进那个群的人，都能把文字送进以全权限运行的 Worker 上下文里。站内之前那篇[提示词注入综述](/cn/blog/prompt-injection-2026-survey-self-replicating/)讨论过的攻击路径，在这里几乎每条都成立。长文自己也承认：云端 Agent Loop 一旦被入侵或注入，所有连着的设备都可能被接管；端侧凭据只要能进模型上下文，正常执行中也可能泄露。[1] Anthropic 在 Managed Agents 里的做法是让令牌永远不出现在生成代码运行的沙箱里。[15] DeepSeek 的 BYOM 模式要接的恰恰是满是凭据的个人电脑，这个问题只会更难。

另外三个问题同样没有答案：跑几个月以后的长期记忆怎么办；Session 不再对应聊天窗口之后，任务怎么呈现、人怎么中途插手；团队的 Super-agent 和每个人的私人助手分属不同权限边界，它们之间怎么安全协作（A2A）。[1]

最后回答一个实际问题：现在该不该装？如果你想研究常驻、多任务、事件驱动的 agent 架构，或者想给一个私有测试仓库配一个「值班 agent」，并且愿意自己排障，值得装，记得用独立系统账号、只接私有仓库、白名单先只放自己。如果你想要开箱即用的东西，或者打算接到生产仓库和公开仓库上，现在不建议，官方自己也不建议。[3][9]

不管装不装，长文都值得读一遍。它最有说服力的不是哪个机制有多巧妙，而是出发点：模型已经不太需要人盯着干活了，接下来要省的是人的注意力。按这个目标去设计，自然会走到 Router、订阅、批处理、存算分离和看门狗这些老办法上。长文结尾说他们没有提出新理论，只是把计算机系统的经典思路搬到了 agent 上。[1] 我觉得这正是它的价值。

## 参考来源

1. DeepSeek Harness 团队，《Super-agent 设计探索：迈向更自主的 Agent 系统》，微信公众号，2026-10-31：<https://mp.weixin.qq.com/s/zoS7GlReWPhfCjENGxXCdg>
2. 同上文英文全译，《Exploring Super-agent Design: Toward More Autonomous Agent Systems》，offloop.org：<https://offloop.org/learn/exploring-deepseek-super-agent-design>
3. deepseek-ai/dsh-superagent-prototype，README：<https://github.com/deepseek-ai/dsh-superagent-prototype>
4. dsh-superagent，`docs/000-philosophy.md`：<https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/docs/000-philosophy.md>
5. dsh-superagent，`docs/002-authorization.md`（observe 模式）：<https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/docs/002-authorization.md>
6. dsh-superagent，`docs/006-deployment.md`（权限与隔离）：<https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/docs/006-deployment.md>
7. Bloomberg，Debby Wu，《DeepSeek Drops Enhanced Coding Agent With Aim to Rival Anthropic》，2026-11-01：<https://www.bloomberg.com/news/articles/2026-11-01/deepseek-drops-enhanced-coding-agent-with-aim-to-rival-anthropic>
8. South China Morning Post，Ben Jiang，《DeepSeek unveils AI 'super agent' in coding race with OpenAI, Anthropic》，2026-11-01：<https://www.scmp.com/tech/article/3372884/deepseek-unveils-ai-super-agent-coding-race-openai-anthropic>
9. AI Code With，《DeepSeek Super-agent 是什么？架构、官方实验数据与 dsh-superagent 原型实测测评》（含完整实验表、GitHub 讨论 #11700/#11706/#11714 与独立安全审计的汇总），2026-11-01：<https://aicodewith.ai/en/blog/deepseek-super-agent-review-dsh-superagent>
10. DEV Community，《DeepSeek's dsh-superagent is a proactive coding agent that waits to be asked》：<https://dev.to/piekwerk/deepseeks-dsh-superagent-is-a-proactive-coding-agent-that-waits-to-be-asked-router-tickets-and-o8m>
11. Hacker News，《DeepSeek open-sources dsh-superagent, a coding agent largely built by agents》：<https://news.ycombinator.com/item?id=50316116>
12. ainews radar，dsh-superagent 传播时间线（含 r/singularity 与 HN 帖子热度）：<https://ainews.leverageai.com.au/case/deepseek-dsh-superagent-prototype>
13. X，@lijiankuan，2026-10-31：<https://x.com/lijiankuan/status/2116565847967924286>
14. IT之家，《DeepSeek 提出 Super-agent 架构设计》：<https://www.ithome.com/1/020/615.htm>
15. Anthropic Engineering，《Scaling Managed Agents: Decoupling the brain from the hands》：<https://www.anthropic.com/engineering/managed-agents>
16. Anthropic，《Introducing Claude Tag》，2026-06-23：<https://www.anthropic.com/news/introducing-claude-tag>
17. VentureBeat，《Anthropic's new Claude Tag update lets its Slack agent read the full conversation and jump in unprompted》：<https://venturebeat.com/orchestration/anthropics-new-claude-tag-update-lets-its-slack-agent-read-the-full-conversation-and-jump-in-unprompted>
18. GitHub Docs，《Kick off a task with Copilot agents on GitHub》：<https://docs.github.com/en/copilot/how-tos/copilot-on-github/use-copilot-agents/kick-off-a-task>
19. ChatGPT Learn，《Review GitHub pull requests with Codex》：<https://learn.chatgpt.com/docs/third-party/github>
