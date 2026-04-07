---
title: "Agent Harness 模式：从 Claude Code 核心循环中提炼的工程蓝图"
pubDate: 2026-04-07T00:00:00.000Z
description: "教科书里的 ReAct 循环到底缺了什么？我们从 Claude Code 源码中提炼出 Agent Harness 模式——一个可泛化的、让 AI Agent 在生产环境中存活的工程蓝图。"
author: 'Remy'
tags: ['harness-engineering', 'agent-harness', 'claude-code', 'react-pattern', 'llm-engineering']
lang: 'zh'
---

## 教科书和现实之间的鸿沟

所有 AI Agent 教程都画同一张图：

```
推理 → 行动 → 观察 → 重复 → 完成
```

优雅、简洁，放在 PPT 上刚刚好。但拿它直接上生产？必挂。

真实世界的 Agent 循环要处理流式中断、上下文窗口溢出、API 限流、工具执行超时、用户取消、模型降级回退……教科书循环和生产级 Agent 运行时之间的那道鸿沟，就是 **Harness Engineering（驾驭工程）** 的领地。

我逐行读完了 Claude Code 开源的 `query.ts`（约 1700 行），从中提炼出一个可泛化的模式——我称之为 **Agent Harness Pattern**。

## 核心发现：循环本身不够

Claude Code 的 Agent 循环，骨架上是标准的 ReAct 循环：

```typescript
// query.ts:307
while (true) {
  // 推理 + 行动：调用模型
  for await (const msg of callModel({...})) {     // :659
    if (msg 包含 tool_use blocks) needsFollowUp = true
  }
  // 观察：没有工具调用 → 结束
  if (!needsFollowUp) return { reason: 'completed' }  // :1357
  // 执行工具，追加结果，继续
  for await (const update of runTools(...)) { ... }    // :1384
  state = { messages: [...旧消息, ...助手消息, ...工具结果] }
}
```

五行伪代码。但实际文件约 1700 行。多出来的 1695 行去哪了？

全在 **Harness** 里——包裹裸循环、让它能在生产环境存活的基础设施。

## Agent Harness 模式的五层结构

### 第一层：上下文管理（API 调用之前）

每次迭代发消息给模型之前，Harness 必须对上下文进行**压缩、裁剪、重塑**。

Claude Code 按顺序运行四级压缩器：

| 压缩器 | 职责 | 代码位置 |
|---|---|---|
| `applyToolResultBudget` | 限制单条工具结果的大小 | `query.ts:379` |
| `snipCompactIfNeeded` | 删除陈旧的中间历史 | `query.ts:403` |
| `microcompactMessages` | 折叠冗长的工具输出 | `query.ts:414` |
| `autoCompactIfNeeded` | LLM 驱动的完整摘要 | `query.ts:454` |

**经验法则：** 上下文不是"只管 append"。生产级 Harness 需要一条压缩流水线，每次 API 调用前运行，在 token 限制内保留最关键的信息。

### 第二层：流式执行（API 调用期间）

教科书的做法是等模型全部输出完再执行工具。Claude Code 更聪明——**模型还在输出的时候就开始执行工具**：

```
API 流:  ┃ text ┃ tool_A ┃ text ┃ tool_B ┃ end ┃
                   │                 │
          addTool(A)│        addTool(B)│
              ▼     │            ▼    │
工具:    ┏━━━━━━━━━┿━━━━━┓  ┏━━━━━━━┿━━┓
         ┃ 执行 A  │     ┃  ┃ 执行 B│  ┃
         ┗━━━━━━━━━┿━━━━━┛  ┗━━━━━━━┿━━┛
```

`StreamingToolExecutor`（`StreamingToolExecutor.ts:40`）为每个工具维护状态机（`queued → executing → completed → yielded`），并通过 `partitionToolCalls`（`toolOrchestration.ts:91`）将工具分为可并发和必须串行两类。

**经验法则：** 不要等完整响应。流式执行器让模型输出和工具执行重叠，能显著降低单轮延迟。只读工具可并发，写工具必须串行。

### 第三层：恢复阶梯（API 调用之后）

这是 Claude Code Harness 最精彩的部分。循环有 **7 条恢复路径**——每条都是 `state = next; continue`，用调整后的参数重试本次迭代：

| 恢复路径 | 触发条件 | 策略 |
|---|---|---|
| Context Collapse 排空 | 413 prompt_too_long | 提交暂存的上下文折叠 |
| 响应式压缩 | 413 持续出现 | 立即做一次 LLM 摘要 |
| Token 升级 | 输出在 8k 处截断 | 升到 64k 重试 |
| 多轮恢复 | 输出仍然截断 | 注入"直接续写"提示 |
| Stop Hook 重试 | Hook 报告阻塞错误 | 追加错误信息后重试 |
| Token 预算续传 | 预算未耗尽 | 注入 nudge 让模型继续 |
| 正常下一轮 | 工具执行完成 | 追加结果，继续 |

