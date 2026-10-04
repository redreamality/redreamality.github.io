---
title: "Global Coherence: When Every Agent Is Right and the Team Is Still Wrong"
description: "Reading Xin Heng / Tote AI arXiv:2610.02036: local validity ⇏ global coherence. Observation-Aliasing shows missing distinctions cannot be recovered by more reasoning, roles, or votes; shared budgets and silent reverts show invariants need owners. Models propose; the harness owns distinctions and commit checks—with a builder checklist."
pubDate: 2026-10-04T16:40:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "complex-systems"]
lang: "en"
---

Three roles share a TeamBench task: a Planner writes the plan, an Executor runs commands, a Verifier checks the result, and the whole team gets **20** command runs. Each spend is locally justified—no one is clicking at random—yet the limit belongs to the team, not to any agent. Ordinary teams overspend that shared budget in **5/5** runs. Putting the live count in context still leaves **4/5** over budget. Enforcing the limit at commit brings violations to **0/5**. Xin Heng (Tote AI) packages this pattern as a hard claim in [arXiv:2610.02036](https://arxiv.org/abs/2610.02036) (*[Global Coherence: When Every Agent Is Right and the Team Is Still Wrong](https://ar5iv.labs.arxiv.org/html/2610.02036)*, 1 Oct 2026):

| **local validity ⇏ global coherence** |
| --- |
| Local legality does **not** imply a coherent whole. |

This is not a soft complaint that “the model is not smart enough.” The paper treats global coherence as a failure class of agent systems in its own right: the bottleneck is often **state, identifiability, and commit**, not another round of chain-of-thought. Across nine studies, a frontier model scores **40/40** when it can see the deciding event; with that event hidden, accuracy across reasoning, role, voting, and tool arms is statistically compatible with a **1/3** guess; one sentence restoring the fact returns **40/40**. Shared 20-call budgets, silent undos of committed changes on τ²-bench Telecom, and hidden collisions under split-view ontology merges keep hitting the same boundary: **if no one owns the distinctions that decide legality, a stronger model cannot invent them.**[1]

The site already covers several harness control planes: [MoMHa](/blog/momha-multi-objective-harness-accuracy-safety-tokens/) on accuracy / safety / tokens; [Control the Harness, Control the Cost](/blog/control-the-harness-control-the-cost/) on routing and spend; [default hard budget caps](/blog/default-hard-budget-caps-agent-deployed-services/) on kill switches for services agents deploy; [Exactly-Once](/blog/exactly-once-model-harness-tool-contract/) on side-effect contracts; [agent evaluation reliability](/blog/agent-evaluation-reliability-more-tasks-wont-fix-leaderboard/) on what leaderboard numbers actually support; plus an earlier [multi-agent systems](/blog/multi-agent-system/) survey. This post cuts one level upstream: **many multi-agent failures are missing state or missing ownership, not missing a bigger model.** The specification is for two crafts builders already practice—context engineering (which distinctions must enter each window) and the harness (what the runtime must own and check).

## Two failure modes: unseen, and unglued

The paper splits the problem into two paths; the experiments hit them separately.

**Failure one is observation aliasing.** Two global worlds look the same to every participant but require different legal actions. For an LLM agent, “look the same” means the same context. The Observation-Aliasing Impossibility Theorem is sharp: a policy can guarantee a valid action from its observation exactly when every world consistent with that observation shares at least one admissible action. If two worlds share an observation but have disjoint admissible sets, **no amount of reasoning, role decomposition, messaging, or randomization can guarantee the right choice**; with \(k\) indistinguishable worlds whose admissible sets are pairwise disjoint, the best randomized worst-case success is exactly \(1/k\). In one line: a stronger model searches better **inside** a window; it cannot see past it. Context engineering helps exactly when it puts the missing distinction into the window; longer thinking on the same window does not.[1]

**Failure two is “every local check passes, the pieces still do not glue.”** The information is present, only sliced. Three agents each use a locally valid, invertible unit translation while the triangle fails to close; three roles each make a legal spend while the total breaks a shared budget. The error lives on the **loop** or on an **unowned invariant**, not on any single edge. Pairwise checks suffice on tree-shaped overlaps; cycles can make pairwise agreement possible while the whole is impossible; for every fixed locality size there are constraint families where every \(k\) constraints are jointly satisfiable and the full set is not.[1]

The two failures share one rope: the impossibility theorem says **which distinctions a harness must keep**; the second failure is what happens when those distinctions are lost as state is split into views, re-encoded, or changed by actions. A manager agent is not the fix—it is one more proposer with one more local view, bound by the same theorem. The design point is: **models propose; the harness owns distinctions and runs commit checks.**[1]

## Study I: a hidden event beats more reasoning

Study I builds aliasing by construction. Each task is a 60-event revision log where three teams commit, revert, or re-apply changes to one parameter; the agent must name the current head; the server rejects any other parent. The final event is one of three operations that leave three different heads. In the identifiable version that event is visible; in the aliased version it is redacted, so three truths share one prompt and chance is \(1/3\).[1]

The contrast is almost a demo:

- With the deciding event **visible**, every arm (low / medium / high reasoning, Planner+Verifier, five-sample majority, tools) scores **40/40**.
- With the event **hidden**, tested reasoning / role / vote / “tool that cannot see the event” arms land around **12–17/40**, none significantly above \(1/3\); compatible with chance.
- One authoritative sentence (“the current head is \(X\)”) restores **40/40**; a query tool that can read the redacted event also hits 40/40, while a matched tool that only returns visible notes stays near 13/40.[1]

The paper is careful: the finite panel **supports** the predicted contrast but does **not** establish empirical equivalence to chance; the general impossibility comes from the task construction and the theorem, not from a null on forty items. The model solves every identifiable task, so competence is there; under aliasing it still looks like guessing, so the bottleneck is identifiability, not “think a little harder.” For builders: when debugging, ask first whether the bit that decides legal actions entered context, before asking whether to buy a more expensive model.[1]

## Study IV: shared budgets—seeing is not owning

The shared 20-call budget on TeamBench is the textbook case of failure two. Proposition 3.3: a shared budget **cannot** be protected by independent local checks—each spend can be legal alone while the sum exceeds \(B\). Two fixes work: an authoritative ledger that **refuses at commit**, or per-role escrow quotas with \(\sum B_i = B\).[1]

Safety counts on the preregistered LH2 five-seed panel:

| Condition | Overspend |
| --- | --- |
| Ordinary team | **5/5** |
| Live / queryable count (information without enforcement) | **4/5** |
| Enforce at commit | **0/5** |
| Per-role escrow quotas | **0/5** |

On the enforced side, observed mean task progress does not collapse in that five-run comparison (the panel is too small for a non-inferiority claim). The information arms cut median calls from about 70 to about 29 and still overspend in 4/5—**putting the number in the prompt is not ownership**. That is the same fork as [default hard budget caps](/blog/default-hard-budget-caps-agent-deployed-services/): alerts and visible counters are observability; synchronous refusal is enforcement. It also sits with [Control the Harness, Control the Cost](/blog/control-the-harness-control-the-cost/): the cap has to live on the path that can block the next call, not on another “manager agent that reads dashboards.”[1]

The first panel adds an engineering lesson: if the guard, the task, and the grader meter different variables, a ledger is theater. Only after aligning the authoritative unit—“team-wide shell `run` calls, refuse at 20”—did the intervention bite. Runtime reading of Proposition 2.4: **a guard constrains only the state it owns.**[1]

## Study V: silent reverts—current-state checks alias too

On τ²-bench Telecom, a user and an assistant change one environment under different permissions. In the preregistered 222-episode panel, one injected fault is especially sharp: a change the agent **already committed is silently undone**. Agents with ordinary call-time policy checks score about **0.07** on the benchmark’s own grader; agents with the coherence harness score **1.00**—the harness sends one notice and the agent redoes the change in 15/15 episodes. Current-state checks also commit on stale quotes (10/10 episodes in the paper): that is Proposition 4.1’s stale-read. Everything the proposal depended on (the read-set) must still hold at commit, and the read-set is every authoritative item that entered context and influenced the proposal—not only fields the final tool call touches.[1]

In the same study, when the injected change **directly breaks** a policy rule, ordinary policy checks **tie** the coherence harness—exactly where theory predicts a conventional tool already owns the invariant. Both sides of the boundary matter: a theory that only predicted wins could not be wrong.[1]

## Study IX: pairwise-invisible collisions need a network check

Under an explicit unique-name diagnostic, public OAEI ontology-alignment outputs from 2018–2024 carry pairwise-invisible same-ontology identity collisions in **23/45** networks. Agents given split views reproduce such hidden collisions in **9/40** merges; a single full-view agent leaves **0/40**; **pairwise checks never fire**; a **network-level check removes all nine**. The current send-to-all repair drops mean F1 from **0.796** to **0.774**—detection works; repair routing stays open. That is holonomy on a loop: every “same-as” edge looks fine; the cycle glues two distinct classes into one. Pipelines that only review handoffs will miss this class of error on purpose.[1]

## Five-piece framework in beam-length English

The formal object is \(\mathfrak{X}=(H,\mathcal{C},\mathcal{G},\mathcal{F};D)\). You do not need a category-theory course; the paper’s beam example is enough to operate.

Design, Fabrication, and Cost share one beam and record its length in meters, millimeters, and inches.

1. **\(H\) (topology / where scopes meet).**  
   Records which participants overlap and on which shared state. Three agents holding beam length → a triangle. When overlaps form a **tree**, pairwise agreement often suffices; when they form a **cycle**, pairwise can pass while the whole is impossible. Hub-and-spoke often works because a hub that holds shared fields turns overlaps into a star—a tree. Cost tracks interaction **width**, not headcount: a hundred agents in a pipeline can be cheap to keep coherent; five densely coupled agents can be expensive.[1]

2. **\(\mathcal{G}\) (groupoid / re-expression only).**  
   \(1\,\mathrm{m}\), \(1000\,\mathrm{mm}\), \(39.37\,\mathrm{in}\) are encodings of one beam; arrows are invertible translations. The check that matters: compose translations around any loop and you should get the identity. A single wrong factor (\(\div 25\) instead of \(\div 25.4\)) looks plausible on its edge and brings \(1\,\mathrm{m}\) back as \(1.016\,\mathrm{m}\). **Keep the translations, not only equivalence labels.** A spanning forest certifies consistency in linear time; minimum-cost repair can be NP-hard—so prefer catching errors before commit to guessing afterward who should rewrite which output.[1]

3. **\(\mathcal{F}\) (gluing / one world or none).**  
   Do three local pieces that agree on overlaps come from **exactly one** beam? “Every agent is right and the team is wrong” becomes a condition a harness can check: reject combinations that match pairwise yet come from no global state.[1]

4. **\(\mathcal{C}\) (category / actions that change the world).**  
   Revising the beam to \(1.2\,\mathrm{m}\), then ordering \$720 of steel—state changes, mostly irreversible, order matters. Unit conversion is \(\mathcal{G}\); changing length is \(\mathcal{C}\). **Only changes need commit checks**; pure re-expressions preserve global consistency automatically when translations agree.[1]

5. **\(D\) (history state / the little memory that still decides legality).**  
   The harness need not keep the whole log. Remaining budget and the version each agent last read are enough to refuse an order priced from the Cost agent’s v3 quote after the beam moved in v4. Stale derivations and silent undos of committed work live in \(D\); checkers that see only current values alias fresh and stale into one observation.[1]

Engineering counterparts—version checks, dependency engines, ledgers, escrow quotas—are domain realizations of the same requirements. Where a conventional tool already owns the relevant state, the general harness should tie (Studies III and VI); where ownership is missing, the gap shows (I, IV, V, IX).[1]

## Why “give everyone all the context” still fails

Sharing everything looks like a cheap escape. The paper’s reasons it fails in principle compress to five builder facts: (1) windows, privacy, and authority limit what each role sees, and each decision uses that role’s own information set—not the union of views; the smallest sufficient observable set is NP-hard to choose; (2) pairwise agreement need not glue on cycles, and exact checking grows with interaction width; (3) detecting inconsistency can be linear while minimum repair is hard—so block at commit; (4) shared constraints need commit ownership or escrow, not more local diligence; (5) time adds stale reads—current-value checks alias fresh and stale (Study V). Larger windows help missing bits; they do not create owners, loop checks, or versioned commits, and can fake safety when everyone “saw” a budget no one can refuse.[1]

## Spec: what context must contain, what the harness must own

**Context engineering (per decision window).**  
A context is sufficient exactly when it **never** merges two worlds that allow different actions. Choosing the smallest sufficient field set is NP-hard—in practice pick greedily and reverse-engineer missing bits from failures. Role \(i\)’s decision is bounded by \(\Omega_i\) and messages it received, **not** by the union of all views; multi-agent protocols that introduce no new external observation cannot create missing information either (Corollary 2.2).[1]

**Harness (authoritative runtime outside the proposal).**  
The model samples a proposal from context; the harness checks against authoritative semantic state \(z=\phi(x)\) and returns accept / repair / reject; only accepted changes enter the world. It must own distinctions that change legality, run global consistency where local checks fail, and verify read-sets / budgets / gluing when state changes commit. A manager agent that only receives summaries is still another \(\Omega_i\). Real leadership means: **whoever authoritatively holds the full scope of a constraint and controls commit.**[1]

Joints with other posts on the site: [Exactly-Once](/blog/exactly-once-model-harness-tool-contract/) asks which layer owns side-effect exactly-once; this post asks which layer owns **legality distinctions**. [MoMHa](/blog/momha-multi-objective-harness-accuracy-safety-tokens/) searches harness configs on multiple objectives; Global Coherence says which state obligations the harness must accept **before** that search—if the space has no knobs for an authoritative shared ledger, loop checks, or atomic read-set commit, a pretty joint reward will not invent ownership. [Evaluation reliability](/blog/agent-evaluation-reliability-more-tasks-wont-fix-leaderboard/) warns what claims a score supports; this post warns that folding capability, identifiability, and commit correctness into one number systematically overrates “swap the model.”

## How this bites other control planes (and a short playbook)

Cost posts already separate soft alerts from hard stops; Study IV is the multi-agent edition on a shared tool-call quota (visible count ≈ soft alert; commit refusal ≈ hard cap; escrow ≈ local sub-caps). [Exactly-Once](/blog/exactly-once-model-harness-tool-contract/) and read-set / commit are siblings—idempotency for duplicate writes, versions for stale reads. [MoMHa](/blog/momha-multi-objective-harness-accuracy-safety-tokens/) cannot search ownership knobs that are not in the space. [Evaluation reliability](/blog/agent-evaluation-reliability-more-tasks-wont-fix-leaderboard/) and this essay both warn against one score for many claims. The earlier [multi-agent systems](/blog/multi-agent-system/) survey maps the map; this post turns interaction constraints into a review checklist.

When a merge is impossible while every local diff “passed,” ask in order: **aliasing** (restore the deciding bit), **unowned invariant** (ledger or escrow), **cycles** (network / spanning-forest check), **time** (read-set still true; silent undos), **orchestration illusion** (does the manager *hold* state, or only another summary?). Swap-model / add-reviewer is step 0 only after those five.

## Builder checklist

1. **Ask which distinction is missing before asking for a bigger model.** First sentence of a postmortem: which bit decided legal actions, and whose context or harness state held it? Study I: one fact beats longer reasoning.
2. **Name an owner for every shared invariant.** Budgets, quotas, uniqueness, mutexes—showing a counter is not enough; refuse at commit or split into escrow. Pair with Study IV and the hard-cap post.
3. **Put deciding distinctions in context, and prefer harness authority.** “Mentioned in the window” ≠ “owned by the runtime”; visibility arms still overspend.
4. **Check loops, not only edges.** Pairwise handoffs miss cycles; certify translation networks with a spanning forest plus leftover edges; ontology / schema / unit graphs are the same shape.
5. **Version and read-set at commit.** Record every authoritative item the proposal depended on (including a quote read five turns ago); check atomically before write. Blocks Study V’s stale quotes and silent reverts.
6. **Do not expect a manager agent to magically fix missing state.** Planner+Verifier still overspent under a live count; orchestration helps when a hub **holds** shared fields and turns overlaps into a tree—not because an extra role can talk.
7. **Prefer detection before optimal repair.** Consistency proofs can be linear; minimum repair can be hard. Production path: stop at commit, then decide who rewrites which slice.
8. **When a domain tool already owns the state, do not rebuild it.** Dependency closure and coupled solvers should tie the general harness on their home ground; spend engineering on boundaries that still have no owner.
9. **Schedule parallel vs sequential from read/write sets.** Disjoint \(W_i\) and \(R_j\) can run free; when they meet, choose among lock-and-order, optimistic commit-and-rerun, or provenance invalidation via \(D\).
10. **Split evaluation into three questions.** Capability (is the proposal useful?), identifiability (is there enough state to decide legality?), commit (do locally accepted actions keep the whole coherent?). Leaderboards that only brush the first miss this whole failure class.

## Limits and how to read the evidence

The authors state the agent evidence uses **one** model family and modest panels; the aliasing probe is synthetic; τ² faults are injected; TeamBench safety cells are often five seeds. The theoretical boundary is clear; frequency extrapolation is next. For builders, the useful takeaway is not “your production pipeline will overspend 5/5,” but a diagnostic order: **missing distinction → missing owner → loop miss → stale read-set**, each with a patch that usually does not live in the weights.[1]

## Closing

Global Coherence nails the intuition: **local legality does not imply global coherence.** Unseen distinctions cannot be reasoned into existence; unowned invariants survive live counters in the prompt; pairwise-green pipelines can break on a loop; current-value checks alias stale and fresh. The nine studies draw an honest boundary—the harness wins where state is missing or unowned, and ties where a conventional tool already owns it—freeing models from obligations they should not carry alone.

Models propose; the harness owns distinctions, assembles context, and enforces at commit. Put “owner of each shared invariant,” “loop check,” and “read-set” beside model routing in scaffolds. Next time every participant was “right” and the delivery still fails, ask first: **which distinction still has no owner?**

## References

[1] Xin Heng. *Global Coherence: When Every Agent Is Right and the Team Is Still Wrong*. arXiv:2610.02036, 2026-10-01. [abs](https://arxiv.org/abs/2610.02036) · [HTML](https://ar5iv.labs.arxiv.org/html/2610.02036).
