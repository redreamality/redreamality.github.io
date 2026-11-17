---
title: "pstack 0.15.43 実地検証：ルーティングは xhigh が上限、unlimited は large に、Orchestrate の行き先"
description: "pstack 0.15.43 は skill の本文を約 2 割削り、既定のルーティングを Opus 5.5 中心にしてどの役割も xhigh を超えないようにし、Orchestrate playbook を削除して worker.md を追加した。Claude Code に実際に入れ、0.15.32 からの語数の変化を数え、/setup-pstack による旧ルールの移行をたどり、リポジトリ付属のチェックとテストを走らせた。"
author: Remy
pubDate: 2026-11-17T09:30:00+08:00
lang: ja
translatedFrom: pstack-0-15-43-hands-on
tags:
  - ai-agents
  - agent-harness
  - ai-coding
  - claude-code
  - software-engineering
---

**結論：** pstack 0.15.43（上海時間 2026-11-17 にマージ）は skill の本文を約 2 割削った。既定のモデルルーティングは「Opus 5.5 が基本で、どの役割も xhigh を超えない」に変わり、Orchestrate playbook は削除され、`/poteto-mode` が起動するすべての agent が最初に読む `worker.md` が加わった。[1] 既存ユーザーがやるべきことは、ほぼ一つだけだ。プラグインを更新して `/setup-pstack` をもう一度実行する。

| いまの状況 | やること |
| --- | --- |
| ルールファイルが `# budget: unlimited` | `/setup-pstack` を再実行する。`large`（xhigh）に変わる。`max` の段はもうない。 |
| `hardest tasks`、`architect runners`、`reflect ...`、`how ...`、`why ...` の行が残っている | 再実行すると自動で消える。手で直す必要はない。 |
| `# defaults: 3` の行がない | 再実行しなくても動く。`/poteto-mode` は古い行に従い続け、セッションごとに一度だけ再実行を促す。 |
| Orchestrate playbook で大きなプログラムを回していた | `/poteto-mode` にタスクを書けばよい。大規模、横断的、無人の作業は `figure-it-out` に回る。 |
| Fable 5.2 にコードを書かせたい | タスクの中で名指しする。名指ししなければ、同じ brief で Opus 5.5 xhigh が 2 回チェックに落ちたときだけ使われる。 |
| Claude Code を使っている | サードパーティの marketplace は自動更新されない。`claude plugin update pstack@cursor-plugins` を実行してから `/pstack:setup-pstack` を実行する。 |

以下は実際にインストールして動かした記録だ。サイト内の [pstack skills ガイド](/ja/garden/notes/pstack-skills-guide/) は 0.15.32 で確認したもので、この記事は 0.15.32 以降の変化だけを扱う。pstack の背景にある考え方は [信頼が先、並列はその後](/ja/blog/lauren-tan-poteto-trust-before-parallel/) を参照してほしい。

## 0.15.32 以降の 3 つの変更

0.15.32 から 0.15.43 までの間に、取り上げておくべき変更が 3 回あった。

1 回目は 0.15.36（10 月 28 日）だ。Orchestrate playbook が完全に agent 主導になった。コーディネーターは `Task` で worker を起動し、状態はプロジェクトのノートに記録し、`orch` スクリプトは呼ばなくなった。`orch.ts`、`store.ts` とそのテストは削除され、この PR だけで 6,348 行が消えた。[2]

2 回目は 0.15.37 から 0.15.42（11 月 15 日）だ。既定モデルが Fable 5.2、Opus 5.5、Gemini 4 Carbon に替わり、Grok 4.7 はどの役割の既定でもなくなった。`/why` は本文 48 語の単一ファイルになり、12 個の reference ファイルはすべて削除された。`/how` も単一ファイルになり、`/poteto-mode` からは呼ばれなくなった。[3] この版では `hardest tasks` の既定が `claude-fable-5-2-max` だった。

3 回目が 0.15.43 だ。0.15.42 のモデル構成はそのままに、「いちばん難しい仕事は Fable の max に回す」という経路をまるごと外した。次の節の語数と、その後のルーティング図はこの版の話だ。

