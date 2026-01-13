---
title: '誰が魚を飼っているか'
pubDate: 2025-02-07T00:00:00.000Z
description: '古典的な論理パズル：誰が魚を飼っているかのPython解法'
author: 'Remy'
tags: ['論理パズル', 'CSP', 'バックトラック法', 'Python', '人工知能', 'deepseek', '制約充足問題']
lang: 'ja'
translatedFrom: 'who-fish'
---

## 古典的な論理パズル：誰が魚を飼っているか

これは有名なアインシュタインのパズルで、わずか2%の人しか解けないと言われています。問題は以下の通りです：

    1. 5つの異なる色の家がある
    2. 各家には異なる国籍の人が住んでいる
    3. この5人はそれぞれ特定の飲み物を好み、特定のペットを飼い、特定のスポーツを好む
    4. 2人が同じ飲み物を好んだり、同じペットを飼ったり、同じスポーツを好んだりすることはない

    既知の手がかり：

    1. イギリス人は赤い家に住んでいる
    2. スウェーデン人は犬を飼っている
    3. デンマーク人は茶を飲む
    4. 緑の家は白い家の左側にある
    5. 緑の家の所有者はコーヒーを飲む
    6. ポロをする人は鳥を飼っている
    7. 黄色い家の所有者はアイスホッケーをする
    8. 真ん中の家に住む人は牛乳を飲む
    9. ノルウェー人は最初の家に住んでいる
    10. 野球をする人は猫を飼っている人の隣に住んでいる
    11. 馬を飼っている人はアイスホッケーをする人の隣に住んでいる
    12. 卓球をする人はビールを飲む
    13. ドイツ人はサッカーをする
    14. ノルウェー人は青い家の隣に住んでいる
    15. 野球をする人は水を飲む隣人がいる

    質問：誰が魚を飼っているか？

## 分析

これは典型的な制約充足問題（Constraint Satisfaction Problem, CSP）です。CSP 問題の特徴は：

1. 値を割り当てる必要がある変数のセットがある
2. 各変数には値域（ドメイン）がある
3. 変数間にはいくつかの制約条件が存在する
4. 目標はすべての制約を満たす割り当てを見つけること

この問題では：
- 変数は5つの家の色、国籍、飲み物、スポーツ、ペット
- 各変数の値域は与えられた5つの選択肢
- 制約条件には15の既知の手がかりが含まれる
- すべての制約を満たす組み合わせを見つける必要がある

この種の問題を解決する一般的な方法はバックトラック法（Backtracking）です：
1. 変数に順次値を試行
2. ある割り当てが制約に違反することが判明したら、前のステップに戻る
3. 他の可能な値を試し続ける
4. すべての制約を満たす解が見つかるまで続ける

## 解法とプログラム実装

以下、Python でこの解法を実装します：

