---
title: "Gemini Gems 11 月 17 日起变成 skills：专属助手拆成可叠加的斜杠指令，迁移前先查这几处"
seoTitle: "Gemini Gems 变 skills：11 月 17 日迁移前检查清单"
description: "Google 宣布个人账号的 Gems 从 2026 年 11 月 17 日起自动迁成 skills，Workspace 2027 年 3 月、教育版 6 月跟进。本文对照两者的调用、叠加、文件、分享、年龄与平台差异，列出自动迁移不保证的部分和迁移前检查清单。"
pubDate: 2026-10-12T16:40:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "Agent Skills", "developer-tools"]
lang: "zh"
---

9 月 27 日，Gemini 网页版的 Gems 管理页顶上多了一行提示：「Gems 将从 2026 年 11 月 17 日起变成 skills。」下面一句说得更具体：从那天开始自动迁移，迁移完成之前 Gem 照常能用 [2]。三天后 Google 发了官方博客，确认 skills 进入 Gemini 主聊天界面，Gems 会逐步退场，现有数据到时自动迁过去 [1]。TechCrunch 的 Sarah Perez 在 9 月 28 日 10:29 PDT（北京时间 9 月 29 日 01:29）把这件事写成「Google 要关掉 Gems」，顺带吐槽了一句：用斜杠选 skill 是工程师喜欢的交互，普通用户未必买账 [3]。

如果你只是偶尔用一两个 Gem，什么都不做也行，Google 会替你转。但如果你像不少重度用户那样，攒了十几个 Gem：一个挂着整学期讲义的学习教练，一个绑了 Drive 里品牌手册的文案助手，一个默认开 Canvas 的写作搭子，一个分享给全组的周报模板——那么「自动迁移」这四个字里有好几处没说清楚的地方，值得在 11 月 17 日之前花一个下午自己测一遍。

这篇不重复站内已经写过的企业治理问题（[Gemini Enterprise 的身份、审计、花费](/cn/blog/gemini-enterprise-agent-identity-audit-spend-caps/)那篇讲过公司 skill 注册表该怎么管），只看消费端：**一个「专属助手」被拆成「可组合的说明书」之后，机制上变了什么，哪些东西会在迁移里丢，以及怎么提前检查。** 文中的事实都来自 Google 官方博客、帮助中心和 Workspace Updates；转述类报道会标明是二手来源；标了「判断」的是我自己的分析。

## 先说清楚变的是什么

Gem 是 2024 年推出的功能，Google 的说法是「自定义版本的 Gemini」[2]。你给它起个名字、写一段指令、挂几份知识文件，它就成了一个独立的助手，在侧边栏有自己的入口。Google 自带的预制 Gem 有学习教练、头脑风暴助手、职业顾问、编程搭档、编辑；用户自己建的五花八门，跑步教练、营养师、旅行规划都有，还能把 Gem 分享给别人 [3]。

skill 走的是另一条路。按 Google 帮助中心的定义，skill 是一组可复用的指令加上下文，告诉 Gemini 某类任务怎么做、用哪些工具 [5]。它有三个跟 Gem 不同的地方 [4]：

- **随处调用。** 在任意一个 Gemini 对话里输入 `/` 再选 skill 名字（帮助中心写着这个快捷键「很快会改成 `@`」）。
- **自动触发。** Gemini 会判断当前提示是否跟某个已启用的 skill 相关，相关就自动用上。
- **可以叠加。** 同一个对话里能同时用多个 skill，skill 的指令里还能引用别的 skill [5]。

Google 博客给的例子是把「写作风格」skill 和「品牌规范」skill 叠在一起，做出符合品牌又像你本人写的素材 [1]。换成 Gem 的思路，你得专门建一个「品牌文案 Gem」，风格要求和品牌要求写死在一份指令里；想换一套品牌规范，就得再复制一个 Gem。

**判断：** 这是从「选一个助手来聊」变成「在同一个助手身上按需加载能力」。前者的组织单位是「人设」，后者的组织单位是「任务说明」。对用户来说最直观的变化是入口：以前要先去侧边栏找 Gem，再在它的专属页面里聊；以后在哪个对话里都能 `/` 一下。9to5Google 的 Abner Li 也是这么看的：比起在侧边栏里往下翻 My Gems，斜杠调用更方便，长远看体验更统一 [2][8]。