## Claude Code に 0.15.43 を入れる

検証用マシンには Claude Code 2.1.278 があり、Cursor はない。既存の設定に触れないよう、空の設定ディレクトリにプラグインを入れた。

```bash
export CLAUDE_CONFIG_DIR=/workspace/pstack-series/2026-11-17/claude-home-fresh
claude plugin marketplace add cursor/plugins
claude plugin install pstack@cursor-plugins
claude plugin details pstack@cursor-plugins
```

![Claude Code 2.1.278 に pstack 0.15.43 を入れたターミナル出力：skill 58 個、agent 2 個、poteto-mode の下に worker.md](/assets/pstack-0-15-43-hands-on/claude-code-install.webp)

*図：空の設定ディレクトリに pstack 0.15.43 をインストールしたところ。marketplace は `cursor/plugins` 内で生成済みの `harness/pstack/claude-code` を指している。*

インストールは成功した。バージョンは 0.15.43、skill 58 個と agent 2 個で、`poteto-mode/` の下に `worker.md` が増えている。最後の行はこのマシンの制約を示している。Claude Code にログインしていないので、`/pstack:poteto-mode` のセッションを開いてモデルに実際に作業させることはできなかった。以下でモデルが「どう動くか」と書いている部分は、すべて skill の本文に基づくもので、観察した挙動ではない。

## 本文はどれだけ減ったか

PR のタイトルは「shorter skill texts」だが、合計の数字はない。そこで小さなスクリプトを書き、0.15.32（`e73df471`）と 0.15.43（`2f87c854`）の `pstack/` ディレクトリを比べた。frontmatter を除いた各 `SKILL.md` の語数を数え、追加と削除のあったファイルを並べる。

![比較スクリプトの出力：skill は 58 個で増減なし、SKILL.md 本文は 33096 語から 26346 語へ、references は 37 ファイルから 13 ファイルへ](/assets/pstack-0-15-43-hands-on/skill-diff.webp)

*図：0.15.32 と 0.15.43 の skill 本文の比較。語数は空白区切りで、frontmatter は含まない。*

覚えておく価値のある数字はいくつかある。

- skill の数は変わらず 58 個だ。追加も削除もなく、変わったのは各 skill に書かれている量だ。
- すべての `SKILL.md` 本文の合計は 33,096 語から 26,346 語になり、20.4% 減った。
- 削減が大きいのは `why`（1,251 → 50）、`architect`（771 → 69）、`reflect`（680 → 195）だ。`poteto-mode` 自体も 3,114 語から 1,679 語へ、ほぼ半分になった。
- `references/` の下のファイルは 37 個から 13 個になった。`why` は 12 個減り、`architect`、`how`、`interrogate`、`reflect` は空になった。
- 長くなった skill は 5 個だけだ。`setup-pstack` は 907 語から 1,226 語に増えたが、増えた分はほとんどが旧ルールファイルの移行ロジックだ。

`claude plugin details` はコンポーネントごとにトークン数を見積もるので、同じ変化を別の角度から見られる。

![claude plugin details の見積もり：常時コストは 3576 から 3514 トークン、60 コンポーネントの呼び出し時コスト合計は 52710 から 41290 トークン](/assets/pstack-0-15-43-hands-on/token-estimate.webp)

*図：Claude Code によるトークン見積もり。0.15.32 は `--plugin-dir` で読み込み、0.15.43 は marketplace からのインストール版。値はツール自身の丸めた見積もり。*

すべてのセッションが払う常時コストはほとんど動いていない（約 3,576 → 3,514 トークン）。これは主に skill の description から来ていて、description はあまり変わっていないからだ。節約は呼び出し時に効く。60 コンポーネントの呼び出し時コストの合計は約 52,710 から約 41,290 トークンに下がり、`/poteto-mode` 1 回分は約 5,100 から約 2,800 になった。`/poteto-mode` を打つたびにモデルが最初に読むルールはほぼ半分になり、空のセッションのコストはほぼ変わらない。

