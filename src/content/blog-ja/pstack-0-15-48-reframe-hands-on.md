---
title: "pstack 0.15.48 を実地検証：/reframe は「それが業界で何と呼ばれているか」を教えてくれる"
description: "pstack 0.15.43 から 0.15.48 までの実質的な変化は二つある。手動で呼ぶ新しい skill /reframe と、レビューパネルの Gemini 席の gemini-4-neon-xhigh への切り替えだ。0.15.48 を Claude Code に入れ、曖昧・明確・精密の 3 種類の説明で /reframe を実行し、古いルールファイルで /setup-pstack の Gemini 移行を確かめ、リポジトリ付属のチェックとテストを走らせた。"
author: Remy
pubDate: 2026-11-24T09:30:00+08:00
lang: ja
translatedFrom: pstack-0-15-48-reframe-hands-on
tags:
  - ai-agents
  - agent-harness
  - ai-coding
  - claude-code
  - software-engineering
series: pstack
---

**結論：** pstack 0.15.43 から 0.15.48 までの 5 リリースのうち、手を動かす価値がある変化は二つだけだ。一つは新しい skill の `/reframe`。作りたいものは分かっているのに、その分野で何と呼ばれているかが分からないとき、専門用語を 8〜12 個教え、隣接分野から言葉を借り、その言葉で説明を書き直してくれる。0.15.48 では、説明が曖昧なら「考えられる問題」を 2〜3 個先に挙げるようになった。[1][2] もう一つは、レビューと設計のパネルにいる Gemini 席が `gemini-4-carbon-high` から `gemini-4-neon-xhigh` に変わったことだ。ルールファイルを保存している人は、自分で `/setup-pstack` を再実行する必要がある。誰も知らせてはくれない。[4][5]

| 今の状況 | やること |
| --- | --- |
| Cursor か Grok Bot を使っている | プラグインは自動で更新される。作者の言葉では "it's autoupdated"。[11] 0.15.48 になっているか確認するだけでいい。 |
| Claude Code を使っている | サードパーティの marketplace は自動更新されない。`claude plugin marketplace update cursor-plugins`、続いて `claude plugin update pstack@cursor-plugins` を実行し、再起動する。コマンド名は `/pstack:reframe`。 |
| agent に頼みたいことがあるのに、それをうまく言えない | プロジェクトのディレクトリで `/reframe <自分の言葉>` を実行し、ファイルを読ませる。書き直された説明をそのまま送るか、`/sharpen` にかけてから `/poteto-mode` に渡す。[9] |
| 用語はもう分かっていて、プロンプトを深くしたいだけ | `/sharpen` を使えばいい。`/reframe` は要らない。 |
| ルールのパネル役割に `gemini-4-carbon-high` か `gemini-4-neon-high` がある | `/setup-pstack` を再実行すると `gemini-4-neon-xhigh` に置き換わる。`# defaults: 3` は変わっていないので、`/poteto-mode` は再実行を促さない。 |
| パネルで `gemini-4-neon-medium` などの低いレベルを自分で選んだ | `large` 予算で再実行すると `xhigh` に戻される。低いレベルを残したいなら `medium` か `small` の予算を選ぶか、確認ステップで変え直す。 |
| Claude Code でパネルを使っている | Gemini 席は `inherit-parent` に対応づけられるので、今回の移行の影響はない。[8] |
| ネイティブの Windows で `/statechart` を使う | Node 22.18〜22.x か 23.6 以降で `node --disable-warning=ExperimentalWarning <skill dir>/scripts/statechart.ts` を実行する。[6] |

pstack シリーズの 2 本目だ。1 本目の [Claude Code で pstack 0.15.43 を実地検証](/ja/blog/pstack-0-15-43-hands-on/) では、ルーティングの xhigh 上限と Orchestrate の行き先を扱った。サイト内の [pstack skills ガイド](/ja/garden/notes/pstack-skills-guide/) は 0.15.32 時点の全体像だ。この記事では 0.15.43 以降の変化だけを扱う。

## 5 つのリリースと、二つの本題

まず 5 回のマージを並べておく。時刻は上海時間だ。

| バージョン | マージ | PR | 変更 |
| --- | --- | --- | --- |
| 0.15.44 | 11-19 14:26 | #1283 | パネルの Gemini 席が Carbon から `gemini-4-neon-high` に。`setup-pstack` が古い `gemini-4-*` エントリを移行するようになった。[4] |
| 0.15.45 | 11-20 05:53 | #1284 | 席が `gemini-4-neon-xhigh` に上がり、古い `high` の既定値もあわせて移行される。[5] |
| 0.15.46 | 11-20 06:12 | #1292 | `/statechart` がネイティブ Windows で動くようになり、TLC の `\r\n` 改行で起きていたバグも直った。[6] |
| 0.15.47 | 11-24 06:32 | #1324 | `/reframe` を追加。[1] |
| 0.15.48 | 11-24 08:41 | #1326 | 説明が曖昧なとき、`/reframe` はまず考えられる問題を挙げる。[2] |

Gemini の席替えは保守的な変更で、`/statechart` の修正が効くのは Windows だけだ。pstack の使い方そのものを変えるのは、最後の 2 リリースで形になった `/reframe` である。この記事の大半はそれに充てる。

