## 零曝光页面排查与处理

采集本地时间：2026-09-26 Australia/Sydney；原始采集时间戳为 2026-09-25 UTC。Performance 窗口固定为 **2026-06-24 至 2026-09-23**，资源 `sc-domain:redreamality.com`，Web，界面显示 Web (text)。本文件记录当前任务的新调查，不替换上一轮排名报告。

### 结果

线上 sitemap 含 551 个 URL，其中本轮范围内的 blog、notes、questions 详情页共 324 个。GSC 页面表读取 688 行，包括片段 URL；去掉 query/hash 仅用于判断是否出现，不合计不同聚合行的点击或曝光。

| 分类 | 页面数 | 含义 |
| --- | ---: | --- |
| 页面表中存在正曝光记录 | 259 | 不属于本轮零曝光候选 |
| 未返回记录、frontmatter 声明日期晚于窗口末日 | 18 | 实际上线时间未知，需先核对部署；不能仅凭声明日期认定尚未发布 |
| 未返回记录、需要继续核对 | 47 | 不等于全部已确认零曝光或未收录 |

47 个候选进一步拆分：

| 类别 | 数量 | 证据与处理 |
| --- | ---: | --- |
| 已迁移 Chaos 的旧博客入口 | 29 | 当前公开 HTML 为 HTTP 200、noindex、canonical 指向 Chaos；源码实际生成兼容重定向。不是应当争取曝光的正文 URL。已修 sitemap，保留旧入口跳转 |
| 标注 2026-09-23 发布的内容 | 11 | 与窗口最后一天重合；需要实际部署/抓取时间和之后的完整观察窗口，不据此判断质量失败 |
| 标注更早日期的页面 | 7 | 精确页面过滤逐个确认本窗口报告零曝光；其中日文 CORDIS 实际译文加入很晚 |

前两张表只是分类，不推导“Google 只收录 259 个页面”。页面曝光、页面收录、sitemap 声明是不同概念。

### 确认零曝光的页面

下表使用精确页面过滤，读取页面总指标，而非仅依据查询表为空。10 个样本都显示本窗口 Total impressions=0、Total clicks=0；因此能说 **GSC 在这一窗口报告零曝光**，不能说从未有曝光或当前永远不可能排名。

| 页面 | 本窗口曝光 | 当前页面检查 | 判断 |
| --- | ---: | --- | --- |
| `/blog/blockchain-for-python-developers/` | 0 | 200、自指 canonical、index、单 H1 | 老内容，需要收录和任务定位复核 |
| `/ja/blog/blockchain-for-python-developers/` | 0 | 同上 | 日文版本独立诊断，不能据英文推断 |
| `/blog/us-treasury-bonds/` | 0 | 同上 | 老内容，与站内多个债券问答语义接近 |
| `/ja/blog/multi-agent-system/` | 0 | 同上 | 开头仍是调查提纲，需要具体读者任务与完整例子 |
| `/ja/garden/questions/why-bond-yields-go-down-when-interest-rates-go-down/` | 0 | 同上 | 与另一日文债券问答覆盖高度接近，需区分利率/价格/收益率概念 |
| `/ja/garden/questions/why-bonds-move-opposite-of-interest-rates/` | 0 | 同上 | 比喻多于精确演算，先改善解释，不先改 URL |
| `/ja/blog/cordis-spatiotemporal-composability-deepseek-harness/` | 0 | 同上 | frontmatter 2026-08-23，但该译文 2026-09-23 才加入 Git |
| `/blog/alibaba-open-code-review-deterministic-pipeline/` | 0 | 同上 | 元数据发布日期为窗口最后一天；窗口太短 |
| `/blog/78th-primetime-emmys/` | 0 | 200、noindex、canonical 指向 `/garden/chaos/…/` | 旧地址，不应作为有效正文机会 |
| `/blog/aws-ai-registry-for-agents-spec/` | 0 | 同上 | 旧地址，不应为恢复其曝光重写正文 |

上述前七项都执行了精确 URL 查询。其余 37 个未逐个执行 Performance 精确过滤，所以仍标成“页面表未返回”，不擅自升格为已确认零曝光。

当前公开 HTML 检查覆盖全部 65 个未观察到曝光的候选（18+47），请求均完成。29 个旧入口带 noindex 和异地 canonical；其他样本没有看到该类显式阻断。HTTP 200 和 index 只是当前可访问及页面声明，不代表 Google 已收录。

### 已修复的技术问题

旧博客兼容路由由 `src/pages/blog/[...slug].astro` 及中日文路由根据 `chaos-*` 集合生成，指向 `/garden/chaos/<slug>/`。静态站点当前线上以 HTTP 200 的跳转 HTML 呈现，含 noindex 和指向目的页的 canonical。

