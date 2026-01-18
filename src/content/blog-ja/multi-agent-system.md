---
title: 'マルチエージェントシステム'
pubDate: 2025-02-09T00:00:00.000Z
description: 'マルチエージェントシステム調査レポート'
author: 'Remy'
tags: ['マルチエージェントシステム', '人工知能', 'DeepSeek', '制約充足問題']
lang: 'ja'
translatedFrom: 'multi-agent-system'
---
## 1. マルチエージェントシステム概要
- 定義：エージェントとは何か？
- 概念の明確化：ワークフローと（マルチ）エージェントシステムの違いと関連性

## 2. マルチエージェントシステムの設計パターン

### 2.1 基礎内容：ワークフローからエージェントへ
- ワークフロー vs エージェントアーキテクチャの区別と選択方法
- シンプルから複雑へ：段階的な構築方法論

### 2.2 マルチエージェントの主要構成要素

- エージェント（Agents）：LLM が自身のプロセスとツール使用を動的に誘導できるシステムで、タスクの完了方法を自律的に制御できます。

- 環境（Environment）：エージェントが存在する外部世界。エージェントは環境を感知し、作用することができます。環境はソフトウェアの世界であることもあれば、工場、道路、電力網などの物理空間であることもあります。

- 相互作用（Interactions）：エージェント間は標準的な通信言語を通じてコミュニケーションします。システムのニーズに応じて、エージェント間の相互作用には協力、調整、交渉など多様な形式があります。

- 組織（Organization）：エージェントは階層的制御方式で組織することもでき、創発行動に基づいて自己組織化することもできます。

## 3. 主要モジュール
### 3.1 基本構成要素

* **マルチエージェントシステム構造**：

  * **Equi-Level Structure**：同一レベルで動作するエージェントシステムを研究。例：DMAS（Chen et al., 2023）。

  * **Hierarchical Structure**：リーダーとフォロワーの役割を持つ階層構造を探究。例：Stackelberg ゲーム（Von Stackelberg, 2010; Conitzer & Sandholm, 2006; Harris et al., 2023）。

  * **Nested Structure**：ネスト構造または混合構造を研究。例：（Chan et al., 2023）。

  * **Dynamic Structure**：マルチエージェントシステムの動的構造を議論。例：（Talebirad & Nadiri, 2023）。

* **計画（Planning）**：

  * **Global Planning**：全体的なタスクの理解とサブタスクへの分解、およびエージェント間のワークフロー調整を含みます。

  * **Single-Agent Task Decomposition**：単一エージェントでは、タスク分解は大きなタスクを一連の管理可能な小さなタスクに分解することを含みます。

* **メモリ/コンテキスト管理（Memory Management）**：

  * **Short-term Memory**：会話や相互作用中に使用される即時的で短期的なメモリ。

  * **Long-term Memory**：履歴の会話と応答を保存するメモリ。

  * **External Data Storage**：RAG（Lewis et al., 2020）など、補足情報源として使用。

  * **Episodic Memory**：マルチエージェントシステムにおける一連の相互作用のメモリ。

  * **Consensus Memory**：マルチエージェントシステムで共有情報の統一ソースとして機能。

【cite】LLM Multi-Agent Systems: Challenges and Open Problems

### 3.2 基盤フレームワーク選択
- フレームワーク選択の主要考慮事項：いつ使用し、いつ回避するか
- 既存の汎用フレームワーク紹介：langgraph、autogen、swarm
- 選定推奨事項

### 3.3 マルチエージェントアプリケーションのインタラクション設計
- インタラクション設計原則：
  - タスク優先：マルチエージェントアプリケーションは各タスクに最適なインタラクションインターフェースをカスタマイズすべきで、業務フロー設計に適合し、チャットウィンドウで全てを賄うのではない。
  - 詳細の隠蔽：ユーザーはエージェント内部の実装詳細を知る必要はなく、エージェントの外部動作とインタラクション方法のみ理解すればよい
  - インタラクションの簡潔性：ユーザーとエージェント間のインタラクションは可能な限り簡潔で、複雑な操作フローを避けるべき
  - 十分なフィードバック：エージェントの動作と意思決定プロセスには明確なフィードバックが必要
  - 制御可能性：ユーザーはエージェントの動作に介入し調整できるべき

- 典型的な製品ケース分析：
  - マルチエージェントアプリケーション（コード開発）：cline、devin、cursor agent
  - マルチエージェントアプリケーション（執筆）：deep researcher
  - マルチエージェント構築プラットフォーム：coze、langgraph studio

