---
title: "Who Holds the Pen? Let Specifications, Not Agents, Sign Off: SpecHarness and Spec Authority"
description: "A deep read of arXiv:2609.29921 SpecHarness—compiling visible specs into verifiable obligations so agents propose while an external runtime commits state and finalization from qualified evidence—contrasted with OpenSpec/SDD and this site’s harness narrative, plus a practical proposal–authority checklist."
pubDate: 2026-09-25T00:00:00+08:00
author: "Remy"
tags: ["sdd", "openspec", "agent-harness", "ai-agents", "agent-loop", "specification"]
lang: "en"
---

Coding agents quietly collapse a boundary that should stay open. Task instructions, guidelines, output schemas, and `SKILL.md` files are meant to be *external* specifications, yet at runtime they usually become more context for the same model that plans, calls tools, self-evaluates, and declares “done.” Proposal and acceptance fold into one loop; the specification never gets an independent authority boundary. In [arXiv:2609.29921](https://arxiv.org/abs/2609.29921), UT Arlington researchers and coauthors pin the question: **who holds the pen decides what counts as compliant completion.** SpecHarness compiles agent-visible specifications into source-linked obligations, then uses a versioned ledger and admissible evidence to govern commitment and finalization. In one line: **the agent proposes; SpecHarness commits.**

This is a mechanism piece on this site’s OpenSpec / SDD / harness thread—not soft ranking news. It complements clear specs for humans and models, but it is **not** the Fission-AI OpenSpec product. SpecHarness is a research runtime-authority architecture. Numbers below are paper-only.

## Two structural gaps: understanding is not execution, and claiming done is not establishing state

Figure 1 in the paper separates two failure modes.

**Understanding–execution gap (U–E).** A model can correctly interpret a requirement—step order, argument constraints, artifact shape—yet omit it, violate it, or combine constraints wrongly during execution. Understanding sitting in context does not automatically govern the trajectory.

**State–authority gap (S–A).** Harder still: an agent’s interpretation or completion claim does not prove that the specification-required state has been achieved. The agent may honestly believe it finished, or it may stop early; either way, **a self-issued completion is not an authoritative completion.**

What most systems lack is not “one more prompt,” but a **specification authority boundary**: who may establish specification-governed state and authorize finalization. Training-time alignment (RLHF, Constitutional AI) still leaves the same model acting under a specification and judging whether it was satisfied. Inference-time methods usually sit in post-hoc verification, completion gating, or runtime enforcement—useful, yet rarely governing *both* execution *and* evidence-authorized commitment. SpecHarness targets that boundary.

## Checkable SkillsBench numbers (paper only)

The authors quantify both gaps on all **87** SkillsBench tasks. Seven models are compiler candidates; one is selected on development annotations derived only from agent-visible materials under a prespecified protocol, then **frozen before evaluation**. The chosen compiler is **GPT-5.6 Sol**. From agent-visible task prompts, workspace information, and injected skill specifications alone, it extracts **509** source-grounded task directions. Held-out official verifiers and oracle solutions are evaluation-only: they are **not** used for obligation construction or runtime feedback.

Across seven task-agent models, only **79.6%–86.4%** of those directions are satisfied—visible requirements still fail in execution at a non-trivial rate. Worse, agents’ completion-claim rates exceed official evaluator pass rates by **28.7–37.9** percentage points. This is not one model’s quirk.

The measurement surface matters: the 509 directions from the frozen compiler over agent-visible materials form a shared source-grounded denominator across models and conditions; satisfaction is judged from execution evidence, not by reverse-engineering whether the model “understood.” U–E therefore measures **unrealized source-grounded units**, not latent comprehension. A post-hoc alignment audit relates those directions to 573 of 585 held-out official test functions (including 406 fine-grained matches)—alignment, not recovery of verifier semantics into obligations. Keep that denominator in mind so “direction satisfaction” is not confused with official Pass.

The seven models (as named in the paper) are GPT-5.6, Claude Fable 5, Gemini 3.1, Kimi K3, GLM-5.2, Qwen3.7, and DeepSeek-V4 (task-agent rows often appear as DeepSeek-V4-Pro / Qwen3.7-Max and similar variant labels). They serve both as compiler candidates and, separately, as task agents on SkillsBench / GuideBench; after freezing GPT-5.6 Sol as compiler, the direction index and obligation IR are shared across conditions. Raw and SpecHarness share **OpenHands** as the execution substrate, with paired budgets, timeouts, and tool access—avoiding fake contrasts where one side gets more tools or less budget.

Main result (Table 1, unweighted macro average across seven models):

| Condition | Pass↑ | U–E↓ | S–A↓ |
| --- | --- | --- | --- |
| Raw | 61.1% | 17.4% | 32.8% |
| SpecHarness | 73.1% | 9.3% | 12.8% |
| vs Raw | **+12.0 pp** | −8.1 pp | **−20.0 pp** |

Pass is the official-verifier pass rate; U–E and S–A are diagnostic. The macro Pass gain has a 95% paired task-bootstrap interval excluding zero; per-model McNemar tests remain significant after Holm correction (Appendix D.1). The paper is explicit: the main comparison evaluates the **complete governed runtime**—online validation, feedback, and repair—not the isolated effect of authoritative commitment under matched compute. Computational overhead is in Appendix D.3. The larger S–A reduction than Pass gain is consistent with both failure recovery and rejection of unsupported completion claims.

## State Authority Principle: proposal autonomy, external state authority

The paper formalizes the distinction as the **State Authority Principle**: for reliably grounded and verifiable conditions, **the specification defines what may be accepted**, while **an external runtime determines whether the required state has been established**. Agents may still interpret tasks, plan, select tools and skills, implement, and repair—but those acts only produce *proposals*: action proposals, repair proposals, and finalization requests. Authoritative state may be established only from admissible evidence produced by qualified providers.

Operationally (you need not memorize the formulas): the runtime keeps a versioned obligation ledger; a write needs a corresponding obligation, admissible evidence, and a commit event. Agent outputs and “I think it passed” cannot write the ledger. Division of labor: **the agent proposes; SpecHarness commits.** A commit may record validated success *or* failure; satisfaction is judged separately with freshness—so failures can be recorded to drive repair, not pretended away.

That should feel familiar on this site: [Jev × Claude Code](/blog/jev-claude-code-10x-and-25-lines/) and [Jev-Mem](/blog/jev-mem-system-one-agentic-memory/) separate generation from judgment; [Grow the Harness](/blog/grow-the-harness-not-the-context/) sinks recurring control into code. SpecHarness pushes a harder claim: **the pen that signs completion should not sit with the executor.**

Take the paper’s array-processing example. The agent may propose “run the array-processing step.” The runtime checks preconditions, arguments, and ordering, then allows or blocks. Afterward, obligation state does **not** flip because the agent says the array is ready—only after the bound validator confirms path, shape, data type, and finite values, and admissible evidence is committed, does the entry become established. A failed validator result can still be committed to drive repair; recording failure ≠ satisfying the obligation. The model invents approaches; the pen stays on the evidence chain.

In a coding agent, CI green, “all tests passed,” and a PR marked Done are often collapsed into one “complete.” Ask first: which qualified provider produced the green check? Is evidence still fresh? Are mandatory obligations stale or unknown? If unclear, the claim stays a proposal—not repository truth.

## SpecHarness architecture: compile → mediate/validate → ledger → fail-closed finalize

Read Figure 4 in engineering language.

**1. Compile visible specs into source-linked obligations.** Task prompts, applicable guidelines, injected skills, and the observable workspace are segmented into source-addressable units and assigned a disposition: `hard`, `advisory`, `abstain`, or `residual`. Hard obligations enter the mandatory set only when parameters are source-grounded, an authorized evidence provider exists, and the validator is qualified for blocking under the development protocol; otherwise they stay advisory guidance, or abstain/residual without independent blocking rules. The direction index supports measurement and attribution; the obligation IR (Γ★) governs authorization, validation, commitment, and finalization—the two need not be one-to-one.

**2. The agent interface accepts proposals only.** Proposals come in three tagged classes: parameterized actions, repairs targeting reported failures, and finalize requests. The agent keeps the original task context, skills, and residual context, and receives source-linked feedback plus advisory guidance—but it **cannot** mutate the ledger, inject validator outcomes, mark obligations satisfied, or authorize finalization.

**3. Action authorization and controlled execution.** Proposals are normalized to canonical actions, matched to relevant obligations, and decided as allow / block / unclear. On closure-audited action surfaces, SpecHarness can mediate-and-commit (no bypass path outside authorization). On safely isolated channels it uses validate-and-commit (execute, then validate effects). On SkillsBench, about **44.0%** of hard obligations sit on mediate-and-commit surfaces and **56.0%** on validate-and-commit; GuideBench has no closure-audited physical action surface, so **100%** of rule-local decision-state obligations use validate-and-commit (Table 7). That bounds the claim: SpecHarness governs the grounded, observable mandatory portion of the specification—not the full natural-language document.

**4. Effect validation, versioned commitment, and freshness.** Trusted observers produce evidence; the bound validator returns passed or failed. Only when evidence is trusted, contextual conditions hold, and the result is definite does SpecHarness atomically update the ledger with provenance. Agent claims, validator errors, and effects without admissible evidence cannot create authoritative state. Satisfaction further requires the dependency digest to match current artifact, input, validator, environment, and dependent-obligation versions (*fresh*); mutations mark affected entries and dependents stale or unknown until revalidation. Appendix Table 6: over 248 targeted dependency mutations, without freshness every mutation leaves outdated evidence admissible for completion; full SpecHarness invalidates all affected entries, restores **95.8%** through revalidation, and recovers **95.6%** of tasks after repair.

**5. Fail-closed finalization.** Finalize is allowed only when every fresh mandatory obligation is satisfied at current evidence versions. After mutations, revalidate; the agent may propose repairs, but only new admissible evidence can recommit state.

A grounded obligation is a five-tuple: provenance, action matching and authorization, execution and validation, state commitment and satisfaction, and dependency plus enforcement control—where the rule came from, which actions it matches, how to run or validate, how outcomes enter the ledger, what it depends on, and whether it may block. Without an authorized provider or a blocking-qualified validator, do not force the item into hard obligations. Directions support measurement and attribution; the obligation IR supports authorization and finalization. Counting prompt mentions without a ledger still measures context coverage, not authoritative state.

Ablations (Table 5, GPT-5.6 Sol fixed) show complementarity: removing mediation mainly raises U–E; removing effect validation raises unsupported acceptance; removing commitment hurts S–A most; removing blocking qualification can lower S–A only by sacrificing Raw-pass preservation—conservative rejection is not reliable authority. Dropping skill-derived obligations widens both gaps. The full chain needs action control, effect evidence, authoritative acceptance, and selective blocking together.

## Three intervention paradigms: post-hoc verification, completion gating, runtime enforcement

Figure 2 / Table 2 compare four method classes on the same substrate with GPT-5.6 Sol fixed (SkillsBench official Pass / U–E / S–A):

| Paradigm | Representative (paper’s adaptation) | Pass | U–E | S–A | Provenance / effect validation / versioned commit |
| --- | --- | --- | --- | --- | --- |
| Post-hoc verification | Agentic Rubrics | 74.7 | 12.6 | 23.0 | Partial / partial / none |
| Completion gating | VeriMAP | 79.3 | 9.6 | 20.7 | Partial / yes / none |
| Runtime enforcement | AgentSpec | 78.2 | 8.8 | 24.1 | Yes / none / none |
| Mediate-and-commit | SpecHarness | **85.1** | **6.3** | **6.9** | Yes / yes / yes |

Read carefully: this is the paper’s **adapted comparison**, not a site re-run. AgentSpec-style enforcement can press U–E while S–A stays higher; VeriMAP-style gating filters terminal claims without governing prior trajectories; post-hoc verification diagnoses completed runs and typically does not commit authoritative state. SpecHarness makes completion the **final commit**: source-linked obligations govern covered execution, and finalization needs all fresh mandatory obligations satisfied.

Related work cites VIGIL, FORGE, verify-gated completion, AgentRx, and others: better observability, gating, or compliance, yet the paper still finds a missing authority boundary over both execution and evidence-authorized commitment. SpecHarness borrows reference-monitor, runtime-verification, and transactional-commit ideas; its agent-specific move is to **compile visible specifications into source-linked obligations and govern versioned state and finalization with qualified evidence.**

## GuideBench: the same principle on decision state

SkillsBench covers tool use and artifact / environment state. GuideBench has **1,042** guideline-constrained decision tasks; after removing duplicate rules, the authors obtain **297** obligation templates and **5,817** task-level instances. Macro averages move from Raw to SpecHarness as Pass **86.2%→91.3%**, U–E **10.4%→5.0%**, S–A **13.8%→6.9%** (Table 3). In the GPT-5.6 Sol–fixed paradigm comparison (Table 4), SpecHarness again reduces both gaps. SatLM-style approaches that hand declarative rules to an external solver can lower U–E, yet if solver outputs are not committed as authoritative decision state, S–A can remain higher.

Product translation: a plausible answer is not enough—it may omit a rule, misresolve priority, or rely on unsupported judgment. Spec authority asks whether **rule-local decision state** was committed from qualified evidence, not whether the answer merely “looks right.”

## Boundaries: not a silver bullet, and not “harden every NL sentence”

The paper draws its own lines; do not overclaim past them:

1. **Ungrounded, subjective, conflicting, or unverifiable requirements stay advisory or abstained**—they still guide the agent but do not become hard blockers. Guarantees cover grounded mandatory obligations, not the full natural-language specification.
2. **Held-out official verifiers never feed obligation construction or runtime feedback**; they are used only for final Pass measurement and post-hoc alignment audits. The compiler consumes agent-visible materials only and is frozen after development-set selection—avoid writing the exam with the answer key.
3. **Overhead is real.** Appendix D.3: relative to Raw, SpecHarness averages about **1.53×** task-agent tokens, **1.24×** condition-execution wall-clock time, and **0.36** additional task-agent calls per task. The main comparison includes online validation / feedback / repair; commitment is not free.
4. **No-bypass mediation holds only on closure-audited surfaces**; isolated channels rely on post-effect validation; finalization still requires all fresh mandatory obligations satisfied.
5. **SpecHarness is a research runtime architecture**, not the OpenSpec CLI / stores product name. Site contrasts below are complementary narratives, not claims of a shared implementation.

One more boundary: the main result compares the **complete governed runtime** to Raw, so gains include validation feedback and repair. Do not read +12 pp Pass as “add a commit primitive alone.” The paper notes commitment was not isolated under matched trajectories and compute. If you pay for online validation and repair, the reported gaps shrink; if you want a zero-cost finalize switch, do not borrow these numbers.

## How this sits next to OpenSpec / SDD / harness on this site

Keep the layers distinct so writing a spec, running an agent, and who may sign off do not blur together.

- [OpenSpec tutorial](/blog/openspec-tutorial-cli-commands-agents-md-examples/) and [OpenSpec 1.5 Stores](/blog/openspec-1-5-stores-beta-update-guide/): how specifications are authored, changed, and managed through change / archive lifecycles into agent-readable context. That is the **SDD tooling surface**—the shared source of truth.
- [Ralph Wiggum loop vs OpenSpec](/blog/ralph-wiggum-loop-vs-open-spec/): how loop strategy and spec-driven work divide labor; a written spec alone does not remove completion authority from the agent.
- [SDD framework comparison: BMAD / spec-kit / OpenSpec / PromptX](/blog/-sddbmad-vs-spec-kit-vs-openspec-vs-promptx/): how open-source routes organize specs and workflows; most still stop at specs-in-context, with less explicit evidence-authorized commit.
- [Grow the harness, not the context](/blog/grow-the-harness-not-the-context/): sink recurring control into code; SpecHarness turns another dial—**authoritative state and finalization**.
- [Strands Harness SDK](/blog/strands-harness-sdk-production-agent-runtime/) and [ECC Agent Harness optimization](/blog/ecc-agent-harness-optimization/): how production loops stay alive and get tuned; hang “obligation ledger + fail-closed finalize” on the harness rather than stuffing another acceptance essay into the prompt.

One sentence: **OpenSpec / SDD answer how specifications are written, changed, and shared; SpecHarness answers how specifications hold the pen at runtime.** The first is the input and collaboration surface for proposals; the second is the authority surface for commit and sign-off. Use them together; do not impersonate each other.

Two mismatches are common. First: excellent OpenSpec changes and clear acceptance, yet the loop still ends on “model says Done + a human glance”—authority in documents, not runtime. Second: many hooks and tests, but no versioned obligation state or freshness, so stale greens survive later edits. SpecHarness blocks both: compile checkable obligations, commit qualified evidence, finalize only on fresh mandatory items.

If you already use Stores / archive, you need not rewrite the toolchain—add finalize admission that reads the ledger, not the model’s last sentence. That aligns with verify-gated completion, but verification should organize around source-grounded obligations and state transitions, not a single terminal gate.

## Practical checklist: separate proposal from authority in an OpenSpec / SDD coding-agent loop

You do not need a commercial product named SpecHarness. Reshape the coding-agent loop with the same principle: move **sign-off authority** onto an auditable evidence chain while the model keeps proposing and repairing.

Minimal slice: pick one change class (API schema + contract tests), compile acceptance into 10–30 hard obligations bound to commands or scripts; grant merge only when the ledger is green and fresh. After two weeks, check unsupported completion claims, real regressions, and validation cost—then decide whether to expand.

1. **Compile obligations—do not only inject the full text.** From OpenSpec changes, acceptance criteria, `SKILL.md`, and CI schemas, extract checkable items; bind each to a source address (which spec, which section). Mark what cannot be checked automatically as advisory; do not pretend it is hard.
2. **Whitelist evidence providers.** Test commands, linters, typecheckers, artifact schema validators, path/shape checks—write down who may produce evidence. Agent self-reports and chat “LGTM” stay off the whitelist.
3. **Tag three proposal classes.** Keep act / repair / finalize separate; finalize reads the ledger, not the model’s mood.
4. **Mediate when you can; validate-and-commit when you cannot.** Gate dangerous tool calls; run validators after file artifacts; write both outcomes into versioned obligation state.
5. **Freshness and dependencies.** After code or input changes, mark related obligations stale until the matching checks re-run; forbid signing off on stale green checks.
6. **Fail-closed finalize.** Any unsatisfied fresh mandatory obligation → refuse completion; return source-linked failures for repair instead of a human “close enough.”
7. **Do not leak held-out eval sets into obligation compilation.** Keep internal hidden tests for final measurement only—same shape as the paper’s protocol—to avoid circular self-grading.
8. **Measure overhead; do not pretend it is free.** Extra validation and repair rounds cost tokens and wall clock; book the quality bought by rejecting unsupported completion against that cost.
9. **Keep an audit trail.** Retain obligation IDs, evidence digests, and commit events so you can later ask who held the pen on a given completion.
10. **Pilot a clear task family first.** Prefer change types with crisp schemas, tests, and artifact paths; leave subjective copy and open-ended design advisory until you know what to harden.

Checklist as a short reminder: **compile obligations → whitelist evidence → versioned commit → fail-closed finalize.** Behind it is still the State Authority Principle; drop any link and the specification collapses back into model-readable context.

## Closing: elevate the specification to external authority

SpecHarness reframes specification following as a **state-authority** problem, not reasoning or verification alone. The contribution is not another isolated validator, but an agent-specific authority boundary: proposals, actions, and self-assessments cannot directly establish specification-governed state. Within the SkillsBench and GuideBench results the paper reports, the full obligation–evidence–commit architecture raises official Pass, reduces both structural gaps, and pays a measurable runtime overhead. For teams already on OpenSpec / SDD, what transfers is not the paper’s codename but the division of labor—**the specification defines what may be accepted; an external runtime commits from qualified evidence; the agent proposes and repairs, and does not hold the final pen.** If you change only one thing next week, move finalize from “the model’s last sentence” to “the obligation ledger is green and fresh”; other optimizations can wait behind that authority boundary.

## References

1. Haiqing Li, Xin Ma, Yinhao Wu, et al. *Who Holds the Pen? Let Specifications, Not Agents, Sign Off.* arXiv:2609.29921, 2026. https://arxiv.org/abs/2609.29921
2. SkillsBench (cited as Li et al. 2026b). https://arxiv.org/abs/2602.12670
3. GuideBench (Diao et al., ACL 2025). See the paper’s reference list.
4. OpenHands (Wang et al. 2025b; shared execution substrate in the SpecHarness experiments). See the paper’s experimental setup.
5. Related on this site: [OpenSpec tutorial](/blog/openspec-tutorial-cli-commands-agents-md-examples/), [OpenSpec 1.5](/blog/openspec-1-5-stores-beta-update-guide/), [Ralph vs OpenSpec](/blog/ralph-wiggum-loop-vs-open-spec/), [Grow the Harness](/blog/grow-the-harness-not-the-context/), [Strands](/blog/strands-harness-sdk-production-agent-runtime/), [ECC Harness](/blog/ecc-agent-harness-optimization/).
