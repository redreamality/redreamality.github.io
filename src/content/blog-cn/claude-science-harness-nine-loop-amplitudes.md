---
title: "Claude Science harness：无人值守算出九圈振幅"
description: "Anthropic Research 客座文（Matt von Hippel）讲 Fable 5.1 在 Claude Science harness 上算出平面 N=4 SYM 九圈六粒子振幅。本文核对可核数字与边界，主张刷新前沿的是显式 harness + 最小人类干预，不是更大模型。"
pubDate: 2026-09-27T10:40:00+08:00
author: "Remy"
tags: ["agent-harness", "agent-loop", "ai-agents", "anthropic", "claude", "LLM", "research"]
lang: "zh"
---

2026 年 9 月，理论物理里一条原本被认为「再多一圈就要换间接路线」的计算，被一套付费科学 agent 平台跑通了。主角不是新论文里的魔法公式，而是 **Fable 5.1 + Claude Science harness**：给定一句问题陈述，人类主要说「继续做、每 4–6 小时汇报」，系统沿已知 bootstrap 与 form-factor 两条路线算出平面 N=4 超杨–Mills（N=4 SYM）的**九圈六粒子（hexagon）MHV 振幅**，并由该方向权威 Lance Dixon 独立核验。

本文主张可以压成一句：**刷新这类计算前沿的，是显式 harness 与长程 agent 循环，不是「再换一个更大的模型」口号。** 它和站内 [扩张 Harness，而不是堆上下文](/cn/blog/grow-the-harness-not-the-context/)、[ECC 的可核验 harness 优化](/cn/blog/ecc-agent-harness-optimization/)、[Strands Harness SDK](/cn/blog/strands-harness-sdk-production-agent-runtime/) 是同一条机制线；和 [Claude「发现」类 CRISPR 酶系统](/cn/blog/claude-discovers-novel-enzyme-crispr-like-art/) 同属「科学 agent」，但对象不同——那篇是基因组模式识别与湿实验闸门，这篇是**可核验的符号级计算振幅**。

数字与过程描述一律以 Anthropic Research 客座文、作者本人博客、以及公开数据页 Cosmic9 为准；公开材料没写清的地方会标「未公开」，不编造 harness 源码级细节。

## 挑战从哪来：为什么「九圈」够硬

前理论物理学家、科学写作者 Matt von Hippel 在 2026-08-07 的博客里写过一条挑战：若 AI 公司想真正打动（或吓到）振幅学圈内人，就拿学术级算力预算，去碰该领域公认的大题——例如 **N=8 超引力七圈是否发散**，或 **N=4 SYM 六粒子振幅推到九圈**。[1][2] 他刻意挑的是「方法上已知、但算力与工程纪律看起来压不住」的题，而不是「需要全新物理概念」的谜题：他想测的是，当前系统能否在合理预算下，把大家都觉得太贵、太脆的计算做完。

振幅（scattering amplitude）是粒子物理用来算反应概率的公式。真实碰撞里几乎永远只能做近似；「圈数」（loop order）大致刻画相互作用允许多复杂——圈数越高，越接近完整答案，计算也越重。多数振幅只算到两三圈；振幅学家常用 **N=4 SYM** 这类「玩具模型」锤炼方法：它不描述真实世界，但因超对称平衡，变量组合更干净，适合把新技术推到极限。[1]

该方向的历史坐标（客座文转述）大致是：von Hippel 博士期间做过三圈；后来社区见到七圈；Lance Dixon（SLAC）等人几年前到八圈——且八圈振幅还借了 form-factor 与 antipodal duality（对偶映射）的间接路线。[1][3] 直接再推九圈，Dixon 本人认为「整条计算菜谱很脆」：任一步写错，整锅塌掉；许多细节又嫌太琐碎，论文里不会全部写死，代码几乎要从头搭。[3]

Anthropic 的物理学家 Liam Fitzpatrick 与 Siddharth Mishra-Sharma 读到挑战后接了 N=4 九圈这一题。据客座文，他们先问模型「哪个问题更可能啃得动」，再给出一句任务：

