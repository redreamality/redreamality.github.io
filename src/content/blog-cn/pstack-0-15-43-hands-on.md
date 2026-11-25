---
title: "Claude Code 装 pstack 0.15.43 实测：路由封顶 xhigh、unlimited 变 large、Orchestrate 去了哪"
description: "pstack 0.15.43 把 skill 文本砍掉约两成，默认路由改成 Opus 5.5 且任何角色不超过 xhigh，删除 Orchestrate playbook，新增 worker.md。本文在 Claude Code 里真装一遍，统计 0.15.32 到 0.15.43 的字数变化，走一遍 /setup-pstack 的旧规则迁移，并跑仓库自带的检查和测试。"
author: Remy
pubDate: 2026-11-17T09:30:00+08:00
lang: zh
tags:
  - ai-agents
  - agent-harness
  - ai-coding
  - claude-code
  - software-engineering
series: pstack
---

**结论先说：** pstack 0.15.43（2026-11-17 合并）把 skill 文本砍掉了约两成，默认模型路由改成「Opus 5.5 打底，任何角色不超过 xhigh」，删掉了 Orchestrate playbook，并给 `/poteto-mode` 启动的每个 agent 加了一份必读的 `worker.md`。[1] 老用户要做的事基本只有一件：更新插件后重跑一次 `/setup-pstack`。

| 你现在的情况 | 该做什么 |
| --- | --- |
| 规则文件里是 `# budget: unlimited` | 重跑 `/setup-pstack`，它会改成 `large`（xhigh）。`max` 这一档已经没有了。 |
| 规则里还有 `hardest tasks`、`architect runners`、`reflect ...`、`how ...`、`why ...` 这些行 | 重跑后自动删掉，不用手改。 |
| 规则里没有 `# defaults: 3` 这一行 | 不重跑也能用，`/poteto-mode` 会继续照旧行跑，只是每个会话提醒你一次。 |
| 以前用 Orchestrate playbook 跑大型程序 | 直接用 `/poteto-mode` 描述任务，大型、跨模块或无人值守的工作现在交给 `figure-it-out`。 |
| 想让 Fable 5.2 写代码 | 在任务里点名。不点名的话，只有同一份 brief 跑两次 Opus 5.5 xhigh 都没过检查，它才会上。 |
| 用 Claude Code | 第三方 marketplace 默认不自动更新，先跑 `claude plugin update pstack@cursor-plugins`，再跑 `/pstack:setup-pstack`。 |

下面是在一台 Linux 机器上实际安装、实际运行的记录。站内的 [pstack skills 使用指南](/cn/garden/notes/pstack-skills-guide/) 是按 0.15.32 核对的，这篇只讲 0.15.32 之后的变化。pstack 背后的思路见 [信任够了才谈得上并行](/cn/blog/lauren-tan-poteto-trust-before-parallel/)。

## 0.15.32 之后的三次改动

0.15.32 到 0.15.43 之间，pstack 经历了三次值得单独说的改动。

第一次是 0.15.36（2026-10-28）。Orchestrate playbook 改成纯 agent 驱动：协调者自己用 `Task` 起 worker，用项目笔记记状态，不再调用 `orch` 脚本。`orch.ts`、`store.ts` 和它们的测试一起删掉，这个 PR 删了 6,348 行。[2]

第二次是 0.15.37 到 0.15.42（2026-11-15）。默认模型换成 Fable 5.2、Opus 5.5 和 Gemini 4 Carbon，Grok 4.7 不再是任何角色的默认值。`/why` 变成只有 48 个词正文的单文件，12 个 reference 文件全部删除。`/how` 也变成单文件，`/poteto-mode` 不再自动调用它。[3] 这一版里 `hardest tasks` 的默认值是 `claude-fable-5-2-max`。

第三次就是 0.15.43。它保留了 0.15.42 的模型阵容，但把「最难的活交给 Fable max」这条路整个拆掉了。下一节的字数统计和后面的路由图，讲的都是这一版。

## 在 Claude Code 里装上 0.15.43

测试机上有 Claude Code 2.1.278，没有 Cursor。我用一个空的配置目录装插件，免得碰到已有设置。

```bash
export CLAUDE_CONFIG_DIR=/workspace/pstack-series/2026-11-17/claude-home-fresh
claude plugin marketplace add cursor/plugins
claude plugin install pstack@cursor-plugins
claude plugin details pstack@cursor-plugins
```

