---
title: 'Advanced Obsidian Guide: Free Cloud Sync, AI Integration, Image Management and Mobile Configuration'
pubDate: 2025-12-09T00:00:00.000Z
description: 'A comprehensive guide to advanced Obsidian usage, including free cloud sync via GitHub, AI integration with Gemini CLI, image storage management, and mobile sync configuration to supercharge your note-taking system.'
author: 'Remy'
tags: ['obsidian', 'productivity']
---

As a heavy note-taker, I've been searching for the perfect note-taking solution for years. After extensive exploration and practice, I've discovered that Obsidian is not just a note-taking app, but a highly customizable knowledge management system. Today, I want to share my advanced Obsidian usage experience, covering free cloud sync, AI integration, image management, and mobile configuration.

## Why Choose Obsidian?

Among the many note-taking software I've used, Obsidian has become my top choice for three core reasons:

**Data Security:** Essentially, Obsidian is just a local Markdown file manager. This means even if the software developer shuts down someday, my data remains safely in my own hands and can be easily migrated to any Markdown-supporting editor. This data ownership gives me tremendous peace of mind.

**Smooth Interface:** Compared to cloud-based note-taking software, Obsidian's response speed is simply amazing. There's no lag, no interruption of my "flow state," allowing me to focus on thinking and creating.

**High AI Compatibility:** This might be the most surprising aspect. Obsidian and AI Agents (like Gemini CLI) are a perfect match. Because AI excels at processing local files and Markdown formats, I can seamlessly integrate AI capabilities into my note-taking workflow.

---

## Free Cloud Sync Solution for PC (Based on GitHub)

When it comes to cloud sync, many people might first think of paid services. But I'm here to tell you about a completely free and more secure solution: using GitHub as cloud storage.

### Preparation

First, you need to register a GitHub account, then create a new Repository. I strongly recommend setting it to **Private** to protect your privacy, as note content often involves personal information.

Next, download the **GitHub Desktop** client. This client is more intuitive than command-line operations, especially suitable for users unfamiliar with Git. Log in to your GitHub account, then Clone the remote repository you just created to your local computer.

### Obsidian Setup

Now for the crucial step: use Obsidian to open the local folder you just cloned as your vault.

But here's a very important detail: create a `.gitignore` file in the repository root directory to exclude frequently changing configuration files like `.obsidian/workspace.json`. This prevents sync conflicts and makes your cloud sync experience smoother.

My `.gitignore` file typically contains:

```
.obsidian/appearance.json
.obsidian/workspace.json
.obsidian/workspace-mobile.json
```

### Automated Sync Plugin

Manual syncing can be tedious, but thankfully Obsidian has a powerful plugin ecosystem. Install the **Git** plugin from the community plugin market, and you can achieve automated syncing.

My recommended settings:
- Enable "Auto commit and sync after stopping file edits" with a **1-minute** interval
- Enable "Pull on startup" to ensure multi-device data consistency

With these settings, I barely notice the sync happening—it works silently in the background like a service.

---

## AI Empowerment: Integrating Gemini CLI

If cloud sync solves the data access problem, then AI integration completely transforms how I handle my notes.

### Environment Setup

First, you need to install **Node.js**, which is the foundation for running Gemini CLI.

Then install and log in to **Gemini CLI** via command line. Note that you might need a VPN environment to use it normally.

### Practical Applications

Gemini CLI has brought revolutionary changes to my note-taking workflow:

**Inspiration Generation:** I often have AI read my historical scripts, analyze my topic characteristics, and then generate new topics output directly as Markdown files. This greatly improves my content creation efficiency.

**File Organization:** I command AI to batch-create folder structures and archive files. For example, "Help me create a blog post folder structure organized by month," and AI completes it automatically.

**Style Mimicry:** This feature is particularly useful—I have AI search for trending online articles and write new scripts imitating my historical writing style. The generated content is both timely and maintains my personal voice.

**Safety Net:** What reassures me most is that if AI messes up files, I can use Git's `discard changes` feature to roll back with one click. This safety net allows me to boldly experiment with various AI-assisted creation methods.

---

## Advanced Image Storage and Management

Image management has always been a pain point for note-taking software, and Obsidian is no exception. By default, image links are not in standard Markdown syntax and cannot be previewed on GitHub web pages or other editors.

### Solution

After multiple attempts, I found that the **Custom Attachment Location** plugin is the best solution.

### Configuration Details

In the plugin settings, change the rename mode to "All" so the plugin automatically renames attachments.

Then in Obsidian's "Files & Links" settings:
- Disable "Use Wiki Links"
- Set link type to "Relative path based on current note"

### Experience Results

After configuration, images are automatically saved to the specified folder (like `assets`), and links become standard Markdown format. The best part is that when I move notes, images automatically follow—no more manual path adjustments needed.

---

## Mobile Sync Configuration

With PC setup complete, next is mobile configuration to achieve true seamless multi-device sync.

### Initial Import

First, copy the entire note repository folder from your computer to phone storage via USB cable (e.g., in the `Documents` directory). This step only needs to be done once; subsequent syncing will be handled automatically by Git.

### App Setup

In mobile Obsidian, choose "Open folder as vault" to open that folder.

Then configure the mobile **Git plugin**:
- Fill in GitHub username and email
- **Key Credential:** Generate a **Personal Access Token (Classic)** on the GitHub website and fill it into the plugin password field, granting Repo read/write permissions

Steps to generate a token: GitHub Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token. Remember to check Repo permissions.

### Important Notes

Try to avoid editing the same file simultaneously on phone and computer to prevent conflicts. if simultaneous editing is necessary,建议先同步一次，确保两边版本一致。

---

## Summary

Through this configuration, I've built a powerful, secure, and free Obsidian workflow:

1. **Complete Data Control:** Based on GitHub private repositories, data security is guaranteed
2. **AI-Powered:** Gemini CLI makes note management more intelligent
3. **Standardized Image Management:** Standard Markdown format, cross-platform compatible
4. **Seamless Multi-Device Sync:** Real-time sync between PC and mobile, record inspiration anytime, anywhere

This solution is not only free but also more flexible and secure than many paid services. If you're also looking for the perfect note-taking solution, consider trying this configuration combination.

Hope this guide helps you! If you have any questions or better suggestions, feel free to discuss in the comments.