---
title: 'AIエージェントをスキルとツールで構築する方法：2026年版完全初心者ガイド'
pubDate: 2026-01-15T10:00:00.000Z
description: '実用的なスキルとツールを使ってインテリジェントなAIエージェントを構築する方法を学びます。エージェントのスキル、ツールの統合、コンピューターの使用、ファイル操作、ClaudeとOpenAIを使用した実世界の例を網羅した、初心者に優しい完全なチュートリアルです。'
author: 'Remy'
tags: ['AI', 'agents', 'tutorial', 'beginner-guide', 'claude', 'openai', 'llm', 'automation']
lang: 'ja'
---

## AIエージェントのスキルとは？

AIエージェントのスキル（「ツール」や「関数」とも呼ばれます）は、言語モデルが現実世界と対話し、テキスト生成以上のアクションを実行できるようにする機能です。テキストで応答するだけでなく、スキルを備えたエージェントは以下のことができます：

- **コードを実行**して計算やデータ分析を行う
- **ファイルにアクセス**してドキュメントを読み取り、書き込み、管理する
- **ウェブを検索**してリアルタイムの情報を取得する
- **APIと対話**して外部サービスと統合する
- **コンピュータを制御**してデスクトップタスクを自動化する
- **データベースを管理**してデータを保存・取得する

2026年現在、Anthropic（Claude）、OpenAI（GPT）、Google（Gemini）などの主要AIプロバイダーは、様々なメカニズムを通じてエージェントスキルをサポートしています：

- **Claude**: コンピューターの使用、bashツール、テキストエディターツール
- **OpenAI**: 関数呼び出し、コードインタープリター、ファイル検索
- **オープンソース**: LangChainツール、AutoGPT、カスタム実装

## 2026年にエージェントスキルが重要な理由

### チャットボットからエージェントへの進化

従来のチャットボット（2022-2023年）：
- ✅ 事前学習された知識で質問に答える
- ✅ 人間のようなテキストを生成する
- ❌ 現在の情報にアクセスできない
- ❌ アクションを実行できない
- ❌ 会話的な応答に限定される

現代のAIエージェント（2024-2026年）：
- ✅ チャットボットができることすべて
- ✅ 実世界のタスクを実行する
- ✅ リアルタイムデータにアクセスする
- ✅ ツールやワークフローと統合する
- ✅ 最小限の監督で自律的に動作する

### 実世界への影響

以下の実用的なシナリオを考えてみましょう：

**エージェントスキル以前：**
- ユーザー：「このCSVファイルを分析してサマリーレポートを作成して」
- AI：「実際にはファイルを開けませんが、やり方はこうです...」

**エージェントスキル使用後：**
- ユーザー：「このCSVファイルを分析してサマリーレポートを作成して」
- AI：*ファイルを開き、データを読み取り、分析を実行し、チャートを生成し、PDFレポートを作成する*
- 結果：数秒で完全なレポートが届く

## コアコンセプト：AIエージェントとツールの理解

### エージェントループ

AIエージェントは継続的な意思決定ループに従います：

```
1. 知覚 → ユーザーのリクエストとコンテキストを理解する
2. 計画   → どのアクションを実行するか決定する
3. 実行   → 利用可能なツールを使用して実行する
4. 観察   → 結果を評価する
5. 繰り返し → タスクが完了するまで続ける
```

会話の例：
```
ユーザー：「最新のAIニュースを見つけて、サマリーをメールで送って」

エージェントの思考：
1. 知覚：ユーザーはニュースとメール配信を求めている
2. 計画：web_searchツールを使用し、次にメールツールを使用する必要がある
3. 実行：web_search("最新のAIニュース 2026")を実行
4. 観察：10件の関連記事を取得
5. 計画：記事を要約し、メールツールを使用する
6. 実行：サマリーを含むメールを送信
7. 完了：ユーザーに確認を通知
```

### スキル vs ツール vs 関数（用語）

AI業界ではこれらの用語が多少交換可能に使用されています：

