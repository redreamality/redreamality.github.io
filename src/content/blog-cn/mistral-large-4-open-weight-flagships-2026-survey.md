---
title: "Mistral Large 4 放在 2026 开源权重旗舰里看：参数、许可、放权节奏与自托管成本"
description: "Mistral Large 4 预览上线、月底放权重。本文把它和 Beam、Kolibri、GLM-5.3、DeepSeek、Kimi、Qwen 放进同一张表，对照总参与激活参数、显存需求、放权空窗期、许可证门槛、主权和 agent 宣称的证据，最后给一份押注前清单。"
pubDate: 2026-10-08T16:40:00+08:00
author: "Remy"
tags: ["llm", "open-source", "security", "ai-agents"]
lang: "zh"
---

10 月 6 日，Mistral 发布了 Mistral Large 4 的公开预览，内部昵称「Le Chonk」（法语冠词加英文俚语，意思大概是「大胖子」）。官方说法是：约 1 万亿总参数、520 亿激活参数、原生多模态，今天就能在 Mistral Studio 调预览 API，权重「本月底」放出；放权重之前，会先让网络安全公司、审核过的合作方和政府机构用一个「审核更宽松、网络能力更强」的版本做实战红队。[1] HN 上这条讨论两天里拿到两千多分。[3]

如果只当新闻看，三段话就讲完了。我更想借它回答一个做技术选型时绕不开的问题：**2026 年秋天，开源权重旗舰到底在比什么，开发者押注其中一款之前该查哪些东西？** 恰好前后一周里，Reflection 发了 501B 的 Beam（10 月 5 日，权重月内放）[4]，Aleph Alpha 发了 78B 的 Kolibri（10 月 3 日，当天放权重）[5]，再加上已经放出权重的 GLM-5.3、DeepSeek V4.1 Flash、Kimi K3、Qwen3.8，正好凑成一个横截面。

下面按六条线拆：参数口径与硬件、放权节奏与红队、许可证、主权、多模态与 agent 宣称、清单。站内相关：[GLM-5.3 那篇](/cn/blog/glm-5-3-open-weight-cyber-capabilities-safeguards/) 讲开源权重上拒答为什么不算防线，本文第三节会接着用；[DeepSeek V4 评测地图](/cn/blog/deepseek-v4-benchmarks-guide/) 讲各个基准在测什么；[OpenShell 与 Sentry](/cn/blog/nvidia-open-agent-safety-openshell-sentry/) 讲把安全边界放到模型外面。标「判断」的是我的看法，其余数字都来自文末列出的一手来源。

## 先分清 Mistral 说了什么、还没说什么

| 已公开 | 来源 |
| --- | --- |
| 约 1T 总参数、52B 激活；文档页写 1.05T 总参、52B 激活，另有 1.6B 视觉编码器 | 发布文 [1]、文档 [2] |
| 「颗粒化」MoE（granular Mixture-of-Experts） | 文档 [2] |
| 上下文 1M（文档页） | 文档 [2] |
| 在 Mistral 自己位于欧洲的数据中心，用 3,800 块 NVIDIA Grace Blackwell GPU 从头训练；预览服务跑在同一批设施上 | 发布文 [1] |
| 训练数据覆盖 160 多种语言，含欧盟全部官方语言 | 发布文 [1] |
| 后训练 RL 还在跑，「没有饱和迹象」；当前约 3k GPU，单次训练每天产出约 330 亿 token，过滤后约 160 亿可训练 | 发布文 [1] |
| 预览 API 价格：文档页标原价每百万 token 输入 1.36 美元、输出 4.18 美元，当前促销价减半 | 文档 [2] |

| 还没公开 | 影响 |
| --- | --- |
| 具体架构（层数、专家数、注意力设计） | 推理引擎能不能首日支持、KV cache 多大，都要等 |
| 许可证 | 能不能商用、有没有营收门槛，决定能不能押注 |
| 放出的权重精度（BF16、FP8 还是更低） | 决定要多少显存 |
| 后训练方法、完整基准 | 官方说会和权重一起公布 [1] |

