---
title: "Qwen-Planner-Agent: Planner–Harness Co-Evolution in a Closed-Loop AI-for-AI Stack"
description: "A deep read of arXiv:2609.29892 Qwen-Planner-Agent—human-gated data flywheel, CARE hybrid-environment agentic RL, and model–harness co-evolution—with checked MobilePA-Bench Overall 77.05 and CARE −32.5% output tokens, set against Jev-Mobile and Growing Harness on this site."
pubDate: 2026-09-26T00:00:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "mobile", "reinforcement-learning", "qwen"]
lang: "en"
---

Mobile planner agents sit under two constraints at once. Completing a high-level goal means coordinating across apps, holding context as state changes, recovering from failures, and verifying that the intended outcome actually happened—long-horizon reliability is the product. Real-device interaction is expensive and hard to parallelize, so development and evaluation do not scale if every trajectory must touch hardware. In [arXiv:2609.29892](https://arxiv.org/abs/2609.29892), Alibaba’s MAI Team / Token Hub present **Qwen-Planner-Agent** as a closed-loop testbed for that tension: execution feedback drives data production, training strategy, and runtime orchestration—not merely a larger model dropped onto phone tasks.[1]

Framed as **AI-for-AI**, the engineering shape is three coupled stages: (i) **AI for Data**—human-gated flywheel; (ii) **AI for Training**—planning cold start plus hybrid-environment online agentic RL with **CARE** (Competence-Aware Reward-and-Advantage Engineering); (iii) **AI for Harness**—runtime Memory / Skills / Tools, with failure traces toward **model–harness co-evolution**. On MobilePA-Bench, Qwen-Planner-Agent 27B leads Overall at **77.05**, with estimated output cost (including thinking) about **$2.41 per 1,000 tasks**.[1]

This site just covered [Jev-Mobile](/blog/jev-mobile-system-one-gui-executor/) as a GUI *execution* slice (low-frequency VLM goals, high-frequency typed decisions on live trees), plus [Growing Harness](/blog/grow-the-harness-not-the-context/), [Claude Code harness](/blog/inside-claude-code-agent-harness/), [ECC](/blog/ecc-agent-harness-optimization/), and [SpecHarness](/blog/specharness-spec-holds-the-pen/). This post moves up: a full **Planner + Harness stack**, with **\(	heta\) fixed at serve time** and harness config \(\eta\) changed only after offline review. Numbers are checked against Table 1, CARE dynamics, and the co-evolution table. Authors call this a *development pathway*, not autonomous co-evolution already achieved.[1]

## Why mobile planning is a good place to talk about execution-driven development

A phone request such as “set up the trip and monitoring” is rarely one tool call. The agent must coordinate actions across applications, keep context as states change, recover when something fails, and verify completion. The paper formalizes the loop: underlying state is only partially observed; the harness builds context from history, retrieved memory, and loaded skills; the policy samples from the currently available structured action set; a task-specific verifier scores completion from interaction history and execution evidence.[1]

The hard part is not only “can it plan,” but **whether development can scale**. Live device sessions are costly, poorly parallelizable, and awkward to reset. If every training trajectory needs a real phone, the data flywheel stalls. Task-specific verification creates the complementary opportunity: traces and observable outcomes are evidence for measuring progress, locating gaps, and deciding what to change next. Mobile planning is therefore a concrete setting—demanding on reliability, forcing hybrid environments and feedback loops if you want scale.[1]

That differs from stuffing more context or swapping a bigger closed model. Qwen-Planner-Agent asks how execution experience can jointly change **which data to collect, what RL should reward, and which Skills/Memory the runtime should expose**—a closed loop only when those updates share one action–feedback–verification contract.[1]

## Three stages: Data → Training → Harness (dev set, not the final bench)

In prose, the lifecycle looks like this:

1. **AI for Data.** Task-construction agents turn capability targets into executable specs (user goal, resources, initial conditions, target capabilities, completion criteria) without prescribing a single reference trajectory. Automated rollouts collect trajectories on hybrid backends; successes *and* failures are kept so diagnosis can see where execution diverged, whether recovery was attempted, and why the task stayed unfinished. Curation separates “verifier says done” from “record is fit for learning.” Low-confidence, conflicting, or safety-sensitive cases go to humans. Training and development-set feedback then down-sample mastered tasks, up-weight unstable behaviors, and spawn tasks for missing capabilities. Each data release is human-gated.[1]

2. **AI for Training.** Curated trajectories first support a planning-oriented cold start (SFT with loss masking on turns marked erroneous during curation), then online agentic RL in hybrid environments. Cold start learns decomposition, sequencing, tool use, state-conditioned replanning, and recovery; online RL covers interaction states demonstrations cannot exhaust as the policy shifts. CARE, in this stage, switches reward emphasis by group success rate and calibrates advantages so small efficiency gaps do not dominate once success saturates.[1]

3. **AI for Harness.** At serve time the Planner Model sits behind a unified harness: a Scenario Adapter assembles Skills for currently exposed tools; Persistent Memory stores and retrieves cross-session evidence; an Executor applies actions and returns structured feedback. Model parameters stay fixed while serving. Deployment traces and development-set feedback are diagnosed offline and routed either into data updates or into revisions of harness instruction config \(\eta\). Revisions are versioned and rule-checked; ambiguous and release-critical decisions stay under human review.[1]

Intermediate evaluation deliberately uses a **held-out development set**, not the final MobilePA-Bench test set. Dev tasks and their trajectories do not enter training directly; their scores and failure patterns only guide the next round of task generation, sampling, and harness edits. That is the same discipline as the co-evolution “evolve set”: without independent development feedback, harness revision peeks at the final score.[1]

## Hybrid environments: sandbox, LLM sim, and real devices each buy something different

Data and online RL share three backends behind one agent-facing interface: **programmatic sandboxes** (deterministic, resettable, high-throughput); **LLM-simulated environments** (long-tail coverage, validate before training); **real-device sessions** (permissions, auth, live dependencies—used selectively).[1] Reproducible work prefers sandboxes; long-tail prefers sim; devices where fidelity demands it. Compatible records feed shared curation; training and environment layers scale independently. You need **checkable completion evidence** and **scalable sampling** together.

## CARE: progress / outcome / efficiency by group competence

A fixed reward schedule serves three regimes poorly. Sparse-success groups need progress signals; mixed groups should consolidate completion; saturated groups can shift toward execution efficiency. Standard within-group normalization has a further side effect: once success saturates, tiny efficiency differences can acquire advantage scale comparable to mixed-success groups, so efficiency pressure can outweigh “get it right first.”[1]

CARE splits the fix into two layers.

**Reward scheduling.** For each task, sample a group of \(G\) trajectories and use group success rate \(\bar{s}\) to pick a regime: low success → progress shaping (success indicator plus verified progress); mid band → outcome consolidation (success only); high success → efficiency refinement (success minus a normalized cost penalty). Thresholds and weights are periodically configured by a bounded LLM controller from training stats and development-set feedback—AI tunes schedule parameters; it does not invent a new reward formula on the fly.[1]

**Quality-preserving advantage calibration.** In the efficiency regime, the normalization denominator gets a success-derived floor \(\sigma_{\mathrm{anchor}}=\sqrt{p_{\mathrm{high}}(1-p_{\mathrm{high}})}\), limiting amplification of small efficiency gaps. The paper’s limiting case is the point: in a fully successful group, standard normalization nearly cancels the efficiency coefficient and still yields near unit-scale advantages; the floor keeps dependence on the efficiency weight while discouraging aggressive trajectory compression.[1]

Training dynamics under the same 27B baseline setup: **full CARE matches Vanilla RL accuracy while using 32.5% fewer output tokens** at the final shared plotted step; CARE without advantage calibration produces even shorter outputs but clearly lower accuracy. Shorter is not automatically better—uncalibrated efficiency signals encourage over-compression.[1]

Reusable intuition: **let group competence decide whether the lesson is “succeed” or “succeed cheaply”; then floor advantages so that, after success saturates, saving a little does not become the whole curriculum.** That is isomorphic to Growing Harness’s success-first gate—cost wins must not buy quality regressions.[2]

## Harness: change context online, change \(\eta\) only offline

Deployment is not an endpoint; it is a continuing source of executable evidence. Tool inventories, operating rules, user facts, and histories keep changing. Encoding every change in parameters means constant retraining; stuffing every rule and record into the prompt creates long, noisy contexts. The harness sits between planner and environment at two timescales.

**Online.** On each request it assembles active context: conversation history, currently exposed tool specs, procedural guidance from the Scenario Adapter, evidence from Persistent Memory, and runtime constraints. The planner emits a structured action; the Executor applies it and returns a tool result, observable state change, or error. Skills describe *how* available resources should be used; Memory supplies *what* is already known or previously happened. Memory is typed by function (user model, episodic, consolidated long-term, prospective intent). Retrieved items enter context as evidence—they do not gain permission to invoke tools or mutate external state.[1]

**Offline.** Each deployment trace keeps tool/Skill config, memory provenance, chosen action and arguments, Executor response, state evidence, errors, and verifier outcome. Diagnosis splits two ways: **model-side** failures (bad decomposition, routing, argument grounding, state tracking, recovery, premature closure) versus **harness-side** failures (missing or conflicting Skill guidance, bad tool exposure, retrieval errors, stale memory, incomplete feedback formatting). Model-side evidence feeds task construction and data repair; harness-side evidence proposes revisions to \(\eta\). Candidates do not auto-apply to serving systems.[1]

The co-evolution equations make the coupling explicit: round \(k\) updates \(\theta\) with RL under fixed \(\eta^{(k)}\), evaluates under the same \(\eta\) on an evolve/dev set, then an LLM editor revises \(\eta^{(k+1)}\) so the next training round sees a new context distribution. Harness edits change not only immediate execution but the experience the model later learns from—that is what makes “co-evolution” heavier than “a better system prompt.”[1]

Privacy and access control get their own section: private user memory versus shareable agent experience; reduction of user-specific detail before sharing; inspection, correction, deletion, and withdrawal. Do not skip that when reading for product use—an agent that can write memory expands the data surface by default.[1]

## MobilePA-Bench: Table 1 and cost scope only

MobilePA-Bench has 1,700+ executable tasks, 200+ mobile tools, and 13 query–task domains; tasks start from controlled initial states and complete via tool calls, terminal state changes, or agent behavior. **Qwen-Planner-Model** is the trained planner without the deployment harness; **Qwen-Planner-Agent** is the full system with harness support.[1]

Key Table 1 rows (Overall and capability columns, percentages):

| System | Overall | Tool Use | Memory | Skills | Sub-agent |
| --- | ---: | ---: | ---: | ---: | ---: |
| GPT-6 Astra | 76.84 | 75.71 | 74.73 | 93.25 | 53.93 |
| Claude Opus 5 | 75.71 | 77.60 | 71.81 | 83.00 | 59.55 |
| **Qwen-Planner-Agent 27B** | **77.05** | **77.79** | **74.76** | **86.25** | **59.55** |
| Qwen-Planner-Model 27B | 71.90 | 72.79 | 70.74 | 79.25 | 55.06 |
| Qwen Baseline 27B | 67.22 | 68.37 | 67.82 | 73.75 | 47.19 |
| Qwen-Planner-Agent 35B-A3B | 69.91 | 71.25 | 67.02 | 78.00 | 52.81 |
| Qwen-Planner-Model 35B-A3B | 64.79 | 66.15 | 61.17 | 71.00 | 52.81 |
| Qwen Baseline 35B-A3B | 54.90 | 64.04 | 44.41 | 47.50 | 44.94 |

Same-backbone ladders are clear: **27B Baseline 67.22 → Planner-Model 71.90 → Agent(+Harness) 77.05**; **35B-A3B Baseline 54.90 → Model 64.79 → Agent 69.91**. Holding the 27B checkpoint fixed, the harness alone lifts Overall by +5.15pp (71.90→77.05), with Skills jumping from 79.25 to 86.25. Agent 27B ranks first on Overall among evaluated systems, slightly above GPT-6 Astra (76.84) and Claude Opus 5 (75.71). Sub-agent ties Claude Opus 5 at 59.55; Skills still trail Astra’s 93.25—so “frontier overall” is not “wins every column.”[1]

Cost: estimated output cost including thinking tokens is about **$2.41 per 1,000 tasks**, versus roughly **$3.06–$67.76** for other models in the comparison. The estimate uses mean output tokens × output rates and **excludes** input tokens, external tools, device execution, and extra harness processing. When you quote the number, keep the “output-side only” scope visible so it is not read as an end-to-end bill.[1]

Long-history (Table 3): without the harness, BEAM scores fall as history grows; with the harness, matched Qwen pairs rise sharply on BEAM-500K/1M/10M. Example: **27B Planner BEAM-10M 21.99→67.24** under the Agent’s memory harness. Short-history benchmarks move little and sometimes regress slightly—gains concentrate where relevant evidence exceeds the active context, not as a universal bonus.[1]

Co-evolution (Table 2, a separate 27B baseline checkpoint): MobilePA-Internal Overall **82.67→88.50 (+5.83pp over four rounds)**; MCPMark **38.00→46.98 (+8.98pp over three rounds)**. Static Model+Harness already helps (Internal 84.23 / MCPMark 42.26); alternating training and revision still adds more. Evolve-set feedback revises the harness only; those tasks and trajectories stay out of training—same discipline as the main development set.[1]


## Traces and generalization (brief)

Qualitative cases show the same split in action: reconcile memory with live monitors before adding a city; resume casting from tool-confirmed state rather than a misleading ack; treat Skill guidance as a hard prerequisite before shutdown; branch on headphone mode then enforce order; substitute a calculator after unit-conversion failures; hand off to a file-manager sub-agent only after downloads complete.[1] **Harness supplies evidence and procedures; the planner takes the next verifiable structured step.**

Planner-only checkpoints also improve on most matched non-mobile agentic benches (Claw-Eval, BFCL-v4, MCP-Atlas, Tau-3, Toolathlon, SWE variants) while staying close on MMLU-Redux / C-Eval / IFEval—uneven gains, not MobilePA-only overfitting.[1]

## Against Jev-Mobile: executor slice vs Planner+Harness stack

[Jev-Mobile](/blog/jev-mobile-system-one-gui-executor/) attacks cost and observability on the Android GUI loop: the VLM sets local goals at low frequency; typed decisions chain on **live** accessibility-tree candidates; DONE/BLOCKED hand off explicitly. On successful full-AndroidWorld trajectories it cuts end-to-end time by 32.7% and model API cost by 73.4% versus step-wise VLM, with 79% success close to SeeAct-V.[3]

Read beside this paper without mixing layers:

| | Jev-Mobile | Qwen-Planner-Agent |
| --- | --- | --- |
| Core problem | Step-wise VLM grounding is expensive; actions hard to type | Long-horizon planning reliability + unscalable real-device development |
| Model roles | General VLM delegates; Jev selects among candidates | Trained Planner decomposes, tools, recovers |
| Action interface | Typed selection on live-tree candidates (GUI-heavy) | Structured tools first (visual observations optional) |
| “Harness” means | Delegation state machine + candidate gen + event ledger | Skills + Persistent Memory + Executor + \(\eta\) revision |
| Learning loop | v1 explicitly avoids requiring new training | Cold start + CARE online RL + co-evolution rounds |
| Headline numbers | AndroidWorld success-trajectory efficiency | MobilePA-Bench 77.05; CARE −32.5% tokens |

One line: **Jev-Mobile is a typed executor slice; Qwen-Planner-Agent is a Planner+Harness production stack and co-evolution narrative.** The first answers “how to tap this screen cheaply”; the second answers “how planning capability, runtime context, and training data iterate on the same execution evidence.” They can complement each other—an outer Planner+Harness for cross-app plans, an inner typed GUI executor for touches—but the papers do not assemble that stack; site contrast only pins the layers.[1][3]

## Against Growing Harness / ECC / SpecHarness: same direction, different object

[Growing Harness](/blog/grow-the-harness-not-the-context/) sinks recurring control into code (failure windows, function-level edits, success-first rollback).[2] [ECC](/blog/ecc-agent-harness-optimization/), [Claude Code harness](/blog/inside-claude-code-agent-harness/), and [SpecHarness](/blog/specharness-spec-holds-the-pen/) cover portable Skills, production-loop survival, and spec-as-control.

Here the main optimization object is **editable \(\eta\)** plus Memory/Skills assembly—not growing a full controller from a strategy-free scaffold. Model and harness alternate; Growing Harness more often fixes the model and grows the program. Shared: do not let control crowd evidence; attribute failures; version and gate updates. Different: this paper trains the Planner and uses CARE; Growing Harness asks whether the call should have been made at all. The authors’ claimed distinction versus AutoHarness / Meta-Harness–style work is **coupling harness revision to the next policy’s experience distribution**. Classify site posts by optimization surface—code / instructions / specs / memory policy.[1][2]

## A reusable checklist (and the boundaries the paper draws)

What transfers is discipline, not “77.05 on 27B”:

1. **Human-gated data flywheel.** AI constructs tasks, collects trajectories, proposes sampling edits; humans approve dataset and sampling config before each release. Ungated synthetic data amplifies curation error.
2. **Layered hybrid environments.** Reproducible work in sandboxes; long-tail in simulation; real devices where fidelity demands it. Unify agent-facing records; do not assume sim and device feedback are equally reliable.
3. **Competence-aware rewards.** Switch progress / outcome / efficiency by group success; floor advantages in the efficiency regime. Quote −32.5% token wins only when accuracy stays comparable.
4. **Attribute failures to model vs harness.** Decomposition and grounding errors feed data and training; Skill/Memory/exposure errors feed \(\eta\) and retrieval policy. A single “model bad” bucket cannot co-evolve.
5. **Co-evolution needs an evolve set and version gates.** Dev/evolve tasks stay out of training; \(\theta\) fixed at serve time; offline revisions versioned; release-critical and conflicting cases human-reviewed.
6. **Use a memory harness for long history, not only a bigger window.** BEAM-10M-style gains show retrieval and consolidation help when evidence exceeds context; do not expect the same lift on short-history benches.
7. **Quote cost with scope.** $2.41/1,000 tasks is an output-side estimate including thinking; end-to-end still adds input, tools, devices, and the harness itself.

Authors present a **pathway toward co-evolution** and **do not claim** sustained autonomy; future work still reduces manual steps while keeping humans at safety-critical points.[1] Per [Agents of Chaos](/blog/agents-of-chaos-ai-agent-failures/), if an LLM editor can change \(\eta\) or memory policy, sandboxing, permissions, and rollback are prerequisites.

## Close

Worth a long read because it wires three usually separate jobs into one loop: **data flywheel listening to training feedback, CARE retuning RL by competence, harness revising from failure traces with the model.** Agent 27B Overall 77.05, same-backbone ladders, and CARE −32.5% tokens are checkable. Next to Jev-Mobile: typed executor for cheap taps; Planner+Harness for planning and runtime that grow together.

One sentence: mobile planning’s bottleneck is often not whether a single inference looks clever, but whether **execution evidence has a formal return pipe**—into data, rewards, and Skills/Memory—not only into a longer prompt.

## References

[1] MAI Team, Alibaba Token Hub. *Qwen-Planner-Agent: A Closed-Loop AI-for-AI Framework for Real-World Mobile Planner Agents*. arXiv:2609.29892, 2026. https://arxiv.org/abs/2609.29892

[2] Growing Harness (site read): [/blog/grow-the-harness-not-the-context/](/blog/grow-the-harness-not-the-context/); paper arXiv:2609.26760.

[3] Jev-Mobile (site read): [/blog/jev-mobile-system-one-gui-executor/](/blog/jev-mobile-system-one-gui-executor/); paper arXiv:2609.30186.
