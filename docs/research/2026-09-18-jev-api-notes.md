# TypeSafe AI Jev：公开开发者接口与可用性证据摘要

- 调研日期：2026-09-18（Australia/Sydney）。
- 范围：官方 docs、HTTP API、SDK、开源边界、部署方式、数据隐私与接入限制。不研究性能 benchmark。
- 方法：使用 web 搜索并打开官方文档、官方 GitHub 和法律文件；仅引用一手来源。以下均为文档核验，不是在线推理实测。
- 安全边界：未登录、未获取或使用密钥、未发送推理请求、未调用付费 API、未安装 SDK。
- 目录惯例：已检查 `docs/research/`，沿用现有中文 Markdown、调研日期、编号来源引用格式。本文不是 Astro 内容集合文章。
- 协作边界：仅新增本文件；保留会话开始时已有的 `cordis.md`、`crypto-basics.md` 未跟踪文件及其他工作者改动。

## 1. 结论先行

**Jev 已有可供开发者阅读的正式 HTTP 接口和 Python/JavaScript SDK，但不应把“公开文档”写成“所有人无需审批即可调用”。** 2026-09-15 发布公告称 early access、分批接纳 waitlist；Quickstart 则要求登录控制台并创建 API key。本次没有验证新账户是否即时获准。[S1][S2]

**其接口是文本状态上的受限决策，不是聊天或任意字符串生成。** 应用发送 `state` 与多个 typed questions，获得 Choice、Score、Noul 结果，再由自己的代码组合和执行动作。[S3][S4]

**开源 SDK 不等于 Jev 模型开源。** 官方公开了 MIT SDK 和 LLM adapter；本次官方资料未找到 Jev 权重、模型推理服务源码或自托管安装包。MCA 明确描述 TypeSafe 托管的服务。[S10][S11][S12][S15]

**不训练客户数据不等于默认零保留。** 官方 Legal 页说明企业 ZDR 要单独联系；普通保留期限没有公开固定天数。应分别确认输入、输出、遥测和备份的保留边界。[S13][S14][S15][S22]

## 2. HTTP 接口及真实语义

### 2.1 请求、响应与模型发现

| 项目 | 已核验语义 | 来源 |
| --- | --- | --- |
| 推理入口 | `POST https://api.typesafe.ai/v1/systemone`；Bearer API key；JSON body | [S3] |
| 必填字段 | HTTP 层为 `model`、`state`、`questions`；SDK 可提供默认模型 | [S3][S8] |
| 输入 | `state` 接受 string/object/array；是文本或文本的结构化表示，不是图像、音频、视频输入 | [S3][S8] |
| 问题标识 | `questions` 是调用方命名的 map；答案保留相同 key。这个 key 不送入模型，不能用 key 替代指令 | [S3] |
| 问题关系 | 同次请求的问题分别针对相同 state 独立求值；不是按 key 顺序执行的工作流 | [S4] |
| 响应 | `model`、`answers`、`usage`，后者包含 input/output token 数 | [S3] |
| 模型列表 | `GET /v1/models` 需认证；文档称当前列出 aliases，版本 ID 即使未列出也可用于调用 | [S8] |

研究判断：依赖前一个答案的步骤，需要应用发起下一次请求，或预先询问各分支所需的问题后由代码筛选；不能假设一次请求内的问题互相可见。[S4]

### 2.2 三种 primitive 不可混淆

| 类型 | 输入约束与输出语义 | 来源 |
| --- | --- | --- |
| Choice | 在预设选项中选最高概率项；返回 `choice`、完整 `probabilities` 与 `confidence`。最多 255 个选项；可自行加入 other/none | [S5] |
| Score | `criteria` 为 2–10 个有序等级描述。等级索引从 0 开始；`score = sum(index * probability)`，不是直接选一个整数；还返回 `legend`、`probabilities`、`confidence` | [S6] |
| Noul | 二元问题“是”的概率，返回 `noul`，范围 0–1；不是 boolean，也没有独立 `confidence` 字段 | [S3][S7] |

Score 不是任意数值回归：三档得到的分数范围是 0–2，可能为 1.3；它不自动代表比例、金额或真实业务量。相同均值可能来自不同分布，必须结合分布解读。等级描述应独立完整，不能写“比上一档更严重”，因为模型不依赖邻档或等级数字理解该描述。[S6]