有两处要先校准。第一，社区里流传过「1T-A49B」「1050B、49B 激活」的说法 [3]，但 Mistral 自己的发布文和文档都写 52B 激活，本文按 52B 算。第二，第三方评测机构 Artificial Analysis（下称 AA）给 Mistral Large 4 Preview 标的是「Proprietary model」，上下文窗口写 524k，而 Mistral 文档写 1M。[6][2] 前者好理解，权重没放之前它确实是闭源 API；后者说明**预览阶段对外提供的规格未必等于文档上限**，选型时以你实际调到的为准。

## 一张横截面：这几款模型摆在一起

| 模型 | 总参数 / 激活 | 权重状态（截至 10 月 8 日） | 许可证 | 模态 | 训练地 |
| --- | --- | --- | --- | --- | --- |
| Mistral Large 4 | 1.05T / 52B | 预览 API，月底放 [1] | 未公布 | 文本 + 图像 [2][6] | 欧洲，Mistral 自有机房 [1] |
| Reflection Beam | 501B / 23B | 早期访问，月内放 [4] | 承诺 Apache 2.0 [4] | 仅文本 [4] | 未写训练地；自称推进「西方开源权重前沿」，GB300 集群 [4] |
| Aleph Alpha Kolibri | 78.1B / 3.46B | 已放（10 月 3 日）[5][7] | Apache 2.0 [7] | 英德双语文本 [5] | 德国、芬兰 [5] |
| GLM-5.3 | 753B / 权重卡未写 | 已放（发布两周后）[8][9] | 自定义 GLM-5.3 License [10] | 文本 [19] | 未写训练地；Z.ai 总部在中国 [9] |
| DeepSeek V4.1 Flash | 552B 骨干 / 8B 或 16B | 已放 [12] | MIT [12] | 文本 + 图像 [12] | — |
| Kimi K3 | 2.8T / 104B | 已放 [13] | 自定义 Kimi K3 License [13] | 文本、图像、视频 [13] | — |
| Qwen3.8-2.4T-A95B | 2.4T / 95B | 已放 [14] | 自定义 Qwen3.8-Max License [14] | 开源版见下文 | — |

「—」表示我没在已抓取的一手材料里找到明确说法，不代表没有。

## 总参数决定你要多少显存，激活参数决定每个 token 有多贵

MoE（混合专家）模型每生成一个 token，只走一小部分专家。所以它有两个数：总参数是**必须常驻在显存里的东西**，激活参数是**每个 token 真正参与计算的东西**。前者决定买多少卡，后者决定每张卡每秒能吐多少 token、每个 token 花多少电。

### 先看口径：同一个「总参数」，各家算法不一样

- Mistral 发布文写「1 trillion」，文档写 1.05T，并单列 1.6B 视觉编码器。[1][2]
- DeepSeek V4.1 Flash 的模型卡写「552B backbone parameters」，同时提到一个约 196B 参数、按 token 查表稀疏访问的 Engram 条件记忆；Hugging Face 上它的 safetensors 统计总量是约 7,632 亿。[12][15] 也就是说，「552B」和你实际要下载、要装进机器的量不是一回事。
- DeepSeek 同一张表里，V4.1 Flash 的激活参数写「8B / 16B」两个数。[12] 我没在卡上找到对这两个数的逐字解释，所以不展开。
- Kolibri 最实在：模型卡直接给到个位，总参 78,103,074,560，激活 3,457,573,120。[7]

判断：比较开源权重模型时，别用发布会上的整数，直接查 Hugging Face 的文件。下面这条命令就能拿到每个仓库 safetensors 的参数总数和各精度分布，不用下载权重：

```bash
curl -s https://huggingface.co/api/models/zai-org/GLM-5.3 \
  | python3 -c "import json,sys; d=json.load(sys.stdin)['safetensors']; print(d['total'], d['parameters'])"
```