> The problem is to compute the Six-particle (hexagon) amplitude in planar N=4 SYM at nine loops.[1]

之后人类干预被压到极简——例如「我要去睡了，几小时内别指望我；继续做，直到我说停；每 4–6 小时更新」。[1] 这不是「零人类」，而是把人类从逐步调试员降成**稀疏闸门与进度观察者**。

## Claude Science 是什么：公开材料能钉住的 harness 层

客座文对 Claude Science 的定义很直白：它是科学家可付费使用的平台；在业内说法里就是 **harness**——用结构化规则与提示包裹 Claude，以换取更稳健、更适合科研的行为。[1] 模型档是 **Fable 5.1**。[1] von Hippel 在本人博客补充：他们没有用「内部神秘模型」，而是走科学家也能买的平台，因此同类题很快会被别人复测；他也坦承自己没看完整 LLM 日志，置信来自对谈细节与结果可核验性。[4]

公开材料**没有**放出 Claude Science 的完整源码、默认 Skills 清单或内部状态机图。能核对的是行为层事实：

1. **长程无人值守循环**：任务可跨数小时到数天；人类用「继续 / 睡觉去了」类指令维持自治，而不是逐步手把手改代码。[1]
2. **工具化执行环境**：bootstrap 路线用 **Python + SymPy**；计算侧对应约 **96 CPU × 一周**，约占端到端预算里 **100 美元**量级的数值算力。[1]
3. **双路径交叉**：同一目标做了 **直接 bootstrap** 与 **间接 form-factor（含 antipodal duality）** 两条路；任一路端到端大约 **1000–2000 美元**，成本大头是长时间跑 Claude，而不是集群 CPU。[1][4]
4. **外部权威核验**：结果交给 Dixon 验证；人类团队将正式发表与物理解读；Claude「角色告一段落」。[1][3]
5. **公开可对照产物**：九圈结果以与既有圈阶相同的格式放出；另有 Song He、Jirong Jing、Xiang Li 的并行九圈工作（他们用 GPT-6 辅助部分约束，但不是 Anthropic 这种近乎无人值守的 one-shot）。[1] Mishra-Sharma 维护的 Cosmic9 页进一步给出符号级文件、校验记录与方法说明，并写明「计算程序本身不公开」。[5][6]

把这些压成 harness 视角，会得到一张比「模型变聪明了」更有用的表：

| 层 | 这次公开能看到的 | 它不是 |
| --- | --- | --- |
| 模型 | Fable 5.1 | 「换更大模型就自动出九圈」的证据 |
| Harness / 平台 | Claude Science：结构化规则与提示 + 可付费科研用法 | 已开源的完整 agent OS 说明书 |
| Agent 循环 | 长时自治、定期汇报、双路径实现、符号级自检与交叉 | 发明了新的振幅物理原理 |
| 人类闸门 | 选题/启停/稀疏催促；权威外部验证；发表权在人类 | 全程零人类；也不是湿实验闭环 |
| 证据落点 | Cosmic9 文件、Dixon 核验、双表示一致 | 仅靠新闻标题或聊天截图 |

站内 [Hard Stop](/cn/blog/hard-stop-kernel-preemption-rogue-agent-containment/) 关心的是失控 agent 如何被内核级抢占；[Qwen Planner 与 harness 共演化](/cn/blog/qwen-planner-agent-model-harness-coevolution/) 关心模型与驾驭层如何一起涨。本文这条线更窄：**当「正确菜谱已知、执行极脆、耗时极长」时，谁负责把菜谱跑完而不塌锅。** 答案在公开叙事里落在 harness，而不是新物理。

## 九圈结果：算出来了什么，边界在哪

### 可核对的结果主张

