---
title: 'OpenSpecチュートリアル：CLIの導入、コマンド、AGENTS.md、実践例'
pubDate: 2026-06-16T08:15:00.000Z
updatedDate: 2026-10-26T00:00:00.000Z
description: 'Windows、macOS、Linux に OpenSpec を導入し、PATH と複数バージョンの問題を確認。目的別 CLI コマンドと固定バージョンの変更・検証・アーカイブ例を紹介します。'
author: 'Remy'
tags: ['openspec', 'sdd', 'ai-coding', 'agents.md', 'cli']
lang: 'ja'
translatedFrom: 'openspec-tutorial-cli-commands-agents-md-examples'
---

## Windows、macOS、Linux に OpenSpec をインストールする

2026 年 10 月 26 日更新。npm の `latest` は **1.15.0** です。単体実行ファイルは Node.js を必要としません。npm パッケージには Node.js **20.19.0+** が必要です。インストール方法は一つ選びます。対応環境は[公式インストール文書](https://github.com/Fission-AI/OpenSpec/blob/v1.15.0/docs/installation.md)で確認できます。

Windows PowerShell では公式の単体版インストーラーを使います。

```powershell
irm https://raw.githubusercontent.com/Fission-AI/OpenSpec/main/scripts/binary/install.ps1 | iex
```

macOS または Linux では次を使います。

```bash
curl -fsSL https://raw.githubusercontent.com/Fission-AI/OpenSpec/main/scripts/binary/install.sh | sh
```

これらは `main` の公式インストーラーを実行し、公開済みバイナリを取得して SHA256SUMS と照合します。`main` をビルドする操作ではありません。バイナリを固定するには、先にそのシェルで環境変数 `OPENSPEC_VERSION=v1.15.0` を設定します。既定の保存先は Windows が `%LOCALAPPDATA%\Programs\openspec`、macOS と Linux が `~/.local/bin` です。Windows ではユーザー PATH に追加されます。導入後に新しいターミナルを開きます。

Node.js と pnpm を使っている場合は、公開パッケージも選べます。

```bash
node --version
pnpm add -g @fission-ai/openspec@1.15.0
openspec --version
```

この固定版なら最後の出力は `1.15.0` です。グローバルに導入しない場合は `pnpm dlx @fission-ai/openspec@1.15.0 --version` を使います。`dlx` の成功だけでは、裸の `openspec` コマンドは利用可能になりません。

### コマンドが見つからない場合と版が違う場合

Windows では一致する実行ファイルを調べ、単体版を直接実行します。

```powershell
Get-Command openspec -All
where.exe openspec
& "$env:LOCALAPPDATA\Programs\openspec\openspec.exe" --version
```

完全なパスでは動くのに裸のコマンドが見つからない場合、新しいターミナルでユーザー PATH を確認します。古い版が動く場合は、先にある PATH 項目やシェルの別名が別のコピーを選んでいます。pnpm の実行ファイルの場所は `pnpm bin -g` で確認できます。global bin が未設定なら pnpm の設定を直し、その間の練習には `dlx` を使えます。

macOS または Linux では次を実行します。

```bash
command -v openspec
which -a openspec
"$HOME/.local/bin/openspec" --version
```

必要なら実際のインストール先をシェルの PATH に追加します。nvm や fnm では有効な Node バージョンを確認してください。グローバルパッケージが別のバージョンに属している場合があります。バージョン管理ツールの shim の更新が必要なこともあります。どの方法で導入したコピーか確認してから削除します。

### 同じ導入方法で更新・削除する

`openspec version --check` で更新を確認します。pnpm 版は `pnpm add -g @fission-ai/openspec@latest` で更新し、各プロジェクト内で `openspec update` を実行して連携ファイルを更新します。生成された差分も確認します。CLI の版の変更とプロジェクトの指示ファイルの更新は別の操作です。

単体版はインストーラーを再実行します。`openspec install` はパッケージ管理版から単体版へ切り替える操作で、古いコピーの削除方法を表示します。終了後、新しいターミナルで選ばれる実行ファイルを確認します。

pnpm 版の削除は `pnpm remove -g @fission-ai/openspec` です。単体版では、確認した場所の実行ファイルと対応する PATH 項目だけを削除します。`openspec uninstall` コマンドはありません。履歴が必要なら `openspec/specs/` と `openspec/changes/archive/` を残してください。CLI の削除にプロジェクト文書の削除は不要です。

## 目的から CLI コマンドを探す

以下は 1.15.0 のターミナル用コマンドです。対象プロジェクトで実行します。グローバルに導入していなければ、`openspec` を `pnpm dlx @fission-ai/openspec@1.15.0` に置き換えます。

<div class="content-table-scroll" role="region" aria-label="目的 / コマンド / 確認する結果" tabindex="0">

| 目的 | コマンド | 確認する結果 |
| --- | --- | --- |
| バージョン確認 | `openspec --version` | 実際に動く版 |
| 引数の確認 | `openspec new change --help` | その版の対応オプション |
| 助手ファイルなしで初期化 | `openspec init . --tools none` | `openspec/` と設定 |
| 変更の作成 | `openspec new change add-magic-link-login` | 変更ディレクトリ。完成した提案ではない |
| 変更の一覧 | `openspec list --json` | 進行中の変更 |
| 成果物の状態 | `openspec status --change add-magic-link-login --json` | 文書の状態。アプリのテスト結果ではない |
| 提案用の指示 | `openspec instructions proposal --change add-magic-link-login --json` | テンプレートと依存関係 |
| 差分の検証 | `openspec validate add-magic-link-login --strict --json --no-interactive` | 検証結果と終了コード |
| 主要仕様の確認 | `openspec show auth --type spec` | 主要仕様の内容 |
| レビュー済み変更の保存 | `openspec archive add-magic-link-login` | 保存先と主要仕様の更新 |

</div>

`/opsx:propose` と `/opsx:apply` は助手のチャットに入力します。PowerShell や Bash のコマンドではありません。呼び出し方は連携ごとに異なり、Codex は `$openspec-propose` などのスキル名を使います。生成されたファイルを確認し、全ツールが同じ表記を受け付けると考えないでください。詳細は[1.15.0 CLI リファレンス](https://github.com/Fission-AI/OpenSpec/blob/v1.15.0/docs/cli.md)を参照してください。

複数のコードリポジトリで仕様を共有する場合は、[Stores の二つのリポジトリを使う例](/ja/blog/openspec-1-5-stores-beta-update-guide/#multi-repo-practice)へ進みます。Stores は 1.15.0 に含まれますが、機能は Beta 扱いです。npm の `beta` タグは別の配布タグであり、Stores を使うために必要な版ではありません。

## OpenSpecクイックスタート

以下の練習は再現用に **1.13.2** を維持します。既存のコマンドを変更せず、同じ proposal、delta、design、tasks を 1.15.0 でも検証済みです。[ダウンロードできる CLI 検証スクリプト](/assets/openspec-search-repair/check-examples.mjs)はモデルを呼び出さず、ローカルのファイル操作だけを実行します。インストーラーと助手による実装は別途検証が必要です。

本記事は npm 公開版の **OpenSpec 1.13.2** を使用します。必要環境は Node.js **20.19.0+** と pnpm です。Node.js 26.7.0、pnpm 10.28.2 を使い、リポジトリ外の空ディレクトリでファイル操作を検証しました。モデルは呼び出していません。新しい練習用ディレクトリで実行してください。

```bash
pnpm dlx @fission-ai/openspec@1.13.2 --help
pnpm dlx @fission-ai/openspec@1.13.2 init . --tools none
```

`--tools none` はアシスタント連携を設定せず、仕様の構造だけを初期化します。生成物を確認してから既存プロジェクトへの導入を判断してください。定義、用途、ファイルの関係は [OpenSpec 独立ガイド](/ja/garden/notes/openspec-guide/)で説明しています。本記事は最初の変更を実行する手順に絞ります。

## OpenSpecとは何か？

**OpenSpec** は、spec-driven development のための AI ネイティブな仕組みです。実運用では、AI コーディングワークフローに持続的な構造を与えます。エージェントに「この機能を実装して」とそのまま依頼するのではなく、変更内容を提案として記述し、仕様を検証し、エージェントにその仕様に沿って実装させ、完了した変更を主要な真実のソースへアーカイブします。

そのため OpenSpec は、特に **brownfield プロジェクト** に向いています。つまり、既存コードベースにおいて作業の大半が greenfield の書き直しではなく、バグ修正、機能追加、リファクタリング、製品変更の継続的な積み重ねであるケースです。

より広い比較には、SDD の比較記事 [BMAD vs spec-kit vs OpenSpec vs PromptX](/ja/blog/-sddbmad-vs-spec-kit-vs-openspec-vs-promptx/) があります。このチュートリアルでは、日常的に OpenSpec をどう使うかに絞って説明します。

## いつOpenSpecを使うべきか？

AI コーディングエージェントを、より決定論的に、そしてプロンプトのぶれを少なく運用したいときに OpenSpec を使います。

相性が良いケース:

- すでに動いているコードベースがあり、より安全に AI 支援の変更を行いたい。
- 重いエンタープライズプロセスを導入せずに、軽量な仕様ワークフローがほしい。
- 何が変わったのか、なぜ変わったのか、どの要件が更新されたのかを明確に残したい。
- 複数の AI ツールを使っており、プロジェクト指示を共有したい。
- コード生成前に、レビュー担当者に **意図** と **受け入れ条件** を確認してほしい。

一度きりの使い捨てプロトタイプなら、OpenSpec の必要性はそれほど高くありません。リポジトリに信頼できる意思決定を積み上げ続ける必要があるとき、その価値が高まります。

## OpenSpec CLIをインストール／実行する

npm パッケージは次のとおりです。

```bash
@fission-ai/openspec
```

pnpm で固定バージョンを実行します。

```bash
pnpm dlx @fission-ai/openspec@1.13.2 --help
```

CLI のエントリポイントは `openspec` です。後半の早見表と任意の AGENTS.md 例の短いコマンドは、同じ版の CLI を別途インストールした場合の表記です。それ以外は `pnpm dlx @fission-ai/openspec@1.13.2` を前に付けます。

```bash
openspec --help
```

最上位の help には、次のようなコマンドが含まれます。

```text
init            プロジェクトに OpenSpec を初期化する
update          OpenSpec の指示ファイルを更新する
list            変更や仕様を一覧表示する
view            インタラクティブなダッシュボードを表示する
new change      新しい変更ディレクトリを作成する
validate        変更と仕様を検証する
show            変更または仕様を表示する
archive         完了した変更をアーカイブし、主要仕様を更新する
status          アーティファクト完了状況を表示する
instructions    強化済みのアーティファクト／タスク指示を出力する
```

## プロジェクトでOpenSpecを初期化する

対話でツールを選ぶ場合は、対象プロジェクトのルートで次を実行します。練習用の `--tools none` に代わる選択肢であり、再初期化が必須という意味ではありません。

```bash
pnpm dlx @fission-ai/openspec@1.13.2 init .
```

AI ツールを対話なしで設定したい場合は `--tools` を使います。

```bash
pnpm dlx @fission-ai/openspec@1.13.2 init . --tools claude,codex,cursor,gemini,github-copilot
```

次のようにも実行できます。

```bash
pnpm dlx @fission-ai/openspec@1.13.2 init . --tools all
pnpm dlx @fission-ai/openspec@1.13.2 init . --tools none
```

CLI の help では、`claude`、`codex`、`cursor`、`gemini`、`github-copilot`、`kilocode`、`qwen`、`windsurf`、`cline`、`continue`、`opencode`、`roocode`、`trae` など、多くの対応ツールが列挙されています。

## OpenSpecの基本ワークフロー

OpenSpec の基本ループは次のとおりです。

1. リポジトリに OpenSpec を **初期化** する。
2. 1 つの機能、バグ修正、またはリファクタリングのために **変更を作成** する。
3. 実装前に **提案と仕様差分** を書く。
4. 変更を **検証** する。
5. 承認済みの変更に対して、AI エージェントに **実装** を依頼する。
6. コードを **レビュー** し、**テスト** する。
7. 完了した変更を **アーカイブ** して、主要仕様を最新に保つ。

本記事は**仕様レビューを実装より先に行う**というプロジェクト方針を採用します。OpenSpec の成果物は反復して更新できます。実装で新しい制約が判明したら proposal、delta、design、tasks を修正し、再検証してください。CLI が不可逆な順序を強制するわけではありません。

## 新しいOpenSpecの変更を作成する

`openspec new change <name>` を使います。

```bash
pnpm dlx @fission-ai/openspec@1.13.2 new change add-user-login
```

説明を追加することもできます。

```bash
pnpm dlx @fission-ai/openspec@1.13.2 new change add-user-login   --description "Add email/password login with session persistence"
```

公開版 1.13.2 の `new change --help` には次の引数があります。

```text
--goal <text>         変更に保存する任意の目標メタデータ
--schema <name>       使用するワークフロー schema。既定は spec-driven
--json                JSON で出力する
```

古い workspace 例の `--areas` と `--initiative` は、この版のコマンドにコピーしません。`--goal` は引き続き利用できますが、任意のメタデータであり、必須のワークスペース設定ではありません。同じ版の help を確認し、npm 公開版と公式 main の動作を混同しないでください。

良い変更名は、具体的で動詞ベースであるべきです。

```text
add-user-login
fix-billing-retry-idempotency
refactor-search-indexing
improve-onboarding-empty-state
```

曖昧な名前は避けます。

```text
updates
misc-fixes
new-stuff
ai-work
```

## 例：既存コードベースでの機能変更

SaaS アプリを運用していて、magic-link ログインを追加したいとします。

変更を作成します。

```bash
pnpm dlx @fission-ai/openspec@1.13.2 new change add-magic-link-login --description "Allow users to sign in with one-time email magic links"
```

次に、コードを書く前に意図を定義します。強い提案は次の問いに答えます。

- どのユーザー課題を解決するのか？
- どの既存フローに影響するのか？
- 何を後方互換のまま維持する必要があるのか？
- 受け入れ条件は何か？
- AI エージェントに変更させてはいけないものは何か？

次を `openspec/changes/add-magic-link-login/proposal.md` に保存します。上のコマンドはメタデータと説明付き README を作りますが、完成した proposal や delta は生成しません。

```markdown
# Change: add-magic-link-login

## Why
Users forget passwords and support receives frequent reset requests. Magic-link login should reduce friction while preserving existing password login.

## What Changes
- Add a magic-link request form.
- Send a single-use email token.
- Validate the token and create a session.
- Keep existing email/password login unchanged.

## Capabilities
### New Capabilities
- `auth`: Single-use magic-link login alongside password login.
### Modified Capabilities
- None. This practice project has no existing auth spec.

## Impact
Authentication routes, token storage, email delivery, and login tests.

## Non-goals
- Do not remove password login.
- Do not redesign the entire auth page.
- Do not change billing or account settings.

## Acceptance criteria
- A valid link signs the user in once.
- Expired or reused links fail safely.
- Existing password login tests still pass.
```

既存アプリに auth 仕様があるなら先に確認します。既存要件には、新たな `ADDED` ではなく `MODIFIED` が必要な場合があります。この練習は主要 auth 仕様がない状態から始めます。

### 実際の仕様差分ファイルを追加する

`openspec/changes/add-magic-link-login/specs/auth/` を作成し、次の全文を `openspec/changes/add-magic-link-login/specs/auth/spec.md` として保存します。

```markdown
## Purpose
Allow existing users to sign in with a single-use email link while preserving the existing password sign-in flow.

## ADDED Requirements

### Requirement: Single-use magic-link sign-in
The system SHALL allow an existing user to sign in with a valid, unexpired, unused email link, consume it atomically, and reject expired or reused links without creating a session.

#### Scenario: Valid link
- **WHEN** an existing user submits a valid, unexpired, unused link
- **THEN** the system creates a session and marks the link as used

#### Scenario: Expired link
- **WHEN** a user submits an expired link
- **THEN** the system rejects it without creating a session

#### Scenario: Reused link
- **WHEN** a user submits a previously used link
- **THEN** the system rejects it without creating a session

### Requirement: Preserve password sign-in
The system SHALL retain the existing email and password sign-in behavior.

#### Scenario: Existing password login
- **WHEN** an existing user submits correct email and password credentials
- **THEN** the system signs the user in through the existing flow
```

二つの要件は、使い捨てリンクによるログインと既存パスワードログインの維持です。四つのシナリオは有効、期限切れ、再使用されたリンクと従来のログインを扱います。`## ADDED Requirements`、`### Requirement:`、`#### Scenario:` はパーサー用の構造なので、英語マーカーと `SHALL` を維持します。proposal の受け入れ条件一覧では代替できません。形式検証は token 消費の原子性を証明しません。

### 設計と実装タスクを追加する

`openspec/changes/add-magic-link-login/design.md` に保存します。

```markdown
## Context
パスワードログインを維持して、メールリンクによるログインを追加する。

## Goals / Non-Goals
既存ユーザーのみを対象とする。登録、請求、画面の再設計は対象外。

## Decisions
ランダムな token のハッシュ、ユーザー ID、有効期限、使用状態を保存する。
期限内の token を原子的に消費してからセッションを作成する。
従来のパスワードフローを維持し、メールにはローカルのテスト用代替を使う。

## Risks / Trade-offs
原子的な消費でなければ、並行リクエストで token が再使用される可能性がある。
期限切れ、再使用、並行リクエストのアプリケーションテストが必要。

## Migration Plan
機能フラグで token 保存を導入する。無効化してもパスワードログインは維持する。
```

`openspec/changes/add-magic-link-login/tasks.md` に保存します。

```markdown
## 1. Implementation
- [ ] 1.1 token 保存と要求エンドポイントを追加し、ローカルのメール代替を使う。
- [ ] 1.2 原子的な token 消費とセッション作成を実装する。

## 2. Verification
- [ ] 2.1 有効、期限切れ、再使用、並行送信の token をテストする。
- [ ] 2.2 既存パスワードログインの回帰テストを実行し、差分をレビューする。
```

文書が揃ったことと出荷できることは別です。実装とテストの証拠を得てからタスクを完了にします。schema の成果物状態を確認するには次を実行します。

```bash
pnpm dlx @fission-ai/openspec@1.13.2 status --change add-magic-link-login --json
```

## 変更と仕様を検証する

実装前に検証を実行します。

```bash
pnpm dlx @fission-ai/openspec@1.13.2 validate add-magic-link-login
```

より厳密にチェックするには次のとおりです。

```bash
pnpm dlx @fission-ai/openspec@1.13.2 validate add-magic-link-login --strict --json --no-interactive
```

すべてを検証する場合は:

```bash
pnpm dlx @fission-ai/openspec@1.13.2 validate --all
```

便利な検証フラグ:

```text
--all              すべての変更と仕様を検証する
--changes          すべての変更を検証する
--specs            すべての仕様を検証する
--type <type>      曖昧な場合に変更または仕様を指定する
--strict           厳格な検証モードを有効にする
--json             検証結果を JSON で出力する
--no-interactive   対話プロンプトを無効にする
```

CI では `--json` と `--no-interactive` が特に有用です。

```bash
pnpm dlx @fission-ai/openspec@1.13.2 validate --all --strict --json --no-interactive
```

## OpenSpec項目を一覧表示・確認する

アクティブな変更を一覧表示します。

```bash
pnpm dlx @fission-ai/openspec@1.13.2 list
```

仕様だけを一覧表示する場合:

```bash
pnpm dlx @fission-ai/openspec@1.13.2 list --specs
```

機械可読な出力を得るには:

```bash
pnpm dlx @fission-ai/openspec@1.13.2 list --json
```

変更や仕様を表示します。

```bash
pnpm dlx @fission-ai/openspec@1.13.2 show add-magic-link-login
```

JSON で表示するには:

```bash
pnpm dlx @fission-ai/openspec@1.13.2 show add-magic-link-login --json
```

名前が曖昧な場合は type を指定します。

```bash
pnpm dlx @fission-ai/openspec@1.13.2 show add-magic-link-login --type change
```

変更レビューの自動化には `--deltas-only` が便利です。

```bash
pnpm dlx @fission-ai/openspec@1.13.2 show add-magic-link-login --json --deltas-only
```

## AGENTS.mdはOpenSpecにどう組み込まれるか

多くの AI コーディングツールは、リポジトリ内の指示ファイルを読みます。`AGENTS.md` は、コードベース内でエージェントにどう振る舞うべきかを伝える、一般的な慣習になっています。

OpenSpec はツール別の skills とコマンドファイルを生成します。たとえば別の 1.13.2 初期化で `--tools claude` を選ぶと、`.claude/skills/openspec-propose/SKILL.md` と `.claude/commands/opsx/propose.md` が生成されます。自動生成の `openspec/AGENTS.md` は必須ではありません。以下は手書きできる任意のプロジェクト規約です。

- 変更提案を読む前に実装しない。
- 実装は承認済みの変更に限定する。
- 仕様で求められる場合はテストとドキュメントを更新する。
- 完了を主張する前に検証を実行する。
- 実装とレビューが完了した後にのみアーカイブする。

OpenSpec のための実用的な `AGENTS.md` セクションは、次のようになります。

```markdown
## OpenSpec workflow

- Before coding, check active OpenSpec changes with `openspec list`.
- For a new feature or behavior change, create or use a change under `openspec/changes/`.
- Do not implement broad unrelated refactors inside a feature change.
- Run `openspec validate <change-name> --strict` before implementation handoff.
- After code and tests pass, archive with `openspec archive <change-name>`.
```

`AGENTS.md` の価値は、AI を魔法のように完璧にすることではありません。対応するアシスタントが、同じ運用契約から始められることにあります。

## AIコーディングエージェントで実装する

変更を書き、検証したら、エージェントに焦点を絞った指示を与えます。

```text
OpenSpec change `add-magic-link-login` を実装してください。
まず提案と spec diff を読んでください。
実装はこの変更にスコープを限定してください。
関連テストを実行し、仕様からの逸脱があれば報告してください。
```

このプロンプトは、次よりもはるかに良いです。

```text
Add magic link login.
```

OpenSpec 版は、エージェントに持続的な真実のソース、境界、レビュー対象を与えます。

## 完了した変更をアーカイブする

実装、レビュー、テストの後に、変更をアーカイブします。

```bash
pnpm dlx @fission-ai/openspec@1.13.2 archive add-magic-link-login
```

確認プロンプトを省略するには:

```bash
pnpm dlx @fission-ai/openspec@1.13.2 archive add-magic-link-login --yes
```

変更が `openspec/changes/archive/YYYY-MM-DD-add-magic-link-login/` に移動し、`openspec/specs/auth/spec.md` に二つの要件が反映されたことを確認します。その後、主要仕様を検証します。

```bash
pnpm dlx @fission-ai/openspec@1.13.2 validate auth --type spec --strict --json --no-interactive
```

本記事の隔離検証では、上記ファイルを使って init、new、厳格検証、archive を実行しました。認証機能の実装やメール送信は行っていません。演習ではアプリのタスクを未完了のまま残して警告を確認しました。アーカイブ成功はタスク完了の証拠ではありません。実プロジェクトでは実装、テスト、タスク更新を終えてからアーカイブし、例を通すために検証を省略しないでください。

delta の `## Purpose` は、新しい機能の主要仕様を作成するときの目的になります。これがないと archive が仮の文章を生成し、その後の厳格検証が失敗する場合があります。既存主要仕様の仮文は、そのファイルを直接修正します。`--skip-specs` は仕様更新が本当に不要な変更だけに使い、このログイン例では差分を反映します。

## OpenSpecコマンド早見表

<div class="content-table-scroll" role="region" aria-label="Task / Command" tabindex="0">

| Task | Command |
|---|---|
| CLI help を表示 | `openspec --help` |
| リポジトリを初期化 | `openspec init .` |
| ツール付きで初期化 | `openspec init . --tools claude,codex,cursor` |
| 変更を作成 | `openspec new change add-user-login` |
| アクティブな変更を一覧表示 | `openspec list` |
| 仕様を一覧表示 | `openspec list --specs` |
| 変更または仕様を表示 | `openspec show <name>` |
| 1件を検証 | `openspec validate <name>` |
| 厳格検証 | `openspec validate <name> --strict` |
| すべてを検証 | `openspec validate --all --strict` |
| 完了した変更をアーカイブ | `openspec archive <name>` |
| プロンプトなしでアーカイブ | `openspec archive <name> --yes` |
| 指示ファイルを更新 | `openspec update .` |

</div>

## OpenSpecのベストプラクティス

### 1. 各変更は小さく保つ

OpenSpec は、変更が 1 つの一貫した機能、バグ修正、またはリファクタリングに対応しているときに最も効果を発揮します。提案に認証、価格設定、オンボーディング、デザイン刷新が混ざっているなら、分割してください。

### 2. Non-goals を明示する

AI エージェントは範囲を広げる場合があります。`Non-goals` はレビューでそれを発見しやすくしますが、ファイル書き込み権限の制御ではありません。

### 3. 実装前に検証する

検証は、AI がコードを書く前に構造上の問題を見つけます。弱い仕様に基づく生成コードをデバッグするより、はるかに安上がりです。

### 4. 自動化には JSON 出力を使う

`openspec list --json`、`openspec show --json`、`openspec validate --json` のようなコマンドは、スクリプトや CI チェックで役立ちます。

### 5. 一貫してアーカイブする

完了した変更をアーカイブしないと、リポジトリには古い提案が溜まります。アーカイブ工程こそが、主要仕様を現実に一致させる仕組みです。

## よくあるミス

### ミス：OpenSpec をドキュメントの置き場として使う

OpenSpec は、雑多なドキュメントを保存する場所ではありません。制御された変更のためのワークフローです。

### ミス：大きすぎる変更を 1 つ作る

大きな変更は、AI 実装のレビューを難しくします。明確な受け入れ条件を持つ小さな変更に分けましょう。

### ミス：検証を省く

仕様が無効なら、生成コードは高確率でぶれます。早めに検証してください。

### ミス：エージェントにすべて推測させる

製品意図を推測させてはいけません。提案を書き、Non-goals を定義し、受け入れ条件を明示してください。

## OpenSpec vs spec-kit vs BMAD：簡易比較

- **OpenSpec**: 軽量で、brownfield かつ変更中心のワークフローに最適。
- **GitHub spec-kit**: 構造化された greenfield や、企業向けのゲート付きフローに強い。
- **BMAD**: 開発前に、役割ベースの AI 計画チームを使いたい場合に有用。
- **PromptX**: 厳密な仕様ワークフローというより、コンテキスト／ペルソナ基盤に近い。

「既存リポジトリで AI エージェントを安全に使うにはどうすればいいか？」と考えているなら、OpenSpec は最も実践的な出発点の 1 つです。

## バージョン付き参考資料

- [OpenSpec 1.13.2 README](https://github.com/Fission-AI/OpenSpec/blob/v1.13.2/README.md)
- [1.13.2 CLI リファレンス](https://github.com/Fission-AI/OpenSpec/blob/v1.13.2/docs/cli.md)
- [1.13.2 OPSX ワークフロー](https://github.com/Fission-AI/OpenSpec/blob/v1.13.2/docs/opsx.md)

## 最後に

OpenSpec の価値は、AI コーディングをチャットだけの活動から、レビュー可能な変更管理ループへ変えることにあります。

```text
proposal -> spec delta -> validation -> implementation -> review -> archive
```

このループはシンプルですが、AI エージェントには持続的なコンテキストと境界が必要だという、現実の問題を解決します。OpenSpec はその両方を提供します。
