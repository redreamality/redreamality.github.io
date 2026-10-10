---
title: "When Claude Haiku 5.5 Actually Saves Money as a Subagent or Compaction Engine: A Cost Model You Can Run Yourself"
description: "Haiku 5.5 lists at USD 0.10/0.50 per million tokens, but any prompt over 100K tokens bills the whole request at 5x, and the new tokenizer, on-by-default thinking, and cache rules all move the bill. Per-request formulas, three worked examples, the 12x-vs-GPT-6-Luna counter-case, and an acceptance checklist."
pubDate: 2026-10-10T16:40:00+08:00
author: "Remy"
tags: ["claude", "claude-code", "ai-agents", "agent-harness", "llm"]
lang: "en"
---

On October 7, Anthropic released Claude Haiku 5.5. The headline line on the price sheet is \$0.10 input and \$0.50 output per million tokens, 90% cheaper than Haiku 4.5, and the positioning is explicit: summaries, context compaction, classification, and acting as a coding subagent under Opus 5.5 and Sonnet 5.5. [1] The same day, Sonnet 5.5's cache-read price was halved and Max and Team subscriptions gained a monthly API credit. [1]

This is not a release recap. The practical question: **when you put a cheap small model under Opus or Sonnet as a subagent or compaction engine, when does it actually save money, and when does it cost more?** The answer lies not in the list price but in four billing rules, three workload shapes, and how the orchestrator digests what the small model hands back. Below: the rules, the formulas, three worked examples, and an acceptance checklist for your own workload.

Related on this site: [How Claude Code usage limits work](/blog/claude-code-usage-limits-cost-2026/) covers which account usage draws from; this post covers only per-token billing. [Choosing Sonnet 5.5](/blog/claude-sonnet-5-5-agentic-coding-midtier/) and [Opus 5.5 price and performance](/blog/claude-opus-5-5-price-and-performance/) cover the tiers above. [Three cost-inefficient habits of coding agents](/blog/coding-agents-cost-inefficient-behaviors/) covers the main agent re-reading what a subagent already read. [Default hard budget caps](/blog/default-hard-budget-caps-agent-deployed-services/) argues overspend should stop, not warn. Worked examples are my arithmetic from published price sheets, not measurements; "judgment" marks my opinion.

## Four rules that change the bill

### Rule 1: Two price tiers by prompt length, and the whole request moves

Official prices (USD per million tokens, 5-minute cache): [1][2]

| Model | Cache read | Cache write | Input | Output |
| --- | --- | --- | --- | --- |
| Haiku 5.5 (prompt ≤100K tokens) | 0.01 | 0.125 | 0.10 | 0.50 |
| Haiku 5.5 (prompt >100K tokens) | 0.05 | 0.625 | 0.50 | 2.50 |
| Haiku 4.5 | 0.10 | 1.25 | 1.00 | 5.00 |
| Sonnet 5.5 | 0.10 | 2.50 | 2.00 | 10.00 |
| Opus 5.5 | 0.20 | 5.00 | 4.00 | 20.00 |

The pricing docs are precise: the prompt length that decides the tier **includes cache reads and writes**; each request is priced on its own; a request over the line pays the higher prices even if most of it is a cache hit; earlier requests keep their prices. [2] It is a cliff, not a ramp: between token 99,999 and 100,001, that request's output price jumps from \$0.50 to \$2.50.

Opus 5.5 and Sonnet 5.5 have no such line. [2] Anthropic's footnote justifies the cutoff: about 90% of Haiku 4.5 requests were under 100K. [1] HN commenters noted that nobody ran agents on Haiku 4.5, so that 90% describes old usage, not new. [11]

For reference, OpenAI's GPT-6 Luna also lists at \$0.10 / \$0.50 with \$0.01 cache reads; its line is at 272K input tokens, above which the full request pays 2x input and cache and 1.5x output. [13] Simon Willison's summary: within 100K the two cost the same; beyond it, Luna is much cheaper. [10]

### Rule 2: A new tokenizer counts the same text as more tokens

