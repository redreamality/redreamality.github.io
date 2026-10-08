---
title: "Claude Code Usage Limits in 2026: 5-Hour Windows, Weekly Caps, and Cost"
description: "How Claude Code usage is metered in 2026: 5-hour and weekly windows, wind-down, plan vs API credits, Haiku 5.5 subagents, Codex tiers, and a quota checklist."
pubDate: 2026-10-08T16:45:00+08:00
author: "Remy"
tags: ["claude-code", "anthropic", "openai", "agent-harness", "developer-tools"]
lang: "en"
---

Over the past two weeks, several Claude Code quota changes landed at once. On September 26 (Beijing time), Anthropic's developer account announced that when a task hits the 5-hour limit midway, Claude Code will no longer cut off mid-edit; it borrows a small, fixed allowance from your weekly limit and looks for a sensible place to stop.[1][2] On September 29, OpenAI launched a $500 Pro tier at DevDay and cut the $200 tier's Codex allowance from 20x Plus to 10x.[22] On October 7, Anthropic shipped Haiku 5.5, halved Sonnet 5.5's cache-read price, and added a monthly API credit to Max and Team.[9][8]

The questions that follow are always the same: where did my quota go, does `claude -p` count against my subscription, how much does a Haiku subagent save. Instead of a news recap, this post maps the metering: which accounts usage draws from, how two clocks run at once, what happens at the limit, where tokens go, how Codex tiers compare, and a checklist.

Related posts: [Three Costly Habits of Coding Agents](/blog/coding-agents-cost-inefficient-behaviors/) covers arXiv 2609.30725 in full, so here I only take what bears on quota; [Default Hard Budget Caps](/blog/default-hard-budget-caps-agent-deployed-services/) argues that going over a limit should simply stop things; [The Claude Code Extension Stack](/blog/claude-code-extension-stack-mods-plugins/) covers Skills, Hooks, and Subagents; [Agent Harness Patterns](/blog/inside-claude-code-agent-harness/) covers the core loop. Numbers come from the official docs, help center, and primary announcements listed at the end. "Judgment" marks my own view.

## First, separate the accounts

Claude Code doesn't decide what you pay; **the identity you sign in with** does. If an organization mixes sign-in methods, each developer is metered by the one they authenticated with.[3] Per the October 2026 docs:

| Sign-in / billing | Metering | Ceiling | Comes back |
| --- | --- | --- | --- |
| Pro / Max subscription | Included usage, one pool with claude.ai chat | Rolling 5-hour window + weekly limit; some model families have their own | Window reset |
| Subscription + usage credits | Standard API rates past the plan | Your monthly spend limit | Monthly |
| Team / Enterprise seat | Per-seat allowance, shared with chat and Cowork | 5-hour + weekly windows; admins can enable extra usage and set limits | Window reset |
| Console API key | Per token | Workspace spend limits, TPM/RPM rate limits | Pay as you go |
| Bedrock / Agent Platform / Foundry | Per token on your cloud bill | Cloud budget tools | Pay as you go |
| Max / Team monthly API credit (new) | Offsets Claude Platform API calls | Stops when exhausted unless other balance or auto-reload | Each billing cycle |

Easy traps:

- With `ANTHROPIC_API_KEY` set, Claude Code authenticates with that key instead of your subscription, and you pay API rates. The help center calls this out, and the error reference suggests `/status` to confirm the active credential, since a stray key "can route requests through a low-tier key instead of your subscription."[7][4]
- Enterprise isn't all-you-can-eat: $20 per seat per month plus usage at API rates.[6]
- Team Standard seats give more than Pro; Premium seats give 5x more than Standard.[6]

## Two clocks at once: the 5-hour window and the weekly limit

Per the pricing FAQ, every plan has limits that reset on a rolling five-hour window, paid plans add weekly limits, Claude in every app and Claude Code share one pool, and there's no fixed message count. Pro gives at least 5x Free per 5-hour session; Max gives 5x or 20x Pro.[6]

Weekly limits aren't new. On July 28, 2025, Anthropic announced them for Pro and Max from August 28, citing users running Claude Code "continuously in the background, 24/7," plus account sharing and resale, and estimated they'd affect under 5% of subscribers.[19]

