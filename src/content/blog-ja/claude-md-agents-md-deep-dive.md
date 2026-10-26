---
title: 'AGENTS.mdとCLAUDE.mdの違い：読み込み条件、共存設定、テンプレート'
pubDate: 2026-04-26T00:00:00.000Z
updatedDate: 2026-10-26T00:00:00.000Z
description: 'Claude Codeのバージョン別にAGENTS.mdとCLAUDE.mdの読み込みと共存を説明。Codexの探索規則、確認手順、共通指示のテンプレートも掲載。'
author: 'Remy'
tags: ['claude-code', 'ai-agents', 'Context Engineering']
lang: 'ja'
translatedFrom: 'claude-md-agents-md-deep-dive'
---

## AGENTS.mdとCLAUDE.mdはどちらを使う？

**複数ツールで共有するリポジトリの指示とCodex向けの指示はAGENTS.md、Claude Code専用の指示はCLAUDE.mdに置く。** 両方を使うチームには、共通ルールを `AGENTS.md` に集め、短い `CLAUDE.md` から `@AGENTS.md` でインポートする構成を勧める。共通ルールを一か所で保守でき、各メンバーのClaudeのバージョンやフォールバック設定にも依存しにくい。[1] [2] [3]

**Claude CodeはAGENTS.mdを直接読むのか。** **v2.1.277以降**の対応セッションでは読める。ただし既定では、作業ディレクトリかその祖先に `CLAUDE.md`、`.claude/CLAUDE.md`、`CLAUDE.local.md` があると、AGENTSへのフォールバックが止まる。ユーザーの `~/.claude/CLAUDE.md`、組織管理の指示、`.claude/rules/` はこの判定から除外される。両方のファイルを置くだけでは、両方が読み込まれるとは限らない。[1]