## 机制对照：Gem 和 skill 到底差在哪

把帮助中心里两边的文档摆在一起，差异比官方宣传里的「更灵活」要具体得多：

| 维度 | Gem | skill（截至 2026-10-12 的文档） |
| --- | --- | --- |
| 怎么用 | 侧边栏进 Gem 专属页面再聊 [6] | 任意对话里 `/`（将改为 `@`）选择，或由 Gemini 自动触发 [4][5] |
| 能否组合 | 一次一个 Gem | 一个对话里叠多个；skill 之间可互相引用 [5] |
| 知识文件 | 可本地上传；可挂 Drive 文件且总用最新版本；可挂 NotebookLM 笔记本 [6] | 只能随 skill 一起上传；支持纯文本类、代码、配置、PDF 和图片，不支持 .docx/.xlsx 等二进制；总大小 ≤100 MB [5] |
| 默认工具 | 可设 Create image、Canvas 等为默认工具 [2] | 多数默认工具暂不支持：Create video、Create music、Canvas、Deep Research、Guided Learning [4] |
| 分享 | 可通过链接分享 Gem 或与 Gem 的对话 [6] | 「未来几周」补齐分享、Drive 文件和 Gemini Notebook [1][4] |
| 年龄 | 个人账号 13 岁（或所在国规定年龄）以上 [6] | 18 岁以上，未成年人「即将支持」[1][5] |
| 平台 | 网页建的 Gem 会出现在手机 App 和 Workspace 侧边栏 [6] | 目前只有手机 App、Mac App 和网页版；上传建 skill 只能在 Mac App 和网页版 [4][5] |
| 文件格式 | Google 私有格式 | 基于开放的 SKILL.md 标准，可导入其他平台写的 skill，也可下载成 .zip [4][5][7] |

另外，skill 不需要付费订阅，Gemini Spark、tasks、schedules 仍需付费 [5][9]。表里有几行值得多说两句。

**知识文件从「活链接」变成「快照」。** Gem 挂 Drive 文件时，Gemini 总会读那份文件的最新版本，你在 Drive 里改了文档，Gem 自动跟着变 [6]。skill 现在只能把文件随 skill 一起上传，想更新文件就得把整个 skill 连同参考文件重新上传一遍 [5]。Google 说 Drive 文件支持会在未来几周加上 [1]，但没说加上之后是不是还保持「读最新版」。**判断：** 如果你的 Gem 靠一份每周更新的 Drive 文档运转（比如价目表、排班表），迁移后它很可能悄悄停在迁移那一刻的版本，回答看起来照样流畅，只是数据旧了。

**脚本能上传，但不能联网。** skill 支持 `.py`、`.sh`，但需要联网的脚本暂不支持，脚本也不能对外部网站执行操作或发请求 [5]，这跟编码 agent 里的 skill 很不一样。

**名字要符合格式**：全小写加连字符，比如 `sample-skill-name`，手动重建时会自动转换 [4][5]。中文名的 Gem 会被转成什么样，文档没写。

## 时间表：按账号类型对一遍

不同来源的日期写法不完全一致，我把一级源逐条对了一遍：

| 账号类型 | 关键日期 | 发生什么 | 来源 |
| --- | --- | --- | --- |
| 个人 Google 账号 | 2026 年 11 月 17 日起（官方文档写「11 月」） | 开始自动迁移，迁移前 Gem 照常可用，之后不再支持 | App 内提示 [2]；[1][4]；TechRepublic 转述 [9] |
| Opal 与 Labs 出品的 Gems | 2026 年 11 月 17 日 | 关停；Labs 的 Gems **不迁移**，Opal 工作流**不迁移** | Google 博客脚注 [1]、Opal FAQ [11] |
| Workspace（全部类型） | 2026 年 10 月 5 日起 | skills 开始在 Workspace 灰度，预计 11 月中旬完成 | Workspace Updates [7] |
| Gemini App（Workspace 用户） | 2026 年 10 月 13 日起 | skills 开始在 Gemini App 灰度，预计 11 月中旬完成 | Workspace Updates [7] |
| Workspace（全部类型） | 2026 年 11 月 17 日 | Gems 挪进 Gemini App 设置面板，仍可创建、编辑、使用 | Workspace Updates [7] |
| Workspace 商业、企业、非营利 | 不早于 2027 年 3 月 1 日 | Gems 不能再建、改、用；Workspace Studio 里带「Ask a Gem」步骤的流程失效；剩余 Gems 自动迁成**草稿** skill | Workspace Updates [7] |
| Workspace 教育 | 不早于 2027 年 6 月 1 日 | 同上，另外 Google Classroom 和接入 Gemini LTI 的第三方学习平台里的 Gems 一并移除 | Workspace Updates [7] |

