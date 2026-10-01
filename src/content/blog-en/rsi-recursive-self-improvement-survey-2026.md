---
title: "RSI Through 2026: How Much Is Truly Recursive?"
description: "A mechanism survey from Gödel Machines, AlphaEvolve, Darwin Gödel Machine, SEAL, and ADAS to RRSI harness evolution—separating bounded self-refinement from open-ended RSI, and demonstrated loops from hype."
pubDate: 2026-10-01T20:30:00+08:00
author: "Remy"
tags: ["rsi", "complex-systems", "feedback-loops", "ai-agents", "agent-harness", "agent-loop"]
lang: "en"
---

“Recursive self-improvement” (RSI) got loose in the last year. Output revision is called self-refine; an agent rewriting its prompt is called self-evolve; a lab evolving kernels that speed up training also gets filed under RSI. In hallway talk it is easy to conclude that “RSI is here.” Ask a sharper question—**what did the system improve, who supplied the acceptance signal, and does that make the next self-edit easier?**—and the answers diverge hard.[1]

This post is the site’s **RSI knowledge hub**: a survey through roughly 2026-10, not a single-paper deep dive. The arc runs classical definitions → LLM-era fragments → systems that actually shipped results → safety and governance → what is demonstrated versus extrapolated. Related posts on this site already cut specific edges—[Bad Genius on counterfactual harness protocols](/blog/bad-genius-counterfactual-harness-evolution/), [grow the harness, not the context](/blog/grow-the-harness-not-the-context/), [ECC outer optimization](/blog/ecc-agent-harness-optimization/), [control the harness to control cost](/blog/control-the-harness-control-the-cost/). Those pieces stay; this one puts them on one ruler. Every number below is traced to a public paper or official blog.[1][2]

## Nail the terms: bounded self-refinement ≠ open-ended RSI

In the classical story, I. J. Good’s intelligence-explosion argument and Schmidhuber’s Gödel Machine cast RSI as a system that **proves (or equivalently guarantees) a self-modification is net beneficial, then repeats**. Without strong assumptions, proving net benefit for most edits is impractical. Contemporary systems therefore swap “provable” for “measurable on a benchmark.” That relaxation is definitional—and it is also where overfitting and shortcut learning enter.[3][4]

A 2026 survey (Chen, Wang, Qu, arXiv:2607.07663) over about 1,250 arXiv papers offers a usable two-axis cut:[1]

1. **What is improved**: deployment-time behavior (outputs, test-time weights, harness/skills), training-time policy, **the evaluator itself**, or the AI research process.
2. **How closed the loop is**: human-in-the-loop, human-on-the-loop (automatic signal, human gates deployment), or closed loop (generate–validate–apply with no human review).

**Bounded self-refinement** improves a system against a fixed external evaluator—convergent and evaluable. **Open-ended RSI** also revises the criteria or machinery of improvement, divergent in principle. Almost all public quality sits on the bounded side; the closed-loop × self-evaluation cell is the thinnest on the grid and where safety stakes concentrate.[1]

Anthropic’s 2026 Institute essay *When AI builds itself* uses “closing the loop” for agents that eventually design and train successor models. The essay is explicit: **that has not happened and is not inevitable**. Execution (writing code, running well-specified research) is strong; research direction-setting remains the bottleneck.[5] Do not read “the model wrote a large share of merged code” as “RSI closed.”

One more overloaded word: **harness**. In modern agent writing it means everything around a frozen backbone—system prompts, tool schemas, memory and skill stores, orchestration, stopping rules. A harness is inspectable and editable, including by the agent. So the engineering face of “the agent rewrites itself” is usually **harness edit**, not foundation-weight rewrite.[1][7]

## Timeline: from theory to measurable self-modification

