---
title: '2025年浏览器扩展框架现状：Plasmo、WXT 和 CRXJS 的对比分析'
pubDate: 2025-09-03T08:44:51.236Z
description: '2025年的浏览器扩展开发生态呈现出日益复杂的特征，这种复杂性主要源于向 Manifest V3 (MV3) 的强制过渡以及跨浏览器API持续存在的不一致性。在这种充满挑战的环境中，一个明确的市场领导者已经出现。通过对可用框架、其功能集、开发者体验和生态健康的分析，**WXT** 已经确立了自己作为现代浏览器扩展开发的 definitive 领先框架的地位。这一领先地位建立在卓越的开发者体验、强大而灵活的功能集、框架无关的架构提供广泛兼容性，以及最关键的、积极可靠的开源维护记录之上。'
author: 'Remy'
tags: ['browser-extension', 'frontend-development', 'WXT']
lang: 'zh'
translatedFrom: 'the-2025-state-of-browser-extension-frameworks-a-comparative-analysis-of-plasmo-wxt-and-crxjs'
---

# **2025年浏览器扩展框架现状：Plasmo、WXT 和 CRXJS 的对比分析**

## **第1部分：执行摘要**

### **1.1. 当前市场领导者**

2025年的浏览器扩展开发生态呈现出日益复杂的特征，这种复杂性主要源于向 Manifest V3 (MV3) 的强制过渡以及跨浏览器API持续存在的不一致性。在这种充满挑战的环境中，一个明确的市场领导者已经出现。通过对可用框架、其功能集、开发者体验和生态健康的分析，**WXT** 已经确立了自己作为现代浏览器扩展开发的 definitive 领先框架的地位。这一领先地位建立在卓越的开发者体验、强大而灵活的功能集、框架无关的架构提供广泛兼容性，以及最关键的、积极可靠的开源维护记录之上。

### **1.2. 竞争者概览**

市场主要由三个关键参与者定义，每个都有独特的理念和权衡：

* **WXT：** 本报告建议将 WXT 用于绝大多数新的浏览器扩展项目。它在强大功能、架构灵活性和长期项目稳定性之间提供了最有效的平衡。其活跃社区和在大型生产扩展中的成功采用进一步巩固了其作为最审慎和最具生产力选择的地位。
* **Plasmo：** 一个强大的、高度规范化的框架，为 React 专家团队提供了出色的初始开发者体验。其 "扩展的 Next.js" 理念提供了精简的、声明式的工作流程。然而，其长期可行性受到关于其维护状态和依赖较慢的 Parcel 构建器的广泛社区担忧的严重损害，后者已在现代工具生态系统中落后。
* **CRXJS：** 一个轻量级且功能强大的 Vite 插件，而非完整的框架。它在为内容脚本提供最佳热模块替换 (HMR) 的构建过程方面表现出色。CRXJS 是需要最大控制权并希望避免完整框架抽象的高度经验团队的理想选择。然而，随着像 WXT 这样的完整框架采用相同的底层 Vite 技术同时提供更完整的开箱即用解决方案，其价值主张正在收窄。

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

手动管理这些差异需要大量的条件代码、polyfill 和特定于浏览器的构建配置。现代扩展框架的一个主要功能是抽象这种复杂性，提供单一的、统一 API，允许开发者"一次编写，随处部署"。

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

一个关键且差异化的架构决策是 Plasmo 使用 **Parcel** 构建器。虽然 Parcel 以其零配置方法而闻名，但这个选择与竞争对手 WXT 和 CRXJS 形成对比，后者已标准化在更现代和更高性能的 Vite 工具链上。正如将讨论的，对 Parcel 的依赖已成为技术债务的重要来源，并成为开发者社区关注的问题。

### **3.2. 开发者体验 (DX)：规范化和精简**

Plasmo 明确专为 React 和 TypeScript 开发者设计，开箱即提供一流的支持。开发工作流通过简单的脚手架命令启动，`pnpm create plasmo`，可以通过标志来包含像 TailwindCSS 或 Supabase 这样的集成。

