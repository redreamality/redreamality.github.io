---
title: "Claude Sonnet 5.5: Choosing a Mid-Tier Engine for Daily Agentic Coding"
description: "Anthropic shipped Claude Sonnet 5.5 on 2026-09-28: same list price as Sonnet 5, fewer tokens per task, 30%+ faster output, and 70.6% on Terminal-Bench 4.0. A model×harness guide to whether coding-agent defaults should downshift from Opus-class flagships."
pubDate: 2026-10-09T10:40:00+08:00
author: "Remy"
tags: ["llm", "ai-agents", "developer-tools"]
lang: "en"
translatedFrom: "claude-sonnet-5-5-agentic-coding-midtier"
---

For the past year many teams pinned coding-agent defaults on Opus-class flagships: they feared mid-tier models would fall over on multi-file edits and long sessions, so they paid the higher unit price. On 28 September 2026 Anthropic released **Claude Sonnet 5.5**, the second model in the Claude 5.5 family.[1] The official positioning is blunt: it is a faster, lower-cost complement to Opus 5.5. Opus is built for complex, open-ended work that needs sustained judgment; Sonnet 5.5 is strongest on well-scoped everyday tasks, bug fixes, and polished documents, slides, and spreadsheets. List prices match Sonnet 5, but the model typically needs far fewer tokens for the same work and generates output **30%+** faster than Sonnet 5.[1]

This is not a launch blurb. The on-site sister post [Claude Opus 5.5: price and performance](/blog/claude-opus-5-5-price-and-performance/) asks whether you should switch the **flagship** default to Opus.[2] This article asks the other side: **for daily agentic coding load, should the harness default downshift from Opus to mid-tier Sonnet 5.5?** The answer is not one leaderboard line. It is **model × harness**—the same model under different effort, tool surface, and acceptance gates can differ by an order of magnitude in cost-per-finished-task and wall time. Numbers prefer Anthropic’s page; community bakeoffs are labeled with limits.

## What Anthropic actually published: same price, faster, fewer tokens, a jump in agentic coding

Sonnet 5.5 API list prices align with Sonnet 5:[1]

| Per 1M tokens | Claude Sonnet 5.5 | Claude Opus 5.5 |
| --- | ---: | ---: |
| Cache reads | $0.20 | $0.20 |
| Cache writes | $2.50 | $5 |
| Input | $2 | $4 |
| Output | $10 | $20 |

Versus Opus, input/output are about half; cache reads match. Anthropic stresses that list price did not fall, but cost-to-finish often does: in their tests, up to about **30%** less per task than Sonnet 5, with output **30%+** faster.[1] For agent bills that is different from “we cut the sticker price.” Track **dollars and minutes per successful merge / per passed gate**, not dollars per million tokens alone.

The headline agentic-coding number is **Terminal-Bench 4.0**: **Sonnet 5.5 at 70.6%** versus **Sonnet 5 at 10.3%**; the same table lists Opus 5.5 at **66.4%** (footnote: Opus at Xhigh effort for its highest score).[1] That is not “Sonnet beats Opus everywhere.” Anthropic writes that on several evals Sonnet 5.5 at Max can land near Opus 5.5, but on complex, open-ended work needing sustained judgment Opus 5.5 remains clearly stronger.[1] Terminal-Bench measures multi-step professional work in a CLI; scores move with effort and harness—read the footnotes with the table.

Other agentic / knowledge-work slices from the same page (excerpt; full footnotes on the official page):[1]

| Eval | Sonnet 5.5 | Sonnet 5 | Opus 5.5 |
| --- | ---: | ---: | ---: |
| Terminal-Bench 4.0 | 70.6% | 10.3% | 66.4%¹ |
| FrontierCode 1.1 Main | 46.2% Max / 52.1% Xhigh | 42.4% | 54.4% |
| CursorBench 4.0 | 55.5% | 34.1% | 57.8% |
| GDPval-AA v2.1 | 1844 | 1449 | 1846 |

Two selection points matter:

