# 可视化专区决策图

目标：为站点规划一个三语可视化内容专区，并判断 `C:/Users/Remy/Documents/typhoon/v2` 应作为通用模板、可选模板，还是仅作为单次 HTML 来源。

当前推荐：采用“Astro 共享 Layout + 可视化作品正文”的混合模型。把 `typhoon/v2` 提炼为可选的交互图解模板；作品可以保留高度自定义的 HTML/CSS/JS，但必须嵌入站点共享导航、主题与多语言框架。

## #1: 专区的内容边界和 URL 是什么？

Blocked by: 无
Type: Discuss

### Question

可视化内容应继续放在 Blog 的 HTML Showcase 下，还是成为顶级内容类型？

### Answer

成为顶级内容类型“可视化作品”，不再以实现技术 HTML 命名。建议目录入口使用：

- 英文：`/visuals/`
- 中文：`/cn/visuals/`
- 日文：`/ja/visuals/`
- 作品使用跨语言稳定 slug，例如 `typhoon`。

Blog 可以通过相关推荐链接进入作品，但不作为作品的所有者。现有 `HTML Showcase` 后续迁移到专区。

## #2: 模板复用还是每次写独立 HTML？

Blocked by: #1
Type: Research

### Question

`typhoon/v2` 能否直接成为所有可视化内容的统一模板？

### Answer

不应二选一，采用两种 renderer：

- `interactive-explainer`：使用从 `typhoon/v2` 提炼的交互图解模板。
- `standalone`：作者提供完全自定义、自包含 HTML。

本地证据：

- 站点已有 `src/utils/html-pages.ts` + `iframe srcdoc` 链路，但固定 900px 高度会让长篇交互内容产生嵌套滚动；内容也不具备稳定的独立 URL。
- `typhoon.html` 为 190,121 字节、6,054 行，包含 14 个交互图、一个 H1、无外部 HTTP 资源，适合成为自包含产物。
- `typhoon/v2` 已将内容 JSON、文章壳、CSS、运行时、逐步骤 demo 和构建测试分开，具备提炼为模板的基础。
- 它目前仍把大量中文 UI、图内标签和 aria 文案硬编码在 shell、runtime 与 demo JS 中，不能原样复用到三语作品。

因此复用的是“创作契约、运行时和构建器”，不是复制同一份台风页面；遇到非线性叙事、全屏地图、数据仪表盘等作品时直接走 `standalone`。

## #3: 如何把 typhoon/v2 提炼成真正可复用的模板？

Blocked by: #2
Type: Prototype

### Question

最小改造能否让同一套视觉逻辑构建多个主题、多个语言，而不复制运行时代码？

### Answer

可以。正式工具与结论见 [三语交互图解创作工具](../../tools/visual-explainer-kit/README.md) 和 [验证记录](../../tools/visual-explainer-kit/NOTES.md)。

已验证的模板边界：

1. 共享结构只保存 step/demo ID；正文、控件、状态和 aria 文案全部进入 locale 数据；
2. runtime 只负责生命周期，demo factory 通过 `copy`、`motion`、`tokens` 接收作品数据；
3. 同一 shell/runtime/demo 可生成气象主题的英、中、日版本，并支持不同步数与可选 overview；
4. overview 可选，步骤数量可变，manifest 可以只声明实际可用的 locale；
5. 产物保持自包含、单 H1、无外部 URL，并通过暂停、重置和 reduced-motion E2E。

验证结果：`pnpm visual-kit:e2e` 包含 3 条 manifest/schema 负向校验和 9 条 Playwright 交互测试；站点生产构建成功。

决策：正式实现应从 `typhoon/v2` 提炼创作契约、runtime 和构建规则，不应原样复制整个目录。每个 typhoon demo 的可见/aria 文案需要逐步提取为 locale copy；路由/SEO 和缺失语言策略分别留给 #6、#4。

## #4: 三语内容的发布契约是什么？

Blocked by: #3
Type: Discuss

### Question

作品元数据、正文、图内文案和缺失翻译如何表达？

### Answer

已接受并实现。一个作品只有一个 manifest，集中记录共享字段和 `en/zh/ja` locale：

- 共享：slug、类型、renderer、发布日期、标签、封面、featured、状态；
- 本地化：title、description、正文/内容源、artifact、OG 文案；
- 所有可见文本和无障碍文本都属于 locale，不能留在共享 demo 逻辑中；
- 语言切换保持 slug；缺失 locale 时不得生成会 404 的切换链接。

专区本身始终三语；作品允许渐进翻译，但必须显式标记可用语言，不得静默回退正文语言。首发 Typhoon 已补齐英、中、日正文、控件、动态状态、Canvas 标签和 aria 文案，因此三种语言都直接生成作品页，不再显示缺失语言提示。

