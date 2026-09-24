# Cordis 深入调研：动态依赖、上下文传播与副作用生命周期

- 调研日期：2026-09-13。
- 调研对象：`cordiverse/cordis`，不是同名 Discord 库或其他语言的移植版本。用户未提供 owner，本报告按 GitHub 仓库搜索中最匹配的项目展开。
- 固定源码：`f8ea3cd50f1a5724e8e715995bcde131c9c12b2c`，提交时间 `2026-09-08T15:39:20Z`，提交说明 `chore: bump versions`。[S1]
- 获取方式：Git HTTPS 克隆两次遇到网络故障，改为下载 GitHub codeload 的固定提交 ZIP；保留了源码快照，但没有完整本地 Git 历史。
- 证据分类：**源码事实**、**本机实测**、**作者主张**、**研究判断**分别标注，不把作者愿景或测试通过写成生产保证。
- 本报告只做研究，不修改本站业务代码，不修改上游源码，不安装到生产环境，不提交或推送。

## 1. 结论先行

**Cordis 是一个把动态依赖注入、上下文作用域和可回收副作用组合起来的进程内运行时。它的中心对象不是模型、Agent 或 HTTP 请求，而是 Context、Fiber、Service 和 Effect。** 这一判断来自 Core 的模块划分与实际实现，不只是 README 的 “Meta-Framework” 定位。[S2][S3][S4][S5]

它最值得借鉴的设计有三点：

1. **依赖关系不只决定启动顺序，也决定模块在运行中的存活条件。** 所需服务缺失时插件可以保持 PENDING；服务可用后执行；服务撤销时清理相关副作用；后续再可用时重新执行。[S4][S5]
2. **公共服务可以把所创建资源归属于调用方。** 服务长期存在，但它为某个插件注册的监听器、定时器或其他 effect，应随那个插件卸载而清理。Traceable/Shadow Context 专门处理定义位置与使用位置的区别。[S6][S7]
3. **热重载与配置重载建立在上述生命周期之上。** Loader 管配置树，Include 协调文件与运行时变更，HMR 处理模块失效与 Fiber 重建；不是简单删掉 `require.cache` 再重新执行一次文件。[S9][S10][S11]

**研究判断：适合把它作为“动态模块宿主”的基础设施来评估；不应把它直接当作完整 Agent 框架、持久工作流引擎、安全沙箱，或具备事务回滚的生产热更新系统。** 这些边界会在下文逐项说明。

## 2. 研究范围与版本边界

### 2.1 当前源码的包结构

以下版本来自固定提交的各包 `package.json`，不是笼统的“所有组件都是 v4”。[S2][S12]

| 包 | 快照版本 | 职责 |
| --- | --- | --- |
| `cordis` | `4.0.0-rc.10` | Context、Fiber、Service、事件、日志、插件注册 |
| `@cordisjs/plugin-loader` | `1.0.0-rc.7` | 配置项、分组、隔离与模块加载 |
| `@cordisjs/plugin-include` | `1.1.0` | JSON/YAML 配置、patch 与文件/运行时协调 |
| `@cordisjs/plugin-hmr` | `1.1.0` | 文件监听、依赖分析、模块缓存失效和局部重载 |
| `@cordisjs/plugin-timer` | `1.1.3` | 生命周期感知的 timeout、interval、throttle、debounce |
| `@cordisjs/plugin-group` | `1.0.0` | 配置树分组 |
| `@cordisjs/plugin-logger-console` | `1.0.0` | 控制台日志输出 |
| `@cordisjs/utils` | `1.0.0` | 配套工具 |
| `create-cordis` | `0.3.0` | 项目初始化 CLI |

根目录的 `@root/cordis` 是私有 monorepo 工作区，不是应安装的 npm 产品。根工作区声明 Yarn `4.14.1`，采用 Yakumo 编排构建与测试；本次遵守当前工作区默认 pnpm 约定，另建研究测试环境，没有迁移上游的包管理器。[S12]

### 2.2 “最新”不等于“稳定”

截至研究日，GitHub API 返回的最新 Release 为 **2026-09-08 发布的 `v4.0.0-rc.10`**。它的 `prerelease` 字段是 `false`，但版本名仍然是 RC；README 明确声明 API 尚不稳定、可能变化。因此不能依据 GitHub 的标签属性宣称“4.0 已稳定”。[S1][S2][S13]

`rc.10` 仍有不兼容变更，例如 Loader 的 `EntryTree.write()` 改为 `commit(change: EntryChange)`。如果接入，应固定 Core 与配套插件版本，不能只钉住 `cordis` 而让其他插件独立升级。[S13]

## 3. 架构：一个宿主，两种图

```text
应用 / Agent Harness / 插件式服务
                |
            Context
                |
    +-----------+------------+-------------+
    |           |            |             |
 Registry    Reflect       Events        Logger
    |           |
  Runtime    服务槽位: symbol -> Impl
    |           |
  Fiber <-------+  服务可用性通知
    |
    +-- 子 Fiber
    +-- Effects / Disposers

可选外围:
Loader -> EntryTree / EntryGroup / Entry
Include -> 文件快照 + Journal + Patches
HMR -> 文件变化 -> 模块重导入 -> Fiber 重建
```

上图是源码结构的归纳，不是上游架构图。[S3][S4][S5][S9][S10][S11]

### 3.1 不要把插件树与依赖图混为一谈

- **所有权树**回答“谁创建谁、谁卸载时应带走谁”：父 Context 创建的插件 Fiber 通过父 Fiber 的 effect 注册清理动作。[S4]
- **服务依赖图**回答“谁需要谁才能运行”：每个 Fiber 保存显式 `inject` 声明，以及当前解析到的服务实现；Reflect 在服务变化时通知受影响 Fiber。[S4][S5]

