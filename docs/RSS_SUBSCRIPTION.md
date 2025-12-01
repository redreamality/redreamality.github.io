# RSS 订阅功能 / RSS Subscription Feature

## 功能概述 / Overview

本站现已支持 RSS 订阅功能，用户可以通过 RSS 阅读器订阅本站的博客文章更新。

This site now supports RSS subscription. Users can subscribe to blog updates via RSS readers.

## RSS Feed 链接 / RSS Feed URLs

### 英文博客 / English Blog
- **URL**: `https://redreamality.com/rss.xml`
- **标题 / Title**: Redreamality's Blog
- **语言 / Language**: English (en-us)

### 中文博客 / Chinese Blog
- **URL**: `https://redreamality.com/cn/rss.xml`
- **标题 / Title**: Redreamality 的博客
- **语言 / Language**: 简体中文 (zh-cn)

## 如何订阅 / How to Subscribe

### 方法 1：使用 RSS 阅读器 / Method 1: Using RSS Readers

1. 选择您喜欢的 RSS 阅读器（如 Feedly、Inoreader、NetNewsWire 等）
2. 在阅读器中添加订阅源
3. 粘贴上述 RSS Feed 链接

1. Choose your favorite RSS reader (e.g., Feedly, Inoreader, NetNewsWire, etc.)
2. Add a new feed in the reader
3. Paste the RSS feed URL mentioned above

### 方法 2：从博客页面订阅 / Method 2: Subscribe from Blog Page

1. 访问博客页面（[英文版](/blog) 或 [中文版](/cn/blog)）
2. 点击右上角的 "RSS 订阅" / "Subscribe via RSS" 按钮
3. 复制 RSS Feed 链接到您的 RSS 阅读器

1. Visit the blog page ([English](/blog) or [Chinese](/cn/blog))
2. Click the "RSS 订阅" / "Subscribe via RSS" button in the top right
3. Copy the RSS feed link to your RSS reader

### 方法 3：从页面底部订阅 / Method 3: Subscribe from Footer

每个页面底部都有 RSS 链接，点击即可订阅。

Every page footer contains an RSS link for easy subscription.

## RSS Feed 内容 / RSS Feed Content

RSS feed 包含以下信息 / The RSS feed includes:

- 文章标题 / Article title
- 文章描述 / Article description
- 发布日期 / Publication date
- 作者 / Author
- 文章链接 / Article link
- 标签/分类 / Tags/Categories

## 技术实现 / Technical Implementation

本站使用 Astro 的 `@astrojs/rss` 包实现 RSS 功能。RSS feeds 在构建时自动生成，包含所有已发布的博客文章。

This site uses Astro's `@astrojs/rss` package to implement RSS functionality. RSS feeds are automatically generated during build time and include all published blog posts.

### 实现细节 / Implementation Details

- **RSS 生成文件 / RSS Generation Files**:
  - `/src/pages/rss.xml.ts` - 英文博客 RSS / English blog RSS
  - `/src/pages/cn/rss.xml.ts` - 中文博客 RSS / Chinese blog RSS

- **自动发现 / Auto-Discovery**:
  - 每个页面的 `<head>` 中都包含了 RSS feed 的自动发现标签
  - RSS feed auto-discovery tags are included in the `<head>` of every page

- **更新频率 / Update Frequency**:
  - RSS feed 在每次网站构建时更新
  - RSS feed is updated on every site build

## 推荐的 RSS 阅读器 / Recommended RSS Readers

### 桌面端 / Desktop
- **NetNewsWire** (macOS, iOS) - 免费开源 / Free and open source
- **Thunderbird** (跨平台 / Cross-platform) - 免费 / Free
- **FeedReader** (Windows, Linux) - 免费 / Free

### 网页端 / Web
- **Feedly** - 免费及付费版本 / Free and paid versions
- **Inoreader** - 免费及付费版本 / Free and paid versions
- **The Old Reader** - 免费 / Free

### 移动端 / Mobile
- **NetNewsWire** (iOS) - 免费开源 / Free and open source
- **Reeder** (iOS) - 付费 / Paid
- **Feedly** (iOS, Android) - 免费及付费版本 / Free and paid versions

## 常见问题 / FAQ

### Q: RSS feed 多久更新一次？/ Q: How often is the RSS feed updated?
A: RSS feed 在每次网站构建并部署时更新。通常在发布新文章后几分钟内更新。

A: The RSS feed is updated whenever the site is built and deployed. It typically updates within minutes of publishing a new article.

### Q: 为什么我的 RSS 阅读器显示的文章不完整？/ Q: Why does my RSS reader show incomplete articles?
A: 本站 RSS feed 仅包含文章摘要和描述。请点击链接查看完整文章。

A: The RSS feed only includes article summaries and descriptions. Please click the link to view the full article.

### Q: 能否订阅特定标签的文章？/ Q: Can I subscribe to articles with specific tags?
A: 目前 RSS feed 包含所有博客文章。未来可能会添加按标签订阅的功能。

A: Currently, the RSS feed includes all blog posts. Tag-specific feeds may be added in the future.

## 反馈 / Feedback

如有任何问题或建议，请通过网站上的联系方式与我联系。

For any questions or suggestions, please contact me through the contact information on the website.
