---
title: "GPT-6 Sol and Luna: Spreading Astra-Class Intelligence Down the Cost Curve"
description: "OpenAI launched GPT-6 Sol and Luna on 2026-09-22: 50% lower API prices versus GPT-5.6 promo rates, with Astra-generation capability and alignment gains. Pricing, benchmarks, caching, and the Astra/Enigma side story—for coding-agent routing."
pubDate: 2026-09-24T02:30:00.000Z
author: "Remy"
tags: ["GPT-6", "Sol", "Luna", "Astra", "OpenAI", "Model Release", "Coding Agents", "Pricing"]
lang: "en"
translatedFrom: "gpt-6-sol-luna-and-astra"
---

On 22 September 2026, OpenAI expanded the GPT-6 universe with **GPT-6 Sol** and **GPT-6 Luna**.[1] The logic is explicit: **GPT-6 Astra**, introduced earlier the same month, remains the peak “most intelligent and aligned” model for the hardest work; everyday work still spans different scales, rhythms, and budgets. Sol and Luna use similar methods to carry Astra’s gains in professional work, factuality, coding, computer use, and alignment into faster, cheaper tiers—and pass infrastructure savings through as **50% lower API prices versus GPT-5.6 promotional pricing**.[1]

Earlier that day, Anthropic shipped Claude Opus 5.5. Side-by-side reading is inevitable. The sibling post covers [Claude Opus 5.5’s price and performance](/blog/claude-opus-5-5-price-and-performance/).[2] This article stands alone on the OpenAI side: where Sol/Luna sit, which benchmark slices the lab chose, what caching means for agent bills, how to read Astra’s capability story (including a publicly validated Enigma break) as a side plot, and how coding agents should **tier** models instead of defaulting everything to the most expensive option.

## Three roles: Astra / Sol / Luna

Names are product tiers, not slogans:

| Model | Official role (per OpenAI) | API id | List price this round (per 1M tokens) |
| --- | --- | --- | --- |
| GPT-6 Astra | Best overall; still for the hardest projects | `gpt-6-astra` (earlier launch) | No new absolute Astra table in the Sol/Luna post—we do not invent one |
| GPT-6 Sol | Strong mid-tier for hard work including coding | `gpt-6-sol` | $2 input / $10 output (halved from 5.6 Sol’s $4 / $20) |
| GPT-6 Luna | High-volume, clear-goal work (summarize, extract, quick Q&A) | `gpt-6-luna` | $0.10 input / $0.50 output (from 5.6 Luna’s $0.20 / $1.20) |

Prices and the 50% cut come from OpenAI’s announcement table.[1] TechCrunch adds product intuition—Sol for complex work such as coding, Luna for clerical/high-volume clear goals—and notes Anthropic’s Opus 5.5 landed about 90 minutes earlier.[3]

Availability on announcement day: Sol and Luna in ChatGPT Work and Codex for Plus, Pro, Business, Enterprise, and Edu; Free and Go get Luna in the desktop app; **not yet in Chat** at publish time; API ids `gpt-6-sol` / `gpt-6-luna`; gradual rollout planned for stability.[1]

Astra’s primary narrative lives in OpenAI’s early-September materials and safety overview: frontier claims across computer use, browsing, software engineering, cybersecurity, science, and professional work, including discussion of **Critical** cybersecurity capability under the Preparedness Framework.[4][5] We do not reprint Astra’s full scorecard here—only what is needed to explain what Sol/Luna are spreading.

## Price and caching: more than dollars per million

### List prices halved

Versus GPT-5.6 promo rates, Sol/Luna API prices drop **50%**.[1] Teams that already defaulted coding to Sol get immediate budget headroom; teams running Luna on extract/classify/short-reply chains push the cheap tier further down.

Still ask: **after the cut, will you promote more jobs to costlier models?** Higher psychological budgets can raise totals. Use successful finishes / merges / closed tickets as the denominator, not raw daily dollars.

### Prompt caching: a second lever for long agent threads

OpenAI improved GPT-6 prompt caching for higher default hit rates, faster responses, and a **90% discount on cached input-token reads**.[1] Supporting pieces include:

