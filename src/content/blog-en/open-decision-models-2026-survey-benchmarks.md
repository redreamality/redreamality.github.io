---
title: "One Month After Jev: Open Decision Models, the Counter-Evidence, and How to Choose"
description: "Jev made decision models a category. This survey groups a dozen-plus hosted and open models by how they work, checks vendor claims against Decision Index, JevBench and Red Hat's tests, explains why public scores, latency and \"calibration\" don't compare, and ends with a comparison table and an agent-loop checklist."
pubDate: 2026-10-11T10:40:00+08:00
author: "Remy"
tags: ["jev", "System One", "evaluation", "agent-loop", "open-source", "ai-agents"]
lang: "en"
---

When TypeSafe launched Jev in September, the pitch was simple: give it a `state` and a few typed questions (yes/no, pick one, rate 0–5) and it returns a probability for every option, generating no text and billing only input tokens at \$0.042 per million.[1] A month later that shape is a category. Cloudflare open-sourced Clef; Liquid shipped a hosted d1, then d1-3B and d1-omni-600M; Perplexity, H2O and vLLM Semantic Router published open weights; Microsoft launched Microsoft-Decision-1 on Foundry; OpenAI's Decisions API entered public beta. The community added JEV-27B (a Jev distillation), the encoder model Laya, the contrastive model CLM, and AnyJev, which turns any LLM into a decision endpoint.[3][5][14][18][19][20][22]

This site's eight earlier Jev posts all look at Jev itself (index at the end). This one looks at the category. **Everyone now says "calibrated", "fastest" or "number one". Which board and which measurement do those claims match? And when should you use a decision model at all, rather than an LLM judge or a small trained classifier?**

Every number comes from a model card, official docs, a leaderboard's raw JSON or the author's own post, read October 10–11, 2026 (Beijing time). Where I couldn't get the original, I say so and quote no figures.

## First, what a decision model actually reads

The contract is nearly identical everywhere: a state plus questions with options goes in, a probability distribution per question comes out, with zero or near-zero output tokens. Jev's endpoint is `POST /v1/systemone`, with three primitives: Noul (yes/no), Choice (pick one) and Score (levels 0–5).[1] That interface is now the de facto standard. Clef, Laya's server, Strands Decider, H2O's shim and llama.cpp's `llama-server` all expose `/v1/systemone`, and vLLM merged a generic `/v1/systemone` endpoint on October 8, dropping the opt-in flag a day later.[4][9][15][17][19][28] OpenAI is the exception: its Decisions API has its own schema (`predicate`, `choices`, `levels`, plus a refusal answer type) and is not a drop-in replacement.[20][21]

Underneath, there are roughly four routes.

**Read the option-label logits.** An ordinary autoregressive LLM reads the prompt, and only the probabilities of label tokens (A/B/C, yes/no) at the next position are kept and softmaxed. vLLM's generic endpoint does this and reports 2 output tokens.[17] AnyJev's "L0" works the same way, untrained, with debiasing and calibration on top, behind Ollama, vLLM or any OpenAI-compatible server.[22] It is the cheapest route, but raw logits are very order-sensitive: on a 20-class BANKING77 subset with Qwen3-8B, reordering options alone changed 23% of raw answers.[22]

**Add a decision head to a frozen or LoRA-tuned backbone.** Clef puts a small transformer "joint schema head" on Qwen3.8-27B, trained with a Brier loss plus RLCD. Perplexity's pplx-decider uses a noncausal-attention readout. H2O-Lightning-4B and Microsoft-Decision-1 are post-trained from Qwen3.5. Strands Decider 2B ships a reproducible recipe that runs in 1 hour 10 minutes on 8×H100.[4][14][15][18][19]

**Skip the decoder.** Laya is ModernBERT-large (421M parameters) with an option-marker head. d1-omni-600M is built on LFM2.5-Encoder-350M and takes text plus images or audio. CLM embeds the state and each candidate action and compares them, so its probabilities only mean something within a candidate set.[6][9][10]