```python
from itertools import permutations

# すべての属性カテゴリを定義
colors = ["赤", "黄", "青", "緑", "白"]
nations = ["イギリス", "スウェーデン", "デンマーク", "ノルウェー", "ドイツ"]
drinks = ["牛乳", "茶", "コーヒー", "水", "ビール"]
sports = ["アイスホッケー", "野球", "ポロ", "サッカー", "卓球"]
pets = ["猫", "馬", "鳥", "魚", "犬"]

# 家の位置を定義
houses = [1, 2, 3, 4, 5]

# 制約条件関数を定義
def satisfies_constraints(assignment):
    # 条件1: イギリス人は赤い家に住む
    if assignment["nations"].index("イギリス") != assignment["colors"].index("赤"):
        return False

    # 条件2: スウェーデン人は犬を飼う
    if assignment["nations"].index("スウェーデン") != assignment["pets"].index("犬"):
        return False

    # 条件3: デンマーク人は茶を飲む
    if assignment["nations"].index("デンマーク") != assignment["drinks"].index("茶"):
        return False

    # 条件4: 緑の家は白い家の左側
    green_idx = assignment["colors"].index("緑")
    white_idx = assignment["colors"].index("白")
    if green_idx >= white_idx:
        return False

    # 条件5: 緑の家の所有者はコーヒーを飲む
    if assignment["colors"].index("緑") != assignment["drinks"].index("コーヒー"):
        return False

    # 条件6: ポロをする人は鳥を飼う
    if assignment["sports"].index("ポロ") != assignment["pets"].index("鳥"):
        return False

    # 条件7: 黄色い家の所有者はアイスホッケーをする
    if assignment["colors"].index("黄") != assignment["sports"].index("アイスホッケー"):
        return False

    # 条件8: 真ん中の家は牛乳を飲む
    if assignment["drinks"][2] != "牛乳":
        return False

    # 条件9: ノルウェー人は最初の家に住む
    if assignment["nations"][0] != "ノルウェー":
        return False

    # 条件10: 野球をする人は猫を飼う人の隣に住む
    baseball_idx = assignment["sports"].index("野球")
    cat_idx = assignment["pets"].index("猫")
    if abs(baseball_idx - cat_idx) != 1:
        return False

    # 条件11: 馬を飼う人はアイスホッケーをする人の隣に住む
    horse_idx = assignment["pets"].index("馬")
    ice_hockey_idx = assignment["sports"].index("アイスホッケー")
    if abs(horse_idx - ice_hockey_idx) != 1:
        return False

    # 条件12: 卓球をする人はビールを飲む
    if assignment["sports"].index("卓球") != assignment["drinks"].index("ビール"):
        return False

    # 条件13: ドイツ人はサッカーをする
    if assignment["nations"].index("ドイツ") != assignment["sports"].index("サッカー"):
        return False

    # 条件14: ノルウェー人は青い家の隣に住む
    norway_idx = assignment["nations"].index("ノルウェー")
    blue_idx = assignment["colors"].index("青")
    if abs(norway_idx - blue_idx) != 1:
        return False

    # 条件15: 野球をする人は水を飲む隣人がいる
    baseball_idx = assignment["sports"].index("野球")
    water_idx = assignment["drinks"].index("水")
    if abs(baseball_idx - water_idx) != 1:
        return False

    return True

# 探索関数（最適化版）
def solve():
    assignments = []
    # ノルウェー人が最初の家に住むことを固定
    i = [0] * 5
    for nations_perm in permutations(nations):
        i[0] += 1
        if nations_perm[0] != "ノルウェー":
            continue

        # 真ん中の家が牛乳を飲むことを固定
        for drinks_perm in permutations(drinks):
            i[1] += 1
            if drinks_perm[2] != "牛乳":
                continue

            # デンマーク人が茶を飲むことを固定
            if nations_perm.index("デンマーク") != drinks_perm.index("茶"):
                continue

            # 緑の家が白い家の左側であることを固定
            for colors_perm in permutations(colors):
                i[2] += 1
                green_idx = colors_perm.index("緑")
                white_idx = colors_perm.index("白")
                if green_idx >= white_idx:
                    continue

                # ノルウェー人が青い家の隣に住むことを固定
                norway_idx = nations_perm.index("ノルウェー")
                blue_idx = colors_perm.index("青")
                if abs(norway_idx - blue_idx) != 1:
                    continue

                # イギリス人が赤い家に住むことを固定
                if nations_perm.index("イギリス") != colors_perm.index("赤"):
                    continue

                # 緑の家の所有者がコーヒーを飲むことを固定
                if colors_perm.index("緑") != drinks_perm.index("コーヒー"):
                    continue

                # 黄色い家の所有者がアイスホッケーをすることを固定
                for sports_perm in permutations(sports):
                    i[3] += 1
                    if colors_perm.index("黄") != sports_perm.index("アイスホッケー"):
                        continue

                    # ドイツ人がサッカーをすることを固定
                    if nations_perm.index("ドイツ") != sports_perm.index("サッカー"):
                        continue

                    # 卓球をする人がビールを飲むことを固定
                    if sports_perm.index("卓球") != drinks_perm.index("ビール"):
                        continue

                    # 野球をする人が水を飲む隣人がいることを固定
                    baseball_idx = sports_perm.index("野球")
                    water_idx = drinks_perm.index("水")
                    if abs(baseball_idx - water_idx) != 1:
                        continue

                    # スウェーデン人が犬を飼うことを固定
                    for pets_perm in permutations(pets):
                        i[4] += 1
                        if nations_perm.index("スウェーデン") != pets_perm.index("犬"):
                            continue

                        # ポロをする人が鳥を飼うことを固定
                        if sports_perm.index("ポロ") != pets_perm.index("鳥"):
                            continue

                        # 野球をする人が猫を飼う人の隣に住むことを固定
                        baseball_idx = sports_perm.index("野球")
                        cat_idx = pets_perm.index("猫")
                        if abs(baseball_idx - cat_idx) != 1:
                            continue

                        # 馬を飼う人がアイスホッケーをする人の隣に住むことを固定
                        horse_idx = pets_perm.index("馬")
                        ice_hockey_idx = sports_perm.index("アイスホッケー")
                        if abs(horse_idx - ice_hockey_idx) != 1:
                            continue

                        # すべての条件が満たされれば、現在の割り当てを返す
                        assignment = {
                            "colors": colors_perm,
                            "nations": nations_perm,
                            "drinks": drinks_perm,
                            "sports": sports_perm,
                            "pets": pets_perm,
                        }
                        print(i)
                        assignments.append(assignment)
    if assignments:
        return assignments
    else:
        return None

# 探索を実行
solutions = solve()
# 結果を出力
if solutions:
    print(len(solutions))
    for solution in solutions:
        for i in range(5):
            print(f"家{i+1}:")
            print(f"  色: {solution['colors'][i]}")
            print(f"  国籍: {solution['nations'][i]}")
            print(f"  飲み物: {solution['drinks'][i]}")
            print(f"  スポーツ: {solution['sports'][i]}")
            print(f"  ペット: {solution['pets'][i]}")
        print("---" * 10)
else:
    print("解が見つかりませんでした。")
```

