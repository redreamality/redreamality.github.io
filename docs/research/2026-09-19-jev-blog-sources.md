## Jev 读者博客：观点文章与亲历来源

核查日期：2026-09-19。用途：供主 agent 撰写平实的中文读者博客，不是性能评测报告。

按 research skill 的一手来源原则核查。当前研究分工直接完成检索与落盘；未另建用户任务。未研究 awesome-jev 仓库、案例代码或调用推理 API，未发布、提交或推送。

### 来源与日期

| 编号 | 原文与具体 URL | 日期核实 | 身份及利益关系 |
| --- | --- | --- | --- |
| S1 | [Composable AI: Build Prod, Not God](https://typesafe.ai/manifesto) | 页面未标发布日期；只能确认核查日可见，不能套用产品发布日期 | TypeSafe 官方宣言，存在直接产品商业利益；页面未署个人作者 |
| S2 | [The Bitterest Lesson](https://typesafe.ai/blog/bitterest-lesson) | 官方页面标 2026-09-10 | TypeSafe 官方观点文章；其脚注链接到 Diogo 的[同题个人原文](https://www.completeskeptic.com/p/the-bitterest-lesson)，不是第二份独立验证 |
| S3 | [Lies, Damned Lies, and Benchmarks](https://typesafe.ai/blog/antibenchmaxxing) | 页面标 2026-09-11 | TypeSafe 官方评测立场，直接关系到其产品如何被评价；页面未署个人作者 |
| S4 | [Mini-Vibe Check: TypeSafe's Jev Judged Everything I've Written in 0.7 Seconds](https://every.to/also-true-for-humans/mini-vibe-check-typesafe-s-jev-judged-everything-i-ve-written-in-0-7-seconds) | 首发 2026-09-15，更新 2026-09-18 | 作者 Mike Taylor 是 Every 的 evals 负责人，采访了 TypeSafe 联合创始人；另一组测试由 Every CEO Dan Shipper 完成 |
| S5 | [Testing Jev on public and private data: classifier or filter?](https://amankumar.ai/blogs/jev-measured) | 文末标 2026-09-18 | Aman Kumar；报告自己的管线实验；正文未见 TypeSafe 资助或无利益关系声明 |
| S6 | [Jev: one judge call, or twelve dimension scores? I measured both on three tasks](https://agentjournal.dev/blog/llm-judge-vs-feature-extraction/) | 文首标 2026-09-17 | ikkun；[About](https://agentjournal.dev/about/)说明经营技术博客；[披露页](https://agentjournal.dev/disclosure/)说明联盟链接收入，并自述不接受付费文章、提及或评测。未独立审计这些声明 |
| S7 | [An early-access test of TypeSafe's Jev: calibrated judgments for half a cent](https://lindfors.no/blog/a-first-look-at-typesafes-jev/) | 文末标 2026-09-18，正文实验快照也是该日 | Emil Lindfors；数据咨询从业者，自述获得 early access，TypeSafe 未看过文章及结果；这不等于排除其他利益关系 |
| S8 | [TypeSafeのJevを正しく驚く、それってLLMでできませんか？](https://zenn.dev/nwn/articles/824026c76116e0) | 首发 2026-09-17，页面另标 2026-09-18 更新日期 | 署名「ヨ」；原创实验记录，正文未见 TypeSafe 商业关系披露；作为补充而非主证据 |

利益关系补充：S4 可见正文未提供足以确认或排除 TypeSafe 投资、付费合作、赠送额度等关系的信息，不能写成“无利益关系的独立测评”。作者实测是其观察的一手来源，不等于经过独立审计的通用 benchmark。以下优先采用 S5、S6、S7；S4 与 S8 只补充叙述和方法边界。Flavio 页面在本次补核时返回 web Internal Error，不纳入最终证据。

### 六个可用观点

#### 1. 它想改变的首先是 AI 在软件里的位置

- 可用表述：TypeSafe 不把聊天助手作为唯一产品形态，而是希望把语义判断做成普通程序可调用的一个部件。
- 具体证据：[S1](https://typesafe.ai/manifesto) 的 “beyond horseless carriages” 将模型负责的语义判断与代码负责的精确计算分开；“safe emergence” 强调部件需要能被检查、测试和约束。
- 未知边界：这是厂商的设计主张，不证明 Jev 已经达到数据库式可靠性，也不能据此断言“通用智能问题已经解决”。适合解释定位，不适合作为可靠性背书。

#### 2. 比模型再大一点更早的问题，是究竟要优化什么

- 可用表述：在 TypeSafe 的解释里，自动化首先需要选对任务；训练指标变好，不必然意味着软件里的实际工作变好。
- 具体证据：[S2](https://typesafe.ai/blog/bitterest-lesson) 提出任务、数据、算力、算法的优先顺序，并明确说这不是反对规模扩展，而是要求先理解模型所在的外部系统。
- 未知边界：这是作者的经验框架，不是经实验证明、适用于所有机器学习问题的严格排序。文中对未来 GPT 编号的外推不要改写成已测性能；本文也不把历史 InstructGPT 例子当作 Jev 的能力证据。

#### 3. 反对“刷榜”不等于可以免于评测

- 可用表述：TypeSafe 反对围绕公开分数反复挑选模型，但仍主张用户在自己的任务上验证。
- 具体证据：[S3](https://typesafe.ai/blog/antibenchmaxxing) 的 “What benchmarks should be” 承诺不在发布中提供标准榜单表；新评测作为带日期的快照，发布后不再围绕它持续优化，并披露局限、挑选和不利证据。
- 未知边界：这是公开承诺，不是本次已审计的执行结果。“现有 benchmark 不适用”是厂商立场，不能推导出 Jev 更好或不需要对照。成稿可接一句：不看排行榜之后，更需要看自己的错误样本。

#### 4. 自己管线里不起眼的筛选问题，可能比通用榜单更有解释力

- 可用表述：Aman Kumar 的记录说明，适不适合一个任务，不能只看厂商展示的场景。
- 具体证据：[S5](https://amankumar.ai/blogs/jev-measured) 测了会议文本中的行动项筛选：30 条自写样本、一个预先确定的问题，报告准确率 0.833、precision 0.929、recall 0.765。他另测两个公开多分类数据集，没有因此得出普遍领先的结论。
- 未知边界：30 条是作者编写的小样本，不是独立标注的真实生产分布。公开任务使用对所有候选标签评分并取最大值的方法，和二元筛选并非相同实验设置。作者用固定间隔发请求以避开吞吐限制；耗时包含客户端开销和人为 pacing，不能当最大吞吐 benchmark。别将原文“2.65% cost”等转述案例混作本次实测。

#### 5. 拆成多个具体判断有时更好，但也会把错误放大

- 可用表述：ikkun 的实测里，把最终判定拆成多个维度，再交给小分类器，并非处处优于直接问一次。
- 具体证据：[S6](https://agentjournal.dev/blog/llm-judge-vs-feature-extraction/) 报告日语金融情感任务中，12 维评分加逻辑回归的 macro-F1 为 0.901，直接判断为 0.734；另一个困难正常文本留出集上，同类拆分方案的误报率为 7.14%，直接判断为 2.50%。
- 未知边界：这是“Jev 特征加监督学习”的完整方案，不是模型单独零样本能力。作者承认原始切分让少量相似模板跨集合，另给去重结果；不能把原始分数当完全无泄漏的估计。其多语言测试标签部分由模型判定、未逐条人工复核。此处只取方法上的取舍，不展开主 agent 负责的安全项目与代码。

#### 6. 输出概率是方便的接口，是否校准仍要另测

- 可用表述：Emil Lindfors 的早期测试显示，同一个模型在不同任务上的概率表现可能很不一样，阈值不宜直接照搬。
- 具体证据：[S7](https://lindfors.no/blog/a-first-look-at-typesafes-jev/) 从 5,000 条合成政党政策陈述中固定随机抽取 200 条，同时问所属政党和是否关于移民政策；报告前者在其中 132 条上的最高置信选项与标签一致，后者 Brier score 为 0.010。
- 未知边界：陈述和标签均由另一模型生成，所以 132/200 衡量的是与合成标签的一致性，不是客观政治分类准确率。作者发现三选项置信度未归一化，并自行归一化；政党任务置信度与正确性关系不佳，而二元任务表现较好。不能用后一结果证明所有任务都已校准，标题里的价格也只是该次快照。

### 可选的叙述材料

- [Every / S4](https://every.to/also-true-for-humans/mini-vibe-check-typesafe-s-jev-judged-everything-i-ve-written-in-0-7-seconds)：Mike Taylor 报告对 98 篇文章的一组请求在 0.7 秒内返回，另有 Dan Shipper 对 256 个列表条目的检查；后者的一个实际问题在多次调用后仍未被稳定识别。可以同时写“批量判断很方便”和“低延迟不消除漏检”。没有统一硬件、重复统计或独立金标准，不能写成通用速度或准确率排名。
- [Zenn / S8](https://zenn.dev/nwn/articles/824026c76116e0)：作者自建 16 条日语客服消息、每条 4 个二元问题，对 API 批处理进行计时，并明确讨论冷启动、正式计时和重试记录。适合作为“如何透明交代实验设置”的补充，而不是第四份广泛能力证明。样本小且由作者设计；不在博客中复制对其他产品的排名。

### 成稿建议与待验证项

建议用上述观点解释“把模糊判断接回普通程序”的意义，再用三位作者不同任务上的收益与失误让读者理解边界，不把官方宣言当实验结论。

- 引用格式保留作者、日期和任务，例如“在 Aman Kumar 自写的 30 条行动项样本里”，不要省略限定语只报百分比。
- 分开模型能力、问题设计、候选标签、后置分类器、批处理方式与测试数据质量，不能把这些共同产生的效果全部归因于 Jev。
- 未重新执行任何实验；未确认当前服务版本与作者测试版本一致；未验证生产负载、长期错误率或隐私合规。
- 不重复主 agent 对 browser-use、路由、上下文裁剪、代码检查等项目的核验；上述文章对这些项目的转述未作为本文件证据。
- 仍需真实业务分布、人工复核留出集、校准曲线和误判成本分析，才能讨论是否值得接入；本文不据此给出接入结论。

核查备注：Flavio 页面的一次 web 抓取失败只说明该次工具未取到内容，不证明网页下线。本研究未发生 shell 命令执行失败。
