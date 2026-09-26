## GSC 内容复核证据：有界旁路研究

研究日期：2026-09-26，按任务提供的 Australia/Sydney 本地日期命名。基线：`0071c2a51bc8f3dd8975b4f75772d92690627504`。

### 范围与证据等级

- 按 research skill 的一手来源、单文件交付原则执行。本任务就是旁路研究，不另外创建用户任务；只读检查五篇英文文章、相关 Git 历史及既有研究记录。
- 仅新建本文件；不操作浏览器、登录态、GSC、GitHub 账号或部署，不安装依赖，不执行示例中的初始化命令。
- 开始时已有 `src/components/home/HomeLatestVisual.astro` 修改和未跟踪的 `e2e/home-visual-size.spec.ts`，未触碰。
- 下文文章行号来自基线文件；`Lx-Ly` 是定位范围，不是线上 HTML 行号。正式执行修改前应重新读取，防止并行改动导致行号漂移。
- **已核实**：本地原文与官方文档/源码可直接对照。**编辑判断**：搜索意图和建议，不是实测排名解释。**待验证**：需要锁定发布版本、实际运行或主代理的 GSC 数据。
- 当前官方文档用于判断读者现在照做是否可靠；不能反推旧版本从来不支持某项能力。尤其 OpenSpec 的 `main` 源码不等于 npm `latest` 的已发布内容。

### 先给结论

1. WXT 教程优先修复：`getItem` 参数类型、旧导入路径、popup 文件位置、未定义的构建脚本，以及 Safari 构建与 Apple 打包之间缺失的步骤。它们是内容可执行性问题，不是已证明的掉排名原因。[W1-W7]
2. 框架比较文有可直接定位的自相矛盾：正文把 messaging 当成 WXT 内置优势，表格却标注没有内置包装；另有未测量的性能/维护优劣结论及过期能力矩阵。[W8-W11]
3. OpenSpec 的“首个变更”没有实际 spec delta 文件；给 proposal 后直接 validate，缺少可照做的完整路径。`--areas`、`--initiative` 与当前官方主干冲突，需要版本化处理，不能把 `--goal` 一并判错。[O1-O4]
4. GitHub 文章应提高修订优先级：普通帮助页仍写公开仓库可查看，但 2026-06-30 公告及当前 REST 文档已经说明 stargazers 访问限制。应呈现官方资料差异和权限条件，不能继续无条件保证公开可见。[H1-H3]
5. PYTHONPATH 的主要旧误导在 9 月 24 日已经修正。本轮不应再次把 `.env` 自动加载、虚拟环境自动解决所有路径问题列为“当前事实错误”。[P1-P2；本地提交 `d4d2dad`]
6. 未获得这五个页面的历史排名时间序列，不能声称它们曾掉排名。9 月 24 日修改也不能解释 9 月 21 日以前的观测窗口。

### 时间线：不能把后改内容归因为此前下跌

| Git 证据 | 实际时间 | 能证明什么 |
| --- | --- | --- |
| `82969369`，WXT L107-L115、L163-L172 的 blame | 2025-08-20 16:35:50 +10:00 | 构建脚本、旧 storage 导入及 `getItem(..., false)` 在该提交已有；不是 2026-09-24 新加。blame 到搬迁提交不等于原文首次创作日期。 |
| `f9d754c`，框架比较文初次加入 | 2025-09-03 18:44:53 +10:00 | 比较文是 2025 年内容；当前功能和维护结论应重新核验，不能仅换年份。 |
| `0397221e`，OpenSpec L129-L137 的 blame | 2026-06-16 16:11:46 +08:00 | workspace 参数块在最初教程中已有，不是 9 月 24 日新增。 |
| `d4d2dadfe6aa6bc372f8546b8d45bbc7fc5f130d` | 2026-09-24 02:50:17 +10:00，即 2026-09-23 16:50:17 UTC | 修改四篇教程的标题/description 与部分正文；不含框架比较文。 |
| `8f59f6802a53fe20c71db6e9c028aa468a5b77d8` | 2026-09-24 01:59:11 UTC，即 Sydney 11:59:11 | 框架比较文只把标签 `WXT` 改为 `wxt`；不是正文重写。 |
| `0071c2a51bc8f3dd8975b4f75772d92690627504` | 2026-09-25 15:26:13 UTC | 本次 HEAD；该提交增加两篇无关日文译文，不是这五篇的优化部署证明。 |

`d4d2dad` 的具体边界：

- WXT：新增定义、使用/开发分流，改标题与 description，保留原有教程代码。
- PYTHONPATH：增加速查，修正 Bash 追加表达式、终端 `.env` opt-in、Pylance 与运行时区别、虚拟环境和 editable install 的适用范围。
- OpenSpec：改标题与 description，新增 pnpm 快速入口；原有变更示例和参数块仍在。
- GitHub：新增直接答案、公开/私有权限描述、stars/watchers 区分。

既有 `docs/research/gsc-content-optimization-2026-09-24.md` L7-L10 明确：数据截至 **2026-09-21**，只有站点级查询汇总，缺少 query × page、国家/设备和前期对比。L38 将意图对应列为实验，L56 还说明部署和重新抓取时间未确认。该记录是本地已有笔记，本次未重新登录核验其数字。

因此：

- 即便主代理之后确认 9 月 21 日以前存在下降，9 月 24 日这批编辑在时间上也不能成为那个下降的原因。
- Git author/commit 时间、上线时间、Google 抓取时间、搜索结果开始采用新内容的时间不是同一个时间点。已有旧问题也只能作为质量整改依据，不能自动升级成历史归因。
- 不把三个多月与其中重叠的 28 天汇总排名直接相减，称作同一页面“从第几名掉到第几名”。不把该笔记 L23 的站点级 `what is a browser extension` 查询表现归给 WXT 教程或比较文中的任意一篇。

### 1. browser-extension-development.md

路径：`src/content/blog-en/browser-extension-development.md`。

**搜索意图（编辑判断）**：L2、L8-L18 同时服务“扩展是什么”和“如何开发”；L20 起几乎全部是 WXT 编程步骤。定义查询通常只需解释、例子及权限边界，WXT 查询则需要可运行项目。建议保留简洁定义，但由 query × page 数据决定是否另设科普入口；不要凭站点级查询曝光把两篇开发文章都改成泛科普。

