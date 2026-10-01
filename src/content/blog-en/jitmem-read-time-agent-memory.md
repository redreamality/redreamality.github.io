---
title: "JitMem: Curate Agent Memory at Read Time"
description: "A mechanism read of arXiv:2609.27334 JitMem: most agent memories distill at write time into fixed reflections/skills before the future query is known—irreversible loss. Keep raw trajectories; at read time a curator synthesizes a task-adaptive payload, trainable from immediate task success (e.g. GRPO). +16.2/+16.3/+3.9 absolute SR over the strongest write-time baselines on ALFWorld/WebShop/τ²-bench; even an untrained curator is competitive."
pubDate: 2026-10-01T10:40:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "memory", "developer-tools"]
lang: "en"
---

Agent memory is useful only insofar as it improves **future** task success. Most deployed designs, however, distill a trajectory as soon as it finishes—into a reflection, insight, workflow, executable skill, or reasoning strategy—then retrieve that fixed artifact by similarity. The catch: **the future query is not known yet, but you have already decided what to keep and what to throw away.** Discarded detail cannot be recovered. The same trajectory could teach different lessons for different downstream tasks, yet write-time curation nails it to a single telling.[1]

Yefan Zhou, Yang Li, Zeyu Leo Liu, Semih Yavuz, and Shafiq Joty flip the timeline in preprint [arXiv:2609.27334](https://arxiv.org/abs/2609.27334) (*Just-in-Time Memory: Learning to Curate Task-Adaptive Memory for LLM Agents*): **store raw trajectories losslessly; defer curation until read time, when the current task is known; let a memory curator synthesize a compact, task-adaptive payload.** They call the system **JitMem**. Because the payload is consumed on the same task, the curator can be trained from immediate task success (GRPO in the paper), without artificially grouping related tasks to manufacture a delayed learning signal.[1]

Headline gains over the strongest write-time baseline in each setting: **+16.2 / +16.3 / +3.9** absolute success-rate points on ALFWorld / WebShop / τ²-bench. Sharper still: **even an untrained curator** is already competitive with or better than strong write-time methods—read-time framing itself is a major source of the gain; training compounds it.[1]

This is a mechanism post: what write-time curation costs, how the read-time pipeline is factored, how to read the numbers and ablations, and how it differs from in-site [Jev-Mem](/blog/jev-mem-system-one-agentic-memory/) (one cut is **when** to curate; the other is **System-One typed memory control**—do not conflate them). This piece does **not** spend the weekly Jev quota; Jev-Mem appears only as a brief crosslink contrast.

## Write-time curation: two structural costs

Surface designs differ widely—Reflexion-style verbal reflections, Expel-style insights, Generative Agents–style memory streams with periodic summarization, Voyager-style executable skills, Agent Workflow Memory, MemP’s multi-granularity items, ReasoningBank’s transferable strategies, adaptive write policies that use prediction error to decide what deserves distillation, and more. The authors collapse them to two shared properties:

1. **Curation is triggered at write time**—distill when the task ends.  
2. **The stored artifact is query-independent**—finalized before any future task arrives.[1]

Two structural bills follow. First, **information loss is premature and irreversible**: detail thrown away at write time is gone when a later task needs it. Second, **one fixed artifact must serve many future queries**: the same household trajectory might teach a heat/cool state transition *or* a placement strategy; write-time can bet on only one abstraction. Same root cause: **curation happens before the downstream task is known**.[1]

Learning makes it worse. The value of a storage decision may surface only when a relevant query arrives many tasks later—a **long-horizon credit-assignment** problem. Learned write-time curators such as SkillOS therefore **group related tasks** to manufacture a delayed signal; the paper notes that grouping itself is a major contributor to performance. JitMem’s claim is not “your distillation prose is weak,” but that **the timeline is wrong**.[1]

In-site alignments:

- [Grow the harness, not the context](/blog/grow-the-harness-not-the-context/) — recurring control decisions belong in executable code, not ever-longer prompts. JitMem asks the complementary question: **when should experience itself be shaped?**  
- [Progressive disclosure and Agent Skills](/blog/progressive-disclosure-agent-skills/) — large skill libraries expose frontmatter first and load on demand; that is **packaging and disclosure bandwidth**. JitMem asks whether **the same raw experience can be re-distilled per task**—skill packaging and episodic memory are different layers.  
- [GitHub Copilot’s memory stack](/blog/github-copilot-memory-agentic-coding-stack/) — product memory, planning, and task breakdown still leave the mechanism question: write-time summary vs read-time synthesis. Having a memory feature is not the same as choosing the curation time correctly.

Related work also includes in-session working-memory lines (Sculptor, ContextCurator, MemSearcher, …): RL over observation history **within one task**. JitMem targets a **persistent cross-task episodic bank**. Concurrent MemHarness also curates at read time but fuses curation with execution, so transfer across executors is harder. JitMem decouples curator from executor over a streaming bank.[1]

## Pipeline: Retrieve → Curate → Execute → Update

In a streaming task setting the agent sees \(x_1,x_2,\ldots\), produces trajectory \(\xi_t=(o_1,a_1,\ldots)\), and receives task-success reward \(r_t\in[0,1]\). JitMem has four parts: a memory bank \(\mathcal{M}\) of complete unabstracted trajectories, a retriever \(\mathcal{R}\), a trainable curator \(\pi_\phi\), and a frozen executor \(\pi_L\). Only the curator is trained; the objective is cumulative task success \(\sum r_t\).[1]

Four steps per task:

1. **Retrieve** \(\hat{\bm{\xi}}_t=\mathcal{R}(x_t,\mathcal{M}_t)\). Implementation: BM25 over **task descriptions only** (not trajectory bodies), top-\(k\) with \(k=3\) in the main results (appendix: insensitive for \(k\in\{3,5\}\)). The retriever is not trained and is shared with baselines; the framework does not require BM25.  
2. **Curate** \(p_t=\pi_\phi(x_t,\hat{\bm{\xi}}_t)\). Structured prompt: current task + \(k\) raw trajectories. Output: a natural-language briefing that flags relevant past experience, extracts strategies, and gives **this-task** guidance. Because \(p_t\) depends on \(x_t\), the same stored trajectory yields different payloads for different queries.  
3. **Execute** \((\xi_t,r_t)=\pi_L(x_t,p_t)\). The frozen executor prepends \(p_t\); it does **not** consume raw trajectories directly. The same model doubles as LLM-as-judge.  
4. **Update**. The payload is **ephemeral** and is not stored. Only \(\xi_t\) is a candidate for insertion. At deployment, without ground-truth labels, the judge gates append-on-success so retrieved demonstrations stay mostly positive exemplars.[1]

Cognitively, the authors cite reconstructive episodic memory shaped by current goals and cues (Schacter & Addis)—read-time curation is reconstruction for the present task.[1]

Training detail matters. To make reward reflect payload quality rather than “whatever happens to be in the bank,” they run the bare executor once on the training set, keep successful trajectories with **ground-truth** labels, and hold that **fixed training bank** constant during GRPO. At test time the bank grows online from an empty start, so there is a mild train/test shift (training bank = bare-executor traces; test bank mixes curator-augmented ones). A staged bank refresh after 100 GRPO steps (rebuild, train 50 more) closes a little of the gap at extra cost.[1]

Evaluation defaults to an empty test bank (cold start); tasks share bank state within a batch and update after each batch (batch size 10 on ALFWorld/WebShop, 5 on τ²-bench). Task success uses the benchmark verifier; the update gate uses the LLM judge so ground truth does not leak into the bank. Results are means ± std over random task orderings.[1]

Appendix curator prompts are domain contracts: ALFWorld (find/act order), WebShop (search phrasing, options, price; no hard-coded product IDs), τ²-bench (ordered tool plan with explicit user approval before mutating calls; never copy ticket/user IDs). They are samples of what a read-time briefing should look like.[1]

## Why read-time is easier to train: immediate reward, no task grouping

For each training task the curator samples \(G\) candidate payloads (group size 8) over the same retrievals; the frozen executor runs each and returns the benchmark’s native metric \(r\) (binary success on ALFWorld / τ²-bench; continuous score on WebShop). GRPO updates with group-relative advantages \(\hat{A}_i=r^{(i)}-\mathrm{mean}_j r^{(j)}\) (std normalization omitted), **without a value network**. The key property: \(r_t\) is a **direct function of the payload for that same task**—zero temporal gap between curator action and reward; credit assignment collapses to one step.[1]

Write-time is the opposite: a storage decision at step \(s\) is graded only when a future task \(t>s\) retrieves the artifact. Read-time therefore drops both delayed-return machinery and task-grouping scaffolds. Hyperparameters (appendix): learning rate \(1\times10^{-6}\), 100 steps, batch 32, KL coef. \(10^{-3}\); roughly 21h on ALFWorld and 27h on WebShop (8×H200). Training curves show rising validation SR and falling executor turns under a single task reward—no auxiliary content-quality reward, no grouping, no return shaping.[1]

Freezing the executor means **one trained curator can serve stronger executors** without retraining memory—deliberately unlike policies that fuse memory and execution.[1]

## Main results: +16.2 / +16.3 / +3.9 over the strongest baselines

Benchmarks: ALFWorld (text embodied control, 140 test tasks), WebShop (shopping, 500), τ²-bench (airline / retail / telecom conversational tool-use; also written \(\tau^{2}\)-bench). Baselines: no memory, ReasoningBank, MemP, SkillOS (base / strong zero-shot curator / RL-trained curator). Executors: Qwen3-8B, Gemini-2.5-Pro, GPT-5.4. Trained curator: Qwen3-8B init, thinking off, GRPO 100 steps, Qwen3-8B executor during training.[1]

Abstract headline = absolute SR points over the strongest baseline in each block:

| Benchmark | Gain (absolute SR pts) | Typical contrast (paper tables) |
| --- | --- | --- |
| ALFWorld | **+16.2** | Qwen3-8B executor: JitMem **77.4** vs SkillOS **61.2** |
| WebShop | **+16.3** | Same: JitMem **32.8** vs SkillOS **16.5** |
| τ²-bench | **+3.9** | GPT-5.4 executor: JitMem-gpt micro avg **75.6** vs ReasoningBank (GPT-5.4 curator) **71.7** |

Read the table with three caveats. First, on ALFWorld/WebShop the strongest baseline in the Qwen block is RL-trained SkillOS; on τ²-bench it is training-free ReasoningBank (GPT-5.4 curator), because τ²-bench **reports only training-free variants**—no standard training split, and synthetic data remains open. Second, WebShop reports both Score and SR; the headline **+16.3 is SR**, not Score (Score moves 40.6→61.1, a separate +20.5). Third, per-domain τ²-bench gains concentrate on **Telecom (~+11.0)**, where multi-step policy verification needs procedural guidance; on Airline/Retail most memory methods do not beat no-memory beyond variance, and JitMem stays on par. Read-time curation helps most when the job is to **synthesize step guidance**, not merely retrieve a fact.[1]

Zero-shot contrasts matter equally. On WebShop, **untrained** JitMem-gemini (Gemini-2.5-Pro curator) reaches **61.0** SR vs SkillOS-gemini ~**41.0** with the same curator model. On ALFWorld with Qwen as curator+executor, JitMem-base hits 60.5 vs ReasoningBank 55.7 and SkillOS-base 53.1. **Task-adaptive read-time framing is itself a major gain**; RL compounds it.[1]

With stronger executors, the Qwen-trained curator still lifts: Gemini-2.5-Pro executor ALFWorld 86.2 vs SkillOS 80.2 (+6.0), WebShop SR 50.5 vs 41.3 (+9.2). A weaker curator plus read-time structure can beat stronger write-time distillers: with GPT-5.4 as executor on ALFWorld, JitMem-base (Qwen curator) **79.3** exceeds ReasoningBank with GPT-5.4 distillation (**77.9**) and SkillOS-gpt (**70.0**). Gains come from **when** you curate, not only from a bigger curator model.[1]

They calibrate no-memory baselines to sit at or below SkillOS’s reported numbers (appendix Table 6: reproduced ≤ reported) so gains are not inflated by a soft control.[1]

## Efficiency and transfer: shorter context, fewer steps, cross-executor

ALFWorld + GPT-5.4 executor (Table 4; input tokens in K, averages per task):

| Method | In. Tok. | Out. Tok. | Steps |
| --- | --- | --- | --- |
| No Memory | 9.0 | 1.40 | 17.8 |
| ReasoningBank | 19.7 | 1.26 | 16.2 |
| SkillOS-base | 22.4 | 1.36 | 16.9 |
| JitMem-base | 10.9 | 1.00 | 13.2 |
| JitMem | 9.8 | 0.87 | 11.6 |

Relative to write-time methods, JitMem cuts executor **input tokens by ~50.3%–56.3%** and **steps by ~28.4%–31.4%** (vs ReasoningBank / SkillOS-base). Relative to its own untrained base, RL further trims input ~10.1%, output ~13.0%, steps ~12.1%. All memory methods add some input over no-memory; they buy fewer interaction steps and shorter outputs. Read-time briefings are denser.[1]

Table 3 (ALFWorld): curator trained with Qwen3-8B executor transfers to GPT-5.4 at **86.7** SR; a curator trained with GPT-5.4 as training-time executor reaches **88.1**—**transfer gap ~1.4 points**. One curator, many executors, better deployment accounting.[1]

## Ablations: three building blocks + what RL actually learns

Inside the read-time frame, three choices contribute independently (untrained base, then RL):

1. **Drop task conditioning** (curator never sees \(x_t\); becomes a query-independent summarizer): up to **~3.1** (ALFWorld) / **~4.6** (WebShop) drop untrained; after RL the gap widens to **~11.4 / ~10.4**—RL learns to **exploit the task signal**, not merely compress harder.  
2. **Store all trajectories with success/fail labels** (common in ReasoningBank / SkillOS): base drops **~1.5–2.9 / ~2.3–3.4**. Labels do not fully suppress noise from failures; a **success-only gate** is cleaner.  
3. **Write-time ReasoningBank-style distillation instead of raw traces**: base drops **~1.7–2.9 / ~6.8–8.2**. Query-independent summaries committed at write time **cannot be recovered** at read time—WebShop hurts most when raw is discarded.[1]

Force empty retrieval on the RL curator (“w/o retrieved traj.”): SR can fall by **~14.8 / ~15.2**, down to or below untrained base. RL is **not** memorizing parametric cheat sheets; it learns **how to distill retrieved episodes**.[1]

Staged bank refresh gives Qwen on WebShop ~**+2.8** SR (Gemini flat) at extra training cost; warm-starting the test bank with 100 training trajectories moves SR by at most ~1.3 within variance. Default empty-start + fixed training bank is already enough—do not overbuild cold-start machinery.[1]

Qualitative (Figures 3–4): two tasks retrieve the same past experience—“put a hot potato in fridge” gets state-transition guidance (heat then place); “put a newspaper in sofa” gets placement checks. A write-time artifact bets on one framing; read-time yields both from one raw trace. RL vs untrained on identical inputs: trained payloads add environment-specific procedures (e.g. move to desklamp, then examine) that are **not** in the curation prompt—immediate task reward pushes **task-relevant procedural semantics**.[1]

## Why untrained framing is already strong

People hear GRPO and jump to training details. The paper wants a prior claim pinned first: **changing the timeline changes the problem.** An untrained curator, given \(x_t\), re-distills raw traces under a prompt; it never committed at write time to “the one true abstraction” of a trajectory. So:

- the same trajectory can teach state transitions today and placement tomorrow;  
- the executor receives short, task-relevant guidance instead of generic skill prose;  
- failed trajectories gated out of the bank keep retrieval cleaner.

That is why JitMem-base / JitMem-gemini can match or beat same-capacity write-time baselines. RL **amplifies** the advantage—environment-specific procedures, fewer tokens and steps—rather than inventing read-time from scratch. Empty-retrieval collapse after RL proves the learned skill is distillation, not a tiny ALFWorld solver in disguise.[1]

For engineering teams: **try a zero-shot read-time curator first** (even a strong off-the-shelf model as curator), measure SR and tokens against write-time summaries; only then decide whether to RL the curator. You do not need grouping curricula and composite rewards on day one.

## When write-time distillation still makes sense

JitMem does not outlaw write-time distillation. It remains reasonable when:

- experience is almost always reused the **same** way (fixed SOPs, compliance scripts) with little task-conditioned variation;  
- storage or compliance **forbids** long-lived raw trajectories (privacy, secrets in tool output)—then only redacted summaries exist, and there is no raw left to re-distill;  
- latency budgets cannot afford an extra curator call, so only short skill cards can be retrieved;  
- the skill library is already **programs**, not prose—Growing Harness / Agent Skills: once control lives in code, the marginal value of another natural-language briefing shrinks.

A safer compromise is **two layers**: raw (or replayable logs) as source of truth; write-time summaries as index/cache; read-time optional re-distillation of hit raw. The ablation warning is sharp: if you **only** keep write-time distillates and drop raw, task-adaptivity caps out.[1]

Read with progressive disclosure: skill frontmatter answers “what metadata to show first”; JitMem answers “how to shape content for *this* task after a hit.” Directory bandwidth vs shaping timeline—stack them; do not substitute one for the other.

## Qualitative payloads: household, shopping, support

Appendix examples make “task-adaptive” concrete.

**ALFWorld (clean):** task “put a clean plate on countertop.” The curator assembles from three partially related memories: find plate on counter → clean at sink if dirty → place on counter. It does not replay full traces; it extracts an actionable order.

**WebShop:** color / size / price constraints. From prior shirt/shorts searches the curator extracts **search phrasing and option-click strategy**, and warns not to assume old products remain. Strategy transfer, not SKU copy.

**τ²-bench (Telecom, cannot send MMS):** multiple MMS failures become an ordered runbook: identify customer/line → gather device/network tool reads → non-account fixes (airplane mode, roaming, network mode, permissions, APN) → account caps/usage → if refuel is needed, **quote and get explicit approval** before the mutating tool. Memory must not copy line IDs or roaming flags—look up the current case. In support domains, a read-time briefing is essentially a **request-specialized runbook**.[1]

Payload format is domain-heavy. The paper admits hand-designed formats—expect separate curator contracts for shopping, support, and coding agents, not one universal “memory summary” prompt.

## Jev-Mem: contrast the cut, not a Jev feature piece

In-site [Jev-Mem](/blog/jev-mem-system-one-agentic-memory/) splits organization / retrieval / stop-taking into a **System-One typed control plane**, so control is not defaulted to the autoregressive LLM. JitMem barely touches “should the control plane be an LLM?”—it asks **whether curation happens at write time or read time**. The two stack: System One can govern *when* and *how much* to fetch; a read-time curator can turn fetched episodes into a *this-task* briefing. This article does **not** expand Jev mechanics and does **not** consume the weekly Jev formal-blog quota.[1]

There is a soft link to [FTA](/blog/failure-transparent-agents-tool-failure-reporting/): JitMem’s bank gate is an LLM-as-judge of success. If the executor reports success after tool failure, false positives poison the bank—beautiful read-time framing then teaches the wrong lesson. Memory systems and failure-report fidelity should be designed together; Exactly-Once-style read-back in the tool contract also indirectly cleans what may be stored.

## Checklist for your harness

1. **Keep raw trajectories (or equivalent re-distillable material) by default**; do not steam the only copy dry at write time. Summaries may cache; they should not be the sole source of truth.  
2. **Synthesize a short briefing at read time conditioned on the current task**; the executor eats the briefing, not top-\(k\) long traces.  
3. **Gate bank inserts on quality**—prefer successful demos; all-traces-plus-labels is second-best.  
4. **If you train a curator**, align reward with same-task success (immediate); avoid delayed grouping scaffolds when possible. Group-relative advantages (GRPO-style) often suffice before a value net.  
5. **Decouple curator from executor** so you can swap executors, evaluate memory alone, and control training cost.  
6. **Start simple on retrieval** (paper: BM25 on task text); upgrade when the bank grows—authors flag BM25 as a scaling bottleneck.  
7. **Accept cold start**; early tasks are memory-poor by nature. Warm-start barely paid in their setting.  
8. **Budget one curator call** against fewer executor steps and retries—not against single-prompt length alone.  
9. **Write domain briefing contracts**: shopping forbids hard-coded product IDs; support forbids hard-coded ticket IDs and requires explicit confirmation before mutating tools.  
10. **Treat write-time vs read-time as a first-class ablation** under matched model capacity so you do not confuse “bigger model” with “better timeline.”

## For coding agents

Write-time skill distillation is already common: one successful issue fix becomes a Skill / runbook / `AGENTS.md` snippet. JitMem’s reminder: that success may contain several lessons—how to find logs, how to reproduce, how not to break a public API. If write-time keeps only one, the next task that needs another loses. A stabler pattern:

- session or CI logs (redacted) as raw source of truth;  
- Skill cards as write-time cache for high-frequency paths;  
- on a new issue, condition on the issue text and re-synthesize a short briefing for the executor from retrieved raw/cards—rather than stuffing top-\(k\) long diffs into context.

That aligns with growing the harness: deterministic control should not live as memory prose; leave the read-time curator the **experience recombinations that still depend on current task semantics**. Product memories that only store write-time user preferences solve personalization; cross-task procedural transfer sits closer to JitMem’s evidence.[1]

## Limits and one-line takeaway

Authors list limits: BM25 may bottleneck as the bank grows diverse; each task pays an extra curator call; payload formats are hand-designed per benchmark. Future work: jointly learn formats, stronger retrievers, and turn-/step-level re-curation as new observations arrive. Missing a standard τ²-bench training split also limits direct comparisons of *learned* read-time curators in conversational tool domains.[1]

Effective agent memory depends not only on **what** you store, but on **when and for which task** you curate it. JitMem’s evidence: even before the curator is trained, moving curation to read time already matches or beats strong write-time baselines; training then adds force on the right timeline—instead of steaming memory dry at write time and hoping retrieval will miraculously repair the abstraction.

## References

[1] Yefan Zhou, Yang Li, Zeyu Leo Liu, Semih Yavuz, Shafiq Joty. *Just-in-Time Memory: Learning to Curate Task-Adaptive Memory for LLM Agents*. arXiv:2609.27334, 2026. <https://arxiv.org/abs/2609.27334>