`confidence` 是从概率分布计算的统计量，不是另一个独立预测，也不等于最大类别概率。官方 Confidence 页没有列出精确公式；本次未验证服务端实现。不能将 `confidence=0.9` 自动解释为该任务有 90% 正确率，阈值应在自己的业务数据上确定。[S7]

类型受限不能推出事实正确。MCA §9.3 明确承认输出可能错误并要求客户独立评估；“不生成任意字符串”不意味着“不会误分类”。[S15]

### 2.3 当前模型与限额快照

- 官方 Models 页列出 `jev-1.13.0`；`jev-latest` 与 `jev-preview` 均指向它，当前没有单独 preview build。[S8]
- 同页给出 64k tokens/请求，同时要求 `state + 最长单个问题` 不超过 32k；不能只检查总长度。[S8]
- 页面限额为 250,000 tokens/秒、1,200 请求/分钟，但明确可能动态调整且不另行通知；企业/定制计划可申请更高额度。[S8]
- 文档列价为每百万输入 tokens 0.042 美元，输出 tokens 免费；这是价格快照，不是总账单承诺或性能结论。[S8]
- 按账号不提供 Jev fine-tuning/LoRA；官方称所有账号使用相同权重，定制通过 state、instructions、criteria 完成。[S8]
- `jev-latest` 会随发布移动。研究建议：生产固定版本 ID，并记录响应模型字段；版本迁移时重验业务阈值。[S8]

### 2.4 错误与重试

HTTP 文档列出 401（认证）、422（请求验证）、429（限额）和 529（过载）；429/529 建议指数退避，官方 SDK 默认处理重试。[S3]

Python `RetryPolicy` 可配置重试次数、状态码、退避、jitter、连接/超时错误及 `Retry-After`/`retry-after-ms`。其 `timeout` 是包含首次尝试和等待的单次 SDK 调用总重试预算，不只是一次 HTTP 请求的超时。[S17]

未知：本文未核验幂等键、重试请求是否重复计费、请求取消后的计费、最大问题数、并发上限与生产 SLA；不能仅凭 SDK 自动重试推断这些保证。

### 2.5 文档内部差异

- Models 页称响应 `model` 返回版本 ID，但 HTTP 示例仍返回 `jev-latest`；固定版本调用之外，响应是否总能用于追踪实际权重，需要后续实测确认。[S3][S8]
- HTTP reference 将 Choice.criteria 标为 `string | null`，Choice 专题页允许 object/array；HTTP 将 Score.legend 值标为 string，Score 专题页示例却含 object。复杂 criteria 的实际 schema 需对照固定 SDK 版本和服务端确认；初始封装使用简单字符串。[S3][S5][S6]

## 3. SDK、版本及开源边界

| 对象 | 已核验 | 来源 |
| --- | --- | --- |
| Python | 包名 `typesafe-sdk`，导入 `typesafe_sdk`；Python >=3.10；同步 `TypeSafeClient`、异步 `AsyncTypeSafeClient`，方法 `system_one` | [S2][S9] |
| JavaScript/TypeScript | 包名 `@typesafe-ai/sdk`；Node.js >=20；`TypeSafeClient.systemOne`；ESM、CommonJS、TS declarations 和按问题推导的答案类型 | [S10] |
| 官方 Python/JS 仓库 | 均公开并标记 MIT；这证明客户端可审查，不证明服务端或权重开放 | [S10][S11] |
| System One adapter | MIT；使用其他 LLM API 替代 TypeSafe evaluation API，保持相近返回结构；不是本地 Jev 推理实现 | [S12] |

安装形式可采用 `uv add typesafe-sdk`、`pnpm add @typesafe-ai/sdk`；本次只记录，没有执行。

版本注意：Python changelog 已列出 **2026-09-18 v0.7.0**，序列化库由 msgspec 改为 pydantic，`system_one` 新增 `response_model`。2026-09-15 v0.6.0 则将 Score.criteria 从整数键 dictionary 改为有序 sequence。因此需要固定 SDK 版本；旧 adapter README 的 msgspec 序列化说明不能不加验证地套用到新版 SDK。[S18][S12]

