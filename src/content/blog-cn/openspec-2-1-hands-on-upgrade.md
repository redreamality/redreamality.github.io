---
title: "OpenSpec 2.1 实测：/opsx 命令取消，skill 改放 .agents 和全局，1.x 项目怎么升级"
description: "OpenSpec 从 1.15.0 到 2.1.1 发了六个版本：2.0 删掉 /opsx 斜杠命令，所有工具共用 .agents/skills；2.1 支持把 skill 装到本机全局，新仓库默认全局；2.1.1 改回离线安装。本文在 Linux 上把一个 1.15.0 项目分别按「留在项目」和「切到全局」升到 2.1.1，用 OpenCode 走完一次提案到归档，并测了离线安装、validate --strict、Stores 和团队混用版本的情况。"
author: Remy
pubDate: 2026-11-23T09:00:00+08:00
lang: zh
tags:
  - openspec
  - sdd
  - ai-coding
  - ai-agents
  - cli
---

**结论先说：** OpenSpec 的工作流本身没变，proposal、delta spec、tasks、archive 这一套和 1.x 一样，CLI 命令也基本没动。变的是 skill 怎么装、装在哪：2.0.0 删掉了 `/opsx:*` 斜杠命令，所有工具共用 `.agents/skills/` 里的一份 skill；2.1.0 允许把 skill 装到本机全局，新仓库 `init` 默认就装全局；2.1.1 把 skill 打进 CLI 包，安装不再需要 Git 和网络。[1][2][3] 我的建议是直接升到 2.1.1，跳过 2.1.0，全队一起升。升级前先把改过的内置 skill 存到别处，因为 `openspec update` 会整份覆盖它们，而且不提示。

| 你现在的情况 | 该做什么 |
| --- | --- |
| 新装或升级 CLI | npm：`npm install -g @fission-ai/openspec@latest`（要 Node 22.20.0 以上）；不想装 Node 用独立版：`curl -fsSL https://openspec.dev/cli/install.sh \| sh`；Homebrew：`brew upgrade openspec`。[4] |
| 有 1.x 项目 | 先 commit，再跑 `openspec update --dry-run` 看清要动哪些文件，然后 `openspec update`，最后 commit 结果。在终端里它会问 skill 放项目还是全局。 |
| 习惯在对话框里打 `/opsx:propose` | 改成 `/openspec-propose`（Claude Code、Cursor、OpenCode 等），Codex 里用技能名 `openspec-propose`；直接说「帮我提一个变更」也行。 |
| 改过 `.agents/skills/openspec-*` 里的内容 | 挪到自己命名的 skill（如 `.agents/skills/team-propose/`），或写进 `openspec/config.yaml` 的 `context`、`rules`。 |
| 团队里有人还在 1.x | 先让所有人升级 CLI，再升级仓库。1.x 的 `update` 会把 `/opsx` 命令写回来。 |
| 用脚本或 CI 建仓库 | 加 `--scope project`，或设 `OPENSPEC_SKILLS_SCOPE=project`；只做校验的 job 直接跑 `openspec validate --all`。 |
| 内网、沙箱、无外网 | 用 2.1.1。2.1.0 装 skill 要从 GitHub 克隆，断网直接失败。 |
| 还在用 Amazon Q Developer | 2.0 起不再支持，`update` 会删掉它的文件，官方建议换 Kiro。 |
| 暂时不想升 | `npm install -g @fission-ai/openspec@1` 钉在 1.x，再设 `OPENSPEC_NO_UPDATE_CHECK=1` 关掉升级提示。[5] |

这是 OpenSpec 专题系列的第一期。没用过 OpenSpec 的话，先看 [OpenSpec 教程：CLI 安装、命令、AGENTS.md 与示例](/cn/blog/openspec-tutorial-cli-commands-agents-md-examples/)；多仓库共享规范看 [OpenSpec Stores 多仓库实战](/cn/blog/openspec-1-5-stores-beta-update-guide/)；想知道它和 BMAD、Spec Kit 有什么区别，看 [规格驱动开发框架对比](/cn/blog/-sddbmad-vs-spec-kit-vs-openspec-vs-promptx/)。这几篇写于 1.15.0，安装和斜杠命令部分以本文为准。

## 六个版本里，要动手的只有三个

本站上一篇写到 1.15.0（10 月 24 日）。之后三周多，npm 上依次出了 1.16.0、1.16.1、1.17.0、2.0.0、2.1.0、2.1.1。大部分是修复，真正需要你做点什么的是三处：1.16.0 把 npm 安装的 Node 下限提到 22，2.0.0 改了 skill 的存放方式，2.1.0 又加了全局安装并改了 `init` 的默认值。

