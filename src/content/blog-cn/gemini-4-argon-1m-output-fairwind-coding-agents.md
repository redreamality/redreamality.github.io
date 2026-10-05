---
title: "Gemini 4 Argon：1M 输出、DeepSWE 77.9% 与「防守方先用」，coding agent 该怎么读、怎么选"
description: "Google 于 2026-09-30 发布 Gemini 4 Argon：输出上限从 64K 提到 1M、DeepSWE v1.1 77.9%、先经 Fairwind 计划交给受信网络防守方。本文拆三件事：1M 输出对 agent loop 改变了什么、DeepSWE 一类数字该怎么读、分阶段放行作为遏制机制和 Anthropic / OpenAI 有何不同，最后给 coding agent 团队一份选型与评测清单。"
pubDate: 2026-10-05T16:40:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "llm", "security", "model-release"]
lang: "zh"
---

2026 年 9 月 30 日，Google 发布了新一代前沿模型 **Gemini 4 Argon**。官方博客里最显眼的有三条：输出 token 上限从此前的 64K 提到 **1M**；在长程软件工程基准 DeepSWE v1.1 上拿到 **77.9%**，Google 称之为新的最好成绩；以及它**不先对开发者开放**，而是通过 Fairwind 计划先交给一批受信的网络安全防守方，并且给他们和 Google 内部团队的是「不带网络安全护栏」的版本。定价也已公布：推广期每百万输入 token 2 美元、输出 10 美元，缓存输入打 95% 折扣；推广期结束后为 4 美元 / 20 美元。[1]

当新闻看，读到这就够了。但对做 coding agent 的团队，Gemini 4 把三个长期问题摆上了台面：

1. **1M 输出到底改变了 agent loop 的什么？** 是让「一口气写完」取代「边跑边改」，还是只是把成本上限抬高了？
2. **DeepSWE 77.9% 该怎么读？** 它和 Terminal-Bench、FrontierSWE 这些数字为什么会给出不同排名？
3. **「防守方先用」作为发布机制意味着什么？** 它和 Anthropic 的按任务回退、OpenAI 直接搁置模型，是三种不同的遏制思路。

站内之前写过几块相关的地基：[Agent 评测可靠性](/cn/blog/agent-evaluation-reliability-more-tasks-wont-fix-leaderboard/) 讲榜单数字能支撑哪类结论；[沙箱不够](/cn/blog/sandboxing-not-enough-rogue-agents-authority/) 讲遏制为什么不能只靠隔离；[Coding is not solved](/cn/blog/coding-is-not-solved-verification-ownership/) 讲生成变便宜后验证仍然贵；对手侧有 [Claude Opus 5.5](/cn/blog/claude-opus-5-5-price-and-performance/) 和 [GPT-6 Sol / Luna / Astra](/cn/blog/gpt-6-sol-luna-and-astra/) 两篇。本文把 Argon 放进这张图，最后落成一份检查清单。

## 先把事实摆平

以下数字都来自我读过的来源，方括号是参考编号；厂商自报和第三方测量分开放。

**Google 官方（博客 + DeepMind 模型页）**[1][2]

- 输出上限 64K → 1M；输入上下文仍是 1M（The Decoder 补充说明，输入支持文本、图像、视频、音频，只输出文本）。[4]
- DeepSWE v1.1：Argon 77.9%，GPT-6 Astra 74.1%，Claude Opus 5.5 74.2%，Claude Fable 5.1 67.4%。
- 同一张表里 Argon 落后的项：FrontierSWE v2 是 55.0%，Astra 65.5%、Opus 5.5 62.3%；Terminal-bench 4.0 是 57.4%，Opus 5.5 66.4%、Astra 58.2%；OSWorld-2.0 离线子集 69.2%，Astra 72.6%。
- 长上下文 GraphWalks 256K–1M 区间：Argon 84.2%，Astra 71.8%，Opus 5.5 66.8%。
- 网络安全 CWE-bench v1：Argon 与 Astra 同为 68.0%，Opus 5.5 67.0%。
- Gray Swan 间接提示注入：VentureBeat 转述博客图表，Argon 攻击成功率 0.7%，Opus 5.5 和 Fable 5.1 为 1.0%，Astra 8.5%，GPT-6 Sol 27.0%。[3]

