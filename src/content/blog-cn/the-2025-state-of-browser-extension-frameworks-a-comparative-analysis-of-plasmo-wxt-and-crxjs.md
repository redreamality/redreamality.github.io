---
title: '2025年浏览器扩展框架现状：Plasmo、WXT 和 CRXJS 的对比分析'
pubDate: 2025-09-03T08:44:51.236Z
description: '比较 Plasmo、WXT 与 CRXJS 的入口、消息通信、UI 支持和发布边界，并区分原始 2025 分析与有日期的现行修订。'
author: 'Remy'
tags: ['browser-extension', 'frontend-development', 'wxt']
lang: 'zh'
translatedFrom: 'the-2025-state-of-browser-extension-frameworks-a-comparative-analysis-of-plasmo-wxt-and-crxjs'
---
## **第1部分：执行摘要**

### **1.1. 历史范围与现行修订**

本文保留 2025 年 9 月 3 日的标题、发布日期与 URL。2026-09-25 UTC 修订时，将架构比较、历史意见与当前文档分开。本次没有重建三个项目在 2025 年的完整发布和 issue 快照，不能用今天的文档推断某项功能当年从未存在，也不能继续把原文的维护排名当成已经验证的结论。本文未执行三框架同条件性能基准。

### **1.2. 竞争者概览**

市场主要由三个关键参与者定义，每个都有独特的理念和权衡：

* **WXT：** 适合评估文件入口约定、浏览器目标配置、存储工具和共享模块。消息通信仍使用浏览器 API 或自行选择的库，不是所有运行时问题都有内置包装。
* **Plasmo：** 可以评估面向 React 的约定、Content Scripts UI，以及生态中的存储和消息包。官方文档也列出 Vue、Svelte 的可选支持，不能把 React 优先写成只支持 React。
* **CRXJS：** 当团队希望显式维护 manifest、使用内容脚本 HMR，并自行选择应用层库时，可以评估这个 Vite 插件。职责范围较小是一种工具设计，不等于价值正在消失。

### **1.3. 关键战略要务**

本报告的一个核心发现是，浏览器扩展的技术领域已经成熟到领先框架之间的微小功能差异不如其各自开源生态系统的健康和活跃重要。框架为新浏览器版本提供及时更新、修补安全漏洞以及跟上更广泛的 JavaScript 工具链演变的能力至关重要。因此，框架社区的可证明健康及其维护者的活动已成为技术选择中最重要的因素，直接影响长期项目风险和总拥有成本。

## **第2部分：现代浏览器扩展开发生态**

要充分理解现代扩展框架的价值主张，必须了解它们运行的复杂技术环境。三个主要挑战定义了当前领域：向 Manifest V3 的架构转变、持续的跨浏览器 API 碎片化，以及扩展核心组件的固有断开性质。这些挑战共同提高了开发的基础复杂性，使得采用稳健的框架对于任何重大规模的项目几乎是必要的。

### **2.1. 不可避免的转变：Manifest V3 (MV3)**

从 Manifest V2 到 Manifest V3 的过渡，主要由 Chrome 浏览器的 Google 驱动，代表了扩展架构多年来的最重要范式转变。核心变化是用短暂的 service workers 取代持久的 background pages。在 MV2 下，background script 可以无限期运行，在整个浏览器会话中在内存中维护状态。在 MV3 下，service worker 是事件驱动的，浏览器可以随时终止它以节省资源，无法保证其持久性。

这种架构变化从根本上改变了扩展的设计方式。它迫使开发者采用无状态、事件驱动的模型，在 service worker 终止之前必须将任何关键信息持久化到存储中。这在管理应用程序状态、处理异步操作以及确保在 worker 重新激活时正确注册事件监听器方面引入了重大复杂性。向 MV3 的转变增强了浏览器性能和安全性，但对开发者施加了更大的架构负担，使现代框架提供的抽象比以往更有价值。

### **2.2. 跨浏览器难题**

虽然 WebExtensions API 创建了一定程度的标准化，但由于微妙但关键的实现差异，为多个浏览器开发仍然是一个重大挑战。这些不一致分为几类：

* **API 命名空间：** Firefox 和 Safari 主要使用 browser.* 命名空间用于 API，这些 API 为异步操作返回 Promise。Chromium 浏览器（Chrome、Edge、Opera）历史上一直使用基于回调的 chrome.* 命名空间，尽管它们一直在逐步添加 Promise 支持。
* **功能可用性：** 整个 API 模块或 API 中的特定方法可能在一个浏览器中可用，但在另一个浏览器中不可用。例如，Firefox 通过 contextualIdentities API 支持容器标签，这是 Chrome 中不存在的功能。
* **行为差异：** 即使支持 API，其行为也可能不同。一个值得注意的例子是内容脚本如何与宿主页面的 JavaScript 环境交互。Chrome 使用称为 "隔离世界" 的概念来防止冲突，而 Firefox 采用称为 "Xray vision" 的不同安全模型。

框架可以共享配置并统一部分 API 访问方式，但不能实现浏览器本身缺少的功能。资源构建、API 行为、调试、打包和商店提交应分别验证，不能承诺一次构建在所有浏览器上无差异运行。

### **2.3. 扩展生命周期的复杂性**

