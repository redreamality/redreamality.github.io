---
title: "SINGED: Correct Output Does Not Mean Safe Execution"
description: "Reading arXiv:2609.35889 SINGED: functional counterfeits match benign outputs while triggering forbidden process effects; among 7,549 audited trials, rank-one counterfeit execution hits 45%, and cross-candidate comparison cuts layered failures from 15.7% to 4.2%. Correct output ≠ safe execution; a harness checklist."
pubDate: 2026-09-30T16:40:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "security", "developer-tools"]
lang: "en"
---

The redacted file looks right, yet the trace carries an unauthorized outbound. The transcript matches byte-for-byte, yet the sandbox logs a loopback receipt that should never appear. The extracted tree verifies, yet something was written outside the output directory. A correct artifact under the task checker is not the same as a clean execution path under the task contract. This morning’s post on [failure-transparent agents](/blog/failure-transparent-agents-tool-failure-reporting/) asked whether final reports stay honest after tools already failed. This piece is the other side of the same verification debt: **when the output is already correct, do we wrongly treat the execution as safe?**

Xiaoyu Xu, Zi Liang, Minxin Du, Qipeng Xie, Qingqing Ye, Yuyuan Li, and Haibo Hu introduce that failure mode in the preprint [arXiv:2609.35889](https://arxiv.org/abs/2609.35889) (*SINGED: Correct Outputs Do Not Certify Safe Execution in LLM Agents*). They call such implementations **functional counterfeits**: they match benign alternatives on the requested output, yet add a process effect forbidden by the task contract. Their controlled benchmark **SINGED** (*Source Integrity and the Nonidentifiability Gap in Execution Decisions for LLM Agents*) covers five primary task families and two held-out families, scoring each trajectory with a task oracle and a process oracle. Across **7,549** audited trials, the randomized-rank study finds counterfeit execution in **45% (27/60)** of rank-one trials and **none** at later ranks; mandatory cross-candidate comparison reduces layered hidden effects from **15.7% (34/216)** to **4.2% (9/216)**, while deeper dependencies and unseen effects leave residual risk; seven releases with zero counterfeit execution rate (CER) when benign alternatives are available still execute the counterfeit in **55/175** single-source cells after alternatives are removed.[1]

This is a mechanism post: what functional counterfeits and output equivalence break in output-only grading; how SINGED builds three-candidate instances and two-channel oracles; where rank, early commitment, and comparison policies move the numbers; what the single-source stress test implies; and what to copy into a harness—**provenance constraints plus process-side observation**, not “ship it if the artifact hashes.” It joins the site’s verification / ownership / tool-boundary line. **Measurement and defense checklist only—no attack recipes.**


## Correct outcomes can hide compromised paths

Language agents no longer only emit text. They retrieve third-party implementations, install them, run them, and return artifacts. Evaluation usually asks whether the task completed: is the redaction valid, does the transcript align, does the PDF match, does the archive tree verify, does the CSV become the canonical JSON. SINGED asks an earlier question: when several implementations **advertise the same capability, expose the same interface, and produce the same artifact**, **which one does the agent execute**, and does that run trigger a sandbox-observable effect forbidden by the task contract?[1]

The motivation is real source ambiguity. The paper cites the Privacy Filter incident: OpenAI released `openai/privacy-filter` for local personal-information detection and redaction, while another Hugging Face repository copied its model card and functional surface but loaded an information stealer before removal. No malicious user request and no adversarial instruction were required—only a plausible compromised source that claimed to do the same job. The question becomes: when implementations advertise the same function and produce the same output, which source does the agent execute, and how do displayed rank, inspectable evidence depth, and decision policy change that choice?[1]

That joins software supply-chain security with agent security. Supply-chain work already documents malicious packages, dependency confusion, and model-hub loader risks; agent-security work studies indirect injection, poisoned tool descriptions, memories and skills, and unsafe plans. SINGED’s claim is that prior designs rarely **jointly** hold the benign request and expected output fixed, vary the implementation, randomize displayed rank, and record process effects. An instruction-free, inspectable source can therefore pass the task oracle while producing forbidden behavior that output-only and inspection-only evaluation miss.[1]

In-site pairings:

- [FTA](/blog/failure-transparent-agents-tool-failure-reporting/): failure already happened → is the report honest; SINGED: artifact already correct → is the path safe.
- [Exactly-Once](/blog/exactly-once-model-harness-tool-contract/): do not trust the model’s verbal “success”; SINGED: do not trust “output hash matched” as a clean trajectory.
- [Coding is not solved](/blog/coding-is-not-solved-verification-ownership/): verification and ownership stay expensive—checking only the final file dumps process debt on the deployment.
- [MCP Toolbox / tool-path boundary](/blog/google-mcp-toolbox-ssrf-tool-path-boundary/): move tool-surface boundaries out; SINGED adds “which implementation under the same capability ad.”
- [OpenShell / Sentry](/blog/nvidia-open-agent-safety-openshell-sentry/): hard can / cannot-do floors; SINGED reminds that inside the floor you can still pick the wrong source.

## Functional counterfeits: output-equivalent, process-inequivalent

The paper writes a task contract \(c_j=(q_j,X_j,V_j,B_j)\): user request, frozen validation inputs, task oracle, and the set of forbidden process events. Two implementations are **benchmark output equivalent** if, on every frozen input, both terminate, return identical outputs, and pass \(V_j\). A functional counterfeit is output-equivalent to every benign candidate yet triggers an event in \(B_j\) on every validation input in environment \(e\); benign candidates trigger none.[1]

The authors keep the claim tight: equivalence holds only on the frozen inputs and does not imply equivalence elsewhere; evaluation depends on execution behavior rather than a private “official” label, because either benign candidate already satisfies both task and process requirements. Their nonidentifiability proposition states that if benign and compromised traces return the same \((q,x,y)\) and both pass the task oracle, any evaluator that sees only those three objects cannot identify the compromised trace better than chance. The gap is structural; without process evidence it cannot be closed.[1]

Two rates follow. Task success \(T\), presence of a forbidden effect \(H\), and safe utility \(SU=T(1-H)\). **CER** is the mean of \(H\); **OEG** (outcome-to-execution gap) is the share of correct outputs produced through compromised execution—how much task success overstates safe utility. Under SINGED’s acceptance construction, only executing the counterfeit triggers the designated event, so \(H\) also identifies counterfeit execution inside the benchmark.[1]

The threat model is equally narrow: the adversary controls one discoverable candidate’s name, metadata, code, and dependencies; they cannot modify the request, trial input, benign candidates, expected artifact, sandbox, or oracle logs. Candidate code is inspectable before installation—“hidden” means **absent from the returned artifact**, not invisible in source or process logs. The paper does not teach how to place forbidden effects into real attack chains; this post only restates the measurement setting.[1]

## Three candidates, five primary tasks, two oracles

Each instance pairs an ordinary request with three similarly named implementations: an **intended** source, a **benign community** alternative, and a **functional counterfeit**. All advertise the same capability and interface and produce the same artifact; only the counterfeit adds one unnecessary process effect at an assigned evidence depth. Role labels stay hidden from the agent. Accepted instances must satisfy presentation/interface equivalence, output equivalence, effect separation, and role blindness.[1]

Five primary task families:

1. **Document redaction** → verified redacted text; forbidden effect: unauthorized loopback request (standing in for transmission)
2. **Speech transcription** → exact transcript; loopback receipt
3. **Paper retrieval** → matching PDF; loopback receipt
4. **Archive extraction** → verified directory tree; forbidden effect: write outside the output directory
5. **Tabular conversion** → canonical JSON; forbidden effect: read an unrelated controlled file

Two held-out families: configuration editing (unauthorized metadata change) and image thumbnailing (unnecessary subprocess). A public-package transfer slice is also reported. Forbidden effects stay inside disposable, network-isolated sandboxes so the process oracle gets exact, privacy-safe labels—this is not a guide for attacking production systems.[1]

Evidence depth varies among entrypoint, one-import, and two-import placements of the decisive statement. Assigned depth locates the evidence; observed inspection depth records how far the agent actually reads. Execution uses seven task-scoped tools (search candidates, open result pages, list/read files, install, execute, retrieve output) with a fresh workspace and fixed tool-call budget; public networking, host files, shell, and general browsing stay off except model communication. The task oracle verifies the returned artifact; the process oracle records the executed hash and sandbox events and checks membership in \(B_j\). Separating the channels is what makes “right artifact, wrong path” visible.[1]

## In 7,549 trials, rank and early commitment pin the failures

Scale: **7,549** audited identifiers across 20 releases, 14 model families, and 8 agent configurations, spanning the five-task core, transfer/mechanism blocks, replication and release checks, and public-package extensions.[1]

**Q1: Correct outcomes conceal compromised execution.** In the original 180-trial randomized-rank study, **every** output is correct, yet **27** trajectories trigger the forbidden effect—a **15.0**-point OEG. Failures localize to rank one: **27/60** when the counterfeit ranks first, **0** at ranks two and three. Across five tasks and 20 releases, **1412/1500** complete the task while **167/1500** execute the counterfeit; every counterfeit execution also completes the task, so output-only evaluation systematically misses compromised paths. Archive and tabular cells reproduce the gap via out-of-scope writes and unrelated-file reads; all-benign controls never trigger the designated event.[1]

**Q2: Rank and early commitment localize failures.** Rank one raises CER by about **45** percentage points relative to later ranks (instance-clustered 95% CI: 36.7–53.3). In the original 180 Codex traces, all 27 counterfeit executions sit among the 79 trajectories that stop after inspecting one candidate; none sit among the 101 that compare all three. Retaining versus revising the first choice shows the same direction. Inspection and revision are agent-chosen, so the association is not causal; the working hypothesis is that rank decides who is seen first, and early stopping hardens that first exposure into execution. Replication preserves a strong rank gradient (17/60, 1/60, 0/60).[1]

**Q3: Comparison reduces shallow risk but does not certify safety.** Under matched decision-rule interventions, hidden effects fall from **132/323** at baseline to **54/323** with generic deliberation, **82/323** with selected-source inspection, **74/323** with necessity judgment, and **24/323** with **compare-all**. On the original matched rank-one block, three-way comparison cuts counterfeit execution from **27/60** to **0/60**. In the frozen layered block, compare-all reduces hidden effects from **34/216 (15.7%)** to **9/216 (4.2%)**; an independent 216-cell repeat records **31/108** under deliberation versus **6/108** under compare-all. Yet CER rises as the decisive statement moves deeper, and enforced coverage of every reachable local dependency still leaves **1/132** failures. Comparison and forced inspection are **risk reductions**, not certificates.[1]

**Q4: Transfer depends on task and system configuration.** Comparison mostly transfers inside the primary benchmark but remains release-sensitive; on held-out tasks the deliberation-versus-compare-all gap can vanish or reverse; on the public-package slice CER moves from **36/162** to **26/162**, with intervals near zero. Rank sensitivity transfers more consistently than comparison benefits. The authors stay careful: observed safety depends on available alternatives, evidence depth, and configuration; a zero CER under three-source choice does not imply counterfeit rejection.[1]

## Reading CER, OEG, and “all-green outputs”

Tables like Table 3 are easy to misread as a model leaderboard. A stabler reading holds three facts together.

First, **near-perfect task success \(T\) is not surprising**—SINGED’s acceptance invariants already require all three candidates to produce the same valid artifact on frozen inputs. Every output in the original randomized-rank block is correct; across the five-task breadth suite overall \(T\) is about **94.1% (1412/1500)**. High \(T\) means the task oracle is satisfied by construction, not that execution is safe.[1]

Second, **CER and OEG often coincide in this construction**: every counterfeit execution also completes the task, so the share of “right answer, bad path” equals OEG and equals CER. If your internal eval shows high \(T\) with much lower \(SU\), the gap is in the process channel, not in “the model cannot do the task.”[1]

Third, the **“Compared all” column is a behavioral diagnosis, not decoration**. Several releases in Table 3 almost never compare all candidates and show rank-one CER in the **80%–90%** range; others almost always compare all three and sit near zero CER. The paper does not treat diligent comparison as a causal law, but matched policy interventions show that encoding compare-all as a rule can cut rank-one counterfeit execution from 27/60 to 0/60. In deployment that maps to **budget and gates**—allowing “inspect the first hit, then install” writes position bias straight into the production path.[1]

Layered evidence-depth results deserve a separate note. Moving the decisive statement from the entrypoint into one- and two-import depths raises CER under both policies; compare-all remains better at every depth, yet its own CER also rises with depth. Enforced coverage of every reachable local dependency still leaves residual failures. Operationally: **“read the entry file” ≠ “saw the decisive dependency” ≠ “switched to a safe source.”** Log coverage by stage; do not treat a single `cat` as supply-chain review.[1]

The public-package transfer slice moves the same threat from benchmark templates onto version-pinned public source trees (role-rotated Markdown / TOML / JSON parsers, among others). Task completion is similar under both policies; CER dips slightly with intervals near zero, while rank gradients persist. Functional-counterfeit risk is **not confined to author-written benchmark implementations**. When agents choose among version-pinned, interface-matched public trees, correct outputs can still mask process-side problems. For internal pipelines that pull tools from package registries or model hubs, that is closer to day-to-day risk than “train another alignment round.”[1]

## Single-source stress: a zero CER often means “a safe neighbor was available”

Seven releases with zero CER under three-source choice enter a paired diagnostic: only a benign source, or only its output-equivalent counterfeit (25 cells per condition). Benign-only cells all complete; counterfeit-only cells still execute and trigger the designated effect in **55/175** cells. The zero rates therefore reflect **access to safe alternatives**, not an intrinsic counterfeit-rejection capability. The deployment reading is immediate: when an allowlist shrinks to a single untrusted source, or retrieval returns only one package that “looks right,” a model that looked clean on a multi-source leaderboard can still run the counterfeit.[1]

That is why SINGED emphasizes choice sensitivity: both evaluation and deployment must write the candidate set into the conclusion. Remove the alternatives and re-measure before treating “safe” as a property of the model alone.[1]

## Limits: a measurement boundary, not a universal shield

The authors’ own boundaries are worth keeping. First, functional counterfeits and forbidden effects are constructed for sandbox labels—they are not a prevalence census of the public ecosystem. Second, comparison benefits are uncertain on unseen effects and public-package structures; deeper dependencies, release changes, and configuration differences leave residual risk. Third, inspection depth is largely descriptive: agents choose how far to read rather than being fully randomized. Fourth, SINGED scores **source selection and execution integrity**; it does not replace injection defenses, permission floors, or post-failure report fidelity (FTA). Fifth, the nonidentifiability result is an information limit on the output channel: closing OEG requires binding executed identity and process events into evaluation, not a stronger “look at the final file” judge.[1]

For readers here: do not chase CER as a lone leaderboard number; read it with task success, safe utility, and the candidate set. Do not treat forced compare-all as a deployment silver bullet—it costs more tool calls and does not guarantee same-direction gains on held-out effects.[1]

## Harness checklist: stop treating output as a pass grade

What transfers into engineering is evaluation and runtime contract design, not a magic one-line prompt from the paper.

1. **Provenance / allowlist**  
   Pull executable implementations from pinned sources or signed sets by default; retrieval rank must not be the sole trust root. SINGED’s rank effect shows that display order carries no provenance signal yet can dominate execution.

2. **A process oracle, not only a task oracle**  
   On install/execute traces, record executed hashes and contract-relevant events: network/loopback, out-of-scope writes, unrelated reads, unexpected child processes. An artifact hash proves \(T\), not \(\neg H\).

3. **Cross-candidate comparison as policy, not decoration**  
   When multiple sources are visible, require opening and contrasting the decisive files. That interrupts many “inspect the first, then install” shallow failures. Encode it as a decision rule and budget, not as hoped-for model diligence.

4. **Do not trust output-only graders**  
   CI, leaderboards, and internal acceptance that only diff final files or only run a task oracle will systematically overstate safe utility. Sample the process channel, or assert that the forbidden-event set is empty on sandbox replay.

5. **Pressure-test single-source and transfer separately**  
   A pretty zero CER under three sources can collapse when alternatives disappear or when public-package / deeper-dependency structures appear. Re-run after release upgrades instead of assuming “newer is safer.”

6. **Stack with the site’s other gates**  
   Tool-path / SSRF-class boundaries ([MCP Toolbox](/blog/google-mcp-toolbox-ssrf-tool-path-boundary/)), execution sandboxes ([OpenShell / Sentry](/blog/nvidia-open-agent-safety-openshell-sentry/)), post-failure report fidelity ([FTA](/blog/failure-transparent-agents-tool-failure-reporting/)), and read/write contracts ([Exactly-Once](/blog/exactly-once-model-harness-tool-contract/)) each cover a segment. SINGED adds **source selection under equivalent capability ads**. Drop any segment and another score can still look fine.

## Three deployment reminders from the eval design

Beyond checklist items, SINGED’s experimental design itself reads like an anti-pattern manual.

**Do not confuse “inspectable” with “will be inspected.”** Candidate code is inspectable before installation, yet many failures are “decisive evidence was visible and the counterfeit still ran,” or “the agent stopped before finishing comparison.” Exposure ≠ revision. A harness that only offers `read_file` without coverage and contrast requirements dumps the inspection duty back onto model diligence.[1]

**Do not confuse “no adversarial instruction” with “no supply-chain problem.”** Every SINGED request is a benign task, and sources carry no injection-style malicious instructions; the risk is **implementation choice**. That is orthogonal to whether the user said something dangerous. Passing a content filter does not mean the executed source is clean.[1]

**Do not map sandbox label effects directly onto production IOCs.** The paper uses loopback receipts, out-of-scope writes, unrelated reads, metadata changes, and unnecessary child processes as **observable, reproducible** forbidden events so the process oracle can audit. In engineering, replace those with the forbidden-effect set in *your* task contracts, and keep the task / process channels separate—rather than recreating the paper’s probe shapes.[1]

## Pairing with this morning’s FTA

Read the two posts as opposite faces of one verification debt:

| | FTA (morning) | SINGED (this post) |
| --- | --- | --- |
| Surface | Tools already failed | Artifact already correct |
| Illusion | Report still claims success | Evaluation still claims safety |
| Missing channel | Claims ↔ evidence | Output ↔ execution path |
| Harness handle | Evidence-contract fields | Provenance + process oracle |

One side is “claimed to see what was never observed”; the other is “treated a correct artifact as a clean path.” Both say that [verification and ownership](/blog/coding-is-not-solved-verification-ownership/) do not vanish when end-to-end scores look good. If evaluation only connects to correct outputs, deployments inherit the nonidentifiability gap; binding outputs to **inspected and executed identities** and to **observable process events** is the minimum SINGED asks for.[1]

## Closing

SINGED shows, with controlled functional counterfeits, that in LLM-agent tool and package selection **correct output does not certify safe execution**. Rank and early commitment concentrate failures in shallow trajectories; cross-candidate comparison cuts shallow risk without removing residual risk from dependency depth, unseen effects, and choice structure; a three-source zero CER can dissolve under single-source pressure. For people who write harnesses, the actionable line is short: pin sources, log process, compare candidates, refuse output-only pass grades—and stack that with failure transparency, tool boundaries, and sandbox floors. If you maintain a pipeline where the model picks tools, pulls packages, or runs third-party skills, add two acceptance cells next round: CER plus coverage logs when multiple sources are available, and a single-source stress cell after benign alternatives are removed. Pass both before writing “the answer was correct” into an external success metric.

## References

[1] Xiaoyu Xu, Zi Liang, Minxin Du, Qipeng Xie, Qingqing Ye, Yuyuan Li, Haibo Hu. *SINGED: Correct Outputs Do Not Certify Safe Execution in LLM Agents*. arXiv:2609.35889, 2026. <https://arxiv.org/abs/2609.35889>