- **对象**：平面 N=4 SYM 的九圈六胶子 MHV 振幅（客座文与 Dixon 附言用语：nine-loop MHV six-particle / six-gluon amplitude）。[1][3]
- **方法**：已知 bootstrap 菜谱 + form-factor / antipodal duality 路线；Dixon 强调 Claude「直接」做振幅让他意外，因为他自己原计划更绕的路径。[3]
- **预算**：端到端约 **1k–2k 美元**；其中 Python/SymPy bootstrap 的集群部分约 **100 美元 / 96 CPU·周**。[1]
- **时间线**：挑战帖 2026-08-07；Anthropic 约 8 月底联系 von Hippel；Dixon 写到 2026-09-01 被告知结果并开始核验；Anthropic Research 客座文日期 2026-09-25。[1][2][3]
- **独立性**：Song He 组几乎同时算出九圈振幅的 symbol 部分，AI 辅助程度不同；Dixon 自嘲「两周内被机器和『人+机器』各 scoop 一次」。[3]
- **公开数据**：Cosmic9 给出 quintuple-coproduct 与 septuple-coproduct 两套表示，并记录二者在全部对比过的系数上一致；form-factor 计算由 Claude 完成；程序不公开。[5][6]

### 必须钉死的边界（避免标题党）

**第一，这不是「AI 发明了新物理」。** von Hippel 的核心失望/清醒点就在这：他原想看到绕开算力墙的陌生新方法；实际看到的是**已知方法 + 比预期更敢用的工程与算力纪律**，外加 Python/SymPy 相对传统 CAS 工作流可能更利于 agent 编码。[1][4] Dixon 也写：真正让灵魂震颤的时刻，要等到模型在人类之前提出新物理原理。[3]

**第二，脆弱性仍在。** Dixon 把整条菜谱比作「一错就塌的舒芙蕾」：公开叙事强调的是 harness 把脆流程跑完，而不是脆流程消失。[3] Cosmic9 的方法说明进一步列出假设与未测项（例如部分方向只靠通量管 OPE 数据钉死、程序未分发等）——这是科学结果页该有的边界，不是营销附录。[6]

**第三，「无人值守」≠「无人类科学」。** 人类仍负责出题、启停、付费、请权威验证、发表与物理解读。客座文写的是 *without any scientific oversight more sophisticated than "keep going"*——指的是计算过程中几乎没有领域专家逐步盯梢，不是科学共同体退出。[1]

并行发生的 Song He 组工作，正好提供对照基线：他们也推进到九圈 symbol，并用 GPT-6 辅助部分约束，但框架仍由人类主导，不是 Anthropic 叙事里那种近乎 one-shot 的长程自治。[1][3] 对读者，这两条线不宜打成「人和 AI 谁赢了」；更干净的读法是**干预密度谱系**——从「人写框架、模型填局部」到「人写成功标准、模型扛完整菜谱」。你的团队先要决定自己落在谱系哪一段，再决定 harness 该多强硬。

**第四，可复现性是分层的。** 结果文件与校验记录公开；**生成这些文件的程序未公开**。[5][6] 因此社区复现路径更接近「对照公开符号/样本系数 + 独立实现菜谱」，而不是「一键重放同一 harness 轨迹」。对工程团队，这反而提醒：若你要抄的是 harness，证据链应落在**可复跑的检查点与交叉路径**，而不是只落在最终 zip。

**第五，推广半径未知。** von Hippel 明确说：玩具模型子社区的低垂果实，未必同密度存在于真实世界振幅的军备竞赛里；但他也不建议赌「没有」。更稳的读法是：凡是「方法已知、工程很重、验证可设计」的题，现在都值得用科学 harness 试 one-shot，并**先想好如何验**。[1][4]

### 公开校验页能多钉住什么（仍然不是程序复现）

Cosmic9 不是新闻通稿的附件，而是按 Dixon 既有 Cosmic 页风格组织的数据入口。对做 harness 的人，值得单独看一眼它**强制公开**的东西：两套符号表示（quintuple 与 septuple）的对照记录、样本词系数、八圈控制对照已发表结果、以及「方法 / 假设 / 未测项」专页。[5][6] 方法说明写得很硬：form-factor 计算是**单一流水线**给出模两个 31-bit 素数的符号；与独立 direct bootstrap 在全部对比过的系数上一致；同时列出例如「部分方向只靠近共线展开 T² 阶通量管数据钉死」「程序不分发」等未测与限制。[6]

