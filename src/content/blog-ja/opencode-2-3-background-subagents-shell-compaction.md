---
title: "OpenCode 2.3 実地検証：サブエージェント、タイムアウトしたコマンド、コンテキスト圧縮がバックグラウンドへ"
description: "OpenCode 2.3.0 と 2.3.1 は 3 つの処理を既定でバックグラウンドに移した。サブエージェントの呼び出しはすぐ戻り、タイムアウトしたシェルコマンドは止まらずに走り続け、圧縮の要約はしきい値の手前で先に書かれる。Linux 上で 1.18.31 から 2.3.1 に上げ、無料モデルでこの 3 つと CLAUDE.md へのフォールバックを実際に動かし、Claude Code、Codex CLI、Gemini CLI、Qwen Code のやり方と比べた。"
author: Remy
pubDate: 2026-11-18T09:30:00+08:00
lang: ja
translatedFrom: opencode-2-3-background-subagents-shell-compaction
tags:
  - ai-agents
  - agent-harness
  - ai-coding
  - opencode
  - claude-code
series: agent-harness
---

**結論：** OpenCode 2.3.0（11 月 13 日）と 2.3.1（日本時間 11 月 18 日 9 時 17 分）で、これまで待たされていた 3 つの処理が既定でバックグラウンドに移った。サブエージェントの呼び出しはすぐ戻り、結果は子が idle になった時点で親に届く。タイムアウトに達したシェルコマンドは殺されずにバックグラウンドへ移り、終わったら報告が来る。自動圧縮のしきい値に近づくと要約は裏で先に書かれていて、しきい値では差し替えるだけになる。[1][2] ほとんどの環境では何も変えなくてよい。確認が必要なのは次のケースだ。

| 状況 | やること |
| --- | --- |
| `npm i -g opencode-ai` で入れた | このパッケージは 1.x 専用で、1.19.6 で止まっている。2.x は `@opencode/cli`。`npm i -g @opencode/cli` か `curl -fsSL https://opencode.ai/v2/install \| bash` で入れる。[3] |
| タイムアウトでコマンドを止めることに頼っている | タイムアウトはもう止めない。上限が必要ならコマンド側に `timeout 60 <cmd>` と書く。フォアグラウンドの `timeout: 0` は既定の 120 秒の意味になった。 |
| 設定に `experimental.background_compaction` か `shell_timeout_background` がある | 前者は削除。`compaction.background`（既定 `true`）を使う。後者のフラグもなくなったが、書いたままでも読み込める。 |
| 使われない要約にトークンを払いたくない | `opencode.jsonc` に `"compaction": { "background": false }` と書く。 |
| プロジェクトに `CLAUDE.md` しかない | 2.3.1 は再びこれを読む。不要なら `OPENCODE_DISABLE_CLAUDE_CODE=1` を設定する。 |

同じ 3 つの仕組みでも、他の harness の既定はかなり違う。

| | シェルのタイムアウト | サブエージェント | 自動圧縮 |
| --- | --- | --- | --- |
| OpenCode 2.3.1 | バックグラウンドへ移して通知 | 常にバックグラウンド、idle 時に報告 | 60k トークン手前で要約を先に書く |
| Claude Code 2.1.327 | バックグラウンドへ移す（`sleep` で始まるものは除く） | 既定でバックグラウンド | 上限に達してから圧縮、放置時の圧縮もある |
| Codex CLI 0.169.1 | セッション ID を返し、モデルがポーリング | 依頼されたら spawn、メインは結果を待つ | モデル既定のしきい値、`async_compaction` はオフ |
| Gemini CLI 0.68.0 | 出力なしで 300 秒たつと終了 | ツールとして呼び、戻るまで待つ | 50% で圧縮 |
| Qwen Code 0.28.0 | 120 秒で終了 | 既定でバックグラウンド、完了を通知 | 約 85% で圧縮 |

これは「Agent Harness 動向」の第 1 回で、OpenCode を軸に、同じ仕組みを他の harness がどう扱っているかも見ていく。OpenCode が前回このサイトに登場したのは Console への侵入事件のときだった（[英語版：After the OpenCode Breach](/blog/opencode-breach-coding-agent-credential-security/)）。

## 1.x と 2.x は別の npm パッケージになった

テスト機には `opencode-ai` パッケージで入れた 1.18.31 があった。このパッケージの `latest` は 1.19.6 で、`npm update` を何度やっても 2.x にはならない。OpenCode 2 は `@opencode/cli` として配布されている。v1 用のインストールスクリプトは 2.x の指定を拒否し、`https://opencode.ai/v2/install` か `opencode upgrade --major` を使うよう案内する。[3]

![opencode-ai 1.18.31 から @opencode/cli 2.3.1 への切り替え。opencode-ai は 1.19.6 止まりで、新パッケージでは opencode v2.3.1 と表示され、バイナリのハッシュは GitHub release の同名ファイルと一致する](/assets/opencode-2-3-background-subagents-shell-compaction/install.webp)

先に `opencode-ai` をアンインストールする。両方のパッケージが `opencode` というコマンド名を使うからだ。npm はインストールスクリプトが実行されなかったと警告するが、実害はない。入ったバイナリは release の `opencode-linux-x64.tar.gz` から取り出したものとハッシュが一致した。2.x は既定でバックグラウンドサービスを起動し、CLI はそれを通じて動く。`opencode run --standalone` は実行ごとに専用サーバーを立てて、終わると止める。この違いは後の圧縮テストで効いてくる。