| 用語 | 定義 | 例 |
|------|------------|---------|
| **ツール** | エージェントが呼び出せる機能 | `web_search`、`file_reader`、`calculator` |
| **関数** | ツールの実装（技術用語） | JavaScript関数、APIエンドポイント |
| **スキル** | 高レベルの機能（複数のツールを使用可能） | 「研究アシスタント」は検索 + 要約 + 執筆を使用 |
| **アクション** | ツールの単一呼び出し | `web_search("AI trends")`の呼び出し |

このガイドでは「ツール」と「スキル」を交換可能に使用します。

## 公式AIエージェントスキル：利用可能なもの

### Claudeの公式ツール（Anthropic）

2026年現在、Claudeは3つの強力な組み込みツールを提供しています：

#### 1. コンピューターの使用（`computer_20241022`）
Claudeが人間のようにコンピューターと対話できるようにします：
- マウスとキーボードを制御する
- スクリーンショットを撮り、UIを分析する
- アプリケーションをナビゲートする
- フォームを埋め、ボタンをクリックし、ウェブを閲覧する

**ユースケース：**
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

#### 2. Bashツール（`bash_20241022`）
安全な環境でbashコマンドを実行します：
- シェルスクリプトを実行する
- パッケージをインストールする
- CLIツールでファイルを処理する
- システム操作

**ユースケース：**
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

#### 3. テキストエディター（`text_editor_20241022`）
正確にファイルを作成・編集します：
- ファイルの内容を表示する
- 特定の行を編集する
- 新しいファイルを作成する
- 文字列の置換

**ユースケース：**
- コード編集
- 設定管理
- ドキュメント生成
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
          description: "都市名、例：サンフランシスコ"
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
    { role: "user", content: "東京の天気は？" }
  ],
  functions: functions,
  function_call: "auto"
});

// GPTが関数を呼び出したい場合、以下を返します：
// {
//   "name": "get_weather",
//   "arguments": "{\"location\": \"Tokyo\", \"unit\": \"celsius\"}"
// }

// 次に関数を実行し、結果をGPTに返します
```

### 人気のあるオープンソースツールフレームワーク

#### LangChainツール
LangChainは100以上のプリビルドツールを提供しています：

```python
from langchain.agents import load_tools, initialize_agent
from langchain.llms import OpenAI

llm = OpenAI(temperature=0)

# 組み込みツールをロードする
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

# エージェントを使用する
agent.run("東京の人口は？その数の10%を計算して。")
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
- その他90以上...

## スキル付きの最初のAIエージェントを構築する

実用的な研究アシスタントエージェントをステップバイステップで構築しましょう。

### 前提条件

