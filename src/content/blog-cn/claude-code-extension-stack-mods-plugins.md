---
title: "Claude Code 扩展全景：从 CLAUDE.md 到 Mods，团队定制该先加什么"
description: "Claude Code 到 2026 年秋已是一套可组合的 harness：CLAUDE.md、Skills、MCP、Subagents、Hooks、Plugins，加上新发布的 Mods、Projects 和 Claude Tag。本文按 agent loop 逐环拆解各扩展管什么、怎么组合、哪里踩坑，结合 Thariq 访谈做判断，并给出团队定制的先后顺序和选型表。"
pubDate: 2026-10-07T10:45:00+08:00
author: "Remy"
tags: ["claude-code", "agent-harness", "mcp", "ai-agents", "developer-tools"]
lang: "zh"
---

一年前说「定制 Claude Code」，基本就是写一份 `CLAUDE.md`，再配几个斜杠命令。到 2026 年 10 月，官方文档里的扩展清单已经很长：CLAUDE.md 和 `.claude/rules/`、auto memory、output style、Skills、MCP、Subagents、dynamic workflows、Hooks、Plugins 和 marketplace，再加上 10 月 1 日发布的 Mods [2][3]。运行位置也不止本机终端：Projects 把一串任务拆成并行的云端会话 [21]，Claude Tag 把 Claude 放进团队的 Slack 频道 [23]。

9 月 29 日 Latent Space 发了一期对 Claude Code 团队 Thariq Shihipar 的长访谈，标题叫「Claude Code 的下一个阶段」，聊了 Mods、Plugins、Projects、Tag，以及「agent 改写自己的 harness」「云端的脑、本地的手」这些说法 [1]。这篇不复述新闻，而是把这些东西放到同一张图上：每种扩展在 agent loop 的哪一环生效、解决什么、怎么组合、坑在哪，最后给一个团队定制的添加顺序。

站内几篇可以对照读：[Agent Harness 模式](/cn/blog/inside-claude-code-agent-harness/)拆的是 Claude Code 核心循环的五层结构，本篇讲的是挂在这个循环外面的扩展；[Agent Skills 2026 综述](/cn/blog/agent-skills-2026-survey-lifecycle-map/)已经把 skill 的生命周期讲完了，这里只讲 Skills 在整个扩展体系里的位置；[CLAUDE.md/AGENTS.md 长文](/cn/blog/claude-md-agents-md-deep-dive/)讲常驻指令文件的写法；[Cowork 改到云端执行](/cn/blog/claude-cowork-cloud-sandbox-where-agents-run/)讲 agent 的「手」放在哪。

事实来自官方文档、官方博客和访谈原文，文末有编号来源；标「判断」的是我的看法。

## 先画一张图：扩展插在 agent loop 的哪一环

官方「Extend Claude Code」页面开头一句话说得很直接：扩展插在 agentic loop 的不同位置 [3]。把一次会话按时间顺序摊开，大致是这样：

| 环节 | 生效的扩展 | 它怎么起作用 |
| --- | --- | --- |
| 会话开始 | CLAUDE.md、`.claude/rules/`、AGENTS.md、auto memory、output style；`SessionStart` hook | 全文或索引进上下文，之后每次请求都带着 [3][15] |
| 每次发请求前 | skill 的名字和描述、MCP 工具名（完整 schema 延后加载）；mod 的 `prompt.compose`、`turn.step` | 让模型知道「有什么可用」；mod 还能改 system prompt 分段、换模型和 effort [3][7] |
| 用户提交 prompt | `UserPromptSubmit` hook；mod 的 `prompt.submit` | 拦截、补充或改写输入 [7][19] |
| 工具调用前 | 权限规则和权限模式；`PreToolUse` hook；mod 的 `tool.call`、`tool.check` | 决定这次调用能不能跑、参数要不要改 [6][19] |
| 工具执行 | MCP server、LSP、插件的 `bin/` | 提供 Claude 内置工具之外的「手」[11][17] |
| 工具调用后 | `PostToolUse` hook | 把 lint 结果等文字送回上下文 [3] |
| 支线任务 | Subagents、dynamic workflows | 在独立上下文里干活，只把摘要带回来 [3][18] |
| 回合结束、压缩、会话结束 | `Stop`、`PreCompact`、`SessionEnd` hook；mod 的 `turn.complete`、`session.compact` | 收尾、检查、记录 [7][19] |
| 界面 | 只有 Mods | 画面板、改写 Claude Code 自己画的部分 [4] |
| 打包分发 | Plugins、marketplace | 把上面这些装成一个可安装、可更新的单元 [10] |

