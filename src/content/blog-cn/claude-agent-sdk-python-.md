---
title: 'Claude Agent SDK (Python) 学习指南'
pubDate: 2025-10-15T03:15:48.639Z
description: '固定 Python SDK 0.1.3，说明 query、ClaudeSDKClient 生命周期、hooks、MCP 工具、超时和清理，并提供完整示例及离线验证边界。'
author: 'Remy'
tags: ['claude-code', 'vibe-coding', 'python']
---

[Claude Agent SDK for Python](https://github.com/anthropics/claude-agent-sdk-python/tree/v0.1.3) 是通过 Python 驱动 Claude Code、接收类型化消息的开发库。本文保留原文的 **claude-agent-sdk==0.1.3** 基线，解释这个正式发布版本的真实接口，不把它当作最新版本，也不建议新服务直接部署旧依赖。

先区分两个同名操作：模块级 `query()` 返回消息异步迭代器；`ClaudeSDKClient.query()` 只发送输入，返回 `None`，答案需要通过 `receive_response()` 消费。Hooks 通过 `ClaudeAgentOptions.hooks`、`HookMatcher` 和异步回调配置，不需要另找一个同步客户端。

下面明确区分本地验证与模型请求。本地检查不需要密钥、不启动 Claude Code，也不会产生模型调用费用。在线示例需要自行完成认证，可能产生费用。文中的在线预期输出是验收条件，不是已经取得的模型实测记录。

## 安装与版本检查

[v0.1.3 官方 README](https://github.com/anthropics/claude-agent-sdk-python/blob/v0.1.3/README.md) 要求 Python 3.10+、Node.js 和 Claude Code 2.0.0+。这是当时的前置条件，不能据此保证所有后续 CLI 都兼容旧 SDK。在临时目录中使用管理 Python 环境和依赖的 [uv](https://docs.astral.sh/uv/pip/environments/)：

```bash
uv venv --python 3.12 .venv
uv pip install --python .venv "claude-agent-sdk==0.1.3" "mcp==1.18.0" "anyio==4.11.0"
```

Windows 使用 `.venv\Scripts\python.exe` 运行以下文件，macOS 或 Linux 使用 `.venv/bin/python`。明确解释器路径可以避免意外导入全局版本，不要仅凭终端已经激活环境就推断实际使用的包。

将下面的独立示例保存为 `inspect_install.py`：

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

预期输出是 `SDK 0.1.3: imports and signatures OK`。它只证明导入和所检查的签名成立，不能证明网络、模型权限或工具权限正常。读取包元数据，也比假定每个包都提供某个版本属性更明确。

这里同时固定 MCP 和 AnyIO 有实际原因：验证环境仅安装 SDK 0.1.3 时解析到了 MCP 2.2.0，创建工具服务器随即出现 `Server.list_tools` 不存在的错误。本文示例改用 MCP 1.18.0 和 AnyIO 4.11.0。安装成功不等于接口兼容，这组旧依赖只用于复现，不代表安全性或长期支持保证。

在线运行前记录 `claude --version`、实际执行文件及 Python 依赖版本，并按[官方认证说明](https://code.claude.com/docs/en/agent-sdk/overview) 配置环境。不要把密钥放进脚本或提交到仓库。本地检查不需要读取任何凭据；没有 CLI 时先停在离线验证，不要安装一个名称相近的 `claude` 包代替。

## Query 与消息类型

[固定版本的 query 实现](https://github.com/anthropics/claude-agent-sdk-python/blob/v0.1.3/src/claude_agent_sdk/query.py) 要求以关键字传入 `prompt`，另可提供 `options` 和 `transport`。应调用 `query(prompt="...")`，不能把 prompt 当成位置参数。返回对象需要使用 `async for` 消费，不能把迭代器或任意一条消息当成最终文本。

`AssistantMessage` 可以包含多个内容块。正文读取 `TextBlock`，工具请求检查 `ToolUseBlock`。`ResultMessage` 标记一轮结束，带有错误状态、耗时、会话信息和可选费用。收到一段文字不等于任务成功，文字之后仍可能发生工具失败或连接中断。

以下在线示例保存为 `query_once.py`，包含完整导入、异步入口和 runner：

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

使用前面的解释器命令，将文件名替换为 `query_once.py`。成功时应回答算术问题并输出 `result: is_error=False`，但具体措辞不保证一致。提示词要求不使用工具只是指令，不是操作系统层面的权限隔离。

示例先完整消费迭代器，再报告模型结果错误。0.1.3 在消费中途异常时，外层 `aclosing` 不能可靠地在同一任务中关闭嵌套生成器，本地测试复现了取消作用域错误。这是旧版清理限制，不能承诺任意异常都安全释放。应用需要主动取消时，应采用下面明确管理生命周期的客户端。

模块级 query 通常启动独立执行，但不宜绝对称为无状态。这个版本已经有 `resume` 和 `continue_conversation` 选项。恢复保存的对话，与保留一个已连接的 Python 客户端，是两种不同机制。排查上下文丢失时应明确选择了哪一种，并记录会话标识。

## ClaudeSDKClient 生命周期与清理

[客户端源码](https://github.com/anthropics/claude-agent-sdk-python/blob/v0.1.3/src/claude_agent_sdk/client.py) 的顺序是：创建实例、连接、发送、接收、按需重复、断开。创建实例不会自动连接；`async with ClaudeSDKClient(...)` 在进入时连接、退出时断开。手动管理时应通过 `finally` 调用清理，连接初始化异常也需要考虑。

连接和断开必须处于同一个异步任务与上下文。这个版本在二者之间保持一个 AnyIO task group，不能当作普通 HTTP 对象，随意在不同任务中建立和关闭。需要多个来源提交请求时，可以在应用层排队，让一个明确的任务负责客户端。

将下面保存为 `lifecycle.py`。可选的 `transport` 参数供离线 fixture 使用，普通调用留空。程序依次发送两条消息，消费完上一轮结果后才发送下一轮：

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

用同一解释器运行 `lifecycle.py`，成功标记是两行 `turn complete`。它只证明两轮都消费到了非错误结果，没有检查第二轮是否真的记住单词；若要验证模型回答质量，需要另行读取并断言文本。

单轮超时作用域会先退出，但调用者仍然取消的外层作用域可能继续打断 transport 清理。因此在连接前进入 `lifecycle_scope`，只在 `finally` 中修改这个既有作用域的 `shield` 和 `deadline`。不要在 `disconnect()` 外临时进入新的保护作用域，SDK 的 task group 必须按栈顺序退出。单轮与清理各有预算，不是包括启动、两轮总和及关闭耗时的总期限。

`cleanup_seconds` 应为正数，默认允许清理五秒。它屏蔽来自祖先 AnyIO 作用域的取消，但保留自身的截止时间。最后的 checkpoint 会继续传递清理期间到达的外部取消。清理超时会明确报告资源可能残留，这个错误优先于原任务中断，不能返回成功；应弃用该客户端，由监管进程处理剩余资源。这种保护不覆盖直接调用 `asyncio.Task.cancel()`、进程终止或不让出执行的阻塞代码。

旧版本还有一个边界：`disconnect()` 通过内部 query 对象关闭资源。如果失败发生在该对象创建之前，不能保证所有部分启动的 transport 都已清理。自定义 transport 应负责自己的启动失败路径；生产环境还需要进程级监管。存在 `finally` 只能说明尝试清理，不能保证任何情况下都没有残留子进程。

`Stop` 是 agent 事件，不是 Python 客户端析构。`interrupt()` 通过控制通道请求中断，既不能替代断开，也不会撤销已经完成的工具操作。取消之后，外部效果未核对前应标记结果未知；即使没收到最终回答，也不能无条件重试部署、付款或文件修改。

## Hooks 与权限决定

[v0.1.3 类型定义](https://github.com/anthropics/claude-agent-sdk-python/blob/v0.1.3/src/claude_agent_sdk/types.py) 支持六种事件：`PreToolUse`、`PostToolUse`、`UserPromptSubmit`、`Stop`、`SubagentStop`、`PreCompact`。连接前在 options 中注册，不要照搬 TypeScript 的事件全集，也不要发明客户端装饰器。

回调接收 `input_data`、`tool_use_id` 和 `context` 三个参数，是返回字典的 `async def` 函数。工具执行前明确拒绝时，应在 `hookSpecificOutput` 下提供对应的 `hookEventName` 和 `permissionDecision="deny"`。返回 `{}` 表示没有增加决定，不等于明确批准，更不会覆盖其他权限检查。

以下保存为 `hooks_demo.py`，默认直接调用回调进行离线检查。只有加上 `--live` 才会请求模型执行一个无害的 Bash 命令，而回调拒绝所有 Bash 调用。相比匹配几个危险字符串，拒绝整个工具更容易检查本例的预期行为。

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

使用同一解释器运行 `hooks_demo.py`，确定性的本地输出为：

```text
PreToolUse: deny Bash
offline hook contract OK
```

完成认证并确认允许模型请求后，才添加 `--live`。模型未必选择 Bash，所以没有第一行日志不一定是注册失败。反过来，直接调用回调时打印了拒绝，也不能证明 CLI 实际阻止了工具。在线验收必须观察真实工具请求，并确认没有产生预期之外的副作用。

`PostToolUse` 发生在工具执行后，可以记录审计信息，但不能撤销操作。日志默认只记录事件、工具名和调用标识，不要打印完整提示词、输入参数或文件正文，以免把私密内容带入排障记录。本例只打印工具名。

这个例子不是通用沙箱。禁止 Bash 不代表其他工具不能修改文件或访问网络；`allowed_tools` 和提示词也不能替代文件系统隔离。实际策略应定义允许的操作、处理未知工具，并在隔离目录测试替代路径。`can_use_tool` 是另一种权限回调 API，也需要流式控制通道。

## 模块级 Query 的流式 Hooks

[内部客户端实现](https://github.com/anthropics/claude-agent-sdk-python/blob/v0.1.3/src/claude_agent_sdk/_internal/client.py) 会把 hooks 传入 query 对象，但只有异步可迭代输入会初始化控制协议。因此，不能笼统说模块 query 不支持 hooks，也不能把这个版本的字符串输入和流式输入视为等价。

将 `stream_query.py` 放在 `hooks_demo.py` 同一目录，明确复用前例的回调配置。事件对象让输入流保持打开，直到收到结果。只 yield 一条消息就结束的生成器可能提前关闭 stdin，让后续控制响应无法写回。

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

使用同一解释器运行 `stream_query.py` 会发起在线请求。成功时输出 `stream result received`，拒绝日志仍以实际发出 Bash 请求为前提。此例解释旧版输入流的生命周期，不适合作为无限等待的服务。如果一直没有结果，输入流也会保持打开；在线实验需要监管进程，应用需要控制等待时间时可采用上一节的客户端截止方案。

## 不同层次的超时

这个版本的 `ClaudeSDKClient` 和 `HookMatcher` 构造签名没有 `timeout=`，不能自行添加。[控制协议源码](https://github.com/anthropics/claude-agent-sdk-python/blob/v0.1.3/src/claude_agent_sdk/_internal/query.py) 对自身发出的控制请求等待 60 秒，但这不代表每轮模型调用、每个传入回调或整项任务都有相同截止时间。

<div class="overflow-x-auto" role="region" aria-label="超时层次对照表" tabindex="0">

| 层次 | 本文中的含义 | 不能据此保证 |
| --- | --- | --- |
| 连接与控制请求 | SDK 内部等待控制回复 | 模型整轮执行的最大时间 |
| 回调自身的 I/O | 单独限制数据库或 HTTP 等待 | 旧版存在 `HookMatcher.timeout` |
| 异步 Hook 输出 | `async_` 选择延后输出，`asyncTimeout` 在该版本中以毫秒计 | 所有异步函数都会后台执行 |
| 应用单轮任务 | `anyio.fail_after(seconds)` 覆盖发送和接收 | 启动和清理也受此时间限制 |
| 完整作业 | 监管进程负责总生命周期与子进程清理 | 远端副作用自动回滚 |

</div>

[当前 Python 文档](https://code.claude.com/docs/en/agent-sdk/python) 介绍了通过环境配置向 CLI 传入 `API_TIMEOUT_MS`，约束 API 请求等待。它属于当前 CLI 的契约，本文没有将其作为旧 SDK／CLI 组合的已验证参数。重试还可能累计多个请求时间窗口，不能把单请求限制当成整个任务上限。

如果工具批准依赖外部查询，可以在回调内部给查询设置截止时间，超时后明确返回拒绝。但取消需要实际的异步等待点：同步阻塞库或长时间 CPU 循环不会因为外层写了 `async def` 就及时让出执行。

后台审计与批准应分开。返回 `async_` 不证明权限检查已经完成；本文也不对旧版 CLI 在所有 Hook 超时后的动作作统一承诺。应分别验证工具是否执行、会话是否继续、客户端是否关闭，不能只凭捕获到一个异常就推断三者。

## 自定义 MCP 工具

MCP 是让 agent 以结构化输入和输出调用工具的协议。[v0.1.3 工具实现](https://github.com/anthropics/claude-agent-sdk-python/blob/v0.1.3/src/claude_agent_sdk/__init__.py) 从包根目录导出 `tool` 和 `create_sdk_mcp_server`。进程内服务器省去独立服务器进程，但不代表已经测量出性能优势，也不隔离工具与 Python 程序的权限。

下面的完整本地示例保存为 `mcp_demo.py`：

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

用同一解释器运行 `mcp_demo.py`，预期输出 `local MCP handler: 42.0`。直接调用 handler 只检查计算与返回字典，不证明 CLI 发现了工具或模型选择了工具。在线集成时，把这里的 `make_options()` 传给前面的客户端流程，再观察真实工具调用及结果。

工具完整名称取自 `mcp_servers` 的字典键 `math` 和工具名 `calculate_sum`，不是服务器显示名称 `math-tools`。不要根据界面的描述标签猜测 `mcp__math__calculate_sum`，命名错误也可能被误认为 matcher 不生效。

## 排障与验证边界

Hook 没有日志时，依次检查安装版本、输入模式、初始化握手、实际工具名、matcher、回调入口及返回结构。`allowed_tools` 不会强迫模型选择工具；没有工具调用的普通文字回答，不能证明工具 Hook 成功或失败。

连接故障要区分执行文件缺失、工作目录错误、CLI 退出、消息解析错误和认证失败。单独一个 `ProcessError` 不证明密钥未配置，应保留退出码和脱敏后的 stderr。不要只升级一个依赖，再把结果变化归结为某个未经隔离验证的原因。

本文使用 Python 3.12 和固定依赖进行本地验证，检查导入、签名、所有 Python 代码块、直接 Hook 回调和 MCP handler。模拟 transport 还驱动真实 SDK，覆盖初始化、连续两轮响应、Hook 路由、流式输入、缺失结果超时及清理。模拟消息只是 fixture，不是 Claude 的回答。

这些测试不能证明 CLI 权限执行、真实 Hook 超时策略、操作系统子进程回收、模型记忆、认证、费用或网络可靠性。在线验收仍需记录准确的 CLI 版本，观察真实工具被拒绝且没有副作用、允许的工具触发后置回调，并在临时目录验证取消。页面能展示和代码能解析，都不能代替这些检查。

部署时应选择仍受维护的 SDK／CLI 组合，固定完整依赖并重新验证这些契约。本文保留旧版本是为了让原有教程前后一致；当前文档可用于制定迁移方案，不能悄悄改变旧接口的含义。

### 可复现的失败检查

先在一次性工作目录中使用一个客户端和一条提示词，执行前说明期待的终止条件：非错误结果、明确拒绝、本地异常或截止时间。没有这些预期，提前结束的流可能被误认成快速回答，工具被拒绝也可能被误认成应用崩溃。

缺失结果至少分两种测试。第一种 fixture 确认初始化并接受输入，随后保持流打开但不发送结果，以验证等待截止。第二种在接受输入后立即关闭流，以验证代码确实报告结果缺失。界面上看似都没有回答，实际对应超时与不完整流两个不同原因。

清理探针应在 `close()` 中先等待一个异步检查点，再记录完成。成功、内部超时、错误结果和外部 AnyIO 取消后，断言 `close_completed`，不能只断言 `close_started`。本地回归还覆盖清理中途收到取消、清理持续等待时有界退出，并检查取消继续传播、失败后没有第二轮以及作用域栈仍可使用。这是实际 SDK 加模拟 transport 的验证，不是已经证实真实 CLI 进程泄漏。

测试 Hook 路由时，应读取初始化载荷中 SDK 实际注册的 callback ID，用它构造 `hook_callback` 控制请求，再检查返回的控制响应。直接调用 `deny_bash()` 只验证应用策略；通过真实 SDK 路由还能验证注册和字典序列化。两者都没有验证具体 CLI 如何执行拒绝。

重试前先区分可以重复的读取与结果未知的操作。即使提示词看似只读，也可能调用权限更宽的工具。先确认调用标识与外部状态，必要时设计应用层幂等键。连接错误只说明通信有问题，不自动授权重做此前所有操作。

### 配置与错误记录

需要固定模型时，使用 `ClaudeAgentOptions(model=...)`。示例没有指定模型，是因为可用模型属于账号及运行环境条件，不能靠离线导入检查确定。不要把其他消息 API 的 `temperature`、`max_tokens` 参数放进 `client.query()`。

`max_turns` 限制 agent 轮数，不是墙钟时间或费用上限。结果的 `total_cost_usd` 可能为 `None`，无条件格式化成小数反而会使错误报告失败。费用缺失应标记未知，并与任务是否完成分别记录。

可复现的诊断记录应包含 SDK、MCP、AnyIO、Python 版本、CLI 路径与版本、操作系统、工作目录、输入模式、启用的事件、最后消息类型和耗时。分享前移除密钥与个人信息。示例设置 `setting_sources=[]`，不主动加载文件系统配置来源，但这不是沙箱，也不会清除继承的环境变量或机器权限。

### 把单轮超时接入应用

如果网页请求的等待时间只有十秒，而客户端允许单轮等待三十秒，就需要先决定网页断开后任务是否继续。不能让前端显示失败，后台却悄悄继续修改文件，又在用户重试时重新发起同一操作。应用可以选择取消并核对结果，也可以选择转成有标识的后台任务，让用户稍后查询状态；无论哪种，都需要保存任务标识与终止原因。

总任务期限应包括排队、连接、发送、接收和清理。本例分别设置单轮和清理预算，但没有限制启动时间。某轮等待上限也不能简单乘以轮数就当成总期限，因为其他阶段和重试另有耗时。整个作业的硬性限制应由拥有子进程生命周期的监管层处理。进程退出与外部操作回滚仍是两回事。

测试后置回调时，不应选择一个注定被前置回调拒绝的工具，再要求同一次调用出现后置日志。应另外准备一个明确允许且无副作用的工具，例如本地加法工具，分别记录前置允许、工具完成和后置观察。这样才能区分拒绝流程与成功流程，不会把不同执行路径的预期混在一起。本文提供了两类回调和加法 handler，但没有宣称完成这项在线组合测试。

还有一种容易忽略的情况是日志系统自己失败。审计回调如果同步写入不可用的远程服务，就可能把原本已经完成的工具操作变成客户端继续等待的原因。应为日志发送安排独立的失败处理，并在业务要求必须审计时明确拒绝还是进入待处理状态。不要依赖异常自动产生预期的权限效果，也不要通过吞掉所有异常伪造完整记录。

保存测试结果时，分别列出能够证明的事实与仍需验证的条件。例如，离线协议测试能够证明回调被调用、返回结构正确；真实命令测试才能证明指定 CLI 的执行效果。将两者分开，后续升级依赖时才能知道需要重测哪一部分，而不必把一条笼统的通过记录当作全部依据。

## 参考资料

- [官方 v0.1.3 仓库与 README](https://github.com/anthropics/claude-agent-sdk-python/tree/v0.1.3)：版本基线和历史前置条件。
- [客户端生命周期](https://github.com/anthropics/claude-agent-sdk-python/blob/v0.1.3/src/claude_agent_sdk/client.py)及 [query 输入处理](https://github.com/anthropics/claude-agent-sdk-python/blob/v0.1.3/src/claude_agent_sdk/_internal/client.py)：发送、接收与流式初始化。
- [类型及 Hook 字段](https://github.com/anthropics/claude-agent-sdk-python/blob/v0.1.3/src/claude_agent_sdk/types.py)和[控制协议](https://github.com/anthropics/claude-agent-sdk-python/blob/v0.1.3/src/claude_agent_sdk/_internal/query.py)：事件、时间单位和清理实现。
- [当前 Python 参考](https://code.claude.com/docs/en/agent-sdk/python)及[当前 Hooks 指南](https://code.claude.com/docs/en/agent-sdk/hooks)：供迁移参考，不作为旧版接口契约。
- [AnyIO 取消说明](https://anyio.readthedocs.io/en/stable/cancellation.html)：截止时间、取消作用域和清理顺序。