### 粗算一遍：放不放得下

下表是我用 Hugging Face API 把各仓库 `.safetensors` 文件大小加总的结果（10 月 8 日查询），也就是只算权重、不算 KV cache 的下限。[15]

| 仓库 | 权重文件合计 | 主要精度 |
| --- | --- | --- |
| Aleph-Alpha/Kolibri-1 | 约 79 GB | FP8 [7] |
| mistralai/Mistral-Small-4-119B-2603 | 约 242 GB | 以 FP8 为主 [15] |
| zai-org/GLM-5.3-Flash | 约 328 GB | 以 FP8 为主 [15] |
| deepseek-ai/DeepSeek-V4.1-Flash | 约 510 GB | 以 INT8 / FP8 为主 [15] |
| zai-org/GLM-5.3 | 约 756 GB | 以 FP8 为主 [15] |
| deepseek-ai/DeepSeek-V4-Pro-0813 | 约 893 GB | 以 INT8 为主 [15] |
| moonshotai/Kimi-K3 | 约 1,561 GB | MXFP4 权重（量化感知训练）[13] |
| Qwen/Qwen3.8-2.4T-A95B-FP8 | 约 2,496 GB | FP8 |

再对照几种常见机器的显存：单张 H200 是 141GB，8 卡就是 1,128GB；一台 DGX B200 合计 1,440GB；一整柜 GB200 NVL72 是 13.4TB HBM3e。[16][17][18]

把两张表对起来（判断，按权重下限粗算）：

- **Kolibri**：官方写 FP8 权重约 78GB，最低 1 张 H200 或 1 张 B200，推荐 2 张 H100。[7] 这是唯一能在单卡上跑的一档。
- **Beam**：权重还没放。如果按 FP8 每参数 1 字节估，501B 约 0.5TB，8 张 H200 放得下，还能留几百 GB 给 KV cache。
- **GLM-5.3**：约 756GB，8 张 H200 放下后剩三百多 GB。
- **Mistral Large 4**：如果月底放出的是 FP8，1.05T 约 1.05TB，8 张 H200 只剩七八十 GB，跑 1M 上下文基本不现实；一台 DGX B200 能多出约 390GB。更低精度的量化版要看官方或社区是否提供、掉多少分。
- **Kimi K3、Qwen3.8**：分别约 1.56TB 和 2.5TB，单台 8 卡机都装不下，得多机或者整柜。

HN 上有人吐槽「开源模型越来越大，在家跑越来越不现实」[3]，这张表说得很直白：**这一代旗舰的「开源」，对大多数团队意味着「可以在自己的机房或私有云跑」，不是「可以在工作站上跑」。** 真想在一两张卡上跑，Kolibri 这种 3B 激活的，或者各家的 Flash / Small 版本才是现实选项。

### 激活参数：每个 token 的成本，以及长上下文为什么另算

Reflection 在 Beam 的发布文里给了一个粗算公式：生成阶段的计算量约等于 2 × 激活参数 × 生成 token 数；MoE 只算每个 token 激活的那部分，不算预填充、注意力和服务开销。[4] 按这个公式，每生成一个 token，Mistral Large 4 约 104 GFLOP，Beam 约 46，Kolibri 约 7，Kimi K3 约 208，Qwen3.8 约 190。

但这只是一半。另一半是**你的回答有多长**。AA 测 Intelligence Index 时，Mistral Large 4 Preview 一共输出了约 2 亿 token，AA 说同类模型中位数是 8,100 万；GLM-5.3（max）是 2.1 亿，DeepSeek V4.1 Flash（max）是 2.5 亿。[6][19][20] 每个 token 便宜，话多也会把账单撑上去。所以 AA 的「每道题成本」更接近你实际要付的钱：Mistral Large 4 Preview 1.13 美元，GLM-5.3（max）2.01 美元，DeepSeek V4.1 Flash（max）0.27 美元，Kimi K3（max）2.00 美元。[6][19][20][21]

