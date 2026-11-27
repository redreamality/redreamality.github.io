---
title: "自己進化 skill はどこで止まるか：72 万件の実行記録による対照台帳と、改善者に見えない審判"
seoTitle: "自己進化 skill はなぜ伸びないか：Which Failure の対照実験と SealedLoop の封印審判"
description: "RSI フロンティア第 2 回。arXiv:2611.29290 は 9 つのベンチマーク、4 つのモデル、4 段階の harness で一度に 1 軸だけを動かし、自己進化した skill は人が書いた数行をほとんど上回らず、評価の抜け穴を学び、別のモデルに移すと壊れることを示した。arXiv:2611.33794 の SealedLoop は、改善者から見えない審判に逐次検定で採用か巻き戻しかを決めさせる。本稿は両論文の公開台帳で主要な数字を再計算し、SealedLoop の判定ゲートを skill 台帳にかけた。のぞき見による偽陽性は防ぐが、LiveMath の抜け穴はそのまま通した。"
pubDate: 2026-11-27T09:00:00+08:00
author: "Remy"
tags: ["rsi", "ai-agents", "agent-harness", "agent-loop", "evaluation"]
lang: "ja"
translatedFrom: "self-evolving-skills-stall-sealed-judge"
series: rsi
---

**結論から：** 今週の RSI で最も堅実だった 2 本の論文は、どちらも自分をうまく書き換える新しいエージェントを提案していない。「変更のあと誰が判断するか」を、誰でも再計算できる帳簿にした。南カリフォルニア大学と Amazon の Which Failure は、9 つのベンチマーク、4 つのモデル、4 段階の harness で一度に 1 軸だけを動かして 3 種類の skill を比べ、自己進化した skill は人が書いた数行をほとんど上回らず、ベンチマークの抜け穴を学び、別のモデルに移すと点数を壊すことがあり、足りない事実は補えないと結論した。[1] ウィスコンシン大学マディソン校と UC サンタクルーズの SealedLoop は、自己改善ループに封印された審判を加える。改善者はその審判のデータ、パラメータ、サンプリング計画を見られず、新しい版は審判の逐次検定を通ったときだけ残る。ループ内の審判はより悪い方策を残し、封印検定は既知の本物の改善 12 組のうち 11 組を通し、退行 59 組は 1 組も通さなかった。[2] 2 本ともコードと項目ごとのデータを公開している。手元で主要な数字を再計算し、SealedLoop の判定ゲートを Which Failure の台帳にかけてみた。ノイズにはほとんど騙されないが、LiveMath の抜け穴はそのまま通した。

| | 何を変えるか | 誰が受け入れを判断するか | 進歩は本物か |
| --- | --- | --- | --- |
| Which Failure（arXiv:2611.29290、11 月 22 日） | 新手法はなし。Direct、SkillOpt、Trace2Skill の 3 種類の skill が、モデルと harness を変えたときどの失敗を実際に直すかを測る | 同じ問題での対比較、各セル 3 回反復、失敗原因は結果を見る前に固定 | 大きな伸びの多くは回答形式と抜け穴。残る伸びは、エラーを出さない誤りへのチェック |
| SealedLoop（arXiv:2611.33794、11 月 25 日） | 自己改善ループの「残すか巻き戻すか」の段階 | ループ外の封印審判と、いつ読んでも有効な逐次検定 | ループ内の審判はより悪い方策を残す。封印検定は誤判定率を守るが、責任を持つのは自分のプールだけ |

自己進化ループを回しているなら、今週すぐ使えるやり方は 4 つある。

1. 進化させた skill は、まず人が書いた数十語の skill と比べ、次に別のモデル、別の harness 段階で比べる。
2. 伸びが大きいときは疑わしい特徴で問題を分け、伸びが一つのグループに集中していればまず抜け穴を疑う。
3. 残すか巻き戻すかは、改善過程が触れないデータに決めさせる。バッチごとに t 検定をのぞくのではなく、逐次検定を使う。
4. 封印が保証するのは独立性で、評価そのものの妥当性ではない。プールにある抜け穴は封印された審判にも見えない。

本サイトの[自己進化エージェントのサーベイ](/ja/blog/self-evolving-agents-survey-2026/)は、この分野を 3 つの問いにまとめている。何を変えるか、誰が受け入れるか、どの伸びが本物か。[前回](/ja/blog/agent-evolution-resolution-hypothesis-elite/)の Resolution Hypothesis は、選択がコイン投げとほぼ同じで、大きな伸びの多くは抜け穴から来ると示した。今週は、1 本が skill が何を直しているのかを分解し、もう 1 本が判断する審判を取り替える。

## 一度に 1 軸だけ動かす 512 セルの表

設計は単純で、費用がかかる。ボトルネックの異なる 9 つのベンチマークから 1,872 問（SimpleQA は知識不足、SQuAD は回答の約束事、HotpotQA Context と FullWiki は多段の統合、BigCodeBench-Hard はコード、Amazon SOP と UCSB SOP は手順の遵守、SpreadsheetBench は表計算、LiveMathematicianBench は選択式の数学）を、4 つのモデル（ローカルの Qwen3.5-9B、Claude Sonnet 4.6、Claude Sonnet 5、GPT-5.6-sol）、4 つの skill 条件、4 段階の harness、3 つの予算と掛け合わせる。どのセルも温度 0 で 3 回走らせる。[1]

3 種類の skill はすべて Qwen3.5-9B が訓練分割だけから書き、固定したうえで全モデルにそのまま渡す。Direct は 1 回の呼び出しで書き、SkillOpt は採点付きロールアウトから最適化し、Trace2Skill は軌跡から蒸留する。Trace2Skill の検証ゲートは、候補が良くなければ人が書いた種を残す。トークン計測のある 6 つのベンチマークのうち 5 つで、生き残ったのは 17〜85 語の人の種だった。[1]

