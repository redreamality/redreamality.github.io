---
title: "JitMem：别在写入时就把记忆蒸干"
description: "解读 arXiv:2609.27334 JitMem：多数 agent 记忆在写入时蒸成固定反思/技能，查询未知就不可逆丢信息；读时再按当前任务合成 payload，可用即时任务成功训 curator（如 GRPO）。相对最强写入基线 ALFWorld/WebShop/τ²-bench 成功率 +16.2/+16.3/+3.9；未训练 curator 也有竞争力。"
pubDate: 2026-10-01T10:40:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "memory", "developer-tools"]
lang: "zh"
---

Agent 记忆有用，前提是它能抬高**以后**的任务成功率。多数现成设计却在一条轨迹刚结束时，就把经验蒸成一份固定产物——反思、洞见、工作流、可执行技能或推理策略——再靠相似度检索塞进上下文。问题在于：**未来查询还没出现，你已经决定了什么值得留、什么可以扔。** 细节一丢就回不来；同一条轨迹对不同下游任务本可以教不同课，却被钉成一种讲法。[1]

Yefan Zhou、Yang Li、Zeyu Leo Liu、Semih Yavuz、Shafiq Joty 的预印本 [arXiv:2609.27334](https://arxiv.org/abs/2609.27334)（*Just-in-Time Memory: Learning to Curate Task-Adaptive Memory for LLM Agents*）把问题翻过来：**原始轨迹原样进库，等到读时、任务已知，再让 memory curator 按当前任务合成一份紧凑、任务自适应的 payload。** 系统叫 **JitMem**（Just-in-Time Memory）。因为 payload 马上被同一任务消费，curator 可以直接用即时任务成功当奖励训练（文中用 GRPO），不必为了制造延迟学习信号去人工把相关任务捆成一组。[1]

主结果先撂在桌上：相对各组最强写入基线，成功率绝对点数 **ALFWorld +16.2、WebShop +16.3、τ²-bench +3.9**。更刺眼的是——**连未训练的 curator** 就已能与强写入方法打平甚至反超；读时 framing 本身就是大头，训练是在正确时间轴上再加一档。[1]

本篇是机制文：写入时 curation 贵在哪、读时流水线怎么拆、数字与消融怎么读、和站内 [Jev-Mem](/cn/blog/jev-mem-system-one-agentic-memory/) 差在哪一刀（一刀是**何时 curation**，一刀是 **System One 类型化记忆控制**——别混）。不占 Jev 周配额；Jev-Mem 只作对照交叉链。

## 写入时 curation：两个结构性代价

主流写法差异很大：Reflexion 式口头反思、Expel 式洞见、Generative Agents 式记忆流与周期摘要、Voyager 式可执行技能、Agent Workflow Memory 式工作流、MemP 式多粒度记忆项、ReasoningBank 式可迁移推理策略、以及靠预测误差决定「什么值得蒸」的自适应写入，等等。作者把它们收成两条共性：

1. **Curation 触发在写入时**——任务一结束就蒸馏。  
2. **入库产物与查询无关**——在任何未来任务到来之前就定稿。[1]

两笔结构性账。第一，**信息损失过早且不可逆**：写时扔掉的细节，后来任务若正需要，库里已经没有。第二，**一份固定产物要伺候多种未来查询**：同一条家务轨迹，可能既教「加热/冷却」的状态转移，也教「把东西放到哪」的放置策略；写时只能押一种抽象。根因同一句：**curation 发生在下游任务已知之前**。[1]

学习侧更麻烦。写入决策的价值往往要等很久以后某次检索命中才显露——**长程 credit assignment**。SkillOS 一类学出来的写入 curator，因此要靠**相关任务分组**制造延迟信号；论文明确写，分组本身对性能贡献很大。JitMem 的主张不是「蒸馏文案写得不够好」，而是**时间轴选错了**。[1]

对照站内叙事会更清楚：

- [扩张 Harness，而不是堆上下文](/cn/blog/grow-the-harness-not-the-context/)：反复出现的控制决策适合沉进可执行代码，而不是每次塞更长 prompt。JitMem 问的是另一面——**经验本身何时被塑形**。  
- [Progressive Disclosure 与 Agent Skills](/cn/blog/progressive-disclosure-agent-skills/)：技能库太大时先露 frontmatter、按需加载，管的是**包装与披露带宽**。JitMem 管的是**同一条原始经验能否按任务再蒸馏一次**——技能打包与情节记忆不是同一层。  
- [GitHub Copilot 的记忆栈](/cn/blog/github-copilot-memory-agentic-coding-stack/)：产品侧在长记忆、规划、任务拆解；机制上仍要回答写时摘要还是读时合成。产品有记忆不等于选对了 curation 时点。

相关工作里还有「会话内工作记忆」线（Sculptor、ContextCurator、MemSearcher 等）：用 RL 管**单次任务执行中**越积越长的观测历史。JitMem 管的是**跨任务的持久情节库**，不是窗口内压缩。另有若干「测试时再处理上下文」的工作：有的直接检索整段轨迹当 exemplar 却不按新任务蒸馏；有的条目仍在写时蒸好、读时原样返回；concurrent 的 MemHarness 也做读时 curation，但把 curation 与执行缠在同一策略里，训完不易跨 executor 迁移。JitMem 刻意解耦 curator 与 executor，并挂在可持续增长的 streaming bank 上。[1]

## JitMem 流水线：Retrieve → Curate → Execute → Update

设定是流式任务：agent 依次接到 \(x_1,x_2,\ldots\)，每步与环境交互得到轨迹 \(\xi_t=(o_1,a_1,\ldots)\) 与任务成功奖励 \(r_t\in[0,1]\)。JitMem 四件套：**记忆库** \(\mathcal{M}\) 存完整未抽象轨迹、**检索器** \(\mathcal{R}\)、**可训练 curator** \(\pi_\phi\)、**冻结的 executor** \(\pi_L\)。只有 curator 可训；目标是最大化累计任务成功 \(\sum r_t\)。[1]

每步四拍：

1. **Retrieve**：\(\hat{\bm{\xi}}_t=\mathcal{R}(x_t,\mathcal{M}_t)\)。实现上用 BM25，**只对任务描述**打分（不扫整段轨迹内容），取 top-\(k\)；主文 \(k=3\)（附录对 \(k\in\{3,5\}\) 不敏感）。检索器不训，训练与测试同一套，也方便和基线对齐。框架本身不绑死 BM25。  
2. **Curate**：\(p_t=\pi_\phi(x_t,\hat{\bm{\xi}}_t)\)。结构化 prompt：当前任务 + \(k\) 条原始轨迹。输出自然语言 briefing——点出相关经验、抽出策略、给**本任务**具体指引。因为 \(p_t\) 依赖 \(x_t\)，同一条入库轨迹对不同任务会蒸出不同 payload。  
3. **Execute**：\((\xi_t,r_t)=\pi_L(x_t,p_t)\)。冻结 executor 把 \(p_t\) 接到 prompt 前缀里行动；**不直接吞原始轨迹**。同一 executor 兼作 LLM-as-judge。  
4. **Update**：payload **不入库**；只考虑把 \(\xi_t\) 写回。部署没有 ground-truth 成功标签时，用 judge 门控：判定成功才 append。意图是让检索到的演示尽量是正例。[1]

认知科学侧，作者借「情节记忆是重构的、受当前目标与线索塑造，而不是原样回放」（Schacter & Addis）作类比——读时 curation 正是按当前任务重构。[1]

训练细节值得单独说清。为让奖励只反映 payload 质量、不被「库里碰巧有什么」淹没，他们先用裸 executor 在训练集跑一遍，用**真实成功标签**留下成功轨迹，做成**固定训练库**，全程 GRPO 都对着这座库。部署时库从空开始在线增长，因此存在温和的 train/test 分布差：训练库是裸 executor 轨迹，测试库会混入 curator 增强后的轨迹。消融里用 staged bank refresh（100 步后重建库再训 50 步）补过一小截，增益有限。[1]

评估默认测试序列开头库为空（cold start）；任务按 batch 共享库状态、batch 结束后更新（ALFWorld/WebShop batch=10，τ²-bench batch=5）。任务成功用基准 ground-truth；入库门控用 LLM judge，避免真标签漏进库。报告对多种随机任务顺序取均值 ± 标准差。[1]

附录还给出分基准的 curator 提示：ALFWorld 强调找物与动作顺序；WebShop 强调搜索措辞、属性选择与价格约束，并明确「别假设旧商品还在、别死盯 product ID」；τ²-bench 强调按策略走的有序计划（读工具 → 用户确认 → 策略条件 → 写工具），且**禁止照抄**预约号、用户 ID 等具体标识——必须对本案现查。这些提示本身就是「读时 briefing 该长什么样」的工程样本。[1]

## 为什么读时更好训：即时奖励，不必捆任务

对每个训练任务，curator 对同一组检索结果采样 \(G\) 个候选 payload（文中 group size 8）；冻结 executor 各跑一遍，拿基准原生指标当 \(r\)（ALFWorld / τ²-bench 二元成功，WebShop 连续分）。GRPO 用组内相对优势 \(\hat{A}_i=r^{(i)}-\mathrm{mean}_j r^{(j)}\) 更新 curator（文中省略标准差归一化），**不加 value network**。关键性质：\(r_t\) 是**同一步 payload 的直接函数**，curator 动作与奖励之间没有时间缝——credit assignment 塌成单步。[1]

写入时则相反：步 \(s\) 的存储决策，要等未来 \(t>s\) 某次检索命中才打分。读时设计因此同时省掉「延迟回报机器」和「为制造信号而做的任务分组」。训练超参见附录：学习率 \(1\times10^{-6}\)、100 步、batch 32、KL 系数 \(10^{-3}\) 等；单次训练大约 ALFWorld 21 小时、WebShop 27 小时（8×H200）。曲线上验证成功率稳步升、executor 回合数稳步降——单任务奖励、无辅助内容质量奖励、无分组、无回报塑形，训练仍稳。[1]

Executor 冻结还有工程含义：**一个训好的 curator 可以挂到更强的 executor 上**，不必为每个执行模型重训记忆模块。这也是和 MemHarness 一类「记忆与执行缠死」设计的分界。[1]

## 主结果：相对最强基线 +16.2 / +16.3 / +3.9

评测三套：ALFWorld（具身文本控制，140 测例）、WebShop（网购，500 例）、τ²-bench（航空 / 零售 / 电信对话式工具使用；论文写作 τ²-bench / \(\tau^{2}\)-bench）。基线含无记忆、ReasoningBank、MemP、SkillOS（含 base / 强模型零样本 curator / RL 训 curator 等变体）。Executor 覆盖 Qwen3-8B、Gemini-2.5-Pro、GPT-5.4。训 curator：Qwen3-8B 初始化、关 thinking、GRPO 100 步，训练期 executor 也是 Qwen3-8B。[1]

摘要 headline 对应「相对各组最强基线的绝对成功率点数」：

| 基准 | 增益（绝对 SR 点） | 典型对照（论文表） |
| --- | --- | --- |
| ALFWorld | **+16.2** | Qwen3-8B executor：JitMem **77.4** vs SkillOS **61.2** |
| WebShop | **+16.3** | 同设定：JitMem **32.8** vs SkillOS **16.5** |
| τ²-bench | **+3.9** | GPT-5.4 executor：JitMem-gpt micro avg **75.6** vs ReasoningBank（GPT-5.4 curator）**71.7** |

读表时注意几层口径。第一，ALFWorld/WebShop 上「最强基线」在 Qwen 块里是 RL 训过的 SkillOS；τ²-bench 上则是训练免费的 ReasoningBank（GPT-5.4 curator），因为 τ²-bench **只报训练免费变体**——基准没有标准训练划分，合成训练数据仍是开放问题。第二，WebShop 同时报 Score 与 SR；headline 的 +16.3 是 **SR**，不是 Score（同设定 Score 从 SkillOS 的 40.6 到 JitMem 的 61.1，另算 +20.5）。第三，分域上看，τ²-bench 增益主要在 **Telecom（约 +11.0）**——多步策略校验更吃「程序性指引」；Airline / Retail 上多数记忆方法相对无记忆没有超出方差的提升，JitMem 与基线大致持平。作者读法：读时 curation 在需要**合成步骤指引**时最值钱，而不只是查一个事实。[1]

零样本对照同样关键。例如 WebShop 上，**未训练**的 JitMem-gemini（Gemini-2.5-Pro 作 curator）成功率 **61.0**，而同用 Gemini-2.5-Pro 的 SkillOS-gemini 约 **41.0**；ALFWorld 上 Qwen 作 curator+executor 时，JitMem-base 60.5，已压过 ReasoningBank 55.7 与 SkillOS-base 53.1。说明：**任务自适应的读时 framing 本身就是大头收益**；再训 curator 是在此之上加码。[1]

更强 executor 上，训好的 Qwen curator 仍能抬分：Gemini-2.5-Pro 作 executor 时 ALFWorld 86.2 vs SkillOS 80.2（+6.0）、WebShop SR 50.5 vs 41.3（+9.2）。弱 curator + 读时结构，有时还能压过强模型写时基线：GPT-5.4 作 executor 的 ALFWorld 上，JitMem-base（Qwen curator）**79.3**，高于用 GPT-5.4 蒸馏的 ReasoningBank **77.9** 与 SkillOS-gpt **70.0**。增益来自**何时 curation**，不单来自 curator 模型更大。[1]

无记忆基线他们刻意校准到「不高于 SkillOS 论文报告值」，避免自己的增益被虚高的对照抬起来——附录 Table 6 写明 reproduced ≤ reported。[1]

## 效率与迁移：更短上下文、更少步数、跨 executor

ALFWorld + GPT-5.4 executor 的 Table 4（输入 token 单位 K，每任务平均）：

| 方法 | In. Tok. | Out. Tok. | Steps |
| --- | --- | --- | --- |
| No Memory | 9.0 | 1.40 | 17.8 |
| ReasoningBank | 19.7 | 1.26 | 16.2 |
| SkillOS-base | 22.4 | 1.36 | 16.9 |
| JitMem-base | 10.9 | 1.00 | 13.2 |
| JitMem | 9.8 | 0.87 | 11.6 |

相对写入方法，JitMem 把 executor **输入 token 砍约 50.3%–56.3%**、**步数砍约 28.4%–31.4%**（相对 ReasoningBank / SkillOS-base）。相对自己的 untrained base，RL 后再削输入约 10.1%、输出约 13.0%、步数约 12.1%。记忆方法都会比无记忆多塞一点输入，但换来更少交互与更短输出；读时合成的 briefing 更密。[1]

Table 3（ALFWorld）：用 Qwen3-8B executor 训出的 curator，挂到 GPT-5.4 上达到 **86.7** SR；直接用 GPT-5.4 当训练期 executor 训出的 curator 为 **88.1**——**迁移缺口约 1.4 点**。一个 curator 服务多个执行模型，部署账更好算。[1]

## 消融：三块积木 + RL 到底在学什么

在读时框架内，三项设计各自独立贡献（先对 untrained base，再对 RL 版）：

1. **去掉任务条件**（curator 看不到 \(x_t\)，退化成与查询无关的摘要）：untrained 最多掉约 **3.1**（ALFWorld）/ **4.6**（WebShop）；RL 后缺口拉大到约 **11.4** / **10.4**——说明 RL 主要在学**怎么用任务信号**，而不只是压得更短。  
2. **不过滤、全量入库再贴成功/失败标签**（ReasoningBank / SkillOS 常见做法）：base 掉约 **1.5–2.9** / **2.3–3.4**。有标签也压不住失败轨迹噪音；**入库质量门**更干净。  
3. **写时先按 ReasoningBank 风格蒸馏再存蒸馏物**：base 掉约 **1.7–2.9** / **6.8–8.2**。写时承诺的与查询无关摘要，读时 curator **捞不回来**——WebShop 上丢 raw 最痛。[1]

再捅一刀：RL 版强制检索为空（「w/o retrieved traj.」）——成功率可掉约 **−14.8** / **−15.2**，甚至跌到 untrained base 附近或以下。说明 RL **不是在背参数知识当开卷小抄**，而是在学**如何蒸馏检索到的情节**。[1]

Staged bank refresh 在 WebShop 上给 Qwen executor 约 **+2.8** SR，Gemini 几乎不动，代价是额外训练；测试库用 100 条训练轨迹 warm-start，SR 变化最多约 1.3 且落在方差内。默认「空库起步 + 固定训练库」已经够用；别急着为 cold start 堆复杂预热。[1]

定性例子（Figure 3/4）：同一条过去经验被两个任务检索到——「把烫土豆放进冰箱」时 curator 突出状态转移（先加热再放）；「把报纸放到沙发」时转向放置校验。写时产物只能押一种 framing；读时从同一条 raw trace 蒸出两份 briefing。RL 前后对比则显示：训后 payload 会补上环境特定流程（例如先到台灯再 examine bowl），而这些流程并不写在 curation 提示词里——即时任务奖励把 curator 推向**任务相关的程序性语义**。[1]


## 读时 framing 为什么「不训也强」

很多人一听 GRPO 就先问训练细节。论文更想先钉住的主张是：**换时间轴本身就改了问题。** 未训练 curator 只是按提示、在已知 \(x_t\) 的条件下，从 raw 轨迹里现蒸 briefing；它没有在写时承诺「这一条轨迹的唯一正确抽象」。于是：

- 同一条轨迹可以今天教状态转移、明天教放置策略；  
- executor 吃到的是短而密的任务相关指引，而不是一坨与查询无关的通用技能散文；  
- 失败轨迹若被质量门挡在库外，检索噪声天然更低。

这解释了为何 JitMem-base / JitMem-gemini 能逼近甚至超过同容量的写时基线。RL 的角色是**加剧**这一优势——学环境特定流程、进一步压 token 与步数——而不是从零发明读时优势。消融「去掉检索」后 RL 优势塌掉，也从反面证明：训到的是蒸馏技能，不是换了个会做 ALFWorld 的小模型。[1]

对工程团队，这意味着一条便宜的试验路径：**先上读时零样本 curator（甚至直接用现有强模型当 curator），量一把相对写时摘要的成功率与 token；确认 framing 有增益，再决定是否为 curator 开 RL。** 不必一上来就搭分组课程与复合奖励。

## 写时蒸馏何时仍合理

JitMem 不是宣布写时蒸馏非法。写时产物在这些场景仍常见、也仍合理：

- **经验几乎只会以同一种方式被复用**（例如固定 SOP、合规话术模板），任务条件变化很小；  
- **存储与合规约束不允许长期保留 raw 轨迹**（隐私、客户数据、工具输出含密钥）——此时只能存脱敏摘要，读时也无 raw 可蒸；  
- **检索与延迟预算极紧**，多一次 curator 调用不可接受，只能检索短技能卡；  
- **技能库已经是「程序」而不是「散文」**——Growing Harness / Agent Skills 那条线：控制沉进代码后，读时再蒸自然语言 briefing 的边际变小。

更稳妥的折中是**双层**：raw（或可重放日志）作真源；写时摘要作索引与缓存；读时允许对命中的 raw 再蒸一次。JitMem 的消融警告的是：若**只**留写时蒸馏、扔 raw，任务自适应就封顶了。[1]

和 Progressive Disclosure 合读时：技能 frontmatter 解决的是「先露什么元数据」；JitMem 解决的是「命中后如何按本任务生成执行 briefing」。一个管目录带宽，一个管内容塑形时点——可以叠，不要互相替代。

## 定性 payload：家务、购物、客服各长什么样

附录给了三份示例 briefing，方便直觉对齐「任务自适应」长什么样。

**ALFWorld（清洁类）**：任务是「把干净盘子放到柜面」。Curator 从三条只部分相关的记忆里拼出：先柜面找盘 → 脏则去水槽洗 → 再放回柜面。它没有复述整段轨迹，而是抽出可执行顺序。

**WebShop**：任务带颜色 / 容量 / 价格约束。Curator 从「搜 T 恤 / 短裤并选色码」的旧轨迹里抽出**搜索措辞与选项点击策略**，并写明别假设旧商品还在。这是「策略迁移」，不是「复制上次买到的 SKU」。

**τ²-bench（Telecom，发不出 MMS）**：Curator 把多条 MMS 失败案例收成有序诊断：先查客户与线路 → 收集设备/网络状态工具读数 → 非账户修复（飞行模式、漫游、网络模式、权限、APN）→ 再查账户侧封顶与流量 → 需要加油包时**先报价并拿到明确同意**再调变更工具。并强调：记忆里的线路 ID / 漫游状态不得照抄，必须本案现查。客服域里，读时 briefing 几乎就是在生成一份**对本请求特化的 runbook**。[1]

这三份样本也说明：payload 格式高度依赖域。论文承认格式手写——工程上意味着你要为购物、客服、代码 agent 各维护一份 curator 契约，而不是幻想一个通用「记忆摘要」提示通吃。


## 和 Jev-Mem：只对照「切哪一刀」，不写成 Jev 专文

站内 [Jev-Mem](/cn/blog/jev-mem-system-one-agentic-memory/) 谈的是把记忆的组织 / 检索 / 停取拆成 **System One 类型化控制面**，少把控制默认塞给自回归 LLM。JitMem 几乎不碰「控制面用不用 LLM」——它问的是 **curation 发生在写时还是读时**。两篇可以叠读：你既可能用 System One 管「何时取、取多少」，又用读时 curator 管「取到的原始情节怎么按本任务蒸成 briefing」。本篇**不**展开 Jev 机制，也不消耗本周 Jev 正式文配额。[1]

和 [FTA](/cn/blog/failure-transparent-agents-tool-failure-reporting/) 有一层弱耦合：JitMem 入库靠 LLM-as-judge 门控「是否成功」。若 executor 会把工具失败说成成功，伪正例会污染记忆库——读时 framing 再漂亮也是在教错课。记忆系统与失败报告保真最好一起设计；Exactly-Once 式的「读回确认」若进工具契约，也会间接净化可入库轨迹。

## 可抄进自家 harness 的清单

1. **默认保留原始轨迹（或等价可重蒸原料）**，不要在写时把唯一副本蒸死；摘要可以作缓存索引，但别当唯一真源。  
2. **读时再按当前任务合成短 briefing**，executor 吃 briefing，不直接吞 top-\(k\) 长轨迹。  
3. **入库质量门**：优先成功示范；全量+标签是次优。  
4. **若要训 curator**：优先让奖励与「本任务是否做成」对齐（即时），少造延迟分组脚手架；GRPO 一类组相对优势够用时不必先上复杂 value net。  
5. **Curator 与 executor 解耦**：便于换执行模型、单独评记忆模块、控制训练成本。  
6. **检索可以先简单**（论文用 BM25 + 任务描述）；库变大再换更强检索——作者也把 BM25 列为扩展瓶颈。  
7. **接受 cold start**：前几题记忆弱是常态；他们设定里 warm-start 几乎不赚钱。  
8. **多付一次 curator 调用**：换更短 executor 上下文与更少环境步；账单按「多一轮 LLM vs 少若干交互 / 少失败重试」算，不要只盯单次 prompt 长度。  
9. **按域写 briefing 契约**：购物域禁止死抄商品 ID；客服域禁止死抄预约号，并强制「变更前显式确认」——提示词即策略。  
10. **评测时把「写时 / 读时」当成一等公民消融**：同模型容量下只改 curation 时点，才能分清是模型更大还是时间轴对了。


## 落到编码 Agent 时怎么想

编码场景里，「写时蒸技能」已经很常见：一次成功修 issue 就沉淀成 Skill / runbook / AGENTS.md 片段。JitMem 的提醒是：那次成功轨迹里可能同时有「怎么定位日志」「怎么跑复现」「怎么避免误改公共 API」多课；若写时只留一课，下次任务要另一课就亏了。更稳的做法是：

- 会话或 CI 日志（可脱敏）作 raw 真源；  
- Skill 卡片作高频路径的写时缓存；  
- 接到新 issue 时，用当前 issue 描述作条件，对检索到的 raw / 卡片再生成一份短 briefing 给执行模型——而不是把 top-\(k\) 长 diff 原样塞进上下文。

这也和「扩张 harness」一致：能沉进确定程序的控制别反复靠记忆散文；留给读时 curator 的，应是**仍依赖当前任务语义**的经验重组。GitHub Copilot 一类产品记忆若只做写时用户偏好摘要，解决的是个性化；若要做跨任务程序性迁移，读时合成更贴 JitMem 的证据。[1]


## 局限与一句话收束

作者自己列的限制：BM25 在库变大变杂时可能成瓶颈；每任务多一次 curator 调用；payload 格式按基准手写。未来可联合优化格式、换强检索、以及从「每任务一次」扩展到回合 / 步级、随着新观测再改编。τ²-bench 缺标准训练集，也限制了「学出来的读时 curator」在对话工具域的直接对照。[1]

有效 agent 记忆不只取决于**存了什么**，还取决于**何时、为哪一个任务去 curation**。JitMem 的证据是：即便 curator 还不训，把 curation 挪到读时，就已经能和强写入基线打平甚至反超；再训，是在正确的时间轴上加力——而不是在写时把记忆蒸干之后，再指望检索奇迹。

## 参考

[1] Yefan Zhou, Yang Li, Zeyu Leo Liu, Semih Yavuz, Shafiq Joty. *Just-in-Time Memory: Learning to Curate Task-Adaptive Memory for LLM Agents*. arXiv:2609.27334, 2026. <https://arxiv.org/abs/2609.27334>