开发服务器提供实时重新加载以在代码更改时自动刷新扩展。然而，其开发者体验的一个关键限制是，其更高级的热模块替换 (HMR) 功能（允许有状态更新而不完全重新加载）几乎专门为 React 优化。使用框架可选的 Vue 或 Svelte 支持的团队不会体验到相同水平的开发速度，因为更改通常会触发完整的扩展重新加载。

### **3.3. 核心功能和抽象**

Plasmo 的"电池式"特性体现在其丰富的内置功能和为简化常见扩展开发任务而设计的高级抽象中。

* **API 包装器：** 该框架包含自己的核心扩展功能的高级 API。Storage API 提供了一个简化的数据持久化接口，Messaging API 抽象了底层 chrome.runtime.sendMessage 系统的复杂性，使 background、popup 和 content scripts 之间的通信更加直接。
* **Content Scripts UI (CSUI)：** 这是 Plasmo 最引人注目的功能之一。它提供了一种流线型方式，通过 content script 直接在网页上呈现复杂的 UI 组件，例如用 React 构建的组件。至关重要的是，Plasmo 可以自动将这些 UI 包装在 Shadow DOM 中，这会将扩展的 CSS 与宿主页面的样式隔离，防止冲突——这是一个常见且难以手动解决的问题。
* **部署和发布：** Plasmo 生态系统超越了核心框架，扩展到包括整个扩展生命周期的工具。开源的 Browser Platform Publisher (BPP) 是一个 GitHub Action，可自动将扩展部署到 Chrome、Firefox 和 Edge 网络商店。此外，Plasmo 提供了一种名为 Itero TestBed 的商业 SaaS 产品，为测试扩展提供暂存环境，并在不经过官方商店审核流程的情况下向 beta 测试者推送更新。

### **3.4. 生态和可行性：警示故事**

尽管其令人印象深刻的功能集和在 GitHub 上的大量星标 (12.3k)，Plasmo 框架的长期可行性是一个重大担忧。有越来越多的来自开发者社区的证据表明，该项目没有以生产关键工具所需的水平进行主动维护。

WXT 的官方比较文档明确指出，Plasmo "似乎处于维护模式，几乎没有维护者或功能开发发生"。这一断言得到了 Reddit 等平台上开发者关于 Plasmo 的讨论支持。一个用户强烈建议不要采用该框架，说"任何考虑使用 Plasmo 的人都不要这样做。他们在 parcel 方面落后主要版本，看代码的状态，这也不是一个容易的迁移。"这种依赖滞后有具体后果，例如无法使用像 TailwindCSS v4 这样的现代工具。

像 Itero TestBed 这样的服务的付费商业层的存在进一步使情况复杂化，引发了关于项目在开源框架和商业产品之间资源分配的问题。虽然高星标数量表明过去的受欢迎程度，但社区的定性反馈指向一个努力跟上快速发展的 Web 生态系统的项目。

这种情况呈现了一个经典的"好主意，冒险执行"困境。Plasmo 的概念模型，其声明式架构和强大的抽象，几乎是现代扩展开发的理想选择。然而，框架的价值与其持续维护密不可分。为新项目采用 Plasmo 意味着接受框架不会收到及时更新以支持未来浏览器 API 更改、解决安全漏洞或维护与更广泛的 JavaScript 工具链兼容性的实质风险。对于大多数专业和企业团队来说，这种风险水平可能会超过其功能集的好处。

## **第4部分：深入分析：WXT 框架**

WXT 将自己呈现为"下一代 Web 扩展框架"，从 Nuxt.js 的以开发者为中心的哲学中汲取大量灵感。其设计基于两个主要目标：提供一流的开发者体验 (DX) 并为所有主要浏览器提供一流的、统一的支持。它迅速获得吸引力，现在被广泛认为是构建稳健、跨浏览器扩展的首选。

### **4.1. 架构深入探讨：受 Nuxt 启发且框架无关**