长上下文的显存则主要看注意力设计，不看参数。Kolibri 的发布文给了一个很好的例子：他们试过把模型从 32B 扩到 123B，效果持续变好，但 123B 在两张 H100 上只能同时处理 3 个 256k token 的请求，78B 能处理 18 个，解码还快 28%；最后选了 78B。它 50 层里只有 10 层看全文，其余 40 层只看 512 token 的窗口，所以这些层的解码计算和显存不随上下文变长。[5] Mistral Large 4 的注意力设计还没公布，标称 1M 上下文在你的机器上能同时跑几个请求，现在没法算。

## 「先发预览，月底放权重」：空窗期里发生了什么

四家的放权方式各不一样：

| 模型 | 首次发布 | 权重 | 空窗期里做什么 |
| --- | --- | --- | --- |
| Kolibri | 10 月 3 日 | 同日放出 [5] | 无空窗 |
| GLM-5.3 | 8 月 14 日托管版 | 两周后放出 [9] | Z.ai 称做安全评估与加固，具体做了什么没有公开（见站内 GLM 那篇） |
| Beam | 10 月 5 日 | 「本月晚些时候」，连同技术报告、模型卡 [4] | 「最后阶段的红队与评估」，早期访问申请 |
| Mistral Large 4 | 10 月 6 日预览 API | 「本月底」，连同架构、更多基准、后训练方法 [1] | 和安全公司、审核过的合作方、政府机构做实战红队；后训练 RL 继续跑 |

判断：这段空窗期对厂商有三个用处，对开发者各对应一个风险。

**第一，模型还在变。** Mistral 明说 RL 还在跑，预期「未来几周到几个月会有大幅提升」。[1] 你今天在预览 API 上测出来的分数，和月底下载到的权重不一定是同一个检查点。选型评测要记下模型 ID 和调用日期，权重放出后重跑一遍。

**第二，开源版不一定等于 API 版。** Qwen 已经给了先例：Qwen3.8-2.4T-A95B 的模型卡写明，官方 API 上的 Qwen3.8-Max 是基于它的「功能更多」的版本，比如支持视觉输入、非思考模式、默认 1M 上下文和官方内置工具。[14] 开源仓库本身原生上下文是 262,144 token，可扩展到约 101 万。[14] Mistral Large 4 放权重时视觉编码器、1M 上下文是不是全都在，要等月底看文件。

**第三，红队在空窗期里能改什么、改不了什么。** Mistral 这次的说法很有意思：红队伙伴拿到的是「同一个模型」，只是审核更松、网络能力更强。[1] 换句话说，预览 API 上有一层托管方的审核，而这层审核到了开源权重上是不存在的。站内 GLM 那篇已经拆过：Anthropic 测试里，用简单手法就能让 GLM-5.3 在 64% 到 100% 的情况下配合有害请求；把拒答行为从权重里去掉（abliteration），他们第一次做花了约 2,200 GPU 小时、约 4,400 美元，GLM-5.3-Flash 约 600 GPU 小时。[22] 所以 Mistral 宣传的「网络类恶意请求拒答率高于所有开源模型」（依据 JailbreakBench、StrongREJECT、AgentHarm）[1] 主要对托管 API 有意义；权重放出后，拒答只是出厂默认值。

那么空窗期的红队有什么用？判断：它真正能做的有两件。一是**决定放什么**，比如能力评估结果太危险就推迟或删减；二是**给防守方抢时间**。Anthropic 的 Mythos Preview 走受限访问，让审核过的防守方先找出一万多个漏洞，在攻击者拿到同等能力之前抢跑。[22] Mistral 让安全公司和政府机构先用「网络能力更强」的版本，逻辑相同。区别在于时长：Anthropic 发布 Mythos Preview 到写 GLM-5.3 那篇文章，中间隔了约五个月；Mistral 从预览到放权重，承诺的是三个多星期。

