---
title: "BMAD Method入門：インストール、最初のワークフロー、成果物の確認"
description: "BMAD 6.12.4 の隔離インストールとスキル描画を確認。小変更のダウンロード例、七つの受け入れテスト、導入後の問題切り分けと 6.12.0 の版別説明を提供します。"
date: 2026-01-10
source: "https://github.com/bmad-code-org/BMAD-METHOD"
tags: ["ai-development", "アジャイル開発", "bmad", "sdd", "マルチエージェントシステム"]
lang: "ja"
translatedFrom: "bmad-method-guide"
---

**BMAD Method は、AI コーディングアシスタントが明確な要件、計画、レビューに沿って作業するためのオープンソースの手法とツールです。** [公式リポジトリ](https://github.com/bmad-code-org/BMAD-METHOD)はインストーラーとスキル定義を提供します。製品、アーキテクチャ、開発などの役割から、異なる観点で問題を検討できます。判断を残し、段階的に進める変更に適していますが、役割名そのものはファイル権限を分離しません。

最初は結果を確認しやすい小さなワークフローを完了し、それから計画の範囲を広げます。本記事は npm 公開版 **bmad-method 6.12.0** を **2026-09-25 UTC** に確認したものです。インストールとローカルのスキル描画はリポジトリ外の空ディレクトリで検証しました。実際のモデル、有料サービス、以下の例の機能実装は実行していません。

## インストールから検証できる小変更へ

2026年10月26日の追加確認では npm の `latest` は **6.12.4** だった。リポジトリ外の新しい空ディレクトリに BMM と Claude Code 連携を導入し、29 個のスキル入口と読み取り可能な build workflow を確認した。後半の旧節は 6.12.0 の記録として残している。九月のタグを現在の最新版として使わない。

```bash
pnpm dlx bmad-method@6.12.4 install --directory . --modules bmm --tools claude-code --yes
```

既存製品のリポジトリではなく、新しい練習用ディレクトリへ移動して実行する。導入後は `.claude/skills/bmad-build/SKILL.md` を読み、実際の絶対パスで描画スクリプトを実行する。今回確認したコマンドの形は次のとおり。

```bash
uv run --no-cache "<practice>/_bmad/scripts/render_skill.py" --project-root "<practice>" --skill "<practice>/.claude/skills/bmad-build"
```

成功すると `_bmad/render/bmad-build/.../workflow.md` の場所が返る。そのファイルが参照する `step-01-clarify-and-route.md` も存在した。確認できるのはワークフローを読み込めることまでで、モデルによる要件整理、実装、レビューの完了ではない。

小変更には[共通タスクと受け入れ条件](/assets/jev-bmad-search-repair/small-change-task.md)を使う。表示名の空白を正規化する関数を追加する課題だ。同じディレクトリで開いた助手に `/bmad-build` と課題を渡す。Python の Unicode 空白規則を使い、空文字列は空のまま返し、非文字列には `TypeError` を送出する。本人確認や音訳は対象外である。この指定で `None` の文字列化や ASCII 空白だけの処理を防ぐ。

[受け入れテスト](/assets/jev-bmad-search-repair/test_normalize_name.py)を用意し、助手が `normalize_name.py` を生成したら実行する。

```bash
uv run --no-project python -B -m unittest -v test_normalize_name.py
```

七つのテストは前後と連続した空白、空入力、改行と tab、Unicode 空白、中国語の文字保持、不正な型、冪等性を確認する。[筆者が作成した参考実装](/assets/jev-bmad-search-repair/normalize_name.py)もあり、今回の実行では `Ran 7 tests` と `OK` を得た。これは参考実装の検証で、BMAD モデルの実行結果ではない。助手を評価するときは先に課題とテストだけを渡し、完了後に参考実装と比較する。

助手が実際に保存した `spec-<slug>.md` を読み、各入力の振る舞いをコードとテスト結果に対応させる。6.12.4 のテンプレートには意図、状態、実装記録、レビュー記録があり、簡略経路では一部の計画節が省かれる。`done` と書いたファイルを手で置いてもワークフロー実行にはならず、チェック済みタスクだけでも動作は証明できない。

導入後の問題は次の順で切り分けられる。

<div class="content-table-scroll" role="region" aria-label="症状 / 次に確認すること" tabindex="0">

| 症状 | 次に確認すること |
| --- | --- |
| チャットに `bmad-build` がない | 宿主の起動場所と `.claude/skills/bmad-build/SKILL.md` を確認し、開き直す |
| 導入成功後に描画が失敗する | `uv --version`、実際のパス、スクリプトのエラーを確認する。モデル段階には入っていない |
| workflow はあるが spec やコードがない | チャットでスキルを呼び出したか、モデルサービスを利用できるかを確認する |
| テストモジュールがない | 実装を完了または修正する。導入成功を機能完成と扱わない |
| Unicode や不正型のテストが失敗する | 失敗ケースを削除せず、課題の振る舞いに戻って修正する |

</div>

根拠は [6.12.4 build 入口](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.12.4/src/bmm-skills/ship/bmad-build/SKILL.md)、[spec テンプレート](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.12.4/src/bmm-skills/ship/bmad-build/spec-template.md)、実際の導入ファイルである。宿主モデルは起動していない。同じ課題での選択は [SDD 比較](/ja/blog/-sddbmad-vs-spec-kit-vs-openspec-vs-promptx/)にまとめた。

## インストールするバージョン

確認時の npm タグは `latest` が 6.12.0、`next` が 6.12.1-next.0、`rollback` が 4.39.0 で、`alpha` は返されませんでした。タグは変わるため、以下ではバージョンを固定します。`@latest` は v4 の永久的な別名ではなく、v6 全体を alpha と説明するのも適切ではありません。

この版のインストーラーには **Node.js 20.12.0+** が必要です。`bmad-build` などは Python スクリプトを実行する **uv** も必要とし、README は Python 3.10+ を挙げています。uv がなくても警告だけでインストールが完了する場合がありますが、build スキルは停止します。インストール成功とワークフローの準備完了は別です。モデルを使う段階では、対応するコーディングアシスタントと利用可能なモデルサービスも必要です。Git が導入の前提となるのは、Git から外部・カスタムモジュールを取得する場合です。

空の練習用ディレクトリで help を確認し、BMM と Claude Code 連携を導入します。

```bash
pnpm dlx bmad-method@6.12.0 install --help
pnpm dlx bmad-method@6.12.0 install --directory . --modules bmm --tools claude-code --yes
```

`--yes` は既定値を受け入れ、`--directory .` は現在のディレクトリを指定します。これでプロジェクトへのインストールは完了し、ディレクトリ作成のために古い `*workflow-init` を実行する必要はありません。別の宿主では同版の `install --list-tools` で ID を調べ、製品の表示名から推測しないでください。

## インストール後のファイル

今回の Claude Code 向けインストールで生成された主なパスです。

```text
_bmad/
  config.toml
  config.user.toml
  _config/
    bmad-help.csv
  custom/
  scripts/
    render_skill.py
    resolve_config.py
  render/
_bmad-output/
.claude/
  skills/
    bmad-help/
      SKILL.md
    bmad-build/
      SKILL.md
      spec-template.md
```

`_bmad/` は共有設定と補助スクリプト、`.claude/skills/` は選択した宿主用の入口、`_bmad-output/` は作業成果物の保存先です。導入直後の出力先に要件や実装文書があるとは限りません。空ディレクトリの存在はワークフロー実行の証拠ではありません。

6.12.0 の `_bmad/config.toml` はインストーラー管理で、再導入時に生成し直されます。永続的なチーム設定は `_bmad/custom/config.toml`、個人設定は `_bmad/custom/config.user.toml` に記述します。インストーラーの設定を変更する前に、同版の `install --list-options` を確認してください。生成された既定値には次が含まれます。

```toml
[modules.bmm]
planning_artifacts = "{project-root}/_bmad-output/planning-artifacts"
implementation_artifacts = "{project-root}/_bmad-output/implementation-artifacts"
project_knowledge = "{project-root}/docs"
```

これは実際の設定の抜粋であり、新しい設定形式を作る提案ではありません。初期 v6 の `_bmad/bmm/config.yaml` は別バージョンの説明です。`.bmad` や `.bmad-core` も本版のディレクトリではありません。旧記事が参照していた `BmadElixir` は別の第三者プロジェクトで、そのフィールドを BMAD-METHOD の公式設定として扱えません。

## 最初のワークフロー：ヘルプ、実装、確認

同じ練習用ディレクトリで、選択したコーディングアシスタントを開きます。以下は **Claude Code のチャットで呼び出すスキルであり、shell コマンドではありません**。

```text
/bmad-help インストールが終わりました。現在のプロジェクトの状態と、小さな変更を始める方法を説明してください。
```

`bmad-help` は `_bmad/_config/bmad-help.csv`、設定、既存の成果物から次の操作を判断します。対象が練習用プロジェクトで、`bmad-build` を認識することを確認します。認識しない場合は起動ディレクトリと `.claude/skills/bmad-help/SKILL.md` を確認して宿主を開き直します。IDE のファイル監視権限が原因だと決めつけないでください。

次に、外部への副作用がなく、ローカルで確認できる依頼を渡します。

```text
/bmad-build 練習用ディレクトリに normalize_name.py と test_normalize_name.py を追加してください。
Python 標準ライブラリだけを使います。normalize_name(value) は前後の空白を除き、
内部の連続した空白を一つのスペースにします。空文字列には空文字列を返し、
文字列以外には TypeError を送出します。ネットワークアクセス、第三者依存の導入、
コミット、push は行わないでください。不明な要件があれば先に質問してください。
```

これは読者が実行する練習の入力であり、今回生成済みのプログラムの記録ではありません。本版の build は通常、明確化、計画、実装、レビュー、結果提示という流れを取ります。意図が明確で低リスクの小変更は簡略化した `oneshot` に進む場合があります。すべてのタスクで各段階に承認画面が出るとは限りません。

### 成果物と確認項目

本版は設定された `implementation_artifacts` の下に `spec-<slug>.md` を保存します。本例では `_bmad-output/implementation-artifacts/spec-normalize-name.md` などが考えられますが、slug は実際のタスクで決まります。spec は意図、状態、実装記録を保存します。通常の詳細な経路では境界、入力と出力のシナリオ、タスク、検証も記録し、簡略化した経路では一部の節を省略する場合があります。

最終メッセージが示す実際のパスを確認し、`normalize_name.py`、`test_normalize_name.py`、spec を開きます。完了という申告だけで判断しないでください。

| 入力 | 期待する結果 |
| --- | --- |
| `"  Ada   Lovelace  "` | `"Ada Lovelace"` |
| `""` または空白だけの文字列 | `""` |
| 改行やタブを含む文字列 | 単一スペースで区切られた文字列 |
| `None` または数値 | `TypeError` |

以上をテストで確認し、練習用ディレクトリで実行します。

```bash
uv run --no-project python -m unittest -v test_normalize_name.py
```

このコマンドには、ワークフローによってテストファイルが生成済みであることが必要です。ファイルがない、またはテストが失敗する場合は未完了なので、spec を `done` にするのではなく原因を解決します。ソースの差分が指定した関数、テスト、BMAD 成果物に限定され、ネットワークアクセスや無関係な依存追加がないことも確認します。

最後に次を依頼できます。

```text
/bmad-help 今回のワークフローを説明し、実際の成果物、検証の証拠、未完了事項を挙げてください。
```

## 今回確認した範囲

Windows の空ディレクトリで Node.js 26.7.0、pnpm 10.28.2、uv 0.12.17 を使い、固定版のインストールが成功して上記パスが生成されました。導入済み `bmad-build/SKILL.md` に従うローカルの `render_skill.py` も、`_bmad/render/bmad-build/.../workflow.md` を出力しました。

確認したのはパッケージ、インストーラー、宿主用入口ファイル、スキルの描画です。モデルがワークフローを正しく実行することまでは検証していません。Python 機能の生成、チャットのヘルプ結果、アプリのテスト結果は実行しておらず、成功例として報告しません。インストーラーにモデル認証情報は不要ですが、宿主での実行には契約済みまたは従量課金のモデルサービスを使う場合があります。

## 役割、品質条件、コンテキストの費用

製品、アーキテクチャ、開発の役割は異なる質問と確認観点を提供します。開発者の指示に「設計と衝突したら報告する」とあっても、データベースファイルへの書き込み権限がないことは証明できません。ファイル制限、サンドボックス、承認、ネットワーク権限は宿主と実行環境が担当します。

同様に、任意の `quality.pre_commit` フィールドを追加しても、公式対応のコミット制限にはなりません。不適切な変更を止めるには実際のテスト、Git hooks、CI を設定し、失敗ケースで阻止されることを確認します。本記事ではその強制機構を実装・検証していません。

文書を分割し、必要な背景だけを読み込むことで入力の重複を減らせる可能性はあります。ただし削減量はモデル、タスク、キャッシュ、レビューの反復に依存します。固定の token 削減率や正確さは保証しません。

複数領域、複数回の実装、重要な設計判断にまたがる変更では、`bmad-help` で要件やアーキテクチャの計画を選びます。誤字修正や機械的な整形に全工程が必要とは限りません。既存プロジェクトの一つの変更について仕様ファイルを管理することが目的なら、[OpenSpec のワークフローと成果物](/ja/garden/notes/openspec-guide/)も比較できます。

## バージョン付き資料

- [6.12.0 インストールガイド](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.12.0/docs/start/install-bmad.md)：環境、導入、更新。
- [6.12.0 最初の変更](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.12.0/docs/start/build-your-first-change.md)：公開版の `bmad-build` 入口。
- [6.12.0 bmad-help](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.12.0/src/core-skills/bmad-help/SKILL.md)：ヘルプが使うデータ。
- [6.12.0 build テンプレート](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.12.0/src/bmm-skills/ship/bmad-build/spec-template.md)：成果物の項目と簡略化条件。
- [npm 公開タグ](https://registry.npmjs.org/-/package/bmad-method/dist-tags)：値は変わるため、再現には固定バージョンを使用します。
