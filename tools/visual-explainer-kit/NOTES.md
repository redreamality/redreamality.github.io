# 设计验证记录

## 已验证结论

同一份 shell、runtime 和 demo 逻辑可以在不复制运行时代码的情况下支持多个主题、多个语言、可选总览和可变步骤数。

- 共享结构只保存 step/demo ID；正文、控件标签、状态文案和 aria 文案全部位于 locale 数据中。
- demo factory 接收 `copy`、`motion` 和 `tokens`；共享 runtime/demo 源码不含中日文硬编码。
- 同一构建器生成了气象主题的英、中、日三份自包含 HTML，以及 Agent 协作主题的英文 HTML。
- overview 可关闭，步骤数量可缩减；单语言 manifest 也能生成作品，并只显示可用语言。
- 完整产物各有一个 H1、三个交互图、零外部 URL；最小变体有一个交互图。
- demo 已拆成与 `typhoon/v2` 一致的逐文件适配器，builder 从 manifest 引用直接解析文件，不再依赖硬编码注册表。
- Gemini authoring seam 已接入：逐步骤 prompt、streaming 请求、gopass、重试、脱敏日志、增量状态、原子写入与 JavaScript 校验均位于工具内部。

## 覆盖范围

`pnpm visual-kit:e2e` 先运行 manifest/schema、重复步骤 ID、缺失 demo、Gemini streaming 与生成适配器校验，再覆盖三语加载、语言切换、图内/aria 本地化、尺寸生命周期、暂停、重置、reduced-motion、可选 overview、可变步骤数和第二主题。

## 正式集成边界

- 站点采用“专区目录 + 独立 HTML 体验”的混合模型；工具是可选 authoring path，不进入访客运行时。
- Astro visual manifest 管理路由、SEO、语言可用性和专区卡片；本工具只负责生成自包含体验页。
- `typhoon/v2` 的 14 个 demo 若要完全迁入共享模板，仍需逐个把可见及 aria 文案提取到 locale copy；当前发布版本继续保留经过验证的中文独立 HTML及精确翻译表。
- 样式和 design tokens 当前仍是一个参考主题，作品可以提供自己的美术方向。