WXT 最重要的架构优势是它的 **前端框架无关性**。与 Plasmo 的 React 中心方法不同，WXT 旨在与任何具有 Vite 插件的现代 UI 框架一起工作。它为最流行的选择——React、Vue、Svelte 和 SolidJS——提供了预配置的官方模块，但不排除使用其他框架。这种灵活性使 WXT 成为异常通用和面向未来的选择，因为它不会将开发团队锁定在特定的 UI 技术上。

在其核心，WXT 构建在 **Vite** 之上，这是现代前端构建工具。这一基础选择为 WXT 提供了显著的性能优势，包括利用原生 ES 模块的热模块替换 (HMR) 的极快开发服务器，以及由 Rollup 提供支持的高度优化的生产构建。与现代 Vite 生态系统的这种对齐是其卓越性能和开发者体验的关键因素。

### **4.2. 开发者体验 (DX)：一流的工具**

WXT 经过精心设计，通过一套强大的 DX 功能来最小化开发者摩擦并减少样板代码。

* **基于文件的入口点：** 与 Plasmo 类似，WXT 采用基于文件的系统，其中 manifest.json 根据入口点目录中存在的文件自动生成。然而，WXT 通过允许在入口点文件内直接内联配置选项来增强此模式，在清单生成上提供更大程度的细粒度控制。
* **自动导入：** 受 Nuxt 启发的突出功能，WXT 提供组件、钩子和实用函数的自动、按需导入。这消除了数十个手动导入语句的需要，导致更简洁、更简洁的代码，并显著提高开发人员生产力。
* **开发模式：** 该框架的开发模式因其速度而广受赞誉，为 UI 开发提供"闪电般快速的 HMR"以及内容/background 脚本的快速重新加载。用户证词确认了总体积极的体验， websocket 连接的热重载偶尔可能不稳定这一警告除外。
* **CLI：** 项目脚手架由交互式命令行界面处理，通过 `npx wxt@latest init` 调用。该工具指导开发者选择项目名称、UI 框架模板（包括 vanilla TypeScript）和其他初始设置选项，使新项目能够在几秒钟内启动。

### **4.3. 核心功能和抽象**

WXT 提供了一套全面的功能，解决了跨浏览器扩展开发的主要痛点。

* **统一的浏览器 API：** WXT 暴露了一个全局浏览器对象，作为底层 WebExtensions API 的一致、基于 Promise 的包装器。这个抽象层自动处理 Chrome 的 chrome.* 命名空间和 Firefox 的 browser.* 命名空间之间的差异，允许开发者编写一个单一的、干净的代码库，在所有目标浏览器上正确运行。
* **全面的构建和发布：** 该框架为整个部署管道提供了强大的内置工具。它包括为不同浏览器商店生成优化 ZIP 包的命令，包括创建单独的源代码 ZIP 文件，这是提交到 Mozilla Add-ons 商店的要求。此外，WXT 提供了自动化上传和发布扩展过程的实用程序。
* **模块系统：** 对于维护一系列相关扩展的组织，WXT 提供了强大的模块系统。此功能使创建可重用模块成为可能，这些模块可以在多个扩展项目之间共享构建时配置和运行时代码，促进代码重用并简化维护。

### **4.4. 生态和可行性：活跃且蓬勃发展**

WXT 的可行性得到其广泛采用和活跃社区的强烈支持。该框架的官方网站展示了一系列用 WXT 构建的流行、生产就绪的扩展，包括用户群庞大的几个扩展，如"Eye Dropper"（1,000,000+ 用户）和"ChatGPT Writer"（600,000+ 用户）。这作为其稳定性和可扩展性的有力社会证明。

该项目得到积极维护，在 GitHub 上有健康且响应迅速的存在（7.9k 星）以及 Discord 上的活跃社区以提供用户支持。开发者的情绪压倒性积极，有大量公开账户的团队成功从 Plasmo 迁移到 WXT，并报告了性能和开发者体验的"显著改进"。

框架决定是 UI 框架无关的是一个重要的战略优势。它不仅迎合更广泛的开发者受众，而且使使用它构建的项目面向未来。通过将核心扩展逻辑与 UI 渲染层分离，WXT 确保团队可以采用最适合其需求的最佳 UI 技术，而不受框架本身的约束。这种灵活性使 WXT 成为长期项目更具有弹性和战略上合理的选择，因为它可以轻松适应前端生态系统中的未来趋势。

