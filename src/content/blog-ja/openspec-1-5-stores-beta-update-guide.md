---
title: 'OpenSpec 1.5 詳解：Stores Beta、Explore-first ワークフロー、チーム規模の仕様協働'
pubDate: 2026-07-02T01:30:00.000Z
description: 'OpenSpec 1.5.0 のソースコードと公式ドキュメントをもとに、Stores Beta、/opsx:explore、brownfield 導入、command frontmatter 修正、repo-local specs から共有 planning context への進化を解説します。'
author: 'Remy'
tags: ['openspec', 'spec-driven development', 'sdd', 'ai coding', 'stores', 'ai agents', 'cli']
lang: 'ja'
translatedFrom: 'openspec-1-5-stores-beta-update-guide'
---

OpenSpec の最近の更新は、単なる CLI 機能追加ではありません。より大きな変化は、OpenSpec が「単一リポジトリ内の軽量な spec workflow」から、「複数リポジトリ、複数チーム、複数 AI coding agent で共有できる仕様協働レイヤー」へ進み始めていることです。

一つだけキーワードを挙げるなら **Stores**。一つだけワークフローを覚えるなら、次の流れです。

```text
explore → propose → apply → archive
```

この記事では、`Fission-AI/OpenSpec` の `v1.5.0` ソースコード、`CHANGELOG`、`docs/cli.md`、`docs/commands.md`、`docs/explore.md`、`docs/existing-projects.md`、関連コマンド実装をもとに、何が変わったのか、どう使うのか、実プロジェクトでは何に注意すべきかを整理します。

OpenSpec の基本的な使い方をまだ知らない場合は、先にこちらを読むと理解しやすいです：[OpenSpecチュートリアル：CLIの導入、コマンド、AGENTS.md、実践例](/blog/openspec-tutorial-cli-commands-agents-md-examples/)。この記事では、1.5 周辺の更新とその意味に絞って解説します。

## 一言でまとめると

OpenSpec 1.5 の中心は、**Stores Beta によって specs、changes、planning context を単一 repo から切り離せるようにすること**です。同時に、explore-first の習慣をより明確にし、brownfield 導入、AI command frontmatter、JSON 出力、複数 AI ツール連携の安定性も強化しています。

つまり OpenSpec は、「proposal をどう生成するか」よりも難しい問題に向かっています。

- チーム共通の要件は、単一コード repo の外に置けるのか？
- あるプロジェクトが、別チームの仕様コンテキストを参照できるのか？
- AI agent は、自分がどの OpenSpec root に対して動いているかを確実に知れるのか？
- あいまいな要求を、正式な change にする前に探索できるのか？

## OpenSpec 1.5.0：中心は Stores Beta

現在の npm パッケージは `@fission-ai/openspec@1.5.0` で、説明は次のとおりです。

> AI-native system for spec-driven development

CLI エントリポイントは引き続き次です。

```bash
openspec
```

ただし 1.5.0 では **Stores very early beta** が追加されました。公式ドキュメントでは Store を次のように定義しています。

> A store is a standalone OpenSpec repo you've registered on this machine.

つまり Store は、このマシンに登録された独立した OpenSpec repo です。たとえば次のようなものになり得ます。

- チーム共通の planning repo；
- プロダクト、契約、アーキテクチャ、プラットフォーム仕様の repo；
- 複数プロジェクトで再利用するコンテキスト；
- 現在のコード repo に入れたくない外部 OpenSpec root。

登録後は、多くの通常コマンドを `--store <id>` でその Store に向けられます。

```bash
openspec list --store team-context
openspec show auth --type spec --store team-context
openspec new change add-billing-api --store team-context
openspec status --change add-billing-api --store team-context
openspec archive add-billing-api --store team-context
```

これが旧モデルとの大きな違いです。以前の OpenSpec は、現在の repo 配下の `openspec/` ディレクトリを前提にすることが多かった。今は、複数の OpenSpec root を明示的に扱う方向へ進んでいます。

## Stores は何を解決するのか？

小さな単一 repo なら、`openspec/specs` と `openspec/changes` を同じ repo に置けば十分です。しかし実際のチームでは、すぐに次のような問題が出ます。

- 一つのプロダクト機能が複数 repo にまたがる；
- プラットフォームチームの要件を複数プロダクトチームが参照したい；
- コード repo は大きいが、planning は独立して進化させたい；
- 複数の AI agent が別 repo で作業しつつ、同じビジネス制約を参照したい；
- 既存プロジェクトに、最初から完全な `openspec/` ツリーを入れたくない。

Stores は、仕様を「コードベース内のフォルダ」から「登録でき、診断でき、参照でき、選択できるエンジニアリング資産」へ引き上げます。

