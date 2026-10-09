---
title: "OpenAI 数学撤稿周：Lean 编译通过，到底证明了什么"
description: "OpenAI 放出 700 多篇 AI 数学稿件，两天后撤回三篇；同周 arXiv 论文指出 Navier–Stokes 的 Lean 证明与论文原文不对应。本文把「AI 证明了 X」拆成五层，说清哪些被机器查过，并给出审计清单。"
pubDate: 2026-10-09T16:40:00+08:00
author: "Remy"
tags: ["openai", "evaluation", "research", "llm"]
lang: "zh"
---

## 这一周发生了什么

2026 年 10 月 6 日，OpenAI 发文说要「分享 AI 在数学上的进展」：一个内部前沿模型产出的大批新结果，放进 GitHub 仓库 `openai/math`，附带「许多证明」的 Lean 形式化，并承诺「拿到更多形式化后再更新仓库」。[1] README 更具体：最初一版 722 篇稿件、372 个结果族，模型共被投喂约 4000 道问题，并直说「部分未形式化的结果可能有问题」。[2]

两天后，OpenAI 的 Dan Roberts 发推：仓库新增 6 个 Lean 形式化、19 处修改、3 篇撤回，「顶层结果约 42% 已形式化」。[5] 仓库的 `history.md` 把这批变化记在「October 7, 2026」名下：一篇关于分裂阿贝尔八维簇上 Weil 类代数性的稿件出现符号错误，连带两篇依赖它的稿件一起撤回；另有 14 篇做了证明修补和陈述更正，13 篇只改了对修订版的引用；新增形式化后，顶层结果形式化比例为 300 / 719，约 42%。[3] 对应提交在 UTC 10 月 8 日 05:03（北京时间 13:03）合入主分支，推文发在北京时间 13:20。

几乎同时，剑桥的 A. Bastounis、F. Circelli、A. C. Hansen 在 10 月 6 日提交了一篇 arXiv 论文，标题直接点名：《Navier–Stokes lost in translation》。他们拿 OpenAI 9 月宣布的 Navier–Stokes 爆破证明做案例，逐条对照论文原文和 Lean 代码，结论是：Lean 形式化并不是论文的语义忠实翻译，因此 Lean 编译通过不能为论文里的自然语言证明作保。[6]

同一周还有 Terence Tao 的「Math 2.0」四连帖 [14]、集合论学者 Asaf Karagila 对 Partition Principle 稿件的公开批评 [12]、Scott Aaronson 的《The Mathocalypse》[13]，以及 Erdős 问题网站冻结证明声明 [16]。放在一起，它们逼问同一个问题：**有人说「AI 证明了 X，还有 Lean 证书」时，到底有多少东西被机器检查过？**

这篇不判断哪条结果对错，我没能力审这些数学。只做一件事：把这句话拆开，看每层归谁、靠什么查、这周哪层出了事。

## 撤回的三篇：错在哪，有没有 Lean

撤回说明写得相当具体。原稿在一个「稳定化迹」论证里给每条反向迹记了 +1 的符号，以为插入 m 条之后带符号的双点计数会变成零；但标准尖点两个分支的源定向相反，每条反向迹在该约定下其实是 −1，计数变成 −2m，不为零。后面调用的 Eliashberg–Murphy 消去定理要求计数为零，前提不满足，整个构造就站不住了。说明最后补了一句：撤回针对的是证明，**并不断言命题本身为假**。[4]

被撤回的三篇是：

| 稿件 | 撤回原因 |
| --- | --- |
| Algebraicity of Weil classes on split abelian eightfolds | 符号错误，主论证失效 [3][4] |
| Algebraicity of Kuga–Satake Correspondences for K3 Surfaces | 依赖上一篇的构造 [3] |
| The rational Hodge conjecture for products of K3 surfaces | 同上 [3] |

