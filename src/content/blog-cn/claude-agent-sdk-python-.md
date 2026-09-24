---
title: 'Claude Agent SDK (Python) 学习指南'
pubDate: 2025-10-15T03:15:48.639Z
description: 'Claude Agent SDK (Python) 全方位学习指南：从架构原理、核心功能到实战案例，助您掌握如何通过 Python 编程方式高效集成与扩展 Claude Code 的强大能力。'
author: 'Remy'
tags: ['claude-code', 'vibe-coding', 'python']
---
**文档版本**: 1.0
**生成时间**: 2025-10-15
**SDK 版本**: 0.1.3
**学习级别**: 标准级（预计学习时间：2-4 小时）
**目标用户**: Python 开发者（中级）

---

## 目录

1. [项目概述](#-项目概述)
2. [快速开始（15 分钟）](#-快速开始15-分钟)
3. [核心概念（20 分钟）](#-核心概念20-分钟)
4. [主要功能（30 分钟）](#-主要功能30-分钟)
5. [架构设计（20 分钟）](#-架构设计20-分钟)
6. [实战示例（30 分钟）](#-实战示例30-分钟)
7. [学习路径建议](#-学习路径建议)
8. [常见问题与故障排查](#-常见问题与故障排查)
9. [参考资料](#-参考资料)
10. [附录](#-附录)

---

## 📖 项目概述

### 1.1 项目简介

**Claude Agent SDK for Python** 是 Anthropic 官方提供的 Python SDK，用于以编程方式与 Claude Code 交互。它封装了 Claude Code CLI，提供了简洁的 Pythonic API，支持：

- **双向对话**：与 Claude 进行多轮交互式对话
- **自定义工具**：通过进程内 MCP 服务器扩展 Claude 的能力
- **Hook 系统**：在工具执行前后注入自定义逻辑
- **权限控制**：细粒度的工具使用权限管理
- **异步优先**：基于 `anyio` 的跨平台异步支持

**项目类型**: SDK / 开发者库
**编程语言**: Python 3.10+
**许可证**: MIT
**仓库地址**: https://github.com/anthropics/claude-agent-sdk-python

### 1.2 核心特性

1. **两种使用模式**
   - `query()`: 简单的一次性查询，适用于无状态场景
   - `ClaudeSDKClient`: 交互式双向对话，适用于有状态场景

2. **进程内 MCP 工具**
   - 使用 `@tool` 装饰器快速定义自定义工具
   - 无需独立进程，性能优于外部 MCP 服务器
   - 直接访问应用程序状态和变量

3. **强大的控制能力**
   - Hook 系统：PreToolUse、PostToolUse 等生命周期钩子
   - 权限回调：动态决策工具使用权限
   - 中断支持：随时停止长时间运行的任务

4. **类型安全**
   - 完整的类型注解（支持 mypy）
   - 强类型消息和内容块
   - IDE 自动补全和类型检查

5. **异步设计**
   - 基于 `anyio` 支持 asyncio 和 trio
   - 流式消息处理，低内存占用
   - 并发任务管理

### 1.3 适用场景

**适合使用 SDK 的场景**：
- 构建聊天应用或对话式 UI
- 自动化代码生成和分析工具
- 集成 Claude 到现有 Python 应用
- 创建自定义开发助手或 CI/CD 工具
- 需要自定义工具和权限控制的企业级应用

**不适合的场景**：
- 简单的一次性脚本（直接使用 CLI 更简单）
- 非 Python 项目（考虑其他语言的 SDK）
- 不需要编程控制的交互（使用 Claude Code GUI）

### 1.4 学习目标

完成本指南后，你将能够：

✅ 理解 Claude Agent SDK 的架构和工作原理
✅ 使用 `query()` 和 `ClaudeSDKClient` 进行基本和高级查询
✅ 创建自定义 MCP 工具扩展 Claude 的能力
✅ 使用 Hook 系统实现自动化和权限控制
✅ 调试和解决常见问题
✅ 设计和实现生产级 Claude 集成

---

## 🚀 快速开始（15 分钟）

### 2.1 前置知识要求

#### 必需知识
- **Python 基础 (3.10+)**: 数据类型、类、装饰器、异步编程
- **异步编程**: `async`/`await`、异步迭代器、`anyio` 基础
- **类型提示**: `typing` 模块、TypedDict、Literal

#### 推荐知识
- **进程间通信**: stdin/stdout/stderr、子进程管理
- **JSON**: JSON 序列化/反序列化
- **MCP 协议**: Model Context Protocol 基础（可选）

### 2.2 环境准备

#### 步骤 1: 检查 Python 版本

```bash
python --version
# 需要 3.10 或更高版本
```

如果版本过低，请升级：
```bash
# Ubuntu/Debian
sudo apt install python3.10

# macOS
brew install python@3.10

# Windows: 从 https://python.org/downloads/ 下载
```

#### 步骤 2: 安装 Claude Code CLI

Claude Code CLI 是 SDK 的必需依赖。

```bash
# 安装 Claude Code CLI
npm install -g @anthropic-ai/claude-code

# 验证安装
claude -v
# 应显示 2.0.0 或更高版本
```

#### 步骤 3: 设置 API Key

```bash
# Linux/macOS
export ANTHROPIC_API_KEY="sk-ant-api03-your-key-here"

# Windows (PowerShell)
$env:ANTHROPIC_API_KEY = "sk-ant-api03-your-key-here"

# 永久设置（Linux/macOS）
echo 'export ANTHROPIC_API_KEY="sk-ant-api03-..."' >> ~/.bashrc
source ~/.bashrc
```

从 https://platform.claude.com/ 获取 API Key。

#### 步骤 4: 安装 SDK

```bash
# 方法 1: 从 PyPI 安装（推荐）
pip install claude-agent-sdk

# 方法 2: 从源码安装（开发环境）
cd claude-agent-sdk-python
pip install -e .
```

#### 步骤 5: 验证安装

```bash
python -c "import claude_agent_sdk; print(claude_agent_sdk.__version__)"
# 应显示: 0.1.3
```

### 2.3 第一个示例

创建文件 `hello_claude.py`:

```python
#!/usr/bin/env python3
"""第一个 Claude Agent SDK 示例"""

import anyio
from claude_agent_sdk import query, AssistantMessage, TextBlock

async def main():
    """简单的查询示例"""
    print("向 Claude 提问...")

    async for message in query(prompt="What is 2 + 2?"):
        if isinstance(message, AssistantMessage):
            for block in message.content:
                if isinstance(block, TextBlock):
                    print(f"Claude: {block.text}")

if __name__ == "__main__":
    anyio.run(main)
```

运行：
```bash
python hello_claude.py
```

预期输出：
```
向 Claude 提问...
Claude: 2 + 2 equals 4.
```

### 2.4 验证安装

如果上述示例成功运行，恭喜！你已经完成了基础设置。

如果遇到错误：
- `CLINotFoundError`: 检查 Claude Code CLI 是否已安装
- `ImportError`: 检查 SDK 是否已正确安装
- `ProcessError`: 检查 API Key 是否已设置

参见 [常见问题](#-常见问题与故障排查) 获取详细的故障排查指南。

---

## 📚 核心概念（20 分钟）

### 3.1 核心概念清单

按学习优先级排序：

1. **Claude Code CLI** ⭐⭐⭐⭐⭐ - 底层执行引擎
2. **Claude Agent SDK** ⭐⭐⭐⭐⭐ - Python 封装层
3. **消息类型** ⭐⭐⭐⭐⭐ - 数据结构
4. **Tools** ⭐⭐⭐⭐⭐ - 工具系统
5. **MCP** ⭐⭐⭐⭐ - Model Context Protocol
6. **Hooks** ⭐⭐⭐⭐ - 生命周期钩子
7. **权限系统** ⭐⭐⭐⭐ - 安全控制
8. **anyio** ⭐⭐⭐⭐ - 异步库
9. **Transport** ⭐⭐⭐ - 传输层抽象
10. **Agent Definitions** ⭐⭐⭐ - 自定义代理

### 3.2 概念详解

#### 概念 1: Claude Code CLI

**定义**: Anthropic 官方命令行工具，提供 Claude AI 能力的底层接口。

**作用**: SDK 通过子进程调用 CLI，CLI 负责与 Anthropic API 通信。

**安装**: `npm install -g @anthropic-ai/claude-code`

**关键点**:
- 版本要求: ≥ 2.0.0
- 通过 stdin/stdout 使用 JSONL 格式通信
- 支持流式模式（双向通信）

#### 概念 2: Claude Agent SDK

**定义**: Python SDK，封装 CLI，提供 Pythonic API。

**两种使用模式**:
- `query()`: 无状态、单次查询
- `ClaudeSDKClient`: 有状态、交互式会话

**核心优势**:
- 简化接口
- 类型安全
- 进程内 MCP 工具
- Hook 和权限控制

#### 概念 3: 消息类型

**定义**: SDK 中不同类型的消息结构。

**主要类型**:
- `UserMessage`: 用户消息
- `AssistantMessage`: Claude 的回复
- `SystemMessage`: 系统消息
- `ResultMessage`: 结果和成本信息
- `StreamEvent`: 流式事件

**内容块类型**:
- `TextBlock`: 文本内容
- `ThinkingBlock`: 思考内容
- `ToolUseBlock`: 工具调用
- `ToolResultBlock`: 工具结果

#### 概念 4: Tools

**定义**: Claude 可以调用的函数，用于执行特定任务。

**两种工具类型**:
- **内置工具**: Read、Write、Bash、Edit、Glob、Grep 等
- **自定义工具**: 使用 `@tool` 装饰器定义

**示例**:
```python
from claude_agent_sdk import tool

@tool("add", "Add two numbers", {"a": float, "b": float})
async def add_numbers(args):
    result = args["a"] + args["b"]
    return {
        "content": [{"type": "text", "text": f"Result: {result}"}]
    }
```

#### 概念 5: MCP (Model Context Protocol)

**定义**: 标准协议，定义工具如何与 AI 模型通信。

**SDK 实现**:
- **SDK MCP Server** (进程内): 使用 `create_sdk_mcp_server()` 创建
- **External MCP Server** (外部进程): 通过 stdio/SSE/HTTP 通信

**优势**:
- 标准化工具接口
- 支持多种传输方式
- 可扩展

#### 概念 6: Hooks

**定义**: 在 Claude 代理循环的特定点执行的回调函数。

**支持的钩子事件**:
- `PreToolUse`: 工具使用前（权限控制）
- `PostToolUse`: 工具使用后（添加上下文）
- `UserPromptSubmit`: 用户提交提示词后
- `Stop`: 停止事件
- `SubagentStop`: 子代理停止
- `PreCompact`: 压缩前

**使用场景**:
- 日志记录
- 动态权限控制
- 工具行为修改
- 审计和监控

#### 概念 7: 权限系统

**定义**: 控制 Claude 可以执行哪些操作。

**权限模式**:
- `default`: CLI 提示用户确认危险操作
- `acceptEdits`: 自动批准文件编辑
- `plan`: 规划模式，不执行任何工具
- `bypassPermissions`: 绕过所有权限检查（危险！）

**权限回调**:
```python
async def permission_callback(tool_name, input_data, context):
    if tool_name == "Bash" and "rm -rf" in input_data.get("command", ""):
        return PermissionResultDeny(message="Dangerous command")
    return PermissionResultAllow()
```

#### 概念 8: anyio

**定义**: 跨异步运行时库，统一 asyncio 和 trio API。

**为什么使用**:
- 提供统一的异步 API
- 支持多种异步后端
- 简化跨平台异步编程

**基本用法**:
```python
import anyio

async def main():
    await anyio.sleep(1)
    async with anyio.create_task_group() as tg:
        tg.start_soon(task1)
        tg.start_soon(task2)

anyio.run(main)
```

### 3.3 概念关系图

```
外部依赖层
┌─────────────────────────────────────────┐
│ Node.js → Claude Code CLI (>=2.0.0)     │
│ Python 3.10+ → anyio → mcp              │
└─────────────────────────────────────────┘
            ↓
协议层
┌─────────────────────────────────────────┐
│ MCP (Model Context Protocol)            │
│ SDK Control Protocol                    │
└─────────────────────────────────────────┘
            ↓
SDK 核心层
┌─────────────────────────────────────────┐
│ Claude Agent SDK                        │
│   ├─ query() [简单查询]                 │
│   └─ ClaudeSDKClient [交互式会话]        │
└─────────────────────────────────────────┘
            ↓
功能层
┌─────────────────────────────────────────┐
│ 工具系统 | 权限系统 | 钩子系统           │
└─────────────────────────────────────────┘
            ↓
应用层
┌─────────────────────────────────────────┐
│ 你的 Python 应用                         │
└─────────────────────────────────────────┘
```

### 3.4 学习顺序建议

```
第1步: Python 基础 + 异步编程
  ↓
第2步: Claude Code CLI 安装和基本使用
  ↓
第3步: Claude Agent SDK 基础 (query 函数)
  ↓
第4步: 消息类型和内容块
  ↓
第5步: MCP 协议和工具系统
  ↓
第6步: ClaudeSDKClient 交互式会话
  ↓
第7步: 权限系统
  ↓
第8步: Hooks 钩子系统
```

---

## 🔧 主要功能（30 分钟）

### 4.1 API 概览

Claude Agent SDK 提供两个主要接口：

| API | 使用场景 | 特点 |
|-----|----------|------|
| `query()` | 简单查询、批处理 | 无状态、单向流式 |
| `ClaudeSDKClient` | 交互式应用、多轮对话 | 有状态、双向流式 |

### 4.2 两种使用模式

#### 模式 1: query() 函数

**适用场景**: 简单的一次性查询、批处理任务。

**基本用法**:
```python
from claude_agent_sdk import query

async for message in query(prompt="What is 2 + 2?"):
    print(message)
```

**带选项的查询**:
```python
from claude_agent_sdk import query, ClaudeAgentOptions

options = ClaudeAgentOptions(
    system_prompt="You are a helpful assistant",
    allowed_tools=["Read", "Write"],
    max_turns=5
)

async for message in query(prompt="Create a hello.txt file", options=options):
    print(message)
```

**特点**:
- 无状态，每次调用独立
- 自动管理连接生命周期
- 适合脚本和自动化

#### 模式 2: ClaudeSDKClient 类

**适用场景**: 多轮对话、需要中断控制、实时应用。

**基本用法**:
```python
from claude_agent_sdk import ClaudeSDKClient

async with ClaudeSDKClient() as client:
    # 第一轮
    await client.query("What's the capital of France?")
    async for msg in client.receive_response():
        print(msg)

    # 第二轮（保持上下文）
    await client.query("What's its population?")
    async for msg in client.receive_response():
        print(msg)
```

**核心方法**:
- `connect()`: 建立连接
- `query(prompt)`: 发送查询
- `receive_messages()`: 接收所有消息
- `receive_response()`: 接收单次完整响应
- `interrupt()`: 发送中断
- `set_permission_mode(mode)`: 修改权限模式
- `disconnect()`: 断开连接

**特点**:
- 有状态，维护对话上下文
- 支持中断和动态配置
- 适合聊天应用和交互式 UI

### 4.3 配置选项

#### ClaudeAgentOptions 常用配置

```python
from claude_agent_sdk import ClaudeAgentOptions

options = ClaudeAgentOptions(
    # 系统提示
    system_prompt="You are a helpful assistant",

    # 工具权限
    allowed_tools=["Read", "Write", "Bash"],
    disallowed_tools=["Edit"],

    # 权限模式
    permission_mode="default",  # 或 "acceptEdits", "plan", "bypassPermissions"

    # 对话限制
    max_turns=10,

    # 模型选择
    model="claude-sonnet-4-5",

    # 工作目录
    cwd="/path/to/project",

    # MCP 服务器
    mcp_servers={
        "my-server": {...}
    },

    # 工具权限回调
    can_use_tool=my_permission_callback,

    # Hook 配置
    hooks={
        "PreToolUse": [HookMatcher(...)],
        "PostToolUse": [HookMatcher(...)]
    },

    # 流式设置
    include_partial_messages=True
)
```

### 4.4 消息类型

#### 消息类型层次

```python
Message = UserMessage | AssistantMessage | SystemMessage | ResultMessage | StreamEvent
```

#### UserMessage

```python
from claude_agent_sdk import UserMessage

# 文本消息
user_msg = UserMessage(
    content="Hello Claude",
    parent_tool_use_id=None
)

# 内容块列表
user_msg = UserMessage(
    content=[
        {"type": "text", "text": "Hello"},
        {"type": "image", "source": {...}}
    ],
    parent_tool_use_id=None
)
```

#### AssistantMessage

```python
from claude_agent_sdk import AssistantMessage, TextBlock, ToolUseBlock

for message in messages:
    if isinstance(message, AssistantMessage):
        for block in message.content:
            if isinstance(block, TextBlock):
                print(f"Text: {block.text}")
            elif isinstance(block, ToolUseBlock):
                print(f"Tool: {block.name}, Input: {block.input}")
```

#### ResultMessage

```python
from claude_agent_sdk import ResultMessage

if isinstance(message, ResultMessage):
    print(f"Duration: {message.duration_ms} ms")
    print(f"Cost: ${message.total_cost_usd}")
    print(f"Turns: {message.num_turns}")
    print(f"Error: {message.is_error}")
```

### 4.5 自定义工具

#### 创建 SDK MCP 服务器

```python
from claude_agent_sdk import tool, create_sdk_mcp_server, ClaudeAgentOptions

# 1. 定义工具
@tool("calculate_sum", "Add two numbers", {"a": float, "b": float})
async def calculate_sum(args):
    result = args["a"] + args["b"]
    return {
        "content": [{"type": "text", "text": f"Sum: {result}"}]
    }

# 2. 创建服务器
server = create_sdk_mcp_server(
    name="math-tools",
    version="1.0.0",
    tools=[calculate_sum]
)

# 3. 配置选项
options = ClaudeAgentOptions(
    mcp_servers={"math": server},
    allowed_tools=["mcp__math__calculate_sum"]
)

# 4. 使用
async with ClaudeSDKClient(options=options) as client:
    await client.query("Calculate 15 + 27")
    async for msg in client.receive_response():
        print(msg)
```

#### 工具返回格式

```python
# 成功返回
return {
    "content": [
        {"type": "text", "text": "Result: 42"}
    ]
}

# 错误返回
return {
    "content": [
        {"type": "text", "text": "Error: Division by zero"}
    ],
    "is_error": True
}
```

### 4.6 Hook 系统

#### PreToolUse Hook

```python
from claude_agent_sdk import HookMatcher, ClaudeAgentOptions

async def check_bash_command(input_data, tool_use_id, context):
    if input_data["tool_name"] != "Bash":
        return {}

    command = input_data["tool_input"].get("command", "")
    if "rm -rf" in command:
        return {
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": "Dangerous command blocked"
            }
        }
    return {}

options = ClaudeAgentOptions(
    hooks={
        "PreToolUse": [
            HookMatcher(matcher="Bash", hooks=[check_bash_command])
        ]
    }
)
```

#### PostToolUse Hook

```python
async def add_context(input_data, tool_use_id, context):
    if input_data["tool_name"] == "Read":
        return {
            "hookSpecificOutput": {
                "hookEventName": "PostToolUse",
                "additionalContext": "This file is part of the main codebase"
            }
        }
    return {}

options = ClaudeAgentOptions(
    hooks={
        "PostToolUse": [
            HookMatcher(matcher="Read", hooks=[add_context])
        ]
    }
)
```

---

## 🏗️ 架构设计（20 分钟）

### 5.1 整体架构

```
┌─────────────────────────────────────────┐
│ 用户 API 层 (query, ClaudeSDKClient)    │
├─────────────────────────────────────────┤
│ 业务逻辑层 (消息处理、Hook、权限)         │
├─────────────────────────────────────────┤
│ 传输层 (Transport 抽象)                  │
├─────────────────────────────────────────┤
│ CLI 接口层 (subprocess + JSONL)          │
└─────────────────────────────────────────┘
```

### 5.2 核心模块

#### 目录结构

```
src/claude_agent_sdk/
├── __init__.py              # 公共 API 导出
├── query.py                 # query() 函数
├── client.py                # ClaudeSDKClient 类
├── types.py                 # 类型定义
├── _errors.py               # 错误类型
└── _internal/               # 内部实现
    ├── client.py            # InternalClient
    ├── query.py             # Query 控制协议
    ├── message_parser.py    # 消息解析
    └── transport/           # 传输层
        ├── __init__.py      # Transport 抽象
        └── subprocess_cli.py # 子进程传输
```

#### 模块职责

- **query.py**: 无状态查询接口
- **client.py**: 有状态交互式客户端
- **types.py**: 所有数据类型和类型注解
- **_internal/query.py**: 双向控制协议管理
- **_internal/transport/**: 与 CLI 通信

### 5.3 数据流

#### 查询流程

```
用户调用 query(prompt, options)
    ↓
InternalClient.process_query()
    ↓
创建 SubprocessCLITransport
    ↓
启动 Claude Code CLI 子进程
    ↓
创建 Query 对象处理控制协议
    ↓
发送消息到 CLI stdin
    ↓
从 CLI stdout 读取响应
    ↓
解析 JSON → Message 对象
    ↓
返回 AsyncIterator[Message]
```

#### 交互式流程

```
用户创建 ClaudeSDKClient
    ↓
connect() - 建立连接
    ↓
query(prompt) - 发送消息
    ↓
receive_response() - 接收响应
    ↓
(可选) interrupt() - 中断
    ↓
(可选) 发送新查询
    ↓
disconnect() - 断开连接
```

### 5.4 设计模式

#### 1. 装饰器模式 (@tool)

```python
@tool("add", "Add two numbers", {"a": float, "b": float})
async def add_numbers(args):
    return {"content": [...]}
```

**优点**: 声明式 API，自动类型转换

#### 2. 工厂模式 (create_sdk_mcp_server)

```python
server = create_sdk_mcp_server(
    name="calculator",
    tools=[add_numbers]
)
```

**优点**: 封装复杂配置逻辑

#### 3. 上下文管理器 (async with)

```python
async with ClaudeSDKClient() as client:
    # 自动管理连接生命周期
    pass
```

**优点**: 自动资源清理，异常安全

#### 4. 策略模式 (Transport)

```python
class Transport(ABC):
    @abstractmethod
    async def connect(self): ...
    @abstractmethod
    async def write(self, data): ...
```

**优点**: 可插拔传输实现

---

## 💡 实战示例（30 分钟）

### 6.1 示例索引

| 文件名 | 功能描述 | 复杂度 |
|--------|----------|--------|
| quick_start.py | 基础查询、配置选项 | 简单 |
| streaming_mode.py | 完整的流式模式示例 | 复杂 |
| mcp_calculator.py | SDK MCP 服务器 | 中等 |
| hooks.py | Hook 系统 | 复杂 |
| tool_permission_callback.py | 工具权限回调 | 中等 |
| agents.py | 自定义 Agent | 中等 |
| system_prompt.py | 系统提示配置 | 简单 |

**示例路径**: `C:\Users\Remy\sensedeal\code\projects\work\claude-sdk\claude-agent-sdk-python\examples\`

### 6.2 基础示例

#### 示例 1: 简单查询

```python
import anyio
from claude_agent_sdk import query, AssistantMessage, TextBlock

async def main():
    async for message in query(prompt="What is 2 + 2?"):
        if isinstance(message, AssistantMessage):
            for block in message.content:
                if isinstance(block, TextBlock):
                    print(f"Claude: {block.text}")

anyio.run(main)
```

#### 示例 2: 带配置的查询

```python
from claude_agent_sdk import query, ClaudeAgentOptions

options = ClaudeAgentOptions(
    system_prompt="You are a pirate. Speak like a pirate!",
    allowed_tools=["Read"],
    max_turns=1
)

async for message in query(prompt="Tell me a joke", options=options):
    print(message)
```

### 6.3 进阶示例

#### 示例 3: 多轮对话

```python
from claude_agent_sdk import ClaudeSDKClient, AssistantMessage, TextBlock

async def main():
    async with ClaudeSDKClient() as client:
        # 第一轮
        await client.query("What's the capital of France?")
        async for msg in client.receive_response():
            if isinstance(msg, AssistantMessage):
                for block in msg.content:
                    if isinstance(block, TextBlock):
                        print(f"A1: {block.text}")

        # 第二轮（保持上下文）
        await client.query("What's the population?")
        async for msg in client.receive_response():
            if isinstance(msg, AssistantMessage):
                for block in msg.content:
                    if isinstance(block, TextBlock):
                        print(f"A2: {block.text}")

anyio.run(main)
```

#### 示例 4: 自定义工具

```python
from claude_agent_sdk import (
    tool,
    create_sdk_mcp_server,
    ClaudeAgentOptions,
    ClaudeSDKClient
)

@tool("get_weather", "Get weather for a city", {"city": str})
async def get_weather(args):
    # 模拟 API 调用
    city = args["city"]
    return {
        "content": [
            {"type": "text", "text": f"Weather in {city}: Sunny, 25°C"}
        ]
    }

server = create_sdk_mcp_server("weather", tools=[get_weather])

options = ClaudeAgentOptions(
    mcp_servers={"weather": server},
    allowed_tools=["mcp__weather__get_weather"]
)

async def main():
    async with ClaudeSDKClient(options=options) as client:
        await client.query("What's the weather in Paris?")
        async for msg in client.receive_response():
            print(msg)

anyio.run(main)
```

### 6.4 高级示例

#### 示例 5: Hook 拦截

```python
from claude_agent_sdk import (
    ClaudeSDKClient,
    ClaudeAgentOptions,
    HookMatcher
)

async def log_tool_use(input_data, tool_use_id, context):
    tool_name = input_data["tool_name"]
    print(f"[LOG] Tool used: {tool_name}")

    # 拒绝危险命令
    if tool_name == "Bash":
        command = input_data["tool_input"].get("command", "")
        if "rm -rf" in command:
            return {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "deny",
                    "permissionDecisionReason": "Dangerous command blocked"
                }
            }

    return {}

options = ClaudeAgentOptions(
    allowed_tools=["Bash", "Read"],
    hooks={
        "PreToolUse": [
            HookMatcher(matcher=None, hooks=[log_tool_use])
        ]
    }
)

async def main():
    async with ClaudeSDKClient(options=options) as client:
        await client.query("Run: echo hello")
        async for msg in client.receive_response():
            print(msg)

anyio.run(main)
```

#### 示例 6: 权限回调

```python
from claude_agent_sdk import (
    ClaudeAgentOptions,
    ClaudeSDKClient,
    PermissionResultAllow,
    PermissionResultDeny
)

async def safe_permission(tool_name, input_data, context):
    # 自动允许只读工具
    if tool_name in ["Read", "Grep", "Glob"]:
        return PermissionResultAllow()

    # 拒绝危险 Bash 命令
    if tool_name == "Bash":
        command = input_data.get("command", "")
        if "rm -rf" in command or "sudo" in command:
            return PermissionResultDeny(
                message="Dangerous command blocked"
            )

    # 修改写入路径
    if tool_name == "Write":
        safe_path = f"/tmp/{input_data['file_path'].split('/')[-1]}"
        return PermissionResultAllow(
            updated_input={**input_data, "file_path": safe_path}
        )

    return PermissionResultAllow()

options = ClaudeAgentOptions(
    can_use_tool=safe_permission
)

async def main():
    async with ClaudeSDKClient(options=options) as client:
        await client.query("Create a file called test.txt")
        async for msg in client.receive_response():
            print(msg)

anyio.run(main)
```

---

## 🎓 学习路径建议

### 7.1 初学者路径（1-2 天）

**目标**: 掌握基础用法，能够进行简单查询和配置。

**学习步骤**:

1. **环境搭建（1 小时）**
   - 安装 Python 3.10+
   - 安装 Claude Code CLI
   - 安装 SDK
   - 运行第一个示例

2. **理解核心概念（2 小时）**
   - 阅读 [核心概念](#-核心概念20-分钟) 部分
   - 理解 Claude Code CLI 和 SDK 的关系
   - 理解消息类型

3. **基础 API（2 小时）**
   - 学习 `query()` 函数
   - 尝试不同的 `ClaudeAgentOptions`
   - 运行 `examples/quick_start.py`

4. **实践项目（3 小时）**
   - 创建一个简单的代码生成工具
   - 实现一个问答机器人
   - 尝试不同的系统提示

**推荐资源**:
- 官方文档: https://platform.claude.com/docs/en/agent-sdk/python
- 示例代码: `examples/quick_start.py`
- 教程视频: (待官方发布)

### 7.2 进阶用户路径（3-5 天）

**目标**: 掌握交互式客户端、自定义工具、Hook 系统。

**学习步骤**:

1. **ClaudeSDKClient 深入（4 小时）**
   - 学习多轮对话
   - 理解会话管理
   - 掌握中断机制
   - 运行 `examples/streaming_mode.py`

2. **自定义工具（4 小时）**
   - 理解 MCP 协议
   - 创建 SDK MCP 服务器
   - 定义自定义工具
   - 运行 `examples/mcp_calculator.py`

3. **Hook 系统（4 小时）**
   - 理解 Hook 类型
   - 实现 PreToolUse 和 PostToolUse Hook
   - 掌握权限控制
   - 运行 `examples/hooks.py`

4. **实践项目（8 小时）**
   - 创建一个集成自定义 API 的工具
   - 实现一个安全审计系统（使用 Hook）
   - 构建一个多轮对话的聊天应用

**推荐资源**:
- Hook 文档: https://code.claude.com/docs/en/hooks
- MCP 文档: https://code.claude.com/docs/en/mcp
- 示例代码: `examples/` 目录

### 7.3 高级用户路径（1-2 周）

**目标**: 深入源码、性能优化、生产环境部署。

**学习步骤**:

1. **架构深入（6 小时）**
   - 阅读 [架构设计](#-架构设计20-分钟) 部分
   - 研究源码: `src/claude_agent_sdk/`
   - 理解传输层和控制协议
   - 阅读设计模式实现

2. **高级功能（8 小时）**
   - 自定义 Transport 实现
   - Agent Definitions
   - 会话管理和分叉
   - 实时部分消息流

3. **性能优化（6 小时）**
   - 并发查询优化
   - 内存管理
   - 工具性能分析
   - 缓存策略

4. **生产环境（10 小时）**
   - 错误处理和重试机制
   - 日志和监控
   - 安全加固
   - Docker 容器化
   - CI/CD 集成

5. **开源贡献（可选）**
   - 提交 Bug 报告
   - 贡献代码
   - 编写文档
   - 分享使用案例

**推荐资源**:
- 源码: https://github.com/anthropics/claude-agent-sdk-python
- 贡献指南: `CONTRIBUTING.md`
- Discord 社区: https://discord.com/invite/anthropic

---

## ❓ 常见问题与故障排查

### 8.1 快速诊断

```
遇到问题？
├─ 安装问题？
│  ├─ Python 版本 < 3.10 → 升级 Python
│  ├─ claude-code 未找到 → npm install -g @anthropic-ai/claude-code
│  └─ pip 安装失败 → 使用虚拟环境
│
├─ 运行时错误？
│  ├─ CLINotFoundError → 检查 CLI 安装
│  ├─ ProcessError → 检查 API Key
│  ├─ CLIJSONDecodeError → 检查 CLI 版本
│  └─ MessageParseError → 更新 SDK 和 CLI
│
├─ API 使用问题？
│  ├─ 消息未收到 → 检查是否使用 async for
│  ├─ 中断不生效 → 确保后台消费消息
│  ├─ Hook 未触发 → 检查 matcher 和 allowed_tools
│  └─ 工具未识别 → 检查命名格式 mcp__<server>__<tool>
│
└─ 性能问题？
   ├─ 响应慢 → 限制 max_turns、选择更快模型
   └─ 内存高 → 使用流式处理、定期清理会话
```

### 8.2 常见问题 TOP 10

#### 1. Python 版本不兼容

**症状**: `ImportError: cannot import name 'AsyncIterator'`

**解决**: 升级到 Python 3.10+
```bash
python --version
# 如果 < 3.10，安装新版本
```

#### 2. Claude Code CLI 未安装

**症状**: `CLINotFoundError: Claude Code not found`

**解决**: 安装 CLI
```bash
npm install -g @anthropic-ai/claude-code
claude -v
```

#### 3. API Key 未设置

**症状**: `ProcessError: Process failed (exit code: 1)`

**解决**: 设置环境变量
```bash
export ANTHROPIC_API_KEY="sk-ant-api03-..."
```

#### 4. 消息没有正确接收

**症状**: 发送查询后无响应

**解决**: 使用 `async for` 消费消息
```python
# ✅ 正确
async for msg in client.receive_response():
    print(msg)

# ❌ 错误
msg = await client.receive_response()
```

#### 5. 中断不生效

**症状**: 调用 `interrupt()` 但任务继续执行

**解决**: 在后台消费消息
```python
async def consume():
    async for msg in client.receive_response():
        pass

task = asyncio.create_task(consume())
await asyncio.sleep(2)
await client.interrupt()
await task
```

#### 6. Hook 不触发

**症状**: Hook 函数从未被调用

**解决**: 检查配置
```python
# 1. 工具必须在 allowed_tools 中
# 2. matcher 必须匹配工具名（区分大小写）
# 3. Hook 签名必须正确

hooks={
    "PreToolUse": [
        HookMatcher(matcher="Bash", hooks=[my_hook])
    ]
}
```

#### 7. 自定义工具不工作

**症状**: Claude 报告无法找到工具

**解决**: 检查命名格式
```python
# 命名格式: mcp__<server_name>__<tool_name>
allowed_tools=["mcp__math__calculate_sum"]
```

#### 8. 忘记 await

**症状**: `TypeError: object AsyncGenerator can't be used in 'await' expression`

**解决**: 使用 `async for` 而非 `await`
```python
# ✅ 正确
async for msg in query("test"):
    pass

# ❌ 错误
msg = await query("test")
```

#### 9. 异步迭代器未完全消费

**症状**: 资源泄漏或不完整的结果

**解决**: 消费直到 `ResultMessage`
```python
async for msg in client.receive_messages():
    print(msg)
    if isinstance(msg, ResultMessage):
        break
```

#### 10. 上下文管理器使用不当

**症状**: 连接未关闭，资源泄漏

**解决**: 使用 `async with`
```python
# ✅ 正确
async with ClaudeSDKClient() as client:
    pass  # 自动 disconnect

# ❌ 错误
client = ClaudeSDKClient()
await client.connect()
# 忘记 disconnect
```

### 8.3 调试技巧

#### 1. 启用 CLI 日志

```python
def stderr_callback(line):
    print(f"[CLI] {line}")

options = ClaudeAgentOptions(
    stderr=stderr_callback,
    extra_args={"debug-to-stderr": None}
)
```

#### 2. 使用诊断脚本

```python
"""诊断脚本"""
import sys

print(f"Python: {sys.version}")
print(f"SDK: {claude_agent_sdk.__version__}")

import shutil
cli_path = shutil.which("claude")
print(f"CLI: {cli_path}")
```

#### 3. 类型检查

```bash
pip install mypy
python -m mypy your_script.py
```

---

## 📖 参考资料

### 9.1 官方文档

- **SDK 文档**: https://platform.claude.com/docs/en/agent-sdk/python
- **Claude Code 文档**: https://code.claude.com/docs/en/
- **API 参考**: https://platform.claude.com/docs/en/agent-sdk/python
- **迁移指南**: https://platform.claude.com/docs/en/agent-sdk/migration-guide

### 9.2 示例代码

**本地示例目录**:
- 路径: `C:\Users\Remy\sensedeal\code\projects\work\claude-sdk\claude-agent-sdk-python\examples\`
- GitHub: https://github.com/anthropics/claude-agent-sdk-python/tree/main/examples

**关键示例**:
- `quick_start.py`: 快速入门
- `streaming_mode.py`: 完整流式示例
- `mcp_calculator.py`: 自定义工具
- `hooks.py`: Hook 系统
- `tool_permission_callback.py`: 权限回调

### 9.3 社区资源

- **Discord**: https://discord.com/invite/anthropic
- **论坛**: https://community.anthropic.com/
- **GitHub Issues**: https://github.com/anthropics/claude-agent-sdk-python/issues
- **GitHub Discussions**: https://github.com/anthropics/claude-agent-sdk-python/discussions

### 9.4 相关项目

- **Claude Code CLI**: https://github.com/anthropics/claude-code
- **MCP (Model Context Protocol)**: https://modelcontextprotocol.io/
- **anyio**: https://anyio.readthedocs.io/

---

## 📝 附录

### A. API 速查表

| API | 用途 | 返回类型 |
|-----|------|----------|
| `query(prompt, options)` | 简单查询 | `AsyncIterator[Message]` |
| `ClaudeSDKClient()` | 创建客户端 | `ClaudeSDKClient` |
| `client.connect()` | 建立连接 | `None` |
| `client.query(prompt)` | 发送查询 | `None` |
| `client.receive_messages()` | 接收所有消息 | `AsyncIterator[Message]` |
| `client.receive_response()` | 接收单次响应 | `AsyncIterator[Message]` |
| `client.interrupt()` | 发送中断 | `None` |
| `client.disconnect()` | 断开连接 | `None` |
| `@tool(name, desc, schema)` | 定义工具 | `SdkMcpTool` |
| `create_sdk_mcp_server(...)` | 创建 MCP 服务器 | `McpSdkServerConfig` |

### B. 类型定义速查

```python
# 消息类型
Message = UserMessage | AssistantMessage | SystemMessage | ResultMessage | StreamEvent

# 内容块类型
ContentBlock = TextBlock | ThinkingBlock | ToolUseBlock | ToolResultBlock

# 权限模式
PermissionMode = Literal["default", "acceptEdits", "plan", "bypassPermissions"]

# Hook 事件
HookEvent = Literal["PreToolUse", "PostToolUse", "UserPromptSubmit", "Stop", "SubagentStop", "PreCompact"]

# 权限结果
PermissionResult = PermissionResultAllow | PermissionResultDeny
```

### C. 错误代码参考

| 错误类型 | 含义 | 解决方法 |
|----------|------|----------|
| `CLINotFoundError` | CLI 未找到 | 安装 Claude Code CLI |
| `CLIConnectionError` | 连接失败 | 检查工作目录、权限 |
| `ProcessError` | 进程异常退出 | 检查 API Key、配置 |
| `CLIJSONDecodeError` | JSON 解析失败 | 更新 CLI 版本、增加缓冲区 |
| `MessageParseError` | 消息解析失败 | 更新 SDK 和 CLI |

### D. 配置选项完整列表

```python
ClaudeAgentOptions(
    # 系统提示
    system_prompt: str | dict | None = None,

    # 工具权限
    allowed_tools: list[str] | None = None,
    disallowed_tools: list[str] | None = None,

    # 权限模式
    permission_mode: PermissionMode = "default",

    # 对话限制
    max_turns: int | None = None,

    # 模型
    model: str | None = None,

    # 工作目录
    cwd: str | Path | None = None,

    # 环境变量
    env: dict[str, str] | None = None,

    # CLI 路径
    cli_path: str | Path | None = None,

    # MCP 服务器
    mcp_servers: dict[str, McpServerConfig] | None = None,

    # 工具权限回调
    can_use_tool: CanUseTool | None = None,

    # Hook 配置
    hooks: dict[HookEvent, list[HookMatcher]] | None = None,

    # 代理定义
    agents: dict[str, AgentDefinition] | None = None,

    # 流式设置
    include_partial_messages: bool = False,

    # 设置源
    setting_sources: list[str] | None = None,

    # 额外参数
    extra_args: dict[str, Any] | None = None,

    # stderr 回调
    stderr: Callable[[str], None] | None = None,

    # 缓冲区大小
    max_buffer_size: int = 1024 * 1024,
)
```

---

## 🎉 总结

恭喜你完成了 Claude Agent SDK (Python) 的学习指南！

**你现在应该能够**:
- ✅ 安装和配置 SDK 环境
- ✅ 使用 `query()` 和 `ClaudeSDKClient` 进行查询
- ✅ 创建自定义工具和 MCP 服务器
- ✅ 使用 Hook 系统进行权限控制
- ✅ 调试和解决常见问题
- ✅ 设计生产级 Claude 集成

**下一步**:
1. 尝试完整的示例代码 (`examples/` 目录)
2. 构建你的第一个 Claude 集成项目
3. 加入社区，分享你的经验
4. 贡献代码和文档

**获取帮助**:
- Discord: https://discord.com/invite/anthropic
- GitHub Issues: https://github.com/anthropics/claude-agent-sdk-python/issues
- 文档: https://platform.claude.com/docs/en/home

祝你使用 Claude Agent SDK 构建出色的应用！🚀