<figure class="not-prose my-6"><svg viewBox="0 0 760 310" role="img" aria-label="1.15.0 到 2.1.1：六个版本，三处要动手" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:760px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><defs><marker id="ah-tl" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor" fill-opacity="0.6"/></marker></defs><text x="12" y="26" font-size="15" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.95">1.15.0 到 2.1.1：六个版本，三处要动手</text><rect x="12" y="46" width="736" height="32" rx="6" fill="#3b82f6" fill-opacity="0.22"/><text x="24" y="67" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.95" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">1.16.0</text><text x="92" y="67" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.65" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">10-30</text><text x="140" y="67" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">npm 安装要求 Node 22.12+；validate 查 Scenario 缺 WHEN/THEN；Store 建议</text><rect x="12" y="86" width="736" height="32" rx="6" fill="#3b82f6" fill-opacity="0.07"/><text x="24" y="107" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.95" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">1.16.1</text><text x="92" y="107" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.65" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">11-07</text><text x="140" y="107" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">修复：未知 delta 小节不再静默丢掉；version --check 更可靠</text><rect x="12" y="126" width="736" height="32" rx="6" fill="#3b82f6" fill-opacity="0.07"/><text x="24" y="147" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.95" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">1.17.0</text><text x="92" y="147" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.65" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">11-09</text><text x="140" y="147" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">update 可从任何旧版一步升级；提示 2.0 将删 /opsx</text><rect x="12" y="166" width="736" height="32" rx="6" fill="#8b5cf6" fill-opacity="0.22"/><text x="24" y="187" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.95" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">2.0.0</text><text x="92" y="187" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.65" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">11-11</text><text x="140" y="187" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">skill 统一放 .agents/skills；/opsx 命令删除；delivery 退役；Amazon Q 退役</text><rect x="12" y="206" width="736" height="32" rx="6" fill="#8b5cf6" fill-opacity="0.22"/><text x="24" y="227" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.95" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">2.1.0</text><text x="92" y="227" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.65" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">11-17</text><text x="140" y="227" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">可装到本机全局；新仓库 init 默认全局；改用 Vercel skills，需要 Git 和 GitHub</text><rect x="12" y="246" width="736" height="32" rx="6" fill="#8b5cf6" fill-opacity="0.07"/><text x="24" y="267" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.95" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">2.1.1</text><text x="92" y="267" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.65" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">11-19</text><text x="140" y="267" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">skill 随 CLI 包离线安装；archive skill 先查归档目录；validate --strict 两处调整</text><text x="12" y="300" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.6">日期为 npm 发布时间（UTC）。深色块是需要你做点什么的版本。</text></svg></figure>

1.17.0 是给 2.0 铺路的版本。它让 `openspec update` 能从 0.12 以来的任何版本一步升上来，只删 OpenSpec 自己生成、没人改过的文件，改过的保留并列出。[6] 所以从 1.15.0 直接跳到 2.1.1 是官方支持的路径，不用逐个版本升。

另外，`init --tools` 能填的工具 ID 从 1.15.0 的 50 个涨到了 87 个。新增的大多来自 Vercel 的 `skills` 安装器支持的那批 agent，比如 Goose、OpenHands、Tabnine CLI。少掉的只有一个 `amazon-q`。

## skill 从「每个工具一份」变成「一处一份」

1.x 的做法是给每个工具写一份自己的副本。测试项目用 1.15.0 选了 Claude Code、Codex、Cursor 和 Amazon Q 四个工具，`init` 之后仓库里多了 42 个 Markdown 文件：同样的 6 个 skill 写了 4 遍，另有 18 个 `/opsx` 命令文件。

![OpenSpec 1.15.0 在 legacy-app 里 init 四个工具：提示用 /opsx:propose 开始，.agents、.amazonq、.claude、.cursor 下各有 6 个 skill，.claude/commands、.cursor/commands、.amazonq/prompts 下各有 6 个命令文件](/assets/openspec-2-1-hands-on-upgrade/legacy-1-15-init.webp)

内容重复还不是最麻烦的。两套入口（命令文件和 skill）讲的是同一件事，维护时容易改了一个忘了另一个；有些工具会把两份都列出来，用户看到每个 skill 出现两次。1.16.1 甚至有人报过 bug：`.agents/skills` 链到 `.claude/skills` 的项目里，每跑一次 `update`，skill 里的命令名就在 `/opsx:*` 和 `/openspec-*` 之间来回翻。[7]

2.0 的办法很直接：skill 只在 `.agents/skills/` 放一份真实文件。Codex、Cursor、OpenCode 这类本来就读 `.agents/skills/` 的工具什么都不用加；Claude Code、Kiro 这类只读自己目录的，OpenSpec 在它们的目录里放符号链接，指回 `.agents/skills/`。斜杠命令整套删除，每个旧命令都有同名 skill 接替，比如 `/opsx:apply` 对应 `openspec-apply-change`。[1][5]