| 优先级与定位 | 事实问题 | 可执行修改与验收 |
| --- | --- | --- |
| P1，L164、L171-L172 | `wxt/storage` 是旧导入路径；当前迁移说明改用 `#imports` 或对应 `wxt/utils/*`。`getItem` 第二参数是 options 对象，布尔值不是默认值参数。[W1-W3] | 改用下方 typed fallback 示例；验证空存储返回 false、保存 true 后重开 popup 可恢复；另跑类型检查，不只看打包成功。 |
| P1，L141、L157、L163 | 把 `popup.html` 和辅助 `popup.ts` 都放在 `entrypoints/` 顶层。官方明确警告辅助文件会被当作独立入口，通常导致构建错误。[W4] | 使用 `entrypoints/popup/index.html` 与 `entrypoints/popup/main.ts`，同步修改 script src。干净模板按文复制后构建。 |
| P1，L112-L114、L247 | `build:chrome`、`build:safari` 是 package scripts 名称，不是 WXT 自动提供的命令。文中没定义；官方安装例只提供 `build`、`build:firefox` 等。[W5] | 使用 `pnpm exec wxt build -b chrome/firefox/safari` 的分别执行形式，或完整给出 package.json scripts。不能把 Firefox 脚本也笼统判成不存在。 |
| P1，L35、L107-L115 | “Build once, run on ... Safari” 省略 API 差异与 Apple 打包。WXT 能产出 Safari 目标资源，但不创建原生 app wrapper，也不支持 Safari 自动发布。[W6-W7] | 改为“共享源码、分浏览器构建与测试”；明确 Apple 打包是额外步骤，不宣称 WXT 不支持 Safari 构建。见下方命令及网页打包替代路径。 |
| P1，L186-L198 | 原生 `browser.runtime.*` 被介绍为 WXT messaging utilities；背景示例没有 `defineBackground` 外壳。官方入口要求运行时代码放在 main 中；当前 messaging 指南建议原生 API 或另装库。[W4、W8] | 标注原生 API；给 `entrypoints/background.ts` 的完整外壳与 `content.ts` 的 main。分别验证发送、响应、无接收端错误。 |
| P2，L238-L241、L253-L255 | Firefox 临时安装指向目录不够准确，应进入目录选择 manifest 等文件；发布部分仅 ZIP 编译产物，漏了这类构建项目的可重建源码包。[W7、W12] | 改为选择 `.output/firefox-mv2/manifest.json`（与实际 manifest 目标一致），使用 `pnpm exec wxt zip -b firefox`，检查 sources ZIP 可重建且不含密钥。 |
| P2，L18、L25、L207-L210 | `@latest` 无版本基线；当前 WXT 0.21 要求 Node >=22。`tabs[0]` 也未经不存在检查，不能用“fully typed”代替运行时防御。[W3；代码本身] | 记录实际测试的 WXT/Node/pnpm 版本，检查空 tabs；WXT 默认新模板开启 `noUncheckedIndexedAccess` 时应通过类型检查。 |

建议 storage 替代片段，尚未在本任务执行：

```typescript
import { storage } from '#imports';

const enabled = await storage.getItem<boolean>('local:enableFeature', {
  fallback: false,
});
checkbox.checked = enabled;
```

建议 Safari 分步命令，第二步限 macOS/Xcode 工具链；本任务未运行：

```bash
pnpm exec wxt build -b safari
xcrun safari-web-extension-packager .output/safari-mv2
```

默认 Safari 目标为 MV2；若显式 `--mv3`，目录相应改为 `.output/safari-mv3`。[W6] Apple 当前还提供 App Store Connect 的网页打包路径，不应新增“所有 Safari 发布都必须在本机装 Mac/Xcode”的过度限制；无论选择哪条路径，WXT build 都不等于最终签名、测试与发布。[A1-A2]

**保留正确部分**：L79 已有 `storage` permission，不能说它完全漏了存储权限；L150 的 H1 在 HTML 代码围栏内，不是页面实际重复 H1。

### 2. 框架比较文

路径：`src/content/blog-en/the-2025-state-of-browser-extension-frameworks-a-comparative-analysis-of-plasmo-wxt-and-crxjs.md`。

**搜索意图（编辑判断）**：框架选型、WXT vs Plasmo、CRXJS HMR 与跨浏览器能力。应前置有约束的选择表和实测方法，不是把“什么是扩展”放大成长篇开场，也不是用“领导者”断言替代证据。

| 优先级与定位 | 核实结论 | 可执行建议 |
| --- | --- | --- |
| P1，L163、L193、L213、L293 | 正文说 WXT 提供现成 messaging 抽象，但表格与脚注又说没有内置 wrapper；官方指南确实让读者用原生 API 或另装 messaging 库。[W8] | 统一为“存储等能力内置；消息通信采用浏览器 API 或选配库”。同时修正两篇文章，避免互相强化错误。 |
| P1，L187 | `Remote Code Bundling` 给 WXT 打勾，但当前 0.21 升级说明已经移除 `url:` imports。[W3] | 若保留“2025 状态”应明确历史版本快照；若做现行选型页，记录版本并改矩阵，不能只把 2025 改成 2026。 |
| P2，L120、L196、L280-L281 | “支持所有浏览器”没有区分资源构建、API 可用性、开发启动、打包与商店发布；`browser` 对象也不保证每个 API 在每个浏览器都存在。[W6-W7] | 改成分层矩阵：Chrome/Firefox/Safari，MV2/MV3，构建、调试、额外 Apple 打包、发布。未经测试的格子写未验证。 |
| P2，L18-L20、L88-L94、L159-L163、L221、L268-L277、L308-L316 | 从 stars、竞品评价、社区体验推导维护风险与长期稳定“胜出”，证据不足；本次未做截至 2025-09-03 的历史 release/issue 快照审计，不能认定这些历史结论全部为假。 | 把作者意见标明为意见；维护状态附截至日期、release 和关键依赖记录；删除无证据的企业风险评分。不能仅凭有付费服务推断开源资源被挤占。 |
| P2，L67、L104、L245-L247、L276 | 没有同一项目、版本、机器和命令的性能基准，却把 Parcel/Vite 名称当成速度结论。 | 用同一 popup/content-script 用例记录冷启动、增量更新、生产构建、产物体积；未测量前写结构差异，不写“最快”。 |
| P2，L182、L269、L298 | “没有其他框架提供这种灵活性”过强。CRXJS 官方明确 framework-agnostic；Plasmo 官方列出可选 Vue/Svelte 支持。[W9-W10] | 区分首选框架、官方模块、可选支持和 HMR 行为；承认 CRXJS 同样支持多框架，避免绝对排他陈述。 |

L4 description 是超长结论段并带 Markdown 强调符，建议改成简短、可比较的真实摘要。但本次未检查线上 head 渲染，不能断言星号必然出现在摘要或长 description 会“被惩罚”。L318-L357 虽有参考文献，仍需把重要结论对应到具体来源；参考数量不能替代逐项证据。

建议结构：一屏选型表、同一最小项目、HMR 的更新/整页刷新区别、跨浏览器与发布边界、维护风险的日期化证据。保留 slug，若扩展到新年度则加实质更新说明；本任务不直接改标题或路由。

### 3. pythonpathvs-code.md

路径：`src/content/blog-en/pythonpathvs-code.md`。

**搜索意图（编辑判断）**：`pythonpath` 是定义/配置，`export pythonpath` 需要立即可复制的 shell 命令，“VS Code import not found”需要区分解释器、终端、调试器、Pylance。当前 L9-L31 已有效前置答案，不建议为了字数目标延后命令。

