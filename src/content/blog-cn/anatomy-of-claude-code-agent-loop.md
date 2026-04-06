---
title: '拆解 Claude Code 的 Agent Loop：一个打了激素的 ReAct 循环'
pubDate: 2026-04-06T00:00:00.000Z
description: '深入 Claude Code 开源代码，逐层剖析 agent loop 的完整调用栈——从入口函数到流式工具执行，附精确文件路径与行号。'
author: 'Remy'
tags: ['claude-code', 'agent-loop', 'react', 'architecture']
lang: 'zh'
---

## 起因

盯着 Claude Code 的开源仓库，我产生了一个念头：**agent loop 到底是怎么跑起来的？** 不是那种"调 API、跑工具"的泛泛而谈，我想看到真实的调用栈、精确的控制流、每一条终止条件。于是我开始逐行阅读源码。

结果是：一个约 1700 行的 `while(true)` 循环，骨架是经典的 **ReAct（推理 + 行动）** 模式——但被层层工程化包裹，简单的模式几乎看不出来了。

## 完整调用栈

从用户输入到 agent 循环转起来，完整调用链如下：

```
CLI REPL (cli/print.ts:2147)
  └─ ask() — QueryEngine.ts:1186
       └─ new QueryEngine().submitMessage() — QueryEngine.ts:209
            ├─ fetchSystemPromptParts() — 构建系统提示
            ├─ processUserInput() — 处理斜杠命令
            └─ for await (msg of query()) — QueryEngine.ts:675
                 └─ query() — query.ts:219
                      └─ queryLoop() — query.ts:241  ★ 核心循环
```

`QueryEngine` 是会话层，负责消息历史、用量统计和 transcript 持久化。真正的 agent loop 在 `queryLoop()` 里。

## while(true) 内部

主循环的每次迭代对应**一次 API 往返**，分为以下阶段：

### 阶段一：上下文准备（行 365–550）

调 API 之前，循环会依次执行一套上下文管理策略：

1. **工具结果预算** — 限制工具输出的聚合大小
2. **Snip compact** — 手术式移除旧消息段
3. **Microcompact** — 压缩单个工具结果
4. **Context collapse** — 对历史做折叠投影
5. **Auto-compact** — 上下文过大时整体摘要

这是工程量最密集的部分。上下文窗口是有限资源，循环对它的管理相当激进。

### 阶段二：流式 API 调用（行 659–863）

```typescript
for await (const message of deps.callModel({
  messages: prependUserContext(messagesForQuery, userContext),
  systemPrompt: fullSystemPrompt,
  tools: toolUseContext.options.tools,
  signal: toolUseContext.abortController.signal,
}))
```

`deps.callModel` 就是 `queryModelWithStreaming()`（services/api/claude.ts:752），封装了 Anthropic SDK 的流式接口。关键洞察是——**工具执行在流式传输期间就已经开始了**：

```typescript
if (streamingToolExecutor && !aborted) {
  for (const toolBlock of msgToolUseBlocks) {
    streamingToolExecutor.addTool(toolBlock, message)  // 行 842
  }
}
```

`StreamingToolExecutor`（StreamingToolExecutor.ts:40）通过状态机管理工具：`queued → executing → completed → yielded`。模型还在生成文本和后续工具调用时，前面的工具就已经在跑了。

### 阶段三：决策点（行 1062）

流结束后，一个布尔值决定一切：

```typescript
if (!needsFollowUp) {
  // 没有工具调用 → 尝试恢复或退出
  return { reason: 'completed' }
}
// 有工具调用 → 执行剩余工具 → 继续循环
```

这就是 ReAct 的终止条件：**模型没调用任何工具 = 它认为任务完成了。**

### 阶段四：工具执行（行 1360–1408）

工具编排由 `runTools()`（toolOrchestration.ts:19）负责，它把工具调用分成批次：

- **并发安全工具**（读取、搜索）最多 10 个并行执行
- **非并发工具**（写入、编辑）串行执行

每个工具调用经过 `runToolUse()`（toolExecution.ts:337），处理权限检查、输入校验和实际调用。

### 阶段五：下一次迭代（行 1715–1728）

```typescript
state = {
  messages: [...messagesForQuery, ...assistantMessages, ...toolResults],
  turnCount: nextTurnCount,
  transition: { reason: 'next_turn' },
}
// 回到 while(true) 顶部
```

循环组装完整消息历史（原始 + 助手响应 + 工具结果），然后继续。

## 恢复机器

让这个循环超越教科书 ReAct 的是 **7 条恢复路径**——循环 `continue` 而非 return 的情况：

| 恢复路径 | 触发条件 | 行为 |
|---|---|---|
| Collapse 排空 | 上下文过长 (413) | 排空已暂存的上下文折叠 |
| 反应式压缩 | 折叠后仍 413 | 紧急全量摘要 |
| Token 升级 | 输出撞到 8k 上限 | 用 64k 上限重试 |
| 多轮恢复 | 输出仍被截断 | 注入"继续"提示，最多重试 3 次 |
| Stop hook 阻塞 | Hook 返回错误 | 注入错误信息，让模型自己修复 |
| Token 预算续传 | 预算未耗尽 | 注入 nudge 继续工作 |
| 正常下一轮 | 存在工具调用 | 标准 ReAct 循环 |

终止条件则有 **10+ 种**：`completed`、`max_turns`、`aborted_streaming`、`aborted_tools`、`prompt_too_long`、`model_error`、`blocking_limit`、`stop_hook_prevented`、`hook_stopped`、`image_error`。

## 它真的是 ReAct 循环吗？

是的。剥掉恢复逻辑、上下文管理和流式优化，骨架就是：

```
while (true) {
  response = callModel(messages)           // 推理 + 行动
  if (响应中没有工具调用) break              // 最终答案
  results = executeTools(response.tools)   // 观察
  messages += response + results           // 追加
}
```

但和教科书实现的差异很大：

| 维度 | 经典 ReAct | Claude Code |
|---|---|---|
| 推理/行动分离 | 文本解析 `Thought:` / `Action:` | 原生 API `tool_use` block |
| 每轮工具数 | 1 个 | 多个，可并发 |
| 执行时机 | 响应完成后 | **流式传输期间** |
| 上下文管理 | 无 | 5 层压缩级联 |
| 错误恢复 | 无 | 7 条恢复路径 |
| 终止判定 | 解析 "Final Answer:" | `tool_use blocks === 0` |

## 启示

Claude Code 的 agent loop 是对简单模式的一次生产级工程演绎。ReAct 的骨架大概 20 行逻辑，其余 1680 行处理的是现实世界中会出错的一切：上下文溢出、输出截断、模型回退、用户中断、优雅降级。

如果你在搭自己的 agent loop，从那 20 行版本开始。但要清楚，"demo 能跑" 和 "生产可用" 之间的鸿沟，大约是 1700 行来之不易的边界情况处理。
