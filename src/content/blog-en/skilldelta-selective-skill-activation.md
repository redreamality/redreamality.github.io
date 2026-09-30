---
title: "SkillDelta: Relevant Skills Still Need a Gain Check"
description: "A deep read of arXiv:2609.32274 SkillDelta: relevance ≠ incremental benefit; paired with/without-skill history predicts task-conditional gain; +4.3pp vs random at matched use rates across 15 settings—after progressive disclosure."
pubDate: 2026-09-30T10:40:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "developer-tools", "Agent Skills"]
lang: "en"
---

Yesterday’s [Progressive Disclosure](/blog/progressive-disclosure-agent-skills/) post covered what happens when a skills library grows: eager full-body loading can overflow the window before the task starts; frontmatter first plus on-demand `load_skill` claws back that context tax. That piece answers **how to load and how much to show**. The next failure mode in production is subtler: the retriever already returned a “relevant” skill, so the harness injects it by default—**relevance is not the same as incremental benefit on this task.**

In preprint [arXiv:2609.32274](https://arxiv.org/abs/2609.32274) (*When Does a Skill Add Value? Task-Conditional Gain Prediction for Selective Skill Use*, 2026-09-26), Anjie Xu, Zhiyu Zhang, Ruiqing Ding, Fengli Xu, and Leye Wang (Peking University, Tsinghua University, Hefei University of Technology, Zhongguancun Academy) nail the question: **before the agent acts, can we predict how much injecting a skill raises success probability versus skipping it?** They introduce **SkillDelta**: estimate task-conditional gain \(\tau\) from paired with/without-skill executions of the same agent, transfer historical gains to new tasks with a local neighbor predictor, and inject only when the prediction clears a threshold. Across five benchmarks × three target agents (**15** settings), paired history improves observed-gain ranking over skill-assisted outcomes alone in **12 of 15**. At **matched expected skill-use rates**, selective use beats random activation in all 15 settings by an average absolute **4.3** percentage points. Code lives at [TankTechnology/skilldelta](https://github.com/TankTechnology/skilldelta), including a DeepSeek Harness plugin sketch.[1]

Read this as the sibling of Progressive Disclosure: disclosure controls “don’t flood the window with unused manuals”; a gain gate controls “don’t auto-inject a relevant manual either.” On-site posts on [growing the harness](/blog/grow-the-harness-not-the-context/), [harness cost control](/blog/control-the-harness-control-the-cost/), [cost-inefficient behaviors](/blog/coding-agents-cost-inefficient-behaviors/), the [Agent Skills starter](/blog/agentskills-io-starter-guide/), and [Cloudflare’s security-audit-skill](/blog/cloudflare-security-audit-skill-for-coding-agents/) cover control surfaces, cost, and wiring. SkillDelta fills the gate **after retrieve, before the first model step**.

A same-window companion is SkillApt ([arXiv:2609.26863](https://arxiv.org/abs/2609.26863)), which also treats LOAD/ABSTAIN as post-retrieval. We mention it only as context: SkillDelta’s clean statement of incremental gain \(\tau=\mu_1-\mu_0\) and its paired-history local predictor are the mechanism this post unpacks.[1]

## 80% success with a skill can mean +0 or +40 gain

The paper splits “did the skill help?” from “did the skill-assisted run succeed?” Hold the agent and protocol fixed. Let \(\mu_1(t)\) be success probability with skill \(s\), \(\mu_0(t)\) without it. **Task-conditional gain** is:

\[
\tau(t)=\mu_1(t)-\mu_0(t).
\]

Their running example: two tasks each succeed **80%** of the time with the skill. If no-skill success is 80% on one and 40% on the other, gains are **0** and **+40** points. Predicting skill-assisted success alone treats them as alike; the decision question is **how much you win relative to skip**.[1]

That lines up with cost narratives on this site. Injection is not free: extra workflow text, possibly more tool hops, tokens and latency. If \(\tau\approx 0\) or negative, you pay for looking procedural. A tool call invokes an operation; a skill supplies a reusable workflow—and skill descriptions can overstate benefit. Work such as SRA-Bench already shows agents struggle to judge when skills are needed. SkillDelta’s stance: **don’t let verbal self-judgment replace measurable incremental gain**.[1]

Paired observations make \(\tau\) archivable: same task, same agent, run under use and skip (with optional repeats); \(\widehat{D}_i=\widehat{\mu}_1-\widehat{\mu}_0\). With one pair, \(\widehat{D}_i\in\{-1,0,1\}\) records help, no change, or harm; repeats reduce execution noise. Pairing matches task and condition; trajectories need not be identical step-by-step.[1]

The downstream policy is simple: predict \(\widehat{\tau}(t)\), compare to threshold \(\eta\); at \(\eta=0\), inject on positive predicted gain. Baselines are Always-off, Always-on, and **random activation at the same expected use rate**—the last asks whether you merely used the skill more often, or actually assigned it to tasks that benefit.[1]

## Method: paired history bank + same-family local predictor

SkillDelta does not retrain the agent. The history bank stores task text, skill/family identity, fixed question vectors, and paired outcomes. On a new task and candidate skill:

1. **Scope support** to the same skill or family (experiment “family” = recorded task group: supplied-skill families, BigCodeBench focal groups, SpreadsheetBench task types, etc.).
2. **Find neighbors** with question-only embeddings (main runs: text-embedding-3-small, 1,536-d, L2-normalized cosine), up to \(k=6\) nearest in support.
3. **Average signed gains** with nonnegative cosine weights (negatives clipped; all-zero → uniform) to get \(\widehat{\tau}\).
4. **Decide**: inject if \(\widehat{\tau}>\eta\) (main tables use \(\eta=0\)); empty support → score 0 and skip.[1]

Zero-gain neighbors **keep their weight** and pull the estimate toward zero—otherwise a bank full of “same either way” silently vanishes and predictions skew optimistic. Helpful and harmful neighbors both enter the weighted sum, so the estimate is signed gain, not “looks strong with the skill.”[1]

Versus averaging neighbors’ with-skill success only (with-skill-only): that view never sees \(\mu_0\), so “already could” and “skill rescued” collapse. Paired evidence improves observed-gain-sign AUROC over an outcome-free relevance gate on **12** panels and over with-skill-only on **12**, beating both on **10**. ToolQA and MedCalc-Bench are most consistent; on BigCodeBench, outcome-free lexical scores often rank gains better—see limitations on representation geometry.[1]

**Self-judgment is nearly Always-on.** Give the target agent the question and the same skill text for a binary use/no-use call: in **14 of 15** panels use rate exceeds **91%** (DeepSeek-V4-Flash SpreadsheetBench is the exception at ~44.4%). Little gain-sign discrimination; SkillDelta’s continuous scores beat binary self-judge AUROC on all 15 panels. Self-judgment also burns a routing call—total tokens rise **2.6%–98.2%** versus Always-on.[1]

## Theory intuition: coverage, representation residual, execution noise

Skip the appendix dump. Under a smoothness assumption (nearby tasks have nearby gains, plus a residual \(\varepsilon_\phi\)), local weighted error roughly splits into:

- **Coverage** — how far neighbors sit; whether the bank has close enough peers.
- **Representation residual** — gain differences the embedding distance cannot explain (similar topic, different need for a calculator skill).
- **Execution noise** — variance from finite paired runs; repeats shrink it without changing coverage or representation.[1]

Those map to different evidence levers: grow the bank → closer neighbors; larger \(k\) → less noise but more transfer bias; more repeats → sharper \(\widehat{D}\) at fixed neighbors. RQ3 sweeps broadly match: repeats cut MAE across panels; support-pool and neighborhood benefits vary by benchmark.[1]

Two questions about the same medical quantity—one definition, one unit conversion—may share topic but not skill benefit. If the encoder only sees “medical + calculator,” gain prediction blurs. SkillDelta writes that assumption down instead of equating topical retrieval with causal gain.[1]


## Why “relevant → inject” looks good on dashboards and bad on incremental gain

The easiest production dashboards are with-skill success, retrieval hit rate, and skill-use count. All three can rise while you stay blind to \(\tau\). High with-skill success may mean the task was easy; high hit rate only means description matched the query; high use count may mean Always-on. SkillDelta forces another column: **success without injection**. Without it you cannot tell “the skill is working” from “the skill is spectating.”[1]

Failure modes one layer down:

- **Redundancy** — the agent already can; the skill restates — \(\tau\approx 0\), still paying context tax.
- **Interference** — workflow fights the model’s internal strategy or crowds out useful context — \(\tau\) can go negative.
- **Overstated descriptions** — frontmatter claims “for X,” but evals show gain only on a subset of X.
- **Polite self-judgment** — the model, staring at skill text, tends to say “use it” — use rates often exceed 91%, barely filtering.[1]

Progressive Disclosure cuts “irrelevant manuals in the window.” SkillDelta cuts “relevant but zero-gain (or negative-gain) manuals in the window.” Stacked, they approach “grow the harness, don’t pile context”: control lives in harness code and bank policy, not in another verbal vote each turn.[1]

Tied to [cost-inefficient behaviors](/blog/coding-agents-cost-inefficient-behaviors/): repeated retrieval wastes inside the loop; skill-layer waste often happens **outside** the loop—before work starts, the gate already opened wrong. Tied to [harness cost control](/blog/control-the-harness-control-the-cost/): routing picks a model tier; the gain gate picks whether to pay this skill’s context price. Tied to the [Agent Skills starter](/blog/agentskills-io-starter-guide/) and [Cloudflare security-audit-skill](/blog/cloudflare-security-audit-skill-for-coding-agents/): wiring and installable skills answer “do we have a patch?”; SkillDelta answers “is this patch worth applying now?”[1]

## Experiments: five benches × three agents

Inventory (Table 1): ToolQA 1,430 tasks / 14 skills; MedCalc-Bench 1,100 / 55; BigCodeBench 1,136 / 139; LogicBench 760 / 19; SpreadsheetBench 399 / 1 (external skill, not SRA-Bench corpus). Fixed target stacks: **Qwen-Turbo, GLM-5.3-Flash, DeepSeek-V4-Flash**; temperature zero, frozen artifacts, benchmark evaluators. Main protocol: leave-one-task-out—both outcomes of the target leave its support.[1]

Skill conditions differ: supplied skill on ToolQA/LogicBench; calculator skill on MedCalc; all gold skills on BigCodeBench; externally optimized spreadsheet skill on SpreadsheetBench. Qwen/GLM mainly one pair per task (LogicBench three-repeat means); DeepSeek three-repeat means on all five. Outcomes never pool across stacks.[1]

Unified main rule: same-family, cosine-weighted \(k=6\), \(\eta=0\). At that operating point SkillDelta raises observed success versus Always-off and saves execution tokens versus Always-on on all 15 panels; 14 success-gain bootstrap intervals exclude zero (Qwen SpreadsheetBench includes zero—read carefully). Equal-weight panel means: success **~63.12%** vs Always-on **~64.04%**, mean token savings **~20.8%** (range ~3.0%–49.4%); success is below Always-on on 12/15 panels—an explicit **trade some success for execution cost**, not a blanket win over Always-on.[1]


## What to watch in the main table

Table 2 lines up Off / On / Self-judge / SkillDelta success and token savings versus Always-on. Read it with three fixed questions:

1. **Versus Off, does SkillDelta raise success?** The paper reports yes on all 15 panels; most bootstrap intervals exclude zero.
2. **Versus On, how many execution tokens saved, for how much success?** Equal-weight means are roughly ~0.9pp lower success and ~20.8% fewer tokens—an operating-point choice, not a scoring trick.
3. **Does Self-judge buy near-On success while burning a router?** Use rates are usually extreme; tokens versus On are often worse (more expensive), not cheaper.[1]

Examples from Table 2 (for cross-checking the paper, not replacing it): Qwen-Turbo ToolQA — Off 28.6%, On 44.7%, SkillDelta 44.5%, ~10.4% tokens saved versus On; same stack BigCodeBench — SkillDelta 47.4% success below On 51.4%, but ~49.4% tokens saved versus On—the gate leans cost control. GLM MedCalc — SkillDelta 88.3% success above On 83.3%, with ~41.1% token savings—selective injection can avoid harmful injections, not only cut success.[1]

The matched-rate +4.3pp answers a different question: **given the same number of injections, are they assigned more smartly?** Random activation spreads uses evenly; SkillDelta steers them toward high-gain groups. If a product KPI mandates “skill-use rate ≥ X%” (compliance or narrative), matched-rate comparisons are more honest than Always-on success—Always-on is 100% use by definition.[1]

## How evidence scaling actually helps (RQ3)

Gain MAE sweeps over support-pool size \(n\), neighborhood \(k\), and repetitions \(r\). Three engineering takeaways:

- **Growing the bank is not automatically better.** Larger same-family pools often help ToolQA/MedCalc; LogicBench need not improve monotonically. Extra candidates must improve the chosen neighborhood and preserve gain structure.
- **\(k\) trades noise for locality.** Too few neighbors → noisy; too many → mixed effects. ToolQA likes intermediate \(k\); other benches are agent-sensitive.
- **Repetition is the cleanest lever.** With neighborhoods fixed, more repeats cut MAE on reported panels—coverage and representation unchanged; only historical \(\widehat{D}\) gets sharper.[1]

If budget is tight: prioritize **multi-pair runs on high-frequency task families**, not Always-on vs Always-off on every cold-tail item. Bank ROI is reuse; cold tails can start with a conservative (harder-to-inject) threshold or abstain.

## Results: where the +4.3pp comes from

At matched expected skill-use rates, SkillDelta beats random activation on **all 15** settings by average absolute **4.3** points (decomposition sums to ~4.33). Split:

- **Between-group allocation** ≈ **3.72** pp — the same expected number of injections steered toward groups with higher average observed gains.
- **Within-group selection** ≈ **0.61** pp — finer picks inside a group.[1]

Practical takeaway: **even when within-group ranking is weak, allocating budget toward “this kind of task eats skills” already pays.** Within-group value is clearest on ToolQA (three-agent mean ~4.41%, intervals exclude zero); elsewhere most within-group intervals include zero; Qwen-Turbo BigCodeBench even shows a negative within-group interval. BigCodeBench’s sparse groups and heterogeneous bundles thin local evidence—do not read global +4.3 as “every bench is fine-grained.”[1]

Keep ranking stories and decision stories separate: paired history usually ranks gain signs better, yet BigCodeBench sometimes favors lexical gates, and under distribution shift you can still gain versus Always-off while task-level ranking falls to chance. Online acceptance should track matched-rate success deltas and tokens, not AUROC alone.[1]

## Deployment sketch: DeepSeek Harness plugin

The accompanying DeepSeek Harness plugin scores a candidate skill **before the first model step**; the plugin path uses uniform neighbor averaging (a simplification versus main-table cosine weights) and injects only when predicted gain clears the threshold. Predictions trace to retrieved records and weights; new records append without refitting parameters. The public repo ships the core predictor, evaluation utilities, data-collection code, and the plugin; public release is code-first, with task-level outcomes in a review supplement.[1]

Wired to on-site harness narrative: progressive disclosure chooses **which body to load**; SkillDelta chooses **whether that body enters context now**. Chain them—narrow candidates, then gain-gate. Don’t replace the gate with “ask the model if it feels like using the skill”—that drifts back toward Always-on and burns another call.[1]


## How to compose with Progressive Disclosure

A shippable pipeline:

1. **Catalog layer** — disclose frontmatter only (or retrieve top-\(m\) cards); never dump every body.
2. **Candidate layer** — structured `load_skill` or a retriever yields one or a few candidate skills.
3. **Gain gate** — SkillDelta (or an isomorphic paired-gain estimator) decides injection **before the first real execution step**.
4. **Execute and write back** — after runs, log use/skip outcomes (even if online contrasts are sparse) into the bank; keep offline paired evals flowing.[1]

Do not fake step 3 with “ask the model once more.” The paper already measured self-judgment: expensive and biased open. The gain gate should be a harness code path—embed, look up the bank, weight, threshold—aligned with “grow the harness”: repeated control decisions become code.[1]

No paired bank yet? An honest default is not Always-on. Prefer: **skip or high-threshold costly skills; low-threshold only families with offline positive-gain evidence.** Open a collection pipe: sample tasks forced onto a skip arm, even at low rate—still better than pure self-judgment. Companions like SkillApt’s LOAD/ABSTAIN and environment validity can sit outside the gain gate: positive predicted gain with unsatisfied tool contracts should still ABSTAIN.[1]

## Limitations: bank cost, drift, BigCodeBench, representation

The authors are clear; take their boundaries as-is:

1. **Bank collection cost.** Paired runs from scratch are an investment; reported token savings exclude bank build, encoding, and retrieval. Best fit: **stable agent/skill conditions with repeated task arrivals**; model or skill-text changes need evidence refresh.[1]
2. **Agent/skill drift.** Historical \(\widehat{D}\) is stack-bound; main results never pool across stacks—don’t treat an old bank as eternal truth online.
3. **Weak BigCodeBench ranking.** Sparse groups, heterogeneous bundles, possible misalignment between representation and gain geometry; TF–IDF raises AUROC on some Qwen panels (BigCodeBench ~0.527 → 0.582). Semantic similarity ≠ gain similarity.[1]
4. **Representation is a product choice.** Embedding-3-small is for fair comparison, not claimed optimal; swap encoders or family definitions and the gate moves.

Companions like SkillApt stress LOAD/ABSTAIN and environment validity; SkillDelta stresses transferable \(\tau\) estimates and matched-rate allocation value. In production, stack a gain gate with an executability gate. Safety-critical instructions need separate assessment—don’t treat success rate and tokens as the only KPI.[1]


## Different from “just rewrite the skill body”

Weak gain often triggers another `SKILL.md` rewrite. SkillDelta allows better bodies but stresses **heterogeneous incremental gain across tasks**—open some, skip others. Body edits without a gate assume average improvement spreads evenly; between-group allocation alone carries most of the matched-rate edge. On sparse, bundled settings like BigCodeBench, prefer **family-specific thresholds** and correct allocation before chasing per-task precision; ToolQA-like single-skill families are where within-group selection pays. Skill releases should ship an **offline paired-eval summary** (which families show positive observed gain); upgrades without one deserve a conservative gate.[1]

## Three plain sentences for product owners

**Hit rate is not ROI**—relevance is description alignment; ROI needs success versus skip and token price. **Use-rate KPIs push Always-on**—score matched-rate success deltas instead of raw call counts. **The bank is an asset**—reuse amortizes collection; treat agent upgrades as impairment and rerun critical families. Hang Progressive Disclosure metrics (crash / token / success) beside SkillDelta’s matched-rate deltas on the same ops board.[1]

## Harness checklist: retrieve ≠ activate

For whoever owns the agent loop:

1. **Retrieval hit ≠ auto-inject.** Relevance qualifies a candidate; injection needs predicted incremental \(\tau\).
2. **Keep paired logs.** Success and tokens under use/skip for the same (or groupable) tasks train the gate better than a with-skill-only dashboard.
3. **Gate before the first model step.** Self-judgment as router is expensive and Always-on-shaped.
4. **Accept between-group allocation before chasing within-group miracles.** Most of the +4.3 is steering use toward groups that benefit.
5. **Bind the bank to the stack; recheck on agent/skill change.** Don’t hide bank and drift cost behind execution-token savings.
6. **Compose with Progressive Disclosure; don’t substitute.** Disclosure taxes the window; the gain gate asks whether a relevant tax is worth paying.[1]

Back on the site line: [grow the harness](/blog/grow-the-harness-not-the-context/) says don’t re-invent control in context every time; [cost control](/blog/control-the-harness-control-the-cost/) covers routing and governance; [cost habits](/blog/coding-agents-cost-inefficient-behaviors/) cover repeated labor in trajectories; Progressive Disclosure says don’t pour the whole library of manuals in before work starts. SkillDelta adds one sentence: **even a relevant manual still needs “how much do we win versus skip?”** Paired history is not another prompt slogan—it is an append-only, auditable, thresholded control-plane part.[1]

One-line handoff: progressive answers “how to load without blowing the window”; SkillDelta answers “whether to load at all.” Change the default from “relevant → on” to “paired gain clears the gate → on”; accept with matched-rate success versus random, not with Always-on-adjacent vanity numbers.

## References

1. Xu A, Zhang Z, Ding R, Xu F, Wang L. *When Does a Skill Add Value? Task-Conditional Gain Prediction for Selective Skill Use*. arXiv:2609.32274, 2026-09-26. <https://arxiv.org/abs/2609.32274> · PDF <https://arxiv.org/pdf/2609.32274> · Code <https://github.com/TankTechnology/skilldelta>
2. Companion: SkillApt — *Learning When to Activate Agent Skills from Counterfactual Evidence*. arXiv:2609.26863. <https://arxiv.org/abs/2609.26863>
3. On-site: [Progressive Disclosure: Why Eager-Loading Every Skill Breaks Agents at Scale](/blog/progressive-disclosure-agent-skills/)
4. On-site: [Agent Skills starter guide](/blog/agentskills-io-starter-guide/)
5. On-site: [Cloudflare security-audit-skill](/blog/cloudflare-security-audit-skill-for-coding-agents/)
6. On-site: [Three cost-inefficient coding-agent behaviors](/blog/coding-agents-cost-inefficient-behaviors/)
7. On-site: [Control the Harness, Control the Cost](/blog/control-the-harness-control-the-cost/)
8. On-site: [Grow the Harness, Not the Context](/blog/grow-the-harness-not-the-context/)
