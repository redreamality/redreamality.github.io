---
title: "LLM Parkinsonism: Who Holds Project-Level Stop Authority When Agents Won't Quit"
description: "A deep read of arXiv:2609.30662: naming the agent-loop failure of low-value persistence after the goal is met as LLM Parkinsonism; GEC v0.2 separates proposal from project-level stop authority and cuts ~36% tokens at near-equal success on a matched-candidate benchmark. Mechanisms and a harness checklist."
pubDate: 2026-09-29T10:40:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "agent-loop", "developer-tools"]
lang: "en"
---

Coding-agent bills often get blamed first on model unit prices and cache hit rates. On this site, [Control the Harness, Control the Cost](/blog/control-the-harness-control-the-cost/) covers routing and governance; [three cost-wasting habits](/blog/coding-agents-cost-inefficient-behaviors/) covers subsumed retrieval, similar scripts, and empty retests inside trajectories. Another waste mode looks even more “reasonable”: **the hard goal is already satisfied, yet the loop keeps adding abstractions, edge cases, verification, and repairs to complexity it created**—local engineering stays coherent while the global “should we continue?” decision goes bad.

In preprint [arXiv:2609.30662](https://arxiv.org/abs/2609.30662), Dongsheng Xiao, Zeyuan Wang, Xuzhe Xia, Bo Zhao, and Yankai Cao name this trajectory pattern of **persistent action despite diminishing task-level value** with a **non-clinical** metaphor—**LLM Parkinsonism**—and propose **Global Executive Control (GEC) v0.2**, which separates action generation from project-level control. On a **24,000**-episode matched-candidate benchmark under a common **40,000**-token ceiling: first-candidate baseline hard-goal success **67.42%**, candidate-set local control **96.53%**, GEC **96.57%**. Relative to the candidate-set control, GEC preserved success while cutting mean tokens from **19,782** to **12,574** (**36.4%**) and restricted mean tokens-to-completion at the 40k ceiling (RMTTC₄₀ₖ) from **16,136** to **13,114** (**18.7%**), eliminating measured pre-completion drift (GDR_pre) and sharply reducing gross complexity accretion.[1]

This is a mechanism post, not clinical-analogy explainers. The paper fences the metaphor tightly—quoted below. Read it on the harness stop-authority and token-efficiency line, not as another “agents are verbose” blurb.

## Metaphor bounds: phenomenology only, not pathology

Section 3 is explicit: Parkinsonism here is a **phenomenological analogy** only—no claim of basal-ganglia dysfunction or dopamine pathways in LLMs, and no equating the construct with mere verbosity. What is borrowed is the **trajectory shape** of repetitive action with diminishing amplitude/value that fails to stop, narrowed on purpose to avoid clinical misread. The authors even renamed an exploratory index from “LLM Parkinsonism Index” to **Executive Persistence Index (EPI)** so the metaphor is not mistaken for clinical validation.[1]

Three engineering takeaways:

1. It names a trajectory-level failure mode, not a medical diagnosis.
2. The proximate hypothesis is not “autoregression alone,” but **proposal, scope interpretation, progress assessment, and stopping authority collapsed into one self-conditioned loop**.
3. The prescription is **externalized project-level governance**, not training a model that is better at saying “I’m done.”[1]

## Motivating example: two-node disaster-recovery watchdog

The introduction uses a compact Goal Contract: emit A/B node-down alerts when each node is unavailable; when both are down, both node-level conditions remain observable; on recovery, restore the correct healthy state. An agent may still “cleverly” introduce site-level aggregation—suppress individual alerts when A and B fail together and emit a single SITE DOWN—thereby creating correlation state, timing windows, suppression rules, synthetic tests, new failure modes, and deployment gates, then spending substantial tokens debugging a subsystem **the original goal never required**.[1]

That motivates the paper’s split:

- **Problem-solving intelligence** — how to cut the next stroke.
- **Executive-control intelligence** — whether the stroke remains inside the governed objective, whether an enabling step is causally justified, whether complexity is worth its cost, whether evidence remains valid after later changes, and whether stopping is now rational.[1]

The economic point is immediate: when inference and tools are metered, “eventual success” is not enough. Cost-aware evaluation, long-horizon planning, overthinking, infinite agentic loops, and work on mistaking busyness for progress via self-evaluation sit in the same family; GEC adds **project-level scope, evidence, and stopping**, not token compression alone.[1]

## Four components

The authors formalize LLM Parkinsonism as four pieces:

1. **Goal drift** — actions lose causal linkage to the governed objective yet still execute.
2. **Complexity accretion** — optional layers, self-created edge cases, and maintenance debt keep growing.
3. **Termination failure** — hard goals are met or no feasible path remains, yet the correct terminal state is not entered.
4. **Token-inefficient persistence** — large token spend continues when marginal task value is low.[1]

The main benchmark also separates metrics: pre-completion drift (GDR_pre) vs post-completion overrun (TOR); the primary completion-cost endpoint is all-episode restricted mean RMTTC₄₀ₖ so “conditional time among successes” cannot silently drop failures.[1]

## Systems hypothesis: collapsed executive authority

The thesis is short: **a model that can always propose another reasonable next action is not necessarily a model that knows whether another action is worth taking.** The nearer systems hypothesis: proposal generation, requirement promotion, progress assessment, and stopping authority concentrate in one self-conditioned loop—so the local next step always “makes sense” while global continuation worsens.[1]

GEC therefore does not make “the same loop better at reflecting”; it moves governance out.

## GEC v0.2: separate proposal from project-level control

At diagram level (§7): the model/generator proposes; a **frozen Goal Contract** defines hard/soft objectives and explicit non-goals; **independent scope adjudication** issues a ScopeAssessment per candidate; evidence is state-versioned and can be invalidated by later changes; contract-aligned expected value is scored over a candidate set and the highest net-value approved action is chosen; stopping is a **state-level** decision—not “one bad proposal was rejected, so stop the project.”[1]

Key mechanisms (paper wording):

1. **Candidate-set governance** — each cycle sees multiple candidates (three in the benchmark); a bad action can be rejected while another remains; economic stopping can follow evaluating the continuation set.[1]
2. **Independent scope gate** — explicit non-goals → FORBIDDEN; no causal support → NONE; direct / prerequisite / verification / risk-mitigation / soft links may qualify only above confidence thresholds. **Do not trust `target_criterion` self-reported by the same LLM that proposed the action.**[1]
3. **Action-level reject ≠ project stop** — a single candidate with \(V(a|s) \le \tau\) rejects that action only; economic stop only when hard requirements are complete and no candidate in the governed continuation set has positive net value; unmet hard requirements with no feasible path → `STOP_BLOCKED`; exhausted budget → `STOP_BUDGET`.[1]
4. **Evidence-carrying success** — `STOP_SUCCESS` requires still-valid evidence for every hard criterion; later state changes can void evidence, blocking stale completion certificates.[1]
5. **Externalized amendments** — the executor may propose a contract amendment but **cannot authorize it**; non-goals are executable contract elements, not documentation décor.[1]
6. **No-progress breaker** — the prototype requests global replan after \(k=3\) cycles without hard progress / validated prerequisite / new external evidence; the authors admit the breaker shows no independent efficiency gain on an exogenous candidate stream (replan cannot change future candidates) but retain it for live-agent failure modes.[1]
7. **Deletion-first (conceptual)** — when self-created structure causes the problem, prefer DELETE → SIMPLIFY → FIX → ADD; LPB v0.2 does not quantitatively isolate this principle.[1]

The implementation is a dependency-free Python research prototype; the paper points to [LLM-Parkinsonism-Solutions](https://github.com/DongshengXiao/LLM-Parkinsonism-Solutions).[1]

## LPB v0.2: matched candidates separate “see three” from “govern”

If baseline sees only the first proposal and GEC sees three, a success jump may be best-of-three. LPB v0.2’s key design is **policy-independent exogenous candidate sets**—the same seed pre-generates candidates and stochastic outcomes; baseline, budget-only, candidate-set local control, and GEC face the same opportunity stream; governance may select or reject but cannot force the generator to emit a required action next cycle.[1]

Six synthetic task families: two-node DR watchdog, API release, database migration, CI pipeline, backup/restore verification, reproducible research pipeline. Main experiment: 6 scenarios × 4 policies × 1,000 episodes per cell = **24,000** episodes; hard ceiling 40k tokens; root seed 20260911.[1]

Four conditions:[1]

| Condition | Candidates seen | Independent scope/value governance |
| --- | --- | --- |
| Baseline local loop | First only | None; probabilistic project stop |
| Budget-only | Same order; skip only if budget cannot fit | None |
| Candidate-set local control | Three; generator-declared links + cost tie-break | **No** independent scope / evidence value gate / complexity penalty |
| GEC v0.2 | Three; independent adjudication + contract value | Yes |

The authors stress: LPB is a **mechanism-isolation testbed**, not a prevalence estimator for real models; live-model validation remains necessary.[1]

## Main results: success from candidates, savings from governance

Main table (§9.1; synthetic benchmark, not commercial LLM measurements):[1]

| Metric | Baseline | Budget-only | Candidate-set local | GEC v0.2 |
| --- | --- | --- | --- | --- |
| Hard-goal success | 67.42% | 67.85% | 96.53% | 96.57% |
| Mean total tokens | 32,058 | 32,170 | 19,782 | 12,574 |
| RMTTC₄₀ₖ | 29,024 | 29,021 | 16,136 | 13,114 |
| TOR (post-completion overrun) | 0.1249 | 0.1256 | 0.1967 | **0** |
| GDR_pre | 0.2721 | 0.2718 | 0.1290 | **0** |
| Token Efficiency | 0.0317 | 0.0317 | 0.0589 | 0.0963 |

Interpretation must match the paper: vs first-candidate baseline, GEC +29.15pp success and −60.8% mean tokens; but candidate-set local control already reaches 96.53%, essentially matching GEC—**access to multiple candidates explains most of the success gain**. Relative to that control, GEC’s contribution is efficiency and discipline: mean tokens **−36.4%**, RMTTC₄₀ₖ **−18.7%**, TE about **1.63×**, GDR_pre 0.1290 → 0, gross complexity held low (main-table GEC Gross CAI 0.1228). Zero TOR / zero GDR_pre are largely enforcement consequences of deterministic evidence termination and the default independent scope gate in this setting—validating controller invariants, not a marketing claim of “never drifts.”[1]

Budget sensitivity (§9.2): as ceilings widen, GEC’s success advantage over budget-only grows; log-budget success AUC is **0.467** (GEC) vs **0.167** (budget-only), about **2.79×**. The reading is not that GEC creates capability from nothing, but that it allocates a fixed candidate stream toward causally governed, higher expected-value actions.[1]

## Ablations: what scope authority and the value gate each cut

§9.3 (300 episodes per scenario scale):[1]

| Policy | Success | Mean tokens | GDR_pre | Gross CAI |
| --- | --- | --- | --- | --- |
| Full GEC | 0.9611 | 12,733 | 0 | 0.1243 |
| No independent scope authority | 0.9522 | 14,036 | 0.0716 | 0.3144 |
| No value gate | 0.9600 | 14,500 | 0 | 0.1263 |
| No no-progress breaker | 0.9611 | 12,318 | 0 | 0.1243 |

Removing independent scope authority brings back pre-completion drift and more than doubles gross complexity vs full GEC. Removing the value gate keeps success but adds roughly **1.77k** mean tokens. Removing the no-progress breaker slightly “improves” synthetic efficiency—the authors treat this as **negative evidence**: the breaker targets live failure modes that an exogenous candidate simulator cannot reward.[1]

Governance-overhead sensitivity: charging up to an extra **500** synthetic governance tokens per governed cycle still leaves conclusions favorable; these are model-equivalent stress costs, not calibrated cloud list prices.[1] A beneficial soft-work probe places, after hard criteria are validly complete, a low-cost beneficial soft action and a high-cost low-value soft action—GEC should approve the former, reject the latter, and continue rather than economic-stop from one bad soft candidate.[1]

## What “won’t stop” looks like on-call

Map the four-tuple to symptoms you can see:

| Paper component | Common on-call appearance | Wrong attribution | Better probe |
| --- | --- | --- | --- |
| Goal drift | Starts “helpful” monitoring/aggregation/refactors; PR still cites the original ticket | “Model is too proactive” | Does the action link to a hard criterion or approved prerequisite? |
| Complexity accretion | Tests for optional layers, then fixes for those tests; diff grows, acceptance items do not | “High engineering quality” | Count of self-created files/services; is net complexity only rising? |
| Termination failure | Acceptance already green yet “one more confirmation”; or clearly blocked yet infinite retry | “Being careful” | Did we enter done / good-enough / blocked / budget? |
| Token-inefficient persistence | Bill steepens in the second half while external utility is flat | “Context too long” | Tokens before vs after completion; TOR / tail TE |

ReTest in the cost-habits post is often a thin surface of termination failure: patch unchanged, tests rerun.[2] The Parkinsonism lens asks one more question—**did a detector miss repetition, or should there have been no next step at project level?** Fix both layers.

## Why “please stop” prompts are not the same thing

Teams often patch with system text: “stop when done,” “don’t over-engineer.” Related work places Reflexion-style self-feedback loops in the “powerful but creates a control problem” bucket—local plausibility of the next action does not imply global desirability of continuation.[1]

GEC differs not by harsher wording but by **where authority sits**:

1. Scope adjudication does not trust proposer self-links;
2. Completion depends on external / state-versioned evidence, not the model saying DONE;
3. Contract amendments cannot be self-approved by the executor—isomorphic to the security rule “agents must not self-approve privilege.”

If your stop prompt is still interpreted by the same completion that writes the patch, you shoved stopping authority back into the self-conditioned loop.

## Why a token ceiling alone is not enough

Budget-only success sits next to baseline (~67–68%), so a **hard token ceiling alone does not select high-value work**—low-value actions that still fit still run.[1] The sensitivity table is sharper: at a 12k ceiling, budget-only success is about **6.89%** vs GEC about **54.11%**; only at 40k do they reach ~68.67% / 96.33%.[1]

For platform buyers: treating “give it enough tokens” as governance hurts most in the mid-budget band—money spends, hard goals stay unmet; the governance arm twists the same opportunity stream toward causally linked actions. The paper’s log-budget AUC summarizes efficiency across the whole range instead of one arbitrary threshold.[1]

## Soft objectives and the “forbid everything after done” misread

The beneficial soft-work probe sits after hard criteria are validly complete: the candidate set contains a low-cost beneficial soft action and a high-cost low-value soft action. GEC should approve the former, reject the latter, and continue—not declare economic stop because one bad soft candidate appeared.[1]

That falsifies two product misreads:

1. **“Governance = always stop early”** — what you want is a marginal-value gate, not asceticism.
2. **“Soft goals may silently become hard success”** — soft value is weighted separately (β) and must not quietly merge into hard utility.[1]

When writing Goal Contracts, park “doc polish / extra observability / optional refactors” in the soft column, and define who may promote a soft item to hard mid-flight—promotion itself should be a contract amendment, not agent self-escalation inside the trajectory.

## Noise robustness: degrade gracefully

§8.9 stresses scope false-positive/negative and verifier noise at nominal levels 0, 0.02, 0.05, 0.10. Intent is **graceful degradation**, not calibrating real verifier error rates.[1] Engineering moral: independent adjudicators also err; design for sampled audit and human override rather than assuming “external = always true.” Make scope decisions observable (FORBIDDEN / NONE / link type / confidence) instead of an opaque second model.

## Live validation: do not paste simulation numbers onto a product page

§12 prespecifies paired live experiments: same base model, temperature/reasoning settings, tool surface, Goal Contract, and acceptance criteria under baseline / budget-only / GEC; primary endpoints are externally adjudicated hard-goal success and all-trial restricted completion cost (including non-completions), so conditional completion time cannot drop failures.[1]

Secondaries include conditional tokens among successes, TE, TOR, GDR_pre, complexity, tool calls, wall time, amendment frequency, verifier invalidations, heavy-tail percentiles; inference cost of any independent scope adjudicator or verifier must be included; scope-link decisions should be sample double-coded; when deterministic checks exist, do not let the same proposing/executing LLM solely declare done.[1]

Task sets should include multi-step prerequisites, legitimately beneficial soft improvements, changing goals needing authorized amendments, later writes that invalidate earlier evidence, and cases whose correct outcome is BLOCKED. Model families should include at least one frontier reasoning model and one lower-cost model.[1]

Putting that into an internal experiment design is more responsible than printing 36.4% on a sales page—**36.4% is the mean-token cut vs candidate-set local control on synthetic LPB**.[1]

## How this connects to in-site cost / harness posts

1. **Three cost-wasting habits** — SubRetrv / SimScrpt / ReTest are detectable repeated labor inside trajectories.[2] Parkinsonism is more about **project-level continuation**: the goal is enough, yet layers keep arriving. They often stack: empty retests can be ReTest and a surface of termination failure.
2. **Control the harness, control the cost** — bill responsibility often sits in harness defaults, not “the model is expensive.”[3] GEC explicitly marks stop authority as a harness/governance-layer object instead of hoping the model self-enlightens.
3. **Grow the harness, not the context** — grow recurring control into code.[4] Scope gates, value gates, evidence versioning, and terminal-state enums are exactly the controls to grow into code—not another paragraph of “please stop promptly.”

Unpublished DNS-pause / MoMHa slugs are not linked here. Mechanically, externalized stop/approval is the same family as OpenShell Policy Advisor’s “agents cannot self-approve”—this morning’s OpenShell post is the safety halt rope; this post is the **economic and scope halt rope**.

## Checklist for harness designers

1. **Write and version the Goal Contract.** Hard criteria, soft goals, and explicit non-goals in separate columns; amendments need external authorization; executors may only propose.
2. **Move stop authority off the proposing model.** At minimum: an independent scope checker (rules / second model / formal conditions) plus evidence validation; do not let one completion both write the patch and declare DONE.
3. **Distinguish terminal states.** `done` / `good-enough` (economic stop) / `blocked` / `budget` — “didn’t succeed but keeps trying” should enter blocked, not fake success.
4. **Rejecting an action ≠ stopping the project.** Low value on one candidate rejects that step; project stop asks whether hard requirements are complete and whether any positive-value continuation remains.
5. **Version evidence.** Invalidate completion certificates when relevant state changes; compare to failures that mistake busyness for progress via self-eval.[1]
6. **Measure candidate-set access before crowning governance.** If the treatment arm sees K candidates and the control sees one, add a candidate-set local-control arm first—so best-of-K is not booked as a governance win. That is the methodological core of the paper.[1]
7. **Keep breakers aimed at live failure modes.** No-progress replan may show no synthetic efficiency gain; retain it for live loops, and accept it against live metrics.[1]
8. **Bill governance tokens.** Independent adjudicators and verifiers’ inference must count; the paper’s live protocol requires the same.[1]
9. **Combine with trajectory waste detectors.** ReTest/SubRetrv detectors handle repeated labor; GEC-class governance handles whether there should be another step at all.
10. **Default to deletion-first.** When self-created complexity causes the failure, prefer delete/simplify before stacking fixes—even if the benchmark has not yet isolated the principle quantitatively.[1]

## Limits (the paper’s own honesty)

- Headline numbers come from a **synthetic mechanism benchmark**, not a vendor online A/B; the authors dedicate a section to live-model validation.[1]
- Zero TOR / zero GDR_pre are largely **enforced** by the default independent scope gate and deterministic evidence termination—invariant checks.[1]
- The no-progress breaker lacks independent efficiency evidence on LPB v0.2.[1]
- The metaphor can be misread; a neutral alternative phrase is **agentic executive-control persistence**.[1]

## Closing

The weakness is often not “cannot do,” but **high capability under weak project-level executive control**. An agent can be excellent at answering “what can I do next?” while remaining unreliable at “should I do anything next?” GEC v0.2’s compact rules:

- No governed causal link ⇒ no mandatory action;
- Low value of one action ⇒ reject that action, not the project;
- Hard requirements complete and no positive-value continuation ⇒ economic stop;
- Hard requirements incomplete and no feasible path ⇒ blocked, not success.[1]

For harness designers: put scope, evidence, budget, and stopping into a layer the model cannot reach—the other side of the same control-plane map as this morning’s safety-boundary post.

## Sources

1. Xiao D, Wang Z, Xia X, Zhao B, Cao Y. *LLM Parkinsonism: Executive-Control Failure, Token-Inefficient Persistence, and an Uncertainty-Aware Global Executive Control Architecture for Autonomous Language-Model Agents*. arXiv:2609.30662, 2026-09-25. <https://arxiv.org/abs/2609.30662> · PDF <https://arxiv.org/pdf/2609.30662> · code <https://github.com/DongshengXiao/LLM-Parkinsonism-Solutions>
2. In-site: [Three Cost-Wasting Habits in Coding Agents](/blog/coding-agents-cost-inefficient-behaviors/)
3. In-site: [Control the Harness, Control the Cost](/blog/control-the-harness-control-the-cost/)
4. In-site: [Grow the Harness, Not the Context](/blog/grow-the-harness-not-the-context/)
