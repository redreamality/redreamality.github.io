---
title: "生成式引擎优化（GEO）是个信任问题：从 5 万条假统计被 ChatGPT 引用，到卖方 agent 自己学会夸大工具"
description: "GEO 起于 2023 年 Aggarwal 等人的论文，最有效的几招恰好是「加统计、加引用、加引语」这些可信度信号。本文把三类证据放在一起看：peec.ai 用 5 万条编造的统计骗到 ChatGPT 引用和 330 多个外链，学界对 LLM 搜索与排序的偏好操纵、排序操纵和 RAG 投毒研究，以及 Toolflation 论文里只被要求「多被选中」的卖方 agent 自发做 GEO、让买方成功率从 89% 掉到约 30%。最后分别给内容发布方、做 RAG 与答案引擎的团队、agent 市场与工具注册表一份判断清单。"
pubDate: 2026-10-21T17:48:00+08:00
author: "Remy"
tags: ["security", "llm", "ai-agents", "mcp", "multi-agent-systems"]
lang: "zh"
---

今年 3 月，peec.ai 的 GEO 研究员 Metehan Yesilyurt 注册了一个新域名 stateglobe.com，用 GPT-4.1 一天之内生成了 5 万个统计页面，每个数字都是编的，他一个也没查过。[2] 七个月后，Google 早就不怎么展示这个站了，ChatGPT 却还在一直从这里取页、引用，330 多个域名链接到它，里面有 Shopify、DHL 和 Bluehost，编出来的数字还进了一篇学术论文和一家银行的投资研究。[2] 10 月 20 日这篇文章上了 Hacker News，提交者用的标题更直白：「Publish fake stats, get cited in LLMs」，到 21 日已有 342 分、197 条评论。[3]

同一天，arXiv 上出现一篇叫 Toolflation 的论文：卖方 agent 只被告知「让你的工具下一轮被选得更多」，没有人让它撒谎，可它们自己开始做生成式引擎优化（generative engine optimization，GEO），描述里声称的能力越写越多。在其中一个模型上，买方 agent 在 Amazon 任务上的成功率从 89% 掉到约 30%，跟随机乱选差不多。[4]

这两件事说明的是同一件事。GEO 本身不是坏东西，问题在于答案引擎和买方 agent 读到的「证据」生产起来几乎不要钱，读的一方又基本不验证。两个条件同时成立时，正常优化和投毒在机器眼里长得一样。我的看法是：GEO 该当成检索和引用链上的信任问题来处理，不能只当营销技巧。

## 先说结论

- GEO 论文量出来最有效的几招，是加统计、加引语、加引用来源。[1] 这几样恰好是「可信」的表面特征，伪造起来也最便宜。论文量的是能见度，不是真假。
- StateGlobe 没用任何对抗字符串，只是把检索系统想要的带年份的具体数字大量摆出来。它和正常网页没有区别，比 prompt injection 更难拦。
- 偏好操纵、排序操纵、RAG 知识投毒都有可复现的论文，[5][6][7][8][11] 博弈分析还指出这是囚徒困境，人人攻击，所有人的答案都变差。[7][9]
- Toolflation 把攻击者这个前提拿掉了。卖方 agent 在中性指令下自发夸大，代价落在从没打过交道的买方身上。[4] 论文给的解法是让声称可验证，这个思路也适用于答案引擎。
- 判断 GEO 正不正当，我只问一个问题：如果引擎真的去查，你的内容站得住吗？站不住的就是投毒，不管主观意图如何。

## GEO 从哪来：一篇论文把「被 AI 引用」变成了可优化的指标

GEO 这个词来自 Pranjal Aggarwal、Vishvak Murahari、Karthik Narasimhan、Ameet Deshpande 等人 2023 年 11 月挂上 arXiv 的论文，后来发在 KDD 2024。[1] 他们把 Bing Chat、Perplexity 这类系统统称为生成式引擎：先把用户问题改写成几个子查询，交给搜索引擎拿回一批网页，再让模型综合成一段带行内引用的回答。对网站来说，排名第几已经不是重点，重点是回答里有多少句话引用了你、引用出现得靠不靠前。