另一个容易忽略的维度是**这些东西在哪台机器上跑**：本机终端、云端会话、Projects 线程、Tag 沙箱能加载的扩展不一样，后面专门讲。

上下文成本官方也列了：CLAUDE.md 每次请求带全文；skill 平时只带描述；MCP 默认开 tool search，闲置工具几乎不占上下文；subagent 用独立窗口；hook 除非返回内容，否则不占上下文 [3]。

## 逐层看：每种扩展解决什么

### CLAUDE.md、rules 与 auto memory：每次都带着的那部分

CLAUDE.md 是你写给 Claude 的常驻说明，每个会话开头都会加载 [15]。官方建议每个文件控制在 200 行以内，越长越占上下文、越不容易被遵守；只对部分目录有意义的规则，挪到带 `paths` 的 `.claude/rules/`，碰到匹配的文件才加载 [3][15]。仓库里只有 `AGENTS.md`、没有 `CLAUDE.md` 时，Claude Code（v2.1.277 及以后）会直接读 `AGENTS.md` [15]；有意思的是，这个能力本身就是一个内置 mod，在 `/plugin` 里叫 `cc-plugin-agents-md` [4]。

auto memory 是另一套：Claude 自己写，存在 `~/.claude/projects/<project>/memory/`，`MEMORY.md` 是索引，每个会话加载前 200 行或 25KB；笔记分 `user`、`feedback`、`project`、`reference` 四类 [15]。

两条官方提醒值得记住。第一，两者都只是上下文，不是强制配置；要保证某件事一定不发生，用 `PreToolUse` hook [15]。第二，项目根目录和用户级的 CLAUDE.md 在会话开始时读一次，会话中途改了不会生效，要等 `/clear`、`/compact` 或重启 [20]。

访谈里 Thariq 对 CLAUDE.md 的态度比文档激进。他说长远看 CLAUDE.md 会消失，现在新开项目甚至可以先不写；看到反复出现的失败模式再补进去。麻烦在于失败模式随模型变化，上一个版本的坑，新版本未必还有，一份越积越长的「失败清单」反而可能把模型限制得过死 [1]。官方「什么时候加什么」的表里，第一条触发条件也是「Claude 把某个约定或命令弄错两次」[3]。

**判断**：把 CLAUDE.md 当成「带模型版本号的回归记录」来维护更合适：每条规则说得出是为哪个失败加的，换底座模型时挑几条删掉跑一跑。这和[长文](/cn/blog/claude-md-agents-md-deep-dive/)里的「两次原则」一致，只是多了「定期删」。

### Skills 与斜杠命令：按需加载的说明书

文档现在明说：自定义命令已经并入 skills，`.claude/commands/deploy.md` 和 `.claude/skills/deploy/SKILL.md` 都会生成 `/deploy`，效果一样 [16]。所以「slash commands」不再是单独一类扩展，而是 skill 的一种用法。

在整个体系里，skill 的位置是「按需的知识和流程」：描述常驻，正文用到才进上下文 [3]。几个和别的扩展相互影响的字段：

- `disable-model-invocation: true`：只能手动 `/name` 调用，描述也不进上下文。有副作用的 skill（部署、发消息）建议这么设 [3][16]。
- `context: fork`：在子 agent 里跑，等于 skill 和 subagent 的组合 [16]。
- `model`：本回合换模型。缓存文档提醒，这一回合等于一次模型切换，下一次请求会整段重读历史、吃不到缓存 [20]。
- `description` 加 `when_to_use` 在列表里合计截断到 1,536 个字符 [16]。