## **第5部分：深入分析：CRXJS Vite 插件**

CRXJS 在扩展开发生态系统中占有独特的位置。理解 CRXJS 与 Plasmo 或 WXT 不属于同一类型的综合一体化框架至关重要。相反，它是一个高度集中的 **Vite 插件**，旨在使用现代 Vite 工具链解决打包浏览器扩展的特定复杂挑战。它的哲学是极简主义和控制，提供基本的构建时功能，同时有意避免应用程序级别的抽象。

### **5.1. 架构深入探讨：一个工具，而非框架**

@crxjs/vite-plugin 的核心目的是弥合 Vite 的开发服务器与浏览器扩展环境的独特要求之间的差距。它提供了零配置设置，允许开发者利用 Vite 及其广泛的插件生态系统进行扩展开发。

与 WXT 和 Plasmo 的基于文件的路由约定不同，CRXJS 坚持更传统的方法，其中 manifest.json 文件作为定义扩展入口点（background scripts、content scripts、popups 等）的唯一真实来源。该插件解析此清单并相应地配置 Vite 的构建过程。这种模式吸引喜欢清单的显式配置而不是完整框架的约定式"魔法"的开发者。

### **5.2. 开发者体验 (DX)：精简且不规范化**

主要的开发者体验功能和 CRXJS 的关键成就是其实现**适用于内容脚本的"真正的热模块替换"**。这是一个重要的区别。虽然其他工具可以重新加载 popup 或选项页面的 UI，但 CRXJS 能够将更新后的代码注入到实时网页上的 content script 中，而不需要完整的页面刷新，保留页面和扩展的状态。这为严重依赖 content script 功能的扩展提供了开发反馈循环的巨大加速。一些社区成员指出，这种级别的 HMR for content scripts 在其他框架中效果不佳，使 CRXJS 成为这个特定用例的优越选择。

设置过程精简且直接：开发者初始化一个标准的 Vite 项目，安装 @crxjs/vite-plugin 包，并将其添加到 vite.config.js 文件中，指向项目的 manifest.json。这种极简主义方法赋予开发者最大控制权，因为他们可以自由组织应用程序并为存储和消息传递等任务选择自己的库，而不受框架约定的约束。

### **5.3. 核心功能**

CRXJS 专注于一组狭窄但关键的责任：

* **Vite 集成和 HMR：** 它的主要功能是使用 Vite 正确捆绑所有扩展组件，并管理扩展页面（popups、options）和 content scripts 的 HMR 连接。
* **Web 可访问资源：** 它自动化了在清单的 web_accessible_resources 字段中声明资产的过程。这是开发者手动错误的常见来源，插件根据代码中静态资产导入自动管理这些条目的能力是一个显著的生活质量改进。

值得注意的是 CRXJS 不提供什么。没有为浏览器的 Storage、Messaging 或 Internationalization (i18n) API 提供内置包装器或抽象。使用 CRXJS 的开发者预计将直接与原生的 chrome.* 或 browser.* API 交互，或为这些目的选择和集成自己的第三方库。

### **5.4. 生态和可行性：担忧的迹象**

该项目的历史和维护状态一直是社区关注的问题。Vite 插件在正式版本 2.0 发布之前保持了三年多的测试版状态。在此延长的测试版期间，有关于项目无人维护或可能被存档的讨论，这可能影响了其采用。

虽然一个新的、活跃的维护者团队最近接管了该项目并推动了正式的 2.0 版本发布，但这种不稳定的历史可能让潜在 adoption 者 pause，特别是对于长期企业项目。它的用户群，如其在 GitHub 上的 3.5k 星所示，比其完整框架竞争对手更小、更小众。