- **已修正，保留**：L206、L233-L247 明确 Python 不自动读 `.env`，终端 opt-in 默认 false；与当前 VS Code 官方文档一致。[P2] L280、L298 不再承诺选解释器就能导入所有本地源码。`d4d2dad` 的 diff 能证明这些是 9 月 24 日修复，不是本次新发现的未修 bug。
- **P2，可复现性，L194-L214**：目录树只有 `your_modules/my_module.py`，下一段却切成 `src` 示例。概念并非错误，但初学者无法按同一树照做。统一为 `src/my_package/__init__.py`，并给 `python -c "import my_package; print(my_package.__file__)"` 和预期路径；在当前终端、另一个 cwd、debug session 分别验证。[P1；目录不一致来自原文]
- **P2，适用范围，L121-L124、L192**：“每次新 terminal”与“最常用推荐”语气过满。Bash login/non-login 启动文件不同；至少删除未经来源支持的使用率结论，并把 `.env` 推荐限定为启动工具确实加载的开发路径。Bash 启动文件细节本次未进一步核验，不作为已证实运行故障。
- **P2，诊断落地，L259-L274、L308-L314**：已有正确区分，但缺少一个完整 `launch.json` 示例。建议补 `type: debugpy`、明确 `cwd`、`envFile`，再用同一 import 探针验证。不要同时启用所有配置方案后宣称不知道哪个生效；先用单一项目路径，再讲继承已有变量。
- **P2，文案一致性，L278 对照 L280**：把“最好不要手动设 PYTHONPATH，而用虚拟环境”改为“虚拟环境隔离依赖；本地 src 仍需 editable install 或显式路径”，与后一句保持同样精度。Python 官方也警告全局 PYTHONPATH 影响多个环境。[P1]

未发现必须推翻当前 quick reference 的事实依据；不把文件 slug 含 `vs-code` 当成排名错误，也不建议为追词改 URL。

### 4. openspec-tutorial-cli-commands-agents-md-examples.md

路径：`src/content/blog-en/openspec-tutorial-cli-commands-agents-md-examples.md`。

**搜索意图（编辑判断）**：`openspec` 可能是寻找官网；`openspec cli/install/tutorial` 更像安装和首个可运行变更。教程应快速交付最小闭环，官网导航意图不能只靠扩写解决。既有 GSC 查询只提供意图线索，不提供本页排名归因。

| 优先级与定位 | 事实问题或缺口 | 修改与验收 |
| --- | --- | --- |
| P1，L129-L137 | 官方主干 CLI 将 `--initiative`、`--areas` 保留为隐藏的“已不再支持”参数；`--goal` 仍有效。文章把三者并列为可用 workspace 能力，没有版本说明。[O1-O2] | 从当前速查中移走两个淘汰参数，或标注可核实的历史版本。先读取所选 npm 版本的 `new change --help`，不要凭主干源码断言所有已发布版本均如此。 |
| P1，L157-L208 | 写出 proposal，但没有说明存成什么文件，没有 `specs/<capability>/spec.md`、Requirement/Scenario 示例，就直接 validate。官方说明无 spec deltas 的变更默认失败，除非明确声明适用的 `skip_specs`；登录功能显然不应借此跳过需求。[O1、O3] | 指定 proposal 路径，补一个最小 delta，再补该 schema 所需 design/tasks。按下方顺序在临时项目验证，不把 proposal 的普通验收列表当成 spec 文件。 |
| P2，L50-L59、L302-L306、L354-L368 | 上文只有 `npx`/`pnpm dlx` 临时执行，下文直接用裸 `openspec`，没有建立全局命令前提。 | 主线统一 `pnpm dlx @fission-ai/openspec@<已验证版本>`；裸命令明确仅适用于已安装的 CLI。把版本、Node 要求、验证日期放在一起。 |
| P2，L285-L309 | 手写 `AGENTS.md` 建议与工具生成文件边界不够清楚；当前 OPSX 文档描述的是生成 skills 和 profile 配置。[O4] | 明确该 AGENTS 段是作者可选的项目治理规则，不承诺每个版本都会生成 `openspec/AGENTS.md`。展示所测工具实际生成的路径，分开 legacy、当前 CLI 和 `/opsx:*` 工作流。 |
| P2，L102-L112、L313-L319、L423-L425 | 将“先 spec 再代码”呈现为唯一线性运行规则；当前 OPSX 强调依赖图和可迭代动作，不是不可回头的阶段锁。[O4] | 保留“这是本教程采用的评审策略”，补需求变化时返回更新 artifacts 的流程；不把工作习惯当作 CLI 强制保证。 |

建议补入的最小 delta，位置应为 `openspec/changes/add-magic-link-login/specs/auth/spec.md`，不是 proposal 内随手加一个段落：

```markdown
## Purpose
Allow existing users to sign in with a single-use email link without removing the existing password sign-in flow.

## ADDED Requirements

### Requirement: Sign in with a magic link
The system SHALL reject expired or previously used sign-in links.

#### Scenario: Reject a reused link
- **WHEN** a user submits a sign-in link that has already been used
- **THEN** the system rejects it and offers to request a new link
```

这是依据官方模板拟定的修稿候选，不是本任务运行通过的样例。[O3] 后续验收：固定版本 -> init -> new change -> 明确写入 proposal/spec/design/tasks -> `validate ... --strict --json --no-interactive` -> 完成实现与测试 -> archive -> 检查主 spec 与 archive 目录。不能用 `--no-validate` 把教程跑通当作验收通过。

### 5. who-starred-my-github-repo-how-to-view.md

路径：`src/content/blog-en/who-starred-my-github-repo-how-to-view.md`。

**搜索意图（编辑判断）**：入口型问答，先给 `/stargazers`，再解释权限失败。文章短本身不是事实错误，也不是可以直接确认的“薄内容惩罚”。

**P1：L9、L21、L25 的访问承诺需要修订。**

- GitHub 普通帮助页仍写可以查看公开仓库或自己有权限的私有仓库。[H1]
- 但 2026-06-30 的 GitHub 官方 changelog 已宣布将 stargazers API 和 UI 限制给管理员/协作者，可能出现空响应或 403；REST 文档的 New access restrictions 段明确标为 2026 年 7 月引入。[H2-H3]
- REST 页同时还保留“公开资源无需认证”的通用段落，官方资料内部尚有不一致。因此，能确定的是文章的无条件保证不可靠，不能宣称已实测“所有公开仓库、所有账号现在都无法查看”。本任务没有登录测试，也未验证逐账号 rollout 状态。

建议把首答改成：“入口是仓库 URL 后加 `/stargazers`。能否列出用户还取决于账号权限和 GitHub 的访问限制；公开仓库也不保证任意访问者可查看。遇到空列表或 403，先检查管理员/协作者权限，而不是认定没人点过 star。”

L25 “能打开私有仓库”仍是必要检查，但不能承诺充分保证 stargazers 列表权限。L27-L29 的 stars/watchers 区分可以保留，REST 文档支持这一区别。[H3]

**P2：按真实需求补可选分支，而不注水。**

- 用户要时间/导出时才给 REST 示例；`application/vnd.github.star+json` 提供 starred_at，单页默认 30、最多 100，必须分页。API 同样受访问限制，不能作为绕过 UI 权限的办法。[H3]
- 可以解释列表不是完整历史审计：不要把当前列表等同于“曾经点过、后来取消”的永久记录。用户级后续变化可从有权限时保存的快照开始，不承诺恢复过去的取消记录。当前 REST 另有按周汇总的 star history；不能因此声称 GitHub 完全没有历史数量接口，但数量历史也不等于用户身份历史。[H3]
- 依据仓库篇幅政策，它更像 notes，但迁移旧 URL 是另一项需评估的工作；先保留现有 slug 修事实，不能为凑正式博客长度扩写无关 GitHub 历史，更不能未做重定向就移动。

### Google 排名诊断：交给主代理的数据核对表

以下是官方原则与本次建议的检查设计，**不是已经观察到的站点现象**。

