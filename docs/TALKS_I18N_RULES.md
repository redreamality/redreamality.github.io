# Talks Internationalization Rules

## Directory Structure

### Content Organization
```
src/content/
├── talks-cn/          # Chinese talks (original Chinese content)
├── talks-en/          # English talks (original English content or translations)
└── talks/             # DEPRECATED - no longer used
```

### Page Routes
```
src/pages/
├── talks/
│   ├── index.astro    # English talks listing (/talks)
│   └── [slug].astro   # English talk details (/talks/slug)
└── cn/talks/
    ├── index.astro    # Chinese talks listing (/cn/talks)
    └── [slug].astro   # Chinese talk details (/cn/talks/slug)
```

## Content Rules

### 1. Original Language Placement
- **Chinese original talks**: Place in `src/content/talks-cn/`
- **English original talks**: Place in `src/content/talks-en/`

### 2. Translation Placement
- **Chinese → English translation**: Create in `src/content/talks-en/`
- **English → Chinese translation**: Create in `src/content/talks-cn/`

### 3. Frontmatter Requirements
All talk files must include:
```yaml
---
title: "Talk Title"
description: "Talk description"
date: 2024-01-20
location: "Event Location"
slides: "https://slides-url.com"  # optional
video: "https://video-url.com"    # optional
lang: zh                          # 'zh' for Chinese, 'en' for English
translatedFrom: "original-slug"   # Reference to original talk slug
---
```

### 4. File Naming
- Use kebab-case for file names
- Keep the same slug across languages for the same talk
- Example: `multi-agent-system.md` in both `talks-cn/` and `talks-en/`

## URL Structure

### English Talks
- **Listing**: `/talks/`
- **Detail**: `/talks/{slug}/`

### Chinese Talks
- **Listing**: `/cn/talks/`
- **Detail**: `/cn/talks/{slug}/`

## Implementation Details

### Content Collections
The system uses separate collections for each language:
- `talks-cn`: Chinese talks collection
- `talks-en`: English talks collection

### i18n Functions
- `getTalks(lang)`: Retrieves talks for specified language
- `getLocalizedContent(slug, 'talks', lang)`: Gets talk with language fallback
- `getTranslationStatus(slug, 'talks')`: Checks translation availability

### Page Generation
- English pages use `getTalks('en')` to get talks from `talks-en` collection
- Chinese pages use `getTalks('zh')` to get talks from `talks-cn` collection

## Migration Process

When moving existing talks to the new structure:

1. **Identify original language** of the talk
2. **Move to appropriate directory**:
   - Chinese original → `talks-cn/`
   - English original → `talks-en/`
3. **Update frontmatter** with `lang` and `translatedFrom` fields
4. **Remove from old location** (`src/content/talks/`)
5. **Test build** to ensure routing works correctly

## Best Practices

### Content Management
- Always specify the original language in frontmatter
- Use `translatedFrom` to link translations to originals
- Maintain consistent slugs across languages
- Include location and date information for all talks

### Translation Workflow
- Create translations in the appropriate language directory
- Reference the original slug in `translatedFrom` field
- Maintain the same file structure and naming convention
- Update any internal links to match the new structure

### Quality Assurance
- Run `npm run build` to verify all routes generate correctly
- Check that both `/talks/` and `/cn/talks/` listings work
- Verify individual talk pages load in both languages
- Ensure navigation between languages functions properly

## Example Implementation

### Chinese Original Talk
**File**: `src/content/talks-cn/multi-agent-system.md`
```yaml
---
title: "多智能体系统"
description: "多智能体系统，从基础到实践"
date: 2025-02-28
location: "线上分享"
slides: "https://redreamality.com/multi-agent-system-slides"
lang: zh
translatedFrom: "multi-agent-system"
---
```

### English Translation
**File**: `src/content/talks-en/multi-agent-system.md`
```yaml
---
title: "Multi-Agent Systems: From Theory to Practice"
description: "Multi-agent systems, from fundamentals to practical implementation"
date: 2025-02-28
location: "Online Presentation"
slides: "https://redreamality.com/multi-agent-system-slides"
lang: en
translatedFrom: "multi-agent-system"
---
```

This structure ensures complete i18n support for talks while maintaining consistency with the existing blog i18n implementation.
