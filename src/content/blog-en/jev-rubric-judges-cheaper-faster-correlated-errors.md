---
title: "Jev as a Rubric Judge: Cheaper and Faster, Wrong in the Same Places"
description: "A deep read of arXiv:2609.29769—typed classifier Jev vs three flash LLM judges on nine panels and 5,003 pairs: accuracy seldom separates, cost/latency gaps hit 29–325× and 30–220×, and correlated errors cap a cheap-first cascade at about +1.5pp."
pubDate: 2026-09-26T16:00:00+08:00
author: "Remy"
tags: ["jev", "ai-agents", "evaluation", "LLM", "agent-loop"]
lang: "en"
---

A rubric judge turns “is this output good?” into verdicts on individual criteria—whether a chemistry answer states a required relation, or which grammar level an essay reaches. The submission is a *unit*; a (unit, criterion) pair is a *pair*. LLM-as-judge already feeds HealthBench-style benchmarks and RL rewards. The bill is blunt: AutoRubric-style graders call once per pair, so cost grows with **units × criteria**.[1]

A typed classifier looks purpose-built for that pain: probabilities over a fixed answer set, no free text; billed per input token; one request can carry every criterion of a unit so the unit text is billed once. TypeSafe’s Jev is one such model. The concrete questions: **Can Jev replace a flash-tier LLM rubric judge?** When no judge matches humans, is the shortfall one judge’s or a shared “criterion text only” protocol? Can a cascade that keeps cheap confident verdicts and escalates the rest both save money *and* raise accuracy?

