---
title: "Modern Web Guidance 实测：Chrome 团队的前端 skill，让弱模型也写出原生 dialog 和 popover"
seoTitle: "Modern Web Guidance skill 值得装吗：OpenCode 三模型装与不装对照"
description: "热门 Skill 真机实测第一期。GoogleChrome/modern-web-guidance 1.0.1 装进 OpenCode 2.3.1，用 deepseek-v4.1-flash、mimo-v2.6-flash、hy4-flash 三个免费模型各跑一组装与不装的对照：同一个删除确认弹窗加下拉菜单的任务，装了 skill 的三次都过了 16 项浏览器检查，不装的有两个模型掉了 2 到 3 项（没用 <dialog>、Tab 能跳到背后页面、底部菜单超出视口）。代价是运行时间长了数倍、每次多读 28 到 53 KB 的 guide，查询词默认上报。"
pubDate: 2026-11-21T09:00:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "developer-tools", "Agent Skills", "frontend-development", "opencode"]
lang: "zh"
---

**结论先说：** 如果你让 coding agent 写前端，尤其用的是便宜或免费的小模型，GoogleChrome 的 modern-web-guidance 值得装。它不会让 agent 变聪明，作用是在写弹窗、菜单、表单这类代码之前，先去查一份 Chrome、Edge、Firefox 和 MDN 团队维护的 guide，然后照着用浏览器原生的 `<dialog>`、`popover`、CSS anchor positioning，而不是手写一套 div 加键盘监听。在同一个小任务上，三个免费模型装了 skill 都过了全部 16 项浏览器检查；不装时，mimo-v2.6-flash 和 hy4-flash 分别掉了 2 项和 3 项。deepseek-v4.1-flash 不装也全过，对它来说 skill 只是换了一种实现。代价也很明确：装了以后每次多读几十 KB 的 guide，运行时间长了好几倍，查询词默认发给 Google。

在项目根目录装，装之前先关掉遥测。Claude Code、Codex、Copilot CLI 等也可以走各自的插件市场，命令在 README 里：[1]

```bash
export DISABLE_TELEMETRY=1
npx -y modern-web-guidance@latest install          # 交互式，选 agent 和安装位置
npx -y modern-web-guidance@1.0.1 install -a opencode -y   # 本文用的非交互写法
```

| 你的情况 | 建议 |
| --- | --- |
| 前端任务多，用的是小模型或免费模型 | 装。本次测试里收益最明显的就是这类模型 |
| 用强模型，主要写后端或脚本 | 可以不装。skill 的描述明确写了后端、CI、脚本不触发 |
| 有自己的组件库和设计规范 | 组件库优先。guide 给的是通用写法，不知道你的约定 |
| 公司网络不能访问 npm，或不能上报查询 | 先评估。每次查询都要联网跑 `npx`，遥测要手动关 |
| 必须支持旧浏览器或 Firefox 的特定版本 | 装了也要自己测回退路径。本文只在 Chrome 156 上验证 |

这是「热门 Skill 真机实测」专题的第一期。Agent Skills 是什么、怎么装，见 [Agent Skills 入门指南](/cn/blog/agentskills-io-starter-guide/)；这类 skill 在整个生命周期里处在什么位置，见 [Agent Skills 2026 综述](/cn/blog/agent-skills-2026-survey-lifecycle-map/)。

## 为什么这一期测它

Modern Web Guidance 是 Chrome 团队牵头、和 Edge、Firefox、MDN 一起维护的一组 Agent Skills，内容是 200 多篇前端实现指南，加上 Baseline 浏览器兼容数据。[1] 1.0 版在 11 月 10 日发布，作者在 Hacker News 的 Show HN 帖拿到 449 分、146 条评论。[2] 11 月 16 日发了 1.0.1，这也是本文测的版本。[3] 本周它的源码仓 `GoogleChrome/modern-web-guidance-src` 在 GitHub TypeScript 周榜上新增 5224 星，和 mattpocock/skills（5337）、anthropics/skills（4086）在同一个量级。[4]