1. **Effort is not monotone.** Anthropic’s footnote: on FrontierCode, Sonnet 5.5 scores lower at Max than at Xhigh—at Max it more often spun Claude Code’s multi-subagent code-review skill; in cases Cognition examined, that led to timeouts or out-of-scope edits and therefore lower “merge without human edits” scores.[1] Same failure mode the Opus post warned about: cranking effort does not always raise the score that matters.[2]
2. **Low-effort cost curves.** Anthropic’s accuracy-vs-cost charts say that on several benchmarks Sonnet 5.5 at Low or Medium beats Sonnet 5’s best score for about a tenth of the cost per task; it complements Opus 5.5 best at **lower** effort settings, where cost per task is lower; at higher settings scores can look comparable at similar cost.[1] Claude apps often default to Medium; the Claude Platform often defaults to High—same model, different bill shape.[1]

The model id is `claude-sonnet-5-5`, live on the Claude Platform plus AWS, Google Cloud, and Microsoft Azure. If you ran Sonnet with thinking off, switch to the new `between_tools` setting before migrating.[1]

### Early-tester signals and a cost back-of-envelope

Anthropic’s early-tester quotes cluster into checks you can log yourself: quality bars near a higher tier with fewer steps (Epic; CursorBench 55.5% within ~2 points of Opus); fewer build iterations and failed tool calls on real app suites; better judgment and less noisy web search than Sonnet 5.[1] Treat them as hypotheses for your fields—not budget constants. Same discipline as the Opus post’s unreproducible migration anecdotes.[2]

For bills, pull ~20 completed tasks and separate **list-price effect** (reprice at Sonnet stickers with usage held fixed) from **efficiency effect** (assume 15%–30% fewer non-cached tokens—direction from Anthropic, not a guarantee).[1] Book policy fallbacks to Sonnet 5 and human upgrades to Opus separately. If the optimistic band is still not cheap, fix harness thrash before blaming the mid-tier model.[3][6]

## How this divides labor with the Opus pricing post

Treat [Opus 5.5 price and performance](/blog/claude-opus-5-5-price-and-performance/) as a sibling, not a duplicate.[2]

| Question | Opus post | This post |
| --- | --- | --- |
| Should the flagship be default? | Run real tasks on completion, rework, dollars; decide on `claude-opus-5-5` | Should daily agentic coding put most traffic on Sonnet 5.5? |
| How to read prices? | Opus vs Opus 5 stickers and ~40% task-cost narrative | Half-price vs Opus + “same sticker, fewer tokens” vs Sonnet 5 |
| Safeguards | Flagship-tier bio/cyber fallbacks and verification programs | Sonnet 5.5 is the first Sonnet to ship cyber safeguards/fallbacks like the flagships (cyber capability comparable to Opus 5); biology safeguards match Sonnet 5[1] |
| Decision shape | “Switch flagship default?” | “Model×harness: mid-tier default, escalate hard cases” |

One line: **the Opus post asks whether the flagship is worth buying; this post asks whether the daily engine should downshift from the flagship.** Both can be true—many teams end up with dual defaults: interactive hard judgment on Opus, batched bugfix / well-spec’d frontend / hard-oracle implementation on Sonnet.

Subscription and quota mechanics live in [Claude Code usage limits (2026)](/blog/claude-code-usage-limits-cost-2026/): five-hour windows, weekly caps, wind-down on hit, whether `claude -p` hits subscription or API, Haiku as subagent—this article does not rehash the meters.[3] Routing choices feed those meters: moving the default from Opus to Sonnet often fits more rounds in the same window; Max effort and a noisy tool surface can still burn the weekly cap.

## Community bakeoffs: verified independent tests, clearly labeled single-task reports

Beyond official tables and your traces, independent runs help calibrate “half price ≠ half bill.” Neither class below is an Anthropic benchmark.

### The New Stack: three tasks × five repeats (independent author test)

Jessica Wachtel at The New Stack called both models through the Anthropic API with identical prompts, adaptive thinking, and maximum effort; five runs each; graded against hidden suites the models never saw; logged tokens, list-price cost, and time.[4] Tasks: agentic bug fix with tools; write a dependency resolver from a two-page spec (no code execution); fix asyncio races from an incident report (no code execution). Headline results from her table:[4]