削った代償も PR に書かれている。短くなった `architect` と原則の本文からは、以前あった「インターフェースの深さ」についての記述が落ちた。[1] いまの `architect` は 1 段落だけだ。手を動かす前に変更が触れるシステムをすべて追い、異なる構造を 2 つ描き、状態の持ち主が一つで呼び出し側が知るべきことが最も少ないほうを選ぶ。大きな設計や意見の割れる設計は `arena` に回す。私はこの取捨選択は正しいと思う。旧版 `architect` の大半は進行手順の説明で、その手順は `arena` がすでに持っている。

## 新しいルーティング：Opus 5.5 が基本、上限は xhigh

0.15.43 でいちばん大きい挙動の変化はモデルルーティングだ。次の図は `poteto-mode` の既定値と `/setup-pstack` の予算段階を並べたものだ。

<figure class="not-prose my-6"><svg viewBox="0 0 640 374" role="img" aria-label="pstack 0.15.43 のモデルルーティングと予算の段階" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:640px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor" fill-opacity="0.6"/></marker></defs><text x="10" y="26" font-size="16" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">0.15.43 のルーティング：既定は Opus 5.5、どの役割も xhigh が上限</text><text x="10" y="52" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.75">役割 → 既定モデル</text><text x="390" y="52" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.75">/setup-pstack の予算段階</text><rect x="10" y="62" width="360" height="52" rx="8" fill="#3b82f6" fill-opacity="0.12"/><rect x="10" y="62" width="6" height="52" rx="3" fill="#3b82f6" fill-opacity="0.9"/><text x="26" y="84" font-size="13.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">コード、文章、判断</text><text x="26" y="104" font-size="12.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.9" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">claude-opus-5-5-xhigh-fast</text><rect x="10" y="122" width="360" height="52" rx="8" fill="#10b981" fill-opacity="0.12"/><rect x="10" y="122" width="6" height="52" rx="3" fill="#10b981" fill-opacity="0.9"/><text x="26" y="144" font-size="13.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">機械的な小さな修正、検証</text><text x="26" y="164" font-size="12.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.9" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">claude-opus-5-5-high-fast</text><rect x="10" y="182" width="360" height="74" rx="8" fill="#8b5cf6" fill-opacity="0.12"/><rect x="10" y="182" width="6" height="74" rx="3" fill="#8b5cf6" fill-opacity="0.9"/><text x="26" y="204" font-size="13.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">レビューと設計のパネル（arena、interrogate）</text><text x="26" y="224" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.9" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">claude-fable-5-2-high, claude-opus-5-5-high-fast,</text><text x="26" y="242" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.9" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">gemini-4-carbon-high</text><rect x="10" y="266" width="360" height="70" rx="8" fill="#f59e0b" fill-opacity="0.14" stroke="#f59e0b" stroke-width="1.5"/><text x="26" y="288" font-size="13.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">パネル外で Fable 5.2 が動くのは 2 つの場合だけ</text><text x="26" y="308" font-size="12.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.9">① このタスクでユーザーが名指ししたとき</text><text x="26" y="326" font-size="12.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.9">② 同じ brief で Opus 5.5 xhigh が 2 回チェックに落ちたとき</text><rect x="390" y="62" width="70" height="40" rx="6" fill="#ef4444" fill-opacity="0.1"/><text x="425" y="87" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="0.45" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">max</text><line x1="398" y1="83" x2="452" y2="83" stroke="#ef4444" stroke-width="2"/><text x="470" y="79" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.9">削除</text><text x="470" y="95" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.9">旧 unlimited → large</text><rect x="390" y="112" width="70" height="40" rx="6" fill="#64748b" fill-opacity="0.16"/><text x="425" y="137" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">xhigh</text><text x="470" y="129" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.9">large（= 既定）</text><rect x="390" y="162" width="70" height="40" rx="6" fill="#64748b" fill-opacity="0.16"/><text x="425" y="187" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">high</text><text x="470" y="179" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.9">medium</text><rect x="390" y="212" width="70" height="40" rx="6" fill="#64748b" fill-opacity="0.16"/><text x="425" y="237" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">medium</text><text x="470" y="229" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.9">small</text><rect x="390" y="262" width="70" height="40" rx="6" fill="#64748b" fill-opacity="0.16"/><text x="425" y="287" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">low</text><text x="390" y="322" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.8">既定が xhigh の役割は左の通り。</text><text x="390" y="338" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.8">既定が high の役割はさらに 1 段下。</text><text x="10" y="362" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">難しさだけでは Fable に切り替えない。Opus 5.5 は常に -fast slug、Gemini の上限は high。</text></svg></figure>