1. **Python 3.8+**がインストールされていること
2. AnthropicまたはOpenAIの**APIキー**
3. **Pythonの基礎知識**
4. 必要なパッケージをインストールする：

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
    ウェブで情報を検索する。

    引数:
        query: 検索クエリ文字列
        num_results: 返す結果の数

    戻り値:
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

    引数:
        content: 保存するテキストコンテンツ
        filename: 作成するファイル名

    戻り値:
        ファイルパスを含む成功メッセージ
    """
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)
        return f"✅ {filename}にコンテンツを保存しました"
    except Exception as e:
        return f"❌ ファイル保存エラー: {str(e)}"

def calculate(expression: str) -> str:
    """
    数式を安全に評価する。

    引数:
        expression: "2 + 2"や"10 * 5"のような数式

    戻り値:
        計算の結果
    """
    try:
        # 安全なeval - 数字と基本演算子のみを許可
        allowed = set('0123456789+-*/(). ')
        if not all(c in allowed for c in expression):
            return "エラー：式に無効な文字が含まれています"

        result = eval(expression)
        return f"{expression} = {result}"
    except Exception as e:
        return f"エラー: {str(e)}"
```

### ステップ2：OpenAIでエージェントを作成する

```python
import openai
import json
from dotenv import load_dotenv

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

# 関数スキーマを定義する
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
        "description": "数学的計算を実行する",
        "parameters": {
            "type": "object",
            "properties": {
                "expression": {
                    "type": "string",
                    "description": "評価する数式"
                }
            },
            "required": ["expression"]
        }
    }
]

# 関数名を実際の関数にマッピングする
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
            "content": """ツールにアクセスできる役に立つ研究アシスタントです。
            ユーザーが情報を求めた場合、web_searchを使用して最新データを探します。
            情報を保存するよう求められた場合、save_to_fileを使用します。
            計算にはcalculateツールを使用します。

            常に何をしているか説明し、明確で役立つ応答を提供します。"""
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

        # 関数呼び出しなければ完了
        if not message.function_call:
            return message.content

        # 関数を実行する
        function_name = message.function_call.name
        function_args = json.loads(message.function_call.arguments)

        if function_name in available_functions:
            function_result = available_functions[function_name](**function_args)

            # 結果をメッセージ履歴に追加
            messages.append({
                "role": "assistant",
                "content": None,
                "function_call": message.function_call
            })
            messages.append({
                "role": "function",
                "name": function_name,
                "content": str(function_result)
            })
        else:
            return f"エラー: 不明な関数 '{function_name}'"

    return "申し訳ありませんが、最大回数に達しました。後でもう一度お試しください。"

# 使用例
if __name__ == "__main__":
    result = run_agent("最新のAI技術動向を検索して、結果をai_news.txtに保存してください")
    print(result)
```

## エージェントツールの高度な機能

### マルチステップ推論

エージェントは複数のツールを連携して複雑なタスクを解決できます：

```python
# 複雑なタスク例
result = run_agent("""
以下のことをしてください：
1. 東京の天気を検索する
2. 気温が25度以上なら「外出に適しています」、そうでなければ「暖かい服を着てください」と表示する
3. この情報をweather_advice.txtに保存する
""")
```

エージェントは以下のように推論します：
1. `web_search`で天気APIを検索
2. `calculate`で気温を評価
3. `save_to_file`でアドバイスを保存

### エラーハンドリングとリトライ

堅牢なエージェントは失敗から回復できます：

```python
def run_agent_with_retry(user_message: str, max_retries: int = 3) -> str:
    """
    リトライ機能付きのエージェント。
    """
    for attempt in range(max_retries):
        try:
            return run_agent(user_message)
        except Exception as e:
            if attempt < max_retries - 1:
                print(f"エラーが発生しました。再試行します ({attempt + 1}/{max_retries}): {e}")
                time.sleep(1)
            else:
                return f"エラー: {str(e)}"
```

### ツールチェーンの最適化

ツールの出力を他のツールの入力として使用できます：

```python
# ツールチェーンの例
# Step 1: ニュースを検索
search_results = web_search("AI agent tools 2026")

# Step 2: 結果を要約（別のLLM関数）
summary = summarize_text(str(search_results))

# Step 3: 要約を保存
saved = save_to_file(summary, "ai_tools_summary.txt")

print(saved)
```

## 実世界のエージェントアプリケーション

### 1. 自動化データレポーティング

```python
def generate_report(company_name: str) -> str:
    """
    企業のデータレポートを自動生成する。
    """
    # ステップ1: 株価を検索
    stock_data = web_search(f"{company_name} stock price")

    # ステップ2: 最新ニュースを検索
    news = web_search(f"{company_name} latest news")

    # ステップ3: データを分析
    analysis = analyze_data(stock_data, news)

    # ステップ4: レポートを生成して保存
    report = create_report(company_name, analysis)
    save_to_file(report, f"{company_name}_report.pdf")

    return f"✅ {company_name}のレポートを生成しました"
```

### 2. 顧客サービスオートメーション

```python
def customer_service_ticket(ticket: dict) -> str:
    """
    カスタマーサービスチケットを処理する。
    """
    # 顧客情報を検索
    customer_info = search_database(ticket['customer_id'])

    # 類似の過去のチケットを検索
    similar_tickets = web_search(f"support issue {ticket['category']}")

    # 解決策を提案
    solution = propose_solution(customer_info, similar_tickets, ticket)

    # レスポンスを保存
    save_to_file(solution, f"ticket_{ticket['id']}_response.txt")

    return solution
```

### 3. リサーチアシスタント

```python
def research_topic(topic: str, depth: int = 3) -> str:
    """
    トピックについて深くリサーチする。
    """
    sources = []
    for i in range(depth):
        # 複数の検索クエリを使用
        queries = [
            f"{topic} overview",
            f"{topic} recent developments",
            f"{topic} challenges and solutions"
        ]

        for query in queries:
            results = web_search(query)
            sources.extend(results)

    # ソースを要約して統合
    report = synthesize_report(sources, topic)

    # レポートを保存
    save_to_file(report, f"{topic}_research_report.md")

    return report
```

## エージェントのパフォーマンス最適化

### プロンプトエンジニアリング

エージェントをより効果的にするためのヒント：

```python
system_prompt = """
あなたは効率的な研究アシスタントです。