这给产品叙事一个很实用的模板：**宣称突破时，把「如何验」写成和「如何算」同级的交付物。** 你不必开源整条 agent 轨迹，但应留下第二表示、低圈回归与抽样对照。反过来，若只有「模型说算完了」的会话摘要，就不该写成正式 blog 级结论。

### Bootstrap 为什么像数独：脆，但可自动判错

客座文把 bootstrap 比作数独：先在专用字母表里记下所有可能，再被已知极限、对称性、与更易算的相关问题交叉掉不可能项，希望最后只剩唯一解，并留有余量查错。[1] 对 agent 而言，这类任务的友善之处在于——**错往往表现为线性代数核维度不对、约束残差非零、与低圈已知答案不一致**，而不是「文笔不太对」。不友善之处在于：菜谱步骤多、文档不全、任一步符号约定滑一下，后面所有「看起来很漂亮」的中间文件都可能是废品。[3]

因此「无人值守」能成立，前提几乎总是：**错误可被机器看见。** 若你的领域错误只能靠资深审稿人读出来，把人类闸门稀到睡觉，只是把返工推迟到更贵的时刻。

## 机制拆解：长程科学 agent 实际在优化什么

去掉品牌词，这次故事里可迁移的机制只有几条。

### 1. 把「正确控制」沉到循环外

站内 [Growing Harness](/cn/blog/grow-the-harness-not-the-context/) 的主张是：别让模型每次重新发明同样的控制决策。Claude Science 的公开描述更粗——「结构化规则与提示」——但行为上对齐同一方向：长时任务的继续条件、汇报节奏、工具使用惯例，不应每步靠用户即兴喊话。[1] 你看不到源码，仍能看到产品形态：**付费平台默认带着科研向 harness，而不是裸聊天框。**

### 2. 稀疏人类闸门，而不是逐步结对编程

人类指令样本几乎全是启停与续跑。[1] 这和编码 agent 里「每改完一个文件就问人」相反。适合这种闸门密度的任务特征很清楚：目标单句可陈述；中间状态可用计算检查（线性代数残差、有限域一致性、与低圈已知结果对照）；最终有外部 oracle（Dixon / 双路径 / 样本系数）。

若任务缺少可自动检查的中间不变量，把人类闸门稀到「去睡觉」通常只会更快生产自信的错。站内酶发现文已经演示过另一极：湿实验与功能未知必须由人接。[酶发现文](/cn/blog/claude-discovers-novel-enzyme-crispr-like-art/)

### 3. 双路径与外部验证，当作 harness 的一等公民

Claude 自己跑了 bootstrap 与 form-factor 两路；Cosmic9 又把 form-factor 路线与独立 direct bootstrap 的 septuple 表示对齐。[1][5][6] 对 agent 系统设计，这意味着：**交叉验证不是论文致谢里的礼貌，而是长程循环的退出条件。** 单轨迹「看起来算完了」不够；要有第二条表示、低圈回归、或外部专家协议。

### 4. 成本结构在提醒：LLM 墙可能高于 CPU 墙

von Hippel 在 Q&A 里写到一个反直觉点：九成以上成本在 LLM，不在数值计算本身；用十倍于「人类写好代码再跑」的算力换结果，在差旅预算对照下仍可能更值。[4] 对团队排期，这意味着优化顺序常常是：

1. 先让 harness 稳定跑完脆流程（正确性）；
2. 再压缩模型在循环里的停留时间（成本）；
3. 最后才纠结集群 CPU 规格。

这和 [Strands](/cn/blog/strands-harness-sdk-production-agent-runtime/) 强调的上下文经济学、[ECC](/cn/blog/ecc-agent-harness-optimization/) 的「上下文窗外持久化」是同一账本的不同科目。

### 5. 软件工程纪律可能比「灵感」更决定成败

