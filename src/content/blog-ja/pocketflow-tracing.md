---
title: 'PocketFlow トレーシングの紹介：AI ワークフローを簡単に観測可能に'
pubDate: 2025-07-01T00:00:00.000Z
description: 'わずか1行のコードで、PocketFlow ワークフローをブラックボックスから完全に観測可能でデバッグ可能なシステムに変換'
author: 'Remy'
tags: ['AI', '可観測性', 'トレーシング', 'デバッグ', 'ワークフロー']
lang: "ja"
translatedFrom: "pocketflow-tracing"
---

*わずか1行のコードで、PocketFlow ワークフローをブラックボックスから完全に観測可能でデバッグ可能なシステムに変換します。*

---

## 課題：AI ワークフローの可観測性

AI ワークフローの構築はエキサイティングですが、デバッグは？それほど楽しくありません。PocketFlow ワークフローが失敗したり異常な動作をしたりすると、よくこう問います：

- どのノードが失敗し、なぜ失敗したのか？
- ノード間でどのようなデータが転送されたのか？
- 各ステップにどれだけの時間がかかったのか？
- エラーは具体的にどこで発生したのか？
- パフォーマンスボトルネックをどのように最適化するか？

従来のログ手法では、各ノードに手動で監視コードを追加する必要があり、コードが雑然とします。実際の AI ロジックの構築よりも、デバッグインフラストラクチャに多くの時間を費やすことになります。

**より良い方法はないでしょうか？**

## PocketFlow トレーシングの紹介