![Claude Code 2.1.278 安装 pstack 0.15.43 的终端输出：58 个 skill、2 个 agent，poteto-mode 目录下有 worker.md](/assets/pstack-0-15-43-hands-on/claude-code-install.webp)

*图：在空配置目录里安装 pstack 0.15.43。marketplace 指向 `cursor/plugins` 里生成好的 `harness/pstack/claude-code` 目录。*

安装成功，版本 0.15.43，58 个 skill、2 个 agent，`poteto-mode/` 下面多了 `worker.md`。最后一行是这台机器的限制：Claude Code 没登录，所以我没法真的开一个 `/pstack:poteto-mode` 会话让模型去跑任务。本文后面所有关于模型「会怎么做」的内容，依据的都是 skill 文本，不是观察到的模型行为。

## 文本少了多少

PR 标题说「shorter skill texts」，但没给总数。我写了个小脚本，把 0.15.32（`e73df471`）和 0.15.43（`2f87c854`）两份 `pstack/` 目录摊开对比：去掉 frontmatter 后数每个 `SKILL.md` 的词数，再列出增删的文件。

![对比脚本输出：58 个 skill 不增不减，SKILL.md 正文 33096 词降到 26346 词，references 文件从 37 个降到 13 个](/assets/pstack-0-15-43-hands-on/skill-diff.webp)

*图：0.15.32 与 0.15.43 的 skill 文本对比。词数按空白切分，不含 frontmatter。*

几个数字值得记住：

- skill 数量没变，还是 58 个。没有新增 skill，也没有删除 skill，变的是每个 skill 里写了多少。
- 所有 `SKILL.md` 正文合计从 33,096 词降到 26,346 词，少了 20.4%。
- 砍得最狠的是 `why`（1,251 → 50）、`architect`（771 → 69）和 `reflect`（680 → 195）。`poteto-mode` 本身从 3,114 词降到 1,679 词，几乎减半。
- `references/` 下的文件从 37 个降到 13 个。`why` 少了 12 个，`architect`、`how`、`interrogate`、`reflect` 也都清空了。
- 变长的只有 5 个 skill。其中 `setup-pstack` 从 907 词涨到 1,226 词，多出来的几乎都是旧规则迁移逻辑。

`claude plugin details` 会给每个组件估一个 token 数，正好可以换个角度看同一件事。

![claude plugin details 的估算：常驻成本 3576 降到 3514 token，60 个组件按需加载合计 52710 降到 41290 token](/assets/pstack-0-15-43-hands-on/token-estimate.webp)

*图：Claude Code 给出的 token 估算，0.15.32 用 `--plugin-dir` 加载，0.15.43 用 marketplace 安装版。数值是工具自己的四舍五入估算。*

每个会话都要付的常驻成本几乎没动（约 3,576 → 3,514 token），因为它主要来自 skill 的 description，而 description 没怎么改。省下来的钱落在调用的时候：60 个组件的按需成本合计从约 52,710 降到约 41,290 token，`/poteto-mode` 一次从约 5,100 降到约 2,800。也就是说，你每次敲 `/poteto-mode`，模型先读的规则少了将近一半，而开一个空会话的成本基本不变。

代价也写在 PR 里：变短的 `architect` 和原则文本，丢掉了原来关于「接口深度」的那段措辞。[1] 现在的 `architect` 只剩一段话：动手前先追清楚每个受影响的系统，画两种不同的结构，选状态只有一个主人、调用方要知道得最少的那种。大型或有争议的设计，直接交给 `arena`。我觉得这个取舍是对的。旧版 `architect` 里大部分篇幅在讲编排步骤，而这些步骤 `arena` 已经有了。

## 新路由：Opus 5.5 打底，xhigh 封顶

0.15.43 最大的行为变化在模型路由上。下面这张图把 `poteto-mode` 里的默认值和 `/setup-pstack` 的预算阶梯放在一起。

