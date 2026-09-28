---
title: "Bad Genius: When Counterfactual Protocols Expose Harness Evolution Cheats"
description: "A deep read of arXiv:2609.18366 CHASE—automatic harness optimization can exploit benchmark-wide shortcuts on a fixed released protocol; a Challenger searches executable protocol transforms with a validity firewall and held-out confirmation, retaining released gains while cutting gain destruction on Syn-Ledger and OfficeQA."
pubDate: 2026-09-28T10:40:00+08:00
author: "Remy"
tags: ["agent-harness", "ai-agents", "agent-loop", "developer-tools", "LLM", "rsi"]
lang: "en"
---

Automatic harness optimization sounds like a clean win: keep the foundation model fixed, and keep editing the prompts, memory, retrieval, tools, and control code around it until the score goes up. If held-out tasks also look fine, many teams will ship. The catch is that task semantics can change while the **released protocol** stays the same. Protocols hide correlations shared across tasks—filename habits, retrieval-channel order, unit notes that almost always sit on the line before a table—and an optimizer can write those correlations into an executable harness. The film *Bad Genius* is about a gifted student who helps others cheat by exploiting exam rules, not by failing to understand the material. The paper borrows that metaphor for a failure mode that matters in 2026 agent stacks: a harness that looks smarter because it is eating a **benchmark-wide shortcut**.[1]