但原 `astro.config.mjs` 的 sitemap filter 没有排除这些兼容入口，导致本次 29 个没有正文源码的旧 URL 仍被列在 sitemap 中。这解释了它们为何不是需要优化曝光的正文入口，但不证明它们导致其他文章掉排名。

本轮增加 `scripts/legacy-blog-redirects.mjs`，从实际三语 Chaos 内容集合派生旧地址集合，在 sitemap 生成时排除它们；没有维护第二份手写 slug 清单，没有删除跳转，也没有为了恢复旧地址曝光移除 noindex。

验证覆盖：每个别名不在 sitemap、对应 Chaos 目的页仍在、三语旧链接仍能导航到目的页。最终构建/E2E结果统一记入本轮实施记录。未来若内容迁移方向变化，需同步检查生成路由与该集合；不能凭零曝光大范围删除页面。

跳转回归还发现目的页重复 H1：共享模板已显示 frontmatter 标题，27 篇旧 Chaos Markdown 又写了一次相同标题。本轮删除这些重复正文标题，并增加全 Chaos 集合的 AST 检查，保留正文、发布日期、旧跳转与目的页。此为已确认的页面结构缺陷，不声称它导致任何具体查询的零曝光。

### 收录证据与未知项

已成功读取 GSC **Page indexing 总览**，Last update 为 **2026-09-21**：

| 状态或原因 | 页数 |
| --- | ---: |
| Indexed | 426 |
| Not indexed | 378 |
| Not found (404) | 138 |
| Page with redirect | 33 |
| Alternate page with proper canonical tag | 21 |
| Excluded by noindex | 13 |
| Duplicate without user-selected canonical | 2 |
| Crawled - currently not indexed | 170 |
| Soft 404 | 1 |

这是 all known pages 的全站范围，包含历史、旧路由和非本文内容类型，且更新时间早于 Performance 截止日；不能用 426/324 计算“文章收录率”，也不能将 170 个未收录状态直接归到本表任一页面。这里的 13 个 noindex 也不能与当前公开检查的 29 个旧入口直接对齐。

单 URL 检查框可填入目标地址，但未可靠进入结果页；索引明细导航随后返回 Chrome 错误页，故停止继续重复请求。**本次未取得这六个较老有效正文页面的逐 URL Google 索引状态、Google 选定 canonical 和最近抓取时间。** 不能写成已证实的“未收录导致零曝光”，也不能写成“已收录但没需求”。

下一步应先补这三个字段，再决定：

- 未发现/未抓取：核对可到达的正文内链、sitemap、robots 与服务可用性。
- 已抓取未收录：核对正文完整性、可替代性、同语言重复意图与 Google canonical；不保证扩写即能收录。
- 已收录且 canonical 正确：调查语言市场、具体查询任务和竞争结果，才进入内容机会重写。
- Google canonical 指向其他页面：先判断是否合理的重复聚合，不自动强制索引所有近义页。

这是诊断流程，不是本次已经取得的页面级结论。Google 对这几种状态的解释见官方 Page indexing 与 URL inspection 文档：
`https://support.google.com/webmasters/answer/7440203?hl=en`、
`https://support.google.com/webmasters/answer/9012289?hl=en`。

### 六个较老正文的内容机会

下列是原文检查支持的编辑建议，**不是已经证明的零曝光原因**。本轮已经有 SDK/OpenSpec/BMAD/WXT 的实质修复，不用同时盲目重写所有没有曝光的文章。

#### Python 区块链教程：一个能完成的实验

英文标题是宽泛的“进入去中心化世界”指南，开场是宣传式比喻，后面混合区块链概念、玩具链、工具和职业路线。对 Python 读者，先明确一个完成目标更有用。

建议优先选择“用 Python 检验一个本地哈希链的篡改检测”，展示固定输入、篡改前后验证结果、序列化与测试，并明确它没有分布式共识、身份认证或资产安全能力。外链钱包/RPC 的进阶教程另行界定，不让用户误把本地示例视为生产区块链。真实 query 机会需要后续 SERP/需求验证，不将此题名标为已证实高搜索量。

同窗口中文版本有 112 次曝光、平均位置 15.6、0 点击，英文/日文为零；这说明不能说整组文章被技术封禁，也不能由中文表现推断英文市场需求。修改时应检查各语言自己的标题、任务完成度和内链。

#### 债券页：把相近问题分开回答

英文 `/blog/us-treasury-bonds/` 是短篇概念加定价公式，而站内还有“价格为什么随利率反向变化”和“利率下降时收益率为什么下降”等问答。同窗口中文 Treasury 页 180 次曝光、3 点击；日文版 57 次曝光、0 点击。

建议保留 Treasury 页作为固定现金流、价格、到期收益率的数值例子；两个问答分别负责“价格与市场收益率”和“政策利率不等于每一个期限的市场收益率”。给明确的假设、单位和可复算结果，区分票息、当期收益率、到期收益率，不把所有债券的票息都写成固定。