还要看到另一面。Mistral 把开源权重本身当成网络安全的卖点：闭源模型在供应商层面拒答，会挡住正当的漏洞研究和应急响应，处理事故到一半失去访问也是风险。[1] 它报的数字是：AA Cyber Index 全球前五、在中国以外开发的开源权重模型里大幅领先；「复现开源软件真实漏洞再打补丁」这项测试 82%，所有模型最高；Cybench 40 道题解出 93%。同一项测试上，Claude Opus 5.5 和 GPT-6 Astra 因为拒答几乎得零分。[1] 这说明一件事：**同一个能力，防守方和攻击方拿到的时间差会越来越短，防线得放在补丁速度、执行隔离和出网控制上，而不是放在模型会不会拒答上。**

## 许可证：都叫开源权重，条款差得很远

这是选型时最容易略过、后面最麻烦的一项。我把能抓到的 LICENSE 原文逐份读了一遍：

| 模型 | 许可证 | 关键门槛（原文意思） |
| --- | --- | --- |
| Kolibri | Apache 2.0 [7] | 无营收门槛 |
| Beam | 承诺 Apache 2.0 [4] | 权重未放，以届时文件为准 |
| DeepSeek V4.1 Flash / V4-Pro-0813 | MIT [12] | 无营收门槛 |
| GLM-5.3-Flash | MIT [11][15] | 无营收门槛 |
| GLM-5.3 | GLM-5.3 License [10] | 若你做「模型即服务」（让第三方能实际控制输入、参数或训练数据的 API）且集团连续 12 个月营收超过 100 亿美元，商用前要通过 Z.ai 的安全审查 |
| Kimi K3 | Kimi K3 License [13] | 做模型即服务且连续 12 个月营收超 2,000 万美元，商用前要另签协议；产品月活超 1 亿或月营收超 2,000 万美元，要在界面上醒目标注「Kimi K3」；纯内部使用和走官方或认证推理伙伴不受这两条约束 |
| Qwen3.8-2.4T-A95B | Qwen3.8-Max License [14] | 月活超 1 亿或月营收超 2,000 万美元要标注模型名；做模型即服务或「AI 工作助手」（编码、办公类独立产品）且 12 个月营收超 5,000 万美元，要另取授权；纯内部使用除外 |
| Mistral Medium 3.5（参照） | Modified MIT [23] | 公司（或你的雇主）上月全球合并营收超过 2,000 万美元，就不能行使许可证里的任何权利，需另找 Mistral 谈商业授权 |
| Mistral Small 4（参照） | Apache 2.0 [15] | 无营收门槛 |
| Mistral Large 4 | 未公布 | — |

Mistral 自己的产品线就有两种许可证：Small 4 是 Apache 2.0，Medium 3.5 是带营收门槛的 Modified MIT，而且门槛不只管「做 API 服务」，是按公司总营收一刀切。HN 上有用户一开始说「月底就开源了」，随后改口说 Mistral 用的是要求大公司另签商业协议的修改版 MIT，「所以其实是专有的」。[3] 这条评论没给出处，看上去是按 Mistral 过往的做法推断的；Large 4 到底用哪种，官方还没说。

判断：「开源权重」这四个字只告诉你能下载，不告诉你能不能用。对月营收超过 2,000 万美元的公司来说，Large 4 是 Apache 还是 Modified MIT，结果完全不同：前者随便部署，后者等于要回头找 Mistral 买授权。押注之前，这一项必须等原文。

## 主权：在哪训练、在哪服务、数据从哪来，是三件事

这一轮发布里，「主权」（sovereignty）出现得很密。Mistral 的小标题是「欧洲锻造，为 AI 主权而建」，强调在自己的欧洲机房训练，并提供一个由 Mistral 端到端运营、独立于其他数字服务商、受欧洲法律管辖的欧洲部署。[1] Aleph Alpha 说得更具体：团队在德国，训练设施在德国和芬兰，「没有外国控制」；从设计之初就按欧盟 AI 法案、通用 AI 行为准则和 GDPR 来做，对训练数据的整理过程保持透明。[5] Reflection 则把 Beam 定位成「推进西方开源权重前沿」。[4]