1. **先确认什么下降**：在相同搜索类型下区分 clicks、impressions、CTR、position。Google 建议拉长到 16 个月看季节性，并做同等前期/同比比较，检查 page、query、country、device、search appearance。[G1]
2. **不要把 CTR 下降写成排名下降**：曝光稳定而点击减少时，标题/摘要吸引力或其他搜索结果形态是候选解释；若曝光与排名也变了，应先分层，不孤立归因标题。[G1]
3. **平均排名不是单次固定 SERP 名次**：它按实际展现和该资源的最高位置汇总；不同查询/设备/国家的构成改变，聚合值也会改变。Google 也提醒别过度盯绝对位置，应同时看点击与曝光。[G1、G4]
4. **先查技术可见性，再归因正文**：结合索引、抓取、URL Inspection、服务器可用性、noindex/robots、canonical、迁移记录及安全/手动措施。文章有 bug 不排除另有技术故障；反过来也不能凭 bug 声称 Google 已惩罚。[G1]
5. **核心更新只能按真实日期核对**：如主代理发现相符的更新，应先确认 rollout 结束，按 Google 建议至少等待完整一周后比较更新前后。小幅波动不宜剧烈重写；本研究未查出或认定任何具体更新导致本网站下降。[G2]
6. **修复不等于保证恢复**：Google 表示改进的影响可能需要数天到数月，也不保证排名收益。优先修可运行性与事实可靠性，不用改日期、加字数或堆参考文献充当修复。[G1-G3]

建议主代理最小产出字段：

| 字段组 | 需要记录的证据 |
| --- | --- |
| 数据口径 | GSC property、搜索类型、完整日期、报告时区、是否包含未完成日期 |
| 固定分层 | 精确 page URL × query，country/device；先固定条件再比较 |
| 前后指标 | clicks、impressions、CTR、position；同长窗口与每日/每周走势 |
| 页面互相影响 | 同一查询是否从教程切换到比较文/其他语言页；没有 page 归因前不叫“内耗” |
| 发布链 | commit、实际上线记录、Google 最近抓取、canonical/索引状态 |
| 判定措辞 | 已观察事实、候选解释、被排除解释、仍缺证据分别书写 |

建议执行顺序：先修 P1 可执行性与权限事实，再补 P2 例子/证据；冻结不必要的 URL 与多轮标题变更，记录上线与抓取后评估。暂不扩大到整站内容清理或“全面刷新年份”。

### 一手来源目录

均通过 web 工具访问公开页面，不使用用户的浏览器会话。以下 URL 用于持久化复核；动态文档和 `main` 可能继续变化，后续实改仍应锁定依赖版本。WXT 页面本次显示 `v0.21.4`，不将它当作文章 2025 年使用版本。

| 编号 | 官方来源与定位 | 本文使用范围 |
| --- | --- | --- |
| W1 | `https://wxt.dev/storage`，With WXT / Storage Permission / Basic Usage | `#imports`、权限、键名及类型参数 |
| W2 | `https://wxt.dev/api/reference/wxt/utils/storage/interfaces/wxtstorage`，getItem；`https://wxt.dev/api/reference/wxt/utils/storage/interfaces/getitemoptions`，fallback | 第二参数是 GetItemOptions 对象，fallback 是选项字段 |
| W3 | `https://wxt.dev/guide/resources/upgrading`，v0.19 -> v0.20 Import Path Changes；v0.20 -> v0.21 Minimum Versions / url Imports / tsconfig | 导入迁移、Node 22、移除远程导入、新类型检查默认值 |
| W4 | `https://wxt.dev/guide/essentials/entrypoints`，Including Other Files / Entrypoint Types | popup 辅助文件不能平铺，background/content 入口约定 |
| W5 | `https://wxt.dev/guide/installation`，From Scratch 的 package.json scripts | 默认脚本与用户自定义脚本的区别 |
| W6 | `https://wxt.dev/guide/essentials/target-different-browsers`，Target a Browser / Target a Manifest Version | `-b`、Safari/Firefox 默认 MV2、单独构建 |
| W7 | `https://wxt.dev/guide/essentials/publishing`，Firefox Addon Store / Safari | Firefox sources ZIP；Safari 无自动发布，需额外 wrapper |
| W8 | `https://wxt.dev/guide/essentials/messaging`，Alternatives | 原生 API 与外装 messaging 库，不是 WXT 内置 wrapper |
| W9 | `https://crxjs.dev/guide/introduction/`，Framework Agnostic | CRXJS 支持多种前端框架 |
| W10 | `https://docs.plasmo.com/framework`，Highlighted Features | React 一等支持，Vue/Svelte 可选；不据此证明性能排名 |
| W11 | `https://wxt.dev/guide/resources/compare` | WXT 作者自己的比较表，只作为其观点来源，不当独立维护风险审计 |
| W12 | `https://www.extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/`，安装步骤 | 打开目录后选择文件或 ZIP，不是仅选择目录 |
| A1 | `https://developer.apple.com/documentation/safariservices/packaging-a-web-extension-for-safari?changes=_5`，Run the packager | `xcrun safari-web-extension-packager`、Mac/Xcode 命令行路径 |
| A2 | `https://developer.apple.com/documentation/safariservices/packaging-and-distributing-safari-web-extensions-with-app-store-connect`，Overview | 网页打包不要求本机 Mac/Xcode；仍需 Apple 开发者资格及发布流程 |
| P1 | `https://docs.python.org/3/library/sys_path_init.html`，PYTHONPATH 与 Note | 搜索路径与全局 PYTHONPATH 的跨环境影响 |
| P2 | `https://code.visualstudio.com/docs/python/environments`，Terminal settings / .env file support | `python.terminal.useEnvFile` 默认 false，变量在创建终端时注入 |
| O1 | `https://raw.githubusercontent.com/Fission-AI/OpenSpec/main/docs/cli.md`，validate / new change / init | 零 delta 校验边界、当前命令参数、初始化生成物 |
| O2 | `https://raw.githubusercontent.com/Fission-AI/OpenSpec/main/src/cli/index.ts`，本次读取 L682-L697 | `--goal` 仍在；`--initiative`、`--areas` 隐藏且注明 No longer supported |
| O3 | `https://raw.githubusercontent.com/Fission-AI/OpenSpec/main/schemas/spec-driven/templates/spec.md` | Purpose / ADDED Requirements / Requirement / Scenario 结构 |
| O4 | `https://raw.githubusercontent.com/Fission-AI/OpenSpec/main/docs/opsx.md`，依赖图与 Setup | 非线性工作流、skills 与 profile；不等于对某 npm 发布包做过实测 |
| H1 | `https://docs.github.com/en/get-started/exploring-projects-on-github/saving-repositories-with-stars`，Viewing who has starred a repository | 普通帮助页仍保留较宽的访问描述 |
| H2 | `https://github.blog/changelog/2026-06-30-upcoming-access-restrictions-to-public-api-endpoints-and-ui-views/`，What's changing | 管理员/协作者限制，包含 UI，可能空响应或 403 |
| H3 | `https://docs.github.com/en/rest/activity/starring`，New access restrictions / List stargazers / Get repository star history | 2026 年 7 月限制说明、媒体类型、分页、历史数量接口；同时记录通用权限段冲突 |
| G1 | `https://developers.google.com/search/docs/monitor-debug/debugging-search-traffic-drops` | 分析窗口、点击/曝光区别、分层与技术诊断 |
| G2 | `https://developers.google.com/search/docs/appearance/core-updates`，Check if there's a traffic drop / Things to keep in mind | 完成 rollout 后等待至少一周、小幅波动不剧改、不保证恢复 |
| G3 | `https://developers.google.com/search/docs/fundamentals/creating-helpful-content` | 一手价值与可验证质量，不存在推荐字数或仅换日期的捷径 |
| G4 | `https://support.google.com/webmasters/answer/7042828?hl=en`，Position | 平均位置与最高位置统计口径，不能当作固定 SERP 排名 |