<figure class="not-prose my-6"><svg viewBox="0 0 640 374" role="img" aria-label="pstack 0.15.43 模型路由与预算阶梯" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:640px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor" fill-opacity="0.6"/></marker></defs><text x="10" y="26" font-size="16" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">0.15.43 的模型路由：默认 Opus 5.5，任何角色封顶 xhigh</text><text x="10" y="52" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.75">角色 → 默认模型</text><text x="390" y="52" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.75">/setup-pstack 预算阶梯</text><rect x="10" y="62" width="360" height="52" rx="8" fill="#3b82f6" fill-opacity="0.12"/><rect x="10" y="62" width="6" height="52" rx="3" fill="#3b82f6" fill-opacity="0.9"/><text x="26" y="84" font-size="13.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">写代码、写文字、做判断</text><text x="26" y="104" font-size="12.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.9" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">claude-opus-5-5-xhigh-fast</text><rect x="10" y="122" width="360" height="52" rx="8" fill="#10b981" fill-opacity="0.12"/><rect x="10" y="122" width="6" height="52" rx="3" fill="#10b981" fill-opacity="0.9"/><text x="26" y="144" font-size="13.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">琐碎机械改动、验证</text><text x="26" y="164" font-size="12.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.9" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">claude-opus-5-5-high-fast</text><rect x="10" y="182" width="360" height="74" rx="8" fill="#8b5cf6" fill-opacity="0.12"/><rect x="10" y="182" width="6" height="74" rx="3" fill="#8b5cf6" fill-opacity="0.9"/><text x="26" y="204" font-size="13.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">评审和设计面板（arena、interrogate）</text><text x="26" y="224" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.9" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">claude-fable-5-2-high, claude-opus-5-5-high-fast,</text><text x="26" y="242" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.9" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">gemini-4-carbon-high</text><rect x="10" y="266" width="360" height="70" rx="8" fill="#f59e0b" fill-opacity="0.14" stroke="#f59e0b" stroke-width="1.5"/><text x="26" y="288" font-size="13.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">Fable 5.2 在面板外只有两种上场方式</text><text x="26" y="308" font-size="12.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.9">① 你在这个任务里点名要它</text><text x="26" y="326" font-size="12.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.9">② 同一份 brief 跑两次 Opus 5.5 xhigh 都没过检查</text><rect x="390" y="62" width="70" height="40" rx="6" fill="#ef4444" fill-opacity="0.1"/><text x="425" y="87" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="0.45" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">max</text><line x1="398" y1="83" x2="452" y2="83" stroke="#ef4444" stroke-width="2"/><text x="470" y="79" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.9">已移除</text><text x="470" y="95" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.9">旧 unlimited → large</text><rect x="390" y="112" width="70" height="40" rx="6" fill="#64748b" fill-opacity="0.16"/><text x="425" y="137" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">xhigh</text><text x="470" y="129" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.9">large（= 默认）</text><rect x="390" y="162" width="70" height="40" rx="6" fill="#64748b" fill-opacity="0.16"/><text x="425" y="187" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">high</text><text x="470" y="179" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.9">medium</text><rect x="390" y="212" width="70" height="40" rx="6" fill="#64748b" fill-opacity="0.16"/><text x="425" y="237" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">medium</text><text x="470" y="229" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.9">small</text><rect x="390" y="262" width="70" height="40" rx="6" fill="#64748b" fill-opacity="0.16"/><text x="425" y="287" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">low</text><text x="390" y="322" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.8">默认在 xhigh 的角色按左侧落档，</text><text x="390" y="338" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.8">默认在 high 的角色再低一档。</text><text x="10" y="362" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">难度本身不再是换 Fable 的理由。Opus 5.5 一律用 -fast slug，Gemini 最高只到 high。</text></svg></figure>

*图：0.15.43 的默认路由和预算阶梯。内容来自 `poteto-mode/SKILL.md` 的 Subagents 一节和 `setup-pstack/SKILL.md` 第 3 步。[4][5]*

和前两个版本放在一起比，变化更清楚：

| 角色 | 0.15.32 | 0.15.42 | 0.15.43 |
| --- | --- | --- | --- |
| 写代码（feature、bug-fix、perf、hillclimb） | `grok-4.7-xhigh-fast` | `claude-opus-5-5-xhigh` | `claude-opus-5-5-xhigh-fast` |
| 最难的任务（`hardest tasks`） | `claude-opus-5-5-xhigh` | `claude-fable-5-2-max` | 角色已删除 |
| 琐碎改动和验证（`swarm workers`） | `grok-4.7-xhigh-fast` | `claude-opus-5-5-high-fast` | `claude-opus-5-5-high-fast` |
| 评审和设计面板 | Opus xhigh + Grok xhigh-fast | Fable high + Opus high-fast + Gemini Carbon high | 同 0.15.42 |
| 预算档位 | unlimited、large、medium、small | 同左 | large、medium、small |