HN 讨论里有人问：撤回的这几篇有没有 Lean？有评论说都没有形式化。[18] 我对照了初始提交 `adc7f12` 里的形式化目录 `lean/formalization.yaml`，没有找到这三篇；现在主分支的目录里也没有。[19] 所以这次纠错的直接教训其实很朴素：**未形式化的那一大半，就是未经机器检查的那一大半**。README 自己也这么说。[2]

还有两笔小账对不上：推文的「19 处修改」与 `history.md` 的分项（14 篇证明修改、13 篇引用更新、5 项其他补充）对不上 [3][5]；撤回说明写 10 月 6 日，`history.md` 标 10 月 7 日，提交在 UTC 10 月 8 日。[3][4] 不影响数学，但**「已核对」的口径本身也要核对。**

## 把「Lean 通过」拆成五层

讨论这类事件时，人们常把几句不同的话当成一句话说。我按信任链从底向上拆成五层：

| 层 | 问的是什么 | 谁来检查 | 机器能不能兜底 |
| --- | --- | --- | --- |
| L0 内核与运行时 | 检查器本身可信吗？ | 内核实现、外部检查器 | 部分，可多实现交叉 |
| L1 形式证明 | 证明能否推出这条形式陈述？ | Lean 内核 | 能，这正是 Lean 的强项 |
| L2 陈述忠实 | 形式陈述说的是我们想要的那道题吗？ | 懂这一领域的人 | 不能，只能人读 |
| L3 证明对应 | 论文里的自然语言证明，和 Lean 证明是同一个论证吗？ | 人逐条对照 | 不能 |
| L4 口径 | 对外说「解决了」，与 L1–L3 实际覆盖的范围一致吗？ | 读者、同行、媒体 | 不能 |

Lean 的保证集中在 L1，L0 靠工程不断加固，L2 到 L4 全落在人身上。这周三件事正好各落一层：撤回出在 L1 没覆盖的部分；Navier–Stokes 论文讲 L3；Karagila 和 Tao 说的是 L4 和验证之外的社群成本。

### L0：检查器自己也会被攻破

很多人默认「Lean 内核很小，所以可信」。内核确实小，但不等于没有 bug。2026 年 7 月，有人借助 AI 做出一份不含 `sorry` 的 Collatz 猜想「反证」，实际上利用了内核处理嵌套归纳类型时漏掉的一处检查，后来被化简为一份 False 的证明（issue #14576）；更巧的是，当时主要的外部检查器 nanoda 也有一个不相干的 bug，那份证明被刻意做成恰好绕过两边。[10] 那是刻意的演示，但攻击面确实存在。

8 月的后续更值得注意：OpenAI 的 Daniel Selsam 用内部模型帮 Lean FRO（维护 Lean 的非营利组织）系统地找内核 bug，模型找到多处能让官方内核接受 False 的问题，最后转向运行时：一次让引用计数溢出、破坏内存，一次利用官方 Linux 版本链接的旧版 GMP 6.1.2 的已知 bug。Lean v4.33.1 修复了这些问题。[11] de Moura 写明「我们把 AI 生成的证明视为潜在的恶意证明来源」，`lake build` 不防恶意证明，黄金标准是 `comparator` 加外部检查器；4.35.0 起会有 `lake check` 与 `--paranoid` 多内核复查。[11]

所以 L0 的正确说法不是「内核不会错」，而是「至少一个独立实现是对的」。这一层在靠工程持续收紧，不是这次撤回的原因，但审计时不能跳过。

### L1：这一层确实可以交给机器

OpenAI 仓库的做法值得肯定：每个形式化结果配一个 Comparator 配置。Comparator 是 Lean 官方提供的「可信裁判」：你提供一个挑战文件（里面写好定理陈述，证明处留 `sorry`），对方提供解答文件，Comparator 在沙箱里检查解答里的同名定理是否①证明的是同一陈述，②只用了白名单里的公理，③被内核接受。[9] 例如 Partition Principle 那条的配置，白名单公理只有 `propext`、`Quot.sound`、`Classical.choice` 三个。[19]