### 复核命令与交付边界

本次使用的只读核验：

```powershell
git rev-parse HEAD
git status --short
git show --format=fuller --stat 0071c2a
git show --format=fuller --unified=3 d4d2dad -- src/content/blog-en/browser-extension-development.md src/content/blog-en/pythonpathvs-code.md src/content/blog-en/openspec-tutorial-cli-commands-agents-md-examples.md src/content/blog-en/who-starred-my-github-repo-how-to-view.md
git blame -L 163,172 --date=iso-strict 0071c2a -- src/content/blog-en/browser-extension-development.md
git blame -L 129,137 --date=iso-strict 0071c2a -- src/content/blog-en/openspec-tutorial-cli-commands-agents-md-examples.md
```

没有运行构建、单元测试、E2E 或所提议的第三方代码片段；这不是实现交付。未观察线上页面、实际安装权限、包版本运行结果或历史 SERP。研究结论的强度止于文本、Git 和官方文档证据。

交付检查：针对本文件的 `git diff --check` 返回 0；因为新文件尚未跟踪，另外逐行检查了尾随空白（0 处）与代码围栏（8 个，成对）。HEAD 仍为上述基线。结束检查另发现未跟踪的 `.gsc-audit-screen.png`，视为并行工作产物，未读取或改动；本任务唯一写入仍是本研究文件。

### 执行异常

- **实际 shell 异常：无。** 本次 shell 命令均返回 0，没有新增 shell 故障候选记录，不修改 AGENTS.md 或其他日志。
- 非失败警告：`git diff --name-only` 提示他人已有修改的 `src/components/home/HomeLatestVisual.astro` 下次 Git 操作可能将 LF 转成 CRLF；命令返回 0。这是 Git 换行转换提示，未调查或更改其属性配置。规避：本任务不格式化、不暂存该文件，后续差异检查只指定本文件。
- 部分公开页面依赖客户端渲染；Apple 打包正文使用官方搜索索引可读版本核对，并与 WXT 官方发布指南交叉检查。未借此打开登录态浏览器。

## 追加：BMAD、Claude Agent SDK 与 Buffett 编辑证据

本节依据主代理采集并转交的 GSC 观测继续研究。修改范围仍限本文件，不修改内容源文件，不运行安装器、SDK 调用或投资计算。公开 HTTP 取证时间为 **2026-09-25 15:58:29-15:58:37 UTC**，即 **2026-09-26 01:58:29-01:58:37 Australia/Sydney**；这两个日期是同一时段。

### 新增 GSC 观测及归因边界

数据由主代理采集并转交，本旁路未登录 GSC 复采。下表统一使用最新已确认的全地区口径；B = **2026-07-30 至 2026-08-26**，C = **2026-08-27 至 2026-09-23**，两期均为 28 天。美国桌面固定分层另见 D 节，不与本表混算。

| 精确查询与页面 | 前期 | 后期 | 目前可以说什么 |
| --- | --- | --- | --- |
| `bmad method`，英文 notes 页 | B：73 曝光，均位 29.9，1 点击 | C：66 曝光，均位 34.8，0 点击 | 均位后移 4.9，点击由 1 降至 0；不是每天固定掉了五名，也不是整站下降。 |
| `bmad method`，日文页 | B：54 曝光，均位 9.0，3 点击 | C：32 曝光，均位 9.6，0 点击 | 均位后移 0.6，曝光及点击也减少；没有同等国家/设备分层，不作为英文页的因果控制组。 |
| `claudesdkclient query hooks`，`/blog/claude-agent-sdk-python-/` | B：903 曝光，均位 5.5，0 点击 | C：1681 曝光，均位 7.1，0 点击 | 主线确认该 query 只落此英文页；曝光增加 778，均位后移 1.6，两期均无点击，不能称为已观察到点击损失。 |

不能直接用本地“9 月 24 日”与 GSC“9 月 23 日”判断先后：`d4d2dad` 的实际时间是 **2026-09-23 16:50:17 UTC**（Sydney 9 月 24 日 02:50:17），GSC 的 9 月 23 日可能包含这一时刻。只能说该编辑不能解释编辑发生之前的下降；没有部署、Google 抓取和采用新正文的证据，不能判断其是否影响 C 窗口末端。本地 BMAD notes 的 `8f59f68` 是标签整理，也没有相应上线与抓取证据。安装信息陈旧是可核实的内容问题，不是已证实的降位原因；日文均位变化较小也不能证明某个英文措辞就是原因。前文截至 9 月 21 日的旧窗口边界仍成立。

SDK 的截断行 blame 到 `87a79dad4c5bbfd5ec0ee9b736ecf3596d0aca2c`，时间 **2025-10-15 13:46:47 +10:00**；其上方段落来自 `e5cb3132`。这是长期已有缺陷，不是 2026-09-24 修改引入；本次线上确认只能证明取证时可见，不能证明每个历史日期 Google 都读取了同一内容。

### A. BMAD：先纠正安装路线和能力承诺

文件：`src/content/notes-en/bmad-method-guide.md`。

**检索意图（编辑判断）**：精确品牌词可能是找官网/安装入口，也可能想理解方法；应先提供明确版本的入门路径，再解释流程。不根据这两个窗口把文章重写成“最好用的 AI 框架”，也不把排名改善作为修稿验收承诺。

