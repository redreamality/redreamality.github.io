---
title: 'Seedance 2.0 使い方ガイド：プロンプトから完成映像までの完全攻略'
pubDate: 2026-02-15T00:00:00.000Z
description: 'Seedance 2.0 AI動画生成の完全使い方ガイド — プロンプト万能公式、カメラワーク、スタイルキーワード、素材参照システム、画質向上テクニック、実践例を網羅'
author: 'Remy'
tags: ['AI', 'Seedance', '動画生成', 'プロンプト', '使い方ガイド']
lang: 'ja'
translatedFrom: 'seedance-2-guide'
---

Seedance 2.0 は ByteDance（字節跳動）の Seed チームが開発したマルチモーダル AI 動画生成モデルです。2026年2月に正式リリースされ、**豆包アプリ**と**即夢AI（Jimeng AI）**から利用できます。最大12個の参照素材（画像9枚＋動画3本＋音声3本）とテキスト指示を組み合わせ、2K解像度・24-60fps・最長15-20秒の映像を生成でき、8言語のリップシンクにも対応しています。

本ガイドでは、プロンプトの書き方から実践テクニックまで、Seedance 2.0 を使いこなすための全知識を網羅します。

---

## 目次

1. [プロンプト万能公式](#プロンプト万能公式)
2. [精選プロンプト例](#精選プロンプト例)
3. [カメラワークキーワード早見表](#カメラワークキーワード早見表)
4. [画角の組み合わせガイド](#画角の組み合わせガイド)
5. [スタイルキーワード分類](#スタイルキーワード分類)
6. [オーディオプロンプトキーワード](#オーディオプロンプトキーワード)
7. [画質向上サフィックス](#画質向上サフィックス)
8. [制約ワード](#制約ワード)
9. [@ 素材参照システム](#-素材参照システム)
10. [コアテクニック](#コアテクニック)
11. [イテレーション・トラブルシューティング](#イテレーショントラブルシューティング)
12. [おすすめリソース](#おすすめリソース)

---

## プロンプト万能公式

Seedance 2.0 のプロンプトは、以下の8要素を組み合わせて構成します。

```
主体 + 動作 + 場景 + 光影 + カメラワーク + スタイル + 画質 + 制約
```

### テンプレートカード形式

毎回のプロンプト作成時、以下のテンプレートに沿って記述すると安定した結果が得られます。

```
Subject: [人物/物体，年齢または材質]
Camera: [画角] + [動き方] + [アングル], [焦点距離]
Style: [視覚アンカー：フィルム/工芸/監督スタイル], [照明], [色処理]
Constraints: [禁止事項], [フレームレート/リズム], [尺/ビート], [一貫性制約]
```

---

## 精選プロンプト例

以下は、様々なジャンルに対応した実践的なプロンプト例です。コードブロック内は実際にそのまま使用できるプロンプトです。

### 1. 武俠アクション

雨の竹林での剣戟シーン。高速カメラワークと物理演算の指定がポイントです。

```
A wuxia-style male hero wearing black martial outfit, fighting enemies in a rainy
bamboo forest at night. Fast sword combos with visible sword light trails and
splashing water. Fast follow camera, crane shots, and quick close-ups. Cinematic
camera language. Maintain character appearance and clothing consistency. Realistic
physics, wet fabric, rain interaction. 4K Ultra HD, no blur, no ghosting.
```

### 2. サイバーパンク追跡

ネオン街での追跡劇。クイックカットと高コントラスト照明で緊迫感を演出します。

```
A high-energy cinematic action sequence at night in a neon-lit city, the camera
tracking a lone character sprinting through rain-soaked streets as police drones
and headlights blur past. Quick cuts between close-ups of determined eyes, boots
splashing through puddles, and wide shots of traffic narrowly missing him.
Cyberpunk aesthetics, high contrast neon lighting, IMAX cinematic texture. 4K,
rich details, sharp clarity.
```

### 3. ラグジュアリー広告

高級時計のマクロ撮影。ジンバルオービットとスタジオ照明で商品の質感を引き出します。

```
Close-up macro shot, smooth gimbal orbit, steady motion. A matte black luxury
watch on a velvet stand rotates slowly while soft light reflects off the glass.
Style: High-end studio photography, cool-toned lighting, crisp reflections. Keep
logo sharp, no warping, tripod-stable, no background flickering. 4K Ultra HD.
```

### 4. 癒し系日本風

桜の下の女性ポートレート。浅い被写界深度とスローなプッシュインで柔らかい雰囲気を作ります。

```
A young woman stands under a cherry blossom tree, gentle breeze blowing through
her long hair, she slowly looks up at the falling petals. Medium shot, slowly
pushing in to face close-up. Japanese fresh style, soft afternoon sunlight,
shallow depth of field. 4K, stable picture, no distortion.
```

### 5. フィルム・ノワール

雨のネオン街を歩く赤いドレスの女性。キアロスクーロ照明とトラッキングショットが鍵です。

```
A woman in a red dress walks confidently down a rainy city street at night, neon
reflections on wet pavement, film noir style, tracking shot. Harsh chiaroscuro
lighting, deep shadows, cinematic texture, 4K. Maintain face and clothing
consistency, stable picture.
```

### 6. 騎士マルチショット

複数カットの自動分鏡を活用した例。ショットごとの指示を明確に分けます。

```
A multi-shot sequence of a knight in silver armor. Shot 1: Wide shot as he enters
a dark cave with a torch. Shot 2: Close-up of his nervous eyes. Shot 3: He draws
his sword, which glows blue. Low-angle tracking shot, 2K resolution. Sound of
crackling fire and echoing footsteps.
```

### 7. シネマティックポートレート

夏の森の中のアニメ風少女。フィルムグレインと癒し系ムードの組み合わせです。

```
An 18-year-old Japanese anime girl with short hair, wearing a white dress and
straw hat, standing on a forest path in warm summer afternoon sunlight. She slowly
turns toward the camera and smiles gently. A light breeze moves her hair and
dress. The camera slowly pushes in from medium shot to close-up. Soft natural
lighting, film grain, healing and peaceful mood, cinematic quality. Maintain face
and clothing consistency, no distortion, high detail.
```

### 8. 旅人の黄昏（Dolly プッシュイン）

ゴールデンアワーの光とドリーインの組み合わせで、旅人の哀愁を捉えます。

```
A weary traveler in a dusty leather cloak. He slowly removes his wide-brimmed hat
and exhales, looking toward a sunset. Low-angle medium shot, slow dolly-in towards
his face, shallow depth of field. Warm golden hour light, cinematic color grading.
4K, stable picture, no flickering.
```

### 9. コーヒー広告（中国語分鏡＋タイムビート）

中国語でのタイムコード付き分鏡プロンプト例。即夢AIでは中国語プロンプトも高精度で処理されます。

```
将@视频1延长15秒。1-5秒：光影透过百叶窗在木桌、杯身上缓缓滑过。6-10秒：一粒
咖啡豆从画面上方轻轻飘落，镜头向咖啡豆推进至画面黑屏。11-15秒：品牌英文渐显。
```

### 10. 古風対決シーン（中国語分鏡）

中国語での複数カット分鏡プロンプト例。カメラワークの切り替えを詳細に指定しています。

```
第一个画面：从红衣女子拿起酒壶喝酒开始，环绕运镜到红衣女子背部，然后移镜变焦
渐隐看到远处的黑衣女子。第二个画面：切换无人机航拍大全景，展现悬崖全貌。第三个
画面：两个人物的近景特写，对峙氛围紧张。电影质感，4K高清，面部清晰不变形，自然
光影。
```

### 11. フルモーダル参照（画像＋動画＋音声）

画像・動画・音声の全素材を@タグで参照するプロンプト例。最も複雑な使い方です。

```
参考@视频1的人物动作和运镜手法，生成@图片1中黑衣人物在竹林将飞刀掷出的视频。
起始帧的视角景别严格参照@视频1，飞刀掷出以后慢动作对焦飞刀，并虚化黑衣人物。
做到1比1还原参考视频，仅人物改为黑衣女子。仅生成打斗音效和环境的音效，并加入
背景音乐@音频1。
```

### 12. 商品プロモーション

複数の画像素材を参照した商品展示プロンプト例。異なる角度の素材を組み合わせます。

```
对@图片1进行商业级摄像展示，侧面结构参考@图片2，材质细节参考@图片3，镜头环绕
推进，高级质感，4K超高清，画面稳定不变形。
```

---

## カメラワークキーワード早見表

プロンプトで使用できるカメラワーク関連の英語キーワード一覧です。

| カメラワーク | 英語キーワード | 効果説明 |
|-------------|--------------|---------|
| プッシュイン | `dolly-in`, `push in` | カメラが被写体に近づき、緊張感/親密感を増す |
| プルアウト | `dolly-out`, `pull out` | カメラが被写体から離れ、環境を明かす |
| トラッキング | `track left/right` | カメラが横方向に移動して被写体を追う |
| パン | `pan left/right` | カメラが定位置で水平回転 |
| クレーン | `crane up/down` | カメラが垂直に昇降 |
| オービット | `orbit`, `360 orbit` | 被写体の周りを回転 |
| ハンドヘルド | `handheld` | 微かな揺れを加え、ドキュメンタリー感を演出 |
| ジンバル | `gimbal` | 滑らかで安定した動き、洗練された質感 |
| ドリーズーム | `dolly zoom` | ヒッチコック風の古典的めまい効果 |
| ウィップパン | `whip pan` | 高速横移動で切迫感を演出 |
| 空撮 | `aerial sweep`, `drone shot` | 上空からの俯瞰パノラマ |

**速度の組み合わせ**：`slow` / `medium` / `fast` と距離の説明を組み合わせます。例：`slow dolly-in, 1-2 feet`

**複合カメラワーク**：ビートごとに記述します。例：`Start: slow dolly-in. Then: gentle pan right for the final 2 seconds.`

---

## 画角の組み合わせガイド

画角（ショットサイズ）によって適切なカメラワークが異なります。

| 画角 | 適用シーン | 推奨カメラワーク | 注意点 |
|------|-----------|----------------|--------|
| ワイド（遠景） | 環境説明、商品全景 | スロープッシュ/固定 | 高速パンは避ける（残像が発生） |
| ミディアム（中景） | 会話、UGC | ハンドヘルド＝プライベート感、ジンバル＝洗練感 | 最も安全な画角 |
| クローズアップ（近景） | ディテール、感情 | 微プッシュイン | パンは近景では不自然。望遠でボケ味を出せる |

---

## スタイルキーワード分類

映像のビジュアルスタイルを決定するキーワードです。ジャンルに合わせて選択してください。

| ジャンル | 推奨スタイルワード |
|---------|------------------|
| 日常/Vlog | 癒し系、文芸的、日本風フレッシュ、韓国風ムード |
| SF/大作 | `Cyberpunk`, `Dark premium`, `Retro film`, `Dreamy soft light` |
| ミニマル | `Minimalist clean`, `Premium texture`, `Realistic photography` |
| シネマティック | `Cinematic texture`, `Film grain`, `Anamorphic lens flare` |
| フィルム・ノワール | `Film noir`, `Chiaroscuro lighting`, `High contrast` |
| アニメ/アート | `Anime style`, `Thick oil paint texture`, `Van Gogh Post-Impressionism` |

---

## オーディオプロンプトキーワード

Seedance 2.0 は音声も同時生成できます。以下のキーワードで音響効果を指定できます。

| キーワード | 効果 |
|-----------|------|
| `reverb` | 大空間の残響（ホール、教会） |
| `muffled` | こもった音（密閉空間、水中） |
| `echoing` | エコー（大型ホール） |
| `metallic clink` | 金属の衝突音 |
| `crunchy` | 砂利を踏む質感音 |
| `high-pitched` | 高周波の鋭い効果音 |
| `crackling fire` | 焚き火のパチパチ音 |

---

## 画質向上サフィックス

以下のサフィックスは**毎回プロンプトの末尾に付加することを推奨**します。安定した高品質出力を得るための基本設定です。

```
4K, Ultra HD, Rich details, Sharp clarity, Cinematic texture, Natural colors,
Soft lighting, No blur, No ghosting, No flickering, Stable picture.
```

---

## 制約ワード

**重要：Seedance 2.0 はネガティブプロンプトに対応していません。** 「～を避ける」ではなく、正向きの制約文として記述する必要があります。

以下の制約文を毎回プロンプトに含めることを強く推奨します。

```
Maintain face and clothing consistency, no distortion, high detail.
Character face stable without deformation, normal human structure, natural and smooth movements.
```

字幕を生成したくない場合は、以下を追加してください。

```
生成视频不带字幕
```

---

## @ 素材参照システム

素材（画像・動画・音声）をアップロードすると、モデルが自動的にタグ（`@Image1`、`@Video1`、`@Audio1`）を割り当てます。プロンプト内でこれらのタグを使い、各素材の用途を明確に指定します。

| 用途 | 記述例 |
|------|--------|
| 開始フレーム指定 | `@图片1 作为首帧`（@画像1を最初のフレームとして使用） |
| カメラワーク参照 | `参考@视频1的运镜和转场`（@動画1のカメラワークとトランジションを参考に） |
| キャラクター指定 | `@图片1 的女生作为主角，@图片2 的男生作为配角` |
| アクション参照 | `模仿@视频1的动作`（@動画1の動きを模倣） |
| BGM指定 | `@音频1 用于配乐`（@音声1をBGMとして使用） |
| 動画延長 | `将@视频1延长X秒`（@動画1をX秒延長） |
| 要素置換 | `将@视频1中的[要素A]换成[要素B]` |

---

## コアテクニック

Seedance 2.0 で安定した高品質な映像を生成するための12のコアテクニックです。

1. **1ショット1動詞** -- 複数の動作動詞を同時に指定するとモデルが混乱します。1つのショットには1つの主要動作を。
2. **キャラクターは1-2人まで** -- 3人以上はアイデンティティの混同と一貫性低下の原因になります。
3. **プロンプトは30-200語** -- 短すぎると情報不足、長すぎるとモデルが細部を無視します。
4. **制約ワード必須** -- `Maintain face and clothing consistency, no distortion, high detail` を常に含める。
5. **ネガティブプロンプト非対応** -- 「～しない」ではなく正向きの制約文のみ使用可能です。
6. **画質サフィックスは毎回付加** -- 4K, Ultra HD 等のサフィックスを必ず付けましょう。
7. **短い尺から始める** -- まず5-10秒で効果を確認し、問題なければ延長します。
8. **複数バリエーション生成** -- 2-4パターン生成して比較選択するのが効率的です。
9. **素材@タグを入念に確認** -- 複数素材使用時に最もミスしやすいポイントです。
10. **参照動画は短く** -- 重要な部分だけ切り出して使います。短いほど精度が高くなります。
11. **"lens switch" でカット切替** -- 1回の生成でマルチカット切替が可能です。
12. **動作描写は穏やかな語彙で** -- `Slow`, `Gentle`, `Continuous`, `Natural`, `Smooth` を優先的に使いましょう。

---

## イテレーション・トラブルシューティング

生成結果に問題がある場合、以下の判断ツリーで対処してください。

| 問題 | 解決方法 |
|------|---------|
| 構図は間違っているが動作は正しい | まず Camera（画角＋1つの動き）を調整し、Subject と Action は維持する |
| 動きが不自然（揺れすぎ/速すぎ） | `handheld` と `gimbal` を切り替え、速度を設定し、Style はそのまま |
| スタイル/色調がドリフトする | より強い視覚アンカーで Style を置換し、形容詞を減らす |
| 手部/ラベル/フレアが繰り返し発生 | 制約ワードを変更するか画角を変更。近景から中景に切り替える |
| 複数アングルが混乱する | `multiple camera angles` を `single tracking shot` に変更する |

---

## おすすめリソース

### GitHub リポジトリ

- [ZeroLu/awesome-seedance](https://github.com/ZeroLu/awesome-seedance) -- ハイクオリティプロンプト集（映画/広告/アニメ/SNS分類）
- [YouMind-OpenLab/awesome-seedance-2-prompts](https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts) -- 200以上の厳選プロンプト
- [dexhunter/seedance2-skill](https://github.com/dexhunter/seedance2-skill) -- Claude Code / Cursor 向けプロンプト生成 Skill
- [hexiaochun/seedance2-api](https://github.com/hexiaochun/seedance2-api) -- API ガイド＋分鏡テンプレート

### 英語リソース

- [WaveSpeedAI プロンプトテンプレート](https://wavespeed.ai/blog/posts/blog-seedance-2-0-prompt-template/)
- [GlobalGPT すぐ使える5つのプロンプト](https://www.glbgpt.com/hub/seedance-2-0-prompt-guide/)
- [WenHaoFree カメラワーク万能公式](https://blog.wenhaofree.com/en/posts/articles/seedance-2-0-prompt-mastery-guide/)
- [WeShop AI プロンプトスクリプトガイド](https://www.weshop.ai/blog/seedance-2-0-guide-how-to-master-the-prompt-script/)
- [DataCamp Seedance 2.0 ガイド](https://www.datacamp.com/blog/seedance-2-0)
- [seedance2prompt.org](https://seedance2prompt.org/) -- 500以上のプロンプトライブラリ
- [PromptHero Seedance プロンプト](https://prompthero.com/seedance-prompts)

### 中国語リソース

- [知乎 万能公式＋@引用詳解](https://zhuanlan.zhihu.com/p/2004523300588643639)
- [知乎 即夢チュートリアル](https://zhuanlan.zhihu.com/p/2004623893273519265)
- [知乎 Claude Code で100%映像完成](https://zhuanlan.zhihu.com/p/2004270375060661803)
- [テンセントニュース 完全操作マニュアル](https://news.qq.com/rain/a/20260209A044NZ00)
- [Bilibili 30の使い方＋プロンプト大公開](https://www.bilibili.com/video/BV1gCcqzkEe7/)
- [Bilibili 初心者向け＋プロンプトテンプレート](https://www.bilibili.com/video/BV11AFsztE8j/)（1.6万ブックマーク）
- [Bilibili 最も完全な使用チュートリアル](https://www.bilibili.com/video/BV11Dc5zBE7d/)
- [CSDN プロンプト完全ガイド](https://blog.csdn.net/mizzlelover/article/details/158040401)

### メディア報道

- [Variety - Tom Cruise vs Brad Pitt Goes Viral](https://variety.com/2026/film/news/motion-picture-association-ai-seedance-bytedance-tom-cruise-1236661753/)
- [Deadline - Cruise Vs Pitt Deepfake](https://deadline.com/2026/02/cruise-vs-pitt-seedance-viral-ai-hollywood-videos-1236717127/)
- [Hollywood Reporter - Seedance Sparks Hollywood Backlash](https://www.hollywoodreporter.com/business/business-news/seedance-2-0-sparks-hollywood-backlash-1236505120/)
- [PYMNTS - ByteDance's Seedance 2.0 Builds Buzz](https://www.pymnts.com/artificial-intelligence-2/2026/bytedances-seedance-2-0-builds-buzz-in-expanding-video-generation-market/)
