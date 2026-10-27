# 搜索需求修复记录

本轮根据 `search-demand-and-ranking-2026-10-25.md` 的查询与页面证据，维护原有内容及 URL。采集窗口仍为 2026-10-01 至 2026-10-23，不把编辑日期当成新的流量结果。

## 工作范围

五组子代理分别维护 OpenSpec、指令文件比较、pstack、Jev 与 BMAD/SDD、常用教程。主任务负责索引证据对照、跨语言与链接验证、构建和测试。

| 报告中的需求 | 承接内容 | 交付内容 |
| --- | --- | --- |
| 安装 OpenSpec 并确认运行 | 既有 OpenSpec CLI 教程，三语 | 当前安装路径、PATH 冲突、版本和成功判据 |
| 查找 CLI 操作 | 同一教程，三语 | 任务到命令的入口，保留历史版本练习 |
| 多仓库共同维护规范 | 既有 OpenSpec stores 文章，三语 | 版本边界与可验证的双仓库示例 |
| 找到 OpenSpec 入门入口 | 既有 OpenSpec notes，三语 | 与安装、stores 教程一致的导航 |
| 确认指令文件是否加载 | 既有 AGENTS.md 比较页，三语 | 版本、文件共存、检查方法、共享模板 |
| 开始一个 pstack 任务 | 既有 pstack notes，三语 | 带故障与修复的本地 CLI 示例 |
| 检查 pstack 宿主支持 | 同一 notes，三语 | 当前官方适配与社区移植边界 |
| 建立 feature map | 同一 notes，三语 | 任务配方、验证程序及真实本地输出 |
| 接入一个 Jev 中文任务 | 既有 Jev 使用场景页，三语 | 请求契约、模拟响应校验、失败回退 |
| BMAD 首次任务 | 既有 BMAD notes，三语 | 安装后入口、产物和可执行检查 |
| SDD 流程选择 | 既有 SDD 比较页，三语 | 同一小改动的产物、人工决定和验收 |
| SDK 取消与清理 | 既有 Python SDK 教程，三语 | 按症状定位答案，保留固定版本与验证范围 |
| 终端恢复、Python 路径生效 | 既有 Byobu 和 PYTHONPATH 教程，三语 | 任务速查、排障和运行时检查 |

没有创建新的正式博客选题或更改原始发布日期。保留现有内容的有效深度，短篇旧教程只做定向维护，不为了新文章篇幅目标填充文字。各语言篇幅在生成验证记录中单独统计。

## 索引证据

上轮 123 个博客语言 URL 中，有 78 个没有在对应 GSC 页面表返回。与已有的 `src/data/home-indexing.json` 精确路径对照：

- 63 个在报告中被列为 `discovered-not-indexed`。
- 15 个没有出现在该索引快照，状态未知。
- 索引报告日期为 2026-10-16，捕获日期为 2026-10-25。这是历史证据，不冒充 10 月 26 日实时索引。

另一轮已存在的首页归档改动把确实出现在索引报告的内容接入首页。此次保留该工作，检查当前构建中相关页面的原始 HTML、单 H1、canonical、robots、sitemap、首页或博客列表链接。78 个页面全部有博客列表链接，其中 74 个也有首页 HTML 链接；未发现缺页、重定向、noindex 或 canonical/sitemap 错配。不能以页面表没有返回，推断其当前未收录，也不能通过本地编辑保证 Google 何时收录。

GSC 覆盖审计原先仅接受 `Search type: Web (text)`，无法直接读取当前 `Search type: Web` 报表。本轮兼容两个精确标签，同时继续拒绝 Image、Discover、筛选报告和不完整页面表；加入回归测试。

## 示例与真实性

示例默认在本地运行，不需模型调用。手写教学样例、模拟 transport/响应、实际 CLI 执行和未执行的 agent 工作流分别标明。没有把合成输出写成真实模型表现，没有声称离线测试验证了 Jev 推理准确率或 pstack 的真实代理执行。

交叉审查发现 Jev 示例对 `10**1000` 这样的异常数值会在 `math.isfinite()` 转换时抛出 `OverflowError`。已先检查数值范围，再检查有限性；confidence 和 probability 的超大数值加入回归子用例，统一返回人工处理和 `invalid-response`，14 个测试方法复跑通过。

SDK 历史示例的失败也已定位：MCP 1.18.0 使用的 Pydantic 内部接口与新版本不兼容。文章、可下载离线检查和 Playwright runtime 测试统一增加 `pydantic==2.11.7`，没有用修改生命周期预期来掩盖导入失败。

各组来源与验证详见同目录：

- `search-repair-openspec-2026-10-26.md`
- `search-repair-instructions-2026-10-26.md`
- `search-repair-pstack-2026-10-26.md`
- `search-repair-jev-bmad-2026-10-26.md`
- `search-repair-tutorials-2026-10-26.md`

## 验证记录

最终构建与检查均已完成：

