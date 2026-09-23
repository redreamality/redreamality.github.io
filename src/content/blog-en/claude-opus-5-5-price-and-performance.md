---
title: "Claude Opus 5.5: Lower Prices, Flagship Performance—How to Choose"
description: "Anthropic launched Claude Opus 5.5 on 2026-09-22: about 40% lower cost on typical workloads versus Opus 5, with Fable-tier capability claims and matching safeguards. A builder-focused read of pricing, benchmarks, and coding-agent fit."
pubDate: 2026-09-24T02:00:00.000Z
author: "Remy"
tags: ["Claude", "Opus 5.5", "Anthropic", "Model Release", "Coding Agents", "Pricing"]
lang: "en"
translatedFrom: "claude-opus-5-5-price-and-performance"
---

On 22 September 2026, Anthropic released **Claude Opus 5.5**, the first model in the Claude 5.5 family.[1] The official story is blunt: on most work it performs at the level of Claude Fable 5.1, costs about 40% less than Opus 5 on typical workloads, runs faster, and posts the strongest scores yet on Anthropic’s automated behavioral audit. Later the same day, OpenAI shipped GPT-6 Sol and Luna; the near-simultaneous launches invite side-by-side reading. The sibling post covers [GPT-6 Sol, Luna, and Astra](/blog/gpt-6-sol-luna-and-astra/).[2]

This article stays on Opus 5.5 and asks a practical question: **should you switch your coding agent’s default model?** We walk through list prices, what the published benchmarks actually say, which real jobs the safety gates will block, and how this fits prior on-site notes on Claude Code and agent harnesses. Numbers prefer primary pages; secondary coverage is background only—we do not invent unverified prices.

## Why this release deserves its own post

Model launches increasingly ship as a triple: capability, unit price, and safeguards. Opus 5.5 stacks three moves:

1. **Positioning up.** Anthropic says it reaches Fable 5.1 level on most work and opens the Claude 5.5 line; Sonnet 5.5 and Haiku 5.5 are promised in the coming weeks.[1]
2. **List price and task cost both down.** Per-million token prices fall modestly versus Opus 5, cache reads fall harder, and fewer tokens/steps per task push typical-workload cost down about 40% in Anthropic’s tests.[1]
3. **Harder safety narrative.** This is the first major release after the CEO’s call to pace the frontier so safety can keep up. External evaluators include Frontier Design and METR; biology and cybersecurity safeguards resemble Fable 5.1.[1][3]

For teams living in Claude Code on long repository jobs, this is not “another leaderboard tick.” Defaults, budget caps, and fallback policy may all need to change. We previously covered [Claude Code’s harness shape](/blog/inside-claude-code-agent-harness/) and [Jev × Claude Code landing paths](/blog/jev-claude-code-10x-and-25-lines/); this post adds the **model-layer** price and limits, not install or skill wiring.[4][5]

TechCrunch notes the cadence: roughly two months after Opus 5 (24 July 2026), and nearly simultaneous with OpenAI’s drop. Competition is loud; budgets still belong to your traces, not headlines.[3]

## Pricing: read the table, then cost-to-finish

Official prices per 1M tokens:[1]

| Item | Claude Opus 5.5 | Claude Opus 5 |
| --- | ---: | ---: |
| Cache reads | $0.20 | $0.50 |
| Input | $4 | $5 |
| Output | $20 | $25 |
| Cache writes | $5 | $6.25 |

**Fast mode** (Claude Code and Claude Platform) is $8 input / $40 output per million, with up to about 2.5× speed per Anthropic.[1]

Input/output alone is roughly a 20% cut. The wider gap comes from:

- **Cache reads down 60%.** In agentic and coding work, repeated context and tool-result reads often dominate the bill; Anthropic states cache reads make up the majority of those costs.[1]
- **Fewer tokens and steps per finished job.** Lower unit price plus leaner trajectories yield ~40% lower typical-workload cost; output is more than 30% faster than Opus 5.[1]

So do not stop at “dollars per million.” Closer to engineering: overnight migrations, multi-repo audits, long Cursor / Claude Code sessions—**what does finishing cost, and how much human rework?** OpenAI stressed per-task cost the same day; both labs are narrating a shift from peak IQ to unit task cost.[2][6]