官方给的效果数字很高。作者在 HN 帖里说，用 Codex、Claude Code、Antigravity 跑 200 个任务、约 1700 条 Playwright 和 AST 断言，不装 skill 平均通过 55%，装了 92%。[2] README 里 11 月 8 日的一组是 Claude Code 57% 到 88%，Codex 54% 到 82%。[1] 这些是它自己出题、自己评分的结果。本文用一个它没见过的小任务、三个它没测过的免费模型，看这个提升在别人的环境里还剩多少。

## 安装：复制了 2.5 MB，实际用到的只有 SKILL.md

`install -a opencode -y` 从 GitHub 克隆仓库，只装 `modern-web-guidance` 这一个 skill（仓库里另一个 `chrome-extensions` 默认不装），复制到 `./.agents/skills/modern-web-guidance`，并写一个 `skills-lock.json` 记下 commit。

![modern-web-guidance 1.0.1 安装输出：克隆仓库，找到 2 个 skill，选中 modern-web-guidance，复制到 ./.agents/skills/modern-web-guidance；目录里有 SKILL.md 和 guides，210 个 guide 文件，共 2.5M；skills-lock.json 记录 commit 64a6d708](/assets/modern-web-guidance-skill-hands-on/install.webp)

目录里有 210 篇 guide，但三次带 skill 的运行里，没有一次读过本地的 guides 目录。SKILL.md 规定的流程是每次都调 `npx -y modern-web-guidance@latest search` 和 `retrieve`，由 npm 上最新版的 CLI 返回 guide 内容。本地那份 `dialog.md` 和 CLI 返回的内容一字不差，所以这次没有出错，但要知道两件事：

- `skills-lock.json` 锁住的是 SKILL.md，锁不住 guide。npm 上的 `@latest` 一更新，agent 读到的内容就跟着变。
- 每次查询都要联网。CLI 默认收集安装次数、调用它的 agent 名称、检索的 guide id 和 agent 生成的查询词，设 `DISABLE_TELEMETRY=1` 才关。[1]

## 装上之后，agent 的流程多了五步

SKILL.md 的 `description` 写得很重：前端的 HTML、CSS、客户端 JS 任务都要「MANDATORY: Execute FIRST」，还列了一长串触发词，从 modal、popover 到 passkeys、WebAssembly。README 说这段描述约 205 token。[1] 正文规定了四步：用 2 到 5 个英文词搜索，按 id 取回 guide，写完后对照 guide 检查，最后在回答末尾用 `### Modern Web Guidance` 小节说明用了哪些 guide。

