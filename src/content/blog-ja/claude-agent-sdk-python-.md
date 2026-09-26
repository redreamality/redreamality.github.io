---
title: 'Claude Agent SDK (Python) 学習ガイド'
pubDate: 2025-10-17T00:00:00.000Z
description: 'Python SDK 0.1.3 に固定し、query、ClaudeSDKClient のライフサイクル、hooks、MCP ツール、タイムアウトと後処理を完全な例と検証範囲で説明します。'
author: 'Remy'
tags: ['claude-code', 'vibe-coding', 'python']
lang: 'ja'
translatedFrom: 'claude-agent-sdk-python-'
---

[Claude Agent SDK for Python](https://github.com/anthropics/claude-agent-sdk-python/tree/v0.1.3) は、Python から Claude Code を操作し、型付きメッセージを受け取るためのライブラリです。この記事は元の記事と同じ **claude-agent-sdk==0.1.3** を対象に、正式リリースされたその版のインターフェースを説明します。最新版の紹介でも、新しいサービスへの旧版導入の推奨でもありません。

まず、同名の二つの操作を区別します。モジュール関数の `query()` はメッセージの非同期イテレーターを返します。`ClaudeSDKClient.query()` は入力を送信して `None` を返すため、回答は `receive_response()` で受信します。Hooks は `ClaudeAgentOptions.hooks`、`HookMatcher`、非同期コールバックで設定します。別の同期クライアントを使う構成ではありません。

以下ではローカル検証とモデルへのリクエストを区別します。ローカル検証には API キーが不要で、Claude Code を起動せず、モデル利用料金も発生しません。オンライン例には別途認証が必要で、料金が発生する場合があります。オンラインの想定出力は確認すべき条件であり、実際にモデルから得た実行記録ではありません。

## インストールとバージョン確認

[v0.1.3 の公式 README](https://github.com/anthropics/claude-agent-sdk-python/blob/v0.1.3/README.md) は Python 3.10 以上、Node.js、Claude Code 2.0.0 以上を前提としています。これは当時の要件であり、その後のすべての CLI が旧 SDK と互換であるという保証ではありません。一時ディレクトリで、Python 環境と依存関係を管理する [uv](https://docs.astral.sh/uv/pip/environments/) を使います。

```bash
uv venv --python 3.12 .venv
uv pip install --python .venv "claude-agent-sdk==0.1.3" "mcp==1.18.0" "anyio==4.11.0"
```

Windows では `.venv\Scripts\python.exe`、macOS と Linux では `.venv/bin/python` で以下のファイルを実行します。インタープリターを明示すると、グローバルにインストールされた別の SDK を誤って読み込むことを避けられます。複数の環境を有効化した状態で、単に `python` という名前から使用中の版を判断しないでください。

最初の独立した例を `inspect_install.py` とします。

```python
import inspect
from importlib.metadata import version

from claude_agent_sdk import ClaudeAgentOptions, ClaudeSDKClient, HookMatcher, query

def main():
    assert version("claude-agent-sdk") == "0.1.3"
    assert inspect.isasyncgenfunction(query)
    assert inspect.iscoroutinefunction(ClaudeSDKClient.query)
    assert set(inspect.signature(HookMatcher).parameters) == {"matcher", "hooks"}
    ClaudeAgentOptions(max_turns=2, setting_sources=[])
    print("SDK 0.1.3: imports and signatures OK")

if __name__ == "__main__":
    main()
```

```bash
# Windows
.venv\Scripts\python.exe inspect_install.py
# macOS / Linux
.venv/bin/python inspect_install.py
```

想定出力は `SDK 0.1.3: imports and signatures OK` です。これはインポートと確認対象のシグネチャが正しいことを示すだけで、通信、モデルへのアクセス、ツール権限までは確認しません。パッケージのメタデータを読む方法なら、特定のモジュール属性が存在するという仮定も不要です。

MCP と AnyIO も固定する理由があります。検証環境で SDK 0.1.3 だけをインストールすると MCP 2.2.0 が解決され、SDK MCP サーバーの生成時に `Server.list_tools` が存在しないというエラーになりました。この例では MCP 1.18.0 と AnyIO 4.11.0 を使用します。インストール成功は互換性の証明ではなく、この旧版の組み合わせも安全性や長期サポートの保証ではありません。

オンライン実行前には `claude --version`、実際の実行ファイル、Python 依存関係の版を記録し、[公式の認証説明](https://code.claude.com/docs/en/agent-sdk/overview) に従って設定してください。認証情報をスクリプトやコミット対象のシェル設定に埋め込まないでください。ローカル検証では認証情報を読む必要はありません。CLI がない場合はローカル検証までとし、名前が似た `claude` パッケージで代用しないでください。

## Query とメッセージ型

[固定した版の query 実装](https://github.com/anthropics/claude-agent-sdk-python/blob/v0.1.3/src/claude_agent_sdk/query.py) は、キーワード専用の `prompt` と、任意の `options`、`transport` を受け取ります。`query(prompt="...")` と呼び出し、プロンプトを位置引数にしないでください。返るイテレーターは `async for` で消費します。イテレーター自体や任意の一つのメッセージは、最終回答の文字列ではありません。

`AssistantMessage` には複数の内容ブロックが含まれます。文章には `TextBlock`、ツール要求には `ToolUseBlock` を確認します。`ResultMessage` は一つのターンの終了を示し、エラー状態、所要時間、セッション情報、任意の費用情報を持ちます。文章が届いた後にツールが失敗したり接続が切れたりするため、文章だけでは成功を確認できません。

次のオンライン例を `query_once.py` とします。インポート、非同期エントリーポイント、実行処理をすべて含みます。

```python
from contextlib import aclosing
import anyio
from claude_agent_sdk import (
    AssistantMessage, ClaudeAgentOptions, ResultMessage, TextBlock, query,
)

async def main():
    completed = False
    failure = None
    options = ClaudeAgentOptions(max_turns=1, setting_sources=[])
    async with aclosing(query(
        prompt="Reply with the number obtained by adding 2 and 2. Do not use tools.",
        options=options,
    )) as messages:
        async for message in messages:
            if isinstance(message, AssistantMessage):
                for block in message.content:
                    if isinstance(block, TextBlock):
                        print(block.text)
            elif isinstance(message, ResultMessage):
                completed = True
                print(f"result: is_error={message.is_error}")
                if message.is_error:
                    failure = message.subtype
    if failure is not None:
        raise RuntimeError(f"Turn failed: {failure}")
    if not completed:
        raise RuntimeError("Stream ended without ResultMessage")

if __name__ == "__main__":
    anyio.run(main)
```

前述のインタープリターコマンドで、ファイル名を `query_once.py` に置き換えて実行します。成功時は計算問題への回答と `result: is_error=False` が出力される想定です。回答の表現は固定ではありません。プロンプトでツールを使わないよう依頼しても、それは OS レベルの権限制限にはなりません。

この例はイテレーターを最後まで消費してからモデル結果のエラーを報告します。0.1.3 では消費途中の例外時に、外側の `aclosing` だけでは内側の生成器を同じタスクで確実に閉じられず、ローカル検証でもキャンセルスコープのエラーが再現しました。旧版の後処理上の制限であり、任意の例外に対する安全性を保証しません。アプリケーションからキャンセルする場合は、以下の明示的に所有するクライアントを使います。

モジュール関数は通常別々の実行を作成しますが、常にステートレスと説明するのも不正確です。この版には既に `resume` と `continue_conversation` があります。保存済みの会話を再開することと、接続済みの Python クライアントを保持することは別の仕組みです。文脈の継続を調べるときは、方式とセッション識別子を記録します。

## ClaudeSDKClient のライフサイクルと後処理

[クライアントのソース](https://github.com/anthropics/claude-agent-sdk-python/blob/v0.1.3/src/claude_agent_sdk/client.py) に対応する順序は、生成、接続、送信、受信、必要なら繰り返し、切断です。生成だけでは接続しません。`async with ClaudeSDKClient(...)` は入るときに接続し、出るときに切断します。手動で管理する場合は、接続初期化の例外も考慮して `finally` で後処理します。

接続と切断は同じ非同期タスクとコンテキストで行います。この版は両者の間で AnyIO の task group を開いたまま保持します。通常の HTTP オブジェクトのように、別々のタスクで接続と切断を行うことはできません。複数の入力元がある場合はアプリケーション側でキューを設け、クライアントを所有するタスクを明確にします。

次の例を `lifecycle.py` とします。任意の `transport` 引数はローカル fixture 用で、通常の呼び出しでは省略します。前の結果を消費してから次を送る順番で二つのプロンプトを処理します。

```python
import anyio
from claude_agent_sdk import ClaudeAgentOptions, ClaudeSDKClient, ResultMessage

async def run_turns(transport=None, seconds=30, cleanup_seconds=5):
    client = ClaudeSDKClient(
        options=ClaudeAgentOptions(max_turns=2, setting_sources=[]),
        transport=transport,
    )
    cleanup_completed = False
    with anyio.CancelScope() as lifecycle_scope:
        try:
            await client.connect()
            for prompt in ("Remember the word cedar. Do not use tools.",
                           "What word did I ask you to remember? Do not use tools."):
                completed = False
                with anyio.fail_after(seconds):
                    await client.query(prompt)
                    async for message in client.receive_response():
                        if isinstance(message, ResultMessage):
                            completed = True
                            if message.is_error:
                                raise RuntimeError(f"Turn failed: {message.subtype}")
                if not completed:
                    raise RuntimeError("Stream ended without ResultMessage")
                print("turn complete")
        except TimeoutError:
            print("turn deadline exceeded; outcome unknown")
            raise
        finally:
            lifecycle_scope.shield = True
            lifecycle_scope.deadline = anyio.current_time() + cleanup_seconds
            await client.disconnect()
            cleanup_completed = True
    if not cleanup_completed:
        raise RuntimeError("cleanup deadline exceeded; resources may remain")
    await anyio.lowlevel.checkpoint()

async def main():
    await run_turns()

if __name__ == "__main__":
    anyio.run(main)
```

同じインタープリターで `lifecycle.py` を実行すると、成功時の目印は二行の `turn complete` です。これはエラーでない結果を二回消費したことだけを示します。二回目の回答で単語を正しく覚えていたかは、この短い例では確認していません。モデルの回答品質には別のテキスト検証が必要です。

ターンのタイムアウトスコープを抜けても、キャンセル済みの呼び出し元スコープは transport の後処理を中断できます。接続前に `lifecycle_scope` に入り、`finally` では既存スコープの `shield` と `deadline` を変更します。`disconnect()` の周りに新しい保護スコープを追加してはいけません。SDK の task group はスタック順に終了する必要があります。ターンと後処理の予算は別で、起動、二ターンの合計、終了処理を含む総期限ではありません。

`cleanup_seconds` は正の値を指定し、既定の後処理時間は五秒です。祖先の AnyIO スコープからのキャンセルを遮蔽しても、自身の期限は有効です。最後の checkpoint で後処理中に届いた外部キャンセルを伝播します。後処理の期限を超えた場合は未回収の可能性を明示するエラーを元の中断より優先し、成功とは扱いません。そのクライアントを再利用せず、監督プロセスに残存リソースを処理させます。直接の `asyncio.Task.cancel()`、プロセス終了、実行を譲らないブロッキング処理は、この保護の対象外です。

旧版固有の限界もあります。`disconnect()` は内部 query オブジェクトを通じてリソースを閉じます。その生成前に失敗した場合、途中まで開始したすべての transport が回収されたとは保証できません。独自 transport は自身の起動失敗処理を持ち、本番環境ではプロセス単位の監督も必要です。`finally` は後処理を試みる経路であり、あらゆる子プロセス漏れを防ぐ保証ではありません。

`Stop` は agent のイベントで、Python クライアントの破棄ではありません。`interrupt()` は制御チャネル経由で中断を要求しますが、切断の代用でも、実行済みのツールを取り消す操作でもありません。キャンセル後は外部状態を照合するまで結果不明として扱います。最終回答がなくても、デプロイ、支払い、ファイル変更を無条件に再試行してはいけません。

## Hooks と権限判断

[v0.1.3 の型定義](https://github.com/anthropics/claude-agent-sdk-python/blob/v0.1.3/src/claude_agent_sdk/types.py) にあるイベントは `PreToolUse`、`PostToolUse`、`UserPromptSubmit`、`Stop`、`SubagentStop`、`PreCompact` の六つです。接続前に options でコールバックを登録します。TypeScript のイベント一覧をそのまま使ったり、クライアントのデコレーターを作り出したりしないでください。

コールバックは `input_data`、`tool_use_id`、`context` の三つを受け取る `async def` 関数で、辞書を返します。`PreToolUse` で明示的に拒否する場合は、`hookSpecificOutput` に対応する `hookEventName` と `permissionDecision="deny"` を指定します。`{}` は判断を追加しないという意味で、明示的な許可でも、他の権限確認の上書きでもありません。

次を `hooks_demo.py` とします。既定ではモデルを使わずコールバックを直接確認します。`--live` を指定した場合だけ無害な Bash コマンドをモデルに要求し、コールバックはすべての Bash 呼び出しを拒否します。危険そうな文字列を部分一致で探すより、この例の期待動作を明確にできます。

```python
import argparse
import anyio
from claude_agent_sdk import (
    ClaudeAgentOptions, ClaudeSDKClient, HookMatcher, ResultMessage,
)

async def deny_bash(input_data, tool_use_id, context):
    if input_data["tool_name"] != "Bash":
        return {}
    print("PreToolUse: deny Bash")
    return {
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": "Bash is disabled in this example",
        }
    }

async def audit_tool(input_data, tool_use_id, context):
    print(f"PostToolUse: {input_data['tool_name']}")
    return {}

def make_options():
    return ClaudeAgentOptions(
        max_turns=2,
        setting_sources=[],
        hooks={
            "PreToolUse": [HookMatcher(matcher="Bash", hooks=[deny_bash])],
            "PostToolUse": [HookMatcher(matcher=None, hooks=[audit_tool])],
        },
    )

async def main(live=False):
    if not live:
        result = await deny_bash(
            {"hook_event_name": "PreToolUse", "session_id": "fixture",
             "transcript_path": "", "cwd": ".", "tool_name": "Bash",
             "tool_input": {"command": "echo hook-check"}},
            "fixture-tool", {"signal": None},
        )
        assert result["hookSpecificOutput"]["permissionDecision"] == "deny"
        make_options()
        print("offline hook contract OK")
        return
    async with ClaudeSDKClient(options=make_options()) as client:
        await client.query("Use Bash to run: echo hook-check")
        completed = False
        async for message in client.receive_response():
            if isinstance(message, ResultMessage):
                completed = True
                print(f"result: is_error={message.is_error}")
                if message.is_error:
                    raise RuntimeError(f"Turn failed: {message.subtype}")
        if not completed:
            raise RuntimeError("Stream ended without ResultMessage")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--live", action="store_true")
    anyio.run(main, parser.parse_args().live)
```

同じインタープリターで `hooks_demo.py` を実行すると、ローカルでは次を出力します。

```text
PreToolUse: deny Bash
offline hook contract OK
```

認証を設定し、モデルへのリクエストを許可した後だけ `--live` を付けます。モデルが Bash を選ぶとは限らないため、最初のログがないだけで登録失敗とは判断できません。逆に、ローカルで拒否を出力しただけでは CLI が実行を防いだ証明にもなりません。オンライン検証では実際のツール要求と、その副作用が発生しなかったことを確認します。

`PostToolUse` はツール実行後に発生し、監査には使えますが実行を取り消せません。ログにはイベント、ツール名、呼び出し ID など必要な情報を記録し、完全なプロンプト、引数、ファイル本文は既定で記録しないでください。この例もコマンドの内容ではなくツール名を出力します。

この例は汎用サンドボックスではありません。Bash の拒否だけでは、他のツールによるファイル変更や通信を防げません。`allowed_tools` やプロンプトもファイルシステムの隔離を代替しません。実際の方針では許可する操作と未知のツールの扱いを定義し、隔離環境で別経路も検証します。`can_use_tool` は別の権限コールバック API で、これにもストリーミング制御チャネルが必要です。

## モジュール Query のストリーミング Hooks

[内部クライアントの実装](https://github.com/anthropics/claude-agent-sdk-python/blob/v0.1.3/src/claude_agent_sdk/_internal/client.py) は hooks を query に渡しますが、制御プロトコルを初期化するのは非同期イテラブル入力の場合だけです。そのため「モジュール query は hooks 非対応」も、この版で「文字列入力とストリーミング入力は同じ」も不正確です。

`stream_query.py` を `hooks_demo.py` と同じディレクトリに置き、前の例の設定を明示的に再利用します。イベントを使い、結果が届くまで入力ストリームを開いておきます。一つのメッセージを yield してすぐ終わる生成器では、後から制御応答を書き込む前に stdin が閉じる場合があります。

```python
from contextlib import aclosing
import anyio
from claude_agent_sdk import ResultMessage, query
from hooks_demo import make_options

async def main():
    done = anyio.Event()

    async def prompts():
        yield {
            "type": "user",
            "message": {"role": "user", "content": "Use Bash: echo hook-check"},
            "parent_tool_use_id": None,
            "session_id": "default",
        }
        await done.wait()

    completed = False
    failure = None
    try:
        async with aclosing(query(prompt=prompts(), options=make_options())) as messages:
            async for message in messages:
                if isinstance(message, ResultMessage):
                    completed = True
                    done.set()
                    if message.is_error:
                        failure = message.subtype
                    else:
                        print("stream result received")
    finally:
        done.set()
    if failure is not None:
        raise RuntimeError(f"Turn failed: {failure}")
    if not completed:
        raise RuntimeError("Stream ended without ResultMessage")

if __name__ == "__main__":
    anyio.run(main)
```

同じインタープリターで `stream_query.py` を実行するとオンライン要求になります。成功時の出力は `stream result received` で、拒否ログには実際の Bash 要求が必要です。これは旧版の入力ライフサイクルの説明であり、無制限に待つサービスの推奨ではありません。結果が届かなければ生成器も待ち続けます。オンライン実験はプロセス監督の下で行い、アプリケーションで待ち時間を制御したい場合は前述のクライアント側の期限を使用します。

## 層ごとのタイムアウト

この版の `ClaudeSDKClient` と `HookMatcher` には `timeout=` 引数がありません。[制御プロトコルのソース](https://github.com/anthropics/claude-agent-sdk-python/blob/v0.1.3/src/claude_agent_sdk/_internal/query.py) は、自ら送った制御要求の応答を 60 秒待ちます。しかし、これはモデルの全ターン、受信する全コールバック、アプリケーション全体の期限ではありません。

<div class="overflow-x-auto" role="region" aria-label="タイムアウト層の比較表" tabindex="0">

| 層 | この記事での意味 | 保証しないもの |
| --- | --- | --- |
| 接続と制御要求 | SDK 内部で制御応答を待つ | モデル実行全体の上限 |
| コールバック内の I/O | DB や HTTP の待機を個別に制限する | 旧版の `HookMatcher.timeout` の存在 |
| 非同期 Hook 出力 | `async_` は遅延出力を選び、この tag の `asyncTimeout` はミリ秒 | すべての非同期関数がバックグラウンドで動くこと |
| アプリケーションのターン | `anyio.fail_after(seconds)` が送受信を囲む | 起動と後処理の期限 |
| ジョブ全体 | 監督プロセスが全寿命と子プロセス回収を管理する | 外部副作用の自動ロールバック |

</div>

[現在の Python 文書](https://code.claude.com/docs/en/agent-sdk/python) は、環境設定で `API_TIMEOUT_MS` を CLI に渡し、API 要求の時間を制限する方法を説明しています。それは現在の CLI の契約であり、この記事の旧 SDK／CLI 組み合わせで検証した引数ではありません。再試行では複数の要求時間が累積するため、一要求の期限を作業全体の上限と同一視しないでください。

承認に外部照会が必要なら、コールバック内の照会に期限を設け、タイムアウト時に明示的な拒否を返す方針が考えられます。ただし、キャンセルには実際の非同期待機点が必要です。同期ライブラリのブロッキング呼び出しや CPU ループは、外側を `async def` にしても中断可能にはなりません。

バックグラウンド監査と承認は別に扱います。`async_` を返しても権限確認が完了した証明にはなりません。また旧 CLI の Hook エラーやタイムアウトに対し、すべて同じ動作になるとは説明しません。ツールが実行されたか、セッションが続いたか、クライアントが閉じたかを個別に検証し、一つの例外からすべてを推測しないでください。

## カスタム MCP ツール

MCP は、agent が構造化された入力と出力でツールを呼び出すためのプロトコルです。[v0.1.3 の実装](https://github.com/anthropics/claude-agent-sdk-python/blob/v0.1.3/src/claude_agent_sdk/__init__.py) は、パッケージのルートから `tool` と `create_sdk_mcp_server` を公開します。プロセス内サーバーは別サーバーの起動を省けますが、測定済みの性能優位を意味せず、Python アプリケーションの権限からツールを隔離するものでもありません。

次の完全なローカル例を `mcp_demo.py` とします。

```python
import anyio
from claude_agent_sdk import ClaudeAgentOptions, create_sdk_mcp_server, tool

@tool("calculate_sum", "Add two numbers", {"a": float, "b": float})
async def calculate_sum(args):
    return {"content": [{"type": "text", "text": str(args["a"] + args["b"])}]}

def make_options():
    server = create_sdk_mcp_server(
        name="math-tools", version="1.0.0", tools=[calculate_sum],
    )
    return ClaudeAgentOptions(
        mcp_servers={"math": server},
        allowed_tools=["mcp__math__calculate_sum"],
        setting_sources=[],
    )

async def main():
    make_options()
    result = await calculate_sum.handler({"a": 15.0, "b": 27.0})
    assert result["content"][0]["text"] == "42.0"
    print("local MCP handler: 42.0")

if __name__ == "__main__":
    anyio.run(main)
```

同じインタープリターで `mcp_demo.py` を実行すると、想定出力は `local MCP handler: 42.0` です。handler の直接呼び出しは計算と返却辞書を確認しますが、CLI による検出やモデルによる選択は確認しません。オンライン統合ではこの `make_options()` を前述のクライアントに渡し、実際のツール要求と結果を調べてください。

公開名は `mcp_servers` の辞書キー `math` とツール名 `calculate_sum` から成ります。表示名の `math-tools` は、`mcp__math__calculate_sum` のキーではありません。画面の説明ラベルから名前を推測すると、名前の誤りを Hook の matcher の問題と取り違えることがあります。

## トラブルシューティングと検証範囲

Hook にログがない場合は、導入した版、入力方式、初期化のハンドシェイク、実際のツール名、matcher、コールバックへの到達、返却内容の順に確認します。`allowed_tools` はモデルにツール選択を強制しません。ツールを呼び出さない文章だけの回答では、ツール Hook の成功も失敗も判断できません。

接続障害では、実行ファイル不在、作業ディレクトリの誤り、CLI 終了、メッセージ解析失敗、認証失敗を区別します。一般的な `ProcessError` は API キー不在の証拠ではありません。終了コードと、秘密情報を除いた stderr を保持します。一つの依存だけを自動更新して、結果の変化を未確認の原因に帰属させないでください。

この記事のローカル検証は Python 3.12 と固定依存を使い、インポート、シグネチャ、全 Python ブロック、直接の Hook 呼び出し、MCP handler を確認しています。模擬 transport を使って実際の SDK を動かし、初期化、二回の連続応答、Hook のルーティング、ストリーミング入力、結果欠落時の期限、後処理も確認します。模擬メッセージは fixture であり、Claude の回答ではありません。

これらは CLI の権限制御、実際の Hook タイムアウト方針、OS の子プロセス回収、モデルの記憶、認証、費用、ネットワーク信頼性を証明しません。オンラインの受け入れ確認では正確な CLI 版を記録し、実際のツール拒否と副作用の不在、許可したツールの後置 Hook、使い捨て環境でのキャンセルを確認します。ページ表示や構文解析の成功を、その代わりにしてはいけません。

配備時は保守されている SDK／CLI の組み合わせを選び、完全な依存関係を固定して契約を再検証します。この記事が旧版を維持するのは元の説明を一貫させるためです。現在の文書は移行計画に使い、旧シグネチャの意味を暗黙に変更しないでください。

### 再現可能な失敗の確認

調査は使い捨てディレクトリで、一つのクライアントと一つのプロンプトから始めます。実行前に期待する終了条件を決めます。エラーでない結果、明示的な拒否、ローカル例外、期限のどれかです。これがないと、早く閉じたストリームを高速な回答と誤解したり、ツール拒否をアプリケーションのクラッシュと誤解したりします。

結果が欠けるテストには二種類あります。一つは初期化と入力を受け付けた後、結果を返さずストリームを開いたままにして、待機期限を検証します。もう一つは入力後すぐストリームを閉じ、結果欠落を明示的に検出することを確認します。UI では似ていても、タイムアウトと不完全なストリームという異なる条件です。

後処理のプローブは `close()` 内で非同期チェックポイントを待ってから完了を記録します。成功、内部タイムアウト、エラー結果、外部 AnyIO キャンセル後に `close_completed` を検証し、`close_started` だけで済ませません。ローカル回帰では後処理中のキャンセルと停止した後処理の有界終了も確認し、キャンセルの伝播、失敗後に二つ目を送らないこと、スコープスタックが使用可能なことを検証します。実際の SDK と模擬 transport の結果であり、本物の CLI プロセス漏れを立証したものではありません。

Hook のテストでは、初期化ペイロードから SDK が実際に登録した callback ID を取り、それを使って模擬 `hook_callback` 要求を送信し、制御応答を確認します。`deny_bash()` の直接呼び出しはアプリケーションの方針だけを検証します。実際の SDK を通すことで登録と辞書の直列化も検証できますが、どちらも特定の CLI が拒否をどう扱うかは確認しません。

再試行では、繰り返せる読み取りと結果不明の操作を分けます。読み取りだけに見えるプロンプトも、より広い権限を持つツールを動かす可能性があります。再試行前にツールの呼び出しと外部状態を調べ、必要ならアプリケーションの冪等性キーを設計します。接続エラーは通信上の観測であり、それ以前の全操作を繰り返す許可ではありません。

### 設定とエラー記録

特定の利用可能なモデルが必要なら `ClaudeAgentOptions(model=...)` を使います。例でモデルを指定しないのは、利用可能性がアカウントと実行環境に依存し、オフラインのインポート確認では判断できないためです。他のメッセージ API を参考にして、`temperature` や `max_tokens` を `client.query()` に渡さないでください。

`max_turns` は agent のターン数であり、経過時間や金額の上限ではありません。結果の `total_cost_usd` は `None` の場合があり、無条件に小数へ整形するとエラー報告自体が失敗します。費用情報がなければ不明とし、作業結果と別に記録してください。

再現用の記録には SDK、MCP、AnyIO、Python の版、CLI の正確な実行ファイルと版、OS、作業ディレクトリ、入力方式、有効なイベント、最後のメッセージ型、経過時間を含めます。共有前に秘密情報と個人情報を除去します。例の `setting_sources=[]` はファイルシステムの設定元を明示的に読み込まない設定ですが、サンドボックスではなく、継承した環境変数やマシン権限も消しません。

### ターンの期限をアプリケーションに組み込む

Web リクエストの待機が十秒で、クライアントのターンが三十秒なら、ブラウザー切断後の方針を決めます。UI が失敗を示した裏でファイル変更を続け、ユーザーの再試行で同じ操作を再実行する構成は避けます。キャンセルして結果を照合するか、識別子を持つバックグラウンドジョブとして後で状態を確認できるようにします。どちらにもジョブ識別子と終了理由の記録が必要です。

ジョブ全体の期限には待ち行列、接続、送信、受信、後処理が含まれます。この例はターンと後処理を別々に制限しますが、起動は制限しません。ターンの期限と回数を掛けても、他の段階や再試行の上限にはなりません。厳密なジョブ制限は子プロセスの寿命を所有する監督側で扱います。プロセス終了は外部操作のロールバックではありません。

後置 Hook のテストでは、前置 Hook が拒否した同じツールについて後置ログを要求しないでください。ローカルの加算 handler のように、許可された副作用のないツールを別に用意し、許可、実行完了、後置観測をそれぞれ確認します。拒否経路と成功経路の期待を混ぜないためです。この記事は両コールバックと handler を提示しますが、この組み合わせのオンライン検証済みとは述べません。

ログ処理自体の失敗も考慮します。完了済みのツールを監査するコールバックが、利用不能な遠隔サービスへの書き込みで停止すると、待機が続く原因になります。ログ配信に独自の失敗処理を設け、業務上監査が必須なら、失敗時に拒否するのか保留するのかを明確にします。例外が自動的に望む権限方針になると仮定したり、すべての例外を無視して完全な監査と報告したりしないでください。

結果は証拠の種類を分けて残します。オフラインのプロトコル検証はコールバックの到達と返却構造を、実コマンドの検証は指定 CLI の実行効果を確認します。この区別があれば、依存更新時に何を再検証すべきか判断でき、単一の合格記録を全体の保証と誤解せずに済みます。

## 参考資料

- [公式 v0.1.3 リポジトリと README](https://github.com/anthropics/claude-agent-sdk-python/tree/v0.1.3)：版の基準と当時の前提条件。
- [クライアントのライフサイクル](https://github.com/anthropics/claude-agent-sdk-python/blob/v0.1.3/src/claude_agent_sdk/client.py)と [query の入力処理](https://github.com/anthropics/claude-agent-sdk-python/blob/v0.1.3/src/claude_agent_sdk/_internal/client.py)：送受信とストリーミング初期化。
- [型と Hook のフィールド](https://github.com/anthropics/claude-agent-sdk-python/blob/v0.1.3/src/claude_agent_sdk/types.py)、[制御プロトコル](https://github.com/anthropics/claude-agent-sdk-python/blob/v0.1.3/src/claude_agent_sdk/_internal/query.py)：イベント、時間単位、後処理実装。
- [現在の Python リファレンス](https://code.claude.com/docs/en/agent-sdk/python)と [Hooks ガイド](https://code.claude.com/docs/en/agent-sdk/hooks)：移行用の資料であり、旧版の契約ではありません。
- [AnyIO のキャンセル説明](https://anyio.readthedocs.io/en/stable/cancellation.html)：期限、キャンセルスコープ、後処理の順序。