<figure class="not-prose my-6"><svg viewBox="0 0 760 382" role="img" aria-label="同一个项目里，OpenSpec skill 放在哪（Claude Code + Codex + Cursor）" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:760px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><defs><marker id="ah-layout" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor" fill-opacity="0.6"/></marker></defs><text x="12" y="26" font-size="15" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.95">同一个项目里，OpenSpec skill 放在哪（Claude Code + Codex + Cursor）</text><rect x="12" y="42" width="236" height="300" rx="8" fill="#f59e0b" fill-opacity="0.07"/><text x="22" y="64" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.95">1.15.0：每个工具一份</text><rect x="262" y="42" width="236" height="300" rx="8" fill="#3b82f6" fill-opacity="0.07"/><text x="272" y="64" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.95">2.0 起：项目内一份</text><rect x="512" y="42" width="236" height="300" rx="8" fill="#10b981" fill-opacity="0.07"/><text x="522" y="64" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.95">2.1 起：本机一份（新仓库默认）</text><text x="22" y="92" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.6">仓库</text><rect x="22" y="100" width="216" height="24" rx="4" fill="#f59e0b" fill-opacity="0.18"/><text x="28" y="116" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">.claude/skills/</text><text x="232" y="116" font-size="10" text-anchor="end" font-weight="normal" fill="currentColor" fill-opacity="0.8">6 个 skill</text><rect x="22" y="130" width="216" height="24" rx="4" fill="#ef4444" fill-opacity="0.18"/><text x="28" y="146" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">.claude/commands/opsx/</text><text x="232" y="146" font-size="10" text-anchor="end" font-weight="normal" fill="currentColor" fill-opacity="0.8">6 个命令</text><rect x="22" y="160" width="216" height="24" rx="4" fill="#f59e0b" fill-opacity="0.18"/><text x="28" y="176" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">.cursor/skills/</text><text x="232" y="176" font-size="10" text-anchor="end" font-weight="normal" fill="currentColor" fill-opacity="0.8">6 个 skill</text><rect x="22" y="190" width="216" height="24" rx="4" fill="#ef4444" fill-opacity="0.18"/><text x="28" y="206" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">.cursor/commands/</text><text x="232" y="206" font-size="10" text-anchor="end" font-weight="normal" fill="currentColor" fill-opacity="0.8">6 个命令</text><rect x="22" y="220" width="216" height="24" rx="4" fill="#f59e0b" fill-opacity="0.18"/><text x="28" y="236" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">.agents/skills/</text><text x="232" y="236" font-size="10" text-anchor="end" font-weight="normal" fill="currentColor" fill-opacity="0.8">6 个 skill</text><rect x="22" y="250" width="216" height="24" rx="4" fill="#f59e0b" fill-opacity="0.18"/><text x="28" y="266" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">.amazonq/skills/</text><text x="232" y="266" font-size="10" text-anchor="end" font-weight="normal" fill="currentColor" fill-opacity="0.8">6 个 skill</text><rect x="22" y="280" width="216" height="24" rx="4" fill="#ef4444" fill-opacity="0.18"/><text x="28" y="296" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">.amazonq/prompts/</text><text x="232" y="296" font-size="10" text-anchor="end" font-weight="normal" fill="currentColor" fill-opacity="0.8">6 个命令</text><text x="22" y="330" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">同一套指令写了 4 遍，另有 18 个命令文件</text><text x="272" y="92" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.6">仓库</text><rect x="272" y="100" width="216" height="54" rx="4" fill="#3b82f6" fill-opacity="0.22"/><text x="278" y="118" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">.agents/skills/</text><text x="278" y="138" font-size="10" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.8">6 真实文件</text><rect x="272" y="190" width="216" height="30" rx="4" fill="#3b82f6" fill-opacity="0.08" stroke="#3b82f6" stroke-opacity="0.9" stroke-dasharray="4 3"/><text x="278" y="209" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">.claude/skills/</text><text x="482" y="209" font-size="10" text-anchor="end" font-weight="normal" fill="currentColor" fill-opacity="0.8">6 链接 → .agents</text><line x1="380" y1="190" x2="380" y2="156" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah-layout)"/><text x="272" y="250" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.85" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">openspec/config.yaml</text><text x="272" y="268" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.6" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">skillsScope: project</text><text x="272" y="330" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">Codex、Cursor 直接读 .agents/skills</text><text x="522" y="92" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.6">仓库</text><rect x="522" y="100" width="216" height="54" rx="4" fill="#64748b" fill-opacity="0.12"/><text x="528" y="118" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">openspec/</text><text x="528" y="138" font-size="10" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.8">仓库里没有 skill</text><text x="522" y="180" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.6">家目录 ~</text><rect x="522" y="188" width="216" height="54" rx="4" fill="#10b981" fill-opacity="0.22"/><text x="528" y="206" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">~/.agents/skills/</text><text x="528" y="226" font-size="10" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.8">6 真实文件</text><rect x="522" y="276" width="216" height="30" rx="4" fill="#10b981" fill-opacity="0.08" stroke="#10b981" stroke-opacity="0.9" stroke-dasharray="4 3"/><text x="528" y="295" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">~/.claude/skills/</text><text x="732" y="295" font-size="10" text-anchor="end" font-weight="normal" fill="currentColor" fill-opacity="0.8">6 链接 → .agents</text><line x1="630" y1="276" x2="630" y2="244" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah-layout)"/><text x="522" y="330" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">另记 ~/.agents/.skill-lock.json</text><text x="12" y="372" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.6">数字来自本文实测：1.15.0 init 选了 claude、codex、cursor、amazon-q；2.1.1 的两列来自 update 和 init。</text></svg></figure>

