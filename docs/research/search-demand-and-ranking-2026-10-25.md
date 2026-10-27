# 10 月搜索点击、退位页面与需求缺口

采集日期：2026-10-25，Pacific/Port_Moresby。对象为 redreamality.com。通过已登录 Chrome 读取 Google Search Console，并实际执行 12 个 Google 查询；另抓取本站及竞品正文核对。只做研究，没有改文章、提交或发布。

## 结论

本月新增内容带来的点击，被旧页面的损失抵消了不少；同时，本月后半段已经在增长。优先工作应是修复已有搜索入口，以及把有曝光的主题做成用户能直接完成任务的答案。

不能把所有损失归结为排名下降。OpenSpec CLI 有同页同词退位证据；Jev 和 AGENTS.md 页还伴随更大幅度的曝光收缩；Byobu 的宽词与速查词表现不同。当前 SERP 只能说明今天有哪些竞争页面，不能证明它们何时超过本站或导致了全部损失。

## 数据口径

| 指标 | 9 月 8–30 日 | 10 月 1–23 日 | 变化 |
| --- | ---: | ---: | ---: |
| 点击 | 1,306 | 1,285 | -21，-1.6% |
| 曝光 | 120,165 | 109,398 | -10,767，-9.0% |
| CTR，按每日明细汇总计算 | 1.087% | 1.175% | +0.088 个百分点 |
| 平均位置，GSC 卡片舍入值 | 7.7 | 7.9 | 退后约 0.2 |

两个窗口均为 23 天，日期沿用 GSC 报表，不换算为本地日期。点击、曝光来自每日表相加，不从 1.28K 等舍入卡片反推。平均位置数字越小越好，不代表某一次搜索的固定名次。

本月连续三个完整七天窗口的点击为：10 月 3–9 日 328，10–16 日 395，17–23 日 480。因此“整个月相对上个窗口几乎没增长”成立，“最近完全没改善”不成立。没有做显著性检验。

页面表分别取得 649、838 行，均未碰到 1,000 行上限；查询表两期均碰到 1,000 行上限。查询还受匿名化影响，不能把可见查询相加视作完整流量。含 `#fragment` 的页面行保留在原始数据里，下面的页面点击只取无片段的精确 URL，避免把章节结果重复相加。

## 新内容为什么还没有明显抬高总量

用当前线上 `sitemap-0.xml` 与本地 frontmatter 对照，声明发布日期为 10 月 1–23 日的正式博客共有 **61 个 slug、123 个语言 URL**：英文 61、中文 61、日文 1。不是 123 篇独立选题。

| 新博客观察项 | 数量 |
| --- | ---: |
| 在本期 GSC 页面表出现，包括同 URL 的片段记录 | 45 / 123 |
| 无片段精确 URL 有点击 | 25 / 123 |
| 这些精确 URL 的点击合计 | 207 |
| Lauren Tan 演讲文章三语点击 | 136，占上述 207 的 65.7% |
| 本期页面表未返回的 URL | 78 |

即使只看声明日期不晚于 10 月 8 日的 65 个版本，也仅 21 个在页面表出现。值得单独检查发现、抓取及索引状态，但缺失行不能直接称作“未收录”或“零曝光”。frontmatter 日期也不是已核实的首次上线时间，当前 sitemap 不是月初历史快照。各新文章的可观察天数不同，不宜按这 23 天的点击给它们统一判定成败。

pstack 指南属于 notes，不在上述正式博客 cohort 中；其英、中、日页面分别取得 250、19、7 次点击。新增流量确实存在，而且主要集中在少数能解释具体工具和工作方法的页面。

旧页面损失明显：

| 页面 | 点击，前→后 | 曝光，前→后 | 平均位置，前→后 |
| --- | ---: | ---: | ---: |
| `/cn/blog/typesafe-jev-use-cases/` | 191→24 | 2,205→274 | 7.3→8.3 |
| `/blog/claude-md-agents-md-deep-dive/` | 104→35 | 11,014→3,247 | 6.9→7.3 |
| `/garden/notes/openspec-guide/` | 96→45 | 15,533→8,549 | 7.5→7.8 |
| `/blog/openspec-tutorial-cli-commands-agents-md-examples/` | 92→45 | 8,904→4,898 | 6.2→7.1 |
| `/blog/openspec-1-5-stores-beta-update-guide/` | 70→27 | 3,887→2,134 | 5.9→6.0 |
| `/blog/jev-claude-code-10x-and-25-lines/` | 163→124 | 5,667→6,184 | 8.0→7.8 |
| `/garden/notes/bmad-method-guide/` | 17→12 | 2,180→1,331 | 8.9→11.1 |
| `/blog/byobu-cheatsheet/` | 15→8 | 1,460→827 | 7.7→8.0 |

