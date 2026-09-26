---
title: "Jev 当 Rubric 评委：更便宜更快，但错在同一处"
description: "解读 arXiv:2609.29769：typed classifier Jev 与三位 flash LLM 在九 panel、5003 pairs 上对照——准确率多数分不出显著差异，成本/时延差 29–325× 与 30–220×；相关错误让「廉价一阶段 + LLM 回退」cascade 最多只多出约 1.5pp。"
pubDate: 2026-09-26T16:00:00+08:00
author: "Remy"
tags: ["jev", "ai-agents", "evaluation", "LLM", "agent-loop"]
lang: "zh"
---

Rubric 评委把「这段输出好不好」拆成一条条标准上的判决：某化学答案有没有写出必需要素，某篇作文在语法上落在五级里的哪一级。被评的提交叫 unit，(unit, criterion) 叫 pair。LLM-as-judge 已经进了 HealthBench 一类基准，也进了强化学习的奖励信号；代价也很直接——像 AutoRubric 这种按 criterion 打一枪的 grader，账单随 **units × criteria** 涨。[1]

Typed classifier（有类型的分类器）看起来正好卡在这个痛点上：对结构化输入问一个有限答案集上的概率，不生成自由文本；按输入 token 计费；一次请求可以带上该 unit 的全部 criteria，正文只计一次。TypeSafe 的 Jev 就是这类模型。于是问题很具体：**Jev 能不能替代 flash 档 LLM rubric judge？** 若所有评委都对不上人标，短板是某一个评委的，还是整套「只读 criterion 文本」的协议共同造成的？「便宜一阶段 + 不确定时交给 LLM」的 cascade 能不能既省钱又提分？