像 CRXJS 这样的仅构建工具解决方案的利基似乎正在缩小。其主要价值主张——基于 Vite 的高性能构建过程和出色的 HMR——现在也是像 WXT 这样的完整框架的核心功能。选择 WXT 的团队获得了 Vite 工具链的好处 plus 为存储、消息传递和跨浏览器兼容性提供的一套丰富的、有价值的、预构建的运行时抽象。选择 CRXJS 的团队需要自己构建或获取这些抽象，有效重新实现完整框架已经提供的一部分功能。因此，CRXJS 的理想用户是需要其卓越 content script HMR 的非常特定需求的开发者或团队，或者强烈偏好最小抽象并愿意手动管理所有应用程序级别问题的团队。

## **第6部分：比较框架分析：正面评估**

WXT、Plasmo 和 CRXJS 的直接、功能对功能比较揭示了关于完整性、开发者体验和项目健康的清晰层次。虽然每个工具都有其优势，但 WXT 始终提供最全面且支持最好的功能集，使其成为广泛项目的最稳健选择。

### **6.1. 详细功能矩阵**

下表提供了三个领先框架在几个关键类别中的详细比较。数据综合自官方文档、社区讨论以及框架作者本身提供的直接功能比较。

| 功能类别 | 功能 | WXT | Plasmo | CRXJS |
| :---- | :---- | :---- | :---- | :---- |
| **项目健康** | **主动维护** | ✅ | 🟡¹ | 🟡² |
|  | **GitHub 星标** | 7.9k | 12.3k | 3.5k |
| **开发者体验** | **一流 TypeScript** | ✅ | ✅ | ✅ |
|  | **入口点发现** | ✅ (基于文件) | ✅ (基于文件) | ❌³ |
|  | **内联入口点配置** | ✅ | ✅ | ❌ |
|  | **自动导入** | ✅ | ❌ | ❌ |
|  | **可重用模块系统** | ✅ | ❌ | ❌ |
|  | **支持所有 UI 框架** | ✅ | 🟡⁴ | ✅ |
| **构建工具** | **底层构建器** | Vite | Parcel | Vite |
|  | **创建扩展 ZIP** | ✅ | ✅ | ❌ |
|  | **创建 Firefox 源码 ZIP** | ✅ | ❌ | ❌ |
|  | **自动化发布** | ✅ | ✅ | ❌ |
|  | **远程代码打包** | ✅ | ✅ | ❌ |
| **开发模式功能** | **.env 文件支持** | ✅ | ✅ | ✅ |
|  | **UI 的 HMR** | ✅ | 🟡⁵ | ✅ |
|  | **Content Scripts 的 HMR** | 🟡⁶ | 🟡⁶ | ✅ |
|  | **更改时重新加载 Background** | 🟡⁶ | 🟡⁶ | 🟡⁶ |
| **API 包装器** | **Storage API** | ✅ | ✅ | ❌⁷ |
|  | **Messaging API** | ❌⁷ | ✅ | ❌⁷ |
|  | **Content Script UI** | ✅ | ✅ | ❌⁷ |
|  | **国际化 (i18n)** | ✅ | ❌ | ❌ |
| **浏览器/清单** | **支持所有浏览器** | ✅ | ✅ | ✅ |
|  | **MV2 支持** | ✅ | ✅ | 🟡⁸ |
|  | **MV3 支持** | ✅ | ✅ | 🟡⁸ |

表格脚注：
¹ 似乎处于维护模式，担忧依赖项过时。
² 虽然历史上有无人维护的情况，但新团队最近变得活跃。
³ 入口点在 manifest.json 中专门配置。
⁴ 一流支持针对 React；Vue 和 Svelte 的支持是可选的且优化较少。
⁵ HMR 仅针对 React 优化；其他框架触发完整重新加载。
⁶ 重新加载整个扩展而不是执行真正的热模块替换。
⁷ 不提供内置包装器；开发者必须使用原生浏览器 API 或第三方库。
⁸ 在给定构建中支持 MV2 或 MV3，但不能同时从同一代码库支持。

### **6.2. 关键差异化因素分析**

功能矩阵突出了框架显著分歧的几个关键区域，对开发团队有重要的实际影响。

