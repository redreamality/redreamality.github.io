---
title: "DeepSeek Super-agent を読み解く：ボトルネックが人の注意力に移ったとき、エージェントをどう組むか"
seoTitle: "DeepSeek Super-agent の設計：Router、Worker、イベント駆動"
description: "DeepSeek Harness チームは 10 月 31 日に Super-agent の設計記事を公開し、dsh-superagent プロトタイプをオープンソース化した。Router/Worker の二層構造、Trigger のフィルタと Thread 購読、非同期 ReAct、計算と状態の分離、Watchdog を順に解説し、公式アブレーションの数字とコストを読み、コミュニティの実機検証やセキュリティ監査と照らし合わせ、Claude Tag、Copilot coding agent、Managed Agents と並べて 2026 年の位置づけを考える。"
pubDate: 2026-11-02T22:30:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "deepseek", "multi-agent", "developer-tools"]
lang: "ja"
translatedFrom: "deepseek-super-agent-router-worker-architecture"
---

10 月 31 日の夜（北京時間）、DeepSeek Harness チームは公式 WeChat アカウントで長文記事「Super-agent 設計探索：より自律的な Agent システムへ」を公開し、同時に GitHub で対応するプロトタイプ `dsh-superagent-prototype` をオープンソース化した。[1][3] 翌日、Bloomberg は「DeepSeek、Anthropic に対抗する強化版コーディングエージェントを投入」と報じ、South China Morning Post や IT之家 も同じ日に追いかけた。[7][8][14] 公開から 2 日でリポジトリのスターは 1 万を超えている。

見出しだけ読むと、DeepSeek が新製品か新モデルを出したように見える。どちらでもない。README の 1 行目には「参考用の研究プロトタイプであり、DeepSeek の公式製品ではない」とあり、記事の冒頭も、これはアーキテクチャの検討であって機能紹介ではないと断っている。[1][3] 実際に出てきたのは、設計の考え方、2 組の予備実験、そして動くけれども粗い参照実装だ。

この記事をじっくり読む価値があるのは、「Claude Code 対抗」という話題性のためではない。多くの人がうすうす感じていて、正面から書かれることの少なかった判断をはっきり言葉にしているからだ。**1 つのタスクをどこまでうまくこなせるかはモデルで決まる。同時にいくつのタスクを進められるかは人の注意力で決まる。** これが正しければ、次の競争軸はモデルやハーネスからシステム設計に移る。そしてシステム設計は、計算機科学が何十年も積み上げてきた分野だ。以下、この視点で分解していく。

## 何が公開されたのか

公開されたのは次の 3 つ。

- 9 章構成の中国語の長文記事。英語の全訳も出回っている。問題設定から 5 つのモジュール、2 組の実験、4 つの未解決課題までを扱う。[1][2]
- MIT ライセンスの GitHub リポジトリ。バージョン 0.1.0、コミットは 1 回だけで、時刻は北京時間 10 月 31 日 20:05。主に TypeScript で約 2 万 5 千行、順番に読む前提の設計ドキュメントが 9 本付いている。[3]
- 具体的なシナリオ。プロトタイプは **1 つの** GitHub リポジトリを見張り、任意で Feishu（ByteDance の業務チャット）にもつながる。許可リストにいる人がメンションで依頼すると、作業チケットを作り、専用のセッションとディレクトリで作業し、元の会話に戻って成果を渡す。たいていは pull request だ。Web パネルには人の対応が必要なものだけが並ぶ。[3]

