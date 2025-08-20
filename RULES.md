# Development Rules and Guidelines

## Rule 1: Complete i18n Routing Structure
**Date**: 2025-08-19
**Context**: Fixed empty Chinese blog page issue at `/cn/blog/tailwind-tricks`

### Problem
The i18n implementation was incomplete - while there were Chinese content collections (`blog-cn`) and a Chinese blog listing page (`/cn/blog/index.astro`), there was no individual blog post page for Chinese content (`/cn/blog/[slug].astro`).

### Solution
- Always ensure complete routing structure for both languages
- For every dynamic route in English (`/blog/[slug].astro`), create corresponding Chinese route (`/cn/blog/[slug].astro`)
- Maintain consistent URL patterns: `/cn/blog/slug` for Chinese, `/blog/slug` for English

### Implementation Requirements
1. **Content Collections**: Separate collections for each language (`blog-cn`, `blog-en`, `talks-cn`, `talks-en`)
2. **Page Structure**: Mirror page structure for both languages
   ```
   src/pages/
   ├── blog/
   │   ├── index.astro (English listing)
   │   └── [slug].astro (English posts)
   └── cn/
       └── blog/
           ├── index.astro (Chinese listing)
           └── [slug].astro (Chinese posts)
   ```
3. **Static Path Generation**: Each language-specific page should generate paths only for its language content
4. **Consistent Styling**: Use same layout and styling components across languages

### Future Considerations
- When adding new content types, always create both English and Chinese versions
- Test both language routes during development
- Ensure proper language detection and content loading in i18n utilities

## Rule 2: Always Initialize Rule Files
**Date**: 2025-08-19
**Context**: User preference for maintaining development rules

### Requirement
- Always create or update a RULES.md file when implementing solutions
- Document patterns, fixes, and guidelines for future reference
- Turn user modifications and preferences into reusable rules

### Format
Each rule should include:
- Date and context
- Problem description
- Solution approach
- Implementation requirements
- Future considerations

## Rule 3: Page Structure Consistency Between Languages
**Date**: 2025-08-19
**Context**: Fixed Chinese blog page layout inconsistency with incorrect indentation and different structure

### Problem
Chinese pages (`/cn/`) were using different layout structures compared to English pages (`/`), causing:
- Inconsistent user experience between languages
- Different component positioning (e.g., Table of Contents using grid layout vs fixed positioning)
- Maintenance difficulties due to divergent code structures

### Solution
Chinese pages must maintain identical structure to English pages, differing only in:
- Text content and translations
- Language-specific date formatting
- Language-specific URL paths (`/cn/` prefix)

### Implementation Requirements
1. **Layout Structure**: Identical HTML structure and CSS classes
2. **Component Usage**: Same components with same positioning (e.g., `TableOfContents` with fixed positioning)
3. **JavaScript Functionality**: Identical interactive features (smooth scrolling, highlighting, etc.)
4. **Metadata**: Same structured data and SEO settings with translated content
5. **Styling**: Consistent visual appearance and responsive behavior

### Specific Examples
- Blog post pages: Both `/blog/[slug].astro` and `/cn/blog/[slug].astro` must use fixed-positioned TableOfContents
- Article containers: Same `max-w-3xl bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8` styling
- Navigation: Same component structure with translated labels

### Future Considerations
- Any structural changes to English pages must be immediately applied to Chinese pages
- Use shared components where possible to enforce consistency
- Regular audits to ensure structural parity between language versions

## Rule 4: Chinese Blog Content Organization and Translation Workflow
**Date**: 2025-08-20
**Context**: User requirement for proper handling of originally Chinese blog posts with English translations

### Problem
When a blog post is originally written in Chinese, it needs to be properly organized and translated to maintain content consistency across both language versions.

### Solution
For originally Chinese blog posts:
1. **Primary Location**: Place the original Chinese content in `src/content/blog-cn/`
2. **Translation Requirement**: Create an English translation and place it in `src/content/blog-en/`
3. **Content Synchronization**: Ensure both versions have consistent metadata and structure
4. **Quality Control**: English translations should maintain the original meaning and technical accuracy