## /reframe が埋めるのは「語彙の穴」

pstack にはすでに `/sharpen` がある。「この分野の一流なら、頼まれていないのに何をするか」を問い、プロンプトをより深く書き直す skill だ。ただしこれには前提がある。何を作りたいのか、自分で言えることだ。実際に詰まるのは、たいていその手前である。症状は見えている。たとえば「設定画面で、すぐ保存される項目と送信しないと保存されない項目が混ざっていて、ユーザーが編集内容を失う」。でもそれが「保存モデルの不統一」と呼ばれることも、dirty state や lost update が同じ話の一部だということも知らない。言葉が合っていなければ、agent はあなたの文を字面どおりに読み、作るものも字面どおりで止まる。

`/reframe` はこの穴のための skill だ。`SKILL.md` の本文は英語で 202 語。`/sharpen` の 124 語より少し長いが、中身は短い手順になっている。[3]

1. 要約からではなく、本人のファイル、コード、本人の説明から始める。
2. 説明が複数の問題を指しうるなら、まず 2〜3 個挙げる。それぞれに、その問題を名指す用語と、ほかと見分けるサインを付ける。そのうえで最もありそうなものの用語を教え、選んだ理由を言う。この段落が 0.15.48 での追加分だ。
3. 用語を 8〜12 個、作るものをどれだけ変えるかの順に並べる。各用語には、平易な一文の意味、説明のどの部分を名指すか、その意味で使っている実在のプロジェクトや論文やシステム（リンク付き）、そして agent に何を頼めるようになるかを付ける。
4. 同じ形の問題を別の名前で解いてきた隣接分野を 2〜3 個選ぶ。何が持ち込めるか、たとえがどこで崩れるか、どの用語を持ち帰れるかを言う。
5. 本人が書いていないが気にすべきことを挙げる。
6. 新しい用語で説明を書き直す。

全体に一つ制約がかかっている。リンクはすべて開き、その用語をその意味で使っているか確かめる。確かめられない引用は削る。

<figure class="not-prose my-6"><svg viewBox="0 0 640 556" role="img" aria-label="0.15.48 の /reframe：曖昧な説明ならまず候補の問題を挙げ、用語、隣接分野の言葉、書き直しへ進む" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:640px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor" fill-opacity="0.6"/></marker></defs><rect x="150" y="16" width="340" height="40" rx="8" fill="#2563eb" fill-opacity="0.1"/><text x="320" y="41" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">入力：あなたの説明 + リポジトリのファイル</text><polyline points="320,56 320,80" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah)"/><rect x="110" y="80" width="420" height="48" rx="8" fill="#d97706" fill-opacity="0.12" stroke="#d97706" stroke-width="1.5"/><text x="320" y="109" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">この説明は複数の問題を指しうるか？</text><text x="536" y="76" font-size="11" text-anchor="start" font-weight="bold" fill="#d97706" fill-opacity="1">0.15.48 で追加</text><polyline points="180,128 180,150" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah)"/><text x="188" y="143" font-size="12" text-anchor="start" font-weight="bold" fill="#d97706" fill-opacity="1">はい</text><rect x="20" y="150" width="290" height="56" rx="8" fill="#d97706" fill-opacity="0.08" stroke="#d97706" stroke-width="1.5"/><text x="165" y="173" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">考えられる問題を 2〜3 個挙げる</text><text x="165" y="194" font-size="12" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">それぞれ：用語 1 つ + 見分けるサイン 1 つ</text><polyline points="165,206 165,226" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah)"/><rect x="20" y="226" width="290" height="40" rx="8" fill="#d97706" fill-opacity="0.08" stroke="#d97706" stroke-width="1.5"/><text x="165" y="251" font-size="13" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">いちばんありそうなものを選び、理由を言う</text><polyline points="165,266 165,300" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah)"/><polyline points="530,104 606,104 606,300" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah)"/><text x="548" y="98" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.7">いいえ</text><rect x="330" y="150" width="256" height="56" rx="8" fill="#6b7280" fill-opacity="0.06" stroke="#6b7280" stroke-width="1.5" stroke-dasharray="5 4"/><text x="458" y="173" font-size="12" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">リンクはすべて開き、その用語を</text><text x="458" y="192" font-size="12" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">その意味で使っているか確認。駄目なら削る</text><polyline points="458,206 458,300" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" stroke-dasharray="4 4" marker-end="url(#ah)"/><text x="466" y="262" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.7">① への制約</text><rect x="20" y="300" width="600" height="178" rx="8" fill="#2563eb" fill-opacity="0.07" stroke="#2563eb" stroke-width="1.5"/><text x="36" y="326" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">① 用語 8〜12 個。作るものをどれだけ変えるかの順</text><text x="52" y="346" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.8">各項目：平易な意味 · 説明のどの部分か · 実在のプロジェクトや論文のリンク · agent に頼めること</text><text x="36" y="376" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">② 隣接分野 2〜3 個</text><text x="52" y="396" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.8">持ち込めるもの · たとえが崩れる所 · 持ち帰る用語</text><text x="36" y="426" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">③ 書いていないが気にすべきこと</text><text x="36" y="458" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">④ 新しい用語で説明を書き直す</text><polyline points="320,478 320,500" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah)"/><rect x="70" y="500" width="500" height="40" rx="8" fill="#2563eb" fill-opacity="0.12"/><text x="320" y="525" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">出力：書き直した説明 → 必要なら /sharpen → /poteto-mode へ</text></svg></figure>