每条恢复路径写入 `State` 时带一个 `transition` 标签（如 `{ reason: 'reactive_compact_retry' }`），防止死循环——如果同一恢复连续触发两次没有进展，就跳到下一策略或退出。

**经验法则：** 不要只 `try/catch` 然后放弃。生产级 Harness 需要一把**恢复阶梯**——多种策略从便宜到昂贵排列，每级带熔断器防循环。

### 第四层：终止条件（何时停止）

教科书说"模型不调用工具就停"。现实需要 10 种不同的退出路径：

```
completed           — 自然完成（无工具调用）
max_turns           — 达到轮次上限
aborted_streaming   — 用户在 API 调用阶段中断
aborted_tools       — 用户在工具执行阶段中断
prompt_too_long     — 上下文溢出，所有恢复耗尽
model_error         — API 不可恢复错误
blocking_limit      — 硬性 token 上限
image_error         — 媒体处理失败
stop_hook_prevented — 外部 hook 否决继续
hook_stopped        — Hook 发出硬停信号
```

每个退出都产出一个带 `reason` 字段的 `Terminal` 对象，让调用方完全了解循环*为什么*结束。

**经验法则：** "完成"不是一个状态。生产级 Harness 需要类型化的终止状态，让调用方区分用户取消、上下文溢出和自然完成——并据此做出不同响应。

### 第五层：状态线程（跨迭代传递）

循环通过一个可变的 `State` 对象在迭代间传递状态：

```typescript
// query.ts:204
type State = {
  messages: Message[]
  toolUseContext: ToolUseContext
  autoCompactTracking: AutoCompactTrackingState | undefined
  maxOutputTokensRecoveryCount: number
  hasAttemptedReactiveCompact: boolean
  turnCount: number
  transition: Continue | undefined  // 记录为什么 continue
}
```

每个 `continue` 站点都构造一个全新的 `State`。`transition` 字段形成恢复决策的审计轨迹。

**经验法则：** 不要用散落的可变变量。将循环状态打包成单一类型化对象，每次 continue 时重新构造。这让循环行为可检查、可测试。

## 泛化的 Agent Harness 模式

剥离 Claude Code 的具体细节，Agent Harness 模式长这样：

```
┌─────────────── Agent Harness ───────────────┐
│                                              │
│  while (true) {                              │
│    ┌─ 上下文流水线 ────────────────────┐     │
│    │  压缩 → 裁剪 → 重塑             │     │
│    └───────────────────────────────────┘     │
│              │                               │
│    ┌─ 模型调用（流式） ────────────────┐     │
│    │  yield 事件流                     │     │
│    │  同时启动工具并发执行             │     │
│    └───────────────────────────────────┘     │
│              │                               │
│    ┌─ 恢复阶梯 ───────────────────────┐     │
│    │  最便宜的修复优先                 │     │
│    │  每级带熔断器                     │     │
│    │  失败则跌落到下一级               │     │
│    └───────────────────────────────────┘     │
│              │                               │
│    ┌─ 终止检查 ───────────────────────┐     │
│    │  类型化退出原因                   │     │
│    │  调用方可区分"为什么停"           │     │
│    └───────────────────────────────────┘     │
│              │                               │
│    ┌─ 工具执行 ───────────────────────┐     │
│    │  分区：可并发 vs 必须串行         │     │
│    │  收集结果 → state.messages        │     │
│    └───────────────────────────────────┘     │
│              │                               │
│    state = new State({...})                  │
│  }                                           │
└──────────────────────────────────────────────┘
```

## 为什么这很重要

如果你正在构建 AI Agent——无论是代码助手、数据管道编排器，还是自主研究工具——你终将面对和 Claude Code 相同的问题：

1. **上下文装不下。** 你需要压缩流水线。
2. **API 会挂。** 你需要恢复阶梯。
3. **用户会中断。** 你需要干净的中止处理。
4. **工具会冲突。** 你需要并发分区。
5. **"完成"含义很多。** 你需要类型化终止状态。

ReAct 循环是内核。Harness 才是让它成为产品的东西。

## 带走这一句

下次你写 Agent 循环的时候，不要从 LLM 调用开始，从 Harness 开始。问自己：上下文溢出了怎么办？模型幻觉了一个不存在的工具名怎么办？用户在工具执行到一半时按了 Ctrl+C 怎么办？API 连续返回三次 413 怎么办？

如果你的循环对这些问题没有答案，你手里的不是 Harness——是一个 Demo。