そのため Stores は単なる新コマンド群ではなく、OpenSpec の組織モデル変更として理解すべきです。

## Store コマンド早見表

公式ドキュメントでは Stores はまだ Beta とされています。コマンド名、flag、ファイル形式、JSON 出力は変わる可能性があります。ただ、現在の基本操作は十分に明確です。

### Store を作成して登録する

```bash
openspec store setup team-context --path ~/openspec/team-context
```

Git 初期化を省略する場合：

```bash
openspec store setup team-context --path ~/openspec/team-context --no-init-git
```

agent やスクリプトでは、明示的な入力と `--json` を使うのが推奨です。

```bash
openspec store setup team-context \
  --path ~/openspec/team-context \
  --no-init-git \
  --json
```

### 既存 Store を登録する

```bash
openspec store register ~/openspec/team-context --id team-context
```

### ローカル登録だけ忘れる

```bash
openspec store unregister team-context
```

Store を移動した、別の場所に clone し直した、あるいはこのマシン上で表示したくない場合に使います。ファイルは削除されません。

### ローカル Store フォルダを削除する

```bash
openspec store remove team-context --yes
```

`remove` はローカルフォルダを削除します。インタラクティブモードでは削除対象のパスを表示し、スクリプトや JSON 呼び出しでは `--yes` が必要です。実装上も metadata を確認し、関係ないフォルダを誤って削除しないようにしています。

### 登録済み Store を一覧表示する

```bash
openspec store list
openspec store ls --json
```

### Store の健康状態を診断する

```bash
openspec store doctor
openspec store doctor team-context --json
```

`doctor` は診断専用です。clone、pull、push、修復は行いません。AI agent にとっては、JSON 出力の `status` 配列が機械可読な判断材料になります。

## ソースコード視点：Store Registry の仕組み

Store 実装の中心は次のファイルです。

```text
src/core/store/foundation.ts
src/core/store/registry.ts
src/core/store/operations.ts
src/core/root-selection.ts
src/commands/store.ts
```

`foundation.ts` では、マシンローカルな registry ファイル名が定義されています。

```ts
export const STORE_REGISTRY_FILE_NAME = 'registry.yaml';
```

概念的には registry は次のような構造です。

```yaml
version: 1
stores:
  team-context:
    id: team-context
    root: /Users/you/openspec/team-context
    # backend / metadata / remote など
```

重要な操作は次のとおりです。

- `readStoreRegistryState()`：registry を読む；
- `writeStoreRegistryState()`：registry を書く；
- `updateStoreRegistryState()`：lock 付きで registry を更新する；
- `listStoreRegistryEntries()`：登録済み Store を列挙する；
- `registerStore()`：Store を登録する；
- `unregisterStoreRegistration()`：ローカル登録を削除する；
- conflict check：同じ id が異なる root/backend を指すのを防ぐ；
- metadata validation：registry id と Store metadata id の不一致を検出する。

OpenSpec は単にパスを保存しているのではありません。Store を、identity、health、metadata、Git/remote 情報、本機 registry を持つコンテキスト単位として扱い始めています。

## Root selection：なぜ `--store` が重要なのか

Stores が入ると、多くのコマンドは最初に次を決める必要があります。

**このコマンドは、どの OpenSpec root に対して作用するのか？**

`list`、`show`、`validate`、`status`、`instructions`、`new change`、`archive`、`doctor`、`context` などは、実行前に一つの root を解決します。

実用上の理解は次の通りです。

1. 明示的な `--store <id>` が最優先；
2. そうでなければ現在 repo のローカル OpenSpec root；
3. そうでなければ `openspec/config.yaml` の `store:` 宣言；
4. 解決できなければ diagnostics を返して失敗。

これは AI agent にとって非常に重要です。root が曖昧だと、agent は間違ったディレクトリでコマンドを実行したり、repo-local root と外部 planning context を混同したりします。新しい JSON 出力や診断は root/store 情報を持つため、agent が「自分はどこに作用しているのか」を確認しやすくなっています。

## References：読み取り専用コンテキストであり、書き込み先ではない

プロジェクトは `openspec/config.yaml` で Store references を宣言できます。

```yaml
schema: spec-driven
references:
  - team-context
```

remote を含めることもできます。

```yaml
references:
  - { id: team-context, remote: "git@github.com:acme/team-context.git" }
```

その後 `openspec instructions` は、参照先 Store の spec index を出力に含めます。

- spec id；
- Purpose セクションから抽出した一行 summary；
- 完全な内容を取得するための command：

```bash
openspec show <spec-id> --type spec --store team-context
```