ツール使用のベストプラクティス：
1. 常に最も具体的な検索クエリを使用する
2. 必要なツールのみを使用する（過剰使用を避ける）
3. 中間結果を説明する
4. エラーが発生した場合、代替案を提案する

応答スタイル：
- 簡潔かつ明確に
- 行動を説明する
- 要約を提供する
"""
```

### ツール選択の最適化

```python
# ツール使用ガイドラインを提供
tools_guidance = """
ツール選択ガイド：
- web_search: 最新情報、事実、データを探す
- save_to_file: 結果、レポート、要約を保存する
- calculate: 数値計算、統計分析を行う
- 他のツール: [カスタムツールの説明]
"""
```

### レスポンスのキャッシュ

```python
from functools import lru_cache

@lru_cache(maxsize=100)
def cached_web_search(query: str) -> list:
    """キャッシュ付きのウェブ検索"""
    return web_search(query)
```

## セキュリティとベストプラクティス

### 入力のサニタイズ

```python
import re

def sanitize_filename(filename: str) -> str:
    """
    ファイル名を安全にする。
    """
    # 危険な文字を削除
    filename = re.sub(r'[<>:"/\\|?*]', '', filename)
    # パス巡回を防止
    filename = os.path.basename(filename)
    return filename
```

### 権限の制限

```python
def safe_execute(command: str) -> str:
    """
    安全なコマンド実行。
    """
    # 許可されたコマンドのみ
    ALLOWED_COMMANDS = ['ls', 'pwd', 'cat', 'grep']

    if command.split()[0] in ALLOWED_COMMANDS:
        return execute_bash(command)
    else:
        return "エラー: 許可されていないコマンドです"
```

### APIキーの管理

```python
from dotenv import load_dotenv
import os

load_dotenv()

# 環境変数からAPIキーを取得
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# ハードコードしない
# ❌ API_KEY = "sk-..."  # 危険！
```

## エージェントのテストとデバッグ

### ユニットテスト

```python
import unittest

class TestAgentTools(unittest.TestCase):
    def test_calculate(self):
        result = calculate("2 + 2")
        self.assertIn("4", result)

    def test_calculate_invalid(self):
        result = calculate("abc")
        self.assertIn("エラー", result)

    def test_web_search(self):
        results = web_search("Python programming")
        self.assertIsInstance(results, list)
        self.assertGreater(len(results), 0)

if __name__ == '__main__':
    unittest.main()
```

### ログ記録

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger('Agent')

def run_agent_logged(user_message: str) -> str:
    """ロギング付きのエージェント。"""
    logger.info(f"User request: {user_message}")

    try:
        result = run_agent(user_message)
        logger.info(f"Agent response: {result}")
        return result
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        raise
```

### デバッグモード

```python
DEBUG = True

def debug_run_agent(user_message: str) -> str:
    """
    デバッグモード付きのエージェント。
    """
    if DEBUG:
        print(f"\n=== デバッグ情報 ===")
        print(f"ユーザーメッセージ: {user_message}")

    # エージェントを実行
    result = run_agent(user_message)

    if DEBUG:
        print(f"エージェントレスポンス: {result}")
        print(f"====================\n")

    return result
```

## エージェントのデプロイメント

### Web APIとしてデプロイ

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

class AgentRequest(BaseModel):
    message: str

@app.post("/agent")
async def run_agent_endpoint(request: AgentRequest):
    """
    エージェントWeb APIエンドポイント。
    """
    try:
        result = run_agent(request.message)
        return {"response": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 実行: uvicorn agent_api:app --reload
```

### Dockerコンテナ化

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "main.py"]
```

### スケーラビリティの考慮

```python
# 非同期実装
import asyncio
import aiohttp

async def async_web_search(query: str) -> list:
    """
    非同期ウェブ検索。
    """
    async with aiohttp.ClientSession() as session:
        async with session.get(
            f"https://html.duckduckgo.com/html/?q={query}",
            headers={"User-Agent": "Mozilla/5.0"}
        ) as response:
            return await response.text()

# 複数の検索を並列実行
async def parallel_search(queries: list) -> list:
    """
    複数の検索を並列実行。
    """
    tasks = [async_web_search(q) for q in queries]
    return await asyncio.gather(*tasks)
```

## 将来のトレンドと展望

### マルチモーダルエージェント

2026年以降、エージェントは以下のようなマルチモーダル能力を持つようになります：
- **画像理解**: 写真や図表を分析
- **音声処理**: 音声コマンドと応答
- **ビデオ分析**: 動画コンテンツを理解

### 協調エージェントシステム

```python
# 複数のエージェントが協力
class MultiAgentSystem:
    def __init__(self):
        self.researcher = ResearchAgent()
        self.analyst = AnalystAgent()
        self.writer = WriterAgent()

    def complete_task(self, task: str):
        # リサーチエージェントが情報を収集
        data = self.researcher.search(task)

        # アナリストエージェントがデータを分析
        insights = self.analyst.analyze(data)

        # ライターエージェントがレポートを作成
        report = self.writer.write(insights)

        return report
```

### 学習と適応

```python
# エージェントの学習機能
class LearningAgent:
    def __init__(self):
        self.success_patterns = {}
        self.failure_patterns = {}

    def learn_from_feedback(self, action: str, feedback: str):
        """
        フィードバックから学習する。
        """
        if feedback == "positive":
            self.success_patterns.setdefault(action, 0)
            self.success_patterns[action] += 1
        else:
            self.failure_patterns.setdefault(action, 0)
            self.failure_patterns[action] += 1
```

## 結論

AIエージェントとスキルは、言語モデルの能力を大きく拡張します。このガイドで学んだこと：

✅ **エージェントスキルの基本概念**: ツール、スキル、関数、アクション
✅ **主要なプロバイダー**: Claude、OpenAI、LangChainのツール
✅ **エージェント構築**: ステップバイステップの実用的なガイド
✅ **高度な機能**: マルチステップ推論、エラーハンドリング、ツールチェーン
✅ **実世界の応用**: データレポーティング、カスタマーサービス、リサーチ
✅ **ベストプラクティス**: セキュリティ、テスト、デプロイメント

### 次のステップ

1. **実践**: 独自のエージェントを作成する
2. **拡張**: カスタムツールを追加する
3. **最適化**: パフォーマンスと効率を改善する
4. **共有**: コミュニティと成果を共有する

### リソース

- [Anthropic Documentation](https://docs.anthropic.com/)
- [OpenAI API Reference](https://platform.openai.com/docs/)
- [LangChain Documentation](https://python.langchain.com/)
- [AI Agents Community](https://github.com/topics/ai-agents)

2026年のAIエージェントの世界へようこそ。素晴らしいエージェントを構築しましょう！🚀