客座文提到：Claude 可能只是用了更好的工程实践（Python/SymPy vs Maple/Mathematica 工作流），谈不上超级智能式跳跃。[1] 评论区也有人指出：有可对照范例、可先在低圈回归的菜谱，对当前 agent 极友好。[4] **可抄的是「范例—回归—升一圈」的仓库结构，不是「相信模型会顿悟」。**

## 团队可抄清单：抄 harness，不抄口号

下面清单按「你明天能改仓库」来写。假设你做的是长程科研/数据/符号计算类 agent，而不是又一个聊天包装。

### A. 任务准入（先问能不能验）

1. **一句话目标**是否能写清？写不清就先别上无人值守。
2. **中间不变量**有哪些？残差、哈希、黄金样本、低版本回归、双实现一致——至少要有两类。
3. **外部 oracle** 是谁？人审、独立代码、已知低阶解析、第三方格式。没有 oracle 的「前沿」只适合 notes，不适合宣称突破。
4. **失败是否可观测**？Dixon 说的舒芙蕾型任务，必须让失败变成红灯，而不是静默出接近真相的垃圾文件。

### B. Harness 最小装配（对齐公开行为，不假装复刻 Claude Science）

1. **会话外状态**：工作目录、检查点、待办、已验证产物清单；不要只靠越来越长的聊天历史。[Growing Harness](/cn/blog/grow-the-harness-not-the-context/)
2. **续跑协议**：明确「人类离线时继续 / 何时必须停 / 汇报节拍」。Fable 系长程工作流的公开提示指南也强调：把暂停条件写清楚，比枚举一万种例外更有效。[7]
3. **工具面收窄**：代码执行、作业提交、文件读写、测试跑法固定；少给「随便上网改题意」的自由度。
4. **双路径或双表示**：能并行就并行；不能并行就「实现 A + 独立校验 B」。
5. **成本探针**：分开记账「模型 token / 工具 CPU / 人工闸门次数」。这次案例的教训是：你以为贵的是集群，账单上贵的可能是模型。[1][4]

### C. 人类闸门设计

| 闸门 | 建议密度 | 说明 |
| --- | --- | --- |
| 选题与成功标准 | 高（开工前） | 人类写清验什么 |
| 中途科学判断 | 低（有自动检查时） | 避免逐步结对 |
| 破坏性对外动作 | 高（始终） | 发邮件、推正式库、花真钱调用 |
| 最终签署 | 高（发布前） | 权威核验或双盲对照 |

科学计算可以「睡觉去了」；把结果写进正式论文或生产配置，不能睡过去。站内 Hard Stop 讨论的是强制停机；这里对称的是**强制验收**。[Hard Stop](/cn/blog/hard-stop-kernel-preemption-rogue-agent-containment/)

### D. 一次长程科学 run 建议留下的最小日志

对照这次公开时间线，团队若自己跑类似题，至少落盘这些字段（不必抄 Claude Science 内部格式）：

1. **任务句**与成功标准（含「验什么才算过」）。
2. **模型档 / harness 版本 / 工具镜像哈希**（可复述环境）。
3. **人类干预时间线**：每条启停、续跑、改题指令的时间戳与原文。
4. **检查点**：低圈回归是否绿、双路径是否分叉、最近一次残差/素数一致性摘要。
5. **成本拆分**：模型费用、CPU/GPU、人工小时；避免事后只记得「差不多一千刀」。
6. **交付物清单**：最终文件、样本对照脚本、未验证假设列表（直接学 Cosmic9 的「What remains untested」写法）。[6]

von Hippel 的 Q&A 还有一条对排期很狠的提醒：六个月前他不认为同等系统做得到；预测下一步时，不要默认「这就是能力上限」。[4] 日志的作用之一，就是让你三个月后能回答「到底是模型涨了、harness 涨了，还是题本来就没那么贵」。

### E. 反例：什么情况下抄这篇会翻车