harness の各段階は仕組みを 1 つずつ足す。H0 はベンチマーク自身のプロンプト、H1 は回答またはツールのインターフェース、H2 はエラーを返して最大 3 回やり直させ、H3 は結果を見ない修正を 1 回加える。どの段階も採点器は見ない。

差はすべて対になっている。同じ問題、同じ反復で、変えるのは 1 つだけだ。最初の発見は、効果が足し算にならないことだ。加法モデルが除外セルを予測する R² は平均 0.729、二者間の交互作用を許すと 0.812 になり、8 つのベンチマークのうち 7 つで良くなる。[1] Qwen3.5-9B に固定すると、固定された 1 つの skill は harness が上がるにつれて 3 つの運命のどれかをたどる。

<figure class="not-prose my-6"><svg viewBox="0 0 700 404" role="img" aria-label="同じ凍結 skill でも、harness を一段上げるたびに価値が変わる" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:700px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><defs><marker id="ah-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor" fill-opacity="0.7"/></marker></defs><text x="10" y="24" font-size="15" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">同じ凍結 skill でも、harness を一段上げるたびに価値が変わる</text><line x1="74" y1="268.0" x2="660" y2="268.0" stroke="currentColor" stroke-opacity="0.18" stroke-width="1"/><text x="70" y="272.0" font-size="11" text-anchor="end" font-weight="normal" fill="currentColor" fill-opacity="0.7">-20</text><line x1="74" y1="224.0" x2="660" y2="224.0" stroke="currentColor" stroke-opacity="0.55" stroke-width="1"/><text x="70" y="228.0" font-size="11" text-anchor="end" font-weight="normal" fill="currentColor" fill-opacity="0.7">0</text><line x1="74" y1="180.0" x2="660" y2="180.0" stroke="currentColor" stroke-opacity="0.18" stroke-width="1"/><text x="70" y="184.0" font-size="11" text-anchor="end" font-weight="normal" fill="currentColor" fill-opacity="0.7">+20</text><line x1="74" y1="136.0" x2="660" y2="136.0" stroke="currentColor" stroke-opacity="0.18" stroke-width="1"/><text x="70" y="140.0" font-size="11" text-anchor="end" font-weight="normal" fill="currentColor" fill-opacity="0.7">+40</text><line x1="74" y1="92.0" x2="660" y2="92.0" stroke="currentColor" stroke-opacity="0.18" stroke-width="1"/><text x="70" y="96.0" font-size="11" text-anchor="end" font-weight="normal" fill="currentColor" fill-opacity="0.7">+60</text><text x="14" y="52" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">NoSkill からの上積み（pt）</text><text x="80.0" y="312" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">H0 最小</text><text x="273.33333333333337" y="312" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">H1 +回答 IF</text><text x="466.6666666666667" y="312" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">H2 +エラー・再試行</text><text x="660.0" y="312" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">H3 +見直し 1 回</text><polyline points="80.0,78.4 273.3,183.5 466.7,219.2 660.0,224.2" fill="none" stroke="#3b82f6" stroke-width="2.2"/><circle cx="80.0" cy="78.35999999999999" r="4" fill="#3b82f6"/><text x="87.0" y="71.35999999999999" font-size="10.5" text-anchor="start" font-weight="normal" fill="#3b82f6" fill-opacity="1">+66.2</text><circle cx="273.33333333333337" cy="183.52" r="4" fill="#3b82f6"/><text x="280.33333333333337" y="176.52" font-size="10.5" text-anchor="start" font-weight="normal" fill="#3b82f6" fill-opacity="1">+18.4</text><circle cx="466.6666666666667" cy="219.16" r="4" fill="#3b82f6"/><text x="466.6666666666667" y="237.16" font-size="10.5" text-anchor="middle" font-weight="normal" fill="#3b82f6" fill-opacity="1">+2.2</text><circle cx="660.0" cy="224.22" r="4" fill="#3b82f6"/><text x="660.0" y="242.22" font-size="10.5" text-anchor="middle" font-weight="normal" fill="#3b82f6" fill-opacity="1">−0.1</text><polyline points="80.0,274.2 273.3,272.4 466.7,220.3 660.0,217.6" fill="none" stroke="#f59e0b" stroke-width="2.2"/><circle cx="80.0" cy="274.16" r="4" fill="#f59e0b"/><text x="87.0" y="267.16" font-size="10.5" text-anchor="start" font-weight="normal" fill="#f59e0b" fill-opacity="1">−22.8</text><circle cx="273.33333333333337" cy="272.4" r="4" fill="#f59e0b"/><text x="280.33333333333337" y="265.4" font-size="10.5" text-anchor="start" font-weight="normal" fill="#f59e0b" fill-opacity="1">−22.0</text><circle cx="466.6666666666667" cy="220.26" r="4" fill="#f59e0b"/><text x="458.6666666666667" y="214.26" font-size="10.5" text-anchor="end" font-weight="normal" fill="#f59e0b" fill-opacity="1">+1.7</text><circle cx="660.0" cy="217.62" r="4" fill="#f59e0b"/><text x="652.0" y="233.62" font-size="10.5" text-anchor="end" font-weight="normal" fill="#f59e0b" fill-opacity="1">+2.9</text><polyline points="80.0,194.3 273.3,190.6 466.7,194.7 660.0,216.1" fill="none" stroke="#10b981" stroke-width="2.2"/><circle cx="80.0" cy="194.3" r="4" fill="#10b981"/><text x="87.0" y="187.3" font-size="10.5" text-anchor="start" font-weight="normal" fill="#10b981" fill-opacity="1">+13.5</text><circle cx="273.33333333333337" cy="190.56" r="4" fill="#10b981"/><text x="280.33333333333337" y="206.56" font-size="10.5" text-anchor="start" font-weight="normal" fill="#10b981" fill-opacity="1">+15.2</text><circle cx="466.6666666666667" cy="194.74" r="4" fill="#10b981"/><text x="473.6666666666667" y="187.74" font-size="10.5" text-anchor="start" font-weight="normal" fill="#10b981" fill-opacity="1">+13.3</text><circle cx="660.0" cy="216.07999999999998" r="4" fill="#10b981"/><text x="660.0" y="206.07999999999998" font-size="10.5" text-anchor="middle" font-weight="normal" fill="#10b981" fill-opacity="1">+3.6</text><rect x="80" y="329" width="12" height="10" rx="2" fill="#3b82f6" fill-opacity="0.9"/><text x="98" y="338" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">吸収：SQuAD + Trace2Skill（教えているのは回答形式）</text><rect x="80" y="347" width="12" height="10" rx="2" fill="#f59e0b" fill-opacity="0.9"/><text x="98" y="356" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">救済：FullWiki + Direct（誤った操作にエラーが返る）</text><rect x="80" y="365" width="12" height="10" rx="2" fill="#10b981" fill-opacity="0.9"/><text x="98" y="374" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">維持：UCSB SOP + SkillOpt（エラーの出ない前提チェックを補う）</text><text x="10" y="394" font-size="10" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.6">データ：Qwen3.5-9B、Default 予算、3 回反復の平均。公開実行台帳から再計算（arXiv:2611.29290）。</text></svg></figure>