Researchers from the University of Chinese Academy of Sciences, the National University of Singapore, and the Institute of Automation, CAS, introduce **CHASE** (Counterfactual Harness Search and Evolution) in [arXiv:2609.18366](https://arxiv.org/abs/2609.18366) (v3, 2026-09-24). After each Proposer update, a **Challenger** searches for an executable protocol transformation that destroys a large share of the released gain while preserving task semantics. A **validity firewall** rejects transforms that alter the task; a held-out confirmation set decides whether the counterfactual enters a finite archive. They also formalize an ideal shortcut-neutralized benchmark \(B_0\) and prove how finite archives relate to it. On Syn-Ledger and OfficeQA, CHASE **keeps strong released-benchmark gains while substantially reducing gain destruction under valid protocol transforms**.[1]

This is not soft news about “yet another harness optimizer.” On this site we have already covered [growing the harness instead of stuffing context](/blog/grow-the-harness-not-the-context/), [ECC’s outer optimization layer](/blog/ecc-agent-harness-optimization/), [SpecHarness and who holds the pen](/blog/specharness-spec-holds-the-pen/), [controlling the harness to control cost](/blog/control-the-harness-control-the-cost/), and [Claude Science harness](/blog/claude-science-harness-nine-loop-amplitudes/). Those pieces talk about sinking control into code, configuration surfaces, specification authority, routing bills, and long-horizon science loops. This piece adds a harder evaluation claim: **when you auto-evolve harnesses against a fixed released protocol without adversarial protocol transforms, you may ship a “bad genius”—better on the released score, brittle under protocol shift.** Every number below is traced to the paper HTML; we do not invent metrics.[1]

## Task holdout blocks “memorizing the item,” not “eating the protocol”

Start with the object. In the paper, a harness is the executable context around a fixed foundation model: what is stored and retrieved, how tools and workspace are exposed, how outputs are handled. The evaluated agent is model plus harness. Meta-Harness-style systems use a coding agent (the Proposer) to revise the harness from prior code, scores, and traces; later work studies held-out evaluation, optimizer quality, priority ranking, and reliable selection.[1]

Repeated feedback from one released benchmark \(B_{\mathrm{rel}}\) creates a generalization problem that is not the same as parameter overfitting. Classical shortcut learning usually comes from data or task artifacts. Harness evolution adds an executable route: **the Proposer can write the shortcut into the program**. Existing defenses ban task IDs, hard-coded filenames, and per-task repair recipes, then evaluate on held-out tasks. That limits **task-specific shortcuts** (detect one question ID and open a known document) but not **benchmark-wide shortcuts**—for example, always searching one document channel first because supporting evidence more often lives there under the released protocol.[1]

OfficeQA Full makes the motivation concrete. Agents answer questions over U.S. Treasury Bulletin-style documents. The paper reports that **58.1%** of questions in OfficeQA Full mention numerical scales such as millions, and that in its **697**-document corpus the next nonblank line after **95.2%** of unit statements begins a table (Supplementary C.1). A Proposer can perfectly reasonably induce the model to “look at the line before a table when hunting for units.” That is not memorizing one answer. The shortcut can survive held-out tasks because the protocol correlation never moved.[1]

The natural next step is therefore to keep held-out tasks **and vary the protocol**. Reassign the same documents across channels; keep question, answer, and document contents fixed; remove the advantage of “search channel A first.” Then compare the evolved harness’s gain over the initial harness \(H_0\) before and after the change. A large loss of gain is benchmark dependence that task holdout alone cannot expose. Ideally one would build a \(B_0\) that neutralizes every benchmark-wide shortcut while preserving underlying tasks. In realistic benchmarks, shortcut sources are too many to pre-enumerate with fixed rules. CHASE’s answer is: stop pretending you have enumerated them; **search counterfactual benchmarks online** and turn confirmed transforms into constraints on later evolution.[1]

## How the gain splits: released gain = neutralized gain + “bad genius” remainder

The formalism is worth reading because it turns “the score went up” into two accountable pieces. The released benchmark is \(B_{\mathrm{rel}}=(P,V_{\mathrm{rel}},Q_{\mathrm{rel}},\psi)\): \(P\) is the semantic-task distribution, \(V/Q\) are protocol and interaction details, and \(\psi\) is the target rule. Any harness \(H\) has score \(R_B(\mathsf{A},H)\) on benchmark \(B\). Released gain \(G_{\mathrm{rel}}\) relative to \(H_0\) and gain \(G_0\) on an ideal neutralized benchmark \(B_0\) satisfy

\[
G_{\mathrm{rel}}(H;H_0)=G_0(H;H_0)+\Delta_{\mathrm{BS}}(H;H_0).
\]

\(\Delta_{\mathrm{BS}}\) is the signed gain difference tied to the “bad genius” Proposer’s reliance on the benchmark-wide shortcut rather than improved task-solving capability—the quantity the paper wants to shrink, without denying every released-score improvement.[1]

Task holdout corresponds to another quantity \(\Delta_{\mathrm{TS}}\): the gap between search-set gain and held-out-set gain. A task-specific shortcut can make \(\Delta_{\mathrm{TS}}>0\). A benchmark-wide shortcut can sit in both sets, so \(\Delta_{\mathrm{TS}}\) looks small and “generalization looks fine.” **Watching only holdout can falsely certify safety.**[1]

For any valid protocol transform yielding \(B_b\), define gain destruction \(\Delta_b=G_{\mathrm{rel}}-G_b\). When \(B_b=B_0\), this recovers \(\Delta_{\mathrm{BS}}\). A negative \(\Delta_b\) means the harness gain *increases* under the counterfactual—not that the benchmark is easier overall, but that the selected harness may pull farther ahead of \(H_0\) after neutralization than under the released protocol.[1]

## CHASE: Proposer raises score, Challenger breaks protocol, firewall guards semantics

CHASE rewrites harness evolution as **constraint generation over valid counterfactual benchmarks** (paper §3, Figure 2):[1]

1. **Proposer.** Edit the harness around fixed model \(\mathsf{A}\). The objective is still to raise released gain \(G_{\mathrm{rel}}\), subject to \(\Delta_b\leq\varepsilon\) for every confirmed counterfactual already in archive \(\mathcal{A}_{t-1}\).
2. **Challenger.** Given the new \(H_t\), search the valid family \(\mathcal{B}_{\mathrm{val}}\) for an executable protocol transform \(\Phi_{b_t}\) that maximizes \(\Delta_b(H_t;H_0)\), and return a typed executable specification.
3. **Validity firewall.** Set \(\operatorname{Valid}(\Phi_b)=1\) only when all executable checks pass: preserve semantic task, ground-truth answer, evidence, and scoring semantics; change only permitted protocol components (full checks in Supplementary B.3). Changing the question, the answer, or the evidence set is rejected.[1]
4. **Finite archive + held-out confirmation.** Task roles are mutually disjoint: \(D_{\mathrm{evo}}\) feeds the Proposer, \(D_{\mathrm{disc}}\) feeds Challenger search, \(D_{\mathrm{conf},t}\) confirms the transform for round \(t\), and \(D_{\mathrm{cert}}\) stays sealed until final certification. Only if Valid=1 and the confirmation threshold \(\eta_{\mathrm{conf},t}\) is met does \(B_{b_t}\) enter \(\mathcal{A}_t\); otherwise the archive is unchanged. Final selection is not “highest released score among candidates,” but the candidate that maximizes \(G_{\mathrm{rel}}\) subject to the archive constraints (equation 4).[1]

This is different from “spawn another critic/debugger agent to help repair the harness.” The Challenger attacks the **source of the shortcut—the benchmark protocol**. It is also different from HarnessCompass’s fixed generalization gate: CHASE reuses HarnessCompass’s Proposer backbone **without** that fixed gate, and lets confirmed counterfactuals dynamically constrain later rounds and final selection.[1]

On the theory side (§4), if some composition of archived transforms recovers \(B_0\) (\(K(\mathcal{A})<\infty\)), certification-set empirical max destruction and min surviving gain connect to high-probability bounds on \(\Delta_{\mathrm{BS}}\) and \(G_0\) (Theorem 1); when the archive already contains \(B_0\), composition-excess terms vanish. Further results characterize when sequential Challenger search can stop. Under limited budgets, confirmation thresholds and \(\varepsilon\) are fixed (Supplementary B); the OfficeQA narrative uses \(\varepsilon=0.05\).[1]

## OfficeQA: competitive released score, best archive worst-case

Setup (§5.1–5.2). OfficeQA is question answering over U.S. government financial documents: discovery, text/table retrieval, numerical reasoning, exact extraction. The authors use two releases: **Full (246 questions)** for harness optimization and **Pro V2 (90 questions)** for cross-corpus evaluation over a separate receipts-and-expenditures corpus. On Full, the model may search the full **697**-document transformed-text corpus. With \(T=3\), the 246 questions split into \(D_{\mathrm{evo}}\) 49, \(D_{\mathrm{disc}}\) 49, \(D_{\mathrm{cert}}\) 76, and three confirmation sets of 24 each. Separately, the paper notes that at a fixed model EnvHarness once moved OfficeQA exact-match from **54.40%** to **56.20%**—a sensitivity citation, not a CHASE result.[1]

Five methods share \(\mathsf{A}\) and \(H_0\):

| Method | Role |
| --- | --- |
| RawHarness | Leave \(H_0\) unchanged; baseline for gains |
| Meta-Harness | Optimize for released-benchmark score |
| HarnessCompass | Released score + fixed generalization gate |
| HarnessEvolve | Reference trajectories + quality / performance / held-out validation gates |
| CHASE | Same Proposer backbone as HarnessCompass, no fixed gate; Challenger counterfactuals enter the archive and constrain later rounds |

Primary evaluation: each method’s final harness on the 76 certification questions under every benchmark in the final CHASE archive \(\mathcal{A}_3\) (three rollouts per question). Report released score \(\widehat{R}_{\mathrm{rel}}\), archive average \(\widehat{R}_{\mathrm{avg},\mathcal{A}_3}\), archive worst-case \(\widehat{R}_{\min,\mathcal{A}_3}\), plus Pro V2 released score.[1]

**Table 1 (OfficeQA, from the paper):**[1]

| Method | \(\widehat{R}_{\mathrm{ProV2}}\uparrow\) | \(\widehat{R}_{\mathrm{rel}}\uparrow\) | \(\widehat{R}_{\mathrm{avg},\mathcal{A}_3}\uparrow\) | \(\widehat{R}_{\min,\mathcal{A}_3}\uparrow\) |
| --- | ---: | ---: | ---: | ---: |
| RawHarness | 27.04% | 67.98% | 66.23% | 64.47% |
| Meta-Harness | 29.26% | 63.60% | 64.04% | 63.60% |
| HarnessCompass | 26.30% | 64.04% | 63.16% | 62.28% |
| HarnessEvolve | 24.07% | 69.30% | 68.20% | 67.11% |
| CHASE | **30.37%** | 68.86% | **68.42%** | **67.98%** |

Do not read only “who wins released score.” HarnessEvolve’s \(\widehat{R}_{\mathrm{rel}}\) edges CHASE (69.30% vs 68.86%), but archive average and worst-case both trail CHASE. On Pro V2, CHASE leads at 30.37%, while HarnessEvolve falls to 24.07%—below RawHarness’s 27.04%. HarnessCompass underperforms the initial harness in this setup; the paper notes OfficeQA is a new benchmark for HarnessCompass and points to Supplementary B.5 for the gate implementation. That is not a blanket dismissal of the original work, but it is enough to say a **fixed generalization gate is not the same as protocol robustness**.[1]

The first-round Challenger narrative is worth pasting into engineering notes. It proposes collecting a table’s associated context before the table and supplies an executable transform—hypothesizing that \(H_1\) (instructed to “keep an explicit unit for every operand”) may rely on customary locations of units and notes. The host executes the specification by re-encoding retrieved text as table context inside agent-visible JSON search results. On \(D_{\mathrm{evo}}\), \(H_1\)’s gain over \(H_0\) falls from **+8.16%** under \(B_{\mathrm{rel}}\) to **−5.10%** under \(B_{b_1}\)—a gain *reversal*, showing the released improvement was tied to how retrieved evidence is represented. Once \(B_{b_1}\) enters the archive, \(H_1\) and all second-round Proposer candidates violate \(\varepsilon=0.05\), so CHASE sets \(H_2=H_0\). In round three, one candidate recovers a **4.08%** released gain while satisfying the constraint and becomes \(H_3\).[1]

That is what catching a bad genius looks like in practice: the score did rise, but **the risen slice flips negative when the protocol moves**.

## Syn-Ledger: when \(B_0\) is constructible, measure what gain survives

To isolate benchmark-wide shortcuts in multi-document numerical reasoning, the authors also build **Syn-Ledger with 320** synthetic ledger tasks so that \(B_0\) can be constructed and \(G_0\) / \(\Delta_{\mathrm{BS}}\) measured directly (Supplementary D). A task has a question, twelve ledger documents, and an arithmetic program that determines the answer; two evidence documents and ten distractors; tools `list_files` / `search` / `open_file` / `calculator` with at most twelve tool calls per task; scoring by normalized integer exact match.[1]

Shortcuts leave semantics alone and vary five observable features—filename, directory depth, search rank, candidate-record position, serialization—between favorable and unfavorable levels. Under \(B_{\mathrm{rel}}\), **56/64 = 7/8** of evidence documents are favorable per feature; under \(B_0\), features are balanced so neither singles nor five-way interactions mark evidence. Canonical \(\Phi_j\) compose to \(B_0\); placebo transforms exist for construction audits and are **not shown to the Challenger**.[1]

Syn-Ledger adds **\(B_0\)-Access** to the five methods above: still HarnessCompass’s three-round schedule and fixed gate, but candidate selection by \(B_0\) performance—an approximate oracle when shortcut mechanisms are known. Final evaluation uses **208** certification tasks, three rollouts, reporting \(\widehat{R}_{\mathrm{rel}}\), \(\widehat{R}_0\), \(\widehat{G}_{\mathrm{rel}}\), \(\widehat{G}_0\), and \(\widehat{\Delta}_{\mathrm{BS}}\).[1]

**Table 2 (Syn-Ledger, from the paper):**[1]

| Method | \(\widehat{R}_{\mathrm{rel}}\uparrow\) | \(\widehat{R}_0\uparrow\) | \(\widehat{G}_{\mathrm{rel}}\uparrow\) | \(\widehat{G}_0\uparrow\) | \(\widehat{\Delta}_{\mathrm{BS}}\downarrow\) |
| --- | ---: | ---: | ---: | ---: | ---: |
| RawHarness | 81.89% | 15.22% | — | — | — |
| Meta-Harness | 82.05% | 19.87% | +0.16% | +4.65% | −4.49% |
| HarnessCompass | 80.45% | 14.74% | −1.44% | −0.48% | −0.96% |
| HarnessEvolve | **93.59%** | 18.27% | **+11.70%** | +3.04% | **+8.65%** |
| \(B_0\)-Access | 83.01% | 32.69% | +1.12% | +17.47% | −16.35% |
| CHASE | 87.18% | **38.30%** | +5.29% | **+23.08%** | **−17.79%** |

HarnessEvolve shines on the released protocol (93.59%, gain +11.70%) but keeps only +3.04% gain after neutralization, with \(\widehat{\Delta}_{\mathrm{BS}}=+8.65\%\)—a large slice of released gain bound to the shortcut. CHASE is not first on released score, yet leads on \(B_0\) score and gain (38.30%, +23.08%) with a negative \(\widehat{\Delta}_{\mathrm{BS}}\) (−17.79%). The paper stresses that a negative remainder does **not** mean \(B_0\) is easier overall—absolute scores remain much lower under \(B_0\) (RawHarness collapses from 81.89% to 15.22%)—only that CHASE’s selected harness improves *more over \(H_0\)* under \(B_0\) than under the released benchmark.[1]

Even \(B_0\)-Access, which can see the ideal neutralization, does not match CHASE’s \(B_0\) score (32.69% vs 38.30%). Knowing \(B_0\) and evolving under adversarial search constraints are not the same optimization problem.[1]

## How this lines up with in-site harness narratives

- **[Grow the harness, not the context](/blog/grow-the-harness-not-the-context/)** asks whether control sinks into reusable code. CHASE asks whether the **gain is glued to protocol correlations**. Elegant control code can still be a bad genius.
- **[ECC](/blog/ecc-agent-harness-optimization/)** optimizes Skills / Hooks / Memory / AgentShield. Point an automatic Proposer at that surface without adversarial protocol pressure, and the optimizer will learn protocol habits.
- **[SpecHarness](/blog/specharness-spec-holds-the-pen/)** separates proposal from authoritative commit. CHASE's validity firewall is the evaluation-side cousin: transforms may run, but semantic obligations cannot be privately rewritten.
- **[Control the Harness, Control the Cost](/blog/control-the-harness-control-the-cost/)** and **[Claude Science harness](/blog/claude-science-harness-nine-loop-amplitudes/)** remind us that harnesses also decide bills and long science loops; protocol channels need the same stress if evolution is automated.

If RSI-style loops treat "raise score on a fixed eval protocol" as the objective, and protocol correlations can be written into the harness, self-improvement may reinforce shortcuts rather than capability. CHASE is not a full RSI stack; it adds **adversarial protocol constraints**—different from "more held-out tasks." This post is **not** a Jev theme piece; the weekly Jev formal-blog slot remains 0/1. The paper's short discussion is blunt: task generalization asks whether the final harness works across tasks; CHASE asks whether the **evolution gain persists under valid counterfactuals**. Main results use ground-truth scoring; LLM-as-judge setups need separate validation.[1]

## A practical checklist: evolve the eval pressure, not only the harness

If you already run Meta-Harness-style search, write these into team agreements (mechanism transfer, not hyperparameter reproduction). First ask: does any reported "harness gain" get re-measured after a **valid protocol transform**? If not, add that measurement before a full CHASE loop.

1. **Name both shortcut classes.** Item-ID bans block task-specific cheats; benchmark-wide cheats need protocol moves (channels, order, serialization, metadata, demos, feedback format).
2. **Report gains in pairs.** Released gain over \(H_0\) plus surviving gain / destruction under valid transforms. Released score alone is untrusted.
3. **Disjoint discovery / confirmation / certification sets** for the Challenger path.
4. **Executable validity firewall that can refuse.** Gold task/answer/evidence/scorer fixed; only permitted protocol surface changes.
5. **Archive as constraint, not showcase.** Confirmed transforms must bind later Proposer rounds and final selection (eq. 2/4).
6. **Epsilon is a product decision.** OfficeQA uses 0.05; round two fell back to \(H_0\). Publish the number.
7. **Fixed generalization gates complement, do not replace, counterfactual constraints.**
8. **Prefer \(\Delta_{\mathrm{BS}}\) when \(B_0\) exists; else archive \(\Gamma_{\mathcal{A}}\).**
9. **Cross-corpus scores are bonuses, not substitutes** for protocol counterfactuals.
10. **Treat harness editors (and Challenger code) as high-privilege agents**—sandbox, permissions, audit, fail-closed rollback.

Anti-patterns: merge on released score alone; declare "no overfitting" after task holdout only; stress-test with invalid (task-changing) transforms; leak Challenger prompts to the Proposer as cheat sheets; copy these numbers onto LLM-as-judge benches without re-validation.

## Closing

[Bad Genius / CHASE](https://arxiv.org/abs/2609.18366) moves harness evolution from “how do we raise the released score” to “how much of that raised gain survives valid protocol transforms.” The mechanism is clear: the Proposer may still edit prompts, memory, retrieval, tools, and control; the Challenger searches counterfactual protocols online; the firewall guards semantics; held-out confirmation fills a finite archive; final selection is archive-constrained. On OfficeQA it leads or stays competitive on archive average/worst-case and on Pro V2; on Syn-Ledger it clearly beats the released-score champion HarnessEvolve on true \(B_0\) gain and gain destruction.[1]

For readers of this site, a useful reading order is: use [grow the harness](/blog/grow-the-harness-not-the-context/) to decide where control should sink; use [ECC](/blog/ecc-agent-harness-optimization/) / [control the cost](/blog/control-the-harness-control-the-cost/) for configuration and billing; use [SpecHarness](/blog/specharness-spec-holds-the-pen/) for who holds the pen; then use this piece—**when you start auto-evolving harnesses, evolve an adversary on the evaluation protocol at the same time.** Otherwise what you ship may be a bad genius with a beautiful scoreboard.

## References

[1] Guojun Zhu, Xunheng Huang, Peng Yin, Jiahui Xie, Sanguo Zhang, Doudou Zhou. *Bad Genius: Counterfactual-Guided Harness Evolution Beyond Task-Specific Shortcuts*. arXiv:2609.18366v3, 2026-09-24. [https://arxiv.org/abs/2609.18366](https://arxiv.org/abs/2609.18366) · [HTML](https://arxiv.org/html/2609.18366)
