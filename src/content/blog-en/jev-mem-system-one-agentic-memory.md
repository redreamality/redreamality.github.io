---
title: "Don’t Default Memory Control to an Autoregressive LLM: Reading Jev-Mem’s System-One Memory Architecture"
description: "A deep read of arXiv:2609.23986 Jev-Mem—separating memory organize/retrieve/stop into a System-One control plane—contrasted with this site’s Jev decision line and Growing Harness “sink control into code,” with checked LoCoMo numbers and a reusable design checklist."
pubDate: 2026-09-25T00:00:00+08:00
author: "Remy"
tags: ["Jev", "ai-agents", "LLM", "memory", "agent-harness", "System One"]
lang: "en"
---

Long-horizon agents hit the same wall: dialogue, tool outputs, and environment observations keep accumulating until a fixed context window cannot hold them. Stretching the nominal window does not mean the model will actually use every past span. Teams therefore add **agentic memory**—write experience out, organize it, and pull it back when needed. The question quickly shifts from “do we have memory?” to **who decides what to write, what to link, how to search, and when to stop?**

Many existing systems put that control on an autoregressive LLM by default: every memory operation generates more natural language, then parses and branches. Semantic flexibility is real; so is the cost of placing high-frequency decisions on an expensive generation path. In [arXiv:2609.23986](https://arxiv.org/abs/2609.23986), Jiang, Li, and Li (UT Dallas) introduce **Jev-Mem**, which splits that path: a **System-One control plane** for structured, high-frequency memory decisions; a **multi-relational memory plane** for traversable graph structure; and a **System-Two reasoning plane** only when evidence must be synthesized into an answer.[1]

This site has already covered TypeSafe’s commercial product—[how to wire Jev into Claude Code](/blog/jev-claude-code-10x-and-25-lines/), a [Jev use-case catalog](/blog/typesafe-jev-use-cases/), and [ContractNLI results where similar mean scores can still flip individual decisions](/blog/jev-vs-llm-contractnli-same-scores-different-decisions/). Those pieces are about the **decision layer** itself. This post moves to the **control plane of agentic memory**: what the same System-One / System-Two split looks like on write and read paths; which LoCoMo numbers you can check; and why this lines up with [grow the harness, not the context](/blog/grow-the-harness-not-the-context/).

Boundary first: **Jev-Mem is a research architecture named after System-One / System-Two inspiration**. The paper presents TypeSafe’s Jev as one concrete realization of lightweight structured decisions (the appendix uses `TypeSafeClient.system_one`). **Do not** read that as an official TypeSafe product line unless the vendor says so.[1][2]

## The problem: the cost of putting memory control on the LLM critical path

The paper’s agentic-memory workflow is clean. An agent maintains an evolving memory \(M_t\); a query \(q_t\) retrieves evidence \(E_t = R(q_t, M_t)\); a language model reasons over that evidence; the interaction may write back \(M_{t+1} = U(M_t, q_t, o_t)\).[1]

Early systems mostly stored interactions and retrieved by semantic similarity. Later work became more active: selective retention, consolidation of repeated observations, hierarchical stores, and graphs over semantic, temporal, causal, and entity relations. Control grew heavier with the store—persistent agents must repeatedly decide what to keep, update, connect, retrieve, and when to stop searching. Existing approaches often land on two poles: fixed heuristics (fast, inflexible) or general-purpose autoregressive LLMs (flexible, expensive).[1]

The key observation: many memory-control operations are **semantic but not generative**—classify a memory, judge its relation to existing nodes, score candidates, decide whether to expand further. Outputs are typically labels, probabilities, or scores, not free-form text. Putting those high-frequency decisions into token-by-token generation repeatedly pays formatting, parsing, and long-context overhead on the memory critical path; control itself can become a major source of latency and inference cost.[1]

That matches how this site positions Jev: many loop calls only need a structured judgment, yet they pay for generating a full assistant message.[3] Jev-Mem applies the same intuition to both ends of the memory lifecycle: write path and read path both need a control plane, not only a more careful final answer.

Cost shows up as latency that multiplies across hops, control prose that is hard to type-check or regress, and strategy talk that crowds evidence out of context—the same failure Growing Harness criticizes.[4] The question is not whether an LLM should ever touch memory; it is **which memory decisions are already stable enough to leave the generation loop.**

## Three planes: control, memory, reasoning

Jev-Mem compresses into three layers (Figure 2 in the paper):

1. **System-One control plane:** lightweight structured decisions over a bounded output space—memory typing, relation judgment, query routing, retrieval-budget allocation, graph traversal, candidate scoring, evidence-sufficiency assessment, and adaptive stopping.
2. **Multi-relational memory plane:** a shared structured data plane; canonical observation nodes carry semantic / temporal / causal / entity relational views.
3. **System-Two reasoning plane:** complex synthesis and final answer generation only; it does not participate in ordinary graph routing, candidate expansion, or stopping.[1]

The authors stress that the terminology is borrowed from dual-process accounts as an analogy for **how computation is allocated**, not a claim that underlying mechanisms match human cognition.[1] Keep that distance when reading on this site—“System One” here is primarily an engineering split, not a psychology conclusion.

The relationship to TypeSafe Jev can be stated precisely: Jev supplies one path to typed probabilistic decisions without autoregressive generation; Jev-Mem’s contribution is to elevate **memory control itself** to a first-class systems layer and to unify the same control abstraction across construction and retrieval.[1][2] In other words: commercial Jev is one controller backend; Jev-Mem is an architecture paper about how memory should be controlled. Authors are at UT Dallas CS; code is the GitHub org named in the paper. Sharing the “Jev” token reflects System-One interface borrowing—**not** a vendor product-family claim. The appendix uses shared `state` plus batched typed questions (Noul / Choice) returning \([0,1]\) scores that are **not assumed calibrated** and may be non-exclusive (episodic and semantic at once)—so production still needs thresholds and calibration.[1]

## Construction: type and candidate first, then selective edges

The write path is not “ask an LLM to author a memory note for every observation.” For each valid observation, Jev-Mem creates one **canonical memory node**, retaining the original text, provenance, timestamp, embedding, entities, and type scores; it does **not** make an irreversible store-or-discard decision at ingestion. The paper is explicit: this avoids permanently losing information that looks unimportant now but becomes relevant to a future query. Selectivity is deferred to structure construction and later retrieval, not to an ingress drop.[1]

The controller first predicts four overlapping memory characteristics:

\[
t(v) = (t_{\mathrm{episodic}}, t_{\mathrm{semantic}}, t_{\mathrm{procedural}}, t_{\mathrm{preference}})
\]

Scores annotate the node; they are not mutually exclusive single labels—the same observation can be episodic and preference-bearing at once.[1]

Next, candidate discovery is separated from relation judgment. To keep controller cost from growing linearly with memory size, deterministic signals—vector similarity, lexical overlap, shared entities, temporal proximity—first limit pairs to at most \(K_w\) candidates; System One then estimates semantic relatedness, directional causal influence, same-episode membership, and entity equivalence when needed. When reliable structured information already exists, learned inference is skipped: timestamp order can create temporal edges directly; exact shared identifiers can create entity edges directly.[1]

Multi-relational views are **independent views over the same node pairs**, not “each memory belongs to only one graph.” The same pair can hold both a semantic edge and a temporal edge. Periodic maintenance inspects a bounded neighborhood for redundancy, contradiction, obsolescence, and useful additional links; only when a higher-level textual abstraction is required does the control plane escalate an approved merge or promotion to System Two—generation is an optional consequence of a structured control decision, not the default maintenance mechanism.[1]

Write-path takeaways: keep canonical observations; batch typing/relation calls over a bounded candidate set; prefer timestamps/IDs over asking the model for edges that structure already decides.[1] Jev-Mem does not deny active organization (A-MEM / MemoryOS / MAGMA); it denies that **every** semantic control step needs another general-purpose generation—vs MAGMA, the sharper difference is leaving the autoregressive hot path with budgeted stop/continue retrieval.[1]

## Retrieval: route, budget, traverse, score, stop

Retrieval is a closed loop rather than a fixed top-\(k\):

\[
\mathrm{route} \rightarrow \mathrm{retrieve} \rightarrow \mathrm{assess} \rightarrow \mathrm{expand} \rightarrow \mathrm{reassess}
\]

On a query, the controller predicts each relational view’s relevance \(p_g(q)\), a multi-hop need \(h(q)\), and a recency importance \(r(q)\). View probabilities are evaluated independently, so one question can activate several graphs instead of being forced into a single retrieval intent. Views above an activation threshold receive budget: total expansion budget \(B\) is allocated by predicted weights, and the multi-hop prediction further constrains allowed depth.[1]

Anchor retrieval fuses vector and lexical rankings via reciprocal-rank fusion (\(\kappa=60\)) to find entry points, then expands on the graph. Each round estimates sufficiency \(s_d\), expected utility of further retrieval \(u_d\), missing evidence \(m_d\), and unresolved contradiction \(c_d\) for the current evidence set. Retrieval stops when evidence is sufficient and missing/contradiction masses are below thresholds—or when further utility is too low—guarding both early cutoff and unbounded expansion into distractors.[1]

Candidate scoring combines four System-One dimensions (query relevance, relation usefulness, information novelty, support for current evidence) with embedding similarity, edge weight, and an optional recency term; the top \(W\) form the next beam. After termination, the top-\(K\) memories go to System Two for final synthesis.[1]

Control overhead is explicitly capped: write-path batch sizes are bounded; each read round uses at most one evidence assessment and one batched candidate-scoring request; hard limits on expansions, edges, nodes, depth, controller invocations, and wall-clock time keep the control process itself from growing without bound.[1]

Vs Growing Harness the claim is isomorphic—**recurring control should not default to autoregressive generation**—but the sink differs: code vs typed System-One decisions over a controlled memory graph.[4] Fixed top-\(k\) never asks “enough?”; LLM-narrated stop policies are hard to regress; sufficiency + continue-utility + hard budgets are measurable. Production often mixes hard gates in code, soft expand/stop in System One, and System Two only on the final evidence pack.

## LoCoMo numbers: effectiveness, efficiency, and how to read them

Experiments use LLM-as-a-Judge (Zheng et al., 2023) for whether generated answers match references, with **gpt-4o-mini** on the judge side, and report total memory construction time plus average per-query latency (retrieve + answer).[1] The main tables are long-conversation memory QA on LoCoMo (Maharana et al., 2024). The body mentions “two widely used benchmarks,” but Tables 1 and 2 clearly report LoCoMo; LongMemEval appears in related-work / appendix context. **Below only numbers that match the tables—no extrapolation of unlisted results.**

### Effectiveness (Table 1, LLM-as-a-Judge; higher is better)

| Method | Multi-Hop | Temporal | Open-Domain | Single-Hop | Adversarial | Overall |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Full Context | 0.468 | 0.562 | 0.486 | 0.630 | 0.205 | 0.481 |
| A-MEM | 0.495 | 0.474 | 0.385 | 0.653 | 0.616 | 0.580 |
| MemoryOS | 0.552 | 0.422 | 0.504 | 0.674 | 0.428 | 0.553 |
| Nemori | 0.569 | 0.649 | 0.485 | 0.764 | 0.325 | 0.590 |
| MAGMA | 0.528 | 0.650 | 0.517 | 0.776 | 0.742 | 0.700 |
| **Jev-Mem** | **0.623** | 0.637 | **0.618** | **0.802** | **0.962** | **0.777** |

Relative to the strongest baseline MAGMA at Overall **0.700**, Jev-Mem’s **0.777** is about an **+11.0%** relative improvement (\((0.777-0.700)/0.700\)). Multi-Hop is 0.625 vs strongest baseline 0.569; Open-Domain 0.618 vs 0.517; Adversarial 0.962 vs 0.742—gains concentrate on queries that must combine evidence across memories or separate true relevance from plausible distractors.[1]

Read the table with one body/table tension in mind: the authors write that Jev-Mem is best in five of six categories and matches the best temporal result, but **Table 1 shows Temporal MAGMA 0.650 vs Jev-Mem 0.637**. Taking the table as authoritative, temporal is the exception, not a tie. Another body line says Single-Hop “0.797” while the table lists **0.802**—cite the table.[1]

### Efficiency (Table 2)

| Method | Build Time (s) | Latency (s) |
| --- | ---: | ---: |
| Full Context | N/A | 1.74 |
| A-MEM | 3636 | 2.26 |
| MemoryOS | 3276 | 32.68 |
| Nemori | 1044 | 2.59 |
| MAGMA | 1404 | 1.47 |
| **Jev-Mem** | **158** | **0.93** |

Against the fastest competing memory system Nemori at 1044 s, 158 s is about a **6.6×** speedup (~84.9% construction-time reduction). Query-side 0.93 s is about **−36.7%** versus the fastest memory baseline MAGMA at 1.47 s, and about −46.6% versus Full Context at 1.74 s. MemoryOS at 32.68 s per query shows that “memory management” alone can wreck the read path.[1]

The paper’s efficiency attribution is specific: construction batches typed decisions over a bounded candidate set instead of repeatedly invoking a general-purpose LLM for free-form memory processing; retrieval uses System One for routing / evaluation / stopping, with explicit budgets on graph exploration.[1] **Effectiveness and efficiency improving together** is the systems claim most worth citing—conditional on accepting LoCoMo + LLM-as-a-Judge as the evaluation proxy.

Baselines include Full Context, A-MEM, MemoryOS, Nemori, and MAGMA, with a shared backbone answer model when applicable.[1] Full Context’s Overall 0.481 / Adversarial 0.205 show that stuffing history into the window is not using it; Jev-Mem’s Adversarial 0.962 is the other face of adaptive selection with explicit stopping.

### Limits (honest boundaries)

Main metric is LLM-as-a-Judge (gpt-4o-mini), not full human labels—treat same-family judge risk seriously. Primary tables are LoCoMo only (body mentions two benchmarks without a second main table)—do not inflate 0.777 into universal SOTA. Cite Temporal/Single-Hop from Table 1 where body wording disagrees. Multi-relational graphs still need ops budget; appendix typed interfaces couple reported numbers to the experimental System-One stack even if the layering claim is backend-agnostic;[1] and there is no main-table ablation separating multi-relations vs stopping vs batching.

## Contrast with this site’s Jev / harness / memory posts

Place Jev-Mem back into the site’s narrative and the contrast sharpens:

| In-site post | Problem it nails | Intersection with Jev-Mem |
| --- | --- | --- |
| [Jev × Claude Code](/blog/jev-claude-code-10x-and-25-lines/) | Jev is not a chat model; the interface is `state` + typed `questions` | Memory control is exactly the high-frequency decision that should not emit assistant messages |
| [Jev use-case catalog](/blog/typesafe-jev-use-cases/) | Routing, gates, context-management judgments | Jev-Mem expands “context management” into a full memory lifecycle |
| [ContractNLI decision contrast](/blog/jev-vs-llm-contractnli-same-scores-different-decisions/) | Similar means can hide flips; watch persistent correctness | Memory selection likewise should not stare at one Overall; split by question type and stability |
| [Growing Harness](/blog/grow-the-harness-not-the-context/) | Grow the harness, don’t pile context | Both move recurring control off the autoregressive hot path—one into code, one into System One |
| [ECC Memory Vault](/blog/ecc-agent-harness-optimization/) | Inspectable Markdown vaults, not unauditable mush | Aligns with “canonical observations first; generation is optional escalation”: an auditable store plane |
| [Copilot memory and the agentic coding stack](/blog/github-copilot-memory-agentic-coding-stack/) | Product side filling long-lived project context and process participation | Product memory layers still must answer “who owns the control plane?” |

One sentence through-line: **the decision layer (Jev) makes judgment cheap and structured; the harness layer (Growing Harness / ECC) decides which control should sink into code and config; Jev-Mem asks why high-frequency control inside the memory subsystem should not default back into LLM generation.** All three attack the same failure mode—paying open-ended generation for control that could be structured.

## Design checklist: when to split out a memory control plane

Paste this into a design review; it does not require adopting the paper’s Jev backend.

1. **Count call shapes first.** If every write/retrieve round asks an LLM to “write a memory strategy / explain why to stop,” compress those outputs into labels, probabilities, and scores—a control-plane candidate has appeared.
2. **Write path: canonical observation vs distilled summary.** Default to retaining reversible originals and provenance; treat summary/merge as explicit escalation with an audit trail (same direction as ECC vaults).
3. **Separate relations from retrieval views.** When semantic similarity is not enough, model temporal / causal / entity views explicitly; on the query side, allow **multiple views to activate together** under a total budget, not a single-channel top-\(k\).
4. **Retrieval must have stop conditions.** Model both “is evidence enough?” and “is further search still worth it?”; add hard caps on nodes / edges / depth / latency.
5. **Batch and bound controller calls.** Submit write typing/relations and read routing/scoring in batches; forbid a free-form generation per neighbor.
6. **Split effectiveness from efficiency in eval.** At minimum report answer quality (ideally by question type), construction wall-clock, and query latency; do not let “memory got smarter” hide a slower read path.
7. **Treat LLM-as-a-Judge as a proxy, not a final court.** Calibrate with business gold labels or human spot checks before launch; the persistent-correctness habit from the ContractNLI post applies to memory QA too.
8. **Keep product names and architecture names distinct.** System-One-inspired memory control is not the same as purchasing one vendor’s decision model; backends can change while the layering claim is tested independently.

Risks for the same review: judge-proxy bias; graph ops (thresholds, redundancy, contradiction, entity alignment); premature ingest discard that deletes future evidence;[1] overfitting LoCoMo gains; threshold drift without monitoring; and larger ACL blast radius once relations are traversable (pair with vault/ACL design as in ECC).[5]

MVP slice: **write typing + redundancy/contradiction marks + retrieval stopping** on one typed interface for two weeks (build/query latency + spot checks). Add causal/entity views only after those calls clearly save generation cost—otherwise you inherit graph ops before proving the split.

## Closing

Jev-Mem’s most useful contribution is not another “higher memory score” headline. It reframes the systems question: **is memory control a high-frequency, bounded-output decision, or occasional open-ended generation?** If the former, it should not default to the autoregressive hot path. On LoCoMo, Overall **0.777** (~**+11.0%** relative to the strongest baseline), construction **158 s** (~**6.6×**), and query **0.93 s** (~**−36.7%**) show that—in this paper’s setting—separating control from reasoning can improve effectiveness and efficiency **together**, provided you accept the evaluation proxy and read fine-grained cells from the tables.[1]

For readers of this site, the piece is a natural extension of the Jev decision line into the memory subsystem, and an echo of Growing Harness’s “sink control out of the model” on a different implementation path. To land it, you need not clone the full multi-relational graph first; pulling write typing / retrieval stopping / budget allocation out of free-form generation is often enough to see latency and auditability move.

A practical roadmap on this site: find judgment-only calls in the [use-case catalog](/blog/typesafe-jev-use-cases/), wire them via [Claude Code](/blog/jev-claude-code-10x-and-25-lines/), design stability panels as in [ContractNLI](/blog/jev-vs-llm-contractnli-same-scores-different-decisions/), push the same plane into memory with this post, then ask [Growing Harness](/blog/grow-the-harness-not-the-context/) what can sink further into code. Long-horizon writing wants that chain, not a ranking-chasing score.

Code: [github.com/libingzheren/Jev-Mem](https://github.com/libingzheren/Jev-Mem). PDF: [arXiv:2609.23986](https://arxiv.org/pdf/2609.23986).[1]

## References

[1] Dongming Jiang, Yi Li, Bingzhe Li. *Jev-Mem: System-One-Controlled Agentic Memory for Efficient AI Agents*. arXiv:2609.23986, 2026. https://arxiv.org/abs/2609.23986

[2] TypeSafe AI. *TypeSafe AI* (paper bibliography entry; treat vendor docs as source of truth for Jev / System One APIs). https://typesafe.ai/

[3] In-site: [Jev × Claude Code](/blog/jev-claude-code-10x-and-25-lines/), [Jev use cases](/blog/typesafe-jev-use-cases/)

[4] In-site: [Grow the Harness, Not the Context](/blog/grow-the-harness-not-the-context/) (source paper arXiv:2609.26760)

[5] In-site: [ECC: verifiable harness optimization](/blog/ecc-agent-harness-optimization/) (Memory Vault note)