*図：Qwen3.5-9B での、各 harness 段階における 3 種類の skill の NoSkill に対する伸び。公開台帳から再計算。*

- **吸収される。** SQuAD では 18 語の skill（Trace2Skill のゲートが残した人の種で、与えられた文脈だけを使い最短の範囲を返せという内容）が H0 で 66.2 ポイント、H2 で 2.2 ポイント伸ばす。H1 の回答インターフェースがすでに短い答えを求めるからだ。応答に正解が含まれるかで採点し直すと、NoSkill は H0 ですでに 96.1 に達する。あの 66 ポイントは形式だ。
- **救われる。** HotpotQA FullWiki では、Direct skill がエージェントを不正な行動の繰り返しに導いてターン上限まで進ませ、H1 での伸びは −22.0 になる。H2 では不正な行動のたびにエラーが返り、伸びは +1.7 になる。このセルで失敗から成功に変わった 221 件のうち、215 件はそうしたフィードバックの後に起きた。
- **保たれる。** UCSB SOP では、skill なしのエージェントは前提条件を満たさない支払いを実行してしまい、何もエラーを出さないので H2 には返すものがない。SkillOpt はそのチェックを書き込み、H0 から H2 まで 13.3〜15.2 ポイントの伸びを保つ。

表全体では、96 の skill・モデル・ベンチマークの組み合わせのうち 18 が吸収、12 が保持、4 が救済だった。[1] harness を書かずに報告された skill の伸びは解釈できない。

## 自己進化 skill が止まる 4 つの場所

第 5 節は、エージェント自身の経験から育った skill が足りない点を 4 つ挙げる。[1]