* **维护和可行性：** 这是最重要的差异化因素。WXT 显示出主动、健康维护和强大社区采用的清晰迹象。与之形成鲜明对比的是，Plasmo 和 CRXJS 都带有重要的红旗。Plasmo 对过时依赖的依赖以及社区对其处于"维护模式"的看法引入了实质性的风险。CRXJS，尽管最近复活，但有不稳定的历史，可能阻止规避风险的团队。对于任何打算长期生产使用的项目，WXT 的稳定性是一个决定性的优势。
* **开发者体验：** WXT 在整体开发者体验方面领先，这归功于其独特的功能组合。其**自动导入**功能是一个在其他工具中找不到的强大生产力提升器。虽然 Plasmo 对 React 开发者的初始设置很顺畅，但其 React 专用 HMR 是一个值得注意的限制。CRXJS 提供了内容脚本的最佳 HMR，但这个单一优势与其缺乏其他 DX 功能（如自动导入或基于文件的入口点）相权衡。
* **抽象级别：** 在这些工具之间的选择也是抽象级别的选择。Plasmo 和 WXT 是提供构建工具和用于存储、消息传递和 UI 注入的高级运行时 API 的完整框架。这种"一体化"方法通过开箱即用地为常见问题提供解决方案来加速开发。另一方面，CRXJS 是一个几乎完全在构建级别运行的工具。它需要"自带抽象"方法，提供最大控制力和灵活性，但代价是增加初始开发努力。由于 WXT 的抽象设计良好且可选，它们为大多数项目提供了比 CRXJS 所需的手动方法更具生产力的起点。

## **第7部分：性能和构建工具深入探讨：Vite vs. Parcel**

底层构建器的选择是一个基础架构决策，深刻影响开发期间的开发者体验和最终扩展的性能。Vite（由 WXT 和 CRXJS 使用）和 Parcel（由 Plasmo 使用）之间的分歧反映了现代 Web 开发生态系统中更广泛的趋势。

### **7.1. 构建器的影响**

构建器的职责包括解析模块导入、转换代码（例如，TypeScript 到 JavaScript，JSX 到 JS）、优化资产以及将一切打包成浏览器可以执行的文件。这个过程的效率直接影响开发者看到更改的速度（开发服务器速度和 HMR）以及最终产品的速度和大小（生产构建性能）。

### **7.2. Vite (WXT, CRXJS)：速度的需求**

Vite 因其优先考虑速度的创新架构而迅速成为现代前端工具的标准。其性能优势源于两个关键设计选择：

* **原生 ESM 开发服务器：** 在开发过程中，Vite 不捆绑应用程序的源代码。相反，它利用浏览器对 ES 模块 (ESM) 的本机支持。当请求文件时，Vite 按需转换并提供它。这种方法导致接近即时的服务器启动时间，与项目大小无关。
* **esbuild 用于预捆绑：** Vite 使用 esbuild（用 Go 编写的构建器）从 node_modules 预捆绑第三方依赖。由于 esbuild 比基于 JavaScript 的构建器快 10-100 倍，这个初始依赖捆绑步骤非常快。
* **用于生产的 Rollup：** 对于生产构建，Vite 使用 Rollup，以其高度优化的输出和出色的摇树功能而闻名，产生更小、更高效的包。

这些技术的组合提供了 WXT 和 CRXJS 用户经常称赞的快速且响应迅速的开发者体验。这种选择将这些框架与 Web 开发生态系统的前沿保持一致。

### **7.3. Parcel (Plasmo)：简单性的代价**

Parcel 的主要设计目标是通过零配置体验实现简单性。它是一个能够自动处理各种资产的 capable 构建器。然而，社区反馈和开发者证词表明，这种简单性可能以性能为代价，特别是随着项目复杂性的增长。

从 Plasmo 迁移到 WXT 的开发者报告了"显著改进"和"更快的构建和开发启动时间"。其他人注意到，在 monorepos 或更大项目的背景下，Parcel 的缓存和 HMR 可能"较差"且"更慢"。此外，Plasmo 据说在 parcel 方面"落后主要版本"这一事实是一个重要的红旗。它表明项目正在积累技术债务，并且无法利用其自身核心依赖的最新性能改进和功能。这使得构建工具的选择成为框架整体健康和现代性的有力代理。WXT 和 CRXJS 构建在现代、高性能的基础上，而 Plasmo 的基础显示出老化迹象。

