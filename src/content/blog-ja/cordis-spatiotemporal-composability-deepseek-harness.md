---
title: 'Cordis 徹底解説：プラグインのライフサイクルと DeepSeek Harness'
pubDate: 2026-08-23T00:00:00.000Z
description: 'Cordis のプラグインシステム、カーネル、撤回可能な effect、反応式 coeffect、時空可組合せ性、および DeepSeek Harness・Koishi・Shigma・Cordis v4 との実際の関係をゼロから解説する。'
author: 'Remy'
tags: ['cordis', 'agent-harness', 'plugin-system', 'spatiotemporal-composability', 'agent-loop']
lang: 'ja'
translatedFrom: 'cordis-spatiotemporal-composability-deepseek-harness'
---

ユーザーにサービス中の AI Agent を想像してほしい。そこに「ウェブ調査」ツールプラグインがある：プラグインはツール登録表にツールを登録し、セッションイベントを購読し、一分ごとにキャッシュを更新し、大規模言語モデルサービスの参照も握っている。いま管理者がプロセスを再起動せず、モデル提供者を LLM-A から LLM-B に換え、その後この調査プラグインをアンインストールしたい。

プラグインを載せることは難しくない。一度の `import`、一度の `register`、あるいは YAML に一行足せば足りる。本当に難しいのは去ることだ：ツール名は消した。古いタイマーはまだ動いているか？イベントリスナーはまだプラグイン閉包を握っているか？進行中の非同期リクエストはどうする？先に LLM-A を閉じると、調査プラグインのクリーンアップが最後の状態を提出するのにまだそれを使う——そのときはどうする？

これが動的プラグインシステムでしばしば過小評価される半分だ。私たちは「どう拡張するか」を語るのは上手いが、コンポーネントにこう答えさせることは少ない：**あなたは何を変え、誰に依存し、去るときにシステムを「あなたが来なかったかのように」戻しつつ、他コンポーネントが後から加えた変更は残すのか？**

Cordis はこの問題を二軸に分ける。時間軸は、コンポーネントが去るときに自分の影響を撤回できるかを問う；空間軸は、依存関係が変わるとき、誰が先に止まり、誰が再起動でき、誰が待たねばならないかを問う。論文 *A Programming Paradigm for Spatiotemporal Composability* はそれぞれを **revertible effects（撤回可能な効果）** と **reactive coeffects（反応的な余効果）** で記述し、両者をランタイム `Context` に統一する。DeepSeek Harness はこの仕組みを Agent のモデル・ツール・セッション・ループ・サンドボックス・UI の組み立てに使う。

> **90秒の答え：** Cordis は 2022 年に始まり、TypeScript で実装され JavaScript パッケージとして公開された meta-framework（メタフレームワーク）だ。それは「Agent がどう考えるべきか」を規定せず、動的コンポーネントがどうマウントし、依存を宣言し、影響を登記し、アンロードし、再編成するかを規定する。Cordis v3 は長く Koishi を支え；2026 年のプレプリントは v4 でその組合せセマンティクスを体系化した。DeepSeek Harness は Cordis の別名ではなく、Cordis 駆動の Agent Harness だ：Cordis ソースを倉庫へ vendor し、`@deepseek-ai` 名前空間へ再マップしローカル改変を加え、Agent 製品の大半の能力をプラグインとして実装する。以下の版事実は 2026-08-23 までのものだ。

## Cordis、論文、DeepSeek Harness は結局どんな関係か

まず、よく混ざる名前を分ける。

