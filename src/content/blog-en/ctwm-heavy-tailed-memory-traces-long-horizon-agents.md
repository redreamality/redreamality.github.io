---
title: "CTWM: Heavy-Tailed Memory Traces in Long-Horizon Agents"
description: "A deep read of arXiv:2610.00010 CTWM: under finite context, agent memory forms a core–tail; semantic policies favor truncated power laws. Rank-budget τ with a summarized tail: Synthetic Graph World −5.9% tokens and −13.6% bottom-half tail error vs graph memory; LongMemEval −24.48% tokens at accuracy parity; ALFWorld paired savings ~3.9–6.6%."
pubDate: 2026-10-03T16:40:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "developer-tools"]
lang: "en"
---

Long-horizon language agents increasingly treat external memory as a frozen world model: a memory stream, a vector store, a graph, a temporal knowledge base, or a paging layer that survives beyond the current prompt. Evaluation usually keeps only two rulers—**task success** and **token cost**. In [arXiv:2610.00010](https://arxiv.org/abs/2610.00010) (*Heavy-Tailed Memory Traces in Long-Horizon Language Agents*), Xinyuan Song (Emory) and Zekun Cai (The University of Tokyo / LocationMind) argue that a third object is equally important: **the shape of memory use**. Under finite context and repeated retrieval, memory concentrates on a small core while rare states fall into a long tail where prediction errors accumulate. Once the window is finite, memory is no longer a neutral ledger; it is a resource-allocation mechanism. If you only watch the final grade and the bill, you never see which hubs keep absorbing attention.[1]

This is not another soft news item that a “new memory module” shipped. The question is harder: when you already have a graph-memory or retrieval backend, can the **statistical shape of the same access trace** serve first as a diagnostic and then as a controllable budget knob? The authors call the controller **CTWM** (Core–Tail World Model): allocate prompt budget by rank, steer concentration with a single exponent \(\tau\), and **retain a summarized tail instead of discarding it**. This post is a deep survey: why success and tokens alone miss the story; what a conservative tail audit shows and how it depends on policy; how CTWM turns ranks into budget; how to read Synthetic Graph World, ALFWorld, and LongMemEval; what to migrate into a harness memory layer; and what the paper explicitly does **not** claim. Code is released at [github.com/Hik289/world-model-self-organized-criticality](https://github.com/Hik289/world-model-self-organized-criticality.git).[1]

Site crosslinks, to keep threads from collapsing into each other. [JitMem: synthesize memory at read time](/blog/jitmem-read-time-agent-memory/) asks **when curation happens**—write time versus read time. This article asks **how retrieved items share a finite window**—a different axis and a different knob. [Grow the harness, not the context](/blog/grow-the-harness-not-the-context/) sinks stable control into executable code; CTWM sinks the stable decision “who deserves more slots” into an interpretable scalar \(\tau\). [MomHA’s multi-objective harness](/blog/momha-multi-objective-harness-accuracy-safety-tokens/) tracks accuracy, safety, and tokens together; CTWM supplies an auditable allocation rule on the token–coverage–tail-error triangle. An earlier [Jev-Mem](/blog/jev-mem-system-one-agentic-memory/) post is only a light memory-line crosslink—**this piece does not use the weekly Jev quota** and does not center System One typed memory. The focus is heavy-tailed traces and rank budgets.

## The missing object is not “having memory,” but the shape of use

The deployment loop is familiar: observations and tool results keep arriving; memory updates locally; retrieval runs through a coupled state–transition structure; prompt and API budgets discard part of what was stored. The authors note that these ingredients resemble those that produce heavy tails in complex systems (local updates, coupled structure, repeated exposure, resource truncation), but that resemblance **does not by itself justify a criticality claim**. They deliberately use conservative labels—heavy-tailed, log-normal-compatible, truncated-power-law-compatible—rather than inventing an “agent criticality” brand. The measurement hypothesis is narrower: if an agent’s world model naturally concentrates around a small core and a long tail, can we audit that structure and turn it into a better memory controller?[1]

Under a finite context window, memory stops being a neutral record. Success tells you whether the task finished; tokens tell you what you spent; neither shows **where** the agent pressed attention—on which states, transitions, and retrieved evidence. If rare states live forever at the budget margin, bottom-half prediction error rises systematically. That is one mechanistic reading of “averages look fine, long-horizon rare failures still bite.” Graph-retrieval systems (GraphRAG, LightRAG, HippoRAG, and kin) already show that relational structure can help reasoning while also creating hubs: PageRank-like propagation and top-\(k\) filtering repeatedly push the same small subset into the window. CTWM treats that concentration as both a confound and a resource—isolate the confound with a random-walk ladder, then reuse the same ranked structure for allocation once a semantic policy induces a stronger audited tail.[1]

The problem setup is explicit and deliberately separated from classical learned latent world models. The base language model is frozen; parameters are not updated. All adaptation happens through external memory \(W_t\), retrieval, and prompt construction. At step \(t\) the agent observes \(o_t\), chooses action \(a_t\), extracts a structured state \(s_t\), records a transition \(e_t=(s_t,a_t,s_{t+1})\), retrieves context \(C_t\subseteq W_t\) from finite memory, predicts \(\hat s_{t+1}\), and logs \(\ell_t=\mathbf{1}\{\hat s_{t+1}\neq s_{t+1}\}\). **Tail error** is the mean of \(\ell_t\) on the **bottom half of states by visit count**—a benchmark-agnostic quantile definition that does not require a hand-tuned frequency threshold. The experimental stance stresses actual API-reported prompt tokens and paired comparisons: memory systems should improve the cost and reliability of the agent loop, not only an offline retrieval score.[1]

In related work, MemGPT treats memory movement as OS-style paging; Generative Agents score memories by recency, importance, and relevance; Reflexion stores verbal feedback; MemoryBank and other agentic memory systems manage long-term stores explicitly; temporal and graph memories organize experience as evolving relations; Voyager shows that long-horizon interaction can accumulate reusable skills. CTWM does **not** replace the backbone policy, train a new latent dynamics model, or ask the prompt to carry the whole history. It asks how a finite external memory is statistically used after many steps, and it exposes a scalar allocation parameter for that measured trace. Retrieval-augmented generation and long-context studies also remind us that providing more context is not the same as using it well: models miss middle-of-prompt information, and streaming attention implicitly prioritizes a small set of durable tokens. CTWM treats prompt budget as an explicit allocation problem rather than an unstructured context-length dial.[1]

## Tail audit: concentration is reproducible but policy-dependent

The authors run a Clauset-style conservative audit: form a truncated sample of positive observations, fit \(x_{\min}\) and an exponent, screen with bootstrap goodness-of-fit, then compare a truncated power law to a log-normal alternative via likelihood ratio and its standard error. Fixed thresholds include \(n_{\mathrm{tail}}\ge 100\), \(p^\star=0.10\), and \(z^\star=1.96\). Only traces that pass earn the label truncated-power-law-compatible—**not** a claim of scale-free topology, and **not** full self-organized criticality (which would also require coupled avalanches and compatible temporal scaling). That narrow label matters for engineering: you can use shape as a diagnostic without marketing every log-log plot as a physical law.[1]

### Random walk: concentration exists, but it looks like a retrieval artifact

The negative control is crucial. Even when the policy has no semantic preference, finite top-\(k\) retrieval repeatedly exposes the same hubs and creates heavy-tailed access. Across 54 graph-size cells in the random-walk audit, the **pure power-law pass rate is 0%**, and the power-spectral-density exponent range over measured traces is \([0.048, 0.176]\)—nowhere near a \(1/f\) regime. The control is still useful. Table 1 shows that in five of six graph families, concentration in the top 10% access counts rises with graph size (for example, uniform-degree \(\sigma\) moves from 0.152 at \(|V|=100\) to 1.364 at \(|V|=1000\)). Reading: the random-walk tail is an **actionable allocation signal**, not evidence of critical dynamics. It teaches what a memory artifact looks like so that not every log-log curve gets called a power law.[1]

The retriever ladder (Figure 3) peels the mechanism into four rungs. A uniform reservoir with frequency sorting alone already reaches Gini **0.698**, but graph families nearly overlap—concentration from sorting, decoupled from topology. A state-aware top-\(k\) retriever separates families, with Gini roughly **0.44–0.63**. **Disabling retrieval** (write-only memory, no top-\(k\) exposure loop) collapses Gini to **0.29–0.35**, a **33–45%** drop—the heavy tail nearly disappears. Non-preferential state-aware retrieval (recency / uniform payload, state-aware but not semantic) still retains **92–94%** of the scale-free Gini; a symmetric-payload regular graph still yields Gini **0.638**. The narrow, useful conclusion: **finite top-\(k\) retrieval can create hub-like memory concentration before any semantic policy enters the loop**. The random-walk control’s value is exactly to separate “retriever artifact” from “task-shaped tail.”[1]

### Semantic LLM policies: the strongest truncated-power-law core–tail

With a frozen API model and ReAct-style semantic action selection, the story changes. The random-walk baseline fails the stronger fitted-tail and temporal checks. Semantic policy produces finite-mean core–tail concentration, and the truncated-power-law family is preferred on the strongest audited traces. A topology control sweep over uniform-degree, exponential-degree, modular, and scale-free graphs supports a core–tail reading across several families, with **scale-free evidence clearest** and uniform degree weakest (a near miss). The conservative statement: semantic policy induces power-law-compatible concentration beyond a single graph family, while the strongest truncated-power-law evidence still appears under scale-free conditions. For engineering the implication is blunt—when logs show uneven memory access, ask whether the driver is random or semantic. The former is more likely a retrieval artifact; the latter is the regime where allocation control like CTWM becomes valuable.[1]

The main finding compresses to one sentence: finite agent memory reliably concentrates into a small core and a long tail, but **the meaning of that tail depends on the driver**. Random-walk tails diagnose retrieval artifacts; semantic-policy tails are where truncated-power-law-compatible concentration appears and where CTWM’s rank allocation reduces tail-state error.[1]

## CTWM: allocate by rank, not raw scores; summarize the tail, do not drop it

Retrieval scores are rarely calibrated across memory systems, but the induced order is usually meaningful. CTWM therefore uses rank \(r\) (lower means higher priority) rather than raw scores. Highest-ranked items form a compact core; lower-ranked items form a **summarized tail**; a single exponent \(\tau>0\) controls how sharply prompt budget concentrates on the core:

\[
b_t(r;\tau)=\frac{r^{-\tau}}{Z_t(\tau)},\qquad Z_t(\tau)=\sum_{j=1}^{M_t} j^{-\tau}.
\]

A small \(\tau\) behaves closer to uniform retrieval (formally, as \(\tau\downarrow 0\), every rank’s share tends to \(1/M_t\)); a larger \(\tau\) spends more context on high-rank memories while leaving a **measured tail slice** rather than cutting the tail away. That is the structural advantage over unstructured history packing and flat retrieval: a measured core–tail trace becomes a tunable budget policy. In implementation, the core uses compact rank-ordered hints and the tail uses aggregate summaries. Serialization is intentionally separate from the allocation rule—ablations cross verbose versus compact encoding with graph retrieval versus CTWM allocation. Main comparisons use \(\tau=1.0\). The appendix states formal monotonicity guarantees and discusses practical tuning: lower \(\tau\) or thicken the tail summary when rare states are missing; raise \(\tau\) when the prompt is dominated by stale context.[1]

The update-and-retrieval loop (Figure 2) is equally clear: parse observations into states and transitions; rank the finite reservoir for the current step; partition into a high-priority core and a summarized tail; allocate prompt budget by the rank exponent; log prediction error, retrieval counts, and tokens after each API call, closing the measurement loop. CTWM gives the memory backend an interpretable control surface rather than another hard-to-audit prompt spell.[1]

## How to read the numbers: Synthetic → ALFWorld → LongMemEval

Setup. Synthetic Graph World contains six graph families at \(|V|\in\{100,500,1000\}\). The random-walk audit uses 54 replicated graph-size cells; the semantic audit includes a topology-control sweep. Method comparisons use four memory policies: Full History, Flat Retrieval, an AriGraph-style Graph Memory baseline, and CTWM with \(\tau=1.0\). Cross-benchmark validation uses ALFWorld through its TextWorld-compatible interface and LongMemEval. Tokens are actual API-reported prompt tokens per API-calling step.[1]

### Synthetic Graph World: full coverage, lower tokens and lower tail error

Table 3 is the central practical result (state and transition coverage both **1.000/1.000**):

| Method | Tokens/step | Tail error |
| --- | ---: | ---: |
| Full History | 3601.1 | 1.000 |
| Flat Retrieval | 159.9 | 0.994 |
| Graph Memory | 170.71 | 0.932 |
| CTWM | 160.65 | 0.805 |

Relative to Graph Memory, CTWM reduces prompt tokens by **5.9%** and bottom-half tail prediction error by **13.6%**, while preserving full coverage. Read the table as a four-way trade-off. Full History is complete but far too expensive. Flat Retrieval is cheap but has almost no tail-state predictive value (0.994 is close to “blind on the tail”). Graph Memory improves the tail by organizing the trace (0.932). CTWM improves **both** sides of the trade-off under the same coverage target. That is the central evidence that the measured heavy tail is not only descriptive—it yields a useful allocation rule.[1]

Table 4 separates allocation from compact encoding. Moving Graph Memory from verbose to compact barely changes tail error (0.932 → 0.931): compression alone does not save the tail. Adding CTWM allocation lowers tail error under both encodings; **compact CTWM** is Pareto-best in the matrix (about 160.7 tokens, tail error **0.805**), while verbose CTWM sits at 200.3 tokens and 0.856. Frozen-trajectory replay sharpens the attribution: with the retrieval map and ranked memory IDs fixed, compact encoding mainly changes the LLM-facing prompt view and the subsequent policy path; matched replay shrinks the live gap to about \(4\times10^{-4}\). Engineering reading: **tune allocation as a resource policy; tune serialization as an interface to the model**—do not collapse them into one dial.[1]

A \(\tau\) sweep over seven values from 0.25 to 2.0 shows that full-distribution concentration statistics follow the prediction: Gini, skew, and max/median all rise with \(\tau\). The authors deliberately avoid using automatically selected-\(x_{\min}\) Clauset \(\hat\alpha\) as the control metric because the cutoff is unstable under the sweep (Appendix D). Figure 7 presents \(\tau\) as a closed-loop concentration knob: you are choosing which ranks receive budget, not guessing another mysterious temperature.[1]

### ALFWorld: consistent paired token savings, about 3.9–6.6%

Table 5 reports paired token reductions of CTWM against Graph Memory (Synthetic replications included to show directional stability):

| Configuration | Token reduction |
| --- | ---: |
| Synthetic graph A | 5.68% |
| Synthetic graph B | 6.22% |
| Synthetic graph C | 5.77% |
| ALFWorld short-walk | **6.61%** |
| ALFWorld long-walk ReAct | **4.36%** |
| ALFWorld one-shot ReAct | **4.95%** |
| ALFWorld three-shot ReAct | **3.90%** |
| LongMemEval | **24.48%** |

In embodied text environments, a fixed ReAct prompt already occupies much of the context, so memory’s share is smaller and savings are modest but consistent—the body summarizes about **4–7%** across paired settings. The boundary that must enter decisions: **the cross-benchmark claim is token efficiency under paired episodes, not task success**. The paper states that the current untuned API ReAct policy on ALFWorld is not strong enough to support a success claim; failure modes are reported in Appendix B. That three-shot saves less than short-walk also matches the intuition that fixed demonstrations already consume window, leaving less allocatable remainder.[1]

### LongMemEval: −24.48% tokens with aggregate accuracy parity

In long-term conversational memory, memory content is a larger share of the prompt. Under the same paired comparison, CTWM reduces tokens by **24.48%** relative to Graph Memory while preserving **aggregate accuracy parity**. The paper also reports a multi-session recall blind spot: for recall-critical queries, aggressive core–tail budgeting should be relaxed. The cross-benchmark story is therefore not that CTWM solves every downstream task, but that **the same audited allocation rule spends less context across very different memory workloads**—synthetic graph dynamics, embodied text, and long conversational memory. Direction is consistent; magnitude tracks how much of the window memory occupies.[1]

## What to migrate into your harness memory layer

If you already run graph memory, vector retrieval, or paging, you do not need to rename the whole stack “CTWM.” The practical move is to embed the paper’s audit→control pipeline into the existing harness memory layer:

1. **Log the shape of memory access.** Record visit counts and prediction errors by state, transition, and retrieved item; at minimum plot core versus bottom-half tail error, aligned with API-reported tokens. Without that picture, success rates and token bills will keep hiding allocation problems.
2. **Diagnose policy dependence first.** Treat heavy tails under random or near-random driving as retrieval artifacts (check whether Gini collapses when retrieval is disabled). Enter allocation control when semantic driving audits closer to a truncated power law. Do not treat every log-log curve as a physical power law.
3. **Prefer ranks over raw scores.** Cross-backend scores are rarely comparable; order is usually more stable. Give the core compact, actionable hints; **summarize and retain** the tail—do not delete it wholesale to save tokens.
4. **Expose a \(\tau\) knob.** Small \(\tau\) is more uniform; large \(\tau\) focuses the core. Lower \(\tau\) or thicken the tail summary when rare states are missing; raise \(\tau\) when stale context floods the prompt. Treat it as a resource-policy config, not another brittle prompt template.
5. **Tune allocation and serialization separately.** Ablations show allocation dominates tail robustness; compact encoding mainly changes how the model reads the prompt and which path it takes. Give each its own KPI: tail error and coverage for the former; tokens and trajectory drift for the latter.
6. **Align evaluation with the paper’s protocol.** Use API-reported tokens; define tail error by quantile; report paired tokens before success—especially when the base ReAct policy is weak. Keep a “relax \(\tau\) / thicken tail” switch for LongMemEval-style recall-critical settings.
7. **Stack with other memory knobs; do not substitute them.** Read-time curation (JitMem), sinking control into code (Growing Harness), and multi-objective accuracy–safety–tokens (MomHA) solve different layers. CTWM adds **attention shape inside a finite window**. You can do all three: steam less at write time, synthesize at read time, then spend the window by rank.[1]

Compared with “just lengthen context,” CTWM sits closer to this site’s harness narrative: the window is scarce, and the default move should not be stuffing it forever. Long-context work has repeatedly shown that mid-prompt information is easy to miss, and streaming attention implicitly protects a small durable set. If you already use graph memory yet still feel that “longer context is more expensive and tail states stay fragile,” what you often lack is not a larger \(k\), but an access-shape dashboard and a switch from flat top-\(k\) to rank-weighted budget plus a summarized tail. \(\tau\)’s advantage is that it is interpretable, reversible, and can coexist with an existing backend—you do not have to rewrite the whole memory path before the team will try it.[1]

Wire the shape dashboard into the tracing and eval harness you already run. Persist at least visit-rank histogram, bottom-half tail error, API prompt tokens, and current \(\tau\) per trajectory so a regression can ask whether a token win silently sacrificed rare states—the same discipline as putting safety and cost beside accuracy in MomHA.[1]

Day-to-day debugging follows the same order. When rare states repeatedly mispredict, check the visit histogram before lengthening the window or swapping a larger model. Errors in the bottom half while the core eats most slots look like allocation; concentration that vanishes when retrieval is disabled looks like a top-\(k\) artifact. Write that order into the runbook before pasting “CTWM” onto an architecture diagram.[1]

## Caveats: what the paper does not claim

Honest boundaries matter more than headlines when you decide what to ship:

- **No claim of full self-organized criticality.** Random-walk heavy tails fail pure-power-law and temporal tests; semantic-side evidence is distributional, not avalanche dynamics. The word “criticality” in the repository name is a research lead, not a proven physical conclusion.
- **Topology and \(\tau\) sweeps are finite audits**, not exhaustive environment studies. Finite samples, binning, alternative distributions, and moving cutoffs all make power-law claims fragile—the paper’s conservative labels exist for that reason.
- **ALFWorld does not support a task-success claim**; the claim is paired token efficiency. The success ceiling of untuned API ReAct should not be smuggled into a “CTWM makes tasks better” story.
- **LongMemEval exposes a multi-session recall weakness**; recall-critical queries should not get a one-size aggressive core.
- **The base model is frozen.** Conclusions target API-agent settings where adaptation lives in memory and retrieval. They do not automatically transfer to end-to-end learned latent world models, nor do the numbers auto-translate after swapping a stronger executor.
- Code is linked from the paper; reproduction should still follow the original protocols and Tables 3–5. This post invents no numbers absent from the body.[1]

## Takeaway

If long-horizon agent memory evaluation keeps only success and tokens, you are reading the bill and the final grade while ignoring whether attention stays pinned on the same hubs and whether rare states quietly lose points in the tail. Song and Cai’s conservative tail audit shows that concentration is reproducible but **policy-dependent**: random walks look like log-normal-compatible retrieval artifacts; semantic LLM policies more readily produce truncated-power-law-compatible core–tail traces. CTWM turns that audited shape into a rank budget \(b(r;\tau)\propto r^{-\tau}\), with a compact core and a summarized tail, without retraining the base model. Relative to a graph-memory baseline: on Synthetic Graph World, tokens **−5.9%** and bottom-half tail error **−13.6%** at full coverage; on LongMemEval, tokens **−24.48%** with aggregate accuracy parity; on ALFWorld, paired savings about **3.9–6.6%** (short-walk 6.61%, long-walk ReAct 4.36%, one-shot 4.95%, three-shot 3.90%). Heavy-tailed memory traces are therefore both a **diagnostic** of finite retrieval and a practical **control signal** for token-efficient agent world models—worth embedding in the harness memory layer, not only reading as a complex-systems metaphor.[1]

## References

[1] Xinyuan Song, Zekun Cai. *Heavy-Tailed Memory Traces in Long-Horizon Language Agents*. arXiv:2610.00010, 2026. [abs](https://arxiv.org/abs/2610.00010) · [html](https://arxiv.org/html/2610.00010) · [code](https://github.com/Hik289/world-model-self-organized-criticality.git)