- **Perfect runs:** Sonnet 5.5 15/15; Opus 5.5 13/15 (both misses on the concurrency task).
- **Total cost:** Sonnet about **$12.69** vs Opus about **$22.07** (~42% cheaper); counting four Sonnet redos after hitting a per-step output cap, about **$14.09** (~36% cheaper).
- **By task:** Opus won the agentic bug-fix on speed (~3:21 vs ~5:08); Sonnet hit a 32k per-step output limit in four of five first attempts—raising the limit to 128k made those runs pass. Sonnet won resolver and concurrency on cost and reliability.
- **Author takeaway:** use Sonnet 5.5 as default for hard coding work (and set output limits high—it thinks longer per step); for **agent loops**, she still prefers Opus—about 35% faster on the agentic task, and cheaper once Sonnet’s failed attempts are counted.[4]

That is model×harness in miniature: the same models reverse winners under “long think in one step” versus “multi-turn tool loop.” She also cites Artificial Analysis finding Sonnet *more* expensive per task than Opus at max effort (about $7.67 vs $5.98)—the opposite of her suite. Task shape and effort settings rewrite the half-price story; do not budget a year from one chart.[4]

### Community single-task: from-scratch Rust DEFLATE (aggregator; not primary)

An aggregator summarizes a Reddit user’s bakeoff: models write a dependency-free Rust DEFLATE/zlib decompressor, graded blind against **4,055** hidden zlib tests; Sonnet 5.5 and Opus 5.5 reportedly both passed; Sonnet about **3m41s / $0.52**, Opus about **10m18s / $2.08**, with the caveats that it is one data point and Opus may still lead on open-ended debugging.[5] **This draft could not fetch the original Reddit thread**, so treat the dollars as second-hand community signal only—not a hard routing rule. Same-prompt frontend UI bakeoffs without a fetchable original are omitted rather than invented.

Community reading rules: label **n**, blinding, effort, output caps, and whether failures enter the cost; one repo, one task, author-chosen prompts all extrapolate optimistically to your monorepo.

## Three daily scenarios: route, don’t pick a tribe

### A — Well-specified frontend / UI

Anthropic puts design sense and UI polish in Sonnet 5.5’s lane.[1] Ship design tokens, a component inventory, and finished example pages; grade rendered interaction/a11y/visuals, not diff size. Same-prompt frontend Reddit scorecards are omitted without a fetchable original.[5] Route: clear specs → Sonnet Medium; fuzzy visual direction → Opus for one pass, then Sonnet to finish.

### B — Hard-oracle implementation (parsers, protocols, races)

New Stack’s resolver and concurrency tasks sit here: Sonnet was cheaper and perfect when hidden suites decide.[4] Invest in CI/property/differential tests the agent can call before buying another tier; if single-step thinking runs long, raise output caps before escalating (Sonnet hit 32k in that test).[4]

### C — Ambiguous multi-file work and long agent loops

Anthropic leaves open judgment to Opus; New Stack’s agentic bug-fix also favored Opus on speed.[1][4] Split: Opus (or a human) writes acceptance and boundaries → Sonnet implements auto-testable slices → escalate on repeated failure or product-semantic forks. Do not dump checkpoint-free overnight migrations onto mid-tier “to save money.”[3]

## Harness side: downshifting the default is not less periphery

When you move the default from Opus to Sonnet, the bill is often decided by whether the harness still reinvented control every turn.

On-site [Grow the harness, not the context](/blog/grow-the-harness-not-the-context/) argues for growing repeated validation, recovery, and stop conditions into executable code and leaving context for task-specific judgment.[6] That bites harder when mid-tier carries daily traffic—Anthropic and early testers repeatedly mention fewer tool steps, fewer output tokens, and more batched tool calls; if your loop still retries uselessly, thrash context, and rewrite tool descriptions each turn, half list price will not save the weekly cap.[1]

[Pi 1.0’s minimal harness](/blog/pi-1-0-codemode-mcp-minimal-harness/) shows the other lever: Codemode can compose/filter MCP so the model sees compressed results instead of a dump of tool prose.[7] For a “fast iteration, medium complexity” daily engine, **less tool noise + hard acceptance** often beats another model tier. Virtual-model routing (one selection, physical models per request) fits “Sonnet on implement steps, Opus on architecture.”[7]