这一层跑通，就不必读那 1.8 GiB 的证明（HN 上有人这样估计体量 [18]），这也是「只要查陈述就够了」的底气。话没错，但难点整个推给了 L2。

### L2：陈述忠实，比想象中难读

「查陈述比查证明容易」通常成立，但容易多少，差别非常大。我数了 OpenAI 仓库里几个挑战文件的行数（包括 import 与自定义定义）：[19]

| 挑战文件 | 行数 | 读起来要什么 |
| --- | ---: | --- |
| QuasiRiemannHypothesis | 9 | 一行：Re(s) > 7/8 时 ζ(s) ≠ 0，直接用 Mathlib 的 `riemannZeta` |
| ErdosReciprocal | 36 | 自定义「含 k 项等差数列」与倒数和，内容即 Erdős 那个著名的等差数列猜想 |
| MatrixMultiplication | 132 | 自定义矩阵乘法指数相关定义 |
| PartitionPrinciple | 277 | 自己从零写了一套集合论公式语法、满足关系、ZF 公理模式 |
| NavierStokesVelocity | 1275 | 大量 PDE 定义 |

9 行的陈述，懂数论的人几分钟看完；277 行自建的逻辑语法和 ZF，得同时懂集合论和 Lean 才能判断有没有写偏；上千行 PDE 定义，光确认「函数空间是不是论文里那些」就是专门的活。HN 上的争论就卡在这里：一方说人「只需核对陈述」；另一方说「证明一个和本意略有不同的命题，出奇地容易」。[18] 两边都对，只是说的陈述长度不同。

形式化里还有一类专门坑人的东西：**约定值**（junk value，即在数学上无定义的位置给一个默认值）。Bastounis 等人举的例子是 `sInf`：Lean 里空的自然数集合取下确界返回 0，于是一个在数学上根本没有良好定义的量，会被悄悄赋成具体数字，后面的恒等式照样能证出来。[6] 同理，Lean 里 0 的倒数等于 0；Mathlib 的 ζ 函数在极点 s = 1 处也给了一个约定值，所以「Re(s) > 7/8 时 ζ(s) ≠ 0」这类陈述在 s = 1 上靠的是约定，而不是数学。这里它们大概率无害（n = 0 那项贡献 0；s = 1 本来就不是零点），但审陈述的人得知道它们在那儿，并判断。

### L3：证明能编译，不等于论文那段证明是对的

Bastounis 等人的核心贡献在这一层。他们先区分两种自动形式化（autoformalization，用 AI 把自然语言数学翻成形式语言）：

- 类型 (i)：陈述已经忠实形式化了，让 AI 把一份自然语言证明翻成 Lean，编译通过、无 `sorry`、无额外公理即算成功。
- 类型 (ii)：把整篇文本的定义、命题、证明都语义忠实地翻过去，证明的论证结构也要对应。[6]

OpenAI 的流程属于 (i)。论文指出，(i) 的验收条件只问「Y′ 是否在 Lean 里证明了 X′」，不问「Y′ 是否保留了 Y 的推理」。只要还没通过，AI 就继续改，可能修好原证明的错，也可能直接换一条路；两种情况都算成功。论文的说法很尖锐：如果原证明本来就是错的，这个流程反而**激励** AI 去找一条别的证明。[6]

两个入门例子。其一：「x ≥ −1 时 x³ − x² − x + 1 ≥ 0」命题为真，给出的证明却把根的重数写反了；让 ChatGPT-6 把这份错证明「翻译」成 Lean，它自己找到正确重数，交出一份能编译的正确证明。其二：对称矩阵 tr(A²) ≥ 0，原证明走正交对角化，Lean 版本跳过换基、直接用对称性写成平方和——两份都对，却不是同一个论证。[6] 两例里 Lean 都是绿的，对原文证明对不对却什么也没说。

### L4：对外口径与实际检查范围

