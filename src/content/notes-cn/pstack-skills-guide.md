---
title: "pstack skills 怎么用：首次任务、宿主兼容性和 feature map 实例"
description: "用可运行的 CLI 小项目开始第一次 pstack 任务，区分 Cursor、Claude Code 与第三方移植，并用 feature map 和真实失败、通过记录验收结果。"
date: 2026-10-08
source: "https://github.com/cursor/plugins/tree/main/pstack"
tags: ["ai-agents", "agent-harness", "ai-coding", "code-review", "Cursor"]
lang: "zh"
---

pstack 是 Lauren Tan（[@poteto](https://x.com/poteto)）整理的一组工程 skill。第一次用时，先找一个自己能核对结果的小任务。下面用任务列表 CLI 演示怎样复现错误、提出修复要求，再检查改好的输出；本地示例不需要安装依赖或申请 API 凭据。

可以直接跳到[宿主兼容性](#host-compatibility)、[第一次任务](#first-task)或 [feature map 实例](#feature-map-example)。原来的技能参考保留在后半部分，章节链接不变。

安装说明于 2026 年 10 月 26 日按[官方 pstack 0.15.32](https://github.com/cursor/plugins/blob/e73df471cd4bd918367e99f3dd9c51bd53ddf5f0/pstack/.cursor-plugin/plugin.json)核对。后半部分的技能目录描述的是原先 0.15.15 的快照，其中的 51 个 skill、24 条原则不能当作当前完整清单。工作流背后的判断见[信任够了才谈得上并行](/cn/blog/lauren-tan-poteto-trust-before-parallel/)。

<a id="host-compatibility"></a>

## 先确认自己的宿主能做什么

[官方 README](https://github.com/cursor/plugins/blob/e73df471cd4bd918367e99f3dd9c51bd53ddf5f0/pstack/README.md)已经同时给出 Cursor 和 Claude Code 的安装入口。Claude Code 把外部插件市场称为第三方市场，并不代表 pstack 上游提供的适配就是非官方移植。

<div class="content-table-scroll" role="region" aria-label="宿主 / 安装和入口 / 边界" tabindex="0">

| 宿主 | 安装和入口 | 边界 |
| --- | --- | --- |
| Cursor | `/add-plugin pstack`，然后运行 `/setup-pstack` 和 `/poteto-mode` | 模型规则写入 `~/.cursor/rules/pstack-models.mdc`；能用哪些模型取决于账号。 |
| Claude Code | `/plugin marketplace add cursor/plugins`，再执行 `/plugin install pstack@cursor-plugins` | 使用 `/pstack:setup-pstack` 和 `/pstack:poteto-mode`；规则路径为 `~/.claude/rules/pstack-models.md`。 |
| Codex 或其他宿主 | 先核对已装包的来源和宿主的 skill 加载方式 | 本次核对的上游 README 没有提供 Codex 安装步骤。复制 skill 或安装社区移植不等于完整兼容。 |

</div>

[官方 Claude Code 适配说明](https://github.com/cursor/plugins/blob/e73df471cd4bd918367e99f3dd9c51bd53ddf5f0/pstack/docs/harness/claude-code.md)把不支持的非 Claude 模型名回落到当前会话模型，并跳过依赖不可用 Cursor 能力的步骤。因此不能承诺 Grok 评审面板、Cursor Automations 或云端 agent 原样运行。使用第三方移植前，检查它对应的上游版本、工具映射、模型选择和缺失能力的处理，再决定是否并行执行。能读到 `SKILL.md` 只是第一步。

<a id="first-task"></a>

## 用一个本地 CLI 完成第一次任务

准备 Node.js 22 或更高版本。本地复现不需要包管理器、服务器、账号或模型调用。在一个空目录中放入[有缺陷的 CLI](/assets/pstack-search-repair/task-cli.before.mjs)、[任务数据](/assets/pstack-search-repair/tasks.json)和[验证脚本](/assets/pstack-search-repair/verify.mjs)，保留文件名。[参考修复](/assets/pstack-search-repair/task-cli.mjs)单独提供。

1. 在这个目录打开终端，检查运行环境并复现：

   ```sh
   node --version
   node task-cli.before.mjs tasks.json --status open
   node verify.mjs task-cli.before.mjs evidence-before.json
   ```

   CLI 返回 ID 为 2、`done` 为 `true` 的 `Publish release`，但未完成列表应当返回 ID 为 1 的 `Write release notes`。因此验证脚本输出 `FAIL open` 并退出 1，另外六个命令检查通过。

2. 用支持的宿主打开这个目录，按上一节安装并配置 pstack，再发送下面的任务。在 Claude Code 中，把 `/poteto-mode` 换成 `/pstack:poteto-mode`。

   ```text
   /poteto-mode 修复任务列表的 open 筛选。读取 task-cli.before.mjs，
   把修复后的版本写到 task-cli.mjs，保留原文件。
   不要修改 tasks.json 和 verify.mjs。open 只能返回任务 1，
   done 只能返回任务 2，默认列表和 all 都返回两个任务。
   不支持的状态值、缺失的状态值都必须退出 2，stdout 为空。
   修改前先复现，用现有验证脚本分别检查前后版本，
   回报命令、输出、退出码和证据文件路径。
   只在本地工作，不提交、不创建 PR、不发布、不调用付费外部 API。
   ```

   宿主内的模型会话仍可能消耗账号额度；直接运行本地示例不调用模型。如果 agent 无法执行命令，应当说明阻塞点，不能宣称已经验收。

3. 检查改动。参考修复把 open 分支中的 `task.done` 改成 `!task.done`。运行修复版：

   ```sh
   node task-cli.mjs tasks.json --status open
   node verify.mjs task-cli.mjs evidence-after.json
   ```

   应当得到 `[{"id":1,"title":"Write release notes","done":false}]`，七个命令检查全部通过，另有 `PASS fixture unchanged`，退出码为 0。不做模型练习时，直接把参考修复下载到同一目录，也能执行这两条命令。

这次任务的交付物是修复后的 CLI，以及前后两份证据 JSON。本站于 2026 年 10 月 26 日在 Windows、Node.js v26.7.0 下实际执行，得到[失败记录](/assets/pstack-search-repair/evidence-before.json)和[通过记录](/assets/pstack-search-repair/evidence-after.json)。记录包含参数、stdout、stderr、退出码和文件哈希。这些证据来自真实 CLI 执行；上面的提示词是供读者练习的任务，没有据此声称跑过 pstack 模型工作流。

<a id="feature-map-example"></a>

## 写出能发现这个错误的 feature map

feature map 记录用户如何进入某项功能，以及什么可观察结果算通过。这个小项目的目录如下：

```text
task-cli.before.mjs
task-cli.mjs
tasks.json
verify.mjs
feature-map/
  README.md
  list-tasks.md
evidence-before.json
evidence-after.json
```

可下载的[索引](/assets/pstack-search-repair/feature-map/README.md)和[完整功能条目](/assets/pstack-search-repair/feature-map/list-tasks.md)是本站编写的英文示例，条目的四节结构参照[官方 feature map 样例](https://github.com/cursor/plugins/blob/e73df471cd4bd918367e99f3dd9c51bd53ddf5f0/pstack/skills/create-verification-skill/references/feature-map-example/create-note.md)，不是运行 skill 自动生成的产物。对应内容如下：

| 条目章节 | 这个项目应填写什么 |
| --- | --- |
| Sub-features | 默认列表、all、open、done、非法状态、缺失状态、非法输入 |
| How to get to it (user POV) | 从终端运行 `node task-cli.mjs tasks.json`，通过状态参数进入筛选 |
| Driving it with Node.js | 固定数据、完整命令、预期 JSON、退出码和证据路径 |
| Gotchas | 退出 0 不代表筛选正确；数据文件不能被改动，清理时保留证据 |

没有筛选功能时，旧条目可能只检查默认列表返回 ID 1 和 2。加上 `--status` 后，这个检查就不够了，因为有缺陷的版本也能通过。维护时要补 open 的操作步骤和“只返回 ID 1”的判据，再执行一次，才能看到失败。如果产品有意改了参数名，条目和验证脚本要一起更新并重跑；如果命令没变，只是返回了错误任务，就修产品，不能把预期 ID 改成 2 来消除红灯。

要让 Cursor 生成项目内的验证 skill，可以调用 `/create-verification-skill`，要求使用这里的 CLI、数据和验证脚本，只在本地执行，不提交或创建 PR。Claude Code 中使用 `/pstack:create-verification-skill`。检查生成的启动、doctor 环境检查、操作、证据和清理步骤，再要求端到端跑通。本例没有常驻服务器，也不修改任务数据；若换成有持久化数据的应用，还要加入存储结果的只读复查，以及一次性实例的清理步骤。

## 它想解决什么

从本节到「它管不到的地方」，保留的是 pstack 0.15.15 在 Cursor 中的历史参考。这里的命令、默认模型、自定义模式和工作流建议都按当时的版本理解，不代表当前版本或其他宿主的能力。现在安装和开始任务，请使用前面的[宿主说明](#host-compatibility)和[实操步骤](#first-task)。

README 开头那句是 "if you want to go fast, go deep first"，意思是想快，先把一件事做深。她的判断是：现在 agent 写出来的东西里，凑数的代码太多了，只有吞吐量没有质量，她不想要。pstack 的目标不是让代码行数变多，反而是让你写得更少、质量更高。

第二个说法和演讲是一条线：能深挖一个 agent，并信任它交出可验证的代码，才能放心地同时开好几个。她把这叫做没有顾虑的并行。

第三点是模型。pstack 不绑模型，而且不少 skill 本身就是多模型的：同一件事交给不同家族的模型做或审，取各自所长。

还有一个立场值得单独提：0.15.15 快照中没有专门「写计划」的 skill。当时的 README 里，她说自己不信先写计划这一套，"the best spec is code"，最好的规格就是代码。那个版本的 `/poteto-mode` 提供了对应的 playbook，但没有把计划设为默认步骤。

关于用量，她本人在帖子里说过，2026 年 5 月开源那一周，工程团队用了这些 skill 大约 1 万次。这是她自己的说法，没有独立统计。

## 安装和两个入口命令

0.15.15 指南给出的 Cursor 聊天安装命令如下：

```text
/add-plugin pstack
```

装完只需要记两个命令。

第一个是 `/setup-pstack`。在这个快照中，它先探测账号可用的模型，再提供 unlimited、large、medium、small 四档推理预算，默认是 large，也就是 xhigh，随后让你确认各角色的模型。角色包括写代码、做判断和写文字，以及评审面板。确认后，配置写入每次会话自动加载的 `~/.cursor/rules/pstack-models.mdc`。没有配置的角色使用 skill 内置默认值；`auto` 或 `inherit-parent` 表示跟随会话模型。按当时的 README，代码工作默认交给 Grok，最难的改动、文字和判断交给 Opus 5.5，评审面板由这两家各出一个模型。

setup 最后还会看你的项目里有没有能证明应用行为的验证手段。没有的话，它会问一次要不要用 `/create-verification-skill` 生成一个。指南的建议是新手直接答应，这一步回报最大，后面会细讲。

第二个是任务开头使用的 `/poteto-mode`。当时的指南把普通回车描述为只附加到一条消息；在斜杠菜单里按 Option+Enter（Mac）或 Alt+Enter（Windows）选择，则进入 custom mode（自定义模式），每一轮保留在上下文中，直到退出。这是指南对当时 Cursor agents 窗口和 CLI 的描述。

拿不准该用哪个 skill，就问 `/poteto-help`。它回答问题、给你一句可以直接发的 prompt、附上答案出自哪个文件，但不会替你开工，因为跑一次 pstack 要花不少 token。

### 入口与配置（4 个）

| skill | 一句话 |
| --- | --- |
| `poteto-mode` | 总入口：挑 playbook、建任务表、按需调其它 skill，要求拿证据才报完成 |
| `poteto-help` | 问「该用哪个」的地方，只给答案和可发送的 prompt，不替你开工 |
| `setup-pstack` | 探测可用模型，按角色配模型和推理预算，写成一条全局规则 |
| `automate-me` | 从你最近的聊天记录里提炼工作习惯，生成你自己的 `-mode` skill |

`automate-me` 值得多说一句。`poteto-mode` 是她一个人的风格，未必适合你。`/automate-me` 会翻你在当前工作区最近的对话，找出你反复表达的偏好（回复怎么写、怎么分派、怎么验证、代码和文字的要求），问你哪些真的是你，然后借 Cursor 自带的 `create-skill` 起草一个 `<你的名字>-mode`，再过一遍 `unslop`，最后从 worktree 开 PR 让你审。底下仍然走 pstack 的机制。

## 一次任务怎么走

`/poteto-mode` 做的事情可以拆成这几步：

1. 读你的需求，先读原则索引，再从 23 个 playbook 里挑一个匹配的。playbook 就是写好的固定流程，比如 bug fix、perf、feature、refactoring、prototype、babysit（把 PR 盯到可合并）、shipping、overnight 跑的 autonomous run 等。
2. 开一张任务表，前几项是 playbook 的步骤原样抄进来。它决定跳过某一步，那一步不会消失，而是留在表里标一行 `skip: 原因`，你能看到它没做什么。
3. 走到哪一步需要什么，就调用对应的 skill，比如 `how`、`architect`、`interrogate`、`unslop`。
4. 回复里要点名它用了哪条原则、这条原则改变了哪个决定。没有对应决定的原则引用，指南直说那是在拿名字充门面。
5. 报完成之前要拿证据。每个说法要标清楚是测出来的、推出来的还是猜的。
6. 要改代码的 playbook，最后都接「开 PR」这一步：从 worktree 出发、整理成小而有序的 commit、清理 diff、给描述去 AI 腔。

再补几条它默认的行为。可逆的事情直接做，不问「要不要」；不可逆的事情一定停下来等你，比如往共享分支 force-push、部署、删数据、给客户发消息。开子 agent 时默认开新的，把原始需求和后续指示合并交过去，而不是续用一个旧会话，因为续用容易丢指示。

prompt 怎么写，指南给了五样东西：目标、能判对错的完成条件、你想看到的证据、你已经知道的线索、真正的约束（比如「先复现」「先别改代码」「行为零变化」）。有两样建议别写：一是具体怎么做，二是你对原因的猜测，至少一开始别说，免得 agent 只在你指的地方找。最常见的坑是在 prompt 里列 skill 顺序，「先 /how 再 /architect 再 /arena」这种。playbook 已经排好了顺序，你手排的通常会漏步骤或打乱顺序。只有想改掉某个默认选择时才点名 skill。

## 干活与并行

这一组管的是动手之前和动手时怎么分工。

`architect` 是写代码前先画骨架：调用方怎么用、类型、函数签名、模块边界，函数体先空着。它会先用 `how`（必要时加 `why`）弄清要改的代码，再用 `arena` 让几个模型各出一版草图，合成之后再动手。默认合成完直接进入实现，想先看设计就说「带检查点，实现前停下」。如果实现时发现到处要打同一个补丁，或者类型只有靠 `any` 和强转才过得去，它把这当成设计错了的证据，推倒重来，而不是继续打补丁。

`arena` 和 `swarm` 都是并行，但用途不同，指南专门把这条列成了常见误用。`arena` 是同一份需求交给 N 个子 agent 各做一遍，一个只读的评委（配置允许时用另一家族的模型）按评分标准打分，主 agent 挑最好的一版当底子，把其它版本的长处嫁接进来，再验证。`swarm` 是把活切成互不相干的几片，或者让几条路线赛跑，每个 worker 管自己那片，回报 PASS、ISSUES 或 BLOCKED，最后汇成一份报告，不做挑底子、嫁接那一套。要比设计用 arena，要覆盖面用 swarm。

`figure-it-out` 是没有合适 playbook 时的兜底：先设计一份能审计的 playbook，再按它执行。大迁移、多段改动、你走开后回来要审的活，就算 feature playbook 也能套，`poteto-mode` 也会把它路由到这里。它要求先把「完成」写成可证伪的条件，并接上 `show-me-your-work` 留决策日志。

`show-me-your-work` 就是那份决策日志：一个 TSV 文件，一行一个决定，列是时间、阶段、做了什么、为什么、证据（commit、PR 号、文件行号、截图路径之类的指针，不写成段落）、结果。默认只留在本地，活够大、审的人需要靠这份记录来信任结果时再 commit。

| skill | 一句话 |
| --- | --- |
| `architect` | 先定调用方用法、类型、签名和模块结构，再实现；实现证明设计错了就重来 |
| `figure-it-out` | 没有现成 playbook 时，先设计一份可审计的流程，再按它跑 |
| `arena` | 同一需求并行出 N 个候选，挑一个当底子，把其它候选的长处嫁接进去 |
| `swarm` | 把活切片或赛跑，N 个 worker 并行，收齐后出一份汇总报告 |
| `tdd` | 只在你明确要求，或 bug 有便宜的本地测试路径时，先写失败测试再修 |
| `show-me-your-work` | 长时间或无人值守的工作留 TSV 决策日志，一行一个决定 |
| `make-bot-ui` | 做一个小页面，按钮通过 webhook 唤醒 Grok Bot，密钥留在本机服务端 |

## 验证与纠错：和演讲里的五层对照

这一组是 pstack 里最值得看的部分，因为它和演讲里的五层纠错是同一条线。先回顾一下那五层，从强到弱：第一层是代码库和架构，让坏写法在类别上写不出来；第二层是静态分析，lint、编译器、CI；第三层是规则、Bugbot 和 skill，这里已经从强制变成了引导；第四层是风格指南和人工 review；第五层是验证 skill，它能证明功能做成了没有，但不证明性能和代码质量。

下面这张对照是本文按 skill 的作用排的，不是她公开给过的表：

| 演讲里的层 | pstack 里对得上的 skill |
| --- | --- |
| 第一层：架构 | `correct` 的第一选择；`no-comments` 把注释里声称的约束改写成代码里的约束 |
| 第二层：静态分析 | `correct` 退一步用类型、lint、CI；原则 `encode-lessons-in-structure` |
| 第三层：规则与 skill | `reflect` 把一次会话的教训落成 skill 的修改；pstack 自己整体也在这一层 |
| 第四层：人工 review | `interrogate` 用多个模型做对抗式评审；`no-comments` 里的 Comment Sicko 也是一个评审者 |
| 第五层：验证 | `create-verification-skill`、`maintain-verification-skill`、原则 `prove-it-works` |

### correct：把反复纠正的错从 prompt 里搬进仓库

`/correct` 几乎就是演讲里那套顺序本身。它先读最近的 commit、回滚、review 评论、agent 说明文件，以及那些解释绕过办法的注释，把错误归成类，同一类出现两次才算数。然后每一类在「能管住的最高层」修：先试架构（每份状态只有一个 owner、每件事只有一种支持的做法、藏起内部实现让错误的 import 直接失败、删掉 agent 会照抄的旧写法）；不行就上类型，坏代码仍能编译，就加一条 lint 或 CI 检查，报错信息要直接说该改用哪个文件、类型或函数；再不行写测试；文档和 agent 规则放最后，只留给需要判断的事，因为 agent 跳过规则时什么都不会失败。

它还要求每条新检查都要在一个真实的历史错误上证明自己会报错，并在 agent 说明文件里维护一张表，把每条规则和执行它的东西配对。一条规则如果没有任何东西在执行，下次再犯就算重复，要在同一个改动里往高处修。指南里还有一句：人工 review 不在这张清单上，因为每个 PR 都要人去抓同一个错，正是这件事要解决的问题。

### no-comments：注释交给没写它的人审

`/no-comments` 会开一个叫 Comment Sicko 的只读子 agent 专门审注释。理由很直接：写注释的 agent 会护着自己的注释。Comment Sicko 只留很少几类：许可证头、公开 API 的文档注释、用来解释代码说不清的东西的链接、被你改不了的外部依赖逼出来的行为。其它的都删。如果注释是在解释你自己代码里的一个怪地方，它会被当成「这里该重构」的信号，`/no-comments` 去根上修，而不是把注释写得更好看。注释里写着「不要删」「改之前先找某某」这类约束的，它会提议改成类型、运行时检查、测试或 lint，你同意就先编码再删注释。

这和演讲里讲注释的那段是同一个担心：agent 会把注释当成不修真问题的理由，而仓库里的样子会被下一个 agent 照抄。演讲里她讲的是自己团队框架 Dune 直接禁注释，Dune 是内部框架，不属于 pstack；pstack 里对应的是这个 skill。

### 验证 skill：create 和 maintain

`/create-verification-skill` 给你的项目生成一个本地验证 skill，放在 `.cursor/skills/verify-<app>/`。它先「问仓库，不问你」：用户实际碰的是什么（网页、CLI、桌面应用、API），本地怎么启动，用什么驱动（优先用仓库已有的测试框架，没有再选浏览器加 CDP、PTY 或直接 HTTP），能留下什么证据，能不能同时开两个实例。代码回答不了的才问你。

生成的 skill 有固定几节：启动、体检（一个只读检查，判断这个实例值不值得驱动）、驱动、证据、清理。另外有一份 feature map（功能地图），每个面向用户的功能一个文件，写清怎么到达、怎么驱动、看到什么结果才算做成。交付之前它要把自己从头到尾跑一遍：启动、体检、驱动一个功能、留证据、清理，而且清理后证据还得在。没跑通的产出别用。

`/maintain-verification-skill` 是定期维护，指南建议至少每天跑一次，最好挂在定时自动化上。每个功能派一个只读子 agent 读源码，看文档有没有漂移，然后由一个活会话把地图上的每个功能实际驱动一遍。结果只有三种：clean（全覆盖，没东西要改）、changed（一个 PR，只改验证 skill 自己的目录）、blocked（说清卡在哪）。它从不改产品代码；实际跑的时候发现产品退化了，它报告退化，不去改文档把问题盖住。

如果你看过演讲那篇，会发现结构和她讲的内部验证 skill 很像：一套可复现的驱动方式，加一份落盘的功能地图。不过她讲的那个 Control Glass 是内部的，没有公开，也不在 pstack 里。pstack 给的是生成这类 skill 的工具。

### 数字和影响范围：benchmark-checklist 与 blast-radius

演讲里说过，验证 skill 只证明做没做成，不证明快不快。pstack 用 `benchmark-checklist` 和原则 `explain-the-number` 补这一块。报一个性能数字之前，它要你用实际运行的证据回答七个问题：瓶颈在哪、为什么不是两倍；两边是不是都按生产方式调好了（release 构建、生产配置、缓存冷热一致）；结果有没有突破物理上限，比如磁盘带宽、核数；有没有报错或输出不对；交替多跑几次能不能复现，给中位数和范围；对用户真正等待的那条路径有没有意义；计时区间里活到底有没有真的跑。结论只有四种：更快、更慢、无可测差异、无法判断。说不出瓶颈或某一边没调好，就判无法判断。

`blast-radius` 管的是另一个问题：一个看起来很小、你又不太放心的 diff，在 diff 之外会砸到哪里。它的要点是别信自己写得头头是道的分析。找出这个改动之所以安全所依赖的那一两条事实，然后写个小脚本或测试真的跑一下来证明，而不是写一篇论证。

### interrogate 和 reflect

`/interrogate` 把同一份 diff、意图和评分标准发给不同家族的模型，各自独立挑毛病。重点是模型的多样性，不是给它们分配角色：两个模型各自独立提到的问题，可信度最高。主 agent 扮演务实的资深工程师，把结果分成「要处理」「可以考虑」「记一下」「驳回」四类，驳回要写理由，而且不会自动改代码。指南提醒，驳回的那些也要看，主 agent 不是神谕。另外别拿它去审一份没有代码的抽象计划，评审会编出一堆不会发生的风险。

`/reflect` 在一个任务做完之后用：开三个并行的审查子 agent 扫当前对话，各自从判断、工具、发散三个角度提炼教训，再由一个汇总者分成采纳、拒绝、待办三类。能用 lint、脚本或元数据强制的项会被挪到待办，交给更高的层去修。采纳的部分要等你点头才改 skill，因为 skill 改了会影响以后所有 agent。指南的分工说得很清楚：`/reflect` 从一次会话里改进 skill，`/correct` 改仓库，让一类错不再出现。

| skill | 一句话 |
| --- | --- |
| `create-verification-skill` | 为项目生成像用户一样驱动应用的本地验证 skill，带 feature map，交付前自测一遍 |
| `maintain-verification-skill` | 定期按功能读源码、再实际驱动一遍，让验证 skill 和功能地图不过期 |
| `benchmark-checklist` | 报或用一个性能数字前，用七个问题核对它是不是真的 |
| `blast-radius` | 找出改动在 diff 之外会砸到哪，并跑真实代码证明它安全所依赖的那条事实 |
| `correct` | 把 agent 在这个仓库里反复犯的错按架构、类型与 lint、测试、文档的顺序修掉 |
| `no-comments` | 派 Comment Sicko 审注释，删掉该删的，把声称的约束改成代码约束 |
| `interrogate` | 多个不同家族的模型对抗式评审一份 diff，主 agent 分类给结论，不自动改 |
| `reflect` | 三个子 agent 扫当前对话提炼教训，经你批准后落成对现有 skill 的修改 |

## 弄懂代码：how、why、teach、recall、bro

这一组都是只读的，动手之前用。指南的说法是，agent 出错通常两种原因：没听懂你要什么，或者缺做对这件事的上下文。这一组管后者，同时逼 agent 用你能核对的话把自己的理解讲出来。

`/how` 回答「X 是怎么工作的」，以及「这段该放哪、归哪个包、是不是这一层」之类的问题。目标是像资深工程师带新人熟悉一个子系统那样讲，讲到能建立心智模型就够，不要讲成逐行注释的源码。问题窄就直接读、直接讲；子系统大就先并行开几个只读探索者，再交给一个讲解者。

`/why` 回答「为什么是这样」：设计理由、为什么选 Y、回归、事后复盘、某个阈值有没有数据支撑。它从版本控制查起，然后看你接了哪些 MCP，并行去问 issue 系统、长文档、聊天记录、监控、错误追踪、数据仓库。报告要引用来源，把直接证据和推断分开；查不到也照实报，因为「没人写下过原因」本身就是答案。

`/teach` 叠在这两个上面：跑 `how` 和 `why`（小改动可能只跑一个），然后把结果揉成一份白话讲解，一张图一张图地往上搭。它针对的是「摘要不够、我想真的懂」的时候，也可以拿来问 agent 自己的选择，比如为什么这样实现而不是用队列，取舍了什么。

`/recall` 在开始或接着做一件事之前用。它从你自己的聊天记录里，加上共享记录（用户反馈、过去的修复和回滚、还在报的错误），重建这个话题的近况，交回一份简短的当前状态说明。想接着某一个具体的旧会话，那是 session pickup playbook，不是它。

`/bro` 最简单：把上一条回复用白话重说一遍，不要黑话，更短。回复技术上很周全、你却没看懂它说了什么时用。

| skill | 一句话 |
| --- | --- |
| `how` | 讲清 X 怎么工作、改之前的代码走查、该放哪一层归谁 |
| `why` | 查设计理由和历史，并行问各类证据来源，引用出处、区分证据和推断 |
| `teach` | 跑 how 和 why，把一块工作讲到你真的懂，配逐步叠加的图 |
| `recall` | 从你的聊天记录和共享记录里重建近况，给一份当前状态简报 |
| `bro` | 把上一条回复用大白话重说一遍 |

## 写作：technical-writing、unslop、typescript-best-practices

`unslop` 在 skill 描述里写着「必须始终启用」。它是一份去 AI 腔的规则表，规则有固定编号，别的 skill 可以按编号引用：空洞的现在分词短语、「专家认为」这类模糊出处、一组 AI 爱用的词、「不仅……而且……」、硬凑三点、同义词轮换、破折号、句中冒号、滥用加粗、每行前面一个加粗标签等等。`poteto-mode` 写回复也守这套，比如不用长破折号、一句只说一件事。

`technical-writing` 是一套分层的技术写作标准，用在文档、RFC、README、PR 描述和 commit message 上。四层各问一个问题：这是哪类文档（Diátaxis 框架，把文档分成教程、操作指南、参考、解释四种，一篇只做一种），句子怎么对读者说话（Google 开发者文档风格），每句话承担多少内容（STE，简化技术英语里写指令的规则），有没有句子能读出两种意思（Global English，面向非母语读者的句法）。目标是让一个累了的工程师第一遍就读懂。它也提醒别矫枉过正：一句话守了所有规则却读起来像机器写的，就算失败。

`typescript-best-practices` 把类型纪律落到 TypeScript 语法上：用带 `kind` 字段的联合类型表示变体，给语义上不同的原始类型打 brand，外部数据先当 `unknown`，先用仓库已有的运行时 schema 库再手写类型守卫，不随便用 `as`。指南特别说明它不会自己加载，碰 `.ts` / `.tsx` 时要自己敲 `/typescript-best-practices`。

| skill | 一句话 |
| --- | --- |
| `technical-writing` | 分层写作标准：先定文档类型，再管句子、信息密度和歧义 |
| `unslop` | 去掉文字里的 AI 腔，要求始终启用 |
| `typescript-best-practices` | 读写 .ts / .tsx 时用，把类型纪律落到具体写法上 |

## 24 条原则

原则是 24 个很短的 skill，一条一个。`poteto-mode` 里有它们的索引，多步任务开始时读，碰到触发条件就套用。单独成文件，是为了让别的 skill 能按名字引用，也让索引能指向完整规则。

对用户来说，原则最实用的地方是拿来纠偏。你不用调用它们，直接说名字就行。agent 想在三个旧适配器上再加第四个，你说一句「subtract before you add，先删掉过时的适配器」；它说构建过了就算完成，你说「prove it works，跑真实的导入流程，把写进去的记录给我看」。每个名字背后是一条它已经读过的完整规则，一句话比一段说明更准。不过它仍然要在回复里说明这条原则改变了哪个决定。

<div class="content-table-scroll" role="region" aria-label="组 / 原则 / 一句话" tabindex="0">

| 组 | 原则 | 一句话 |
| --- | --- | --- |
| 核心 | `laziness-protocol` | 重构或掂量 diff 时偏向删除和最小改动，别加抽象层 |
| 核心 | `foundational-thinking` | 写逻辑前先定核心类型和数据结构，想清并发方共享什么 |
| 核心 | `redesign-from-first-principles` | 新需求进来时，当它从第一天起就是前提那样重新设计，而不是外挂 |
| 核心 | `attack-the-premise` | 共享同一前提的两次以上修复都在同一关失败，就回头质疑前提 |
| 核心 | `subtract-before-you-add` | 先删死代码、多余校验和残留引用，再在干净的底子上加东西 |
| 核心 | `minimize-reader-load` | 数清从问题到答案要穿几层、读者脑子里要记多少隐藏状态，能收就收 |
| 核心 | `outcome-oriented-execution` | 分阶段重写或迁移时直奔目标架构，不为平滑过渡留临时兼容代码 |
| 核心 | `experience-first` | 产品和范围取舍时，用户体验优先于实现方便，少而精 |
| 核心 | `exhaust-the-design-space` | 没有先例的交互或架构决定，先做两三个竞争原型并排比较 |
| 核心 | `build-the-lever` | 非平凡的活先造工具（codemod、脚本、生成器）来做或来证明，别手工干 |
| 架构 | `model-the-domain` | 有状态或分支多的逻辑，把领域规则编码进一个结构，而不是散落的条件判断 |
| 架构 | `boundary-discipline` | 校验和错误处理集中在系统边界，内部信任类型，业务逻辑保持纯函数 |
| 架构 | `type-system-discipline` | 让非法状态无法表示，外部数据在边界解析，不对编译器撒谎 |
| 架构 | `make-operations-idempotent` | 命令和处理循环在崩溃、重启、重试后都收敛到同一个终态 |
| 架构 | `migrate-callers-then-delete-legacy-apis` | 引入新内部 API 时同一波迁完调用方并删掉旧 API |
| 架构 | `separate-before-serializing-shared-state` | 多方可能写同一个文件、分支或键时，先消除共享，再考虑串行化 |
| 验证 | `prove-it-works` | 宣布完成前对真实产物验证，「能编译」不算 |
| 验证 | `fix-root-causes` | 调试时先复现，一路问为什么追到根因再修，别堆空值检查压住崩溃 |
| 验证 | `sequence-verifiable-units` | 多步工作和 commit / PR 拆成能各自验证的小单元，验完一个再下一个 |
| 验证 | `test-behavior-not-implementation` | 测试按用户的调用方式调，对字面期望值断言；函数全返回空还能过的测试要重写或删掉 |
| 验证 | `explain-the-number` | 信任或报告一个测出的数字之前，先说清什么在限制它、它测的是不是你以为的那件事 |
| 分派 | `guard-the-context-window` | 上下文快满时把大块读取交给子 agent，主线只留摘要 |
| 分派 | `never-block-on-the-human` | 可逆的事别问「要不要做」，先做、给结果、让人事后纠正 |
| 元 | `encode-lessons-in-structure` | 同一条指令写到第二次，就把它变成 lint、元数据、运行时检查或脚本 |

</div>

指南的建议是别背这张表，扫一遍，等哪天看到 agent 做了某个名字本可以拦住的事，再回来查。

## 示意流程：修一个性能回归

下面是一个示意流程，用来说明各个 skill 在一次任务里大概落在哪，不是她公开写过的固定顺序。而且按指南的说法，你不应该把这串顺序写进 prompt，让 `poteto-mode` 自己排。

假设某个列表页上周合了几个 PR 之后打开明显变慢。你只发一句：

```text
/poteto-mode the session list got noticeably slower to open after last week's merges. capture a baseline trace, find the cause, fix it, and show me before and after.
```

1. `poteto-mode` 把它匹配到 perf playbook，任务表前几项就是那份 playbook 的步骤。
2. 先采基线 trace。这一步要用对应界面的 control skill 去驱动应用（这类 skill 不在 pstack 里，见下一节），或者用你项目里的验证 skill。
3. 基线数字先过 `benchmark-checklist`：缓存冷热是否一致，是不是 debug 构建，计时区间里活有没有真的跑。之后每个新数字都要过一遍。
4. 用 `how` 把列表的渲染和数据加载路径讲清楚，作为提假设的依据。perf playbook 还要求按成本从低到高试几条思路：先看这活能不能不做，再看能不能只做一次、少做、晚点做、趁用户不注意时做、并发做，最后才是做得更便宜。前面一条达标就停。
5. `explain-the-number`：在信这个数之前，先说清它为什么是这个值、瓶颈在哪。
6. `fix-root-causes`：定位到真正的原因再改，比如找到是哪段代码在不该重算的时候重算了，改在原因所在的地方，而不是在症状出现的那一层打补丁。修复如果跨了函数边界，先过 `architect`。
7. `prove-it-works`：修完在真实应用上再采一次 trace，解析两份产物做对比。「无法判断」或者测错了界面都不算通过。
8. `blast-radius`：这一步 perf playbook 里没有，是你自己可以加的。diff 看起来不大但你不放心时，敲 `/blast-radius`，让它找出这个改动安全所依赖的那条事实，跑代码证明。
9. 最后开 PR：commit 拆小，描述里写基线、修复后的数字、差值和产物路径；review 之前跑 `no-comments`。

## 它管不到的地方

**skill 是引导，不是强制。** 这是她自己的分层：规则和 skill 在第三层，agent 可能忘了读，人也可能不理。pstack 本身整体都在这一层。`poteto-mode` 把跳过的步骤留在任务表里，让你看得见，但看得见不等于拦得住。另外，除了 `setup-pstack`，这些 skill 的 SKILL.md 开头配置里都标了 `disable-model-invocation: true`，也就是模型不会仅凭描述自己加载它们，要么你敲斜杠命令，要么 `poteto-mode` 在流程里调用。真正要拦住的错，得靠 `correct` 推到架构、类型和 lint 那几层去修。

**多模型取决于你账号里有什么。** `interrogate`、`arena`、`reflect` 的价值有一部分来自不同家族的模型交叉看。`setup-pstack` 只会写入它确认你能用的模型；如果你只有一家的模型，或者全设成 `auto` 跟随当前聊天模型，这些 skill 还能跑，但「两个模型独立发现同一个问题」这个信号就弱了。

**`tdd` 不是默认步骤。** 只有你明确要求 TDD、失败测试或回归测试，或者 bug 有明显、便宜的本地测试路径时才用。测试需要大量搭环境、脆弱的 mock 或很重的端到端设施时，它会说明并改用最接近的可执行检查。bug fix playbook 里也只是在有便宜测试路径时才建议走它。

**有几样东西它会引用，但不在包里。** `/deslop`（清理代码里的凑数内容）、`control-cli` 和 `control-ui`（驱动 CLI、浏览器和 Electron 应用的 control skill）在另一个插件 `cursor-team-kit` 里；`/create-skill` 是 Cursor 自带的。想要全套，两个插件一起装。上面性能示例的采 trace 那一步就依赖 control skill 或你自己的验证 skill。

**它要花 token。** 子 agent 和评审面板都是额外开销。指南给的省法：调低推理预算或换便宜模型，让写代码的角色用快模型，缩短面板列表，小而明显的改动别开 `poteto-mode`。

**它是她的风格。** 默认的 playbook、口吻和原则来自她一个人的习惯，那个版本提供了 `automate-me`，供使用者生成自己的 mode。这里记录的默认模型属于 0.15.15，可能与你安装的版本不同。当时的仓库还附带默认不启用的自动化包 benny，用来分拣 Slack 上的问题反馈并复现修复；它不计入这 51 个 skill，`poteto-agent` 和 Comment Sicko 两个子 agent 也不计入。

## 链接

- [pstack 在 Cursor 插件市场的页面](https://cursor.com/marketplace/cursor/pstack)
- [pstack README](https://github.com/cursor/plugins/blob/main/pstack/README.md)
- [pstack 指南（10 章，从安装到通宵跑任务）](https://github.com/cursor/plugins/blob/main/pstack/docs/guide/README.md)
- [仓库里的 pstack 目录，每个 skill 的原文都在 skills/ 下](https://github.com/cursor/plugins/tree/main/pstack)
- 本站相关：[信任够了才谈得上并行：Lauren Tan 这场演讲在讲的机制](/cn/blog/lauren-tan-poteto-trust-before-parallel/)