| 优先级、行号 | 官方核验与证据强度 | 建议修改 |
| --- | --- | --- |
| P1，L52-L82 | 将 v6 写成“官方推荐 alpha”、将无版本/`@latest` 命令标为 v4 已不适合作为现行指引。官方已有 v6 stable release；本次公开 npm dist-tags 为 `latest: 6.12.0`、`next: 6.12.1-next.0`、`rollback: 4.39.0`，未返回 alpha 标签。[B1-B2] | 选择并标明实际测试版本；稳定、预发布、历史版本分栏。不要用可变 dist-tag 充当 v4 永久别名，也不无实测承诺 alpha 命令一定成功。 |
| P1，L86、L92-L106、L302 | “install 仅下载，另用 workflow-init 才生成 `.bmad`”“v6 是 `.bmad-core`”与官方 v6.0.0 安装结果不符。官方列 `_bmad/bmm/config.yaml`、`_bmad/core/`、`_bmad-output/`，安装器也会写宿主工具入口。[B3] | 用选定 tag 的真实目录树取代猜测；区分安装器、宿主入口、工作流与产物目录。v6 安装验收入口按该版本文档使用 `/bmad-help`，不要把旧 `*workflow-init` 当通用必需步骤。 |
| P1，L108-L136、L357、L392 | `project.type`、`agents.default`、`quality.pre_commit` 示例引用的是 **BmadElixir v0.1.1**，不能作为 BMAD-METHOD 的官方配置契约。核对 v6 `module.yaml` 的用户配置字段，也没有支持文中那套字段/自动执行含义的证据。[B4；原文脚注 18] | 删除或明确标成另一个项目的示例，不与 BMAD 安装步骤混用。真实 Git hooks/CI 单独配置并测试失败阻断，不承诺随便写一个 YAML 字段就能强制执行。 |
| P1，L28、L140、L173-L175、L352-L357 | 官方 dev agent YAML 有读 story、按任务顺序实现和跑测试的自然语言指令；这能支持“流程约束”，不能证明“角色有强制文件权限、Developer 无法改数据库”的访问控制。[B5] | 改为代理角色约定；将工具权限、沙箱、文件写入限制、审批与 CI 门槛归到实际宿主/执行系统。除非提供相应实现及负向测试，不使用“不能越权”“强制阻止”的表述。 |
| P1，L30、L237、L387 | “最多节省 90%”又变成“直接带来 90% 节省及极高准确率”。脚注 9 指向第三方 Medium，不是官方基准。本次核对的官方 README、release、安装/角色定义没有可复现的统一测试支持该保证。[B1、B3-B6；原文脚注 9] | 删百分比与准确率保证；保留“减少重复加载可能降低上下文开销”。若以后保留个案数值，必须交代工作负载、模型、输入/输出与缓存计费口径、基线、重复次数和质量验收，不推广成所有用户收益。 |
| P2，L39-L48、L279-L294、L361-L363 | Node/Git/IDE 的“硬要求”和“最优/最快”混杂；v6.0.0 官方安装文档把 Node 20+ 列为要求、Git 列为推荐，不能凭安装问题就断言 IDE 文件监听权限是通常根因。[B3] | 分清必要条件、建议和作者偏好。删除无基准的 IDE 排名；未响应先确认版本及命令是否存在，再排环境问题。 |

**特别边界**：当前官方 `main` README 已展示 Skills CLI/plugin 加 `bmad setup` 的新路线，与 npm v6 安装路线并非一份不变契约。[B6] 因此不能拿今天的 main 反向证明文章在 2026-01-10 发布时每一条都错；也不能把 v6 的 `_bmad/` 再宣布为所有未来版本唯一目录。本次修稿宜锁定 npm 已发布 v6 版本，或单独完成新路线验证后重写，不能把两条路线拼接。

验收建议（本次未执行）：临时空项目运行固定版本安装器，核对实际目录、宿主入口和帮助流程；按文完成一个无副作用小变更；人为制造测试失败，确认阻断来自明确配置的执行机制。Token 节省没有实验就不写数字。

### B. SDK：三语完整性与线上取证

三语文件均声明学习内容基于 SDK **0.1.3**（英文/中文 L10，日文 L12）。本次同时核对 Anthropic 官方 v0.1.3 tag 和当前文档，避免把新接口直接塞进旧教程。

| 语言 | 本地原文检查 | 公开 HTTP 取证 |
| --- | --- | --- |
| EN | `src/content/blog-en/claude-agent-sdk-python-.md` 共 652 行、45 个顶层代码围栏；L633 开启 python 围栏，L652 在 `options = ClaudeAgent` 结束，没有关闭围栏，后续 Hook 实战也缺失。 | `https://redreamality.com/blog/claude-agent-sdk-python-/` 返回 200，23 个 pre；解码最后一个 pre 后同样止于 `options = ClaudeAgent`。不是仅本地未部署的问题。 |
| CN | `src/content/blog-cn/claude-agent-sdk-python-.md` 共 1541 行、112 个顶层围栏；L673-L724 有 hooks，L976-L1019 有调用示例，L1518-L1541 有总结。 | `https://redreamality.com/cn/blog/claude-agent-sdk-python-/` 返回 200，56 个 pre；最后代码块是闭合的配置签名，不是英文截断尾部。 |
| JA | `src/content/blog-ja/claude-agent-sdk-python-.md` 共 1043 行、74 个顶层围栏；最后在 circuit breaker 代码后接分隔线。围栏闭合，但不能据此声称是完整且准确的译文。 | `https://redreamality.com/ja/blog/claude-agent-sdk-python-/` 返回 200，37 个 pre；最后代码是 circuit breaker；正文存在 `before_query` 等错误接口示例。 |

取证方法：PowerShell 对三个公开 URL 分别执行不带凭据或 WebSession 的 `Invoke-WebRequest -UseBasicParsing`，在内存中匹配 pre、剥离标签、HTML decode 并打印最后代码尾部；未保存网页文件、未操作浏览器。Markdown 未闭合围栏可以被渲染器在文件结束处容错关闭，所以线上 200/HTML pre 有结束标签不能证明源稿完整；当前证据确认的是内容截断，不是声称整个网页 HTML 无法闭合。

#### SDK 优先修稿点

| 优先级与原文定位 | 核实结论 | 修稿要求 |
| --- | --- | --- |
| P1，EN L633-L652；description L4 | “complete guide”承诺 hooks，但正文在 MCP 配置中途结束。`ClaudeAgent` 作为单独名称在语法上可以被解析，所以仅跑 Python AST 也未必发现它语义未完成。 | 恢复完整 MCP 配置并闭合围栏；补真正回答 query/hooks/lifecycle 的章节，不能只在末尾加三个反引号。 |
| P1，JA L239-L251、L275-L307、L420-L435 | 官方 v0.1.3 的 `ClaudeSDKClient` 本身就是 async；其公开类没有 `.hook()` 注册接口，`query()` 接收 prompt/session_id 而不是此处的 model/max_tokens/temperature。官方导出也不提供文中的 `AsyncClaudeSDKClient`。[C1-C3] | 删除这套“同步 client + 另一个 Async client + 装饰器 hooks”写法，按官方 API 重写；不是仅把英文修复翻译过去就能覆盖日文现有错误。 |
| P1，JA L977-L988 | 创建实例不等于建立连接；`await client.query()` 是发请求，返回值不是最终文本。重连函数未 connect，也未清理旧实例。官方要求先连接，再消费响应。[C1] | 用明确的连接/发送/接收/清理生命周期；有副作用的调用失败不能无条件重发，先说明幂等性和结果不确定边界。 |
| P2，EN L466-L512 | 示例是顶层 `async for` / `async with` 片段，不能直接当普通 `.py` 文件运行。官方参考也明确区分片段与 main 入口。[C4] | 将片段明确标作片段，或实际测试一个包含 imports、async main、runner 的独立例子；本报告不杜撰已跑通代码。 |
| P2，CN L976-L1019 | 核心 hooks 注册方式符合官方形状，但该代码块调用 `anyio.run(main)` 而块内没有 import anyio。若定位为独立复制示例，应补依赖/import 并实测。[C3、C5；缺失 import 为本地检查] | 不把中文整篇照搬作“现成跑通模板”。同时标明字符串匹配危险命令只是演示，不是通用安全沙箱。 |
| P2，EN L489；CN 对应 query 介绍 | “每次独立/无状态”应有默认行为限定；当代官方 query 支持 resume/continue，且 hooks 两个 API 都支持。[C4] | 不写“query 永远不能用 hooks”。下面按实际版本和输入模式解释。 |

**建议新增的正文段落结构（契约与验收，不是未经测试的完整示例）**：