| 检查 | 结果 |
| --- | --- |
| `pnpm build` | 通过，1,974 个页面 |
| `pnpm test:run` | 36 个文件，327 项测试通过 |
| `pnpm check:locale-links` | 通过 |
| GSC 内容、SDK 与新增搜索维护 Playwright | 19 项通过 |
| 33 个维护页面的构建结果 | 原 URL、单 H1、canonical、sitemap、资源链接及旧章节锚点通过 |
| 123 个本月博客语言 URL | 全部检查；其中 78 个 GSC 未返回页面的可发现链接正常 |
| OpenSpec CLI | 60 项真实本地 CLI 检查通过 |
| Jev 与同题小改动示例 | 14 个 Python 测试方法通过，含新增超大数值回归子用例 |
| pstack 示例 | 故障版按预期失败，修正版 7 项命令检查通过，fixture 未改变 |
| PYTHONPATH | 7 项真实 Python 子进程检查通过 |
| SDK | 三语清理与取消 fixture、四项依赖版本及接口检查通过 |
| `git diff --check` | 通过 |

浏览器检查扩展到了全部 33 个语言页面的 320px 和 390px 宽度。发现并修复正文中的长路径、原有参考 URL、来源栏以及宽表格造成的横向溢出。24 个内容文件的 43 个宽表格增加了带本语言表头名称、可聚焦的滚动区域，SDK 原有滚动区域保留。正文行内代码和链接可换行，代码块继续横向滚动。pstack 表格的键盘滚动与页面不横移均有实际浏览器断言。

已查看中日手机截图、英文桌面截图和深色模式表格。19 项是本轮内容专项 E2E，不表示已经运行整个仓库的全部 Playwright 测试。

本机已有另一项任务的 Astro preview，占用同项目预览锁；本轮没有停止它，另用标准库静态服务器在 `http://127.0.0.1:4327/` 提供当前 `dist` 供测试和审阅。

最终日志与生成审计位于 `.seo-cache/search-maintenance-{build,unit,e2e,locale}.log`、`.seo-cache/search-maintenance-built-audit.json`。截图位于 `test-results/search-maintenance/` 及 `.seo-cache/`。检查脚本在 `.seo-cache/search-maintenance-audit.mjs`，接收重采的 GSC 页面快照路径。

## 正文篇幅

下面统一按渲染后的可见正文统计，排除 frontmatter、代码块、HTML 属性和链接目标，包含标题、表格与参考链接的可见文字。日文统计汉字、平假名和片假名；英文为单词 token，不是模型 token。口径与子报告可能略有差别。

| 既有主题 | 中文汉字 | 英文词数 | 日文字符 |
| --- | ---: | ---: | ---: |
| OpenSpec CLI | 3,433 | 2,499 | 5,202 |
| OpenSpec Stores | 4,175 | 3,034 | 5,783 |
| OpenSpec notes | 1,995 | 1,278 | 2,754 |
| AGENTS.md / CLAUDE.md | 7,652 | 5,596 | 9,106 |
| pstack notes | 8,577 | 6,498 | 13,323 |
| Jev 场景 | 6,452 | 3,658 | 8,913 |
| BMAD notes | 2,409 | 1,608 | 3,367 |
| SDD 比较 | 7,769 | 3,425 | 6,566 |
| Byobu | 833 | 608 | 1,341 |
| PYTHONPATH | 2,729 | 2,125 | 4,315 |
| Claude SDK | 5,245 | 3,569 | 7,695 |

短篇旧教程保留其速查定位，长综述保留既有内容与搜索锚点。这是用户授权的定向维护，不是新增正式博客或要求统一改写篇幅的任务。

## 研究证据保留

第一次运行 Playwright 时，默认 `outputDir` 清理了 `test-results/`，此前存在该目录中的研究原件也被清理。已在 `playwright.config.ts` 显式设置 `test-results/playwright/`，避免再次清理同级文件。今后研究原始数据保存到 `.seo-cache/`，重要结论保存在 `docs/research/`。

本轮按相同日期与过滤条件重新采集 GSC，保存实际的新捕获时间。10 月 25 日 SERP 的结果顺序和 PAA 则从本会话原有工具输出重建为 `search-serp-reconstruction-2026-10-25.json`；没有补造原始时间戳，也没有把当天完整 HTML 抓取描述成已恢复。

重采于 2026-10-26 本地时间 20:12–20:17 完成，共 16 份完整返回表格、文本和过滤条件快照。39 组已比较的统计数值与原报告没有差异。文件在 `.seo-cache/search-audit-recapture-2026-10-26/`，`comparison.json` 保存逐项比较；重新采集的快照不能恢复 10 月 25 日的原始捕获元数据。

## 发布与后续观察

本地修复不等于线上已部署，也不等于排名已经恢复。本轮没有推送或触发部署。上线后应使用同页同词的 14/28 天窗口重新检查曝光、位置、CTR 和点击；主要国家及设备分层后再判断变化。仓库既有部署流程会在成功部署后，对本次内容变更发送 IndexNow。