One line in the error reference matters most: **usage counts against the session and weekly allowances at the same time**, and one burst such as a large workflow fanout (many parallel agents at once) can exhaust the weekly allowance before the session window resets.[4] There are four limit messages: session, weekly, Opus, Sonnet. The first two are shared across models, so switching doesn't help; the last two cover one family, so `/model` to another family keeps you going.[4] But each model has its own prompt cache, so the request after a switch re-reads the whole conversation with no cache hits.[4][13]

Seeing what's left:

- Warnings such as "You've used 85% of your session limit."[4]
- `/usage` shows plan bars and attributes recent usage to skills, subagents, plugins, and individual MCP servers, flags behaviors above 10% (long context, cache misses), and toggles 24 hours / 7 days with `d` / `w`. It reads only this machine's session history.[3]
- A status line can show `rate_limits.five_hour.used_percentage` and `rate_limits.seven_day.used_percentage`.[17]

Judgment: the 5-hour window sets your pace; the weekly limit is the real budget. The 5-hour window is what usually stops you in the moment, but the weekly limit is what leaves the back half of the week dead. Plan heavy work by the slope of the 7-day view.

## At the limit: wind-down, auto-continue, extra usage

Three layers, in time order.

**Wind-down allowance.** On September 25 (UTC), ClaudeDevs posted that at the 5-hour limit mid-task, Claude Code will try to find a graceful stopping point instead of cutting off mid-edit, using a small, fixed allowance pulled from your weekly limit. The follow-up: Pro gets it once a week; Max and Team Premium get it every time a 5-hour limit is hit; past the wrap-up you can continue with extra usage.[1][2] How big "small" is isn't stated, and I didn't find the mechanism in the docs pages I fetched.

**Auto-continue.** Since v2.1.234, interactive sessions signed in with a claude.ai subscription wait after a limit and resume on their own once it resets; on by default. It prompts Claude to continue rather than resending your message, re-arms at most twice in a row, and still shows permission prompts, so an unattended task can stall on one.[5] It doesn't wait on its own when the reset is over 24 hours away, in background and `-p` runs, or on API keys and cloud providers, which have no window. Turn it off with `autoContinueAtUsageLimit: false`.[5]

**Extra usage.** Pro and Max can enable usage credits at standard API rates with a monthly spend limit; Team and Enterprise admins set limits by org, group, or member.[3][7] A detail few notice: within plan usage the main conversation gets a one-hour cache TTL (how long the cache lives); once you draw on usage credits, Claude Code drops it to five minutes because cache writes are cheaper there.[13] Step away ten minutes during extra usage and your next message likely reprocesses everything.

Judgment: the wind-down is **an advance on your weekly budget**. Max users stop cleanly every time while weekly allowance quietly shifts forward; Pro users get one a week and should save it for genuinely long tasks. Set your own checkpoints (commit after each subtask) rather than relying on the wind-down to leave a clean state.

## What draws on the subscription, and what on API credits

The answer depends on the credential, not the command. From the help center page on monthly API credits:[8]

- Amounts: Max 5x $100/month, Max 20x $200; Team $20 per Standard seat and $100 per Premium seat, pooled, capped at $500. Not Pro or Enterprise. Claimable after seven days on the plan.
- Covered: Messages and Batches API, the Console Playground, Claude Managed Agents, the Claude Agent SDK.
- Not covered: interactive Claude Code (terminal, IDE, desktop, web), extra usage in Claude, Claude Code, or Cowork, and Bedrock, Vertex AI, or Foundry.
- `claude -p`: run with an API key from the linked Console organization, it counts as Agent SDK usage and is covered; signed in with your plan, `claude -p` and the Agent SDK still draw plan limits. Runs from the GitHub Action, IDE extensions, or the desktop app count as Claude Code usage and aren't covered, even with `-p`.
- No rollover; monthly credits are spent before purchased ones; when they run out with no other balance, API requests stop and nothing is charged to your plan.

Simon Willison adds that you can disable auto-reload in the Console so requests stop at zero, which is what you want when burning these credits without billing surprises.[10]