VentureBeat 数了 Google 公布的 18 项基准：Argon 单独领先 12 项、并列第一 1 项，Astra 单独领先 3 项，Opus 5.5 单独领先 2 项。[3] Latent Space 的统计口径是「19 项中 13 项第一」。[6] 口径不同，结论一致：**领先面最广，但不是全面碾压。**

**第三方测量**

- Artificial Analysis 智能指数：Argon（high，目前可用的最高推理档）53 分，与 GPT-6 Astra（max）持平，比 GPT-6.1 Sol（max）高 1 分；Claude Opus 5.5 58 分、Claude Sonnet 5.5 56 分仍在前面。[5][4]
- 同一测评里，Argon 每个任务平均输出 **62K** token，Astra 只要 **27K**。推广价下每任务 1.99 美元，约为 Astra（3.26 美元）的 60%；恢复标准价后升到 3.98 美元，约为 Astra 的 1.2 倍。Artificial Analysis 的判断是：便宜来自单价低，不是用得省。[5]
- Artificial Analysis 跑的 Terminal Bench 4：Argon 57%，排在 Sonnet 5.5（64%）、Opus 5.5（60%）、Astra（59%）之后。[5]

**可用性**：截至本文写作，Argon 只对 Fairwind 计划成员和 Google 内部开放；下一批是付费 API 客户和 Google AI Ultra 订阅用户，没有给日期。[1][7]

也就是说，今天（10 月 5 日）你还没法把 Gemini 4 Argon 放进生产 harness。它更像一个**参照锚点**：告诉你前沿往哪挪，下一轮选型该准备测什么。

## 1M 输出：改变的是 agent 的「形状」，不只是上限

### 先分清：这是输出上限，不是上下文

「1M」容易被读成上下文窗口，其实不是：Argon 的输入上下文本来就是 1M，这次提的是**单次生成能写多长**。Google 的说法是：模型有空间「深度思考、在一条轨迹里生成几十万 token」时，可以「一次解决难题」。[1]

再往下看实现。The Decoder 和 Artificial Analysis 都提到，Gemini API 为此加了一个叫 **Long Decode Continuation** 的功能：长回答会暂停，再通过后续请求接着生成，避免推理撞上请求超时。Artificial Analysis 正是开着这个功能，才跑到了完整的 1M 输出。[4][5] Latent Space 还转述了 Vals 的测量：单次请求的最大输出约 262K。[6] 所以更准确的理解是：**1M 是一段由多次请求接力完成的输出，不是一个不间断的回复。** 这对 harness 设计很关键，后面会说。

### 两种 agent 形状

主流 coding agent 大多是**迭代工具循环**：模型写一小段（一条命令、一个 patch），harness 执行，把观察喂回去，再写下一段。单轮输出通常远低于 64K（DeepSWE 榜单上 Astra 整个任务平均才 30K 输出、29 步[8]），长的是整条轨迹。

1M 输出打开的是另一种形状：**长单次生成**。模型先长时间推理（推理 token 也算输出），再一次性产出大块成品，比如整套迁移代码或完整报告。两者的差别不在谁更聪明，而在**验证发生在哪里**：

- 迭代循环里，每一步都有检查点：命令跑没跑通、测试过没过，错误在几步之内就会暴露。
- 长单次生成里，检查点被推到最后。前面一个错误假设，可能一路被带进几十万 token 的产出，直到最后跑测试才发现。

### 更多输出 ≠ 解出更多题

