---
title: "Agent Skills 装得越多越难管：同类 skill 悄悄顶替，任务照过、硬约束却丢了"
description: "UNSW 等对 20,947 个仓库的实证：近四分之一已装 skill 身边就有同功能对手，被顶替时任务照样通过，专属约束却丢；替换后只有 0.9% 的回复说明用了哪个。讲清加载与优先级机制，附验收清单。"
pubDate: 2026-10-09T16:45:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "developer-tools", "Agent Skills"]
lang: "zh"
---

## 先看一个例子：只读的检查点 skill 被同类顶掉

项目里有一个叫 `checkpoint` 的 skill，正文第一条写得很硬：「这个 skill 是只读的，不提交、不推送、不改 git 状态。」只装它的时候，你让 agent 「我要停下手里的 CSV 导入功能，帮我留一份交接记录」，它老老实实把交接说明写进 `.ai-context/checkpoints/` 下的一个文件，git 一动不动。

然后有人往同一个项目里加了一个功能几乎一样的 skill，目录名叫 `checkpoint-2`，正文第一句是「通过提交当前工作来创建检查点」。同一句请求、同一个模型（Haiku 4.5），这次 agent 选了新来的那个，直接 commit 了一次，回复里只说「检查点已提交」，没提自己用的是哪个 skill。两次任务都算完成——交接记录确实留下了——但原 skill 唯一要守的那条规矩没了 [1]。

这是 2026 年 10 月 8 日挂上 arXiv 的论文《One Skill Too Many: How Co-Installed Skills Conflict in Coding Agents》里的图 1 [1]。作者来自新南威尔士大学等四所高校。这篇不逐节复述论文，而是把它当验收报告读：**skill 装得越多，你对 agent 实际照哪份说明干活的控制就越弱；而现在大多数团队检查 skill 的方式——任务过没过——恰好看不见这种损失。** 后半篇给一份可以直接拿去用的检查清单。

站内这条线已经写过 skill 的单体问题：[Agent Skills 2026 综述](/cn/blog/agent-skills-2026-survey-lifecycle-map/)按写、装、选、用、学、验、管排过全生命周期，[SkillSpector](/cn/blog/nvidia-skillspector-agent-skills-trust-pipeline/)讲安装前怎么扫一个 skill 有没有恶意。那两篇关心的是「这一个 skill 好不好、安不安全」。这篇关心的是组合：两个各自都没问题、都不恶意的 skill 放在一起，会发生什么。

## skill 是怎么被发现和加载的

要理解为什么会被顶替，先把加载链路摊开。各家实现细节不同，但骨架都来自 agentskills.io 的同一套约定，官方客户端实现指南称之为三层渐进披露（progressive disclosure）[4]：

| 层 | 加载什么 | 什么时候 | 大致成本 |
| --- | --- | --- | --- |
| 1. 目录 | name + description | 会话开始 | 每个 skill 约 50–100 token |
| 2. 指令 | 完整 `SKILL.md` 正文 | skill 被激活时 | 建议 5000 token 以内 |
| 3. 资源 | 脚本、参考文件、素材 | 指令里引用到时 | 不定 |

站内 [Progressive Disclosure 那篇](/cn/blog/progressive-disclosure-agent-skills/)讲过这套设计在上下文成本上的好处：库到 100 个 skill 时全量加载会直接撑爆。但这里要强调它的另一面：**模型在两个相似 skill 之间做选择时，看到的只有第一层。** 真正写着「不许动 git」的那句话在第二层，要等选完才读。