*図：0.15.48 の `/reframe` の流れ。黄色の部分が 0.15.48 で加わったステップで、点線の枠は ① 全体にかかる引用チェック。出典は `reframe/SKILL.md`。[3]*

コミット履歴を見ると、この skill の位置づけが分かる。最初の名前は `name-it` で、その後 `reframe` に改名され、「sharpen のようにメタプロンプトとして」書き直された。[1] PR は名前の理由をこう説明している。`sharpen` と同じくプロンプトにかける動詞であり、専門家と隣接分野の言葉を通して課題を見る、という動きを名指している、と。`sharpen` と同様に `disable-model-invocation: true` が付いていて、自分で打ったときだけ動く。`/poteto-mode` が勝手に呼ぶことはない。

0.15.48 で加わった段落は小さいが、効いている。PR の理由は、説明が曖昧なときに候補の問題を先に挙げておけば、間違った問題のために語彙を丸ごと教えずに済む、というものだ。[2] 医者の鑑別診断と同じ考え方である。A、B、C のどれかもしれない、見分けるにはここを見る、と言ってから、最もありそうなものを掘り下げる。

## テスト環境

テスト機には Claude Code 2.1.278 があり、前回 0.15.43 を入れた独立した設定ディレクトリをそのまま使う。更新はコマンド 2 つで済む。

![Claude Code で pstack を 0.15.43 から 0.15.48 へ更新：marketplace を更新してからプラグインを更新する。常時コストの見積もりは 3514 から 3563 トークンに、reframe の呼び出し時コストは約 270 トークン](/assets/pstack-0-15-48-reframe-hands-on/claude-code-update.webp)

*図：Claude Code での 0.15.43 から 0.15.48 への更新と、`claude plugin details` によるトークン見積もりの比較。*

skill は 58 個から 59 個になり、増えたのが `reframe` だ。コストは小さい。セッションごとの常時コストは約 3,514 から約 3,563 トークンに増えたが、これはほぼ `reframe` の description 1 行分だ。1 回の呼び出しは約 270 トークン。`setup-pstack` は Gemini 移行のルールが増えたぶん、呼び出し時コストが約 2,000 から約 2,200 トークンになった。

このマシンの Claude Code はログインしていないので、`claude -p '/pstack:reframe ...'` は `Not logged in · Please run /login` を返すだけだ。そこで skill の実行には OpenCode 2.3.2 と、その無料モデル `opencode/deepseek-v4.1-flash-free` を使った。OpenCode の `skills` 設定には任意のディレクトリを指定できるので、[16] Claude Code のプラグインキャッシュにある 0.15.48 の `skills/reframe` と `skills/setup-pstack` を直接指した。モデルが読むのは、インストールして手に入るファイルそのものだ。一字も変えていない。

一つだけ注意しておく。これは無料の小さなモデルで、pstack の既定ルーティングが使う Opus 5.5 ではない。以下の出力は、この skill の文章が普通のモデルからどこまで引き出せるかを示している。強いモデルなら、少なくとも同じくらいにはなるはずだ。

## 3 つの説明で、3 回の実行

数ファイルだけの小さなプロジェクトを 3 つ用意し、それぞれ一文で問題を説明した。曖昧なものから精密なものへと並べてある。

### 曖昧：「bot が同じ仕事を二度やったり、飛ばしたりする」

1 つ目は cron で動く Python スクリプト 3 本で、JSON ファイルの束を台帳にしている。`trends.py` が候補語を評価し、`writer.py` が選ばれた行の下書きを書く。入力はこうだ。

```text
@reframe my bots sometimes do the same work twice and sometimes skip it. I want them to be more reliable.
```

![曖昧な説明で /reframe を実行：crontab と 2 本のスクリプトを読み、12 ページを開いて引用を確かめ、考えられる問題を 3 つ挙げて 1 つ目を選んだ](/assets/pstack-0-15-48-reframe-hands-on/reframe-vague.webp)

*図：曖昧な説明での実行記録の抜粋。途中の用語リスト、隣接分野、リスク一覧は省いた。*

0.15.48 の新しいステップが一番生きたのがここだ。`crontab.txt`、`writer.py`、`trends.py` を読んだあと、モデルはこの文が 3 つの問題を指しうると言った。

1. クラッシュに弱く冪等でないジョブ処理。用語は「at-least-once 実行のもとでの冪等性」。サインは、cron は時間どおりに動いているのに、再実行や途中のクラッシュで同じ下書きがまた作られること。
2. 相互排他のない並行実行。用語は lease、または分散ロック。サインは、同時に 2 つのプロセスが生きている、あるいは長い実行が次のスケジュールに重なること。
3. スケジューラ自体の信頼性。用語は dead man's switch（来るはずのハートビートが来なければ警報を出す仕組み）。サインは、予定の時刻にログもハートビートもまったくないこと。