Haiku 5.5 uses the tokenizer of Claude 4.7 and later. The docs say the same text yields about 30% more tokens than on Haiku 4.5, depending on content; [3][4] Simon Willison measured one long prompt at about 1.25x. [10]

Easy to confuse: the extra 30% is **relative to Haiku 4.5**. Haiku 5.5's tokenizer matches Opus 5.5's and Sonnet 5.5's, so moving a subtask from Sonnet 5.5 to Haiku 5.5 leaves token counts roughly unchanged. [1] Three groups are affected:

- **Migrating from Haiku 4.5.** Your old "80K tokens" may become just over 100K, right across the line; at 1.3x, the 100K line equals only about 77K old tokens. The migration guide says to recompute `max_tokens`, context budgets, and cost estimates, including long-prompt prices. [4]
- **Real price of the same text.** Short prompts: 0.10 × 1.3 ≈ 0.13, about 87% below Haiku 4.5's 1.00; long prompts: 0.50 × 1.3 ≈ 0.65, only about 35% below (arithmetic).
- **Cross-vendor comparisons.** Claude and GPT tokens aren't comparable units. One HN commenter estimates Claude's 100K tokens ≈ 60–65K GPT tokens; another posted that the same classification batch counted about 11.89M input tokens on Haiku 5.5 versus 7.90M on Luna, roughly 1.5x. [11] These are community numbers, so I use them only as a sensitivity range.

### Rule 3: Thinking is on by default, and it bills as output

Haiku 5.5 is the first Haiku with effort levels (low, medium, high, xhigh, max). The API default is `medium`, and adaptive thinking (the model decides per step whether and how much to think) is on by default. [1][3] For the bill:

- **Thinking tokens bill as output** and count toward `max_tokens`; set it too low and a response can stop after thinking, with no answer. [3]
- **Turning it off depends on where.** On the API, at `high` effort or below, `thinking: {"type": "disabled"}` works, though the docs prefer effort as the lever. [3] In Claude Code it doesn't: for Opus 5.5, Sonnet 5.5, Haiku 5.5, and Fable the docs say "Thinking can't be turned off", and `MAX_THINKING_TOKENS=0` has no effect. [5] Simon, via his llm plugin, also reports reasoning can't be disabled and defaults to medium. [10]
- **Earlier thinking blocks stay in context.** Haiku 4.5 kept only the latest turn's; Haiku 5.5 keeps all and counts them as input, so multi-turn input grows beyond the tokenizer effect; the docs suggest thinking block clearing. [3] This matters for multi-turn subagents; the examples below assume old blocks are cleared.
- **Effort spreads cost widely.** On the same pelican SVG prompt, Simon's `low` run cost 0.0936 cents in 7 seconds; `max` cost 3.3826 cents in 5 minutes 9 seconds, about 36x. [10]

### Rule 4: Caching, and the same-day Sonnet 5.5 cut

Haiku 5.5 cache reads are a tenth of input (\$0.01 / \$0.05), and the minimum cacheable prompt drops from 4,096 tokens to 512. [2][3] The same day, Sonnet 5.5's cache read fell from \$0.20 to \$0.10, which Anthropic says makes it about 20% cheaper on most agentic work. [1] That cut looks unrelated, but it directly weakens the case for Haiku as a compaction engine, as Example 1 shows.

## What the official benchmarks do and don't tell you

The three rows from Anthropic's launch page most relevant to subagent work (the GPT-6 Luna column is Anthropic-reported): [1]

| Benchmark | Haiku 5.5 | Haiku 4.5 | GPT-6 Luna | Sonnet 5.5 |
| --- | --- | --- | --- | --- |
| Terminal-Bench 4.0 | 39.2% | 0.0% | 16.4% | 70.6% |
| OSWorld 2.1 (offline subset) | 72.4% | 15.7% | 48.9% | 83.9% |
| FrontierCode 1.1 (Main) | 46.4% | — | 42.4% | 52.1% (xhigh) |

Anthropic draws its own boundary: Sonnet 5.5 and Opus 5.5 remain better for complex agentic coding; Haiku 5.5 suits narrowly scoped tasks once too costly on Claude, like compaction, summarization, or subagent work. [1]

