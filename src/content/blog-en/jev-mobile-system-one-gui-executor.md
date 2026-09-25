---
title: "Jev-Mobile: Low-Frequency VLM Goals, High-Frequency Typed Decisions on Live Accessibility-Tree Candidates"
description: "A deep read of arXiv:2609.30186 Jev-Mobile—moving Jev from judge/memory into an Android GUI executor—with checked AndroidWorld numbers (79% success; −32.7% time and −73.4% API cost on successful trajectories vs step-wise VLM) and a reusable VLM×typed-executor checklist."
pubDate: 2026-09-25T00:00:00+08:00
author: "Remy"
tags: ["jev", "ai-agents", "agent-harness", "System One", "VLM", "mobile"]
lang: "en"
---

Every tap a mobile agent takes can cost another vision–language model (VLM) round for planning and grounding. Latency and API spend then grow with gesture count. Screenshots show icons; accessibility trees expose clickable controls and field state—the two channels are not equivalent, and neither answers when a local controller should hand control back.

In [arXiv:2609.30186](https://arxiv.org/abs/2609.30186), Linghua Zhang introduces **Jev-Mobile**, which splits that path: **a low-frequency VLM sets local goals; a high-frequency typed decision model (Jev) repeatedly selects actions among candidates built from the live accessibility tree.** One VLM delegation can cover several GUI steps; each step still binds to a freshly observed tree rather than a model-written post-delegation summary. On the full AndroidWorld suite, success stays close to SeeAct-V, while successful trajectories show clearly lower end-to-end time and model API cost than a step-wise VLM baseline.[1]

This site has already covered [wiring Jev into Claude Code](/blog/jev-claude-code-10x-and-25-lines/), [ContractNLI cases where similar mean scores can still flip individual decisions](/blog/jev-vs-llm-contractnli-same-scores-different-decisions/), [Jev-Mem’s memory control plane](/blog/jev-mem-system-one-agentic-memory/), and [grow the harness, not the context](/blog/grow-the-harness-not-the-context/). Those posts are about the decision layer, memory control, and harness division of labor. This one moves to a **mobile GUI executor**: what the same “structured, bounded-output” System-One intuition looks like on an Android touch loop; which paper numbers you can check; and why this continues the same long-horizon Jev line on the site.

Naming boundary first: **Jev-Mobile is a research system that uses a typed Decisions service as a GUI execution model.** The paper describes a TypeSafe-style typed decision interface. **Do not** read that as an official vendor product line unless TypeSafe says so.[1][2]

## The problem: why paying a VLM for every tap gets expensive

Benchmarks such as AndroidWorld, Mobile-Bench, and SPA-Bench require agents to ground actions on real or simulated devices and verify outcomes.[1][3] A common loop feeds the current screenshot (sometimes plus a tree) to a VLM, which emits the next click coordinate or control description, then re-observes—**planning and grounding at nearly the same frequency.**

That loop is easy to implement; the bill structure is hard:

1. **Latency multiplies.** Every step pays another large-model inference; long multi-app, multi-field trajectories get dragged by execution-model API time.
2. **Cost tracks gesture count.** On successful trajectories, step-wise VLM shows high executor time and all-role API spend—Table 1 reports mean executor time 94.30 s and mean model API cost $0.273694 for step-wise VLM.[1]
3. **Control prose crowds observation.** When the model must both understand the task and pick controls on noisy trees/screenshots, prompts pack strategy talk and pixel description together, squeezing the context that should hold “what the screen is now”—the same pressure Growing Harness criticizes when control occupies evidence room.[4]

A subtler cost is **error shapes that are hard to regress.** Free-text actions resist type checks; stale bindings often look like “confident” model output. Program-generated IDs at least separate “well-formed but wrong” from “not executable”—coverage / selection / handoff diagnosis depends on that observability.[1]

Screenshot versus accessibility tree is not a sloganized either/or:

- **Screenshot:** can show icons missing from the tree and unlabeled graphical buttons; pure visual grounding (SeeAct-V-style) can take this path.
- **Tree:** can expose clickable parents, enabled/disabled state, bounds, and text/description/hint; suited to program enumeration of executable candidates rather than free invention of coordinates.

Neither automatically answers **handoff**: when a local goal is done, and when control should return BLOCKED so the VLM can rewrite the goal. Jev-Mobile therefore measures **candidate coverage, selection, and handoff** separately from final task success—AndroidWorld’s terminal evaluator scores success independently; trace labels diagnose failures without replacing that score.[1]

The opening problem compresses to one line: in GUI agents, **seeing ≠ executable, and executable ≠ ready to hand back.** Jev-Mobile’s design choice is: seeing stays with the VLM (it reads screenshot and tree); executability goes to program + typed selection; handoff is an explicit DONE/BLOCKED signal—not a model prose self-declaration that the local step is “complete.”[1]

## Method: delegation state machine + live-tree candidates + typed chaining

### Control flow: delegate / finish / blocked

At delegation \(k\), the VLM reads instruction \(u\), the current screenshot and tree, and a program-built history of actions **actually submitted to the device**, grouped by earlier local goals. One call emits:

- \(d_k \in \{\texttt{delegate},\texttt{finish},\texttt{blocked}\}\)
- a local goal \(g_k\) when delegating
- optional exact text values \(v_k\) (for example, a meeting time copied from a note into Calendar)

**It does not produce a post-delegation summary.** Jev may run several atomic actions under \(g_k\) without another VLM call. DONE returns control for the next goal; BLOCKED requests interpretation or reports insufficient actions. Neither DONE nor BLOCKED equals overall task success—after the VLM emits finish, AndroidWorld independently scores the terminal device state.[1]

Many frameworks ask the model to summarize a sub-policy; Jev-Mobile deliberately does not. Handoff gives the VLM the current observation plus grouped real action history—blocking summary hallucination from state alignment, at the cost of compaction and forcing progress inference from the action sequence.[1]

The paper’s calendar example is control-flow illustration, not a measured outcome: the VLM supplies the exact time string; Jev picks fields/Save from candidates. Image-only notes or tree-missing controls yield BLOCKED; the first version **cannot** synthesize coordinates. Semantic extraction stays with the VLM; labeled navigation goes to typed chaining.[1]

### Candidates: deterministic generation from the current raw tree

Candidate set \(C_t = f(T_t, z_t, v_k)\) is built by traversing raw tree nodes, including clickable parents. Visible, enabled nodes with valid bounds can yield click, long-press, scroll, or focus according to explicit flags. Exact text in \(v_k\) may yield an input action for a focused field. Back, Home, Enter, and Open app are added when supported by observable device state and the shared action contract. Missing flags stay unknown; invisible, disabled, or invalid-bound nodes yield nothing. The current input tool rejects unsupported non-ASCII text.[1]

Each candidate binds a local ID to an action, node or region, and arguments. Short labels take the first available of text / description / hint / resource name / class, plus node index. The complete raw tree still supplies other metadata; Jev receives short labels plus textual tree—not a learned control embedding.[1]

Before execution, candidates are checked against a fresh observation; after one action the program rebuilds \(C_{t+1}\) and invalidates old IDs. Ambiguous non-idempotent responses trigger inspection, not blind resubmission—otherwise selection errors tangle with UI change, and uncertain taps become repeated destructive writes.[1]

The raw tree is **not** compressed into a learned semantic graph. Long noisy trees remain a failure mode. The guarantee is narrow: a selected candidate is executable for that observation. Re-observation prevents silent rebinding after the interface changes.[1]

Unlike AppAgent / AutoDroid / UICompass-style maps, Jev-Mobile **regenerates live-tree candidates each step with no cross-task map.** Missing targets are coverage failures, not stale-map retrieval errors—lower maintenance cost, capability pinned to tree quality.[1]

### Typed local decision and event ledger

Each Jev request is one typed choice: criteria map current candidate IDs, DONE, and BLOCKED to descriptions; state holds \(g_k\), observation ID, textual tree, and the current delegation’s action history. The adapter validates type and ID before execution. The output space is constrained; **correctness is not guaranteed**—the same reminder as this site’s ContractNLI post: structured outputs cut format and branching cost, not automatic truth.[1][5]

Each submitted step records chosen ID, actual action parameters, execution status, before/after observation IDs, and a deterministic change description. On handoff the VLM receives the **current** screenshot/tree and grouped, task-local action history—not old screenshots, old raw trees, predicted actions, or model-written summaries. A stale selection rejected before submission is absent from that history. If older entries exceed the character limit, the program replaces them with goal, step count, and handoff reason, and records omitted groups. **No learned router and no cross-task memory.**[1]

Episode budgets cover wall time, actions, calls, waits, and retries; invalid outputs and stale IDs stay in the ledger. Tree-missing visual targets have no coordinate fallback—the VLM can rewrite goals but may still fail. No new training, hierarchy repair, semantic field binding, or completion predicate: omissions surface as coverage/handoff failures, not silent tree repair.[1]

**Local** means **decision scope**, not on-device inference. Jev is a remote typed Decisions service; its own request latency can offset some VLM-call savings—read efficiency end-to-end.[1]

## AndroidWorld numbers: Table 1 only

Evaluation uses the **full AndroidWorld** task suite with its task initialization and terminal evaluators.[1][3] The comparison contains only three systems. They share the general VLM **Qwen3.8-Max** (OpenRouter ID `qwen/qwen3.8-max-0902`) but keep their own execution mechanisms:

| System | Who chooses each step |
| --- | --- |
| Step-wise VLM | The same general VLM picks each action from the current observation and history |
| SeeAct-V | Same general VLM for step-wise decisions; **UI-TARS-1.5-7B** grounds the target (disclosed substitute for UGround in the published controller) |
| Jev-Mobile | General VLM sets local goals; Jev selects live-tree candidates until control returns; handoff mode `jev_action_history`, no generated post-delegation summary |

Outcomes therefore characterize **complete systems**, not an ablation that isolates Jev alone. SeeAct-V’s grounder is also not the original UGround configuration—the paper discloses the substitution in the experiment design; do not treat Table 1 as directly comparable to published UGround numbers.[1]

Table 1 (success over all evaluated instances; time and dollars over the successful-trajectory subset):

| Metric | Step-wise VLM | SeeAct-V | Jev-Mobile |
| --- | ---: | ---: | ---: |
| Full-task success rate | 0.84 | 0.78 | **0.79** |
| Mean total time per success (s) | 197.21 | 162.63 | **132.67** |
| Mean executor time per success (s) | 94.30 | 12.37 | **5.16** |
| Executor cost, successful trajectories summed (USD) | 0.694774 | 0.030579 | 0.013091 |
| Mean model API cost per success (USD) | 0.273694 | 0.193207 | **0.072744** |

Align with the paper’s prose:

- **Success:** Jev-Mobile **79%**, SeeAct-V **78%**, step-wise VLM **84%**. Five points below step-wise VLM; close to SeeAct-V.[1]
- **Versus step-wise VLM (successful trajectories):** mean end-to-end time 132.67 vs 197.21 (**−32.7%**); mean model API cost $0.072744 vs $0.273694 (**−73.4%**); execution-model time 5.16 vs 94.30 s (body also notes ~94.5% relative reduction in executor time).[1]
- **Versus SeeAct-V (successful trajectories):** time 132.67 vs 162.63 (**−18.4%**); cost $0.072744 vs $0.193207.[1]

Accounting for secondary citation: executor time counts Qwen / UI-TARS / Jev respectively; the summed executor-cost row is a **cohort sum**, not a unit price; mean model API cost averages **all model roles** per success. Time and cost are **conditional on success**—with a lower success rate the success subset may be easier; the paper does not claim difficulty-matched correction.[1]

What these numbers support is specific: **a typed decision model can serve as the execution model inside a VLM-guided mobile GUI agent and substantially cut latency and API cost on successful trajectories.** They do **not** support “already beats step-wise VLM on success,” nor “Jev alone contributed X points”—there is no ablation that replaces Jev with a small VLM inside the same delegated workflow.[1]

## Failure diagnosis: coverage / selection / handoff

Separating diagnosis from terminal success matters because GUI-agent errors tangle. Three buckets help you change the system:

1. **Coverage:** an acceptable action is simply not in \(C_t\). Typical causes: target visible only on the screenshot, missing tree nodes or flags, non-ASCII input rejected, device contract not exposing Back/Open app. The first version **cannot** invent coordinates for tree-missing visual targets; such failures show up as repeated BLOCKED returns or rewritten goals that still cannot reach the control.[1]
2. **Selection:** an acceptable candidate is present, but Jev does not pick it. A bounded output space cuts format failures, not semantic correctness; long noisy trees worsen this. Debug first: ambiguous short labels, too many near-duplicate controls, local-goal text that under-specifies constraints.[1]
3. **Handoff:** the local goal is done but DONE never fires, or DONE/BLOCKED fires too early; or after return the VLM fails to emit the next goal or finish. Handoff uses grouped action history, not a model-written post-delegation summary—missing summaries force the VLM to rebuild state from “what actually happened + current screen,” by design, and also expose information loss when history compaction is too aggressive.[1]

Versus screenshot-vs-tree: SeeAct-V-style systems lean on a visual grounder for coverage; Jev-Mobile pins the executable space to program-built tree candidates, so **tree-missing means not executable.** That is an explicit first-version boundary—the experiment measures how far “typed executor + live tree” goes, not a stack that silently adds visual fallback.[1]

Probes: button visible on screenshot but missing from the tree → coverage; right control in candidates but wrong tap → selection; local flow done yet no/early return → handoff. Log those fields; control state should be machine-checkable.[4]

## Boundaries: what Limitations locks down

For review and reproduction, stick to the Limitations section and avoid extrapolation:

1. **AndroidWorld mobile tasks only**; no web. DOM structure, page dynamics, and interaction patterns may demand different things from a decision-model executor.[1]
2. **No ablation replacing Jev with a small VLM inside the same delegated workflow**; efficiency gains cannot be cleanly attributed to “typed decision versus small-VLM executor,” only to the full Jev-Mobile system versus the two comparators.[1]
3. **Depends on the Android accessibility tree**; a visually obvious target absent from the tree cannot become an executable candidate in the current controller.[1]
4. **Present input path supports printable ASCII**; non-ASCII is rejected—Chinese input and special-symbol fields need extra design; do not assume “if the VLM emits a string, input will work.”[1]
5. **Long action histories may require compaction**; compaction replaces entries with goal + step count + handoff reason in program code, not another model-written summary.[1]
6. **No new training, hierarchy repair, semantic field binding, or structured completion predicate**—omissions become coverage/handoff failures rather than silent tree fixes.[1]

Also note the experiment boundary: hidden task parameters and evaluator answers stay outside all online model prompts; terminal reward is computed by the runner only after a VLM finish. The system cannot peek at the answer key, and DONE is only a local control signal—not a scoring shortcut.[1]

## How this sits next to the site’s Jev line

Site contrasts:

- Versus [Jev × Claude Code](/blog/jev-claude-code-10x-and-25-lines/): decision layer into a coding agent vs into a GUI loop. Shared: high-frequency bounded judgments should not default to autoregressive generation. GUI truth is more fragmented (tree, device state, terminal score), so candidates and re-observation are hard dependencies.
- Versus [Jev-Mem](/blog/jev-mem-system-one-agentic-memory/): System One on memory write/read/stop vs on GUI selection/handoff. Same move off the generation hot path; object shifts from memory graph to live-tree candidates.
- Versus [ContractNLI](/blog/jev-vs-llm-contractnli-same-scores-different-decisions/): close aggregate scores can hide different failure modes—grounding vs coverage. Read diagnosis-label distributions, not a one-point gap alone.
- Versus [grow the harness](/blog/grow-the-harness-not-the-context/): candidates, re-observation, compaction, and ledgers are harness code; Jev chooses inside a program-narrowed space.[4]
- Versus the [Jev use-case catalog](/blog/typesafe-jev-use-cases/): product-side decision scenes vs research pushing the same interface into an **executor** role.[2]

Related work cautions that hierarchy or lightweight GUI policies alone are not the novelty claim. The tested question is **typed, per-screen choices over program-generated IDs with explicit VLM handoff.**[1]

## Reusable checklist: building a VLM×typed-executor mobile loop

If you want to reproduce “low-frequency planning + high-frequency execution” in production or experiments, self-check against this list—aligned with the paper’s mechanisms, no invented metrics:

1. **Split three roles.** VLM for goals; program for observation/candidates/ledger; typed executor for ID or DONE/BLOCKED. Do not let the VLM invent coordinates and declare local completion unless you accept hard-to-regress errors.
2. **Bind candidates to the current observation.** Rebuild after every action; no cross-screen ID reuse; log observation IDs.
3. **Structure delegation.** `delegate|finish|blocked` + local goal + exact text; no model post-delegation summary as control truth.
4. **Separate terminal success from diagnosis.** Independent evaluators score tasks; coverage / selection / handoff explain failure; sample early/late handoff even on successes.
5. **State the coverage ceiling.** Refuse tree-missing targets, or add a separately metered visual fallback.
6. **Charset in the contract.** ASCII-only means the VLM must not delegate non-ASCII; expand tools before expanding goals for Chinese input.
7. **Auditable compaction.** Record omitted groups; hand back submitted actions only; spot-check whether the VLM can still restate progress.
8. **Say what comparisons share.** Shared VLM + distinct executors ⇒ system comparison only; attributing Jev needs a same-workflow swap. Disclose grounder substitutions.
9. **Budgets in the ledger.** Separate executor time from all-role model cost; explain “faster” as fewer VLM calls vs shorter device waits.
10. **Naming boundary.** Distinguish research systems from commercial product lines—no invented “Jev-Mobile” SKU.
11. **Non-idempotent actions.** Validate before submit; inspect ambiguous responses; distinguish never-submitted stale selections from submitted failures.
12. **Ask which steps leave step-wise VLM.** Labeled navigation and known-string input → typed loop; image reading and tree-missing icons → VLM or visual grounder. Write the split into the design doc.

## Closing

Jev-Mobile pushes a familiar site claim one step further: Jev is not only a judge or memory controller; it can also be a **high-frequency execution model for mobile GUIs.** Mechanically, it pins the executable space to the accessibility tree, uses re-observation to block stale bindings, and forces summary-free action-history handoff so the VLM must look at what actually happened. On full AndroidWorld it reaches 79% success, close to SeeAct-V; on successful trajectories it cuts about one-third of wall time and about three-quarters of model API cost versus step-wise VLM—at the cost of five success points and no path today for tree-missing visual targets.[1]

If you are designing a phone agent, the more reusable move is not “swap in a stronger VLM” first, but: **which steps are already stable enough to leave the step-wise VLM hot path and go to program candidates + typed selection.** That is the same engineering question as Growing Harness and Jev-Mem.

## References

1. Linghua Zhang. *Jev-Mobile: Jev as an Executor for Mobile GUI Agents*. arXiv:2609.30186, 2026. https://arxiv.org/abs/2609.30186
2. TypeSafe / Jev use cases (site catalog): https://redreamality.com/blog/typesafe-jev-use-cases/
3. Christopher Rawles et al. *AndroidWorld: A Dynamic Benchmarking Environment for Autonomous Agents*. ICLR 2025. https://arxiv.org/abs/2405.14573
4. Site: Grow the harness, not the context. https://redreamality.com/blog/grow-the-harness-not-the-context/
5. Site: Similar means, different decisions (ContractNLI). https://redreamality.com/blog/jev-vs-llm-contractnli-same-scores-different-decisions/
6. Site: Don’t default memory control to an autoregressive LLM (Jev-Mem). https://redreamality.com/blog/jev-mem-system-one-agentic-memory/
7. Site: Jev × Claude Code. https://redreamality.com/blog/jev-claude-code-10x-and-25-lines/
8. Boyuan Gou et al. *Navigating the Digital World as Humans Do: Universal Visual Grounding for GUI Agents* (UGround / SeeAct-V context). ICLR 2025. https://arxiv.org/abs/2410.05243
9. Yujia Qin et al. *UI-TARS: Pioneering Automated GUI Interaction with Native Agents*. arXiv:2501.12326. https://arxiv.org/abs/2501.12326