モデルは 1 つ目を選び、2 つ目をそれを悪化させる要因とした。理由はすべてコードから来ている。`writer.py` は `status == "shortlisted"` を確かめ、下書きを書き、そのあとでステータスを変える。その間にクラッシュすれば仕事が繰り返される。`trends.py` は 429 を受けると `time.sleep(60); continue` するので、その行はその回の処理から落ちる。レート制限される行が多ければ、実行全体が次の cron の時間に食い込む。どちらのスクリプトも `json.dump(row, open(path, "w"))` で書いていて、これは先にファイルを空にする。書き込み途中のクラッシュで壊れた JSON が残れば、次の `json.load` が例外を投げ、それ以降の行はすべて飛ばされる。「二度やる」も「飛ばす」も、cron の正確さとは関係なく、この数行から出てくる。

続く 12 個の用語の並びも筋が通っている。先頭は idempotency key、続いて compare-and-swap による原子的な取得、fencing token 付きの lease、idempotent consumer で、dead man's switch は最後だ。隣接分野はデータベースのトランザクション、メッセージ指向ミドルウェア、ストリーム処理とワークフローのオーケストレーションの 3 つで、どれもたとえが崩れる所を述べている。たとえば、1 台のマシンにはネットワーク分断がないので Raft も Redlock も要らない。ただしプロセスの一時停止や cron の重なりは現実に起きるので、fencing token のない lease はやはり安全ではない、という具合だ。

いちばん役に立ったのは「書いていないが気にすべきこと」の節だ。`crontab.txt` が `bots/digest.py` を呼んでいるのに、そのファイルがリポジトリに存在しないことに気づいた。テスト用プロジェクトを作るときの見落としで、モデルはそれを拾った。書き直された説明は、これらを agent にそのまま渡せる依頼にまとめている。at-least-once 配信と冪等な処理、fencing token 付きの lease、デッドレター、巡回処理、重複実行の防止、原子的なコミット。最後に規模の感覚も添えてある。「この規模なら Kafka や Temporal はまだ要らない。SQLite のテーブル 1 つと `flock`、巡回スクリプトで、この語彙の大半は実装できる」。

### 明確：一部の項目だけすぐ保存される設定画面

2 つ目は pstack ガイド第 2 章の例そのものだ。[9] トグルは `patchUser` を呼んですぐ保存し、テキスト欄は **Save** を押すまで待って `saveProfile` を呼ぶ。

```text
@reframe the settings page saves some fields right away and others only on submit, and people lose edits.
```

![設定画面の説明で /reframe を実行：2 つのソースファイルを読んだうえで 3 つの読み方を挙げ、保存モデルの不統一を選び、save model、unit of work、single source of truth などの用語で説明を書き直した](/assets/pstack-0-15-48-reframe-hands-on/reframe-settings.webp)

*図：設定画面の説明での実行記録の抜粋。*

この文なら十分に明確で、新しいステップは出ないだろうと思っていた。出た。挙がったのは、保存モデルの不統一、lost update、そして状態の持ち主があいまいなこと（フォームはマウント時に一度だけ props から値をコピーしている）の 3 つだ。モデルは 1 つ目を選んだうえで、3 つ目はすでにコードに書かれていると指摘した。トグルが読んでいるのは `user.emailDigest` という prop で、`patchUser` は完全な user を返すのに画面はそれを捨てている。保存モデルを揃えても、編集内容はやはり失われる。さらに、どちらの関数も `res.ok` を確かめていないことにも気づいた。`fetch` は 4xx や 5xx では例外を投げないので、保存に失敗しても成功したように見える。

12 個の用語には save model、unit of work、dirty state、optimistic update、If-Match、debounce、navigation guard が並び、それぞれ VS Code、React、React Router、MDN、Stripe などの出典が付いている。「ユーザーが編集を失う」と書いた本人なら、この書き直しを読めばどの保存モデルにするか決められるだろう。

### 精密：あとから保存した人が、前の人の編集を上書きする

3 つ目はわざと正確に書いた。症状は教科書どおりの lost update だ。

```text
@reframe when two people open the same wiki page and both save, the second save silently overwrites the first person's changes. Nobody sees an error.
```

![精密な説明で /reframe を実行：最初の一文で lost update と名指ししたうえで、lost update、検出されているのに表示されない編集衝突、本来はマージすべき同時編集の 3 つの読み方を挙げた](/assets/pstack-0-15-48-reframe-hands-on/reframe-precise.webp)

*図：精密な説明での実行記録の抜粋。*

答えの最初の一文は「これは lost update だ」。それでも候補は出てくる。並行制御がまったくない、衝突は検出されているのに UI が握りつぶしている、二人が別々の段落を直していて本来はマージすべきだった、の 3 つだ。後の 2 つは数合わせではない。2 つ目は、コードを書く前にログに 409 が出ていないか見ろと言っている。3 つ目は製品としての判断で、あとの保存を拒むのか、両方の編集を合わせるのかを決めることになる。モデルが 1 つ目を選んだ理由は、`save_page.py` が `pages.get` から `body` の書き換え、`pages.put` まで、どこでもバージョンを確かめていないことだ。

