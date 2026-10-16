---
title: "仕様駆動開発（spec-driven development）とは？"
description: "仕様駆動開発は、レビュー可能な仕様を先に書き、AI エージェントにその仕様どおり実装させる方法です。チャット履歴ではなく仕様が唯一の情報源になります。"
date: 2026-10-16
tags: ["spec-driven-development"]
lang: "ja"
---

仕様駆動開発（spec-driven development、SDD。spec coding とも呼ばれます）とは、何を作り何をもって完了とするかを先に仕様として書き、レビューしてから AI エージェントにコードとテストを書かせる開発手法です。

チャットでエージェントを動かすと、要件が何十ものやり取りに散らばり、新しいセッションでは忘れられます。SDD は要件・設計・タスクをリポジトリ内の Markdown に固定し、差分やレビューができ、次のセッションでも読み込めるようにします。

流れは、仕様を書く、エージェントが設計とタスクに分解する、タスクごとに実装して仕様と照合する、の三段階です。GitHub の Spec Kit、AWS の Kiro、OpenSpec などのツールがあります。複数ファイルにまたがる機能や要件が変わり続ける開発で効果が大きく、文言修正のような小さな変更では手間になるだけです。価値は文書そのものより、仕様の条件をテストに落として「完了」を検証できる点にあります。

## 関連記事

- [OpenSpec チュートリアル](/ja/blog/openspec-tutorial-cli-commands-agents-md-examples/)
- [バイブコーディングとは？](/ja/garden/questions/what-is-vibe-coding/)
- [GitHub Spec Kit](https://github.com/github/spec-kit)