Android Authority 9 月 30 日的报道复述了同一份时间表，可以当交叉核对 [10]。

几处容易看错的地方：

1. **「11 月 17 日」对个人账号和 Workspace 账号意思不一样。** 个人账号是「开始迁移」[2]；Workspace 是「Gems 挪进设置面板，但还能用」[7]。真正停用是 2027 年。
2. **Workspace 的日期写的是「不早于」**，并且 Google 承诺会提前至少 30 天把自动迁移细节告诉管理员 [7]，所以 3 月 1 日是下限而不是确定日期。
3. **Gemini App 和 Workspace 的 skill 不同步**，两边都要用就得各建一份 [7]。
4. **Opal 用户要自己动手。** 工作流文件留在你 Drive 的「Opal」文件夹里，但不会转成 skill；FAQ 建议 11 月 17 日前把提示词复制出来 [11]。

## 自动迁移保证了什么，没保证什么

把帮助中心的原话拆开看，Google 明确承诺的只有这几件 [4]：

- Gem 停用时，会自动把它重建成 skill；
- 「受支持的文件」会一起迁过去；
- 不想等的话，可以提前手动重建。

除此以外，以下几件事文档里**没有写**，我建议都当成未知数：

**一、迁过来的 skill 是启用还是草稿。** Workspace 那边写明了是「草稿 skill」[7]；个人账号的文档只说「重建为 skill」[4]。如果个人账号也是草稿或默认未启用，那它就不会被自动触发，你得自己去设置里打开。

**二、description 由谁来写。** 这一点我认为是整个迁移里最关键的。skill 能被自动触发，靠的是 Gemini 判断「当前提示跟哪个 skill 相关」[5]。在开放的 Agent Skills 规范里，这个判断依据就是 frontmatter 里的 `description`：规范要求它写清「做什么、什么时候用」，所有 skill 的名字和描述会在启动时先加载，正文到真正激活时才读进来 [13]。Google 自己的写作建议第一条也是「写清什么时候该用」[4]。可 Gem 从来不需要这个字段——你点进哪个 Gem，就用哪个 Gem。**判断：** 自动迁移时，description 要么由系统从 Gem 指令里自动生成，要么留空或很笼统。不管哪种，它都决定了这个 skill 以后会不会在你没想到的对话里冒出来，或者在你需要时不出现。

**三、超过 100 个怎么办。** 同时启用上限是 100 个，文档没说超出部分怎么处理 [4]。

**四、分享链接还能不能用。** TechRepublic 指出，skill 分享功能会上线，但文档不保证老的 Gem 分享链接照常有效 [9]。分享过 Gem 的要单独核实。

**五、年龄在 13 到 18 岁之间的用户。** Gem 允许 13 岁以上用户创建和使用 [6]，skill 目前要求 18 岁以上 [5]。TechRepublic 注意到，过渡指南没解释这个年龄段用户已有的 Gem 会怎样 [9]。Google 博客脚注说未成年人支持「即将推出」[1]，但没给日期。

**六、不受支持的文件。** GitHub 文件目前不能放进 skill [4]；skill 上传不支持 .docx、.xlsx 等二进制格式 [5]。「受支持的文件会迁移」这句话反过来读就是：不受支持的，大概率不会跟过来。**判断：** 挂了 Word 或 Excel 知识文件的 Gem，迁移后可能只剩指令，文件没了。

**七、专属对话页。** Gem 有页面列出最近对话，skill 没有，相关对话直接混在侧边栏里 [4]，以后要靠搜索去找。

## 迁移前值得亲手测的缺口

