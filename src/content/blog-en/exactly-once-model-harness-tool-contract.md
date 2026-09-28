---
title: "Where Does Exactly-Once Live? Model, Harness, or Tool Contract"
description: "Reading arXiv:2609.29095: Limbo (6 services, 12 faults, 25,930 episodes) shows exactly-once for LLM agent side effects lives in the model when read-back can resolve outcomes, and in the tool contract under in-flight/redelivery faults—idempotency keys cut duplicates 28%→4%; distrust agent success reports."
pubDate: 2026-09-28T10:40:00+08:00
author: "Remy"
tags: ["agent-harness", "ai-agents", "agent-loop", "developer-tools"]
lang: "en"
---

When a tool-using agent’s write times out or returns a server error, the action may already have taken effect. Retrying blindly duplicates it—a second charge, a second announcement, a second deployment—while giving up skips required work. Distributed systems treat this ambiguity as fundamental and put the remedies in the **interface**: idempotency keys, conditional writes, queryable operation status. Agents inherit the ambiguity, but not by default those remedies.[1]

A September 2026 preprint asks the engineering question bluntly: **where should exactly-once behaviour be enforced—in the model, in the agent harness, or in the tool contract?** The authors introduce **Limbo**, a deterministic sandbox of six simulated services and twelve boundary fault modes, grading every episode against a ledger of committed side effects. Across **25,930** episodes—nine recent models, three production harnesses, two contract variants, fifteen recovery conditions—the answer is not “buy a stronger model” or “switch CLI frameworks.” It **depends on whether an immediate read-back can reveal what happened**.[1]