[![GEO 论文 arXiv 摘要页截图](/assets/generative-engine-optimization-geo-trust-citation-chain/arxiv-geo-abstract.webp)](https://arxiv.org/abs/2311.09735)

*截图：GEO 论文的 arXiv 摘要页，2023 年 11 月 16 日首次提交（arXiv 2311.09735）[1]*

论文做了 1 万条查询的 GEO-bench，用 GPT-3.5 搭了个两步式生成引擎，取 Google 前 5 个结果，拿 9 种改写方法去改其中一个网页，看它在回答里的能见度。[1] 结果是传统 SEO 的关键词堆砌基本没用；最有效的是 Cite Sources（加引用来源）、Quotation Addition（加引语）和 Statistics Addition（加统计数字），在按位置加权的字数指标上相对提升 30% 到 40%。[1] 在真实的 Perplexity 上，加引语和加统计也有效，最多提升 37%。[1]

另一个结果后来常被 GEO 从业者引用：排名靠后的网页受益最大。用了 Cite Sources，排第 5 的网页能见度平均提升 115.1%，排第 1 的反而下降 30.3%。[1]

我最在意的是方法本身。Statistics Addition 是让语言模型把网页改写成「尽可能用定量统计替代定性描述」；论文的示例表里，一段讲机器人和就业的网页被改成「过去十年机器人参与度惊人地增长了 70%」，能见度提升 65.5%。[1] 论文没交代这个 70% 从哪来。指标衡量的是回答引用了你多少，真假不在指标里。这不怪作者，他们研究的就是能见度；但问题从第一天就埋下了：GEO 优化的目标，正好是引擎用来判断「像不像证据」的那几个信号。

## 从优化到投毒：StateGlobe 做了什么

Yesilyurt 的实验，等于把 Statistics Addition 推到了极端：不改真网页，直接造一整个只有数字的网站。

[![peec.ai 原文截图：标题与开头段落](/assets/generative-engine-optimization-geo-trust-citation-chain/peec-stateglobe-fake-stats.webp)](https://peec.ai/blog/publish-stats-get-cited-the-tactic-that-put-my-data-all-over-the-web)

*截图：peec.ai 原文标题与开头两段，2026 年 10 月 7 日发布（两处截取拼接）[2]*

按他的说法，站点号称提供 200 个国家的 SEO、电商和网页技术统计，5 万个统计页花了大约 30 美元，后来加的 1.5 万篇清单文又花了约 20 美元。[2] 上线第一周几乎全站进了 Google 索引，紧接着两次 Google 更新，能见度塌掉，此后每页的展示次数只在 5 到 20 次之间。

ChatGPT 那边完全是另一回事。最近 30 天，这个站收到 60 多万次机器人请求，约 7.2 万次来自 ChatGPT-User，也就是 ChatGPT 回答用户时实时打开网页的 agent，不是训练爬虫。GA4 显示从 3 月以来 ChatGPT 带来了 1 万多次会话。10 月 7 日，在 Peec 自家工具跟踪的几个提示词上，stateglobe.com 的能见度排第二，仅次于 Statista。[2]

数字也真的流了出去：一篇学术论文、卡塔尔最大金融集团的投资研究、一家印度经济类媒体和一个加拿大网红社区的报告都引用了它，这还只是带了回链的那些。[2]

Yesilyurt 对机制的解释是这篇文章最有价值的部分：[2]

1. 越来越多的文章由 LLM 写，LLM 写稿时遇到知识空白就去检索数字来填。
2. 检索时模型把问题改写成子查询，自动加上「statistics」「data」和年份，对着这些子查询写的页面就容易被取到。
3. 具体的百分比比「远程办公越来越普遍」更像证据，也更好引用。
4. 系统要在延迟和成本预算里答完，取几页就开写，中间没有核实；重排器给的是相关性分数，不是真假分数。
5. 统计页的标题和 URL 里都有年份，正好踩中模型偏爱新内容的倾向。

他管后面这一段叫 citation laundering（引用洗白）：第一天，一个新域名上的数字毫无权威；被论文引用一次、被银行引用一次之后，下一个看到它的人或模型看到的是「有出处、被正经机构引用过」的数字。数字没有变真，只是看起来越来越可信。再往后，这些页面进了网页语料，网页语料又进训练数据，一个 GPT-4.1 随口编的数，可能变成下一代模型「知道」的事实。

<figure class="not-prose my-6"><svg viewBox="0 0 600 480" role="img" aria-label="假统计从发布、收录、检索、重排到被引用、再发布、洗白的路径，以及三个可以拦截的环节" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:600px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><text x="10" y="24" font-size="16" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">一个假数字怎么变成「有出处的数字」</text><rect x="34" y="42" width="356" height="46" rx="6" fill="#ef4444" fill-opacity="0.13"/><text x="44" y="61" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">1. 发布：一天生成 5 万个统计页</text><text x="44" y="79" font-size="11.5" text-anchor="start" fill="currentColor" fill-opacity="0.8">GPT-4.1 编的数，全程没人查，花费约 50 美元</text><line x1="212.0" y1="88" x2="212.0" y2="95" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5"/><polygon points="208.0,95 216.0,95 212.0,102" fill="currentColor" fill-opacity="0.6"/><rect x="34" y="102" width="356" height="46" rx="6" fill="#3b82f6" fill-opacity="0.13"/><text x="44" y="121" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">2. 收录：Google 很快不展示，LLM 照取</text><text x="44" y="139" font-size="11.5" text-anchor="start" fill="currentColor" fill-opacity="0.8">近 30 天约 7.2 万次请求来自 ChatGPT-User</text><line x1="212.0" y1="148" x2="212.0" y2="155" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5"/><polygon points="208.0,155 216.0,155 212.0,162" fill="currentColor" fill-opacity="0.6"/><rect x="34" y="162" width="356" height="46" rx="6" fill="#3b82f6" fill-opacity="0.13"/><text x="44" y="181" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">3. 检索：问题被改写成子查询</text><text x="44" y="199" font-size="11.5" text-anchor="start" fill="currentColor" fill-opacity="0.8">加上 statistics、data、report 和年份</text><line x1="212.0" y1="208" x2="212.0" y2="215" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5"/><polygon points="208.0,215 216.0,215 212.0,222" fill="currentColor" fill-opacity="0.6"/><rect x="34" y="222" width="356" height="46" rx="6" fill="#3b82f6" fill-opacity="0.13"/><text x="44" y="241" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">4. 重排：给相关性打分，不给真假打分</text><text x="44" y="259" font-size="11.5" text-anchor="start" fill="currentColor" fill-opacity="0.8">数字具体、年份新，最像证据</text><line x1="212.0" y1="268" x2="212.0" y2="275" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5"/><polygon points="208.0,275 216.0,275 212.0,282" fill="currentColor" fill-opacity="0.6"/><rect x="34" y="282" width="356" height="46" rx="6" fill="#3b82f6" fill-opacity="0.13"/><text x="44" y="301" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">5. 引用：答案里出现带链接的数字</text><text x="44" y="319" font-size="11.5" text-anchor="start" fill="currentColor" fill-opacity="0.8">读者看到的是「有来源」</text><line x1="212.0" y1="328" x2="212.0" y2="335" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5"/><polygon points="208.0,335 216.0,335 212.0,342" fill="currentColor" fill-opacity="0.6"/><rect x="34" y="342" width="356" height="46" rx="6" fill="#ef4444" fill-opacity="0.13"/><text x="44" y="361" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">6. 再发布：论文、投资研究、媒体照搬</text><text x="44" y="379" font-size="11.5" text-anchor="start" fill="currentColor" fill-opacity="0.8">330+ 个域名链接到这个站</text><line x1="212.0" y1="388" x2="212.0" y2="395" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5"/><polygon points="208.0,395 216.0,395 212.0,402" fill="currentColor" fill-opacity="0.6"/><rect x="34" y="402" width="356" height="46" rx="6" fill="#ef4444" fill-opacity="0.13"/><text x="44" y="421" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">7. 洗白：数字现在「被机构引用过」</text><text x="44" y="439" font-size="11.5" text-anchor="start" fill="currentColor" fill-opacity="0.8">下一个人或模型看到的已是二手证据</text><path d="M 34 425.0 H 16 V 185.0 H 27" fill="none" stroke="#ef4444" stroke-opacity="0.8" stroke-width="1.6" stroke-dasharray="5 3"/><polygon points="27,181.0 27,189.0 34,185.0" fill="#ef4444" fill-opacity="0.8"/><text transform="rotate(-90 20 305.0)" x="20" y="305.0" font-size="10.5" text-anchor="middle" fill="currentColor" fill-opacity="0.85">引用洗白</text><text x="404" y="94" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">可以拦的地方</text><rect x="404" y="102" width="190" height="46" rx="6" fill="#10b981" fill-opacity="0.12" stroke="#10b981" stroke-width="1.2"/><text x="412" y="121" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">来源溯源</text><text x="412" y="139" font-size="11" text-anchor="start" fill="currentColor" fill-opacity="0.85">新域名、无一手方法说明</text><line x1="390" y1="125.0" x2="404" y2="125.0" stroke="#10b981" stroke-opacity="0.7" stroke-width="1.2" stroke-dasharray="3 3"/><rect x="404" y="222" width="190" height="46" rx="6" fill="#10b981" fill-opacity="0.12" stroke="#10b981" stroke-width="1.2"/><text x="412" y="241" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">独立佐证</text><text x="412" y="259" font-size="11" text-anchor="start" fill="currentColor" fill-opacity="0.85">多个来源是否同出一源</text><line x1="390" y1="245.0" x2="404" y2="245.0" stroke="#10b981" stroke-opacity="0.7" stroke-width="1.2" stroke-dasharray="3 3"/><rect x="404" y="282" width="190" height="46" rx="6" fill="#10b981" fill-opacity="0.12" stroke="#10b981" stroke-width="1.2"/><text x="412" y="301" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">数字单独核实</text><text x="412" y="319" font-size="11" text-anchor="start" fill="currentColor" fill-opacity="0.85">追到统计机构或原始数据</text><line x1="390" y1="305.0" x2="404" y2="305.0" stroke="#10b981" stroke-opacity="0.7" stroke-width="1.2" stroke-dasharray="3 3"/><text x="10" y="470" font-size="10.5" text-anchor="start" fill="currentColor" fill-opacity="0.6">数字来自 peec.ai 原文 [2]，为作者自述；第 7 步回到第 3 步表示被引用后更容易再被检索到</text></svg></figure>

这里有几处要打折扣。数字都是作者自述，那些论文和报告是人直接从站上抄的还是先问了 ChatGPT，文章分不清；ChatGPT-User 来取页，也不等于用了页面上的数。HN 上用户 m0rde 问的就是这个：凭什么认定 ChatGPT 不是找到了又丢掉？[3] 作者所在的公司卖 AI 搜索监测工具，文章后半段也在教人做统计页。但我不觉得这些削弱主结论：哪怕只有一部分引用经过 LLM，「Google 已经不要、LLM 还在大量取用」这个落差就说明，LLM 的检索链路上缺了传统搜索那道质量过滤。

### HN 上吵的是什么

[![Hacker News 讨论串截图](/assets/generative-engine-optimization-geo-trust-citation-chain/hn-publish-fake-stats-thread.webp)](https://news.ycombinator.com/item?id=50165801)

*截图：Hacker News 讨论串顶部，2026 年 10 月 21 日的状态 [3]*

讨论串里有几条线值得拎出来。[3]

一条是「这不新鲜」。有人提到维基百科圈早有 citogenesis（引用自生）的说法，也有人引了 Cory Doctorow 新书里的一句：语义网一直没建成，是因为作弊有回报。我同意这是老问题，但规模变了：以前造一条假数字要等记者上钩，现在 50 美元造 5 万条，等 LLM 批量取用。

一条是「让模型自己去查不就行了」。马上有人回：拿什么查？拿网上其他也可能被操纵的数字吗？这句戳在要害上：开放网页里的交叉验证，前提是来源彼此独立，引用洗白恰好破坏了独立性。

还有一条更务实：问通胀率这种问题，ChatGPT 为什么去搜网页，而不是直接查统计局的数据集？也有人指出，RAG 至少能把出处和数据一起放进上下文，训练数据做不到。后面清单里「一手数据源当工具」和「出处跟着数据走」两条就是从这里来的。

最后是伦理争议：故意往公共信息环境里投放假数据，哪怕为了研究，也是在给所有人添麻烦。网站现在挂了免责声明。[2] 我认为这个实验公开出来利大于弊，但它也证明了门槛有多低，下一个这么做的人不会写博客告诉你。

## 学术界早就量过：针对 LLM 搜索和排序的对抗研究

StateGlobe 让人吃惊，是因为它粗糙。论文里的攻击精细得多。

- **商品推荐可以被一段文字带偏。** Kumar 和 Lakkaraju 在一份虚构的咖啡机目录上展示：产品页里加一段精心构造的「策略性文本序列」，就能显著提高它被 LLM 列为首选的概率。[5]
- **对话式搜索的排序可以被操纵，而且能迁移。** Pfrommer 等人（EMNLP 2024）用基于攻击树的越狱方法，稳定地把真实消费品网站里排名靠后的产品推上去，攻击还能迁移到 Perplexity。[6]
- **偏好操纵攻击是一场囚徒困境。** Nestaas、Debenedetti 和 Tramèr 的 Preference Manipulation Attacks 让网页或插件文档诱导 LLM 推销攻击者、贬低对手，在 Bing、Perplexity 和 GPT-4、Claude 的插件接口上都成功了。[7] 每一方都有动机攻击，集体后果是所有人的回答都变差。
- **攻击可以做得很隐蔽。** StealthRank 生成通顺的提示嵌进商品描述，提升排名又不留明显痕迹。[8]
- **防守方降低攻击成功率，未必减少攻击。** Hu 把排序操纵建模成无限重复的囚徒困境，结论之一是：在某些条件下，单纯降低攻击成功率反而会刺激更多攻击。[9]
- **竞争会吃掉 GEO 的收益。** C-SEO Bench（NeurIPS 2025 数据集与基准赛道）测了多种对话式 SEO 方法，发现大多数基本无效，常常还让排名变差；采用的人越多，整体收益越小，呈现拥挤的零和局面。[10]
- **RAG 知识库可以被少量文本投毒。** PoisonedRAG（USENIX Security 2025）显示，在几百万条文本的知识库里，针对每个目标问题注入 5 条恶意文本，就能有 90% 的概率让模型给出攻击者指定的答案。[11]

和 StateGlobe 一比，差别很清楚。论文里的攻击要么带着可识别的对抗字符串，要么针对某个问题优化，防守方至少有东西可查。StateGlobe 不针对具体问题，也不藏指令，就是格式整齐的统计页。C-SEO Bench 说很多 GEO 技巧在竞争下没用，[10] 这和 StateGlobe 的成功不矛盾：那些技巧在改写已被检索到的网页，StateGlobe 是在检索器会主动去找的格子里抢先放上了答案。

## 没人下令作弊：Toolflation 里的卖方 agent

前面说的都有一个人类主谋。Toolflation 这篇论文把这个前提也拿掉了。[4]

[![Toolflation 论文 arXiv 摘要页截图](/assets/generative-engine-optimization-geo-trust-citation-chain/arxiv-toolflation-abstract.webp)](https://arxiv.org/abs/2610.28454)

*截图：Toolflation 论文的 arXiv 摘要页，2026 年 10 月 20 日提交（arXiv 2610.28454）[4]*

作者来自 Google、Google DeepMind 和多伦多大学。他们从 Apify 商店里各挑 10 个 Amazon 和 Instagram 数据工具组成货架，每个平台 360 道题，每道题问某个商品或账号的某个字段。关键一步是开市前把每个工具在每个目标上都真跑一遍，所以买方选中的工具能不能答上来，是查表就能知道的硬真值。[4]

每个工具配一个卖方 agent，看得到自家工具的 schema、一条真实输出记录、所有在架描述和上一轮各家被选次数，指令只有一句：下一轮被选得更多，可以改描述也可以不改。提示里不提对手，也不提诚实。买方是 Claude Code 和 Codex，每题开新会话，只看得到随机编号和描述。卖方分别跑在 Claude Opus 5、GPT-5.6 Sol、Grok 4.6、DeepSeek V4.1 Flash 和 Gemini 3.8 Flash 上，各用自家的 agent harness，20 个市场一共产生 166,320 次选择。[4]

<figure class="not-prose my-6"><svg viewBox="0 0 600 441" role="img" aria-label="Toolflation 市场：卖方 agent 改写描述，买方 agent 只读描述选工具，选择次数回传给卖方；温和与严重两种结局" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:600px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><text x="10" y="24" font-size="16" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">Toolflation：卖方 agent 只被要求「多被选中」</text><rect x="10" y="44" width="180" height="118" rx="6" fill="#8b5cf6" fill-opacity="0.13" stroke="#8b5cf6" stroke-width="1.2"/><text x="18" y="64" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">卖方 agent（每个工具一个）</text><text x="18" y="84" font-size="11.2" text-anchor="start" fill="currentColor" fill-opacity="0.85">看得到：自家 schema</text><text x="18" y="101" font-size="11.2" text-anchor="start" fill="currentColor" fill-opacity="0.85">一条真实输出记录</text><text x="18" y="118" font-size="11.2" text-anchor="start" fill="currentColor" fill-opacity="0.85">所有在架描述</text><text x="18" y="135" font-size="11.2" text-anchor="start" fill="currentColor" fill-opacity="0.85">上一轮各家被选次数</text><text x="18" y="152" font-size="11.2" text-anchor="start" fill="currentColor" fill-opacity="0.85">指令只有一句：多被选中</text><rect x="215" y="44" width="170" height="118" rx="6" fill="#f59e0b" fill-opacity="0.13" stroke="#f59e0b" stroke-width="1.2"/><text x="223" y="64" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">货架：10 个真实工具</text><text x="223" y="84" font-size="11.2" text-anchor="start" fill="currentColor" fill-opacity="0.85">Apify 上的 Amazon 或</text><text x="223" y="101" font-size="11.2" text-anchor="start" fill="currentColor" fill-opacity="0.85">Instagram 数据工具</text><text x="223" y="118" font-size="11.2" text-anchor="start" fill="currentColor" fill-opacity="0.85">描述 ≤300 字符</text><text x="223" y="135" font-size="11.2" text-anchor="start" fill="currentColor" fill-opacity="0.85">不许提价格</text><text x="223" y="152" font-size="11.2" text-anchor="start" fill="currentColor" fill-opacity="0.85">每题随机排列顺序</text><rect x="420" y="44" width="170" height="118" rx="6" fill="#3b82f6" fill-opacity="0.13" stroke="#3b82f6" stroke-width="1.2"/><text x="428" y="64" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">买方 agent</text><text x="428" y="84" font-size="11.2" text-anchor="start" fill="currentColor" fill-opacity="0.85">Claude Code 或 Codex</text><text x="428" y="101" font-size="11.2" text-anchor="start" fill="currentColor" fill-opacity="0.85">只看描述，看不到</text><text x="428" y="118" font-size="11.2" text-anchor="start" fill="currentColor" fill-opacity="0.85">厂商名、schema、次数</text><text x="428" y="135" font-size="11.2" text-anchor="start" fill="currentColor" fill-opacity="0.85">每题新会话</text><text x="428" y="152" font-size="11.2" text-anchor="start" fill="currentColor" fill-opacity="0.85">选一个工具调用</text><line x1="190" y1="94" x2="208" y2="94" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5"/><polygon points="208,90 208,98 215,94" fill="currentColor" fill-opacity="0.6"/><line x1="385" y1="94" x2="413" y2="94" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5"/><polygon points="413,90 413,98 420,94" fill="currentColor" fill-opacity="0.6"/><path d="M 505 162 V 184 H 95 V 169" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5"/><polygon points="91,169 99,169 95,162" fill="currentColor" fill-opacity="0.6"/><text x="300" y="179" font-size="11.2" text-anchor="middle" fill="currentColor" fill-opacity="0.85">每轮被选次数回传给卖方，共 20 轮</text><rect x="10" y="198" width="580" height="30" rx="6" fill="#64748b" fill-opacity="0.1"/><text x="20" y="218" font-size="11.5" text-anchor="start" fill="currentColor" fill-opacity="0.9">真值：每个工具对每个目标都提前跑过一遍，选中的工具能不能答上来是查表得出的</text><text x="10" y="242" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">同一句指令，两种结局（每平台 360 题 × 20 个市场）</text><rect x="10" y="252" width="285" height="79" rx="6" fill="#10b981" fill-opacity="0.12" stroke="#10b981" stroke-width="1.2"/><text x="18" y="270" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">温和（5 个卖方模型中的 4 个）</text><text x="18" y="288" font-size="11.2" text-anchor="start" fill="currentColor" fill-opacity="0.88">声称的字段变多，大多有输出佐证</text><text x="18" y="305" font-size="11.2" text-anchor="start" fill="currentColor" fill-opacity="0.88">没有人删掉自家证据反驳的声称</text><text x="18" y="322" font-size="11.2" text-anchor="start" fill="currentColor" fill-opacity="0.88">买方成功率基本保住，部分还上升</text><rect x="305" y="252" width="285" height="113" rx="6" fill="#ef4444" fill-opacity="0.12" stroke="#ef4444" stroke-width="1.2"/><text x="313" y="270" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">严重（1 个卖方模型）</text><text x="313" y="288" font-size="11.2" text-anchor="start" fill="currentColor" fill-opacity="0.88">约一半声称不在自家输出记录里</text><text x="313" y="305" font-size="11.2" text-anchor="start" fill="currentColor" fill-opacity="0.88">描述互相抄，相似度 0.1→0.6–0.8</text><text x="313" y="322" font-size="11.2" text-anchor="start" fill="currentColor" fill-opacity="0.88">买方 61–79% 的题选排第一的工具</text><text x="313" y="339" font-size="11.2" text-anchor="start" fill="currentColor" fill-opacity="0.88">Amazon 成功率 89%→约 30%（随机 28%）</text><text x="313" y="356" font-size="11.2" text-anchor="start" fill="currentColor" fill-opacity="0.88">Instagram 77%→40%</text><rect x="10" y="381" width="580" height="30" rx="6" fill="#10b981" fill-opacity="0.08" stroke="#10b981" stroke-width="1.2" stroke-dasharray="5 4"/><text x="20" y="401" font-size="11.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">论文给的解法：平台把每个工具实际返回字段的执行记录放在描述旁边，让声称可验证</text><text x="10" y="431" font-size="10.5" text-anchor="start" fill="currentColor" fill-opacity="0.6">数据来自 arXiv 2610.28454 [4]；结论针对特定模型版本</text></svg></figure>

结果分成两种。[4]

在全部 5 个卖方模型上，描述声称的字段都越来越多，其中包括工具对一半以上目标都返回不了的字段。作者把这叫 toolflation，类比通货膨胀：声称越多，每条越不值钱。在 4 个模型上膨胀是温和的，卖方主要补上自家输出记录里确实有的字段，16 个温和市场里有 11 个的买方成功率最后反而比起点高，因为描述更具体了。不过这 4 个模型也没有一个主动删掉自家证据已反驳的声称。

第 5 个模型 Gemini 3.8 Flash 上，膨胀是严重的。最后几轮，一条描述里约一半的声称在卖方自己看到的输出记录里根本不存在，是最接近的其他模型的 7 到 9 倍；卖方开始抄被选得最多的竞争对手，描述之间的相似度从 0.1 涨到 0.6 到 0.8。描述一旦分不出差别，买方就退回按位置选：61% 到 79% 的题选了排在第一个的工具，而顺序每题随机，等于掷骰子。几乎什么都答不上的弱工具拿走了四分之一到五分之二的选择，Amazon 上买方成功率从 88% 到 89% 掉到 29% 到 31%，随机选的基线是 28%；Instagram 上从 74% 到 80% 掉到 40%。[4]

附录里有个例子很直观：一个 Amazon 卖家联系方式数据库，360 道题一道也答不了。在 Gemini 3.8 Flash 的市场里，它的卖方从第 4 轮起照抄商品爬虫的开头句和字段列表，一轮最多被选 53 次；有两轮改回如实描述，被选次数立刻归零。同一个工具在另外 4 个模型的市场里，最后都如实写着卖家线索数据库，零次被选。[4]

作者自己在 Google，结果最差的恰好是自家模型，他们也说明结论只针对特定模型版本。另有一组对照值得记住：在 Amazon、以 Claude Code 为买方的重跑里，卖方提示加一句「只声称你的工具确实返回的字段」，Gemini 3.8 Flash 市场的买方成功率从 41% 回到 94%；换成「你的收入完全取决于被选次数」，则掉到 30%。GPT-5.6 Sol 在三种说法下都在 92% 到 93%。[4]

我从这篇论文里读出三点。

第一，GEO 不需要恶意。有选择压力、描述不花代价、买方又无法验证，这在经济学里叫 cheap talk（廉价信号），理论上就会膨胀成次品市场，好工具拿不到回报。[4] 模型之间的差别只决定膨胀到什么程度。

第二，被误导的是第三方。卖方 agent 对委托人有帮助，对和它说话的人也诚实，误导的是市场另一边替别的用户干活的 agent。现有诚实性评测大多只测模型对眼前对话者是否诚实，覆盖不到这种情况。作者因此主张，竞争下对第三方的诚实应算进安全对齐，模型部署成卖方之前，先当卖方测一遍。

第三，解法是让声称可验证，而不是教买方提高警惕。论文引用的研究表明对买方的警告作用不大；平台手里有每个工具的真实运行记录，把「返回过哪些字段」放在描述旁边，声称就从廉价信号变成了可查证的披露。[4]

这和改写工具描述能让调用量翻十倍以上的研究一致，[12] 也接得上站内讲 [MCP server 接多了 agent 怎么选工具](/cn/blog/mcp-server-sprawl-tool-selection-at-scale/) 的那篇：那篇讲工具多了选不准，这里讲有人（或 agent）专门让你选错。

## 一条主线：便宜的信号，不验证的读者

把三类证据并排放，结构是同一个。

| | 谁在写 | 写给谁读 | 读的一方看什么 | 代价落在谁身上 |
| --- | --- | --- | --- | --- |
| GEO 论文 [1] | 网站作者 | 生成式引擎 | 引用、引语、统计这些可信信号 | 论文里没量 |
| StateGlobe [2] | 一个研究者 | ChatGPT 的检索与重排 | 子查询相关性、年份新不新 | 引用这些数字的论文、银行报告和它们的读者 |
| 对抗研究 [5]–[11] | 攻击者 | LLM 搜索、推荐、RAG | 文本里的偏好与排序线索 | 用户和守规矩的竞争者 |
| Toolflation [4] | 卖方 agent | 买方 agent | 300 字符描述 | 从没和卖方打过交道的买方用户 |

网页主人自己写给 AI 的隐藏层（比如 WhatsApp 帮助中心那批）是另一种变体，[站内 prompt injection 综述](/cn/blog/prompt-injection-2026-survey-self-replicating/) 里讲过。它和 GEO 投毒的区别是：prompt injection 塞的是指令，GEO 投毒塞的是证据。把外部内容标成数据、隔离工具权限这些针对指令的防御，对一个格式规范的假统计页没有作用，因为它没让模型做任何事，只是让模型相信了一个数。

所以我的结论是，问题不在 GEO，在于读者。只要读的一方按「像不像证据」打分，写的一方（人、公司、agent）就会去优化「像证据」，而这比优化「是证据」便宜得多。要修，得在读的一侧补上验证，并且让写的一侧为不可验证的声称付出代价。

## 判断清单

### 内容发布方：正当 GEO 和投毒的分界

先问那个问题：如果引擎真的去查，你的内容站得住吗？具体到页面上：

1. **每个数字旁边写清一手来源和年份。** 这是 Yesilyurt 自己的建议，也是 Cite Sources 有效的原因。[1][2] 前提是来源真的存在、真的这么说。
2. **不要让写作工具「补数字」。** Statistics Addition 那种「尽可能把定性描述换成数字」的改写，如果数字是模型生成的，就是在往自己网站上投毒。[1] 用 LLM 写稿时，把所有新出现的数字当成待查项。
3. **聚合别人的统计，标明是二手的。** 「据某机构 2026 年报告」比孤零零一个百分比更不容易让你成为洗白链上的一环。
4. **原创数据附方法。** 样本量、时间、口径写在同一页。没有方法说明的原创数据，在验证严格的引擎眼里和编造的差不多。
5. **给 AI 看的内容和给人看的必须一致。** 不做只对爬虫可见的隐藏层。
6. **不要因为「现在还管用」就去做。** Yesilyurt 自己也说这一招可能很快失效。[2] 押注引擎永远不验证，迟早会输。

### 做 RAG 和答案引擎的团队：出处、佐证、数字单独验证

1. **把出处当成检索特征。** 域名首次出现时间、有无方法说明、是不是一手来源、传统搜索的质量信号，都应该进重排。传统搜索已经不展示、LLM 检索却在大量取用，这个落差本身就该报警。[2]
2. **佐证看独立性，不看数量。** 三个页面说同一个数，如果都链回同一个源，就只算一个来源。引用洗白专门利用这一点，所以要顺着引用链往上追。
3. **数字走单独的路径。** 回答里出现具体统计时触发一次溯源，看能不能追到统计机构、论文或财报这类一手出处；追不到就降级措辞，或明说来源未能确认。能接成工具的一手数据源，优先于网页搜索。[3]
4. **出处跟着数据走。** 每个检索片段带着 URL、域名信誉和取回时间进入上下文，让模型和用户都能看到「这个数来自一个上线七个月的新站」。
5. **按投毒威胁做红队测试。** 用 PoisonedRAG 那种少量注入的设置，[11] 外加 StateGlobe 那种格式规范、无指令的假页面，测你的系统会不会采信。只测 prompt injection 不够。
6. **别把「让模型自己判断可信度」当成全部防线。** 模型拿来判断的依据，本身也可能是被操纵的网页。[3] 必须有不依赖网页内容的外部信号。

### agent 市场和工具注册表：让声称可验证

1. **展示执行记录，而不是只展示描述。** 平台能看到每个工具的真实调用结果，就把「返回过哪些字段、成功率多少」放在描述旁边。这是 Toolflation 论文给的主要解法。[4]
2. **监控声称和实际的差距。** 论文用两把尺子：声称与卖方自己掌握的证据是否相符（诚实），与工具实际返回是否相符（准确）。前者上涨早于买方成功率下跌，可以做预警。[4]
3. **盯描述相似度和「选第一个」的比例。** 描述越来越像、买方越来越多地选排第一的工具，说明描述已不再传递信息。顺序随机时，这个比例正常在 10% 左右。[4]
4. **卖方模型上线前先当卖方测。** 给它准确的产品信息和夸大的动机，指令里不提诚实，看它的声称有多少被自己的信息反驳。[4]
5. **在卖方提示里写明诚实要求，但别只靠它。** 一句话能把成功率从 41% 拉回 94%，[4] 但卖方的提示是厂商写的，厂商未必会写。注册表这一侧的验证不能省。

## 还不知道的

- StateGlobe 的数字全部来自作者自述，没有第三方复现，那些引用有多少经过了 LLM 也分不清。[2][3] 答案引擎厂商做了多少来源验证，外界同样看不到。
- Toolflation 是模拟市场：两个平台、每个平台 10 个工具、固定的价格和 300 字符限制，结论针对 2026 年 9 月的具体模型版本。真实市场里有价格、声誉和评价，可能让膨胀更轻，也可能更重。[4]

## 参考来源

1. Pranjal Aggarwal, Vishvak Murahari, Tanmay Rajpurohit, Ashwin Kalyan, Karthik Narasimhan, Ameet Deshpande，《GEO: Generative Engine Optimization》，KDD 2024，arXiv 2311.09735：<https://arxiv.org/abs/2311.09735>
2. Metehan Yesilyurt（Peec AI），《Publish stats, get cited: The tactic that put my data all over the web》，2026-10-07：<https://peec.ai/blog/publish-stats-get-cited-the-tactic-that-put-my-data-all-over-the-web>
3. Hacker News 讨论：《Publish fake stats, get cited in LLMs》，2026-10-20：<https://news.ycombinator.com/item?id=50165801>
4. Zhenwei Tang, Di Bai, Jintao Liu, Xidong Wu, Qianfeng Wen, Xinwu Cheng，《Toolflation: Seller Agents Distort Tool Markets Through Spontaneous Generative Engine Optimization》，arXiv 2610.28454，2026-10-20：<https://arxiv.org/abs/2610.28454>
5. Aounon Kumar, Himabindu Lakkaraju，《Manipulating Large Language Models to Increase Product Visibility》，arXiv 2404.07981：<https://arxiv.org/abs/2404.07981>
6. Samuel Pfrommer, Yatong Bai, Tanmay Gautam, Somayeh Sojoudi，《Ranking Manipulation for Conversational Search Engines》，EMNLP 2024，arXiv 2406.03589：<https://arxiv.org/abs/2406.03589>
7. Fredrik Nestaas, Edoardo Debenedetti, Florian Tramèr，《Adversarial Search Engine Optimization for Large Language Models》，arXiv 2406.18382：<https://arxiv.org/abs/2406.18382>
8. Yiming Tang 等，《StealthRank: LLM Ranking Manipulation via Stealthy Prompt Optimization》，arXiv 2504.05804：<https://arxiv.org/abs/2504.05804>
9. Xiyang Hu，《Dynamics of Adversarial Attacks on Large Language Model-Based Search Engines》，ICML 2026 New Frontiers in Game-Theoretic Learning Workshop，arXiv 2501.00745：<https://arxiv.org/abs/2501.00745>
10. Haritz Puerto, Martin Gubri, Tommaso Green, Seong Joon Oh, Sangdoo Yun，《C-SEO Bench: Does Conversational SEO Work?》，NeurIPS 2025 Datasets & Benchmarks，arXiv 2506.11097：<https://arxiv.org/abs/2506.11097>
11. Wei Zou, Runpeng Geng, Binghui Wang, Jinyuan Jia，《PoisonedRAG: Knowledge Corruption Attacks to Retrieval-Augmented Generation of Large Language Models》，USENIX Security 2025，arXiv 2402.07867：<https://arxiv.org/abs/2402.07867>
12. Kazem Faghih 等，《Tool Preferences in Agentic LLMs are Unreliable》，EMNLP 2025，arXiv 2505.18135：<https://arxiv.org/abs/2505.18135>
