---
title: 'AIエージェントのスキルとツールで構築する方法：2026年初心者向け完全ガイド'
pubDate: 2026-01-15T10:00:00.000Z
description: 'スキルとツールを使ってインテリジェントなAIエージェントを構築する方法を学ぶ。エージェントスキル、ツール統合、コンピューター使用、ファイル操作、ClaudeとOpenAIを使った実例を網羅した初心者向けチュートリアル。'
author: 'Remy'
tags: ['AI', 'エージェント', 'チュートリアル', '初心者ガイド', 'claude', 'openai', 'llm', '自動化']
lang: 'ja'
---

AIエージェントスキル（「ツール」または「機能」とも呼ばれる）は、言語モデルがテキスト生成以外の方法で実世界と対話し、行動を実行する能力を可能にします。単にテキストで応答するのではなく、スキルを備えたエージェントは以下ができます：

- **コードを実行**して計算やデータ分析を実行する
- **ファイルにアクセス**して文書の読み取り、書き込み、管理を行う
- **ウェブを検索**してリアルタイム情報を取得する
- **APIと対話**して外部サービスと統合する
- **コンピューターを制御**してデスクトップタスクを自動化する
- **データベースを管理**してデータを格納・取得する

2026年には、Anthropic（Claude）、OpenAI（GPT）、Google（Gemini）などの主要なAIプロバイダーが、さまざまな仕組みを通じてエージェントスキルをサポートしています：

- **Claude**: コンピューター使用、bashツール、テキストエディターツール
- **OpenAI**: 関数呼び出し、コードインタープリター、ファイル検索
- **オープンソース**: LangChainツール、AutoGPT、カスタム実装

## 2026年におけるエージェントスキルの重要性

### チャットボットからエージェントへの進化

従来のチャットボット（2022-2023年）：
- ✅ 事前学習済み知識で質問に答える
- ✅ 人間のようなテキストを生成する
- ❌ 最新情報にアクセスできない
- ❌ 行動を実行できない
- ❌ 会話応答に限定される

現代のAIエージェント（2024-2026年）：
- ✅ チャットボットができることは全て
- ✅ 実世界のタスクを実行する
- ✅ リアルタイムデータにアクセスする
- ✅ ツールやワークフローと統合する
- ✅ 最小限の監督で自律的に動作する

### 実世界への影響

以下の実践的なシナリオを考えてみましょう：

**エージェントスキルがない場合：**
- ユーザー: "このCSVファイルを分析してサマリーレポートを作成してください"
- AI: "実際にはファイルを開くことはできませんが、以下のように実行できます..."

**エージェントスキルがある場合：**
- ユーザー: "このCSVファイルを分析してサマリーレポートを作成してください"
- AI: *ファイルを開く、データを読み取る、分析を実行する、チャートを作成する、PDFレポートを作成する*
- 結果: 完了したレポートが数秒で配信される

## コアコンセプト：AIエージェントとツールを理解する

### エージェントループ

AIエージェントは継続的な意思決定ループに従います：

```
1. 認識 → ユーザーのリクエストとコンテキストを理解する
2. 計画 → どの行動を取るかを決定する
3. 実行 → 利用可能なツールを使って実行する
4. 観察 → 結果を評価する
5. 繰り返す → タスクが完了するまで続ける
```

会話の例：
```
ユーザー: "最新のAIニュースを検索して、サマリーをメールで送ってください"

エージェントの思考：
1. 認識: ユーザーはニュースとメール配信を希望している
2. 計画: web_searchツールを使用する必要がある、次にemailツールを使用する
3. 実行: web_search("最新AIニュース 2026")を実行する
4. 観察: 10件の関連記事を取得した
5. 計画: 記事を要約し、次にemailツールを使用する
6. 実行: サマリー付きでメールを送信する
7. 完了: ユーザーに確認する
```

### スキル vs ツール vs 関数（専門用語）

AI業界ではこれらの用語をある程度互換的に使用します：

| 用語 | 定義 | 例 |
|------|------|---------|
| **ツール** | エージェントが呼び出せる機能 | `web_search`, `file_reader`, `calculator` |
| **関数** | ツールの実装（技術用語） | JavaScript関数、APIエンドポイント |
| **スキル** | 高レベルの機能（複数のツールを使用する可能性あり） | "リサーチアシスタント"は検索+要約+書き込みを使用 |
| **アクション** | ツールの単一呼び出し | `web_search("AI trends")`を呼び出す |