重要なのは、**references は読み取り専用コンテキスト**だということです。コマンドの書き込み先は変わりません。現在 repo の作業は現在 root に残り、Store に書き込むには明示的に `--store <id>` が必要です。

これにより、「背景として参照すること」と「ライフサイクル上の所属」が混ざらなくなります。一つの change は一つの root に所属し、reference は agent の理解を助けるだけです。

## デフォルト外部 Store を宣言する

planning を完全に外部化したい repo では、次のようにデフォルト Store を宣言できます。

```yaml
store: team-context
```

すると通常コマンドは自動的にその Store に解決されます。

```bash
openspec list
openspec new change add-login
openspec status --change add-login
```

ただし明示的な `--store` が優先されます。また、現在ディレクトリに実際の planning folders がある場合、それを pointer が黙って上書きすることはありません。

## Context と Worksets：agent の作業集合を組み立てる

関連する二つのコマンドは、似ているようで違う質問に答えます。

```bash
openspec doctor [--store <id>] [--json]
openspec context [--store <id>] [--json]
```

次のように理解するとよいです。

- `doctor`：この root と参照 Store は健康か？
- `context`：この作業集合はどの root/store で構成されるのか？

`context` は `--code-workspace` で VS Code workspace も生成できます。root と利用可能な referenced Stores を一つの workspace として開けます。Worksets はより個人的・ローカルなビューで、一緒に扱うフォルダ群に名前を付けて再オープンするためのものです。commit されず、共有されず、declarations から自動生成されるものでもありません。

## Explore-first：ワークフローの開始点が前に移動した

Stores 以外で大きなシグナルは、`/opsx:explore` の位置づけが強くなったことです。

公式コマンド文書には、はっきりこう書かれています。

> Start here when you're unsure.

`/opsx:explore` は change を作るコマンドではありません。コードベースを読み、選択肢を比較し、あいまいなアイデアを整理する「リスクのない思考パートナー」です。artifact や code が生まれる前に、問題を計画へ収束させます。

推奨される習慣は次の流れです。

```text
/opsx:explore   # 問題がまだ曖昧なときに探索する
/opsx:propose   # 正式な change と planning artifacts を作る
/opsx:apply     # tasks を実装する
/opsx:archive   # 完了した変更を specs に戻す
```

多くの AI coding tool は「とりあえず実装して」と言いやすい体験になっています。OpenSpec は逆に、要求が曖昧なら proposal に急がず、もちろん code にも急がない、という姿勢をより明確にしています。

## Terminal CLI と AI slash commands の分担

ドキュメントでは、混同しやすい点を何度も説明しています。

- `openspec init/update/list/validate/status/...` は terminal CLI；
- `/opsx:explore`、`/opsx:propose`、`/opsx:apply`、`/opsx:archive` は AI assistant の chat に入力するコマンド。

典型的な流れは次のようになります。

```bash
# terminal
npx -y @fission-ai/openspec@latest init .
npx -y @fission-ai/openspec@latest update
```

その後、AI ツール内で：

```text
/opsx:explore redesign billing flow
/opsx:propose add-usage-based-billing
/opsx:apply
/opsx:archive
```

CLI はファイル、schema、root、status、validation を管理します。AI slash commands は agent に同じ artifact contract に沿って動かせるための入り口です。

## Brownfield プロジェクト：最初から全システムを文書化しない

強化された existing-projects ガイドを見ると、OpenSpec は greenfield template だけを対象にしていないことが分かります。既存プロジェクトでは delta-first が推奨されます。

- 最初から全システムを文書化しようとしない；
- 一つの現実の change から始める；
- 影響範囲に必要な specs だけ補う；
- proposal、design、tasks、spec delta で今回の変更を制約する；
- 完了後に archive し、main specs を少しずつ育てる。

これは重要です。多くの spec-driven tool は、価値が出る前に大量のドキュメント作成を求めることで失敗します。OpenSpec の brownfield path はより軽量です。まず目の前の変更を解決し、その結果として知識を蓄積します。

## YAML frontmatter 修正：小さく見えるが影響範囲は大きい

OpenSpec 1.5 では、生成 command description の YAML frontmatter escape も修正されています。

共有 helper は次のファイルにあります。

```text
src/core/command-generation/yaml.ts
```

中心関数は次の通りです。