- **需要新概念，而不是多一圈已知菜谱**（von Hippel 对量子引力类问题的评论：那是愿意咬哪颗子弹的问题，不是技术熟练度）。[4]
- **没有可自动检查的中间态**（纯开放写作、无结构文献综述）。
- **验证成本高于生成成本**（生成 1k 美元，验证要专家三个月且无法形式化）。
- **把「程序不公开」的结果页当成可复现工程**——Cosmic9 很清楚地区分了数据可核与程序未分发。[5][6]

## 和站内 harness 线怎么对照

把几篇站内文放进同一坐标系：

| 文章 | 解决的问题 | 和九圈故事的交集 |
| --- | --- | --- |
| [扩张 Harness](/cn/blog/grow-the-harness-not-the-context/) | 控制沉成代码，少堆上下文 | 九圈依赖长程稳定控制，而非更长 prompt |
| [ECC](/cn/blog/ecc-agent-harness-optimization/) | 在现有 coding agent 外挂可核验层 | 同属「驾驭层产品化」；九圈侧是科研平台而非 IDE 插件 |
| [Strands Harness](/cn/blog/strands-harness-sdk-production-agent-runtime/) | 循环控制做成可发货 SDK | 共享「显式 harness 产品」形态；科学场景多了符号校验与外部 oracle |
| [酶系统 ART](/cn/blog/claude-discovers-novel-enzyme-crispr-like-art/) | 科学 agent 的营销分层与湿实验边界 | 同厂科学叙事；对象从「假设生成」换成「可核验计算」 |
| Hard Stop / Qwen Planner（点到即可） | 失控遏制；模型×harness 共演化 | 九圈展示的是**肯干活的共演化结果**，不是遏制协议本身 |

若只记一句产品结论：**当社区已经写出脆但完整的菜谱，瓶颈就从「会不会想」切换到「谁能在预算内不塌地跑完」。** 这时买更大模型，不如先买（或长）一层带检查点、双路径与稀疏闸门的 harness。

## 结语

Matt von Hippel 的挑战原本想逼出「算力墙被奇异方法绕开」的未来预告片；他得到的是更土、也可能更重要的当下现实：低垂果实比专家体感更多；一笔约千美元级、带科学 harness 的长程循环，已经能把振幅学里「专家级、极脆、多阶段」的下一步算完，并交出可核验产物。[1][4]

对做 agent 系统的人，这不是「物理圈又被 AI 震撼」的软新闻，而是一次可引用的字段实验：

- **主张**：harness × agent-loop 刷新计算前沿；
- **证据**：Fable 5.1 + Claude Science、双路径、1k–2k 美元、Dixon 核验、Cosmic9；
- **边界**：已知方法、程序未完全公开、新物理原理仍未出现、推广半径待测。

长期主义内容只需要把这三行钉牢。其余热度，留给时间线。

## 主要来源

1. Matt von Hippel（Anthropic Research 客座），[Yes, Claude can do Nine Loops](https://www.anthropic.com/research/yes-claude-can-do-nine-loops)（2026-09-25）；含 Lance Dixon 附言。披露：Anthropic 支付撰稿费；Dixon 获 Claude 使用额度。
2. Matt von Hippel，[It Only Counts When AI Gets to My Field](https://4gravitons.com/2026/08/07/it-only-counts-when-ai-gets-to-my-field/)（2026-08-07），原始挑战。
3. 同上客座文中 Lance Dixon 附言（SLAC / Stanford）。
4. Matt von Hippel，[It Got to My Field](https://4gravitons.com/2026/09/25/it-got-to-my-field/)（2026-09-25），撰稿立场、成本结构与边界 Q&A。
5. Siddharth Mishra-Sharma 等，[Cosmic9](https://smsharma.io/cosmic-nine-loops/)：九圈符号/函数文件与校验入口；程序未分发；大文件 Zenodo DOI 10.5281/zenodo.22949278。
6. Cosmic9，[method_and_validation.md](https://smsharma.io/cosmic-nine-loops/validation/method_and_validation.md)：方法、假设、未测项与双表示对照。
7. Anthropic 平台文档，[Prompting Claude Fable 5.1](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-1)（长程循环与检查点提示的一般指南；**不是** Claude Science 内部实现说明）。