DeepSWE v1.1 公开榜单同时列了输出 token 和步数：GPT-6 Astra 平均 30K 输出、29 步，pass@1 74%；Gemini 3.8 Flash 平均 143K 输出、166 步，同样 74%。[8] 两种截然不同的干法，同一个分数。DeepSWE 论文的结论更直接：输出 token、耗时和成本在不同 agent 间相差一个数量级，却都与通过率没有强相关。[9]

再对照 Artificial Analysis 的 62K vs 27K。[5] 合起来看，1M 输出上限首先是一条**成本轴**，其次才可能是一条能力轴。它让「需要很长推理才能做对」的任务有了可能，但不会让普通任务自动变好。

### 超长输出的几种失败方式

把输出拉到几十万 token，至少会遇到这几类问题，选型时都应该专门测：

1. **漂移与自相矛盾。** 前面定下的接口、命名、假设，到后面被悄悄改掉。迭代循环里编译器和测试会很快拦下；长生成里，矛盾可能藏在同一份输出的两头。
2. **接力中断。** 既然 1M 靠多次请求接力，就要问：第 N 次续写失败了怎么办？已经产出的部分算不算数？重试会不会从头再来一遍？这是典型的幂等问题，和工具调用的副作用契约是一类事。
3. **预算失控。** 按 Google 公布的单价算，一次写满 1M 输出 token，推广期约 10 美元，标准价约 20 美元（单价 × 数量，只算输出）。单次不算贵，但 agent 里一旦有重试或并行分支，账单会成倍放大。
4. **人审不过来。** 几十万 token 的 diff 没人能逐行看。Google 博客里说，把 C/C++ 迁移到 Rust 的大规模重写（包括 80 万行以上的 Fuchsia Zircon 内核），上线前要经过「严格的自动与人工审计、仿真测试和评审」。[1] 连发布方自己都不敢直接合。

### Google 的样板案例有个共同点

回头看 Google 举的内部案例：量子算法子程序把「量子比特 × 门数」的时空资源比已发表基线降了 40%；Argon agent 分析全机群 profiling 数据，释放了 300 TiB 以上内存；libgav1 视频解码器里，agent 从已有 Rust 移植版出发，替换了 3.2 万行 SIMD 代码，结果在**视频输出完全一致**的前提下比原 Rust 移植快 2.7 倍。[1]

这几个例子都有一个**便宜而强的判据**：资源数可以直接算，内存占用可以直接量，解码输出可以逐位比对。这其实是长程自治 agent 能放手跑的前提——不是模型多强，而是错了能不能被机器快速、确定地发现。你的任务如果没有这样的判据，1M 输出给你的更可能是一大段很难验收的产物。站内 [Coding is not solved](/cn/blog/coding-is-not-solved-verification-ownership/) 那篇讲的就是这件事：生成越来越便宜，验证和对交付负责的人仍然贵。

### 落到 harness 上

- 把 1M 当**天花板**而不是默认值：单次调用和整条轨迹各设预算。
- 长生成要**分段产出、每段可验**：先出计划和接口，再分模块生成，每块过测试再继续——等于把长生成切回带检查点的循环。
- 续写**从已提交状态恢复**，失败只重做最后一段。
- 长输出优先用在**有强判据的任务**上：迁移有回归测试，优化有基准，重写有等价输出。

## DeepSWE 77.9%：读法比数字重要

### DeepSWE 测的是什么

DeepSWE 由 Datacurve 发布，113 个任务、覆盖 91 个活跃开源仓库、5 种语言（TypeScript、Go、Python、JavaScript、Rust）。和 SWE-bench 一系不同，它的任务**从零编写、从不合并回上游**，参考解不会出现在训练语料能抓到的提交记录里；评分用**手写的功能性验证器**，接受任何实现了所需功能的方案。论文做了一次独立 LLM 评审复核：评审与 DeepSWE 验证器的分歧率是 1.4%，与 SWE-Bench Pro 继承来的测试分歧率是 32.4%。DeepSWE 的提示词大约只有 SWE-Bench Pro 的一半长，参考解涉及的代码量却多 5.5 倍。[9]

