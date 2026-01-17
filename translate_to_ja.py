#!/usr/bin/env python3
import os
import json
import re

# Translation mappings
translations = {
    # Frontmatter keys
    "title": "title",
    "pubDate": "pubDate",
    "description": "description",
    "author": "author",
    "tags": "tags",
    "lang": "lang",

    # Common terms
    "How to Build AI Agents with Skills and Tools: Complete 2026 Beginner Guide":
        "AIエージェントをスキルとツールで構築する方法：2026年版完全初心者ガイド",
    "Learn how to build intelligent AI agents with practical skills and tools. Complete beginner-friendly tutorial covering agent skills, tool integration, computer use, file operations, and real-world examples using Claude and OpenAI.":
        "実用的なスキルとツールを使ってインテリジェントなAIエージェントを構築する方法を学びます。エージェントのスキル、ツールの統合、コンピューターの使用、ファイル操作、ClaudeとOpenAIを使用した実世界の例を網羅した、初心者に優しい完全なチュートリアルです。",

    "What Are AI Agent Skills?":
        "AIエージェントのスキルとは？",
    "AI agent skills (also called \"tools\" or \"functions\") are capabilities that enable language models to interact with the real world and perform actions beyond text generation. Instead of just responding with text, agents equipped with skills can:":
        "AIエージェントのスキル（「ツール」や「関数」とも呼ばれます）は、言語モデルが現実世界と対話し、テキスト生成以上のアクションを実行できるようにする機能です。テキストで応答するだけでなく、スキルを備えたエージェントは以下のことができます：",

    "- **Execute code** to perform calculations or data analysis":
        "- **コードを実行**して計算やデータ分析を行う",
    "- **Access files** to read, write, and manage documents":
        "- **ファイルにアクセス**してドキュメントを読み取り、書き込み、管理する",
    "- **Search the web** for real-time information":
        "- **ウェブを検索**してリアルタイムの情報を取得する",
    "- **Interact with APIs** to integrate with external services":
        "- **APIと対話**して外部サービスと統合する",
    "- **Control computers** to automate desktop tasks":
        "- **コンピュータを制御**してデスクトップタスクを自動化する",
    "- **Manage databases** to store and retrieve data":
        "- **データベースを管理**してデータを保存・取得する",

    "In 2026, major AI providers like Anthropic (Claude), OpenAI (GPT), and Google (Gemini) all support agent skills through various mechanisms:":
        "2026年現在、Anthropic（Claude）、OpenAI（GPT）、Google（Gemini）などの主要AIプロバイダーは、様々なメカニズムを通じてエージェントスキルをサポートしています：",

    "- **Claude**: Computer use, bash tool, text editor tool":
        "- **Claude**: コンピューターの使用、bashツール、テキストエディターツール",
    "- **OpenAI**: Function calling, code interpreter, file search":
        "- **OpenAI**: 関数呼び出し、コードインタープリター、ファイル検索",
    "- **Open-source**: LangChain tools, AutoGPT, custom implementations":
        "- **オープンソース**: LangChainツール、AutoGPT、カスタム実装",

    "Why Agent Skills Matter in 2026":
        "2026年にエージェントスキルが重要な理由",
    "The Evolution from Chatbots to Agents":
        "チャットボットからエージェントへの進化",

    "Traditional chatbots (2022-2023):":
        "従来のチャットボット（2022-2023年）：",
    "- ✅ Answer questions with pre-trained knowledge":
        "- ✅ 事前学習された知識で質問に答える",
    "- ✅ Generate human-like text":
        "- ✅ 人間のようなテキストを生成する",
    "- ❌ Cannot access current information":
        "- ❌ 現在の情報にアクセスできない",
    "- ❌ Cannot perform actions":
        "- ❌ アクションを実行できない",
    "- ❌ Limited to conversational responses":
        "- ❌ 会話的な応答に限定される",

    "Modern AI agents (2024-2026):":
        "現代のAIエージェント（2024-2026年）：",
    "- ✅ Everything chatbots can do":
        "- ✅ チャットボットができることすべて",
    "- ✅ Execute real-world tasks":
        "- ✅ 実世界のタスクを実行する",
    "- ✅ Access real-time data":
        "- ✅ リアルタイムデータにアクセスする",
    "- ✅ Integrate with your tools and workflows":
        "- ✅ ツールやワークフローと統合する",
    "- ✅ Operate autonomously with minimal supervision":
        "- ✅ 最小限の監督で自律的に動作する",

    "Real-World Impact":
        "実世界への影響",
    "Consider these practical scenarios:":
        "以下の実用的なシナリオを考えてみましょう：",

    "**Before agent skills:**":
        "**エージェントスキル以前：**",
    "- User: \"Analyze this CSV file and create a summary report\"":
        "- ユーザー：「このCSVファイルを分析してサマリーレポートを作成して」",
    "- AI: \"I can't actually open files, but here's how you could do it...\"":
        "- AI：「実際にはファイルを開けませんが、やり方はこうです...」",

    "**With agent skills:**":
        "**エージェントスキル使用後：**",
    "- User: \"Analyze this CSV file and create a summary report\"":
        "- ユーザー：「このCSVファイルを分析してサマリーレポートを作成して」",
    "- AI: *Opens file, reads data, performs analysis, generates charts, creates PDF report*":
        "- AI：*ファイルを開き、データを読み取り、分析を実行し、チャートを生成し、PDFレポートを作成する*",
    "- Result: Complete report delivered in seconds":
        "- 結果：数秒で完全なレポートが届く",

    "Core Concepts: Understanding AI Agents and Tools":
        "コアコンセプト：AIエージェントとツールの理解",

    "The Agent Loop":
        "エージェントループ",
    "AI agents follow a continuous decision-making loop:":
        "AIエージェントは継続的な意思決定ループに従います：",

    "```\n1. Perceive → Understand user request and context\n2. Plan    → Decide what actions to take\n3. Act     → Execute using available tools\n4. Observe → Evaluate results\n5. Repeat  → Continue until task complete\n```":
        "```\n1. 知覚 → ユーザーのリクエストとコンテキストを理解する\n2. 計画   → どのアクションを実行するか決定する\n3. 実行   → 利用可能なツールを使用して実行する\n4. 観察   → 結果を評価する\n5. 繰り返し → タスクが完了するまで続ける\n```",

    "Example conversation:":
        "会話の例：",
    "```\nUser: \"Find the latest AI news and email me a summary\"\n\nAgent thinking:\n1. Perceive: User wants news + email delivery\n2. Plan: I need to use web_search tool, then email tool\n3. Act: Execute web_search(\"latest AI news 2026\")\n4. Observe: Got 10 relevant articles\n5. Plan: Summarize articles, then use email tool\n6. Act: Send email with summary\n7. Done: Confirm to user\n```":
        "```\nユーザー：「最新のAIニュースを見つけて、サマリーをメールで送って」\n\nエージェントの思考：\n1. 知覚：ユーザーはニュースとメール配信を求めている\n2. 計画：web_searchツールを使用し、次にメールツールを使用する必要がある\n3. 実行：web_search(\"最新のAIニュース 2026\")を実行\n4. 観察：10件の関連記事を取得\n5. 計画：記事を要約し、メールツールを使用する\n6. 実行：サマリーを含むメールを送信\n7. 完了：ユーザーに確認を通知\n```",

    "Skills vs. Tools vs. Functions (Terminology)":
        "スキル vs ツール vs 関数（用語）",
    "The AI industry uses these terms somewhat interchangeably:":
        "AI業界ではこれらの用語が多少交換可能に使用されています：",

    "| Term | Definition | Example |\n|------|------------|---------|\n| **Tool** | A capability the agent can invoke | `web_search`, `file_reader`, `calculator` |\n| **Function** | The implementation of a tool (technical term) | JavaScript function, API endpoint |\n| **Skill** | Higher-level capability (may use multiple tools) | \"Research assistant\" uses search + summarize + write |\n| **Action** | A single invocation of a tool | Calling `web_search(\"AI trends\")` |":
        "| 用語 | 定義 | 例 |\n|------|------------|---------|\n| **ツール** | エージェントが呼び出せる機能 | `web_search`、`file_reader`、`calculator` |\n| **関数** | ツールの実装（技術用語） | JavaScript関数、APIエンドポイント |\n| **スキル** | 高レベルの機能（複数のツールを使用可能） | 「研究アシスタント」は検索 + 要約 + 執筆を使用 |\n| **アクション** | ツールの単一呼び出し | `web_search(\"AI trends\")`の呼び出し |",

    "In this guide, we'll use \"tools\" and \"skills\" interchangeably.":
        "このガイドでは「ツール」と「スキル」を交換可能に使用します。",

    "Official AI Agent Skills: What's Available":
        "公式AIエージェントスキル：利用可能なもの",

    "Claude's Official Tools (Anthropic)":
        "Claudeの公式ツール（Anthropic）",
    "As of 2026, Claude offers three powerful built-in tools:":
        "2026年現在、Claudeは3つの強力な組み込みツールを提供しています：",

    "1. Computer Use (`computer_20241022`)":
        "1. コンピューターの使用（`computer_20241022`）",
    "Allows Claude to interact with a computer like a human:":
        "Claudeが人間のようにコンピューターと対話できるようにします：",
    "- Control mouse and keyboard":
        "- マウスとキーボードを制御する",
    "- Take screenshots and analyze UI":
        "- スクリーンショットを撮り、UIを分析する",
    "- Navigate applications":
        "- アプリケーションをナビゲートする",
    "- Fill forms, click buttons, browse web":
        "- フォームを埋め、ボタンをクリックし、ウェブを閲覧する",

    "**Use cases:**":
        "**ユースケース：**",
    "- Automated testing":
        "- 自動テスト",
    "- Web scraping":
        "- ウェブスクレイピング",
    "- Desktop automation":
        "- デスクトップ自動化",
    "- UI interaction":
        "- UIインタラクション",

    "**Example:**":
        "**例：**",

    "2. Bash Tool (`bash_20241022`)":
        "2. Bashツール（`bash_20241022`）",
    "Execute bash commands in a secure environment:":
        "安全な環境でbashコマンドを実行します：",
    "- Run shell scripts":
        "- シェルスクリプトを実行する",
    "- Install packages":
        "- パッケージをインストールする",
    "- Process files with CLI tools":
        "- CLIツールでファイルを処理する",
    "- System operations":
        "- システム操作",

    "**Use cases:**":
        "**ユースケース：**",
    "- DevOps automation":
        "- DevOps自動化",
    "- File processing":
        "- ファイル処理",
    "- Data transformation":
        "- データ変換",
    "- System administration":
        "- システム管理",

    "3. Text Editor (`text_editor_20241022`)":
        "3. テキストエディター（`text_editor_20241022`）",
    "Create and edit files with precision:":
        "正確にファイルを作成・編集します：",
    "- View file contents":
        "- ファイルの内容を表示する",
    "- Edit specific lines":
        "- 特定の行を編集する",
    "- Create new files":
        "- 新しいファイルを作成する",
    "- String replacement":
        "- 文字列の置換",

    "**Use cases:**":
        "**ユースケース：**",
    "- Code editing":
        "- コード編集",
    "- Configuration management":
        "- 設定管理",
    "- Document generation":
        "- ドキュメント生成",
    "- Automated refactoring":
        "- 自動リファクタリング",

    "OpenAI's Function Calling":
        "OpenAIの関数呼び出し",
    "OpenAI's GPT models support custom function calling:":
        "OpenAIのGPTモデルはカスタム関数呼び出しをサポートしています：",

    "// If GPT wants to call a function, it returns:":
        "// GPTが関数を呼び出したい場合、以下を返します：",
    "// {":
        "// {",
    "//   \"name\": \"get_weather\",":
        "//   \"name\": \"get_weather\",",
    "//   \"arguments\": \"{\\\"location\\\": \\\"Tokyo\\\", \\\"unit\\\": \\\"celsius\\\"}\"":
        "//   \"arguments\": \"{\\\"location\\\": \\\"Tokyo\\\", \\\"unit\\\": \\\"celsius\\\"}\"",
    "// }":
        "// }",

    "// You then execute the function and return results to GPT":
        "// 次に関数を実行し、結果をGPTに返します",

    "Popular Open-Source Tool Frameworks":
        "人気のあるオープンソースツールフレームワーク",

    "LangChain Tools":
        "LangChainツール",
    "LangChain provides 100+ pre-built tools:":
        "LangChainは100以上のプリビルドツールを提供しています：",

    "# Load built-in tools":
        "# 組み込みツールをロードする",
    "# Use the agent":
        "# エージェントを使用する",
    "agent.run(\"What's the population of Tokyo? Calculate 10% of that number.\")":
        "agent.run(\"東京の人口は？その数の10%を計算して。\")",

    "**Available LangChain tools:**":
        "**利用可能なLangChainツール：**",
    "- Wikipedia search":
        "- Wikipedia検索",
    "- Google search":
        "- Google検索",
    "- WolframAlpha":
        "- WolframAlpha",
    "- Python REPL":
        "- Python REPL",
    "- Shell commands":
        "- シェルコマンド",
    "- SQL database":
        "- SQLデータベース",
    "- HTTP requests":
        "- HTTPリクエスト",
    "- File operations":
        "- ファイル操作",
    "- And 90+ more...":
        "- その他90以上...",

    "Building Your First AI Agent with Skills":
        "スキル付きの最初のAIエージェントを構築する",
    "Let's build a practical research assistant agent step by step.":
        "実用的な研究アシスタントエージェントをステップバイステップで構築しましょう。",

    "Prerequisites":
        "前提条件",
    "1. **Python 3.8+** installed":
        "1. **Python 3.8+**がインストールされていること",
    "2. **API key** from Anthropic or OpenAI":
        "2. AnthropicまたはOpenAIの**APIキー**",
    "3. **Basic Python knowledge**":
        "3. **Pythonの基礎知識**",
    "4. Install required packages:":
        "4. 必要なパッケージをインストールする：",

    "Step 1: Define Your Tools":
        "ステップ1：ツールを定義する",
    "First, create custom tools for your agent:":
        "まず、エージェント用のカスタムツールを作成します：",

    '"""':
        '"""',
    '    """Search the web for information.':
        '    """ウェブで情報を検索する。',
    '    ':
        '    ',
    '    Args:':
        '    引数:',
    '        query: Search query string':
        '        query: 検索クエリ文字列',
    '        num_results: Number of results to return':
        '        num_results: 返す結果の数',
    '    ':
        '    ',
    '    Returns:':
        '    戻り値:',
    '        List of search results with title, URL, and snippet':
        '        タイトル、URL、スニペットを含む検索結果のリスト',
    '    """':
        '    """',
    '    # Using a search API (example with DuckDuckGo)':
        '    # 検索APIを使用（DuckDuckGoの例）',
    '        results = []':
        '        results = []',
    '            title = result.find(':
        '            title = result.find(',
    '            snippet = result.find(':
        '            snippet = result.find(',
    '                    'title': title.text,':
        '                    'title': title.text,',
    '                    'url': title['href'],':
        '                    'url': title['href'],',
    '                    'snippet': snippet.text':
        '                    'snippet': snippet.text',
    '        return [{"error": str(e)}]':
        '        return [{"error": str(e)}]',

    '    """Save content to a file.':
        '    """コンテンツをファイルに保存する。',
    '        content: Text content to save':
        '        content: 保存するテキストコンテンツ',
    '        filename: Name of file to create':
        '        filename: 作成するファイル名',
    '        Success message with file path':
        '        ファイルパスを含む成功メッセージ',
    '        return f"✅ Content saved to {filename}"':
        '        return f"✅ {filename}にコンテンツを保存しました"',
    '        return f"❌ Error saving file: {str(e)}"':
        '        return f"❌ ファイル保存エラー: {str(e)}"',

    '    """Safely evaluate mathematical expressions.':
        '    """数式を安全に評価する。',
    '        expression: Math expression like "2 + 2" or "10 * 5"':
        '        expression: "2 + 2"や"10 * 5"のような数式',
    '        Result of calculation':
        '        計算の結果',
    '        # Safe eval - only allow numbers and basic operators':
        '        # 安全なeval - 数字と基本演算子のみを許可',
    '            return "Error: Invalid characters in expression"':
        '            return "エラー：式に無効な文字が含まれています"',
    '        return f"{expression} = {result}"':
        '        return f"{expression} = {result}"',
    '        return f"Error: {str(e)}"':
        '        return f"エラー: {str(e)}"',

    "Step 2: Create the Agent with OpenAI":
        "ステップ2：OpenAIでエージェントを作成する",
    "# Define function schemas":
        "# 関数スキーマを定義する",
    '        "description": "Search the web for current information on a topic",':
        '        "description": "トピックに関する最新情報をウェブで検索する",',
    '                    "description": "The search query"':
        '                    "description": "検索クエリ"',
    '                    "description": "Number of results to return (default 5)"':
        '                    "description": "返す結果の数（デフォルト5）"',
    '        "description": "Save text content to a file",':
        '        "description": "テキストコンテンツをファイルに保存する",',
    '                    "description": "The content to save"':
        '                    "description": "保存するコンテンツ"',
    '                    "description": "Name of the file to create"':
        '                    "description": "作成するファイル名"',
    '        "description": "Perform mathematical calculations",':
        '        "description": "数学的計算を実行する",',
    '                    "description": "Mathematical expression to evaluate"':
        '                    "description": "評価する数式"',

    "# Map function names to actual functions":
        "# 関数名を実際の関数にマッピングする",

    '    """Run the agent with tool support.':
        '    """ツールサポート付きでエージェントを実行する。',
    '        """You are a helpful research assistant with access to tools.':
        '        """ツールにアクセスできる役に立つ研究アシスタントです。',
    '        When the user asks for information, use web_search to find current data.':
        '        ユーザーが情報を求めた場合、web_searchを使用して最新データを探します。',
    '        When asked to save information, use save_to_file.':
        '        情報を保存するよう求められた場合、save_to_fileを使用します。',
    '        For calculations, use the calculate tool.':
        '        計算にはcalculateツールを使用します。',
    '        ':
        '        ',
    '        Always explain what you're doing and provide clear, helpful responses."""':
        '        常に何をしているか説明し、明確で役立つ応答を提供します。"""',

    '    # Agent loop - allow up to 5 tool calls':
        '    # エージェントループ - 最大5回のツール呼び出しを許可',

    '        # If no function call, we're done':
        '        # 関数呼び出しがなければ完了',

    '        # Execute the function':
        '        # 関数を実行する',
}