テストはすべて専用の `XDG_*` ディレクトリで行い、有料アカウントはつながず、OpenCode Zen に並ぶ無料モデルを使った。

<figure class="not-prose my-6"><svg viewBox="0 0 640 342" role="img" aria-label="2.3.1 でバックグラウンドに移った 3 つの処理（テスト機での実測）" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:640px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><defs><marker id="ah-timeline" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor" fill-opacity="0.6"/></marker></defs><text x="10" y="24" font-size="15.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">2.3.1 でバックグラウンドに移った 3 つの処理（テスト機での実測）</text><line x1="120" y1="46" x2="620" y2="46" stroke="currentColor" stroke-opacity="0.35" stroke-width="1.5"/><line x1="120.0" y1="42" x2="120.0" y2="50" stroke="currentColor" stroke-opacity="0.35" stroke-width="1.5"/><text x="120.0" y="38" font-size="10.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.6">0 秒</text><line x1="233.63636363636363" y1="42" x2="233.63636363636363" y2="50" stroke="currentColor" stroke-opacity="0.35" stroke-width="1.5"/><text x="233.63636363636363" y="38" font-size="10.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.6">5 秒</text><line x1="347.27272727272725" y1="42" x2="347.27272727272725" y2="50" stroke="currentColor" stroke-opacity="0.35" stroke-width="1.5"/><text x="347.27272727272725" y="38" font-size="10.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.6">10 秒</text><line x1="460.90909090909093" y1="42" x2="460.90909090909093" y2="50" stroke="currentColor" stroke-opacity="0.35" stroke-width="1.5"/><text x="460.90909090909093" y="38" font-size="10.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.6">15 秒</text><line x1="574.5454545454545" y1="42" x2="574.5454545454545" y2="50" stroke="currentColor" stroke-opacity="0.35" stroke-width="1.5"/><text x="574.5454545454545" y="38" font-size="10.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.6">20 秒</text><text x="10" y="92" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">サブエージェント</text><rect x="120.0" y="62" width="500.0" height="22" rx="5" fill="#3b82f6" fill-opacity="0.16"/><text x="126.0" y="77" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">親：task はすぐ戻り、09:04:55 に parent.txt を書く</text><rect x="120.0" y="90" width="340.90909090909093" height="22" rx="5" fill="#10b981" fill-opacity="0.22"/><text x="126.0" y="105" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">子：sleep 15 の後に sub.txt を書く（09:05:10）</text><line x1="460.90909090909093" y1="90" x2="460.90909090909093" y2="84" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.5" marker-end="url(#ah-timeline)"/><text x="454.90909090909093" y="126" font-size="11" text-anchor="end" font-weight="normal" fill="currentColor" fill-opacity="0.75">子が idle になると報告が親に届く</text><text x="10" y="176" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">シェルのタイムアウト</text><rect x="120.0" y="146" width="113.63636363636363" height="22" rx="5" fill="#3b82f6" fill-opacity="0.22"/><text x="124.0" y="161" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">フォアグラウンド、timeout 5 秒</text><line x1="233.63636363636363" y1="168" x2="233.63636363636363" y2="174" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.5" marker-end="url(#ah-timeline)"/><rect x="233.63636363636363" y="174" width="340.9090909090909" height="22" rx="5" fill="#10b981" fill-opacity="0.22"/><text x="239.63636363636363" y="189" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">バックグラウンドへ移って実行継続、出力はファイルへ</text><line x1="574.5454545454545" y1="174" x2="574.5454545454545" y2="148" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.5" marker-end="url(#ah-timeline)"/><text x="239.63636363636363" y="212" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">&lt;shell state=completed&gt; がセッションを起こす</text><text x="10" y="266" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">自動圧縮</text><line x1="256.3636363636364" y1="228" x2="256.3636363636364" y2="306" stroke="currentColor" stroke-opacity="0.5" stroke-width="1.5" stroke-dasharray="3 3"/><text x="256.3636363636364" y="225" font-size="10.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.6" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">threshold</text><text x="10" y="282" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.6">（上の時間軸とは別）</text><rect x="120.0" y="234" width="134.36363636363637" height="20" rx="5" fill="#10b981" stroke="#10b981" stroke-opacity="0.9" stroke-dasharray="4 3" fill-opacity="0.18"/><text x="126.0" y="248" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">裏で要約を作成</text><text x="264.3636363636364" y="248" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">background 既定オン：要約は先に書き終わっている</text><text x="264.3636363636364" y="263" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">圧縮から 0.03 秒で回答開始</text><rect x="256.3636363636364" y="276" width="120.45454545454544" height="20" rx="5" fill="#f59e0b" fill-opacity="0.28"/><text x="260.3636363636364" y="290" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">5.3 秒待ち</text><text x="384.8181818181818" y="290" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">background: false：しきい値で要約を書く</text><text x="10" y="330" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.7">時刻は本文の 3 回の opencode run から。圧縮の 2 行は同じ入力を 2 つの設定で流した比較。</text></svg></figure>

*図：テスト機で計った 3 つのバックグラウンド化。サブエージェントとシェルの行は上の時間軸に沿う。圧縮の 2 行は同じ入力を 2 つの設定で流した比較。*

## サブエージェント：呼び出しはすぐ戻り、結果は後から届く

2.3.0 より前は、親セッションはサブエージェントが終わるまで待っていた。今は `subagent` ツールがすぐにセッション ID を返し、子は裏で作業を続ける。子が idle になるたびに親へ `<subagent>` メッセージが届き、その後に子がもう一巡すれば再び届く。[1] ツールがモデルに返す文面ははっきりしている。sleep しない、ポーリングしない、子の仕事を重複させない。重ならない作業をするか、何を起動したかをユーザーに伝えてターンを終える。