**Distill Jev, or think when unsure.** AutoTrust's JEV-27B-VL and JEV-9B use Jev 1.13's output distributions as targets; JEV-9B's mean KL from its teacher on 25,376 held-out questions is about 0.019, "indistinguishable by KL" in the authors' words.[11][12] GEV-26B-Decide and AnyJev's Tacit mode generate reasoning first when confidence is low, at which point "zero output tokens" no longer holds.[13][22]

Order bias comes mostly from the first route, the "whose calibration" question is sharpest for the fourth, and the third is fastest but weakest zero-shot.

## Who's in this wave: four groups, by whether you can run it

**Hosted APIs only.** Jev 1.13 takes text only, 64k tokens per request (32k for `state` plus the longest question). One set of weights serves every customer, it can't be fine-tuned, and English is its primary language; the docs say CJK scripts are "handled but not equally well".[1] OpenAI Decisions runs on gpt-6-luna, accepts images, and is in public beta.[20] Microsoft-Decision-1 is post-trained from Qwen3.5-9B, sold on Foundry and OpenRouter at \$0.042 per million input tokens with free output.[18] Liquid's hosted d1 went live in late September with an undisclosed base, called through the Liquid API's Python and TypeScript SDKs.[7][8]

**Open weights from big vendors.** Cloudflare's Clef (27B) and Clef-flash (9.4B) are Apache-2.0 and also callable on Workers AI, launched alongside an RL fine-tuning platform.[3][4] Liquid's d1-3B (3.1B, built on LFM2.5-VL-3B, text plus images, 32k context) and d1-omni-600M (587M) use the LFM Open License 1.0, not Apache.[5][6][7] Perplexity has pplx-decider v1 and v1.1 (27B, Apache-2.0).[14] H2O-Lightning-4B is Apache-2.0 on stock vLLM plus an open shim.[19] vLLM-SR's Decision 2.0 is a 0.6B–27B family led by Vega 27B.[16]

**Community and independent teams.** AutoTrust's JEV-27B-VL, JEV-9B and GEV-26B-Decide; Convai's Laya; Contrastive-LM's CLM-v0.1-8B; Strands Labs' Strands Decider 2B.[9][10][11][12][13][15]

**Tools and leaderboards.** Tools: Nokia Applied Research's AnyJev, vLLM's endpoint and llama.cpp's GGUF support.[17][22][28] Boards: the community Jev Decision Index (117 entries in the October 10 snapshot, plus a vision board), Benchmark Heaven's JevBench (separate open-weights and API boards), and hotchpotch's S1MB, which stitches together over a hundred benchmarks.[23][24][25]

On attention, one line: Laya and JEV-27B-VL each have over three thousand Hugging Face likes. That shows people are looking, not that the models work.

## Checking vendor claims against the boards: four gaps

### Gap one: high on public items, a drop on new domains

Decision Index 0.3.1 weights public items at 20%, private items on the same skills at 50%, and private items in new domains at 30%, precisely to catch tuning to the public suite.[23] Public vs new-domain scores (snapshot October 10, 15:54 Beijing time):

- Jev: 57.96 vs 54.98, a 3-point gap; total 60.11, rank 3.
- pplx-decider v1.1: 62.25 vs 55.57, gap 6.7; total 62.75, rank 1.
- Clef: 61.71 vs 41.88, gap nearly 20; total 53.08, rank 19.
- Clef-flash: 56.15 vs 42.50, gap 13.7; total 47.61, rank 33.
- d1-3B: 48.99 vs 27.96, gap 21; total 40.08, rank 53.

Cloudflare's launch post calls Clef the Decision Index leader, and its card's table shows Clef winning most rows.[3][4] But the card describes "our internal run" of the 0.2.1 suite, linking to an evaluation site Cloudflare hosts.[4] On 0.3.1, Clef's public score stays top tier while its new-domain score falls to the low forties. Clef is genuinely strong at tool calling and intents (BFCL 98.5, BANKING77 macro-F1 94.2, both above Jev), but the same table has GPQA Diamond at 48.0 vs Jev's 78.3, MMLU-Pro 65.9 vs 82.7 and BBH 73.7 vs 92.9.[4] Where multi-step reasoning is needed, the gap is large; the benchmarks the post showcased are the kind it is good at.

### Gap two: same model, different board, different rank