最后一层是措辞。OpenAI 9 月的博文「On the Navier–Stokes Millennium Prize Problem」写的是「通过建立官方表述中的命题 C（以及 D）解决了 Navier–Stokes 千禧年问题」，并「分享证明的写稿和 Lean 形式化」，同时声明不打算领奖。[7] 配套仓库 README 说里面是两篇论文「结果的 Lean 4 形式化」。[8] 读者自然理解成：论文和 Lean 是一回事。L3 那篇论文说的恰恰是：不是。

10 月这次发布措辞克制得多，用的是「progress」，README 也坦白不是所有结果都形式化了。[1][2] 但 Karagila 指出，新闻稿写「进展」，到了媒体和公众那里就成了「解决方案」；这是「两头都占」。[12]

## Navier–Stokes：Lean 证的东西比论文写的弱

具体看 Bastounis 等人在 OpenAI Navier–Stokes 证明里找到的两处不对应。[6]

第一处在论文的引理 8.6、式 (8.19)：在二维环面上反解算子 N⁻¹ 的估计，论文写的是输出的 m 阶导数被输入的 **m+4** 阶导数控制；论文给的理由是丢番图型的除数界加上「多四阶导数后二维傅里叶级数剩下可求和的 (1+|k|)⁻³」。而他们找到的、最接近 (8.19) 的 Lean 定理 `norm_derivativeWord_inverse_le`，假设里要的是 **m+5** 阶导数，用的级数也换成了指数为 4 的另一种形式。仓库里其他相关定理也一致地是 m+5。换句话说，Lean 证明的是一个**更弱**的不等式。[6]

第二处是式 (10.19) 的压力通量估计。论文的界只依赖局部 L⁶ 范数 B_R；Lean 里最接近的定理多出一项局部梯度范数 A_R，论证路线也不同：论文用 Riesz 变换在 L^{3/2} 上的有界性，Lean 改走 Sobolev 嵌入到 L²，Hölder 指数也换了。作者说两个界很难直接比较。[6]

边界要说清，否则容易读成「Navier–Stokes 证明是假的」：

1. 论文明确声明：**不对 OpenAI 自然语言证明的正确性下结论**，只讨论「翻译」问题。[6]
2. Aaronson 博客评论区有人补了另一面：只要顶层陈述形式化得对，Lean 证明仍说明命题成立；论文说的是，大家在读的那份自然语言证明可能和 Lean 不对应，甚至有错。[13] 我同意这个解读，它恰好说明 L1 与 L3 是两件事。
3. 论文认为同时发布的 Euler 证明「很可能」也有不对应，但说明这只是初步检查后的预测。[6]

那「存在一份正确的证明」为什么还不够？因为数学界要的不只是真值。Tao 说，过去一个突破会带来讲座、合作和新问题，证明被消化、写进教材；现在很多结果却由读不懂、也讲不出输出的 AI 使用者「解决」。[14] 如果人读的证明和机器验的不是同一个论证，「消化」就是在错的文本上进行。

## 为什么「忠实翻译」不能指望再加一个 AI 来检查

很多工程师第一反应是：那就再让一个模型把 Lean 证明翻回自然语言，对照原文就行。论文专门讨论了这个想法：反向翻译同样要证明「回译忠实反映了形式证明」且「推理与原文对应」，问题只是换了个方向，难度和类型 (ii) 一样。[6]

论文更进一步给了一个计算理论结果。它构造了一个看似平凡的例子：教科书定义 n_e 为「使某个多项式方程无自然数解的最小 n」，再令 r_e = 1/(n_e + 1)，然后声称 (r_e + 1)² = r_e² + 2r_e + 1 显然。恒等式本身一行 `ring` 就证完；麻烦在于 r_e 是否有定义取决于那样的 n 是否存在。一个语义忠实的形式化器必须在 r_e 无定义时**拒绝翻译**，可是判断它是否有定义，借助希尔伯特第十问题的已知结果，是 Σ⁰₂ 完全的——即使给你停机问题的神谕也判断不了；把例子推广后，这类歧义消解问题在 SCI 层级（可解复杂度指标，一种按「需要几重极限」来给计算问题分级的框架）上没有有限上界。[6] 而如果 AI 用 `sInf` 那种约定值硬翻，Lean 照样编译通过，翻译却是错的。