判断：这个词底下其实混着三件不同的事。

1. **训练在哪里、谁控制训练链路。** 这关系到数据合规、版权和可审计性。Kolibri 在这方面给得最多：德语占预训练 token 的 21.3%，翻译数据只用了约 6%，还专门写了为什么不靠机器翻译补德语。[5] Mistral 目前只给了训练地点和语言覆盖面。
2. **推理在哪里跑。** 这只对托管 API 有意义。权重一旦下载到自己机房，数据去哪完全由你决定，跟模型在哪训练无关。GLM-5.3 出自总部在中国的 Z.ai，但你把权重拉到法兰克福的机房里跑，请求数据也不会出法兰克福。
3. **供应会不会被切断。** 这才是自托管真正换来的东西。Mistral 自己也说，处理事故到一半失去模型访问本身就是安全风险。[1] 权重在手，这个风险就没了；但前提是许可证允许你这么用。

所以对开发者来说，「主权」的可检查部分是：训练数据有没有文档、许可证有没有附加条件、权重能不能离线运行。厂商的国籍更多影响的是政府采购和合规审查的口径，而不是技术本身。

## 多模态与 agent 能力：宣称和证据之间

### 自报分数要按考场分开读

几家都把 coding 和 agent 能力放在最前面。把同名基准拎出来对一下，会看到几个问题：

- **DeepSWE v1.1**：Mistral Large 4 自报 61.7%。[1] Beam 的对照表（其他模型的分数来自 AA 和 DataCurve）里，GLM-5.3 是 61.0，Kimi K3 68.0，DeepSeek V4.1 Flash 74.2，Beam 自己 44.4。[4] Mistral 在发布文里说自己的综合 Coding Agent Index 49.8% 领先「DeepSeek V4 Pro 0813 和 Qwen3.8 Max」，[1] 选的对照是 V4 Pro 0813，而不是这张表里分数更高的 V4.1 Flash。
- **Terminal-Bench**：Mistral 报的是 4.0 版（28.3%），Beam 和 Kolibri 报的是 2.1 版（80.1 和 27.7）。[1][4][5] 版本不同，不能放在一起比。
- **τ³-bench 银行**：Kolibri（3B 激活）报 38.1，Beam（23B 激活）报 38.0。[5][4] Kolibri 明确写分数是「用我们自己的 harness」跑的，Beam 没说明自家分数的测法。激活参数差七倍、分数几乎一样，最可能的解释是测法不同，而不是 Kolibri 突然很强。
- **图表排法**：HN 上有人指出，Mistral 发布页上不少柱状图把 Mistral 放在最差的对手旁边，把最强的对手放在另一头，不方便对比柱高。[3]

独立数据目前只有 AA。AA Intelligence Index（v4.3.2，包含 Terminal-Bench 4.0、AutomationBench、SciCode、HLE 等十项）上，Mistral Large 4 Preview 是 38，GLM-5.3（max）45，Kimi K3（max）44，DeepSeek V4.1 Flash（max）39。[6][19][20][21] Mistral 说自己「和全球最强的开源模型竞争」，[1] 按这个独立指数，更准确的说法是：接近 DeepSeek V4.1 Flash，落后 GLM-5.3 和 Kimi K3 一截。判断：考虑到 RL 还在跑，月底的版本可能会更高，但今天下结论只能按今天的数。

### agent 宣称里，哪些有外部评测支撑

Mistral Large 4 的 agent 证据里，有两条不完全是自家考场：一是发布页上标注为 AA 版本的 AutomationBench（657 个跨 Gmail、Google Sheets、Slack、Salesforce 的业务流程）59.9%，以及 AA-Briefcase 1,393 Elo；二是委托 Surge AI 做的盲评，专业标注员按 1 到 5 分给代码质量打分，Mistral Large 4 Preview 3.74 分，排五个模型里第二，前面只有 Claude Opus 5（4.22），后面是 GLM-5.3（3.60）、Kimi K3（3.59）、GLM-5.2（3.40）。[1] 盲评只有五个模型、Mistral 是委托方，可以参考，不能当终审。