### 3.4 効果評価方法、データセット、指標
- ベンチマークテスト
  - 公開ベンチマーク
    - ToolBench: GitHub - OpenBMB/ToolBench: [ICLR'24 spotlight] オープンプラットフォーム
      大規模ツール呼び出し指示データセット、マルチステップ推論と実 API 統合をサポート
    - SWE-bench: https://github.com/princeton-nlp/SWE-bench
      LLM が GitHub 問題を解決する能力を評価するベンチマーク、2,294 個の Python コード修正タスクを含む
    - Mind2Web: https://huggingface.co/datasets/osunlp/Mind2Web
      汎用ウェブインタラクションデータセット、多様な DOM 操作とユーザートラジェクトリをカバー
    - WebArena: GitHub - web-arena-x/webarena: Code repo for "WebArena: A Realistic Web Environment for Building Aut
      実ウェブ環境テストプラットフォーム、4 つのアプリケーションとツールライブラリを統合
    - AgentInstruct: https://huggingface.co/datasets/THUDM/AgentInstruct
      高品質エージェント指示データセット、モデルのタスク汎化能力を強化

- 評価指標
  - パフォーマンス指標
    - タスク解決率（% Resolved）
      - コア効能指標、システムの問題解決能力を反映

    - 位置特定精度（F1 Score）
      - コード欠陥位置特定の精度とリコールのバランス

    - ビジュアル必要性の影響（Visual Necessity Impact）
      - 画像入力によるタスク解決率の向上幅

    - 画像タイプ感度（Image Type Sensitivity）
      - 異なるタイプの画像（コードスクリーンショット/UI 図/チャート）への適応性

    - コード修正複雑度（Patch Complexity）
      - 参照解決策の修正規模（ファイル数/行数/関数数）

    - タスク難易度分布（Task Difficulty Distribution）
      - 異なる所要時間タスクの割合（簡単/中程度/困難/極めて困難）
      
    - タスク成功率
      - 参考：https://www.restack.io/p/multi-agent-systems-answer-llm-evaluation-cat-ai
      - この指標はエージェントが成功裏に完了したタスクの割合を測定し、全体的な効率を直接示します。
      - **公式**：
        $$ \text{Task Success Rate} = \frac{\text{成功完了タスク数}}{\text{総タスク数}} \times 100\% $$
        
    - 協力効率
      - 参考：https://www.restack.io/p/multi-agent-systems-answer-llm-evaluation-cat-ai
      - 複数のエージェントが共通目標達成のためにどれだけ効果的に協力するかを評価
      
    - タスク割り当て精度（Task Allocation Accuracy）
      - 参考：https://www.restack.io/p/multi-agent-systems-answer-llm-evaluation-cat-ai
      - タスクが最も適切なエージェントに割り当てられているか
      - **公式**：
        $$ \text{Task Allocation Accuracy} = \frac{\text{正しく割り当てられたタスク数}}{\text{総タスク数}} \times 100\% $$
        
    - タスク完了正確率（Task Completion Accuracy）
      - 参考：https://www.restack.io/p/multi-agent-systems-answer-llm-evaluation-cat-ai
      - 出力結果の正確性
      - **公式**：
        $$ \text{Task Completion Accuracy} = \frac{\text{正しい結果の出力数}}{\text{総完了タスク数}} \times 100\% $$
        
    - 出力一貫性（Output Coherence）
      - 参考：https://www.restack.io/p/multi-agent-systems-answer-llm-evaluation-cat-ai
      - 生成コンテンツの論理的一貫性
      
    - 進捗率（Progress Rate）
      - 参考：AgentBoard https://arxiv.org/pdf/2401.13178
      - サブゴールマッチングまたは状態類似度計算による連続指標、タスク完了プロセスにおける漸進的進展を反映（0 から 1）
      - **公式**：
        - **連続タスク**（状態マッチングなど）：
          $$ r_t^{\text{match}} = \max_{0 \leq i \leq t} f(s_i, g) $$
          ここで、$f(s_i, g)$ は現在の状態 $s_i$ と目標状態 $g$ の類似度関数（例：テーブルセルマッチング割合）。

        - **離散サブゴールタスク**（マルチステップ計画など）：
          $$ r_t^{\text{subgoal}} = \max_{0 \leq i \leq t} \frac{1}{K} \sum_{k=1}^K f(s_i, g_k) $$
          ここで、$g_k$ は人間がアノテーションした第 $k$ 番目のサブゴール、$f(s_i, g_k) \in \{0,1\}$ はサブゴール完了を表す。
          
  - 効率指標
    - 平均コスト（$ Avg. Cost）
      - 単一タスク推論の経済コスト
    - 異常終了率（Abnormal Termination Rate）
      - コスト超過またはエラーによるタスク中断の割合（リソース浪費を反映）
    - 通信遅延（Communication Latency）：エージェント応答時間（ミリ秒）
    - タスク完了時間（Task Completion Time）
    
  - スケーラビリティ指標
    - クロスファイルタイプ修正（Multi-file Type Editing）
      - 複数のファイルタイプ（TS/HTML/CSS）を同時に修正するタスクの割合

    - 言語適応性比較
      - Python 中心システムの JavaScript タスクにおける解決率低下

  - 信頼性指標
    - テスト一貫性（Test Consistency）
      - 同じパッチの複数回実行における合格の一貫性

    - エラー回復能力
      - タスク終了後の自動リトライまたはロールバックメカニズムの有効性

## 4. アプリケーション領域

### 4.1 マルチエージェントの特徴と適用シナリオ
- マルチエージェントの特徴：非リアルタイム性、非決定性
- マルチエージェントに適したシナリオ：オフライン操作、エラー許容、ユーザーの許容度が高く介入を厭わない
- いつ（およびいつ使わないか）マルチエージェントシステムを使用するか

### 4.2 銀行シナリオにおけるマルチエージェントの典型的応用
- カスタマーサービスロボット：ナレッジ運用からインテリジェントカスタマーサービスへ
- インテリジェント執筆：シンプルなコピー、調査レポート形式、マーケティングコピー形式
- インテリジェントマーケティング：顧客プロファイルから精密マーケティングへ

## 5. 参考文献

![Prompt-To-Agent: コードのためのカスタムエンジニアリングエージェントを作成](/assets/multi-agent-system/image.png)