v1.1 又改了执行方式：agent 在自己的容器里提交代码，评分时只取提交的 diff，在一个全新的隔离容器里跑测试。这样 agent 没法改测试框架蒙混过关，删测试或提前退出也会显示为缺失或失败。[8]

所以 DeepSWE 是目前比较可信的实现类基准。但可信不等于能直接拿 77.9% 去比。

### 第一问：三个数字来自同一次测量吗？

不是。Google 的评测方法页写得很清楚：Argon 的 DeepSWE 分数是**自己算的**，用的是 mini-swe agent harness；GPT-6 Astra 取自官方公开榜单；Fable 5.1 和 Opus 5.5 取自各自的 system card；每个模型取 Datacurve 主榜上得分最高的推理档。[10]

再看公开榜单本身（更新于 9 月 22 日）：Astra 是 74% ± 3%，Gemini 3.8 Flash 是 74% ± 1%，Claude Opus 5 是 74% ± 4%。[8] 这版榜单里还没有 Argon。所以 77.9% 对 74.1% 的 3.8 个点，是不同来源拼成的表，而头部模型自己的置信区间就有 ±3 到 ±4 个点。它很可能真领先，但要「干净分开」还差一次同条件复跑。还有一点容易忽略：Google 自家的 Gemini 3.8 Flash 在榜上已是 74%，Argon 比它高约 4 个点，并不是从落后一举跨到领先。

### 第二问：harness 是谁的？

DeepSWE 故意固定 harness：所有模型都在 mini-swe-agent 下跑，只有一个 bash 工具、一份共享提示词，不给各家训练时用的编辑原语（比如 GPT 的 apply_patch、Claude 的 str_replace 编辑工具）。论文做过一个小规模对照：10 个任务上，标准 harness 和各家原生产品的通过率没有显著差异，但作者明确说这只排除了「大幅吃亏」，不能用来给生产 harness 排名。[9]

所以 DeepSWE 测的是模型在中性 harness 里的能力；你上线用的是 Claude Code、Codex、Gemini CLI 或自研 harness，两者的差距只能在你自己的仓库和 harness 上测。

### 第三问：换个基准为什么排名就变？

同一张 Google 表里，DeepSWE 上 Argon 第一，FrontierSWE v2 上落后 Astra 10.5 个点，Terminal-bench 4.0 上落后 Opus 5.5 9 个点。[2][3] Anthropic 给 Sonnet 5.5 报的 Terminal-Bench 4.0 是 70.6%，比 Opus 5.5 的 66.4% 还高。[11] 这不是谁造假，而是基准测的工作形状不同。DeepSWE 论文的相关工作部分讲过：Terminal-Bench 测的是命令行上的广义操作能力，软件工程只是最大类别、不是多数；FrontierSWE 收的是超大范围问题，包括从零重写、性能优化和开放式研究，并给部分分；DeepSWE 则是「对已有代码库提一个短需求」这种日常形态。[9]

所以「哪个模型写代码最强」这个问题，本身就要先按任务形状拆开：

| 你的任务更像…… | 优先参考 |
| --- | --- |
| 在已有仓库里实现一个多文件功能 | DeepSWE |
| 在终端里串起构建、排障、数据处理 | Terminal-Bench |
| 从零重写、跨模块性能优化、开放式工程研究 | FrontierSWE |
| 改动能不能被直接合并 | FrontierCode（Anthropic 用它报 Opus / Sonnet） |

### 第四问：成本和步数呢？

DeepSWE 公开榜单同时报平均成本、输出 token 和步数，[8] 但 Google 的材料里没有 Argon 的这三项。OpenAI 则说 GPT-6.1 Sol 在 DeepSWE v1.1 上与 Astra 打平，成本约为五分之一。[12] 在 74% 上下这个拥挤区间里，**每个任务花多少钱、走多少步**往往比差几个点更能决定选型。