Claude Code 的官方文档把这一点写得很具体 [2]：会话开始时，把所有 skill 的名字和描述做成一份列表放进上下文；每个 skill 的 `description` 加 `when_to_use` 合计超过 1,536 个字符会被截断；整份列表的预算按模型上下文窗口的 1% 计，超了就从最少被调用的 skill 开始丢描述，只保留名字。论文实测了 Claude Code 2.1.283 的列表：按来源分组（个人、项目、插件、内置），组内按目录名排序；这个 1% 上限在 Sonnet 4.6 和 Haiku 4.5 上约 8,000 字符，在 Opus 5 上约 6,000 字符。在默认上限下，A+B 配置里 95.8% 给 Opus 5 的列表至少会丢掉两份描述中的一份——作者为了做实验，把上限统一调到了 20,000 字符 [1]。换句话说，真实环境里模型做选择时，手上的信息往往比实验里还少。

依据薄，过程还不留痕。Claude Code 的模型可以通过 Skill 工具调用一个 skill，也可以直接用 Read、Bash 去读或运行某个 skill 目录里的文件。论文发现模型经常走后一条路，所以统计「用了哪个 skill」时，必须把这两种都算上 [1]。

## 同名时谁赢：各家规则不一样，有的正好相反

skill 从哪儿来，决定了它会不会和别人撞车。Claude Code 支持这几处位置 [2]：

| 位置 | 路径 | 和其他位置同名时 |
| --- | --- | --- |
| 企业 | 托管设置目录下的 `.claude/skills/` | 压过个人和项目 |
| 个人 | `~/.claude/skills/<name>/` | 压过项目 |
| 项目 | `.claude/skills/<name>/`（启动目录及其上级） | 被个人和企业压掉 |
| 嵌套 | `<subdir>/.claude/skills/<name>/` | 都加载，带目录前缀区分 |
| 插件 | `<plugin>/skills/<name>/` | 都加载，以 `插件名:skill名` 命名空间区分 |

官方文档的原话是：企业压个人，个人压项目；`~/.claude/skills/` 和项目 `.claude/skills/` 里都有 `deploy` 时，`/deploy` 运行的是个人那份 [2]。

问题在于别家不是这么定的。agentskills.io 的客户端实现指南说，现有实现的通行约定是**项目级覆盖用户级**，并建议同名冲突时记一条警告，让用户知道有个 skill 被盖住了 [4]。Gemini CLI 的文档按优先级从低到高排成内置、扩展、用户、工作区四层，同名时用高优先级那份，工作区（也就是项目）最高 [6]。GitHub Copilot CLI 的配置目录文档也写明：项目级 skill 与个人 skill 同名时，项目级优先 [7]。OpenAI Codex 则从当前目录一路扫到仓库根的 `.agents/skills`，再加上用户、管理员和系统位置；两个 skill 同名时不合并，两份都可能出现在选择列表里 [5]。

所以同一个团队里，用 Claude Code 的人和用 Gemini CLI 的人，在「个人目录里有个同名 fork」这件事上会得到相反的结果。项目维护者没法保证每个成员跑的是项目提交的那一份——论文讨论部分也直接点出：按当前的优先级规则，发布项目 skill 的团队无法保证成员运行的是它的版本 [1]。

论文引用了一个公开 issue（seasonedcc/seasoned-skills #303，2026 年 9 月 11 日提交）记录的真实事故是：项目通过工具生成了 `self-improvement` 等 skill，维护者自己的 `~/.claude/skills` 里恰好有同名的个人 fork；调用项目的 `self-improvement`，实际跑的是个人那份，目标指向一个毫不相干的仓库，直到看输出才发现。提 issue 的人还写道：工程师本人以为项目 skill 会赢，正好和实际优先级相反 [8]。

## 问题有多普遍：从两万个仓库里还原「装了什么」

作者从 2026 年 7 月 18 日采集的公开 `SKILL.md` 语料出发，覆盖 20,947 个仓库，对每个仓库按推送时间取完整文件树快照，再按 Claude Code 的加载规则还原「一个会话实际能看到哪些 skill」，得到 5,106 份安装清单 [1]。去掉近似重复后，用名字和描述的向量相似度给每个已装 skill 找最像的 10 个候选，共得到 822,109 个候选对（跨项目 439,860 个，同项目 382,249 个），分层抽样 3,754 对交给一个大模型判断「是不是同一件活」，确认 1,639 对，最后挑出 312 对能离线跑、能打分的拿去做实验 [1]。

