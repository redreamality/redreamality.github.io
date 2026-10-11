---
title: "Where DeepSeek Flash Is Cheap and Where It Isn't: An Agent Cost Model and Selection Checklist for V4.1 Flash"
description: "DeepSeek V4.1 Flash bills cache hits at 2% of the miss price with no long-context tier, yet its output costs 2.4x Haiku 5.5 and GPT-6 Luna and peak hours cover Beijing office time. A cost model on four agent task shapes, subagent/routing/off-peak/self-host trade-offs, failure modes, and a checklist."
pubDate: 2026-10-11T10:40:00+08:00
author: "Remy"
tags: ["deepseek", "llm", "ai-agents", "agent-harness", "open-source"]
lang: "en"
---

On October 7 a blog post titled "Why Isn't The Industry Freaking Out About DeepSeek 4.1 Flash?" hit Hacker News. The author said they had used the model heavily for a month across a dozen projects, could not tell mid-session whether they were on DeepSeek or Opus without checking the model name, and rarely spent more than \$1 on a session even when it ran most of the day. [1] When I pulled the thread on October 11 it had about 1,100 points and 900-plus comments, [2] split between "subscriptions are so cheap, who cares about API prices" and "it burns several times the tokens per task, so the low price is an illusion."

This is not a launch recap. The question for agent builders is: **which line of the price sheet makes DeepSeek V4.1 Flash cheap, which task shapes cash that in, and which let other costs eat it?**

Related posts: the [Haiku 5.5 subagent cost model](/blog/claude-haiku-5-5-subagent-compaction-cost-model/) already has a small DeepSeek vs Haiku sample, which I won't repeat; I reuse its task shapes and add DeepSeek. The [DeepSeek V4 benchmark map](/blog/deepseek-v4-benchmarks-guide/) explains what each benchmark measures; [Cordis and DeepSeek Harness](/blog/cordis-spatiotemporal-composability-deepseek-harness/) covers the plugin architecture of the official harness; [three costly coding-agent habits](/blog/coding-agents-cost-inefficient-behaviors/) and [default hard budget caps](/blog/default-hard-budget-caps-agent-deployed-services/) cover waste and stop-loss beyond pricing. Amounts follow official price sheets; "worked example" means my script, "my take" means opinion, and forum claims are flagged second-hand.

## What the model actually is

Per the model card and technical report, V4.1 Flash is a 552B-parameter multimodal MoE with a 1M-token context, MIT-licensed. [3][4] Four things matter for cost:

- **Reading costs less than writing.** Its Causal Encoder-Decoder (CED) design splits 40 layers into a 20-layer encoder and a 20-layer decoder whose global KV is projected from the encoder's last layer, so prefill (reading the prompt) activates 8B parameters per token and decode 16B. [3] The report's rationale: long-horizon agents are input-heavy and tool calls keep triggering prefill, so reading has to get cheap. [4]
- **KV cache of 890 bytes per token**, about 1/4 of V4-Flash; persistent KV on SSD or host memory is about 1/8. [3][4] The launch note says it plainly: cache-hit charges are often a large share of agent costs, and compressing the cache cuts them. [6]
- **Adjustable effort.** Internally an integer from 1 to 100; the API exposes low, high, and max (50, 75, 100). [4] Thinking is on by default at high. [8] Every instruct score on the model card was measured at max. [3]
- **Size.** The Hugging Face weights total about 510 GB, [3] including 196B parameters of Engram conditional memory (a sparse token-keyed lookup table). [3] One HN commenter split it into about 307 GB of backbone and 203 GB of n-gram table that can sit in host memory (second-hand). [2]

So this is not a small model; at 552B other labs would call it Pro. It is Flash because each token activates little and the KV is tiny, so very long contexts are cheap to serve. That explains the price sheet.

## The price sheet: the cheap line is cache hits, not the headline rate

DeepSeek's official prices (USD per million tokens; the Chinese page lists CNY): [5]

| Item | Off-peak | Peak |
| --- | --- | --- |
| Input (cache hit) | 0.003 | 0.006 |
| Input (cache miss) | 0.15 | 0.30 |
| Output | 0.60 | 1.20 |

In CNY, off-peak is 0.02 / 1 / 4 yuan, doubled at peak. [5] Peak is 01:00–04:00 and 06:00–10:00 UTC on weekdays (09:00–12:00 and 14:00–18:00 Beijing); weekends and Chinese public holidays are off-peak. [5]

