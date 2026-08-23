---
title: 'Cordis Explained: Spatiotemporal Composability, Plugin Systems, and DeepSeek Harness'
pubDate: 2026-08-23T00:00:00.000Z
description: 'A practical, evidence-based guide to Cordis, spatiotemporal composability, revertible effects, reactive coeffects, plugin lifecycles, and the architecture of DeepSeek Harness.'
author: 'Remy'
tags: ['cordis', 'deepseek-harness', 'plugin-system', 'spatiotemporal-composability', 'agent-harness']
lang: 'en'
translatedFrom: 'cordis-spatiotemporal-composability-deepseek-harness'
---

## 0. Installing a Plugin Is Easy. Removing It Cleanly Is the Hard Part

Imagine an AI agent that has been running for hours. Here, an **agent** is a program in which a model can make decisions and use tools, while an **agent harness** is the surrounding execution system that supplies prompts, tools, sessions, permissions, storage, and the model-tool loop. A new weather plugin is installed without restarting the process. It registers a tool schema, subscribes to events, starts a timer, and keeps a reference to the current large language model (LLM) provider.

Ten minutes later, the plugin turns out to be faulty. At the same time, the operator wants to replace the LLM provider. Deleting the plugin's name from a registry is not enough. Its timer may still fire, its event listener may still hold a closure, its tool may still appear to the model, and it may still call the retired provider. Yet shutting down the provider first is also unsafe: the plugin may need that provider while cleaning up work already in progress.

This is the problem Cordis is designed to make tractable. A **plugin** is a software unit that a host can mount to contribute behavior. A **provider** contributes a named capability; a **consumer** depends on that capability. Cordis is implemented in **TypeScript**, a typed language compiled to JavaScript. It calls itself a **meta-framework** because, instead of defining agent-specific features, it gives higher-level frameworks a runtime for mounting components, tracking what they change, resolving what they depend on, and coordinating their departure.

Its central idea has two dimensions:

- **Temporal composability** asks whether a component's in-process contribution can be withdrawn at the correct point in time without erasing independent contributions from other components.
- **Spatial composability** asks whether components can remain consistent as the live dependency graph changes: providers appear, disappear, or are replaced.

