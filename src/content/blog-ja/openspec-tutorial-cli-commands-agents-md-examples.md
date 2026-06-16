---
title: 'OpenSpecチュートリアル：CLIの導入、コマンド、AGENTS.md、実践例'
pubDate: 2026-06-16T08:15:00.000Z
description: 'AIネイティブなspec-driven developmentのための実践的なOpenSpecチュートリアル。CLIの導入、プロジェクト初期化、変更作成、仕様検証、AGENTS.mdの活用、そしてbrownfieldワークフローまでを解説します。'
author: 'Remy'
tags: ['openspec', 'spec-driven development', 'sdd', 'ai coding', 'agents.md', 'cli']
lang: 'ja'
translatedFrom: 'openspec-tutorial-cli-commands-agents-md-examples'
---

## OpenSpecとは何か？

**OpenSpec** は、spec-driven development のための AI ネイティブな仕組みです。実運用では、AI コーディングワークフローに持続的な構造を与えます。エージェントに「この機能を実装して」とそのまま依頼するのではなく、変更内容を提案として記述し、仕様を検証し、エージェントにその仕様に沿って実装させ、完了した変更を主要な真実のソースへアーカイブします。

そのため OpenSpec は、特に **brownfield プロジェクト** に向いています。つまり、既存コードベースにおいて作業の大半が greenfield の書き直しではなく、バグ修正、機能追加、リファクタリング、製品変更の継続的な積み重ねであるケースです。

より広い比較を見たい場合は、SDD の比較記事 [BMAD vs spec-kit vs OpenSpec vs PromptX](/blog/-sddbmad-vs-spec-kit-vs-openspec-vs-promptx/) も書いています。このチュートリアルでは、日常的に OpenSpec をどう使うかに絞って説明します。

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

`npx` で実行できます。

```bash
npx -y @fission-ai/openspec@latest --help
```

CLI のエントリポイントは `openspec` です。

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

リポジトリのルートから実行します。

```bash
npx -y @fission-ai/openspec@latest init .
```

AI ツールを対話なしで設定したい場合は `--tools` を使います。

```bash
npx -y @fission-ai/openspec@latest init . --tools claude,codex,cursor,gemini,github-copilot
```

次のようにも実行できます。

```bash
npx -y @fission-ai/openspec@latest init . --tools all
npx -y @fission-ai/openspec@latest init . --tools none
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

重要なメンタルモデルは、**仕様が先、コードは後** です。

## 新しいOpenSpecの変更を作成する

`openspec new change <name>` を使います。

```bash
npx -y @fission-ai/openspec@latest new change add-user-login
```

説明を追加することもできます。

```bash
npx -y @fission-ai/openspec@latest new change add-user-login   --description "Add email/password login with session persistence"
```

連携ワークスペースでは、次のようなフラグも使えます。

```text
--goal <text>         変更に保存するワークスペースの製品目標
--areas <names>       影響を受けるワークスペースリンク名をカンマ区切りで指定
--initiative <id>     リポジトリローカルの変更をイニシアチブにリンクする
--schema <name>       使用するワークフロー schema。既定は spec-driven
--json                JSON で出力する
```

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
npx -y @fission-ai/openspec@latest new change add-magic-link-login   --description "Allow users to sign in with one-time email magic links"
```

次に、コードを書く前に意図を定義します。強い提案は次の問いに答えます。

- どのユーザー課題を解決するのか？
- どの既存フローに影響するのか？
- 何を後方互換のまま維持する必要があるのか？
- 受け入れ条件は何か？
- AI エージェントに変更させてはいけないものは何か？

例:

```markdown
# Change: add-magic-link-login

## Why
Users forget passwords and support receives frequent reset requests. Magic-link login should reduce friction while preserving existing password login.

## What changes
- Add a magic-link request form.
- Send a single-use email token.
- Validate the token and create a session.
- Keep existing email/password login unchanged.

## Non-goals
- Do not remove password login.
- Do not redesign the entire auth page.
- Do not change billing or account settings.

## Acceptance criteria
- A valid link signs the user in once.
- Expired or reused links fail safely.
- Existing password login tests still pass.
```

これが OpenSpec の要点です。AI エージェントに、より小さく安全な作業領域を与えます。

## 変更と仕様を検証する

実装前に検証を実行します。

```bash
npx -y @fission-ai/openspec@latest validate add-magic-link-login
```

より厳密にチェックするには次のとおりです。

```bash
npx -y @fission-ai/openspec@latest validate add-magic-link-login --strict
```

すべてを検証する場合は:

```bash
npx -y @fission-ai/openspec@latest validate --all
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
npx -y @fission-ai/openspec@latest validate --all --strict --json --no-interactive
```

## OpenSpec項目を一覧表示・確認する

アクティブな変更を一覧表示します。

```bash
npx -y @fission-ai/openspec@latest list
```

仕様だけを一覧表示する場合:

```bash
npx -y @fission-ai/openspec@latest list --specs
```

機械可読な出力を得るには:

```bash
npx -y @fission-ai/openspec@latest list --json
```

変更や仕様を表示します。

```bash
npx -y @fission-ai/openspec@latest show add-magic-link-login
```

JSON で表示するには:

```bash
npx -y @fission-ai/openspec@latest show add-magic-link-login --json
```

名前が曖昧な場合は type を指定します。

```bash
npx -y @fission-ai/openspec@latest show add-magic-link-login --type change
```

変更レビューの自動化には `--deltas-only` が便利です。

```bash
npx -y @fission-ai/openspec@latest show add-magic-link-login --json --deltas-only
```

## AGENTS.mdはOpenSpecにどう組み込まれるか

多くの AI コーディングツールは、リポジトリ内の指示ファイルを読みます。`AGENTS.md` は、コードベース内でエージェントにどう振る舞うべきかを伝える、一般的な慣習になっています。

OpenSpec は、対応ツール向けに指示ファイルを生成または更新できます。これは、仕様ワークフローが機能するためには、エージェントがルールを知っている必要があるからです。

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
npx -y @fission-ai/openspec@latest archive add-magic-link-login
```

確認プロンプトを省略するには:

```bash
npx -y @fission-ai/openspec@latest archive add-magic-link-login --yes
```

インフラ、ツール、ドキュメントのみの変更など、仕様更新が不要な場合:

```bash
npx -y @fission-ai/openspec@latest archive docs-update --skip-specs
```

`--no-validate` もありますが、通常運用ではなく緊急避難策として扱ってください。

## OpenSpecコマンド早見表

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

## OpenSpecのベストプラクティス

### 1. 各変更は小さく保つ

OpenSpec は、変更が 1 つの一貫した機能、バグ修正、またはリファクタリングに対応しているときに最も効果を発揮します。提案に認証、価格設定、オンボーディング、デザイン刷新が混ざっているなら、分割してください。

### 2. Non-goals を明示する

AI エージェントはしばしば範囲を広げすぎます。`Non-goals` セクションは、意図しないスコープ拡大を防ぎます。

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

## 最後に

OpenSpec の価値は、AI コーディングをチャットだけの活動から、レビュー可能な変更管理ループへ変えることにあります。

```text
proposal -> spec delta -> validation -> implementation -> review -> archive
```

このループはシンプルですが、AI エージェントには持続的なコンテキストと境界が必要だという、現実の問題を解決します。OpenSpec はその両方を提供します。