まず `claude --version`、次に `/config` の **Project instructions** と `/context` を確認し、`/memory` でAGENTSのパスを見る。旧クライアントや混在環境には下の[インポート用テンプレート](#共通ルールとインポートのテンプレート)を使う。直接共存させる条件は[バージョン表](#バージョンと配置による読み込みの違い)、Codexについては[独自の探索規則](#codexの探索とフォールバック)を参照してほしい。

## バージョンと配置による読み込みの違い

以下は**2026年10月26日に確認した公式文書**の説明であり、過去の全バージョンに共通する仕様ではない。[1]

| バージョンまたは設定 | 動作 |
| --- | --- |
| v2.1.277より前、AGENTS内蔵プラグインを無効化、またはv2.1.276以前から更新した直後の一部セッション | 直接読み込めない。CLAUDEからインポートする。更新後は新しいセッションも試す。 |
| v2.1.277からv2.1.280 | 直接読み込みに対応するが、Bedrockやテレメトリー無効などの一部セッションでは更新かインポートが必要。 |
| 対応セッションで既定の `claude-md-or-agents-md` | 作業ディレクトリと祖先に対象のCLAUDEファイルがない場合だけAGENTSを読む。 |
| `claude-md-and-agents-md` | 両方を読む。各ディレクトリではCLAUDEが先、AGENTSが後。インポート済みのAGENTSは重複しない。 |
| `claude-md` | CLAUDEだけを直接読む。明示的な `@AGENTS.md` インポートは使える。 |
| `managed-only` | 起動時は組織管理の指示と自動メモリーだけ。サブディレクトリやパス別ルールの遅延読み込みまで全面的に止める設定ではない。 |

`/config` の **Project instructions** で変更する。ユーザー設定を編集する場合は、既存の値を残して `~/.claude/settings.json` に次の項目を統合する。

```json
{
  "pluginConfigs": {
    "cc-plugin-agents-md@builtin": {
      "options": { "instructionFiles": "claude-md-and-agents-md" }
    }
  }
}
```

**v2.1.285より前**はキーを `agents-md@builtin` にする。v2.1.285以降は両方のIDを受け付ける。この項目を読むのはユーザー設定、`--settings`、組織管理の設定であり、**プロジェクト設定とlocal設定では無視される**。変更は次のメッセージから適用されるため、`.claude/settings.json` に書いてチーム全員へ配布しても、この設定は有効にならない。[1]

Claudeが直接読むのは `AGENTS.md` と `.claude/AGENTS.md` で、`AGENTS.override.md`、`AGENTS.local.md`、`.agents/` 配下の指示ファイルは対象外だ。フォールバック条件を満たす場合、Readツールでサブディレクトリのファイルを開くと、その場所のAGENTSを必要に応じて読む。Codexのoverrideとは別の仕組みである。読み込み順が決まっていても、矛盾した自然言語の指示が確実に解決されるわけではない。[1] [2]

## 共通ルールとインポートのテンプレート

次は `pnpm build` と `pnpm test` があるリポジトリ向けだ。採用前にコマンドと生成物のパスを実際のプロジェクトに合わせる。ルートの `AGENTS.md` に置く内容は次のとおり。

```markdown
## 作業上の約束
- Nodeの依存関係にはpnpm、Pythonにはuvを使う。
- 作業ツリー内の無関係な変更を保持する。
- ソースを編集し、生成されたdist/を直接編集しない。

## 検証
- コードを変更したらpnpm testとpnpm buildを実行する。
- 実行できない検査は、コマンドと阻害要因を報告する。
- 引き渡し時に動作の変更、実行した検査、残る制限を説明する。
```

同じディレクトリの `CLAUDE.md` には次を置く。

```markdown
@AGENTS.md

## Claude Code
- 課金処理を変更する前に、影響するケースとテストを提案する。
```

この記事ではコピーできるようコードブロックにしているが、**実際のファイル内**では `@AGENTS.md` をバッククォートやコードブロックで囲まない。「AGENTS.mdを読んで」という文章はモデルへの依頼であり、`@AGENTS.md` はClaude Codeのインポート処理で展開される。相対パスの基準はインポート元なので、`.claude/CLAUDE.md` なら `@../AGENTS.md` とする。現在の再帰上限は4段階。Windowsを使うメンバーがいるチームでは、シンボリックリンクよりインポートを選びやすい。[1]

## 実際に読み込まれた指示を確認する

1. ターミナルで `claude --version` と `codex --version` を実行し、開始ディレクトリと関連設定を記録する。
2. リポジトリでClaudeの新しいセッションを開始する。`/context` の **Memory files** と、`/memory` のAGENTSパスを確認する。v2.1.280より前では直接読み込んだAGENTSが両リストに表示されなかったため、更新かインポート経由の確認を選ぶ。
3. 検証用リポジトリに「検証ラベルを尋ねられたら `instruction-check-26` と答える」といった無害で識別しやすい指示を置く。質問側にはラベルを書かず、回答と読み込みパスの両方を確認する。
4. ネストしたルールは、そのディレクトリの普通のファイルをClaudeに読ませて、ターミナルの `Loaded` 表示を見る。起動時の一覧だけでは遅延読み込みの失敗を判断できない。
5. Codexの指示を編集したら新しい実行を開始し、指示の出所と検証コマンドを列挙させる。実ファイルと照合し、必要ならTUIログを確認する。

「ファイルを読めたか」と「指示を実行したか」は別々に調べる。曖昧な指示は読み込みに成功しても実行が安定しない。Claudeの `InstructionsLoaded` hookはCLAUDEのインポートとルールを追跡できるが、プラグインが直接読むAGENTSでは発火しない。イベントがないことだけで読み込み失敗とはいえない。[1] [2]

## Codexの探索とフォールバック

Codexは起動時に、自身のhomeと、プロジェクトルートから作業ディレクトリまでの指示を組み立てる。プロジェクト側の各階層で選ぶ非空ファイルは最大1個で、順番は `AGENTS.override.md`、`AGENTS.md`、設定したfallback名となる。深い場所の指示が後に入り、既定の合計上限は `project_doc_max_bytes` で指定する **32 KiB**。Claudeのフォールバックとは異なる。[2]

CLAUDE.mdしかない旧リポジトリを使うなら、`~/.codex/config.toml` に次を統合する。

```toml
project_doc_fallback_filenames = ["CLAUDE.md"]
```

Codexを再起動すると、CLAUDE.mdは**代替候補**になる。同じディレクトリのAGENTS.mdに追加して読む設定ではない。Claudeの `@` インポートがCodexでも展開されると考えないこと。共通ルールをAGENTS.mdに置く構成なら、この違いを追いやすい。存在するサブディレクトリで確認する例は次のとおり。

```bash
codex --cd services/payments "有効な指示の出所と検証コマンドを列挙してください。ファイルは編集しないでください。"
```

起動時に期待するのは、全体設定、リポジトリの指示、そのディレクトリまでの各候補である。兄弟パッケージがすべて読み込まれるわけではない。詳しく調べるときは `codex -c log_dir=./.codex-log` で起動し、`codex-tui.log` を見る。ログにはプロジェクトの非公開情報が含まれ得る。[2]

## なぜわざわざ書くのか

同じ指示でもファイル名を変えると結果が変わるのは、ファイル名、開始場所、クライアントのバージョン、設定が、モデルへ渡る内容を決めるからだ。文章の品質を論じる前に、まず読み込み経路を確かめる必要がある。

以下の12節では、コンテキストの設計、記憶、チーム運用、コード以外の用途も扱う。私が重視するのは、ソースだけでは分からない判断を残し、その結果を検証できるようにすることだ。指示を増やしても、確認する手段の欠如は埋まらない。

<span id="1-three-files-three-audiences-readmemd-vs-claudemd-vs-agentsmd"></span>

## 1. README.md、CLAUDE.md、AGENTS.mdの役割

README.mdは、人がプロジェクトの目的、実行方法、参加方法を理解する入口になる。エージェントも参考にできるが、利用者向けの紹介だけでは、変更後に何を確認するかまでは分からない。

CLAUDE.mdはClaude Codeへ継続的な指示を渡す。新しい会話のコンテキストが空でも、指示ファイルと自動メモリーを通じて知識を引き継げる。「毎回何も覚えていない」という説明では、現在の動作を正しく表せない。[1]

AGENTS.mdはLinux Foundation傘下のAgentic AI Foundationが管理する、必須項目のないMarkdown形式だ。共有できるのはまず文章であり、すべてのツールが同じ優先順位で読むことまで保証する規格ではない。[3]

READMEの紹介文をそのまま転記するより、テストの実行コマンド、生成物の扱い、変更できない境界、過去の決定の理由を書く。ファイルは書き終えたら固定するものではない。コマンドや運用が変わったとき、コードと一緒に見直す。

<span id="2-universal-best-practices-length-structure-voice"></span>

## 2. 長さ、構造、書き方

<span id="length"></span>

### 長さ

HumanLayerのKyleによる *Writing a good CLAUDE.md* は、ルートの指示を短くし、細部を別文書に移すことを勧める。大きな公開リポジトリの行数は、自分のプロジェクトの目標にはならない。必要な検査もディレクトリの構造も違う。

Anthropicの現在の推奨は1ファイル200行未満だ。これは普遍的なモデルの指示数上限ではない。`@` インポートは親と一緒に読み込むため、分割だけではコンテキストを節約しない。特定のコードだけに必要な指示は、対応するディレクトリやパス別ルールへ分けて動作を確認する。[1]

<span id="structure"></span>

### 構造

最初に禁止操作と作業範囲、次に必要なプロジェクト事情、ビルドとテスト、コード例、配置の約束、検証方法、既知の問題を書くと探しやすい。「テストする」ではなく、どのコマンドで何を確かめるかを書く。

失敗の記録には、起きた現象だけでなく再発を避ける条件を残す。たとえば動的ルートの `[id]` をシェルへ渡す場合の引用符、生成スキーマの変更後に必要なマイグレーションなど、次の作業で判断に使える情報が役立つ。

<span id="voice"></span>

### 書き方

`pnpm typecheck` のように実行対象を具体化し、禁止するなら対象のパスを示す。ALWAYSやNEVERを増やすだけでは曖昧な要求は明確にならない。

Markdownの指示に一律の遵守率を当てはめることはできない。絶対に止める必要がある操作には、権限、サンドボックス、阻止するhookを使う。「デプロイしない」という指示と、デプロイ権限がないことは別の保障である。[1]

<span id="3-eight-real-samples-worth-reading"></span>

## 3. 実例から何を読むか

公開リポジトリは、そのままコピーするテンプレートではなく、何をルール化したかを比較する材料になる。行数やスター数ではなく、指示が必要になった理由を見る。

1. `openai/codex` は、Rustのcrate、TUI、テストなど複数の担当範囲をどう整理するかという観点で読む。
2. `vercel/vercel` は、monorepoのコマンド、changeset、パッケージ間の約束、過去の問題の分類を参考にする。
3. `openai/openai-agents-python` は、検証やレビューの手順を明示的なskill呼び出しへ分ける設計の例になる。文書だけの変更と実行時の変更を区別する考え方が重要だ。
4. `vercel-labs/open-agents` は、作業で得た教訓をどこに蓄積するか、共有ルールを誰が更新するかという点を見る。
5. `vercel-labs/agent-skills` は、SKILL.mdに全詳細を詰め込まず、参照先へ分ける構造の例だ。
6. `anthropics/anthropic-cookbook` は、Pythonの実行環境やモデル指定など、例を再現するための前提をどう記すかを見る。モデル別名と固定版は、更新追従と再現性のどちらが必要かで選ぶ。
7. `karpathy/llm-council` は、一般的なコーディング作法よりも、コンポーネントの使い方や既定値といったプロジェクト固有の決定を残す例になる。
8. `affaan-m/everything-claude-code` のAgentShieldは、秘密情報や古い設定、曖昧な指示を検査する観点を提供する。

これらを読んだ後に自分のファイルへ加えるのは、そのプロジェクトにも当てはまる理由を説明できる指示だけにしたい。過去のスナップショットの数字を、現在も有効な制限として移植しない。

<span id="4-karpathys-three-paradigm-shifts"></span>

## 4. Karpathyの議論から考える指示の設計

<span id="shift-1-prompt-engineering--context-engineering"></span>

### プロンプトからコンテキストの構成へ

Karpathyのcontext engineeringの議論では、モデルへ渡す情報を組み立てることが問題になる。CLAUDE.mdだけを磨いても、作業対象、ツールの結果、過去の会話が異なれば、モデルが判断に使える材料は変わる。

たとえば制約を根ファイルに書き、具体例を別文書に置いた場合、具体例へたどり着く条件も設計の一部だ。ファイルが存在することと、必要な時点で内容が渡ることを分けて考える。

<span id="shift-2-markdown-as-source-code-programmd"></span>

### program.mdと実行対象の分離

`karpathy/autoresearch` の `program.md` は、人が実験の方向を記述し、エージェントが実装と実験を進める考え方を示す。ただし `program.md` はCLAUDEやCodexが自動探索する特別な名前ではない。ワークフロー側で読むように接続する必要がある。

自然言語の変更も結果へ影響する以上、Gitで差分を確認し、受け入れ条件で評価する価値がある。「自然言語がソース」という比喩から実際に使える教訓は、変更を検証対象として扱うことだ。

<span id="shift-3-goal-driven-execution-declarative--imperative"></span>

### 成功条件と手順を使い分ける

「Aを読んでBを書き換える」だけでは、何をもって完了かが分からない。`pnpm test` が通ることや、対象の失敗ケースが再現しなくなることを記すと、途中の方法を選びやすくなる。

一方、マイグレーションや公開作業の順序に意味があるなら、その手順も必要だ。宣言的な目標を使うことと、すべての段階的な手順を消すことは同じではない。

<span id="5-mental-models-from-the-other-heavyweights"></span>

## 5. 観測と検証を指示につなぐ

<span id="armin-ronacher-logs-as-apis-no-dead-ends"></span>

### Armin Ronacher：ログとツールの接続

Armin Ronacherのagentic codingに関する議論は、エージェントが必要な結果を自分で観測できる環境を重視する。開発環境で登録確認メールをログへ出せば、登録から確認リンクの取得までを検証しやすくなる。

画像生成の出力をコード実行ツールが読める場所へ置くことも同じ問題だ。指示ファイルには「確認する」とだけ書かず、観測先や必要な環境の条件を記す。タスク一覧の再提示も、長い会話で未完了の項目を追うための手段として考えられる。

<span id="geoffrey-huntley-stdlib-ralph-window-utilization"></span>

### Geoffrey Huntley：反復実行と共有ルール

HuntleyのstdlibやRalphに関する議論は、規約を再利用し、結果を見ながら繰り返す作業を考える材料になる。繰り返す処理には、終了条件、実行予算、失敗の記録、毎回の検証が必要だ。

他人のループや長いプロンプトをコピーしても、自分のテストや環境に合うとは限らない。コンテキストを一定の割合まで使えば必ず良い結果になるという普遍的な閾値も置かず、長い実行で何が落ちるかを観測したい。

<span id="simon-willison-agentsmd-for-runtime-anomalies"></span>

### Simon Willison：実行環境の例外

Simon Willisonの調査用リポジトリは、ネットワーク制約のような実行環境の事情を指示へ残す観点で読める。通常の手順が使えない理由は、ソースからは分からないことがある。

ブロックされたネットワークや使えないポートを具体的に記せば、同じ失敗の繰り返しを減らせる。ただし環境を移した後も古い制限を保持すると、今度は不要な回避が残る。

<span id="hamel-husain-eval-as-living-prd"></span>

### Hamel Husain：評価を要件として読む

評価で何を成功と判定するかは、その製品に何を求めるかの表現でもある。Hamel Husainの評価に関する議論を指示ファイルへ当てはめるなら、「型検査する」と書いた結果、本当に検査したかを確認できるようにする。

指示もGitで版管理し、変更前後で同じ作業を試す。文章が強くなったことと、実行が良くなったことを混同しない。

<span id="harrison-chase-model--harness--context"></span>

### Harrison Chase：モデル、実行基盤、コンテキスト

Chaseの議論では、モデル、ツールを動かす基盤、渡す情報を分けて考える。チームが蓄積できるのは、汎用モデルだけでは知らないプロジェクトの事情だ。

ただしCLAUDE.mdを長くすること自体が競争力になるわけではない。消えたAPIを参照するルールは作業を妨げる。価値は知識の量より、現在の作業に正しく接続されているかにある。

<span id="6-the-counterintuitive-patterns"></span>

## 6. 記憶と複数ファイルの運用

<span id="darwinian-memory-claude-evolve"></span>

### claude-evolveとルールの状態

`jack60810/claude-evolve` は、ルールを評価して維持、休止、削除へ分ける実験として参考になる。これはClaude Code標準の指示読み込みそのものではない。

採用するなら、active、dormant、deadの状態に相当する基準をチームで決める。繰り返し役に立つ手順をskillに移す場合も、どのタスクで呼ぶかと、更新の責任者まで決めておく。

<span id="readwrite-separation-claudemd--memorymd"></span>

### CLAUDE.mdとMEMORY.mdを分ける

Claude Codeのメモリー索引は通常 `~/.claude/projects/<project>/memory/MEMORY.md` にあり、開始時に読むのは先頭200行または25 KBの早い方まで。リポジトリのルートに同名ファイルを置くだけでは、この仕組みには参加しない。[1]

観察や個人の好みは自動メモリーに、チームが合意した指示は共有ファイルに置く。詳細をテーマ別ファイルへ分けると、必要なときに読める。本機のメモリーだけで全員へルールを配布しようとしない。[1]

覚えているコマンドも、実行前に現在のプロジェクトのスクリプトと照合する。メモリーを書いた時点で正しくても、移行後には古くなる。

<span id="auto-dream-memory-hygiene"></span>

### 自動整理を前提にしない

Auto Dreamのような名前の処理があると聞いても、自分の環境でメモリーを自動整理しているとは限らない。必要なら、相対日付を既知の絶対日付へ直し、解決済みの回避策を削除する作業として組み込む。

制約には理由となる決定を結び付ける。単なる作業ログが増え続ける状態より、次の判断に必要な情報を探せる状態を保つ方がよい。

<span id="the-two-strikes-rule"></span>

### 二度目を待つべき場合

Anthropicは、同じ間違いの再発をルール追加の理由の一つとして挙げている。コードレビューで見つかった問題や、新しい同僚に必要な情報も理由になる。重大な誤操作をもう一度起こすまで記録しない、という条件ではない。[1]

一度だけの失敗は一時的な通信障害や誤ったコマンドかもしれない。まず診断し、繰り返し使える教訓かを判断する。回数よりも、影響の大きさと根拠が重要だ。

<span id="subagents-are-context-control-not-role-play"></span>

### subagentで調査の範囲を分ける

subagentは担当を分けるだけでなく、大量の検索や読み取りを別のコンテキストへ移す手段にもなる。親には判断に必要な要約、根拠の場所、未解決点を返す。

役名を付けるだけでは作業は分離されない。変更可能なファイルを指定し、誰が統合するかを決めないと、複数のagentが同じファイルを書き換える問題が起きる。

<span id="oracle-mode"></span>

### 別モデルへ相談する

別モデルを相談用ツールとして呼ぶ構成は、設計の反例を探す用途に使える。AGENTS.mdに書くなら、呼び出す条件、利用できるツール、戻してほしい根拠を明記する。

ツールを設定せず「oracleに相談する」と書いても実行できない。回答が一致したことを、テストに代わる証明にも使わない。

<span id="anti-sycophancy-in-three-modes"></span>

### 反論と確認を使い分ける

提案の前提を疑う、質問を一つずつ行う、最も強い反対案を考える、といった依頼は目的が異なる。毎回反論する人格を設定するより、どの判断で反例を求めるかを書く方が作業に結び付きやすい。

たとえば不可逆なデータ移行では失敗条件の列挙を求め、既存の文言修正では不要な議論を増やさない。考え方を選ぶ基準を残す。

<span id="path-scoped-rules"></span>

### パスで対象を限定する

`.claude/rules/` のYAML `paths:` は対象ファイルを限定できる。普通のAGENTS.mdへ同名の見出しを書くだけでは機能しない。コンポーネントの規則を別ファイルへ置き、対象ファイルを読む操作で確かめる。[1]

この仕組みは無関係な指示の読み込みを減らす。大きなルートCLAUDE.mdやそのインポートの費用がなくなるわけではない。

<span id="versioned-changelog-at-the-top"></span>

### 変更理由を残す

冒頭の変更記録は、なぜ規則を変えたかを説明できる。しかし `## Changelog` という見出しは、前回のセッションとの自動比較を起動しない。

比較が必要ならGitの差分を調べるよう明示する。現在の指示は、全履歴を読み直さなくても実行できる文章にする。

<span id="7-the-team-engineering-layer"></span>

## 7. チームで保守する

人数が増えると、個人の書き方よりも、共有内容の重複、バージョン差、変更の責任が問題になる。読み込みに成功した人と失敗した人を、指示への従順さの違いとして評価してはいけない。

<span id="agentsmd-as-a-cross-tool-contract"></span>

### 共有内容と読み込み経路

AGENTS.mdは内容の重複を減らせるが、ClaudeのインポートはCodexを設定せず、Codexのoverride名はClaudeへ適用されない。ウェブに公開したファイルも、ローカルの会話へ自動では入らない。[1] [2] [3]

共通のコマンドと制約はAGENTS.mdへ置き、CLAUDE.mdのインポートの下にClaude専用の指示を書く。直接両方を読む設定でも、矛盾する規則は解消しておく。[1]

<span id="claudelocalmd-is-deprecated-use-imports"></span>

### CLAUDE.local.mdは使用できるがフォールバックに影響する

現在の公式文書は、個人のプロジェクト指示として `CLAUDE.local.md` をサポートしている。`.gitignore` に追加し、共有しない。ただし存在すると既定のAGENTSフォールバックを止めるので、明示的なインポートか両方を読む設定を使う。[1]

複数のworktreeで個人指示を共有するなら外部 `@path` インポートも選べるが、承認やセッションの条件を確認する。現在の再帰上限は4段階だ。[1]

<span id="spec-driven-team-level-agent-os"></span>

### 仕様を使う開発手順

Spec Kit、BMAD、Kiroは、仕様や計画をコード変更につなぐ別々の設計例である。Spec Kitは仕様と計画の成果物、BMADは役割を持つ作業手順、KiroはIDE内の仕様と設計を比較する観点になる。

Martin Fowlerのサイトにある比較記事は、こうした方法を検討する出発点になる。小さな修正にも一律に長い工程を要求するより、関係者間の合意が必要な変更に手順を使いたい。指示ファイルには、どの規模や影響でその工程を開始するかを残す。

<span id="eval-driven-claudemd"></span>

### 指示自体を検証する

指示を変えた前後で同じ小さなタスクを実行し、成果物や実行コマンドを比較する。ファイルが生成されたかは機械的に確認できるが、説明が妥当かは別の判断が必要になる。

エージェント自身に指示を書き直させる場合も、成功の基準を勝手に緩めさせない。共通のテスト、比較可能な環境、元の指示をGitに残すことで、何が改善したかを確認できる。

<span id="observability-rule-roi"></span>

### 実行の観測

トレース、hook、コマンドログは、いつ何が実行されたかを調べる材料だ。ただしモデルが「ルールを守った」と述べることと、実行記録があることは違う。

読み込みの観測にも例外がある。前述のとおり、直接読むAGENTSとCLAUDE経由のインポートでは `InstructionsLoaded` の扱いが異なる。観測していない経路を失敗と誤判定しない。[1]

<span id="meta-claudemd"></span>

### 指示を編集するためのルール

指示ファイルの編集が頻繁なら、検証方法、リンク確認、変更理由の残し方をskillへまとめる意味がある。そのskillを誰がどの場面で読むかも決める。

`.claude/skills/meta/` という名前を作るだけでは、編集時の呼び出しは保証されない。自動化したい検査はスクリプトやCIへ移し、文章の規則を増やす前に、機械で防げる間違いを減らす。

<span id="github-squads-decisionsmd"></span>

### decisions.mdで判断を共有する

GitHubのSquadに関する記事は、複数のagentが決定を共有する方法の参考になる。`decisions.md` に判断を残すなら、背景、採用した案、見送った案、見直す条件を記す。

これはADRと共通する考え方である。ファイル名そのものに自動読み込みの効果はないので、新しい判断の前に読む経路を手順へ組み込む。

<span id="8-non-code-repositories-para-obsidian-academic-writing"></span>

## 8. コード以外のリポジトリ

指示ファイルは、文章、研究、講義資料、ブログにも使える。ただしコード用のテストコマンドをそのまま流用せず、その成果物に合う確認を定義する。

<span id="para--obsidian-vaults"></span>

### PARAとObsidian

PARAではProjects、Areas、Resources、Archiveの区別と、Inboxをどこへ移すかの基準が重要になる。指示には、期限のある活動と継続的な責任をどう区別するか、frontmatterの必須項目、週次レビューの対象を記す。

日記、調査メモ、公開文書で文体が違うなら、その違いも残す。`ballred/obsidian-claude-pkm`、`AgriciDaniel/claude-obsidian`、`danielrosehill/Claude-Code-Projects-Index` は用途を比較する材料になる。フォルダー構成が変わったら、分類ルールも更新する。

<span id="academic-writing"></span>

### 学術文書

既存の論文を文体の参考にすることと、内容の出典として使うことを分ける。分野の慣習、投稿先の規定、個人の好みが食い違う場合の扱いも明確にする。

引用は主張を裏付ける箇所まで確認し、未確認のBibTeXを作らない。AIの利用を明示する必要がある場合は投稿規定に従う。`K-Dense-AI/claude-scientific-writer`、`Galaxy-Dawn/claude-scholar`、`Imbad0202/academic-research-skills` などの例も、こうした検証を自分の手順へどう接続するかという観点で読む。

<span id="blog-and-content-repos"></span>

### ブログとコンテンツ

文章の指示には、想定読者、用語、見出しの構造、引用の扱いを具体化する。禁止語の一覧だけでは、何を伝える記事かは決まらない。

たとえばタイトルをテンプレートがH1として出力するサイトでは、Markdown本文に重複するH1を書かない。公開時のリンク確認も検証項目に含める。固定の行数より、編集者が同じ判断を再現できる内容かを重視する。

<span id="9-the-chinese-community-lens"></span>

## 9. 中国語の作業環境から見える課題

中国語の指示では、返答言語とツールチェーンの好みが同じファイルに置かれることが多い。たとえば「中国語で返答する」「Pythonはuv、Nodeはpnpm」という設定は、複数プロジェクトへ適用するか、個別例外を認めるかまで書くと使いやすい。

文字数の目安を英語の行数へ換算しても、指示の密度や内容は比較できない。短縮の判断は、その指示を削ったときに何が失敗するかで行う。

Cursor、Claude Code、Trae、通義霊碼などを併用すると、共有したい文章と各ツールの設定形式が分かれる。同期ツールを導入しても、同じ文章が本当に読み込まれるかの確認は必要だ。

`hong111109/humanizer` のように言語別の構成を分ける例も、同じ判断を各言語へどう移すかを考える材料になる。宝玉が紹介する `shareAI-lab/learn-claude-code` のような実装例は、ツール呼び出しと反復の仕組みを理解する助けになる。

`oaker-io/wewrite` や `geekjourneyx/md2wechat-skill` のようなWeChat向け制作手順では、下書き、整形、公開を区別したい。指示ファイルがあることは、送信や公開への許可を意味しない。作業範囲を明記するという原則は、コードでも文章でも共通する。

<span id="10-the-practical-checklist"></span>

## 10. 全体設定からプロジェクトへ

<span id="global-claudeclaudemd"></span>

### ユーザー全体の指示

`~/.claude/CLAUDE.md` には、返答言語、パッケージ管理の既定、公開範囲、検証の基本方針など、プロジェクトをまたぐ内容だけを置く。全体設定が個別の要件と矛盾しないよう、どちらを優先するかを明確にする。

一度のコマンド失敗を必ず永久ルールにするのではなく、繰り返す問題と不要になった回避策を見直す方針を記す。

<span id="vault-root-claudemd"></span>

### ナレッジ管理のルート

PARA型の保管庫では、各フォルダーの意味、分類基準、frontmatter、引用の言語、Inboxの整理手順を記す。名称を変更したときは、移動ルールとリンク検査も更新する。

<span id="code-project-agentsmd--claudemd"></span>

### コードプロジェクト

AGENTS.mdに共通の構築、テスト、制約、既知の問題を置く。CLAUDE.mdはコードブロック外の `@AGENTS.md` と必要な専用指示だけにする。設計判断はdecisions.mdなどへまとめ、読む手順を明示する。

深いディレクトリの例外を追加したら、その場所からCodexを起動する場合と、Claudeがそこを読む場合の両方を検証する。片方の結果をもう片方へ一般化しない。[1] [2]

<span id="adopt-the-two-strikes-rule"></span>

### 偶発的な失敗と重要な制約

偶発的な失敗は観察として記録してから再発を調べる。破壊的な操作やレビューで明らかになった制約は、その時点で共有する。チームの方針を一人の自動メモリーにだけ保存しない。

<span id="oracle-mode-optional"></span>

### 相談を組み込む場合

複数モジュールへ影響する設計で別モデルを使うなら、利用可能なツール、相談する論点、決定記録を定める。相談先の回答も、実装や検査と突き合わせる。

<span id="anti-pattern-checklist"></span>

### 見直す項目

秘密情報を含めない。READMEの紹介文を繰り返さない。存在しないコマンドやモデル指定を残さない。狭い場面だけの指示を毎回ロードする根ファイルへ積み上げない。

定期的に、実行できるコマンドか、リンク先があるか、二つのファイルで同じ判断を矛盾して書いていないかを確認する。自動検査に移せる条件は、文章だけに頼らない。

<span id="11-predictions-for-2026"></span>

## 11. これから検証したい設計

当初の記事で挙げた方向は、指示の階層化、版管理、再利用可能な規則の配布だった。これらは実現が保証された予測ではなく、今の構成を評価する問いとして使える。

階層化では、読み込み条件と担当者が明確になったかを確認する。版管理では、どの指示の下で作業したかを追えるかを見る。再利用では、他人の規則を持ち込む前に、依存するコマンドとプロジェクト固有の前提を点検する。

署名やバージョン番号を加えても、古い指示が正しくなるわけではない。現在の作業に適用できるかを検査する方が先だ。

<span id="12-closing-from-prompt-to-context-from-file-to-system"></span>

## 12. ファイルと検証を一緒に保守する

必要なのは、モデルが推測しにくい決定を短く残し、使われる経路と結果を確かめることだ。構成を複雑にする前に、起動場所を変えても必要なルールが読めるか、同じ作業で期待する検証が実行されるかを試す。

共通内容はAGENTS.mdへ、Claude専用の内容はCLAUDE.mdへ分ける。その上で、クライアントの更新、個人設定の追加、worktreeの移動をしたら、もう一度読み込みを確認する。指示の文章だけでなく、実行する環境まで含めて保守したい。

<span id="references"></span>

## 参考資料

[1]: https://code.claude.com/docs/en/memory "Claude Codeのメモリーと読み込み規則"
[2]: https://developers.openai.com/codex/guides/agents-md/ "Codexの指示探索"
[3]: https://agents.md/ "AGENTS.md形式"

- [1. Claude Codeのメモリー、バージョン、インポート](https://code.claude.com/docs/en/memory)
- [2. Codexのカスタム指示とfallback](https://developers.openai.com/codex/guides/agents-md/)
- [3. AGENTS.md公式仕様とFAQ](https://agents.md/)
- [Anthropicのベストプラクティス](https://code.claude.com/docs/en/best-practices)
- [HumanLayer: Writing a good CLAUDE.md](https://www.humanlayer.dev/blog/writing-a-good-claude-md)
- [Karpathyのcontext engineeringに関する投稿](https://x.com/karpathy/status/1937902205765607626)
- [karpathy/autoresearch](https://github.com/karpathy/autoresearch)
- [karpathy/llm-council](https://github.com/karpathy/llm-council/blob/master/CLAUDE.md)
- [forrestchang/andrej-karpathy-skills](https://github.com/forrestchang/andrej-karpathy-skills)
- [Armin Ronacherのagentic codingに関する記事](https://lucumr.pocoo.org/2025/6/12/agentic-coding/)
- [Geoffrey Huntleyのstdlib](https://ghuntley.com/stdlib/) と [Ralph](https://ghuntley.com/ralph/)
- [Simon Willisonの調査リポジトリに関する記事](https://simonwillison.net/2025/Nov/6/async-code-research/)
- [Hamel Husainの評価に関する記事](https://hamel.dev/blog/posts/evals-skills/)
- [Harrison Chaseのインタビュー](https://sequoiacap.com/podcast/context-engineering-our-way-to-long-horizon-agents-langchains-harrison-chase/)
- [jack60810/claude-evolve](https://github.com/jack60810/claude-evolve)
- [仕様駆動開発ツールの比較](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html)
- [GitHub Spec Kit](https://github.com/github/spec-kit)
- [BMAD-METHOD](https://github.com/bmadcode/BMAD-METHOD)
- [GitHub Squadの協調作業](https://github.blog/ai-and-ml/github-copilot/how-squad-runs-coordinated-ai-agents-inside-your-repository/)
- [ballred/obsidian-claude-pkm](https://github.com/ballred/obsidian-claude-pkm)
- [Mr-chen-05/rules-2.1-optimized](https://github.com/Mr-chen-05/rules-2.1-optimized)
- [shareAI-lab/learn-claude-code](https://github.com/shareAI-lab/learn-claude-code)
