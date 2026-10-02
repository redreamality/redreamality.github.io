---
title: "CIR: Causal Evaluation of Harness Recovery in LLM Agents"
description: "Reading arXiv:2610.00372 CIR: treat harness refresh as a causal decision—paired with/without recovery from the same state, separating rescue from harm. On ALFWorld×Qwen3-14B, never-refresh 70.33% → CIR 73.33% (+3.00 pp); clean trajectories untouched; two-step stale gain +9.33 pp."
pubDate: 2026-10-02T16:40:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "developer-tools"]
lang: "en"
---

When an agent runs a long task, the harness feeds environment observations into context and, after a slip, may issue another `look`—a **refresh**. Evaluations usually report average task success: refresh lifts the score by a few points, so recovery “works.” The catch is that the same operation can turn a failing trajectory into a success (**rescue**) or derail one that would have succeeded (**harm**). The average collapses both directions into one number. You never see the tension, let alone when intervention is worth the risk.[1]

Shuyao Xiao and colleagues (Beijing Normal University and Ke Holdings) reframe recovery as a causal decision in [arXiv:2610.00372](https://arxiv.org/abs/2610.00372) (*[When Harnesses Lose the Signal: Causal Evaluation of Recovery in LLM Agents](https://arxiv.org/html/2610.00372)*, preprint dated 2026-09-30). From the **same execution state**, they fork “refresh” versus “no refresh,” separate rescue from harm, and track how value changes over time. They then train a lightweight policy, the **Causal Intervention Router (CIR)**, that uses only pre-decision information to judge whether intervention is worthwhile now. On long-horizon ALFWorld household tasks with Qwen3-14B and a ReAct-style harness, never-refresh success of **70.33%** rises to **73.33%** under CIR (**+3.00** percentage points, 95% CI [0.67, 5.67]). Every evaluated trajectory with correct (**clean**) observations is left untouched; the largest gains land on two-step stale observations. Mechanism controls further show that the benefit of refresh **cannot** be explained solely by the new observation text returned by the environment.[1]

Site crosslinks already cover multi-objective harness search ([MoMHa](/blog/momha-multi-objective-harness-accuracy-safety-tokens/)), counterfactual harness evolution ([Bad Genius](/blog/bad-genius-counterfactual-harness-evolution/)), routing and cost ([control the harness / cost](/blog/control-the-harness-control-the-cost/)), and a lighter note on growing the periphery before stacking context ([Grow the Harness, Not the Context](/blog/grow-the-harness-not-the-context/)). CIR fills another gap: **treat recovery itself as a decision to evaluate, not a post-hoc average**—pair from the same state, split rescue/harm, then intervene selectively.[2]

## The tension average success rates hide

LLM agents do not act alone. An external harness passes observations between model and environment, maintains context, and coordinates long action sequences. When an observation is outdated or missing, errors can propagate through later steps; a common harness response is to query the environment again—refresh. Prior work improves recovery via reflection, external feedback, or search (Reflexion, Self-Refine, CRITIC, LATS, and related lines), yet evaluations usually stop at overall success rates or at marking where failures occur. Those summaries **do not show which trajectories recovery changes**: the same average gain can come from a few reliable rescues or from many rescues offset by many harms. Self-correction without reliable feedback can also degrade an initially correct response—another face of “looking like recovery while actually perturbing.”[1]

Two structural difficulties follow. First, an ordinary run shows only one outcome—recovery happened or it did not. Without the alternative outcome, you cannot tell whether recovery caused the final result (Holland’s fundamental problem of causal inference, replayed at trajectory scale). Second, timing matters: after an error, later actions and feedback change the situation; an intervention that helps now may be useless or harmful later. A useful evaluation must compare both choices from the same state and repeat that comparison at different times. The authors’ central question becomes: for **this** trajectory, does refresh help—and when does expected benefit outweigh risk? A positive average effect does **not** license unconditional use; the same average can come from a few safe rescues or from two-way offsetting changes; a modest average can also hide a large benefit in a recognizable subset of states.[1]

Related process-level evaluations (AgentBoard, MAST, Who&When, CatchBench) localize failures; counterfactual repair lines (Causal Agent Replay, CausalFlow, HarnessFix, DoVer) attribute or patch. CIR **keeps the recovery operation fixed** and asks whether applying it from the current state helps or harms, and when—it is not another reflection prompt. Paired runs make rescue and harm comparable; the same evidence can train a deployment-time rule.[1]

## Paired counterfactuals: same state, with vs without refresh

The unit of evaluation is a task instance \(i\). At a predefined point the harness **leaves the environment unchanged** and modifies only the observation shown to the agent. Observation condition \(e\) is one of three:

- **clean**: keep current information;
- **stale**: replace it with an earlier state’s observation (primary perturbation: two steps back; also one-step stale);
- **missing**: replace content with a fixed “observation unavailable” message.

Recovery delay \(d\) is the number of environment actions between the modified observation and the recovery operation; the paper tests \(d\in\{0,1,2,4\}\). The main operation \(m\) is refresh: an extra `look`, with the returned current observation appended to the transcript. Variants include replanning without querying the environment, and a **content-ablated** refresh that queries but hides the returned content. The triple \((e,d,m)\) therefore specifies what the agent sees, when recovery occurs, and which operation is used.[1]

For each task and observation condition, execution continues until delay \(d\), then forks from the **exact same state**: one branch continues without recovery; the other applies \(m\). Branches share environment state, pre-branch history, model, and decoding settings, so outcome differences are attributable to the recovery decision. In potential-outcome notation: no-recovery outcome \(Y_i^0(e)\), outcome after \(m\) at delay \(d\) \(Y_i^m(e,d)\), and instance-level effect \(\tau_i^m(e,d)=Y_i^m(e,d)-Y_i^0(e)\). Under deterministic replay the no-recovery continuation is shared across delay comparisons, so \(Y_i^0\) need not carry \(d\).[1]

Directional split is more informative:

- **rescue**: fail without recovery, succeed with it;
- **harm**: succeed without recovery, fail with it.

Both succeed preserves success; both fail leaves failure unchanged—together with rescue/harm, four paired outcomes. Instance-level effect is \(\tau=\mathcal{R}-\mathcal{H}\). Average recovery effect equals rescue rate minus harm rate. The **same net effect** can arise from rare changes or from frequent two-way changes—averages alone cannot tell them apart. Paired outcomes also supervise learning when recovery is more likely to rescue than harm. This reframes what counts as a successful recovery method: not merely how often success follows intervention (many of those trajectories would have succeeded anyway), but whether the outcome changed, in which direction, and at what point in the trajectory.[1]

## Setup: ALFWorld × Qwen3-14B

Tasks use ALFWorld (long household tasks via text actions). The agent is **Qwen3-14B** with a fixed **ReAct-style harness** and **greedy** decoding; each run is capped at **49** model turns and **64** environment actions. Trajectories were generated on eight NVIDIA H200 GPUs. Each task is first run without injected error or recovery—the **factual trajectory**—then the observation is modified after **25%** of the environment actions in that trajectory. The primary perturbation is two-step stale; one-step stale and missing are also used. Refresh = extra `look` + append the returned observation.[1]

A task is **prefix-feasible** if it reaches the chosen intervention point and has enough earlier history to construct the required stale observation; pre-branch histories must match. Primary and independent cohorts test replication; a mechanism cohort isolates refresh components; an evaluation cohort tests CIR. Some analyses keep only factual successes; to check that filter does not drive conclusions, complete cohorts retain every prefix-feasible task: primary **106** (**93** factual-success), independent **100** (**89** factual-success). A separate 74-task mechanism set (67 passing paired-protocol checks) is also used. These cover available prefix-feasible tasks, **not** the full ALFWorld distribution; `valid_seen` / `valid_unseen` are ALFWorld split names.[1]

CIR is fitted on the **93** primary factual-success tasks and evaluated on a separate ALFWorld **valid_seen** set (76 reported, of which **75** are prefix-feasible). No task appears in both fitting and evaluation. Each evaluation task is tested under four observation conditions → **300** episodes. Fitted models and thresholds are not retuned on the test set. All tasks remain in the denominator at every delay; if a task has already ended, its final outcome is carried forward and recovery is not applied. The main quantity is the paired success difference in percentage points; confidence intervals use a task-level cluster bootstrap so conditions from the same task stay together in each resample.[1]

## Recovery value depends on state and timing

Experiments ask three questions: when does refresh help or harm? which parts of refresh produce the benefit? can CIR turn the evidence into selective recovery on new tasks? Start with the **93** primary factual-success tasks and **immediate** refresh (\(d=0\)):

| Observation | Δ success vs no recovery | Note |
| --- | --- | --- |
| clean | **−6.45** pp (95% CI [−11.83, −2.15]) | no-recovery reproduces known success; failure is harm |
| two-step stale | **+7.53** pp (95% CI [−3.23, 18.28]) | CI crosses zero; point estimate positive |
| stale − clean | **13.98** pp (95% CI [2.15, 24.73]) | same operation, different information state |

Stale-minus-clean differences stay positive at later delays (18.28 / 15.05 / 13.98 pp at delays 1 / 2 / 4). In this factual-success cohort, no-recovery under clean is success by construction, so refresh can only preserve or harm—it **cannot** create a rescue—hence the authors also analyze complete cohorts that include factual failures. The independent 89-task factual-success cohort keeps the same ordering at every tested delay: stale effects are more positive than clean, differences 8.99–14.61 pp; at delay 2, stale **+10.11** and clean **−4.49**.[1]

Including every prefix-feasible task (13 factual failures in primary), complete primary **n=106**: clean **−3.77** pp (CI [−9.43, 0.94]), stale **+6.60** pp (CI [−2.83, 16.04]), difference 10.38 pp. Paired counts unpack the averages: **clean 2 rescues / 6 harms** versus **stale 17 rescues / 10 harms**. At delay 1 in the factual-success cohort under stale, the positive average combines 15 rescues with 4 harms; under clean, refresh turns 6 successes into failures. Complete independent n=100 shows 0.00 and +4.00 pp—still favoring stale at the point estimate, with wider intervals. The takeaway is blunt: **recovery value is not a fixed property of the refresh operation**; it depends on the information available to the agent, the state reached after the error, and when recovery is attempted. An unconditional always-refresh rule buries useful and unnecessary interventions behind the same average success rate.[1]

## Why refresh helps: not only new observation content

Mechanism controls split refresh into three pieces:

1. **full refresh**: query the environment and show the returned content;
2. **content-ablated**: same query, but **hide** returned content;
3. **replan-only**: no environment query; ask the agent to replan from context already present.

Under two-step stale at delay 4, changes vs no recovery are **+13.43** / **+10.45** / **+1.49** pp (full CI [4.48, 22.39]; content-ablated [1.49, 20.90]; replan-only [−8.96, 11.98]). Full refresh rescues ten tasks; content-ablated shares **eight** of them—for those shared rescues, **newly returned observation content is not necessary**. Under clean at delay 0 the three operations change success by −8.96 / −5.97 / −14.93 pp, all harmful in direction. The paper stresses that refresh is often treated as equivalent to supplying better observation text; the controls show distinct components—requerying the environment and interrupting the current execution stream, among others. Evaluating only the full operation binds “content” to “intervention posture” and misses the split—so when designing recovery stacks, do not assume “correct content is enough.”[1]

## CIR: estimate before deciding whether to refresh

Paired evaluation can tell you after the fact whether recovery helped; a live harness must decide before either outcome is known—the step from evaluation tool to selective recovery, and the landing point of the Causal Intervention Router. CIR’s objective is explicit: maximize expected gain relative to never recovering when the observation is **incorrect**, subject to a clean-trajectory harm-rate constraint \(\epsilon\) (here \(\epsilon=0.02\)): the fraction of clean trajectories that succeed without recovery but fail under the policy. Maximizing gain alone would encourage frequent refreshes that disrupt correct executions; the constraint caps that risk. At runtime neither potential outcome is known, so CIR must estimate refresh value from pre-decision information.[1]

CIR separates two questions: **does the observation look wrong**, and **would refresh improve the final outcome**? Anomaly detection answers only the first. Some erroneous trajectories are not rescued by refresh; some apparently normal ones can be harmed by it. CIR fits three \(\ell_2\)-regularized logistic models (\(C=0.1\)) for observation-error probability \(p_{\mathrm{err}}\), success without subsequent recovery \(p_0\), and success after immediate refresh \(p_1\). Inputs use only information available **before** a candidate intervention: action and reasoning repetition, no-ops, observation novelty, action–observation consistency, task progress, and context-budget statistics. The two outcome models follow a T-learner-style design so high anomaly probability is not treated as evidence that refresh helps.[1]

From these it builds a rescue score \(s_R=(1-p_0)p_1\) and a harm score \(s_H=p_0(1-p_1)\), with utility \(u_\lambda=s_R-\lambda s_H\) (\(\lambda=2\)). High rescue score ≈ continued execution likely fails and refresh likely succeeds; high harm score ≈ the reverse. Marginal success probabilities do not determine the probability that the *same* task is rescued or harmed (in the Tian & Pearl sense), so these scores are **not** interpreted as rescue/harm probabilities—only as ranking signals. \(\lambda\) raises the weight on harm so high-harm states are less likely to trigger; \(\epsilon\) limits the fraction of all clean trajectories the policy turns from success into failure.[1]

Because recovery value can change as the agent takes more actions, CIR does not commit to one fixed delay. It checks candidate times \(d\in\{1,2,4\}\) in order (\(d_{\min}=1\)) and refreshes at the first time when error probability ≥ \(\alpha\), failure tendency ≥ \(\beta\), and utility ≥ \(\gamma\), at most **once per trajectory**; if none qualify, the task proceeds without recovery. Thresholds on development data: \(\alpha=0.876\), \(\beta=0.052\), \(\gamma=0\). Fitting uses five-fold out-of-fold (OOF) predictions on the 93 training tasks to choose thresholds, then refits on all training tasks—parameters and thresholds are fixed before test evaluation, keeping fitting separate from threshold selection.[1]

Comparators: never refresh; a sequential anomaly baseline (same error detector, no prediction of whether refresh helps); and a rate-matched anomaly baseline whose training-time intervention rate matches CIR. Baseline thresholds use the same OOF predictions, objective, and clean-harm limit, with **no test-set adjustment**. The design intent is to separate selective recovery from simply intervening more often.[1]

## Test: 70.33% → 73.33%, clean untouched

On **75** held-out prefix-feasible tasks and **300** episodes:

| Policy / condition | Success | vs never-refresh | rescue / harm |
| --- | --- | --- | --- |
| Never refresh (all) | **70.33%** | — | — |
| **CIR (all)** | **73.33%** | **+3.00** pp, CI [0.67, 5.67] | **11 / 2** |
| Clean | 81.33% → 81.33% | 0.00 | **0 / 0** |
| One-step stale | 68.00% → 69.33% | +1.33 | 1 / 0 |
| Two-step stale | **60.00% → 69.33%** | **+9.33** | 9 / 2 |
| Missing | 72.00% → 73.33% | +1.33 | 1 / 0 |

CIR intervenes in **16.3%** of episodes—31 of 75 two-step stale episodes and only 1 of 75 missing—concentrating where observed benefit is largest. The sequential anomaly baseline intervenes in **12.7%** and gains **+1.67** pp (6 rescues / 1 harm); rate-matched intervenes in **15.7%** and gains **+2.00** pp (6 rescues / 0 harms). CIR has the highest point estimate; margins over the two anomaly baselines are 1.33 and 1.00 pp (both CIs cross zero; the paper reports this honestly). The 3.00 pp gain over never-refresh has a task-level sign-flip test \(p=0.034\). Rate-matching matters: at similar intervention rates, CIR still produces 11 rescues rather than 6—the policy considers **predicted intervention outcomes**, not only whether the current observation looks unusual. On all 75 clean episodes CIR **never triggers**, preserving the never-refresh success rate throughout the evaluated clean cohort.[1]

The discussion is crisp: evaluate recovery as a **decision**, not only as an operation. Paired continuations reveal which trajectories are rescued or harmed and how value changes with state and timing—more informative than post-recovery success alone. Anomaly detection is insufficient: an unusual observation does not imply that refresh will help. CIR predicts outcomes under refresh and continued execution before acting, so a harness can estimate recovery value first and intervene only when expected value is positive. In other words, the paper turns “whether to recover” from a heuristic switch into an online decision problem with a clean-risk constraint; the test-set +3.00 pp and clean 0/0 are what that protocol produces when it works—not an arbitrary heuristic bolted on.[1]

## What harness engineering can take from the protocol

The paper does not ship a product integration, but the evaluation protocol and CIR’s shape are concrete for people writing agent peripheries.

**Build paired data before debating policy.** With replayable trajectories (same seed / greedy / fixed tool returns), inject clean / stale / missing at a prefix and fork extra `look` versus do-nothing. Log pre-fork state hash, condition label, intervention flag, and final success. Rescue/harm counts fall out directly; CIR supervision comes from the same pairs—evaluation and training stay one narrative.[1]

**Features must be pre-decision only.** Repetition, no-ops, observation novelty, action–observation consistency, progress, and context budget are quantities a harness can already emit. The hard constraint: at decision time you still do not see the post-refresh outcome, so post-hoc labels must not leak into features. Three small logistics (error probability, no-recovery success, refresh success) are cheaper than another large judge model and easier to audit under OOF thresholding and clean-harm constraints.[1]

**Do not default to unconditional refresh.** Immediate refresh on the primary factual-success cohort is net harmful under clean (−6.45 pp) and still −3.77 pp on the complete primary cohort; on the CIR test set clean is untouched while two-step stale absorbs +9.33 pp. If your engineering default is “`look` whenever something might be stale,” you may be masking clean harms behind average success. A safer default: open selective routing only where paired evidence shows net benefit for a recognizable state class; otherwise keep never-refresh as a strong baseline and dashboard intervention rate, rescue, harm, and clean-touch rate together.[1]

**Ablate “content” from “intervention posture.”** Content-ablated sharing most rescues means many do not need new returned text. If your stack mixes requery, summary injection, and forced replan, run similar splits—or you will credit “better observations” for interruption gains. On cost-sensitive stacks, a cheaper interrupt may beat a full observation pull if interruption carries much of the benefit.[1]

**Re-run the protocol before extrapolating.** The numbers here are bound to ALFWorld + Qwen3-14B + ReAct + greedy + a prefix-feasible subset. Thresholds \(\alpha,\beta,\gamma\) and \(\lambda,\epsilon\) have no reason to transfer unchanged to browser agents, coding agents, or stochastic decoding. What transfers is the discipline: pair, split directions, slice by condition and delay, route selectively with pre-decision models, and cap clean harm.[1]

## Takeaways

1. **Stop scoring recovery operations by a single average success rate.** The same operation can be net harmful under clean and net helpful under stale; averages erase paired counts like 2/6 versus 17/10.
2. **The evaluation protocol is reusable:** fix the pre-fork state → pair with/without recovery → report rescue, harm, and unchanged → slice by \(e\) and \(d\). That carries more information than “success after recovery” and is closer to a deployment decision than marking failure steps alone.
3. **Refresh ≠ stuffing new observation text.** Content-ablated refresh shares most rescues with full refresh; interruption and requery matter. Do not assume correct content is enough.
4. **Selective routing can raise success without retraining the underlying agent, while constraining clean harm.** CIR estimates error and two outcome probabilities from pre-decision features, locks thresholds on OOF, then evaluates—lightweight and deployable, not another large model to train.
5. **State the limits:** single environment (ALFWorld), single model (Qwen3-14B), greedy decoding, prefix-feasible subset rather than the full distribution; some stale primary CIs cross zero; margins over anomaly baselines also cross zero at the confidence level—the authors report a point-estimate lead. Extrapolate by re-running the paired protocol, not by copying thresholds.[1]

In the site narrative: MoMHa asks not to collapse search objectives into one scalar; Bad Genius asks how counterfactual signals evolve a harness; cost posts ask what defaults burn; Grow the Harness asks periphery versus context. CIR asks: **whether and when to recover—answer with paired causal evidence, not average success as self-consolation.** If you are adding auto-retry / auto-look / auto-reflect, copy the discipline—same-state pairs, rescue/harm columns, clean-harm cap—not the threshold numbers.[2]

## References and notes

[1] Shuyao Xiao, Shengling Wang, Xuan Chen, Ke Chao, Ming Cui, Feifei Qian, Chaoyang Mei, Fanlin Meng, Ziming Yu, Junxi Yin. *When Harnesses Lose the Signal: Causal Evaluation of Recovery in LLM Agents*. arXiv:2610.00372, 2026-09-30. [Abstract](https://arxiv.org/abs/2610.00372) · [HTML](https://arxiv.org/html/2610.00372). All figures cited above are from that preprint’s experiments and abstract; none were estimated here.

[2] Site crosslinks: [MoMHa](/blog/momha-multi-objective-harness-accuracy-safety-tokens/), [Bad Genius](/blog/bad-genius-counterfactual-harness-evolution/), [control the harness / cost](/blog/control-the-harness-control-the-cost/), [Grow the Harness](/blog/grow-the-harness-not-the-context/).
