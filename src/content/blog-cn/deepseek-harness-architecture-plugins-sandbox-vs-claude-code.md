---
title: "DeepSeek Harness 架构拆解：主循环、PTC、四种模式、插件与沙箱，以及和 Claude Code、Codex、Pi 怎么选"
seoTitle: "DeepSeek Harness 架构：PTC、插件、沙箱与选型"
description: "DeepSeek Harness 不只是又一个 coding CLI：主循环本身是 Cordis 插件，PTC 让模型写程序调工具，标准/PTC/极简/创造四种模式其实是四份 preset，沙箱、审批和权限预设各管一段。本文按一手文档画出机制地图，对照 Claude Code、Codex CLI、OpenCode、Pi 的架构取舍，给出选型框架、上手步骤和踩坑清单。"
pubDate: 2026-10-13T11:15:00+08:00
author: "Remy"
tags: ["agent-harness", "ai-agents", "deepseek", "developer-tools", "security"]
lang: "zh"
---

8 月 13 日 DeepSeek 在 GitHub 放出 deepseek-harness 仓库，同一天 Hacker News 上「DeepSeek Harness developer preview」一帖拿到 700 多分（截至 10 月 13 日为 747 分）；10 月 2 日桌面版那一帖，评论区有人问了个很朴素的问题：「说到底，harness 是什么？」[1][2] DeepSeek Harness（下文简称 DSH，命令行叫 `dsh`）和 Claude Code、Codex CLI 长得像，骨子里的选择却很不一样：它没有「不能动的核心」，连 agent 主循环都是可替换的插件。[3][4]

这篇不讲桌面版的安装细节（36氪写过 0.1.7-rc 桌面预览）[5]，而是对齐官网、仓库文档、设计笔记和发布说明，回答四件事：主循环怎么转；PTC、四种模式、多 agent、插件、沙箱各在哪一层；它和 Claude Code、Codex CLI、OpenCode、Pi 分歧在哪；什么团队该试、怎么试、盯哪里。[6][7]截至 10 月 13 日，仓库最新标签是 dsh-v0.2.1-alpha.2（北京时间 10 月 9 日 19:09 发布），README 第一屏就写着「开发者预览，会有破坏兼容的改动」，下面所有结论都以这个版本为准。[8][3]

## 先说结论

- **DSH 是可装配的 harness，不是固定产品。** 运行中的 `dsh` 是一棵按配置组装的插件树，模型适配器、工具注册表、会话日志、主循环都是 Cordis 插件。[4]
- **PTC 是 Programmatic Tool Calling（程序化工具调用）**：模型写一段 TypeScript 程序批量调工具，只把打印或返回的结果交回上下文。[9][10]
- **标准、PTC、极简、创造四种模式是四份 agent preset**，共享同一个主循环。[11][10]
- **安全靠三个独立旋钮**：文件沙箱、审批策略、权限预设。文件沙箱**不管网络**，官方也说它未经安全审计。[12][13]
- **适合改造和研究 harness 的团队**；要求稳定的日常工具，现在仍是 Claude Code 或 Codex CLI 更稳妥。

## 一张分层图：从 Cordis 到一次工具调用

DSH 的底座是 Cordis。Cordis 是一个插件框架：插件往共享的 context 里登记服务、事件和「可撤销的副作用」（effect），插件卸载时，这些登记会自动回滚。[4][14] 站内已经有一篇长文专门讲 Cordis 的时空组合（[Cordis 深度解析](/cn/blog/cordis-spatiotemporal-composability-deepseek-harness/)），这里只说一点：没有特权核心，扩展 DSH 的办法永远是「在旁边再挂一个插件」。官网演示的插件页上，「Agent 循环」「子智能体」「终端」和用户自己让 agent 写出来的番茄时钟插件列在同一张清单里。[6]

Cordis 之上是装配层。**profile** 是具名组合，列出叠加的 **bundle** 和用户自己的 `cordis.patch.yml`；bundle 是一组配置行加上它们挂载的代码。随包的 `web`、`headless`、`sdk`、`acp` 都以 `dsh-base` 打底（`sdk-minimal` 自成一体），模型适配、工具、持久化、沙箱与审批、凭据、遥测都在这层。[4] 叠加顺序固定：bundle、profile patch、主目录 patch、命令行 `--patch`，上层可以按 id 整行替换下层，`dsh --profile web --dump-config` 能打印出实际启动的整棵树。[4]

桌面版也只是一个入口：Electron 外壳里跑的是完整的 Web 应用和同一套 profile 启动器。[15]

