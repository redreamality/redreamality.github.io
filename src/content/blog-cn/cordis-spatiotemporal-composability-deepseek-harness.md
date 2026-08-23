---
title: 'Cordis 深度解析：从《A Programming Paradigm for Spatiotemporal Composability》到 DeepSeek Harness 的一切皆插件'
pubDate: 2026-08-23T00:00:00.000Z
description: '从零讲透 Cordis 插件系统、内核、可撤销 effect、反应式 coeffect、时空可组合性，以及它与 DeepSeek Harness、Koishi、Shigma 和 Cordis v4 的真实关系。'
author: 'Remy'
tags: ['cordis', 'deepseek-harness', 'plugin-system', 'spatiotemporal-composability', 'agent-harness']
lang: 'zh'
---

设想一个正在服务用户的 AI Agent。它有一个“网页研究”工具插件：插件向工具注册表登记工具，订阅会话事件，每隔一分钟刷新缓存，还持有一个大语言模型服务的引用。现在管理员不想重启进程，只想把模型提供者从 LLM-A 换成 LLM-B，然后卸载这个研究插件。

把插件装上去并不难。一次 `import`，一次 `register`，或者在 YAML 里加一行就够了。真正困难的是离开：工具名删掉了，旧的定时器是否仍在运行？事件监听器是否还握着插件闭包？正在进行的异步请求怎么办？如果先关闭 LLM-A，研究插件的清理过程还要用它提交最后一批状态，又该怎么办？

这就是动态插件系统常被低估的一半。我们很擅长讨论“如何扩展”，却很少要求一个组件回答：**你改了什么、依赖谁、离开时怎样把系统恢复到仿佛你不曾来过，同时保留其他组件后来做出的改变？**

Cordis 把这个问题拆成两条轴。时间轴关心组件离开时能否撤回自己的影响；空间轴关心依赖关系变化时，谁应该先停、谁可以重启、谁必须等待。论文 *A Programming Paradigm for Spatiotemporal Composability* 分别用 **revertible effects（可撤销效应）**和 **reactive coeffects（反应式余效应）**描述它们，再把两者统一进运行时 `Context`。DeepSeek Harness 则把这套机制用于 Agent 的模型、工具、会话、循环、沙箱与 UI 装配。

> **90 秒答案：** Cordis 是一个始于 2022 年、用 TypeScript 实现并发布为 JavaScript 包的 meta-framework（元框架）。它不规定“Agent 应该怎样思考”，而是规定动态组件怎样挂载、声明依赖、登记影响、卸载和重组。Cordis v3 长期支撑 Koishi；2026 年的预印本用 v4 系统化其组合语义。DeepSeek Harness 不是 Cordis 的别名，而是一个由 Cordis 驱动的 Agent Harness：它把 Cordis 源码 vendor 进仓库、重映射到 `@deepseek-ai` 命名空间并做本地修改，然后把 Agent 产品的大部分能力实现成插件。下文所有版本事实截止 2026-08-23。

## Cordis、论文与 DeepSeek Harness 到底是什么关系

先把几个经常混在一起的名字拆开。