UPenn 的 Delip Rao 与 Chris Callison-Burch 在 [arXiv:2609.29769](https://arxiv.org/abs/2609.29769) 给出硬对照：九个 panel、七个公开基准、**5003** 对 pair；Jev 对三位 flash LLM——GPT-5.6 Luna、Gemini 3.8 Flash、DeepSeek V4.1 Flash——用**同一套**事先写好的 criterion 文本，零样本、无例子、无微调。结论可以压成三句：**多数配对准确率分不出显著差异；成本与墙钟时间差一个数量级以上；相关错误（correlated errors）毁掉了 cascade 的「省钱又涨分」想象。**[1]

站内已经写过 [Jev 接到 Claude Code](/cn/blog/jev-claude-code-10x-and-25-lines/)、[ContractNLI 上均分相近判决可不同](/cn/blog/jev-vs-llm-contractnli-same-scores-different-decisions/)、[JevOut 短上下文定向翻转](/cn/blog/jevout-natural-context-flips-decision-models/)、[Jev-Mem 记忆控制面](/cn/blog/jev-mem-system-one-agentic-memory/)。那些文分别谈接入、判决稳定性、上下文鲁棒性与记忆通道。本篇换到 **evaluation harness**：当 Jev 不是路由头而是 **rubric 评委**时，便宜与快是否够用；何时必须人标或至少对照多个评委；cascade / jury 何时失效。

## 设定：九 panel、相同准则、无例子微调

全部评委跑在 AutoRubric 开源 criterion grader（作者称 harness）里。两个 **binary panel**——RiceChem（化学长答、TA 标注）与 HealthBench（聊天完成、医师多数票）——准则是是否满足；七个 **graded panel**——ELLIPSE、FED-Turn、FED-Dialogue、HelpSteer2、LFQA、USR-TC、USR-PC——多数准则落在有序等级上，其中四个还夹着嵌入的 binary 准则。graded 侧占 3778 / 5003 pairs。[1]

### Jev 怎么答

Jev 按 vendor 叫「System One」；标价约 \$0.042 / 百万输入 token，输出不计费。请求走 `jev-latest`（稳定性检查当日记为 jev-1.13.0）。除每个 criterion 一道题外，请求还带一份结构化 `state`：unit 的 input（提示 / 对话 / 问题）与 submission——与 harness 交给 LLM 评委的两个字段相同。Jev **看不到** harness 的 system prompt；选项始终按量表顺序出现；任何评委都看不到 harness 给每个等级挂的 0–1 数值。[1]

三个原语（primitive）对应不同解码：

- **Noul**：返回「是」的概率，阈值 0.5。
- **Choice**：在给定选项标签上返回分布，取 argmax。
- **Score**：把有序等级描述读成期望等级，再四舍五入到最近等级（平局偏向偶数等级）。

主对照用 **Jev Choice**（与三位 LLM 一起称 matched judges）；graded 上另报 **Jev Score** 作为替代 framing。binary 上 Choice / Noul 都包一层 wrapper：固定指令句 + MET / UNMET 定义。Confidence 用于给 pair 排序，不用于校准声明。[1]

### LLM 评委怎么答

每位 LLM 评委走 harness 默认 system prompt，**每个 pair 一次调用**。选项每次按记录的种子打乱，缓解位置偏差。温度除 Luna（API 强制默认 1.0）外为 0；reasoning 留在 provider 默认——三家都会吐 reasoning token，Luna 明显更少。多选 system prompt 要求注意否定、范围与限定语，不确定时不要缩回中间档；提交自相矛盾且没有主导立场时，选质量更低的那一档。[1]

### 准则文本从哪来

graded panel 的 criterion 句与等级描述，来自作者为另一项未发表研究事先写好的 rubric 版本，**在本研究任何评委开跑前就冻结**。它们把 FED / USR 的问句改成陈述，改写 HelpSteer2 的等级措辞，LFQA 等级描述取自该基准给 GPT-4 的评分 prompt；ELLIPSE 保留语料评分量表的等级描述（含排版痕迹），并在每个 trait 的 criterion 句末把 level 5 标成「native-like facility」——原文量表只在 holistic 顶档用这个短语。评委读的是这些版本；原始标注员读的是各基准自己的说明。没有评委看到标签、holistic 分或抽样分层。[1]

人标签：graded 取标注员等级均值再四舍五入（半数向上）；binary 取多数票或 TA 标注。有多标注的 panel 另算 **rater reference**：每位标注员对其他人取整均值的准确率，池化后作为「单个标注员大概落在哪」的参照——它不是评委能达到的上界。HealthBench 上医师打成平手的 pairs 在抽样前已离开池子，可用医师参照的 pairs 很少；HelpSteer2 发布标签是「最同意的三位」取整均值，逐标注员分数未进入本对照。[1]

再钉几条可复现细节，避免读成「随便跑了一次 API」：

- graded panel 按固定种子做 10%/20% 分层抽样，**写盘后再开任何评委**；同问题的四条 LFQA 答案、同一 USR 上下文的多条回复、HelpSteer2 偏好对的两条回复，以整组为单位进入样本，避免拆散依赖。
- 防泄漏是结构性的：harness 只传 input 与 submission；标签、holistic、分层标签放在评委看不到的字段。HealthBench 的医师理想完成稿也从输入里剥掉。
- 弃权与调用失败默认不进分母；binary 上 DeepSeek 三次空响应被 harness 记成 UNMET，是唯一例外。配对比较只在「双方都打过」的 pairs 上算差，所以同一评委在不同表上的准确率分子分母可以不同——读表时要对齐定义，不要跨表硬比一个百分点。[1]

## 准确率：27 组配对里只有 8 组显著差异

作者按 panel × LLM 做配对准确率差（双方都打过分的 pairs），对 unit 做 10000 次重采样，取差的 95% 区间。区间不含零叫 **separated**；90% 区间落在 ±5 个百分点内叫 **parity**；两者都不是叫 **inconclusive**。5 点等价边界是事后定的。[1]

总览：Jev Choice 与某 LLM 在某 panel 上的 27 组比较里，**只有 8 组**达到显著差异。Jev 的领先大多落在 binary；落后只出现在 graded，主要对上通常最强的 Gemini。多数其余比较既分不开、也证不等价——样本精度不够。[1]

binary 上：Jev Choice 在 RiceChem 准确率 **81.0%**，高于 Luna / Gemini / DeepSeek 的 77.8% / 76.1% / 79.2%；HealthBench 上 **77.1%**，次于 Gemini 的 79.6%。它与 Luna 在两 panel 上都分离，与 Gemini 在 RiceChem 上分离，与 DeepSeek 在两 panel 上都 parity。[1]

graded 上 21 组里 16 组不分离。最大分离是 Gemini 在 ELLIPSE 上领先 **16.4** 点（95% 区间 14.1–18.7）；Gemini 还在 FED-Dialogue、HelpSteer2 领先。Luna 在 USR-PC 领先、在 HelpSteer2 落后于 Jev；DeepSeek 从未与 Jev Choice 分离。21 组里 6 组 parity、10 组 inconclusive。Holm 校正后仍保留四组分离（双向各二）：Gemini 在 ELLIPSE / FED-Dialogue 领先，Jev 在 HelpSteer2 对 Luna、在 RiceChem 对 Gemini 领先。若改按更大采样组（同 prompt / 同问题 / 同上下文）重采样，分离集合会变成 **八组**，其中五组是 Jev 的领先——但故事不变：binary 上 Jev 常站得住，graded 上它从不是 matched 里最准的，Gemini 几乎处处第一或并列第一（LFQA 除外）。[1]

还有两处扫兴的基线：HelpSteer2 上「每属性取众数」的常量预测器达到 **60.0%** exact accuracy，超过所有评委（相对 Gemini 的 pair-level 符号检验 \(p=0.075\)）；LFQA 上只看答案是 ChatGPT 还是 Reddit 用户的 provenance 基线达到 **68.1%**，与各评委 exact accuracy 无显著差。名次有时是在「都打不过不读正文的基线」之间排的。[1]

Jev Score（期望等级 framing）在 ELLIPSE、FED-Turn、FED-Dialogue、USR-TC 四个 panel 上与 Choice 分离且自身更高；七个 graded 上 within-one accuracy 也更高。FED-Turn 上 Score 与 Choice 差 **10.5** 点，大于三家 LLM 之间的展宽（2.9 点）——差异主要来自两个原语返回的概率，而不是解码规则本身。[1]

## 成本与墙钟：29–325× 贵，30–220× 慢

九 panel 合计，Jev Choice 花了约 **\$0.063**。Luna 约 **29×**，DeepSeek 约 **66×**，Gemini 约 **325×**。单 panel 比值从 Luna@HealthBench 的 **18×** 到 Gemini@FED-Dialogue 的 **770×**。墙钟：Jev Choice 约 **29** 秒跑完九 panel；Luna 859 秒、Gemini 950 秒、DeepSeek 6298 秒——约 **30–220×**。这些比值在「同等并发」下还会低估 Jev：graded 上 Jev 每 framing 并发 8，且 Choice 与 Score 共享一个 API；每位 LLM 对自己 provider 并发 16–32。[1]

成本比往往随 **每 unit 的 criteria 数**升高：每个 criterion 多一次 LLM 调用，却不增加 Jev 请求。Gemini 从 HealthBench（约 2.0 criteria/unit）的 121× 升到 FED-Dialogue（10）的峰值；graded 上大体随 criteria/unit 单调升。若改成「一个 LLM 调用打完一个 unit 的全部准则」或关掉 reasoning，比值会收窄——作者没测这两种配置，准确率影响未知。[1]

工程含义很直：若你的评测是 checklist 式 binary、且吞吐敏感，Jev 的价格/时延优势不是边角料，而是量级差。若你同时需要 graded 上尽量贴人标，光看「便宜」不够——下一节才是机制。

还有两个 framing 选择值得单独记，因为它们会改「你以为在比什么」：

- **Binary 上 wrapper 很重要。** Jev Noul 与 Choice 彼此几乎同判（全量 RiceChem 上 Cohen’s \(\kappa=0.945\)），准确率差不到 1 点；但相对去掉定义句的 bare Noul，wrapper 在 RiceChem 上多出 **10.7** 点、HealthBench 上多 **1.0** 点。省掉「MET/UNMET 是什么意思」这一句，便宜模型会先吃亏，这不是模型能力叙事，是协议完整性。[1]
- **Graded 上 NA 选项不是摆设。** Jev Choice 在 3414 条 ordinal pairs 里弃权 28 次，其中 17 次落在 FED-Dialogue 的 error_recovery——标注员也常答 N/A 的那条；\(P(\text{NA})\) 与答 N/A 的标注员人数 Spearman \(\rho=0.62\)，LLM 评委也大体在同一批 pairs 上弃权。若你的业务需要「无法评判」这条出路，Score framing（不能弃权）就不该默认定为主路径。[1]

## 共同偏离人标：评委彼此更像，不像标注员

Section 5 把四个 matched judges 与七个 graded panel 的人标签对照，发现偏离是**共用的**，不是「某家 LLM 独有」。[1]

### Judge–judge > judge–label

Table 2 上，所有七个 graded panel 的 **judge–judge** 均值 QWK 都高于 **judge–label**；其中五个 panel 上，最不合的一对评委彼此仍比「最好评委 vs 标签」更合。ELLIPSE 上四个评委在 **64.0%** 的 pairs 上同时错；事后挑「谁对就听谁」也只能到剩余 36.0%，仍低于 rater reference（51.4%）。[1]

### 缺口集中在负 offset 的准则上

Offset = 预测等级均值 − 标签等级均值。31 条有 rater reference 的 graded 准则上，四评委平均 offset 与平均 gap（相对 rater reference 的 exact accuracy 差）Spearman \(\rho=0.92\)。35 条 graded 准则里，四家 offset 同号为负的有 **25** 条，同号为正的只有 2 条。缺口不只是「排序乱」，更是「整体放得比人低」。[1]

### 常数平移能消掉大部分缺口

对每条准则做 leave-one-out 的整数等级平移（clip 到量表），最大化 exact accuracy 后，gap 不再跟踪 offset（\(\rho=0.16\)），且没有准则仍比未平移的 rater reference 低超过 8.4 点。ELLIPSE 偏移最大：matched 的 offset 从 Gemini 的 **−0.77** 到 Luna 的 **−1.28**，Jev Choice **−1.25**；Jev Choice 有 **86.1%** 预测低于标签、仅 **0.5%** 高于。标签把 36.3% pairs 放在 4–5 档，没有任何评委把超过 4.2% 放在那里。把 ELLIPSE 全部预测整体上移一档后，Jev Choice exact accuracy 从 **13.4%** 升到 **50.4%**，贴近 rater reference——平移纠正的是**位置**，不是顺序：评委对 essay 六 trait 均值与 holistic 分的 Spearman 仍在 0.62–0.72。[1]

### 观测解释：量表惯例不在 criterion 文本里

作者给的是**观测性**账户，不是干预实验：标注员可能遵循 criterion 文本没写全的 scale conventions——相对某个人群的常模、相对某语料的相对标准、或标注习惯。USR 上 Topical-Chat 与 PersonaChat 的五条 criterion 文本字节相同，但 engaging 上 PersonaChat 的负 offset 大、Topical-Chat 小；整体上移一档会抬高 PersonaChat、压低 Topical-Chat。ELLIPSE grammar 的等级差主要是「throughout / many / some / minimal / few or no」一类量词，另加「native-like facility」顶档措辞——零样本评委若按母语水平读「some errors」，会把学习者作文整体压低。HelpSteer2 verbosity、ELLIPSE cohesion 等「等级描述指向可见特征」的准则上，评委反而最接近标签。[1]

替代解释也列着：共享训练先验、普遍不愿给顶档、harness prompt 对 LLM 的额外指令、标签噪声。作者排除了「只有 harness prompt 才是共同原因」（Jev 看不到 prompt，仍有负 offset），也排除了「纯噪声」对 ELLIPSE / 部分 unanimous 错例的解释；但**没有**用 exemplar 或改写等级描述做干预，所以「缺惯例」与「共享先验」分不开。读这篇时要把「共同偏低」当成**协议级现象**：换一家 flash 评委，不一定换走同一套偏移。[1]

边界与反例也值得钉死，免得把「全体偏低」读成万能口号：

- **不是所有准则都偏低。** 等级描述指向可见特征时（衔接手段、相对 prompt 的详细程度），评委反而最接近标签；缺口集中在量词模糊、人群常模、语料相对标准、以及「标签其实在跟另一个构念走」的准则上。[1]
- **binary 与 graded 上 Jev 的错误方向可以反过来。** Binary 两 panel 上 Jev 偏多给 MET；graded 上（USR-TC 除外）偏负 offset。同一批 USR-TC 回复上，understandable 准则大家偏多给 MET，uses_knowledge 又偏少给——方向跟着准则走，不能简单归咎「量表从二值变成多级」。[1]
- **HelpSteer2 / LFQA 的「准确率」要带着基线读。** 常量预测器与 provenance 基线已经很高时，评委名次是在狭窄空间里排序；这时相关错误与 offset 比「谁高 2 个点」更有决策价值。[1]

## 核心机制：相关错误毁掉 cascade

这是标题里 “Wrong in the Same Places” 的定量版，也是选型时最容易误读的一节。

### Confidence 本该让 Jev 当一阶段

Cascade：廉价评委打完全部 pairs；confidence 低于阈值 \(\tau\) 的 **deferred** 交给 fallback（LLM）；其余 **kept** 保留廉价判决。只有在「Jev 对、fallback 错」的 kept pairs 上，cascade 才能超过 fallback。Jev Choice 的 confidence 在六个 graded panel（除 ELLIPSE）上能给自己的错误排序，AUROC 约 **0.57–0.70**；ELLIPSE 例外，AUROC **0.49**，各 confidence 带错误率都在 85.8%–87.2%。单准则上也会失效：LFQA factuality AUROC **0.41**，USR-PC engaging **0.52**——错误几乎全在标签一侧时，confidence 不一定还能当 deferral 信号。[1]

### LLM 几乎复述 Jev 最自信的错

当 Jev 错时，LLM 给出**同一个错答案**叫 repeated error。与「固定准则与标签下的独立性基线」比，每个 graded panel 上重复率都更高；在 Jev 最高 confidence 带上，LLM 复述错答案的比例约 **80.5%–92.8%**，基线只预期 33.6%–63.7%。取每个 graded panel 上 Jev Choice 最高置信的 12 个错误（共 84 pairs），三位 LLM 的 252 次判决里 **242（96.0%）** 重复该错答案，独立性基线约 **50.3%**。HealthBench 上用 Jev Noul 的自信错误另采：36 次 LLM 判决里 32 次给出 Jev 的答案，基线期望约 10。[1]

读法可以压成一句：**文本与准则一起强烈指向某一答案时，typed classifier 与 flash LLM 会一起指过去——哪怕标签不在那边。** 多数自信错误落在标注员分裂的 pairs 上（72 条有多标注的里只有 10 条 unanimous），但 HealthBench 的 12 条自信错误里有 11 条医师标签 unanimous——相关错误不只是「标签吵」。[1]

### 回放 cascade：最多 +1.5pp / +2.0pp

事后用已记录判决回放 Jev-first cascade（graded 用 Choice，binary 用 Noul）。**Oracle** 阈值在全 panel 上选；**cross-fitted** 在一半 units 上选阈值 / fallback / 最佳单评委，在另一半上计分，平均 50 次对半。[1]

Cross-fitted 下，没有任何 cascade 平均超过该 panel 最佳单评委超过 **1.5** 点——峰值在 HealthBench。六个 panel 上 cascade **低于**最佳单评委 0.1–7.3 点；过半次对半为正增益的只有 HealthBench、USR-PC、LFQA。Oracle 把最大增益抬到 **+2.0**（仍是 HealthBench），USR-PC 次之 +1.3——两者在 kept pairs 上的 pair-level 符号检验都不显著。FED-Turn 上最佳单评委是 Jev Score，任何 cascade 至少落后它 **5.2** 点。[1]

用「匹配最佳 LLM」视角看成本：cross-fitted 时，六个 panel 上 cascade 只要该 LLM **16%–48%** 的成本，held-out 准确率少 0.2–1.8 点；RiceChem 上 Jev 本身已超过最佳 LLM，cascade 约 **6.6%** 成本且 +1.2 点。ELLIPSE / FED-Dialogue 即使 oracle 也几乎要 defer 全部 pairs 才能追上 Gemini——瓶颈是 Jev 准确率与（ELLIPSE 上）失效的 confidence，不是阈值没调好。[1]

代数上写清楚：cascade 与 fallback 在 deferred 上同判，差只来自 kept：

\[
a_{\text{cascade}}-a_{\text{fallback}}=s_{\text{kept}}\bigl(a^{\text{kept}}_{\text{Jev}}-a^{\text{kept}}_{\text{fallback}}\bigr)
\]

graded 上「仅 Jev 对」的 pairs 本来就少（相对 Table 4 的 fallback，每 panel 约 12–37 条），confidence 还常把它们 defer 出去。相关错误同时解释了两件事：**保留自信判决几乎不掉点（所以省钱），也几乎涨不了点（所以别指望 cascade 当银弹）。**[1]

### Jury 也不稳赢最佳单评委

三家 LLM 的中位数（binary 上为多数票）在九个 panel 上从未超过「在同一批 pairs 上选出来的」最准 matched 评委；graded 上最多落后 12.8 点（ELLIPSE）。加第四个陪审员 Jev Choice 也没有显著改进。自信错误样本上，三家中位数在 84 条里有 **82** 条仍给出 Jev 的错答案。[1]

## 可复用清单：选型、级联、验证

对齐论文 Table 5 的证据状态（measured / observed / not tested），改成可执行检查，不另造数字。[1]

### 何时可以认真考虑 Jev 当评委

1. **Binary checklist 准则**，形态接近 RiceChem（题面要素是否出现）或 HealthBench（医师验证过的行为检查）：Jev Choice 在 RiceChem 是 matched 第一，HealthBench 第二；相对 flash LLM 有 18–326× 量级的成本差（视 panel 与模型）。[1]
2. **吞吐与账单硬约束**，且可接受「与某家 flash 评委多数分不开、偶发落后最佳 LLM」：27 组里多数 inconclusive 或 parity，不是「处处等价」的证明，但是「先换廉价评委跑通流水线」的合理区间。[1]
3. **Graded 且不需要弃权时**，可试 Jev Score；对照报告仍应用 Jev Choice，以便与 LLM 对齐选项与弃权语义。Score 在四个 panel 上显著高于 Choice，且不能选 NA。[1]
4. Binary 上给 Jev **wrapper（MET/UNMET 定义）**：相对 bare Noul，RiceChem +10.7 点、HealthBench +1.0 点。[1]

### 何时必须人标或至少多源对照

1. **Norm-referenced / 人群常模量表**（如学习者作文相对某年级人群）：零样本只读等级描述时，共同负 offset 很常见；exemplar 是否修好属 not tested，但「只换评委厂商」解决不了位置偏差。[1]
2. **顶档措辞是绝对句**（「Entirely accurate」「可当作可信信息源」）：人标与评委对「顶档该多严」可以系统性分叉——LFQA factuality 上标注员给顶档远多于 Jev Choice。[1]
3. **标签可能编码惯例或别的构念**：HelpSteer2 correctness 与 overall helpfulness Pearson \(r=0.94\)；USR-TC `_nofact` 上标注员一律 MET、Jev 几乎一律 UNMET。这时「提高评委准确率」可能在追一个 criterion 文本没写清的目标。[1]
4. **要用评委当独立真相源做发布门槛或 RL 奖励**：四个评委彼此更合、对人标更不合时，你优化的可能是「评委共识」，不是「人标」。至少报告 offset、judge–judge 与 judge–label，并拆开 unanimous / split pairs。[1]

### Cascade / jury 何时失效、何时仍值得用

1. **用 cascade 降成本：合理。** Cross-fitted 下多数 panel 可用远低于最佳 LLM 的成本逼近其准确率；RiceChem 上甚至更准更便宜。[1]
2. **用 cascade 涨准确率：别默认。** 相对最佳单评委，cross-fitted 最多约 +1.5pp，oracle 最多 +2.0pp，且常不显著；六个 panel 上平均还是负的。[1]
3. **上 cascade 前先按准则查 confidence。** ELLIPSE 全体、LFQA factuality、USR-PC engaging 等处 confidence 不排序错误——这些准则上「自信就保留」会锁进相关错误。[1]
4. **报告 repeated-error 份额 vs 独立性基线。** 若 LLM 在廉价评委的高置信错误上复述率接近 96%，cascade / jury 的多样性红利已经没了。[1]
5. **不要假设「三家 flash 中位数」稳赢最佳单评委。** 本协议下九 panel 都不赢；jury 会复述同一批自信错误。[1]
6. **有标签时，优先校正每条准则的 offset，而不是先堆评委。** Leave-one-out 平移后多数准则缺口可压到与平移后 rater reference 差 ≤5 点；堆同文评委解决不了位置偏差。[1]
7. **拆开 unanimous / split pairs 再解释错误。** 自信错误样本多数落在标注员分裂的 pairs 上，但 HealthBench 的自信错误几乎全体医师 unanimous——若你只报总体准确率，会把「标签吵」和「评委共识错」搅在一起。[1]
8. **二元属性别硬塞三档「有点 / 比较 / 非常」。** FED-Turn 上「正确」「流利」一类是非题被做成三档时，Jev Choice 几乎不用中间档；Score 更接近标签对中间档的使用率。量表形态本身会制造 framing 差，这是 not tested 的干预建议，但足够当作 rubric 写作红旗。[1]
9. **把「改告诉评委什么」排在「再加评委」前面。** 论文讨论的工程优先序是：exemplar、可观察特征的等级描述、按准则校正 offset——然后再谈多评委组合；同文多评委在本协议下既不稳赢最佳单评委，也几乎复述同一批自信错误。[1]

## 与站内 Jev 线对照：不同脆弱面

- 相对 [Jev × Claude Code](/cn/blog/jev-claude-code-10x-and-25-lines/)：那边论证高频有界判断该离开自回归热路径。本篇补 evaluation 侧：离开之后，**便宜评委在 binary checklist 上站得住**；在 graded 上「站得住」常常是相对另一家 flash 评委，不是相对人标。
- 相对 [ContractNLI](/cn/blog/jev-vs-llm-contractnli-same-scores-different-decisions/)：那边是均分相近、单条判决可翻，选型要盯 persistent correctness。这里是评委之间准确率常分不开，但**共同错在同一批 pairs**——聚合「差不多」会掩盖相关错误，也会让 cascade 假想破灭。两条线都在拆「分数好看 → 单次判决可信」。
- 相对 [JevOut](/cn/blog/jevout-natural-context-flips-decision-models/)：JevOut 是答案保持短上下文对**决策路由**的定向翻转；本篇是相同准则文本下评委对**人标**的共同偏移与彼此复述。一个打控制面输入，一个打评价面输出——都说明「有界选项 + 概率」方便软件消费，不等于独立真相源。
- 相对 [Jev-Mem](/cn/blog/jev-mem-system-one-agentic-memory/)：Mem 谈写/读/停取控制面。若记忆或检索最终进入 rubric 评判的 unit 文本，本篇的相关错误提醒：换评委厂商不一定换掉同一套错；验证集要能看见 repeated errors，不能只报一家准确率。

## 结语

Jev 作为 typed classifier rubric 评委，在九 panel、5003 pairs、与三位 flash LLM 同一准则协议下，给出一张很清醒的地图：**binary checklist 上可以认真当廉价替代；graded 上多数时候与某家 flash 分不开，但会落后最佳 LLM；成本与时延优势是 29–325× / 30–220× 量级；四个评委对人标的偏离高度同向，judge–judge 常高于 judge–label；confidence 本该支撑 cascade，却因 LLM 复述 Jev 最自信的错误（高置信错误样本上约 96%）而最多只换来约 +1.5pp（cross-fitted）或 +2.0pp（oracle）。**[1]

便宜、快，不等于可以当独立真相源。更值得先抄进 harness 的，不是「再加两家评委做 jury」，而是：按准则类型选型、报告 offset 与相关错误、用 cascade 省钱而不是幻想涨分、在惯例 dense 的量表上留人标或 exemplar——让评委输出变成可审计流水线的一环，而不是「共识即正确」的捷径。

## 参考文献

1. Delip Rao, Chris Callison-Burch. *Jev vs. LLMs as Rubric Judges: Cheaper, Faster, and Wrong in the Same Places*. arXiv:2609.29769, 2026. https://arxiv.org/abs/2609.29769 · HTML https://arxiv.org/html/2609.29769
2. 站内：Jev × Claude Code. https://redreamality.com/cn/blog/jev-claude-code-10x-and-25-lines/
3. 站内：均分相近不代表判决一样（ContractNLI）. https://redreamality.com/cn/blog/jev-vs-llm-contractnli-same-scores-different-decisions/
4. 站内：JevOut 短上下文可翻转决策模型. https://redreamality.com/cn/blog/jevout-natural-context-flips-decision-models/
5. 站内：Jev-Mem 记忆控制面. https://redreamality.com/cn/blog/jev-mem-system-one-agentic-memory/