このガイドでは、「ツール」と「スキル」を互換的に使用します。

## 公式AIエージェントスキル：利用可能なもの

### Claudeの公式ツール（Anthropic）

2026年の時点で、Claudeは3つの強力な組み込みツールを提供します：

#### 1. コンピューター使用 (`computer_20241022`)
Claudeが人間のようにコンピューターと対話できるようにします：
- マウスとキーボードを制御する
- スクリーンショットを取得し、UIを分析する
- アプリケーション間をナビゲートする
- フォームに入力し、ボタンをクリックし、ウェブを閲覧する

**使用例：**
- 自動テスト
- ウェブスクレイピング
- デスクトップ自動化
- UIインタラクション

**例：**
```python
import anthropic

client = anthropic.Anthropic(api_key="your-api-key")

response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=1024,
    tools=[
        {
            "type": "computer_20241022",
            "name": "computer",
            "display_width_px": 1920,
            "display_height_px": 1080,
        }
    ],
    messages=[
        {
            "role": "user",
            "content": "ブラウザを開いて最新のAIニュースを検索してください"
        }
    ]
)
```

#### 2. Bashツール (`bash_20241022`)
セキュリティ保護された環境でbashコマンドを実行する：
- シェルスクリプトを実行する
- パッケージをインストールする
- CLIツールでファイルを処理する
- システム操作を行う

**使用例：**
- DevOps自動化
- ファイル処理
- データ変換
- システム管理

**例：**
```python
response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=1024,
    tools=[
        {
            "type": "bash_20241022",
            "name": "bash",
        }
    ],
    messages=[
        {
            "role": "user",
            "content": "現在のディレクトリのすべてのPythonファイルを一覧表示し、コード行数をカウントしてください"
        }
    ]
)
```

#### 3. テキストエディター (`text_editor_20241022`)
ファイルを正確に作成・編集する：
- ファイル内容を表示する
- 特定の行を編集する
- 新しいファイルを作成する
- 文字列置換を行う

**使用例：**
- コード編集
- 設定管理
- 文書生成
- 自動リファクタリング

**例：**
```python
response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=1024,
    tools=[
        {
            "type": "text_editor_20241022",
            "name": "str_replace_editor",
        }
    ],
    messages=[
        {
            "role": "user",
            "content": "APIから天気データを取得するPythonスクリプトを作成してください"
        }
    ]
)
```

### OpenAIの関数呼び出し

OpenAIのGPTモデルはカスタム関数呼び出しをサポートしています：

```javascript
const functions = [
  {
    name: "get_weather",
    description: "場所の現在の天気を取得する",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "都市名、例：San Francisco"
        },
        unit: {
          type: "string",
          enum: ["celsius", "fahrenheit"]
        }
      },
      required: ["location"]
    }
  }
];

const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    { role: "user", content: "東京の天気はどうですか？" }
  ],
  functions: functions,
  function_call: "auto"
});

// GPTが関数を呼び出したい場合、以下を返す：
// {
//   "name": "get_weather",
//   "arguments": "{\"location\": \"Tokyo\", \"unit\": \"celsius\"}"
// }

// 次に関数を実行し、結果をGPTに返す
```

### 人気のオープンソースツールフレームワーク

#### LangChainツール
LangChainは100以上の事前構築済みツールを提供します：

```python
from langchain.agents import load_tools, initialize_agent
from langchain.llms import OpenAI

llm = OpenAI(temperature=0)

# 組み込みツールをロード
tools = load_tools(
    ["wikipedia", "llm-math", "python_repl"],
    llm=llm
)

agent = initialize_agent(
    tools,
    llm,
    agent="zero-shot-react-description",
    verbose=True
)

# エージェントを使用
agent.run("東京の人口は？その数値の10%を計算してください。")
```

**利用可能なLangChainツール：**
- Wikipedia検索
- Google検索
- WolframAlpha
- Python REPL
- シェルコマンド
- SQLデータベース
- HTTPリクエスト
- ファイル操作
- および90以上のその他のツール...

## 実用的なスキルで初めてのAIエージェントを構築する

実践的なリサーチアシスタントエージェントをステップバイステップで構築しましょう。

### 前提条件

1. **Python 3.8+** がインストールされている
2. AnthropicまたはOpenAIからの**APIキー**
3. **基本的なPython知識**
4. 必要なパッケージをインストール：