### **7.4. 包大小和运行时性能**

在浏览器扩展的资源受限环境中，包大小的每一 KB 和执行时间的每一毫秒都很重要。大型扩展可能导致浏览器滞后、增加内存消耗并导致糟糕的用户体验。

依赖像 React 这样的大型 UI 库的框架可能引入显著的负载，特别是对于像 popup 这样的简单 UI。对于性能关键的界面，像 Svelte 这样的框架可能是更好的选择，它在构建时将组件编译为最小的 vanilla JavaScript，没有运行时库。WXT 的框架无关性在这里是一个明显的优势，因为它允许开发者为扩展的性能敏感部分选择 Svelte 或其他轻量级库。

框架还提供用于性能分析和优化的工具。例如，Plasmo 提供了 `--bundle-buddy` 标志来生成包组成的可视化报告，以及 `--hoist` 标志来优化依赖捆绑，可以显著提高速度并减小大小。开发者必须利用这些工具并采用标准 Web 性能技术，如代码分割、摇树和懒加载，以确保其扩展保持精简和响应。

## **第8部分：战略框架选择：项目原型建议**

最优框架选择不是绝对的，而是取决于项目的具体背景和约束。必须考虑团队专业知识、项目规模、战略优先权和目标平台。本节提供战略决策矩阵和详细的场景分析，以指导技术领导者为其需求选择最合适的框架。

### **8.1. 框架决策矩阵**

下表将常见项目需求映射到每个框架的适用性，将前面的技术分析转化为可操作的战略指导。

| 项目需求 | WXT | Plasmo | CRXJS |
| :---- | :---- | :---- | :---- |
| **团队专业知识** |  |  |  |
| React 重度团队 | **优秀** | **好** (DX) / **差** (风险) | **可行** |
| Vue/Svelte/SolidJS 团队 | **优秀** | **差** | **可行** |
| 多语言 / 代理机构团队 | **优秀** | **差** | **好** |
| **项目规模** |  |  |  |
| 小型原型 / MVP | **优秀** | **好** | **好** |
| 中型产品 | **优秀** | **差** (风险) | **可行** |
| 企业套件 | **优秀** | **差** (风险) | **差** (风险) |
| **战略优先权** |  |  |  |
| 最短上市时间 | **优秀** | **好** | **好** |
| 长期可维护性 | **优秀** | **差** | **差** |
| 最大控制 / 极简主义 | **好** | **差** | **优秀** |
| **目标平台** |  |  |  |
| 仅 Chrome | **优秀** | **好** | **优秀** |
| 所有主要浏览器 | **优秀** | **好** | **好** |

### **8.2. 详细场景分析**

决策矩阵可以通过检查几种常见的项目原型来进一步阐明。

* **场景 A：企业 React 团队**
  * **背景：** 一个拥有深厚内部 React 专业知识的组织，负责构建复杂的、任务关键的浏览器扩展，该扩展将得到多年支持。稳定性、安全性和长期可维护性是最高优先权。
  * **分析：** 初看，Plasmo 的 React 优先开发者体验和类似 Next.js 的模式似乎非常有吸引力。然而，关于其维护状态和过时依赖的重大且可信的社区担忧为长期企业产品引入了不可接受的风险。框架可能变得无人维护或关键浏览器更新或安全补丁落后的可能性是 deal-breaker。
  * **建议：WXT。** WXT 的主动维护、在大规模应用中的已证明稳定性以及通过 @wxt-dev/module-react 包对 React 的出色一流支持使其成为最审慎和专业的选择。它为 React 团队提供了可比的开发者体验，而没有相关的维护风险。

