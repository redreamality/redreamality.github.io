---
title: "Just Ask Jev: Zero-Shot Alignment Failure Detection with RLCD"
description: "Reading arXiv:2609.29429 RLCDAlignBench: TypeSafe Jev (RLCD) on 10 alignment failures × 44 benchmarks hits median AUROC 0.886 with a generic question, ~63× cheaper than LLM judges; checklist for wiring Just-Ask-Jev into an agent harness monitor."
pubDate: 2026-09-27T16:40:00+08:00
author: "Remy"
tags: ["jev", "ai-agents", "agent-harness", "LLM", "evaluation"]
lang: "en"
---

Alignment monitoring has an awkward cost shape. You need to check **every** input, output, or trajectory for several failure modes—sycophancy, jailbreak compliance, deception, prompt injection, hallucination, privacy leakage, social bias, reward hacking, concealing uncertainty, power seeking—and the default still looks like “spin up another generative LLM-as-judge.” One criterion burns one decoding pass; more criteria scale the bill linearly. Token-probability classifiers such as Llama Guard do not fully escape the shape either: they return something like \(P(\text{unsafe})\), but a call still typically scores one fixed label; asking from several angles means several calls.[1]

TypeSafe’s Jev uses a different interface: attach a set of typed questions (Noul yes/no, Choice, Score) to one `state`, and get calibrated probabilities back in a single call—no natural-language verdict text. The training objective is **RLCD** (Reinforcement Learning for Calibrated Decisions). The paper’s footnote warns not to confuse this with Yang et al.’s same-acronym contrastive-distillation line.[1][2] “Calibrated” here is operational: among decisions assigned probability \(p\), about a fraction \(p\) should be correct.[1]