Subscriptions: Anthropic says five-hour usage limits rise on Pro, Max, Team, and seat-based Enterprise plans, with a rate-limit reset you can save and spend when you choose.[1] Exact quotas belong to the console; we invent none.

The API id is `claude-opus-5-5`, live on the Claude Platform and on AWS, Google Cloud, and Microsoft Azure.[1]

### A reproducible rough costing frame (use your own traces)

This is not an official formula—it turns the announcement’s cost structure into checks so “sounds cheaper” does not surprise finance later:

1. Pull the last 20 **completed** agent tasks from Opus 5 (or your current default). Log input, output, cache read, cache write, wall time, and whether a human reworked the result.
2. Reprice those traces with the 5.5 table holding usage fixed—that is **list-price effect** only.
3. Then assume non-cached input and output each drop 20–40% (directionally from Anthropic’s “fewer tokens/steps,” not a guarantee)—an **efficiency-effect** band.
4. Column Fast mode separately: pay for speed on human-waiting paths; do not default it everywhere.
5. Account safeguard fallbacks to Opus 4.8 on their own line. A fallback that still finishes the business job can look like “5.5 failed” if you mix model ids in one total.

If even the optimistic band is not cheaper, the harness (useless retries, jittering prefixes, rewritten tool schemas every turn) is often the culprit—not the missing price cut. That matches our earlier harness discussion: the model is only part of the bill.[4]

## Official benchmarks: what to trust, what not to

Anthropic published a comparison covering Opus 5.5, Fable 5.1, Opus 5, and cited figures for GPT-6 Astra and GPT-5.6 Sol on some rows. Excerpt (full footnotes on the source page):[1]

| Eval | Opus 5.5 | Fable 5.1 | Opus 5 | GPT-6 Astra | GPT-5.6 Sol |
| --- | ---: | ---: | ---: | ---: | ---: |
| Terminal-Bench 4.0 (agentic coding) | 66.4% | 55.8% | 52.3% | 57.9% | 37.3% |
| FrontierCode v1.1 Main | 54.4% | 50.3% | 48.0% | 53.3% | 47.5% |
| CursorBench 4.0 | 57.8% | 51.8% | 46.6% | — | 41.7% |
| GDPval-AA v2.1 (knowledge-work Elo) | 1846 | 1735 | 1708 | 1542 | 1588 |
| AutomationBench (Zapier) | 40.0% | 31.4% | 26.9% | 41.4% | 28.8% |
| Humanity's Last Exam (with tools) | 67.7% | 65.6% | 63.6% | 57.2% | — |
| Terminal-Bench-Science 0.1 | 58.7% | 52.6% | 29.0% | 64.6% | 22.4% |
| OSWorld 2.0 (partial) | 81.8% | 80.7% | 74.0% | — | — |

Read that table with three official footnotes in mind:

1. **Effort and harness differ.** On Terminal-Bench 4.0, Opus 5.5 is at xhigh while Astra uses OpenAI’s reported high; trial counts and harnesses add noise. Anthropic also flags a Terminal-Bench standard error on the order of ±2.6 points for Opus 5.5.[1]
2. **Production safeguards drag scores.** Evals ran with production safeguards on; cyber tasks that intervene fall back to Claude Opus 4.8, and biology / frontier LLM-development tasks to Opus 5—**lowering** Opus 5.5’s apparent scores on those slices.[1]
3. **AutomationBench without fallback is harsher.** When Zapier treats safeguard interventions as failures and runs without fallback models, scores understate “fallback still finishes” production experience; Astra still leads AutomationBench in the table (41.4% vs 40.0%).[1]

Anthropic itself says that at this capability level **benchmark margins are a weaker guide than real-world gaps**; in their use, Opus 5.5 versus Fable 5.1 feels narrower than the scores imply.[1] That matches builder intuition: sprawling migrations, ambiguous multi-file edits, and human correction loops decide “worth switching” more than a point or two.

On cost efficiency, Anthropic highlights relative claims (no homemade absolute dollars here):[1]

- On FrontierCode at default effort, beats GPT-6 Astra at roughly **one-fifth the cost per task**;
- On Terminal-Bench 4.0, matches Astra at about **40% of the cost**;
- On CursorBench, beats GPT-5.6 Sol by about 11 points at roughly one-third the cost.