这里确认的是“文档已发布 v0.7.0 记录”，没有核验 PyPI wheel 是否已同步或执行安装。JavaScript changelog 本次 web 抽取只得到导航，没有版本正文，故不报告最新 JS SDK 版本。[S19]

## 4. 部署与可用性边界

已确认的使用路径是客户应用通过 HTTP/SDK 访问 TypeSafe 托管 API；控制台 Playground 同样需要登录。[S2][S15]

本次查阅官方 docs 索引、模型页与官方 GitHub 组织，并搜索官方域名的 self-hosted/on-premise/deployment 信息，**没有找到** Jev 权重下载、Docker 推理镜像、离线部署、VPC/私有区域或 on-prem 安装指南。这是公开证据缺口，不是断言企业销售绝不提供。[S8][S20][S21]

隐私政策明确服务托管在美国；未核验可选择其他区域。不能把安装 SDK、设置自定义客户端 URL，或运行 LLM adapter 视为已能自托管 Jev。[S13][S12]

研究判断：可以据现有文档设计接口封装、mock 与错误处理；真正的可调用性、账号额度和上线保证仍需获得授权后单独验证，本研究没有跨过这一界线。

## 5. 数据隐私、合规与合同边界

| 问题 | 一手证据与限制 | 来源 |
| --- | --- | --- |
| 是否用于训练 | Privacy Policy 承诺不以 Input 训练或微调；MCA §4.1 规定未经客户预先同意不以 Customer Data 训练模型权重 | [S13][S15] |
| 不训练是否等于不处理 | 否。MCA §4.1 许可履约处理数据及生成 Telemetry；§4.3 对遥测使用保留宽泛权利 | [S15] |
| 默认是否零保留 | 未确认。Legal 文档明确把 ZDR 表述为企业客户联系申请的选项 | [S22] |
| 数据驻留 | Privacy Policy 的 International Visitors 节称美国托管 | [S13] |
| 保留多久 | DPA Schedule I §8 为按目的和法律所需期间，没有固定天数 | [S14] |
| 删除 | Privacy Policy Retention 节提供请求删除或去标识机制，但须已无合理保留需要且受法律例外约束 | [S13] |
| 分包商 | DPA §3 指向 Trust Center 名单；合理提前通知，客户可在 15 天内提出异议；本次无法抽取名单 | [S14][S23] |
| 安全事故 | DPA §5.2：无不当延迟，且最迟知悉事故后 72 小时内通知 | [S14] |
| 审计可见性 | Trust Center 搜索索引列出 SOC 2 Type II - 2026 和 Request access；正文未抽取成功，未验证报告、日期、加密算法或控制有效性 | [S16] |

合同风险：

- MCA §2.3(f) 限制发布服务 benchmark 或 performance information；正式发布前需澄清条款适用性。这里只记录合同风险，不研究性能。[S15]
- MCA §4.1 明确定义 Customer Data 包含 Input 和 Output；§4.2 在法律允许范围内把供应商持有的 Output 权利转让客户。[S15]
- MCA §10.3 允许标准备份保留客户机密信息；不能推导终止服务就会立即物理擦除。Telemetry 范围还应单独确认。[S15]
- DPA Schedule I 的敏感数据栏为 N/A；本次未找到 BAA/HIPAA 适用保证，不将普通隐私条款当作医疗数据合规认证。[S14]

## 6. 尚需供应商确认

1. 新账户目前是即时开通、候补名单还是人工审批？支持哪些国家和付款方式？有无免费额度？
2. Jev 的企业私有部署、VPC、区域选择、专用实例是否真实可购买？公开材料未给出实施契约。
3. `confidence` 的精确计算、版本稳定性，以及返回完整 Choice/Score 概率的语义保证是什么？
4. 请求/响应原文、日志、监控、缓存、备份各自的默认保留时间是什么？ZDR 排除项、启用凭据和费用是什么？
5. 当前分包商、数据流向、跨境传输机制、DPA 签署及删除证明如何获得？
6. API 请求大小、问题数、并发、幂等、重试计费和 SLA 的书面约束是什么？
7. 公开结果比较与 MCA §2.3(f) 如何协调？SDK MIT 许可不能替代服务合同授权。
8. Python 0.7.0 文档、实际分发包及 adapter 的兼容矩阵是否已同步？