这个结论要读对：它说的是**不存在对所有输入都可靠的忠实形式化器**，不是说某条具体形式化无法检查——那条懂行的人仍能读、能判断。它否定的是这种想法：在 AI 生成和 Lean 验证之间全自动插一道「忠实性」检查，从此不必有人读。

论文引的先例：2026 年春 Meta 宣称把 26 本教科书自动形式化进 Lean；某本书号称形式化了 56%，Lean 社区有人却找不到一条没有致命错误的。它的忠实性检查主要交给了别的 AI。[6]

## 宣传口径之外：谁来付「读」的成本

L4 不只是措辞问题，它决定了验证成本由谁来付。

Karagila 的文章很有代表性。他研究选择公理，Partition Principle 是否蕴含选择公理是他长期关注的问题。他读了稿件（没看 Lean 代码，说自己不熟 Lean，代码又极大），评价是写得混乱、结构奇怪、术语偏、引用不当（包括引用未发表、没上 arXiv 的讲义），投期刊应直接退稿。他说一次丢出几百篇难读的「解答」，等于对数学界发起拒绝服务攻击。[12]

有意思的是，Partition Principle 这条在形式化目录里**是有** Comparator 配置的。[19] 即便 L1 过了、277 行陈述也有人核过，Karagila 的批评依然成立，因为他要的不在这五层里：一份领域专家读得懂、能放进文献脉络的论文。这和 Tao 的观点一致：「第一个解决」被优化到不可持续时，社区该更看重讲解、社群建设和开辟新方向。[14]

Aaronson 更乐观，称这是数学史上最重要的日子之一，列了 Unique Games 猜想、低于 n log n 的整数乘法等结果，但也写明「不是所有结果都有 Lean 证书」「几乎没有人读懂过这些证明」。[13] 他还对比了两种发布方式：OpenAI 直接公开未消化的证明，让人类比赛去理解；Anthropic 让 Virginia Williams 和 Josh Alman 有偿整理、以他们的名义发表。[13] 两种做法分摊 L3/L4 成本的方式不同，各有代价。

几个具体结果在不同层上的状态：

- **整数乘法低于 n log n**：稿件摘要明确了计算模型——固定有限字母表、有限条一维带的多带图灵机，复杂度 O(n (lg n)^{1−κ})，κ = 2⁻¹⁸²，并称在此模型下否定了 Schönhage–Strassen 的 n log n 最优性猜想。[19] 截至我 10 月 9 日抓取，它不在 `formalization.yaml` 里，所以 HN 上「它的 Lean 证明靠查表」的说法我无法核实。[18][19] L4 还包括**计算模型**：「低于 n log n」只在那个模型下成立。
- **Erdős 问题**：Thomas Bloom 在 10 月 6 日宣布冻结问题页评论和证明声明、取消「已解决/未解决」状态显示、不再用归属性措辞；他会链接在 Palomar 上登记、能核对「形式陈述是否对应原题」的 Lean 形式化。[16] 这是一个社区主动把 L2 检查做成流程的例子。
- **11 个正方形装箱**：这个形式化不来自 OpenAI，我引用它是因为它的披露方式。README 写明最终定理信任「Lean 内核加原生编译器」，因为部分数值证书用了 `native_decide`，「不是只信内核的验证」；验证报告列出 7920 个模块、0 个 admission、13,308 个原生证书依赖，并要求复现者核对最终状态字段，而不只看编译到 100%。[17] 这就是 L0 层的诚实披露。

## 站内对照