2.1 又往前走了一步：skill 可以不进仓库，装到 `~/.agents/skills/`，本机所有项目共用。Claude Code 的 `~/.claude/skills/` 同样是指回去的链接，旁边还有一个 `~/.agents/.skill-lock.json` 记着来源和版本。新仓库里跑 `openspec init --tools ...`，默认就是这种全局安装，仓库里只剩 `openspec/` 目录。想把 skill 留在仓库里，要显式加 `--scope project`。[2]

![两个新仓库用 2.1.1 init：不加参数时仓库里只有 openspec/ 下三个文件，skill 装在 ~/.agents/skills，~/.claude/skills 下是 6 个指回去的链接；加 --scope project 时 .agents/skills 下是真实文件，.claude/skills 下是链接](/assets/openspec-2-1-hands-on-upgrade/fresh-init-global-vs-project.webp)

全局装有它的道理。OpenSpec 已经换用 Vercel 的 `skills` 安装器，官方说这样能少维护安装代码，把精力放回 skill 本身；skill 跟着 CLI 版本走，你升级 CLI 时它们一起更新。[2] 对一个人在几十个仓库之间来回切的开发者，这确实省事。

团队就要多想一步。skill 留在仓库里，指令版本跟着 commit 走，新同事 clone 下来就能用；装到全局，每个人机器上的 skill 版本取决于他自己装的 CLI 版本，仓库本身不再说明「这个项目用的是哪版指令」。已经有用户在 issue 里提出想要类似 Maven Wrapper 的东西，把 CLI 版本钉在仓库里，正是因为这种漂移。[8] 官方建议大多数团队选全局；我的看法是，个人机器选全局，多人协作、或者要让 GitHub 托管的 Copilot agent 读到 skill 的仓库，先留在项目里。两种选择之后都能用 `openspec init --scope ...` 改。

Windows 用户还要注意一点：仓库里提交的是符号链接，同事的 Git 需要开 `core.symlinks`，系统要开开发者模式，否则链接会被检出成一个小文本文件。`openspec update` 遇到这种情况会改写成普通副本。[5]

## 把 1.15.0 项目升到 2.1.1

为了看清 `update` 会怎样对待「改过的东西」，测试项目在 1.15.0 初始化之后做了三处团队常见的修改：在 Claude 的 `/opsx:apply` 命令文件末尾加了一条团队规则，在内置的 `openspec-propose` skill 里加了一条规则，又新建了一个自己的 skill `team-review`。然后换 2.1.1 跑升级。

### 先看 dry-run，再选「留在项目」

![2.1.1 对 legacy-app 跑 update：dry-run 显示 49 个文件会变，被改过的 openspec-propose/SKILL.md 只标为 update；正式运行时选 Keep in this project，Amazon Q 的 12 个文件被删，11 个命令文件被删，改过的 .claude/commands/opsx/apply.md 被保留；之后 propose skill 里的团队规则数为 0，config.yaml 多了 skillsScope: project](/assets/openspec-2-1-hands-on-upgrade/update-keep-project.webp)

`openspec update --dry-run` 列出 49 个会变的文件。值得注意的是，改过的 `openspec-propose/SKILL.md` 在列表里只是普普通通的一行 `update`，没有任何「你改过它」的标记。改过的 `/opsx:apply` 命令文件则根本不在列表里，因为它会被保留。

在终端里正式运行时，2.1.1 先问一个问题：这个项目的 skill 放在项目里还是切到全局。选「Keep in this project」之后，它做了这些事：

- 在 `openspec/config.yaml` 里写下 `skillsScope: project`，提示你提交这个文件，队友就不会再被问一遍。
- 删掉 Amazon Q 的 12 个文件，并告诉你改用 Kiro。
- 删掉 11 个没改过的命令文件，保留改过的那个 `.claude/commands/opsx/apply.md`，让你把有用的内容挪进 skill 后手动删。
- 删掉 `.claude/skills/` 和 `.cursor/skills/` 下的副本，Claude 那边换成 6 个链接。
- 把 `.agents/skills/` 里的 6 个 skill 刷成 2.1.1 的内容。