| Stage | Exemplars | What actually changes | Acceptance |
| --- | --- | --- | --- |
| Theory | Good / Gödel Machine | The system itself (ideal) | Provable net benefit |
| Training bootstrap | STaR, Self-Rewarding LMs | Weights / reward signal | Verifiable answers or self-judges |
| Output refinement | Self-Refine, Reflexion | A single episode’s text | External feedback or self-critique |
| Agent design search | ADAS / Meta Agent Search | Code-defined agents | Fixed benchmarks |
| Self code edit | STOP, Gödel Agent, DGM | Scaffold / agent code | Coding benchmarks |
| Discovery into infra | FunSearch, AlphaEvolve | Algorithms and infra code | Automatic evaluators |
| Weight self-adaptation | SEAL | Self-generated finetune data + weights | Downstream tasks |
| Harness RSI | RRSI, Meta-Harness, … | Harness around a frozen model | Evolve set + holdouts |

Self-improvement is a **family of loops**, not one trick. Label the cell or the slogan takes over. The same survey notes that about 74% of its corpus was posted in 2026—mechanisms are racing ahead of consolidation, which is why a hub post is useful.[1]

## Demonstrated paths (by what changes)

### 1. Deployment time: outputs, test-time training, harness

Output-level refinement is industrial practice when an external channel exists (tests, proof checkers). Without it, negative results such as Huang et al. show unaided self-correction often fails or hurts. The field’s quiet retreat: almost every new system grounds critique in execution, retrieval, detectors, or solvers—human-on-the-loop verified refinement rather than closed intrinsic critique.[1]

Test-time training (TTT) sits between frozen-weight revision and offline training: query-conditioned weight updates with some persistence. Objectives remain human-specified—still bounded.[1][8]

**ADAS** (Hu, Lu, Clune, arXiv:2408.08435, ICLR 2025) names Automated Design of Agentic Systems and demonstrates **Meta Agent Search**: a meta agent programs new agents into a growing archive and reports agents that beat strong hand-designed baselines on coding, science, and math, with surprising transfer across domains and models.[6] Importantly, ADAS keeps the meta agent fixed during search—it designs downstream agents but does **not** rewrite its own search policy as those agents improve. That contrast matters for DGM.[4][6]

**Darwin Gödel Machine** (DGM; Zhang et al., arXiv:2505.22954, ICLR 2026) is the most cited concrete self-modifying coding agent: it edits its own codebase, validates changes on coding benchmarks, and keeps an open-ended archive of stepping stones rather than hill-climbing only the current best. Reported gains: SWE-bench 20.0% → 50.0%, Polyglot 14.2% → 30.7%; baselines without self-improvement or without open-ended exploration do worse; a greedy “always expand the best node” ablation also underperforms. Discovered features include finer-grained editors, long-context management, multi-attempt workflows and peer-review style selection. Runs used sandboxing and human oversight; code is open.[4]

Three limits belong in the margin: the foundation model is **frozen**; training a new foundation model is left as future work; archive maintenance and parent selection are not themselves rewritten by DGM. The authors also note roughly two-week SWE-bench-scale runs with substantial API cost—so “self-acceleration” is still compute- and reasoning-bound.[4]

**RRSI** (Xia et al., Google, arXiv:2609.24972) states the harness-RSI overfitting problem cleanly: repeatedly proposing and selecting on a finite evolve set can raise evolve scores while OOD gains shrink or fall near the initial harness. RRSI regularizes proposal (annealed edit budgets, evidence-aware credit, structured exploration under stall) and selection (leakage screening, noise bands, cost-aware acceptance, structural pruning). Across eight benchmarks in coding, agentic workspace, and engineering design: up to about +14.1 on an evolve split and up to about +4.7 on OOD suites, with roughly 30% fewer policy tokens than unregularized evolution. Code and project site are public.[7]

This is the same cluster as our Bad Genius post: **auto-evolution against a fixed released protocol can eat benchmark-wide shortcuts**. RRSI regularizes search dynamics; CHASE adversaries the protocol. One governs how you search; the other governs how you prove you did not memorize the exam rules.[7]

STOP and Gödel Agent are the direct prehistory: STOP recursively improves an LM-calling optimizer scaffold without changing the base model; Gödel Agent emphasizes a self-referential search over agent designs. 2026 did not invent self-modification; it scaled and measured it.[1][4]

### 2. Training time: self-generated data and self-reward