一个消费者不必是服务提供者的子节点，但二者必须位于能解析到对应服务槽位的作用域。父插件销毁会级联销毁子插件；服务提供者退出则可能让其他分支的消费者退回 PENDING。这是两条不同的传播路径。[S3][S4][S5]

### 3.2 Context：不是普通的全局依赖字典

`new Context()` 创建根 Fiber、Reflect、Registry、Events、Logger，并返回带属性访问拦截的 Proxy。`extend()` 通过原型继承建立派生上下文；`isolate()` 和 `intercept()` 进一步扩展各自的作用域映射。[S3]

使用插件 Context 读取服务时，Reflect 会核验定义位置的 `inject` 和当前 Fiber 的服务快照。根 Context 存在便于宿主管理的宽松访问路径，因此这不是一个覆盖所有访问路径的权限系统。[S5]

### 3.3 Runtime 与 Fiber：代码身份和运行实例分开

Registry 按插件的函数或 `apply` 回调身份保存 Runtime；同一 Runtime 下可以有多个 Fiber，分别携带父上下文、配置、依赖和副作用集合。删除 Runtime 会请求销毁其所有实例。[S8]

因此：

- 同一段插件代码可以在多个作用域、不同配置下复用。
- 重启一个 Fiber，不等于必须卸载所有同代码插件。
- HMR 替换的是代码身份及相关实例；日常配置更新可以只作用于某个实例。

这些是源码结构所支持的能力，不代表所有状态自动可迁移。[S4][S8][S11]

## 4. “时间可组合性”具体做了什么

### 4.1 Fiber 状态机

源码定义六种状态：`PENDING`、`LOADING`、`ACTIVE`、`FAILED`、`DISPOSED`、`UNLOADING`。[S4]

```text
缺少依赖 -> PENDING
依赖齐备 -> LOADING -> ACTIVE
依赖失效 -> UNLOADING -> PENDING
依赖换代 -> UNLOADING -> LOADING -> ACTIVE
执行失败 -> 清理/状态收敛 -> FAILED
显式销毁 -> DISPOSED
FAILED -- update(有效配置) --> 尝试重新执行
```