实现：`src/data/visuals-manifest.json`、`src/data/typhoon-translations.ts`、`src/utils/visuals.ts`、`src/utils/typhoon-artifact.ts`。

## #5: 专区首页应该如何呈现作品？

Blocked by: #1, #2
Type: Prototype

### Question

什么样的卡片、筛选和预览能让用户判断一个作品是否值得打开？

### Answer

已接受并实现克制的数字展览目录方向：三语标题与导语、精选作品卡片、作品类型、发布日期、语言可用性和明确的打开入口。V1 不加入搜索、筛选或动态预览，避免在只有少量作品时制造无效复杂度。

实现：`src/components/VisualGallery.astro` 与三语 `/visuals/` 路由；顶级导航和首页 Hero 均提供入口。E2E 覆盖桌面入口、移动端中文导航、单一 Typhoon 卡片和三语直接打开。

## #6: 独立 HTML 如何接入 Astro 构建和路由？

Blocked by: #3, #4
Type: Prototype

### Question

如何让产物拥有稳定、可索引的 URL，同时避免 `srcdoc` 的体积、嵌套滚动和 SEO 问题？

### Answer

已验证并采用 Astro 静态页面嵌入作品正文，不使用固定高度 iframe，也不使用作品自带的独立导航：

- 目标 URL：`/visuals/{slug}/`、`/cn/visuals/{slug}/`、`/ja/visuals/{slug}/`；
- 作品页统一使用共享 `Layout.astro`，保留站点顶部 Navigation Bar、语言切换、深色模式、SEO 与全站视觉风格；
- Typhoon 继续以一份中文自包含 HTML 作为交互源码，构建时提取 style/body、移除内部 header 与嵌套 main、把全部 CSS 选择器限定在作品容器内，再按 locale 精确替换正文和交互文案；
- Astro 负责读取 manifest、生成专区、作品页和 sitemap；作品正文只负责自身叙事与交互；
- 自定义 HTML 或模板生成物接入时也必须转换为可嵌入共享 Layout 的正文片段；
- 明确删除的 Agent Architecture 与旧 Blog HTML 路由返回 404，不进入 sitemap。

选择共享 Layout 页面与正文片段的原因：URL 稳定、无嵌套滚动，同时保留作品 CSS/JS 自由度，并让顶部导航、语言切换、SEO 和主题行为与全站一致。sitemap 与语言可用性都从同一 manifest 派生，并由 E2E 锁定。

## #7: 发布质量门槛是什么？

Blocked by: #4, #6
Type: Discuss

### Question

一个可视化作品达到什么标准才可出现在专区？

### Answer

已接受以下发布契约：

- 每个语言版本恰好一个 H1，由共享 Layout 提供独立 title、description、canonical 和正确 hreflang；
- 键盘可操作，图形有可理解的 aria/fallback 文案；
- 支持 `prefers-reduced-motion`，动画可暂停和重置，离开视口停止消耗资源；
- 桌面和移动端无裁切、无嵌套滚动；
- 外部资源默认禁止，确有需要时在 manifest 的 `externalResources` 显式 allowlist；构建期扫描资源属性、CSS URL 和动态加载调用；
- gallery 路由、语言切换、作品加载及核心交互均有 E2E；
- 构建器有 schema、缺失 demo、重复 ID 和自包含性测试。

首发 E2E 已覆盖专区路由、共享顶部导航、三语作品页、Typhoon 14 个交互图及滑块/暂停/重置核心交互、已删除路由、移动端导航与 sitemap。模板工具另有 schema、缺失 demo、重复 ID、暂停、重置、reduced-motion 和多语言 aria 覆盖。

## #8: 第一阶段如何切片实施？

Blocked by: #3, #4, #5, #6, #7
Type: Discuss

### Question

如何用最小垂直切片上线，而不是先搭一套过大的内容平台？

### Answer

第一阶段已按以下垂直切片完成：

1. 建立 manifest/schema、三语专区路由和导航入口；
2. 用 `typhoon` 完成共享 Layout 作品页与三语契约；
3. 提炼最小交互图解工具并迁入 `tools/visual-explainer-kit/`；
4. 补齐 SEO、语言切换、移动端、reduced-motion 与核心交互 E2E；
5. 分类、筛选和封面自动截图延后；基于 Gemini 的逐 demo 创作 CLI 已在第二阶段补齐，并复用同一构建与校验 seam。

当前状态：#1–#8 均已接受；第一阶段发布链路与第二阶段 Gemini authoring seam 均已完成。后续新增作品时，在“可选模板工具”与“完全自定义 HTML”之间按叙事形态选择，无需改变专区路由和发布契约。
