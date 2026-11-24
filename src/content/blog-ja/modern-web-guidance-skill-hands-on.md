---
title: "Modern Web Guidance 実地検証：Chrome チームのフロントエンド skill で、小さなモデルもネイティブの dialog と popover を使うようになる"
seoTitle: "Modern Web Guidance skill は入れる価値があるか：OpenCode で 3 モデルを skill あり・なしで比較"
description: "人気 Skill 実地検証の第 1 回。GoogleChrome/modern-web-guidance 1.0.1 を OpenCode 2.3.1 に入れ、deepseek-v4.1-flash、mimo-v2.6-flash、hy4-flash の 3 つの無料モデルで、同じ削除確認ダイアログとドロップダウンメニューのタスクを skill あり・なしで比べた。skill ありの 3 回はブラウザ検査 16 項目すべてに合格し、skill なしでは 2 モデルが 2〜3 項目を落とした（<dialog> 不使用、Tab で背後のページに移る、下端のメニューが画面外に出る）。代わりに所要時間は数倍になり、1 回の参照で 28〜53 KB の guide を読み、検索クエリは既定で Google に送られる。"
pubDate: 2026-11-21T09:00:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "developer-tools", "Agent Skills", "frontend-development", "opencode"]
lang: "ja"
translatedFrom: "modern-web-guidance-skill-hands-on"
series: hot-skill
---

**結論から：** coding agent にフロントエンドを書かせていて、特に安いモデルや無料モデルを使っているなら、GoogleChrome の modern-web-guidance は入れる価値がある。agent が賢くなるわけではない。ダイアログ、メニュー、フォームのようなコードを書く前に、Chrome、Edge、Firefox、MDN のチームが管理する guide を引かせる。agent はその guide に従い、div とキーイベントを手で組む代わりに、ネイティブの `<dialog>`、`popover`、CSS anchor positioning を使う。同じ小さなタスクで、3 つの無料モデルは skill ありでブラウザ検査 16 項目すべてに合格した。skill なしでは mimo-v2.6-flash が 2 項目、hy4-flash が 3 項目を落とした。deepseek-v4.1-flash は skill なしでも全項目に合格したので、このモデルでは skill は実装の書き方を変えただけだった。コストもはっきりしている。毎回数十 KB の guide を読み、所要時間は数倍になり、オプトアウトしない限り検索クエリは Google に送られる。

プロジェクトのルートで入れる。先にテレメトリを切っておく。Claude Code、Codex、Copilot CLI などは各自のプラグインマーケットからも入れられ、コマンドは README にある。[1]

```bash
export DISABLE_TELEMETRY=1
npx -y modern-web-guidance@latest install          # 対話式。agent とインストール先を選ぶ
npx -y modern-web-guidance@1.0.1 install -a opencode -y   # 本稿で使った非対話の書き方
```

| 状況 | おすすめ |
| --- | --- |
| フロントエンドの作業が多く、小さなモデルか無料モデルを使っている | 入れる。今回いちばん効果があったのはこの種のモデル |
| 強いモデルで、主にバックエンドやスクリプトを書く | 入れなくてよい。説明文にバックエンド、CI、スクリプトでは発火しないと書いてある |
| 自前のコンポーネントライブラリと設計ルールがある | ライブラリを優先する。guide は汎用の書き方で、チームの決まりを知らない |
| ネットワークから npm に出られない、またはクエリを外に出せない | 先に評価する。参照のたびに `npx` をオンラインで実行し、テレメトリは自分で切るまで有効 |
| 古いブラウザや特定の Firefox バージョンを支える必要がある | フォールバック経路は自分で確かめる。本稿は Chrome 156 でしか検証していない |

これは「人気 Skill 実地検証」シリーズの第 1 回。Agent Skills とは何か、どう入れるかは [Agent Skills 入門ガイド](/ja/blog/agentskills-io-starter-guide/) を参照。この種の skill がライフサイクル全体のどこに位置するかは [Agent Skills 2026 サーベイ](/blog/agent-skills-2026-survey-lifecycle-map/)（英語）にまとめてある。

## 今週これを選んだ理由