*図：0.15.43 の既定ルーティングと予算段階。`poteto-mode/SKILL.md` の Subagents 節と `setup-pstack/SKILL.md` の手順 3 による。[4][5]*

前の 2 つの版と並べると、変化がはっきりする。

| 役割 | 0.15.32 | 0.15.42 | 0.15.43 |
| --- | --- | --- | --- |
| コード（feature、bug-fix、perf、hillclimb） | `grok-4.7-xhigh-fast` | `claude-opus-5-5-xhigh` | `claude-opus-5-5-xhigh-fast` |
| 最難関の作業（`hardest tasks`） | `claude-opus-5-5-xhigh` | `claude-fable-5-2-max` | 役割を削除 |
| 小さな修正と検証（`swarm workers`） | `grok-4.7-xhigh-fast` | `claude-opus-5-5-high-fast` | `claude-opus-5-5-high-fast` |
| レビューと設計のパネル | Opus xhigh + Grok xhigh-fast | Fable high + Opus high-fast + Gemini Carbon high | 0.15.42 と同じ |
| 予算の選択肢 | unlimited、large、medium、small | 同左 | large、medium、small |

この中で、請求額に直接効くルールが 2 つある。

1 つ目は上限だ。どの予算を選んでも、どの役割も xhigh を超えず、Opus 5.5 は常に `-fast` slug を使う。以前の `unlimited` は `claude-opus-5-5-xhigh` を `claude-opus-5-5-max` に押し上げていたが、その段はもうない。PR の説明では、`unlimited` は max しか意味しえないので、上限を付けるのではなく削除したという。[1]

2 つ目は Fable の条件だ。レビューパネルの外で Fable 5.2 が動くのは 2 つの場合だけだ。ユーザーがこのタスクで名指ししたとき、または同じ brief で Opus 5.5 xhigh を 2 回走らせて、どちらもチェックに落ちたときだ。skill の本文には「難しさだけでは理由にならない」とも書かれている。[4] 私の見方では、このルールでコストが読めるようになった。代わりに、本当に難しいタスクはまず Opus を 2 回分使うことになる。Fable が必要だと最初からわかっているなら、prompt で名指しするのがいちばん安上がりだ。

## 旧ルールの移行をたどる

`/setup-pstack` の移行はスクリプトではない。pstack には移行プログラムが付いておらず、`/setup-pstack` を実行する agent が `SKILL.md` の手順 2 の文章を読んで、自分でルールファイルを書き換える。[5] このマシンでは agent を動かせない（Claude Code が未ログイン）ので、手順 2、3(b)、5 のルールを 1 つずつ Python スクリプトに書き起こし、典型的な旧ファイルを入れて、文章のルールがどんな結果を出すかを確かめた。

旧ファイルは 0.15.32 のルール形式で、予算は `unlimited` にした。そのため Opus はすべて `max` で、Grok は `xhigh-fast` のままだ（Grok には max がない）。さらに `bug-fix` を `inherit-parent` にして、ユーザー自身の選択を模した。

```text
# budget: unlimited (max)
feature, refactoring: grok-4.7-xhigh-fast
bug-fix: inherit-parent
judgment and prose: claude-opus-5-5-max
hardest tasks: claude-opus-5-5-max
how explorer: grok-4.7-xhigh-fast
...
arena runners: claude-opus-5-5-max, grok-4.7-xhigh-fast
architect runners: claude-opus-5-5-max, grok-4.7-xhigh-fast
interrogate reviewers: claude-opus-5-5-max, grok-4.7-xhigh-fast
```