- a Prompt Caching Dashboard and diagnostics for missed hits;
- changing reasoning effort or tool availability **without breaking** earlier cacheable prefixes;
- explicit breakpoints so developers choose where cached prefixes end.[1]

GitHub reports that, over recent months, related improvements cut the share of prompt tokens needing fresh processing by more than 50% across billions of requests.[1] For Codex/Copilot-class sessions, list price and cache hit rate multiply.

### Reproducible checks for an internal runbook

1. Run 50 “same prefix, tiny suffix change” calls on one agent workflow; log hit rate and dollars.
2. Deliberately reshuffle tool JSON field order or wording each turn; watch hits collapse—that is a harness bug, not a missing price cut.
3. When raising/lowering effort, confirm your gateway does not rewrite the entire system prompt (OpenAI says effort/tool toggles can preserve cache; your wrapper might not).[1]
4. Report an “effective input price after cache-read discount,” and remember Anthropic’s “cache read list price” is a different accounting line when you compare vendors.

### Three traps that erase the “half-price” story

1. **Tier creep:** cheap Sol tempts teams to stop using Luna for extracts, or to escalate every Sol miss straight to Astra; average unit price rebounds.
2. **Cache misses:** jittering tool schemas, system prompts, or file order make the 90% cached-read discount theoretical.[1]
3. **Retry storms:** better factuality is not zero errors; mindless five-wide retries after timeouts multiply spend back up.

Fix these before arguing about anyone’s relative-cost chart.

## Official capability slices: the battles OpenAI picked

OpenAI does not claim Sol beats Astra overall. The story is **approaching or locally beating expensive competitor configs at much lower cost**. Figures below are from the Sol/Luna post—vendor self-reports; read effort/harness footnotes on the source page.[1]

### Professional workflows

- **AutomationBench:** Sol at xhigh scores 33.2% at about $0.27 per task; versus Claude Opus 5 max (26.9%) OpenAI claims roughly **9% of the per-task cost**; also claims wins over low-effort Astra and a Fable 5.1 setup with Opus 5 fallback (noting Fable’s cost is understated when fallback spend is omitted).[1]
- **Agents' Last Exam:** Sol at max effort scores 56.4%, with about 60% lower per-task cost than Claude Opus 5’s best score in that eval.[1]

Remember Anthropic’s same-day Opus 5.5 table lists GPT-6 Astra at 41.4% and Opus 5.5 at 40.0% on AutomationBench—**different posts, models, and slices do not assemble into one ultimate table**.[2]

### Factuality

On an internal eval from de-identified chats where users had flagged prior mistakes, Sol makes about half as many mistakes, approaching Astra-level reliability cheaper; Luna at higher effort can match GPT-5.6 Sol at about a hundredth the cost.[1] OpenAI notes these chats are harder than typical traffic (where mistakes are rarer) and scores are not strictly length-controlled.[1]

### Coding

- **FrontierCode 1.1 Main:** Sol improves substantially over 5.6 Sol and can match Claude Fable 5.1 xhigh at much lower cost (OpenAI’s wording).[1]
- **DeepSWE v1.1:** Sol max 68.8%, within 1.1 points of Claude Fable 5’s 69.9% at xhigh, at ~80% lower cost per task; Luna max 66.6%, comparable to Opus 5 / Fable 5 at medium; Luna ~93% / ~96% cheaper per task than Opus 5 / Fable 5 in those comparisons.[1]

OpenAI also cites internal usage valued at API prices: median researcher daily token spend above $600, 90th percentile above $7,000—arguing that as coding agents grow longer, **sustained cost decides how ambitious you dare to be**.[1]

### Computer use

Astra remains OpenAI’s claimed best computer-use model; Sol at xhigh on OSWorld 2.0 offline scores 60.5% versus Claude Opus 5 medium at 60.3%, at ~80% lower cost; Luna max can beat GPT-5.6 Sol medium at about one-tenth the cost.[1]

### Collaboration style

Sol/Luna inherit Astra’s clearer style: less jargon, fewer odd phrases, fewer low-value details, slightly shorter answers without losing substance. A website “bento + top-right slider” example contrasts 5.6 Sol’s quicker assumptions and fluff with 6 Sol’s more careful checks and less restating the obvious.[1]

## Alignment and safety: inheriting Astra without assuming “no gates”