Independently, Artificial Analysis at max effort measured an Intelligence Index of 43 for Haiku 5.5 versus 38 for Luna, and Terminal-Bench 4.0 at 33% versus 13%. But cost per task was \$0.21 versus \$0.07, with about 162K versus 50K output tokens per task (129K versus 39K of it reasoning). [12] Same price per token is not same price per task. Developers Digest reports that AA's costs didn't yet include the over-100K tier; if so, the long-task gap is wider (unverified). [15]

## Writing the bill as formulas

Cost of one request:

```text
C_req = L_cr × p_cr + L_cw × p_cw + L_in × p_in + (O_ans + O_think) × p_out
Tier: L = L_cr + L_cw + L_in; on Haiku 5.5, if L > 100,000, all four prices switch to the upper tier
```

An agent loop (turn i reads the previous prefix from cache and writes the new tool results plus the previous output):

```text
C_loop = Σ_i C_req(i),  L_i = L_(i-1) + r_i + o_(i-1)
```

With subagents in the picture, the real total has three terms:

```text
C_total = Σ C_sub                                   # each subagent's own requests
        + N × R × p_cw(main) + N × R × p_cr(main) × M   # returned reports written into the main context, then re-read for M more turns
        + f × X × (p_cw(main) + p_cr(main) × M')        # share f of cases where the main agent re-reads X tokens itself
```

The last two terms are priced at the orchestrator's rates; the cheaper the subagent, the larger their share. The examples below use these formulas; the script is in the handoff folder for rerunning with your parameters.

## Example 1: Compacting a 400K-token session

A main session has grown to 400K tokens and needs compacting. Summary 8,000 tokens plus 4,000 of thinking (assumed): 12K output.

| Approach | Arithmetic | Cost (USD) |
| --- | --- | --- |
| Sonnet 5.5 compacts itself, cache warm | 400K × 0.10 + 12K × 10 | 0.16 |
| Opus 5.5 compacts itself, cache warm | 400K × 0.20 + 12K × 20 | 0.32 |
| Sonnet 5.5, cache expired | 400K × 2 + 12K × 10 | 0.92 |
| Opus 5.5, cache expired | 400K × 4 + 12K × 20 | 1.84 |
| Haiku 5.5 reads it all at once (over the line, upper tier) | 400K × 0.50 + 12K × 2.50 | 0.23 |
| Haiku 5.5 in 5 chunks of 82K, then merge | 5 × (82K × 0.10 + 5,000 × 0.50) + merge | 0.061 |
| Reference: GPT-6 Luna at once (over its 272K line) | 400K × 0.20 + 12K × 0.75 | 0.089 |

(Each chunk outputs 5,000 = 3,000 summary + 2,000 thinking; the merge reads 17K and outputs 12K.)

Takeaways:

1. **With a warm cache, one-shot Haiku costs more than Sonnet 5.5.** Haiku's upper-tier input is \$0.50, five times Sonnet's \$0.10 cache read. Solving directly: Haiku's upper tier beats warm Sonnet only if output O > 0.053 × input N, i.e., over about 21K tokens for 400K input. Against warm Opus 5.5 it is O > 0.017 × N, about 6,900 tokens, so Haiku usually wins there.
2. **Haiku clearly wins once the cache is cold.** Resume a session next morning and Sonnet re-reads 400K at full price; one-shot Haiku costs a quarter of that.
3. **Chunking is what's actually cheap.** Keep chunks under 100K and the total is about \$0.06, roughly 38% of warm Sonnet. The price is quality risk: cross-chunk references (an interface defined early, changed later) can get lost, so replay-test on your own sessions.

Be clear about the tool. Claude Code's `/compact` sends a summarization request with the conversation's own system prompt, tools, and history, precisely to read the existing cache; [7] the docs show no setting to compact on a different model. So "Haiku as compaction engine" mainly applies to your own API harness; in a Claude Code Opus session, compaction follows the session model (judgment, from the docs). Conversely, running Haiku 5.5 as the main model in Claude Code, it auto-compacts at about 967K by default, and `/autocompact` goes no lower than 100K; [5] even then, the compaction request itself is slightly over 100K and bills at the upper tier (judgment).