1. **先分清两种 query**。模块级 `query()` 返回消息异步迭代器；`ClaudeSDKClient.query()` 只发送输入，再用 `receive_response()` 接收至含 `ResultMessage` 的单次结果。旧 v0.1.3 源码明确如此。[C1、C6]
2. **Hooks 的配置与输入模式**。用 `ClaudeAgentOptions.hooks`、`HookMatcher` 和三个参数的 async callback；事件使用所选版本真实支持的名称，例如 `PreToolUse` / `PostToolUse`，不发明 `before_query`。v0.1.3 的模块级 query 已向内部传递 hooks，但仅 AsyncIterable 输入进入 control protocol 初始化；不能笼统说它不支持 hooks，也不能假定旧版字符串输入与流式输入等价。教程主线可采用 `ClaudeSDKClient` 的流式生命周期，另一模式另测。[C1、C3、C5-C6]
3. **Lifecycle 与资源释放**。同一 async 上下文内连接、发送、消费响应、退出并断开；手动 connect 路径要有 finally 清理。`Stop` 事件不等于 Python client disconnect，session hooks 的可用范围要按 Python 版本列出，不把 TypeScript 文档全表照搬。[C1、C3、C5]
4. **定位“hook 没触发”**。记录所测 SDK/CLI/Python 版本、真实 tool name、matcher、回调开始/结束及返回结构，再区分“模型没有调用工具”“matcher 不匹配”“控制通道未初始化”“回调报错/超时”。只看到没有日志不能推断 SDK hooks 不支持。验收用临时文件或无副作用工具，不依赖模型一定选择某工具；记录实际 tool call。[C5；验收方法为本次建议]
5. **Timeouts 分层说明**。不要写一个虚构的 `ClaudeSDKClient(timeout=...)` 就代表所有截止时间，按下表拆开。教程必须选定版本再给具体参数，不把当前字段回填到 0.1.3。

| 超时层 | 已核实的边界 | 修稿及测试要求 |
| --- | --- | --- |
| SDK hook 回调 | 当前 HookMatcher 的 timeout 单位为秒；v0.1.3 HookMatcher 只有 matcher/hooks，没有该参数。[C3、C5] | 要展示 matcher timeout 就更新并固定支持版本；否则明确旧版限制。不要硬写跨版本统一默认值。 |
| Hook 异步输出 | `async_` 是回调输出模式，不是“函数用了 async”；v0.1.3 的 `asyncTimeout` 文档单位为毫秒。[C3] | 将 async 函数与异步继续执行分开解释。权限拦截应先完成决定，不把后台审计示例包装成已完成审批。 |
| CLI/API 请求及重试 | 当前官方文档用 `ClaudeAgentOptions.env` 向 CLI 传 `API_TIMEOUT_MS`；这是单请求毫秒上限，重试可能拉长总耗时。[C4] | 分清单请求和应用总任务截止；记录实际 CLI 版本，不声称这一段已在文章标注的 0.1.3 环境验证。 |
| 应用总生命周期 | SDK v0.1.3 接收循环直到 ResultMessage，源码提示没收到会继续等待；中断和 disconnect 是独立操作。[C1] | 明确总截止、取消、清理、最后结果状态。不能仅在 `await client.query()` 外设超时，因为发完后仍需接收。也不要把连接/断开移入不同 task 后造成异步上下文不一致。 |
| Hook 超时后的动作 | 当前官方按事件区别处理：PreToolUse 超时不执行该次工具，PostToolUse 保留已发生的工具结果，Stop 有不同语义；且 CLI 版本改变过行为。[C5] | 不统一写成“超时全部放行”或“全部终止”。测试超时后的实际工具副作用、session 是否继续、客户端是否释放；这些本次未执行。 |

建议验收清单：固定版本的导入/参数检查；同一实例两轮对话；PreToolUse 明确拒绝且无文件副作用；允许时产生 PostToolUse；模块 query 流式路径；缺失 ResultMessage 的总截止；回调超时；异常退出清理；三语章节/代码 parity。页面 E2E 应断言末段与 hooks/lifecycle/timeouts 章节存在，另做 fenced block 解析检查；不能以 URL 200、H1 正常替代教程内容完整性。本任务只提出这些测试，没有新增或执行测试。

### C. Buffett：仅编辑风险清单

主文件：`src/content/questions-en/why-warren-buffett-does-not-invest-in-bonds.md`。以下不提供资产配置、收益预测或投资建议。引用的百分比只是在定位原文问题，不代表核实为事实；本轮不新增任何投资收益或持仓数值。

| 优先级与行号 | 风险 | 编辑动作 |
| --- | --- | --- |
| P1，EN L24、L26、L122-L124；CN/JA L25、L27、L123-L125 | 两类问题须分开：债券段确实用了 guaranteed/保证；股票段写“可以每年赚取 15-20%”，虽没有字面写“保证”，仍是无期间、无数据基础的回报暗示。不能把两句拼成 Buffett 的原话。 | 删除保证性措辞及无来源收益对比；如保留历史表现，必须引用官方年报表格、期间和指标，不能转成未来每年可获得的回报。 |
| P1，EN L2、L8-L12、L90、L169-L171 | 标题“不投资债券”与正文承认持有债券矛盾；固定收益、短期国库券、现金等价物和上市股票/控股企业口径混杂。2024 官方年报本身讨论增加 Treasury Bills 持有及 fixed-coupon bonds 的风险，不能简化为完全不买债券。[F1] | 将问答限定为具体时期的资产类型与表述澄清；不拿个人偏好代替 Berkshire 的合并报表。 |
| P2，EN L8；CN L9 | third-richest/世界第三富豪没有榜单、截止日或方法，也与问题无关。 | 直接移除，不用另一个未经核验的财富排名替换。 |
| P2，EN L62、L74、L94 | 投资资产规模、浮存金、“2022 年战术买债”既无具体报告页码，也未定义指标。浮存金“免费/免息”不是永久属性；官方年报用承保结果衡量其成本。[F1] | 缺证据先删数字/具体交易叙事。若恢复，附年报年份、报表主体、日期和对应页；不把浮存金等同现金或永久零成本资本。 |
| P2，EN L64、L88 | 规模大让流动性“较不成问题”与 2024 股东信说明大规模交易难以快速进出的表述不一致；把 dividend payments 列为 Berkshire 日常现金储备目的也未交代母公司/子公司口径。[F1] | 删除想当然推断；若讨论流动性和分红，给出对应主体与期间，不暗示母公司常规发放股息。 |
| P2，EN L30、L38、L134、L169 | “2021 股东信大量讨论通胀”及多句名言没有原文定位；本轮没有逐条验证这些归属。 | 标记待核，无法定位官方原文就撤下引号与人物归因；不要把可能成立的常识包装成已经确认的 Buffett 观点。 |
| P2，EN L40-L46、L100-L154、L179 | 假定复利案例被用来推出一般优劣，随后给出面向读者的配置比例和退休适用建议，超出本次历史问答核验范围。 | 区分数学假设和实际投资表现；优先删去无依据的配置推荐，本旁路不补写替代方案。 |

官方依据限定：使用 **2024 年度报告**定位股东信印刷页 4、6-7 与 float 定义印刷页 K-6。后续实施与独立复核纠正了初稿误记的 K-7，以报告印刷页码为准。只用于以上定性反查，不宣称它是 2026 年最新持仓。若新增修订内容引用该报告，应标明修订日期，不能伪装成文章 frontmatter 的 2025-01-15 当天已经取得该年报。