Side by side with the others at standard rates (USD per million tokens): [5][14][15][16]

| Model | Cache read | Uncached input | Output | Long-context rule |
| --- | --- | --- | --- | --- |
| DeepSeek V4.1 Flash (peak) | 0.006 | 0.30 | 1.20 | Flat up to 1M, no cache-write surcharge |
| Claude Haiku 5.5 (≤100K) | 0.01 | 0.10 | 0.50 | Prompt over 100K bills the whole request at 5x |
| GPT-6 Luna (≤272K) | 0.01 | 0.10 | 0.50 | Over 272K: 2x input and cache, 1.5x output |
| Gemini 3.8 Flash (through 2026) | 0.075 | 0.75 | 3.75 | All rates double on Jan 1, 2027; cache storage billed separately |

(Haiku's 5-minute cache write and Luna's cache write are both 0.125.)

Three takeaways:

1. **Headline rates are not cheap.** At peak, uncached input is 3x Haiku/Luna and output 2.4x; off-peak, 1.5x and 1.2x. (Worked example.)
2. **Cache hits and long context are cheap.** A hit costs 2% of a miss versus 10% elsewhere, with no tier inside 1M and no cache-write fee. Each agent turn rereads everything before it, the biggest line on an agent bill.
3. **Cheap is not a constant.** Per the price tracker benchr (second-hand), V4-Flash started the year at a flat \$0.14/\$0.28, moved on August 16 to time-of-day pricing with peak at \$0.44/\$1.32, and was replaced on September 10 by V4.1 Flash at \$0.30/\$1.20, still above January. [21] DeepSeek's changelog confirms peak pricing from August 16 and the September 10 cut. [7] On HN one long-time user said the August rise sent him back to subscriptions; another said the post's "basically unlimited on a \$10 plan" read like a months-old draft. [2]

### The peak window is Beijing's working day

This matters most for readers in China. Peak share for uniform weekday usage over local 09:00–18:00, week of October 12 (Europe and US on summer time): (worked example)

| Usage pattern | Share in peak | Effective price vs peak |
| --- | --- | --- |
| Beijing 09:00–18:00 | 77.8% | 0.889x |
| Berlin 09:00–18:00 | 33.3% | 0.667x |
| San Francisco 09:00–18:00 | 0% | 0.5x |
| Uniform 24x7 | 20.8% | 0.604x |

In Beijing only the lunch break escapes peak; San Francisco's working day is entirely off-peak, so US daytime users always pay half. That explains the "absurdly cheap" chorus on HN, while interactive use in Beijing office hours bills close to peak. Convert time zones before trusting Western reviews.

## Why the industry isn't "freaking out": the main HN objections

Grouped by argument, the pushback falls into four buckets: [2]

1. **Subsidized subscriptions.** The most-replied thread (250+ replies) argued most people are on heavily subsidized plans; one person spent \$50 in a few days on the cheapest OpenRouter provider, a quarter of a Codex subscription that would have covered it. Another found a \$100 GLM plan and a \$100 Claude plan gave similar usable volume.
2. **Not cheap per task.** One commenter claimed it uses ten times the tokens of GPT-6.1 Sol per task. Artificial Analysis (AA) is milder but agrees in direction: on its Intelligence Index runs DeepSeek averages about 89K output tokens per task to Luna's 50K, and costs \$0.27 per task versus \$0.07 for Luna and \$0.21 for Haiku 5.5 (all at max). [18][19]
3. **Uneven capability.** One builder saw an unacceptable quality drop with it as orchestrator (ignoring relevant context, inventing designs without discussion, verbose docs) and went back to GLM there, while calling it "perfectly capable of being the sole agent for all of my well specced implementation tasks." Another said it is bad at grilling sessions and can't explain things. Others called it a "hallucination factory" or "benchmaxxed."
4. **Trust and friction.** Not letting a Chinese company's agent onto a machine, employers that won't pay for Chinese products, clients demanding zero data retention (ZDR), and "if it isn't in Cursor's list, it doesn't exist."

Supporters brought numbers too: one used over 40B tokens for over \$800 on the API in 30 days, splitting work into verified phases with a lead-agent audit; one built a tool for Opus to manage DeepSeek Flash subagents, "extremely light on Claude tokens"; one ran 50 concurrent subagents in the last 1.5 hours of a subscription window, reverse-engineering an old PC game, and found 100+ new functions. [2]