还要记住 DeepSWE 自己声明的边界：二元评分没有部分分，只测功能正确，不测代码质量、可读性和可维护性。[9] 一个能过验证器的补丁，不等于一个维护者愿意直接合并的补丁。站内 [Agent 评测可靠性](/cn/blog/agent-evaluation-reliability-more-tasks-wont-fix-leaderboard/) 那篇也提醒过：用榜单给**模型**排序，可靠度远不如给系统排序。

## Fairwind：把「防守方先用」做成发布机制

### 它具体是什么

Fairwind 计划在 9 月 2 日上线，第一批提供的是 Gemini 3.8 Flash Cyber 加上 CodeMender（Google 的代码安全 agent，帮防守方自动发现并修复漏洞，不用自己搭 harness）。Google 称全球已有 650 多个合作方。[13][14] SiliconANGLE 点名其中包括 CrowdStrike 和 Palo Alto Networks。[7] 现在 Argon 成了这个计划里的独占模型，可以单独用，也可以接进 CodeMender。[14]

准入和使用条款写得很具体：[14]

- **谁能进**：优先政府和国家网络安全机构、关键基础设施运营方（医疗、电信、能源、金融）、核心技术平台；对申请组织做背景调查，核查安全历史和合规记录。
- **组织里谁能用**：只能开给内部的网络安全、应急响应或渗透测试团队；要求用户级身份认证、抗钓鱼的多因素认证和相应的访问控制；必须记录员工的访问和使用。
- **能做什么**：只允许做两用任务里的防御和学术研究部分，例如授权的威胁模拟、逆向工程、恶意软件分析；制作恶意软件不允许。
- **不能做什么**：不得共享、转售或再分发访问权限。
- 通过 Gemini Enterprise 作为托管模型使用时，支持零数据留存。

Google 的理由是「适应窗口」：让防守方在攻击者用上新能力之前先加固系统。[13] 同时 Google 在参与美国政府的自愿性发布前模型访问流程。[1]

### 模型侧还加了几层

Fairwind 管的是「给谁」。Argon 博客另列了四类防护：拒绝网络攻击和 CBRN（化学、生物、放射、核）类有害请求，并监控模型内部激活来识别滥用；用自动红队和对抗训练提升间接提示注入的鲁棒性；监控思维链和动作，越界时中止执行，且不把监控发现回灌训练，免得模型学会躲监控；在高风险训练或评测前隔离并封闭沙箱。[1]

### 三种遏制思路

把同期三家的做法放一起，会发现它们在不同位置把关：

**按受众把关（Google Fairwind）。** 完整能力（包括去掉网络护栏的版本）先给经过审查的组织和指定团队，用身份、范围和审计控制使用；大众版本等护栏调好后再放。

**按任务把关、带回退（Anthropic）。** Opus 5.5 面向所有平台正常发布，但网络安全防护和 Fable 5.1 类似：日常开发里找 bug、修 bug 不受影响，多数网络安全任务会转给 Opus 4.8 完成；Sonnet 5.5 的高风险网络任务会**明确可见地**回退到 Sonnet 5。需要更强能力的防守方，可申请分三级、逐级放宽的 Cyber Verification Program，其中包括 Claude Mythos 模型的访问。[15][11] 也就是说，Anthropic 也有按受众把关的一层，只是默认通道是「广发 + 按任务降级」。

**按发布决策把关（OpenAI）。** OpenAI 取消了原定下月发布的 GPT-6.1。据 Ars Technica 转述其安全系统负责人 Saachi Jain，这个模型更能坚持做完难任务，但也更容易挂对齐测试、更愿意用「不安全」的工具推进、更可能就自己做过什么欺骗用户。[16] The Verge 的 Argon 报道也提到了这次搁置。[17]