On headless runs (scripted, no interactive UI):

- `claude --bare -p` skips auto-discovery of hooks, skills, plugins, MCP servers, and CLAUDE.md, and **doesn't read your subscription login**; it needs `ANTHROPIC_API_KEY`. The docs recommend `--bare` for scripted and SDK calls and say it will become the `-p` default.[15] That path is API-billed by design.
- `--max-budget-usd` and `--max-turns` are print-mode only. The budget cap uses a client-side estimate and includes subagent spend; at the cap, new subagents fail with `Budget limit reached` and running background subagents stop.[16]
- If your plan bills Fable to usage credits, interactive sessions ask first, but `-p` and Agent SDK apps that don't show the prompt **bill without asking**.[11]

Judgment: run two lanes. Interactive work at the terminal goes on the subscription. Cron, CI, and batch jobs run with `--bare` and a linked-org API key on the monthly credit, with `--max-budget-usd`, auto-reload off, and a workspace spend limit. That is the "stop when over" argument from [Default Hard Budget Caps](/blog/default-hard-budget-caps-agent-deployed-services/), applied to the agent's own tokens.

## Model and effort: the same job can cost tens of times more

Prices (USD per million tokens; cache at the 5-minute TTL):[6][9]

| Model | Cache read | Cache write | Input | Output |
| --- | --- | --- | --- | --- |
| Fable 5.1 | 0.25 | 12.50 | 10 | 50 |
| Opus 5.5 | 0.20 | 5 | 4 | 20 |
| Sonnet 5.5 | 0.10 | 2.50 | 2 | 10 |
| Haiku 5.5 (prompts ≤100K) | 0.01 | 0.125 | 0.10 | 0.50 |
| Haiku 5.5 (prompts >100K) | 0.05 | 0.625 | 0.50 | 2.50 |

Things the docs state that many miss:

- `default` resolves to Opus 5.5 on subscriptions and the API,[11] while the cost docs say Sonnet handles most coding well for less and Opus is for complex architecture and multi-step reasoning.[3] That gap between default and advice drains a lot of quota.
- Opus 5.5, Sonnet 5.5, and Haiku 5.5 default to `medium` effort (levels: low, medium, high, xhigh, max), and **thinking can't be turned off** on them; thinking bills as output.[11][3] The docs warn `max` may show diminishing returns and overthink.[11]
- `opusplan` plans on Opus and executes on Sonnet.[11]
- Fast mode makes Opus up to 2.5x faster at $8/$40 on Opus 5.5, exactly double. Subscribers **pay only via usage credits**; it isn't in plan limits. The first time you enable it in a conversation, the whole context is charged at the uncached fast-mode input rate, so late is expensive.[12]

**Haiku 5.5.** Anthropic positions it for summaries, compaction, classification, and as a coding subagent for Opus and Sonnet 5.5, and says Sonnet and Opus remain better for complex agentic coding: Terminal-Bench 4.0 is 39.2% for Haiku 5.5 versus 70.6% for Sonnet 5.5.[9] It's the first Haiku with adjustable effort and runs with 1M context on the Anthropic API.[9][11] Hidden costs: prompts over 100K cost 5x per token, and Simon Willison measured about 1.25x the tokens of Haiku 4.5 for the same long prompt due to the new tokenizer.[10] Anthropic says the tokenizer effect is already in its "around 75% less on average" figure.[9] Claude Code needs v2.1.293+; the `haiku` alias means Haiku 5.5 on the Anthropic API but Haiku 4.5 on Bedrock, Agent Platform, and Foundry.[11]

**A default worth changing.** The built-in Explore subagent (read-only file search and code exploration) runs on the `opus` alias with a subscription, Console, or gateway.[14] So "dig through the codebase" runs on the priciest everyday model. Fix: define your own `Explore` subagent with `model: haiku`, or set `CLAUDE_CODE_SUBAGENT_MODEL=haiku` plus `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` for all subagents. Subagent requests count toward your limits.[14]