### Implementation Requirements
1. **File Organization**:
   ```
   src/content/
   ├── blog-cn/
   │   └── original-chinese-post.md (Original Chinese content)
   └── blog-en/
       └── original-chinese-post.md (English translation)
   ```

2. **Metadata Consistency**:
   - Same filename for both language versions
   - Consistent frontmatter structure with translated titles and descriptions
   - Same tags (translated where appropriate)
   - Same publication date

3. **Content Quality**:
   - English translations should be complete and accurate
   - Technical terms should be properly translated or explained
   - Code examples and technical content should remain consistent
   - Cultural references should be adapted for English-speaking audience when necessary

4. **Translation Workflow**:
   - Identify source language of new content
   - Place original content in appropriate language folder (`blog-cn` for Chinese originals)
   - Create high-quality translation for the other language
   - Ensure both versions are accessible through proper routing

### Future Considerations
- Consider implementing automatic translation suggestions for initial drafts
- Maintain translation quality standards through review processes
- Track which posts are originals vs translations for content management
- Ensure SEO optimization for both language versions

## Rule 5: Content Audit and Misplacement Resolution
**Date**: 2025-08-20
**Context**: Fixed misplaced Chinese content in English blog folder and established audit procedures

### Problem
Blog content was incorrectly placed in wrong language folders:
- `model-context-protocol.md` in `blog-en` contained Chinese content
- `multi-agent-system.md` in `blog-en` contained Chinese content
- Missing English translations for some Chinese posts

### Solution
1. **Immediate Fixes Applied**:
   - Removed misplaced Chinese `model-context-protocol.md` from `blog-en`
   - Created proper English translation in `blog-en/model-context-protocol.md`
   - Moved Chinese `multi-agent-system.md` content to `blog-cn/multi-agent-system.md`
   - Created English translation in `blog-en/multi-agent-system.md`

2. **Content Audit Process**:
   - Use PowerShell commands to detect language mismatches
   - Check for Chinese characters in English folders: `[\u4e00-\u9fff]` regex pattern
   - Verify all Chinese posts have English translations and vice versa

### Implementation Requirements
1. **Regular Audits**: Periodically check for content misplacement using automated scripts
2. **Language Detection**: Use regex patterns to identify content language
3. **Translation Completeness**: Ensure every post exists in both languages
4. **Quality Control**: Verify translations maintain technical accuracy and cultural appropriateness

### Audit Commands
```powershell
# Check for Chinese content in English folders
Get-ChildItem "src/content/blog-en/*.md" | ForEach-Object {
    $content = Get-Content $_.FullName -TotalCount 20;
    if (($content -join " ") -match '[\u4e00-\u9fff]') {
        Write-Host "Chinese content found in: $($_.Name)"
    }
}

# Check for missing translations
$cnFiles = Get-ChildItem "src/content/blog-cn/*.md" | ForEach-Object { $_.BaseName }
$enFiles = Get-ChildItem "src/content/blog-en/*.md" | ForEach-Object { $_.BaseName }
$cnFiles | Where-Object { $_ -notin $enFiles } | ForEach-Object { Write-Host "Missing English translation for: $_" }
$enFiles | Where-Object { $_ -notin $cnFiles } | ForEach-Object { Write-Host "Missing Chinese translation for: $_" }
```

### Current Status
- ✅ Fixed `model-context-protocol.md` misplacement
- ✅ Fixed `multi-agent-system.md` misplacement
- ✅ Both posts now accessible at correct URLs with proper language content
- ⚠️ Identified 5 English posts without Chinese translations:
  - `Applying-MCTS-for-Customer-Engagement`
  - `Awesome-Manus-Like-Projects`
  - `blockchain-for-python-developers`
  - `pocketflow-tracing`
  - `windows-cmd-proxy-config-using-netsh`

### Future Considerations
- Implement automated content placement validation in CI/CD pipeline
- Create translation workflow for the 5 identified English-only posts
- Establish content review process before publishing to prevent misplacement
