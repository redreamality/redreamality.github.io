---
title: "Jev-Mobile：低频 VLM 定局部目标，高频 typed decision 在无树候选上连选动作"
description: "解读 arXiv:2609.30186 Jev-Mobile：把 Jev 从裁判/记忆接到 Android GUI 执行环；核对 AndroidWorld 全量 79% 成功率与成功轨迹 −32.7% 时间、−73.4% API 成本，并给出可复用的 VLM×typed-executor 清单。"
pubDate: 2026-09-25T00:00:00+08:00
author: "Remy"
tags: ["jev", "ai-agents", "agent-harness", "System One", "VLM", "mobile"]
lang: "zh"
---

手机 Agent 每点一下屏幕，若都要再开一轮视觉语言模型（VLM）做规划与 grounding，时延与 API 账单会跟着手势次数线性涨。截图能看见图标，可访问性树（accessibility tree）能给出可点控件与字段状态——两边信息并不等价，也都不回答「局部控制器何时该把控制权交回去」。

Linghua Zhang 在 [arXiv:2609.30186](https://arxiv.org/abs/2609.30186) 提出的 **Jev-Mobile**，把这条路径拆开：**低频 VLM 定局部目标，高频 typed decision（Jev）在当前可访问性树候选上连选动作**。一次 VLM 委派可以覆盖多步 GUI 操作；每步动作仍绑定「刚观测到」的树，而不是靠模型事后编一段委派摘要来对齐状态。AndroidWorld 全量任务上，成功率贴近 SeeAct-V，成功轨迹的端到端时间与模型 API 成本则明显低于逐步 VLM 基线。[1]

站内已经写过 [Jev 接到 Claude Code](/cn/blog/jev-claude-code-10x-and-25-lines/)、[ContractNLI 上均分相近判决可不同](/cn/blog/jev-vs-llm-contractnli-same-scores-different-decisions/)、[Jev-Mem 的记忆控制面](/cn/blog/jev-mem-system-one-agentic-memory/)，以及 [扩张 Harness 而不是堆上下文](/cn/blog/grow-the-harness-not-the-context/)。那些文谈的是决策层、记忆控制与 harness 分工。本篇换到 **移动 GUI 执行器**：同一套「结构化、有界输出」的 System-One 直觉，落到 Android 触摸环上会是什么样子；论文里哪些数字可核；和站内既有 Jev 线为什么是同一条长期主义线索。

先钉命名边界：**Jev-Mobile 是把 typed Decisions 服务当作 GUI 执行模型的研究系统**。论文描述的是 TypeSafe 风格的类型化决策接口；**不要**据此把它读成厂商官方同一产品线，除非 TypeSafe 自己这么写。[1][2]

## 问题：每一步都让 VLM 点一下，贵在哪里

AndroidWorld、Mobile-Bench、SPA-Bench 等基准要求 Agent 在真实或仿真设备上接地动作、核对结果。[1][3] 常见实现是：当前截图（有时加树）进 VLM，模型输出下一步点击坐标或控件描述，执行后再观测——**规划与 grounding 几乎同频**。

这样写回路直观，但账单结构很硬：

1. **时延叠乘。** 每一步都付一轮大模型推理；多 App、多字段填写的长轨迹，墙钟会被执行模型 API 时间拖住。
2. **成本与手势次数绑定。** 成功轨迹上，逐步 VLM 的执行模型时间与全角色 API 费用都偏高——论文 Table 1 里逐步 VLM 成功轨迹的平均执行模型时间是 94.30 秒，平均模型 API 成本是 $0.273694。[1]
3. **控制话术挤占观测。** 模型既要理解任务，又要在噪声树/截图上挑控件，提示里同时塞策略与像素描述时，真正该留给「当前屏状态」的上下文会被挤占——这和 Growing Harness 批评的「控制占用本该留给任务证据的上下文」是同一类压力。[4]

还有一类更隐蔽的成本：**错误形态难回归**。自由文本动作（「点右上角那个像齿轮的图标」）难做类型检查；坐标漂移、控件复用、动画未结束时的陈旧绑定，监控里往往只看到「模型很自信」。把可执行空间收成程序生成的 ID，至少能把「格式合法但语义错」和「根本不可执行」分开记账——后面 coverage / selection / handoff 的诊断，依赖的就是这种可观测性。[1]

截图与可访问性树的取舍也不是二选一口号：

- **截图**：能看见树里缺失的图标、未标注图形按钮；纯视觉 grounding（如 SeeAct-V 一类）可以走这条路。
- **树**：能暴露可点父节点、启用/禁用、边界框、文本/描述/hint；适合程序枚举可执行候选，而不是让模型自由发明坐标。

两者都不自动回答 **handoff**：局部目标何时算完成、何时该 BLOCKED 回去让 VLM 重写目标。Jev-Mobile 因此把 **候选覆盖（coverage）、选择（selection）、交还（handoff）** 与最终任务成功拆开量——成功由 AndroidWorld 终端评测独立打分，轨迹标签只用于诊断，不替代终端分。[1]

论文开篇的问题意识可以压成一句：在 GUI Agent 里，**「看见」≠「可执行」，「可执行」≠「该交还」**。Jev-Mobile 的设计选择是：看见仍交给 VLM（它读截图与树），可执行交给程序 + typed 选择，交还由 DONE/BLOCKED 显式信号承担，而不是靠模型散文自我宣布「局部完成」。[1]

## 方法：委派状态机 + 现树候选 + typed 连选

### 控制流：delegate / finish / blocked

在委派 \(k\)，VLM 读任务指令 \(u\)、当前截图与树、以及程序汇总的「已真正提交到设备」的动作历史（按更早局部目标分组）。一次调用输出：

- \(d_k \in \{\texttt{delegate},\texttt{finish},\texttt{blocked}\}\)
- 委派时的局部目标 \(g_k\)
- 可选的精确文本值 \(v_k\)（例如从便签抄进日历的时间字符串）

**它不生成委派后摘要。** Jev 可在 \(g_k\) 下连做多步原子动作，而不再问 VLM。Jev 返回 DONE 表示本局部目标可交还；BLOCKED 表示需要解释或当前候选不够。DONE/BLOCKED **都不等于整任务成功**——VLM 发出 finish 后，由 AndroidWorld 独立评终端设备状态。[1]

这一点值得单独强调：许多 Agent 框架会在子策略结束后让模型「总结刚才做了什么」。Jev-Mobile 故意不做。交还时 VLM 看到的是当前观测 + 分组后的真实动作历史。好处是摘要幻觉进不了状态对齐；代价是历史一长就要压缩，且 VLM 必须自己从动作序列推断局部进展。[1]

论文用「从便签抄会议时间进日历」做控制流示意（不是某条实测任务结果）：VLM 负责读便签并给出精确时间字符串；Jev 在连续屏上从候选里点字段、点 Save。若便签只是图片、或所需控件不在树里，Jev 只能 BLOCKED；第一版**不能**从图像合成坐标动作。这个例子把分工钉死：需要语义理解与字符串抽出的步骤留在 VLM；需要在标签化控件间导航的步骤交给 typed 连选。[1]

### 候选：从当前原始树确定性生成

候选集 \(C_t = f(T_t, z_t, v_k)\) 由程序遍历原始树节点（含可点子节点）得到。可见、启用、边界合法的节点，按显式 flag 产出 click / long-press / scroll / focus；\(v_k\) 里的精确文本可对聚焦字段产出 input；Back / Home / Enter / Open app 在设备状态与共享动作契约支持时加入。缺失 flag 保持未知；不可见、禁用、非法边界不产动作。当前输入工具拒绝不支持的非 ASCII 文本。[1]

每个候选把本地 ID 绑到动作、节点/区域与参数；短标签取 text / description / hint / resource name / class 中第一个可用属性加节点索引。完整原始树仍作为元数据供给；Jev 看到的是「短标签 + 树文本」，不是学出来的控件 embedding。[1]

执行前用新观测校验；执行后立刻再观测并重建 \(C_{t+1}\)，旧 ID 与坐标作废。对非幂等动作的模糊响应走检查，而不是盲目重提。这两条规则看起来像工程琐事，却直接决定失败账本能不能分清：没有再观测，selection 错误会和「界面已变、ID 绑错节点」缠在一起；盲目重提则会把一次不确定点击放大成多次破坏性写入。[1]

要点：**原始树不压成学到的语义图**。Jev 同时吃文本树与候选描述，又长又吵的树仍是失败模式。方法的保证更窄：被选中的候选，是某次特定观测导出的可执行动作。再观测防止「上一屏选的 ID，在界面变了之后静默绑到长得像的另一个节点」。[1]

和 AppAgent / AutoDroid / UICompass 等「探索地图或持久 UI 结构」路线对照：Jev-Mobile **每步从 live 树重生候选，不维护跨任务地图**。缺树目标因此记成 coverage 失败，而不是「地图过期」或「检索错了相似页」。这条选择降低了地图维护成本，也把能力上限钉在当前树质量上。[1]

### Typed 决策与事件账本

每次 Jev 请求是一次类型化选择：准则把当前候选 ID、DONE、BLOCKED 映射到描述；状态含 \(g_k\)、观测 ID、文本树、本委派内动作历史。适配器在执行前校验类型与 ID。输出空间有界，**正确性不保证**——这和站内 ContractNLI 文的提醒一致：结构化输出降低的是格式与分支成本，不是自动正确。[1][5]

每步提交记录：所选 ID、实际动作参数、执行状态、前后观测 ID、确定性变更描述。交还时 VLM 拿到的是**当前**截图/树与分组后的任务局部动作历史——不是旧截图、旧原始树、预测动作或模型写的摘要。提交前被拒的陈旧选择不进历史。超字符上限的旧条目压缩成「目标 + 步数 + 交还原因」，并记录省略的组。**不用学到的 router，也不跨任务记忆。**[1]

预算、无效输出、陈旧 ID、溢出、API 错误都进事件账本。视觉目标若没有可执行树候选，VLM 可以改写目标，但第一版仍可能到不了：没有产坐标的视觉回退。论文明确写：第一版不要求新训练、层次修复、语义字段绑定或结构化完成谓词——缺什么就暴露为什么失败，而不是在控制器里静默「修」。[1]

「local」在文中描述的是**决策作用域**（一次局部目标下的连选），**不是**「模型跑在手机端」。Jev 是远程 typed Decisions 服务；请求与观测本身也可能抵消一部分「少调用 VLM」省下的开销——论文在引言里点了这句，提醒效率账要看端到端，不能只数 VLM 调用次数。[1]

## AndroidWorld 数字：只核 Table 1

实验在 **full AndroidWorld** 任务套件上，用其任务初始化与终端评测器。[1][3] 对照只有三套系统，共享通用 VLM **Qwen3.8-Max**（OpenRouter ID `qwen/qwen3.8-max-0902`），但各自保留执行机制：

| 系统 | 谁定每步动作 |
| --- | --- |
| Step-wise VLM | 同一通用 VLM 逐步从观测与历史里选动作 |
| SeeAct-V | 同一通用 VLM 逐步决策；**UI-TARS-1.5-7B** 做 grounding（论文披露：替代原配置里的 UGround） |
| Jev-Mobile | 通用 VLM 定局部目标；Jev 在现树候选上连选，直到交还；handoff 模式 `jev_action_history`，无生成委派摘要 |

因此结果刻画的是**完整系统**，不是「把 Jev 单独抠出来」的消融。SeeAct-V 的 grounder 也不是原文 UGround 配置——论文在实验设计里主动披露这一替换，读表时不要把它当成「与 UGround 论文数字可直接横比」。[1]

Table 1（成功率用全部评测实例；时间与美元用成功轨迹子集）：

| Metric | Step-wise VLM | SeeAct-V | Jev-Mobile |
| --- | ---: | ---: | ---: |
| Full-task success rate | 0.84 | 0.78 | **0.79** |
| Mean total time per success (s) | 197.21 | 162.63 | **132.67** |
| Mean executor time per success (s) | 94.30 | 12.37 | **5.16** |
| Executor cost, successful trajectories summed (USD) | 0.694774 | 0.030579 | 0.013091 |
| Mean model API cost per success (USD) | 0.273694 | 0.193207 | **0.072744** |

读表时对齐论文正文口径：

- **成功率**：Jev-Mobile **79%**，SeeAct-V **78%**，逐步 VLM **84%**。相对逐步 VLM 低五个百分点，贴近 SeeAct-V。[1]
- **相对逐步 VLM（成功轨迹）**：端到端平均时间 132.67 vs 197.21，**−32.7%**；平均模型 API 成本 $0.072744 vs $0.273694，**−73.4%**；执行模型时间 5.16 vs 94.30 秒（正文另写执行模型时间相对降幅约 94.5%）。[1]
- **相对 SeeAct-V（成功轨迹）**：时间 132.67 vs 162.63，**−18.4%**；成本 $0.072744 vs $0.193207。[1]

计量口径也值得钉死，避免二次传播时串行：

- 「执行模型时间」分别计：逐步 VLM 的 Qwen、SeeAct-V 的 UI-TARS、Jev-Mobile 的 Jev。
- 「Executor cost, successful trajectories summed」是成功轨迹上执行模型费用的**队列总和**（cohort sum），不是单条轨迹单价。
- 「Mean model API cost per success」才是成功轨迹上**全部模型角色**费用的平均值——跨系统比「每成功一次大概花多少模型钱」时用这一行。[1]
- 时间与成本都是 **conditional on success**：失败轨迹不进这些均值。成功率更低时，成功子集可能更「好做」——论文没有声称已对难度做匹配校正，读效率增益时要保留这层条件。[1]

这些数字支持的主张很具体：**typed decision 可以在 VLM 引导的移动 GUI Agent 里当执行模型，并在成功轨迹上显著压低时延与 API 成本**；它不支持「已经全面超过逐步 VLM 的成功率」，也不支持「Jev 单独贡献了多少百分点」——因为没有「同一委派工作流里用小 VLM 替换 Jev」的消融。[1]

## 失败怎么拆：coverage / selection / handoff

论文把诊断与终端成功分开，是因为 GUI Agent 的错经常混在一起。粗分三类更利于改系统：

1. **Coverage（候选覆盖）**：可接受动作根本不在 \(C_t\) 里。典型原因：目标只在截图上可见、树缺节点或 flag、非 ASCII 输入被拒、设备契约未暴露 Back/Open app。第一版**不能**给树缺失的视觉目标补坐标，这类失败会表现为反复 BLOCKED 或改目标仍碰不到控件。[1]
2. **Selection（选择）**：可接受候选在集合里，但 Jev 没选对。输出空间有界只降低格式失败，不保证语义正确；长而吵的树会加重这类错。调试时优先看：短标签是否歧义、同类控件是否过多、局部目标文本是否把约束说清。[1]
3. **Handoff（交还）**：局部目标已完成却未 DONE，或还没完成就 DONE/BLOCKED；或 VLM 在交还后未能据此写出下一目标/finish。交还用的是分组动作历史，不是模型写的委派摘要——摘要缺失会逼着 VLM 从「实际发生过的动作 + 当前屏」重建状态，这是刻意设计，也会暴露历史压缩过度时的信息损失。[1]

和「截图 vs 树」对照：SeeAct-V 路线用视觉 grounder 扛 coverage；Jev-Mobile 把可执行空间钉在程序生成的树候选上，**树缺失即不可执行**。这不是疏忽，而是第一版的显式边界——测的是「typed 执行器 + 现树」能走多远，而不是再叠一套视觉回退。[1]

实务上可以用三条探针分流：

- 若人工看截图觉得「按钮明明在」，先查树里有没有对应节点与 flag → coverage。
- 若候选列表里已有正确控件，但轨迹点了别的 → selection。
- 若局部流程其实做完了，却迟迟不交还、或过早交还导致 VLM 重开错误目标 → handoff。

把探针写进日志字段，比事后读一整段模型思维链更便宜，也更接近 harness 思维：控制状态应可机器核对。[4]

## 边界条件：论文 Limitations 写死的几条

交审与复现时建议直接按 Limitations 核对，避免外推：

1. **只评 AndroidWorld 移动任务**；未测 Web。DOM、页面动态与交互模式可能对 decision-model executor 提出不同要求。[1]
2. **未做「同一委派工作流里用小 VLM 替换 Jev」的消融**；因此不能把效率增益干净归因于「typed decision」相对「小 VLM 执行器」，只能归因于整套 Jev-Mobile 系统相对两套对照系统。[1]
3. **依赖 Android 可访问性树**；视觉上明显但树里没有的目标，当前控制器变不成可执行候选。[1]
4. **输入路径目前支持可打印 ASCII**；非 ASCII 被拒——中文输入、特殊符号字段要额外设计，不能假设「VLM 写出字符串就能 input」。[1]
5. **长动作历史可能需要压缩**；压缩策略是程序替换为「目标 + 步数 + 交还原因」，不是再让模型写摘要。[1]
6. **无新训练、无层次修复、无语义字段绑定、无结构化完成谓词**——缺啥就记成 coverage/handoff 失败，而不是静默「修树」。[1]

还要注意实验边界：隐藏任务参数与评测器答案对所有在线模型提示不可见；终端奖励在 VLM finish 之后才由 runner 计算。这意味着系统不能「偷看标准答案」，也意味着 DONE 只是局部控制信号，不是刷分捷径。[1]

## 和站内 Jev 线怎么对照

把 Jev-Mobile 嵌回站内已发文，比单独追一篇 arXiv 更有用：

- 相对 [Jev × Claude Code](/cn/blog/jev-claude-code-10x-and-25-lines/)：那边是「决策层怎么接到编码 Agent」；这里是「决策层怎么接到 GUI 执行环」。共同点是：高频、有界输出的判断，不要默认塞进自回归生成。差别是：编码侧常有文件系统与测试作为外部真值；GUI 侧的外部真值更碎——树节点、设备状态、独立终端评测——所以候选构建与再观测变成了硬依赖。
- 相对 [Jev-Mem](/cn/blog/jev-mem-system-one-agentic-memory/)：Mem 把 System One 接到记忆的写/读/停取；Mobile 接到 GUI 的选控件/交还。都是「控制面离开生成热路径」，对象从记忆图换成了现树候选。Mem 强调预算与停取；Mobile 强调 DONE/BLOCKED 与无摘要交还——停取语义换了载体，结构相似。
- 相对 [ContractNLI 对照](/cn/blog/jev-vs-llm-contractnli-same-scores-different-decisions/)：那边提醒均分相近仍可能翻个别判决；这里提醒成功率接近 SeeAct-V，不代表失败模式相同——一边可能死在 grounding，一边可能死在 coverage。聚合成功率接近时，更要看诊断标签分布，而不是只看一个百分点的高低。
- 相对 [扩张 Harness](/cn/blog/grow-the-harness-not-the-context/)：候选构建、再观测、历史压缩、预算账本，本质是 harness 代码在承担可复现控制；Jev 只吃已经被程序收窄的选择空间。这和「把反复出现的控制沉进代码/类型化决策，而不是堆进上下文」同构。[4]
- 相对 [Jev 场景目录](/cn/blog/typesafe-jev-use-cases/)：目录里多是产品侧决策场景；Jev-Mobile 展示的是研究侧把同一类接口推进 **executor** 角色——从裁判/记忆，走到移动 GUI 连选。[2]

相关工作也提醒：层级规划、云端/端侧分工、轻量 GUI policy（如 LAMO）本身不是本文的新颖性主张；本文要验的是 **typed、按屏、在程序生成 ID 上的选择 + 显式 VLM handoff**。读论文时若只记住「高低层分工」，会低估它真正要回答的问题：typed decision model 能不能当 GUI 执行模型。[1]

## 可复用清单：自己搭 VLM×typed-executor 移动环

若你要在生产或实验里复刻「低频规划 + 高频执行」，建议按下面清单自检——条目对齐论文机制，不发明额外数字：

1. **拆清三个角色。** VLM：任务解释与局部目标；程序：观测、候选、校验、账本；typed executor：在有界 ID 集合上选一个或 DONE/BLOCKED。不要让 VLM 同时兼任「发明坐标」与「宣布局部完成」，除非你明确接受难以回归的错误形态。
2. **候选必须绑定当次观测。** 执行后重建候选；禁止跨屏复用旧 ID/坐标。把「观测 ID」写进每条候选与每条账本记录。
3. **委派输出结构化。** `delegate|finish|blocked` + 局部目标 + 精确文本；**不要**依赖模型写的委派后摘要对齐状态。若必须摘要，把它当成可选调试字段，不要当成控制真值。
4. **终端成功与轨迹诊断分开。** 用独立评测器打任务分；用 coverage / selection / handoff 标签查失败。成功了也抽样看 handoff 是否过早/过晚。
5. **明确 coverage 上限。** 树缺失视觉目标怎么处理？第一版可以像论文一样拒绝执行；若要视觉回退，单独成模块并单独计量，别假装「typed 选择」已经覆盖。
6. **输入与字符集写进契约。** ASCII-only 就要在 VLM 侧避免委派非 ASCII；否则会稳定打成 coverage/输入失败。需要中文输入时，先扩工具契约，再扩局部目标。
7. **历史压缩可审计。** 超限时记录省略了哪些组；交还给 VLM 的应是实际提交过的动作，不是预测动作。压缩后做一次「VLM 是否还能复述局部进展」的抽检。
8. **对照实验说清共享与不共享。** 共享通用 VLM、保留各自执行器时，结论只能写「系统对比」；若要归因 Jev，需要「同工作流替换执行器」的消融。披露 grounder 替换（如 UI-TARS 替 UGround）与论文同一标准。
9. **预算进账本。** 墙钟、步数、调用、等待、重试与无效输出留痕，才能解释「快」是来自更少 VLM 调用，还是来自更短设备等待。分别报执行模型时间与全角色模型成本，避免口径串行。
10. **命名与产品边界。** 研究里借用 typed Decisions / System-One 接口时，对外文案区分研究系统与商业产品线，避免读者以为某一 vendor 已发布「Jev-Mobile」SKU。
11. **非幂等动作单独策略。** 提交前校验、模糊响应走检查；不要用「再点一次」当默认恢复。账本里区分「未提交的陈旧选择」与「已提交的失败」。
12. **先问哪些步骤可离开逐步 VLM。** 标签化导航、填已知字符串、按显式 flag 滚动——优先进 typed 环；需要读图、跨模态抄写、处理树缺失图标——留在 VLM 或视觉 grounder。分工写进设计文档，比事后调提示稳定。

## 结语

Jev-Mobile 把站内熟悉的主张推进了一步：Jev 不只是裁判或记忆控制器，也可以是 **移动 GUI 的高频执行模型**。机制上，它用可访问性树把可执行空间钉死，用再观测防止陈旧绑定，用无摘要的动作历史交还逼 VLM 看「真实发生过的事」。AndroidWorld 全量上 79% 成功率贴近 SeeAct-V；成功轨迹相对逐步 VLM 省下约三分之一墙钟与约四分之三模型 API 成本——代价是成功率仍低五个百分点，且树缺失目标当前走不通。[1]

若你正在设计手机 Agent，更值得先抄的不是「再换一个更强 VLM」，而是：**哪些步骤已经稳定到可以离开逐步 VLM 热路径，交给程序候选 + typed 选择。** 那才是和 Growing Harness、Jev-Mem 同一条线上的工程问题。

## 参考文献

1. Linghua Zhang. *Jev-Mobile: Jev as an Executor for Mobile GUI Agents*. arXiv:2609.30186, 2026. https://arxiv.org/abs/2609.30186
2. TypeSafe / Jev 产品与场景（站内整理）：https://redreamality.com/cn/blog/typesafe-jev-use-cases/
3. Christopher Rawles et al. *AndroidWorld: A Dynamic Benchmarking Environment for Autonomous Agents*. ICLR 2025. https://arxiv.org/abs/2405.14573
4. 站内：扩张 Harness，而不是堆上下文. https://redreamality.com/cn/blog/grow-the-harness-not-the-context/
5. 站内：均分相近不代表判决一样（ContractNLI）. https://redreamality.com/cn/blog/jev-vs-llm-contractnli-same-scores-different-decisions/
6. 站内：记忆控制别默认塞给自回归 LLM（Jev-Mem）. https://redreamality.com/cn/blog/jev-mem-system-one-agentic-memory/
7. 站内：Jev × Claude Code. https://redreamality.com/cn/blog/jev-claude-code-10x-and-25-lines/
8. Boyuan Gou et al. *Navigating the Digital World as Humans Do: Universal Visual Grounding for GUI Agents* (UGround / SeeAct-V 语境). ICLR 2025. https://arxiv.org/abs/2410.05243
9. Yujia Qin et al. *UI-TARS: Pioneering Automated GUI Interaction with Native Agents*. arXiv:2501.12326. https://arxiv.org/abs/2501.12326