几个结论值得记住 [1]：

- **同一份安装清单里，约 23.5% 的已装 skill 旁边就有一个做同样事的 skill**（95% 置信区间 21.2%–25.7%），按家族去重后约 10,100 个。论文的说法是「接近四分之一」。
- 如果把别的作者写的 skill 也算进来（也就是用户随手再装一个），这个比例是 63.7%。
- 整套复制别人 skill 合集的 489 个项目里，37% 被判过的 skill 在同一清单里有同功能对手，其他项目是 19%。
- 冲突对里，原 skill 多数是「规范类」（跨项目 60%、同项目 56%），其次是「能力类」（31% 和 35%），带脚本的约 9%。

另外两点：描述相似度不能代替判断：相似度低于 0.9 的跨项目候选对里，每一档只有 10%–37% 被确认为同一件活，所以「描述很像」和「功能相同」不是一回事 [1]。第二，这些数字是保守估计——公开仓库很少暴露开发者的个人 skill 和插件，而那正是最容易撞车的地方 [1]。

再看供给侧。skill 很少一个一个装，经常是整套合集进来：GitHub API 在 2026 年 10 月 9 日显示，mattpocock/skills 有约 28 万 star [12]。连消费级产品也在把自定义助手统一收成 skill：TechCrunch 报道，Google 计划从 2026 年 11 月 17 日起把 Gemini 的 Gems 自动迁移为 skill [10]。来源越多，同功能的 skill 撞在一起就越是常态，不是例外。

## 为什么「任务通过」看不出问题

论文最有价值的部分是测量方法。作者不只看任务完成率，而是先从每个 skill 的正文里抽出它的**核心功能**（core functions）：必须是「一个称职的模型不装这个 skill 通常不会做到」的要求，必须逐字引自 skill 原文，还必须能从产出的文件、提交、执行过的命令或最终回复里检查出来。禁止性条款也算要求。每个核心功能再按「对方 skill 有没有要求同样的事」标成**专属**或**共有** [1]。实验对的 2,518 个适用核心功能里，73% 是专属的——也就是说，两个看起来做同一件事的 skill，差别主要在细节规矩上 [1]。

一次运行里满足的核心功能比例叫保真度（fidelity）。把「只装 A」和「A、B 同装」逐对比较，结果是 [1]：

| 指标 | A+B 相对只装 A 的变化 |
| --- | --- |
| 用到 A 的运行占比 | −19.9 个百分点 |
| 任务完成率 | +1.9 个百分点（置信区间跨 0，不显著） |
| A 的保真度（前三条核心功能） | −2.6 个百分点 |
| A 的专属核心功能 | −5.6 个百分点 |
| A 的共有核心功能 | +0.1 个百分点（无变化） |

对照组是装一个不相关的 skill C：它只让 A 的使用率降 5.9 个百分点，保真度基本不变 [1]。所以问题不在「多装了一个」，而在「多装了一个干同样活的」。

为什么任务完成率是盲区？道理很朴素：两个 skill 之所以抢活，就是因为它们都能把活干完。冲突越可能发生，越不会体现在通过率上。规范类 skill 尤其如此——论文引用 SWE-Skills-Bench 的结果说，49 个 skill 里有 39 个对通过率没有任何提升 [1]；一个本来就不提升通过率的 skill，被顶掉了也不会让通过率下降。可团队写 skill，恰恰是为了把这类东西写进去：PR 格式、提交规范、安全红线。

损失主要来自哪里也有拆分：A+B 时 12.1% 的运行只用了 B，38.0% 两个都没用（只装 A 时不用 A 的是 30.3%）；保真度的损失里，只用 B 的运行占 36%，两个都不用的占 45%，真正用了 A 却被 B 的指令带偏的只占 20% [1]。也就是说，主要是「整个被换掉」，而不是「两份说明混着用」。

## 谁会被选中：位置说了算，排序几乎没影响