STaR, Self-Rewarding LMs, on-policy self-distillation, and self-play write the loop into weights. The 2026 survey’s repeated facts: the loop’s ceiling is the verification signal; collapse is a default dynamic to engineer against; loops transmit bias as efficiently as capability.[1] Verifiable domains (code, math, formal proof) bootstrap hardest; non-verifiable domains fall to LLM-as-judge and meta-evaluation.

This is the industrial highway of bounded RSI—and the thing product narratives most often call “the model got smarter.” It is usually **not** “the system changed how it does research.” Reading post-training bootstrap as an intelligence explosion is a category error.

### 3. Weight self-adaptation: SEAL

**SEAL** (Self-Adapting LLMs; Zweiger et al., MIT CSAIL, arXiv:2506.10943) has the model emit self-edits—synthetic finetuning data and optional update directives—then apply persistent SFT/LoRA updates. An outer RL loop rewards self-edits by downstream performance of the updated model. On knowledge incorporation, no-context SQuAD accuracy moves from about 33.5% to about 47.0%, reported above a GPT-4.1 synthetic-data baseline in the single-passage setting; on a filtered ARC few-shot subset, RL-trained self-edits beat untrained self-edits by a wide margin. Limitations are candid: sequential self-edits still show catastrophic forgetting; the TTT reward loop is expensive because each reward needs a full finetune-and-eval.[8]

SEAL’s niche: the model learns **how to prepare learnable data for itself**, not how to set research agendas. Tasks and rewards remain human-side—bounded, but persistent, unlike episode-local refinement.

### 4. Auto-research and algorithm discovery: AI Scientist, AlphaEvolve

**The AI Scientist** (Lu et al., arXiv:2408.06292) runs idea → experiment → manuscript → automated review, at roughly under \$15 per paper, with an automated reviewer near human consistency metrics on ICLR 2022 data. Public limits are equally hard: hallucinated experimental details, overly positive framing of negative results, unsafe execution behaviors in early runs, and the standing critique that producing a PDF is not producing reliable science.[9] Later diagnostic work treats auditability as the new bottleneck: as generation cheapens, tracing claims to evidence gets expensive.[1]

**AlphaEvolve** (DeepMind, official blog 2025-05-14) pairs Gemini (Flash for breadth, Pro for depth) with automated evaluators and an evolutionary database. Reported deployed impact includes a Borg scheduling heuristic recovering on average about 0.7% of Google’s worldwide compute for over a year; a verified Verilog simplification for a TPU arithmetic circuit; about 23% speedup on a Gemini matrix-multiplication kernel and about 1% reduction in Gemini training time; up to about 32.5% speedup on FlashAttention-style GPU instructions. On math, it found a 4×4 complex matrix multiplication using 48 scalar multiplications—improving on Strassen (1969) in that setting—and on 50+ open problems rediscovered SOTA in roughly 75% of cases and improved prior bests in about 20% (including a new kissing-number lower bound in 11 dimensions).[2]

This is the hardest public example of **AI outputs compounding into AI infrastructure**—the concrete referent for much RSI talk. The boundary is equally clear: humans specify problem, evaluator, and seed program; the system evolves inside automatically scored algorithm families. That is bounded self-refinement in the auto-research / program-discovery cell, **not** closed-loop successor-model training.[1][2]

FunSearch is the narrower precursor; AlphaEvolve’s step is evolving richer codebases and landing in production stacks.[1][2]

## Open-source entry points

