---
title: '誰が私の GitHub リポジトリにスターを付けたか？確認方法'
pubDate: 2025-08-22T16:18:23.681Z
description: 'Stargazers ページの入口、アクセス権限、空のリストと 403、現在のスター一覧と履歴の違いを説明します。'
author: 'Remy'
tags: ['開発']
lang: 'ja'
translatedFrom: 'who-starred-my-github-repo-how-to-view'
---

リポジトリの URL に `/stargazers` を追加すると、**Stargazers** ページの入口になります。ただし、ユーザー一覧を表示できるかどうかはアカウントの権限によります。公開リポジトリでも、誰にでも一覧を公開しているとは限りません。GitHub の [2026 年 6 月 30 日の告知](https://github.blog/changelog/2026-06-30-upcoming-access-restrictions-to-public-api-endpoints-and-ui-views/) は、一覧 API を管理者とコラボレーターに制限し、対応する Web ページにも制限を設けています。

## Stargazers ページへ直接移動

最も直接的な方法は、リポジトリ URL の末尾に `/stargazers` を手動で追加することです。

例えば、リポジトリ URL が：
`https://github.com/your-username/your-repository-name`

の場合、次のように移動できます：
`https://github.com/your-username/your-repository-name/stargazers`

このページは現在スターを付けているユーザーの一覧ですが、上記のアクセス制限が適用されます。リポジトリのスター数をクリックしても移動できます。**Star** 操作そのものは自分のスター状態を変更するため、数値のリンクと区別してください。

## 非公開リポジトリの権限

まず、その非公開リポジトリにアクセスできるアカウントでログインする必要があります。ただし、それだけでスター一覧へのアクセスが保証されるわけではありません。一覧に必要な管理者またはコラボレーターの権限も確認してください。Stargazers URL を直接入力しても権限を迂回できません。

## 空のリストや 403 が返る場合

公式告知は、一部のユーザーに空のレスポンスや **403 Forbidden** が返る可能性を明記しています。そのため、空のリストだけで、過去に誰もスターを付けていないとは判断できません。ログイン中のアカウント、リポジトリ名、管理者またはコラボレーターの権限を確認します。API ではレスポンス本文とレート制限のヘッダーも確認し、すべての 403 を同じ原因と決めつけないでください。

[REST のスター関連文書](https://docs.github.com/en/rest/activity/starring#list-stargazers) は、新しい制限の導入時期を 2026 年 7 月としています。一方、同じページの公開リソースに関する一般的な認証説明や、[通常のヘルプページ](https://docs.github.com/en/get-started/exploring-projects-on-github/saving-repositories-with-stars#viewing-who-has-starred-a-repository) には、より広いアクセスを示す記述が残っています。新しい制限の告知と併せて読み、公開リポジトリなら無条件で閲覧できるとは考えないでください。この記事では各アカウントへの適用状況までは検証していません。

## 現在の一覧と完全な履歴の違い

ページと `GET /repos/{owner}/{repo}/stargazers` が示すのは現在のスター一覧であり、スターを付けた後で解除した人まで含む完全な履歴ではありません。REST の一覧はページ分割され、既定は 30 件、`per_page` の最大値は 100 です。最初のページだけでは現在の一覧全体にもならない場合があります。

`application/vnd.github.star+json` メディアタイプでは、返された項目の `starred_at` を取得できます。しかし、この時刻があってもスター解除のイベントログにはなりません。別の[リポジトリのスター履歴 API](https://docs.github.com/en/rest/activity/starring#get-repository-star-history) は過去の件数を提供し、個々のユーザーの完全な変更履歴を提供するものではありません。どちらもアクセス制限の回避方法ではありません。

## スターと Watch の違い

スターはリポジトリを保存するための機能です。Watch はリポジトリの活動通知を管理します。Stargazers は、すべての Watch 利用者、訪問者、クローンした人の一覧ではありません。

## 公式資料

- [2026 年 6 月 30 日のアクセス制限告知](https://github.blog/changelog/2026-06-30-upcoming-access-restrictions-to-public-api-endpoints-and-ui-views/)：API と Web ページの制限、空のレスポンスと 403。
- [REST のスター関連 API](https://docs.github.com/en/rest/activity/starring)：権限、ページ分割、時刻、過去の件数。
- [スターによるリポジトリの保存](https://docs.github.com/en/get-started/exploring-projects-on-github/saving-repositories-with-stars)：入口と用途。権限の説明は新しい告知と併せて参照してください。