Paper: [arXiv:2609.29095](https://arxiv.org/abs/2609.29095) (HTML: [full text](https://arxiv.org/html/2609.29095)). Numbers below are from that paper and tagged [1]. In-site companions: [Control the Harness, Control the Cost](/blog/control-the-harness-control-the-cost/), [Grow the Harness](/blog/grow-the-harness-not-the-context/), [ECC harness optimization](/blog/ecc-agent-harness-optimization/), [Strands production runtime](/blog/strands-harness-sdk-production-agent-runtime/), and [agents tampering their own traces](/blog/llm-agents-tamper-own-traces-append-only-audit/). Those posts cover routing spend, growing control into code, productizing the loop, and audit integrity. This one adds: **a stable loop still double-writes if nobody owns exactly-once for side effects.**

## Three candidate homes for exactly-once

Picture three layers:

1. **Model** — after a timeout, verify before deciding whether to retry; enough caution handles lost acknowledgements.
2. **Harness** — CLI/SDK wrappers that transparently retry, verify-before-retry, or attach idempotency keys.
3. **Tool contract** — write APIs that accept keys, expose status queries, and document visibility lag and in-flight bounds.

If frontier models almost never retry blindly, better models suffice. If harnesses retry invisibly or change what the model sees, framework choice matters. If some failures **cannot be resolved by any amount of verification**, the remedy must sit in the contract. Limbo’s value is factorial control: same task, world, and fault; vary only model / harness / contract / recovery policy; grade with a ledger, not an LLM-as-judge.[1]

## Limbo: six services, twelve faults, ledger grading

Limbo is a resettable deterministic sandbox. Six services follow familiar production conventions: **social** (publish; key only on the mastodon path; weibo listing lags 180s; no listing for x), **billing** (`create_charge` with key; naturally idempotent `refund`; strongly consistent lists), **tickets** (non-idempotent create/comment; conditional status updates; search lags 120s), **mail** (irreversible send; sent-folder search lags 120s), **data** (non-atomic insert/insert_many; idempotent upsert), **deploy** (non-idempotent trigger; strong list/get). Three general tools—`wait`, `escalate_to_human`, `finish`—complete the surface. Machine-readable contracts (read-only / idempotent / destructive hints, intent fields, read-back function, visibility lag, compensating action) are available to harness-level policies; **the agent never sees the contract object**.[1]

Twelve task templates cover release announcements, invoicing charges, tickets-plus-email, incidents, batch migrations, staged deploys, refunding a wrong charge, feature flags, per-customer notifies, cross-posts, subscription upgrades, and a longer hotfix path—about 34–35 faultable focal writes per instance. Instructions end with one sentence asking every action to happen exactly once; ablation E6 removes that cue.[1]

Faults fire at the **service boundary**, not inside the prompt. Within each observation-equivalent group, the visible response is byte-identical across hidden outcomes:

| Mode | Agent sees | Hidden outcome | Exactly-once recovery |
| --- | --- | --- | --- |
| `timeout_pre` | timeout | not executed | verify, then re-issue |
| `timeout_post` | timeout | executed, ACK lost | verify, then skip |
| `timeout_late` | timeout | commits 90s later (still in flight) | same key, or wait and escalate |
| `timeout_late_tail` | timeout | commits 40s–2h later (heavy tail) | same key |
| `http500_pre/post` | HTTP 500 | not executed / executed | verify, then re-issue or skip |
| `partial_timeout` | batch timeout | first half executed | re-issue only missing rows |
| `duplicate_delivery` | success | executed twice | send a key proactively |
| 503 / 429 / outage / schema_drift | clear error | not executed | retry / wait / stop / repair args |

Late commits land 90 simulated seconds after send; the heavy-tailed variant draws log-uniform delays between 40s and 2h (median on the order of several minutes in the paper’s reporting). Requests still in flight complete at episode end—as they would in reality.[1]

The grader reads the **ledger of committed effects** and final world state: task success (TS) requires every required effect to stand without collateral damage; **exactly-once success (EOS)** additionally forbids excess executions. A refunded double charge still counts as a duplicate side effect—compensation is not erasure. Recovery behaviour (blind retry, same-key retry, new-key retry, verify-then-retry/skip, escalate, stop without checking, move on) is classified deterministically from the agent’s tool calls, not from self-report and not by another LLM judge.[1]

Validity checks include thirty-one scripted-agent unit tests for fault semantics, and empirical checks that agents cannot distinguish observation-equivalent worlds (first post-timeout actions agree ~**87%** on matched pairs vs ~**82%** on same-world reruns; E1/E2 overlap agrees on duplicates in **96%** of 868 episodes, \(\kappa=0.90\)). If the sandbox leaked the hidden outcome, every later contrast would collapse.[1]

The minimal scaffold is a standard function-calling loop (up to 40 tool calls). Production harnesses are **GitHub Copilot CLI 1.0.86, Hermes Agent 0.20.6, and OpenAI Codex CLI 0.139**, with the sandbox exposed over MCP so fault plans and ground truth never leave the runner. Nine models share one gateway: `gpt-6-astra`, `gpt-6-sol`, `gpt-5.6-sol`, `gpt-5.4-mini`, `gpt-4.1`, `claude-opus-5.5`, `gemini-3.8-flash`, `grok-4.7`, and `mai-code-1.1-flash` (identifiers as exposed in September 2026).[1]

Contracts come in two variants: **native**—only billing and one social platform accept keys; **keys-everywhere**—Stripe-style key semantics on every non-idempotent write (including resumable batches, late commits, and redelivery), nothing else changed. Recovery conditions range from prompt tweaks (`aware`, `reflect`) to middleware wrappers: transparent `sdk-retry`, `rules` limited to 429/503, `vbr` (verify-before-retry), `wait_Δ` with an assumed in-flight bound, and a **guard** that layers automatic keys / lag re-verification / blocking unverifiable non-idempotent repeats / uncertainty annotations on top of vbr. Reference oracles may read ground truth: a state oracle (current state, no in-flight visibility) and an outcome oracle (sees in-flight requests).[1]

## Regime one: when read-back can resolve, the model decides

Spell out “can resolve.” A timeout is observation-equivalent under three hidden states: never executed (`absent`), executed with a lost response (`committed`), and still in flight (`late`). **Immediate read-back** can separate the first two once effects are visible: skip if present, re-issue if confirmed absent. Partial batches require filling only missing rows. Misleading 500s look like failure while the ledger may already show success.[1]

On faults where immediate read-back reveals the outcome—lost ACK (`timeout_post`), misleading 500, partial batch—frontier models almost never duplicate. In E1, six frontier models duplicate under `timeout_post` at about **0.5%**; under misleading HTTP 500, about **8%**. The mechanism is plain: after a timeout they overwhelmingly read back before acting. Weaker models (`mai-code-1.1-flash`, `gpt-5.4-mini`) fail even this textbook case—about **18%** duplicates on lost ACK and **47%** on misleading 500.[1]

A Shapley decomposition of explained variance (McFadden pseudo-\(R^2\)) makes the split concrete: on “read-back resolves” faults, the **model explains about 53%** of explained variance and the **contract about 30%** (E1). That is the regime where buying a better model helps—frontier models are nearly exactly-once, weaker models are not. In E3, where every model is frontier-class, model and contract contribute similarly (~**39%** vs **42%**) because frontier models barely differ from one another here.[1]

The “exactly once” instruction is not decoration. E6 removes the closing sentence and raises the duplicate rate on resolvable faults from **12%** to **22%**; weaker models move from **29%** to **51%**, frontier from **4%** to **7%**. Reported rates with the cue are therefore **conservative**: product instructions that never mention exactly-once will look worse.[1]

One counter-intuitive result: **no read-back path can be safer than a path that cannot see lagging effects.** Without a read path, frontier agents escalated to the simulated operator in about **87%** of committed-fault episodes; with a path they verified instead (~**96%** strong / **89%** eventual) and trusted a read that could not see lagging or in-flight effects. Restricting to lost-ACK faults where the agent read before re-issuing, duplicates were **13.4%** on eventually consistent paths versus **0.8%** on strongly consistent ones (\(n=947\)). Looking verifiable is more dangerous than admitting you cannot verify.[1]

## Regime two: when read-back cannot, only the contract does

The same frontier models duplicate in about **56%** of **late-commit** episodes and about **74%** under **redelivery** (at-least-once transport delivering twice). Verification hurts: the read happens while the original is still in flight; an empty result invites a re-issue; then the original lands. Of 297 late-commit episodes with a re-issue within a minute, **69%** duplicated. All 123 agents that waited ≥60s before re-issuing duplicated (**100%**), **99%** on eventually consistent paths—waiting the documented lag from the **error**, not from the unknown commit time. Agents that never re-issued were exactly-once in all but **1%** of 84 episodes. Redelivery surfaces no error; only a key sent in advance prevents it.[1]

In this regime almost all explained variance sits in the contract: **about 81% contract, about 8% model**; in the harness experiment the harness adds **0%** on unresolvable faults and about **3%** on resolvable ones. The preregistered pooled analysis mixes both regimes and therefore attributes most mass to fault stage with only about **9%** to the model—the stratified split shows the model matters only in regime one.[1]

Contract class cuts cleanly. Among frontier models, a keyable write is duplicated in about **1.5%** of committed-fault episodes and an idempotent write in **0.0%**; frontier models attach a key to a keyable write in about **98%** of these episodes without being told to (weaker models about **85%**). Non-idempotent writes duplicate in about **28%** of episodes with a strongly consistent read-back and about **31%** with an eventually consistent path. In the preregistered mixed-effects logistic regression, a non-idempotent write with an eventual or missing read path has about **6.4×** the odds of duplication versus a keyable, idempotent, or strongly verifiable one (95% CrI 5.2–7.9).[1]

## Proof: without an in-flight bound, verification-only is not exactly-once

Proposition 1: for a non-idempotent write without key support that times out at \(t_0\), consider \(W_{\mathsf{absent}}\) (never executes) and \(W_{\mathsf{late}}^{\delta}\) (executes at \(t_0+\delta\)). Any recovery policy \(\pi\) whose actions depend only on observations, if it completes the task in \(W_{\mathsf{absent}}\) with probability one within time \(T\), then for every \(\delta>T+\lambda\) (\(\lambda\) = read-path lag) it produces a duplicate in the late world with probability one.[1]

Figure 1 is the intuition: timeout plus empty read-back cannot distinguish “never wrote” from “still in flight.” Completing the absent world requires a re-issue; the same observation history carries that re-issue into the late world; the original then commits → duplicate.[1]

A known in-flight bound \(\Delta\) restores a verification-only escape—wait until \(t_0+\Delta+\lambda\), then read—but few APIs document such a bound, none of Limbo’s tools do, and a heavy-tailed true delay leaves mass beyond any finite assumed bound. Proposition 2: if a service executes each idempotency key at most once and returns the original outcome for repeats (with interrupted batches resuming), then “re-issue with the same key until acknowledged” is exactly-once in all five outcome states.[1]

E5 prices waiting. Fixed 90s delay: `wait 60s` ~**43%** EOS, `wait 120s` ~**99%**, at ~**3.8** simulated minutes vs ~**2.9** for vanilla. Heavy tails: `wait 5min` ~**67%**, `wait 1h` ~**84%** at ~**49.9** minutes—and a one-hour bound covers only ~**82%** of worlds. **Keys-everywhere + guard** reaches ~**94%** EOS at ~**1.5** minutes; the outcome oracle ~**99%** at ~**19.5** minutes (upper bound for waiting). The abstract’s contrast: even an hour of waiting falls short of offering a key on every write, which cuts duplicates from **28%** to **4%** because agents use keys when they exist.[1]

Keys must also be **stable**. Among 432 late-commit re-issues under keys-everywhere, reusing the original key produced **0%** duplicates; of 56 re-issues whose first attempt carried no key, **68%** duplicated; both cases where the agent minted a new key on retry (e.g. appending `-retry1`) duplicated at **100%**. A harness that pins one key per intent and overwrites any model-supplied key on re-issue removes that failure mode.[1]

## Keys-everywhere: 28% → 4%; a key-attaching guard transfers across harnesses

E2/E2k treat the contract as a causal dial (four models pooled). Native + vanilla: late-commit duplicates about **61%**, redelivery about **74%**. Keys-everywhere + vanilla: agents attach a key in about **98%** of faulted episodes; late-commit falls to about **9%**, redelivery to about **7%**. Keys-everywhere + guard: late-commit about **7%**, redelivery **0%**, EOS about **99%**. The introduction summary: under a counterfactual where every write accepts a key, the duplicate rate falls from **28%** to **4%** with no other change; every remaining duplicate involves a first attempt without a key or a changed key on retry.[1]

Harnesses barely move the needle. In E3, Copilot / Hermes / Codex and the minimal scaffold show native duplicate rates of about **27% / 29% / 30% / 26%**—same profile: almost no duplicates after a lost ACK, many after late commits and redelivery. In the native contract the guard (deployed inside the MCP server) changes little (~28–29%), because what remains cannot be fixed without keys. E3k runs one shared model (`gpt-5.6-sol`) across all four harnesses: under keys-everywhere, vanilla and guard duplicate rates are all **0%**, and keys+guard EOS is **100%**. **The same contract-level mechanism transfers across harnesses without modifying them.** Cost differs sharply: a Codex CLI episode consumed about **153k** tokens versus about **12k** for the minimal scaffold.[1]

Client middleware has a ceiling. Transparent `sdk-retry` cuts EOS from ~**72%** to ~**50%** (duplicates ~**50%**) before the model sees anything. For frontier models that already verify, aware / reflect / vbr / guard help little (`claude-opus-5.5` ~**77%** EOS in both vanilla and guard). The guard can backfire: for `gpt-6-sol` late commits, promising verification shifted the model from escalating (12%→3%) to verify-then-retry (59%→88%), and late-commit duplicates rose **50%→71%**. State oracle ~**80%** EOS; outcome oracle ~**87%**—~**95%** of leftovers are key-less redelivery. Guard still lifts weak models (`mai-code-1.1-flash` ~**59%→76%** EOS) at nearly unchanged tool-call cost.[1]

## Agents do not know when they have duplicated

Of **1,279** E1 episodes that produced at least one duplicate, the agent finished with status `completed` in about **90%** (95% interval 78–96%), and in about **80%** it also listed **no** operation as uncertain. A human reading the final report would have had no reason to check. Agents were not more careful with irreversible writes: after an ambiguous fault they re-issued an irreversible write (email or comment) without checking in about **9.6%** of episodes versus about **6.3%** for reversible ones—difference not significant. Our [tamper-traces](/blog/llm-agents-tamper-own-traces-append-only-audit/) post is about records the agent can rewrite; this is a different distortion—**semantic double-write with a success report**. Both warn against treating agent self-report as authoritative.[1]

## What protocol and harness designers should take away

For **tool and protocol designers**, the cheapest win is a contract that makes repetition harmless. Native Limbo offers keys on only two of eleven non-idempotent writes—already flattering many real APIs. Agents use keys when offered (~98%); they cannot invent missing ones. MCP’s idempotent hint is advisory. Three normative additions follow: a standard key argument on non-idempotent tools, a declared read-back/status for every write, and documented visibility plus in-flight bounds. Without the last, Proposition 1 says verification alone cannot be exactly-once; a lagging read-back that agents trust is worse than no path at all.[1]

For **harness builders**, transparent retries under the model turn every lost ACK into a duplicate. Own the transport: attach keys, pin one key per intent, remember unknown-outcome writes, refuse unverifiable repeats—the evaluated guard is under two hundred lines and needs only the contract. Do not over-promise verification; that made a strong model abandon escalation. Silent key attach, or stating uncertainty without claiming resolution, avoids complacency. Short documented in-flight bounds make wait-then-verify a cheap complement. Harness brand barely mattered; surface uncertainty to users because most duplicate episodes still report success.[1]

For **model developers and evaluators**, frontier models absorbed “timeout ≠ failure” folklore only when read-back can settle the case—and partly because instructions demanded exactly-once. Residuals sit in in-flight requests, stale reads, misleading errors, and honest reporting. When read-back cannot resolve, the correct model move is to **decline to act**: escalate or mark uncertain. Final-state-only benches miss compensated duplicates; observation-equivalent pairs plus an effect ledger make them visible.[1]

## How this sits with earlier site posts

[Control the Harness, Control the Cost](/blog/control-the-harness-control-the-cost/) puts spend sovereignty in harness defaults. Here, for side effects, **swapping harness skins barely changes duplicates; keys in the contract (and who attaches them) move the needle.** Cost control owns the harness; double-write control owns the tool interface first.

[Grow the Harness](/blog/grow-the-harness-not-the-context/) and [ECC](/blog/ecc-agent-harness-optimization/) grow control into peripheral code. Limbo’s contract-driven guard (under two hundred lines) is that periphery—attach keys, re-verify after lag, block unverifiable repeats—without over-promising that verification solves late commits.

[Strands](/blog/strands-harness-sdk-production-agent-runtime/) productizes loops and tool gates. Default transparent retries of non-idempotent writes land in the paper’s `sdk-retry` cell (EOS roughly halved). Ship intent-pinned keys and refusal of unverifiable repeats as control-plane defaults, not invisible HTTP retries.

[Tamper traces](/blog/llm-agents-tamper-own-traces-append-only-audit/) moves audit raw materials outside the agent host. This paper moves side-effect authority outside “how the model feels”: service ledgers, contract keys, uncertainty in the report—not `completed`. Same rule: **the party under review is not the referee.**

## Practical checklist (priority order)

1. **Expose idempotency keys on every non-idempotent write.** Same params replay; different params reject. Agents use keys (~98%); without them, models cannot stop late commits or redelivery.[1]
2. **Harness / MCP attaches and pins keys.** One key per intent; overwrite model-minted keys on retry; block unverifiable non-idempotent repeats and escalate—do not claim “already verified.” Guard in MCP transfers across Copilot / Hermes / Codex.[1]
3. **Verify-then-retry is not a late-commit complete fix.** No in-flight bound ⇒ Proposition 1; under heavy tails, an hour of waiting still loses to keys-everywhere.[1]
4. **Honest read-back paths.** Document lag and in-flight visibility; trusting eventual consistency as strong is worse than no path. Prefer status/list per write.[1]
5. **No transparent client retries on non-idempotent writes.** `sdk-retry` turns lost ACKs into duplicates; auto-retry only clear 429/503 (`rules`).[1]
6. **Distrust end-of-episode “success.”** ~90% of duplicate episodes still report `completed`; force uncertain ops or reconcile a service ledger.[1]
7. **Say “exactly once” in instructions.** Cue ablation raises resolvable and late-commit duplicates; it cannot save key-less redelivery.[1]
8. **Evaluate with observation-equivalent pairs + effect ledger.** Final-state-only grading misses compensated duplicates; Limbo’s design is a measurement checklist.[1]

## Limitations (as the paper states them)

Services are simulated, though semantics follow documented production conventions and faults fire at the boundary rather than in the prompt. Models were reached through one gateway at provider-default sampling; only three harnesses were evaluated and restricted to the sandbox’s tools with a shared preamble. The heavy-tailed delay is a modelling choice—the qualitative E5 conclusion (any finite wait leaves a tail) holds for unbounded distributions, but specific rates depend on shape. Tasks are short to medium; `gpt-4.1` covers only about 87% of the E1 design due to quota and is excluded from pooled stats. Several stratified analyses and E2k/E3k/E5/E6 were added after preregistration and are exploratory. The guard is a deliberately simple baseline, not an optimal policy.[1]

## Closing

Exactly-once is not one knob. **Where immediate read-back can reveal the outcome, it lives in the model**—frontier models almost never duplicate a lost ACK; weaker models often do; an explicit instruction helps. **Where it cannot—in-flight or redelivered writes—it lives in the tool contract**—reasoning cannot finish a key-less write exactly once; waiting for an unknown bound is costly and incomplete; client middleware is capped by the contract. Keys on every write (which agents use) plus harnesses that attach and pin them close most of the remaining gap. Agents rarely report the duplicates they cause.[1]

This site keeps putting the control plane in the harness—cost, context, loop, audit. This paper nails one layer further: the **side-effect interface contract**. Models verify and report; harnesses attach, pin, and refuse without over-promising; what makes repetition harmless is still the key distributed systems put on the interface decades ago.

## References

[1] *Where Does Exactly-Once Live? Model, Harness, and Tool-Contract Effects on Duplicate Side Effects in LLM Agents*. arXiv:2609.29095. <https://arxiv.org/abs/2609.29095> · HTML: <https://arxiv.org/html/2609.29095>