## Example 2: One subagent, three shapes

Setup: each turn reads the previous prefix from cache and writes new tool results plus the previous output (5-minute cache write); old thinking blocks cleared. Three shapes:

- **A, short task**: 15K starting prompt (system prompt, tool definitions, task brief), 12 turns, each adding 4,000 tokens of tool results and 800 output (thinking included). Final prompt 67.8K.
- **B, re-read heavy**: same start and turn count, but each turn reads 10K tokens of files or logs. Final prompt 133.8K; crosses the line at turn 9.
- **C, long task**: 20K start, 30 turns, each adding 5,000 and outputting 1,000. Final prompt 194K; crosses at turn 15.

| Shape | Haiku 5.5 | Sonnet 5.5 | Opus 5.5 | GPT-6 Luna | Haiku 5.5, tokens ×1.3 |
| --- | --- | --- | --- | --- | --- |
| A short | 0.018 | 0.31 | 0.62 | 0.018 | 0.023 |
| B re-read heavy | 0.074 | 0.51 | 1.01 | 0.029 | 0.12 (crosses at turn 7) |
| C long | 0.24 | 1.09 | 2.17 | 0.069 | 0.36 (crosses at turn 11) |

(USD. The Luna column assumes both vendors count tokens identically; in practice Claude may count more, see Rule 2. The last column simulates a shape that was measured with Haiku 4.5's or another vendor's token counts.)

How to read it:

- **Against Opus or Sonnet subagents, Haiku 5.5 almost always saves money**: about 35x cheaper than Opus and 17x cheaper than Sonnet on the short task. Even over the line, its \$0.05 cache read is half Sonnet's and its \$2.50 output a quarter. Here the 100K line only changes how much you save.
- **Against Luna, it's a tie under the line; above it, Luna is 2.5–3.5x cheaper.** In shape C Luna never leaves its base tier, while Haiku spends the second half in the upper one.
- **The 1.3x tokenizer factor is amplified near the line.** In shape B, 30% more tokens cost 65% more, because the crossing comes two turns earlier.

## Example 3: An 8-way fan-out, and where the money goes

The main agent is Opus 5.5. It fans out 8 shape-A research subagents sharing one system prompt (the first writes the cache and I assume the other seven read it; if all fire at once, later ones may miss it, judgment). Each returns a 2,000-token report, and the main agent runs 20 more turns.

| Subagent model | Subagents total | Cost of reports in Opus context | Total |
| --- | --- | --- | --- |
| Haiku 5.5 | 0.13 | 0.14 | 0.27 |
| Sonnet 5.5 | 2.22 | 0.14 | 2.36 |
| Opus 5.5 (inherited) | 4.43 | 0.14 | 4.57 |

Report cost = 8 × 2,000 × 5 (write) + 8 × 2,000 × 0.20 × 20 (re-read on each later turn), per million tokens.

Two conclusions. First, **the big saving is not Haiku versus Luna but Haiku versus the inherited Opus**: \$4.57 drops to \$0.27. Second, **once subagents are this cheap, digesting their reports costs the orchestrator more than the subagents cost**: \$0.14 in Opus's context versus \$0.13 for all eight Haiku runs. And if a report only says "auth logic is in the middleware", forcing the main agent to re-read 30K tokens itself, the write plus 15 turns of re-reads is about \$0.24, more than all eight subagents.

With an expensive orchestrator, savings often hinge less on the small model's unit price than on **whether its handback is directly usable by the main agent**: file paths, line numbers, key snippets, open questions, not a one-line verdict. That is where Claude Code's cross-agent duplicate retrieval came from in the [paper we covered](/blog/coding-agents-cost-inefficient-behaviors/).

## Break-even: how much rework a small model can absorb

The three examples combine into one inequality. A run on the candidate costs C_small; thinking or counting more, it uses k times the baseline tokens; a share f_retry must be redone, and a share f_fix needs the main agent to step in at C_fix each. Replacing the current approach C_base saves money when:

```text
C_small × k × (1 + f_retry) + f_fix × C_fix < C_base
```