![glm-5.3-flash-free が general サブエージェントを起動。task ツールはすぐセッション ID を返し、親は 09:04:55 に parent.txt を書き、子は 15 秒 sleep した後 09:05:10 に sub.txt を書いて報告する](/assets/opencode-2-3-background-subagents-shell-compaction/background-subagent.webp)

テストでは子に `sleep 15` の後でタイムスタンプを書かせ、親にはツールが戻った直後に別のタイムスタンプを書かせた。`parent.txt` は 09:04:55、`sub.txt` は 09:05:10 で、差はちょうど sleep 1 回分になる。親のターンが終わっても `opencode run` は終了せず、`waiting for 1 background job` と表示して、報告が届いたところでターンを再開した。スクリプトや CI から `opencode run` を呼んでも、子が走っている途中の半端な答えを受け取ることはない。

子が自分でもバックグラウンド処理を始めることがある。たとえば長いコマンドがバックグラウンドに移り、子自身は先に idle になる場合だ。2.3.0 からは、このときの報告に「still running」と付くので、親は途中の答えを結論と取り違えずに最終報告を待つ。[1] 2.3.1 では関連するバグも直った。子の回答が「Background work still running」という見出しを引用していると、実行中と誤判定されていた。[2]

利点は、親がただ待たなくなり、互いに関係のない子を同時に複数走らせられることだ。代償は 2 つある。並行で動くぶん、複数のコンテキストが同時にトークンを使う。そしてモデルには「投げたら手を離す」振る舞いが求められる。プロンプトに「サブエージェントが終わってから……」と書いてあっても動くが、待つのはランタイムの仕事で、モデルが sleep して待つものではない。サブエージェントの権限確認は、そのセッションを開いているときに表示されるようになった。1 件を拒否しても、拒否されるのは同じステップの他の要求だけで、セッション全体の保留中の要求までは拒否されない。[2]

## シェルのタイムアウト：止めずにバックグラウンドで続ける

2.3.1 でいちばん実用的な変更がこれだ。タイムアウトに達してもまだ動いているシェルコマンドは、すべてのビルドでバックグラウンドに移る。出力はファイルに書かれ続け、コマンドが終わるとセッションが起きて結果を受け取る。2.3.0 では実験フラグ `shell_timeout_background` の裏にあった機能で、2.3.1 で既定になりフラグは削除された。フラグを書いたままの設定もそのまま読み込める。[1][2]

![deepseek-v4.1-flash-free が 5000 ミリ秒のタイムアウトで sleep 20 を実行。ツールの結果は Command moved to the background で、シェル ID、PID、出力ファイルのパスが付く。20 秒後に state=completed の報告が届き、done.txt もできている](/assets/opencode-2-3-background-subagents-shell-compaction/shell-timeout-background.webp)

テストのコマンドは `date +%T; sleep 20; date +%T; echo SLEEP-DONE > done.txt`、タイムアウトは 5 秒。5 秒の時点でツールは「Command moved to the background」を返し、シェル ID、PID、出力先のパスと、同じコマンドをもう 1 つ起動するなという注意を添えた。20 秒後にセッションは `<shell id=... state="completed">` を受け取り、中には 09:04:07 と 09:04:27 の 2 つの時刻が入っていた。`done.txt` も書かれていた。

タイムアウトまわりでは、ほかに 2 つ変わった。

- フォアグラウンドの `timeout: 0` は以前「終わるまで待つ」だったが、今は既定の 120 秒を意味し、時間が来ればバックグラウンドに移る。
- プロセスデーモンが後始末をするようになった。終わったコマンドが `opencode-pty` の下にゾンビプロセスを残すことはない。成功したコマンドが `cmd &` で起動したプロセスは残り、失敗したコマンドの残りは止められる。[2]

この既定は正しいと思う。ビルドやテストがタイムアウトで殺されると、モデルはたいてい引数を変えてもう一度走らせ、数分を余計に使う。バックグラウンドに移せば、コマンドは 1 回で走りきり、結果もきちんと届く。

ただし副作用は覚えておきたい。タイムアウトはもう「停止」を意味しない。データベースのマイグレーション、外部へのリクエスト、共有ディレクトリへの書き込みは、以前ならタイムアウトで止まったが、今は最後まで走る。タイムアウトを安全装置として使っていたなら、コマンドに明示的な `timeout` を入れるか、権限ルールで止める。

## バックグラウンド圧縮：要約は必要になる前にできている

圧縮そのものは変わっていない。モデルのコンテキスト上限に近づくと、OpenCode は会話全体を要約し、直近の約 15k トークンはそのまま残して、古い部分と差し替える。[4] 変わったのは、要約をいつ書くかだ。

以前はしきい値に達してから書いていたので、その数秒間は次のプロンプトが待たされた。2.3.1 は既定で、しきい値の 60k トークン手前から裏で要約を書き始める。書き終えた要約はメモリに置いたまま、セッションは普段どおり進む。しきい値に達すると要約に差し替え、要約より後の内容はそのまま残す。[2][4]