把上面几条和功能缺口合在一起，下面这几类 Gem 最值得在 11 月 17 日前测一遍：

| Gem 的特征 | 迁移后可能的变化 | 依据 |
| --- | --- | --- |
| 默认工具设成 Canvas、Deep Research、Guided Learning、Create video 或 Create music | 这些工具暂不能和 skill 一起用 | [4][9] |
| 挂了 Drive 文件，且文件经常更新 | 迁移后需随 skill 上传，更新要整包重传；Drive 支持「几周内」补上 | [1][5][6] |
| 挂了 GitHub 文件、.docx/.xlsx 或笔记本 | GitHub 和二进制格式不支持；Gemini Notebook「几周内」补上 | [1][4][5] |
| 分享给了别人 | skill 分享功能「几周内」补上，老链接是否有效未保证 | [1][9] |
| 你关了 Keep Activity | skill 要求开启 | [5][9] |
| 主要在 Workspace 侧边栏或上面三端以外的客户端里用 | skill 目前只在手机 App、Mac App、网页版 | [5][6] |
| 在 Workspace Studio 里有「Ask a Gem」步骤 | 已不能新建此类步骤；到停用日流程失效 | [7] |

**Keep Activity 这一条值得单独说。** 按 Gemini Apps 隐私中心的说法，Keep Activity 关闭时，如果你不主动提交反馈，Google 不会用你之后的对话来改进 AI 模型，这类对话会随账号保留 72 小时 [12]；开启时，对话可能会经人工审核用于改进 Google 服务，隐私中心也提醒不要输入机密信息 [12]。TechRepublic 的提醒很直接：刻意关掉这个设置的人，打开 skills 之前要先想清楚这笔交换 [9]。**判断：** 对把 Gem 当「私人笔记 + 指令」用的人，这是整个迁移里代价最高的一项，而且不是功能补齐能解决的，是使用条件本身变了。

## 三种思路放在一起看：斜杠 skill、聊天式 agent、编码 agent 的 Agent Skills

TechCrunch 那句吐槽背后其实有一个真问题：消费级 agent 到底该让用户「显式调用」还是「直接说话」[3]。

**Meta Muse 走的是聊天式路线。** 你直接跟它说要干什么，它自己决定用什么能力、动用哪些授权。门槛低，但用户很难知道每一步背后批了什么——站内写过的 [Muse 把卖家住址发给买家](/cn/blog/meta-muse-allow-always-agent-permission-defaults/)，根子就是一次「始终允许」。

**Gemini skills 其实两条路都走了。** 斜杠是显式调用，自动触发是隐式调用 [5]。TechCrunch 只看到了前者。**判断：** 真正值得留意的是后者。显式调用时你知道自己在用哪份说明；自动触发时，选哪个 skill 是模型决定的。站内 [同类 skill 互相顶替](/cn/blog/co-installed-agent-skills-conflicts/)那篇讲过一项实证：功能相近的 skill 装在一起，被顶替时任务照样完成，原 skill 的硬约束却丢了，回复里也几乎不说用了哪个。把十几个 Gem 一次性转成自动触发的 skill，等于一下子装了一批 description 没人推敲过的同类 skill，风险一样，只是没人做验收。

**编码 agent 里的 Agent Skills 是第三种。** 在 Claude Code 这一类工具里，skill 是项目目录下的一个文件夹，`SKILL.md` 加上可选的 `scripts/`、`references/`、`assets/`；agent 先只读名字和描述，激活时再读正文，资源文件用到才加载 [13]。可参考站内 [Agent Skills 2026 综述](/cn/blog/agent-skills-2026-survey-lifecycle-map/)、[Progressive Disclosure](/cn/blog/progressive-disclosure-agent-skills/) 和 [SkillDelta](/cn/blog/skilldelta-selective-skill-activation/)（「相关」不等于「该注入」）。

Google 这次明确说 skills「完全基于开放的、以 Markdown 为原生格式的 SKILL.md 标准」，可以把别的平台写的 skill 拷进 Gemini App 和 Workspace [7]；帮助中心也支持上传 SKILL.md、文件夹或 zip，还能把 skill 下载成 zip [4][5]。命名规则也对得上：小写、字母数字加连字符、跟文件夹同名 [4][13]。