最后一条就是坑：`openspec-propose` 里那条团队规则没了，`grep` 计数为 0，整个过程没有一句提示。官方升级指南里确实用警告框写了这件事，`update` 会整份替换内置 skill 的目录，里面的修改和你加进去的文件都会消失。[5] 但只看命令行输出的人很容易错过。自己新建的 `team-review` 没被碰，这和文档一致：名字不和内置 skill 撞，`update` 就不管它。

整个升级在 git 里是 35 个删除、8 个修改、6 个新增（Claude 的链接）。

<figure class="not-prose my-6"><svg viewBox="0 0 760 414" role="img" aria-label="在 1.x 项目里跑 openspec update（2.1.1）会走哪条路" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:760px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><defs><marker id="ah-update" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor" fill-opacity="0.6"/></marker></defs><text x="12" y="26" font-size="15" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.95">在 1.x 项目里跑 openspec update（2.1.1）会走哪条路</text><rect x="300" y="44" width="160" height="30" rx="6" fill="#3b82f6" fill-opacity="0.25"/><text x="380" y="64" font-size="12" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.95" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">openspec update</text><line x1="380" y1="74" x2="380" y2="92" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah-update)"/><rect x="220" y="94" width="320" height="30" rx="6" fill="#64748b" fill-opacity="0.14"/><text x="380" y="114" font-size="12" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.95">终端里运行，且环境里没有 CI 变量？</text><line x1="220" y1="109" x2="120" y2="140" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah-update)"/><text x="150" y="118" font-size="10.5" text-anchor="end" font-weight="normal" fill="currentColor" fill-opacity="0.7">否：不提问</text><rect x="12" y="142" width="216" height="44" rx="6" fill="#64748b" fill-opacity="0.12"/><text x="120" y="168" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.95">原地刷新，skill 仍留在仓库</text><line x1="540" y1="109" x2="600" y2="140" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah-update)"/><text x="585" y="118" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.7">是：问一次</text><line x1="380" y1="124" x2="380" y2="140" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah-update)"/><rect x="260" y="142" width="236" height="112" rx="6" fill="#3b82f6" fill-opacity="0.12"/><text x="378" y="162" font-size="12" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="0.95">Keep in this project</text><text x="270" y="186" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">· config.yaml 记下 skillsScope: project</text><text x="270" y="208" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">· 删掉 /opsx 命令和各工具的重复 skill</text><text x="270" y="230" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">· 改过的命令文件保留并列出</text><rect x="512" y="142" width="236" height="30" rx="6" fill="#10b981" fill-opacity="0.2"/><text x="630" y="162" font-size="12" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="0.95">Switch to global</text><line x1="630" y1="172" x2="630" y2="188" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah-update)"/><rect x="512" y="190" width="236" height="28" rx="6" fill="#f59e0b" fill-opacity="0.18"/><text x="630" y="209" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.95">有改过的命令文件？</text><line x1="570" y1="218" x2="570" y2="234" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah-update)"/><rect x="512" y="236" width="112" height="46" rx="6" fill="#ef4444" fill-opacity="0.18"/><text x="568" y="254" font-size="10" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.95">报错退出，什么都不删</text><text x="568" y="270" font-size="10" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.95"></text><line x1="690" y1="218" x2="690" y2="234" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah-update)"/><rect x="636" y="236" width="112" height="46" rx="6" fill="#10b981" fill-opacity="0.2"/><text x="692" y="254" font-size="10" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.95">删掉仓库里的 skill，</text><text x="692" y="270" font-size="10" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.95">装到 ~/.agents/skills</text><line x1="692" y1="282" x2="692" y2="298" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah-update)"/><rect x="512" y="300" width="236" height="28" rx="6" fill="#10b981" fill-opacity="0.1"/><text x="630" y="319" font-size="10.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.95">队友 pull 后各自 update，答 Yes</text><rect x="12" y="346" width="736" height="58" rx="6" fill="#ef4444" fill-opacity="0.08" stroke="#ef4444" stroke-opacity="0.9" stroke-dasharray="4 3"/><text x="24" y="370" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">⚠ 三条路都一样：改过的内置 skill 会被整份覆盖，不提示。</text><text x="24" y="392" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">⚠ 还在用 1.x 的队友再跑 update：/opsx 命令回来，skill 退回旧版。</text></svg></figure>

### 什么时候不会问你