这是一张生命周期模型的简化图：状态改变由异步任务与 epoch 收敛完成，不能理解为每个箭头都同步瞬间发生，也不能据此保证公开 `state` 在所有边缘路径均准确。开放 issue [#127](https://github.com/cordiverse/cordis/issues/127) 报告非 ACTIVE Fiber 销毁后状态可能滞后；本次未独立复现该问题。[S4]

### 4.2 Epoch 与 inertia

Fiber 把各个所需服务的提供者 Fiber UID 拼成 epoch；缺少任一依赖时变成 inactive epoch。变化会触发卸载或重载，但 `inertia` 把同一 Fiber 的生命周期任务串起来，防止重入。[S4]

两个重要边界：

- **不是通用响应式状态系统。** `reflect.set()` 修改实现值但不调用 `notify()`；“服务字段变了”不等于“消费者重新执行”。epoch 主要跟踪服务提供者生命周期，不是深度数据变更。[S4][S5]
- **FAILED 不是自动重试状态。** `_setEpoch()` 遇到 `_error` 会返回；`update()` 清除错误后才能恢复。普通依赖波动不会无限重启已失败插件。[S4]

### 4.3 Effect 的价值：把清理动作变成一等公民

`ctx.effect()` 接收工厂函数，其返回值可以是 disposer、产生 disposer 的同步 iterable、解析为 disposer 的 Promise，或产生 disposer 的异步 iterable；也可以不返回值。不能直接把 Promise 或生成器对象当作参数传入。运行时把清理函数归入当前 Fiber；手动 dispose 或 Fiber 卸载时执行清理。[S4]

```ts
const stop = ctx.effect(() => {
  const timer = setInterval(tick, 1000)
  return () => clearInterval(timer)
})
```

这不是自动逆转任何 JavaScript 副作用。没有登记清理函数的外部监听器、任意后台 Promise、已发送网络请求、数据库写入或外部业务操作，不能由 Cordis 自动撤销。应把“框架管理了登记的资源”与“业务行为可回滚”分开。[S4]

同一 `ctx.effect()` 内收集的 disposer 按逆序执行，Promise 清理可以形成串行链；Fiber 顶层卸载则通过 `Promise.all()` 并发处理各个顶层 disposer。不能宣称“整个系统所有资源都严格串行逆序清理”。[S4]

## 5. “空间可组合性”与最关键的 Shadow 机制

### 5.1 Isolate：同名服务的不同槽位

`ctx.isolate('database')` 为当前派生作用域绑定新的 symbol；服务实现最终存到共享 Reflect store 的这个 symbol 上。两个分支可以提供不同的 `database`，互不冲突；没有隔离的服务仍可沿原型映射继承。[S3][S5]

这解决的是**依赖解析与模块组合的隔离**，不是进程、内存、文件系统或不可信代码的隔离。

### 5.2 Intercept：沿上下文叠加服务配置

`ctx.intercept(name, config)` 建立继承式配置映射。`Service.resolveConfig` 从祖先到当前层收集配置，再使用服务的 `Config.merge` 或浅层 `Object.assign` 合并。[S3][S7]

因此它不是自动适用于所有服务的“拦截器中间件”：服务要实际调用对应配置解析协议。默认浅合并也不等于递归合并嵌套配置。[S7]

### 5.3 服务定义位置与服务使用位置

这是整个项目最值得细读、也最容易解释错的部分。

假设长期存在的 Timer 服务被插件 A 调用：

```text
Timer 的代码定义于服务提供者上下文
插件 A 调用 Timer 创建定时器
定时器的清理责任应归插件 A
Timer 自己的内部依赖声明仍应由 Timer 的定义位置决定
```

如果简单把服务中的 `this.ctx` 永久绑定为提供者，资源可能留在提供者生命周期里，A 卸载时清不掉；如果简单把它完全改成调用者，又可能让服务内部依赖错误地从调用者的声明或作用域中解析。[S5][S6]

Cordis 用 Tracker、Proxy 和 Shadow Context 表示这两个维度：

- **def site**：控制访问代码自身的依赖声明与服务解析。
- **use site**：承接调用位置的 effects、isolate 和 intercept。

`getTraceable()`、`createTraceable()`、`createShadow()`、`createShadowMethod()` 是关键代码。上游 `shadow.spec.ts` 覆盖从根调用、嵌套服务、捕获 Shadow、可调用服务和 `noShadow` 等情况。[S6][S14]

**研究判断：这比普通 DI 容器更有辨识度，但也把复杂度压进了 Proxy、原型链、方法接收者和隐式上下文传播中。** 调试服务方法时必须同时问“它在哪里定义”和“它在哪里被调用”，不能只看表面的 `this.ctx`。[S5][S6]

## 6. Loader、Include、HMR：外围能力与真实保证

### 6.1 Loader：从配置树到插件实例

Loader 使用 `EntryTree -> EntryGroup -> Entry` 管理配置和实例关系。Entry 携带稳定 id、插件名、配置、禁用状态和注入声明，最终通过 Registry 创建 Fiber。分组和 include 可以形成嵌套树。[S9]

需要留意：

- 配置更新可以通过 `internal/update` hook 原地接受或阻止默认重启，不一定每次都重建插件。[S4][S9]
- `EntryTree.await()` 等待已知加载任务收敛并使用 `Promise.allSettled()`，不是“所有插件均成功且 ACTIVE”的全局健康断言。[S9]
- 无内部模块加载器时，Loader 会在配置所属项目的 `.cordis/resolve.mjs` 建立解析锚点，并先写入忽略规则；只读目录会走 fallback。因此 Loader 不总是纯读文件，需要评估运行目录写权限与模块解析方式。[S9]

### 6.2 Include：配置文件与内存不是简单覆盖关系

`rc.10` 的 Include 维护三类对象：[S10]

1. 上次读取或写入的文件快照。
2. 尚未持久化的运行时变更 Journal。
3. Include 自身的 Patches，用于覆盖或插入配置项。

读文件时做三方协调；运行时与文件变更不冲突则保留两边，同一键冲突时文件优先并记录日志。写入失败会恢复待写 Journal，后续触发或 dispose 时再尝试 flush。[S10]

不能把这些机制夸大为数据库级事务：

- **冲突粒度是 EntryOptions 的顶层键。** 整个 `config` 是一个键；文件改 `config.right`、运行时改 `config.left` 仍可能视为同一 `config` 冲突，而不是递归合并两边。[S10]
- Journal 是内存 Map；没有磁盘 WAL 或进程崩溃恢复协议。最后一次 flush 失败后留在内存，不代表进程退出后仍可恢复。[S10]
- 写入采用临时文件、内容预检查和 rename。预检查与 rename 是两个操作，存在检查后被其他进程修改的竞态；不是原子的跨进程 compare-and-swap。[S10]
- YAML 经解析后重新 dump，源码未保留原始注释和格式树；不要承诺编辑器式无损往返。[S10]

**研究判断：适合配置编辑与运行时管理的协调层，不应让多个互不协调的写入者把它当作强一致数据库。**

### 6.3 HMR 的三个阶段

`partialReload()` 的实际流程：[S11]

| 阶段 | 行为 | 保证边界 |
| --- | --- | --- |
| 1. 重导入 | 识别受影响模块，备份/清理 ESM 与 CJS 缓存，导入新模块并检查插件导出形态 | 此阶段失败时，旧实例尚未被卸载，可恢复选定缓存 |
| 2. 卸载 | 删除旧 Runtime，记录旧 Fiber，排除已由祖先重建覆盖的子实例 | 请求销毁先发生，异步清理尚可能在进行 |
| 3. 重建 | 每个 Fiber 等待自身 `inertia` 排空，再在旧父上下文用旧配置创建新实例 | 各 Fiber 可并发推进；新实例失败不恢复旧实例 |

关键限制：

- **不是完整事务回滚。** 第一阶段模块顶层代码已经可能产生外部副作用，恢复缓存无法撤销它们；第三阶段失败明确没有 rollback。[S11]
- 新 Fiber 的创建结果没有在这里逐个 await，因此 `hmr/reload` 事件不能解释为“所有新插件已就绪”。[S11]
- 源码 HMR 依赖 Node 内部 ESM Loader/cache 接口；实现区分 v1/v2 运行时形态，而不是仅检查 Node 大版本。不能把 Core 的可移植性等同于 HMR 的可移植性。[S9][S11]
- 内部接口不可用时，源码 HMR 被禁用，但配置文件监听和 `ctx.hmr.watch()` 路径仍可工作。[S11]
- 基础 Loader 的 `exit()` 为空方法。HMR 识别框架模块变化后调用它，不等于本仓库自带完整进程监管/重启器；应用宿主需要承接这个行为。[S9][S11]

## 7. 安全与运行边界

### 7.1 把插件和表达式配置当作代码

Loader 的 `config/utils.ts` 使用 `new Function()`、`with(ctx)` 和 `eval(expr)` 求值；Include 的 YAML `!!js` 以及 `__jsExpr` 对象会进入表达式解析链路。[S9][S10]

这意味着：

- 配置不是天然安全的数据输入。只有可信来源才能控制表达式和插件路径。
- 不应让模型、普通租户或用户上传未经验证的表达式配置后直接在高权限宿主执行。
- 需要不可信执行能力时，进程/容器隔离、文件系统与网络权限、密钥隔离应在 Cordis 外实现。

**不是本次证明了“远程未授权 RCE”或“沙箱逃逸”。** 本次没有发现并验证远程攻击入口；这里确认的是配置求值的信任模型，以及 `isolate()` 不承担安全隔离职责。[S3][S9]

### 7.2 生命周期不能替代业务治理

Core 没有为任意外部系统提供 durable task history、分布式锁、幂等键、持久队列、审批或费用预算。上述机制应由应用和相应基础设施实现，而不是从 `Fiber`、`effect` 或 “composability” 名字推导出来。[S2][S4]

对 Agent 场景，最合理的分工是：

```text
Cordis:
工具/服务装配、作用域、运行时依赖、资源生命周期

Harness:
模型调用、上下文策略、工具协议、会话/任务、交互界面

外部治理:
授权审批、沙箱、持久状态、幂等性、审计、成本与停止条件
```

这是工程分层建议，不是上游承诺提供整套实现。

## 8. 两处具体问题与其他容易踩到的语义

以下定位均针对固定提交。两处实现问题已由独立只读审查再次核对；动态探针结果在验证节单独记录。没有修改上游，也没有代用户提交 issue。

### 8.1 本地 internal/update 的 prepend 注册失败

**源码事实：** `events.ts:54-58` 对非 global 的 `internal/update` 监听器建立 `DisposableList`，再依据 `prepend` 选择 `push` 或 `unshift`；而 `utils.ts:4-39` 的 `DisposableList` 没有 `unshift()`。[S6][S15]

触发形态：

```ts
ctx.on('internal/update', (config, noSave, next) => next(), {
  prepend: true,
})
```

**影响：** 这一局部更新钩子无法优先插入，注册即抛 `TypeError`。普通事件和 `global: true` 监听器走数组路径，不能据此说“Cordis 所有 prepend 都坏了”。

**应对：** 采用前给该分支补回归测试，评估为 `DisposableList` 补充有一致删除语义的头插机制；不能随意改为 global hook 绕过，否则会改变作用范围。本次仅报告，没有实施修复。

### 8.2 一个 effect 内清理失败会跳过剩余清理

**源码事实：** `fiber.ts:280-293` 先取出并清空整组 disposer，然后逆序调用。同步抛错会退出循环；异步拒绝会让后面的 `.then(dispose)` 跳过。剩余清理已经不在原列表中，不能依靠下一次 dispose 自动补救。[S4]

**影响：** 一次嵌套清理失败可能使同组其他监听器、文件句柄或连接未关闭。反复启停/HMR 会放大这类残留。

**范围：** Fiber 顶层 `_unload()` 对每个顶层 effect 单独 `try/catch`，其他顶层 effect 仍会启动清理；问题不是“任意一次报错都会中断整个系统所有清理”。[S4]

**应对：** 自己的 disposer 应避免抛出并确保 finally 清理。若要修改框架，应明确 best-effort 清理与 AggregateError 语义，并同时测试同步/异步错误及嵌套 effect。本次仅报告。

### 8.3 其他不是同类缺陷的边界

| 行为 | 实际含义 | 使用注意 |
| --- | --- | --- |
| `await ctx.plugin()` / `fiber.await()` | 等待当前 `inertia` 并报告已有 `_error` | 缺依赖的 Fiber 仍可在 PENDING 返回，不能当 readiness barrier |
| Promise effect 被 dispose | 等待 Promise 返回 disposer 后清理 | 不会自动中断正在执行的任意 Promise；需显式取消/超时 |
| 异步生成器停止 | 下一次 `next()` 前检查 epoch | 不强制中断已经 pending 的 `next()` |
| `provide(name, undefined)` | 槽位仍存在，可视为依赖已提供 | 值是否“准备好”需由服务 check 或上层协议表达 |
| `set(name, value)` | 修改现有实现对象上的值 | 不自动发出服务变化通知或重跑消费者 |
| `ctx.inject()` 的 await | 等待当前实例生命周期收敛 | 不等于等待未来所有依赖出现 |

来源：[S4][S5][S8]。这些语义可能令使用者意外，但不能仅凭“不像别的框架”就统一判为 bug。

## 9. 本机验证：173 个用例通过，不是“全仓库已经验证”

### 9.1 环境与范围

- Windows，Node `26.7.0`，pnpm `10.28.2`。
- 研究夹具固定 `vitest 4.1.5`、`vite 7.3.2`、`cosmokit 1.8.1`、`@standard-schema/spec 1.1.0`。
- Vitest 将 `cordis` alias 到固定提交的 Core 源码；测试执行的是源码，不是 npm 已发布包。
- Loader 测试使用 `--expose-internals`；2 个 worker。
- 安装禁用生命周期脚本；在 npm registry 下载长期停滞后，使用单次命令指定 npmmirror 完成安装，没有更改全局 registry。
- 原始 JSON 结果、测试夹具、独立探针、源码 ZIP 和 SHA256 记录均保留在本地忽略目录。

执行命令，工作目录为仓库内 `temp/cordis-research-20260913/`：

```powershell
pnpm test --reporter=default --reporter=json --outputFile=verification.json
```

最后一次运行：2026-09-13 11:59:22，Australia/Sydney。

| 类别 | 文件数 | 用例数 | 结果 |
| --- | ---: | ---: | --- |
| 上游 Core | 12 | 87 | 全部通过 |
| 上游 Timer | 1 | 18 | 全部通过 |
| 上游 Loader | 6 | 59 | 全部通过 |
| 本次研究探针 | 1 | 9 | 全部通过 |
| 合计 | 20 | 173 | 0 失败 |

本地证据文件：

- `temp/cordis-research-20260913/verification.json`
- `temp/cordis-research-20260913/vitest.research.config.mjs`
- `temp/cordis-research-20260913/probes/boundaries.spec.ts`
- `temp/cordis-research-20260913/snapshot.json`

### 9.2 探针实际证明了什么

| 探针 | 观察结果 | 证据性质 |
| --- | --- | --- |
| 依赖缺失后 await、再提供及移除依赖 | PENDING 返回；服务出现后 ACTIVE；撤销后清理并回到 PENDING | 直接运行生命周期 |
| 两个隔离分支提供同名服务 | 消费者分别取得对应分支的值 | 直接运行服务隔离 |
| `set()` 更新服务值 | 新值可读取，但消费者没有重新执行 | 直接运行更新边界 |
| 提供 undefined | 消费者仍运行并达到 ACTIVE | 直接运行可用性边界 |
| local update hook + prepend | 注册抛 TypeError | **复现第 8.1 节问题** |
| 同一 effect 的第二个 disposer 抛错 | 第一个 disposer 被跳过，再次清理也未执行 | **复现第 8.2 节问题** |
| pending Promise 上调用 dispose | 不立即结束；Promise 解决后才清理 | 直接运行取消边界 |
| 配置表达式读取 `process.version` | 返回宿主 Node 版本 | 无破坏地核验求值不在安全沙箱 |
| 文件/运行时分别修改嵌套 config 的不同字段 | 仍产生整个 `config` 键的冲突，运行时变更从 Journal 移除 | 纯函数级核验，不冒称完整文件协调 E2E |

**探针通过代表“预期的观察发生了”。** 对两处问题，测试是断言现有问题能复现，而不是断言它们已被修复；上游自己的测试通过也不能消除新增探针揭示的缺口。

### 9.3 没有验证的范围

没有运行完整 Yarn/Yakumo 构建、全部上游测试、类型检查、HMR 文件监听集成测试、Include 完整文件协调测试、npm tarball 消费测试、浏览器兼容性测试、多 Node/多 OS 矩阵、负载压测或生产部署。

当前上游 CI 定义了 Node 24/26 与 Ubuntu/Windows/macOS 的测试矩阵，构建在 Node 26 上进行；它是仓库配置事实，不等于本次逐个确认那些 CI run 都成功。[S16]

本次没有修改网页交互，因此未运行本站的 Playwright 或 Astro 构建；不能将这一点写成“相关 E2E 通过”。

## 10. 维护成熟度、包名陷阱与 DeepSeek 关系

### 10.1 不是没人维护，但知识和发布权明显集中

GitHub 2026-09-13 的快照为 8,413 stars、525 forks；仓库创建于 2022-05-17。星数和仓库年龄不是当前 v4 RC 的稳定性证明。[S1]

近半年窗口 `2026-03-13` 至研究日，默认分支有 87 次提交、10 位作者，`shigma` 占 69 次，约 79%。全历史 contributors API 中，该作者为 548/571 次贡献。该统计受 API 归因和合并方式影响，不能直接推断真实团队人数，但足以提示维护知识集中的风险。[S17]

开放条目应拆开：repo 元数据里的 `open_issues_count=48` 包含 PR；逐页统计是 **9 个开放 issue、39 个开放 PR**。大量条目集中在 2026 年 8-9 月，既说明关注增加，也说明近期变更整合负担不小。[S17]

以下是值得采用者补回归测试的公开线索，**不是本次已经复现的缺陷列表**；状态为 2026-09-13 快照：

| 线索 | 报告主题 | 应验证的场景 |
| --- | --- | --- |
| [#26](https://github.com/cordiverse/cordis/issues/26) | 提供者资源与消费者异步清理的先后关系 | 消费者清理时能否继续使用所依赖资源 |
| [#34](https://github.com/cordiverse/cordis/issues/34) | LOADING 中的连续更新/ABA | 快速更新配置与依赖波动交叉 |
| [#124](https://github.com/cordiverse/cordis/issues/124) | NodeNext 声明文件消费 | 用真正的下游 TypeScript 项目安装包检查 |
| [#129](https://github.com/cordiverse/cordis/issues/129) | patch 与 Journal 持久化 | patch 覆盖插入项之后再从运行时修改 |
| [#152](https://github.com/cordiverse/cordis/pull/152) | HMR 运行中再次编辑的变更队列 | 慢清理/慢加载期间连续保存文件 |

**研究判断：维护是真实持续的，但当前更适合能锁版本、读源码、补专属回归测试的团队，不适合只依据宣传词就接受热重载和自动清理的强保证。**

### 10.2 安装错包或选错 tag 的风险

截至研究日，从 npm registry 读取：[S18]

| 名称 | 当前 tag | 含义 |
| --- | --- | --- |
| `cordis@latest` | `4.0.0-rc.10` | 当前主线上游 RC |
| `cordis@next` | `4.0.0-beta.5` | 发布于 2025-06-01，反而明显更旧 |
| `@cordisjs/core@latest` | `3.18.1` | 旧核心包线，不能等同于现有 `cordis` |
| `@cordisjs/loader@latest` | `0.13.1` | 旧 Loader 包线 |
| `@cordisjs/plugin-loader@latest` | `1.0.0-rc.7` | 当前 Loader 包名 |
| `@deepseek-ai/cordis@latest` | `4.0.2` | 下游独立发布线，不是上游已发布稳定 4.0 的证据 |

v4 主线还曾主动移除 optional inject 旧语义。2026-08-29 维护者在 #97 解释这是设计选择，建议可空查询或嵌套 `ctx.inject()`；不能机械搬运旧教程中的 optional inject 配置。[S19]

### 10.3 与 DeepSeek 的关系：有采用证据，但不能混为一体

本次不只依据 Cordis 自述，使用以下证据链交叉核对：[S20][S21]

```text
DeepSeek 自有站点 /harness/
    -> 官方 deepseek-ai/deepseek-harness 仓库
    -> vendor/README.md 登记 Cordis 导入基线
    -> workspace package.json + pnpm-lock.yaml
    -> npm @deepseek-ai/dsh 依赖 @deepseek-ai/cordis
```

可以确认：

- DeepSeek 官方 Harness 使用 Cordis 体系作为应用/插件基础设施。
- 固定 Harness 提交 `c291e7961a515f6d7af9304e7fd1d257929aef26` 的 vendor 文档登记上游 `4.0.0-rc.7` 为导入基线，并列出本地修改。
- 下游自身的包已独立发版为 `@deepseek-ai/cordis 4.0.2`，真实已发布的 dsh 包依赖这个命名空间。
- 官方 Harness 内的模型适配器使用相关 Context，但这不证明 Cordis 是 DeepSeek 模型训练、模型权重或内部推理引擎的一部分。

不能确认，也不应推导：

- `cordiverse` 组织整体由 DeepSeek 拥有。
- 下游的所有修补已经并回本次上游快照，或反之。
- Cordis 导致某项模型基准成绩，或其自身是“模型自我进化”的完整实现。

### 10.4 文档必须分清四条线

当前 Core README 推荐 Harness 的 Cordis primer，并说明独立文档仍在建设。这份 primer 有助于理解概念，但它围绕 vendored 框架编写，包含下游包名；旧独立 docs 仓库则基于早期 v4 beta，不能自动当作 rc.10 参考。[S2][S22]

阅读时务必区分：旧 v3 包、旧 v4 beta 文档、上游 v4 RC、Harness vendored 版本。尤其不要把下游 `4.0.2` 的“无预发布后缀”，当作上游 API 已经稳定的证据。

## 11. 论文：解释了设计目标，没有替代工程验证

作者论文是 *A Programming Paradigm for Spatiotemporal Composability*，`arXiv:2608.25512v1`，2026-08-26 提交，92 页。作者仓库将其描述为仍在修订的预印本；本次没有核实其已通过同行评审。[S23]

值得读的不是术语本身，而是它为“可组合”附加了哪些条件：

| 论文主张 | 前提/边界 | 原文定位 |
| --- | --- | --- |
| 撤销一个组件，同时保留其他组件的效果 | Context 中介、有效逆操作与相应独立性；追求观察等价 | §4.3.2，页 44-47 |
| 激活与卸载的依赖次序、transition 内解析一致性 | 在形式化模型和协议假设内 | 定理 70/71，页 47-48 |
| 进展与静止状态合流 | 无环、有限 Fiber、有界步骤等条件；不是持续变更必定停止 | 定理 73/80，页 49、54-55 |
| Effect 能恢复状态 | 逆操作与交换性质的正确性要由服务作者保证，运行时不自动证明 | §5.1.1，页 59 |
| 生命周期重载 | 不默认迁移旧实例私有内存；长期状态宜放在更长寿命依赖中 | 页 80 |
| 工程实践与自进化展望 | 主要观察来自 Koishi 生态；定量比较和自进化 Harness 验证仍是未来工作 | 页 70、83 |

来源均为固定 v1 论文。[S23] 作者亦明确讨论任意外部 I/O 的不可撤销性和语言级机制并非安全沙箱，见 §6.1、§6.3。

**研究判断：论文适合作为设计规范和审查清单，而不是替 npm 版本出具“已满足所有定理”的证明。** 本次复现的清理异常路径、公开讨论中的依赖卸载次序，以及源码 HMR 的实际回滚边界，都说明需要逐条建立“形式条件 -> 编码协议 -> 实现 -> 测试”的对应关系。

## 12. 是否值得采用，以及怎样开始

### 12.1 场景选择

| 场景 | 建议 | 理由 |
| --- | --- | --- |
| 本地开发工具、插件式后台、长期运行的工具宿主 | 值得小范围验证 | 动态加载、依赖波动和资源清理是其核心能力 |
| 同进程多作用域服务、多个数据库/模型连接配置 | 值得评估 | isolate/intercept 与实例生命周期有直接价值 |
| 构建自己的 Agent Harness | 可作为底层模块运行时候选 | 不必自行从零实现全部插件依赖和清理机制；业务与治理仍需另建 |
| 简单脚本、少量固定依赖、普通静态站点 | 通常无需引入 | Proxy/生命周期协议和额外测试成本可能大于收益 |
| 不可信多租户代码执行 | 不应单独依赖 Cordis | 服务作用域不是权限沙箱 |
| 财务等不能接受重复执行或丢失状态的持久工作流 | 不应把 Cordis 当作全部方案 | 幂等、持久化、事务与恢复属于其他层 |

以上是基于本次源码与验证的选型判断，不是对其他框架的性能排名。

### 12.2 推荐的最小验证项目

不要一开始就同时接入 HMR、复杂配置 patch 和完整 Agent。先做一个三插件宿主：

1. Provider：提供一个可关闭的 mock 连接，并记录 opening/closing。
2. Consumer：显式注入 Provider，创建有 disposer 的订阅或定时任务。
3. Observer：记录 Fiber 状态、错误日志、活动资源计数。

验收至少包括：乱序注册、服务退出再恢复、慢启动、慢清理、清理抛错、连续配置更新、父插件卸载、两隔离分支互不串服务。再引入 Loader/Include，最后评估 HMR。

真实接入时建议：

- 固定 Core、Loader、Include、Timer/HMR 的完整版本组合。
- 把真实 readiness 与配置加载完成分开表达。
- 对网络和后台任务使用显式取消、超时和幂等机制。
- 让重要 disposer 即便局部失败也继续清理；资源计数回归测试不能省。
- 将持久业务状态放在数据库或更长寿命依赖中，不依赖热重载保留局部对象。
- 对配置表达式和插件安装设置信任边界；不允许模型直接写入高权限执行配置。
- 为 FAILED/PENDING、清理耗时、资源残留建立监控，接入真实日志 exporter。

### 12.3 最有效的源码阅读顺序

1. `context.ts`：根对象、extend、isolate、intercept。
2. `registry.ts`：插件形态、Runtime/Fiber 身份、Inject。
3. `fiber.ts`：先读 effect，再读 epoch、reload/unload、await/update。
4. `reflect.ts`：服务槽位、依赖访问、notify。
5. `utils.ts` 与 `shadow.spec.ts`：定义位置/使用位置、Tracker、Proxy。
6. `service.ts`、Timer：如何编写可传播上下文和资源归属的服务。
7. Loader 的 Entry/Tree，再读 Include Journal，最后读 HMR。

**最终判断：Cordis 很值得作为动态模块生命周期设计的研究对象；当前版本适合受控试点，不适合把“时空可组合”直接翻译成无条件正确、无状态损失或安全可热更新。**

## 13. 本次执行异常与复现资产

按当前项目约定记录实际 shell 异常，未直接追加到 `AGENTS.md`。本项目未发现 `agent-incidents` 日志或配套记录工具，因此以下作为本次研究记录，不晋升为长期规则。

| 症状 | 根因或证据边界 | 处理与规避 |
| --- | --- | --- |
| 第一次 `rg --files ... -g '*research*' ...` 退出 1 | 该文件名过滤未匹配；不能据此断言没有 research 目录 | 改为列出现有目录；后续对预期无匹配显式处理 exit 1 |
| 在 clone 完成前运行 `git -C ... rev-parse` 提示目录不存在 | 未先等待生产目录的命令完成 | 先确认 clone 完成和目标存在，再读取 |
| 普通 clone 返回 `curl 56 / Connection was reset`；HTTP/1.1 浅克隆返回 443 连接失败 | Git HTTPS 传输受网络故障影响；API/raw/codeload 可用，未证实认证问题 | 不扩大权限；改为固定 commit codeload ZIP，并记录 hash |
| 第一次 pnpm 安装长时间不结束，随后主动终止，退出 1 | Vitest 的范围依赖解析到 Vite 8，原生包下载停滞 | 固定为上游声明的 Vite 7.3.2；主动终止不是产品测试失败 |
| 第二次固定版本安装出现 ECONNRESET、下载停滞，随后主动终止，退出 1 | npm 原生包下载在当前网络持续受阻 | 仅对本次安装指定镜像、30 秒超时与一次重试；6.2 秒安装成功；未修改全局配置 |
| 独立审查的 rg 多路径命令包含不存在的 `config/node.ts` | 猜测了未经核验的源码路径 | 移除猜测路径，先 `rg --files` 或 `Test-Path` |
| 生态统计出现日期 ToString 重载错误、数组首轮被统计成一条 | PowerShell 对 REST 数组的包裹/成员枚举处理错误 | 重新读取、直接保存返回数组、逐项转换日期；错误计数丢弃 |
| 历史 npm gitHead 的 raw README 请求返回 404 | 精确历史 URL 不可解析，未进一步证明是路径还是 revision 问题 | 不推断删除历史；改用可核验的现行固定源码与 registry |
| `web.run` 没有返回可用搜索/正文 | 检索工具没有给出可引用结果，不等于目标站点不存在 | 改读 GitHub API/raw、npm registry、官方站点和固定版本论文 |

上游测试与最终研究探针均没有失败；不要将上述环境与检索异常计入产品测试失败数。

本地临时目录 `temp/cordis-research-20260913/` 已通过 `.git/info/exclude` 精确忽略，包含：

- 固定源码目录 `cordis-f8ea3cd50f1a5724e8e715995bcde131c9c12b2c/`。
- `cordis-f8ea3cd.zip`，SHA256：`B9811A829698416F694DB37BBFD1CFB5C15C6ED04DFF1F0C8912ED6949925891`。
- pnpm 测试环境、lockfile、边界探针与 `verification.json`。
- `ecosystem-notes.md`，包含更完整的版本时间线、维护统计、论文页码和一手来源。

这些是本地复现资产，未进入版本控制；正式交付文档只有本文件。未创建远端仓库、未 commit、未 push，未留下仍运行的测试或安装进程。

## 来源索引

- [S1] [GitHub 仓库元数据](https://api.github.com/repos/cordiverse/cordis)、[固定提交元数据](https://api.github.com/repos/cordiverse/cordis/commits/f8ea3cd50f1a5724e8e715995bcde131c9c12b2c)，读取日期 2026-09-13。
- [S2] [Core README 与包声明](https://github.com/cordiverse/cordis/tree/f8ea3cd50f1a5724e8e715995bcde131c9c12b2c/packages/core)。
- [S3] [Context 实现](https://github.com/cordiverse/cordis/blob/f8ea3cd50f1a5724e8e715995bcde131c9c12b2c/packages/core/src/context.ts)。
- [S4] [Fiber、Effect 与生命周期实现](https://github.com/cordiverse/cordis/blob/f8ea3cd50f1a5724e8e715995bcde131c9c12b2c/packages/core/src/fiber.ts)。
- [S5] [Reflect、服务访问与通知](https://github.com/cordiverse/cordis/blob/f8ea3cd50f1a5724e8e715995bcde131c9c12b2c/packages/core/src/reflect.ts)。
- [S6] [Traceable、Shadow、DisposableList 实现](https://github.com/cordiverse/cordis/blob/f8ea3cd50f1a5724e8e715995bcde131c9c12b2c/packages/core/src/utils.ts)。
- [S7] [Service 实现](https://github.com/cordiverse/cordis/blob/f8ea3cd50f1a5724e8e715995bcde131c9c12b2c/packages/core/src/service.ts)。
- [S8] [Registry、Inject 与插件类型](https://github.com/cordiverse/cordis/blob/f8ea3cd50f1a5724e8e715995bcde131c9c12b2c/packages/core/src/registry.ts)。
- [S9] [Loader 源码](https://github.com/cordiverse/cordis/tree/f8ea3cd50f1a5724e8e715995bcde131c9c12b2c/packages/loader/src)。
- [S10] [Include 源码](https://github.com/cordiverse/cordis/tree/f8ea3cd50f1a5724e8e715995bcde131c9c12b2c/packages/include/src)。
- [S11] [HMR 实现](https://github.com/cordiverse/cordis/blob/f8ea3cd50f1a5724e8e715995bcde131c9c12b2c/packages/hmr/src/index.ts)。
- [S12] [根 package.json](https://github.com/cordiverse/cordis/blob/f8ea3cd50f1a5724e8e715995bcde131c9c12b2c/package.json)、[packages](https://github.com/cordiverse/cordis/tree/f8ea3cd50f1a5724e8e715995bcde131c9c12b2c/packages)。
- [S13] [Release v4.0.0-rc.10](https://github.com/cordiverse/cordis/releases/tag/v4.0.0-rc.10)、[Release API](https://api.github.com/repos/cordiverse/cordis/releases)。
- [S14] [Shadow 测试](https://github.com/cordiverse/cordis/blob/f8ea3cd50f1a5724e8e715995bcde131c9c12b2c/packages/core/tests/shadow.spec.ts)。
- [S15] [Events 实现](https://github.com/cordiverse/cordis/blob/f8ea3cd50f1a5724e8e715995bcde131c9c12b2c/packages/core/src/events.ts)。
- [S16] [上游 CI](https://github.com/cordiverse/cordis/blob/f8ea3cd50f1a5724e8e715995bcde131c9c12b2c/.github/workflows/build.yml)。
- [S17] [半年 commits](https://api.github.com/repos/cordiverse/cordis/commits?since=2026-03-13T00:00:00Z&until=2026-09-13T23:59:59Z&per_page=100)、[contributors](https://api.github.com/repos/cordiverse/cordis/contributors?per_page=100&anon=1)、[issue/PR 第 1 页](https://api.github.com/repos/cordiverse/cordis/issues?state=all&sort=updated&direction=desc&per_page=100&page=1)、[第 2 页](https://api.github.com/repos/cordiverse/cordis/issues?state=all&sort=updated&direction=desc&per_page=100&page=2)，2026-09-13 读取。
- [S18] npm registry：[cordis](https://registry.npmjs.org/cordis)、[旧 core](https://registry.npmjs.org/@cordisjs%2Fcore)、[旧 loader](https://registry.npmjs.org/@cordisjs%2Floader)、[plugin-loader](https://registry.npmjs.org/@cordisjs%2Fplugin-loader)、[下游 Cordis](https://registry.npmjs.org/@deepseek-ai%2Fcordis)，2026-09-13 读取。
- [S19] [维护者对 optional inject 的说明](https://github.com/cordiverse/cordis/issues/97#issuecomment-5462016317)，2026-08-29。
- [S20] [DeepSeek 官方 Harness 页面](https://deepseek.com/harness/)、[固定 vendor 清单](https://github.com/deepseek-ai/deepseek-harness/blob/c291e7961a515f6d7af9304e7fd1d257929aef26/vendor/README.md)、[CLI package.json](https://github.com/deepseek-ai/deepseek-harness/blob/c291e7961a515f6d7af9304e7fd1d257929aef26/apps/cli/package.json)、[下游 lockfile](https://github.com/deepseek-ai/deepseek-harness/blob/c291e7961a515f6d7af9304e7fd1d257929aef26/pnpm-lock.yaml)。
- [S21] [dsh npm registry](https://registry.npmjs.org/@deepseek-ai%2Fdsh)、[下游 Cordis 包声明](https://github.com/deepseek-ai/deepseek-harness/blob/c291e7961a515f6d7af9304e7fd1d257929aef26/vendor/cordis/package.json)、[模型适配器](https://github.com/deepseek-ai/deepseek-harness/blob/c291e7961a515f6d7af9304e7fd1d257929aef26/packages/llm/llm-deepseek/src/index.ts)。
- [S22] [固定 Cordis primer](https://github.com/deepseek-ai/deepseek-harness/blob/c291e7961a515f6d7af9304e7fd1d257929aef26/docs/cordis-primer.md)、[旧独立 docs 包声明](https://github.com/cordiverse/docs/blob/04b38dd925792e7ff0678bbe27ff30744ad57641/package.json)。
- [S23] [论文元数据](https://arxiv.org/abs/2608.25512)、[固定 v1 PDF](https://arxiv.org/pdf/2608.25512v1)、[作者仓库预印本说明](https://github.com/cordiverse/paper/blob/0d43a6f18004a7b5bf9662c31aa08c3712d232ec/README.md)。