**Cordis** は上流プロジェクトで、倉庫は [`cordiverse/cordis`](https://github.com/cordiverse/cordis) にある。Context、プラグインライフサイクル、サービス、イベント、依存解決、effect 追跡、Loader/HMR などの組合基盤を提供する。npm パッケージ名は [`cordis`](https://www.npmjs.com/package/cordis) で、パッケージメタデータの著者は Shigma。倉庫は TypeScript；消費者が動かすのはコンパイル後の現代 JavaScript で、TypeScript 型宣言も得られる。

**Cordis v4** は論文の形式モデルと DeepSeek Harness vendor コードが属する大バージョン線だ。本稿スナップショット時点で、上流 npm の最新マークは `4.0.0-rc.8` であり、なお RC（release candidate、リリース候補）で、API が凍結された安定終点ではない。

**DeepSeek Harness**、コマンド名 `dsh`、は DeepSeek-AI がオープンソースにした Agent Harness だ。ここでの harness は狭義の「テスト治具」ではなく、モデルの外で Agent を実際に働かせる実行基盤：モデル接入、プロンプト、ツール、セッション、権限、サンドボックス、ストレージ、実行ループ、回復、スケジューリング、UI を担う。公式は関係式 `Agent = Model + Harness` で要約する。[製品ページ](https://deepseek.com/harness/en/)と[固定スナップショットのアーキテクチャ文書](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/architecture.md)は、モデルアダプタ、ツール登録表、セッションログ、Agent loop もプラグインが提供すると明記する。

**`@deepseek-ai/cordis`** は Harness が自身の公開のために vendor・改名・改変した版であり、無関係な新規実装ではない。Harness は上流 Cordis と若干の基礎パッケージを monorepo に複製し、監査・版固定・パッチを可能にする；`cordis` は `@deepseek-ai/cordis` へ、`@cordisjs/plugin-loader` は `@deepseek-ai/cordis-plugin-loader` へ再マップされる。[`vendor/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/vendor/README.md) はライフサイクル補強、トランザクション式 Loader/Include 調和、HMR watcher、惰性設定解析などのローカル変化を列挙する。

三つの版番号は分けて見る必要がある：本稿スナップショット時、上流 npm は `cordis@4.0.0-rc.8`；Harness vendor 目録が記録する出典はおよそ上流 `4.0.0-rc.7`；DeepSeek が公開した再マップパッケージは `@deepseek-ai/cordis@4.0.1`。それぞれ上流現行版、複製された出典スナップショット、下流公開系列を表し、単純な昇級線には並べられない。

**論文**の正式名は *A Programming Paradigm for Spatiotemporal Composability*、署名は Yifan Shi、Wei Zhang、Tianyi Cui、機関は北京大学と DeepSeek-AI。現在照合できる版は 2026-08-13 の 88 ページ草稿だ。論文倉庫はそれを継続改訂の preprint（プレプリント、すなわち著者公開だが正式な査読完了を意味しない手稿）と明記する；本稿調査時点で DOI、arXiv 条目、会議・期刊メタデータ、機械証明産物はない。したがって下文は「論文が提案する」「手稿が証明する」と書き、「学界がすでに検証した標準」とは書かない。[論文 README](https://github.com/cordiverse/paper/blob/13f28585668a28106b2f53bedada36e45bc1ed3e/README.md)と[固定スナップショット PDF](https://github.com/cordiverse/paper/blob/13f28585668a28106b2f53bedada36e45bc1ed3e/paper.pdf)が本稿の主な理論出典だ。

最後に **Koishi**。それは Cordis 上に立つチャットボット応用フレームワークであり、Cordis の旧名ではない。論文は Koishi が約四年で 4,000 超のコミュニティプラグインを形成したと報告し、このモデルが開放生態を支えてきたことを示す；だが Koishi が現在使うのは Cordis v3 で、事例は単一生態・単一宿主言語下の観察的採用であり、Cordis v4 の制御された性能実験ではない。

時間線もしたがって明確だ：npm `cordis@0.1.0` は 2022-04-21 に公開され、現 GitHub 倉庫オブジェクトは 2022-05-17 作成；v3 は 2023〜2024 年に継続公開；v4 は 2024 年末から alpha、beta、RC を経る；論文と Harness 倉庫オブジェクトは 2026-08-13 に現れ、Harness は 8 月中旬に developer preview（開発者プレビュー）へ入る。より正確な物語は「DeepSeek が 2026 年に Cordis を発明した」ではなく：**四年進化したメタフレームワークが 2026 年に体系形式化され、DeepSeek Harness によって Agent ランタイム場面へ持ち込まれた**ことだ。

```text
Cordis v3 ───────────────> Koishi（本番エコシステム，論文報告 4,000+ プラグイン）
    │
    └─進化して Cordis v4 ──> 論文中の形式モデル
                         └─vendor / rescope / patch
                           └─@deepseek-ai/cordis
                             └─DeepSeek Harness プラグイン木
```

## 静的組合から動的組合へ：なぜ突然難しくなるのか

**組合（composition）** はより小さな部品でより大きなシステムを組み立てることだ。関数 `f(g(x))`、モジュール `import`、コンストラクタ注入はいずれも組合に属する。それらは通常、安定した境界を持つ：コードはコンパイル期または起動期に誰が誰を呼ぶかを決め、資源解放は関数戻り・語彙作用域終了・プロセス全体退出によって起こる。

**動的組合（dynamic composition）** は時間を加える：コンポーネントは長寿命プロセスの運行中に加入・離脱・設定変更・実装変更できる。ここでの **component（コンポーネント）** は独立ライフサイクルを持ち能力を貢献できる単位；**plugin（プラグイン）** はコンポーネントの一種のパッケージと組立形態だ。Cordis はしばしばプラグイン関数またはオブジェクトをコンポーネント定義とみなし、実際の各マウントごとに実行インスタンスを作る。

システムが粗粒度再起動を許すなら、多くの問題はプロセス境界に代行される。プロセスが死ねば OS がメモリ・ファイル記述子・スレッドを回収し；コンテナオーケストレータが新設定でインスタンスを立ち上げる。しかし Agent Harness はしばしば長いセッション、ストリーミング応答、ツール状態、複数の並行タスクを保持し、頻繁な再起動のコストは高い。Cordis が注目するのは**同一 JavaScript プロセス内のコンポーネント粒度**：影響を受けたプラグイン部分グラフだけを置き換え、他のセッションと能力は続けて動かす。

このとき問題は自然に二つの互いに独立な次元に分かれる：

| 次元 | それが問う問題 | 失敗例 |
| --- | --- | --- |
| 時間可組合せ性（temporal composability） | コンポーネントが去ったあと、ライフサイクル中に及ぼした影響を撤回できるか？ | ツール名は消えたが timer、listener、接続は残る |
| 空間可組合せ性（spatial composability） | 同時に存在するコンポーネントがどう依存を宣言・解決し、依存トポロジ変化時に協調するか？ | LLM-A は置き換わったが、消費者は旧 provider 参照を握っている |
| 時空可組合せ性（spatiotemporal composability） | 二軸は同時に成り立つか？ | provider が撤出するとき、消費者は先に安全にクリーンアップし、新 provider で再構築する |

ここでの「時間」は時系列データベースではなく、「空間」も地理座標ではない。時間はライフサイクル前後を指し；空間はランタイム依存グラフ中の関係位置を指す。クリーンアップだけでは provider のホットリプレースは解けず、サービス発見だけではイベントリスナーは消えない。論文の価値は、それらを「プラグインがホットロードを支える」の一言に混ぜず、それぞれ仕組みを見つけ、どう合成するかを示す点にある。

開場の調査ツールプラグインを続ける。それは `llm` と `tools` の二つの能力を必要とし、起動後に四つの影響を生む：ツール登録、メッセージ購読、キャッシュ timer 開始、ネットワーク接続開放。正しい動的変化はこうだ：

```text
llm がまだ存在しない -> プラグインは待つ
LLM-A が現れる   -> プラグインが活性化し、四つの影響を登記
LLM-A が撤出する   -> プラグインが先に停止し、逆順に四つの影響をクリーンアップ
LLM-B が現れる   -> 同一コンポーネント定義が新しい運行 episode を生成し、LLM-B にバインド
プラグインが削除される   -> クリーンアップ完了。登録表にツール・リスナー・timer を残さない
```

**episode（運行断片）** はあるコンポーネントが、解決済み依存の一組の下で活性化から停止までの一度の完全な経験を指す。provider の身分が変われば、新旧オブジェクトの値が同じに見えても、新しい episode を開くべきだ；さもなければ非同期過程が同一活性化の前半で A、後半で B を使い、推論不能な混合状態になりうる。

### 一見足りそうで、実際は半分しか解けない三つの案

第一の案は「すべてのプラグインが `stop()` を実装する」。それはアンロード入口を作るが、**所有権**は立てない。プラグインが第三者ライブラリを呼び、ライブラリがさらに listener を登録したら——その登録はどのインスタンスに属するか？プラグインが途中で例外を投げたら、どの資源がすでに生じたか？同一プラグインの二インスタンスが並存するとき、`stop()` はどちらを清めるべきか？ランタイム帰属と段階的 accumulator（累算器）がなければ、大きな stop 関数は著者自身が実行履歴を再構築するしかない。

第二の案は「グローバル Service Map を使い、provider が変わったら key を上書きする」。新呼び出しは B を読むが、すでに閉包で A を捕えた consumer は変わらない。より危険なのは、旧 provider をいつ閉じられるかの答えがないことだ：即座に閉じれば consumer クリーンアップが中断され；永遠に閉じなければ資源が漏れ；`serviceChanged` をブロードキャストすれば正しい順序が各プラグイン著者に押し付けられる。サービス発見は「いまどこを探すか」を解くが、「かつて探した者がどう退出するか」を自動では解かない。

第三の案は「ホット更新が失敗したらプロセスを再起動する」。開発サーバ、小型 CLI、無状態 worker では、これはしばしば最も経済的な選択であり、貶めるべきではない。だが多セッション Agent、IDE 拡張宿主、ボットゲートウェイを載せる長期プロセスでは、全体再起動は一つのプラグインの局所変化を全ユーザーの中断に増幅する。より細粒度の回復は、再起動コストが本当に高いときだけ価値がある；Cordis が解くのはこの種のシステムであり、すべてのプログラムの動的化を要求しない。

もう一つ混同しやすい技巧は「すべてを冪等にする」。**Idempotence（冪等性）** は同一操作を繰り返しても、一度実行した結果と同じであることを指す。それは再試行を和らげうるが、可撤销には等しくない：`register('tool')` を繰り返しても第二項目は増えないが、アンロード時に第一項目を消すべきかが分かるわけではない；削除は別 owner の同名貢献を誤って傷つけることもある。冪等は identity と ownership があってはじめて正しい recovery に参加できる。


## 時間次元：撤回可能な Effect がコンポーネントを本当に去らせる方法

**Effect（効果）** はプログラムが環境に及ぼす変更だ。登録表の変更、イベント購読、接続開放、timer 作成、サービス提供はいずれも effect；それは非同期専用でも、特定 npm パッケージの名前でもない。伝統的な effect system は型層で「関数が何をしうるか」を記述することが多いが、Cordis がより関心を持つのはランタイム：この具体プラグインインスタンスが何をしたか、去るときに誰が撤回するかだ。

最も素朴なやり方はプラグインに `activate()` と `deactivate()` を書くことだ。問題は二段のコードが遠く離れており、資源を一種足すときにアンロード論理の更新を忘れやすいこと；途中で例外を投げたとき、`deactivate()` もどのステップが完了したかを知らないかもしれない。撤回可能な effect は取得と解放を同じ場所に置く：

```ts
ctx.effect(() => {
  const timer = setInterval(refreshCache, 60_000)
  return () => clearInterval(timer)
})
```

ここで返るクリーンアップ関数はしばしば **disposer（処置器）** または **inverse（逆操作）** と呼ばれる。Cordis は timer をどう撤回すべきかを推測しない；著者が timer を作る同じ場所で `clearInterval` を与え、ランタイムが disposer を現在のプラグインインスタンスに帰属させ、集め、正しい時機に呼ぶ。上流実装は固定スナップショットの [`fiber.ts`](https://github.com/cordiverse/cordis/blob/8cc9e33fab69e2d0476d126baaf2acb24e6a6ab4/packages/core/src/fiber.ts#L275-L337) で確認できる。

なぜ inverse と呼ぶのか？正向変化を `f`、クリーンアップを `g` とする。論文は `g(f(c)) = c` だけを要求する：状態 `c` 上で `f` をしたあと、`g` がこの一度の変更を撤回できる。これは **left inverse（左逆）** であり、先に `g` をしてから `f` することに意味があるとは要求しない。設定を更新するとき、inverse は実行瞬間の旧値を覚えねばならず；ファイルを開くとき、今回得たハンドルを覚えねばならない。論文はこの「実入力状態上で逆操作を選ぶ」形式を **witnessed effect（証跡付き効果）** と呼ぶ。証跡は神秘的な証明オブジェクトではなく、今回の操作が残した具体的な回復情報だ。

複数の effect は LIFO（last in, first out、後入れ先出し）で撤回しなければならない。プラグインが先に接続 A を開き、その上で購読 B を登録したとする。アンロード時は先に B を取り消し、その後 A を閉じる：

```text
forward:  open(A) -> subscribe(B) -> start(C)
inverse:  stop(C) -> unsubscribe(B) -> close(A)
```

これはスタック展開、`try/finally`、RAII（resource acquisition is initialization、資源取得即初期化）と同じ直感を持つ。だが `try/finally` のライフサイクルは語彙コードブロックが決め；Rust の RAII は通常、値が静的作用域を離れることで発火する；Cordis のプラグインは数日動き、終了境界は設定変化・依存撤出・HMR が決める。それは語彙範囲で成熟した取得/解放規律を、動的コンポーネントのライフサイクルへ引き上げる。

コンポーネント横断の交差はさらに難しい。A、B が同じ集合に独立項目を足すとする：A が `tool-a`、B が `tool-b`。実行順は A、B で、A だけを撤回したあとも B は残るべきだ。論文は **independence（独立性）** でこの前提を述べる：双方の正向・逆向操作は交換可能であるべき；B は A が当初どの inverse を選んだかを変えるべきでない；操作に戻り値があるなら、B は A の観察可能な結果も変えてはならない。二つのプラグインが厳密な順序を持つ middleware 鎖を同時に変更するなら、それらはしばしば独立ではなく、任意に一つを引き抜けると偽ってはいけない。正しいやり方は順序を明示依存へ引き上げるか、より上層のコンポーネントに鎖全体の書き換えを所有させることだ。

「回復」もメモリを bit 単位で元へ戻すことを要求しない。論文は **observational equivalence（観察同値）** を使う：外界が公開 Context 操作で二つの状態を区別できなければ同値とみなす。二つのルートが内部 Map の反復位置を変えても、key 照会結果が全く同じなら同値でありうる；middleware 順序がリクエスト結果を変えるなら同値ではない。同値関係はサービスインターフェースの語義が決め、Cordis が自動推論するのではない。

最も重要な境界は：**撤回可能であることは、すべての副作用が自動ロールバックされることではない。**

- `open/close`、`add/remove listener`、`set/restore old value` は通常、本物の inverse を与えられる。
- すでに送ったメール、ネットワークパケット、引き落とし、すでに人が見たメッセージは system boundary（システム境界）を越え、歴史を消せない。
- こうした emission（外へ発する行為）は確認点まで遅延して提出するか、compensation（補償動作）——返金、逆向き帳簿の追加——を設計できる；補償は業務同値を立てるだけで、物理世界の復元は保証しない。
- プラグインが `ctx` を迂回して Node.js グローバル状態を直接変えれば、ランタイムは見えず、追跡もできない。
- Cordis は著者が与えた inverse を組合せて呼ぶだけで、`clearWrongTimer()` のようなクリーンアップ論理が正しいことを証明しない。

したがって時間可組合せ性は「cleanup callback がある」の一言では終わらない。それは工学規律だ：影響は観察可能な境界を通り、取得時に十分な回復証跡を生成し、コンポーネント内は逆順クリーンアップし、コンポーネント間は独立または明示順序のときだけ局所撤回できる。

### 半分まで読み込んで失敗したとき、累算器がなぜ重要か

`apply` に四ステップがあるとする：ツール登録、イベント購読、接続開放、定時タスク開始。第三ステップで接続が失敗し、第四は起こらず、だが前二はすでに共有環境を変えている。「四ステップすべて成功した」と仮定する `deactivate()` だけを呼ぶと、存在しない接続に触れるかもしれず；何もしなければツールと listener が残る。

**Recovery accumulator（回復累算器）** は各ステップ成功時にすぐ inverse を追記する。失敗時、どの行まで実行したかを推測する必要はなく、現累算器を展開するだけだ：先に listener を取り消し、次にツールを外す。接続は作られたが後続認証が失敗したなら、接続ステップもハンドル取得直後に close を登記すべきで、初期化関数全体の戻りを待ってはいけない。資源ライフサイクルの关键境界は「資源がいつ事実になったか」であり、関数がいつ成功を宣言したかではない。

非同期初期化は **effect iterator（効果イテレータ）** としても理解できる：各ステップが新状態、本ステップの inverse、後続 continuation（継続計算）を生む。ランタイムはすでに着地した貢献を段階的に累積する。依存変化や取消信号が来たとき、まだ出していないステップは起動しなくてよい；すでに出したステップは現実の慣性を持ち、完了してからロールバックする。このモデルは Promise が強制取消できると仮定するより正直だ——JavaScript の `await` 自体は、すでに送ったネットワークリクエストを回収しないから。

クリーンアップも失敗しうる。接続クローズの例外、第三者ライブラリによる購読取消の拒否は、「精確回復」を具体実装で失効させる。堅牢なプラグインは少なくとも：disposer をできるだけ冪等に；単一クリーンアップ失敗が他の独立資源の試行を止めない；失敗を Fiber と effect タグ付きで構造化ログへ；必ず成功すべき外部補償には再試行・デッドレター・人手修復を立てる。論文は失敗なし等の前提で最強性質を論じ、工学システムは失敗を診断可能な状態として扱わねばならない。

### System boundary は天然に存在する線ではない

「システム境界内は回復可能」でも、アーキテクトが境界を選ぶ必要がある。メモリ Map は明らかにプロセスが制御する；データベースが未コミットのトランザクションを使うなら、より大きな原子境界に入れられる；外部消費者がすでに読んだ Kafka メッセージは通常回収できない。同じ業務動作でもプロトコルが違えば可逆性は違う。

よくある戦略は三類だ。**Withholding（出力保留）** は内部で結果を用意し、コンポーネント episode 確認後に初めて外へ提出する；**idempotent retry（冪等再試行）** は同一業務 key の再送を許しても二重引き落とししない；**compensation（補償）** は語義が逆の動作——返金や取消イベント公開——を追加する。それらはプラグイン disposer が発火しうるが、正しさは外部プロトコルから来て、`ctx.effect` という関数名からではない。記事とコードレビューは、各 effect がどの回復語義を採るかを明記すべきだ。

## 空間次元：反応的な Coeffect が依存を自動再接続する方法

effect が「プログラムが環境に何をするか」なら、**coeffect（余効果）** は「環境がプログラムに何を与えねばならないか」だ。データベース接続、設定、ファイルシステム能力、ツール登録表、LLM provider はいずれもコンポーネントが環境から読む条件だ。一対の矢印で覚えられる：

```text
effect:   program -> world   プログラムが世界を変える
coeffect: world -> program   世界がプログラムに条件を与える
```

普通の依存注入（dependency injection、DI）は起動時に完了することが多い：コンテナがインターフェースで実装を見つけ、オブジェクトを構築し、そのバインドがずっと有効だと仮定する。Service locator（サービスロケータ）はコードがいつでもグローバル表からオブジェクトを取れるが、すでに取った消費者に「手元の provider は失効した。先に退出して新 provider で再構築せよ」と伝える責任は通常持たない。

**Reactive coeffect（反応的な余効果）** は依存宣言を一度きりの起動検査から継続制約へ変える。プラグインは `inject` で必要な service keys（サービス鍵）を宣言し；共有 Context が変わるたびにランタイムが条件を再計算する：

- 以前は満たさず、いま満たす → **activating**、コンポーネントは活性化できる；
- 以前は満たし、いま満たさない → **deactivating**、コンポーネントは停止し effect を撤回しなければならない；
- 充足状態が変わらない → **neutral**、再構築不要。

```ts
export const inject = ['llm', 'tools']

export function apply(ctx: Context) {
  // llm と tools がどちらも解決済みのときだけここに入る。
}
```

これは `if (!ctx.llm) throw` の綺麗な書き方ではない。後者はある瞬間だけ検査し；前者は「そのコンポーネントが存在しうるか」をランタイムが継続維持する。`llm` が欠けるとき、調査ツールプラグインは合法的に `PENDING` を保て、プロセス起動全体を失敗と判定しなくてよい；provider が現れれば自動で読み込みに入り；provider 身分が変われば旧 episode を先に退出してから新解決で再入する。依存順序は宣言グラフから来て、YAML で誰が上に書かれたかからではない。

より巧妙な一歩は：**coeffect の提供自体も effect であることだ。** Provider が Context に `llm` サービスを登記し、他コンポーネントが読める環境を変える；この登記も disposer を持たねばならない。Provider がアンロードするときサービスバインドを撤回し、Context 変化がすべての consumer のライフサイクル応答を再び引き起こす。時間軸と空間軸はここで噛み合う：

```text
Provider 活性化
  -> effect：llm binding を登録
  -> coeffect context が変わる
  -> Consumer の inject が満たされる
  -> Consumer が活性化し、自身の effects を登記

Provider がアンロードを要求
  -> 先に「新しい解決」から旧 binding を隠す
  -> バインド済みの全 Consumer が順に退出して cleanup を完了
  -> Provider がようやく旧 binding と自身資源を撤回
  -> 新 Provider が ready になったあと、Consumer が再活性化
```

なぜ先に provider を表から消し、その後ブロードキャスト通知してはいけないのか？consumer の disposer がまだそれを必要としうるからだ。例えばデータベース consumer は退出時に貸し出した接続を旧 pool に返す；pool がすでに破棄されていれば、クリーンアップ自体が失敗する。論文の **guarded withdrawal（保護付き撤回）** は、provider が新しい依存解決の受付を先に止めつつ、それを使うと約束した dependents（依存者）がすべて退出するまで旧バインドを一時保持する。

ランタイムはそのため二つのビューを区別する。**Target view（目標ビュー）** は現在の Registry から計算した「この Fiber がいま依存すべき相手」；**committed view（コミット済みビュー）** はその Fiber が今回の episode で実際に使う provider 身分だ。進行中の activation または deactivation は途中で二つの解決結果を跨いではいけない。LLM-A と LLM-B が晒すオブジェクト値が全く同じに見えても、provider identity が違えば目標はすでに変わっている。Cordis 現行ソースは provider の `uid` を target/epoch 計算に入れており、固定スナップショットの[ライフサイクルコード](https://github.com/cordiverse/cordis/blob/8cc9e33fab69e2d0476d126baaf2acb24e6a6ab4/packages/core/src/fiber.ts#L385-L456)で検証できる。

非同期ステップは魔法では取消できない。プラグインが `await connect()` 中に provider が変わったとすると、ネットワーク握手はすでに出ているかもしれない。論文はすでに出したステップに **inertia（慣性）** があるとする：現実のステップの着地を許し、完了部分とその inverse を recovery に入れ、旧 episode をロールバックしてから新 target へ向かう。あるステップが失敗すれば、ランタイムは本 episode に累積した effects をロールバックし、その Fiber を失敗として標示する；半活性化のコンポーネントを合格 provider として晒さない。

### Isolation：同名サービスは異なるコンテキストに属しうる

**Isolation（隔離）** はサービス解決の realm（域）を変える。二つの並行 Agent がどちらも `shell` という名の能力を注入しても、Agent A はローカル shell、Agent B はリモート sandbox へ解決しうる；上層消費者はインターフェースを `shellA`、`shellB` にハードコードしなくてよい。Cordis の派生 Context または設定 `isolate` は、同じ論理 key を異なるコンテキスト値へ写す。

これはランタイム・コンテキスト依存の **ad-hoc polymorphism（特設多態）** だ：呼び出し形式は同じで、具体実装は所在 Context が決める。それは依存解決の隔離を解くのであって、OS 安全隔離に等しくはない。プラグインが同一 Node.js プロセスにいる限り、悪意あるコードは `fs`、環境変数、グローバルオブジェクトに直接触れうる；信頼できないプラグインはプロセス、コンテナ、仮想マシン、WebAssembly、OS sandbox などの外部境界に置く必要がある。[論文の安全境界議論](https://github.com/cordiverse/paper/blob/13f28585668a28106b2f53bedada36e45bc1ed3e/paper.pdf)はこれを明確に認める。

### Interception：サービス名を換えず、利用方針を変える

**Interception（傍受）** は依存の有無を変えず、Context 境界でアクセスを包む。Context またはコンポーネントが metadata（メタデータ）を持ち、provider がそれに従い読み取り専用パス、DB 権限、監査、タイムアウト、テレメトリ方針を適用する。isolation との差は：isolation は「同名 key が誰に解決されるか」を変え、interception は「解決された能力がどう使われるか」を変える。

Harness では、ツール実行はモデルが JavaScript 関数を直接呼ぶのではなく、pre-execute、execute、post-execute などの拡張鎖を通る。権限承認、sandbox、timeout、retry、metrics はそれぞれ安定したイベント点を傍受でき、各ツールがすべての方針実装を import する必要はない。これは interception の Agent 製品層での直感的な着地点だが、Cordis 自体は「ツール」領域を前提としない。

### 必須依存、任意依存、変化ストーム

すべての service を必須 `inject` に書いてはいけない。調査ツールが `llm` なしでは全く動けないなら必須依存；metrics がなければ観測が一本減るだけなら、metrics の出現のたびにプラグイン全体を破棄するのは割に合わないかもしれない。**Optional dependency（任意依存）** には明示語義が要る：コンポーネントはそれを持たずに走れ、管理された listener または子コンポーネントで出現時に能力を追加できる。本当に必須のものと強化にすぎないものを混ぜると、小さな変化が不要なライフサイクルチャーンに増幅される。

Provider が急速に現れ消えを繰り返すと **churn（変化ストーム）** になる。ランタイムは各 episode の committed view が混ざらないことを保証しなければならないが、応用層はなおスロットル、デバウンス、ヘルスチェック、backoff を考える必要がある。登録直後にすぐ失敗する LLM-B が数百 consumer を毎ミリ秒再構築させてはいけない；provider を readiness gate（準備ゲート）通過後に初めて外へ provision するか、Loader が設定変更を一批まとめて一度調和する。時空可組合せ性は合法変換の構造を保証するが、新 provider をいつ利用可能と宣言するかは製品が決める。

多 provider 選択も「適当に一つ」ではない。Specification は優先度、作用域、版、metadata を暗黙に含みうる；一度選んだら、本 episode は provider identity を committed view に書く。複数バックエンドへの負荷分散を望むなら、「バックエンドプール」自体を安定 Service にし、プール内部がリクエスト目標を選ぶべきで、同一 Consumer が一度の活性化の中でライフサイクル解決器にリクエストごとに provider を切替えさせてはいけない。前者はサービス実装方針、後者はコンポーネント身分変化で、二つの粒度は分けねばならない。

依存宣言には文書価値もある。`inject` はスケジューリング入力であるだけでなく、アーキテクチャ図の実行可能な辺だ：ツールプラグインがなぜ待ち、provider がなぜ退出できず、どの隔離域に実装が欠けるかは、Registry から診断できる。import graph で実行関係を推測するのに比べ、それが記録するのはランタイム能力依存であり、「コードファイルがどのパッケージを参照したか」ではない。


## なぜ両者は一つのプログラミングパラダイムに合成できるのか

ここまで来ると、`Context` は巨大なパラメータ袋やグローバル Map と誤解されやすい。本当の **Context paradigm（コンテキストパラダイム）** にはより厳しい契約がある：共有位置が型付き key として観察可能な coeffect になる；それらの位置への変更は inverse を生成できる operation を通じて起こる；コンポーネントはどの key を読むかを明示宣言する；ランタイムは操作をコンポーネントインスタンスに帰属させ、Context 変化に伴いライフサイクルを進める；派生 Context はさらに解決を隔離し、アクセスを傍受できる。

したがって Context は二類の問いに同時に答える：

| Context が保存または仲介する事実 | ランタイムがそこから知ること |
| --- | --- |
| 現在解決可能な service/provision | 誰が誰に依存し、コンポーネントがいつ起動条件を満たすか |
| 操作が属する Fiber | 誰がある変更を引き起こしたか |
| 各 effect の disposer/witness | その Fiber が去るときにどう撤回するか |
| target と committed provider identity | 依存変化時にどの episode を再構築すべきか |
| isolate/intercept metadata | 同名能力がここでどう解決・実行されるか |

論文の言う **context type（コンテキスト型）** も TypeScript の `interface Context` だけではない。プログラミング言語理論では、type は一組の実行可能操作とその満たすべき法則を記述しうる。論文は、これまで静的判断に留まりがちだった effect/coeffect context をランタイム一等オブジェクトとして実体化し、配備後に現れるコンポーネントも同一の組合プロトコルに参加できるようにする。

この統一はよくある論争にも答えられる：二つの effect が交換できないときは？答えはそれらが独立だと無理に主張することではなく、実際の順序関係を coeffect にすることだ。例えばツールプラグインが監査プラグインのあとで middleware 鎖に入らねばならないなら、監査層が提供する能力または段階トークンへの依存を宣言する。ランタイムは独立操作にだけスケジュール並べ替えを許し、関係のあるコンポーネントは依存順で協調する。空間制約が時間回復に順序を与え、時間 inverse が空間グラフを本当に再編成できるようにする。

### Component から Fiber と Registry へ

論文と実装のあいだには三つの关键層がある：

- **Component（コンポーネント）** は宣言：どの key が必要か、どの key を提供するか、活性化時にどの effect 関数を実行するか。
- **Fiber** はある Component の一度のランタイムインスタンス。身分、親 Fiber、子 Context、ライフサイクル状態、コミット済み依存、クリーンアップ累算器を持つ。ここでの Fiber は OS スレッドでも React Fiber でもなく、「今回のプラグインマウント」のランタイムハンドルにすぎない。
- **Registry（登録表）** は現在の Fiber、親子関係、provision、依存解決を保存し、ランタイムがグラフ全体を進める事実源だ。プラグイン名だけを記録する目録ではない。

一つの Component は前後して複数の Fiber episode を生みうる；同一プラグインを二つの隔離 Context にそれぞれ一度マウントすることもできる。「コード定義」と「今回の実行身分」を分けてはじめて、effect の正確な帰属、provider 身分の区別、局所回復ができる。

### 五つの形式化結果は、それぞれどんな工学約束に翻訳できるか

論文は層ごとにコンポーネント演算（calculus、状態と変換規則で計算を記述する形式モデル）を組み立て、いくつかの metatheory（このモデル自体についての性質）を証明する。工学読者が残すべきは五組の結果だ：

| 論文結果 | 通俗の問い | 成立に必要な关键条件 |
| --- | --- | --- |
| Preservation，Theorem 59 | 一歩進むたびに、Registry にぶら下がり親子参照や、存在しない provider へのコミットといった壊れた状態が出るか？ | 初期状態が良構、変換が論文規則と撤回 guard を守る |
| Recovery exactness / terminal recovery，Theorem 61、Corollary 62 | A、B の操作が交差したあと、A だけを撤回して B の貢献を残せるか？ | 原子 inverse が正しい；異なる Fiber の effect iterator が互いに独立 |
| Ordering / resolution coherence，Theorem 63、64 | provider 撤出時に consumer が死参照を握ったままか？一度の episode が途中でバインドを換えるか？ | 明示依存、保護付き撤回、変換が committed resolution を固定 |
| Progress，Theorem 66 | ライフサイクル協調が自分で行き詰まるか？未処理変換のない安定点へ行けるか？ | provider precedence graph が無環、Fiber 集合が有限、各 iterator が有界、外部が無限に擾乱しない |
| Confluence，Theorem 73 | 異なる合法スケジュール順が結局異なるシステムを組み立てるか？ | effects が独立、依存が無環、規模が有限、コンポーネントが全 provision を果たす、失敗 Fiber を除外など |

**Preservation（保持性）** は「各ステップが構造不変条件を壊さない」。**Recovery exactness（精確回復）** は「自分の貢献を撤いて他人のものを誤削除しない」。**Progress（進展性）** は「前提が満たされれば、規則は静止状態へ進み続けられる」。**Quiescent state（静止状態）** は未実行のライフサイクル変換がない状態を指す。**Confluence（合流性）** は異なる合法経路が最終的に同じ normal form（規則でこれ以上簡約できない最終構造）へ合流すること——新鮮な Fiber 名の改名・観察同値を許す。

これらの結果はいずれも「任意プラグイン並発が永遠に誤りなし」ではない。disposer は間違って書ける；同一有序列表を変更する二つのプラグインは独立でないかもしれない；依存グラフは環になりうる；外部 API は失敗しうる；悪意コードは Context を迂回しうる；failed Fiber は最強合流結論からも除外される。形式証明の役割は工学テストの代替ではなく、「なぜ有効か」と「どの前提で有効か」をはっきりさせることだ。完全な表現は固定スナップショット PDF の[第 42–53 ページ](https://github.com/cordiverse/paper/blob/13f28585668a28106b2f53bedada36e45bc1ed3e/paper.pdf)を見よ。

### 「なぜ動くのか」を一条の因果鎖に繋ぐ

いまは公式なしに、論証を一通り言い直せる。

第一、コンポーネントの共有システムへの変更は、Context が観察できる operation を通らねばならない。そうしてランタイムは effect 境界を見られ、事後にグローバルオブジェクトを走査して誰が何を変えたかを推測しなくてよい。第二、operation は成功時にすぐ inverse を生み、inverse は owning Fiber が累算器に収める。コンポーネント内部で初期化が半分失敗しても、完了部分を逆順に撤ける。

第三、Fiber 横断 の effect は観察語義上独立か、明示関係で順序付けられるかのどちらかだ。A、B が異なる key に交換可能な操作をするなら、スケジュールは交差でき、A を撤いたあと B を残せる；両者が有序資源を争うなら独立を偽れず、前後関係を coeffect へ引き上げるか単一 owner に渡す。第四、コンポーネントが specification で必要な coeffect を宣言し、Registry が現 provision から target を計算できる。

第五、service registration 自体も撤回可能な effect だ。Provider が加われば Context 変化で Consumer 条件が満たされ；Provider が去れば Consumer 条件が失効する。第六、withdrawal guard と committed view が、Consumer が先にクリーンアップし Provider が後に消えること、一度の非同期 transition が途中でバインドを換えないことを保証する。ここで局所 effect の回復規律と大域依存の空間協調が本当に閉じる。

第七、Loader は設定木を期待状態とみなし、差異部分グラフだけを再編成できる；HMR は「旧 Fiber をアンロード、検証して新 Fiber をマウント、失敗なら回復」で同一ライフサイクルを再利用できる。前の六ステップがなければ、いわゆる差分ホット更新は参照の上書きにすぎない；あれば、局所置換に説明可能な回復経路がある。

Agent Harness には第八のステップを加える：永続 session event log がモデル可視の事実を保存する。それは Fiber recovery の数学証明には参加しないが、プラグイン再構築後に既存セッションから続けられることを保証する。実行構造の回復可能性と業務事実の再生可能性は補完する：前者は残留を避け、後者は記憶喪失を避ける。

### 交差履歴で Recovery Exactness を検査する

ツールプラグイン A が `research` を登録し、観測プラグイン B が `metrics` を登録するとする。実際の履歴は：A がツール登録、B が指標登録、A が timer 開始、B がログ購読、かもしれない。いま A だけをアンロードする。正しい結果は、Registry を A 出現前の物理スナップショットへロールバックすることではない——それでは B の後からの貢献も消える；A の timer とツールを撤き、B の指標とログ購読を残すことだ。

これが terminal recovery が「旧スナップショットへ戻す」より精確なところだ。交差履歴から一つの Fiber の軌跡を取り除き、独立軌跡は残す。A と B が同じ有序 middleware 鎖に位置を挿入するなら、A を外しても B の相対語義が保たれるかはインターフェース定義次第で；両方の disposer が `splice` できることだけでは独立を宣言できない。論文が inverse 選択と outcome も相手に変えられないことを要求するのは、表面的には交換可能で実際は語義結合している場合を除外するためだ。

### Progress と Confluence になぜ前提がそれほど多いか

無環は「すべてのコンポーネントが別の誰かが先に提供するのを待たねばならない」閉待機環がないことを保証し；有限 Fiber と有界 iterator は、新コンポーネントを無限に生成したり無限初期化ステップで永遠に忙しい状態を避ける；total provision は、コンポーネントがある key を提供すると宣言したら、活性化成功時に本当にそれを提供することを要求し；失敗 Fiber の除外は任意の例外結果を唯一の normal form に押し込めないようにする。

外部 orchestrator が毎ナノ秒設定を変え続ければ、システムは当然 quiescent state に永遠に届かないかもしれない。Confluence が比較するのは、システムが収束を許されるとき、異なる合法独立スケジュールが最終的に観察同値かどうかであり、中間の各瞬間が同じであることや、境界外へすでに送ったメールの順序が同じであることを保証しない。これらの前提を書くことは論文を弱めず、むしろ工学チームに、どの条件をアーキテクチャ・型・テスト・運用が共同で守るべきかを知らせる。

## Cordis Kernel 解剖：最小カーネルに本当にあるもの

「Cordis kernel」はよく検索される語だが、Cordis 公式は自分を core library または meta-framework と呼ぶことが多く；必ず `kernel` という独立正式パッケージがあるわけではない。本稿の「カーネル」は説明用の略称で、最小の Context ランタイムとライフサイクル協調器を指し、製品モジュール名を装わない。

| 対象 | 正確な定義 | それは何でないか |
| --- | --- | --- |
| `Context` | サービスアクセス、effect/イベント登録、子コンテキスト派生、操作を現 Fiber へ帰属させる一等ランタイム環境 | ライフサイクルなしのグローバルオブジェクト袋ではない |
| `Service` | 安定した `ctx.<key>` 上で能力を定義または実装し、Context が提供と撤出を管理する | 任意の TS interface と等しくなく、自動でリモートサービスでもない |
| `Plugin` | 関数・オブジェクト・Service class で表す組立とライフサイクル単位 | 必ずしも外へ Service を提供しない |
| `Fiber` | 一度のプラグインマウントのランタイム身分・状態機械・recovery owner | スレッドでも React の描画 Fiber でもない |
| `Registry` | Fiber・親子関係・依存・provision を列挙し協調する事実表 | npm registry やプラグインストアではない |
| `EventsService` | 型付きイベントと複数の配信モードを提供 | 自動永続化の event log ではない |
| `LoggerService` | 構造化ログ能力。出力先は上層プラグインが決める | 組合理論の必要公理ではない |
| `Loader` | 宣言的設定を Fiber 木へ調和し、モジュール置換にも関与する | 行ごとの `import` 起動スクリプトだけではない |

最小マウントの呼び出し関係はおよそこうだ：

```text
root.plugin(plugin)
  -> Registry が Fiber と child Context を立てる
  -> inject を読み、target view を計算
  -> 依存充足後に apply(ctx) を実行
  -> ctx.effect / ctx.on / ctx.plugin / service registration
     はすべてこの Fiber に帰属
  -> apply 完了、Fiber が ACTIVE へ
  -> 明示 dispose、親の退出、または依存 target 変化
  -> 先に dependents を協調し、その後この Fiber の recovery を実行
```

`Plugin`、`Service`、`Event` も分けねばならない。プラグインは「誰がライフサイクルを所有するか」、Service は「他コンポーネントへ直接呼べる何を提供するか」、Event は「コンポーネント間が事実または拡張点で通信する契約」だ。ログ observer はイベントを聴くだけで Service を提供しないプラグインでありうる；LLM provider はしばしば Service 形態で能力を提供する；ツール方針はイベント傍受鎖を通じて実行に参加しうる。

Cordis/Harness のイベントも一モードですべてを包まない。`emit` は同期通知で戻りを待たない；`parallel` は複数の非同期 listener の並行終了を待つ；`serial` は順に待つ；`waterfall` は around-middleware で、listener は `next()` を受け、下流への委譲・ショートカット・戻り値の書き換えができる。Harness の `agent/request` とツール実行方針は waterfall を使い、普通の session 観察は通知に近い。モードをはっきり書かなければ、高優先 listener が意図せず大域フローを飲み込みうる。[Cordis primer](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/cordis-primer.md) がこれらの配信語義を与える。

### なぜ Context は「高級グローバル変数」ではないのか

呼び出し表面では、`ctx.llm` はオブジェクトからグローバル属性を読むように見え、`ctx.set` や `ctx.provide` は Map へ書くように見える。差は各操作が運ぶランタイム情報にある：読み取りがどの隔離域で起こるか、現 owner はどの Fiber か、この provision はどの provider identity 由来か、登記操作はどの recovery accumulator に入るか、どの consumer の committed view がそれを指すか。

普通のグローバル変数には値だけがあり、これらの関係はない。値が A から B に換わっても、旧閉包・所有権・クリーンアップ順序は自ら現れない。Context の深さは「API を全部 `ctx` に集める」ことではなく、一見普通の読み書きが同時にライフサイクルプロトコルに参加することだ。新しい共有能力を Context オブジェクトへ手で属性をぶら下げるだけで、Definition・provision・inject・disposer がなければ、それはなおパラダイム境界を迂回している。

**Service Definition（サービス定義）** は key・型・行動語義を固定し、できればどの操作が交換可能か、戻り値が傍受されうるか、誤りがどう伝播するかも述べるべきだ。**Service Provider（サービス提供者）** は実装と資源を所有する。**Consumer（消費者）** は Definition だけに依存する。三者を分けたあと、Registry が見るのは「誰が提供/誰が依存」の実行関係、パッケージマネージャが見るのは「誰が型定義を参照」の静的関係；二枚の図は関連するが同一ではない。

診断もしたがって「Cannot read properties of undefined」より具体になりうる。PENDING Fiber はどの key が欠け、現 realm にどの候補 provider があるかを説明でき；撤出できない Provider は committed view でなおそれを参照する dependents を列挙でき；FAILED Fiber は誤った episode とすでにロールバックした effects を携えられる。形式モデルが正しい状態を与え、生産可用性はログ・タイムアウト・可視化・誤りコンテキストがそれらの状態を人に見せることになお依存する。

### イベントは Effect であり、公共プロトコルでもある

`ctx.on()` の便利は `off()` を一度書かずに済むことだけではない。固定ソースは listener registration が effect に包まれ、owner アンロード時に自動 unregister されることを示す。これは「誰が何を聴いたか」を Fiber クリーンアップに入れる。だがイベント名、引数型、配信モード、優先度はなおプラグイン横断公共 API だ；自動登録解除は語義曖昧なプロトコルを直さない。

通知型イベントは「事実がすでに起こった」に適し、観察者の失敗は通常事実を変えるべきでない；waterfall は「リクエストがなお包まれ意思決定されうる」に適し、listener が `next()` を呼ばなければショートカットしうる。両者を混ぜると隠れた結合が生まれる：metrics をしたかっただけのプラグインがショートカット可能な鎖に掛かり `next()` を忘れれば、モデルリクエスト全体が止まる。メタフレームワークは組合メカニズムを提供し、領域フレームワークはなお各 extension point の時系列・誤り・冪等契約を定義せねばならない。

## プラグインライフサイクル：PENDING から DISPOSED までの完全な旅

公式チュートリアルが与える実装状態機械は：

```text
PENDING -> LOADING -> ACTIVE -> UNLOADING -> DISPOSED
                \-> FAILED
```

これらの語は診断に見える実行状態を述べ、論文が証明便利のために使う抽象状態と機械的に一対一対応させてはいけない。

**PENDING（待機中）** はプラグイン宣言は存在するが必須 service がまだ ready でないことを表す。これは長期に合法な状態でありうる：任意 profile のプラグインがユーザーがある provider を入れていなければ待つことは、システム破損を意味しない。**LOADING（読み込み中）** は依存が満たされ、`apply` が実行中であることを表す。成功後 **ACTIVE（活性）** に入り、このときプラグインが外へ提供する能力は新 consumer に解決されうる。設定検証または `apply` の例外は **FAILED（失敗）** へ；失敗 episode で完了した effects は先にロールバックすべきだ。

**UNLOADING（アンロード中）** は Fiber が provision を止め recovery を実行していることだ。複数 disposer は逆登録順で起動するが、公式チュートリアルは注意する：非同期 disposer は並行しうる。クリーンアップを厳密に直列にしなければならないなら——例えば「先にログを flush、次に接続を閉じる」——二ステップを同一 disposer に入れ明示 `await` し、二つの独立コールバックの登記順だけに頼ってはいけない。すべて完了してようやく **DISPOSED（処置済み）**。[ライフサイクルチュートリアル](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/cordis-tutorial/02-lifecycle-and-effects.md)は `fiber.dispose()` が非同期クリーンアップを待ち、子プラグインを再帰処理すると説明する。

状態機械を調査ツールの物語に戻すと、「on/off」より完全な旅になる：

1. 設定が調査ツールプラグインを宣言し、Registry が Fiber を作る。`llm` がまだないので PENDING。
2. LLM-A Provider が活性化し `llm` を登記。ツールプラグインの target が満たされ、LOADING へ。
3. `apply` がツール、listener、timer、接続を登録；各影響はこの Fiber に帰属。完了後 ACTIVE。
4. 管理者が LLM-B で LLM-A を置換。旧 provider は新しい target resolution から先に退出するが、committed binding は一時保持。
5. ツールプラグインが UNLOADING へ。先に timer を止め、listener を取り消し、ツールを外し、最後に接続を閉じる；cleanup がなお LLM-A を要すれば、このとき旧 binding はまだ使える。
6. consumer クリーンアップ完了後、ようやく LLM-A がサービスを撤回し自身資源を解放。ツールプラグインは待機へ戻り、その後 LLM-B へ解決し、全く新しい episode を開く。
7. 最終的にツール設定を削除するとき、新 episode も完全退出；Registry にツールや子 Fiber は残らず、DISPOSED へ。

親子プラグインは所有権も組合せ可能にする。`ctx.plugin(child)` は管理されないタスクを手で起動することではなく、child Fiber を現 Fiber に帰属させることだ。親プラグイン dispose 時、部分木が先に協調退出する；親が半分まで読み込んで失敗すれば、すでにマウントした child も本 episode の recovery に属する。これはプラグイン内部でさらにプラグインを載せるときの資源帰属問題を解く。

HMR（hot module replacement、ホットモジュール置換）は特にこの語義に依存する。Node モジュールキャッシュを消してから新ファイルを `import` するだけでは、コードオブジェクトが換わるだけ；旧 listener、旧 service、旧閉包はなお生きうる。信頼できるホット置換は旧 Fiber を本物のコンポーネントとしてアンロードし、recovery 完了を確認してから新コードに新 Fiber を立てさせねばならない。新版の検証または読み込みが失敗すれば、トランザクション式 Loader は旧版へ戻し、システムを半分新・半分旧に残してはいけない。

### アンロードは一瞬ではなく、観察可能なプロトコルの一区間だ

ユーザーが「プラグインを無効化」をクリックすると、設定目標は即座に変わりうるが、物理資源は同一ナノ秒では消えない。UNLOADING 中はストリーミングリクエスト終了、子プロセス退出、外部補償完了を待っているかもしれない。制御面は「アンロード中」を示し、早すぎる「削除済み」報告をしてはいけない；新リクエストは旧 Provider へ解決を止め、旧 Consumer のクリーンアップはなお committed binding を得るべきだ。

この過渡には timeout と失敗方針が要る。disposer を無限に待てば provider withdrawal が塞がり；強制タイムアウトは資源を残しうる。合理的なやり方は資源次第：メモリ listener は即時撤回でき、HTTP リクエストは `AbortSignal` で協調取消でき、子プロセスは先に終了信号を送り kill へ昇格でき、会計補償はバックグラウンド再試行へ入りうる。Cordis は owner と順序の骨格を提供し、具体的な終了プロトコルはなお Service Definition に属する。

繰り返し dispose も語義をはっきりさせる必要がある。親 Fiber が再帰クリーンアップする child を、業務コードが同時に dispose するなら、下層は二重解放を避けるべきだが、プラグイン著者は競合に頼るべきでない。ライフサイクル制御を owning Context に集め、安定した「停止を要求し完了を await」インターフェースを晒すほうが、あちこちに裸の disposer を保存するより推論しやすい。

### 失敗は大域クラッシュと等しくてはいけない

FAILED Fiber は宣言した coeffect をもはや提供せず、それに依存する Consumer は PENDING を保つか戻る；同一 Registry の無関係な兄弟 Fiber はサービスを続けられる。これは細粒度コンポーネントモデルが全プロセス起動スクリプトに対して持つ価値の一つだ。だが局所失敗が受け入れ可能かは製品方針：核心認証 Provider の失敗はアプリ ready を阻むべきかもしれず、任意 metrics プラグインの失敗は警報だけで足りる。

したがって起動完了は「Node プロセスがまだ生きている」だけでは足りない。システムは readiness を定義せねばならない：どの关键 Fiber が ACTIVE でなければならず、どれが PENDING を許し、どの FAILED が降格し、設定調和がいつ完了とみなされるか。論文の quiescent state は未推進変換がないことだけを表し、業務健康を意味しない；すべての核心コンポーネントが依存不足で静かに PENDING なシステムもすでに静止しうるが、全く利用不能だ。


## Cordis Plugin System：イベント、サービス、設定、HMR はどう協働するか

「Cordis plugin system」は少なくとも四層を含み、すべてを `ctx.plugin()` 一つの API に押し込めない。

第一層は**コードプラグイン**。最小形態は `ctx` を受ける関数で、`apply(ctx)` を持つオブジェクトや `Service` を継承する class でもよい。プラグインは `inject` を宣言し、親 Context がマウントする。コードモジュールが定義を、Fiber が実行インスタンスを担う。

第二層は**サービスとイベント**。Service は consumer が安定能力を直接呼ぶのに適し、例えば `llm.complete()`；Event は事実の観察や拡張鎖への参加に適し、例えば各ツール実行前の権限判断。サービス登記、listener 登記、registry registration はいずれも disposer を返すか内蔵し、owning Fiber の effect になるべきだ。

第三層は**宣言的 Loader**。YAML/JSON の entry は上から下へ一度だけ実行される起動目録ではなく、desired state（期待状態）だ。安定 `id` は reconciliation key（調和鍵）：Loader は新旧 entry tree を比較し、追加・削除・移動・設定変更を識別し、実際の Fiber tree を目標へ調整する。`disabled` は設定を残しつつインスタンスを撤出でき；`isolate` は部分木に独立 service realm を使わせられる。

```yaml
- id: llm-primary
  name: ./plugins/llm-a

- id: research-tool
  name: ./plugins/research-tool
  config:
    refreshInterval: 60000

- id: experimental-observer
  name: ./plugins/observer
  disabled: true
```

第四層は **reconciliation と HMR**。Reconciliation（調和）は「期待状態と実際状態を比較し、差異だけを修正する」循環だ；Kubernetes と少し直感が似るが粒度は全く違う：Kubernetes はコンテナとサービスを調和し、Cordis は同一プロセス内の Context・プラグイン・Fiber を調和する。HMR はさらにモジュール依存グラフを diff に入れる：stale entries（旧モジュールの影響を受けた条目）を識別し、新モジュールを検証し、旧インスタンスをアンロードして新インスタンスをマウント；失敗時は動く旧状態へ戻る。

DeepSeek vendor 版はこの層にローカル hardening と transaction-like reconciliation を加える。「Transaction-like（トランザクション類似）」は慎重な用語だ：Loader ができるだけ原子的にプラグイン木を切替え、失敗時に回復することを表すが、外部メール・ファイル書き込み・すべての業務状態がデータベース ACID トランザクションを得ることを意味しない。

安定 ID は、なぜ設定 overlay が製品を精確に変えられるかも説明する。patch が配列位置だけなら、上流 bundle が一行挿入しただけで下流がすべてずれる；ID 置換なら「`llm-primary` の provider を換えるが他条目は残す」を表現できる。動的プラグインシステムの設定は、起動瞬間だけ効く命令の山ではなく、継続調和できる構造になる。

### 一度のトランザクション式ホット更新が少なくとも越える関門

信頼できる HMR は一つの `import()` ではなく、三段階として理解できる：

1. **準備段階**は変化したモジュール依存グラフを読み、新コードと設定を解決し、影響 entries を見つけ、旧インスタンスに触れずに schema 検証をできるだけ完了する。
2. **切替段階**は旧 provider が新解決を受けるのを止め、依存方向に沿い affected Fibers を撤出し、新定義をマウントする。影響を受けない部分グラフを便宜のために一緒に再起動してはいけない。
3. **コミットまたは回復段階**は新 Fiber が期待状態に達したことを確認してから新木を受け入れ；読み込み失敗なら新 episode をクリーンアップし旧定義を再構築し、位置特定可能な誤りを出す。

ここでの「旧定義へ戻す」は旧プラグインの私有メモリをそのまま保存することに等しくない。HMR がセッション・索引・ダウンロード進捗を残すなら、それらの状態はより安定した Service に置くか、明示的な直列化/移行契約を提供せねばならない。Clean-slate reload（きれいな状態からの再読み込み）と state migration（状態移行）は二つの機能で、UI がリフレッシュされていないように見えるだけで両方が完了したと仮定してはいけない。

設定 ID は長期互換性も担う。Bundle 著者が安定 ID を公開すれば、下流 profile が patch でそれを参照しうる；安易な改名は覆蓋層を静かに失効させたり重複プラグインを生んだりする。ID は文言翻訳やファイル並べ替えを跨いで安定であるべきで、削除や改名には移行ヒントが要る。プラグインパッケージの semver の外に、設定木自体も一層の公共 API を形成する。

## なぜ Meta-Framework と呼ばれ、また一つの応用フレームワークではないのか

**Framework（応用フレームワーク）** は通常、ある領域のオブジェクトと制御流を規定する：Web フレームワークには route、request、middleware；チャットボットフレームワークには command、message、adapter；Agent Harness には model、tool、session、turn、sandbox がある。

**Meta-framework（メタフレームワーク）** はここでは「フレームワークより大きい」というマーケティング語ではなく、これらのフレームワークを組み立てる下層フレームワークだ。Cordis はモデルがどうストリーム出力するかも、チャットコマンドがどうマッチするかも規定しない；コンポーネントがどう貢献し、依存し、撤回し、再編成するかを規定する。上層が Service と Event で自分の領域語彙を定義する：

```text
応用層：具体 Agent、チャットボット、Web Console
   ↑
領域フレームワーク：DeepSeek Harness の tool/session/turn、または Koishi の command/message
   ↑
Cordis：Context / effect / coeffect / Fiber / Loader / HMR
```

したがって「Cordis は plugin system、kernel、framework、それとも meta-framework？」への最も正確な答えは：プラグインシステムと Context runtime を核心とする TypeScript メタフレームワークであり；「kernel」はその最小協調核心への非公式呼称であり；上層はそれで領域フレームワークを組み立てられる。いくつかの語は異なる層を観察しており、互いに排他ではない。

Koishi はこの階層の生産事例だ。論文は Koishi v3 が Cordis 上で 4,000 超のコミュニティプラグインを発展させたと述べ、異なる著者が同一 Context 契約の周りにコマンド・データベース・アダプタ・サービスを組合せることができることを示す。プラグイン著者は通常、登録コードから遠い完全アンロード経路を保守する必要がなく、サービス依存もパッケージ横断で協調できる。

だが証拠の強さは正直に書く：それは「規模のある採用生態が存在する」ことを示すだけで、Cordis が OSGi・普通 DI・他アーキテクチャより性能が高い・開発が速いことを証明せず；v3 生態を v4 形式規則が 4,000 プラグインですべて検証されたとも言えない。論文自身が単一生態・単一宿主言語・定量ベースライン欠如を制限として挙げる。[事例議論](https://github.com/cordiverse/paper/blob/13f28585668a28106b2f53bedada36e45bc1ed3e/paper.pdf)は第 66–67 ページに集中する。

## DeepSeek Harness：Everything is a Plugin は結局どこに着地するか

Agent モデルは次のトークンを生成できるが、生産 Agent はなお現ディレクトリ、利用可能ツール、履歴セッション、権限境界、ツール結果の扱い方、いつモデルを再要求するかを知らねばならない。**Agent Harness** はこれらの非モデル責務を担う実行環境だ。当サイトのこれまでの[《Agent Harness パターン》](/ja/blog/inside-claude-code-agent-harness/)はループが実世界でどう生き残るかに焦点を当て；本稿はさらに、ループ自体とその依存能力が動的に再編成できるかを問う。

DeepSeek Harness の答えは「Everything is a Plugin」だ。この文はプロセスに起動コードがなく Cordis に核心ライブラリがないことでも、すべてのプラグインが同じ権限を持つことでもない；製品機能が、カーネルを改めなければ置換できない特権モジュールに隠されるべきではない、という意味だ。固定スナップショットのアーキテクチャ文書は、LLM adapter、tool registry、session log、Agent loop、sandbox、storage、scheduler、UI がいずれもプラグインで組み立てられると列挙する。

### Capability seam：定義・実装・利用者を分ける

Harness は **capability seam（能力継ぎ目）** で置換する価値のある能力を組織する。Seam は安定したモジュール境界で、両側が独立に変化できる。完全な seam には三つの役割がある：

1. **Service Definition** は安定した `ctx.<key>`、リクエスト/結果型、語義契約を定義する。
2. **Service Provider** は実装を提供し、ローカル・リモート・sandbox など複数版がありうる。
3. **Consumer** は Definition だけを注入し、能力をより上層機能——例えばモデルへ Bash tool を晒す——に使う。

公式文書の Bash 例は具体的だ：`dsh-shell` がインターフェースを定義し、`dsh-bash-local` と `dsh-bash-sandbox` が異なるバックエンドを提供し、`dsh-tool-bash` がそれをモデル呼び出し可能ツールにする。Provider と Consumer はどちらも Definition に依存するが、互いに import しない。下層 shell provider を置換したあと、Bash、PTY、LSP などの consumer は一緒に別の実行世界へ移行できる。[能力設計実践](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/user/develop/practice/index.md)も注意する：すべての単純ツールを事前に三パッケージへ分ける価値はなく、役割が本当に独立進化する必要があるときだけ seam を立てるべきだ。

### Profile、bundle、patch：設定こそ製品の組立ライン

一度の `dsh` 実行はハードコードされたモジュール表を読むのではなく、多層設定から最終プラグイン木を得る：

- **Profile** はユーザーが選ぶ具名組立で、順に重ねる bundles、外部プラグイン、ローカル patch を含む。
- **Bundle** は一組の Cordis entries・設定・関連コードの配布単位だ。
- **Patch/overlay** は覆蓋層で、安定 ID により設定を置換または entry を挿入する。

```text
空のプラグイン木
  + profile 中の bundles の patches（順に）
  + profile/cordis.patch.yml
  + $DSH_HOME/cordis.patch.yml
  + コマンドライン --patch overlay
  = 最終実行プラグイン木
```

`web` と `headless` は公式テンプレートで、底部は `dsh-base` 能力を共有し、異なる入口を重ねる。ユーザーは `dsh --profile web --dump-config` で実際の組立結果を見られ、パッケージ名からランタイム構造を推測しなくてよい。[CLI/Profile 文書](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/apps/cli/README.md)がこの設定鎖を記録する。

### Agent Loop もただのプラグインだ

Harness は一度の相互作用を三つの異なる概念に分ける：**step** は一度のモデルリクエストとその引き起こすツール実行；**turn** は一度の入力が受理されたあとの完全な drain で、複数 step を含みうる；**round** はより外層方針の一度の反復——例えば fresh-agent attempt。Cordis 自体はこれらの語を規定せず、`dsh-agent-loop` プラグインが Cordis Service と Event でそれらを実装する。

```text
ユーザー入力 -> inbox -> turn/start
  -> agent/pre-step
  -> step/start
  -> system prompt + tool schemas
  -> agent/request -> llm/stream
  -> assistant message
  -> tool/call*
       -> tools/pre-execute（policy / approval / sandbox）
       -> tools/execute（timeout / retry / tool body）
       -> tools/post-execute（受理・阻止・結果書き換え）
       -> tool/result*
  -> step/end
  -> 必要なら次の step へ
  -> turn/end
```

ここにはなお二つのデータ面がある。`turn/*`、`step/*`、`user/message`、`assistant/*`、`tool/*` は durable session events（永続セッションイベント）で、回復・UI・再生に使う；`agent/*`、`tools/*` などは live extension points（現実行拡張点）で、方針と傍受に使う。モデルが見る system prompt、reasoning、ツール呼び出しと結果、subagent スケジュールなどは session log に追記される。**Append-only（追記のみ）** は新事実を追記し、その場で歴史を改竄しないことを表し、監査と再生に有利だが、機微データアクセス・保持期間・削除ガバナンスを自動では解かない。

Cordis の recovery と session log が解くのは別々のことだ：前者は現実行構造を回復し、「旧プラグインが資源を残したか」に答え；後者はモデル可視履歴を再構築し、「この対話とツール事実に何が起きたか」に答える。イベントを記録したことは外部 effect が可逆であることを意味せず、プラグインがアンロードできることはセッション履歴が永続保存されたことを意味しない。

### ツール実行がなぜ一度の関数呼び出しではないのか

モデルが tool call を生んだあと、Harness は先に呼び出しを永続化し、その後 pre-execute、monotonic guards（締め付けのみで緩められない単調保護）、一度きりの承認、execute around chain、ツール本体、post-execute、結果正規化と最終凍結へ進み、最後に権威ある `tool/result` を記録する。権限、sandbox、timeout、retry、metrics、UI 表現は異なるプラグインが安定拡張点へ挿入し、ツール自体がすべての方針パッケージに直接依存する必要はない。[ツール実行パイプライン](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/tool-execution-pipeline.md)が完全な順序を与える。

これが「Everything is a Plugin」の工学価値だ：重点はプラグイン数ではなく、絡みやすい責務を置換可能な seam に置き、各登録が owning Fiber に伴い撤回されることだ。代償も現実だ：イベント名、優先度、ショートカット規則、durable/live 境界はいずれも公共契約になり、安易な waterfall listener だけで大域挙動を変えうるため、文書・版管理・統合テストが必要だ。

最後に証拠境界を強調する：DeepSeek Harness が Cordis を実際に採用・vendor・改変したことはソースで証せる工学選択だ；だが論文結論はなお self-evolving agent harness（継続的に自己改変する Agent 基盤）を将来検証方向として挙げる。既存採用を「論文が実験数学で Harness の安全な自治進化をすでに証明した」と書いてはいけない。

### Profile から一度のツール呼び出しまで、プラグインはどう本当に出会うか

各層を串刺しにする：ユーザーが `web` profile を選び、CLI が順に base bundle、Web bundle、個人 patch、コマンドライン overlay を重ね、安定 ID 付き Cordis entry tree を得る。Loader が entries に Fiber を立て；LLM、session、tools、shell、agent-loop Provider が順に ACTIVE に達し、それらに依存する Consumer が target 充足に伴い起動する。Web UI は session と制御サービスを読む別プラグインにすぎず、すべての能力の宿主になる必要はない。

ユーザーがメッセージを送ると、session プラグインが先に入力を durable event にし、Agent Loop が inbox から claim する。System-prompt 組立器とツール登録表がモデルリクエストコンテキストを提供し、LLM adapter が内容をストリーム返す。モデルが Bash を選べば、ツール Consumer はローカル子プロセス実装を直接 import せず、shell Service Definition 経由で現 realm の Provider へ；pre-execute waterfall が承認を要求でき、execute 層が timeout を設定し、post-execute が結果を正規化し、session が権威出力を記録する。

このとき管理者が shell を local から sandbox へ換える。Cordis にとっては provider identity と依存 target の変化；Harness 領域にとっては、Bash・PTY・LSP などの consumers が新実行世界で再構築を要することを意味する。旧 provider は dependents のクリーンアップ後に退出せねばならず、その後の新ツール呼び出しが sandbox へ入る。あるツールの UI renderer だけを変えるなら、diff は該当プラグインだけに触れ、LLM や session log を再起動しなくてよい。

この経路が示すのは、Cordis がモデル・Bash・承認を「理解」しないことだ。それは Context operation、provision、inject、Fiber、effect だけを理解し；Harness が Service Definition とイベント名でこれらの仕組みに領域意味を与える。階層があるからこそ、理論保証は Context が仲介する構造だけを覆い、ツールコマンドの安全・モデル出力の正しさ・承認方針の十分さはなお上層の責任だ。

### 「追跡可能」がなぜプラグインライフサイクルだけでは足りないか

Harness の原則 “Model-visible means logged” は、モデルリクエストへ入る内容が append-only ログで再構築できることを要求する。さもなければ prompt-injection 防護プラグインをホット置換したあと、チームはいまどの版のプラグインが載っているかは知っても、ある歴史リクエストに結局どのコンテキストが注入されたかを知らないかもしれない。Fiber ログは実行構造に答え、session log は業務イベントに答え、完全監査には関連 ID が要る。

逆に session log だけでも足りない。再生記録はツールが呼ばれたことを示せても、旧 timer の取消・ポート解放・ツール登録の撤出を自動ではしない。実行ライフサイクルと永続事実を「どちらもログがある」と混ぜると二類の缺口が残る。成熟した Harness は観測層で session、turn、step、Fiber episode、provider uid、設定 revision を繋ぎつつ、それぞれの異なる回復語義を保つべきだ。


## ゼロから書く：装着・撤回・依存置換ができるプラグイン

抽象仕組みは一度の実実行で締めくくるのがよい。以下の例は上流 `cordis@4.0.0-rc.8` だけを使い、`@deepseek-ai/cordis` や Harness のツールパッケージを混ぜない。Node.js v23.5.0、pnpm 10.15.1 下で原文通り通過した；これらの環境版は再現実験の記録であり、Cordis 公式の最低版宣言ではない。

例は `toolbox` で全文を貫くツール登録サービスを代表する。Consumer はそれに依存し、活性化時にツール・イベントリスナー・timer を一つずつ登録する。先に A を提供し、次に A を外して B を提供し、最後にアンロードする。アサーションはライフサイクル状態だけでなく、資源が本当に消えたかも検査する。

```js
import assert from 'node:assert/strict'
import { Context, FiberState } from 'cordis'

const root = new Context()
const tools = new Map()
const liveTimers = new Set()
const stats = { activations: [], cleanups: [], events: 0, ticks: 0 }
const stateName = state => FiberState[state]
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

function makeToolbox(version) {
  return {
    version,
    register(name, run) {
      assert.equal(tools.has(name), false)
      tools.set(name, { version, run })
      return () => tools.delete(name)
    },
  }
}

const ToolboxProvider = {
  name: 'toolbox-provider',
  apply(ctx, { version }) {
    // makeToolbox 是示例替身，不是 Cordis core 内置的 tools API。
    ctx.provide('toolbox', makeToolbox(version))
  },
}

const Consumer = {
  name: 'consumer',
  inject: ['toolbox'],
  apply(ctx) {
    const version = ctx.toolbox.version
    stats.activations.push(version)

    ctx.on('probe', () => stats.events++)

    ctx.effect(() => {
      const timer = setInterval(() => stats.ticks++, 5)
      liveTimers.add(timer)
      return () => {
        clearInterval(timer)
        liveTimers.delete(timer)
      }
    }, 'consumer timer')

    ctx.effect(() => {
      return ctx.toolbox.register('hello', () => `hello from ${version}`)
    }, 'consumer tool')

    return () => stats.cleanups.push(version)
  },
}

const consumer = root.plugin(Consumer)
assert.equal(consumer.state, FiberState.PENDING)
console.log('01 missing provider:', stateName(consumer.state))

const providerA = root.plugin(ToolboxProvider, { version: 'A' })
await providerA.await()
const providerAUid = providerA.uid
await consumer.await()
assert.equal(consumer.state, FiberState.ACTIVE)
assert.equal(tools.get('hello').run(), 'hello from A')
root.emit('probe')
await sleep(20)
assert.equal(stats.ticks > 0, true)
console.log('02 provider A:', stateName(consumer.state))

await providerA.dispose()
await consumer.await()
assert.equal(consumer.state, FiberState.PENDING)
assert.equal(tools.size, 0)
assert.equal(liveTimers.size, 0)

const eventsAfterA = stats.events
const ticksAfterA = stats.ticks
root.emit('probe')
await sleep(20)
assert.equal(stats.events, eventsAfterA)
assert.equal(stats.ticks, ticksAfterA)
console.log('03 provider A removed:', stateName(consumer.state))

const providerB = root.plugin(ToolboxProvider, { version: 'B' })
await providerB.await()
assert.notEqual(providerB.uid, providerAUid)
await consumer.await()
assert.equal(consumer.state, FiberState.ACTIVE)
assert.equal(tools.get('hello').run(), 'hello from B')
root.emit('probe')
await sleep(20)
assert.equal(stats.ticks > ticksAfterA, true)
assert.equal(providerB.uid !== providerAUid, true)
console.log('04 provider B replacement:', stateName(consumer.state))

await consumer.dispose()
await providerB.dispose()

const finalEvents = stats.events
const finalTicks = stats.ticks
root.emit('probe')
await sleep(20)
assert.equal(consumer.state, FiberState.DISPOSED)
assert.equal(tools.size, 0)
assert.equal(liveTimers.size, 0)
assert.equal(stats.events, finalEvents)
assert.equal(stats.ticks, finalTicks)
assert.deepEqual(stats.activations, ['A', 'B'])
assert.deepEqual(stats.cleanups, ['A', 'B'])
console.log('05 final:', stateName(consumer.state))
```

再現コマンドは次のとおり：

```sh
pnpm init
pnpm add cordis@4.0.0-rc.8
node lifecycle.mjs
```

紙幅を節約するため、コード中の `console.log` は状態だけを打つ；検証時に記録した核心出力と資源スナップショットは：

```text
01 missing provider: PENDING
02 provider A: ACTIVE
   activations=[A], tools=[hello], liveTimers=1, events=1
03 provider A removed: PENDING
   cleanups=[A], tools=[], liveTimers=0
   listenerFiredAfterCleanup=false, timerTickedAfterCleanup=false
04 provider B replacement: ACTIVE
   activations=[A,B], tools=[hello], liveTimers=1, events=2
   providerChanged=true
05 final: DISPOSED
   cleanups=[A,B], tools=[], liveTimers=0
   listenerFiredAfterCleanup=false, timerTickedAfterCleanup=false
```

### 一行ずつ見る：本当に何が起きているか

`root.plugin(Consumer)` は先に Fiber を作る。`inject: ['toolbox']` がまだ満たされないため、`apply` は全く実行されず、状態は PENDING。これは「先に走って `undefined` に触れてエラー」より強く、待機がモデル中の一等状態だからだ。

`root.plugin(ToolboxProvider, { version: 'A' })` は独立 Provider Fiber を立て；自身の `apply` で `ctx.provide` により coeffect を提供する。A が現れると target が満たされ、Consumer が ACTIVE へ。`ctx.on` の購読登記は Context が管理する；timer には Cordis 専用高階 API がないので明示的に `ctx.effect` へ包む；ツール登録表自体が disposer を返し、それをこの effect の inverse として直接使う。三類の異なる資源が最終的にいずれも Consumer Fiber に帰属する。

`providerA.dispose()` の呼び出しは `root.toolbox` を `undefined` にするだけではない。ランタイムは committed provider が失効しようとしているのを見て、先に Consumer に recovery を実行させる。アサーションはその後、ツール Map が空・timer Set が空であることを証明する；再び `probe` を発するか 20 ms 待つと、計数は増えない——listener と timer が「論理上無効」なだけでなく、本当に解除されたことを示す。Provider の登記・撤回・dependent 通知は固定スナップショットの [`reflect.ts`](https://github.com/cordiverse/cordis/blob/8cc9e33fab69e2d0476d126baaf2acb24e6a6ab4/packages/core/src/reflect.ts#L175-L227) で検証できる。

B が現れたあと、コンポーネント定義は変わらないが、新しい episode が生まれる。A、B は二つの独立 Provider Fiber で、公開 `uid` が異なる；したがって `providerChanged=true` のアサーションが検証するのは provider identity 変化であり、同一オブジェクトの値変更だけではない。閉包中の `version` が再び `B` を捕え、ツールは `hello from B` を返し、活性化記録は `['A', 'B']` になる。最後に `consumer.dispose()` が二度目の episode を終え、二度の cleanup がいずれも記録され、状態は DISPOSED へ。

この例はなお三つの実戦規則を示す。

第一、**Service Definition に依存し、Provider を import しない。** Consumer が `makeToolboxA` を直接 import すれば、ランタイムはそれを B に換えられない；安定 key と契約が中間にあってはじめて、Provider と Consumer が別々に進化できる。大型 Harness では、Definition は通常単独の小パッケージであるべきで、consumer が型を取るために具体バックエンドまで依存してしまわないようにする。

第二、**取得と inverse は隣り合わせでなければならない。** timer を足すときはすぐ `clearInterval` を書き、ツールを登録するときはすぐ disposer を取る。そうすれば code review が資源の対を局所検査でき；`apply` 後半が失敗しても、前半で登記済みの effect はなお回収できる。すべてのクリーンアップを遠い `deactivate()` に集めると、後から足した分岐を落としやすい。

第三、**正常ライフサイクル内の disposer を手で呼んではいけない。** 一度 effect が Context 所有になったあと、業務コードが同じ disposer を先に呼ぶと、二重解放や recovery スタックと実状態の非同期を招きうる。資源を本当に早めに終える必要があるなら、その状態変化も管理された子ライフサイクルとしてモデル化するか、冪等/取消を明示支持する封装を使う。

最後にデモ境界を述べる：ここでは Provider A を明示 dispose してから独立 Provider B をマウントするので、途中に PENDING を明確に観察する。Loader のトランザクション式 replacement や異なる HMR 方針は同じ中間状態を晒さないかもしれず、この出力から「すべての Cordis ホット置換 UI が必ず PENDING を一瞬見せる」とは導けない。デモが証明するのは、依存撤出が Consumer をクリーンアップすること、provider identity 変化が新 episode を開くこと、登記済み資源が残留しないことだ；任意の第三者 disposer の正しさや性能ベンチマークは証明しない。


## v4、Koishi、Shigma、JS/TS、Rust とパッケージ名

Cordis 周りの検索結果では、版・人物・言語・パッケージ名がしばしば交叉する。一手材料で確認できる事実を一箇所にまとめる。

| 問い | 2026-08-23 時点の答え |
| --- | --- |
| Cordis はいつ始まったか？ | npm `cordis@0.1.0` は 2022-04-21 公開；現 GitHub 倉庫オブジェクトは 2022-05-17 作成。プロジェクトは DeepSeek Harness より約四年早い |
| v3 と v4 の関係は？ | Koishi 本番エコシステムはなお v3；論文と Harness vendor は v4 線が基盤。論文は核心の組合せ思想の連続を述べるが、v4 は effect/coeffect を細化し Loader を作り直した |
| Shigma とは誰か？ | 確認できるのは npm `cordis` の author 欄が Shigma、論文連絡メールが `cordis.io` を使うこと；メールや提出史だけでより具体的な雇用・買収・所有権関係は推断できない |
| Cordiverse とは何か？ | 現在の上流 Cordis と論文が属する GitHub 組織。倉庫位置はすべての歴史著作権と個人関係の完全叙述を自動では意味しない |
| `cordis` と `@deepseek-ai/cordis`？ | 前者は上流 npm パッケージ；後者は Harness が vendor・rescope・ローカル改変した公開パッケージ。import 名と版系列は混用できない |
| Cordis は JavaScript か TypeScript か？ | ソースは TypeScript、公開は ESM JavaScript + 型宣言；正確には「TypeScript 実装の現代 JavaScript メタフレームワーク」 |
| Harness は Python プロジェクトか？ | monorepo 主体は TypeScript。公式は別途 Python SDK を持ち、stdio 上の newline-delimited JSON-RPC で bundled runtime を駆動する；これは Cordis core が Python に書き直されたことを意味しない |
| 公式 Cordis Rust はあるか？ | 本調査では見つからなかった。論文は Rust traits・マクロ・動的読み込み・WebAssembly の移植可能設計を議論するが、それは言語非依存分析であり、既存の `cordis-rust` 実装ではない |

Rust の ownership（所有権）と RAII はなお良い対照だ。それらはコンポーネント内部の値と資源を、静的・語彙ライフサイクル終了時に信頼して解放させる；Cordis が注目するのは、配備後に境界が決まり、任意の長さに跨り、provider トポロジに応答するコンポーネントライフサイクルだ。Rust 版 context paradigm もなおサービス登録表・動的依存解決・コンポーネント identity・アンロード協調を要する。両者は補完でき、「クリーンアップ」を語るからといって互いに代替できない。

版の日付も「事実の種類」を分けねばならない。Harness 公開 Git 履歴は 2026-06 の根コミットまで遡れるが、GitHub 倉庫オブジェクトは 8 月作成で、履歴のインポートかもしれず；npm プレリリース、GitHub Release、公式製品ページ、倉庫公開も同一イベントではない。現在穏当に言えるのは：DeepSeek Harness が 2026 年 8 月中旬に開発者プレビューを開き、8 月 13 日に照合可能な製品ページ・倉庫オブジェクト・論文草稿があることだ。検索語の “Aug 14, 2026” だけでは、あるタイムゾーンにおける「正式安定公開日」を単独では証明できない。

## DI、OSGi、React、FRP、トランザクション、Saga、Rust RAII と何が違うか

Cordis の出現でどのアーキテクチャも時代遅れになるわけではない。差を判断する最も有効な方法は、扱う粒度・ライフサイクル境界・依存変化を比較することだ。

| 技術 | 主な粒度と境界 | 撤回方式 | 依存変化への反応 | Cordis との関係 |
| --- | --- | --- | --- | --- |
| 普通の module import | コンパイル/モジュール読み込み | プロセス退出または手動クリーンアップ | provider のランタイム消失を担わない | Cordis はなお JS モジュールでコードを載せるが、マウントインスタンスは別に管理 |
| 起動時 DI / IoC | オブジェクトとサービス、通常起動期にバインド | コンテナ shutdown hook | 既存 consumer は通常 provider 身分置換で自動再構築されない | Cordis は反応的コンポーネントライフサイクルと effect ownership を追加 |
| OSGi Declarative Services / iPOJO | 動的 bundle と service | 手書き deactivate callback | service の出現・消失に伴い活性化・停止しうる | reactive coeffect の近隣；Cordis は effect 追跡をさらに統一し非同期撤回を形式化 |
| React `useEffect` | UI コンポーネントの一度の hook episode | setup が返す cleanup | dependency array 変化時に再実行 | 対の形はよく似る；React の目標は描画木であり、開放された任意サービス依存グラフではない |
| FRP / signals | 値と派生計算 | 通常は核心目標ではない | 値変化が細粒度再計算を駆動し、しばしば glitch なしを目指す | Cordis は非同期コンポーネントライフサイクル粒度で反応；signal はある coeffect の内部実装にもなりうる |
| `try/finally` / bracket | 一段の語彙制御流 | ブロック退出時にクリーンアップ | 長期サービス依存を解決しない | 単一 effect を書く基礎道具；Cordis は境界を動的 Fiber へ延長 |
| データベーストランザクション / STM | 事前に区切った短トランザクション | abort、ログまたは版ロールバック | 長期コンポーネントトポロジを担わない | Context 操作内部に使える；Cordis 自身は DB 隔離レベルを提供しない |
| Saga | 分散業務フロー | 業務補償 | フローに沿いステップを編成 | system boundary 外で本当に逆転できない effect の扱いに適する |
| Rust ownership / RAII | 値と語彙資源 | `Drop` が自動で起こる | 動的 provider グラフを追跡しない | コンポーネント内部資源安全の補完仕組み |
| Kubernetes | プロセス・コンテナ・サービス | インスタンス再構築 | サービス級期待状態調和 | Cordis は同プロセスコンポーネント粒度で、障害と安全隔離の代替にはならない |
| Event sourcing | 業務事実ログ | 逆イベント追記または投影再構築 | プラグイン依存を管理しない | Harness session log がその発想でモデル可視事実を永続化し、Fiber recovery とは二軸 |
| MCP | Agent と外部ツール/資源のプロトコル | 具体クライアントとサービスが決める | Harness 内部コンポーネントを管理しない | MCP provider/client はプラグインになりうるが、Cordis は wire protocol を代替しない |

データベーストランザクションと比べ、「撤回可能な effect」は最も言い過ぎやすい。トランザクションはしばしば閉じたデータ塊を制御し、失敗前に外へ提出しない；Cordis effect はプラグイン寿命全体に跨り、その間の結果はすでに他コンポーネントに観察されうる。それは inverse と観察同値に依り、原子性・隔離性・永続性を自動では得ない。Saga は外部業務現実により近い：返金は引き落としを歴史から消すのではなく、補償ステップを追記することだ。

React `useEffect` と比べ、両者とも setup と cleanup を同地に置くことを勧める。だが React の dependency array は描画モデルが駆動し、hook には固定呼び出し規則がある；Cordis の coeffect は独立パッケージを跨ぐ service topology から来て、Fiber はなお Service を提供し、子プラグインを所有し、Loader 調和に参加できる。似た API 輪郭は同じシステム境界を意味しない。

OSGi と比べ、動的 service binding は新しいことではない。論文の主張は「サービス出現と消失を初めて可能にした」ことではなく、撤回可能な effect、反応的な coeffect、統一 Context、非同期ライフサイクル、回復/合流性質を一組のより一般的なモデルへ入れ、TypeScript メタフレームワークで実装することだ。これは隣接思想の継承と再組織であり、真空からプラグインシステムを発明したと書いてはいけない。

## それが解かないこと：理論前提、工学コスト、採用境界

Cordis を採用する前に、少なくとも次の問いに答えるべきだ。

### 1. 影響は本当に Context を通るか？

ambient global state（環境グローバル状態）の直接変更、ネットワークデータの送信、補償プロトコルのない外部システム呼び出しは、いずれも自動回復の境界外だ。明示的な `ctx.effect` は書けるが、disposer の正しさはなお業務語義が保証する。監査、冪等 key、outbox、二相コミット、Saga が必要なら、Cordis はそれらのプロトコルを代替しない。

### 2. 「再構築」が要るか、「移行」が要るか？

Cordis のデフォルト発想は旧 episode を撤き、新依存に従いきれいな状態から新 episode を立てることだ。**DSU（dynamic software updating、動的ソフトウェア更新）** は旧コードの内部状態を新版へ移行する研究で、別類の問題だ。Agent に長寿命状態があるなら、より安定した session/storage service に置くか、明示的に版移行を設計し、关键状態をホット置換可能なプラグインの私有閉包に閉じ込めない。

### 3. 依存グラフは環になるか？

A が B を必ず注入し、B がまた A を必ず注入するなら、両者は永遠に PENDING になりうる。論文の Progress と Confluence 結果は無環などの前提を要求し、ランタイムはせいぜい cycle を診断でき、誰が先に起動するかを無から決めない。解決は通常、コンポーネント再分割、共通 Definition の抽出、イベントプロトコルへの変更、または双方向協調を所有する integration component だ。

### 4. 権限境界はどこか？

`inject` は良性プラグインにどの Context capability が授与されるかを表現でき、isolation は解決域を変え、interception は方針を実施できる；だが同プロセス JavaScript は悪意コードのサンドボックスではない。第三者の信頼できないプラグインには最小 OS 権限、子プロセスまたはコンテナ隔離、ネットワーク方針、機密管理、サプライチェーン監査が要る。Harness が sandbox プラグインを提供することは、すべてのプラグインが天然に安全であることを意味しない。

### 5. インターフェース身分と版をどう統治するか？

異なる著者が無関係な能力に同じ key を使い；同じ key の TypeScript 形状も版で漂移しうる。名前空間、Service Definition パッケージ、peer dependency、semver、契約テストはなお欠かせない。TypeScript 型はコンパイル後に消去され、ランタイムは二つの独立 npm パッケージが同一 service 語義で完全一致することを自動証明しない。

### 6. チームは本当にランタイム増減が必要か？

Context 仲介、Fiber メタデータ、Loader、イベント優先度、ライフサイクル診断には認知と実行コストがある。応用が配備時だけ組み立て、再起動が安く、プラグインが同一チームに完全に制御されるなら、普通モジュール・起動時 DI・`try/finally` のほうがしばしば簡単だ。Cordis の優位は「細粒度・長寿命・頻繁再編成で再起動が高い」システムでこそ実現する。

### 7. プレビュー期の変化を受け入れられるか？

論文は active revision、Cordis v4 はなお RC、DeepSeek Harness 公式は developer preview に breaking changes がありうると明示警告する。生産採用は commit または精確版を固定し、上流と `@deepseek-ai` vendor API を隔離し、設定 schema を記録し、provider 置換・失敗ロールバック・残留クリーンアップの回帰テストを立てるべきだ。

### 実行可能な採用フロー

以上の答えがなお動的コンポーネントを指すなら、最初の一歩は既存コードを全部プラグインにすることではなく、本当にランタイム置換が要る縦切片を選ぶことだ。例えば「調査ツール → ツール登録表 → LLM provider」だけをパイロットにし、既存セッションと UI は残す。パイロットは装着・撤回・置換・失敗の四経路を同時に覆うべきで；起動成功だけを検証すると、最も重要なリスクが生産へ残る。

第二ステップは **effect inventory（効果目録）** だ。コンポーネントが変更するメモリ表・listener・timer・ファイルハンドル・子プロセス・ネットワークリクエスト・DB 記録・外部メッセージを項目ごとに列挙する。各項目に owner、作成時点、inverse、冪等か、system boundary を跨ぐか、クリーンアップ失敗後の再試行担当を書く。目録の目的は文書の完璧ではなく、「どう撤回するか全く分からない」資源を早めに晒すことだ。

| Effect | Owner | 回復方針 | 必測の失敗 |
| --- | --- | --- | --- |
| ツール登録 | Tool Fiber | registry disposer、registration identity で削除 | 同名ツール、重複 dispose |
| イベント購読 | Tool Fiber | `ctx.on` 自動登録解除 | handler 例外、アンロード後に再発火してはいけない |
| キャッシュ timer | Tool Fiber | `clearInterval` + 診断集合から削除 | apply 途中失敗、急速再読み込み |
| LLM stream | LLM/Consumer プロトコルが共同決定 | `AbortSignal` または着地後に旧 episode 結果を捨てる | ストリーム途中での provider 切替 |
| 外部メッセージ | 業務 Service | withholding、冪等 key、または補償イベント | 送信済みだがローカルコミット失敗 |

第三ステップは **capability matrix（能力行列）** を設計する。各行は Service Definition、各列は Provider・Consumer・隔離域・傍受方針・版 owner。いわゆる Service に呼び出し者が一人だけで、永遠に置換されず、パッケージ横断契約も要らないなら、先に普通モジュールを残す；早すぎる seam はパッケージ・設定・版の数を増やす。複数 Consumer が一緒にバックエンドを換えねばならない、または異なる realm が同名実装を見る必要があるなら、それは高価値 seam だ。

第四ステップは依存を有向グラフに描き、積極的に環を消す。辺 `A -> B` は A の活性化に B が要ることを表す；import graph で代用してはいけない——型パッケージの import はランタイムで特定 Provider に依存することに等しくない。各辺にさらに問う：本当に必須か？任意 observer に変えられるか？イベントで制御を逆転できるか？なお環があれば、共通 Definition または integration component を抽出し、Loader に順序を推測させない。

第五ステップはライフサイクル SLO（service level objective、サービス級目標）を定義する。例えば：ツール無効化後 500 ms 以内に registry から消える；普通リクエストは 5 s 以内に排空し、タイムアウト後は cooperative abort；provider 切替中の新ツール呼び出しは旧バックエンドへ落ちず拒否する；失敗ロールバック後、关键 profile は 10 s 以内に ready を回復する。時間と状態目標がなければ、UNLOADING は無限に延び、運用は曖昧な「詰まった」しか見えない。

第六ステップは故障注入テストを立て、happy path だけを書かない。少なくとも覆う：各初期化ステップの例外；各 disposer の例外またはタイムアウト；LOADING 中の依存変化；provider の急速 A-B-A チャーン；親子 Fiber の同時 dispose 要求；新 HMR モジュール検証失敗；任意 provider 欠如；補償中のプロセス停電。各テストは Registry・ツール数・listener 数・timer 数・子プロセス・ポートをアサートし、状態列挙だけをアサートしない。

第七ステップは可観測性と設定 revision を繋ぐ。ログは Fiber uid、component 名、episode、target/committed providers、effect タグ、entry ID、profile revision を含み；指標は PENDING 時間、読み込み失敗率、アンロード時間、強制終了、HMR ロールバックを数えられる。『provider がなぜ消えないか』に直面したとき、運用はどの committed Consumer がまだ退出していないかを直接見られ、heap dump で閉包を推測しなくてよい。

最後に段階的に境界を広げる：先にプラグインを完全撤出できるようにし、次に provider 置換を許し、次に宣言的設定調和を有効化し、最後に自動 HMR や Agent 自己改変を考える。各層は前層の recovery 契約に依存する。「everything is a plugin」を初日の組織スローガンにすると、浅いパッケージと隠れたグローバル状態が大量に得られやすい；それを段階的に広げる回復可能境界とみなすことこそ、Cordis 論文が本当に強調する規律に近い。

## 検索問題の速答

### Cordis とは何か？

Cordis は TypeScript 実装・現代 JavaScript 向け公開のプラグイン・メタフレームワークだ。Context でサービス・イベント・effect 所有権・依存変化・プラグインライフサイクルを管理し、AI モデルや特定 Agent 製品ではない。[上流倉庫](https://github.com/cordiverse/cordis)

### Cordis は DeepSeek が開発したのか？

2026 年から始まったわけではない。`cordis` は 2022 年にすでに公開され、npm author は Shigma、現上流は Cordiverse。DeepSeek Harness が後から採用・vendor・再マップ・改変した。

### Cordis と DeepSeek Harness の関係は？

Cordis は汎用組合せランタイム；DeepSeek Harness は Agent 領域フレームワーク/製品。Harness は Cordis でモデル・ツール・セッション・Agent Loop・サンドボックス・UI をプラグイン木として組み立てる。[Harness アーキテクチャ](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/architecture.md)

### `cordis` と `@deepseek-ai/cordis` の違いは？

`cordis` は上流 npm パッケージ；`@deepseek-ai/cordis` は Harness がソースを複製・改名・ローカル hardening を加えたパッケージ。版番号と挙動が完全同一だと仮定できず、プラグイン執筆時に import を混用してはいけない。

### Cordis は plugin system、kernel、framework、meta-framework のどれか？

Context プラグインシステムとライフサイクル核心を基盤とする meta-framework だ。Kernel は最小協調層を説明する非公式言い方；上層の Koishi と DeepSeek Harness がチャットまたは Agent 領域語義を加える。

### Cordis v4 と Koishi の Cordis の関係は？

Koishi の生産事例は主に v3；論文形式化と Harness vendor は v4 線。核心の組合せ思想は連続するが、v4 のすべての実装と定理条件が Koishi 全生態で検証済みとは言えない。

### Cordis は JavaScript、TypeScript、Rust のどれを使うか？

公式実装は TypeScript、公開は ESM JavaScript と型宣言。現時点で公式 Rust 版は見つからない；論文は言語非依存の移植条件を議論するが、既存の `cordis-rust` を意味しない。

### 「Everything is a Plugin」はプラグイン権限が同じことを意味するか？

いいえ。製品責務が置換可能なプラグインで組み立てられることを表す。Context は能力と方針を表現できるが、悪意プラグインの隔離はなおプロセス・コンテナ・OS sandbox・最小権限に依存する。

### 論文原文と GitHub はどこか？

プレプリントは [`cordiverse/paper`](https://github.com/cordiverse/paper)、Cordis は [`cordiverse/cordis`](https://github.com/cordiverse/cordis)、Harness は [`deepseek-ai/deepseek-harness`](https://github.com/deepseek-ai/deepseek-harness)。論文にはまだ検証済み DOI や arXiv 記録がない。

### Harness にツールを一つ足すだけなら、どこから始めるか？

先に固定版の[第三者プラグインチュートリアル](https://github.com/deepseek-ai/deepseek-harness/tree/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/user/develop)を読み、公式 Service Definition に依存し、`inject` で registry を待ち、登録を owning Context に渡し、対象 profile でインストールと patch をする。先に Agent Loop を改めない。

## 核心用語速査

この表は別の定義集ではなく、全文で初出した用語を一ページへ圧縮し、ソースと論文を読むときの対照用だ。

| 用語 | 本稿での精確定義 |
| --- | --- |
| Composition | より小さな部品でより大きなシステムを組み立てること；動的組合は関係がプロセス運行中に変わりうる |
| Component | 依存・提供能力・活性化行為を宣言するコンポーネント定義。ある実行インスタンスそのものではない |
| Plugin | Component のコードと組立形態。関数・オブジェクト・Service class でありうる |
| Context | サービス読み取り・effect 登記・作用域派生・ライフサイクル帰属を仲介する一等ランタイム環境 |
| Context type | Context の実行可能操作と法則を規定する抽象構造。TypeScript interface 一枚だけではない |
| Effect | コンポーネントが共有環境に及ぼす変更。登録・購読・接続・サービス提供など |
| Revertible effect | 実行時に今回状態向けの inverse を同時に生み、owner ライフサイクルが追跡する effect |
| Inverse / disposer | すでに起こった変更を撤回する操作；Cordis はそれを呼ぶが正しさを自動証明しない |
| Witness | inverse 作成に必要な今回実行情報。旧値・ハンドル・registration identity など |
| Coeffect | コンポーネントが環境に要求する条件または能力。「プログラムが外へ変える」effect と方向が対 |
| Reactive coeffect | Context 変化時に継続再計算される依存制約。活性化・停止・再構築を引き起こしうる |
| Service Definition | service key・型・行為・版契約を固定する中立定義層 |
| Provider | ある Context realm で Service を実装・提供するコンポーネント |
| Consumer | Service Definition だけに依存し、ランタイム解決の実装を使うコンポーネント |
| Provision | Provider が Context に「ある能力を提供する」登記。それ自体も effect |
| Inject | コンポーネントが宣言する必須 coeffect specification。起動時の一度の空値検査ではない |
| Fiber | 一度のプラグインマウントのランタイム身分・状態機械・依存コミット・recovery owner |
| Episode | Fiber が committed providers の一組の下で活性化から停止までの一度の運行断片 |
| Registry | Fiber・親子関係・provisions・依存解決を保存するランタイム事実源 |
| Target view | 現 Registry から再計算した期待 provider 解決結果 |
| Committed view | 現 episode が使うとコミットした provider identity。変換中は一貫を保つ |
| Recovery accumulator | 完了済み effects の inverses を段階収集し、失敗またはアンロード時に展開する回復スタック |
| Observational equivalence | 外界が公開 coeffect 操作で区別できない状態同値。bit 単位同一ではない |
| Independence | 二つの effect の forward・inverse・inverse 選択・結果が観察語義上互いに干渉しないこと |
| Isolation | 同名 service key が異なる子 Context で異なる realm/provider へ解決されるようにすること |
| Interception | key の有無を変えず、能力アクセスを包んで権限・監査・方針を実施すること |
| Loader | 宣言的設定の期待 entry tree を実際の Fiber tree へ調和するランタイムコンポーネント |
| Reconciliation | 期待と実際を比較し、差異ノードだけをマウント・撤出・更新する過程 |
| HMR | プロセス全体を再起動せずモジュールを置換すること；正しい実装は完全な Fiber アンロードと失敗回復を再利用せねばならない |
| Meta-framework | 業務領域を規定せず、領域フレームワーク組立に必要な組合せセマンティクスを提供する下層フレームワーク |
| Agent Harness | モデル外でツール・セッション・権限・実行ループ・回復・サンドボックス・UI を担う実行基盤 |
| Profile | DeepSeek Harness でユーザーが選ぶ具名製品組立。bundles と patches を重ねる |
| Bundle | 配布可能な一組の Cordis entries・設定・関連プラグインコード |
| Patch / overlay | 安定 entry ID で設定を変更または挿入する覆蓋層 |
| Capability seam | Definition・Provider・Consumer から成り、実装の独立置換を許す能力境界 |
| Durable event | 追記ログへ入り、回復と再生に使える業務事実 |
| Live extension point | 現実行の制御と傍受だけに仕え、必ずしも永続化されないイベント拡張点 |
| Quiescent state | 未推進のライフサイクル変換がない静止状態。業務健康を自動では意味しない |
| Confluence | 厳格な前提の下、異なる合法スケジュールが最終的に観察同値の normal form へ合流する性質 |

## 結び：組合の終点は「載せられる」ではなく、撤け、換え、続けられることだ

開場の調査ツールプラグインへ戻る。成熟したプラグインシステムの標準は、ランタイムへ機能を一つ多く詰め込めることではなく、正確に答えられることだ：それは何を変え、誰に依存し、provider 変化時に誰が先に退出するか、去ったあとどの影響が消えねばならないか。Cordis の貢献は答えを Context・revertible effect・reactive coeffect・Fiber ライフサイクル契約へ圧縮し、Loader に動的設定木全体を継続調和させることだ。

システムが頻繁なランタイム再編成を要し、局所置換の価値が高く、全プロセス再起動のコストが大きいとき、このパラダイムは真剣に研究する価値がある。システムが静的で境界がはっきりし再起動が安いなら、先にモジュール・DI・`try/finally` を使う。可組合せ性の成熟は「何でも挿せる」ことではなく、コンポーネントが撤け、換えられ、システムが一貫して運行を続けられることに体現する。

## 主な参考資料とスナップショット

原論文を読み続けるなら、第一ページから最後まで硬く噛む必要はない。先に要約・序論・第 2 節を読み、effect/coeffect の二軸を確認し；その後本稿のプラグイン例を携えて revertible context と reactive context を読む。公式に出会ったら三つの問いを先に立てる：現状態にどの観察可能位置があるか、本ステップがどんな witness/inverse を生んだか、コンポーネントの依存 target は変わったか。この三つを理解してから、component calculus の Registry・Fiber・transition rules へ入る。

定理部分は「結論」と「前提」を一緒にノートする。recovery を見たら independence を標し、progress を見たら無環・有限・有界を標し、confluence を見たらさらに total provision・無失敗・観察同値を標す。最後に Cordis/Koishi 事例と制限の章を読み、形式モデル・TypeScript 実装・生態証拠を分ける。そうすれば条件付き証明を無条件の製品約束と誤読しない。

ソース読みは `fiber.ts` の effect ownership と状態遷移から始め、次に `reflect.ts` の provider 撤回、`events.ts` の listener effect、最後に Loader/HMR へ入る。先に commit を固定してから npm パッケージと対照する——上流 RC と Harness vendor 改変はなお急速に進化しているからだ。本稿のすべてのソースリンクは同一研究スナップショットに釘付けし、後日 API が変わっても当時の判断を再構築できるようにする。

- [論文 README，commit `13f28585`](https://github.com/cordiverse/paper/blob/13f28585668a28106b2f53bedada36e45bc1ed3e/README.md)：プレプリント状態と引用境界。
- [論文 PDF，2026-08-13 固定スナップショット](https://github.com/cordiverse/paper/blob/13f28585668a28106b2f53bedada36e45bc1ed3e/paper.pdf)：effect/coeffect、コンポーネント演算、定理、Koishi 事例と制限。
- [Cordis 上流倉庫](https://github.com/cordiverse/cordis)と[核心 Fiber ソース，commit `8cc9e33f`](https://github.com/cordiverse/cordis/blob/8cc9e33fab69e2d0476d126baaf2acb24e6a6ab4/packages/core/src/fiber.ts)：実装とライフサイクル検証。
- [DeepSeek Harness アーキテクチャ，commit `b150a551`](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/architecture.md)：プラグイン化 Agent、セッションログ、拡張点。
- [Harness vendor 目録](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/vendor/README.md)：Cordis 出典スナップショット、パッケージ名再マップ、ローカル改変。
- [Harness Cordis チュートリアル](https://github.com/deepseek-ai/deepseek-harness/tree/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/cordis-tutorial)と[プラグイン開発文書](https://github.com/deepseek-ai/deepseek-harness/tree/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/user/develop)：API と工学実践。

本稿は DeepSeek Harness の性能ベンチマークを走らせておらず、第三者プラグインも監査していない。版・パッケージ名・developer-preview 状態は 2026-08-23 の上記スナップショットだけに責任を持ち；理論結論は論文が明示する独立性・無環・有限性・total provision・無失敗などの前提の下でのみ解釈する。