### D. 主线后续补数：以固定分层为准

本段记录主代理采集并转交的美国桌面固定分层。全地区完整 B/C 数据已统一更新到追加部分开头的数据表；903 曝光/5.5 是 SDK 的全地区 B 数据，不与下面的美国桌面行混合。

固定比较窗口：B = **2026-07-30 至 2026-08-26**；C = **2026-08-27 至 2026-09-23**。两期均为 28 天。

| 精确 query × page × 国家 × 设备 | B | C | 可以直接报告的变化 |
| --- | --- | --- | --- |
| `claudesdkclient query hooks` × 英文 `/blog/claude-agent-sdk-python-/` × 美国 × 桌面 | 572 曝光，均位 5.5，0 点击 | 1392 曝光，均位 7.6，0 点击 | 曝光增加 820，均位后移 2.1，两期点击和 CTR 均为 0。不能写成已观察到点击流量损失。 |
| `bmad method` × 英文 notes 页 × 美国 × 桌面 | 39 曝光，均位 33.9，0 点击 | 36 曝光，均位 37.5，0 点击 | 曝光减少 3，均位后移 3.6，两期点击均为 0。曝光样本有限，不能据此识别变化原因。 |

事实与推测分界：

- 固定 query/page/国家/设备比站点级均位更有解释力；现在可以说这两个固定分层都出现均位后移，不能再笼统称“完全没有历史变化观测”。
- SDK 的曝光扩大与均位后移同时出现，零点击并不提供“点击下降”的证据；截断明确损害教程可完成性，但其排名影响大小与因果仍未知。
- BMAD 的安装/目录/权限/节省比例问题均是独立的修稿理由，不足以从这两个小窗口识别具体导致均位变化的机制。
- `bmad method` 英文全地区为 73 -> 66 曝光、29.9 -> 34.8 均位、1 -> 0 点击；美国桌面为 39 -> 36 曝光、33.9 -> 37.5 均位、0 -> 0 点击。两者是不同过滤口径，不能相互覆盖或直接混算。日文全地区为 54 -> 32 曝光、9.0 -> 9.6 均位、3 -> 0 点击，没有同等美国桌面过滤证据，不充当控制组。
- C 的 GSC 9 月 23 日可能包含 `d4d2dad` 的 **9 月 23 日 16:50:17 UTC**；不能断言本地 9 月 24 日编辑必然处于整个 C 窗口之后。该编辑不能解释其发生之前的下降，且没有部署、抓取及采用新正文的证据支持对 C 窗口末端归因。

主线另已确认 browser-extension、SDK、BMAD notes、OpenSpec notes、Buffett 五页取证时均为 HTTP 200、单 H1、自指 canonical、meta index follow、无 X-Robots-Tag。本旁路接受为主线当前证据，不再重复检查。这可排除这些页面在那个取证时点的上述显性异常，但不能证明历史状态、Google 实际索引状态或已采用新正文。SDK 内容核验只看代码块，没有把相关推荐混入截断判断。

### 追加来源目录

| 编号 | 官方原始来源 | 使用范围与边界 |
| --- | --- | --- |
| B1 | `https://github.com/bmad-code-org/BMAD-METHOD/releases/tag/v6.0.0` | v6 已有正式版本；不假设 main 等于 npm latest |
| B2 | `https://registry.npmjs.org/-/package/bmad-method/dist-tags` | 本次匿名 Invoke-RestMethod 读取的发布标签 JSON；不是执行安装结果 |
| B3 | `https://raw.githubusercontent.com/bmad-code-org/BMAD-METHOD/v6.0.0/docs/how-to/install-bmad.md`，L16-L19、L52、L60-L75 | 版本化的安装要求、目录与帮助入口 |
| B4 | `https://raw.githubusercontent.com/bmad-code-org/BMAD-METHOD/v6.0.0/src/bmm/module.yaml` | 模块安装配置字段，不支持原文猜测的强制 pre_commit 契约 |
| B5 | `https://raw.githubusercontent.com/bmad-code-org/BMAD-METHOD/v6.0.0/src/bmm/agents/dev.agent.yaml`，critical_actions | 角色指令与流程期望，不是 OS/工具沙箱的强制权限证据 |
| B6 | `https://raw.githubusercontent.com/bmad-code-org/BMAD-METHOD/main/README.md`，Start Building | 本次 main 的新安装路线，只做版本分流，不混入 v6 步骤 |
| C1 | `https://raw.githubusercontent.com/anthropics/claude-agent-sdk-python/v0.1.3/src/claude_agent_sdk/client.py`，ClaudeSDKClient / query / receive_response / disconnect | 文章声明版本的真实异步客户端生命周期和公开方法 |
| C2 | `https://raw.githubusercontent.com/anthropics/claude-agent-sdk-python/v0.1.3/src/claude_agent_sdk/__init__.py` | 官方导出，核对不存在文中 AsyncClaudeSDKClient |
| C3 | `https://raw.githubusercontent.com/anthropics/claude-agent-sdk-python/v0.1.3/src/claude_agent_sdk/types.py`，HookCallback / HookMatcher / AsyncHookJSONOutput / ClaudeAgentOptions | 旧版事件、参数、毫秒单位与没有 matcher timeout 字段 |
| C4 | `https://code.claude.com/docs/en/agent-sdk/python`，query、ClaudeSDKClient、Handle slow or stalled API responses | 当前参考；timeout 与 resume 等内容不能不标版本照搬到 0.1.3 |
| C5 | `https://code.claude.com/docs/en/agent-sdk/hooks`，Callback functions / Hook timeout / Session hooks not available in Python | 当前回调与 matcher、超时的事件差异、Python/TypeScript 差异；原 platform.claude.com 链接重定向到此 |
| C6 | `https://raw.githubusercontent.com/anthropics/claude-agent-sdk-python/v0.1.3/src/claude_agent_sdk/_internal/client.py`，L80-L109 | 模块级 query 的旧版 hooks 转换及仅 streaming 初始化路径 |
| F1 | `https://www.berkshirehathaway.com/2024ar/2024ar.pdf` | 官方年报；仅用明示页码做定性编辑核验，未输出未经年报支持的新持仓/回报数值 |

源码行号以上述 tag 的文件为准；main 和网页可能变化。文中没有把外部文档示例复制成声称已在此环境跑过的完整程序。BMAD 第三方 token 节省个案没有做全网穷尽性反证，“本次未找到官方可复现基准”不等于宣称任何工作负载都不可能节省相应 token。

### 追加验收与异常

- 本轮实际 shell 失败或异常：**无**。公开 HTTP 三语取证与 npm registry/GitHub tree 读取均成功；已等待公开抓取会话结束。
- 未重复主线五页基础 SEO 检查；未操作登录态浏览器、未运行 SDK/模型请求、未执行投资计算、未安装 BMAD，也未改文章或测试。
- 仅追加本报告。研究文件仍需独立检查尾随空白与代码围栏，因为未跟踪文件不在普通 `git diff --check` 的完整检查范围内。
- 最终复核已完成：本文件尾随空白 0 处，代码围栏无未闭合项，限定路径的 `git diff --check` 返回 0；HEAD 未变。工作区出现主线的 `docs/research/gsc-ranking-diagnosis-2026-09-26.md`，未读取或修改。