但两边的能力边界差得不少：

| | 编码 agent 的 Agent Skills | Gemini App 的 skills |
| --- | --- | --- |
| 格式 | 目录 + `SKILL.md` + 可选子目录 [13] | 同一格式，可上传、可下载 [4][5] |
| 脚本 | 可在 agent 的执行环境里跑，能做什么取决于具体实现 [13] | 支持 .py/.sh，但不能联网、不能对外部网站操作 [5] |
| 加载 | 先读名字和描述，按需读正文和资源 [13] | 自动判断相关性后应用；具体加载方式未公开 [5] |
| 工具权限 | `allowed-tools` 字段（实验性）[13] | 文档未提 |

**判断：** 对普通用户，这次迁移最实在的好处可能不在斜杠，而在**可移植**。Gem 是锁在 Gemini 里的；skill 能下载成一个标准文件夹，理论上能带去别的支持 SKILL.md 的工具。别处的 skill 也能进来，只是脚本能力大多用不上。

## 一个具体例子：把「跑步教练」Gem 改写成 skill

举个具体例子。假设你有个「跑步教练」Gem，指令大意是：根据我的配速和心率记录安排下周训练，强度循序渐进，伤病期只给恢复建议；知识里挂了一份 Drive 上的训练日志表。

手动重建时，名字要改成 `running-coach` 这种格式 [4]。真正要花心思的是 description。下面是一份按开放规范写的最小 `SKILL.md` [13]：

```markdown
---
name: running-coach
description: 根据我上传的跑步记录（配速、心率、周跑量）安排下一周训练计划。只在我明确问训练安排、配速或跑量时使用；问饮食、睡眠或一般健身时不要使用。
---

## 规则
- 每周跑量增幅不超过上周的 10%。
- 我说有伤痛时，只给恢复和就医建议，不排强度课。
- 计划用表格输出：日期、类型、距离、目标配速。

## 参考
- 训练日志见 references/log.csv（每周手动更新后整包重新上传）。
```

这份文件里有三处跟 Gem 不一样。第一，description 同时写了「什么时候用」和「什么时候别用」，这是给自动触发看的，Gem 时代没有这个需要。第二，原来挂在 Drive 上、每周自动更新的日志表，现在得导出成 CSV 随 skill 上传，更新时整包重传 [5]，所以我把这个约束写进了正文。第三，硬规矩单独列出来，方便叠加别的 skill 时检查有没有被覆盖。

然后测两下：问「我膝盖有点疼，下周怎么跑」，看它守不守伤病规则；再开新对话问「推荐几种早餐」，看它会不会被误触发。两个都过了，这个 Gem 才算迁好。

## 迁移前检查清单

建议在 11 月 17 日之前，用一个下午做完下面这些。每一项都能对应到上文的依据。

**盘点**

- [ ] 列出你所有的 Gem：名字、用途、多久用一次、有没有分享出去。
- [ ] 标出挂了知识文件（记下类型和来源：本地、Drive、NotebookLM、GitHub）或设了暂不支持的默认工具（Canvas、Deep Research、Guided Learning、Create video/music）的 Gem [4][6]。
- [ ] 用的是 Labs 出品的 Gem 或 Opal 的，单独列出来，它们不会迁移 [1][11]。

**备份**

- [ ] 把每个 Gem 的指令全文复制到本地文本文件。
- [ ] 按帮助中心的步骤，把知识文件逐个下载到以 skill 名命名的文件夹里（全小写、连字符）[4]。
- [ ] .docx、.xlsx 一类的文件先转成 PDF、Markdown 或 CSV，否则 skill 上传不收 [5]。
- [ ] Opal 用户把提示词复制出来，或确认 Drive 的「Opal」文件夹里文件还在 [11]。

**挑一个试迁**

- [ ] 选一个最重要的 Gem 手动重建成 skill，不要等自动迁移 [4]。
- [ ] **自己写 description**：一句话说清做什么，再一句说清什么时候用、什么时候不用 [4][13]。
- [ ] 用同一组提示词对比 Gem 和 skill 的回答，尤其是依赖文件内容的问题。
- [ ] 开一个无关的新对话，看这个 skill 会不会被误触发；如果会，收紧 description，或者关掉自动使用、只留斜杠调用 [5]。
- [ ] 把两个可能同时触发的 skill 叠在一起，看要求有没有互相覆盖。