访谈里有个细节：Thariq 说 Claude 在一次会话中途有时会「忘了」自己有哪些 skill [1]，这正是后面 Mods 想补的地方。skill 怎么写、怎么验收，请看[综述](/cn/blog/agent-skills-2026-survey-lifecycle-map/)，这里不展开。

### MCP：接到外部系统

MCP 管的是「Claude 能碰到哪些外部系统」。官方的区分是：MCP 提供工具和数据访问，skill 提供怎么用好它们的知识，常一起用，比如 MCP 连数据库、skill 写清表结构和查询习惯 [3]。

配置上有三个作用域：local（默认，只对自己、只在当前项目，存在 `~/.claude.json`）、project（写进仓库根目录的 `.mcp.json`，随版本控制共享）、user（自己的所有项目）[17]。远程服务推荐 HTTP 传输，例如：

```bash
claude mcp add --transport http notion https://mcp.notion.com/mcp
```

上下文方面，tool search 默认开启，会话开始只加载工具名，完整 schema 用到时再取 [3]。安全方面，文档在 MCP 页面开头就提醒：连接前确认信任这个服务，会抓取外部内容的服务可能带来 prompt injection（提示注入）风险 [17]。

### Subagents 与 dynamic workflows：把噪音隔离出去

subagent 在自己的上下文窗口里干活，只把摘要还给主对话，适合读大量文件、跑大量搜索这类「过程不需要留在主对话里」的任务 [3]。定义文件的 frontmatter 可以限定 `tools`、`model`、预加载 `skills`、`isolation: worktree`（在临时 git worktree 里跑）、`memory`（跨会话的持久记忆）等 [18]。任务大到一把 subagent 管不过来，或者需要交叉核验时，官方建议改用 dynamic workflows：由 Claude 写一个脚本去调度很多 subagent [3]。

和安全相关的一点：从 v2.1.210 起，Claude Code 会扫描 subagent 的最终报告，对模仿 `<system-reminder>` 标签或 `Human:` 开头的文字插入反斜杠，对提到 `bypassPermissions` 之类权限设置的报告加一行标记；文档也说得很明白，这个扫描不判断内容是否恶意，不能替代限制 subagent 能碰到的东西 [18]。

### Hooks：必须每次都发生的事

Hooks 是这套体系里唯一「确定性」的一层：在三十多个生命周期事件上（`SessionStart`、`UserPromptSubmit`、`PreToolUse`、`PostToolUse`、`Stop`、`PreCompact`、`SessionEnd` 等），跑 shell 命令、HTTP 请求、MCP 工具、单轮 prompt 或实验性的 agent 校验 [19]。官方对比 hook 和 skill 时的一句话很好记：在 CLAUDE.md 或 skill 里写「别改 `.env`」只是请求，`PreToolUse` hook 拦住它才是强制 [3]。

