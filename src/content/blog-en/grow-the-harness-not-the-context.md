---
title: "Grow the Harness, Not the Context: From Strategy-Free Scaffolds to Reusable Specialist Agents"
description: "A deep read of arXiv:2609.26760 Growing Harness—turning recurring control into executable code via task feedback—contrasted with “just stuff more context” and with in-site harness / Skills / deterministic-pipeline narratives."
pubDate: 2026-09-24T00:00:00+08:00
author: "Remy"
tags: ["agent-harness", "ai-agents", "LLM", "context", "Agent Skills", "agent-loop", "developer-tools"]
lang: "en"
---

Agent products share a familiar reflex: when a task gets hard, stuff another prompt into context, another slice of history, another “experience summary.” In the short run the model looks more dutiful; in the medium run the token bill and attention budget both stretch. **Growing Harness**, introduced by researchers at the Shenzhen Institutes of Advanced Technology (CAS) and coauthors in [arXiv:2609.26760](https://arxiv.org/abs/2609.26760), turns the problem around—**stop asking the model to reinvent the same control decisions on every task; grow recurring control into executable code, and reserve context for task-specific evidence and semantic judgment.**

This is not soft ranking-chasing news. It is a mechanism piece that lines up with this site’s existing harness / Skills / deterministic-pipeline threads. The paper’s claim compresses to one sentence: **grow the harness, not the context.**

Why write it as a long-form post? In 2026 public discussion, “context” has almost become the default expansion dial: bigger windows, more aggressive summaries, longer memory, more Skills injected into the system prompt. Those dials can buy short-term gains, yet they rarely force a harder question—**which control decisions are already stable enough that they should not occupy model context at all?** Growing Harness nails that question with reproducible experiments: across two task families and three deployment-model scales, sinking control into code can keep success from falling (and raise it in most settings) while sharply cutting calls and cost. Long-horizon content needs that mix of mechanism, boundaries, and checkable numbers—not another headline that merely says “agents got stronger again.”

## The issue is not “can it call tools,” but “why replay the same control every time”

Deployed agents rarely face one-off isolated tasks. More often they serve the same task family, the same tool interfaces, and the same model backend, over and over, on instances whose goals and observations differ. Goals and observations change; surrounding control often recurs—refine queries, filter observations, verify progress, recover from errors, decide when to stop.

The standard move is to keep delegating those decisions to the LLM: reason again inside every trajectory. That stays flexible, but every step pays another inference cost and keeps appending prompts, observations, and outputs into a lengthening history. Our earlier [Claude Code Agent Harness](/blog/inside-claude-code-agent-harness/) piece already peeled one layer off production loops: what keeps an agent alive is often not the textbook five-step ReAct sketch, but context compaction, streaming execution, error recovery, permissions, and interrupts—that is, the harness. Growing Harness pushes the same thread further: **if control itself is a learnable object, can it grow from task feedback—rather than being hard-coded up front or stuffed back into the prompt every time?**

The paper’s central question is therefore concrete: under fixed model and tool interfaces, how can a scaffold that **does not pre-encode a task-solving controller** grow from task feedback so it stops asking the LLM to reconstruct behavior that code can execute?

## Strategy-free scaffold: low prior commitment, not an “empty program”

The authors call the starting point a **strategy-free scaffold**. It exposes the task entry point and fixed LLM and tool interfaces, but encodes **no** complete task-solving controller—for example, no native ReAct-style tool-calling loop. The model and tools remain callable, so an LLM-mediated agent is still representable; the only learnable object is the harness program \(h\).

Low prior commitment means two things. First, do not freeze the “correct control structure” at initialization. BrowseComp-Plus eventually grows a shared retrieval-and-evidence-verification pipeline; WebArena-Verified grows a layered program with deterministic resolvers, learned control routines, fallback browser control, and completion-state validation—same class of seed, different task families, divergent structure. Second, the optimizer is not required to patch an already-strong controller; it can grow executable control from a weak start.

That is not the same path as “hand-write a strong agent loop, then tune prompts.” It also differs from “store experience as natural-language workflows and retrieve them into context next time.” The persistent artifact is the **shared harness itself**: accepted repairs become ordinary program paths later tasks run directly, not text that must be reinterpreted.

## How Growing Harness grows: failure windows, function-level traces, gate rollback

The method is three interlocking mechanisms (Algorithm 1 in the paper).

**First, a failure-window curriculum.** Training maintains a bounded window of current failures with capacity \(K\), instead of repeatedly optimizing already-solved tasks. The optimizer **jointly repairs** failures in the window to encourage cross-task reusable behavior; solved tasks leave, unresolved ones keep fresh traces and incremented attempt counts, and tasks hitting \(R_{\max}\) are retired. The window forces the learner to see a *class* of failures, not a one-off patch for a single item.

**Second, function-level traces that localize the edit surface.** Each failed execution records a function-level execution graph: which harness functions, model calls, tool calls, and errors participated. The optimizer may modify only the entry function and functions implicated by failure traces, and may add a small number of reusable helpers, under edit budget \(L\); untraced existing functions stay unchanged. The directive is explicit: implement deterministic, reusable control—parsing, validation, state updates, conditional query refinement, error recovery, stopping—in code; keep task-dependent semantics—interpretation, synthesis, fuzzy comparison, answer generation—as LLM calls.

**Third, a success-first held-out gate with transactional rollback.** Candidates are re-run on the active failure window; insufficient repairs are discarded. More important: relative to the latest accepted checkpoint, if gate-set success falls, the entire repair sequence rolls back—not only code, but also the task cursor, failure window, and training records. The paper states the rule as success-first: lower online cost **cannot** compensate for lower gate success. That is exactly the continual-harness-optimization failure mode—local wins, global regression.

Together, the three address three technical challenges: what should become code versus remain a model call; how to keep each optimizer step focused on an active execution slice as the program grows; and how to avoid brittle rules and capability regression.

## Numbers only as reported: success, calls, cost, and ablations

Experiments use BrowseComp-Plus (deep search) and WebArena-Verified (multi-step web), each with 200 / 50 / 50 train / gate / final splits; deployment models are gpt-oss-120b, gpt-oss-20b, and Qwen3.5-4B. Baselines are adapted per benchmark: search-side Tool-Calling, Self-Ask, and IRCoT; web-side Tool-Calling, WebDreamer, and AgentOccam. Metrics are means over three independent final-evaluation runs, without selecting the best of multiple attempts.

The main results can be summarized honestly as follows (all from Table 1 and the paper body—no extrapolation):

- Across six benchmark–model settings, Growing Harness achieves the **highest mean success in five**; in the remaining setting it trails the best mean by **0.7** percentage points.
- Relative to Tool-Calling, LLM calls fall by **76.0%–91.8%** and deployed-agent inference cost by **74.4%–98.6%**.
- On WebArena-Verified, its success stays in **44.7%–45.3%** across the three model scales; under the same setting, Tool-Calling drops to **6.7%** with the 4B model. The paper emphasizes that sinking recurring browser control into code is especially valuable for small models and resource-constrained deployments.

Ablations (BrowseComp-Plus, deployment model gpt-oss-20b, one optimization run of 10 steps) separate the mechanisms: full method final success **36%**; without function-level guidance **18%**; without gate validation **22%**; with failure-window capacity set to 1 **28%**. Without the gate, gate success rose to 30% then fell to 16%—precisely the “fix current failures, damage prior capability” trajectory. Trace-local edits, joint repair, and gate rollback are complementary, not decorative.

Convergence shapes also differ: BrowseComp-Plus looks like an early jump from a shared retrieval-and-verification trunk; WebArena-Verified looks like specialized handlers for Shopping / Reddit / Map gradually attaching around a general browser loop. The task family shapes the controller—which is what low prior commitment wanted.

## What the learned programs look like: pipeline vs layered controller

The post-hoc abstraction in Appendix Figure 6 is worth a separate read, because it shows that “strategy-free” does not mean “structure-free”—**structure emerges from task feedback.**

On BrowseComp-Plus, the learned harness looks like a shared retrieval and evidence-verification pipeline: query generation, evidence collection and compression, and answer checking share one trunk. Repairs to that trunk transfer to gate tasks instead of sprouting private branches per item—which helps explain the rapid early gate gains. WebArena-Verified is different: around a general LLM-guided browser loop hang deterministic resolvers, learned control routines, fallback browser control, and an explicit completion-state validator; Shopping, Reddit, and Map task types can add specialized handlers without rewriting paths other types still use.

For product managers, the translation is: you need not first bet on “one company-wide super agent loop.” If you serve a stable task family, letting the controller grow from failures is often closer to the data than convening an architecture committee. For engineers, the translation is: inspect the final control graph, not only the success rate—you need to know whether growth produced a shared trunk or a forest of special cases. Special-case forests can look fine on the training set and shatter under distribution shift.

The paper also warns that the two benchmarks use different training configurations, so “pipeline vs layered” should be read as a description of these runs, not a strict comparison of intrinsic difficulty. That restraint is useful: the same growth algorithm can converge to different executable shapes under different feedback structure.

## Where related work sits: prompt optimization, skill libraries, harness search

Stuffing Growing Harness into “yet another agent framework” undersells it. A more accurate map:

- **Inference-time control** (ReAct, Self-Ask, IRCoT, Reflexion) shows that control matters, but loop structure is usually specified in advance and many decisions are still recomputed as textual history.
- **Cross-task experience** (ExpeL, Agent Workflow Memory, Voyager, LATM, CRAFT) shows experience can be amortized; textual insights must be retrieved and reinterpreted, while skills/tools often hang behind an existing agent structure. Growing Harness’s persistent object is the shared controller itself.
- **Language-model program optimization** (DSPy, MIPRO, TextGrad, GEPA, AFlow, ADAS) treats prompts, modules, and workflow structure as learnable. Growing Harness emphasizes **continual program growth** from a strategy-free scaffold: failures identify missing behavior, trace-local edits add it, and accepted updates accumulate across a task stream.
- **Direct harness optimization** (AutoHarness, Meta-Harness, VeRO, and related work) already treats code and configuration around the model as an optimization surface. The distinction here is not “can we synthesize code,” but open-ended global growth via failure-conditioned local optimization, starting from a strategy-free scaffold, with transactional gating against capability regression across successive updates.

If you already run Skills or a cross-harness operator system, this is not an either/or. Skills answer how human-authored workflows load across runtimes; Growing Harness answers how machines turn recurring failures into executable control assets. One layer is distribution and governance; the other is growing the controller from feedback.

## Contrast 1: why “just stuff a bit more context” is not the same path

Stuffing more context assumes that if the model sees more history, more rules, and more experience summaries, it will “remember” how to control the next trajectory. Growing Harness’s rebuttal is structural:

1. **Recurring control should not consume semantic bandwidth.** Long histories raise input cost and can make relevant evidence harder to use; the paper cites prior work on long-context utilization difficulties. Writing query refinement, stopping conditions, and error recovery as code removes pieces that no longer need to be reasoned about inside the window.
2. **Textual experience still has to be reinterpreted.** Methods like ExpeL and Agent Workflow Memory store insights or workflows for later retrieval; the next execution still reads them into model context. Harness growth turns accepted behavior into program paths whose marginal cost is closer to an ordinary function call.
3. **Compression and routing lower cost; they do not change structure.** LLMLingua, FrugalGPT, and RouteLLM make calls shorter, cheaper, or selectively expensive. They improve *how* you place this call. Growing Harness asks whether *this call should have been placed at all.*

For engineering teams, the practical test is blunt: if your agent keeps making the same class of control mistakes inside one task family, the first candidate upgrade is not necessarily a larger context window—it is whether **that control can become testable, versioned, rollback-able code.**

## Contrast 2: Skills / ECC / deterministic pipelines—aligned, but different layers

This site already carries several related narratives; the layers need to stay distinct so every kind of “reuse” is not mashed into one thing.

The [Agent Skills starter guide](/blog/agentskills-io-starter-guide/) covers how capability packs distribute and trigger: when to activate, what to emit, how to accept. Cloudflare’s [security-audit-skill](/blog/cloudflare-security-audit-skill-for-coding-agents/) turns security audit into an installable Skill—hard stages, structured artifacts, validation scripts—and even describes itself as the single-repo seed of an internal vulnerability-discovery harness. Alibaba’s [Open Code Review](/blog/alibaba-open-code-review-deterministic-pipeline/) pulls “which files must be reviewed” and “which line a comment lands on” out of natural language and into deterministic engineering. Public skill / harness products such as Addy Osmani’s agent-skills and affaan-m/ECC push further: portable `SKILL.md` files, rules, hooks, and cross-harness adapters as an operating system. They answer how **workflows get installed, triggered, and reused across runtimes.**

Growing Harness does not replace those layers. It answers another one: **under fixed tools and models, can the controller program itself grow from failure feedback, turning control from “strategy stuffed into every context” into a shared executable asset?** Skills are usually human- (or team-) authored workflow specs injected on demand; OCR and security-audit emphasize deterministic gates and validation; Claude Code–style harnesses emphasize surviving production loops. The paper’s contribution is growing a reusable specialist agent from a strategy-free scaffold via failure-guided program synthesis—and keeping success stable even under smaller deployment models.

The “split generation from judgment” thread in [Jev × Claude Code](/blog/jev-claude-code-10x-and-25-lines/) is isomorphic to “leave semantics to the model, sink control into code”: not every decision deserves a full LLM call. The difference is that Jev is about wiring a structured judgment service into coding agents; Growing Harness is about training whole controllers into programs.

One-line contrast:

| Layer | Typical artifact | Main problem solved |
| --- | --- | --- |
| Skills / workflow packs | `SKILL.md`, stage checklists, validators | Distribution, triggering, human-maintainable process reuse |
| Deterministic engineering gates | File selection, localization, schema checks | Steps that must not gamble on model mood |
| Production agent harness | Compaction, streaming, permissions, recovery | Keep the loop alive in the real world |
| Growing Harness | Shared controller code grown from failures | Stop re-reasoning recurring control every time |

## What you can copy in engineering (and what you cannot)

The paper’s conclusion is restrained: value depends on reusing the learned harness enough to offset offline optimization cost; real deployment still needs sandboxing, explicit permission boundaries, and validation of generated code. Read alongside this site’s [Agents of Chaos](/blog/agents-of-chaos-ai-agent-failures/) failure cases, that warning is not an appendix to skip—an optimizer that can rewrite the harness is essentially “an agent that can write production code.” Without sandbox and gate, growth amplifies the execution surface.

A practical checklist:

1. **Define the task family before talking about growth.** Growing Harness assumes train and final evaluation come from the same distribution. Mixing cross-domain failures into one window mostly yields special-case patches.
2. **Encode “sinkable to code” vs “must stay model” as optimizer constraints.** Prefer code for parsing, state machines, stopping conditions, and schema checks; keep open-ended interpretation and synthesis as LLM calls. That matches OCR’s split: deterministic owns what must not fail; the agent owns what must stay alive.
3. **Failures must localize to functions, not only a 0/1 outcome.** Without an execution slice, growth degrades into whole-file thrashing as the program enlarges.
4. **Jointly inspect a window of failures, not one patch per item.** \(K>1\) exists to force shared behavior.
5. **The gate must be able to roll back whole sequences.** When local success rises and held-out success falls, default to not merging. Success-first, not cost-first.
6. **Offline optimizer and online deployment models may differ.** The paper allows a stronger optimizer model and a smaller deployment model—exactly the pattern behind stable WebArena success on small models.
7. **Treat generated code as untrusted input.** Sandbox, permissions, static checks, and gate evaluation are not optional before production loops.

Also write down anti-patterns:

- **Baking instance answers into the harness.** The optimizer must not encode task IDs, expected answers, or fixed solutions. Once “growth” becomes memorization, reuse is fake.
- **Defending regression with lower cost.** Gate success fell, but calls fell too, so you merge—this violates success-first.
- **Whole-repo rewrites without function-level traces.** Ablations halved final success and stalled early without them; larger programs deepen the pit.
- **Window forever equal to 1.** One patch per failure most easily grows brittle rules; joint failures push the optimizer toward shared structure.
- **Wiring offline-optimizer tool permissions straight into production.** An agent that can edit the harness has an attack surface close to “a person who can ship deploy code.”

If you already have Skills, a pragmatic join is: Skills keep carrying human-maintained stages and acceptance criteria; Growing Harness–style mechanisms may only edit modules marked “learnable control,” and every acceptance must pass a business-relevant held-out gate. Do not let “auto-grown programs” and “hand-authored skill packs” fight over the same unversioned directory.

What you cannot copy directly: you do not have their optimizer prompts, dataset splits, or tool wrappers. Reproduce the **paradigm**, not an out-of-the-box product. And do not turn the paper’s numbers into a marketing line that “any agent swapping in Growing Harness cuts cost by ~90%”—those reductions are versus Tool-Calling on two benchmarks and three deployment models.

## The long-horizon reading: context is a workspace; the harness is the asset

Over the past year, public agent-engineering talk has often orbited three things: longer context, stronger models, more Skills. All three help; they do not answer the same question. Longer context expands the *current* workspace; stronger models raise the semantic ceiling; Skills accelerate process distribution. Growing Harness adds a fourth: **move recurring control from the workspace into the asset table.**

Asset table means: diffable, testable, rollback-able, and reusable on smaller models. When deployment moves from 120B to 4B, Tool-Calling collapses hard on WebArena-Verified, while the learned harness roughly holds—that is not “the small model suddenly got smarter,” it is that **smartness was requested fewer times.** For on-device, private, and cost-sensitive settings, that path is a better long bet than “buy another tier of context.”

It also reminds product teams: if your moat lives only in the system prompt, a competitor can chase by copying prompts; if the moat lives in gate-validated, continually grown harness code, the copy cost is different. Skills and deterministic pipelines still matter—they are the human-maintainable interfaces and gates. Growing Harness shows that the controller behind those interfaces can itself be a learning object.

## Closing

[Grow the Harness, Not the Context](https://arxiv.org/abs/2609.26760) is not another multi-agent orchestration slogan. It is a testable training paradigm: start from a strategy-free scaffold, use function-level failure traces as local supervision, use a failure window to force reusable repairs, use a held-out gate to block regression, and finally sink recurring control into code while reserving model context for task-specific evidence and semantics.

For readers of this site, the most useful reading is a trilogy: use [Claude Code Agent Harness](/blog/inside-claude-code-agent-harness/) to see what production loops must add; use Skills / [security-audit-skill](/blog/cloudflare-security-audit-skill-for-coding-agents/) / [Open Code Review](/blog/alibaba-open-code-review-deterministic-pipeline/) to see how process is distributed and locked down; then use this piece to ask—**when the same task family will run for a long time, maybe the growth target should not be the prompt, but the harness.**

Grow the harness. Stop defaulting to stuffing control back into context.