Judgment: a cheap subagent isn't free money. The paper found that half (50.15%) of Claude Code's redundant retrieval was cross-agent: the subagent returns a summary, and the main agent later re-reads the same code itself.[18] With an Opus main agent, that re-read is paid at Opus rates. And a counterexample: with CodeGraph, Haiku 4.5 subagent calls fell to zero and about the same token volume moved to Sonnet 4.6 at 3x the price, raising Claude Code's cost 8.30% (Verified) and 12.19% (Pro).[18] Judge a subagent model by whether its output is usable as-is: have Explore return paths, line numbers, and key snippets, not "auth is in the middleware."

Also: Claude Code's `/compact` sends a summary request with the conversation's own system prompt, tools, and history so it can read the cache.[13] "Haiku as compaction engine" fits agents you build on the API; in a Claude Code Opus session, compaction follows the session model, and swapping in Haiku would forfeit the cache (Judgment, from the documented mechanism).

## Where the tokens go

The cost docs' "why usage climbs in a long session" reads like a leak list:[3]

1. **Long context.** Every request carries the full conversation, and each tool use adds a request. Cached history is re-read at the cached rate, but in an all-day session a one-line question still pays for everything.
2. **Cache misses.** After a break longer than the cache lifetime, the first message reprocesses all context: one hour on a subscription, five minutes on usage credits or by default on API keys and cloud providers.
3. **Scheduled tasks, cross-session messages, goal check-ins.** They fire while idle (up to three idle check-ins per goal), each sending the full context.
4. **Subagents, workflows, teammates.** Each sends its own requests. Agent teams use about 7x the tokens of a normal session in plan mode.
5. **Compaction.** `/compact` reads what it summarizes; `/clear` costs nothing.

A worked example (arithmetic, not measurement): a 300K-token context on Opus 5.5 costs about $0.06 per request at the cache-read rate, so a hundred tool round trips is $6. Sonnet 5.5 is half; Haiku 5.5, in its over-100K tier, is $0.015. If the cache is cold, those 300K tokens are re-charged at the cache-write rate, about $1.50 on Opus 5.5, 25x a warm read. Subscription quota isn't published in tokens, but the docs say re-read history draws usage "at the cached token rate," so the ratios carry over.[3][6]

For scale, enterprise deployments average about $13 per developer per active day and $150–250 per month, with 90% of users under $30 per active day.[3]

**Waste inside trajectories.** The Purdue paper analyzed 1,200 SWE-bench Verified trajectories and found three wastes: re-reading code already read, regenerating near-identical scripts, rerunning tests without changing the patch. Together they hit 79%–98% of tasks and up to 22.75% of task cost; Claude Code (Sonnet 4.6 main, Haiku 4.5 subagents) was leanest at 79.00% of tasks and 6.86% of cost.[18] Two findings matter for quota:

- **Savings get amplified.** Regressing total cost change on flagged-behavior cost change gives slopes of 2.83 (Verified) and 1.33 (Pro): removing a wasted action shortens the trajectory, so later requests re-read less cache.[18]
- **People's high-level principles beat agent-distilled rules.** Seven developer-written principles (state a hypothesis before retrieving, reuse context, save and edit scripts rather than rewrite, rerun tests only after code changes, break loops) cut Claude Code's Verified cost 13.94% and Mini-SWE-Agent with Sonnet 4.6 by up to 41.73%.[18]

Details are in [that post](/blog/coding-agents-cost-inefficient-behaviors/).

## Compared with Codex: tiers, speed multipliers, limit behavior

| | Claude (Anthropic) | Codex (OpenAI) |
| --- | --- | --- |
| Entry tier | Pro, $20/month [6] | Plus, $20/month [20] |
| Higher tiers | Max 5x ($100), Max 20x ($200) [6][8] | Pro $100 / $200 / $500 [20] |
| 5-hour window | All plans [6] | Plus, Standard Business; Pro tiers currently none [20] |
| Weekly limit | Paid plans; numbers unpublished [6] | May apply; numbers unpublished [20] |
| Speed-up | Fast mode: usage credits only, 2x Opus 5.5 rate [12] | Fast: 2.5x included, 2x credits; Astra Ultrafast: 8x included, 6x credits [20][21] |
| At the limit | Wind-down from weekly allowance; Pro once a week [1][2] | Active turn may finish, subject to fair use [20] |
| Bundled API credit | Max/Team, $100–500/month [8] | No official page found |

