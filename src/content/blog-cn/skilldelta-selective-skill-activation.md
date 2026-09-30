---
title: "SkillDelta：技能相关，就一定该注入吗"
description: "解读北大/清华等 arXiv:2609.32274 SkillDelta：相关≠增量收益；用有/无技能配对历史做任务条件增益预测，15 设定相对随机激活平均 +4.3pp，补位 Progressive Disclosure 之后的「该不该注入」。"
pubDate: 2026-09-30T10:40:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "developer-tools", "Agent Skills"]
lang: "zh"
---

昨天谈 [Progressive Disclosure](/cn/blog/progressive-disclosure-agent-skills/)：技能库一大，eager 全量塞正文会先把窗口撑爆；先披露 frontmatter、按需 `load_skill`，能把「看见多少说明书」从上下文税里抠回来。那篇文章解决的是 **怎么装、装多少**。生产里下一道更常见的坑是：检索器已经捞到一个「看起来相关」的 skill，harness 就默认注入——**相关，不等于这次任务还会多赢一截。**

北京大学、清华大学、合肥工业大学与中关村学院的 Anjie Xu、Zhiyu Zhang、Ruiqing Ding、Fengli Xu、Leye Wang 在预印本 [arXiv:2609.32274](https://arxiv.org/abs/2609.32274)（*When Does a Skill Add Value? Task-Conditional Gain Prediction for Selective Skill Use*，2026-09-26）里，把问题钉成：**在 agent 动手之前，能否预测「注入该 skill」相对「不注入」的增量成功概率？** 他们提出 **SkillDelta**：用同一 agent、同一任务上有/无技能的配对执行历史，估任务条件增益 \(\tau\)，再用局部邻居把历史增益迁到新任务；阈值超过阈值才注入。五个基准 × 三个目标 agent（共 15 个设定）上，配对历史对观测增益的排序在 **12/15** 设定优于「只看带技能成功率」；在**匹配技能使用率**的前提下，相对随机激活平均绝对成功率提升 **4.3** 个百分点。代码在公开仓库 [TankTechnology/skilldelta](https://github.com/TankTechnology/skilldelta)，并附 DeepSeek Harness 插件草图。[1]

本篇接在 Progressive Disclosure 后面读：披露层管「别把无关说明书塞满窗口」；增益门管「相关说明书也别无脑灌」。站内 [扩张 Harness](/cn/blog/grow-the-harness-not-the-context/)、[Harness 控成本](/cn/blog/control-the-harness-control-the-cost/)、[烧钱习惯](/cn/blog/coding-agents-cost-inefficient-behaviors/)、[Agent Skills 入门](/cn/blog/agentskills-io-starter-guide/)、[Cloudflare security-audit-skill](/cn/blog/cloudflare-security-audit-skill-for-coding-agents/) 谈的是控制面、成本与接线；SkillDelta 补的是 **retrieve 之后、第一次模型步之前** 的那道门。

同窗还有 SkillApt（[arXiv:2609.26863](https://arxiv.org/abs/2609.26863)）一类 LOAD/ABSTAIN 控制器，也强调「检索」与「激活」拆开；本文不抢戏，只点出：SkillDelta 把增量收益 \(\tau=\mu_1-\mu_0\) 写清楚，并用配对银行做可追溯的局部预测，和「相关就开」的默认叙事对照更利落。[1]

## 80% 带技能成功，增益可以是 0，也可以是 40

论文把「技能有没有用」从「带技能跑成了没有」里拆出来。固定 agent 与评测协议，任务 \(t\) 在注入技能 \(s\) 时的成功概率记 \(\mu_1(t)\)，不注入时记 \(\mu_0(t)\)，**任务条件增益**是：

\[
\tau(t)=\mu_1(t)-\mu_0(t).
\]

直觉例子写在正文里：两个任务带技能成功率都是 **80%**。若无技能时一个本来就能 80%、另一个只有 40%，则增益分别是 **0** 与 **+40** 个百分点。只预测「带技能会不会成功」，会把这两个任务当成一类；真正该问的是：**相对不注入，多赢多少？**[1]

这和站内成本叙事对得上。技能注入不是免费的：多一段 workflow 正文、可能多几轮工具调用、token 与延迟一起涨；若 \(\tau\approx 0\) 甚至为负，你是在为「看起来专业」买单。工具调用是执行一次操作；skill 更像可复用的流程补丁——描述写得好，也可能夸大收益。SRA-Bench 一类工作已显示 agent 很难自己判断「此刻要不要 skill」；SkillDelta 的立场是：**别让模型口头自判替代可测的增量。**[1]

配对观测把 \(\tau\) 落到可存档的数：同一任务、同一 agent，分别在 use / skip 条件下跑（可重复），成功率差 \(\widehat{D}_i=\widehat{\mu}_1-\widehat{\mu}_0\)。单次配对时 \(\widehat{D}_i\in\{-1,0,1\}\)，记下帮到、没变、或伤到；重复执行压低执行噪声。配对匹配的是任务与条件，不要求两条轨迹逐步相同。[1]

下游策略很直白：预测 \(\widehat{\tau}(t)\)，与阈值 \(\eta\) 比；\(\eta=0\) 时只要预测增益为正就注入。对照基线是 Always-off、Always-on，以及「同期望使用率下的随机激活」——后者用来回答：你是不是只是用得更勤，还是真的把 skill 分给了更该用的任务。[1]

## 方法：配对历史银行 + 同族局部预测

SkillDelta 不重新训练 agent。历史银行存：任务描述、skill / family 身份、固定的问题向量、配对结果。来新任务与候选 skill 时：

1. **划支持集**：只看同 skill 或同 family 的历史（「family」在实验里对应所记录的任务组：供应技能族、BigCodeBench 焦点组、SpreadsheetBench 任务类型等）。
2. **找邻居**：只用问题文本的 embedding（主实验是 text-embedding-3-small，1536 维，L2 归一化后余弦），在支持集里取最多 \(k=6\) 个最近邻。
3. **加权平均符号增益**：非负余弦权重（负的裁成 0；全 0 则均匀），得到 \(\widehat{\tau}\)。
4. **决策**：\(\widehat{\tau}>\eta\)（主表 \(\eta=0\)）则注入，否则跳过；无合格支持则分数记 0 并 skip。[1]

零增益邻居**不会被扔掉**：权重仍在，会把预测往 0 拉——这很重要，否则银行里大量「带不带都一样」的证据会 silently 消失，预测容易偏乐观。有帮助和有伤害的邻居一起进加权和，估计才是有符号的增益，而不是「带技能时好像挺能打」。[1]

和「只平均邻居带技能成功率」的对照（with-skill-only）比：后者看不见 \(\mu_0\)，会把「本来就会」和「技能救回来的」混在一起。论文报告：配对证据在 15 个设定里对观测增益符号的 AUROC，相对无结果相关门与 with-skill-only，各有 **12** 个设定更好，两者都赢的有 **10** 个。ToolQA、MedCalc-Bench 更稳；BigCodeBench 上无结果的词法相关分数反而常排得更好——后面局限一节会回到「表示是否对齐增益几何」。[1]

**自判几乎等于 Always-on。** 把问题与同一份 skill 文本丢给目标 agent，让它二选一 use/no-use：15 个面板里有 **14** 个面板使用率超过 **91%**（DeepSeek-V4-Flash 在 SpreadsheetBench 上是例外，约 44.4%）。策略贴近 Always-on，对增益符号几乎没分辨力；SkillDelta 的连续分数在全部 15 个面板上 AUROC 都高于二值自判。自判还多付一轮路由 token，相对 Always-on 总 token 可增 **2.6%–98.2%**。[1]

## 理论直觉：覆盖、表示残差、执行噪声

不必把附录公式整页搬过来。概览一句：若相近任务的真实增益也相近（带一个表示残差 \(\varepsilon_\phi\)），则局部加权估计的误差大致拆成三块——

- **覆盖（coverage）**：邻居离目标有多远；银行里有没有够近的同类任务。
- **表示残差（representation mismatch）**：embedding 距离解释不了的增益差——话题像，但「要不要计算器」其实不同。
- **执行噪声**：有限次配对执行带来的方差；多重复可压，覆盖与表示不变。[1]

这三块对应不同扩证据手段：扩银行 → 更可能有近邻；加 \(k\) → 降噪但可能掺进效应不同的任务；加重复 → 在固定邻居上把 \(\widehat{D}\) 估准。RQ3 的扫描也大致符合：重复执行在多个面板上稳定降 MAE；支持池与邻域大小的收益因基准而异。[1]

医学量同一话题、一个问定义、一个问单位换算——计算器 skill 可能只帮后者。若表示只看见「医学+计算器」，增益预测就会糊；SkillDelta 把这件事写成显式假设，而不是假装相关检索等于因果增益。[1]


## 为什么「相关就注入」在账面上好看、在增量上难看

生产里最容易出现的仪表盘是：带技能成功率、检索命中率、skill 使用次数。三件事都可以涨，却仍然对 \(\tau\) 失明。带技能成功率高，可能只是任务本来简单；命中率高，只说明描述与查询接近；使用次数高，可能是默认 Always-on。SkillDelta 强迫你多看一列：**不注入时的成功率**。没有这一列，就无法区分「技能在干活」和「技能在围观」。[1]

再往下拆一层失败模式：

- **冗余**：agent 已会，skill 只是复述——\(\tau\approx 0\)，仍付上下文税。
- **干扰**：流程与模型内策略冲突，或挤掉更有用的上下文——\(\tau\) 可为负。
- **描述夸大**：frontmatter / README 写着「适用于 X」，评测却显示只在 X 的子集上有增益。
- **自判恭维**：模型看着 skill 文本，倾向于说「该用」——论文里自判使用率常 >91%，几乎不提供筛选。[1]

Progressive Disclosure 减少的是「无关说明书进窗口」；SkillDelta 减少的是「相关但零增益（或负增益）说明书进窗口」。两层漏斗叠起来，才接近站内说的「扩张 harness、别堆上下文」：控制决策写在 harness 代码与银行策略里，而不是每次再让模型口头表态。[1]

把这件事接到 [烧钱习惯](/cn/blog/coding-agents-cost-inefficient-behaviors/)：轨迹里的重复检索是环内浪费；技能层的浪费常常发生在环外——任务还没开始，门已经开错。接到 [Harness 控成本](/cn/blog/control-the-harness-control-the-cost/)：路由选模型档位；增益门选「要不要付这一段 skill 的上下文价」。接到 [Agent Skills 入门](/cn/blog/agentskills-io-starter-guide/) 与 [Cloudflare security-audit-skill](/cn/blog/cloudflare-security-audit-skill-for-coding-agents/)：接线与可安装 skill 解决「有没有补丁」；SkillDelta 解决「这次补丁值不值得打」。[1]

## 实验：五基准 × 三 agent

评测库存（Table 1）：ToolQA 1430 任务 / 14 skills；MedCalc-Bench 1100 / 55；BigCodeBench 1136 / 139；LogicBench 760 / 19；SpreadsheetBench 399 / 1（外部 skill，非 SRA-Bench 语料）。目标栈固定为 **Qwen-Turbo、GLM-5.3-Flash、DeepSeek-V4-Flash**；温度 0、产物冻结、基准自带评测器。主协议 leave-one-task-out：目标任务两侧结果都不得进入自己的支持集。[1]

技能条件因基准而异：ToolQA / LogicBench 用供应 skill；MedCalc 用计算器 skill；BigCodeBench 注入全部 gold skills；SpreadsheetBench 用外部优化过的表格 skill。Qwen / GLM 主结果多数任务单次配对（LogicBench 三次均值）；DeepSeek 五基准皆三次均值。结果从不跨栈混池。[1]

主表统一规则：同族、余弦加权、\(k=6\)、\(\eta=0\)。零阈值点上，SkillDelta 相对 Always-off 提高观测成功、相对 Always-on 省执行 token，15 个面板全覆盖；14 个成功增益的 bootstrap 区间不含 0（Qwen SpreadsheetBench 区间含 0，需单独读）。15 面板等权均值：成功率约 **63.12%** vs Always-on **64.04%**，平均省 token 约 **20.8%**（范围约 3.0%–49.4%）；12/15 面板成功率低于 Always-on——这是**用一点成功换执行成本**的操作点，不是「全面碾压 Always-on」。[1]


## 读主表时盯什么

Table 2 把 Off / On / Self-judge / SkillDelta 的成功率与相对 Always-on 的 token 节省摆在一起。读的时候建议固定三问：

1. **相对 Off，SkillDelta 是否抬成功？** 论文称 15 面板皆抬；多数 bootstrap 区间不含 0。
2. **相对 On，省了多少执行 token？付了多少成功差？** 等权均值大约是成功低约 0.9pp、token 省约 20.8%。这是操作点选择，不是评测作弊。
3. **Self-judge 是否在「接近 On 的成功」上额外烧路由？** 多数面板使用率极高，token 相对 On 往往是负数（更贵），而不是更省。[1]

举例（数字来自 Table 2，便于对照原文，不替代读表）：Qwen-Turbo ToolQA 上 Off 28.6%、On 44.7%、SkillDelta 44.5%，相对 On 省约 10.4% token；同栈 BigCodeBench 上 SkillDelta 成功 47.4% 低于 On 的 51.4%，但相对 On 省约 49.4% token——增益门在这里更偏「控成本」。GLM MedCalc 上 SkillDelta 成功 88.3% 甚至高于 On 的 83.3%，并省约 41.1% token——说明选择性注入有时能躲开伤害性注入，而不是只会砍成功。[1]

匹配使用率下的 +4.3pp 回答的是另一个问题：**同样多的注入次数，会不会分得更聪明？** 随机激活把次数撒匀；SkillDelta 把次数推向高增益组。若你的产品 KPI 是「技能使用率必须达到 X%」（合规或商业叙事），匹配率对照比「和 Always-on 比成功」更诚实——因为 Always-on 的使用率是 100%，对照不公平。[1]

## 证据怎么扩才有效（RQ3）

论文用增益 MAE 扫支持池大小 \(n\)、邻域 \(k\)、重复次数 \(r\)。带走三条工程直觉即可：

- **扩银行**不等于单调变好：ToolQA / MedCalc 上同族池变大常有帮助；LogicBench 上不一定单调。多出来的候选必须真能改善选中的邻域，并保持增益结构。
- **\(k\) 有折中**：邻居太少噪声大，太多则掺进效应不同的任务。ToolQA 偏中等邻域；别的基准对 agent 敏感。
- **重复最「干净」**：固定邻域时，加重复在所报面板上稳定降 MAE，符合噪声项随 \(r^{-1/2}\) 降的直觉——覆盖与表示不变，只是把历史 \(\widehat{D}\) 估准。[1]

对值班同学：缺预算时，优先把**高频任务族**做成多次配对，而不是一口气把冷门题也跑满 Always-on vs Always-off。银行的 ROI 来自复用；冷门长尾可以先走保守阈值（更难注入）或 Abstain。

## 结果：+4.3pp 从哪来

匹配期望技能使用率后，SkillDelta 相对随机激活在 **全部 15** 个设定上更高，平均绝对增益 **4.3** 个百分点（文中分解合计约 4.33）。把优势拆开：

- **组间分配（between-group allocation）** ≈ **3.72** pp：同样多的「注入次数」，更多分给平均观测增益更高的任务组。
- **组内选择（within-group selection）** ≈ **0.61** pp：在组内再挑哪些任务该开。[1]

工程含义很实在：**即便组内排不准，先把预算分给「这类任务更吃 skill」的组，就已经值回票价。** 组内额外价值在 ToolQA 上最清楚（三 agent 均值约 4.41%，区间不含 0）；别处多数组内区间含 0；Qwen-Turbo BigCodeBench 组内甚至出现负向区间。BigCodeBench 组稀疏、技能包异构，局部证据本来就薄——别把「全局 +4.3」误读成「每个基准都能精细到单题」。[1]

排序故事与决策故事要分开读：配对历史多数时候更会排增益符号；但 BigCodeBench 上词法门有时排得更好，且自然分布偏移面板上「相对 Always-off 仍涨成功」与「任务级排序掉到机会水平」可以同时发生。线上验收别只盯 AUROC，也要盯匹配使用率下的成功差与 token。[1]

## 部署草图：DeepSeek Harness 插件

论文附带 DeepSeek Harness 插件：在**第一次模型步之前**对候选 skill 打分；插件路径用均匀邻域平均（与主实验余弦加权略有简化），预测增益过阈值才注入。银行可追到检索到的记录与权重；新记录可追加，不必重训参数。公开仓库含核心预测器、评测工具、数据采集与该插件；公开释放以代码为主，任务级结果与复现脚本在审阅补充包。[1]

对接站内 harness 叙事时，落点很具体：progressive disclosure 决定「装哪份 body」；SkillDelta 决定「这份 body 此刻要不要进上下文」。两者可以串：先 narrow 候选，再 gain-gate。别做成「模型再写一段我觉得该不该用」——那又回到自判的 Always-on 附近，还多烧一轮。[1]


## 和 Progressive Disclosure 怎么串

一条可落地的流水线：

1. **目录层**：只披露 frontmatter（或检索 top-\(m\) 卡片），避免整库 body。
2. **候选层**：结构化 `load_skill` 或检索器给出 1–少量候选 skill。
3. **增益门**：SkillDelta（或同构的配对增益估计）在**第一次真正执行步之前**决定注入与否。
4. **执行与回写**：跑完后把 use/skip 结果（哪怕线上只能偶然做对照实验）写回银行；离线评估集继续补配对。[1]

第 3 步不要用「再问模型一句」糊弄过去。论文已经量过：自判贵且偏开。增益门应是 harness 代码路径——读 embedding、查银行、加权、比阈值——和站内「扩张 harness」一致：反复出现的控制决策长成代码。[1]

若暂时没有配对银行？诚实默认不是 Always-on，而是：**高成本 skill 默认 skip 或高阈值；仅对已有离线评测显示正增益的 family 开低阈值。** 同时开一条采集管道：抽样任务强制跑 skip 臂，哪怕采样率很低，也比纯自判强。SkillApt 同窗强调的 LOAD/ABSTAIN 与环境有效性，可以叠在增益门外侧：增益为正但工具契约不满足，仍应 ABSTAIN。[1]

## 局限：银行贵、漂移、BigCodeBench、表示

作者自己把边界写清楚，值得原样带走：

1. **银行采集成本**：从零做配对执行是投资；报告的省 token 不含建银行、编码与检索。适合** agent 与技能条件相对稳定、任务会重复到达**的场景；换模型或改 skill 正文，证据要复核。[1]
2. **Agent / skill 漂移**：历史 \(\widehat{D}\) 绑在特定栈上；跨栈不得混用主结果，线上也不该把旧银行当永恒真理。
3. **BigCodeBench 排序弱**：稀疏组、异构 bundle、表示与增益几何可能不对齐；TF–IDF 在部分 Qwen 面板上 AUROC 更高（BigCodeBench 从约 0.527 到 0.582）。语义相似 ≠ 增益相似。[1]
4. **表示选择是产品决策**：主实验统一 embedding-3-small 是为了可比，不是声称它最优；换表示、换 family 定义，门的行为会变。

同窗 SkillApt 等强调 LOAD/ABSTAIN 与环境有效性；SkillDelta 强调可迁移的 \(\tau\) 估计与匹配使用率下的分配价值。落地时可以把「增益门」和「可执行性门」叠在一起——本文不展开攻击面，只提醒：安全相关指令另做评估，别只用成功率和 token 当唯一 KPI。[1]



## 和「只优化 skill 正文」有什么不同

社区常见反应是：增益不够，就再改一版 SKILL.md。SkillDelta 不反对改正文，但指出另一条杠杆：**同一份 skill，对不同任务的增量收益异质**——有的任务该开，有的该关。只改正文、不改门，等于假设「平均更好」会均匀洒到每个任务；论文的组间/组内分解说明，预算分配本身就能贡献大部分匹配率优势。[1]

这也解释为什么 BigCodeBench 上排序会弱：技能以 bundle 注入、组又稀疏时，「改一篇正文」和「在组内挑任务」都更难；此时更现实的产品动作可能是：**按 family 设不同默认阈值**，或先保证组间分配正确，而不是追求单题神准。ToolQA 类「单 skill、组内样本够」的场景，才更吃组内选择。[1]

对维护 Agent Skills 开源标准风格仓库的人：版本发布除了改 body，还应附带（或链接）**离线配对评测摘要**——至少标出哪些 family 上观测增益为正。没有摘要的 skill 升级，线上增益门只能保守对待。把摘要写进 harness 可读的元数据，比写进营销式 README 更有用。[1]

## 数字之外：给产品经理的三句人话

第一句：**命中率不是 ROI。** 检索器说相关，只说明描述对齐；ROI 要看相对不注入多赢多少、多付多少 token。

第二句：**使用率 KPI 会逼出 Always-on。** 若考核「技能调用次数」，团队会关掉门；改成「匹配使用率下的成功差」或「单位注入带来的成功增量」，门才站得住。

第三句：**银行是资产，不是一次性实验。** 配对日志跨任务复用，才摊薄采集成本；agent 升级要当「资产减值」事件处理——重跑关键 family，而不是假装旧增益估计仍准。

这三句和站内 harness 主线一致：控制面要可观测、可验收、可版本化。Progressive Disclosure 验收的是 crash / token / succ；SkillDelta 验收的是匹配率下的成功差与执行 token。两张表可以并排挂在同一块值班看板。[1]

再补一条给写 skill 的作者：`description` 既服务 Progressive Disclosure 的第一跳选卡，也服务增益银行的 family 划界。写得空泛，检索与增益迁移会一起糊；写得过窄，银行覆盖变差。作者约束与 harness 门是同一张地图上的两侧。[1]

## Harness 清单：retrieve ≠ activate

给值班同学可勾的几条：

1. **检索命中 ≠ 自动注入。** 相关是候选资格；注入看预测增量 \(\tau\)。
2. **留配对日志。** 同一任务（或可归一组的任务）在 use/skip 下的成功与 token，比「带技能成功率仪表盘」更能训练门。
3. **门放在第一次模型步之前。** 自判当路由，贵且偏 Always-on。
4. **先验收组间分配，再追求组内神射。** +4.3 里大头是把使用次数分给更吃 skill 的组。
5. **银行与栈绑定；改 agent / skill 就复查。** 省下来的执行 token 别拿去掩盖建库与漂移成本。
6. **和 Progressive Disclosure 串，不要互相替代。** 披露管窗口税；增益门管「相关是否值得付税」。[1]

回看主线：[扩张 Harness](/cn/blog/grow-the-harness-not-the-context/) 说别把控制决策每次塞回上下文；[控成本](/cn/blog/control-the-harness-control-the-cost/) 说路由与治理；[烧钱习惯](/cn/blog/coding-agents-cost-inefficient-behaviors/) 说轨迹里的重复劳动；Progressive Disclosure 说任务开始前别灌整库说明书。SkillDelta 补一句：**说明书相关，也要问一句——这次注入，相对不注入，到底多赢多少？** 配对历史给的不是又一句 prompt 口号，而是可追加、可追溯、可设阈值的控制面零件。[1]

若用一句话交接：progressive 解决「怎么装才不爆窗口」；SkillDelta 解决「装之前该不该装」。默认从「相关就开」改成「配对增益过门再开」；用匹配使用率下相对随机的成功差做验收，而不是只看 Always-on 旁的自欺数字。

## 参考来源

1. Xu A, Zhang Z, Ding R, Xu F, Wang L. *When Does a Skill Add Value? Task-Conditional Gain Prediction for Selective Skill Use*. arXiv:2609.32274, 2026-09-26. <https://arxiv.org/abs/2609.32274> · PDF <https://arxiv.org/pdf/2609.32274> · Code <https://github.com/TankTechnology/skilldelta>
2. 同窗对照：SkillApt — *Learning When to Activate Agent Skills from Counterfactual Evidence*. arXiv:2609.26863. <https://arxiv.org/abs/2609.26863>
3. 站内：[Progressive Disclosure：技能库一大，Agent 就先崩了吗](/cn/blog/progressive-disclosure-agent-skills/)
4. 站内：[如何使用技能和工具构建 AI 代理](/cn/blog/agentskills-io-starter-guide/)
5. 站内：[Cloudflare security-audit-skill](/cn/blog/cloudflare-security-audit-skill-for-coding-agents/)
6. 站内：[Coding Agent 烧钱的三种习惯](/cn/blog/coding-agents-cost-inefficient-behaviors/)
7. 站内：[Control the Harness, Control the Cost](/cn/blog/control-the-harness-control-the-cost/)
8. 站内：[扩张 Harness，而不是堆上下文](/cn/blog/grow-the-harness-not-the-context/)
