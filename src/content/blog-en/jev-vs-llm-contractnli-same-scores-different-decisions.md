---
title: "Same Scores, Different Decisions: Jev vs Nine LMs on ContractNLI"
description: "arXiv:2609.27678 compares Jev and nine hosted/local models on ContractNLI: cost, latency, baseline accuracy, and All-12 persistent correctness rank differently. Close means can hide flips—select on persistent correctness, not accuracy alone."
pubDate: 2026-09-24T00:00:00.000Z
author: "Remy"
tags: ["jev", "evaluation", "agent-loop", "contractnli", "ai-agents"]
lang: "en"
---

When you pick a model for an agent or harness, the most common line is: “These scores are close enough—just take the cheap one.” A [preprint](https://arxiv.org/abs/2609.27678)—*Same Scores, Different Decisions: Evaluating JEV and Language Models for Legal Document Understanding*—takes that sentence apart on ContractNLI: close averages can hide **completely different individual judgments**; nearly identical mean correctness can still leave **very different counts of targets that stay correct across request configurations**.[1]

We already covered [how to wire Jev into Claude Code](/blog/jev-claude-code-10x-and-25-lines/): it is not a chat model but a structured decision layer—you submit `state` and typed `questions`, and get structured answers with probabilities, not natural-language assistant messages.[2] This post takes a different cut: **when the decision object is many hypotheses over one contract, how should you read the eval, and what should a selection checklist look like?** One boundary up front: this is not legal advice, and it does not inflate “All-12 on a small panel” into “Jev is universally more stable.” The paper itself says the small panel does not establish a general stability advantage.[1]

Why a full post? Many agent failures are not “two points lower on an offline board.” They look like **the same judgment flipping after visible context, output count, or field order changes**, or a model repeatedly returning the same wrong answer while monitors celebrate “high consistency.” ContractNLI turns both into reproducible numbers.

## What the task looks like: one contract, many judgments

ContractNLI (Koreeda & Manning, 2021) casts contract understanding as document-level natural language inference: given a contract and a set of hypotheses, the model labels each hypothesis **E / C / N** (entailment / contradiction / not mentioned). The official test split has **123** contracts and **2,091** judgments (968 entailments, 220 contradictions, 903 not-mentioned).[1][3] Evidence-span extraction is out of scope; every prediction is scored against existing annotations—no new human labels, no model-as-judge.

Why this matters for agents: real loops rarely ask once. On the same document you may ask in parallel whether information is confidential, whether copies may be made, and what obligations remain after termination. Those judgments can be requested **jointly** or **separately**; the gold answers stay tied to the contract while the request packaging changes. If you only look at accuracy under one joint request, you never see **which judgments flip when the packaging changes**. The paper opens on the same two difficulties: aggregate accuracy conceals which judgments change; repeated agreement is not correctness—a model may consistently return the wrong label.[1]

The comparison is **Jev 1.13.0** against nine language models: Qwen3.5-4B / 9B, Gemini 3.5 Flash-Lite, Gemini 3.1 Pro Preview, GPT-5.6 Luna / Terra, GPT-6 Astra, Claude Sonnet 5, and Claude Haiku 4.5.[1] Jev takes the contract as shared `state` and each hypothesis as a native Choice question; generative models get semantically aligned classification instructions and return a JSON label map. The baseline requests all 17 labels jointly; invalid responses stay in the denominator and count as wrong—closer to an agent’s “this turn produced no legal decision” than “drop failures and report a higher score.”

Three research questions run through the paper; keep them in view while reading:

1. **RQ1:** What trade-offs among cost, response time, and accuracy do Jev and its comparators show?
2. **RQ2:** Does higher accuracy imply that more judgments remain correct across repeated request conditions?
3. **RQ3:** Which individual decisions change when visible hypotheses, requested outputs, or output order change?

## Reproducible eval design: what conditions A–D isolate

If you only copy one reusable skeleton onto your own product, this section matters more than “who scored highest.”

### How the baseline is run

The baseline issues **one** joint request for all 17 labels per contract. A valid response must contain exactly the requested IDs and one of the three allowed labels for each. Accuracy covers every intended judgment; invalids count wrong. Macro-F1 and valid-response coverage are reported alongside. Responses that exhaust the generation allowance before producing final labels remain failures of the evaluated configuration.[1]

Cost and latency are measured over the same requests as quality, including failed attempts. Hosted APIs use public prices or provider bills; local Qwen uses a rental-equivalent of **$2 per GPU-hour** to convert wall-clock time into per-contract cost—a valuation of observed inference time, not a measured bill, and not a claim about cloud throughput.[1] Latency is client elapsed median (preparation, connection, network, service-side processing, validation), one client machine, one in-flight request per model, no automatic retries.

### Stability panel: 30 anchors × 4 conditions × 3 repeats

The stability panel preselects **30** anchors from the test set (one target hypothesis per selected contract) with seed `20260922`, independent of labels and model predictions. Each anchor runs **4** conditions × **3** repeats—**12** answers; every model completes **360** stability requests. The panel is a subset of the accuracy evaluation, so the two analyses are complementary views of overlapping contracts, not unrelated datasets.[1]

The four conditions keep the contract and gold label fixed; only “what is visible” and “what must be emitted” change:

| Condition | Visible hypotheses | Requested outputs | What it mainly probes |
| --- | --- | --- | --- |
| **A** | Anchor only | Anchor label only | Single target, minimal context |
| **B** | All 17 | Anchor label only | Catalog visibility changes; output set fixed |
| **C** | All 17 | All 17 labels, anchor first | Output workload / structure changes |
| **D** | All 17 | All 17 labels, anchor last | Requested output order changes |

The split is clean: **A→B** changes the visible catalog; **B→C** changes output workload and structure; **C→D** changes requested output order. Primary scoring uses only the fixed anchor; extra labels in C/D do not inflate the number of primary targets. Catalog order is fixed in B/C/D.[1]

That design maps directly onto three production edits you already make:

- Cutting tokens by asking only the current gate instead of stuffing related clauses into the prompt — like A↔B;
- Batching to fewer API calls by emitting a full label map instead of one label at a time — like B↔C;
- Schema serialization, field sorting, or “put the important field last” logging habits — like C↔D.

### All-12, stable wrong, paired flips

**All-12 correct** means every answer across the four conditions and three repeats is the correct label. Mutually exclusive remaining categories include twelve valid identical wrong labels (**same wrong / stable error**), twelve valid but changing labels, or any set containing at least one invalid (invalidity takes precedence). Every selected anchor stays in the denominator.[1]

Two quantities are easy to confuse:

- **Mean correct:** average correctness over the same 30 anchors’ 360 responses (invalids wrong). It shares targets with All-12, but one scores per response and the other scores whether a target survives every configuration.
- **Paired change rate F(b,c):** among anchor–replicate pairs valid under both conditions, whether the labels differ. Changes split into correct→wrong (regressions), wrong→correct (corrections), and wrong→different-wrong. With complete coverage, the accuracy difference is corrections minus regressions—**not** the total number of changed decisions—so you can see “same accuracy, many flipped judgments.”[1]

Disagreement under unchanged-request repetition is a reference for natural variability; subtracting it from a cross-condition change rate does **not** yield a causal effect. The paper is explicit about that.[1]

## Baseline: higher accuracy usually costs more and runs slower

Official-test baseline: **123** contracts and **2,091** judgments per model; failed requests remain incorrect; cost and median latency include all 123 attempts.[1]

| Model | Accuracy (%) | Macro-F1 | Cost (USD/contract) | Median time (s) | Valid calls |
| --- | --- | --- | --- | --- | --- |
| Jev 1.13.0 | 77.38 | 72.23 | 0.000228 | 1.24 | 123/123 |
| Gemini 3.1 Pro Preview | 83.21 | 77.71 | 0.008474 | 3.73 | 123/123 |
| Gemini 3.5 Flash-Lite | 82.54 | 76.96 | 0.001353 | 1.60 | 123/123 |
| GPT-5.6 Terra | 82.59 | 77.23 | 0.011839 | 11.61 | 123/123 |
| Claude Sonnet 5 | 82.40 | 76.38 | 0.011352 | 3.27 | 123/123 |
| GPT-6 Astra | 81.83 | 76.55 | 0.091890 | 20.94 | 123/123 |
| Claude Haiku 4.5 | 79.44 | 74.46 | 0.005396 | 5.65 | 123/123 |
| GPT-5.6 Luna | 78.96 | 73.77 | 0.000931 | 1.74 | 123/123 |
| Qwen3.5-9B | 79.15 | 74.57 | 0.077361 | 134.64 | 122/123 |
| Qwen3.5-4B | 74.22 | 71.67 | 0.053653 | 86.87 | 117/123 |

Read the table in three layers; do not collapse it into a slogan:

1. **Cost and latency.** Jev is lowest: about **$0.000228** per contract and median **1.24s** (P95 about 1.59s). Flash-Lite is roughly six times the cost for about +5.16 accuracy points; Luna’s paired gap versus Jev is unstable (about −0.05–3.11 points).[1]
2. **Baseline accuracy.** All seven hosted LMs have higher point estimates than Jev; Gemini Pro leads at **83.21%**. A frontier point estimate is not “every comparator is reliably better.” Spending more along the observed frontier is uneven: Gemini Pro costs about 6.26× Flash-Lite for roughly +0.67 points, with a paired interval that crosses zero.[1]
3. **Local Qwen.** Generation-budget exhaustion leaves some requests invalid (4B 117/123, 9B 122/123). Even an optimistic bound that fills every missing label with the correct answer lifts them to at most about 79.10% / 79.96%—still below Flash-Lite’s observed 82.54%. The gap is not only a truncation penalty.[1]

Workload also changes speed rankings. With a fixed catalog of 17 hypotheses, moving from one label (B) to seventeen (C) shifts Jev’s median from about 1.15s to 1.22s, Flash-Lite from about 0.99s to 1.86s, and Luna from about 1.10s to 1.78s.[1] Ask **faster under your real output workload**, not “who is faster” in the abstract.

If a decision sits on a hot path every turn, **cost × call volume** and **P50/P95 latency** bite before “two more accuracy points.” Jev occupies the low-cost, low-latency end; hosted large models occupy higher baseline accuracy—an observed frontier under stated prices, not an eternal ranking.[1]

## All-12: close means, very different persistent correctness

The stability panel scores the same **30** anchors across four conditions × three repeats.[1]

| Model | Mean correct (%) | All-12 correct | Same wrong | Changed valid | Any invalid |
| --- | --- | --- | --- | --- | --- |
| Claude Sonnet 5 | 86.67 | **24/30** | 1 | 5 | 0 |
| Jev 1.13.0 | 79.44 | **23/30** | 5 | 2 | 0 |
| Gemini 3.1 Pro Preview | 85.28 | **22/30** | 2 | 5 | 1 |
| GPT-5.6 Luna | 81.94 | **22/30** | 3 | 5 | 0 |
| GPT-6 Astra | 76.39 | **22/30** | 6 | 2 | 0 |
| Gemini 3.5 Flash-Lite | 82.50 | 21/30 | 4 | 5 | 0 |
| GPT-5.6 Terra | 80.56 | 20/30 | 2 | 8 | 0 |
| Claude Haiku 4.5 | 81.94 | 19/30 | 2 | 9 | 0 |
| Qwen3.5-9B | 79.17 | 18/30 | 2 | 8 | 2 |
| Qwen3.5-4B | 77.50 | 17/30 | 2 | 8 | 3 |

The contrast to remember is **Jev versus Qwen9B**: mean correct is nearly identical (**79.44%** vs **79.17%**), yet All-12 is **23/30** vs **18/30**.[1] How errors are distributed decides whether an average still means “this target stays right after production config drift.” Jev has five anchors wrong throughout and two that change; Qwen9B has two stable-wrong, eight changing-valid, and two with invalids—similar totals of correct responses, fewer targets that survive every condition.

Observed rankings also diverge: Gemini Pro leads baseline accuracy; Sonnet has the highest All-12 point estimate; Jev ranks second on All-12. The two quality measures do not use identical target sets; even when mean and All-12 share the stability anchors, “close means, different persistence” remains visible.[1]

Nail the paper’s own caveat: **Sonnet 24/30 versus Jev 23/30 is one target**; the paired 95% interval is roughly −10.00–16.67 percentage points and crosses zero—the **small panel does not establish a general stability advantage for Jev over Sonnet**.[1] You may say “on this condition set and sample, Jev’s All-12 is competitive”; you may not say “Jev is universally more stable.” Gaps versus Haiku / Qwen4B are larger in point estimates (4–6 targets); some paired intervals exclude zero, but comparisons remain exploratory and unadjusted for multiplicity.[1]

Agreement also misleads: Jev and Astra each repeat the same label on 28/30 targets, but five of Jev’s and six of Astra’s consistent labels are **stable wrong**; Sonnet has only one stable wrong among its consistent targets.[1] Treating “keeps saying the same thing” as successful stability turns errors into reliability.

## Request configuration flips individual judgments: averages can stand still

RQ3’s core picture: condition-level accuracy can stay flat while paired judgments change labels.

- **Qwen4B:** Conditions A and B have identical accuracy, yet **9** of **90** paired responses change—4 regressions, 4 corrections, 1 wrong→wrong.[1]
- **Terra:** B and C have equal accuracy despite **7** changes—3 regressions, 3 corrections, 1 wrong→wrong.[1]
- **Haiku:** C→D (output order only): **14/90** changes, including **12** regressions; accuracy falls about 11.11 points (descriptive paired interval about −23.33 to −1.11).[1]

Corrections and regressions cancel in the average. You see “same accuracy”; production sees “this gate passed today and failed tomorrow”—especially after you cut to “anchor only,” batch to “emit all 17,” or move the target label to the end of the JSON for logging hygiene.

Jev shows **zero C→D changes** on this panel; the paper also notes that Jev’s question-key-order intervention is **not** equivalent to an autoregressive output-position intervention, and a finite sample with no changes does not establish invariance.[1] When you read an eval, write down the intervention semantics; copying the change rate alone is weaker.

Unchanged-request repetition also jitters. Qwen9B changes 15/90 pairs A→B while also changing 12/90 repeat pairs within A; when C→D changes 12/88, repeats within D still change 11/86.[1] Cross-condition rates must be read next to same-request repeats.

Development diagnostics amplify the same phenomenon on separate contracts: Qwen4B changes 87 of 510 labels between joint and single-hypothesis requests while the correct count moves by only four; on another anchor panel, A and B share accuracy yet 24/90 pairs flip (12 corrections + 12 regressions).[1] Those samples stay separate from the official-test tables, but they are enough to say: **“scores are close enough” is a risky engineering slogan.**

## Class recall and development diagnostics

Overall accuracy is weighted by class support (220 contradictions vs 968 entailments and 903 not-mentioned). Jev has the highest observed contradiction recall (170/220, about 77.27%); Gemini Pro is lower there (135/220) but recovers more entailment and not-mentioned correct labels for a net gain of about 122—and higher overall accuracy.[1] Astra leads entailment-recall point estimates; Sonnet leads not-mentioned. These are descriptive contrasts on unequal support. For harness work: **if loss concentrates in one false-negative class, the overall leaderboard winner may not be the model you ship.** Agent gates (routing, safety refusal, human takeover) are rarely symmetric losses—keep a column for the class or cost-weighted error you care about.

Development diagnostics (separate contracts) motivate the design rather than another leaderboard:[1] aggregate correctness can hide many individual flips because corrections and regressions cancel; sensitivity must be read next to same-request repetition; grouping can redistribute errors across classes so accuracy dips while Macro-F1 rises. That is why this post insists on All-12, stable wrong, and directional paired changes—not one mean table.

## Agent / harness selection: a practical checklist

Reading the paper as an engineering checklist is more useful than reading it as “Jev won.” The site’s Jev post already argues it fits judgments that must be fast and structured.[2] This eval adds: **how to accept those judgments.**

### What to report

1. **Do not select on mean / accuracy alone.** Report side by side: baseline accuracy (or Macro-F1), **All-k / persistent correctness**, cost per call, median and tail latency, valid-response coverage.
2. **List stable wrong separately.** Repeated agreement that is repeatedly wrong is more dangerous than occasional jitter—monitors that only watch consistency will miss systematic bias.
3. **Count invalid responses as failures; do not silently drop them.** Generation-budget exhaustion, missing JSON keys, illegal labels—in an agent that usually means decision failure or fail-open this turn. Dropping them in the eval systematically overstates post-launch experience.

### How to build a minimal cross-condition panel

You do not need 30×4×3 on day one. Shrink the paper’s skeleton:

1. Fix **N anchor judgments** from real traffic (sample independent of model outputs; record the seed).
2. Define at least three request packagings that match knobs you actually change in production: single vs multi-visible questions, single label vs batch map, field order.
3. Repeat each packaging **R** times (R≥3 is sturdier).
4. Primary metric: whether the anchor is correct across all packagings × repeats; secondary: condition-level accuracy, directional paired changes, invalid rate.
5. Log cost and end-to-end latency, and **keep failed attempts in both the denominator and the cost**.

You are then accepting “does this target stay right after config drift,” not “a lucky mean from one joint prompt.”

### How to place models in the loop

1. **Split the cost path from the accuracy path.** Hot-path routing / gates / compression can use a low-cost decision layer; higher-baseline-accuracy review can use hosted large models. The observed cost–accuracy frontier roughly sits near Jev, Luna, Flash-Lite, and Gemini Pro; Sonnet / Terra reach accuracy near Flash-Lite at higher cost and need not extend that two-dimensional frontier.[1]
2. **Treat decision points like the eval: watch persistent correctness.** Common production drifts: multi-question visibility vs single question; one label vs a batch map; field order changed by schema serialization. An anchor panel for critical gates is closer to real failure modes than offline accuracy alone.
3. **Write pricing and deployment assumptions down.** Local GPU rental equivalents, public API rates, latency that includes network and queueing—change the price, reasoning budget, or concurrency and the frontier moves. Put assumptions in the selection doc so “we measured this” still reconciles six months later.
4. **Put interface differences in the comparison table.** Jev’s C/D is question-key order; autoregressive models change generated-answer order. Both can be called “order sensitivity”; the mechanisms differ, so you cannot claim “immune to position” across interfaces.

## Boundaries and what not to extrapolate

The paper’s Limitations are blunt; this blog should not be bolder:[1]

- Test set: 123 contracts; stability: 30 anchors; all share the same 17 hypothesis types—evidence is thin for other legal questions or domains.
- Baseline accuracy and All-12 use different target sets; ranking gaps can reflect both target composition and condition sensitivity.
- Three repeats give limited information about possible responses; a few targets can move rankings on a small panel; intervals are descriptive and unadjusted for multiple comparisons.
- Sonnet / Haiku / Terra were added after earlier results were inspected; task and scoring rules were fixed, but model selection itself is exploratory.
- Hosted models may change behind a fixed identifier; interfaces, inference settings, and provider routes are not fully aligned; Jev’s order intervention is not equivalent to autoregressive output ordering.
- **All-12 gaps on the small panel must not be written as “Jev is generally more stable than Sonnet.”**

On ethics: this is model-behavior evaluation in a research setting—**not professional legal or financial determination**.[1] ContractNLI is used under CC BY 4.0; retain attribution to the dataset authors.

## Closing: same scores, different decisions

Back to the title. *Same scores, different decisions* is not copy—it is an empirical finding: averages can hide flips; agreement can hide stable errors; cost and latency split “fits the hot path” from “rank on an offline board.”

Operational takeaways for people building agents / harnesses:

1. Put **cost, latency, accuracy, and persistent correctness** in the same selection report;
2. Run a small A–D-style panel on critical judgments instead of one joint prompt;
3. In this eval, Jev wins on cost/latency while hosted large models lead baseline accuracy; Jev is competitive on stability, but **do not** inflate a small sample into a general advantage;
4. Request configuration (visible hypotheses, output count, order) changes individual judgments—that is exactly the layer a harness should own, and the place where “scores are close enough” most needs correcting.

Full numbers and condition definitions defer to the paper: [arXiv:2609.27678](https://arxiv.org/abs/2609.27678).[1] For wiring paths, see [Jev × Claude Code](/blog/jev-claude-code-10x-and-25-lines/).[2]

## References

[1] Fan Zhang et al. *Same Scores, Different Decisions: Evaluating JEV and Language Models for Legal Document Understanding*. arXiv:2609.27678, 2026. https://arxiv.org/abs/2609.27678

[2] Remy. *Jev × Claude Code: Don’t Treat It as a Chat Model—Four Integration Paths and a 25-Line Minimal Implementation*. https://redreamality.com/blog/jev-claude-code-10x-and-25-lines/

[3] Yuta Koreeda and Christopher D. Manning. *ContractNLI: A Dataset for Document-Level Natural Language Inference for Contracts*. Findings of EMNLP 2021.