### 3 回を並べてみる

| | 曖昧（bot） | 明確（設定画面） | 精密（wiki） |
| --- | --- | --- | --- |
| 候補の問題を先に挙げたか | 3 個 | 3 個 | 3 個 |
| 用語 | 12 | 12 | 12 |
| 隣接分野 | 3 | 3 | 3 |
| 最終回答のリンク | 12 | 13 | 12 |
| 実行中に開いた URL | 23 | 20 | 35 |
| 所要時間 | 約 3.5 分 | 約 3 分 | 約 5 分 |

言っておきたいことが二つある。

一つ目。候補の問題を挙げるステップは、精密な説明も含めて 3 回とも発動した。ルールは「説明が複数の問題を指しうるなら」で、ほとんどどんな文でも複数の問題を指しうる。私はこれを欠点とは思わない。増えるのは百語ほどで、別の読み方はたいてい、まだ考えていなかった製品上の問いになっている。それが何と呼ばれるかを本当に知っているなら、必要なのは `/reframe` ではなく `/sharpen` だ。

二つ目。「リンクはすべて開く」という制約は守られていた。3 回の最終回答に引用されたリンクは 37 本、重複を除くと 35 本で、どれも実行中に開かれている。今あらためて 1 本ずつ要求しても、すべて 200 が返る。モデルは引用するよりずっと多くのページを開いていた。精密な説明の回は 35 の URL を開き、残したのは 12 本だけだ。Wikipedia のページも 7 つ開いたが、1 つも引用していない。PR #1324 で作者は、42 本の引用をすべて確認でき、捏造はなかったと報告している。[1] 今回の結果もそれと食い違わない。

## つまずいた点

**Claude Code はログインしないと skill を動かせない。** プラグインのインストール、更新、確認にはアカウントは要らない。ただしセッションを始めると `Not logged in` で止まる。skill の文章を見たいだけなら、`claude plugin details` とプラグインのキャッシュディレクトリで足りる。

**非対話の実行では終了コードが 1 になる。** 3 回の `/reframe` はどれも最後が `Error: Cancelled a request for input this run cannot answer: Web Search` で終わった。モデルが Web 検索を使おうとし、`opencode run` は端末なしでは権限の確認に答えられないからだ。モデルはその後 WebFetch と自作の取得スクリプトで確認を終えていて、回答は完全だった。スクリプトや CI で `/reframe` をまとめて回すなら、終了コードではなく出力の中身で成否を判断すること。

**リポジトリのチェックには依存パッケージが要る。** 入れないと、`validate-plugins.mjs` は `ajv` が見つからず、`differential.test.ts` は `fast-check` が見つからずに失敗する。CI は `npm install --no-save ajv ajv-formats fast-check@4.5.3` で入れている。[17] `package.json` のないディレクトリでは、このコマンドが `Tracker "idealTree" already exists` で失敗した。`{"private":true}` だけの一時的な `package.json` を置くと入った。

## Gemini 席：Carbon から Neon xhigh へ

パネルの変更は 2 段階だった。0.15.44 で席が `gemini-4-carbon-high` から `gemini-4-neon-high` に変わり、0.15.45 で `gemini-4-neon-xhigh` に上がった。上げた理由は PR #1284 にある。二つのレベルを目隠しで比べたところ、どちらも仕込んだ欠陥はすべて見つけ、`xhigh` は誰も仕込んでいない本物の問題をさらに見つけた。そのかわり 1 回あたり約 50% 長くかかった。PR はこう書いている。「パネルこそ pstack が深さにお金を払う場所だ」。[5]

既存ユーザーにとって厄介なのは、移行が勝手には起きないことだ。PR #1283 にはっきり書いてある。`# defaults: 3` の目印は変えていないので、`/poteto-mode` がこの変更のために `/setup-pstack` の再実行を促すことはない。保存したルールは、自分で再実行するまで Carbon のままだ。[4]

`setup-pstack` のステップ 2 に加わったルールはこうだ。パネルの役割（`arena runners`、`arena cross-judge pool`、`interrogate reviewers`）にある `gemini-4-neon-high`、あるいは Neon ではない `gemini-4-*` は旧既定値とみなし、`gemini-4-neon-xhigh` に置き換える。それ以外の Neon のレベルは本人の選択として扱う。パネル以外の役割にある Gemini エントリには触れない。[7]