前五页就少了 377 次点击。英文 Jev/Claude 页则是曝光增加、位置略改善、点击下降，不能用“掉排名”解释。曝光减少也不等于全网搜索量下降，本轮没有取得对应市场总搜索量。

## 退位页面与当前竞争结果

下面的顺序是 10 月 25 日 Google 适配器返回的自然结果顺序，不含 PAA。英文查询使用 `lang=en`，`jev 使用` 使用 `lang=zh`；没有固定国家、城市或完全排除个性化。单次未返回本站不意味着全球所有用户都看不到。

### 1. OpenSpec CLI：最先修

精确词 `openspec cli`、同一英文教程：

| 范围 | 点击，前→后 | 曝光，前→后 | 平均位置，前→后 |
| --- | ---: | ---: | ---: |
| 所有国家和设备，同页同词 | 21→5 | 353→363 | 2.8→4.6 |
| 美国、桌面，同页同词 | 1→1 | 48→49 | 2.7→4.3 |

退位方向在美国桌面切片也存在，不过样本小，而且这个切片的点击没有下降。全站查询行是 359→364 曝光、位置 2.9→4.6，与单页口径略有不同。

实际搜索 `openspec cli` 返回：①官方 GitHub CLI 文档；②官网 CLI；③官网安装页；④官方仓库；⑤ skills.rest 的 CLI 技能页；⑥本站教程；⑦ Reddit；⑧ Glukhov 的 Quickstart。`install openspec` 返回的七条自然结果中，前五条是官方文档、仓库、项目配置说明和 Homebrew，本站未出现。

对手在做什么：