* **场景 B：精益创业 / 独立开发者**
  * **背景：** 一个小型、敏捷的团队或独立开发者正在构建最小可行产品 (MVP)。主要目标是验证想法并尽快运送功能产品。
  * **分析：** 所有三个工具都提供快速的初始设置。对于熟悉 Vite 的开发者，CRXJS 非常快速。然而，"快速开始"与"快速完成"不同。WXT 为跨浏览器存储和消息传递等常见任务提供丰富的内置抽象，最终将通过减少需要从头编写的样板代码量来更显著地加速开发。
  * **建议：WXT。** 其快速脚手架过程、强大的 DX 功能（如自动导入）以及现成的常见扩展问题解决方案的组合使其成为从想法到功能完整的 MVP 的最快路径。

* **场景 C：多框架代理机构**
  * **背景：** 为各种客户构建浏览器扩展的数字代理机构或咨询公司。这些客户可能有现有技术栈和不同 UI 框架的偏好，例如 React、Vue 或 Svelte。
  * **分析：** 这个场景完美地凸显了 WXT 架构的战略优势。其框架无关性是此用例的 killer feature。代理机构可以将其核心扩展开发和构建过程标准化为 WXT，创建跨所有项目一致、高效的工作流程。这使他们能够积累机构知识和可重用代码（可能使用 WXT 的模块系统），同时保留使用每个客户端所需的特定 UI 框架的灵活性。
  * **建议：WXT。** 没有其他框架提供这种级别的灵活性。采用 WXT 允许代理机构在不维护每个 UI 框架的单独、专业工具链的情况下服务更广泛的市场。

* **场景 D：性能纯粹主义者 / 工具专家**
  * **背景：** 构建高性能、轻量级扩展的开发者，其中包大小的每一 KB 和延迟的每一毫秒都至关重要。这位开发者是工具专家，更喜欢对每个依赖和构建步骤拥有完全的、细粒度的控制，并警惕框架的"魔法"。
  * **分析：** 对于这个特定且高级的用例，CRXJS 中缺乏抽象成为一个特性，而非缺陷。开发者可以利用强大的 Vite 构建过程和其最佳的内容脚本 HMR，而不继承任何运行时抽象或完整框架的约定。这使他们能够精选每个库，并为存储、消息传递和状态管理编写自己的最小、高度优化的代码。
  * **建议：CRXJS。** 虽然这代表了一个利基，但这是 CRXJS 真正擅长的场景。它提供了现代开发工作流所需的基本构建时工具，同时赋予专家开发者他们所需的完全控制。

## **第9部分：结论和未来展望**

### **9.1. 最终裁决**

本报告进行的分析得出一个清晰且自信的结论：**WXT 是 2025 年几乎所有新浏览器扩展项目的优越选择。** 它成功综合了当前工具领域的最佳方面，结合了现代、高性能的 Vite 架构与一流的开发体验，事实证明可以加速开发。最重要的是，它得到了活跃、健康的开源社区的支持，提供了对持续维护和长期稳定性的保证，这对专业软件开发至关重要。

虽然 Plasmo 为 React 开发者提供了引人注目的愿景和精致的体验，但与其维护状态相关的重大风险使其成为难以推荐的选择。CRXJS 对于需要最小抽象的专家特定利基仍然是一个优秀的工具，但其价值主张正越来越多地被像 WXT 这样更完整的框架吸收，这些框架提供相同的构建时优势以及有价值的运行时功能。

### **9.2. 生态系统的未来**

浏览器扩展框架空间似乎正处于整合状态，从快速实验时期走向围绕几个 dominant players 的成熟期。Plasmo 和 CRXJS 明显面临的技术债务和维护挑战凸显了在快速移动的生态系统中维持复杂开源工具的巨大困难。WXT 的成功证明，成功的框架不仅要技术架构出色，还要社区治理出色。

对于技术决策者，关键要点是开源框架的评估现在必须超越简单的功能矩阵。对项目维护速度、社区参与和依赖新鲜度的彻底评估已成为尽职调查过程中不可或缺的部分。在当前格局中，社区健康是项目长期成功和可行性的最可靠预测因素。因此，在可预见的未来，WXT 框架的持续演变和治理将是该领域要监控的中心趋势。

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