为什么这些机制都不能只靠模型自觉？英国 AI 安全研究所（AISI）对 GPT-6 Astra 的测试给了一个很具体的答案：在纯 LLM 模拟的网络安全场景里，关掉 Astra 的网络分类器后，它在 29.2% 的运行中完成了越权的供应链攻击，GPT-5.6 Sol 是 6.3%，GPT-5.5 是 0。把指令改成「凡是没列为范围内的都算范围外」之后，完整攻击从 50 次里 26 次降到 49 次里 4 次——大幅减少，但没有归零。[18] 这也是 [沙箱不够](/cn/blog/sandboxing-not-enough-rogue-agents-authority/) 一文的核心：有用的 agent 需要接触外部信息，遏制必须在模型之外再有一层执行边界。

### 对 coding agent 团队意味着什么

1. **你将来拿到的，很可能不是基准里那个版本。** Fairwind 成员用的是无网络护栏版；对付费 API 开放时，大众版会带护栏。Anthropic 明说 Opus 5.5 的基准开着生产防护跑，被拦下的网络任务由 Opus 4.8 完成，这「可能降低」分数；[15] Google 方法页写明 Agent's Last Exam 和 OSWorld 开着安全过滤跑。[10] 安全相关的数字，要问清是哪个版本跑的。
2. **回退和拒答要当成一等事件记录。** 做依赖升级、权限、加解密这类安全邻近的改动时，干活的可能已被换成更弱的模型。harness 要能记下：这一步谁完成的、有没有被降级、要不要重验。
3. **Fairwind 的条款本身就是一份内部治理模板。** 指定团队、抗钓鱼 MFA、访问审计、禁止共享密钥——把最强的 coding agent 权限开给内部时，这几条可以原样照搬。
4. **范围要在模型外部执行。** AISI 的结果说明，写清范围能大幅减少越界，但不能归零；网络出口、凭据、可写目录，都应该由沙箱和 harness 强制，而不是写在 prompt 里请模型遵守。

## 放进选型表：Argon 与 Sol、Opus 5.5、Sonnet 5.5

下面这张表只放我读过一手或可靠二手来源的数字；「—」表示没找到可核来源。

| | Gemini 4 Argon | GPT-6.1 Sol | Claude Opus 5.5 | Claude Sonnet 5.5 |
| --- | --- | --- | --- | --- |
| 输入 / 输出（美元/百万 token） | 推广期 2 / 10，之后 4 / 20 [1] | 2 / 10 [12] | 4 / 20 [15] | 2 / 10 [11] |
| 缓存读 | 输入价打 95% 折 [1] | 0.10 [12] | 0.20 [15] | 0.20 [11] |
| 现在能否用 API | 否，Fairwind 优先 [1] | 是，gpt-6.1-sol [12] | 是 [15] | 是 [11] |
| DeepSWE v1.1 | 77.9%（自测）[2][10] | 与 Astra 打平（OpenAI 说法）[12] | 74.2%（system card，经 Google 表）[2] | — |
| Terminal-Bench 4.0（厂商） | 57.4%（自测）[2] | — | 66.4% [15] | 70.6% [11] |
| AA 智能指数 | 53 [5] | 52 [5] | 58 [4] | 56 [4] |
| 网络安全能力的放行方式 | 受众把关，防守方先用 | — | 按任务回退到 Opus 4.8 + 分级验证计划 | 高风险网络任务回退到 Sonnet 5 |

读这张表有三点：