Plug in shape A. Against the inherited Opus (C_base = 0.62): even with doubled tokens (k = 2) and 30% retries, the first term is about 0.047, leaving about \$0.57 of headroom, more than two rescues at 0.24 each. Against an expensive default, a small model must fail broadly to lose money.

Against same-priced Luna (C_base = 0.018) it flips: any k above 1, or a little rework, and Haiku loses. Then pass rate and token volume on your task decide, not benchmark scores.

That suggests a rough routing table (judgment):

| Task shape | Consider first | Why |
| --- | --- | --- |
| Lookup / code-reading subagent in a Claude harness, prompts stable under 100K | Haiku 5.5 | An order of magnitude cheaper than inherited Opus; same API and tool format as the main model |
| Long tasks that re-read large files and grow past 100K | A model without a length line, or chunk first | Past the line the whole request bills 5x |
| Compacting a session whose cache is still warm | Let the main model compact | A warm cache read is cheaper than Haiku's upper-tier input |
| Compacting a cold session, or an Opus main session | Haiku 5.5, chunked | Avoids full-price re-reads and the upper tier |
| Classification, titling, extraction | Compare Haiku at low against same-priced models on your data | Between same-priced rivals, only pass rate and token volume matter |
| Coding that needs multi-step judgment | Sonnet 5.5 / Opus 5.5 | Anthropic draws the same line |

## Claude Code defaults: subagents do not default to Haiku

A common claim is that "Claude Code made Haiku the default subagent model in v2.1.293." That's not accurate. The v2.1.293 changelog says Haiku 5.5 is now **the default Haiku model** on the Anthropic API, i.e., the `haiku` alias points to it; [8] the model docs say Haiku 5.5 requires v2.1.293 or later. [5]

A subagent's model resolves in this order: per-invocation `model` parameter → the definition's `model` field → `CLAUDE_CODE_SUBAGENT_MODEL` → the main conversation's model. [6] Built-in Explore and Plan use the main model, as does general-purpose unless the variable is set; only claude-code-guide, which answers Claude Code questions, runs on Haiku. [6] And `default` resolves to Opus 5.5 on Pro, Max, Team, Enterprise, and the API. [5] An HN commenter made the same point: subagents inherit the parent model unless told otherwise. [11]

Three ways to change it: [6]

- Put `model: haiku` in the subagent definition; to switch Explore too, define a user or project subagent named `Explore` that overrides the built-in.
- Set `CLAUDE_CODE_SUBAGENT_MODEL=haiku`. It is only a default, so definitions with their own `model` still win; to force every subagent onto it, also set `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1`.
- A subagent definition can also set `effort` to give it its own thinking level.

Two more details: subagents inherit the main conversation's thinking configuration, and the `haiku` alias still points to Haiku 4.5 on Bedrock, Google Cloud's Agent Platform, Foundry, and Claude Platform on AWS. [5][6]

## Counter-cases: where it doesn't save money

**1. "12x more than Luna."** An r/ClaudeAI post compared the two on the same voxel pagoda build. Haiku 5.5 at xhigh used 268.8M input tokens (262.7M of them cache reads) and 4.46M output, for \$24.96; Luna cost about \$1.91–\$1.96. [14][15][16] I couldn't fetch the Reddit post; the figures come from two secondary write-ups. Back-solving from the price sheet: all requests under 100K would cost 262.7M × 0.01 + 6.1M × 0.10 + 4.46M × 0.50 ≈ \$5.47; all in the upper tier, ≈ \$27.34. \$24.96 sits near the ceiling, so the session crossed the line early. Two factors: in the lower tier the same tokens would still cost about 2.9x Luna (token volume); crossing the line multiplied that by about 4.6x. It's one creative task at xhigh, not the default medium, so not a general ratio, but it shows both risks stacked clearly.

**2. Per task, Luna is leaner.** Besides AA's \$0.21 versus \$0.07, Plotly posted a data-analysis benchmark on HN: 40 questions cost \$0.38 on Haiku 5.5 versus \$15 on Opus 5.5, but GPT-6 Luna scored slightly better at about 30% of Haiku's cost. [11]