Modern Web Guidance は Chrome チームが主導し、Edge、Firefox、MDN と共同で管理する Agent Skills で、200 本以上のフロントエンド実装ガイドと Baseline のブラウザ互換データを含む。[1] 1.0 は 11 月 10 日に出て、作者の Show HN 投稿は 449 ポイント、コメント 146 件を集めた。[2] 11 月 16 日に 1.0.1 が出ており、本稿で試したのはこの版だ。[3] 今週、ソースリポジトリ `GoogleChrome/modern-web-guidance-src` は GitHub の TypeScript 週間ランキングで 5,224 スターを増やした。mattpocock/skills（5,337）や anthropics/skills（4,086）と同じ水準だ。[4]

公式の数字は大きい。作者は HN の投稿で、Codex、Claude Code、Antigravity に 200 タスク、約 1,700 件の Playwright と AST のアサーションを走らせ、平均合格率が skill なしの 55% から skill ありの 92% に上がったと書いている。[2] README の 11 月 8 日の行では、Claude Code が 57% から 88%、Codex が 54% から 82% だ。[1] これはプロジェクト自身が作った問題と採点器での結果になる。本稿では、プロジェクトが見たことのない小さなタスクと、評価されていない 3 つの無料モデルを使い、その伸びがどれだけ残るかを確かめた。

## インストール：2.5 MB をコピーするが、使うのは SKILL.md だけ

`install -a opencode -y` はリポジトリを clone し、`modern-web-guidance` の skill だけを入れる。もう 1 つの `chrome-extensions` は既定では入らない。`./.agents/skills/modern-web-guidance` にコピーし、commit を記録した `skills-lock.json` を書く。

![modern-web-guidance 1.0.1 のインストール出力：リポジトリを clone し、2 つの skill を見つけ、modern-web-guidance を選んで ./.agents/skills/modern-web-guidance にコピーする。ディレクトリには SKILL.md と guides があり、guide ファイルは 210 個、合計 2.5M。skills-lock.json に commit 64a6d708 が記録される](/assets/modern-web-guidance-skill-hands-on/install.webp)

ディレクトリには 210 本の guide があるが、skill ありの 3 回の実行はどれもローカルの guides ディレクトリを読まなかった。SKILL.md の手順では毎回 `npx -y modern-web-guidance@latest search` と `retrieve` を呼び、npm 上の最新 CLI が guide の本文を返す。ローカルの `dialog.md` と CLI の出力は完全に一致したので、今回は問題にならなかった。それでも次の 2 点は知っておくべきだ。

- `skills-lock.json` が固定するのは SKILL.md で、guide は固定されない。npm の `@latest` が更新されれば、agent が読む内容も変わる。
- 参照のたびにネットワークが要る。CLI は既定でインストール数、呼び出した agent の名前、取得した guide の id、agent が書いた検索クエリを収集する。止めるには `DISABLE_TELEMETRY=1` を設定する。[1]

## 入れた後、agent の手順は 5 つ増える

SKILL.md の `description` はかなり強い書き方だ。HTML、CSS、クライアント側 JS のタスクでは「MANDATORY: Execute FIRST」とし、modal や popover から passkeys、WebAssembly まで長い発火語の一覧を並べている。README によるとこの説明は約 205 トークン。[1] 本文は 4 つの手順を定める。2〜5 語の英語で検索し、id で guide を取り出し、書いたコードを guide と照合し、最後に `### Modern Web Guidance` の節で使った guide を明記する。