- [RSI 综述](/cn/blog/rsi-recursive-self-improvement-survey-2026/)里有一条「验证层级」：形式化验证器在顶，执行反馈次之，学习型裁判与内在自信在底；自我改进能走多远，大体跟着验证信号的档位走。[20] 这周提醒的是：形式化验证器在顶，前提是它验的是你要的那件事。L2/L3 一旦错位，最硬的验证器也只是在验另一件事。
- [SAGE 那篇](/cn/blog/sage-statistical-acceptance-gate-self-evolving-skills/)讲自进化技能的门控：优化器调得很严，验收却常常是「总分涨了就合并」。[21] 类型 (i) 自动形式化的验收条件「编译通过即成功」，是同一种问题：门控只看一个标量，被优化的一方会找到满足它的任何路径。
- [Claude Science 九圈振幅](/cn/blog/claude-science-harness-nine-loop-amplitudes/)里记过一个比例：生成只要上千美元，验证要专家三个月，而且没法形式化。[22] 数学是少有的能把 L1 交给机器的领域，但 L2–L4 的成本结构和那篇一样：生成便宜，读懂很贵。

## 审计清单：看到「AI 证明了 X」时怎么查

按角色拆开，每步尽量落到能执行的动作。

**读者（10 分钟版）**

1. 找原始仓库或论文，不要只看新闻稿。确认对外措辞是「解决」「进展」还是「部分结果」。[1][7]
2. 查这条结果**有没有**形式化。以 OpenAI 仓库为例，在 `lean/formalization.yaml` 里搜论文标题；搜不到，就按「未经机器检查」对待。[2][19]
3. 看 `history.md` 或 changelog，有没有撤回、修订，修订是否改了陈述。[3]
4. 看是谁在评价：是领域专家读过论文，还是只看过 Lean 编译结果。

**审稿人 / 领域专家（半天到数天）**

5. 打开 Comparator 挑战文件，先数行数，再逐行读定义。重点找：自建定义是否与标准定义一致；有无约定值（`sInf`、除以 0、极点处取值）被用到；量词范围、正负号、严格与非严格不等号。[6][19]
6. 核 `permitted_axioms`，确认没有额外公理；搜源码里的 `native_decide`、`implemented_by`、`unsafe`、`debug.skipKernelTC` 之类绕过内核的用法。[11][17]
7. 用 Comparator 并开启 nanoda 等外部内核复查；记下 Lean、Mathlib、检查器的版本与提交哈希，便于以后在新修复后重跑。[9][10][11]
8. 对论文里每条关键引理，找到对应的 Lean 声明，对比**假设和结论的强弱**（像 m+4 与 m+5 那样）。对应不上的地方，就属于 L3 未覆盖的范围，要单独审。[6]
9. 确认计算模型、外力项、维数、边界条件等「题目设定」与原题一致（多带图灵机还是 RAM、R³ 还是环面）。[7][19]

**实验室 / 发布方**

10. 发布时把每条结果标成四种状态之一：未形式化、证明已形式化但未做论文对应、已做对应、已经专家阅读。不要用一个笼统的比例（如 42%）代表全部。[3][5]
11. 对外措辞只能用到实际覆盖的那一层。顶层陈述验过但论文证明没对应，就写「定理已经机器检查，论文证明尚未逐条对应」。
12. 公开验证的信任模型：信内核、信原生编译器还是多内核；像 11 正方形项目那样列出全部例外依赖。[17]
13. 修订与撤回保留可追溯的旧版本，并说明影响了哪些依赖稿件；这次 OpenAI 的撤回说明在这一点上做得不错。[3][4]
14. 给人类读者付读的成本：请领域专家参与写作和讲解，而不是把消化工作外包给整个社区。[12][13][14]

## 还不确定的地方