<figure class="not-prose my-6"><svg viewBox="0 0 640 366" role="img" aria-label="バックグラウンド圧縮がコンテキストのどこで動くか" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:640px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><defs><marker id="ah-compaction" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor" fill-opacity="0.6"/></marker></defs><text x="10" y="24" font-size="15.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">バックグラウンド圧縮がコンテキストのどこで動くか</text><text x="20" y="56" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">モデルのコンテキストウィンドウ (128k)</text><rect x="20" y="64" width="600" height="34" rx="5" fill="#64748b" fill-opacity="0.1"/><rect x="20" y="64" width="228.75" height="34" rx="5" fill="#3b82f6" fill-opacity="0.2"/><rect x="248.75" y="64" width="281.25" height="34" rx="5" fill="#10b981" fill-opacity="0.22"/><rect x="530.0" y="64" width="90.0" height="34" rx="5" fill="#f59e0b" fill-opacity="0.25"/><text x="132.5" y="86" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.95" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">0 – 48.8k</text><text x="389.375" y="86" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.95" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">60k</text><text x="575.0" y="86" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.95" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">buffer</text><line x1="248.75" y1="98" x2="248.75" y2="116" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5"/><text x="248.75" y="130" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.95">しきい値の 60k 手前で要約を書き始める</text><line x1="530.0" y1="98" x2="530.0" y2="146" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5"/><text x="530.0" y="160" font-size="11.5" text-anchor="end" font-weight="normal" fill="currentColor" fill-opacity="0.95">しきい値 = ウィンドウ − buffer</text><text x="620" y="176" font-size="11" text-anchor="end" font-weight="normal" fill="currentColor" fill-opacity="0.7">buffer：既定 15%、最低 16k</text><rect x="20" y="196" width="6" height="20" rx="2" fill="#10b981" fill-opacity="0.9"/><text x="34" y="210" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">書き終えた要約はメモリに保持し、セッションはそのまま進む</text><rect x="20" y="224" width="6" height="20" rx="2" fill="#3b82f6" fill-opacity="0.9"/><text x="34" y="238" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">しきい値で要約に差し替え、直近約 15k トークンはそのまま残す</text><rect x="20" y="252" width="6" height="20" rx="2" fill="#f59e0b" fill-opacity="0.9"/><text x="34" y="266" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">要約後にしきい値の約 40% を超えて伸びた、または先頭が変わった → 通常の圧縮</text><rect x="20" y="280" width="6" height="20" rx="2" fill="#64748b" fill-opacity="0.9"/><text x="34" y="294" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">小さいウィンドウ：開始は「前回圧縮後の最初の応答」としきい値の中間より早くならない</text><rect x="20" y="308" width="6" height="20" rx="2" fill="#ef4444" fill-opacity="0.9"/><text x="34" y="322" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">再起動でメモリ上の要約は消える。使われなかった要約にも課金される</text><text x="20" y="354" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.7">例：128k ウィンドウ、buffer 19.2k → 約 108.8k で圧縮、約 48.8k から書き始める</text></svg></figure>

*図：バックグラウンド圧縮の開始位置とフォールバック条件。しきい値はウィンドウから buffer を引いた値で、buffer の既定はウィンドウの 15%、最低 16k。OpenCode ドキュメントの Compaction ページによる。[4]*

ドキュメントには境界条件がはっきり書かれている。[4]

- 要約の後で会話がしきい値の約 40% を超えて伸びた場合や、会話の先頭が変わった場合は、保持していた要約を捨てて通常の圧縮に戻る。
- ウィンドウが小さいモデルでは、開始点は「前回の圧縮後の最初の応答」としきい値の中間より早くならない。
- 要約はメモリにだけあり、再起動で消える。プロバイダー側の native 圧縮ではこの経路を使わない。
- モデルを切り替えた直後や、prompt cache の有効期限を超えて間が空いた後は、次の応答から数え直す。
- 要約のリクエストは prompt cache を再利用するが、使われなかった要約にも課金される。しきい値に届く前にセッションが終われば、そのトークンは無駄になる。

最新の動向は[OpenCode 2.3.2 実地検証：GPT-6.2 は instructions をキャッシュしないので、system prompt は先頭の developer メッセージへ](/ja/blog/opencode-2-3-2-gpt-6-2-prompt-cache-prefix/)を参照。GPT-6.2 では、2.3.1 以前の system prompt はキャッシュに入らない。2.3.2 に上げてほしい。

数ターンで圧縮まで届かせるため、テストではプロジェクト設定で `mimo-v2.6-flash-free` のコンテキストウィンドウを 48000 にした。buffer は最低値の 16k になり、しきい値は約 32k になる。1 ターン目でリリースノートを 1 つ添付し、2 ターン目でさらに 3 ファイルを添付して約 23k まで増やした。40 秒置いて 3 ターン目に約 11k トークンの JSON を添付し、しきい値を越えた。同じ 3 ターンを、`"compaction": { "background": false }` を加えた別のディレクトリでもう一度流した。どちらもバックグラウンドサービス上で動かした。`--standalone` だと終了のたびにメモリ上の要約が消えるからだ。

![2 つのセッションのメッセージ時系列。既定の設定では compaction レコードの 0.03 秒後にアシスタントが回答を始め、background を false にすると compaction レコードから 5.3 秒後に始まる](/assets/opencode-2-3-background-subagents-shell-compaction/background-compaction.webp)

時系列はセッションのデータベースから取り出した。既定の設定では、3 つ目のプロンプトから 0.02 秒後に `compaction` レコード（`reason=auto`、`status=completed`）が現れ、さらに 0.03 秒後にアシスタントが回答を始めた。要約はとっくにできていたということだ。バックグラウンド圧縮を切ると、`compaction` レコードからアシスタントの開始まで 5.3 秒かかった。この 5.3 秒がその場で要約を書いた時間になる。