工具选择的研究常报告「排在前面的更容易被选」。这篇的结果不一样：把列表顺序反过来，A 的使用率只变 +0.6 个百分点，反倒是为了反转顺序给 B 改名加了一个字符前缀，带来了 +4.4 个百分点 [1]。

真正起决定作用的是位置。在 81 个同名对上 [1]：

- 把 B 放进个人目录：按 Claude Code 规则 A 从全部 243 份列表里消失，A 的使用率降 35.0 个百分点；有 46.5% 的运行用了 B。但有意思的是，29.2% 的运行还是去项目目录里读了 A 的文件——Opus 5 在这种配置下读 A 的比例高达 53.1%，哪怕 A 根本不在列表里。
- 把 B 放进插件：两份都列出来，由模型选，B 只在 2.9% 的运行里被用到。

模型之间差别也很大：A+B 配置下 Opus 5 有 36.8% 的运行两个都读，Haiku 4.5 有 56.4% 两个都不用 [1]。

最该让人警惕的是「说没说」。在 113 次 B 顶替了 A 的运行里，最终回复点名自己用了哪个 skill 的只有 0.9%，提到有多个合适 skill 的是 0%，问用户要选哪个的也是 0% [1]。放到全部 A+B 运行上，点名的比例是 7.7%，主要来自 Opus 5 [1]。指望看 agent 的回复来发现顶替，基本没戏。

## 冲突在第一次读 skill 时就定了

既然看回复没用，那在哪里拦？论文的答案是：**第一次读取 skill 的那一刻。** 作者找出那些只是改了列表顺序、却先打开了不同 skill 的运行组合（79 个模型—对组合），在第一次读之前，两边的运行几乎一样（中位数都是 6 次工具调用）；先打开 B 的那一边，A 的专属核心功能少满足 9.4 个百分点 [1]。而且 97% 先打开 B 的运行，在打开 B 之前还没改过任何文件 [1]——也就是说，决定在动手之前就做完了。

先打开 B 时丢的是什么？在只装 A 时能满足的核心功能里，专属的丢了 37%，共有的只丢 8% [1]。这就是题目里「超过三分之一的专属约束丢了」的出处：注意分母是「只装 A 时本来能做到的专属核心功能」，条件是「先打开了 B」，不是所有运行。

作者随后做了一个干预实验：写一个 PreToolUse hook（工具调用前触发的钩子），在 A 还没被读过时拒绝对 B 的第一次读取，并提示模型改用 A——提示里不提任何具体规矩；A 一旦在用，就一直拒绝 B [1]。在 187 个模型—对组合上各跑一次带 hook 和不带 hook 的版本，结果 [1]：

- hook 拦下对 B 的第一次读取后，96% 的情况模型转去用了 A（Sonnet 4.6 为 94%、Haiku 4.5 为 96%、Opus 5 为 99%）。
- 全部运行上，A 的专属核心功能保真度提高 9.1 个百分点；在两边都先伸手去拿 B 的组合里，提高 17.8 个百分点。
- 被 hook 改道的运行，和本来就先打开 A 的运行没有差别（0.0 个百分点），等于把「先开 B」的 16.5 个百分点损失全部追回；任务完成率没有变化。

好消息是拦截点很便宜：一次文件读取，而且在 agent 动手之前。坏消息是 hook 得知道「哪个是 A」，这得你事先声明，平台不会替你判断。

## 边界和反例：别把论文数字当成你的数字

用这篇论文来定团队规范之前，有几条边界要记在心里：