```bash
pip install anthropic openai python-dotenv requests beautifulsoup4
```

### ステップ1：ツールを定義する

まず、エージェント用のカスタムツールを作成します：

```python
import os
import requests
from bs4 import BeautifulSoup
from datetime import datetime

def web_search(query: str, num_results: int = 5) -> list:
    """
    情報を検索するためのウェブ検索。
    
    引数：
        query: 検索クエリ文字列
        num_results: 返す結果の数
    
    戻り値：
        タイトル、URL、スニペットを含む検索結果のリスト
    """
    # 検索APIを使用（DuckDuckGoの例）
    try:
        url = f"https://html.duckduckgo.com/html/?q={query}"
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        results = []
        for result in soup.find_all('div', class_='result')[:num_results]:
            title = result.find('a', class_='result__a')
            snippet = result.find('a', class_='result__snippet')
            
            if title and snippet:
                results.append({
                    'title': title.text,
                    'url': title['href'],
                    'snippet': snippet.text
                })
        
        return results
    except Exception as e:
        return [{"error": str(e)}]

def save_to_file(content: str, filename: str) -> str:
    """
    コンテンツをファイルに保存する。
    
    引数：
        content: 保存するテキストコンテンツ
        filename: 作成するファイル名
    
    戻り値：
        ファイルパス付きの成功メッセージ
    """
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)
        return f"✅ コンテンツを{filename}に保存しました"
    except Exception as e:
        return f"❌ ファイル保存エラー: {str(e)}"

def calculate(expression: str) -> str:
    """
    数学的な式を安全に評価する。
    
    引数：
        expression: "2 + 2" や "10 * 5" のような数式
    
    戻り値：
        計算の結果
    """
    try:
        # 安全なeval - 数字と基本演算子のみ許可
        allowed = set('0123456789+-*/(). ')
        if not all(c in allowed for c in expression):
            return "エラー: 式に無効な文字が含まれています"
        
        result = eval(expression)
        return f"{expression} = {result}"
    except Exception as e:
        return f"エラー: {str(e)}"
```

### ステップ2：OpenAIを使ってエージェントを作成する

```python
import openai
import json
from dotenv import load_dotenv

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

## 関数スキーマを定義
functions = [
    {
        "name": "web_search",
        "description": "トピックに関する最新情報をウェブで検索する",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "検索クエリ"
                },
                "num_results": {
                    "type": "integer",
                    "description": "返す結果の数（デフォルト5）"
                }
            },
            "required": ["query"]
        }
    },
    {
        "name": "save_to_file",
        "description": "テキストコンテンツをファイルに保存する",
        "parameters": {
            "type": "object",
            "properties": {
                "content": {
                    "type": "string",
                    "description": "保存するコンテンツ"
                },
                "filename": {
                    "type": "string",
                    "description": "作成するファイル名"
                }
            },
            "required": ["content", "filename"]
        }
    },
    {
        "name": "calculate",
        "description": "数学的な計算を実行する",
        "parameters": {
            "type": "object",
            "properties": {
                "expression": {
                    "type": "string",
                    "description": "評価する数学的式"
                }
            },
            "required": ["expression"]
        }
    }
]

## 関数名を実際の関数にマッピング
available_functions = {
    "web_search": web_search,
    "save_to_file": save_to_file,
    "calculate": calculate
}

def run_agent(user_message: str) -> str:
    """
    ツールサポート付きでエージェントを実行する。
    """
    messages = [
        {
            "role": "system",
            "content": """あなたはツールへのアクセス権を持つ便利なリサーチアシスタントです。
            ユーザーが情報を求める場合、web_searchを使用して最新データを検索します。
            情報を保存するように求められた場合、save_to_fileを使用します。
            計算の場合はcalculateツールを使用します。
            
            常に何をしているかを説明し、明確で役立つ返答を提供してください。"""
        },
        {
            "role": "user",
            "content": user_message
        }
    ]
    
    # エージェントループ - 最大5回のツール呼び出しを許可
    for _ in range(5):
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=messages,
            functions=functions,
            function_call="auto"
        )
        
        message = response.choices[0].message
        
        # 関数呼び出しがなければ完了
        if not message.function_call:
            return message.content
        
        # 関数を実行
        function_name = message.function_call.name
        function_args = json.loads(message.function_call.arguments)