浏览器扩展不是单一的应用程序，而是一组不同的、通常隔离的组件，这些组件必须通信才能正确运行。这些组件通常包括：

* **Background Service Worker：** 扩展的中心事件处理程序和状态管理器。
* **Popup UI：** 当用户点击扩展的工具栏图标时显示的临时 HTML 页面。
* **Content Scripts：** 直接注入到网页中以读取或修改其内容的 JavaScript 和 CSS 文件。
* **Options Page：** 用于用户配置的持久 HTML 页面。

这些组件在不同的上下文中运行，不能直接调用函数或共享内存。所有通信必须通过消息传递系统发生，通常使用 runtime.sendMessage 和 runtime.onMessage API。管理这种异步通信，特别是涉及多个组件的复杂交互，通常会导致大量样板代码，并且可能是常见的错误来源。框架旨在通过提供更高级别的消息传递 API 或其他状态管理解决方案来简化这个过程。MV3 生命周期管理、跨浏览器 API 碎片化和消息传递架构固有复杂性的综合重量使得从头开始构建非平凡扩展变得低效且容易出错。框架不再是开发的奢侈品；它们是构建可维护、可扩展和健壮的浏览器扩展的战略必要性。

## **第3部分：深入分析：Plasmo 框架**

Plasmo 框架将自己定位为"由黑客为黑客制作的电池式浏览器扩展 SDK"，旨在为扩展提供类似于 Next.js 为 Web 应用程序提供的开发体验。它建立在高度规范化的、声明式哲学之上，旨在最小化配置并加速开发，特别是对于 React 生态系统内的团队。

### **3.1. 架构深入探讨："扩展的 Next.js"**

Plasmo 的核心架构原则是抽象 manifest.json 文件。该框架不要求开发者手动配置入口点和权限，而是根据项目的文件结构自动生成清单。放置在特定目录中或按照约定命名的文件（例如，popup.tsx、options.tsx、content.ts、background.ts）会自动识别并连接到的最终扩展包中。这种声明式、基于文件的路由系统有意类似于 Next.js，为 Web 开发者提供熟悉的模式。

Plasmo 使用 **Parcel**，WXT 和 CRXJS 使用 Vite。这会影响配置、插件、缓存与调试方式，但构建器名称本身不能证明速度或技术债务。应检查所选版本实际解析的依赖，以及项目需要的插件是否兼容。

### **3.2. 开发者体验 (DX)：规范化和精简**

Plasmo 明确专为 React 和 TypeScript 开发者设计，开箱即提供一流的支持。开发工作流通过简单的脚手架命令启动，`pnpm create plasmo`，可以通过标志来包含像 TailwindCSS 或 Supabase 这样的集成。