<figure class="not-prose my-6"><svg viewBox="0 0 680 530" role="img" aria-label="インストール後に agent が追加で踏む 5 つの手順" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:680px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><defs><marker id="mwg-flow-ja" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor" fill-opacity="0.6"/></marker></defs><text x="10" y="24" font-size="15.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">インストール後に agent が追加で踏む 5 つの手順</text><rect x="20" y="46" width="430" height="58" rx="8" fill="currentColor" fill-opacity="0.05" stroke="currentColor" stroke-opacity="0.35" stroke-width="1.2"/><text x="34" y="69" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">SKILL.md の説明が常にコンテキストにある</text><text x="34" y="89" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">約 205 トークン。フロントエンド作業では MANDATORY: Execute FIRST</text><text x="466" y="71" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.85">ローカルに 210 本の guide</text><text x="466" y="89" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.6">どの実行も読まなかった</text><line x1="235" y1="106" x2="235" y2="122" stroke="currentColor" stroke-opacity="0.55" stroke-width="1.5" marker-end="url(#mwg-flow-ja)"/><rect x="20" y="124" width="430" height="58" rx="8" fill="currentColor" fill-opacity="0.05" stroke="currentColor" stroke-opacity="0.35" stroke-width="1.2"/><text x="34" y="147" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">モデルが該当と判断し SKILL.md 本文を読む</text><text x="34" y="167" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">3 モデルとも TASK.md の直後に Skill を呼んだ</text><text x="466" y="149" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.85">発火 3/3</text><line x1="235" y1="184" x2="235" y2="200" stroke="currentColor" stroke-opacity="0.55" stroke-width="1.5" marker-end="url(#mwg-flow-ja)"/><rect x="20" y="202" width="430" height="58" rx="8" fill="currentColor" fill-opacity="0.12" stroke="currentColor" stroke-opacity="0.35" stroke-width="1.2"/><text x="34" y="225" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">npx modern-web-guidance@latest search</text><text x="34" y="245" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">2〜5 語のクエリで guide の id を得る</text><text x="466" y="227" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.85">毎回 @latest を取得</text><text x="466" y="245" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.6">クエリは既定で Google に送信</text><line x1="235" y1="262" x2="235" y2="278" stroke="currentColor" stroke-opacity="0.55" stroke-width="1.5" marker-end="url(#mwg-flow-ja)"/><rect x="20" y="280" width="430" height="58" rx="8" fill="currentColor" fill-opacity="0.12" stroke="currentColor" stroke-opacity="0.35" stroke-width="1.2"/><text x="34" y="303" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">npx modern-web-guidance@latest retrieve</text><text x="34" y="323" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">dialog や menu の guide を /tmp に書き出す</text><text x="466" y="305" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.85">1 回 28〜53 KB</text><text x="466" y="323" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.6">agent が全部読む</text><line x1="235" y1="340" x2="235" y2="356" stroke="currentColor" stroke-opacity="0.55" stroke-width="1.5" marker-end="url(#mwg-flow-ja)"/><rect x="20" y="358" width="430" height="58" rx="8" fill="currentColor" fill-opacity="0.05" stroke="currentColor" stroke-opacity="0.35" stroke-width="1.2"/><text x="34" y="381" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">guide どおりに書き、項目ごとに照合</text><text x="34" y="401" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">showModal()、popover、position-area とフォールバック</text><text x="466" y="383" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.85">16 項目すべて合格 3/3</text><line x1="235" y1="418" x2="235" y2="434" stroke="currentColor" stroke-opacity="0.55" stroke-width="1.5" marker-end="url(#mwg-flow-ja)"/><rect x="20" y="436" width="430" height="58" rx="8" fill="currentColor" fill-opacity="0.05" stroke="currentColor" stroke-opacity="0.35" stroke-width="1.2"/><text x="34" y="459" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">回答の最後に ### Modern Web Guidance</text><text x="34" y="479" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">使った guide ごとに 1 行、原文を引用</text><text x="466" y="461" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.85">2 回はここまで来なかった</text><text x="466" y="479" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.6">自己テストで止まった</text><line x1="458" y1="46" x2="458" y2="494" stroke="currentColor" stroke-opacity="0.18" stroke-dasharray="3 4"/><text x="20" y="518" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.65">OpenCode 2.3.1 + modern-web-guidance 1.0.1。モデルは deepseek-v4.1-flash、mimo-v2.6-flash、hy4-flash（無料枠）。</text></svg></figure>

3 つのモデルはどれもコードを書く前に Skill ツールを呼び、検索語もほぼ同じだった。次は hy4-flash の実行の一部だ。2 回の `search` でダイアログとメニューを調べ、それぞれ 10 件の候補が返る。続いて `retrieve` で `menu,viewport-aware-dropdowns` を、もう 1 回でダイアログ関連の 4 本を取り出している。

![hy4-flash-free の端末：modern-web-guidance skill を読み込む。search "confirmation modal dialog" と "popover menu dropdown" がそれぞれ guide の id と説明を返す。retrieve の出力は 41.1 KB と 28.1 KB で /tmp/mwg-guide-*.md に保存され、agent は 2 つのファイルを読んでから index.html、styles.css、app.js を書く](/assets/modern-web-guidance-skill-hands-on/agent-search.webp)

guide が 9.5 KB を超えると、CLI は本文を表示せずに `/tmp/mwg-guide-*.md` に書き出し、ファイル読み取りツールで全文を読むよう agent に指示する。deepseek は `dialog,menu,viewport-aware-dropdowns` を一度に取り出し、そのファイル 1 つで 53.2 KB、819 行あった。これがこの skill の主なコストで、後で詳しく扱う。

コードを書いた後、deepseek は 4 番目の手順どおり回答の最後に説明を書き、各項目で guide の原文を引用した。たとえばメニューに `role="menu"` を付けなかった理由として、矢印キーの操作を全部実装しないならこのロールを宣言するなという guide の一文を挙げている。

![deepseek-v4.1-flash-free の最終回答：What changed の節に削除確認と More メニューの変更が並ぶ。Modern Web Guidance の節には dialog、menu、viewport-aware-dropdowns の 3 項目があり、それぞれ guide の原文を引用している](/assets/modern-web-guidance-skill-hands-on/disclosure.webp)

## 比較実験：削除確認とドロップダウンメニュー

タスクは 3 行のメンバー一覧がある静的ページで、ビルド手順はない。TASK.md は振る舞いだけを書き、API の名前は出さない。

1. Delete を押したら、まず「Remove 名前 from the team?」と Cancel、Remove のボタンを出す。開いている間は背後のページを押せない。Esc か Cancel で、削除せずに閉じる。
2. More を押したら、ボタンのすぐ下に Copy email と Make admin の 2 項目の小さなメニューを出す（今は `console.log` でよい）。ほかの場所を押すか Esc で閉じる。

各モデルで 2 回走らせた。skill を入れたディレクトリと入れていないディレクトリで、それ以外は同じにした。どちらも `opencode run --auto` で、タイムアウトは 15 分。終わった後に Playwright で Chrome 156 を動かし、16 項目を検査した。11 項目は TASK.md の要件に対応する。残り 5 項目はタスクに書いていないが利用者が出会う状況で、フォーカスがダイアログに入るか、Tab で背後のページに移らないか、閉じた後にフォーカスが元のボタンに戻るか、画面下端でメニューが切れないかを見る。「削除確認が `<dialog>` か」の 1 項目は実装の書き方を見ていて、目に見える振る舞いではない。

<figure class="not-prose my-6"><svg viewBox="0 0 680 260" role="img" aria-label="同じタスクで入れた場合と入れない場合（ブラウザ検査 16 項目）" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:680px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><defs><marker id="mwg-cmp-ja" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor" fill-opacity="0.6"/></marker></defs><text x="10" y="24" font-size="15.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">同じタスクで入れた場合と入れない場合（ブラウザ検査 16 項目）</text><text x="250.0" y="54" font-size="12" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">skill あり</text><text x="250.0" y="70" font-size="10.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.65">合格数</text><text x="370.0" y="54" font-size="12" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">skill なし</text><text x="370.0" y="70" font-size="10.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.65">合格数</text><text x="490.0" y="54" font-size="12" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">skill あり</text><text x="490.0" y="70" font-size="10.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.65">所要時間</text><text x="610.0" y="54" font-size="12" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">skill なし</text><text x="610.0" y="70" font-size="10.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.65">所要時間</text><text x="14" y="109" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">deepseek-v4.1-flash</text><rect x="194.0" y="88" width="112.0" height="32" rx="6" fill="currentColor" fill-opacity="0.16" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.2"/><text x="250.0" y="109" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">16/16</text><rect x="314.0" y="88" width="112.0" height="32" rx="6" fill="currentColor" fill-opacity="0.16" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.2"/><text x="370.0" y="109" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">16/16</text><rect x="434.0" y="88" width="112.0" height="32" rx="6" fill="currentColor" fill-opacity="0.03" stroke="currentColor" stroke-opacity="0.25" stroke-width="1.2"/><text x="490.0" y="109" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.8">7 分 07 秒</text><rect x="554.0" y="88" width="112.0" height="32" rx="6" fill="currentColor" fill-opacity="0.16" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.2"/><text x="610.0" y="109" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">1 分 25 秒</text><text x="14" y="149" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">mimo-v2.6-flash</text><rect x="194.0" y="128" width="112.0" height="32" rx="6" fill="currentColor" fill-opacity="0.16" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.2"/><text x="250.0" y="149" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">16/16</text><rect x="314.0" y="128" width="112.0" height="32" rx="6" fill="currentColor" fill-opacity="0.03" stroke="currentColor" stroke-opacity="0.25" stroke-width="1.2"/><text x="370.0" y="149" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.8">14/16</text><rect x="434.0" y="128" width="112.0" height="32" rx="6" fill="currentColor" fill-opacity="0.03" stroke="currentColor" stroke-opacity="0.25" stroke-width="1.2"/><text x="490.0" y="149" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.8">15 分で打ち切り*</text><rect x="554.0" y="128" width="112.0" height="32" rx="6" fill="currentColor" fill-opacity="0.16" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.2"/><text x="610.0" y="149" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">8 分 38 秒</text><text x="14" y="189" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">hy4-flash</text><rect x="194.0" y="168" width="112.0" height="32" rx="6" fill="currentColor" fill-opacity="0.16" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.2"/><text x="250.0" y="189" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">16/16</text><rect x="314.0" y="168" width="112.0" height="32" rx="6" fill="currentColor" fill-opacity="0.03" stroke="currentColor" stroke-opacity="0.25" stroke-width="1.2"/><text x="370.0" y="189" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.8">13/16</text><rect x="434.0" y="168" width="112.0" height="32" rx="6" fill="currentColor" fill-opacity="0.03" stroke="currentColor" stroke-opacity="0.25" stroke-width="1.2"/><text x="490.0" y="189" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.8">15 分で打ち切り*</text><rect x="554.0" y="168" width="112.0" height="32" rx="6" fill="currentColor" fill-opacity="0.16" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.2"/><text x="610.0" y="189" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">38 秒**</text><text x="14" y="224" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.65">* コードは完成済み。自己テストで止まり timeout 900 で終了。** コードを書いた後に無料枠の上限に達した。</text><text x="14" y="240" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.65">skill なしで落ちた項目：&lt;dialog&gt; 不使用、Tab で背後のページに移る、下端のメニューが画面外に出る。</text></svg></figure>

![同じモデル hy4-flash-free の 2 つの成果物を同じ検査にかけた結果：skill ありは 16 項目すべて PASS。skill なしは Delete opens a modal dialog、Tab never reaches the page behind、Menu stays inside a short viewport の 3 項目が FAIL](/assets/modern-web-guidance-skill-hands-on/verify-hy4.webp)

それぞれの成果物が使ったプラットフォーム機能は次のとおり。

| | 削除確認 | More メニュー | メニューの位置決め | 背後のページ |
| --- | --- | --- | --- | --- |
| deepseek あり | `<dialog>` + `showModal()` + `form method="dialog"` | `popover` + `popovertarget` | `position-area` + `position-try-fallbacks`、JS フォールバック | ブラウザが自動で inert にする |
| deepseek なし | `<dialog>` + `showModal()` | JS で開閉する div | JS で座標計算、反転あり | ブラウザが自動で inert にする |
| mimo あり | `<dialog>` + `form method="dialog"` | `popover` + `commandfor`、実験段階の `focusgroup` も使用 | `position-area`、JS フォールバック | ブラウザが自動で inert にする |
| mimo なし | div のオーバーレイ + `aria-modal` | 実行時に div を生成 | JS で座標計算、反転なし | 手動で `main.inert = true` |
| hy4 あり | `<dialog>` + `form method="dialog"` | `popover` + `popovertarget` | `position-area`、反転する JS フォールバック | ブラウザが自動で inert にする |
| hy4 なし | div のオーバーレイ + `role="alertdialog"` | 実行時に `<ul>` を生成 | JS で座標計算、反転なし | 何もしていない。オーバーレイがマウスを止めるだけ |

1 つ別に書いておきたい結果がある。deepseek-v4.1-flash は skill なしでも `<dialog>` を選び、16 項目すべてに合格し、かかったのは 1 分 25 秒だった。力のあるモデルにとって、この skill が変えるのは書き方（メニューを `popover` と anchor positioning にする）で、正しいかどうかではない。HN でも、legacy-scan をかけたら 2 件しか見つからず、この skill は「弱いモデルで役に立つ」だろうというコメントがあった。[2]

## 違いはキーボード操作と端のケースに出る

2 つのダイアログのスクリーンショットはほとんど同じに見える。どちらも灰色の背景、中央のカード、2 つのボタンがあり、背後のページも押せない。

![hy4-flash-free の 2 つの成果物の削除確認：左は dialog と showModal、右は div のオーバーレイ。見た目はほぼ同じ](/assets/modern-web-guidance-skill-hands-on/dialog-look.webp)

Tab を何回か押すと違いが出る。`showModal()` で開いた `<dialog>` では、ブラウザがページの残りを inert にする。Tab はダイアログのボタンとブラウザの UI の間を移り、背後のボタンには届かない。hy4 が skill なしで書いた div のオーバーレイはマウスしか止めていない。Tab を 2 回押すと、フォーカスはオーバーレイの裏にある 1 行目の More、続いて Delete に移る。キーボードやスクリーンリーダーの利用者がここで Enter を押すと、背後のページのボタンが動く。

![Tab を 4 回押した後：左の skill ありでは、フォーカスはまだダイアログの Remove ボタンにある。右の skill なしでは、オーバーレイの裏にある 1 行目の Delete ボタンにフォーカス枠が出ている](/assets/modern-web-guidance-skill-hands-on/tab-focus.webp)

メニューの違いは画面の下端で出る。ウィンドウの高さを 250 ピクセルにして一番下までスクロールし、最後の行の More を押す。skill ありの 3 つはどれも `position-try-fallbacks: flip-block` を使い、下に余裕がなければメニューがボタンの上に反転する。skill なしの mimo と hy4 は JS で座標を計算して常に下に置くので、メニューの半分が切れ、2 項目目を見るにはスクロールが要る。deepseek は skill なしでも反転の処理を自分で書いており、この項目にも合格した。

![高さ 250 ピクセルのウィンドウで最後の行の More を押した結果：左の skill ありではメニューがボタンの上に反転して全部見える。右の skill なしではメニューがボタンの下から画面外にはみ出し、Copy email しか見えない](/assets/modern-web-guidance-skill-hands-on/edge-menu.webp)

コード量に大きな差はない。hy4 の skill ありは空行を除いて JS が 52 行、skill なしは 71 行で、フォーカス、Esc、外側クリックをブラウザに任せた分だけ短い。deepseek の skill ありは逆に 109 行あり、増えた分は Popover API や anchor positioning のないブラウザ向けのフォールバックだ。guide は Baseline Widely available でない機能には必ずフォールバックを付けるよう求めていて、モデルはそれに従った。

## コスト：時間、コンテキスト、ネットワーク

skill ありの実行はどれもかなり遅かった。deepseek は 1 分 25 秒から 7 分 7 秒になった。mimo と hy4 は skill ありだと正常に終わらなかった。hy4 は開始から 1 分 12 秒、mimo は約 8 分半でコードを書き終え、そのコードは全項目に合格した。ところがその後、どちらも Chrome DevTools Protocol のスクリプトを自分で書いて自己テストを始め、止まったまま 15 分のタイムアウトに達した。mimo の 1 回目は guide のファイルを読んでいる途中で止まり、2 回目でようやくコードを書いた。mimo は skill なしでも自己テストをしたが、8 分 38 秒で正常に終わった。なので、タイムアウトをすべて skill のせいにはできない。ただ、SKILL.md の 3 番目の手順は guide との照合を求めており、それがこの 2 モデルに guide にある振る舞いを一つずつブラウザで確かめさせたように見える。

トークン消費も増えた。deepseek の組では、skill ありが入力 58,574、出力 10,892、キャッシュ読み取り 127 万トークン。skill なしはそれぞれ 15,218、4,144、11 万だった。53 KB の guide ファイルが一度コンテキストに入ると、以降のターンはすべてそれを抱えて進む。

副作用も 2 つあった。

- hy4 の skill ありの実行は、自己テスト用の `__test.html` をプロジェクトのルートに残し、終了時に消さなかった。
- `search` と `retrieve` は 1 回ごとに `npx` の呼び出しになる。hy4 は SKILL.md がサンドボックス向けに勧めている `NPM_CONFIG_CACHE=/tmp/npm-cache` を自分で付けた。コマンドを 1 つずつ承認する harness では、SKILL.md は `npx -y modern-web-guidance@latest *` だけを許可リストに入れ、`npx *` 全体は開けないよう勧めている。

## 落とし穴と限界

**guide が使われる保証はない。** アクセシビリティの専門家 Adrian Roselli は 5 月に初期の版を試した。Antigravity と Modern Web Guidance の組み合わせで作ったアコーディオンは、Firefox でアニメーションが動かず、WCAG の誤りもいくつかあった。関連するルールは guide にすでに書かれていた。Google の相談役を務める専門家は、モデルは非決定的で、guide が取り出されても全部は読まれないことがあると返している。[5] 今回の 3 回はどれも guide を最後まで読んだが、タスクは 1 つしかない。

**Chrome でしか確かめていない。** skill ありの 3 つの成果物はどれも anchor positioning の JS フォールバックを持っているが、検査は Chrome 156 だけで走らせたので、フォールバックの分岐は一度も実行されていない。古い Safari や Firefox を支えるなら、フォールバック経路は自分で試す必要がある。

**`MANDATORY` の説明文はほかの skill とぶつかる。** この description はすべてのフロントエンドのタスクで「最初に実行」するよう求める。チームのフロントエンド規約やデザインシステムの skill も入れていれば、両方が自分が先だと主張する。役割の重なる skill が互いを押しのける問題は、[同時に入れた Agent Skills の衝突](/blog/co-installed-agent-skills-conflicts/)（英語）を参照。

**ローカルの guide は飾りになっている。** 2.5 MB の guides ディレクトリは既定の手順に入っていない。ネットワークが切れているとき、SKILL.md は npx のキャッシュから `--offline` で再試行するよう勧めるだけで、ローカルのファイルを読む手順には切り替えない。skill のディレクトリだけを読み、必要に応じて展開する設計のトレードオフは [Progressive Disclosure](/blog/progressive-disclosure-agent-skills/)（英語）で扱っている。

## 試したこと、試していないこと

試したこと（OpenCode 2.3.1、Linux x64、OpenCode Zen の無料モデル、すべての実行で `DISABLE_TELEMETRY=1`）：

- `npx -y modern-web-guidance@1.0.1 install -a opencode -y` で 2 回インストールした。どちらも commit は `64a6d708` で、できたディレクトリは同一だった。
- deepseek-v4.1-flash、mimo-v2.6-flash、hy4-flash の 3 モデルで、同じタスクを skill あり・なしで 1 組ずつ走らせた。成果物は 6 つで、すべて同じ 16 項目の Playwright 検査にかけた。
- skill ありの 3 回はどれも skill を発火させ、`search` と `retrieve` を呼び、ローカルの guides ディレクトリは読まなかった。
- ローカルの guide ファイルと CLI の出力は一致した（CLI が足す見出し 1 行だけが違う）。

試していないこと：

- big-pickle は skill なしの組だけが完了した（16 項目中 14、やはり `<dialog>` 不使用、下端のメニューが画面外）。skill ありの組は無料枠の上限に当たり、比較できなかった。hy4 の skill なしの組もコードを書いた後に上限に当たり、自己テストはしていない。
- 強いモデル（Claude、GPT、Gemini の上位モデル）での比較。公式評価が使っているのはこちらだ。[1]
- 古いコードを走査して現代化する `legacy-scan` モード。
- Firefox と Safari、そして skill ありの成果物にある JS フォールバックの分岐。
- 繰り返し実行。各モデル 1 回ずつしか走らせていない。

## 参考資料

1. GoogleChrome/modern-web-guidance README（インストール方法、Telemetry & Privacy、Recent eval results）：<https://github.com/GoogleChrome/modern-web-guidance>
2. Show HN: Get your coding agent off ~2019 JavaScript, onto modern web primitives（2026-11-10）：<https://news.ycombinator.com/item?id=50443812>
3. npm パッケージ modern-web-guidance 1.0.1、GitHub release v1.0.1：<https://www.npmjs.com/package/modern-web-guidance>、<https://github.com/GoogleChrome/modern-web-guidance/releases/tag/v1.0.1>
4. GitHub Trending、TypeScript・Shell・Python の週間ランキング（2026-11-21、UTC+8）：<https://github.com/trending/typescript?since=weekly>
5. Adrian Roselli, Maybe Don't Rely on Google's "Modern Web Guidance"（2026-05-25、6 月 24 日更新）：<https://adrianroselli.com/2026/05/maybe-dont-rely-on-googles-modern-web-guidance.html>
6. Modern Web Guidance のドキュメントと guide の一覧：<https://developer.chrome.com/docs/modern-web-guidance>。評価ダッシュボード：<https://googlechrome.github.io/modern-web-guidance-src/>