| Project | Entry | What you can actually reproduce |
| --- | --- | --- |
| DGM | [jennyzzt/dgm](https://github.com/jennyzzt/dgm) | Self-modifying coding agents + archive (expensive) |
| ADAS | [ShengranHu/ADAS](https://github.com/ShengranHu/ADAS) | Meta Agent Search per domain |
| RRSI | [google-research/rrsi](https://github.com/google-research/rrsi) | Regularized harness evolution |
| SEAL | [Continual-Intelligence/SEAL](https://github.com/Continual-Intelligence/SEAL) | Self-edit + RL adaptation |
| AI Scientist | [SakanaAI/AI-Scientist](https://github.com/SakanaAI/AI-Scientist) | Auto-research pipeline (sandbox hard) |

Pipeline shortlist items such as Env-Rethink, RSI-Master, and SoL-Pi are natural *next* paper posts—not substitutes for this map.

## A complex-systems lens: actuators, sensors, memory

Treat RSI as “the model got smarter” and you lose structure. Any self-improving device needs at least:

1. **Actuator** — what changes state: outputs, harness files, weights, experiment scripts.
2. **Sensor / evaluator** — what defines “better”: unit tests, simulators, judge models, human taste.
3. **Memory** — what persists: skill docs, evolutionary archives, experience graphs, LoRA adapters.

Bounded refinement means an external, relatively fixed sensor, controlled memory growth, and sandboxed actuators. Open-ended RSI means the sensor can change, memory accumulates without verification, and actuators reach training and deployment stacks. Most 2026 public systems strengthen actuators and memory while **fighting to stabilize the sensor**—RRSI’s leakage screen, Bad Genius counterfactual protocols, proof checkers, and unit tests all protect the sensor from being eaten by the loop.[1][7]

That is why skill-library evolution deserves more safety attention than single-turn self-refine: episode errors die with the session; errors written into a shared skill library become the next generation’s prior. At the top of the verification hierarchy, memory is capital; at the bottom, it is an amplifier.[1]

Training-bootstrap failure modes—rise-and-collapse, diversity collapse, model collapse—and harness evolve–OOD gaps are kin: finite, noisy, adaptive feedback reused across rounds fits the feedback process itself. Regularization, holdouts, exogenous data mix, and human anchors are damping, not opposition to improvement.[1][7]

## Safety, governance, and explosion narratives

DGM’s safety section flags misalignment from benchmark-only objectives, reduced interpretability under iterated self-edit, and minimum mitigations: sandboxing, time limits, traceable archives—plus the constructive option of optimizing for safety and transparency when those enter the score.[4] Once skills and experience graphs persist, corrupted skills can amplify across generations and populations; deployment-time harness/skill evolution is among the sharpest safety surfaces in the technical corpus.[1]

**CASP** (2026), *What if automating AI R&D triggers an intelligence explosion?*, with co-authors including Hinton, Bengio, Horvitz, Clune, and Jack Clark, argues that automating AI R&D could compress years of progress into months, with extreme risks around pace, loss of control, and eroded checks on power. Policy asks: more visibility into AI-R&D automation, tools to steer and constrain an explosion, and societal preparedness. That is a governance document, not another leaderboard.[10]

Three technical translations beat slogans:

1. **Verification hierarchy** — formal verifiers and execution at the top; learned judges and intrinsic confidence at the bottom. Demonstrated self-improvement strength tracks the hierarchy. AlphaEvolve/FunSearch live high; AI-scientist-style systems often fail where the signal is scientific judgment.[1][2]
2. **Self-confirming loops** — shared bias between generator and evaluator preferentially reinforces high-confidence errors.[1]
3. **Frame lock-in** — a loop can be honest, diverse, and stable while optimizing a stale objective. Direction *generation* (what questions deserve to exist) is prior to the hierarchy, not a rung of it.[1][5]

The danger is less “a few more agent LOC” than **ungrounded closed evaluation loops** and **proxy metrics that permanently displace direction-setting**.

## Demonstrated vs extrapolated

**Supported by public evidence:**

- With external verifiers, output refinement and training bootstrap reliably raise scores.[1]
- Agent/harness code can be meta-searched or self-modified with large coding-benchmark gains (DGM, ADAS, RRSI).[4][6][7]
- Evolutionary program discovery can write algorithm gains back into production infra (AlphaEvolve).[2]
- Models can learn to generate finetuning data that helps themselves (SEAL).[8]
- Unregularized harness evolution often evolve-gains / OOD-fails; regularization and counterfactual protocols are real engineering problems.[7]

**Thin or still extrapolated:**

- Autonomous research agenda-setting with reliable taste.[1][5]
- Open-ended unbounded capability explosion without sustained exogenous signal.[1]
- Closed-loop training and deployment of successor foundation models already in the wild.[5]
- Reading a benchmark bump—or “the model wrote most of the repo”—as an intelligence explosion.[1][5][10]

Product-ready compression: **2026 RSI’s main field is bounded loops + stronger verifiers + harness/algorithm feedback into AI stacks. Open-ended evaluator rewrite and closed-loop successor training remain rare cells.**

## Hype cheat sheet

| Common claim | More accurate reading | Anchor |
| --- | --- | --- |
| “Agents already do RSI” | Usually harness/workflow edit; backbone frozen | DGM, RRSI, ADAS |
| “AI improving AI” | Often algorithm discovery into infra or data synthesis | AlphaEvolve, FunSearch, SEAL |
| “Automated scientist” | Pipeline can run; judgment and audit still weak | AI Scientist + critiques |
| “Closed loop / explosion imminent” | Execution ≠ direction-setting; policy wants visibility | Anthropic, CASP |
| “Score up ⇒ recursive” | Check OOD, protocol shift, task leakage | RRSI, Bad Genius |

If a news item cannot answer what changed, who scored it, and whether OOD held, treat it as Chaos/notes—not a formal blog. That is the site’s “no hype-chasing soft news” rule applied to RSI.

## Five questions for the next RSI headline

1. **Outputs, harness, weights, or research process?**
2. **Where is the evaluator on the verification hierarchy?**
3. **In-loop, on-loop, or claimed closed—and was the evaluator rewritten?**
4. **Do gains survive OOD / protocol transforms / counterfactuals?**
5. **Is execution automation being sold as direction-setting automation?**

## Closing

RSI is a spectrum, not a switch. Classical theory wanted provable self-rewrite. Engineering delivers measurable loops that turn more times, with some turns handed from “humans edit the harness” to “agents edit the harness / search algorithms.” AlphaEvolve shows infra feedback is real; DGM and RRSI show self-modification and regularization are real; SEAL shows weight-side self-adaptation is open; ADAS shows agent design itself is searchable. Evaluators remain the ceiling; direction-setting remains mostly human; open-ended explosion still lacks public measurement.

For agent products: invest in **executable acceptance, holdout and protocol robustness, and cost regularization**—not an “we do RSI” README line. For governance: watch AI-R&D automation visibility and verification infrastructure, not only rankings. For complex-systems notes: treat RSI as a family of feedback loops—memory, sensors, actuators—rather than a sci-fi toggle.

## References

[1] Chen, Wang, Qu. *Recursive Self-Improvement in AI*. [arXiv:2607.07663](https://arxiv.org/abs/2607.07663).

[2] DeepMind. *AlphaEvolve* blog (2025-05-14) and white paper. [deepmind.google/blog/…](https://deepmind.google/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/).

[3] Schmidhuber, Gödel Machines (2007); Good’s ultraintelligent-machine tradition; see also [1][4].

[4] Zhang et al. *Darwin Gödel Machine*. [arXiv:2505.22954](https://arxiv.org/abs/2505.22954); [jennyzzt/dgm](https://github.com/jennyzzt/dgm).

[5] Anthropic Institute. *When AI builds itself*. [anthropic.com/institute/recursive-self-improvement](https://www.anthropic.com/institute/recursive-self-improvement).

[6] Hu, Lu, Clune. *Automated Design of Agentic Systems*. [arXiv:2408.08435](https://arxiv.org/abs/2408.08435).

[7] Xia et al. *RRSI*. [arXiv:2609.24972](https://arxiv.org/abs/2609.24972); [regularized-rsi.com](https://regularized-rsi.com/).

[8] Zweiger et al. *SEAL*. [arXiv:2506.10943](https://arxiv.org/abs/2506.10943).

[9] Lu et al. *The AI Scientist*. [arXiv:2408.06292](https://arxiv.org/abs/2408.06292).

[10] Chan et al. (CASP). *Intelligence explosion* report. [casp.ac/reports/intelligence-explosion](https://casp.ac/reports/intelligence-explosion) (2026).