- OpenAI 是否、何时会把 Navier–Stokes 的 Lean 证明与论文逐条对应，或回应 Bastounis 等人的具体指认，截至本文写作我没有看到一手回应。
- 「42%」是 `history.md` 给出的顶层结果口径（300 / 719），我没有独立复算哪些算「顶层」。[3]
- Lozano-Robledo 在 Tao 博客的客座文里说 OpenAI 为 Navier–Stokes 投入约 1500 万美元等值资源，这是他的说法，我没找到一手数字。[15] Aaronson 写约 8000 题，README 写约 4000 题，以 README 为准。[2][13]

## 参考来源

1. OpenAI, "Sharing AI progress in mathematics", 2026-10-06. https://openai.com/index/sharing-ai-progress-in-mathematics/
2. openai/math README（当前主分支与初始提交 adc7f12）. https://github.com/openai/math
3. openai/math, history.md. https://github.com/openai/math/blob/main/history.md
4. openai/math, 撤回说明：Algebraicity of Weil classes on split abelian eightfolds. https://github.com/openai/math/tree/main/preprints/Algebraicity-of-Weil-classes-on-split-abelian-eightfolds-September-18-2026
5. Dan Roberts (@danintheory) 推文，2026-10-08 05:20 UTC. https://twitter.com/danintheory/status/2108065033070789090
6. A. Bastounis, F. Circelli, A. C. Hansen, "Navier–Stokes lost in translation – Why Lean verification of AI autoformalisation does not guarantee correct natural language proofs", arXiv:2610.08144, 2026-10-06. https://arxiv.org/abs/2610.08144
7. OpenAI, "On the Navier–Stokes Millennium Prize Problem", 2026-09-08. https://openai.com/index/navier-stokes-solution/
8. openai/NavierStokesAndEuler README. https://github.com/openai/NavierStokesAndEuler
9. leanprover/comparator README. https://github.com/leanprover/comparator
10. Leonardo de Moura, "Postmortem for Kernel Soundness Bug #14576", 2026-08-01. https://leodemoura.github.io/blog/2026-8-1-postmortem-for-kernel-soundness-bug-14576/
11. Leonardo de Moura, "Postmortem for the Kernel Soundness Bug Hunt", 2026-08-24. https://leodemoura.github.io/blog/2026-8-24-postmortem-for-the-kernel-soundness-bug-hunt/
12. Asaf Karagila, "OpenAI, the Partition Principle, and mathematics", 2026-10-08. https://karagila.org/2026/openai-pp/
13. Scott Aaronson, "The Mathocalypse" 及评论区. https://scottaaronson.blog/?p=10169
14. Terence Tao, Mathstodon「Math 2.0」四连帖，2026-10-06 UTC. https://mathstodon.xyz/@tao/117395269325940185
15. Álvaro Lozano-Robledo（Terence Tao 博客客座文）, "What should we tell our students?", 2026-10-08. https://terrytao.wordpress.com/2026/10/08/what-should-we-tell-our-students/
16. Thomas Bloom, "Changes", erdosproblems.com, 2026-10-06. https://www.erdosproblems.com/forum/thread/blog:9
17. Queuingtheorydotcom/11SquaresFormalized README 与 2026-10-06 验证报告. https://github.com/Queuingtheorydotcom/11SquaresFormalized
18. Hacker News, "OpenAI withdraws three mathematical results". https://news.ycombinator.com/item?id=50002650
19. openai/math `lean/formalization.yaml` 与 `lean/ComparatorChallenges/`（PartitionPrinciple、QuasiRiemannHypothesis、ErdosReciprocal 等），2026-10-09 抓取. https://github.com/openai/math/tree/main/lean
20. 站内：RSI 到 2026：有多少是真递归. /cn/blog/rsi-recursive-self-improvement-survey-2026/
21. 站内：SAGE：自进化技能别只看总分涨了就合并. /cn/blog/sage-statistical-acceptance-gate-self-evolving-skills/
22. 站内：Claude Science harness：无人值守算出九圈振幅. /cn/blog/claude-science-harness-nine-loop-amplitudes/