![setup-pstack 0.15.43 の文章どおりの移行：引退した役割の行を 8 行削除、unlimited は large に、Grok の旧既定は Opus に置き換え、最後に # defaults: 3 付きの新ルールを書き出す](/assets/pstack-0-15-43-hands-on/setup-migration.webp)

*図：移行の各手順と、最終的に書き出されるルールファイル。予算の質問には `large` と答え、手順 4 の利用可能モデルのチェックはすべて通るものと仮定した。*

結果は 3 種類に分かれる。

1. **削除される行。** 全部で 8 行ある。`hardest tasks`、`how` の 2 役割、`why` の 2 役割、`reflect` の 2 役割、そして `architect runners` だ。どれも新しい手順 5 のルール形式にない役割だ。
2. **新しい既定に置き換わる行。** ファイルには `# defaults: 3` も `# defaults: 2` もないので、`grok-*` はユーザーの選択ではなく旧既定と見なされる。コードの 4 役割と `swarm workers` は Opus に替わる。3 つのパネルはちょうど「Opus 1 つと Grok 1 つ」で条件に合うので、3 席の新しいリストに置き換わる。`unlimited` は `large` になる。
3. **残る行。** `bug-fix: inherit-parent` はそのまま残る。`judgment and prose: claude-opus-5-5-max` は手順 2 では手を付けられないが、手順 3(b) で `large` に合わせて強度が xhigh に戻され、`-fast` が付いて `claude-opus-5-5-xhigh-fast` になる。

3 つ目には本文が言い切っていない箇所がある。手順 2 は「それ以外の値はユーザーの選択なので残す」と書くが、新しい版では `max` はそもそも使えない。私は手順 3(b) の「すべての実際の slug の強度を役割の目標値に設定する」と、手順 4 の「xhigh 以下でなければならない」からこの結果を導いた。実際の agent はまず確認してくるかもしれないし、そのまま直すかもしれない。そこは検証できていない。

もう一つ細かい点がある。移行後のファイルは、`bug-fix` を除けば新規インストール時の既定とまったく同じだ。最初に既定のまま進めた人にとって、`/setup-pstack` の再実行はリセットと同じ意味になる。いくつかの役割を手で変えていた人は、実行後に表示される「置き換えた値」の一覧を確認してほしい。Claude Code では書き込み先が `~/.claude/rules/pstack-models.md` になり、モデルの値は `opus xhigh` のような形で書かれ、Gemini は `inherit-parent` に対応付けられる。[6]

## worker.md：子 agent も同じルールに従う

以前は抜け穴があった。operator のルール（人に質問しない、PR の書き方、どこで止まるか）は skill に書かれていて、skill はスラッシュコマンドを打ったときにしか読み込まれない。`/poteto-mode` が起動した子 agent は、メインの会話が kickoff にルールを書き写さない限り、それを受け取れなかった。0.15.43 はファイルを 1 つ足し、すべての kickoff の 1 行目でそれを指すと決めて、この穴をふさいだ。

<figure class="not-prose my-6"><svg viewBox="0 0 640 437" role="img" aria-label="worker.md がすべての子 agent に届く仕組み" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:640px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><defs><marker id="pstack1543ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor" fill-opacity="0.6"/></marker></defs><text x="10" y="26" font-size="16" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">worker.md：/poteto-mode が起動する agent はまず同じルールを読む</text><rect x="10" y="46" width="146" height="66" rx="8" fill="#64748b" fill-opacity="0.12"/><text x="83" y="72" font-size="13.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">あなた（operator）</text><text x="83" y="94" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">実行全体の依頼主</text><rect x="168" y="46" width="146" height="66" rx="8" fill="#3b82f6" fill-opacity="0.12"/><text x="241" y="72" font-size="13.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">/poteto-mode の会話</text><text x="241" y="94" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">SKILL.md と playbook</text><rect x="326" y="46" width="146" height="66" rx="8" fill="#10b981" fill-opacity="0.12"/><text x="399" y="72" font-size="13.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">子 agent</text><text x="399" y="94" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">Task または Project worker</text><rect x="484" y="46" width="146" height="66" rx="8" fill="#10b981" fill-opacity="0.12"/><text x="557" y="72" font-size="13.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">孫 agent</text><text x="557" y="94" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">同じく最初に worker.md</text><line x1="158" y1="79" x2="176" y2="79" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#pstack1543ah)"/><line x1="316" y1="79" x2="334" y2="79" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#pstack1543ah)"/><line x1="474" y1="79" x2="492" y2="79" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#pstack1543ah)"/><text x="10" y="138" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.8">すべての kickoff の 1 行目：</text><rect x="10" y="146" width="620" height="30" rx="6" fill="#10b981" fill-opacity="0.1"/><text x="22" y="166" font-size="13" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="1" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">Read &lt;path&gt;/worker.md before anything else.</text><text x="10" y="202" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.8">worker.md のルール（要約）：</text><rect x="10" y="210" width="620" height="26" rx="4" fill="#64748b" fill-opacity="0.13"/><text x="22" y="228" font-size="12.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">kickoff に書かれた基準がすべて。チェック、ゲート、承認、レビューを足さない</text><rect x="10" y="240" width="620" height="26" rx="4" fill="#64748b" fill-opacity="0.08"/><text x="22" y="258" font-size="12.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">基準がなければ：base より悪くならず、自分のテストに通ること</text><rect x="10" y="270" width="620" height="26" rx="4" fill="#64748b" fill-opacity="0.13"/><text x="22" y="288" font-size="12.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">止めてよいのは現 head の失敗か、ユーザーが踏むバグだけ。base の問題は 1 行で報告</text><rect x="10" y="300" width="620" height="26" rx="4" fill="#64748b" fill-opacity="0.08"/><text x="22" y="318" font-size="12.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">人に質問を出さない。取り消せる選択は先に実行し、何をなぜ選んだかを書く</text><rect x="10" y="330" width="620" height="26" rx="4" fill="#64748b" fill-opacity="0.13"/><text x="22" y="348" font-size="12.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">止まるのはデプロイ、データ削除、共有ブランチへの force-push、外部へのメッセージだけ</text><rect x="10" y="360" width="620" height="26" rx="4" fill="#64748b" fill-opacity="0.08"/><text x="22" y="378" font-size="12.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">PR は最初から ready。タイトルは type(scope): subject。本文 40 行以内、見出し 6 つ</text><text x="10" y="406" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">kickoff がルールを覆せるのは、そう明記したときだけ。</text><text x="10" y="423" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">以前はスラッシュコマンドで skill を読んだときにしか届かなかった。</text></svg></figure>

*図：`worker.md` の伝わり方とルールの要約。`poteto-mode/worker.md` による。[7]*

このファイルは短く、箇条書きは全部で 9 項目だ。アップグレード前にチームの習慣と照らし合わせておきたい項目がいくつかある。

- **kickoff の基準がすべての基準。** 子 agent は自分でチェック、承認、レビューを足さない。余計な作業は減るが、kickoff に書かれていないチェックは行われないということでもある。
- **人に質問を出さない。** 取り消せる選択は先に実行し、何を選んだかを後で伝える。止まるのはデプロイ、データ削除、共有ブランチへの force-push、実行の外の人へのメッセージの 4 つだけだ。
- **PR は最初から ready で開き、draft にしない。** タイトルは `type(scope): subject`、本文は 40 行以内で、固定の `##` 見出しを 6 つ使う。

kickoff がこれらのルールを覆せるのは、そのことを明記したときだけだ。チームで PR を最初に draft で開く決まりがあるなら、kickoff にはっきり書く必要がある。リポジトリの慣習だけでは足りない。

## Orchestrate の行き先

Orchestrate は 2 段階で消えた。0.15.36 で `orch` スクリプトが削除され、playbook はコーディネーターが自分の agent ツールでプログラム全体を管理する形に書き直された。[2] 0.15.43 ではその playbook も削除された。いまの `poteto-mode` のルーティングでは、大規模、横断的、無人の作業や、どの playbook にも合わない作業は `figure-it-out` に回る。[4] `figure-it-out` は「より狭い playbook がないときに、監査できるやり方を設計する」skill で、タスクの大きさに合わせて厳密さを調整し、仮説のループを回し、判断を記録する。

`poteto-help` にも一文が加わった。pstack に `/orchestrate` skill はなく、スラッシュメニューに `/orchestrate` が出ているなら別のプラグインが提供している、というものだ。[8] 実際、同じ `cursor/plugins` リポジトリには独立した `orchestrate` プラグインがある。Cursor SDK を通じて大きなタスクを並列の cloud agent に振り分けるもので、`bun` と `CURSOR_API_KEY` が必要だ。[9] これは pstack の一部ではない。多数の cloud agent に振り分けたいならこのプラグインを見ればよい。大きなタスクを片付けたいだけなら `/poteto-mode` で足りる。

今週 X では、自分のワークフローの 2 段目を「pstack Orchestrate：Fable で動く巨大なオーケストレーターのスレッド」と書いている人もいた。[10] これはまさに 0.15.43 が外した 2 つ、Orchestrate playbook と「最難関は既定で Fable」だ。こうした古い手順で設定した人は、アップグレード後に 2 か所を直す必要がある。

## リポジトリ付属のチェックはすべて通った

`2f87c854` で CI と同じ手順を実行した。CI が使う 3 つの依存をインストールし、リポジトリの 3 つのスクリプトと、すべての skill スクリプトのテストを走らせた。

![cursor/plugins 2f87c85 で validate-plugins、harness ツリーのチェック、check-pstack-docs、node --test を実行：テスト 340、合格 270、失敗 0、スキップ 70](/assets/pstack-0-15-43-hands-on/repo-checks.webp)

*図：Linux、Node 26.9.0 での結果。CI は Node 22 を使う。*

3 つのスクリプトはすべて通った。プラグイン定義は正しく、生成済みの Claude Code harness ツリーは最新で、ドキュメントのチェックは問題 0 件（skill 58、playbook 22、agent 2）だった。テストは 340 件で、合格 270、失敗 0、スキップ 70。PR には合格 269、失敗 1 とあり、失敗は macOS の main でも同じく落ちる statechart のシンボリックリンクのテストだという。[1] Linux ではこのテストは通った。

スキップされた 70 件は `TLA2TOOLS` に `tla2tools.jar` のパスを設定する必要があり、Java が要る。このマシンには Java がないので、`/statechart` が TLC を呼ぶ経路は検証していない。0.15.38 の「SANY が spec を読めないときに行と列を示す」修正もその中に含まれる。[3]

## 今週コミュニティで繰り返された質問

過去 7 日間、X では pstack の投稿が多かった。繰り返し出てきた質問は 3 つある。

**既定モデルが変わったら `/setup-pstack` を再実行すべきか。** 0.15.42 の公開後、すぐ再実行しようと呼びかける日本語の投稿が 150 件以上のいいねを集めた。[11] 0.15.43 の後も答えは同じで、理由はさらに強くなった。今回はルールの形式（`# defaults: 3`）まで変わり、いくつかの役割も消えた。

**Codex で使えるか。** 今週だけで少なくとも 2 回この質問が出ていた。[12][13] 上流の README に書かれているのは Cursor と Claude Code の入れ方だけだ。コミュニティの移植版はあるが、私は試していないので、ここで特定のものは勧めない。サイト内ガイドの [ホスト互換性の表](/ja/garden/notes/pstack-skills-guide/#host-compatibility) は今も有効だ。

**トークンが高い。** 夜に bot をいくつか回すだけで週の予算の 75% を使ってしまうので、トークン節約のコツを書いてほしい、と作者に直接頼む投稿があった。[14] 0.15.43 が効くのは 2 点だ。呼び出し時の本文が短くなったことと、`max` の段がなくなったことだ。ただしパネルは安くならない。3 席のレビューパネルは相変わらず 3 つのモデルがそれぞれ走る。本当に節約したいなら、`/setup-pstack` で `medium` か `small` を選び、パネルのリストを短くする。

## 検証したこと、していないこと

実際に動かしたもの：

- Claude Code 2.1.278 で marketplace から pstack 0.15.43 をインストールし、バージョン、コンポーネント一覧、`worker.md` の存在を確認した。
- 0.15.32 と 0.15.43 の skill 一覧、`SKILL.md` の語数、`references/` とその他のファイルの増減を比較した。
- 両方の版の `claude plugin details` のトークン見積もりを比較した。
- `setup-pstack` 0.15.43 の文章に従って、旧ルールファイルを新形式に移行した。
- `validate-plugins`、`generate-pstack-harness-trees --check`、`check-pstack-docs`、CI の `node --test` を実行した。

検証していないもの：

- 実際の `/poteto-mode` や `/setup-pstack` のセッション。Claude Code は未ログインで、このマシンに Cursor はない。モデルが本当に `worker.md` を読むか、Fable の条件が守られるかについては、まだ観察データがない。
- agent が実際に行う移行の結果。上の結果は、書かれたルールを機械的にたどったものだ。
- Java と TLC が必要な statechart のテスト 70 件。

私の結論は、アップグレードする価値がある、だ。本文が短くなった効果は主に呼び出しごとのコンテキストに出る。ルーティングの上限で、最悪の場合のコストに天井ができた。`worker.md` は、子 agent が operator のルールを受け取れないという穴をふさいだ。アップグレード後にやることは少ない。`/setup-pstack` を再実行し、置き換えられた値を確認し、`worker.md` をチームの PR ルールと照らし合わせる。

## 参考資料

1. cursor/plugins PR #1249、feat(pstack): shorter skill texts, worker.md, and Opus-first routing capped at xhigh：<https://github.com/cursor/plugins/pull/1249>
2. cursor/plugins PR #1043、feat(pstack): make Orchestrate agentic and delete the orch scripts：<https://github.com/cursor/plugins/pull/1043>
3. cursor/plugins PR #1236、feat(pstack): new default models, one-file why and how, statechart fixes, sharpen and reflect text：<https://github.com/cursor/plugins/pull/1236>
4. pstack 0.15.43、`poteto-mode/SKILL.md`：<https://github.com/cursor/plugins/blob/2f87c854fe3e2fcda44ca86b46ede35aad3c46b7/pstack/skills/poteto-mode/SKILL.md>
5. pstack 0.15.43、`setup-pstack/SKILL.md`：<https://github.com/cursor/plugins/blob/2f87c854fe3e2fcda44ca86b46ede35aad3c46b7/pstack/skills/setup-pstack/SKILL.md>
6. pstack 0.15.43、Claude Code adapter：<https://github.com/cursor/plugins/blob/2f87c854fe3e2fcda44ca86b46ede35aad3c46b7/pstack/docs/harness/claude-code.md>
7. pstack 0.15.43、`poteto-mode/worker.md`：<https://github.com/cursor/plugins/blob/2f87c854fe3e2fcda44ca86b46ede35aad3c46b7/pstack/skills/poteto-mode/worker.md>
8. pstack 0.15.43、`poteto-help/SKILL.md`：<https://github.com/cursor/plugins/blob/2f87c854fe3e2fcda44ca86b46ede35aad3c46b7/pstack/skills/poteto-help/SKILL.md>
9. cursor/plugins、`orchestrate` プラグインの README：<https://github.com/cursor/plugins/tree/main/orchestrate>
10. @mrtnnow の X 投稿（2026-11-13）：<https://x.com/mrtnnow/status/2121248719207117226>
11. @cu30rry_ の X 投稿（2026-11-15）：<https://x.com/cu30rry_/status/2121885461409133029>
12. @JediTam の X での質問（2026-11-14）：<https://x.com/JediTam/status/2121390741536874906>
13. @filipem1randa の X での返信（2026-11-17）：<https://x.com/filipem1randa/status/2122460032629604581>
14. @ndh4hy の X 投稿（2026-11-15）：<https://x.com/ndh4hy/status/2121930619559252125>