コンテキストが長いほど要約には時間がかかり、待たずに済む時間も増える。代わりに要約のリクエストが 1 回余分にかかる。セッションがたいてい短い人や、トークンを細かく管理したい人は、切ってしまってもよい。

## CLAUDE.md が再び読まれるようになった

2.3.1 は Claude Code のファイル規約との互換性を戻した。`AGENTS.md` がなく `CLAUDE.md` があるディレクトリでは `CLAUDE.md` を読む。グローバルの `~/.config/opencode/AGENTS.md` がなければ `~/.claude/CLAUDE.md` にフォールバックする。エージェントが入れ子のディレクトリのファイルを読んだときに見つかる指示にも、同じ規則が当てはまる。`OPENCODE_DISABLE_CLAUDE_CODE` か `OPENCODE_DISABLE_CLAUDE_CODE_PROMPT` を設定すると、どの `CLAUDE.md` も読まなくなる。[2][5]

![4 つのディレクトリでのテスト。CLAUDE.md だけなら PELICAN-CLAUDE-MD、OPENCODE_DISABLE_CLAUDE_CODE=1 なら NONE、AGENTS.md と CLAUDE.md の両方があれば HERON-AGENTS-MD、プロジェクトの指示ファイルがなく HOME に .claude/CLAUDE.md があれば GLOBAL-CLAUDE-HOME。セッション DB の指示記録も回答と一致する](/assets/opencode-2-3-background-subagents-shell-compaction/claude-md-fallback.webp)

指示ファイルごとに別の合言葉を入れ、ツールを使わずに指示だけから答えさせた。4 つの回答はどれも規則どおりだった。ただ、回答だけでは証拠として弱い。モデルが自分でファイルを読みにいくこともあるからだ。そこでスクリーンショットの最後のコマンドで、各セッションに実際に注入された指示ファイルをセッション DB から一覧にした。結果は回答と一対一で対応し、環境変数を設定したセッションには指示ファイルが 1 つも入っていなかった。

Claude Code から移ってくるチームにとっては、OpenCode のためだけに `AGENTS.md` を複製しなくてよくなる。ただし両方があるときに読まれるのは `AGENTS.md` だけで、2 つは統合されない。

## そのほかの変更

- **TUI の既定表示が静かになった。** 2.3.0 から、ツール呼び出しと思考の連続が 1 行のアクティビティ行にまとまる。各ステップを見たいときは設定で **Verbosity** を `medium` か `high` にするか、TUI の設定で `session.verbosity` を指定する。すでに設定していた値はそのまま使われる。[1]
- **schedules は automations に改名された。** 実験的な API は `/api/experimental/automation` と `client.experimental.automation.*` になり、schedule 系は削除された。[2]
- **ChatGPT でサインインすると GPT 6.2 Sol と GPT 6.2 Astra** と、それぞれの fast 版が使える。[2]
- **`read` は小さなファイルでも既定の行数とバイト数でページ分割する。** `limit: 0` はエラーになる。[2]

## 他の harness は同じ 3 つをどう扱っているか

