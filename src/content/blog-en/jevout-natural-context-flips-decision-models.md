---
title: "JevOut: Short Natural Context Can Flip Decision Models to a Fixed Wrong Option"
description: "A deep read of arXiv:2609.30243 JevOut—answer-preserving short context can redirect Jev and peer decision models from a correct choice to a pre-fixed wrong target—with checked numbers (Jev TFR 61.4%, high-confidence flips, BFCL tool-routing fragility) and a hardening checklist before treating probabilities as a control plane."
pubDate: 2026-09-26T00:00:00+08:00
author: "Remy"
tags: ["jev", "ai-agents", "System One", "robustness", "agent-routing"]
lang: "en"
---

Dedicated decision models map unstructured language to a probability distribution over a finite set of options. Downstream software can take the argmax to route a request, pick a tool, or trigger an action. The interface is clean: no free-form parse step; the probability table *is* the control surface.

Real inputs, though, rarely arrive as an isolated ask. Conversation history, retrieved snippets, background notes, and surrounding state all enter the context in which the model decides. Surrounding context is therefore not an edge case—it is the normal operating environment. In [arXiv:2609.30243](https://arxiv.org/abs/2609.30243), Zixiang Xu (USC) asks a precise question under the name **JevOut**: can **short, natural, answer-preserving context additions** redirect an otherwise correct decision to a **wrong option fixed in advance**, without changing the question, the choice set, or the gold answer? The paper’s answer is hard: yes—and often at high confidence.[1]

This site has already covered [wiring Jev into Claude Code](/blog/jev-claude-code-10x-and-25-lines/), [ContractNLI cases where similar mean scores can still flip individual decisions](/blog/jev-vs-llm-contractnli-same-scores-different-decisions/), [Jev-Mem’s memory control plane](/blog/jev-mem-system-one-agentic-memory/), and [Jev-Mobile’s GUI executor loop](/blog/jev-mobile-system-one-gui-executor/). Those posts are about connecting bounded outputs into a harness. This one moves to **robustness**: how brittle the same “language → finite-option probabilities” interface is under natural context perturbations; which numbers you can check; and what that means if you treat decision probabilities as a reliable agent-routing control plane.

Naming boundary first: **JevOut is attack / evaluation research, not a claim that “Jev is dead.”** It measures targeted flips of dedicated decision models—hosted Jev, OpenSourceJev, the non-autoregressive Von, and a plain Qwen scorer on the same backbone—under answer-preserving context. Code and homepage are public: [GitHub](https://github.com/xzx34/JevOut), [project page](https://xzx34.github.io/jevout/). The sane reaction after reading is not “abandon System One,” but “do not treat probability outputs as an already-hardened control token.”[1]

## Setup: TFR, fixed wrong target, answer preservation, probability-guided optimization

A decision model assigns \(p_\theta(c\mid x,q,C)\) over a finite option set \(C\). The study first keeps the eligible population \(U_\theta\) of items the model initially answers correctly, then fixes one wrong target per item:

\[
t_u = \arg\max_{c\in C\setminus\{y\}} p_\theta(c\mid x,q,C)
\]

That target stays fixed for the whole construction. Success counts **only** a move onto this pre-fixed wrong option; a move onto some other wrong option does not count. That is what makes Targeted Flip Rate (TFR) stricter than a generic error rate—the adversary must hit a designated distractor, not merely “any mistake.”[1]

An **answer-preserving context addition** inserts background or procedural detail while the renderer keeps every original character in order; the question and options stay unchanged; the complete gold-answer set remains correct. New facts and shifts of emphasis are allowed when they leave the answer unchanged. Explicit selection cues, rewriting the question, or editing the option table are forbidden. Feasibility is enforced by mechanical checks (legal boundaries, nonempty text, deduplication, ban on explicit selection phrases) plus a separate semantic checker that never sees the target option or its probabilities. The checker only asks whether the gold set remains correct and whether the augmented item stays locally coherent—it does not predict whether the target model will flip.[1]

Figure 1 in the paper gives an intuitive example (MMLU-Pro item 11233): question, options, and correct answer unchanged; one added sentence raises a related intergenerational consideration. Jev moves from probability 0.97 on the correct option to 0.54 on the fixed wrong target. The addition is not “please pick B”; it reads like ordinary background, yet it is enough to move the distribution.[1]

Construction uses **probability-guided context optimization**, not labels alone. Candidates are scored by the log-probability margin between the fixed target and its strongest competitor:

\[
m_u(z)=\log\frac{p_\theta(t_u\mid x_z,q,C)+\epsilon}{\max_{c\neq t_u}p_\theta(c\mid x_z,q,C)+\epsilon}
\]

Larger margin means the target dominates its rivals; a positive margin makes it the unique most probable option. A language-model proposer (Gemma4-12B in the experiments) adds one sentence and an insertion boundary per step. The archive resamples parents with an entropy-regularized Gibbs distribution over margins, concentrating the evaluation budget near the decision boundary. A fraction of slots each iteration restart from the original input so search can escape a local framing. Budget: at most four iterations, 16 slots per iteration, at most **64 accepted target evaluations**; a round may stop early if a targeted flip already reaches target probability ≥0.7. Controls include a neutral one-shot (no target) and a target-aware one-shot (sees the target, no iterative feedback).[1]

When you read the rates, keep denominator and success definition straight:

- TFR’s denominator is each model’s **initially correct** population, not the full item set. Jev 508, OpenSourceJev 328, Von 328, plain Qwen 285—you cannot rank “who is absolutely more brittle” across those four without conditioning on different clean populations.
- Rejected proposals never shrink the denominator; any hit on the fixed target within budget counts success for that item.
- Thresholds \(p_t\geq 0.7\) / \(0.9\) are cutoffs on reported probabilities, not a claim of cross-model calibration.[1]

Seven datasets cover knowledge (MMLU-Pro, SuperGPQA), narrative and social reasoning (MuSR, ToMBench), legal reasoning (LAR-ECHR), multi-answer selection (SATA-Bench), and tool routing (BFCL V4). Each contributes 50 development and 100 held-out items; headline results use held-out. SATA expands into option-membership binary decisions, then keeps at most one initially correct unit per source item under the paper’s rule.[1]

## Main results: 61.4% is not “randomly wrong”

Table 1 headline numbers (within 64 accepted target evaluations):[1]

| Target | Initially correct \(n\) | Neutral one-shot | Target-aware one-shot | Optimized TFR | \(p_t\geq 0.7\) |
| --- | ---: | ---: | ---: | ---: | ---: |
| Jev | 508 | 2.2% (11) | 16.9% (86) | **61.4% (312)** | 45.1% (229) |
| OpenSourceJev | 328 | 6.4% (21) | 16.2% (53) | **72.6% (238)** | 64.3% (211) |
| Von | 328 | 7.6% (25) | 21.6% (71) | **73.2% (240)** | 54.0% (177) |
| Plain Qwen | 285 | 8.4% (24) | 18.6% (53) | **64.9% (185)** | 60.4% (172) |

For Jev: of **508** initially correct decisions, optimization finds **312** targeted flips—TFR **61.4%** (Wilson 95% CI: 57.1%–65.5%). Of those, **229/508 (45.1%)** put at least 0.7 probability on the fixed wrong option; **91/508 (17.9%)** reach 0.9. That is not a near-tie across the boundary; it is often a high-confidence stand on the wrong option. If your harness rule is “auto-execute when probability ≥0.7,” a large slice of the successful attack set walks straight through that gate.[1]

The controls clarify the gap: on the same decisions, a neutral one-shot reaches only **2.2%**; a target-aware one-shot with one sentence and no iteration reaches **16.9%**. Target awareness helps even once; iterative search plus probability feedback uncovers many more redirectable cases. Across four systems the paper counts 975 successful model–item pairs—the phenomenon is not tied to one hosted API.[1]

Successful contexts are usually short. Among the 312 selected successful Jev contexts, the **median added length is 31 words** (IQR 21–54); **51.9%** contain a single addition; **81.1%** contain at most two. Selection prefers \(p_t\geq 0.7\) then fewer additions—it does not minify by deleting text. The practical reading is blunt: you do not need a long adversarial narrative; one or two locally fitting background sentences often suffice.[1]

Across tasks, Jev’s TFR ranges from **40.0% (32/80)** on legal reasoning (LAR-ECHR) to **85.7% (60/70)** on tool routing (BFCL V4), with ToMBench 76.4%, SuperGPQA 67.4%, MuSR 62.3%, SATA 60.4%, and MMLU-Pro 45.8% in between. Every model–dataset cell yields successful redirections; the pooled 61.4% is distributed across tasks, not propped up by one benchmark. OpenSourceJev / Von often peak higher on BFCL or small-discipline cells—when you read the figure, keep each cell’s own denominator in view; a 100% on tiny \(n\) is not “perfect on the whole dataset.”[1]

## Why tool routing is most fragile—and why that matters for agent harnesses

On BFCL V4, Jev’s TFR is **85.7% (60/70)**, with \(p_t\geq 0.7\) at **72.9%**; target-aware one-shot already hits **40.0%**. OpenSourceJev reaches **88.2% (67/76)** on BFCL. Against ~40% on LAR-ECHR, the gap is large.[1]

A mechanism reading that stays inside what the paper supports:

1. **The “correct next action” in tool routing hangs on fine state.** In multi-turn dialogue, the final user message, completed tool calls, and available function schemas jointly determine the next step. Insertion boundaries are restricted to the final user message—exactly where agents most often splice “background / supplemental notes.” Answer preservation requires not changing the correct next action, yet related detail can still pull the model toward the wrong function.[1]
2. **Options are function names / schemas, not lettered MCQ keys.** When several functions are semantically close, a background sentence that raises the local plausibility of one neighbor can move the argmax. That matches how this site uses Jev as a routing / tool-selection interface.[2]
3. **Downstream effects are real actions.** A flipped knowledge answer is a wrong label; a flipped tool route is a wrong API, wrong side effect, wrong permission surface. The highest TFR lands where a harness can least afford “see a probability and execute.”

[Jev × Claude Code](/blog/jev-claude-code-10x-and-25-lines/) argued that high-frequency bounded judgments should not default into autoregressive generation. [Jev-Mobile](/blog/jev-mobile-system-one-gui-executor/) pushes typed decisions into a GUI selection loop—program-built candidates and re-observation narrow the executable space. JevOut supplies the other face: **bounded outputs reduce format failure; they do not automatically mean robustness to contextual noise.** If a harness treats “Jev chose tool X at probability 0.85” as a reliable control signal and executes immediately, you are sitting on an attack surface the paper has already quantified—and the attack text can look like ordinary background, without “ignore the system instruction” jailbreak phrasing.[1][3]

That also lines up with the [ContractNLI post](/blog/jev-vs-llm-contractnli-same-scores-different-decisions/): a clean structured score is not the same as a trustworthy single decision. There, similar means can still flip individual judgments; here, initially correct items can still be redirected to a high-confidence wrong option by short context. Read together: between aggregate metrics and a single control signal, you still want a harness check.

One more design nail: Growing Harness criticizes control prose crowding out task evidence;[4] JevOut adds that even after you collapse control into a finite option set, **innocent-looking background spliced into the decision input can still rewrite which option wins.** Narrowing the output space and hardening the input channels are both required.

## Probability feedback, cross-model transfer, learned proposers

On a matched set of **140** Jev decisions (20 per dataset), three feedback conditions share the 64-evaluation budget and acceptance pipeline: full feedback (probability allocation plus numeric history in the proposer), probability-only (probability allocation without numeric history), and label-only (allocate using a binary “target selected?” indicator). Result: probability-only **63.6% (89/140)** versus label-only **56.4% (79/140)**—a **+7.1pp** gain (paired 95% CI: 2.1–12.9). Full stays close to probability-only—what the comparison supports is “use graded margins to allocate parents,” not “you must dump numbers into the proposer prompt.” Before a flip happens, label feedback is nearly uniform search; probability feedback can see who is approaching the boundary.[1]

Frozen-context transfer: take a representative context built for one system, evaluate it unchanged on another, with no further optimization; matching is exact to the source-selected decision unit and fixed wrong option, and source failures remain in the denominator. Targeted transfer rates range from **21.1% to 47.8%**. The shared Qwen3-1.7B backbone pair OpenSourceJev ↔ plain Qwen is strongest (**44.2% / 47.8%**); other directed pairs mostly sit around 21%–31% (e.g., Jev→Von 25.4%). Brittleness is not entirely “one API’s private quirk”; some of it travels with the context text—swapping the decision head is not automatic immunity.[1]

Development trajectories can also train the proposer. V1 learns “add the next sentence onto an existing context”; V2 learns “emit a full successful context from the original item in one generation.” On the same 508 held-out initially correct Jev decisions, V2 lifts one-generation TFR from Base **16.1% (82)** to **21.9% (111)**; best-of-four (pick highest-margin accepted context among four independent generations) rises from 29.1% to 34.3%. Iterative optimization (61.4%) still dominates single-shot generation, but useful context construction itself can be amortized—the attack surface is not only an offline optimizer, but also a learned generator. The target model and checker stay frozen during proposer training.[1]

Budget dynamics matter too: Jev’s TFR at 16/32/48/64 accepted calls is **40.4% / 51.4% / 57.3% / 61.4%**. The first 16 calls already uncover many cases; later calls broaden the set. Evaluation budget is part of the phenomenon: reporting only “one-shot robustness” understates the redirectable set.[1]

Scale: primary optimization covers 1,449 model–item pairs, about 68.9k proposed contexts, and about 60.7k accepted target evaluations. This is not a handful of hand-picked counterexamples.[1]

One more engineering reading: a high TFR does **not** automatically mean “61% of production requests will flip every day.” It measures—under iterative construction with a known fixed wrong target—**what fraction of initially correct decisions admit a discoverable targeted-flip context**. For defenders, the right use is as an upper-bound stress test: do critical paths have short, natural flip witnesses? It is not a point estimate of online incident rate. For an adversary threat model, invert that: if the opponent can optimize offline or call a trained proposer, you face something closer to this upper bound than to the 2.2% / 16.9% one-shot controls.[1]

## Boundaries: what the paper supports—and what it does not

For review and secondary reporting, pin these:

1. **Supports:** under answer preservation, a fixed wrong target, and a 64 accepted-eval budget, short natural context can achieve high TFR against multiple decision systems; high-confidence flips are common; the tool-routing end is especially fragile; probability feedback beats label-only allocation by a measurable margin; frozen contexts transfer across models; proposers can learn better direct generation from development trajectories.[1]
2. **Does not support:** “the Jev product line is unusable” or “the System One agenda is bankrupt.” The paper measures sensitivity, not a product death sentence.
3. **Does not support:** ranking the four systems’ TFRs as absolute brittleness—denominators are each model’s initially correct population, with different clean accuracy and item mix.
4. **Does not support:** reading \(p_t\geq 0.7\) as “a calibrated 70% true probability.” The cutoffs are on each interface’s reported probabilities.
5. **Keep calibration narratives separate.** A shortlisted site note about “Jev can’t be calibrated” is a different thread—and **has not shipped as a formal blog**. JevOut proves context sensitivity and targeted flips; that is not automatically “probabilities cannot be calibrated,” and you should not use a calibration story to soft-pedal TFR either.
6. **Concurrent related work.** Contemporaneous diagnostics swap option-name–rubric bindings or permute option order; JevOut deliberately keeps bindings and order fixed and changes only surrounding context. Do not mash three sensitivity modes into one slogan when you cite related work.[1]

## Reusable checklist: before you treat decision probabilities as a control plane

These items track the paper’s mechanisms and this site’s harness habits; they invent no extra experimental numbers. If you wire a Jev-class interface into routing, tools, or action triggers, walk through them first:

1. **Isolate task-truth context from untrusted surrounding context.** Retrieved snippets, user paste, multi-turn chatter, and third-party tool returns should not be spliced indistinguishably into the rubric / option schema. Separate channels when you can; when you cannot, at least tag provenance and restrict insertion points—BFCL only allows inserts inside the final user message, which is exactly the production slot most often polluted.[1]
2. **A single-model route must not directly execute side effects.** Argmax yields a candidate intent; actually calling a tool, writing state, or spending money needs a second check (rules, a second judge, or a human gate). High confidence is more dangerous, not safer, when it conflicts with policy—45.1% of successful Jev flips reach \(p_t\geq 0.7\), and 17.9% reach ≥0.9.[1]
3. **Monitor margin, not only the selected label.** Narrowing margin between the gold (or policy-allowed set) and the runner-up, or a climbing wrong-option probability, should page. Probability feedback helps attackers find the boundary; the same signal can warn defenders that the boundary is approaching.[1]
4. **Put adversarial evaluation into regression.** For critical routing / tool-selection paths, periodically run answer-preserving targeted-flip evaluation (public JevOut pipeline or an equivalent constraint set). Clean accuracy alone is not enough—TFR on the initially correct set is what matches “was right, got flipped by context.” Budget curves warn that one-shot controls understate the redirectable set.[1]
5. **Design options to reduce near-neighbor ambiguity.** Highly overlapping tool names and descriptions make it easier for background to elevate the wrong neighbor. Merge redundant tools, separate rubrics, and avoid two nearly synonymous functions side by side—an engineering attack-surface cut.
6. **Frozen contexts transfer → do not assume “swap the model, gain immunity.”** Rates of 21%–48% mean one dangerous context can hit multiple decision heads. Shared backbones need extra attention; changing the interface is not the same as changing the representation.[1]
7. **Default fail-closed on the harness side.** On anomalous context, mixed provenance, or a too-narrow margin, fall back to a safe default (refuse, escalate to a human, or read-only probe)—do not “run the current argmax first.” That matches [grow the harness, not the context](/blog/grow-the-harness-not-the-context/): control belongs in auditable code, not in “the model is confident.”[4]
8. **Distinguish answer-preserving background from task-changing instructions.** JevOut additions need not contain ignore-instruction injection and can still cause targeted flips. A security baseline that only blocks jailbreak phrasing will miss these innocent-looking background sentences.[1]
9. **Stress-test tool routing separately with a higher bar.** A pool TFR of 61.4% hides BFCL’s 85.7%. In production, tier gates by “does this trigger an external action?”: knowledge MCQs can be looser; side-effecting tool choices need a second confirmation or dual-model agreement.[1]
10. **Log context provenance and insertion points.** After an incident you must be able to answer which retrieval chunk or which user supplement pushed the margin across the boundary. Without a provenance ledger, targeted flips look like “the model randomly glitched.”
11. **Write the proposer threat model into the design doc.** If an adversary can optimize offline or call a learned generator (V2 already lifts one-gen TFR to 21.9%), defense cannot assume “the opponent only hand-writes one sentence.” Regression sets should include optimized contexts, not only handcrafted phrases.[1]
12. **Keep product-naming boundaries clear.** The study evaluates interface behavior (e.g., Jev 1.13.0); external messaging should separate “sensitivity found in evaluation” from “a vendor product is unusable.” Do not let readers hear JevOut as a shutdown notice.

## How this sits on the site’s Jev line

- Versus [Jev × Claude Code](/blog/jev-claude-code-10x-and-25-lines/): that post argued the decision layer should leave the generative hot path; this one argues that after it leaves, you still have to harden context. Wiring Jev is not permission to run bare probabilities.
- Versus [ContractNLI](/blog/jev-vs-llm-contractnli-same-scores-different-decisions/): there, similar aggregates can still disagree on single items; here, an initially correct single item can still be redirected to a high-confidence wrong option by short context. Both cut the shortcut from “pretty score” to “trustworthy decision.”
- Versus [Jev-Mem](/blog/jev-mem-system-one-agentic-memory/): Mem owns write / read / stop-fetch as a control plane; JevOut warns that “what you read into the decision head” (memory or retrieval) can itself be a flip carrier. Memory control is not only budget and stop-fetch—it is content trust and channel isolation.
- Versus [Jev-Mobile](/blog/jev-mobile-system-one-gui-executor/): Mobile narrows the executable space with program candidates and re-observation; JevOut shows that even with a fixed option set, **natural-language context outside the options** can still move the distribution. In a GUI loop, tree candidates address coverage; state text and task narration can still be a selection attack surface—hardening belongs on the narrative fed to the decision head, not only on candidate IDs.
- Versus [grow the harness](/blog/grow-the-harness-not-the-context/): longer, messier spliced context expands the operating room for JevOut-style fragility. Sinking recurring control into code *and* tightening who may add sentences into the decision input are the same engineering line.[4]

## Closing

Dedicated decision models turn language into a probability distribution over finite options so downstream software can route and act. JevOut shows convenience is not reliability. **Short, natural, answer-preserving context** can redirect a correct decision to a pre-fixed wrong option without changing the question or the gold—on Jev, TFR **61.4% (312/508)**, with **45.1%** reaching wrong-option probability ≥0.7 and **17.9%** ≥0.9; on tool-routing BFCL, **85.7%**. Under the same budget, OpenSourceJev, Von, and plain Qwen sit at **64.9%–73.2%**. Successful contexts have a median of only 31 added words; most need one or two additions.[1]

A finite option set plus a probability distribution makes model judgments easy for software to consume; **it does not ensure the choice follows the task rather than a persuasive detail.** If you already wire—or plan to wire—a Jev-class interface into an agent harness, what is worth copying first is not “a stronger decision head,” but isolating context, second-checking before side effects, monitoring margin, and writing targeted-flip evaluation into regression—so probability is an input to an auditable control plane, not the sole execution token.

## References

1. Zixiang Xu. *JevOut: Natural Context Can Flip Decision Models*. arXiv:2609.30243, 2026. https://arxiv.org/abs/2609.30243 · code https://github.com/xzx34/JevOut · homepage https://xzx34.github.io/jevout/
2. On this site: Jev × Claude Code. https://redreamality.com/blog/jev-claude-code-10x-and-25-lines/
3. On this site: Jev-Mobile GUI executor. https://redreamality.com/blog/jev-mobile-system-one-gui-executor/
4. On this site: Grow the harness, not the context. https://redreamality.com/blog/grow-the-harness-not-the-context/
5. On this site: Similar means do not mean identical decisions (ContractNLI). https://redreamality.com/blog/jev-vs-llm-contractnli-same-scores-different-decisions/
6. On this site: Memory control should not default to an autoregressive LLM (Jev-Mem). https://redreamality.com/blog/jev-mem-system-one-agentic-memory/
