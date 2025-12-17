---
title: 'LLM x Bookmark：把收藏夹变成中英文笔记'
description: '一个可落地的工作流：爬取收藏网页→LLM 总结→生成 Markdown 笔记，并通过 CI 自动更新。'
pubDate: 2025-12-17T00:00:00.000Z
url: 'https://nekonull.me/posts/llm_x_bookmark/'
tags: ['llm', 'bookmark', 'automation', 'workflow']
lang: 'zh'
translatedFrom: 'llm-x-bookmark'
---

## 这篇文章讲什么

这篇文章展示了一个很实用的思路：把“收藏链接”当作一个内容管道。

你只需要维护一份**收藏清单（一个 Markdown 文件）**作为唯一真相源，然后在 CI 里自动执行：

1. 爬取链接对应的网页内容
2. 提取可读文本
3. 用 LLM 生成结构化笔记（摘要、要点等）
4. 把笔记写回仓库，形成可发布的 Markdown 文件

## 为什么有用

- 收藏不再是“死链接堆积”，而是可检索、可复用的知识资产。
- 内容进入版本管理：可 review、可 diff、可追溯。
- 生成的 Markdown 可以直接发布到个人网站。

## 关键要点

- 输入尽量简单：只维护 URL + 稳定 slug。
- 生成内容集中放到独立目录，网站侧可以作为一个版块直接渲染。
- 工作流要幂等：默认跳过已生成条目，必要时支持强制重生成。
- 同时生成中英文页面，实现“中英文对照”的阅读笔记。

## 链接

- 原文：<https://nekonull.me/posts/llm_x_bookmark/>
