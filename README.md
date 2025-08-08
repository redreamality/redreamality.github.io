# 个人博客与项目展示网站

这是我的个人网站项目，使用 Astro 和 Tailwind CSS 构建。网站包含博客文章、项目展示、演讲分享等内容。

## 技术栈

- [Astro](https://astro.build/) - 现代静态站点生成器
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [MDX](https://mdxjs.com/) - Markdown 增强版
- GitHub Pages - 托管服务

## 本地开发

1. 克隆项目：

```bash
git clone https://github.com/yourusername/redreamality.github.io.git
cd redreamality.github.io
```

2. 安装依赖：

```bash
pnpm install
```

3. 启动开发服务器：

```bash
pnpm dev
```

4. 在浏览器中打开 `http://localhost:4321` 查看网站。

## 部署到 GitHub Pages

1. 创建 GitHub 仓库：
   - 仓库名必须为：`yourusername.github.io`
   - 这样部署后可以通过 `https://yourusername.github.io` 访问

2. 配置 GitHub Actions：
   - 在项目根目录创建 `.github/workflows/deploy.yml` 文件
   - 文件内容如下：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install

      - name: Build website
        run: pnpm build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: \${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

3. 推送代码到 GitHub：

```bash
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/redreamality.github.io.git
git push -u origin main
```

4. 配置 GitHub Pages：
   - 进入仓库设置
   - 找到 Pages 设置
   - Source 选择 `gh-pages` 分支
   - 保存设置

现在，每次推送到 main 分支时，GitHub Actions 都会自动构建并部署网站。

## 添加新博客文章

1. 在 `src/content/blog/` 目录下创建新的 `.md` 或 `.mdx` 文件
2. 文件开头添加 frontmatter：

```markdown
---
title: '文章标题'
pubDate: 2024-01-15T00:00:00.000Z
description: '文章描述'
author: '作者名'
tags: ['标签1', '标签2']
---

文章内容...
```

注意：`pubDate` 必须使用 ISO 8601 格式的日期（例如：`2024-01-15T00:00:00.000Z`）。

## Admin Interface

This project includes an admin interface for creating and managing blog posts and talks.

### Accessing the Admin Interface

1. Navigate to `/admin` in your browser
2. Enter the admin password when prompted
3. Use the dashboard to create new content

### Admin Features

- **Create Blog Posts**: Write and generate blog post markdown files
- **Create Talks**: Add new presentations and talks
- **Automatic Frontmatter**: Automatically generates proper frontmatter with metadata
- **File Download**: Downloads generated markdown files for manual placement

### Using the Admin Interface

1. **Create a Blog Post**:
   - Go to `/admin` and click "Create Blog Post"
   - Fill in the title, description, tags, and content
   - Select the source language (Chinese or English)
   - Click "Create Post" to generate and download the markdown file
   - Save the downloaded file to `src/content/blog/` directory
   - Commit and push to deploy

2. **Create a Talk**:
   - Go to `/admin` and click "Create Talk"
   - Fill in the talk details including title, description, date, and optional fields
   - Add the content in Markdown format
   - Click "Create Talk" to generate and download the markdown file
   - Save the downloaded file to `src/content/talks/` directory
   - Commit and push to deploy

## API Documentation

### Admin Authentication

The admin interface uses simple client-side authentication. In production, you should implement proper server-side authentication.

### Content Creation API (Future Enhancement)

The following API endpoints are planned for future implementation:

#### Create Blog Post

```http
POST /api/admin/create-post
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "My New Blog Post",
  "description": "This is a sample blog post",
  "content": "# Hello World\n\nThis is my first post!",
  "language": "en",
  "tags": "javascript, web-development, tutorial"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Blog post created successfully",
  "filename": "my-new-blog-post.md",
  "slug": "my-new-blog-post"
}
```

#### Create Talk

```http
POST /api/admin/create-talk
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "My Awesome Talk",
  "description": "This is a sample talk about web development",
  "content": "# Introduction\n\nWelcome to my talk!",
  "date": "2024-01-15",
  "language": "en",
  "location": "Tech Conference 2024",
  "slides": "https://example.com/slides.pdf",
  "video": "https://youtube.com/watch?v=example"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Talk created successfully",
  "filename": "my-awesome-talk.md",
  "slug": "my-awesome-talk"
}
```

### Authentication API

#### Login

```http
POST /api/admin/login
Content-Type: application/json

{
  "password": "your-admin-password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful"
}
```

#### Logout

```http
POST /api/admin/logout
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Error Responses

All API endpoints return error responses in the following format:

```json
{
  "success": false,
  "error": "Error message",
  "details": ["Detailed error information"]
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized
- `409`: Conflict (duplicate content)
- `500`: Internal Server Error

### Content Structure

#### Blog Post Frontmatter

```yaml
---
title: 'Post Title'
pubDate: 2024-01-15T00:00:00.000Z
description: 'Brief description of the post'
author: 'Remy'
tags: ['tag1', 'tag2', 'tag3']
---
```

#### Talk Frontmatter

```yaml
---
title: 'Talk Title'
description: 'Brief description of the talk'
date: 2024-01-15T00:00:00.000Z
location: 'Event Location'
slides: 'https://example.com/slides.pdf'
video: 'https://youtube.com/watch?v=example'
---
```

## 许可证

MIT
