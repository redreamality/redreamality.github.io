# 可视化专区决策图

目标：为站点规划一个三语可视化内容专区，并判断 `C:/Users/Remy/Documents/typhoon/v2` 应作为通用模板、可选模板，还是仅作为单次 HTML 来源。

当前推荐：采用“Astro 目录层 + 独立 HTML 体验层”的混合模型。把 `typhoon/v2` 提炼为可选的交互图解模板，同时保留完全自定义 HTML 作为一等发布方式。

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
3. 同一 shell/runtime/demo 生成了气象主题的英、中、日版本，以及 Agent 协作主题的英文版本；
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

专区本身始终三语；作品允许渐进翻译，但必须显式标记可用语言。缺失语言路由返回对应语言专区，并带上作品与可用语言参数显示明确提示，不生成会落入 404 的语言切换链接，也不静默回退正文语言。

实现：`src/data/visuals-manifest.json`、`src/utils/visuals.ts`、`src/utils/visual-artifacts.ts`。

## #5: 专区首页应该如何呈现作品？

Blocked by: #1, #2
Type: Prototype

### Question

什么样的卡片、筛选和预览能让用户判断一个作品是否值得打开？

### Answer

已接受并实现克制的数字展览目录方向：三语标题与导语、精选作品卡片、作品类型、发布日期、语言可用性和明确的打开入口。V1 不加入搜索、筛选或动态预览，避免在只有少量作品时制造无效复杂度。

实现：`src/components/VisualGallery.astro` 与三语 `/visuals/` 路由；顶级导航和首页 Hero 均提供入口。E2E 覆盖桌面入口、移动端中文导航、卡片和缺失语言提示。

## #6: 独立 HTML 如何接入 Astro 构建和路由？

Blocked by: #3, #4
Type: Prototype

### Question

如何让产物拥有稳定、可索引的 URL，同时避免 `srcdoc` 的体积、嵌套滚动和 SEO 问题？

### Answer

已验证并采用 Astro 静态 endpoint 返回原始 HTML，不使用固定高度 iframe：

- 目标 URL：`/visuals/{slug}/`、`/cn/visuals/{slug}/`、`/ja/visuals/{slug}/`；
- 产物自身包含 title、description、canonical、hreflang、单一 H1、返回专区链接和语言切换；
- Astro 负责读取 manifest、生成专区、原始响应、站点 chrome 和 sitemap 信息；
- 自定义 HTML 作为源码导入，模板工具生成的产物也遵循同一接入契约；
- 可用作品 URL 从 manifest 自动派生到 sitemap `customPages`，缺失语言与旧 Blog 兼容 URL 明确排除；
- 既有 Blog HTML URL 继续返回同一语言产物，并以 canonical 指向新的 Visuals URL，遵守站点“不破坏既有 URL”规范。

选择静态 endpoint 的原因：URL 稳定、无嵌套滚动、保留作品完整 CSS/JS 自由度，且不需要把生成物混入 `public`。sitemap 与语言可用性都从同一 manifest 派生，并由 E2E 锁定。

## #7: 发布质量门槛是什么？

Blocked by: #4, #6
Type: Discuss

### Question

一个可视化作品达到什么标准才可出现在专区？

### Answer

已接受以下发布契约：

- 每个语言版本恰好一个 H1，具备独立 title、description、canonical 和正确 hreflang；
- 键盘可操作，图形有可理解的 aria/fallback 文案；
- 支持 `prefers-reduced-motion`，动画可暂停和重置，离开视口停止消耗资源；
- 桌面和移动端无裁切、无嵌套滚动；
- 外部资源默认禁止，确有需要时在 manifest 的 `externalResources` 显式 allowlist；构建期扫描资源属性、CSS URL 和动态加载调用；
- gallery 路由、语言切换、作品加载及核心交互均有 E2E；
- 构建器有 schema、缺失 demo、重复 ID 和自包含性测试。

首发 E2E 已覆盖专区路由、语言切换、独立 HTML 元数据、Typhoon 14 个交互图及滑块/重置核心交互、缺失翻译、旧 URL 兼容、移动端导航与 sitemap。模板工具另有 schema、缺失 demo、重复 ID、暂停、重置、reduced-motion 和多语言 aria 覆盖。

## #8: 第一阶段如何切片实施？

Blocked by: #3, #4, #5, #6, #7
Type: Discuss

### Question

如何用最小垂直切片上线，而不是先搭一套过大的内容平台？

### Answer

第一阶段已按以下垂直切片完成：

1. 建立 manifest/schema、三语专区路由和导航入口；
2. 用 `typhoon` 完成 raw HTML 路由原型与三语契约；
3. 提炼最小交互图解工具并迁入 `tools/visual-explainer-kit/`；
4. 迁移现有 Agent Architecture Showcase；
5. 补齐 SEO、语言切换、移动端、reduced-motion 与核心交互 E2E；
6. 分类、筛选、封面自动截图和创作 CLI 延后，等作品数量证明需求后再做。

当前状态：#1–#8 均已接受；第一阶段实现完成。后续新增作品时，在“可选模板工具”与“完全自定义 HTML”之间按叙事形态选择，无需改变专区路由和发布契约。