Sol and Luna “build on the alignment work introduced with Astra,” with improvements over GPT-5.6 counterparts, including fewer misleading claims about coding work.[1] Evals deliberately stress hard cases and do not measure typical failure rates; see the system card.[1]

Astra’s safety story is heavier: OpenAI’s safety overview describes it among the most capable broadly deployed models and marks **Critical** cybersecurity capability under Preparedness, with isolation, refusal-boundary work, red teaming, and alignment suites.[5] **The Sol/Luna post does not itemize whether every Critical-tier control lands identically on each cheaper tier.** Engineering default: stronger tiers have larger misuse surface; route and audit by task sensitivity—do not assume “cheap model = no safety issues” or “alignment gains = turn off monitoring.”

Versus Claude Opus 5.5 (details in the sibling post): Anthropic uses transparent bio/cyber fallbacks and verification programs; OpenAI emphasizes Critical cyber and alignment on Astra.[2][5] Neither ships an ungated flagship. For coding agents, probe refusals/degrades in acceptance tests instead of memorizing adjectives.

## Why “dual-tier rollout” is not the same move as “one flagship got cheaper”

Calling both labs’ same-day moves a generic “price war” is too coarse:

- **OpenAI** splits peak (Astra) from scale (Sol/Luna); the cut lands on mid/low tiers while peak keeps the “hardest projects” story.[1]
- **Anthropic** uses **one** Opus 5.5 to chase Fable-class capability and cheaper-than-old-Opus economics; Fable/Mythos remain separated by safeguards and verification, not merely a “cheap flagship” SKU.[2]

Procurement and platform teams need different routing fields. OpenAI stacks often map difficulty → three models; Claude stacks often default Opus 5.5 and branch on whether safeguards intervene or verification is required. Do not assume tier names map one-to-one across vendors.

## Coding agents: from “dare we go big?” to “how we go big”

OpenAI’s internal spend vignette ($600 median / $7,000 p90 daily) marks a shift: when sessions are measured in hours and repositories, **sustained cost gates product ambition**.[1] Sol/Luna pricing plus caching act directly on that constraint.

Product tactics:

1. **Bind scope gates to model tiers.** Single PR / single service → Luna or low-effort Sol; cross-repo contracts → Sol; unknown prod incidents → Astra with a human present.
2. **Encode failure cost.** Sol’s factuality gains are on a hard, non-typical set.[1] Customer-visible answers warrant higher tiers or retrieval checks; internal drafts can use Luna.
3. **Accept on mergeability, not “it compiles.”** FrontierCode grades mergeability (tests, scope discipline, style, norms).[1] Stronger models raise the return on harness rules and skill files.
4. **Instrument overnight jobs.** Cache hits, tool-call counts, refusals, silent scope creep—four signals beat a single pass/fail bit.

### One-week A/B script (Codex / API)

1. Pick 12 recent tickets: 4 mechanical, 4 ambiguous multi-file, 4 needing browse/docs.
2. Control: old default (e.g., 5.6 Sol); treatment: 6 Sol at your production effort.
3. Run Luna only on summarize/extract pipelines—forbid direct prod code edits; watch cost and error rate.
4. Allow Astra only on treatment failures or human escalation; bill it separately.
5. Example pass line: at ≤70% of prior dollars (reflecting a halved list price), merge-ready rate does not fall; or rate rises with fewer human-edited lines.

If dollars barely move after a 50% list cut, check silent Astra upgrades, max effort everywhere, cache collapse, and retry multipliers first.

## Side plot: Astra and the MVUEH Enigma—how to read a capability story

Astra should not be reduced to a launch-video view count. A checkable third-party record from Crypto Cellar Research: on 15 September 2026, Carter Leffer asked maintainers to validate a **GPT-6 Astra** break of German Army Enigma message **MVUEH** (10 July 1941), unsolved since 2005. Maintainers confirmed the key and plaintext, describing a largely autonomous path: choosing the candidate ciphertext, suspecting relatedness to already-broken SIPVX plaintext, writing simulator/Bombe software, and using the repeated place-name crib ROSENOW; later logs even show professional leads into Bundesarchiv catalogue ids.[6]

How to read it:

1. It evidences **long-horizon research agents and tool use**, not Sol/Luna list prices or AutomationBench points.
2. It does **not** transfer cleanly to your private monorepo. Cryptanalysis success used public corpora, code execution, and search—different from “change interfaces per house style.”
3. It reinforces **why a peak tier still exists**: OpenAI itself keeps hardest projects on Astra; Sol/Luna spread methods, they do not delete the peak.[1]
4. The official YouTube intro is a narrative entry point (multi-million-view signal over ~two weeks), **not** a citable score sheet—prefer written posts, system cards, and checkable third parties.[7]

## Launch cadence and competitive context (rumors ≠ facts)

TechCrunch situates Sol/Luna after Astra’s earlier-month debut, stressing efficiency, factuality, and coding-error improvements, plus the ~90-minute gap after Opus 5.5.[3] A Jiqizhixin / 36Kr contrast frames both labs around unit task cost and points to OpenAI essays on buying completed work rather than tokens.[9]

Evidence boundaries for this draft:

- **Trusted:** official price tables, availability statements, footnoted self-reported benchmarks, 90% cached-read discount, GitHub’s cache-share feedback.[1]
- **Cited carefully:** third-party Enigma break (capability story, not pricing).[6]
- **Not treated as fact:** unconfirmed future launch calendars, social screenshot scores, or “overall champion” math that adds two press releases.

The useful question is not who “won” 22 September, but whether your routing table on 24 September still matches real unit prices and real failure modes.

## Platform availability: put it in the changelog

Details vanish in forwards—paste into internal notes:[1]

- Paid users: Sol/Luna in ChatGPT **Work** and **Codex**;
- Free/Go: **Luna** in the desktop app;
- Consumer **Chat** did not yet offer these models at announcement time, with gradual rollout—missing Chat UI may be rolling release, not account failure;
- API: `gpt-6-sol`, `gpt-6-luna`.

Support copy needs two lines: Work/Codex/API paths, and “Chat availability is whatever the product UI shows for your account.”

## How this connects to Claude Code readers on this site

Many readers live in Claude Code while evaluating Codex and dual-vendor routing. Suggested order:

1. This post: OpenAI tiers and prices;
2. Sibling: Opus 5.5 prices and safeguards;[2]
3. [Claude Code harness](/blog/inside-claude-code-agent-harness/): loop structure;
4. [Jev × Claude Code](/blog/jev-claude-code-10x-and-25-lines/): keep judgment layers unbound from the chat model.[8]

## Why communication style counts as cost

Clearer, shorter Sol replies are not aesthetics:[1]

- Shorter, conclusion-first PR text and session logs cut **human audit hours**;
- Fewer “sounds competent, never checked” phrases reduce false confidence;
- Multi-agent handoffs distort less when status is short and verifiable.

Add an operable check: sample 10 tool traces; ask an engineer who did not run the job to restate what was and was not done from the model’s own words. Lower restatement failure means the style gain is real.

## Integration checks beyond renaming the model

Launch day is more than one `model=` edit:

1. **Effort still reaches the API.** Many Sol/Luna charts assume high/xhigh/max; a gateway that hardcodes medium makes the marketing chart irrelevant.[1]
2. **Stable tool-list ordering** for cache prefixes.
3. **Avoid per-user megaprompt concatenation** that destroys shared prefixes.
4. **Retune length templates**—if style got shorter, forced 2k-token “be thorough” wrappers waste money.
5. **Refresh eval slices**—keep 5.6 goldens, but split factuality-sensitive vs mergeability-sensitive sets so averages cannot hide regressions.

## Safety engineering checklist (launch week)

1. **Tier ACL:** which workspaces may call Astra vs Sol/Luna only.
2. **Log real model ids**—do not roll everything into a “GPT-6” bucket.
3. **Alert on refusal vs capability failure.**[1]
4. **Regression-test history-rewriting proxies**—Sol/Luna do not spell out an Anthropic-style preserved-thinking break, but behavior can still shift versus 5.6.
5. **Critical-cyber awareness:** peak models on shell-and-install environments need stricter isolation than cheap tiers.[5]

## Choosing versus Opus 5.5 (standalone)