JevBench's composite weighs intelligence, calibration, speed and cost at 25% each.[24] So H2O-Lightning-4B tops the open-weights board at 72.5 against Jev's 71.5. On "capability" alone (intelligence and calibration), pplx-decider v1.1 scores 82.8 and Clef 75.3, both above H2O's 75.0, yet their composites are 20.6 and 16.8 because the cost axis sinks 27B models.[24]

That cost is an estimate. Open-weights models have no tariff, so JevBench prices them at the base model's reference market rate, marked "estimated, not charged": \$0.217 per thousand decisions for pplx and \$0.249 for Clef, against Jev's list-price \$0.032.[24] If you own GPUs, your real cost may be very different. "Number one" depends on your axis weights and on whether you accept that estimate.

Versions move too. Jev scored about 57.9 on Decision Index 0.2.1, the figure the GEV and pplx cards quote; on 0.3.1 it is 60.11.[13][14][23] Cards quoting "Jev's score" from different versions can't be compared side by side.

### Gap three: which latency is "fastest"?

Microsoft says Decision-1 was the most accurate and fastest in its 36-benchmark comparison: 2.5× quicker than runner-up H2O-Lightning-4B and 35× quicker than GPT-6 Sol.[18] JevBench measured it natively on Azure Foundry at a 0.46-second median, with capability 70.8 (seventh on the API board, below Jev's 77.1) and 21 context-limit failures.[24]

The gap comes from method. JevBench adjusts self-hosted latency to measured × 2 + 0.15 s, labeled "assumption, not measured"; H2O's measured 29 ms median becomes 209 ms.[24] H2O's card says Microsoft compared against that adjusted figure, and that Microsoft's announcement gave 85 ms.[19] Microsoft's figure tables are images I couldn't check line by line, so treat 85 ms as H2O's account.

Hosted latency isn't stable either. JevBench measured Jev's median at 0.62 s in v1.5 and 0.24 s in v1.6; the Decision Index measured 524 ms and states that this "includes HTTPS and concurrent service scheduling".[23][24] Same model, more than 2× apart.

### Gap four: the top spot changes weekly

JEV-27B-VL's card says "#1 of 20 on the vision board".[11] In the vision data of October 10, 07:53 (Beijing time), pplx-decider v1.1 was first (70.58) and JEV-27B-VL second (69.60).[23] JevBench published several revisions on October 10 alone.[24] A rank on a card only describes the day it was written.

## Counter-evidence one: Red Hat puts them on guardrail duty

Red Hat asked a different question: if you already have a small classifier, is a decision model worth switching to?[26]

They ran two English-only guardrail tasks through NeMo Guardrails and EvalHub. Prompt injection: a purpose-trained deberta classifier (about 200M parameters, on an M1 CPU) scored 89.01% at 54 ms; Qwen3.6-35B as an LLM judge topped the table at 89.31%; Jev scored 86.35% at 348 ms and Laya 85.44%. Content safety: Jev led at 86.20%, Nemotron 1.13 points behind; the 125M-parameter granite-guardian-hap scored 80.27% at 33 ms; Laya fell to 57.87%.[26]

Prompts matter more. A prompt set tuned for Laya raised it by 17.83 points; the same prompts lowered Jev by 3.67.[26] Prompts don't transfer between decision models.

Red Hat's conclusion is measured: on the tasks they're trained for, small pre-trained classifiers match or beat decision models while being cheap, fast and offline; decision models earn their place when you have no training data or categories keep changing.[26] Limits: English only, at least 56 ms of added network latency, and LLM-judge prompts adapted from other tasks. Also, Shieldstral's two main-table numbers (72.02% and 74.80%) are swapped relative to the appendix. The conclusion stands, but read such articles against their appendices.[26]

## Counter-evidence two: calibrated to whom?

Nearly every vendor claims calibrated probabilities. Alex Molas's short post nails the problem: calibration belongs to a model and a data distribution together. Two companies can define spam identically yet see different email; Jev gives both the same probability for the same input, so it can't be calibrated for both.[27] His advice: fit Platt scaling (a logistic regression from score to probability) on a few hundred of your own labels, and until then treat the outputs as scores that rank well, not as probabilities for thresholds or expected costs.[27]

The board data agrees. On Decision Index 0.3.1, Jev's mean confidence is 0.81 against 0.74 accuracy, an ECE (expected calibration error) of 0.074. By bin: at 0.7–0.8 confidence it was right 59% of the time, at 0.8–0.9 71%, above 0.9 93%.[23] It is overconfident. TypeSafe's docs also admit Jev leans toward the first option and handles dates unreliably.[2]

**Be careful with distilled models.** The JEV-9B and JEV-27B cards report ECE of 0.0007 and 0.0009, astonishingly good, but computed against the teacher's distributions: it measures closeness to Jev, not accuracy against truth. The JEV-9B card says its fidelity extends to the teacher's mistakes.[11][12] On the Decision Index, JEV-27B's ECE is 0.0759, about Jev's own.[23]

**Other cases:**

- Laya ships overconfident; refitting temperature on your data takes ECE from 0.466 to 0.081. Its English checkpoint collapses on non-Latin scripts: 0 accuracy on Khmer at 0.952 confidence.[9]
- On JevBench's 74 public yes/no questions, none of H2O's answers fell between 0.2 and 0.8.[19] Sharp isn't calibrated; a three-band threshold policy may never use its middle band.
- AnyJev's L0 calibration lowers ECE only from 0.240 to 0.184, but the share of questions decidable at ≤5% error rises from 7.7% to 46.3%.[22] For agent loops, coverage at a given risk is closer to what you care about than ECE alone.

**Precision and quantization change answers.** Liquid's d1-omni-600M card says bf16 inference changes the top answer on 0.8% of text and 1.7% of audio questions.[6] bartowski's Clef-flash GGUF card notes that a decision model generates no tokens, so imatrix can't calibrate the quantization; the head stays at Q8_0, and "nothing below can measure what quantizing it would cost".[28] A Reddit post compares Clef Q8 with Jev, but I couldn't retrieve its body, so I cite no numbers from it.[29] After quantizing, re-measure.

**Hosted models drift.** The Decision Index found 20 multiple-choice answers from Jev had changed since its September 19 run.[23] Aliases like `jev-latest` move too.[1] Pin versioned IDs and replay a fixed set regularly.

**Order bias varies.** On 16-option questions, reordering alone changes 7.0% of the teacher Jev's answers, 7.4% of JEV-27B's and 11.5% of JEV-9B's; the JEV-27B card suggests asking in both orders and averaging, and the two orders agreed about 96% of the time.[11][12] Microsoft reports a 1.3% average flip rate across eight perturbations and zero on shuffled or reversed options, a vendor self-test.[18]

## When to use a decision model, and when not to

### Against an LLM judge

JevBench's API board is a clean comparison: GPT-6 Luna at low reasoning effort scores 97.8 on capability against Jev's 77.1, at \$0.108 vs \$0.032 per thousand decisions (about 3.4×) and 1.85 s vs 0.24 s median latency (about 7.7×).[24] The absolute difference is 7 cents per thousand. If the decision is off the critical path (offline labeling, a daily QA run) and accuracy matters most, an LLM judge is the easier choice.

Decision models win in two places. Latency compounds: Microsoft notes that 100 ms extra on each of 20 sequential decisions adds 2 seconds.[18] And many questions about one state are cheap: Jev reads the `state` once, evaluates every question in parallel, and bills input tokens.[1] In this site's rubric-judge post, Jev and flash-tier LLMs were statistically indistinguishable on most pairings at 29–325× lower cost and 30–220× lower latency, but their errors were correlated, so a cheap-first cascade added at most about 1.5 points. See [Jev as a rubric judge](/blog/jev-rubric-judges-cheaper-faster-correlated-errors/).

### Against a fine-tuned small classifier

With a few thousand labels and stable categories, Red Hat's results are clear: a purpose-built classifier of a few hundred million parameters is as accurate, an order of magnitude faster, and runs on a CPU.[26] Decision models fit a cold start with no data, categories that change weekly, and many scattered small decisions that don't each justify a model. A middle path is to label with a decision model, then train a small model; Laya's card shows fine-tuning taking one task from 0.362 to 0.766 accuracy.[9]

### Five dimensions

- **Latency:** self-hosted models under 4B reach tens of milliseconds or single digits (d1-3B 16 ms and Laya 6 ms medians on the Decision Index); hosted APIs usually run 0.2–0.5 s with network.[23] Know which measurement you are comparing.
- **Cost:** hosted decision APIs cost cents per thousand; a self-hosted 27B model's real cost depends on your GPU utilization, and board estimates are only a guide.[24]
- **Calibration and drift:** nobody is calibrated on your data out of the box, so budget a few hundred labels for temperature or Platt fitting; pin and replay hosted APIs, and own deployment if you pin open weights.[1][23][27]
- **Auditability:** open weights plus a recipe are easiest. Strands publishes per-stage timings, configs and SHA-256 hashes of its training data; vLLM-SR says it checked its training data row by row against every Decision Index test item; with hosted APIs, at least log the returned model version.[15][16] Probabilities let you audit a threshold, not a reason; the JEV-9B card says System 1 cannot explain its decisions.[12]

For Chinese text: Jev admits CJK trails English, Red Hat tested only English, and Laya's English checkpoint collapses on non-Latin scripts.[1][9][26] Re-test everything on Chinese data.

## A comparison table

Scores are Decision Index 0.3.1 totals (October 10 snapshot) or JevBench v1.6.1; "—" means no first-hand public figure found.[23][24]

| Model | Size | License | Interface | Context / modality | Published benchmark | Where it runs |
|---|---|---|---|---|---|---|
| Jev 1.13 | undisclosed | closed | native `/v1/systemone` | 64k; text | DI 60.11 (#3); JevBench capability 77.1 | TypeSafe API |
| OpenAI Decisions | undisclosed | closed | own schema | text, images | JevBench capability 73.5 | OpenAI API |
| Microsoft-Decision-1 | 9B (Qwen3.5) | closed | Foundry / OpenRouter | —; text | JevBench capability 70.8 | Azure, OpenRouter |
| d1 (hosted) | undisclosed | closed | Liquid SDK (Python/TS) | — | JevBench capability 74.4 | Liquid API |
| Clef | 27B (Qwen3.8) | Apache-2.0 | `/v1/systemone` | 16k default; text, images | DI 53.08 (#19) | self-hosted, Workers AI |
| Clef-flash | 9.4B | Apache-2.0 | `/v1/systemone`, GGUF | text, images | DI 47.61 (#33) | self-hosted, llama.cpp |
| d1-3B | 3.1B | LFM Open 1.0 | Python `system_one()` | 32k; text, images | DI 40.08 (#53) | local GPU, edge |
| d1-omni-600M | 587M | LFM Open 1.0 | Python | 16k; text, images, audio | DI 9.45 (#99) | edge |
| pplx-decider v1.1 | 27B | Apache-2.0 | bundled inference code | 8k; text, images | DI 62.75 (#1); vision #1 | self-hosted |
| H2O-Lightning-4B | 4B | Apache-2.0 | vLLM + shim | 40k; text | JevBench open composite #1 | self-hosted |
| Decision 2.0 Vega | 27B | Apache-2.0 | transformers | 32k; text | DI 55.88 (#13) | self-hosted |
| JEV-27B-VL | 27B | Apache-2.0 | `/v1/decide` | text, images | DI 55.64 (#14); vision #2 | self-hosted |
| JEV-9B | 9B | Apache-2.0 | `/v1/decide` | text | DI 45.21 (#39) | self-hosted |
| GEV-26B-Decide | 26B-A4B | Apache-2.0 | `/v1/decide` | 256k; text, images | DI 56.17 (#11, System 1 only) | self-hosted |
| Laya | 421M | Apache-2.0 | `/v1/systemone` | 1k default, up to 8k; text | DI 4.43; Red Hat injection 85.44% | CPU too |
| CLM-v0.1-8B | 8B | Apache-2.0 | own client | text | DI 6.24 | self-hosted |
| Strands Decider 2B | 2B | Apache-2.0 | `/v1/systemone` | 4k; text | DI 21.75 (#84) | self-hosted |
| AnyJev | wraps any LLM | open-source tool | `/v1/decide` | depends on base | self-reported BANKING77 etc. | Ollama, vLLM |

Two footnotes. GEV's self-reported 62.48 includes thinking mode, while the board's 56.17 is System 1 only; pplx v1.1's self-reported 61.56 matches its board result.[13][14][23] And several vLLM PRs (d1-3B, Laya, OpenAI's Decisions schema) are still open, so the interface is still caught between two standards.[17]

## An acceptance checklist before wiring one into an agent loop

For routing, guardrails and judging alike:

1. **Pin the version.** Hosted: the versioned model ID. Open weights: repo commit and quantization format. Any precision or quantization change means a full rerun.[6][28]
2. **Build your own set.** A few hundred labeled examples from real traffic, hard cases stratified, plus a held-back "new domain" slice like the boards' 30%. Chinese use needs Chinese items.
3. **Set three baselines:** rules or keywords, a trained small classifier (if you have data), an LLM judge. The decision model must win on at least one dimension.
4. **Track the right metrics:** per-class accuracy or F1; blocking recall for guardrails; ECE with a reliability diagram; coverage at a given error rate; end-to-end p50/p95 latency with network; cost per thousand decisions.
5. **Test robustness:** shuffle options and measure flips; paraphrase; add irrelevant context and long `state`s; add short, natural, answer-preserving nudges as in [JevOut](/blog/jevout-natural-context-flips-decision-models/).
6. **Calibrate it yourself,** per question type, then set thresholds.[27]
7. **Use three bands:** act above the upper threshold, refuse or reroute below the lower, escalate the middle to a stronger model or a human, with a cap on the escalated share (AnyJev's Tacit has such a switch).[22] Confirm the model produces middle-band probabilities at all.[19]
8. **Test for correlated errors.** If the cheap and fallback layers fail on the same items, the cascade is useless.
9. **Monitor drift:** replay a fixed set weekly and alert on changed answers.
10. **Add use-specific checks.** Guardrails: treat timeouts, over-length inputs and errors as "block", and never rely on a decision model alone against prompt injection. Judges: ask in both orders, and don't make it the only RL reward. Routing: add an "other" option and take the default path on low confidence.
11. **Keep an audit trail:** `state` hash, questions, full distribution, model version, threshold in force, final action.

## How this fits with the site's Jev series

This post is the map and selection guide. For detail: mechanism and integration in [Jev × Claude Code and the 25-line logits trick](/blog/jev-claude-code-10x-and-25-lines/); use cases in [TypeSafe Jev use cases](/blog/typesafe-jev-use-cases/); decision stability in [ContractNLI: similar scores, different decisions](/blog/jev-vs-llm-contractnli-same-scores-different-decisions/); alignment detection in [Just Ask Jev](/blog/just-ask-jev-rlcd-alignment-failure-detection/); memory and GUI execution in [Jev-Mem](/blog/jev-mem-system-one-agentic-memory/) and [Jev-Mobile](/blog/jev-mobile-system-one-gui-executor/).

## Closing

In a month, decision models went from one company's API to a category with a dozen-plus players, three leaderboards and a generic inference endpoint. The speed and cost advantages are real, but discount the marketing: for "number one", ask which board, which version, and whether private items count; for "fastest", measured or adjusted; for "calibrated", against real labels or a teacher. S1MB's notes put it honestly: scores do not establish generalization to unseen tasks, nor that training data and test items don't overlap.[25] That applies to every board in this category.

No data, a decision on the critical path, many questions about one state: use a decision model. Labels and stable categories: start with a small classifier. Accuracy first and off the critical path: pay an LLM judge a few cents more per thousand. Whatever you pick, recalibrate it on your own data before going live.

## References


1. TypeSafe. *Models (jev-1.13)*. https://docs.typesafe.ai/models
2. TypeSafe. *Jev 1.13 jaggedness*. https://docs.typesafe.ai/model-jaggedness/jev-1.13
3. Cloudflare. *Introducing Clef: our open-source decision models, and new RL fine-tuning platform*. https://blog.cloudflare.com/clef-decision-models/
4. Cloudflare. *Cloudflare/clef* and *Cloudflare/clef-flash* model cards. https://huggingface.co/Cloudflare/clef · https://huggingface.co/Cloudflare/clef-flash
5. Liquid AI. *Open d1: Edge decision models for text, vision, and audio*. https://www.liquid.ai/blog/d1-open
6. Liquid AI. *LiquidAI/d1-3B* and *LiquidAI/d1-omni-600M* model cards. https://huggingface.co/LiquidAI/d1-3B · https://huggingface.co/LiquidAI/d1-omni-600M
7. Liquid AI. *Decision Models* documentation. https://docs.liquid.ai/lfm/models/decision-models
8. MarkTechPost. *Liquid AI Releases d1, a Decision Model That Returns Calibrated Probabilities with Zero Output Tokens* (secondary source). https://www.marktechpost.com/2026/09/29/liquid-ai-releases-d1-a-decision-model-that-returns-calibrated-probabilities-with-zero-output-tokens/
9. Convai Innovations. *convaiinnovations/laya* model card. https://huggingface.co/convaiinnovations/laya
10. Contrastive-LM. *CLM-v0.1-8B* model card. https://huggingface.co/Contrastive-LM/CLM-v0.1-8B
11. AutoTrust. *JEV-27B-VL* model card. https://huggingface.co/autotrust/JEV-27B-VL
12. AutoTrust. *JEV-9B* model card. https://huggingface.co/autotrust/JEV-9B
13. AutoTrust. *GEV-26B-Decide* model card. https://huggingface.co/autotrust/GEV-26B-Decide
14. Perplexity. *pplx-decider-v1-27b* and *pplx-decider-v1.1-27b* model cards. https://huggingface.co/perplexity-ai/pplx-decider-v1-27b · https://huggingface.co/perplexity-ai/pplx-decider-v1.1-27b
15. Strands Labs. *strands-decider-2B-hobson-v19* model card. https://huggingface.co/StrandsAgents/strands-decider-2B-hobson-v19
16. vLLM Semantic Router. *Decision-2.0-Vega-27B* model card. https://huggingface.co/vllm-sr/Decision-2.0-Vega-27B
17. vLLM. PR #59299 *Structured decisions endpoint (/v1/systemone)*, PR #60677 *Expose /v1/systemone without an opt-in flag*, open PRs #60676, #58429, #60465. https://github.com/vllm-project/vllm/pull/59299 · https://github.com/vllm-project/vllm/pull/60677
18. Microsoft. *Introducing Microsoft-Decision-1, our model for fast decision-making*. https://commandline.microsoft.com/microsoft-decision-1-model-foundry/
19. H2O.ai. *h2oai/h2o-lightning-4b* model card. https://huggingface.co/h2oai/h2o-lightning-4b
20. OpenAI. *Decisions* API guide. https://developers.openai.com/api/docs/guides/decisions
21. Simon Willison. *Release: llm-openai-decisions 0.1a0*. https://simonwillison.net/2026/Oct/6/llm-openai-decisions/
22. Nokia Applied Research. *AnyJev*. https://github.com/nokia-applied-research/AnyJev
23. multimodalart. *Jev Decision Index* (data/index.json snapshot 2026-10-10 07:54 UTC; data/vision.json 2026-10-09 23:53 UTC). https://huggingface.co/spaces/multimodalart/jev-decision-index
24. Benchmark Heaven. *JevBench* open-weights and API boards (v1.6.1 artifact; API board read 2026-10-11). https://benchmarkheaven.com/jev-models · https://benchmarkheaven.com/jev-models/api
25. hotchpotch. *S1MB leaderboard*. https://huggingface.co/spaces/hotchpotch/s1mb-leaderboard
26. Red Hat Developer. *Benchmarking AI decision models against traditional guardrails*. https://developers.redhat.com/articles/2026/10/02/benchmarking-ai-decision-models-against-traditional-guardrails
27. Alex Molas. *Jev can't be calibrated*. https://www.alexmolas.com/2026/09/23/jev-cant-be-calibrated.html
28. bartowski. *Cloudflare_clef-flash-GGUF* model card. https://huggingface.co/bartowski/Cloudflare_clef-flash-GGUF
29. u/3VITAERC. *Benchmarking decision models is fun: Clef Q8 vs Jev* (Reddit r/LocalLLaMA; body not retrievable, no figures cited). https://www.reddit.com/r/LocalLLaMA/comments/1wxloam/benchmarking_decision_models_is_fun_clef_q8_vs_jev/