These are vendor self-comparisons. Cross-read OpenAI’s Sol/Luna note, which picks AutomationBench, DeepSWE, and OSWorld slices where *they* look cheaper.[2] **Two press posts on one day are not one independent replication.**

### Counterexample: when “higher score” is costlier and worse

Official and secondary coverage both surface a non-monotonic pattern: more test-time compute / effort does not always raise FrontierCode-style scores that punish out-of-scope edits—the model may change more than it should and get docked.[1][6] Matching pitfalls for teams:

- Defaulting every job to max effort: longer sessions, higher bills, worse merge discipline;
- Budgeting from demo configs that chase a single peak score;
- Misreading safeguard interventions as “5.5 cannot do security work” instead of policy routing.

A steadier pattern: **pin effort by task class** (medium for daily work, escalate only when stuck) and split reports into capability failure / policy fallback / human requirement change.

## Coding and long jobs: what early testers claim

Vendor coding signals cluster on longer, messier, less-rewritten work:

- One tester finished a ~**680k-line** migration in under a day—work that might take an engineering team weeks.[1]
- Another: audit/fix a ~**200k-line** codebase in under three hours versus over 20 hours and ~2.5× tokens on Opus 5.[1]
- Internal HAProxy C→Rust: both nearly passed HAProxy’s own regressions; Opus 5.5 finished in 9.5 hours versus 12 for Fable 5.1, ~51% cheaper.[1]
- Web performance: asked to cut load times across every page, Opus 5.5 succeeded 39 of 40 times; Opus 5 made smaller gains and sometimes changed app behavior.[1]
- GitHub, Lovable, Kiro, trading and consulting customers offer “fewer steps / fewer tokens / overnight unattended” quotes—useful hypotheses, not warranties for your repo.[1]

For coding-agent owners:

1. **Default medium effort may be enough.** Anthropic repeatedly stresses default-setting value; max is not automatically better ROI.[1]
2. **Long-session bill shape changed.** Cheaper cache reads plus shorter traces lower overnight marginal cost—you still need tool-loop control, logs, and human acceptance gates.
3. **Clearer writing cuts review cost.** Side-by-sides show 5.5 leading with conclusions and less jargon. Teams that audit via PR text and session logs spend less time reading model noise.[1]
4. **“Most secure coding agent” is a product stack.** The post also cites per-action classifiers, an auditable open-source sandbox, pre-merge review, and low prompt-injection success rates tying Fable 5.1 on a Gray Swan setup.[1] Model scores are one layer.

If you already run Claude Code, treat the launch as an **A/B: same real tasks, fixed harness, compare completion, rework, and dollars**—not a public leaderboard glance. The harness article is structure; this article is how you meter a model swap.[4]

### A one-week acceptance script you can copy

Goal: decide whether the default becomes `claude-opus-5-5`, not collect vibes.

1. **Task pool:** 8 mechanical migrations/dependency bumps; 6 ambiguous multi-file product asks; 4 integration fixes needing external docs; 2 intentional sensitive probes (to observe safeguards—not to jailbreak).
2. **Hold constants:** same repo snapshot, system prompt, tool set, starting effort (medium suggested); no mid-run model swaps unless logged as fallbacks.
3. **Fields:** merge-ready in one pass?, human-edited lines, tool calls, cache-read share, dollars, safeguard fallback?
4. **Pass line (example):** at ≤90% of prior default dollars, merge-ready rate ≥ old model; or rate flat with ≥30% fewer human-edited lines. Tune to your risk.
5. **Attribute failures:** cannot do / did but wrong style / policy fallback / bad task design (official finance evals even include a case where the model corrected faulty instructions).[1]

## Knowledge work and communication: two non-coding lines

Opus 5.5 is not only a coding model. Knowledge-work signals include:

- Quarterly reports on a simulated web where the earnings release was hard to find: 16 of 18 Opus 5.5 reports cleared an automated grader that failed invented figures/quotes; Fable 5.1 and Opus 5 cleared none under the same bar.[1]
- GDPval-AA v2.1 Elo 1846 versus 1735 / 1708 for Fable 5.1 / Opus 5, with a default-effort cost story versus max-effort Astra.[1]
- Merger model + exec deck: similar deal conclusions to Opus 5, but more thorough and readable; 63 versus 93 minutes, ~50% cheaper.[1]