**Cordis** 是上游项目，仓库位于 [`cordiverse/cordis`](https://github.com/cordiverse/cordis)。它提供 Context、插件生命周期、服务、事件、依赖解析、effect 追踪以及 Loader/HMR 等组合基础。npm 包名是 [`cordis`](https://www.npmjs.com/package/cordis)，包元数据署名作者为 Shigma。仓库使用 TypeScript；消费者运行的是编译后的现代 JavaScript，并获得 TypeScript 类型声明。

**Cordis v4** 是论文形式模型和 DeepSeek Harness vendor 代码所在的大版本线。到本文快照，上游 npm 的最新标记为 `4.0.0-rc.8`，仍是 RC（release candidate，发布候选版），不是已经冻结 API 的稳定终点。

**DeepSeek Harness**，命令名 `dsh`，是 DeepSeek-AI 开源的 Agent Harness。这里的 harness 不是狭义“测试夹具”，而是模型之外让 Agent 真正工作的运行支架：它负责模型接入、提示词、工具、会话、权限、沙箱、存储、执行循环、恢复、调度与界面。官方用一句关系式概括它：`Agent = Model + Harness`。[产品页](https://deepseek.com/harness/en/)和[固定快照的架构文档](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/architecture.md)都明确写出，模型适配器、工具注册表、会话日志和 Agent loop 也由插件提供。

**`@deepseek-ai/cordis`** 是 Harness 为自身发布而 vendor、改名并修改的版本，不是一个毫无关联的新实现。Harness 把上游 Cordis 及若干基础包复制进 monorepo，以便审计、固定版本和打补丁；`cordis` 被重映射为 `@deepseek-ai/cordis`，`@cordisjs/plugin-loader` 被重映射为 `@deepseek-ai/cordis-plugin-loader`。其 [`vendor/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/vendor/README.md)列出了生命周期加固、事务式 Loader/Include 调和、HMR watcher 与惰性配置解析等本地变化。

三个版本数字必须分开看：本文快照时，上游 npm 是 `cordis@4.0.0-rc.8`；Harness vendor 清单记录的来源约为上游 `4.0.0-rc.7`；DeepSeek 发布的重映射包是 `@deepseek-ai/cordis@4.0.1`。它们分别表示上游当前版本、被复制的来源快照和下游发布序列，不能拿来排成一条简单的升级线。

**论文**全名是 *A Programming Paradigm for Spatiotemporal Composability*，署名 Yifan Shi、Wei Zhang、Tianyi Cui，机构为北京大学与 DeepSeek-AI。当前可核验版本是 2026-08-13 的 88 页草稿。论文仓库明确称其为持续修订的 preprint（预印本，即作者公开但不代表已完成正式同行评审的手稿）；截至本文研究，没有 DOI、arXiv 条目、会议或期刊元数据，也没有机器证明产物。因此下文会说“论文提出”“手稿证明”，不会写成“学界已经验证的标准”。[论文 README](https://github.com/cordiverse/paper/blob/13f28585668a28106b2f53bedada36e45bc1ed3e/README.md)与[固定快照 PDF](https://github.com/cordiverse/paper/blob/13f28585668a28106b2f53bedada36e45bc1ed3e/paper.pdf)是本文的主要理论来源。

最后是 **Koishi**。它是建立在 Cordis 之上的聊天机器人应用框架，不是 Cordis 的旧名字。论文报告 Koishi 在约四年里形成了 4,000 多个社区插件，用来说明这套模型确实支撑过开放生态；但 Koishi 当前使用的是 Cordis v3，案例是单一生态、单一宿主语言下的观察性采用，不是 Cordis v4 的受控性能实验。

时间线也因此很清楚：npm `cordis@0.1.0` 在 2022-04-21 发布，当前 GitHub 仓库对象创建于 2022-05-17；v3 在 2023 至 2024 年持续发布；v4 从 2024 年末经历 alpha、beta 与 RC；论文和 Harness 仓库对象在 2026-08-13 出现，Harness 在 8 月中旬进入 developer preview（开发者预览）。所以更准确的叙事不是“DeepSeek 2026 年发明了 Cordis”，而是：**一个演进四年的元框架在 2026 年被系统形式化，并被 DeepSeek Harness 带进 Agent 运行时场景。**

```text
Cordis v3 ───────────────> Koishi（生产生态，论文报告 4,000+ 插件）
    │
    └─演进为 Cordis v4 ──> 论文中的形式模型
                         └─vendor / rescope / patch
                           └─@deepseek-ai/cordis
                             └─DeepSeek Harness 插件树
```

## 从静态组合到动态组合：问题为什么突然变难

**组合（composition）**是用较小部件构造较大系统。函数 `f(g(x))`、模块 `import`、构造函数注入都属于组合。它们通常有一个稳定边界：代码在编译期或启动期决定谁调用谁，释放资源则由函数返回、词法作用域结束或整个进程退出触发。

**动态组合（dynamic composition）**多了时间：组件可以在长寿命进程运行期间加入、离开、换配置、换实现。这里的 **component（组件）**是有独立生命周期并能贡献能力的单元；**plugin（插件）**是组件的一种打包和装配形式。Cordis 常把插件函数或对象视为组件定义，再为每次实际挂载创建运行实例。

若系统允许粗粒度重启，很多问题会被进程边界代劳。进程一死，操作系统回收内存、文件描述符与线程；容器编排器再用新配置拉起实例。但 Agent Harness 往往保存长会话、流式响应、工具状态和多个并发任务，频繁重启的代价很高。Cordis 关注的是**同一 JavaScript 进程内的组件粒度**：只替换受影响的插件子图，其他会话与能力继续运行。

这时问题自然分成两个互相独立的维度：

| 维度 | 它问的问题 | 失败例子 |
| --- | --- | --- |
| 时间可组合性（temporal composability） | 组件离开后，能否撤销它在生命周期内造成的影响？ | 工具名删了，但 timer、listener 和连接仍在 |
| 空间可组合性（spatial composability） | 同时存在的组件如何声明、解析依赖，并在依赖拓扑变化时协调？ | LLM-A 已替换，消费者仍握着旧 provider 引用 |
| 时空可组合性（spatiotemporal composability） | 两条轴能否同时成立？ | provider 撤出时，消费者先安全清理，再按新 provider 重建 |

这里的“时间”不是时序数据库，“空间”也不是地理坐标。时间指生命周期前后；空间指运行时依赖图中的关系位置。只做清理不能解决 provider 热替换，只做服务发现也不能清掉事件监听器。论文的价值正在于不把它们混成一句“插件支持热加载”，而是分别找出机制，再说明怎样合成。

继续用开场的研究工具插件。它需要 `llm` 和 `tools` 两个能力，启动后会产生四项影响：注册工具、监听消息、启动缓存 timer、打开网络连接。正确的动态变化应是：

```text
llm 尚不存在 -> 插件等待
LLM-A 出现   -> 插件激活，登记四项影响
LLM-A 撤出   -> 插件先停用，逆序清理四项影响
LLM-B 出现   -> 同一组件定义生成新的运行 episode，绑定 LLM-B
插件被删除   -> 清理完成，注册表中不留工具、监听器与 timer
```

**episode（运行片段）**指某个组件在一组已解析依赖下从激活到停用的一次完整经历。provider 身份变化，即便新旧对象的值看起来一样，也应该开启新 episode；否则异步过程可能在同一次激活中前半段使用 A、后半段使用 B，得到无法推理的混合状态。

### 三种看似够用、实际只解决一半的方案

第一种方案是“所有插件都实现 `stop()`”。它建立了卸载入口，却没有建立**所有权**。一个插件调用第三方库后，库又注册 listener；谁知道这项注册属于哪个实例？插件加载一半抛错时，哪些资源已经产生？两个相同插件实例并存时，`stop()` 应清哪一份？没有运行时归属和逐步 accumulator（累加器），一个大而全的 stop 函数只能靠作者自己重建执行历史。

第二种方案是“用全局 Service Map，provider 换了就覆盖 key”。它让新调用读到 B，却不能改变已经闭包捕获 A 的 consumer。更危险的是，旧 provider 何时可以关闭没有答案：立刻关闭会打断 consumer 清理；永远不关会泄漏资源；广播一个 `serviceChanged` 事件又把正确顺序推给每个插件作者。服务发现解决“现在去哪找”，没有自动解决“曾经找过的人怎样退出”。

第三种方案是“热更新失败就重启进程”。在开发服务器、小型 CLI 或无状态 worker 中，这往往是最经济的选择，不应被贬低。但在承载多会话 Agent、IDE 扩展宿主或机器人网关的长期进程里，全局重启把一个插件的局部变化放大成全部用户的中断。更细粒度的恢复只有在重启代价确实很高时才值得；Cordis 解决的是这类系统，而不是要求所有程序都动态化。

还有一个容易混淆的技巧是“把所有东西做成幂等”。**Idempotence（幂等性）**指同一操作重复执行，结果和执行一次相同。它能缓解重试，却不等于可撤销：重复 `register('tool')` 不增加第二项，不代表卸载时知道应不应该删掉第一项；删除又可能误伤另一 owner 的同名贡献。幂等需要 identity 和 ownership 才能参与正确 recovery。

## 时间维度：可撤销 Effect 如何让组件真正离开

**Effect（效应）**是程序对环境造成的改变。修改注册表、订阅事件、打开连接、创建 timer、提供服务都属于 effect；它不专指异步，也不是某个 npm 包的名字。传统 effect system 常在类型层描述“函数可能做什么”，Cordis 更关心运行时：这个具体插件实例做过哪些事，离开时由谁撤销。

最朴素的做法是给插件写 `activate()` 和 `deactivate()`。问题是两段代码相距很远，添加一种资源时很容易忘记更新卸载逻辑；中途抛错时，`deactivate()` 也未必知道哪些步骤已经完成。可撤销 effect 把获取和释放放在一起：

```ts
ctx.effect(() => {
  const timer = setInterval(refreshCache, 60_000)
  return () => clearInterval(timer)
})
```

这里返回的清理函数常叫 **disposer（处置器）**或 **inverse（逆操作）**。Cordis 不会猜 timer 应该怎样撤销；作者在创建 timer 的同一处给出 `clearInterval`，运行时负责把 disposer 归属到当前插件实例、收集起来并在正确时机调用。上游实现可见于固定快照的 [`fiber.ts`](https://github.com/cordiverse/cordis/blob/8cc9e33fab69e2d0476d126baaf2acb24e6a6ab4/packages/core/src/fiber.ts#L275-L337)。

为什么叫 inverse？设正向变化是 `f`，清理是 `g`。论文只要求 `g(f(c)) = c`：在状态 `c` 上做过 `f` 后，`g` 能把这一次改变撤回。这叫 **left inverse（左逆）**，并不要求先做 `g` 再做 `f` 也有意义。更新配置时，inverse 还必须记住执行瞬间的旧值；打开文件时，它要记住这次取得的句柄。论文把这种“在真实输入状态上选择逆操作”的形式称为 **witnessed effect（带见证的效应）**。见证不是神秘证明对象，就是这次操作留下的具体恢复信息。

多个 effect 必须按 LIFO（last in, first out，后进先出）撤销。假设插件先打开连接 A，再在 A 上注册订阅 B。卸载时要先取消 B，再关闭 A：

```text
forward:  open(A) -> subscribe(B) -> start(C)
inverse:  stop(C) -> unsubscribe(B) -> close(A)
```

这和栈展开、`try/finally`、RAII（resource acquisition is initialization，资源获取即初始化）有相同直觉。但 `try/finally` 的生命周期由词法代码块决定；Rust 的 RAII 通常由值离开静态作用域触发；Cordis 的插件可能运行数天，结束边界由配置变化、依赖撤出或 HMR 决定。它把词法范围内成熟的获取/释放纪律提升到动态组件生命周期。

跨组件交错又多一层困难。假设 A、B 都向同一个集合增加独立条目：A 加 `tool-a`，B 加 `tool-b`。执行顺序是 A、B，只撤销 A 后仍应保留 B。论文用 **independence（独立性）**描述这个前提：双方的正向和逆向操作应能交换；B 不应改变 A 当初选择哪个 inverse；若操作有返回值，B 也不能改变 A 的可观察结果。若两个插件同时修改有严格顺序的 middleware 链，它们往往不独立，就不能假装可以任意抽掉一个。正确做法是把顺序提升为显式依赖，或让一个更高层组件拥有整个链的重写。

“恢复”也不要求内存逐 bit 回到原样。论文使用 **observational equivalence（观察等价）**：只要外界通过公开的 Context 操作无法区分两个状态，就视为等价。两个路由在内部 Map 中的迭代位置变了，但按 key 查询结果完全相同，可能仍然等价；中间件顺序会改变请求结果，就不是等价。等价关系由服务接口的语义决定，不是 Cordis 自动推断。

最重要的边界是：**可撤销不等于所有副作用自动回滚。**

- `open/close`、`add/remove listener`、`set/restore old value` 通常能给出真实 inverse。
- 已发送的邮件、网络包、扣款和已经被人看见的消息越过了 system boundary（系统边界），不能把历史抹去。
- 这类 emission（向外发射的行为）可以延迟到确认点再提交，或设计 compensation（补偿动作），例如退款、追加反向账目；补偿只建立业务等价，不保证物理世界复原。
- 插件若绕过 `ctx` 直接修改 Node.js 全局状态，运行时根本看不见，也就无从追踪。
- Cordis 只组合和调用作者提供的 inverse，不证明 `clearWrongTimer()` 这样的清理逻辑是正确的。

所以，时间可组合性不是一句“有 cleanup callback”就完成了。它是一份工程纪律：影响必须经过可观察边界，获取时生成足够的恢复见证，组件内按逆序清理，组件间只有在独立或显式排序时才能局部撤回。

### 加载到一半失败时，累加器为什么重要

假设 `apply` 有四步：注册工具、订阅事件、打开连接、开始定时任务。第三步连接失败，此时第四步从未发生，但前两步已经改变共享环境。只调用一个假定“四步都成功”的 `deactivate()`，很可能访问不存在的连接；什么都不做，又会遗留工具和 listener。

**Recovery accumulator（恢复累加器）**在每一步成功时立即追加 inverse。失败发生时，不需要猜执行到了哪一行，只要展开当前累加器：先取消 listener，再移除工具。若连接已经创建但在后续认证失败，连接步骤也应在取得句柄后立即登记 close，而不是等整个初始化函数返回。资源生命周期的关键边界是“资源何时成为事实”，未必是函数何时宣告成功。

异步初始化还可以被理解为 **effect iterator（效应迭代器）**：每一步产生新状态、本步 inverse 和后续 continuation（继续计算）。运行时逐步累积已落地贡献。依赖变化或取消信号到来时，尚未发出的步骤可以不再启动；已经发出的步骤有现实惯性，完成后再回滚。这个模型比假定 Promise 可强制取消更诚实，因为 JavaScript `await` 本身不会收回已经发送的网络请求。

清理也可能失败。关闭连接抛错、撤销监听被第三方库拒绝，都会让“精确恢复”在具体实现中失效。稳健插件至少需要：disposer 尽量幂等；单个清理失败不阻止其他独立资源尝试清理；失败带上 Fiber 和 effect 标签进入结构化日志；对必须成功的外部补偿建立重试、死信或人工修复流程。论文在无失败等前提下讨论最强性质，工程系统则必须把失败当作可诊断状态。

### System boundary 不是一条天然存在的线

“系统边界内可恢复”仍需架构师选择边界。内存 Map 显然由进程控制；数据库如果使用尚未提交的事务，也可以纳入更大的原子边界；一条已被外部消费者读取的 Kafka 消息则通常不可收回。相同业务动作在不同协议下，会有不同可逆性。

常见策略有三类。**Withholding（暂缓输出）**先在内部准备结果，直到组件 episode 确认后才对外提交；**idempotent retry（幂等重试）**允许同一业务 key 重放而不重复扣款；**compensation（补偿）**追加语义相反的动作，例如退款或发布撤销事件。它们可以被插件 disposer 触发，但正确性来自外部协议，不来自 `ctx.effect` 这个函数名。文章和代码审查都应明确每项 effect 采用哪一种恢复语义。

## 空间维度：反应式 Coeffect 如何让依赖自动重接

如果 effect 是“程序对环境做什么”，**coeffect（余效应）**就是“环境必须给程序什么”。数据库连接、配置、文件系统能力、工具注册表、LLM provider 都是组件从环境读取的条件。可以用一对箭头记住：

```text
effect:   program -> world   程序改变世界
coeffect: world -> program   世界为程序提供条件
```

普通依赖注入（dependency injection，DI）常在启动时完成：容器按接口找到实现，构造对象，然后默认这个绑定一直有效。Service locator（服务定位器）则允许代码随时从全局表取对象，但通常也不负责告诉已经取走对象的消费者：“你手里的 provider 已失效，请先退出，再用新 provider 重建。”

**Reactive coeffect（反应式余效应）**把依赖声明从一次性启动检查变成持续约束。插件用 `inject` 声明它需要哪些 service keys（服务键）；共享 Context 每次变化时，运行时重新计算条件：

- 之前不满足、现在满足，是 **activating**，组件可以激活；
- 之前满足、现在不满足，是 **deactivating**，组件必须停用并撤销 effect；
- 满足状态不变，是 **neutral**，无需重建。

```ts
export const inject = ['llm', 'tools']

export function apply(ctx: Context) {
  // 只有 llm 与 tools 都已经解析时才会进入这里。
}
```

这不是 `if (!ctx.llm) throw` 的漂亮写法。后者只在某个瞬间检查；前者把“该组件能否存在”交给运行时持续维护。`llm` 缺失时，研究工具插件可以合法地保持 `PENDING`，而不是把整个进程启动判为失败；provider 出现后它自动进入加载；provider 换身份时它先退出旧 episode，再用新解析重进。依赖顺序来自声明图，不来自 YAML 中恰好谁写在上面。

更巧妙的一步是：**提供 coeffect 本身也是 effect。** Provider 在 Context 中登记 `llm` 服务，改变了其他组件可以读取的环境；这项登记也必须带 disposer。Provider 卸载时撤销服务绑定，Context 变化又触发所有 consumer 的生命周期响应。时间轴与空间轴从这里咬合起来：

```text
Provider 激活
  -> effect：注册 llm binding
  -> coeffect context 改变
  -> Consumer 的 inject 得到满足
  -> Consumer 激活并登记自己的 effects

Provider 请求卸载
  -> 先从“新解析”中隐藏旧 binding
  -> 所有已绑定 Consumer 依次退出并完成 cleanup
  -> Provider 才撤销旧 binding 与自身资源
  -> 新 Provider 就绪后，Consumer 重新激活
```

为什么不能先把 provider 从表里删掉，再广播通知？因为 consumer 的 disposer 可能仍需要它。例如数据库 consumer 在退出时要把借出的连接归还旧 pool；若 pool 已经销毁，清理反而失败。论文的 **guarded withdrawal（受保护撤回）**让 provider 先停止接受新的依赖解析，但暂时保留旧绑定，直到所有承诺使用它的 dependents（依赖者）完成退出。

运行时为此区分两份视图。**Target view（目标视图）**是按当前 Registry 计算出的“这个 Fiber 现在应该依赖谁”；**committed view（已承诺视图）**是该 Fiber 本次 episode 实际使用的 provider 身份。一次正在进行的 activation 或 deactivation 不应半途跨越两个解析结果。即便 LLM-A 和 LLM-B 暴露的对象值看起来完全一样，只要 provider identity 不同，目标也已经改变。Cordis 当前源码把 provider 的 `uid` 纳入 target/epoch 计算，可从固定快照的[生命周期代码](https://github.com/cordiverse/cordis/blob/8cc9e33fab69e2d0476d126baaf2acb24e6a6ab4/packages/core/src/fiber.ts#L385-L456)核验。

异步步骤不能被魔法取消。假设插件正在 `await connect()` 时 provider 发生变化，网络握手也许已经发出。论文称已发出的步骤具有 **inertia（惯性）**：先允许现实中的步骤落地，把已完成部分及其 inverse 纳入 recovery，再回滚旧 episode，最后转向新 target。若某一步失败，运行时回滚本 episode 已积累的 effects，再把该 Fiber 标记为失败；它不会把一个半激活组件当成合格 provider 暴露出去。

### Isolation：同名服务可以属于不同上下文

**Isolation（隔离）**改变服务解析的 realm（域）。两个并行 Agent 都注入名为 `shell` 的能力，但 Agent A 可解析到本地 shell，Agent B 可解析到远程 sandbox；上层消费者不必把接口硬编码成 `shellA`、`shellB`。Cordis 的派生 Context 或配置 `isolate` 把同一个逻辑 key 映射到不同上下文值。

这是一种运行时、上下文相关的 **ad-hoc polymorphism（特设多态）**：调用形式相同，具体实现由所处 Context 决定。它解决的是依赖解析隔离，不等于操作系统安全隔离。插件仍在同一 Node.js 进程时，恶意代码可以直接访问 `fs`、环境变量或全局对象；不可信插件必须放到进程、容器、虚拟机、WebAssembly 或 OS sandbox 等外部边界中。[论文的安全边界讨论](https://github.com/cordiverse/paper/blob/13f28585668a28106b2f53bedada36e45bc1ed3e/paper.pdf)明确承认这一点。

### Interception：不换服务名字，改变使用策略

**Interception（拦截）**不改变依赖是否存在，而是在 Context 边界包装访问。Context 或组件携带 metadata（元数据），provider 根据它应用只读路径、数据库权限、审计、超时或遥测策略。它和 isolation 的差别是：isolation 改“同名 key 解析到谁”，interception 改“解析到的能力怎样被使用”。

在 Harness 中，工具执行不是模型直接调用一个 JavaScript 函数，而会穿过 pre-execute、execute、post-execute 等扩展链。权限审批、sandbox、timeout、retry 与 metrics 可以各自拦截稳定事件点，不要求每个工具 import 所有策略实现。这是 interception 在 Agent 产品层的直观落点，但 Cordis 本身不预设“工具”领域。

### 必需依赖、可选依赖与变化风暴

不是所有 service 都应该写进必需 `inject`。如果研究工具没有 `llm` 就完全不能工作，那么它是必需依赖；如果没有 metrics 只会少一条观测，则为 metrics 的出现反复销毁整个插件可能得不偿失。**Optional dependency（可选依赖）**需要显式语义：组件可以在不持有它时运行，并通过受管理 listener 或子组件在它出现时追加能力。把真正必需和只是增强的依赖混在一起，会把小变化放大成不必要的生命周期抖动。

Provider 快速反复出现、消失会形成 **churn（变化风暴）**。运行时必须保证每个 episode 的 committed view 不混合，但应用层仍要考虑节流、去抖、健康检查与 backoff。一个刚注册就马上失败的 LLM-B 不应让数百 consumer 每毫秒重建；可以先让 provider 通过 readiness gate（就绪门）再对外 provision，或由 Loader 合并一批配置变更后一次调和。时空可组合性保证合法转换的结构，不替产品决定何时宣布新 provider 可用。

多 provider 选择也不是“随便挑一个”。Specification 可以隐含优先级、作用域、版本或 metadata；一旦选中，本 episode 就把 provider identity 写进 committed view。若系统希望负载均衡到多个后端，应把“后端池”本身做成稳定 Service，由池内部选择请求目标，而不是让同一个 Consumer 在一次激活中被生命周期解析器随请求切换 provider。前者是服务实现策略，后者是组件身份变化，两种粒度必须分开。

依赖声明还有文档价值。`inject` 不只是调度输入，也是架构图的可执行边：工具插件为何等待、provider 为何无法退出、哪个隔离域缺失实现，都可以从 Registry 诊断。与靠 import graph 猜运行关系相比，它记录的是运行时能力依赖，而不是“代码文件曾引用哪个包”。

## 为什么两者能合成一种编程范式

讲到这里，`Context` 很容易被误解成一个巨大的参数包或全局 Map。真正的 **Context paradigm（上下文范式）**有更严格的合同：共享位置以有类型的 key 成为可观察 coeffect；对这些位置的改变通过能生成 inverse 的 operation 发生；组件显式声明读取哪些 key；运行时把操作归属到组件实例，并随 Context 变化推进生命周期；派生 Context 还能隔离解析或拦截访问。

因此 Context 同时回答两类问题：

| Context 保存或中介的事实 | 运行时由此知道什么 |
| --- | --- |
| 当前可解析的 service/provision | 谁依赖谁，组件何时满足启动条件 |
| 操作所属的 Fiber | 谁造成了某项改变 |
| 每次 effect 的 disposer/witness | 该 Fiber 离开时怎样撤回 |
| target 与 committed provider identity | 依赖变化时哪些 episode 必须重建 |
| isolate/intercept metadata | 同名能力在此处解析、执行成什么 |

论文所说的 **context type（上下文类型）**也不只是 TypeScript `interface Context`。在编程语言理论里，type 可以描述一组可执行操作及其必须满足的规律。论文把以往常停留在静态判断中的 effect/coeffect context 实体化为运行时一等对象，使部署后才出现的组件也能参与同一组合协议。

这套统一还能处理一个常见争论：如果两个 effect 不交换怎么办？答案不是强行声称它们独立，而是把真实顺序关系变成 coeffect。比如工具插件必须在审计插件之后挂入 middleware 链，就声明对一个由审计层提供的能力或阶段令牌的依赖。运行时只对独立操作允许调度重排，对有关系的组件按依赖顺序协调。空间约束为时间恢复提供顺序，时间 inverse 又让空间图可以真正重组。

### 从 Component 到 Fiber 与 Registry

论文与实现之间有三个关键层次：

- **Component（组件）**是声明：需要哪些 key、提供哪些 key、激活时执行什么 effect 函数。
- **Fiber** 是某个 Component 的一次运行时实例。它拥有身份、父 Fiber、子 Context、生命周期状态、已承诺依赖和清理累加器。这里的 Fiber 不是操作系统线程，也不是 React Fiber；只是“这次插件挂载”的运行时句柄。
- **Registry（注册表）**保存当前 Fiber、父子关系、provision 与依赖解析，是运行时推进整个图的事实来源。它不是只记录插件名称的目录。

一个 Component 可以先后产生多个 Fiber episode；一个相同插件也可以在两个隔离 Context 中各挂一次。把“代码定义”和“本次运行身份”分开，才有办法准确归属 effect、区分 provider 身份并做局部恢复。

### 五个形式化结果，分别能翻译成什么工程承诺

论文逐层构造组件演算（calculus，一套用状态和转换规则描述计算的形式模型），再证明若干 metatheory（关于这套模型本身的性质）。最值得工程读者保留的是五组结果：

| 论文结果 | 通俗问题 | 成立所需的关键条件 |
| --- | --- | --- |
| Preservation，Theorem 59 | 每走一步，Registry 会不会出现悬空父子引用或已提交到不存在 provider 的坏状态？ | 初始状态良构，转换遵守论文规则与撤回 guard |
| Recovery exactness / terminal recovery，Theorem 61、Corollary 62 | A、B 操作交错后，只撤 A 能否保留 B 的贡献？ | 原子 inverse 正确；不同 Fiber 的 effect iterator 两两独立 |
| Ordering / resolution coherence，Theorem 63、64 | provider 撤出时 consumer 会不会仍拿着死引用？一次 episode 会不会半途换绑定？ | 显式依赖、受保护撤回、转换固定 committed resolution |
| Progress，Theorem 66 | 生命周期协调会不会自己卡死，能否走到没有待处理转换的稳定点？ | provider precedence graph 无环、Fiber 集有限、每个 iterator 有界、外部不无限扰动 |
| Confluence，Theorem 73 | 不同合法调度顺序最终会不会装出不同系统？ | effects 独立、依赖无环、规模有限、组件兑现全部 provision、排除失败 Fiber 等 |

**Preservation（保持性）**是“每一步都不破坏结构不变量”。**Recovery exactness（精确恢复）**是“撤掉自己的贡献而不误删别人”。**Progress（进展性）**是“只要前提满足，规则总能继续推进到静止态”。**Quiescent state（静止态）**指没有待执行生命周期转换的状态。**Confluence（合流性）**是不同合法路径最终汇合到同一个 normal form（无法再按规则化简的最终结构），允许新鲜 Fiber 名重命名与观察等价。

这些结果都不是“任意插件并发永不出错”。一个 disposer 可以写错；两个修改同一有序列表的插件可能不独立；依赖图可以成环；外部 API 可以失败；恶意代码可以绕过 Context；failed Fiber 也被排除在最强合流结论之外。形式证明的作用不是替代工程测试，而是把“为什么有效”与“在哪些前提下有效”说清楚。完整表述见固定快照 PDF 的[第 42-53 页](https://github.com/cordiverse/paper/blob/13f28585668a28106b2f53bedada36e45bc1ed3e/paper.pdf)。

### 把“为什么能工作”连成一条因果链

现在可以不借助公式，完整复述一次论证。

第一，组件对共享系统的修改必须经过 Context 能观察的 operation。这样运行时才看到 effect boundary，而不是事后扫描全局对象猜谁改过什么。第二，operation 在成功时立即产出 inverse，inverse 被 owning Fiber 收进累加器。这样组件内部即使初始化到一半失败，也能逆序撤掉已完成部分。

第三，跨 Fiber 的 effect 要么在观察语义上独立，要么由显式关系排序。如果 A、B 对不同 key 做可交换操作，调度可以交错，撤 A 后保留 B；如果两者争用有序资源，就不能伪装独立，必须把先后关系提升为 coeffect 或交给单一 owner。第四，组件通过 specification 声明所需 coeffect，Registry 才能从当前 provision 计算 target。

第五，service registration 自己也是可撤销 effect。Provider 一加入，Context 变化使 Consumer 条件满足；Provider 一离开，又让 Consumer 条件失效。第六，withdrawal guard 与 committed view 保证 Consumer 先清理、Provider 后消失，一次异步 transition 不会半路换绑定。到这里，局部 effect 的恢复纪律与全局依赖的空间协调才真正闭环。

第七，Loader 把配置树视为期望状态，因而可以只重组差异子图；HMR 能以“卸载旧 Fiber、验证并挂载新 Fiber、失败恢复”的方式复用同一生命周期。没有前六步，所谓差量热更只是覆盖引用；有了它们，局部替换才有可解释的恢复路径。

对 Agent Harness 还要加第八步：持久 session event log 保存模型可见事实。它不参与 Fiber recovery 的数学证明，却保证插件重建后能从已有会话继续。运行结构的可恢复性与业务事实的可重放性互补：前者避免残留，后者避免失忆。

### 用一个交错历史检查 Recovery Exactness

设工具插件 A 注册 `research`，观测插件 B 注册 `metrics`。实际历史可能是：A 注册工具，B 注册指标，A 启动 timer，B 订阅日志。现在只卸载 A。正确结果不是把 Registry 回滚到 A 出现前的物理快照，因为那会连 B 后来的贡献也删除；而是撤掉 A 的 timer 和工具，保留 B 的指标与日志订阅。

这就是 terminal recovery 比“恢复旧快照”更精确的地方。它从交错历史中移除一个 Fiber 的轨迹，同时保留独立轨迹。若 A 与 B 都向同一个有序 middleware 链插入位置，移除 A 是否保持 B 的相对语义就取决于接口定义；不能仅凭两个 disposer 都能 `splice` 就宣布独立。论文要求 inverse selection 与 outcome 也不受对方改变，正是为了排除这种表面可交换、实际语义耦合。

### Progress 与 Confluence 为什么需要那么多前提

无环保证不存在“所有组件都必须等另一个先提供”的封闭等待圈；有限 Fiber 和有界 iterator 保证运行时不会因为不断生成新组件或无限初始化步骤而永远忙碌；total provision 要求组件一旦宣称会提供某 key，成功激活就确实提供它；排除 failed Fiber 则避免把任意异常结果硬塞进唯一 normal form。

外部 orchestrator 若持续每纳秒改配置，系统当然可能永远到不了 quiescent state。Confluence 比较的是允许系统收敛时，不同合法独立调度最终是否观察等价，不是保证中间每个时刻都相同，也不保证已经发到边界外的邮件顺序相同。把这些前提写出来不会削弱论文，反而让工程团队知道哪些条件要由架构、类型、测试和运维共同维护。

## Cordis Kernel 解剖：最小内核里到底有什么

“Cordis kernel”是很常见的检索词，但 Cordis 官方更常称自己为 core library 或 meta-framework；并没有一个必须叫 `kernel` 的独立正式包。本文用“内核”作解释性简称，指最小的 Context 运行时与生命周期协调器，不把它伪装成产品模块名。

| 对象 | 准确定义 | 它不是什么 |
| --- | --- | --- |
| `Context` | 访问服务、注册 effect/事件、派生子上下文，并把操作归属到当前 Fiber 的一等运行时环境 | 不是无生命周期的全局对象袋 |
| `Service` | 在稳定 `ctx.<key>` 上定义或实现一种能力，由 Context 管理提供与撤出 | 不等于任意 TS interface，也不自动是远程服务 |
| `Plugin` | 由函数、对象或 Service class 表达的装配与生命周期单位 | 不一定对外提供 Service |
| `Fiber` | 一次插件挂载的运行时身份、状态机和 recovery owner | 不是线程，也不是 React 的渲染 Fiber |
| `Registry` | 枚举并协调 Fiber、父子关系、依赖与 provision 的事实表 | 不是 npm registry 或插件商店 |
| `EventsService` | 提供类型化事件与多种分发模式 | 不是自动持久化的 event log |
| `LoggerService` | 结构化日志能力，输出位置由上层插件决定 | 不是组合理论的必要公理 |
| `Loader` | 把声明式配置调和成 Fiber 树，并参与模块替换 | 不只是按行 `import` 的启动脚本 |

一次最小挂载的调用关系大致如下：

```text
root.plugin(plugin)
  -> Registry 建立 Fiber 与 child Context
  -> 读取 inject，计算 target view
  -> 依赖满足后执行 apply(ctx)
  -> ctx.effect / ctx.on / ctx.plugin / service registration
     都归属到这个 Fiber
  -> apply 完成，Fiber 进入 ACTIVE
  -> 显式 dispose、父级退出或依赖 target 改变
  -> 先协调 dependents，再执行该 Fiber 的 recovery
```

`Plugin`、`Service` 与 `Event`也必须区分。插件是“谁拥有生命周期”，Service 是“它向其他组件提供什么可直接调用的能力”，Event 是“组件间通过事实或扩展点通信的契约”。一个日志 observer 可能只是插件，监听事件但不提供 Service；一个 LLM provider 常以 Service 形式提供能力；工具策略则可能通过事件拦截链参与执行。

Cordis/Harness 的事件也不是一种模式包打天下。`emit` 同步通知且不等待返回；`parallel` 等待多个异步 listener 并发结束；`serial` 按顺序等待；`waterfall` 是 around-middleware，listener 收到 `next()`，可委托下游、短路或改写返回值。Harness 的 `agent/request` 与工具执行策略使用 waterfall，普通 session 观察则更接近通知。把模式写清楚，才能避免一个高优先级 listener 无意中吞掉全局流程。[Cordis primer](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/cordis-primer.md)给出了这几种分发语义。

### 为什么 Context 不是“高级全局变量”

从调用表面看，`ctx.llm` 很像从一个对象读取全局属性，`ctx.set` 或 `ctx.provide` 很像向 Map 写值。差别藏在每次操作携带的运行时信息里：读取发生在哪个隔离域，当前 owner 是哪个 Fiber，这项 provision 来自哪个 provider identity，登记操作应放进哪一个 recovery accumulator，哪些 consumer 的 committed view 指向它。

普通全局变量只有值，没有这些关系。值从 A 换成 B 后，旧闭包、所有权和清理顺序不会自行出现。Context 的深度不是“把 API 都集中到 `ctx`”，而是让一次看似普通的读取或写入同时参与生命周期协议。若新增一个共享能力只是往 Context 对象随手挂属性，却没有 Definition、provision、inject 和 disposer，它仍然绕开了范式边界。

**Service Definition（服务定义）**应固定 key、类型和行为语义，最好还说明哪些操作可交换、返回值能否被拦截、错误怎样传播。**Service Provider（服务提供者）**拥有实现与资源。**Consumer（消费者）**只依赖 Definition。三者拆开以后，Registry 看到的是“谁提供/谁依赖”的运行关系，包管理器看到的是“谁引用类型定义”的静态关系；两张图相关，却不是同一张图。

诊断也因此可以比“Cannot read properties of undefined”具体。一个 PENDING Fiber 应能说明缺哪个 key、当前 realm 有哪些候选 provider；一个无法撤出的 Provider 应能列出仍在 committed view 中引用它的 dependents；一个 FAILED Fiber 应带出出错 episode 和已经回滚的 effects。形式模型给出正确状态，生产可用性还依赖日志、超时、可视化与错误上下文把这些状态展示给人。

### 事件是 Effect，也是公共协议

`ctx.on()` 的便利不只在少写一次 `off()`。固定源码显示 listener registration 被包装成 effect，owner 卸载时自动 unregister。这把“谁监听了什么”纳入 Fiber 清理。但事件名称、参数类型、分发模式与优先级仍是跨插件公共 API；自动注销不能修复一个语义含糊的协议。

通知型事件适合“事实已经发生”，观察者失败通常不应改变事实；waterfall 适合“请求仍可被包裹和决策”，listener 不调用 `next()` 就可能短路。把二者混用会产生隐蔽耦合：一个本想做 metrics 的插件若挂在可短路链上并忘记 `next()`，整个模型请求就停止。元框架提供组合机制，领域框架仍要为每个 extension point 定义时序、错误与幂等合同。

## 插件生命周期：从 PENDING 到 DISPOSED 的完整旅程

官方教程给出的实现状态机是：

```text
PENDING -> LOADING -> ACTIVE -> UNLOADING -> DISPOSED
                \-> FAILED
```

这些词描述的是诊断可见的运行状态，不应与论文为证明方便而使用的抽象状态机械一一对应。

**PENDING（等待中）**表示插件声明已经存在，但必需 service 尚未就绪。它可以是长期合法状态：可选 profile 中的插件在用户没有安装某个 provider 时等待，并不代表系统损坏。**LOADING（加载中）**表示依赖已经满足，`apply` 正在执行。成功后进入 **ACTIVE（活跃）**，此时插件对外提供的能力可以被新 consumer 解析。配置校验或 `apply` 抛错会进入 **FAILED（失败）**；失败 episode 已完成的 effects 应先回滚。

**UNLOADING（卸载中）**表示 Fiber 正在停止 provision 并执行 recovery。多个 disposer 按逆注册顺序启动，但官方教程提醒：异步 disposer 可能并发。如果清理必须严格串行，例如“先 flush 日志，再关闭连接”，应把两步放进同一个 disposer 并显式 `await`，不要仅依赖两个独立回调的登记顺序。全部完成后才是 **DISPOSED（已处置）**。[生命周期教程](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/cordis-tutorial/02-lifecycle-and-effects.md)说明 `fiber.dispose()` 会等待异步清理，并递归处理子插件。

把状态机放回研究工具的故事，会得到一段比“on/off”更完整的旅程：

1. 配置声明研究工具插件，Registry 创建 Fiber。`llm` 尚不存在，因此它是 PENDING。
2. LLM-A Provider 激活并登记 `llm`。工具插件的 target 得到满足，进入 LOADING。
3. `apply` 注册工具、listener、timer 和连接；每项影响都归属到该 Fiber。完成后进入 ACTIVE。
4. 管理员用 LLM-B 替换 LLM-A。旧 provider 先从新的 target resolution 中退出，但 committed binding 暂时保留。
5. 工具插件进入 UNLOADING。它先停止 timer、取消 listener、移除工具，最后关闭连接；若 cleanup 还需 LLM-A，此时旧 binding 仍可用。
6. consumer 清理完成后，LLM-A 才撤回服务并释放自身资源。工具插件回到等待，随后解析到 LLM-B，开启全新 episode。
7. 最终删除工具配置时，新 episode 也完整退出；Registry 中不再有工具或子 Fiber，进入 DISPOSED。

父子插件让所有权也可组合。`ctx.plugin(child)` 不是随手启动一个无人管理的任务，而是把 child Fiber 归到当前 Fiber。父插件 dispose 时，子树先被协调退出；如果父插件加载到一半失败，已经挂载的 child 也属于本 episode 的 recovery。这解决了插件内部再装插件时的资源归属问题。

HMR（hot module replacement，热模块替换）尤其依赖这条语义。把 Node 模块缓存删掉再 `import` 新文件，只是换了代码对象；旧 listener、旧 service 和旧闭包仍可能活着。可靠的热替换必须把旧 Fiber 当作真实组件卸载，确认 recovery 完成，再让新代码建立新 Fiber。若新版本验证或加载失败，事务式 Loader 还要恢复旧版本，不能把系统留在一半新、一半旧的状态。

### 卸载不是一个瞬间，而是一段需要可观察的协议

用户点击“禁用插件”时，配置目标可以立即改变，但物理资源不会同一纳秒消失。UNLOADING 期间可能在等待流式请求结束、子进程退出或外部补偿完成。控制面应显示“正在卸载”，而不是过早报告“已删除”；新请求应停止解析到旧 Provider，旧 Consumer 的清理仍应获得 committed binding。

这段过渡需要 timeout 和失败政策。无限等待一个 disposer 会阻塞 provider withdrawal；强制超时又可能留下资源。合理做法取决于资源：内存 listener 可立即撤销，HTTP 请求可通过 `AbortSignal` 协作取消，子进程可先发终止再升级为 kill，账务补偿则可能进入后台重试。Cordis 提供 owner 与顺序骨架，具体终止协议仍属于 Service Definition。

重复 dispose 也要求语义清楚。一个被父 Fiber 递归清理的 child，业务代码若同时调用 dispose，底层应避免重复释放，但插件作者仍不该依赖竞态。把生命周期控制集中给 owning Context，暴露稳定的“请求停止并 await 完成”接口，比到处保存裸 disposer 更容易推理。

### 失败不应该等同于全局崩溃

FAILED Fiber 不再提供声明的 coeffect，因此依赖它的 Consumer 会保持或回到 PENDING；同一 Registry 中不相关的兄弟 Fiber 可以继续服务。这是细粒度组件模型相对全进程启动脚本的价值之一。但局部失败是否可接受属于产品政策：核心认证 Provider 失败也许必须阻止应用 ready，可选 metrics 插件失败则只需告警。

因此启动完成不应只检查“Node 进程还活着”。系统要定义 readiness：哪些关键 Fiber 必须 ACTIVE，哪些允许 PENDING，哪些 FAILED 会降级，配置调和何时算完成。论文的 quiescent state 只表示没有待推进转换，不表示业务健康；一个所有核心组件都因缺依赖而静静 PENDING 的系统也可能已经静止，却完全不可用。

## Cordis Plugin System：事件、服务、配置与 HMR 如何协作

“Cordis plugin system”至少包含四层，不能全部压成 `ctx.plugin()` 一个 API。

第一层是**代码插件**。最小形式是接收 `ctx` 的函数，也可以是带 `apply(ctx)` 的对象，或继承 `Service` 的 class。插件声明 `inject`，由父 Context 挂载。代码模块承载定义，Fiber 承载运行实例。

第二层是**服务与事件**。Service 适合一个 consumer 直接调用一个稳定能力，例如 `llm.complete()`；Event 适合观察事实或参与扩展链，例如在每个工具执行前做权限判断。服务登记、listener 登记和 registry registration 都应返回或内建 disposer，成为 owning Fiber 的 effect。

第三层是**声明式 Loader**。YAML/JSON 里的 entry 不是只能从上到下执行一次的启动清单，而是 desired state（期望状态）。稳定 `id` 是 reconciliation key（调和键）：Loader 比较新旧 entry tree，识别新增、删除、移动和配置变更，再把实际 Fiber tree 调整到目标。`disabled` 可以保留配置但撤出实例；`isolate` 可以让某个子树使用独立 service realm。

```yaml
- id: llm-primary
  name: ./plugins/llm-a

- id: research-tool
  name: ./plugins/research-tool
  config:
    refreshInterval: 60000

- id: experimental-observer
  name: ./plugins/observer
  disabled: true
```

第四层是 **reconciliation 与 HMR**。Reconciliation（调和）是“比较期望状态和实际状态，只修改差异”的循环；这和 Kubernetes 有一点直觉相似，但粒度完全不同：Kubernetes 调和容器与服务，Cordis 调和同一进程内的 Context、插件和 Fiber。HMR 再把模块依赖图纳入 diff：识别 stale entries（受旧模块影响的条目），验证新模块，卸载旧实例、挂载新实例；失败时回到可工作的旧状态。

DeepSeek vendor 版本在这层加入了本地 hardening 与 transaction-like reconciliation。“Transaction-like（类似事务）”是谨慎用词：它表示 Loader 尽量原子地切换插件树并在失败时恢复，不表示外部邮件、文件写入或所有业务状态都获得数据库 ACID 事务。

稳定 ID 也解释了为什么配置 overlay 能精确修改产品。若 patch 只能按数组位置操作，上游 bundle 插入一行就会让所有下游偏移；按 ID 替换则能表达“把 `llm-primary` 的 provider 换掉，但保留其他条目”。动态插件系统的配置由此成为可以持续调和的结构，而不是一堆只在启动瞬间生效的命令。

### 一次事务式热更至少跨过哪些关口

可以把可靠 HMR 理解为三阶段，而不是一个 `import()`：

1. **准备阶段**读取变化的模块依赖图，解析新代码和配置，找出受影响 entries，并尽可能在不触碰旧实例时完成 schema 验证。
2. **切换阶段**阻止旧 provider 接收新解析，按依赖方向撤出 affected Fibers，再挂载新定义。未受影响子图不应为了方便一起重启。
3. **提交或恢复阶段**确认新 Fiber 达到预期状态后接受新树；若加载失败，清理新 episode 并重新建立旧定义，给出可定位的错误。

这里的“恢复旧定义”不等于把旧插件私有内存原样保存。若 HMR 要保留会话、索引或下载进度，这些状态必须位于更稳定的 Service，或提供显式序列化/迁移契约。Clean-slate reload（从干净状态重载）与 state migration（状态迁移）是两个功能，不能因为 UI 看起来没有刷新就假定都完成了。

配置 ID 还承担长期兼容性。Bundle 作者一旦发布稳定 ID，下游 profile 可能用 patch 引用它；随意改名会让覆盖层静默失效或生成重复插件。ID 应跨文案翻译和文件重排保持稳定，删除或重命名则需要迁移提示。插件包的 semver 之外，配置树本身也形成一层公共 API。

## 为什么叫 Meta-Framework，而不是又一个应用框架

**Framework（应用框架）**通常规定某个领域的对象和控制流：Web 框架有 route、request、middleware；聊天机器人框架有 command、message、adapter；Agent Harness 有 model、tool、session、turn 与 sandbox。

**Meta-framework（元框架）**在这里不是“比框架更大”的营销词，而是构造这些框架的底层框架。Cordis 不规定模型怎样流式输出，也不规定聊天命令怎样匹配；它规定组件如何贡献、依赖、撤回和重组。上层再用 Service 与 Event 定义自己的领域词汇：

```text
应用层：具体 Agent、聊天机器人、Web Console
   ↑
领域框架：DeepSeek Harness 的 tool/session/turn，或 Koishi 的 command/message
   ↑
Cordis：Context / effect / coeffect / Fiber / Loader / HMR
```

因此，“Cordis 是 plugin system、kernel、framework 还是 meta-framework？”最准确的回答是：它是以插件系统和 Context runtime 为核心的 TypeScript 元框架；“kernel”是对其最小协调核心的非正式称呼；上层可以用它构造领域框架。几个词观察的是不同层面，并不互斥。

Koishi 是这一分层的生产案例。论文称 Koishi v3 在 Cordis 上发展出 4,000 多个社区插件，说明不同作者确实能围绕同一 Context 契约组合命令、数据库、适配器与服务。插件作者通常不必维护一条远离注册代码的完整卸载路径，服务依赖也能跨包协调。

但证据强度要如实写：它只说明“存在一个规模可观的采用生态”，不能证明 Cordis 相比 OSGi、普通 DI 或其他架构性能更高、开发更快；也不能把 v3 生态直接当成 v4 形式规则全部经受了 4,000 个插件验证。论文自己把单生态、单宿主语言和缺少量化基线列为限制。[案例讨论](https://github.com/cordiverse/paper/blob/13f28585668a28106b2f53bedada36e45bc1ed3e/paper.pdf)集中在第 66-67 页。

## DeepSeek Harness：一切皆插件到底落在何处

Agent 模型能生成下一段 token，但一个生产 Agent 还要知道当前目录、可用工具、历史会话、权限边界、如何处理工具结果，以及什么时候继续请求模型。**Agent Harness**就是承载这些非模型职责的运行环境。本站此前的[《Agent Harness 模式》](/cn/blog/inside-claude-code-agent-harness/)聚焦循环怎样在真实世界存活；本篇进一步追问，循环本身和它依赖的能力能否动态重组。

DeepSeek Harness 的答案是“Everything is a Plugin”。这句话不是说进程里没有启动代码、Cordis 没有核心库，也不是说所有插件有相同权限；它说的是：产品功能不应被藏进一个只能修改内核才能替换的特权模块。固定快照的架构文档列出，LLM adapter、tool registry、session log、Agent loop、sandbox、storage、scheduler 与 UI 都由插件装配。

### Capability seam：把定义、实现与使用者拆开

Harness 用 **capability seam（能力接缝）**组织值得替换的能力。Seam 指一个稳定的模块边界，边界两侧可以独立变化。完整 seam 有三个角色：

1. **Service Definition** 定义稳定的 `ctx.<key>`、请求/结果类型和语义合同。
2. **Service Provider** 提供一个实现，可以有本地、远程或 sandbox 等多个版本。
3. **Consumer** 只注入 Definition，把能力用于更高层功能，例如向模型暴露一个 Bash tool。

官方文档的 Bash 例子很具体：`dsh-shell` 定义接口，`dsh-bash-local` 与 `dsh-bash-sandbox` 提供不同后端，`dsh-tool-bash` 把它变成模型可调用工具。Provider 和 Consumer 都依赖 Definition，却不彼此 import。替换底层 shell provider 后，Bash、PTY、LSP 等 consumer 可以一起迁移到另一个执行世界。[能力设计实践](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/user/develop/practice/index.md)也提醒：不是每个简单工具都值得预先拆成三个包，只有角色确实需要独立演化时才应建立 seam。

### Profile、bundle 与 patch：配置就是产品装配线

一次 `dsh` 运行不是加载一张硬编码模块表，而是从多层配置得到最终插件树：

- **Profile** 是用户选择的具名组装，包含按顺序叠加的 bundles、外部插件和本地 patch。
- **Bundle** 是一组 Cordis entries、配置与相关代码的分发单位。
- **Patch/overlay** 是覆盖层，按稳定 ID 替换配置或插入 entry。

```text
空插件树
  + profile 中 bundles 的 patches（按顺序）
  + profile/cordis.patch.yml
  + $DSH_HOME/cordis.patch.yml
  + 命令行 --patch overlay
  = 最终运行插件树
```

`web` 与 `headless` 是官方模板，底部共享 `dsh-base` 能力，再叠加不同入口。用户可用 `dsh --profile web --dump-config` 查看实际装配结果，而不是从包名猜运行时结构。[CLI/Profile 文档](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/apps/cli/README.md)记录了这条配置链。

### Agent Loop 也只是插件

Harness 把一次交互分成三个不同概念：**step** 是一次模型请求及其触发的工具执行；**turn** 是一次输入被接纳后的完整 drain，可含多个 step；**round** 是更外层策略的一次迭代，例如 fresh-agent attempt。Cordis 本身不规定这些词，`dsh-agent-loop` 插件用 Cordis Service 与 Event 实现它们。

```text
用户输入 -> inbox -> turn/start
  -> agent/pre-step
  -> step/start
  -> system prompt + tool schemas
  -> agent/request -> llm/stream
  -> assistant message
  -> tool/call*
       -> tools/pre-execute（policy / approval / sandbox）
       -> tools/execute（timeout / retry / tool body）
       -> tools/post-execute（接受、阻止或改写结果）
       -> tool/result*
  -> step/end
  -> 必要时继续下一 step
  -> turn/end
```

这里还有两种数据面。`turn/*`、`step/*`、`user/message`、`assistant/*`、`tool/*` 是 durable session events（持久会话事件），用于恢复、UI 和回放；`agent/*`、`tools/*` 等是 live extension points（当前运行扩展点），用于策略与拦截。模型看到的 system prompt、reasoning、工具调用与结果、subagent 调度等被追加进 session log。**Append-only（只追加）**表示新事实追加而不就地篡改历史，有利于审计与重放，但不会自动解决敏感数据访问、保留期与删除治理。

Cordis 的 recovery 与 session log 解决的是两件不同的事：前者恢复当前运行结构，回答“旧插件是否留下资源”；后者重建模型可见历史，回答“这次对话和工具事实发生过什么”。记录了事件不代表外部 effect 可逆，插件能卸载也不代表会话历史被持久保存。

### 工具执行为什么不是一次函数调用

模型产生 tool call 后，Harness 先持久化调用，再进入 pre-execute、monotonic guards（只能收紧不能放松的单调保护）、一次性审批、execute around chain、工具主体、post-execute、结果规范化与最终冻结，最后记录权威 `tool/result`。权限、sandbox、timeout、retry、metrics 与 UI 表现由不同插件插入稳定扩展点，工具本身不需要直接依赖所有策略包。[工具执行流水线](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/tool-execution-pipeline.md)给出了完整顺序。

这才是“一切皆插件”的工程价值：重点不是插件数量，而是把容易一起纠缠的职责放到可替换 seam 上，同时让每项注册随 owning Fiber 撤回。它的代价也很真实：事件名称、优先级、短路规则、durable/live 边界都会成为公共合同，随意的 waterfall listener 足以改变全局行为，必须配套文档、版本管理和集成测试。

最后再强调证据边界：DeepSeek Harness 真实采用、vendor 并修改了 Cordis，这是源码可证的工程选择；但论文结论仍把 self-evolving agent harness（可持续自修改的 Agent 支架）列为未来验证方向。现有采用不能被写成“论文已经通过实验数学证明 Harness 可以安全自治演化”。

### 从一个 Profile 到一次工具调用，插件怎样真正相遇

把各层串起来看：用户选择 `web` profile，CLI 按顺序叠加 base bundle、Web bundle、个人 patch 与命令行 overlay，得到带稳定 ID 的 Cordis entry tree。Loader 为 entries 建立 Fiber；LLM、session、tools、shell 与 agent-loop Provider 先后达到 ACTIVE，依赖它们的 Consumer 随 target 满足而启动。Web UI 只是另一个读取 session 与控制服务的插件，不需要成为所有能力的宿主。

用户发送消息后，session 插件先把输入变成 durable event，Agent Loop 从 inbox claim 它。System-prompt 组装器和工具注册表提供模型请求上下文，LLM adapter 流式返回内容。若模型选择 Bash，工具 Consumer 并不直接 import 本地子进程实现，而通过 shell Service Definition 到当前 realm 的 Provider；pre-execute waterfall 可以要求审批，execute 层设置 timeout，post-execute 规范化结果，session 再记录权威输出。

此时管理员把 shell 从 local 换成 sandbox。对 Cordis 而言，这是 provider identity 与依赖 target 变化；对 Harness 领域而言，它意味着 Bash、PTY 或 LSP 等 consumers 需要在新执行世界重建。旧 provider 必须等 dependents 清理后退出，新的工具调用才进入 sandbox。若只是修改某个工具的 UI renderer，则 diff 应只触及相应插件，不必重启 LLM 或 session log。

这段路径说明 Cordis 不“理解”模型、Bash 或审批。它只理解 Context operation、provision、inject、Fiber 与 effect；Harness 用 Service Definition 和事件名称赋予这些机制领域意义。也正因为分层，理论保证只能覆盖 Context 中介的结构，工具命令是否安全、模型输出是否正确、审批政策是否充分仍由上层负责。

### “可追踪”为什么不能只靠插件生命周期

Harness 的原则 “Model-visible means logged” 要求进入模型请求的内容能由 append-only 日志重建。否则一个 prompt-injection 防护插件热换后，团队可能知道当前加载了哪版插件，却不知道某次历史请求究竟注入了什么上下文。Fiber 日志回答运行结构，session log 回答业务事件，两者需要关联 ID 才能做完整审计。

反过来，只有 session log 也不够。回放记录能说明工具曾被调用，却不能自动取消旧 timer、释放端口或撤出工具注册。把运行生命周期和持久事实混为“都有日志”会留下两类缺口。成熟 Harness 应在观测层连接 session、turn、step、Fiber episode、provider uid 与配置 revision，同时保留各自不同的恢复语义。

## 从零写一个可装、可撤、可换依赖的插件

抽象机制最好用一次真实运行收尾。下面示例只使用上游 `cordis@4.0.0-rc.8`，不混入 `@deepseek-ai/cordis` 或 Harness 的工具包。它在 Node.js v23.5.0、pnpm 10.15.1 下按原样运行通过；这些环境版本是复现实验记录，不是 Cordis 官方最低版本声明。

示例用 `toolbox` 代表贯穿全文的工具注册服务。Consumer 依赖它，激活时注册一个工具、一个事件监听器和一个 timer。先提供 A，再移除 A、提供 B，最后卸载。断言既检查生命周期状态，也检查资源是否真正消失。

```js
import assert from 'node:assert/strict'
import { Context, FiberState } from 'cordis'

const root = new Context()
const tools = new Map()
const liveTimers = new Set()
const stats = { activations: [], cleanups: [], events: 0, ticks: 0 }
const stateName = state => FiberState[state]
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

function makeToolbox(version) {
  return {
    version,
    register(name, run) {
      assert.equal(tools.has(name), false)
      tools.set(name, { version, run })
      return () => tools.delete(name)
    },
  }
}

const ToolboxProvider = {
  name: 'toolbox-provider',
  apply(ctx, { version }) {
    // makeToolbox 是示例替身，不是 Cordis core 内置的 tools API。
    ctx.provide('toolbox', makeToolbox(version))
  },
}

const Consumer = {
  name: 'consumer',
  inject: ['toolbox'],
  apply(ctx) {
    const version = ctx.toolbox.version
    stats.activations.push(version)

    ctx.on('probe', () => stats.events++)

    ctx.effect(() => {
      const timer = setInterval(() => stats.ticks++, 5)
      liveTimers.add(timer)
      return () => {
        clearInterval(timer)
        liveTimers.delete(timer)
      }
    }, 'consumer timer')

    ctx.effect(() => {
      return ctx.toolbox.register('hello', () => `hello from ${version}`)
    }, 'consumer tool')

    return () => stats.cleanups.push(version)
  },
}

const consumer = root.plugin(Consumer)
assert.equal(consumer.state, FiberState.PENDING)
console.log('01 missing provider:', stateName(consumer.state))

const providerA = root.plugin(ToolboxProvider, { version: 'A' })
await providerA.await()
const providerAUid = providerA.uid
await consumer.await()
assert.equal(consumer.state, FiberState.ACTIVE)
assert.equal(tools.get('hello').run(), 'hello from A')
root.emit('probe')
await sleep(20)
assert.equal(stats.ticks > 0, true)
console.log('02 provider A:', stateName(consumer.state))

await providerA.dispose()
await consumer.await()
assert.equal(consumer.state, FiberState.PENDING)
assert.equal(tools.size, 0)
assert.equal(liveTimers.size, 0)

const eventsAfterA = stats.events
const ticksAfterA = stats.ticks
root.emit('probe')
await sleep(20)
assert.equal(stats.events, eventsAfterA)
assert.equal(stats.ticks, ticksAfterA)
console.log('03 provider A removed:', stateName(consumer.state))

const providerB = root.plugin(ToolboxProvider, { version: 'B' })
await providerB.await()
assert.notEqual(providerB.uid, providerAUid)
await consumer.await()
assert.equal(consumer.state, FiberState.ACTIVE)
assert.equal(tools.get('hello').run(), 'hello from B')
root.emit('probe')
await sleep(20)
assert.equal(stats.ticks > ticksAfterA, true)
assert.equal(providerB.uid !== providerAUid, true)
console.log('04 provider B replacement:', stateName(consumer.state))

await consumer.dispose()
await providerB.dispose()

const finalEvents = stats.events
const finalTicks = stats.ticks
root.emit('probe')
await sleep(20)
assert.equal(consumer.state, FiberState.DISPOSED)
assert.equal(tools.size, 0)
assert.equal(liveTimers.size, 0)
assert.equal(stats.events, finalEvents)
assert.equal(stats.ticks, finalTicks)
assert.deepEqual(stats.activations, ['A', 'B'])
assert.deepEqual(stats.cleanups, ['A', 'B'])
console.log('05 final:', stateName(consumer.state))
```

复现命令如下：

```sh
pnpm init
pnpm add cordis@4.0.0-rc.8
node lifecycle.mjs
```

为节省篇幅，代码中的 `console.log` 只打印状态；验证时记录的核心输出和资源快照是：

```text
01 missing provider: PENDING
02 provider A: ACTIVE
   activations=[A], tools=[hello], liveTimers=1, events=1
03 provider A removed: PENDING
   cleanups=[A], tools=[], liveTimers=0
   listenerFiredAfterCleanup=false, timerTickedAfterCleanup=false
04 provider B replacement: ACTIVE
   activations=[A,B], tools=[hello], liveTimers=1, events=2
   providerChanged=true
05 final: DISPOSED
   cleanups=[A,B], tools=[], liveTimers=0
   listenerFiredAfterCleanup=false, timerTickedAfterCleanup=false
```

### 一行一行看，真正发生了什么

`root.plugin(Consumer)` 先创建 Fiber。由于 `inject: ['toolbox']` 尚未满足，`apply` 根本不会执行，状态是 PENDING。这比“先运行然后访问 `undefined` 报错”强，因为等待是模型中的一等状态。

`root.plugin(ToolboxProvider, { version: 'A' })` 建立独立 Provider Fiber；它在自己的 `apply` 里用 `ctx.provide` 提供 coeffect。A 出现后 target 满足，Consumer 进入 ACTIVE。`ctx.on` 的监听登记由 Context 管理；timer 没有 Cordis 专用高阶 API，于是显式包进 `ctx.effect`；工具注册表本身返回 disposer，再直接作为这项 effect 的 inverse。三类不同资源最终都归属于 Consumer Fiber。

调用 `providerA.dispose()` 并不是只把 `root.toolbox` 设成 `undefined`。运行时看到 committed provider 将失效，先让 Consumer 执行 recovery。断言随后证明工具 Map 已空、timer Set 已空；再次发 `probe` 或等待 20 ms，计数不再增加，说明 listener 与 timer 不只是“逻辑上禁用”，而是真的解除。Provider 的登记、撤回与 dependent 通知可在固定快照的 [`reflect.ts`](https://github.com/cordiverse/cordis/blob/8cc9e33fab69e2d0476d126baaf2acb24e6a6ab4/packages/core/src/reflect.ts#L175-L227)中核验。

B 出现后，组件定义没有改变，但产生了新 episode。A、B 是两个独立 Provider Fiber，公开 `uid` 不同；断言 `providerChanged=true` 因而验证的是 provider identity 变化，不只是同一个对象改值。闭包中的 `version` 重新捕获 `B`，工具返回 `hello from B`，激活记录成为 `['A', 'B']`。最后 `consumer.dispose()` 结束第二次 episode，两次 cleanup 均被记录，状态进入 DISPOSED。

这个例子还揭示三条实战规则。

第一，**依赖 Service Definition，而不是 import Provider。** 如果 Consumer 直接 import `makeToolboxA`，运行时无法把它换成 B；只有稳定 key 与契约位于中间，Provider 和 Consumer 才能分别演化。在大型 Harness 中，Definition 通常应是单独小包，避免 consumer 为了拿类型而顺带依赖具体后端。

第二，**获取和 inverse 必须邻接。** 新增 timer 时马上写 `clearInterval`，注册工具时马上拿 disposer。这样 code review 可以局部检查资源是否成对；若 `apply` 后半段失败，前半段已经登记的 effect 仍能回收。把所有清理集中到一个远处的 `deactivate()`，更容易漏掉后来添加的分支。

第三，**不要手动调用正常生命周期里的 disposer。** 一项 effect 一旦归 Context 所有，业务代码再提前调用同一个 disposer，可能造成双重释放或让 recovery 栈与真实状态不同步。若资源确实需要提前结束，应把这次状态变化也建模成受管理的子生命周期，或使用明确支持幂等/取消的封装。

最后说明演示边界：这里显式 dispose Provider A，再挂载独立 Provider B，所以中间明确观察到 PENDING。Loader 的事务式 replacement 或不同 HMR 策略未必暴露相同中间状态，不能从这个输出推出“所有 Cordis 热替换 UI 都必然闪过 PENDING”。演示证明的是依赖撤出会清理 Consumer、provider identity 变化会开启新 episode，以及已登记资源没有残留；它不证明任意第三方 disposer 正确，也不构成性能 benchmark。

## v4、Koishi、Shigma、JS/TS、Rust 与包名

围绕 Cordis 的搜索结果里，版本、人物、语言和包名经常交叉。下面把能由一手材料确认的事实集中到一处。

| 问题 | 截至 2026-08-23 的答案 |
| --- | --- |
| Cordis 从什么时候开始？ | npm `cordis@0.1.0` 发布于 2022-04-21；当前 GitHub 仓库对象创建于 2022-05-17。项目早于 DeepSeek Harness 约四年 |
| v3 与 v4 是什么关系？ | Koishi 生产生态仍使用 v3；论文和 Harness vendor 以 v4 线为基础。论文称核心组合思想相续，但 v4 细化 effect/coeffect 并重做 Loader |
| Shigma 是谁？ | 可确认的是 npm `cordis` 的 author 字段署名 Shigma，论文联系邮箱使用 `cordis.io`；不能仅凭邮箱或提交史推断更具体的雇佣、收购或所有权关系 |
| Cordiverse 是什么？ | 当前上游 Cordis 与论文所在的 GitHub 组织。仓库位置不自动等于所有历史版权和个人关系的完整叙述 |
| `cordis` 与 `@deepseek-ai/cordis`？ | 前者是上游 npm 包；后者是 Harness vendor、rescope 并本地修改后的发布包。import 名称和版本序列不能混用 |
| Cordis 是 JavaScript 还是 TypeScript？ | 源码以 TypeScript 编写，发布为 ESM JavaScript 加类型声明；准确说法是“TypeScript 实现的现代 JavaScript 元框架” |
| Harness 是 Python 项目吗？ | monorepo 主体是 TypeScript。官方另有 Python SDK，通过 stdio 上的 newline-delimited JSON-RPC 驱动 bundled runtime；这不代表 Cordis core 被改写成 Python |
| 有官方 Cordis Rust 吗？ | 本研究未找到。论文讨论 Rust traits、宏、动态加载和 WebAssembly 的可移植设计，那是语言无关性分析，不是现成 `cordis-rust` 实现 |

Rust 的 ownership（所有权）与 RAII 仍是很好的对照。它们让组件内部的值和资源在静态、词法生命周期结束时可靠释放；Cordis 关注的是部署后才决定边界、跨任意时长、还要随 provider 拓扑响应的组件生命周期。一个 Rust 版 context paradigm 仍需服务注册表、动态依赖解析、组件 identity 与卸载协调。两者可以互补，不能因为都谈“清理”就互相替代。

版本日期同样要区分“事实类型”。Harness 公开 Git 历史可追溯到 2026-06 的根提交，但 GitHub 仓库对象在 8 月创建，可能是导入历史；npm 预发布包、GitHub Release、官方产品页和仓库公开也不是同一个事件。当前可稳妥表达的是：DeepSeek Harness 在 2026 年 8 月中旬开放开发者预览，8 月 13 日有可核验的产品页、仓库对象与论文草稿。搜索词里的 “Aug 14, 2026” 不足以单独证明某个时区中的“正式稳定发布日”。

## 和 DI、OSGi、React、FRP、事务、Saga、Rust RAII 有何不同

没有哪种架构因为 Cordis 出现就过时。判断差异最有效的方式，是比较它们处理的粒度、生命周期边界和依赖变化。

| 技术 | 主要粒度与边界 | 撤销方式 | 依赖变化反应 | 与 Cordis 的关系 |
| --- | --- | --- | --- | --- |
| 普通 module import | 编译/模块加载 | 进程退出或手动清理 | 不负责 provider 运行时消失 | Cordis 仍用 JS 模块承载代码，但另管挂载实例 |
| 启动时 DI / IoC | 对象与服务，通常在启动期绑定 | 容器 shutdown hook | 既有 consumer 通常不因 provider 换身份而自动重建 | Cordis 增加反应式组件生命周期与 effect ownership |
| OSGi Declarative Services / iPOJO | 动态 bundle 与 service | 手写 deactivate callback | 可随 service 出现、消失而激活停用 | 是 reactive coeffect 的近邻；Cordis 进一步统一 effect 追踪并形式化异步撤回 |
| React `useEffect` | UI 组件的一次 hook episode | setup 返回 cleanup | dependency array 变化时重跑 | 配对形状很相似；React 的目标是渲染树，不是开放的任意服务依赖图 |
| FRP / signals | 值与派生计算 | 通常不是核心目标 | 值变化驱动细粒度重算，常追求无 glitch | Cordis 在异步组件生命周期粒度反应；signal 可以成为某个 coeffect 内部实现 |
| `try/finally` / bracket | 一段词法控制流 | 退出块时清理 | 不解析长期服务依赖 | 是编写单个 effect 的基础工具，Cordis 把边界延长到动态 Fiber |
| 数据库事务 / STM | 预先界定的短事务 | abort、日志或版本回滚 | 不负责长期组件拓扑 | 可用于 Context 操作内部；Cordis 自身不提供数据库隔离级别 |
| Saga | 分布式业务流程 | 业务补偿 | 按流程编排步骤 | 适合处理 system boundary 外无法真正逆转的 effect |
| Rust ownership / RAII | 值与词法资源 | `Drop` 自动发生 | 不追踪动态 provider 图 | 是组件内部资源安全的互补机制 |
| Kubernetes | 进程、容器与服务 | 重建实例 | 服务级期望状态调和 | Cordis 是同进程组件粒度，不能替代故障和安全隔离 |
| Event sourcing | 业务事实日志 | 追加反向事件或重建投影 | 不管理插件依赖 | Harness session log 用它的思路持久化模型可见事实，和 Fiber recovery 是两条轴 |
| MCP | Agent 与外部工具/资源的协议 | 由具体客户端与服务决定 | 不管理 Harness 内部组件 | MCP provider/client 可以成为插件，但 Cordis 不替代 wire protocol |

与数据库事务相比，“可撤销 effect”最容易被说过头。事务常控制一块封闭数据，失败前不向外提交；Cordis effect 可以跨插件整个寿命，期间结果已经被其他组件观察。它依赖 inverse 与观察等价，不自动获得原子性、隔离性和持久性。Saga 更接近外部业务现实：退款不是让扣款从历史消失，而是追加一个补偿步骤。

与 React `useEffect` 相比，两者都鼓励 setup 与 cleanup 同地出现。但 React 的 dependency array 由渲染模型驱动，hook 有固定调用规则；Cordis 的 coeffect 来自跨独立包的 service topology，Fiber 还能提供 Service、拥有子插件并参与 Loader 调和。相似的 API 轮廓不等于相同的系统边界。

与 OSGi 相比，动态 service binding 并不新鲜。论文的主张不是“第一次让服务出现和消失”，而是把可撤销 effect、反应式 coeffect、统一 Context、异步生命周期与恢复/合流性质放进一套更一般的模型，再在 TypeScript 元框架中实现。这是继承与重新组织相邻思想，不应写成从真空中发明插件系统。

## 它不解决什么：理论假设、工程代价与采用边界

采用 Cordis 前，至少应回答以下问题。

### 1. 影响真的经过 Context 吗？

直接修改 ambient global state（环境全局状态）、发送网络数据或调用没有补偿协议的外部系统，都在自动恢复边界外。可以为它们写显式 `ctx.effect`，但 disposer 仍要由业务语义保证正确。需要审计、幂等 key、outbox、两阶段提交或 Saga 时，Cordis 不会代替这些协议。

### 2. 需要“重建”还是“迁移”？

Cordis 默认思路是撤掉旧 episode，再按新依赖从干净状态建立新 episode。**DSU（dynamic software updating，动态软件更新）**研究怎样把旧代码的内部状态迁移到新版本，那是另一类问题。若 Agent 有长寿命状态，应把它放进更稳定的 session/storage service，或显式设计版本迁移，不要把关键状态困在可热换插件的私有闭包里。

### 3. 依赖图会成环吗？

若 A 必须注入 B，B 又必须注入 A，两者可能永远 PENDING。论文的 Progress 与 Confluence 结果要求无环等前提，运行时最多能诊断 cycle，不会凭空决定谁先启动。解决方式通常是重新划分组件、抽出共同 Definition、改用事件协议，或让一个 integration component 拥有双向协调。

### 4. 权限边界在哪里？

`inject` 能表达一个良性插件被授予哪些 Context capability，isolation 能改变解析域，interception 能实施策略；但同进程 JavaScript 不是恶意代码沙箱。第三方不可信插件需要最小 OS 权限、子进程或容器隔离、网络政策、机密管理与供应链审计。Harness 提供 sandbox 插件不等于所有插件天然安全。

### 5. 接口身份和版本如何治理？

不同作者可能为无关能力占用同一个 key；相同 key 的 TypeScript 形状也可能随版本漂移。命名空间、Service Definition 包、peer dependency、semver 和契约测试仍不可少。TypeScript 类型会在编译后擦除，运行时不会自动证明两个独立 npm 包对同一 service 语义完全一致。

### 6. 团队真的需要运行时增删吗？

Context 中介、Fiber 元数据、Loader、事件优先级和生命周期诊断都有认知与运行成本。如果应用只在部署时组装、重启便宜、插件完全受同一团队控制，普通模块、启动时 DI 和 `try/finally` 往往更简单。Cordis 的优势在“细粒度、长寿命、频繁重组且重启昂贵”的系统中才会兑现。

### 7. 能接受预览期变化吗？

论文处于 active revision，Cordis v4 仍在 RC，DeepSeek Harness 官方明确警告 developer preview 可能有 breaking changes。生产采用应固定 commit 或精确版本，隔离上游与 `@deepseek-ai` vendor API，记录配置 schema，并为 provider 替换、失败回滚和清理残留建立回归测试。

### 一份可执行的采用流程

如果以上问题的答案仍指向动态组件，第一步不是把现有代码全部改成插件，而是选择一条真正需要运行时替换的纵向切片。比如只拿“研究工具 -> 工具注册表 -> LLM provider”做试点，保留现有会话和 UI。试点要同时覆盖装、撤、换、失败四条路径；只验证启动成功，会把最重要的风险留到生产。

第二步做 **effect inventory（效应清单）**。逐项列出组件会修改的内存表、listener、timer、文件句柄、子进程、网络请求、数据库记录与外部消息。为每项写明 owner、创建时点、inverse、是否幂等、是否跨 system boundary、清理失败后由谁重试。清单的目的不是文档完美，而是尽早暴露“我们根本不知道怎样撤销”的资源。

| Effect | Owner | 恢复策略 | 必测失败 |
| --- | --- | --- | --- |
| 工具注册 | Tool Fiber | registry disposer，按 registration identity 删除 | 同名工具、重复 dispose |
| 事件监听 | Tool Fiber | `ctx.on` 自动注销 | handler 抛错、卸载后不得再触发 |
| 缓存 timer | Tool Fiber | `clearInterval` + 从诊断集合删除 | apply 中途失败、快速重载 |
| LLM stream | LLM/Consumer 协议共同决定 | `AbortSignal` 或允许落地后丢弃旧 episode 结果 | provider 切换发生在流中间 |
| 外部消息 | 业务 Service | withholding、幂等 key 或补偿事件 | 已发送但本地提交失败 |

第三步设计 **capability matrix（能力矩阵）**。每一行是 Service Definition，每一列是 Provider、Consumer、隔离域、拦截政策和版本 owner。若一个所谓 Service 只有一个调用者、永远不会替换，也不需要跨包契约，就先保留普通模块；过早建立 seam 会增加包、配置和版本数量。若多个 Consumer 必须一起换后端，或者不同 realm 要看见同名实现，它才是高价值 seam。

第四步把依赖画成有向图并主动消环。边 `A -> B` 表示 A 的激活需要 B；不要拿 import graph 代替，因为 import 一个类型包不等于运行时依赖某个 Provider。对每条边再问：它真的必需吗？能否变成可选 observer？能否通过事件反转控制？若仍有环，抽出共同 Definition 或 integration component，而不是期待 Loader 猜一个顺序。

第五步定义生命周期 SLO（service level objective，服务级目标）。例如：禁用工具后 500 ms 内从 registry 消失；普通请求 5 s 内排空，超时后 cooperative abort；provider 切换期间新工具调用拒绝而不落到旧后端；失败回滚后关键 profile 在 10 s 内恢复 ready。没有时间和状态目标，UNLOADING 可以无限延长，运维只能看到一个模糊的“卡住”。

第六步建立故障注入测试，而不只写 happy path。至少覆盖：每个初始化步骤抛错；每个 disposer 抛错或超时；依赖在 LOADING 中改变；provider 快速 A-B-A 抖动；父子 Fiber 同时请求 dispose；新 HMR 模块校验失败；optional provider 缺失；进程在补偿中断电。每次测试都断言 Registry、工具数、listener 数、timer 数、子进程和端口，不要只断言状态枚举。

第七步把可观察性与配置 revision 连起来。日志应含 Fiber uid、component 名称、episode、target/committed providers、effect 标签、entry ID 与 profile revision；指标可统计 PENDING 时长、加载失败率、卸载时长、强制终止和 HMR 回滚。遇到“provider 为什么删不掉”，运维应能直接看到哪个 committed Consumer 仍未退出，而不是在 heap dump 中猜闭包。

最后分阶段扩大边界：先让插件可完整撤出，再允许 provider 替换，再启用声明式配置调和，最后才考虑自动 HMR 或 Agent 自修改。每一层都依赖前一层的 recovery 合同。把“everything is a plugin”当作第一天的组织口号，很容易得到大量浅包和隐性全局状态；把它当作逐步扩大的可恢复边界，才接近 Cordis 论文真正强调的纪律。

## 搜索问题速答

### Cordis 是什么？

Cordis 是 TypeScript 实现、发布给现代 JavaScript 的插件元框架。它用 Context 管服务、事件、effect 所有权、依赖变化与插件生命周期，而不是一个 AI 模型或特定 Agent 产品。[上游仓库](https://github.com/cordiverse/cordis)

### Cordis 是 DeepSeek 开发的吗？

不是从 2026 年才开始。`cordis` 在 2022 年已经发布，npm author 为 Shigma，当前上游位于 Cordiverse。DeepSeek Harness 后来采用、vendor、重映射并修改了它。

### Cordis 与 DeepSeek Harness 是什么关系？

Cordis 是通用组合运行时；DeepSeek Harness 是 Agent 领域框架/产品。Harness 用 Cordis 把模型、工具、会话、Agent Loop、沙箱和 UI 装配成插件树。[Harness 架构](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/architecture.md)

### `cordis` 与 `@deepseek-ai/cordis` 有什么区别？

`cordis` 是上游 npm 包；`@deepseek-ai/cordis` 是 Harness 复制源码、改名并加入本地 hardening 后的包。版本号与行为不能假定完全相同，写插件时不要混用 import。

### Cordis 是 plugin system、kernel、framework 还是 meta-framework？

它是以 Context 插件系统和生命周期核心为基础的 meta-framework。Kernel 是解释最小协调层的非正式说法；上层 Koishi 与 DeepSeek Harness 才加入聊天或 Agent 领域语义。

### Cordis v4 和 Koishi 的 Cordis 有什么关系？

Koishi 生产案例主要基于 v3；论文形式化和 Harness vendor 位于 v4 线。核心组合思想相续，但不能把 v4 的所有实现与定理条件说成已经被 Koishi 全生态验证。

### Cordis 用 JavaScript、TypeScript 还是 Rust？

官方实现是 TypeScript，发布为 ESM JavaScript与类型声明。目前没有找到官方 Rust 版；论文讨论语言无关的移植条件，不等于已有 `cordis-rust`。

### “Everything is a Plugin” 是否意味着插件权限相同？

不。它表示产品职责通过可替换插件装配。Context 能表达能力与策略，但恶意插件隔离仍要依赖进程、容器、OS sandbox 和最小权限。

### 论文原文与 GitHub 在哪里？

预印本在 [`cordiverse/paper`](https://github.com/cordiverse/paper)，Cordis 在 [`cordiverse/cordis`](https://github.com/cordiverse/cordis)，Harness 在 [`deepseek-ai/deepseek-harness`](https://github.com/deepseek-ai/deepseek-harness)。论文尚无已核验的 DOI 或 arXiv 记录。

### 只想给 Harness 加一个工具，从哪里开始？

先读固定版本的[第三方插件教程](https://github.com/deepseek-ai/deepseek-harness/tree/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/user/develop)，依赖官方 Service Definition，用 `inject` 等待 registry，把注册交给 owning Context，并在目标 profile 中安装和 patch。不要先修改 Agent Loop。

## 核心术语速查

这张表不是另一套定义，而是把全文首次出现的术语压回一页，便于读源码和论文时对照。

| 术语 | 在本文中的精确定义 |
| --- | --- |
| Composition | 用较小部件构造较大系统；动态组合允许关系在进程运行期间改变 |
| Component | 声明依赖、提供能力和激活行为的组件定义，不等于某次运行实例 |
| Plugin | Component 的代码与装配形态，可以是函数、对象或 Service class |
| Context | 中介服务读取、effect 登记、作用域派生和生命周期归属的一等运行时环境 |
| Context type | 规定 Context 可执行操作及规律的抽象结构，不只是一份 TypeScript interface |
| Effect | 组件对共享环境造成的改变，例如注册、订阅、连接和提供服务 |
| Revertible effect | 执行时同时产生针对这次状态的 inverse，并由 owner 生命周期追踪的 effect |
| Inverse / disposer | 撤销一次已发生改变的操作；Cordis 调用它，但不自动证明其正确 |
| Witness | 创建 inverse 所需的本次执行信息，例如旧值、句柄或 registration identity |
| Coeffect | 组件要求环境提供的条件或能力，与“程序向外改变”的 effect 方向相对 |
| Reactive coeffect | Context 变化时持续重算的依赖约束，可触发组件激活、停用与重建 |
| Service Definition | 固定 service key、类型、行为和版本合同的中立定义层 |
| Provider | 在某个 Context realm 中实现并提供 Service 的组件 |
| Consumer | 只依赖 Service Definition、使用运行时解析实现的组件 |
| Provision | Provider 对 Context 作出的“我提供某项能力”的登记，本身也是 effect |
| Inject | 组件声明的必需 coeffect specification，不是启动时的一次空值检查 |
| Fiber | 一次插件挂载的运行时身份、状态机、依赖承诺和 recovery owner |
| Episode | Fiber 在一组 committed providers 下从激活到停用的一次运行片段 |
| Registry | 保存 Fiber、父子关系、provisions 与依赖解析的运行时事实来源 |
| Target view | 根据当前 Registry 重新计算的期望 provider 解析结果 |
| Committed view | 当前 episode 已承诺使用的 provider identity，转换期间保持一致 |
| Recovery accumulator | 逐步收集已完成 effects 的 inverses，并在失败或卸载时展开的恢复栈 |
| Observational equivalence | 外界通过公开 coeffect 操作无法区分的状态等价，而非逐 bit 相同 |
| Independence | 两个 effect 的 forward、inverse、inverse 选择和结果在观察语义上互不干扰 |
| Isolation | 让同名 service key 在不同子 Context 解析到不同 realm/provider |
| Interception | 不改变 key 是否存在，而包装能力访问以实施权限、审计或策略 |
| Loader | 把声明式配置的期望 entry tree 调和为实际 Fiber tree 的运行时组件 |
| Reconciliation | 比较期望与实际状态，只挂载、撤出或更新差异节点的过程 |
| HMR | 在不重启整个进程时替换模块；正确实现必须复用完整 Fiber 卸载与失败恢复 |
| Meta-framework | 不规定业务领域，而提供构造领域框架所需组合语义的底层框架 |
| Agent Harness | 模型之外负责工具、会话、权限、执行循环、恢复、沙箱和 UI 的运行支架 |
| Profile | DeepSeek Harness 中用户选择的具名产品组装，叠加 bundles 与 patches |
| Bundle | 一组可分发的 Cordis entries、配置与相关插件代码 |
| Patch / overlay | 按稳定 entry ID 修改或插入配置的覆盖层 |
| Capability seam | 由 Definition、Provider、Consumer 组成、允许实现独立替换的能力边界 |
| Durable event | 进入追加日志、可用于恢复与重放的业务事实 |
| Live extension point | 只服务当前运行控制和拦截、未必持久化的事件扩展点 |
| Quiescent state | 没有待推进生命周期转换的静止态，不自动等于业务健康 |
| Confluence | 在严格前提下，不同合法调度最终汇合到观察等价 normal form 的性质 |

## 结语：组合的终点不是能装，而是能撤、能换、能继续

回到开场的研究工具插件。一个成熟插件系统的标准，不是运行时能多塞进一个功能，而是能准确回答：它改变了什么，依赖谁，provider 变化时谁先退出，离开后哪些影响必须消失。Cordis 的贡献是把答案压进 Context、revertible effect、reactive coeffect 与 Fiber 生命周期合同，再让 Loader 把整棵动态配置树持续调和。

当系统需要频繁运行时重组、局部替换价值高、整进程重启代价大时，这套范式值得认真研究。若系统静态、边界清楚、重启便宜，先用模块、DI 和 `try/finally`。可组合性的成熟，不体现在“什么都能插”，而体现在组件能撤、能换，系统还能一致地继续运行。

## 主要参考资料与快照

如果准备继续读原论文，不必从第一页硬啃到最后。先读摘要、引言与第 2 节，确认 effect/coeffect 两条轴；再带着本文的插件例子读 revertible context 与 reactive context。遇到公式时先问三个问题：当前状态里有哪些可观察位置，本步产生了什么 witness/inverse，组件的依赖 target 是否改变。理解这三项后，再进入 component calculus 的 Registry、Fiber 与 transition rules。

定理部分应把“结论”和“前提”一起做笔记。看到 recovery 就标出 independence，看到 progress 就标出无环、有限和有界，看到 confluence 就额外标出 total provision、无失败与观察等价。最后再读 Cordis/Koishi 案例和限制章节，区分形式模型、TypeScript 实现与生态证据。这样不会把一个条件化证明误读成无条件产品承诺。

源码阅读则从 `fiber.ts` 的 effect ownership 和状态迁移开始，再看 `reflect.ts` 的 provider 撤回、`events.ts` 的 listener effect，最后进入 Loader/HMR。先固定 commit 再对照 npm 包，因为上游 RC 与 Harness vendor 修改仍在快速演进。本文所有源码链接都钉在同一研究快照，目的正是让日后 API 变化时仍能重建当时的判断。

- [论文 README，commit `13f28585`](https://github.com/cordiverse/paper/blob/13f28585668a28106b2f53bedada36e45bc1ed3e/README.md)：预印本状态与引用边界。
- [论文 PDF，2026-08-13 固定快照](https://github.com/cordiverse/paper/blob/13f28585668a28106b2f53bedada36e45bc1ed3e/paper.pdf)：effect/coeffect、组件演算、定理、Koishi 案例与限制。
- [Cordis 上游仓库](https://github.com/cordiverse/cordis)与[核心 Fiber 源码，commit `8cc9e33f`](https://github.com/cordiverse/cordis/blob/8cc9e33fab69e2d0476d126baaf2acb24e6a6ab4/packages/core/src/fiber.ts)：实现和生命周期核验。
- [DeepSeek Harness 架构，commit `b150a551`](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/architecture.md)：插件化 Agent、会话日志与扩展点。
- [Harness vendor 清单](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/vendor/README.md)：Cordis 来源快照、包名重映射与本地修改。
- [Harness Cordis 教程](https://github.com/deepseek-ai/deepseek-harness/tree/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/cordis-tutorial)与[插件开发文档](https://github.com/deepseek-ai/deepseek-harness/tree/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/user/develop)：API 与工程实践。

本文没有运行 DeepSeek Harness 的性能 benchmark，也没有审计第三方插件。版本、包名与 developer-preview 状态只对 2026-08-23 的上述快照负责；理论结论只在论文明确列出的独立性、无环、有限性、total provision 与无失败等前提下解释。