<figure class="not-prose my-6"><svg viewBox="0 0 600 396" role="img" aria-label="DeepSeek Harness architecture layers" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:600px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor" fill-opacity="0.7"/></marker></defs><text x="10" y="26" font-size="16" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">DeepSeek Harness 分层：从 Cordis 内核到入口</text><rect x="10" y="44" width="430" height="56" rx="8" fill="#3b82f6" fill-opacity="0.14"/><text x="22" y="67" font-size="14.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">入口（surface）</text><text x="22" y="88" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.85">桌面（Electron）· Web · headless · SDK · ACP</text><rect x="10" y="110" width="430" height="56" rx="8" fill="#10b981" fill-opacity="0.16"/><text x="22" y="133" font-size="14.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">Agent preset（模式）</text><text x="22" y="154" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.85">标准 · PTC · 极简 · 创造：各选一组工具和提示词</text><rect x="10" y="176" width="430" height="56" rx="8" fill="#f59e0b" fill-opacity="0.18"/><text x="22" y="199" font-size="14.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">共享层 dsh-base</text><text x="22" y="220" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.85">模型适配 · 工具注册表 · 持久化 · 沙箱与审批 · 凭据 · 遥测</text><rect x="10" y="242" width="430" height="56" rx="8" fill="#94a3b8" fill-opacity="0.18"/><text x="22" y="265" font-size="14.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">装配（profile）</text><text x="22" y="286" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.85">有序 bundle → profile patch → 主目录 patch → --patch</text><rect x="10" y="308" width="430" height="56" rx="8" fill="#3b82f6" fill-opacity="0.3"/><text x="22" y="331" font-size="14.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">Cordis 内核</text><text x="22" y="352" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.85">插件 · 服务 · 事件 · 卸载时自动回滚的 effect</text><rect x="452" y="44" width="138" height="318" rx="8" fill="#8b5cf6" fill-opacity="0.12" stroke="#8b5cf6" stroke-width="1.5"/><text x="521" y="70" font-size="14.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">会话日志</text><text x="521" y="90" font-size="12" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.8">（只追加）</text><text x="521" y="122" font-size="12.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">模型看到的</text><text x="521" y="142" font-size="12.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">都要记下来</text><text x="521" y="182" font-size="12.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">fork · resume</text><text x="521" y="202" font-size="12.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">搜索 · 回放</text><text x="521" y="222" font-size="12.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">遥测</text><text x="521" y="262" font-size="12.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">主循环本身</text><text x="521" y="282" font-size="12.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">也是插件</text><text x="10" y="384" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.7">任一层的配置行都能被更上层按 id 整行替换</text></svg></figure>

*图：DSH 的分层。每层都是 Cordis 插件或插件配置，右侧的会话日志是所有回放和遥测的来源 [4]*

## 主循环：turn、step 和「模型看见的都要记下来」

DSH 文档把一次交互拆成两个单位：**step** 是一次模型请求加上它调用的工具；**turn** 是零个或多个 step，从领取第一条输入开始，到「没有欠着的工作」为止。[4] 一个 step 大致是：领取输入，组装提示词和工具 schema，过 `agent/pre-step`（插件可改写或拒绝输入）和 `agent/request`（决定路由），冻结请求后流式调用模型；工具调用依次过 `tools/pre-execute`、`tools/execute`、`tools/post-execute`，写成 `tool/result`。[4] `turn/*`、`tool/*` 这类是写进日志的持久事件，`agent/*`、`tools/*` 这类是运行时拦截点，多数是瀑布式的，监听者调用 `next()` 才往下传。所以改行为不是改循环，而是挂到某个拦截点上。

更值得注意的是会话日志的地位。架构文档里有一句话：**Model-visible means logged**，模型能看到的一切都必须能从日志重建。系统提示词、推理、工具调用和结果、子 agent 调度、每一次上下文注入，都写进只追加的会话日志；fork、resume、搜索、回放、遥测都从这份日志派生。[4][1] HN 上有位开发者说这是「杀手级功能」：闭源模型的推理痕迹常被加密或隐藏，而想改进工具链，得先看清模型以为发生了什么。[16]