## 問題の発見

待って...答えが一意でない！そして、問題文に実は曖昧な文があることに気づきました。「緑の家は白い家の左側にある」という記述が不正確で、「緑の家は白い家の左側で間に隙間がない」であるべきです。

元のコードを修正し、「緑の家は白い家の左側で間に隙間がない」という制約条件を追加しました：
```python
if white_idx - green_idx != 1:
    continue
```

修正後の結果、良いですね、今では答えが一意になりました：

```
家1:
  色: 黄
  国籍: ノルウェー
  飲み物: 水
  スポーツ: アイスホッケー
  ペット: 猫
家2:
  色: 青
  国籍: デンマーク
  飲み物: 茶
  スポーツ: 野球
  ペット: 馬
家3:
  色: 赤
  国籍: イギリス
  飲み物: 牛乳
  スポーツ: ポロ
  ペット: 鳥
家4:
  色: 緑
  国籍: ドイツ
  飲み物: コーヒー
  スポーツ: サッカー
  ペット: 魚
家5:
  色: 白
  国籍: スウェーデン
  飲み物: ビール
  スポーツ: 卓球
  ペット: 犬
```

**答え：ドイツ人が魚を飼っている。**

## まとめ

この古典的な論理パズルは、制約充足問題の特徴と解決方法を示しています。制約条件とバックトラック探索を体系的に適用することで、一意の解を見つけることができました。この方法は人工知能、オペレーションズリサーチ、コンピュータサイエンスで広く応用されています。

重要なポイント：
1. 問題を制約充足問題としてモデル化
2. バックトラック法を使用した体系的探索
3. 制約伝播による探索空間の削減
4. 問題記述の正確性と曖昧性に注意
