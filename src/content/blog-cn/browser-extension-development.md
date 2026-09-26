---
title: '浏览器扩展开发指南'
pubDate: 2024-03-11T00:00:00.000Z
description: '本文将介绍如何使用现代工具开发浏览器扩展，包括WXT工具链的使用方法和开发流程。'
author: 'Remy'
tags: ['browser-extension', '前端开发', 'wxt', '教程']
---

## 浏览器扩展是什么

浏览器扩展是安装在浏览器里的软件，用来增加功能或改变网页的呈现方式。密码管理器、网页翻译和稍后阅读工具都属于常见例子。普通网站主要处理自己的页面；扩展可以在用户授权范围内调用浏览器 API，也可以通过内容脚本处理匹配的网站。获得权限不代表应该收集数据，功能需要、访问范围和数据去向仍需分别说明。

如果只是寻找现成扩展，可以从浏览器商店安装，检查发布者、权限和隐私说明，不需要安装开发环境。如果准备自己开发，下面使用 [WXT](https://wxt.dev/guide/installation) 完成一个小扩展。WXT 负责发现入口、生成 manifest 和组织构建；浏览器负责授权、运行脚本和管理后台生命周期，两者不能互相替代。

## 示例范围与版本

我们制作一个只对 `https://example.com/*` 生效的链接高亮扩展。工具栏 popup 保存开关；刷新目标网页后，content script 向 background 请求设置，再决定是否添加样式。关闭开关后也要刷新网页。本例不监听所有标签页，不发送网络请求，不处理账号或密钥，也不承诺保存后立即更新已经打开的页面。

2026-09-25 UTC 复核使用 **WXT 0.21.4**，固定 Vite **6.3.6**、TypeScript **5.9.3**。WXT 的发布包要求 Node **>=22**；还要检查所选 Vite 的 Node 要求，不能只满足其中一个包。本次验证环境为 Windows、Node **26.7.0**、pnpm **10.28.2**。这是可复现的版本记录，不是建议所有项目使用同一 Node 主版本。[升级说明](https://wxt.dev/guide/resources/upgrading)明确区分了这些依赖要求。

WXT 0.21 将 Vite 改成必需的 peer dependency，因此下面直接声明它。TypeScript 用于独立类型检查；`web-ext` 是自动打开浏览器的可选依赖，本例没有安装，后面采用手动加载。不要把没有自动弹出浏览器误判为构建失败，也不要把终端显示构建完成当成扩展已经执行。

在仓库以外创建空目录，按后面的路径分别创建文件。这里不运行 `@latest init`，避免模板和依赖范围在读者复现时发生变化。首次安装会生成 `pnpm-lock.yaml`，需要复现实验时保留该文件；只固定直接依赖还不能锁定所有传递依赖。

```text
link-marker/
  package.json
  tsconfig.json
  wxt.config.ts
  entrypoints/
    background.ts
    content.ts
    popup/
      index.html
      main.ts
```

### package.json

这是完整文件。`build:chrome` 等名称由我们在 scripts 中定义，并非 WXT 自动提供的 pnpm 命令。`private` 防止误发布 npm 包，不影响生成浏览器扩展。目录里还没有依赖时，先完成所有文件，再安装和检查。

```json
{
  "name": "link-marker",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@10.28.2",
  "scripts": {
    "dev": "wxt",
    "typecheck": "wxt prepare && tsc --noEmit",
    "build": "wxt build -b chrome",
    "build:chrome": "wxt build -b chrome",
    "build:firefox": "wxt build -b firefox",
    "build:safari": "wxt build -b safari"
  },
  "devDependencies": {
    "typescript": "5.9.3",
    "vite": "6.3.6",
    "wxt": "0.21.4"
  }
}
```

### tsconfig.json

WXT 的 prepare 命令生成 `.wxt/tsconfig.json` 和导入声明，项目配置继承它。不要手写生成目录里的文件，也不要为了解除错误而关闭严格检查。编辑器首次提示找不到继承文件时，先运行后面的 typecheck。

```json
{
  "extends": "./.wxt/tsconfig.json"
}
```

### wxt.config.ts

```typescript
import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'Link Marker',
    description: 'Highlight links on example.com after a page reload.',
    permissions: ['storage'],
  },
  zip: {
    includeSources: [
      'entrypoints/**',
      'package.json',
      'pnpm-lock.yaml',
      'tsconfig.json',
      'wxt.config.ts',
    ],
  },
});
```

这里只声明 `storage` 权限。网站访问范围来自下一节 content script 的 `matches`，不是从配置中消失了。本例没有查询标签页，没有动态注入代码，因此不添加 `tabs`、`activeTab` 或 `scripting`。如果以后增加点击后注入的功能，要重新设计对应权限，而不是把所有示例权限一次性加进清单。

## Popup 与持久化设置

[入口文档](https://wxt.dev/guide/essentials/entrypoints)允许 popup 使用目录入口。HTML 放在 `entrypoints/popup/index.html`，辅助脚本留在同目录下。不要把 `popup.ts` 当成辅助文件直接放到 `entrypoints/` 顶层，那一层用于入口发现。HTML 里的相对路径也必须和实际目录对应。

### entrypoints/popup/index.html

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Link Marker</title>
  </head>
  <body>
    <h1>Link Marker</h1>
    <label>
      <input id="enabled" type="checkbox" disabled />
      Highlight example.com links
    </label>
    <button id="save" type="button" disabled>Save</button>
    <p id="status" role="status">Loading...</p>
    <script type="module" src="./main.ts"></script>
  </body>
</html>
```

### entrypoints/popup/main.ts

```typescript
import { storage } from '#imports';

const checkbox = document.querySelector<HTMLInputElement>('#enabled');
const save = document.querySelector<HTMLButtonElement>('#save');
const status = document.querySelector<HTMLParagraphElement>('#status');
if (!checkbox || !save || !status) {
  throw new Error('Popup markup is incomplete');
}
const ui = { checkbox, save, status };

async function load() {
  try {
    const enabled = await storage.getItem<boolean>('local:enabled', {
      fallback: false,
    });
    ui.checkbox.checked = enabled === true;
    ui.checkbox.disabled = false;
    ui.save.disabled = false;
    ui.status.textContent = 'Ready';
  } catch (error) {
    ui.status.textContent = 'Could not load settings. Reopen the popup.';
    console.error(error);
  }
}

ui.save.addEventListener('click', async () => {
  ui.save.disabled = true;
  ui.checkbox.disabled = true;
  try {
    await storage.setItem('local:enabled', ui.checkbox.checked);
    ui.status.textContent = 'Saved. Reload example.com to apply.';
  } catch (error) {
    ui.status.textContent = 'Save failed. Please try again.';
    console.error(error);
  } finally {
    ui.save.disabled = false;
    ui.checkbox.disabled = false;
  }
});

void load();
```

`#imports` 是 WXT 生成的导入入口；旧文中的 `wxt/storage` 不适用于这条版本基线。`getItem` 的第二个参数是 options 对象，默认值应写成 `{ fallback: false }`，不能直接传 `false`。`local:` 选择扩展本地存储区，后面的 `enabled` 才是键名；它不是网页的 `localStorage`。[Storage 文档](https://wxt.dev/storage)说明了命名空间与默认值的用法。

读取失败时我们保持控件禁用，不让尚未恢复的默认 UI 覆盖已有设置；保存期间也禁用控件，避免连续提交。成功提示只代表写入完成，明确要求刷新页面。泛型提供编译期约束，不验证旧数据，因此读取后仍以 `enabled === true` 判断；未来若把布尔值改成对象，需要另加结构验证和迁移。

popup 会随窗口关闭而销毁，所以它不能承担持续任务。再次打开时应从 storage 恢复，而不是依赖上次的 JavaScript 变量。这个小例子也没有“清空所有存储”的按钮，排查时只删除相关键，以免影响以后增加的其他设置。

## Background 与内容脚本

消息通信使用浏览器原生的 `runtime.sendMessage` 和 `runtime.onMessage`，不是 WXT 内置 messaging wrapper。[WXT 的消息指南](https://wxt.dev/guide/essentials/messaging)列出原生 API 和可选库。本例只需要一个读设置的请求，不额外引入消息库，也没有添加可接收外部扩展消息的监听器。

### entrypoints/background.ts

```typescript
import { browser, defineBackground, storage } from '#imports';

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
    if (
      sender.id !== browser.runtime.id ||
      typeof message !== 'object' ||
      message === null ||
      !('type' in message) ||
      message.type !== 'GET_ENABLED'
    ) {
      return;
    }

    storage.getItem<boolean>('local:enabled', { fallback: false }).then(
      (enabled) => sendResponse({ ok: true, enabled: enabled === true }),
      () => sendResponse({ ok: false }),
    );
    return true;
  });
});
```

监听器在 `defineBackground` 回调内同步注册。存储读取是异步的，所以监听器直接返回字面值 `true`，保持响应通道，之后调用 `sendResponse`。不要为了代码看起来统一就把整个监听器改成 `async`；不同浏览器和版本对 Promise 返回的支持需要单独核验。这里采用 [MDN 记录的异步回调响应方式](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage)。

background 不保留开关的内存副本，每次请求读取持久化数据。这样设计也适合 Chrome MV3 service worker 可能停止再启动的生命周期。对于小型设置，请求时读取比维持未经验证的缓存简单；若以后读取频繁，再根据实际测量设计缓存和失效策略，不能先宣称某种写法一定更快。

### entrypoints/content.ts

```typescript
import { browser, defineContentScript } from '#imports';

export default defineContentScript({
  matches: ['https://example.com/*'],
  async main(ctx) {
    try {
      const response: unknown = await browser.runtime.sendMessage({
        type: 'GET_ENABLED',
      });
      if (
        typeof response !== 'object' ||
        response === null ||
        !('ok' in response) ||
        response.ok !== true ||
        !('enabled' in response) ||
        typeof response.enabled !== 'boolean'
      ) {
        throw new Error('Invalid settings response');
      }
      if (!response.enabled || ctx.isInvalid) return;

      const style = document.createElement('style');
      style.textContent = `
        html.link-marker-enabled a[href] {
          background-color: #fff19c !important;
          color: #171717 !important;
          outline: 2px solid #8a5700 !important;
        }
      `;
      document.documentElement.append(style);
      document.documentElement.classList.add('link-marker-enabled');
      ctx.onInvalidated(() => {
        style.remove();
        document.documentElement.classList.remove('link-marker-enabled');
      });
    } catch (error) {
      console.error('Link Marker could not read settings:', error);
    }
  },
});
```

运行时 DOM 操作放在 `main` 中，顶层只保留 imports 和入口定义。WXT 构建时会读取入口配置，不能假定那时存在网页 `document`。异步消息返回后再检查 context 是否失效，清理回调则移除本例添加的样式和 class，避免开发重载留下重复效果。它不是浏览器所有关闭情况都会调用的持久化钩子。

样式限定到本例添加的 class，没有逐个覆盖链接原有的 inline style；刷新后也不需要猜测网页原来的颜色。CSS 可以匹配后来出现的链接，但本例并未验证复杂网站、iframe、Shadow DOM 或强制颜色模式。选用简单目标网页是在限制实验变量，并不证明这套选择器适合任意网站。

## 安装、类型检查与构建

在 `link-marker` 目录执行，不能在已有网站项目根目录执行，否则会安装到错误的项目。第一次安装允许生成锁文件；之后在干净副本中使用 `pnpm install --frozen-lockfile` 检查依赖是否能够按锁文件恢复。若包管理器报告被阻止的依赖安装脚本，先确认包名与来源，不要无条件批准所有脚本。

```bash
pnpm install
pnpm typecheck
pnpm build
pnpm build:firefox
pnpm build:safari
```

`typecheck` 先生成 WXT 类型再运行 `tsc --noEmit`；构建负责转换和打包，两者检查的事情不同。例如错误的 storage 参数可能被打包器转换成合法 JavaScript，但仍不符合 API 契约。不要因为 ZIP 出现了就跳过类型检查，也不要在失败后继续读取上一次构建的旧产物。

本例没有覆盖 manifest 版本，按 [WXT 目标规则](https://wxt.dev/guide/essentials/target-different-browsers)，Chrome 默认生成 `.output/chrome-mv3`，Firefox 与 Safari 默认生成 `.output/firefox-mv2`、`.output/safari-mv2`。需要 MV3 时应显式指定目标并重测；目录名不是可以任意替换的标签，同一个源目录也不是全浏览器通用的发布包。

构建后检查每个输出目录的 `manifest.json`：popup 应指向生成的 HTML，content script 的匹配范围应只有目标域名，permissions 应包含 storage。Chrome 的后台入口应是 service worker，Firefox MV2 则使用相应的后台脚本配置。不要手工修改输出清单来掩盖源配置问题，下次构建会覆盖它。

## 浏览器内的复现实验

在 Chrome 打开 `chrome://extensions/`，开启开发者模式，选择“加载已解压的扩展程序”，加载 `.output/chrome-mv3` 目录。Firefox 打开 `about:debugging`，进入“This Firefox”，选择“Load Temporary Add-on”，再选择 `.output/firefox-mv2/manifest.json` 文件，而不是停留在目录选择说明。

下面是读者需要执行的验收步骤，不是本文声称已经完成的浏览器测试：

1. 使用新的测试配置文件加载扩展，打开 popup，确认开关默认关闭。
2. 打开目标网页，确认未高亮；启用并保存，等待 Saved 提示，关闭 popup 后重新打开，确认开关恢复。
3. 刷新目标网页，检查链接样式；再关闭设置并保存、刷新，确认样式不再出现。
4. 打开其他域名，确认本例不注入；扩展内部页面与商店页面也不应当作为普通目标网站测试。
5. 重新加载扩展后刷新已有网页，再次检查设置。旧 content script 的上下文可能已经失效，不能只重新打开 popup。

新配置文件让空存储实验可重复。只想重置本例时，可以在扩展上下文中删除 `local:enabled`，不要在目标网页控制台清空网页的存储来代替。观察三个控制台时也要分清位置：popup 的开发者工具、扩展后台检查器、目标网页中的内容脚本日志各自对应不同执行上下文。

如果要检验“无接收端”，可在单独实验副本里临时移走 background 入口，重新构建并重新加载。目标页面刷新后应出现消息失败日志，而不是悄悄当作成功；随后恢复入口，再执行类型检查和构建。这个故障注入只用于定位通信，不应该进入发布包。

## 权限与失败排查

`matches` 声明的站点访问范围本身就是权限设计的一部分；没有额外的 `host_permissions` 字段不代表扩展从未申请网站访问。浏览器还可能允许用户限制某个站点的访问，内容脚本因此没有注入。若扩大到所有网站，需要重新解释数据用途并测试权限提示，不能把 `<all_urls>` 当成调试失败的默认补丁。

`storage` 保存的是扩展本地设置，不是安全保险箱，也不是跨设备同步承诺。不要存放长期服务端密钥；如果扩展以后连接服务端，应在服务端保护秘密，并说明发送哪些数据。本例没有读取网页正文或上传链接，发布隐私声明时也不能直接复用未来增加数据采集后的旧描述。

| 症状 | 先检查什么 | 不应直接采取的办法 |
| --- | --- | --- |
| 找不到 `#imports` | 是否在该示例目录执行 `pnpm typecheck`，是否生成 `.wxt` | 改回旧 `wxt/storage` 路径 |
| popup 没有显示 | 入口目录、HTML 的 script 路径、输出清单的 action 配置 | 在顶层随意新增 `popup.ts` |
| 保存后网页不变 | 是否等待成功提示并刷新，URL 是否匹配，站点访问是否允许 | 立即增加所有主机权限 |
| 消息没有接收端 | 后台错误、扩展是否重载、当前页面脚本是否过期 | 删除 catch 或假装响应成功 |
| 类型检查通过但无法加载 | 浏览器支持的 manifest 版本、输出目录、浏览器加载错误 | 认为类型系统验证了浏览器 |

添加 tabs 查询时，还要防御空数组与缺失的 `id`，不能未经检查就读取 `tabs[0].id`。本文主线无需查询标签页，因此没有为了演示类型补上无关 API。将功能留在必要范围内，也让每一项权限都能对应到实际代码。

## 扩大功能前的三个实验

先验证设置共享的范围。打开两个目标标签页，在其中一个页面打开 popup，启用并保存，只刷新第一个标签页。预期第一个页面高亮，第二个页面保留原样；刷新第二个页面后，它也应该读取同一个设置。这说明设置属于扩展，而样式属于各自页面的内容脚本。若产品需要每个网站或每个标签页独立开关，就必须改变数据模型，不能继续把一个全局布尔值解释成独立状态。

再验证持久化和后台生命周期。保存开启状态并关闭 popup，在 Chrome 扩展管理页面观察后台状态，然后等待后台停止或使用调试工具停止它，再刷新目标页面。预期请求可以唤醒后台并从存储恢复设置。不要让后台检查器一直打开后据此认定 service worker 永不休眠；调试状态会影响观察。这里描述的是待执行实验，本文没有测量后台停止时间，也没有证明休眠恢复已经通过。

最后验证错误响应。使用单独副本，把后台成功响应中的 `enabled` 临时改成字符串，构建并重新加载。内容脚本应拒绝该响应并记录错误，不添加高亮样式；恢复布尔值后再验收正常流程。TypeScript 泛型无法检查跨上下文收到的真实值，类型断言也不会自动转换字符串。这个实验把通信成功与消息内容正确区分开，不需要增加权限或连接外部服务。

三项实验应分别记录浏览器版本、加载目录、操作顺序、预期结果与实际结果。如果第一个失败，优先追踪存储键和页面刷新；第二个失败，检查监听器注册与后台错误；第三个失败，检查响应验证。不要一次修改存储、权限和消息格式，否则恢复正常后也难以知道是哪项修改起了作用。

截图验收也要记录操作过程。单张高亮截图只能证明拍摄时的页面外观，不能证明设置已经持久化、后台恢复正常或其他域名没有注入。建议分别保留启用前、保存后重新打开设置、刷新后高亮和关闭后恢复的画面，并标明加载的构建目录。同一次验收不要混用开发版与生产版；即使界面相同，它们也不是同一个待测产物。

添加实时更新时，需要明确由谁通知已经打开的页面、如何处理无接收端，以及保存成功但通知失败时显示什么状态。也可以选择存储订阅，但必须为内容脚本生命周期提供取消订阅。当前示例刻意使用刷新边界，提供的是可解释的基础行为；增加自动更新后要补运行时测试，不能只把提示文字里的“刷新”删除。

## Safari 与商店发布边界

Safari 先构建资源，Apple 打包是另一个步骤。在具备相应工具链的 macOS 环境中，可以按官方说明运行：

```bash
pnpm build:safari
xcrun safari-web-extension-packager .output/safari-mv2
```

传给 packager 的是构建目录，不是 TypeScript 源码目录。随后还需要处理应用容器、标识、签名和设备测试；具体选项跟随 [Apple 打包文档](https://developer.apple.com/documentation/safariservices/packaging-a-web-extension-for-safari)。Apple 也提供 [App Store Connect 网页打包与分发路径](https://developer.apple.com/documentation/safariservices/packaging-and-distributing-safari-web-extensions-with-app-store-connect)，所以不能笼统声称所有 Safari 发布都要求本机安装 Mac/Xcode。两条路径都有各自的资格和提交要求。

[WXT 发布文档](https://wxt.dev/guide/essentials/publishing)明确说明，它不会创建 Safari 原生应用容器，也不自动完成 Safari 发布。Windows 上成功生成 Safari 目录，只证明目标资源能够构建，没有证明扩展在 Safari 中正常运行，更没有证明能够通过商店审核。

Chrome 与 Firefox 可以先生成提交包：

```bash
pnpm exec wxt zip -b chrome
pnpm exec wxt zip -b firefox
```

Firefox 涉及构建转换的项目还需要可重建的源码包。本例在配置中明确列出 sources ZIP 的文件白名单；提交前解压检查入口、配置和锁文件是否完整，再在另一个空目录按锁文件安装、构建。WXT 0.21 调整了 `includeSources` 的白名单语义，不能照抄旧排除规则后默认源码齐全。

本次 Firefox 构建还报告了数据收集声明与扩展标识的警告。它们不阻止本例资源构建，但不能因此忽略发布前的要求。按 [Mozilla 的数据收集说明](https://extensionworkshop.com/documentation/develop/firefox-builtin-data-consent/)填写实际行为对应的声明，并根据目标 manifest 和发布方式设置自己的扩展 ID。不要通过关闭警告替代声明，也不要把教程占位标识当成自己产品的长期标识。

源码重建应使用解压后的文件本身，不能意外从原项目借用 `.wxt` 或 `node_modules`。先确认新目录没有这两项，再按锁文件安装、执行 typecheck 和相应目标构建。对照两个输出清单的版本、权限、入口与匹配范围；若文件名带 hash，不能仅因为名字不同就判断功能变化，也不能仅比较总字节数就宣布两包完全相同。

本例尚未加入完整的商店素材与生产版本策略。准备公开发布时，还要决定后续升级是否保留已有设置、改名后如何迁移存储，以及撤回某项权限后旧功能如何降级。先在测试配置文件中保留旧版数据再加载新版，记录设置是否恢复；这与第一次安装的空存储实验不是同一项测试。

不要把 `.env`、认证配置、私有依赖令牌或个人文件加入源码包。开发者账号、商店说明、图标、隐私信息、审核和更新策略也不由 build 命令完成。目标浏览器的 API 支持、打包成功和商店受理分别属于不同检查项；需要发布到哪个平台，就为哪个平台保留独立记录。

本文验证范围限定为仓库外抽取这些完整文件后的依赖安装、类型检查和资源构建。没有加载扩展到浏览器、没有执行上述运行时实验，也没有完成 Safari 原生打包、签名或商店提交。框架选型可以继续参考[三种扩展工具的比较](/cn/blog/the-2025-state-of-browser-extension-frameworks-a-comparative-analysis-of-plasmo-wxt-and-crxjs/)，其中将历史观点与现行版本的能力分开。

![此前保留的 WXT 开发工具截图，不作为本次运行验证证据](/assets/browser-extension-development/chrome_2025-03-11_18-27-41.png)