<figure class="not-prose my-6"><svg viewBox="0 0 640 440" role="img" aria-label="setup-pstack 0.15.48 が古いルールの Gemini エントリをどう扱うか" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:640px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor" fill-opacity="0.6"/></marker></defs><rect x="150" y="16" width="280" height="36" rx="8" fill="#2563eb" fill-opacity="0.1"/><text x="290" y="39" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">保存済みルールの gemini-4-* エントリ</text><polyline points="290,52 290,76" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah)"/><rect x="20" y="76" width="380" height="52" rx="8" fill="#6b7280" fill-opacity="0.07" stroke="#6b7280" stroke-width="1.5"/><text x="210" y="98" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">パネルの役割か？</text><text x="210" y="117" font-size="10.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.8">arena runners · arena cross-judge pool · interrogate reviewers</text><polyline points="400,102 428,102" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah)"/><text x="404" y="95" font-size="11" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.7">いいえ</text><rect x="428" y="76" width="192" height="64" rx="8" fill="#6b7280" fill-opacity="0.05" stroke="#6b7280" stroke-width="1.5"/><text x="524" y="96" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">そのまま</text><text x="524" y="114" font-size="10.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.8" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">例：judgment and prose:</text><text x="524" y="130" font-size="10.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.8" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">gemini-4-carbon-high</text><polyline points="210,128 210,150" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah)"/><text x="218" y="144" font-size="11" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.7">はい</text><rect x="20" y="150" width="380" height="40" rx="8" fill="#6b7280" fill-opacity="0.07" stroke="#6b7280" stroke-width="1.5"/><text x="210" y="175" font-size="12.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">gemini-4-neon-high、または Neon 以外の gemini-4-* か？</text><polyline points="105,190 105,220" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah)"/><text x="113" y="210" font-size="11" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.7">はい</text><polyline points="315,190 315,220" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah)"/><text x="323" y="210" font-size="11" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.7">いいえ</text><rect x="20" y="220" width="180" height="54" rx="8" fill="#d97706" fill-opacity="0.1" stroke="#d97706" stroke-width="1.5"/><text x="110" y="242" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">旧既定値</text><text x="110" y="262" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">→ gemini-4-neon-xhigh</text><rect x="220" y="220" width="180" height="54" rx="8" fill="#2563eb" fill-opacity="0.08" stroke="#2563eb" stroke-width="1.5"/><text x="310" y="242" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">その他の Neon レベル</text><text x="310" y="262" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">ステップ 2：本人の選択</text><polyline points="110,274 110,300" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah)"/><polyline points="310,274 310,300" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah)"/><rect x="20" y="300" width="380" height="60" rx="8" fill="#2563eb" fill-opacity="0.1" stroke="#2563eb" stroke-width="1.5"/><text x="210" y="324" font-size="12.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">ステップ 3(b)：パネルの Neon は予算でレベルが決まる</text><text x="210" y="346" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">large → xhigh · medium → high · small → medium</text><polyline points="210,360 210,384" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah)"/><rect x="20" y="384" width="380" height="40" rx="8" fill="#2563eb" fill-opacity="0.12"/><text x="210" y="409" font-size="11.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">新しいルールを書く（# defaults: 3 は変わらず、再実行の催促なし）</text><rect x="428" y="168" width="192" height="192" rx="8" fill="#d97706" fill-opacity="0.1" stroke="#d97706" stroke-width="1.5"/><text x="440" y="192" font-size="11.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">実測：旧ルールの</text><text x="440" y="215" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="1">interrogate reviewers は</text><text x="440" y="238" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="1">gemini-4-neon-medium。</text><text x="440" y="261" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="1">large で再実行すると</text><text x="440" y="284" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="1">gemini-4-neon-xhigh に。</text><text x="440" y="307" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="1">低いレベルを残すなら低い</text><text x="440" y="330" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="1">予算か 3(c) で戻す。</text><polyline points="428,330 402,330" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" stroke-dasharray="4 4" marker-end="url(#ah)"/></svg></figure>

*図：`setup-pstack` 0.15.48 が古いルールの Gemini エントリを処理する流れ。右は今回の実測で見えた結果。ルールは `setup-pstack/SKILL.md` のステップ 2 とステップ 3(b) から。[7]*

入力には 0.15.43 形式のルールファイルを使い、4 種類の Gemini エントリを仕込んだ。`arena runners` の `gemini-4-carbon-high`、`arena cross-judge pool` の `gemini-4-neon-high`、`interrogate reviewers` で自分で選んだ `gemini-4-neon-medium`、そしてパネル以外の役割である `judgment and prose` の `gemini-4-carbon-high` だ。同じ無料モデルで、OpenCode から `/setup-pstack` を実行した。非対話なので、使えるモデルの一覧と答えをプロンプトに先に書いておいた。予算は `large`、そのまま受け入れる、ステップ 7 と 8 の任意の提案はどちらも断る。ルールファイルは一時的なホームディレクトリに置いた。

![setup-pstack の実行結果：パネルにある 3 つの Gemini エントリはすべて gemini-4-neon-xhigh になり、judgment and prose の gemini-4-carbon-high はそのまま残った](/assets/pstack-0-15-48-reframe-hands-on/setup-gemini-migration.webp)

*図：`/setup-pstack` の出力と、ルールファイルの変更前後の diff。*

結果は文章のルールどおりだった。パネルの 3 つは `gemini-4-neon-xhigh` になり、`judgment and prose` の Carbon も `bug-fix: inherit-parent` も変わらなかった。