以上为待确认项，不是已经发现的缺陷。它们来自本次公开资料不足，不能据此断言供应商不具备该能力。

## 7. 一手来源索引

全部于 2026-09-18 通过 web 打开核验。来源权重区分：API 文档用于接口契约；GitHub 用于客户端开源边界；法律文件用于数据/合同范围；营销与 Trust Center 仅作为供应商主张。

- [S1] [Introducing System One Models & Jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev) — 2026-09-15，early access 与 waitlist 说明。
- [S2] [Quickstart](https://docs.typesafe.ai/introduction/quickstart) — 控制台、key、HTTP 和 Python 起步示例。
- [S3] [HTTP API](https://docs.typesafe.ai/api) — 请求 schema、primitive 字段、答案和错误码。
- [S4] [Primitives](https://docs.typesafe.ai/primitives) — 相同 state 下问题独立、概率输出与应用控制流。
- [S5] [Choice](https://docs.typesafe.ai/primitives/choice) — 选项数量、none/other 与概率字段。
- [S6] [Score](https://docs.typesafe.ai/primitives/score) — 有序等级、期望值、分布解释与独立描述。
- [S7] [Confidence](https://docs.typesafe.ai/confidence) — 派生统计量及 Noul 无独立 confidence。
- [S8] [Models](https://docs.typesafe.ai/models) — 模型 ID、aliases、限额、价格、文本输入与无 per-account fine-tuning。
- [S9] [Python SDK](https://docs.typesafe.ai/sdk/python) — 版本要求、同步/异步客户端、类型接口。
- [S10] [官方 JavaScript SDK 仓库](https://github.com/TypeSafe-AI/typesafe-sdk-js) — MIT、Node 20+、包名、模块和接口。
- [S11] [官方 Python SDK 仓库](https://github.com/TypeSafe-AI/typesafe-sdk-python) — MIT、源码与分发说明。
- [S12] [官方 System One adapter](https://github.com/typesafe-ai/system-one-adapter-python) — MIT、外部 LLM 后端及 msgspec 示例。
- [S13] [Privacy Policy](https://typesafe.ai/legal/privacy-policy) — Last updated 2025-11-19；不训练、美国托管、保留及使用数据。
- [S14] [Data Processing Addendum](https://typesafe.ai/legal/data-processing) — Last updated 2026-04-24；保留、事故、分包商与跨境条款。
- [S15] [Master Customer Agreement](https://typesafe.ai/legal/mca) — Last updated 2026-08-27；托管、许可、数据、限制和输出免责声明；实际协议以客户 Order 为准。
- [S16] [Trust Center](https://trust.typesafe.ai/) — web 搜索索引可读，直接打开正文为空；只确认索引列出的报告名称，不确认审计细节。
- [S17] [Python RetryPolicy](https://docs.typesafe.ai/sdk/python/api/retries) — 重试状态、退避和总时间预算。
- [S18] [Python SDK changelog](https://docs.typesafe.ai/sdk/python/changelog) — 0.7.0/0.6.0 的日期与破坏性变化。
- [S19] [JavaScript SDK changelog](https://docs.typesafe.ai/sdk/javascript/changelog) — 本次抽取未返回版本正文，不用于认定最新版本。
- [S20] [官方 docs 索引](https://docs.typesafe.ai/llms.txt) — 公共文档入口与覆盖范围。
- [S21] [TypeSafe-AI 官方 GitHub 组织](https://github.com/TypeSafe-AI) — 公开仓库发现入口。
- [S22] [Legal 文档入口](https://docs.typesafe.ai/legal) — 三份法律文件规范链接，以及企业 ZDR 联系方式。
- [S23] [Subprocessors](https://trust.typesafe.ai/subprocessors) — DPA 明确指向此地址，但本次 web 获取失败；名单属于未知项。

## 8. 验证记录

- 本次没有在线推理实测，不能证明服务成功率、真实额度、账号开通状态或数据删除行为。
- 少数初始 URL 未能访问，已沿官方文档索引、Legal 页和 GitHub 组织链接纠正；Trust Center 动态正文和分包商名单仍无法核实，不以缺失正文推断没有相关控制。
- 仅新增研究文档，没有修改交互或产品代码，因此不运行构建和 E2E。
- 未执行失败的 shell 命令；不需要追加 shell 故障候选记录。