开发服务器支持更新反馈，但模块替换、页面刷新与整个扩展重载需要区分。[Plasmo 官方文档](https://docs.plasmo.com/framework)列出 React 优先及 Vue/Svelte 可选支持；这描述集成方式，不代表已经测出其他 UI 框架的开发效率更低。应使用所选集成检查哪些状态能在修改后保留。

### **3.3. 核心功能和抽象**

Plasmo 的"电池式"特性体现在其丰富的内置功能和为简化常见扩展开发任务而设计的高级抽象中。

* **API 包装器：** 该框架包含自己的核心扩展功能的高级 API。Storage API 提供了一个简化的数据持久化接口，Messaging API 抽象了底层 chrome.runtime.sendMessage 系统的复杂性，使 background、popup 和 content scripts 之间的通信更加直接。
* **Content Scripts UI (CSUI)：** 这是 Plasmo 最引人注目的功能之一。它提供了一种流线型方式，通过 content script 直接在网页上呈现复杂的 UI 组件，例如用 React 构建的组件。至关重要的是，Plasmo 可以自动将这些 UI 包装在 Shadow DOM 中，这会将扩展的 CSS 与宿主页面的样式隔离，防止冲突——这是一个常见且难以手动解决的问题。
* **部署和发布：** Plasmo 生态系统超越了核心框架，扩展到包括整个扩展生命周期的工具。开源的 Browser Platform Publisher (BPP) 是一个 GitHub Action，可自动将扩展部署到 Chrome、Firefox 和 Edge 网络商店。此外，Plasmo 提供了一种名为 Itero TestBed 的商业 SaaS 产品，为测试扩展提供暂存环境，并在不经过官方商店审核流程的情况下向 beta 测试者推送更新。

### **3.4. 需要收集的维护证据**

原文通过星标、竞争产品的比较页和社区讨论推导维护风险，但这些资料没有组成带日期的维护审计，因此不再用作企业风险评分。星标反映关注，不说明项目依赖或浏览器阻塞问题需要多久才能解决。

应检查 Plasmo 自己的[发布记录](https://github.com/PlasmoHQ/plasmo/releases)、所选 tag 的 package manifest，以及与实际依赖相关的 issue。记录检查日期、安装版本、阻塞问题、可用绕行方案和修复是否已经发布。主干上的修复不自动等于 npm 安装包已经包含它，其他候选工具也需要同样检查。

存在付费服务不能证明维护者如何分配开源资源。只有准备使用该服务时，才单独评估服务条款与依赖关系；只使用本地框架的团队，不应承担由无关商业产品推测出来的风险评分。

长期产品还要明确谁能诊断构建错误、锁定可用依赖、提交补丁或维护临时 fork。三个候选都有这项责任。某个未解决的 issue 可以成为项目的实际阻塞，但不能单独证明整个项目无人维护；持续发布也不能保证自己的问题会及时解决。

## **第4部分：深入分析：WXT 框架**

WXT 借鉴 Nuxt 的入口发现和自动导入等约定。它的目标配置帮助复用源代码，但浏览器 API、manifest 版本、原生打包与商店提交仍是不同的兼容性问题。

### **4.1. 架构深入探讨：受 Nuxt 启发且框架无关**

WXT 最重要的架构优势是它的 **前端框架无关性**。与 Plasmo 的 React 中心方法不同，WXT 旨在与任何具有 Vite 插件的现代 UI 框架一起工作。它为最流行的选择——React、Vue、Svelte 和 SolidJS——提供了预配置的官方模块，但不排除使用其他框架。这种灵活性使 WXT 成为异常通用和面向未来的选择，因为它不会将开发团队锁定在特定的 UI 技术上。

WXT 构建在 **Vite** 之上，可以使用相应插件和配置。本次配套教程固定 WXT 0.21.4 与直接安装的 Vite 6.3.6，完成了资源构建；没有与等价 Plasmo、CRXJS 项目对照，因此不能据此推导速度或体积排名。

### **4.2. 开发者体验 (DX)：一流的工具**

WXT 经过精心设计，通过一套强大的 DX 功能来最小化开发者摩擦并减少样板代码。

* **基于文件的入口点：** 与 Plasmo 类似，WXT 采用基于文件的系统，其中 manifest.json 根据入口点目录中存在的文件自动生成。然而，WXT 通过允许在入口点文件内直接内联配置选项来增强此模式，在清单生成上提供更大程度的细粒度控制。
* **自动导入：** 受 Nuxt 启发的突出功能，WXT 提供组件、钩子和实用函数的自动、按需导入。这消除了数十个手动导入语句的需要，导致更简洁、更简洁的代码，并显著提高开发人员生产力。
* **开发模式：** 分别检查 popup 字段、注入组件与后台监听器的更新行为，区分 UI HMR、内容脚本重新注入和后台重载。一个上下文更新正常，不代表另一个上下文的状态也会保留。
* **CLI：** 项目脚手架由交互式命令行界面处理，通过 `npx wxt@latest init` 调用。该工具指导开发者选择项目名称、UI 框架模板（包括 vanilla TypeScript）和其他初始设置选项，使新项目能够在几秒钟内启动。

### **4.3. 核心功能和抽象**

WXT 提供了一套全面的功能，解决了跨浏览器扩展开发的主要痛点。

* **浏览器 API 访问：** WXT 提供 `browser` 导入，但不会实现浏览器缺少的 API，也不保证行为一致。存在差异的接口仍需能力检查、目标配置与实际运行测试。
* **全面的构建和发布：** 该框架为整个部署管道提供了强大的内置工具。它包括为不同浏览器商店生成优化 ZIP 包的命令，包括创建单独的源代码 ZIP 文件，这是提交到 Mozilla Add-ons 商店的要求。此外，WXT 提供了自动化上传和发布扩展过程的实用程序。
* **模块系统：** 对于维护一系列相关扩展的组织，WXT 提供了强大的模块系统。此功能使创建可重用模块成为可能，这些模块可以在多个扩展项目之间共享构建时配置和运行时代码，促进代码重用并简化维护。

### **4.4. 维护与升级边界**

作品展示可以帮助寻找值得研究的项目，但用户数不能衡量框架可靠性，也没有说明作者额外完成了多少应用工程。应读取 [WXT 发布记录](https://github.com/wxt-dev/wxt/releases)和准备安装版本的升级说明。

当前 [0.21 升级说明](https://wxt.dev/guide/resources/upgrading)要求 Node >=22、直接安装 Vite，并调整源码 ZIP 规则，还移除了 `url:` imports。这些是需要处理的具体迁移事项，不能反过来证明相应的 2025 功能描述当时就是错误的。

多 UI 选择可以减少扩展逻辑与渲染层的耦合，但不会消除升级成本。模块、Vite 插件、注入样式和生命周期清理需要一起检查。CRXJS 同样支持多框架，Plasmo 也列出可选 Vue/Svelte；这项能力不是 WXT 独占的。

## **第5部分：深入分析：CRXJS Vite 插件**

CRXJS 在扩展开发生态系统中占有独特的位置。理解 CRXJS 与 Plasmo 或 WXT 不属于同一类型的综合一体化框架至关重要。相反，它是一个高度集中的 **Vite 插件**，旨在使用现代 Vite 工具链解决打包浏览器扩展的特定复杂挑战。它的哲学是极简主义和控制，提供基本的构建时功能，同时有意避免应用程序级别的抽象。

### **5.1. 架构深入探讨：一个工具，而非框架**

@crxjs/vite-plugin 的核心目的是弥合 Vite 的开发服务器与浏览器扩展环境的独特要求之间的差距。它提供了零配置设置，允许开发者利用 Vite 及其广泛的插件生态系统进行扩展开发。

与 WXT 和 Plasmo 的基于文件的路由约定不同，CRXJS 坚持更传统的方法，其中 manifest.json 文件作为定义扩展入口点（background scripts、content scripts、popups 等）的唯一真实来源。该插件解析此清单并相应地配置 Vite 的构建过程。这种模式吸引喜欢清单的显式配置而不是完整框架的约定式"魔法"的开发者。

### **5.2. 开发者体验 (DX)：精简且不规范化**

CRXJS 将内容脚本 HMR 列为功能。验证时应修改实际注入组件，观察页面输入是否保留，以及多次更新后是否累积监听器和样式。模块接受更新的边界仍然存在，不能只凭 HMR 标签保证所有状态保留或认定速度领先。[官方介绍](https://crxjs.dev/guide/introduction/)也明确列出多种 UI 框架支持。

设置过程精简且直接：开发者初始化一个标准的 Vite 项目，安装 @crxjs/vite-plugin 包，并将其添加到 vite.config.js 文件中，指向项目的 manifest.json。这种极简主义方法赋予开发者最大控制权，因为他们可以自由组织应用程序并为存储和消息传递等任务选择自己的库，而不受框架约定的约束。

### **5.3. 核心功能**

CRXJS 专注于一组狭窄但关键的责任：

* **Vite 集成和 HMR：** 它的主要功能是使用 Vite 正确捆绑所有扩展组件，并管理扩展页面（popups、options）和 content scripts 的 HMR 连接。
* **Web 可访问资源：** 它自动化了在清单的 web_accessible_resources 字段中声明资产的过程。这是开发者手动错误的常见来源，插件根据代码中静态资产导入自动管理这些条目的能力是一个显著的生活质量改进。

值得注意的是 CRXJS 不提供什么。没有为浏览器的 Storage、Messaging 或 Internationalization (i18n) API 提供内置包装器或抽象。使用 CRXJS 的开发者预计将直接与原生的 chrome.* 或 browser.* API 交互，或为这些目的选择和集成自己的第三方库。

### **5.4. 维护与应用层责任**

原文从 beta 持续时间和社区讨论推导未来维护风险。本次未重建这段历史，不再把它作为当前可靠性评分。需要查阅[项目发布记录](https://github.com/crxjs/chrome-extension-tools/releases)，核对所选版本的时间与 Vite 兼容范围。

候选版本还要测试目标 manifest、资源导入与 UI 插件能否一起工作，记录未解决的问题，以及团队能否锁版本或修改集成。评估标准应与 WXT、Plasmo 一致，不能根据仓库关注量推断企业适用性。

CRXJS 将存储、消息结构和状态管理留给应用。已有稳定库的项目可以沿用，新团队则可能希望更多约定。WXT 内置存储工具，但不内置消息包装，两者都需要安排消息层的责任。选择已有库也不等于必须自己重新实现这些能力。

## **第6部分：比较框架分析：正面评估**

功能比较说明各工具负责什么以及工作流如何组织，不用于选出总体冠军。下面修订的是当前文档边界，不是重新构造的 2025 年逐包版本快照。

### **6.1. 详细功能矩阵**

依据为 [WXT 消息指南](https://wxt.dev/guide/essentials/messaging)、[WXT 升级说明](https://wxt.dev/guide/resources/upgrading)、[Plasmo 文档](https://docs.plasmo.com/framework)与 [CRXJS 介绍](https://crxjs.dev/guide/introduction/)。未确认的组合保留为检查项，不标成普遍支持。

| 功能类别 | 功能 | WXT | Plasmo | CRXJS |
| :---- | :---- | :---- | :---- | :---- |
| **维护** | **发布与依赖审计** | 检查所选 tag | 检查所选 tag | 检查所选 tag |
| **开发者体验** | **一流 TypeScript** | ✅ | ✅ | ✅ |
|  | **入口点发现** | ✅ (基于文件) | ✅ (基于文件) | ❌³ |
|  | **内联入口点配置** | ✅ | ✅ | ❌ |
|  | **自动导入** | ✅ | ❌ | ❌ |
|  | **可重用模块系统** | ✅ | ❌ | ❌ |
|  | **UI 集成** | 官方模块与 Vite 插件 | React；可选 Vue/Svelte | 多框架 Vite 集成 |
| **构建工具** | **底层构建器** | Vite | Parcel | Vite |
|  | **创建扩展 ZIP** | ✅ | ✅ | ❌ |
|  | **创建 Firefox 源码 ZIP** | ✅ | ❌ | ❌ |
|  | **自动化发布** | ✅ | ✅ | ❌ |
|  | **远程 URL 导入** | WXT 0.21 已移除 | 核对所选版本与政策 | 不是核心承诺 |
| **开发模式功能** | **.env 文件支持** | ✅ | ✅ | ✅ |
|  | **UI 的 HMR** | ✅ | 🟡⁵ | ✅ |
|  | **Content Scripts 的 HMR** | 🟡⁶ | 🟡⁶ | ✅ |
|  | **更改时重新加载 Background** | 🟡⁶ | 🟡⁶ | 🟡⁶ |
| **API 包装器** | **Storage API** | ✅ | ✅ | ❌⁷ |
|  | **Messaging API** | ❌⁷ | ✅ | ❌⁷ |
|  | **Content Script UI** | ✅ | ✅ | ❌⁷ |
|  | **国际化 (i18n)** | ✅ | ❌ | ❌ |
| **浏览器/清单** | **跨浏览器运行** | 分目标测试 | 分目标测试 | 分目标测试 |
|  | **MV2 支持** | ✅ | ✅ | 🟡⁸ |
|  | **MV3 支持** | ✅ | ✅ | 🟡⁸ |

表格脚注：
原维护评分与星标已移除，因为本文没有提供可复核的带日期维护审计。
³ 入口点在 manifest.json 中专门配置。
⁴ React 优先与 Vue/Svelte 可选描述支持路径，不代表测量出的速度差距。
⁵ 根据所选 UI 集成测试 HMR，不假设不同框架更新行为相同。
⁶ 区分 UI HMR、内容脚本注入、后台重载与页面刷新。
⁷ 不提供内置包装器；开发者必须使用原生浏览器 API 或第三方库。
⁸ 核对插件版本和目标 manifest。一个产物只能声明一个版本，不代表同一源码不能生成不同产物。

### **6.2. 关键差异化因素分析**

功能矩阵突出了框架显著分歧的几个关键区域，对开发团队有重要的实际影响。

* **维护：** 收集带日期的发布记录、依赖兼容性与实际阻塞问题，任何候选都不保证未来维护。
* **开发流程：** 在团队实际编辑的上下文里比较入口发现、生成配置与 HMR。自动导入是一种约定，不是生产力分数。
* **运行时责任：** WXT 内置存储工具，消息使用原生 API 或选配库；Plasmo 提供生态消息 API；CRXJS 由应用选择这两层的方案。

浏览器支持还应单独拆表。[目标文档](https://wxt.dev/guide/essentials/target-different-browsers)和[发布文档](https://wxt.dev/guide/essentials/publishing)区分了这些阶段：

| 目标 | 配套 WXT 0.21.4 示例的资源构建 | 运行与分发边界 |
| --- | --- | --- |
| Chrome MV3 | 已构建 | 未验证浏览器加载与商店提交 |
| Firefox MV2 | 已构建，已生成源码 ZIP | 临时加载、数据声明、ID 与 AMO 审核需另查 |
| Safari MV2 | 已构建 | 未执行 Apple 打包、签名、设备测试或提交 |

WXT 不创建 Safari 原生应用容器，也不自动发布 Safari 扩展。Apple 除了命令行方案，还提供 [App Store Connect 网页打包](https://developer.apple.com/documentation/safariservices/packaging-and-distributing-safari-web-extensions-with-app-store-connect)。本轮没有构建 Plasmo、CRXJS 的对应目标，不能把文档中的支持描述当成同等级实测结果。

## **第7部分：性能和构建工具深入探讨：Vite vs. Parcel**

底层构建器的选择是一个基础架构决策，深刻影响开发期间的开发者体验和最终扩展的性能。Vite（由 WXT 和 CRXJS 使用）和 Parcel（由 Plasmo 使用）之间的分歧反映了现代 Web 开发生态系统中更广泛的趋势。

### **7.1. 构建器的影响**

构建器的职责包括解析模块导入、转换代码（例如，TypeScript 到 JavaScript，JSX 到 JS）、优化资产以及将一切打包成浏览器可以执行的文件。这个过程的效率直接影响开发者看到更改的速度（开发服务器速度和 HMR）以及最终产品的速度和大小（生产构建性能）。

### **7.2. Vite (WXT, CRXJS)：构建结构**

原文 2025 年讨论的是 ESM 开发服务器、依赖预构建与 Rollup 生产构建。这是对应工具代际的架构说明，不是适用于所有未来 Vite 版本的描述，也不是扩展框架基准：

* **开发模块：** 按需转换改变启动工作，但入口发现、插件、依赖和浏览器加载仍然需要时间。
* **依赖预构建：** 冷缓存与热缓存是不同实验条件，不能把 esbuild 单组件的速度数字套到完整扩展流程。
* **生产打包：** 配套示例的 Vite 6 使用 Rollup。比较体积前，应保持源码与优化设置一致。

查询 [Vite 文档](https://vite.dev/guide/)时应对应准备采用的版本。保留锁文件并记录 Vite 主版本，不能把后来工具链的行为悄悄归到 2025 年的版本上。

### **7.3. Parcel (Plasmo)：需要测量的项目**

Parcel 通过构建流程和缓存处理转换与资源。[官方开发文档](https://parceljs.org/features/development/)说明其行为，但不能证明特定 Plasmo 项目相对等价 WXT 或 CRXJS 项目的速度。

应使用相同 popup、内容脚本、存储设置、UI 框架和目标浏览器，固定 Node、包管理器、框架与构建器版本。分别记录冷启动、热启动、一次 UI 修改、一次内容脚本修改与生产构建。除非研究安装，否则依赖下载不计入启动时间。重复实验并报告中位数与波动，附机器配置与命令。本轮没有执行这项比较，所以不指定速度冠军。

### **7.4. 包大小和运行时性能**

在浏览器扩展的资源受限环境中，包大小的每一 KB 和执行时间的每一毫秒都很重要。大型扩展可能导致浏览器滞后、增加内存消耗并导致糟糕的用户体验。

UI 依赖会影响输出，但效果取决于应用与编译设置。应先保持 UI 实现一致，再把体积差异归因于扩展工具。WXT、CRXJS 都允许多种 UI 集成，Plasmo 也记录了 React 以外的可选方案。编译型 UI 仍产生运行时代码，并不对每种工作负载都更小或更快。

使用所选版本的分析工具检查重复依赖，以及每个入口实际包含的代码。原始体积、压缩包体积、popup 启动、内容脚本执行与后台唤醒属于不同指标。代码分割和延迟加载会改变执行时机，优化后仍需要测量实际用户操作。

## **第8部分：战略框架选择：项目原型建议**

最优框架选择不是绝对的，而是取决于项目的具体背景和约束。必须考虑团队专业知识、项目规模、战略优先权和目标平台。本节提供战略决策矩阵和详细的场景分析，以指导技术领导者为其需求选择最合适的框架。

### **8.1. 框架决策矩阵**

下表将常见项目需求映射到每个框架的适用性，将前面的技术分析转化为可操作的战略指导。

| 项目需求 | WXT | Plasmo | CRXJS |
| :---- | :---- | :---- | :---- |
| **团队专业知识** |  |  |  |
| React 团队 | 评估官方 React 模块 | 评估 React 约定与 CSUI | 评估 Vite React 集成 |
| Vue/Svelte/SolidJS 团队 | 核对官方模块 | 核对 Vue/Svelte 可选路径，其他另查 | 核对所选 Vite 插件 |
| 多框架团队 | 共享 WXT 模块 | 共享 Plasmo 约定 | 共享 Vite 配置 |
| **项目规模** |  |  |  |
| 小型原型 / MVP | 测试完整流程 | 测试完整流程 | 测试完整流程 |
| 中型产品 | 审计升级与测试成本 | 审计升级与测试成本 | 审计应用库责任 |
| 企业套件 | 明确维护负责人 | 明确维护负责人 | 明确维护负责人 |
| **战略优先权** |  |  |  |
| 上市时间 | 测量团队流程 | 测量团队流程 | 测量团队流程 |
| 长期可维护性 | 带日期的发布与依赖审计 | 带日期的发布与依赖审计 | 带日期的发布与依赖审计 |
| 显式配置 | 生成 manifest 的约定 | 生成 manifest 的约定 | manifest 驱动 |
| **目标平台** |  |  |  |
| 仅 Chrome | 验证目标清单与 API | 验证目标清单与 API | 验证目标清单与 API |
| 多浏览器 | 分别构建与测试 | 检查每个支持目标 | 检查插件版本与目标 |

### **8.2. 详细场景分析**

决策矩阵可以通过检查几种常见的项目原型来进一步阐明。

* **场景 A：企业 React 团队**
  * **背景：** 一个拥有深厚内部 React 专业知识的组织，负责构建复杂的、任务关键的浏览器扩展，该扩展将得到多年支持。稳定性、安全性和长期可维护性是最高优先权。
  * **分析：** 使用现有组件库比较 Plasmo 的 React 约定、WXT 的 React 模块与 CRXJS 的 Vite 集成。实验应覆盖权限、后台重启、存储迁移，以及团队诊断生成代码的能力。
  * **选择边界：** 完成带日期的依赖审计和代表性工作流后决定。没有工具能消除维护风险，企业规模本身也不排除插件方案。

* **场景 B：精益创业 / 独立开发者**
  * **背景：** 一个小型、敏捷的团队或独立开发者正在构建最小可行产品 (MVP)。主要目标是验证想法并尽快运送功能产品。
  * **分析：** 比较完成一个真实流程所需的工作，而不只比较生成模板。WXT 的存储工具可供使用，但消息仍需原生 API 或选配库；Plasmo 有生态包装，CRXJS 允许沿用已有应用库。
  * **选择边界：** 优先考虑团队能够解释、测试并完成发布演练的约定。本文没有测出从原型到发布的最快方案。

* **场景 C：多框架代理机构**
  * **背景：** 为各种客户构建浏览器扩展的数字代理机构或咨询公司。这些客户可能有现有技术栈和不同 UI 框架的偏好，例如 React、Vue 或 Svelte。
  * **分析：** 这个场景完美地凸显了 WXT 架构的战略优势。其框架无关性是此用例的 killer feature。代理机构可以将其核心扩展开发和构建过程标准化为 WXT，创建跨所有项目一致、高效的工作流程。这使他们能够积累机构知识和可重用代码（可能使用 WXT 的模块系统），同时保留使用每个客户端所需的特定 UI 框架的灵活性。
  * **选择边界：** WXT 是共享模块和多 UI 集成的候选之一。CRXJS 同样支持多框架，Plasmo 列出可选 Vue/Svelte。统一工具前应测试实际插件组合、注入样式与更新行为。

* **场景 D：性能纯粹主义者 / 工具专家**
  * **背景：** 构建高性能、轻量级扩展的开发者，其中包大小的每一 KB 和延迟的每一毫秒都至关重要。这位开发者是工具专家，更喜欢对每个依赖和构建步骤拥有完全的、细粒度的控制，并警惕框架的"魔法"。
  * **分析：** manifest 驱动的插件适合显式管理依赖，但不能证明产物更小。自行选用的库也可能比框架工具更大，重复注册监听器则可能主导运行成本。
  * **选择边界：** 重视显式配置时可以纳入 CRXJS，然后对相同工作负载测量。较少抽象是一种设计偏好，不是性能结果。

## **第9部分：结论和未来展望**

### **9.1. 最终裁决**

原文的普遍推荐撤回，因为没有同条件基准或带日期的维护审计支持。WXT、Plasmo 与 CRXJS 组织的是不同部分的工作。入口约定、应用库责任、UI 集成与发布目标，才是可以逐项核对的选择条件。

完整 WXT 示例见[固定版本的开发教程](/cn/blog/browser-extension-development/)。类型检查与多目标资源构建验证的是一个示例，并非框架运行时比较。产品决定仍需实际浏览器执行与发布演练。

### **9.2. 生态系统的未来**

后续变化应根据发布说明、API 要求和迁移实验判断，不预测某个工具必然吸收其他工具。例如 WXT 移除 `url:` imports 是现行升级事项，不能据此把 2025 年所有远程导入描述改判为历史错误。

将选定版本、锁文件、浏览器测试表、已知阻塞问题与升级负责人一起保留。下方仍保存原始 2025 阅读目录作为历史背景，现行修订在相关判断旁链接官方依据；旧论坛意见不代表今天的维护状态。

#### **参考文献**

1. WXT：下一代 Web 扩展框架，2025年9月3日访问，[https://wxt.dev/](https://wxt.dev/)
2. WXT：下一代 Web 扩展框架 - Hacker News，2025年9月3日访问，[https://news.ycombinator.com/item?id=42347638](https://news.ycombinator.com/item?id=42347638)
3. Plasmo 框架 – Plasmo，2025年9月3日访问，[https://docs.plasmo.com/framework](https://docs.plasmo.com/framework)
4. PlasmoHQ/plasmo：浏览器扩展框架 - GitHub，2025年9月3日访问，[https://github.com/PlasmoHQ/plasmo](https://github.com/PlasmoHQ/plasmo)
5. 我写了 WXT，一个用于构建 Web 扩展的相对较新的框架。AMA！- Reddit，2025年9月3日访问，[https://www.reddit.com/r/chrome_extensions/comments/1fs9om2/i_wrote_wxt_a_relatively_new_framework_for/](https://www.reddit.com/r/chrome_extensions/comments/1fs9om2/i_wrote_wxt_a_relatively_new_framework_for/)
6. 比较扩展开发的框架：WXT vs Plasmo vs CRXJS - Reddit，2025年9月3日访问，[https://www.reddit.com/r/chrome_extensions/comments/1k1c8gv/comparing_frameworks_for_extension_development/](https://www.reddit.com/r/chrome_extensions/comments/1k1c8gv/comparing_frameworks_for_extension_development/)
7. crxjs/vite-plugin - NPM，2025年9月3日访问，[https://www.npmjs.com/package/@crxjs/vite-plugin](https://www.npmjs.com/package/@crxjs/vite-plugin)
8. 比较 - WXT，2025年9月3日访问，[https://wxt.dev/guide/resources/compare](https://wxt.dev/guide/resources/compare)
9. 构建跨浏览器扩展 - MDN - Mozilla，2025年9月3日访问，[https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Build_a_cross_browser_extension](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Build_a_cross_browser_extension)
10. 使用 SolidJS + WXT II 构建浏览器扩展 | Michael Essiet - Medium，2025年9月3日访问，[https://devshogun.medium.com/creating-a-browser-extension-using-solidjs-wxt-ii-2ff10fcafc98](https://devshogun.medium.com/creating-a-browser-extension-using-solidjs-wxt-ii-2ff10fcafc98)
11. 使用 WXT 构建 AI 驱动的浏览器扩展 - Marmelab，2025年9月3日访问，[https://marmelab.com/blog/2025/04/15/browser-extension-form-ai-wxt.html](https://marmelab.com/blog/2025/04/15/browser-extension-form-ai-wxt.html)
12. 最佳浏览器扩展框架：选择正确的 - iotric，2025年9月3日访问，[https://www.iotric.com/blog/best-browser-extension-framework/](https://www.iotric.com/blog/best-browser-extension-framework/)
13. Chrome 扩展与 React，Vite（无 CrxJS 插件）| Medium - Ajay n Jain，2025年9月3日访问，[https://ajaynjain.medium.com/how-i-built-a-chrome-extension-with-react-and-vite-without-crxjs-plugin-b607194c4f5e](https://ajaynjain.medium.com/how-i-built-a-chrome-extension-with-react-and-vite-without-crxjs-plugin-b607194c4f5e)
14. 更多关于 @crxjs/vite-plugin - Honwhy Blog，2025年9月3日访问，[https://honwhy.wang/blog/java/more-on-crxyjs-vite-plugin/](https://honwhy.wang/blog/java/more-on-crxyjs-vite-plugin/)
15. 超越 Popup：使用 CRXJS 制作下一代 Chrome 扩展 - zerodays，2025年9月3日访问，[https://www.zerodays.dev/sl/blog/beyond-the-popup-crafting-next-level-chrome-extensions-with-crxjs](https://www.zerodays.dev/sl/blog/beyond-the-popup-crafting-next-level-chrome-extensions-with-crxjs)
16. 你将需要的 3 个 Chrome 扩展框架 - Ful.io，2025年9月3日访问，[https://ful.io/blog/the-3-chrome-extension-framework-youll-ever-need](https://ful.io/blog/the-3-chrome-extension-framework-youll-ever-need)
17. Plasmo - 浏览器扩展框架 : r/chrome_extensions - Reddit，2025年9月3日访问，[https://www.reddit.com/r/chrome_extensions/comments/14346cu/plasmo_the_browser_extension_framework/](https://www.reddit.com/r/chrome_extensions/comments/14346cu/plasmo_the_browser_extension_framework/)
18. Plasmo：增强您的浏览器扩展开发，2025年9月3日访问，[https://www.plasmo.com/](https://www.plasmo.com/)
19. Plasmo 简介 – Plasmo，2025年9月3日访问，[https://docs.plasmo.com/](https://docs.plasmo.com/)
20. Plasmo - GitHub，2025年9月3日访问，[https://github.com/plasmohq](https://github.com/plasmohq)
21. 欢迎来到 WXT – WXT，2025年9月3日访问，[https://wxt.dev/guide/introduction](https://wxt.dev/guide/introduction)
22. wxt-dev/wxt：下一代 Web 扩展框架 - GitHub，2025年9月3日访问，[https://github.com/wxt-dev/wxt](https://github.com/wxt-dev/wxt)
23. 前端框架 - WXT，2025年9月3日访问，[https://wxt.dev/guide/essentials/frontend-frameworks](https://wxt.dev/guide/essentials/frontend-frameworks)
24. 使用 WXT 库开发 Web 扩展 - LogRocket Blog，2025年9月3日访问，[https://blog.logrocket.com/developing-web-extensions-wxt-library/](https://blog.logrocket.com/developing-web-extensions-wxt-library/)
25. 开发浏览器扩展的框架 - Chuniversiteit.nl，2025年9月3日访问，[https://chuniversiteit.nl/programming/developing-chrome-extensions](https://chuniversiteit.nl/programming/developing-chrome-extensions)
26. 创建项目 | CRXJS Vite 插件，2025年9月3日访问，[https://crxjs.dev/vite-plugin/getting-started/vanilla-js/create-project](https://crxjs.dev/vite-plugin/getting-started/vanilla-js/create-project)
27. 版本 · crxjs/chrome-extension-tools - GitHub，2025年9月3日访问，[https://github.com/crxjs/chrome-extension-tools/releases](https://github.com/crxjs/chrome-extension-tools/releases)
28. crxjs - GitHub，2025年9月3日访问，[https://github.com/crxjs](https://github.com/crxjs)
29. crxjs chrome-extension-tools · 讨论 - GitHub，2025年9月3日访问，[https://github.com/crxjs/chrome-extension-tools/discussions](https://github.com/crxjs/chrome-extension-tools/discussions)
30. Parcel vs Vite：选择正确的前端构建工具 | Better Stack 社区，2025年9月3日访问，[https://betterstack.com/community/guides/scaling-nodejs/parcel-vs-vite/](https://betterstack.com/community/guides/scaling-nodejs/parcel-vs-vite/)
31. Vite vs. Webpack：正面比较 - Kinsta®，2025年9月3日访问，[https://kinsta.com/blog/vite-vs-webpack/](https://kinsta.com/blog/vite-vs-webpack/)
32. 为什么是 Vite，2025年9月3日访问，[https://vite.dev/guide/why](https://vite.dev/guide/why)
33. 为什么我从 Parcel 切换到 Vite ？- Anoop Jadhav | 博客，2025年9月3日访问，[https://blog.anoopjadhav.in/why-i-switched-from-parcel-to-vite](https://blog.anoopjadhav.in/why-i-switched-from-parcel-to-vite)
34. 为什么您的浏览器扩展比应有的慢（以及 Svelte 如何修复它），2025年9月3日访问，[https://hexshift.medium.com/why-your-browser-extension-is-slower-than-it-should-be-and-how-svelte-fixes-it-15a71063d7f0](https://hexshift.medium.com/why-your-browser-extension-is-slower-than-it-should-be-and-how-svelte-fixes-it-15a71063d7f0)
35. 扩展对浏览器性能的影响：对 Google Chrome 的实证研究，2025年9月3日访问，[https://arxiv.org/html/2404.06827v1](https://arxiv.org/html/2404.06827v1)
36. 创建生产构建 - Plasmo 文档，2025年9月3日访问，[https://docs.plasmo.com/framework/workflows/build](https://docs.plasmo.com/framework/workflows/build)
37. 掌握包大小：检查和缩小 Web 应用的主块 | by Bachri，2025年9月3日访问，[https://javascript.plainenglish.io/inspect-and-reduce-your-web-apps-main-bundle-bd3fce587aa7](https://javascript.plainenglish.io/inspect-and-reduce-your-web-apps-main-bundle-bd3fce587aa7)
38. 优化 JavaScript 包大小的 8 种方法 - Codecov，2025年9月3日访问，[https://about.codecov.io/blog/8-ways-to-optimize-your-javascript-bundle-size/](https://about.codecov.io/blog/8-ways-to-optimize-your-javascript-bundle-size/)