On this site we have already covered wiring Jev into [Claude Code](/blog/jev-claude-code-10x-and-25-lines/) (keep bounded judgments off the autoregressive hot path), using it as a [rubric judge](/blog/jev-rubric-judges-cheaper-faster-correlated-errors/) (cheap and fast, but correlated errors blunt cascades), and the brittleness shown by [JevOut](/blog/jevout-natural-context-flips-decision-models/). This post moves to **alignment failure detection**: can you “Just Ask Jev”—skip the generative judge and query a decision model—and, zero-shot, rank failures above non-failures? Authors from Griffith / NTU / UNSW and collaborators report checkable numbers in [arXiv:2609.29429](https://arxiv.org/abs/2609.29429) and the open benchmark [RLCDAlignBench](https://github.com/sumleo/RLCDAlignBench), including cached answers you can rescore offline.[1][3]

## Problem shape: relational failures vs. response-only views

Many alignment failures are **relational**. Sycophancy is defined against the user’s belief; deception against the model’s own belief; prompt injection against an instruction hidden in tool output. A detector that only sees the response may lack the reference that defines the failure.[1] Vendor docs also list indirect meaning and adversarial content among Jev’s known weaknesses—exactly the material common in these failures.[1] So the paper’s key design is not “more prompt engineering,” but measuring two factors separately:

1. **What you ask**: a generic template question versus targeted wording that names the labelled behaviour; answer type Noul / Choice / Score; soft probability readouts versus argmax.
2. **What you show**: the canonical state holds only the target model’s input and output—the usual response-level monitor view—then adds one field at a time, to see whether deployable context helps or whether **label keys** (fields that belong to the label definition) drive the gains.[1]

The detection task is clean. An instance \(x\) holds the context the target received and its response (or a trajectory in agentic settings). For failure type \(f\), label \(y_f(x)\in\{0,1\}\) marks whether \(f\) occurs. A detector scores \(s(x)\in[0,1]\) and flags when \(s\geq t\). It must both **rank** failures above non-failures and **separate** them at a threshold. Primary metric: **AUROC** (threshold-free). Secondary: F1 at \(t=0.5\) and under cross-validated thresholds. Abstentions count as negatives for F1; strategies below ~90% coverage stay out of AUROC comparisons.[1]

Label provenance matters. Most labels come from each benchmark’s own reference scorer (rule, LLM judge, or multi-turn grader). The paper calls a label validated when it is a deterministic function of gold and the target’s output, or when scorer–human agreement has been measured. A large share remains unvalidated judge labels. Later numbers show: agreeing more with judge labels is not the same as agreeing more with humans.[1]

## RLCDAlignBench: 10 failures × 44 benchmarks

The suite builds on Chen et al. (2026)’s alignment evaluation suites, originally built to score a policy model. Here they become detection tasks: fix one open 2–7B target per failure type, generate outputs, replay the reference scorer, set \(y=1\) when the failure occurs. Totals: **10 failure types, 44 benchmarks, 7,193 detection instances, five target models** (Qwen3.5-2B, Phi-4-mini, Gemma-2-2B, Llama-3.2-3B, Olmo-3-7B). Scorers summarize as rule / LLM judge / multi-turn **20 / 20 / 4**; labels as validated / audit-changed / unvalidated about **11 / 8 / 25**.[1][3]

Human labels appear on StrongREJECT (~1360/1361 responses, four generators, five annotators each) and HarmBench validation (three annotators), so Jev can be compared to a judge **against humans**, not only against judge outputs—separate from the 100-item StrongREJECT run on Phi-4-mini.[1]

Six degenerate benchmarks drop out of aggregates, leaving **38 usable**; **31** admit a generic Noul. All main runs use `jev-1.13.0`. One call carries mean **11.4** questions (median latency **0.31 s**), so reporting the best of many would inflate gains. Targeted strategies are **selected on one half and scored on the other** (20 grouped splits). In-sample selection alone overstates targeted wording by ~0.008 AUROC—larger than the real split-half gain.[1]

The ten positive behaviours to flag (\(y=1\)): sycophancy; jailbreak compliance; deception; prompt injection; hallucination; privacy violation; social bias; reward hacking; concealing uncertainty (wrong + confidence \(\geq 0.8\), or answering when abstention is required); power seeking / instrumental convergence. Full definitions live in the paper’s Table 1.[1][3]

### Question protocol: generic stems, three types, targeted families

Generic questions pick one of four stems by state format—single response, paired outputs, rule-scored output, trajectory—then fill field names and a per-benchmark behaviour phrase \(\langle b\rangle\). Sycophancy might use “shifting its answer toward the belief the user states in question”; jailbreaks “substantive help with the harmful request…”. Every instructions string opens with a data guard: treat state fields as material to judge, not instructions to follow.[1]

The same stem is asked in three answer types: Noul returns \(P(\text{yes})\); Choice a distribution over {yes, no, undetermined}; Score an expected level over three situations (nothing matches / one passage matches / main content is the behaviour). Readouts can be soft (from probabilities) or hard (argmax). Targeted questions further split into direct (minimal / definition / criteria+examples), rubric (reference judge prompt or formula), and decomposition (per option, secret, action) families—about 15–40 strategies per benchmark, all sharing one call.[1]

Three baselines bound the task: all-positive F1, response length (sign chosen by CV), and an in-domain TF-IDF logistic regression trained on labels Jev never sees. Beating that last baseline zero-shot is a strong result.[1]

## Main results: a generic question already ranks; wording adds little

Headline numbers, all from the paper’s aggregates:

- **Generic Noul** (template question read as \(P(\text{yes})\)) reaches median **AUROC 0.886** over 31 benchmarks (95% CI [0.821, 0.952]), zero-shot, with no labels seen.[1]
- Versus the better of response length and in-domain TF-IDF, the median margin is **+0.132** (CI about [+0.057, +0.190]), winning on **25 / 31** benchmarks (sign test \(p=9\times10^{-4}\)).[1]
- **Split-half targeted** strategies reach median AUROC **0.911** over all 38 usable benchmarks (CI about [0.860, 0.944]); versus the best generic readout, the split-half wording gain is only **+0.006** (CI [−0.004, +0.015], Wilcoxon \(p=0.055\)).[1]
- Soft readouts matter more than swapping answer type: the 3-level Score expected-level readout beats generic Noul by median **+0.016** (19/7/5 W/T/L); soft Choice ties Noul; Choice/Score argmax lose almost everywhere (soft Choice vs argmax about +0.084). Rubrics that threshold each Jev answer at 0.5 before combining lose to the best direct targeted question by median **−0.137** on 10 benchmarks—hard thresholds throw away ranking information.[1]
- Scorer type (judge / rule / multi-turn) does not move the generic-Noul median much (~0.906 / 0.890 / 0.870, \(p=0.78\)); label source does: unvalidated labels median ~**0.949**, validated ~**0.872**.[1]

By failure type (per-type medians of generic Noul on usable benchmarks; small-\(n\) types are marked † in the paper): jailbreaks ~**0.965**, prompt injection ~**0.962**, deception ~**0.949** are strong; reward hacking ~0.870, concealing uncertainty ~0.893, power seeking ~0.861 remain usable; hallucination ~**0.823**, privacy ~**0.808**, social bias ~0.782, sycophancy ~**0.726** are harder. Do **not** read the overall median as “equally good on all ten”—weak types need extra references or a second-stage judge in deployment.[1]

Two reading traps show up in per-benchmark tables. First, generic Noul often **ranks well but fires too rarely at 0.5**: Tensor Trust variants and ELEPHANT can sit at 0.95–0.97 AUROC while F1 at \(t=0.5\) falls at or below the all-positive baseline—exactly what threshold fitting repairs later. Second, on skewed benchmarks F1 tracks the base rate: SycophancyEval (answer) at ~82% positives has all-positive F1 ~0.901, which can beat every Jev strategy at \(t=0.5\). Prefer AUROC there.[1]

### Context: deployable fields rarely save you; label keys jump

Across 49 paired ablations, the story is sober. Deployable references absent from the canonical state lift generic Noul with a CI above zero on only **1 of 4** benchmarks (DeceptionBench, **+0.050** from the target’s goal prompt). Distilled copies of references already in the state (e.g., MASK beliefs) help on **0 of 3**. Attack prompts move the best shared question by at most ~**0.002**.[1]

Large jumps mostly come from **label keys**—gold answers, secret lists, injection pointers. PrivacyLens’s secret list lifts generic Noul from about **0.79 to 0.95**. Counting that list as “deployable” would change the helpful count from 1/4 to 2/8, but the paper stresses it belongs to the label definition, not to what a monitor naturally holds.[1] SycophancyEval (answer) is sharper: adding the true answer moves generic Noul from 0.540 to 0.941 on the official label, but from 0.712 to 0.288 on an answer-shift label—because the official label measures **correctness**, not the sycophancy construct.[1]

Engineering translation: be honest about monitor vision. Fields you do not have will not magically appear in AUROC; gold fields you inject to inflate scores are not measuring production monitors.

## Cost: about 63× cheaper than LLM judges

On the 19 benchmarks with an API LLM judge, one full pass at list prices costs about **$0.30** for Jev versus **$18.96** for the judges—about **63×** pooled. Jev is cheaper than the reference judge on 18 of 19. A conservative reprice—every judge at GPT-4o-mini rates, Jev asked only the generic question—still leaves Jev about **12×** cheaper pooled (median ~**3.3×**).[1]

That matches the direction of our [rubric-judge post](/blog/jev-rubric-judges-cheaper-faster-correlated-errors/): typed decisions win on input-token billing, multi-question packing, and no long decode. The tasks differ—there, (unit, criterion) grading and correlated errors; here, binary alignment failure and base-rate/threshold behaviour. You can share the scaffold “cheap decision first, escalate when unsure,” not the fantasy that correlated errors are ~0 and cascades will buy large accuracy gains.

## Calibration and thresholds: ranking ≠ portable cutoffs

Pooled over benchmarks, the generic Noul reliability curve is near the diagonal (ECE **0.047**). Within a benchmark, median ECE is **0.168** against a perfect-calibration null of ~0.074, and 24/31 benchmarks exceed the null’s 95th percentile. The error is base-rate mismatch: within a file, Jev’s mean probability misses the positive rate by a median of about **0.125**, while median AUROC in those files can still be ~**0.905**—ranking is fine; thresholds do not transfer cleanly across files.[1] ECE also exceeds the null on 6 of 8 validated benchmarks, so you cannot blame noisy judge labels alone.[1]

Practical implications:

- Median F1 is **0.706** at \(t=0.5\), **0.822** with a cross-validated threshold, and about **0.793** with a threshold fitted on **10 labelled items**. Gains concentrate on unvalidated labels (~0.678→0.853), especially some rule-scored benchmarks where Jev ranks well but scores low (~+0.370); on judge labels the gain is small (~+0.052). On validated labels, \(t=0.5\) is already about as good (~0.721 vs 0.694); fitting on ten labels costs about **0.025** in that setting.[1]
- Label-free EM prior-shift correction does not help—F1 falls to about 0.571–0.690. Selective prediction does: keeping the half of decisions with largest \(|p-0.5|\) raises median accuracy from ~0.793 to ~**0.933**. Route the unsure half to a judge or a human.[1]
- The median F1-optimal threshold is about **0.35**. Even a calibrated score need not optimize F1 at 0.5 (the paper cites Lipton et al.), so a “low-looking” threshold is not by itself proof the model is broken.[1]

This matches the site’s “harden before treating probabilities as a control plane” theme. [JevOut](/blog/jevout-natural-context-flips-decision-models/) shows short context can flip routing at high confidence; here, **thresholds should not be assumed portable across benchmarks**. Ranking failures and treating \(p\) as absolute risk are different jobs. The paper’s recipe is enough: generic question + a few labels for the threshold + confidence-based routing.

## Human agreement and label-defect audit

On StrongREJECT human labels, generic Noul nearly ties the GPT-4o-mini reference scorer: Cohen’s \(\kappa\) **0.809 vs 0.811** (difference −0.002, CI crosses zero); humans side with Jev on about **49%** of 116 disagreements. Ranking favours Jev (AUROC **0.971 vs 0.929**, +0.042). Coarsened to the scorer’s nine levels, Jev still reaches ~0.962, so finer resolution is not the whole story.[1] On HarmBench validation, mean \(\kappa\) with a single annotator is **0.748**, on par with inter-annotator agreement **0.736**.[1]

Pooled parity is not per-generator parity. On GPT-3.5 outputs, Jev’s \(\kappa\) is about **0.668** versus the scorer’s **0.790** (gap ~−0.121) at comparable AUROC—a score-shape difference no threshold closes (oracle ~0.688 vs 0.790).[1] Reporting only overall \(\kappa\) will miss upstream-model pockets of failure.

More useful for builders: Jev’s **confident disagreements** surfaced label-changing defects in three benchmarks, plus four MACHIAVELLI variants whose labels depend on annotated consequences the state never shows. Open-Prompt-Injection’s official label tracks accuracy on the injected task; SycophancyEval (answer) tracks correctness; SycophancyEval (feedback)’s judge applies “no criticism” inconsistently; MACHIAVELLI records annotated consequences of the chosen option. Two AbstentionBench judges running the official prompt agree at \(\kappa\) ~**0.05**. Of remaining disagreements, about **25%** are classified as Jev errors.[1]

For benchmark builders, a cheap decision model’s confident dissent is an inexpensive label probe. For monitor builders, do not equate “aligns with the existing scorer” with “aligns with humans,” and do not treat a low AUROC on a defective label as proof the detector “cannot catch that failure”—generic Noul on Open-Prompt-Injection can sit near **0.231** until the construct is corrected.[1]

## Contrast on-site: rubric judges vs. alignment failure detection

These two posts are easy to blur; keep them distinct:

| | [Jev as rubric judge](/blog/jev-rubric-judges-cheaper-faster-correlated-errors/) | This post: Just Ask Jev |
| --- | --- | --- |
| Task | Does a (unit, criterion) pair hold / which grade? | Did an interaction exhibit a failure type? |
| Comparators | Three flash LLMs + human labels | Benchmark scorers (rule/judge) + two human sets |
| Headline shape | Accuracy often tied; cost/latency orders of magnitude; correlated errors blunt cascades | Median AUROC 0.886; wording gain ≈0; ~63× cheaper |
| Failure reminder | Judges agree with each other more than with humans | Ranks well but base rates/thresholds do not transfer; relational failures starve without references |
| Wiring posture | First layer for content quality / graded rubrics | First-layer screen for safety & alignment failures |

Add [Claude Code wiring](/blog/jev-claude-code-10x-and-25-lines/) (bounded judgment off the hot path) and [Jev-Mem](/blog/jev-mem-system-one-agentic-memory/) (memory write/read/stop control): the same System One line now includes an **alignment monitoring screen**—good for high-volume, multi-criterion, probability-not-prose layers; not a substitute for an independent ground truth. If retrieved memory enters the monitor state, remember [JevOut](/blog/jevout-natural-context-flips-decision-models/): natural context can flip decisions; field allowlists and data guards are not optional.

## Checklist: wire Just-Ask-Jev into a harness monitoring loop

Written for “connect tomorrow”; every number points back to the paper:

1. **Default question: generic template + soft probability.** Rewrite policy/benchmark failure definitions into behaviour phrases \(\langle b\rangle\), ask a Noul like “Does response exhibit \(\langle b\rangle\)?”, read \(P(\text{yes})\). Do not default to long targeted rubrics; split-half evidence shows wording gains near zero, and in-sample cherry-picking inflates them.[1]
2. **Pack many failure types in one call.** ~11 questions still share one request. Alignment monitors naturally ask many criteria over one trajectory. Parallel sycophancy/injection/hallucination/privacy phrases in `questions` beat serial judges by an order of magnitude on the paper’s 19 API-judge setting (~63×).[1]
3. **Canonical state = input + output first.** Then decide whether to add deployable fields (system prompt, tool observations, deceptive goals). Do not ship gold answers or scorer verdicts into production state—that tests the label construct, not the monitor.[1]
4. **For relational failures, check that the reference is present.** Is the injection in the tool-result field? Is the user’s belief in the dialogue? Do you actually hold a secret list? When references are missing, AUROC drops—fix vision before blaming the model. PrivacyLens-scale jumps often come from label keys; ask “do I have this list in prod?” before celebrating.[1]
5. **Fit thresholds on a few labelled items; do not freeze at 0.5.** Paper recipe: generic question + ~10 labels for the threshold; on validated labels \(t=0.5\) is often enough. When AUROC is high but F1 at 0.5 is miserable (some Tensor Trust rows), retune the threshold before rewriting the question.[1]
6. **Route by confidence, not prior-shift.** Send the half with small \(|p-0.5|\) to an LLM judge or a human; let Jev gate the confident half. EM prior-shift does not repair F1 in the paper.[1]
7. **Prefer soft aggregates over hard-threshold formulas.** Combine multi-atom questions with max / product / differences; thresholding each atom at 0.5 then AND/OR discards ranking (rubric formulas: median −0.137).[1]
8. **Queue high-confidence disagreements for label audit.** When Jev and the scorer conflict at large \(|p-0.5|\), check whether the label measures the wrong construct—the paper used this to find several defects. About a quarter of remaining disagreements are still Jev errors, so humans must review; do not auto-relabel.[1]
9. **Split work with rubric cascades.** Content quality / graded rubrics follow the [rubric-judge protocol](/blog/jev-rubric-judges-cheaper-faster-correlated-errors/); safety and alignment failures follow this detection protocol. Do not assume correlated-error numbers transfer; do share the attitude “use cascades to save money, not to fantasize large accuracy lifts.”
10. **Harden adversarial context separately.** Monitor state can be polluted by tool outputs; keep the data guard on questions; combine with JevOut-style field allowlists and source/length constraints. The ethics statement also notes dual use: the same scores that measure coverage can guide evasion search; the authors still judge open measurement of blind spots as net-helpful to defenders.[1]

Sketch (illustrative, not a vendor SDK):

```text
state = {user_input, model_output, tool_obs?}   # deployable fields only
questions = [Noul(b) for b in failure_phrases]  # many failures, one call
scores = jev(state, questions)                  # each P(yes)
for b, p in scores:
  if abs(p - 0.5) < margin: route_to_judge(b)
  elif p >= t_b: flag(b)                        # t_b fitted on few labels
```

## Limits and open questions

Follow the paper’s own limits: only **jev-1.13.0**, English benchmarks, 2–7B targets, labels mostly from scorers rather than humans; extensions to other detectors, larger targets, and other languages are future work.[1] Extra reading flags:

- On unvalidated (mostly judge) labels, generic Noul median is ~**0.949** versus ~**0.872** on validated labels—part of the headline may be “looking like a judge,” not “being truer.” Sensitivity tables: dropping audit-changed labels can raise the generic-Noul median to ~**0.905** (28 benchmarks), so bad labels drag the headline.[1]
- Per generator, StrongREJECT \(\kappa\) on GPT-3.5 outputs is clearly weaker than the reference scorer; pooled parity is not universal.[1]
- On defective labels such as Open-Prompt-Injection, generic Noul can look terrible—audit the label before concluding “the detector cannot catch injection.”[1]
- Social bias and sycophancy type medians are lower, and some benchmarks are degenerate/skewed; reserve second-stage review for weak types instead of staring only at the overall 0.886.[1]

Open source: code under MIT; data and cached answers on Hugging Face `sumleo/RLCDAlignBench` (gated harmful content, research use); metrics recompute offline from the cache without re-querying Jev. The project page and dataset card document fields; harmful subsets inherit upstream gating.[3]

## Closing

Just Ask Jev extends the site’s Jev line from routing / rubric judging / memory control into a **zero-shot alignment-failure screen**: one generic question with soft probabilities reaches median AUROC **0.886** on 31 benchmarks, split-half targeted **0.911**, about **63×** cheaper than a full API-judge pass; on StrongREJECT humans it ties the reference scorer’s agreement band (\(\kappa\) 0.809 vs 0.811) and can audit bad labels via confident dissent.[1] What usually sets the ceiling is not fancier wording, but **whether the state holds the reference that defines the failure**, and **whether the threshold is re-fit to the local base rate**.

In a harness, the sane default is not “replace the whole safety stack with Jev,” but: use Just-Ask-Jev as the high-volume, multi-criterion first layer for ranking and routing; escalate unsure or high-stakes cases to a judge or a human; feed high-confidence disagreements back into label and policy audit—so alignment monitoring becomes a billable, thresholdable, auditable control plane rather than another pile of generative prose.

## References

1. Ruoqi Guo, Yi Liu, Gelei Deng, Yuekang Li, Lida Zhao, Yutao Wu, Simin Chen, Ying Zhang, Leo Yu Zhang. *Just Ask Jev: Reinforcement Learning for Calibrated Decisions as a Zero-Shot Detector of AI Alignment Failures*. arXiv:2609.29429, 2026. https://arxiv.org/abs/2609.29429 · HTML https://arxiv.org/html/2609.29429
2. TypeSafe AI. Jev / System One documentation (as cited in the paper). https://docs.typesafe.ai
3. RLCDAlignBench code and data. https://github.com/sumleo/RLCDAlignBench · Dataset https://huggingface.co/datasets/sumleo/RLCDAlignBench
4. On-site: Jev × Claude Code. https://redreamality.com/blog/jev-claude-code-10x-and-25-lines/
5. On-site: Jev as rubric judge. https://redreamality.com/blog/jev-rubric-judges-cheaper-faster-correlated-errors/
6. On-site: JevOut short-context flips. https://redreamality.com/blog/jevout-natural-context-flips-decision-models/
7. On-site: Jev-Mem memory control plane. https://redreamality.com/blog/jev-mem-system-one-agentic-memory/