这里面有两条规则会直接影响你的账单。

第一条是封顶。不管预算选哪档，任何角色都不超过 xhigh，Opus 5.5 永远用 `-fast` slug。以前 `unlimited` 会把 `claude-opus-5-5-xhigh` 推到 `claude-opus-5-5-max`，现在这一档不存在了。PR 的说法是，`unlimited` 只可能意味着 max，所以干脆删掉，而不是给它设上限。[1]

第二条是 Fable 的门槛。在评审面板之外，Fable 5.2 只有两种情况会上：你在这次任务里点名要它，或者同一份 brief 已经跑了两次 Opus 5.5 xhigh，都没过检查。skill 原文还加了一句「难度本身永远不算理由」。[4] 我的看法是，这条规则让花费变得可预测了。代价是真正很难的任务会先烧掉两轮 Opus。如果你事先就知道某个任务需要 Fable，最省的做法是在 prompt 里直接点名。

## 走一遍旧规则迁移

`/setup-pstack` 的迁移不是脚本。pstack 没有附带任何迁移程序，执行 `/setup-pstack` 的 agent 读 `SKILL.md` 第 2 步的文字，自己改规则文件。[5] 我没法在这台机器上让 agent 跑（Claude Code 没登录），所以把第 2、3(b)、5 步的规则一条条写进一个 Python 脚本，喂给它一份典型的旧文件，看文字描述的规则会得出什么结果。

旧文件按 0.15.32 的规则形状写，预算是 `unlimited`。所以 Opus 都在 `max`，Grok 停在 `xhigh-fast`（Grok 没有 max）。另外我把 `bug-fix` 改成了 `inherit-parent`，模拟一个用户自己做过的选择：

```text
# budget: unlimited (max)
feature, refactoring: grok-4.7-xhigh-fast
bug-fix: inherit-parent
judgment and prose: claude-opus-5-5-max
hardest tasks: claude-opus-5-5-max
how explorer: grok-4.7-xhigh-fast
...
arena runners: claude-opus-5-5-max, grok-4.7-xhigh-fast
architect runners: claude-opus-5-5-max, grok-4.7-xhigh-fast
interrogate reviewers: claude-opus-5-5-max, grok-4.7-xhigh-fast
```

