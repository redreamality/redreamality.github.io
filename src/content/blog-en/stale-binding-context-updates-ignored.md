---
title: "Why AI Memory Updates Fail: The New Value Is in Context, and the Model Still Picks the Old One"
description: "Reading UC Berkeley arXiv:2609.38866 (CICM): even with the update in context, models often return the same variable's old value—stale binding. Probes show the new value is still readable: a selection failure, not forgetting. Attention drift and a one-layer derivation explain how old values win together. GPT-5.6 Sol: 9/40 on 2,048-step logs, 40/40 with a snapshot. Includes an AI memory and agent-state checklist."
pubDate: 2026-10-05T16:40:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "llm", "memory"]
lang: "en"
---

Early in a conversation the user says they eat gluten-free. Dozens of turns later: "I've switched to a Mediterranean diet." A few turns on, you ask "What's my current meal preference?" and the model says "gluten-free." Not a hallucination: it picked the right variable but returned its **old value**. Answering with the user's music preference would be a different mistake—mixing up variables.

Anyone who has built an AI memory feature knows this: the user updates a preference and the model keeps acting on the old one. The first instinct is "it wasn't saved" or "it wasn't retrieved." Junyu Guo, Yuchen Fang, Shangding Gu, Costas Spanos, James Demmel, and Javad Lavaei at UC Berkeley study the more awkward case in [arXiv:2609.38866](https://arxiv.org/abs/2609.38866) (*When Context Changes: Understanding Update Failures in LLMs*, 30 Sep 2026): **the new value is already in context, and correct, yet the model still chooses the old one.** They call this **stale binding**, build a benchmark to measure it—CICM (Controlled In-Context Memory)—and follow it into the model: is the new value still there when the answer is wrong, why wasn't it used, and can it be restored without touching the weights? [1]

| **Remembering an update ≠ using the update** |
| --- |
| The new value is still readable, but the answer picks the old one—a selection failure, not forgetting. |

The most striking result: on 2,048-step warehouse-dispatch and build-release logs, with explicit rules and the complete history, GPT-5.6 Sol answers only **9/40** current-state questions correctly and Claude Opus 4.8 answers **18/40**. Give them the resolved current-state snapshot instead and both score **40/40**. [1] Reading the state is not the hard part. Reconstructing it from history is.

Earlier posts here covered [JitMem](/blog/jitmem-read-time-agent-memory/) (read-time synthesis), [CTWM](/blog/ctwm-heavy-tailed-memory-traces-long-horizon-agents/) (the core–tail shape of memory use), and [Jev-Mem](/blog/jev-mem-system-one-agentic-memory/) (memory retrieval as its own control layer). This paper fills in a lower layer: **information already in the window may still go unused.** The goal of AI memory can't stop at "put it in context"; it has to reach "make sure it gets selected."

## Pinning down the term

A **binding** is a variable–value pair. When a variable is assigned several times, the latest explicit assignment is the **current value** and the earlier ones are **old values**, still sitting verbatim in the window. Answering with an old value of the queried variable is stale binding. CICM puts every answer into one of four bins: the current value (correct), an old value of the same variable, another variable's value, or a value that never appears in context. Accuracy alone collapses these; to fix anything you need to know which information a wrong answer reused. [1]

The cleanest experiment is an overwrite task:

```text
x = 71 ··· y = 4 ··· x = 15 ··· x = 63 ··· What is x?
```

Here $k$ is the number of old values ($k=2$ above), and unrelated lines control length. Qwen2.5-7B is nearly perfect at $k=0$. As old values pile up, accuracy falls, and longer contexts make it worse: with 20 / 40 / 80-line prompts, accuracy is 91% / 85% / 70% at $k=2$ and 51% / 45% / 38% at $k=8$. Of 333 failures, **331** return an old value of the queried variable, two copy some other in-context value, and **none** invents a value. Recent old values are favored: at $k=4$, 92 of 113 old-value errors pick the most recent old value, against a 25% reference for uniform choice. [1]

The signature is stable: the outdated version of the same variable, usually the one just replaced.

## The updates are the hard part, not the length

Is this just long-context decay? Length-matched controls rule that out:

- **Scale only postpones it.** 70B-class models and GPT-4o last longer but still fail at $k=64$, while every matched 320-line no-overwrite prompt is answered correctly. Qwen2.5-72B and GPT-4o err only with old values; all seven GPT-4o errors pick one of the two most recent. [1]
- **A bigger output budget doesn't help; brief reasoning helps a little.** On paired 80-line prompts, raising Qwen2.5-7B's direct-answer cap from 16 to 512 tokens moves accuracy from 87/150 to 86/150. Adding "briefly identify the queried variable's most recent assignment" lifts it to 111/150. But **all** 39 remaining errors are still old values, and at $k=8$ accuracy is 52% against 98% on the paired no-overwrite controls. [1]
- **At high load, models split.** In 36 operational-identifier scenarios across six domains (meeting rooms, delivery routes, storage bins, and so on), at $k=256$ Qwen and GPT-4o each return old values on 32/36 even with concise reasoning; GPT-5 and Gemini 3.1 Pro Preview get every one right, and DeepSeek V4 Pro returns two old values. [1]

So "think more" is not a reliable fix. Newer reasoning models are steadier on explicit overwrites, but complex update structures trip frontier models too.

There is also a measurement trap: **the answer format can hide this error.** On ICF-Bench's Dynamic Preference task, Qwen2.5-7B has almost the same accuracy in free-form and multiple-choice formats (69.3% vs 70.9%), yet 82.1% of its free-form failures return an old preference against 29.4% under multiple choice. [1] Options didn't stop it reaching for the old value; they hid it. Same lesson as the post on [agent evaluation reliability](/blog/agent-evaluation-reliability-more-tasks-wont-fix-leaderboard/): with the wrong format, more questions just measure a masked number more precisely.

## Frontier models fail too: rebuilding state from history

In real agent logs, state rolls forward one dependent step at a time. The paper's logs have 16 slots of immutable parcel or artifact IDs; each handoff atomically cycles two to four slots, and only committed production operations count. The prompt gives the rules, the initial state, and all 2,048 operations, then asks what a slot holds now. Nothing is hidden. Models are called via API with **no tools, no external memory, no context-management harness**. [1]

| Model | Full history | Current-state snapshot |
| --- | --- | --- |
| GPT-5.6 Sol (high reasoning) | 9/40 | 40/40 |
| Claude Opus 4.8 (adaptive thinking) | 18/40 (9 hit the 128k output cap) | 40/40 |

All 80 Sol requests complete normally. Of Opus's 22 failures, 13 name an old occupant of the slot and 9 stop at the 128,000-token cap (18/31 among completed answers). Claude Sonnet 5 hits the cap on all four pilots, recorded only as output availability. [1] In one Opus failure the paper shows, its backward trace matches the verified chain for the 210 most recent transitions, then follows the wrong slot at step 514, and the identifier it answers is an earlier occupant of the queried slot. [1] It was computing; it just picked the wrong source at one step of a long chain, and the rest drifted to an old value.

The snapshot is a solvability control: both models ace it, so the task is solvable and they can read state—reconstruction is where they stall. It isn't matched for length or compute and doesn't evaluate any deployed harness. [1]

Two follow-ups. A **dependency-aware** variant logs some handoffs as pending, executing only when a later `resolve(seq=N); result=committed` line refers to them. On a pre-specified 17-scenario prefix, Opus 4.8 scores 12/17 deferred, 16/17 on a linearized control stating the same operations line by line, and 17/17 on snapshots; exact McNemar $p=0.22$—a clear direction, not significant. And an **exploratory** diagnostic: on four pilot scenarios, an accurate checkpoint before the final 512 operations gives Sol and DeepSeek 4/4 each, costing Sol just 147 extra tokens. The authors flag these as exploratory on reused cases; the matching 40-scenario relevance study stopped when service credits ran out. [1] Not a conclusion, but it agrees with 40/40 on snapshots: **computing the state and handing it to the model is far more reliable than asking the model to roll it forward from history.**

Note that the frontier results are behavioral only; the probe, attention, and component experiments below use open-source models, and the paper makes no claim about GPT or Claude internals. [1]

## How CICM is built

Explicit update rules plus programmatic answers let every wrong answer be traced to its source. The preference core builds on PrefEval [2]: 1,200 dialogues about meal, music, and learning-style preferences, with a generator controlling values, order, and competing mentions while language models only supply wording. Add 180 pilot ledgers in six domains, 24 revised-constraint decision scenarios, and the 40 operational histories plus the deferred variant. Answers are fixed in advance and verified by span checks, independent replay, or action enumeration; truncations and provider errors are logged separately. [1]

## The same variable's old value beats another variable's recent value

What pulls the answer away—an old value of the same variable (same identity) or a recent value of another variable (closer position)? The paper runs a factorial on Qwen2.5-7B: the current assignment is held far from the question, crossed with whether the most recent old value is mentioned again later, and with another variable's distance (far, middle, or two turns before), 200 dialogues per cell. [1]

- **One re-mention of the old value near the question largely decides the answer.** Even when another variable is closer, old-value errors make up 75.5%–94.5%.
- **Without a re-mention, recency gets a chance to compete.** With the other variable two turns away, old-value and other-variable errors are about equal (16.0% vs 16.5%).
- **The re-mention also decides which old value comes back:** the re-mentioned value accounts for 94.5%–100% of old-value answers in both Qwen and Llama.
- **Marking it as history helps but isn't enough:** Qwen's old-value rate drops to 25.5%, not to zero. [1]

The authors' phrase is *identity outweighs recency*. In engineering terms: the model first matches on "is this my variable," then compares the salience of that variable's values—and a later re-mention makes the old one stand out. Agent logs and memory summaries are full of "it was A, now it's B" and "note A is deprecated." Each line boosts A.

One wording result is counterintuitive. On 600 dialogues with the old value near the question, rewriting the re-mention as "A was an earlier choice and is no longer current" lifts Qwen from 74/600 to 375/600. Adding only "later mentions of earlier choices are not updates" to the question drops it to 44/600. The authors guess the clarification makes "earlier choices" more salient again, though this isn't isolated; GPT-4o improves under the same rewrite. [1] Safe reading: **to keep an old value down, stop mentioning it rather than insisting it's obsolete.**

## The new value is still readable: this isn't forgetting

Maybe the model "lost" the new value? The paper checks with a linear probe (a linear classifier on hidden states that tests whether information is linearly readable) on the final-layer state at the answer position, over 21 candidate values, with five-fold cross-validation split by dialogue. [1]

On old-value errors, the probe gives the **current value** a mean probability of 84.8% in Qwen and 82.2% in Llama, versus 3.2%–6.4% with shuffled labels. The authors stay careful: readability does drop on failures (about 7 points below correct answers after length adjustment), and readable only means present, not used. The problem is the next step: **selection**. [1] The appendix cites Tulving's classic distinction between availability (stored) and accessibility (retrievable) [3], but only as an analogy; and unlike human memory, an LLM's window keeps both the old and the new statements fully visible.

## Attention tilts toward old values

The paper calls this **attention drift**: when producing the answer, attention gives old values more weight than the current one. There are two layers of evidence. First, compared with equal-length dialogues that contain no conflicting update, conflicting updates shift attention and query–key matching toward old values in all five models with reliable controls—**including answers that end up correct**. Drift is a general pressure from updates; a correct answer just means it didn't flip this time. Second, failures vs successes: with the old-value share defined as $\rho_{old} = A_{old}/(A_{old}+A_{current})$, Qwen's share is 19.4 percentage points higher on failures, concentrated in late layers; but in Llama it is only +1.2, with an interval that includes zero. [1] This is easy to miss: **the new value being readable holds in both models; the attention-level explanation is clear only in Qwen so far.**

## Which components actually decide the answer

An attention shift is still a correlation. The paper tests causation by replacing components: for 120 failed overwrite prompts it builds successful counterparts with identical candidate values and positions (by renaming earlier assignments), swaps components from the successful run into the failed one, and measures how much of the current-minus-old score gap is recovered. [1]

| Component replaced (Qwen2.5-7B) | Mean recovery (%) |
| --- | --- |
| Early / middle hidden states | −0.5 |
| Late hidden states | 78.1 |
| Keys at old assignments | 49.2 |
| Keys at the current assignment | −21.3 |

Recovery concentrates in late layers and old-value keys: late selection, with old values "too easy to match." To reach individual heads the authors use the small Pythia-160M. On held-out data, removing heads selected for promoting old values corrects 38.4% of old-value errors versus 8.7% for layer-matched random removal; replacing one head's key inputs recovers 75% of the score gap versus 6% for random inputs. For head L8H10, the query–key margin is 1.70 on correct answers and −0.26 on errors, while its value pathway barely changes. [1] Put plainly: **the head transmits content fine; it's looking in the wrong place.**

## Seeded at the update, decided at the end

In Pythia-160M, swapping in the successful run's key at the update fixes 92.8% of failures if the question comes right after; if the rest of the conversation (including an old-value re-mention) runs first, it fixes only 8.7%. The probe's current-value probability falls from 0.81 after the update to 0.35 at the question, still above the shuffled-label ceiling of about 0.22. [1] For AI memory: **being right at write time doesn't guarantee selection dozens of turns later.**

Late intervention does work. A perturbation along the probe direction at the answer position, versus an equally large random one, at strength 0.4 cuts persistence of the original error type by 39.5 more percentage points in Qwen and 69.5 in Llama; at a middle layer it does almost nothing. It uses the known answer, so it shows selection is still changeable at the end—not a fix. [1]

## The one-layer Transformer math: how old values win together

To show how selection can fail with nothing lost, the paper uses a one-layer Transformer where assignments share one content key, differ only by position, and each value is copied with probability equal to its attention weight. [1]

**First: positional encoding doesn't make nearer stronger.** The current-vs-old log-odds equal their score difference over temperature $T$; under RoPE (rotary position encoding) that difference is a sum of sine terms of either sign. When it is small relative to $T$, the stale value is nearly as likely as the current one. The appendix example: with a rotary period of 10, a current value at distance 1 and an old value at distance 5, the current value has about 6:1 odds; shift both by five positions and, with order unchanged, the advantage flips to the old value. The authors also prove bare RoPE matching gives no recency margin valid at every placement—not that every prompt fails, but that the architecture guarantees nothing. [1]

**Second: more old values dilute the current one.** With $k$ old values, the odds of the current value against any old value are $e^{s_c/T} / \sum_j e^{s_j/T}$. Holding scores fixed, each additional old value strictly lowers this ratio; if the current value's advantage is bounded, its selection probability goes to zero as $k$ grows. [1] It shows up in a real head too: in Pythia-160M's L8H10 on old-value failures, the current value gets 0.40 of the attention on average while all old values together get 0.60. Each old value is only slightly stronger than the current one; together they win.

**Third: identity versus recency.** Write each score as a same-variable identity bonus plus the remaining contextual evidence. The boundary between an old-value error and an other-variable error is where the other variable's evidence exceeds the old value's by exactly that bonus. A re-mention raises the old value's evidence; bringing another variable closer raises its evidence—matching the factorial results above. [1] The authors are clear about the limits: the model doesn't predict a full network, and a linear "identity score + recency score" predicts Qwen's actual answers only 43.0% of the time, worse than identity alone (79.2%). [1]

## Redirecting attention without changing weights

If selection is the problem, change it. At the final prompt position, selected heads get a bias $\beta$ added to attention scores at current-value positions and subtracted at old-value positions—either fixed in advance or adapted per input, with heads and settings chosen before testing. The baseline is a "reminder": the parsed current value placed right before the question. [1]

| Model | Original accuracy | Attention routing | Reminder | Old errors corrected | Initially correct preserved |
| --- | --- | --- | --- | --- | --- |
| Qwen2.5-3B (adaptive) | 16.46 | 95.21 | 99.27 | 678/711 | 98.73 |
| Llama-3.2-3B (adaptive) | 27.71 | 93.12 | 68.85 | 514/541 | 100.00 |
| Llama-3.1-8B (adaptive) | 41.71 | 88.63 | 65.38 | 395/467 | 100.00 |
| Mistral-7B (adaptive) | 5.42 | 81.35 | 98.44 | 564/674 | 98.08 |
| Gemma-2-9B (adaptive) | 47.08 | 91.88 | 82.81 | 407/455 | 100.00 |
| Qwen2.5-7B (fixed) | 37.60 | 68.85 | 88.02 | 208/487 | 100.00 |
| Qwen2.5-14B (fixed) | 40.52 | 41.67 | 98.54 | 13/491 | 98.46 |

The five adaptive configurations gain 44.79–78.75 percentage points while preserving 98.08%–100% of initially correct answers; all exceed random-head and random-position controls, and reversing the routing lowers accuracy. Routing beats the reminder on both Llama models and Gemma; the reminder is stronger on Qwen and Mistral. [1]

Read the table with its limits. Fixed bias doesn't always work (Qwen2.5-14B: 13/491). Routing needs a rule-based parser to mark positions first, and the authors note that parser could answer the question itself—so this shows attention changes make the model *use* the value, not *find* it. It also needs internal access and labeled calibration, ruling out closed APIs. [1] For builders: if you can already parse the current value, hand it over directly; treat routing as a diagnostic.

## What this paper does not claim

- **It doesn't estimate how often this happens in production.** All dialogues and logs are constructed diagnostics. [1]
- **Not every long-context error is stale binding.** Under a strict definition, only 1.4% of BABILong errors and 25.9% of Entity Tracking errors are answers equal to an earlier state; RULER variable tracking mostly reflects crossed reference chains, a different failure. [1]
- **Frontier models mostly handle revised-constraint decisions:** four reasoning models are optimal on 88–95 of 96 full-history prompts; the rest are invalid outputs, truncations, or provider failures. [1] Trouble appears when state must be rebuilt through long chains of dependent operations.

## Back to AI memory systems: logs for audit, snapshots for the model

A handy analogy is event sourcing: keep the full event log, but have queries read a materialized view computed from it instead of replaying the log. 9/40 versus 40/40 says nearly the same thing: **asking the model to replay the log bets on the least reliable step.**

It fits earlier posts. [Grow the harness](/blog/grow-the-harness-not-the-context/) says recurring control decisions should become code; "compute current state from history" is one. [LLM agents tampering with their own traces](/blog/llm-agents-tamper-own-traces-append-only-audit/) wants an off-host append-only log—keep full history for audit, not for every prompt. [Global Coherence](/blog/global-coherence-local-right-team-wrong/) checks the read-set at commit, keeping a stale quote from five turns ago out of the decision. And a warning: append-only memory notes, and summaries like "the user first said A, then changed to B," both quietly set up identity-over-recency failures.

## Builder checklist

Items marked "inference" are my engineering reading of the results, not direct conclusions from the paper.

1. **Overwrite memory by key, don't just append.** One current value plus a version per slot; old values go to a history table, not the default prompt. (Inference: old values dilute the current one and beat other variables.)
2. **Send a snapshot, not a log to replay.** Let the harness compute state; if long history must go in, add an accurate checkpoint near the end. (9/40 and 18/40 vs 40/40; exploratory checkpoint: +147 tokens, 4/4.)
3. **Don't re-mention old values near the question, even to say they're obsolete.** If you must, mark them as history and keep them far away. (Re-mention: 75.5%–94.5% old-value errors; marked as history: 25.5%; same mention merely moved closer: 14.8% → 36.7%.)
4. **Expand deferred operations into line-by-line records in the harness.** (12/17 vs 16/17, not significant.)
5. **Compress memory into "current state," not a "story of changes."** (Inference.)
6. **Don't treat "think more" as the fix.** (87/150 → 86/150; concise reasoning reaches 111/150 but every remaining error is an old value; 32/36 old values at high load.)
7. **Evaluate with free-form answers and classify errors into the four bins**, with length-matched no-update controls and a sweep over $k$. (Multiple choice shows 29.4% old-value share versus 82.1% free-form at almost the same accuracy.)
8. **Record truncations separately as "no answer."** (Opus 4.8 hit the 128k cap on 9/40.)
9. **When self-hosting open models, use attention routing as a diagnostic**; but if you already have a parser that yields the answer, try a direct reminder or snapshot first.

## Limitations

As the authors state: constructed data doesn't estimate deployment failure rates; internal measurements cover only open models, with patterns varying by comparison; probes show recoverability and known-answer steering shows output control; routing needs internal access, labeled calibration, and a structured parser. [1] Frontier samples are small, the checkpoint results exploratory; code and data come after double-blind review.

## Closing

This paper takes apart something usually filed under "AI memory is bad": often nothing was forgotten—the model picked the wrong one of two visible values. Positional encoding doesn't make nearer stronger, more old values dilute the current one, and one re-mention can let the old value win. So context management has to move a step further: not just "put the update in" but "leave the current state without competitors"—overwrite by key, compute snapshots, stop repeating old values. Next time a user says "I told you I changed it," first check whether the old value is still competing in what you fed the model.

## References

[1] Junyu Guo, Yuchen Fang, Shangding Gu, Costas Spanos, James Demmel, Javad Lavaei. *When Context Changes: Understanding Update Failures in LLMs*. arXiv:2609.38866, 30 Sep 2026. [abs](https://arxiv.org/abs/2609.38866) · [PDF](https://arxiv.org/pdf/2609.38866).

[2] Siyan Zhao, Mingyi Hong, Yang Liu, Devamanyu Hazarika, Kaixiang Lin. *Do LLMs Recognize Your Preferences? Evaluating Personalized Preference Following in LLMs* (PrefEval). ICLR 2025. [OpenReview](https://openreview.net/forum?id=QWunLKbBGF).

[3] Endel Tulving, Zena Pearlstone. *Availability versus Accessibility of Information in Memory for Words*. Journal of Verbal Learning and Verbal Behavior, 5(4):381–391, 1966.
