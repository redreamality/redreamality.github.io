# Guidelines for AI Agents Working on This Codebase

This document contains important guidelines and best practices for AI agents working on this project. Following these guidelines ensures consistency, quality, and SEO optimization.

## Project Skills

- Visual creation and publishing: `.agents/skills/create-visual-work/SKILL.md`
  - Required for any task that creates, modifies, migrates, generates, publishes, or validates a Visual work, `/visuals/` route, Visual artifact, Visual gallery behavior, or `tools/visual-explainer-kit/` workflow.
  - Read the Skill before taking task actions, then follow its referenced Visual system documentation and validation order.

## Content Creation & Editing Guidelines

### ⚠️ CRITICAL: Avoid Duplicate H1 Tags (SEO Issue)

**Problem:** Multiple H1 tags on a page confuse search engines and hurt SEO rankings.

**Rule:** When creating or editing markdown content files, **NEVER** include an H1 (`# Title`) in the markdown content body that duplicates the frontmatter title.

#### Why This Matters
- The Astro page templates already render the frontmatter `title` as an H1 tag in the page header
- Adding another H1 in the markdown content creates duplicate H1s on the rendered page
- Search engines like Google can become confused about page hierarchy with multiple H1s
- This violates SEO best practices which recommend exactly one H1 per page

#### How Content Pages Render Titles

All content pages (`[slug].astro` templates) follow this pattern:

```astro
<header>
  <h1>{post.data.title}</h1>  <!-- Frontmatter title rendered as H1 -->
</header>
<div>
  <Content />  <!-- Markdown content rendered here -->
</div>
```

This means:
- The frontmatter `title` is **automatically** rendered as an H1
- The markdown content should start with H2 (`##`) for the first heading
- Any H1 in the content creates a **duplicate** H1

#### Correct Content Structure

**✅ CORRECT:**

```markdown
---
title: "My Article Title"
description: "Article description"
pubDate: 2025-01-15
author: "Author Name"
---

This is the introduction paragraph.

## First Section

Content of the first section...

## Second Section

Content of the second section...
```

**❌ WRONG:**

```markdown
---
title: "My Article Title"
description: "Article description"
pubDate: 2025-01-15
author: "Author Name"
---

# My Article Title

This is the introduction paragraph.

## First Section

Content of the first section...
```

### Content Types Affected

This applies to ALL content types:
- Blog posts (`/src/content/blog-en/`, `/src/content/blog-cn/`, `/src/content/blog-ja/`)
- Notes (`/src/content/notes-en/`, `/src/content/notes-cn/`, `/src/content/notes-ja/`)
- Questions (`/src/content/questions-en/`, `/src/content/questions-cn/`, `/src/content/questions-ja/`)
- Talks (`/src/content/talks-en/`, `/src/content/talks-cn/`, `/src/content/talks-ja/`)
- Projects (`/src/content/projects-en/`, `/src/content/projects-cn/`, `/src/content/projects-ja/`)

### Checklist When Creating/Editing Content

Before saving any markdown content file, verify:

1. ✅ Frontmatter contains a `title` field
2. ✅ The markdown body does NOT start with `# Title` matching the frontmatter title
3. ✅ First heading in the content (if any) starts with `## ` (H2), not `# ` (H1)
4. ✅ Python code comments using `#` are NOT affected (they're in code blocks)
5. ✅ Blog posts target ~5000 Chinese characters (or EN/JA equivalent); report count on handoff

### Blog length target（站长约束，2026-09-23）

正式博客（`blog-cn` / `blog-en` / `blog-ja`）默认按**深度中篇**写，不要默认写成短讯。

| 语言 | 目标 | 计量 |
| --- | --- | --- |
| 中文 `blog-cn` | **约 5000 汉字**（可接受约 4500–5500） | 正文汉字数，不含 frontmatter；代码块内注释/标识符不计入「汉字」目标，但仍算篇幅 |
| 英文 `blog-en` | **约 2800–3500 词** | 与中文信息量对齐的完整英译，不是摘要 |
| 日文 `blog-ja` | 与中文信息量对齐的全译 | 中英已发则尽快补 `blog-ja`；不因缺日文阻塞中英首发 |

执行要求：
1. 选题进入 `writing` 前，先估能否撑到目标长度；撑不住就换题或合并相关 shortlisted，而不是注水。
2. 扩写优先补：**可复现步骤、边界条件、反例/踩坑、与站内既有文的对照、可核来源**；禁止空话、重复口号、无来源数字。
3. 交审时在回报里写明中文汉字数（或英文词数）；明显低于约 4500 汉字须说明原因并征求头子是否破例。
4. 速查/备忘类短文若必须很短，改放到 `notes-*`，不要占正式 blog 槽位。
5. **吞吐（站长，2026-09-24）**：若多道 `shortlisted` 都值得写，可并行开写，不要人为限一篇；每篇仍须达到篇幅与「Blog Chinese style」，交审须分别回报字数。质量不够就少开，不要注水凑篇数。
6. **日文补齐**：已有中英正式博客、缺 `blog-ja` 的 slug 须补全译（信息量对齐中文，不是摘要）。缺日文不再作为可选项搁置；补译交头子发版。不因日文阻塞中英首发，但首发后应尽快补齐。


### Explore & Exploit（站长，2026-09-24；选题配额修订 2026-09-27）

选题与制作遵循 explore-and-exploit：**一边做强精品**（已验证主题线加深、对照、系列化，优先正式 blog / Visual），**一边保持探索**（信号粗筛与 Chaos 继续广扫；新方向先 shortlisted / notes / Chaos 试水温）。硬约束：**长期主义深内容，不为追热点而写热点**——正式 blog 要有可沉淀的机制/对照/清单；纯热榜软新闻进 Chaos / notes。库存里应同时有「深耕线」和「新芽」。撰稿节奏**每日**约 4 篇（含周末；10:35 / 16:35 两槽）；站长授权后正式 blog 由博客头子终审即发，不必逐篇请示。细则见 `/workspace/blog-pipeline/README.md`。

补充（站长，2026-09-27）：
1. **Jev 配额**：正式 blog 的 Jev / Jev 强相关题默认每周（Asia/Shanghai）**最多 1 篇**；除非特别值得写（MAJOR_BREAKING、全新机制、或头子/站长破例）。超额进 Chaos / notes 或不进本周撰稿槽。
2. **搜索意图（站长，2026-10-04 收紧）**：正式 blog 的 shortlist / 开写前必须查 **Google Trends 的 7 天和 24 小时**两个窗口（不要只用等价检索代替）。候选主词在**两个窗口都要高于基线词 `gpts`**，否则不进正式 shortlist，改走 Chaos / notes。交审/挑题回报写明两窗口相对 `gpts` 的结论，以及本周 Jev 占用。
3. **深度调研优先（站长，2026-10-01）**：正式 blog 优先写机制地图 / 综述 / 对照综合（如 RSI 枢纽文），少做「单点论文或新闻条目堆叠」。单点热讯进 Chaos / notes；短名单论文解读可系列化，但选题配额应给足综合文。

### Blog Chinese style（站长约束，2026-09-23）

中文正文按**跟同事说话**来写，不要把英文习语/隐喻外壳硬译进标题或正文。经验来自 t003（`jev-claude-code-10x-and-25-lines`）审稿。

1. **译意思，不译隐喻壳。** 坏例：把 *eat someone's lunch* 写成「吃掉这块午餐」；好例：「会不会很快跟进」。英文帖可保留原习语；中英用词允许分叉，只要主张与证据对齐。
2. **技术借词。** 业界通行英文可保留（如 MCP、fail-open、CLI）；冷门概念首次出现时括注中文（如 jaggedness→能力锯齿）。避免半英半中标签（如「moat 叙事」→「护城河叙事」）。
3. **硬译表面。** 少用「产品面 / 文档面 / 侵入性」一类 calque；优先「产品能力 / 对外接口」「文档入口」「对现有流程的改动面（从小到大）」。
4. **营销英语壳。** 「比…更值钱」一类口号感表述，改成可执行的中文（如「比…更值得先看」）。
5. **交审自检。** 交稿前把每个 H2/H3 和加粗句出声读一遍；听起来像英文直译就重写。

### Blog in-site links（站长约束，2026-09-24）

英文正文站内链用 `/blog/.../`，中文用 `/cn/blog/.../`，日文用 `/ja/blog/.../`。**不要**写 `/en/blog/`（线上 404）。

### Special Note: Python Code Comments

When editing content that includes Python code:
- **DO NOT** remove `#` characters that are Python comments within code blocks
- Hash symbols in code fences are NOT markdown headers

Example:
```python
# This is a Python comment - DO NOT REMOVE
def my_function():
    # Another Python comment - DO NOT REMOVE
    pass
```

## Other Best Practices

### Outbound links

External user-facing `http(s)` links go through a locale confirm page (`/go/?to=`, `/cn/go/?to=`, `/ja/go/?to=`). Helpers live in `src/utils/outbound.ts`. Markdown is rewritten by `src/plugins/rehype-outbound-links.ts` to `/go/?to=...`; `Layout.astro` prefixes `/cn` or `/ja` on locale pages. Astro components that know `lang` should call `toOutboundHref(href, lang)` directly. Do not send `mailto:`/`tel:` or same-site URLs through `/go`.


### Language switcher & hreflang（三语可用性）

语言切换器与 `<link rel="alternate" hreflang>` 只能指向**真实生成**的 locale 页面，禁止链到 404（例：中英已发、`blog-ja` 未补的博客不显示「日本語」，也不输出 `hreflang="ja"`）。
- 真源：`src/utils/locale-availability.ts` 在构建期从各 `<type>-<locale>` 集合、`getTags(lang)`、Visual manifest 的 locale `artifact`、library notes 以及 `src/pages` 下的非动态页面推导可用语言；`Layout.astro` 统一传给 `LanguageToggle` 和 hreflang。x-default 优先 en，en 不存在时取第一个存在的 locale。
- 不要按 slug 硬编码。新增带 locale 的详情路由时，在 `DETAIL_ROUTES` 里登记并从与其 `getStaticPaths` 相同的数据源取 slug；未登记的动态路由只显示当前语言（宁可隐藏，不链 404）。页面确需覆盖时可给 `Layout` 传 `availableLanguages`。
- 验证：`pnpm build` 后运行 `pnpm check:locale-links`（扫描 `dist` 中所有切换链接与 hreflang，存在死链则退出码 1）。

### Markdown Heading Hierarchy
- Use semantic heading structure: H2 → H3 → H4
- Don't skip heading levels (e.g., don't jump from H2 to H4)
- Use H2 for main sections, H3 for subsections, etc.

### Frontmatter Requirements
All content files must have proper frontmatter with:
- `title`: The page title (required)
- `description`: A concise description for SEO (required)
- `pubDate` or `date`: Publication/creation date in ISO format (required)
- `author`: Author name (required for blogs/projects)
- `tags`: Array of relevant tags (optional but recommended)
- `lang`: Language code ('en', 'zh', or 'ja') for translations (optional)


### Tag taxonomy（站点标签体系）

标签是**站点知识图谱 / 主题分类**，不是关键词堆。UI 与返回导航的层级以仓库内机器可读文件为准。

| 角色 | 路径 |
|---|---|
| **UI 层级真源（committed）** | `src/data/tag-taxonomy.json` |
| 辅助函数 | `src/utils/tag-taxonomy.ts`（`groupTagsByTheme`、`breadcrumbForTag`、`normalizeTag`） |
| 索引 UI | `src/components/tags/TagsTaxonomy.astro` |
| 详情面包屑 | `src/components/tags/TagBreadcrumb.astro` |
| 编辑长文 / 合并决策 | `/workspace/blog-pipeline/TAGS.md`（APPROVED clusters；非本站仓库路径） |