**pocketflow-tracing** の発表を嬉しく思います。これは、最小限のコード変更で PocketFlow ワークフローにエンタープライズグレードの可観測性をもたらす新しいパッケージです。[Langfuse](https://langfuse.com/) 上に構築されており、包括的なトレーシング、監視、デバッグ機能を提供し、AI ワークフローの開発と保守方法を根本的に変えます。

### 主な利点

🎯 **ゼロフリクション統合**：`@trace_flow()` デコレーター1つで包括的なトレーシングを追加  
📊 **完全な可視性**：各ノードの実行、入力、出力、エラーを自動追跡  
⚡ **パフォーマンス洞察**：実行時間を追跡しボトルネックを特定  
🔍 **豊富なデバッグ**：Langfuse の強力なダッシュボードで詳細なトレースを表示  
🚀 **本番環境対応**：開発環境と本番環境の両方に適用  
🔄 **非同期サポート**：AsyncFlow と AsyncNode と完全互換  

## ビフォーアフター：違いを見る

### 前：手動ログの悪夢

```python
import logging
import time
from pocketflow import Node, Flow

logger = logging.getLogger(__name__)

class DataProcessingNode(Node):
    def prep(self, shared):
        start_time = time.time()
        logger.info(f"Starting prep phase with input: {shared}")
        try:
            data = shared.get("input_data")
            result = self._validate_data(data)
            logger.info(f"Prep completed in {time.time() - start_time:.2f}s")
            return result
        except Exception as e:
            logger.error(f"Prep failed: {e}")
            raise
    
    def exec(self, data):
        start_time = time.time()
        logger.info(f"Starting exec phase with data: {data}")
        try:
            processed = self._process_data(data)
            logger.info(f"Exec completed in {time.time() - start_time:.2f}s")
            return processed
        except Exception as e:
            logger.error(f"Exec failed: {e}")
            raise
    
    def post(self, shared, prep_res, exec_res):
        start_time = time.time()
        logger.info(f"Starting post phase")
        try:
            shared["output"] = exec_res
            logger.info(f"Post completed in {time.time() - start_time:.2f}s")
            return "default"
        except Exception as e:
            logger.error(f"Post failed: {e}")
            raise

class DataProcessingFlow(Flow):
    def __init__(self):
        super().__init__(start=DataProcessingNode())
```

### 後：クリーンなコードと自動トレーシング

```python
from pocketflow import Node, Flow
from pocketflow_tracing import trace_flow

class DataProcessingNode(Node):
    def prep(self, shared):
        data = shared.get("input_data")
        return self._validate_data(data)
    
    def exec(self, data):
        return self._process_data(data)
    
    def post(self, shared, prep_res, exec_res):
        shared["output"] = exec_res
        return "default"

@trace_flow()  # 🎉 これだけ！1行のコードで包括的な可観測性を実現
class DataProcessingFlow(Flow):
    def __init__(self):
        super().__init__(start=DataProcessingNode())
```


**違いは明らかです**：コードはクリーンでビジネスロジックに集中し、包括的なトレーシングはバックグラウンドで自動的に行われます。

## インストールとセットアップ

PocketFlow トレーシングの使用開始は非常に簡単です：

### 1. パッケージをインストール

```bash
pip install pocketflow-tracing
```

このパッケージには、Langfuse v2 SDK や設定管理用の python-dotenv を含む、必要なすべての依存関係が含まれています。

### 2. 環境を設定

プロジェクトルートディレクトリに `.env` ファイルを作成：

```env
# Langfuse 設定
LANGFUSE_SECRET_KEY=sk-lf-your-secret-key-here
LANGFUSE_PUBLIC_KEY=pk-lf-your-public-key-here
LANGFUSE_HOST=https://your-self-hosted-langfuse

# オプション：開発時にデバッグモードを有効化
POCKETFLOW_TRACING_DEBUG=true
```

**Langfuse 認証情報の取得：**
1. [langfuse.com](https://langfuse.com) または自己ホスト URL で無料アカウントを登録
2. 新しいプロジェクトを作成
3. プロジェクト設定から API キーをコピー
4. ホスト版には `https://cloud.langfuse.com`、自己ホストには独自の URL を使用

### 3. フローにトレーシングを追加

```python
from pocketflow import Node, Flow
from pocketflow_tracing import trace_flow

# 既存のノードコードはそのまま
class MyNode(Node):
    def prep(self, shared):
        return shared["input"]
    
    def exec(self, data):
        return f"Processed: {data}"
    
    def post(self, shared, prep_res, exec_res):
        shared["output"] = exec_res
        return "default"

# デコレーターを追加するだけ - 他の変更は不要！
@trace_flow()
class MyFlow(Flow):
    def __init__(self):
        super().__init__(start=MyNode())

# 通常通りフローを実行
flow = MyFlow()
shared = {"input": "Hello World"}
flow.run(shared)
```

以上です！ワークフローは完全にトレースされ、観測可能になりました。

## 完全な動作例

PocketFlow トレーシングの強力さを示す現実的な例を構築しましょう：

```python
#!/usr/bin/env python3
"""
カスタマーサポートチケット分析ワークフロー
マルチノード AI ワークフローの包括的なトレーシングを実演。
"""

from pocketflow import Node, Flow
from pocketflow_tracing import trace_flow
import time
import random

class TicketClassificationNode(Node):
    """優先度とカテゴリに基づいてサポートチケットを分類。"""
    
    def prep(self, shared):
        ticket = shared.get("ticket", {})
        return {
            "subject": ticket.get("subject", ""),
            "description": ticket.get("description", ""),
            "customer_tier": ticket.get("customer_tier", "standard")
        }
    
    def exec(self, ticket_data):
        # AI 分類をシミュレート
        time.sleep(0.1)  # 処理時間をシミュレート
        
        # シンプルな分類ロジック
        subject = ticket_data["subject"].lower()
        description = ticket_data["description"].lower()
        
        if "urgent" in subject or "critical" in description:
            priority = "high"
        elif "billing" in subject or "payment" in description:
            priority = "medium"
        else:
            priority = "low"
            
        category = "technical" if "error" in description else "general"
        
        return {
            "priority": priority,
            "category": category,
            "confidence": random.uniform(0.8, 0.99)
        }
    
    def post(self, shared, prep_res, exec_res):
        shared["classification"] = exec_res
        return "route_ticket"

class TicketRoutingNode(Node):
    """分類に基づいてチケットを適切なチームにルーティング。"""
    
    def prep(self, shared):
        classification = shared.get("classification", {})
        customer_tier = shared.get("ticket", {}).get("customer_tier", "standard")
        return {
            "priority": classification.get("priority", "low"),
            "category": classification.get("category", "general"),
            "customer_tier": customer_tier
        }
    
    def exec(self, routing_data):
        # ルーティングロジックをシミュレート
        time.sleep(0.05)
        
        if routing_data["priority"] == "high":
            team = "escalation"
        elif routing_data["category"] == "technical":
            team = "engineering"
        elif routing_data["customer_tier"] == "premium":
            team = "premium_support"
        else:
            team = "general_support"
            
        return {
            "assigned_team": team,
            "estimated_response_time": "2 hours" if routing_data["priority"] == "high" else "24 hours"
        }
    
    def post(self, shared, prep_res, exec_res):
        shared["routing"] = exec_res
        return "default"

@trace_flow(flow_name="CustomerSupportTicketAnalysis")
class CustomerSupportFlow(Flow):
    """完全なカスタマーサポートチケット分析ワークフロー。"""
    
    def __init__(self):
        # ノードを作成
        classifier = TicketClassificationNode()
        router = TicketRoutingNode()
        
        # フローを定義
        classifier >> router
        
        super().__init__(start=classifier)

def main():
    """カスタマーサポートワークフローの例を実行。"""
    print("🎫 カスタマーサポートチケット分析")
    print("=" * 40)
    
    # サンプルチケットデータ
    tickets = [
        {
            "id": "TICKET-001",
            "subject": "URGENT: Payment processing error",
            "description": "Customer cannot complete payment, getting error 500",
            "customer_tier": "premium"
        },
        {
            "id": "TICKET-002", 
            "subject": "Question about billing cycle",
            "description": "When does my billing cycle reset?",
            "customer_tier": "standard"
        }
    ]
    
    flow = CustomerSupportFlow()
    
    for ticket in tickets:
        print(f"\n📥 Processing {ticket['id']}: {ticket['subject']}")
        
        shared = {"ticket": ticket}
        result = flow.run(shared)
        
        print(f"📊 Classification: {shared['classification']}")
        print(f"🎯 Routing: {shared['routing']}")
        print(f"✅ Result: {result}")
    
    print(f"\n📈 Langfuse ダッシュボードで詳細なトレースを表示！")

if __name__ == "__main__":
    main()
```

## キャプチャされるもの

この例を実行すると、PocketFlow トレーシングは自動的にキャプチャします：

### フローレベルデータ
- **実行メタデータ**：開始時刻、終了時刻、総期間
- **入力状態**：フロー開始時の完全な共有データ
- **出力状態**：フロー完了時の最終共有データ  
- **フロー結果**：フローの最終戻り値
- **エラー処理**：完全なスタックトレース付きの任意の例外

### ノードレベルデータ
各ノード（TicketClassificationNode、TicketRoutingNode）に対して、システムは追跡します：

**prep() フェーズ：**
- 入力：完全な共有状態
- 出力：prep メソッドが返す準備データ
- 期間：正確な実行時間
- エラー：prep フェーズ中の任意の例外

**exec() フェーズ：**
- 入力：prep フェーズのデータ
- 出力：処理結果
- 期間：コア実行時間
- リトライ情報：リトライが設定されている場合
- エラー：コンテキスト付きの処理失敗

**post() フェーズ：**
- 入力：共有状態、prep 結果、exec 結果
- 出力：フロー制御のアクション文字列
- 期間：後処理時間
- 状態変更：共有データがどのように変更されたか
- エラー：任意の後処理問題

## Langfuse でトレースを表示

トレースされたワークフローを実行した後、Langfuse ダッシュボードを開いて豊富な可観測性データを探索します：

### ダッシュボード概要
Langfuse ホスト URL（例：`https://cloud.langfuse.com`）に移動すると、次のものが表示されます：

- **トレースリスト**：タイムスタンプとステータス付きのすべてのフロー実行
- **パフォーマンスメトリクス**：平均実行時間と成功率
- **エラー追跡**：詳細なエラー情報付きの失敗実行
- **検索とフィルタリング**：名前、時間、ステータスで特定のトレースを検索

### 詳細トレースビュー
任意のトレースをクリックして表示：

- **階層スパンビュー**：フロー → ノード → フェーズのツリー構造
- **タイムライン可視化**：正確な実行時間
- **入出力データ**：ワークフローを通る完全なデータフロー
- **パフォーマンス分解**：各フェーズに費やされた時間
- **エラー詳細**：失敗時のスタックトレースとエラーコンテキスト

トレースは、ワークフロー実行に対する前例のない可視性を提供し、デバッグと最適化を簡単にします。

## 高度な設定

### カスタムフロー名とメタデータ

```python
@trace_flow(
    flow_name="ProductionDataPipeline",
    session_id="batch-2024-001", 
    user_id="data-team"
)
class DataPipeline(Flow):
    pass
```

### 環境設定

```python
from pocketflow_tracing import TracingConfig

# カスタム設定をロード
config = TracingConfig.from_env()
config.debug = True
config.trace_inputs = True
config.trace_outputs = True

@trace_flow(config=config)
class MyFlow(Flow):
    pass
```

### 選択的トレーシング制御

```env
# トレースする内容を細かく調整
POCKETFLOW_TRACE_INPUTS=true
POCKETFLOW_TRACE_OUTPUTS=true
POCKETFLOW_TRACE_PREP=true
POCKETFLOW_TRACE_EXEC=true
POCKETFLOW_TRACE_POST=true
POCKETFLOW_TRACE_ERRORS=true
```

## トラブルシューティングガイド

### 一般的な問題と解決策

**1. "ダッシュボードにトレースが表示されない"**
```bash
# デバッグモードを有効にして何が起きているかを確認
export POCKETFLOW_TRACING_DEBUG=true
python your_flow.py
```

**2. "Langfuse 接続失敗"**
- `.env` ファイルに正しい認証情報があることを確認
- Langfuse ホストへのネットワーク接続を確認
- Langfuse サーバーが実行中であることを確認（自己ホストの場合）

**3. "インポートエラー"**
```bash
# パッケージが正しくインストールされていることを確認
pip install pocketflow-tracing

# 開発インストールの場合
pip install -e ".[dev]"
```

**4. "パフォーマンス影響の懸念"**
- トレーシングのオーバーヘッドは最小限（通常、ノードあたり<5ms）
- `POCKETFLOW_TRACING_DEBUG=false` を設定して本番環境でトレーシングを無効化
- データ量を削減するために選択的トレーシングを使用

### デバッグモード出力

デバッグモードを有効にすると、次のような詳細な出力が表示されます：
```
[TRACING] Langfuse クライアントを初期化中...
[TRACING] トレース開始：CustomerSupportTicketAnalysis
[TRACING] ノードスパン開始：TicketClassificationNode.prep
[TRACING] ノードスパン完了、所要時間 0.12ms
[TRACING] トレースを Langfuse にフラッシュ
```

## 本番環境での考慮事項

### パフォーマンス影響
- **最小限のオーバーヘッド**：トレーシングは通常、ノード実行ごとに 1-5ms 追加
- **非同期処理**：トレースはブロックを避けるために非同期で送信
- **設定可能な深度**：トレースするデータ量を制御

### セキュリティとプライバシー
- **データサニタイゼーション**：機密データのためにカスタムシリアライザーを実装
- **環境分離**：開発/テスト/本番に異なる Langfuse プロジェクトを使用
- **アクセス制御**：Langfuse 組み込みのユーザー管理を活用

### スケーリングの考慮事項
- **バッチ処理**：効率的な転送のためにトレースをバッチ処理
- **エラー回復**：トレーシング失敗はワークフロー実行に影響しない
- **リソース管理**：トレースデータの自動クリーンアップ

## なぜこれが重要か

PocketFlow トレーシングは、AI ワークフロー開発の処理方法における根本的な変化を表しています：

**前**：開発者は時間の 30-40% をワークフローのデバッグに費やし、実行フローとデータ変換に対する可視性が限られていました。

**後**：箱から出してすぐの完全な可観測性により、開発者はデバッグインフラストラクチャではなく、より良い AI ロジックの構築に集中できます。

**実際的な影響**：
- 🚀 **より速い開発**：推測ではなく即座に問題を特定
- 🔧 **より簡単なデバッグ**：何が起こったのか、いつ起こったのかを正確に確認
- 📈 **パフォーマンス最適化**：正確なタイミングデータでボトルネックを特定
- 🛡️ **本番環境への自信**：ワークフローをリアルタイムで監視
- 👥 **チームコラボレーション**：協調デバッグのためにトレースを共有

## 今日から始めよう

包括的な可観測性で PocketFlow ワークフローを変革する準備はできましたか？

### 1. パッケージをインストール
```bash
pip install pocketflow-tracing
```

### 2. 環境をセットアップ
```bash
# サンプル環境ファイルをコピー
curl -o .env https://raw.githubusercontent.com/The-Pocket/PocketFlow/main/cookbook/pocketflow-tracing/.env.example

# Langfuse 認証情報で編集
nano .env
```

### 3. フローに1行追加
```python
from pocketflow_tracing import trace_flow

@trace_flow()  # ← この行を追加
class YourFlow(Flow):
    # 既存のコードはそのまま！
    pass
```

### 4. 実行して観察
フローを実行し、Langfuse ダッシュボードで魔法を見てください。

## コミュニティに参加

PocketFlow トレーシングはオープンソースであり、貢献を歓迎します！以下のいずれかを希望する場合：

- 🐛 **バグを報告**または機能を提案
- 📚 **ドキュメントを改善** 
- 🔧 **新しいトレーシング機能を追加**
- 🎯 **ユースケース**と例を共有

[GitHub リポジトリ](https://github.com/The-Pocket/PocketFlow)を訪れ、観測可能な AI ワークフローを構築している成長中の開発者コミュニティに参加してください。

## 次は何か？

これは始まりに過ぎません。以下のような刺激的な機能を開発中です：

- **カスタムメトリクス**：ドメイン固有のメトリクスを定義して追跡
- **リアルタイムアラート**：ワークフローが失敗またはパフォーマンスが低下したときに通知を受け取る
- **A/B テスト**：組み込み実験で異なるワークフローバージョンを比較
- **コスト追跡**：API 使用量とワークフローのコストを監視
- **統合エコシステム**：人気の MLOps および監視ツールと接続

---

**PocketFlow ワークフローを完全に観測可能にする準備はできましたか？** 今日 pocketflow-tracing をインストールして、包括的でゼロフリクションの可観測性を体験してください。
