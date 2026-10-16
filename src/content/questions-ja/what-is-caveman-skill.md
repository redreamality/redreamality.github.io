---
title: "Caveman スキルとは？本当に 65% もトークンを節約できる？"
description: "Caveman はコーディングエージェントに原始人のような短い話し方をさせ、出力トークンを減らすスキルです。公称は約 65% 削減ですが、実際のエージェント作業での独立検証では約 8.5% でした。"
date: 2026-10-16
tags: ["agent-skills"]
lang: "ja"
---

Caveman は、コーディングエージェントに冠詞や代名詞、前置きを省いた短い話し方をさせ、出力トークンを減らすためのスキルです。コード、コマンド、ファイルパス、エラーメッセージはそのまま残します。

GitHub の JuliusBrussee/caveman で公開されており、Claude Code では `claude plugin marketplace add JuliusBrussee/caveman && claude plugin install caveman@caveman` で導入し、`/caveman` で有効にします。

公称の約 65% 削減は主にチャット形式の回答での数字です。JetBrains が 2026 年 7 月に 82 組のタスクで強制的に有効化して測ったところ、出力トークンの削減は約 8.5% で、品質の低下は検出されませんでした。エージェントの出力の大半はコードやツール呼び出しで、そこは圧縮されないためです。Glia の 20 タスクの検証では、出力トークンの中央値がむしろ 17.7% 増えました。さらに `SKILL.md` 自体が約 1,650 トークンあり、毎回入力に乗ります。回答を短くしたいなら有効ですが、コスト削減の効果は大きく見積もらないほうがよいでしょう。

## 関連リンク

- [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman)
- [JetBrains の検証記事](https://blog.jetbrains.com/ai/2026/07/speak-to-ai-agents-like-cavemen-tosave-tokens/)
- [Glia の検証記事](https://gliai.com/research/caveman-skill-benchmark)