- [官方安装文档](https://openspec.dev/docs/installation)先给独立二进制安装，区分 Windows 与 macOS/Linux，随后覆盖包管理器、校验、PATH、升级、迁移和卸载。
- [官方 CLI 文档](https://openspec.dev/docs/cli)按命令和参数组织，适合用户带着某个命令来查。
- [Glukhov Quickstart](https://www.glukhov.org/ai-devtools/openspec/)把终端命令与聊天里的 slash command 分清，按首次工作流、目录产物、常见问题组织。它在本次 `openspec cli` 结果中位于本站之后，可借鉴结构，但不是本次排在本站前面的对手。

本站线上教程已有经过固定版本验证的代码，并非旧诊断中的泛泛占位稿。不过首屏仍使用 npm 1.13.2、Node 和 pnpm 路径；这是可复现的历史版本教程，不足以完整承接当前“怎么安装”的意图。建议保留版本说明与现有 URL，在前部增加当前安装选择、成功判据及失败排查，把历史版本练习单列。不要简单将所有版本字符串替换成 `latest`。

### 2. AGENTS.md / CLAUDE.md：比较查询落到历史综述

同一英文页、精确词 `agents.md vs claude.md`：点击 10→2，曝光 829→266，位置 5.2→6.3。该查询在两期都归到这篇英文页；未进一步控制国家和设备，不作强因果结论。

本次前排为 Reddit、[Build This Now](https://www.buildthisnow.com/blog/guide/mechanics/agents-md-vs-claude-md)、MindStudio、Termdock、[Nimbalyst](https://nimbalyst.com/blog/agents-md-vs-claude-md/)、re-cinq 等，八条自然结果未返回本站。PAA 包含 `Does CLAUDE ignore AGENTS MD?`。

已打开的 Build This Now 和 Nimbalyst 都在前部回答文件共存、读取行为、复用规则与配置方法。本站文章首段则明确说这是约六千词的历史综述，“不是 how-to guide”，之后再展开机制、案例与观点。内容价值与查询任务存在距离。

当前官方 [Claude Code memory 文档](https://code.claude.com/docs/en/memory)还给出了具体版本、默认回退及双文件设置。本站开头仅笼统说多个工具原生读取 AGENTS.md，没有同等清晰的条件表。优先增加“你的版本与文件布局会加载什么”的答案、检查方法和小型模板，再引导读者进入综述。

不要照抄竞品所有技术说法。例如 Build This Now 给 AGENTS.md 描述了所谓固定 schema；[AGENTS.md 官方说明](https://agents.md/)明确它是普通 Markdown、没有必填字段。可学习问题组织方式，事实应回到官方文档。

### 3. Jev 中文使用场景：最大点击损失，需要补接入证据

页面点击少了 167，但曝光跌幅远大于平均位置变化。精确词 `jev 使用` 的全站查询行为 120→15 曝光、8→3 点击、位置 6.6→8.3；`jev使用` 为 126→6、11→0、7.1→9.2。小样本和未固定人群限制了归因。

实际搜索 `jev 使用` 返回：

1. [Datawhale Jev cookbook](https://github.com/datawhalechina/jev-cookbook)。
2. [Google 判别模型 Codelab](https://codelabs.developers.google.com/codelabs/discriminative-models?hl=zh-cn)。
3. [10100：五类场景与接入指南](https://m.10100.com/article/151933083)。
4. X 的入门、开源项目与 API Key 教程。
5. 知乎的 Codex 集成实践。
6. DataCamp 的模型说明。
7. [UIED：四个实操案例](https://www.uied.cn/posts/921960)。

本次结果没有本站。已打开的 Datawhale 仓库提供教程和 Notebook 入口；10100 文章很早给出中文分流请求、返回值、调用命令，并报告自己的固定样本对照。其评测是该作者自述，本轮没有复现。

本站当前正文侧重适用性、项目机制与证据边界，没有与该接入指南相同的自测记录。建议沿用原 URL，补一个完整中文任务、输入输出、错误处理和回退结果。不要为了补流量再写一篇同质的 Jev 泛论，也不要声称当前竞品位置解释了全部曝光损失。

### 4. BMAD：确有页面退位，宽词样本较弱

页面平均位置 8.9→11.1；同页 `bmad method` 仅 40→38 曝光，位置 32.0→34.3，点击 1→0。不能将页面平均位置 11.1 误认为核心品牌词已在第 11 名。

`bmad method` 前两条是官方仓库与[官方文档](https://docs.bmad-method.org/)，随后是 Reddit、官方组织、Medium、Augment 和 dev.to。本站未出现在本次七条自然结果中。

官方首页按“模糊想法、小改动、已有代码库、大功能、团队定制”给入口；它让用户先选当前任务，再进入工作流。本站已经有 6.12.0 的安装、真实目录和练习，不应重复旧报告的 v4/alpha 错误诊断；不过文章明确没有跑过真实模型的练习实现。机会是补一个端到端产物和验收结果，以及从安装失败到首个小改动的短路径。泛品牌词以官方为主，不值得单靠加长综述去抢。

### 5. Byobu：不要追含义混杂的宽词

同页 `byobu`：311→105 曝光，位置 10.0→13.0；但 `byobu cheat sheet`：31→22 曝光，位置 6.0→5.5。`byobu commands` 是 36→37、6.1→6.9，点击均为零。

实际 `byobu` 结果混合官方终端工具、GitHub、日本屏风百科、古董商品与美术展览。更匹配的 `byobu commands` 则返回命令 Gist、[Shiraz 快捷键表](https://www.smcclennon.com/posts/byobu-keyboard-shortcuts/)、[官方页](https://byobu.org/)及 man page。

本站正文抓取后约 1,682 字符，主要是短命令清单；官方页有平台安装、键位表、窗口/会话/面板区分和故障说明。建议强化速查，增加 attach、恢复、会话重命名、快捷键被终端截获的排查。把 detach 和 exit/关闭明确分开，不为宽词排名改成泛科普。

### 6. 两个应保护的对照

- **PYTHONPATH**：英文页点击 78→73。全站 `pythonpath` 位置 6.0→5.9，`pythonpath environment variable` 则 5.2→6.5；本次后一查询本站排第四。实际结果前面有 GeeksforGeeks、Stack Overflow 和 Python 官方讨论。说明要看词，不能把整页归为明显退位；只针对环境不生效等任务补充。
- **Claude SDK**：当前线上教程已有 lifecycle、取消、超时和 hooks 的完整段落。`claudesdkclient query lifecycle cancellation timeouts` 为 124 曝光、0 点击、位置 3.0，本次搜索本站排第二，前面是官方 GitHub 的 Windows 初始化挂起 issue。此词的平均位置从 9.1 改善到 3.0。不能再按“截断缺正文”处理，优先检查搜索摘要与错误场景入口；低点击也可能包含直接在搜索页获得答案、导航意图或非典型曝光，尚未证实。

## 12 项需求清单

这里的“缺口”是本站尚未充分承接的搜索任务，或值得验证的产品化答案，不表示全网没有答案。数字是 10 月 1–23 日本站 GSC 查询曝光/点击，不是月搜索量。每项的近义词分列，避免把不同查询简单拼成市场规模。

| 优先级 | 用户要完成的事 | 观察到的词与曝光/点击 | 当前缺口与建议交付 | 承接位置 |
| --- | --- | --- | --- | --- |
| P0 | 安装 OpenSpec 并确认能运行 | `install openspec` 194/0；`openspec install` 99/0；`how to install openspec` 68/0；`openspec install windows` 42/0 | 当前安装分支、Windows PATH、多份 CLI 冲突、验证与卸载；官方已有答案，本站版本覆盖不足 | 更新现有 CLI 教程前部 |
| P0 | 查某个 OpenSpec 命令，不通读流程 | `openspec cli` 364/5；`openspec cli install` 62/1 | 按任务列命令、适用版本、预期输出；终端与聊天命令明确区分 | 同一教程的可直达速查段 |
| P0 | 确认 Claude 到底读哪个指令文件 | `agents.md vs claude.md` 266/2；反向词 323/6；`claude agents.md` 84/0，另有 PAA | 版本与文件共存矩阵、如何验证加载、共享规则模板；保留长综述作为后续阅读 | 现有比较页首部 |
| P1 | 把 Jev 接进一个中文任务 | `jev 使用` 15/3；`jev使用` 6/0；历史曝光明显更高 | 可运行请求、结果、误判样例及回退；不再只列适用场景 | 更新中文使用场景页 |
| P1 | 用 pstack 开始并完成一次任务 | `pstack skills` 1,732/8；`pstack skill` 516/5；`how to use pstack` 66/1 | 现有指南已有安装和技能目录；补从输入到验收产物的完整演示，让答案更易找到 | 现有 pstack notes |
| P1 | 在自己使用的 agent 中使用 pstack | 上述大词簇；本次 Flavio 和 backnotprop 结果突出跨工具使用 | 明确官方插件与第三方移植区别，分别验证宿主能力和限制；这一子需求没有独立量级证据 | pstack notes 的宿主兼容段 |
| P1 | 为项目写出能用的 feature map | `pstack feature map` 59/0；`pstack create verification skill` 23/0 | 现有指南解释了机制；补小项目文件树、一个功能的完整样例、失败证据与维护前后对照 | notes 配套实例，必要时独立实操 note |
| P1 | 跨仓库共同维护 OpenSpec | `openspec multi repo` 74/1；`openspec multirepo` 22/0；`openspec stores` 138/6 | 当前搜索有 stores 文档、功能请求和“不能跨仓库工作”的讨论；补双仓库最小实例、版本边界、同步与冲突排查 | 更新既有 stores 页 |
| P2 | 在 BMAD、Spec Kit、OpenSpec 中选流程 | `bmad vs spec kit vs openspec` 100/2；`spec kit vs open spec vs bmad` 89/1 | 用同一小改动比较文件产物、需要的人为决定和验证结果；不要再列泛功能表。本轮未单独完成该比较词 SERP 深读 | 现有 SDD 比较页的后续验证任务 |
| P2 | 安装 BMAD 后完成首个小改动 | `bmad method install` 22/0；过滤到 notes 页为 20/0 | 现有页已覆盖安装；补真实执行产物和常见安装后阻塞。样本较小 | 现有 BMAD notes |
| P2 | 取消 Claude SDK 请求并确认清理结果 | 生命周期/取消词 124/0；`anthropic claudesdkclient lifecycle and timeouts` 118/0 | 正文已有答案、排名已改善；加按症状定位的入口、版本提示和可下载示例，先测点击，不拆一批新页 | 现有 SDK 教程 |
| P2 | 快速恢复终端会话或让 Python 路径生效 | `byobu commands` 37/0；`byobu list sessions` 17/1，同页口径；`pythonpath environment variable` 118/2 | 两项独立维护任务：Byobu 任务速查及终端键位；PYTHONPATH 的设置后验证与终端/调试器差异。量小，不捆成新文章 | 两篇既有教程分别补充 |

pstack 的机会并不来自“无人写”。本次 `pstack skills` 结果已有官方技能文件、作者原文、MindStudio、skilldev、[Flavio Copes](https://flaviocopes.com/pstack/)及移植仓库；`pstack feature map` 中本站排第五。Flavio 已有跨宿主说明、安装截图和实际操作顺序。本站应提供自己的验证产物，而不是把技能目录换个标题再发。

## 建议执行顺序与验收

1. 先修 OpenSpec CLI 与 AGENTS.md 搜索入口。它们已有明确查询和同页退位证据，变更目标与观察指标都清楚。
2. 做 pstack 实操与 feature map，利用已有主题流量。另行核验新博客 cohort 的发现和索引状况，不用更长正文替代收录诊断。
3. 修 Jev 旧页的实际接入示例、OpenSpec stores 的跨仓库步骤。Jev 不开新的泛论槽位；本次没有核算本周 Jev 发布配额。
4. BMAD、SDK、Byobu、PYTHONPATH 做小范围维护，避免把低曝光长尾扩成大量同质页面。

每次修改记录 URL、日期、目标查询及改动内容。后续按 14/28 天窗口看同页同词曝光、CTR、平均位置与点击，并按主要国家/设备分层。不能承诺某个 CTR 百分比或恢复多少点击；修改后仍需观察。

本清单是研究与维护建议，未将任何题目推进正式 blog shortlist，也未运行 Google Trends 双窗口门槛。新建正式 blog 前仍须按仓库规则，用当天文章自己的主词检查 7 天与 24 小时相对 `gpts` 的表现；安装和速查等短内容优先维护原页或放 notes。

## 证据与限制

**2026-10-26 产物保留更正：**本轮原始产物曾位于 `test-results/october-search-audit/`。后续 Playwright 使用默认输出目录时清理了该目录，原始 JSON、正文抓取和临时脚本没有完整保留。已把 Playwright 输出限定为 `test-results/playwright/`，研究证据改放 `.seo-cache/`。本文的数据与搜索结果分析仍按 10 月 25 日观察保留，不用后来的搜索替换历史结果。

12 个查询的自然结果 URL 顺序与 PAA 已从本会话留存的工具输出恢复到 `search-serp-reconstruction-2026-10-25.json`。该文件明确标注重建来源，未恢复原始精确时间戳，也不冒充原始抓取文件。相同历史窗口的 GSC 重新采集到 `.seo-cache/search-audit-recapture-2026-10-26/`，以各文件新的 `capturedAt` 为准；重采核对见 10 月 26 日修复记录。

以下是原采集文件清单，供解释口径；**不能再当作仍存在的原始附件链接**：

- `september-pages.json`、`october-pages.json`：页面表、URL、捕获时间、可见报表范围及筛选。
- `september-queries.json`、`october-queries.json`：两期前 1,000 个可见查询。
- `september-days.json`、`october-days.json`：23 天每日明细，可复算总量。
- `*-openspec-cli-pages.json`、`*-openspec-cli-us-desktop.json`、`*-agents-comparison.json`：重点同词同页证据。
- `*-bmad.json`、`*-byobu.json`：精确页面过滤后的查询表。
- `serp-*.json`：12 个 Google 查询的原始自然结果、PAA、语言和捕获时间。
- `own-*.html/txt/json`、`competitor-*.html/txt/json`、`official-*.html/txt/json`：线上正文及解析结果。Claude memory 另存为 `official-claude-memory.html`。
- `live-sitemap.xml`、`cohort.json`：当日子 sitemap 与本地 frontmatter 匹配结果。
- `collect.mjs`、`analyze.mjs`、`detail.mjs`、`serp.mjs`、`fetch_evidence.py`、`cohort.mjs`：本轮采集与计算脚本。

本轮没有取得历史竞品 SERP、市场搜索量、全量查询、Googlebot 日志，或逐个检查 78 个未返回页面的索引状态。也没有验证竞品自述的基准测试。结论区分已观察的数据、当前内容差异与待测试的编辑判断；不据此判断整站惩罚、算法更新因果或流量被某一个竞品“拿走”。