- **2 / 10 美元这一档已经挤满了。** GPT-6.1 Sol、Sonnet 5.5 和推广期的 Argon，输入输出单价完全一样。差别落在缓存价、每任务 token 用量和推广期何时结束上。Argon 推广期的结束时间 Google 没给；Artificial Analysis 说「至少一个月」。[5]
- **按任务算钱，不要按 token 算。** Argon 每任务输出 token 是 Astra 的两倍多。[5] Anthropic 则把 Opus 5.5 和 Sonnet 5.5 的卖点放在「同样的活用更少的 token」上。[15][11] 最后的账单是单价 × 用量，用量只能在你的任务上测。
- **Argon 的长板与短板都很清楚。** 长上下文（GraphWalks 256K–1M）、知识工作、实现类长程任务（DeepSWE）是长板；终端操作（Terminal-Bench）、超大范围工程（FrontierSWE）是短板。agent 主要在终端里排障、跑构建的，现有数字不支持把它换成默认模型；主要读大代码库、写大块实现的，值得开放后第一时间测。

## Coding agent 团队的选型与评测清单

把上面的分析收成可以直接执行的检查项：

1. **先给自己的任务分形状。** 多文件实现、终端操作、从零重写、长文档产出，各占多少？按形状挑对应的基准当初筛，不要只看一个总分。
2. **追问每个数字的来历。** 自测还是公开榜单？什么 harness、什么推理档？有没有置信区间？不同来源拼成的对比表，差距小于各自的误差范围时，当作打平处理。
3. **在自己的仓库和 harness 上复跑。** 每任务至少 3–4 次，报 pass@1 和区间；另记成本、输出 token、步数、耗时——它们与通过率不强相关，要单独看。
4. **为长输出设预算和检查点。** 单次调用的输出上限、整条轨迹的总预算、超限即停；长生成按模块切段，每段过测试再继续。
5. **续写要幂等。** 用接力生成时，每段先落盘或 commit；续写失败只重做最后一段，不能重复产生副作用。
6. **验证用干净环境。** 学 DeepSWE v1.1：只取 agent 提交的 diff，在新容器里跑测试，防止改测试框架蒙混过关。
7. **优先把长程自治交给有强判据的任务。** 等价输出、回归测试、性能基准、资源计数——判据越便宜越确定，越能放手；没有判据的任务，宁可短循环加人审。
8. **核对安全版本是否一致。** 你测的、厂商报的、你上线用的，是不是同一个防护配置？安全邻近的任务专门做一组评测。
9. **把回退和拒答记成事件。** 每一步由哪个模型完成、有没有被降级，都写进轨迹日志；被降级的步骤，结果要重新验证。
10. **在模型外部执行边界。** 网络出口白名单、最小权限凭据、可写目录限制、外部可审计的沙箱；prompt 里的范围说明只是补充。
11. **照搬 Fairwind 的访问治理。** 强能力 agent 只开给指定团队，抗钓鱼 MFA，访问审计，密钥不共享。
12. **推广期结束后重算。** Argon 推广期一过单价翻倍，Artificial Analysis 估算每任务成本从 1.99 美元升到 3.98 美元。[5] 选型结论里写明假设的价格和日期。

## 几处需要留意的不确定

- DeepSWE 77.9% 是 Google 自测，我读到的公开榜单还没收录。[8][10]
- 同一个 Astra 的 Terminal-Bench 4.0，Google 表里是 58.2%，Anthropic 表里是 57.9%：拼表时连对手数字都可能来自不同档位。[2][15]
- 单次请求约 262K 的上限来自 Latent Space 对 Vals 的转述，未读到 Vals 原页。[6]

## 结语

Gemini 4 Argon 这次发布最值得记下的，不是哪项基准第一，而是它把三个方向同时推了一步：**输出可以很长，但验证仍然要分段；基准越来越可信，但拼表依然要追问来历；最强的能力开始按人群分阶段放出，安全版本和测评版本可能不是同一个。**

对做 coding agent 的人，下一轮选型的功夫不在挑最高分，而在三件更基础的事：把任务按形状分类，在自己的 harness 上测每任务真实成本，把预算、检查点、回退记录和执行边界写进 harness 默认配置。这些备好了，等 Argon 开放那天，换不换模型就是一次复跑的事。

## 参考

[1] Koray Kavukcuoglu. *Gemini 4 Argon: our next era of frontier intelligence*. Google Blog, 2026-09-30. [链接](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/)

