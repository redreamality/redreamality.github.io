---
title: '谁给我的 GitHub 仓库点了星？如何查看？'
pubDate: 2025-08-22T16:18:23.681Z
description: '通过 Stargazers 页面查看 GitHub 仓库的当前星标用户，了解权限限制、空列表与 403，以及当前列表和历史记录的区别。'
author: 'Remy'
tags: ['development']
lang: 'zh'
translatedFrom: 'who-starred-my-github-repo-how-to-view'
---

在仓库 URL 后添加 `/stargazers`，就能找到 **Stargazers** 页面入口。能否列出用户还取决于账号权限，公开仓库不保证任何人都能查看。GitHub 的 [2026 年 6 月 30 日公告](https://github.blog/changelog/2026-06-30-upcoming-access-restrictions-to-public-api-endpoints-and-ui-views/) 将列表 API 限制给管理员和协作者，也限制了对应的网页入口。

## 直接导航到 Stargazers 页面

最直接的方法是手动在仓库 URL 的末尾添加 `/stargazers`。

例如，如果您的仓库 URL 是：
`https://github.com/your-username/your-repository-name`

您可以导航到：
`https://github.com/your-username/your-repository-name/stargazers`

这个页面用于查看当前星标用户，但仍受上述访问限制。也可以点击仓库页面的星标数量；注意不要点击 **Star** 操作本身，后者会改变自己是否收藏该仓库。

## 私有仓库需要什么权限

首先需要登录能够访问该私有仓库的账号。这是必要检查，不是一定能查看星标列表的保证，还需要确认列表要求的管理员或协作者权限。直接输入 Stargazers URL 不会绕过权限控制。

## 为什么列表为空或返回 403

官方公告明确提示，部分用户可能收到空响应或 **403 Forbidden**。因此，空列表不能单独证明从来没有人点过星。先确认登录账号、仓库名称及管理员或协作者权限；调用 API 时还应检查响应正文和速率限制响应头，不能把每个 403 都归为同一原因。

[REST 星标文档](https://docs.github.com/en/rest/activity/starring#list-stargazers) 将新限制标为 2026 年 7 月引入。不过，该页的公开资源通用认证说明和[普通星标帮助页](https://docs.github.com/en/get-started/exploring-projects-on-github/saving-repositories-with-stars#viewing-who-has-starred-a-repository) 仍保留较宽的访问描述。阅读时应同时考虑较新的限制公告，不应继续承诺公开仓库的名单对所有人可见。本文没有逐账号验证限制的实施状态。

## 当前星标列表不等于完整历史

网页和 `GET /repos/{owner}/{repo}/stargazers` 返回当前星标用户，不是所有曾经点星、后来取消的用户档案。REST 列表需要分页，默认每页 30 条，`per_page` 最大为 100；只读取一页未必得到完整的当前列表。

`application/vnd.github.star+json` 媒体类型可以为返回条目提供 `starred_at`，但这个时间戳不会把列表变成取消星标的事件日志。另一个[仓库星标历史接口](https://docs.github.com/en/rest/activity/starring#get-repository-star-history) 提供历史数量，不提供完整的个人身份变更历史。两种接口都不能绕过访问限制。

## 星标和关注者有什么区别

星标用于收藏仓库；关注仓库决定接收哪些仓库活动通知。Stargazers 页面不代表所有关注者、访问者或克隆过仓库的人。

## 官方来源

- [2026 年 6 月 30 日访问限制公告](https://github.blog/changelog/2026-06-30-upcoming-access-restrictions-to-public-api-endpoints-and-ui-views/)：API、网页限制及空响应、403 的说明。
- [REST 星标接口](https://docs.github.com/en/rest/activity/starring)：权限、分页、时间戳和历史数量。
- [使用星标收藏仓库](https://docs.github.com/en/get-started/exploring-projects-on-github/saving-repositories-with-stars)：页面入口与星标用途，权限说明须结合新公告阅读。