<figure class="not-prose my-6"><svg viewBox="0 0 640 342" role="img" aria-label="同じ 3 つの仕組み、5 つの harness の既定動作" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:640px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><defs><marker id="ah-matrix" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor" fill-opacity="0.6"/></marker></defs><text x="10" y="24" font-size="15.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">同じ 3 つの仕組み、5 つの harness の既定動作</text><text x="226.0" y="54" font-size="12.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="0.85">シェルのタイムアウト</text><text x="388.0" y="54" font-size="12.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="0.85">サブエージェント</text><text x="550.0" y="54" font-size="12.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="0.85">自動圧縮</text><text x="10" y="92" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">OpenCode 2.3.1</text><rect x="146" y="66" width="160" height="44" rx="5" fill="#10b981" fill-opacity="0.18"/><rect x="146" y="66" width="5" height="44" rx="2" fill="#10b981" fill-opacity="0.9"/><text x="158" y="84" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="1">バックグラウンドへ移す</text><text x="158" y="101" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">既定 120 秒</text><rect x="308" y="66" width="160" height="44" rx="5" fill="#10b981" fill-opacity="0.18"/><rect x="308" y="66" width="5" height="44" rx="2" fill="#10b981" fill-opacity="0.9"/><text x="320" y="84" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="1">常にバックグラウンド</text><text x="320" y="101" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">idle 時に報告</text><rect x="470" y="66" width="160" height="44" rx="5" fill="#10b981" fill-opacity="0.18"/><rect x="470" y="66" width="5" height="44" rx="2" fill="#10b981" fill-opacity="0.9"/><text x="482" y="84" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="1">60k 手前で要約を先に</text><text x="482" y="101" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">しきい値で差し替え</text><text x="10" y="138" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">Claude Code 2.1.327</text><rect x="146" y="112" width="160" height="44" rx="5" fill="#10b981" fill-opacity="0.18"/><rect x="146" y="112" width="5" height="44" rx="2" fill="#10b981" fill-opacity="0.9"/><text x="158" y="130" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="1">バックグラウンドへ移す</text><text x="158" y="147" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">sleep で始まるものは除く</text><rect x="308" y="112" width="160" height="44" rx="5" fill="#10b981" fill-opacity="0.18"/><rect x="308" y="112" width="5" height="44" rx="2" fill="#10b981" fill-opacity="0.9"/><text x="320" y="130" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="1">既定でバックグラウンド</text><text x="320" y="147" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">fork mode、オフ可</text><rect x="470" y="112" width="160" height="44" rx="5" fill="#f59e0b" fill-opacity="0.18"/><rect x="470" y="112" width="5" height="44" rx="2" fill="#f59e0b" fill-opacity="0.9"/><text x="482" y="130" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="1">上限に達してから圧縮</text><text x="482" y="147" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">放置 1 時間で事前圧縮</text><text x="10" y="184" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">Codex CLI 0.169.1</text><rect x="146" y="158" width="160" height="44" rx="5" fill="#f59e0b" fill-opacity="0.18"/><rect x="146" y="158" width="5" height="44" rx="2" fill="#f59e0b" fill-opacity="0.9"/><text x="158" y="176" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="1">セッション ID を返す</text><text x="158" y="193" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">write_stdin でポーリング</text><rect x="308" y="158" width="160" height="44" rx="5" fill="#f59e0b" fill-opacity="0.18"/><rect x="308" y="158" width="5" height="44" rx="2" fill="#f59e0b" fill-opacity="0.9"/><text x="320" y="176" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="1">依頼時に spawn</text><text x="320" y="193" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">メインが結果を待つ</text><rect x="470" y="158" width="160" height="44" rx="5" fill="#64748b" fill-opacity="0.18"/><rect x="470" y="158" width="5" height="44" rx="2" fill="#64748b" fill-opacity="0.9"/><text x="482" y="176" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="1">モデル既定のしきい値</text><text x="482" y="193" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">async_compaction はオフ</text><text x="10" y="230" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">Gemini CLI 0.68.0</text><rect x="146" y="204" width="160" height="44" rx="5" fill="#64748b" fill-opacity="0.18"/><rect x="146" y="204" width="5" height="44" rx="2" fill="#64748b" fill-opacity="0.9"/><text x="158" y="222" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="1">出力なし 300 秒で終了</text><text x="158" y="239" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">is_background で分離</text><rect x="308" y="204" width="160" height="44" rx="5" fill="#64748b" fill-opacity="0.18"/><rect x="308" y="204" width="5" height="44" rx="2" fill="#64748b" fill-opacity="0.9"/><text x="320" y="222" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="1">ツール呼び出し扱い</text><text x="320" y="239" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">戻るまで待つ</text><rect x="470" y="204" width="160" height="44" rx="5" fill="#64748b" fill-opacity="0.18"/><rect x="470" y="204" width="5" height="44" rx="2" fill="#64748b" fill-opacity="0.9"/><text x="482" y="222" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="1">50% で圧縮</text><text x="482" y="239" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">その場で実行</text><text x="10" y="276" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">Qwen Code 0.28.0</text><rect x="146" y="250" width="160" height="44" rx="5" fill="#64748b" fill-opacity="0.18"/><rect x="146" y="250" width="5" height="44" rx="2" fill="#64748b" fill-opacity="0.9"/><text x="158" y="268" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="1">120 秒で終了</text><text x="158" y="285" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">is_background で分離</text><rect x="308" y="250" width="160" height="44" rx="5" fill="#10b981" fill-opacity="0.18"/><rect x="308" y="250" width="5" height="44" rx="2" fill="#10b981" fill-opacity="0.9"/><text x="320" y="268" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="1">既定でバックグラウンド</text><text x="320" y="285" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">完了を通知</text><rect x="470" y="250" width="160" height="44" rx="5" fill="#64748b" fill-opacity="0.18"/><rect x="470" y="250" width="5" height="44" rx="2" fill="#64748b" fill-opacity="0.9"/><text x="482" y="268" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="1">約 85% で圧縮</text><text x="482" y="285" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">その場で実行</text><rect x="10" y="298" width="12" height="12" rx="2" fill="#10b981" fill-opacity="0.7"/><text x="28" y="308" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.8">既定でバックグラウンド、完了を通知</text><rect x="237" y="298" width="12" height="12" rx="2" fill="#f59e0b" fill-opacity="0.7"/><text x="255" y="308" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.8">一部バックグラウンド／ポーリング</text><rect x="453" y="298" width="12" height="12" rx="2" fill="#64748b" fill-opacity="0.7"/><text x="471" y="308" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.8">待つ・終了させる・その場で圧縮</text><text x="10" y="330" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.65">各プロジェクトの公式ドキュメント、リリースノート、インストールしたパッケージの既定値による。出典は末尾。</text></svg></figure>

*図：5 つの harness の 3 つの仕組みでの既定動作。緑は既定でバックグラウンドかつ完了を通知、黄は一部だけバックグラウンドかポーリング、灰は待つ、コマンドを終了させる、またはその場で圧縮する。*

**Claude Code 2.1.327** は OpenCode にいちばん近い。フォアグラウンドの Bash コマンドは既定 2 分でタイムアウトし、そこでバックグラウンドに移る。例外は `sleep` で始まるコマンドだ。移ったコマンドは、対話セッションなら時間制限がない。`-p` のような無人セッションでは移った時点から 30 分（テキストのプロンプトを渡す `-p` では 10 分）が上限になる。[6] メインの会話から起動したサブエージェントは既定でバックグラウンドで動く。結果を待たせたいときは `CLAUDE_CODE_FORK_SUBAGENT` を `0` にする。[7] いちばん違うのは圧縮だ。ウィンドウを指定しなければ、Claude Code はコンテキスト上限に達してから圧縮する（ネイティブで 1M ウィンドウのモデルでは約 967K）。そのうえで「放置時の圧縮」がある。20 万トークンを超えた会話を 1 時間ほど放っておくと、prompt cache が切れる前に圧縮し、次のメッセージでは要約だけを送る。[8][9] どちらも待ち時間を隠そうとしているが、OpenCode はしきい値の直前を、Claude Code はユーザーが離れている時間を選んだ。`CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1` でこうしたバックグラウンド動作はまとめて止まり、タイムアウトしたコマンドも再び停止されるようになる。[10]