1 行だけ詳しく見ておきたい。`gemini-4-neon-medium` だ。ステップ 2 によれば、これは本人の選択なので残る。ところがステップ 3(b) は、パネルにある Neon エントリのレベルを予算で決め直すと定めていて、`large` は `xhigh` を意味する。二つを続けて読むと、自分で選んだ `medium` は `large` 予算のもとでは必ず `xhigh` に戻る。モデルが書いた最終値は正しいが、この行を「古いパネル既定値を 3 つ置き換えた」に入れていて、理由づけは間違っている。結果に影響はない。分かるのは、ルールファイルを手で書き換えてもパネルの Gemini を低いレベルに留めておけない、ということだ。`medium` か `small` の予算を選ぶか、ステップ 3(c) の確認で変える。そして再実行のたびに変え直すことになる。

Claude Code のユーザーはこの節を読み飛ばしていい。Claude Code のアダプタは既定の `gemini-4-neon-xhigh` を `inherit-parent` に対応づけていて、この席は親セッションのモデルで動く。[8]

## /statechart が Windows で動くようになった

0.15.46 の修正は一つだけだが、その裏のバグは面白い。ネイティブ Windows では、`/statechart` がプロセスグループの kill と後片付けの 2 か所で `/bin/sh` を呼んでいたので、そもそも起動しなかった。もっと気づきにくいのは、Windows の TLC が改行に `\r\n` を使い、各メッセージを閉じる `@!@!@ENDMSG` の目印にも `\r` が付くことだ。読み取り側は `\n` でしか分割していなかったので目印の正規表現が合わず、後続のメッセージがすべて最初のメッセージの中に入れ子になった。その結果、ルールが破れている仕様は「TLC exited 12 ... but its output names no rule that broke」で止まり、すべてのルールが成り立つ仕様は、誤った理由を報告に載せたまま 0 で終わることがあった。[6]

修正は `\r?\n` で分割する `splitLines` を作り、TLC の出力を読む箇所すべてで使うことだ。プロセスグループの kill は `kill.ts` に移り、Windows では `taskkill /t /f` を使う。後片付けは `janitor.ts` になり、コマンド自身のランタイムで起動される。作者は macOS 上で本物の TLC に `\r\n` を出力させ、33 のコーパスケースが main の 8 件合格から 33 件合格になったことを確かめている。一方で、Windows では何も実行しておらず、Windows に関する主張はすべて推測だとも率直に書いている。

CI と同じチェックを Linux で走らせた。

![cursor/plugins 9e278fe でのリポジトリチェック：validate-plugins は合格、harness ツリーは最新、check-pstack-docs は問題 0、node --test はテスト 374 件のうち合格 304、失敗 0、スキップ 70](/assets/pstack-0-15-48-reframe-hands-on/repo-checks.webp)

*図：`cursor/plugins` の `9e278fe`（0.15.48 のマージコミット）で、リポジトリ付属のチェックとテストを実行した。*

テストは前回の 340 件から 374 件に増え、合格は 270 から 304 になった。失敗は 0。スキップされた 70 件は Java と TLC が必要で、このマシンには入っていない。`check-pstack-docs` は skill 59 個、コマンド 35 個を数え、35 個すべてがガイドに出てくる。`/reframe` はファイル 1 つが増えただけではない。README、`poteto-help` のルーティング表、ガイド第 2 章のすべてに載っている。

## X での反応

![Lauren Tan が X で /reframe を告知：you can only prompt what you can imagine](/assets/pstack-0-15-48-reframe-hands-on/x-poteto-reframe.webp)

*図：@poteto の投稿。2026-11-24、上海時間 08:50。[10]*

告知は一行だけだ。「you can only prompt what you can imagine」。そのうえで、欲しいものは分かっているのに伝えられないときのための skill で、`/sharpen` と組み合わせるとよく効く、と添えている。[10] 3 日前の v0.15.46 の更新告知は、skill の短縮と Gemini 4 Neon のパネル参加を伝えるもので、3,900 を超えるいいねが付いていた。[11]

![Lauren Tan の v0.15.46 更新告知：skill を大幅に短縮、Gemini 4 Neon をパネルのレビュアーに追加、Grok Bot と Cursor のユーザーは自動更新](/assets/pstack-0-15-48-reframe-hands-on/x-poteto-0-15-46.webp)

*図：@poteto の v0.15.46 の投稿。2026-11-21、上海時間 01:03。[11]*

リプライには、上の実測で答えられる質問が二つあった。一つは、`/reframe` は自分の分野の語彙にとどまるのか、隣接分野からも言葉を借りるのか、というもの。[12] 答えは両方で、隣接分野は固定のステップであり、3 回の実行はどれも 3 つ返した。もう一つは、`/reframe` と `/sharpen` のどちらを先に使うか。[13] ガイドの順番は `/reframe` が先で、書き直しをそのまま送るか、`/sharpen` にかける。[9] 使い始めて 1 週間ほどのユーザーは、`/sharpen` でプロンプトを詳しくしてから `/poteto-mode` に渡すと精度が上がるように感じる、と書いている。[14] 私は 3 つをつなげることを勧める。`/reframe` で「何と呼ぶか」を決め、`/sharpen` で「どこまで深くやるか」を決め、`/poteto-mode` に実行させる。

名前についての注意も一つ。3 月に、Claude Code 向けの別の `/reframe` スラッシュコマンドが公開されている。認知科学のリフレーミング手法を使うもので、pstack とは関係がない。[15] Claude Code では pstack 版は `/pstack:reframe` なのでぶつからないが、チュートリアルを探すときはどちらの話か確かめたほうがいい。