| Dimension | GPT-6 Sol / Luna (this post) | Claude Opus 5.5 (summary) |
| --- | --- | --- |
| Role | Spread Astra-generation capability to mid/low price | One SKU chasing Fable-class capability at Opus-band economics |
| List price | Sol $2/$10, Luna $0.10/$0.50 (−50% vs 5.6 promo) | $4 in / $20 out / $0.20 cache reads (~−40% typical vs Opus 5) |
| Coding narrative | DeepSWE / FrontierCode / Codex usage + cache | Terminal-Bench / FrontierCode / CursorBench (vendor) |
| Safety narrative | Inherit Astra alignment; Astra’s Critical cyber story separate | Bio/cyber gates + verification + preserved thinking |
| Default intuition | OpenAI/Codex: daily Sol, batch Luna, peak Astra | Claude Code: trial Opus 5.5 at default effort |

**Coding-agent tiering:**

1. **Already on Codex / ChatGPT Work:** move coding default 5.6 Sol → 6 Sol; A/B merge rate and dollars; batch extract/summary on Luna.
2. **Peak jobs** (hard repros, large architecture moves, high failure cost): explicit Astra route with a budget cap.
3. **Multi-vendor:** route by task type; never paste either lab’s “relative cost” into finance models uncritically.[1][2]
4. **Keep judgment layers separate**—see the on-site Jev piece.[8]

## Practical checklist

1. Update API names to `gpt-6-sol` / `gpt-6-luna`; keep rollback to 5.6 or Astra.[1]
2. Open the caching dashboard; fix per-turn system-prompt / tool-schema rewrites.
3. Freeze 10–20 real coding tasks for A/B with pinned effort.
4. Instrument refusals/policy degrades separately from “model got dumber.”
5. Maintain a three-tier map with the sibling post: Astra / Opus 5.5 / Sol–Luna.[2]
6. Document Free/Go desktop Luna, paid Work/Codex Sol/Luna, and Chat status—console wins over rumor; Chat was not open on announcement day.[1]

## Unverified or deliberately omitted

- Absolute Astra dollar prices are not fully tabulated in the Sol/Luna post—**we invent none**.
- Secondary absolute competitor prices / per-task curves in 36Kr-style roundups that we could not match on primary pages are not promoted as conclusions.[9]
- YouTube demo scores and social screenshots without independent repro: not cited as numbers.
- Crypto Cellar’s “days vs human weeks” is author evaluation, kept as citation context, not an SLA.
- No prediction of Chat full rollout dates.

## Closing

GPT-6 Sol and Luna are less “another world #1” than OpenAI’s move, after Astra’s peak, to spread same-generation methods and alignment onto **scalable price points**, then cut effective long-agent cost again with caching infrastructure.[1] Astra still owns the hardest projects; records like MVUEH keep the peak-tier research story alive.[6] For coding-agent owners, the useful work is tiered routing, stable cache prefixes, and acceptance on your merge rate and dollars—read the sibling post when you need the Claude side of the same week.[2]

## Sources

[1] OpenAI, “Introducing GPT-6 Sol and Luna”, 2026-09-22. https://openai.com/index/introducing-gpt-6-sol-and-luna/  
[2] Sibling: Claude Opus 5.5. `/blog/claude-opus-5-5-price-and-performance/`  
[3] TechCrunch, “OpenAI launches GPT-6 Sol and Luna…”, 2026-09-22. https://techcrunch.com/2026/09/22/openai-launches-gpt-6-sol-and-luna/  
[4] OpenAI, “GPT-6 Astra: A new generation of intelligence”. https://openai.com/index/gpt-6-astra/  
[5] OpenAI, “Safety overview: GPT-6 Astra”. https://openai.com/index/safety-overview-gpt-6-astra/  
[6] Crypto Cellar Research, “The MVUEH Break”, updated 2026-09-19. https://www.cryptocellar.org/bgac/the-mvueh-break.html  
[7] OpenAI YouTube, “Introducing GPT-6 Astra…”. https://www.youtube.com/watch?v=1QNsdr-Qx_I  
[8] On-site: Jev × Claude Code. `/blog/jev-claude-code-10x-and-25-lines/`  
[9] Jiqizhixin / 36Kr EU, 2026-09-23. https://eu.36kr.com/zh/p/3995195771588745 (secondary)