Beam 那边，值得注意的是一个「迁移」说法：在推理、软件工程和终端任务上做 RL 时，即使训练里没有浏览任务，浏览能力也在涨；拿到网络访问后，它自己学会了去查别的大模型、调 OCR 接口读文档。[4] 这是很有意思的观察，但目前只有官方叙述和演示。

Kolibri 的思路不太一样：它把「不知道就说不知道」当成核心能力来训，AA-Omniscience 上有 44% 的题选择不答而不是答错（前代 15%），并自建了一个 agentic RAG 基准 Honeypot。[5] 对受监管的场景，这比多几个点的 SWE 分数更有用。

### 多模态

Mistral Large 4 是这几款里少数带图像输入的，AA 也确认它支持文本和图像输入。[6] 官方举的强项是视觉定位（visual grounding，即在图里精确找到并框出目标）：Dense 200 上 42%，GPT-6 Astra 41%。[1] 一个百分点的领先，加上是自报，判断：先当作「视觉定位和前沿闭源模型同一水平」来读，别当成「超越」。Beam 明确是纯文本模型 [4]；Kimi K3 支持文本、图像、视频 [13]；DeepSeek V4.1 Flash 支持图像和文本 [12]；GLM-5.3 在 AA 上标注只接受文本输入 [19]。

## 押注之前的检查清单

1. **参数和文件。** 用 Hugging Face API 查 safetensors 总数和精度分布，算出权重下限；别用发布会的整数。
2. **硬件。** 权重下限加上目标上下文和并发数下的 KV cache；在你要用的上下文长度上实测，而不是只测 8k。
3. **推理引擎。** 新架构往往需要专门的插件或分支。Kolibri 要装 aleph-alpha-inference 提供的 vLLM 插件，[5] Mistral Medium 3.5 一度因为 Transformers 配置写错导致长上下文退化、后来才修好。[23] Large 4 架构没公布前，别假设首日就能用你现有的推理栈。
4. **许可证原文。** 看有没有营收或月活门槛、门槛按「模型即服务」算还是按公司总营收算、内部使用是否豁免。Large 4 等原文。
5. **版本对齐。** 记下预览 API 的模型 ID 和日期；权重放出后核对是不是同一个检查点、视觉编码器和上下文长度是否完整。
6. **基准。** 只比同版本、同 harness 的分数；自己的任务集在自己的 harness 上重跑，同时记录输出 token 数。
7. **安全。** 默认模型会配合任何人，控制点放在模型外面：执行隔离、出网白名单、凭证最小化、审计日志放在模型碰不到的地方；只从官方组织拉权重并锁哈希。
8. **主权。** 分清训练地、推理地和供应可持续性；要合规文档就向厂商要训练数据说明，别只看国籍。

## 几处我没能核实的

- Reddit LocalLLaMA 的讨论帖抓取被拦，本文没有引用其中的内容。
- GLM-5.3 的激活参数，权重卡上没写；HN 有人说是 40B，[3] 我没找到一手来源，所以表里留空。
- Mistral Large 4 的预训练时长、架构细节、许可证、权重精度均未公布。
- 关于 Mistral Large 4 价格只有 GLM-5.3 一半的说法 [3]，我只核到了 AA 的每题成本（1.13 对 2.01 美元）[6][19]，没有找到官方的直接对比。

## 结语

Mistral Large 4 本身的意义，是欧洲第一次拿出一款万亿参数级、准备开放权重的旗舰。放进横截面里看，它面对的是一个已经很拥挤的赛道：中国几家在独立指数上暂时领先，Beam 拿效率和 Apache 2.0 抢西方开发者，Kolibri 用 3B 激活证明小也能用。对开发者来说，真正要比的不是谁的发布会更热闹，而是四件能查证的事：文件多大、条款怎么写、权重和 API 是不是一回事、在你的 harness 上跑出多少分。Large 4 这四件事里，月底之前只有第一件能大致估算。