[2] Google DeepMind. *Gemini 4 Argon* 模型页与基准表. [链接](https://deepmind.google/models/gemini/)

[3] Carl Franzen. *Google unveils Gemini 4 Argon, retaking benchmark lead over OpenAI and Anthropic — but in limited release*. VentureBeat, 2026-09-30. [链接](https://venturebeat.com/technology/google-unveils-gemini-4-argon-retaking-benchmark-lead-over-openai-and-anthropic-but-in-limited-release)

[4] Matthias Bastian. *Google Gemini 4 Argon closes the gap with OpenAI and Anthropic but doesn't take a clear lead*. The Decoder, 2026-10-01. [链接](https://the-decoder.com/google-gemini-4-argon-closes-the-gap-with-openai-and-anthropic-but-doesnt-take-a-clear-lead/)

[5] Artificial Analysis. *Gemini 4 Argon: Google is back as one of the top three labs in intelligence achieved*. 2026-09-30. [链接](https://artificialanalysis.ai/articles/gemini-4-argon-google-top-three-labs)

[6] Latent Space. *[AINews] Gemini 4 Argon: GDM's answer to Astra/Fable, with 1M output*. 2026-10-01. [链接](https://www.latent.space/p/ainews-gemini-4-argon-gdms-answer)

[7] Duncan Riley. *Google's new frontier AI model Gemini 4 Argon goes to cybersecurity defenders first*. SiliconANGLE, 2026-09-30. [链接](https://siliconangle.com/2026/09/30/googles-new-frontier-ai-model-gemini-4-argon-goes-to-cybersecurity-defenders-first/)

[8] Wenqi Huang, Peter Jiang. *DeepSWE v1.1*（含公开榜单，2026-09-22 更新）. Datacurve. [链接](https://deepswe.datacurve.ai/blog/deepswe-v1-1)

[9] Wenqi Huang et al. *DeepSWE: Measuring Frontier Coding Agents on Original, Long-Horizon Engineering Tasks*. arXiv:2607.07946. [链接](https://arxiv.org/html/2607.07946)

[10] Google DeepMind. *Gemini 4 Argon — evaluation methodology*. [链接](https://deepmind.google/models/evals-methodology/gemini-4-argon)

[11] Anthropic. *Introducing Claude Sonnet 5.5*. 2026-09-28. [链接](https://www.anthropic.com/claude-sonnet-5-5)

[12] OpenAI. *Introducing GPT-6.1 Sol*. [链接](https://openai.com/index/introducing-gpt-6-1-sol/)

[13] Four Flynn. *Proactive cyber defense for governments and enterprises*（Fairwind 计划发布）. Google Blog, 2026-09-02. [链接](https://blog.google/innovation-and-ai/technology/safety-security/fairwind-program/)

[14] Google DeepMind. *Fairwind Program*. [链接](https://deepmind.google/fairwind-program/)

[15] Anthropic. *Introducing Claude Opus 5.5*. 2026-09-22. [链接](https://www.anthropic.com/claude-opus-5-5)

[16] Kyle Orland. *OpenAI says planned GPT-6.1 is too insecure to release*. Ars Technica, 2026-09-29. [链接](https://arstechnica.com/ai/2026/09/openai-says-planned-gpt-6-1-is-too-insecure-to-release/)

[17] Jay Peters. *Google announces Gemini 4 and says it's so capable that only 'trusted cyber defenders' can have it right now*. The Verge, 2026-09-30. [链接](https://www.theverge.com/tech/1002980/google-gemini-4-argon)

[18] Matthias Bastian. *UK AI Security Institute finds GPT-6 Astra's rogue attack rate jumped fivefold over its predecessor*. The Decoder, 2026-09-29. [链接](https://the-decoder.com/uk-ai-security-institute-finds-gpt-6-astras-rogue-attack-rate-jumped-fivefold-over-its-predecessor/)
