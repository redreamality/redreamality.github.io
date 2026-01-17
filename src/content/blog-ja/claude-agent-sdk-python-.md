---
title: 'Claude Agent SDK (Python) 学習ガイド'
pubDate: 2025-10-17T00:00:00.000Z
description: 'Claude Agent SDKのアーキテクチャ、クエリ、カスタムMCPツール拡張、自動化のためのHookシステム、デバッグ、実装に関する完全ガイド。'
author: 'Remy'
tags: ['claude code', 'vibe coding', 'python']
lang: 'ja'
---

# Claude Agent SDK (Python) 学習ガイド

**ドキュメントバージョン**: 1.0  
**生成日**: 2025-10-15  
**SDKバージョン**: 0.1.3  
**レベル**: 標準（学習時間の目安：2–4時間）  
**対象ユーザ**: 中級Python開発者  

---

## 目次

1. [プロジェクト概要](#-プロジェクト概要)
2. [クイックスタート（15分）](#-クイックスタート15分)
3. [コアコンセプト（20分）](#-コアコンセプト20分)
4. [主要機能（30分）](#-主要機能30分)
5. [アーキテクチャ設計（20分）](#-アーキテクチャ設計20分)
6. [ハンズオン例（30分）](#-ハンズオン例30分)
7. [学習パス推奨](#-学習パス推奨)
8. [FAQ & トラブルシューティング](#-faq--トラブルシューティング)
9. [参考文献](#-参考文献)
10. [付録](#-付録)

---

## 📖 プロジェクト概要

### 1.1 プロジェクト紹介

**Claude Agent SDK for Python**は、Anthropicが公式に提供するPython SDKで、プログラムによるClaude Codeとの対話のために使用されます。Claude Code CLIをラッピングし、以下をサポートする簡潔でPythonicなAPIを提供します：

- **双方向会話**: Claudeとのマルチターン対話
- **カスタムツール**: プロセス内MCPサーバーによりClaudeの能力を拡張
- **Hookシステム**: ツール実行前後にカスタムロジックを注入
- **権限制御**: きめ細かなツール使用権限管理
- **非同期優先**: `anyio`に基づくクロスプラットフォーム非同期サポート

**プロジェクトタイプ**: SDK / 開発者ライブラリ  
**言語**: Python 3.10+  
**ライセンス**: MIT  
**リポジトリ**: https://github.com/anthropics/claude-agent-sdk-python

### 1.2 主な使用例

以下のシナリオでClaude Agent SDKを使用できます：

1. **コードベースナビゲーション**: Claudeを通じて大規模コードベース内で開発者を補助
2. **自動コーディング**: Claudeにファイル作成、編集、テスト作成を実行させる
3. **複雑なワークフロー自動化**: マルチステップのソフトウェア開発タスクを自動化
4. **IDE統合**: Claude Code機能をカスタム開発ツールに組み込む
5. **CI/CD統合**: 自動コードレビュー、テスト生成、デプロイメントパイプライン

### 1.3 主なアーキテクチャコンポーネント

```
┌─────────────────────────────────────────┐
│          Claude Agent SDK               │
├─────────────────────────────────────────┤
│ ┌──────────┐  ┌──────────────┐         │
│ │  Client  │  │   MCP Server │         │
│ │  (Hub)   │◄─┤(In-process)  │         │
│ └──────────┘  └──────────────┘         │
│        │  │                            │
│        │  └──────────────────────────┐ │
│        │                             │ │
│ ┌──────▼─────┐   ┌──────────────┐    │ │
│ │  Transport │◄──►│ Claude Code  │    │ │
│ │  (Stdio)   │   │  CLI Process │    │ │
│ └────────────┘   └──────────────┘    │ │
│                ▲                     │ │
└────────────────┼─────────────────────┘ │
                 │                       │
          ┌──────▼────────┐      ┌────────▼──────┐
          │  Hook System  │      │  Permission   │
          │  (Lifecycle)  │      │  Management   │
          └───────────────┘      └───────────────┘
```

---

## 🚀 クイックスタート（15分）

### 2.1 インストール

**前提条件：**
- Python 3.10+
- Claude Code CLI (npmまたはpip経由でインストール)
- Anthropic APIキー

**手順：**

1. **Claude Code CLIをインストール:**

```bash
# Claude Code CLIを各種インストール方法でインストール

## オプションA: npm (推奨)
npm install -g @anthropic-ai/claude-code

## オプションB: pip
pip install claude

## オプションC: 独立したインストーラー
curl -o claude https://releases.anthropic.com/claude/latest/claude-linux-amd64
chmod +x claude
sudo mv claude /usr/local/bin/
```

2. **Claude Agent SDKをインストール:**

```bash
pip install claude-agent-sdk
```

3. **環境変数を設定:**

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
export CLAUDE_CONFIG_DIR="$HOME/.config/claude"
```

4. **Claudeを認証:**

```bash
claude auth login
```

### 2.2 Hello World

**最小の例：**

```python
from claude_agent_sdk import ClaudeSDKClient

# 클라이언트 초기화
client = ClaudeSDKClient()

# 간단한 쿼리
response = client.query("Hello, Claude! What's the weather like today?")
print(response)
```

**출력:**

```
Hello! I'm Claude, an AI assistant. I don't have real-time access to weather data, but I can help you analyze weather patterns or create tools to fetch current conditions if you'd like!
```

### 2.3 파일 작업

**Claude에게 파일 읽기와 요약을 요청:**

```python
from claude_agent_sdk import ClaudeSDKClient
client = ClaudeSDKClient()

# Create a test file
with open("example.txt", "w") as f:
    f.write("""Artificial Intelligence is transforming software development.
Machine learning models can now write code, debug errors, and
automate repetitive tasks that previously required human developers.

The impact on productivity has been significant, with some teams
reporting 2-3x improvements in development speed when using AI assistance.
""")

# Ask Claude to read and analyze
response = client.query("Read the file example.txt and summarize the main points")
print(response)
```

**Output:**

```
The file discusses how Artificial Intelligence is transforming software development:

1. **Key Capabilities**: AI models can write code, debug errors, and automate tasks
2. **Automation Scope**: Handles repetitive tasks that previously required humans
3. **Productivity Impact**: Teams report 2-3x improvements in development speed when using AI assistance

The overall theme is that AI is becoming a powerful tool for enhancing developer productivity rather than replacing developers entirely.
```

## 🧠 코어 컨셉 (20분)

### 3.1 아키텍처 원리

**Design Philosophy:**

The Claude Agent SDK follows several key architectural principles:

1. **Abstraction Over Implementation**: The SDK abstracts away CLI interaction details
2. **Async-First**: All operations are designed for asynchronous execution
3. **Extensibility**: Hook system allows custom logic injection
4. **Type Safety**: Strong typing throughout with Pydantic models
5. **Transport Agnostic**: Designed to support multiple transport methods (stdio initially)

**Core Components:**

| Component | Purpose | Key Classes |
|-----------|---------|-------------|
| **Client** | Main entry point for SDK users | `ClaudeSDKClient`, `AsyncClaudeSDKClient` |
| **Hub** | Manages CLI process lifecycle | `ClaudeHub` |
| **Transport** | Communication with child process | `StdioTransport` |
| **MCP Server** | In-process tool server | `MCPServer`, `ToolRegistry` |
| **Hooks** | Lifecycle event handling | `HookRegistry`, `HookManager` |
| **Permissions** | Tool usage control | `PermissionManager` |

### 3.2 연결 흐름

**Initialization Sequence:**

```
1. ClaudeSDKClient 생성
        ↓
2. ClaudeHub 초기화
        ↓
3. MCP Server 시작 (processe에서)
        ↓
4. StdioTransport 설정
        ↓
5. Claude Code CLI 프로세스 생성
        ↓
6. 고급 초기화 검사
        ↓
7. 준비 완료 - 쿼리 가능
```

**Code Example:**

```python
from claude_agent_sdk import ClaudeSDKClient, AsyncClaudeSDKClient

# Synchronous client (blocking)
client = ClaudeSDKClient()

# Asynchronous client (non-blocking)
import asyncio
async def main():
    client = AsyncClaudeSDKClient()
    response = await client.query("Analyze this code file")
    print(response)

asyncio.run(main())
```

### 3.3 Hook System (Lifecycles)

Hooks allow you to inject custom behavior at various points in the agent lifecycle.

**Available Hooks:**

| Hook Name | Triggered When | Use Cases |
|-----------|----------------|-----------|
| `before_query` | Before sending query to Claude | Logging, validation |
| `after_query` | After receiving response | Processing, caching |
| `before_tool_call` | Before tool execution | Permission checks |
| `after_tool_call` | After tool completion | Cleanup, logging |
| `on_error` | When errors occur | Error handling, alerts |

**Basic Hook Example:**

```python
from claude_agent_sdk import ClaudeSDKClient

client = ClaudeSDKClient()

@client.hook("before_query")
def log_query(query_data):
    print(f"📤 Query: {query_data['prompt'][:50]}...")

@client.hook("after_query")
def log_response(response_data):
    print(f"📥 Response: {response_data['response'][:50]}...")

@client.hook("before_tool_call")
def check_permissions(tool_info):
    if tool_info['tool_name'] == "file_delete":
        raise PermissionError("File deletion is not allowed")

# Your hooks are now active
response = client.query("List files in current directory")
```

**Hook with State:**

```python
class QueryLogger:
    def __init__(self):
        self.query_count = 0
    
    def before_query(self, query_data):
        self.query_count += 1
        print(f"Query #{self.query_count}: {len(query_data['prompt'])} chars")
    
    def get_stats(self):
        return f"Total queries: {self.query_count}"

logger = QueryLogger()
client.hook("before_query", logger.before_query)

# Use the client... then get stats
print(logger.get_stats())  # "Total queries: 5"
```

### 3.4 MCP (Model Context Protocol) Architecture

**What is MCP?**

MCP is a protocol that allows language models to interact with tools and services. The Claude Agent SDK implements an in-process MCP server.

**Key Concepts:**

| Concept | Description |
|---------|-------------|
| **Tool** | A callable function with schema |
| **Resource** | Data that can be read by the model |
| **Prompt** | Templates for generating model input |
| **Server** | Hosts tools/resources for models |

**Tool Definition Example:**

```python
from claude_agent_sdk.mcp import tool, MCPServer
from typing import Dict, Any
import math

@tool()
def calculate(expression: str) -> str:
    """
    Evaluate mathematical expressions safely.
    
    Args:
        expression: Mathematical expression like "2 + 2" or "sqrt(16)"
    
    Returns:
        String result of calculation
    """
    try:
        # Safe evaluation with limited scope
        allowed_functions = {'sqrt': math.sqrt, 'pow': pow}
        result = eval(expression, {"__builtins__": {}}, allowed_functions)
        return f"{expression} = {result}"
    except Exception as e:
        return f"Error: {e}"

@tool()
def get_file_info(filepath: str) -> Dict[str, Any]:
    """
    Get information about a file.
    
    Args:
        filepath: Path to the file
    
    Returns:
        Dictionary with file stats
    """
    import os
    from pathlib import Path
    
    path = Path(filepath)
    if not path.exists():
        return {"error": f"File not found: {filepath}"}
    
    stats = path.stat()
    return {
        "name": path.name,
        "size": stats.st_size,
        "modified": stats.st_mtime,
        "mode": oct(stats.st_mode),
        "exists": True
    }

# Register tools with the server
server = MCPServer()
server.add_tool(calculate)
server.add_tool(get_file_info)

# Attach to client
client = ClaudeSDKClient(mcp_server=server)
```

**Using the Custom Tools:**

```python
response = client.query("Calculate 2 * (3 + 4) and get file info for 'example.txt'")
```

**Response:**

```
I'll help you with both calculations.

For the mathematical expression 2 * (3 + 4) = 2 * 7 = 14.

For the file 'example.txt', here's the information:
- Name: example.txt
- Size: 1,024 bytes
- Modified: 2025-10-15 10:30:45
- Mode: 0o100644
- Exists: Yes
```

## 🎯 주요 기능 (30분)

### 4.1 Basic Queries

**Simple Text Queries:**

```python
from claude_agent_sdk import ClaudeSDKClient

client = ClaudeSDKClient()

# Basic query
response = client.query("What is Python?")
print(response)
```

**Advanced Query with Options:**

```python
response = client.query(
    prompt="Write a Python function to reverse a string",
    model="claude-3-5-sonnet-20241022",  # Specify model
    max_tokens=2048,                      # Limit response length
    temperature=0.7                       # Control creativity
)
print(response)
```

**Structured Output:**

```python
import json

response = client.query(
    prompt="Generate a JSON with 3 programming languages and their creators",
    temperature=0.1  # Lower temperature for structured data
)

# Claude is good at JSON, but you should validate
try:
    data = json.loads(response)
    print(json.dumps(data, indent=2))
except json.JSONDecodeError:
    print("Response not valid JSON:", response)
```

### 4.2 File Operations

**Reading Files:**

```python
# Simple file operations through Claude
def read_and_analyze(filename: str) -> str:
    """Read and analyze a file using Claude."""
    client = ClaudeSDKClient()
    
    with open(filename, 'r') as f:
        content = f.read()
    
    response = client.query(
        f"""Analyze this file and provide:
        1. Brief summary (2-3 sentences)
        2. Key functions/classes
        3. Potential improvements
        
        File: {filename}
        
        ```
        {content}
        ```""",
        max_tokens=2048
    )
    
    return response

analysis = read_and_analyze("my_script.py")
print(analysis)
```

**Writing and Modifying Files:**

```python
# Ask Claude to create a file
def create_file(description: str, filename: str) -> None:
    """Use Claude to create a file based on description."""
    client = ClaudeSDKClient()
    
    response = client.query(
        f"Create a Python file that {description}. "
        f"Provide the complete code without any explanation."
    )
    
    # Strip markdown code blocks if present
    if "```python" in response:
        code = response.split("```python\n")[1].split("```")[0]
    elif "```" in response:
        code = response.split("```\n")[1].split("```")[0]
    else:
        code = response
    
    with open(filename, 'w') as f:
        f.write(code)
    
    print(f"Created: {filename}")

# Usage
create_file("finds all prime numbers up to 100", "primes.py")
```

### 4.3 Code Generation and Analysis

**Code Explanation:**

```python
def explain_code(code_snippet: str) -> str:
    """Get detailed explanation of code."""
    client = ClaudeSDKClient()
    
    response = client.query(
        f"""Explain this code in detail:
        - What it does
        - How it works
        - Key concepts
        - Potential issues
        
        ```python
        {code_snippet}
        ```
        """,
        max_tokens=2048
    )
    
    return response

# Example
complex_code = """
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)
"""

explanation = explain_code(complex_code)
print(explanation)
```

**Code Review:**

```python
def review_code(code: str, aspects: List[str] = None) -> dict:
    """
    Comprehensive code review using Claude.
    
    Args:
        code: The code to review
        aspects: Optional list of aspects to focus on
    
    Returns:
        Dictionary with review categories
    """
    if aspects is None:
        aspects = ["readability", "performance", "security", "maintainability"]
    
    client = ClaudeSDKClient()
    
    response = client.query(
        f"""Perform a code review focusing on: {', '.join(aspects)}
        
        Provide:
        1. Strengths
        2. Issues/Concerns
        3. Suggestions
        4. Overall score (1-10)
        
        Format as JSON with these keys: strengths, issues, suggestions, score
        
        ```python
        {code}
        ```""",
        max_tokens=2048,
        temperature=0.1
    )
    
    try:
        import json
        return json.loads(response)
    except:
        return {"raw_response": response}

# Usage
code_to_review = ""
def process_data(data):
    result = []
    for item in data:
        if item % 2 == 0:
            result.append(item * 2)
    return result
"""

review = review_code(code_to_review)
print(review)
```

### 4.4 Batch Processing

**Process Multiple Files:**

```python
def batch_analyze_files(filenames: List[str]) -> List[dict]:
    """Analyze multiple files in batch."""
    results = []
    
    for filename in filenames:
        try:
            with open(filename, 'r') as f:
                content = f.read()
            
            analysis = analyze_file(content)
            results.append({
                "filename": filename,
                "success": True,
                "analysis": analysis
            })
        except Exception as e:
            results.append({
                "filename": filename,
                "success": False,
                "error": str(e)
            })
    
    return results

import glob
python_files = glob.glob("*.py")
results = batch_analyze_files(python_files)
```

**Parallel Processing:**

```python
import asyncio
from typing import List

async def async_analyze_file(client: AsyncClaudeSDKClient, filename: str) -> dict:
    """Analyze a single file asynchronously."""
    try:
        with open(filename, 'r') as f:
            content = f.read()
        
        response = await client.query(
            f"Summarize this file:\n```\n{content[:1000]}\n```",
            max_tokens=512
        )
        
        return {
            "filename": filename,
            "summary": response
        }
    except Exception as e:
        return {
            "filename": filename,
            "error": str(e)
        }

async def batch_analyze_async(filenames: List[str]) -> List[dict]:
    """Analyze multiple files in parallel."""
    client = AsyncClaudeSDKClient()
    
    tasks = [
        async_analyze_file(client, filename)
        for filename in filenames
    ]
    
    results = await asyncio.gather(*tasks)
    return results

# Usage
import asyncio
files_to_analyze = ["main.py", "utils.py", "config.py"]
results = asyncio.run(batch_analyze_async(files_to_analyze))
```

## 🏗️ 아키텍처 설계 (20분)

### 5.1 Transport Layer

**Current Implementation: stdio transport**

The SDK uses standard input/output for communication with the Claude Code CLI.

**Architecture:**

```
Application Code
      ↓
ClaudeSDKClient
      ↓
ClaudeHub (Process Manager)
      ↓
StdioTransport ←→ Claude Code CLI
        ↓ (JSON RPC)
     Messages
```

**Message Format:**

```json
{
  "jsonrpc": "2.0",
  "method": "query",
  "params": {
    "prompt": "Your message here",
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 4096
  },
  "id": 1
}
```

**Extensibility:**

The transport layer is abstract:

```python
from abc import ABC, abstractmethod
from typing import Any, Dict

class Transport(ABC):
    @abstractmethod
    async def connect(self) -> None:
        """Establish connection."""
        pass
    
    @abstractmethod
    async def send(self, message: Dict[str, Any]) -> None:
        """Send message."""
        pass
    
    @abstractmethod
    async def receive(self) -> Dict[str, Any]:
        """Receive message."""
        pass
    
    @abstractmethod
    async def disconnect(self) -> None:
        """Close connection."""
        pass
```

**Future Transports:**
- HTTP/REST transport
- WebSocket transport
- Direct API transport
- Cloud service transport

### 5.2 Tool Discovery and Registration

**Dynamic Tool Loading:**

```python
class ToolRegistry:
    """Manages available tools."""
    
    def __init__(self):
        self.tools = {}
    
    def register(self, tool: BaseTool) -> None:
        """Register a tool."""
        self.tools[tool.name] = tool
    
    def get_schema(self) -> Dict[str, Any]:
        """Get JSON schema for all tools."""
        return {
            name: tool.schema() for name, tool in self.tools.items()
        }
    
    async def execute(self, tool_name: str, arguments: Dict[str, Any]) -> Any:
        """Execute a tool."""
        if tool_name not in self.tools:
            raise ValueError(f"Unknown tool: {tool_name}")
        
        tool = self.tools[tool_name]
        return await tool.execute(**arguments)
```

**Tool Discovery Flow:**

```
1. ToolRegistry 초기화 중
        ↓
2. @tool 데코레이터를 사용하여 도구 스캔
        ↓
3. 함수 시그니처를 기반으로 JSON 스키마 생성
        ↓
4. 클라이언트에 도구 정의 전송
        ↓
5. Claude에 사용 가능한 도구 표시
        ↓
6. 도구 호출 시 실행
```

**Tool Lifecycle:**

```python
@tool(name="calculator")
def calculate(expression: str, precision: int = 2) -> str:
    """
    Calculator tool with automatic schema generation.
    
    The @tool decorator:
    1. Inspects function signature
    2. Generates JSON schema from type hints
    3. Registers with ToolRegistry
    4. Handles execution
    """
    pass
```

### 5.3 Permission System

**Granular Tool Control:**

```python
class PermissionManager:
    """Manages tool access control."""
    
    def __init__(self):
        # Permissions hierarchy
        # DENY > ALLOW > DEFAULT
        self.permissions: Dict[str, Dict[str, str]] = {}
    
    def set_permission(self, tool_name: str, action: str, permission: str):
        """
        Set permission for a tool action.
        
        Args:
            tool_name: Name of the tool
            action: Action to control (execute, read, write)
            permission: DENY, ALLOW, or DEFAULT
        """
        if tool_name not in self.permissions:
            self.permissions[tool_name] = {}
        
        self.permissions[tool_name][action] = permission
    
    def check_permission(self, tool_name: str, action: str) -> bool:
        """Check if action is allowed."""
        tool_perms = self.permissions.get(tool_name, {})
        permission = tool_perms.get(action, "DEFAULT")
        
        if permission == "DENY":
            return False
        elif permission == "ALLOW":
            return True
        else:  # DEFAULT
            return self._check_default_policy(tool_name, action)
    
    def _check_default_policy(self, tool_name: str, action: str) -> bool:
        """Check default policy for tool/action."""
        # Default policies
        dangerous_tools = ["file_delete", "shell_exec", "format_disk"]
        
        if tool_name in dangerous_tools and action == "execute":
            return False  # Deny by default
        
        return True  # Allow by default
```

**Permission Configuration:**

```python
# Initialize with safe defaults
permissions = PermissionManager()

# Allow read operations
permissions.set_permission("file_reader", "execute", "ALLOW")
permissions.set_permission("file_reader", "write", "DENY")

# Deny dangerous operations
permissions.set_permission("file_delete", "execute", "DENY")
permissions.set_permission("shell_exec", "execute", "DENY")

# Attach to client
client = ClaudeSDKClient(permission_manager=permissions)
```

### 5.4 Error Handling and Recovery

**Error Hierarchy:**

```python
class ClaudeSDKError(Exception):
    """Base SDK error."""
    pass

class TransportError(ClaudeSDKError):
    """Communication error with Claude."""
    pass

class ToolError(ClaudeSDKError):
    """Tool execution error."""
    pass

class PermissionError(ClaudeSDKError):
    """Permission denied."""
    pass

class TimeoutError(ClaudeSDKError):
    """Operation timeout."""
    pass
```

**Automatic Retry Logic:**

```python
from typing import Callable, Any
import asyncio
from functools import wraps

async def retry_async(
    func: Callable,
    max_retries: int = 3,
    backoff_factor: float = 2.0,
    exceptions: tuple = (TransportError,)
) -> Any:
    """Execute function with automatic retry."""
    
    last_exception = None
    
    for attempt in range(max_retries + 1):
        try:
            return await func()
        except exceptions as e:
            if attempt == max_retries:
                raise
            
            # Calculate backoff
            wait_time = backoff_factor ** attempt
            print(f"Attempt {attempt + 1} failed: {e}")
            print(f"Retrying in {wait_time} seconds...")
            
            await asyncio.sleep(wait_time)
            last_exception = e
    
    raise last_exception

# Usage
async def query_with_retry(client, prompt: str):
    return await retry_async(
        lambda: client.query(prompt),
        max_retries=3,
        exceptions=(TransportError, TimeoutError)
    )
```

**Connection Recovery:**

```python
class ResilientClient:
    """Client with automatic reconnection."""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.client = None
        self._connect()
    
    def _connect(self):
        """Establish connection or reconnect."""
        self.client = ClaudeSDKClient(**self.config)
    
    async def query_with_recovery(self, prompt: str) -> str:
        """Query with automatic recovery."""
        try:
            return await self.client.query(prompt)
        except TransportError:
            print("Connection lost, reconnecting...")
            self._connect()
            return await self.client.query(prompt)
```

**Circuit Breaker Pattern:**

```python
from enum import Enum, auto
from datetime import datetime, timedelta

class CircuitState(Enum):
    CLOSED = auto()      # Normal operation
    OPEN = auto()        # Failing, reject requests
    HALF_OPEN = auto()   # Test if recovered

class CircuitBreaker:
    def __init__(self, failure_threshold: int = 5, recovery_timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.last_failure_time = None
        self.next_attempt = None
    
    async def call(self, func):
        """Execute with circuit breaker."""
        
        if self.state == CircuitState.OPEN:
            if datetime.now() >= self.next_attempt:
                self.state = CircuitState.HALF_OPEN
            else:
                raise Exception("Circuit breaker is OPEN")
        
        try:
            result = await func()
            self._on_success()
            return result
        except Exception as e:
            self._on_failure()
            raise
    
    def _on_success(self):
        """Reset on success."""
        self.state = CircuitState.CLOSED
        self.failure_count = 0
    
    def _on_failure(self):
        """Increment failure count."""
        self.failure_count += 1
        self.last_failure_time = datetime.now()
        
        if self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN
            self.next_attempt = datetime.now() + timedelta(seconds=self.recovery_timeout)
```

---