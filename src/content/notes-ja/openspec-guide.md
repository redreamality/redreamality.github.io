---
title: "OpenSpecとは？変更ワークフロー、ファイル構成、適した用途"
description: "OpenSpecの提案、仕様差分、アーカイブを解説する独立ガイド。導入に適した場面、実際のファイル構成、公式資料とCLIチュートリアルへの入口を紹介します。"
date: 2026-01-11
source: "https://github.com/Fission-AI/OpenSpec"
tags: ["ai-development", "openspec", "sdd", "AIエージェント"]
lang: "ja"
translatedFrom: 'openspec-guide'
---

**OpenSpec は、人と AI コーディングアシスタントが要件仕様を共同で管理するためのオープンソースツールです。** 変更の理由、要件、技術的な判断、実装タスクをプロジェクト内のファイルに保存します。レビュー担当者はチャット履歴から要件を探し直さず、期待する振る舞いとコードを比較できます。[公式リポジトリとドキュメント](https://github.com/Fission-AI/OpenSpec)は Fission AI が管理しています。本ページは独立した利用ガイドであり、公式ドキュメントではありません。

まず区別したいのは、`openspec/specs/` が受け入れ済みのシステムの振る舞いを記録し、`openspec/changes/<name>/` がその変更案を記録することです。実装とテストを終えてから、変更の仕様差分を主要仕様へ反映し、変更をアーカイブします。

インストールして最初の例を完成させたい場合は、[OpenSpec CLI チュートリアル](/ja/blog/openspec-tutorial-cli-commands-agents-md-examples/)へ進んでください。ここでは導入の適否、管理するファイル、各段階の確認事項を説明します。基準は npm 公開版の **OpenSpec 1.13.2**、確認日は **2026-09-25 UTC** です。公式 main ブランチや別バージョンの動作とは区別します。

## 適した用途と、導入を急がなくてよい場面

OpenSpec は既存アプリケーションの継続的な変更に向いています。たとえばログイン方法を追加するときには、対象ユーザー、期限切れリンクの処理、従来のパスワードログインを維持するかを決める必要があります。仕様として記録すれば、実装、テスト、レビューが同じ内容を参照できます。

複数の会話や異なるコーディングアシスタントをまたいで機能を開発するときにも役立ちます。ただし、ファイルがあっても正確さの確認、現在のツールへの読み込み、要件変更時の更新は必要です。

次のような場合、導入を急ぐ必要はありません。

- API が利用できるかを確認するだけの使い捨て実験で、結果を長期保守する予定がない。
- ユーザーの課題がまだ不明確で、実装文書より先に調査が必要である。最初は探索だけでも構いません。
- 既存の要件、テスト、レビューの仕組みが変更を十分に扱えており、別の仕様を維持すると重複作業になる。
- インストールだけでアクセス制御、テスト網羅性、コンプライアンス承認が得られると期待している。これらには別の実行機構が必要です。

導入理由は具体的な情報の不足を埋めることであり、モデルの無誤謬性への期待ではありません。[BMAD の役割別・計画ワークフロー](/ja/garden/notes/bmad-method-guide/)に対し、本ガイドは一つの変更を中心に要件ファイルを整理する方法を扱います。共通の測定条件がない優劣ランキングは行いません。

## 一つの変更を完了するまで

従来のパスワードログインを残し、メールの使い捨てリンクによるログインだけを追加する例を考えます。

| 段階 | 操作と成果物 | 人が確認すること |
| --- | --- | --- |
| 意図を明確にする | `proposal.md` に理由、範囲、機能、影響を記録 | 登録、請求、画面全体の再設計が混入していないか |
| 振る舞いを記述する | `specs/auth/spec.md` に仕様差分を記録 | 成功、期限切れ、再使用、従来のログインを扱っているか |
| 設計と分解 | `design.md` に判断、`tasks.md` に作業を記録 | token の保存、失効、テスト方針が具体的か |
| 検証と実装 | CLI で構造を検証し、人やアシスタントが実装してテスト | 構造検証は安全性や機能のテストではない |
| レビューとアーカイブ | 差分を主要仕様へ反映し、変更を archive へ移動 | 実装済みか、主要仕様が受け入れた動作を表しているか |

これは作業順序であり、後戻りできない状態機械ではありません。実装中に制約が見つかったら提案、仕様、タスクへ戻り、影響するテストを再確認できます。タスクにチェックが付いていても、新しい判断をチャットだけに残さないでください。

## ファイルの保存場所

次は `spec-driven` schema で文書を補い終えた変更の構成です。**`new change` を一度実行しても、すべての本文が自動作成されるわけではありません。**

```text
openspec/
  config.yaml
  specs/
  changes/
    add-magic-link-login/
      .openspec.yaml
      proposal.md
      design.md
      tasks.md
      specs/
        auth/
          spec.md
```

`config.yaml` は選択した schema を記録し、プロジェクトの背景や記述ルールも指定できます。秘密情報は保存しません。`.openspec.yaml` は変更のメタデータです。Markdown ファイルにはレビュー可能な判断を記録します。主要仕様は機能単位で整理でき、ソースコードのディレクトリ構成と一致させる必要はありません。

アーカイブ前の新要件は `openspec/changes/add-magic-link-login/specs/auth/spec.md` にあります。アーカイブ後は `openspec/specs/auth/spec.md` に反映され、元の変更は `openspec/changes/archive/YYYY-MM-DD-add-magic-link-login/` へ移動します。日付は実行時点で決まります。

古い記事の `openspec/project.md` や `openspec/AGENTS.md` を、1.13.2 で必ず生成されるファイルだと考えないでください。連携機能は選んだツール用の skills やコマンドファイルを生成します。ルートの `AGENTS.md` を手書きすることは任意のプロジェクト規約であり、OpenSpec の仕様とは別です。

## 仕様差分と単なるタスク説明の違い

提案は変更の理由を説明し、仕様は変更後に必要な振る舞いを定義します。次の例は proposal に貼るだけでなく、変更内の `specs/auth/spec.md` に保存します。

```markdown
## ADDED Requirements

### Requirement: Reject a reused magic link
The system SHALL reject a magic link that has already been used.

#### Scenario: Link reuse
- **WHEN** a user submits a previously used magic link
- **THEN** the system rejects it without creating a session
```

パーサーが認識する英語の構造マーカーと `SHALL` は維持します。各 Requirement に具体的な Scenario が必要で、見出しレベルも形式の一部です。本文の言語はプロジェクト方針で決められますが、構造マーカーを自由に翻訳しないでください。

`ADDED` は新要件、`MODIFIED` は既存要件の改訂後の全文、`REMOVED` は要件の削除です。既存の振る舞いを変えるときは主要仕様と照合します。「ログインを変更する」だけでは、形式が正しくても維持すべき動作を判断できません。

この短い例は形式の説明です。ログイン機能には成功、期限切れ、パスワードログインの回帰シナリオも必要です。[最初の変更の完全なチュートリアル](/ja/blog/openspec-tutorial-cli-commands-agents-md-examples/)では proposal、delta、design、tasks をまとめて示します。

## ターミナルとアシスタントのコマンド

Node.js 20.19.0 以上と pnpm を用意し、新しい空の練習用ディレクトリで実行します。

```bash
pnpm dlx @fission-ai/openspec@1.13.2 --help
pnpm dlx @fission-ai/openspec@1.13.2 init . --tools none
pnpm dlx @fission-ai/openspec@1.13.2 new change add-magic-link-login
```

`--tools none` はアシスタント連携を導入せず、ファイルの流れを学ぶための指定です。モデルを呼び出したり、ログイン機能を実装したりしません。チュートリアルに沿ってファイルを補ってから、次を実行します。

```bash
pnpm dlx @fission-ai/openspec@1.13.2 validate add-magic-link-login --strict --json --no-interactive
```

別の入口として、アシスタント内の `/opsx:propose`、`/opsx:apply`、`/opsx:archive` があります。これらは shell コマンドではありません。1.13.2 で `--tools claude --profile core` を指定した初期化では、propose、explore、apply、archive、sync、update が生成されました。ツールによって表記が異なるため、初期化の出力を確認してください。追加のアクションは profile に依存し、古い例の全コマンドが既定で有効とは限りません。

CLI のファイル操作と構造検証にはモデルの認証情報は不要です。アシスタントによる文書生成、実装、レビューは宿主ツールとモデルサービスに依存します。費用とデータアクセスの範囲は分けて確認します。

## 既存プロジェクトで仕様を古くしないために

リポジトリ全体をすぐ文書化するより、明確な受け入れ条件を持つ小さな変更から始めます。提案から要件へ、要件からテストへたどれることを確認します。既存動作の説明はコードとテストに照らし合わせ、モデルの推測を確認済みの事実として扱いません。

アーカイブ前には未完了タスク、実際のテスト結果、主要仕様の更新範囲を確認します。構造検証はアプリケーションのテストを実行せず、使い捨て token が並行再送に耐えることも証明しません。不適切なコードのマージを防ぐには CI、ブランチ保護、承認ルールを実際に設定します。Markdown に「必須」と書くだけでは強制できません。

次に要件が変わるときも、関係する文書とテストを一緒に更新します。OpenSpec は情報を保存し検査する構造を提供しますが、正確さはチームの運用に依存します。

## 公式資料と次の手順

- [OpenSpec 1.13.2 README](https://github.com/Fission-AI/OpenSpec/blob/v1.13.2/README.md)：必要環境、既定ワークフロー、ツール入口。
- [1.13.2 CLI リファレンス](https://github.com/Fission-AI/OpenSpec/blob/v1.13.2/docs/cli.md)：コマンドの動作。正確な引数は同版の `--help` で確認します。
- [1.13.2 OPSX ワークフロー](https://github.com/Fission-AI/OpenSpec/blob/v1.13.2/docs/opsx.md)：成果物の依存関係と反復。
- [当サイトの CLI チュートリアル](/ja/blog/openspec-tutorial-cli-commands-agents-md-examples/)：固定版の導入、最初の変更、検証、アーカイブ。
