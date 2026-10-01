---
title: "HEXIS: Compiling Agent Skills into State Machines"
description: "Reading arXiv:2609.30123 HEXIS: Skill+ReAct still re-infers control each step; compiling skills into extended FSMs keeps knowledge in per-state instructions and control in guarded transitions. +16.2pp avg vs Skill+ReAct across 4×4 settings; Qwen3.8-27B cuts execution tokens 38.4–88.9%. Contrasts site posts on progressive disclosure / SkillDelta."
pubDate: 2026-10-01T10:40:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "developer-tools"]
lang: "en"
---

Most agent skills today are still markdown: domain knowledge, steps, scripts, and templates, loaded when needed. SkillsBench-style results already show curated skills lift pass rates. The sharper half of the problem remains: **clear writing does not mean the agent will honor order, dependencies, and branches through a long run**.[1]

The common path is **Skill + ReAct**: the whole skill sits in context while the model jointly infers “what the task needs” and “which tool comes next.” Failed checks get reported without the required revision; branches in the document are skipped; long histories bury relevant clauses. The paper’s framing: **task reasoning and control decisions couple in the same decode**, so local slips compound.[1]

[HEXIS](https://arxiv.org/abs/2609.30123) (*HEXIS: Compiling Agent Skills into Extended Finite State Machines*, arXiv:2609.30123v2) does not mainly rewrite a prettier skill. It **compiles** an existing skill into an extended finite state machine (FSM): knowledge stays in local per-state instructions; control becomes guards and transitions. An incremental compiler drafts the machine from skill clauses and tool interfaces, then aligns development traces to add missing states. **Updates land only after static checks and replay of the current trace plus every previously accepted one.** Across four benchmarks and four executors, HEXIS beats Skill + ReAct by **16.2 percentage points** on average success. With Qwen3.8-27B as executor, it also uses **38.4–88.9%** fewer execution tokens than Skill + ReAct (range across benchmarks).[1]

On this site we already covered “what to load first from a large skill library” and “whether a relevant skill should be injected”—[Progressive Disclosure](/blog/progressive-disclosure-agent-skills/) and [SkillDelta](/blog/skilldelta-selective-skill-activation/). HEXIS is the next layer: **once a skill is chosen, how to execute it reliably**, instead of re-inferring control at every step.

## How this lines up with prior posts

It helps to split the skill lifecycle so three posts do not fight over one slogan:

| Stage | Site entry | What it owns |
| --- | --- | --- |
| Disclosure / load | [Progressive Disclosure](/blog/progressive-disclosure-agent-skills/) | Large libraries: frontmatter first, `load_skill` on demand—not eager full dumps |
| Activation / inject | [SkillDelta](/blog/skilldelta-selective-skill-activation/) | Relevant ≠ positive gain; pair histories with/without a skill to predict task-conditional lift |
| Execution / fulfill | This HEXIS post | After selection, compile order, deps, and branches into enforceable control |

On the harness side, [Grow the harness, not the context](/blog/grow-the-harness-not-the-context/) argues recurring control decisions should become programs. HEXIS is more specific: the **compile object is an existing skill document**; output is an FSM with bindings and guards—models reason *inside* states. With [SpecHarness](/blog/specharness-spec-holds-the-pen/)’s proposal vs authoritative commit in mind, HEXIS runtime transitions feel like **mechanical fulfillment of control obligations**: a judge emits a verdict, and failure edges to revision instead of hoping the model remembers to fix it.[1]

Beginners on skills/tools can start from the [Agent Skills starter guide](/blog/agentskills-io-starter-guide/). This post assumes you already have a skill and care about compliance and cost.

## Why the problem is hard: deviation multiplies

The paper splits a skill document into two pieces that natural language usually interleaves:

- **Knowledge \(\mathcal{K}_D\)**: how to perform operations, criteria, examples, explanations;
- **Control requirements \(\mathcal{R}_D\)**: order, data dependencies, branching, repetition, termination, prohibitions.[1]

Native execution roughly feeds the whole \(D\), task input \(x\), and history \(h_t\) to a policy that samples an action each step. Requirements in context only *influence* the choice—they do **not** enforce it. So each step has a local deviation probability \(\epsilon_t\): given still-compliant history, does the next action fall outside the skill-permitted set? Over a fixed horizon \(K\), the chance of at least one deviation expands as a product of \((1-\bar\epsilon_t)\). Even small per-step bias collapses full-run compliance as trajectories lengthen.[1]

HEXIS’s cut: relevant knowledge goes into **state-local instructions** (and resource refs); control requirements become **states, guarded edges, and termination rules**. After a state’s operation, the runtime takes the **first outgoing edge whose guard is true**. A model may write “failed” using the skill’s checking criteria while the machine routes to a revision state—without another “what next?” decode. When the encoding is faithful and conditions are established correctly, that boundary no longer needs a fresh control inference—directly targeting the cumulative risk above.[1]

The formal compile objective is: among machines that meet structural and interface constraints, minimize remaining uncertainty about skill-permitted continuations given the machine configuration (conditional entropy / representation loss). In practice the compiler does not estimate entropy; it accepts updates via **static checks + trace replay**. The appendix relates that acceptance rule to the objective.[1]

## What the machine looks like

An extended FSM is \(M=(Q,q_0,V,\mathrm{op},E,F,\tau)\): finite states, initial state, typed variables, operations, ordered outgoing edges, terminals (including fallback \(q_{\mathrm{fb}}\)), and outcome categories.[1]

Non-terminal states are **model**, **judge**, or **tool**. Each has a read set \(R_q\), a write set \(W_q\), and either local instructions \(p_q\) or a tool call. At run time, model/judge states see only \(p_q\) and \(\nu_{R_q}\)—**nothing the compiler did not declare can enter that state**. That is a hard shrink relative to “full skill + full history.” A judge writes one label from a fixed set; edge guards are Boolean tests on variables; failed ops or unparseable outputs go to fallback. Every non-terminal must have a default always-true edge; loop counters have limits and exits so cycles are bounded.[1]

Intuition: the machine tracks *which stage* and *which intermediate values live in which variables*; the model reasons and generates inside a state; **the next operation is chosen by guards, not by re-reading the skill**.[1]

## Incremental compilation: draft, then patch from traces

Two phases (paper Figure 3): **initialization** and **trajectory updates**.[1]

**Initialization.** A construction model extracts quoted rules from the skill (required ops, order, prohibitions, termination, event labels). A rule is kept only if its quotation appears in the document and its tools/labels sit in the interface table \(\mathcal{T}\). The model then drafts a machine and redrafts from checker errors for a bounded number of rounds; every clause of \(D\) should become a state or land inside a local instruction. `Check(M)` covers five families: syntax/graph (well-formed fields and guards, reachability from \(q_0\) to terminals, default edges); variables (each state’s read set ⊆ variables defined on *every* path in—both sides of a branch must assign); terminal evidence variables defined; and graph encodings of rules (e.g. required \(o\) means no verified terminal is reachable after removing states that perform \(o\); \(o_1\) before \(o_2\) means \(o_2\) is unreachable without \(o_1\)). Failure means initialization fails.[1]

**Trajectory updates.** From one development trace, extract an event sequence (tool calls or model outputs with I/O and reasoning text) and the recorded outcome. Align events to existing states: reuse a same-type state the construction model judges able to perform the op; create a new state if none fits; ignore events that realize no skill operation. Tool events also require the same tool; prefer reachable states; reject a new edge that would bypass a required state. On a copy of the machine, add states/edges, read guards from outcomes, turn passed values into bindings; if one guard leads to two different successors, insert a judge that splits on labels; give new cycles a counter.[1]

A candidate is accepted iff the copy passes `Check` **and** replays successfully on the **current trace and every previously accepted archived trace**. Replay drives recorded outputs instead of calling models/tools; aligned states must appear in order, fallback must not appear, and the terminal category must match. Because replay uses recorded outputs, a previously accepted trace fails only if the edit changed a guard or a transition on its path. A failed candidate may realign once over reachable states; a second failure drops the trace.[1]

For engineering: HEXIS is not “search a workflow that happens to work on one model.” It treats the **skill as the compile object**, patches with traces, and uses static checks plus full accepted-set replay to block silent regression—unlike packing more success stories into memory and hoping the next run re-infers control.[1]

## Experiments: four benchmarks, four executors

Four benchmarks, one skill document each; binary success/failure on held-out tests. The last three splits are roughly 80/20 with seed 2026.[1]

| Benchmark | Tasks and skill (paper setup) |
| --- | --- |
| SpreadsheetBench | 107 verified cell-manipulation tasks; SigLeak spreadsheet skill; 50/57 dev/test |
| LiveMathematicianBench | Mathematician-level multiple choice (options shuffled with a fixed seed); SigLeak skill; 487/121 stratified by month |
| InfiAgent-DABench | 257 code-on-data questions; Pandas Pro skill; 206/51 stratified by difficulty |
| LongSeal (SealQA) | Evidence spread over long webpage collections; offline with supplied pages only; SigLeak skill; 203/51 |

Baselines share the **same executor and tools** as HEXIS; they differ in how the skill is supplied: Skill + ReAct (native), AWM (induce workflows from successful traces into context), ReasoningBank (distill strategies from success and failure, then retrieve), SkillOpt (revise skill text under feedback, then run natively), AFlow (search a workflow of model calls). Executors: hosted qwen3.6-flash and GLM-4.7-FlashX, plus local vLLM FP8 Qwen3.5-9B and Qwen3.8-27B. Compilation, SkillOpt, and memory induction use Claude Fable 5.1. Machines are compiled and refined **only** from the skill document and **all** qwen3.6-flash development trajectories (success and failure, including intermediate results). **One machine per skill** then transfers directly to the other three executors—same states, prompts, bindings, and transitions, with **no** target-model recompilation.[1]

They also report **request-level full compliance (RFC)**: the fraction of runs where every applicable, mechanically checkable request/interface requirement holds (file delivery, output format, tool-use constraints)—independent of answer correctness.[1]

### Reading the main results

Table 1: HEXIS beats Skill + ReAct in **15 of 16** settings and is best or tied-best in **11**. Mean gain vs Skill + ReAct: **16.2pp**. Largest lifts on LiveMath (**31.4–38.0pp**); smallest on DABench (**1.9–4.0pp**), where native success is already **78.4–86.3%**. Experience injection or text revision is inconsistent: AWM, ReasoningBank, and SkillOpt each fall below Skill + ReAct on LiveMath for at least two executors. AFlow is competitive on LiveMath but drops to **51.0%** and **15.7%** on DABench with the local executors; machines compiled only from qwen3.6-flash traces still improve **11 of 12** settings on the other executors without recompilation—evidence that **cross-model reuse of control structure** works, and that a searched workflow does not automatically transfer.[1]

A few cells for cross-check (success %, Skill + ReAct → HEXIS):

- Spreadsheet × qwen3.6-flash: **45.6 → 75.4**
- LiveMath × qwen3.6-flash: **44.6 → 76.9**; × Qwen3.8-27B: **33.9 → 71.9**
- DABench × Qwen3.8-27B: **86.3 → 88.2** (native already high)
- LongSeal × qwen3.6-flash: **7.8 → 21.6**; × Qwen3.5-9B: **23.5 → 23.5** (tie—the one non-lift cell)[1]

RFC moves with success: on LiveMath, native full compliance is only about **23.1–79.3%**, HEXIS reaches **91.7–100%**; on DABench native compliance is already **88.2–98.0%**, and success gains stay small. A control ablation renders the **same compiled machine as a prompt** (Prompt-only) and lets the model follow it: average success drops **16.8pp** and compliance **28.0pp** relative to true runtime execution—so gains come from **programmatic control**, not from “clearer FSM prose” alone.[1]

Compliance is necessary but not sufficient: on SpreadsheetBench × qwen3.6-flash, SkillOpt and HEXIS both hit **100%** compliance while succeeding on **59.6%** vs **75.4%**—how states apply skill knowledge still matters.[1]

### Tokens: not every executor saves

Figure 5: vs Skill + ReAct, HEXIS saves most on long-context LongSeal (~**90.0%** with qwen3.6-flash, ~**80.8%** with Qwen3.5-9B), consistent with each state reading only declared inputs rather than accumulated history. On Spreadsheet and LiveMath with qwen3.6-flash, cost rises slightly (~**+4.9%**, **+8.9%**) because machines add explicit verification steps. Elsewhere it depends on the executor: with **Qwen3.8-27B, HEXIS is cheapest on every benchmark**, using **38.4–88.9%** fewer tokens than Skill + ReAct; with GLM-4.7-FlashX it cuts **28.4–94.5%**; with Qwen3.5-9B it uses *more* tokens on the other three benchmarks.[1]

For your own cost ledger: HEXIS sells **externalized control**. Token curves move with the executor and with how many verification steps you compile in—do not treat the abstract’s range as “any model always drops hard.”

### Stacking with SkillOpt

Table 2 (SpreadsheetBench): original skill + Skill + ReAct **45.6%** / 213k tokens; original + HEXIS **75.4%** / 223k; SkillOpt text + native **59.6%** / 257k; **SkillOpt + HEXIS 84.2%** / **69k**—another **24.6pp** and ~**73.2%** fewer tokens vs native execution of the optimized skill, and another **8.8pp** over HEXIS on the original skill. The paper’s line is blunt: **content optimization and execution structure are complementary**—SkillOpt improves guidance quality; HEXIS organizes how it is applied.[1]

That matches the site’s experience editing agents.md / skill prose: better text raises the ceiling, but if control still rides on per-step inference, compliance and cost keep jittering.


## Three neighboring lines—and where HEXIS sits

The paper clusters related work into three lanes (Figure 2), which map cleanly onto harness talk on this site:[1]

1. **Skill optimization (edit the document).** SkillOpt revises skills from scored executions and keeps edits that help held-out validation. Better prose still leaves **every control decision to the executor**—the cumulative deviation in §3.1 can persist. Formal Skill makes control explicit as programs with executors, hooks, and local runtime state. HEXIS also executes explicit control, but **starts from an existing skill document** and refines with traces, so an optimized skill can be its input (Table 2).[1]

2. **Memory-augmented agents (add experience).** Reflexion, Agent Workflow Memory, and ReasoningBank turn past runs into verbal feedback, workflows, or retrieved strategies. They enlarge *what the model knows*, not *how execution is controlled*: when to apply experience is still inferred, and the extra context competes with a growing history.[1]

3. **Workflow search (explicit programs).** StateFlow stages tasks with a state machine; AFlow searches model-call workflows with MCTS; TraceCompiler and Compile Then Page compile from traces or SOP constraints. These usually **do not take an existing skill document as the compile object**, and a searched workflow can swing hard across executors—AFlow’s drops in §5.3 are the cautionary tale. HEXIS compiles the skill itself: knowledge stays in state prompts for reasoning; the runtime runs the control flow.[1]

Short version: better docs, more memory, and searched workflows can all raise scores; HEXIS bets on **pulling control out of decoding**, with an interface that matches skill files you already maintain.

## How traces enter the machine (engineering intuition)

Initialization often fails for boring reasons: rule quotations do not appear in the document, tool names are missing from \(\mathcal{T}\), or one side of a branch never assigns a variable a later state reads. The variable condition uses a greatest-fixed-point style \(\mathrm{Def}(q)\): only variables defined on **every** incoming path may appear in a read set—much closer to definite-assignment thinking than “it happened to be set on the happy path.”[1]

During alignment, the construction model judges whether an event is an operation some existing state can perform. Misses become new states whose local instructions pull from reasoning text and related clauses. When one guard would lead to two successors, a judge is inserted—admitting that **conditions that look identical in prose may need an explicit label split at runtime**. Failed replay rejects the update so fixing today’s trace cannot silently break yesterday’s accepted set.[1]

For maintainers, the archive \(\mathcal{P}_k\) behaves like a set of **replayable regression fixtures**: not unit-test code, but the same kind of constraint—graph edits must still reproduce historically aligned paths.

## Appendix takeaways worth stealing into a harness

**Machine size (qwen3.6-flash diagnostics):** about **12–17** states and **19–35** edges. Compact graphs can still revisit heavily: Spreadsheet averages ~**10.60** revisits, with long runs of tens of machine steps. Those revisits include re-analysis, tool runs, and output checks—they are **not** the same as hub error retries. Runtime retries on LiveMath / LongSeal are rare; true “interpret the full skill” fallback is rarer still.[1]

**LiveMath example machine (Appendix B.4):** 12 states, 19 explicit transitions, 18 typed variables; model / judge / tool / terminals / fallback. A typical path: analyze → pick an option → (optional) completeness judge and repair → write-file command → bash write → read back → consistency judge → verified or unverified report. Here **“verified” means the delivered file matches the machine’s selected letter—not that the math answer is correct**. Do not conflate control-loop verified with task correctness.[1]

**Compiler swap:** machines compiled with Claude Sonnet 5 (low effort) and executed with qwen3.6-flash still beat Skill + ReAct on all four benchmarks, trailing Fable-compiled machines by only about **2.0–4.2pp**. The gain is not locked to one compiler model.[1]

## Limits and a practical checklist

The authors are explicit: coverage is bounded by skill documents and development traces—**requirements or branches they never express may be missing from the machine**. Static checks and replay validate recorded paths; they **do not guarantee correct in-state reasoning or coverage of unseen situations**. Targeted trace collection and stronger in-state verification are listed as future work.[1]

If you try “skill → executable control” in your own agent/harness, a minimal mechanism checklist (not a reproduction script):

1. **Separate disclosure, activation, and execution**: progressive disclosure for large libraries; gain prediction for injection; compile control only after selection.
2. **Pull \(\mathcal{R}_D\) out of soft context**: order, deps, prohibitions, and termination should become states and guards—not bold reminders alone.
3. **Whitelist state inputs**: explicit read/write sets so “full history + full skill” does not re-couple.
4. **Make updates regressable**: static check + replay of all accepted traces before accepting a graph edit; reject on failure instead of silent drift.
5. **Transfer control structure across models first**: whether a machine compiled from one source executor’s traces still lifts others matters more than re-searching a brittle workflow per model.
6. **Score compliance and correctness separately**: keep RFC-style mechanical checks beside answer accuracy; a Prompt-only ablation tells you whether gains are from the runtime.
7. **Stack with skill-text optimization**: SkillOpt (or human revision) then compile often beats either alone—Table 2 is direct evidence.[1]

Anonymous code and artifacts are pointed at the paper’s anonymous.4open.science link; treat the authors’ final repo as source of truth once public.[1]


## Pitfalls when reading Table 1

The main table is a 4×4 success grid; the abstract’s **16.2pp** is the **mean lift vs Skill + ReAct across those sixteen cells**, not a single highlight cell. Read three things together:[1]

1. **Who is second.** On Spreadsheet × Qwen3.8-27B, AFlow at **73.7%** slightly beats HEXIS at **71.9%**—HEXIS is not first everywhere; the paper’s own claim is “15/16 above Skill + ReAct, best or tied-best in 11/16.”
2. **When native is already high, lifts shrink.** DABench’s four cells only move **1.9–4.0pp**; there, RFC and tokens matter more than a success headline.
3. **Transfer ≠ re-search.** Machines are compiled only from qwen3.6-flash traces yet still win most settings on GLM / local Qwen—that is evidence for **migratable control structure**, not “we retuned per executor.”[1]

Separately: SkillsBench’s jump from **33.9%** to **50.5%** average pass rate (87 tasks, eight domains) with curated skills is from **another paper**—it motivates skills’ value. HEXIS answers the **execution** layer; do not add the two percentage-point stories into one marketing sentence.[1]

## When you should *not* reach for HEXIS

Not every skill deserves an immediate FSM. Combining the paper’s limits with harness practice:

- **Highly exploratory tasks with nearly unenumerable branches:** branches never seen in traces will not magically appear; forced compilation can yield a falsely complete graph.[1]
- **Skills still rewriting weekly with conflicting clauses:** SkillOpt / human revision first; otherwise checks stay red or guards contradict.
- **Very weak executors where in-state reasoning is already the bottleneck:** HEXIS does not guarantee correct in-state generation; LiveMath “verified” only means file-letter agreement, not math correctness.[1]
- **What you actually lack is load/activation policy:** for large libraries, do progressive disclosure / SkillDelta before execution compile—or you will build a beautiful machine on the wrong skill.

Conversely, HEXIS’s sweet spot looks like strong SOP flavor, stable tool interfaces, mandatory post-failure revision, and mechanically checkable delivery (write, read-back, format, no skipped steps). Spreadsheet / data-analysis / “must write then verify” flows align with where the main results concentrate.[1]

Read with [Grow the harness](/blog/grow-the-harness-not-the-context/): Growing Harness emphasizes **growing** programs from feedback; HEXIS emphasizes compiling from an **existing skill document**. They connect—stabilize the skill, compile once, patch with traces—rather than searching a fresh workflow every task.

## Closing

Skills package specialized knowledge for reuse; ReAct interleaves reasoning and acting. After you stack them, the gap is often in the middle: **control flow stated in the clauses is still re-inferred every step**. HEXIS turns that into a compilation problem—knowledge stays in-state, flow lives in an extended FSM; incremental compilation uses checks and full accepted-set replay for regressability. Empirically: **+16.2pp** average vs Skill + ReAct, and a **38.4–88.9%** execution-token cut with Qwen3.8-27B.[1]

For readers coming from progressive disclosure / SkillDelta, mark HEXIS as the **execution layer** on the same skill chain. For readers building long harnesses ([grow the harness](/blog/grow-the-harness-not-the-context/), [SpecHarness](/blog/specharness-spec-holds-the-pen/)), it offers a concrete compile path **from an existing skill document**—not another memory dump or another fragile searched workflow.

## References

[1] WorldBuilder013, Minghao Li. *HEXIS: Compiling Agent Skills into Extended Finite State Machines*. arXiv:2609.30123v2, 2026. [https://arxiv.org/abs/2609.30123](https://arxiv.org/abs/2609.30123) · [HTML](https://arxiv.org/html/2609.30123v2)