```ts
export function escapeYamlValue(value: string): string {
  const needsQuoting = /[:\n\r#{}[\],&*!|>'"%@`]|^\s|\s$/.test(value);
  if (needsQuoting) {
    const escaped = value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r');
    return `"${escaped}"`;
  }
  return value;
}
```

この helper は Claude、Cursor、Windsurf、Pi、Bob などの adapters で共有されています。

小さな修正に見えますが、command files は AI tool integration の境界面です。CRLF や YAML line folding によって frontmatter の値が静かに壊れると、人間には正しく見えても tool 側の解釈が変わります。共有 helper に集約したことで、adapter 間の挙動を揃えられます。

## Config JSON container parsing 修正

1.5 では、config value が JSON container に包まれている場合の parsing も修正されました。これは editor、AI tool、automation script が設定を生成する場面で効いてきます。

YAML 修正と合わせて見ると、OpenSpec が複数ツール間の protocol layer として安定性を高めていることが分かります。対応 AI tool が増えるほど、「人間が見て問題なさそう」では足りなくなります。

## v1.4：ツール連携と互換性修正

1.4 系列も 1.5 と一緒に見ると流れが分かります。

`v1.4.0` では次が追加・改善されました。

- Kimi CLI support；
- Mistral Vibe support；
- core profile で `/opsx:sync` をデフォルト生成；
- requirement headers の大文字小文字を区別しない；
- zsh / oh-my-zsh completion 修正；
- `SHALL` / `MUST` を誤った場所に置いたときの validate hint 改善。

`v1.4.1` では次が修正されました。

- プロジェクト自身の `workspace.yaml` によって `openspec update` が誤誘導される問題；
- beta workspace view state を `.openspec-workspace/view.yaml` に移動；
- top-level `openspec update` が workspace update に誤って route される問題。

これらは、エコシステム拡張と workspace-era の境界問題の整理が同時に進んでいることを示しています。Stores は、その境界問題に対するより体系的な答えです。

## いつ Store を使うべきか？

repo-local `openspec/` のままでよいケース：

- コード repo が一つだけ；
- specs と code のライフサイクルが同じ；
- cross-repo planning context が不要；
- AI 支援の変更を安全にしたいのが主目的。

Store を検討すべきケース：

- 一つのプロダクト能力が複数 repo にまたがる；
- チーム共通仕様がある；
- platform、API contract、design system specs を独立させたい；
- code repo を軽く保ちつつ外部 planning context を参照したい；
- 複数 AI agent が同じ planning truth を必要とする。

慎重にした方がよいケース：

- beta の command/format 変更を許容できない；
- チームに spec maintenance の習慣がまだない；
- 使い捨て prototype を作っている；
- 問題が multi-root を必要とするほど複雑ではない。

## チーム向けの推奨ワークフロー

チームレベルの Store を作ります。

```bash
openspec store setup team-context \
  --path ~/openspec/team-context \
  --remote git@github.com:acme/team-context.git
```

プロダクト repo から参照します。

```yaml
# openspec/config.yaml
schema: spec-driven
references:
  - { id: team-context, remote: "git@github.com:acme/team-context.git" }
```

日常作業では：

```bash
openspec doctor --json
openspec context --json
openspec instructions --change add-billing-api --json
```

AI chat では：

```text
/opsx:explore usage-based billing edge cases
/opsx:propose add-usage-based-billing
/opsx:apply
/opsx:archive
```

もし change 自体がローカル repo ではなくチーム Store に所属すべきなら：

```bash
openspec new change update-billing-contract --store team-context
```

その後、AI agent にその change に対して artifacts を生成させます。

## OpenSpec はどこへ向かっているのか

今回の更新から、三つの方向が見えます。

第一に、OpenSpec は command generator から workflow runtime へ進んでいます。初期の価値は、AI coding tools 向けに commands/skills を生成することでした。今は root selection、artifact state、validation、archive、JSON contract に投資しています。

第二に、単一プロジェクト用 tool から multi-project collaboration layer へ進んでいます。Stores、references、context、worksets は、仕様を単一 repo の外に置き、agent の working context に組み込むための機能です。

第三に、単なる文書作成ではなく、AI 実装を制約する方向を強めています。`explore → propose → apply → archive` の価値は Markdown を増やすことではありません。意図、受け入れ条件、tasks、実装、最終 spec delta を閉じたループにすることです。

## 結論

OpenSpec 1.5 で最も重要なのは、特定の一つのコマンドではありません。仕様がどこにあり、誰が所有し、どう参照され、どの AI agent がどの root に作用するのかを再設計している点です。

個人開発者にとって最も良い習慣は、**迷ったらすぐコードを書かせず、まず `/opsx:explore` から始めること**です。

チームや multi-repo システムにとって最も試す価値があるのは、**共有仕様を Store に切り出し、references で読み取り専用コンテキストを渡し、`--store` で書き込み先を明示すること**です。

Stores はまだ early beta ですが、方向は明確です。OpenSpec は、AI coding の spec ファイルテンプレートから、AI-native software development の仕様協働レイヤーへ進化しています。