## 検証したこと、していないこと

実際に動かしたもの：

- Claude Code 2.1.278 で pstack を 0.15.43 から 0.15.48 に更新し、バージョン、59 個の skill、トークン見積もりを確認した。
- 0.15.43 と 0.15.48 の `pstack/` ツリーをファイルごとに比較した。`SKILL.md` 本文の合計は 26,346 語から 26,709 語になった。増えた 363 語のうち 202 語が `reframe`、102 語が `setup-pstack` の移行ルールだ。
- 0.15.48 の `reframe/SKILL.md` を使い、OpenCode 2.3.2 と無料モデルで 3 種類の説明に `/reframe` を 1 回ずつ実行し、最終回答の引用をすべて確かめた。
- 0.15.48 の `setup-pstack/SKILL.md` を使い、4 種類の Gemini エントリを含む古いルールファイルで `/setup-pstack` を 1 回実行した。
- `validate-plugins`、`generate-pstack-harness-trees --check`、`check-pstack-docs`、CI の `node --test`。

確かめていないもの：

- Claude Code や Cursor での本物の `/reframe` セッション。Claude Code はログインしておらず、このマシンに Cursor はない。
- pstack の既定である Opus 5.5 での `/reframe`。3 回とも無料の小さなモデルを使った。
- 対話的な `/setup-pstack`。予算と確認の答えはプロンプトに先に書き、モデル一覧も Task ツールから検出したのではなく貼り付けた。
- Windows 上の `/statechart` と、Java と TLC が要る 70 件のテスト。

私の結論は、更新する価値があり、`/reframe` は仕事の始め方に組み込む価値がある、だ。セッションあたり約 50 トークン、1 回の使用で約 270 トークンと安い。コードには一切触れず、欲しいものを正確に言えるようにするだけだが、それがタスクで一番難しい部分であることは多い。0.15.48 の候補ステップはほぼ毎回発動するものの、挙がる別の読み方はたいてい一度見ておく価値がある。ルールファイルを保存している人は、`/setup-pstack` を一度再実行し、どの Gemini エントリが Neon に置き換わったかを確かめておこう。

## 参考資料

1. cursor/plugins PR #1324, feat(pstack): add /reframe to learn the expert words for what you're building：<https://github.com/cursor/plugins/pull/1324>
2. cursor/plugins PR #1326, feat(pstack): have /reframe list the problems a vague description could be：<https://github.com/cursor/plugins/pull/1326>
3. pstack 0.15.48, `reframe/SKILL.md`：<https://github.com/cursor/plugins/blob/9e278fe4d4ecd8bfe98b1b79bf4be662efb338cc/pstack/skills/reframe/SKILL.md>
4. cursor/plugins PR #1283, chore(pstack): route the Gemini seat to Gemini 4 Neon：<https://github.com/cursor/plugins/pull/1283>
5. cursor/plugins PR #1284, chore(pstack): run the Gemini panel seat at gemini-4-neon-xhigh：<https://github.com/cursor/plugins/pull/1284>
6. cursor/plugins PR #1292, fix(pstack): run /statechart on native Windows and read TLC's \r\n line ends：<https://github.com/cursor/plugins/pull/1292>
7. pstack 0.15.48, `setup-pstack/SKILL.md`：<https://github.com/cursor/plugins/blob/9e278fe4d4ecd8bfe98b1b79bf4be662efb338cc/pstack/skills/setup-pstack/SKILL.md>
8. pstack 0.15.48, Claude Code アダプタ：<https://github.com/cursor/plugins/blob/9e278fe4d4ecd8bfe98b1b79bf4be662efb338cc/pstack/docs/harness/claude-code.md>
9. pstack 0.15.48, ガイド第 2 章 `02-poteto-mode.md`：<https://github.com/cursor/plugins/blob/9e278fe4d4ecd8bfe98b1b79bf4be662efb338cc/pstack/docs/guide/02-poteto-mode.md>
10. @poteto の X 投稿、/reframe の告知（2026-11-24）：<https://x.com/poteto/status/2125029185379008573>
11. @poteto の X 投稿、v0.15.46 の更新（2026-11-21）：<https://x.com/poteto/status/2123824683862855898>
12. @AnthonySunAI の X リプライ（2026-11-24）：<https://x.com/AnthonySunAI/status/2125035809854402936>
13. @RushabhShah の X リプライ（2026-11-24）：<https://x.com/RushabhShah/status/2125034855620645367>
14. @ddpi_dev の X 投稿（2026-11-23）：<https://x.com/ddpi_dev/status/2124668618067845409>
15. r/ClaudeAI、別物の /reframe スラッシュコマンド（2026-03）：<https://www.reddit.com/r/ClaudeAI/comments/1s51msf/made_a_reframe_slash_command_for_claude_code_that/>
16. OpenCode ドキュメント、Skills：<https://opencode.ai/docs/skills/>
17. cursor/plugins, `validate-plugins.yml`：<https://github.com/cursor/plugins/blob/9e278fe4d4ecd8bfe98b1b79bf4be662efb338cc/.github/workflows/validate-plugins.yml>