规则：

1. **`/tags` 索引按主题分组**：主题顺序与标签归属来自 `tag-taxonomy.json`；路由上存在但不在任何主题 `tags` / `aliases` 映射中的标签，运行时落入 `uncategorizedId`（`other` / 其他）。
2. **标签详情返回导航是三级层级**：`标签 → 主题 → #slug`（例：`/cn/tags/` → `/cn/tags/#agent-systems` → 当前页）。层级同样由该 JSON 推导，不要硬编码「返回标签列表」。
3. **新文 frontmatter**：优先复用已有 **canonical EN kebab-case slug**（如 `ai-agents`、`agent-harness`、`sdd`）；不要发明同义变体（`AI Agents` / `Agents` / `agents`）。展示名可在 UI / display map 本地化；slug 本身不编码语言。
4. **路由现实不变**：`getTagCounts(lang)` 只统计 blog；**count ≥ 2** 才生成 `/tags/<tag>/`。非 blog 类型（Meditations 等）不得无条件链到 `/tags/.../`——见下方 Command and Test Pitfalls 中的 Meditations 条目，并交叉遵守本节。
5. **大改主题 / 合并 / 重命名**：先由 Tag·体系起草，经 **博客头子** 审阅后再改 `tag-taxonomy.json`（及必要时 frontmatter）；未经站长明确要求不要 push master。
6. **aliases / 路由去重（半自动折叠）**：`getTagCounts` / `getTags` / tag `getStaticPaths` 经 `normalizeTag` 合并到 canonical slug；sitemap 过滤非 canonical 的 `/tags/<x>/`。链接一律用 canonical（`getTagHref`）。
   - **`normalizeTag` 顺序**：trim → **手动 aliases 优先**（exact → lower key → 大小写不敏感 alias-key）→ 已是 curated slug → `toLowerCase()` 命中 curated（`DeepSeek`→`deepseek`）→ 空格/`_`→kebab 再 lower 命中 curated（`Claude Code`→`claude-code`）→ 否则保留原文（落入 other / minCount）。
   - **`tag-taxonomy.json` 的 `aliases` 只放手动覆盖**：语义合并（`deepseek-harness`→`agent-harness`、`Agents`→`ai-agents`、`Agent Skills`→`ai-agents`）与 CJK/日文等变体（`规范驱动开发`→`sdd`）。**不要**为纯大小写 / 空格-kebab 再写 alias（自动规则已覆盖）；**不要**发明新 canonical，也**不要**自动把任意中文映射到英文（如勿把 `深度求索` 自动折到 `deepseek`）。
   - 可选扫描：`node scripts/suggest-tag-aliases.mjs`（只打印建议，不回写 JSON）。

### File Naming Conventions
- Use kebab-case for filenames: `my-blog-post.md`
- Keep filenames descriptive but concise
- Match filename to content slug/URL



### Project columns / 专栏（项目区夜报，如「赚钱机器夜报」）

专栏条目**不是博客文章**：每个专栏是项目区下的独立内容集合，不进 `/blog/` 列表、blog RSS、相关文章、首页「最新文章」和标签计数（`getTagCounts` 只统计 blog）。元数据只在 `src/data/series.ts` 登记一处（slug、各语言标题/简介/SEO 描述、`intro`、置顶「先读这篇」链接）。
- 集合：每专栏每语言一个 `<column>-<locale>` 集合（`src/content.config.ts` 的 `nightlySchema`），集合名在 `src/utils/columns.ts` 的 `COLUMN_COLLECTIONS` 登记；**只在该语言确有条目时才建集合**。
- 条目文件：`src/content/<column>-<locale>/YYYY-MM-DD.md`（文件名即 URL slug）。frontmatter：`title`、`description`、`pubDate`、`author`、`lang`，可选 `tags`、`seriesDay`（整数 ≥ 0；不填按日期顺序自动编号）、`humanInterventions`（当天人工介入次数，索引页累加）。不要再写 `series:` 字段，也不要加专栏同名标签。`tags` 只放主题标签（如 `ai-agents`），条目页只链接已生成的 blog 标签页（count ≥ 2）。
- 路由：索引 `/[lang]/projects/<column>/`（`src/pages/cn/projects/<column>/index.astro` + `src/components/series/SeriesIndex.astro`：简介、先读这篇、累计看板、按日期倒序带天数的列表）；条目 `/[lang]/projects/<column>/YYYY-MM-DD/`（同目录 `[entry].astro`，`SeriesNav.astro` 显示专栏徽章与前一天/后一天/索引导航）；专栏 RSS `/[lang]/projects/<column>/rss.xml`。路由文件只为有条目的语言创建（目前只有 `src/pages/cn/projects/money-machine-nightly/`）。
- 项目页卡片：`src/utils/projectsData.ts` 里带 `column: '<column>'` 的条目，三语 `/projects/` 页只在该语言有条目时显示（`getColumnsWithEntries`），卡片链到专栏索引。
- 语言可用性：`locale-availability.ts` 的 `columns` 路由从 `getColumnEntries` 取 `<column>/<entry>`，索引页按 `src/pages` 静态页判断；en/ja 不会链到空页。
- 旧 URL：专栏曾在 blog 下（`/cn/blog/money-machine-nightly-2026-10-08/`、`/cn/blog/series/money-machine-nightly/`），由 `src/data/legacy-redirects.json` → `astro.config.mjs` 的 `redirects` 生成静态跳转页（meta refresh + canonical + noindex），并从 sitemap 过滤。以后搬迁已对外分享的页面也往这个 JSON 加一对「旧路径 → 新路径」。
- 现有专栏：`money-machine-nightly`（赚钱机器夜报，`money-machine-nightly-cn` 每晚一篇，`src/content/money-machine-nightly-cn/YYYY-MM-DD.md` → `/cn/projects/money-machine-nightly/YYYY-MM-DD/`，索引 `/cn/projects/money-machine-nightly/`）。条目模板与脱敏清单：`/workspace/blog-pipeline/templates/money-machine-nightly.md`。夜报 600–1,200 字（站长批准的栏目篇幅），不计入 blog 撰稿槽 / 字数考核。
- 测试：`src/utils/series.test.ts`（排序、天数、前后导航、累计、URL、旧 URL 跳转表、项目卡片）；`src/utils/locale-availability.test.ts`（`columns` 路由）；`e2e/sitemap-redirects.spec.ts`（旧 URL 跳转与 sitemap）。