In [arXiv:2609.29769](https://arxiv.org/abs/2609.29769), Delip Rao and Chris Callison-Burch (UPenn) run a hard head-to-head: nine panels from seven public benchmarks, **5,003** pairs; Jev against GPT-5.6 Luna, Gemini 3.8 Flash, and DeepSeek V4.1 Flash—on **identical** pre-written criterion texts, zero-shot, no examples or tuning. Three claims: **accuracy seldom separates; cost/latency differ by more than an order of magnitude; correlated errors undo the cascade fantasy of “cheap first stage + LLM backup = cheaper and better.”**[1]

This site has covered [wiring Jev into Claude Code](/blog/jev-claude-code-10x-and-25-lines/), [ContractNLI mean-score vs single-decision gaps](/blog/jev-vs-llm-contractnli-same-scores-different-decisions/), [JevOut’s short-context flips](/blog/jevout-natural-context-flips-decision-models/), and [Jev-Mem](/blog/jev-mem-system-one-agentic-memory/). Those posts are about integration, stability, context robustness, and memory. This one moves to the **evaluation harness**: when Jev is a **rubric judge**, when cheap-and-fast is enough, when you still need humans or multi-judge controls, and when cascades or juries fail.

## Setup: nine panels, identical criteria, no example tuning

Every judge runs inside AutoRubric’s open-source criterion grader (the *harness*). Two **binary panels**—RiceChem (chemistry long answers, TA labels) and HealthBench (chatbot completions, physician majority)—ask whether a criterion is met. Seven **graded panels**—ELLIPSE, FED-Turn, FED-Dialogue, HelpSteer2, LFQA, USR-TC, USR-PC—score most criteria on ordered levels; four also embed binary criteria. Graded pairs are 3,778 of each matched judge’s 5,003.[1]

### How Jev answers

Jev costs about \$0.042 per million input tokens (output free). Requests used `jev-latest` (same-day check: jev-1.13.0). Besides one question per criterion, a request carries a structured *state*: unit input and submission—the same two fields an LLM judge gets. Jev **never sees** the harness system prompt; options stay in scale order; no judge sees harness 0–1 level values.[1]

Three primitives: **Noul** (\(P(\text{yes})\), threshold 0.5); **Choice** (distribution over option labels, argmax); **Score** (expected level from ordered descriptions, rounded, ties toward even). Main comparisons use **Jev Choice** (with the three LLMs: *matched judges*); **Jev Score** is the alternative graded framing. On binary panels, Choice/Noul use a *wrapper* (fixed instruction + MET/UNMET definitions). Confidence ranks pairs; it is not treated as calibrated probability.[1]

### How the LLM judges answer

Each LLM judge uses harness defaults, **one call per pair**. Options are shuffled every call against position bias. Temperature is 0 except Luna (API default 1.0). All three emit reasoning tokens (Luna far fewer). The multi-choice prompt asks for attention to negation/scope/qualifiers, no retreat to the middle when unsure, and the lower-quality level when a submission contradicts itself without a dominant stance.[1]

### Where the criterion text comes from

Graded criterion text comes from rubric versions **frozen before any judge ran**. FED/USR questions become statements; HelpSteer2 levels are paraphrased; LFQA levels come from that benchmark’s GPT-4 rating prompt; ELLIPSE keeps corpus level descriptions and ends each trait sentence with “native-like facility” for level 5. Judges read these versions; original raters read each benchmark’s own instructions. No judge sees labels, holistic scores, or strata.[1]

Human labels: graded = mean of rater levels, rounded half-up; binary = majority or TA. Multi-rater panels also define a **rater reference** (each rater vs the rounded mean of the others)—where a single rater lands, **not** an upper bound on judges. Graded panels were 10%/20% stratified samples written to disk before any judge call.[1]

## Accuracy: only 8 of 27 paired comparisons separate

For each panel × LLM, the authors compute a paired accuracy difference on pairs both scored, resample units 10,000 times, and take a 95% interval. Excluding zero = **separated**; 90% interval inside ±5 points = **parity**; neither = **inconclusive**. The 5-point margin was set after verdicts were collected.[1]

Of 27 Jev Choice vs LLM comparisons, **only 8** separate. Jev’s leads fall mostly on binary panels; deficits only on graded panels, chiefly against Gemini. Most other comparisons are too imprecise to show equivalence.[1]

Binary: Jev Choice **81.0%** on RiceChem vs 77.8% / 76.1% / 79.2% (Luna / Gemini / DeepSeek); **77.1%** on HealthBench, second to Gemini’s 79.6%. Separated from Luna on both and from Gemini on RiceChem; parity with DeepSeek on both.[1]

Graded: 16 of 21 do not separate. Largest gap is Gemini’s **16.4** points on ELLIPSE (14.1–18.7); Gemini also leads on FED-Dialogue and HelpSteer2. Luna leads on USR-PC and trails Jev on HelpSteer2; DeepSeek never separates. Six graded comparisons reach parity, ten are inconclusive. Holm keeps four separations (two each way). Resampling larger sampling groups yields **eight** separations, five Jev leads—but the story holds: Jev often holds on binary; on graded it is never the most accurate matched judge, and Gemini is first or tied everywhere except LFQA.[1]

Two baselines sting: HelpSteer2’s modal constant predictor hits **60.0%** exact accuracy above every judge; LFQA’s provenance baseline (ChatGPT vs Reddit author) hits **68.1%** with no significant exact-accuracy gap to the judges. Rankings sometimes order systems that all lose to a no-read baseline.[1]

Jev Score separates ahead of Choice on four graded panels and has higher within-one accuracy on all seven. On FED-Turn the Score–Choice gap is **10.5** points vs a 2.9-point LLM spread—mostly from the primitives’ probabilities, not decoding rules. Binary wrapper matters too: vs bare Noul, +10.7 on RiceChem and +1.0 on HealthBench. On graded panels Jev Choice abstains on 28/3,414 ordinal pairs, mostly where raters also mark N/A.[1]

## Cost and wall time: 29–325× more expensive, 30–220× slower

Summed over nine panels, Jev Choice cost about **\$0.063**. Luna ~**29×**, DeepSeek ~**66×**, Gemini ~**325×**. Per-panel ratios run from **18×** (Luna@HealthBench) to **770×** (Gemini@FED-Dialogue). Wall time: Jev ~**29**s; Luna 859s, Gemini 950s, DeepSeek 6,298s—roughly **30–220×**. Ratios understate Jev at equal concurrency (Jev concurrency 8 sharing one API; LLMs 16–32).[1]

Cost ratios tend to grow with **criteria per unit**: each criterion adds an LLM call but not a Jev request. Gemini rises from 121× on HealthBench (~2.0 criteria/unit) to its peak on FED-Dialogue (10). A single LLM call for all criteria of a unit, or an LLM without reasoning, would narrow ratios—neither was costed.[1]

If your eval is binary checklist work and throughput-sensitive, this edge is an order-of-magnitude fact. If you also need graded scores that track humans, “cheap” alone is not enough.

## Shared departures from human labels: judges resemble each other more than the raters

Section 5 finds the shortfall versus human labels **shared** across four matched judges, not vendor-specific.[1]

### Judge–judge exceeds judge–label

On every graded panel, mean **judge–judge** QWK exceeds mean **judge–label**; on five panels even the least-agreeing judge pair beats the best judge’s agreement with labels. On ELLIPSE all four are wrong on **64.0%** of pairs; picking whichever judge is right still reaches only 36.0%, below the rater reference (51.4%).[1]

### Gaps concentrate on negative-offset criteria

Offset = mean predicted − mean labelled level. Across 31 criteria with a rater reference, mean offset tracks mean gap at Spearman \(\rho=0.92\). Of 35 graded criteria, all four judges share a negative offset on **25** and a positive on only 2. The shortfall is “placed lower,” not mainly “scrambled ranking.”[1]

### A constant shift removes most of the gap

A leave-one-out integer level shift per criterion (clipped), maximizing exact accuracy, breaks gap–offset tracking (\(\rho=0.16\)) and leaves no criterion more than 8.4 points below the unshifted rater reference. ELLIPSE is largest: Gemini **−0.77** to Luna **−1.28**, Jev Choice **−1.25**; Jev Choice is below the label on **86.1%** of predictions and above on **0.5%**. Labels put 36.3% of pairs at levels 4–5; no judge exceeds 4.2% there. Shifting ELLIPSE up one level raises Jev Choice from **13.4%** to **50.4%**—fixing **location**, not order (trait means still correlate with holistic scores at 0.62–0.72).[1]

### Observational account: omitted scale conventions

The authors offer an **observational** account: raters may follow conventions the criterion texts omit—population norms, corpus-relative standards, annotation habits. USR criterion texts are byte-identical on Topical-Chat and PersonaChat, yet engaging’s negative offset is large on PersonaChat and small on Topical-Chat. ELLIPSE grammar levels hinge on quantifiers plus a “native-like facility” gloss—zero-shot judges reading “some errors” against native writing park learner essays low. Criteria whose levels name observable features (verbosity, cohesion) are where judges come closest.[1]

Alternatives remain: shared priors, reluctance to grant top levels, harness-prompt effects, label noise. “Harness prompt alone” is ruled out (Jev never sees it); pure noise fails on ELLIPSE and some unanimous misses. Without exemplar/rewrite interventions, “missing conventions” and “shared priors” stay entangled. Treat the shared downward bias as **protocol-level**: switching flash vendors need not remove the offset.[1]

## Core mechanism: correlated errors undo the cascade

This is the quantitative reading of “Wrong in the Same Places”—easy to misread when you design an eval stack.

### Confidence should make Jev a natural first stage

A cascade scores every pair with a cheap judge; pairs below confidence \(\tau\) are **deferred** to an LLM; **kept** pairs keep the cheap verdict. It can beat the fallback only where the cheap judge alone is right on kept pairs. Jev Choice’s confidence ranks its own errors on six graded panels (AUROC **0.57–0.70**); ELLIPSE is the exception (AUROC **0.49**). It also fails inside otherwise-healthy panels: LFQA factuality **0.41**, USR-PC engaging **0.52**—when almost all errors sit on one side of the label, confidence is not automatically a deferral signal.[1]

### LLMs nearly repeat Jev’s most confident errors

When Jev is wrong, an LLM giving the **same wrong answer** is a repeated error. Against an independence baseline (fixed criterion and label), repetition exceeds the baseline on every graded panel; in Jev’s top confidence band, LLMs repeat the wrong answer on about **80.5%–92.8%** of those verdicts (baseline 33.6%–63.7%). On a confident-error sample—12 highest-confidence Jev Choice errors per graded panel, 84 pairs—LLMs repeat the wrong answer on **242/252** verdicts (**96.0%**) vs ~**50.3%** independence. HealthBench (Jev Noul): 32/36 match Jev vs ~10 expected.[1]

One-line reading: **when unit + criterion text strongly favor one answer, typed classifier and flash LLMs point there together—even when the label does not.** Most confident errors sit on split pairs, but 11/12 HealthBench confident errors have unanimous physician labels—so this is not only “noisy labels.”[1]

### Replayed cascades: at most +1.5pp / +2.0pp

Post-hoc Jev-first cascades on recorded verdicts (Choice graded, Noul binary). **Oracle** thresholds use all pairs; **cross-fitted** thresholds choose \(\tau\) / fallback / best single judge on a random half of units and score the other half (50 halvings).[1]

Cross-fitted: no cascade beats the best single judge by more than **1.5** points on average (peak HealthBench). Six panels fall **below** by 0.1–7.3 points; majority-positive halvings only on HealthBench, USR-PC, LFQA. Oracle raises the max to **+2.0** (HealthBench; USR-PC +1.3)—neither significant on kept pairs. On FED-Turn, Jev Score alone beats every cascade by ≥**5.2** points.[1]

Matching the best LLM under cross-fitting: on six panels, **16%–48%** of that LLM’s cost for 0.2–1.8 fewer held-out points; on RiceChem (~**6.6%** cost) +1.2 points. ELLIPSE/FED-Dialogue must defer nearly everything even under oracle—bottleneck is Jev accuracy and (ELLIPSE) dead confidence, not an untuned \(\tau\).[1]

Cascade and fallback agree on deferred pairs, so:

\[
a_{\text{cascade}}-a_{\text{fallback}}=s_{\text{kept}}\bigl(a^{\text{kept}}_{\text{Jev}}-a^{\text{kept}}_{\text{fallback}}\bigr)
\]

Graded panels have few “Jev-only correct” pairs (~12–37 vs Table 4’s fallback), and confidence often defers them. Correlated errors cut both ways: **keeping confident verdicts barely hurts accuracy (cost win) and barely helps it (no silver-bullet cascade).**[1]

### Juries do not stably beat the best single judge

The three-LLM median never beats the most accurate matched judge on any of nine panels (up to −12.8 on ELLIPSE). Adding Jev Choice never helps significantly. On the confident-error sample the median still returns Jev’s wrong answer on **82/84** pairs.[1]

## Reusable checklist: selection, cascading, validation

Aligned with Table 5’s evidence tags (measured / observed / not tested)—executable checks, no invented numbers.[1]

### When to seriously consider Jev as a judge

1. **Binary checklist criteria** like RiceChem or HealthBench: Jev Choice ranks first / second among matched judges, at 18–326× lower cost depending on panel and model.[1]
2. **Hard throughput/bill constraints**, accepting “often inseparable from a flash judge, sometimes behind the best LLM”: most of 27 comparisons are inconclusive or at parity—reasonable for “swap in the cheap judge and run.”[1]
3. **Graded criteria when abstention is unnecessary**: try Jev Score; still report Choice for matched comparisons. Score leads on four panels and cannot choose NA.[1]
4. On binary criteria, give Jev the **wrapper**: +10.7 (RiceChem) / +1.0 (HealthBench) over bare Noul.[1]

### When you still need humans—or multi-source checks

1. **Norm-referenced scales** (learner essays vs a population): shared negative offsets are common; exemplars are not tested; switching flash vendors does not remove location bias.[1]
2. **Absolute top-level wording** (“Entirely accurate”): raters and judges can systematically disagree—LFQA factuality is the clear case.[1]
3. **Labels encoding conventions or another construct**: HelpSteer2 correctness tracks helpfulness at \(r=0.94\); USR-TC `_nofact` is unanimous MET for raters and almost UNMET for Jev.[1]
4. **Judge as independent ground truth for release gates / RL rewards**: when judge–judge exceeds judge–label, you may optimize consensus, not human intent. Report offset, both agreements, and unanimous vs split pairs.[1]

### When cascades / juries fail—and when they still earn their keep

1. **Cascade to cut cost: yes.** Cross-fitted cascades often approach the best LLM at a fraction of cost; on RiceChem they can be cheaper *and* more accurate.[1]
2. **Cascade to raise accuracy: do not assume.** Caps near +1.5pp (cross-fitted) / +2.0pp (oracle); six panels average negative.[1]
3. **Check confidence per criterion** before deferral—ELLIPSE, LFQA factuality, USR-PC engaging lock in correlated mistakes if you “keep when confident.”[1]
4. **Report repeated-error share vs independence baseline.** ~96% replay on confident errors means diversity is already gone.[1]
5. **Do not expect a three-flash median to beat the best single matched judge**—it never does here, and still repeats the same confident errors.[1]
6. **Correct per-criterion offset before stacking judges** when labels exist; leave-one-out shifts do more than same-text juries.[1]
7. **Prefer changing what judges are told** (exemplars, observable level features) over adding same-text judges.[1]

## How this sits next to the site’s Jev line

- Versus [Jev × Claude Code](/blog/jev-claude-code-10x-and-25-lines/): bounded judgments leave the autoregressive hot path; here the eval side shows a **cheap judge holds on binary checklists**, while graded “holding” is often vs another flash judge, not vs humans.
- Versus [ContractNLI](/blog/jev-vs-llm-contractnli-same-scores-different-decisions/): similar means can still flip decisions; here accuracies often fail to separate yet judges are **wrong on the same pairs**—aggregate sameness hides correlated errors and kills the cascade fantasy.
- Versus [JevOut](/blog/jevout-natural-context-flips-decision-models/): short context flips **decision routing**; this paper measures shared offsets from **human labels** and mutual error replay. Control-plane input vs evaluation-plane output—bounded options help software, not automatic ground truth.
- Versus [Jev-Mem](/blog/jev-mem-system-one-agentic-memory/): if memory/retrieval enters judged unit text, switching judge vendors may not switch the same mistakes; validation needs repeated-error visibility.

## Closing

Jev as a typed classifier rubric judge—nine panels, 5,003 pairs, shared criteria vs three flash LLMs—draws a sober map: **serious cheap substitute on binary checklists; on graded criteria often inseparable from some flash judge but behind the best LLM; 29–325× / 30–220× cost and latency edges; shared directional departures from humans (judge–judge often above judge–label); confidence that should power a cascade, yet ~96% LLM replay of Jev’s most confident errors caps gains near +1.5pp (cross-fitted) / +2.0pp (oracle).**[1]

Cheaper and faster ≠ independent ground truth. Copy into the harness first: select by criterion type, report offset and correlated errors, use cascades to save money rather than chase points, keep humans or exemplars on convention-dense scales—so judge outputs are one audited stage, not “consensus equals correct.”

## References

1. Delip Rao, Chris Callison-Burch. *Jev vs. LLMs as Rubric Judges: Cheaper, Faster, and Wrong in the Same Places*. arXiv:2609.29769, 2026. https://arxiv.org/abs/2609.29769 · HTML https://arxiv.org/html/2609.29769
2. On this site: Jev × Claude Code. https://redreamality.com/blog/jev-claude-code-10x-and-25-lines/
3. On this site: Same scores, different decisions (ContractNLI). https://redreamality.com/blog/jev-vs-llm-contractnli-same-scores-different-decisions/
4. On this site: JevOut short context can flip decision models. https://redreamality.com/blog/jevout-natural-context-flips-decision-models/
5. On this site: Jev-Mem memory control plane. https://redreamality.com/blog/jev-mem-system-one-agentic-memory/
