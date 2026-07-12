# Guidelines for AI Agents Working on This Codebase

This document contains important guidelines and best practices for AI agents working on this project. Following these guidelines ensures consistency, quality, and SEO optimization.

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