官方的示例是用脚本检查路径、命中就 `exit 2` 拦截，注册方式如下 [19]：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/protect-files.sh"
          }
        ]
      }
    ]
  }
}
```

两个边界要清楚。一是 `PreToolUse` 返回 deny 在任何权限模式下都有效，包括 `bypassPermissions`；反过来，settings 里的 hook 只能收紧、不能放宽到超出权限规则 [19]。二是同一事件的 hook 并行执行，几个 hook 同时改写同一工具参数时，最后完成的生效，顺序不确定 [19]。

### Plugins 与 marketplace：打包和分发

plugin 是一个目录，`.claude-plugin/plugin.json` 是清单，里面可以装 skills、agents、hooks、MCP server，以及 mod 用的 hooks 模块 [10]。plugin 里的 skill 带命名空间，如 `/my-plugin:review`，几个插件可以共存 [3]。marketplace 只是一个带 `.claude-plugin/marketplace.json` 的目录或仓库，是目录清单，不是托管商店 [10]。

几条容易忽略的事实：

- 启用的插件在**每个**会话里都算数，它的可自动调用的 skill、agent、命令的名字和描述每一轮都在上下文里，哪怕这次一个都没用 [10]。
- marketplace 分官方、社区、第三方三级，官方和社区的名字只认 `github.com/anthropics/` 下的仓库，冒名的会被拒绝；社区目录几乎每个条目都钉在某个 commit SHA 上 [11]。
- 开了自动更新，你审过的插件文件可能在后台变掉 [11]。
- plugin 里的 agent 定义会忽略 `permissionMode`、`hooks`、`mcpServers` 字段，这些得作为插件级的 hooks 和 MCP server 声明 [12]。

质量上，`claude plugin eval` 会对每个用例同时跑「带插件」和「不带插件」两组，差值 Δ 才是插件的贡献；如果两组都是 1.0，说明不是插件让它过的 [13]。Thariq 在访谈里也提到团队刚给 skills 加了 eval 插件 [1]。分发上，9 月 25 日 Anthropic 开放了目录提交入口，付费计划的开发者可以提交单个远程 MCP 连接器或托管在 GitHub 上的插件包，提交后会自动校验和安全扫描 [14]。

### Mods：改写 harness 本身

Mods 是 10 月 1 日正式发布的 [2]。官方定义：mod 是一个插件，由 JavaScript 或 TypeScript 写的事件处理函数组成；Claude Code 在工具调用、提交 prompt、绘制界面等事件发生时调用它，它可以旁观、改写或直接接管这个事件 [4]。需要 v2.1.287 或更新的 CLI，默认开启 [4]。

和 settings hook 比，mod 跑在 Claude Code 进程**里面**，所以能做 hook 做不到的事 [4]：

- 画自己的界面：转录旁边的面板、输入框上方的一条区域，带按钮和输入框。
- 重画 Claude Code 自己的界面：工具调用那一行、spinner、提问对话框。
- 介入工具调用或请求：先扣住一次调用去问用户、不跑工具直接给结果、把某个请求发给另一个模型。
- 注册一个立即执行的 `/command`，不需要 Claude 回合。
- 同一 mod 的各个 hook 共享文件里的变量。

事件覆盖很广：除了 `tool.call`、`tool.check`、`prompt.submit`，还有渲染 system prompt 的 `prompt.compose` 和 `prompt.section`、每次请求前可换 `model` 和 `effort` 的 `turn.step`、子 agent 启动前可选模型或拒绝的 `agent.spawn`、可跳过压缩的 `session.compact`，每个 settings hook 事件也映射成了 `classic.<Event>` [7]。官方示例里拦截强制推送的写法如下 [6]：

```javascript
on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
  if (/git push .*--force/.test(e.command)) {
    return { deny: 'Force pushes are not allowed in this repository. Push to a new branch instead.' }
  }
  return next(e)
})
```

多个 mod 挂在同一事件上时组成一条中间件链，先加载的在最外层，先看到事件、最后看到结果 [2][6]。顺序由来源决定：内置守卫 `sec-default@builtin` 和组织列在 `prependPlugins` 里的在最前，然后是用户装的，再是 `appendPlugins`，最后是其他内置 mod [6]。

官方已经把部分内置功能改成了 mod：`/diff` 就是，可以关掉或换成自己的版本；博客说以后会继续迁移，让用户可以把 Claude Code 削到一个小内核，再按需加回来 [2]。

访谈补充了一些背景，以下只来自访谈、没有对应的官方文档：Thariq 说内部最初把它叫「function hooks」；设计是 Bun 团队和 Claude Code 团队的人合作做的；他自己在写几个 mod，比如回合结束后用一个 forked agent（复用当前对话的 prompt cache，所以很便宜）判断任务是否完成并出题测验你、一个「登记假设」的工具、一个模型路由器、一个让其他插件注册成可切换模式的模式选择器 [1]。官方 API 里确实有 `$.model.fork`，文档说它在当前对话上问一个问题、大部分走 prompt cache [9]。

官方给的四者对照可以直接用 [4]：

| | Mod | Settings hook | Skill | MCP server |
| --- | --- | --- | --- | --- |
| 是什么 | 插件里的函数，在 Claude Code 进程内运行 | 生命周期事件上跑的命令、HTTP 请求或 prompt | 一份 `SKILL.md` 说明 | 提供工具的外部进程或服务 |
| 能改什么 | 工具调用、prompt、命令、回合、界面 | 是否放行、工具参数和结果、追加上下文 | Claude 知道什么、怎么做 | Claude 有哪些工具 |
| 能画界面 | 能 | 不能 | 不能 | 不能 |
| 什么时候选 | 要面板、要改写事件、要自定义命令 | 用已有脚本拦截、放行或记录 | 总在聊天里贴同一段说明 | 要接外部系统 |

## 访谈里的几个说法，放到扩展体系里怎么看

### 「agent 改写自己的 harness」

先看事实。官方文档里，你可以直接让 Claude 写 mod：它依据内置的 `plugin-authoring` skill，把 mod 写到 `~/.claude/dev-mods/<会话 ID>/` 下；保存第一个文件时，Claude Code 会问你是否为本会话开启热重载，同意后每个改动了 mod 的回合结束时自动重载 [5]。在 `default` 和 `acceptEdits` 模式下，因为 `~/.claude` 是受保护路径，每个文件都要你批准 [5]。没人能批准的会话里（`claude -p`、`dontAsk` 模式）、未信任的工作区里、开了 `--safe-mode` 或组织禁用时，Claude 写的 mod 都不会加载 [5]。

Thariq 的说法是：harness 过时得很快，而且变化方向不直观；从聊天到 agent 是一次，现在「模型能改自己的 harness」是又一次，相当于换一种方式花掉模型多出来的智能 [1]。但他同时说，核心 harness 反而要更复杂、更安全：要沙箱、要 auto mode 管权限、要 computer use 和 MCP、要网页搜索和抓取；变化大的是「你怎么和它交互」[1]。

**判断**：这两句话合起来，说的是 harness 正在分成两层。内核（循环、权限、沙箱、分类器、内置工具）留在 Anthropic 手里，而且越来越重；外壳（界面、提醒、路由、流程编排）变成可以被改写的软件，Thariq 称之为「可变软件」（mutable software）的雏形 [1]。眼下的「agent 改 harness」是「人批准的代码生成」，每一步都有审批、信任和组织策略卡着，离「agent 自主进化 harness」还很远。站内 [RSI 综述](/cn/blog/rsi-recursive-self-improvement-survey-2026/)里反复问的「改的是什么、谁来验收」，在这里的答案是：改外壳，人来验收。

### 「云端的脑，本地的手」

Thariq 把 Claude Code 拆成三块：展示用的界面（artifact，托管在某处，自带数据库）、在云端跑的推理、可以在本机也可以在远程沙箱里的「手」；他说 Claude Tag 已经这么工作，以后还会加上「本地的手」[1]。

官方文档里已经能看到这个结构的落地。Projects 里，每个线程默认是云端会话；需要本机才有的东西时，你可以选「Work locally」，让这个线程通过 Remote Control 在你电脑上的某个文件夹里跑，用 auto mode，电脑睡眠时暂停 [21]。Claude Tag 的每个 Slack 线程在一个临时沙箱里跑，用的是和网页版 Claude Code 相同的引擎，凭证是管理员按频道配置的服务账号，不是提问人的身份 [24]。

对扩展体系来说，最实际的后果是**你在本机配的东西不一定跟着走**。云端会话从仓库的新克隆开始：仓库里的 `CLAUDE.md`、`.claude/rules/`、`.claude/skills/`、`.claude/agents/` 都在；你的 `~/.claude/CLAUDE.md`、用户级 skills、只在用户设置里启用的插件、用默认 local 作用域加的 MCP server 都不在；仓库 `.claude/settings.json` 里声明的插件也不会被安装 [22]。Projects 的插件要在项目设置里单独加，MCP 工具来自 claude.ai 账号上的连接器 [21]。mod 的 hook 在云端会话里会跑（前提是插件能到达那个会话），但画的东西不会显示 [4]。

**判断**：要让定制在本机、云端、Projects 之间都生效，默认把它提交进仓库，而不是放在 `~/.claude`。关于「手」放在哪的更多取舍，见站内 [Cowork 那篇](/cn/blog/claude-cowork-cloud-sandbox-where-agents-run/)。

### 「Tag 是组织级的 harness」

Thariq 引用 Karpathy 的说法，把 Claude Tag 称为「organizational harness」（组织级 harness）：值班、事故、法务问答这类本来就多人参与的工作最适合 [1]。他也直说了风险：比如你有一个收集建议的页面，内容会流进 Slack 的某个 hook，有人在里面写了注入指令，agent 被操纵后带着它能访问的数据把代码库泄露出去；权限和可见性的问题像冰山，水面下很大 [1]。

官方文档对应的设计是：频道里的 Claude 用管理员配置的服务账号，每个频道的权限一样；公开频道里存下的工作区笔记，会在工作区的每个频道被读到 [24]。

**判断**：到了多人场景，最该花心思的不是加功能而是收权限，每多一个连接器、一个能往频道里写字的入口，就多一个注入面。

## 常见的坑

**上下文膨胀。** CLAUDE.md 每次请求都带全文；每个启用插件的 skill、agent、命令描述每一轮都在 [3][10]。对策：CLAUDE.md 压到 200 行内；有副作用或很少用的 skill 设 `disable-model-invocation`；别人的 skill 用 `skillOverrides` 隐藏；用 `/context all` 看每个 MCP 工具占多少 token；`/plugin` 的 Installed 标签里有「最近未使用」分组，官方市场的插件安装前会显示上下文成本估计 [3][10]。

**缓存悄悄失效。** 换模型会让下一次请求整段重算，skill 的 `model` 字段、`opusplan` 在 plan mode 切换时都算换模型；在大多数模型上改 effort 也一样 [20]。插件的 skills、commands、agents、hooks 启停不会让缓存失效，带 MCP server 的插件则按 MCP 的规则走；`/reload-plugins` 如果会触发整段重读，会先警告、不执行，要加 `--force` [20]。**判断**：写模型路由 mod 时，Thariq 说的「不要老是打破 prompt cache」[1] 是硬约束，按请求随意换模型会很贵。

**把插件当成「只是配置」。** 插件可以带 hooks、MCP server、`bin/` 可执行文件，都以你的用户权限运行；hooks、MCP server 和 mod 启动的进程都在沙箱外 [11]。mod 也没有沙箱：能读写你账号能碰到的任何文件、读环境变量里的 API key、看到每个 prompt 和工具调用、在你被询问之前批准工具调用、花你的用量 [4]。

**以为 deny 规则总能兜底。** 内置守卫 `sec-default` 只在两种情况下加载：机器上有 managed settings，或者用户以 Team/Enterprise 计划登录；用 API key 或第三方云的用户，只有在有 managed settings 的机器上才有 [8]。守卫加载时，用户的 mod 不能批准被 deny 规则拒绝的调用；但守卫管不到 mod 自己的 `$.fs` 和 `$.process` 调用，`Read(.env)` 被拒绝了，mod 仍然可以用 `$.fs.read` 读这个文件 [8]。用户 mod 还可以批准一个 `ask` 规则本该弹窗的调用、或者非 managed 的 `PreToolUse` hook 拦下的调用；在 auto mode 下，mod 批准的调用不经过分类器检查 [8]。

**守卫型 mod 默认 fail-open（出错即放行）。** mod 的 hook 抛错、超时或返回格式不对，Claude Code 会跳过它，让下一个处理函数接手 [6]。拦截类的 mod 要加 `.catch` 才会 fail-closed（出错即拒绝）[6]：

```javascript
on('tool.call', { tool: 'Bash' }, guard).catch(async ($, e, next) => {
  return { deny: 'The command guard failed, so this command was not run: ' + next.error.kind }
})
```

**prompt injection 的入口比想象的多。** 会抓外部内容的 MCP server [17]、subagent 读过的网页和文件 [18]、Tag 频道里能写字的外部来源 [1]。官方安全页的建议很朴素：批准前看清命令，别把不可信内容直接喂给 Claude，和外部服务交互的脚本放进虚拟机里跑 [25]。auto mode 从 8 月 14 日起已是 Pro、Max、Team 新会话的默认权限模式 [27]，它靠一个分类器替你审查动作 [26]；Thariq 的解释是，分类器管的是「这个动作是否在用户授权范围内」，模型内部的 probes 管的是意图层面 [1]。站内[沙箱不够用](/cn/blog/sandboxing-not-enough-rogue-agents-authority/)那篇讨论过同一个问题。

**团队共享时作用域错位。** MCP 默认 local 作用域，存在你自己的 `~/.claude.json`，队友拿不到，要共享得用 `--scope project` 写进 `.mcp.json` [17]；插件的 project 作用域写进仓库的 `.claude/settings.json`，但每个协作者仍需在自己机器上安装 [10]；这些在云端会话里又各有例外 [22]。

## 选型表和添加顺序

| 你想要的 | 用什么 | 不要用什么 |
| --- | --- | --- |
| 「永远这样做」的项目约定 | CLAUDE.md，局部的放 `.claude/rules/` | 塞进 skill 或 hook |
| 一定不能发生的事 | `PreToolUse` hook，组织级放 managed settings | 只写在 CLAUDE.md 里 |
| 反复贴的流程或参考资料 | Skill；有副作用的设成只能手动调用 | 全写进 CLAUDE.md |
| 外部系统的数据和动作 | MCP（团队用 project 作用域）＋一个讲用法的 skill | 让 Claude 拼 curl |
| 读很多文件、输出很吵的支线任务 | Subagent，限定工具 | 在主对话里硬读 |
| 同一套配置给多个仓库、多个人 | Plugin＋内部 marketplace | 手工复制 `.claude/` |
| 面板、改写事件、模型路由 | Mod | 用 hook 硬凑 |
| 云端、Projects 里也要生效 | 提交进仓库 | 只放 `~/.claude` |
| 多人在频道里协作 | Claude Tag，按频道配权限 | 把个人凭证接进共享频道 |

团队第一次系统地定制 Claude Code，我建议按这个顺序加。官方给的是一张「遇到什么情况就加什么」的触发表 [3]，下面的顺序以它为骨架，加上了安全和共享的考虑（**判断**）：

1. **先什么都不加。** 用默认配置跑一两周，选好权限模式，能开沙箱就开。Thariq 也说新项目可以先不写 CLAUDE.md [1]。
2. **CLAUDE.md 只写错过两次的东西。** 控制在 200 行内，每条注明为哪个失败而加，换模型时复查 [1][3]。
3. **把「必须」变成 hook。** 受保护文件、危险命令、提交前格式化。hook 不占上下文，最便宜 [3]。
4. **把重复的 prompt 变成 skill。** 有副作用的关掉自动调用 [16]。
5. **把外部系统接成 MCP，再配一个讲用法的 skill。** 先只读，再按需开写权限 [3][17]。
6. **把吵的支线任务交给 subagent。** 用 `tools` 收窄它能碰到的东西 [18]。
7. **第二个仓库要同样配置时，打包成插件。** 建内部 marketplace，钉版本，想清楚要不要自动更新；用 `claude plugin eval` 跑带与不带插件的对照 [11][13]。
8. **最后才是 mod。** 只在需要界面、改写事件或路由时用。装之前用 `claude plugin validate` 看 `hooks:` 和 `calls:` 两行，重点留意 `$.fs`、`$.process`、`$.http.fetch`、`$.env.get` [8]；拦截类的加 `.catch` [6]。
9. **管理员单独做一遍策略。** 决定是否设 `allowManagedModsOnly`（只允许组织自己的 mod）、`disableSideloadFlags`（禁用 `--plugin-dir` 等侧载）、marketplace 白名单 [8]。

第 9 步里最常用的一段 managed settings，官方写法如下 [8]：

```json
{
  "pluginConfigs": {
    "cc-plugin-sec-default@builtin": {
      "options": {
        "allowManagedModsOnly": true
      }
    }
  }
}
```

## 这篇没覆盖、或查不到的

- Mods 的官方 YouTube 视频和 Chase AI 等频道的解读我没有核对，文中只用了文档、官方博客和访谈原文。
- Thariq 提到的模型路由 mod、登记假设的工具、模式选择器、next steps mod 都是他个人在做的东西，没有对应的官方文档或公开仓库，只能当方向参考。Mods 未来是否支持 Claude Tag，访谈里他也说「不知道」[1]。
- 访谈说以后会加「本地的手」，但没说具体落在哪个产品、什么时候；目前文档里能查到的只有 Projects 通过 Remote Control 跑本地线程 [21]。
- Projects 目前是 Pro 和 Max 的公开测试，Team 和 Enterprise 还不能用，测试期间没有组织级管控 [21]；它的长期形态和定价细节文档没有说。

## 参考

官方文档页面没有发布日期，以下文档页均于 2026-10-07 访问。

1. Latent Space. Claude Code's Next Era — Thariq Shihipar, Anthropic（访谈及文字稿）. 2026-09-29. https://www.latent.space/p/thariq
2. Anthropic. Customize Claude Code with mods. 2026-10-01. https://claude.com/blog/claude-code-mods
3. Claude Code Docs. Extend Claude Code. https://code.claude.com/docs/en/features-overview
4. Claude Code Docs. Mods overview. https://code.claude.com/docs/en/plugins/mods/overview
5. Claude Code Docs. Create a mod. https://code.claude.com/docs/en/plugins/mods/create
6. Claude Code Docs. React to events with a mod. https://code.claude.com/docs/en/plugins/mods/events
7. Claude Code Docs. Mods reference. https://code.claude.com/docs/en/plugins/mods/reference
8. Claude Code Docs. Manage mods for your organization. https://code.claude.com/docs/en/plugins/mods/admin
9. Claude Code Docs. Use the mods API. https://code.claude.com/docs/en/plugins/mods/api
10. Claude Code Docs. Plugins overview. https://code.claude.com/docs/en/plugins/overview
11. Claude Code Docs. Plugin security and trust. https://code.claude.com/docs/en/plugins/security
12. Claude Code Docs. Add components to a plugin. https://code.claude.com/docs/en/plugins/components
13. Claude Code Docs. Test plugins with evals. https://code.claude.com/docs/en/plugin-evals
14. Anthropic. Build plugins for Claude with the directory submission portal. 2026-09-25. https://claude.com/blog/build-plugins-for-claude
15. Claude Code Docs. How Claude remembers your project. https://code.claude.com/docs/en/memory
16. Claude Code Docs. Extend Claude with skills. https://code.claude.com/docs/en/skills
17. Claude Code Docs. Connect Claude Code to tools via MCP. https://code.claude.com/docs/en/mcp
18. Claude Code Docs. Create custom subagents. https://code.claude.com/docs/en/sub-agents
19. Claude Code Docs. Automate actions with hooks. https://code.claude.com/docs/en/hooks-guide
20. Claude Code Docs. How Claude Code uses prompt caching. https://code.claude.com/docs/en/prompt-caching
21. Claude Code Docs. Let Claude coordinate ongoing work with Projects. https://code.claude.com/docs/en/claude-projects
22. Claude Code Docs. Configure cloud environments. https://code.claude.com/docs/en/cloud-environments
23. Claude Docs. Work with Claude Tag. https://claude.com/docs/claude-tag/overview
24. Claude Docs. How Claude Tag works. https://claude.com/docs/claude-tag/concepts/how-it-works
25. Claude Code Docs. Security. https://code.claude.com/docs/en/security
26. Claude Code Docs. Choose a permission mode. https://code.claude.com/docs/en/permission-modes
27. Claude Code Docs. What's new, Week 32 · August 3–7, 2026. https://code.claude.com/docs/en/whats-new/2026-w32