**3. Prompts tuned for the old model can regress.** One HN user reported low-latency tasks tuned for Haiku 4.5 got worse and slower on 5.5, with prompt leakage; raising effort helped but cost speed. [11] Not a general finding, but migration needs re-evaluation, not just a model ID swap.

**4. A DeepSeek counter-example (a sample only, not expanded).** On r/LocalLLaMA, a developer compared Haiku 5.5 with the DeepSeek V4.1 Flash he runs in production on two of his own jobs, judged blind by Opus with orders reversed, one run per setup. [17][18] On a research subagent (web search, page reading, sourced reports), Haiku at low was about 4x cheaper (\$0.09 versus \$0.35) and faster, but lost the same two briefs every time; one required opening the brand's own guideline page for exact HEX / Pantone colors, which Haiku never found, even at high effort with 60 tool calls. On chat titling (52 messages, thinking off), DeepSeek won 28, Haiku 8, with 9 splits and 7 identical; Haiku often answered the message instead of titling it, and one prompt-injection test message literally became the title. [18] I couldn't fetch the original; this comes from a summary. I take two lessons only: a research subagent's costliest failure is not opening the primary source, and rework eats a low unit price; and the simplest-looking jobs, titling and classification, really test instruction following and injection resistance, so test them on your own data.

## The subscription API credit: free money still needs a cap

Starting this week, Max 5x gets \$100 a month and Max 20x \$200; Team gets \$20 per Standard seat and \$100 per Premium seat, pooled and capped at \$500. [9] The credit covers the Messages API, Batches API, Console Playground, Managed Agents, and the Agent SDK; it doesn't cover interactive Claude Code or any extra usage. It doesn't roll over, it's spent before credits you bought, and when the organization has no other balance, API requests simply stop and nothing is charged to the subscription. [9]

Two things matter here. First, the credit belongs to the linked Console organization and every API key in it draws from it, [9] so a third-party harness using that organization's key can spend it. The page doesn't name third-party harnesses; this follows from "every API key" (judgment; HN commenters read it the same way [11]). Second, Simon notes you can disable auto-reload so requests stop when the balance runs out, with no billing surprise. [10] For subagent experiments, that's a ready-made [hard budget cap](/blog/default-hard-budget-caps-agent-deployed-services/). Teams should also set workspace spend limits per project in the Console, [9] the same spend-governance idea as in the [Gemini Enterprise piece](/blog/gemini-enterprise-agent-identity-audit-spend-caps/).

Rough numbers from Example 2: \$100 covers about 5,700 shape-A Haiku subagent runs, or about 415 shape-C runs (worked arithmetic). That's more than a 10x difference: the longer task accounts for about 4x, and crossing the line in its second half for another 3.5x.

## Acceptance checklist: measure your own workload

**1. Split the token bill by subagent**

- For every request, log `input_tokens`, `cache_read_input_tokens`, `cache_creation_input_tokens`, and `output_tokens`, and compute total prompt length L. Track the share of requests with L over 100K and the share of spend they account for.
- Recount representative prompts with the token counting endpoint on `claude-haiku-5-5`; don't reuse Haiku 4.5 or other vendors' counts. [2][4]
- In Claude Code, check the subagent share in `/usage`; in scripts, use `modelUsage` from `--output-format json` to confirm which model each subagent actually ran on. [5][19]

**2. Sweep effort; don't keep the default**

- On your own sample set, run low / medium / high and record cost per completed task and pass rate, not price per million tokens.
- For classification, routing, and titling on the API, try disabling thinking at high or below; for multi-turn subagents, enable clearing of old thinking blocks. [3]
- Leave room in `max_tokens` for thinking; check for empty and truncated replies, and don't treat HTTP 200 as task completion. [3]

**3. Evaluate the failure modes**

- Compare candidates with blind judging, and include items like "must open the primary source", "classify only, don't answer", and "contains injected text".
- Measure the main agent's **re-read rate**: how many files the subagent read does the main agent read again? A high rate makes the cheap subagent a false saving.
- If migrating from Haiku 4.5, remove `temperature`, `top_p`, `top_k`, and assistant prefill, or requests will error. [3]