上面那个问题只在「交互式终端、且没有 CI 变量」时出现。在 CI 里、或者让 agent 去跑 `openspec update`，它不问，直接按原来的位置刷新。[2] 实测有个细节：判断用的是「环境里有没有 `CI` 这个变量」，不看值，所以哪怕 `CI` 被设成空字符串，它也当成 CI，不提问。本地 shell 配置里随手 export 过 `CI` 的人，会发现自己一直没被问到。另外设 `OPEN_SPEC_INTERACTIVE=0` 也会关掉提问。

### 选「切到全局」：被一个改过的命令文件拦住

同样的 1.15.0 项目，这次选「Switch to global」。第一次直接报错：有一个文件带着你自己的修改，项目保留它的副本，什么都没删。这个文件正是那条改过的 `/opsx:apply` 命令。也就是说，留在项目时它只是被列出来，切全局时它会挡住整个切换。

![选 Switch to global：第一次因 .claude/commands/opsx/apply.md 有改动而报错、什么都没删；git rm 这个文件后再选一次，仓库里 OpenSpec 自己的 skill 被删除，6 个 skill 装到 ~/.agents/skills，仓库里只剩自建的 team-review](/assets/openspec-2-1-hands-on-upgrade/update-switch-global.webp)

把它删掉提交后再跑一次，切换成功：仓库里 30 个 OpenSpec 文件被删，6 个 skill 装进 `~/.agents/skills/`，`.agents/skills/` 下只剩自建的 `team-review`。输出最后一句交代了团队该怎么做：提交这些删除，队友 pull 之后在终端里跑 `openspec update` 并回答 Yes，或者在脚本里跑 `openspec init --tools <ids>`。

### 队友还在 1.x 会怎样

升级指南说「先升级全队的 CLI」，但没说不这么做会怎样。我拿已经按「留在项目」升级并提交的仓库，用 1.15.0 再跑一次 `openspec update`：

![仓库已经升级到 2.1.1 并提交后，用 openspec-1.15.0 再跑 update：识别出 claude 和 agents 两个工具（版本 unknown → 1.15.0），结果 7 个 skill 文件被改回、改过的 apply.md 被覆盖、5 个 /opsx 命令文件重新出现](/assets/openspec-2-1-hands-on-upgrade/mixed-team-1-15-update.webp)

结果有三处：5 个 `/opsx` 命令文件又被写回来；之前被 2.1.1 保留的那个改过的 `apply.md` 被 1.15.0 覆盖，里面的团队规则也没了；`.agents/skills/` 里的 6 个 skill 退回 1.15.0 版本。因为 2.x 生成的 skill 不再带 `generatedBy` 版本字段，1.15.0 只能显示 `unknown → 1.15.0`。只要有一个人还在用旧 CLI 并顺手跑了 `update`，下一个 PR 里就会出现一大片回退的 diff。

所以顺序很重要：先在团队里统一 CLI 版本，再挑一个人升级仓库并提交。

## 2.1.0 要联网，2.1.1 改回离线

2.1.0 换成 Vercel 的安装器之后，`init` 和 `update` 安装 skill 时会从 GitHub 克隆 OpenSpec 仓库。有用户在无外网的 CI 和沙箱里一跑就挂，还指出这让安装结果不再由钉住的包版本决定，而取决于远端当时给什么。[9] 2.1.1 把 skill 打包进 CLI，安装时直接从本地包里拷。[3]

在断网的命名空间里（`unshare -rn`）各跑一遍，差别很清楚：

![断网环境下：2.1.0 默认 init 报 Failed to clone，加 --scope project 也报 Failed for Claude Code；2.1.1 两种方式都成功](/assets/openspec-2-1-hands-on-upgrade/offline-init-2-1-0-vs-2-1-1.webp)

2.1.0 不管装全局还是装项目都失败，因为项目内安装也走同一个安装器。2.1.1 两种都成功。`~/.agents/.skill-lock.json` 里的来源字段仍写着 GitHub 和对应的 tag，但内容来自本地包。如果你的公司网络管得严，或者 agent 跑在沙箱里，这一点就足以决定别停在 2.1.0。

## 用 skill 走完一次提案到归档

斜杠命令删掉之后，日常用法变成调用 skill。我在一个只有 `greet.py` 的小项目里用 `--scope project --tools opencode` 初始化，让 OpenCode 2.3.2 配免费模型按三个 skill 走完一个变更：给 CLI 加一个 `--shout` 参数，把问候语转成大写。

![OpenCode 依次调用 openspec-propose、openspec-apply-change、openspec-archive-change 三个 skill：propose 阶段调用 openspec new change、instructions、status、validate 写出 proposal、spec、tasks；apply 阶段改 greet.py 和测试，4/4 任务完成；archive 阶段调用 openspec-sync-specs 合并主 spec，归档到 2026-11-23-add-shout-flag](/assets/openspec-2-1-hands-on-upgrade/agent-propose-apply-archive.webp)

三步都顺利。几个观察：