### Chaos digest feed（选题 → 底噪页）

站点 `/garden/chaos/`（及 `/cn`、`/ja`）主 UX 是 **按小时分组的热点选题列表**（数据：`src/data/chaos-digest.json`），不是旧的长文卡片墙。旧 `chaos-*` 长文仍可通过 slug 与页脚 Archive 访问。

流水线：
1. 选题汇总更新 `/workspace/blog-pipeline/topics.md` 后，在本仓库根目录运行：
   ```bash
   node scripts/build-chaos-digest.mjs
   ```
2. 将生成的 `src/data/chaos-digest.json` 与站点改动一并 commit，push `master` 发版。
3. 已发文选题在 `notes` 中写上 `redreamality.com/.../blog/<slug>/` 链接，或保证 `status=published` 且 slug 可从 notes/内容目录匹配，digest 会露出「深入阅读」。

详见 `/workspace/blog-pipeline/CHAOS.md`。

### IndexNow（搜索引擎即时通知）

站点通过 [IndexNow](https://www.indexnow.org/documentation.html) 在内容发布/变更后通知 Bing、Yandex 等参与引擎。

| 角色 | 路径 |
|---|---|
| 所有权验证 key 文件（public，部署后可公开访问） | `public/97c30153e5a34ca0854e52d8ae413f1a.txt` → `https://redreamality.com/97c30153e5a34ca0854e52d8ae413f1a.txt` |
| 提交脚本 | `scripts/indexnow.mjs` |
| CI | `.github/workflows/deploy.yml` 的 `indexnow` job（`deploy` 成功后，对本次 push 的 content diff 提交） |

手动提交：

```bash
# 单个或多个 URL
node scripts/indexnow.mjs https://redreamality.com/blog/your-slug/
pnpm indexnow -- https://redreamality.com/cn/blog/your-slug/

# 从上次提交映射 content 变更（blog/notes/chaos/talks/questions/meditations/projects × en/cn/ja）
node scripts/indexnow.mjs --git-diff HEAD~1 HEAD
node scripts/indexnow.mjs --git-diff HEAD~1 HEAD --dry-run

# stdin（每行一个 URL）
printf '%s\n' 'https://redreamality.com/garden/notes/foo/' | node scripts/indexnow.mjs --stdin
```

说明：IndexNow key 按协议会放在站点根路径供引擎抓取，不是 GitHub Actions secret。首次提交可能返回 HTTP 202（key 校验中），属正常。可选在 [Bing Webmaster Tools](https://www.bing.com/webmasters) 登记同一 IndexNow key 以便查看接收状态。


## Summary

**The Golden Rule:** One H1 per page. The frontmatter `title` is the H1. Start markdown content with H2 (`##`) or plain text, never with H1 (`#`).

This ensures:
- ✅ Clean SEO-friendly page structure
- ✅ Proper heading hierarchy
- ✅ Better search engine rankings
- ✅ Consistent user experience

## 新增 Visualization 内容规范

新增或修改 `/visuals/` 可视化作品时，必须遵守以下发布清单。

### 1. Manifest 是唯一发布真源

- 每个作品必须登记在 `src/data/visuals-manifest.json`，不要在页面、sitemap 或画廊组件中维护第二份作品列表。
- 使用跨语言稳定的 kebab-case `slug`；发布后不要因为标题翻译变化而修改 slug。
- 正确声明 `type`、`renderer`、`publishedAt`、`featured`、`cover`、`tags`、`status` 和 `externalResources`。
- 三语路由必须继续从 `getVisualWorks()`、locale 的 `artifact` 和 artifact ID 派生；禁止在 `[slug].astro` 中硬编码某个作品。
- 首页“最新可视化”必须通过 `getLatestVisual(lang)` 按 `publishedAt` 从 manifest 派生，并只展示当前语言已有 artifact 的作品；禁止在三语首页硬编码 Typhoon 或其他具体 slug。
- 新 renderer 或 artifact 必须在共享作品渲染入口注册；未注册的 artifact 应在构建期明确失败，不能静默显示空页面。

### 2. 多语言必须覆盖整个交互体验

- 默认同时提供英文、中文、日文版本；每个 locale 都要有 `title`、`description`、`og.title`、`og.description`、`source` 和 `artifact`。
- 翻译范围包括正文、标题、按钮、状态提示、错误提示、Canvas/SVG 图内标签、单位、动态拼接文案、`aria-label`、`title` 和 fallback/noscript 文案，不能只翻译画廊卡片。
- 语言切换必须保持同一个 slug，并落到真实存在的 locale 路由。
- 如确需渐进翻译，未完成语言不得声明 artifact；画廊必须明确展示可用语言，禁止静默回退到其他语言。
- 已经拥有当前语言 artifact 的作品，即使 URL 带有旧的 `?missing=` 参数，也不能显示“当前语言不可用”的错误提示。

### 3. 必须使用共享 Layout 和 Navigation Bar

- 作品页统一使用 `Layout.astro`，保留站点顶部 Navigation Bar、语言切换、深色模式、SEO、footer 和全站间距体系。
- 禁止发布自带站点 header、浮动 Visuals chrome 或第二套语言导航的页面。
- 禁止使用固定高度 iframe 或 `srcdoc` 嵌套长篇作品；应把作品转换成可嵌入共享 Layout 的正文组件。
- 全宽作品使用 Layout 的 `fullWidth` 能力，不要复制一份独立页面壳。

### 4. 样式必须隔离，不能污染全站

- 可视化 HTML 导入的 CSS 必须全部限定在作品根容器内，例如 `.typhoon-visual`；不能把 `:root`、`html`、`body`、`a`、`button`、`h1`、`p` 或通用 class 规则直接注入全局。
- CSS 作用域处理必须跳过 keyframes，但媒体查询内的普通选择器仍需加作品容器前缀。
- 作品需响应站点 `.dark` 状态；至少确保背景、正文、边框和主要控件在深色模式下可读。
- 作用域测试应允许 `.dark .visual-root` 等站点状态祖先，但每条非 keyframe 规则最终必须受作品根容器约束。

### 5. SEO 和页面结构

- 每个语言版本必须恰好一个 H1；共享 Layout 不生成作品 H1 时，由作品正文提供，禁止再添加重复页面标题。
- 页面 title/description 与 Open Graph 文案分别使用 manifest 中对应 locale 的普通字段和 `og` 字段。
- canonical、hreflang、HTML `lang`、发布日期、标签和 sitemap 必须由共享 Layout/manifest 生成。
- 新作品三语 URL 都应进入 sitemap；draft、缺失 locale 和已删除作品不得进入 sitemap。

### 6. 无障碍、动画和资源策略

- 所有交互必须可用键盘操作，控件要有本地化 accessible name；Canvas/SVG 必须提供可理解的 aria 或文字说明。
- 动画必须支持暂停和重置，遵守 `prefers-reduced-motion`，离开视口后应停止不必要的计算。
- 外部资源默认禁止；确有需要时只在 manifest 的 `externalResources` 中加入精确白名单，并把该白名单传给资源策略校验器。
- 不得为了方便直接加入未登记的远程 script、stylesheet、font、iframe、image 或动态加载 URL。

### 7. 选择模板还是自定义 HTML

- “总览—分步解释—重新组装”类内容优先复用 `tools/visual-explainer-kit/` 或 Typhoon 的交互图解契约。
- 地图、仪表盘、非线性叙事等特殊作品可以使用自定义 HTML/CSS/JS，但仍必须满足共享 Layout、三语、CSS 隔离、SEO、无障碍和测试契约。
- 复用模板时复用的是结构、runtime、生命周期和构建规则，不要复制并长期维护多份完整 HTML runtime。

### 8. 必测项目与完成门槛

- 修改交互细节时必须新增或更新对应 Playwright E2E，不能只做构建测试。
- 聚焦 E2E 至少覆盖：三语画廊、三语作品 200、共享 `body > nav`、单 H1、无 iframe/独立 header、核心控件本地化、暂停/重置、深色模式和 sitemap。
- 新增作品时应验证画廊卡片数量、标题、语言标签、打开链接和 artifact 路由；删除作品时应验证旧 Visuals/Blog HTML 路由返回预期状态且 sitemap 不再收录。
- 完成顺序：先 `pnpm build`，再 `pnpm test:run`、聚焦 Playwright，最后 `pnpm test:e2e`；构建失败时不要继续跑依赖 `dist` 的 preview E2E。
- 交付前运行 `git diff --check`，并启动 `pnpm preview --host 127.0.0.1 --port 4321` 实际检查桌面、移动端和三种语言。

## Command and Test Pitfalls

- Playwright's reduced-motion reveal test can fail transiently under a fully parallel run by observing `opacity: 0` before client initialization settles. When this happens, rerun the failing spec with `--workers=1`, then rerun the full suite before treating it as a product regression; in the observed case both reruns passed.
- PowerShell `Select-String -LiteralPath` does not expand wildcards such as `dist/_astro/*.css` and reports `Illegal characters in path`. Use `-Path` for wildcard expansion, or pipe files returned by `Get-ChildItem`.
- For `node -e` JavaScript in PowerShell, avoid wrapping the whole script in shell single quotes when the script also contains nested quoted values; quoting may be stripped before Node receives it. Prefer a PowerShell double-quoted argument with JavaScript single-quoted strings, or use a script file.
- A non-interactive `exec` session may not support sending Ctrl+C through `write_stdin`. Start long-running servers with an interruptible TTY when possible, or stop the verified listener by its owning PID/port.
- Tag detail routes are currently generated from blog tags that occur at least twice. New content types such as Meditations must not render unconditional `/tags/.../` links; use `getTagCounts()` and render a plain tag when the corresponding route is not generated. Taxonomy UI / hierarchical back-nav rules live under **Tag taxonomy（站点标签体系）** above (`src/data/tag-taxonomy.json`).
- Playwright reduced-motion coverage is more deterministic when the test calls `await page.emulateMedia({ reducedMotion: 'reduce' })` before navigation. A describe-level `test.use({ reducedMotion: 'reduce' })` was observed to leak or fail to apply when files shared a worker.
- `rg` exits with status 1 when it finds no matches. For cleanup assertions where “no matches” is the expected success state, handle `$LASTEXITCODE -eq 1` explicitly instead of treating it as a command failure.
- When a shared component or data helper expands from `en | zh` to the full `Language` union, update every localized content record and route prefix in the same change. Otherwise static generation can fail only when it reaches the newly added locale, as happened with `HtmlPagesSection` missing its `ja` copy.
- Do not run Playwright's preview-based E2E suite after `pnpm build` has failed. Astro may leave `dist` incomplete, causing Playwright's `webServer` startup to wait until its 120-second timeout. Fix and rerun the build first, then start E2E.
- AntiAdblock is mounted from the shared `Layout.astro`; route exclusions must therefore be implemented centrally against normalized paths and include all localized home/About variants, rather than being scattered across individual pages.
- Test AntiAdblock delays with Playwright `page.clock` and simulate blocking by injecting CSS for the bait classes (`.adsbox`, `.ad-unit`, etc.). Do not wait 30 real seconds or depend on a browser extension in E2E.
- In PowerShell, a `foreach (...) { ... }` statement cannot always be piped directly; doing so can produce `An empty pipe element is not allowed`. Assign the loop output to a variable or wrap it as `$(foreach (...) { ... })` before piping to `Sort-Object`, `Format-Table`, or similar commands.
- A Playwright config nested below the repository root uses the config directory as the default `webServer` working directory. If the command serves a repo-root path such as `dist/...`, set `webServer.cwd` explicitly (for example `../..`), otherwise the server can start successfully but return repeated 404 responses until the startup timeout.
- ripgrep's default Rust regex engine does not recognize .NET property names such as `\p{IsCJKUnifiedIdeographs}` and exits with a regex parse error. Use explicit ranges such as `[一-龯ぁ-ゟ゠-ヿ]`, or a Unicode property name supported by ripgrep/PCRE2.
- Filesystem deletion commands such as recursive or per-file PowerShell `Remove-Item` may be rejected by the execution policy before path-validation code runs. For disposable Python caches, prevent creation with `python -B` and ignore `__pycache__/` plus `*.py[cod]`; do not respond by retrying broader deletion commands.
- `pnpm exec astro check` is not currently a clean project gate: it reports hundreds of pre-existing diagnostics across legacy layouts, admin pages, tests, and localized routes. When using it during scoped work, fix every diagnostic in touched files, record the baseline limitation, and use successful `pnpm build` plus focused tests as the completion gate instead of attempting an unrelated repo-wide type cleanup.
- Do not force a Playwright success into a shell failure merely because a TDD RED state was expected. The shared `dist` directory may already contain the implementation from an earlier build; verify build provenance first, and if the behavior is already green, accept it and continue instead of throwing an artificial error.
- On Windows, passing a wildcard filename such as `dist/sitemap-*.xml` or `src/assets/html-pages/agent-*.html` directly to `rg` does not rely on shell expansion and can produce an invalid-path error. Pass the containing directory plus an rg glob instead, for example `rg -g 'sitemap-*.xml' 'pattern' dist`, or enumerate files with PowerShell first.
- In PowerShell, a command assembled as individually quoted executable and argument tokens (for example `"git" "status"`) is parsed as string expressions and fails unless the invocation operator `&` is used. Prefer normal native command syntax for fixed commands, or invoke an argument array with `& $exe @args`.
- `rg --files` exits with an OS error when an explicitly named search root does not exist. Before passing optional directories such as `tools/` or `prototypes/`, check them with `Test-Path`, or search from the repository root using `-g` filters.
- PowerShell path cmdlets treat square brackets in Astro dynamic route filenames such as `[slug].astro` as wildcard syntax. Use `Get-Content -LiteralPath`, `Test-Path -LiteralPath`, and equivalent literal-path parameters for these files.
- Preview/test child processes can exit between PID discovery and `Stop-Process`. Treat a missing PID as successful cleanup: re-query the process immediately before stopping it and use `-ErrorAction SilentlyContinue` instead of turning this normal race into a command failure.
- Imported standalone HTML artifacts can carry source-editor trailing spaces across thousands of lines, causing `git diff --check` to fail at commit time. Run a no-BOM, line-ending-preserving trailing-whitespace cleanup on the imported artifact before staging, then rerun `git diff --check`.
- The workspace path contains a full-width bracket segment (`【homepage`). Reuse the exact resolved working directory in tool calls; a manually retyped path that drops the separator after this segment fails before the command starts with “The directory name is invalid.”
- A long PowerShell one-liner that combines port discovery, `Start-Process`, log redirection, readiness polling, and conditional cleanup can be rejected by the command policy before execution. Split background preview startup into separate commands: verify the port, launch with `Start-Process -WindowStyle Hidden`, then poll HTTP readiness independently.
- Astro dev startup can spend more than a minute syncing a large content collection before the listener is ready. Do not launch Playwright helpers as soon as the process session exists; wait for the explicit `astro ... ready` message or poll the target URL until it responds, otherwise `page.goto` can fail with `ERR_CONNECTION_REFUSED` even though startup is still progressing normally.
- Stopping `pnpm dev` with Ctrl+C in a PowerShell TTY can prompt `Terminate batch job (Y/N)?` and then exit with code 1 after confirmation. Treat that code as an intentional shutdown result, not a product failure; verify the listener is gone before continuing.
- Once a long-running `exec` session has emitted an explicit completion line and closed, do not poll it again with `write_stdin`; an `Unknown process id` response means the finished session was already released, not that the build failed.
- With pnpm's strict dependency layout, `pnpm why <package>` can show a transitive package even though `require.resolve('<package>')` from the project root fails. Add build-time libraries as direct dependencies before importing them in project source.
- Do not inspect generated `dist` files while another build or Playwright webServer may recreate or clean `dist`. Wait for the producing command to finish, confirm the target with `Test-Path -LiteralPath`, and only then read it.
- The dark-mode Playwright toggle can time out transiently during a fully parallel run while the same spec passes immediately with `--workers=1`. Rerun the focused spec single-threaded and then rerun the full suite before classifying it as a theme regression.
- CSS isolation tests for embedded visuals must allow intentional site-state ancestors such as `.dark .typhoon-visual` while still requiring every selector to terminate at the visual container boundary. A blanket “every selector starts with `.typhoon-visual`” assertion incorrectly rejects valid dark-theme overrides.
- Homepage components are grouped under `src/components/home/`, not directly under `src/components/`. Before reading a guessed component path, use `rg --files src/components/home` or follow the import from the page; otherwise `Get-Content` fails on paths such as `src/components/HomeHero.astro`.
- For an intentional TDD RED run, confirm the failing assertions are only the newly requested behavior before implementation. A focused Visuals E2E that fails solely because `[data-home-latest-visual]` is absent is a valid RED state; unrelated failures must be diagnosed before proceeding.
- Do not combine `Start-Process` and readiness polling in the same `exec` call, even when using `-WindowStyle Hidden` and no log redirection; the command policy can reject the whole process creation before execution. Run launch and polling as separate calls, or keep `pnpm preview` alive in a direct TTY session when background process creation is blocked.
- `git symbolic-ref refs/remotes/origin/HEAD` fails when the remote HEAD tracking ref has not been configured locally, even if the remote has a clear default branch. Fall back to `gh repo view --json defaultBranchRef`, `git remote show origin`, or the existing `origin/main` / `origin/master` refs instead of treating the missing symbolic ref as repository corruption.
- Windows PowerShell in this workspace may not load `System.Web.HttpUtility`; using it to parse query strings can emit repeated `Unable to find type` errors even when the surrounding command exits 0. Parse the required parameter with a targeted regex plus `[uri]::UnescapeDataString()`, or use an API that returns structured JSON.
- Long PowerShell one-liners that embed natural-language search queries with apostrophes, smart punctuation, nested quotes, and URL ampersands can terminate strings early and trigger parser errors. Keep queries ASCII when possible, build URLs by concatenating separately assigned variables, or move complex quoting into a script file.
- GitHub's REST `/search/code` endpoint requires authentication and returns HTTP 401 to unauthenticated requests. For public-repository research without credentials, use repository trees, raw files, commit history, or repository search instead of retrying code search.
- `Invoke-WebRequest` can surface HTTP 308 redirects as errors for some legacy article URLs instead of following them as expected. Prefer the current canonical URL, or inspect and follow the `Location` header explicitly before treating the page as unavailable.
- In PowerShell, complex `rg` regexes containing nested groups, quotes, and non-ASCII alternatives can be mangled before ripgrep receives them and produce misleading “unclosed group” errors. Prefer `rg -F` for literal probes or `Select-String -SimpleMatch`; move genuinely complex patterns into a script file.
- A Playwright role locator stops matching after an interaction changes the control's accessible name (for example, “Pause all motion” becoming “Resume all motion”). Locate stateful controls by a stable data attribute, then assert their accessible name or text before and after the action.
- The visual explainer runtime owns generic Shadow DOM class names such as `.status`. New demo markup must namespace internal classes (`.contract-status`, `.evidence-status`, etc.); reusing a runtime class can inherit absolute overlay styles and silently intercept pointer events.
- `playwright screenshot --device "iPhone ..."` can select a device browser binary that is not installed even when Chromium E2E works, and `-b chromium` may not override that device default. For inspection-only mobile captures, use `-b chromium --viewport-size "390,844"` unless the device's browser is known to be installed.
- A yielded preview `wait(..., terminate: true)` or `Get-NetTCPConnection` cleanup can itself hang on Windows. If that happens, resolve the exact listener with `netstat -ano -p tcp | Select-String ':<port>'`, stop only the reported PID, and verify the port is gone.
- With this pnpm version, `pnpm <script> -- --help` can forward the separator itself as a literal `"--"` argument to a Python argparse script. Invoke visual-kit Python wrappers as `pnpm visual-kit:generate --help` or pass options directly without the extra separator.
- Do not pass optional roots that do not exist to `rg --files`, and exclude generated HTML or embedded binary/data-URL artifacts from broad content searches. Missing roots make ripgrep exit nonzero, while generated artifacts can flood and truncate the diagnostic output; probe roots with `Test-Path` and use narrow `-g` filters first.
- Do not recursively enumerate all of `C:\Users\<name>` as a fallback for locating a known project path; large dependency and cache trees can exceed command timeouts. Confirm the exact requested path with `Test-Path`, then inspect only that subtree.
- Markdown reference lists do not need trailing double spaces when each item already has its own indented explanation line. Those spaces make `git diff --check` fail; remove them and run the check before committing.
- PowerShell `Remove-Item` may be rejected by command policy even for an exact repository-local push log, while native-output redirection can create a UTF-16 file that `apply_patch` cannot read. Write future push logs outside the repository in the system temporary directory; for an already-created log, validate its resolved absolute path and use `[System.IO.File]::Delete()` on that one file instead of retrying broader deletion commands.
- `gh pr create` or a follow-up GraphQL query can fail with a transient `Post https://api.github.com/graphql: EOF` after the mutation may already have reached GitHub. Query PRs for the exact head branch before retrying creation so the workflow cannot accidentally open duplicates.
- A Git push can succeed through the repository SSH remote while `gh pr create` fails with `must be a collaborator`, because Git and GitHub CLI may use different identities. Check `gh auth status`, temporarily switch to the configured repository-owner account for PR operations, and restore the previously active account afterward.
- `apply_patch` verifies every hunk atomically against the current file. Large multi-hunk edits to long localized JSON can be rejected in full when even one later copy string differs from a stale excerpt. Re-read the exact target block, then patch one locale or one content object at a time with narrow structural context instead of combining broad replacements.
- In Codex's non-interactive Windows shell, `gopass show -o newapi/gemini` may time out with `Decryption failed: exit status 1` without ever launching a `pinentry` process; starting a child PowerShell window from the same session may also fail to surface the prompt. Ask the user to run `gopass show -o newapi/gemini` once in an already-interactive PowerShell to warm the GPG agent cache, then rerun `pnpm visual-kit:generate ...`; never print or persist the recovered secret.
- Visual authoring manifests may use an array of paragraphs for `body`; Gemini prompt compilation must normalize list values into separated text before calling `str.replace`, otherwise generation fails with `TypeError: replace() argument 2 must be str, not list`. Keep a generator unit test against a real multi-paragraph manifest.
- Gemini demo candidates commonly reach for `document.createElement()` even when the runtime contract limits them to the injected root. Keep the generator validation fail-closed, state `root.innerHTML` plus `root.querySelector()` explicitly in the prompt, and never overwrite the existing adapter when validation rejects global DOM access.
- Visual artifacts embed demo adapter source verbatim, so trailing spaces in a generated adapter are multiplied into every locale HTML and make `git diff --check` fail on artifact lines. Clean whitespace in the source adapter, rebuild all locale artifacts, and do not patch generated HTML directly.
- In PowerShell interpolated strings, a variable immediately followed by `:` can be parsed as an invalid scoped-variable reference (for example, `"$file:$line"`). Use `${file}:$line` or the format operator (`'{0}:{1}' -f $file, $line`) instead.
- An SSH `git fetch origin` can succeed while an immediately following `git ls-remote` on port 443 transiently fails with `Connection closed`. Do not misclassify this as an authentication or repository-access failure; use the refs from the successful fetch via `git for-each-ref`, or retry the remote probe before escalating.
- `gh pr checks <number>` exits with status 1 when a branch has no configured checks and prints `no checks reported`; this is not a failed CI run. Inspect `statusCheckRollup` with `gh pr view --json statusCheckRollup,mergeable,mergeStateStatus`, or explicitly handle the no-checks exit before deciding whether the PR can merge.
- If a PR was created before an amended commit was force-pushed, GitHub may leave the PR head pinned to the old SHA even though the branch API shows the new SHA. Closing and reopening that stale PR can fail with HTTP 422; keep it closed, create a new PR from the current branch, and verify the new PR head SHA matches the remote branch before merging.
- When GitHub GraphQL, REST, the web UI, and SSH-over-443 all fail together with `EOF`, `ERR_CONNECTION_CLOSED`, or connection-reset errors, treat it as a transient network/proxy outage rather than an auth or repository-state problem. Do not recreate an already-created PR or use a direct push to the base branch as an immediate workaround; retry bounded read-only probes, re-query the exact PR/head SHA after connectivity returns, then resume the normal merge flow.
- `visual-kit:generate --all --resume` stops the current batch when one Gemini candidate fails fail-closed validation, but earlier successful adapters and generation fingerprints remain valid. Retry only the rejected target with `--step <demo-id>`, then resume the batch; never weaken validation or discard already accepted outputs.
- In the auto-height Visual explainer runtime, a generated demo root with `height: 100%` can create a `ResizeObserver` → Canvas bitmap resize → layout growth feedback loop. Use a stable `min-height`, absolutely position Canvas inside a bounded relative container, and keep a focused E2E upper bound on rendered Canvas height.
- The Visual explainer shell template is `tools/visual-explainer-kit/src/shell.html`, not a `templates/shell.html` path. Before adding guessed files to a multi-path `rg` command, confirm them with `rg --files tools/visual-explainer-kit`; one missing explicit path makes the whole search exit nonzero.
- Do not start `pnpm preview` with a very short `shell_command` timeout in this Windows workspace. The tool may report exit 124 while the child listener survives, leaving an orphaned port; let the long-running command yield normally, then verify the exact port/PID before inspecting or cleaning it up.
- Do not assume the remote default branch is `main` when comparing or rebasing. This repository currently uses `master`, so an unchecked `origin/main...HEAD` revision fails as ambiguous; resolve the default with `gh repo view --json defaultBranchRef` or inspect `refs/remotes/origin` before constructing branch ranges.
- Piping a PowerShell here-string containing CJK locator text into `node --input-type=module -` can replace the localized literals with `?` characters before Node receives them, causing Playwright locators to time out. Prefer stable `data-*` selectors for shell-driven inspection, or run a UTF-8 script file when localized accessible names are required.
- Rebasing a local commit that appends a pitfall to `agents.md` can conflict when `origin/master` has independently appended rules at the same file tail. Resolve by retaining both sets of rules, remove only the conflict markers, stage the file, and continue the rebase; never accept one side wholesale.
- Do not pass wildcard search roots such as `test*` directly to `rg` on Windows; the wildcard can be interpreted as an invalid path. Search the repository with `-g` filters, or enumerate existing roots before invoking `rg`.
- Rebasing homepage Visual-list changes over a newly published Visual can conflict in the homepage cover component, manifest-derived tests, and Visuals E2E. Resolve by retaining the new manifest item and cover branch while updating the all-Visual ordering assertions; never choose either file wholesale.
- In PowerShell, quote stash references containing braces (for example, `git stash pop "stash@{0}"`). An unquoted `stash@{0}` can be parsed by PowerShell before Git receives it and surface as an unrelated `unknown switch` error.
- 在刚克隆的仓库中首次运行 `pnpm build` 前先执行 `pnpm install --frozen-lockfile`；缺少 `node_modules` 时会出现 `'astro' is not recognized`，根因是依赖尚未安装。
- 运行 Playwright 测试前确认 Chromium 二进制已安装；若出现 `Executable doesn't exist`，执行 `pnpm exec playwright install chromium-headless-shell`（必要时再安装 `chromium`）。
- 在 Windows 中通过 `Stop-Process` 主动停止 `pnpm preview` 后，pnpm 包装进程可能返回 `4294967295`；这是清理预览服务器的预期退出码，不代表构建或测试失败。
- `git fetch` 偶发出现 `Recv failure: Connection was reset` 时，先保留本地已有的远端引用并按网络瞬时故障处理；确认 `git rev-list --left-right --count origin/master...master` 后再重试 fetch/push，不要误判为仓库或权限损坏。

## Ad-free sections

AdSense loads site-wide except paths listed in `src/layouts/Layout.astro` (`adFreeExactPaths` / `adFreeRouteRoots`): home, About, `/go/`, Visuals, and Meditations (沉思录, owner rule 2026-10-08). When adding an ad-free section, update both that list and the ad description in `src/components/PrivacyPage.astro` (zh/en/ja).
