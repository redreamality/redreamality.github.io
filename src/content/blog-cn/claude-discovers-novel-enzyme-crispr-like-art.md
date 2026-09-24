---
title: "Claude「发现」类 CRISPR 酶系统：怎么读这次科学营销，而不是跟着口号兴奋"
description: "Anthropic 称 Claude 在高层次指导下发现 ART（array-associated reverse transcriptases）。本文分层核对官网与技术报告：搜索发现 vs 功能未明、可复现边界、研究 agent 流水线，以及工程师该怎么读这类新闻。"
pubDate: 2026-09-24T10:45:00+08:00
author: "Remy"
tags: ["anthropic", "claude", "ai-agents", "agent-harness", "biology", "research", "CRISPR"]
lang: "zh"
---

Anthropic 在 2026-09-23 发了一篇标题很冲的新闻：[Claude discovers a novel enzyme system with CRISPR-like repeats](https://www.anthropic.com/news/claude-discovers-novel-enzyme-system)。[1] HN 当天冲到约 **526** 分、约 **550** 条评论。[2] 标题里同时塞进三个高热词：Claude、发现、CRISPR。如果你做 agent 系统，这篇文章几乎一定会刷到你的时间线；如果你不写生物，也很容易被「模型发现了科学」四个字带跑。

站内已经写过编码侧的 harness——比如 [Claude Code Agent Harness](/cn/blog/inside-claude-code-agent-harness/) 和 [Open Code Review 的确定性流水线](/cn/blog/alibaba-open-code-review-deterministic-pipeline/)。那些文关心的是：循环外有没有状态、边界、可恢复性。本篇换一个切口：**当同一套「多 agent + harness」叙事接到基因组挖掘时，官方到底声称了什么、什么还没证实、工程师该怎么读营销口径。**

一句话先钉住边界：这不是 CRISPR 入门，也不是实验操作菜谱。功能尚不清楚；湿实验仍由人做；可复现的是「计算侧 anomaly hunting 流水线」，不是「换个 prompt 就出下一个基因编辑工具」。

## 官方声称了什么：先拆成两层

新闻稿最容易被误读的地方，是把「发现了一个值得跟进的基因组排布」写成「做出了下一个 CRISPR」。Anthropic 自己的正文其实分层更清楚，只是标题和传播层会压扁这层差异。[1]

**第一层：搜索与模式识别（他们主张已发生）。**  
在科学家给出的高层次方向下，Claude agents 在大规模 DNA/蛋白序列数据里搜 reverse transcriptase（RT，逆转录酶），并注意到一组先前未作为系统描述的特征：某个 jumbo phage（巨型噬菌体）相关 RT 旁边，存在非编码 DNA 的重复阵列，以及一个功能未知的 accessory protein（伴侣蛋白）。他们把这套东西命名为 **array-associated reverse transcriptases（ART）**。[1]

关键限定来自官网自己写的句子：底层那个 RT **先前已被识别**；Claude **似乎首次注意到**的，是伴随的非编码重复阵列与未知功能的伴侣蛋白。[1] HN 上有人把这话翻译得更冷静：「在已知 RT 周围发现了先前未描述的基因组排布。」[2] 这不是抬杠，而是把「发现」钉回可核证的对象——**排布与共现**，不是已经兑现的可编程基因编辑能力。

**第二层：功能与工具化（他们明确说还不知道）。**  
新闻稿写得很直白：*Although we don’t yet know its function*。他们强调的是：这类「RT + 伴侣 + 可编程感的核酸元件」在历史上只在少数系统里一起出现，而那少数系统往往后来被做成切割、拷贝、粘贴 DNA 的工具；因此 ART「值得继续查」。这是**假设生成与优先级排序**，不是已经完成的机制解析。[1]

Feng Zhang（CRISPR 基因组编辑领域的重要人物之一，MIT / Broad）在看过预印本后的评论，官方原文可引用如下：

> This is an exciting example of how AI agents can contribute to biological discovery. The identification of RNA-repeat arrays associated with reverse transcriptases is genuinely intriguing and merits further investigation. I hope this work encourages more scientists to explore how AI can support their research.[1]

注意他夸的是什么：AI agents **可以贡献于**生物发现；RNA–repeat arrays 与 RT 的关联**真正有意思**、**值得进一步研究**。他没有替 Anthropic 说「这已经是新一代编辑器」。读官方营销时，把「pioneer 背书」和「功能已证实」拆开，会省掉很多噪音。

## 实验室与安全边界：谁在动手，谁在读序列

Anthropic 同时宣布新建 life sciences 研究组，并在 Bay Area 建了分子生物实验室。这对做 agent 产品的人同样重要——它解释了「发现」叙事为什么能接到新闻稿：他们不只是在云上跑 agents，还把人类湿实验接到了同一条组织链路里。[1]

几个必须保留的限定：

1. **实验室按较低生物安全等级运作（BSL-1 / BSL-2）**，并且**不经手可感染人的病原**。[1]
2. **所有实验室操作由人类科学家完成。** 他们试过用 AI 加速部分实验流程（文中提到 Model Hardware Standard 一类探索），但认为那套思路不太适合分子生物学里大量临时、即兴的 workflow。[1]
3. 计算侧用的是 **Claude Science / Claude Code**，外加**自研的并行 harness**，用来协调大量并行 Claude 会话。[1]

这三句话合在一起，定义了研究 agent 的现实边界：模型可以大规模读序列、写报告、开 follow-up task；**把蛋白表达出来、做生化与结构表征、承担 biosafety 责任的，仍然是人**。把「Claude discovered」读成「机器人在培养皿里发现了酶」，是传播层常见的偷换。

## 规模数字：官网口径与技术报告要对齐读

官网给了一组好记的量级：大约 **950** 个 agents、**21** 小时、**2.1 亿** tokens；搜集 **20 万+** RTs → 约 **3500** 个候选系统 → **20** 份最值得分析的报告。[1]

技术报告（预印本 / technical report）把同一场 campaign 写得更细，数字也更「会计」：[3]

- 扫描范围写到约 **19 亿** protein clusters；
- 回收约 **20 万** RT clusters，邻域普查评到约 **3564** 个反复出现的蛋白家族；
- 全场约 **119** 个 tasks、**949** 次 agent sessions；
- **77** agent-hours、约 **2.156 亿** tokens、墙钟约 **21.5** 小时；
- 最终交付 **19** 份报告（对候选家族与新 RT lineage 的拆分与官网「约 20」同量级）。

两边并不矛盾：官网是传播层圆整；报告是流水线账本。写二次传播时，**不要把「950 agents」理解成 950 个独立科学家人格**——报告里的角色更像 worker / supervisor / curator / editor 的会话编排，共享一份记录，任务队列耗尽后把报告交给人类审阅。[3]

对做 agent 系统的人，这组数字真正有用的不是「token 很大」，而是**漏斗形状**：

1. 广搜（十几万到二十万量级的 RT）；
2. 邻域与共现打分（三千多候选）；
3. 深度下钻与互相否决（绝大多数出局）；
4. 少数报告进人类审阅与湿实验。

官网也承认：Claude 产假设极快，于是「假设本身」成了研究对象——一次 campaign 可能冒出成百上千份候选报告，他们在问：哪些特征让人愿意拿去测，哪些该丢掉；学到的东西会回写进给 Claude 的指令，用来模仿科学家的口味。[1] 这和写编码 agent 时「先扩大召回、再做残酷过滤」是同一类工程问题，只是对象从 PR diff 换成了基因组邻域。

## ART 是什么：RT + partner + array，而不是「新 Cas9」

把名字拆开，比盯着 CRISPR 三个字母更清楚。

技术报告与官网一致的核心描述是：ART 主要出现在噬菌体相关序列里，典型由三部分组成——**RT**、旁边的 **partner gene**、以及一长串间距相对均匀的 **DNA repeat array**。[1][3] 阵列形貌让人联想到 CRISPR array（后者存着让系统「可编程」的 RNA 序列库）。Anthropic 的早期实验显示：ART array 也会被表达成一组不同的短 RNA，因此他们提出「也许存在某种类似的可编程逻辑」——注意主语是「suggesting」，不是「已证明可编辑人类基因组」。[1]

报告里还有几处对「怎么像、怎么不像 CRISPR」有用的细节（技术细节以预印本 / 技术报告为准）：[3]

- 在他们鉴定到的相关 RT clusters 中，一部分携带可检测的上游 repeat array；阵列长度、拷贝数、repeat 长度与 spacer 长度有统计范围，且**附近没有 cas 基因**——这支持「这是另一类非编码重复元件」，而不是把 ART 直接归进 CRISPR-Cas。
- Agent 自己也会做「novelty kill-test」：看见 repeat+spacer 贴在 RT 上游时，会怀疑是不是已知的 retron / DRT9 / 其他已报道结构，再去做定量刻画与文献检索；通过后再交人类审阅。
- 湿实验侧，他们利用已发表的噬菌体感染时间序列 RNA 数据，以及在大肠杆菌里表达 SA1 ART 系统后做 small-RNA sequencing，观察到阵列来源的离散短 RNA。这加强了「阵列是真在干活的转录单元」这一层，**仍然不等于功能机制已经闭合**。

所以，比较稳妥的中文表述可以是：

> Claude 在已知 / 可检索的 RT 周围，标出了一套先前未作为独立系统描述的「RT + 伴侣蛋白 + 重复阵列」排布；阵列会被转录成短 RNA；系统的主功能与是否可工具化，仍在进行中。

如果你在二次传播里写成「AI 发现了新的基因编辑神器」，你放大的是标题，不是证据。

## 工作流长什么样：研究 brief → 多角色 harness → 人类审阅

对 builder 更值钱的，往往不是 ART 三个字母，而是他们把「基因组挖掘」拆成可编排任务的方式。

技术报告描述的 harness 大致是这样：[3]

1. 先有一份 **research brief**（研究简报），把目标写成可执行的大阶段；
2. 每个阶段拆成更小的 task（例如构建 HMM profile、搜同源、做邻域普查）；
3. 每个 task 上，一个 Claude Code agent 当 **worker** 提计划并执行，另一个当 **supervisor** 审计划与结果；
4. supervisor 可以根据观察**新开 follow-up tasks**，让 campaign 随着发现自我扩展；
5. 计划、结果、审阅写入共享记录；另有 curator / editor 一类角色维护知识库与报告；
6. 任务队列耗尽后，交付人类可读报告；人类决定测什么。

官网对日常工作模式的描述也同频：Claude 先读文献、用公开数据复现已有结果以自检方法；再搜「对不上任何已描述系统」的家族成员或基因组邻居；给每个候选写短报告；后续分析里大多数候选会被淘汰；活下来的才进实验室，由人表达蛋白并做生化 / 结构表征，Claude 再帮着解释数据。[1]

这里有两个容易被新闻稿省略、但对工程很关键的点：

**第一，高层次方向不等于零知识。**  
brief 指定了「围着 RT、按新的 partner 关联找新系统」这类目标。Agent 不是在「生命是什么」这种开放宇宙里裸奔；它是在一个被缩小过的搜索空间里做 anomaly hunting。HN 上也有人点出：相对数学里的「硬证明」叙事，生物这边他们把问题收得很窄，找到 RT 邻域里的异常本身就是可做的计算题。[2]

**第二，否决能力是产品，不是边角料。**  
报告写明：在候选 partner 家族里，绝大多数后来被判成注释伪影、已知系统碎片、或只是邻域常客，真正保留的新关联很少；另有一些「奇怪特征」被跟进后才长成新 lineage 报告。[3] 没有残酷过滤，950 个 sessions 只会制造不可审阅的报告洪水。这和站内讨论确定性工程管「不能错的步骤」是同一气压：模型负责活的推理，流水线负责不让垃圾假设淹没人类带宽。

## 可复现性：你到底能复现哪一段？

「模型发现科学」叙事最该被追问的，不是 celebratory quote，而是**复现边界**。

可以按四段来拆：

1. **数据与工具链是否公开可对齐？**  
   大规模 metagenomic 蛋白 clusters、私有检索设施、内部 knowledge base、以及「Mythos 5」这类报告中出现的模型版本，外人不一定能原样对齐。[3] 你能复现的往往是方法学骨架：brief → worker/supervisor → 共享记忆 → 报告锦标赛式排序；不一定能复现「同一条 contig 上的同一声 exclamation」。

2. **计算侧异常检测能否独立复核？**  
   技术报告给了 session transcript 片段：agent 在读到某条 flank 时，用肉眼式模式识别喊出 tandem repeat array，并自己怀疑是不是已知结构，再写脚本数 repeat、比文献。[1][3] 这类「轨迹可审计」比一句「AI found it」值钱。但审计轨迹 ≠ 任何人用任意模型一键复现。

3. **湿实验验证归谁？**  
   官方反复强调 lab work 由人做。[1] 因此，即便计算侧完全开源，**功能结论仍然卡在人类实验通量、试剂、菌种与 biosafety 流程上**。把「发现」的功劳全记在模型头上，会低估人类审阅与实验设计的否决权。

4. **预印本 / 技术报告 ≠ 同行评议终局。**  
   HN 上有人直接问：为什么是公关向白皮书，而不是先走传统期刊 + preprint 的更常见路径？也有人提醒 reviewer 可能会咬某些断言。[2] 对读者，正确姿势是：把这份材料当**早期共享的假设与流水线证据**，等机制论文、独立复现和工具化验证来升级置信度——而不是把新闻稿日期当成科学共识日期。

Anthropic 自己的辩护逻辑也值得原样记下：他们选择早分享，一是展示 Claude 能力，二是让社区尽早看到他们在做什么；功能研究仍在进行。[1] 你可以同意「早分享有价值」，同时拒绝「早分享 = 已证实」。

## 怎么读营销口径：把主语、宾语和时态换回去

这类新闻有一套固定修辞。读的时候，建议强制做三次改写：

**改写 1：把主语从模型改回系统。**  
「Claude discovered」更完整的说法接近 HN 评论里的建议：Anthropic 的研究团队用 Claude agents（外加自研 harness 与人类实验室）发现了……[2] 模型是关键计算部件，不是法人作者，也不是 biosafety 责任人。

**改写 2：把宾语从「新酶系统神器」改回「未描述的基因组排布 / 候选系统」。**  
底层 RT 已知；新意在 array + partner 的共现与后续表达证据。[1][3] CRISPR-like 是类比，用来激活读者直觉；它不是分类学结论。

**改写 3：把时态从完成时改回进行时。**  
功能未知、工具化未完成、主论文级机制仍待展开。Zhang 的「merits further investigation」才是与证据匹配的时态。[1]

再补两条传播层常见噪音：

- **把「类 CRISPR」读成「能编辑」。** 新闻稿用的是 *reminiscent of CRISPR*、*pattern reminiscent of CRISPR*。形貌相似 ≠ 机制相同 ≠ 治疗可及。
- **把「研究组 + 实验室」读成「模型公司已转型药企」。** 他们确实在加 life sciences 组织与实验室，但这与「token 生意已被湿实验取代」之间，还隔着漫长的验证与监管。HN 上关于「用治病叙事修复 PR / 未来自己吃掉客户算力」的讨论，当作行业政治学旁注即可，别和本篇的证据层混绑。[2]

对照站内常写的 benchmark 叙事，会更好懂：分数上涨证明「在某个固定题库上更强」；ART 新闻证明「在某个被 brief 收窄的搜索空间里，多 agent 流水线能冒出可送去人审的候选」。两者都可能真，但**可迁移的主张范围完全不同**。不要用前者的修辞习惯去读后者。

## 对做 agent 系统的人，这意味着什么

如果你正在做编码 agent、研究 agent、或者企业内部的「hypothesis → triage → human review」流水线，这次公开材料里更值得抄的是结构，不是生物学结论。

**1. 把「发现」定义成可交付物，而不是氛围。**  
他们的交付物是：带证据的短报告、候选排序、以及少量值得湿实验的名单。你的产品若只有聊天记录，没有「claim / evidence / confidence / next experiment」结构，就很难进入人类审阅带宽。[3]

**2. 并行要配否决，否则只是烧钱。**  
950 sessions 有意义，是因为后面有 supervisor、共享记录、淘汰规则和人类闸门。只扩并行、不扩过滤，得到的是不可读的假设垃圾场。这和 [agent harness](/cn/blog/inside-claude-code-agent-harness/) 讨论里「循环外状态与边界」是同一课。

**3. 高层次 prompt 仍然是强先验。**  
「只给高层次方向」听起来很神话，但 brief 已经选定了 RT、partner 关联、基因组挖掘这套问题型。你在自己的领域复刻时，先诚实地写清：搜索空间怎么收窄、什么叫 anomaly、什么叫淘汰。

**4. 轨迹审计比最终口号重要。**  
他们愿意贴出 agent 看到 repeat 时的原始惊叹，以及随后的自我怀疑与文献核对。[1][3] 对内部研究平台，保留「为什么这个候选活下来」的轨迹，比事后写一篇胜利新闻更有长期价值。

**5. 人类环节要预算，不要假装消失。**  
实验室通量、审阅口味、biosafety、以及「哪些假设配得上实验槽位」，都会回写进指令。官网把「假设质量」本身当成研究对象，这是少见的坦诚。[1] 企业里对应的是：评审委员会、on-call、合规、以及谁有权把候选推进生产。

**6. 别在自己的 changelog 里学坏标题党。**  
工程师对外同步时，用「在已知组件周围发现未描述的组合模式，功能待验」通常比「AI 发现了新科学」更耐打。你省下的不是兴奋，是事后纠偏成本。

## 反例与踩坑：读完新闻后最容易做错的五件事

1. **把预印本当成已复现的临床/工具结论。**  
2. **忽略「底层 RT 已知」这句限定，只转发 CRISPR 类比。**  
3. **以为公开 Claude Code 就能原样复现整场 campaign。** 缺的是数据、harness、模型版本与人类实验室。  
4. **在没有 biosafety 与合规框架时，讨论「自己也搞个生物 agent 实验室」。** 本篇明确不提供任何实验操作指南；那是另一条完全不同的责任链。  
5. **用同一套兴奋感去读所有「AI for science」新闻。** 有的是基准分数，有的是文献综述加速，有的是像这次一样的 anomaly hunting。对象不同，验收标准就不同。


## 和「benchmark 分数」叙事差在哪

做模型的人习惯了一种讲法：换底座、刷榜、发一张表，分数涨了就算进展。ART 这则新闻如果硬套同一套模板，会读得很别扭——因为它验收的不是固定题库上的准确率，而是**开放搜索里有没有冒出值得人类继续花实验预算的候选**。

两边的差异可以压成几条：

1. **题面是否封闭。** Benchmark 题面事先固定；基因组挖掘的「正确答案」往往要在发现之后才被命名。你无法事先把 ART 写进 leaderboard。
2. **假阳性成本落在谁头上。** 刷榜错一道题，损失是排行榜名次；湿实验跟错一个候选，损失是周级的人手与试剂。所以他们才把「大多数候选该死掉」写成正常路径，而不是失败。
3. **可迁移主张的半径。** 「模型在某套编码基准上 +X」通常还能外推到相近任务；「这场 RT campaign 找到了 ART」外推到「任意生物学问题都会被 Claude 发现」则过界。诚实的产品表述应停在：在 *brief 收窄 + harness 并行 + 人类闸门* 具备时，anomaly hunting 可以工业化。
4. **外发物形态不同。** 分数新闻外发一张表；研究 agent 新闻更合理的外发物是报告样本、淘汰比例、以及仍未闭合的功能问题。Anthropic 选择早发技术报告，本质上是在用「假设包」而不是「最终分数」换社区注意力。

对内部做研究平台的团队，这组差异直接决定你该建什么仪表盘：不要只报「本周生成了多少假设」，要报「进入人类审阅的比例、被否决的原因分布、真正开实验的条数、以及实验回写进 brief 的次数」。没有后半截，你只是在自动化地生产乐观主义。

## 结语

ART 这件事，最扎实的读法大概是：

Anthropic 展示了一条**可审计的研究 agent 流水线**：在收窄过的基因组挖掘任务上，多会话 harness 能把海量序列压成少数人审得动的报告，并标出一套以重复阵列为标志的 RT 系统候选；早期实验支持阵列被转录成短 RNA；**主功能与工具化仍未完成**；湿实验与安全责任仍在人类这边。[1][3]

对关注 agent 的工程师，真正可迁移的不是「CRISPR」三个字的流量，而是：**brief 如何收窄搜索空间、并行如何配否决、报告如何带证据、人类闸门如何接在循环外。** 把这些抄回你的产品，比争论「算不算发现」更有用。

若你只记住一句：  
**这是「已知 RT 周围的未描述排布被 agent 流水线标出来了」，不是「下一个基因编辑平台已经交付」。**

技术细节、完整方法与图表以 Anthropic 技术报告 / 预印本为准；传播层数字以官网新闻为准，两者并存时以上文对照为准。[1][3]

## 参考

1. Anthropic. *Claude discovers a novel enzyme system with CRISPR-like repeats.* 2026-09-23. https://www.anthropic.com/news/claude-discovers-novel-enzyme-system  
2. Hacker News 讨论帖（item 49820134；写稿时可见约 526 分 / 约 550 评）. https://news.ycombinator.com/item?id=49820134  
3. Yoon et al. *Autonomous AI agents discover reverse transcriptases with tandem repeat arrays.* Anthropic technical report / preprint PDF. https://www-cdn.anthropic.com/22573675ada52a8ca8a97a1a4b4326b2f208a071.pdf  