**Codex CLI 0.169.1** は別の道をとる。既定で有効な unified exec では、短い待ち時間を過ぎても終わらないコマンドは、セッション ID とそこまでの出力を先に返し、プロセスは動き続ける。モデルはその後 `write_stdin` で出力を取りにいき、空のポーリングは最長 5 分待つ（`background_terminal_max_timeout`）。[11] 通知ではなくポーリングの方式だ。サブエージェントは、ユーザーが頼んだときか、プロジェクトや skill の指示が求めたときに spawn される。ドキュメントによれば、複数のエージェントが動いていると Codex はすべての結果がそろうまで待ってからまとめて答える。[12] 自動圧縮は `model_auto_compact_token_limit` で決まり、未設定ならモデルの既定値になる。[11] テスト機の `codex features list` では `async_compaction` と `wake_on_agent_messages` がどちらも under development でオフになっていて、changelog には「Add a root-only option for background compaction」のような項目がある。[13] Codex もバックグラウンド圧縮とエージェントからの起床を作っている最中で、まだ既定ではオンになっていない。

**Gemini CLI 0.68.0** はいちばん保守的だ。コマンドをバックグラウンドで走らせるには、モデルがシェルツールを呼ぶときに `is_background: true` を付ける必要がある。フォアグラウンドのコマンドは 300 秒出力がないと終了させられる（`tools.shell.inactivityTimeout`）。[14] サブエージェントは同じ名前のツールとしてメインのエージェントに見え、呼び出しはサブエージェントが報告を返すまで戻らない。[15] 圧縮はコンテキストの 50% で始まり（`model.compressionThreshold`）、他よりずっと早く、その場で実行される。[16]

**Qwen Code 0.28.0** は Gemini CLI からのフォークで、今は半分が Gemini 風、半分が Claude Code 風になっている。シェルは Gemini と同じで、バックグラウンドには明示的な `is_background: true` が必要、フォアグラウンドのコマンドは既定 120 秒で終了する。この値は `tools.shell.defaultTimeoutMs` で変えられる。[17][18] サブエージェントは Claude Code と同じで、トップレベルのサブエージェントは既定でバックグラウンドで動き、結果を通知としてメインのセッションに送る。`agents.defaultBackground: false` でフォアグラウンドに戻せる。[19] 自動圧縮はウィンドウの約 85% を目安にし、小さなウィンドウでは要約の余地を残すためにもっと早く始まる。[18]

![ローカルにインストールした Claude Code 2.1.327、Codex CLI 0.169.1、Gemini CLI 0.68.0、Qwen Code 0.28.0。claude --help の --autocompact、codex features list で async_compaction と wake_on_agent_messages が false、Gemini パッケージの圧縮しきい値 0.5 とシェルの無出力タイムアウト 300 秒、Qwen パッケージの DEFAULT_PCT 0.85 と AUTOCOMPACT_BUFFER 13000](/assets/opencode-2-3-background-subagents-shell-compaction/harness-local-checks.webp)

並べてみると方向ははっきりしている。サブエージェントを既定でバックグラウンドにするのは、OpenCode、Claude Code、Qwen Code で共通になった。タイムアウトしたコマンドをバックグラウンドに移すのは OpenCode と Claude Code で、Gemini CLI と Qwen Code はまだ終了させる。要約を先に書くのを既定にしているのは OpenCode だけで、Codex はフラグを用意しつつオフのままだ。残る違いは、バックグラウンドの結果がどう戻ってくるかにある。OpenCode、Claude Code、Qwen Code は通知でセッションを起こし、Codex はモデルにポーリングさせる。通知はトークンを節約し、モデルが sleep を繰り返す空回りもなくすが、ターンが終わった後のセッションをランタイムが起こせなければならない。2.3.1 で直った「バックグラウンドのシェルが元のターン終了後に起こしたターンを ACP クライアントが取りこぼす」問題は、まさにこの種類のものだ。[2]

## バックグラウンド化で難しくなること

3 つの変更はどれも待ち時間を視界から消す。その一方で、新しい問題も持ち込む。

まずコストが読みにくくなる。並行して動くサブエージェントも、先に書く要約も、直接頼んだわけではないトークン消費だ。従量課金なら 1、2 週間は `opencode stats` を見ておきたい。自分の数字で計算できるコストモデルは [When Claude Haiku 5.5 Actually Saves Money as a Subagent or Compaction Engine（英語）](/blog/claude-haiku-5-5-subagent-compaction-cost-model/) にある。組織でこうした既定値をどう管理するかは [Control the Harness, Control the Cost（英語）](/blog/control-the-harness-control-the-cost/) を参照してほしい。

次に副作用を抑えにくくなる。タイムアウトはもうコマンドを止めず、バックグラウンドのコマンドやサブエージェントは「このターンは終わった」と思った後もファイルを書き換えたりリクエストを送ったりできる。監査では会話の記録だけでなく、バックグラウンドのタスク一覧と出力ファイルも見る必要がある。