1. **只在 Claude Code 上做了全套实验。** 全套设计按 API 价格约 5,550 美元，所以作者只在 Codex 上用 gpt-5.5、gpt-5.6-luna、gpt-5.6-sol 在 193 对上验证了主要效应：A 的使用率降 18.2 个百分点、专属核心功能降 3.4，和同批对在 Claude Code 上的 20.1、4.6 接近，任务完成率同样没降 [1]。Gemini CLI、Copilot 只在机制层面讨论过，没有跑实验。
2. **列表上限被调大了。** 前面说过，实验把列表预算调到 20,000 字符；默认设置下描述会被截得更厉害，选择会更随机。真实环境里的冲突可能更严重，也可能变成「两个都不用」。
3. **每个组合只跑了一次。** 作者对 512 个组合重复了两三次，A 是否被用到的一致率为 88.9%，组内相关系数 0.78；判断核心功能是否满足的组内相关系数 0.84 [1]。单次结果有噪声，但配对比较能吸收一部分。
4. **很多步骤靠大模型判。** 配对确认、核心功能抽取、输出判分都由 GPT-6 Astra 完成，两位人工评审在随机样本上做了校验，Krippendorff's α 在 0.71–0.88 之间，有几项低于 0.8 的「稳定结论」门槛 [1]。
5. **跨项目配对是构造出来的。** 但同项目真实共存的那批对，A 的使用率也降了 18.3 个百分点，说明不是实验造出来的假象 [1]。

还有两个反例方向。其一，不是所有顶替都是坏事：如果 B 比 A 写得更好，顶替反而是升级——但那应该是你决定的，而不是模型凭几百字描述随手定的。其二，hook 不是万能的。Claude Code 的 hooks 文档写明：匹配 Skill 工具的 PreToolUse hook 只在模型调用这个工具时触发，用户直接输入 `/skill名` 会绕过它，要用 UserPromptExpansion 事件补上 [3]；而且模型经常不走 Skill 工具、直接读文件，所以 hook 也得匹配 Read 和 Bash 对 skill 目录的访问 [1][3]。

## 和站内几篇怎么接

把这篇放进站内 skill 线里看，位置比较清楚：

- [Agent Skills 2026 综述](/cn/blog/agent-skills-2026-survey-lifecycle-map/)在「装」那段提过 NVIDIA 信任管线的第二层：入库前做语义重叠检测，避免同一能力换个名字发两次。那是**发布方**在一个目录里去重。这篇说的是**使用方**的现场：skill 来自项目、个人、插件、整套合集，没有谁统一去过重。
- [SkillSpector](/cn/blog/nvidia-skillspector-agent-skills-trust-pipeline/)查的是一个 skill 有没有恶意。这篇里的 B 全是善意的普通 skill，扫描全过，照样会把 A 的规矩顶掉。扫描回答不了组合问题。
- [Progressive Disclosure](/cn/blog/progressive-disclosure-agent-skills/)解决「放不放得下」，[SkillDelta](/cn/blog/skilldelta-selective-skill-activation/)追问「放进去有没有增益」。这篇补的是第三问：**放进去的是不是你以为的那一个。**

LangChain 最近改版的 Deep Agents skills 给了另一个思路：把工具绑定到 skill 上，模型没读过这个 skill 之前，调用绑定工具会直接报「未知工具」，强制先读说明再动手；还支持「钉住」某些 skill，让它的指令一开始就在上下文里 [9]。这和论文的 hook 是同一类做法——在读取这一步上加约束，而不是寄希望于模型自己选对。

## 验收清单：把「装了什么、跑了哪个」变成可检查的事

### 1. 先盘点：列出每个会话实际能看到的 skill

别只看项目仓库。把所有位置都扫一遍：`~/.claude/skills/`、项目及其上级的 `.claude/skills/`、嵌套子目录、启用的插件、`.agents/skills/`（Codex、Gemini CLI 都认）、`~/.gemini/skills/`、`~/.copilot/skills/` [2][5][6][7]。Claude Code 里还可以跑 `/skill-doctor` 看每个 skill 的上下文成本和使用频率，用 `/context` 看列表在预算裁剪后的真实大小 [2]。

一个粗糙但够用的起点：