def translate_line(line):
    """Translate a single line of text."""
    # Skip empty lines and code-only lines
    if not line.strip() or line.strip().startswith('```') or line.strip().startswith('#!'):
        return line

    # Try to translate using dictionary
    for en_text, ja_text in translations.items():
        if en_text in line:
            line = line.replace(en_text, ja_text)

    return line

def translate_frontmatter(content):
    """Translate the frontmatter section."""
    lines = content.split('\n')
    frontmatter_end = -1

    # Find frontmatter end
    for i, line in enumerate(lines):
        if line.strip() == '---' and i > 0:
            frontmatter_end = i
            break

    if frontmatter_end == -1:
        return content

    # Translate frontmatter values (not keys)
    for i in range(1, frontmatter_end):
        line = lines[i]
        if ':' in line and not line.strip().startswith('#'):
            key, value = line.split(':', 1)
            value = value.strip()

            # Only translate quoted values
            if value.startswith('"') and value.endswith('"'):
                translated = translate_line(value[1:-1])
                lines[i] = f'{key}: "{translated}"'
            elif value.startswith("'") and value.endswith("'"):
                translated = translate_line(value[1:-1])
                lines[i] = f"{key}: '{translated}'"

    return '\n'.join(lines)

def translate_article(input_file, output_file):
    """Translate an entire article from English to Japanese."""
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Translate frontmatter
    content = translate_frontmatter(content)

    # Translate body
    lines = content.split('\n')
    translated_lines = []

    in_code_block = False
    code_block_type = None

    for line in lines:
        # Check for code blocks
        if line.strip().startswith('```'):
            if not in_code_block:
                in_code_block = True
                code_block_type = line.strip()[3:].strip()
            else:
                in_code_block = False
                code_block_type = None

        # Translate only non-code lines
        if not in_code_block or code_block_type not in ['python', 'javascript', 'js', 'bash', 'sh']:
            translated_line = translate_line(line)
            translated_lines.append(translated_line)
        else:
            translated_lines.append(line)

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(translated_lines))

    print(f"✅ Translated: {input_file} -> {output_file}")

if __name__ == '__main__':
    import sys

    if len(sys.argv) != 3:
        print("Usage: python translate_to_ja.py <input_file> <output_file>")
        sys.exit(1)

    translate_article(sys.argv[1], sys.argv[2])