**设置与权限**

- [ ] 确认 Keep Activity 的状态。如果你是有意关掉的，先读一遍隐私中心再决定要不要为 skills 打开 [5][12]。
- [ ] 确认账号年龄条件。家里有 18 岁以下的孩子在用 Gem 学习，要预期 skill 暂时用不了 [1][5][9]。
- [ ] 确认常用设备在支持范围内（手机 App、Mac App、网页版）[5]。

**分享与协作**

- [ ] 给分享过的 Gem 的接收方提前打招呼，链接可能失效 [9]。
- [ ] 有 Workspace 账号的，查一下 Workspace Studio 里有没有「Ask a Gem」步骤，排进 2027 年的替换计划 [7]。

**迁移后**

- [ ] 11 月 17 日之后去 Skills 页面核对：数量对不对、是不是都启用了、文件在不在 [4]。
- [ ] 删除 skill 不可撤销，清理之前先下载 zip 备份 [5]。
- [ ] 关注「未来几周」的补齐进度：分享、Drive 文件、Gemini Notebook [1]。

## 写在最后

这次迁移表面上是改名加换入口，往深里看，是 Google 把消费端的「定制」从「造一个助手」改成了「写一份说明」。这跟编码 agent 的演化一致：入口只有一个 agent，能力拆成可组合、可移植、按需加载的小块。不用切页面、能叠加、能导出，这些好处是真的。

代价也是真实的，而且主要在迁移这一刻：活的 Drive 链接变成静态快照，默认工具暂时缺席，年龄门槛和 Keep Activity 的要求把一部分人挡在外面，还有一个所有 skill 系统都绕不开的问题——自动触发靠 description，而 Gem 从来没有 description。

所以我的建议很简单：别把「自动迁移」理解成「原样搬家」。挑最重要的那一两个 Gem，自己先迁，自己写 description，自己对比结果。剩下的交给 Google，但心里要有数：哪些东西可能不会跟过来。

## 参考来源

1. Google, Deven Tokuno, "Let skills in Gemini tackle your most repetitive tasks", 2026-09-30. https://blog.google/products-and-platforms/products/gemini/automate-tasks-with-skills/
2. 9to5Google, Abner Li, "Gemini app replacing Gems with skills in November", 2026-09-27. https://9to5google.com/2026/09/27/gemini-gems-skills/
3. TechCrunch, Sarah Perez, "Google is killing off Gemini's Gems in favor of 'skills'", 2026-09-28. https://techcrunch.com/2026/09/28/google-is-killing-off-geminis-gems-in-favor-of-skills/
4. Google Gemini Apps Help, "About the transition from Gems to skills". https://support.google.com/gemini/answer/18560919?hl=en
5. Google Gemini Apps Help, "Create & manage skills for Gemini Apps". https://support.google.com/gemini/answer/17094296?hl=en
6. Google Gemini Apps Help, "Use Gems in Gemini Apps". https://support.google.com/gemini/answer/15146780?hl=en
7. Google Workspace Updates, "Introducing skills in the Gemini app and Workspace, plus what's next for Gems", 2026-09-30. https://workspaceupdates.googleblog.com/2026/09/skills-gemini-app-workspace.html
8. 9to5Google, Abner Li, "Google details Gems to skills migration, including free access", 2026-09-30. https://9to5google.com/2026/09/30/gemini-skills-free/
9. TechRepublic, "Google Is Replacing Gemini Gems With Skills Nov 17 — What Changes Before the Switch", 2026-09-30. https://www.techrepublic.com/article/news-gemini-gems-skills-migration/
10. Android Authority, Ryan McNeal, "Google maps out transition plan to replace Gemini Gems with Skills", 2026-09-30. https://www.androidauthority.com/gemini-gems-phase-out-timeline-3717503/
11. Google for Developers, "Opal: Frequently asked questions and best practices". https://developers.google.com/opal/faq
12. Google Gemini Apps Help, "Gemini Apps Privacy Hub". https://support.google.com/gemini/answer/13594961?hl=en
13. Agent Skills, "Specification". https://agentskills.io/specification