Do not ignore safeguards: Sonnet 5.5’s cyber capability improved enough that it is the first Sonnet to launch with cyber safeguards and fallbacks similar to the flagships; routine find/fix bugs still work, higher-risk cyber tasks visibly fall back to Sonnet 5.[1] Biology safeguards match Sonnet 5. On Anthropic’s automated behavioral audit it improves on or matches Sonnet 5 on most measures; they still note no eval set catches every failure.[1] Same engineering rule as the Opus post: book “policy fallback” separately from “capability miss.”

### Anti-patterns

Max-as-default can erase mid-tier savings and still miss open-ended judgment.[1] Tight per-step output caps turn long thinks into costly redos.[4] Mid-session `/model` hops flush prompt cache.[3] Do not let occasional Opus “miracle saves” set the KPI for clear-oracle daily work—bucket tasks. Book cyber/biology fallbacks separately from capability misses.[1]

## Selection checklist: when Sonnet is default, when to escalate to Opus

Route by **failure cost** and **boundary clarity**, not brand loyalty.

### Prefer Sonnet 5.5 as default when

1. **Boundaries are clear and acceptance is automated**—explicit bugs, spec implementation, dependency bumps, test-driven small/medium edits. New Stack’s resolver and concurrency tasks sit here.[4]
2. **High-frequency, human-in-the-loop, wall-clock matters**—interactive iteration, frontend against an existing design system, docs/slides/spreadsheets. Anthropic puts fast iteration and design sense in Sonnet’s lane.[1]
3. **Batch / overnight work that can be sliced**—checkpoints and rollback per step. Weekly caps and wind-down tolerate “many steps, clean stops” better than dirty mid-edit crashes.[3]
4. **Cost-sensitive subagents / fan-out**—Opus sets the frame; Sonnet executes. Matches early-tester “Opus architecture, Sonnet implementation.”[1]
5. **Medium effort is already enough**—prove Medium on your traces before raising; Anthropic’s charts show Low/Medium already far above old Sonnet.[1]

### Leave for Opus 5.5 (or raise effort) when

1. **Ambiguous, cross-module, sustained judgment**—unclear product semantics, unsettled contracts, choosing among bad options.[1][2]
2. **Long open debugging without a stable oracle**—no reliable hidden tests; human review is the expensive part. Community single-task notes also leave open debug to the flagship.[5]
3. **High cost of a missed issue**—security-sensitive, financial reconciliation, compliance audits: Opus as primary reviewer, Sonnet for a first pass.
4. **Agent loops where one long think hits output caps**—fix the harness limit before swapping models.[4]
5. **Work that triggers cyber/biology safeguards**—run probes; design how fallback success is booked.[1]

### One-week acceptance script (for the *daily* default)

Goal: decide whether Claude Code / your agent’s **daily default** becomes `claude-sonnet-5-5`, with flagship only as escalation.

1. **Pool:** 10 auto-accepted implement/fix tasks; 6 multi-file but fairly specified; 4 deliberately fuzzy product changes; 2 safety probes (observe fallback, do not chase jailbreaks).
2. **Hold fixed:** same repo snapshot, tools, system prompt, starting effort (prefer Medium); log mid-run upgrades as upgrade events, not baseline.
3. **Arms:** A = Sonnet Medium throughout; B = Opus Medium throughout; C = Sonnet default, escalate to Opus on failure or human `needs-judgment` (production-like routing).
4. **Log:** merge-ready completion, human edit lines, tool calls, cache-read share, dollars, wall time, fallback, output-cap hits.
5. **Pass line (example):** at dollars ≤ 70%–80% of the old default, A matches B on the auto-accepted subset; fuzzy subset allows C near B. Tune to risk.
6. **Attribute failures:** capability / bad spec / policy fallback / harness thrash—fix the last two before blaming the model.[6][7]

### Harness checklist before you change the default

| Check | Why it matters | If you fail |
| --- | --- | --- |
| Auto / semi-auto acceptance exists | Mid-tier harvests clear boundaries | Add test gates or diffs before model bakeoffs |
| Tool descriptions stable across turns | Cache reads are $0.20/M for both tiers | Freeze tool schema and prefixes |
| Batched tool calls allowed | Anthropic cites more batching on Sonnet 5.5 | Parallelize reads/tests; cut round trips |
| Per-step output cap | Avoid long-think wall hits | Raise if New Stack-style failures show up |
| Failures roll back to a clean commit | Caps and wind-down hate dirty stops | Forced checkpoint per subtask |
| Escalation rules in config | Hand `/model` thrash drops cache | Rule: N consecutive fails or `needs-judgment` |
| MCP/tools filterable | Tool noise raises mid-tier fail rate | Codemode / deferred tools style loadouts |