[![dsh-superagent-prototype リポジトリのスクリーンショット。README の冒頭に研究プロトタイプであり公式製品ではないと書かれている](/assets/deepseek-super-agent-router-worker-architecture/github-readme.webp)](https://github.com/deepseek-ai/dsh-superagent-prototype)

*スクリーンショット：dsh-superagent-prototype リポジトリ（2026-11-02 撮影、当時スター 11.9k、フォーク 1.2k）[3]*

README にはもう 1 つ見落としやすい一文がある。公開版は公開用に手を入れたもので、社内版とも記事の実装とも完全には一致せず、記事に出てくる設計の一部は今後の方向性であってプロトタイプには入っていない。[3] つまり、記事は DeepSeek が社内で動かしているシステムとその背後の考え方を語り、プロトタイプはそれを縮小した動くサンプル、という二層で読む必要がある。

DeepSeek Harness そのものについては、このサイトで[メインループとプラグイン体系（英語版）](/blog/deepseek-harness-architecture-plugins-sandbox-vs-claude-code/)と[土台にある Cordis のプラグイン合成](/ja/blog/cordis-spatiotemporal-composability-deepseek-harness/)を取り上げてきた。Super-agent はその上にもう 1 層を足すもので、扱うのは「1 つのセッションをどう回すか」ではなく「多数のセッションをどう組織するか」だ。

## 問題はセッションという単位にある

記事の出発点は素朴な観察だ。いまの主流のエージェントは 1 つの Session を作業単位にしていて、Session 同士は独立している。複数の仕事を並行して進めるなら、自分で Session を切り替え、それぞれにどんなコンテキストがあるかを覚えておかなければならない。彼らの観察では、1 人が同時に追える活発な Session はせいぜい 3〜5 個だという。[1]

Claude Code や Codex のウィンドウをいくつも開いたことがある人なら覚えがあるはずだ。4 つ目を開いたころには、2 つ目が何の返事を待っているのか忘れている。モデルが強くなって個々のタスクを見張る必要が減るほど、この天井はかえって目立ってくる。

ローカルの CLI に MCP やチャットボットをつなげば、グループのメッセージは受け取れる。ただ記事が指摘するように、それでも 3 つの点で詰まる。長いコマンドが走っている間は新しいメッセージが待たされる。複数タスクのコンテキストが混ざる。ローカルのマシンがスリープすればエージェントも止まる。[1]

そこで彼らは「エージェント＝人が手で開いた 1 つのセッション」という結びつきを断ち切り、エージェントを持続する 1 つの存在にしようとする。記事はその形に 4 つの特徴を挙げる。**連続**（IM でも GitHub のコメントでも、話しかける相手はいつも同じエージェントに感じられる）、**効率**（複数タスクを並行で進め、前の仕事を待たずに次の指示を受けられる）、**能動**（環境のイベントを観察し、扱うべきことは自分から進め、不要なときは黙っている）、**持続**（常にオンラインで、異常からは自動で回復する）。[1]

1 本の ReAct ループでは 4 つ全部は満たせない。連続性はすべてのメッセージを 1 つのコンテキストに入れたがり、効率はタスクを分けて並行に走らせたがる。以下の 5 つのモジュールは、ほぼこの衝突を解くためにある。

## Router と Worker：連続性とスループットを 2 層に分ける

すべてのイベントを 1 つの Session に入れれば、コンテキストは最も連続するが、処理は直列になり、タスクが増えると遅くなり、細部が混ざり合う。イベントごとに新しい Session を開けば並行性は最大になるが、タスク同士が関係していると結果がばらばらになり、複数の Session がそれぞれユーザーに返事をして混乱を招く。[1]

DeepSeek の答えは、「全体の連続性を保つ」ことと「大量に並行実行する」ことを別々の層に任せることだ。

<figure class="not-prose my-6"><svg viewBox="0 0 680 470" role="img" aria-label="Super-agent：イベントはどこから入り、誰が処理するか" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:680px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor" fill-opacity="0.7"/></marker></defs><text x="10" y="24" font-size="16" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">Super-agent：イベントはどこから入り、誰が処理するか</text><text x="10" y="52" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">環境イベント（Trigger）</text><rect x="10" y="62" width="150" height="30" rx="6" fill="#64748b" fill-opacity="0.12" stroke="#64748b" stroke-opacity="0.8"/><text x="85" y="82" font-size="12" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">Feishu / IM グループチャット</text><line x1="162" y1="77" x2="186" y2="150" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.6" marker-end="url(#ah)"/><rect x="10" y="102" width="150" height="30" rx="6" fill="#64748b" fill-opacity="0.12" stroke="#64748b" stroke-opacity="0.8"/><text x="85" y="122" font-size="12" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">GitHub Issue・PR コメント</text><line x1="162" y1="117" x2="186" y2="150" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.6" marker-end="url(#ah)"/><rect x="10" y="142" width="150" height="30" rx="6" fill="#64748b" fill-opacity="0.12" stroke="#64748b" stroke-opacity="0.8"/><text x="85" y="162" font-size="12" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">CI の結果</text><line x1="162" y1="157" x2="186" y2="150" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.6" marker-end="url(#ah)"/><rect x="10" y="182" width="150" height="30" rx="6" fill="#64748b" fill-opacity="0.12" stroke="#64748b" stroke-opacity="0.8"/><text x="85" y="202" font-size="12" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">メール・カレンダー</text><line x1="162" y1="197" x2="186" y2="150" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.6" marker-end="url(#ah)"/><rect x="186" y="105" width="128" height="90" rx="6" fill="#f59e0b" fill-opacity="0.15" stroke="#f59e0b" stroke-opacity="0.8"/><text x="250" y="127" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">フィルタ</text><text x="250" y="150" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">コードのルール：高速経路</text><text x="250" y="170" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">モデルの判断：低速経路</text><line x1="316" y1="135" x2="328" y2="112" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.6" marker-end="url(#ah)"/><text x="312" y="96" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.75">新しいイベント</text><rect x="330" y="62" width="150" height="96" rx="6" fill="#3b82f6" fill-opacity="0.15" stroke="#3b82f6" stroke-opacity="0.8"/><text x="405" y="84" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">Router（常駐）</text><text x="405" y="106" font-size="10" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">人と話し、タスクを割り当てる</text><text x="405" y="124" font-size="10" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">全体の記憶。タスクは実行しない</text><text x="405" y="142" font-size="10" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">軽量モデルで足りる</text><rect x="510" y="52" width="160" height="44" rx="6" fill="#10b981" fill-opacity="0.15" stroke="#10b981" stroke-opacity="0.8"/><text x="590" y="79" font-size="12" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">Worker A：バグを再現</text><line x1="482" y1="110" x2="507" y2="74" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.6" marker-end="url(#ah)"/><rect x="510" y="110" width="160" height="44" rx="6" fill="#10b981" fill-opacity="0.15" stroke="#10b981" stroke-opacity="0.8"/><text x="590" y="137" font-size="12" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">Worker B：PR を追う</text><line x1="482" y1="110" x2="507" y2="132" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.6" marker-end="url(#ah)"/><rect x="510" y="168" width="160" height="44" rx="6" fill="#10b981" fill-opacity="0.15" stroke="#10b981" stroke-opacity="0.8"/><text x="590" y="195" font-size="12" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">Worker C：新機能を書く</text><line x1="482" y1="110" x2="507" y2="190" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.6" marker-end="url(#ah)"/><text x="570" y="244" font-size="11" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.8">コンテキストは隔離、最強のモデル</text><path d="M250,197 L250,262 L655,262 L655,226" fill="none" stroke="#10b981" stroke-width="1.8" stroke-dasharray="6 4" marker-end="url(#ah)"/><text x="415" y="280" font-size="11.5" text-anchor="middle" font-weight="normal" fill="#10b981" fill-opacity="1">購読済みの Thread：コードが Worker に直送し、Router を通らない</text><text x="495" y="46" font-size="10.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.7">報告</text><rect x="10" y="300" width="660" height="40" rx="6" fill="#ef4444" fill-opacity="0.1" stroke="#ef4444" stroke-opacity="0.8" stroke-dasharray="5 4"/><text x="340" y="325" font-size="12" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">Watchdog：Worker が実質的に進んでいるか、ずれていないかを定期確認</text><rect x="10" y="352" width="660" height="40" rx="6" fill="#8b5cf6" fill-opacity="0.12" stroke="#8b5cf6" stroke-opacity="0.8"/><text x="340" y="377" font-size="12" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">クラウド：ステートレスな計算 + セッション状態は DB</text><line x1="120" y1="394" x2="120" y2="414" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.6" marker-end="url(#ah)"/><rect x="60" y="416" width="120" height="30" rx="6" fill="#64748b" fill-opacity="0.12" stroke="#64748b" stroke-opacity="0.8"/><text x="120" y="436" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">開発マシン</text><line x1="340" y1="394" x2="340" y2="414" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.6" marker-end="url(#ah)"/><rect x="280" y="416" width="120" height="30" rx="6" fill="#64748b" fill-opacity="0.12" stroke="#64748b" stroke-opacity="0.8"/><text x="340" y="436" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">CI マシン</text><line x1="560" y1="394" x2="560" y2="414" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.6" marker-end="url(#ah)"/><rect x="500" y="416" width="120" height="30" rx="6" fill="#64748b" fill-opacity="0.12" stroke="#64748b" stroke-opacity="0.8"/><text x="560" y="436" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">クラウド VM</text><text x="340" y="462" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">各デバイスの軽量 daemon（BYOM）：コマンドを実行するだけ</text></svg></figure>

*図：Super-agent のイベント経路と層構成（公式記事の第 2〜6 節をもとに作成）[1]*

**Router 層**は常駐し、あらゆる入口からの人とのやり取りとタスクの割り当てを担う。全体の順序を決める点、調整する点、そして記憶でもある。ボトルネックにならないよう、具体的なタスクは実行しない。記事は Bash ツールすら持たなくてよいと書いている。仕事は見た目より単純で、軽量なモデルで足りることが多い。[1]

**Worker 層**は、互いにコンテキストを隔離したセッションの集まりだ。各 Worker は実行用のツール一式を持ち、1 つのタスクに集中し、通常は最も強力なモデルを使う。Worker は人と直接話さない。推論やツール呼び出しはグループチャットに出ず、Router に報告し、Router がまとめて返事をする。[1]

これは Agent Team に似て見えるが、Agent Team は **1 つの**複雑なタスクを分解するためのもので、リーダーはタスクを深く理解し、頻繁にメンバーを調整する必要がある。Router が扱うのはタスク同士の関係と割り当てだけで、個々のタスクの中身は分解しない。[1] この区別は大事だと思う。チームリーダーは忙しい技術責任者で、賢ければ賢いほどよい。Router は受付と配車係を兼ねたような役で、必要なのは速さと安定だ。

常駐の Router 1 つで捌ききれるのか。記事の答えはバッチ処理だ。Router が推論している間に届いたイベントは溜まり、次の呼び出しでまとめて入る。Router の 1 ステップは長い入力と短い出力が普通なので、まとめたイベントは prefill の段階で並列に計算され、1 回のリクエスト時間はバッチサイズほどには伸びない。負荷試験では、判断が必要な Trigger を毎分約 1 件から約 40 件に増やすと、平均バッチサイズは 1.0 から 2.8 に増え、1 回のリクエスト時間は 2.5 秒から 3.9 秒にしか伸びず、1 件の判断あたりの推論時間はむしろ 6.4 秒から 1.6 秒に下がった。[1] 詰まるほど 1 件あたりが安くなる。データベースの group commit と同じ理屈が、LLM のコスト構造でも成り立つ。

さらに規模が大きくなれば Router のシャーディングが必要になり、また連続性とスループットのトレードオフに戻る。細かく分けるほど、シャードをまたぐ記憶が途切れる。[1]

## イベント駆動：まずフィルタ、次に購読、必要に応じて想起

エージェントを能動的にするには、入力を人が 1 件ずつ打つプロンプトだけにしてはいけない。グループチャットのメッセージ、メールやカレンダーの通知、コードレビューのコメント、CI の結果といった半構造化された環境イベントが入力になる。記事はこれらをまとめて Trigger と呼ぶ。[1]

実際のグループチャットにつなぐと、イベントの流れはノイズが多く、行動が必要なものはごく一部だ。すべてのメッセージを大きなモデルに一から判断させれば、遅延もコストも持たない。そこで最初の段階は 2 段階のフィルタになる。まずコードが、送信元、グループの範囲、ユーザーの許可リストといった確定的な条件で素早く通すか捨てるかを決める。これが高速経路だ。残った候補だけをモデルに渡し、プロンプトに書いた方針で行動するかを判断させる。これが低速経路だ。[1] 低速経路は人向けの自然言語の拡張点にもなっていて、ルールを足したければプロンプトを書き換えればよい。

2 段階目はルーティングだ。同じ PR、同じ IM のトピック、同じメールのスレッドに続けて届くイベントは 1 つの Thread をなす。Router が Thread の最初のイベントから Worker を作ると、その Worker は Thread を購読し、以降のイベントはコードが直接その Worker に届け、Router を通らない。購読は多対多なので、同じ PR に触れた 2 つの Worker は同じイベントを受け取り、直接通信しなくても衝突に気づける。[1] メッセージキューを知っている人には、topic の購読そのものに見えるはずだ。

3 段階目はコンテキストの詰め方だ。記事はコンテキストウィンドウをキャッシュとして扱い、コンパイラの用語を 2 つ借りる。Inline は、すぐ必要になりそうな情報を直接ウィンドウに入れてツール呼び出しの往復を省くこと。Spill は、予算を超える情報やあまり使わない情報を外に置き、中には参照か要約だけを残すことだ。[1] 最初は現在のオブジェクトの ID と要約だけを渡し、局所性に従って近くの内容を足していく。たとえば IM メッセージの前後数件と、それが返信している元のメッセージだ。長いものは切り詰め、続きを読むための入口を残す。

その上で、Trigger、Thread、Worker Session などのオブジェクトにはそれぞれ一意の ID が振られ、注入されるたびに関連オブジェクトの ID が埋め込まれて、参照のグラフができる。モデルは現在のイベントから ID を 1 つずつたどって古いコンテキストを取り戻す。メッセージが属する Thread、それを担当する Worker、その Worker に関連する別のレビュー Thread、という具合だ。記事はこれを Chain of Recall（連鎖想起）と呼び、長く動き続けた Router が初期のタスクを忘れる問題への対策にしている。[1]

最後の仕組みは投機的実行だ。CPU が分岐の結果を待たずに先へ計算するように、エージェントも結果が使われると確定する前にバックグラウンドで動き出せる。DeepSeek は社内の DeepSeek Harness ユーザーグループに「黙って再現して直す」という方針を設定した。誰かが問題を報告したり変更を議論したりすると、エージェントはまず裏で再現と修正を試み、問題を確認して簡単な直し方が見つかったときだけ口を開く。そうでなければ最後まで黙っている。[1] 記事の例では、グループがまだ対応を議論している間に、Super-agent が裏で修正 PR を出している。「能動」の意味がいちばんよく分かる例であり、いちばん事故を起こしやすい部分でもある。これはセキュリティのところで改めて触れる。

## 非同期 ReAct とチャネルに合わせた話し方

古典的な ReAct ループでは、モデルが同期的な `run()` を呼ぶとループが止まり、ツールが返るまで新しいメッセージは待たされる。記事は時間のかかるコマンドやサブタスクを非同期の `start()` と `stop()` に置き換える。`start()` を呼ぶとすぐに「開始した」が返り、ループは進む。裏の処理が終わると、結果は新しいイベントとしてセッションに届く。長すぎる処理は、モデルが文脈に応じて `stop()` で止められる。[1] 会話は半二重から全二重になり、表で話すことと裏で働くことが互いを妨げなくなる。この仕組みは DeepSeek Harness に実装済みだが、既定では有効になっていない。プロトタイプはもっと素朴な方法を使っていて、前面のシェルコマンドが 5 秒を超えるとバックグラウンドジョブに移す。[1][3]

もう半分は、出力をチャネルに合わせることだ。長い推論はすでに Worker の中に閉じ込められているので、残りはチャネルごとのプロンプトで調整する。IM では同僚のように、判断や受け入れが必要なときだけ話す。彼らのテストで効いた硬いルールの 1 つは、1 回の返信を 100 語以内にすることだった。GitHub やメールでは構造化し、PR の説明には問題、変更、検証結果をきちんと書く。[1]

プロトタイプはこの考え方を 1 つの原則にまとめている。**人の注意はできるだけ少なく使い、価値はできるだけ多く返す。** 依頼されたとき、またはチームが書いたルールが許すときだけ動く。誰かが行動しなければならないとき、または使える結果が出たときだけ話す。質問は一度に具体的なものを 1 つだけ。[4] この `000-philosophy.md` はリポジトリの中で最も真似する価値のあるファイルだと思う。チーム全体の代わりに働けるエージェントがノイズ源にならないためにはどうするか、に直接答えているからだ。

## 計算と状態の分離、そして Watchdog：止まらずに動き続けるために

ローカルのエージェントは、ループを回す計算、セッションの状態、実行環境を 1 台のマシンに束ねている。マシンがスリープすれば止まる。記事はこれを 2 段階で切り離す。[1]

1 段階目では、エージェントループの計算をクラウドのステートレスなコンテナに置き、セッションの状態はデータベースに保存する。コンテナはいつでも再起動や交換ができる。2 段階目では、実行環境はその場に残し、各デバイスには状態を持たずコマンドを実行するだけの軽量な daemon を置く。これが BYOM（Bring Your Own Machine）で、普段使っている開発マシンをクラウドのエージェントにつなげる。デバイスがオンラインに戻れば、クラウド側はそのマシンで待っていたタスクを自動で実行できる。[1]

記事は、これが Anthropic の「脳と手を切り離す」と同じ考え方だとはっきり書いている。Managed Agents はセッションログ、ハーネス、サンドボックスを分け、コンテナが落ちてもツール呼び出しの失敗として扱い、ハーネスが落ちてもログを読み直して再開する。[1][15] 違いは場面だ。Anthropic が語るのはマネージドサービスでオンデマンドに作るサンドボックスや顧客の VPC 内のリソースで、DeepSeek がまずつなぎたいのは、人が毎日使う個人のマシンだ。それはつながったり切れたりし、未コミットの変更やローカルの認証情報を抱えている。[1] この違いが、あとでセキュリティの問題になる。

動き続けるには、メインシステムの外にある制御ループも要る。記事の見立てに私も同意する。エージェントの障害の多くはプロセスのクラッシュではなく、モデルが無駄なループにはまったり、少しずつ目標から外れたりすることで、従来の死活監視では見えない。そこで彼らはメインシステムの外に、タイマーで動く Watchdog Session を置いた。API エラーへの対処に加え、各 Worker が実質的に進んでいるか、ずれていないかをモデルに判断させる。Watchdog 自体もツール一式を持つエージェントなので、保守担当者は何が起きたかを自然言語で尋ねられるし、稼働中のメインシステムのプロンプトやトリガー規則を書き換えさせることもできる。[1]

## 実験の数字をどう読むか

バッチ処理の負荷試験は前に触れたので、ここではエンドツーエンドのアブレーションを見る。グループチャットと GitHub CI のメッセージの流れで 4 つの方式を動かし、1 回あたり約 300 件のメッセージのうち約 20 件が作業依頼、残りは雑談、追加の指示、中止の依頼、CI の通知。コーディング作業は時間だけを消費するツールで代用し、各方式を 5 回ずつ走らせた。[1]

<figure class="not-prose my-6"><svg viewBox="0 0 680 360" role="img" aria-label="公式アブレーション：約 300 メッセージ、作業依頼 20 件、各方式 5 回" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:680px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor" fill-opacity="0.7"/></marker></defs><text x="10" y="24" font-size="15" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">公式アブレーション：約 300 メッセージ、作業依頼 20 件、各方式 5 回</text><text x="10" y="48" font-size="12" fill="currentColor" fill-opacity="0.85">タスク完了時間（分）  <tspan fill="#3b82f6">■</tspan> p50  <tspan fill="#ef4444">■</tspan> p95</text><text x="470" y="48" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.85">キャッシュ読み取り token（百万）</text><text x="10" y="78" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">Super-agent</text><rect x="10" y="84" width="124.0" height="14" rx="2" fill="#3b82f6" fill-opacity="0.85"/><text x="140.0" y="96" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">12.4</text><rect x="10" y="102" width="157.0" height="14" rx="2" fill="#ef4444" fill-opacity="0.8"/><text x="173.0" y="114" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">15.7</text><rect x="470" y="90" width="108.9" height="18" rx="2" fill="#8b5cf6" fill-opacity="0.75"/><text x="584.890625" y="104" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">23.23</text><text x="10" y="144" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">Super-agent（直送なし）</text><rect x="10" y="150" width="126.0" height="14" rx="2" fill="#3b82f6" fill-opacity="0.85"/><text x="142.0" y="162" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">12.6</text><rect x="10" y="168" width="155.0" height="14" rx="2" fill="#ef4444" fill-opacity="0.8"/><text x="171.0" y="180" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">15.5</text><rect x="470" y="156" width="148.9" height="18" rx="2" fill="#8b5cf6" fill-opacity="0.75"/><text x="624.921875" y="170" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">31.77</text><text x="10" y="210" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">単一 Session + Subagent（中立プロンプト）</text><rect x="10" y="216" width="204.0" height="14" rx="2" fill="#3b82f6" fill-opacity="0.85"/><text x="220.0" y="228" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">20.4</text><rect x="10" y="234" width="295.0" height="14" rx="2" fill="#ef4444" fill-opacity="0.8"/><text x="311.0" y="246" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">29.5</text><rect x="470" y="222" width="28.4" height="18" rx="2" fill="#8b5cf6" fill-opacity="0.75"/><text x="504.359375" y="236" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">6.05</text><text x="10" y="276" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">単一 Session + Subagent（委任優先プロンプト）</text><rect x="10" y="282" width="138.0" height="14" rx="2" fill="#3b82f6" fill-opacity="0.85"/><text x="154.0" y="294" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">13.8</text><rect x="10" y="300" width="290.0" height="14" rx="2" fill="#ef4444" fill-opacity="0.8"/><text x="306.0" y="312" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">29.0</text><rect x="470" y="288" width="50.7" height="18" rx="2" fill="#8b5cf6" fill-opacity="0.75"/><text x="526.71875" y="302" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">10.82</text><line x1="455" y1="60" x2="455" y2="330" stroke="currentColor" stroke-opacity="0.2"/><text x="10" y="348" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.7">コーディング作業は時間だけ消費するダミーツール。測っているのはスケジューリング。データ：参考 [1][9]</text></svg></figure>

*図：4 方式のタスク完了時間とキャッシュ読み取り token（Super-agent の 2 つの token 数は記事本文、それ以外は記事の結果表の画像から）[1][9]*

Super-agent は p50 が 12.4 分、p95 が 15.7 分だった。単一 Session に Subagent ツールを持たせ、中立的なプロンプト（「適切なときに subagent を使う」）を与えた方式は p95 が 29.5 分に達した。理由が面白い。5 回の実行で、モデルは **一度も** Subagent を呼ばなかった。すべての作業がメインセッションで行われ、新しいメッセージに何度も割り込まれた。委任を優先するプロンプトに変えると、5 回中 4 回は委任し、p50 は 13.8 分と Super-agent に近づいた。残りの 1 回はモデルが作業を「小さい」と判断して自分でこなし、p95 は 29.0 分のままだった。[1][9]

このデータで最も価値があるのは「2 倍近く速い」ことではないと思う。多くの人が現場で感じていたことを裏づけた点だ。**委任するかどうかをプロンプトでモデル自身に決めさせるのは不安定だ。** モデルは毎回「自分でやるか、渡すか」を判断し、自分でやる方に傾く。二層構造はこの判断をモデルから取り上げる。Router は具体的な作業を一切せず、Worker は購読した Thread のメッセージしか受け取らない。プロンプトの代わりに構造で決める、という教訓は Super-agent よりずっと広く使える。

コストもはっきり書かれている。Super-agent の 1 回の実験でのキャッシュ読み取り token は 2323 万、中立プロンプトの単一 Session 方式は 605 万で、約 3.8 倍だ。[1][9] token を払って、短く安定した完了時間を買っている。購読による直送をやめると完了時間はほぼ変わらないが、Router の判断回数は約 30% 増え、キャッシュ読み取り token は 2323 万から 3177 万へ約 37% 増えた。[1] 直送は速さのためではなく、Router の負担を減らすためのものだ。

負荷は合成で、コーディングは偽物で、どのモデルを使ったかも公表されていない。[1][9][10] だからこの数字が示すのは「この層構成はノイズの多い入力でも安定する」ことであって、「あなたのリポジトリでバグをもっと直せる」ことではない。

## プロトタイプと記事のあいだの距離

コミュニティの反応は示唆的だ。Reddit の r/singularity でアーキテクチャを紹介した投稿は 900 以上の賛成票を集めたが、Hacker News の投稿にはほとんど議論がついていない。[12][11] 中国語圏の議論はもっと活発で、ある開発者は X で、この考え方は Slack の Claude Tag にほぼ相当し、例は主に「Feishu のグループチャットと GitHub のあいだでタスクを進め続ける」ものだと書いている。[13]

[![X ユーザー @lijiankuan の投稿のスクリーンショット。DeepSeek Harness チームが super-agent プロトタイプを公開し、考え方は Slack の Claude Tag に相当するとしている](/assets/deepseek-super-agent-router-worker-architecture/x-lijiankuan-post.webp)](https://x.com/lijiankuan/status/2116565847967924286)

*スクリーンショット：X での @lijiankuan による Super-agent への言及。添付画像は公式記事の冒頭（2026-11-02 撮影）[13]*

実際にインストールした人たちの結論はおおむね一致している。設計は学ぶ価値があるが、インストールと耐障害性はまだ準備ができていない。[9] ある人は Node.js 24 でサービススクリプトが自分のプロセスを見つけられないことに気づいた。Node 24 はメインスレッドの名前を `MainThread` に変えたので、`ps` に `node` が出なくなり、サービスが動いているのに `status` は停止中と報告する。GitHub の通知の時間窓とカーソルの組み合わせに問題があり、遅れて届いたメンションが永久に失われることも見つけた。一晩かけた別の人は「考え方は大好き、インストールは大嫌い」とまとめた。プラグインのバージョンが合わないだけで DSH の Web 画面全体が起動しなくなる。Ubuntu でプライベートリポジトリにつなぎ、Issue から PR まで通した人もいるが、届かない通知を回避するために `observeIssues` と `observeComments` を有効にする必要があった。[9]

もっと注意すべきは権限だ。デプロイ文書ははっきり書いている。Router も Worker も操作者の OS ユーザーとして `danger-full-access` で動き、Worker はパス指定でプログラムを実行でき、ホームディレクトリも読める。アカウントのラッパーは認証情報を切り替えるだけでプロセスは隔離しない。隔離したければ、エージェントの認証情報だけを置いた専用の OS アカウントを使う。[6] 独立したセキュリティ監査は 2 つの問題を報告した。ローカルの管理 API は Host と、文書で公開されているリクエストヘッダー `x-orchestrator-request: 1` しか確認しないため、ローカルのポートにつながるプロセスなら誰でも CLI のパスや許可リストを書き換えられる。また、同じバッチの中で拒否されたメッセージが、許可リストのメンバーの権限を「借りて」チケットを作れてしまう。11 月 1 日時点で上流は修正していない。[9]

救いは、プロトタイプの既定値が保守的なことだ。能動的な作業は既定で `observe` モードになり、エージェントは「本来なら引き受けた」ものを記録するだけで実行しない。チームは記録を見てから `auto` に切り替えるかを決める。明示的な依頼はどのモードでも有効だが、依頼者は許可リストにいなければならない。[5] これは設計全体でいちばん現実的な一手だと思う。エージェントはまず判断が確かなことを示し、それから手を動かす権利をもらう。

## 2026 年のエージェント地図に置いてみる

「常駐、複数人、能動」を狙ったのは DeepSeek が最初ではない。主なものを並べると、方向が収束しているのが見える。

| システム | 入口 | 誰が動くと決めるか | どこで動くか | 形態 |
|---|---|---|---|---|
| DeepSeek Super-agent [1][3] | Feishu、GitHub | 明示的な依頼、またはチームのルールとモデルの判断（既定は記録のみ） | クラウドのループとデバイスの daemon。プロトタイプはローカル | 設計記事と MIT プロトタイプ |
| Anthropic Claude Tag [16][17] | Slack チャネル | @Claude、または ambient モードで自発的に追跡 | Anthropic がホスト | 商用製品（Team・Enterprise 向けベータ） |
| GitHub Copilot coding agent [18] | Issue を Copilot に割り当てる | 人が割り当てる | GitHub がホストする環境 | 商用製品 |
| OpenAI Codex の GitHub 連携 [19] | PR コメントの `@codex review` | 人がメンション、または自動レビュー | OpenAI のクラウド | 商用製品 |
| Anthropic Managed Agents [15] | API | 開発者が自分で組む | オンデマンドのサンドボックス | ホスト型インフラ |

いちばん近いのは Claude Tag だ。Anthropic の 6 月の発表によれば、Slack のチャネルには Claude が 1 つだけいて全員と話し、誰でも前の人の続きから話を引き継げる。チャネルを追いながらコンテキストを蓄え、ambient モードを有効にすれば、誰も決着をつけていない話題を自分から追いかけ、数日にわたる作業を自分で予定に入れて進める。[16] 8 月の更新では、会話全体を読んでいつ口を挟むかを自分で決められるようになった。[17] Anthropic は、自社のプロダクトチームのコードの 65% が社内版 Claude Tag によるものだとも述べている。[16]

並べてみると、連続、能動、持続がほぼ 1 対 1 で対応する。「似た設計制約は似たアーキテクチャに行き着く」という記事の一文は、ここで裏づけられている。[1] 違いは出し方だ。Anthropic は調整済みの製品を売り、内部の層構成は公開していない。DeepSeek は層構成、ルーティング、実験データ、負けた比較対象まで広げて見せ、手を入れられるコードも付けた。チーム用のエージェントを自分で組みたいなら DeepSeek の資料の方が役に立つし、明日から Slack で信頼できるアシスタントを @ したいだけなら Claude Tag の方が手間がかからない。

Bloomberg はこれを「Claude Code への挑戦」と書いたが、要点を外していると思う。[7] Claude Code は単一セッションの道具で、Super-agent が論じているのはその上の層だ。両者は積み重なる関係で、置き換えではない。記事自身も、Worker の中で Subagent を開いてもいいし、Worker 自体が Agent Team でもいいと書いている。[1]

## どう見るか

真似する価値があるのは 4 つ。Router は作業をしない、つまりプロンプトではなく構造で分業を保証する。Thread の購読と直送で、後続のイベントに中央のノードを迂回させる。外部の Watchdog が見るのは生死ではなく進捗。能動的な振る舞いはまず `observe` で始め、証拠が揃ってから解放する。どれも DeepSeek Harness に依存しない。

次に、解決していないこと。記事の第 8 節は 4 つの未解決課題を挙げていて、いちばん重いのはセキュリティだと思う。[1] イベント駆動ということは、エージェントへの入力がもう信頼できる操作者からだけ来るわけではないということだ。公開リポジトリにコメントできる人、そのグループにいる人なら誰でも、フル権限で動く Worker のコンテキストに文字を送り込める。このサイトの[プロンプトインジェクションのサーベイ（英語版）](/blog/prompt-injection-2026-survey-self-replicating/)で扱った攻撃経路は、ここではほぼすべて成り立つ。記事自身も認めている。クラウドのエージェントループが侵入やインジェクションを受ければ、つながっているデバイスはすべて乗っ取られうるし、デバイス側の認証情報がモデルのコンテキストに入れるなら、通常の実行中にも漏れうる。[1] Anthropic は Managed Agents で、生成コードが動くサンドボックスからトークンに決して届かないようにしている。[15] DeepSeek の BYOM がつなごうとしているのは、まさに認証情報だらけの個人マシンで、問題はもっと難しくなる。

残りの 3 つも答えが出ていない。数か月動かしたあとの長期記憶をどうするか。Session がチャット画面と 1 対 1 で対応しなくなったとき、タスクをどう見せ、人が途中でどう割り込むか。チームの Super-agent と各自の個人アシスタントは権限の境界が違うが、両者はどう安全に協力するのか（A2A、エージェント間協調）。[1]

最後に実際的な問い。いま入れるべきか。常駐、マルチタスク、イベント駆動のエージェント設計を研究したい、あるいはプライベートなテスト用リポジトリに「当番エージェント」を置きたい、そして自分でトラブルを追う気があるなら、入れる価値はある。専用の OS アカウントを使い、プライベートリポジトリだけにつなぎ、許可リストは最初は自分だけにする。すぐ使えるものが欲しい、あるいは本番や公開リポジトリにつなぐつもりなら、まだ勧めない。DeepSeek 自身も勧めていない。[3][9]

入れるかどうかに関係なく、記事は一度読む価値がある。いちばん説得力があるのは個々の仕組みの巧みさではなく、出発点だ。モデルはもう人が見張らなくても仕事をこなせるようになりつつあり、次に節約すべきは人の注意力だ。その目標に向けて設計すれば、Router、購読、バッチ処理、計算と状態の分離、Watchdog という古い道具に自然と行き着く。記事の結びには、新しい理論は提案しておらず、計算機システムの古典的な考え方をエージェントに当てはめただけだとある。[1] まさにそこに、この記事の価値があると思う。

## 参考文献

1. DeepSeek Harness チーム「Super-agent 设计探索：迈向更自主的 Agent 系统」WeChat 公式アカウント、2026-10-31：<https://mp.weixin.qq.com/s/zoS7GlReWPhfCjENGxXCdg>
2. 同記事の英語全訳「Exploring Super-agent Design: Toward More Autonomous Agent Systems」offloop.org：<https://offloop.org/learn/exploring-deepseek-super-agent-design>
3. deepseek-ai/dsh-superagent-prototype、README：<https://github.com/deepseek-ai/dsh-superagent-prototype>
4. dsh-superagent、`docs/000-philosophy.md`：<https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/docs/000-philosophy.md>
5. dsh-superagent、`docs/002-authorization.md`（observe モード）：<https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/docs/002-authorization.md>
6. dsh-superagent、`docs/006-deployment.md`（権限と隔離）：<https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/docs/006-deployment.md>
7. Bloomberg、Debby Wu「DeepSeek Drops Enhanced Coding Agent With Aim to Rival Anthropic」2026-11-01：<https://www.bloomberg.com/news/articles/2026-11-01/deepseek-drops-enhanced-coding-agent-with-aim-to-rival-anthropic>
8. South China Morning Post、Ben Jiang「DeepSeek unveils AI 'super agent' in coding race with OpenAI, Anthropic」2026-11-01：<https://www.scmp.com/tech/article/3372884/deepseek-unveils-ai-super-agent-coding-race-openai-anthropic>
9. AI Code With、DeepSeek Super-agent のレビュー（完全な結果表、GitHub ディスカッション #11700・#11706・#11714、独立セキュリティ監査のまとめを含む）2026-11-01：<https://aicodewith.ai/en/blog/deepseek-super-agent-review-dsh-superagent>
10. DEV Community「DeepSeek's dsh-superagent is a proactive coding agent that waits to be asked」：<https://dev.to/piekwerk/deepseeks-dsh-superagent-is-a-proactive-coding-agent-that-waits-to-be-asked-router-tickets-and-o8m>
11. Hacker News「DeepSeek open-sources dsh-superagent, a coding agent largely built by agents」：<https://news.ycombinator.com/item?id=50316116>
12. ainews radar、dsh-superagent の拡散タイムライン（r/singularity と HN の反応を含む）：<https://ainews.leverageai.com.au/case/deepseek-dsh-superagent-prototype>
13. X、@lijiankuan、2026-10-31：<https://x.com/lijiankuan/status/2116565847967924286>
14. IT之家「DeepSeek 提出 Super-agent 架构设计」：<https://www.ithome.com/1/020/615.htm>
15. Anthropic Engineering「Scaling Managed Agents: Decoupling the brain from the hands」：<https://www.anthropic.com/engineering/managed-agents>
16. Anthropic「Introducing Claude Tag」2026-06-23：<https://www.anthropic.com/news/introducing-claude-tag>
17. VentureBeat「Anthropic's new Claude Tag update lets its Slack agent read the full conversation and jump in unprompted」：<https://venturebeat.com/orchestration/anthropics-new-claude-tag-update-lets-its-slack-agent-read-the-full-conversation-and-jump-in-unprompted>
18. GitHub Docs「Kick off a task with Copilot agents on GitHub」：<https://docs.github.com/en/copilot/how-tos/copilot-on-github/use-copilot-agents/kick-off-a-task>
19. ChatGPT Learn「Review GitHub pull requests with Codex」：<https://learn.chatgpt.com/docs/third-party/github>