**4. Caching and length control**

- Watch cache hit rate; keep the system prompt and tool definitions in a stable prefix, cacheable from 512 tokens. [3]
- Put a context ceiling on subagents: compact or restart near 100K, or route jobs that will clearly run long to a model without that line.
- Time compaction: with a warm cache, let the main model compact; with a cold cache or an Opus main model, consider handing it to Haiku, preferably chunked.

**5. Budget caps**

- Set workspace spend limits in the Console and turn off auto-reload; add `--max-budget-usd` and `--max-turns` to headless runs. [9][10][19]
- Pin `model` and `effort` in every subagent definition, so it doesn't inherit the main session's Opus and high effort. [6]

My closing judgment: Haiku 5.5's biggest value isn't beating Luna on price; it's a usable replacement for the most expensive default, "subagents inherit Opus". That holds if you hold three lines: prompts under 100K, effort not raised by default, and reports good enough that the main agent needn't re-read.

## References

1. Anthropic, "Introducing Claude Haiku 5.5," 2026-10-07: <https://www.anthropic.com/claude-haiku-5-5>
2. Claude Platform Docs, "Pricing" (incl. Long context pricing, Prompt caching, tokenizer note): <https://platform.claude.com/docs/en/about-claude/pricing>
3. Claude Platform Docs, "What's new in Claude Haiku 5.5": <https://platform.claude.com/docs/en/models/haiku-5-5/whats-new-haiku-5-5>
4. Claude Platform Docs, "Claude Haiku 5.5 migration guide": <https://platform.claude.com/docs/en/models/haiku-5-5/migration-guide>
5. Claude Code Docs, "Model configuration": <https://code.claude.com/docs/en/model-config>
6. Claude Code Docs, "Create custom subagents": <https://code.claude.com/docs/en/sub-agents>
7. Claude Code Docs, "How Claude Code uses prompt caching": <https://code.claude.com/docs/en/prompt-caching>
8. Anthropic, Claude Code CHANGELOG, 2.1.293: <https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md>
9. Claude Help Center, "Monthly API credits for Max and Team plans": <https://support.claude.com/en/articles/17154008-monthly-api-credits-for-max-and-team-plans>
10. Simon Willison, "Claude Haiku 5.5," 2026-10-07: <https://simonwillison.net/2026/Oct/7/claude-haiku-5-5/>
11. Hacker News, "Claude Haiku 5.5" thread: <https://news.ycombinator.com/item?id=49996437>
12. Artificial Analysis, "Claude Haiku 5.5 (Max) vs GPT-6 Luna (Max)": <https://artificialanalysis.ai/models/comparisons/claude-haiku-5-5-vs-gpt-6-luna>
13. OpenAI, "GPT-6 Luna" model page: <https://developers.openai.com/api/docs/models/gpt-6-luna>
14. Reddit r/ClaudeAI, "Claude Haiku 5.5 cost 12x more than GPT-6 Luna for the same voxel pagoda" (fetch blocked; not read directly): <https://www.reddit.com/r/ClaudeAI/comments/1x0agoh/claude_haiku_55_cost_12x_more_than_gpt6_luna_for/>
15. Developers Digest, "Cheapest Subagent Model: Haiku 5.5 or GPT-6 Luna?", 2026-10-09: <https://www.developersdigest.tech/blog/haiku-5-5-vs-gpt-6-luna-subagent>
16. AGI Hunt, summary of [14], 2026-10-08: <https://agihunt.info/en/p/1a118a139ad82bd20233f8d9ba5>
17. Reddit r/LocalLLaMA, "DeepSeek V4.1 Flash beat Haiku 5.5 as my research subagent" (fetch blocked; not read directly): <https://www.reddit.com/r/LocalLLaMA/comments/1x0ixh6/deepseek_v41_flash_beat_haiku_55_as_my_research/>
18. AGI Hunt, summary of [17], 2026-10-08: <https://agihunt.info/en/p/1a11a0e6c533ec9285bf32c2e73>
19. Claude Code Docs, "Manage costs effectively": <https://code.claude.com/docs/en/costs>