Communication was a frequent Opus 5 complaint. Official side-by-sides show 5.5 stating earlier that an “extra drop” came from a billing-refactor bug, with manager-ready summaries.[1] For agent teams: **the same tool trace becomes cheaper for humans to audit and hand off**—soft labor that rarely appears on the token invoice but often decides whether overnight autonomy is allowed.

## Safety and limits: flagship capability with matching gates

Anthropic states Opus 5.5 is comparable to Claude Mythos 5.1 in biology and cybersecurity, so it ships with Fable-like safeguards.[1]

Condensed (System Card and Help Center win on detail):

- **Cybersecurity:** most cyber tasks **transparently fall back** to Opus 4.8; routine SDLC bug find/fix remains available. The Cyber Verification Program will expand to Opus 5.5 with tiered trusted access; Claude Security already pairs with Mythos 5.1.[1]
- **Biology:** same class of biology safeguards as Fable 5.1; blocked R&D can apply via the **Life Sciences Verification Program** for vetted labs, startups, and pharma.[1]
- **Anti-distillation:** **preserved thinking** (from Fable 5.1) blocks API users from editing prior context to extract reasoning; applies to relevant models for API accounts created on or after 31 August 2026.[1]
- **Alignment evals:** automated behavioral audit across nearly 2,000 scenarios; Anthropic reports best-to-date misalignment metrics, and ~85% fewer containment-boundary circumvention attempts versus Opus 5 / Mythos 5.1, mostly low severity and self-reported.[1]
- **Honest limits:** models often suspect evaluation, weakening extrapolation; interpretability-based monitoring is still being built. Training-side work includes tighter RL environment filtering and richer automated safety scenarios.[1]
- **Other:** zero data retention (as with prior Opus); EU AI Act watermarking measures; thinking mode can no longer be switched off.[1]

Implications:

- If agents touch exploit research, offense/defense drills, or biological design, **probe for fallbacks** and define success/accounting after routing to Opus 4.8.
- If you mostly ship product code, migrations, review, and knowledge work, safeguards show up as stabler boundaries and fewer hard-to-reverse autonomous actions.[1]
- If you run multi-tenant proxies, preserved thinking can break “rewrite history” integrations—follow Anthropic’s migration notes.[1]

TechCrunch aligns: same-class limits on discovering exploits in compiled programs and recognizable biological-weapons work, and notes this is the first release after Amodei’s pacing push.[3]

## Three bill traps that reverse “just read the list price”

Launch-week misreads usually mix three different kinds of money:

1. **Lower list price vs higher usage.** Higher five-hour caps and spendable resets can encourage longer jobs; unit price falls while totals rise. Use successful merges / closed tickets as the denominator, not raw daily dollars.
2. **Fast mode leakage.** Fine for interactive latency; disastrous if CI fleets and overnight migrations silently take $8/$40. Make Fast mode an explicit opt-in.[1]
3. **Cloud and reseller markups.** After AWS/GCP/Azure availability, marketplace and proxy SKUs add their own floors. Budgeting from anthropic.com while buying elsewhere creates fake contradictions with the announcement.[1]

None of this is about IQ; all of it shows up in the first finance meeting after launch. Write denominators and channels into the acceptance script before you paste another benchmark chart.

## How to compare with the GPT-6 family (standalone take)

The sibling post expands Sol / Luna / Astra.[2] Here is enough structure for Opus 5.5 readers without duplicating that article:

| Dimension | Opus 5.5 (this post) | GPT-6 side (summary) |
| --- | --- | --- |
| Role | New Anthropic flagship Opus; Fable-tier capability claims at Opus-band pricing | Astra for peak; Sol/Luna spread generation intelligence down the cost curve |
| List-price signal | vs Opus 5: ~−20% I/O, −60% cache reads; ~−40% typical task cost | Sol/Luna **−50%** vs GPT-5.6 promo API (Sol $2/$10, Luna $0.10/$0.50)[2] |
| Coding narrative | Self-reported Terminal-Bench / FrontierCode / CursorBench strength or cost wins | DeepSWE, FrontierCode, Codex usage, cache hit rates |
| Safety narrative | Bio/cyber gates + verification programs + preserved thinking | Astra’s alignment/Preparedness story; Sol/Luna inherit alignment gains |
| Selection intuition | Claude stack, long repos, steady default flagship | Peak → Astra; high-volume iteration → Sol/Luna |