<figure class="not-prose my-6"><svg viewBox="0 0 680 530" role="img" aria-label="装上之后，agent 多走的五步" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:680px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><defs><marker id="mwg-flow-cn" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor" fill-opacity="0.6"/></marker></defs><text x="10" y="24" font-size="15.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">装上之后，agent 多走的五步</text><rect x="20" y="46" width="430" height="58" rx="8" fill="currentColor" fill-opacity="0.05" stroke="currentColor" stroke-opacity="0.35" stroke-width="1.2"/><text x="34" y="69" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">SKILL.md 的描述常驻上下文</text><text x="34" y="89" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">约 205 token，写着前端任务 MANDATORY: Execute FIRST</text><text x="466" y="71" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.85">本地还复制了 210 篇 guide</text><text x="466" y="89" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.6">三次实测都没读它们</text><line x1="235" y1="106" x2="235" y2="122" stroke="currentColor" stroke-opacity="0.55" stroke-width="1.5" marker-end="url(#mwg-flow-cn)"/><rect x="20" y="124" width="430" height="58" rx="8" fill="currentColor" fill-opacity="0.05" stroke="currentColor" stroke-opacity="0.35" stroke-width="1.2"/><text x="34" y="147" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">模型判断命中，加载 SKILL.md 正文</text><text x="34" y="167" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">三个模型都在读完 TASK.md 后立刻调用 Skill</text><text x="466" y="149" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.85">触发率 3/3</text><line x1="235" y1="184" x2="235" y2="200" stroke="currentColor" stroke-opacity="0.55" stroke-width="1.5" marker-end="url(#mwg-flow-cn)"/><rect x="20" y="202" width="430" height="58" rx="8" fill="currentColor" fill-opacity="0.12" stroke="currentColor" stroke-opacity="0.35" stroke-width="1.2"/><text x="34" y="225" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">npx modern-web-guidance@latest search</text><text x="34" y="245" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">2 到 5 个词的查询，返回 guide id 和描述</text><text x="466" y="227" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.85">每次联网拉 @latest</text><text x="466" y="245" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.6">查询词默认上报 Google</text><line x1="235" y1="262" x2="235" y2="278" stroke="currentColor" stroke-opacity="0.55" stroke-width="1.5" marker-end="url(#mwg-flow-cn)"/><rect x="20" y="280" width="430" height="58" rx="8" fill="currentColor" fill-opacity="0.12" stroke="currentColor" stroke-opacity="0.35" stroke-width="1.2"/><text x="34" y="303" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">npx modern-web-guidance@latest retrieve</text><text x="34" y="323" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">把 dialog、menu 等 guide 写进 /tmp/mwg-guide-*.md</text><text x="466" y="305" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.85">每次 28 到 53 KB</text><text x="466" y="323" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.6">agent 再整篇读进上下文</text><line x1="235" y1="340" x2="235" y2="356" stroke="currentColor" stroke-opacity="0.55" stroke-width="1.5" marker-end="url(#mwg-flow-cn)"/><rect x="20" y="358" width="430" height="58" rx="8" fill="currentColor" fill-opacity="0.05" stroke="currentColor" stroke-opacity="0.35" stroke-width="1.2"/><text x="34" y="381" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">按 guide 写代码，再逐条对照</text><text x="34" y="401" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">showModal()、popover、position-area，加回退</text><text x="466" y="383" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.85">16 项检查全过 3/3</text><line x1="235" y1="418" x2="235" y2="434" stroke="currentColor" stroke-opacity="0.55" stroke-width="1.5" marker-end="url(#mwg-flow-cn)"/><rect x="20" y="436" width="430" height="58" rx="8" fill="currentColor" fill-opacity="0.05" stroke="currentColor" stroke-opacity="0.35" stroke-width="1.2"/><text x="34" y="459" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">回答末尾写 ### Modern Web Guidance</text><text x="34" y="479" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">每个用到的 guide 一条，引一句原文</text><text x="466" y="461" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.85">两次运行没写到这里</text><text x="466" y="479" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.6">自测卡住，15 分钟超时</text><line x1="458" y1="46" x2="458" y2="494" stroke="currentColor" stroke-opacity="0.18" stroke-dasharray="3 4"/><text x="20" y="518" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.65">数据：OpenCode 2.3.1 + modern-web-guidance 1.0.1，deepseek-v4.1-flash、mimo-v2.6-flash、hy4-flash 三个免费模型。</text></svg></figure>

三个模型都在动手写代码之前调用了 Skill 工具，搜索词也几乎一样。下面是 hy4-flash 的一段：两次 `search` 分别查弹窗和菜单，各返回 10 条候选，然后一次 `retrieve` 取回 `menu,viewport-aware-dropdowns`，另一次取回 dialog 相关的四篇。

![hy4-flash-free 的终端：加载 modern-web-guidance skill，search "confirmation modal dialog" 和 "popover menu dropdown" 各返回 guide id 和描述，retrieve 输出 41.1 KB 和 28.1 KB，分别存到 /tmp/mwg-guide-*.md，agent 读完两个文件后写 index.html、styles.css、app.js](/assets/modern-web-guidance-skill-hands-on/agent-search.webp)

guide 超过 9.5 KB 时，CLI 不直接打印，而是写进 `/tmp/mwg-guide-*.md`，再叫 agent 用文件读取工具整篇读完。deepseek 那次一口气取了 `dialog,menu,viewport-aware-dropdowns`，一个文件就是 53.2 KB、819 行。这是这个 skill 最主要的开销来源，后面再说。

写完代码，deepseek 按第四步在回答末尾写了说明，每条都引了 guide 原文。比如它没给菜单加 `role="menu"`，理由是 guide 说不实现完整的方向键交互就不要声明这个角色。

![deepseek-v4.1-flash-free 最后的回答：What changed 小节列出删除确认和 More 菜单的改动；Modern Web Guidance 小节有 dialog、menu、viewport-aware-dropdowns 三条，各引一句 guide 原文](/assets/modern-web-guidance-skill-hands-on/disclosure.webp)

## 对照实验：一个删除确认加一个下拉菜单

任务是一个 3 行成员列表的静态页面，没有构建步骤。TASK.md 只描述行为，不提任何 API 名：

1. 点 Delete 先弹窗问「Remove 名字 from the team?」，有 Cancel 和 Remove。弹窗打开时背后页面不能点，Esc 或 Cancel 关闭且不删除。
2. 点 More 在按钮正下方弹出一个小菜单，有 Copy email 和 Make admin 两项（先 `console.log`）。点别处或按 Esc 关闭。

每个模型跑两份：一份目录里装了 skill，一份没装，其余完全相同，都用 `opencode run --auto` 跑，15 分钟超时。跑完用 Playwright 驱动 Chrome 156 做 16 项检查：11 项对应 TASK.md 的要求，5 项是任务没写、但用户会碰到的情况（焦点是否进入弹窗、Tab 会不会跳到背后页面、关闭后焦点是否回到原按钮、菜单在视口底部时会不会被切掉）。其中「删除确认用的是不是 `<dialog>`」这一项检查的是实现方式，不是用户能看到的行为。

<figure class="not-prose my-6"><svg viewBox="0 0 680 260" role="img" aria-label="同一任务，装与不装（16 项浏览器检查）" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:680px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><defs><marker id="mwg-cmp-cn" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor" fill-opacity="0.6"/></marker></defs><text x="10" y="24" font-size="15.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">同一任务，装与不装（16 项浏览器检查）</text><text x="250.0" y="54" font-size="12" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">装 skill</text><text x="250.0" y="70" font-size="10.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.65">检查通过</text><text x="370.0" y="54" font-size="12" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">不装</text><text x="370.0" y="70" font-size="10.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.65">检查通过</text><text x="490.0" y="54" font-size="12" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">装 skill</text><text x="490.0" y="70" font-size="10.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.65">运行时间</text><text x="610.0" y="54" font-size="12" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">不装</text><text x="610.0" y="70" font-size="10.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.65">运行时间</text><text x="14" y="109" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">deepseek-v4.1-flash</text><rect x="194.0" y="88" width="112.0" height="32" rx="6" fill="currentColor" fill-opacity="0.16" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.2"/><text x="250.0" y="109" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">16/16</text><rect x="314.0" y="88" width="112.0" height="32" rx="6" fill="currentColor" fill-opacity="0.16" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.2"/><text x="370.0" y="109" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">16/16</text><rect x="434.0" y="88" width="112.0" height="32" rx="6" fill="currentColor" fill-opacity="0.03" stroke="currentColor" stroke-opacity="0.25" stroke-width="1.2"/><text x="490.0" y="109" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.8">7 分 07 秒</text><rect x="554.0" y="88" width="112.0" height="32" rx="6" fill="currentColor" fill-opacity="0.16" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.2"/><text x="610.0" y="109" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">1 分 25 秒</text><text x="14" y="149" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">mimo-v2.6-flash</text><rect x="194.0" y="128" width="112.0" height="32" rx="6" fill="currentColor" fill-opacity="0.16" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.2"/><text x="250.0" y="149" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">16/16</text><rect x="314.0" y="128" width="112.0" height="32" rx="6" fill="currentColor" fill-opacity="0.03" stroke="currentColor" stroke-opacity="0.25" stroke-width="1.2"/><text x="370.0" y="149" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.8">14/16</text><rect x="434.0" y="128" width="112.0" height="32" rx="6" fill="currentColor" fill-opacity="0.03" stroke="currentColor" stroke-opacity="0.25" stroke-width="1.2"/><text x="490.0" y="149" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.8">15 分钟超时*</text><rect x="554.0" y="128" width="112.0" height="32" rx="6" fill="currentColor" fill-opacity="0.16" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.2"/><text x="610.0" y="149" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">8 分 38 秒</text><text x="14" y="189" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">hy4-flash</text><rect x="194.0" y="168" width="112.0" height="32" rx="6" fill="currentColor" fill-opacity="0.16" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.2"/><text x="250.0" y="189" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">16/16</text><rect x="314.0" y="168" width="112.0" height="32" rx="6" fill="currentColor" fill-opacity="0.03" stroke="currentColor" stroke-opacity="0.25" stroke-width="1.2"/><text x="370.0" y="189" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.8">13/16</text><rect x="434.0" y="168" width="112.0" height="32" rx="6" fill="currentColor" fill-opacity="0.03" stroke="currentColor" stroke-opacity="0.25" stroke-width="1.2"/><text x="490.0" y="189" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.8">15 分钟超时*</text><rect x="554.0" y="168" width="112.0" height="32" rx="6" fill="currentColor" fill-opacity="0.16" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.2"/><text x="610.0" y="189" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">38 秒**</text><text x="14" y="224" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.65">* 代码已写完，卡在自测阶段被 timeout 900 结束。** 写完代码后撞上免费额度上限。</text><text x="14" y="240" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.65">不装时失败的是：没用 &lt;dialog&gt;、Tab 能跳到背后页面、底部菜单超出视口。</text></svg></figure>

![同一个模型 hy4-flash-free 的两份产物跑同一套检查：装了 skill 的 16 项全部 PASS；没装的在 Delete opens a modal dialog、Tab never reaches the page behind、Menu stays inside a short viewport 三项 FAIL](/assets/modern-web-guidance-skill-hands-on/verify-hy4.webp)

各份产物用了哪些平台特性：

| | 删除确认 | More 菜单 | 菜单定位 | 背后页面 |
| --- | --- | --- | --- | --- |
| deepseek 装 | `<dialog>` + `showModal()` + `form method="dialog"` | `popover` + `popovertarget` | `position-area` + `position-try-fallbacks`，不支持时 JS 回退 | 浏览器自动 inert |
| deepseek 不装 | `<dialog>` + `showModal()` | div，JS 开关 | JS 算坐标，会翻转 | 浏览器自动 inert |
| mimo 装 | `<dialog>` + `form method="dialog"` | `popover` + `commandfor`，还用了实验中的 `focusgroup` | `position-area`，JS 回退 | 浏览器自动 inert |
| mimo 不装 | div 遮罩 + `aria-modal` | 动态创建 div | JS 算坐标，不翻转 | 手动 `main.inert = true` |
| hy4 装 | `<dialog>` + `form method="dialog"` | `popover` + `popovertarget` | `position-area`，JS 回退会翻转 | 浏览器自动 inert |
| hy4 不装 | div 遮罩 + `role="alertdialog"` | 动态创建 `<ul>` | JS 算坐标，不翻转 | 什么都没做，只靠遮罩挡鼠标 |

有一个观察值得单独说：deepseek-v4.1-flash 不装 skill 也选了 `<dialog>`，16 项全过，只用了 1 分 25 秒。对能力够的模型，这个 skill 改变的是写法（菜单改用 `popover` 和 anchor positioning），不是对错。HN 上也有人说跑完 legacy-scan 只找到两处问题，觉得这个 skill「对弱模型更有用」。[2]

## 区别在键盘和边缘情况里

两份弹窗截图几乎一样。都是灰色遮罩、居中卡片、两个按钮，背后的页面也都点不动。

![hy4-flash-free 两份产物的删除确认弹窗：左边用 dialog 加 showModal，右边用 div 遮罩，外观几乎相同](/assets/modern-web-guidance-skill-hands-on/dialog-look.webp)

按几下 Tab 就不一样了。`showModal()` 打开的 `<dialog>` 会让浏览器把页面其余部分设为 inert，Tab 在弹窗的按钮和浏览器界面之间切换，落不到背后页面的按钮上。hy4 不装 skill 写的 div 遮罩只挡住了鼠标，按两下 Tab，焦点就跑到背后第一行的 More 和 Delete 上。用键盘或读屏软件的人，这时候按回车会触发背后页面的按钮。

![按 4 次 Tab 后：左边装了 skill，焦点仍在弹窗的 Remove 按钮上；右边没装，焦点框出现在遮罩背后第一行的 Delete 按钮上](/assets/modern-web-guidance-skill-hands-on/tab-focus.webp)

菜单的区别在视口底部。把窗口高度压到 250 像素，滚到底，点最后一行的 More。装了 skill 的三份都用了 `position-try-fallbacks: flip-block`，空间不够时菜单自动翻到按钮上方。mimo 和 hy4 不装时写的是 JS 计算坐标，只往下放，菜单被切掉一半，要滚动才能看到第二项。deepseek 不装时自己写了翻转逻辑，这一项也过了。

![窗口高 250 像素时点最后一行的 More：左边装了 skill，菜单翻到按钮上方完整显示；右边没装，菜单从按钮下方伸出视口，只露出 Copy email](/assets/modern-web-guidance-skill-hands-on/edge-menu.webp)

代码量差别不大。hy4 装 skill 的版本 JS 只有 52 行非空行，不装的是 71 行，因为焦点、Esc、点外部关闭都交给了浏览器。deepseek 装 skill 的版本反而有 109 行，多出来的是给不支持 Popover API 和 anchor positioning 的浏览器写的回退分支。guide 要求非 Baseline 广泛可用的特性必须带回退，模型照做了。

## 代价：时间、上下文和网络

装了 skill 的运行都慢得多。deepseek 从 1 分 25 秒变成 7 分 07 秒。mimo 和 hy4 装 skill 后都没能正常结束。hy4 开跑 1 分 12 秒就写完了代码，mimo 用了 8 分半，写出的代码检查全过；但之后它们都自己写 Chrome DevTools 协议脚本做自测，卡住，直到 15 分钟超时。mimo 第一次尝试还在读 guide 文件时就停住了，第二次才写出代码。不装 skill 的 mimo 也做了自测，用了 8 分 38 秒正常结束。所以超时不能全算在 skill 头上，但 SKILL.md 第三步要求「对照 guide 检查」，看起来让这两个模型更想去浏览器里验证 guide 里写的每一种行为。

token 消耗也涨了。deepseek 那组装 skill 时输入 58,574 token、输出 10,892、缓存读取 127 万；不装时分别是 15,218、4,144 和 11 万。53 KB 的 guide 文件读进上下文后，后面每一轮都要带着它。

还有两个副作用：

- hy4 装 skill 那次在项目根目录留下了一个 `__test.html`，是它自测用的，任务结束后没删。
- 每个 `search` 和 `retrieve` 都是一次 `npx` 调用。hy4 自己加了 `NPM_CONFIG_CACHE=/tmp/npm-cache`，这是 SKILL.md 里给沙箱环境的建议。在需要逐条批准命令的 harness 里，SKILL.md 建议只把 `npx -y modern-web-guidance@latest *` 加进白名单，别放开整个 `npx *`。

## 坑和限制

**guide 不保证被用上。** 无障碍专家 Adrian Roselli 在 5 月测过早期版本：Antigravity 加上 Modern Web Guidance 写的手风琴组件，动画在 Firefox 里不工作，还有几处 WCAG 问题，尽管相关 guide 里已经写了对应规则。为 Google 做顾问的一位专家回复说，模型是非确定的，guide 被检索到也可能没被读完。[5] 本次的三次运行都读完了 guide，但样本只有一个任务。

**只在 Chrome 上验证了。** 装 skill 的三份产物都给 anchor positioning 写了 JS 回退，但测试只跑了 Chrome 156，回退分支没有执行过。要支持 Safari 或 Firefox 的较老版本，回退路径要自己测。

**`MANDATORY` 的描述会和别的 skill 抢。** 它的 description 要求所有前端任务「先执行」。如果你还装了自己团队的前端规范 skill 或者设计系统 skill，两者都会声称自己该先跑。同类 skill 互相顶替的问题，见 [同装 skill 互相冲突](/cn/blog/co-installed-agent-skills-conflicts/)。

**本地 guide 是摆设。** 2.5 MB 的 guides 目录不参与默认流程。如果你的环境断网，SKILL.md 只建议加 `--offline` 重试 npx 缓存，并没有改读本地文件。想让 agent 只读 skill 目录、按需展开，可以看 [Progressive Disclosure](/cn/blog/progressive-disclosure-agent-skills/) 里对这种设计取舍的讨论。

## 测了什么，没测什么

实测过的（OpenCode 2.3.1，Linux x64，OpenCode Zen 免费模型，每次运行都设 `DISABLE_TELEMETRY=1`）：

- 用 `npx -y modern-web-guidance@1.0.1 install -a opencode -y` 安装两次，commit 都是 `64a6d708`，两次装出的目录完全相同。
- deepseek-v4.1-flash、mimo-v2.6-flash、hy4-flash 三个模型，同一任务各一组装与不装，共 6 份产物，每份跑同一套 16 项 Playwright 检查。
- 三次带 skill 的运行都触发了 skill，都调用了 `search` 和 `retrieve`，都没有读本地 guides 目录。
- 本地 guide 文件和 CLI 返回的内容一致（只差 CLI 加的一行标题）。

没测到的：

- big-pickle 只跑完了不装 skill 的一组（14/16，同样没用 `<dialog>`、底部菜单超出视口），装 skill 的一组撞上免费额度，没有对照。hy4 不装 skill 那组也在写完代码后撞上额度，没来得及自测。
- 强模型（Claude、GPT、Gemini 的旗舰款）的装与不装对照。官方评测说的就是这些模型。[1]
- `legacy-scan` 模式（扫描旧代码并现代化）。
- Firefox 和 Safari，以及装 skill 产物里的 JS 回退分支。
- 每个模型只跑了一次，没有重复取样。

## 参考来源

1. GoogleChrome/modern-web-guidance README（安装方式、Telemetry & Privacy、Recent eval results）：<https://github.com/GoogleChrome/modern-web-guidance>
2. Show HN: Get your coding agent off ~2019 JavaScript, onto modern web primitives（2026-11-10）：<https://news.ycombinator.com/item?id=50443812>
3. npm 包 modern-web-guidance 1.0.1；GitHub release v1.0.1：<https://www.npmjs.com/package/modern-web-guidance>、<https://github.com/GoogleChrome/modern-web-guidance/releases/tag/v1.0.1>
4. GitHub Trending，TypeScript 与 Shell、Python 周榜（2026-11-21 北京时间）：<https://github.com/trending/typescript?since=weekly>
5. Adrian Roselli，Maybe Don't Rely on Google's "Modern Web Guidance"（2026-05-25，6 月 24 日更新）：<https://adrianroselli.com/2026/05/maybe-dont-rely-on-googles-modern-web-guidance.html>
6. Modern Web Guidance 文档与 guide 浏览：<https://developer.chrome.com/docs/modern-web-guidance>；评测看板：<https://googlechrome.github.io/modern-web-guidance-src/>
