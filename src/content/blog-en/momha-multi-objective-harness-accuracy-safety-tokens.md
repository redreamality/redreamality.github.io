---
title: "MoMHa: Optimizing LLM Harnesses for Accuracy, Safety, and Tokens"
description: "Reading Adobe Research arXiv:2609.30967 MoMHa: treat the LLM harness as a three-objective search surface over accuracy, behavioural safety, and tokens. A single-phase joint reward beats ten baselines and a two-phase ablation (synthetic J=0.482, real-world J=0.461, U-SafeBench 0.781, 95 fewer tokens/example than two-phase)."
pubDate: 2026-10-02T10:40:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "developer-tools"]
lang: "en"
---

A harness that answers correctly but never refuses an unsafe request, or that gets the right answer while burning an order of magnitude more tokens than a competitor, “wins” on accuracy and still fails as a deployed system. Subhojyoti Mukherjee and Md Mehrab Tanjim (Adobe Research) turn that observation into an evaluation protocol in [arXiv:2609.30967](https://arxiv.org/abs/2609.30967) (*[MoMHa: Multi-Objective Optimization of LLM Harnesses over Accuracy, Safety, and Tokens](https://arxiv.org/html/2609.30967)*, preprint dated 2026-09-25). The Python code around the model—prompt construction, call routing, output parsing, multi-turn orchestration—is a first-class design surface whose quality is inherently multi-objective.[1]

The system is **Meta-Harness**; the headline method is **MoMHa**: an agentic proposer (Claude Code) with full filesystem access sees accuracy, behavioural safety, and token cost in one search phase and ranks candidates with a joint reward. Against a two-phase “accuracy then tokens” ablation, scalar-only feedback, and accuracy-only baselines, joint search leads on both the synthetic and real-world tracks; the U-SafeBench behavioural safety composite reaches **0.781**, and MoMHa uses **95** fewer tokens per example than the two-phase alternative. The authors state they will release harness code, evaluation infrastructure, and cross-model logs—no public repository URL was available when this post was written, so we say “authors plan to release” below.[1]

Site crosslinks already cover routing and billing ([control the harness / cost](/blog/control-the-harness-control-the-cost/)), counterfactual evolution ([Bad Genius](/blog/bad-genius-counterfactual-harness-evolution/)), outer OS ([ECC](/blog/ecc-agent-harness-optimization/)), and waste patterns ([cost-inefficient behaviours](/blog/coding-agents-cost-inefficient-behaviors/)). MoMHa fills another gap: **do not collapse the search objective into a single scalar**. Context load order is a separate problem—see [Progressive Disclosure](/blog/progressive-disclosure-agent-skills/); this post is about how you search and what feedback that search gets.[2]

## A harness is not weights, and scalar accuracy is not enough

Downstream performance is not only about model weights. The paper defines a harness as a Python class that wraps an LLM client and processes one example at a time via `run(self, example: dict) -> dict`, issuing one or more model calls and returning a dict with at least a `"prediction"` key; the constructor signature is fixed as `__init__(self, client, config=None)`. Each domain has a search set \(\mathcal{D}_{\mathrm{search}}\) of about 50 examples visible to the proposer, and a held-out test set of another 50 hidden from the proposer for final scoring. Formally the goal is to maximize mean domain reward over the search set in the space of valid harnesses \(\mathcal{H}\)—but the reward is no longer “correct or not.”[1]

That is a different layer from “change weights” or “only edit prompt text.” APE (Zhou et al., 2023), OPRO (Yang et al., 2024), DSPy (Khattab et al., 2024), MIPROv2, TextGrad, and GEPA mostly tune prompts, demonstrations, or natural-language gradients **inside a fixed harness skeleton**. Control flow—how many hops, whether to verify, whether to cap a fix loop—is not in the search space. Another line, **MH** (Lee et al., 2026), already rewrites full Python harnesses via search, but still optimizes accuracy only. AutoHarness (**AH**, Lou et al., 2026) also emits full Python, likewise single-objective, with no safety signal and no Pareto pool. MoMHa’s claim is: once deployment must care about safety and cost together, **both the search space and the feedback axes have to expand**—otherwise you are polishing a scalar you will have to hand-cut later.[1]

The paper’s counterexamples for a “good harness” are blunt: correct answers that never refuse unsafe requests; correct answers that spend an order of magnitude more tokens than a rival. Real deployments trade off three axes at once. Prior automatic prompt optimization and DSPy-style program synthesis already showed that programmatic search over interaction patterns yields consistent accuracy gains; they almost always collapse feedback into a scalar and leave safety and tokens mostly absent. MoMHa does not deny that line of work; it says **wiring the same “search executable programs” idea to three objectives changes the outcome**.[1]

In one line of site narrative: cost posts track defaults and expensive trajectory actions; Bad Genius tracks counterfactual evolution; MoMHa tracks **the objective and feedback protocol while you search**. Wrong objective means harder search only digs deeper into the scalar-accuracy basin.

## Meta-Harness: propose → evaluate → log

**Meta-Harness** runs an iterative propose-evaluate-log loop (Algorithm 1). Each round the proposer inspects the filesystem, diagnoses failures, and writes a new harness candidate; the evaluator runs it on the search set and logs per-example scores and traces; the logger writes machine-readable artifacts meant for `grep` / `cat`. Each domain sees about **∼100** harness evaluations (budget breakdown in §4.1).[1]

### What the proposer can see

The proposer is Claude Code with filesystem access to four classes of artifacts: (a) prior candidate sources under `domains/<d>/harnesses/candidate_*.py`; (b) per-run products—`scores.json` (per-example scores), `traces.jsonl` (execution traces), `meta.json` (model / parent / timestamp), `summary.md`; (c) the search set `data/search_set.jsonl`; (d) CLIs: `list` / `top` / `pareto` / `diff` / `show`. Median reads are about **82** files per iteration—structured rewrites against diffs, traces, and per-axis scores, not one total. Search is more proposer-API-heavy than prompt-only baselines, yet Appendix N.1 puts total token cost near APE and below 2-phase and DSPy.[1]

The prompt is assembled, not monolithic:

1. a **base skill** (plus `proposer_token_skill.md` for joint search);
2. a **per-domain skill** (`proposer_<domain>.md`): strategy library (draft-verify, subject-aware routing, verification cascades), answer-normalization recipes, common failure modes from MH runs;
3. a **per-domain safety skill** (`safety_<domain>.md`): import whitelists and output-format constraints at the domain’s risk level (strict / minimal / light).

Shared infrastructure covers all seventeen domains; most change lives in under-**500**-line per-domain files. Dropping piece (3) yields **MoMHa-ns**. Per-domain skills cut cold-start rounds spent rediscovering idioms (SQL DDL pruning, dual-path fact verification, and so on).[1]

### Evaluator and logger

The evaluator swaps reward functions by domain instead of one global exact match:

| Domain type | Reward (paper setup) |
| --- | --- |
| Text classification / MCQ | Exact match on label or option letter |
| Math reasoning | Exact match with numeric normalization |
| Agentic coding | Syntax validity + test-case execution |
| Fact verification | Exact match on stance label |
| NER | Entity-level F1 with type matching |
| SQL generation | Query execution + result comparison |
| User-specific safety (U-SafeBench-derived) | \(0.5\times\) refuse-unsafe \(+0.5\times\) comply-helpful |

Safety domains use a symmetric LLM-as-judge: responses are refuse / comply / partial (half credit). Symmetry blocks the trivial “refuse everything” policy—refusal without helpfulness on matched benign instructions cannot maximize reward. The logger ensures every evaluation leaves filesystem-readable artifacts for the next proposer round rather than a verbal summary.[1]

### Three gates for executable-code search (mechanism only)

Because the proposer emits executable Python, safety is first-class in the search stack, not a post-hoc eval patch. Section 3.3 describes three layers:

- **Layer 1: AST-Guard**—parse code as a Python AST before execution against a domain-parameterized banned-symbol list (dangerous imports; `exec` / `eval` / `compile` / `__import__` / `open`; etc.), tightened or relaxed by domain risk.
- **Layer 2: per-domain safety skill**—whitelists and output constraints; ablations show this is one of the largest levers on the safety axis.
- **Layer 3: sandbox**—per-call timeouts (paper examples at the 30-second scale), resource and permission limits.

Division of labour: static gate + domain skill + runtime sandbox. Architecture and evaluation only here—**no** bypass or exploit steps. Tighten to your threat model; the paper’s banned list is not a safety certificate.[1]

## MoMHa: why single-phase joint reward beats two-phase

With an agentic proposer, the “natural” multi-objective recipe is staged: first push accuracy under safety constraints, then compress tokens while holding accuracy roughly fixed. The paper implements that path as **2-phase** and treats it as the strongest ablation. Headline **MoMHa** instead exposes all three axes **in one phase** and ranks search with a scalarized utility:

\[
R(h)=\mathrm{accuracy}(h)+\lambda_{s}\,\mathrm{safety}(h)-\lambda_{t}\,\mathrm{tokens}(h)
\]

with \(\lambda_s=1.0\) and \(\lambda_t\) normalized so a **1k**-token reduction is worth about **1** accuracy point. The crucial design choice: the proposer is **not** compressed down to scalar \(R\) alone—it reads `accuracy` / `safety_score` / `tokens_used` in `scores.json` plus the full trace; **only ranking** is scalarized. That lets it see *which* axis an edit moves, and prefer structural trades such as replacing two redundant draft-verify calls with one confidence-gated verifier—not merely shortening the system prompt by a few words on a frozen skeleton.[1]

### Token savings emerge; they are not a second-phase job

The base skill asks the proposer, in the same iteration, to (a) isolate the 20% of examples consuming 80% of the budget via `tokens_used`; (b) walk `traces.jsonl` to find the dominant sink in a multi-call pipeline—system prompt, CoT completion, verification pass, or fix loop; (c) propose a targeted structural rewrite: skip verification above a confidence threshold, prune SQL DDL to relevant tables, cap fix-loop iterations after a first improvement, replace dual draft-verify on fact checking with a single confidence-gated verdict. Because diagnosis shares the iteration with accuracy and safety feedback, the search can grow structures a two-phase pipeline cannot express: once Phase 1 freezes dual draft-verify into source, Phase 2 usually only shortens text inside that skeleton and rarely invents a single confidence-gated verifier. The paper calls this the core advantage of the joint formulation over staged optimization.[1]

### Ablations: joint, traces, and the safety skill

Among all **15** variants, MoMHa attains the highest 3D hypervolume \(\mathrm{HV}=0.481\); accuracy-only MH scores \(0.362\) and contributes zero unique Pareto volume once safety and efficiency become axes—points that looked “accurate” under a single objective do not add non-dominated volume in 3D. Versus 2-phase, MoMHa is about **+2.7** overall points at **95** fewer tokens per example, and wins **7** of **10** domains on joint metric \(J\). Mean accuracy composite is about **0.611** vs **0.584** for two-phase.[1]

Replacing per-example traces with scalar scores (**MoMHa-scalar**) drops overall mean from **0.611** to **0.604** and safety from **0.781** to **0.754**—small but consistent: the proposer extracts causal signal from traces (which call failed, which verification was redundant), not only total scores. Removing the per-domain safety skill (**MoMHa-ns**) drops safety from **0.781** to **0.716** while capability accuracy stays largely unchanged—the skill pushes the safety axis rather than trading capability for points. All ten external baselines score **below 0.75** on the U-SafeBench composite. Relative to MH: joint mean rises from **0.305** to **0.482** (**+0.177**), behavioural safety from **0.569** to **0.781** (**+21.2** pp)—the measured increment of moving from accuracy-only harness rewriting to explicit multi-objective search.[1]

Three slogans suffice: **joint > two-phase** because structure is not frozen yet; **traces > pure scalars** because you can locate which call; **do not drop the safety skill** because capability scores will not reveal the gap that shows up on the behavioural composite.

## Numbers: synthetic, real-world, safety, tokens

Evaluation spans **seventeen domains**. Synthetic track (primary; also described as ten per-domain columns): seven capability suites—text classification, math reasoning, agentic coding, MCQ, fact verification, NER, SQL—plus three U-SafeBench-derived user-specific safety domains (illegal-activity QA, autonomous physical harm, autonomous mental harm). Each capability domain has 100 LLM-generated examples (verified by a second model), split 50/50 search/test. Real-world track (generalization check): HumanEval, MBPP, Spider, FEVER, MMLU-Pro, LawBench, NuminaMath. Models: a **12**-model fleet across **four** families (Claude / GPT / Gemini / DeepSeek) and multiple tiers (Table 1, from Haiku / Flash-Lite through Opus / GPT-5.x). Harnesses are discovered on **Claude Haiku 4.5** and evaluated **without source modification** on the full fleet.[1]

Against ten baselines (CoT, APE, OPRO, DSPy, MIPROv2, TextGrad, GEPA, Rand, plus accuracy-only MH / AH and related), the headline table of joint mean \(J\) (abstract, §1, Key findings, §4) is:[1]

| Track / metric | MoMHa | Comparison |
| --- | --- | --- |
| Synthetic joint mean \(J\) | **0.482** | Ten baselines **0.198–0.422**; nearest TextGrad **0.422** (+0.060 gap) |
| Synthetic per-domain columns | Wins **7/10** | — |
| Real-world joint mean \(J\) | **0.461** | Strongest baseline DSPy **0.377** (+0.084); range about **0.084–0.377** |
| Real-world per-domain columns | Wins **5/7** | **Zero** extra search cost on unseen benchmarks |
| U-SafeBench behavioural safety composite | **0.781** | MH **0.569** (+21.2pp); nearest external TextGrad **0.747**; no external ≥0.75 |
| Joint mean vs MH | **0.482** | MH **0.305** (+0.177) |
| Mean capability accuracy (seven skill domains) | **0.539** | MH **0.478** (+6.1pp); DSPy raw accuracy **0.542** but **2229** tokens/example vs MoMHa **672** |
| vs two-phase | +2.7 overall points | **95** fewer tokens per example |
| 3D hypervolume HV | **0.481** | MH **0.362** (unique Pareto volume → 0) |

Read \(J\), not raw accuracy alone. DSPy can edge capability accuracy (0.542 vs 0.539) while spending more than three times the tokens per example, so joint score loses—the live demonstration that a scalar accuracy winner need not be a multi-objective winner. Synthetic MoMHa is about **+6.0** over TextGrad; real-world about **+7.9** over DSPy (Key findings). “Zero extra search” on the real-world track matters: strategies are searched on synthetic capability domains and transferred to public benchmarks without re-searching each target—this measures strategy transfer, not “another hundred rounds on every public set.”[1]

### How to read \(J\) and hypervolume

\(J\) summarizes three axes; HV measures Pareto-front volume in accuracy–safety–efficiency space. High HV is not “first on every axis.” MH’s HV \(0.362\) with zero unique volume means accuracy-only points stop adding non-dominated regions once other axes open. MoMHa’s HV \(0.481\) (best of 15) pairs with 7/10 and 5/7 column wins: frontier geometry and table leadership tell one story. Spread wins plus acknowledged losses (including four cross-model cells to DSPy/GEPA) are useful for a “when not to force a thick harness” table.[1]

### Cross-model: 8/12 transfer; 4/12 show the failure mode

Strategies found on a Haiku-class proposer-evaluator loop transfer without retraining to **8 of 12** target models. The remaining four split cleanly: GPT-5-mini, o4-mini, and DeepSeek-R1 prefer DSPy’s terser prompts—these models already emit long internal CoT, so extra harness tokens are poor value; GPT-5.4 goes to GEPA. Despite exceptions, MoMHa’s mean cross-model joint score \(J=0.434\) still leads all baselines, and accuracy ordering is largely stable across Anthropic / OpenAI / Google / DeepSeek families. Limitations note degraded transfer on reasoning-heavy models: when long internal CoT barely “listens” to harness instructions, outer token optimization has less room. Product implication: treat cross-model acceptance as a first-class test, and register “short-prompt baselines locally win” as a known failure mode rather than a broken search.[1]

## What to copy into production (checklist, not a repro recipe)

You need not rebuild Meta-Harness wholesale to take mechanism-level habits—same family of “outer code decides bill and risk” as [cost-inefficient behaviours](/blog/coding-agents-cost-inefficient-behaviors/), [control the harness / cost](/blog/control-the-harness-control-the-cost/), and [ECC](/blog/ecc-agent-harness-optimization/):[2]

1. **Put safety and tokens into the search / regression objective**, not only as post-ship guardrails. MoMHa-ns shows capability can barely move while safety drops; late patches rarely recover structural trades the search never saw.
2. **Show optimizers (human or agent) per-axis scores plus per-example traces**, not one total. MoMHa-scalar’s drop is small but directional: causal signal lives in traces—which verification, which schema slice, which fix-loop round.
3. **Distrust “accuracy first, then save” as the default.** Dual verify, fat schemas, and unbounded fix loops frozen in Phase 1 are hard to undo in Phase 2; joint search can grow confidence-gated single-pass verifiers in the same round. If org process forces stages, at least keep a window where control flow may still change—not only copy.
4. **Maintain per-domain skills and safety skills separately.** Under-500-line per-domain files buy seventeen-domain reuse and fewer cold-start rediscovery rounds. This complements [Progressive Disclosure](/blog/progressive-disclosure-agent-skills/): one manages load budget; the other manages how domain knowledge and safety constraints enter the search prompt.[3]
5. **Test cross-model transfer as first-class**, not a surprise. Search on a small-model loop and validate on a fleet is a sane default; expect short-prompt baselines to locally beat thick harnesses on long-internal-CoT reasoners.
6. **Executable harness search needs a static gate plus sandbox.** AST-Guard / whitelists / timeouts are search infrastructure, not optional décor; follow §3.3 and tighten to your threat model.
7. **Track joint metrics and hypervolume**, not only accuracy leaderboards. DSPy’s 0.542 vs MoMHa’s 0.539 looks like “DSPy wins” without a token column; with \(J\) and tokens/example the conclusion flips.

Versus [Bad Genius](/blog/bad-genius-counterfactual-harness-evolution/): counterfactual signal vs joint objective/feedback—complementary. Counterfactual edits under scalar accuracy still slide toward “accurate but unsafe / accurate but ruinously expensive.”[2]

## Limits: what the paper does not claim

Synthetic search sets are LLM-generated at 50 examples per domain; real-world transfers on seven public benchmarks close some external-validity gap, but do not read synthetic \(J\) as absolute level on arbitrary production tasks. ∼100 proposer API calls per domain is a real budget; the appendix calls total cost comparable to APE and lower than 2-phase and DSPy—still convert at your own prices. Transfer degrades on reasoning-heavy models such as GPT-5-mini, o4-mini, and DeepSeek-R1. Safety numbers come from U-SafeBench-derived user-specific domains and the paper’s behavioural composite (symmetric refuse × help)—**not** a general red-team, exploit, or full content-safety suite. This post is mechanism and evaluation only. Authors plan to release harness sources, search logs, per-example traces, scoring artifacts, and cross-model evaluation JSONs; treat the arXiv text as canonical until a repo is announced.[1]

Relative to MH, MoMHa is an explicit multi-objective extension; relative to prompt optimizers, it rewrites control flow rather than copy alone; relative to this site’s harness/cost series, it sits at the objective-and-feedback layer. Future work mentions SWE-Bench / LiveCodeBench, richer objectives (latency, calibration, monetary cost), proposer ensembles, and online refinement on production traffic—none of those numbers are here; we do not extrapolate.[1]

## Takeaway

MoMHa is not another “accuracy up a few points” prompt trick. It argues that **once the harness is a searchable program, the objective must admit that deployment is three-dimensional**. Single-phase joint reward beats two-phase not because the scalar formula is prettier, but because the proposer can still change structure while reading traces that show which call is both expensive and unsafe, and which verification can be gated away. Synthetic \(J=0.482\), real-world \(0.461\), safety composite \(0.781\), 95 fewer tokens per example than two-phase, HV \(0.481\)—read them together. Drop any axis and you recreate the false winner: accurate but unusable, or accurate but ruinously expensive.[1]

If you maintain outer agent code, the next useful change may not be a larger model. Make the eval panel three columns—accuracy, safety, tokens—so every rewrite answers “which axis moved, and was it worth it?” Next week: log those columns; sample the most expensive 20% of traces and label the sink (system prompt, verification, or fix loop). That is already MoMHa’s diagnostic order—per-axis visibility, structure still editable—before you put a proposer in the loop.

## References

[1] Subhojyoti Mukherjee, Md Mehrab Tanjim. *MoMHa: Multi-Objective Optimization of LLM Harnesses over Accuracy, Safety, and Tokens*. arXiv:2609.30967, 2026. [abs](https://arxiv.org/abs/2609.30967) · [HTML](https://arxiv.org/html/2609.30967)

[2] Site crosslinks: [Control the Harness, Control the Cost](/blog/control-the-harness-control-the-cost/), [cost-inefficient behaviours](/blog/coding-agents-cost-inefficient-behaviors/), [ECC](/blog/ecc-agent-harness-optimization/), [Bad Genius](/blog/bad-genius-counterfactual-harness-evolution/)

[3] [Progressive Disclosure for Agent Skills](/blog/progressive-disclosure-agent-skills/)