The sides don't really conflict. My take: **for read-heavy, many-turn, cache-hitting work it is an order of magnitude cheaper; for short real-time work in Beijing office hours it isn't; for seats needing reliable judgment, price isn't the question.**

## Pricing it against task shapes

Setup from the [Haiku 5.5 post](/blog/claude-haiku-5-5-subagent-compaction-cost-model/): each turn reads the cached prefix and writes the new tool result plus the previous output (thinking included). Its three shapes, plus an all-day session:

- **A short task:** 15K start, 12 turns, 4,000 new tokens and 800 output per turn.
- **B reread-heavy:** same, but 10K new per turn. Final prompt 133.8K.
- **C long task:** 20K start, 30 turns, 5,000 new and 1,000 output per turn. Final prompt 194K.
- **D all-day session:** 20K start, 150 turns, 3,000 new and 600 output per turn. Final prompt about 556K, no compaction.

| Shape | DeepSeek peak | DeepSeek off-peak | Haiku 5.5 | GPT-6 Luna | Gemini 3.8 Flash |
| --- | --- | --- | --- | --- | --- |
| A short | 0.034 | 0.017 | 0.018 | 0.018 | 0.12 |
| B reread | 0.056 | 0.028 | 0.074 | 0.029 | 0.19 |
| C long | 0.11 | 0.056 | 0.24 | 0.069 | 0.48 |
| D all-day | 0.53 | 0.27 | 2.58 | 0.91 | 3.96 |