- **流程在 skill 里，规则在 CLI 里。** agent 每一步都在调 `openspec instructions <artifact> --json` 拿模板和规则，再用 `openspec status`、`openspec validate` 检查。规则真正的来源是 CLI 和 `openspec/config.yaml`，这也是官方建议把团队约束写进 `config.yaml` 而不是改 skill 的原因。
- **design.md 是可选的。** propose 阶段 agent 判断这个改动只涉及一个文件、没有架构决策，跳过了 `design.md`。归档时这一项显示为未完成，只给警告，不影响归档。
- **归档 skill 不调用 `openspec archive`。** 它让 agent 自己把 delta 合并进主 spec（中间调了 `openspec-sync-specs`），跑 `openspec validate --specs`，再把变更目录挪进 `archive/`。合并后的主 spec 里，原有的需求和新增的「Shout the greeting」都在。
- **默认只装 6 个 skill。** core profile 是 propose、explore、apply、update、sync、archive。new、continue、ff、verify、bulk-archive、onboard 要用 `openspec config profile` 加。

正因为归档是 agent 按 skill 文字执行的，2.1.1 修的那个问题就落在 skill 上。之前的归档 skill 会先改主 spec，到最后挪目录时才检查归档目录是否已存在，撞上同名目录就留下主 spec 已更新、变更却没归档的半成品。[10] 我用 CLI 的 `openspec archive` 在归档目录已存在时分别试了 1.15.0 和 2.1.1，两者都直接报错、主 spec 不动，说明 CLI 本来就是安全的。2.1.1 的修改是在 skill 里加了两次检查：动主 spec 之前查一次，挪目录之前再查一次。

还有一个没修的：`openspec-sync-specs` skill 遇到主 spec 里已经存在的 ADDED 需求时，会让 agent 直接覆盖；CLI 在同样情况下会报冲突。如果你习惯在变更还没归档时就提前同步 spec，后面另一个变更又改了同一条需求，再同步一次就可能把后者的修改悄悄抹掉。这个问题在 2.1.1 上仍是开着的 issue。[11]

## validate --strict 的两处调整

2.1.1 改了 `--strict` 的两条规则。[3] 拿同一个变更测：delta spec 开头有一段 YAML frontmatter，MODIFIED 需求正文写了 632 个字符。

![同一个变更，1.15.0 的 validate --strict 抱怨 frontmatter 不会被带进主 spec，2.1.1 不再抱怨 frontmatter，改为提示 MODIFIED 需求超过 500 字符](/assets/openspec-2-1-hands-on-upgrade/validate-strict-1-15-vs-2-1-1.webp)

1.15.0 把 frontmatter 当成「第一个二级标题之前的多余文字」报警，却没注意到需求写得太长。2.1.1 正好反过来：允许 frontmatter，长需求给警告，建议把例子和边界情况挪进 scenario，或者拆成几条各管一件事的需求。两个版本在 `--strict` 下都以退出码 1 结束，CI 里用 `--strict` 的人升级后可能会看到新的失败项。

## Stores：命令没变，init 的默认值变了

Stores 仍然标着 beta。`openspec store` 的帮助在 1.15.0 和 2.1.1 之间一个字没变，多仓库那套用法照旧。[12] 两个变化值得知道。

![2.1.1 下的 Stores：store setup 建好 checkout-web；在 origin 同名的代码仓库里跑 list 会提示用 --store checkout-web 或在 config.yaml 写 store 行；只写了 store 行的仓库里默认 init 不放任何 skill，加 --scope project 才有 .agents 和 .claude；之后 new change 写进 store](/assets/openspec-2-1-hands-on-upgrade/stores-2-1-1.webp)

第一个是 1.16.0 加的提示。代码仓库里没有 OpenSpec 根目录，而本机注册过一个 id 和仓库 `origin` 名字相同的 store 时，报错会直接告诉你用 `--store checkout-web`，或在 `openspec/config.yaml` 里写 `store: checkout-web`。它只提示，不会替你选，因为不同组织的仓库可能同名。[13]

第二个和全局安装有关。只靠 `store:` 一行指向外部 store 的代码仓库，在 2.1 里直接跑 `openspec init --tools claude`，skill 会装到本机全局，仓库里什么都不放。要让仓库带上 skill，得加 `--scope project`。`config.yaml` 里的 `store:` 行原样保留，之后 `openspec new change` 照样写进 store。站内 Stores 指南的练习用的是 `--tools none`，本来就不装 skill，不受影响；要在代码仓库里给 agent 装 skill，就得记住这个参数。

还有一种做法官方明确不支持：把 `openspec/` 做成指向另一个仓库的符号链接。2.1.0 的 `init` 会在这种布局下报「路径在允许目录之外」，维护者的意见是不打算支持，共享规范请用 Stores。[14]

## 社区里反复出现的问题