[![Hacker News 评论截图：SwellJoe 认为 append-only 会话日志是杀手级功能](/assets/deepseek-harness-architecture-plugins-sandbox-vs-claude-code/hn-swelljoe-session-log-killer-feature.webp)](https://news.ycombinator.com/item?id=49288435)

*截图：SwellJoe 引用官网「Every run is traceable」一段并说明为什么重要（Hacker News 原帖，2026-10 截取）[16]*

这个原则也约束别的子系统。上下文压缩是可选能力，开始和结束各写一条带锁的日志事件，中途崩溃会留下「有开始没结束」的孤儿锁，而不是谎称完成。[17] 内置 preset 还挂了工具结果裁剪器，配置是阈值 8192 字符、保留头部 4096 和尾部 1024 字符。[11]

## PTC：模型写程序调工具

先把缩写落实。仓库里 8 月 25 日的一条设计笔记写明：这个功能原名 Code Mode，统一改名为 PTC（programmatic tool calls），面向用户的叫法是「PTC 模式」；界面内的模式说明也写着「PTC 是 Programmatic Tool Calling，即通过程序调用工具」。[9][10]

设计笔记说得直白：普通方式下模型每步发一个工具调用，每个中间结果都要在下一次请求时塞回上下文，多步工具活又费 token 又串行，想遍历、分支、扇出再汇总，每一步都得跑一次模型往返。[18] 出发点是 Cloudflare 的 Code Mode：模型见过的真实代码远多于人造的工具调用轨迹，写代码比填参数更顺手。[18][19]

DSH 的做法分三步：[18]

1. **工具注册表自己决定呈现方式。** 配置 `mode` 只有 `native` 和 `ptc` 两个值。`ptc` 下，模型看到的工具清单里只剩一个保留工具 `run_code`（参数是 `code` 和 `description`），其余工具以生成的 TypeScript 声明写进系统提示词。0.2.1-alpha.2 删掉了原来的混合模式，现在一个 agent 要么全原生、要么全 PTC。[8]
2. **代码执行是一个独立的能力接口。** `ctx.ptcRuntime` 只管「给我一段程序和一组具名异步函数，跑完告诉我结果」，不知道工具是什么；语言和执行环境都是实现细节，后来又加了 Python 版本。[20][8]
3. **随包的实现是一次一个新的 Node 进程。** 每段程序都在一个全新的 Node 进程里跑，程序的全局状态每次都是新的，并受调用方会话的沙箱策略约束；工具调用走一条和 stdout 分开的控制通道，宿主校验每一帧再派发。[18]

<figure class="not-prose my-6"><svg viewBox="0 0 600 380" role="img" aria-label="native vs PTC tool calling" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:600px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor" fill-opacity="0.7"/></marker></defs><text x="10" y="26" font-size="16" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">原生工具调用 vs PTC（程序化工具调用）</text><text x="150" y="54" font-size="13.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">原生：一次调用一次往返</text><rect x="95" y="66" width="110" height="26" rx="5" fill="#3b82f6" fill-opacity="0.8"/><text x="150" y="84" font-size="12.5" text-anchor="middle" font-weight="bold" fill="#fff" fill-opacity="1">模型</text><line x1="150" y1="93" x2="150" y2="103" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.6" marker-end="url(#ah)"/><rect x="95" y="104" width="110" height="26" rx="5" fill="#f59e0b" fill-opacity="0.85"/><text x="150" y="122" font-size="12.5" text-anchor="middle" font-weight="bold" fill="#fff" fill-opacity="1">工具 A</text><line x1="150" y1="131" x2="150" y2="141" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.6" marker-end="url(#ah)"/><text x="212" y="141" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">结果回上下文</text><rect x="95" y="142" width="110" height="26" rx="5" fill="#3b82f6" fill-opacity="0.8"/><text x="150" y="160" font-size="12.5" text-anchor="middle" font-weight="bold" fill="#fff" fill-opacity="1">模型</text><line x1="150" y1="169" x2="150" y2="179" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.6" marker-end="url(#ah)"/><rect x="95" y="180" width="110" height="26" rx="5" fill="#f59e0b" fill-opacity="0.85"/><text x="150" y="198" font-size="12.5" text-anchor="middle" font-weight="bold" fill="#fff" fill-opacity="1">工具 B</text><line x1="150" y1="207" x2="150" y2="217" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.6" marker-end="url(#ah)"/><text x="212" y="217" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">结果回上下文</text><rect x="95" y="218" width="110" height="26" rx="5" fill="#3b82f6" fill-opacity="0.8"/><text x="150" y="236" font-size="12.5" text-anchor="middle" font-weight="bold" fill="#fff" fill-opacity="1">模型</text><line x1="150" y1="245" x2="150" y2="255" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.6" marker-end="url(#ah)"/><rect x="95" y="256" width="110" height="26" rx="5" fill="#f59e0b" fill-opacity="0.85"/><text x="150" y="274" font-size="12.5" text-anchor="middle" font-weight="bold" fill="#fff" fill-opacity="1">工具 C</text><line x1="150" y1="283" x2="150" y2="293" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.6" marker-end="url(#ah)"/><text x="212" y="293" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">结果回上下文</text><rect x="95" y="294" width="110" height="26" rx="5" fill="#3b82f6" fill-opacity="0.8"/><text x="150" y="312" font-size="12.5" text-anchor="middle" font-weight="bold" fill="#fff" fill-opacity="1">模型</text><text x="150" y="340" font-size="12" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">中间结果全部进上下文</text><text x="150" y="356" font-size="12" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">多步组合靠多轮模型请求</text><line x1="300" y1="44" x2="300" y2="372" stroke="currentColor" stroke-opacity="0.18"/><text x="450" y="54" font-size="13.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">PTC：一段程序编排多次调用</text><rect x="395" y="66" width="110" height="26" rx="5" fill="#3b82f6" fill-opacity="0.8"/><text x="450" y="84" font-size="12.5" text-anchor="middle" font-weight="bold" fill="#fff" fill-opacity="1">模型</text><line x1="450" y1="93" x2="450" y2="106" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.6" marker-end="url(#ah)"/><rect x="320" y="108" width="260" height="150" rx="8" fill="#10b981" fill-opacity="0.12" stroke="#10b981" stroke-width="1.5"/><text x="332" y="128" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">run_code：一段 TypeScript（新 Node 进程）</text><rect x="334" y="140" width="110" height="26" rx="5" fill="#f59e0b" fill-opacity="0.85"/><text x="389" y="158" font-size="12" text-anchor="middle" font-weight="bold" fill="#fff" fill-opacity="1">tools.a()</text><rect x="456" y="140" width="110" height="26" rx="5" fill="#f59e0b" fill-opacity="0.85"/><text x="511" y="158" font-size="12" text-anchor="middle" font-weight="bold" fill="#fff" fill-opacity="1">tools.b()</text><text x="450" y="182" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">只读调用可以 Promise.all 并行</text><rect x="395" y="192" width="110" height="26" rx="5" fill="#ef4444" fill-opacity="0.8"/><text x="450" y="210" font-size="12" text-anchor="middle" font-weight="bold" fill="#fff" fill-opacity="1">tools.c()</text><text x="450" y="234" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">有副作用的调用按提交顺序单独执行</text><text x="450" y="250" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">过滤 · 汇总 · 出错重试由程序处理</text><line x1="450" y1="259" x2="450" y2="274" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.6" marker-end="url(#ah)"/><rect x="345" y="276" width="210" height="26" rx="5" fill="#3b82f6" fill-opacity="0.8"/><text x="450" y="294" font-size="12" text-anchor="middle" font-weight="bold" fill="#fff" fill-opacity="1">只把打印或返回值交回模型</text><text x="450" y="324" font-size="12" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">每个子调用仍过完整工具管线</text><text x="450" y="340" font-size="12" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">并写一条 tool/ptc-dispatch 日志</text></svg></figure>

*图：原生工具调用与 PTC 的差别。PTC 下模型只看到 run_code，程序内的子调用仍受权限管控并记日志 [18]*

它和「给模型一个 bash」的区别在细节里。程序里的每次工具调用都重走完整的工具管线，权限和审批照样生效，每个子调用还写一条 `tool/ptc-dispatch` 日志。互不依赖的只读调用可以 `Promise.all` 并行，有副作用的按提交顺序逐个执行。失败的程序不会自动重跑，因为前面的副作用可能已落地；也不提供跨 `run_code` 保留状态的常驻内核，因为那种状态不在日志里，请求就没法重建。[18] 失败类型分成超时、主动取消、进程死亡、沙箱建不起来等八种，互不混淆。[20]

和 Pi 的 Codemode 思路同源、落点不同。Pi 把脚本放进 QuickJS，没有 Node API、文件系统、网络和定时器，只能通过 `tools` 和 `models` 碰外界；DSH 给程序一个真 Node 进程，再用操作系统级沙箱框住它，笔记专门否掉了「用 `node:vm` 当安全机制」，因为语言层隔离管不住直接的文件和进程操作。[21][18] Codemode 的细节见站内 [Pi 1.0 那篇](/cn/blog/pi-1-0-codemode-mcp-minimal-harness/)。

官方的期待很克制：标准模式同样能写脚本批处理，PTC 只是换了组织工具调用的方式，速度和 token 用量取决于任务和程序怎么处理结果。示例都是「中间数据多、只要汇总」的活，比如按 schema 检查一批 JSON、给日志错误分组计数。[10]

## 四种模式：其实是四份 preset

36氪把 Agent 模式下的四个档位叫作标准、PTC、极简、创造。[5] 到仓库里看，它们是 `web-app` bundle 下的四个 patch 文件，每个都声明一个 `dsh-agent-preset`，id 分别是 `standard`、`ptc`、`minimal`、`cordis`（界面上叫创造模式），排序 1 到 4。[11] preset 决定这个 agent 看到哪些工具、提示词和技能，主循环是同一个。

| 模式（preset id） | 装了什么 | 官方建议的用途 |
| --- | --- | --- |
| 标准（standard） | shell、文件读写与搜索、后台与定时任务、技能、计划模式、压缩、子 agent 与工作流、网页工具 | 日常任务的默认起点 |
| PTC（ptc） | 与标准相近，工具呈现改为 `ptc`，工作流工具关闭 | 需要程序汇总的批处理 |
| 极简（minimal） | 一个持久 shell 加固定提示词，不加载技能、计划和压缩 | 对照实验的基线 |
| 创造（cordis） | 标准工具加运行时检查、插件管理和插件编写指南 | 让 agent 写插件、做自己的模式 |

*表：四种内置模式的组成，依据 preset 配置文件与界面说明 [11][10]*

两处设计值得记下。计划模式不换工具，而是一组隔离插件加一段提示词：为了请求缓存稳定，工具目录在各模式间保持一致，靠规则约束模型不改文件，直到用户通过 `exit_plan_mode` 批准。[11] 极简模式的说明则提醒：比较模式时要固定模型、权限、输入和起始工作区，工具少不等于更适合新手。[10]

创造模式最能体现「一切皆插件」。官网演示里，一句「帮我写一个番茄时钟插件」，agent 加载 `cordis-plugin-development` 技能、查询运行时插槽、写文件、通过插件管理器安装并验证，用了 5 分 24 秒。[6] HN 上也有用户让它写了调字号、任务完成响铃的插件。[2]

## 多 agent：同一个接口后面挂不同的执行者

DSH 的子 agent 是一个统一的委派接口，后面挂不同的 provider。本地的 `spawn`（新开一个子 agent）和 `fork`（从当前会话分叉）会保留持久会话，之后还能继续发消息；ACP、DSH SDK、Codex、Claude Code 这几类则是一次性执行。[22] 内置 preset 里，子 agent 工具默认拒绝四个定时任务工具，免得子 agent 自己去排日程。[11]

容易被忽略的是：DSH 能把任务委派给**真正的** Claude Code 或 Codex。对应组合包会在父会话的工作区里起一个全新的无人值守会话，执行一个自包含的任务，只交回最终答案或失败诊断；推理、工具流量和工作区 diff 都不进父会话，鉴权沿用各自的原生配置。[23][24] 0.2.1-alpha.2 把它们放进了官方插件列表。[8] DSH 想当的是「调度别的 harness 的 harness」。

再往上是实验性的 Agent Teams：根会话当 Lead，队员有持久的名册和任务状态，消息直接投进对方收件箱。[25] HN 上有用户说父子 agent 能双向中途通信，主线程还能继续对话。[2]

## 「一切皆插件」落到工程上

架构文档里有一张「新行为放哪」的表，读起来就是 DSH 的扩展地图：加模型提供方，就在 `ctx.llm` 上注册适配器；加一个模型能用的能力，就在 `ctx.tools` 上注册；限制子进程，就用 `ctx.sandbox` 后端包住 argv；拦截请求、工具或整轮，就挂对应的 `agent/*` 或 `tools/*` 事件；加持久的会话状态，就扩展会话事件表，从日志渲染和回放。[4] 背后的概念叫 capability seam：一个能力拆成接口定义、实现、使用者三方，各自可换。比如把文件系统和子进程的 provider 指向远程沙箱，Bash、PTY、LSP 就一起搬过去了。[4]

对在 Claude Code 或 Codex 上积累过配置的团队，DSH 准备了桥：`dsh-hooks-claude-code` 直接跑现有的 Claude Code `hooks.json`，`dsh-hooks-codex` 支持 Codex 的五个 hook 点。[26][27] 0.2.1-alpha.1 加的实验性 Claude Code Mods 兼容层，发布说明直言主要是验证其 API 大致是 DSH 插件能力的子集，不是完整兼容。[8]

代价也有。HN 上一位长期用户说：「一切」包括核心功能时，想调整现有行为仍得给核心插件维护下游补丁，他手上大约 25 个下游提交、0 个新插件。[28] 插件就是代码，官方安全声明也把不可信插件列进了风险。[13]

## 沙箱与权限：三个旋钮，各管一段

**第一个旋钮是文件沙箱模式**，三个值：`read-only` 拒绝写入，`workspace-write` 允许写工作区和临时目录，`danger-full-access` 不加限制。本地后端在 Linux 用 bwrap 加 Landlock，macOS 用 Seatbelt，Windows 用 ACL 受限令牌；SSH 场景交给远端执行同一策略。[12] 文档写明：这个模式**只管文件副作用，网络和进程可见性不在其中**；强制是否完整单独上报，老版本 Landlock 和 Windows ACL 都只能部分强制。[12]

**第二个旋钮是审批策略**，只有 `ask` 和 `never`：`ask` 交给已注册的回答者（比如 Web 弹窗），没有回答者时结果是 `unavailable`；`never` 直接拒绝。四种结果里只有 `allowed-once` 放行，且只放行这一次。[29]

**第三个是权限预设**，把前两个打包成一个选择：Web 默认「仅可查看」「工作区内修改」「完全权限」三档。实验性的「自动审查」让当前模型在每次工具调用前评估，通过就以完全权限执行，不通过再问用户；说明里直言它可能放过不安全的动作，还会多花 token。[30][31] 新会话默认 `workspace-write` 加 `ask`；环境变量 `DSH_PERMISSION_MODE` 设成 `danger-full-access` 时，审批自动变成 `never`。[32]

<figure class="not-prose my-6"><svg viewBox="0 0 600 424" role="img" aria-label="permission flow for a tool call" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:600px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor" fill-opacity="0.7"/></marker></defs><text x="10" y="26" font-size="16" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">一次工具调用经过的权限关口</text><rect x="150" y="44" width="300" height="34" rx="6" fill="#94a3b8" fill-opacity="0.16" stroke="#94a3b8" stroke-width="1.5"/><text x="300.0" y="66" font-size="12.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">tool/call 先写进会话日志</text><line x1="300.0" y1="79" x2="300.0" y2="92" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.6" marker-end="url(#ah)"/><rect x="150" y="94" width="300" height="34" rx="6" fill="#f59e0b" fill-opacity="0.16" stroke="#f59e0b" stroke-width="1.5"/><text x="300.0" y="116" font-size="12.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">tools/pre-execute：hook · 权限 · 沙箱</text><line x1="300.0" y1="129" x2="300.0" y2="142" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.6" marker-end="url(#ah)"/><rect x="150" y="144" width="300" height="34" rx="6" fill="#f59e0b" fill-opacity="0.16" stroke="#f59e0b" stroke-width="1.5"/><text x="300.0" y="166" font-size="12.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">注册的守卫：拒绝或弃权</text><line x1="300.0" y1="179" x2="300.0" y2="192" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.6" marker-end="url(#ah)"/><rect x="150" y="194" width="300" height="34" rx="6" fill="#8b5cf6" fill-opacity="0.16" stroke="#8b5cf6" stroke-width="1.5"/><text x="300.0" y="216" font-size="12.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">需要审批 → ctx.approval</text><line x1="300.0" y1="229" x2="300.0" y2="242" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.6" marker-end="url(#ah)"/><rect x="150" y="244" width="300" height="34" rx="6" fill="#10b981" fill-opacity="0.16" stroke="#10b981" stroke-width="1.5"/><text x="300.0" y="266" font-size="12.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">tools/execute：沙箱后端包装 argv 再起子进程</text><line x1="300.0" y1="279" x2="300.0" y2="292" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.6" marker-end="url(#ah)"/><rect x="150" y="294" width="300" height="34" rx="6" fill="#f59e0b" fill-opacity="0.16" stroke="#f59e0b" stroke-width="1.5"/><text x="300.0" y="316" font-size="12.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">tools/post-execute：放行 · 拦截 · 改写</text><line x1="300.0" y1="329" x2="300.0" y2="342" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.6" marker-end="url(#ah)"/><rect x="150" y="344" width="300" height="34" rx="6" fill="#3b82f6" fill-opacity="0.2" stroke="#3b82f6" stroke-width="1.5"/><text x="300.0" y="366" font-size="12.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">tool/result 交给模型</text><line x1="450" y1="211" x2="468" y2="211" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.6" marker-end="url(#ah)"/><rect x="470" y="154" width="122" height="114" rx="6" fill="#ef4444" fill-opacity="0.1" stroke="#ef4444" stroke-width="1.5"/><text x="531" y="174" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">ask → 问回答者</text><text x="531" y="192" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">never → 拒绝</text><text x="531" y="210" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">无回答者 →</text><text x="531" y="228" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">unavailable → 拒绝</text><text x="531" y="246" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">只有 allowed-once</text><text x="531" y="264" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">放行这一次</text><rect x="8" y="44" width="132" height="300" rx="6" fill="#94a3b8" fill-opacity="0.1"/><text x="74" y="66" font-size="13.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">三个旋钮</text><text x="74" y="90" font-size="12.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">沙箱模式</text><text x="74" y="109" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">read-only</text><text x="74" y="128" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">workspace-write</text><text x="74" y="147" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">danger-full-access</text><text x="74" y="166" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">（只管文件）</text><text x="74" y="204" font-size="12.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">审批策略</text><text x="74" y="223" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">ask / never</text><text x="74" y="261" font-size="12.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">权限预设</text><text x="74" y="280" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">仅可查看</text><text x="74" y="299" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">工作区内修改</text><text x="74" y="318" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">完全权限</text><text x="10" y="412" font-size="12" text-anchor="start" font-weight="bold" fill="#ef4444" fill-opacity="1">网络与进程可见性不在沙箱模式的范围内</text></svg></figure>

*图：一次工具调用的权限关口，以及三个各管一段的旋钮 [33][12][29]*

放回一次工具调用里看：调用先写日志，过 `tools/pre-execute` 和守卫，需要审批的交给 `ctx.approval`，回答不了就拒绝；执行时 shell 类工具先让沙箱后端包装命令；结果经 `tools/post-execute` 可能被拦截或改写，最后成为 `tool/result`。[33] PTC 程序也受同一会话沙箱策略约束，子调用各走一遍这条管线。[18]

还有遥测。HN 桌面版讨论里有用户发现桌面版默认开启遥测，而 `dsh web` 只在用户主动反馈时上报，并贴出了首次启动前关闭相关插件的配置。[28] 官方文档与此一致：产品分析事件由 Desktop 采集，并跟随应用里的开关，普通 Web 客户端不采集产品事件；会话日志类遥测默认是「仅反馈」模式，设置 `DSH_TELEMETRY_DISABLED` 为任意非空值可以让进程退出这类遥测。[34][15][32]

[![Hacker News 评论截图：wren6991 指出桌面版默认开启遥测，并提到约 25 个下游提交](/assets/deepseek-harness-architecture-plugins-sandbox-vs-claude-code/hn-wren6991-desktop-telemetry-patches.webp)](https://news.ycombinator.com/item?id=49933838)

*截图：wren6991 关于桌面版默认遥测和「核心插件要维护下游补丁」的评论（Hacker News 原帖，2026-10 截取）[28]*

## 和 Claude Code、Codex CLI、OpenCode、Pi 放在一起看

下面这张表只比较架构选择，不比较模型效果；每格都对应表下列出的官方文档，没核对过的格子直接写「本文未核对」。

| 维度 | DeepSeek Harness | Claude Code | Codex CLI | OpenCode | Pi |
| --- | --- | --- | --- | --- | --- |
| 核心与扩展 | 插件树，主循环也可替换 | 固定核心；插件打包 skills、agents、hooks、MCP | 固定核心；有 `hooks.json` 式 hook | 固定核心；可写插件 | 刻意做小的核心，靠扩展 |
| 程序化工具调用 | PTC：整 agent 切换，Node 进程跑在 OS 沙箱里 | 本文未核对 | 本文未核对 | 本文未核对 | Codemode：QuickJS，无 Node API |
| 操作系统沙箱 | 只管文件：bwrap+Landlock / Seatbelt / Windows ACL | 默认关闭；Seatbelt 或 bubblewrap，网络走代理按域名放行 | 默认无网络、写限于工作区；Seatbelt，Linux 用 bwrap+seccomp | 本文未查到内置 OS 沙箱 | 无，建议整进程放容器 |
| 审批与权限 | `ask`/`never` 加三档预设，自动审查实验中 | 多种模式，含 plan、acceptEdits、bypassPermissions 和分类器驱动的 auto | 沙箱模式加审批策略（如 on-request） | 按工具 allow/ask/deny | 无内置 |
| 多 agent | spawn/fork 可续聊；可委派给 Claude Code、Codex | subagent 独立上下文，默认最多嵌套三层 | 本文未核对 | primary agent 加 subagent | 核心不带 |
| 形态 | Web、桌面、headless、SDK、ACP | CLI 与 IDE 等 | CLI 与 IDE 扩展 | 终端等 | CLI、SDK、RPC |

*表：五种 harness 的架构选择对照。DSH 见 [4][18][12][29][22]；Claude Code 见 [35][36][37][38]；Codex 见 [39][27]；OpenCode 见 [40][41]；Pi 见 [21][42]*

这张表能读出三条分歧线。

**第一条是核心能不能换。** Claude Code、Codex、OpenCode 都有稳定核心，扩展挂在外围；Pi 核心小但仍是核心；DSH 连循环都能换，代价是改默认行为要维护补丁。HN 上有人说它可能成为「harness 里的 Emacs」，也有人认为模型越强 harness 越薄，最后剩下 Pi 那么点。[2] 取决于你押模型补全一切，还是押工程控制面越来越重要。

**第二条是隔离放在哪层。** Pi 把隔离做在脚本语言里，不管进程权限；DSH 和 Codex 交给 OS；Claude Code 的沙箱默认关闭，开启后网络也走代理白名单。[42][39][36] 如果你更怕数据外流而不是误删文件，DSH 当前的文件沙箱不够，外层得加网络隔离。站内 [DSec 那篇](/cn/blog/deepseek-dsec-agent-rl-sandbox-execution-layer/) 讲的是 DeepSeek 训练侧沙箱，别混为一谈。

**第三条是可观测性。** DSH 把「模型看到的都要记下来」当成不变量。[4] 对照站内拆过的 [Claude Code agent harness](/cn/blog/inside-claude-code-agent-harness/) 那套上下文管理、流式执行、恢复阶梯：后者解决循环怎么稳，DSH 额外强调循环怎么查。

## 什么团队适合用：一个选型框架

| 你的情况 | 建议 |
| --- | --- |
| 想把 harness 当平台改：换循环、加界面、做自定义模式 | DSH，创造模式能让 agent 直接写插件 |
| 做 harness 研究或对照实验 | DSH 极简模式当基线 |
| 「读很多、汇总一点」的批处理 | DSH 的 PTC 或 Pi 的 Codemode，先用小任务量 token |
| 团队要稳定的日常 coding 工具 | 先用 Claude Code 或 Codex CLI |
| 怕数据外流，或要跑不可信仓库 | 外层先上虚拟机或容器 |
| 已有 Claude Code / Codex hooks | 可用 DSH 的桥接试迁移，只覆盖 command hook 子集 |
| 面向客户的生产 agent | 暂不建议，官方说它不是生产就绪 |

*表：选型框架。依据上文各节与官方安全声明 [13][26]*

还有模型这个现实因素。DSH 内置 DeepSeek 直连适配器，也能经 pi-ai 接 Anthropic、OpenAI、Kimi、GLM 等，或按 OpenAI Chat Completions、OpenAI Responses、Anthropic Messages 三种协议接自建网关；OAuth 登录的提供方（如 Codex）暂不支持。[43] 桌面版没有额度时需要充值并实名认证，也可以直接填 API key。[5]

## 上手：一条可复现的试用路径

步骤只用官方文档出现过的命令和参数，最好在虚拟机或单独账户里做。

第一步，确认 Node 版本。仓库的 `package.json` 要求 Node 22.19 以上的 22.x，或者 24 及以上。[44]

```bash
node --version
mkdir -p ~/dsh-trial && cd ~/dsh-trial
git init
```

第二步，启动 Web UI。默认监听本机 3080 端口，`--no-open` 表示不自动打开浏览器。[3][45]

```bash
npx @deepseek-ai/dsh web --no-open
```

在 Settings → Models 填 DeepSeek API key（密钥写进 DSH 主目录的凭据文件），再用 Choose workspace 选中刚才的目录。[43]

第三步，把实际启动的插件树存档，排查问题时用得上。[4]

```bash
npx @deepseek-ai/dsh --profile web --dump-config > dsh-tree.txt
```

第四步，用 headless 做可脚本化试跑，先只读，`--json` 输出逐行事件流。[46][45]

```bash
DSH_PERMISSION_MODE=read-only npx @deepseek-ai/dsh headless --json "总结这个仓库的主要模块"
```

第五步，按官方建议做模式对照：同一个小 bug，固定模型、权限和起始状态，在标准和极简模式各跑一遍，比较完成情况、工具调用次数和改动。[10] 试 PTC 可在 headless 下用 `DSH_TOOLS_MODE=ptc` 打开。[46]

```bash
DSH_TOOLS_MODE=ptc npx @deepseek-ai/dsh headless "按 schema.json 检查 configs/ 下的 JSON，问题写到 issues.csv，不改原文件"
```

第六步，不想上报遥测就在启动前设环境变量；桌面版再到设置里核对开关。[32][15]

```bash
DSH_TELEMETRY_DISABLED=1 npx @deepseek-ai/dsh web --no-open
```

## 试的时候盯住这些坑

- [ ] **记下版本号。** 预览期几天一个标签，0.2.1-alpha.2 就删了混合工具模式。[8]
- [ ] **网络不在沙箱里。** 文件沙箱只管写文件，需要防外流就在外层做网络隔离。[12]
- [ ] **确认强制是否完整。** 老内核 Landlock 和 Windows ACL 只能部分强制。[12]
- [ ] **没有回答者时的审批。** `ask` 找不到回答者就是 `unavailable`，等于拒绝；无界面跑 headless 或 CI 时别误判成任务失败（按文档推断，未实测）。[29]
- [ ] **别轻易开完全权限。** `danger-full-access` 下审批变成 `never`，没有确认环节。[32]
- [ ] **PTC 的副作用不回滚。** 失败的程序不重放，但已执行的写操作可能已落地。[18]
- [ ] **自动审查只是实验功能。** 它可能放过危险动作，也会额外消耗 token。[31]
- [ ] **委派给 Claude Code 或 Codex 时自己看 diff。** 子会话的工作区改动不会进父会话。[23]
- [ ] **插件就是代码。** 只从官方渠道下载，第三方插件先读源码；HN 上有人提到过用相近域名的第三方打包站。[13][2]
- [ ] **改核心行为要准备维护补丁。** 按 id 替换核心插件很容易，但升级时得自己合并。[28]
- [ ] **从源码构建的体积。** 有 HN 用户反馈下载约 47MB，构建后约 1.5GB，主要是依赖。[1]
- [ ] **别当唯一安全控制。** 官方建议最小权限运行、优先一次性虚拟机或容器、保留备份、运行前审查插件和命令。[13]

## 结语

DeepSeek Harness 最值得看的不是桌面安装包，而是它把 harness 拆成了可以逐层替换的零件：主循环是插件，工具呈现方式是注册表的一个配置，模式是 preset，安全是三个各管一段的旋钮，而这一切都以一份可回放的会话日志为准。想自己造或认真比较 harness 的团队，可以拿它当底座；只想要稳定 coding 助手的团队，等它出了预览期再说不迟。

## 参考来源

1. Hacker News.「DeepSeek Harness developer preview」讨论串（2026-08-13）：<https://news.ycombinator.com/item?id=49285244>
2. Hacker News.「DeepSeek Harness Desktop for macOS and Windows」讨论串（2026-10-02）：<https://news.ycombinator.com/item?id=49929489>
3. deepseek-ai/deepseek-harness. README（仓库首页，MIT）：<https://github.com/deepseek-ai/deepseek-harness>
4. deepseek-ai/deepseek-harness. docs/architecture.md（架构文档）：<https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md>
5. AI 前线 / 36氪.《刚刚，DeepSeek Harness桌面预览版上线！》（2026-09-25）：<https://eu.36kr.com/zh/p/3998199345500040>
6. DeepSeek. DeepSeek Harness 官网（中文页）：<https://www.deepseek.com/harness>
7. DeepSeek. DeepSeek Harness 官网（英文页）：<https://www.deepseek.com/en/harness/>
8. deepseek-ai/deepseek-harness. Releases（含 dsh-v0.2.1-alpha.1 / alpha.2 更新说明）：<https://github.com/deepseek-ai/deepseek-harness/releases>
9. deepseek-ai/deepseek-harness. Agent Note：Rename code-mode to ptc（2026-08-25）：<https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/archived/architecture/2026-08-25-rename-code-mode-to-ptc.md>
10. deepseek-ai/deepseek-harness. 内置模式说明文案 guide-locales.ts：<https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-agent-preset/src/client/guide-locales.ts>
11. deepseek-ai/deepseek-harness. packages/bundle/web-app/presets（四份内置 preset 配置）：<https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/bundle/web-app/presets>
12. deepseek-ai/deepseek-harness. docs/subsystems/sandbox.md：<https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/sandbox.md>
13. deepseek-ai/deepseek-harness. SAFETY.md（安全声明）：<https://github.com/deepseek-ai/deepseek-harness/blob/master/SAFETY.md>
14. Cordis 论文：A Programming Paradigm for Spatiotemporal Composability（arXiv 2608.25512）：<https://arxiv.org/abs/2608.25512>
15. deepseek-ai/deepseek-harness. apps/desktop README：<https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/desktop/README.md>
16. Hacker News. SwellJoe 评论：append-only 会话日志是「杀手级功能」：<https://news.ycombinator.com/item?id=49288435>
17. deepseek-ai/deepseek-harness. docs/subsystems/compaction.md：<https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/compaction.md>
18. deepseek-ai/deepseek-harness. Agent Note：PTC mode（2026-06-15）：<https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/feature/2026-06-15-ptc.md>
19. Cloudflare. Code Mode（PTC 设计说明引用的出发点）：<https://blog.cloudflare.com/code-mode/>
20. deepseek-ai/deepseek-harness. docs/subsystems/ptc-runtime.md：<https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/ptc-runtime.md>
21. Pi Documentation. Codemode：<https://pi.dev/docs/latest/codemode>
22. deepseek-ai/deepseek-harness. packages/subagent/subagent README：<https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/subagent/subagent/README.md>
23. deepseek-ai/deepseek-harness. dsh-subagent-claude-code README：<https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/subagent/subagent-claude-code/README.md>
24. deepseek-ai/deepseek-harness. dsh-subagent-codex README：<https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/subagent/subagent-codex/README.md>
25. deepseek-ai/deepseek-harness. docs/subsystems/agent-team.md：<https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/agent-team.md>
26. deepseek-ai/deepseek-harness. dsh-hooks-claude-code README：<https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/experimental/hooks-claude-code/README.md>
27. deepseek-ai/deepseek-harness. dsh-hooks-codex README：<https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/experimental/hooks-codex/README.md>
28. Hacker News. wren6991 评论：Desktop 默认遥测与「25 个下游提交、0 个新插件」：<https://news.ycombinator.com/item?id=49933838>
29. deepseek-ai/deepseek-harness. docs/subsystems/approval.md：<https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/approval.md>
30. deepseek-ai/deepseek-harness. dsh-client-ui-permission-presets README：<https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-permission-presets/README.md>
31. deepseek-ai/deepseek-harness. dsh-experimental-auto-review README：<https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/experimental/auto-review/README.md>
32. deepseek-ai/deepseek-harness. packages/bundle/base/cordis.patch.yml（共享默认配置）：<https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/base/cordis.patch.yml>
33. deepseek-ai/deepseek-harness. docs/tool-execution-pipeline.md：<https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/tool-execution-pipeline.md>
34. deepseek-ai/deepseek-harness. docs/subsystems/product-telemetry.md：<https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/product-telemetry.md>
35. Anthropic. Claude Code Docs：Plugins：<https://code.claude.com/docs/en/plugins>
36. Anthropic. Claude Code Docs：Sandboxing：<https://code.claude.com/docs/en/sandboxing>
37. Anthropic. Claude Code Docs：Permissions：<https://code.claude.com/docs/en/permissions>
38. Anthropic. Claude Code Docs：Subagents：<https://code.claude.com/docs/en/sub-agents>
39. OpenAI. Codex Docs：Sandbox and approvals：<https://developers.openai.com/codex/sandbox>
40. OpenCode Docs：Permissions：<https://opencode.ai/docs/permissions/>
41. OpenCode Docs：Agents：<https://opencode.ai/docs/agents/>
42. earendil-works/pi. README（Permissions & Containerization 一节）：<https://github.com/earendil-works/pi>
43. deepseek-ai/deepseek-harness. docs/user/guide/providers.md（模型配置）：<https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/providers.md>
44. deepseek-ai/deepseek-harness. package.json（engines 字段）：<https://github.com/deepseek-ai/deepseek-harness/blob/master/package.json>
45. deepseek-ai/deepseek-harness. docs/cli-help.md：<https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cli-help.md>
46. deepseek-ai/deepseek-harness. dsh-headless README：<https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/headless/README.md>