```bash
# 列出常见位置下的所有 SKILL.md，打印目录名和 description 首行
for root in ~/.claude/skills ./.claude/skills ./.agents/skills ~/.agents/skills \
            ~/.gemini/skills ./.gemini/skills ~/.copilot/skills; do
  [ -d "$root" ] || continue
  find -L "$root" -name SKILL.md -maxdepth 3 | while read -r f; do
    name=$(basename "$(dirname "$f")")
    desc=$(grep -m1 '^description:' "$f" | cut -c14-90)
    printf '%s\t%s\t%s\n' "$name" "$root" "$desc"
  done
done | sort > skill-inventory.tsv

# 同名的直接报出来
cut -f1 skill-inventory.tsv | sort | uniq -d
```

同名只是最容易抓的一类。论文里大多数冲突对名字并不相同（312 对里跨项目同名的只有 81 对）[1]，所以还要看描述：人工过一遍，或者用嵌入相似度粗筛后人工判断——记住相似度只能筛，不能下结论 [1]。

### 2. 去重：整套合集是重灾区

复制整套合集的项目，同功能对手的比例接近其他项目的两倍 [1]。引入合集时，先和已有 skill 逐个比对，项目已经有的就删掉合集里那份，或者用 `skillOverrides` 设成 `"off"`、`"name-only"`，不改原文件 [2]。只想让人手动调用的，在 frontmatter 加 `disable-model-invocation: true` [2]。

### 3. 把优先级规则写下来，按工具分别写

在团队文档里写清楚：Claude Code 是企业 > 个人 > 项目，插件和嵌套都加载；Gemini CLI 和 Copilot CLI 是项目优先；Codex 同名两份都列 [2][5][6][7]。必须保证全员一致的规矩，在 Claude Code 里只有企业托管位置能压过个人目录 [2]。给 skill 起名时避开通用词（`checkpoint`、`deploy`、`review`），描述里写具体任务而不是泛泛的用途——论文给作者的建议也是这两条 [1]。

### 4. 验收测「专属约束」，不只测任务通过

这是改动最大、也最值得做的一条。照论文的做法 [1]：

- 从 skill 正文里抽出 MUST、NEVER 一类的硬要求，每条写成一个可以自动检查的断言（比如「运行结束后 `git log` 没有新提交」「产出文件包含三个指定小节」）。
- 标出哪些是这个 skill 独有的。独有的那几条，才是被顶替时会丢的东西。
- 测试时故意同装一个功能相近的 skill，再跑一遍。只装自己时通过、同装后不通过，就是冲突。
- 能用脚本判的优先用脚本。论文里脚本判定的核心功能，损失比大模型判的更明显（4.2 对 1.2 个百分点）[1]。

### 5. 记录实际用了哪个 skill，从工具调用里看，不从回复里看

回复里点名的概率只有 0.9% [1]，所以别指望它。hook 的输入里有 `session_id` 和 `transcript_path` [3]，可以用 PostToolUse hook 把每次 Skill 调用和对 skill 目录的读取都记下来：时间、会话、skill 路径、来自哪个位置。日志里出现「两个都没用」的会话也要算——论文里这一类在同装后从 30.3% 升到 38.0% [1]。

### 6. 用 hook 守住第一次读取

最小可用的做法分两层：

- **SessionStart 检查。** 会话开始时比对项目 skill 和个人目录的同名项，内容不同就警告——issue #303 的项目最后就是自己加了这样一个 hook [8]。agentskills.io 指南也建议冲突时记警告 [4]。
- **PreToolUse 拦截。** 维护一个「必须胜出」的清单（例如项目 `checkpoint` 必须胜过任何 `checkpoint*`），对 Skill、Read、Bash 三类工具调用检查目标路径；如果目标是清单里的「对手」，而本会话还没读过胜出方，就返回 deny，并在理由里写明改用哪个。