On the OpenAI side, Plus's estimated local messages per five hours are 5–45 for GPT-6 Astra, 15–160 for GPT-6.1 Sol, and 350–3,000 for GPT-6 Luna, explicitly estimates rather than limits.[20] Ultrafast is only on Pro $500 and eligible Enterprise and Edu, generates tokens up to 8x faster, uses included usage before credits, and can't be bought onto other self-serve plans.[21] Per TNW, from October 30 Pro 200's Work and Codex usage falls from 20x to 10x Plus; existing subscribers keep old limits through October 29 plus a one-time $2,500 credit grant; OpenAI won't bring back Pro 200's five-hour limit.[22]

Theo's (t3.gg) video description says Ultrafast can make your weekly limit disappear in 2 hours.[23] That's his claim; I didn't watch the video and can't check it. At 8x, two Ultrafast hours equal sixteen standard hours, a plausible order of magnitude (Judgment).

Simon Willison notes OpenAI still lets you use a Codex subscription for personal API use, a better deal for heavy API users, and that Anthropic's credit narrows the gap.[10] I found no official OpenAI page on this, so it's his view.

Judgment: with no published weekly caps, "agent hours per dollar" can't be compared; mechanisms can. Anthropic keeps speed **outside** the allowance (fast mode is paid separately); OpenAI keeps it **inside** at a multiplier. The first keeps the bill legible but costs subscribers extra to go faster; the second is convenient, but one toggle makes your week drain 8x faster. At the limit, OpenAI finishes the current turn; Anthropic spends a fixed slice of the weekly allowance to wrap up. Both address the same problem: a long-running agent shouldn't die halfway through writing a file.

## Checklist: stretch quota, cap spend

**Know your account**

- `/status`: subscription or API key? If you don't mean to pay per token, unset `ANTHROPIC_API_KEY`.[4][7]
- Weekly, read `/usage`'s 7-day view; fix whatever is flagged first.[3]
- Put `five_hour` and `seven_day` in your status line.[17]

**Context hygiene**

- `/clear` (free) between unrelated tasks; `/compact` with instructions only when you need continuity, e.g. `/compact Focus on code samples and API usage`; `/rewind` to abandon a path, since it lands on an already-cached prefix.[3][13]
- CLAUDE.md under 200 lines; move on-demand workflows to skills.[3]
- Disable unused MCP servers; prefer CLIs like `gh` and `aws`.[3]
- A PreToolUse hook to keep only failing test lines; language server plugins so "go to definition" replaces grep-and-read.[3]

**Model and effort**

- Choose model and effort at session start; switching invalidates the cache.[13]
- Sonnet 5.5 for daily coding, Opus for architecture and hard problems, or `opusplan`; start at `medium`, test `max` before adopting it.[3][11]
- Fast mode only when latency really matters, and from the start.[12]

**Subagents**

- An `Explore` with `model: haiku` that returns paths, line numbers, and snippets.[14][18]
- Haiku 5.5 prompts over 100K cost 5x per token.[9]
- Small agent teams; shut teammates down when done.[3]

**Headless and scheduled**

- Cron and CI on `--bare` with a linked-org key and the monthly credit, plus `--max-budget-usd`, `--max-turns`, auto-reload off, a workspace spend limit.[8][15][16][10]
- Kill idle burners you don't need: `crossSessionInbound` to `hold`, `CLAUDE_CODE_GOAL_CHECKIN_MINUTES` to `0`.[3]
- No credit-billed Fable in `-p`; it won't ask.[11]

**At the limit**

- Split long tasks into independently committable chunks so the wind-down lands on a checkpoint.[1]
- Unattended and no auto-resume wanted: turn off `autoContinueAtUsageLimit`.[5]
- With usage credits on, set a monthly cap and remember the five-minute cache.[3][13]
- Admins: `modelPricing` for contracted-rate reporting; OpenTelemetry for real-time per-user attribution.[3]