**Choosing for coding agents:**

1. **Already on Claude Code / Anthropic API:** trial Opus 5.5 at default effort on real tasks; log cache hits, steps, rework. Probe bio/cyber-sensitive paths for interventions.
2. **Multi-model routing:** peak intellect on Astra or Fable-class; daily iteration on Sol or Opus 5.5; route by task type and failure cost, not brand loyalty.
3. **Do not budget from the other lab’s “relative cost” charts.** Harness, effort, and whether fallback spend is included are opaque—trust your traces.
4. **Keep judgment layers separate.** If you use something like Jev for structured routing/gates, swapping the flagship chat model need not redo the decision layer; see the on-site Jev piece.[5]

A same-day 36Kr / Jiqizhixin contrast piece frames the week as a unit-task-cost war and links both official posts; some absolute Fable list prices and internal cost curves there are secondary compilations—**this article does not promote Fable absolute dollars we could not verify on the Opus 5.5 primary page.**[6]

## Practical checklist for this week

1. Point the default model id to `claude-opus-5-5`, keep one-click rollback to Opus 5 / Sonnet.[1]
2. Freeze 10–20 real tasks (migrations, review, multi-repo interfaces, ambiguous product asks); log success, human interventions, dollars, wall time.
3. Inspect cache and prompt structure: after cheaper cache reads, prefix stability and tool-schema jitter dominate the bill.
4. Alert on safeguard fallbacks: separate “model too weak” from “policy routed to Opus 4.8.”
5. Sync product/legal: zero retention, watermarking, and always-on thinking may break prior integration assumptions.[1]
6. Build a three-tier routing table with the sibling post: peak / daily / high-throughput → Astra / Opus 5.5 / Sol–Luna.[2]
7. Treat “conclusion-first writing” as an acceptance check on five audited sessions, not a marketing slogan.

## Unverified or deliberately omitted claims

- YouTube demos and social screenshots without official or reproducible repos: no numeric scores cited here.
- Secondary mentions of absolute Fable 5.1 dollar list prices and per-task curves such as “medium ~$0.8 / max ~$6.19” were **not** copied into conclusions because we could not match those exact tables on the Opus 5.5 primary announcement; use Anthropic’s pricing page and console.
- “680k lines in a day” and similar early-tester stories are directional, not reproducible environments.
- We do not predict Sonnet 5.5 / Haiku 5.5 dates or prices.
- HN rumors (including unconfirmed later Fable timelines) are not treated as fact.

## Closing

Opus 5.5 is less “another #1” than Anthropic trying to put **Fable-class capability** into a more scalable Opus price/speed band while matching bio/cyber gates and verification programs to a pacing-the-frontier safety story.[1][3] For coding-agent operators the next step is concrete: measure default-effort completion and dollars on *your* tasks, then decide whether the flagship default moves; for the OpenAI side of the same week, read the sibling post instead of a same-day headline matrix.[2]

## Sources

[1] Anthropic, “Claude Opus 5.5”, 2026-09-22. https://www.anthropic.com/claude-opus-5-5  
[2] Sibling post: GPT-6 Sol, Luna, and Astra. `/blog/gpt-6-sol-luna-and-astra/`; OpenAI primaries cited there.  
[3] TechCrunch, “Anthropic releases Opus 5.5 with lower prices and Fable-level performance”, 2026-09-22. https://techcrunch.com/2026/09/22/anthropic-releases-opus-5-5-with-lower-prices-and-fable-level-performance/  
[4] On-site: Inside Claude Code agent harness. `/blog/inside-claude-code-agent-harness/`  
[5] On-site: Jev × Claude Code. `/blog/jev-claude-code-10x-and-25-lines/`  
[6] Jiqizhixin / 36Kr EU mirror, 2026-09-23. https://eu.36kr.com/zh/p/3995195771588745 (secondary; prefer [1] and OpenAI official pages for prices/benchmarks)
