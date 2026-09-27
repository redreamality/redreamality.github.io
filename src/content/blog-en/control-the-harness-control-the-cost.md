---
title: "Control the Harness, Control the Cost: Enterprise Coding-Agent Routing and Governance"
description: "A deep read of Accenture arXiv:2609.28919—enterprise coding-agent bills are often blamed on “expensive models,” but the paper moves the blame to harness defaults; cache-safe routing with Jev recovers about 14–21% of model spend in a 10k-seat emulation, with a sovereignty ladder from observe to own."
pubDate: 2026-09-27T10:40:00+08:00
author: "Remy"
tags: ["agent-harness", "jev", "ai-agents", "developer-tools", "agent-loop", "LLM"]
lang: "en"
---

Enterprise coding-agent bills usually start as a fight over the price sheet: which tier is expensive, what the contract discount is, how monthly active seats are counted. Abbasi, Aqrawi, and Kwartler at Accenture Responsible AI, in [arXiv:2609.28919](https://arxiv.org/abs/2609.28919) (preprint dated 24 September 2026; [HTML](https://arxiv.org/html/2609.28919)), move the blame one layer down. **The price sheet lists rates; the harness decides which rate applies and how many tokens are bought at it**—which model answers, what the model reads, how the prompt cache is used, which subagents run. Buy Claude Code or Codex as a product, leave it on vendor defaults, and you inherit those choices and their bill.[1]

In an emulated **10,000-seat** enterprise, at Anthropic’s **21 September 2026** list prices, cache-safe routing recovers about **14–21%** of model spend—roughly **\$3.3M–\$5.0M a year** against an as-is bill of about \$23.7M a year. The abstract and the results section agree on the band; figures below keep their conditions and do not invent contract discounts.[1]

In-site companions already cover [growing the harness instead of stuffing context](/blog/grow-the-harness-not-the-context/), [ECC as a peripheral OS](/blog/ecc-agent-harness-optimization/), [Strands as a production runtime](/blog/strands-harness-sdk-production-agent-runtime/), and [wiring Jev into Claude Code](/blog/jev-claude-code-10x-and-25-lines/). Those pieces talk about sinking control into code, the config surface, the SDK-level loop, and Jev as a decision head. This post is about **routing and cost governance**: Jev is still the classifier, but the question is how to move work on **cache boundaries**, and how an enterprise climbs from observation to control-plane sovereignty. Note: [Jev as rubric judge](/blog/jev-rubric-judges-cheaper-faster-correlated-errors/) is about correlated evaluation errors and cascades—**not** session routing; keep the angles separate. SpecHarness / OpenSpec is “spec holds the pen”; this piece is “harness holds the purse”—one sentence is enough.[2]

## Mis-attributed bills: after the price-sheet fight, defaults still burn money

A harness holds a conversation with a model on the user’s behalf. A user message starts a turn; the model may call tools; the harness runs them and feeds results back; the model continues. **A turn with \(k\) tool steps is \(k{+}1\) API requests, each carrying the whole conversation so far.** An eighteen-tool-step turn re-sends the same context nineteen times. Vendors discount re-sent context that shares an exact prefix with a recent request to the **same** model—the prompt cache—but the cache is model-scoped: switching models forces a cold rewrite. If procurement only negotiates unit price and never asks who chooses the model, who sets cache TTL, or whether subagents inherit the parent’s model, the bill grows inside the defaults.[1]

The paper compresses the risks of buying a third-party harness into four items (§3, with a coupling matrix over twenty harnesses in Table 8):

1. **Coupling** to one vendor’s prices and limits; Claude Code’s docs state that routing to non-Claude models through a gateway is unsupported.
2. **Unauditable behaviour** under closed harness code—what is sent, how prompts change between versions, how retries and subagents behave.
3. **A non-portable control plane**: MCP, AGENTS.md, and Agent Skills travel across products; model policy, telemetry semantics, subagent behaviour, and billing do not.
4. **Skill amplification**: on the same harness, novice-rated sessions reach verified success about half as often and abandon more; static repo instruction files do not close the gap, while harness configuration reaches every user at zero marginal cost.

All four sit in the layer between the user and the model vendor. Cost is simply the risk with a price tag first.

Coupling is graded: Claude Code documents Claude-only models even behind a gateway; Codex, OpenCode, Goose, Cline, and most open Chinese-vendor harnesses accept an enterprise endpoint—**model coupling is a design choice, not destiny** (§2.2 / Table 8). Opacity compounds coupling; control-plane fragmentation looks ordinary—two harnesses, two skill/MCP/policy stacks, telemetry that never lines up. On skill: Anthropic’s ~400k-session analysis has novice verified success about 15% and abandon about 19% versus about 28–33% / 5–7% for intermediate and above—same spend, roughly half the verified wins. **Training scales with headcount; harness configuration reaches everyone at zero marginal cost.**[1]

## How harness defaults burn money: turns, caches, crossover pricing

### Price the turn, not the request

Chat routers usually estimate difficulty per request and treat each placement as nearly free. Inside an agent harness that is false: the request carries a **cached conversation**. Write \(C\) for the conversation prefix, \(D\) for new tokens in the turn, \(k\) for tool steps; a warm turn reads roughly \((k{+}1)C + Dk/2\) and writes about \(D\). Moving the turn to another model turns those reads into a cold write at the write premium; if the user continues on the original model, there is a second cold write. **A mid-task switch must earn back its cache writes.**[1]

From the price sheet the authors derive a payback request count (§4.2, Eq. 1). On Anthropic’s 21 September 2026 sheet: Fable 5.1→Sonnet 5 needs about **291** requests with return and **46** without; Opus 5→Sonnet 5 about **27** and **8**. Naive per-request switching, once misroutes are charged as correction chains, often costs more than pinning. GitHub Copilot’s docs make the same operational point: route along natural cache boundaries; mid-session switches have raised cost.[1]

### On long sessions, the dearest list tier can be cheaper

Long agentic sessions are dominated by cache reads, and vendors price those per model. On the same sheet, Fable 5.1 reads cached context at about **\$0.25** per million tokens versus **\$0.50** for Opus 5, even though Fable’s input/output list prices are double. With eighteen tool steps per turn, Fable undercuts Opus above roughly **65k** tokens of context; with six steps, above about **211k** (Table 2). A router that ranks by list price gets long sessions exactly wrong.[1]

Repricing about **10,000** real Claude Code sessions from TraceLab and SWE-chat token-for-token: among sessions that cost \$100 or more on Opus, **51% (TraceLab) / 80% (SWE-chat)** are cheaper on Fable. The top 1% of sessions carry about 31–53% of spend. In the case study, **about three quarters of the saving comes from this crossover**—not from “always downgrade to a small model.”[1]

### Pauses and the five-minute cache

API cache lifetime is often **five minutes**. In the two public corpora, **17–27%** of user turns follow a pause longer than five minutes and pay to rewrite the whole conversation (often at the higher write price). Without such pauses the saving would be about **24%**; with TraceLab’s more pause-heavy users, about **7%**; a **one-hour** cache lifts the saving to about **17%** against today’s bill (Table 4). A sharp classifier cannot offset an expired cache that turns every return into a full cold write.[1]

**Reasoning effort** is a second dial (§4.7): on bounded work lower effort often saves; on long-horizon work higher effort can cut total calls and cost. Most models give each effort level its own cache—change it mid-conversation and you pay like a model switch. Route at turn boundaries; the case-study headline does not depend on this lever (§8).[1]

Cold returns: for 10,000 returns to 300k context on Opus (5-minute cache), full re-send ~\$18,750; prune to 30k ~\$1,875 (−90%); Sonnet summary about halves the return versus Opus summary that can cost more than re-send (Table 6). Chat roles: prune/summarize cheaply and new-conversation per deliverable. Engineering: keep in-task reasoning, batch-clear stale tool results, compact at boundaries. Org-managed settings should outrank personal defaults.[1]

## Method: cache-safe routing + Jev calibrated probabilities + move only when sure

### Three seams that do not touch running work

The arithmetic yields a short rule set (§4.4). The core: **move work only where no running conversation has to rebuild its cache.**

- **Session start**: choose the model while the session is small; never rewrite a running conversation’s model.
- **Side lanes**: run bounded side requests in a separate conversation seeded with a compact project ledger, not the transcript; after return, refresh the home cache with one empty request; append the result as a note; never edit earlier turns.
- **Subagent launch**: a subagent is a fresh conversation, so choosing its model is free in cache terms; short conversations are write-heavy, where the top model is dearest. At least seven of twenty surveyed harnesses document that subagents inherit the parent’s model by default—Claude Code can rewrite launch arguments (including model) in a pre-tool hook.[1]

Worked example: a one-line change inside an 805k-token session costs about **\$0.88** in place on Fable and about **\$0.36** in a ledger side lane on Sonnet (ledger and home refresh included). Five typical subagents cost about **\$4.88** when they inherit Fable and about **\$1.27** on Sonnet at launch.[1]

Hard rule: **never move a correction below the tier of the turn it corrects** (R10). Corrections are more than a third of the bill; a task given to too weak a model triggers more.[1]

### Bring-your-own taxonomy; Jev labels in under half a second

Routing needs labels. The paper uses a bring-your-own four-axis taxonomy (Appendix A): action (thirteen verbs from lookup to build/steer), domain (twelve), ordinal complexity (trivial→expert), context dependence (none→history), plus stakes and output-shape modifiers. Domain sets governance floors (legal/finance/HR and agentic edits never below mid tier). **There is deliberately no productivity axis**—per-person monitoring sits under high-risk provisions of the EU AI Act and German works-council co-determination; telemetry reports aggregates only.[1]

The classifier is TypeSafe’s **Jev** (System One): calibrated probabilities over fixed options, no free-text generation; the vendor reports about 70–500 ms end to end. The policy acts only when both “needed tier ≤ candidate” and “does not depend on history” clear a threshold (**0.8** in the base case); otherwise it holds—forgoing saving, not gambling quality. Measured accuracies: action / domain / complexity / history about **74% / 80% / 63% / 82%**; false downgrades among moved turns about **12.5%**; holds among routable turns about **42%**. Complexity is the blurriest axis and drives most holds—the fix is sharper taxonomy definitions and thresholds, not a larger chat model as router.[1]

The interface is classifier-agnostic on purpose: a self-hosted encoder or a purpose-built router such as Arch-Router can plug in; Jev’s weights are unpublished and not offered for self-hosting, so restricted contexts use the self-hosted fallback. In-site [Jev × Claude Code](/blog/jev-claude-code-10x-and-25-lines/) already warned against treating Jev as a chat base URL; here the same constraint shows up on an enterprise gateway: Jev only labels; generation stays on the session model.[3]

Eight components (§4.8): gateway/hooks; classifier adapter; BYO taxonomy/policy; session state; execution modes (session start, detached, side lane, subagent launch, gated rebase); counterfactual accounting by unit not person; user-visible model + pin; governance floors with no productivity axis. Prototype covers the decision engine and simulator; enforcement and user UI are specified, not built—do not read “emulated saving” as “gateway in production.”[1]

### Emulation: tagged scenarios × measured behaviour × population scale

Enterprises need a cost case before telemetry exists. Method (§4.9): 46 conversations, 109 authored turns, eleven job types; each conversation expanded into 200 Monte Carlo variants perturbed with behaviour from about 10,000 real TraceLab / SWE-chat sessions (correction chains, pauses, subagent rates, turn lengths); a live classifier; a cache-exact simulator priced from list prices and vendor cache rules; misroutes charged as the correction chains users actually run. Scaled to fourteen population segments, about thirty sessions per seat per month; engineers as-is about **\$40** per active day (between TraceLab heavy-user median \$15 and mean \$58). **This is an emulation, not Accenture’s internal bill**—the paper’s disclaimer is explicit.[1]

## Numbers and boundaries: where 14–21% comes from, and when it collapses

### Base case

| Quantity | Value (paper Table 3 / §5) |
| --- | --- |
| As-is | \$1.97M / month, \$23.7M / year (10k seats) |
| Routed, today’s labels | \$1.70M / month (−13.8%) |
| Routed, perfect labels | \$1.56M / month (−21.1%) |
| Annual saving band | \$3.3M–\$5.0M |

Engineering carries about **86%** of the bill and saves about 13–14%; small non-engineering bills save 6–35%. Saving structure (today’s labels, monthly): about **\$211k** from crossover session choice, **\$64k** from side lanes, **\$32k** from subagent launch routing, **\$28k** from right-sizing at session start, minus about **\$51k** misroute corrections and **\$18k** router overhead (classifier calls themselves about \$179 / month). Fable takes about **86%** of routed model spend but starts only about a fifth of sessions—the money is in long builds.[1]

### Sensitivities that move the knife most

Table 4, one assumption at a time:

- **No Fable licence** (capped at Opus): saving falls to about **2.3%**—the crossover lever disappears.
- **Uniform 0.1× cache reads** (no Fable discount): about **5%**.
- **Pauses**: as above, roughly 24% ↔ 7%.
- **Agentic intensity ×0.5 / ×2**: about **1.6% / 24%**—heavier tools and warmer caches make the router earn more.
- **Threshold 0.7 / 0.9**: about 9.8% / 14.2%; lowering the threshold moves more turns but false-downgrade chains can eat the gain. Base keeps 0.8 to avoid tuning on the test set.

Cross-vendor (§5.5): on harnesses that accept the enterprise’s own endpoint, repricing the same real sessions puts strong models of other vendors at about **0.12–0.80×** Opus when cache discounts apply; Claude Code can only route inside the Claude family. Examples at ~23 September 2026 list prices include DeepSeek V4 Pro (peak) ~0.12–0.14×, Kimi K2.6 ~0.25–0.27×, Gemini 3.1 Pro ~0.39–0.64×, GPT-5.6 Sol ~0.80×. Light-only multi-vendor adds ≤~2.3 points; strong models on complex work at session start (cache-priced) can add ~10–55 points atop 14%—ceilings under equal quality/tokens and allowed data terms, not promises.[1]

Dollars scale roughly with seats (50k seats ≈ \$16.4M/year at today’s labels); raising power-user share lifts dollars while the **rate can stay ~13.8%**. Small orgs: savings grow with seats, build cost does not—standard routers may remove that threshold (§5.1 / §8).[1]

### Limits that belong in any decision memo (§8)

- Synthetic scenarios, author-only tags; the complexity axis is still soft, with no inter-rater agreement yet.
- Engineering scenarios overweight long sessions and high cache hit rates, favouring the crossover; a TraceLab-shaped mix would bring the 14% toward about **8%**.
- \$40 per active day is above the vendor’s publicly reported average of about \$13; at \$13 the annual bill is about \$10M and the saving about \$1.3–2.1M, with **percentages largely intact**.
- List prices, no contract discounts; when price structure changes, percentages move—what transfers is the method of **repricing your own sessions at today’s prices**.
- Decision engine and simulator are implemented; the gateway/hook enforcement point and the user’s view of routing are **specified but not built**—the case study runs in the simulator.
- The perfect-label 21% is a ceiling: real capability is a probability, not a step function.

## A sovereignty ladder enterprises can climb: observe → own (on purpose)

Table 7 orders the options. The reusable checklist below runs from “this quarter” to “a one-to-two-year product decision.”

### Rung 0: Vendor defaults

Nothing to run. Inherit every risk in §3 and the highest bill. Most pilots sit here.

### Rung 1: Configured (ship one short bundle first)

Keep the product; ship a **short configuration bundle** (§6.1, ten items in payoff order):

1. Model policy: session-start rule, subagent default, domain/data floors, user pin.
2. Skills as procedures: deploy/review/naming/data rules loaded on demand (Agent Skills can keep only a description in context until used).
3. MCP connectors scoped by role—no more.
4. Hooks: tests and review before a task may complete, cache-marker checks on the gateway, subagent launch rule.
5. Permissions and data classes: which tools may run unattended; which data never leaves for which model.
6. Routing taxonomy tagged by the function that uses it, with thresholds.
7. Project ledger format for seeding side lanes and subagents.
8. Telemetry export and **aggregate-only** reporting wired to counterfactual accounting.
9. One short instruction file: procedures and constraints, not a repository encyclopedia.
10. Context defaults by role: when to clear old reasoning and tool results, when to compact, when to start a new conversation.

The authors measured a power-user always-loaded prefix of about **55k** tokens (system prompt + tool/MCP schemas + skill descriptions + community-plugin custom agents, etc.). Relative to a lean 15k default, a ten-turn × eighteen-tool-step session can cost about **three to four times** more; eagerly loading ~104k of deferred tool schemas would push that past **ten times** (Table 5). **Deferred loading is a cost lever in its own right.**[1]

### Rung 2: Controlled (control plane, this quarter)

Put a gateway between every harness and its model endpoint. Verify it **forwards cache markers and beta headers unchanged**—stripping them bills the whole conversation as uncached input every turn. Route at session start; fleet-default subagents today, per-launch routing tomorrow; turn on the one-hour cache (often the cheapest default change versus a five-minute API cache); run a two-hour tagging workshop per function; report aggregates only. The paper maps this rung to the case study’s **14–21%** band—still subject to the sensitivities above. Cost: a small platform team, classifier hosting, legal/works-council review of the policy.[1]

Policy asymmetry: **wrong moves cost quality; holds cost only money.** Of ~\$144k/month between today’s and perfect labels, ~2/3 are holds, ~1/3 misroute chains. Threshold 0.5 vs 0.8: more moves, ~1/5 false downgrades, saving can fall to ~10%—“move more” is not better here.[1]

Seven vendor questions (§6.2) for procurement: Does the harness forward cache markers through a gateway? Can it call an endpoint we operate? Can we set and enforce subagent models? Does it export token telemetry by type? What is each model’s data retention? Can we pin a harness version and read its prompts? Which instruction, skill, and connector formats does it read, and are they the open ones?

Change the metric to **cost per verified task and its spread across teams and harness configurations (in aggregate)**—not tokens per user.[1]

### Rung 3: Owned (whether to own the harness)

Build an internal harness on a vendor SDK or open-source base: pluggable models, native lanes, one bundle for everyone, access to other vendors’ strong models. Right for regulated workloads that fit no vendor’s retention terms, for serving your own models, or when volume makes a product team cheaper than the dependency. Wrong as a default—vendors ship weekly; an open-source base moves the dependency to maintainers. **Decide on purpose after rung 2 has produced numbers**, not by defaulting to “we should build.”[1]

One in-site contrast: [SpecHarness / spec holds the pen](/blog/specharness-spec-holds-the-pen/) answers what counts as done; this ladder answers who sets rates and token volume. Two control planes; do not substitute one for the other.

## In-site map: same harness line, different knobs

| In-site post | Knob | Relation to this piece |
| --- | --- | --- |
| [Grow the Harness](/blog/grow-the-harness-not-the-context/) | Grow repeated control into code | This post does not grow programs; it prices **rates and cache boundaries on products you already buy** |
| [ECC](/blog/ecc-agent-harness-optimization/) | Skills / hooks / memory / security periphery | The rung-1 bundle maps cleanly onto ECC’s peripheral OS |
| [Strands](/blog/strands-harness-sdk-production-agent-runtime/) | Production runtime and SDK layer | One base option at rung 3; not the object of this emulation |
| [Jev × Claude Code](/blog/jev-claude-code-10x-and-25-lines/) | Jev as decision head | Same head, wired into an **enterprise gateway routing policy** |
| [Jev Rubric Judges](/blog/jev-rubric-judges-cheaper-faster-correlated-errors/) | Cheap evaluation and correlated errors | **Different angle**: judge cascades there; session/subagent cost routing here |
| [JevOut](/blog/jevout-natural-context-flips-decision-models/) (optional) | Short context can flip decisions | Reminder: routing classifiers also eat context shape; thresholds and holds are not decoration |
| [SpecHarness](/blog/specharness-spec-holds-the-pen/) | Spec holds the pen | Spec defines completion; harness controls money and which models are reachable |

## Closing

An enterprise AI bill is priced in two places: the model’s price sheet and the harness. Negotiate only the former and you leave the latter—and most of the volume—to vendor defaults. This Accenture paper reduces in-harness routing to **cache arithmetic**: mid-task switches must pay back; on long tool-heavy sessions the top tier can be cheaper because of cheaper cache reads; pauses and TTL move saving as much as the classifier; corrections dominate the bill, so move only on high calibrated confidence and never downgrade a correction. The emulated 10k-seat, list-price **14–21%** is a conditional band, not a procurement slogan—it collapses when the crossover disappears, pauses dominate, or sessions stay short.

The action order is short: measure aggregate tokens and session shape → ship the short bundle and a one-hour cache → gateway + session-start / subagent-launch routing + a bring-your-own taxonomy → read pin-vs-route counterfactuals → then decide whether to climb to Owned. Control the harness, and you control the cost; the control plane can grow from within before you own the whole product.

## References

[1] Arian Abbasi, Alan Aqrawi, Ted Kwartler. *Control the Harness, Control the Cost: Routing and Governing AI Coding Agents in the Enterprise*. arXiv:2609.28919, 24 September 2026. [abs](https://arxiv.org/abs/2609.28919) · [html](https://arxiv.org/html/2609.28919). Spend, populations, and savings in the paper come from public list prices, public session corpora, the authors’ own sessions, and an emulated enterprise; **they do not represent Accenture’s internal figures** (paper Disclaimer).

[2] In-site companions: [/blog/grow-the-harness-not-the-context/](/blog/grow-the-harness-not-the-context/), [/blog/ecc-agent-harness-optimization/](/blog/ecc-agent-harness-optimization/), [/blog/strands-harness-sdk-production-agent-runtime/](/blog/strands-harness-sdk-production-agent-runtime/), [/blog/jev-claude-code-10x-and-25-lines/](/blog/jev-claude-code-10x-and-25-lines/), [/blog/jev-rubric-judges-cheaper-faster-correlated-errors/](/blog/jev-rubric-judges-cheaper-faster-correlated-errors/), [/blog/specharness-spec-holds-the-pen/](/blog/specharness-spec-holds-the-pen/).

[3] TypeSafe AI. *Introducing System One Models and Jev* (paper [39]); in-site wiring notes in [jev-claude-code-10x-and-25-lines](/blog/jev-claude-code-10x-and-25-lines/).