(USD, worked example. Same token counts for all, full cache hits; Gemini excludes storage fees; DeepSeek's cache is best-effort. [9])

How to read it:

- **Short tasks at peak cost double.** In shape A, 59% of the bill is new tokens, where DeepSeek's rate is 3x; only off-peak does it tie.
- **The longer, the better.** In shape D over 80% of Haiku's and Luna's bills are cache rereads; Haiku crosses 100K at turn 24, Luna 272K at turn 72. DeepSeek's hit price is 60% of their low tier and never steps up. \$0.53 for a day matches the author's "under a dollar."
- **Shape C is the watershed.** Peak DeepSeek (0.11) costs more than Luna (0.069) and half of Haiku (0.24); off-peak (0.056) it is cheapest.
- **Gemini 3.8 Flash is another bracket.** Rates are 7.5x Luna's and double next year. AA scores it 41, above DeepSeek's 39, [20] so choose it for audio or video input, not token arithmetic.

### How much verbosity eats the advantage

The table assumes equal output, but AA shows DeepSeek writing more than Luna (89K vs 50K, about 1.78x; Haiku at max writes 162K). [18][19] Multiplying DeepSeek's output by k, the tie point is: (worked example)

| Shape | Peak vs Haiku | Peak vs Luna | Off-peak vs Luna |
| --- | --- | --- | --- |
| A short | cannot tie | cannot tie | 1.05 |
| C long | 3.73 | 0.09 | 1.56 |
| D all-day | 12.7 | 3.20 | 8.44 |

"Cannot tie" means input alone already costs more. **On short tasks it loses once it talks a little more; in an all-day session it can talk three times as much and still beat Luna.** k scales output only; verbosity usually adds turns too, so read the short row pessimistically.

AA's \$0.27 uses peak rates of \$0.30/\$1.20; [17] off-peak it would be \$0.135, 1.9x Luna but under Haiku's \$0.21. (Worked example.)

## Four ways to put it into an agent architecture

### As a subagent: the money isn't in the workers

The Haiku post's fan-out: an Opus 5.5 main agent sends out 8 shape-A workers, each returns a 2,000-token report, and the main agent runs 20 more turns.

| Worker model | 8 workers total | Report cost inside Opus context | Total |
| --- | --- | --- | --- |
| DeepSeek peak | 0.24 | 0.14 | 0.39 |
| DeepSeek off-peak | 0.12 | 0.14 | 0.27 |
| Haiku 5.5 | 0.13 | 0.14 | 0.27 |
| Gemini 3.8 Flash | 0.88 | 0.14 | 1.03 |

(USD, worked example.)

Swapping workers between DeepSeek and Haiku moves the total by about ten cents; one 30K-token reread by the main agent after a weak report adds \$0.24. The [Haiku post](/blog/claude-haiku-5-5-subagent-compaction-cost-model/)'s conclusion holds: **pick workers by whether the main agent can use the report as-is; unit price is secondary.**

The harness matters more than unit price. The model card shows the same model on DeepSWE v1.1 at 74.2 in mini-SWE, 72.6 in DeepSeek Harness Minimal, 69.8 in Claude Code, and 65.6 in Codex, an 8.6-point spread; on Terminal-Bench 2.1, 84.1 to 90.6. [3] Users say one harness tuned for Flash works noticeably better. [2] Test it in the harness you actually run, not against the card's best score.

### As a routing tier: let it execute, not decide

Most HN successes share a structure: a strong model plans and reviews, DeepSeek executes well-specified tasks; most failures put it in the orchestrator seat making design calls. [2] AA's breakdown agrees: on AutomationBench (automation workflows) it scores 69% to Haiku's 35% and Luna's 53%, but on professional document reasoning (GDP.pdf) 13% (Haiku 21%, Luna 23%), and on the knowledge-reliability index AA-Omniscience −5 (Haiku 11, Luna 1). That index adds for right answers, subtracts for wrong ones, and ignores refusals, so negative means more wrong than right. [18][19] My take: send long reads, tool loops, and specified execution to it; keep factual-reliability and trade-off seats on stronger models.

Speed counts too. At max, AA measures 1.03 s to first token and 10.2 s to first answer token for DeepSeek, versus 101.5 s for Luna and 296 s for Haiku; output runs at 217, 240, and 137 tokens/s. [18][19] When someone is waiting, it answers first.

### Batch and off-peak: off-peak is a real-time half price

I found no Batch API in DeepSeek's docs; off-peak half price plays that role, in real time. [5] Others halve too: Haiku 5.5 batch is \$0.05/\$0.25, and Luna's Batch and Flex are half of standard. [14][15] So:

- **Single-request bulk jobs** (classification, extraction, tagging): Haiku/Luna batch beats DeepSeek off-peak, if async is fine.
- **Overnight agent loops** (bulk issue fixing, regression evals, doc backfills): batch APIs don't fit multi-turn work; DeepSeek off-peak does, at \$0.056 for shape C.

For teams in China, the easiest saving is moving work that can wait to after 18:00 and weekends, at half the daytime rate.

### Self-hosting: for data, not for savings

The original author said self-hosting never pays back on cost. [1] With HN's second-hand numbers: four DGX Sparks at about \$20K reportedly run it well; over 24 months that must displace \$833 a month of API spend, i.e. 7,421 peak shape-C runs a month or a sustained 268 output tokens/s. Another reported about 2,500 tokens/s prefill and 40 tokens/s decode on a 256 GB M5 Ultra; one stream decoding nonstop for a month yields about 104M tokens, \$124 at peak output price. [2] (Worked example; excludes power and ops.)

The \$0.006 hit price also rests on DeepSeek's disk cache; [9] self-hosted, you build KV persistence and prefix matching yourself or re-prefill every turn. The launch note invites anyone "planning a large-scale deployment with 2,000 GPUs + a storage cluster" to get in touch, [6] which shows the scale behind these economics. Self-host for data control, compliance, or air-gapped setups, not price.

## Where it breaks

### Benchmarks: the setting they measured isn't the one you use

- Model card scores are at max (100); the API default is high (75). [3][4][8] Defaults won't reproduce the table.
- NL2Repo-Bench reads 64.0 on the model card and 65.4 in the changelog. [3][7]
- Terminal-Bench 4.0 is self-reported at 31.2; AA measures 27%, and Haiku 5.5 at 33%. [3][19]
- The report itself says a narrow benchmark gap doesn't mean parity with leading closed models on the hardest reasoning and edge cases. [4]

On "benchmaxxing," HN offered impressions, not evidence. [2] The independent breakdown is more useful: strong on automation workflows, weak on factual reliability, matching "useful but makes things up."

### Tool calls: rule out parsing before blaming the model

V4.1's tool-call markup (DSML) differs from V4's. Per an inference provider's blog (second-hand), older vLLM parsers don't error on the new format; they pass the call through as text, which looks like the model refusing tools. [24] One vLLM PR's description says vLLM's Python-side V4.1 builder previously accepted missing, repeated, undeclared, and mistyped parameters even with `strict=true`; the PR switches to XGrammar schema constraints, merged September 15, and needs a newer XGrammar. A PR fixing V4.1 Flash failing to stream back to clients was still open when I checked. [22][23] One user reported markup leaking into message content on the official API from September 22, fixed by switching to GLM; the vendor called it a client bug, so it's inconclusive. [25]

Three official rules matter. Requests with `tools` must pass back all previous `reasoning_content`, which is concatenated into context, so thinking accumulates as input. [8] Chat Completions can't insert non-model-generated tool calls mid-conversation; use the Anthropic or Responses formats for that. Strict mode is beta, needs the `/beta` base URL, every property `required`, and `additionalProperties` false. [10]

### Long context: cache resumption is a known weak point

The report's limitations section is candid: CSA2's sparse selection can err, and SWA Bounded Replay reconstructs state approximately at cache-resumption boundaries, which may degrade untested edge cases; stress-testing both is on their list. [4] The base model scores 45.2 on LongBench-V2, below V4-Pro base's 51.5; [3] AA's long-context reasoning test AA-LCR gives it 84%, level with Haiku and Luna. [19]

Cache rules move the bill too: matching is by whole prefix units, so A+B then A+C doesn't hit, and unused cache is usually cleared within hours to days. [9] A session resumed next morning may reread everything at miss price, right at the boundary the report flags. The card recommends `max_tokens` of at least 256K, [3] a very high per-response ceiling without a budget cap.

### Compliance: where data lives and who keeps it

DeepSeek's privacy policy says data is collected, processed, and stored in the PRC and used to operate, develop, and improve services; [12] platform terms are governed by mainland Chinese law. [13] I found no ZDR option in the API docs. HN users point to third-party hosts advertising ZDR (second-hand), while others warn that quantization varies by provider and OpenRouter's billing and caching differ from the official API. [2]

For teams in China it cuts the other way: in-country processing is often a plus, subject to your industry's rules. The API also takes a `user_id` to isolate KV cache and scheduling per end user. [11] For EU or US residency, Luna offers EU at a 10% premium and Claude US-only `inference_geo` at 1.1x; [14][15] with DeepSeek, it's third-party hosting or self-hosting.

## Selection table: what to try first

(My take)

| Scenario | Try first | Why |
| --- | --- | --- |
| Long sessions, multi-turn tool loops, read-heavy | DeepSeek Flash official API | Hit price 0.006 / 0.003, no tier inside 1M |
| Agent work that can wait for evenings or weekends | DeepSeek off-peak | Real-time half price; cheapest of the three on shape C |
| Short real-time subagents, classification, titling during Beijing office hours | Luna or Haiku 5.5 | Uncached input two-thirds cheaper, output nearly 60% cheaper |
| Single-request bulk jobs | Haiku / Luna batch | 0.05 / 0.25, below DeepSeek off-peak |
| Already in a Claude harness with prompts under 100K | Haiku 5.5 | Same interface; see the on-site post |
| Factual reliability, design trade-offs, orchestrator seat | Frontier model, with DeepSeek only executing | Weak hallucination metric in independent evals |
| EU/US data residency or ZDR required | Luna / Claude, or vetted hosting or self-hosting | DeepSeek's official API processes data in China |
| Audio or video input | Gemini 3.8 Flash | DeepSeek accepts images only |

## Acceptance checklist: measure it on your own workload

**1. Time of day and cache**

- Bucket last month's requests by Beijing peak/off-peak for your real multiplier; move what can move.
- Log `prompt_cache_hit_tokens` and `prompt_cache_miss_tokens` per request [9] for the hit rate; keep system prompt and tool definitions in a stable prefix with nothing changing ahead of them.
- Test an overnight resume: pause a few hours, continue, and check for a full first-turn miss and quality drops.

**2. Effort and tokens**

- Run low / high / max on your own samples; record cost per accepted task and wall time, not price per million.
- Measure the output-token ratio against your comparison model and check the tie factors: on short tasks, above about 1 means switch.

**3. Tool calls**

- Track parse failures: DSML in content, or empty `tool_calls` with obvious call intent in the text.
- Self-hosted, check vLLM version and tool-parser config; on the official API, confirm `reasoning_content` is passed back.
- For strict-JSON tools, check that strict mode's schema limits can express them.

**4. Quality and role**

- Blind-compare on samples that require opening primary sources and not inventing numbers; score executor and orchestrator roles separately.
- Measure the main agent's reread rate: how much of what a worker read it reads again.

**5. Compliance and budget**

- Pin down the data path (official API or which host, what quantization, ZDR or not) and put it in customer contracts.
- Prices change; [5] keep rates in config and review monthly. Concurrency is capped at 2,500 per account with HTTP 429 beyond, so add retries and fallback routing. [11]
- Set a hard budget cap that stops work; see [default hard budget caps](/blog/default-hard-budget-caps-agent-deployed-services/).

My closing take: the industry isn't freaking out because the advantage only cashes in on one bill shape: long context, high cache hits, schedulable work, and execution that doesn't demand factual precision. That is the growing share of long-horizon agent work, so it earns a real slot in your routing table. Judge it on headline price, or map US daytime experience onto Beijing office hours, and the arithmetic goes wrong.

## References

1. dgt.is, "Why Isn't The Industry Freaking Out About DeepSeek 4.1 Flash?", 2026-10-07: <https://www.dgt.is/blog/2026-10-07-deepseek-freek-out/>
2. Hacker News thread (item 50000488; all comments read via the Algolia API): <https://news.ycombinator.com/item?id=50000488>
3. Hugging Face, DeepSeek-V4.1-Flash model card and repository files: <https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash>
4. DeepSeek-AI, "DeepSeek-V4.1-Flash: Pushing the Limits of KV Cache Compression," technical report: <https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/DeepSeek_V41_Tech_Report.pdf>
5. DeepSeek API Docs, "Models & Pricing" (English page; the Chinese page lists CNY prices and Beijing time): <https://api-docs.deepseek.com/quick_start/pricing> ; <https://api-docs.deepseek.com/zh-cn/quick_start/pricing>
6. DeepSeek, "DeepSeek-V4.1-Flash Release," 2026-09-10: <https://api-docs.deepseek.com/news/news260910>
7. DeepSeek API Docs, "Change Log": <https://api-docs.deepseek.com/updates>
8. DeepSeek API Docs, "Thinking Mode": <https://api-docs.deepseek.com/guides/thinking_mode>
9. DeepSeek API Docs, "Context Caching": <https://api-docs.deepseek.com/guides/kv_cache>
10. DeepSeek API Docs, "Tool Calls": <https://api-docs.deepseek.com/guides/tool_calls>
11. DeepSeek API Docs, "Rate Limit & Isolation": <https://api-docs.deepseek.com/quick_start/rate_limit>
12. DeepSeek, "Privacy Policy," updated 2026-02-10: <https://cdn.deepseek.com/policies/en-US/deepseek-privacy-policy.html>
13. DeepSeek, "Open Platform Terms of Service," effective 2026-04-29: <https://cdn.deepseek.com/policies/en-US/deepseek-open-platform-terms-of-service.html>
14. Claude Platform Docs, "Pricing": <https://platform.claude.com/docs/en/about-claude/pricing>
15. OpenAI, "GPT-6 Luna" model page: <https://developers.openai.com/api/docs/models/gpt-6-luna>
16. Google AI for Developers, "Gemini Developer API pricing": <https://ai.google.dev/gemini-api/docs/pricing>
17. Artificial Analysis, "DeepSeek V4.1 Flash (max)": <https://artificialanalysis.ai/models/deepseek-v4-1-flash>
18. Artificial Analysis, "GPT-6 Luna (Max) vs DeepSeek V4.1 Flash (Max)": <https://artificialanalysis.ai/models/comparisons/deepseek-v4-1-flash-vs-gpt-6-luna>
19. Artificial Analysis, "Claude Haiku 5.5 (Max) vs DeepSeek V4.1 Flash (Max)": <https://artificialanalysis.ai/models/comparisons/deepseek-v4-1-flash-vs-claude-haiku-5-5>
20. Artificial Analysis, "Gemini 3.8 Flash (high)": <https://artificialanalysis.ai/models/gemini-3-8-flash>
21. benchr, "DeepSeek raised prices and made the clock part of the bill" (third-party price tracker, updated 2026-09-11): <https://benchr.org/articles/deepseek-peak-pricing>
22. vLLM PR #56408, "Use XGrammar schema constraints for DeepSeek V4.1" (merged 2026-09-15): <https://github.com/vllm-project/vllm/pull/56408>
23. vLLM PR #58822, "DeepSeek V4.1 Flash failed to stream back to the client" (open when checked): <https://github.com/vllm-project/vllm/pull/58822>
24. OrcaRouter blog, "DeepSeek V4.1 Flash Tool Calling Lands in vLLM: What the Spaced Tags Broke" (provider article, second-hand): <https://www.orcarouter.ai/blog/deepseek-v4-1-tool-calling-vllm>
25. GitHub CommandCodeAI/command-code issue #909, "deepseek-v4.1-flash tool-calling regression": <https://github.com/CommandCodeAI/command-code/issues/909>
