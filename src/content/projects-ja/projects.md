---
title: "私の研究課題"
description: "このページには、私が最近情熱を注いでいること、オープンソースプロジェクト、研究が含まれています。"
pubDate: 2025-01-22
author: "redreamality"
lang: "ja"
translatedFrom: "projects"
---

最終更新日：2025年8月24日

>私のオープンソースプロジェクトと研究貢献のコレクションへようこそ。これらのプロジェクトは、人工知能/機械学習、Web開発、データ処理、研究ツールなど、複数の分野をカバーしています。

## 全体紹介

## 自動化エージェント構築

### The Agent Builder
>**ウェブサイト:** [the-agent-builder.com](https://the-agent-builder.com/)  **ステータス:** アルファ版 - 無料で使用可能

AIエージェント開発のための包括的なプラットフォームで、コンセプトから実現までの完全なツールチェーンを提供します。The Agent Builderは、AI能力を「コード生成」から「要件の明確化と計画設計」へと転換し、ソフトウェア開発の痛点を根本から解決します。

**コア機能:**

- **インタラクティブな要件明確化**: LLM対話能力を通じて曖昧な要件を主動的に明確化し、隠れた意図を掘り起こす
- **構造化されたタスク計画**: 「思考の青写真」を出力し、ブラックボックスを拒否し、詳細な実装計画を生成
- **オープンソースツールエコシステムの統合**: 既存のエコシステムリソースをインテリジェントに統合し、計画段階で開発ツールを接続
- **標準化された設計ドキュメント出力**: 「建設青写真」を自動生成し、資産を蓄積
- **完全自動化実行**: エンドツーエンドの実装、多言語フレームワークとCI/CDフローをサポート

**開発ツールチェーン:**

- **Plan**: インテリジェント計画 - AI駆動のプロジェクト計画ツール（利用可能）
- **Code**: コード生成 - 計画に基づいて高品質コードを自動生成（近日公開）
- **Test**: 自動化テスト - テストケースをインテリジェントに生成（近日公開）
- **Publish**: ワンクリック公開 - 自動化されたデプロイフロー（近日公開）

### GTPlanner: AI駆動のPRD生成ツール
**コードリポジトリ:** [OpenSQZ/GTPlanner](https://github.com/OpenSQZ/GTPlanner)
**プログラミング言語:** Python | **スター:** 18 | **フォーク:** 12
**ウェブサイト:** [the-agent-builder.com](https://the-agent-builder.com/)

GTPlannerは、The Agent Builderのオープンソース計画エンジンで、「雰囲気プログラミング」のために設計されたインテリジェントな製品要件ドキュメント（PRD）生成ツールです。自然言語の説明を構造化された技術文書に変換できます。

**主な機能:**

- **自然言語処理**: 要件の説明を構造化されたPRDに変換
- **多言語サポート**: 英語、中国語、スペイン語、フランス語、日本語を完全サポート
- **非同期処理**: 完全に非同期なパイプラインで応答性能を確保
- **複数回の最適化**: インタラクティブなフィードバックループを通じてドキュメントを反復最適化
- **構造化出力**: 標準化されカスタマイズ可能な技術文書を生成
- **拡張可能なアーキテクチャ**: モジュール化されたノード設計で、カスタマイズと拡張が容易

**使用方法:**

- **Web UI**: モダンなオンライン計画体験（推奨）
- **CLIモード**: インタラクティブおよび直接実行モード
- **FastAPIバックエンド**: REST APIサービス
- **MCP統合**: AIアシスタントとのシームレスな統合

**技術アーキテクチャ:**

- PocketFlowベースの非同期ノードアーキテクチャ
- 複数のLLMモデルをサポート
- 自動ファイル管理と言語検出
- 完全な開発者ツールチェーン

## 🔬 過去の研究

大規模モデル時代以前、私の主な専門は情報抽出と知識グラフでした。

### WebKE: 知識トリプル抽出
**コードリポジトリ:** [redreamality/webke](https://github.com/redreamality/webke)  
**プログラミング言語:** Python | **スター:** 13 | **フォーク:** 3

事前学習されたマークアップ言語モデルを使用して、半構造化Webページから知識を抽出します。このプロジェクトは、CIKM 2021で発表された研究論文「WebKE: Knowledge Triple Extraction from Semi-structured Web with Pre-trained Markup Language Models」を実装しています。

**主な機能:**

- Webコンテンツ理解のための事前学習されたHTMLBERTモデル
- 半構造化Webページからの知識トリプル抽出
- 包括的な評価を備えた研究レベルの実装

### RERE: 関係抽出
**コードリポジトリ:** [redreamality/RERE-relation-extraction](https://github.com/redreamality/RERE-relation-extraction)  
**プログラミング言語:** Python | **スター:** 20 | **フォーク:** 4

論文「Revisiting the Negative Data of Distantly Supervised Relation Extraction」の実装。このプロジェクトは、遠隔監視関係抽出におけるノイズの多い負データの課題に対処します。

**主な機能:**

- 遠隔監視における負データを処理する新しいアプローチ
- 標準ベンチマークでの包括的な評価
- 研究再現可能なコードベース

### 集合損失関数 (cPU)
**コードリポジトリ:** [redreamality/cPU](https://github.com/redreamality/cPU)

機械学習最適化のための集合損失関数の研究実装。

## 🔧 開発ツールとユーティリティ

### PocketFlow
私は https://github.com/The-Pocket/PocketFlow の主要貢献者の一人であり、周辺のツールチェーンをいくつか作成しました。

#### 観測可能性
**コードリポジトリ:** [redreamality/pocketflow-tracing](https://github.com/redreamality/pocketflow-tracing)  
**プログラミング言語:** Python | **スター:** 1 | **フォーク:** 1

PocketFlowアプリケーションのトレースとデバッグツールで、ワークフロー実行とパフォーマンス監視の洞察を提供します。

**主な機能:**
- ワークフロー実行トレース
- パフォーマンス監視
- デバッグに優しい出力
- PocketFlowエコシステムとの統合

#### PocketFlow FastAPIテンプレート
**コードリポジトリ:** [redreamality/pocketflow-fastapi-template](https://github.com/redreamality/pocketflow-fastapi-template)  
**プログラミング言語:** Python | **スター:** 3

FastAPI、PocketFlow、pocketflow-tracingの統合を示す最小限の作業例。PocketFlowベースのアプリケーションを始めるのに最適です。

**主な機能:**
- FastAPI統合
- PocketFlowワークフローの例
- トレース統合
- 本番環境対応テンプレート

### Git LaTeX差分ツール
**コードリポジトリ:** [redreamality/git-latexdiff](https://github.com/redreamality/git-latexdiff)  
**プログラミング言語:** Batchfile | **スター:** 18 | **フォーク:** 5

LaTeXファイルの差分をプレビューバージョンと比較するツールで、学術論文やドキュメントの変更追跡を容易にします。

**主な機能:**
- LaTeX認識の差分比較
- ビジュアルプレビュー生成
- Git統合
- クロスプラットフォームサポート

## 📚 精選リストとリソース

### Awesome Manus
**コードリポジトリ:** [redreamality/awesome-manus](https://github.com/redreamality/awesome-manus)  
**プログラミング言語:** Markdown | **スター:** 1

Manus技術スタックに関連するオープンソースプロジェクトの精選リストで、マルチモーダルモデル、ワークフローオーケストレーション、マルチエージェントシステム、ツール統合をカバーしています。

**カバーカテゴリー:**
- マルチモーダルモデル（OpenFlamingo、LLaVA、IDEFICS）
- ワークフローオーケストレーション（Argo、Prefect、Airflow）
- マルチエージェントシステム（AutoGen、LangGraph、CrewAI）
- ツール統合（LangChain、LlamaIndex）
- モデルサービングフレームワーク（vLLM、TGI）

## 🌐 Webアプリケーション

### WiFiカードジェネレーター
**コードリポジトリ:** [redreamality/wificard](https://github.com/redreamality/wificard)  
**プログラミング言語:** TypeScript | **スター:** 7

WiFiネットワーク共有用のQRコードを生成するWebアプリケーション。WiFi接続カードを作成するためのシンプルでクリーンなインターフェース。

**主な機能:**
- WiFi認証情報のQRコード生成
- 複数のセキュリティプロトコルをサポート
- クリーンでレスポンシブなUI
- データ保存なし - プライバシー重視

### EPUBからテキストへの変換
**コードリポジトリ:** [redreamality/epub2txt](https://github.com/redreamality/epub2txt)  
**プログラミング言語:** Python

電子書籍変換用のシンプルなFastAPIサーバーで、EPUBからテキスト形式への変換をクリーンなAPIインターフェースでサポートします。

Pythonアプリケーションのデプロイツールと設定、元々はCoding.netプロジェクトからのものです。

## 🎤 プレゼンテーションとスライド

### マルチエージェントシステムスライド
**コードリポジトリ:** [redreamality/multi-agent-system-slides](https://github.com/redreamality/multi-agent-system-slides)  
**プログラミング言語:** Vue

マルチエージェントシステム（MAS）を紹介するインタラクティブなスライドで、最新のWeb技術を使用して構築され、魅力的なプレゼンテーションを提供します。

### GTプランナースライド
**コードリポジトリ:** [redreamality/gtplanner-slides](https://github.com/redreamality/gtplanner-slides)  
**プログラミング言語:** Vue

GTプランナープロジェクトのプレゼンテーションスライドで、計画アルゴリズムと方法論を紹介します。

## 🌟 注目プロジェクト

上記のプロジェクトは、多様な興味と専門分野を代表しています：

- **研究インパクト**: トップカンファレンス（CIKM）で論文を発表し、再現可能なコードを提供
- **実用ツール**: 開発者と研究者の実際の問題を解決するユーティリティ
- **コミュニティリソース**: コミュニティの他の人々を助けるための精選リストとテンプレート
- **教育コンテンツ**: 知識を共有するためのスライドとドキュメント

## 🤝 貢献

これらのプロジェクトのほとんどは貢献を歓迎します！あなたは：
- 問題やバグを報告できます
- 新機能を提案できます
- プルリクエストを送信できます
- ドキュメントを改善できます
- あなたの使用例を共有できます

## 📞 お問い合わせ

これらのプロジェクトに関するご質問がある場合は、お気軽に：
- 対応するGitHubリポジトリでissueを開く
- 私のウェブサイトを訪問：[redreamality.com](https://redreamality.com)
- 私のウェブサイトの連絡先情報から私に連絡する

---

*このページは、新しいプロジェクトがリリースされ、既存のプロジェクトが発展するにつれて定期的に更新されます。最終更新：2025年1月*