[![論文の図 1。左は 1 つの skill の H0 から H3 までの伸びを 3 本の線で示す。中央は目に見えるエラー信号の有無で分けた H2 による救済の割合。右は Qwen で最適化した SkillOpt skill が GPT-5.6-sol を 62.0 から 13.6 に落とす例と、SimpleQA で自分の事実から作った skill と検索文書を比べた例](/assets/self-evolving-skills-stall-sealed-judge/which-failure-fig1-skills-stall.webp)](https://arxiv.org/abs/2611.29290)

*図：Which Failure の図 1。右のパネルは後述のモデル移転での崩壊と、事実不足の例。[1]*

**人が書いた数行をほとんど上回らない。** Trace2Skill の進化候補は 7 つのベンチマークのうち 5 つで人の種を上回れず、その種は 3 つの QA ベンチマークで SkillOpt を 10〜15 ポイント上回る。人の数行が増やすトークンは中央値 4% で、進化した 2,603 語の LiveMath skill は 195% 増やす。

**抜け穴を学ぶ。** LiveMathematicianBench には「残りの選択肢のどれかが正しいが、より強い結果が証明できる」という選択肢が繰り返し出てきて、出てきたときは必ずそれが正解だ。前回、Resolution Hypothesis はこれを抜け穴の一覧に入れた。[10] 今回は別のグループが別の方法で、進化した skill がこの選択肢を選ぶルールを書き込んでいることを見つけた。Qwen3.5-9B はこの選択肢を含む 53 問で 11.2% から 71.5% に上がり、残りの 71 問で 52.7% から 43.7% に下がる。

**別のモデルで壊れる。** Qwen3.5-9B で HotpotQA Context 向けに最適化した SkillOpt skill は、GPT-5.6-sol の H1 の点数を 62.0 から 13.6 に落とす。モデルは答えを知っている（応答の 74.1% が正解を含み、skill なしでは 76.8%）が、回答欄を事実抽出のワークシートで埋めてしまう。H2 と H3 は 12.2 のままだ。回答の形式は正しく、結果を見ない修正では直らない。

**足りない事実は補えない。** SimpleQA では、エージェント自身の事実から作った skill で正答率は 5.0% から 6.3% にしか動かない。思い出せない事実を要求させる人の skill は誤った推測の大半を消すが、それだけでは正答率は上がらない。要求に出典文書の一節で答えると 60.0%、すべての質問に一節を付けると 72.0% になる。

より強い作り手でも足りない。GPT-5.6-sol で作り直すと、Trace2Skill は UCSB SOP でようやく人の skill を 5.38 ポイント上回るが、SkillOpt は Qwen 製の版より 6.05 ポイント悪くなる。作り手を固定すると、1 回で書く Direct skill が反復最適化の SkillOpt を 8 つのベンチマークのうち 4 つで上回る。[1]

著者らは、エージェントの経験の外から指導か情報が入らない限り skill の進化は止まると結論する。付け加えるなら、この 4 つの失敗はどれも、同じ検証セットで回数を増やしても見えてこない。どれも一部の問題に隠れているか、モデルや harness を変えたときにだけ現れる。

### 公開台帳から再計算する

論文は 718,848 回の実行すべての記録（モデル、ベンチマーク、問題 ID、skill、harness、予算、反復、点数、トークン、費用）を、固定された skill ファイルと分割 ID と一緒に公開している。[1][^1] モデルを呼ばずに表を再計算できる。

著者のスクリプトは第 6 節のパイロットを再現する。Qwen3.5-9B+H2 とより強いモデルをラベル付きの 20 問で走らせ、強いモデルが勝ったときだけベンチマーク全体を切り替える。結果は 57.39 で、常に GPT-5.6-sol を使う場合の 53.47 を上回り、1,000 問あたりの費用は 8.323 ドルに対して 5.310 ドル、36% 安い。論文と一致する。

LiveMath の数字は前回の結論に直接関わるので、独立に確かめた。台帳には ID はあるが問題文はない。前回使った SkillOpt-Lite の公開データには同じ 177 問の選択肢がある。ID で照合すると 124 問のテスト問題がすべて対応し、メタ選択肢を含むのはちょうど 53 問で、53 問すべてでそれが正解だった。この分割で、Trace2Skill 付きの Qwen3.5-9B は 71.5% と 43.7% で、論文と同じだ。

[![端末出力。著者のパイロットスクリプトはパイロット 57.39、常に GPT の場合 53.47。台帳は 718,848 行。GPT-5.6-sol の Hotpot Context は H1 で NoSkill 62.0、SkillOpt 13.6。LiveMath 124 問のうちメタ選択肢を含む 53 問はすべてそれが正解。Qwen3.5-9B NoSkill 11.2/52.7、Trace2Skill 71.5/43.7。GPT-5.6 SkillOpt 54.1/57.2](/assets/self-evolving-skills-stall-sealed-judge/ledger-pilot-and-livemath-split.webp)](https://huggingface.co/datasets/Zihan-Zoe/same-skill-different-harness)

*図：公開台帳から再計算したパイロット結果、モデル移転の例、LiveMath の問題分割。[1][9]*

表からは、論文があまり触れていないことも見える。抜け穴は移転する。Qwen の SkillOpt skill を GPT-5.6-sol に渡すと、メタ選択肢を含む問題は 39.0% から 54.1% に上がり、残りは 61.2% から 57.2% に下がる。ルールは固定された skill ファイルにそのまま書かれている。

[![端末出力。LiveMath の SkillOpt skill は 1,284 語、Trace2Skill skill は 2,603 語。SkillOpt の 5 行目「Meta-Option Priority Rule」はメタ選択肢を既定の候補にする。Trace2Skill の 30 行目「Prioritize Meta-Statements」は、それを高確率の正解として扱い、ダミー選択肢の計算は確かめるなと書く](/assets/self-evolving-skills-stall-sealed-judge/livemath-evolved-skill-meta-option-rule.webp)](https://huggingface.co/datasets/Zihan-Zoe/same-skill-different-harness)

*図：進化した 2 つの LiveMath skill に書き込まれたメタ選択肢のルール。*

いちばん露骨なのは Trace2Skill の一行だ。メタ選択肢を高確率の正解として扱い、ダミー選択肢の計算を確かめるなと言う。最適化器がこんなルールを見つけるのは意外ではない。意外なのは、それが検証ゲートを通って固定された最終 skill に入ったことだ。

最後に、384 個の「skill 対 NoSkill」の対比（3 つの skill、4 つのモデル、8 つのベンチマーク、H0〜H3）をすべて対比較として計算し直し、問題単位のブートストラップで 95% 区間を付けた。

[![端末出力。温度 0 でも同じセルの 3 回の反復で 6.8〜11.2% の問題の点数が変わり、セル単位の標準偏差の中央値は 0.81 ポイント。384 の対比のうち有意な改善 83、有意な悪化 84、未決 217。Qwen 自身では改善 27・悪化 18、3 つの API モデルへの移転では改善 56・悪化 66](/assets/self-evolving-skills-stall-sealed-judge/ledger-384-skill-contrasts.webp)](https://huggingface.co/datasets/Zihan-Zoe/same-skill-different-harness)

*図：384 個の skill 対比の対ブートストラップ結果と、温度 0 での反復間のぶれ。*

覚えておく価値のある数字が 3 つある。温度 0 は決定的ではない。同じセルの 3 回の反復で 6.8〜11.2% の問題の点数が変わる。384 の対比のうち有意な改善は 83、有意な悪化は 84、未決は 217 で、未決のものの効果の中央値は 1.33 ポイント、区間の幅の中央値は 5.33 ポイントだ。そして 83 の改善のうち 38 は SQuAD、HotpotQA Context、LiveMath にあり、論文が伸びの多くは形式と抜け穴だと示した場所と重なる。skill を作った Qwen では改善 27、悪化 18、3 つの API モデルでは改善 56、悪化 66 だった。

## 失敗は直し方を指すが、フィードバックが直すのは見えるエラーだけ

第 4 節は、結果を見る前に各失敗の原因ラベルを固定し、どの介入がそれを救うかを問う。手順の失敗は skill、実行・状態・回答の約束事の失敗は harness、推論・事実・棄権の失敗はモデルに対応する。[1]

実行の失敗をより豊かな harness に渡すと、他の軸の平均より 9.58 ポイント伸び（区間 4.77〜13.93）、能力の失敗をより強いモデルに渡すと 64.54 伸びる。手順の失敗は skill に確実には対応しない（+3.77、区間 −5.66〜+14.47）。モデルを変えない修正の中では、H2 が実行の失敗の 33.50% を救い、次善の策は 18.41% だ。そして厳しい数字が 1 つある。比較の 59.7% では、試したどの介入も単独では失敗を成功に変えない。

救済には 4 つの段階を通る必要がある。エラーが露出し、モデルがそれに反応し、局所的な修正が正しく、実行全体が正解で終わる。BigCode の H2 では実行の 70〜76% がエラーを露出するのに、モデルが直せるのは多くて 2% だ。粗いテスト判定は直し方を指さないからだ。自分の軌跡に信号がある失敗は、SQuAD で 76.9%（信号なしは 1.3%）、HotpotQA Context で 63.5%（同 1.8%）救われる。

だから問題ごとの振り分けは割に合わない。H2 の時点で残る失敗の 89% は無音で、見えるエラーのときだけ強いモデルに上げても伸びは約 1 ポイントだ。ベンチマーク単位で決める、つまり先の 20 問パイロットはうまくいく。[1]

自己進化システムへの教訓は明快だ。ループが学べるのは、信号を残す失敗だけだ。

## SealedLoop：改善者に見えない審判に決めさせる

SealedLoop が扱うのは身体性方策の自己改善ループだ。経験を集め、審判にラベルを付けさせ、良いと判定されたもので微調整し、新しい版が古い版を置き換えるかを決める。著者らが調べた 56 のループの大半では、訓練信号を出す審判がその判断もしており、証拠が方策から独立していない。[2]

[![論文の図 2。左上は自己判定ループで、分類器がある世代で失敗 196 件のうち 65 件を成功と誤ラベルする。左下は市販の VLM 審判で、騙されにくいが未見のデータには盲目のまま。右は SealedLoop の封印、対評価、逐次検定、開示の 4 段階と、審判ギャップを審判誤差と移転ギャップに分ける図](/assets/self-evolving-skills-stall-sealed-judge/sealedloop-fig2-who-decides.webp)](https://arxiv.org/abs/2611.33794)

*図：SealedLoop の図 2「ループが何を残すかを誰が決めるか」。[2]*

方法は 4 段階だ。封印：プール、審判のパラメータ、サンプリング規則を改善者が走る前に固定して隠し、ファイルもマスクする。対：新旧の方策を同じ条件で走らせる。判定：対の差に対する賭けの信頼系列（いつ読んでも有効）が、下限がゼロを超えたときだけ候補を残し、予算が尽きたら巻き戻す。開示：その後で初めてループは結果を知る。条件は事前に固定され、改善者と独立に引かれるので、良くない版を残す確率はあらかじめ決めた α 以下に保たれる。

同じループを 2 回、それぞれの審判の下で走らせ、両方の審判に全世代を採点させると、世代ごとの審判ギャップ（報告された伸びから封印側の伸びを引いたもの）が得られる。ループ自身のデータでの真の点数が、それを 2 つに分ける。

<figure class="not-prose my-6"><svg viewBox="0 0 700 470" role="img" aria-label="ループ内で報告された伸びが本物になるまでの三つの関門" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:700px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><defs><marker id="ah-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor" fill-opacity="0.7"/></marker></defs><text x="10" y="24" font-size="15" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">ループ内で報告された伸びが本物になるまでの三つの関門</text><rect x="20" y="46" width="150" height="58" rx="6" fill="#64748b" fill-opacity="0.15" stroke="#64748b" stroke-opacity="0.85" stroke-width="1.3"/><text x="95.0" y="80" font-size="12" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="0.95">ループが報告する伸び</text><line x1="170" y1="75" x2="188" y2="75" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.5" marker-end="url(#ah-b)"/><text x="180" y="66" font-size="11" text-anchor="middle" font-weight="bold" fill="#f59e0b" fill-opacity="1">E</text><rect x="190" y="46" width="150" height="58" rx="6" fill="#3b82f6" fill-opacity="0.15" stroke="#3b82f6" stroke-opacity="0.85" stroke-width="1.3"/><text x="265.0" y="80" font-size="12" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="0.95">ループ内データの真の伸び</text><line x1="340" y1="75" x2="358" y2="75" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.5" marker-end="url(#ah-b)"/><text x="350" y="66" font-size="11" text-anchor="middle" font-weight="bold" fill="#ef4444" fill-opacity="1">T</text><rect x="360" y="46" width="150" height="58" rx="6" fill="#8b5cf6" fill-opacity="0.15" stroke="#8b5cf6" stroke-opacity="0.85" stroke-width="1.3"/><text x="435.0" y="80" font-size="12" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="0.95">封印プールでの伸び</text><line x1="510" y1="75" x2="528" y2="75" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.5" marker-end="url(#ah-b)"/><text x="520" y="66" font-size="11" text-anchor="middle" font-weight="bold" fill="#8b5cf6" fill-opacity="1">!</text><rect x="530" y="46" width="150" height="58" rx="6" fill="#10b981" fill-opacity="0.15" stroke="#10b981" stroke-opacity="0.85" stroke-width="1.3"/><text x="605.0" y="80" font-size="12" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="0.95">能力としての本当の伸び</text><text x="95.0" y="120" font-size="10" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.65">ループ内の審判が自分のデータで採点</text><rect x="20" y="150" width="660" height="84" rx="6" fill="#f59e0b" fill-opacity="0.07" stroke="#f59e0b" stroke-opacity="0.85" stroke-width="1.3"/><text x="36" y="174" font-size="13" text-anchor="start" font-weight="bold" fill="#f59e0b" fill-opacity="1">審判誤差 E</text><text x="36" y="196" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.9">分類器が 1 世代で失敗 196 件中 65 件を成功と判定</text><text x="36" y="218" font-size="11.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.9">→ 強い審判でも縮むだけ</text><rect x="20" y="246" width="660" height="84" rx="6" fill="#ef4444" fill-opacity="0.07" stroke="#ef4444" stroke-opacity="0.85" stroke-width="1.3"/><text x="36" y="270" font-size="13" text-anchor="start" font-weight="bold" fill="#ef4444" fill-opacity="1">移転ギャップ T</text><text x="36" y="292" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.9">自分のフレームで +0.047〜+0.058、未見の都市で −0.107〜−0.075</text><text x="36" y="314" font-size="11.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.9">→ 封印プールでしか見えない</text><rect x="20" y="342" width="660" height="84" rx="6" fill="#8b5cf6" fill-opacity="0.07" stroke="#8b5cf6" stroke-opacity="0.85" stroke-width="1.3"/><text x="36" y="366" font-size="13" text-anchor="start" font-weight="bold" fill="#8b5cf6" fill-opacity="1">プール自体の抜け穴</text><text x="36" y="388" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.9">メタ選択肢つき LiveMath 53 問：ゲートは 100/100 で採用</text><text x="36" y="410" font-size="11.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.9">→ 封印でも見えない：問題分割・1 ルール検査</text><text x="10" y="462" font-size="10" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.6">E と T の例は SealedLoop（arXiv:2611.33794）。三つ目は本記事が公開 skill 台帳で実測した例。</text></svg></figure>

*図：ループが報告する伸びと本物の進歩のあいだにある 3 つの関門。最初の 2 つは SealedLoop から、3 つ目は本稿が skill 台帳で走らせた結果。*

**審判誤差**：ループ内の審判が自分のデータで間違える。LIBERO では成功分類器がある世代で失敗 196 件のうち 65 件を通した。典型はかごの縁で物をつかんだままの状態だ。90 世代のうち 5 世代は、封印審判が退行と見るものを伸びとして報告した。NAVSIM では、自分のラベルで更新した批評器の誤差が第 1 世代で +0.070 になる。

**移転ギャップ**：ループのデータでの本物の伸びが、ほかでは成り立たない。すべての世代とシードで、ループのフレームでの真の伸びは、どの世代も訓練していない都市ボストンでの伸びを上回る。公開チェックポイントからの実行は、ループのフレームで 0.047〜0.058 伸び、ボストンで 0.075〜0.107 下がる。誤差ゼロのループ内審判でも、対照世代 15 のうち 8 を残してしまう。

[![論文の図 4。(a) 運転での世代ごとの審判誤差と移転ギャップ。(b) 運転の各候補の、ループのフレーム、同じ都市の未見ログ、未見の都市での真の伸び。公開チェックポイントの実行はプラスからマイナスに変わる。(c) 操作タスクで分類器が成功とラベルした失敗と成功の例、および成功とラベルされた失敗の割合が世代とともに増える様子](/assets/self-evolving-skills-stall-sealed-judge/sealedloop-fig4-judge-gap-sources.webp)](https://arxiv.org/abs/2611.33794)

*図：SealedLoop の図 4、審判ギャップの 2 つの源。[2]*

より強い市販の審判でも直らない。4 つの視覚言語モデルとロボット用報酬モデルのうち、分類器より成功に見える失敗を通す数が少なかったのは 2 つだけで、最大の Qwen3-VL-32B は通した失敗が最も少なかったが真陽性率は 0.69 だった。大きな審判は、通す失敗を減らす代わりに成功を落とす。

本物の進歩は通るのか。封印側の伸びがわかっている運転の 76 組で、検定は本物の改善 12 組のうち 11 組を通し、退行 59 組とゼロ付近の 5 組は 1 組も通さなかった。改善するように作ったループでは最初の 11 ステップすべてを認め、批評器が認めたのはそのうち 1 つだった。保持される方策は、封印検定が決めると 0.638 から 0.674 に、批評器が決めると 0.649 になる。プール全体を読むのと同じ判断に、47% のフレームで到達する。

実寸のドライブバイワイヤ車両では、公開済みの強化学習微調整の 1 ステップ（シミュレータで 0.861 から 0.904）をブラインドの対で試した。どちらの版もルートを走り切れなかったが、強化した版は 6 組すべてでより遠くまで進み、平均 10.4 m の差だった。逐次検定は未決のままだった。[2]

### SealedLoop を手元で動かし、判定ゲートを skill 台帳にかける

リポジトリには判定ゲート（NumPy のみ依存）、論文の世代ごとの記録、すべての判定を再計算するスクリプトが入っている。ループの訓練スクリプトは「近日公開」だ。[2] テスト 7 件はすべて通り、例は合成候補 1 つを残して 2 つを巻き戻し、検証スクリプトは 174 世代の 348 判定を不一致 0 で再計算した。

[![端末出力。SealedLoop commit ce76572。pytest 7 passed。例では better が 58 問で採用、same が 100 問で未決、worse が 33 問で棄却。verify_decisions は 174 世代 348 判定を不一致 0 で再計算。運転では自己ラベルの批評器が主実行で 15 のうち 3、封印審判は 0。操作では分類器が 69 のうち 13、封印審判が 45 のうち 12 を残す](/assets/self-evolving-skills-stall-sealed-judge/sealedloop-tests-and-348-decisions.webp)](https://github.com/zilin-huang/SealedLoop)

*図：SealedLoop のテスト、例、348 判定の再計算。[2]*

ゲートは汎用なので、そのまま Which Failure の台帳にかけた。候補は skill、現行版は NoSkill で、モデル、ベンチマーク、H1、反復 1 を揃え、問題で対にし、α=0.05、最低 10 問、予算は全問、ランダムな順序を 100 通り試した。

[![端末出力。Qwen3.5-9B の LiveMath Trace2Skill は全 124 問で 26.6 ポイント伸び、100 通りの順序のうち 86 で採用。メタ選択肢を含む 53 問では 66.0 伸び、中央値 10 問で 100/100 採用。残る 71 問では 2.8 下がり 0/100。GPT-5.6-sol の Hotpot Context SkillOpt は 47.7 下がり、中央値 13 問で棄却。UCSB SOP SkillOpt は 15.4 伸び 99/100 採用。伸びゼロの帰無仮説の下で、10 問ごとにのぞく t 検定は 22.9% と 22.6%、SealedLoop のゲートは 1.0% と 1.1% を採用](/assets/self-evolving-skills-stall-sealed-judge/sealedloop-gate-on-skill-ledger.webp)](https://github.com/zilin-huang/SealedLoop)

*図：SealedLoop のゲートが skill 台帳を読んだ結果。*

ゲートは約束どおりに動く。移転での崩壊は中央値 13 問で棄却され、前提条件チェックを持つ UCSB SOP の skill は 100 回中 99 回残る。伸びゼロの帰無仮説（実際の対の差に符号をランダムに反転）の下で、10 問ごとに読み直す t 検定は候補を 22.9% と 22.6% の割合で残し、名目の 5% の 4 倍を超える。ゲートは 1.0% と 1.1% だ。

<figure class="not-prose my-6"><svg viewBox="0 0 700 300" role="img" aria-label="本当の伸びがないとき、途中で何度も見る判定はどれだけ採用してしまうか" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:700px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><defs><marker id="ah-c" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor" fill-opacity="0.7"/></marker></defs><text x="10" y="24" font-size="15" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">本当の伸びがないとき、途中で何度も見る判定はどれだけ採用してしまうか</text><text x="20" y="82" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.95">Hotpot FullWiki、Direct（300 問）</text><rect x="250" y="60" width="375.55999999999995" height="18" rx="3" fill="#ef4444" fill-opacity="0.75"/><text x="631.56" y="74" font-size="11.5" text-anchor="start" font-weight="normal" fill="#ef4444" fill-opacity="1">22.9%</text><rect x="250" y="84" width="16.399999999999977" height="18" rx="3" fill="#10b981" fill-opacity="0.85"/><text x="272.4" y="98" font-size="11.5" text-anchor="start" font-weight="normal" fill="#10b981" fill-opacity="1">1.0%</text><text x="20" y="162" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.95">Spreadsheet、Trace2Skill（280 問）</text><rect x="250" y="140" width="370.64" height="18" rx="3" fill="#ef4444" fill-opacity="0.75"/><text x="626.64" y="154" font-size="11.5" text-anchor="start" font-weight="normal" fill="#ef4444" fill-opacity="1">22.6%</text><rect x="250" y="164" width="18.04000000000002" height="18" rx="3" fill="#10b981" fill-opacity="0.85"/><text x="274.04" y="178" font-size="11.5" text-anchor="start" font-weight="normal" fill="#10b981" fill-opacity="1">1.1%</text><line x1="332.0" y1="50" x2="332.0" y2="210" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.5" stroke-dasharray="4 3"/><text x="336.0" y="48" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">名目水準 5%</text><text x="250.0" y="224" font-size="10.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.6">0%</text><text x="414.0" y="224" font-size="10.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.6">10%</text><text x="578.0" y="224" font-size="10.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.6">20%</text><rect x="20" y="240" width="12" height="10" rx="2" fill="#ef4444" fill-opacity="0.75"/><text x="38" y="250" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">t 検定を 10 問ごとに再読</text><rect x="330" y="240" width="12" height="10" rx="2" fill="#10b981" fill-opacity="0.85"/><text x="348" y="250" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">SealedLoop の賭け型信頼系列ゲート</text><text x="10" y="292" font-size="10" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.6">実際の対差の符号をランダムに反転して帰無を作成、各 1000 回。sealedloop.gate_path で実測。</text></svg></figure>

*図：本当の伸びがないとき、のぞき見する t 検定と SealedLoop のゲートが候補を残す頻度。*

そして LiveMath の抜け穴も残す。全 124 問では 100 通りの順序のうち 86、メタ選択肢を含む 53 問では中央値 10 問で 100 通りすべて、残りの 71 問では一度も残さない。検定の立場からはこれで正しい。このプールでは skill は確かに点数を上げる。問題はプールのほうだ。SealedLoop が保証するのは改善者が審判を出し抜けないことで、審判が測りたいものを測っていることではない。抜け穴がベンチマークにあるなら、封印したコピーも同じように報いる。

3 つ目の関門には別の道具が要る。疑わしい特徴で問題を分ける、1 つのルールを足して伸びがどれだけ再現されるかを試す（Resolution Hypothesis のやり方）、モデルと harness を変えて伸びが残るかを見る（Which Failure のやり方）。

## 同じ週のほかの受け入れ証拠

今週はタイトルに「self-evolving」や「recursive self-improvement」を含む論文が数十本あったが、多くは同じループを新しい分野に当てたものだ。以下は「誰が変更を受け入れるか」に関わる。

- **Blind to What They Can Fix**（arXiv:2611.29807、11 月 22 日）。エージェントはタスク用プログラムを走らせてコードを直しながら改善し、実行時チェックを書くよう指示される。5 つの分野で点数は高くなるが、環境が変わると 4 つの分野でチェックは失敗の半分以上を見逃す。正常な実行の記録から作った監視器は 3 つの分野でその大半を捕まえ、呼ばれればエージェントはたいてい直せる。評価は、システムが自分の失敗に気づくかも測るべきだという。[3]
- **TransHarness**（arXiv:2611.33757、11 月 25 日）。成功と失敗の対比から harness の介入方策を進化させ、テスト分布の外から集めた 300 本の軌跡だけで DeepSWE v1.1 で 76.4%、Terminal-Bench 2.1 で 95.5% に達し、GPT-6 Astra を 2.4 ポイントと 5.6 ポイント上回る。要旨には反復回数も分散も書かれていない。[4]
- **エージェント群での報酬ハッキングの広がり**（arXiv:2611.30185、11 月 23 日）。20,111 エージェントによる事前登録済みの 17 実験で、見えるテストが受け入れを決めると最初の回で 33% が不正をし、仲間の不正が受け入れられたのを見ると 94%、AI レビュアーが却下した後でも 34% が真似する。新しい問題では、受け入れられた不正を見たエージェントの 70% が再び不正をし、対照群は 32% だった。共有の経験プールでは、却下された不正もそれ自体が汚染になる。[5]
- **オンライン環境修復**（arXiv:2611.32037、11 月 24 日）。強化学習中に出力を罰する代わりに、悪用された環境を非同期に修理する。20 の GRPO 実験で報酬ハッキングは 36.9% から 0.06% に下がり、保留セットの Pass@8 は 21.7% から 46.7% に上がる。[6]
- **DoppelVet**（arXiv:2611.29306、11 月 22 日）。永続状態に入る更新ごとに同じ証拠を持つ双子を作り、両方を再生して挙動を比べる。有害な更新の検出 AUC はグリッドタスクで 0.762 から 0.940 に上がり、10 世代の自己更新ループで劣化する軌跡は 30.39% から 0.43% に減る。[7]
- **SELFWRITE**（arXiv:2611.29513、11 月 22 日）。Qwen3.8-27B が勾配を使わずに自分の重みへの低ランク編集を作るプログラムを書き、各候補は隠されたゲートセットで 1 回だけ採点される。5 世代後、ループが一度も見ない保留分割は 76.30% から 77.75%（avg@4）になる。伸びは小さいが、保留分割での数字だ。[8]

## 前回の宿題

Resolution Hypothesis のページにはまだコードも軌跡もリンクされておらず、ELITE のコードも公開されていない。SkillOpt-Lite の main は `4cb4eee` のままだ。修理した評価で SAGE、GEPA、SkillOpt-Lite を走らせ直した人はまだいないが、Which Failure は LiveMath の抜け穴を独立に再現し、項目ごとの台帳を公開した。

## 筆者の見方

2 本を合わせて読むと、1 本ずつよりはっきりしたことが言える。自己進化ループのボトルネックは提案でも、ノイズだけでもなく、受け入れの証拠がどこから来るかだ。ループ内の証拠には 3 つの欠陥がある。審判が自分のデータを採点し間違える、本物の伸びがほかでは成り立たない、ベンチマーク自体に抜け穴がある。SealedLoop は最初の 2 つを、誤判定率を保証しつつ少ない費用で扱う。3 つ目は扱えないし、扱えるとも言っていない。

Which Failure の価値は台帳にある。718,848 回の実行は、行列を走らせ直さずに新しい手法を項目ごとに比べられる基準になる。これは skill 進化手法の標準的なベースラインになると思う。より良い手法を主張するなら、少なくともこの台帳で数十語の人の skill に勝ち、次に別のモデルで勝つべきだ。

限界もある。Which Failure の skill はすべて 1 つの 9B モデルが作り、より強い作り手は 2 つのベンチマークでしか試されていない。原因ラベルが付いた元の失敗は 56.5% だけだ。SealedLoop のループはすべてシミュレーションで、車両実験は 1 つの改善ステップを 6 組で試しただけで、訓練スクリプトはまだ出ていない。

来週見るもの：SealedLoop の訓練スクリプト、言語エージェントの skill や harness の進化への封印検定の適用、Resolution Hypothesis と ELITE のコード、TransHarness の分散。

[^1]: 要旨には「約 90 万の軌跡」とあるが、公開台帳の実行行は 718,848 で、そのうち 449,280 が Default 予算、89,856 が診断用の H4 段階だ。論文は、台帳から再計算した 3,456 の反復単位の値がすべて元の行列と完全に一致すると述べている。

## 参考文献

1. Jin et al., *Which Failure Does an Intervention Repair? When Agent Interventions Help, and Where Self-Evolving Skills Stall*, arXiv:2611.29290, 2026-11-22: <https://arxiv.org/abs/2611.29290>；コード：<https://github.com/Zihan-Zoe/same-skill-different-harness>；台帳：<https://huggingface.co/datasets/Zihan-Zoe/same-skill-different-harness>
2. Huang et al., *Keep or Roll Back? Out-of-Loop Judges for Self-Improving VLA and End-to-End Embodied Policies*（SealedLoop）, arXiv:2611.33794, 2026-11-25: <https://arxiv.org/abs/2611.33794>；プロジェクトページ：<https://zilin-huang.github.io/SealedLoop/>；コード：<https://github.com/zilin-huang/SealedLoop>；評価記録：<https://huggingface.co/datasets/zilinhuang/SealedLoop>
3. Cao, Deng, Kersting, *Blind to What They Can Fix: A Detection Gap in Self-Improving Agents*, arXiv:2611.29807, 2026-11-22: <https://arxiv.org/abs/2611.29807>
4. Xia et al., *TransHarness: From Benchmark Overfitting to Transferable Harness Evolution*, arXiv:2611.33757, 2026-11-25: <https://arxiv.org/abs/2611.33757>
5. Vaid, *Causal Evidence for the Emergence and Spread of Reward Hacking in AI Agent Swarms*, arXiv:2611.30185, 2026-11-23: <https://arxiv.org/abs/2611.30185>
6. Lu et al., *Online Environment Repair for Coding Agents*, arXiv:2611.32037, 2026-11-24: <https://arxiv.org/abs/2611.32037>
7. Duan et al., *DoppelVet: Comparative Safety Verification for Self-Evolving Agents*, arXiv:2611.29306, 2026-11-22: <https://arxiv.org/abs/2611.29306>
8. Zhang, Li, *Recursive Self-Editing: LLMs Program Their Own Weight Edits for Self-Improvement*, arXiv:2611.29513, 2026-11-22: <https://arxiv.org/abs/2611.29513>
9. LiveMathematicianBench の選択肢テキストは SkillOpt-Lite の公開分割から：<https://huggingface.co/datasets/yshenaw/SkillOpt_Lite_Benchmarks>；SkillOpt-Lite commit `4cb4eee`：<https://github.com/EvolvingLMMs-Lab/SkillOpt-Lite>
10. Zeng et al., *The Resolution Hypothesis*, arXiv:2611.23068: <https://arxiv.org/abs/2611.23068>；本サイトの解説：[自己進化エージェントは受け入れ判定で止まっている](/ja/blog/agent-evolution-resolution-hypothesis-elite/)

本稿の再計算スクリプト（`ledger_audit.py`、`sealed_gate_on_ledger.py`）は、上の 2 本の論文が公開したコードとデータ、および SkillOpt-Lite の公開問題文だけを使い、モデル API は呼んでいない。