![按 setup-pstack 0.15.43 文字规则走的迁移：删掉 8 个退休角色行，unlimited 变 large，Grok 旧默认值换成 Opus，最后写出带 # defaults: 3 的新规则](/assets/pstack-0-15-43-hands-on/setup-migration.webp)

*图：迁移的每一步和最终写出的规则文件。预算一问假设回答 `large`，第 4 步的可用模型检查假设全部通过。*

结果分三类：

1. **删掉的行。** 共 8 行：`hardest tasks`、`how` 的两个角色、`why` 的两个角色、`reflect` 的两个角色，以及 `architect runners`。原因很简单，这些角色不在新的第 5 步规则形状里。
2. **换成新默认值的行。** 文件里没有 `# defaults: 3`，也没有 `# defaults: 2`，所以 `grok-*` 被当成旧默认值，而不是用户的选择。四个写代码的角色和 `swarm workers` 换成 Opus。三个面板原来是「一个 Opus 加一个 Grok」，正好命中规则，整列换成三座位的新列表。`unlimited` 变成 `large`。
3. **保留的行。** `bug-fix: inherit-parent` 原样保留。`judgment and prose: claude-opus-5-5-max` 第 2 步没有动它，但第 3(b) 步按 `large` 把它的强度设回 xhigh，并补上 `-fast`，最后变成 `claude-opus-5-5-xhigh-fast`。

第 3 类里有一处文字没说透。第 2 步说「其他值都是用户的选择，保留」，但 `max` 在新版里根本不合法。我是按第 3(b) 步「把每个真实 slug 的强度设成角色目标」和第 4 步「必须在 xhigh 或以下」推出这个结果的。真让 agent 跑的时候，它可能会先问你一句，也可能直接改，这一点我没法验证。

还有一个细节：迁移后的文件，除了 `bug-fix` 以外，和全新安装的默认值一模一样。如果你当初只是一路回车用默认值，重跑 `/setup-pstack` 的效果就等于重置。如果你手动改过某些角色，跑完记得看一眼它列出的「替换了哪些值」。Claude Code 里写的是 `~/.claude/rules/pstack-models.md`，模型值写成 `opus xhigh` 这种形式，Gemini 会映射成 `inherit-parent`。[6]

## worker.md：子 agent 也要守同一套规矩

以前有个缺口。操作者的规矩（不弹问题、PR 怎么写、什么时候停）写在 skill 里，而 skill 只在你敲斜杠命令时才加载。`/poteto-mode` 起的子 agent 收不到这些规矩，除非主对话把它们抄进 kickoff。0.15.43 的补法是加一个文件，并规定每个 kickoff 的第一行都要指向它。

<figure class="not-prose my-6"><svg viewBox="0 0 640 437" role="img" aria-label="worker.md 如何传给每个子 agent" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:640px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><defs><marker id="pstack1543ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor" fill-opacity="0.6"/></marker></defs><text x="10" y="26" font-size="16" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">worker.md：/poteto-mode 启动的每个 agent 先读同一份规则</text><rect x="10" y="46" width="146" height="66" rx="8" fill="#64748b" fill-opacity="0.12"/><text x="83" y="72" font-size="13.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">你（operator）</text><text x="83" y="94" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">整条链路为你干活</text><rect x="168" y="46" width="146" height="66" rx="8" fill="#3b82f6" fill-opacity="0.12"/><text x="241" y="72" font-size="13.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">/poteto-mode 主对话</text><text x="241" y="94" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">读 SKILL.md、跑 playbook</text><rect x="326" y="46" width="146" height="66" rx="8" fill="#10b981" fill-opacity="0.12"/><text x="399" y="72" font-size="13.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">子 agent</text><text x="399" y="94" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">Task 或 Project worker</text><rect x="484" y="46" width="146" height="66" rx="8" fill="#10b981" fill-opacity="0.12"/><text x="557" y="72" font-size="13.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">子 agent 的子 agent</text><text x="557" y="94" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">同样先读 worker.md</text><line x1="158" y1="79" x2="176" y2="79" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#pstack1543ah)"/><line x1="316" y1="79" x2="334" y2="79" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#pstack1543ah)"/><line x1="474" y1="79" x2="492" y2="79" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#pstack1543ah)"/><text x="10" y="138" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.8">每个 kickoff 的第一行都是：</text><rect x="10" y="146" width="620" height="30" rx="6" fill="#10b981" fill-opacity="0.1"/><text x="22" y="166" font-size="13" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="1" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">Read &lt;path&gt;/worker.md before anything else.</text><text x="10" y="202" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.8">worker.md 里的规则（摘要）：</text><rect x="10" y="210" width="620" height="26" rx="4" fill="#64748b" fill-opacity="0.13"/><text x="22" y="228" font-size="12.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">kickoff 里写的验收标准就是全部门槛，不额外加检查、签核或评审轮</text><rect x="10" y="240" width="620" height="26" rx="4" fill="#64748b" fill-opacity="0.08"/><text x="22" y="258" font-size="12.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">没写标准时：不比 base 差，并且通过它自己的测试</text><rect x="10" y="270" width="620" height="26" rx="4" fill="#64748b" fill-opacity="0.13"/><text x="22" y="288" font-size="12.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">只为当前 head 跑挂、或用户会碰到的 bug 卡住；base 已有的问题一行带过</text><rect x="10" y="300" width="620" height="26" rx="4" fill="#64748b" fill-opacity="0.08"/><text x="22" y="318" font-size="12.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">不向人弹问题：能撤销的选择先做，再说明选了什么、为什么</text><rect x="10" y="330" width="620" height="26" rx="4" fill="#64748b" fill-opacity="0.13"/><text x="22" y="348" font-size="12.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">只为部署、删数据、force-push 共享分支、给链路外的人发消息停下</text><rect x="10" y="360" width="620" height="26" rx="4" fill="#64748b" fill-opacity="0.08"/><text x="22" y="378" font-size="12.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">PR 直接 ready；标题 type(scope): subject；正文不超过 40 行、六个固定标题</text><text x="10" y="406" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">kickoff 只有明说时才能推翻其中一条。</text><text x="10" y="423" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">以前这些规则只在斜杠命令加载 skill 时才会出现在上下文里。</text></svg></figure>

*图：`worker.md` 的传递方式和规则摘要，内容来自 `poteto-mode/worker.md`。[7]*

这份文件很短，只有 9 条，其中几条值得在升级前对照一下团队习惯：

- **验收标准就是全部门槛。** 子 agent 不会自己加检查、签核或评审轮。这能减少过度工作，但也意味着 kickoff 里没写的检查，它就不会做。
- **永远不弹问题给人。** 能撤销的选择它会先做，再告诉你选了什么。只有部署、删数据、force-push 共享分支、给链路外的人发消息这四件事才停。
- **PR 直接 ready，不开 draft。** 标题用 `type(scope): subject`，正文不超过 40 行，固定六个 `##` 标题。

kickoff 只有在「明确写出来」的时候才能推翻其中一条。所以如果你们团队要求 PR 先开 draft，就得在 kickoff 里写清楚，光靠仓库里的约定是不够的。

## Orchestrate 去了哪

Orchestrate 是分两步消失的。0.15.36 删掉了 `orch` 脚本，playbook 改成协调者用自己的 agent 工具管理整个程序。[2] 0.15.43 把这个 playbook 也删了。现在 `poteto-mode` 的路由规则是：大型、跨模块、无人值守，或者没有 playbook 能对上的工作，交给 `figure-it-out`。[4] `figure-it-out` 的定位是「没有更窄的 playbook 时，设计一套可审计的做法」，会按任务大小调整严谨程度，跑假设循环，并记录决策。

`poteto-help` 里还专门加了一句：pstack 没有 `/orchestrate` skill，如果斜杠菜单里出现了 `/orchestrate`，那是别的插件提供的。[8] 同一个 `cursor/plugins` 仓库里确实有一个独立的 `orchestrate` 插件，它通过 Cursor SDK 把大任务分给并行的 cloud agent，需要 `bun` 和 `CURSOR_API_KEY`。[9] 它不是 pstack 的一部分。如果你要的就是多个 cloud agent 扇出，可以看它。如果只是想把一个大任务做完，用 `/poteto-mode` 就行。

这周 X 上还有人在写自己的流程，第二步是「pstack Orchestrate：一个跑在 Fable 上的大编排线程」。[10] 这正是 0.15.43 拆掉的两样东西：Orchestrate playbook，和默认让 Fable 扛最难的活。照着这类旧教程配置的人，升级后要改两处。

## 仓库自带的检查都过了

我在 `2f87c854` 上按 CI 的步骤跑了一遍：先安装 CI 用的三个依赖，再跑三个仓库脚本和全部 skill 脚本测试。

![在 cursor/plugins 2f87c85 上运行 validate-plugins、harness 树检查、check-pstack-docs 和 node --test，测试 340 个，通过 270，失败 0，跳过 70](/assets/pstack-0-15-43-hands-on/repo-checks.webp)

*图：Linux、Node 26.9.0 下的结果。CI 用的是 Node 22。*

三个脚本都通过：插件定义合法，生成的 Claude Code harness 树是最新的，文档检查 0 个问题（58 个 skill、22 个 playbook、2 个 agent）。测试共 340 个，270 个通过，0 个失败，70 个跳过。PR 里写的是 269 个通过、1 个失败，失败的是一个在 macOS 上同样会挂的 statechart 符号链接测试。[1] 在 Linux 上这个测试是过的。

70 个跳过的测试需要 `TLA2TOOLS` 指向 `tla2tools.jar`，也就要装 Java。测试机上没有 Java，所以 `/statechart` 真正调用 TLC 的路径我没有测到，0.15.38 那个「SANY 读不懂 spec 时报出行号和列号」的修复也在其中。[3]

## 这周社区在问什么

过去 7 天 X 上关于 pstack 的帖子不少，反复出现的问题有三个。

**默认模型变了，要不要重跑 `/setup-pstack`？** 0.15.42 发布后，有一条日文帖提醒大家立刻重跑，点赞超过 150。[11] 0.15.43 之后答案没变，而且理由更充分了：这次连规则格式都换了（`# defaults: 3`），还删掉了几个角色。

**Codex 能不能用？** 这周至少有两次有人问。[12][13] 上游 README 只写了 Cursor 和 Claude Code 两种装法，社区里有一些移植版，但我没测过，这里不推荐具体哪一个。站内指南里的 [宿主兼容性表](/cn/garden/notes/pstack-skills-guide/#host-compatibility) 依然适用。

**token 太贵。** 有人直接问作者能不能写点省 token 的建议，因为晚上挂几个 bot 就能用掉一周预算的 75%。[14] 0.15.43 在两处有帮助：按需加载的文本变短了，`max` 档位没了。但它不会让面板变便宜，三座位的评审面板还是三个模型各跑一遍。真想省钱，就在 `/setup-pstack` 里选 `medium` 或 `small`，并缩短面板列表。

## 测了什么，没测什么

实际跑过的：

- Claude Code 2.1.278 从 marketplace 安装 pstack 0.15.43，确认版本、组件清单和 `worker.md` 在位。
- 0.15.32 和 0.15.43 的 skill 清单、`SKILL.md` 词数、`references/` 和其他文件的增删对比。
- 两个版本的 `claude plugin details` token 估算。
- 按 `setup-pstack` 0.15.43 的文字规则，把一份旧规则文件迁移成新格式。
- `validate-plugins`、`generate-pstack-harness-trees --check`、`check-pstack-docs` 和 CI 的 `node --test`。

没测到的：

- 任何真实的 `/poteto-mode` 或 `/setup-pstack` 会话。Claude Code 没登录，测试机上也没有 Cursor。所以模型会不会真的读 `worker.md`、Fable 门槛会不会被遵守，都还没有观察数据。
- `/setup-pstack` 由 agent 实际执行时的迁移结果。上面的结果是文字规则的确定性推演。
- 需要 Java 和 TLC 的 70 个 statechart 测试。

我的结论是值得升级。文本变短，主要省在每次调用的上下文上。路由封顶让最坏情况下的花费有了上限。`worker.md` 补上了子 agent 收不到规矩的缺口。升级后要做的事很少：重跑一次 `/setup-pstack`，看它替换了哪些值，再对照 `worker.md` 检查团队的 PR 规范。

最新进展见[pstack 0.15.48 实测 /reframe：说不清要做什么时，先学会这一行怎么叫它](/cn/blog/pstack-0-15-48-reframe-hands-on/)。

## 参考来源

1. cursor/plugins PR #1249，feat(pstack): shorter skill texts, worker.md, and Opus-first routing capped at xhigh：<https://github.com/cursor/plugins/pull/1249>
2. cursor/plugins PR #1043，feat(pstack): make Orchestrate agentic and delete the orch scripts：<https://github.com/cursor/plugins/pull/1043>
3. cursor/plugins PR #1236，feat(pstack): new default models, one-file why and how, statechart fixes, sharpen and reflect text：<https://github.com/cursor/plugins/pull/1236>
4. pstack 0.15.43，`poteto-mode/SKILL.md`：<https://github.com/cursor/plugins/blob/2f87c854fe3e2fcda44ca86b46ede35aad3c46b7/pstack/skills/poteto-mode/SKILL.md>
5. pstack 0.15.43，`setup-pstack/SKILL.md`：<https://github.com/cursor/plugins/blob/2f87c854fe3e2fcda44ca86b46ede35aad3c46b7/pstack/skills/setup-pstack/SKILL.md>
6. pstack 0.15.43，Claude Code adapter：<https://github.com/cursor/plugins/blob/2f87c854fe3e2fcda44ca86b46ede35aad3c46b7/pstack/docs/harness/claude-code.md>
7. pstack 0.15.43，`poteto-mode/worker.md`：<https://github.com/cursor/plugins/blob/2f87c854fe3e2fcda44ca86b46ede35aad3c46b7/pstack/skills/poteto-mode/worker.md>
8. pstack 0.15.43，`poteto-help/SKILL.md`：<https://github.com/cursor/plugins/blob/2f87c854fe3e2fcda44ca86b46ede35aad3c46b7/pstack/skills/poteto-help/SKILL.md>
9. cursor/plugins，`orchestrate` 插件 README：<https://github.com/cursor/plugins/tree/main/orchestrate>
10. @mrtnnow 在 X 上的帖子（2026-11-13）：<https://x.com/mrtnnow/status/2121248719207117226>
11. @cu30rry_ 在 X 上的帖子（2026-11-15）：<https://x.com/cu30rry_/status/2121885461409133029>
12. @JediTam 在 X 上的提问（2026-11-14）：<https://x.com/JediTam/status/2121390741536874906>
13. @filipem1randa 在 X 上的回复（2026-11-17）：<https://x.com/filipem1randa/status/2122460032629604581>
14. @ndh4hy 在 X 上的帖子（2026-11-15）：<https://x.com/ndh4hy/status/2121930619559252125>