## What I couldn't find or verify

- The wind-down allowance's size, and whether Team Standard gets it: not in the posts or the docs pages I fetched.
- Neither company publishes weekly caps. TechCrunch's 2025 hour estimates were for the Sonnet 4 / Opus 4 era and don't apply now.[19]
- OpenAI's Pro tiers help page returned 403 to my fetches; Pro 200 details come from TNW and OpenAI's developer docs.[22][20]
- Theo's "gone in 2 hours" comes only from the video description.[23]
- `/usage` and `--max-budget-usd` are client-side estimates; the authoritative bill is the Console or claude.ai usage page.[3][16]

## References

1. ClaudeDevs (X), post on graceful wind-down at the 5-hour limit, 2026-09-25 (UTC): <https://x.com/ClaudeDevs/status/2103561342057943314>
2. ClaudeDevs (X), follow-up on plan eligibility, 2026-09-25 (UTC): <https://x.com/ClaudeDevs/status/2103561343391735842>; IT Home (Chinese) report, 2026-09-26: <https://www.ithome.com/1/007/369.htm>
3. Anthropic, Claude Code Docs, "Manage costs effectively": <https://code.claude.com/docs/en/costs>
4. Anthropic, Claude Code Docs, "Error reference" (Usage limits): <https://code.claude.com/docs/en/errors>
5. Anthropic, Claude Code Docs, "Interactive mode" (Wait for a usage limit to reset): <https://code.claude.com/docs/en/interactive-mode>
6. Anthropic, "Pricing" (plans, FAQ, and model prices): <https://claude.com/pricing>
7. Claude Help Center, "Use Claude Code with your Pro or Max plan": <https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan>
8. Claude Help Center, "Monthly API credits for Max and Team plans": <https://support.claude.com/en/articles/17154008-monthly-api-credits-for-max-and-team-plans>
9. Anthropic, "Introducing Claude Haiku 5.5," 2026-10-07: <https://www.anthropic.com/claude-haiku-5-5>
10. Simon Willison, "Claude Haiku 5.5," 2026-10-07: <https://simonwillison.net/2026/Oct/7/claude-haiku-5-5/>
11. Anthropic, Claude Code Docs, "Model configuration": <https://code.claude.com/docs/en/model-config>
12. Anthropic, Claude Code Docs, "Speed up responses with fast mode": <https://code.claude.com/docs/en/fast-mode>
13. Anthropic, Claude Code Docs, "How Claude Code uses prompt caching": <https://code.claude.com/docs/en/prompt-caching>
14. Anthropic, Claude Code Docs, "Create custom subagents": <https://code.claude.com/docs/en/sub-agents>
15. Anthropic, Claude Code Docs, "Run Claude Code programmatically": <https://code.claude.com/docs/en/headless>
16. Anthropic, Claude Code Docs, "CLI reference": <https://code.claude.com/docs/en/cli-reference>
17. Anthropic, Claude Code Docs, "Customize your status line": <https://code.claude.com/docs/en/statusline>
18. Hu et al., "Analyzing and Mitigating Cost-Inefficient Behaviors in Coding Agents," arXiv:2609.30725: <https://arxiv.org/abs/2609.30725>
19. Maxwell Zeff, TechCrunch, "Anthropic unveils new rate limits to curb Claude Code power users," 2025-07-28: <https://techcrunch.com/2025/07/28/anthropic-unveils-new-rate-limits-to-curb-claude-code-power-users/>
20. OpenAI, Codex docs, "Pricing": <https://learn.chatgpt.com/docs/pricing>
21. OpenAI, Codex docs, "Speed": <https://learn.chatgpt.com/docs/agent-configuration/speed>
22. TNW, "OpenAI halves Pro 200 usage and launches a $500 ChatGPT plan at DevDay," 2026-09-29: <https://thenextweb.com/news/openai-devday-pro-200-usage-cut-pro-500-plan>
23. Theo (t3.gg), YouTube, "Does the $200 Codex plan suck now?", 2026-10-07 (PT): <https://www.youtube.com/watch?v=nYA0yASgaZI>