The 2026 preprint *A Programming Paradigm for Spatiotemporal Composability* models those dimensions as **revertible effects** and **reactive coeffects**. DeepSeek Harness then uses Cordis to make models, tools, sessions, sandboxes, storage, loops, and interfaces part of a configurable plugin tree. That relationship is real, but the guarantees are conditional: Cordis cannot retract a network packet, prove that a cleanup function is correct, or turn untrusted Node.js code into safely sandboxed code. Those boundaries are as important as the mechanism itself. ([paper, pp. 4-6 and 67-70](https://github.com/cordiverse/paper/blob/13f28585668a28106b2f53bedada36e45bc1ed3e/paper.pdf); [DeepSeek Harness architecture](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/architecture.md))

## 1. Cordis, the Paper, and DeepSeek Harness Are Related but Not Identical

Several names are easy to collapse into one story, so it is worth separating them before touching the theory.

**Cordis** is the upstream project in the `cordiverse/cordis` repository. Its core is written in TypeScript and distributed as JavaScript with TypeScript declarations. Its **npm package**, a versioned library published through the Node.js package registry, was already available in 2022, years before DeepSeek Harness appeared. The package metadata names Shigma as the author, and Shigma is prominently associated with the public project history. Those facts do not by themselves establish a more specific employment, acquisition, or ownership relationship with DeepSeek. ([Cordis repository](https://github.com/cordiverse/cordis); [Cordis v4 package metadata at the research snapshot](https://github.com/cordiverse/cordis/blob/8cc9e33fab69e2d0476d126baaf2acb24e6a6ab4/packages/core/package.json))

**Cordis v4** is the version line formalized by the paper and used as the basis for the copy inside DeepSeek Harness. At the August 23, 2026 research snapshot, upstream npm marked `4.0.0-rc.8` as latest. The `rc` means release candidate: the design was approaching a stable release, but its public API was still changing.

**DeepSeek Harness**, also called `dsh`, is an agent harness created by DeepSeek-AI. It is not a model and it is not another name for Cordis. Its official README says both "Everything is a Plugin" and "Powered by Cordis," while also warning that the project is a developer preview with breaking changes expected. ([Harness README at `b150a551`](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/README.md))

DeepSeek did more than add an npm dependency. The Harness repository **vendors** Cordis: it copies a known source revision into its **monorepo**, a single repository containing many related packages, so the team can audit, patch, and release it together with the product. It also **rescopes** package names, meaning it publishes them under another npm namespace. Upstream `cordis` becomes `@deepseek-ai/cordis`; related `@cordisjs/...` packages become `@deepseek-ai/...` packages. The vendor manifest records local lifecycle hardening, transactional Loader reconciliation, Hot Module Replacement (HMR) work, and other patches. Therefore upstream `cordis@4.0.0-rc.8`, the vendor manifest's `4.0.0-rc.7` source snapshot, and `@deepseek-ai/cordis@4.0.1` are three different version coordinates, not contradictory labels for one release. ([vendor manifest](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/vendor/README.md); [vendored package metadata](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/vendor/cordis/package.json))

The paper is a fourth object. *A Programming Paradigm for Spatiotemporal Composability* is an 88-page draft dated August 13, 2026, by Yifan Shi, Wei Zhang, and Tianyi Cui. The affiliations listed are Peking University and DeepSeek-AI. The repository explicitly calls it a "preprint under active revision." At the research cutoff there was no verifiable **Digital Object Identifier (DOI)**, no identifier in the **arXiv** public preprint index, no publication venue, no peer-review record, and no machine-checked proof artifact. It is accurate to say that the manuscript presents mathematical proofs under stated assumptions. It is not accurate to call those proofs peer reviewed or machine verified. ([paper README at `13f28585`](https://github.com/cordiverse/paper/blob/13f28585668a28106b2f53bedada36e45bc1ed3e/README.md); [fixed PDF](https://github.com/cordiverse/paper/blob/13f28585668a28106b2f53bedada36e45bc1ed3e/paper.pdf))

Finally, **Koishi** is a chatbot application framework built on Cordis. The paper reports more than 4,000 community plugins across that ecosystem, but it also states that Koishi currently uses Cordis v3 while the manuscript presents v4. Koishi is valuable evidence that the core model can support a large open ecosystem. It is not a controlled benchmark of v4, nor proof of every theorem in a production deployment. ([paper, pp. 66-67](https://github.com/cordiverse/paper/blob/13f28585668a28106b2f53bedada36e45bc1ed3e/paper.pdf))

The most defensible relationship map is therefore:

```text
Cordis v3 --------------------> Koishi production ecosystem
     |
     +-- evolves into v4 ----> 2026 preprint formalizes the model
                                |
                                +--> DeepSeek Harness vendors and patches v4
                                     as @deepseek-ai/cordis
```

## 2. Why Dynamic Composition Is Harder Than Importing a Module

**Composition** means building a larger system from smaller units. **Composability** is stronger: the units retain useful properties when combined. Function calls, module imports, and constructor injection usually happen across boundaries known at compile time or startup. Their relationships are mostly static.

**Dynamic composition** allows a component to arrive, leave, change configuration, or change identity while the process continues. A **component** is the paper's abstract unit: it declares what it needs, what it may provide, and what effects it performs when activated. In engineering discussions, a Cordis plugin usually plays that role. The words overlap, but "component" belongs to the model and "plugin" to the implementation vocabulary.

Static composition gets help from fixed scopes. A `try/finally` block has an obvious end. Resource Acquisition Is Initialization (RAII), used prominently in C++ and Rust, ties resource release to a lexical object's lifetime. A module import graph fixes many spatial relationships before execution. Dynamic plugins lose those conveniences: a plugin can outlive the request that created it, span many asynchronous calls, and encounter a different provider hours later.

That creates two independent failure axes:

| Axis | Question | Typical failure |
| --- | --- | --- |
| Time | When the plugin leaves, what remains? | Duplicate listeners, live timers, stale registry entries, leaked handles |
| Space | Who does the plugin depend on now? | A consumer calls a retired provider or starts before a required service exists |

A system can solve one axis and still fail on the other. A meticulous `deactivate()` callback can clear every timer while the plugin continues using a stale LLM reference. A dependency injection container can provide the correct LLM at startup while knowing nothing about the plugin's listener when the provider is replaced. This is why the paper calls temporal and spatial composability **orthogonal**: neither logically supplies the other. ([paper, pp. 4-8](https://github.com/cordiverse/paper/blob/13f28585668a28106b2f53bedada36e45bc1ed3e/paper.pdf))

Restarting the process is a coarse answer. Operating systems reclaim process resources; containers and orchestrators can rebuild service dependencies. But a restart may discard caches, connections, an in-progress tool call, or volatile session state. Cordis aims at a smaller unit: components inside one long-running JavaScript process. This does not make it a process supervisor or a container security boundary. It addresses a different granularity.

The word **spatiotemporal** is therefore not a physics metaphor. "Temporal" means lifecycle and withdrawal. "Spatial" means position in a live dependency topology. A dynamically composable system needs both: it must know what each component changed and how that component is connected to the rest of the running system.

## 3. Temporal Composability: Revertible Effects Make Departure Explicit

A **side effect** is an observable change beyond a function's return value: registering a listener, opening a connection, modifying a shared registry, or starting a timer. In programming-language theory, an **effect** is an abstraction for how a computation changes its environment. An **effect system** describes or constrains those changes. Cordis turns that abstract idea into a runtime ownership rule.

A **revertible effect** performs a change and produces the operation needed to withdraw that change. In the Cordis API, the concrete cleanup function is called a **disposer**:

```ts
ctx.effect(() => {
  const timer = setInterval(refreshWeather, 30_000)
  return () => clearInterval(timer)
})
```

Cordis does not inspect `setInterval` and invent the cleanup. The plugin author supplies the disposer next to acquisition; Cordis assigns it to the current component instance, collects it, and calls it during teardown. The current core source explicitly gathers disposers and reverses their order during recovery. ([`Fiber.effect()` at the fixed Cordis snapshot](https://github.com/cordiverse/cordis/blob/8cc9e33fab69e2d0476d126baaf2acb24e6a6ab4/packages/core/src/fiber.ts#L275-L337))

Why reverse the order? Suppose activation opens a connection and then starts a timer that uses that connection:

```text
forward:  open connection -> start timer
recover:  stop timer      -> close connection
```

The last acquired dependent resource must be the first released. This is **Last In, First Out (LIFO)** order. The paper calls the algebra behind it **twisted composition**: forward transformations compose in execution order, while their inverses compose in reverse order. You do not need category theory to use it; the operational rule is the same one that makes stack unwinding and nested `finally` blocks sensible.

The paper only requires a **left inverse**. If `f` is the forward transformation and `g` is its inverse, then `g(f(c)) = c` for the actual starting context `c`. It does not require `f(g(c)) = c` for arbitrary states. Registering and then unregistering a listener can restore the original observable behavior even though "unregister, then register" is not meaningful on every possible state.

Many inverses also depend on the state at the moment an effect runs. Replacing a configuration value requires remembering the old value. Acquiring a file descriptor requires returning the particular descriptor that was opened. A **witnessed effect function** therefore returns both the new state and an inverse chosen for this execution:

```text
effect(c) -> (newContext, inverseChosenAtC)
```

"Witnessed" means the operation provides evidence of how to reverse this instance. The runtime can guarantee that the disposer is stored, composed, and invoked. It cannot prove that the disposer is honest or correct. If `refreshWeather` also pushes into an ambient global array and the disposer ignores it, that mutation escapes recovery.

One component's internal LIFO stack is not enough when components interleave. Suppose plugin A and plugin B both modify a shared ordered middleware chain. A installs, B installs, and then A leaves. Removing A without disturbing B is safe only if their operations are suitably **independent**. The paper's condition is stronger than "the two forward functions commute":

1. Each side's forward and inverse transformations must commute with the other's.
2. An outside effect must not change which inverse the other effect chooses at a state.
3. For an operation with a return value, the outside effect must not change that outcome.

If operations are independent, A's contribution can be removed from an interleaved history while preserving B's. If order changes meaning, the components must expose that order as an explicit dependency or use a stronger domain protocol. Cordis does not infer commutativity from JavaScript code. ([paper, pp. 9-17 and 24-27](https://github.com/cordiverse/paper/blob/13f28585668a28106b2f53bedada36e45bc1ed3e/paper.pdf))

There is also a hard system boundary. Acquisitions such as `open/close`, `malloc/free`, or `spawn/terminate` can often be represented as in-process inverse pairs. **Emissions** cross the boundary: a sent email, a network packet already read by another system, or a completed charge cannot be made historically nonexistent. Such work needs **withholding** (delay publication until commitment) or **compensation** (perform a business action such as a refund). Compensation restores an agreed business condition; it is not automatically the mathematical inverse used by the paper's recovery theorem. ([paper, pp. 67-68](https://github.com/cordiverse/paper/blob/13f28585668a28106b2f53bedada36e45bc1ed3e/paper.pdf))

## 4. Spatial Composability: Reactive Coeffects Rewire Dependencies

An **effect** says what the program does to its environment. A **coeffect** says what the program requires from its environment. In classical language research, a coeffect system can describe contextual requirements at compile time. The paper's **reactive coeffect** is a runtime version at component granularity: whenever the shared context changes, the runtime re-evaluates whether a component's declared requirements are satisfied.

In Cordis, a provider contributes a service under a stable key, while a consumer declares required keys through `inject`:

```ts
export const inject = ['llm', 'tools']

export function apply(ctx: Context) {
  // Safe to use ctx.llm and ctx.tools during this activation episode.
}
```

This resembles **dependency injection (DI)**, the practice of declaring a needed capability instead of constructing or importing one concrete implementation. Cordis adds a live lifecycle. Missing `llm` does not necessarily mean a crash: the consumer's runtime instance may remain `PENDING`. When the provider appears, the requirement becomes satisfied and activation begins. When the provider leaves, the requirement becomes unsatisfied and the consumer must deactivate. ([Cordis service tutorial in the Harness snapshot](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/cordis-tutorial/03-services.md))

The paper classifies a context change relative to a component's **coeffect specification**, meaning its declared set of requirements:

- **Activating:** unsatisfied before, satisfied now.
- **Deactivating:** satisfied before, unsatisfied now.
- **Neutral:** satisfaction did not change.

"Reactive" does not mean that every numeric value behaves like a frontend signal. It means a change in service availability or provider identity can drive an asynchronous component lifecycle.

Identity matters. Two providers may expose values that compare equal and still represent different lifetimes. Cordis uses the provider fiber's unique identifier in the dependency target. The paper calls the desired current resolution the **target view** and the provider identities used for one activation episode the **committed view**. An **episode** is the interval from a component's activation through recovery. The committed view prevents a consumer from silently switching from provider A to provider B halfway through an episode. ([Cordis target and lifecycle source](https://github.com/cordiverse/cordis/blob/8cc9e33fab69e2d0476d126baaf2acb24e6a6ab4/packages/core/src/fiber.ts#L385-L456); [paper, pp. 30 and 34-38](https://github.com/cordiverse/paper/blob/13f28585668a28106b2f53bedada36e45bc1ed3e/paper.pdf))

Safe withdrawal follows a specific order:

```text
provider starts leaving
  -> provider stops accepting new dependency resolutions
  -> existing consumers deactivate using their committed view
  -> consumers finish cleanup
  -> provider runs its own recovery and removes the binding
  -> a replacement provider may activate consumers with a new view
```

This is **guarded withdrawal**: a provider cannot remove the binding while a committed consumer still needs it for teardown. Consider a database pool. A consumer may need to return a checked-out connection while closing. If the pool disappears first, the consumer cannot clean up correctly.

Cordis also offers two context-sensitive mechanisms. **Isolation** changes where a service key resolves. Two agent subtrees can both request `shell` while one receives a local provider and the other a remote sandbox provider. An isolation **realm** is the local resolution domain for those keys. **Interception** changes how a resolved service is used, often by layering metadata or policy such as read-only paths, audit context, or tenant identity. It does not necessarily change whether the dependency is satisfied. Neither mechanism is a security sandbox: untrusted Node.js code can bypass a JavaScript proxy and call ambient host APIs directly. ([paper, pp. 20-22 and 69-70](https://github.com/cordiverse/paper/blob/13f28585668a28106b2f53bedada36e45bc1ed3e/paper.pdf); [Harness service documentation](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/user/develop/framework/service.md))

## 5. Why Effects and Coeffects Form One Programming Paradigm

The two axes become one mechanism because providing a service is itself an effect. Installing a binding changes the coeffect context; its inverse removes the binding. Removing it changes which component specifications are satisfied, which in turn drives deactivation. In a compact phrase: coeffect operations are effects, and those effects are revertible.

That feedback loop gives `Context` a more precise meaning than "a bag of global services." In Cordis, a **context** is a first-class runtime mediator. It acts as a service namespace, a dependency view, an effect owner, and a parent from which isolated or intercepted child contexts can be derived. A **context type** in the paper is not merely a TypeScript `interface`; it is an abstract structure whose operations obey rules about observation, composition, and recovery.

The discipline matters more than the object name. For the paper's reasoning to apply:

1. Shared locations are represented as typed coeffect keys.
2. Components access those locations through context operations.
3. Mutating operations produce a correct inverse at the point of use.
4. Components declare the keys they require and may provide.
5. The runtime owns transitions as the context changes.

A plain service locator named `Context` would not meet that contract. Nor does Cordis gain visibility into a module-level singleton, a direct filesystem write, or a host API called outside the mediated boundary.

### Recovery Means Observational Equivalence, Not Bit-for-Bit Time Travel

Exact physical restoration is usually impossible and unnecessary. A released allocation need not reappear at the same address; a newly created internal ID need not repeat the old ID. The paper instead uses **observational equivalence**: two states are equivalent when no operation exposed through the relevant coeffect can distinguish them.

Consider a routing service whose public behavior treats routes as an unordered set. Two internal insertion orders can be observationally equivalent if all supported queries return the same routes. An ordered middleware pipeline is different: changing insertion order may change which policy runs first, so clients can observe the difference. The service interface, not Cordis, determines which observations count and whether operations commute.

This connects the spatial and temporal stories. Different service keys can often be treated as independent locations. Operations on the same key are independent only if that service's observable contract permits reordering. If the order matters, the architecture must encode it instead of assuming it away. ([paper, pp. 22-27](https://github.com/cordiverse/paper/blob/13f28585668a28106b2f53bedada36e45bc1ed3e/paper.pdf))

### What the Manuscript Actually Proves

The paper gives an **operational semantics**, a set of state-transition rules describing how components and their runtime instances evolve. Its **metatheory** studies properties of that formal system. Those words do not mean that arbitrary JavaScript plugins have been mechanically verified. The repository contained only the README and PDF at the research snapshot, not a Coq, Lean, or Isabelle proof artifact.

The useful results can be translated into five engineering questions:

| Formal result | Engineering meaning | Conditions that must stay attached |
| --- | --- | --- |
| **Preservation** | Every legal transition preserves a well-formed registry: parent links, provisions, and committed providers do not dangle. | The system starts well formed and follows the specified transition rules and withdrawal guard. |
| **Recovery exactness / temporal composability** | When one fiber episode ends, its contribution disappears while independent interleaved contributions remain. | Atomic inverses are correct and effect iterators from different fibers are pairwise independent. |
| **Ordering and resolution coherence** | Dependencies are available before activation; consumers leave before providers; one episode uses one committed resolution. | Dependencies are declared and provider withdrawal is guarded. Already-issued async work still has inertia. |
| **Progress** | Lifecycle rules can reach a stable state rather than deadlocking on their own guards. | The provider precedence graph is acyclic, iterators are bounded, the fiber set is finite, and an external controller does not perturb it forever. |
| **Confluence** | Different legal scheduling orders reach the same observable normal result. | No failed fibers; independent effects; an acyclic, finite dependency structure; and components actually provide everything they declare. External emissions are excluded. |

A **quiescent state** is a stable point with no pending lifecycle transition. A **normal form** is a result that the rules cannot reduce further. **Confluence** means different permitted paths converge on an equivalent normal form. It does not mean "all concurrency and all failures always produce the same outcome." The confluence theorem explicitly excludes failure, while email, payment, and network emissions are outside ordinary recovery. ([paper, pp. 42-53](https://github.com/cordiverse/paper/blob/13f28585668a28106b2f53bedada36e45bc1ed3e/paper.pdf))

These conditional results explain why the design can work. Effects have owners and inverses; coeffects make dependency satisfaction visible; service provision bridges the two; guarded transitions preserve a fixed dependency view; and the Loader reconstructs only the affected part of the component graph. Remove any of those disciplines and the proof story no longer follows automatically.

## 6. Inside the Cordis "Kernel": Context, Service, Registry, and Fiber

People search for a "Cordis kernel," but the current source does not present one central class officially named `Kernel`. It is better to use **kernel** as an explanatory label for the small group of runtime mechanisms that make composition possible. A **runtime** is the executing machinery, whereas a **framework** also includes conventions and APIs used to build an application.

The core vocabulary maps as follows:

| Object | What it is | What it is not |
| --- | --- | --- |
| `Context` | An environment mediated by JavaScript `Proxy`, a runtime object that can intercept property access; plugins use it for services, effects, events, and derived scopes | A lifecycle-free global map |
| Plugin | A mountable function, object, or `Service` subclass with dependency and configuration metadata | Necessarily a separate npm package |
| `Service` | A named capability made available under a stable context key | Merely a TypeScript interface or a durable process |
| Registry | The runtime source of truth for mounted definitions, instances, relationships, and state | A catalog containing only plugin names |
| Fiber | One concrete runtime instance of a mounted plugin, with identity, context, dependencies, state, and owned effects | An operating-system thread or React Fiber |
| Event service | Typed communication with several dispatch modes | The durable session event log used by Harness |
| Logger service | Structured diagnostics whose output is supplied by logging plugins | Part of the formal effect/coeffect calculus |

A plugin definition can be mounted more than once. Each mount creates a separate **fiber**, so "the weather plugin" and "this particular activation of the weather plugin" are different things. The fiber owns a child context, its committed dependencies, its recovery accumulator, and any child plugins. This identity is what lets provider replacement count as a change even when a new provider returns equal values.

The broad mounting sequence is:

```text
parent context mounts plugin
  -> registry creates fiber and child context
  -> runtime resolves declared dependencies and computes target
  -> once satisfied, apply(ctx) runs
  -> ctx.effect(), event listeners, services, and child plugins belong to fiber
  -> fiber becomes ACTIVE
  -> dispose request or dependency change starts coordinated recovery
```

A **recovery accumulator** is the fiber's composed record of inverses. It is not necessarily a literal JavaScript array in every version; it is the conceptual result of collecting cleanup ownership. A child plugin is also an owned effect: disposing the parent recursively retires its child subtree. This is deeper than calling a top-level `deactivate()` and hoping every registration made below it was remembered.

Cordis supports function plugins, objects with an `apply(ctx)` method, and service classes. The **plugin** is the installation and lifecycle unit. A **service** is a directly consumable capability. An **event** is a communication contract that can have several observers or middleware layers. Treating those as synonyms obscures why the runtime has separate mechanisms for dependency resolution, ownership, and communication. ([Cordis primer](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/cordis-primer.md); [basic plugin guide](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/user/develop/basic/index.md))

## 7. The Full Plugin Lifecycle, from PENDING to DISPOSED

The Harness Cordis tutorial exposes this practical state story:

```text
PENDING -> LOADING -> ACTIVE -> UNLOADING -> DISPOSED
                 \-> FAILED
```

The states are diagnostic runtime labels, not a one-to-one transcription of the paper's formal states.

- **`PENDING`** means the plugin is declared but required services are not ready. It is a valid waiting condition, not automatically an error.
- **`LOADING`** means configuration has passed the applicable checks and `apply` is running while effects are collected.
- **`ACTIVE`** means activation completed and the fiber may contribute services or registrations.
- **`FAILED`** means configuration or activation failed. Effects already accumulated for the episode are recovered, and a failed fiber should not continue providing coeffects.
- **`UNLOADING`** means dependents, children, and disposers are being coordinated.
- **`DISPOSED`** means recovery has completed for that fiber.

Return to the weather tool. Initially, neither `llm` nor `tools` exists, so its fiber stays `PENDING`. The tool registry provider arrives, but the full requirement is still unsatisfied. The LLM provider then arrives; the target becomes viable, the fiber enters `LOADING`, registers its timer, listener, and tool, and becomes `ACTIVE`.

Now replace LLM-A with LLM-B. The target view changes because provider identity changes. The active weather fiber cannot simply switch its `ctx.llm` reference mid-episode. It enters `UNLOADING`, runs recovery against its committed LLM-A view, and reaches an inactive condition. After LLM-B is available, a new activation episode begins with the new committed view. This is a controlled teardown and reactivation, not mutation of a hidden pointer.

Asynchrony complicates that story. The paper models long activation as an **effect iterator**: each step yields a new state, an inverse for that completed step, and a continuation. Once an asynchronous step has been issued, it has **inertia**: the runtime cannot pretend the Promise was never sent merely because the dependency target changed. The step first settles; then its contribution can be recovered before the runtime follows the latest target. Inertia means "finish and reconcile safely," not "magically cancel JavaScript execution." ([paper, pp. 35-38](https://github.com/cordiverse/paper/blob/13f28585668a28106b2f53bedada36e45bc1ed3e/paper.pdf))

The implementation also has a practical cleanup subtlety. Disposers begin in reverse registration order, but multiple asynchronous disposers may proceed concurrently. If cleanup B must finish before cleanup A begins, the plugin should put both operations inside one disposer and `await` them explicitly. `fiber.dispose()` waits for cleanup, including child plugins, but LIFO ordering alone is not a universal serial scheduler. ([lifecycle and effects tutorial](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/cordis-tutorial/02-lifecycle-and-effects.md))

Failure remains local where the contract permits. If the second activation step throws, the runtime can run the inverse from the first step and mark this fiber failed rather than destroying unrelated siblings. It cannot undo an external emission from that first step, and different schedules involving failure do not receive the paper's confluence guarantee.

## 8. How Events, Services, Configuration, and HMR Work Together

Cordis is not just an effect stack. Its plugin system combines code plugins, named services, typed events, a declarative Loader, configuration reconciliation, and **Hot Module Replacement (HMR)**, which means replacing module code while the process keeps running.

Events have distinct dispatch contracts:

| Mode | Awaited? | Semantics |
| --- | --- | --- |
| `emit` | No | Notify listeners in registration order; no collected return value |
| `parallel` | Yes | Await asynchronous listeners concurrently |
| `serial` | Yes | Await listeners in sequence and produce a decision/result according to the contract |
| `waterfall` | No | Around-middleware: a listener calls `next()` to delegate, or can short-circuit and rewrite the result |

`waterfall` is not ordinary publish-subscribe. It creates a policy chain. In DeepSeek Harness, request preparation, model streaming, and tool pre/execute/post stages use this style so one plugin can wrap another without importing it. The ordering and short-circuit rules therefore form a public behavioral contract, not an incidental implementation detail. ([Cordis primer](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/cordis-primer.md); [Harness architecture](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/architecture.md))

The declarative **Loader** turns configuration entries into a desired plugin tree. An **entry** is a persisted configuration unit; a stable `id` gives the entry identity across edits. **Reconciliation** compares the desired tree with the running fiber tree and mounts, updates, disables, or removes only what actually changed. It resembles Kubernetes' desired-state intuition, but the granularity is an in-process component and context, not a container or remote service.

```text
old entry tree + edited configuration
  -> keyed comparison by stable id
  -> unload/update/load affected fibers
  -> new running fiber tree
```

HMR extends that idea to code. A robust update must classify affected modules, locate stale entries, withdraw old fibers and their effects, import new code, and re-establish the affected subgraph. The paper describes a transaction-like reload that restores the module cache and old fibers if the new import fails; DeepSeek's vendor manifest documents additional local hardening around Loader and HMR behavior. The exact engineering strength must therefore be attributed to the relevant source, not flattened into one timeless "Cordis HMR" claim. ([paper, pp. 62-66](https://github.com/cordiverse/paper/blob/13f28585668a28106b2f53bedada36e45bc1ed3e/paper.pdf); [Harness vendor changes](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/vendor/README.md))

HMR is also not state migration. Cordis recovers the old fiber and loads the new one from a clean component state. Private memory disappears unless the architecture places durable state in a longer-lived service and explicitly defines a compatible handoff. Dynamic Software Updating (DSU) systems that migrate private state solve a related but different problem.

## 9. Why Cordis Is a Meta-Framework, Not Another Application Framework

An application **framework** supplies a domain's objects and control flow: a web framework defines routes and requests; a chatbot framework defines messages and commands; an agent framework defines tools, sessions, and model turns. A **meta-framework** supplies lower-level rules from which such frameworks can be built. In this usage, "meta" does not mean a framework that generates websites. It means a framework for composing other frameworks.

Cordis does not define what a chat message, LLM request, browser tool, or database entity means. It defines how components mount, declare dependencies, contribute services, own effects, receive events, and react to configuration or code changes. Koishi adds the chatbot domain. DeepSeek Harness adds the agent domain.

```text
applications:       a bot, coding agent, or web console
domain framework:   Koishi commands / Harness tools, sessions, and agents
meta-framework:     Cordis contexts, effects, coeffects, fibers, and Loader
```

This is also why "Everything is a Plugin" should not be read as "every function deserves its own package." A unit should become a plugin when it needs independent configuration, replacement, ownership, or lifecycle. DeepSeek's own development guide warns against splitting every simple tool into Definition, Provider, and Consumer packages before those roles actually need to evolve separately. ([capability design guide](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/user/develop/practice/index.md))

Koishi offers evidence that this layer can support a substantial ecosystem, but the limits matter. The paper reports more than 4,000 community plugins over four years and says both the server bot and web console are built on Cordis. It also identifies the case as a single ecosystem in one host language, observational rather than a controlled comparison, and based on Cordis v3. It does not quantify runtime overhead or developer productivity. That is evidence of expressiveness and adoption, not a universal performance result. ([paper, pp. 66-67](https://github.com/cordiverse/paper/blob/13f28585668a28106b2f53bedada36e45bc1ed3e/paper.pdf))

## 10. DeepSeek Harness: Where "Everything Is a Plugin" Becomes Concrete

DeepSeek's product page summarizes an agent as **Model + Harness**. The model reasons; the harness supplies the operating environment that lets reasoning affect the world. In DeepSeek Harness, model adapters, tool registries, session logs, system-prompt assembly, the agent loop, storage, sandboxing, scheduling, and user interfaces are all contributed through plugins. "No privileged core" means those product capabilities are replaceable rather than hard-wired into one business-logic module. It does not mean there is no bootstrap code, no Cordis runtime, or no operating-system security boundary. ([official Harness page](https://deepseek.com/harness/en/); [architecture at `b150a551`](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/architecture.md))

### Turn, Step, and Round

Three words describe different loops:

- A **step** is one model request plus the tool executions triggered by that response.
- A **turn** is the full drain of one accepted input and may contain zero or more steps. A tool can request another model step within the same turn.
- A **round** belongs to an outer strategy, such as one goal iteration or one fresh-agent attempt. It is not a universal session counter.

Cordis itself does not prescribe an LLM loop. `dsh-agent-loop` is a plugin that composes agent, session, LLM, tool, and system-prompt services into a turn lifecycle. That distinction is important: Cordis is the composition runtime; Harness supplies agent semantics. ([Harness glossary](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/glossary.md); [agent lifecycle](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/agent-lifecycle.md))

A simplified turn looks like this:

```text
user follow-up -> inbox -> turn/start
  -> agent/pre-step -> step/start
  -> append user/message to session log
  -> assemble system prompt and tool schemas
  -> agent/request -> llm/stream
  -> append assistant chunks and message
  -> for each tool call:
       tools/pre-execute -> tools/execute -> tool body -> tools/post-execute
       -> finalize result -> append tool/result
  -> step/end -> optional next step -> turn/end
```

The diagram contains two different event planes. Durable session events such as `user/message`, `assistant/message`, `tool/call`, and `tool/result` support reconstruction and user interfaces. Live extension points such as `agent/request` and `tools/pre-execute` let plugins control the current run. Conflating them would be dangerous: a live middleware callback is not automatically durable history, while appending history does not make an external effect reversible.

The tool path demonstrates the value of stable extension points. A model-emitted tool call does not jump directly into an arbitrary function. It moves through pre-execution policy, approval and monotonic guards, an around-execution chain for timeouts or metrics, the tool body, post-execution policy, normalization, and finalization before one authoritative result is logged. A **monotonic guard** is a policy whose decision can only become more restrictive as evaluation proceeds; a later plugin cannot silently undo an earlier denial. These concerns can be separate plugins because they meet at typed service and event contracts. ([tool execution pipeline](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/tool-execution-pipeline.md))

### Capability Seams

Harness calls a replaceable capability boundary a **seam**. A complete seam may have three roles:

1. **Service Definition:** defines the stable `ctx.<key>` vocabulary, request/result types, and behavioral contract.
2. **Service Provider:** implements that contract, such as a local shell or a sandbox shell.
3. **Consumer:** uses the abstract service, often exposing it as a model-callable tool.

The Bash capability illustrates the point. `dsh-shell` defines the interface; `dsh-bash-local` and `dsh-bash-sandbox` provide different execution backends; `dsh-tool-bash` exposes the capability to the model. Provider and Consumer depend on the Definition, not on each other. Replacing the backend can therefore move several consumers into another execution environment without rewriting their imports. ([capability design guide](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/user/develop/practice/index.md))

### Profiles, Bundles, Patches, and the Final Plugin Tree

A **profile** is a user-facing named composition. It selects **bundles**, which are distributable groups of Cordis configuration entries and supporting code. A **patch** changes configuration by stable entry ID, while an **overlay** is a later patch layer applied on top of earlier ones. The CLI composes them in order:

```text
empty tree
  + profile bundle patches
  + profile/cordis.patch.yml
  + $DSH_HOME/cordis.patch.yml
  + command-line patch overlay
  = final Cordis plugin tree
```

The `web` and `headless` experiences are therefore compositions, not separate kernels. `dsh --profile web --dump-config` lets a developer inspect the resolved tree without treating the original YAML files as the whole truth. External plugins resolve from the profile's `node_modules`, while official bundles resolve from the Harness installation. ([CLI and profile documentation](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/apps/cli/README.md))

Harness also maintains an append-only session log under the rule "Model-visible means logged." **Append-only** means new facts are added rather than history being overwritten in place. System prompts, reasoning, tool calls and results, subagent activity, and injected context can be reconstructed from that event stream. This supports replay, forks, search, and recovery, but it does not by itself protect secrets or establish a retention policy. The session log preserves durable agent facts; Cordis recovery preserves the current component structure. They solve complementary problems.

Finally, the evidence boundary: the current Harness genuinely uses Cordis. The fixed README and vendor tree prove that engineering relationship. The paper's conclusion still lists validation in self-evolving agent harnesses as future work. Adoption is not the same as a controlled experiment proving that an autonomous harness can safely rewrite itself under all conditions. ([paper, p. 79](https://github.com/cordiverse/paper/blob/13f28585668a28106b2f53bedada36e45bc1ed3e/paper.pdf))

## 11. A Minimal Tool Plugin That Can Be Mounted, Withdrawn, and Rebound

The following example uses the DeepSeek Harness package namespace consistently and follows the official tool tutorial at snapshot `b150a551`. It illustrates the ownership contract; it is not a benchmark or a proof of the manuscript's theorems. Because Harness is a developer preview, verify the current API before using it in production.

```ts
import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'

export const name = 'weather-tool'
export const inject = ['llm', 'tools']

export function apply(ctx: Context) {
  let cacheRevision = 0

  // A raw host resource needs explicit ownership and cleanup.
  ctx.effect(() => {
    const timer = setInterval(() => {
      cacheRevision += 1
    }, 30_000)

    return () => clearInterval(timer)
  })

  // The registry registration is already owned by this plugin's fiber.
  ctx.tools.register(defineTool({
    name: 'weather_snapshot',
    description: 'Return the current weather cache revision.',
    parameters: {},
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    async execute() {
      return `Weather cache revision: ${cacheRevision}`
    },
  }))
}
```

The `inject` declaration does two jobs. It prevents activation until both `llm` and `tools` are present, and it makes a change in either provider identity part of this fiber's target. The example does not import a concrete LLM or tool registry implementation. The service keys are its contracts.

`ctx.effect()` puts the timer acquisition and cleanup beside each other. This is preferable to a distant `deactivate()` method because a reviewer can see whether every raw resource has an inverse at the acquisition site. `ctx.tools.register(...)` returns or internally contributes a disposer according to the registry contract, so its ownership follows the plugin. The tool disappears when the owning fiber recovers. ([official third-party tool guide](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/user/develop/basic/tool.md); [into-the-Harness tutorial](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/cordis-tutorial/07-into-the-harness.md))

The expected lifecycle, based on the documented contract, is:

```text
mount weather-tool                  -> PENDING
provide tools only                  -> still PENDING
provide llm-A                       -> LOADING -> ACTIVE
replace llm-A with llm-B             -> UNLOADING -> LOADING -> ACTIVE
dispose weather-tool                 -> tool unregistered, timer cleared
```

Two details are easy to miss. First, replacing LLM-A is not an in-place variable assignment: the consumer finishes the old episode, recovers its effects, and activates against LLM-B. Second, the example's module-local `cacheRevision` is private episode state. It resets after reload. If the revision must survive HMR, put it in a deliberately longer-lived service rather than expecting Cordis to migrate it.

A serious test would assert one `PENDING` state, one activation, cleanup after provider replacement, reactivation with the new provider, and zero remaining timers or tool registrations after final disposal. It should also inject a failure after the first effect and verify that the first disposer runs. Such a test checks implementation behavior; it does not establish independence or confluence for arbitrary plugins.

For this article, a separate lifecycle check was run against upstream `cordis@4.0.0-rc.8` on Node.js v23.5.0 with pnpm 10.15.1. It used two independent provider Fibers and asserted different public `uid` values, then observed `PENDING -> ACTIVE(A) -> PENDING -> ACTIVE(B) -> DISPOSED`. Both consumer cleanups ran; the final tool registry and live-timer set were empty; emitting the test event after cleanup did not call the old listener. This verifies that particular npm build and test, not every supported Node.js version or every Loader/HMR strategy. The provider identity and dependency epoch behavior can be inspected in the fixed [`fiber.ts` snapshot](https://github.com/cordiverse/cordis/blob/8cc9e33fab69e2d0476d126baaf2acb24e6a6ab4/packages/core/src/fiber.ts#L385-L456), while provider withdrawal and dependent notification appear in [`reflect.ts`](https://github.com/cordiverse/cordis/blob/8cc9e33fab69e2d0476d126baaf2acb24e6a6ab4/packages/core/src/reflect.ts#L175-L227).

## 12. Cordis v4, Koishi, Shigma, Languages, and Package Names

Several historical and packaging facts explain otherwise confusing search results:

- Cordis predates DeepSeek Harness. The npm package began in April 2022, and the current GitHub repository was created in May 2022. The public package author is Shigma; the repository now lives in the Cordiverse organization.
- Cordis v3 and v4 should not be mixed casually. Koishi currently uses the v3 line. The paper presents v4 and says the core compositional model is shared, while v4 refines effect/coeffect semantics and rewrites the Loader.
- At the August 23, 2026 snapshot, upstream had `cordis@4.0.0-rc.8`, not a stable upstream `4.0.0`. DeepSeek's `@deepseek-ai/cordis@4.0.1` belongs to its vendored and rescoped release line.
- Cordis core is written in **TypeScript**, a typed language that compiles to JavaScript. It is shipped as modern JavaScript using **ECMAScript Modules (ESM)** and runs on **Node.js**, the server-side JavaScript runtime.
- No official Cordiverse Rust implementation was found. The paper discusses how the language-independent model might map to Rust traits, procedural macros, dynamic libraries, or WebAssembly. That is a portability analysis, not an existing official `cordis-rust` product.
- DeepSeek Harness also has a Python SDK and a small C-based Linux Landlock launcher. Neither changes the implementation language of Cordis core. ([Harness Python SDK](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/python/README.md); [Landlock helper](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/native/landlock-run/README.md))

For primary links, use the [Cordis repository](https://github.com/cordiverse/cordis), the [paper repository at the research snapshot](https://github.com/cordiverse/paper/blob/13f28585668a28106b2f53bedada36e45bc1ed3e/README.md), and the [DeepSeek Harness repository](https://github.com/deepseek-ai/deepseek-harness). A GitHub topic such as `dsh-plugin` is self-assigned discovery metadata, not a DeepSeek-reviewed plugin registry; the number of topic results is not evidence of compatibility or quality.

## 13. How Cordis Differs from DI, OSGi, React, FRP, Transactions, Saga, and RAII

Cordis sits near several established ideas. The useful question is not which technology "wins," but which scope and failure mode each one addresses.

| Technique | Primary scope | Cleanup or withdrawal | Response to provider change | Relationship to Cordis |
| --- | --- | --- | --- | --- |
| Dependency Injection (DI) | Objects and services, commonly at construction or startup | Container shutdown or manual hooks | Existing consumers are often not rebuilt automatically | Cordis adds a component-level reactive lifecycle to keyed injection. |
| OSGi Declarative Services, a dynamic Java service-component model | Dynamic Java bundles and services | Explicit deactivation callback | Services can activate or deactivate components | This is a close spatial neighbor; Cordis also structures inverse ownership and asynchronous withdrawal. |
| React `useEffect` | One UI component and its render lifecycle | An effect returns a cleanup function | Dependency changes rerun the hook | The acquire/cleanup shape is similar, but React is organized around rendering and hook call rules, not an open service-provider graph. |
| Functional Reactive Programming (FRP) and signals | Values and derived computations | Withdrawal is not the central goal | Fine-grained value changes propagate through a graph | Cordis reacts at asynchronous component-lifecycle granularity; an FRP system could live inside one Cordis service. |
| Database transaction / Software Transactional Memory (STM) | A bounded transaction | Commit, abort, or logged rollback | Does not manage long-lived service dependencies | Stronger for atomic changes inside a known short scope; Cordis episodes may remain open for hours. |
| Saga | Distributed business steps | Compensating business actions | Workflow dependencies are orchestrated explicitly | Useful for emissions beyond the Cordis recovery boundary; compensation is weaker than an exact inverse. |
| Rust ownership and RAII | Values and lexically scoped resources | Automatic `Drop` at scope exit | Does not rewire a live provider topology | Excellent inside a component; complementary to dynamic component lifetimes. |
| Kubernetes or process supervision | Processes, containers, and services | Terminate and recreate instances | Reconciles service-level desired state | Supplies coarse recovery and stronger isolation; Cordis works inside one process and cannot replace it. |

The closest conceptual combination is something like structured effect cleanup plus a dynamic service model. Cordis's distinctive move is to place both in one context-mediated runtime and reason about their interaction. Its cost is equally real: more runtime metadata, stricter service contracts, and more lifecycle behavior to test. ([paper, related work and discussion, pp. 67-78](https://github.com/cordiverse/paper/blob/13f28585668a28106b2f53bedada36e45bc1ed3e/paper.pdf))

## 14. What Cordis Does Not Solve

The strongest way to evaluate Cordis is to ask where its model stops.

**Not every effect is reversible.** A timer and listener can have disposers. A message already delivered to another organization cannot be undelivered. External emissions need idempotency, withholding, a Saga-like compensation, or human governance.

**A disposer can be wrong.** Cordis ensures that a registered inverse is composed and called. It cannot prove that the inverse restores the intended observational state. Tests and service-level laws remain the author's responsibility.

**Escaped state is invisible.** Direct mutation of a global object, a file, another context, or a host API bypasses the ownership boundary unless the plugin explicitly wraps it in a tracked effect.

**Cycles do not become healthy automatically.** The progress result assumes an acyclic provider-precedence graph. A dependency cycle commonly leaves involved components inactive. Breaking a bidirectional relationship into core services and an integration component can help, but may increase the number of components and the design burden.

**Service keys do not solve versioning.** Two authors may reuse one key for incompatible contracts. A provider can change behavior without changing its key. Peer dependencies and semantic versioning reduce the risk but do not prove behavioral compatibility or make multiple versions easy to host. The formal calculus also simplifies provision to one non-conflicting provider per realm; multiplexing belongs in an explicit broker or service design.

**Context mediation is not hostile-code isolation.** A plugin with ordinary Node.js access can evade context proxies. Untrusted code still needs an operating-system process, container, WebAssembly runtime, or another sandbox with least privilege. Harness's Linux Landlock helper belongs to that outer security story, not the context calculus.

**Hot reload is not private-state migration.** The default mental model is withdraw old effects and activate the new component from a clean slate. Persistent state must live in a longer-lived service or pass through an explicit migration protocol.

**The evidence is early.** The paper is an actively revised preprint with no verified peer-review venue at this snapshot. Koishi is a substantial but observational v3 case. DeepSeek Harness is a developer preview and an engineering adoption, not the completed self-evolving-system experiment proposed as future work. No controlled benchmark in the paper establishes lower latency, fewer failures, or higher developer productivity than alternative architectures. ([paper, pp. 66-73 and 79](https://github.com/cordiverse/paper/blob/13f28585668a28106b2f53bedada36e45bc1ed3e/paper.pdf); [Harness preview warning](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/README.md))

The adoption test is practical: do you truly need capabilities to enter, leave, and change dependencies inside a long-lived process while restart cost is high? If not, ordinary modules, DI, and `try/finally` are simpler. If yes, Cordis offers a rigorous vocabulary and runtime structure, but only if the team is willing to honor its boundaries.

## 15. Quick Answers to Common Cordis Questions

### What is Cordis?

Cordis is a TypeScript meta-framework for dynamically composing in-process components. It gives plugins owned effects, service dependencies, fibers, events, and coordinated lifecycle transitions. It is not itself an AI model or a complete agent product. Start with the [upstream repository](https://github.com/cordiverse/cordis).

### Was Cordis developed by DeepSeek?

No. Public npm and repository history place Cordis in 2022, before DeepSeek Harness. The public package author is Shigma and the repository is under Cordiverse. DeepSeek later adopted, vendored, patched, and rescoped Cordis for Harness.

### How are Cordis and DeepSeek Harness related?

Cordis provides the composition runtime. DeepSeek Harness uses it to assemble model adapters, tools, sessions, policies, storage, sandboxes, loops, and interfaces as plugins. The [fixed Harness README](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/README.md) explicitly says it is powered by Cordis.

### What is the difference between `cordis` and `@deepseek-ai/cordis`?

`cordis` is the upstream Cordiverse package. `@deepseek-ai/cordis` is the Harness vendor/rescope line, released with DeepSeek's local changes. Their version numbers are not directly comparable; always pair code examples with the package and snapshot they target.

### Are a Cordis plugin, Service, and Fiber the same thing?

No. A plugin is a mountable definition and lifecycle unit. A Service is a named capability that a plugin can provide. A Fiber is one runtime instance of a mounted plugin, owning identity, dependencies, state, children, and cleanup.

### What is spatiotemporal composability?

It is the joint ability to withdraw a component's owned in-process contribution over time and to keep component dependencies coherent as the live topology changes. The [preprint](https://github.com/cordiverse/paper/blob/13f28585668a28106b2f53bedada36e45bc1ed3e/paper.pdf) models those axes as revertible effects and reactive coeffects.

### Is Cordis a plugin system, framework, kernel, or runtime?

It can reasonably be described as a plugin meta-framework and runtime. "Kernel" is a reader-friendly label for its minimal coordination machinery, not the name of one official central class. Higher-level frameworks such as Koishi and DeepSeek Harness add domain semantics.

### Does Cordis v4 power Koishi's 4,000 plugins?

Not exactly. The paper reports more than 4,000 Koishi community plugins and says Koishi currently uses Cordis v3. The v4 manuscript shares the core model but refines semantics and rewrites the Loader; v3 adoption is not full v4 validation.

### Is Cordis JavaScript, TypeScript, or Rust?

The official core is written in TypeScript and published as JavaScript with type declarations for Node.js. The paper discusses possible language-independent realizations, including Rust, but no official Cordiverse Rust implementation was found at the research snapshot.

### Where is the paper, and has it been peer reviewed?

The fixed source is [*A Programming Paradigm for Spatiotemporal Composability*](https://github.com/cordiverse/paper/blob/13f28585668a28106b2f53bedada36e45bc1ed3e/paper.pdf). Its repository calls it an active-revision preprint dated August 13, 2026. No DOI, arXiv ID, venue, or peer-review record was verifiable at the August 23 cutoff.

## 16. Composition Ends with a System That Can Keep Running

A mature plugin system is not defined by how quickly it can insert code into a live process. It is defined by what happens next: whether each change has an owner and an inverse, whether every dependency reacts to provider identity, and whether withdrawal is coordinated through one lifecycle.

Cordis turns those questions into Context, effect, coeffect, Fiber, and Loader structures. DeepSeek Harness shows why that matters for an agent whose models, tools, policies, sessions, and interfaces must evolve independently. The design is most valuable when restart cost is high and runtime reconfiguration is real. Its guarantees remain only as strong as the inverses, independence assumptions, dependency graph, and security boundary supplied by the system around it.