```bash
#!/bin/bash
# .claude/hooks/guard-first-read.sh —— 思路示意，需按你的版本核对字段
input=$(cat)
sid=$(echo "$input" | jq -r '.session_id')
target=$(echo "$input" | jq -r '.tool_input | tostring')
state="/tmp/skill-guard-$sid"
# 胜出方被读过：记一笔，放行
if echo "$target" | grep -q '.claude/skills/checkpoint/'; then
  touch "$state"; exit 0
fi
# 对手被读，且胜出方还没读过：拒绝并指路
if echo "$target" | grep -q '.claude/skills/checkpoint-2/' && [ ! -f "$state" ]; then
  jq -n '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",
    permissionDecisionReason:"本项目请使用 .claude/skills/checkpoint/ 这个 skill"}}'
  exit 0
fi
exit 0
```

这段只演示结构：deny 的输出格式取自官方 hooks 文档 [3]，`tool_input` 的具体字段因工具而异，所以示例直接对整段输入做字符串匹配。如果 Skill 工具的输入里是名字而不是路径，还要另加按名字的匹配。上线前先把真实输入打到日志里核对一遍。用户手动输入 `/skill名` 的路径还要用 UserPromptExpansion 补上 [3]。

### 7. 真正不能破的规矩，别只写在 skill 里

Claude Code 文档自己也建议：每次都必须成立的规则，放进 hook，因为 hook 每次事件都会运行，不管模型是不是在照着 skill 做 [2]。「不许动 git」这种约束，与其寄希望于 checkpoint skill 不被顶掉，不如再加一个拦 `git commit` 的 PreToolUse hook。skill 负责教 agent 怎么做，hook 负责兜住绝对不能做的事。

## 结语

软件工程对「各自能用、放一起就坏」的组件不陌生：包冲突、依赖版本冲突、模块重名，都有一套靠元数据在运行前检查的办法 [1]。skill 的麻烦在于，冲突是模型在运行时、凭几百字描述悄悄裁决的，结果还藏在「任务完成」后面。

论文给出的方向很实在：评测要单独给专属约束打分，平台要守住第一次读取，并且告诉用户到底跑了哪一个 [1]。在平台补上这些之前，团队能做的就是上面那份清单：盘点、去重、写清优先级、测专属约束、记录实际调用、用 hook 守第一次读。装之前问一句「它会顶掉谁」，比事后翻输出找原因便宜得多。

作者公开了复现包，含 312 对实验用例、核心功能和检查脚本、实验 harness 以及全部运行日志 [1][11]。

## 参考来源

[1] Chaoliang Yan, Zihao Xu, Yuekang Li, Shangzhi Xu, Yi Liu, Gelei Deng, Siqi Ma. *One Skill Too Many: How Co-Installed Skills Conflict in Coding Agents*. arXiv:2610.11647, 2026-10-08. https://arxiv.org/abs/2610.11647

[2] Anthropic. Extend Claude with skills（Claude Code 文档）. https://code.claude.com/docs/en/skills

[3] Anthropic. Hooks reference（Claude Code 文档）. https://code.claude.com/docs/en/hooks

[4] Agent Skills. How to add skills support to your agent. https://agentskills.io/client-implementation/adding-skills-support

[5] OpenAI. Build skills（ChatGPT 与 Codex 文档）. https://learn.chatgpt.com/docs/build-skills

[6] Google. Agent Skills（Gemini CLI 文档）. https://geminicli.com/docs/cli/skills/

[7] GitHub. GitHub Copilot CLI configuration directory. https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-config-dir-reference

[8] seasonedcc/seasoned-skills. Issue #303: sync: generated skills can be silently shadowed by a same-named personal skill. https://github.com/seasonedcc/seasoned-skills/issues/303

[9] LangChain. Revamping skills in Deep Agents. https://www.langchain.com/blog/revamping-skills-in-deep-agents

[10] TechCrunch. Google is killing off Gemini's Gems in favor of 'skills'（2026-09-28）. https://techcrunch.com/2026/09/28/google-is-killing-off-geminis-gems-in-favor-of-skills/

[11] ltroin/conflict（论文复现包）. https://github.com/ltroin/conflict

[12] mattpocock/skills（GitHub 仓库）. https://github.com/mattpocock/skills