- **示例还是旧的。** GitHub 仓库的 README 和 `docs/` 目录里还有大量 `/opsx` 写法，已有 issue 要求更新。[15] 新文档在 openspec.dev，以那里为准。
- **Windows 上的链接。** X 上有人分享 2.0 的目录结构，马上有人回复提醒：Windows 上的 Git 默认会把链接检出成文本文件。[16][17]
- **装成「用户级」的土办法。** 2.1 之前有人在家目录里跑 `openspec init --tools claude`，让 skill 落在 `~/.claude/skills`，所有项目都能用。[18] 2.1 有了正式的全局安装，这种做法可以退休了；而且装了全局 skill 之后，`update` 不会再把家目录当成一个项目来处理。
- **工作流会不会更灵活。** 维护者在一个 issue 里讨论让变更的文档随复杂度增长：小改动只写一页计划，需要时再加设计或安全评审，甚至用「关注点」代替固定模板。[19] 这还是讨论阶段，但说明 2.x 之后的重心会从安装方式转回工作流本身。

## 要不要升级

要，直接到 2.1.1。2.0 解决的是真实的麻烦，多个工具共用一个项目时，一份 skill 比四份副本好维护得多；2.1.1 又补上了 2.1.0 的联网问题。需要你花心思的只有三件事：升级前把改过的内置 skill 挪走；团队先统一 CLI 版本再动仓库；想清楚 skill 放项目还是放全局。

我会给团队仓库先选「留在项目」，等 OpenSpec 有了把版本钉在仓库里的办法再考虑全局；个人机器上选全局，省去每个仓库里那一堆 skill 文件。

这次没覆盖到的：Windows 上的链接检出、GitHub 托管的 Copilot agent 读取仓库内 skill、Homebrew 和 Nix 的升级提示、Kiro，以及在 Claude Code 里实际调用 skill。测试机是 Linux、Node 26.9.0，agent 部分用的是 OpenCode 2.3.2 和它的免费模型。

## 参考来源

1. OpenSpec v2.0.0 release notes：<https://github.com/Fission-AI/OpenSpec/releases/tag/v2.0.0>
2. OpenSpec v2.1.0 release notes：<https://github.com/Fission-AI/OpenSpec/releases/tag/v2.1.0>；升级指南 Upgrade to 2.1：<https://openspec.dev/docs/upgrade-2-1>
3. OpenSpec v2.1.1 release notes：<https://github.com/Fission-AI/OpenSpec/releases/tag/v2.1.1>
4. OpenSpec 文档，Installation：<https://openspec.dev/docs/installation>；v1.16.0 release notes（Node 下限）：<https://github.com/Fission-AI/OpenSpec/releases/tag/v1.16.0>
5. OpenSpec 文档，Upgrade to 2.0：<https://openspec.dev/docs/upgrade-to-2>
6. OpenSpec v1.17.0 release notes：<https://github.com/Fission-AI/OpenSpec/releases/tag/v1.17.0>；迁移计划 issue [#2022](https://github.com/Fission-AI/OpenSpec/issues/2022)
7. Issue [#2232](https://github.com/Fission-AI/OpenSpec/issues/2232)：update 在 `/opsx:*` 和 `/openspec-*` 之间来回改写
8. Issue [#2280](https://github.com/Fission-AI/OpenSpec/issues/2280)：Add wrapper to be able to tie the version to a repository
9. Issue [#2281](https://github.com/Fission-AI/OpenSpec/issues/2281)：init in 2.1.0 requires network
10. Issue [#2276](https://github.com/Fission-AI/OpenSpec/issues/2276)：Archive skill rewrites main specs before detecting an existing archive folder
11. Issue [#2289](https://github.com/Fission-AI/OpenSpec/issues/2289)：sync-specs skill overwrites an existing ADDED requirement
12. OpenSpec 文档，Stores：<https://openspec.dev/docs/stores>
13. OpenSpec v1.16.0 release notes（Store suggestion）：<https://github.com/Fission-AI/OpenSpec/releases/tag/v1.16.0>
14. Issue [#2275](https://github.com/Fission-AI/OpenSpec/issues/2275)：init fails when openspec/ is a symlink to another repo
15. Issue [#2245](https://github.com/Fission-AI/OpenSpec/issues/2245)：Examples after 2.0.0 release
16. @liuzhihangs 在 X 上的帖子（2026-11-13）：<https://x.com/liuzhihangs/status/2121161359685754896>
17. @NabhaniMehdi 的回复（2026-11-13）：<https://x.com/NabhaniMehdi/status/2121196401300283558>
18. @luckinbrew 在 X 上的帖子（2026-11-13）：<https://x.com/luckinbrew/status/2121097416204239099>
19. Issue [#2242](https://github.com/Fission-AI/OpenSpec/issues/2242)：Proposal: Extensible workflows and validation in OpenSpec
