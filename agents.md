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

### File Naming Conventions
- Use kebab-case for filenames: `my-blog-post.md`
- Keep filenames descriptive but concise
- Match filename to content slug/URL

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
- Tag detail routes are currently generated from blog tags that occur at least twice. New content types such as Meditations must not render unconditional `/tags/.../` links; use `getTagCounts()` and render a plain tag when the corresponding route is not generated.
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