## 参考来源

1. Mistral AI, "Introducing Mistral Large 4", 2026-10-06. https://mistral.ai/news/mistral-large-4/
2. Mistral Docs, "Mistral Large 4" model page (v26.10). https://docs.mistral.ai/models/mistral-large-4-0
3. Hacker News, "Mistral Large 4" discussion (item 49977979). https://news.ycombinator.com/item?id=49977979
4. Reflection AI, "Introducing Beam: Reflection's 501B open-weight model", 2026-10-05. https://reflection.ai/blog/introducing-beam
5. Aleph Alpha, "Kolibri Has Landed: A Sovereign Open-Weight Model", 2026-10-03. https://aleph-alpha.com/en/blog/kolibri-has-landed-a-sovereign-open-weight-model/
6. Artificial Analysis, "Mistral Large 4 Preview". https://artificialanalysis.ai/models/mistral-large-4
7. Aleph-Alpha/Kolibri-1 model card, Hugging Face. https://huggingface.co/Aleph-Alpha/Kolibri-1
8. zai-org/GLM-5.3 model card, Hugging Face. https://huggingface.co/zai-org/GLM-5.3
9. NIST CAISI, "CAISI's Assessment of Z.ai's GLM-5.3 Cyber Capabilities", 2026-09-17. https://www.nist.gov/news-events/news/2026/09/caisis-assessment-zais-glm-53-cyber-capabilities
10. GLM-5.3 License. https://huggingface.co/zai-org/GLM-5.3/blob/main/LICENSE
11. zai-org/GLM-5.3-Flash model card, Hugging Face. https://huggingface.co/zai-org/GLM-5.3-Flash
12. deepseek-ai/DeepSeek-V4.1-Flash model card, Hugging Face（另参照 DeepSeek-V4-Pro-0813 卡的 MIT 许可说明）. https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash
13. moonshotai/Kimi-K3 model card and Kimi K3 License, Hugging Face. https://huggingface.co/moonshotai/Kimi-K3
14. Qwen/Qwen3.8-2.4T-A95B model card and Qwen3.8-Max License, Hugging Face. https://huggingface.co/Qwen/Qwen3.8-2.4T-A95B
15. Hugging Face Hub API（`/api/models/<id>` 与 `/api/models/<id>/tree/main`），2026-10-08 查询：GLM-5.3、GLM-5.3-Flash、Kolibri-1、DeepSeek-V4.1-Flash、DeepSeek-V4-Pro-0813、Kimi-K3、Qwen3.8-2.4T-A95B(-FP8)、Mistral-Small-4-119B-2603、Mistral-Medium-3.5-128B. https://huggingface.co/docs/hub/api
16. NVIDIA, H200 Tensor Core GPU. https://www.nvidia.com/en-us/data-center/h200/
17. NVIDIA, DGX B200. https://www.nvidia.com/en-us/data-center/dgx-b200/
18. NVIDIA, GB200 NVL72. https://www.nvidia.com/en-us/data-center/gb200-nvl72/
19. Artificial Analysis, "GLM-5.3 (max)". https://artificialanalysis.ai/models/glm-5-3
20. Artificial Analysis, "DeepSeek V4.1 Flash (max)". https://artificialanalysis.ai/models/deepseek-v4-1-flash
21. Artificial Analysis, "Kimi K3 (max)". https://artificialanalysis.ai/models/kimi-k3
22. Anthropic Frontier Red Team, "GLM-5.3 and the spread of advanced cyber capabilities", 2026-09-29. https://www.anthropic.com/research/glm-5-3-and-the-spread-of-advanced-cyber-capabilities
23. mistralai/Mistral-Medium-3.5-128B model card and Modified MIT License, Hugging Face. https://huggingface.co/mistralai/Mistral-Medium-3.5-128B
