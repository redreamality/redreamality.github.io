---
title: "Progressive Disclosure：技能库一大，Agent 就先崩了吗"
description: "解读 Workday arXiv:2609.35692：生产技能库 eager 全量加载 vs progressive disclosure（先 frontmatter、按需 load_skill）；N=100 eager 全 crash，最高省 81.7% token，检索更稳，延迟略增。"
pubDate: 2026-09-29T16:40:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "developer-tools", "Agent Skills"]
lang: "zh"
---

Skills 库一涨，很多人先改的是「再写一条更好的 skill」，而不是问 harness：**这一百份 SKILL.md，是不是每次任务都整份塞进上下文？** 站内 [扩张 Harness，而不是堆上下文](/cn/blog/grow-the-harness-not-the-context/) 谈的是把反复出现的控制决策长成代码；[Harness 控成本](/cn/blog/control-the-harness-control-the-cost/) 谈的是路由与治理；[三种烧钱习惯](/cn/blog/coding-agents-cost-inefficient-behaviors/) 谈的是轨迹里的重复劳动。还有一类更「看起来合理」的浪费：**任务其实只需要一个 skill，harness 却把库里每个 skill 的正文全量披露**——上下文被无关指令占满，检索变差，账单跟着涨，极端时直接 context overflow。

Workday AI Research 的 Guilin Zhang、Kai Zhao、Priyanka Mudgal、Waleed Ammar、Xiquan Cui、Xu Chu、Alet Blanken 在预印本 [arXiv:2609.35692](https://arxiv.org/abs/2609.35692)（*Report: Progressive Disclosure of Agent Skills*，2026-09-28）里，把问题钉在 **skills 管理的两种 regime** 上：eager loading（全量披露）vs progressive disclosure（先披露 frontmatter，再按需 `load_skill`）。在受控技能检索任务上：库大小 \(N=100\) 时 eager **全部 crash**；progressive disclosure 在 Qwen3-14B、\(N=50\) 上相对 eager 最高省 **81.7%** token，并抬高平均检索成功率；代价是额外一轮选 skill 的调用，延迟略增（文中示例：Qwen3-8B、\(N=50\)，约 **15%**，从 1.75s 到 2.01s）。[1]

本篇是机制文：讲清 Agent Skills 开源标准长什么样、两种 regime 在 harness 里怎么跑、Table 1 的数字怎么读、以及论文留下的开放问题——尤其「哪些 skill 安全可进库」只谈治理与监测，不谈攻击步骤。把它接到站内 skills / harness / 成本主线上读，而不是当成又一篇「lazy loading 好」的短讯。

下午这条线补的是「任务开始前的上下文税」：不是环内空转，也不是路由选贵了，而是 **还没干活，说明书已经把窗口占满**。和上午谈的停止权、安全边界外移不同专题，但同属 harness 控制面——谁决定模型此刻该看见什么。

## 生产里的 Skills：能力补丁，不是又一份 system prompt

论文开篇的生产背景很具体：Workday 面向人力、财务与 agent 的企业云，服务超过 **65%** 的 Fortune 500；截至 **2026 年 8 月**，超过 **5,500** 家客户在用平台上的一个或多个 AI agent，环比上一季度增长约 **35%**。客户提功能、报缺陷时，一条常见的增强路径是：把领域流程、最佳实践、脚本、参考文档与模板，打成可复用的 **named procedures——也就是 skills**，写进 LLM 上下文，从而扩 agent 能力。[1]

这和「把整段方法论塞进一句 system prompt」不是一回事。Skills 是**有名字、有目录结构、可版本共享**的能力补丁；框架侧（文中举例 LangChain）已把它们当成一等公民。站内 [Agent Skills 入门](/cn/blog/agentskills-io-starter-guide/) 讲的是技能与工具怎么接到 agent；[Cloudflare security-audit-skill](/cn/blog/cloudflare-security-audit-skill-for-coding-agents/) 则是把一整套可验证审计流程做成可安装 Skill。Workday 这篇补的是下一层：**库变大之后，harness 该怎么披露这些补丁，才不至于先把自己撑爆。**

为什么「再写一条 skill」会变成默认解法？因为写 skill 的边际成本在下降：论文提到 coding agent（文中举例 Claude Code）可协助创建与修改；开发者也会把 skill 放进可版本控制的仓库复用（文中指向 [officialskills.sh](https://officialskills.sh/) 一类示例库）。[1] 一旦「写」变便宜，「装」却仍按 eager 全量做，库膨胀就会从产品胜利变成上下文税——这正是报告要量的张力。

企业场景里这个张力更硬：客户功能请求不是一次性的，而是持续进 backlog；每关一单缺陷就可能沉淀一条 skill。若没有披露策略，skills 库会像「永不删除的 runbook 全集」——对人类文档库尚且难搜，对每次调用都付 token 的 agent 更贵。Workday 报告的价值，不在于发明 lazy loading 这个词，而在于把 **生产技能库规模** 和 **可复现对照数字** 钉在同一张表上。[1]

## Agent Skills 开源标准：frontmatter 薄，body 厚

按 [agentskills.io](https://agentskills.io) 上的 Agent Skills 开源标准，库里每个 skill 至少是一个目录，核心文件是 **`SKILL.md`**：

1. **Frontmatter（YAML）**：至少含 `name` 与 `description`；也可含 license、compatibility、metadata 等可选字段。
2. **Body（Markdown）**：真正的操作内容——分步指令、输入输出例子、边界情况等。[1]

直觉上：frontmatter 是**目录卡片**（叫什么、什么时候用）；body 是**说明书正文**（怎么做）。Eager loading 把卡片和说明书一起塞进每次 prompt；progressive disclosure 先只塞卡片，等模型用结构化动作点名某个 skill，再把对应说明书装进去。

这个分层之所以重要，是因为它给 harness 留出了**可观测的中间态**：模型可以先在「只看见卡片」的条件下做选择，再在「看见说明书」的条件下执行。若没有 frontmatter / body 的切分，lazy-loading 就只能靠外部检索器猜一段文本片段——而论文选的是标准里已经存在的切分，实现成本更低，也更容易和社区 skill 仓库对齐。

对写 skill 的人，这也是一条作者约束：`description` 必须足够区分「何时该用我」，因为 progressive 第一跳往往只看这一行；写得像营销口号或与兄弟 skill 高度同义，第一跳就会变成硬 distractor。Body 则应假设「已经被点名」——少重复卡片信息，多写可执行步骤与边界。站内 [Agent Skills 入门](/cn/blog/agentskills-io-starter-guide/) 偏接线；这里偏**披露与写作如何互相约束**。

## Harness 里谁管 Skills

论文把最小 agent 拆成 **LLM 核心 + harness**。Harness 对接环境、决定何时调用 LLM、**管理 skills 库**、在调用前准备上下文与 prompt、并处理 LLM 输出。一个 agent 用多个 LLM 做不同子任务并不少见；skills 管理却常常仍是「整库灌进 prompt」的朴素默认。[1]

两种 regime 的对照，论文写得很直白：

**Eager loading（急切加载）**：harness 在调用 LLM 前，把库里全部 \(N\) 个 skill 的**完整定义**（至少整份 `SKILL.md`）写入上下文。模型「看见」一切，理论上可直接按正文执行；但 token 随 \(N\) 近似线性涨，干扰项（distractor skills）也一起进场，质量、可靠性与成本一起恶化。[1]

**Progressive disclosure（渐进披露 / lazy-loading）**：初始上下文只放全部 \(N\) 个 skill 的 **frontmatter**；再要求 LLM 发出结构化命令，标出当前任务最相关的 skill，例如：

```json
{"action":"load_skill","name":"pptx"}
```

Harness 收到后，把该 skill 的 **body** 装进后续调用的上下文。实现上会多一轮（或几轮）LLM 调用，但每次上下文里不必带着整库正文。[1]

站内叙事可以这样对齐：

- [扩张 Harness](/cn/blog/grow-the-harness-not-the-context/)：别把控制决策每次都塞回上下文——这里进一步说，**别把用不上的 skill 正文也塞回去**。
- [Harness 控成本](/cn/blog/control-the-harness-control-the-cost/)：账单常被归因于「模型贵」——skills 全量披露是另一个可测的上下文税源。
- [烧钱习惯](/cn/blog/coding-agents-cost-inefficient-behaviors/)：轨迹里有重复检索；skills 层则是**任务开始前就把无关说明书堆进 prompt**。
- [GEC / 项目级停止权](/cn/blog/llm-parkinsonism-gec-executive-control/)：管的是「该不该继续」；disclosure 管的是「开始前该看见多少」——两层别混成一句省 token。

## 一次任务在两种 regime 下怎么走

把论文机制压成两条时间线，方便对照验收。

**Eager 时间线**

1. Harness 读取 skills 库，把 \(N\) 份 `SKILL.md`（frontmatter + body）全部拼进 prompt。
2. 一次（或少量）LLM 调用：模型在「全库正文都在场」的条件下直接产出 `RESULT[...]`。
3. 若 \(N\) 很大，prompt 可能已超过窗口 → `crash`；即便没溢出，干扰 skill 的正文也会争夺注意力，抬高 `wrong_name`。[1]

**Progressive 时间线**

1. Harness 只拼 \(N\) 份 frontmatter（name + description）。
2. LLM 发出 `{"action":"load_skill","name":"..."}`。
3. Harness 装入该 skill 的 body，再调用 LLM。
4. 模型在「卡片全在、说明书只有一份」的条件下产出激活码结果。
5. 多出来的调用计入总 token 与总延迟；省下的是未被选中的 \(N-1\) 份 body。[1]

关键约束写在脚注里：progressive **需要额外调用**，但**减少上下文 token**；作者按 rollout 汇总所有调用，所以省 token 的结论已经扣过「多叫了一次」的账。[1]

实现时还有两个容易踩的坑。一是把 `load_skill` 做成「模型自由叙述我想加载 xxx」，却不强制结构化动作——harness 解析失败就会落到 `crash` 或静默 fallback 回 eager。二是装完 body 之后，仍把整库 frontmatter 无限追加、从不淘汰，长轨迹里卡片列表本身也会变成第二种上下文税。报告的受控任务较短，没有展开长会话淘汰策略；线上若多轮复用同一 agent，需要另设「本会话已装 body 的保留/驱逐」规则。[1]

## 实验怎么量「找对了 skill」

作者不直接评「业务任务做完没有」，而是做一个**显式技能检索任务**，专门测：在库变大、干扰变多时，agent 能不能把相关 skill 的正文真正装进上下文并读对。

做法要点：[1]

- 给每个 skill 的 body 塞一个随机生成的唯一 **activation code**（激活码）。
- 任务给出领域意图（如 travel），要求结构化返回：`RESULT[<skill-name>]: <activation-code>`。
- 只有相关 skill 的 body 已加载，模型才可能给出正确激活码——从而把「选对名字」和「正文真的在上下文里」绑在一起。

结果四分法（outcomes taxonomy）：

| 结果 | 含义 |
| --- | --- |
| `success` | skill 名与激活码都对 |
| `wrong_name` | skill 名错 |
| `wrong_code` | 名对，但激活码错 |
| `crash` | 上下文溢出或输出畸形 |

为什么要拆 `wrong_name` 与 `wrong_code`？因为失败机制不同：前者是**目录层选错卡**；后者是**说明书装对了却读错/没真正用上**。Crash 则是可靠性底线——窗口撑不住时，质量指标归零之前，系统已经不可用。[1]

库大小 \(N \in \{5, 20, 50, 100\}\)。核心任务基于 **5** 个相关 skill，共 **24** 个任务实例；\(N>5\) 时用干扰 skill 填满，干扰分三档难度（触发措辞直接程度不同），生成器覆盖 **12** 个领域族。每个任务 **3** 个种子；每个「\(N\) × regime」组合报 **72** 次 rollout 的均值。[1]

LLM 核心三档：Qwen2.5-7B-Instruct、Qwen3-8B、Qwen3-14B；greedy decoding；**32k** 上下文；Qwen3 跑非 thinking 模式。每个核心 **576** 次 rollout（\(4 \times 2 \times 24 \times 3\)）。服务：单卡 NVIDIA L40S（48 GB）上的 vLLM；每次调用记录 prompt/completion token 与墙钟延迟。[1]

干扰分档的工程含义也值得带走：即便更大的 Qwen3-14B，在 eager 下对 easy/medium 干扰更稳，仍怕 hard distractors——**换更大模型不能替代披露策略**。[1]

评测设计还有一个常被略过的点：作者用激活码把「正文是否真在上下文」变成可自动判分的信号。若你只在业务任务上 A/B eager vs progressive，成功可能来自模型常识或别的工具，而不是来自装对了 skill。复制这套探针（或等价的「正文里藏一个只有读到才知道的标记」）成本不高，却能避免把「任务碰巧做完」记成「检索策略胜利」。[1]

## Table 1：该盯的数字

下面数字全部来自论文 Table 1（任务均值，72 rollouts）；`crash` 表示上下文溢出。Token 降幅在 \(N \ge 20\) 时，单侧 Mann–Whitney U 检验 \(p < 10^{-25}\)。[1]

| LLM | N | EL tok | PD tok | Tok ↓ | EL succ | PD succ | EL crash | PD crash |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Qwen2.5-7B | 5 | 1648 | 1215 | 26.3% | 1.00 | 1.00 | 0.00 | 0.00 |
| | 20 | 6057 | 1943 | 67.9% | 0.17 | 1.00 | 0.00 | 0.00 |
| | 50 | 14871 | 3481 | 76.6% | 0.40 | 0.67 | 0.00 | 0.00 |
| | 100 | crash | 6223 | — | 0.00 | 1.00 | 1.00 | 0.00 |
| Qwen3-8B | 5 | 1652 | 1644 | 0.5% | 1.00 | 1.00 | 0.00 | 0.00 |
| | 20 | 6060 | 2519 | 58.4% | 0.68 | 0.38 | 0.00 | 0.00 |
| | 50 | 14876 | 4262 | 71.3% | 0.29 | 0.64 | 0.00 | 0.00 |
| | 100 | crash | 5184 | — | 0.00 | 0.79 | 1.00 | 0.00 |
| Qwen3-14B | 5 | 1652 | 973 | 41.1% | 1.00 | 1.00 | 0.00 | 0.00 |
| | 20 | 6061 | 1553 | 74.4% | 0.42 | 0.96 | 0.00 | 0.00 |
| | 50 | 14875 | 2719 | **81.7%** | 0.13 | 0.72 | 0.00 | 0.00 |
| | 100 | crash | 4661 | — | 0.00 | 1.00 | 1.00 | 0.00 |

读表时三条主结论，对应论文 Key Findings：[1]

### 1. 省 token，也稳住可靠性

Eager 下 skill 定义随 \(N\) 膨胀，最终打爆允许的 prompt 上限：三个核心在 \(N=100\) 时 **EL crash = 1.00**（全部溢出）。Progressive 同规模仍可跑完（PD crash = 0.00），且 Qwen2.5-7B / Qwen3-14B 在 \(N=100\) 上 PD succ 回到 **1.00**，Qwen3-8B 为 **0.79**。Token 节省随 \(N\) 变大更明显，文中峰值是 Qwen3-14B、\(N=50\) 的 **81.7%**（14875 → 2719）。按 token 计费时，这直接对应运营成本下降。[1]

再看 \(N=5\)：两边 succ 都是 1.00，token 差或大或小（Qwen3-8B 仅省 **0.5%**）。说明 **小库时 eager 未必有罪**；矛盾是在库增长曲线上爆发的。产品上若技能库会从十个涨到几十上百，披露策略就要在「还好用」阶段先埋好，而不是等第一次全员 crash 再改。

### 2. 延迟往往略升

Progressive 多一轮「选哪个 skill」的调用。示例：Qwen3-8B、\(N=50\)，整体延迟从 **1.75s** 提到 **2.01s**（约 **15%**）。脚注提醒：随 \(N\) 增大，相对差距可能收窄；任务更复杂时，额外调用也可能被后续子任务摊薄——甚至在更大 prompt 预算下结果可能翻转。工程上不要把它读成「永远慢 15%」，而要读成：**用可测的延迟换可测的 token 与可靠性**。[1]

若你的 SLA 以首 token / 端到端秒级为准，需要单独记账：progressive 的「慢」发生在选 skill 那一跳；eager 的「慢」可能藏在更长的 prefill 与更高的超时/重试率里——Table 1 的 crash 列已经暗示后者在 \(N=100\) 时不是慢，是直接不可用。

对成本会计也同理：按 token 计费时，eager 在中大库上的「贵」是确定性的；progressive 的「贵」主要是多一轮调用的固定开销。库越大，省下的 body token 越容易盖过那一轮固定开销——这正是 Table 1 里 Tok ↓ 随 \(N\) 升高的形状（例如 Qwen3-14B：\(N=5\) 省 41.1%，\(N=50\) 省 81.7%）。[1]

### 3. 平均检索质量更好，但不是每一格都赢

作者写得很克制：平均上 progressive 是赢家，但**并非每个设定都严格优于 eager**。Table 1 里最显眼的反例是 Qwen3-8B、\(N=20\)：EL succ **0.68** vs PD succ **0.38**——progressive 反而更差。其余多数格子 PD 持平或更好。Eager 侧随库增大掉得很快：Qwen3-14B 从 \(N=5\) 的 **1.00** 掉到 \(N=50\) 的 **0.13**（文中写约 0.125），主导失败是选错 skill 名。[1]

合起来的工程含义：**只优化 token 不够，还要盯 skill-retrieval quality**；regime 选择要按模型与 \(N\) 做对照实验，而不是口号式「一律 lazy」。论文也强调：技能管理 regime 不能只为 token，还要为检索质量设计——这和站内「开发者设计的高阶 Skills 比自合成更稳」的成本结论是同一条「别把默认当策略」的线。[1]

还有一层容易被忽略的读法：Figure 1 / Figure 2 在论文里把「质量随 \(N\) 掉」「token 随 \(N\) 涨」「\(N=100\) 溢出率」拆开画。Table 1 是汇总表；验收时也建议拆开报——否则「平均 succ 还行」会盖住「已经有一定比例 crash」或「某一档模型在中等 \(N\) 上 PD 反而更差」。对线上看板，至少要有四条曲线：EL/PD 的 token、succ、crash、端到端延迟，而不是只盯省了百分之几。[1]

## 开放问题：几个 skill、哪些文件、哪些算安全

论文末尾三个开放问题，值得写进 harness 设计清单，而不是当成附录装饰。[1]

**How many skills do we need？** 实验每任务只检索 **一个** skill；真实任务事先不知道要几个。技能定义写多细、任务复杂度多高，两者怎么平衡——仍是开放研究题，但后果是产品级的：一次 `load_skill` 不够时，要不要允许多 skill、如何预算多 body 的 token。若允许链式加载，还要防「越装越多」把 progressive 又拖回 eager 的 token 曲线。

**Which skill files do we need？** 实验每个 skill 只暴露 `SKILL.md`。真实目录里还有 scripts、references、assets——再全量灌进上下文，eager 会更早崩。需要策略决定「先装哪些文件」，以及如何评不同策略是否有效。实务上常见切分是：先 body 指令，脚本按工具调用再读，大参考文档走检索而不是整文件贴进 prompt——但这些都超出本报告的实测范围，只能当作待验证假设。

**Which skills are safe to include？** 库一共享，开发者可能把**隐藏在 skill 定义里的严重漏洞**一并引进库。问题是：纳入某个 skill 之后，如何**有效监测** agent 因此增加的风险暴露？[1]

第三条只谈治理与监测边界（与站内 [OpenShell / 硅级 Sentry](/cn/blog/nvidia-open-agent-safety-openshell-sentry/) 一类「边界外移」叙事同向）：skill 进库要有来源、版本、变更审计与行为监测；不要把「能装」当成「该装」。可与 [security-audit-skill](/cn/blog/cloudflare-security-audit-skill-for-coding-agents/) 的「可安装审计流程」对照——审计 skill 自己也是 skill，进库与运行同样需要披露与权限边界。本文**不**讨论任何利用路径或 PoC。

把三个开放问题收成一句产品话术：**progressive disclosure 解决的是「怎么披露」，没有自动解决「披露几个、披露哪些文件、允不允许进库」。** 若团队只上了 `load_skill`，却没有 body 数量上限、没有文件级策略、没有进库评审，库一涨仍会在别的维度复发——只是 crash 形态可能从「一次溢出」变成「链式加载把上下文慢慢堆满」。

## Harness 设计师清单

1. **把 skills 披露当成一等 harness 配置。** 默认 eager「省事」只在 \(N\) 很小、body 很短时成立；开工前先测 \(N=20/50/100\) 量级的 token 与 crash 率。
2. **Frontmatter 当目录，body 按需装。** 初始上下文只放 name+description；用 `load_skill`（或等价工具）装正文；多出来的调用必须计入账单与延迟。[1]
3. **用检索任务验收，而不只看业务成功率。** 激活码一类探针能分清 `wrong_name` / `wrong_code` / `crash`；否则「任务碰巧做完」会掩盖选错 skill。
4. **对照要按模型切。** Table 1 显示 Qwen3-8B 在 \(N=20\) 上 PD 检索更差——换模型或换 \(N\) 前先复测，不要照搬别人的默认。[1]
5. **延迟预算单独记账。** 接受「略慢换少 token、少 crash」；并在多子任务长轨迹上复测摊薄效应。[1]
6. **多 skill / 多文件策略写进路线图。** 实验外推：允许一次选多个 skill、或先装 `SKILL.md` 再按需装 scripts——都要有 token 预算与评测；并设「本任务最多装 K 个 body」的硬顶，避免 lazy 回潮。[1]
7. **进库治理：来源、版本、变更、监测。** 对应「哪些 skill 安全」；与安全审计 Skill、沙箱边界外移等工作接在同一控制面，而不是靠自觉。[1]
8. **与站内成本/停止权叙事联用。** 披露策略减的是**任务前的上下文税**；[烧钱习惯](/cn/blog/coding-agents-cost-inefficient-behaviors/) 管轨迹浪费；[GEC / 停止权](/cn/blog/llm-parkinsonism-gec-executive-control/) 管「该不该继续」——三层别混成一句「再省一点 token」。
9. **把 crash 当 P0，而不是质量曲线上的一个点。** \(N=100\) 时 eager 全员溢出，说明可靠性悬崖先于「succ 从 0.4 掉到 0.1」出现；监控要同时盯 overflow 与检索错误率。[1]
10. **小库别过度工程。** \(N=5\) 时两边都能满分；优先把工程预算花在「库还会涨」的路径上，而不是为五个 skill 上复杂检索栈。
11. **把 description 质量纳入 skill 评审。** Progressive 第一跳几乎只靠 name+description；卡片写糊了，后面 body 再精也进不了上下文。评审清单里除了「步骤能不能执行」，还要问「只看卡片会不会和兄弟 skill 撞车」。
12. **统计口径与论文对齐。** 报 token 时把选 skill 的额外调用算进去；报成功率时分开 succ / wrong_name / wrong_code / crash，避免把溢出藏进「失败」一锅粥。[1]

## 局限（照抄论文诚实处）

- 主数字来自**受控技能检索**，不是某条完整业务流水线的线上 A/B；任务故意要求读对 body 里的激活码。[1]
- 每任务单 skill；真实多 skill 组合未测。[1]
- 仅 `SKILL.md`；scripts/assets 未进基准。[1]
- 平均 PD 更好，但存在 PD 更差的格子（Qwen3-8B、\(N=20\)）。[1]
- 延迟示例是特定核心与 \(N\)；外推需自测。[1]
- Workday 生产规模（5500+ 客户 agent）是动机，不是本表数字的直接来源；Table 1 是受控实验。[1]
- 延迟脚注已提示外推风险：更大 prompt 预算或多子任务摊薄，可能改变「PD 更慢」的结论——线上要以自己的 SLA 复测。[1]

## 结语

Skills 把领域流程变成可安装补丁——这很好。坏消息是：补丁库一大，**eager 全量披露会先把 agent 自己压垮**（\(N=100\) 三模型全 crash），再把检索质量与 token 账单一起拖坏。Progressive disclosure 的压缩规则很短：

- 先披露目录卡片（frontmatter），再按需装说明书（body）；
- 用结构化 `load_skill` 把「选哪个」交回 harness 可观测；
- 用 token、succ、crash、延迟四件事一起验收，而不是只盯省了多少字。[1]

对 harness 设计师，这意味着 skills 管理不是「多写几份 Markdown」，而是**披露策略本身就是产品与成本架构的一部分**——和「扩张 harness、控路由、管停止权」落在同一张控制面地图上。库还会继续涨；先问清楚的不是「下一条 skill 写什么」，而是「下一次调用，到底该看见几份说明书」。

若用一句话交接给值班同学：小库可以先 eager；库过几十、准备上百时，把 frontmatter 目录 + `load_skill` 当成默认；用 Table 1 同款四指标验收；进库与多文件策略另开治理单——别指望「再换一个更强的模型」替你做披露决策。

回看站内主线：写 skill 降低的是「如何做」的重复发明成本；progressive disclosure 降低的是「不相关如何做」进入上下文的概率；路由与缓存谈的是按哪一档费率买 token；停止权谈的是何时不再买下一步。四件事叠在同一张账单上，却不该合成一句空话「再省一点」。Workday 这张表给出的，是 skills 披露这一层可以单独验收的标尺。[1]

## 参考来源

1. Zhang G, Zhao K, Mudgal P, Ammar W, Cui X, Chu X, Blanken A. *Report: Progressive Disclosure of Agent Skills*. arXiv:2609.35692, 2026-09-28. <https://arxiv.org/abs/2609.35692> · PDF <https://arxiv.org/pdf/2609.35692> · Agent Skills 标准 <https://agentskills.io>
2. 站内：[如何使用技能和工具构建 AI 代理](/cn/blog/agentskills-io-starter-guide/)
3. 站内：[Cloudflare security-audit-skill](/cn/blog/cloudflare-security-audit-skill-for-coding-agents/)
4. 站内：[Coding Agent 烧钱的三种习惯](/cn/blog/coding-agents-cost-inefficient-behaviors/)
5. 站内：[Control the Harness, Control the Cost](/cn/blog/control-the-harness-control-the-cost/)
6. 站内：[扩张 Harness，而不是堆上下文](/cn/blog/grow-the-harness-not-the-context/)
7. 站内：[LLM Parkinsonism 与项目级停止权](/cn/blog/llm-parkinsonism-gec-executive-control/)