最後にデバッグが難しくなる。1 つの回答が、サブエージェントの報告、バックグラウンドのシェルの完了通知、先に書かれた要約という、届いた時刻の違う 3 つの結果に依存することがある。問題が起きたら、まず順序を確かめる。セッション DB の `session_message` テーブルには各メッセージの種類と時刻が残っていて、本文の時系列もそこから取っている。harness の基本的なループ構造については [エージェント・ハーネス・パターン](/ja/blog/inside-claude-code-agent-harness/) も参考になる。

## 試したこと、試していないこと

実際に動かしたもの（OpenCode 2.3.1、Linux x64、無料モデル、隔離した `XDG_*` ディレクトリ）：

- `opencode-ai` 1.18.31 から `@opencode/cli` 2.3.1 への切り替え。ハッシュは GitHub release と一致。
- バックグラウンドのサブエージェント。呼び出しはすぐ戻り、親が先にタイムスタンプを書き、子の報告は 15 秒後に届いた。
- シェルのタイムアウト。タイムアウト 5 秒で 20 秒のコマンドがバックグラウンドに移り、完了時に報告が来た。
- バックグラウンド圧縮。モデルのウィンドウを 48k にして、`compaction.background` のオンとオフで待ち時間は 0.03 秒と 5.3 秒。
- `CLAUDE.md` へのフォールバック。プロジェクト単位、グローバル、`AGENTS.md` の優先、環境変数による無効化の 4 通り。
- 他の 4 つの harness。Claude Code 2.1.327、Codex CLI 0.169.1、Gemini CLI 0.68.0、Qwen Code 0.28.0 を作業用ディレクトリに入れ、`--help`、`features list`、パッケージ内の既定値を確認した。

試していないもの（ドキュメントとリリースノートに基づく記述）：

- TUI の `session.verbosity` と折りたたみ表示。テストは `opencode run` だけで行った。
- フォアグラウンドの `timeout: 0` が 120 秒になること。
- 自分でもバックグラウンド処理を持つ子からの「still running」報告と、サブエージェントの権限確認。
- automations の API。
- 他の 4 つの harness での実際のセッション。どれもサインインしていない。
- 無料モデルには利用上限があり、1 回は回答の後に「Free usage limit reached」と表示された。自分のモデルとウィンドウサイズでは要約にかかる時間も変わる。

## 参考資料

1. OpenCode v2.3.0 リリースノート：<https://github.com/sst/opencode/releases/tag/v2.3.0>（PR [#63382](https://github.com/anomalyco/opencode/pull/63382)、[#63675](https://github.com/anomalyco/opencode/pull/63675)、[#63024](https://github.com/anomalyco/opencode/pull/63024)、[#63207](https://github.com/anomalyco/opencode/pull/63207)）
2. OpenCode v2.3.1 リリースノート：<https://github.com/sst/opencode/releases/tag/v2.3.1>（PR [#63699](https://github.com/anomalyco/opencode/pull/63699)、[#64290](https://github.com/anomalyco/opencode/pull/64290)、[#64266](https://github.com/anomalyco/opencode/pull/64266)、[#64026](https://github.com/anomalyco/opencode/pull/64026)、[#64474](https://github.com/anomalyco/opencode/pull/64474)、[#64533](https://github.com/anomalyco/opencode/pull/64533)、[#64343](https://github.com/anomalyco/opencode/pull/64343)、[#64160](https://github.com/anomalyco/opencode/pull/64160)、[#64262](https://github.com/anomalyco/opencode/pull/64262)）
3. OpenCode インストールスクリプト：<https://opencode.ai/install>（v1）、<https://opencode.ai/v2/install>（v2）。npm パッケージ [@opencode/cli](https://www.npmjs.com/package/@opencode/cli)
4. OpenCode ドキュメント、Compaction：<https://opencode.ai/v2/docs/compaction>
5. OpenCode ドキュメント、Rules：<https://opencode.ai/v2/docs/rules>
6. Claude Code ドキュメント、Tools reference（タイムアウトとバックグラウンドの時間制限）：<https://code.claude.com/docs/en/tools-reference>
7. Claude Code ドキュメント、Subagents：<https://code.claude.com/docs/en/sub-agents>
8. Claude Code ドキュメント、Model configuration（auto-compact ウィンドウ）：<https://code.claude.com/docs/en/model-config>
9. Claude Code ドキュメント、Settings reference（`idleCompaction`）：<https://code.claude.com/docs/en/settings-reference>
10. Claude Code ドキュメント、Environment variables：<https://code.claude.com/docs/en/env-vars>
11. Codex ドキュメント、Configuration reference：<https://developers.openai.com/codex/config-reference>
12. Codex ドキュメント、Subagents：<https://developers.openai.com/codex/subagents>
13. Codex changelog：<https://developers.openai.com/codex/changelog>
14. Gemini CLI ドキュメント、Shell tool：<https://geminicli.com/docs/tools/shell/>
15. Gemini CLI ドキュメント、Subagents：<https://geminicli.com/docs/core/subagents/>
16. Gemini CLI ドキュメント、Configuration：<https://geminicli.com/docs/reference/configuration/>
17. Qwen Code ドキュメント、Shell tool：<https://github.com/QwenLM/qwen-code/blob/v0.28.0/docs/developers/tools/shell.md>
18. Qwen Code ドキュメント、Settings：<https://github.com/QwenLM/qwen-code/blob/v0.28.0/docs/users/configuration/settings.md>
19. Qwen Code ドキュメント、Sub-agents：<https://github.com/QwenLM/qwen-code/blob/v0.28.0/docs/users/features/sub-agents.md>