Run the week script after this list; otherwise you cannot tell “model too weak” from “scaffold on fire.”

## Practical changes this week—not another leaderboard paste

1. **Set the daily default to `claude-sonnet-5-5`**, keep one-key escalate to `claude-opus-5-5`; do not globally enable Fast mode / max effort.[1][2]
2. **Lock effort by task type**—Medium for daily, raise only when needed; treat Max as an exception you bookkeep so FrontierCode-style out-of-scope edits do not become production file thrash.[1]
3. **Audit per-step output caps and tool batching**—longer single-step thinking meets old harness limits; use the more aggressive batching Anthropic describes.[1][4]
4. **Stabilize prompt prefixes and tool prose**—when cache reads are $0.20/M on both Sonnet and Opus, jitter eats mid-tier step savings.[2][3]
5. **Write escalation rules**—e.g. two failed acceptance runs or a human `needs-judgment` tag before Opus—so mid-session model hops do not flush cache.[3]
6. **Run safety probes**—confirm cyber/biology fallbacks; book successful fallbacks as success with a different model id.[1]
7. **Schedule harness work with the downshift**—checkpoints, tool filtering, failure-window style fixes; otherwise you trade “expensive and slow” for “cheap and jittery.”[6][7]

## Unverified or deliberately omitted

- YouTube official intro view counts and comment mood: not cited without inventing metadata.[8]
- Original Reddit post bodies and same-prompt frontend scorecards: not fetched; **not invented**. Rust DEFLATE dollars only via secondary aggregation.[5]
- Full Artificial Analysis Intelligence Index curves: referenced via New Stack only; conflict with that suite is a “settings matter” warning, not a restated paywalled table.[4]
- Vendor early-tester quotes (Epic, Cursor, Unity, Slack, …): directional only.[1]
- No prediction of Haiku 5.5 ship date or final price; Anthropic only says it joins the 5.5 family in coming weeks.[1]

## Closing

Sonnet 5.5 earns a long post not because of another “70.6%” screenshot, but because it makes **mid-tier a credible daily engine for agentic coding again**: same sticker as Sonnet 5, fewer tokens, faster output, a sharp jump versus old Sonnet on Terminal-Bench-style CLI multi-step work, while Anthropic still reserves complex open judgment for Opus.[1] For Claude Code and custom harness owners the next step is concrete—run a week of Sonnet default vs Opus default vs escalate-on-fail on a bucketed task pool; read flagship pricing and quota books in the sister posts;[2][3] read whether to grow code or stack context in the harness essays.[6][7] **Downshifting the default is a routing decision, not a conversion experience.**

## References

[1] Anthropic, “Claude Sonnet 5.5”, 2026-09-28. https://www.anthropic.com/claude-sonnet-5-5  
[2] On-site: Claude Opus 5.5 price and performance. `/blog/claude-opus-5-5-price-and-performance/`  
[3] On-site: Claude Code usage limits (2026). `/blog/claude-code-usage-limits-cost-2026/`  
[4] Jessica Wachtel, “Claude Sonnet 5.5 vs. Opus 5.5: 42% cheaper and perfect on every run”, The New Stack, 2026-10-08. https://thenewstack.io/claude-sonnet-5-5-vs-opus-5-5/  
[5] KBlip aggregator summary of a Reddit user’s Rust DEFLATE/zlib single-task bakeoff (secondary; original thread not fetched). https://kblip.com/social/sonnet-5-5-matches-opus-5-5-on-a-from-scratch-rust-deflate-6BjQiyY  
[6] On-site: Grow the harness, not the context. `/blog/grow-the-harness-not-the-context/`  
[7] On-site: Pi 1.0 minimal coding-agent harness. `/blog/pi-1-0-codemode-mcp-minimal-harness/`  
[8] Anthropic official intro video (metadata not verified; no view counts cited). https://www.youtube.com/watch?v=s5nkj-L2vAw