日文问答中“金利が下がると債券利回りが下がる”被称作逆相关，以及用政策利率直接推出新债票息等句子需要限定；另一篇演唱会比喻的映射与债券方向并不一致，应换成固定现金流演算。上述是内容审查线索，不是投资建议。金融事实应先核对 Treasury/SEC 等官方来源后修订，不为了关键词立即合并或重定向有历史 URL 的页面。

#### 日文多代理文章：从提纲变成具体说明

日文 `/ja/blog/multi-agent-system/` 开头只有“定义是什么”“说明 workflow 与 agent 的区别”等待展开项目，后续又出现未解析的 `【cite】` 标记。建议选择一个任务，展示何时一个 worker 足够、什么时候值得拆分、消息/产物契约、失败退出条件和评估；补具体来源而非用综述标题代替正文。

同窗口英文 blog 有 3,050 次曝光但无点击，中文 96 次曝光、1 点击；日文同名 talks 页还有 259 次曝光。这不证明 blog 被 talks 抢词，需按精确日文 query 看归因后再分工。可以让 talks 保留演讲大纲、blog 提供完整可执行解释，互相说明两者用途。

### 日期与链接的两个误判风险

1. 日文 CORDIS frontmatter 标注 2026-08-23，但文件在提交 `6d81d98`（2026-09-23 16:12:35 UTC）才加入。Git 加入时间不是部署时间，却足以否定“已在本站日文版等待一个月仍无曝光”的轻率推断。
2. 在 Markdown 正文中查找上述较老文章的精确 slug，没有发现明确的文章互链；这只是源内容层面的检查，**不能称作孤儿页**。列表、语言导航、相关推荐可能提供实际链接，需要对生成页面计算入链后再判断。

### 可复用审计与原始证据

新增仓库脚本：

```powershell
node scripts/gsc-coverage-audit.mjs <GSC页面快照.json> <本地输出目录>
```

输入需为此资源、无 page/query/country/device 筛选、显式 `YYYYMMDD` 日期的 Web (text) page 表；脚本验证 URL 搜索类型、可见搜索类型、图表日期和分页总数，拒绝截断或重复页，并提示 1,000 行上限。XML 使用 DOM 解析器读取 `<loc>`，不把 hreflang 地址误当 sitemap 正文条目；frontmatter 使用 Astro 解析器，ID 按 Astro glob 的 GitHub slug 规则和显式 slug 生成。单元测试覆盖九个现有混合大小写文件及这些边界。

分类状态 `declared-date-after-window` 只表示 frontmatter 声明日期，**不是经过核实的发布状态**。原始候选数复算仍为 259/18/47；修复元数据匹配后，九个大小写文件都能找到源路径，未改变当前曝光分类，因为它们本来就有曝光记录。

原始数据未放入 `public/`、未推送：

```text
C:/Users/unknown/.codex/visualizations/2026/09/25/01a0d931-9e9e-7ce2-a6dd-b59ecc6ced78/gsc-audit/
```

- `zero-site-3m-pages.json`：688 行页面表，含实际 URL、完整图表范围和采集时间。
- `zero/coverage.json`：324 页候选分类，含所有 URL 和可匹配的本地源路径。
- `zero/public-checks.json`：65 个候选的 HTTP、canonical、robots、发布日期与标题。
- `zero-en-*`、`zero-ja-*`：上表十个精确页面 Performance 报告。
- `zero-index-crawled.json`：**实际是成功取得的总览表**，不是 170 页明细；以其中 URL 和表头为准。文件名只是最初尝试目的，不作为证据。
- `zero-indexed-pages*.json`、`zero-index-summary.json`：失败导航，实际 URL 为 `chrome-error://chromewebdata/`，不作为索引结论来源。

### 本轮异常

没有发现 `agent-incidents` 记录工具；不将单次故障追加到 AGENTS.md。

- 读取猜测路径 `src/content/config.ts` 失败：当前文件为 `src/content.config.ts`。先用 `rg --files` 定位再读取。
- 可选文件搜索无匹配使 rg 返回 1：这是空结果，不是产品故障；脚本应显式处理。
- URL Inspection 联想项查找 `semantic_not_found`：文本填入不代表已提交；未取得实际检查结果，保留未知。
- GSC 索引明细两次、回到总览一次返回浏览器错误页，而命令退出 0：根因未确定；以实际 URL 判失败并停止，不因命令成功声称抓到数据。
- 新增单测首次 `fileURLToPath(import.meta.url)` 报非 file scheme：Vitest 变换后的 URL 不适合该用法；测试夹具改用仓库 cwd，重跑覆盖脚本/别名集合测试 5/5 通过。
