---
title: "grill-me スキルとは？"
description: "grill-me は Matt Pocock が公開しているオープンソースのエージェントスキルで、/grill-me と大まかなアイデアを入力すると、計画のすべての判断が決まるまでエージェントが質問を重ねます。"
date: 2026-10-16
tags: ["agent-skills"]
lang: "ja"
---

grill-me は、Matt Pocock がオープンソースのリポジトリ mattpocock/skills で公開しているエージェントスキルです。`/grill-me` と大まかなアイデアを入力すると、計画の判断分岐がすべて決まるまで、エージェントが徹底的に質問してきます。

前提にあるのは、ソフトウェア開発で最も多い失敗は認識のずれだという考えです。そのため、コードを書く前にエージェントがあなたに質問します。起動するのはユーザーだけで、新しい会話で始めることが推奨されています。質問はラウンドごとに、前提が決まった問いだけをまとめて出します。ファイルは一切書かず、リポジトリも不要で、コード以外の意思決定にも使えます。

Claude Code では `claude plugin install mattpocock-skills@claude-plugins-official` でインストールできます。MIT ライセンスで、Anthropic の公式スキルではありません。姉妹スキルの grill-with-docs は同じ質問をしつつコードベースを読み、決まった用語や判断を `GLOSSARY.md` と ADR に記録します。

## 関連記事

- [agentskills.io 入門ガイド](/ja/blog/agentskills-io-starter-guide/)
- [mattpocock/skills](https://github.com/mattpocock/skills)
